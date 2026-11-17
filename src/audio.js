/**
 * ============================================================================
 * AVENTURA EN BARCELONA HD - Motor de Audio Realista y Musical (Web Audio API)
 * ============================================================================
 * Incluye:
 * - Audio Buffer PCM 44.1kHz de Ladrido Doble Realista de la Tina ("¡Guau, guau!")
 *   con modelado acústico de tracto vocal canino (formantes F1/F2/F3 + pulso glotal)
 * - Disparo de Bocadillo de Calamares / Paella Exprés (Tecla F)
 * - Sistema de Caja de Reserva (Item Box Super Mario World: guardar, soltar Q, swap)
 * - Cinemática de Fin de Nivel: Jingle de Victoria estilo Mario, conteo rápido de
 *   puntos/monedas/tiempo y Megafonía del Metro de Barcelona (TMB) en catalán:
 *   "Tren amb destinació [Siguiente Nivel]"
 */
(function (global) {
  'use strict';

  const AUDIO_BASE_PATH = 'assets/audio/';

  // Catálogo extensible por modo de menú/mapa: cada clave acepta múltiples pistas para alternancia A/B.
  // Si el array está vacío, el sistema usa automáticamente el sintetizador Web Audio API como fallback.
  const MENU_TRACK_CONFIG = {
    zen: ['Menú Principal - Aventuras por el Mundo.mp3'],
    world_map: [],
    anthem_spain: ['Himno España.mp3'],
    anthem_argentina: ['Himno Argentina.mp3'],
    anthem_chile: ['Himno Chile.mp3'],
    biplane: []
  };

  // Catálogo oficial por ciudad y zona (arrays listos para variantes A/B en el futuro).
  const ZONE_TRACK_MANIFEST = {
    barcelona: {
      1: ['Barcelona - Zona 1 - Las Ramblas.mp3'],
      2: ['Barcelona - Zona 2 - Sagrada Familia.mp3'],
      3: ['Barcelona - Zona 3 - Park Güell.mp3'],
      4: ['Barcelona - Zona 4 - La Barceloneta.mp3']
    },
    madrid: {
      1: ['Madrid - Zona 1 - Puerta del Sol.mp3'],
      2: ['Madrid - Zona 2 - Plaza Mayor.mp3'],
      3: ['Madrid - Zona 3 - Parque del Retiro.mp3'],
      4: ['Madrid - Zona 4 - Palacio Real.mp3']
    },
    palma: {
      1: ['Palma de Mallorca - Zona 1 - La Seu.mp3'],
      2: ['Palma de Mallorca - Zona 2 - Castell de Bellver.mp3'],
      3: ['Palma de Mallorca - Zona 3 - Calas y Acantilados.mp3'],
      4: ['Palma de Mallorca - Zona 4 - Puerto y Faro.mp3']
    },
    canarias: {
      1: ['Islas Canarias - Zona 1 - Dunas de Maspalomas.mp3'],
      2: ['Islas Canarias - Zona 2 - Bosque de Garajonay.mp3'],
      3: ['Islas Canarias - Zona 3 - Timanfaya.mp3'],
      4: ['Islas Canarias - Zona 4 - Pico del Teide.mp3']
    },
    buenosaires: {
      1: ['Buenos Aires - Zona 1 - Caminito.mp3'],
      2: ['Buenos Aires - Zona 2 - Avenida Corrientes.mp3'],
      3: ['Buenos Aires - Zona 3 - Puerto Madero.mp3'],
      4: ['Buenos Aires - Zona 4 - Tren Mitre a Retiro.mp3']
    },
    rosario: {
      1: ['Rosario - Zona 1 - Monumento a la Bandera.mp3'],
      2: ['Rosario - Zona 2 - La Florida y Puente Rosario-Victoria.mp3'],
      3: ['Rosario - Zona 3 - Parque Independencia.mp3'],
      4: ['Rosario - Zona 4 - Arroyito (El Gigante).mp3']
    },
    cordoba: {
      1: ['Cordoba Zona 1.mp3'],
      2: ['Villa Carlos Paz Zona 2.mp3'],
      3: ['VIlla gral Belgrano Zona 3.mp3'],
      4: ['Uritorco Zona 4.mp3']
    },
    ushuaia: {
      1: ['Centro y Cartel Ushuaia Fin del Mundo (Ushuaia Zona 1).mp3'],
      2: ['Tren del Fin del Mundo (Ushuaia Zona 2).mp3'],
      3: ['Glaciar Martial y Aerosilla (Ushuaia Zona 3).mp3'],
      4: ['Faro Les Éclaireurs (Faro del Fin del Mundo) (Ushuaia Zona 4).mp3']
    },
    chile_santiago: {
      1: ['chile_santiago.mp3.mp3'],
      2: ['chile_santiago_z2.mp3.mp3'],
      3: ['chile_santiago_z3.mp3.mp3'],
      4: ['chile_santiago_z4.mp3.mp3']
    },
    chile_vina: {
      1: ['chile_vina_valparaiso.mp3.mp3'],
      2: [],
      3: [],
      4: []
    },
    chile_atacama: {
      1: ['chile_atacama.mp3.mp3'],
      2: [],
      3: [],
      4: []
    },
    chile_pascua: {
      1: ['chile_isla_pascua.mp3.mp3'],
      2: [],
      3: [],
      4: []
    }
  };

  // Locuciones reales de megafonía (assets/audio/megafonia/*.mp3) por ciudad y zona (1..4).
  // Para destinos sin locución grabada, se conserva fallback automático speechSynthesis.
  const MEGAFONIA_MANIFEST = {
    barcelona: {
      1: 'megafonia/bcn_z1_el_gotic.mp3',
      2: 'megafonia/bcn_z2_park_guell.mp3',
      3: 'megafonia/bcn_z3_sagrada_familia.mp3',
      4: 'megafonia/bcn_z4_madrid.mp3'
    },
    madrid: {
      1: 'megafonia/mad_z1_plaza_mayor.mp3',
      2: 'megafonia/mad_z2_parque_retiro.mp3',
      3: 'megafonia/mad_z3_palacio_real.mp3',
      4: 'megafonia/mad_z4_palma_mallorca.mp3'
    },
    palma: {
      1: 'megafonia/palma_z1_bellver.mp3',
      2: 'megafonia/palma_z2_calas.mp3',
      3: 'megafonia/palma_z3_puerto_faro.mp3',
      4: 'megafonia/palma_z4_palma_intermodal.mp3'
    },
    canarias: {
      1: 'megafonia/canarias_z1_garajonay.mp3',
      2: 'megafonia/canarias_z2_timanfaya.mp3',
      3: 'megafonia/canarias_z3_pico_teide.mp3',
      4: 'megafonia/canarias_z4_cumbre_sudamerica.mp3'
    },
    buenosaires: {
      1: 'megafonia/ba_z1_corrientes.mp3',
      2: 'megafonia/ba_z2_puerto_madero.mp3',
      3: 'megafonia/ba_z3_tren_mitre.mp3',
      4: 'megafonia/ba_z4_estacion_retiro.mp3'
    },
    rosario: {
      1: 'megafonia/rosario_z1_la_florida.mp3',
      2: 'megafonia/rosario_z2_parque_independencia.mp3',
      3: 'megafonia/rosario_z3_arroyito.mp3',
      4: 'megafonia/cordoba_z4_cordoba_capital.mp3'
    },
    cordoba: {
      1: 'megafonia/cordoba_z1_carlos_paz.mp3',
      2: 'megafonia/cordoba_z2_gral_belgrano.mp3',
      3: 'megafonia/cordoba_z3_uritorco.mp3',
      4: 'megafonia/cordoba_z4_Usuhaia.mp3'
    },
    ushuaia: {
      1: 'megafonia/ushuaia_z1_tren_fin_mundo.mp3',
      2: 'megafonia/ushuaia_z2_glaciar_martial.mp3',
      3: 'megafonia/ushuaia_z3_faro_eclaireurs.mp3',
      4: 'megafonia/ushuaia_z4_cruce_chile.mp3'
    },
    chile_santiago: {
      1: 'megafonia/chile_santiago_z1_cerro_san_cristobal.mp3',
      2: 'megafonia/chile_santiago_z2_barrio_lastarria.mp3',
      3: 'megafonia/chile_santiago_z3_costanera_andes.mp3',
      4: 'megafonia/chile_santiago_z4_vina_valparaiso.mp3'
    },
    chile_vina: {
      1: 'megafonia/chile_vina_z1_quinta_vergara.mp3',
      2: 'megafonia/chile_vina_z2_cerros_valparaiso.mp3',
      3: 'megafonia/chile_vina_z3_puerto_valparaiso.mp3',
      4: 'megafonia/chile_vina_z4_desierto_atacama.mp3'
    },
    chile_atacama: {
      1: 'megafonia/chile_atacama_z1_geiseres_tatio.mp3',
      2: 'megafonia/chile_atacama_z2_salar_atacama.mp3',
      3: 'megafonia/chile_atacama_z3_observatorio_alma.mp3',
      4: 'megafonia/chile_atacama_z4_isla_pascua.mp3'
    },
    chile_pascua: {
      1: null, // Hook preparado: megafonia/chile_pascua_z1_volcan_rano_raraku.mp3 (campana provisional)
      2: 'megafonia/chile_pascua_z2_playa_anakena.mp3',
      3: 'megafonia/chile_pascua_z3_volcan_rano_kau.mp3',
      4: 'megafonia/chile_pascua_z4_rumbo_venezuela.mp3'
    }
  };

  const THEME_TO_ZONE_META = {
    ba_tango: { cityKey: 'buenosaires', zoneNum: 1 },
    ba_rock: { cityKey: 'buenosaires', zoneNum: 2 },
    ba_electropop: { cityKey: 'buenosaires', zoneNum: 3 },
    ba_cumbia: { cityKey: 'buenosaires', zoneNum: 4 },
    ro_trova: { cityKey: 'rosario', zoneNum: 1 },
    ro_cumbia: { cityKey: 'rosario', zoneNum: 2 },
    ro_funk: { cityKey: 'rosario', zoneNum: 3 },
    ro_cancha: { cityKey: 'rosario', zoneNum: 4 },
    co_cuarteto: { cityKey: 'cordoba', zoneNum: 1 },
    co_cucu: { cityKey: 'cordoba', zoneNum: 2 },
    co_oktober: { cityKey: 'cordoba', zoneNum: 3 },
    co_uritorco: { cityKey: 'cordoba', zoneNum: 4 },
    ush_centro: { cityKey: 'ushuaia', zoneNum: 1 },
    ush_tren: { cityKey: 'ushuaia', zoneNum: 2 },
    ush_glaciar: { cityKey: 'ushuaia', zoneNum: 3 },
    ush_faro: { cityKey: 'ushuaia', zoneNum: 4 },
    ch_santiago_plaza: { cityKey: 'chile_santiago', zoneNum: 1 },
    ch_santiago_cristobal: { cityKey: 'chile_santiago', zoneNum: 2 },
    ch_santiago_lastarria: { cityKey: 'chile_santiago', zoneNum: 3 },
    ch_santiago_costanera: { cityKey: 'chile_santiago', zoneNum: 4 },
    ch_vina_reloj: { cityKey: 'chile_vina', zoneNum: 1 },
    ch_vina_quinta: { cityKey: 'chile_vina', zoneNum: 2 },
    ch_vina_ascensores: { cityKey: 'chile_vina', zoneNum: 3 },
    ch_vina_puerto: { cityKey: 'chile_vina', zoneNum: 4 },
    ch_atacama_luna: { cityKey: 'chile_atacama', zoneNum: 1 },
    ch_atacama_tatio: { cityKey: 'chile_atacama', zoneNum: 2 },
    ch_atacama_salar: { cityKey: 'chile_atacama', zoneNum: 3 },
    ch_atacama_alma: { cityKey: 'chile_atacama', zoneNum: 4 },
    ch_pascua_tongariki: { cityKey: 'chile_pascua', zoneNum: 1 },
    ch_pascua_raraku: { cityKey: 'chile_pascua', zoneNum: 2 },
    ch_pascua_anakena: { cityKey: 'chile_pascua', zoneNum: 3 },
    ch_pascua_kau: { cityKey: 'chile_pascua', zoneNum: 4 }
  };

  // Compensación de silencio inicial codificado en pistas MP3 para arranque musical inmediato (frame 0)
  const BGM_START_OFFSETS = {
    'Centro y Cartel Ushuaia Fin del Mundo (Ushuaia Zona 1)': 1.02,
    'Faro Les Éclaireurs (Faro del Fin del Mundo) (Ushuaia Zona 4)': 1.10,
    'chile_santiago': 1.56,
    'chile_santiago_z2': 1.15,
    'chile_santiago_z4': 1.08,
    'chile_isla_pascua': 0.26,
    'Cordoba Zona 1': 0.18,
    'Villa Carlos Paz Zona 2': 0.20,
    'Palma de Mallorca - Zona 1 - La Seu': 0.12
  };

  const SFX_FILES = {
    tina_double_bark: 'tina_double_bark.wav'
  };

  // Slots extensibles para fanfarrias reales MP3 de victoria (con volumen normalizado igual que la BGM)
  const VICTORY_TRACK_CONFIG = {
    level_clear: ['Final_Nivel.mp3'],
    spain_finale: ['Final_Nivel.mp3']
  };

  class SoundManager {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.musicPlaying = false;
      this.musicTimer = null;
      this.stepIndex = 0;
      this.doubleBarkBuffer = null;
      this._pulseUnlocked = false;
      this._deferredMusicTheme = null;
      SoundManager.activeInstance = this;

      const readStoredVol = (key, fallbackPct = 100) => {
        try {
          const raw = localStorage.getItem(key);
          if (raw === null || raw === '') return fallbackPct / 100;
          const num = Number(raw);
          if (!Number.isFinite(num)) return fallbackPct / 100;
          return num > 1 ? Math.max(0, Math.min(1, num / 100)) : Math.max(0, Math.min(1, num));
        } catch (e) {
          return fallbackPct / 100;
        }
      };

      // Cargar estado de muteo y volúmenes independientes persistidos en localStorage
      try {
        const mNew = localStorage.getItem('aventura_muted');
        const mOld = localStorage.getItem('barcelona_muted');
        this.muted = (mNew !== null ? mNew === 'true' : mOld === 'true');
      } catch (e) {
        this.muted = false;
      }

      this.bgmSetting = readStoredVol('aventura_bgm_volume', 100);
      this.sfxSetting = readStoredVol('aventura_sfx_volume', 100);

      this.bus = null; // Bus maestro: se desconecta al cambiar de escena para cortar audios pendientes
      this.sfxBus = null; // Sub-bus para efectos de sonido y fanfarrias (controlado por sfxSetting)
      this._sfxBusParent = null;
      this.bgmBus = null; // Sub-bus para pausar/reanudar la música de nivel manteniendo SFX activos
      this.musicPaused = false;
      this._activeMusicBus = null;
      this.menuBus = null; // Sub-bus dedicado para la música zen ambiental del menú/mapa
      this.speechTimer = null;
      this.announcementAudio = null;
      this.announcementTimer = null;
      this.announcementVolume = 0.92;
      this.musicTheme = null; // 'menu' | 'level' | 'map'
      this.menuMode = 'zen'; // 'zen' | 'world_map' | 'anthem_spain' | 'anthem_argentina' | 'anthem_chile' | 'biplane'
      this.menuMusicPlaying = false;
      this.menuMusicTimer = null;
      this._deferredMenuMusic = false;
      this.menuStepIndex = 0;
      this._pulseWave = null;
      this.musicStepMs = 155;
      this.hurryUp = false;
      this.tempoMultiplier = 1.0;

      // Reproductor de pistas reales (.mp3/.wav) con fallback transparente a Web Audio API
      this.bgmAudio = null;
      this.bgmTrackSrc = null;
      this.baseBgmVolume = 0.42;
      this.bgmVolume = this.baseBgmVolume * this.bgmSetting;
      this.menuAudio = null;
      this.menuTrackSrc = null;
      this.baseMenuVolume = 0.40;
      this.menuVolume = this.baseMenuVolume * this.bgmSetting;
      this.jukeboxAudio = null;
      this.jukeboxTrackId = null;
      this.jukeboxPlaying = false;
      this.baseJukeboxVolume = 0.46;
      this.victoryFanfareGainScale = 0.40; // ~40% de ganancia para equilibrar metales con la BGM MP3
      this.fanfareVolume = 0.38; // Escala normalizada también para futuros MP3 de victoria
      this.fanfareBus = null;
      this._fanfareBusParent = null;
      this.fanfareAudio = null;
      this._activeLevelMeta = null;
      this._activeLevelSlotKey = null;
      this._deferredLevelMeta = null;
      this._audioCache = {};
      this._variantCursor = {};
      this._barkAudioPool = [];
      this._barkPoolIdx = 0;
      this._barkAudioFailed = false;
      this._preloadedCities = {};

      this.bindUnlockHandlers();
      this.preloadEssentialAudio();

      // Progresión Zen / Lo-Fi suave para Menús y Mapa: Fmaj7 -> Em7 -> Dm7 -> Cmaj7
      this.menuProgression = [
        {
          pad: [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
          arp: [523.25, 659.25, 880.0, 659.25]  // C5, E5, A5, E5
        },
        {
          pad: [164.81, 196.0, 246.94, 293.66], // Em7 (E3, G3, B3, D4)
          arp: [493.88, 587.33, 783.99, 587.33] // B4, D5, G5, D5
        },
        {
          pad: [146.83, 174.61, 220.0, 261.63], // Dm7 (D3, F3, A3, C4)
          arp: [440.0, 523.25, 698.46, 523.25]  // A4, C5, F5, C5
        },
        {
          pad: [130.81, 164.81, 196.0, 246.94], // Cmaj7 (C3, E3, G3, B3)
          arp: [392.0, 493.88, 659.25, 783.99]  // G4, B4, E5, G5
        }
      ];

      this.melodyNotes = [
        440.0, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
        587.33, 0, 659.25, 698.46, 587.33, 0, 440.0, 0,
        392.0, 0, 493.88, 587.33, 659.25, 587.33, 523.25, 493.88,
        523.25, 0, 659.25, 783.99, 659.25, 0, 523.25, 0,
        698.46, 0, 659.25, 587.33, 523.25, 0, 587.33, 659.25,
        587.33, 0, 523.25, 493.88, 440.0, 0, 587.33, 0,
        493.88, 523.25, 587.33, 523.25, 493.88, 440.0, 415.3, 493.88,
        440.0, 0, 523.25, 659.25, 880.0, 0, 0, 0
      ];

      this.bassNotes = [
        220.0, 220.0, 164.81, 164.81, 146.83, 146.83, 220.0, 220.0,
        196.0, 196.0, 146.83, 146.83, 130.81, 130.81, 196.0, 196.0,
        174.61, 174.61, 130.81, 130.81, 146.83, 146.83, 110.0, 110.0,
        164.81, 164.81, 123.47, 164.81, 220.0, 164.81, 220.0, 0
      ];

      // Copia de la música de niveles y tema alegre de Mapa General (modo frigio / aire español)
      this.levelMelodyNotes = this.melodyNotes;
      this.levelBassNotes = this.bassNotes;
      this.mapMelodyNotes = [
        587.33, 0, 698.46, 739.99, 880.0, 0, 739.99, 698.46,
        622.25, 0, 698.46, 587.33, 523.25, 0, 587.33, 0,
        587.33, 0, 698.46, 739.99, 880.0, 932.33, 880.0, 739.99,
        698.46, 0, 622.25, 587.33, 523.25, 0, 587.33, 0,
        783.99, 0, 880.0, 932.33, 1174.66, 0, 932.33, 880.0,
        783.99, 0, 698.46, 622.25, 587.33, 0, 523.25, 0,
        587.33, 698.46, 880.0, 698.46, 587.33, 523.25, 466.16, 523.25,
        587.33, 0, 0, 0, 0, 0, 0, 0
      ];
      this.mapBassNotes = [
        146.83, 146.83, 0, 146.83, 155.56, 155.56, 0, 155.56,
        146.83, 146.83, 0, 146.83, 130.81, 130.81, 0, 130.81,
        196.0, 196.0, 0, 196.0, 155.56, 155.56, 0, 155.56,
        146.83, 146.83, 130.81, 130.81, 146.83, 0, 146.83, 0
      ];
    }

    // ------------------------------------------------------------------------
    // Bus maestro: todo sonido sale por aquí. Al cambiar de escena (Juego ->
    // Puntajes -> Mapa) se desconecta y se crea uno nuevo, cortando al instante
    // cualquier nota/ruido ya programado para que nunca se superpongan audios.
    // ------------------------------------------------------------------------
    getBus() {
      if (!this.ctx) return null;
      if (!this.bus) {
        this.bus = this.ctx.createGain();
        this.bus.gain.setValueAtTime(1.0, this.ctx.currentTime);
        if (typeof this.ctx.createDynamicsCompressor === 'function') {
          const comp = this.ctx.createDynamicsCompressor();
          comp.threshold.setValueAtTime(-14, this.ctx.currentTime);
          comp.knee.setValueAtTime(18, this.ctx.currentTime);
          comp.ratio.setValueAtTime(4, this.ctx.currentTime);
          this.bus.connect(comp);
          comp.connect(this.ctx.destination);
        } else {
          this.bus.connect(this.ctx.destination);
        }
      }
      return this.bus;
    }

    getSfxBus() {
      if (!this.ctx) return null;
      const masterBus = this.getBus();
      if (!masterBus) return null;
      const targetGain = this.muted ? 0 : this.sfxSetting;
      if (!this.sfxBus || this._sfxBusParent !== masterBus) {
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.setValueAtTime(targetGain, this.ctx.currentTime);
        this.sfxBus.connect(masterBus);
        this._sfxBusParent = masterBus;
      } else {
        try {
          this.sfxBus.gain.setValueAtTime(targetGain, this.ctx.currentTime);
        } catch (e) {}
      }
      return this.sfxBus;
    }

    getFanfareBus() {
      if (!this.ctx) return null;
      const parentBus = this.getSfxBus() || this.getBus();
      if (!parentBus) return null;
      if (!this.fanfareBus || this._fanfareBusParent !== parentBus) {
        this.fanfareBus = this.ctx.createGain();
        this.fanfareBus.gain.setValueAtTime(this.victoryFanfareGainScale, this.ctx.currentTime);
        this.fanfareBus.connect(parentBus);
        this._fanfareBusParent = parentBus;
      } else {
        try {
          this.fanfareBus.gain.setValueAtTime(this.victoryFanfareGainScale, this.ctx.currentTime);
        } catch (e) {}
      }
      return this.fanfareBus;
    }

    stopFanfareAudio() {
      const audio = this.fanfareAudio;
      this.fanfareAudio = null;
      if (!audio) return;
      try {
        audio.onerror = null;
        audio.onended = null;
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    }

    playVictoryAudioTrack(slotKey = 'level_clear') {
      if (this.muted || this.sfxSetting <= 0.005 || typeof Audio === 'undefined') return false;
      const tracks = this.normalizeTrackList(VICTORY_TRACK_CONFIG[slotKey]);
      if (!tracks.length) return false;
      const fileName = this.selectTrackVariant(tracks, 'victory:' + slotKey);
      if (!fileName) return false;
      const src = this.resolveAudioUrl(fileName);
      const audio = this.getOrCreateAudio(src);
      if (!audio) return false;

      this.stopFanfareAudio();
      try { audio.pause(); } catch (e) {}
      try { audio.currentTime = 0; } catch (e) {}
      audio.playbackRate = 1.0;
      audio.loop = false;
      audio.volume = Math.max(0.01, Math.min(1.0, this.fanfareVolume * this.sfxSetting));
      this.fanfareAudio = audio;

      audio.onerror = () => {
        if (this.fanfareAudio === audio) this.stopFanfareAudio();
      };
      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            if (this.fanfareAudio === audio) this.stopFanfareAudio();
          });
        }
        return true;
      } catch (e) {
        this.stopFanfareAudio();
        return false;
      }
    }

    stopAllSounds(includeAnnouncement = false) {
      this.stopMusic();
      this.stopMenuMusic();
      this.stopJukeboxTrack(false);
      this.stopBiplaneAmbience();
      this.stopFanfareAudio();
      if (includeAnnouncement) {
        this.stopAnnouncementAudio();
      }
      if (this.fanfareBus) {
        try { this.fanfareBus.disconnect(); } catch (e) {}
        this.fanfareBus = null;
        this._fanfareBusParent = null;
      }
      if (this.sfxBus) {
        try { this.sfxBus.disconnect(); } catch (e) {}
        this.sfxBus = null;
        this._sfxBusParent = null;
      }
      if (this.speechTimer) {
        clearTimeout(this.speechTimer);
        this.speechTimer = null;
      }
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
      if (this.bus) {
        try {
          this.bus.disconnect();
        } catch (e) {}
        this.bus = null;
      }
    }

    bindUnlockHandlers() {
      if (this._unlockHandlersBound) return;
      this._unlockHandlersBound = true;
      const onGesture = () => {
        if (typeof global.unlockAudio === 'function') {
          global.unlockAudio();
        } else {
          this.unlock();
        }
      };
      const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
      if (typeof window !== 'undefined') {
        events.forEach((evt) => {
          window.addEventListener(evt, onGesture, { capture: true, passive: true });
        });
      }
      if (typeof document !== 'undefined') {
        events.forEach((evt) => {
          document.addEventListener(evt, onGesture, { capture: true, passive: true });
        });
      }
    }

    playSilentUnlockPulse() {
      if (!this.ctx || (this._pulseUnlocked && this.ctx.state === 'running')) return;
      try {
        const buf = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.ctx.destination);
        src.start(0);
        this._pulseUnlocked = true;
      } catch (e) {}
    }

    _resumePendingMusic() {
      if (this.muted || this.jukeboxPlaying) return;
      if (this._deferredMenuMusic && !this.menuMusicPlaying && this.musicTheme === 'menu') {
        this._deferredMenuMusic = false;
        this.playMenuMusic(this.menuMode || 'zen');
        return;
      }
      if (this._deferredMusicTheme && !this.musicPlaying) {
        const pending = this._deferredMusicTheme;
        const pendingMeta = this._deferredLevelMeta || this._activeLevelMeta;
        this._deferredMusicTheme = null;
        this._deferredLevelMeta = null;
        this.startMusic(pending, pendingMeta);
      }
    }

    resume() {
      if (!this.ctx) {
        this.init();
      }
      if (!this.ctx) return Promise.resolve(false);
      if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
        return this.ctx
          .resume()
          .then(() => {
            this.playSilentUnlockPulse();
            this._resumePendingMusic();
            return this.ctx.state === 'running';
          })
          .catch(() => false);
      }
      this.playSilentUnlockPulse();
      this._resumePendingMusic();
      return Promise.resolve(this.ctx.state === 'running');
    }

    unlock() {
      this.bindUnlockHandlers();
      this.init();
      if (!this.ctx) return false;
      this.resume();
      return this.ctx.state === 'running';
    }

    ensureRunning() {
      this.bindUnlockHandlers();
      this.init();
      if (!this.ctx) return false;
      if (this.ctx.state !== 'running') {
        this.resume();
      }
      return true;
    }

    init() {
      this.bindUnlockHandlers();
      if (!this.ctx) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            this.ctx = new AudioCtx();
          }
        } catch (err) {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state !== 'running') {
        this.ctx.resume().catch(() => {});
      }
      if (this.ctx && !this.doubleBarkBuffer) {
        this.doubleBarkBuffer = this.buildRealDoubleBarkBuffer();
      }
      return Boolean(this.ctx);
    }

    playMenuConfirmChord(short = false) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const triggerChord = () => {
        if (this.muted || !this.ctx) return;
        const notes = short
          ? [587.33, 880.0]
          : [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, idx) => {
          this.playTone(
            f,
            idx === notes.length - 1 ? 'sine' : 'triangle',
            short ? 0.12 : 0.22,
            0.14,
            null,
            idx * 0.032
          );
        });
      };

      if (this.ctx.state === 'running') {
        triggerChord();
      } else {
        this.resume().then((ok) => {
          if (ok) triggerChord();
        });
      }
    }

    /**
     * Genera un AudioBuffer PCM a 44.1kHz con un ladrido doble orgánico y potente
     * ("¡Guau, guau!") modelando el tracto vocal canino (formantes dinámicos F1, F2, F3,
     * ataque plosivo de aire, resonancia torácica y reflexión corta de ambiente).
     */
    buildRealDoubleBarkBuffer() {
      if (!this.ctx) return null;
      const sr = this.ctx.sampleRate || 44100;
      const duration = 0.62;
      const length = Math.floor(sr * duration);
      const buffer = this.ctx.createBuffer(1, length, sr);
      const out = buffer.getChannelData(0);

      const synthesizeSingleBark = (startSec, barkDur, pitchMult, ampMult) => {
        const startSample = Math.floor(startSec * sr);
        const totalSamples = Math.floor(barkDur * sr);
        let phase = 0;

        // Estados de filtros resonantes biquad para F1 (mandíbula), F2 (boca) y F3 (hocico)
        let bp1_y1 = 0, bp1_y2 = 0, bp1_x1 = 0, bp1_x2 = 0;
        let bp2_y1 = 0, bp2_y2 = 0, bp2_x1 = 0, bp2_x2 = 0;
        let bp3_y1 = 0, bp3_y2 = 0, bp3_x1 = 0, bp3_x2 = 0;

        // Semilla pseudoaleatoria determinista para textura de aliento natural
        let rng = 1337 + Math.floor(startSec * 1000);
        const nextRand = () => {
          rng = (rng * 16807) % 2147483647;
          return (rng / 1073741823.5) - 1.0;
        };

        for (let i = 0; i < totalSamples; i++) {
          const idx = startSample + i;
          if (idx >= length) break;
          const u = i / totalSamples; // 0..1 progreso del ladrido ("GUA-U")

          // Contorno de frecuencia fundamental F0 (ataque rápido hacia arriba y caída grave)
          let f0;
          if (u < 0.18) {
            f0 = (185 + (370 - 185) * (u / 0.18)) * pitchMult;
          } else if (u < 0.55) {
            f0 = (370 - (370 - 295) * ((u - 0.18) / 0.37)) * pitchMult;
          } else {
            f0 = (295 - (295 - 148) * ((u - 0.55) / 0.45)) * pitchMult;
          }
          // Micro-vibrato / rugosidad orgánica de las cuerdas vocales
          f0 += Math.sin(u * 85) * 4.5 + nextRand() * 2.2;

          phase += (2 * Math.PI * f0) / sr;

          // Pulso glotal rico en armónicos + subarmónico de pecho
          let glottal = 0;
          for (let h = 1; h <= 11; h++) {
            const rolloff = 1 / Math.pow(h, 0.82);
            glottal += Math.sin(phase * h + (h % 2) * 0.3) * rolloff;
          }
          const chest = Math.sin(phase * 0.5) * 0.45 + Math.sin(phase * 1.5) * 0.25;

          // Turbulencia de aire plosivo inicial ("¡G-") y aspiración final
          const breathEnv = u < 0.14 ? (1 - u / 0.14) * 0.95 : 0.22 * (1 - u);
          const breath = nextRand() * breathEnv;

          const rawSource = glottal * 0.52 + chest * 0.32 + breath * 0.48;

          // Trayectoria de formantes vocálicos del ladrido: "G-U-A-U"
          const vowelOpen = Math.sin(Math.min(1, u * 1.35) * Math.PI); // abre en "A" y cierra en "U"
          const f1 = (370 + 410 * vowelOpen) * pitchMult; // 370 -> 780 -> 370 Hz
          const f2 = (880 + 740 * vowelOpen) * pitchMult; // 880 -> 1620 -> 880 Hz
          const f3 = 2380 * pitchMult;

          const applyResonator = (x, freq, bw, st) => {
            const r = Math.exp((-Math.PI * bw) / sr);
            const c1 = 2 * r * Math.cos((2 * Math.PI * freq) / sr);
            const c2 = -r * r;
            const a0 = 1 - r;
            const y = a0 * (x - r * st.x2) + c1 * st.y1 + c2 * st.y2;
            st.x2 = st.x1;
            st.x1 = x;
            st.y2 = st.y1;
            st.y1 = y;
            return y;
          };

          const s1 = { x1: bp1_x1, x2: bp1_x2, y1: bp1_y1, y2: bp1_y2 };
          const s2 = { x1: bp2_x1, x2: bp2_x2, y1: bp2_y1, y2: bp2_y2 };
          const s3 = { x1: bp3_x1, x2: bp3_x2, y1: bp3_y1, y2: bp3_y2 };

          const r1 = applyResonator(rawSource, f1, 130, s1);
          const r2 = applyResonator(rawSource, f2, 210, s2);
          const r3 = applyResonator(rawSource, f3, 340, s3);

          bp1_x1 = s1.x1; bp1_x2 = s1.x2; bp1_y1 = s1.y1; bp1_y2 = s1.y2;
          bp2_x1 = s2.x1; bp2_x2 = s2.x2; bp2_y1 = s2.y1; bp2_y2 = s2.y2;
          bp3_x1 = s3.x1; bp3_x2 = s3.x2; bp3_y1 = s3.y1; bp3_y2 = s3.y2;

          // Envolvente de amplitud percusiva real de ladrido
          let env;
          if (u < 0.04) {
            env = u / 0.04;
          } else if (u < 0.38) {
            env = 1.0 - (u - 0.04) * 0.35;
          } else {
            env = 0.88 * Math.pow(1 - (u - 0.38) / 0.62, 1.85);
          }

          const voiced = (r1 * 1.15 + r2 * 0.95 + r3 * 0.45 + chest * 0.25) * env * ampMult;
          out[idx] += Math.tanh(voiced * 2.3);
        }
      };

      // Primer ladrido firme ("¡Guau...") y segundo ladrido aún más enérgico ("...guau!")
      synthesizeSingleBark(0.01, 0.22, 1.0, 0.92);
      synthesizeSingleBark(0.26, 0.26, 1.08, 1.0);

      // Reflexiones tempranas acústicas (13ms y 27ms) y normalización a máximo volumen limpio
      const d1 = Math.floor(0.013 * sr);
      const d2 = Math.floor(0.027 * sr);
      let peak = 0.001;
      for (let i = length - 1; i >= 0; i--) {
        if (i >= d1) out[i] += out[i - d1] * 0.22;
        if (i >= d2) out[i] += out[i - d2] * 0.11;
        const abs = Math.abs(out[i]);
        if (abs > peak) peak = abs;
      }
      const norm = 0.96 / peak;
      for (let i = 0; i < length; i++) {
        out[i] *= norm;
      }
      return buffer;
    }

    syncMuteUI() {
      if (typeof document === 'undefined') return;
      const icon = this.muted ? '🔇' : '🔊';
      ['btn-mute', 'global-mute-btn'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = icon;
        el.classList.toggle('muted', !!this.muted);
        el.setAttribute('aria-pressed', String(!!this.muted));
      });
    }

    getBgmVolumePercent() {
      return Math.round((this.bgmSetting || 0) * 100);
    }

    getSfxVolumePercent() {
      return Math.round((this.sfxSetting || 0) * 100);
    }

    setBgmVolume(pct) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(Number(pct)) ? Number(pct) : 100));
      this.bgmSetting = clamped / 100;
      this.bgmVolume = this.baseBgmVolume * this.bgmSetting;
      this.menuVolume = this.baseMenuVolume * this.bgmSetting;
      try {
        localStorage.setItem('aventura_bgm_volume', String(Math.round(clamped)));
      } catch (e) {}

      if (this.bgmAudio) {
        try { this.bgmAudio.volume = this.muted ? 0 : this.bgmVolume; } catch (e) {}
      }
      if (this.menuAudio) {
        try { this.menuAudio.volume = this.muted ? 0 : this.menuVolume; } catch (e) {}
      }
      if (this.jukeboxAudio) {
        try { this.jukeboxAudio.volume = this.muted ? 0 : this.baseJukeboxVolume * this.bgmSetting; } catch (e) {}
      }
      if (this.ctx) {
        const now = this.ctx.currentTime;
        if (this.bgmBus) {
          try { this.bgmBus.gain.setValueAtTime(this.muted || this.musicPaused ? 0 : this.bgmSetting, now); } catch (e) {}
        }
        if (this.menuBus) {
          try { this.menuBus.gain.setValueAtTime(this.muted ? 0 : 0.85 * this.bgmSetting, now); } catch (e) {}
        }
      }
      return Math.round(clamped);
    }

    setSfxVolume(pct) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(Number(pct)) ? Number(pct) : 100));
      this.sfxSetting = clamped / 100;
      try {
        localStorage.setItem('aventura_sfx_volume', String(Math.round(clamped)));
      } catch (e) {}

      if (this.ctx && this.sfxBus) {
        try {
          this.sfxBus.gain.setValueAtTime(this.muted ? 0 : this.sfxSetting, this.ctx.currentTime);
        } catch (e) {}
      }
      if (this.fanfareAudio) {
        try { this.fanfareAudio.volume = this.muted ? 0 : Math.min(1.0, this.fanfareVolume * this.sfxSetting); } catch (e) {}
      }
      if (this.announcementAudio) {
        try { this.announcementAudio.volume = this.muted ? 0 : Math.min(1.0, this.announcementVolume * this.sfxSetting); } catch (e) {}
      }
      return Math.round(clamped);
    }

    setMuted(flag) {
      this.muted = !!flag;
      try {
        localStorage.setItem('aventura_muted', String(this.muted));
        localStorage.setItem('barcelona_muted', String(this.muted));
      } catch (e) {}
      if (this.muted) {
        if (this.sfxBus && this.ctx) {
          try { this.sfxBus.gain.setValueAtTime(0, this.ctx.currentTime); } catch (e) {}
        }
        if (this.bgmBus && this.ctx) {
          try { this.bgmBus.gain.setValueAtTime(0, this.ctx.currentTime); } catch (e) {}
        }
        if (this.menuBus && this.ctx) {
          try { this.menuBus.gain.setValueAtTime(0, this.ctx.currentTime); } catch (e) {}
        }
        this.stopAnnouncementAudio();
        this.stopFanfareAudio();
        this.stopBiplaneAmbience();
        if (this._barkAudioPool) {
          this._barkAudioPool.forEach((el) => { try { el.pause(); el.currentTime = 0; } catch (e) {} });
        }
        if (this.jukeboxAudio) {
          try { this.jukeboxAudio.pause(); } catch (e) {}
        }
        this.stopMusic();
        this.stopMenuMusic();
      } else {
        this.init();
        if (this.sfxBus && this.ctx) {
          try { this.sfxBus.gain.setValueAtTime(this.sfxSetting, this.ctx.currentTime); } catch (e) {}
        }
        if (this.jukeboxPlaying && this.jukeboxAudio) {
          try {
            this.jukeboxAudio.volume = this.baseJukeboxVolume * this.bgmSetting;
            const p = this.jukeboxAudio.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } catch (e) {}
        } else if (this.musicTheme === 'menu') {
          this.playMenuMusic(this.menuMode || 'zen');
        } else if (!this.musicPaused) {
          this.startMusic(this.musicTheme || 'level', this._activeLevelMeta);
        }
      }
      this.syncMuteUI();
      return this.muted;
    }

    toggleMute() {
      return this.setMuted(!this.muted);
    }

    playTone(freq, type, duration, vol = 0.18, slideTo = null, delay = 0) {
      if (this.muted) return;
      if (!this.ensureRunning()) return;
      const bus = this._activeMusicBus || this.getSfxBus() || this.getBus();
      if (!bus) return;

      const safeDur = Math.max(0.03, Number.isFinite(duration) ? duration : 0.12);
      const safeVol = Math.max(0.02, Number.isFinite(vol) ? vol : 0.18);
      const safeFreq = Math.max(20, Number.isFinite(freq) ? freq : 440);
      const now = this.ctx.currentTime + Math.max(0, delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(safeFreq, now);
      if (slideTo !== null && Number.isFinite(slideTo)) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + safeDur);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(safeVol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + safeDur);

      osc.connect(gain);
      gain.connect(bus);

      osc.start(now);
      osc.stop(now + safeDur + 0.02);
    }

    beep(freq = 660, duration = 0.10, vol = 0.18, delay = 0) {
      this.playTone(freq, 'square', duration, vol, null, delay);
    }

    boop(freq = 260, duration = 0.14, vol = 0.20, delay = 0) {
      this.playTone(freq, 'sine', duration, vol, Math.max(60, freq * 0.65), delay);
    }

    playNoise(duration, vol = 0.14, filterFreq = 1200, delay = 0) {
      if (this.muted) return;
      if (!this.ensureRunning()) return;
      const bus = this._activeMusicBus || this.getSfxBus() || this.getBus();
      if (!bus) return;

      const safeDur = Math.max(0.03, Number.isFinite(duration) ? duration : 0.1);
      const safeVol = Math.max(0.02, Number.isFinite(vol) ? vol : 0.12);
      const now = this.ctx.currentTime + Math.max(0, delay || 0);
      const bufferSize = Math.max(128, Math.floor(this.ctx.sampleRate * safeDur));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.setValueAtTime(1.4, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(safeVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + safeDur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(bus);

      noise.start(now);
      noise.stop(now + safeDur);
    }

    jump(jumpIndex = 1) {
      if (jumpIndex === 1) {
        this.playTone(240, 'sine', 0.16, 0.20, 620, 0);
        this.playTone(320, 'square', 0.08, 0.08, 540, 0);
      } else {
        // Impulso aéreo de Alas de Ángel (2do o 3er salto)
        const base = jumpIndex === 2 ? 380 : 520;
        this.playTone(base, 'triangle', 0.18, 0.19, base * 1.9, 0);
        this.playTone(base * 1.5, 'sine', 0.22, 0.15, base * 2.4, 0.03);
        this.playNoise(0.12, 0.09, 2200, 0);
      }
    }

    coin() {
      this.playTone(987.77, 'square', 0.08, 0.14, null, 0);
      this.playTone(1318.51, 'sine', 0.24, 0.20, null, 0.06);
    }

    oneUp() {
      const notes = [329.63, 392.0, 659.25, 523.25, 587.33, 783.99, 1046.5];
      notes.forEach((n, i) => {
        const d = i * 0.062;
        this.playTone(n, 'triangle', 0.12, 0.20, null, d);
        this.playTone(n * 2, 'sine', 0.10, 0.09, null, d + 0.01);
      });
    }

    play1Up() {
      return this.oneUp();
    }

    playHiddenBlockReveal() {
      const notes = [587.33, 880.0, 1174.66];
      notes.forEach((n, i) => {
        const d = i * 0.045;
        this.playTone(n, 'triangle', 0.11, 0.18, null, d);
        this.playTone(n * 1.5, 'sine', 0.09, 0.08, null, d + 0.01);
      });
    }

    playSecret1Up() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach((n, i) => {
        const d = i * 0.068;
        this.playTone(n, 'triangle', 0.15, 0.22, null, d);
        this.playTone(n * 2, 'sine', 0.12, 0.10, null, d + 0.012);
      });
    }

    burger() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => {
        this.playTone(n, 'triangle', 0.14, 0.16, null, i * 0.06);
        this.playTone(n * 1.5, 'sine', 0.1, 0.07, null, i * 0.06);
      });
    }

    smoothie() {
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((n, i) => {
        this.playTone(n, 'triangle', 0.12, 0.13, n * 1.05, i * 0.055);
      });
    }

    powerup() {
      const notes = [330, 392, 659.25, 523.25, 587.33, 783.99, 1046.5];
      notes.forEach((n, i) => {
        this.playTone(n, 'triangle', 0.1, 0.14, n * 1.04, i * 0.045);
      });
    }

    // --- Sistema de Caja de Reserva (Item Box estilo Super Mario World) ---
    itemBoxStore() {
      const notes = [587.33, 880.0, 1174.66];
      notes.forEach((n, i) => {
        this.playTone(n, 'triangle', 0.11, 0.16, null, i * 0.055);
      });
    }

    itemBoxDrop() {
      const notes = [987.77, 783.99, 587.33, 783.99];
      notes.forEach((n, i) => {
        this.playTone(n, 'square', 0.08, 0.14, null, i * 0.045);
      });
    }

    itemSwap() {
      this.playTone(659.25, 'triangle', 0.08, 0.16, 987.77, 0);
      this.playTone(987.77, 'sine', 0.14, 0.18, 1318.51, 0.06);
    }

    // --- Disparo Rectilíneo y Diagonal de Planta / Hoja (Tecla J) ---
    plantShoot() {
      this.playTone(620, 'triangle', 0.11, 0.17, 1140, 0);
      this.playTone(940, 'sine', 0.08, 0.12, 520, 0.02);
      this.playNoise(0.07, 0.09, 2400, 0);
    }

    calamaresShoot() {
      this.plantShoot();
    }

    menuSelect() {
      this.playTone(660, 'triangle', 0.06, 0.1, 880, 0);
    }

    playPauseSfx(isPaused = true) {
      if (this.muted) return;
      this.init();
      const notes = isPaused ? [659.25, 523.25] : [523.25, 659.25];
      notes.forEach((f, i) => {
        this.playTone(f, 'square', 0.08, 0.14, null, i * 0.065);
        this.playTone(f * 0.5, 'triangle', 0.08, 0.08, null, i * 0.065);
      });
    }

    earthquake() {
      this.earthquakeImpact();
    }

    victory() {
      this.playMarioVictoryJingle();
    }

    // --- Habilidad de Nico: Ground Pound / Terremoto ---
    groundPoundStart() {
      this.playTone(540, 'sawtooth', 0.18, 0.14, 150, 0);
    }

    earthquakeImpact() {
      this.playTone(130, 'sawtooth', 0.42, 0.26, 30, 0);
      this.playTone(85, 'square', 0.45, 0.22, 24, 0.02);
      this.playNoise(0.4, 0.25, 240, 0);
      this.playNoise(0.26, 0.16, 600, 0.06);
    }

    // --- Habilidad de Andrea: Pose Hipnótica ---
    hypnoticPose() {
      const chord = [523.25, 659.25, 783.99, 987.77, 1318.51, 1567.98];
      chord.forEach((f, i) => {
        this.playTone(f, 'sine', 0.28, 0.13, f * 1.06, i * 0.045);
        this.playTone(f * 0.5, 'triangle', 0.22, 0.09, null, i * 0.045);
      });
    }

    // --- Truco secreto OVNI: Rayo Abductor y Hiperespacio del OVNI del Cerro Uritorco ---
    playUfoAbductionSfx() {
      if (this.muted) return;
      this.init();
      const warble = [380, 540, 440, 680, 560, 880, 740, 1140];
      warble.forEach((f, i) => {
        this.playTone(f, 'sine', 0.11, 0.14, f * 1.18, i * 0.045);
        this.playTone(f * 0.5, 'triangle', 0.10, 0.08, null, i * 0.045);
      });
      this.playNoise(0.38, 0.09, 1450, 0.02);
    }

    playUfoLightspeedSfx() {
      if (this.muted) return;
      this.init();
      this.playTone(180, 'sawtooth', 0.36, 0.12, 1420, 0);
      this.playTone(320, 'sine', 0.65, 0.16, 1760, 0.03);
      this.playTone(640, 'triangle', 0.72, 0.11, 1980, 0.08);
      this.playNoise(0.68, 0.14, 2800, 0.02);
      const shimmer = [783.99, 1046.5, 1318.51, 1567.98];
      shimmer.forEach((f, i) => {
        this.playTone(f, 'sine', 0.32, 0.08, f * 1.12, 0.16 + i * 0.06);
      });
    }

    playUfoEjectSfx() {
      if (this.muted) return;
      this.init();
      this.playTone(1120, 'triangle', 0.16, 0.18, 280, 0);
      this.playTone(680, 'sine', 0.24, 0.14, 190, 0.03);
      this.playNoise(0.14, 0.11, 2200, 0);
    }

    /**
     * Ladrido Doble Real de la Tina ("¡Guau, guau!") reproducido con claridad y potencia
     * mediante AudioBuffer PCM a 44.1kHz al presionar la tecla 'G' o botón táctil.
     */
    playDoubleBarkSampleSynthFallback(volume = 0.85) {
      if (this.muted) return;
      if (!this.ensureRunning()) return;

      if (!this.doubleBarkBuffer) {
        this.doubleBarkBuffer = this.buildRealDoubleBarkBuffer();
      }
      if (this.doubleBarkBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.doubleBarkBuffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);

        src.connect(gain);
        gain.connect(this.getSfxBus() || this.getBus());
        src.start(this.ctx.currentTime);
      }
    }

    playDoubleBarkSample(volume = 0.85) {
      if (this.muted || this.sfxSetting <= 0.005) return;
      const sampleFile = SFX_FILES.tina_double_bark;
      if (!sampleFile || this._barkAudioFailed || typeof Audio === 'undefined') {
        this.playDoubleBarkSampleSynthFallback(volume);
        return;
      }

      try {
        const src = this.resolveAudioUrl(sampleFile);
        if (!this._barkAudioPool || this._barkAudioPool.length === 0) {
          this._barkAudioPool = [new Audio(src), new Audio(src), new Audio(src)];
          this._barkAudioPool.forEach((el) => {
            el.preload = 'auto';
            el.onerror = () => {
              this._barkAudioFailed = true;
            };
          });
        }
        const idx = this._barkPoolIdx % this._barkAudioPool.length;
        this._barkPoolIdx = idx + 1;
        const audio = this._barkAudioPool[idx];
        try { audio.pause(); } catch (e) {}
        try { audio.currentTime = 0; } catch (e) {}
        audio.volume = Math.max(0.0, Math.min(1.0, volume * 0.88 * this.sfxSetting));
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            if (this.muted) return;
            if (!err || err.name !== 'NotAllowedError') {
              this._barkAudioFailed = true;
              this.playDoubleBarkSampleSynthFallback(volume);
            }
          });
        }
      } catch (e) {
        this._barkAudioFailed = true;
        this.playDoubleBarkSampleSynthFallback(volume);
      }
    }

    // --- Habilidad de la Tina: Ladrido Doble Feroz (Tecla G) ---
    tinaGrowl() {
      this.playDoubleBarkSample(0.92);
    }

    bark() {
      this.playDoubleBarkSample(0.78);
    }

    // --- Reliquias Coleccionables, Ultimate Biplano de La Tina y Bonus Frenético ---
    relicPickup() {
      if (this.muted || this.sfxSetting <= 0.005) return;
      if (!this.ensureRunning()) return;
      const notes = [1046.50, 1318.51, 1567.98, 1975.53, 2093.00]; // C6 -> E6 -> G6 -> B6 -> C7
      const prevBus = this._activeMusicBus;
      this._activeMusicBus = this.getSfxBus() || this.getBus();
      try {
        notes.forEach((freq, i) => {
          const d = i * 0.058;
          const isFinal = i === notes.length - 1;
          this.playTone(freq, 'triangle', isFinal ? 0.44 : 0.16, isFinal ? 0.19 : 0.15, null, d);
          this.playTone(freq * 1.5, 'sine', isFinal ? 0.36 : 0.12, 0.06, freq * 1.515, d + 0.008);
          this.playTone(freq * 2.0, 'sine', isFinal ? 0.46 : 0.11, 0.05, null, d + 0.014);
          if (i === 0 || i === 2 || isFinal) {
            this.playBrassNote(freq * 0.5, isFinal ? 0.48 : 0.14, isFinal ? 0.075 : 0.05, d);
          }
        });
        this.playTone(2637.02, 'sine', 0.38, 0.045, null, 0.25);
        this.playTone(3135.96, 'sine', 0.42, 0.038, null, 0.27);
      } finally {
        this._activeMusicBus = prevBus || null;
      }
    }

    tinaUltimateLaunch() {
      if (this.muted || this.sfxSetting <= 0.005) return;
      this.ensureRunning();
      const prevBus = this._activeMusicBus;
      this._activeMusicBus = this.getSfxBus() || this.getBus();
      try {
        if (this.ctx) {
          // Heroic short fanfare flourish + brass launch chord
          const flourish = [
            { f: 523.25, d: 0.11, t: 0.00, v: 0.10 },
            { f: 659.25, d: 0.11, t: 0.065, v: 0.10 },
            { f: 783.99, d: 0.12, t: 0.13, v: 0.11 },
            { f: 1046.50, d: 0.34, t: 0.19, v: 0.12 }
          ];
          flourish.forEach((n) => this.playBrassNote(n.f, n.d, n.v, n.t));
          [261.63, 392.00, 523.25, 659.25].forEach((cf) => {
            this.playBrassNote(cf, 0.36, 0.065, 0.19);
          });
          this.playTone(220, 'triangle', 0.26, 0.12, 660, 0);
          this.playNoise(0.18, 0.09, 2200, 0.02);
        }
      } finally {
        this._activeMusicBus = prevBus || null;
      }
      this.playDoubleBarkSample(0.95);
    }

    biplaneBombDrop() {
      if (this.muted || this.sfxSetting <= 0.005) return;
      if (!this.ensureRunning()) return;
      // Classic Worms-style falling whistle (~980Hz -> ~340Hz over 0.35s)
      this.playTone(980, 'sine', 0.35, 0.14, 340, 0);
      this.playTone(1960, 'sine', 0.24, 0.025, 680, 0.01);
    }

    biplaneBombExplosion() {
      if (this.muted || this.sfxSetting <= 0.005) return;
      if (!this.ensureRunning()) return;
      const bus = this.getSfxBus() || this.getBus();
      if (!bus || !this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Punchy deep bass boom (sine + triangle 120Hz -> 34Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(120, now);
      subOsc.frequency.exponentialRampToValueAtTime(34, now + 0.34);
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.28, now + 0.009);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      subOsc.connect(subGain);
      subGain.connect(bus);
      subOsc.start(now);
      subOsc.stop(now + 0.40);

      const punchOsc = this.ctx.createOscillator();
      const punchGain = this.ctx.createGain();
      punchOsc.type = 'triangle';
      punchOsc.frequency.setValueAtTime(116, now);
      punchOsc.frequency.exponentialRampToValueAtTime(34, now + 0.24);
      punchGain.gain.setValueAtTime(0.001, now);
      punchGain.gain.linearRampToValueAtTime(0.18, now + 0.007);
      punchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      punchOsc.connect(punchGain);
      punchGain.connect(bus);
      punchOsc.start(now);
      punchOsc.stop(now + 0.28);

      // 2. Short lowpass-filtered noise burst for controlled blast crunch
      const dur = 0.28;
      const len = Math.max(128, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.32));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(980, now);
      filter.frequency.exponentialRampToValueAtTime(175, now + dur);
      filter.Q.setValueAtTime(0.85, now);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.001, now);
      nGain.gain.linearRampToValueAtTime(0.24, now + 0.008);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(bus);
      noise.start(now);
      noise.stop(now + dur + 0.02);
    }

    secretBonusEscape() {
      if (this.muted || this.sfxSetting <= 0.005) return;
      if (!this.ensureRunning()) return;
      // Upbeat gentle arcade warp-out arpeggio (bright, positive, never punitive)
      const arp = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98, 2093.00];
      arp.forEach((f, i) => {
        const d = i * 0.052;
        const isLast = i === arp.length - 1;
        this.playTone(f, 'sine', isLast ? 0.36 : 0.14, isLast ? 0.16 : 0.13, isLast ? f * 1.03 : null, d);
        this.playTone(f * 0.5, 'triangle', isLast ? 0.28 : 0.11, 0.06, null, d);
      });
      this.playNoise(0.18, 0.045, 2600, 0.04);
    }

    // --- Impacto de Proyectil / Eliminación ---
    electricZap() {
      this.playTone(880, 'sawtooth', 0.09, 0.16, 210, 0);
      this.playTone(1320, 'square', 0.09, 0.14, 340, 0.04);
      this.playNoise(0.12, 0.15, 2600, 0);
    }

    // --- Sistema de Armadura / Escudo: Romper escudo sin perder vida ---
    shieldBreak() {
      this.playTone(740, 'triangle', 0.16, 0.2, 260, 0);
      this.playTone(520, 'sawtooth', 0.22, 0.18, 140, 0.06);
      this.playNoise(0.22, 0.18, 1900, 0);
    }

    // --- Impacto metálico y rebote en escudo frontal (Clank!) ---
    shieldClang() {
      if (this.muted) return;
      this.playTone(1180, 'triangle', 0.14, 0.22, 920, 0);
      this.playTone(1760, 'sine', 0.16, 0.18, 1520, 0.01);
      this.playTone(620, 'square', 0.07, 0.12, 410, 0);
      this.playNoise(0.08, 0.16, 3600, 0);
    }

    // --- Púas del Erizo Urbano (Nivel 2+) ---
    spikeHit() {
      this.playTone(920, 'sawtooth', 0.12, 0.2, 180, 0);
      this.playTone(620, 'square', 0.16, 0.16, 110, 0.04);
      this.playNoise(0.14, 0.16, 2800, 0);
    }

    // --- Alarma de Peligro / Enjambre Masivo en Nivel 4 (Sagrada Familia) ---
    alarmSiren() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      for (let pulse = 0; pulse < 3; pulse++) {
        const offset = pulse * 0.36;
        this.playTone(440, 'sawtooth', 0.16, 0.22, 880, offset);
        this.playTone(880, 'square', 0.16, 0.18, 440, offset + 0.16);
        this.playNoise(0.12, 0.09, 1800, offset);
      }
    }

    stomp() {
      this.playTone(180, 'triangle', 0.08, 0.18, 420, 0);
      this.playNoise(0.08, 0.1, 800, 0);
    }

    hurt() {
      this.playTone(220, 'sawtooth', 0.22, 0.22, 75, 0);
      this.playTone(165, 'square', 0.22, 0.18, 55, 0.04);
      this.playNoise(0.16, 0.15, 400, 0);
    }

    busArrival() {
      // Bocina amistosa bitonal + freno neumático del autobús EMT de Palma
      this.playTone(392.0, 'square', 0.12, 0.12, null, 0.0);
      this.playTone(493.88, 'sine', 0.12, 0.14, null, 0.0);
      this.playTone(392.0, 'square', 0.22, 0.13, null, 0.16);
      this.playTone(493.88, 'sine', 0.22, 0.15, null, 0.16);
      this.playNoise(0.24, 0.10, 1800, 0.95);
    }

    busDepart() {
      // Cierre neumático de puertas + arranque del motor urbano
      this.playNoise(0.16, 0.11, 2200, 0.0);
      this.playTone(110, 'sawtooth', 0.45, 0.14, 185, 0.12);
      this.playTone(82, 'sine', 0.55, 0.16, 130, 0.12);
    }

    pitFall() {
      this.playTone(480, 'sine', 0.45, 0.16, 90, 0);
      this.playTone(320, 'square', 0.45, 0.1, 65, 0.05);
    }

    // --- Sonido secuencial rápido de liquidación de tiempo y monedas ---
    tallyTick() {
      this.playTone(1318.51, 'square', 0.032, 0.09, null, 0);
    }

    tallyFinish() {
      this.playTone(987.77, 'triangle', 0.09, 0.16, null, 0);
      this.playTone(1318.51, 'triangle', 0.28, 0.18, null, 0.08);
    }

    /**
     * Efecto sutil y suave de explosión lejana de fuegos artificiales tras 7s en level_clear,
     * calibrado para acompañar visualmente sin tapar ni competir con Final_Nivel.mp3.
     */
    playDistantFirework() {
      if (this.muted || this.sfxSetting <= 0.005) return;
      if (!this.ensureRunning()) return;
      const bus = this.getSfxBus() || this.getBus();
      if (!bus) return;

      const now = this.ctx.currentTime;
      // 1. Soplo grave lejano (amortiguado y cálido)
      const osc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(118 + Math.random() * 28, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.24);
      thumpGain.gain.setValueAtTime(0.0001, now);
      thumpGain.gain.linearRampToValueAtTime(0.036, now + 0.015);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      osc.connect(thumpGain);
      thumpGain.connect(bus);
      osc.start(now);
      osc.stop(now + 0.28);

      // 2. Estela suave de pólvora filtrada (filtro paso-bajo / banda distante)
      const dur = 0.26;
      const bufSize = Math.max(128, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        const decay = Math.exp(-i / (bufSize * 0.36));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(760 + Math.random() * 340, now);
      filter.Q.setValueAtTime(0.95, now);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, now);
      nGain.gain.linearRampToValueAtTime(0.038, now + 0.018);
      nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(bus);
      noise.start(now);
      noise.stop(now + dur + 0.02);

      // 3. Dos chispazos cristalinos muy suaves a distancia
      for (let k = 0; k < 2; k++) {
        const delay = 0.06 + k * 0.065;
        const spk = this.ctx.createOscillator();
        const spkGain = this.ctx.createGain();
        spk.type = 'triangle';
        spk.frequency.setValueAtTime(980 + Math.random() * 480, now + delay);
        spk.frequency.exponentialRampToValueAtTime(420, now + delay + 0.08);
        spkGain.gain.setValueAtTime(0.0001, now + delay);
        spkGain.gain.linearRampToValueAtTime(0.012, now + delay + 0.008);
        spkGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.09);
        spk.connect(spkGain);
        spkGain.connect(bus);
        spk.start(now + delay);
        spk.stop(now + delay + 0.1);
      }
    }

    /**
     * Sintetizador de Metales / Trompeta Festiva (Web Audio API):
     * Combina osciladores sawtooth y triangle ligeramente desafinados con un filtro
     * paso-bajo resonante y envolvente de ataque cálido tipo trompeta mediterránea.
     */
    playBrassNote(freq, duration, volume = 0.14, delay = 0) {
      if (this.muted) return;
      if (!this.ensureRunning()) return;

      const start = this.ctx.currentTime + delay;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      subOsc.type = 'sine';

      osc1.frequency.setValueAtTime(freq, start);
      osc2.frequency.setValueAtTime(freq * 1.003, start);
      subOsc.frequency.setValueAtTime(freq * 0.5, start);

      // Envolvente del filtro de latón (brillo de trompeta en el ataque)
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(2.8, start);
      filter.frequency.setValueAtTime(Math.min(900, freq * 1.5), start);
      filter.frequency.exponentialRampToValueAtTime(Math.min(4200, freq * 5.2), start + 0.045);
      filter.frequency.exponentialRampToValueAtTime(Math.min(2600, freq * 3.2), start + duration);

      // Envolvente de amplitud con ataque de metal y caída natural
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.028);
      gain.gain.setValueAtTime(volume * 0.88, start + Math.max(0.04, duration * 0.65));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(this._activeMusicBus || this.getBus());

      osc1.start(start);
      osc2.start(start);
      subOsc.start(start);
      osc1.stop(start + duration + 0.02);
      osc2.stop(start + duration + 0.02);
      subOsc.stop(start + duration + 0.02);
    }

    /**
     * Fanfarria Triunfal Original "Sol de Barcelona" al completar el nivel:
     * Secuencia melódica ascendente, alegre y festiva en Re Mayor (D Major) con
     * trompetas sintetizadas, armonía de acordes mayores y resolución triunfal única.
     */
    playOriginalVictoryFanfare() {
      if (this.muted) return;
      if (this.playVictoryAudioTrack('level_clear')) return;
      this.init();
      if (!this.ctx) return;

      const fanfareBus = this.getFanfareBus();
      const prevBus = this._activeMusicBus;
      this._activeMusicBus = fanfareBus;
      try {
        // Melodía principal de trompeta solista (Re Mayor: D5 - F#5 - A5 - B5 - D6 - E6 - F#6 - D6)
        const leadMelody = [
          // Frase 1: Llamada luminosa ascendente en Re Mayor
          { f: 587.33, d: 0.14, t: 0.00, v: 0.15 }, // D5
          { f: 739.99, d: 0.14, t: 0.15, v: 0.15 }, // F#5
          { f: 880.00, d: 0.14, t: 0.30, v: 0.16 }, // A5
          { f: 1174.66, d: 0.34, t: 0.46, v: 0.18 }, // D6 (salto heroico de cuarta)
          { f: 987.77, d: 0.15, t: 0.84, v: 0.15 }, // B5
          { f: 880.00, d: 0.24, t: 1.00, v: 0.15 }, // A5

          // Frase 2: Ascenso festivo sobre Sol Mayor y La Mayor hacia el clímax en Re Mayor
          { f: 783.99, d: 0.15, t: 1.28, v: 0.15 }, // G5
          { f: 987.77, d: 0.15, t: 1.44, v: 0.16 }, // B5
          { f: 1174.66, d: 0.15, t: 1.60, v: 0.17 }, // D6
          { f: 1108.73, d: 0.15, t: 1.77, v: 0.16 }, // C#6
          { f: 1318.51, d: 0.22, t: 1.94, v: 0.18 }, // E6
          { f: 1479.98, d: 0.68, t: 2.18, v: 0.20 }  // F#6 (Resolución brillante en Re Mayor)
        ];

        leadMelody.forEach((n) => {
          this.playBrassNote(n.f, n.d, n.v, n.t);
        });

        // Acordes mayores de acompañamiento (Sección de metales + Bajo cálido)
        const chords = [
          // Acorde I: D Major (D4, F#4, A4)
          { freqs: [293.66, 369.99, 440.00], d: 0.42, t: 0.46, v: 0.08 },
          // Acorde IV: G Major (G3, B3, D4, G4)
          { freqs: [196.00, 246.94, 293.66, 392.00], d: 0.44, t: 1.28, v: 0.08 },
          // Acorde V: A Major (A3, C#4, E4, A4)
          { freqs: [220.00, 277.18, 329.63, 440.00], d: 0.38, t: 1.77, v: 0.09 },
          // Gran Acorde Final Triunfal I: D Major 9 (D3, A3, D4, F#4, A4, D5)
          { freqs: [146.83, 220.00, 293.66, 369.99, 440.00, 587.33, 1174.66], d: 0.72, t: 2.18, v: 0.08 }
        ];

        chords.forEach((ch) => {
          ch.freqs.forEach((f) => {
            this.playBrassNote(f, ch.d, ch.v, ch.t);
          });
        });

        // Redoble festivo de percusión / platillo brillante en la resolución
        this.playNoise(0.06, 0.08, 2800, 0.46);
        this.playNoise(0.06, 0.08, 2800, 1.28);
        this.playNoise(0.07, 0.09, 3000, 1.77);
        this.playNoise(0.28, 0.12, 3600, 2.18);
      } finally {
        this._activeMusicBus = prevBus || null;
      }
    }

    playMarioVictoryJingle() {
      this.playOriginalVictoryFanfare();
    }

    stopAnnouncementAudio() {
      if (this.announcementTimer) {
        clearTimeout(this.announcementTimer);
        this.announcementTimer = null;
      }
      if (this.speechTimer) {
        clearTimeout(this.speechTimer);
        this.speechTimer = null;
      }
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
      if (this.announcementAudio) {
        try {
          this.announcementAudio.onended = null;
          this.announcementAudio.onerror = null;
          this.announcementAudio.pause();
          this.announcementAudio.currentTime = 0;
        } catch (e) {}
        this.announcementAudio = null;
      }
    }

    resolveMegafoniaFile(city = 'barcelona', zoneNum = null, destinationName = '', isTeide = false) {
      const cityKey = this.normalizeCityTrackKey(city || 'barcelona') || 'barcelona';
      const cityMap = MEGAFONIA_MANIFEST[cityKey];
      if (!cityMap) return null;

      const normDest = String(destinationName || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (cityKey === 'chile_pascua' && (Number(zoneNum) === 1 || normDest.includes('raraku'))) {
        return null;
      }

      const z = Number(zoneNum);
      if (Number.isFinite(z) && z >= 1 && z <= 4 && cityMap[z]) {
        return cityMap[z];
      }

      if (cityKey === 'barcelona') {
        if (normDest.includes('gotic')) return cityMap[1];
        if (normDest.includes('guell')) return cityMap[2];
        if (normDest.includes('sagrada')) return cityMap[3];
        if (normDest.includes('madrid')) return cityMap[4];
      } else if (cityKey === 'madrid') {
        if (normDest.includes('plaza mayor')) return cityMap[1];
        if (normDest.includes('retiro')) return cityMap[2];
        if (normDest.includes('palacio')) return cityMap[3];
        if (normDest.includes('palma') || normDest.includes('mallorca')) return cityMap[4];
      } else if (cityKey === 'palma') {
        if (normDest.includes('bellver')) return cityMap[1];
        if (normDest.includes('cala')) return cityMap[2];
        if (normDest.includes('puerto') || normDest.includes('faro')) return cityMap[3];
        if (normDest.includes('intermodal') || normDest.includes('canarias')) return cityMap[4];
      } else if (cityKey === 'canarias') {
        if (isTeide || normDest.includes('sudamerica') || normDest.includes('cumbre') || normDest.includes('buenos')) return cityMap[4];
        if (normDest.includes('garajonay')) return cityMap[1];
        if (normDest.includes('timanfaya')) return cityMap[2];
        if (normDest.includes('teide')) return cityMap[3];
      } else if (cityKey === 'buenosaires') {
        if (normDest.includes('corrientes')) return cityMap[1];
        if (normDest.includes('madero')) return cityMap[2];
        if (normDest.includes('mitre')) return cityMap[3];
        if (normDest.includes('retiro') || normDest.includes('rosario')) return cityMap[4];
      } else if (cityKey === 'rosario') {
        if (normDest.includes('florida')) return cityMap[1];
        if (normDest.includes('independencia')) return cityMap[2];
        if (normDest.includes('arroyito')) return cityMap[3];
        if (normDest.includes('cordoba') || normDest.includes('capital') || normDest.includes('norte')) return cityMap[4];
      } else if (cityKey === 'cordoba') {
        if (normDest.includes('carlos paz')) return cityMap[1];
        if (normDest.includes('belgrano')) return cityMap[2];
        if (normDest.includes('uritorco') || normDest.includes('capilla')) return cityMap[3];
        if (normDest.includes('ushuaia')) return cityMap[4];
        return null;
      } else if (cityKey === 'ushuaia') {
        if (normDest.includes('tren')) return cityMap[1];
        if (normDest.includes('glaciar') || normDest.includes('martial')) return cityMap[2];
        if (normDest.includes('faro') || normDest.includes('eclaireurs')) return cityMap[3];
        if (normDest.includes('chile') || normDest.includes('santiago') || normDest.includes('cruce')) return cityMap[4];
      } else if (cityKey === 'chile_santiago') {
        if (normDest.includes('cristobal')) return cityMap[1];
        if (normDest.includes('lastarria') || normDest.includes('bellavista')) return cityMap[2];
        if (normDest.includes('costanera') || normDest.includes('andes')) return cityMap[3];
        if (normDest.includes('vina') || normDest.includes('valparaiso')) return cityMap[4];
      } else if (cityKey === 'chile_vina') {
        if (normDest.includes('quinta') || normDest.includes('vergara')) return cityMap[1];
        if (normDest.includes('cerros') || normDest.includes('ascensor')) return cityMap[2];
        if (normDest.includes('puerto')) return cityMap[3];
        if (normDest.includes('atacama') || normDest.includes('desierto')) return cityMap[4];
      } else if (cityKey === 'chile_atacama') {
        if (normDest.includes('tatio') || normDest.includes('geiser')) return cityMap[1];
        if (normDest.includes('salar')) return cityMap[2];
        if (normDest.includes('alma') || normDest.includes('observatorio')) return cityMap[3];
        if (normDest.includes('pascua') || normDest.includes('rapa')) return cityMap[4];
      } else if (cityKey === 'chile_pascua') {
        if (normDest.includes('raraku') || normDest.includes('cantera')) return null;
        if (normDest.includes('anakena')) return cityMap[2];
        if (normDest.includes('kau') || normDest.includes('orongo')) return cityMap[3];
        if (normDest.includes('venezuela') || normDest.includes('caribe') || normDest.includes('rumbo')) return cityMap[4];
      }
      return null;
    }

    _playAnnouncementAudio(fileName, onFallback = null) {
      if (this.muted || this.sfxSetting <= 0.01 || !fileName || typeof Audio === 'undefined') return false;
      const src = this.resolveAudioUrl(fileName);
      const audio = this.getOrCreateAudio(src);
      if (!audio) return false;

      this.stopAnnouncementAudio();
      try { audio.pause(); } catch (e) {}
      try { audio.currentTime = 0; } catch (e) {}
      audio.loop = false;
      audio.playbackRate = 1.0;
      audio.volume = Math.max(0.01, Math.min(1.0, this.announcementVolume * this.sfxSetting));
      this.announcementAudio = audio;

      let fellBack = false;
      const triggerFallback = () => {
        if (fellBack) return;
        fellBack = true;
        if (this.announcementAudio === audio) {
          try {
            audio.onended = null;
            audio.onerror = null;
            audio.pause();
            audio.currentTime = 0;
          } catch (e) {}
          this.announcementAudio = null;
        }
        if (typeof onFallback === 'function' && !this.muted) {
          onFallback();
        }
      };

      audio.onended = () => {
        if (this.announcementAudio === audio) {
          this.announcementAudio = null;
        }
      };
      audio.onerror = () => {
        if (this.announcementAudio === audio) {
          triggerFallback();
        }
      };

      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            if (this.announcementAudio === audio) {
              triggerFallback();
            }
          });
        }
        return true;
      } catch (e) {
        triggerFallback();
        return false;
      }
    }

    playStationBellChime() {
      if (this.muted || this.sfxSetting <= 0.01) return;
      this.init();
      // Campana armónica limpia de anuncio de estación (sin voz errónea ni pitidos robóticos)
      this.playTone(587.33, 'sine', 0.20, 0.16, null, 0.0);
      this.playTone(739.99, 'sine', 0.22, 0.16, null, 0.18);
      this.playTone(880.0, 'sine', 0.28, 0.17, null, 0.36);
      this.playTone(1174.66, 'sine', 0.48, 0.18, null, 0.56);
      this.playTone(587.33, 'triangle', 0.42, 0.07, null, 0.56);
    }

    /**
     * Megafonía real (assets/audio/megafonia/*.mp3) con fallback Web Speech / campana de estación para destinos sin pista.
     */
    playMetroAnnouncement(destinationName, city = 'barcelona', zoneNum = null) {
      if (this.muted) return;
      this.init();

      const playSynthFallback = () => {
        if (this.muted) return;
        const normDestLower = String(destinationName || '').toLowerCase();
        if (
          (city === 'cordoba' && Number(zoneNum) === 4) ||
          normDestLower.includes('ushuaia') ||
          (city === 'chile_pascua' && Number(zoneNum) === 1) ||
          normDestLower.includes('raraku')
        ) {
          this.playStationBellChime();
          return;
        }
        if (city === 'buenosaires' || city === 'rosario' || city === 'cordoba' || city === 'ushuaia') {
          const isRosario = city === 'rosario';
          const isCordoba = city === 'cordoba';
          const isUshuaia = city === 'ushuaia';
          if (isRosario || isCordoba || isUshuaia) {
            // Campanilla urbana cálida / silbato polar de Ushuaia
            this.playTone(isUshuaia ? 698.46 : isCordoba ? 587.33 : 659.25, 'sine', 0.16, 0.16, null, 0.0);
            this.playTone(isUshuaia ? 880.0 : isCordoba ? 739.99 : 783.99, 'sine', 0.18, 0.17, null, 0.15);
            this.playTone(isUshuaia ? 1174.66 : isCordoba ? 880.0 : 1046.5, 'sine', 0.36, 0.19, null, 0.31);
          } else {
            // Carillón clásico del Subte argentino (Sol - Do agudo)
            this.playTone(783.99, 'sine', 0.24, 0.18, null, 0.0);
            this.playTone(1046.5, 'sine', 0.42, 0.20, null, 0.22);
            this.playTone(523.25, 'triangle', 0.35, 0.08, null, 0.22);
          }

          const phrase = (isRosario || isCordoba || isUshuaia)
            ? `Próxima parada: ${destinationName}`
            : `Próxima estación: ${destinationName}`;

          this._speakAnnouncement(
            phrase,
            ['es-ar', 'es-419', 'es-uy', 'es-mx', 'es'],
            'es-AR',
            0.98,
            0.96,
            520
          );

          const syllables = [205, 232, 195, 224, 246, 210, 255, 215];
          syllables.forEach((f, idx) => {
            this.playTone(f, 'triangle', 0.11, 0.055, f * 1.03, 0.60 + idx * 0.13);
          });
        } else if (city === 'madrid') {
          this.playTone(523.25, 'sine', 0.28, 0.18, null, 0.0);
          this.playTone(783.99, 'sine', 0.45, 0.20, null, 0.26);
          this.playTone(1046.5, 'triangle', 0.35, 0.08, null, 0.26);

          const phrase = `Próxima estación: ${destinationName}`;
          this._speakAnnouncement(phrase, ['es-es', 'es'], 'es-ES', 0.98, 1.0, 580);

          const syllables = [220, 245, 205, 235, 255, 225, 270, 230];
          syllables.forEach((f, idx) => {
            this.playTone(f, 'triangle', 0.11, 0.05, f * 1.04, 0.65 + idx * 0.13);
          });
        } else if (city === 'palma') {
          this.playTone(587.33, 'sine', 0.20, 0.18, null, 0.0);
          this.playTone(880.0, 'sine', 0.34, 0.20, null, 0.20);

          const phrase = `Autobús EMT amb destinació ${destinationName}`;
          this._speakAnnouncement(phrase, ['ca', 'es'], 'ca-ES', 0.96, 1.04, 520);

          const syllables = [215, 240, 200, 230, 250, 220, 265, 225];
          syllables.forEach((f, idx) => {
            this.playTone(f, 'triangle', 0.11, 0.07, f * 1.04, 0.56 + idx * 0.13);
          });
        } else {
          this.playTone(523.25, 'sine', 0.26, 0.16, null, 0.0);
          this.playTone(659.25, 'sine', 0.26, 0.16, null, 0.22);
          this.playTone(783.99, 'sine', 0.42, 0.18, null, 0.44);
          this.playTone(1046.5, 'triangle', 0.35, 0.08, null, 0.44);

          const phrase = `Tren amb destinació ${destinationName}`;
          this._speakAnnouncement(phrase, ['ca', 'es'], 'ca-ES', 0.96, 1.04, 620);

          const syllables = [210, 235, 195, 225, 245, 215, 260, 220, 185];
          syllables.forEach((f, idx) => {
            this.playTone(f, 'triangle', 0.11, 0.05, f * 1.04, 0.72 + idx * 0.13);
          });
        }
      };

      const realFile = this.resolveMegafoniaFile(city, zoneNum, destinationName, false);
      if (realFile && this._playAnnouncementAudio(realFile, playSynthFallback)) {
        return;
      }
      playSynthFallback();
    }

    _speakAnnouncement(phrase, langPriority, defaultLang, rate = 0.98, pitch = 1.0, delayMs = 520) {
      if (this.muted || this.sfxSetting <= 0.01) return;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (this.speechTimer) clearTimeout(this.speechTimer);
      this.speechTimer = setTimeout(() => {
        this.speechTimer = null;
        if (this.muted || this.sfxSetting <= 0.01) return;
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(phrase);
          const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          let chosenVoice = null;
          for (let i = 0; i < langPriority.length && !chosenVoice; i++) {
            const target = langPriority[i].toLowerCase();
            chosenVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(target));
          }
          if (chosenVoice) utter.voice = chosenVoice;
          utter.lang = chosenVoice ? chosenVoice.lang : defaultLang;
          utter.rate = rate;
          utter.pitch = pitch;
          utter.volume = Math.max(0, Math.min(1.0, this.sfxSetting));
          window.speechSynthesis.speak(utter);
        } catch (e) {}
      }, delayMs);
    }

    playCanariasAnnouncement(destinationName, isTeide = false, zoneNum = null) {
      if (this.muted) return;
      this.init();

      const playSynthFallback = () => {
        if (this.muted) return;
        this.playTone(659.25, 'sine', 0.22, 0.17, null, 0.0);
        this.playTone(783.99, 'sine', 0.24, 0.17, null, 0.16);
        this.playTone(1046.5, 'sine', 0.36, 0.19, null, 0.34);

        const phrase = isTeide
          ? `Teleférico del Teide con destino a la cumbre. ¡España completada!`
          : `Guagua de Canarias con destino a ${destinationName}`;

        this._speakAnnouncement(phrase, ['es-es', 'es'], 'es-ES', 0.98, 1.02, 520);

        const syllables = [230, 260, 215, 245, 275, 240, 290, 250];
        syllables.forEach((f, idx) => {
          this.playTone(f, 'triangle', 0.11, 0.06, f * 1.04, 0.56 + idx * 0.13);
        });
      };

      const resolvedZone = zoneNum !== null && zoneNum !== undefined ? zoneNum : (isTeide ? 4 : null);
      const realFile = this.resolveMegafoniaFile('canarias', resolvedZone, destinationName, isTeide);
      if (realFile && this._playAnnouncementAudio(realFile, playSynthFallback)) {
        return;
      }
      playSynthFallback();
    }

    playMotoSkidCrash() {
      if (this.muted) return;
      this.playNoise(0.28, 0.16, 2100, 0.02);
      this.playTone(340, 'sawtooth', 0.24, 0.12, 95, 0.03);
      this.playTone(115, 'triangle', 0.18, 0.16, 48, 0.34);
    }

    cableCarChime() {
      this.playTone(880.0, 'sine', 0.16, 0.16, null, 0.0);
      this.playTone(1174.66, 'sine', 0.24, 0.16, null, 0.14);
      this.playTone(1760.0, 'triangle', 0.22, 0.07, null, 0.14);
    }

    cableCarAscend() {
      this.playTone(196.0, 'triangle', 0.65, 0.12, 293.66, 0.0);
      this.playNoise(0.45, 0.07, 1200, 0.05);
    }

    geyserHiss() {
      this.playNoise(0.28, 0.10, 1900, 0.0);
      this.playTone(165, 'sine', 0.25, 0.08, 320, 0.0);
    }

    playSpainFinaleFanfare() {
      if (this.muted) return;
      if (this.playVictoryAudioTrack('spain_finale')) return;
      if (!this.ensureRunning()) return;
      const t0 = this.ctx.currentTime + 0.02;
      const dest = this.getFanfareBus() || this.getBus();
      const notes = [
        { f: 523.25, t: 0.0, d: 0.16, v: 0.20 },
        { f: 659.25, t: 0.15, d: 0.16, v: 0.20 },
        { f: 783.99, t: 0.30, d: 0.18, v: 0.22 },
        { f: 1046.5, t: 0.48, d: 0.32, v: 0.24 },
        { f: 880.0, t: 0.82, d: 0.16, v: 0.20 },
        { f: 987.77, t: 0.98, d: 0.16, v: 0.22 },
        { f: 1174.66, t: 1.15, d: 0.22, v: 0.24 },
        { f: 1567.98, t: 1.38, d: 0.68, v: 0.26 }
      ];
      notes.forEach((n) => {
        const start = t0 + n.t;
        const end = start + n.d;
        const osc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        sub.type = 'sine';
        osc.frequency.setValueAtTime(n.f, start);
        sub.frequency.setValueAtTime(n.f * 0.5, start);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(n.v, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(g);
        sub.connect(g);
        g.connect(dest);
        osc.start(start);
        sub.start(start);
        osc.stop(end + 0.03);
        sub.stop(end + 0.03);
      });
    }

    electricShock() {
      this.playTone(680, 'sawtooth', 0.08, 0.12, 240, 0);
      this.playTone(920, 'square', 0.09, 0.1, 310, 0.05);
    }

    waterSplash() {
      this.playTone(260, 'sine', 0.18, 0.12, 110, 0);
      this.playNoise(0.22, 0.14);
    }

    levelClear() {
      this.playMarioVictoryJingle();
    }

    /**
     * Jingle original de pérdida de vida ("wah-wah-wah-boing"):
     * Tres tonos menores descendentes con filtro resonante + distorsión suave
     * seguidos de un rebote elástico descendente cómico.
     */
    playerDeath() {
      if (this.muted) return;
      if (!this.ensureRunning()) return;

      const ctx = this.ctx;
      const t0 = ctx.currentTime + 0.01;
      const bus = this.getBus();

      // Waveshaper con saturación suave compartida
      const shaper = ctx.createWaveShaper();
      const nSamples = 256;
      const curve = new Float32Array(nSamples);
      for (let i = 0; i < nSamples; i++) {
        const x = (i * 2) / nSamples - 1;
        curve[i] = ((3 + 10) * x * (Math.PI / 9)) / (Math.PI + 10 * Math.abs(x));
      }
      shaper.curve = curve;
      shaper.oversample = '2x';

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, t0);
      shaper.connect(masterGain);
      masterGain.connect(bus);

      // 3 tonos menores descendentes con efecto "wah-wah-wah"
      const wahNotes = [
        { fStart: 293.66, fEnd: 277.18, dur: 0.19, offset: 0.0 },
        { fStart: 261.63, fEnd: 246.94, dur: 0.19, offset: 0.21 },
        { fStart: 220.0, fEnd: 190.0, dur: 0.26, offset: 0.42 }
      ];

      wahNotes.forEach((n) => {
        const start = t0 + n.offset;
        const end = start + n.dur;
        const oscMain = ctx.createOscillator();
        const oscSub = ctx.createOscillator();
        const wahFilter = ctx.createBiquadFilter();
        const noteGain = ctx.createGain();

        oscMain.type = 'sawtooth';
        oscSub.type = 'triangle';
        oscMain.frequency.setValueAtTime(n.fStart, start);
        oscMain.frequency.exponentialRampToValueAtTime(Math.max(40, n.fEnd), end);
        oscSub.frequency.setValueAtTime(n.fStart * 0.5, start);
        oscSub.frequency.exponentialRampToValueAtTime(Math.max(30, n.fEnd * 0.5), end);

        wahFilter.type = 'lowpass';
        wahFilter.Q.setValueAtTime(4.2, start);
        wahFilter.frequency.setValueAtTime(420, start);
        wahFilter.frequency.exponentialRampToValueAtTime(1450, start + n.dur * 0.35);
        wahFilter.frequency.exponentialRampToValueAtTime(360, end);

        noteGain.gain.setValueAtTime(0.0001, start);
        noteGain.gain.linearRampToValueAtTime(0.2, start + 0.025);
        noteGain.gain.setValueAtTime(0.18, start + n.dur * 0.72);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, end);

        oscMain.connect(wahFilter);
        oscSub.connect(wahFilter);
        wahFilter.connect(noteGain);
        noteGain.connect(shaper);

        oscMain.start(start);
        oscSub.start(start);
        oscMain.stop(end + 0.02);
        oscSub.stop(end + 0.02);
      });

      // Caída + "boing" elástico cómico al final
      const bStart = t0 + 0.70;
      const bDur = 0.40;
      const bEnd = bStart + bDur;
      const boingOsc = ctx.createOscillator();
      const boingSub = ctx.createOscillator();
      const boingGain = ctx.createGain();

      boingOsc.type = 'triangle';
      boingSub.type = 'sine';
      boingOsc.frequency.setValueAtTime(210, bStart);
      boingOsc.frequency.exponentialRampToValueAtTime(92, bStart + 0.11);
      boingOsc.frequency.exponentialRampToValueAtTime(248, bStart + 0.19);
      boingOsc.frequency.exponentialRampToValueAtTime(125, bStart + 0.28);
      boingOsc.frequency.exponentialRampToValueAtTime(188, bStart + 0.34);
      boingOsc.frequency.exponentialRampToValueAtTime(84, bEnd);

      boingSub.frequency.setValueAtTime(105, bStart);
      boingSub.frequency.exponentialRampToValueAtTime(55, bEnd);

      boingGain.gain.setValueAtTime(0.0001, bStart);
      boingGain.gain.linearRampToValueAtTime(0.24, bStart + 0.02);
      boingGain.gain.exponentialRampToValueAtTime(0.0001, bEnd);

      boingOsc.connect(boingGain);
      boingSub.connect(boingGain);
      boingGain.connect(shaper);

      boingOsc.start(bStart);
      boingSub.start(bStart);
      boingOsc.stop(bEnd + 0.02);
      boingSub.stop(bEnd + 0.02);
    }

    gameOver() {
      // Melodía dramática de derrota estilo arcade 16-bit (solista descendente + bajo + acorde menor)
      const leadNotes = [
        { f: 392.0, d: 0.22, t: 0.0, type: 'sawtooth', g: 0.14 },
        { f: 369.99, d: 0.22, t: 0.22, type: 'sawtooth', g: 0.13 },
        { f: 349.23, d: 0.22, t: 0.44, type: 'sawtooth', g: 0.13 },
        { f: 329.63, d: 0.30, t: 0.66, type: 'square', g: 0.12 },
        { f: 293.66, d: 0.24, t: 0.94, type: 'sawtooth', g: 0.12 },
        { f: 261.63, d: 0.72, t: 1.18, type: 'sawtooth', g: 0.14 }
      ];
      leadNotes.forEach((n) => {
        this.playTone(n.f, n.type, n.d, n.g, n.f * 0.96, n.t);
      });
      const bassNotes = [
        { f: 130.81, d: 0.42, t: 0.0 },
        { f: 116.54, d: 0.42, t: 0.44 },
        { f: 98.0, d: 0.26, t: 0.94 },
        { f: 65.41, d: 0.78, t: 1.18 }
      ];
      bassNotes.forEach((b) => {
        this.playTone(b.f, 'triangle', b.d, 0.18, b.f * 0.98, b.t);
      });
      // Acorde menor final cálido 16-bit
      [196.0, 233.08, 311.13].forEach((cf) => {
        this.playTone(cf, 'triangle', 0.65, 0.075, cf * 0.985, 1.18);
      });
    }

    firework() {
      this.playTone(280, 'sine', 0.18, 0.07, 880, 0);
      this.playNoise(0.24, 0.12, 1600, 0.15);
    }

    // --- Pasos de bajada al Metro y Efectos del Mapa General (Overworld) ---
    footstep(stepIndex = 0) {
      if (this.muted) return;
      const base = stepIndex % 2 === 0 ? 185 : 155;
      this.playTone(base, 'triangle', 0.045, 0.09, base * 0.72, 0);
      this.playNoise(0.032, 0.045, 1100, 0);
    }

    mapStep(index = 0) {
      const scale = [659.25, 783.99, 880.0, 987.77, 1174.66, 1318.51];
      const f = scale[index % scale.length];
      this.playTone(f, 'square', 0.05, 0.07, null, 0);
    }

    mapPathTick(stepIndex = 0, totalSteps = 12) {
      if (this.muted) return;
      const denom = Math.max(1, totalSteps - 1);
      const ratio = Math.max(0, Math.min(1, stepIndex / denom));
      const baseFreq = 540 + ratio * 360;
      this.playTone(baseFreq, 'sine', 0.048, 0.09, baseFreq * 1.18, 0);
      this.playTone(baseFreq * 1.5, 'triangle', 0.032, 0.048, null, 0);
    }

    mapZoom(zoomIn = true) {
      this.playTone(zoomIn ? 260 : 620, 'sine', 0.7, 0.12, zoomIn ? 880 : 240, 0);
      this.playNoise(0.6, 0.06, zoomIn ? 1400 : 900, 0);
    }

    mapDenied() {
      this.playTone(210, 'triangle', 0.08, 0.085, 165, 0);
      this.playTone(155, 'triangle', 0.13, 0.085, 118, 0.085);
    }

    mapEnter() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => this.playTone(n, 'triangle', 0.12, 0.15, null, i * 0.06));
    }

    // Efecto de 'Unlock': crujido del candado + arpegio mágico ascendente
    mapUnlock() {
      this.playNoise(0.1, 0.12, 3200, 0);
      this.playTone(180, 'square', 0.08, 0.12, 120, 0);
      const arp = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      arp.forEach((n, i) => {
        this.playTone(n, 'triangle', 0.22, 0.15, null, 0.12 + i * 0.075);
        this.playTone(n * 2, 'sine', 0.16, 0.06, null, 0.12 + i * 0.075);
      });
      this.playTone(1046.5, 'triangle', 0.6, 0.12, null, 0.6);
      this.playTone(1318.51, 'sine', 0.6, 0.1, null, 0.6);
      this.playTone(1567.98, 'sine', 0.6, 0.1, null, 0.6);
    }

    startBiplaneAmbience(opts = {}) {
      const withDiscoveryTheme = Boolean(opts && opts.withDiscoveryTheme);
      this.stopBiplaneAmbience();
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;

      const t = this.ctx.currentTime;
      const bus = this.getBus();

      try {
        const osc = this.ctx.createOscillator();
        const chop = this.ctx.createOscillator();
        const chopGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const master = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(66, t);
        osc.frequency.linearRampToValueAtTime(74, t + 1.2);

        // Soft propeller chug modulation
        chop.type = 'sine';
        chop.frequency.setValueAtTime(14.5, t);
        chopGain.gain.setValueAtTime(0.011, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, t);
        filter.Q.setValueAtTime(1.1, t);

        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(withDiscoveryTheme ? 0.042 : 0.036, t + 0.55);

        osc.connect(filter);
        chop.connect(chopGain);
        chopGain.connect(master.gain);
        filter.connect(master);
        master.connect(bus);

        osc.start(t);
        chop.start(t);

        this._biplaneNodes = { osc, chop, chopGain, filter, master };
      } catch (e) {
        this._biplaneNodes = null;
      }

      if (withDiscoveryTheme) {
        // Epic yet warm transatlantic adventure motif over ~5.2s
        const steps = [
          // Fmaj7 warm opening -> C5 rising theme -> G/D lift -> Cmaj9 arrival
          { delay: 0.15, freq: 174.61, type: 'sine', dur: 1.45, gain: 0.046, cutoff: 640 },
          { delay: 0.15, freq: 261.63, type: 'triangle', dur: 1.45, gain: 0.032, cutoff: 980 },
          { delay: 0.35, freq: 392.00, type: 'triangle', dur: 0.55, gain: 0.042, cutoff: 1450 },
          { delay: 0.72, freq: 440.00, type: 'triangle', dur: 0.65, gain: 0.046, cutoff: 1550 },
          { delay: 1.15, freq: 523.25, type: 'sine', dur: 0.95, gain: 0.056, cutoff: 1850 },

          { delay: 1.75, freq: 196.00, type: 'sine', dur: 1.40, gain: 0.045, cutoff: 680 },
          { delay: 1.75, freq: 293.66, type: 'triangle', dur: 1.40, gain: 0.030, cutoff: 1020 },
          { delay: 1.95, freq: 587.33, type: 'triangle', dur: 0.65, gain: 0.050, cutoff: 1750 },
          { delay: 2.38, freq: 659.25, type: 'triangle', dur: 0.85, gain: 0.055, cutoff: 1950 },

          { delay: 3.05, freq: 220.00, type: 'sine', dur: 1.35, gain: 0.046, cutoff: 720 },
          { delay: 3.10, freq: 523.25, type: 'triangle', dur: 0.50, gain: 0.045, cutoff: 1680 },
          { delay: 3.48, freq: 587.33, type: 'triangle', dur: 0.52, gain: 0.048, cutoff: 1780 },
          { delay: 3.88, freq: 783.99, type: 'sine', dur: 1.20, gain: 0.062, cutoff: 2100 },

          // Resolution chord over South America
          { delay: 4.55, freq: 261.63, type: 'sine', dur: 1.55, gain: 0.048, cutoff: 820 },
          { delay: 4.55, freq: 392.00, type: 'triangle', dur: 1.50, gain: 0.036, cutoff: 1200 },
          { delay: 4.65, freq: 659.25, type: 'sine', dur: 1.45, gain: 0.050, cutoff: 1900 },
          { delay: 4.82, freq: 1046.50, type: 'sine', dur: 1.25, gain: 0.042, cutoff: 2300 }
        ];
        this._biplaneThemeTimers = steps.map((n) => setTimeout(() => {
          if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
          this.playZenVoice(n.freq, n.type, n.dur, n.gain, 0.06, n.cutoff, 0);
        }, Math.round(n.delay * 1000)));
      }
    }

    stopBiplaneAmbience() {
      if (this._biplaneThemeTimers) {
        this._biplaneThemeTimers.forEach((id) => clearTimeout(id));
        this._biplaneThemeTimers = null;
      }
      if (!this._biplaneNodes) return;
      const nodes = this._biplaneNodes;
      this._biplaneNodes = null;
      try {
        if (this.ctx) {
          const now = this.ctx.currentTime;
          nodes.master.gain.cancelScheduledValues(now);
          nodes.master.gain.setValueAtTime(Math.max(0.0001, nodes.master.gain.value || 0.01), now);
          nodes.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
          nodes.osc.stop(now + 0.22);
          nodes.chop.stop(now + 0.22);
        } else {
          nodes.osc.stop();
          nodes.chop.stop();
        }
      } catch (e) {}
    }

    playElectronicKick(vol = 0.22, startHz = 138, endHz = 44) {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const bus = this._activeMusicBus || this.getSfxBus() || this.getBus();
      if (!bus) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startHz, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, endHz), now + 0.11);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    playDrumBoom() {
      this.playElectronicKick(0.24, 110, 38);
      this.playNoise(0.09, 0.08, 340, 0);
    }

    playFilteredNoise(duration = 0.08, vol = 0.06, filterType = 'bandpass', freq = 3800) {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const bus = this._activeMusicBus || this.getSfxBus() || this.getBus();
      if (!bus) return;
      const now = this.ctx.currentTime;
      const safeDur = Math.max(0.02, duration);
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * safeDur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(1.4, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + safeDur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      src.start(now);
      src.stop(now + safeDur);
    }

    getPulseWave() {
      if (this._pulseWave || !this.ctx || typeof this.ctx.createPeriodicWave !== 'function') {
        return this._pulseWave;
      }
      const harmonics = 16;
      const real = new Float32Array(harmonics);
      const imag = new Float32Array(harmonics);
      const duty = 0.24;
      for (let n = 1; n < harmonics; n++) {
        imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
      }
      this._pulseWave = this.ctx.createPeriodicWave(real, imag);
      return this._pulseWave;
    }

    playMusicVoice(freq, type, duration, vol, attack = 0.015, cutoffHz = 2000, delay = 0, useMenuBus = false) {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const targetBus = useMenuBus ? this.getMenuBus() : (this._activeMusicBus || this.getBgmBus() || this.getBus());
      if (!targetBus) return;

      const start = this.ctx.currentTime + Math.max(0, delay || 0);
      const safeDur = Math.max(0.05, duration || 0.25);
      const safeAttack = Math.min(safeDur * 0.45, Math.max(0.004, attack || 0.015));
      const safeVol = Math.max(0.002, Math.min(0.16, vol || 0.04));

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      if (type === 'pulse') {
        const pw = this.getPulseWave();
        if (pw) osc.setPeriodicWave(pw);
        else osc.type = 'square';
      } else if (type === 'triangle' || type === 'sawtooth' || type === 'square') {
        osc.type = type;
      } else {
        osc.type = 'sine';
      }
      osc.frequency.setValueAtTime(Math.max(40, freq), start);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(0.75, start);
      filter.frequency.setValueAtTime(cutoffHz, start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(240, cutoffHz * 0.56), start + safeDur);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(safeVol, start + safeAttack);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + safeDur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(targetBus);

      osc.start(start);
      osc.stop(start + safeDur + 0.03);
    }

    playLevelVoice(freq, type, duration, vol, attack = 0.012, cutoffHz = 2200, delay = 0) {
      this.playMusicVoice(freq, type, duration, vol, attack, cutoffHz, delay, false);
    }

    stepBuenosAiresTheme(theme, step) {
      const pitchMod = this.hurryUp ? 1.05946 : 1.0;

      if (theme === 'ba_tango') {
        // BGM Zona 1 (Tango): Sawtooth tipo bandoneón con ataque corto, ritmo 2/4 marcado
        const bar = Math.floor(step / 8) % 4;
        const pos = step % 8;
        const roots = [110.0, 146.83, 82.41, 110.0]; // A2 - D3 - E2 - A2
        const chords = [
          [220.0, 261.63, 329.63],   // Am
          [293.66, 349.23, 440.0],   // Dm
          [246.94, 311.13, 392.0],   // B/E7 dramático
          [220.0, 261.63, 329.63]    // Am
        ];
        const mel = [
          659.25, 0, 587.33, 523.25, 493.88, 0, 440.0, 392.0,
          587.33, 0, 523.25, 440.0, 415.30, 0, 329.63, 0,
          493.88, 523.25, 587.33, 0, 659.25, 587.33, 523.25, 415.30,
          440.0, 0, 523.25, 493.88, 440.0, 0, 329.63, 0
        ];
        // Compás 2/4 marcato en tiempos 1 (pos 0) y 2 (pos 4)
        if (pos === 0 || pos === 4) {
          this.playLevelVoice(roots[bar] * pitchMod, 'sawtooth', 0.16, 0.08, 0.012, 620, 0);
          chords[bar].forEach((cf) => {
            this.playLevelVoice(cf * pitchMod, 'sawtooth', 0.14, 0.032, 0.015, 1650, 0);
          });
          if (pos === 0) this.playElectronicKick(0.11, 95, 42);
        }
        const mf = mel[step % mel.length];
        if (mf > 0) {
          this.playLevelVoice(mf * pitchMod, 'sawtooth', 0.24, 0.055, 0.018, 2100, 0);
        }
        return;
      }

      if (theme === 'ba_rock') {
        // BGM Zona 2 (80s Rock Nacional @ 130 BPM): Kick punchy, bajo rápido, sinte square distorsionado
        const pos = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const bassSeq = [110.0, 110.0, 110.0, 110.0, 98.0, 98.0, 87.31, 98.0];
        const riff = [
          440.0, 0, 523.25, 0, 587.33, 0, 523.25, 493.88,
          440.0, 0, 392.0, 440.0, 523.25, 0, 659.25, 0
        ];
        if (pos % 4 === 0) this.playElectronicKick(0.19, 142, 46);
        if (pos === 4 || pos === 12) this.playFilteredNoise(0.11, 0.11, 'bandpass', 1800);
        if (pos % 2 === 0) {
          const bf = bassSeq[(Math.floor(pos / 2) + bar * 2) % bassSeq.length];
          this.playLevelVoice(bf * pitchMod, 'sawtooth', 0.16, 0.085, 0.008, 740, 0);
        }
        const rf = riff[pos];
        if (rf > 0) {
          this.playLevelVoice(rf * pitchMod, 'square', 0.14, 0.048, 0.006, 2200, 0);
          this.playLevelVoice(rf * 1.498 * pitchMod, 'square', 0.11, 0.022, 0.006, 1800, 0);
        }
        return;
      }

      if (theme === 'ba_electropop') {
        // BGM Zona 3 (Electro-pop Moderno): Four-on-the-floor + arpegios 'sine' brillantes
        const pos = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const arps = [
          [523.25, 659.25, 783.99, 987.77], // Cmaj7
          [440.00, 523.25, 659.25, 783.99], // Am7
          [349.23, 440.00, 523.25, 659.25], // Fmaj7
          [392.00, 493.88, 587.33, 783.99]  // G6
        ];
        const bassRoots = [130.81, 110.0, 87.31, 98.0];
        if (pos % 4 === 0) this.playElectronicKick(0.20, 128, 42);
        if (pos % 4 === 2) this.playFilteredNoise(0.04, 0.045, 'highpass', 5800);
        if (pos === 4 || pos === 12) this.playFilteredNoise(0.08, 0.075, 'bandpass', 2400);
        const oct = pos % 4 === 2 ? 2 : 1;
        if (pos % 2 === 0) {
          this.playLevelVoice(bassRoots[bar] * oct * pitchMod, 'triangle', 0.15, 0.085, 0.008, 920, 0);
        }
        const arpNote = arps[bar][pos % 4] * (pos >= 8 ? 1.5 : 1.0);
        this.playLevelVoice(arpNote * pitchMod, 'sine', 0.16, 0.068, 0.006, 3600, 0);
        return;
      }

      if (theme === 'ba_cumbia') {
        // BGM Zona 4 (Cumbia): Bajo sincopado 'triangle', teclado tropical y güiro ("shhh-sh-shhh")
        const pos = step % 8;
        const bar = Math.floor(step / 8) % 4;
        const cBass = [130.81, 164.81, 196.0, 146.83]; // Cm / Eb / G / Bb groove
        const chords = [
          [523.25, 622.25, 783.99],
          [415.30, 523.25, 622.25],
          [466.16, 587.33, 698.46],
          [392.00, 493.88, 587.33]
        ];
        // Güiro continuo ("shhh-sh-shhh") sobre ruido blanco filtrado
        if (pos % 4 === 0) this.playFilteredNoise(0.11, 0.07, 'highpass', 4200);
        else if (pos % 4 === 2) this.playFilteredNoise(0.045, 0.055, 'highpass', 5400);
        else if (pos % 4 === 3) this.playFilteredNoise(0.08, 0.065, 'highpass', 4700);

        // Bajo sincopado (tiempo 1 fuerte, contratiempo 3 y cierre 6)
        if (pos === 0 || pos === 3 || pos === 6) {
          const bf = cBass[bar] * (pos === 3 ? 1.25 : pos === 6 ? 1.5 : 1.0);
          this.playLevelVoice(bf * pitchMod, 'triangle', 0.22, 0.11, 0.01, 680, 0);
        }
        if (pos === 0 || pos === 4) this.playElectronicKick(0.16, 112, 46);
        // Acordes tropicales en contratiempos 2 y 6
        if (pos === 2 || pos === 6) {
          chords[bar].forEach((f) => {
            this.playLevelVoice(f * pitchMod, 'triangle', 0.14, 0.036, 0.008, 2500, 0);
          });
        }
      }
    }

    stepSpainTheme(theme, step) {
      const pitchMod = this.hurryUp ? 1.05946 : 1.0;

      if (theme === 'es_barcelona') {
        // Barcelona (Rumba Catalana): Rasgueo rápido 'sawtooth' + palmas rítmicas 'noise'
        const pos = step % 8;
        const bar = Math.floor(step / 8) % 4;
        const prog = [
          { root: 110.0, chord: [220.0, 261.63, 329.63] },   // Am
          { root: 98.0,  chord: [196.0, 246.94, 293.66] },   // G
          { root: 87.31, chord: [174.61, 220.0, 261.63] },   // F
          { root: 82.41, chord: [164.81, 207.65, 246.94] }   // E
        ];
        const guitarMel = [
          659.25, 0, 587.33, 523.25, 493.88, 523.25, 440.0, 0,
          587.33, 0, 523.25, 493.88, 440.0, 493.88, 392.0, 0,
          523.25, 0, 493.88, 440.0, 392.0, 440.0, 349.23, 0,
          493.88, 523.25, 587.33, 523.25, 493.88, 415.30, 329.63, 0
        ];
        // Rasgueo flamenco/rumba catalana (ventilador en contratiempos) con sawtooth + decay corto
        if (pos === 0 || pos === 2 || pos === 3 || pos === 5 || pos === 6) {
          const strumVol = pos === 0 || pos === 3 ? 0.036 : 0.025;
          prog[bar].chord.forEach((f, idx) => {
            this.playLevelVoice(f * pitchMod, 'sawtooth', 0.11, strumVol, 0.005, 2600, idx * 0.007);
          });
        }
        // Palmas rítmicas en 2 y contratiempos
        if (pos === 2 || pos === 6) {
          this.playFilteredNoise(0.048, 0.085, 'bandpass', 2600);
          this.playFilteredNoise(0.035, 0.055, 'highpass', 4200);
        } else if (pos === 3 || pos === 5) {
          this.playFilteredNoise(0.032, 0.045, 'bandpass', 3100);
        }
        // Bajo rumbero alegre (pulso 1, 3 y 6)
        if (pos === 0 || pos === 3 || pos === 6) {
          const bf = prog[bar].root * (pos === 6 ? 1.5 : 1.0);
          this.playLevelVoice(bf * pitchMod, 'triangle', 0.16, 0.095, 0.008, 760, 0);
        }
        if (pos === 0 || pos === 4) this.playElectronicKick(0.14, 108, 44);
        const mf = guitarMel[step % guitarMel.length];
        if (mf > 0) {
          this.playLevelVoice(mf * pitchMod, 'sawtooth', 0.14, 0.046, 0.006, 2900, 0);
        }
        return;
      }

      if (theme === 'es_madrid') {
        // Madrid (Pasodoble / Chotis): Organillo 'square' castizo + compás 2/4 marcado
        const pos = step % 8;
        const bar = Math.floor(step / 8) % 4;
        const brassRoots = [110.0, 146.83, 82.41, 110.0]; // Am - Dm - E7 - Am
        const pasoMel = [
          440.0, 523.25, 659.25, 0, 587.33, 659.25, 523.25, 493.88,
          587.33, 698.46, 880.0, 0, 783.99, 698.46, 659.25, 587.33,
          659.25, 0, 587.33, 523.25, 493.88, 523.25, 440.0, 415.30,
          440.0, 493.88, 523.25, 659.25, 440.0, 0, 329.63, 0
        ];
        // Compás de pasodoble (bombo en 1 y 2; caja castiza en contratiempos)
        if (pos === 0 || pos === 4) {
          this.playElectronicKick(0.15, 118, 45);
          this.playLevelVoice(brassRoots[bar] * pitchMod, 'triangle', 0.17, 0.105, 0.008, 720, 0);
        }
        if (pos === 2 || pos === 6) {
          this.playLevelVoice(brassRoots[bar] * 1.498 * pitchMod, 'triangle', 0.12, 0.065, 0.008, 920, 0);
          this.playFilteredNoise(0.055, 0.075, 'bandpass', 2700);
        }
        const mf = pasoMel[step % pasoMel.length];
        if (mf > 0) {
          // Organillo: doble oscilador 'square' ligeramente desafinado para vibrato tradicional
          this.playLevelVoice(mf * pitchMod, 'square', 0.16, 0.042, 0.008, 2200, 0);
          this.playLevelVoice(mf * 1.004 * pitchMod, 'square', 0.16, 0.022, 0.01, 1900, 0);
        }
        return;
      }

      if (theme === 'es_palma') {
        // Palma de Mallorca (Balearic Chill-out): Pads 'sine' cálidos + arpegio lento + bajo profundo
        const pos = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const balearicBars = [
          { bass: 110.0, pad: [220.0, 261.63, 329.63, 493.88], arp: [523.25, 659.25, 783.99, 659.25] }, // Am9
          { bass: 87.31, pad: [174.61, 220.0, 261.63, 329.63], arp: [440.0, 523.25, 659.25, 523.25] },  // Fmaj7
          { bass: 65.41, pad: [196.0, 261.63, 329.63, 493.88], arp: [523.25, 587.33, 783.99, 587.33] }, // Cmaj7
          { bass: 98.0,  pad: [196.0, 246.94, 293.66, 329.63], arp: [493.88, 587.33, 783.99, 587.33] }  // G6
        ];
        const cur = balearicBars[bar];
        // Pad sostenido cálido ('sine') al inicio del compás
        if (pos === 0) {
          cur.pad.forEach((pf, idx) => {
            this.playLevelVoice(pf * pitchMod, 'sine', 2.85, 0.036, 0.34, 920, idx * 0.025);
          });
        }
        // Bombo balearic suave en negras y shaker sutil
        if (pos % 4 === 0) this.playElectronicKick(0.14, 92, 36);
        if (pos % 4 === 2) this.playFilteredNoise(0.035, 0.028, 'highpass', 6200);
        // Bajo profundo estilo house acústico
        if (pos === 0 || pos === 6 || pos === 8 || pos === 14) {
          this.playLevelVoice(cur.bass * pitchMod, 'sine', 0.42, 0.115, 0.015, 420, 0);
        }
        // Arpegio chill-out lento cada 2 pasos
        if (pos % 2 === 0) {
          const af = cur.arp[Math.floor(pos / 2) % cur.arp.length];
          this.playLevelVoice(af * pitchMod, 'sine', 0.48, 0.044, 0.02, 2100, 0);
        }
        return;
      }

      if (theme === 'es_canarias') {
        // Islas Canarias (Folclore Canario / Timple volcánico): Punteo muy rápido/agudo en 'pulse'
        const pos = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const roots = [146.83, 130.81, 116.54, 110.0]; // Dm - C - Bb - A7 (Folía / Isa tensa)
        const timpleRuns = [
          [880.0, 1046.5, 1174.66, 1046.5, 880.0, 1046.5, 1174.66, 1318.51, 1174.66, 1046.5, 880.0, 783.99, 880.0, 1046.5, 1174.66, 880.0],
          [783.99, 987.77, 1046.5, 987.77, 783.99, 987.77, 1046.5, 1174.66, 1046.5, 987.77, 783.99, 698.46, 783.99, 987.77, 1046.5, 783.99],
          [698.46, 880.0, 932.33, 880.0, 698.46, 880.0, 932.33, 1046.5, 932.33, 880.0, 698.46, 659.25, 698.46, 880.0, 932.33, 698.46],
          [659.25, 830.61, 880.0, 1108.73, 880.0, 830.61, 659.25, 880.0, 1108.73, 1318.51, 1108.73, 880.0, 830.61, 659.25, 587.33, 554.37]
        ];
        // Punteo vertiginoso de timple canario ('pulse' agudo + decay rápido)
        const tf = timpleRuns[bar][pos];
        if (tf > 0) {
          this.playLevelVoice(tf * pitchMod, 'pulse', 0.095, 0.056, 0.004, 3400, 0);
        }
        // Acompañamiento folclórico tenso (3/4 o contratiempo rápido volcánico)
        if (pos % 4 === 0) {
          this.playElectronicKick(0.14, 132, 46);
          this.playLevelVoice(roots[bar] * pitchMod, 'triangle', 0.18, 0.095, 0.008, 860, 0);
        } else if (pos % 4 === 2) {
          this.playLevelVoice(roots[bar] * 1.498 * pitchMod, 'triangle', 0.11, 0.055, 0.006, 1100, 0);
          this.playFilteredNoise(0.04, 0.052, 'highpass', 3600);
        }
      }
    }

    stepRosarioTheme(theme, step) {
      const pitchMod = this.hurryUp ? 1.05946 : 1.0;

      if (theme === 'ro_trova') {
        // Zona 1: Monumento a la Bandera - La Trova Rosarina (Piano virtual emotivo)
        const pos = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const progressions = [
          { bass: 130.81, chord: [261.63, 329.63, 392.0, 493.88], arp: [523.25, 659.25, 783.99, 659.25, 987.77, 783.99, 659.25, 523.25] }, // Cmaj7
          { bass: 110.0,  chord: [220.0,  261.63, 329.63, 392.0], arp: [440.0,  523.25, 659.25, 783.99, 659.25, 523.25, 440.0, 523.25] },  // Am7
          { bass: 87.31,  chord: [174.61, 220.0, 261.63, 329.63], arp: [523.25, 587.33, 659.25, 587.33, 523.25, 440.0, 392.0, 440.0] },   // Fmaj7
          { bass: 98.0,   chord: [196.0,  246.94, 293.66, 349.23], arp: [587.33, 659.25, 783.99, 659.25, 587.33, 493.88, 392.0, 493.88] }  // G7
        ];
        const cur = progressions[bar];
        // Bajo y acorde de piano virtual al compás
        if (pos === 0 || pos === 8) {
          this.playLevelVoice(cur.bass * pitchMod, 'sine', 0.62, 0.105, 0.012, 650, 0);
          cur.chord.forEach((cf, idx) => {
            this.playLevelVoice(cf * pitchMod, 'triangle', 0.45, 0.036, 0.008, 1750, idx * 0.018);
          });
        }
        // Arpegio melancólico estilo piano de rock nacional argentino / Fito
        if (pos % 2 === 0) {
          const nf = cur.arp[Math.floor(pos / 2) % cur.arp.length];
          this.playLevelVoice(nf * pitchMod, 'triangle', 0.34, 0.068, 0.005, 2400, 0);
          this.playLevelVoice(nf * pitchMod, 'sine', 0.36, 0.042, 0.004, 2400, 0);
        } else if (pos === 15) {
          this.playLevelVoice(cur.arp[2] * 1.122 * pitchMod, 'triangle', 0.14, 0.035, 0.004, 1900, 0);
        }
        if (pos % 8 === 4) {
          this.playFilteredNoise(0.03, 0.018, 'highpass', 4800);
        }
        return;
      }

      if (theme === 'ro_cumbia') {
        // Zona 2: La Florida - Cumbia Santafesina (Acordeón 8-bit + güiro tropical)
        const pos = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const bass = [110.0, 146.83, 196.0, 164.81]; // Am - Dm - G - Em
        const fifth = [164.81, 220.0, 146.83, 246.94];
        const acordeon = [
          [659.25, 0, 783.99, 880.0, 0, 783.99, 659.25, 587.33, 659.25, 0, 880.0, 1046.5, 0, 880.0, 783.99, 659.25],
          [587.33, 0, 698.46, 880.0, 0, 698.46, 587.33, 523.25, 587.33, 0, 880.0, 987.77, 0, 880.0, 783.99, 698.46],
          [587.33, 0, 659.25, 783.99, 0, 659.25, 587.33, 493.88, 587.33, 0, 783.99, 987.77, 0, 783.99, 659.25, 587.33],
          [659.25, 0, 783.99, 880.0, 987.77, 880.0, 783.99, 659.25, 659.25, 0, 587.33, 523.25, 493.88, 0, 659.25, 0]
        ];
        // Bombo cumbiero + tumbadora y güiro santafesino
        if (pos % 4 === 0) this.playElectronicKick(0.14, 118, 42);
        if (pos === 2 || pos === 6 || pos === 10 || pos === 14) {
          this.playFilteredNoise(0.055, 0.055, 'bandpass', 4800);
        } else if (pos % 2 === 1) {
          this.playFilteredNoise(0.025, 0.025, 'highpass', 6200);
        }
        // Bajo santafesino sincopado (raíz -> quinta -> octava)
        if (pos === 0 || pos === 8) this.playLevelVoice(bass[bar] * pitchMod, 'triangle', 0.16, 0.105, 0.005, 920, 0);
        if (pos === 4 || pos === 12) this.playLevelVoice(fifth[bar] * pitchMod, 'triangle', 0.14, 0.085, 0.005, 920, 0);
        if (pos === 6 || pos === 14) this.playLevelVoice(bass[bar] * 2 * pitchMod, 'triangle', 0.10, 0.075, 0.005, 1100, 0);

        // Punteo de acordeón santafesino a dos voces ('pulse' + tercera suave)
        const af = acordeon[bar][pos];
        if (af > 0) {
          this.playLevelVoice(af * pitchMod, 'pulse', 0.14, 0.068, 0.004, 2900, 0);
          this.playLevelVoice(af * 0.7937 * pitchMod, 'sawtooth', 0.12, 0.028, 0.005, 2200, 0);
        }
        return;
      }

      if (theme === 'ro_funk') {
        // Zona 3: Parque Independencia - Homenaje Funk-Rock "Efecto Nebuloza"
        // Bajo groove distorsionado en 'triangle' + Sintetizador líder MODX6 brillante
        const pos = step % 16;
        const bar = Math.floor(step / 16) % 4;
        const slapBass = [
          [82.41, 0, 82.41, 164.81, 0, 98.0, 110.0, 0, 82.41, 164.81, 0, 146.83, 123.47, 0, 110.0, 98.0],   // Em7 slap
          [73.42, 0, 73.42, 146.83, 0, 87.31, 98.0, 0, 73.42, 146.83, 0, 130.81, 110.0, 0, 98.0, 110.0],    // Dm7
          [98.0, 0, 98.0, 196.0, 0, 110.0, 123.47, 0, 98.0, 196.0, 0, 164.81, 146.83, 0, 123.47, 110.0],    // G9
          [82.41, 0, 164.81, 0, 146.83, 123.47, 110.0, 98.0, 82.41, 0, 110.0, 123.47, 146.83, 164.81, 196.0, 0]
        ];
        const modxLead = [
          [0, 659.25, 783.99, 0, 987.77, 0, 1174.66, 987.77, 0, 783.99, 659.25, 0, 587.33, 659.25, 0, 783.99],
          [0, 587.33, 698.46, 0, 880.0, 0, 1046.5, 880.0, 0, 698.46, 587.33, 0, 523.25, 587.33, 698.46, 0],
          [783.99, 0, 987.77, 1174.66, 0, 1318.51, 0, 1174.66, 987.77, 0, 880.0, 783.99, 0, 659.25, 783.99, 0],
          [1318.51, 1174.66, 987.77, 0, 1174.66, 987.77, 783.99, 0, 987.77, 783.99, 659.25, 587.33, 659.25, 0, 783.99, 987.77]
        ];
        // Batería funk-rock contundente
        if (pos === 0 || pos === 6 || pos === 10) this.playElectronicKick(0.15, 136, 40);
        if (pos === 4 || pos === 12) this.playFilteredNoise(0.085, 0.095, 'bandpass', 1850);
        if (pos % 2 === 1) this.playFilteredNoise(0.025, 0.03, 'highpass', 5800);

        // Bajo groove con mordida armónica tipo overdrive (fundamental 'triangle' + armónico saturado)
        const bf = slapBass[bar][pos];
        if (bf > 0) {
          this.playLevelVoice(bf * pitchMod, 'triangle', 0.14, 0.115, 0.003, 1800, 0);
          this.playLevelVoice(bf * 2 * pitchMod, 'sawtooth', 0.075, 0.036, 0.002, 2100, 0);
        }
        // Sintetizador líder MODX6 (FM-brass/lead brillantísimo)
        const mf = modxLead[bar][pos];
        if (mf > 0) {
          this.playLevelVoice(mf * pitchMod, 'sawtooth', 0.13, 0.056, 0.004, 4200, 0);
          this.playLevelVoice(mf * 1.005 * pitchMod, 'pulse', 0.12, 0.036, 0.004, 4200, 0);
        }
        return;
      }

      // Zona 4: Arroyito (El Gigante) - Ritmo de Cancha / Bombo y Redoblantes ("Vamo' la KD")
      const pos = step % 16;
      const bar = Math.floor(step / 16) % 4;
      // Redoblantes murgueros rápidos + Bombo de tablón
      if (pos === 0 || pos === 3 || pos === 6 || pos === 8 || pos === 11 || pos === 14) {
        this.playElectronicKick(0.16, 128, 38);
      }
      if (pos === 2 || pos === 4 || pos === 5 || pos === 10 || pos === 12 || pos === 13 || pos === 15) {
        this.playFilteredNoise(0.055, 0.085, 'highpass', 2600);
      }
      // Canto rítmico "Va-mo' la KA-DE" en metales sintéticos épicos
      const chantBars = [
        [392.0, 0, 392.0, 440.0, 493.88, 0, 587.33, 587.33, 0, 493.88, 440.0, 0, 392.0, 0, 440.0, 0],
        [440.0, 0, 493.88, 523.25, 587.33, 0, 659.25, 659.25, 0, 587.33, 523.25, 0, 493.88, 0, 440.0, 0],
        [392.0, 493.88, 587.33, 0, 783.99, 0, 783.99, 659.25, 587.33, 0, 523.25, 493.88, 440.0, 0, 392.0, 0],
        [587.33, 0, 587.33, 659.25, 783.99, 0, 880.0, 0, 783.99, 659.25, 587.33, 493.88, 392.0, 0, 587.33, 0]
      ];
      const cf = chantBars[bar][pos];
      if (cf > 0) {
        this.playLevelVoice(cf * pitchMod, 'sawtooth', 0.14, 0.068, 0.005, 3100, 0);
        this.playLevelVoice(cf * 0.5 * pitchMod, 'square', 0.14, 0.052, 0.006, 1600, 0);
      }
    }

    stepCordobaTheme(theme, step) {
      const pitchMod = this.hurryUp ? 1.05946 : 1.0;
      const pos = step % 16;
      const bar = Math.floor(step / 16) % 4;

      if (theme === 'co_cuarteto') {
        // Zona 1: Cuarteto cordobés "tunga-tunga" vibrante (piano + acordeón)
        const roots = [130.81, 164.81, 146.83, 196.0];
        const pianoChords = [
          [261.63, 329.63, 392.0],
          [329.63, 392.0, 493.88],
          [293.66, 349.23, 440.0],
          [392.0, 493.88, 587.33]
        ];
        const mel = [
          [523.25, 0, 659.25, 783.99, 0, 783.99, 659.25, 587.33, 523.25, 0, 659.25, 880.0, 0, 783.99, 659.25, 523.25],
          [659.25, 0, 783.99, 987.77, 0, 987.77, 783.99, 659.25, 587.33, 0, 659.25, 783.99, 0, 659.25, 587.33, 0],
          [587.33, 0, 698.46, 880.0, 0, 880.0, 698.46, 587.33, 659.25, 0, 783.99, 880.0, 0, 783.99, 698.46, 587.33],
          [783.99, 0, 987.77, 1046.5, 0, 987.77, 880.0, 783.99, 659.25, 587.33, 659.25, 783.99, 880.0, 0, 783.99, 0]
        ];
        if (pos % 4 === 0) {
          this.playElectronicKick(0.14, 128, 42);
          this.playLevelVoice(roots[bar] * pitchMod, 'triangle', 0.14, 0.11, 0.005, 850, 0);
        }
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.045, 0.055, 'highpass', 3600);
          pianoChords[bar].forEach((cf) => {
            this.playLevelVoice(cf * pitchMod, 'triangle', 0.10, 0.048, 0.004, 2400, 0);
          });
        }
        const nf = mel[bar][pos];
        if (nf > 0) {
          this.playLevelVoice(nf * pitchMod, 'pulse', 0.13, 0.062, 0.004, 2800, 0);
        }
        return;
      }

      if (theme === 'co_cucu') {
        // Zona 2: Carlos Paz - Reloj Cucú alegre + carillón Mi-Do
        const roots = [146.83, 196.0, 164.81, 146.83];
        const tune = [
          [587.33, 0, 659.25, 739.99, 880.0, 0, 739.99, 659.25, 587.33, 0, 880.0, 0, 739.99, 587.33, 0, 0],
          [783.99, 0, 880.0, 987.77, 1174.66, 0, 987.77, 880.0, 783.99, 0, 659.25, 0, 783.99, 0, 0, 0],
          [659.25, 0, 739.99, 880.0, 987.77, 0, 880.0, 739.99, 659.25, 0, 739.99, 880.0, 659.25, 0, 587.33, 0],
          [587.33, 0, 739.99, 880.0, 1174.66, 0, 880.0, 0, 0, 0, 987.77, 0, 783.99, 0, 587.33, 0]
        ];
        if (pos % 4 === 0) this.playElectronicKick(0.11, 115, 44);
        if (pos % 4 === 2) this.playFilteredNoise(0.03, 0.03, 'highpass', 4600);
        if (pos % 4 === 0) this.playLevelVoice(roots[bar] * pitchMod, 'sine', 0.24, 0.09, 0.008, 720, 0);
        if (bar === 3 && pos === 10) this.playLevelVoice(987.77 * pitchMod, 'sine', 0.14, 0.075, 0.004, 3200, 0); // ¡Cu!
        if (bar === 3 && pos === 12) this.playLevelVoice(783.99 * pitchMod, 'sine', 0.22, 0.08, 0.005, 3200, 0);  // ¡Cú!
        const nf = tune[bar][pos];
        if (nf > 0) this.playLevelVoice(nf * pitchMod, 'triangle', 0.18, 0.068, 0.005, 2500, 0);
        return;
      }

      if (theme === 'co_oktober') {
        // Zona 3: Villa General Belgrano - Polka/Vals Oktoberfest festiva
        const roots = [130.81, 174.61, 196.0, 130.81];
        const lead = [
          [523.25, 659.25, 783.99, 659.25, 1046.5, 0, 783.99, 0, 880.0, 783.99, 659.25, 587.33, 523.25, 0, 659.25, 0],
          [698.46, 880.0, 1046.5, 880.0, 1174.66, 0, 1046.5, 0, 880.0, 783.99, 698.46, 659.25, 587.33, 0, 0, 0],
          [783.99, 987.77, 1174.66, 987.77, 1046.5, 0, 880.0, 0, 783.99, 659.25, 587.33, 659.25, 783.99, 0, 587.33, 0],
          [523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 587.33, 523.25, 0, 783.99, 0, 523.25, 0, 0, 0]
        ];
        if (pos % 4 === 0) {
          this.playElectronicKick(0.14, 108, 38);
          this.playLevelVoice(roots[bar] * pitchMod, 'triangle', 0.16, 0.12, 0.006, 620, 0);
        }
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.035, 0.04, 'bandpass', 2400);
          this.playLevelVoice(roots[bar] * 1.5 * pitchMod, 'square', 0.09, 0.045, 0.005, 1400, 0);
        }
        const nf = lead[bar][pos];
        if (nf > 0) this.playLevelVoice(nf * pitchMod, 'pulse', 0.14, 0.06, 0.004, 2900, 0);
        return;
      }

      // Zona 4: Capilla del Monte / Cerro Uritorco - Misterio cósmico serrano
      const bassNotes = [110.0, 98.0, 87.31, 98.0];
      const ufoArp = [
        [440.0, 523.25, 659.25, 880.0, 659.25, 523.25, 440.0, 659.25, 987.77, 880.0, 659.25, 523.25, 440.0, 0, 659.25, 880.0],
        [392.0, 493.88, 587.33, 783.99, 587.33, 493.88, 392.0, 587.33, 880.0, 783.99, 587.33, 493.88, 392.0, 0, 587.33, 783.99],
        [349.23, 440.0, 523.25, 698.46, 523.25, 440.0, 349.23, 523.25, 783.99, 698.46, 523.25, 440.0, 349.23, 0, 523.25, 698.46],
        [392.0, 493.88, 659.25, 783.99, 987.77, 783.99, 659.25, 493.88, 392.0, 493.88, 659.25, 783.99, 880.0, 0, 783.99, 587.33]
      ];
      if (pos === 0 || pos === 8) {
        this.playLevelVoice(bassNotes[bar] * pitchMod, 'sine', 0.45, 0.11, 0.014, 580, 0);
      }
      if (pos === 0 || pos === 6 || pos === 10) this.playElectronicKick(0.13, 120, 40);
      if (pos === 4 || pos === 12) this.playFilteredNoise(0.05, 0.055, 'highpass', 3800);
      const sf = ufoArp[bar][pos];
      if (sf > 0) {
        this.playLevelVoice(sf * pitchMod, 'sine', 0.22, 0.065, 0.008, 3600, 0);
        this.playLevelVoice(sf * 1.007 * pitchMod, 'triangle', 0.18, 0.036, 0.008, 3200, 0);
      }
    }

    stepUshuaiaTheme(theme, step) {
      const pitchMod = this.hurryUp ? 1.05946 : 1.0;
      const pos = step % 16;
      const bar = Math.floor(step / 16) % 4;

      if (theme === 'ush_centro') {
        // Zona 1: Centro y Cartel Fin del Mundo - Aventura invernal cristalina
        const bass = [130.81, 164.81, 146.83, 196.0];
        const bells = [
          [523.25, 0, 659.25, 783.99, 1046.5, 0, 987.77, 783.99, 659.25, 0, 783.99, 880.0, 783.99, 0, 659.25, 0],
          [659.25, 0, 783.99, 987.77, 1174.66, 0, 987.77, 880.0, 783.99, 0, 659.25, 783.99, 880.0, 0, 783.99, 0],
          [587.33, 0, 698.46, 880.0, 1046.5, 0, 880.0, 783.99, 698.46, 0, 880.0, 987.77, 880.0, 0, 783.99, 0],
          [783.99, 0, 987.77, 1174.66, 1046.5, 0, 987.77, 783.99, 659.25, 783.99, 987.77, 0, 1046.5, 0, 783.99, 0]
        ];
        if (pos % 4 === 0) {
          this.playElectronicKick(0.13, 118, 42);
          this.playLevelVoice(bass[bar] * pitchMod, 'triangle', 0.22, 0.11, 0.008, 720, 0);
        }
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.035, 0.035, 'highpass', 4200);
        }
        const nf = bells[bar][pos];
        if (nf > 0) {
          this.playLevelVoice(nf * pitchMod, 'sine', 0.22, 0.068, 0.004, 3800, 0);
          this.playLevelVoice(nf * 0.5 * pitchMod, 'triangle', 0.16, 0.035, 0.006, 2200, 0);
        }
        return;
      }

      if (theme === 'ush_tren') {
        // Zona 2: Tren del Fin del Mundo - Locomotora rítmica épica sobre los bosques australes
        const bass = [146.83, 146.83, 174.61, 196.0];
        const railLead = [
          [587.33, 0, 739.99, 880.0, 0, 880.0, 1174.66, 0, 987.77, 880.0, 739.99, 880.0, 587.33, 0, 739.99, 0],
          [587.33, 0, 880.0, 1046.5, 0, 987.77, 880.0, 739.99, 659.25, 0, 739.99, 880.0, 587.33, 0, 0, 0],
          [698.46, 0, 880.0, 1046.5, 1174.66, 0, 1046.5, 880.0, 783.99, 0, 880.0, 1046.5, 987.77, 0, 880.0, 0],
          [783.99, 987.77, 1174.66, 0, 1046.5, 987.77, 880.0, 783.99, 739.99, 0, 880.0, 0, 587.33, 0, 0, 0]
        ];
        // Traqueteo constante de rieles de vapor (chug-chug-CHUG-chug)
        const chugGain = pos % 4 === 0 ? 0.058 : pos % 2 === 0 ? 0.036 : 0.022;
        this.playFilteredNoise(0.032, chugGain, 'bandpass', pos % 4 === 0 ? 1900 : 3200);
        if (pos % 4 === 0) {
          this.playElectronicKick(0.12, 110, 40);
          this.playLevelVoice(bass[bar] * pitchMod, 'sawtooth', 0.16, 0.082, 0.006, 860, 0);
        }
        if (bar === 3 && pos === 12) {
          // Silbato armónico de locomotora a vapor
          this.playLevelVoice(587.33 * pitchMod, 'triangle', 0.28, 0.055, 0.015, 2200, 0);
          this.playLevelVoice(880.0 * pitchMod, 'sine', 0.28, 0.045, 0.015, 2400, 0);
        }
        const nf = railLead[bar][pos];
        if (nf > 0) this.playLevelVoice(nf * pitchMod, 'pulse', 0.14, 0.06, 0.004, 2900, 0);
        return;
      }

      if (theme === 'ush_glaciar') {
        // Zona 3: Glaciar Martial y Aerosilla - Atmósfera glacial cristalina y aérea
        const padRoots = [220.0, 196.0, 174.61, 164.81];
        const crystalArp = [
          [440.0, 523.25, 659.25, 880.0, 1046.5, 880.0, 659.25, 523.25, 440.0, 659.25, 880.0, 1046.5, 1318.51, 1046.5, 880.0, 659.25],
          [392.0, 493.88, 587.33, 783.99, 987.77, 783.99, 587.33, 493.88, 392.0, 587.33, 783.99, 987.77, 1174.66, 987.77, 783.99, 587.33],
          [349.23, 440.0, 523.25, 698.46, 880.0, 698.46, 523.25, 440.0, 349.23, 523.25, 698.46, 880.0, 1046.5, 880.0, 698.46, 523.25],
          [329.63, 392.0, 493.88, 659.25, 783.99, 659.25, 493.88, 392.0, 440.0, 523.25, 659.25, 880.0, 987.77, 880.0, 783.99, 659.25]
        ];
        if (pos === 0 || pos === 8) {
          this.playLevelVoice(padRoots[bar] * 0.5 * pitchMod, 'sine', 0.52, 0.11, 0.02, 540, 0);
          this.playLevelVoice(padRoots[bar] * 1.5 * pitchMod, 'triangle', 0.45, 0.045, 0.03, 1400, 0);
        }
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.06, 0.028, 'bandpass', 2800);
        }
        const cf = crystalArp[bar][pos];
        if (cf > 0) {
          this.playLevelVoice(cf * pitchMod, 'sine', 0.24, 0.056, 0.005, 4200, 0);
          if (pos % 4 === 0) {
            this.playLevelVoice(cf * 2.0 * pitchMod, 'sine', 0.16, 0.024, 0.004, 5200, 0);
          }
        }
        return;
      }

      // Zona 4: Faro Les Éclaireurs - Clímax épico del Fin del Mundo en tormenta austral
      const bassNotes = [110.0, 87.31, 98.0, 130.81];
      const epicLead = [
        [440.0, 0, 523.25, 659.25, 880.0, 0, 783.99, 659.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 0, 987.77, 880.0],
        [698.46, 0, 880.0, 1046.5, 880.0, 0, 783.99, 698.46, 659.25, 0, 783.99, 880.0, 698.46, 0, 659.25, 0],
        [587.33, 0, 783.99, 987.77, 1174.66, 0, 987.77, 880.0, 783.99, 0, 987.77, 1174.66, 987.77, 0, 783.99, 0],
        [523.25, 659.25, 783.99, 1046.5, 1318.51, 0, 1174.66, 1046.5, 987.77, 0, 880.0, 987.77, 1046.5, 0, 783.99, 0]
      ];
      if (pos % 4 === 0) {
        this.playElectronicKick(0.15, 134, 40);
        this.playLevelVoice(bassNotes[bar] * pitchMod, 'sawtooth', 0.22, 0.095, 0.005, 880, 0);
      }
      if (pos % 4 === 2) {
        this.playFilteredNoise(0.055, 0.06, 'bandpass', 2600);
        this.playLevelVoice(bassNotes[bar] * 2.0 * pitchMod, 'triangle', 0.14, 0.045, 0.004, 1800, 0);
      }
      const lf = epicLead[bar][pos];
      if (lf > 0) {
        this.playLevelVoice(lf * pitchMod, 'pulse', 0.18, 0.068, 0.004, 3400, 0);
        this.playLevelVoice(lf * 0.5 * pitchMod, 'sawtooth', 0.16, 0.032, 0.006, 1600, 0);
      }
    }

    stepChileTheme(theme, step) {
      const pitchMod = this.hurryUp ? 1.05946 : 1.0;
      const bar = Math.floor(step / 16) % 4;
      const pos = step % 16;

      if (theme.indexOf('ch_santiago') === 0) {
        // Cueca urbana & pulso cordillerano (Am - F - G - Em)
        const bassNotes = [220.0, 174.61, 196.0, 164.81];
        const leads = [
          [440.0, 0, 523.25, 659.25, 587.33, 523.25, 440.0, 0, 659.25, 0, 587.33, 523.25, 493.88, 0, 440.0, 0],
          [349.23, 0, 440.0, 523.25, 587.33, 0, 523.25, 440.0, 523.25, 0, 493.88, 440.0, 392.0, 0, 440.0, 0],
          [392.0, 0, 493.88, 587.33, 659.25, 587.33, 493.88, 0, 587.33, 0, 659.25, 783.99, 659.25, 0, 587.33, 0],
          [329.63, 0, 440.0, 523.25, 659.25, 0, 587.33, 523.25, 493.88, 0, 440.0, 493.88, 523.25, 0, 440.0, 0]
        ];
        if (pos % 4 === 0 || pos === 6 || pos === 14) {
          this.playElectronicKick(0.11, 128, 44);
          this.playLevelVoice(bassNotes[bar] * 0.5 * pitchMod, 'triangle', 0.2, 0.088, 0.005, 760, 0);
        }
        if (pos % 3 === 0) {
          this.playLevelVoice(bassNotes[bar] * 2.0 * pitchMod, 'triangle', 0.08, 0.036, 0.002, 2200, 0);
        }
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.045, 0.055, 'bandpass', 2500);
        }
        const lf = leads[bar][pos];
        if (lf > 0) {
          this.playLevelVoice(lf * pitchMod, 'sine', 0.17, 0.068, 0.006, 3000, 0);
          this.playLevelVoice(lf * 0.5 * pitchMod, 'triangle', 0.14, 0.03, 0.008, 1600, 0);
        }
        return;
      }

      if (theme.indexOf('ch_vina') === 0) {
        // Brisa costera & acordeón porteño (C - G - F - G)
        const bassNotes = [130.81, 196.0, 174.61, 196.0];
        const leads = [
          [523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 523.25, 659.25, 0, 783.99, 880.0, 783.99, 0, 659.25, 0],
          [587.33, 0, 783.99, 987.77, 783.99, 0, 659.25, 587.33, 587.33, 659.25, 783.99, 0, 659.25, 587.33, 493.88, 0],
          [523.25, 0, 698.46, 880.0, 783.99, 698.46, 659.25, 0, 698.46, 0, 880.0, 1046.5, 880.0, 0, 783.99, 0],
          [587.33, 0, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 783.99, 0, 659.25, 587.33, 523.25, 0, 493.88, 0]
        ];
        if (pos % 4 === 0) {
          this.playElectronicKick(0.11, 122, 46);
          this.playLevelVoice(bassNotes[bar] * pitchMod, 'triangle', 0.21, 0.088, 0.006, 920, 0);
        }
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.05, 0.05, 'highpass', 3200);
          this.playLevelVoice(bassNotes[bar] * 2.5 * pitchMod, 'pulse', 0.1, 0.032, 0.003, 1800, 0);
        }
        const lf = leads[bar][pos];
        if (lf > 0) {
          this.playLevelVoice(lf * pitchMod, 'pulse', 0.15, 0.058, 0.005, 2900, 0);
        }
        return;
      }

      if (theme.indexOf('ch_atacama') === 0) {
        // Quena altiplánica, salar cristalino y cosmos ALMA (Dm - Bb - C - Am)
        const isCosmic = theme === 'ch_atacama_alma';
        const isSalt = theme === 'ch_atacama_salar';
        const bassNotes = [146.83, 116.54, 130.81, 110.0];
        const leads = [
          [587.33, 0, 698.46, 0, 880.0, 0, 783.99, 698.46, 659.25, 0, 587.33, 0, 523.25, 0, 587.33, 0],
          [466.16, 0, 587.33, 698.46, 0, 880.0, 783.99, 0, 698.46, 0, 587.33, 0, 466.16, 0, 523.25, 0],
          [523.25, 0, 659.25, 783.99, 880.0, 0, 783.99, 659.25, 587.33, 0, 659.25, 0, 783.99, 0, 659.25, 0],
          [440.0, 0, 523.25, 659.25, 880.0, 0, 783.99, 659.25, 698.46, 0, 659.25, 587.33, 523.25, 0, 440.0, 0]
        ];
        if (pos % 4 === 0) {
          this.playElectronicKick(0.14, 108, 38);
          this.playLevelVoice(bassNotes[bar] * pitchMod, 'sine', 0.26, 0.095, 0.008, 700, 0);
        }
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.05, 0.04, 'bandpass', isCosmic ? 4200 : 1900);
          if (isSalt || isCosmic) {
            this.playLevelVoice(bassNotes[bar] * (isCosmic ? 6.0 : 4.0) * pitchMod, 'sine', 0.14, 0.036, 0.003, 5200, 0);
          }
        }
        const lf = leads[bar][pos];
        if (lf > 0) {
          this.playLevelVoice(lf * pitchMod, isCosmic ? 'sine' : 'triangle', 0.22, 0.068, 0.01, 2800, 0);
          if (isCosmic && pos % 8 === 4) {
            this.playLevelVoice(lf * 1.5 * pitchMod, 'sine', 0.18, 0.028, 0.008, 4600, 0);
          }
        }
        return;
      }

      // Rapa Nui / Isla de Pascua: percusión tribal polinesia & clímax volcánico (Em - C - D - Bm)
      const isClimax = theme === 'ch_pascua_tongariki' || theme === 'ch_pascua_kau';
      const bassNotes = [164.81, 130.81, 146.83, 123.47];
      const leads = [
        [659.25, 0, 783.99, 987.77, 1174.66, 0, 987.77, 783.99, 659.25, 0, 783.99, 987.77, 880.0, 0, 783.99, 0],
        [523.25, 0, 659.25, 783.99, 1046.5, 0, 987.77, 783.99, 659.25, 0, 783.99, 1046.5, 987.77, 0, 783.99, 0],
        [587.33, 0, 739.99, 880.0, 1174.66, 0, 987.77, 880.0, 739.99, 0, 880.0, 987.77, 880.0, 0, 739.99, 0],
        [493.88, 587.33, 739.99, 987.77, 1174.66, 0, 987.77, 880.0, 783.99, 0, 659.25, 783.99, 987.77, 0, 783.99, 0]
      ];
      if (pos % 4 === 0 || (isClimax && pos === 10)) {
        this.playElectronicKick(0.15, isClimax ? 136 : 116, 40);
        this.playLevelVoice(bassNotes[bar] * 0.5 * pitchMod, 'triangle', 0.22, 0.095, 0.005, 860, 0);
      }
      if (pos % 4 === 2) {
        this.playFilteredNoise(0.055, 0.058, 'bandpass', 2400);
        this.playLevelVoice(bassNotes[bar] * 2.0 * pitchMod, 'sine', 0.12, 0.045, 0.003, 2100, 0);
      }
      const lf = leads[bar][pos];
      if (lf > 0) {
        this.playLevelVoice(lf * pitchMod, isClimax ? 'pulse' : 'triangle', 0.18, isClimax ? 0.068 : 0.06, 0.004, 3400, 0);
      }
    }

    stepBonusTheme(theme, step) {
      const pitchMod = this.hurryUp ? 1.05946 : 1.0;
      const pos = step % 16;
      const bar = Math.floor(step / 16) % 4;

      if (theme === 'bonus_ibiza') {
        // Bonus Frenético Ibiza (~150 BPM): Balearic sunset Dorian/pentatonic arpeggios + bouncy bass + crisp hats
        const bars = [
          {
            bass: 146.83, // D3 (Dm9 / Fmaj7 sunset vibe)
            pad: [293.66, 349.23, 440.0, 523.25],
            arp: [587.33, 659.25, 783.99, 880.0, 1046.5, 880.0, 783.99, 659.25, 587.33, 783.99, 880.0, 1046.5, 1174.66, 1046.5, 880.0, 783.99]
          },
          {
            bass: 98.0, // G2 (G13)
            pad: [246.94, 293.66, 349.23, 440.0],
            arp: [587.33, 659.25, 783.99, 987.77, 1174.66, 987.77, 783.99, 659.25, 587.33, 783.99, 987.77, 1174.66, 1318.51, 1174.66, 987.77, 880.0]
          },
          {
            bass: 130.81, // C3 (Cmaj9)
            pad: [261.63, 329.63, 392.0, 493.88],
            arp: [523.25, 659.25, 783.99, 987.77, 1046.5, 987.77, 783.99, 659.25, 523.25, 659.25, 783.99, 1046.5, 1174.66, 1046.5, 987.77, 783.99]
          },
          {
            bass: 110.0, // A2 (Am7 -> Cmaj7/A)
            pad: [220.0, 293.66, 329.63, 392.0],
            arp: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 880.0, 783.99, 659.25, 783.99, 880.0, 1046.5, 1318.51, 1174.66, 1046.5, 880.0]
          }
        ];
        const cur = bars[bar];

        // Four-on-the-floor Balearic kick + crisp hi-hat ticks + snappy offbeat clap
        if (pos % 4 === 0) this.playElectronicKick(0.18, 128, 42);
        if (pos % 4 === 2) {
          this.playFilteredNoise(0.052, 0.044, 'highpass', 6400);
        } else if (pos % 2 === 1) {
          this.playFilteredNoise(0.022, 0.024, 'highpass', 7800);
        }
        if (pos === 4 || pos === 12) {
          this.playFilteredNoise(0.072, 0.062, 'bandpass', 2500);
        }

        // Bouncy octave bassline
        if (pos === 0 || pos === 6 || pos === 8 || pos === 12) {
          this.playLevelVoice(cur.bass * 0.5 * pitchMod, 'triangle', 0.14, 0.098, 0.006, 740, 0);
        } else if (pos === 2 || pos === 10 || pos === 14) {
          this.playLevelVoice(cur.bass * pitchMod, 'triangle', 0.11, 0.078, 0.006, 1020, 0);
        }

        // Warm sunset pad swell on bar downbeat
        if (pos === 0) {
          cur.pad.forEach((pf, idx) => {
            this.playLevelVoice(pf * pitchMod, 'sine', 0.85, 0.024, 0.08, 1200, idx * 0.015);
          });
        }

        // Driving Balearic 16th-note sunset arpeggio
        const af = cur.arp[pos];
        if (af > 0) {
          this.playLevelVoice(af * pitchMod, pos % 2 === 0 ? 'triangle' : 'sine', 0.13, 0.058, 0.004, 3400, 0);
          if (pos % 4 === 0) {
            this.playLevelVoice(af * 1.5 * pitchMod, 'sine', 0.09, 0.024, 0.004, 4200, 0);
          }
        }
        return;
      }

      if (theme === 'bonus_iguazu') {
        // Bonus Frenético Iguazú (~153 BPM): Jungle marimba pulse + syncopated samba/chamamé bass + carnival ticks
        const bars = [
          {
            bassRoot: 98.0,   // G2
            bassFifth: 146.83, // D3
            marimba: [783.99, 987.77, 1174.66, 0, 987.77, 1174.66, 1318.51, 1174.66, 987.77, 0, 1174.66, 987.77, 783.99, 987.77, 1174.66, 0]
          },
          {
            bassRoot: 130.81, // C3
            bassFifth: 98.0,  // G2
            marimba: [1046.5, 1318.51, 1567.98, 0, 1318.51, 1567.98, 1318.51, 1046.5, 880.0, 0, 1046.5, 1318.51, 1567.98, 1318.51, 1046.5, 0]
          },
          {
            bassRoot: 87.31,  // F2
            bassFifth: 130.81, // C3
            marimba: [880.0, 1046.5, 1318.51, 0, 1174.66, 1046.5, 880.0, 1046.5, 1174.66, 0, 1046.5, 880.0, 698.46, 880.0, 1046.5, 0]
          },
          {
            bassRoot: 146.83, // D3
            bassFifth: 110.0, // A2
            marimba: [1174.66, 987.77, 880.0, 0, 1174.66, 1479.98, 1318.51, 1174.66, 987.77, 0, 1174.66, 1318.51, 1567.98, 1479.98, 1174.66, 0]
          }
        ];
        const cur = bars[bar];

        // Surdo / samba-chamamé kick + carnival shaker + clave/agogô ticks
        if (pos === 0) this.playElectronicKick(0.14, 108, 42);
        if (pos === 8 || pos === 14) this.playElectronicKick(0.18, 128, 44);
        this.playFilteredNoise(0.022, pos % 4 === 0 ? 0.036 : 0.020, 'highpass', 6200);
        if (pos === 2 || pos === 5 || pos === 8 || pos === 11 || pos === 14) {
          this.playFilteredNoise(0.030, 0.052, 'bandpass', 3200);
        }
        if (pos === 2 || pos === 10) {
          this.playLevelVoice(1567.98 * pitchMod, 'sine', 0.048, 0.032, 0.002, 4200, 0);
        }

        // Syncopated samba/chamamé bass
        if (pos === 0 || pos === 8) {
          this.playLevelVoice(cur.bassRoot * pitchMod, 'triangle', 0.16, 0.105, 0.005, 780, 0);
        } else if (pos === 6 || pos === 12) {
          this.playLevelVoice(cur.bassFifth * pitchMod, 'triangle', 0.14, 0.088, 0.005, 860, 0);
        }

        // Tropical jungle marimba pulse (sine body + crisp woody triangle attack)
        const mf = cur.marimba[pos];
        if (mf > 0) {
          this.playLevelVoice(mf * pitchMod, 'sine', 0.13, 0.068, 0.003, 3400, 0);
          this.playLevelVoice(mf * pitchMod, 'triangle', 0.08, 0.044, 0.003, 2800, 0);
          if (pos === 0 || pos === 6 || pos === 10) {
            this.playLevelVoice(mf * 1.25 * pitchMod, 'sine', 0.11, 0.032, 0.004, 3200, 0);
          }
        }
      }
    }

    normalizeCityTrackKey(cityKey) {
      if (!cityKey) return null;
      const key = String(cityKey).toLowerCase();
      if (key === 'canary_islands') return 'canarias';
      if (key === 'mallorca') return 'palma';
      if (key === 'bsas' || key === 'buenos_aires') return 'buenosaires';
      return key;
    }

    resolveAudioUrl(fileName) {
      if (!fileName) return '';
      if (
        fileName.indexOf('http://') === 0 ||
        fileName.indexOf('https://') === 0 ||
        fileName.indexOf(AUDIO_BASE_PATH) === 0
      ) {
        return encodeURI(fileName);
      }
      return encodeURI(AUDIO_BASE_PATH + fileName);
    }

    normalizeTrackList(entry) {
      if (!entry) return [];
      if (Array.isArray(entry)) return entry.filter(Boolean);
      if (typeof entry === 'string') return [entry];
      return [];
    }

    resolveLevelMusicMeta(theme = 'level', meta = null) {
      const bgmTrack = meta && meta.bgmTrack ? meta.bgmTrack : null;
      if (meta && meta.cityKey) {
        const normalizedCity = this.normalizeCityTrackKey(meta.cityKey);
        const zoneNum = Math.max(1, (meta.zoneNum | 0) || 1);
        return bgmTrack ? { cityKey: normalizedCity, zoneNum, bgmTrack } : { cityKey: normalizedCity, zoneNum };
      }
      if (typeof theme === 'string' && Object.prototype.hasOwnProperty.call(THEME_TO_ZONE_META, theme)) {
        const mapped = THEME_TO_ZONE_META[theme];
        return bgmTrack
          ? { cityKey: mapped.cityKey, zoneNum: mapped.zoneNum, bgmTrack }
          : { cityKey: mapped.cityKey, zoneNum: mapped.zoneNum };
      }
      return bgmTrack ? { bgmTrack } : null;
    }

    resolveMusicTracks(theme = 'level', meta = null) {
      if (theme === 'bonus_ibiza' || theme === 'bonus_iguazu') return [];
      if (meta && meta.bgmTrack) {
        const direct = this.normalizeTrackList(meta.bgmTrack);
        if (direct.length > 0) return direct;
      }
      const resolvedMeta = this.resolveLevelMusicMeta(theme, meta);
      if (!resolvedMeta || !resolvedMeta.cityKey) return [];
      const cityManifest = ZONE_TRACK_MANIFEST[resolvedMeta.cityKey];
      if (!cityManifest) return [];
      return this.normalizeTrackList(cityManifest[resolvedMeta.zoneNum]);
    }

    getMenuTracksForMode(mode = 'zen') {
      return this.normalizeTrackList(MENU_TRACK_CONFIG[mode]);
    }

    selectTrackVariant(candidates, slotKey) {
      if (!candidates || candidates.length === 0) return null;
      if (candidates.length === 1) return candidates[0];
      const idx = this._variantCursor[slotKey] || 0;
      const chosen = candidates[idx % candidates.length];
      this._variantCursor[slotKey] = (idx + 1) % candidates.length;
      return chosen;
    }

    getOrCreateAudio(src) {
      if (typeof Audio === 'undefined') return null;
      if (!this._audioCache[src]) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        try { audio.load(); } catch (e) {}
        this._audioCache[src] = audio;
      }
      return this._audioCache[src];
    }

    getTrackStartOffset(fileName) {
      if (!fileName || typeof fileName !== 'string') return 0;
      const cleanName = fileName.split('/').pop() || fileName;
      const stem = cleanName.replace(/(?:\.mp3)+$/i, '');
      if (stem && Object.prototype.hasOwnProperty.call(BGM_START_OFFSETS, stem)) {
        return BGM_START_OFFSETS[stem];
      }
      return 0;
    }

    preloadCityAudio(cityKey) {
      if (typeof Audio === 'undefined') return;
      const key = this.normalizeCityTrackKey(cityKey || 'barcelona') || 'barcelona';
      if (!this._preloadedCities) this._preloadedCities = {};
      if (this._preloadedCities[key]) return;
      this._preloadedCities[key] = true;

      const cityManifest = ZONE_TRACK_MANIFEST[key];
      if (cityManifest) {
        Object.keys(cityManifest).forEach((zKey) => {
          const tracks = this.normalizeTrackList(cityManifest[zKey]);
          tracks.forEach((fileName) => {
            const src = this.resolveAudioUrl(fileName);
            if (src) this.getOrCreateAudio(src);
          });
        });
      }

      const megaMap = MEGAFONIA_MANIFEST[key];
      if (megaMap) {
        Object.keys(megaMap).forEach((zKey) => {
          const fileName = megaMap[zKey];
          if (fileName) {
            const src = this.resolveAudioUrl(fileName);
            if (src) this.getOrCreateAudio(src);
          }
        });
      }
    }

    preloadEssentialAudio() {
      if (typeof Audio === 'undefined') return;
      try {
        this.preloadCityAudio('barcelona');
        Object.keys(MENU_TRACK_CONFIG).forEach((mode) => {
          const tracks = this.normalizeTrackList(MENU_TRACK_CONFIG[mode]);
          tracks.forEach((fileName) => {
            const src = this.resolveAudioUrl(fileName);
            if (src) this.getOrCreateAudio(src);
          });
        });
      } catch (e) {}
    }

    stopBgmAudio() {
      const audio = this.bgmAudio;
      this.bgmAudio = null;
      this.bgmTrackSrc = null;
      if (!audio) return;
      try {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.playbackRate = 1.0;
        audio.currentTime = 0;
      } catch (e) {}
    }

    stopMenuAudio() {
      const audio = this.menuAudio;
      this.menuAudio = null;
      this.menuTrackSrc = null;
      if (!audio) return;
      try {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    }

    startMusic(theme = 'level', meta = null) {
      if (theme === 'menu') {
        this.playMenuMusic(this.menuMode || 'zen');
        return;
      }
      this.stopMenuMusic();
      const metaObj = meta && typeof meta === 'object' ? meta : null;
      const explicitHurry = typeof meta === 'boolean'
        ? meta
        : (metaObj && typeof metaObj.hurry === 'boolean' ? metaObj.hurry : null);
      const isBonusSynth = theme === 'bonus_ibiza' || theme === 'bonus_iguazu';
      const resolvedMeta = isBonusSynth ? null : this.resolveLevelMusicMeta(theme, metaObj);
      const slotKey = resolvedMeta ? `${resolvedMeta.cityKey}:${resolvedMeta.zoneNum}` : String(theme || 'level');
      this.musicTheme = theme;
      this._activeLevelMeta = resolvedMeta;

      if (this.muted) {
        if (explicitHurry !== null) {
          this.hurryUp = explicitHurry;
          this.tempoMultiplier = explicitHurry ? (isBonusSynth ? 1.18 : 1.35) : 1.0;
        }
        return;
      }

      const levelTracks = isBonusSynth ? [] : this.resolveMusicTracks(theme, resolvedMeta);
      const hurryMatches = explicitHurry === null || explicitHurry === this.hurryUp;
      if (this.musicPlaying && !this.musicPaused && hurryMatches) {
        if (this.bgmAudio && !this.bgmAudio.paused && this._activeLevelSlotKey === slotKey && this.activeMusicTheme === theme) {
          return;
        }
        if (!this.bgmAudio && this.musicTimer && this.activeMusicTheme === theme && this._activeLevelSlotKey === slotKey) {
          this.ensureRunning();
          return;
        }
      }

      const preservedHurry = this._preservingHurry ? this.hurryUp : false;
      if (this.musicPlaying || this.musicTimer || this.bgmAudio || this.bgmBus) {
        this.stopMusic();
      }
      const nextHurry = explicitHurry !== null ? explicitHurry : preservedHurry;
      this.hurryUp = nextHurry;
      this.tempoMultiplier = nextHurry ? (isBonusSynth ? 1.18 : 1.35) : 1.0;
      this.musicTheme = theme;
      this._activeLevelMeta = resolvedMeta;
      this._activeLevelSlotKey = slotKey;

      if (levelTracks.length > 0 && typeof Audio !== 'undefined') {
        const started = this._playLevelAudioTrack(theme, resolvedMeta, slotKey, levelTracks);
        if (started) return;
      }

      this._startLevelSynthFallback(theme, resolvedMeta, slotKey);
    }

    _playLevelAudioTrack(theme, resolvedMeta, slotKey, levelTracks) {
      const fileName = this.selectTrackVariant(levelTracks, 'zone:' + slotKey);
      if (!fileName) return false;
      const src = this.resolveAudioUrl(fileName);
      const audio = this.getOrCreateAudio(src);
      if (!audio) return false;

      this.activeMusicTheme = theme;
      this._activeLevelMeta = resolvedMeta;
      this._activeLevelSlotKey = slotKey;
      this.musicPlaying = true;
      this.musicPaused = false;
      this._deferredMusicTheme = null;
      this._deferredLevelMeta = null;

      const startOffset = this.getTrackStartOffset(fileName);
      try { audio.pause(); } catch (e) {}
      try { audio.currentTime = startOffset; } catch (e) {}
      if (startOffset > 0 && audio.readyState < 1 && typeof audio.addEventListener === 'function') {
        const onMeta = () => {
          try {
            if (this.bgmAudio === audio && audio.currentTime < startOffset) {
              audio.currentTime = startOffset;
            }
          } catch (e) {}
        };
        try { audio.addEventListener('loadedmetadata', onMeta, { once: true }); } catch (e) {}
      }
      audio.volume = this.bgmVolume;
      audio.playbackRate = this.hurryUp ? 1.18 : 1.0;
      audio.loop = levelTracks.length === 1;
      this.bgmAudio = audio;
      this.bgmTrackSrc = src;

      audio.onended = () => {
        if (this.muted || !this.musicPlaying || this.musicPaused || this.bgmAudio !== audio) return;
        if (levelTracks.length <= 1) {
          if (startOffset > 0) {
            try {
              audio.currentTime = startOffset;
              const p = audio.play();
              if (p && typeof p.catch === 'function') p.catch(() => {});
            } catch (e) {}
          }
          return;
        }
        this._playLevelAudioTrack(theme, resolvedMeta, slotKey, levelTracks);
      };

      audio.onerror = () => {
        if (this.bgmAudio !== audio) return;
        this.stopBgmAudio();
        this.musicPlaying = false;
        if (levelTracks.length === 1 && typeof fileName === 'string') {
          const altFile = /\.mp3\.mp3$/i.test(fileName)
            ? fileName.replace(/\.mp3\.mp3$/i, '.mp3')
            : (/\.mp3$/i.test(fileName) ? fileName + '.mp3' : null);
          if (altFile && altFile !== fileName && !(this._audioErrTried && this._audioErrTried[altFile])) {
            this._audioErrTried = this._audioErrTried || {};
            this._audioErrTried[fileName] = true;
            this._audioErrTried[altFile] = true;
            if (this._playLevelAudioTrack(theme, resolvedMeta, slotKey, [altFile])) return;
          }
        }
        this._startLevelSynthFallback(theme, resolvedMeta, slotKey);
      };

      try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            if (this.muted || this.bgmAudio !== audio) return;
            if (err && err.name === 'NotAllowedError') {
              this.stopBgmAudio();
              this.musicPlaying = false;
              this._deferredMusicTheme = theme;
              this._deferredLevelMeta = resolvedMeta;
              return;
            }
            this.stopBgmAudio();
            this.musicPlaying = false;
            this._startLevelSynthFallback(theme, resolvedMeta, slotKey);
          });
        }
        return true;
      } catch (e) {
        this.stopBgmAudio();
        this.musicPlaying = false;
        return false;
      }
    }

    _startLevelSynthFallback(theme = 'level', resolvedMeta = null, slotKey = null) {
      if (!this.ensureRunning()) {
        this._deferredMusicTheme = theme;
        this._deferredLevelMeta = resolvedMeta;
        return;
      }
      this._deferredMusicTheme = null;
      this._deferredLevelMeta = null;
      this._activeLevelMeta = resolvedMeta;
      this._activeLevelSlotKey = slotKey || String(theme || 'level');

      const isMap = theme === 'map';
      const themedStepMap = {
        ba_tango: 180,
        ba_rock: 115,      // 130 BPM 16th steps
        ba_electropop: 121,
        ba_cumbia: 144,
        ro_trova: 175,
        ro_cumbia: 136,
        ro_funk: 116,
        ro_cancha: 104,
        co_cuarteto: 118,
        co_cucu: 132,
        co_oktober: 126,
        co_uritorco: 128,
        ush_centro: 138,
        ush_tren: 112,
        ush_glaciar: 146,
        ush_faro: 120,
        ch_santiago_plaza: 128,
        ch_santiago_cristobal: 132,
        ch_santiago_lastarria: 136,
        ch_santiago_costanera: 120,
        ch_vina_reloj: 128,
        ch_vina_quinta: 124,
        ch_vina_ascensores: 132,
        ch_vina_puerto: 126,
        ch_atacama_tatio: 142,
        ch_atacama_salar: 148,
        ch_atacama_luna: 152,
        ch_atacama_alma: 156,
        ch_pascua_tongariki: 124,
        ch_pascua_raraku: 130,
        ch_pascua_anakena: 136,
        ch_pascua_kau: 142,
        es_barcelona: 128,
        es_madrid: 132,
        es_palma: 195,
        es_canarias: 108,
        bonus_ibiza: 100,   // ~150 BPM 16th steps (Bonus Frenético Ibiza)
        bonus_iguazu: 98    // ~153 BPM 16th steps (Bonus Frenético Iguazú)
      };
      const isRegionalTheme = typeof theme === 'string' && Object.prototype.hasOwnProperty.call(themedStepMap, theme);
      this.activeMusicTheme = theme;
      this.melodyNotes = isMap ? this.mapMelodyNotes : this.levelMelodyNotes;
      this.bassNotes = isMap ? this.mapBassNotes : this.levelBassNotes;
      this.stepIndex = 0;
      this.musicPlaying = true;
      this.musicPaused = false;
      const bgmBus = this.getBgmBus();
      if (bgmBus && this.ctx) {
        try { bgmBus.gain.setValueAtTime(this.muted ? 0 : this.bgmSetting, this.ctx.currentTime); } catch (e) {}
      }
      const baseStepDuration = isRegionalTheme ? themedStepMap[theme] : (isMap ? 190 : 155);
      const isBonusSynth = theme === 'bonus_ibiza' || theme === 'bonus_iguazu';
      const hurryDiv = isBonusSynth ? 1.18 : 1.35;
      const stepDurationMs = Math.round(baseStepDuration / (this.hurryUp ? hurryDiv : 1.0));

      const triggerLevelStep = () => {
        if (this.muted || !this.musicPlaying || this.musicPaused) return;
        if (this.ctx && this.ctx.state !== 'running') {
          this.ctx.resume().catch(() => {});
          return;
        }

        this._activeMusicBus = this.getBgmBus();
        try {
          if (isRegionalTheme) {
            if (theme.indexOf('ba_') === 0) {
              this.stepBuenosAiresTheme(theme, this.stepIndex);
            } else if (theme.indexOf('ro_') === 0) {
              this.stepRosarioTheme(theme, this.stepIndex);
            } else if (theme.indexOf('co_') === 0) {
              this.stepCordobaTheme(theme, this.stepIndex);
            } else if (theme.indexOf('ush_') === 0) {
              this.stepUshuaiaTheme(theme, this.stepIndex);
            } else if (theme.indexOf('ch_') === 0) {
              this.stepChileTheme(theme, this.stepIndex);
            } else if (theme.indexOf('bonus_') === 0) {
              this.stepBonusTheme(theme, this.stepIndex);
            } else {
              this.stepSpainTheme(theme, this.stepIndex);
            }
            this.stepIndex++;
            return;
          }

          const mIdx = this.stepIndex % this.melodyNotes.length;
          const bIdx = Math.floor(this.stepIndex / 2) % this.bassNotes.length;

          const pitchMod = this.hurryUp ? 1.05946 : 1.0;
          const melFreq = this.melodyNotes[mIdx];
          if (melFreq > 0) {
            this.playTone(melFreq * pitchMod, 'triangle', 0.13, 0.10, null, 0);
            this.playTone(melFreq * pitchMod, 'square', 0.08, 0.03, null, 0);
          }

          if (this.stepIndex % 2 === 0) {
            const bassFreq = this.bassNotes[bIdx];
            if (bassFreq > 0) {
              this.playTone(bassFreq * pitchMod, 'sine', 0.22, 0.12, null, 0);
            }
          }

          if (this.stepIndex % 4 === 2) {
            this.playNoise(0.035, 0.04, 2400, 0);
          } else if (this.stepIndex % 8 === 7) {
            this.playNoise(0.03, 0.035, 3000, 0);
          }

          this.stepIndex++;
        } finally {
          this._activeMusicBus = null;
        }
      };

      // Arranque inmediato en frame 0 sin esperar el primer ciclo de setInterval
      triggerLevelStep();
      this.musicTimer = setInterval(triggerLevelStep, stepDurationMs);
    }

    setHurryUp(hurry = true) {
      if (this.hurryUp === hurry) return;
      this.hurryUp = hurry;
      const isBonusSynth = this.activeMusicTheme === 'bonus_ibiza' || this.activeMusicTheme === 'bonus_iguazu';
      this.tempoMultiplier = hurry ? (isBonusSynth ? 1.18 : 1.35) : 1.0;
      if (this.bgmAudio) {
        try {
          this.bgmAudio.playbackRate = hurry ? 1.18 : 1.0;
        } catch (e) {}
        return;
      }
      if (this.musicPlaying && this.activeMusicTheme && this.musicTimer) {
        const theme = this.activeMusicTheme;
        const meta = this._activeLevelMeta;
        const currentStep = this.stepIndex;
        if (this.musicTimer) {
          clearInterval(this.musicTimer);
          this.musicTimer = null;
        }
        this._preservingHurry = true;
        try {
          this.startMusic(theme, meta);
        } finally {
          this._preservingHurry = false;
        }
        this.stepIndex = currentStep;
      }
    }

    playHurryUpAlert() {
      if (this.muted) return;
      this.init();
      // Pitido 1 rápido y agudo
      this.playTone(880.0, 'square', 0.12, 0.18, null, 0.0);
      this.playTone(1760.0, 'sine', 0.08, 0.10, null, 0.0);
      // Pitido 2
      this.playTone(880.0, 'square', 0.14, 0.20, null, 0.16);
      this.playTone(1760.0, 'sine', 0.10, 0.11, null, 0.16);
    }

    getBgmBus() {
      const masterBus = this.getBus();
      if (!this.ctx || !masterBus) return null;
      if (!this.bgmBus) {
        this.bgmBus = this.ctx.createGain();
        this.bgmBus.gain.setValueAtTime(this.musicPaused || this.muted ? 0 : this.bgmSetting, this.ctx.currentTime);
        this.bgmBus.connect(masterBus);
      }
      return this.bgmBus;
    }

    pauseMusic() {
      this.musicPaused = true;
      if (this.bgmAudio) {
        try {
          this.bgmAudio.pause();
        } catch (e) {}
      }
      if (this.bgmBus && this.ctx) {
        try {
          this.bgmBus.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch (e) {}
      }
    }

    resumeMusic() {
      this.musicPaused = false;
      if (!this.muted && this.bgmAudio && this.musicPlaying) {
        try {
          this.bgmAudio.volume = this.bgmVolume;
          const p = this.bgmAudio.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      }
      if (this.bgmBus && this.ctx) {
        try {
          this.bgmBus.gain.setValueAtTime(this.muted ? 0 : this.bgmSetting, this.ctx.currentTime);
        } catch (e) {}
      }
    }

    stopMusic() {
      this.musicPlaying = false;
      this.musicPaused = false;
      this._activeMusicBus = null;
      this.activeMusicTheme = null;
      this._activeLevelSlotKey = null;
      this._deferredMusicTheme = null;
      this._deferredLevelMeta = null;
      this.hurryUp = false;
      this.tempoMultiplier = 1.0;
      this.stopBgmAudio();
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
      if (this.bgmBus) {
        try { this.bgmBus.disconnect(); } catch (e) {}
        this.bgmBus = null;
      }
    }

    getMenuBus() {
      const masterBus = this.getBus();
      if (!this.ctx || !masterBus) return null;
      if (!this.menuBus) {
        this.menuBus = this.ctx.createGain();
        this.menuBus.gain.setValueAtTime(this.muted ? 0 : 0.85 * this.bgmSetting, this.ctx.currentTime);
        this.menuBus.connect(masterBus);
      }
      return this.menuBus;
    }

    playZenVoice(freq, type, duration, vol, attack = 0.08, cutoffHz = 1100, delay = 0) {
      this.playMusicVoice(freq, type, duration, vol, attack, cutoffHz, delay, true);
    }

    stepAnthemStep(mode, step) {
      if (mode === 'anthem_spain') {
        // Marcha Real (España): chiptune/8-bit marcial y triunfal ('square' + 'triangle' + redoble suave)
        const mel = [
          392.0, 0, 523.25, 0, 659.25, 0, 523.25, 0,
          783.99, 783.99, 0, 659.25, 523.25, 0, 0, 0,
          698.46, 0, 659.25, 0, 587.33, 0, 523.25, 0,
          587.33, 587.33, 0, 392.0, 0, 0, 0, 0,
          659.25, 698.46, 783.99, 0, 659.25, 587.33, 523.25, 0,
          587.33, 659.25, 698.46, 0, 587.33, 523.25, 493.88, 0,
          523.25, 587.33, 659.25, 0, 523.25, 493.88, 440.0, 0,
          392.0, 440.0, 493.88, 392.0, 523.25, 0, 0, 0
        ];
        const bass = [
          130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
          130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
          174.61, 0, 164.81, 0, 146.83, 0, 130.81, 0,
          196.0, 0, 146.83, 0, 196.0, 0, 0, 0,
          130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
          196.0, 0, 146.83, 0, 196.0, 0, 146.83, 0,
          130.81, 0, 164.81, 0, 174.61, 0, 130.81, 0,
          196.0, 0, 196.0, 0, 130.81, 0, 0, 0
        ];
        const idx = step % mel.length;
        const mf = mel[idx];
        const bf = bass[idx];
        if (mf > 0) {
          this.playMusicVoice(mf, 'square', 0.30, 0.036, 0.008, 2200, 0, true);
          this.playMusicVoice(mf * 0.5, 'triangle', 0.24, 0.022, 0.01, 1400, 0, true);
        }
        if (bf > 0) {
          this.playMusicVoice(bf, 'triangle', 0.32, 0.068, 0.01, 880, 0, true);
        }
        if (idx % 4 === 0 && idx < 61) {
          this.playFilteredNoise(0.045, 0.032, 'bandpass', 2400);
        }
        return;
      }

      if (mode === 'anthem_argentina') {
        // Himno Argentino: clásica intro instrumental rápida con acordes épicos (Bb Mayor)
        const introMel = [
          // Llamada épica inicial + corridas instrumentales rápidas en Bb -> F7 -> Bb
          466.16, 587.33, 698.46, 932.33, 932.33, 0, 830.61, 783.99,
          698.46, 622.25, 587.33, 523.25, 466.16, 523.25, 587.33, 466.16,
          698.46, 587.33, 466.16, 698.46, 587.33, 466.16, 698.46, 0,
          622.25, 523.25, 440.0, 622.25, 523.25, 440.0, 622.25, 0,
          466.16, 523.25, 587.33, 622.25, 698.46, 783.99, 880.0, 932.33,
          698.46, 0, 698.46, 0, 698.46, 0, 932.33, 0,
          932.33, 0, 0, 0, 0, 0, 0, 0
        ];
        const chordBars = [
          { at: 0,  chord: [233.08, 293.66, 349.23] }, // Bb
          { at: 8,  chord: [174.61, 220.0, 261.63, 311.13] }, // F7
          { at: 16, chord: [233.08, 293.66, 349.23] }, // Bb
          { at: 24, chord: [174.61, 220.0, 261.63, 311.13] }, // F7
          { at: 32, chord: [155.56, 233.08, 311.13] }, // Eb
          { at: 40, chord: [174.61, 220.0, 261.63, 349.23] }, // F
          { at: 46, chord: [233.08, 293.66, 349.23, 466.16] }  // Bb cierre épico
        ];
        const idx = step % introMel.length;
        const hitChord = chordBars.find((c) => c.at === idx);
        if (hitChord) {
          this.playMusicVoice(hitChord.chord[0] * 0.5, 'triangle', 0.92, 0.075, 0.02, 720, 0, true);
          hitChord.chord.forEach((cf) => {
            this.playMusicVoice(cf, 'sawtooth', 0.85, 0.024, 0.025, 1650, 0, true);
            this.playMusicVoice(cf, 'triangle', 0.90, 0.028, 0.025, 1200, 0, true);
          });
          this.playElectronicKick(0.14, 108, 42);
        }
        const mf = introMel[idx];
        if (mf > 0) {
          this.playMusicVoice(mf, 'square', 0.20, 0.036, 0.008, 2400, 0, true);
          this.playMusicVoice(mf * 0.5, 'triangle', 0.22, 0.032, 0.01, 1600, 0, true);
        }
        return;
      }

      if (mode === 'anthem_chile') {
        // Himno Nacional de Chile (fallback synth): marcha solemne en Fa Mayor (F -> C7 -> Bb -> F)
        const mel = [
          349.23, 0, 440.0, 0, 523.25, 0, 587.33, 523.25,
          440.0, 0, 392.0, 0, 349.23, 0, 0, 0,
          523.25, 0, 587.33, 0, 698.46, 0, 659.25, 587.33,
          523.25, 0, 440.0, 0, 392.0, 0, 0, 0,
          466.16, 0, 587.33, 0, 698.46, 0, 587.33, 523.25,
          440.0, 0, 392.0, 0, 349.23, 0, 392.0, 0,
          440.0, 523.25, 440.0, 392.0, 349.23, 0, 0, 0
        ];
        const bass = [
          174.61, 0, 261.63, 0, 174.61, 0, 261.63, 0,
          174.61, 0, 196.0, 0, 174.61, 0, 130.81, 0,
          174.61, 0, 233.08, 0, 174.61, 0, 196.0, 0,
          130.81, 0, 174.61, 0, 130.81, 0, 0, 0,
          233.08, 0, 174.61, 0, 233.08, 0, 196.0, 0,
          174.61, 0, 130.81, 0, 174.61, 0, 130.81, 0,
          174.61, 0, 130.81, 0, 174.61, 0, 0, 0
        ];
        const idx = step % mel.length;
        const mf = mel[idx];
        const bf = bass[idx];
        if (mf > 0) {
          this.playMusicVoice(mf, 'square', 0.28, 0.034, 0.008, 2200, 0, true);
          this.playMusicVoice(mf * 0.5, 'triangle', 0.24, 0.022, 0.01, 1400, 0, true);
        }
        if (bf > 0) {
          this.playMusicVoice(bf, 'triangle', 0.30, 0.068, 0.01, 860, 0, true);
        }
        if (idx % 4 === 0 && idx < mel.length - 4) {
          this.playFilteredNoise(0.045, 0.030, 'bandpass', 2200);
        }
      }
    }

    playMenuMusic(mode = null) {
      const targetMode = mode || this.menuMode || 'zen';
      const normalizedMode =
        targetMode === 'anthem_spain' ||
        targetMode === 'anthem_argentina' ||
        targetMode === 'anthem_chile' ||
        targetMode === 'world_map' ||
        targetMode === 'biplane'
          ? targetMode
          : 'zen';
      this.musicTheme = 'menu';

      if (this.muted) {
        this.menuMode = normalizedMode;
        this._deferredMenuMusic = false;
        return;
      }

      const menuTracks = this.getMenuTracksForMode(normalizedMode);
      if (this.menuMusicPlaying && this.menuMode === normalizedMode) {
        if (menuTracks.length > 0 && this.menuAudio && !this.menuAudio.paused) {
          return;
        }
        if (menuTracks.length === 0 && !this.menuAudio && this.menuMusicTimer && this.ctx && this.ctx.state === 'running') {
          return;
        }
      }

      // Si cambia entre Menú Principal <-> Mapa Mundi <-> Himnos, detener la pista anterior limpiamente
      if (this.menuMusicPlaying || this.menuMusicTimer || this.menuBus || this.menuAudio) {
        this.stopMenuMusic();
      }
      this.menuMode = normalizedMode;
      this.stopMusic();
      this.stopFanfareAudio();

      if (menuTracks.length > 0 && typeof Audio !== 'undefined') {
        const started = this._playMenuAudioTrack(normalizedMode, menuTracks);
        if (started) return;
      }

      this._startMenuSynthFallback(normalizedMode);
    }

    _playMenuAudioTrack(normalizedMode, menuTracks) {
      const fileName = this.selectTrackVariant(menuTracks, 'menu:' + normalizedMode);
      if (!fileName) return false;
      const src = this.resolveAudioUrl(fileName);
      const audio = this.getOrCreateAudio(src);
      if (!audio) return false;

      this._deferredMenuMusic = false;
      this.menuMusicPlaying = true;

      try { audio.pause(); } catch (e) {}
      try { audio.currentTime = 0; } catch (e) {}
      audio.playbackRate = 1.0;
      audio.volume = this.muted ? 0 : this.menuVolume;
      audio.loop = menuTracks.length === 1;
      this.menuAudio = audio;
      this.menuTrackSrc = src;

      audio.onended = () => {
        if (menuTracks.length <= 1) return;
        if (this.muted || !this.menuMusicPlaying || this.musicTheme !== 'menu' || this.menuMode !== normalizedMode || this.menuAudio !== audio) {
          return;
        }
        this._playMenuAudioTrack(normalizedMode, menuTracks);
      };

      audio.onerror = () => {
        if (this.menuAudio !== audio) return;
        this.stopMenuAudio();
        this.menuMusicPlaying = false;
        this._startMenuSynthFallback(normalizedMode);
      };

      try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            if (this.muted || this.musicTheme !== 'menu' || this.menuMode !== normalizedMode || this.menuAudio !== audio) return;
            if (err && err.name === 'NotAllowedError') {
              this.stopMenuAudio();
              this.menuMusicPlaying = false;
              this._deferredMenuMusic = true;
              return;
            }
            this.stopMenuAudio();
            this.menuMusicPlaying = false;
            this._startMenuSynthFallback(normalizedMode);
          });
        }
        return true;
      } catch (e) {
        this.stopMenuAudio();
        this.menuMusicPlaying = false;
        return false;
      }
    }

    _startMenuSynthFallback(normalizedMode = 'zen') {
      if (!this.ctx || this.ctx.state !== 'running') {
        this._deferredMenuMusic = true;
        return;
      }

      this._deferredMenuMusic = false;
      this.menuMusicPlaying = true;
      this.menuStepIndex = 0;

      const stepMsMap = {
        zen: 700,
        world_map: 700,
        anthem_spain: 188,
        anthem_argentina: 132,
        anthem_chile: 165
      };

      const triggerMenuStep = () => {
        if (this.muted || !this.menuMusicPlaying) return;
        if (!this.ctx || this.ctx.state !== 'running') return;

        if (this.menuMode === 'anthem_spain' || this.menuMode === 'anthem_argentina' || this.menuMode === 'anthem_chile') {
          this.stepAnthemStep(this.menuMode, this.menuStepIndex);
          this.menuStepIndex++;
          return;
        }

        const barIdx = Math.floor(this.menuStepIndex / 4) % this.menuProgression.length;
        const beatInBar = this.menuStepIndex % 4;
        const chord = this.menuProgression[barIdx];

        // Pad ambiental cálido al inicio de cada compás (acorde Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
        if (beatInBar === 0) {
          chord.pad.forEach((f, voiceIdx) => {
            if (voiceIdx === 0) {
              this.playZenVoice(f, 'sine', 2.95, 0.044, 0.45, 520, 0);
            } else {
              this.playZenVoice(f, 'triangle', 2.85, 0.020, 0.62, 760, voiceIdx * 0.03);
              this.playZenVoice(f, 'sine', 2.90, 0.018, 0.68, 920, voiceIdx * 0.03);
            }
          });
        }

        // Arpegio estilo piano eléctrico / lo-fi suave sobre cada pulso (700 ms)
        const arpFreq = chord.arp[beatInBar];
        if (arpFreq > 0) {
          this.playZenVoice(arpFreq, 'triangle', 1.45, 0.034, 0.035, 1450, 0);
          this.playZenVoice(arpFreq * 0.5, 'sine', 1.25, 0.016, 0.05, 860, 0.02);
        }

        this.menuStepIndex++;
      };

      triggerMenuStep();
      if (this.menuMusicTimer) {
        clearInterval(this.menuMusicTimer);
      }
      this.menuMusicTimer = setInterval(triggerMenuStep, stepMsMap[normalizedMode] || 700);
    }

    stopMenuMusic() {
      this.menuMusicPlaying = false;
      this._deferredMenuMusic = false;
      this.stopMenuAudio();
      if (this.menuMusicTimer) {
        clearInterval(this.menuMusicTimer);
        this.menuMusicTimer = null;
      }
      if (this.menuBus) {
        try {
          this.menuBus.disconnect();
        } catch (e) {}
        this.menuBus = null;
      }
    }

    getJukeboxCatalog() {
      const cityGroups = [
        { key: 'barcelona', label: '🇪🇸 Barcelona' },
        { key: 'madrid', label: '🇪🇸 Madrid' },
        { key: 'palma', label: '🇪🇸 Palma de Mallorca' },
        { key: 'canarias', label: '🇪🇸 Islas Canarias' },
        { key: 'buenosaires', label: '🇦🇷 Buenos Aires' },
        { key: 'rosario', label: '🇦🇷 Rosario' },
        { key: 'cordoba', label: '🇦🇷 Córdoba' },
        { key: 'ushuaia', label: '🇦🇷 Ushuaia' },
        { key: 'chile_santiago', label: '🇨🇱 Santiago de Chile' },
        { key: 'chile_vina', label: '🇨🇱 Viña y Valparaíso' },
        { key: 'chile_atacama', label: '🇨🇱 Desierto de Atacama' },
        { key: 'chile_pascua', label: '🇨🇱 Isla de Pascua' }
      ];
      const groups = [
        {
          groupKey: 'menu',
          groupLabel: '🏠 Tema Principal',
          tracks: [
            {
              id: 'menu',
              cityKey: null,
              zoneNum: 0,
              alwaysUnlocked: true,
              title: 'Menú Principal - Aventuras por el Mundo',
              file: (MENU_TRACK_CONFIG.zen && MENU_TRACK_CONFIG.zen[0]) || null
            }
          ]
        },
        {
          groupKey: 'specials',
          groupLabel: '🎺 Himnos y Fanfarrias',
          tracks: [
            {
              id: 'anthem_spain',
              cityKey: null,
              zoneNum: 0,
              alwaysUnlocked: true,
              title: '🇪🇸 Himno de España',
              file: (MENU_TRACK_CONFIG.anthem_spain && MENU_TRACK_CONFIG.anthem_spain[0]) || null
            },
            {
              id: 'anthem_argentina',
              cityKey: null,
              zoneNum: 0,
              alwaysUnlocked: true,
              title: '🇦🇷 Himno Argentino',
              file: (MENU_TRACK_CONFIG.anthem_argentina && MENU_TRACK_CONFIG.anthem_argentina[0]) || null
            },
            {
              id: 'anthem_chile',
              cityKey: null,
              zoneNum: 0,
              alwaysUnlocked: true,
              title: '🇨🇱 Himno Chile',
              file: (MENU_TRACK_CONFIG.anthem_chile && MENU_TRACK_CONFIG.anthem_chile[0]) || null
            },
            {
              id: 'final_nivel',
              cityKey: null,
              zoneNum: 0,
              alwaysUnlocked: true,
              title: '🏆 Fanfarria Final de Nivel',
              file: (VICTORY_TRACK_CONFIG.level_clear && VICTORY_TRACK_CONFIG.level_clear[0]) || null
            }
          ]
        }
      ];

      const SYNTH_FALLBACK_CATALOG = {
        cordoba: [
          { title: '🇦🇷 Córdoba 1 - Córdoba Capital', theme: 'co_cuarteto' },
          { title: '🇦🇷 Córdoba 2 - Villa Carlos Paz', theme: 'co_cucu' },
          { title: '🇦🇷 Córdoba 3 - Villa General Belgrano', theme: 'co_oktober' },
          { title: '🇦🇷 Córdoba 4 - Cerro Uritorco', theme: 'co_uritorco' }
        ],
        ushuaia: [
          { title: '🇦🇷 Ushuaia 1 - Ushuaia Centro', theme: 'ush_centro' },
          { title: '🇦🇷 Ushuaia 2 - Tren del Fin del Mundo', theme: 'ush_tren' },
          { title: '🇦🇷 Ushuaia 3 - Glaciar Martial', theme: 'ush_glaciar' },
          { title: '🇦🇷 Ushuaia 4 - Faro Les Éclaireurs', theme: 'ush_faro' }
        ],
        chile_santiago: [
          { title: '🇨🇱 Santiago 1 - Plaza de Armas y La Moneda', theme: 'ch_santiago_plaza' },
          { title: '🇨🇱 Santiago 2 - Cerro San Cristóbal', theme: 'ch_santiago_cristobal' },
          { title: '🇨🇱 Santiago 3 - Barrio Lastarria y Bellavista', theme: 'ch_santiago_lastarria' },
          { title: '🇨🇱 Santiago 4 - Costanera Center y Cordillera', theme: 'ch_santiago_costanera' }
        ],
        chile_vina: [
          { title: '🇨🇱 Viña y Valpo 1 - Reloj de Flores y Reñaca', theme: 'ch_vina_reloj' },
          { title: '🇨🇱 Viña y Valpo 2 - Quinta Vergara', theme: 'ch_vina_quinta' },
          { title: '🇨🇱 Viña y Valpo 3 - Cerros y Ascensores', theme: 'ch_vina_ascensores' },
          { title: '🇨🇱 Viña y Valpo 4 - Puerto de Valparaíso', theme: 'ch_vina_puerto' }
        ],
        chile_atacama: [
          { title: '🇨🇱 Atacama 1 - Valle de la Luna', theme: 'ch_atacama_luna' },
          { title: '🇨🇱 Atacama 2 - Géiseres del Tatio', theme: 'ch_atacama_tatio' },
          { title: '🇨🇱 Atacama 3 - Salar de Atacama', theme: 'ch_atacama_salar' },
          { title: '🇨🇱 Atacama 4 - Observatorio Astronómico ALMA', theme: 'ch_atacama_alma' }
        ],
        chile_pascua: [
          { title: '🇨🇱 Rapa Nui 1 - Ahu Tongariki', theme: 'ch_pascua_tongariki' },
          { title: '🇨🇱 Rapa Nui 2 - Volcán Rano Raraku', theme: 'ch_pascua_raraku' },
          { title: '🇨🇱 Rapa Nui 3 - Playa Anakena', theme: 'ch_pascua_anakena' },
          { title: '🇨🇱 Rapa Nui 4 - Volcán Rano Kau (Clímax)', theme: 'ch_pascua_kau' }
        ]
      };

      const JUKEBOX_TRACK_TITLES = {
        cordoba: [
          '🇦🇷 Córdoba 1 - Córdoba Capital',
          '🇦🇷 Córdoba 2 - Villa Carlos Paz',
          '🇦🇷 Córdoba 3 - Villa General Belgrano',
          '🇦🇷 Córdoba 4 - Cerro Uritorco'
        ],
        ushuaia: [
          '🇦🇷 Ushuaia 1 - Ushuaia Centro',
          '🇦🇷 Ushuaia 2 - Tren del Fin del Mundo',
          '🇦🇷 Ushuaia 3 - Glaciar Martial',
          '🇦🇷 Ushuaia 4 - Faro Les Éclaireurs'
        ],
        chile_santiago: [
          '🇨🇱 Santiago 1 - Plaza de Armas y La Moneda',
          '🇨🇱 Santiago 2 - Cerro San Cristóbal',
          '🇨🇱 Santiago 3 - Barrio Lastarria y Bellavista',
          '🇨🇱 Santiago 4 - Costanera Center y Cordillera'
        ],
        chile_vina: [
          '🇨🇱 Viña y Valpo 1 - Reloj de Flores y Reñaca',
          '🇨🇱 Viña y Valpo 2 - Quinta Vergara (Synth)',
          '🇨🇱 Viña y Valpo 3 - Cerros y Ascensores (Synth)',
          '🇨🇱 Viña y Valpo 4 - Puerto de Valparaíso (Synth)'
        ],
        chile_atacama: [
          '🇨🇱 Atacama 1 - Valle de la Luna',
          '🇨🇱 Atacama 2 - Géiseres del Tatio (Synth)',
          '🇨🇱 Atacama 3 - Salar de Atacama (Synth)',
          '🇨🇱 Atacama 4 - Observatorio Astronómico ALMA (Synth)'
        ],
        chile_pascua: [
          '🇨🇱 Rapa Nui 1 - Ahu Tongariki',
          '🇨🇱 Rapa Nui 2 - Volcán Rano Raraku (Synth)',
          '🇨🇱 Rapa Nui 3 - Playa Anakena (Synth)',
          '🇨🇱 Rapa Nui 4 - Volcán Rano Kau (Synth)'
        ]
      };

      cityGroups.forEach((cg) => {
        const manifest = ZONE_TRACK_MANIFEST[cg.key] || {};
        const synthMeta = SYNTH_FALLBACK_CATALOG[cg.key] || null;
        const customTitleList = JUKEBOX_TRACK_TITLES[cg.key] || null;
        const tracks = [];
        for (let z = 1; z <= 4; z++) {
          const list = this.normalizeTrackList(manifest[z]);
          const file = list[0] || null;
          const fallbackEntry = synthMeta ? synthMeta[z - 1] : null;
          const customTitle = customTitleList ? customTitleList[z - 1] : null;
          const prettyTitle = customTitle
            ? customTitle
            : file
              ? file.replace(/\.(mp3|wav)$/i, '').replace(/^(.*? - Zona \d+)\s*-\s*/, '$1: ')
              : (fallbackEntry ? fallbackEntry.title : `${cg.label} - Zona ${z}`);
          tracks.push({
            id: `${cg.key}:${z}`,
            cityKey: cg.key,
            zoneNum: z,
            alwaysUnlocked: false,
            title: prettyTitle,
            file,
            synthTheme: !file && fallbackEntry ? fallbackEntry.theme : null
          });
        }
        groups.push({
          groupKey: cg.key,
          groupLabel: cg.label,
          tracks
        });
      });

      return groups;
    }

    isJukeboxPlaying(trackId = null) {
      if (!this.jukeboxPlaying) return false;
      return trackId ? this.jukeboxTrackId === trackId : true;
    }

    playJukeboxTrack(trackItem) {
      if (!trackItem || (!trackItem.file && !trackItem.synthTheme)) return false;
      if (this.jukeboxPlaying && this.jukeboxTrackId === trackItem.id) {
        this.stopJukeboxTrack(true);
        return false;
      }
      this.init();
      this.resume();
      this.stopMusic();
      this.stopMenuMusic();
      this.stopJukeboxTrack(false);

      if (!trackItem.file && trackItem.synthTheme) {
        this.jukeboxAudio = null;
        this.jukeboxTrackId = trackItem.id;
        this.jukeboxPlaying = true;
        this._jukeboxSynthPlaying = true;
        this._startLevelSynthFallback(
          trackItem.synthTheme,
          { cityKey: trackItem.cityKey, zoneNum: trackItem.zoneNum },
          'jukebox:' + trackItem.id
        );
        return true;
      }

      if (typeof Audio === 'undefined') return false;
      const src = this.resolveAudioUrl(trackItem.file);
      const audio = this.getOrCreateAudio(src);
      if (!audio) return false;

      try { audio.pause(); } catch (e) {}
      try { audio.currentTime = 0; } catch (e) {}
      audio.playbackRate = 1.0;
      audio.loop = true;
      audio.volume = this.muted ? 0 : this.baseJukeboxVolume * this.bgmSetting;
      this.jukeboxAudio = audio;
      this.jukeboxTrackId = trackItem.id;
      this.jukeboxPlaying = true;

      audio.onerror = () => {
        if (this.jukeboxAudio === audio) {
          this.stopJukeboxTrack(true);
        }
      };

      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (e) {}
      return true;
    }

    stopJukeboxTrack(resumeMenu = true) {
      const audio = this.jukeboxAudio;
      const wasSynth = !!this._jukeboxSynthPlaying;
      const wasPlaying = this.jukeboxPlaying || !!audio || wasSynth;
      this.jukeboxAudio = null;
      this.jukeboxTrackId = null;
      this.jukeboxPlaying = false;
      this._jukeboxSynthPlaying = false;
      if (wasSynth) {
        this.stopMusic();
      }
      if (audio) {
        try {
          audio.onerror = null;
          audio.onended = null;
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
      }
      if (resumeMenu && wasPlaying && !this.muted && this.musicTheme === 'menu') {
        this.playMenuMusic('zen');
      }
    }
  }

  SoundManager.activeInstance = null;

  const unlockAudio = () => {
    const mgr = SoundManager.activeInstance || (global.game && global.game.sound);
    if (mgr) {
      mgr.init();
      if (mgr.ctx && (mgr.ctx.state === 'suspended' || mgr.ctx.state === 'interrupted')) {
        mgr.ctx
          .resume()
          .then(() => {
            if (typeof mgr.playSilentUnlockPulse === 'function') mgr.playSilentUnlockPulse();
            if (typeof mgr._resumePendingMusic === 'function') mgr._resumePendingMusic();
          })
          .catch(() => {});
      } else if (mgr.ctx && mgr.ctx.state === 'running') {
        if (typeof mgr.playSilentUnlockPulse === 'function') mgr.playSilentUnlockPulse();
        if (typeof mgr._resumePendingMusic === 'function') mgr._resumePendingMusic();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const tempCtx = new AudioCtx();
        if (tempCtx.state === 'suspended') {
          tempCtx.resume().then(() => { try { tempCtx.close(); } catch (e) {} }).catch(() => {});
        } else {
          try { tempCtx.close(); } catch (e) {}
        }
      }
    } catch (e) {}
  };

  ['click', 'touchstart', 'keydown'].forEach((evt) => {
    if (typeof window !== 'undefined') {
      window.addEventListener(evt, () => unlockAudio(), { once: true, passive: true });
    }
    if (typeof document !== 'undefined') {
      document.addEventListener(evt, () => unlockAudio(), { once: true, passive: true });
    }
  });

  global.unlockAudio = unlockAudio;
  global.AUDIO_MANIFEST = {
    basePath: AUDIO_BASE_PATH,
    menu: MENU_TRACK_CONFIG,
    zones: ZONE_TRACK_MANIFEST,
    sfx: SFX_FILES,
    victory: VICTORY_TRACK_CONFIG
  };
  global.SoundManager = SoundManager;
})(window);
