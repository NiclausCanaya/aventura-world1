/**
 * ============================================================================
 * AVENTURA EN BARCELONA HD - Mapa General (Overworld Map) estilo Super Mario World
 * ============================================================================
 * Contiene:
 * - WorldProgress: guardado de ciudades desbloqueadas / completadas / niveles
 *   alcanzados en localStorage (con respaldo en memoria si no hay storage).
 * - MapScreen: escena del mapa con jerarquía de 2 niveles:
 *     * Nivel 1: Mapa Mundi (España disponible, América del Sur "???" bloqueada)
 *     * Nivel 2: Mapa de España (Barcelona -> Madrid -> Palma de Mallorca)
 *   Incluye zoom Mundi <-> España, animación del camino de puntitos, efecto
 *   'Unlock' del nodo, y a la Tina en miniatura como cursor que camina por el
 *   camino punteado (teclado, joystick táctil o toque directo sobre un nodo).
 */
(function (global) {
  'use strict';

  const W = 960;
  const H = 540;
  const SLOT_STORAGE_KEYS = {
    1: 'aventura_world_slot_1',
    2: 'aventura_world_slot_2',
    3: 'aventura_world_slot_3'
  };
  const DOT_SPACING = 13; // separación entre puntitos del camino (px lógicos)
  const WALK_SPEED = 135; // velocidad de la Tina por el camino (px/s)
  const DOTS_PER_SECOND = 24; // velocidad de dibujado del camino en la animación
  const MAP_SNAP_RADIUS = 24; // radio magnético (imán) alrededor de cada nodo desbloqueado

  const CITY_TAGS = [
    'barcelona',
    'madrid',
    'mallorca',
    'canarias',
    'buenosaires',
    'rosario',
    'cordoba',
    'ushuaia',
    'chile_santiago',
    'chile_vina',
    'chile_atacama',
    'chile_pascua'
  ];

  function isChileCityTag(tagOrKey) {
    const tag = toSlotCityTag(tagOrKey);
    return (
      tag === 'chile_santiago' ||
      tag === 'chile_vina' ||
      tag === 'chile_atacama' ||
      tag === 'chile_pascua'
    );
  }

  function isCountryTempLocked(countryOrCityKey) {
    if (typeof global.isCountryLocked === 'function') {
      return global.isCountryLocked(countryOrCityKey);
    }
    const flags = global.LOCKED_COUNTRIES || {};
    const k = String(countryOrCityKey || '').trim().toLowerCase();
    if (k === 'chile' || isChileCityTag(k)) return !!flags.chile;
    if (k === 'venezuela') return !!flags.venezuela;
    return false;
  }

  function isSouthAmericaCityTag(tagOrKey) {
    const tag = toSlotCityTag(tagOrKey);
    return (
      tag === 'buenosaires' ||
      tag === 'rosario' ||
      tag === 'cordoba' ||
      tag === 'ushuaia' ||
      isChileCityTag(tag)
    );
  }

  function toSlotCityTag(cityKey) {
    if (cityKey === 'palma' || cityKey === 'mallorca') return 'mallorca';
    return cityKey || 'barcelona';
  }

  function fromSlotCityTag(tag) {
    if (tag === 'mallorca') return 'palma';
    return tag || 'barcelona';
  }

  function getContinentForCity(cityOrTag) {
    if (isSouthAmericaCityTag(cityOrTag)) return 'sudamerica';
    return 'europa';
  }

  function normalizeSlotContinent(continent, fallbackCityTag = 'barcelona') {
    if (continent === 'sudamerica' || continent === 'southamerica') return 'sudamerica';
    if (continent === 'europa' || continent === 'spain') return 'europa';
    return getContinentForCity(fallbackCityTag);
  }

  function toMapContinentKey(slotContinent) {
    return normalizeSlotContinent(slotContinent) === 'sudamerica' ? 'southamerica' : 'spain';
  }

  // ==========================================================================
  // ARQUITECTURA DE 3 RANURAS DE GUARDADO INDEPENDIENTES (LOCALSTORAGE)
  // ==========================================================================
  const SaveSlots = {
    KEYS: SLOT_STORAGE_KEYS,

    getStorageKey(slotId) {
      return SLOT_STORAGE_KEYS[slotId] || SLOT_STORAGE_KEYS[1];
    },

    createEmptyData(slotId = 1) {
      const defs = global.CITY_DEFS || {};
      const cities = {};
      Object.keys(defs).forEach((key) => {
        cities[key] = {
          unlocked: key === 'barcelona' || !!defs[key].defaultUnlocked,
          completed: false,
          maxLevel: 0
        };
      });
      if (!cities.barcelona) {
        cities.barcelona = { unlocked: true, completed: false, maxLevel: 0 };
      }
      const unlockedZones = {};
      const completedZones = {};
      CITY_TAGS.forEach((tag) => {
        unlockedZones[tag] = tag === 'barcelona' ? [1] : [];
        completedZones[tag] = [];
      });
      return {
        version: 2,
        slotId,
        unlockedCities: ['barcelona'],
        unlockedContinents: ['spain'],
        unlockedZones,
        completedZones,
        spainCompleted: false,
        postGameOver: false,
        highScores: {},
        totalCoins: 0,
        lastPlayedContinent: 'europa',
        lastPlayedCity: 'barcelona',
        lastPlayedZone: 1,
        highScore: 0,
        lives: 3,
        hearts: 3,
        barcelonaFirstEntryDone: false,
        animatedPaths: {
          pathAnimated_barcelona_1: true
        },
        cities
      };
    },

    normalizeData(raw, slotId = 1) {
      const base = this.createEmptyData(slotId);
      if (!raw || typeof raw !== 'object') return base;

      const unlockedSet = new Set(['barcelona']);
      if (Array.isArray(raw.unlockedCities)) {
        raw.unlockedCities.forEach((tag) => {
          if (typeof tag === 'string' && tag.trim()) {
            unlockedSet.add(toSlotCityTag(tag.trim()));
          }
        });
      }

      if (raw.cities && typeof raw.cities === 'object') {
        Object.keys(base.cities).forEach((key) => {
          const saved = raw.cities[key] || (key === 'palma' ? raw.cities.mallorca : null);
          if (!saved) return;
          if (saved.unlocked) unlockedSet.add(toSlotCityTag(key));
          base.cities[key].unlocked = base.cities[key].unlocked || !!saved.unlocked;
          base.cities[key].completed = !!saved.completed;
          base.cities[key].maxLevel = Math.max(0, saved.maxLevel | 0);
        });
      }

      // Sincronizar unlockedCities -> cities[key].unlocked (barcelona, madrid, palma/mallorca, canarias)
      unlockedSet.forEach((tag) => {
        const cityKey = fromSlotCityTag(tag);
        if (base.cities[cityKey]) {
          base.cities[cityKey].unlocked = true;
        }
      });

      // Desbloqueo retroactivo si la ciudad anterior está completada
      const defs = global.CITY_DEFS || {};
      Object.keys(defs).forEach((key) => {
        const nextKey = defs[key].next;
        if (nextKey && base.cities[key] && base.cities[key].completed && base.cities[nextKey]) {
          base.cities[nextKey].unlocked = true;
          unlockedSet.add(toSlotCityTag(nextKey));
        }
      });

      base.unlockedCities = CITY_TAGS.filter((t) => unlockedSet.has(t));
      unlockedSet.forEach((t) => {
        if (!base.unlockedCities.includes(t)) base.unlockedCities.push(t);
      });

      // Sincronizar unlockedZones y completedZones por ciudad (retrocompatible con slots antiguos)
      const normZoneList = (arr, maxZone = 4) => {
        const s = new Set();
        if (Array.isArray(arr)) {
          arr.forEach((z) => {
            const n = Math.floor(Number(z) || 0);
            if (n >= 1 && n <= maxZone) s.add(n);
          });
        }
        return Array.from(s).sort((a, b) => a - b);
      };
      const rawUnlockedZones = (raw.unlockedZones && typeof raw.unlockedZones === 'object') ? raw.unlockedZones : {};
      const rawCompletedZones = (raw.completedZones && typeof raw.completedZones === 'object') ? raw.completedZones : {};
      CITY_TAGS.forEach((tag) => {
        const cityKey = fromSlotCityTag(tag);
        const cityMeta = base.cities[cityKey] || { unlocked: tag === 'barcelona', completed: false, maxLevel: 0 };
        const maxZone = (defs[cityKey] && Array.isArray(defs[cityKey].levels)) ? defs[cityKey].levels.length : 4;
        const uSet = new Set(normZoneList(rawUnlockedZones[tag] || rawUnlockedZones[cityKey], maxZone));
        const cSet = new Set(normZoneList(rawCompletedZones[tag] || rawCompletedZones[cityKey], maxZone));

        if (cityMeta.unlocked || tag === 'barcelona') uSet.add(1);
        if (cityMeta.maxLevel > 0) {
          for (let z = 1; z <= Math.min(maxZone, cityMeta.maxLevel); z++) uSet.add(z);
          if (cityMeta.maxLevel > 1) {
            for (let z = 1; z < Math.min(maxZone + 1, cityMeta.maxLevel); z++) cSet.add(z);
          }
        }
        if (cityMeta.completed) {
          for (let z = 1; z <= maxZone; z++) {
            uSet.add(z);
            cSet.add(z);
          }
        }
        // Si la zona z está completada, asegurar z+1 desbloqueada
        Array.from(cSet).forEach((z) => {
          uSet.add(z);
          if (z + 1 <= maxZone) uSet.add(z + 1);
        });
        base.unlockedZones[tag] = Array.from(uSet).sort((a, b) => a - b);
        base.completedZones[tag] = Array.from(cSet).sort((a, b) => a - b);
        const highestU = base.unlockedZones[tag].length ? base.unlockedZones[tag][base.unlockedZones[tag].length - 1] : 0;
        if (highestU > cityMeta.maxLevel) cityMeta.maxLevel = highestU;
      });

      const continentSet = new Set(['spain']);
      if (Array.isArray(raw.unlockedContinents)) {
        raw.unlockedContinents.forEach((c) => {
          if (typeof c === 'string' && c.trim()) continentSet.add(c.trim());
        });
      }
      const allSpainCitiesDone = ['barcelona', 'madrid', 'palma', 'canarias'].every(
        (k) => base.cities[k] && base.cities[k].completed
      );
      base.spainCompleted = !!(raw.spainCompleted || allSpainCitiesDone || (base.cities.canarias && base.cities.canarias.completed));
      if (base.spainCompleted) {
        continentSet.add('southamerica');
        continentSet.add('argentina');
      }
      if (
        (base.cities.ushuaia && base.cities.ushuaia.completed) ||
        (base.cities.chile_santiago && base.cities.chile_santiago.unlocked) ||
        continentSet.has('chile')
      ) {
        continentSet.add('chile');
      }
      base.unlockedContinents = Array.from(continentSet);
      if (continentSet.has('southamerica') || continentSet.has('argentina')) {
        if (!continentSet.has('southamerica')) base.unlockedContinents.push('southamerica');
        if (!base.cities.buenosaires) base.cities.buenosaires = { unlocked: true, completed: false, maxLevel: 0 };
        base.cities.buenosaires.unlocked = true;
        if (!Array.isArray(base.unlockedZones.buenosaires) || !base.unlockedZones.buenosaires.length) {
          base.unlockedZones.buenosaires = [1];
        }
      }
      if (base.cities.rosario && base.cities.rosario.completed) {
        if (!base.cities.cordoba) base.cities.cordoba = { unlocked: true, completed: false, maxLevel: 0 };
        base.cities.cordoba.unlocked = true;
        if (!base.unlockedCities.includes('cordoba')) base.unlockedCities.push('cordoba');
        if (!Array.isArray(base.unlockedZones.cordoba) || !base.unlockedZones.cordoba.length) {
          base.unlockedZones.cordoba = [1];
        }
      }
      if (base.cities.cordoba && base.cities.cordoba.completed) {
        if (!base.cities.ushuaia) base.cities.ushuaia = { unlocked: true, completed: false, maxLevel: 0 };
        base.cities.ushuaia.unlocked = true;
        if (!base.unlockedCities.includes('ushuaia')) base.unlockedCities.push('ushuaia');
        if (!Array.isArray(base.unlockedZones.ushuaia) || !base.unlockedZones.ushuaia.length) {
          base.unlockedZones.ushuaia = [1];
        }
      }
      const chileChain = ['ushuaia', 'chile_santiago', 'chile_vina', 'chile_atacama', 'chile_pascua'];
      for (let i = 0; i < chileChain.length - 1; i++) {
        const prevC = chileChain[i];
        const nextC = chileChain[i + 1];
        if (base.cities[prevC] && base.cities[prevC].completed) {
          if (!base.cities[nextC]) base.cities[nextC] = { unlocked: true, completed: false, maxLevel: 0 };
          base.cities[nextC].unlocked = true;
          if (!base.unlockedCities.includes(nextC)) base.unlockedCities.push(nextC);
          if (!Array.isArray(base.unlockedZones[nextC]) || !base.unlockedZones[nextC].length) {
            base.unlockedZones[nextC] = [1];
          }
        }
      }
      if (!base.cities.chile) {
        base.cities.chile = { unlocked: false, completed: false, maxLevel: 0 };
      }
      if (base.cities.chile_santiago && base.cities.chile_santiago.unlocked) {
        base.cities.chile.unlocked = true;
      }
      if (base.cities.chile_pascua && base.cities.chile_pascua.completed) {
        base.cities.chile.completed = true;
      }

      if (raw.highScores && typeof raw.highScores === 'object') {
        Object.keys(raw.highScores).forEach((k) => {
          const val = Number(raw.highScores[k]) || 0;
          if (val > 0) base.highScores[k] = Math.floor(val);
        });
      }

      base.totalCoins = Math.max(0, Math.floor(Number(raw.totalCoins) || 0));
      base.highScore = Math.max(0, Math.floor(Number(raw.highScore) || 0));
      base.postGameOver = false;
      const hasAnyProgress =
        base.spainCompleted ||
        base.unlockedCities.length > 1 ||
        base.highScore > 0 ||
        base.totalCoins > 0 ||
        Object.keys(base.highScores).length > 0 ||
        (base.cities.barcelona && (base.cities.barcelona.maxLevel || 0) > 0) ||
        CITY_TAGS.some((t) => Array.isArray(base.completedZones[t]) && base.completedZones[t].length > 0);
      base.barcelonaFirstEntryDone = !!(raw.barcelonaFirstEntryDone || hasAnyProgress);
      const rawLives = Number(raw.lives);
      base.lives = Number.isFinite(rawLives) && rawLives >= 1 ? Math.min(99, Math.floor(rawLives)) : 3;
      const rawHearts = Number(raw.hearts);
      base.hearts = Number.isFinite(rawHearts) && rawHearts >= 1 ? Math.max(1, Math.min(3, Math.floor(rawHearts))) : 3;
      const rawCityTag = toSlotCityTag(raw.lastPlayedCity || 'barcelona');
      if (base.unlockedCities.includes(rawCityTag)) {
        base.lastPlayedCity = rawCityTag;
        base.lastPlayedContinent = normalizeSlotContinent(raw.lastPlayedContinent, rawCityTag);
        base.lastPlayedZone = Math.max(1, Math.min(4, Math.floor(Number(raw.lastPlayedZone) || 1)));
      } else {
        base.lastPlayedContinent = 'europa';
        base.lastPlayedCity = 'barcelona';
        base.lastPlayedZone = 1;
      }

      const animMap = {};
      if (raw.animatedPaths && typeof raw.animatedPaths === 'object') {
        Object.keys(raw.animatedPaths).forEach((k) => {
          animMap[k] = raw.animatedPaths[k] !== false;
        });
      }
      Object.keys(raw).forEach((k) => {
        if (k.indexOf('pathAnimated_') === 0) {
          animMap[k] = raw[k] !== false;
          base[k] = raw[k] !== false;
        }
      });
      if (!raw.animatedPaths) {
        CITY_TAGS.forEach((tag) => {
          const cKey = fromSlotCityTag(tag);
          const list = Array.isArray(base.unlockedZones[tag]) ? base.unlockedZones[tag] : [];
          list.forEach((z) => {
            const flag = `pathAnimated_${cKey}_${z}`;
            if (animMap[flag] === undefined) animMap[flag] = true;
          });
        });
      }
      base.animatedPaths = animMap;
      return base;
    },

    syncUnlockedCitiesArray(data) {
      if (!data) return data;
      const set = new Set(['barcelona']);
      if (Array.isArray(data.unlockedCities)) {
        data.unlockedCities.forEach((t) => set.add(toSlotCityTag(t)));
      }
      if (data.cities) {
        Object.keys(data.cities).forEach((k) => {
          if (data.cities[k] && data.cities[k].unlocked) {
            set.add(toSlotCityTag(k));
          }
        });
      }
      data.unlockedCities = CITY_TAGS.filter((t) => set.has(t));
      set.forEach((t) => {
        if (!data.unlockedCities.includes(t)) data.unlockedCities.push(t);
      });
      if (!data.unlockedZones || typeof data.unlockedZones !== 'object') {
        data.unlockedZones = {};
      }
      if (!data.completedZones || typeof data.completedZones !== 'object') {
        data.completedZones = {};
      }
      CITY_TAGS.forEach((t) => {
        if (!Array.isArray(data.unlockedZones[t])) {
          data.unlockedZones[t] = set.has(t) ? [1] : [];
        } else if (set.has(t) && !data.unlockedZones[t].includes(1)) {
          data.unlockedZones[t].unshift(1);
        }
        if (!Array.isArray(data.completedZones[t])) {
          data.completedZones[t] = [];
        }
      });
      return data;
    },

    getSlot(slotId) {
      const key = this.getStorageKey(slotId);
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return this.normalizeData(JSON.parse(raw), slotId);
      } catch (e) {
        return null;
      }
    },

    saveSlot(slotId, data) {
      const key = this.getStorageKey(slotId);
      const clean = this.syncUnlockedCitiesArray(this.normalizeData(data, slotId));
      try {
        localStorage.setItem(key, JSON.stringify(clean));
      } catch (e) {
        /* Sin localStorage disponible */
      }
      return clean;
    },

    deleteSlot(slotId) {
      const key = this.getStorageKey(slotId);
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },

    resetSlot(slotId) {
      const fresh = this.createEmptyData(slotId);
      return this.saveSlot(slotId, fresh);
    },

    getTotalScore(data) {
      if (!data) return 0;
      const levelSum = Object.values(data.highScores || {}).reduce(
        (acc, v) => acc + Math.max(0, Math.floor(Number(v) || 0)),
        0
      );
      return Math.max(Math.floor(Number(data.highScore) || 0), levelSum);
    },

    getCityDisplayName(cityKeyOrTag) {
      const k = fromSlotCityTag(cityKeyOrTag);
      const defs = global.CITY_DEFS || {};
      if (defs[k] && defs[k].name) return defs[k].name;
      if (k === 'buenosaires') return 'Buenos Aires';
      if (k === 'rosario') return 'Rosario';
      if (k === 'cordoba') return 'Córdoba';
      if (k === 'ushuaia') return 'Ushuaia';
      if (k === 'chile') return 'Chile';
      if (k === 'chile_santiago') return 'Santiago de Chile';
      if (k === 'chile_vina') return 'Viña y Valparaíso';
      if (k === 'chile_atacama') return 'Desierto de Atacama';
      if (k === 'chile_pascua') return 'Isla de Pascua';
      if (k === 'palma') return 'Palma de Mallorca';
      if (k === 'madrid') return 'Madrid';
      if (k === 'canarias') return 'Islas Canarias';
      return 'Barcelona';
    },

    getSummary(slotId) {
      const data = this.getSlot(slotId);
      if (!data) return null;
      const cityKey = fromSlotCityTag(data.lastPlayedCity);
      const totalScore = this.getTotalScore(data);
      return {
        slotId,
        data,
        cityKey,
        cityName: this.getCityDisplayName(cityKey),
        lastPlayedContinent: normalizeSlotContinent(data.lastPlayedContinent, data.lastPlayedCity),
        lastPlayedZone: data.lastPlayedZone || 1,
        unlockedCities: data.unlockedCities.slice(),
        unlockedCount: data.unlockedCities.length,
        totalScore,
        totalCoins: data.totalCoins || 0
      };
    },

    getGlobalBestScore() {
      let best = 0;
      for (let i = 1; i <= 3; i++) {
        const s = this.getSummary(i);
        if (s && s.totalScore > best) best = s.totalScore;
      }
      return best;
    },

    isZoneUnlockedInData(data, cityKey, zoneNum) {
      if (!data) return false;
      const key = fromSlotCityTag(cityKey);
      const tag = toSlotCityTag(key);
      const z = Math.max(1, Math.min(4, Math.floor(Number(zoneNum) || 1)));
      const list = data.unlockedZones && (data.unlockedZones[tag] || data.unlockedZones[key]);
      if (Array.isArray(list) && list.includes(z)) return true;
      const cMeta = data.cities && data.cities[key];
      if (cMeta && cMeta.completed) return true;
      if (cMeta && cMeta.unlocked && z === 1) return true;
      if (cMeta && (cMeta.maxLevel | 0) >= z) return true;
      return false;
    },

    isZoneUnlockedAnywhere(cityKey, zoneNum, activeData = null) {
      if (this.isZoneUnlockedInData(activeData, cityKey, zoneNum)) return true;
      for (let i = 1; i <= 3; i++) {
        const slot = this.getSlot(i);
        if (this.isZoneUnlockedInData(slot, cityKey, zoneNum)) return true;
      }
      return false;
    }
  };

  // ==========================================================================
  // PROGRESO GUARDADO (vinculado por slot independiente + respaldo en memoria)
  // ==========================================================================
  const WorldProgress = {
    activeSlotId: null,
    data: null,

    defaults() {
      return SaveSlots.createEmptyData(this.activeSlotId || 1);
    },

    setActiveSlot(slotId, { createIfMissing = false } = {}) {
      this.activeSlotId = slotId;
      let loaded = SaveSlots.getSlot(slotId);
      if (!loaded) {
        loaded = SaveSlots.createEmptyData(slotId);
        if (createIfMissing) {
          SaveSlots.saveSlot(slotId, loaded);
        }
      }
      this.data = loaded;
      return loaded;
    },

    clearActiveSlot() {
      this.activeSlotId = null;
      this.data = this.defaults();
    },

    load() {
      if (this.activeSlotId) {
        return this.setActiveSlot(this.activeSlotId);
      }
      const base = this.defaults();
      this.data = base;
      return base;
    },

    ensure() {
      if (!this.data) this.load();
      return this.data;
    },

    save() {
      const d = SaveSlots.syncUnlockedCitiesArray(this.ensure());
      if (this.activeSlotId) {
        this.data = SaveSlots.saveSlot(this.activeSlotId, d);
      }
    },

    isUnlocked(city) {
      if (isCountryTempLocked(city)) return false;
      const d = this.ensure();
      if (city === 'chile') {
        const ch = d.cities.chile;
        const st = d.cities.chile_santiago;
        const ushDone = d.cities.ushuaia && d.cities.ushuaia.completed;
        return !!((ch && ch.unlocked) || (st && st.unlocked) || ushDone);
      }
      const c = d.cities[city];
      return !!(c && c.unlocked);
    },

    isCityCompleted(city) {
      if (city === 'chile') {
        return this.isCityCompleted('chile_pascua');
      }
      const cityKey = fromSlotCityTag(city);
      const d = this.ensure();
      const c = d.cities[cityKey];
      if (c && c.completed) return true;
      const maxZone = typeof global.getCityZoneCount === 'function' ? global.getCityZoneCount(cityKey) : 4;
      return this.isZoneCompleted(cityKey, maxZone);
    },

    isCompleted(city) {
      return this.isCityCompleted(city);
    },

    isZoneInRiskMode(_city, _zoneNum) {
      return false;
    },

    getMaxLevel(city) {
      const c = this.ensure().cities[city];
      return c ? c.maxLevel : 0;
    },

    unlock(city) {
      if (isCountryTempLocked(city)) return false;
      const defs = global.CITY_DEFS || {};
      const d = this.ensure();
      const c = d.cities[city];
      if (!c || !defs[city]) return false;
      const tag = toSlotCityTag(city);
      if (!d.unlockedZones) d.unlockedZones = {};
      if (!Array.isArray(d.unlockedZones[tag])) d.unlockedZones[tag] = [];
      if (!d.unlockedZones[tag].includes(1)) {
        d.unlockedZones[tag].push(1);
        d.unlockedZones[tag].sort((a, b) => a - b);
      }
      const unlocked = c.unlocked;
      c.unlocked = true;
      if (isChileCityTag(city) && d.cities.chile) {
        d.cities.chile.unlocked = true;
      }
      if (unlocked) {
        this.save();
        return false;
      }
      SaveSlots.syncUnlockedCitiesArray(d);
      this.save();
      return !!defs[city].playable;
    },

    getUnlockedZones(city) {
      const d = this.ensure();
      const tag = toSlotCityTag(city);
      const arr = d.unlockedZones && Array.isArray(d.unlockedZones[tag]) ? d.unlockedZones[tag] : [];
      if (!arr.length && this.isUnlocked(fromSlotCityTag(tag))) return [1];
      return arr.slice().sort((a, b) => a - b);
    },

    getCompletedZones(city) {
      const d = this.ensure();
      const tag = toSlotCityTag(city);
      const arr = d.completedZones && Array.isArray(d.completedZones[tag]) ? d.completedZones[tag] : [];
      return arr.slice().sort((a, b) => a - b);
    },

    isZoneUnlocked(city, zoneNum) {
      return this.getUnlockedZones(city).includes(Math.floor(Number(zoneNum) || 0));
    },

    isZoneCompleted(city, zoneNum) {
      return this.getCompletedZones(city).includes(Math.floor(Number(zoneNum) || 0));
    },

    getHighestUnlockedZone(city) {
      const list = this.getUnlockedZones(city);
      return list.length ? list[list.length - 1] : 1;
    },

    getZoneHighScore(city, zoneNum) {
      const d = this.ensure();
      const key = `${toSlotCityTag(city)}_${Math.floor(Number(zoneNum) || 1)}`;
      return (d.highScores && d.highScores[key]) ? d.highScores[key] : 0;
    },

    unlockZone(city, zoneNum) {
      const defs = global.CITY_DEFS || {};
      const cityKey = fromSlotCityTag(city);
      const maxZone = (defs[cityKey] && Array.isArray(defs[cityKey].levels)) ? defs[cityKey].levels.length : 4;
      const z = Math.floor(Number(zoneNum) || 0);
      if (z < 1 || z > maxZone) return false;
      const d = this.ensure();
      const tag = toSlotCityTag(cityKey);
      if (!d.unlockedZones) d.unlockedZones = {};
      if (!Array.isArray(d.unlockedZones[tag])) d.unlockedZones[tag] = [1];
      const already = d.unlockedZones[tag].includes(z);
      if (!already) {
        d.unlockedZones[tag].push(z);
        d.unlockedZones[tag].sort((a, b) => a - b);
      }
      if (d.cities[cityKey]) {
        d.cities[cityKey].unlocked = true;
        if (z > (d.cities[cityKey].maxLevel || 0)) d.cities[cityKey].maxLevel = z;
      }
      SaveSlots.syncUnlockedCitiesArray(d);
      this.save();
      return !already;
    },

    isZonePathAnimated(city, zoneNum) {
      const cityKey = fromSlotCityTag(city);
      const z = Math.max(1, Math.min(4, Math.floor(Number(zoneNum) || 1)));
      if (z <= 1) return true;
      const d = this.ensure();
      const flag = `pathAnimated_${cityKey}_${z}`;
      if (d.animatedPaths && typeof d.animatedPaths[flag] === 'boolean') {
        return d.animatedPaths[flag];
      }
      if (typeof d[flag] === 'boolean') return d[flag];
      return true;
    },

    markZonePathAnimated(city, zoneNum) {
      const cityKey = fromSlotCityTag(city);
      const z = Math.max(1, Math.min(4, Math.floor(Number(zoneNum) || 1)));
      const d = this.ensure();
      if (!d.animatedPaths || typeof d.animatedPaths !== 'object') d.animatedPaths = {};
      const flag = `pathAnimated_${cityKey}_${z}`;
      d.animatedPaths[flag] = true;
      d[flag] = true;
      this.save();
    },

    isAnySlotZoneUnlocked(cityKey, zoneNum) {
      return SaveSlots.isZoneUnlockedAnywhere(cityKey, zoneNum, this.data);
    },

    completeZone(city, zoneNum) {
      const defs = global.CITY_DEFS || {};
      const cityKey = fromSlotCityTag(city);
      const maxZone = (defs[cityKey] && Array.isArray(defs[cityKey].levels)) ? defs[cityKey].levels.length : 4;
      const z = Math.max(1, Math.min(maxZone, Math.floor(Number(zoneNum) || 1)));
      const d = this.ensure();
      const tag = toSlotCityTag(cityKey);
      if (!d.unlockedZones) d.unlockedZones = {};
      if (!d.completedZones) d.completedZones = {};
      if (!d.animatedPaths || typeof d.animatedPaths !== 'object') d.animatedPaths = {};
      if (!Array.isArray(d.unlockedZones[tag])) d.unlockedZones[tag] = [1];
      if (!Array.isArray(d.completedZones[tag])) d.completedZones[tag] = [];
      if (!d.unlockedZones[tag].includes(z)) d.unlockedZones[tag].push(z);
      if (!d.completedZones[tag].includes(z)) d.completedZones[tag].push(z);
      d.unlockedZones[tag].sort((a, b) => a - b);
      d.completedZones[tag].sort((a, b) => a - b);

      let newlyUnlockedZone = null;
      if (z < maxZone && !d.unlockedZones[tag].includes(z + 1)) {
        d.unlockedZones[tag].push(z + 1);
        d.unlockedZones[tag].sort((a, b) => a - b);
        newlyUnlockedZone = z + 1;
        const flag = `pathAnimated_${cityKey}_${newlyUnlockedZone}`;
        d.animatedPaths[flag] = false;
        d[flag] = false;
      }
      if (d.cities[cityKey]) {
        d.cities[cityKey].unlocked = true;
        const top = d.unlockedZones[tag][d.unlockedZones[tag].length - 1] || z;
        if (top > (d.cities[cityKey].maxLevel || 0)) d.cities[cityKey].maxLevel = top;
        if (z >= maxZone) d.cities[cityKey].completed = true;
      }
      d.lastPlayedContinent = getContinentForCity(tag);
      d.lastPlayedCity = tag;
      d.lastPlayedZone = z;
      SaveSlots.syncUnlockedCitiesArray(d);
      this.save();
      return { newlyUnlockedZone, isLastZone: z >= maxZone };
    },

    complete(city) {
      const d = this.ensure();
      const c = d.cities[city];
      if (!c) return;
      c.completed = true;
      const defs = global.CITY_DEFS || {};
      const maxZone = (defs[city] && Array.isArray(defs[city].levels)) ? defs[city].levels.length : 4;
      const tag = toSlotCityTag(city);
      if (!d.unlockedZones) d.unlockedZones = {};
      if (!d.completedZones) d.completedZones = {};
      d.unlockedZones[tag] = Array.from({ length: maxZone }, (_, i) => i + 1);
      d.completedZones[tag] = Array.from({ length: maxZone }, (_, i) => i + 1);
      c.maxLevel = Math.max(c.maxLevel || 0, maxZone);
      const nextKey = defs[city] ? defs[city].next : null;
      if (nextKey && d.cities[nextKey]) {
        d.cities[nextKey].unlocked = true;
        const nextTag = toSlotCityTag(nextKey);
        if (!Array.isArray(d.unlockedZones[nextTag]) || !d.unlockedZones[nextTag].length) {
          d.unlockedZones[nextTag] = [1];
        }
      }
      const allDone = ['barcelona', 'madrid', 'palma', 'canarias'].every(
        (k) => d.cities[k] && d.cities[k].completed
      );
      if (city === 'canarias' || allDone) {
        d.spainCompleted = true;
        if (!Array.isArray(d.unlockedContinents)) d.unlockedContinents = ['spain'];
        if (!d.unlockedContinents.includes('southamerica')) d.unlockedContinents.push('southamerica');
        if (!d.unlockedContinents.includes('argentina')) d.unlockedContinents.push('argentina');
        if (d.cities.buenosaires) d.cities.buenosaires.unlocked = true;
        if (!Array.isArray(d.unlockedZones.buenosaires) || !d.unlockedZones.buenosaires.length) {
          d.unlockedZones.buenosaires = [1];
        }
      }
      if (city === 'ushuaia' && !isCountryTempLocked('chile')) {
        if (!Array.isArray(d.unlockedContinents)) d.unlockedContinents = ['spain'];
        if (!d.unlockedContinents.includes('chile')) d.unlockedContinents.push('chile');
        if (d.cities.chile) d.cities.chile.unlocked = true;
        if (d.cities.chile_santiago) d.cities.chile_santiago.unlocked = true;
        if (!Array.isArray(d.unlockedZones.chile_santiago) || !d.unlockedZones.chile_santiago.length) {
          d.unlockedZones.chile_santiago = [1];
        }
      }
      SaveSlots.syncUnlockedCitiesArray(d);
      this.save();
    },

    isSpainCompleted() {
      const d = this.ensure();
      if (d.spainCompleted) return true;
      return ['barcelona', 'madrid', 'palma', 'canarias'].every(
        (k) => d.cities[k] && d.cities[k].completed
      );
    },

    isContinentUnlocked(continent = 'spain') {
      const norm = continent === 'southamerica' ? 'argentina' : continent;
      if (norm === 'spain') return true;
      if (norm === 'venezuela' || isCountryTempLocked(norm)) return false;
      const d = this.ensure();
      const arr = Array.isArray(d.unlockedContinents) ? d.unlockedContinents : [];
      if (norm === 'argentina') {
        return arr.includes('southamerica') || arr.includes('argentina') || this.isSpainCompleted();
      }
      if (norm === 'chile') {
        return (
          arr.includes('chile') ||
          !!(d.cities.ushuaia && d.cities.ushuaia.completed) ||
          !!(d.cities.chile_santiago && d.cities.chile_santiago.unlocked)
        );
      }
      return arr.includes(continent);
    },

    unlockContinent(continent) {
      const d = this.ensure();
      if (!Array.isArray(d.unlockedContinents)) d.unlockedContinents = ['spain'];
      const norm = continent === 'southamerica' ? 'argentina' : continent;
      if (isCountryTempLocked(norm)) return false;
      const already = this.isContinentUnlocked(norm);
      if (norm === 'argentina') {
        if (!d.unlockedContinents.includes('southamerica')) d.unlockedContinents.push('southamerica');
        if (!d.unlockedContinents.includes('argentina')) d.unlockedContinents.push('argentina');
        d.spainCompleted = true;
        if (d.cities.buenosaires) d.cities.buenosaires.unlocked = true;
        if (!d.unlockedZones) d.unlockedZones = {};
        if (!Array.isArray(d.unlockedZones.buenosaires) || !d.unlockedZones.buenosaires.length) {
          d.unlockedZones.buenosaires = [1];
        }
      } else if (norm === 'chile') {
        if (!d.unlockedContinents.includes('chile')) d.unlockedContinents.push('chile');
        if (d.cities.chile) d.cities.chile.unlocked = true;
        if (d.cities.chile_santiago) d.cities.chile_santiago.unlocked = true;
        if (!d.unlockedZones) d.unlockedZones = {};
        if (!Array.isArray(d.unlockedZones.chile_santiago) || !d.unlockedZones.chile_santiago.length) {
          d.unlockedZones.chile_santiago = [1];
        }
      } else if (!d.unlockedContinents.includes(continent)) {
        d.unlockedContinents.push(continent);
      }
      SaveSlots.syncUnlockedCitiesArray(d);
      this.save();
      return !already;
    },

    setMaxLevel(city, level) {
      const d = this.ensure();
      const c = d.cities[city];
      if (!c) return;
      const lvl = Math.max(1, Math.floor(Number(level) || 1));
      const tag = toSlotCityTag(city);
      if (!d.unlockedZones) d.unlockedZones = {};
      if (!Array.isArray(d.unlockedZones[tag])) d.unlockedZones[tag] = [1];
      let changed = false;
      for (let z = 1; z <= lvl; z++) {
        if (!d.unlockedZones[tag].includes(z)) {
          d.unlockedZones[tag].push(z);
          changed = true;
        }
      }
      if (changed) d.unlockedZones[tag].sort((a, b) => a - b);
      if (lvl > c.maxLevel) {
        c.maxLevel = lvl;
        changed = true;
      }
      if (changed) this.save();
    },

    /** Verifica si la ranura activa es nueva/virgen (0 zonas/niveles completados y 0 puntos). */
    isFreshZeroSlot() {
      const d = this.ensure();
      let completedCount = 0;
      for (let i = 0; i < CITY_TAGS.length; i++) {
        const tag = CITY_TAGS[i];
        const comp = d.completedZones && Array.isArray(d.completedZones[tag]) ? d.completedZones[tag] : [];
        completedCount += comp.length;
      }
      const cities = d.cities || {};
      const cityKeys = Object.keys(cities);
      for (let i = 0; i < cityKeys.length; i++) {
        const meta = cities[cityKeys[i]];
        if (meta && meta.completed) completedCount += 1;
      }
      if (d.spainCompleted) completedCount += 1;

      const scoreMap = d.highScores && typeof d.highScores === 'object' ? d.highScores : {};
      let mapPoints = 0;
      const scoreKeys = Object.keys(scoreMap);
      for (let i = 0; i < scoreKeys.length; i++) {
        mapPoints += Math.max(0, Number(scoreMap[scoreKeys[i]]) || 0);
      }
      const points = Math.max(0, Number(d.highScore) || 0) + mapPoints;
      return completedCount === 0 && points === 0;
    },

    markBarcelonaFirstEntry() {
      const d = this.ensure();
      if (!d.barcelonaFirstEntryDone) {
        d.barcelonaFirstEntryDone = true;
        this.save();
      }
    },

    /** Desbloquea todos los países jugables (España, Argentina, y Chile cuando no esté bloqueado temporalmente). */
    unlockAllProgress() {
      const defs = global.CITY_DEFS || {};
      const d = this.ensure();
      const chileLocked = isCountryTempLocked('chile');
      d.barcelonaFirstEntryDone = true;
      d.spainCompleted = true;
      d.unlockedContinents = chileLocked
        ? ['spain', 'southamerica', 'argentina']
        : ['spain', 'southamerica', 'argentina', 'chile'];
      if (!d.cities) d.cities = {};
      if (!d.unlockedZones) d.unlockedZones = {};
      if (!d.completedZones) d.completedZones = {};
      if (!d.animatedPaths || typeof d.animatedPaths !== 'object') d.animatedPaths = {};

      if (!d.cities.chile) d.cities.chile = { unlocked: false, completed: false, maxLevel: 0 };
      if (!chileLocked) d.cities.chile.unlocked = true;

      CITY_TAGS.forEach((tag) => {
        const cityKey = fromSlotCityTag(tag);
        if (isCountryTempLocked(cityKey)) return;
        const def = defs[cityKey];
        const maxZone = def && Array.isArray(def.levels) ? def.levels.length : 4;
        const allZones = Array.from({ length: maxZone }, (_, idx) => idx + 1);
        d.unlockedZones[tag] = allZones;
        if (!Array.isArray(d.completedZones[tag])) d.completedZones[tag] = [];
        if (!d.cities[cityKey]) d.cities[cityKey] = { unlocked: true, completed: false, maxLevel: maxZone };
        d.cities[cityKey].unlocked = true;
        d.cities[cityKey].maxLevel = Math.max(d.cities[cityKey].maxLevel || 0, maxZone);
        allZones.forEach((z) => {
          const flag = `pathAnimated_${cityKey}_${z}`;
          d.animatedPaths[flag] = true;
          d[flag] = true;
        });
      });

      Object.keys(defs).forEach((cityKey) => {
        if (cityKey === 'venezuela' || isCountryTempLocked(cityKey)) return;
        const maxZone = Array.isArray(defs[cityKey].levels) ? defs[cityKey].levels.length : 4;
        if (!d.cities[cityKey]) d.cities[cityKey] = { unlocked: true, completed: false, maxLevel: maxZone };
        d.cities[cityKey].unlocked = true;
        d.cities[cityKey].maxLevel = Math.max(d.cities[cityKey].maxLevel || 0, maxZone);
      });

      d.unlockedCities = chileLocked
        ? CITY_TAGS.filter((t) => !isChileCityTag(t))
        : CITY_TAGS.slice();
      SaveSlots.syncUnlockedCitiesArray(d);
      this.save();
      return d;
    },

    setLastPlayedCity(city) {
      const d = this.ensure();
      const tag = toSlotCityTag(city);
      const cont = getContinentForCity(tag);
      if (d.lastPlayedCity !== tag || d.lastPlayedContinent !== cont) {
        d.lastPlayedCity = tag;
        d.lastPlayedContinent = cont;
        this.save();
      }
    },

    getLastPlayedContinent() {
      const d = this.ensure();
      return normalizeSlotContinent(d.lastPlayedContinent, d.lastPlayedCity || 'barcelona');
    },

    getLastPlayedCityKey() {
      const d = this.ensure();
      return fromSlotCityTag(d.lastPlayedCity || 'barcelona');
    },

    setLastPlayedLocation(city, zoneNum, continent = null) {
      const d = this.ensure();
      const tag = toSlotCityTag(city || d.lastPlayedCity || 'barcelona');
      const cont = normalizeSlotContinent(continent, tag);
      const z = Math.max(1, Math.min(4, Math.floor(Number(zoneNum) || 1)));
      if (d.lastPlayedContinent !== cont || d.lastPlayedCity !== tag || d.lastPlayedZone !== z) {
        d.lastPlayedContinent = cont;
        d.lastPlayedCity = tag;
        d.lastPlayedZone = z;
        this.save();
      }
    },

    setLastPlayedZone(city, zoneNum) {
      this.setLastPlayedLocation(city, zoneNum);
    },

    getLastPlayedZone(city) {
      const d = this.ensure();
      const cityKey = fromSlotCityTag(city || d.lastPlayedCity || 'barcelona');
      const unlocked = this.getUnlockedZones(cityKey);
      const saved = Math.floor(Number(d.lastPlayedZone) || 0);
      if (toSlotCityTag(cityKey) === d.lastPlayedCity && unlocked.includes(saved)) {
        return saved;
      }
      return unlocked.length ? unlocked[unlocked.length - 1] : 1;
    },

    getLastPlayedTarget() {
      const d = this.ensure();
      const rawCityKey = fromSlotCityTag(d.lastPlayedCity || 'barcelona');
      const validCity = CITY_SUBMAPS[rawCityKey] && this.isUnlocked(rawCityKey) ? rawCityKey : 'barcelona';
      const unlockedZones = this.getUnlockedZones(validCity);
      const savedZ = Math.floor(Number(d.lastPlayedZone) || 1);
      const zoneNum = unlockedZones.includes(savedZ)
        ? savedZ
        : (unlockedZones.includes(1) ? 1 : (unlockedZones[0] || 1));
      const rawSlotContinent =
        validCity === rawCityKey
          ? normalizeSlotContinent(d.lastPlayedContinent, validCity)
          : getContinentForCity(validCity);
      const mapContinent = toMapContinentKey(rawSlotContinent);
      const saUnlocked = this.isContinentUnlocked('argentina');
      const chileUnlocked = this.isContinentUnlocked('chile');
      const baseContinent = mapContinent === 'southamerica' && !saUnlocked ? 'spain' : mapContinent;
      const finalCity = baseContinent === 'spain' && getContinentForCity(validCity) === 'sudamerica'
        ? 'barcelona'
        : validCity;
      const finalZone = finalCity === validCity ? zoneNum : 1;
      const worldContinent =
        isChileCityTag(finalCity) && chileUnlocked
          ? 'chile'
          : (baseContinent === 'southamerica' ? 'argentina' : 'spain');
      return {
        lastPlayedContinent: getContinentForCity(finalCity),
        continent: worldContinent,
        cityKey: finalCity,
        zoneNum: finalZone,
        mapLevel: 'city'
      };
    },

    getFurthestUnlockedTarget() {
      if (this.isContinentUnlocked('chile')) {
        const chileOrder = ['chile_pascua', 'chile_atacama', 'chile_vina', 'chile_santiago'];
        for (const k of chileOrder) {
          if (this.isUnlocked(k)) {
            return {
              continent: 'chile',
              cityKey: k,
              zoneNum: this.getHighestUnlockedZone(k),
              mapLevel: 'city'
            };
          }
        }
      }
      const saUnlocked = this.isContinentUnlocked('argentina');
      if (saUnlocked) {
        const saOrder = ['ushuaia', 'cordoba', 'rosario', 'buenosaires'];
        for (const k of saOrder) {
          if (this.isUnlocked(k)) {
            return {
              continent: 'argentina',
              cityKey: k,
              zoneNum: this.getHighestUnlockedZone(k),
              mapLevel: 'city'
            };
          }
        }
      }
      const spainOrder = ['canarias', 'palma', 'madrid', 'barcelona'];
      let furthestCity = 'barcelona';
      for (const k of spainOrder) {
        if (this.isUnlocked(k)) {
          furthestCity = k;
          break;
        }
      }
      return {
        continent: 'spain',
        cityKey: furthestCity,
        zoneNum: this.getHighestUnlockedZone(furthestCity),
        mapLevel: 'city'
      };
    },

    isPostGameOver() {
      return false;
    },

    setPostGameOver(_flag) {
      const d = this.ensure();
      if (d.postGameOver) {
        d.postGameOver = false;
        this.save();
      }
    },

    getLives() {
      const raw = Number(this.ensure().lives);
      return Number.isFinite(raw) && raw >= 1 ? Math.min(99, Math.floor(raw)) : 3;
    },

    setLives(val) {
      const d = this.ensure();
      const raw = Number(val);
      const clean = Number.isFinite(raw) && raw >= 1 ? Math.min(99, Math.floor(raw)) : 3;
      d.lives = clean;
      this.save();
      return clean;
    },

    getHearts() {
      const raw = Number(this.ensure().hearts);
      return Number.isFinite(raw) && raw >= 1 ? Math.max(1, Math.min(3, Math.floor(raw))) : 3;
    },

    setHearts(val) {
      const d = this.ensure();
      const raw = Number(val);
      const clean = Number.isFinite(raw) && raw >= 1 ? Math.max(1, Math.min(3, Math.floor(raw))) : 3;
      d.hearts = clean;
      this.save();
      return clean;
    },

    recordLevelScore(city, levelNum, levelScore) {
      const d = this.ensure();
      const clean = Math.max(0, Math.floor(Number(levelScore) || 0));
      if (!d.highScores) d.highScores = {};
      const key = `${toSlotCityTag(city)}_${levelNum}`;
      if (clean > (d.highScores[key] || 0)) {
        d.highScores[key] = clean;
        this.save();
      }
    },

    updateSlotHighScore(score) {
      const d = this.ensure();
      const clean = Math.max(0, Math.floor(Number(score) || 0));
      if (clean > (d.highScore || 0)) {
        d.highScore = clean;
        this.save();
      }
    },

    setTotalCoins(coins) {
      const d = this.ensure();
      const clean = Math.max(0, Math.floor(Number(coins) || 0));
      if (clean !== d.totalCoins) {
        d.totalCoins = clean;
        this.save();
      }
    },

    getSlotMaxDisplayScore() {
      return SaveSlots.getTotalScore(this.ensure());
    },

    reset() {
      if (this.activeSlotId) {
        this.data = SaveSlots.resetSlot(this.activeSlotId);
      } else {
        this.data = this.defaults();
      }
    }
  };

  // ==========================================================================
  // GEOGRAFÍA (coordenadas lógicas 960x540)
  // ==========================================================================
  const P = (arr) => arr.map(([x, y]) => ({ x, y }));

  // --- Mapa Mundi ---
  const WORLD_NODES = {
    spain: { x: 522, y: 200, label: 'Europa', hidden: false },
    argentina: { x: 334, y: 392, label: 'Argentina', hidden: true },
    chile: { x: 294, y: 388, label: 'Chile', hidden: true },
    venezuela: { x: 312, y: 292, label: '?????', locked: true, hidden: true }
  };

  // Strictly sequential world flight graph: España ↔ Argentina ↔ Chile ↔ Venezuela
  const WORLD_EDGES = [
    { a: 'spain', b: 'argentina', arcHeight: 68 },
    { a: 'argentina', b: 'chile', arcHeight: 26 },
    { a: 'chile', b: 'venezuela', arcHeight: 22 }
  ];

  function getWorldNeighbors(key) {
    const out = [];
    for (let i = 0; i < WORLD_EDGES.length; i++) {
      const e = WORLD_EDGES[i];
      if (e.a === key) out.push(e.b);
      else if (e.b === key) out.push(e.a);
    }
    return out;
  }

  function areWorldNeighbors(a, b) {
    for (let i = 0; i < WORLD_EDGES.length; i++) {
      const e = WORLD_EDGES[i];
      if ((e.a === a && e.b === b) || (e.a === b && e.b === a)) return true;
    }
    return false;
  }

  function nextWorldHop(fromKey, targetKey) {
    if (!fromKey || !targetKey || fromKey === targetKey) return null;
    const queue = [[fromKey, null]];
    const visited = { [fromKey]: true };
    while (queue.length > 0) {
      const [cur, firstHop] = queue.shift();
      const neighbors = getWorldNeighbors(cur);
      for (let i = 0; i < neighbors.length; i++) {
        const nb = neighbors[i];
        if (visited[nb]) continue;
        const node = WORLD_NODES[nb];
        if (!node || node.locked) continue;
        const hop = firstHop || nb;
        if (nb === targetKey) return hop;
        visited[nb] = true;
        queue.push([nb, hop]);
      }
    }
    return null;
  }

  const WORLD_SHAPES = {
    northAmerica: P([[80, 140], [180, 118], [262, 148], [284, 202], [240, 252], [190, 242], [150, 202], [100, 192]]),
    southAmerica: P([[250, 300], [310, 284], [352, 310], [382, 342], [366, 386], [336, 426], [316, 472], [294, 456], [284, 400], [254, 360], [234, 326]]),
    europe: P([[500, 165], [540, 140], [600, 130], [680, 140], [732, 172], [702, 212], [640, 226], [590, 216], [556, 226], [520, 216]]),
    africa: P([[500, 258], [560, 242], [622, 256], [662, 302], [642, 372], [602, 432], [566, 422], [546, 352], [510, 300]]),
    iberia: P([[492, 190], [520, 180], [548, 184], [558, 200], [540, 220], [506, 224], [488, 208]])
  };

  // --- Mapa de España ---
  // Encuadre elevado hacia el noreste para abrir el Atlántico suroeste y
  // despejar el corredor marítimo desde Baleares hasta el norte de África/Canarias.
  const SPAIN_NODES = {
    barcelona: { x: 788, y: 128, number: 1 },
    madrid: { x: 562, y: 196, number: 2 },
    palma: { x: 856, y: 218, number: 3 },
    canarias: { x: 138, y: 382, number: 4 }
  };

  const SPAIN_EDGES = [
    { a: 'barcelona', b: 'madrid', ctrl: { x: 655, y: 120 } },
    {
      a: 'madrid',
      b: 'palma',
      waypoints: [
        SPAIN_NODES.madrid,
        { x: 668, y: 234 },
        { x: 754, y: 204 },
        { x: 816, y: 182 },
        { x: 854, y: 182 },
        SPAIN_NODES.palma
      ]
    },
    {
      a: 'palma',
      b: 'canarias',
      waypoints: [
        SPAIN_NODES.palma,
        { x: 828, y: 262 },
        { x: 818, y: 320 },
        { x: 752, y: 348 },
        { x: 615, y: 350 },
        { x: 488, y: 350 },
        { x: 375, y: 352 },
        { x: 242, y: 344 },
        { x: 174, y: 360 },
        SPAIN_NODES.canarias
      ]
    }
  ];

  const SPAIN_SHAPES = {
    spain: P([
      [336, 92], [405, 76], [485, 78], [570, 76], [665, 82], [745, 88], [796, 98],
      [818, 132], [794, 166], [768, 198], [750, 228], [738, 258], [698, 288], [642, 312],
      [574, 324], [506, 326], [456, 314], [412, 312], [400, 270], [394, 212], [388, 162], [364, 126]
    ]),
    portugal: P([
      [364, 126], [388, 162], [394, 212], [400, 270], [412, 312], [392, 330], [352, 314],
      [338, 250], [340, 186], [346, 134], [354, 114]
    ]),
    france: P([
      [260, 14], [945, 14], [945, 68], [848, 86], [796, 98], [745, 88], [665, 82],
      [570, 76], [485, 78], [405, 76], [336, 92], [295, 82]
    ]),
    africa: P([
      [235, 545], [258, 492], [308, 454], [366, 418], [430, 386], [496, 374],
      [575, 382], [685, 380], [820, 386], [950, 376], [950, 545]
    ])
  };

  const BALEARIC_ISLES = [
    { x: 856, y: 218, rx: 32, ry: 18, rot: -0.28 },
    { x: 904, y: 194, rx: 14, ry: 7.5, rot: -0.1 },
    { x: 804, y: 248, rx: 11, ry: 8, rot: 0.2 }
  ];

  const CANARIAS_ISLES = [
    { x: 66, y: 398, rx: 5.5, ry: 4, rot: -0.2 },    // El Hierro
    { x: 74, y: 368, rx: 6, ry: 7.5, rot: 0.15 },    // La Palma
    { x: 96, y: 392, rx: 5.5, ry: 4.5, rot: 0 },     // La Gomera
    { x: 136, y: 382, rx: 16, ry: 8.5, rot: -0.32 }, // Tenerife
    { x: 170, y: 396, rx: 10, ry: 9.5, rot: 0.1 },   // Gran Canaria
    { x: 204, y: 384, rx: 11, ry: 5.5, rot: 0.45 },  // Fuerteventura
    { x: 218, y: 362, rx: 8.5, ry: 4.5, rot: 0.5 }   // Lanzarote
  ];

  // Países vecinos de Europa preparados para futuras expansiones (sin alterar SPAIN_NODES)
  const EUROPE_FUTURE_NODES = {
    france: { x: 670, y: 66, number: 5, anchor: 'barcelona', ctrl: { x: 750, y: 74 } },
    portugal: { x: 360, y: 214, number: 6, anchor: 'madrid', ctrl: { x: 454, y: 212 } }
  };

  // --- Mapa de Argentina y Litoral ---
  const SA_NODES = {
    buenosaires: { x: 534, y: 314, number: 1 },
    rosario: { x: 486, y: 244, number: 2 },
    cordoba: { x: 372, y: 256, number: 3 },
    ushuaia: { x: 406, y: 416, number: 4 }
  };

  const SA_EDGES = [
    {
      a: 'buenosaires',
      b: 'rosario',
      waypoints: [
        SA_NODES.buenosaires,
        { x: 514, y: 284 },
        { x: 498, y: 262 },
        SA_NODES.rosario
      ]
    },
    {
      a: 'rosario',
      b: 'cordoba',
      waypoints: [
        SA_NODES.rosario,
        { x: 448, y: 248 },
        { x: 408, y: 252 },
        SA_NODES.cordoba
      ]
    },
    {
      a: 'cordoba',
      b: 'ushuaia',
      waypoints: [
        SA_NODES.cordoba,
        { x: 372, y: 308 },
        { x: 382, y: 364 },
        { x: 394, y: 394 },
        SA_NODES.ushuaia
      ]
    }
  ];

  const SA_SHAPES = {
    southAmericaNorth: P([
      [216, 166], [238, 124], [296, 108], [492, 104], [610, 148],
      [588, 224], [554, 212], [246, 166]
    ]),
    venezuela: P([
      [298, 120], [338, 92], [402, 82], [458, 88],
      [500, 108], [478, 138], [412, 148], [336, 142]
    ]),
    chile: P([
      [216, 166], [246, 166], [250, 240], [262, 326], [286, 400],
      [312, 434], [282, 438], [244, 390], [206, 308], [188, 224]
    ]),
    argentina: P([
      [246, 166], [566, 166], [554, 212], [586, 294], [580, 344],
      [496, 372], [462, 404], [446, 434], [448, 446], [398, 446],
      [348, 434], [308, 396], [262, 326], [250, 240]
    ]),
    uruguay: P([
      [626, 218], [812, 212], [836, 316], [724, 342], [644, 310], [622, 258]
    ]),
    parana: P([
      [522, 166], [556, 166], [552, 216], [584, 292], [560, 298], [526, 234], [520, 186]
    ])
  };

  function isSouthAmericaWater(x, y) {
    if (pointInPolygon(x, y, SA_SHAPES.parana)) return true;
    return (
      !pointInPolygon(x, y, SA_SHAPES.argentina) &&
      !pointInPolygon(x, y, SA_SHAPES.uruguay) &&
      !pointInPolygon(x, y, SA_SHAPES.chile) &&
      !pointInPolygon(x, y, SA_SHAPES.venezuela) &&
      !pointInPolygon(x, y, SA_SHAPES.southAmericaNorth)
    );
  }

  // ==========================================================================
  // UTILIDADES GEOMÉTRICAS
  // ==========================================================================
  function smoothClosedPath(ctx, pts) {
    const n = pts.length;
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    ctx.beginPath();
    const start = mid(pts[n - 1], pts[0]);
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const m = mid(p, pts[(i + 1) % n]);
      ctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
    }
    ctx.closePath();
  }

  function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x;
      const yi = poly[i].y;
      const xj = poly[j].x;
      const yj = poly[j].y;
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function pointInEllipse(x, y, e) {
    const dx = x - e.x;
    const dy = y - e.y;
    const c = Math.cos(-e.rot);
    const s = Math.sin(-e.rot);
    const rx = dx * c - dy * s;
    const ry = dx * s + dy * c;
    return (rx * rx) / (e.rx * e.rx) + (ry * ry) / (e.ry * e.ry) <= 1.0;
  }

  function isSpainMapLand(x, y) {
    if (
      pointInPolygon(x, y, SPAIN_SHAPES.spain) ||
      pointInPolygon(x, y, SPAIN_SHAPES.portugal) ||
      pointInPolygon(x, y, SPAIN_SHAPES.france) ||
      pointInPolygon(x, y, SPAIN_SHAPES.africa)
    ) {
      return true;
    }
    for (let i = 0; i < BALEARIC_ISLES.length; i++) {
      if (pointInEllipse(x, y, BALEARIC_ISLES[i])) return true;
    }
    for (let i = 0; i < CANARIAS_ISLES.length; i++) {
      if (pointInEllipse(x, y, CANARIAS_ISLES[i])) return true;
    }
    return false;
  }

  function isSpainMapWater(x, y) {
    return !isSpainMapLand(x, y);
  }

  // ==========================================================================
  // NIVEL 3: SUBMAPAS LOCALES DE ZONAS POR CIUDAD
  // ==========================================================================
  const CITY_SUBMAPS = {
    barcelona: {
      title: 'BARCELONA · RUTA URBANA',
      seaColorTop: '#38bdf8',
      seaColorBottom: '#0369a1',
      bgFill: '#efe3c6',
      accentLabel: 'COSTA DE BARCELONA',
      coastPoly: P([
        [0, 322], [185, 318], [320, 336], [490, 344], [690, 362], [960, 342],
        [960, 540], [0, 540]
      ]),
      parkPolys: [
        P([[460, 108], [670, 96], [718, 178], [612, 232], [478, 204]]), // Collserola / Park Güell
        P([[110, 130], [270, 118], [295, 224], [148, 240]])             // Montjuïc verde
      ],
      gridColor: 'rgba(180, 130, 70, 0.22)',
      nodes: {
        1: { x: 205, y: 342, icon: '🏖️', fallback: '1. La Barceloneta' },
        2: { x: 385, y: 266, icon: '🏰', fallback: '2. El Gòtic' },
        3: { x: 580, y: 168, icon: '🦎', fallback: '3. Park Güell' },
        4: { x: 765, y: 266, icon: '⛪', fallback: '4. Sagrada Familia' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 268, y: 274 } },
        { a: 2, b: 3, ctrl: { x: 462, y: 186 } },
        { a: 3, b: 4, ctrl: { x: 696, y: 174 } }
      ],
      isWater: (x, y, polyCheck) => polyCheck(x, y, CITY_SUBMAPS.barcelona.coastPoly)
    },
    madrid: {
      title: 'MADRID · CENTRO HISTÓRICO',
      bgFill: '#f1ddb6',
      accentLabel: 'COMUNIDAD DE MADRID',
      riverWaypoints: [
        { x: 0, y: 404 }, { x: 210, y: 382 }, { x: 430, y: 416 }, { x: 700, y: 394 }, { x: 960, y: 422 }
      ],
      parkPolys: [
        P([[505, 178], [715, 166], [732, 338], [520, 344]]), // Parque del Retiro
        P([[115, 145], [275, 128], [282, 226], [130, 235]])  // Casa de Campo / Templo
      ],
      pondEllipse: { x: 632, y: 274, rx: 46, ry: 22, rot: -0.08 },
      gridColor: 'rgba(161, 98, 7, 0.18)',
      nodes: {
        1: { x: 200, y: 256, icon: '☀️', fallback: '1. Puerta del Sol' },
        2: { x: 392, y: 326, icon: '🏛️', fallback: '2. Plaza Mayor' },
        3: { x: 598, y: 248, icon: '🌳', fallback: '3. Parque del Retiro' },
        4: { x: 775, y: 176, icon: '👑', fallback: '4. Palacio Real y Almudena' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 278, y: 326 } },
        { a: 2, b: 3, ctrl: { x: 515, y: 318 } },
        { a: 3, b: 4, ctrl: { x: 702, y: 184 } }
      ],
      isWater: (x, y) => pointInEllipse(x, y, CITY_SUBMAPS.madrid.pondEllipse)
    },
    palma: {
      title: 'PALMA DE MALLORCA · RUTA ISLEÑA',
      seaColorTop: '#22d3ee',
      seaColorBottom: '#0284c7',
      islandPoly: P([
        [98, 224], [190, 134], [356, 108], [545, 118], [712, 144], [848, 214],
        [868, 304], [794, 370], [648, 356], [534, 316], [420, 304], [288, 344],
        [152, 346], [90, 294]
      ]),
      parkPolys: [
        P([[285, 142], [472, 132], [492, 222], [312, 232]]) // Serra / Bellver
      ],
      nodes: {
        1: { x: 205, y: 286, icon: '⛪', fallback: '1. La Seu y Paseo Marítimo' },
        2: { x: 382, y: 176, icon: '🏰', fallback: '2. Castell de Bellver' },
        3: { x: 590, y: 202, icon: '🌊', fallback: '3. Calas y Acantilados' },
        4: { x: 770, y: 326, icon: '🗼', fallback: '4. Puerto de Palma y Faro' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 256, y: 196 } },
        { a: 2, b: 3, ctrl: { x: 486, y: 152 } },
        { a: 3, b: 4, ctrl: { x: 716, y: 242 } }
      ],
      isWater: (x, y, polyCheck) => !polyCheck(x, y, CITY_SUBMAPS.palma.islandPoly)
    },
    canarias: {
      title: 'ISLAS CANARIAS · ARCHIPIÉLAGO VOLCÁNICO',
      seaColorTop: '#0ea5e9',
      seaColorBottom: '#0c4a6e',
      islands: [
        { x: 195, y: 326, rx: 78, ry: 54, rot: -0.15, fill: '#eab308', stroke: '#854d0e', label: 'GRAN CANARIA' },
        { x: 388, y: 218, rx: 72, ry: 50, rot: 0.14, fill: '#4ade80', stroke: '#166534', label: 'LA GOMERA' },
        { x: 590, y: 312, rx: 76, ry: 52, rot: -0.2, fill: '#78716c', stroke: '#292524', label: 'LANZAROTE' },
        { x: 770, y: 184, rx: 84, ry: 56, rot: 0.1, fill: '#a8a29e', stroke: '#44403c', label: 'TENERIFE' }
      ],
      nodes: {
        1: { x: 195, y: 326, icon: '🏜️', fallback: '1. Dunas de Maspalomas' },
        2: { x: 388, y: 218, icon: '🌲', fallback: '2. Bosque de Garajonay' },
        3: { x: 590, y: 312, icon: '🌋', fallback: '3. Timanfaya y Volcanes' },
        4: { x: 770, y: 184, icon: '🏔️', fallback: '4. Pico del Teide' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 268, y: 236 } },
        { a: 2, b: 3, ctrl: { x: 488, y: 294 } },
        { a: 3, b: 4, ctrl: { x: 702, y: 274 } }
      ],
      isWater: (x, y) => {
        const isles = CITY_SUBMAPS.canarias.islands;
        for (let i = 0; i < isles.length; i++) {
          if (pointInEllipse(x, y, isles[i])) return false;
        }
        return true;
      }
    },
    buenosaires: {
      title: 'BUENOS AIRES · CAPITAL DEL SUR',
      seaColorTop: '#0284c7',
      seaColorBottom: '#1e3a8a',
      bgFill: '#efe1c2',
      coastLabel: 'RÍO DE LA PLATA',
      coastLabelX: 830,
      coastLabelY: 360,
      coastPoly: P([
        [680, 75], [960, 75], [960, 540], [720, 540], [735, 395], [690, 270], [705, 165]
      ]),
      parkPolys: [
        P([[220, 118], [415, 108], [435, 198], [240, 206]]), // Bosques de Palermo
        P([[580, 255], [692, 240], [712, 340], [600, 355]])  // Reserva Ecológica Costanera Sur
      ],
      gridColor: 'rgba(120, 80, 40, 0.22)',
      nodes: {
        1: { x: 250, y: 392, icon: '🎭', fallback: '1. Caminito (La Boca)' },
        2: { x: 405, y: 274, icon: '🌃', fallback: '2. Avenida Corrientes' },
        3: { x: 642, y: 298, icon: '🚢', fallback: '3. Puerto Madero' },
        4: { x: 455, y: 156, icon: '🚆', fallback: '4. Tren Mitre a Retiro' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 300, y: 304 } },
        { a: 2, b: 3, ctrl: { x: 525, y: 264 } },
        { a: 3, b: 4, ctrl: { x: 580, y: 185 } }
      ],
      isWater: (x, y, polyCheck) => polyCheck(x, y, CITY_SUBMAPS.buenosaires.coastPoly)
    },
    rosario: {
      title: 'ROSARIO · BALCÓN AL PARANÁ',
      fluvialRiver: true,
      seaColorTop: '#459ea8',
      seaColorMid: '#5f9a86',
      seaColorBottom: '#85855c',
      coastStroke: '#a6895b',
      bgFill: '#e8e2ce',
      accentLabel: 'RÍO PARANÁ E ISLAS DEL DELTA',
      coastLabel: 'RÍO PARANÁ',
      coastLabelX: 756,
      coastLabelY: 312,
      coastLabelAlign: 'center',
      coastPoly: P([
        [510, -15], [985, -15], [985, 555], [755, 555], [720, 465],
        [678, 392], [672, 344], [698, 282], [708, 214], [678, 158],
        [612, 108], [552, 62]
      ]),
      deltaIslands: [
        {
          label: 'ISLAS DEL DELTA',
          labelX: 856,
          labelY: 146,
          fillTop: '#4ade80',
          fillBottom: '#15803d',
          stroke: '#8a6d3b',
          poly: P([[788, 86], [858, 74], [916, 108], [932, 168], [898, 212], [835, 198], [786, 146]])
        },
        {
          label: 'BANQUITO SAN ANDRÉS',
          labelX: 884,
          labelY: 348,
          fillTop: '#65a30d',
          fillBottom: '#166534',
          stroke: '#a38654',
          poly: P([[838, 266], [898, 252], [938, 298], [940, 386], [902, 438], [848, 418], [824, 344]])
        }
      ],
      parkPolys: [
        P([[185, 238], [395, 224], [418, 344], [202, 356]]), // Parque de la Independencia & Laguito
        P([[525, 315], [650, 304], [665, 396], [536, 405]])  // Parque Nacional a la Bandera
      ],
      gridColor: 'rgba(56, 112, 136, 0.20)',
      nodes: {
        1: { x: 602, y: 356, icon: '🏛️', fallback: '1. Monumento a la Bandera' },
        2: { x: 642, y: 214, icon: '🌉', fallback: '2. La Florida y Puente' },
        3: { x: 308, y: 292, icon: '🦢', fallback: '3. Parque Independencia' },
        4: { x: 486, y: 146, icon: '🏟️', fallback: '4. Arroyito (El Gigante)' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 654, y: 282 } },
        { a: 2, b: 3, ctrl: { x: 468, y: 256 } },
        { a: 3, b: 4, ctrl: { x: 382, y: 176 } }
      ],
      isWater: (x, y, polyCheck) => {
        const ro = CITY_SUBMAPS.rosario;
        if (!polyCheck(x, y, ro.coastPoly)) return false;
        if (Array.isArray(ro.deltaIslands)) {
          for (let i = 0; i < ro.deltaIslands.length; i++) {
            if (polyCheck(x, y, ro.deltaIslands[i].poly)) return false;
          }
        }
        return true;
      }
    },
    cordoba: {
      title: 'CÓRDOBA · SIERRAS Y VALLES',
      bgFill: '#dce4b6',
      accentLabel: 'SIERRAS DE CÓRDOBA',
      gridColor: 'rgba(133, 77, 14, 0.14)',
      parkPolys: [
        P([[88, 108], [232, 96], [278, 250], [228, 396], [88, 412]]),   // Altas Cumbres
        P([[192, 92], [404, 88], [418, 174], [218, 188]]),               // Cerro Uritorco y Punilla Norte
        P([[528, 94], [612, 92], [608, 342], [534, 336]]),               // Sierras Chicas
        P([[352, 316], [588, 312], [606, 408], [338, 412]])              // Valle de Calamuchita
      ],
      pondEllipse: { x: 405, y: 242, rx: 58, ry: 32, rot: -0.22 },
      riverWaypoints: [
        { x: 650, y: 74 },
        { x: 662, y: 146 },
        { x: 646, y: 214 },
        { x: 632, y: 286 },
        { x: 648, y: 365 },
        { x: 636, y: 448 }
      ],
      nodes: {
        1: { x: 706, y: 222, icon: '🏛️', fallback: '1. Córdoba Capital' },
        2: { x: 504, y: 214, icon: '🕰️', fallback: '2. Villa Carlos Paz' },
        3: { x: 484, y: 358, icon: '🍺', fallback: '3. Villa General Belgrano' },
        4: { x: 248, y: 148, icon: '🛸', fallback: '4. Cerro Uritorco' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 605, y: 190 } },
        { a: 2, b: 3, ctrl: { x: 528, y: 288 } },
        { a: 3, b: 4, ctrl: { x: 274, y: 310 } }
      ],
      isWater: (x, y) => pointInEllipse(x, y, CITY_SUBMAPS.cordoba.pondEllipse)
    },
    ushuaia: {
      title: 'USHUAIA · TIERRA DEL FUEGO · FIN DEL MUNDO',
      bgFill: '#dce8f5',
      accentLabel: 'CANAL BEAGLE Y GLACIAR MARTIAL',
      gridColor: 'rgba(71, 85, 105, 0.14)',
      coastPoly: P([[0, 348], [185, 362], [395, 374], [590, 346], [790, 326], [960, 294], [960, 540], [0, 540]]),
      coastStroke: '#cbd5e1',
      seaColorTop: '#0ea5e9',
      seaColorBottom: '#0c4a6e',
      coastLabel: 'CANAL BEAGLE · FIN DEL MUNDO',
      coastLabelAlign: 'center',
      coastLabelX: 430,
      coastLabelY: 422,
      islands: [
        { x: 752, y: 348, rx: 56, ry: 22, rot: -0.06, fill: '#94a3b8', stroke: '#334155', label: '' }
      ],
      nodes: {
        1: { x: 248, y: 326, icon: '🪵', fallback: '1. Ushuaia Centro' },
        2: { x: 164, y: 206, icon: '🚂', fallback: '2. Tren del Fin del Mundo' },
        3: { x: 465, y: 156, icon: '🏔️', fallback: '3. Glaciar Martial' },
        4: { x: 752, y: 344, icon: '🗼', fallback: '4. Faro Les Éclaireurs' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 162, y: 278 } },
        { a: 2, b: 3, ctrl: { x: 304, y: 144 } },
        { a: 3, b: 4, ctrl: { x: 642, y: 204 } }
      ],
      isWater: (x, y, polyCheck) =>
        polyCheck(x, y, CITY_SUBMAPS.ushuaia.coastPoly) &&
        Math.hypot((x - 752) / 56, (y - 348) / 22) > 1
    },
    chile_santiago: {
      title: 'SANTIAGO DE CHILE · VALLE CENTRAL Y CORDILLERA',
      customTerrain: 'chile_santiago',
      bgFill: '#efe1c1',
      gridColor: 'rgba(120, 80, 40, 0.14)',
      nodes: {
        1: { x: 185, y: 350, icon: '🏛️', fallback: '1. Plaza de Armas y La Moneda' },
        2: { x: 408, y: 214, icon: '🚡', fallback: '2. Cerro San Cristóbal' },
        3: { x: 585, y: 320, icon: '🎨', fallback: '3. Barrio Lastarria y Bellavista' },
        4: { x: 768, y: 175, icon: '🏔️', fallback: '4. Costanera Center y Cordillera de los Andes' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 265, y: 260 } },
        { a: 2, b: 3, ctrl: { x: 515, y: 255 } },
        { a: 3, b: 4, ctrl: { x: 710, y: 270 } }
      ],
      isWater: () => false
    },
    chile_vina: {
      title: 'VIÑA DEL MAR Y VALPARAÍSO · BAHÍA PACÍFICA',
      customTerrain: 'chile_vina',
      seaColorTop: '#0ea5e9',
      seaColorBottom: '#0c4a6e',
      bgFill: '#f1e4c4',
      coastLabel: 'OCÉANO PACÍFICO',
      coastLabelX: 165,
      coastLabelY: 325,
      coastPoly: P([
        [-15, -15], [275, -15], [242, 128], [268, 224], [326, 326], [372, 425], [420, 555], [-15, 555]
      ]),
      nodes: {
        1: { x: 300, y: 152, icon: '🌺', fallback: '1. Reloj de Flores y Reñaca' },
        2: { x: 520, y: 176, icon: '🎤', fallback: '2. Quinta Vergara' },
        3: { x: 688, y: 318, icon: '🚋', fallback: '3. Cerros y Ascensores de Valparaíso' },
        4: { x: 432, y: 402, icon: '⚓', fallback: '4. Puerto de Valparaíso' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 410, y: 142 } },
        { a: 2, b: 3, ctrl: { x: 635, y: 230 } },
        { a: 3, b: 4, ctrl: { x: 580, y: 395 } }
      ],
      isWater: (x, y, polyCheck) => polyCheck(x, y, CITY_SUBMAPS.chile_vina.coastPoly)
    },
    chile_atacama: {
      title: 'DESIERTO DE ATACAMA · ALTIPLANO Y SALAR',
      customTerrain: 'chile_atacama',
      bgFill: '#e8c493',
      nodes: {
        1: { x: 195, y: 168, icon: '🌙', fallback: '1. Valle de la Luna' },
        2: { x: 415, y: 356, icon: '🌋', fallback: '2. Géiseres del Tatio' },
        3: { x: 608, y: 244, icon: '🧂', fallback: '3. Salar de Atacama' },
        4: { x: 785, y: 158, icon: '🔭', fallback: '4. Observatorio Astronómico ALMA' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 268, y: 295 } },
        { a: 2, b: 3, ctrl: { x: 525, y: 312 } },
        { a: 3, b: 4, ctrl: { x: 715, y: 185 } }
      ],
      isWater: () => false
    },
    chile_pascua: {
      title: 'ISLA DE PASCUA (RAPA NUI) · OMBLIGO DEL MUNDO',
      customTerrain: 'chile_pascua',
      seaColorTop: '#0284c7',
      seaColorBottom: '#1e3a8a',
      bgFill: '#0c4a6e',
      islandPoly: P([
        [172, 355], [275, 232], [462, 128], [665, 185], [826, 276],
        [760, 342], [512, 392], [255, 396]
      ]),
      nodes: {
        1: { x: 755, y: 285, icon: '🌅', fallback: '1. Ahu Tongariki' },
        2: { x: 540, y: 256, icon: '🗿', fallback: '2. Volcán Rano Raraku' },
        3: { x: 458, y: 162, icon: '🏝️', fallback: '3. Playa Anakena' },
        4: { x: 245, y: 340, icon: '🌋', fallback: '4. Volcán Rano Kau' }
      },
      edges: [
        { a: 1, b: 2, ctrl: { x: 648, y: 248 } },
        { a: 2, b: 3, ctrl: { x: 515, y: 192 } },
        { a: 3, b: 4, ctrl: { x: 310, y: 220 } }
      ],
      isWater: (x, y, polyCheck) => !polyCheck(x, y, CITY_SUBMAPS.chile_pascua.islandPoly)
    }
  };

  // --- Mapa Nacional de Chile (Continente angosto N-S + Sudamérica al Este + Rapa Nui en el Pacífico) ---
  const CHILE_NODES = {
    chile_santiago: { x: 572, y: 278, number: 1 },
    chile_vina: { x: 512, y: 234, number: 2 },
    chile_atacama: { x: 568, y: 112, number: 3 },
    chile_pascua: { x: 166, y: 306, number: 4 }
  };

  const CHILE_EDGES = [
    {
      a: 'chile_santiago',
      b: 'chile_vina',
      waypoints: [
        CHILE_NODES.chile_santiago,
        { x: 540, y: 256 },
        CHILE_NODES.chile_vina
      ]
    },
    {
      a: 'chile_vina',
      b: 'chile_atacama',
      waypoints: [
        CHILE_NODES.chile_vina,
        { x: 526, y: 175 },
        CHILE_NODES.chile_atacama
      ]
    },
    {
      a: 'chile_atacama',
      b: 'chile_pascua',
      waypoints: [
        CHILE_NODES.chile_atacama,
        { x: 472, y: 168 },
        { x: 318, y: 236 },
        CHILE_NODES.chile_pascua
      ]
    }
  ];

  const CHILE_SHAPES = {
    continentEast: P([
      [604, 48], [985, 48], [985, 555], [520, 555], [516, 496],
      [526, 442], [546, 384], [568, 326], [586, 268], [598, 200], [610, 128]
    ]),
    mainland: P([
      [542, 56], [604, 48], [610, 128], [598, 200], [586, 268],
      [568, 326], [546, 384], [526, 442], [516, 496], [478, 500],
      [472, 456], [488, 412], [498, 360], [508, 302], [502, 236],
      [520, 174], [534, 114]
    ]),
    pascuaIsland: P([
      [118, 314], [164, 276], [216, 316], [190, 336], [134, 334]
    ])
  };

  function isChileMapWater(x, y, polyCheck) {
    return (
      !polyCheck(x, y, CHILE_SHAPES.mainland) &&
      !polyCheck(x, y, CHILE_SHAPES.continentEast) &&
      !polyCheck(x, y, CHILE_SHAPES.pascuaIsland)
    );
  }

  function sampleCatmullRomChain(waypoints, samplesPerSeg = 36) {
    const pts = waypoints;
    const n = pts.length;
    const raw = [];
    const getPt = (idx) => {
      if (idx < 0) return { x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y };
      if (idx >= n) return { x: 2 * pts[n - 1].x - pts[n - 2].x, y: 2 * pts[n - 1].y - pts[n - 2].y };
      return pts[idx];
    };
    for (let i = 0; i < n - 1; i++) {
      const p0 = getPt(i - 1);
      const p1 = getPt(i);
      const p2 = getPt(i + 1);
      const p3 = getPt(i + 2);
      const steps = i === n - 2 ? samplesPerSeg : samplesPerSeg - 1;
      for (let s = 0; s <= steps; s++) {
        const t = s / samplesPerSeg;
        const t2 = t * t;
        const t3 = t2 * t;
        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        raw.push({ x, y });
      }
    }
    return raw;
  }

  // Muestrea una curva de Bézier cuadrática o cadena spline (waypoints) a espaciado uniforme
  function buildEdgePoints(edgeDef, nodesMap = SPAIN_NODES, waterFn = isSpainMapWater) {
    let raw = [];
    if (Array.isArray(edgeDef.waypoints) && edgeDef.waypoints.length >= 2) {
      raw = sampleCatmullRomChain(edgeDef.waypoints, 36);
    } else {
      const a = nodesMap[edgeDef.a];
      const b = nodesMap[edgeDef.b];
      const c = edgeDef.ctrl;
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const u = 1 - t;
        raw.push({
          x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
          y: u * u * a.y + 2 * u * t * c.y + t * t * b.y
        });
      }
    }
    const cum = [0];
    for (let i = 1; i < raw.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
    }
    const total = cum[cum.length - 1];
    const count = Math.max(2, Math.round(total / DOT_SPACING));
    const points = [];
    let seg = 1;
    for (let k = 0; k <= count; k++) {
      const target = (total * k) / count;
      while (seg < cum.length - 1 && cum[seg] < target) seg++;
      const span = Math.max(0.0001, cum[seg] - cum[seg - 1]);
      const f = (target - cum[seg - 1]) / span;
      const px = raw[seg - 1].x + (raw[seg].x - raw[seg - 1].x) * f;
      const py = raw[seg - 1].y + (raw[seg].y - raw[seg - 1].y) * f;
      points.push({
        x: px,
        y: py,
        inWater: !!waterFn(px, py, pointInPolygon)
      });
    }
    return { points, length: total, step: total / count };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function pointAt(edge, s) {
    const n = edge.points.length;
    const i = clamp(s, 0, n - 1);
    const i0 = Math.floor(i);
    const i1 = Math.min(n - 1, i0 + 1);
    const f = i - i0;
    const p0 = edge.points[i0];
    const p1 = edge.points[i1];
    return {
      x: p0.x + (p1.x - p0.x) * f,
      y: p0.y + (p1.y - p0.y) * f,
      inWater: f < 0.5 ? !!p0.inWater : !!p1.inWater
    };
  }

  // Dirección unitaria del camino en el sentido de s creciente (de 'a' hacia 'b')
  function tangentAt(edge, s, span = 1) {
    const n = edge.points.length;
    const i0 = clamp(Math.floor(s), 0, n - 2);
    const i1 = clamp(i0 + span, i0 + 1, n - 1);
    const dx = edge.points[i1].x - edge.points[i0].x;
    const dy = edge.points[i1].y - edge.points[i0].y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  // Dirección unitaria global (cuerda a -> b) de un segmento completo del camino
  function edgeChord(edge) {
    const pts = edge && edge.points ? edge.points : [];
    if (pts.length < 2) return { x: 1, y: 0 };
    const dx = pts[pts.length - 1].x - pts[0].x;
    const dy = pts[pts.length - 1].y - pts[0].y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // ==========================================================================
  // MAP SCREEN
  // ==========================================================================
  class MapScreen {
    constructor(game) {
      this.game = game;
      this.time = 0;

      this.level = 'world'; // 'world' | 'spain' | 'southamerica' | 'chile' | 'city'
      this.activeCity = 'barcelona';
      this.transition = null; // { kind: 'in' | 'out', fromLevel, toLevel, focusCity, t }
      this.anim = null; // animación de camino + unlock (País o Submapa de Ciudad)
      this.worldAnim = null; // animación transatlántica España -> América del Sur
      this.worldFlight = null; // vuelo bidireccional regular sobre el Atlántico
      this.pendingCityUnlock = null;
      this.pendingContinentUnlock = null;
      this.worldCam = { x: W / 2, y: H / 2, zoom: 1 };
      this.cursor = { kind: 'node', node: 'barcelona', edge: 0, s: 0 };
      this.saCursor = { kind: 'node', node: 'buenosaires', edge: 0, s: 0 };
      this.chileCursor = { kind: 'node', node: 'chile_santiago', edge: 0, s: 0 };
      this.zoneCursor = { kind: 'node', node: 1, edge: 0, s: 0 };
      this.worldNode = 'spain';
      this.autoTarget = null;
      this.saAutoTarget = null;
      this.chileAutoTarget = null;
      this.zoneAutoTarget = null;
      this.hoverPreviewNode = null;
      this.selectedLockedNode = null;

      this.tina = {
        x: 0,
        y: 0,
        facing: 'right',
        moving: false,
        anim: 0,
        inWater: false,
        hopT: 0,
        hopDur: 0.34,
        hopHeight: 16,
        wakeTimer: 0
      };
      this.unlockFx = {}; // city or zone key -> { t }
      this.shake = { key: null, t: 0 };
      this.fx = [];
      this.floaters = [];
      this.prevKeys = { left: false, right: false, up: false, down: false };
      this.resetConfirmOpen = false;
      this.resetConfirmCursor = 1;

      this.edges = SPAIN_EDGES.map((e) => {
        const built = buildEdgePoints(e);
        return { a: e.a, b: e.b, points: built.points, length: built.length, step: built.step };
      });
      this.saEdges = SA_EDGES.map((e) => {
        const built = buildEdgePoints(e, SA_NODES, isSouthAmericaWater);
        return { a: e.a, b: e.b, points: built.points, length: built.length, step: built.step };
      });
      this.chileEdges = CHILE_EDGES.map((e) => {
        const built = buildEdgePoints(e, CHILE_NODES, isChileMapWater);
        return { a: e.a, b: e.b, points: built.points, length: built.length, step: built.step };
      });
      this.cityEdges = {};
      Object.keys(CITY_SUBMAPS).forEach((cityKey) => {
        const sub = CITY_SUBMAPS[cityKey];
        this.cityEdges[cityKey] = sub.edges.map((e) => {
          const built = buildEdgePoints(e, sub.nodes, sub.isWater);
          return { a: e.a, b: e.b, points: built.points, length: built.length, step: built.step };
        });
      });
    }

    getCountryMeta(countryLevel = this.level) {
      if (countryLevel === 'southamerica') {
        return {
          level: 'southamerica',
          nodes: SA_NODES,
          edges: this.saEdges,
          cursorKey: 'saCursor',
          autoTargetKey: 'saAutoTarget',
          defaultCity: 'buenosaires'
        };
      }
      if (countryLevel === 'chile') {
        return {
          level: 'chile',
          nodes: CHILE_NODES,
          edges: this.chileEdges,
          cursorKey: 'chileCursor',
          autoTargetKey: 'chileAutoTarget',
          defaultCity: 'chile_santiago'
        };
      }
      return {
        level: 'spain',
        nodes: SPAIN_NODES,
        edges: this.edges,
        cursorKey: 'cursor',
        autoTargetKey: 'autoTarget',
        defaultCity: 'barcelona'
      };
    }

    // ----------------------------------------------------------------------
    // Apertura de la escena
    // opts: { level: 'world' | 'spain' | 'city', cursorCity, cursorZone, unlockAnim, zoneUnlockAnim }
    // ----------------------------------------------------------------------
    open(opts = {}) {
      this.time = 0;
      this.transition = null;
      this.anim = null;
      this.worldAnim = null;
      this.worldFlight = null;
      const cityUnlockAnim = opts.unlockAnim || opts.pendingCityUnlock || null;
      const contUnlockAnim = opts.worldUnlockAnim || opts.pendingContinentUnlock || null;
      this.pendingCityUnlock = cityUnlockAnim;
      this.pendingContinentUnlock = contUnlockAnim;
      this.worldCam = { x: W / 2, y: H / 2, zoom: 1 };
      if (this.game && this.game.sound && typeof this.game.sound.stopBiplaneAmbience === 'function') {
        this.game.sound.stopBiplaneAmbience();
      }
      this.autoTarget = null;
      this.saAutoTarget = null;
      this.chileAutoTarget = null;
      this.zoneAutoTarget = null;
      this.hoverPreviewNode = null;
      this.selectedLockedNode = null;
      this.fx = [];
      this.floaters = [];
      this.unlockFx = {};
      this.shake = { key: null, t: 0 };
      this.resetConfirmOpen = false;
      this.resetConfirmCursor = 1;
      this.worldNode = 'spain';
      if (opts.level === 'city' && !isCountryTempLocked(opts.cursorCity)) {
        this.level = 'city';
      } else if (opts.level === 'chile' && !isCountryTempLocked('chile')) {
        this.level = 'chile';
      } else if (opts.level === 'southamerica') {
        this.level = 'southamerica';
      } else if (opts.level === 'spain') {
        this.level = 'spain';
      } else {
        this.level = 'world';
      }

      const lastTarget = WorldProgress.getLastPlayedTarget
        ? WorldProgress.getLastPlayedTarget()
        : { lastPlayedContinent: 'europa', continent: 'spain', cityKey: 'barcelona', zoneNum: 1, mapLevel: 'city' };
      const preferred = opts.cursorCity || lastTarget.cityKey;
      const highestSpainCity = ['canarias', 'palma', 'madrid', 'barcelona'].find((k) => WorldProgress.isUnlocked(k)) || 'barcelona';
      const highestChileCity = ['chile_pascua', 'chile_atacama', 'chile_vina', 'chile_santiago'].find((k) => WorldProgress.isUnlocked(k)) || 'chile_santiago';
      const highestSaCity = ['ushuaia', 'cordoba', 'rosario', 'buenosaires'].find((k) => WorldProgress.isUnlocked(k)) || 'buenosaires';
      const startCity =
        SPAIN_NODES[preferred] && WorldProgress.isUnlocked(preferred) ? preferred : highestSpainCity;
      const startSaCity =
        SA_NODES[preferred] && WorldProgress.isUnlocked(preferred) ? preferred : highestSaCity;
      const startChileCity =
        CHILE_NODES[preferred] && WorldProgress.isUnlocked(preferred) ? preferred : highestChileCity;
      this.cursor = { kind: 'node', node: startCity, edge: 0, s: 0 };
      this.saCursor = { kind: 'node', node: startSaCity, edge: 0, s: 0 };
      this.chileCursor = { kind: 'node', node: startChileCity, edge: 0, s: 0 };
      this.activeCity =
        CITY_SUBMAPS[preferred] && WorldProgress.isUnlocked(preferred)
          ? preferred
          : (CITY_SUBMAPS[startChileCity] && WorldProgress.isUnlocked(startChileCity)
              ? startChileCity
              : (CITY_SUBMAPS[startSaCity] && WorldProgress.isUnlocked(startSaCity)
                  ? startSaCity
                  : (CITY_SUBMAPS[startCity] ? startCity : 'barcelona')));
      const reqWorldNode = opts.worldNode === 'southamerica' ? 'argentina' : opts.worldNode;
      if (reqWorldNode && WORLD_NODES[reqWorldNode] && WorldProgress.isContinentUnlocked(reqWorldNode)) {
        this.worldNode = reqWorldNode;
      } else if (this.level === 'world' && contUnlockAnim) {
        const animFrom = contUnlockAnim.from === 'southamerica' ? 'argentina' : (contUnlockAnim.from || 'spain');
        this.worldNode = WORLD_NODES[animFrom] ? animFrom : 'spain';
      } else if (isChileCityTag(preferred) && WorldProgress.isContinentUnlocked('chile')) {
        this.worldNode = 'chile';
      } else if (SA_NODES[preferred] && WorldProgress.isContinentUnlocked('argentina')) {
        this.worldNode = 'argentina';
      } else if (SPAIN_NODES[preferred]) {
        this.worldNode = 'spain';
      } else {
        const lc = lastTarget.continent === 'southamerica' ? 'argentina' : lastTarget.continent;
        this.worldNode = WORLD_NODES[lc] ? lc : 'spain';
      }
      const initialZone = opts.cursorZone || (this.activeCity === lastTarget.cityKey ? lastTarget.zoneNum : null);
      this.syncZoneCursor(this.activeCity, initialZone);

      const inp = this.game.input;
      this.prevKeys = { left: !!inp.left, right: !!inp.right, up: !!inp.up, down: !!inp.down };

      if (opts.zoneUnlockAnim && this.level === 'city') {
        this.startUnlockAnim(opts.zoneUnlockAnim.from, opts.zoneUnlockAnim.to, 'city', this.activeCity);
      } else if (this.level === 'city') {
        this.checkPendingCityPathAnim(this.activeCity);
      } else if (cityUnlockAnim && this.level === 'chile') {
        this.startUnlockAnim(cityUnlockAnim.from, cityUnlockAnim.to, 'chile');
      } else if (cityUnlockAnim && this.level === 'southamerica') {
        this.startUnlockAnim(cityUnlockAnim.from, cityUnlockAnim.to, 'southamerica');
      } else if (cityUnlockAnim && this.level === 'spain') {
        this.startUnlockAnim(cityUnlockAnim.from, cityUnlockAnim.to, 'spain');
      } else if (contUnlockAnim && this.level === 'world') {
        this.startWorldUnlockAnim(contUnlockAnim.from, contUnlockAnim.to);
      }

      if (this.level === 'city') {
        const p = this.zoneCursorPos();
        this.tina.x = p.x;
        this.tina.y = p.y;
      } else if (this.level === 'spain' || this.level === 'southamerica' || this.level === 'chile') {
        const p = this.cursorPos(this.level);
        this.tina.x = p.x;
        this.tina.y = p.y;
      } else {
        const wn = WORLD_NODES[this.worldNode] || WORLD_NODES.spain;
        this.tina.x = wn.x;
        this.tina.y = wn.y;
      }
      this.tina.facing = 'right';
      this.tina.inWater = false;
      this.tina.hopT = 0;
      this.tina.wakeTimer = 0;
    }

    syncZoneCursor(cityKey, preferredZone = null) {
      const unlocked = WorldProgress.getUnlockedZones(cityKey);
      const fallback = WorldProgress.getLastPlayedZone(cityKey);
      let z = Math.floor(Number(preferredZone) || fallback || 1);
      if (!unlocked.includes(z)) {
        z = unlocked.length ? unlocked[unlocked.length - 1] : 1;
      }
      this.zoneCursor = { kind: 'node', node: z, edge: 0, s: 0 };
      this.zoneAutoTarget = null;
    }

    getZoneDisplayName(cityKey, zoneNum) {
      const def = this.cityDef(cityKey);
      const lv = def && Array.isArray(def.levels) ? def.levels[zoneNum - 1] : null;
      if (lv && lv.name) return lv.name;
      const sub = CITY_SUBMAPS[cityKey];
      return (sub && sub.nodes[zoneNum] && sub.nodes[zoneNum].fallback) || `Zona ${zoneNum}`;
    }

    // ----------------------------------------------------------------------
    // Estado de desbloqueo "visual" (el nodo destino se ve bloqueado hasta que
    // termina de dibujarse el camino durante la animación)
    // ----------------------------------------------------------------------
    displayUnlocked(city) {
      if (this.anim && this.anim.scope !== 'city' && this.anim.to === city && this.anim.phase < 2) return false;
      return WorldProgress.isUnlocked(city);
    }

    displayZoneUnlocked(city, zoneNum) {
      if (
        this.anim &&
        this.anim.scope === 'city' &&
        this.anim.city === city &&
        this.anim.to === zoneNum &&
        this.anim.phase < 2
      ) {
        return false;
      }
      return WorldProgress.isZoneUnlocked(city, zoneNum);
    }

    displayContinentUnlocked(continent) {
      const norm = continent === 'southamerica' ? 'argentina' : continent;
      if (norm === 'spain') return true;
      if (norm === 'venezuela') return false;
      if (this.worldAnim && this.worldAnim.phase < 2) {
        const waTo = this.worldAnim.to === 'southamerica' ? 'argentina' : this.worldAnim.to;
        if (waTo === norm) return false;
      }
      return WorldProgress.isContinentUnlocked(norm);
    }

    startWorldUnlockAnim(from = 'spain', to = 'argentina') {
      const f = from === 'southamerica' ? 'argentina' : (WORLD_NODES[from] ? from : 'spain');
      const destKey = to === 'southamerica' ? 'argentina' : (WORLD_NODES[to] ? to : 'argentina');
      this.worldFlight = null;
      this.pendingContinentUnlock = { from: f, to: destKey };
      this.worldAnim = {
        from: f,
        to: destKey,
        phase: 0,
        t: 0,
        progress: 0,
        fxAcc: 0
      };
      this.worldNode = f;
      const startNode = WORLD_NODES[f] || WORLD_NODES.spain;
      this.tina.x = startNode.x;
      this.tina.y = startNode.y;
      this.unlockFx[`world:${f}`] = { t: 0 };
      if (this.game && this.game.sound) {
        if (typeof this.game.sound.stopMenuMusic === 'function') this.game.sound.stopMenuMusic();
        if (typeof this.game.sound.startBiplaneAmbience === 'function') {
          this.game.sound.startBiplaneAmbience({ withDiscoveryTheme: true });
        }
      }
      this.floaters.push({
        x: startNode.x,
        y: startNode.y - 42,
        text: f === 'argentina' ? '🏆 ¡ARGENTINA 100% COMPLETADA!' : '🏆 ¡ESPAÑA 100% COMPLETADA!',
        life: 2.8,
        max: 2.8,
        color: '#fde047'
      });
    }

    evalQuadBezier(a, b, c, t) {
      const u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
        y: u * u * a.y + 2 * u * t * c.y + t * t * b.y
      };
    }

    getWorldRoutePoint(progress, from = 'spain', to = 'argentina') {
      const nf = from === 'southamerica' ? 'argentina' : from;
      const nt = to === 'southamerica' ? 'argentina' : to;
      const a = WORLD_NODES[nf] || WORLD_NODES.spain;
      const b = WORLD_NODES[nt] || WORLD_NODES.argentina;
      const t = Math.max(0, Math.min(1, Number(progress) || 0));
      const edge = WORLD_EDGES.find((e) => (e.a === nf && e.b === nt) || (e.a === nt && e.b === nf));
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const maxArcHeight = edge ? edge.arcHeight : Math.max(24, Math.min(72, dist * 0.24));
      const baseX = a.x + (b.x - a.x) * t;
      const baseLineY = a.y + (b.y - a.y) * t;
      const arcOffset = Math.sin(t * Math.PI) * maxArcHeight;
      return {
        x: baseX,
        y: baseLineY - arcOffset
      };
    }

    motionFromSamplePoints(pt, a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dir = dx >= 0 ? 1 : -1;
      // Pitch in avioneta's local forward frame (flipped horizontally when flying left)
      const localAngle = Math.atan2(dy, Math.abs(dx) || 1);
      const pitch = Math.max(-0.34, Math.min(0.34, localAngle * 0.72));
      return { pt, dir, pitch };
    }

    getWorldRouteMotion(progress, from = 'spain', to = 'argentina') {
      const p0 = Math.max(0, Math.min(1, progress));
      const p1 = Math.min(1, p0 + 0.02);
      const pPrev = Math.max(0, p0 - 0.02);
      const pt = this.getWorldRoutePoint(p0, from, to);
      const a = p0 === 0 ? pt : this.getWorldRoutePoint(pPrev, from, to);
      const b = p0 === 1 ? pt : this.getWorldRoutePoint(p1, from, to);
      return this.motionFromSamplePoints(pt, a, b);
    }

    getFlightMotion(flight) {
      if (!flight) return this.getWorldRouteMotion(0, 'spain', 'argentina');
      if (flight.startPt) {
        const dest = WORLD_NODES[flight.to] || WORLD_NODES.argentina;
        const p0 = Math.max(0, Math.min(1, flight.progress || 0));
        const arcH = Math.max(18, Math.min(56, Math.hypot(dest.x - flight.startPt.x, dest.y - flight.startPt.y) * 0.22));
        const samplePt = (tt) => ({
          x: flight.startPt.x + (dest.x - flight.startPt.x) * tt,
          y: flight.startPt.y + (dest.y - flight.startPt.y) * tt - Math.sin(tt * Math.PI) * arcH
        });
        const pPrev = Math.max(0, p0 - 0.02);
        const pNext = Math.min(1, p0 + 0.02);
        return this.motionFromSamplePoints(samplePt(p0), samplePt(pPrev), samplePt(pNext));
      }
      return this.getWorldRouteMotion(flight.progress, flight.from || 'spain', flight.to || 'argentina');
    }

    spawnLandingDust(x, y) {
      const dustColors = ['#fef3c7', '#e2e8f0', '#fde68a', '#cbd5e1'];
      for (let i = 0; i < 18; i++) {
        const ang = -Math.PI + (Math.PI * i) / 17;
        const spd = 28 + Math.random() * 68;
        this.fx.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + 4,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd * 0.45 - 12,
          life: 0.45 + Math.random() * 0.35,
          max: 0.8,
          size: 2.8 + Math.random() * 3.0,
          color: dustColors[i % dustColors.length]
        });
      }
    }

    updateWorldCam(dt) {
      let targetX = W / 2;
      let targetY = H / 2;
      let targetZoom = 1;

      if (this.worldAnim) {
        const wa = this.worldAnim;
        if (wa.phase === 0) {
          const sp = WORLD_NODES[wa.from] || WORLD_NODES.spain;
          const ease = Math.min(1, wa.t / 0.8);
          targetX = W / 2 + (sp.x - W / 2) * 0.65 * ease;
          targetY = H / 2 + (sp.y - H / 2) * 0.65 * ease;
          targetZoom = 1 + 0.28 * ease;
        } else if (wa.phase === 1) {
          const pt = this.getWorldRoutePoint(wa.progress, wa.from, wa.to);
          const focusMix = Math.sin(Math.PI * wa.progress);
          targetZoom = 1 + 0.52 * focusMix;
          targetX = W / 2 + (pt.x - W / 2) * (0.55 + 0.45 * focusMix);
          targetY = H / 2 + (pt.y - H / 2) * (0.55 + 0.45 * focusMix);
        }
      } else if (this.worldFlight) {
        const wf = this.worldFlight;
        const pt = this.getFlightMotion(wf).pt;
        const t = wf.progress || 0;
        const focusMix = Math.sin(Math.PI * t);
        targetZoom = 1 + 0.28 * focusMix;
        targetX = W / 2 + (pt.x - W / 2) * 0.65 * focusMix;
        targetY = H / 2 + (pt.y - H / 2) * 0.65 * focusMix;
      }

      const halfW = W / (2 * targetZoom);
      const halfH = H / (2 * targetZoom);
      targetX = Math.max(halfW, Math.min(W - halfW, targetX));
      targetY = Math.max(halfH, Math.min(H - halfH, targetY));

      const lerpK = 1 - Math.exp(-dt * 4.2);
      this.worldCam.x += (targetX - this.worldCam.x) * lerpK;
      this.worldCam.y += (targetY - this.worldCam.y) * lerpK;
      this.worldCam.zoom += (targetZoom - this.worldCam.zoom) * lerpK;
    }

    startWorldFlight(from, to) {
      const nf = from === 'southamerica' ? 'argentina' : (this.worldNode || 'spain');
      let nt = to === 'southamerica' ? 'argentina' : to;
      if (!this.worldFlight && nf && nt && nf !== nt && !areWorldNeighbors(nf, nt)) {
        nt = nextWorldHop(nf, nt) || nt;
      }
      const destNode = nt ? WORLD_NODES[nt] : null;
      if (!destNode) return;

      if (this.worldFlight) {
        const wf = this.worldFlight;
        if (wf.to === nt) return;
        // Solo permitir revertir al origen de la ruta actual para no atajar en diagonal sobre el océano
        if (!wf.startPt && wf.from === nt) {
          const prevTo = wf.to;
          wf.to = nt;
          wf.from = prevTo;
          wf.progress = Math.max(0, Math.min(1, 1 - wf.progress));
          this.worldNode = nt;
          this.tina.facing = destNode.x >= this.tina.x ? 'right' : 'left';
          if (this.game && this.game.sound && typeof this.game.sound.menuSelect === 'function') {
            this.game.sound.menuSelect();
          }
        }
        return;
      }

      if (!nf || nf === nt || !areWorldNeighbors(nf, nt)) return;
      const startNode = WORLD_NODES[nf] || WORLD_NODES.spain;
      const dist = Math.hypot(destNode.x - startNode.x, destNode.y - startNode.y);
      this.worldNode = nt;
      this.tina.facing = destNode.x >= startNode.x ? 'right' : 'left';
      this.worldFlight = {
        from: nf,
        to: nt,
        progress: 0,
        dur: Math.max(0.75, Math.min(2.4, dist / 115)),
        fxAcc: 0
      };
      if (this.game && this.game.sound) {
        if (typeof this.game.sound.menuSelect === 'function') this.game.sound.menuSelect();
        if (typeof this.game.sound.startBiplaneAmbience === 'function') {
          this.game.sound.startBiplaneAmbience({ withDiscoveryTheme: false });
        }
      }
    }

    enterWorldUnlockPhase() {
      const wa = this.worldAnim;
      if (!wa) return;
      wa.phase = 2;
      wa.t = 0;
      wa.progress = 1;
      const destKey = wa.to === 'southamerica' ? 'argentina' : wa.to;
      this.worldNode = destKey;
      const dest = WORLD_NODES[destKey] || WORLD_NODES.argentina;
      this.tina.x = dest.x;
      this.tina.y = dest.y;
      this.tina.moving = false;
      this.unlockFx[`world:${destKey}`] = { t: 0 };
      if (this.game && this.game.sound) {
        if (typeof this.game.sound.stopBiplaneAmbience === 'function') this.game.sound.stopBiplaneAmbience();
        if (typeof this.game.sound.mapUnlock === 'function') this.game.sound.mapUnlock();
        this.syncMapMusic();
      }
      this.spawnLandingDust(dest.x, dest.y);
      const colors = ['#fde047', '#4ade80', '#38bdf8', '#f472b6', '#ffffff', '#fb923c'];
      for (let i = 0; i < 64; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 55 + Math.random() * 170;
        this.fx.push({
          x: dest.x,
          y: dest.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 36,
          life: 1.0 + Math.random() * 0.85,
          max: 1.85,
          size: 2.2 + Math.random() * 3.4,
          color: colors[i % colors.length]
        });
      }
      this.floaters.push({
        x: dest.x,
        y: dest.y - 44,
        text: destKey === 'chile' ? '🇨🇱 ¡CHILE DESBLOQUEADO!' : '🇦🇷 ¡ARGENTINA DESBLOQUEADA!',
        life: 3.2,
        max: 3.2,
        color: '#4ade80'
      });
    }

    updateWorldAnim(dt) {
      const wa = this.worldAnim;
      if (!wa) return;
      wa.t += dt;
      if (wa.phase === 0) {
        if (wa.t >= 0.45) {
          wa.phase = 1;
          wa.t = 0;
          if (this.game && this.game.sound && typeof this.game.sound.mapStep === 'function') {
            this.game.sound.mapStep(0);
          }
        }
      } else if (wa.phase === 1) {
        const dur = wa.to === 'chile' ? 2.8 : 5.5;
        wa.progress = Math.min(1, wa.t / dur);
        const motion = this.getWorldRouteMotion(wa.progress, wa.from, wa.to);
        wa.fxAcc += dt * 16;
        if (wa.fxAcc >= 1) {
          wa.fxAcc -= 1;
          this.fx.push({
            x: motion.pt.x - motion.dir * 22 + (Math.random() - 0.5) * 6,
            y: motion.pt.y - 12 + (Math.random() - 0.5) * 6,
            vx: -motion.dir * (10 + Math.random() * 14),
            vy: (Math.random() - 0.5) * 8,
            life: 0.65,
            max: 0.65,
            size: 2.2 + Math.random() * 1.8,
            color: 'rgba(255, 255, 255, 0.85)'
          });
        }
        this.tina.x = motion.pt.x;
        this.tina.y = motion.pt.y;
        this.tina.facing = motion.dir >= 0 ? 'right' : 'left';
        this.tina.moving = false;
        if (wa.progress >= 1) {
          this.enterWorldUnlockPhase();
        }
      } else if (wa.phase === 2) {
        this.tina.moving = false;
        const destKey = wa.to === 'southamerica' ? 'argentina' : wa.to;
        const dest = WORLD_NODES[destKey] || WORLD_NODES.argentina;
        this.moveTinaTo(dest.x, dest.y, dt);
        if (wa.t >= 2.5) {
          this.worldAnim = null;
          this.pendingContinentUnlock = null;
          this.worldNode = destKey;
        }
      }
      this.updateWorldCam(dt);
    }

    skipWorldAnim() {
      if (!this.worldAnim) return;
      const destKey = this.worldAnim.to === 'southamerica' ? 'argentina' : (this.worldAnim.to || 'argentina');
      if (this.worldAnim.phase < 2) {
        this.enterWorldUnlockPhase();
      } else {
        this.worldAnim = null;
        this.pendingContinentUnlock = null;
        this.worldNode = destKey;
      }
    }

    extractNameText(rawName, fallback = '') {
      if (typeof rawName === 'string') return rawName;
      if (rawName && typeof rawName === 'object') {
        const picked = rawName.es || rawName.ca || rawName.en || rawName.label;
        if (picked !== undefined && picked !== null) return String(picked);
      }
      if (rawName === undefined || rawName === null || rawName === '') {
        return fallback === undefined || fallback === null ? '' : String(fallback);
      }
      return String(rawName);
    }

    cityDef(city) {
      return (global.CITY_DEFS || {})[city] || { name: String(city || ''), playable: false };
    }

    findEdgeIndex(from, to, edges = this.edges) {
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if ((e.a === from && e.b === to) || (e.a === to && e.b === from)) return i;
      }
      return -1;
    }

    edgesOf(node, edges = this.edges) {
      const list = [];
      for (let i = 0; i < edges.length; i++) {
        if (edges[i].a === node) list.push({ idx: i, forward: true });
        else if (edges[i].b === node) list.push({ idx: i, forward: false });
      }
      return list;
    }

    canTravel(edge) {
      return this.displayUnlocked(edge.a) && this.displayUnlocked(edge.b);
    }

    canTravelZone(edge, city = this.activeCity) {
      return this.displayZoneUnlocked(city, edge.a) && this.displayZoneUnlocked(city, edge.b);
    }

    cursorPos(countryLevel = this.level) {
      const meta = this.getCountryMeta(countryLevel);
      const c = this[meta.cursorKey];
      if (c.kind === 'node') return meta.nodes[c.node] || meta.nodes[meta.defaultCity];
      return pointAt(meta.edges[c.edge], c.s);
    }

    zoneCursorPos(city = this.activeCity) {
      const c = this.zoneCursor;
      const sub = CITY_SUBMAPS[city] || CITY_SUBMAPS.barcelona;
      const edges = this.cityEdges[city] || [];
      if (c.kind === 'node') return sub.nodes[c.node] || sub.nodes[1];
      return pointAt(edges[c.edge], c.s);
    }

    checkPendingCityPathAnim(cityKey = this.activeCity) {
      if (!cityKey || !this.cityEdges[cityKey]) return false;
      for (let z = 2; z <= 4; z++) {
        if (WorldProgress.isZoneUnlocked(cityKey, z) && !WorldProgress.isZonePathAnimated(cityKey, z)) {
          this.startUnlockAnim(z - 1, z, 'city', cityKey);
          return true;
        }
      }
      return false;
    }

    // ----------------------------------------------------------------------
    // Animación de camino de puntitos + efecto Unlock (España, Sudamérica o Ciudad)
    // ----------------------------------------------------------------------
    startUnlockAnim(from, to, scope = 'spain', city = null) {
      const isCity = scope === 'city' && city && this.cityEdges[city];
      const countryScope = scope === 'chile' ? 'chile' : (scope === 'southamerica' ? 'southamerica' : 'spain');
      const meta = !isCity ? this.getCountryMeta(countryScope) : null;
      const edges = isCity ? this.cityEdges[city] : meta.edges;
      const idx = this.findEdgeIndex(from, to, edges);
      if (idx < 0) return;
      const edge = edges[idx];
      const n = edge.points.length;
      const forward = edge.a === from;
      const order = [];
      for (let i = 0; i < n; i++) order.push(forward ? i : n - 1 - i);
      const rank = new Array(n);
      order.forEach((pointIndex, r) => {
        rank[pointIndex] = r;
      });

      const cityDotCount = Math.max(1, n - 2);
      const cityDotsPerSec = Math.max(8, cityDotCount / 1.2);
      this.pendingCityUnlock = isCity ? null : { from, to, scope: countryScope };

      this.anim = {
        scope: isCity ? 'city' : countryScope,
        city: isCity ? city : null,
        from,
        to,
        edgeIdx: idx,
        phase: isCity ? 1 : 0, // En país muestra brevemente candado sin ruta (~0.25s) y luego traza en ~1.2s
        pauseDuration: isCity ? 0 : 0.25,
        t: 0,
        dotsShown: 0,
        dotAcc: isCity ? 0.5 : 0,
        dotsPerSecond: cityDotsPerSec,
        order,
        rank
      };
      if (isCity) {
        this.zoneCursor = { kind: 'node', node: from, edge: idx, s: 0 };
        const fromPos = (CITY_SUBMAPS[city] && CITY_SUBMAPS[city].nodes[from]) || null;
        if (fromPos) {
          this.tina.x = fromPos.x;
          this.tina.y = fromPos.y;
        }
      } else {
        this[meta.cursorKey] = { kind: 'node', node: from, edge: idx, s: 0 };
      }
    }

    enterUnlockPhase() {
      const a = this.anim;
      if (!a) return;
      a.phase = 2;
      a.t = 0;
      a.dotsShown = a.order.length;
      const isCity = a.scope === 'city';
      const meta = !isCity ? this.getCountryMeta(a.scope) : null;
      const fxKey = isCity ? `zone:${a.city}:${a.to}` : a.to;
      this.unlockFx[fxKey] = { t: 0 };
      if (isCity) {
        this.zoneCursor = { kind: 'node', node: a.from, edge: a.edgeIdx, s: 0 };
        if (WorldProgress.markZonePathAnimated) {
          WorldProgress.markZonePathAnimated(a.city, a.to);
        }
      } else {
        this[meta.cursorKey] = { kind: 'node', node: a.to, edge: a.edgeIdx, s: 0 };
      }
      this.game.sound.mapUnlock();
      const p = isCity
        ? ((CITY_SUBMAPS[a.city] && CITY_SUBMAPS[a.city].nodes[a.to]) || { x: W / 2, y: H / 2 })
        : meta.nodes[a.to];
      const colors = ['#fde047', '#f472b6', '#38bdf8', '#4ade80', '#ffffff', '#fb923c'];
      for (let i = 0; i < 46; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 50 + Math.random() * 150;
        this.fx.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 40,
          life: 0.9 + Math.random() * 0.7,
          max: 1.6,
          size: 2 + Math.random() * 3.2,
          color: colors[i % colors.length]
        });
      }
      const unlockedCityName = this.extractNameText(this.cityDef(a.to)?.name, 'NUEVA ZONA').toUpperCase();
      const labelText = isCity
        ? `🔓 ¡ZONA ${a.to} DESBLOQUEADA!`
        : a.to === 'chile'
        ? '🔓 ¡CHILE DESBLOQUEADO!'
        : `🔓 ¡${unlockedCityName} DESBLOQUEADA!`;
      this.floaters.push({
        x: p.x,
        y: p.y - 44,
        text: labelText,
        life: 2.6,
        max: 2.6,
        color: '#fde047'
      });
    }

    updateAnim(dt) {
      const a = this.anim;
      const isCity = a.scope === 'city';
      const meta = !isCity ? this.getCountryMeta(a.scope) : null;
      const edges = isCity ? (this.cityEdges[a.city] || this.edges) : meta.edges;
      a.t += dt;

      if (a.phase === 0) {
        const wait = a.pauseDuration !== undefined ? a.pauseDuration : 0.25;
        if (a.t >= wait) {
          a.phase = 1;
          a.t = 0;
          if (this.game && this.game.sound && typeof this.game.sound.mapStep === 'function') {
            this.game.sound.mapStep(0);
          }
        }
        this.updateTinaSurface(dt, false);
      } else if (a.phase === 1) {
        const rate = a.dotsPerSecond || DOTS_PER_SECOND;
        a.dotAcc += dt * rate;
        const n = a.order.length;
        while (a.dotAcc >= 1 && a.dotsShown < n - 1) {
          a.dotAcc -= 1;
          a.dotsShown++;
          if (isCity) {
            if (typeof this.game.sound.mapPathTick === 'function') {
              this.game.sound.mapPathTick(a.dotsShown, n);
            } else {
              this.game.sound.mapStep(a.dotsShown);
            }
          } else if (a.dotsShown % 2 === 0) {
            this.game.sound.mapStep(Math.floor(a.dotsShown / 2));
          }
        }
        if (isCity) {
          const fromPos = (CITY_SUBMAPS[a.city] && CITY_SUBMAPS[a.city].nodes[a.from]) || { x: W / 2, y: H / 2 };
          const destPos = (CITY_SUBMAPS[a.city] && CITY_SUBMAPS[a.city].nodes[a.to]) || fromPos;
          this.tina.x = fromPos.x;
          this.tina.y = fromPos.y;
          this.tina.facing = destPos.x >= fromPos.x ? 'right' : 'left';
          this.tina.moving = false;
          this.updateTinaSurface(dt, false);
        } else {
          // La Tina camina o nada en la punta del camino que se va dibujando
          const edge = edges[a.edgeIdx];
          const tip = edge.points[a.order[Math.min(a.dotsShown, n - 1)]];
          this.moveTinaTo(tip.x, tip.y, dt);
          this.tina.moving = true;
          this.updateTinaSurface(dt, !!tip.inWater);
        }
        if (a.dotsShown >= n - 1) {
          this.updateTinaSurface(dt, false);
          this.enterUnlockPhase();
        }
      } else if (a.phase === 2) {
        const dest = isCity
          ? ((CITY_SUBMAPS[a.city] && CITY_SUBMAPS[a.city].nodes[a.from]) || { x: W / 2, y: H / 2 })
          : meta.nodes[a.to];
        this.moveTinaTo(dest.x, dest.y, dt);
        this.tina.moving = false;
        this.updateTinaSurface(dt, false);
        const phase2Dur = isCity ? 1.1 : 1.35;
        if (a.t >= phase2Dur) {
          this.anim = null;
          this.pendingCityUnlock = null;
          if (isCity) {
            this.zoneCursor = { kind: 'node', node: a.from, edge: 0, s: 0 };
          } else {
            this[meta.cursorKey] = { kind: 'node', node: a.to, edge: 0, s: 0 };
          }
        }
      }
    }

    skipAnim() {
      if (!this.anim) return;
      if (this.anim.phase < 2) {
        this.tina.inWater = false;
        this.tina.hopT = 0;
        this.enterUnlockPhase();
      } else {
        const isCity = this.anim.scope === 'city';
        const meta = !isCity ? this.getCountryMeta(this.anim.scope) : null;
        const stayNode = isCity ? this.anim.from : this.anim.to;
        if (isCity && WorldProgress.markZonePathAnimated) {
          WorldProgress.markZonePathAnimated(this.anim.city, this.anim.to);
        }
        this.anim = null;
        this.pendingCityUnlock = null;
        if (isCity) {
          this.zoneCursor = { kind: 'node', node: stayNode, edge: 0, s: 0 };
        } else {
          this[meta.cursorKey] = { kind: 'node', node: stayNode, edge: 0, s: 0 };
        }
        this.tina.inWater = false;
        this.tina.hopT = 0;
      }
    }

    moveTinaTo(x, y, dt) {
      const dx = x - this.tina.x;
      if (Math.abs(dx) > 0.4) this.tina.facing = dx >= 0 ? 'right' : 'left';
      const k = 1 - Math.exp(-dt * 12);
      this.tina.x += dx * k;
      this.tina.y += (y - this.tina.y) * k;
    }

    spawnWaterSplash(x, y, count = 14) {
      const palette = ['#ffffff', '#e0f2fe', '#7dd3fc', '#38bdf8'];
      this.fx.push({
        kind: 'ring',
        x,
        y,
        vx: 0,
        vy: 0,
        gravity: 0,
        life: 0.42,
        max: 0.42,
        size: 5,
        maxRadius: 20,
        color: '#e0f2fe'
      });
      for (let i = 0; i < count; i++) {
        const ang = -Math.PI * 0.12 - Math.random() * Math.PI * 0.76;
        const spd = 45 + Math.random() * 85;
        this.fx.push({
          x,
          y,
          vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 28,
          vy: Math.sin(ang) * spd - 12,
          gravity: 270,
          life: 0.34 + Math.random() * 0.24,
          max: 0.58,
          size: 1.8 + Math.random() * 2.2,
          color: palette[i % palette.length]
        });
      }
    }

    supportsWaterSurface() {
      return (
        !this.transition &&
        (this.level === 'spain' ||
          this.level === 'southamerica' ||
          this.level === 'chile' ||
          (this.level === 'city' && (this.activeCity === 'canarias' || this.activeCity === 'chile_vina' || this.activeCity === 'chile_pascua')))
      );
    }

    updateTinaSurface(dt, inWater) {
      const targetWater = this.supportsWaterSurface() && !!inWater;
      if (targetWater !== this.tina.inWater) {
        this.tina.inWater = targetWater;
        this.tina.hopT = 0.001;
        this.tina.hopDur = targetWater ? 0.34 : 0.3;
        this.tina.hopHeight = targetWater ? 16 : 14;
        this.tina.wakeTimer = 0;
        this.spawnWaterSplash(this.tina.x, this.tina.y + 4, targetWater ? 14 : 9);
        if (this.game && this.game.sound && typeof this.game.sound.mapStep === 'function') {
          this.game.sound.mapStep(targetWater ? 6 : 2);
        }
      }

      if (this.tina.hopT > 0) {
        this.tina.hopT += dt;
        if (this.tina.hopT >= this.tina.hopDur) {
          this.tina.hopT = 0;
          if (this.tina.inWater) {
            this.spawnWaterSplash(this.tina.x, this.tina.y + 5, 16);
          }
        }
      }

      if (this.tina.inWater && this.tina.moving) {
        this.tina.wakeTimer += dt;
        if (this.tina.wakeTimer >= 0.11) {
          this.tina.wakeTimer = 0;
          const backSign = this.tina.facing === 'right' ? -1 : 1;
          for (let i = 0; i < 2; i++) {
            this.fx.push({
              x: this.tina.x + backSign * (8 + Math.random() * 6),
              y: this.tina.y + 4 + (Math.random() - 0.5) * 4,
              vx: backSign * (14 + Math.random() * 14),
              vy: (Math.random() - 0.5) * 14,
              gravity: 8,
              life: 0.34,
              max: 0.34,
              size: 1.6 + Math.random() * 1.4,
              color: i === 0 ? '#e0f2fe' : '#7dd3fc'
            });
          }
        }
      } else {
        this.tina.wakeTimer = 0;
      }
    }

    // ----------------------------------------------------------------------
    // Entradas
    // ----------------------------------------------------------------------
    confirm() {
      if (this.transition) return;
      if (this.worldAnim) {
        this.skipWorldAnim();
        return;
      }
      if (this.anim) {
        this.skipAnim();
        return;
      }

      if (this.level === 'world') {
        if (this.worldFlight) {
          const destNode = WORLD_NODES[this.worldNode] || WORLD_NODES.spain;
          this.worldFlight = null;
          this.tina.x = destNode.x;
          this.tina.y = destNode.y;
          if (this.game && this.game.sound && typeof this.game.sound.stopBiplaneAmbience === 'function') {
            this.game.sound.stopBiplaneAmbience();
          }
        }
        if (this.worldNode === 'spain') {
          this.startZoom('in', 'world', 'spain');
        } else if (this.worldNode === 'chile') {
          if (isCountryTempLocked('chile')) {
            this.denyNode('world:chile', WORLD_NODES.chile, '🔒 Chile · Próximamente');
          } else if (WorldProgress.isContinentUnlocked('chile')) {
            WorldProgress.unlock('chile_santiago');
            this.startZoom('in', 'world', 'chile');
          } else {
            this.denyNode('world:chile', WORLD_NODES.chile, '🔒 Completa Ushuaia en Argentina');
          }
        } else if (this.worldNode === 'venezuela') {
          this.denyNode('world:venezuela', WORLD_NODES.venezuela, '🔒 ?????');
        } else if (WorldProgress.isContinentUnlocked('argentina')) {
          WorldProgress.unlock('buenosaires');
          this.startZoom('in', 'world', 'southamerica');
        } else {
          this.denyNode('world:argentina', WORLD_NODES.argentina, '🔒 Completa las 4 ciudades de España');
        }
        return;
      }

      if (this.level === 'city') {
        const sub = CITY_SUBMAPS[this.activeCity] || CITY_SUBMAPS.barcelona;
        const zoneNum = this.getEffectiveNode(
          this.zoneCursor,
          this.cityEdges[this.activeCity] || [],
          sub.nodes,
          (z) => this.displayZoneUnlocked(this.activeCity, z)
        );
        if (zoneNum === null || zoneNum === undefined) return;
        this.zoneCursor = { kind: 'node', node: zoneNum, edge: 0, s: 0 };
        const node = sub.nodes[zoneNum];
        if (!WorldProgress.isZoneUnlocked(this.activeCity, zoneNum)) {
          this.denyNode(`zone:${this.activeCity}:${zoneNum}`, node, '🔒 Zona bloqueada: completá la anterior');
        } else {
          this.tina.x = node.x;
          this.tina.y = node.y;
          WorldProgress.setLastPlayedLocation(this.activeCity, zoneNum);
          this.game.enterZone(this.activeCity, zoneNum - 1);
        }
        return;
      }

      const meta = this.getCountryMeta(this.level);
      if (this.selectedLockedNode && (meta.nodes[this.selectedLockedNode] || (this.level === 'spain' && EUROPE_FUTURE_NODES[this.selectedLockedNode]))) {
        const lKey = this.selectedLockedNode;
        const lDef = this.cityDef(lKey);
        const lNode = meta.nodes[lKey] || EUROPE_FUTURE_NODES[lKey];
        this.denyNode(
          lKey,
          lNode,
          !lDef.playable ? '🔒 Próximamente - En desarrollo' : '🔒 Bloqueada: completá la ciudad anterior'
        );
        return;
      }
      const city = this.getEffectiveNode(
        this[meta.cursorKey],
        meta.edges,
        meta.nodes,
        (cKey) => this.displayUnlocked(cKey)
      );
      if (!city) return;
      this[meta.cursorKey] = { kind: 'node', node: city, edge: 0, s: 0 };
      const def = this.cityDef(city);
      const node = meta.nodes[city];
      this.tina.x = node.x;
      this.tina.y = node.y;
      if (!def.playable) {
        this.denyNode(city, node, '🔒 Próximamente - En desarrollo');
      } else if (!WorldProgress.isUnlocked(city)) {
        this.denyNode(city, node, city === 'chile' ? '🔒 Bloqueada: completá Ushuaia' : '🔒 Bloqueada: completá la ciudad anterior');
      } else if (def.isCountry && city === 'chile') {
        this.startZoom('in', 'southamerica', 'chile', 'chile');
      } else {
        this.startZoom('in', meta.level, 'city', city);
      }
    }

    back() {
      if (this.transition) return;
      if (this.anim) {
        this.skipAnim();
        return;
      }
      this.hoverPreviewNode = null;
      this.selectedLockedNode = null;
      if (this.level === 'city') {
        this.zoneAutoTarget = null;
        if (isChileCityTag(this.activeCity)) {
          this.startZoom('out', 'city', 'chile', this.activeCity);
        } else if (isSouthAmericaCityTag(this.activeCity)) {
          this.startZoom('out', 'city', 'southamerica', this.activeCity);
        } else {
          this.startZoom('out', 'city', 'spain', this.activeCity);
        }
      } else if (this.level === 'chile' || this.level === 'spain' || this.level === 'southamerica') {
        this.autoTarget = null;
        this.saAutoTarget = null;
        this.chileAutoTarget = null;
        const focusWorld =
          this.level === 'chile' ? 'chile' : (this.level === 'southamerica' ? 'argentina' : 'spain');
        this.startZoom('out', this.level, 'world', focusWorld);
      } else {
        this.worldFlight = null;
        if (this.game && this.game.sound && typeof this.game.sound.stopBiplaneAmbience === 'function') {
          this.game.sound.stopBiplaneAmbience();
        }
        this.game.exitMapToMenu();
      }
    }

    denyNode(key, node, text) {
      this.shake = { key, t: 0.45 };
      this.game.sound.mapDenied();
      this.floaters.push({
        x: node.x,
        y: node.y - 40,
        text,
        life: 1.7,
        max: 1.7,
        color: '#fca5a5'
      });
    }

    getDesiredMenuMusicMode() {
      const targetLevel = this.transition ? this.transition.toLevel : this.level;
      const targetCity = this.transition ? (this.transition.focusCity || this.activeCity) : this.activeCity;
      if (targetLevel === 'spain') return 'anthem_spain';
      if (targetLevel === 'chile') return 'anthem_chile';
      if (targetLevel === 'southamerica') return 'anthem_argentina';
      if (targetLevel === 'city') {
        if (isChileCityTag(targetCity)) return 'anthem_chile';
        return isSouthAmericaCityTag(targetCity) ? 'anthem_argentina' : 'anthem_spain';
      }
      return 'world_map';
    }

    syncMapMusic() {
      if (this.worldAnim) return;
      if (this.game && this.game.sound && typeof this.game.sound.playMenuMusic === 'function') {
        this.game.sound.playMenuMusic(this.getDesiredMenuMusicMode());
      }
    }

    startZoom(kind, fromLevel = null, toLevel = null, focusCity = null) {
      const fromL = fromLevel || this.level;
      const toL = toLevel || (kind === 'in'
        ? (fromL === 'world' ? 'spain' : 'city')
        : (fromL === 'city' ? 'spain' : 'world'));
      if (toL === 'city' && focusCity && CITY_SUBMAPS[focusCity]) {
        this.activeCity = focusCity;
        this.syncZoneCursor(focusCity);
      }
      this.transition = { kind, fromLevel: fromL, toLevel: toL, focusCity: focusCity || this.activeCity, t: 0 };
      this.game.sound.mapZoom(kind === 'in');
      this.syncMapMusic();
    }

    openResetConfirm() {
      this.resetConfirmOpen = true;
      this.resetConfirmCursor = 1;
      this.game.sound.menuSelect();
    }

    cancelResetActiveSlot() {
      this.resetConfirmOpen = false;
      this.game.sound.menuSelect();
    }

    confirmResetActiveSlot() {
      this.resetConfirmOpen = false;
      WorldProgress.reset();
      if (this.game) {
        this.game.score = 0;
        this.game.totalCoins = 0;
        this.game.runCoins = 0;
        this.game.lives = 3;
        this.game.carriedPowerUp = null;
        this.game.reservePowerUp = null;
        this.game.survivalRiskMode = false;
        this.game.postGameOverFallback = false;
        this.game.highScore = 0;
        this.game.cityKey = 'barcelona';
      }
      this.anim = null;
      this.autoTarget = null;
      this.saAutoTarget = null;
      this.zoneAutoTarget = null;
      this.hoverPreviewNode = null;
      this.selectedLockedNode = null;
      this.worldNode = 'spain';
      this.cursor = { kind: 'node', node: 'barcelona', edge: 0, s: 0 };
      this.saCursor = { kind: 'node', node: 'buenosaires', edge: 0, s: 0 };
      this.activeCity = 'barcelona';
      this.syncZoneCursor('barcelona', 1);
      if (this.level === 'southamerica') {
        this.level = 'spain';
      }
      if (this.level === 'city') {
        const z1 = CITY_SUBMAPS.barcelona.nodes[1];
        this.tina.x = z1.x;
        this.tina.y = z1.y;
        this.floaters.push({
          x: z1.x,
          y: z1.y - 44,
          text: '🗑 Progreso del Slot reiniciado',
          life: 2.2,
          max: 2.2,
          color: '#fde047'
        });
      } else if (this.level === 'spain') {
        const bcn = SPAIN_NODES.barcelona;
        this.tina.x = bcn.x;
        this.tina.y = bcn.y;
        this.floaters.push({
          x: bcn.x,
          y: bcn.y - 44,
          text: '🗑 Progreso del Slot reiniciado',
          life: 2.2,
          max: 2.2,
          color: '#fde047'
        });
      } else {
        this.worldNode = 'spain';
        this.tina.x = WORLD_NODES.spain.x;
        this.tina.y = WORLD_NODES.spain.y;
        this.floaters.push({
          x: WORLD_NODES.spain.x,
          y: WORLD_NODES.spain.y - 44,
          text: '🗑 Progreso del Slot reiniciado',
          life: 2.2,
          max: 2.2,
          color: '#fde047'
        });
      }
      if (this.game && this.game.sound) {
        this.game.sound.menuSelect();
        if (typeof this.game.sound.playMenuConfirmChord === 'function') {
          this.game.sound.playMenuConfirmChord(false);
        }
      }
    }

    handlePointer(cx, cy) {
      if (this.transition) return;

      // Modal de confirmación de reinicio de progreso del slot activo
      if (this.resetConfirmOpen) {
        if (cx >= 265 && cx <= 462 && cy >= 292 && cy <= 340) {
          this.confirmResetActiveSlot();
          return;
        }
        if (cx >= 498 && cx <= 695 && cy >= 292 && cy <= 340) {
          this.cancelResetActiveSlot();
          return;
        }
        if (cx < 225 || cx > 735 || cy < 165 || cy > 365) {
          this.cancelResetActiveSlot();
        }
        return;
      }

      // Botón "VOLVER" (arriba a la izquierda)
      if (cx >= 14 && cx <= 124 && cy >= 10 && cy <= 42) {
        this.game.sound.menuSelect();
        this.back();
        return;
      }
      if (this.anim) {
        this.skipAnim();
        return;
      }

      if (this.level === 'world') {
        const cam = this.worldCam || { x: W / 2, y: H / 2, zoom: 1 };
        const wx = cam.zoom > 1.002 ? (cx - W / 2) / cam.zoom + cam.x : cx;
        const wy = cam.zoom > 1.002 ? (cy - H / 2) / cam.zoom + cam.y : cy;
        const keys = Object.keys(WORLD_NODES);
        let hitKey = null;
        let hitDist = 28;
        for (let i = 0; i < keys.length; i++) {
          const n = WORLD_NODES[keys[i]];
          const d = Math.hypot(wx - n.x, wy - n.y);
          if (d <= hitDist) {
            hitDist = d;
            hitKey = keys[i];
          }
        }
        if (hitKey) {
          const n = WORLD_NODES[hitKey];
          if (hitKey === 'venezuela') {
            this.worldNode = 'venezuela';
            this.denyNode('world:venezuela', n, '🔒 ?????');
          } else if (hitKey === 'chile' && isCountryTempLocked('chile')) {
            this.worldNode = 'chile';
            this.denyNode('world:chile', n, '🔒 Chile · Próximamente');
          } else if (this.worldNode === hitKey) {
            this.confirm();
          } else if (WorldProgress.isContinentUnlocked(hitKey)) {
            const fromKey = WorldProgress.isContinentUnlocked(this.worldNode)
              ? this.worldNode
              : (WorldProgress.isContinentUnlocked('argentina') ? 'argentina' : 'spain');
            this.startWorldFlight(fromKey, hitKey);
          } else {
            this.worldNode = hitKey;
            const msg = hitKey === 'chile'
              ? '🔒 Completa Ushuaia en Argentina'
              : '🔒 Completa las 4 ciudades de España';
            this.denyNode(`world:${hitKey}`, n, msg);
          }
        }
        return;
      }

      if (this.level === 'city') {
        const sub = CITY_SUBMAPS[this.activeCity] || CITY_SUBMAPS.barcelona;
        const zoneNums = Object.keys(sub.nodes).map((k) => Number(k));
        for (let i = 0; i < zoneNums.length; i++) {
          const z = zoneNums[i];
          const n = sub.nodes[z];
          if (Math.hypot(cx - n.x, cy - n.y) <= 32) {
            if (!this.displayZoneUnlocked(this.activeCity, z)) {
              this.denyNode(`zone:${this.activeCity}:${z}`, n, '🔒 Bloqueada');
            } else if (this.zoneCursor.kind === 'node' && this.zoneCursor.node === z) {
              this.confirm();
            } else {
              this.zoneAutoTarget = z;
              this.game.sound.menuSelect();
            }
            return;
          }
        }
        return;
      }

      const meta = this.getCountryMeta(this.level);
      if (this.level === 'spain') {
        const futureKeys = Object.keys(EUROPE_FUTURE_NODES);
        for (let i = 0; i < futureKeys.length; i++) {
          const fk = futureKeys[i];
          const fn = EUROPE_FUTURE_NODES[fk];
          if (Math.hypot(cx - fn.x, cy - fn.y) <= 32) {
            this.selectedLockedNode = fk;
            this.denyNode(fk, fn, '🔒 Próximamente - En desarrollo');
            return;
          }
        }
      }
      const names = Object.keys(meta.nodes);
      for (let i = 0; i < names.length; i++) {
        const n = meta.nodes[names[i]];
        if (Math.hypot(cx - n.x, cy - n.y) <= 32) {
          const def = this.cityDef(names[i]);
          if (!def.playable) {
            this.selectedLockedNode = names[i];
            this.denyNode(names[i], n, '🔒 Próximamente - En desarrollo');
            return;
          }
          this.selectedLockedNode = null;
          if (this[meta.cursorKey].kind === 'node' && this[meta.cursorKey].node === names[i]) {
            this.confirm();
          } else if (this[meta.cursorKey].kind === 'node' && this.findEdgeIndex(this[meta.cursorKey].node, names[i], meta.edges) >= 0) {
            const edge = meta.edges[this.findEdgeIndex(this[meta.cursorKey].node, names[i], meta.edges)];
            if (this.canTravel(edge)) {
              this[meta.autoTargetKey] = names[i];
            } else {
              this.denyNode(names[i], n, '🔒 Bloqueada');
            }
          }
          return;
        }
      }
      this.selectedLockedNode = null;
    }

    handlePointerMove(cx, cy) {
      if (this.transition || this.anim || this.resetConfirmOpen) {
        this.hoverPreviewNode = null;
        return;
      }
      if (this.level === 'spain' || this.level === 'southamerica' || this.level === 'chile') {
        const meta = this.getCountryMeta(this.level);
        const names = Object.keys(meta.nodes);
        let found = null;
        if (this.level === 'spain') {
          const futureKeys = Object.keys(EUROPE_FUTURE_NODES);
          for (let i = 0; i < futureKeys.length; i++) {
            const fk = futureKeys[i];
            const fn = EUROPE_FUTURE_NODES[fk];
            if (Math.hypot(cx - fn.x, cy - fn.y) <= 34) {
              found = fk;
              break;
            }
          }
        }
        for (let i = 0; !found && i < names.length; i++) {
          const n = meta.nodes[names[i]];
          if (Math.hypot(cx - n.x, cy - n.y) <= 34) {
            const def = this.cityDef(names[i]);
            if (!def.playable || !WorldProgress.isUnlocked(names[i])) {
              found = names[i];
            }
            break;
          }
        }
        this.hoverPreviewNode = found;
      } else {
        this.hoverPreviewNode = null;
      }
    }

    // ----------------------------------------------------------------------
    // Actualización
    // ----------------------------------------------------------------------
    update(dt) {
      this.time += dt;
      this.tina.anim += dt;
      if (this.shake.t > 0) this.shake.t = Math.max(0, this.shake.t - dt);

      Object.keys(this.unlockFx).forEach((k) => {
        this.unlockFx[k].t += dt;
      });

      for (let i = this.fx.length - 1; i >= 0; i--) {
        const p = this.fx[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.gravity !== undefined ? p.gravity : 220) * dt;
        if (p.kind === 'ring') {
          p.size += ((p.maxRadius || 20) - 5) * (dt / p.max);
        }
        if (p.life <= 0) this.fx.splice(i, 1);
      }
      for (let i = this.floaters.length - 1; i >= 0; i--) {
        const f = this.floaters[i];
        f.life -= dt;
        f.y -= 14 * dt;
        if (f.life <= 0) this.floaters.splice(i, 1);
      }

      if (this.transition) {
        const tr = this.transition;
        tr.t += dt / (tr.fromLevel === 'city' || tr.toLevel === 'city' ? 0.78 : 1.15);
        if (tr.t >= 1) {
          this.level = tr.toLevel;
          if (this.level === 'city') {
            this.activeCity = tr.focusCity || this.activeCity;
            const p = this.zoneCursorPos();
            this.tina.x = p.x;
            this.tina.y = p.y;
            this.checkPendingCityPathAnim(this.activeCity);
          } else if (this.level === 'spain' || this.level === 'southamerica' || this.level === 'chile') {
            const meta = this.getCountryMeta(this.level);
            if (tr.focusCity && meta.nodes[tr.focusCity]) {
              this[meta.cursorKey] = { kind: 'node', node: tr.focusCity, edge: 0, s: 0 };
            }
            const p = this.cursorPos(this.level);
            this.tina.x = p.x;
            this.tina.y = p.y;
          } else {
            let backTarget = 'spain';
            if (tr.focusCity && WORLD_NODES[tr.focusCity]) {
              backTarget = tr.focusCity;
            } else if (isChileCityTag(tr.focusCity) || tr.fromLevel === 'chile') {
              backTarget = 'chile';
            } else if (isSouthAmericaCityTag(tr.focusCity) || tr.fromLevel === 'southamerica') {
              backTarget = 'argentina';
            }
            this.worldNode = backTarget;
            this.tina.x = WORLD_NODES[backTarget].x;
            this.tina.y = WORLD_NODES[backTarget].y;
          }
          this.tina.inWater = false;
          this.tina.hopT = 0;
          this.transition = null;
          this.syncMapMusic();
          const inp = this.game.input;
          this.prevKeys = { left: !!inp.left, right: !!inp.right, up: !!inp.up, down: !!inp.down };
        }
        return;
      }

      if (this.worldAnim) {
        this.updateWorldAnim(dt);
        return;
      }

      if (this.anim) {
        this.updateAnim(dt);
        return;
      }

      if (this.level === 'world') {
        this.updateWorld(dt);
        this.tina.inWater = false;
        this.tina.hopT = 0;
      } else if (this.level === 'city') {
        this.updateCity(dt);
        const cp = this.zoneCursorPos();
        this.updateTinaSurface(dt, !!cp.inWater);
      } else if (this.level === 'chile') {
        this.updateCountry(dt, 'chile');
        const cp = this.cursorPos('chile');
        this.updateTinaSurface(dt, !!cp.inWater);
      } else if (this.level === 'southamerica') {
        this.updateCountry(dt, 'southamerica');
        const cp = this.cursorPos('southamerica');
        this.updateTinaSurface(dt, !!cp.inWater);
      } else {
        this.updateSpain(dt);
        const cp = this.cursorPos('spain');
        this.updateTinaSurface(dt, !!cp.inWater);
      }
    }

    updateWorld(dt) {
      const inp = this.game.input;
      const cur = { left: !!inp.left, right: !!inp.right, up: !!inp.up, down: !!inp.down };
      const prev = this.prevKeys;
      const vx = (cur.right && !prev.right ? 1 : 0) - (cur.left && !prev.left ? 1 : 0);
      const vy = (cur.down && !prev.down ? 1 : 0) - (cur.up && !prev.up ? 1 : 0);
      const vLen = Math.hypot(vx, vy);

      const saUnlocked = WorldProgress.isContinentUnlocked('argentina');
      const chileUnlocked = WorldProgress.isContinentUnlocked('chile');
      if (vLen > 0) {
        const dvx = vx / vLen;
        const dvy = vy / vLen;
        const curKey = WORLD_NODES[this.worldNode] ? this.worldNode : 'spain';
        const fromN = WORLD_NODES[curKey];

        if (!saUnlocked) {
          const target = dvx < 0 || dvy > 0 ? 'argentina' : 'spain';
          if (target !== this.worldNode) {
            this.worldNode = target;
            this.game.sound.menuSelect();
          }
        } else {
          const unlockedSet = new Set(['spain', 'argentina']);
          if (chileUnlocked) unlockedSet.add('chile');
          const neighbors = getWorldNeighbors(curKey);
          let bestKey = null;
          let bestScore = -Infinity;
          for (let i = 0; i < neighbors.length; i++) {
            const k = neighbors[i];
            if (k === curKey || !unlockedSet.has(k)) continue;
            const tn = WORLD_NODES[k];
            if (!tn || tn.locked) continue;
            const dist = Math.hypot(tn.x - fromN.x, tn.y - fromN.y) || 1;
            const dot = ((tn.x - fromN.x) / dist) * dvx + ((tn.y - fromN.y) / dist) * dvy;
            const score = dot - dist * 0.00035;
            if (dot > 0.2 && score > bestScore) {
              bestScore = score;
              bestKey = k;
            }
          }
          if (bestKey && bestKey !== this.worldNode) {
            const fromFlightKey = WorldProgress.isContinentUnlocked(curKey)
              ? curKey
              : (saUnlocked && (curKey === 'chile' || curKey === 'venezuela') ? 'argentina' : 'spain');
            if (bestKey === fromFlightKey) {
              this.worldNode = bestKey;
              this.game.sound.menuSelect();
            } else {
              this.startWorldFlight(fromFlightKey, bestKey);
            }
          }
        }
      }
      this.prevKeys = cur;

      if (this.worldFlight) {
        const wf = this.worldFlight;
        wf.progress = Math.min(1, (wf.progress || 0) + dt / (wf.dur || 1.8));
        const motion = this.getFlightMotion(wf);
        wf.fxAcc += dt * 15;
        if (wf.fxAcc >= 1) {
          wf.fxAcc -= 1;
          this.fx.push({
            x: motion.pt.x - motion.dir * 22,
            y: motion.pt.y - 12 + (Math.random() - 0.5) * 5,
            vx: -motion.dir * (10 + Math.random() * 12),
            vy: (Math.random() - 0.5) * 7,
            life: 0.55,
            max: 0.55,
            size: 2.0 + Math.random() * 1.6,
            color: 'rgba(255, 255, 255, 0.8)'
          });
        }
        this.tina.x = motion.pt.x;
        this.tina.y = motion.pt.y;
        this.tina.facing = motion.dir >= 0 ? 'right' : 'left';
        this.tina.moving = false;
        if (wf.progress >= 1) {
          const destKey = wf.to || 'spain';
          const dest = WORLD_NODES[destKey] || WORLD_NODES.spain;
          this.worldNode = destKey;
          this.worldFlight = null;
          this.tina.x = dest.x;
          this.tina.y = dest.y;
          this.spawnLandingDust(dest.x, dest.y);
          if (this.game && this.game.sound && typeof this.game.sound.stopBiplaneAmbience === 'function') {
            this.game.sound.stopBiplaneAmbience();
          }
        }
      } else {
        const curKey = WORLD_NODES[this.worldNode] ? this.worldNode : 'spain';
        const standingKey =
          saUnlocked && WorldProgress.isContinentUnlocked(curKey)
            ? curKey
            : (saUnlocked && (curKey === 'chile' || curKey === 'venezuela') ? 'argentina' : 'spain');
        const dest = WORLD_NODES[standingKey] || WORLD_NODES.spain;
        const dx = dest.x - this.tina.x;
        this.tina.moving = Math.hypot(dx, dest.y - this.tina.y) > 3;
        if (this.tina.moving && Math.abs(dx) > 0.5) this.tina.facing = dx >= 0 ? 'right' : 'left';
        const k = 1 - Math.exp(-dt * 7);
        this.tina.x += dx * k;
        this.tina.y += (dest.y - this.tina.y) * k;
      }

      this.updateWorldCam(dt);
    }

    findEdgeSnapTarget(cursor, edges, nodesMap, unlockFn, radius = MAP_SNAP_RADIUS) {
      if (!cursor || cursor.kind !== 'edge') return null;
      const e = edges[cursor.edge];
      if (!e) return null;
      const p = pointAt(e, cursor.s);
      const a = nodesMap[e.a];
      const b = nodesMap[e.b];
      const da = a && (!unlockFn || unlockFn(e.a)) ? Math.hypot(p.x - a.x, p.y - a.y) : Infinity;
      const db = b && (!unlockFn || unlockFn(e.b)) ? Math.hypot(p.x - b.x, p.y - b.y) : Infinity;
      if (da <= radius && da <= db) {
        return { node: e.a, targetS: 0, coords: a, dist: da };
      }
      if (db <= radius) {
        return { node: e.b, targetS: e.points.length - 1, coords: b, dist: db };
      }
      return null;
    }

    getEffectiveNode(cursor, edges, nodesMap, unlockFn, radius = MAP_SNAP_RADIUS) {
      if (!cursor) return null;
      if (cursor.kind === 'node') return cursor.node;
      const snap = this.findEdgeSnapTarget(cursor, edges, nodesMap, unlockFn, radius);
      return snap ? snap.node : null;
    }

    updateCountry(dt, countryLevel = 'spain') {
      const meta = this.getCountryMeta(countryLevel);
      const inp = this.game.input;
      const cur = { left: !!inp.left, right: !!inp.right, up: !!inp.up, down: !!inp.down };
      const prev = this.prevKeys || { left: false, right: false, up: false, down: false };
      const pvx = (cur.right && !prev.right ? 1 : 0) - (cur.left && !prev.left ? 1 : 0);
      const pvy = (cur.down && !prev.down ? 1 : 0) - (cur.up && !prev.up ? 1 : 0);
      const plen = Math.hypot(pvx, pvy);

      if (plen > 0) {
        const dvx = pvx / plen;
        const dvy = pvy / plen;

        if (this.selectedLockedNode && meta.nodes[this.selectedLockedNode]) {
          const fromNode = meta.nodes[this.selectedLockedNode];
          let bestNext = null;
          let bestScore = 0.35;
          this.edgesOf(this.selectedLockedNode, meta.edges).forEach((cand) => {
            const e = meta.edges[cand.idx];
            const other = cand.forward ? e.b : e.a;
            const toNode = meta.nodes[other];
            if (!toNode) return;
            const d = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y) || 1;
            const score = ((toNode.x - fromNode.x) / d) * dvx + ((toNode.y - fromNode.y) / d) * dvy;
            if (score > bestScore) {
              bestScore = score;
              bestNext = other;
            }
          });
          if (bestNext) {
            const bestDef = this.cityDef(bestNext);
            if (!bestDef.playable || !this.displayUnlocked(bestNext)) {
              this.selectedLockedNode = bestNext;
            } else {
              this.selectedLockedNode = null;
            }
            this.game.sound.menuSelect();
            this.prevKeys = cur;
            return;
          }
          // Si pulsa hacia un nodo libre distinto, salir de la preselección bloqueada
          this.selectedLockedNode = null;
        }

        const c = this[meta.cursorKey];
        if (c && c.kind === 'node' && meta.nodes[c.node]) {
          const curNode = meta.nodes[c.node];
          let hasUnlockedCand = false;
          this.edgesOf(c.node, meta.edges).forEach((cand) => {
            const e = meta.edges[cand.idx];
            if (!this.canTravel(e)) return;
            const sign = cand.forward ? 1 : -1;
            const tNear = tangentAt(e, cand.forward ? 0 : Math.max(0, e.points.length - 3), 2);
            const tWide = tangentAt(
              e,
              cand.forward ? 0 : Math.max(0, e.points.length - 11),
              Math.min(10, Math.max(1, e.points.length - 1))
            );
            const tChord = edgeChord(e);
            const nearDot = (dvx * tNear.x + dvy * tNear.y) * sign;
            const wideDot = (dvx * tWide.x + dvy * tWide.y) * sign;
            const chordDot = (dvx * tChord.x + dvy * tChord.y) * sign;
            if (Math.max(nearDot, wideDot, chordDot * 0.92) > 0.25) hasUnlockedCand = true;
          });

          if (!hasUnlockedCand) {
            let lockedCand = null;
            let bestLockedScore = 0.35;
            Object.keys(meta.nodes).forEach((k) => {
              if (k === c.node) return;
              const def = this.cityDef(k);
              if (def.playable && this.displayUnlocked(k)) return;
              const tn = meta.nodes[k];
              const isAdj = this.findEdgeIndex(c.node, k, meta.edges) >= 0;
              const d = Math.hypot(tn.x - curNode.x, tn.y - curNode.y) || 1;
              const score = ((tn.x - curNode.x) / d) * dvx + ((tn.y - curNode.y) / d) * dvy + (isAdj ? 0.15 : 0);
              if (score > bestLockedScore) {
                bestLockedScore = score;
                lockedCand = k;
              }
            });
            if (lockedCand) {
              this.selectedLockedNode = lockedCand;
              this.game.sound.menuSelect();
              this.prevKeys = cur;
              return;
            }
          }
        }
      }
      this.prevKeys = cur;

      if (this.selectedLockedNode) {
        return;
      }

      this[meta.autoTargetKey] = this.updatePathCursor(dt, {
        cursor: this[meta.cursorKey],
        edges: meta.edges,
        nodesMap: meta.nodes,
        unlockFn: (cKey) => this.displayUnlocked(cKey),
        autoTarget: this[meta.autoTargetKey],
        canTravelFn: (e) => this.canTravel(e),
        posFn: () => this.cursorPos(countryLevel)
      });
    }

    updateSpain(dt) {
      this.updateCountry(dt, 'spain');
    }

    updateCity(dt) {
      const city = this.activeCity;
      const sub = CITY_SUBMAPS[city] || CITY_SUBMAPS.barcelona;
      const edges = this.cityEdges[city] || [];
      this.zoneAutoTarget = this.updatePathCursor(dt, {
        cursor: this.zoneCursor,
        edges,
        nodesMap: sub.nodes,
        unlockFn: (z) => this.displayZoneUnlocked(city, z),
        autoTarget: this.zoneAutoTarget,
        canTravelFn: (e) => this.canTravelZone(e, city),
        posFn: () => this.zoneCursorPos(city)
      });
    }

    updatePathCursor(dt, { cursor, edges, nodesMap, unlockFn, autoTarget, canTravelFn, posFn }) {
      const inp = this.game.input;
      let vx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      let vy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      const len = Math.hypot(vx, vy);
      if (len > 0) {
        vx /= len;
        vy /= len;
        autoTarget = null;
      }
      this.tina.moving = false;
      const c = cursor;

      if (c.kind === 'node') {
        let chosen = null;
        if (autoTarget !== null && autoTarget !== undefined && autoTarget !== c.node) {
          let nextHop = autoTarget;
          let idx = this.findEdgeIndex(c.node, nextHop, edges);
          if (idx < 0 && typeof c.node === 'number' && typeof autoTarget === 'number') {
            nextHop = c.node + Math.sign(autoTarget - c.node);
            idx = this.findEdgeIndex(c.node, nextHop, edges);
          }
          if (idx >= 0 && canTravelFn(edges[idx])) {
            chosen = { idx, forward: edges[idx].a === c.node, hop: nextHop };
          } else {
            autoTarget = null;
          }
        } else if (len > 0) {
          let best = 0.25;
          this.edgesOf(c.node, edges).forEach((cand) => {
            const e = edges[cand.idx];
            if (!canTravelFn(e)) return;
            const sign = cand.forward ? 1 : -1;
            const tNear = cand.forward ? tangentAt(e, 0, 2) : tangentAt(e, Math.max(0, e.points.length - 3), 2);
            const tWide = tangentAt(
              e,
              cand.forward ? 0 : Math.max(0, e.points.length - 11),
              Math.min(10, Math.max(1, e.points.length - 1))
            );
            const tChord = edgeChord(e);
            const nearDot = (vx * tNear.x + vy * tNear.y) * sign;
            const wideDot = (vx * tWide.x + vy * tWide.y) * sign;
            const chordDot = (vx * tChord.x + vy * tChord.y) * sign;
            const score = Math.max(nearDot, wideDot * 0.98, chordDot * 0.90);
            if (score > best) {
              best = score;
              chosen = cand;
            }
          });
        }
        if (chosen) {
          const e = edges[chosen.idx];
          c.kind = 'edge';
          c.edge = chosen.idx;
          c.s = chosen.forward ? 0.001 : e.points.length - 1.001;
        } else {
          return autoTarget;
        }
      }

      const e = edges[c.edge];
      const n = e.points.length;
      const tan = tangentAt(e, c.s);
      let dirSign = 0;
      if (autoTarget !== null && autoTarget !== undefined) {
        if (typeof e.a === 'number' && typeof autoTarget === 'number') {
          dirSign = autoTarget >= e.b ? 1 : -1;
        } else {
          dirSign = e.b === autoTarget ? 1 : -1;
        }
      } else if (len > 0) {
        const dLocal = vx * tan.x + vy * tan.y;
        if (Math.abs(dLocal) > 0.25) {
          dirSign = dLocal > 0 ? 1 : -1;
        } else {
          // Navegación fluida en curvas/diagonales: evaluar tangente suavizada del tramo y dirección global
          const sLook = clamp(Math.floor(c.s) - 4, 0, Math.max(0, n - 2));
          const tanLook = tangentAt(e, sLook, Math.min(9, Math.max(1, n - 1)));
          const dLook = vx * tanLook.x + vy * tanLook.y;
          if (Math.abs(dLook) > 0.25) {
            dirSign = dLook > 0 ? 1 : -1;
          } else {
            const chord = edgeChord(e);
            const dChord = vx * chord.x + vy * chord.y;
            if (Math.abs(dChord) > 0.25) {
              dirSign = dChord > 0 ? 1 : -1;
            }
          }
        }
      }

      // Efecto Imán (Magnet Snapping): al soltar movimiento dentro del radio (24px) de un nodo desbloqueado,
      // atrae suavemente a La Tina hacia el centro exacto del botón.
      if (dirSign === 0) {
        const snap = this.findEdgeSnapTarget(c, edges, nodesMap, unlockFn, MAP_SNAP_RADIUS);
        if (snap) {
          const pullRate = 1 - Math.exp(-dt * 12);
          c.s += (snap.targetS - c.s) * pullRate;
          const pNow = pointAt(e, c.s);
          if (Math.abs(pNow.x - this.tina.x) > 0.05) {
            this.tina.facing = pNow.x >= this.tina.x ? 'right' : 'left';
          }
          const distCenter = Math.hypot(pNow.x - snap.coords.x, pNow.y - snap.coords.y);
          if (distCenter <= 1.8 || Math.abs(snap.targetS - c.s) <= 0.06) {
            c.kind = 'node';
            c.node = snap.node;
            c.s = 0;
            this.tina.x = snap.coords.x;
            this.tina.y = snap.coords.y;
            this.tina.moving = false;
          } else {
            this.tina.x = pNow.x;
            this.tina.y = pNow.y;
            this.tina.moving = true;
          }
        }
        return autoTarget;
      }

      const prevS = c.s;
      const prevPos = pointAt(e, prevS);
      c.s += dirSign * (WALK_SPEED / e.step) * dt;
      const pos = pointAt(e, c.s);
      if (Math.abs(pos.x - prevPos.x) > 0.01) this.tina.facing = pos.x >= prevPos.x ? 'right' : 'left';
      this.tina.moving = true;

      if (Math.floor(c.s / 3) !== Math.floor(prevS / 3)) {
        this.game.sound.mapStep(Math.floor(c.s / 3));
      }

      if (c.s >= n - 1) {
        c.kind = 'node';
        c.node = e.b;
        if (autoTarget === e.b || typeof e.b !== 'number') autoTarget = null;
      } else if (c.s <= 0) {
        c.kind = 'node';
        c.node = e.a;
        if (autoTarget === e.a || typeof e.a !== 'number') autoTarget = null;
      }
      const fin = posFn();
      this.tina.x = fin.x;
      this.tina.y = fin.y;
      return autoTarget;
    }

    // ----------------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------------
    render(ctx) {
      ctx.save();

      if (this.transition) {
        const tr = this.transition;
        const p = easeInOut(clamp(tr.t, 0, 1));
        const zoomP = tr.kind === 'in' ? p : 1 - p;
        if (tr.fromLevel === 'city' || tr.toLevel === 'city') {
          const city = tr.focusCity || this.activeCity || 'barcelona';
          if (tr.fromLevel === 'world' || tr.toLevel === 'world') {
            const worldFocus = isChileCityTag(city)
              ? WORLD_NODES.chile
              : (isSouthAmericaCityTag(city) ? WORLD_NODES.argentina : WORLD_NODES.spain);
            this.renderWorld(ctx, 1 + zoomP * 5.2, false, worldFocus);
            if (zoomP > 0.35) {
              const a = clamp((zoomP - 0.35) / 0.65, 0, 1);
              ctx.save();
              ctx.globalAlpha = a;
              this.renderCitySubmap(ctx, city, 1.24 - 0.24 * a);
              ctx.restore();
            }
            this.renderTitleBar(ctx, zoomP > 0.65 ? 'city' : 'world');
          } else {
            const isCh = tr.fromLevel === 'chile' || tr.toLevel === 'chile';
            const isSa = tr.fromLevel === 'southamerica' || tr.toLevel === 'southamerica';
            const countryLevel = isCh ? 'chile' : isSa ? 'southamerica' : 'spain';
            const meta = this.getCountryMeta(countryLevel);
            const anchor = meta.nodes[city] || meta.nodes[meta.defaultCity];
            if (isCh) {
              this.renderChile(ctx, 1 + zoomP * 3.4, anchor.x, anchor.y);
            } else if (isSa) {
              this.renderSouthAmerica(ctx, 1 + zoomP * 3.4, anchor.x, anchor.y);
            } else {
              this.renderSpain(ctx, 1 + zoomP * 3.4, anchor.x, anchor.y);
            }
            if (zoomP > 0.35) {
              const a = clamp((zoomP - 0.35) / 0.65, 0, 1);
              ctx.save();
              ctx.globalAlpha = a;
              this.renderCitySubmap(ctx, city, 1.24 - 0.24 * a);
              ctx.restore();
            }
            this.renderTitleBar(ctx, zoomP > 0.65 ? 'city' : countryLevel);
          }
        } else {
          const isCh = tr.fromLevel === 'chile' || tr.toLevel === 'chile';
          const isSa = tr.fromLevel === 'southamerica' || tr.toLevel === 'southamerica';
          const countryLevel = isCh ? 'chile' : (isSa ? 'southamerica' : 'spain');
          const focusWorld = isCh ? WORLD_NODES.chile : (isSa ? WORLD_NODES.argentina : WORLD_NODES.spain);
          this.renderWorld(ctx, 1 + zoomP * 7.5, false, focusWorld);
          if (zoomP > 0.42) {
            const a = clamp((zoomP - 0.42) / 0.58, 0, 1);
            ctx.save();
            ctx.globalAlpha = a;
            if (isCh) {
              this.renderChile(ctx, 1.22 - 0.22 * a);
            } else if (isSa) {
              this.renderSouthAmerica(ctx, 1.22 - 0.22 * a);
            } else {
              this.renderSpain(ctx, 1.22 - 0.22 * a);
            }
            ctx.restore();
          }
          this.renderTitleBar(ctx, zoomP > 0.7 ? countryLevel : 'world');
        }
      } else if (this.level === 'world') {
        this.renderWorld(ctx, 1, true);
        this.renderTitleBar(ctx, 'world');
        this.renderInfoCard(ctx);
        this.renderAnimBanner(ctx);
      } else if (this.level === 'city') {
        this.renderCitySubmap(ctx, this.activeCity, 1);
        this.renderTitleBar(ctx, 'city');
        this.renderInfoCard(ctx);
        this.renderAnimBanner(ctx);
      } else if (this.level === 'chile') {
        this.renderChile(ctx, 1);
        this.renderTitleBar(ctx, 'chile');
        this.renderInfoCard(ctx);
        this.renderAnimBanner(ctx);
      } else if (this.level === 'southamerica') {
        this.renderSouthAmerica(ctx, 1);
        this.renderTitleBar(ctx, 'southamerica');
        this.renderInfoCard(ctx);
        this.renderAnimBanner(ctx);
      } else {
        this.renderSpain(ctx, 1);
        this.renderTitleBar(ctx, 'spain');
        this.renderInfoCard(ctx);
        this.renderAnimBanner(ctx);
      }

      if (this.resetConfirmOpen) {
        this.renderResetConfirmModal(ctx);
      }

      ctx.restore();
    }

    drawSea(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#38bdf8');
      g.addColorStop(0.5, '#0ea5e9');
      g.addColorStop(1, '#075985');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    drawWaves(ctx) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      for (let i = 0; i < 34; i++) {
        const bx = (i * 173) % 960;
        const by = 60 + ((i * 97) % 420);
        const ph = Math.sin(this.time * 1.6 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(bx - 9, by + ph);
        ctx.quadraticCurveTo(bx - 4.5, by - 4 + ph, bx, by + ph);
        ctx.quadraticCurveTo(bx + 4.5, by + 4 + ph, bx + 9, by + ph);
        ctx.stroke();
      }
      ctx.restore();
    }

    fillLand(ctx, pts, fill, stroke, lw = 3) {
      smoothClosedPath(ctx, pts);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // ---------------------------- MAPA MUNDI ------------------------------
    renderWorld(ctx, zoom, showUi, zoomFocusNode = null) {
      this.drawSea(ctx);

      ctx.save();
      const cam = this.worldCam || { x: W / 2, y: H / 2, zoom: 1 };
      if (zoom > 1) {
        const f = zoomFocusNode || WORLD_NODES.spain;
        ctx.translate(W / 2, H / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-f.x, -f.y);
      } else if (cam.zoom > 1.002) {
        ctx.translate(W / 2, H / 2);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-cam.x, -cam.y);
      }

      // Retícula de latitud/longitud
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.lineWidth = 1 / Math.max(1, zoom * 0.5);
      for (let x = 0; x <= W; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      if (zoom < 2) this.drawWaves(ctx);

      this.fillLand(ctx, WORLD_SHAPES.northAmerica, '#3f8f4a', '#14351c');
      this.fillLand(ctx, WORLD_SHAPES.southAmerica, '#2f9e5a', '#10361f');
      this.fillLand(ctx, WORLD_SHAPES.europe, '#7aa84a', '#24380f');
      this.fillLand(ctx, WORLD_SHAPES.africa, '#d4a24c', '#6b4414');
      // España resaltada (cálida) sobre la península ibérica
      this.fillLand(ctx, WORLD_SHAPES.iberia, '#f2b45a', '#7a4a12', 2.4);

      if (zoom < 1.6) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AMÉRICA DEL NORTE', 180, 170);
        ctx.fillText('ÁFRICA', 590, 340);
        ctx.restore();
      }

      // Nodos del Mapa Mundi
      const spainNode = WORLD_NODES.spain;
      const argNode = WORLD_NODES.argentina;
      const chileNode = WORLD_NODES.chile;
      const venNode = WORLD_NODES.venezuela;
      const spain100 =
        WorldProgress.isCompleted('barcelona') &&
        WorldProgress.isCompleted('madrid') &&
        WorldProgress.isCompleted('palma') &&
        WorldProgress.isCompleted('canarias');
      const saUnlocked = this.displayContinentUnlocked('argentina');
      const chileUnlocked = this.displayContinentUnlocked('chile');

      // Ruta aérea/marítima punteada España <-> Argentina
      const animToArg = this.worldAnim && this.worldAnim.phase >= 1 && (this.worldAnim.to === 'argentina' || this.worldAnim.to === 'southamerica');
      if (saUnlocked || animToArg) {
        const maxDots = 24;
        const limit =
          animToArg && this.worldAnim.phase === 1
            ? Math.max(1, Math.round(this.worldAnim.progress * maxDots))
            : maxDots;
        for (let i = 1; i < limit; i++) {
          const p = this.getWorldRoutePoint(i / maxDots, 'spain', 'argentina');
          const pulse = 0.65 * Math.sin(this.time * 4.5 - i * 0.42);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.4 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = animToArg && this.worldAnim.phase === 1 ? '#fde047' : saUnlocked ? '#4ade80' : '#fde047';
          ctx.fill();
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = '#0f172a';
          ctx.stroke();
        }
      }

      // Ruta aérea punteada Argentina <-> Chile
      const animToChile = this.worldAnim && this.worldAnim.phase >= 1 && this.worldAnim.to === 'chile';
      if (chileUnlocked || animToChile) {
        const chDots = 7;
        const limit =
          animToChile && this.worldAnim.phase === 1
            ? Math.max(1, Math.round(this.worldAnim.progress * chDots))
            : chDots;
        for (let i = 1; i < limit; i++) {
          const p = this.getWorldRoutePoint(i / chDots, 'argentina', 'chile');
          const pulse = 0.45 * Math.sin(this.time * 4.5 - i * 0.6);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.8 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = animToChile && this.worldAnim.phase === 1 ? '#fde047' : '#38bdf8';
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#0f172a';
          ctx.stroke();
        }
      }

      const spFx = this.unlockFx['world:spain'] ? this.unlockFx['world:spain'].t : null;
      const argFx = (this.unlockFx['world:argentina'] || this.unlockFx['world:southamerica'] || {}).t ?? null;
      const chFx = this.unlockFx['world:chile'] ? this.unlockFx['world:chile'].t : null;
      const argShake = this.shake.key === 'world:argentina' ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;
      const chShake = this.shake.key === 'world:chile' ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;
      const venShake = this.shake.key === 'world:venezuela' ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;

      this.drawNode(ctx, spainNode.x, spainNode.y, {
        locked: false,
        completed: spain100,
        number: '★',
        selected: showUi && this.worldNode === 'spain',
        label: zoom < 1.6 ? (spain100 ? 'EUROPA (100%)' : 'EUROPA') : null,
        sublabel: zoom < 1.6 ? 'España • BCN - Madrid - Palma - Canarias' : null,
        fxT: spFx,
        radius: 15
      });

      const argDone =
        WorldProgress.isCityCompleted('buenosaires') &&
        WorldProgress.isCityCompleted('rosario') &&
        WorldProgress.isCityCompleted('cordoba') &&
        WorldProgress.isCityCompleted('ushuaia');
      this.drawNode(ctx, argNode.x + argShake, argNode.y, {
        locked: !saUnlocked,
        completed: argDone,
        number: saUnlocked ? '🇦🇷' : '🔒',
        selected: showUi && this.worldNode === 'argentina',
        label: zoom < 1.6 ? (saUnlocked ? (argDone ? 'ARGENTINA (100%)' : 'ARGENTINA') : '???') : null,
        sublabel: zoom < 1.6 ? (saUnlocked ? 'BA • Rosario • Córdoba • Ushuaia' : 'Completa España') : null,
        labelDx: 66,
        labelDy: 4,
        fxT: argFx,
        radius: 13
      });

      const chileTempLocked = isCountryTempLocked('chile');
      const chileUiUnlocked = !chileTempLocked && chileUnlocked;
      const chileDone =
        chileUiUnlocked &&
        WorldProgress.isCityCompleted('chile_santiago') &&
        WorldProgress.isCityCompleted('chile_vina') &&
        WorldProgress.isCityCompleted('chile_atacama') &&
        WorldProgress.isCityCompleted('chile_pascua');
      this.drawNode(ctx, chileNode.x + chShake, chileNode.y, {
        locked: !chileUiUnlocked,
        completed: chileDone,
        number: chileUiUnlocked ? '🇨🇱' : '🔒',
        selected: showUi && this.worldNode === 'chile',
        label: zoom < 1.6 ? (chileTempLocked ? 'CHILE' : (chileUiUnlocked ? (chileDone ? 'CHILE (100%)' : 'CHILE') : '???')) : null,
        sublabel: zoom < 1.6 ? (chileTempLocked ? 'PRÓXIMAMENTE' : (chileUiUnlocked ? 'Santiago • Viña • Atacama • Pascua' : 'Completa Ushuaia')) : null,
        labelDx: -68,
        labelDy: -8,
        fxT: chFx,
        radius: 13
      });

      this.drawNode(ctx, venNode.x + venShake, venNode.y, {
        locked: true,
        completed: false,
        number: '🔒',
        selected: showUi && this.worldNode === 'venezuela',
        label: zoom < 1.6 ? '?????' : null,
        sublabel: null,
        labelDy: -56,
        radius: 11
      });

      // La Tinita: en Avioneta Clásica de Hélice al cruzar el Atlántico; a pie al aterrizar/posarse
      const activePlane =
        this.worldAnim && this.worldAnim.phase === 1
          ? this.worldAnim
          : this.worldFlight;
      if (activePlane && this.level === 'world' && !this.transition) {
        const motion = this.getFlightMotion(activePlane);
        if (this.game && this.game.sprites && typeof this.game.sprites.drawTinaBiplane === 'function') {
          this.game.sprites.drawTinaBiplane(ctx, motion.pt.x, motion.pt.y - 11, this.time, motion.dir, {
            scale: 0.92,
            pitch: motion.pitch,
            propSpeed: 28,
            contrails: true
          });
        } else {
          this.drawTinaCursor(ctx, motion.pt.x, motion.pt.y, 0.85);
        }
      } else {
        const wt =
          this.level === 'world' && !this.transition
            ? this.tina
            : (WORLD_NODES[this.worldNode] || WORLD_NODES.spain);
        this.drawTinaCursor(ctx, wt.x, wt.y, 0.85);
      }
      this.renderFxAndFloaters(ctx);
      ctx.restore();
    }

    // --------------------------- MAPA DE ESPAÑA ---------------------------
    renderSpain(ctx, scale, pivotX = W / 2, pivotY = H / 2) {
      ctx.save();
      if (scale !== 1) {
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.translate(-pivotX, -pivotY);
      }

      this.drawSea(ctx);
      this.drawWaves(ctx);

      this.fillLand(ctx, SPAIN_SHAPES.africa, '#d4a24c', '#6b4414');
      this.fillLand(ctx, SPAIN_SHAPES.france, '#9fb2c6', '#3b4b5e');
      this.fillLand(ctx, SPAIN_SHAPES.portugal, '#8fbf6a', '#2b4a14');

      // España con degradado cálido
      const g = ctx.createLinearGradient(240, 100, 740, 450);
      g.addColorStop(0, '#f4c27a');
      g.addColorStop(0.55, '#e8a95a');
      g.addColorStop(1, '#c98a3e');
      this.fillLand(ctx, SPAIN_SHAPES.spain, g, '#6b3f0e', 3.4);

      // Islas Baleares (Mallorca, Menorca, Ibiza)
      BALEARIC_ISLES.forEach((i) => {
        ctx.beginPath();
        ctx.ellipse(i.x, i.y, i.rx, i.ry, i.rot, 0, Math.PI * 2);
        ctx.fillStyle = '#e8b86b';
        ctx.fill();
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#6b3f0e';
        ctx.stroke();
      });

      // Archipiélago Canario en el Atlántico suroeste frente al noroeste de África
      ctx.save();
      ctx.fillStyle = 'rgba(7, 89, 133, 0.28)';
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.42)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.roundRect(44, 334, 198, 108, 12);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(226, 232, 240, 0.84)';
      ctx.textAlign = 'center';
      ctx.fillText('ARCHIPIÉLAGO CANARIO', 143, 349);
      CANARIAS_ISLES.forEach((ci) => {
        ctx.beginPath();
        ctx.ellipse(ci.x, ci.y, ci.rx, ci.ry, ci.rot, 0, Math.PI * 2);
        ctx.fillStyle = '#c98a3e';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#6b3f0e';
        ctx.stroke();
      });
      ctx.restore();

      // Rótulos geográficos
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText('MAR MEDITERRÁNEO', 874, 316);
      ctx.save();
      ctx.translate(108, 195);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('OCÉANO ATLÁNTICO', 0, 0);
      ctx.restore();
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillText('ÁFRICA', 665, 434);
      ctx.fillStyle = 'rgba(107, 63, 14, 0.55)';
      ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('ESPAÑA', 562, 266);
      ctx.restore();

      // Rutas punteadas tenues hacia futuras expansiones europeas (Francia, Portugal)
      const futureEuropeKeys = Object.keys(EUROPE_FUTURE_NODES);
      for (let i = 0; i < futureEuropeKeys.length; i++) {
        const fk = futureEuropeKeys[i];
        const fn = EUROPE_FUTURE_NODES[fk];
        const anchorNode = SPAIN_NODES[fn.anchor];
        if (!anchorNode) continue;
        const steps = 6;
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const omt = 1 - t;
          const cxDot = omt * omt * anchorNode.x + 2 * omt * t * fn.ctrl.x + t * t * fn.x;
          const cyDot = omt * omt * anchorNode.y + 2 * omt * t * fn.ctrl.y + t * t * fn.y;
          ctx.beginPath();
          ctx.arc(cxDot, cyDot, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.fill();
        }
      }

      // Caminos punteados
      for (let i = 0; i < this.edges.length; i++) this.drawEdge(ctx, i);

      // Nodos de futuras expansiones europeas ("Próximamente")
      for (let i = 0; i < futureEuropeKeys.length; i++) {
        const fk = futureEuropeKeys[i];
        const fn = EUROPE_FUTURE_NODES[fk];
        const fDef = this.cityDef(fk);
        const shakeX = this.shake.key === fk ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;
        this.drawNode(ctx, fn.x + shakeX, fn.y, {
          locked: true,
          completed: false,
          number: fn.number,
          selected: this.hoverPreviewNode === fk || this.selectedLockedNode === fk,
          label: `${this.extractNameText(fDef.name, fk)} (???)`,
          sublabel: 'PRÓXIMAMENTE'
        });
      }

      // Nodos
      const effectiveSpainNode = this.getEffectiveNode(
        this.cursor,
        this.edges,
        SPAIN_NODES,
        (cKey) => this.displayUnlocked(cKey)
      );
      const names = Object.keys(SPAIN_NODES);
      for (let i = 0; i < names.length; i++) {
        const key = names[i];
        const node = SPAIN_NODES[key];
        const def = this.cityDef(key);
        const unlocked = this.displayUnlocked(key);
        const fx = this.unlockFx[key];
        const shakeX = this.shake.key === key ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;
        const pop = fx && fx.t < 0.6 ? 1 + Math.sin((fx.t / 0.6) * Math.PI) * 0.55 : 1;
        this.drawNode(ctx, node.x + shakeX, node.y, {
          locked: !unlocked || !def.playable,
          completed: WorldProgress.isCompleted(key),
          number: node.number,
          selected: effectiveSpainNode === key && !this.anim,
          label: !def.playable ? `${def.name} (???)` : def.name,
          sublabel: !def.playable ? 'PRÓXIMAMENTE' : !unlocked ? 'Bloqueada' : null,
          scale: pop,
          fxT: fx ? fx.t : null
        });
      }

      // La Tina en miniatura (cursor del mapa)
      const st = this.level === 'spain' && !this.transition ? this.tina : this.cursorPos('spain');
      this.drawTinaCursor(ctx, st.x, st.y, 1);
      this.renderFxAndFloaters(ctx);
      ctx.restore();
    }

    // --------------------------- MAPA DE ARGENTINA / LITORAL ---------------------------
    renderSouthAmerica(ctx, scale, pivotX = W / 2, pivotY = H / 2) {
      ctx.save();
      if (scale !== 1) {
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.translate(-pivotX, -pivotY);
      }

      this.drawSea(ctx);
      this.drawWaves(ctx);

      // Mar Caribe turquesa brillante en el extremo norte (Venezuela)
      ctx.save();
      const caribGrad = ctx.createRadialGradient(402, 76, 18, 402, 82, 190);
      caribGrad.addColorStop(0, 'rgba(34, 211, 238, 0.58)');
      caribGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.28)');
      caribGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = caribGrad;
      ctx.fillRect(210, 48, 390, 96);
      ctx.restore();

      // Masa continental norte (corredor sudamericano entre Venezuela, Chile y Argentina)
      this.fillLand(ctx, SA_SHAPES.southAmericaNorth, '#84b86a', '#2b4a14', 2.8);

      // Franja costera de playa caribeña dorada antes de Venezuela
      ctx.save();
      smoothClosedPath(ctx, SA_SHAPES.venezuela);
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#fde68a';
      ctx.stroke();
      ctx.restore();

      // Venezuela (extremo norte / costa del Caribe)
      const venGrad = ctx.createLinearGradient(300, 82, 500, 148);
      venGrad.addColorStop(0, '#34d399');
      venGrad.addColorStop(1, '#10b981');
      this.fillLand(ctx, SA_SHAPES.venezuela, venGrad, '#065f46', 2.8);

      // Chile (franja oeste del Pacífico)
      const chiGrad = ctx.createLinearGradient(186, 170, 290, 435);
      chiGrad.addColorStop(0, '#c08457');
      chiGrad.addColorStop(0.55, '#a17a53');
      chiGrad.addColorStop(1, '#94a3b8');
      this.fillLand(ctx, SA_SHAPES.chile, chiGrad, '#451a03', 2.8);

      this.fillLand(ctx, SA_SHAPES.uruguay, '#90b47c', '#2b4a14');

      // Litoral Argentino & Pampa Húmeda (verde-dorado celeste)
      const g = ctx.createLinearGradient(250, 166, 586, 446);
      g.addColorStop(0, '#86efac');
      g.addColorStop(0.55, '#4ade80');
      g.addColorStop(1, '#22c55e');
      this.fillLand(ctx, SA_SHAPES.argentina, g, '#14532d', 3.4);

      // Cordillera de los Andes (picos nevados entre Chile y Argentina)
      ctx.save();
      const andesPeaks = [
        [244, 176], [248, 204], [247, 232], [250, 260], [255, 290],
        [261, 322], [272, 354], [285, 386], [298, 412]
      ];
      andesPeaks.forEach(([px, py], idx) => {
        const wPeak = idx % 2 === 0 ? 11 : 9;
        const hPeak = idx % 2 === 0 ? 14 : 11;
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.moveTo(px - wPeak, py + hPeak * 0.6);
        ctx.lineTo(px, py - hPeak * 0.6);
        ctx.lineTo(px + wPeak, py + hPeak * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(px - wPeak * 0.45, py - hPeak * 0.05);
        ctx.lineTo(px, py - hPeak * 0.6);
        ctx.lineTo(px + wPeak * 0.45, py - hPeak * 0.05);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // Cauce del Río Paraná hacia el Río de la Plata
      ctx.save();
      ctx.fillStyle = '#0284c7';
      smoothClosedPath(ctx, SA_SHAPES.parana);
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      // Rótulos geográficos
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic bold 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.fillText('MAR CARIBE · PLAYA', 402, 72);
      ctx.font = 'italic bold 12.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.fillText('RÍO DE LA PLATA', 682, 372);
      ctx.fillText('RÍO PARANÁ', 608, 198);
      ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(6, 78, 59, 0.72)';
      ctx.fillText('VENEZUELA', 462, 134);
      ctx.fillStyle = 'rgba(69, 26, 3, 0.72)';
      ctx.fillText('CHILE', 218, 344);
      ctx.font = 'italic bold 9px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(51, 65, 85, 0.82)';
      ctx.fillText('ANDES', 284, 306);
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
      ctx.fillText('URUGUAY', 724, 276);
      ctx.fillStyle = 'rgba(20, 83, 45, 0.56)';
      ctx.font = 'bold 19px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('ARGENTINA', 316, 336);
      ctx.font = 'italic bold 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(20, 83, 45, 0.70)';
      ctx.fillText('TIERRA DEL FUEGO', 494, 442);
      ctx.restore();

      for (let i = 0; i < this.saEdges.length; i++) {
        this.drawEdge(ctx, i, this.saEdges[i]);
      }

      const effectiveSaNode = this.getEffectiveNode(
        this.saCursor,
        this.saEdges,
        SA_NODES,
        (cKey) => this.displayUnlocked(cKey)
      );
      const previewSaNode = this.hoverPreviewNode || this.selectedLockedNode;
      const names = Object.keys(SA_NODES);
      for (let i = 0; i < names.length; i++) {
        const key = names[i];
        const node = SA_NODES[key];
        const def = this.cityDef(key);
        const unlocked = this.displayUnlocked(key);
        const fx = this.unlockFx[key];
        const shakeX = this.shake.key === key ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;
        const pop = fx && fx.t < 0.6 ? 1 + Math.sin((fx.t / 0.6) * Math.PI) * 0.55 : 1;
        this.drawNode(ctx, node.x + shakeX, node.y, {
          locked: !unlocked || !def.playable,
          completed: WorldProgress.isCompleted(key),
          number: node.number,
          selected: (previewSaNode ? previewSaNode === key : effectiveSaNode === key) && !this.anim,
          label: def.name,
          sublabel: !def.playable ? 'Próximamente' : (!unlocked ? 'Bloqueada' : null),
          scale: pop,
          fxT: fx ? fx.t : null
        });
      }

      const st = this.level === 'southamerica' && !this.transition ? this.tina : this.cursorPos('southamerica');
      this.drawTinaCursor(ctx, st.x, st.y, 1);
      this.renderFxAndFloaters(ctx);
      ctx.restore();
    }

    renderChile(ctx, zoom = 1, focusX = W / 2, focusY = H / 2) {
      ctx.save();
      if (zoom !== 1) {
        ctx.translate(W / 2, H / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-focusX, -focusY);
      }

      // Océano Pacífico Sur
      this.drawSea(ctx);
      this.drawWaves(ctx);

      // Sudamérica continental adyacente al Este (Chile unido al continente, nunca isla)
      const saEastG = ctx.createLinearGradient(590, 50, 960, 520);
      saEastG.addColorStop(0, '#c8b88a');
      saEastG.addColorStop(0.5, '#a8bf84');
      saEastG.addColorStop(1, '#7ea074');
      this.fillLand(ctx, CHILE_SHAPES.continentEast, saEastG, '#52525b', 2.2);

      // Territorio Chileno largo y angosto (Atacama norte -> Valle Central -> Fiordos del Sur)
      const chG = ctx.createLinearGradient(520, 54, 540, 500);
      chG.addColorStop(0, '#eab308');
      chG.addColorStop(0.24, '#d97706');
      chG.addColorStop(0.50, '#4ade80');
      chG.addColorStop(0.80, '#16a34a');
      chG.addColorStop(1, '#0d9488');
      this.fillLand(ctx, CHILE_SHAPES.mainland, chG, '#fef08a', 2.8);

      // Islas del sur / Chiloé / archipiélago austral
      ctx.save();
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.6;
      [
        [478, 396, 8, 16, 0.12],
        [468, 434, 6, 12, -0.15],
        [472, 466, 7, 13, 0.25],
        [496, 510, 14, 7, -0.1]
      ].forEach(([ix, iy, rx, ry, rot]) => {
        ctx.beginPath();
        ctx.ellipse(ix, iy, rx, ry, rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      // Cordillera de los Andes a lo largo de toda la frontera oriental de Chile
      ctx.save();
      const andesPts = [
        [604, 78], [606, 114], [600, 152], [596, 192], [590, 232],
        [582, 272], [572, 312], [558, 352], [542, 392], [528, 432], [518, 470]
      ];
      andesPts.forEach(([ax, ay], idx) => {
        const w = idx % 2 === 0 ? 15 : 12;
        const h = idx % 2 === 0 ? 18 : 14;
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(ax - w, ay + h * 0.45);
        ctx.lineTo(ax, ay - h * 0.65);
        ctx.lineTo(ax + w, ay + h * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(ax, ay - h * 0.65);
        ctx.lineTo(ax - w * 0.44, ay - h * 0.1);
        ctx.lineTo(ax + w * 0.44, ay - h * 0.1);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // Recuadro oceánico de Isla de Pascua (Polinesia, Oeste en el Pacífico)
      ctx.save();
      ctx.fillStyle = 'rgba(7, 89, 133, 0.34)';
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(82, 234, 170, 134, 14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Isla de Pascua (Rapa Nui)
      const rapG = ctx.createLinearGradient(118, 276, 216, 336);
      rapG.addColorStop(0, '#84cc16');
      rapG.addColorStop(1, '#3f6212');
      this.fillLand(ctx, CHILE_SHAPES.pascuaIsland, rapG, '#fef08a', 2.6);

      // Rótulos geográficos
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
      ctx.fillText('OCÉANO PACÍFICO', 280, 145);
      ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(254, 240, 138, 0.92)';
      ctx.fillText('RAPA NUI · 3.700 km OESTE', 167, 252);
      ctx.fillStyle = 'rgba(120, 53, 15, 0.85)';
      ctx.fillText('ATACAMA', 568, 86);
      ctx.font = 'italic bold 10.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(248, 250, 252, 0.90)';
      ctx.fillText('CORDILLERA DE LOS ANDES', 720, 255);
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.fillText('ARGENTINA / ALTIPLANO', 775, 165);
      ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(248, 250, 252, 0.30)';
      ctx.fillText('CHILE', 536, 398);
      ctx.restore();

      for (let i = 0; i < this.chileEdges.length; i++) {
        this.drawEdge(ctx, i, this.chileEdges[i]);
      }

      const effectiveChileNode = this.getEffectiveNode(
        this.chileCursor,
        this.chileEdges,
        CHILE_NODES,
        (cKey) => this.displayUnlocked(cKey)
      );
      const previewNode = this.hoverPreviewNode || this.selectedLockedNode;
      const names = Object.keys(CHILE_NODES);
      for (let i = 0; i < names.length; i++) {
        const key = names[i];
        const node = CHILE_NODES[key];
        const def = this.cityDef(key);
        const unlocked = this.displayUnlocked(key);
        const fx = this.unlockFx[key];
        const shakeX = this.shake.key === key ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;
        const pop = fx && fx.t < 0.6 ? 1 + Math.sin((fx.t / 0.6) * Math.PI) * 0.55 : 1;
        this.drawNode(ctx, node.x + shakeX, node.y, {
          locked: !unlocked || !def.playable,
          completed: WorldProgress.isCompleted(key),
          number: node.number,
          selected: (previewNode ? previewNode === key : effectiveChileNode === key) && !this.anim,
          label: def.name,
          sublabel: !def.playable ? 'Próximamente' : (!unlocked ? 'Bloqueada' : null),
          labelDx: key === 'chile_santiago' ? 68 : key === 'chile_vina' ? -66 : 0,
          labelDy: key === 'chile_santiago' ? -10 : key === 'chile_vina' ? -14 : 0,
          scale: pop,
          fxT: fx ? fx.t : null
        });
      }

      const st = this.level === 'chile' && !this.transition ? this.tina : this.cursorPos('chile');
      this.drawTinaCursor(ctx, st.x, st.y, 1);
      this.renderFxAndFloaters(ctx);
      ctx.restore();
    }

    // --------------------- NIVEL 3: SUBMAPA DE ZONAS POR CIUDAD ---------------------
    renderCitySubmap(ctx, cityKey, scale = 1) {
      const sub = CITY_SUBMAPS[cityKey] || CITY_SUBMAPS.barcelona;
      const edges = this.cityEdges[cityKey] || [];
      ctx.save();
      if (scale !== 1) {
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.translate(-W / 2, -H / 2);
      }

      // Fondo geográfico propio de cada ciudad
      if (cityKey === 'palma' || cityKey === 'canarias' || cityKey === 'chile_pascua') {
        const sg = ctx.createLinearGradient(0, 0, 0, H);
        sg.addColorStop(0, sub.seaColorTop);
        sg.addColorStop(1, sub.seaColorBottom);
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
        this.drawWaves(ctx);
      } else if (cityKey === 'chile_atacama') {
        const dg = ctx.createLinearGradient(0, 50, W, H);
        dg.addColorStop(0, '#f0d4a4');
        dg.addColorStop(0.55, '#dfa872');
        dg.addColorStop(1, '#c87e4b');
        ctx.fillStyle = dg;
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = sub.bgFill || '#efe3c6';
        ctx.fillRect(0, 0, W, H);
        // Trama urbana suave estilo mapa ilustrado (evitar en Atacama)
        ctx.save();
        ctx.strokeStyle = sub.gridColor || 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.4;
        for (let gx = 40; gx < W; gx += 64) {
          ctx.beginPath();
          ctx.moveTo(gx, 52);
          ctx.lineTo(gx - 28, H - 52);
          ctx.stroke();
        }
        for (let gy = 82; gy < H - 40; gy += 56) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy + 14);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Costa / Ríos / Islas / Parques
      if (sub.coastPoly) {
        const seaG = sub.fluvialRiver
          ? ctx.createLinearGradient(650, 80, 960, 440)
          : ctx.createLinearGradient(0, 315, 0, H);
        seaG.addColorStop(0, sub.seaColorTop || '#38bdf8');
        if (sub.fluvialRiver && sub.seaColorMid) {
          seaG.addColorStop(0.55, sub.seaColorMid);
        }
        seaG.addColorStop(1, sub.seaColorBottom || '#0369a1');
        this.fillLand(ctx, sub.coastPoly, seaG, sub.coastStroke || '#f59e0b', 3.4);

        if (sub.fluvialRiver) {
          ctx.save();
          smoothClosedPath(ctx, sub.coastPoly);
          ctx.clip();
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.22)';
          ctx.lineWidth = 1.6;
          for (let ry = 40; ry <= H + 20; ry += 44) {
            const xOff = Math.sin(ry * 0.018 + (this.time || 0) * 1.1) * 12;
            ctx.beginPath();
            ctx.moveTo(695 + xOff, ry);
            ctx.quadraticCurveTo(760 + xOff, ry - 18, 808 + xOff, ry - 32);
            ctx.stroke();
          }
          ctx.restore();
        }

        if (Array.isArray(sub.deltaIslands)) {
          sub.deltaIslands.forEach((disl) => {
            const ig = ctx.createLinearGradient(790, 90, 940, 420);
            ig.addColorStop(0, disl.fillTop || '#4ade80');
            ig.addColorStop(1, disl.fillBottom || '#15803d');
            this.fillLand(ctx, disl.poly, ig, disl.stroke || '#a38654', 2.4);

            // Copa sutil de vegetación en islas del Delta
            ctx.save();
            smoothClosedPath(ctx, disl.poly);
            ctx.clip();
            ctx.fillStyle = 'rgba(20, 83, 45, 0.26)';
            ctx.beginPath();
            ctx.arc((disl.labelX || 870) - 18, (disl.labelY || 220) - 24, 24, 0, Math.PI * 2);
            ctx.arc((disl.labelX || 870) + 14, (disl.labelY || 220) + 18, 28, 0, Math.PI * 2);
            ctx.fill();
            if (disl.label) {
              ctx.textAlign = 'center';
              ctx.font = 'bold 9px "Segoe UI", system-ui, sans-serif';
              ctx.fillStyle = 'rgba(240, 253, 244, 0.85)';
              ctx.fillText(disl.label, disl.labelX || 870, (disl.labelY || 220) + 3);
            }
            ctx.restore();
          });
        }

        ctx.save();
        ctx.textAlign = sub.coastLabelAlign || 'start';
        ctx.fillStyle = sub.fluvialRiver ? 'rgba(248, 250, 252, 0.86)' : 'rgba(255,255,255,0.6)';
        ctx.font = 'italic bold 13px "Segoe UI", system-ui, sans-serif';
        if (sub.fluvialRiver) {
          ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
          ctx.shadowBlur = 4;
        }
        ctx.fillText(sub.coastLabel || 'MAR MEDITERRÁNEO', sub.coastLabelX || 760, sub.coastLabelY || 412);
        ctx.restore();
      }

      if (sub.islandPoly) {
        if (cityKey === 'chile_pascua') {
          ctx.save();
          smoothClosedPath(ctx, sub.islandPoly);
          ctx.lineWidth = 10;
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.72)';
          ctx.stroke();
          ctx.restore();
          const rg = ctx.createLinearGradient(170, 130, 825, 395);
          rg.addColorStop(0, '#84cc16');
          rg.addColorStop(0.55, '#65a30d');
          rg.addColorStop(1, '#3f6212');
          this.fillLand(ctx, sub.islandPoly, rg, '#fde047', 2.8);
        } else {
          const ig = ctx.createLinearGradient(120, 110, 820, 360);
          ig.addColorStop(0, '#f4c27a');
          ig.addColorStop(1, '#d99b4e');
          this.fillLand(ctx, sub.islandPoly, ig, '#78350f', 3.2);
        }
      }

      if (Array.isArray(sub.islands)) {
        sub.islands.forEach((isl) => {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(isl.x, isl.y, isl.rx, isl.ry, isl.rot, 0, Math.PI * 2);
          ctx.fillStyle = isl.fill;
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = isl.stroke;
          ctx.stroke();
          ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.fillText(isl.label, isl.x, isl.y + isl.ry + 14);
          ctx.restore();
        });
      }

      if (Array.isArray(sub.parkPolys)) {
        sub.parkPolys.forEach((poly) => {
          this.fillLand(ctx, poly, '#86efac', '#16a34a', 2.2);
        });
      }

      if (sub.pondEllipse) {
        const pe = sub.pondEllipse;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(pe.x, pe.y, pe.rx, pe.ry, pe.rot, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0284c7';
        ctx.stroke();
        ctx.restore();
      }

      if (Array.isArray(sub.riverWaypoints)) {
        ctx.save();
        ctx.beginPath();
        sub.riverWaypoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
      }

      // Título ambiental discreto de la región
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = cityKey === 'palma' || cityKey === 'canarias' || cityKey === 'chile_pascua'
        ? 'rgba(255, 255, 255, 0.72)'
        : cityKey === 'ushuaia'
        ? 'rgba(15, 23, 42, 0.62)'
        : cityKey === 'chile_atacama'
        ? 'rgba(120, 53, 15, 0.72)'
        : 'rgba(107, 63, 14, 0.48)';
      ctx.fillText(sub.title, W * 0.5, 86);
      ctx.restore();

      if (cityKey === 'ushuaia') {
        this.renderUshuaiaTerrain(ctx);
      } else if (isChileCityTag(cityKey)) {
        this.renderChileSubmapTerrain(ctx, cityKey);
      }

      // Rutas punteadas entre zonas (ocultas hacia zonas aún bloqueadas hasta su desbloqueo)
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const aUnl = this.displayZoneUnlocked(cityKey, e.a);
        const bUnl = this.displayZoneUnlocked(cityKey, e.b);
        const isAnim = this.anim && this.anim.scope === 'city' && this.anim.city === cityKey && this.anim.edgeIdx === i && this.anim.phase < 2;
        const mode = isAnim ? 'anim' : (aUnl && bUnl ? 'full' : 'hidden');
        this.drawEdge(ctx, i, e, mode);
      }

      // 4 Nodos de Zona
      const effectiveZone = this.getEffectiveNode(
        this.zoneCursor,
        edges,
        sub.nodes,
        (zn) => this.displayZoneUnlocked(cityKey, zn)
      );
      for (let z = 1; z <= 4; z++) {
        const node = sub.nodes[z];
        const unlocked = this.displayZoneUnlocked(cityKey, z);
        const completed = WorldProgress.isZoneCompleted(cityKey, z);
        const fxKey = `zone:${cityKey}:${z}`;
        const fx = this.unlockFx[fxKey];
        const shakeX = this.shake.key === fxKey ? Math.sin(this.time * 70) * 3 * (this.shake.t / 0.45) : 0;
        const pop = fx && fx.t < 0.6 ? 1 + Math.sin((fx.t / 0.6) * Math.PI) * 0.55 : 1;
        const bestScore = WorldProgress.getZoneHighScore(cityKey, z);

        this.drawNode(ctx, node.x + shakeX, node.y, {
          locked: !unlocked,
          completed: unlocked && completed,
          number: z,
          icon: unlocked ? node.icon : null,
          selected: effectiveZone === z && !this.anim,
          label: unlocked ? this.getZoneDisplayName(cityKey, z) : '???',
          sublabel: unlocked && bestScore > 0 ? `🏆 ${bestScore}` : null,
          sublabelColor: null,
          borderColor: null,
          scale: pop,
          fxT: fx ? fx.t : null,
          radius: 19
        });
      }

      if (cityKey === 'cordoba') {
        this.renderCordobaOverlay(ctx);
      } else if (cityKey === 'ushuaia') {
        this.renderUshuaiaOverlay(ctx);
      } else if (cityKey === 'chile_pascua') {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'italic bold 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.fillText('OCÉANO PACÍFICO SUR', 480, 472);
        ctx.restore();
      }
      const st = this.level === 'city' && !this.transition ? this.tina : this.zoneCursorPos(cityKey);
      this.drawTinaCursor(ctx, st.x, st.y, 1);
      this.renderFxAndFloaters(ctx);
      ctx.restore();
    }

    renderCordobaOverlay(ctx) {
      ctx.save();
      // Cumbres ocres y serranas estilizadas lejos de los nodos para dar textura provincial
      const sierraPeaks = [
        { x: 148, y: 185, w: 62, h: 42 },
        { x: 132, y: 278, w: 72, h: 48 },
        { x: 175, y: 356, w: 66, h: 44 },
        { x: 344, y: 136, w: 58, h: 36 },
        { x: 568, y: 152, w: 54, h: 38 },
        { x: 572, y: 286, w: 50, h: 34 },
        { x: 404, y: 392, w: 56, h: 34 }
      ];
      sierraPeaks.forEach((pk) => {
        ctx.fillStyle = 'rgba(180, 125, 62, 0.36)';
        ctx.beginPath();
        ctx.moveTo(pk.x - pk.w * 0.5, pk.y);
        ctx.lineTo(pk.x - pk.w * 0.1, pk.y - pk.h * 0.85);
        ctx.lineTo(pk.x + pk.w * 0.5, pk.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(253, 230, 138, 0.24)';
        ctx.beginPath();
        ctx.moveTo(pk.x - pk.w * 0.1, pk.y - pk.h * 0.85);
        ctx.lineTo(pk.x + pk.w * 0.5, pk.y);
        ctx.lineTo(pk.x + pk.w * 0.08, pk.y);
        ctx.closePath();
        ctx.fill();
      });

      // Rótulos geográficos serranos
      ctx.textAlign = 'center';
      ctx.font = 'italic bold 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText('LAGO SAN ROQUE', 405, 245);

      ctx.font = 'italic bold 9px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(30, 58, 138, 0.82)';
      ctx.save();
      ctx.translate(668, 336);
      ctx.rotate(-0.14);
      ctx.fillText('ARROYO LA CAÑADA', 0, 0);
      ctx.restore();

      ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(20, 83, 45, 0.72)';
      ctx.fillText('SIERRAS CHICAS', 568, 114);
      ctx.fillText('ALTAS CUMBRES', 152, 246);
      ctx.fillText('CALAMUCHITA', 475, 418);
      ctx.restore();
    }

    renderChileSubmapTerrain(ctx, cityKey) {
      const t = this.time || 0;
      ctx.save();
      if (cityKey === 'chile_santiago') {
        // Cordillera de los Andes imponente al Este
        for (let i = 0; i < 6; i++) {
          const py = 95 + i * 74;
          const px = 885 + (i % 2) * 28;
          const w = 135;
          const h = 92;
          ctx.fillStyle = 'rgba(71, 85, 105, 0.42)';
          ctx.beginPath();
          ctx.moveTo(px - w, py + 24);
          ctx.lineTo(px, py - h);
          ctx.lineTo(px + w, py + 24);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
          ctx.beginPath();
          ctx.moveTo(px - w * 0.34, py - h * 0.48);
          ctx.lineTo(px, py - h);
          ctx.lineTo(px + w * 0.34, py - h * 0.48);
          ctx.lineTo(px + w * 0.12, py - h * 0.36);
          ctx.lineTo(px - w * 0.12, py - h * 0.56);
          ctx.closePath();
          ctx.fill();
        }
        // Río Mapocho serpenteando de NE a SO
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(860, 118);
        ctx.bezierCurveTo(720, 175, 560, 255, 390, 290);
        ctx.bezierCurveTo(255, 315, 130, 326, -10, 342);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Alameda dorada (eje cívico)
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.42)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(70, 355);
        ctx.quadraticCurveTo(320, 350, 620, 322);
        ctx.stroke();
        // Cerro San Cristóbal verde
        ctx.fillStyle = 'rgba(34, 197, 94, 0.52)';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(412, 214, 78, 44, -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Costanera Center (vidrio azulado en sector oriente)
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(722, 132, 18, 46);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(726, 138, 10, 34);
        ctx.textAlign = 'center';
        ctx.font = 'italic bold 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(3, 105, 161, 0.85)';
        ctx.fillText('RÍO MAPOCHO', 280, 286);
        ctx.fillStyle = 'rgba(20, 83, 45, 0.80)';
        ctx.fillText('PARQUE METROPOLITANO', 412, 268);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fillText('CORDILLERA DE LOS ANDES', 845, 360);
      } else if (cityKey === 'chile_vina') {
        // Franja de arenas doradas / Playas Viña y Reñaca
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(270, 56);
        ctx.quadraticCurveTo(238, 128, 270, 224);
        ctx.stroke();
        // Estero Marga Marga
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.moveTo(260, 168);
        ctx.quadraticCurveTo(385, 160, 535, 128);
        ctx.stroke();
        // Reloj de Flores ilustrado cerca de Zona 1
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(348, 198, 24, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(348, 198, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(348, 198);
        ctx.lineTo(354, 193);
        ctx.moveTo(348, 198);
        ctx.lineTo(343, 195);
        ctx.stroke();
        // Anfiteatro Quinta Vergara y palmeras
        ctx.fillStyle = 'rgba(22, 163, 74, 0.36)';
        ctx.beginPath();
        ctx.arc(520, 176, 46, Math.PI, Math.PI * 2);
        ctx.fill();
        // Cerros coloridos y ascensores de Valparaíso
        const hillColors = ['#ef4444', '#3b82f6', '#eab308', '#14b8a6', '#a855f7', '#f97316'];
        for (let i = 0; i < 6; i++) {
          const hx = 632 + (i % 3) * 34;
          const hy = 300 + Math.floor(i / 3) * 28;
          ctx.fillStyle = hillColors[i];
          ctx.fillRect(hx, hy, 22, 16);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(hx + 7, hy + 5, 6, 6);
        }
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(615, 340);
        ctx.lineTo(665, 290);
        ctx.stroke();
        // Muelle y grúas del Puerto de Valparaíso
        ctx.fillStyle = '#64748b';
        ctx.fillRect(346, 392, 108, 20);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(365, 372, 16, 20);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(386, 376, 16, 16);
        // Barcos navegando en la Bahía del Pacífico
        const shipY = 392 + Math.sin(t * 1.4) * 10;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(118, shipY);
        ctx.lineTo(188, shipY);
        ctx.lineTo(176, shipY + 14);
        ctx.lineTo(126, shipY + 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(132, shipY - 10, 18, 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(152, shipY - 10, 16, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(166, shipY - 16, 12, 16);
        // Velero en el norte de la bahía
        const boatX = 180 + Math.cos(t * 1.1) * 10;
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(boatX - 12, 208, 24, 6);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(boatX, 186);
        ctx.lineTo(boatX + 12, 206);
        ctx.lineTo(boatX, 206);
        ctx.closePath();
        ctx.fill();
      } else if (cityKey === 'chile_atacama') {
        // Ondas de dunas del desierto
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.25)';
        ctx.lineWidth = 3;
        for (let dy = 110; dy <= 470; dy += 58) {
          ctx.beginPath();
          ctx.moveTo(0, dy);
          ctx.quadraticCurveTo(320, dy - 26, 650, dy + 12);
          ctx.quadraticCurveTo(810, dy + 28, 960, dy - 10);
          ctx.stroke();
        }
        // Géiseres del Tatio (pozas termales y columnas de vapor)
        ctx.fillStyle = '#06b6d4';
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(165, 175, 22, 11, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (let p = 0; p < 3; p++) {
          const drift = ((t * 14 + p * 8) % 24);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - drift / 34})`;
          ctx.beginPath();
          ctx.arc(160 + p * 8, 165 - drift, 5 + drift * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
        // Salar de Atacama blanco + Laguna Chaxa turquesa + Flamencos rosados
        ctx.fillStyle = 'rgba(255, 251, 235, 0.85)';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(418, 360, 152, 68, -0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.ellipse(395, 362, 62, 26, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(478, 355, 38, 18, 0.15, 0, Math.PI * 2);
        ctx.fill();
        [[378, 362], [412, 356], [472, 355]].forEach(([fx, fy]) => {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(fx, fy - 4, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#be185d';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(fx, fy - 2);
          ctx.lineTo(fx, fy + 4);
          ctx.stroke();
        });
        // Valle de la Luna (crestas rojizas de sal y arenisca)
        ctx.fillStyle = 'rgba(180, 62, 32, 0.55)';
        ctx.beginPath();
        ctx.moveTo(548, 265);
        ctx.lineTo(582, 212);
        ctx.lineTo(615, 250);
        ctx.lineTo(648, 206);
        ctx.lineTo(676, 268);
        ctx.closePath();
        ctx.fill();
        // Volcán Licancabur y platos blancos de Observatorio ALMA
        ctx.fillStyle = 'rgba(100, 58, 45, 0.65)';
        ctx.beginPath();
        ctx.moveTo(815, 290);
        ctx.lineTo(892, 180);
        ctx.lineTo(968, 290);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(248, 250, 252, 0.82)';
        ctx.beginPath();
        ctx.moveTo(868, 215);
        ctx.lineTo(892, 180);
        ctx.lineTo(916, 215);
        ctx.closePath();
        ctx.fill();
        [[748, 134], [768, 126], [818, 136]].forEach(([ax, ay]) => {
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(ax, ay, 6, Math.PI * 0.9, Math.PI * 1.95);
          ctx.fill();
        });
        ctx.textAlign = 'center';
        ctx.font = 'italic bold 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(14, 116, 144, 0.9)';
        ctx.fillText('SALAR DE ATACAMA · LAGUNA CHAXA', 418, 444);
        ctx.fillStyle = 'rgba(124, 45, 18, 0.85)';
        ctx.fillText('VOLCÁN LICANCABUR', 888, 308);
      } else if (cityKey === 'chile_pascua') {
        // Cráter Volcán Rano Kau con laguna
        ctx.fillStyle = '#365314';
        ctx.beginPath();
        ctx.arc(245, 340, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(245, 340, 23, 0, Math.PI * 2);
        ctx.fill();
        // Playa dorada de Anakena al Norte
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.ellipse(460, 146, 36, 11, 0.08, 0, Math.PI * 2);
        ctx.fill();
        // Cantera Rano Raraku con siluetas Moái
        ctx.fillStyle = '#4d7c0f';
        ctx.beginPath();
        ctx.ellipse(545, 260, 32, 22, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Plataforma Ahu Tongariki con hileras de Moáis al Este
        ctx.fillStyle = '#475569';
        ctx.fillRect(722, 304, 72, 10);
        for (let m = 0; m < 5; m++) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(728 + m * 14, 286, 7, 18);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(728 + m * 14, 283, 7, 4);
        }
      }
      ctx.restore();
    }

    renderUshuaiaTerrain(ctx) {
      ctx.save();
      // Cordón montañoso nevado de los Andes Fueguinos / Glaciar Martial
      const peaks = [
        { x: 118, y: 158, w: 96, h: 66 },
        { x: 256, y: 146, w: 118, h: 74 },
        { x: 374, y: 154, w: 112, h: 68 },
        { x: 565, y: 142, w: 126, h: 82 },
        { x: 696, y: 158, w: 116, h: 68 },
        { x: 824, y: 168, w: 108, h: 60 },
        { x: 625, y: 238, w: 94, h: 52 }
      ];
      peaks.forEach((pk) => {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.34)';
        ctx.beginPath();
        ctx.moveTo(pk.x - pk.w * 0.5, pk.y);
        ctx.lineTo(pk.x, pk.y - pk.h);
        ctx.lineTo(pk.x + pk.w * 0.5, pk.y);
        ctx.closePath();
        ctx.fill();

        // Casquete glaciar nevado blanco-celeste
        ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
        ctx.beginPath();
        ctx.moveTo(pk.x - pk.w * 0.24, pk.y - pk.h * 0.52);
        ctx.lineTo(pk.x, pk.y - pk.h);
        ctx.lineTo(pk.x + pk.w * 0.25, pk.y - pk.h * 0.50);
        ctx.lineTo(pk.x + pk.w * 0.08, pk.y - pk.h * 0.42);
        ctx.lineTo(pk.x - pk.w * 0.08, pk.y - pk.h * 0.56);
        ctx.closePath();
        ctx.fill();
      });

      // Bosques australes de lengas y ñires con copa nevada (lejos de nodos)
      const trees = [
        [72, 272], [96, 290], [116, 260], [298, 258], [322, 278],
        [360, 254], [540, 276], [568, 294], [674, 264]
      ];
      trees.forEach(([tx, ty]) => {
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(tx - 2, ty - 4, 4, 8);
        ctx.fillStyle = 'rgba(21, 128, 61, 0.72)';
        ctx.beginPath();
        ctx.moveTo(tx - 9, ty - 2);
        ctx.lineTo(tx, ty - 18);
        ctx.lineTo(tx + 9, ty - 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(248, 250, 252, 0.75)';
        ctx.beginPath();
        ctx.moveTo(tx - 5, ty - 10);
        ctx.lineTo(tx, ty - 18);
        ctx.lineTo(tx + 5, ty - 10);
        ctx.closePath();
        ctx.fill();
      });

      // Olas suaves en el Canal Beagle
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.35)';
      ctx.lineWidth = 1.6;
      const tWave = this.time || 0;
      for (let w = 0; w < 6; w++) {
        const wx = 120 + w * 138 + Math.sin(tWave * 1.4 + w) * 8;
        const wy = 402 + (w % 2) * 34;
        ctx.beginPath();
        ctx.moveTo(wx - 22, wy);
        ctx.quadraticCurveTo(wx, wy - 5, wx + 22, wy);
        ctx.stroke();
      }
      ctx.restore();
    }

    renderUshuaiaOverlay(ctx) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillText('PARQUE NACIONAL', 98, 162);
      ctx.fillText('GLACIAR MARTIAL', 628, 134);
      ctx.font = 'italic bold 9px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.fillText('ISLOTE LES ÉCLAIREURS', 752, 422);
      ctx.restore();
    }

    drawEdge(ctx, idx, edgeObj = null, forcedMode = null) {
      const e = edgeObj || this.edges[idx];
      const n = e.points.length;
      let mode = forcedMode;
      if (!mode) {
        const aUnlocked = this.displayUnlocked(e.a);
        const bUnlocked = this.displayUnlocked(e.b);
        const defA = this.cityDef(e.a);
        const defB = this.cityDef(e.b);
        const isAnimEdge = this.anim && this.anim.scope !== 'city' && this.anim.edgeIdx === idx && this.anim.phase < 2;
        if (isAnimEdge) {
          mode = 'anim';
        } else if (aUnlocked && bUnlocked) {
          mode = 'full';
        } else if (!defA.playable || !defB.playable) {
          mode = 'faint';
        } else if (aUnlocked && !bUnlocked) {
          mode = defB.playable ? 'hidden' : 'faint';
        } else {
          mode = 'hidden';
        }
      }
      if (mode === 'hidden') return;

      ctx.save();
      for (let i = 1; i < n - 1; i++) {
        let r;
        let fill;
        let stroke = null;
        if (mode === 'faint') {
          r = 2.3;
          fill = 'rgba(226, 232, 240, 0.45)';
        } else {
          if (mode === 'anim') {
            const rank = this.anim.rank[i];
            if (rank > this.anim.dotsShown) continue;
            const isNewest = rank === this.anim.dotsShown;
            r = isNewest ? 5.4 : 3.2;
          } else {
            r = 3.1 + 0.9 * Math.sin(this.time * 5 - i * 0.55);
          }
          fill = '#fde047';
          stroke = '#7c2d12';
        }
        ctx.beginPath();
        ctx.arc(e.points[i].x, e.points[i].y, Math.max(1.5, r), 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = stroke;
          ctx.stroke();
        }
      }
      if (mode === 'faint') {
        const mid = e.points[Math.floor(n / 2)];
        ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText('?', mid.x, mid.y - 8);
      }
      ctx.restore();
    }

    drawNode(ctx, x, y, o) {
      const baseR = o.radius || 17;
      const r = baseR * (o.scale || 1);
      const t = this.time;
      ctx.save();
      ctx.translate(x, y);

      // Anillos de efecto 'Unlock'
      if (o.fxT !== null && o.fxT !== undefined && o.fxT < 1.5) {
        for (let k = 0; k < 3; k++) {
          const rt = o.fxT - k * 0.2;
          if (rt <= 0) continue;
          const rr = baseR + rt * 62;
          ctx.beginPath();
          ctx.arc(0, 0, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0, 0.9 - rt * 0.75)})`;
          ctx.lineWidth = 3.2;
          ctx.stroke();
        }
        const flash = Math.max(0, 1 - o.fxT * 2.2);
        if (flash > 0) {
          const fg = ctx.createRadialGradient(0, 0, 2, 0, 0, 52);
          fg.addColorStop(0, `rgba(255, 255, 255, ${flash})`);
          fg.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(0, 0, 52, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!o.locked) {
        const pulse = 0.55 + 0.25 * Math.sin(t * 4);
        const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, r + 20);
        glow.addColorStop(0, `rgba(253, 224, 71, ${pulse})`);
        glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r + 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(2, r * 0.8, r * 0.95, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cuerpo del nodo
      const body = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 2, 0, 0, r);
      if (o.locked) {
        body.addColorStop(0, '#cbd5e1');
        body.addColorStop(1, '#64748b');
      } else if (o.completed) {
        body.addColorStop(0, '#bbf7d0');
        body.addColorStop(1, '#16a34a');
      } else {
        body.addColorStop(0, '#fef08a');
        body.addColorStop(0.55, '#f59e0b');
        body.addColorStop(1, '#dc2626');
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r - 3.4, 0, Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (o.locked) {
        ctx.font = `${Math.round(r * 1.05)}px "Segoe UI Emoji", "Segoe UI", sans-serif`;
        ctx.fillText('🔒', 0, 1);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.font = `900 ${Math.round(r * 1.05)}px "Segoe UI", system-ui, sans-serif`;
        ctx.strokeText(String(o.number), 0, 1);
        ctx.fillText(String(o.number), 0, 1);
      }
      ctx.textBaseline = 'alphabetic';

      if (o.completed && !o.locked) {
        ctx.font = '15px "Segoe UI Emoji", "Segoe UI", sans-serif';
        ctx.fillText('⭐', r * 0.8, -r * 0.85);
      }
      if (o.icon && !o.locked) {
        ctx.font = '14px "Segoe UI Emoji", "Segoe UI", sans-serif';
        ctx.fillText(o.icon, -r * 0.85, -r * 0.85);
      }

      if (o.selected) {
        ctx.save();
        ctx.rotate(t * 1.1);
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Etiqueta
      if (o.label) {
        ctx.save();
        ctx.textAlign = 'center';
        const lx = x + (o.labelDx || 0);
        const ly = y + r + 17 + (o.labelDy || 0);
        const hasSub = !!o.sublabel;
        ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
        const mainW = ctx.measureText(o.label).width;
        let subW = 0;
        if (hasSub) {
          ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
          subW = ctx.measureText(o.sublabel).width;
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
        }
        const tw = Math.max(mainW, subW) + 20;
        ctx.fillStyle = o.locked ? 'rgba(30, 41, 59, 0.82)' : 'rgba(9, 13, 22, 0.88)';
        ctx.strokeStyle = o.locked ? '#64748b' : (o.borderColor || '#fbbf24');
        ctx.lineWidth = 1.8;
        const ph = hasSub ? 34 : 22;
        ctx.beginPath();
        ctx.roundRect(lx - tw * 0.5, ly - 15, tw, ph, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = o.locked ? '#cbd5e1' : '#fef08a';
        ctx.fillText(o.label, lx, ly);
        if (hasSub) {
          ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = o.locked ? '#94a3b8' : (o.sublabelColor || '#e2e8f0');
          ctx.fillText(o.sublabel, lx, ly + 14);
        }
        ctx.restore();
      }
    }

    drawTinaCursor(ctx, px, py, scale) {
      const game = this.game;
      const moving = this.tina.moving;
      const supportsWater = this.supportsWaterSurface();
      const hopT = supportsWater ? this.tina.hopT || 0 : 0;
      const hopDur = this.tina.hopDur || 0.34;
      const hopFrac = hopT > 0 ? clamp(hopT / hopDur, 0, 1) : 0;
      const jumpArc = hopT > 0 ? -Math.sin(hopFrac * Math.PI) * (this.tina.hopHeight || 16) : 0;
      const swimming = supportsWater && this.tina.inWater && (hopT <= 0 || jumpArc > -5);

      ctx.save();
      ctx.translate(px, py - 8);

      if (swimming) {
        // Ondas de flotación y estela circular en la superficie del mar
        const rPulse = (this.time * 2.2) % 1;
        for (let ring = 0; ring < 2; ring++) {
          const ph = (rPulse + ring * 0.5) % 1;
          const rx = (11 + ph * 12) * scale;
          const ry = (3.4 + ph * 3.8) * scale;
          ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - ph) * 0.72})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(0, 11 * scale, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Sombra terrestre / proyectada durante el salto al agua
        const shadowScale = clamp(1 + jumpArc / 48, 0.5, 1);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 15 * scale, 13 * scale * shadowScale, 4 * scale * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flechita saltarina sobre la Tina
      if (!this.transition) {
        const bob = Math.sin(this.time * 6) * 3;
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-5, -26 * scale + bob + jumpArc * 0.7);
        ctx.lineTo(5, -26 * scale + bob + jumpArc * 0.7);
        ctx.lineTo(0, -19 * scale + bob + jumpArc * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.scale(scale * 0.9, scale * 0.9);
      const walkBob = !swimming && hopT <= 0 && moving ? Math.abs(Math.sin(this.tina.anim * 14)) * -3 : 0;
      const swimFloat = swimming ? Math.sin(this.tina.anim * 6.5) * 1.4 : 0;
      ctx.translate(0, walkBob + jumpArc + swimFloat);
      game.sprites.drawTinaHD(
        ctx,
        -17,
        -14,
        this.tina.facing,
        moving,
        !hopT && !swimming,
        this.tina.anim,
        0,
        false,
        swimming ? { pose: 'swim' } : null
      );
      ctx.restore();
    }

    renderFxAndFloaters(ctx) {
      for (let i = 0; i < this.fx.length; i++) {
        const p = this.fx[i];
        ctx.globalAlpha = clamp(p.life / (p.max * 0.55), 0, 1);
        if (p.kind === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.44, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      for (let i = 0; i < this.floaters.length; i++) {
        const f = this.floaters[i];
        ctx.save();
        ctx.globalAlpha = clamp(f.life / (f.max * 0.4), 0, 1);
        ctx.textAlign = 'center';
        ctx.font = '900 15px "Segoe UI", system-ui, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0f172a';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    }

    // ------------------------------ INTERFAZ ------------------------------
    renderTitleBar(ctx, level) {
      ctx.save();
      const g = ctx.createLinearGradient(0, 0, 0, 52);
      g.addColorStop(0, 'rgba(9, 13, 22, 0.92)');
      g.addColorStop(1, 'rgba(9, 13, 22, 0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 52);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 50, W, 2);

      // Botón VOLVER
      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(14, 10, 110, 32, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      const cityBackLabel = isChileCityTag(this.activeCity)
        ? '◀ CHILE'
        : isSouthAmericaCityTag(this.activeCity)
        ? '◀ ARGENTINA'
        : '◀ ESPAÑA';
      const backLabel =
        level === 'city'
          ? cityBackLabel
          : level === 'chile' || level === 'spain' || level === 'southamerica'
          ? '◀ MAPA MUNDI'
          : '◀ MENÚ';
      ctx.fillText(backLabel, 69, 31);

      ctx.fillStyle = '#fde047';
      ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
      const slotTag = WorldProgress.activeSlotId ? ` • PARTIDA ${WorldProgress.activeSlotId}` : '';
      let centerTitle = '🌍 MAPA MUNDI';
      if (level === 'city') {
        const cDef = this.cityDef(this.activeCity);
        const cName = this.extractNameText(cDef?.name, this.activeCity || 'CIUDAD').toUpperCase();
        centerTitle = `📍 ${cName} — ZONAS`;
      } else if (level === 'chile') {
        centerTitle = '🌎 AMÉRICA DEL SUR · CHILE';
      } else if (level === 'southamerica') {
        centerTitle = '🌎 AMÉRICA DEL SUR · ARGENTINA';
      } else if (level === 'spain') {
        centerTitle = '🌍 EUROPA · ESPAÑA';
      }
      ctx.fillText(centerTitle + slotTag, 396, 33, 496);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`MONEDAS: 🪙 ${this.game.totalCoins}  |  PUNTOS: ${String(this.game.score).padStart(5, '0')}`, W - 18, 22);
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`RÉCORD SLOT: ${WorldProgress.getSlotMaxDisplayScore()}`, W - 18, 40);
      ctx.restore();
    }

    renderInfoCard(ctx) {
      ctx.save();
      const isTouch = document.body.classList.contains('touch-device');
      let title = '';
      let line1 = '';
      let line2 = '';

      let line1Color = '#e2e8f0';
      if (this.level === 'world') {
        if (this.worldAnim) {
          const toChile = this.worldAnim.to === 'chile';
          title = toChile ? '✈ ¡RUMBO A LA CORDILLERA!' : '✈ ¡TRAVESÍA TRANSATLÁNTICA!';
          line1 = toChile
            ? '¡Argentina 100%! Volando hacia Chile…'
            : '¡España 100%! Volando rumbo a Argentina…';
          line2 = isTouch ? 'SALTAR: saltear animación' : 'ENTER: saltear animación';
        } else if (this.worldNode === 'spain') {
          const allSpain = WorldProgress.isSpainCompleted();
          title = allSpain ? '🌍 Europa (100%)' : '🌍 Europa';
          line1 = 'España • BCN - Madrid - Palma - Canarias';
          line2 = isTouch ? 'SALTAR: entrar a Europa' : 'ENTER: entrar a Europa (zoom)';
        } else if (this.worldNode === 'chile') {
          if (isCountryTempLocked('chile')) {
            title = '🇨🇱 Chile (Próximamente)';
            line1 = '🔒 Próximamente';
            line2 = 'Destino en preparación';
          } else if (WorldProgress.isContinentUnlocked('chile')) {
            const chDone =
              WorldProgress.isCityCompleted('chile_santiago') &&
              WorldProgress.isCityCompleted('chile_vina') &&
              WorldProgress.isCityCompleted('chile_atacama') &&
              WorldProgress.isCityCompleted('chile_pascua');
            title = chDone ? '🇨🇱 Chile (100%)' : '🇨🇱 Chile';
            line1 = 'Santiago • Viña • Atacama • Isla de Pascua';
            line2 = isTouch ? 'SALTAR: entrar a Chile' : 'ENTER: entrar a Chile (zoom)';
          } else {
            title = '📍 ???';
            line1 = '🔒 Chile bloqueado';
            line2 = 'Completa Ushuaia en Argentina';
          }
        } else if (this.worldNode === 'venezuela') {
          title = '🔒 ?????';
          line1 = '?????';
          line2 = 'Destino misterioso por descubrir';
        } else if (WorldProgress.isContinentUnlocked('argentina')) {
          const argDone =
            WorldProgress.isCityCompleted('buenosaires') &&
            WorldProgress.isCityCompleted('rosario') &&
            WorldProgress.isCityCompleted('cordoba') &&
            WorldProgress.isCityCompleted('ushuaia');
          title = argDone ? '🇦🇷 Argentina (100%)' : '🇦🇷 Argentina';
          line1 = 'Buenos Aires • Rosario • Córdoba • Ushuaia';
          line2 = isTouch ? 'SALTAR: entrar a Argentina' : 'ENTER: entrar a Argentina (zoom)';
        } else {
          title = '📍 ???';
          line1 = '🔒 Destino secreto de Sudamérica';
          line2 = 'Completa Barcelona, Madrid, Palma y Canarias';
        }
      } else if (this.anim) {
        title = '✨ ¡Nuevo camino!';
        line1 = 'La Tina traza la ruta hacia el siguiente destino…';
        line2 = isTouch ? 'SALTAR: saltear animación' : 'ENTER: saltear animación';
      } else if (this.level === 'city') {
        const sub = CITY_SUBMAPS[this.activeCity] || CITY_SUBMAPS.barcelona;
        const z = this.getEffectiveNode(
          this.zoneCursor,
          this.cityEdges[this.activeCity] || [],
          sub.nodes,
          (zn) => this.displayZoneUnlocked(this.activeCity, zn)
        );
        if (z !== null && z !== undefined) {
          const unlocked = WorldProgress.isZoneUnlocked(this.activeCity, z);
          if (!unlocked) {
            title = '🔒 ???';
            line1 = 'Zona bloqueada';
            line2 = 'Completá la zona anterior para revelarla';
          } else {
            const icon = (sub.nodes[z] && sub.nodes[z].icon) || '📍';
            const done = WorldProgress.isZoneCompleted(this.activeCity, z);
            const best = WorldProgress.getZoneHighScore(this.activeCity, z);
            title = `${icon} ${this.getZoneDisplayName(this.activeCity, z)}`;
            line1 = `${done ? '⭐ Completada' : 'Disponible'} · Récord: ${best > 0 ? best : '---'}`;
            line2 = isTouch ? 'SALTAR: jugar esta zona' : 'ENTER / ESPACIO: jugar esta zona';
          }
        } else {
          title = '🐾 La Tina en camino…';
          line1 = 'Movete libremente entre zonas desbloqueadas';
          line2 = '';
        }
      } else {
        const meta = this.getCountryMeta(this.level);
        const key =
          this.hoverPreviewNode ||
          this.selectedLockedNode ||
          this.getEffectiveNode(
            this[meta.cursorKey],
            meta.edges,
            meta.nodes,
            (cKey) => this.displayUnlocked(cKey)
          );
        if (key) {
          const def = this.cityDef(key);
          title = `📍 ${def.name}`;
          if (!def.playable) {
            line1 = '🔒 Próximamente - En desarrollo';
            line2 = def.isCountry ? 'Nuevo país en preparación' : 'Nueva aventura en preparación';
          } else if (!WorldProgress.isUnlocked(key)) {
            line1 = '🔒 Bloqueada';
            line2 = 'Completá la ciudad anterior para desbloquearla';
          } else if (def.isCountry && key === 'chile') {
            const chCities = ['chile_santiago', 'chile_vina', 'chile_atacama', 'chile_pascua'];
            const unlockedCh = chCities.filter((ck) => WorldProgress.isUnlocked(ck)).length;
            const completedCh = chCities.filter((ck) => WorldProgress.isCompleted(ck)).length;
            line1 = WorldProgress.isCompleted('chile')
              ? `⭐ País completado · Ciudades ${completedCh}/4`
              : `Disponible · Ciudades ${unlockedCh}/4 desbloqueadas`;
            line2 = isTouch ? 'SALTAR: entrar a Chile' : 'ENTER / ESPACIO: entrar al mapa de Chile';
          } else {
            const total = (def.levels || []).length;
            const unlockedZones = WorldProgress.getUnlockedZones(key).length;
            const completedZones = WorldProgress.getCompletedZones(key).length;
            line1 = WorldProgress.isCompleted(key)
              ? `⭐ Completada · Zonas ${completedZones}/${total}`
              : `Disponible · Zonas ${unlockedZones}/${total} desbloqueadas`;
            line2 = isTouch ? 'SALTAR: ver zonas de la ciudad' : 'ENTER / ESPACIO: abrir mapa de zonas';
          }
        } else {
          title = '🐾 La Tina en camino…';
          line1 = 'Seguí el camino punteado hasta llegar a un nodo';
          line2 = '';
        }
      }

      // Tarjeta izquierda compacta de estado del nodo (nunca pisa Ushuaia ni sus etiquetas)
      ctx.fillStyle = 'rgba(9, 13, 22, 0.90)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(12, H - 64, 288, 52, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fde047';
      ctx.font = '900 13.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(title, 22, H - 45, 268);
      ctx.fillStyle = line1Color;
      ctx.font = 'bold 10.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(line1, 22, H - 30, 268);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(line2, 22, H - 17, 268);

      // Ayuda de controles (solo Flechas + ENTER + ESC)
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(W - 336, H - 70, 320, 54, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
      if (isTouch) {
        ctx.fillText('JOYSTICK: mover la Tina  ·  SALTAR: entrar', W - 28, H - 46);
        ctx.fillText('RESERVA: volver  ·  o tocá un nodo', W - 28, H - 28);
      } else {
        ctx.fillText('◀ ▲ ▼ ▶: mover la Tina por el camino', W - 28, H - 46);
        ctx.fillText('ENTER: entrar  ·  ESC: volver', W - 28, H - 28);
      }
      ctx.restore();
    }

    renderResetConfirmModal(ctx) {
      const slotLabel = WorldProgress.activeSlotId ? `Partida ${WorldProgress.activeSlotId}` : 'este Slot';
      ctx.save();
      ctx.fillStyle = 'rgba(9, 13, 22, 0.78)';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(225, 165, 510, 200, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`¿Reiniciar progreso de la ${slotLabel}?`, W * 0.5, 214);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        'Se bloquearán Madrid/Palma/Canarias y el puntaje/monedas volverán a 0.',
        W * 0.5,
        248
      );

      // Botón SÍ, REINICIAR
      const yesActive = this.resetConfirmCursor === 0;
      ctx.fillStyle = yesActive ? '#dc2626' : '#7f1d1d';
      ctx.strokeStyle = yesActive ? '#fde047' : '#ef4444';
      ctx.lineWidth = yesActive ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(265, 292, 197, 48, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('SÍ, REINICIAR', 363.5, 321);

      // Botón CANCELAR
      const noActive = this.resetConfirmCursor !== 0;
      ctx.fillStyle = noActive ? '#334155' : '#1e293b';
      ctx.strokeStyle = noActive ? '#fde047' : '#64748b';
      ctx.lineWidth = noActive ? 3 : 2;
      ctx.beginPath();
      ctx.roundRect(498, 292, 197, 48, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('CANCELAR', 596.5, 321);

      ctx.restore();
    }

    renderAnimBanner(ctx) {
      if (this.worldAnim) {
        const wa = this.worldAnim;
        let text = '';
        let sub = '';
        if (wa.phase === 0) {
          text = '🏆 ¡ESPAÑA COMPLETADA AL 100%!';
          sub = 'Barcelona · Madrid · Palma · Canarias';
        } else if (wa.phase === 1) {
          text = '✈ ¡CRUZANDO EL OCÉANO ATLÁNTICO!';
          sub = 'Siguiente destino intercontinental: América del Sur';
        } else {
          text = '🌎 ¡AMÉRICA DEL SUR DESBLOQUEADA!';
          sub = '🇦🇷 Argentina · 🇻🇪 Venezuela · ¡Gran Final de España!';
        }
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
        const w = Math.max(410, ctx.measureText(text).width + 58);
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.strokeStyle = wa.phase === 2 ? '#4ade80' : '#fbbf24';
        ctx.lineWidth = wa.phase === 2 ? 3.4 : 2.6;
        ctx.beginPath();
        ctx.roundRect(W * 0.5 - w * 0.5, 66, w, 64, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = wa.phase === 2 ? '#4ade80' : '#fde047';
        ctx.fillText(text, W * 0.5, 96);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(sub, W * 0.5, 118);
        ctx.restore();
        return;
      }

      const a = this.anim;
      if (!a) return;
      const isCityScope = a.scope === 'city';
      const cityLevels =
        isCityScope && this.cityDef(a.city) && Array.isArray(this.cityDef(a.city).levels)
          ? this.cityDef(a.city).levels
          : null;
      const fromRaw = isCityScope
        ? ((cityLevels && cityLevels[a.from - 1] && cityLevels[a.from - 1].name) || `Zona ${a.from}`)
        : this.cityDef(a.from)?.name;
      const toRaw = isCityScope
        ? ((cityLevels && cityLevels[a.to - 1] && cityLevels[a.to - 1].name) || `Zona ${a.to}`)
        : this.cityDef(a.to)?.name;
      const fromName = this.extractNameText(fromRaw, 'ZONA');
      const toName = this.extractNameText(toRaw, 'NUEVA ZONA');
      let text;
      let sub = '';
      if (a.phase === 0) {
        text = `¡${fromName.toUpperCase()} COMPLETADA!`;
        sub = '⭐ ¡Excelente aventura!';
      } else if (a.phase === 1) {
        text = isCityScope
          ? `Abriendo camino a ${toName}…`
          : `Trazando el camino a ${toName}…`;
      } else {
        text = `🔓 ¡${toName.toUpperCase()} DESBLOQUEADA!`;
        sub = isCityScope
          ? '¡Ya podés caminar hacia la nueva zona!'
          : '¡Ya podés viajar entre ciudades!';
      }
      ctx.save();
      ctx.textAlign = 'center';
      const slide = a.phase === 0 ? clamp(a.t / 0.3, 0, 1) : 1;
      ctx.globalAlpha = slide;
      ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
      const w = Math.max(360, ctx.measureText(text).width + 56);
      ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
      ctx.strokeStyle = a.phase === 2 ? '#fde047' : '#fbbf24';
      ctx.lineWidth = a.phase === 2 ? 3.4 : 2.4;
      ctx.beginPath();
      ctx.roundRect(W * 0.5 - w * 0.5, 66, w, sub ? 62 : 44, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = a.phase === 2 ? '#fde047' : '#ffffff';
      ctx.fillText(text, W * 0.5, 96);
      if (sub) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(sub, W * 0.5, 117);
      }
      ctx.restore();
    }
  }

  global.SaveSlots = SaveSlots;
  global.WorldProgress = WorldProgress;
  global.MapScreen = MapScreen;
})(window);
