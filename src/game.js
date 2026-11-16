// ============================================================================
// Aventuras por el Mundo - Motor Principal y Escenas (1080p)
// - 3 Ranuras de Guardado independientes en localStorage
// - Controles: Flechas (Mover + Saltar ↑ + Agachar ↓ / Bajar viga ↓+Espacio) + WASD (W/A/S/D)
// - Power-Ups Mutuamente Excluyentes + Caja de Reserva [W]
// - Cinemática de Fin de Nivel: Metro TMB/Madrid y Autobús EMT Palma
// ============================================================================

(function (global) {
  'use strict';

  const LOGICAL_W = 960;
  const LOGICAL_H = 540;
  const RENDER_SCALE = 2; // 1920x1080 Nativo HD (DPR 2x)
  const GAME_VERSION = 'v3.9';
  const ARCADE_BOARD_KEY = 'aventura_arcade_leaderboard_v1';
  const ARCADE_TOP_LIMIT = 5;
  const DEFAULT_TIME_LIMIT = 210;

  // Coordenadas de la Caja de Reserva (Item Box [SHIFT]) en el HUD superior
  const ITEM_BOX_RECT = { x: 449, y: 4, w: 72, h: 48 };

  class BarcelonaGame {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      if (this.canvas.width !== LOGICAL_W * RENDER_SCALE) {
        this.canvas.width = LOGICAL_W * RENDER_SCALE;
        this.canvas.height = LOGICAL_H * RENDER_SCALE;
      }

      this.sound = new global.SoundManager();
      this.sprites = new global.SpriteBank();
      this.bgRenderer = new global.BackgroundRenderer();
      this.particles = new global.Entities.ParticleSystem();

      // Estados: 'splash' | 'menu' | 'save_slots' | 'controls' | 'leaderboard' | 'settings' | 'playing' | 'paused' | 'level_cinematic' | 'level_clear' | 'map' | 'gameover' | 'victory'
      this.state = 'splash';
      this._splashDismissed = false;

      // Ranuras de guardado (1, 2, 3)
      this.activeSlotId = null;
      this.slotCursor = 0;
      this.slotDeleteFocus = false;
      this.slotModalIntent = 'play';
      this.deleteConfirmSlot = null;
      this.deleteConfirmCursor = 1;

      // Selección de líder del grupo: 'nico' | 'andrea'
      this.selectedCharacter = 'nico';
      this.menuCursor = 0; // 0: Jugar, 1: Líder, 2: Ayuda/Controles, 3: Top 10 Récords, 4: Mapa, 5: Configuración
      this.settingsCursor = 0;
      this.settingsNavItems = [];
      this.settingsSubmenu = 'main'; // 'main' | 'controls'
      this.controlsCursor = 0;
      this.controlsNavItems = [];
      this.awaitingKeyAction = null;
      this.controlsStatusMsg = '';
      this.controlsStatusWarning = false;

      // Ranking Arcade global (Top 10 + iniciales de 3 letras en Game Over)
      this.arcadeLeaderboard = this.loadArcadeLeaderboard();
      this.arcadeInitials = ['N', 'I', 'C'];
      this.lastArcadeInitials = null;
      this.arcadeLetterIdx = 0;
      this.arcadeQualifies = false;
      this.savedArcadeEntryId = null;
      this.gameOverPhase = 'initials';
      this.gameOverScore = 0;

      // Progreso de partida
      this.cityKey = 'barcelona';
      this.levelIndex = 0;
      this.score = 0;
      this.levelStartScore = 0;
      this.totalCoins = 0;
      this.runCoins = 0;
      this.levelCoins = 0;
      this.lives = 3;
      this.savedHearts =
        global.WorldProgress && typeof global.WorldProgress.getHearts === 'function'
          ? global.WorldProgress.getHearts()
          : 3;
      this.survivalRiskMode = false;
      this.tookDamageInZone = false;
      this.postGameOverFallback = false;
      this.carriedPowerUp = null;
      this.levelTime = 0;
      this.levelTimer = DEFAULT_TIME_LIMIT;
      this.timeLeft = DEFAULT_TIME_LIMIT;
      this.hurryUpTriggered = false;
      this.totalTime = 0;
      this.highScore = this.loadHighScore();

      // Caja de Reserva Manual estilo Super Mario World (null | 'angel_wings' | 'plant')
      this.reservePowerUp = null;
      this.plantProjectiles = [];
      this.calamaresProjectiles = this.plantProjectiles;

      // Estado de la Cinemática de Fin de Nivel
      this.cinematicTimer = 0;
      this.cinematicBaseScore = 0;
      this.cinematicInitialTimeLeft = 0;
      this.cinematicTimeLeft = 0;
      this.cinematicTimeBonus = 0;
      this.cinematicCoinsTallied = 0;
      this.cinematicCoinBonus = 0;
      this.cinematicPerfectZone = false;
      this.cinematicPerfectBonus = 0;
      this.cinematicTickAccum = 0;
      this.cinematicMetroAnnounced = false;
      this.cinematicTallyFinished = false;
      this.levelClearScreenTime = 0;
      this.levelClearTallyElapsed = 0;
      this.levelClearTallyDone = false;
      this.levelClearFireworkTimer = 0;
      this.levelClearParticles = new global.Entities.ParticleSystem();
      this.collectedBonesInRun = new Set();
      this.menuDemoLeader = this.selectedCharacter;
      this.menuDemoTimer = 0;
      this.menuDemoSkillTriggered = false;
      this.menuDemoParticles = new global.Entities.ParticleSystem();
      this.irisRadius = 1200;
      this.irisCenterX = LOGICAL_W * 0.5;
      this.irisCenterY = LOGICAL_H * 0.5;
      this.startCheatEligible = false;
      this.startCheatBuffer = '';
      this.etHomeBuffer = '';
      this.pwingBuffer = '';
      this.airTourBuffer = '';
      this.ghostBuffer = '';
      this.ghostRescueToastCooldown = 0;
      this.isAbductedByCheat = false;
      this.abductionCheat = null;
      this.isBiplaneFlightCheat = false;
      this.biplaneFlightCheat = null;
      this.pendingCityUnlock = null;
      this.pendingContinentUnlock = null;
      this.cheatLoadTime = 0;
      this.cheatSpawnX = null;
      this.cheatIrisTimer = 0;
      this.cheatIrisDuration = 0.85;
      this.cheatIrisHold = 0.15;
      this.deathTimer = 0;
      this.deathIrisRadius = Math.hypot(LOGICAL_W, LOGICAL_H);
      this.deathCenterX = LOGICAL_W * 0.5;
      this.deathCenterY = LOGICAL_H * 0.5;
      this.deathFellInPit = false;
      this.deathWasTimeUp = false;
      if (this.sound && typeof this.sound.bindUnlockHandlers === 'function') {
        this.sound.bindUnlockHandlers();
      }

      // Cámara, carteles discretos de 3s y efectos de pantalla
      this.cameraX = 0;
      this.screenShakeTimer = 0;
      this.screenShakeIntensity = 0;
      this.levelBannerTimer = 0;
      this.hints = [];
      this.activeHintText = '';
      this.activeHintTimer = 0;
      this.fireworkTimer = 0;

      // Entradas gestionadas por InputManager (src/input.js)
      this.inputManager = new global.InputManager(this);
      this.input = this.inputManager.state;

      // Entidades del nivel actual
      this.levelData = null;
      this.solids = [];
      this.movingPlatforms = [];
      this.fallingPlatforms = [];
      this.hiddenBlocks = [];
      this.collectibles = [];
      this.pigeons = [];
      this.scooters = [];
      this.seagulls = [];
      this.hedgehogs = [];
      this.boars = [];
      this.madridCats = [];
      this.selfieTourists = [];
      this.royalGuards = [];
      this.peacocks = [];
      this.crazyCyclists = [];
      this.greenParakeets = [];
      this.swarmParakeets = [];
      this.isMadridSwarm = false;
      this.jellyfishes = [];
      this.crabs = [];
      this.goats = [];
      this.royalSeagulls = [];
      this.swarmRoyalSeagulls = [];
      this.isPalmaSwarm = false;
      this.geysers = [];
      this.gallotias = [];
      this.garajonayFoxes = [];
      this.gaudiLizard = null;
      this.lizardEventConsumed = false;
      this.gaudiLizardEventResolved = false;
      this.abubillas = [];
      this.swarmAbubillas = [];
      this.blindCrabs = [];
      this.isCanariasSwarm = false;
      this.ropes = [];
      this.subwayVents = [];
      this.sinkingContainers = [];
      this.overheadHazards = [];
      this.trapitos = [];
      this.motochorros = [];
      this.barrabravas = [];
      this.canillitas = [];
      this.fatPigeons = [];
      this.horneroNests = [];
      this.horneros = [];
      this.swarmHorneros = [];
      this.isHorneroSwarm = false;
      this.newspaperProjectiles = [];
      this.lightPoles = [];
      this.rockeros = [];
      this.penguins = [];
      this.coldBlasts = [];
      this.palometas = [];
      this.bouncyDrums = [];
      this.swarmMosquitoes = [];
      this.isMosquitoSwarm = false;
      this.belgranoPirates = [];
      this.fernetBottles = [];
      this.fernetPuddles = [];
      this.serranoBurros = [];
      this.miniUfos = [];
      this.seaLions = [];
      this.kingCrabs = [];
      this.fuegianFoxes = [];
      this.swarmCormorants = [];
      this.isCormorantSwarm = false;
      this.pumas = [];
      this.condors = [];
      this.portPelicans = [];
      this.pelicanDrops = [];
      this.pacificHazards = [];
      this.frigates = [];
      this.salineSpits = [];
      this.vicunas = [];
      this.portDogs = [];
      this.rapaNuiWarriors = [];
      this.guasos = [];
      this.guasas = [];
      this.guasoDancers = [];
      this.swarmFrigates = [];
      this.isFrigateSwarm = false;
      this.autoScrollSpeed = 0;
      this.constantWindX = 0;
      this.hasSandPhysics = false;
      this.hasIcePhysics = false;
      this.hasSaltPhysics = false;
      this.hasLavaPits = false;
      this.hasDeadlyPits = false;
      this.hasWaterPits = false;
      this.hasStormWaves = false;
      this.waterPits = [];
      this.roseTunnels = [];
      this.zigzagPigeons = [];
      this.swarmPigeons = [];
      this.swarmEventTriggered = false;
      this.swarmAlertTimer = 0;
      this.player = null;
      this.partner = null;
      this.tina = null;

      this.lastTimestamp = performance.now();
      this.globalAnimTime = 0;

      // Mapa General (Overworld) + progreso por ranura
      global.WorldProgress.load();
      this.mapScreen = new global.MapScreen(this);

      // Controles virtuales SOLO en dispositivos táctiles (en escritorio: teclado limpio)
      this.applyInputMode();

      this.inputManager.bindEvents();
      this.setupAudioButton();
      this.setupSettingsModal();
      this.setupSplashOverlay();
      this.syncControlHintsUI();
      this.render();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    loadHighScore() {
      let best = 0;
      if (this.activeSlotId && global.WorldProgress) {
        best = Math.max(best, global.WorldProgress.getSlotMaxDisplayScore());
      }
      if (global.SaveSlots) {
        best = Math.max(best, global.SaveSlots.getGlobalBestScore());
      }
      const board = Array.isArray(this.arcadeLeaderboard)
        ? this.arcadeLeaderboard
        : this.loadArcadeLeaderboard();
      if (board.length > 0) {
        best = Math.max(best, Number(board[0].score) || 0);
      }
      return best;
    }

    loadArcadeLeaderboard() {
      try {
        const raw = global.localStorage ? global.localStorage.getItem(ARCADE_BOARD_KEY) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter((item) => item && typeof item === 'object')
          .map((item) => ({
            id: String(item.id || `${item.date || 0}-${item.initials || 'AAA'}`),
            initials: String(item.initials || 'AAA')
              .toUpperCase()
              .replace(/[^A-Z]/g, 'A')
              .padEnd(3, 'A')
              .slice(0, 3),
            score: Math.max(0, Math.floor(Number(item.score) || 0)),
            leader: item.leader === 'andrea' ? 'andrea' : 'nico',
            date: Number(item.date) || 0
          }))
          .sort((a, b) => b.score - a.score || a.date - b.date)
          .slice(0, ARCADE_TOP_LIMIT);
      } catch (_err) {
        return [];
      }
    }

    saveArcadeLeaderboard(entries) {
      const clean = (Array.isArray(entries) ? entries : [])
        .slice()
        .sort((a, b) => b.score - a.score || a.date - b.date)
        .slice(0, ARCADE_TOP_LIMIT);
      this.arcadeLeaderboard = clean;
      try {
        if (global.localStorage) {
          global.localStorage.setItem(ARCADE_BOARD_KEY, JSON.stringify(clean));
        }
      } catch (_err) {
        // Ignorar errores de cuota/modo privado
      }
      if (clean.length > 0 && clean[0].score > this.highScore) {
        this.highScore = clean[0].score;
      }
      return clean;
    }

    qualifiesForLeaderboard(scoreVal) {
      const s = Math.max(0, Math.floor(Number(scoreVal) || 0));
      const board = this.loadArcadeLeaderboard();
      if (s <= 0) return board.length < ARCADE_TOP_LIMIT;
      return board.length < ARCADE_TOP_LIMIT || s > board[board.length - 1].score;
    }

    prepareGameOverScreen(scoreSnapshot = this.score) {
      this.arcadeLeaderboard = this.loadArcadeLeaderboard();
      const achievedScore = Math.max(0, Math.floor(Number(scoreSnapshot) || 0));
      this.gameOverScore = achievedScore;
      // Consecuencia justa del Game Over: reiniciar el puntaje actual de la sesión a 0
      // manteniendo monedas acumuladas, progreso desbloqueado y último destino jugado
      this.score = 0;
      this.levelStartScore = 0;
      const defaultTag = this.selectedCharacter === 'andrea' ? ['A', 'N', 'D'] : ['N', 'I', 'C'];
      this.arcadeInitials =
        this.lastArcadeInitials && this.lastArcadeInitials.length === 3
          ? this.lastArcadeInitials.slice()
          : defaultTag;
      this.arcadeLetterIdx = 0;
      this.savedArcadeEntryId = null;
      this.arcadeQualifies = this.qualifiesForLeaderboard(achievedScore);
      this.gameOverPhase = this.arcadeQualifies ? 'initials' : 'leaderboard';
      this.state = 'gameover';
    }

    stepArcadeInitial(delta) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const idx = Math.max(0, Math.min(2, this.arcadeLetterIdx | 0));
      const cur = alphabet.indexOf(this.arcadeInitials[idx] || 'A');
      const next = (Math.max(0, cur) + delta + alphabet.length) % alphabet.length;
      this.arcadeInitials[idx] = alphabet[next];
      if (this.sound && typeof this.sound.menuSelect === 'function') {
        this.sound.menuSelect();
      }
    }

    typeArcadeInitial(letter) {
      const ch = String(letter || '').toUpperCase();
      if (!/^[A-Z]$/.test(ch)) return false;
      const idx = Math.max(0, Math.min(2, this.arcadeLetterIdx | 0));
      this.arcadeInitials[idx] = ch;
      if (this.arcadeLetterIdx < 2) {
        this.arcadeLetterIdx++;
      }
      if (this.sound && typeof this.sound.menuSelect === 'function') {
        this.sound.menuSelect();
      }
      return true;
    }

    confirmArcadeInitials() {
      const initials = this.arcadeInitials
        .join('')
        .toUpperCase()
        .replace(/[^A-Z]/g, 'A')
        .padEnd(3, 'A')
        .slice(0, 3);
      this.lastArcadeInitials = this.arcadeInitials.slice();
      const board = this.loadArcadeLeaderboard();
      const rawScore = Number.isFinite(this.gameOverScore) ? this.gameOverScore : this.score;
      const entryScore = Math.max(0, Math.floor(Number(rawScore) || 0));
      const newEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        initials,
        score: entryScore,
        leader: this.selectedCharacter === 'andrea' ? 'andrea' : 'nico',
        date: Date.now()
      };
      if (entryScore > 0 || board.length < ARCADE_TOP_LIMIT) {
        board.push(newEntry);
        const saved = this.saveArcadeLeaderboard(board);
        this.savedArcadeEntryId = saved.some((e) => e.id === newEntry.id) ? newEntry.id : null;
      } else {
        this.arcadeLeaderboard = board;
        this.savedArcadeEntryId = null;
      }
      if (this.sound && typeof this.sound.playMenuConfirmChord === 'function') {
        this.sound.playMenuConfirmChord(true);
      }
      this.gameOverPhase = 'leaderboard';
    }

    openLeaderboardModal() {
      this.arcadeLeaderboard = this.loadArcadeLeaderboard();
      this.savedArcadeEntryId = null;
      this.state = 'leaderboard';
    }

    closeLeaderboardModal(playSound = true) {
      if (playSound && this.sound && typeof this.sound.menuSelect === 'function') {
        this.sound.menuSelect();
      }
      this.state = 'menu';
    }

    saveHighScore() {
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
      if (this.activeSlotId && global.WorldProgress) {
        const levelEarned = Math.max(0, Math.floor(this.score - (this.levelStartScore || 0)));
        if (this.levelData) {
          global.WorldProgress.recordLevelScore(
            this.cityKey,
            this.levelIndex + 1,
            levelEarned
          );
        }
        global.WorldProgress.updateSlotHighScore(this.score);
        global.WorldProgress.setTotalCoins(this.totalCoins);
        this.highScore = Math.max(
          this.highScore,
          global.WorldProgress.getSlotMaxDisplayScore()
        );
      }
    }

    setupSplashOverlay() {
      if (typeof document === 'undefined') return;
      const overlay = document.getElementById('splash-overlay');
      if (!overlay) {
        this.state = 'menu';
        return;
      }
      if (this.state !== 'splash') {
        overlay.classList.add('hidden');
        return;
      }

      const onPointerActivate = (ev) => {
        if (this.state !== 'splash' || this._splashDismissed) return;
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        const target = ev.target;
        if (target && typeof target.closest === 'function') {
          if (target.closest('#global-mute-btn, #btn-mute')) return;
        }
        if (typeof ev.preventDefault === 'function') ev.preventDefault();
        this.enterMenuFromSplash();
      };

      this._splashPointerHandler = onPointerActivate;
      document.addEventListener('pointerdown', onPointerActivate, true);
    }

    hideSplashOverlay() {
      if (typeof document === 'undefined') return;
      if (this._splashPointerHandler) {
        document.removeEventListener('pointerdown', this._splashPointerHandler, true);
        this._splashPointerHandler = null;
      }
      const overlay = document.getElementById('splash-overlay');
      if (!overlay) return;
      try { overlay.blur(); } catch (e) {}
      overlay.classList.add('is-leaving');
      setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('is-leaving');
      }, 270);
    }

    enterMenuFromSplash() {
      if (this.state !== 'splash' || this._splashDismissed) return;
      this._splashDismissed = true;
      this.state = 'menu';
      this.menuDemoTimer = 0;
      this.menuDemoSkillTriggered = false;
      this.menuDemoParticles = new global.Entities.ParticleSystem();

      if (this.sound) {
        this.sound.init();
        if (typeof this.sound.unlock === 'function') {
          this.sound.unlock();
        }
        const resumePromise =
          typeof this.sound.resume === 'function' ? this.sound.resume() : null;

        const playConfirm = () => {
          if (!this.sound || this.sound.muted) return;
          if (typeof this.sound.coin === 'function') {
            this.sound.coin();
          } else if (typeof this.sound.playMenuConfirmChord === 'function') {
            this.sound.playMenuConfirmChord(false);
          }
        };

        if (this.sound.ctx && this.sound.ctx.state === 'running') {
          playConfirm();
        } else if (resumePromise && typeof resumePromise.then === 'function') {
          resumePromise.then((ok) => {
            if (ok) playConfirm();
          });
        } else if (typeof this.sound.playMenuConfirmChord === 'function') {
          this.sound.playMenuConfirmChord(false);
        }

        if (typeof this.sound.playMenuMusic === 'function') {
          this.sound.playMenuMusic('zen');
        }
      }

      this.hideSplashOverlay();
    }

    setupAudioButton() {
      this.sound.syncMuteUI();
      ['btn-mute', 'global-mute-btn'].forEach((id) => {
        const btn = document.getElementById(id);
        if (!btn || btn.dataset.muteBound) return;
        btn.dataset.muteBound = '1';
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.sound.init();
          this.sound.resume();
          const muted = this.sound.toggleMute();
          if (!muted) {
            this.sound.playMenuConfirmChord(true);
          }
          btn.blur();
        });
      });
    }

    setupSettingsModal() {
      const modal = document.getElementById('settings-modal');
      const btnClose = document.getElementById('btn-settings-close');
      const sliderBgm = document.getElementById('slider-bgm');
      const sliderSfx = document.getElementById('slider-sfx');
      const valBgm = document.getElementById('val-bgm');
      const valSfx = document.getElementById('val-sfx');
      if (!modal) return;

      const syncSliderText = () => {
        const bgmPct = this.sound.getBgmVolumePercent();
        const sfxPct = this.sound.getSfxVolumePercent();
        if (sliderBgm) sliderBgm.value = String(bgmPct);
        if (sliderSfx) sliderSfx.value = String(sfxPct);
        if (valBgm) valBgm.textContent = `${bgmPct}%`;
        if (valSfx) valSfx.textContent = `${sfxPct}%`;
      };
      syncSliderText();

      if (sliderBgm) {
        const onBgmInput = () => {
          const pct = this.sound.setBgmVolume(sliderBgm.value);
          if (valBgm) valBgm.textContent = `${pct}%`;
        };
        sliderBgm.addEventListener('input', onBgmInput);
        sliderBgm.addEventListener('change', onBgmInput);
      }

      if (sliderSfx) {
        const onSfxInput = () => {
          const pct = this.sound.setSfxVolume(sliderSfx.value);
          if (valSfx) valSfx.textContent = `${pct}%`;
        };
        sliderSfx.addEventListener('input', onSfxInput);
        sliderSfx.addEventListener('change', () => {
          onSfxInput();
          this.sound.menuSelect();
        });
      }

      if (btnClose) {
        btnClose.addEventListener('click', () => {
          if (this.settingsSubmenu === 'controls') {
            this.closeControlsSubmenu(true);
          } else {
            this.closeSettingsModal(true);
          }
        });
      }

      const btnOpenControls = document.getElementById('btn-open-controls');
      const rowOpenControls = document.getElementById('row-open-controls');
      if (btnOpenControls) {
        btnOpenControls.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.openControlsSubmenu();
        });
      }
      if (rowOpenControls) {
        rowOpenControls.addEventListener('click', () => {
          this.openControlsSubmenu();
        });
      }

      const btnPresetA = document.getElementById('btn-preset-a');
      const btnPresetB = document.getElementById('btn-preset-b');
      const btnPresetCustom = document.getElementById('btn-preset-custom');
      if (btnPresetA) btnPresetA.addEventListener('click', () => this.selectControlPreset('preset_a'));
      if (btnPresetB) btnPresetB.addEventListener('click', () => this.selectControlPreset('preset_b'));
      if (btnPresetCustom) btnPresetCustom.addEventListener('click', () => this.selectControlPreset('custom'));

      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) {
          this.awaitingKeyAction = null;
          this.closeSettingsModal(true);
        }
      });
    }

    getControlSchemeSafe() {
      if (global.Input && typeof global.Input.getControlScheme === 'function') {
        return global.Input.getControlScheme();
      }
      if (this.inputManager && typeof this.inputManager.getControlScheme === 'function') {
        return this.inputManager.getControlScheme();
      }
      return {
        profile: 'preset_b',
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'Space',
        shoot: 'KeyD',
        tina: 'KeyS',
        skill: 'KeyA',
        reserve: 'ShiftLeft'
      };
    }

    getControlProfileLabel(profileId) {
      if (profileId === 'preset_b') return 'PRESET B (Alternativo)';
      if (profileId === 'custom') return 'PERSONALIZADO';
      return 'PRESET A (Clásico)';
    }

    getControlKeyBadge(actionKey, compact = false, fallbackText = '') {
      const scheme = this.getControlSchemeSafe();
      const code = scheme ? scheme[actionKey] : null;
      if (!code) return fallbackText || '—';
      if (global.Input && typeof global.Input.formatKeyCode === 'function') {
        return global.Input.formatKeyCode(code, compact);
      }
      if (this.inputManager && typeof this.inputManager.formatKeyCode === 'function') {
        return this.inputManager.formatKeyCode(code, compact);
      }
      return fallbackText || code;
    }

    formatControlHintText(text) {
      if (!text || typeof text !== 'string') return text;
      const kUp = this.getControlKeyBadge('up', true, '↑');
      const kDown = this.getControlKeyBadge('down', true, '↓');
      const kShoot = this.getControlKeyBadge('shoot', true, 'Z');
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      const kSkill = this.getControlKeyBadge('skill', true, 'C');
      const kReserve = this.getControlKeyBadge('reserve', true, 'SHIFT');
      return text
        .replace(/\[↑\+Z\]/g, `[${kUp}+${kShoot}]`)
        .replace(/\[↓\+Z\]/g, `[${kDown}+${kShoot}]`)
        .replace(/\[Z\/C\]/g, `[${kShoot}/${kSkill}]`)
        .replace(/\[X\]/g, `[${kTina}]`)
        .replace(/\[Z\]/g, `[${kShoot}]`)
        .replace(/\[C\]/g, `[${kSkill}]`)
        .replace(/\[SHIFT\]/g, `[${kReserve}]`)
        .replace(/\[↑\]/g, `[${kUp}]`);
    }

    wrapBannerText(ctx, text, maxWidth) {
      const clean = String(text || '').trim();
      if (!clean) return [];
      if (ctx.measureText(clean).width <= maxWidth) return [clean];
      const words = clean.split(/\s+/);
      if (words.length >= 2) {
        let bestSplit = -1;
        let bestDiff = Infinity;
        for (let i = 1; i < words.length; i++) {
          const left = words.slice(0, i).join(' ');
          const right = words.slice(i).join(' ');
          const lw = ctx.measureText(left).width;
          const rw = ctx.measureText(right).width;
          if (lw <= maxWidth && rw <= maxWidth) {
            const diff = Math.abs(lw - rw);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestSplit = i;
            }
          }
        }
        if (bestSplit > 0) {
          return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
        }
      }
      const lines = [];
      let current = '';
      for (let i = 0; i < words.length; i++) {
        const candidate = current ? `${current} ${words[i]}` : words[i];
        if (!current || ctx.measureText(candidate).width <= maxWidth) {
          current = candidate;
        } else {
          lines.push(current);
          current = words[i];
        }
      }
      if (current) lines.push(current);
      return lines;
    }

    updateOverlayTimers(dt) {
      if (this.levelBannerTimer > 0) {
        this.levelBannerTimer = Math.max(0, this.levelBannerTimer - dt);
      } else if (this.activeHintTimer > 0) {
        // Solo descontar mientras el aviso es visible (no oculto tras el banner inicial de nivel)
        this.activeHintTimer = Math.max(0, this.activeHintTimer - dt);
      }
      if (this.swarmAlertTimer > 0) {
        this.swarmAlertTimer = Math.max(0, this.swarmAlertTimer - dt);
      }
    }

    syncPresetButtonsActive(profileId) {
      const btnPresetA = document.getElementById('btn-preset-a');
      const btnPresetB = document.getElementById('btn-preset-b');
      const btnPresetCustom = document.getElementById('btn-preset-custom');
      if (btnPresetA) btnPresetA.classList.toggle('active', profileId === 'preset_a');
      if (btnPresetB) btnPresetB.classList.toggle('active', profileId === 'preset_b');
      if (btnPresetCustom) btnPresetCustom.classList.toggle('active', profileId === 'custom');
    }

    syncControlHintsUI() {
      const scheme = this.getControlSchemeSafe();
      const profileBadge = document.getElementById('settings-controls-profile-badge');
      if (profileBadge) {
        profileBadge.textContent = this.getControlProfileLabel(scheme.profile);
      }
      this.syncPresetButtonsActive(scheme.profile);

      const kUp = this.getControlKeyBadge('up', true, '↑');
      const kDown = this.getControlKeyBadge('down', true, '↓');
      const kLeft = this.getControlKeyBadge('left', true, '◀');
      const kRight = this.getControlKeyBadge('right', true, '▶');
      const kJump = this.getControlKeyBadge('jump', true, 'ESPACIO');
      const kShoot = this.getControlKeyBadge('shoot', true, 'Z');
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      const kSkill = this.getControlKeyBadge('skill', true, 'C');
      const kReserve = this.getControlKeyBadge('reserve', true, 'SHIFT');

      const legend = document.getElementById('desktop-keys-legend');
      if (legend) {
        legend.innerHTML = '';
        const items = [
          [`${kLeft} ${kUp} ${kDown} ${kRight}`, `Mover · ${kJump} Saltar`],
          [`[${kReserve}]`, 'Reserva'],
          [`[${kSkill}]`, 'Especial'],
          [`[${kTina}]`, 'La Tina'],
          [`[${kShoot}]`, 'Planta']
        ];
        items.forEach(([keyLabel, actionName]) => {
          const span = document.createElement('span');
          const b = document.createElement('b');
          b.textContent = keyLabel;
          span.appendChild(b);
          span.appendChild(document.createTextNode(` ${actionName}`));
          legend.appendChild(span);
        });
      }

      const btnTina = document.getElementById('btn-tina');
      if (btnTina) {
        btnTina.textContent = `🐾 TINA [${kTina}]`;
        btnTina.setAttribute('aria-label', `Ladrido Doble de la Tina (Tecla ${kTina})`);
      }

      const setBtnSub = (id, text) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const sub = btn.querySelector('.btn-sub');
        if (sub) sub.textContent = text;
      };
      setBtnSub('btn-reserve', `RESERVA [${kReserve}]`);
      setBtnSub('btn-shoot', `PLANTA [${kShoot}]`);
      setBtnSub('btn-skill', `ESP [${kSkill}/${kTina}]`);
      setBtnSub('btn-jump', `SALTAR [${kJump}]`);
    }

    renderJukeboxList() {
      const container = document.getElementById('jukebox-list');
      const badge = document.getElementById('jukebox-progress-badge');
      if (!container) return;

      const catalog = this.sound.getJukeboxCatalog();
      container.innerHTML = '';
      this.settingsNavItems = [];

      const sliderBgmRow = document.querySelector('.volume-row[data-nav-item="slider-bgm"]');
      const sliderSfxRow = document.querySelector('.volume-row[data-nav-item="slider-sfx"]');
      const controlsRow = document.getElementById('row-open-controls');
      const btnClose = document.getElementById('btn-settings-close');
      if (btnClose) this.settingsNavItems.push({ kind: 'close', el: btnClose });
      if (sliderBgmRow) this.settingsNavItems.push({ kind: 'slider', which: 'bgm', el: sliderBgmRow });
      if (sliderSfxRow) this.settingsNavItems.push({ kind: 'slider', which: 'sfx', el: sliderSfxRow });
      if (controlsRow) this.settingsNavItems.push({ kind: 'controls', el: controlsRow });

      let totalCount = 0;
      let unlockedCount = 0;

      catalog.forEach((group) => {
        const header = document.createElement('div');
        header.className = 'jukebox-group-title';
        header.textContent = group.groupLabel;
        container.appendChild(header);

        group.tracks.forEach((track) => {
          totalCount++;
          const unlocked =
            track.alwaysUnlocked ||
            (global.WorldProgress &&
              typeof global.WorldProgress.isAnySlotZoneUnlocked === 'function' &&
              global.WorldProgress.isAnySlotZoneUnlocked(track.cityKey, track.zoneNum));
          if (unlocked) unlockedCount++;

          const playing = unlocked && this.sound.isJukeboxPlaying(track.id);
          const row = document.createElement('div');
          row.className = `jukebox-row${unlocked ? '' : ' locked'}${playing ? ' playing' : ''}`;

          const titleEl = document.createElement('span');
          titleEl.className = 'jukebox-track-name';
          titleEl.textContent = unlocked ? `🎵 ${track.title}` : '🔒 ????????';

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'jukebox-play-btn';
          btn.disabled = !unlocked;
          btn.textContent = !unlocked ? '🔒 Bloqueada' : playing ? '⏸ Stop' : '▶ Play';
          if (unlocked) {
            btn.addEventListener('click', () => {
              this.sound.playJukeboxTrack(track);
              this.renderJukeboxList();
              this.refreshSettingsFocus();
            });
          }

          row.appendChild(titleEl);
          row.appendChild(btn);
          container.appendChild(row);
          this.settingsNavItems.push({ kind: 'track', track, unlocked, el: row });
        });
      });

      if (badge) {
        badge.textContent = `${unlockedCount}/${totalCount} desbloqueadas`;
      }
      this.refreshSettingsFocus();
    }

    refreshSettingsFocus() {
      if (!Array.isArray(this.settingsNavItems) || !this.settingsNavItems.length) return;
      this.settingsCursor = Math.max(0, Math.min(this.settingsNavItems.length - 1, this.settingsCursor | 0));
      document.querySelectorAll('#settings-modal .kb-focus').forEach((n) => n.classList.remove('kb-focus'));
      const item = this.settingsNavItems[this.settingsCursor];
      if (item && item.el) {
        item.el.classList.add('kb-focus');
        if (typeof item.el.scrollIntoView === 'function') {
          try {
            item.el.scrollIntoView({ block: 'nearest' });
          } catch (e) {}
        }
      }
    }

    moveSettingsCursor(delta) {
      if (!this.settingsNavItems.length) return;
      if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        document.activeElement.blur();
      }
      const len = this.settingsNavItems.length;
      this.settingsCursor = ((this.settingsCursor + delta) % len + len) % len;
      this.refreshSettingsFocus();
      this.sound.menuSelect();
    }

    adjustSettingsSlider(deltaPct) {
      const item = this.settingsNavItems[this.settingsCursor];
      if (!item || item.kind !== 'slider') return false;
      if (item.which === 'bgm') {
        const pct = this.sound.setBgmVolume(this.sound.getBgmVolumePercent() + deltaPct);
        const s = document.getElementById('slider-bgm');
        const v = document.getElementById('val-bgm');
        if (s) s.value = String(pct);
        if (v) v.textContent = `${pct}%`;
      } else {
        const pct = this.sound.setSfxVolume(this.sound.getSfxVolumePercent() + deltaPct);
        const s = document.getElementById('slider-sfx');
        const v = document.getElementById('val-sfx');
        if (s) s.value = String(pct);
        if (v) v.textContent = `${pct}%`;
        this.sound.menuSelect();
      }
      return true;
    }

    activateSettingsItem() {
      const item = this.settingsNavItems[this.settingsCursor];
      if (!item) return;
      if (item.kind === 'close') {
        this.closeSettingsModal(true);
      } else if (item.kind === 'controls') {
        this.openControlsSubmenu();
      } else if (item.kind === 'track') {
        if (!item.unlocked) {
          if (typeof this.sound.mapDenied === 'function') this.sound.mapDenied();
          return;
        }
        this.sound.playJukeboxTrack(item.track);
        this.renderJukeboxList();
      }
    }

    updateSettingsHeaderForView() {
      const titleEl = document.getElementById('settings-title');
      const closeBtn = document.getElementById('btn-settings-close');
      const mainView = document.getElementById('settings-main-view');
      const controlsView = document.getElementById('settings-controls-view');
      const inControls = this.settingsSubmenu === 'controls';
      if (mainView) mainView.classList.toggle('hidden', inControls);
      if (controlsView) controlsView.classList.toggle('hidden', !inControls);
      if (titleEl) {
        titleEl.textContent = inControls
          ? '🎮 CONTROLES PERSONALIZADOS'
          : '⚙ CONFIGURACIÓN DE AUDIO Y JUKEBOX';
      }
      if (closeBtn) {
        closeBtn.textContent = inControls ? '◀ VOLVER A CONFIG [ESC]' : '◀ VOLVER [ESC]';
      }
    }

    openControlsSubmenu() {
      this.settingsSubmenu = 'controls';
      this.awaitingKeyAction = null;
      this.controlsStatusWarning = false;
      this.controlsStatusMsg =
        'Selecciona una acción y presiona ENTER (o haz clic) para asignar otra tecla.';
      this.controlsCursor = 4;
      this.updateSettingsHeaderForView();
      this.renderControlsSubmenu();
      this.sound.menuSelect();
    }

    closeControlsSubmenu(playSound = true) {
      this.awaitingKeyAction = null;
      this.settingsSubmenu = 'main';
      this.controlsStatusWarning = false;
      this.controlsStatusMsg = '';
      this.updateSettingsHeaderForView();
      this.syncControlHintsUI();
      this.renderJukeboxList();
      const idx = this.settingsNavItems.findIndex((it) => it && it.kind === 'controls');
      if (idx >= 0) {
        this.settingsCursor = idx;
        this.refreshSettingsFocus();
      }
      if (playSound && this.sound) this.sound.menuSelect();
    }

    renderControlsSubmenu() {
      const scheme = this.getControlSchemeSafe();
      const actions =
        global.Input && typeof global.Input.getControlActions === 'function'
          ? global.Input.getControlActions()
          : this.inputManager.getControlActions();

      const btnPresetA = document.getElementById('btn-preset-a');
      const btnPresetB = document.getElementById('btn-preset-b');
      const btnPresetCustom = document.getElementById('btn-preset-custom');
      const btnClose = document.getElementById('btn-settings-close');
      const statusBar = document.getElementById('controls-status-bar');
      const listEl = document.getElementById('controls-actions-list');
      if (!listEl) return;

      this.syncPresetButtonsActive(scheme.profile);

      if (statusBar) {
        statusBar.classList.remove('warning', 'waiting');
        if (this.awaitingKeyAction) {
          statusBar.classList.add('waiting');
          const pending = actions.find((a) => a.key === this.awaitingKeyAction);
          const pendingName = pending ? pending.label : this.awaitingKeyAction;
          statusBar.textContent = `⏳ Esperando tecla para "${pendingName}"... Presiona la nueva tecla (ESC para cancelar).`;
        } else {
          if (this.controlsStatusWarning) statusBar.classList.add('warning');
          statusBar.textContent =
            this.controlsStatusMsg ||
            'Selecciona una acción y presiona ENTER (o haz clic) para asignar otra tecla.';
        }
      }

      listEl.innerHTML = '';
      this.controlsNavItems = [];
      if (btnClose) this.controlsNavItems.push({ kind: 'close', el: btnClose });
      if (btnPresetA) this.controlsNavItems.push({ kind: 'preset', presetId: 'preset_a', el: btnPresetA });
      if (btnPresetB) this.controlsNavItems.push({ kind: 'preset', presetId: 'preset_b', el: btnPresetB });
      if (btnPresetCustom) this.controlsNavItems.push({ kind: 'preset', presetId: 'custom', el: btnPresetCustom });

      actions.forEach((act) => {
        const isWaiting = this.awaitingKeyAction === act.key;
        const boundCode = scheme[act.key];
        const row = document.createElement('div');
        row.className = `control-action-row${isWaiting ? ' waiting' : ''}`;
        row.dataset.action = act.key;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'control-action-label';
        labelSpan.textContent = act.label;

        const rightDiv = document.createElement('div');
        rightDiv.className = 'control-action-right';

        const keyBadge = document.createElement('span');
        keyBadge.className = `control-key-badge${isWaiting ? ' waiting' : !boundCode ? ' unassigned' : ''}`;
        keyBadge.textContent = isWaiting
          ? 'Esperando tecla...'
          : boundCode
          ? global.Input && typeof global.Input.formatKeyCode === 'function'
            ? global.Input.formatKeyCode(boundCode, false)
            : boundCode
          : 'Sin asignar';

        const rebindBtn = document.createElement('button');
        rebindBtn.type = 'button';
        rebindBtn.className = 'control-rebind-btn';
        rebindBtn.textContent = isWaiting ? 'ESC Cancelar' : 'Cambiar';

        rightDiv.appendChild(keyBadge);
        rightDiv.appendChild(rebindBtn);
        row.appendChild(labelSpan);
        row.appendChild(rightDiv);

        const navIdx = this.controlsNavItems.length;
        row.addEventListener('click', () => {
          this.controlsCursor = navIdx;
          if (isWaiting) {
            this.cancelKeyRebind();
          } else {
            this.startKeyRebind(act.key);
          }
        });

        listEl.appendChild(row);
        this.controlsNavItems.push({ kind: 'action', actionKey: act.key, el: row });
      });

      this.refreshControlsFocus();
    }

    refreshControlsFocus() {
      if (!Array.isArray(this.controlsNavItems) || !this.controlsNavItems.length) return;
      this.controlsCursor = Math.max(
        0,
        Math.min(this.controlsNavItems.length - 1, this.controlsCursor | 0)
      );
      document.querySelectorAll('#settings-modal .kb-focus').forEach((n) => n.classList.remove('kb-focus'));
      const item = this.controlsNavItems[this.controlsCursor];
      if (item && item.el) {
        item.el.classList.add('kb-focus');
        if (typeof item.el.scrollIntoView === 'function') {
          try {
            item.el.scrollIntoView({ block: 'nearest' });
          } catch (e) {}
        }
      }
    }

    moveControlsCursor(delta) {
      if (!this.controlsNavItems.length || this.awaitingKeyAction) return;
      const len = this.controlsNavItems.length;
      const cur = this.controlsCursor | 0;
      if (cur >= 1 && cur <= 3) {
        this.controlsCursor = delta > 0 ? Math.min(4, len - 1) : 0;
      } else {
        let next = ((cur + delta) % len + len) % len;
        if (next >= 1 && next <= 3) {
          next = delta < 0 ? 1 : 1;
        }
        this.controlsCursor = next;
      }
      this.refreshControlsFocus();
      this.sound.menuSelect();
    }

    moveControlsHorizontal(delta) {
      if (!this.controlsNavItems.length || this.awaitingKeyAction) return;
      const cur = this.controlsCursor | 0;
      if (cur >= 1 && cur <= 3) {
        const rel = cur - 1;
        this.controlsCursor = 1 + (((rel + delta) % 3 + 3) % 3);
        this.refreshControlsFocus();
        this.sound.menuSelect();
      } else if (cur === 0 && delta > 0) {
        this.controlsCursor = 1;
        this.refreshControlsFocus();
        this.sound.menuSelect();
      }
    }

    activateControlsSubmenuItem() {
      const item = this.controlsNavItems[this.controlsCursor];
      if (!item) return;
      if (item.kind === 'close') {
        this.closeControlsSubmenu(true);
      } else if (item.kind === 'preset') {
        this.selectControlPreset(item.presetId);
      } else if (item.kind === 'action') {
        this.startKeyRebind(item.actionKey);
      }
    }

    selectControlPreset(presetId) {
      this.awaitingKeyAction = null;
      const updated =
        global.Input && typeof global.Input.applyPreset === 'function'
          ? global.Input.applyPreset(presetId)
          : this.inputManager.applyPreset(presetId);
      this.controlsStatusWarning = false;
      this.controlsStatusMsg = `✅ Perfil [${this.getControlProfileLabel(updated.profile)}] activado y guardado.`;
      this.syncControlHintsUI();
      this.renderControlsSubmenu();
      this.sound.menuSelect();
    }

    startKeyRebind(actionKey) {
      this.awaitingKeyAction = actionKey;
      this.controlsStatusWarning = false;
      this.renderControlsSubmenu();
      this.sound.menuSelect();
    }

    cancelKeyRebind() {
      this.awaitingKeyAction = null;
      this.controlsStatusWarning = false;
      this.controlsStatusMsg = 'Reasignación cancelada. Ninguna tecla fue modificada.';
      this.renderControlsSubmenu();
      this.sound.menuSelect();
    }

    completeKeyRebind(code) {
      const actionKey = this.awaitingKeyAction;
      if (!actionKey) return;
      this.awaitingKeyAction = null;
      const result =
        global.Input && typeof global.Input.rebindAction === 'function'
          ? global.Input.rebindAction(actionKey, code)
          : this.inputManager.rebindAction(actionKey, code);

      const actions =
        global.Input && typeof global.Input.getControlActions === 'function'
          ? global.Input.getControlActions()
          : this.inputManager.getControlActions();
      const targetAct = actions.find((a) => a.key === actionKey);
      const targetName = targetAct ? targetAct.label : actionKey;
      const keyName =
        global.Input && typeof global.Input.formatKeyCode === 'function'
          ? global.Input.formatKeyCode(code, false)
          : code;

      if (result && result.clearedAction) {
        const clearedObj = result.clearedAction;
        const clearedKey = typeof clearedObj === 'string' ? clearedObj : clearedObj.key;
        const conflictAct = clearedKey ? actions.find((a) => a.key === clearedKey) : null;
        const conflictName =
          (conflictAct && conflictAct.label) ||
          (typeof clearedObj === 'object' && clearedObj.label) ||
          clearedKey ||
          '';
        this.controlsStatusWarning = true;
        this.controlsStatusMsg = `⚠️ "${targetName}" -> ${keyName}. Conflicto resuelto: "${conflictName}" quedó temporalmente sin asignar.`;
      } else {
        this.controlsStatusWarning = false;
        this.controlsStatusMsg = `✅ "${targetName}" asignado a ${keyName} ([PERSONALIZADO] guardado).`;
      }

      this.syncControlHintsUI();
      this.renderControlsSubmenu();
      this.sound.menuSelect();
    }

    openSettingsModal() {
      const modal = document.getElementById('settings-modal');
      this.state = 'settings';
      this.settingsSubmenu = 'main';
      this.awaitingKeyAction = null;
      this.settingsCursor = 1; // Inicia en el primer slider de volumen
      const sliderBgm = document.getElementById('slider-bgm');
      const sliderSfx = document.getElementById('slider-sfx');
      const valBgm = document.getElementById('val-bgm');
      const valSfx = document.getElementById('val-sfx');
      const bgmPct = this.sound.getBgmVolumePercent();
      const sfxPct = this.sound.getSfxVolumePercent();
      if (sliderBgm) sliderBgm.value = String(bgmPct);
      if (sliderSfx) sliderSfx.value = String(sfxPct);
      if (valBgm) valBgm.textContent = `${bgmPct}%`;
      if (valSfx) valSfx.textContent = `${sfxPct}%`;
      this.updateSettingsHeaderForView();
      this.syncControlHintsUI();
      this.renderJukeboxList();
      if (modal) {
        modal.classList.remove('hidden');
      }
    }

    closeSettingsModal(playSound = true) {
      this.awaitingKeyAction = null;
      this.settingsSubmenu = 'main';
      this.updateSettingsHeaderForView();
      const modal = document.getElementById('settings-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
      if (this.sound) {
        if (typeof this.sound.stopJukeboxTrack === 'function') {
          this.sound.stopJukeboxTrack(!this.sound.muted);
        }
        if (playSound) {
          this.sound.menuSelect();
        }
      }
      if (this.state === 'settings') {
        this.state = 'menu';
      }
    }

    triggerScreenShake(duration = 0.3, intensity = 7) {
      this.screenShakeTimer = Math.max(this.screenShakeTimer, duration);
      this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    }

    isTouchDevice() {
      return this.inputManager.isTouchDevice();
    }

    applyInputMode() {
      this.inputManager.applyInputMode();
    }

    lockLandscapeOrientation() {
      this.inputManager.lockLandscapeOrientation();
    }

    getLogicalPointerCoords(clientX, clientY) {
      return this.inputManager.getLogicalPointerCoords(clientX, clientY);
    }

    /**
     * Botón derecho del rombo táctil: activa la Habilidad Especial [A] o La Tina [S].
     */
    triggerDynamicMobileSkill() {
      this.invalidateStartCheat();
      if (!this.player) return;
      const swarmDanger =
        this.swarmAlertTimer > 0 ||
        (this.swarmPigeons && this.swarmPigeons.length > 0) ||
        (this.swarmHorneros && this.swarmHorneros.length > 0);
      const tinaReady = this.tina && this.tina.growlCooldown <= 0;
      const leaderSkillReady = this.player.abilityCooldown <= 0;

      if (swarmDanger && tinaReady) {
        this.input.tinaPressed = true;
      } else if (this.player.characterKey === 'andrea') {
        if (leaderSkillReady) {
          this.input.skillPressed = true;
        } else if (tinaReady) {
          this.input.tinaPressed = true;
        } else {
          this.input.skillPressed = true;
        }
      } else {
        if (!this.player.onGround && leaderSkillReady) {
          this.input.skillPressed = true;
        } else if (tinaReady) {
          this.input.tinaPressed = true;
        } else {
          this.input.skillPressed = true;
        }
      }
    }

    handleCanvasPointerMove(cx, cy) {
      if (this.state === 'map' && this.mapScreen && typeof this.mapScreen.handlePointerMove === 'function') {
        this.mapScreen.handlePointerMove(cx, cy);
      }
    }

    handleCanvasPointer(cx, cy) {
      if (this.state === 'splash') {
        this.enterMenuFromSplash();
        return;
      }
      if (this.state === 'playing') {
        this.invalidateStartCheat();
        if (
          cx >= ITEM_BOX_RECT.x - 10 &&
          cx <= ITEM_BOX_RECT.x + ITEM_BOX_RECT.w + 10 &&
          cy >= 0 &&
          cy <= ITEM_BOX_RECT.y + ITEM_BOX_RECT.h + 10
        ) {
          this.swapReserveItem();
        }
      } else if (this.state === 'menu') {
        // Pill compacto superior de Tabla de Récords (Top 10)
        if (cx >= 310 && cx <= 650 && cy >= 78 && cy <= 104) {
          this.sound.menuSelect();
          this.sound.playMenuConfirmChord(true);
          this.openLeaderboardModal();
          return;
        }
        // Tarjeta izquierda: Nico
        if (cx >= 175 && cx <= 440 && cy >= 110 && cy <= 264) {
          this.selectedCharacter = 'nico';
          this.sound.menuSelect();
          this.sound.playMenuConfirmChord(true);
          return;
        }
        // Tarjeta derecha: Andrea
        if (cx >= 520 && cx <= 785 && cy >= 110 && cy <= 264) {
          this.selectedCharacter = 'andrea';
          this.sound.menuSelect();
          this.sound.playMenuConfirmChord(true);
          return;
        }
        // Contenedor horizontal inferior de La Tina
        if (cx >= 175 && cx <= 785 && cy >= 272 && cy <= 326) {
          this.sound.playDoubleBarkSample();
          return;
        }
        // Opciones limpias del menú (cada una: x=290..670, y = 336 + i*32, alto 28)
        if (cx >= 290 && cx <= 670 && cy >= 336) {
          const optIdx = Math.floor((cy - 336) / 32);
          const withinBox = cy - 336 - optIdx * 32 <= 28;
          if (optIdx >= 0 && optIdx <= 5 && withinBox) {
            this.menuCursor = optIdx;
            this.activateMenuOption();
            return;
          }
        }
      } else if (this.state === 'save_slots') {
        this.handleSaveSlotsPointer(cx, cy);
      } else if (this.state === 'map') {
        this.mapScreen.handlePointer(cx, cy);
      } else if (this.state === 'controls') {
        this.state = 'menu';
        this.sound.menuSelect();
      } else if (this.state === 'leaderboard') {
        this.closeLeaderboardModal(true);
      } else if (this.state === 'level_clear') {
        this.confirmLevelClear();
      } else if (this.state === 'gameover') {
        if (this.gameOverPhase === 'initials') {
          // 3 cajas Arcade centradas: bx = 362 + i * 86, w = 64
          for (let i = 0; i < 3; i++) {
            const bx = 362 + i * 86;
            if (cx >= bx && cx <= bx + 64) {
              if (cy >= 230 && cy <= 262) {
                this.arcadeLetterIdx = i;
                this.stepArcadeInitial(1);
                return;
              }
              if (cy > 262 && cy <= 332) {
                this.arcadeLetterIdx = i;
                this.sound.menuSelect();
                return;
              }
              if (cy > 332 && cy <= 364) {
                this.arcadeLetterIdx = i;
                this.stepArcadeInitial(-1);
                return;
              }
            }
          }
          if (cy >= 382 && cy <= 426) {
            if (cx >= 204 && cx <= 470) {
              this.confirmArcadeInitials();
            } else if (cx >= 486 && cx <= 756) {
              this.retryCurrentZone();
            }
          }
        } else {
          if (cy >= 436 && cy <= 480) {
            if (cx >= 144 && cx <= 374) {
              this.returnToLastPlayedMap();
            } else if (cx >= 386 && cx <= 610) {
              this.retryCurrentZone();
            } else if (cx >= 622 && cx <= 816) {
              this.lives = 3;
              this.savedHearts = 3;
              this.syncHeartsToSlot(3);
              this.returnToMenu(false);
            }
          } else {
            this.returnToLastPlayedMap();
          }
        }
      } else if (this.state === 'victory') {
        if (cy >= 310 && cy <= 355) {
          this.startNewGame();
        } else if (cy > 355 && cy <= 405) {
          this.returnToMenu();
        }
      } else if (this.state === 'paused') {
        if (cy >= 220 && cy <= 268) {
          this.resumeGame();
        } else if (cy > 268 && cy <= 316) {
          if (this.sound && typeof this.sound.stopMusic === 'function') this.sound.stopMusic();
          this.loadLevel(this.levelIndex, this.preserveSessionHearts());
          this.state = 'playing';
          if (this.sound && typeof this.sound.startMusic === 'function') {
            this.sound.startMusic(this.getActiveLevelMusicTheme(), this.getActiveLevelMusicMeta());
          }
        } else if (cy > 316 && cy <= 364) {
          this.returnToLastPlayedMap();
        } else if (cy > 364 && cy <= 415) {
          this.returnToMenu();
        }
      }
    }

    // ========================================================================
    // PANTALLA DE SELECCIÓN DE PARTIDA (3 RANURAS ESTILO SUPER MARIO WORLD)
    // ========================================================================
    openSaveSlots(intent = 'play') {
      this.slotModalIntent = intent;
      this.slotCursor = this.activeSlotId ? this.activeSlotId - 1 : 0;
      this.slotDeleteFocus = false;
      this.deleteConfirmSlot = null;
      this.deleteConfirmCursor = 1;
      this.state = 'save_slots';
      if (!this.sound.menuMusicPlaying) {
        this.sound.playMenuMusic();
      }
      this.sound.menuSelect();
      this.sound.playMenuConfirmChord(true);
    }

    closeSaveSlots() {
      this.slotDeleteFocus = false;
      this.deleteConfirmSlot = null;
      this.state = 'menu';
      this.highScore = this.loadHighScore();
      if (!this.sound.menuMusicPlaying) {
        this.sound.playMenuMusic();
      }
      this.sound.menuSelect();
    }

    selectSaveSlot(slotId) {
      if (slotId < 1 || slotId > 3) return;
      const existing = global.SaveSlots ? global.SaveSlots.getSlot(slotId) : null;
      this.activeSlotId = slotId;

      if (!existing) {
        // Slot vacío: inicializa partida nueva y entra directo al Nivel 1 de Barcelona (mapa cerrado)
        global.WorldProgress.setActiveSlot(slotId, { createIfMissing: true });
        this.startNewGameFromSlot(slotId);
        return;
      }

      // Slot existente: carga su progreso independiente y lleva al Mapa General
      global.WorldProgress.setActiveSlot(slotId, { createIfMissing: false });
      this.score = 0;
      this.totalCoins = existing.totalCoins || 0;
      this.runCoins = 0;
      const savedLives = Number(
        typeof global.WorldProgress.getLives === 'function' ? global.WorldProgress.getLives() : existing.lives
      );
      this.lives = Number.isFinite(savedLives) && savedLives >= 1 ? Math.min(99, Math.floor(savedLives)) : 3;
      const savedHearts = Number(
        typeof global.WorldProgress.getHearts === 'function' ? global.WorldProgress.getHearts() : existing.hearts
      );
      this.savedHearts =
        Number.isFinite(savedHearts) && savedHearts >= 1 ? Math.max(1, Math.min(3, Math.floor(savedHearts))) : 3;
      this.player = null;
      this.survivalRiskMode = false;
      this.setPostGameOverActive(false);
      this.carriedPowerUp = null;
      this.reservePowerUp = null;
      this.lizardEventConsumed = false;
      this.gaudiLizardEventResolved = false;
      const spawnTarget =
        typeof global.WorldProgress.getLastPlayedTarget === 'function'
          ? global.WorldProgress.getLastPlayedTarget()
          : {
              continent: 'spain',
              cityKey: global.WorldProgress.getLastPlayedCityKey(),
              zoneNum: global.WorldProgress.getLastPlayedZone(),
              mapLevel: 'city'
            };
      this.highScore = global.WorldProgress.getSlotMaxDisplayScore();
      this.cityKey = spawnTarget.cityKey;
      this.lockLandscapeOrientation();
      this.sound.playMenuConfirmChord(false);
      this.openMap({
        level: spawnTarget.mapLevel,
        worldNode: spawnTarget.continent,
        cursorCity: spawnTarget.cityKey,
        cursorZone: spawnTarget.zoneNum
      });
    }

    requestDeleteSlot(slotId) {
      const existing = global.SaveSlots ? global.SaveSlots.getSlot(slotId) : null;
      if (!existing) return;
      this.deleteConfirmSlot = slotId;
      this.deleteConfirmCursor = 1;
      this.sound.menuSelect();
    }

    cancelDeleteSlot() {
      this.deleteConfirmSlot = null;
      this.sound.menuSelect();
    }

    confirmDeleteSlot() {
      const slotId = this.deleteConfirmSlot;
      this.deleteConfirmSlot = null;
      this.slotDeleteFocus = false;
      if (!slotId) return;
      if (global.SaveSlots) {
        global.SaveSlots.deleteSlot(slotId);
      } else {
        try {
          localStorage.removeItem(`aventura_world_slot_${slotId}`);
        } catch (e) {}
      }
      if (this.activeSlotId === slotId) {
        this.activeSlotId = null;
        if (global.WorldProgress) global.WorldProgress.clearActiveSlot();
        this.score = 0;
        this.totalCoins = 0;
      }
      this.highScore = this.loadHighScore();
      this.sound.menuSelect();
    }

    handleSaveSlotsPointer(cx, cy) {
      if (this.deleteConfirmSlot !== null) {
        if (cx >= 265 && cx <= 462 && cy >= 292 && cy <= 340) {
          this.confirmDeleteSlot();
          return;
        }
        if (cx >= 498 && cx <= 695 && cy >= 292 && cy <= 340) {
          this.cancelDeleteSlot();
          return;
        }
        if (cx < 225 || cx > 735 || cy < 165 || cy > 365) {
          this.cancelDeleteSlot();
        }
        return;
      }

      // Botón VOLVER AL MENÚ
      if (cx >= 340 && cx <= 620 && cy >= 426 && cy <= 466) {
        this.closeSaveSlots();
        return;
      }

      // 3 tarjetas horizontales: y = 126 + i * 96, h = 82
      for (let i = 0; i < 3; i++) {
        const cardY = 126 + i * 96;
        if (cy >= cardY && cy <= cardY + 82) {
          const slotId = i + 1;
          const summary = global.SaveSlots ? global.SaveSlots.getSummary(slotId) : null;
          if (summary && cx >= 716 && cx <= 818) {
            this.slotCursor = i;
            this.requestDeleteSlot(slotId);
            return;
          }
          if (cx >= 142 && cx <= (summary ? 704 : 818)) {
            this.slotCursor = i;
            this.selectSaveSlot(slotId);
            return;
          }
        }
      }

      // Clic fuera del modal: volver
      if (cx < 110 || cx > 850 || cy < 38 || cy > 502) {
        this.closeSaveSlots();
      }
    }

    activateMenuOption() {
      this.sound.init();
      this.sound.resume();
      if (this.menuCursor === 0) {
        this.openSaveSlots('play');
      } else if (this.menuCursor === 1) {
        this.selectedCharacter = this.selectedCharacter === 'nico' ? 'andrea' : 'nico';
        this.sound.menuSelect();
        this.sound.playMenuConfirmChord(true);
      } else if (this.menuCursor === 2) {
        this.sound.menuSelect();
        this.sound.playMenuConfirmChord(true);
        this.state = 'controls';
      } else if (this.menuCursor === 3) {
        this.sound.menuSelect();
        this.sound.playMenuConfirmChord(true);
        this.openLeaderboardModal();
      } else if (this.menuCursor === 4) {
        if (!this.activeSlotId) {
          this.openSaveSlots('map');
          return;
        }
        this.lockLandscapeOrientation();
        this.returnToLastPlayedMap();
        this.sound.playMenuConfirmChord(false);
      } else if (this.menuCursor === 5) {
        this.sound.menuSelect();
        this.sound.playMenuConfirmChord(true);
        this.openSettingsModal();
      }
    }

    startNewGameFromSlot(slotId) {
      this.activeSlotId = slotId;
      global.WorldProgress.setActiveSlot(slotId, { createIfMissing: true });
      this.lockLandscapeOrientation();
      this.sound.stopMenuMusic();
      this.sound.stopAllSounds();
      this.sound.init();
      this.sound.resume();
      this.sound.playMenuConfirmChord(false);
      this.cityKey = 'barcelona';
      this.score = 0;
      this.levelStartScore = 0;
      this.totalCoins = 0;
      this.runCoins = 0;
      this.lives = 3;
      this.syncLivesToSlot();
      this.savedHearts = 3;
      this.syncHeartsToSlot(3);
      this.survivalRiskMode = false;
      this.tookDamageInZone = false;
      this.setPostGameOverActive(false);
      this.totalTime = 0;
      this.levelIndex = 0;
      this.lizardEventConsumed = false;
      this.gaudiLizardEventResolved = false;
      this.player = null;
      this.clearRunEquipment();
      this.resetLevelBoneTracking();
      this.loadLevel(0, 3);
      this.state = 'playing';
      this.sound.startMusic(this.getActiveLevelMusicTheme(), this.getActiveLevelMusicMeta());
    }

    startNewGame() {
      if (!this.activeSlotId && this.state === 'menu') {
        this.openSaveSlots('play');
        return;
      }
      if (this.state === 'gameover') {
        this.retryCurrentZone();
        return;
      }
      this.lockLandscapeOrientation();
      this.sound.stopMenuMusic();
      this.sound.stopAllSounds();
      this.sound.init();
      this.sound.resume();
      this.sound.playMenuConfirmChord(false);
      this.cityKey = 'barcelona';
      this.score = 0;
      this.levelStartScore = 0;
      if (!this.activeSlotId) {
        this.totalCoins = 0;
      }
      this.runCoins = 0;
      this.lives = 3;
      this.syncLivesToSlot();
      this.savedHearts = 3;
      this.syncHeartsToSlot(3);
      this.survivalRiskMode = false;
      this.tookDamageInZone = false;
      this.setPostGameOverActive(false);
      this.totalTime = 0;
      this.levelIndex = 0;
      this.lizardEventConsumed = false;
      this.gaudiLizardEventResolved = false;
      this.player = null;
      this.clearRunEquipment();
      this.resetLevelBoneTracking();
      this.loadLevel(0, 3);
      this.state = 'playing';
      this.sound.startMusic(this.getActiveLevelMusicTheme(), this.getActiveLevelMusicMeta());
    }

    // ========================================================================
    // MAPA GENERAL (OVERWORLD): flujo Juego -> Puntajes -> Mapa -> Ciudad
    // ========================================================================
    normalizeCityKey(cityKey) {
      if (cityKey === 'canary_islands') return 'canarias';
      if (cityKey === 'mallorca') return 'palma';
      if (cityKey === 'bsas' || cityKey === 'buenos_aires') return 'buenosaires';
      return cityKey || 'barcelona';
    }

    getActiveLevelMusicTheme() {
      if (this.levelData && this.levelData.musicTheme) return this.levelData.musicTheme;
      const key = this.normalizeCityKey(this.cityKey);
      const cityThemeMap = {
        barcelona: 'es_barcelona',
        madrid: 'es_madrid',
        palma: 'es_palma',
        canarias: 'es_canarias',
        buenosaires: 'ba_caminito',
        rosario: 'ro_trova',
        cordoba: 'co_cuarteto',
        ushuaia: 'ush_centro',
        chile_santiago: 'ch_santiago_plaza',
        chile_vina: 'ch_vina_reloj',
        chile_atacama: 'ch_atacama_luna',
        chile_pascua: 'ch_pascua_tongariki'
      };
      return cityThemeMap[key] || 'level';
    }

    getActiveLevelMusicMeta() {
      const levels = typeof this.getCityLevels === 'function' ? this.getCityLevels() : [];
      const zoneData = levels && levels[this.levelIndex] ? levels[this.levelIndex] : null;
      return {
        cityKey: this.normalizeCityKey(this.cityKey),
        zoneNum: (this.levelIndex | 0) + 1,
        bgmTrack: zoneData && zoneData.bgmTrack ? zoneData.bgmTrack : null
      };
    }

    getCityLevels() {
      const key = this.normalizeCityKey(this.cityKey);
      const defs = global.CITY_DEFS || {};
      const def = defs[key] || defs[this.cityKey];
      if (def && Array.isArray(def.levels) && def.levels.length) return def.levels;
      if (key === 'ushuaia' && Array.isArray(global.USHUAIA_LEVELS) && global.USHUAIA_LEVELS.length) {
        return global.USHUAIA_LEVELS;
      }
      if (key === 'chile_santiago' && Array.isArray(global.CHILE_SANTIAGO_LEVELS) && global.CHILE_SANTIAGO_LEVELS.length) {
        return global.CHILE_SANTIAGO_LEVELS;
      }
      if (key === 'chile_vina' && Array.isArray(global.CHILE_VINA_LEVELS) && global.CHILE_VINA_LEVELS.length) {
        return global.CHILE_VINA_LEVELS;
      }
      if (key === 'chile_atacama' && Array.isArray(global.CHILE_ATACAMA_LEVELS) && global.CHILE_ATACAMA_LEVELS.length) {
        return global.CHILE_ATACAMA_LEVELS;
      }
      if (key === 'chile_pascua' && Array.isArray(global.CHILE_PASCUA_LEVELS) && global.CHILE_PASCUA_LEVELS.length) {
        return global.CHILE_PASCUA_LEVELS;
      }
      if (key === 'rosario' && Array.isArray(global.ROSARIO_LEVELS) && global.ROSARIO_LEVELS.length) {
        return global.ROSARIO_LEVELS;
      }
      if (key === 'cordoba' && Array.isArray(global.CORDOBA_LEVELS) && global.CORDOBA_LEVELS.length) {
        return global.CORDOBA_LEVELS;
      }
      if (key === 'buenosaires' && Array.isArray(global.BUENOS_AIRES_LEVELS) && global.BUENOS_AIRES_LEVELS.length) {
        return global.BUENOS_AIRES_LEVELS;
      }
      if (key === 'canarias' && Array.isArray(global.CANARIAS_LEVELS) && global.CANARIAS_LEVELS.length) {
        return global.CANARIAS_LEVELS;
      }
      if (key === 'palma' && Array.isArray(global.PALMA_LEVELS) && global.PALMA_LEVELS.length) {
        return global.PALMA_LEVELS;
      }
      if (key === 'madrid' && Array.isArray(global.MADRID_LEVELS) && global.MADRID_LEVELS.length) {
        return global.MADRID_LEVELS;
      }
      return Array.isArray(global.LEVELS) ? global.LEVELS : [];
    }

    clearTransientInput() {
      if (this.inputManager) {
        this.inputManager.clearTransient();
        return;
      }
      this.input.left = false;
      this.input.right = false;
      this.input.up = false;
      this.input.down = false;
      this.input.analogX = 0;
      this.input.analogY = 0;
      this.input.jumpHeld = false;
      this.input.jumpPressed = false;
      this.input.downPressed = false;
      this.input.skillPressed = false;
      this.input.tinaPressed = false;
      this.input.shootPressed = false;
      this.input.reservePressed = false;
    }

    /**
     * Abre el Mapa General conservando de forma continua la música zen si ya sonaba
     * o limpiando antes la música/fanfarria de un nivel recién completado.
     */
    openMap(opts = {}) {
      if (this.sound && typeof this.sound.stopBiplaneAmbience === 'function') {
        this.sound.stopBiplaneAmbience();
      }
      this.isBiplaneFlightCheat = false;
      this.biplaneFlightCheat = null;
      this.airTourBuffer = '';
      this.ghostBuffer = '';
      if (this.sound.menuMusicPlaying && !this.sound.muted) {
        this.sound.stopMusic();
        if (typeof this.sound.stopFanfareAudio === 'function') {
          this.sound.stopFanfareAudio();
        }
      } else {
        this.sound.stopAllSounds();
      }
      this.clearTransientInput();
      this.state = 'map';
      if (this.sound && typeof this.sound.preloadCityAudio === 'function') {
        this.sound.preloadCityAudio(opts.cursorCity || this.cityKey);
      }
      this.mapScreen.open(opts);
      if (opts && opts.worldUnlockAnim) {
        this.sound.stopMenuMusic();
      } else {
        const desiredMode =
          typeof this.mapScreen.getDesiredMenuMusicMode === 'function'
            ? this.mapScreen.getDesiredMenuMusicMode()
            : 'zen';
        this.sound.playMenuMusic(desiredMode);
      }
    }

    /** Guarda las vidas actuales en la ranura activa de localStorage. */
    syncLivesToSlot() {
      const clean = Math.max(1, Math.min(99, Math.floor(Number(this.lives) || 3)));
      if (global.WorldProgress && typeof global.WorldProgress.setLives === 'function') {
        global.WorldProgress.setLives(clean);
      }
      return clean;
    }

    /** Preserva y sincroniza las vidas actuales en memoria y en el slot (sin resetear a 3). */
    preserveSessionLives() {
      const currentLives = Number(this.lives);
      const storedLives =
        global.WorldProgress && typeof global.WorldProgress.getLives === 'function'
          ? global.WorldProgress.getLives()
          : 3;
      this.lives =
        Number.isFinite(currentLives) && currentLives >= 1
          ? Math.min(99, Math.floor(currentLives))
          : storedLives;
      this.syncLivesToSlot();
      return this.lives;
    }

    /** Guarda los corazones actuales (1..3) en memoria y en la ranura activa. */
    syncHeartsToSlot(val = null) {
      const raw =
        val !== null && val !== undefined
          ? Number(val)
          : (this.player && Number.isFinite(this.player.hearts) && this.player.hearts >= 1
              ? this.player.hearts
              : (Number.isFinite(this.savedHearts) && this.savedHearts >= 1 ? this.savedHearts : 3));
      const clean = Number.isFinite(raw) && raw >= 1 ? Math.max(1, Math.min(3, Math.floor(raw))) : 3;
      this.savedHearts = clean;
      if (global.WorldProgress && typeof global.WorldProgress.setHearts === 'function') {
        global.WorldProgress.setHearts(clean);
      }
      return clean;
    }

    /** Preserva y sincroniza los corazones actuales (1..3) sin restaurar a 3 al cambiar de nivel/mapa. */
    preserveSessionHearts() {
      const playerHearts =
        this.player && Number.isFinite(this.player.hearts) && this.player.hearts >= 1
          ? this.player.hearts
          : null;
      const sessionHearts =
        Number.isFinite(this.savedHearts) && this.savedHearts >= 1 ? this.savedHearts : null;
      const storedHearts =
        global.WorldProgress && typeof global.WorldProgress.getHearts === 'function'
          ? global.WorldProgress.getHearts()
          : 3;
      const picked = playerHearts !== null ? playerHearts : (sessionHearts !== null ? sessionHearts : storedHearts);
      return this.syncHeartsToSlot(picked);
    }

    /** Suma +1 VIDA y sincroniza inmediatamente con la ranura guardada. */
    grantExtraLife() {
      const current = Number(this.lives);
      const base = Number.isFinite(current) && current >= 1 ? Math.floor(current) : 3;
      this.lives = Math.min(99, base + 1);
      this.syncLivesToSlot();
      return this.lives;
    }

    returnToLastPlayedMap() {
      this.closeSettingsModal(false);
      if (this.sound) {
        if (typeof this.sound.setHurryUp === 'function') this.sound.setHurryUp(false);
        if (typeof this.sound.stopAnnouncementAudio === 'function') this.sound.stopAnnouncementAudio();
      }
      this.clearTransientInput();
      this.preserveSessionLives();
      this.preserveSessionHearts();
      this.survivalRiskMode = false;
      this.setPostGameOverActive(false);
      this.resetLevelBoneTracking();
      if (this.player) this.player.state = 'active';
      if (this.partner) this.partner.state = 'active';
      if (this.tina) this.tina.state = 'active';
      const target =
        global.WorldProgress && typeof global.WorldProgress.getLastPlayedTarget === 'function'
          ? global.WorldProgress.getLastPlayedTarget()
          : {
              continent: 'spain',
              cityKey: this.normalizeCityKey(this.cityKey || 'barcelona'),
              zoneNum: Math.max(1, (this.levelIndex | 0) + 1),
              mapLevel: 'city'
            };
      this.cityKey = target.cityKey;
      this.openMap({
        level: target.mapLevel || 'city',
        worldNode: target.continent,
        cursorCity: target.cityKey,
        cursorZone: target.zoneNum
      });
    }

    isPostGameOverActive() {
      return global.WorldProgress ? global.WorldProgress.isPostGameOver() : !!this.postGameOverFallback;
    }

    isCityCompleted(cityKey) {
      const normalized = this.normalizeCityKey(cityKey || this.cityKey || 'barcelona');
      if (global.WorldProgress) {
        return typeof global.WorldProgress.isCityCompleted === 'function'
          ? global.WorldProgress.isCityCompleted(normalized)
          : global.WorldProgress.isCompleted(normalized);
      }
      return false;
    }

    setPostGameOverActive(flag) {
      this.postGameOverFallback = !!flag;
      if (global.WorldProgress) {
        global.WorldProgress.setPostGameOver(!!flag);
      }
    }

    clearRunEquipment() {
      this.carriedPowerUp = null;
      this.reservePowerUp = null;
      if (this.player) {
        this.player.clearAllPowerUps();
      }
    }

    awardRunCoins(count = 1) {
      this.runCoins = Math.max(0, (this.runCoins | 0) + (count | 0));
      while (this.runCoins >= 100) {
        this.runCoins -= 100;
        if (this.lives < 5) {
          this.lives = Math.min(5, this.lives + 1);
          this.syncLivesToSlot();
        }
        if (this.sound && typeof this.sound.oneUp === 'function') {
          this.sound.oneUp();
        }
        if (this.particles && this.player) {
          this.particles.Burst(this.player.x + this.player.w * 0.5, this.player.y, '#4ade80', 22);
          this.particles.FloatingText(this.player.x - 16, this.player.y - 18, '+1 VIDA', '#4ade80');
        }
      }
    }

    getGoldenBoneKey(cityKey, levelIndex, col) {
      const city = this.normalizeCityKey(cityKey || this.cityKey || 'barcelona');
      const idx = Math.max(0, levelIndex | 0);
      const bx = Math.round(Number(col && col.x) || 0);
      const rawY = col && Number.isFinite(col.baseY) ? col.baseY : (col && col.y);
      const by = Math.round(Number(rawY) || 0);
      return `${city}:${idx}:${bx}:${by}`;
    }

    resetLevelBoneTracking() {
      if (this.collectedBonesInRun && typeof this.collectedBonesInRun.clear === 'function') {
        this.collectedBonesInRun.clear();
      } else {
        this.collectedBonesInRun = new Set();
      }
    }

    /** Reproduce la fanfarria y destellos dorados al recoger cualquier huesito dorado secreto. */
    emitGoldenBonePickupEffect(cx, cy, label) {
      if (this.sound) {
        if (typeof this.sound.playSecret1Up === 'function') {
          this.sound.playSecret1Up();
        } else if (typeof this.sound.play1Up === 'function') {
          this.sound.play1Up();
        } else if (typeof this.sound.oneUp === 'function') {
          this.sound.oneUp();
        }
      }
      if (this.particles) {
        this.particles.Burst(cx, cy, '#fde047', 30);
        this.particles.Burst(cx, cy, '#fbbf24', 20);
        this.particles.Burst(cx, cy, '#fef08a', 12);
        for (let sp = 0; sp < 8; sp++) {
          const ang = (Math.PI * 2 * sp) / 8;
          this.particles.Sparkle(cx + Math.cos(ang) * 16, cy + Math.sin(ang) * 16, '#fde047');
        }
        if (label) {
          this.particles.FloatingText(cx - 55, cy - 29, label, '#fde047');
        }
      }
    }

    handleHiddenBlockReveal(hb, info) {
      if (!hb || !info || info.wasUsed || hb._itemSpawned) return;
      hb._itemSpawned = true;
      hb.hit = true;
      hb.used = true;
      hb.empty = true;
      if (this.collectedBonesInRun && hb.secretKey && this.collectedBonesInRun.has(hb.secretKey)) {
        return;
      }
      const itemType = info.item || 'golden_bone';
      const spawned = new global.Entities.Collectible(info.spawnX, info.spawnY, itemType, false);
      if (itemType === 'golden_bone' || itemType === '1up_bone') {
        spawned.secretKey = hb.secretKey || this.getGoldenBoneKey(this.cityKey, this.levelIndex, hb);
      }
      if (itemType === 'tina_golden_bone' && typeof spawned.startHighLaunch === 'function') {
        spawned.startHighLaunch(info.spawnY, 54);
      } else if (typeof spawned.startBlockPop === 'function') {
        spawned.startBlockPop(info.spawnY, info.targetY, 0.28);
      }
      this.collectibles.push(spawned);
    }

    /** Entrar directamente a jugar una zona específica de una ciudad desbloqueada. */
    enterZone(cityKey, levelIdx = 0) {
      const normalizedKey = this.normalizeCityKey(cityKey);
      const defs = global.CITY_DEFS || {};
      const def = defs[normalizedKey] || defs[cityKey];
      const isTempLocked =
        typeof global.isCountryLocked === 'function' &&
        global.isCountryLocked((def && def.country) || normalizedKey);
      if (!def || !def.playable || isTempLocked || !global.WorldProgress.isUnlocked(normalizedKey)) return;

      this.cityKey = normalizedKey;
      const levels = this.getCityLevels();
      const maxIdx = Math.max(0, levels.length - 1);
      let targetIdx = Math.max(0, Math.min(maxIdx, Math.floor(Number(levelIdx) || 0)));
      if (global.WorldProgress && !global.WorldProgress.isZoneUnlocked(normalizedKey, targetIdx + 1)) {
        targetIdx = Math.max(0, Math.min(maxIdx, global.WorldProgress.getHighestUnlockedZone(normalizedKey) - 1));
      }

      const zoneNum = targetIdx + 1;
      // Conservar las vidas y corazones actuales de la sesión / ranura guardada (solo se resetean a 3 tras perder vida, Game Over o Partida Nueva)
      this.preserveSessionLives();
      const prevHearts = this.preserveSessionHearts();
      this.survivalRiskMode = false;
      this.tookDamageInZone = false;
      this.setPostGameOverActive(false);
      this.resetLevelBoneTracking();
      this.lizardEventConsumed = false;
      this.gaudiLizardEventResolved = false;

      this.lockLandscapeOrientation();
      this.sound.stopMenuMusic();
      this.sound.stopAllSounds();
      this.sound.init();
      this.sound.resume();
      this.sound.mapEnter();
      this.clearTransientInput();
      if (global.WorldProgress) {
        global.WorldProgress.setLastPlayedLocation(normalizedKey, zoneNum);
      }
      this.levelIndex = targetIdx;
      this.loadLevel(this.levelIndex, prevHearts);
      this.state = 'playing';
      this.sound.startMusic(this.getActiveLevelMusicTheme(), this.getActiveLevelMusicMeta());
    }

    /** Reintentar la zona actual tras Game Over con 3 vidas completas, 3 corazones y puntaje en 0. */
    retryCurrentZone() {
      const city = this.normalizeCityKey(this.cityKey || 'barcelona');
      const idx = Math.max(0, this.levelIndex | 0);
      this.score = 0;
      this.levelStartScore = 0;
      this.lives = 3;
      this.syncLivesToSlot();
      if (this.player) this.player.hearts = 3;
      this.savedHearts = 3;
      this.syncHeartsToSlot(3);
      this.survivalRiskMode = false;
      this.tookDamageInZone = false;
      this.lizardEventConsumed = false;
      this.gaudiLizardEventResolved = false;
      this.enterZone(city, idx);
    }

    /** Entrar a jugar una ciudad desde el mapa (abre en la última zona jugada o desbloqueada). */
    enterCity(cityKey) {
      const normalizedKey = this.normalizeCityKey(cityKey);
      const zoneNum = global.WorldProgress ? global.WorldProgress.getLastPlayedZone(normalizedKey) : 1;
      this.enterZone(normalizedKey, Math.max(0, zoneNum - 1));
    }

    returnToMenu(playSelect = false) {
      this.closeSettingsModal(false);
      if (this.sound && typeof this.sound.setHurryUp === 'function') this.sound.setHurryUp(false);
      if (this.sound && typeof this.sound.stopAnnouncementAudio === 'function') this.sound.stopAnnouncementAudio();
      if (this.sound && typeof this.sound.stopBiplaneAmbience === 'function') this.sound.stopBiplaneAmbience();
      this.sound.stopAllSounds();
      this.isBiplaneFlightCheat = false;
      this.biplaneFlightCheat = null;
      this.airTourBuffer = '';
      this.ghostMode = false;
      this.ghostBuffer = '';
      this.ghostToastTimer = 0;
      this.ghostRescueToastCooldown = 0;
      if (this.player) this.player.ghostMode = false;
      this.clearTransientInput();
      this.preserveSessionLives();
      this.preserveSessionHearts();
      this.survivalRiskMode = false;
      this.setPostGameOverActive(false);
      this.resetLevelBoneTracking();
      if (this.player) this.player.state = 'active';
      if (this.partner) this.partner.state = 'active';
      if (this.tina) this.tina.state = 'active';
      this.highScore = this.loadHighScore();
      this.state = 'menu';
      if (playSelect) {
        this.sound.menuSelect();
      }
      this.sound.playMenuMusic('zen');
    }

    exitMapToMenu() {
      this.sound.stopBiplaneAmbience();
      this.sound.stopMusic();
      this.sound.playMenuMusic('zen');
      this.clearTransientInput();
      this.highScore = this.loadHighScore();
      this.state = 'menu';
    }

    /**
     * Se completó el último nivel de una ciudad: se guarda el progreso, se desbloquea
     * la siguiente ciudad (incluyendo 'madrid', 'mallorca' y 'canarias' al completar Palma)
     * y se pasa al Mapa de España con la animación del camino de puntitos.
     */
    completeCity() {
      const city = this.cityKey;
      const def = global.CITY_DEFS[city];
      const wasSaUnlocked = global.WorldProgress.isContinentUnlocked('southamerica');
      const wasChileUnlocked = global.WorldProgress.isContinentUnlocked('chile');
      this.saveHighScore();
      global.WorldProgress.setMaxLevel(city, this.getCityLevels().length);
      global.WorldProgress.complete(city);

      if (city === 'canarias') {
        const pendingWorld =
          this.pendingContinentUnlock && this.pendingContinentUnlock.to === 'argentina'
            ? this.pendingContinentUnlock
            : (wasSaUnlocked ? null : { from: 'spain', to: 'argentina' });
        this.pendingContinentUnlock = null;
        this.pendingCityUnlock = null;
        global.WorldProgress.unlockContinent('southamerica');
        this.openMap({
          level: 'world',
          cursorCity: 'canarias',
          worldUnlockAnim: pendingWorld,
          pendingContinentUnlock: pendingWorld
        });
        return;
      }

      if (city === 'buenosaires') {
        let saUnlockAnim = null;
        const unlockedNow = global.CITY_DEFS.rosario && global.WorldProgress.unlock('rosario');
        if (unlockedNow || (this.pendingCityUnlock && this.pendingCityUnlock.from === city && this.pendingCityUnlock.to === 'rosario')) {
          saUnlockAnim = { from: 'buenosaires', to: 'rosario' };
        }
        this.pendingCityUnlock = null;
        this.openMap({
          level: 'southamerica',
          cursorCity: 'buenosaires',
          unlockAnim: saUnlockAnim,
          pendingCityUnlock: saUnlockAnim
        });
        return;
      }

      if (city === 'rosario') {
        let saUnlockAnim = null;
        const unlockedNow = global.CITY_DEFS.cordoba && global.WorldProgress.unlock('cordoba');
        if (unlockedNow || (this.pendingCityUnlock && this.pendingCityUnlock.from === city && this.pendingCityUnlock.to === 'cordoba')) {
          saUnlockAnim = { from: 'rosario', to: 'cordoba' };
        }
        this.pendingCityUnlock = null;
        this.openMap({
          level: 'southamerica',
          cursorCity: city,
          unlockAnim: saUnlockAnim,
          pendingCityUnlock: saUnlockAnim
        });
        return;
      }
      if (city === 'cordoba') {
        let saUnlockAnim = null;
        const unlockedNow = global.CITY_DEFS.ushuaia && global.WorldProgress.unlock('ushuaia');
        if (unlockedNow || (this.pendingCityUnlock && this.pendingCityUnlock.from === city && this.pendingCityUnlock.to === 'ushuaia')) {
          saUnlockAnim = { from: 'cordoba', to: 'ushuaia' };
        }
        this.pendingCityUnlock = null;
        this.openMap({
          level: 'southamerica',
          cursorCity: city,
          unlockAnim: saUnlockAnim,
          pendingCityUnlock: saUnlockAnim
        });
        return;
      }

      if (city === 'ushuaia') {
        const chileTempLocked =
          typeof global.isCountryLocked === 'function'
            ? global.isCountryLocked('chile')
            : !!(global.LOCKED_COUNTRIES && global.LOCKED_COUNTRIES.chile);
        if (chileTempLocked) {
          this.pendingContinentUnlock = null;
          this.pendingCityUnlock = null;
          this.openMap({
            level: 'world',
            worldNode: 'argentina',
            cursorCity: 'ushuaia'
          });
          return;
        }
        const nextKey = def ? def.next : null;
        const pendingWorld =
          this.pendingContinentUnlock && this.pendingContinentUnlock.to === 'chile'
            ? this.pendingContinentUnlock
            : (wasChileUnlocked ? null : { from: 'argentina', to: 'chile' });
        this.pendingContinentUnlock = null;
        this.pendingCityUnlock = null;
        if (nextKey && global.CITY_DEFS[nextKey]) {
          global.WorldProgress.unlock(nextKey);
        }
        global.WorldProgress.unlockContinent('chile');
        this.openMap({
          level: 'world',
          cursorCity: 'argentina',
          worldUnlockAnim: pendingWorld,
          pendingContinentUnlock: pendingWorld
        });
        return;
      }

      if (this.isChileCity(city)) {
        let unlockAnim = null;
        const nextKey = def ? def.next : null;
        const unlockedNow = nextKey && global.CITY_DEFS[nextKey] && global.WorldProgress.unlock(nextKey);
        if (unlockedNow || (nextKey && this.pendingCityUnlock && this.pendingCityUnlock.from === city)) {
          unlockAnim = { from: city, to: nextKey };
        }
        this.pendingCityUnlock = null;
        this.openMap({
          level: 'chile',
          cursorCity: city,
          unlockAnim,
          pendingCityUnlock: unlockAnim
        });
        return;
      }

      let unlockAnim = null;
      const nextKey = def ? def.next : null;
      const unlockedNow = nextKey && global.CITY_DEFS[nextKey] && global.WorldProgress.unlock(nextKey);
      if (unlockedNow || (nextKey && this.pendingCityUnlock && this.pendingCityUnlock.from === city)) {
        unlockAnim = { from: city, to: nextKey };
      }
      this.pendingCityUnlock = null;

      this.openMap({ level: 'spain', cursorCity: city, unlockAnim, pendingCityUnlock: unlockAnim });
    }

    /**
     * Carga un nivel.
     * REGLA ESTRICTA DE RESETEO ENTRE NIVELES:
     * Al completar un nivel y pasar al siguiente, se conservan los corazones actuales (1..3)
     * junto con el equipamiento conservado en la sesión.
     */
    loadLevel(index, initialHearts = null) {
      const cityLevels = this.getCityLevels();
      const safeIndex = Number.isInteger(index) && index >= 0 && index < cityLevels.length ? index : 0;
      this.levelIndex = safeIndex;
      const raw = cityLevels[safeIndex] || (Array.isArray(global.LEVELS) && global.LEVELS[0]) || {};
      this.levelData = raw;
      if (this.sound) {
        if (typeof this.sound.preloadCityAudio === 'function') {
          this.sound.preloadCityAudio(this.cityKey);
        }
        if (typeof this.sound.startMusic === 'function') {
          this.sound.startMusic(this.getActiveLevelMusicTheme(), this.getActiveLevelMusicMeta());
        }
      }
      this.levelStartScore = this.score;
      const isBarcelonaZone1 = this.cityKey === 'barcelona' && safeIndex === 0;
      const isFreshNewSlot = !!(
        global.WorldProgress &&
        typeof global.WorldProgress.isFreshZeroSlot === 'function' &&
        global.WorldProgress.isFreshZeroSlot() &&
        (this.activeSlotId || global.WorldProgress.activeSlotId)
      );
      this.startCheatEligible = isBarcelonaZone1 && isFreshNewSlot;
      this.startCheatBuffer = '';
      this.etHomeBuffer = '';
      this.pwingBuffer = '';
      this.airTourBuffer = '';
      this.ghostBuffer = '';
      this.ghostRescueToastCooldown = 0;
      this.isAbductedByCheat = false;
      this.abductionCheat = null;
      this.isBiplaneFlightCheat = false;
      this.biplaneFlightCheat = null;
      if (this.sound && typeof this.sound.stopBiplaneAmbience === 'function') {
        this.sound.stopBiplaneAmbience();
      }
      this.pendingCityUnlock = null;
      this.pendingContinentUnlock = null;
      this.cheatLoadTime =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      this.cheatSpawnX = null;
      if (
        isBarcelonaZone1 &&
        global.WorldProgress &&
        typeof global.WorldProgress.markBarcelonaFirstEntry === 'function'
      ) {
        global.WorldProgress.markBarcelonaFirstEntry();
      }
      global.WorldProgress.setLastPlayedLocation(this.cityKey, safeIndex + 1);
      global.WorldProgress.setMaxLevel(this.cityKey, safeIndex + 1);
      this.levelCoins = 0;
      this.levelTime = 0;
      const levelTimeLimit = Number.isFinite(raw.timeLimit) ? raw.timeLimit : DEFAULT_TIME_LIMIT;
      this.levelTimer = levelTimeLimit;
      this.timeLeft = levelTimeLimit;
      this.hurryUpTriggered = false;
      this.cameraX = 0;
      this.levelBannerTimer = 2.6;
      this.hints = (raw.hints || []).map((h) => ({
        x: h.x,
        y: h.y,
        text: h.text,
        triggered: false
      }));
      this.activeHintText = '';
      this.activeHintTimer = 0;
      this.swarmEventTriggered = false;
      this.swarmAlertTimer = 0;
      this.swarmPigeons = [];
      this.swarmHorneros = [];
      this.horneros = [];
      this.plantProjectiles = [];
      this.calamaresProjectiles = this.plantProjectiles;
      const preservedPowerUp = this.carriedPowerUp || (this.player && this.player.activePowerUp) || null;

      const solidSource = Array.isArray(raw.solids)
        ? raw.solids
        : Array.isArray(raw.platforms)
          ? raw.platforms
          : [{ x: 0, y: 460, w: 3200, h: 100, style: 'sand' }];
      this.solids = solidSource.map((s) => Object.assign({}, s));
      this.movingPlatforms = (raw.movingPlatforms || []).map(
        (m) => new global.Entities.MovingPlatform(m)
      );
      const defaultFallDelay = this.isCanariasCity() || this.isUshuaiaCity() ? 0.6 : 0.8;
      this.fallingPlatforms = (raw.fallingPlatforms || []).map(
        (f) => new global.Entities.FallingPlatform(
          f.x,
          f.y,
          f.w,
          f.h,
          f.style,
          Number.isFinite(f.fallDelay) ? f.fallDelay : defaultFallDelay
        )
      );
      this.hiddenBlocks = (raw.hiddenBlocks || []).map((hb) => {
        const blockItem = hb.item || 'golden_bone';
        const secretKey = blockItem === 'tina_golden_bone' ? null : this.getGoldenBoneKey(this.cityKey, safeIndex, hb);
        const block = new global.Entities.HiddenBlock(
          hb.x,
          hb.y,
          hb.w || 32,
          hb.h || 32,
          blockItem,
          hb.style || 'secret_gold',
          secretKey
        );
        if (secretKey && this.collectedBonesInRun && this.collectedBonesInRun.has(secretKey)) {
          block.revealed = true;
          block.hit = true;
          block.used = true;
          block.empty = true;
        }
        return block;
      });
      const questionBlocks = (raw.questionBlocks || []).map(
        (qb) =>
          new global.Entities.HiddenBlock(
            qb.x,
            qb.y,
            qb.w || 32,
            qb.h || 32,
            qb.item || 'plant',
            qb.style || 'question',
            null,
            true
          )
      );
      if (questionBlocks.length > 0) {
        this.hiddenBlocks = this.hiddenBlocks.concat(questionBlocks);
      }
      this.collectibles = (raw.collectibles || [])
        .filter((c) => {
          if (c && (c.type === 'golden_bone' || c.type === '1up_bone')) {
            return !this.collectedBonesInRun || !this.collectedBonesInRun.has(
              this.getGoldenBoneKey(this.cityKey, safeIndex, c)
            );
          }
          return true;
        })
        .map((c) => new global.Entities.Collectible(c.x, c.y, c.type, false));
      this.pigeons = (raw.pigeons || []).map(
        (p) => new global.Entities.Pigeon(p.x, p.y, p.minX, p.maxX, p.speed, index, !!p.reactive || this.cityKey === 'canarias')
      );
      this.scooters = (raw.scooters || []).map(
        (s) => new global.Entities.Scooter(s.x, s.y, s.minX, s.maxX, s.speed, index)
      );
      this.seagulls = (raw.seagulls || []).map(
        (g) => new global.Entities.Seagull(g.x, g.minY, g.maxY, g.speed, index)
      );
      this.hedgehogs = (raw.hedgehogs || []).map(
        (h) => new global.Entities.Hedgehog(h.x, h.y, h.minX, h.maxX, h.speed, index)
      );
      this.boars = (raw.boars || []).map(
        (b) => new global.Entities.Boar(b.x, b.y, b.minX, b.maxX, b.speed, index)
      );
      this.madridCats = (raw.cats || []).map(
        (c) => new global.Entities.MadridCatEnemy(c.x, c.y, c.minX, c.maxX, c.speed, index, c.isAmbush)
      );
      const touristVariantFallback = this.isUshuaiaCity() ? 'winter' : 'madrid';
      this.selfieTourists = [
        ...(raw.selfieTourists || []).map(
          (t) =>
            new global.Entities.SelfieTouristEnemy(
              t.x,
              t.y,
              t.minX,
              t.maxX,
              t.speed,
              index,
              t.variant || touristVariantFallback
            )
        ),
        ...(raw.bundledTourists || []).map(
          (bt) =>
            new global.Entities.SelfieTouristEnemy(
              bt.x,
              bt.y,
              bt.minX,
              bt.maxX,
              bt.speed,
              index,
              bt.variant || 'winter'
            )
        )
      ];
      this.royalGuards = (raw.royalGuards || []).map(
        (rg) => new global.Entities.RoyalGuardEnemy(rg.x, rg.y, rg.minX, rg.maxX, rg.speed, index)
      );
      this.peacocks = (raw.peacocks || []).map(
        (pk) => new global.Entities.PeacockEnemy(pk.x, pk.y, pk.minX, pk.maxX, pk.speed, index)
      );
      this.crazyCyclists = (raw.crazyCyclists || []).map(
        (cc) => new global.Entities.CrazyCyclistEnemy(cc.x, cc.y, cc.minX, cc.maxX, cc.speed, index)
      );
      this.greenParakeets = (raw.greenParakeets || []).map(
        (g) =>
          new global.Entities.GreenParakeetEnemy(
            g.x,
            g.baseY,
            g.minX,
            g.maxX,
            g.ampY,
            g.speed,
            index,
            g.variant || (this.cityKey === 'barcelona' ? 'barcelona' : 'madrid')
          )
      );
      this.swarmParakeets = [];
      this.isMadridSwarm = !!raw.isMadridSwarm;
      this.jellyfishes = (raw.jellyfishes || []).map(
        (j) => new global.Entities.ElectricJellyfishEnemy(j.x, j.baseY, j.ampY, j.speed, index)
      );
      this.crabs = (raw.crabs || []).map(
        (c) => new global.Entities.CoastalCrabEnemy(c.x, c.y, c.minX, c.maxX, c.speed, index)
      );
      this.goats = (raw.goats || []).map(
        (g) => new global.Entities.TramuntanaGoatEnemy(g.x, g.y, g.minX, g.maxX, g.speed, index)
      );
      this.royalSeagulls = (raw.royalSeagulls || []).map(
        (r) =>
          new global.Entities.RoyalSeagullEnemy(
            r.x,
            Number.isFinite(r.baseY) ? r.baseY : r.y,
            r.minX,
            r.maxX,
            Number.isFinite(r.ampY) ? r.ampY : 44,
            Number.isFinite(r.speed) ? r.speed : Number.isFinite(r.patrolSpeed) ? r.patrolSpeed : 150,
            index
          )
      );
      this.swarmRoyalSeagulls = [];
      this.isPalmaSwarm = !!raw.isPalmaSwarm;
      this.geysers = (raw.geysers || []).map(
        (g) => new global.Entities.VolcanicGeyser(g.x, g.y, g.period, g.eruptDuration, g.phase, g.height, g.kind || 'steam')
      );
      this.gallotias = (raw.gallotias || []).map(
        (g) => new global.Entities.GallotiaLizardEnemy(g.x, g.y, g.minX, g.maxX, g.speed, index)
      );
      this.garajonayFoxes = (raw.garajonayFoxes || []).map(
        (f) => new global.Entities.GarajonayFoxEnemy(f.x, f.y, f.minX, f.maxX, f.speed, index)
      );
      this.gaudiLizard = null;
      if (raw.gaudiLizard && !this.lizardEventConsumed && !this.gaudiLizardEventResolved) {
        const glCfg = raw.gaudiLizard;
        this.gaudiLizard = new global.Entities.GaudiLizardEnemy(
          glCfg.x,
          glCfg.y,
          glCfg.platformX,
          glCfg.platformW,
          glCfg.minX,
          glCfg.maxX,
          glCfg.speed || 296,
          index,
          glCfg.triggerX,
          glCfg.maxPasses || 3
        );
      }
      this.abubillas = (raw.abubillas || []).map(
        (a) => new global.Entities.CanarianHoopoeEnemy(a.x, a.baseY, a.minX, a.maxX, a.vx, a.amplitude, a.diveSpeed, index)
      );
      this.swarmAbubillas = [];
      this.blindCrabs = (raw.blindCrabs || []).map(
        (bc) => new global.Entities.BlindCrabEnemy(bc.x, bc.y, bc.minX, bc.maxX, bc.speed, index)
      );
      this.isCanariasSwarm = !!raw.isCanariasSwarm;
      this.ropes = (raw.ropes || []).map(
        (r) => new global.Entities.ClotheslineRope(r.x1, r.x2, r.y, r.sag, r.colors)
      );
      this.subwayVents = (raw.subwayVents || []).map(
        (v) => new global.Entities.SubwayVent(v.x, v.y, v.w, v.height, v.period, v.phase, v.kind || 'vent')
      );
      this.sinkingContainers = (raw.sinkingContainers || []).map((sc) => {
        const obj = new global.Entities.SinkingContainer(sc.x, sc.y, sc.w, sc.h, sc.maxSink, sc.sinkSpeed, sc.color);
        if (sc.style) obj.style = sc.style;
        return obj;
      });
      this.overheadHazards = (raw.overheadHazards || []).map(
        (oh) => new global.Entities.OverheadHazard(oh.x, oh.y, oh.w, oh.h, oh.kind, oh.label)
      );
      const aiTier = (raw && Number(raw.aiTier)) || (index + 1);
      const aiOpts = { aiTier, cityKey: this.cityKey };
      this.trapitos = (raw.trapitos || []).map(
        (t) => new global.Entities.TrapitoEnemy(t.x, t.y, aiOpts)
      );
      this.motochorros = (raw.motochorros || []).map(
        (m) => new global.Entities.MotochorroEnemy(m.x, m.y, m.minX, m.maxX, m.speed, index, aiOpts)
      );
      this.barrabravas = (raw.barrabravas || []).map(
        (b) => new global.Entities.BarrabravaEnemy(b.x, b.y, b.minX, b.maxX, b.speed, aiOpts)
      );
      this.canillitas = (raw.canillitas || []).map(
        (c) => new global.Entities.CanillitaEnemy(c.x, c.y, c.minX, c.maxX, c.speed, aiOpts)
      );
      this.fatPigeons = (raw.fatPigeons || []).map(
        (fp) => new global.Entities.FatPigeonEnemy(fp.x, fp.y, fp.minX, fp.maxX, fp.speed)
      );
      this.horneroNests = (raw.horneroNests || []).map(
        (hn) => new global.Entities.HorneroNest(
          hn.x,
          hn.y,
          hn.aggroRange,
          hn.cooldown,
          hn.speed,
          Object.assign({}, aiOpts, Number.isFinite(hn.baseY) ? { baseY: hn.baseY } : null)
        )
      );
      this.horneros = [];
      this.swarmHorneros = [];
      this.isHorneroSwarm = !!raw.isHorneroSwarm;
      this.newspaperProjectiles = [];
      this.lightPoles = [];
      this.rockeros = (raw.rockeros || []).map((rk) => {
        if (rk.onPole) {
          const poleX = Number.isFinite(rk.poleX) ? rk.poleX : rk.x + 32;
          const poleBaseY = Number.isFinite(rk.poleBaseY) ? rk.poleBaseY : 460;
          const poleTopY = Number.isFinite(rk.poleTopY) ? rk.poleTopY : 214;
          this.lightPoles.push({ x: poleX, baseY: poleBaseY, topY: poleTopY, shakeTimer: 0 });
          const poleOpts = Object.assign({}, aiOpts, {
            onPole: true,
            poleX,
            poleBaseY,
            poleTopY
          });
          return new global.Entities.RockeroEnemy(rk.x, rk.y, rk.minX, rk.maxX, rk.speed, poleOpts);
        }
        return new global.Entities.RockeroEnemy(rk.x, rk.y, rk.minX, rk.maxX, rk.speed, aiOpts);
      });
      this.penguins = (raw.penguins || []).map(
        (pg) =>
          new global.Entities.PenguinEnemy(
            pg.x,
            pg.y,
            Object.assign({}, aiOpts, { minX: pg.minX, maxX: pg.maxX, speed: pg.speed })
          )
      );
      this.coldBlasts = [];
      this.palometas = (raw.palometas || []).map(
        (pm) =>
          new global.Entities.PalometaEnemy(
            pm.x,
            pm.waterY,
            pm.peakY !== undefined ? pm.peakY : pm.jumpHeight,
            pm.wait !== undefined ? pm.wait : pm.period,
            pm.phase,
            aiOpts
          )
      );
      this.bouncyDrums = (raw.bouncyDrums || []).map(
        (bd) => new global.Entities.BouncyDrum(bd.x, bd.y, bd.w, bd.h, bd.bounceVy)
      );
      this.swarmMosquitoes = [];
      this.isMosquitoSwarm = !!raw.isMosquitoSwarm;
      this.belgranoPirates = (raw.belgranoPirates || []).map(
        (bp) => new global.Entities.BelgranoPirateEnemy(bp.x, bp.y, bp.minX, bp.maxX, bp.speed, aiOpts)
      );
      this.fernetBottles = [];
      this.fernetPuddles = [];
      this.serranoBurros = (raw.serranoBurros || []).map(
        (sb) => new global.Entities.SerranoBurroEnemy(sb.x, sb.y, sb.minX, sb.maxX, sb.speed, index)
      );
      this.miniUfos = (raw.miniUfos || []).map(
        (u) => new global.Entities.MiniUfoEnemy(u.x, u.baseY, u.minX, u.maxX, u.vx, u.ampY, u.period, u.beamHeight)
      );
      this.seaLions = (raw.seaLions || []).map(
        (sl) => new global.Entities.SeaLionEnemy(sl.x, sl.y, sl.minX, sl.maxX, sl.speed, index)
      );
      this.kingCrabs = (raw.kingCrabs || []).map(
        (kc) => new global.Entities.KingCrabEnemy(kc.x, kc.y, kc.minX, kc.maxX, kc.speed, index)
      );
      this.fuegianFoxes = (raw.fuegianFoxes || []).map(
        (ff) => new global.Entities.FuegianFoxEnemy(ff.x, ff.y, ff.minX, ff.maxX, ff.speed, index)
      );
      this.swarmCormorants = [];
      this.isCormorantSwarm = !!raw.isCormorantSwarm;
      this.pumas = (raw.pumas || []).map(
        (pm) => new global.Entities.PumaEnemy(pm.x, pm.y, pm.minX, pm.maxX, pm.speed, index, !!pm.isAmbush)
      );
      this.condors = (raw.condors || []).map(
        (cn) => new global.Entities.CondorEnemy(cn.x, cn.baseY !== undefined ? cn.baseY : cn.y, cn.minX, cn.maxX, cn.speed, index)
      );
      this.portPelicans = (raw.portPelicans || []).map(
        (pp) => new global.Entities.PortPelicanEnemy(pp.x, pp.baseY !== undefined ? pp.baseY : pp.y, pp.minX, pp.maxX, pp.speed, index)
      );
      this.pelicanDrops = [];
      this.pacificHazards = (raw.pacificHazards || []).map(
        (ph) => new global.Entities.PacificJumpHazard(ph.x, ph.baseY, ph.period, ph.height, ph.phase, ph.kind)
      );
      this.frigates = (raw.frigates || []).map(
        (fr) => new global.Entities.SwarmFrigate(fr.x, fr.baseY !== undefined ? fr.baseY : fr.y, fr.speed || 138, {
          minX: Number.isFinite(fr.minX) ? fr.minX : fr.x - 140,
          maxX: Number.isFinite(fr.maxX) ? fr.maxX : fr.x + 140,
          ampY: fr.ampY
        })
      );
      this.salineSpits = [];
      this.vicunas = (raw.vicunas || []).map(
        (vc) => new global.Entities.VicunaEnemy(vc.x, vc.y, vc.minX, vc.maxX, vc.speed, index)
      );
      this.portDogs = (raw.portDogs || []).map(
        (pd) => new global.Entities.PortDogEnemy(pd.x, pd.y, pd.minX, pd.maxX, pd.speed, index)
      );
      this.rapaNuiWarriors = (raw.rapaNuiWarriors || []).map(
        (rn) => new global.Entities.RapaNuiWarrior(rn.x, rn.y, rn.minX, rn.maxX, rn.speed, index)
      );
      const allowCuecaDancers = this.cityKey === 'chile_santiago' || this.cityKey === 'chile_vina';
      this.guasos = allowCuecaDancers
        ? (raw.guasos || []).map(
            (g) => new global.Entities.GuasoEnemy(g.x, g.y, g.minX, g.maxX, g.speed, index)
          )
        : [];
      this.guasas = allowCuecaDancers
        ? (raw.guasas || []).map(
            (g) => new global.Entities.GuasaEnemy(g.x, g.y, g.minX, g.maxX, g.speed, index)
          )
        : [];
      this.swarmFrigates = [];
      this.isFrigateSwarm = !!raw.isFrigateSwarm;
      this.autoScrollSpeed =
        raw.autoScroll === false ? 0 : Math.max(0, Number(raw.autoScrollSpeed) || 0);
      this.constantWindX = Number(raw.constantWindX) || 0;
      this.hasSandPhysics = !!raw.hasSandPhysics;
      this.hasIcePhysics = !!(raw.hasIcePhysics || raw.isIceLevel);
      this.isIceLevel = this.hasIcePhysics;
      this.hasSaltPhysics = !!raw.hasSaltPhysics;
      this.hasLavaPits = !!raw.hasLavaPits;
      this.hasDeadlyPits = !!raw.hasDeadlyPits;
      this.hasWind = !!raw.hasWind;
      this.windTimer = 0;
      this.windActive = false;
      this.windForceX = 0;
      this.hasWaterPits = !!raw.hasWaterPits || this.cityKey === 'palma';
      this.hasStormWaves = !!raw.hasStormWaves;
      this.roseTunnels = Array.isArray(raw.roseTunnels) ? raw.roseTunnels : [];
      this.waterPits = this.computeWaterPits();
      this.zigzagPigeons = (raw.zigzagPigeons || []).map(
        (z) => new global.Entities.ZigZagPigeon(z.x, z.baseY, z.minX, z.maxX, z.ampY, z.speed, index)
      );

      // Respaldo por si algún nivel define el array genérico 'enemies' o 'parakeets'
      if (Array.isArray(raw.enemies)) {
        raw.enemies.forEach((e) => {
          const minX = Number.isFinite(e.minX) ? e.minX : e.x - (e.patrolDistance || 60);
          const maxX = Number.isFinite(e.maxX) ? e.maxX : e.x + (e.patrolDistance || 60);
          if (e.type === 'madrid_cat' || e.type === 'cat') {
            this.madridCats.push(
              new global.Entities.MadridCatEnemy(e.x, e.y, minX, maxX, e.speed || 85, index, !!e.onPerch || !!e.isAmbush)
            );
          } else if (e.type === 'selfie_tourist' || e.type === 'tourist') {
            this.selfieTourists.push(
              new global.Entities.SelfieTouristEnemy(e.x, e.y, minX, maxX, e.speed || 55, index)
            );
          } else if (e.type === 'royal_guard' || e.type === 'royalGuard') {
            this.royalGuards.push(
              new global.Entities.RoyalGuardEnemy(e.x, e.y, minX, maxX, e.speed || 62, index)
            );
          } else if (e.type === 'peacock') {
            this.peacocks.push(
              new global.Entities.PeacockEnemy(e.x, e.y, minX, maxX, e.speed || 62, index)
            );
          } else if (e.type === 'crazy_cyclist' || e.type === 'crazyCyclist') {
            this.crazyCyclists.push(
              new global.Entities.CrazyCyclistEnemy(e.x, e.y, minX, maxX, e.speed || 158, index)
            );
          } else if (e.type === 'pigeon') {
            this.pigeons.push(
              new global.Entities.Pigeon(e.x, e.y, minX, maxX, e.speed || 70, index)
            );
          } else if (allowCuecaDancers && e.type === 'guaso') {
            this.guasos.push(
              new global.Entities.GuasoEnemy(e.x, e.y, minX, maxX, e.speed || 84, index)
            );
          } else if (allowCuecaDancers && e.type === 'guasa') {
            this.guasas.push(
              new global.Entities.GuasaEnemy(e.x, e.y, minX, maxX, e.speed || 86, index)
            );
          }
        });
      }
      this.guasoDancers = [...this.guasos, ...this.guasas];
      if (Array.isArray(raw.parakeets)) {
        raw.parakeets.forEach((p) => {
          this.greenParakeets.push(
            new global.Entities.GreenParakeetEnemy(
              p.x,
              p.baseY || p.y || 300,
              p.minX || p.x - 150,
              p.maxX || p.x + 150,
              p.ampY || p.amp || 36,
              p.speed || 150,
              index,
              p.variant || (this.cityKey === 'barcelona' ? 'barcelona' : 'madrid')
            )
          );
        });
      }
      // Lista unificada accesible de enemigos cargados
      this.enemies = [
        ...this.pigeons,
        ...this.scooters,
        ...this.seagulls,
        ...this.hedgehogs,
        ...this.boars,
        ...this.zigzagPigeons,
        ...this.madridCats,
        ...this.selfieTourists,
        ...this.royalGuards,
        ...this.peacocks,
        ...this.crazyCyclists,
        ...this.greenParakeets,
        ...this.jellyfishes,
        ...this.crabs,
        ...this.goats,
        ...this.royalSeagulls,
        ...this.gallotias,
        ...this.garajonayFoxes,
        ...(this.gaudiLizard ? [this.gaudiLizard] : []),
        ...this.abubillas,
        ...this.blindCrabs,
        ...this.trapitos,
        ...this.motochorros,
        ...this.barrabravas,
        ...this.canillitas,
        ...this.fatPigeons,
        ...this.horneros,
        ...this.swarmHorneros,
        ...this.rockeros,
        ...this.penguins,
        ...this.palometas,
        ...this.pacificHazards,
        ...this.swarmMosquitoes,
        ...this.belgranoPirates,
        ...this.serranoBurros,
        ...this.miniUfos,
        ...this.seaLions,
        ...this.kingCrabs,
        ...this.fuegianFoxes,
        ...this.pumas,
        ...this.condors,
        ...this.portPelicans,
        ...this.frigates,
        ...this.vicunas,
        ...this.portDogs,
        ...this.rapaNuiWarriors,
        ...this.guasoDancers
      ];

      const spawnPos = raw.spawn && Number.isFinite(raw.spawn.x) && Number.isFinite(raw.spawn.y)
        ? raw.spawn
        : { x: 80, y: 390 };
      const fallbackHearts =
        this.player && Number.isFinite(this.player.hearts) && this.player.hearts >= 1
          ? this.player.hearts
          : (Number.isFinite(this.savedHearts) && this.savedHearts >= 1
              ? this.savedHearts
              : (global.WorldProgress && typeof global.WorldProgress.getHearts === 'function'
                  ? global.WorldProgress.getHearts()
                  : 3));
      const targetHearts =
        initialHearts !== null && initialHearts !== undefined ? Number(initialHearts) : fallbackHearts;
      this.player = new global.Entities.Player(spawnPos.x, spawnPos.y, this.selectedCharacter);
      this.player.ghostMode = Boolean(this.ghostMode);
      const safeHearts =
        Number.isFinite(targetHearts) && targetHearts >= 1
          ? Math.max(1, Math.min(this.player.maxHearts || 3, Math.floor(targetHearts)))
          : 3;
      this.player.hearts = safeHearts;
      this.syncHeartsToSlot(safeHearts);
      this.player.reserveItem = this.reservePowerUp || null;
      if (preservedPowerUp) {
        this.player.equipPowerUp(preservedPowerUp);
        this.carriedPowerUp = preservedPowerUp;
      } else {
        this.player.clearAllPowerUps();
        this.carriedPowerUp = null;
      }

      const partnerChar = this.selectedCharacter === 'nico' ? 'andrea' : 'nico';
      this.partner = new global.Entities.PartnerCompanion(spawnPos.x, spawnPos.y, partnerChar);
      this.tina = new global.Entities.TinaCompanion(spawnPos.x, spawnPos.y);
      this.particles = new global.Entities.ParticleSystem();
      this.cheatSpawnX = this.player ? this.player.x : spawnPos.x;
      this.clearTransientInput();
    }

    nextLevel() {
      this.preserveSessionHearts();
      if (this.sound && typeof this.sound.stopAnnouncementAudio === 'function') {
        this.sound.stopAnnouncementAudio();
      }
      this.resetLevelBoneTracking();
      const levels = this.getCityLevels();
      if (this.levelIndex + 1 < levels.length) {
        // Flujo obligatorio: siempre volver al Submapa de la ciudad tras completar una zona
        // para mostrar la animación de trazado de camino hacia la nueva zona desbloqueada.
        this.sound.stopMenuMusic();
        this.sound.stopAllSounds();
        this.sound.menuSelect();
        const clearedZone = (this.levelIndex | 0) + 1;
        const nextZone = clearedZone + 1;
        const needsPathAnim =
          global.WorldProgress &&
          global.WorldProgress.isZoneUnlocked(this.cityKey, nextZone) &&
          !global.WorldProgress.isZonePathAnimated(this.cityKey, nextZone);
        this.openMap({
          level: 'city',
          cursorCity: this.cityKey,
          cursorZone: clearedZone,
          zoneUnlockAnim: needsPathAnim ? { from: clearedZone, to: nextZone } : null
        });
      } else {
        // Último nivel de la ciudad: desbloqueo de ciudad / continente en el Mapa
        this.completeCity();
      }
    }

    // ========================================================================
    // CAJA DE RESERVA MANUAL [SHIFT] E INTERCAMBIO (CAÍDA VERTICAL + RESCATE TINA)
    // ========================================================================
    completeDroppedReserveSwap(c, newType) {
      const prevEquipped = this.player.hasAnyPowerUp()
        ? (this.player.activePowerUp || (this.player.hasAngelWings() ? 'angel_wings' : 'plant'))
        : null;
      this.player.equipPowerUp(newType);
      this.carriedPowerUp = this.player.activePowerUp;
      this.reservePowerUp = prevEquipped || null;
      this.player.reserveItem = this.reservePowerUp;
      if (this.sound && typeof this.sound.itemSwap === 'function') {
        this.sound.itemSwap();
      } else {
        this.sound.powerup();
      }
      this.particles.Burst(c.x + 12, c.y + 12, '#38bdf8', 22);
      this.particles.FloatingText(
        c.x - 50,
        c.y - 12,
        prevEquipped ? '🔄 ¡INTERCAMBIO REALIZADO!' : '✨ ¡EQUIPADO DE RESERVA!',
        '#38bdf8'
      );
    }

    handlePowerUpPickup(c, touchedBy = this.player) {
      const newType =
        c.type === 'electric_shield' || c.type === 'calamares' ? 'plant' : c.type;
      const label =
        newType === 'angel_wings'
          ? '🪽 ¡ALAS DE ÁNGEL (3x SALTO)!'
          : this.formatControlHintText('🌿 ¡POWER-UP PLANTA [Z]!');
      const byTina = Boolean(touchedBy && this.tina && touchedBy === this.tina);
      const fromReserveDrop = Boolean(c && c.isReserveDrop);

      // CASO 1: Ítem liberado desde arriba por [SHIFT] (isReserveDrop === true) ->
      // intercambia el poder equipado con el que cayó, enviando el previo a Reserva [SHIFT]
      if (fromReserveDrop) {
        this.completeDroppedReserveSwap(c, newType);
        return;
      }

      // CASO 2a: Power-up normal del nivel sin poder activo -> equipa directamente
      if (!this.player.hasAnyPowerUp()) {
        this.player.equipPowerUp(newType);
        this.carriedPowerUp = this.player.activePowerUp;
        this.score += 100;
        this.saveHighScore();
        this.sound.powerup();
        this.particles.Burst(c.x + 12, c.y + 12, '#4ade80', 22);
        const txt = byTina ? `🐾 ${label}` : label;
        this.particles.FloatingText(c.x - 42, c.y - 8, txt, '#bef264');
        return;
      }

      // CASO 2b: Power-up normal del nivel con poder equipado y Reserva [SHIFT] vacía ->
      // conserva intacto el poder equipado actual y guarda el nuevo en la Caja de Reserva
      if (!this.reservePowerUp) {
        this.carriedPowerUp = this.player.activePowerUp;
        this.reservePowerUp = newType;
        this.player.reserveItem = this.reservePowerUp;
        this.score += 100;
        this.saveHighScore();
        this.sound.itemBoxStore();
        this.particles.Burst(c.x + 12, c.y + 12, '#38bdf8', 22);
        this.particles.FloatingText(
          c.x - 52,
          c.y - 10,
          this.formatControlHintText(
            byTina ? '🐾 ¡GUARDADO EN RESERVA [SHIFT]!' : '¡GUARDADO EN RESERVA [SHIFT]!'
          ),
          '#fde047'
        );
        return;
      }

      // CASO 2c: Ambos espacios ocupados (Activo + Reserva [SHIFT]): no desaparece ni reemplaza ninguno y otorga +500 PTS
      this.score += 500;
      this.saveHighScore();
      this.sound.powerup();
      this.particles.Burst(c.x + 12, c.y + 12, '#fde047', 22);
      this.particles.FloatingText(
        c.x - 48,
        c.y - 10,
        '+500 PTS (RESERVA LLENA)',
        '#fde047'
      );
    }

    collectPowerup(c, touchedBy = this.player) {
      return this.handlePowerUpPickup(c, touchedBy);
    }

    /**
     * Suelta el ítem de la Caja de Reserva [SHIFT] en caída vertical recta desde
     * la parte superior de la pantalla a velocidad controlada para permitir
     * atraparlo (intercambio) o esquivarlo (La Tina lo rescata de vuelta).
     */
    swapReserveItem() {
      if (!this.player || !this.reservePowerUp) return false;
      const reserved = this.reservePowerUp;
      this.reservePowerUp = null;
      this.player.reserveItem = null;

      const maxX = Math.max(24, (this.levelData ? this.levelData.width : 4000) - 50);
      const dropX = Math.max(24, Math.min(maxX, this.player.x + this.player.w * 0.5 - 13));
      const dropY = Math.min(58, Math.max(16, this.player.y - 110));
      const dropItem = new global.Entities.Collectible(dropX, dropY, reserved, true);
      dropItem.isReserveDrop = true;
      dropItem._seenOnScreen = true;
      this.collectibles.push(dropItem);

      if (this.sound && typeof this.sound.itemBoxDrop === 'function') {
        this.sound.itemBoxDrop();
      } else if (this.sound && typeof this.sound.itemSwap === 'function') {
        this.sound.itemSwap();
      }
      this.particles.Burst(dropX + 13, dropY + 13, '#38bdf8', 16);
      this.particles.FloatingText(
        dropX - 38,
        dropY + 26,
        this.formatControlHintText('⬇ ¡RESERVA [SHIFT]!'),
        '#38bdf8'
      );
      return true;
    }

    dropReservePowerUp() {
      return this.swapReserveItem();
    }

    /**
     * Dispara un proyectil botánico (Planta/Hoja) de gravedad progresiva
     * con alcance corto controlado y soporte multidireccional:
     * - Tiro estándar (D solo): horizontal inicial (~75 px) y caída suave al piso (~190-210 px).
     * - Tiro diagonal arriba (↑ + D): 45° en arco parabólico compacto (~50 % del alcance anterior).
     * - Tiro diagonal abajo (↓ + D en el aire): 45° hacia abajo.
     */
    tryShootPlant() {
      if (!this.player || !this.player.hasPlant() || this.player.shootCooldown > 0) return;
      this.player.shootCooldown = 0.24;
      const dirX = this.player.facing === 'right' ? 1 : -1;
      let dirY = 0;

      const scheme = this.getControlSchemeSafe();
      const downHeld =
        this.input.down ||
        (global.Input && typeof global.Input.isDown === 'function' && global.Input.isDown(scheme.down));
      const upHeld =
        this.input.up ||
        (global.Input && typeof global.Input.isDown === 'function' && global.Input.isDown(scheme.up));

      if (!this.player.onGround && downHeld) {
        // Tiro diagonal abajo: 45 grados hacia abajo estando en el aire
        dirY = 1;
      } else if (upHeld) {
        // Tiro diagonal arriba: 45 grados hacia arriba manteniendo Arriba
        dirY = -1;
      }

      const px = dirX > 0 ? this.player.x + this.player.w + 2 : this.player.x - 20;
      const py = this.player.y + 12 + dirY * 6;
      const proj = new global.Entities.PlantProjectile(px, py, dirX, dirY);
      this.plantProjectiles.push(proj);
      this.calamaresProjectiles = this.plantProjectiles;
      this.sound.plantShoot();
    }

    tryShootCalamares() {
      this.tryShootPlant();
    }

    // ========================================================================
    // CINEMÁTICA DE FIN DE NIVEL: METRO DE BARCELONA (TMB) + JINGLE + IRIS OUT
    // ========================================================================
    handleTimeUp() {
      if (this.ghostMode) {
        this.levelTimer = DEFAULT_TIME_LIMIT;
        this.timeLeft = DEFAULT_TIME_LIMIT;
        this.hurryUpTriggered = false;
        if (this.sound && typeof this.sound.setHurryUp === 'function') {
          this.sound.setHurryUp(false);
        }
        return;
      }
      this.triggerPlayerDeath({ fellInPit: false, timeUp: true });
    }

    triggerPlayerDeath({ fellInPit = false, timeUp = false } = {}) {
      if (this.ghostMode) return;
      if (this.isAbductedByCheat) return;
      if (this.isBiplaneFlightCheat) return;
      if (this.state !== 'playing' || !this.player || this.player.dead) return;
      this.tookDamageInZone = true;

      if (this.sound) {
        if (typeof this.sound.stopMusic === 'function') this.sound.stopMusic();
        if (typeof this.sound.setHurryUp === 'function') this.sound.setHurryUp(false);
        if (timeUp && typeof this.sound.spikeHit === 'function') {
          this.sound.spikeHit();
        }
        if (typeof this.sound.playerDeath === 'function') {
          this.sound.playerDeath();
        } else if (typeof this.sound.hurt === 'function') {
          this.sound.hurt();
        }
      }

      // Limpiar alertas o carteles flotantes pendientes inmediatamente
      this.hurryUpTriggered = false;
      this.activeHintText = '';
      this.activeHintTimer = 0;
      this.swarmAlertTimer = 0;

      // Posición inicial del salto de derrota visible en pantalla
      if (fellInPit && this.player.y > LOGICAL_H - 12) {
        this.player.y = LOGICAL_H - 12;
      }
      this.player.hearts = 0;
      this.player.dead = true;
      this.player.animState = 'dead';
      this.player.animTimer = 0;
      this.player.vx = 0;
      this.player.vy = fellInPit ? -610 : -540;

      const rawCenterX = this.player.x + this.player.w * 0.5 - this.cameraX;
      const rawCenterY = this.player.y + this.player.h * 0.5;
      this.deathCenterX = Math.max(24, Math.min(LOGICAL_W - 24, rawCenterX));
      this.deathCenterY = Math.max(24, Math.min(LOGICAL_H - 28, rawCenterY));
      this.deathIrisRadius =
        Math.max(
          Math.hypot(this.deathCenterX, this.deathCenterY),
          Math.hypot(LOGICAL_W - this.deathCenterX, this.deathCenterY),
          Math.hypot(this.deathCenterX, LOGICAL_H - this.deathCenterY),
          Math.hypot(LOGICAL_W - this.deathCenterX, LOGICAL_H - this.deathCenterY)
        ) + 12;
      this.deathTimer = 0;
      this.deathFellInPit = Boolean(fellInPit);
      this.deathWasTimeUp = Boolean(timeUp);

      if (timeUp) {
        this.particles.FloatingText(
          this.player.x - 40,
          Math.max(56, this.player.y - 30),
          '⏰ ¡TIEMPO AGOTADO! ⏰',
          '#ef4444'
        );
        this.triggerScreenShake(0.65, 8);
      } else {
        this.triggerScreenShake(0.35, 8);
      }

      this.state = 'player_dead';
    }

    updatePlayerDead(dt) {
      this.deathTimer += dt;
      this.particles.update(dt);

      // Fase 1 (0s .. 0.85s): Pausa dramática breve + salto de derrota y caída fuera de pantalla
      if (this.player) {
        this.player.animState = 'dead';
        this.player.animTimer += dt;
        if (this.deathTimer >= 0.14 && this.player.y < LOGICAL_H + 140) {
          this.player.vy += 1550 * dt;
          this.player.y += this.player.vy * dt;
        }
      }

      // Fase 2 (0.85s .. 1.48s): Cortina negra circular (Iris Out) hacia 0px
      if (this.deathTimer >= 0.85) {
        const t = Math.min(1, (this.deathTimer - 0.85) / 0.62);
        const eased = t * t * (3 - 2 * t);
        const maxR =
          Math.max(
            Math.hypot(this.deathCenterX, this.deathCenterY),
            Math.hypot(LOGICAL_W - this.deathCenterX, this.deathCenterY),
            Math.hypot(this.deathCenterX, LOGICAL_H - this.deathCenterY),
            Math.hypot(LOGICAL_W - this.deathCenterX, LOGICAL_H - this.deathCenterY)
          ) + 12;
        this.deathIrisRadius = Math.max(0, maxR * (1 - eased));
      }

      // Fase 3 (>= 1.54s): Descontar 1 vida y pasar a Game Over o reiniciar nivel limpio
      if (this.deathTimer >= 1.54) {
        this.lives = Math.max(0, this.lives - 1);
        if (this.lives <= 0) {
          const achievedScore = Math.max(0, Math.floor(Number(this.score) || 0));
          this.saveHighScore();
          this.setPostGameOverActive(false);
          this.clearRunEquipment();
          this.runCoins = 0;
          this.survivalRiskMode = false;
          if (this.sound && typeof this.sound.gameOver === 'function') {
            this.sound.gameOver();
          }
          this.prepareGameOverScreen(achievedScore);
          // Tras un Game Over, restablecer las vidas y corazones base a 3 en sesión y en el guardado para el próximo intento
          this.lives = 3;
          this.syncLivesToSlot();
          this.savedHearts = 3;
          this.syncHeartsToSlot(3);
        } else {
          this.syncLivesToSlot();
          this.resetCurrentLevel();
        }
      }
    }

    drawCircularIrisOverlay(ctx, cx, cy, radius) {
      ctx.save();
      const r = Math.max(0, Number(radius) || 0);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.rect(0, 0, LOGICAL_W, LOGICAL_H);
      if (r > 0.5) {
        ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      }
      ctx.fill('evenodd');
      ctx.restore();
    }

    renderDeathIrisOverlay(ctx) {
      if (this.deathTimer >= 0.85) {
        this.drawCircularIrisOverlay(ctx, this.deathCenterX, this.deathCenterY, this.deathIrisRadius);
      }
    }

    resetCurrentLevel() {
      if (this.sound) {
        if (typeof this.sound.setHurryUp === 'function') this.sound.setHurryUp(false);
        if (typeof this.sound.stopMusic === 'function') this.sound.stopMusic();
      }

      this.hurryUpTriggered = false;
      this.activeHintText = '';
      this.activeHintTimer = 0;
      this.swarmAlertTimer = 0;
      this.swarmEventTriggered = false;

      // Al perder los 3 corazones y consumir 1 vida, se limpia el Power-Up activo,
      // se conserva la Reserva [SHIFT] y se restauran los 3 corazones para la nueva vida.
      this.carriedPowerUp = null;
      if (this.player && typeof this.player.clearAllPowerUps === 'function') {
        this.player.clearAllPowerUps();
        this.player.hearts = 3;
      }
      this.savedHearts = 3;
      this.syncHeartsToSlot(3);

      // Recarga limpia del nivel (enemigos, plataformas móviles/caedizas, coleccionables, cámara)
      this.loadLevel(this.levelIndex);

      // Restauración estricta del estado de partida, reloj estándar a 210s y música normal
      const resetTimeLimit = Number.isFinite(this.levelData && this.levelData.timeLimit)
        ? this.levelData.timeLimit
        : DEFAULT_TIME_LIMIT;
      this.levelTime = 0;
      this.levelTimer = resetTimeLimit;
      this.timeLeft = resetTimeLimit;
      this.hurryUpTriggered = false;
      this.activeHintText = '';
      this.activeHintTimer = 0;
      this.swarmAlertTimer = 0;
      this.swarmEventTriggered = false;
      this.swarmPigeons = [];
      this.swarmParakeets = [];
      this.swarmRoyalSeagulls = [];
      this.swarmHorneros = [];
      this.swarmCormorants = [];
      this.horneros = [];
      this.plantProjectiles = [];
      this.calamaresProjectiles = this.plantProjectiles;
      this.deathTimer = 0;
      this.deathIrisRadius = Math.hypot(LOGICAL_W, LOGICAL_H);

      if (this.player) {
        this.player.hearts = 3;
        this.player.dead = false;
        this.player.clearAllPowerUps();
      }
      if (this.tina) {
        this.tina.growlCooldown = 0;
      }

      if (this.deathFellInPit && this.player) {
        this.particles.FloatingText(
          this.player.x,
          this.player.y - 10,
          '¡CUIDADO CON EL POZO!',
          '#f87171'
        );
      }

      this.state = 'playing';
      if (this.sound) {
        if (typeof this.sound.setHurryUp === 'function') this.sound.setHurryUp(false);
        if (typeof this.sound.startMusic === 'function') {
          this.sound.startMusic(this.getActiveLevelMusicTheme(), this.getActiveLevelMusicMeta());
        }
      }
    }

    isMallorcaCity() {
      return this.cityKey === 'palma' || this.cityKey === 'mallorca';
    }

    isCanariasCity() {
      return this.cityKey === 'canarias';
    }

    isRosarioCity() {
      return this.normalizeCityKey(this.cityKey) === 'rosario';
    }

    isCordobaCity() {
      return this.normalizeCityKey(this.cityKey) === 'cordoba';
    }

    isUshuaiaCity() {
      return this.normalizeCityKey(this.cityKey) === 'ushuaia';
    }

    isChileCity(cityKey = this.cityKey) {
      const k = this.normalizeCityKey(cityKey);
      return (
        k === 'chile_santiago' ||
        k === 'chile_vina' ||
        k === 'chile_atacama' ||
        k === 'chile_pascua'
      );
    }

    isChileMetroCity() {
      return this.normalizeCityKey(this.cityKey) === 'chile_santiago';
    }

    isChileBusCity() {
      const k = this.normalizeCityKey(this.cityKey);
      return k === 'chile_vina' || k === 'chile_atacama' || k === 'chile_pascua';
    }

    /**
     * Detecta todos los pozos/abismos entre plataformas sólidas de suelo para niveles
     * costeros, con agua o con peces saltarines, devolviendo { x, w, surfaceY, hasFish }.
     */
    isRosarioParanaWater() {
      return (
        this.cityKey === 'rosario' ||
        !!(this.levelData && typeof this.levelData.theme === 'string' && this.levelData.theme.indexOf('ro_') === 0)
      );
    }

    computeWaterPits() {
      const hasAnyFish = this.pacificHazards.length > 0 || this.palometas.length > 0;
      if (!this.hasWaterPits && !hasAnyFish) return [];
      const waterTone = this.isRosarioParanaWater() ? 'parana' : 'ocean';

      const segs = [];
      for (let i = 0; i < this.solids.length; i++) {
        const s = this.solids[i];
        if (!s || s.oneWay) continue;
        if (s.y <= 505 && s.y + (s.h || 0) >= 470 && s.w > 0) {
          segs.push({ x: s.x, end: s.x + s.w });
        }
      }
      segs.sort((a, b) => a.x - b.x);
      const merged = [];
      for (let i = 0; i < segs.length; i++) {
        const cur = segs[i];
        if (!merged.length || cur.x > merged[merged.length - 1].end) {
          merged.push({ x: cur.x, end: cur.end });
        } else {
          merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, cur.end);
        }
      }

      const fishes = [];
      for (let i = 0; i < this.pacificHazards.length; i++) {
        const ph = this.pacificHazards[i];
        fishes.push({ x: ph.x + (ph.w || 28) * 0.5, y: ph.baseY - 4 });
      }
      for (let i = 0; i < this.palometas.length; i++) {
        const pm = this.palometas[i];
        fishes.push({ x: pm.x + (pm.w || 28) * 0.5, y: pm.waterY });
      }

      const clampSurfaceY = (val) => Math.max(474, Math.min(492, Number.isFinite(val) ? val : 484));
      const pits = [];
      for (let i = 0; i < merged.length - 1; i++) {
        const gapX = merged[i].end;
        const gapW = merged[i + 1].x - gapX;
        if (gapW <= 8) continue;
        let surfaceY = this.hasStormWaves ? 476 : 484;
        let hasFish = false;
        for (let f = 0; f < fishes.length; f++) {
          if (fishes[f].x >= gapX - 16 && fishes[f].x <= gapX + gapW + 16) {
            hasFish = true;
            if (Number.isFinite(fishes[f].y)) {
              surfaceY = Math.min(surfaceY, fishes[f].y);
            }
          }
        }
        pits.push({
          x: gapX,
          w: gapW,
          surfaceY: clampSurfaceY(surfaceY),
          hasFish,
          waterTone
        });
      }

      for (let f = 0; f < fishes.length; f++) {
        const fx = fishes[f].x;
        const inPit = pits.some((p) => fx >= p.x - 16 && fx <= p.x + p.w + 16);
        const inSolid = merged.some((g) => fx >= g.x && fx <= g.end);
        if (!inPit && !inSolid) {
          let startX = Math.max(0, fx - 64);
          let endX = fx + 64;
          for (let j = 0; j < merged.length; j++) {
            const m = merged[j];
            if (m.end <= startX || m.x >= endX) continue;
            if (m.x <= startX && m.end >= endX) {
              startX = endX;
              break;
            }
            if (m.x <= startX && m.end > startX) {
              startX = m.end;
            } else if (m.x < endX && m.end >= endX) {
              endX = m.x;
            }
          }
          if (endX - startX > 12) {
            pits.push({
              x: startX,
              w: endX - startX,
              surfaceY: clampSurfaceY(fishes[f].y),
              hasFish: true,
              waterTone
            });
          }
        }
      }
      return pits;
    }

    emitJumpingFishSplash(fish, waterSurfaceY, color) {
      if (!fish || !fish.splashEvent) return;
      const fx = fish.x + (fish.w || 28) * 0.5;
      if (fx >= this.cameraX - 80 && fx <= this.cameraX + LOGICAL_W + 80) {
        this.particles.Burst(fx, waterSurfaceY - 2, color, 9);
      }
    }

    isTeideCableCarLevel() {
      return (
        this.isCanariasCity() &&
        this.levelData &&
        (this.levelData.id === 4 || this.levelIndex === 3 || this.levelData.theme === 'canarias_teide')
      );
    }

    isGuaguaLevel() {
      return this.isCanariasCity() && !this.isTeideCableCarLevel();
    }

    usesBusOrGuaguaCinematic() {
      return (
        this.isMallorcaCity() ||
        this.isGuaguaLevel() ||
        this.isRosarioCity() ||
        this.isCordobaCity() ||
        this.isUshuaiaCity() ||
        this.isChileBusCity()
      );
    }

    persistClearedZoneProgress() {
      const wasCompletedBefore = this.isCityCompleted(this.cityKey);
      this.carriedPowerUp = (this.player && this.player.activePowerUp) || this.carriedPowerUp || null;
      this.survivalRiskMode = false;
      this.saveHighScore();
      if (global.WorldProgress) {
        const defs = global.CITY_DEFS || {};
        const def = defs[this.cityKey];
        const nextCityKey = def ? def.next : null;
        const wasNextCityUnlocked =
          nextCityKey && typeof global.WorldProgress.isUnlocked === 'function'
            ? global.WorldProgress.isUnlocked(nextCityKey)
            : true;
        const wasSaUnlocked =
          typeof global.WorldProgress.isContinentUnlocked === 'function'
            ? global.WorldProgress.isContinentUnlocked('southamerica')
            : false;
        const wasChileUnlocked =
          typeof global.WorldProgress.isContinentUnlocked === 'function'
            ? global.WorldProgress.isContinentUnlocked('chile')
            : false;

        const zoneNum = (this.levelIndex | 0) + 1;
        const res = global.WorldProgress.completeZone(this.cityKey, zoneNum);
        if (res && res.isLastZone) {
          global.WorldProgress.complete(this.cityKey);
          const chileTempLocked =
            typeof global.isCountryLocked === 'function'
              ? global.isCountryLocked('chile')
              : !!(global.LOCKED_COUNTRIES && global.LOCKED_COUNTRIES.chile);
          if (this.cityKey === 'canarias' && !wasSaUnlocked && !this.pendingContinentUnlock) {
            this.pendingContinentUnlock = { from: 'spain', to: 'argentina' };
          } else if (this.cityKey === 'ushuaia' && !chileTempLocked && !wasChileUnlocked && !this.pendingContinentUnlock) {
            this.pendingContinentUnlock = { from: 'argentina', to: 'chile' };
          } else if (nextCityKey && !wasNextCityUnlocked && !this.pendingCityUnlock) {
            const scope = this.isChileCity(this.cityKey)
              ? 'chile'
              : (['buenosaires', 'rosario', 'cordoba', 'ushuaia'].includes(this.cityKey) ? 'southamerica' : 'spain');
            this.pendingCityUnlock = { from: this.cityKey, to: nextCityKey, scope };
          }
        }
        this.syncLivesToSlot();
      }
      if (!wasCompletedBefore) {
        this.setPostGameOverActive(false);
      }
    }

    getLevelClearTallyDuration() {
      return this.cinematicPerfectZone ? 0.96 : 0.76;
    }

    finalizeZoneClear() {
      this.irisRadius = 0;
      this.score =
        this.cinematicBaseScore +
        this.cinematicTimeBonus +
        this.cinematicCoinBonus +
        (this.cinematicPerfectBonus || 0);
      if (this.cinematicPerfectZone && this.sound) {
        if (typeof this.sound.play1Up === 'function') {
          this.sound.play1Up();
        } else if (typeof this.sound.oneUp === 'function') {
          this.sound.oneUp();
        }
      }
      this.persistClearedZoneProgress();
      this.levelClearScreenTime = 0;
      this.levelClearTallyElapsed = 0;
      this.levelClearTallyDone = false;
      this.levelClearFireworkTimer = 0.15;
      this.levelClearParticles = new global.Entities.ParticleSystem();
      this.state = 'level_clear';
    }

    confirmLevelClear() {
      if (this.state !== 'level_clear') return;
      this.preserveSessionHearts();
      if (!this.levelClearTallyDone) {
        this.levelClearTallyDone = true;
        this.levelClearTallyElapsed = this.getLevelClearTallyDuration();
        return;
      }
      this.nextLevel();
    }

    updateLevelClearScreen(dt) {
      this.levelClearScreenTime += dt;
      const tallyDur = this.getLevelClearTallyDuration();
      if (!this.levelClearTallyDone) {
        this.levelClearTallyElapsed = Math.min(tallyDur, this.levelClearTallyElapsed + dt);
        if (this.levelClearTallyElapsed >= tallyDur) {
          this.levelClearTallyDone = true;
        }
      }
      if (this.levelClearScreenTime >= 14.0) {
        this.levelClearFireworkTimer -= dt;
        if (this.levelClearFireworkTimer <= 0) {
          this.levelClearFireworkTimer = 0.55 + Math.random() * 0.65;
          const sideBand = Math.random() < 0.5;
          const fx = sideBand
            ? (Math.random() < 0.5 ? 70 + Math.random() * 195 : LOGICAL_W - 70 - Math.random() * 195)
            : 180 + Math.random() * 600;
          const fy = sideBand ? 55 + Math.random() * 340 : 40 + Math.random() * 120;
          const palette = ['#fbbf24', '#f43f5e', '#38bdf8', '#22c55e', '#a855f7', '#fb923c', '#f472b6'];
          const color = palette[Math.floor(Math.random() * palette.length)];
          const accent = palette[(palette.indexOf(color) + 2) % palette.length];
          if (this.levelClearParticles) {
            this.levelClearParticles.Burst(fx, fy, color, 24);
            this.levelClearParticles.Burst(fx, fy, accent, 10);
          }
          if (this.sound && typeof this.sound.playDistantFirework === 'function') {
            this.sound.playDistantFirework();
          }
        }
      }
      if (this.levelClearParticles) {
        this.levelClearParticles.update(dt);
      }
    }

    updateMenuLeaderDemo(dt) {
      if (this.menuDemoLeader !== this.selectedCharacter) {
        this.menuDemoLeader = this.selectedCharacter;
        this.menuDemoTimer = 0;
        this.menuDemoSkillTriggered = false;
        this.menuDemoParticles = new global.Entities.ParticleSystem();
      }
      const prevTimer = this.menuDemoTimer;
      this.menuDemoTimer = (this.menuDemoTimer + dt) % 4.2;
      if (this.menuDemoTimer < prevTimer) {
        this.menuDemoSkillTriggered = false;
      }

      const isNico = this.selectedCharacter === 'nico';
      const triggerAt = isNico ? 3.14 : 3.0;
      if (this.menuDemoTimer >= triggerAt && !this.menuDemoSkillTriggered) {
        this.menuDemoSkillTriggered = true;
        const cardX = isNico ? 175 : 520;
        const fxX = cardX + 265 * 0.5 - 2;
        const fxY = 110 + 62;
        if (this.menuDemoParticles) {
          if (isNico) {
            this.menuDemoParticles.EarthquakeWave(fxX, fxY + 4, 0.54);
          } else {
            this.menuDemoParticles.HypnoticHeartWave(fxX, fxY - 12, 0.48);
          }
        }
      }
      if (this.menuDemoParticles) {
        this.menuDemoParticles.update(dt);
      }
    }

    startLevelClearCinematic() {
      if (this.state === 'level_cinematic' || this.state === 'level_clear') return;
      this.preserveSessionHearts();
      this.isAbductedByCheat = false;
      this.abductionCheat = null;
      this.isBiplaneFlightCheat = false;
      this.biplaneFlightCheat = null;
      if (this.sound && typeof this.sound.stopBiplaneAmbience === 'function') {
        this.sound.stopBiplaneAmbience();
      }
      this.etHomeBuffer = '';
      this.pwingBuffer = '';
      this.airTourBuffer = '';
      this.ghostBuffer = '';
      if (this.player) {
        this.player.hiddenInMetro = false;
        this.player.dropThroughTimer = 0;
      }
      if (this.partner) {
        this.partner.hiddenInMetro = false;
        this.partner.dropThroughTimer = 0;
      }
      if (this.tina) {
        this.tina.hiddenInMetro = false;
        this.tina.dropThroughTimer = 0;
      }
      this.state = 'level_cinematic';
      this.cinematicTimer = 0;

      // Bono de Zona Perfecta (completar zona de punta a punta sin recibir golpes ni perder vidas)
      const isPerfectZone = !this.tookDamageInZone;
      this.cinematicPerfectZone = isPerfectZone;
      this.cinematicPerfectBonus = isPerfectZone ? 500 : 0;
      if (isPerfectZone) {
        this.grantExtraLife();
      }
      this.persistClearedZoneProgress();

      // 1. Congelar controles del jugador y detener música de fondo
      this.clearTransientInput();
      this.sound.stopMusic();
      this.sound.setHurryUp(false);
      this.hurryUpTriggered = false;

      // 2. Iniciar Fanfarria (Final_Nivel.mp3) inmediatamente al tocar la bandera de meta en todas las zonas
      if (this.isTeideCableCarLevel() && typeof this.sound.playSpainFinaleFanfare === 'function') {
        this.sound.playSpainFinaleFanfare();
      } else {
        this.sound.playOriginalVictoryFanfare();
      }
      this.cinematicBaseScore = this.score + 200; // +200 pts base por tocar la bandera
      this.score = this.cinematicBaseScore;
      if (this.cinematicPerfectZone && this.particles && this.levelData) {
        const flagDrawX = this.getGoalFlagDrawX();
        this.particles.Burst(flagDrawX + 12, this.levelData.flagY + 12, '#fde047', 26);
        this.particles.Burst(flagDrawX + 12, this.levelData.flagY + 12, '#4ade80', 16);
        this.particles.FloatingText(
          flagDrawX - 66,
          Math.max(66, this.levelData.flagY - 22),
          '🌟 ¡ZONA PERFECTA! +1 VIDA · +500',
          '#fde047'
        );
      }
      const remainingSeconds = Math.max(0, Math.floor(this.levelTimer));
      this.cinematicInitialTimeLeft = remainingSeconds;
      this.cinematicTimeLeft = remainingSeconds;
      this.cinematicTimeBonus = remainingSeconds * 50;
      this.cinematicCoinsTallied = 0;
      this.cinematicCoinBonus = this.levelCoins * 20;
      this.cinematicTickAccum = 0;
      this.cinematicMetroAnnounced = false;
      this.cinematicTallyFinished = false;
      this.irisRadius = Math.hypot(LOGICAL_W, LOGICAL_H);

      // Alinear al trío en suelo firme frente a la meta
      const groundTop = this.levelData.flagY + 68;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.y = groundTop - this.player.h;
      this.player.onGround = true;
      this.player.isGrounded = true;
      this.player.isCrouching = false;
      this.player.isGroundPounding = false;

      // Estado específico de la cinemática de Parada de Autobús EMT (Mallorca) y Metro (BCN/MAD)
      this.cinematicPartyHidden = false;
      this.cinematicBusExited = false;
      this.cinematicBusExitedTimer = 0;
      this.cinematicBusArrivedSfx = false;
      this.cinematicBusDepartSfx = false;
      this.cinematicBusDoorsOpen = false;
      this.cinematicBusWheelAngle = 0;
      this.cinematicBusFacing = 'left';
      this.cinematicBusTurned = false;
      this.cinematicBusSuspensionY = 0;
      this.cinematicBusKneelDust = false;

      this.cinematicCableCarDoorsOpen = false;
      this.cinematicCableCarExited = false;
      this.cinematicCableCarExitedTimer = 0;
      this.cinematicCableCarAscendSfx = false;
      this.cinematicCableCarX = 0;
      this.cinematicCableCarY = 0;
      this.cinematicCableCarAngle = Math.atan2(736, 1188);

      this.cinematicMetroWalkElapsed = 0;
      this.cinematicMetroAllHidden = false;
      this.cinematicMetroIrisTimer = 0;
      this.cinematicMetroStepAccum = 0;
      this.cinematicMetroStepCount = 0;

      if (this.isTeideCableCarLevel()) {
        const stopX = this.levelData.flagX + 78;
        this.player.state = 'active';
        this.player.hiddenInMetro = false;
        this.player.x = stopX - 32;
        this.player.facing = 'left';
        this.player.animState = 'idle';

        if (this.partner) {
          this.partner.state = 'active';
          this.partner.hiddenInMetro = false;
          this.partner.x = stopX - 54;
          this.partner.y = groundTop - this.partner.h;
          this.partner.vx = 0;
          this.partner.vy = 0;
          this.partner.onGround = true;
          this.partner.isGrounded = true;
          this.partner.facing = 'left';
        }
        if (this.tina) {
          this.tina.state = 'active';
          this.tina.hiddenInMetro = false;
          this.tina.x = stopX - 76;
          this.tina.y = groundTop - this.tina.h;
          this.tina.vx = 0;
          this.tina.vy = 0;
          this.tina.onGround = true;
          this.tina.isGrounded = true;
          this.tina.facing = 'left';
          this.tina.targetItem = null;
        }
        const startPose = this.getTeideCableCarPose(null, -140); // Fuera del borde superior izquierdo (y < -100)
        this.cinematicCableCarStartPulleyX = startPose.pulleyX;
        this.cinematicCableCarPulleyX = startPose.pulleyX;
        this.cinematicCableCarDockPulleyX = startPose.dockPulleyX;
        this.cinematicCableCarStartX = startPose.x;
        this.cinematicCableCarStartY = startPose.y;
        this.cinematicCableCarX = startPose.x;
        this.cinematicCableCarY = startPose.y;
        this.cinematicCableCarAngle = startPose.cableAngle;
      } else if (this.usesBusOrGuaguaCinematic()) {
        const stopX = this.levelData.flagX + 78;
        const targetCamX = Math.max(
          0,
          Math.min(this.levelData.width - LOGICAL_W, this.levelData.flagX - 240)
        );
        this.player.state = 'active';
        this.player.hiddenInMetro = false;
        this.player.x = stopX - 24;
        this.player.facing = 'right';
        this.player.animState = 'idle';

        if (this.partner) {
          this.partner.state = 'active';
          this.partner.hiddenInMetro = false;
          this.partner.x = stopX - 54;
          this.partner.y = groundTop - this.partner.h;
          this.partner.vx = 0;
          this.partner.vy = 0;
          this.partner.onGround = true;
          this.partner.isGrounded = true;
          this.partner.facing = 'right';
        }
        if (this.tina) {
          this.tina.state = 'active';
          this.tina.hiddenInMetro = false;
          this.tina.x = stopX - 86;
          this.tina.y = groundTop - this.tina.h;
          this.tina.vx = 0;
          this.tina.vy = 0;
          this.tina.onGround = true;
          this.tina.isGrounded = true;
          this.tina.facing = 'right';
          this.tina.targetItem = null;
        }

        // El autobús/guagua entra y sale siempre por el borde DERECHO sobre suelo firme continuo
        this.cinematicBusFacing = 'left';
        this.cinematicBusTurned = false;
        this.cinematicBusStartX = Math.max(this.cameraX, targetCamX) + LOGICAL_W + 32;
        this.cinematicBusX = this.cinematicBusStartX;
        this.cinematicBusY = groundTop;
      } else {
        this.initMetroCinematic(groundTop);
      }
    }

    initMetroCinematic(groundTop) {
      const startLeaderX = Math.max(
        this.levelData.flagX - 14,
        Math.min(this.levelData.flagX + 10, this.player.x)
      );
      this.player.state = 'entering_metro';
      this.player.hiddenInMetro = false;
      this.player.x = startLeaderX;
      this.player.y = groundTop - this.player.h;
      this.player.facing = 'right';
      this.player.animState = 'entering_metro';

      if (this.partner) {
        this.partner.state = 'entering_metro';
        this.partner.hiddenInMetro = false;
        this.partner.x = Math.min(
          startLeaderX - 26,
          Math.max(startLeaderX - 42, this.partner.x)
        );
        this.partner.y = groundTop - this.partner.h;
        this.partner.vx = 0;
        this.partner.vy = 0;
        this.partner.onGround = true;
        this.partner.isGrounded = true;
        this.partner.facing = 'right';
      }

      if (this.tina) {
        this.tina.state = 'entering_metro';
        this.tina.hiddenInMetro = false;
        this.tina.x = Math.min(
          startLeaderX - 54,
          Math.max(startLeaderX - 72, this.tina.x)
        );
        this.tina.y = groundTop - this.tina.h;
        this.tina.vx = 0;
        this.tina.vy = 0;
        this.tina.onGround = true;
        this.tina.isGrounded = true;
        this.tina.facing = 'right';
        this.tina.targetItem = null;
      }
    }

    updateLevelCinematic(dt) {
      this.cinematicTimer += dt;
      this.particles.update(dt);

      // Liquidación secuencial rápida de tiempo restante (50 pts/s) y monedas al marcador
      this.cinematicTickAccum += dt;
      if (this.cinematicTickAccum >= 0.042 && !this.cinematicTallyFinished) {
        this.cinematicTickAccum = 0;
        let ticked = false;

        if (this.cinematicTimeLeft > 0) {
          const step = Math.min(this.cinematicTimeLeft, 2);
          this.cinematicTimeLeft -= step;
          this.score += step * 50;
          ticked = true;
        }
        if (this.cinematicCoinsTallied < this.levelCoins) {
          this.cinematicCoinsTallied++;
          this.score += 20;
          ticked = true;
        }

        if (!ticked) {
          this.cinematicTallyFinished = true;
          this.score =
            this.cinematicBaseScore +
            this.cinematicTimeBonus +
            this.cinematicCoinBonus +
            (this.cinematicPerfectBonus || 0);
          this.saveHighScore();
        }
      }

      this.levelCompleteSequence(dt);
    }

    /**
     * Secuencia de victoria separada estrictamente por ciudad:
     * - Mallorca ('mallorca' / 'palma'): Cinemática de Autobús EMT.
     * - Barcelona / Madrid: Descenso continuo por las escaleras del Metro + Iris Out.
     */
    levelCompleteSequence(dt) {
      if (this.isTeideCableCarLevel()) {
        this.updateCableCarCinematic(dt);
      } else if (this.usesBusOrGuaguaCinematic()) {
        this.updateBusCinematic(dt);
      } else {
        this.updateMetroCinematic(dt);
      }
    }

    updateBusCinematic(dt) {
      const stopX = this.levelData.flagX + 78;
      const groundTop = this.levelData.flagY + 68;
      const targetCamX = Math.max(
        0,
        Math.min(this.levelData.width - LOGICAL_W, this.levelData.flagX - 240)
      );
      this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 5);

      const nextDest =
        this.levelData.nextDestination ||
        (this.isCanariasCity()
          ? 'Pico del Teide'
          : this.isRosarioCity()
            ? 'La Florida'
            : this.isCordobaCity()
              ? 'Villa Carlos Paz'
              : this.isUshuaiaCity()
                ? 'Tren del Fin del Mundo'
                : this.isChileBusCity()
                  ? 'Quinta Vergara'
                  : 'Castell de Bellver');
      if (this.cinematicTimer >= 0.05 && !this.cinematicMetroAnnounced) {
        this.cinematicMetroAnnounced = true;
        const zoneNum = (this.levelIndex | 0) + 1;
        if (this.isCanariasCity() && typeof this.sound.playCanariasAnnouncement === 'function') {
          this.sound.playCanariasAnnouncement(nextDest, false, zoneNum);
        } else if (this.isRosarioCity()) {
          this.sound.playMetroAnnouncement(nextDest, 'rosario', zoneNum);
        } else if (this.isCordobaCity()) {
          this.sound.playMetroAnnouncement(nextDest, 'cordoba', zoneNum);
        } else if (this.isUshuaiaCity()) {
          this.sound.playMetroAnnouncement(nextDest, 'ushuaia', zoneNum);
        } else if (this.isChileBusCity()) {
          this.sound.playMetroAnnouncement(nextDest, this.normalizeCityKey(this.cityKey), zoneNum);
        } else {
          this.sound.playMetroAnnouncement(nextDest, 'palma', zoneNum);
        }
      }

      const startBusX = this.cinematicBusStartX;
      const alignBusX = stopX - 4;
      const doorTargetX = alignBusX + 62;
      const exitEdgeX = this.cameraX + LOGICAL_W + 32;

      // Espera inicial (0s .. 1.00s): Los 3 personajes aguardan en la parada mirando a la derecha
      if (this.cinematicTimer < 1.00) {
        this.cinematicBusSuspensionY = 0;
        this.cinematicBusFacing = 'left';
        this.player.facing = 'right';
        this.player.animState = 'idle';
        this.player.animTimer += dt;
        if (this.partner) {
          this.partner.facing = 'right';
          this.partner.animTimer += dt;
        }
        if (this.tina) {
          this.tina.facing = 'right';
          this.tina.animTimer += dt;
        }
      } else if (this.cinematicTimer < 2.40) {
        // Fase 1 (1.00s .. 2.40s): Entra desde el borde DERECHO frenando suavemente con efecto de suspensión neumática
        this.cinematicBusFacing = 'left';
        if (!this.cinematicBusArrivedSfx) {
          this.cinematicBusArrivedSfx = true;
          if (typeof this.sound.busArrival === 'function') {
            this.sound.busArrival();
          }
        }
        const u = Math.min(1, (this.cinematicTimer - 1.00) / 1.40);
        const ease = 1 - Math.pow(1 - u, 3);
        const prevX = this.cinematicBusX;
        this.cinematicBusX = startBusX + (alignBusX - startBusX) * ease;
        this.cinematicBusWheelAngle += Math.abs(this.cinematicBusX - prevX) * 0.08;
        this.cinematicBusSuspensionY = u > 0.65 ? Math.sin(((u - 0.65) / 0.35) * Math.PI) * 2.6 : 0;
        if (u > 0.72 && Math.random() < 0.30) {
          this.particles.Dust(this.cinematicBusX + 42, groundTop - 4);
        }
        this.player.facing = 'right';
        this.player.animState = 'idle';
        if (this.partner) this.partner.facing = 'right';
        if (this.tina) this.tina.facing = 'right';
      } else if (this.cinematicTimer < 3.45) {
        // Fase 2 (2.40s .. 3.45s): Detenido en la parada, baja la suspensión neumática, abre puertas plegables y sube el trío
        this.cinematicBusX = alignBusX;
        this.cinematicBusDoorsOpen = this.cinematicTimer < 3.12;
        if (this.cinematicBusDoorsOpen) {
          const k = this.cinematicTimer - 2.40;
          this.cinematicBusSuspensionY = 2.4 + Math.sin(k * 15) * Math.exp(-k * 6.5) * 2.2;
          if (!this.cinematicBusKneelDust) {
            this.cinematicBusKneelDust = true;
            this.particles.Dust(alignBusX + 58, groundTop - 6);
            this.particles.Dust(alignBusX + 165, groundTop - 6);
          }
        } else {
          this.cinematicBusSuspensionY = Math.max(0, this.cinematicBusSuspensionY * Math.max(0, 1 - dt * 10));
        }
        if (!this.cinematicPartyHidden) {
          this.player.facing = 'right';
          this.player.x += (doorTargetX - 10 - this.player.x) * Math.min(1, dt * 5.8);
          this.player.animState = 'run';
          this.player.animTimer += dt * 1.3;
          if (this.partner) {
            this.partner.facing = 'right';
            this.partner.x += (doorTargetX - 16 - this.partner.x) * Math.min(1, dt * 5.8);
            this.partner.animTimer += dt * 1.3;
          }
          if (this.tina) {
            this.tina.facing = 'right';
            this.tina.x += (doorTargetX - 22 - this.tina.x) * Math.min(1, dt * 5.8);
            this.tina.animTimer += dt * 1.3;
          }
          if (this.cinematicTimer >= 2.86) {
            this.cinematicPartyHidden = true;
            this.particles.Burst(doorTargetX, groundTop - 26, '#38bdf8', 14);
          }
        }
        if (this.cinematicTimer >= 3.25 && !this.cinematicBusTurned) {
          this.cinematicBusTurned = true;
          this.cinematicBusFacing = 'right';
          this.particles.Dust(alignBusX + 42, groundTop - 4);
          this.particles.Dust(alignBusX + 158, groundTop - 4);
        }
      } else if (!this.cinematicBusExited) {
        // Fase 3 (3.45s hasta salir): Da la vuelta orientado hacia la DERECHA y sale por el mismo borde DERECHO
        this.cinematicBusDoorsOpen = false;
        this.cinematicBusFacing = 'right';
        if (!this.cinematicBusDepartSfx) {
          this.cinematicBusDepartSfx = true;
          if (typeof this.sound.busDepart === 'function') {
            this.sound.busDepart();
          }
        }
        const d = this.cinematicTimer - 3.45;
        const busSpeed = Math.min(580, 90 + d * 460);
        const dx = busSpeed * dt;
        this.cinematicBusX += dx;
        this.cinematicBusWheelAngle += Math.abs(dx) * 0.08;
        if (Math.random() < 0.35) {
          this.particles.Dust(this.cinematicBusX + 4, groundTop - 16);
        }

        // Fase 4 (Cierre): Apenas sale por completo del borde derecho pasa al cierre Iris Out (fanfarria ya sonando desde la meta)
        if (this.cinematicBusX >= exitEdgeX) {
          this.cinematicBusExited = true;
          this.cinematicBusExitedTimer = 0;
          this.particles.Burst(this.cameraX + LOGICAL_W - 36, groundTop - 75, '#fbbf24', 24);
          this.particles.Burst(stopX, groundTop - 90, '#fbbf24', 18);
        }
      } else {
        // Cierre post-salida: Cartel "¡NIVEL COMPLETADO!", Iris Out negro y transición a puntajes
        this.cinematicBusExitedTimer += dt;
        const maxR = Math.hypot(LOGICAL_W, LOGICAL_H);
        this.irisCenterX = LOGICAL_W * 0.5;
        this.irisCenterY = LOGICAL_H * 0.48;

        if (this.cinematicBusExitedTimer < 1.55) {
          this.irisRadius = maxR;
        } else if (this.cinematicBusExitedTimer < 2.05) {
          const p = (this.cinematicBusExitedTimer - 1.55) / 0.5;
          this.irisRadius = Math.max(0, maxR * (1 - p));
        } else {
          this.finalizeZoneClear();
        }
      }
    }

    getTeideCableCarPose(pulleyX = null, targetCabinY = null) {
      const stopX = this.levelData.flagX + 78;
      const groundTop = this.levelData.flagY + 68;
      const cableEndX = stopX + 68;
      const cableEndY = groundTop - 150;
      const cableSlope = 736 / 1188;
      const rightSlope = -800 / 1000;
      const cabinHeightFromPulley = 168; // Brazo alargado + cabina 1.6x -> base ~4px sobre groundTop al parar
      const cabinHalfCenter = 80;
      const resolvedPulleyX = Number.isFinite(pulleyX)
        ? pulleyX
        : cableEndX + (((Number.isFinite(targetCabinY) ? targetCabinY : -140) - cabinHeightFromPulley) - cableEndY) / cableSlope;
      const dxFromApex = resolvedPulleyX - cableEndX;
      const pulleyY = dxFromApex <= 0
        ? cableEndY + dxFromApex * cableSlope
        : cableEndY + dxFromApex * rightSlope;
      const leftAngle = Math.atan2(736, 1188);
      const rightAngle = Math.atan2(-800, 1000);
      const angleBlend = Math.max(0, Math.min(1, (dxFromApex + 16) / 36));
      const cableAngle = leftAngle + (rightAngle - leftAngle) * angleBlend;
      return {
        x: resolvedPulleyX - cabinHalfCenter,
        y: pulleyY + cabinHeightFromPulley,
        pulleyX: resolvedPulleyX,
        pulleyY,
        cableAngle,
        cableEndX,
        dockPulleyX: stopX + 33
      };
    }

    updateCableCarCinematic(dt) {
      const stopX = this.levelData.flagX + 78;
      const dockPulleyX = Number.isFinite(this.cinematicCableCarDockPulleyX)
        ? this.cinematicCableCarDockPulleyX
        : stopX + 33;
      const dockPose = this.getTeideCableCarPose(dockPulleyX);
      const startPulleyX = Number.isFinite(this.cinematicCableCarStartPulleyX)
        ? this.cinematicCableCarStartPulleyX
        : dockPulleyX - 960;
      const targetCamX = Math.max(
        0,
        Math.min(this.levelData.width - LOGICAL_W, this.levelData.flagX - LOGICAL_W * 0.42)
      );
      this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 5);

      if (this.cinematicTimer >= 0.05 && !this.cinematicMetroAnnounced) {
        this.cinematicMetroAnnounced = true;
        if (typeof this.sound.playCanariasAnnouncement === 'function') {
          this.sound.playCanariasAnnouncement('Cumbre del Teide · ¡Rumbo a Sudamérica!', true, 4);
        }
      }

      if (this.cinematicTimer < 0.35) {
        const startPose = this.getTeideCableCarPose(startPulleyX);
        this.cinematicCableCarPulleyX = startPulleyX;
        this.cinematicCableCarX = startPose.x;
        this.cinematicCableCarY = startPose.y;
        this.cinematicCableCarAngle = startPose.cableAngle;
        this.player.facing = 'left';
        this.player.animState = 'idle';
        this.player.animTimer += dt;
        if (this.partner) {
          this.partner.facing = 'left';
          this.partner.animTimer += dt;
        }
        if (this.tina) {
          this.tina.facing = 'left';
          this.tina.animTimer += dt;
        }
      } else if (this.cinematicTimer < 2.15) {
        if (!this.cinematicBusArrivedSfx) {
          this.cinematicBusArrivedSfx = true;
          if (typeof this.sound.cableCarChime === 'function') this.sound.cableCarChime();
        }
        const u = Math.min(1, (this.cinematicTimer - 0.35) / 1.8);
        const ease = 1 - Math.pow(1 - u, 3);
        this.cinematicCableCarPulleyX = startPulleyX + (dockPulleyX - startPulleyX) * ease;
        const pose = this.getTeideCableCarPose(this.cinematicCableCarPulleyX);
        this.cinematicCableCarX = pose.x;
        this.cinematicCableCarY = pose.y;
        this.cinematicCableCarAngle = pose.cableAngle;
        this.player.facing = 'left';
        this.player.animState = 'idle';
        this.player.animTimer += dt;
        if (this.partner) this.partner.animTimer += dt;
        if (this.tina) this.tina.animTimer += dt;
      } else if (this.cinematicTimer < 3.15) {
        this.cinematicCableCarPulleyX = dockPulleyX;
        this.cinematicCableCarX = dockPose.x;
        this.cinematicCableCarY = dockPose.y;
        this.cinematicCableCarAngle = dockPose.cableAngle;
        this.cinematicCableCarDoorsOpen = this.cinematicTimer < 2.95;
        if (!this.cinematicPartyHidden) {
          const boardX = dockPose.x + 68;
          this.player.facing = 'right';
          this.player.x += (boardX - this.player.x) * Math.min(1, dt * 6.5);
          this.player.animState = 'run';
          this.player.animTimer += dt * 1.3;
          if (this.partner) {
            this.partner.facing = 'right';
            this.partner.x += (boardX - 8 - this.partner.x) * Math.min(1, dt * 6.5);
            this.partner.animTimer += dt * 1.3;
          }
          if (this.tina) {
            this.tina.facing = 'right';
            this.tina.x += (boardX - 16 - this.tina.x) * Math.min(1, dt * 6.5);
            this.tina.animTimer += dt * 1.3;
          }
          if (this.cinematicTimer >= 2.75) {
            this.cinematicPartyHidden = true;
            this.particles.Burst(dockPose.x + 80, dockPose.y - 48, '#facc15', 22);
          }
        }
      } else if (!this.cinematicCableCarExited) {
        this.cinematicCableCarDoorsOpen = false;
        if (!this.cinematicCableCarAscendSfx) {
          this.cinematicCableCarAscendSfx = true;
          if (typeof this.sound.cableCarAscend === 'function') this.sound.cableCarAscend();
        }
        const d = this.cinematicTimer - 3.15;
        const speed = Math.min(500, 95 + d * 250);
        const curPulleyX = Number.isFinite(this.cinematicCableCarPulleyX) ? this.cinematicCableCarPulleyX : dockPulleyX;
        const cableEndX = dockPose.cableEndX;
        const unitX = curPulleyX < cableEndX
          ? 1188 / Math.hypot(1188, 736)
          : 1000 / Math.hypot(1000, 800);
        // Avanza continuamente hacia la derecha: rebasa la estación y asciende en diagonal por el cable derecho
        this.cinematicCableCarPulleyX = curPulleyX + speed * unitX * dt;
        const pose = this.getTeideCableCarPose(this.cinematicCableCarPulleyX);
        this.cinematicCableCarX = pose.x;
        this.cinematicCableCarY = pose.y;
        this.cinematicCableCarAngle = pose.cableAngle;
        if (Math.random() < 0.4) {
          this.particles.Sparkle(this.cinematicCableCarX + 80, this.cinematicCableCarY - 46, '#facc15');
        }
        const scrCabinLeft = (this.cinematicCableCarX + 14) - this.cameraX;
        if (scrCabinLeft > LOGICAL_W + 24 && this.cinematicCableCarY < 90) {
          this.cinematicCableCarExited = true;
          this.cinematicCableCarExitedTimer = 0;
          this.particles.Burst(this.cameraX + LOGICAL_W - 20, Math.max(24, this.cinematicCableCarY - 40), '#fde047', 26);
        }
      } else {
        this.cinematicCableCarExitedTimer += dt;
        const maxR = Math.hypot(LOGICAL_W, LOGICAL_H);
        this.irisCenterX = LOGICAL_W * 0.5;
        this.irisCenterY = LOGICAL_H * 0.48;
        if (this.cinematicCableCarExitedTimer < 1.65) {
          this.irisRadius = maxR;
        } else if (this.cinematicCableCarExitedTimer < 2.15) {
          const p = (this.cinematicCableCarExitedTimer - 1.65) / 0.5;
          this.irisRadius = Math.max(0, maxR * (1 - p));
        } else {
          this.finalizeZoneClear();
        }
      }
    }

    updateMetroCinematic(dt) {
      const metroX = this.levelData.flagX + 78;
      const groundTop = this.levelData.flagY + 68;
      const stairStartX = metroX + 2;
      const stairMaxX = metroX + 82;

      // Enfocar suavemente la cámara hacia la meta y la boca del Metro
      const targetCamX = Math.max(
        0,
        Math.min(this.levelData.width - LOGICAL_W, this.levelData.flagX - LOGICAL_W * 0.36)
      );
      this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 5);

      // Megafonía del Metro mientras el equipo desciende por la escalera
      if (this.cinematicTimer >= 0.05 && !this.cinematicMetroAnnounced) {
        this.cinematicMetroAnnounced = true;
        const nextDest = this.levelData.nextDestination || 'El Gòtic';
        this.sound.playMetroAnnouncement(nextDest, this.cityKey, (this.levelIndex | 0) + 1);
      }

      const maxR = Math.hypot(LOGICAL_W, LOGICAL_H);

      if (!this.cinematicMetroAllHidden) {
        this.cinematicMetroWalkElapsed += dt;
        this.irisRadius = maxR;

        const stepWalker = (entity, walkSpeedX, descentSpeedY, hideBelowY) => {
          if (!entity || entity.hiddenInMetro) return true;
          entity.state = 'entering_metro';
          entity.facing = 'right';
          entity.vx = walkSpeedX;
          entity.animTimer += dt * 1.45;

          if (entity.x < stairMaxX) {
            entity.x = Math.min(stairMaxX, entity.x + walkSpeedX * dt);
          }
          if (entity.x >= stairStartX) {
            const dy = descentSpeedY * dt;
            entity.y += dy;
          } else {
            entity.y = groundTop - entity.h;
          }

          if (entity.y >= hideBelowY) {
            entity.hiddenInMetro = true;
            entity.vx = 0;
            return true;
          }
          return false;
        };

        const playerHidden = stepWalker(this.player, 122, 82, groundTop + 18);
        if (this.player && !this.player.hiddenInMetro) {
          this.player.animState = 'entering_metro';
        }
        const partnerHidden = stepWalker(this.partner, 134, 88, groundTop + 18);
        const tinaHidden = stepWalker(this.tina, 150, 82, groundTop + 16);

        // Pasos rítmicos sincronizados mientras caminan y bajan por los peldaños
        this.cinematicMetroStepAccum += dt;
        if (this.cinematicMetroStepAccum >= 0.19) {
          this.cinematicMetroStepAccum -= 0.19;
          if (this.sound && typeof this.sound.footstep === 'function') {
            this.sound.footstep(this.cinematicMetroStepCount++);
          }
        }

        if (
          this.cinematicMetroWalkElapsed >= 1.2 &&
          playerHidden &&
          partnerHidden &&
          tinaHidden
        ) {
          this.cinematicMetroAllHidden = true;
          this.cinematicMetroIrisTimer = 0;
        }
        return;
      }

      // Recién cuando los 3 sprites quedaron ocultos bajo el umbral de la escalera, cerrar Iris Out
      this.cinematicMetroIrisTimer += dt;
      this.irisCenterX = metroX + 66 - this.cameraX;
      this.irisCenterY = groundTop - 4;

      const irisCloseDuration = 0.85;
      if (this.cinematicMetroIrisTimer < irisCloseDuration) {
        const p = this.cinematicMetroIrisTimer / irisCloseDuration;
        this.irisRadius = Math.max(0, maxR * (1 - p));
      } else if (this.cinematicMetroIrisTimer < 1.0) {
        this.irisRadius = 0;
      } else {
        this.finalizeZoneClear();
      }
    }

    getGoalStationMeta() {
      const busVariant = this.isCanariasCity()
        ? 'canarias'
        : this.isCordobaCity()
        ? 'cordoba'
        : this.isUshuaiaCity()
        ? 'ushuaia'
        : this.isChileBusCity()
        ? 'chile'
        : this.isRosarioCity()
        ? 'rosario'
        : 'palma';
      return {
        isBusOrGuagua: this.usesBusOrGuaguaCinematic(),
        isTeideCable: this.isTeideCableCarLevel(),
        busVariant,
        nextDestination: (this.levelData && this.levelData.nextDestination) || 'El Gòtic'
      };
    }

    getGoalFlagDrawX() {
      if (!this.levelData || !Number.isFinite(this.levelData.flagX)) return 0;
      if (this.sprites && typeof this.sprites.getGoalFlagDrawX === 'function') {
        return this.sprites.getGoalFlagDrawX(this.ctx, this.levelData.flagX, this.getGoalStationMeta());
      }
      return this.levelData.flagX;
    }

    getCheatElapsedMs() {
      const now =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      const wallMs = this.cheatLoadTime ? Math.max(0, now - this.cheatLoadTime) : 0;
      const simMs = Math.max(0, (Number(this.levelTime) || 0) * 1000);
      return Math.max(wallMs, simMs);
    }

    invalidateStartCheat() {
      this.startCheatEligible = false;
      this.startCheatBuffer = '';
    }

    async computeSha256Hex(text) {
      if (
        typeof crypto === 'undefined' ||
        !crypto.subtle ||
        typeof crypto.subtle.digest !== 'function' ||
        typeof TextEncoder === 'undefined'
      ) {
        return '';
      }
      try {
        const encoded = new TextEncoder().encode(String(text || ''));
        const digestBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const bytes = new Uint8Array(digestBuffer);
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
          hex += bytes[i].toString(16).padStart(2, '0');
        }
        return hex;
      } catch (err) {
        return '';
      }
    }

    handleStartCheatKey(code) {
      if (!this.startCheatEligible || this.state !== 'playing') return false;
      if (!code || typeof code !== 'string' || code.indexOf('Numpad') === 0) return false;
      let digit = '';
      if (code === 'Digit6') digit = '6';
      else if (code === 'Digit7') digit = '7';
      else if (code === 'Digit8') digit = '8';
      else if (code === 'Digit9') digit = '9';
      if (!digit) return false;
      this.startCheatBuffer = (this.startCheatBuffer + digit).slice(-7);
      if (this.startCheatBuffer.length === 7) {
        const candidate = this.startCheatBuffer;
        this.computeSha256Hex(candidate).then((hash) => {
          if (!this.startCheatEligible || this.state !== 'playing') return;
          if (
            hash === '04771854716c02aeb1006824cf09a0ae5d03e307d6ff4bea6238823c2417b6a9' ||
            hash === '849e779a26d7524f3c8653c882c12f388d3a8a8e7a041f8665b6c2c38f17c14b'
          ) {
            this.activateStartUnlockCheat();
          }
        });
      }
      return true;
    }

    extractCheatLetter(key, code = '') {
      if (typeof key === 'string' && /^[a-z]$/i.test(key)) {
        return key.toLowerCase();
      }
      if (typeof code === 'string' && /^Key[A-Z]$/.test(code)) {
        return code.slice(3).toLowerCase();
      }
      return '';
    }

    handleEtHomeCheatKey(key, code = '') {
      if (this.state !== 'playing' || this.isAbductedByCheat) return false;
      const ch = this.extractCheatLetter(key, code);
      if (!ch) {
        this.etHomeBuffer = '';
        return false;
      }
      this.etHomeBuffer = (this.etHomeBuffer + ch).slice(-6);
      if (this.etHomeBuffer.length === 6) {
        const candidate = this.etHomeBuffer;
        this.computeSha256Hex(candidate).then((hash) => {
          if (this.state !== 'playing' || this.isAbductedByCheat) return;
          if (
            hash === 'b3826f4273c5832a6b90a39f2e1b876e51924e3b8c0227ec2ab48601434874c5' ||
            hash === 'e676084567b72230392341573a8670a5c88e024a891d0e8f4898067b3d17748b'
          ) {
            this.activateEtHomeCheat();
          }
        });
      }
      return false;
    }

    handlePwingCheatKey(key, code = '') {
      if (this.state !== 'playing' || this.isAbductedByCheat) return false;
      const ch = this.extractCheatLetter(key, code);
      if (!ch) {
        this.pwingBuffer = '';
        return false;
      }
      this.pwingBuffer = (this.pwingBuffer + ch).slice(-5);
      if (this.pwingBuffer.length === 5) {
        const candidate = this.pwingBuffer;
        this.computeSha256Hex(candidate).then((hash) => {
          if (this.state !== 'playing' || this.isAbductedByCheat) return;
          if (
            hash === '13b7a572b988aea60e9c92cc85b231f424e33a66795be745396071cdabb40fb9' ||
            hash === '3406d3d007186e204618d18523f10a496f4d41f3229e695c68627451a874f93e'
          ) {
            this.activatePwingCheat();
          }
        });
      }
      return false;
    }

    handleBiplaneTourCheatKey(key, code = '') {
      if (this.state !== 'playing' || this.isAbductedByCheat || this.isBiplaneFlightCheat) {
        return false;
      }
      const ch = this.extractCheatLetter(key, code);
      if (!ch) {
        this.airTourBuffer = '';
        return false;
      }
      this.airTourBuffer = (this.airTourBuffer + ch).slice(-4);
      if (this.airTourBuffer.length === 4) {
        const candidate = this.airTourBuffer;
        this.computeSha256Hex(candidate).then((hash) => {
          if (this.state !== 'playing' || this.isAbductedByCheat || this.isBiplaneFlightCheat) return;
          if (
            hash === '0f3850ab36e9d43a8615d62d179e484003562531b41a9f517c5f4e7313b00222' ||
            hash === '28c4cd2bd444fcba6fcb0f5f36cfde1bcebe7309c150224fe135a9cbc5f2d636'
          ) {
            this.activateBiplaneTourCheat();
          }
        });
      }
      return false;
    }

    handleGhostCheatKey(key, code = '') {
      if (this.state !== 'playing' && this.state !== 'paused') {
        return false;
      }
      const ch = this.extractCheatLetter(key, code);
      if (!ch) {
        this.ghostBuffer = '';
        return false;
      }
      this.ghostBuffer = (this.ghostBuffer + ch).slice(-4);
      if (this.ghostBuffer.length === 4) {
        const candidate = this.ghostBuffer;
        this.computeSha256Hex(candidate).then((hash) => {
          if (this.state !== 'playing' && this.state !== 'paused') return;
          if (hash === '01b016612d7274bf6dfe6b2fcbe282599956cdff931bd6c1c5d82ef128897ff6') {
            this.toggleGhostMode();
          }
        });
      }
      return false;
    }

    toggleGhostMode() {
      this.ghostBuffer = '';
      this.ghostMode = !this.ghostMode;
      const enabled = this.ghostMode;
      if (this.player) {
        this.player.ghostMode = enabled;
        if (enabled) {
          this.player.slowTimer = 0;
          this.player.hurtTimer = 0;
        }
      }
      this.ghostToastTimer = 2.4;
      this.ghostToastText = enabled
        ? '👻 MODO FANTASMA ACTIVADO'
        : '👻 MODO FANTASMA DESACTIVADO';
      this.ghostToastColor = enabled ? '#67e8f9' : '#cbd5e1';

      if (this.sound) {
        if (enabled && typeof this.sound.powerup === 'function') {
          this.sound.powerup();
        } else if (!enabled && typeof this.sound.menuSelect === 'function') {
          this.sound.menuSelect();
        }
      }
      if (this.particles && this.player) {
        const cx = this.player.x + this.player.w * 0.5;
        const cy = this.player.y + this.player.h * 0.5;
        this.particles.Burst(cx, cy, enabled ? '#67e8f9' : '#94a3b8', 18);
        this.particles.FloatingText(
          this.player.x - 42,
          Math.max(48, this.player.y - 22),
          this.ghostToastText,
          this.ghostToastColor
        );
      }
      return enabled;
    }

    rescueGhostFromPit() {
      if (!this.ghostMode || !this.player) return false;
      this.player.y = 468;
      this.player.vy = -820;
      this.player.onGround = false;
      this.player.jumpsUsed = 0;
      this.player.coyoteTimer = 0.25;
      this.player.isGroundPounding = false;
      if (this.ghostRescueToastCooldown <= 0) {
        this.ghostRescueToastCooldown = 0.9;
        if (this.particles) {
          this.particles.Burst(this.player.x + this.player.w * 0.5, 484, '#67e8f9', 16);
          this.particles.FloatingText(
            this.player.x - 36,
            436,
            '👻 RESCATE FANTASMA',
            '#67e8f9'
          );
        }
      }
      return true;
    }

    activatePwingCheat() {
      if (!this.levelData || !this.player || this.isAbductedByCheat || this.state !== 'playing') {
        return false;
      }
      this.pwingBuffer = '';
      this.player.equipPowerUp('plant');
      this.carriedPowerUp = 'plant';
      this.reservePowerUp = 'angel_wings';
      this.player.reserveItem = 'angel_wings';

      if (this.sound && typeof this.sound.powerup === 'function') {
        this.sound.powerup();
      }
      if (this.particles) {
        const cx = this.player.x + this.player.w * 0.5;
        const cy = this.player.y + this.player.h * 0.5;
        this.particles.Burst(cx, cy, '#fde047', 20);
        this.particles.Burst(cx, cy, '#4ade80', 18);
        this.particles.FloatingText(
          this.player.x - 36,
          Math.max(48, this.player.y - 16),
          '🌿 ¡PLANTA + 🪽 ALAS EN RESERVA!',
          '#fde047'
        );
      }
      return true;
    }

    getGoalFlagHitbox() {
      const goalFlagDrawX = this.getGoalFlagDrawX();
      const flagBoxLeftX = Math.min(this.levelData.flagX, goalFlagDrawX);
      return {
        x: flagBoxLeftX,
        y: this.levelData.flagY - 72,
        w:
          (this.levelData.flagX - flagBoxLeftX) +
          (this.usesBusOrGuaguaCinematic() || this.isTeideCableCarLevel() ? 104 : 44),
        h: 72
      };
    }

    activateEtHomeCheat() {
      if (!this.levelData || !this.player || this.isAbductedByCheat || this.state !== 'playing') {
        return false;
      }
      this.isAbductedByCheat = true;
      this.etHomeBuffer = '';
      this.clearTransientInput();
      if (this.inputManager && typeof this.inputManager.clearTransient === 'function') {
        this.inputManager.clearTransient();
      }

      const actors = [this.player, this.partner, this.tina];
      for (let i = 0; i < actors.length; i++) {
        const a = actors[i];
        if (!a) continue;
        a.hiddenInMetro = false;
        a.vx = 0;
        a.vy = 0;
        a.hangingRope = null;
        a.isHanging = false;
        a.onCable = false;
        a.onZipline = false;
        a.onVine = false;
        a.isGroundPounding = false;
        a.isCrouching = false;
        a.hurtTimer = 0;
        a.ledgeState = null;
        a.standingPlatform = null;
        a.platformVx = 0;
        a.platformVy = 0;
      }

      const startUfoX = Math.max(
        10,
        Math.min(this.levelData.width - 56, this.player.x + this.player.w * 0.5 - 23)
      );
      const hoverY = Math.max(52, Math.min(138, this.player.y - 118));
      const beamLen = Math.max(120, Math.min(280, this.player.y + this.player.h - (hoverY + 14)));
      const goalDropPlayerX = Math.max(
        30,
        Math.min(this.levelData.width - 64, this.levelData.flagX + 6)
      );
      const goalUfoX = goalDropPlayerX + this.player.w * 0.5 - 23;
      const safeSkyY = 34;
      const goalCamX = Math.max(
        0,
        Math.min(this.levelData.width - LOGICAL_W, goalDropPlayerX - LOGICAL_W * 0.42)
      );

      const ufo =
        global.Entities && global.Entities.MiniUfoEnemy
          ? new global.Entities.MiniUfoEnemy(
              startUfoX,
              -48,
              0,
              this.levelData.width,
              0,
              0,
              4.6,
              beamLen
            )
          : {
              x: startUfoX,
              y: -48,
              w: 46,
              h: 24,
              beamActive: false,
              beamWarning: true,
              beamHeight: beamLen,
              animTimer: 0,
              dead: false,
              stunTimer: 0,
              hypnotizedTimer: 0,
              isDisabled: () => false
            };
      ufo.facing = goalUfoX >= startUfoX ? 'right' : 'left';
      ufo.beamWarning = true;
      ufo.beamActive = false;

      this.abductionCheat = {
        phase: 'abducting',
        timer: 0,
        abductDuration: 0.46,
        warpDuration: 1.0,
        ejectDuration: 0.34,
        animTimer: 0,
        ufo,
        startUfoX,
        hoverY,
        goalUfoX,
        safeSkyY,
        goalDropPlayerX,
        cameraStartX: this.cameraX,
        goalCamX,
        warpIntensity: 0,
        flashAlpha: 0,
        ringRadius: 36,
        ejectedOut: false,
        partyStart: {
          px: this.player.x,
          py: this.player.y,
          pax: this.partner ? this.partner.x : this.player.x - 32,
          pay: this.partner ? this.partner.y : this.player.y,
          tx: this.tina ? this.tina.x : this.player.x - 64,
          ty: this.tina ? this.tina.y : this.player.y + 8
        }
      };

      if (this.sound && typeof this.sound.playUfoAbductionSfx === 'function') {
        this.sound.playUfoAbductionSfx();
      }
      if (this.particles) {
        this.particles.Burst(this.player.x + 12, this.player.y + 18, '#22d3ee', 16);
        this.particles.FloatingText(
          this.player.x - 32,
          Math.max(46, this.player.y - 26),
          '🛸 ¡ABDUCCIÓN URITORCO!',
          '#4ade80'
        );
      }
      return true;
    }

    updateEtHomeAbduction(dt) {
      const st = this.abductionCheat;
      if (!st || !this.player || !this.levelData) return;

      st.timer += dt;
      st.animTimer += dt;
      st.ufo.animTimer = st.animTimer;

      // Actualizar plataformas del entorno para mantener el mundo vivo de fondo
      for (let i = 0; i < this.movingPlatforms.length; i++) {
        this.movingPlatforms[i].update(dt);
      }
      for (let i = 0; i < this.fallingPlatforms.length; i++) {
        this.fallingPlatforms[i].update(dt);
      }
      for (let i = 0; i < this.sinkingContainers.length; i++) {
        this.sinkingContainers[i].update(dt);
      }
      for (let i = 0; i < this.ropes.length; i++) {
        this.ropes[i].update(dt);
      }

      if (st.phase === 'abducting') {
        const t = Math.min(1, st.timer / st.abductDuration);
        const ufoT = Math.min(1, t / 0.28);
        const ufoEase = 1 - Math.pow(1 - ufoT, 3);
        st.ufo.y = -48 + (st.hoverY - (-48)) * ufoEase;
        st.ufo.beamHeight = Math.max(
          115,
          Math.min(280, st.partyStart.py + this.player.h - (st.ufo.y + 10) + 14)
        );
        if (t >= 0.14) {
          st.ufo.beamActive = true;
          st.ufo.beamWarning = false;
        } else {
          st.ufo.beamWarning = true;
        }

        const pullRaw = t <= 0.14 ? 0 : Math.min(1, (t - 0.14) / 0.74);
        const pullEase = pullRaw * pullRaw * (3 - 2 * pullRaw);
        const ufoCx = st.ufo.x + st.ufo.w * 0.5;
        const ufoBellyY = st.ufo.y + 10;

        this.player.x = st.partyStart.px + (ufoCx - this.player.w * 0.5 - st.partyStart.px) * pullEase;
        this.player.y = st.partyStart.py + (ufoBellyY - st.partyStart.py) * pullEase;
        this.player.onGround = false;
        this.player.isGrounded = false;
        this.player.vy = -220;
        this.player.animTimer += dt;

        if (this.partner) {
          this.partner.x =
            st.partyStart.pax + (ufoCx - this.partner.w * 0.5 - st.partyStart.pax) * pullEase;
          this.partner.y = st.partyStart.pay + (ufoBellyY - st.partyStart.pay) * pullEase;
          this.partner.onGround = false;
          this.partner.isGrounded = false;
          this.partner.vy = -220;
          this.partner.animTimer += dt;
        }
        if (this.tina) {
          this.tina.x = st.partyStart.tx + (ufoCx - this.tina.w * 0.5 - st.partyStart.tx) * pullEase;
          this.tina.y = st.partyStart.ty + (ufoBellyY - st.partyStart.ty) * pullEase;
          this.tina.onGround = false;
          this.tina.isGrounded = false;
          this.tina.vy = -220;
          this.tina.animTimer += dt;
        }

        if (this.particles && Math.random() < 0.65) {
          this.particles.Sparkle(
            ufoCx + (Math.random() - 0.5) * 28,
            this.player.y + 16,
            Math.random() < 0.5 ? '#4ade80' : '#22d3ee'
          );
        }

        if (pullRaw >= 0.88) {
          this.player.hiddenInMetro = true;
          if (this.partner) this.partner.hiddenInMetro = true;
          if (this.tina) this.tina.hiddenInMetro = true;
        }

        if (st.timer >= st.abductDuration) {
          st.phase = 'lightspeed';
          st.timer = 0;
          st.ufo.beamActive = false;
          st.ufo.beamWarning = false;
          this.player.hiddenInMetro = true;
          if (this.partner) this.partner.hiddenInMetro = true;
          if (this.tina) this.tina.hiddenInMetro = true;
          if (this.sound && typeof this.sound.playUfoLightspeedSfx === 'function') {
            this.sound.playUfoLightspeedSfx();
          }
          this.triggerScreenShake(0.24, 4);
        }
        return;
      }

      if (st.phase === 'lightspeed') {
        const t = Math.min(1, st.timer / st.warpDuration);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        st.ufo.x = st.startUfoX + (st.goalUfoX - st.startUfoX) * eased;
        st.ufo.y = st.hoverY + (st.safeSkyY - st.hoverY) * eased;
        st.warpIntensity = Math.sin(t * Math.PI) * 1.2;

        this.player.x = st.ufo.x + st.ufo.w * 0.5 - this.player.w * 0.5;
        this.player.y = st.ufo.y;
        this.cameraX = st.cameraStartX + (st.goalCamX - st.cameraStartX) * eased;

        if (this.particles && Math.random() < 0.85) {
          const trailDir = st.goalUfoX >= st.startUfoX ? -1 : 1;
          this.particles.Sparkle(
            st.ufo.x + st.ufo.w * 0.5 + trailDir * (26 + Math.random() * 64),
            st.ufo.y + 12 + (Math.random() - 0.5) * 16,
            Math.random() < 0.5 ? '#22d3ee' : '#e0f2fe'
          );
        }

        if (st.timer >= st.warpDuration) {
          st.phase = 'ejecting';
          st.timer = 0;
          st.ejectedOut = false;
          st.ufo.x = st.goalUfoX;
          st.ufo.y = st.safeSkyY;
          st.warpIntensity = 0;
          st.flashAlpha = 1.0;
          st.ringRadius = 32;
          this.cameraX = st.goalCamX;
          if (this.sound && typeof this.sound.playUfoEjectSfx === 'function') {
            this.sound.playUfoEjectSfx();
          }
          this.triggerScreenShake(0.18, 4);
        }
        return;
      }

      if (st.phase === 'ejecting') {
        const t = Math.min(1, st.timer / st.ejectDuration);
        st.ringRadius = 32 + t * 56;
        if (!st.ejectedOut && t >= 0.14) {
          st.ejectedOut = true;
          const hatchY = st.safeSkyY + 12;
          this.player.x = st.goalDropPlayerX;
          this.player.y = hatchY;
          this.player.vx = 0;
          this.player.vy = 45;
          this.player.hiddenInMetro = false;
          this.player.onGround = false;
          this.player.isGrounded = false;
          this.player.dropThroughTimer = 2.0;

          if (this.partner) {
            this.partner.x = Math.max(16, st.goalDropPlayerX - 28);
            this.partner.y = hatchY + 6;
            this.partner.vx = 0;
            this.partner.vy = 50;
            this.partner.hiddenInMetro = false;
            this.partner.onGround = false;
            this.partner.isGrounded = false;
            this.partner.dropThroughTimer = 2.0;
          }
          if (this.tina) {
            this.tina.x = Math.min(this.levelData.width - 36, st.goalDropPlayerX + 26);
            this.tina.y = hatchY + 10;
            this.tina.vx = 0;
            this.tina.vy = 55;
            this.tina.hiddenInMetro = false;
            this.tina.onGround = false;
            this.tina.isGrounded = false;
            this.tina.dropThroughTimer = 2.0;
            this.tina.targetItem = null;
            this.tina.rescueItem = null;
            this.tina.ledgeState = null;
          }

          if (this.particles) {
            this.particles.Burst(st.ufo.x + st.ufo.w * 0.5, st.ufo.y + 18, '#4ade80', 20);
            this.particles.Burst(st.ufo.x + st.ufo.w * 0.5, st.ufo.y + 18, '#22d3ee', 14);
          }
        }

        if (st.ejectedOut) {
          st.ufo.y -= 720 * dt;
          st.flashAlpha = Math.max(0, st.flashAlpha - dt * 3.5);
          this.player.y += this.player.vy * dt;
          this.player.animState = 'fall';
          if (this.partner) {
            this.partner.y += this.partner.vy * dt;
          }
          if (this.tina) {
            this.tina.y += this.tina.vy * dt;
          }
        }

        if (st.timer >= st.ejectDuration) {
          st.phase = 'falling';
          st.timer = 0;
        }
        return;
      }

      if (st.phase === 'falling') {
        if (st.ufo && st.ufo.y > -90) {
          st.ufo.y -= 780 * dt;
          st.flashAlpha = Math.max(0, st.flashAlpha - dt * 4.0);
        }

        const activePlatforms = this.movingPlatforms
          .concat(this.fallingPlatforms)
          .concat(this.sinkingContainers);
        const solidHazards = this.overheadHazards.filter((h) => h.isSolidBlock !== false);
        const revealedHiddenBlocks = this.hiddenBlocks.filter((hb) => hb && hb.revealed);
        const playerSolids = this.solids.concat(solidHazards).concat(revealedHiddenBlocks);

        if (this.player.y + this.player.h < this.levelData.flagY + 12) {
          this.player.dropThroughTimer = Math.max(this.player.dropThroughTimer || 0, 0.2);
          if (this.partner) {
            this.partner.dropThroughTimer = Math.max(this.partner.dropThroughTimer || 0, 0.2);
          }
          if (this.tina) {
            this.tina.dropThroughTimer = Math.max(this.tina.dropThroughTimer || 0, 0.2);
          }
        }

        const neutralInput = {
          left: false,
          right: false,
          up: false,
          down: false,
          jump: false,
          jumpHeld: false,
          jumpPressed: false,
          downPressed: false,
          shootPressed: false,
          tinaPressed: false,
          skillPressed: false,
          reservePressed: false
        };

        this.player.update(
          dt,
          neutralInput,
          playerSolids,
          activePlatforms,
          this.sound,
          this.particles,
          [this.partner, this.tina],
          null,
          0,
          {
            sandMode: this.hasSandPhysics,
            iceMode: this.hasIcePhysics,
            isIceLevel: this.isIceLevel,
            saltMode: this.hasSaltPhysics
          }
        );
        this.player.x = Math.min(this.levelData.width - this.player.w, Math.max(0, st.goalDropPlayerX));

        if (this.partner) {
          this.partner.update(dt, this.player, this.solids, activePlatforms);
        }
        if (this.tina) {
          this.tina.targetItem = null;
          this.tina.rescueItem = null;
          this.tina.ledgeState = null;
          this.tina.update(dt, this.player, this.solids, activePlatforms, []);
        }

        const targetCamX = Math.max(
          0,
          Math.min(this.levelData.width - LOGICAL_W, this.player.x - LOGICAL_W * 0.35)
        );
        this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 8);
        this.particles.update(dt);

        const flagBox = this.getGoalFlagHitbox();
        if (
          this.player.y + this.player.h >= flagBox.y + 44 ||
          this.player.onGround ||
          st.timer >= 2.0
        ) {
          if ((this.player.onGround || st.timer >= 2.0) && !global.Entities.aabbOverlap(this.player, flagBox)) {
            this.player.x = Math.min(
              flagBox.x + flagBox.w - this.player.w - 2,
              Math.max(flagBox.x + 2, this.player.x)
            );
            this.player.y = flagBox.y + flagBox.h - 20;
          }
          if (global.Entities.aabbOverlap(this.player, flagBox)) {
            this.startLevelClearCinematic();
          }
        }
      }
    }

    drawEtHomeAbduction(ctx) {
      const st = this.abductionCheat;
      if (!st || !st.ufo || !this.sprites) return;
      if (st.phase === 'lightspeed' && st.warpIntensity > 0.01 && typeof this.sprites.drawUfoLightspeedTrailHD === 'function') {
        this.sprites.drawUfoLightspeedTrailHD(
          ctx,
          st.ufo,
          this.cameraX,
          st.animTimer,
          st.warpIntensity,
          st.goalUfoX >= st.startUfoX
        );
      }
      if (typeof this.sprites.drawMiniUfoHD === 'function') {
        this.sprites.drawMiniUfoHD(ctx, st.ufo, this.cameraX, st.animTimer);
      }
      if (st.flashAlpha > 0.01 && typeof this.sprites.drawUfoAbductionFxHD === 'function') {
        this.sprites.drawUfoAbductionFxHD(ctx, st.ufo, this.cameraX, {
          flashAlpha: st.flashAlpha,
          ringRadius: st.ringRadius
        });
      }
    }

    clearLevelEnemiesForFlightTour() {
      const lists = [
        this.pigeons, this.scooters, this.seagulls, this.hedgehogs, this.boars,
        this.zigzagPigeons, this.madridCats, this.selfieTourists, this.royalGuards,
        this.peacocks, this.crazyCyclists, this.greenParakeets, this.swarmParakeets,
        this.jellyfishes, this.crabs, this.goats, this.royalSeagulls,
        this.swarmRoyalSeagulls, this.gallotias, this.garajonayFoxes, this.abubillas, this.swarmAbubillas,
        this.blindCrabs, this.trapitos, this.motochorros, this.barrabravas,
        this.canillitas, this.fatPigeons, this.horneros, this.swarmHorneros,
        this.horneroNests, this.rockeros, this.penguins, this.coldBlasts,
        this.palometas, this.swarmMosquitoes, this.belgranoPirates, this.fernetBottles,
        this.fernetPuddles, this.serranoBurros, this.miniUfos, this.seaLions,
        this.kingCrabs, this.fuegianFoxes, this.swarmCormorants, this.pumas,
        this.condors, this.portPelicans, this.pelicanDrops, this.pacificHazards,
        this.frigates, this.swarmFrigates, this.salineSpits, this.vicunas,
        this.portDogs, this.rapaNuiWarriors, this.guasos, this.guasas,
        this.guasoDancers, this.swarmPigeons, this.geysers,
        this.newspaperProjectiles, this.enemies
      ];
      for (let i = 0; i < lists.length; i++) {
        const arr = lists[i];
        if (!Array.isArray(arr)) continue;
        for (let j = 0; j < arr.length; j++) {
          const enemy = arr[j];
          if (!enemy || enemy.dead) continue;
          enemy.dead = true;
          if (this.particles && Number.isFinite(enemy.x) && Number.isFinite(enemy.y)) {
            const ex = enemy.x + (enemy.w || 24) * 0.5;
            const ey = enemy.y + (enemy.h || 24) * 0.5;
            if (ex >= this.cameraX - 80 && ex <= this.cameraX + LOGICAL_W + 80) {
              this.particles.Burst(ex, ey, '#f8fafc', 8);
            }
          }
        }
        arr.length = 0;
      }
      if (Array.isArray(this.overheadHazards)) {
        for (let i = this.overheadHazards.length - 1; i >= 0; i--) {
          const oh = this.overheadHazards[i];
          if (oh && oh.isSolidBlock === false) {
            oh.dead = true;
            if (this.particles && Number.isFinite(oh.x) && Number.isFinite(oh.y)) {
              this.particles.Burst(oh.x + (oh.w || 20) * 0.5, oh.y + (oh.h || 20) * 0.5, '#f8fafc', 6);
            }
            this.overheadHazards.splice(i, 1);
          }
        }
      }
      if (this.gaudiLizard) {
        if (!this.gaudiLizard.dead && this.particles) {
          this.particles.Burst(this.gaudiLizard.x + 18, this.gaudiLizard.y + 12, '#fde047', 10);
        }
        this.gaudiLizard.dead = true;
        this.gaudiLizard = null;
      }
      this.swarmAlertTimer = 0;
      this.swarmEventTriggered = true;
      this.isMadridSwarm = false;
      this.isPalmaSwarm = false;
      this.isCanariasSwarm = false;
      this.isMosquitoSwarm = false;
      this.isCormorantSwarm = false;
      this.isFrigateSwarm = false;
    }

    activateBiplaneTourCheat() {
      if (
        !this.levelData ||
        !this.player ||
        this.isAbductedByCheat ||
        this.isBiplaneFlightCheat ||
        this.state !== 'playing'
      ) {
        return false;
      }
      this.isBiplaneFlightCheat = true;
      this.airTourBuffer = '';
      this.clearTransientInput();
      if (this.inputManager && typeof this.inputManager.clearTransient === 'function') {
        this.inputManager.clearTransient();
      }

      const actors = [this.player, this.partner, this.tina];
      for (let i = 0; i < actors.length; i++) {
        const a = actors[i];
        if (!a) continue;
        a.hiddenInMetro = false;
        a.vx = 0;
        a.vy = 0;
        a.hangingRope = null;
        a.isHanging = false;
        a.onCable = false;
        a.onZipline = false;
        a.onVine = false;
        a.isGroundPounding = false;
        a.isCrouching = false;
        a.hurtTimer = 0;
        a.ledgeState = null;
        a.standingPlatform = null;
        a.platformVx = 0;
        a.platformVy = 0;
      }

      this.clearLevelEnemiesForFlightTour();

      const tinaStartX = this.tina ? this.tina.x : Math.max(24, this.player.x - 42);
      const screenCenter = this.cameraX + LOGICAL_W * 0.5;
      const exitSide = tinaStartX <= screenCenter ? 'left' : 'right';
      const entryX = exitSide === 'left' ? this.cameraX - 56 : this.cameraX + LOGICAL_W + 56;
      const initialFacing = exitSide === 'left' ? 1 : -1;
      const flightAltY = Math.max(58, Math.min(395, this.player.y + 8));

      this.biplaneFlightCheat = {
        phase: 'vanish_tina_out',
        timer: 0,
        animTimer: 0,
        exitSide,
        planeX: entryX,
        planeY: flightAltY,
        facing: initialFacing,
        vx: 0,
        vy: 0,
        pitchAngle: 0,
        displayPitchDeg: 0,
        normalSpeed: 240,
        turboMultiplier: 2.0,
        turboActive: false,
        passengersBoarded: false
      };

      if (this.sound && typeof this.sound.tinaBark === 'function') {
        this.sound.tinaBark();
      }
      if (this.particles) {
        this.particles.FloatingText(
          this.player.x - 38,
          Math.max(46, this.player.y - 26),
          '✈️ ¡LA TINITA VA POR SU BIPLANO!',
          '#fde047'
        );
      }
      return true;
    }

    updateBiplaneTourFlight(dt) {
      const st = this.biplaneFlightCheat;
      if (!st || !this.player || !this.levelData) return;

      st.timer += dt;
      st.animTimer += dt;

      for (let i = 0; i < this.movingPlatforms.length; i++) {
        this.movingPlatforms[i].update(dt);
      }
      for (let i = 0; i < this.fallingPlatforms.length; i++) {
        this.fallingPlatforms[i].update(dt);
      }
      for (let i = 0; i < this.sinkingContainers.length; i++) {
        this.sinkingContainers[i].update(dt);
      }
      for (let i = 0; i < this.ropes.length; i++) {
        this.ropes[i].update(dt);
      }
      this.particles.update(dt);

      if (st.phase === 'vanish_tina_out') {
        const runDir = st.exitSide === 'left' ? -1 : 1;
        if (this.tina) {
          this.tina.hiddenInMetro = false;
          this.tina.facing = st.exitSide;
          this.tina.animState = 'run';
          this.tina.animTimer += dt * 2.0;
          this.tina.x += runDir * 640 * dt;
          if (Math.random() < 0.55) {
            this.particles.Sparkle(this.tina.x + 12, this.tina.y + this.tina.h - 4, '#fde047');
          }
        }
        const exitedOffscreen =
          !this.tina ||
          this.tina.x < this.cameraX - 44 ||
          this.tina.x > this.cameraX + LOGICAL_W + 44 ||
          st.timer >= 1.15;
        if (exitedOffscreen) {
          if (this.tina) this.tina.hiddenInMetro = true;
          st.phase = 'plane_pickup';
          st.timer = 0;
          st.planeX = st.exitSide === 'left' ? this.cameraX - 54 : this.cameraX + LOGICAL_W + 54;
          st.planeY = Math.max(54, Math.min(395, this.player.y + 8));
          st.facing = st.exitSide === 'left' ? 1 : -1;
          if (this.sound && typeof this.sound.startBiplaneAmbience === 'function') {
            this.sound.startBiplaneAmbience();
          }
        }
        return;
      }

      if (st.phase === 'plane_pickup') {
        const targetX = this.player.x + this.player.w * 0.5;
        const targetY = Math.max(52, Math.min(402, this.player.y + this.player.h * 0.42));
        const dx = targetX - st.planeX;
        const dy = targetY - st.planeY;
        const dist = Math.hypot(dx, dy);
        const approachSpeed = 580;

        if (Math.abs(dx) > 4) {
          st.facing = dx >= 0 ? 1 : -1;
        }
        if (dist > 0.01) {
          const step = Math.min(dist, approachSpeed * dt);
          st.planeX += (dx / dist) * step;
          st.planeY += (dy / dist) * step;
          const desiredPitch = Math.max(-Math.PI / 5, Math.min(Math.PI / 5, (dy / Math.max(80, Math.abs(dx))) * 0.45));
          st.pitchAngle += (desiredPitch - st.pitchAngle) * Math.min(1, dt * 12);
        }

        if (Math.random() < 0.55) {
          this.particles.Sparkle(st.planeX - st.facing * 28, st.planeY + 2, '#e0f2fe');
        }

        if (dist <= 22 || st.timer >= 2.2) {
          st.planeX = targetX;
          st.planeY = targetY;
          st.pitchAngle = 0;
          st.displayPitchDeg = 0;
          st.vx = 0;
          st.vy = 0;
          st.passengersBoarded = true;
          st.phase = 'flying';
          st.timer = 0;

          this.player.hiddenInMetro = true;
          if (this.partner) this.partner.hiddenInMetro = true;
          if (this.tina) this.tina.hiddenInMetro = true;

          if (this.sound && typeof this.sound.coin === 'function') {
            this.sound.coin();
          }
          if (this.particles) {
            this.particles.Burst(st.planeX, st.planeY, '#fde047', 18);
            this.particles.Burst(st.planeX, st.planeY, '#38bdf8', 14);
            this.particles.FloatingText(
              Math.max(this.cameraX + 20, st.planeX - 74),
              Math.max(46, st.planeY - 38),
              this.formatControlHintText('✈️ ¡A VOLAR! FLECHAS + [SHIFT] TURBO 2X'),
              '#fde047'
            );
          }
        }
        return;
      }

      // Fase 'flying': control libre 100 % en gravedad cero con +45° / 0° / -45° y Turbo Shift 2x
      const moveLeft = Boolean(this.input.left || (this.input.analogX || 0) < -0.18);
      const moveRight = Boolean(this.input.right || (this.input.analogX || 0) > 0.18);
      const moveUp = Boolean(this.input.up || (this.input.analogY || 0) < -0.18);
      const moveDown = Boolean(this.input.down || (this.input.analogY || 0) > 0.18);
      const shiftHeld = Boolean(
        this.input.shiftHeld ||
          (this.inputManager &&
            typeof this.inputManager.isDown === 'function' &&
            (this.inputManager.isDown('ShiftLeft') || this.inputManager.isDown('ShiftRight')))
      );

      const moveX = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
      const moveY = (moveDown ? 1 : 0) - (moveUp ? 1 : 0);
      const baseSpeed = st.normalSpeed || 240;
      const speed = shiftHeld ? baseSpeed * (st.turboMultiplier || 2.0) : baseSpeed;
      st.turboActive = shiftHeld;

      if (moveX !== 0) {
        st.facing = moveX > 0 ? 1 : -1;
        st.vx = moveX * speed;
      } else {
        st.vx = 0;
      }

      if (moveY !== 0) {
        st.vy = moveY * speed;
      } else {
        st.vy = 0;
      }

      // Inclinación exacta en la dirección de vuelo: subir (+45° visual => -Math.PI/4 local), bajar (-45° => +Math.PI/4), quieto/horizontal (0°)
      const targetPitch = moveY < 0 ? -Math.PI / 4 : (moveY > 0 ? Math.PI / 4 : 0);
      st.displayPitchDeg = moveY < 0 ? 45 : (moveY > 0 ? -45 : 0);
      st.pitchAngle += (targetPitch - st.pitchAngle) * Math.min(1, dt * 16);
      if (Math.abs(targetPitch - st.pitchAngle) < 0.006) {
        st.pitchAngle = targetPitch;
      }

      const maxX = Math.max(40, (this.levelData.width || 3200) - 36);
      const minY = 40;
      const maxY = 460 - 24;
      st.planeX = Math.max(36, Math.min(maxX, st.planeX + st.vx * dt));
      st.planeY = Math.max(minY, Math.min(maxY, st.planeY + st.vy * dt));

      this.player.x = st.planeX - this.player.w * 0.5;
      this.player.y = st.planeY - this.player.h * 0.5;
      this.player.vx = st.vx;
      this.player.vy = st.vy;
      this.player.onGround = false;
      this.player.isGrounded = false;
      this.player.facing = st.facing >= 0 ? 'right' : 'left';
      if (this.partner) {
        this.partner.x = st.planeX - 18 * st.facing;
        this.partner.y = st.planeY - this.partner.h * 0.5;
      }
      if (this.tina) {
        this.tina.x = st.planeX + 10 * st.facing;
        this.tina.y = st.planeY - this.tina.h * 0.5;
      }

      if (st.turboActive && (st.vx !== 0 || st.vy !== 0) && Math.random() < 0.65) {
        this.particles.Sparkle(
          st.planeX - st.facing * 36,
          st.planeY + (Math.random() - 0.5) * 10,
          Math.random() < 0.5 ? '#fde047' : '#fb923c'
        );
      }

      const targetCamX = Math.max(
        0,
        Math.min(this.levelData.width - LOGICAL_W, st.planeX - LOGICAL_W * 0.42)
      );
      this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 8);

      const planeHitbox = {
        x: st.planeX - 30,
        y: st.planeY - 22,
        w: 60,
        h: 42
      };
      if (global.Entities.aabbOverlap(planeHitbox, this.getGoalFlagHitbox())) {
        this.finishBiplaneTourAtGoal();
      }
    }

    finishBiplaneTourAtGoal() {
      const st = this.biplaneFlightCheat;
      if (this.sound && typeof this.sound.stopBiplaneAmbience === 'function') {
        this.sound.stopBiplaneAmbience();
      }
      if (this.levelData && this.player) {
        const flagBox = this.getGoalFlagHitbox();
        this.player.x = Math.min(
          flagBox.x + flagBox.w - this.player.w - 2,
          Math.max(flagBox.x + 2, this.player.x)
        );
        this.player.y = this.levelData.flagY - this.player.h;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = true;
        this.player.hiddenInMetro = false;
      }
      if (this.partner && this.player) {
        this.partner.hiddenInMetro = false;
        this.partner.x = Math.max(16, this.player.x - 24);
        this.partner.y = this.player.y;
      }
      if (this.tina && this.player) {
        this.tina.hiddenInMetro = false;
        this.tina.x = Math.max(16, this.player.x - 42);
        this.tina.y = this.player.y + 8;
      }
      if (st && this.particles) {
        this.particles.Burst(st.planeX, st.planeY, '#fde047', 16);
      }
      this.isBiplaneFlightCheat = false;
      this.biplaneFlightCheat = null;
      this.startLevelClearCinematic();
    }

    drawBiplaneTourFlight(ctx) {
      const st = this.biplaneFlightCheat;
      if (!st || !this.sprites || st.phase === 'vanish_tina_out') return;
      if (typeof this.sprites.drawTinaBiplane === 'function') {
        const isStationary = st.vx === 0 && st.vy === 0 && st.phase === 'flying';
        this.sprites.drawTinaBiplane(
          ctx,
          st.planeX - this.cameraX,
          st.planeY,
          st.animTimer,
          st.facing,
          {
            scale: 1.32,
            pitch: st.pitchAngle,
            bob: isStationary ? 0 : Math.sin(st.animTimer * 6.5) * 1.4,
            contrails: true,
            turbo: !!st.turboActive,
            passengers: !!st.passengersBoarded
          }
        );
      }
    }

    activateStartUnlockCheat() {
      this.invalidateStartCheat();
      if (global.WorldProgress && typeof global.WorldProgress.unlockAllProgress === 'function') {
        global.WorldProgress.unlockAllProgress();
      }
      this.clearTransientInput();
      if (this.sound) {
        if (typeof this.sound.setHurryUp === 'function') this.sound.setHurryUp(false);
        if (typeof this.sound.stopMusic === 'function') this.sound.stopMusic();
        if (typeof this.sound.playMenuConfirmChord === 'function') this.sound.playMenuConfirmChord(true);
      }
      if (this.particles && this.player) {
        const px = this.player.x + this.player.w * 0.5;
        const py = this.player.y + this.player.h * 0.5;
        this.particles.Burst(px, py, '#fde047', 24);
        this.particles.FloatingText(this.player.x - 36, this.player.y - 26, '🌍 ¡WORLD MAP DESBLOQUEADO!', '#fde047');
      }
      const maxR = Math.hypot(LOGICAL_W, LOGICAL_H);
      this.irisRadius = maxR;
      this.irisCenterX = this.player
        ? this.player.x + this.player.w * 0.5 - this.cameraX
        : LOGICAL_W * 0.5;
      this.irisCenterY = this.player ? this.player.y + this.player.h * 0.5 : LOGICAL_H * 0.5;
      this.cheatIrisTimer = 0;
      this.cheatIrisDuration = 0.85;
      this.cheatIrisHold = 0.15;
      this.state = 'cheat_iris';
    }

    updateCheatIris(dt) {
      this.cheatIrisTimer += dt;
      if (this.particles) this.particles.update(dt);
      const maxR = Math.hypot(LOGICAL_W, LOGICAL_H);
      this.irisCenterX = this.player
        ? this.player.x + this.player.w * 0.5 - this.cameraX
        : LOGICAL_W * 0.5;
      this.irisCenterY = this.player ? this.player.y + this.player.h * 0.5 : LOGICAL_H * 0.5;
      if (this.cheatIrisTimer < this.cheatIrisDuration) {
        const p = this.cheatIrisTimer / this.cheatIrisDuration;
        this.irisRadius = Math.max(0, maxR * (1 - p));
      } else if (this.cheatIrisTimer < this.cheatIrisDuration + this.cheatIrisHold) {
        this.irisRadius = 0;
      } else {
        this.irisRadius = maxR;
        this.openMap({ level: 'world', worldNode: 'spain' });
      }
    }

    /** Detecta pisotón continuo usando prevBottom del frame anterior y el 55% superior del enemigo. */
    isPlayerStomp(enemy, dt = 0, opts = {}) {
      if (!this.player || !enemy) return false;
      const validVy = opts.allowZeroVy ? this.player.vy >= 0 : this.player.vy > 0;
      if (!validVy) return false;
      const eh = Number.isFinite(enemy.h)
        ? enemy.h
        : Number.isFinite(enemy.height)
        ? enemy.height
        : 36;
      const curBottom = this.player.y + this.player.h;
      const prevBottom = Number.isFinite(this.player.prevBottom)
        ? this.player.prevBottom
        : curBottom - this.player.vy * (Number.isFinite(dt) ? dt : 0);
      return prevBottom <= enemy.y + eh * 0.55;
    }

    /** Otorga inmunidad breve de contacto tras un pisotón válido sin activar parpadeo visual. */
    grantStompGrace(graceSec = 0.15) {
      if (!this.player) return;
      this.player.stompGraceTimer = Math.max(this.player.stompGraceTimer || 0, graceSec);
    }

    /** Aplica el rebote vertical del pisotón y activa la ventana de inmunidad post-rebote. */
    applyPlayerStompBounce(bounceVy = -380, graceSec = 0.15) {
      if (!this.player) return;
      this.player.vy = bounceVy;
      this.grantStompGrace(graceSec);
    }

    handleJumpingFishPlayerCollision(fish, dt, meta = {}) {
      if (this.ghostMode) return false;
      const box = meta.box || fish;
      if (!fish || !box || fish.dead || fish.respawnTimer > 0) return false;
      if (!global.Entities.aabbOverlap(this.player, box)) return false;

      const fx = box.x + box.w * 0.5;
      const fy = box.y + box.h * 0.5;
      const stomp = this.isPlayerStomp(box, dt);

      if (fish.isDisabled()) {
        if (stomp || this.player.isGroundPounding) {
          fish.eliminate(5.0);
          if (!this.player.isGroundPounding) {
            this.applyPlayerStompBounce(-385);
          } else {
            this.grantStompGrace(0.15);
          }
          const fxColor = meta.color || '#38bdf8';
          this.score += 70;
          this.sound.stomp();
          this.particles.Burst(fx, fy, fxColor, 18);
          this.particles.FloatingText(fish.x - 4, box.y - 8, '+70', fxColor);
          this.saveHighScore();
          return true;
        }
        return false;
      }

      if (meta.color) this.particles.Burst(fx, fy, meta.color, 12);
      if (meta.label) this.particles.FloatingText(fish.x - 16, box.y, meta.label, meta.color || '#38bdf8');
      this.damagePlayer(fx);
      return true;
    }

    // ========================================================================
    // HABILIDADES ESPECIALES DE NICO, ANDREA Y LA TINA
    // ========================================================================
    defeatPoleRockero(rk, impulseX = 0, label = '⚡ ¡AL SUELO! +65', color = '#fbbf24') {
      if (!rk || !rk.onPole || typeof rk.knockOffPole !== 'function') return false;
      if (!rk.knockOffPole(impulseX)) return false;
      for (let i = 0; i < this.lightPoles.length; i++) {
        const pole = this.lightPoles[i];
        if (Math.abs(pole.x - (rk.poleX || pole.x)) <= 6) {
          pole.shakeTimer = 0.45;
        }
      }
      this.score += 65;
      this.sound.stomp();
      const rx = rk.x + rk.w * 0.5;
      const ry = rk.y + rk.h * 0.5;
      this.particles.Burst(rx, ry, color, 18);
      if (label) {
        this.particles.FloatingText(rk.x - 10, rk.y - 10, label, color);
      }
      this.saveHighScore();
      return true;
    }

    damageHorneroNest(nest, ignoreCooldown = false) {
      if (!nest || typeof nest.takeHit !== 'function') return 'none';
      const res = nest.takeHit(this.particles, ignoreCooldown);
      const cx = nest.x + nest.w * 0.5;
      const cy = nest.y + nest.h * 0.5;
      if (res === 'cracked') {
        this.score += 25;
        this.sound.spikeHit();
        this.saveHighScore();
      } else if (res === 'destroyed') {
        this.score += 100;
        this.sound.stomp();
        this.particles.Burst(cx, cy, '#92400e', 18);
        this.particles.FloatingText(nest.x - 10, nest.y - 18, '🪺 ¡NIDO ROTO! +100', '#fde047');
        this.saveHighScore();
      }
      return res;
    }

    /** Derrota a La Salamandra de Trencadís, suelta 1 VIDA EXTRA en arco lateral con retardo de 1.0 s para La Tina. */
    defeatGaudiLizard(lizard, bouncePlayer = false) {
      const E = global.Entities;
      if (!lizard || lizard.dead || lizard.escaped || lizard.defeated) return false;
      if (lizard.state === 'waiting') return false;

      lizard.dead = true;
      lizard.defeated = true;
      this.lizardEventConsumed = true;
      this.gaudiLizardEventResolved = true;
      this.score += 250;
      if (bouncePlayer && this.player && !this.player.isGroundPounding) {
        this.applyPlayerStompBounce(-410);
      } else if (bouncePlayer) {
        this.grantStompGrace(0.15);
      }
      if (this.sound && typeof this.sound.stomp === 'function') {
        this.sound.stomp();
      }

      const ex = lizard.x + lizard.w * 0.5;
      const ey = lizard.y + lizard.h * 0.5;
      const mosaicPalette = ['#2563eb', '#06b6d4', '#f97316', '#facc15', '#ffffff'];
      for (let i = 0; i < mosaicPalette.length; i++) {
        this.particles.Burst(ex, ey, mosaicPalette[i], 8);
      }

      if (E && E.Collectible) {
        const minDropX = (Number.isFinite(lizard.platformX) ? lizard.platformX : 3290) + 12;
        const maxDropX =
          (Number.isFinite(lizard.platformX) ? lizard.platformX : 3290) +
          (Number.isFinite(lizard.platformW) ? lizard.platformW : 480) -
          38;
        const dropX = Math.max(minDropX + 4, Math.min(maxDropX - 4, ex - 13));
        const dropY = lizard.y - 6;
        const playerCx = this.player ? this.player.x + (this.player.w || 32) * 0.5 : dropX;
        let throwDir = dropX >= playerCx ? 1 : -1;
        if (dropX <= minDropX + 70) throwDir = 1;
        else if (dropX >= maxDropX - 70) throwDir = -1;

        const lifeHeart = new E.Collectible(dropX, dropY, 'extra_life_heart', true);
        if (typeof lifeHeart.startSidewaysArc === 'function') {
          lifeHeart.startSidewaysArc(throwDir * 175, -330, 1.0, 0.45, {
            minX: minDropX,
            maxX: maxDropX
          });
        }
        this.collectibles.push(lifeHeart);
      }

      this.particles.FloatingText(lizard.x - 32, lizard.y - 24, '🦎💎 ¡1 VIDA EXTRA!', '#facc15');
      this.saveHighScore();
      return true;
    }

    applyPlantHitToEnemy(enemy, proj) {
      const E = global.Entities;
      const knockDir = Number.isFinite(proj.vx) && proj.vx !== 0 ? (proj.vx > 0 ? 1 : -1) : 1;
      const ex = enemy.x + enemy.w * 0.5;
      const ey = enemy.y + enemy.h * 0.5;

      if (E && E.GaudiLizardEnemy && enemy instanceof E.GaudiLizardEnemy) {
        if (enemy.state !== 'running') return 'ignored';
        this.defeatGaudiLizard(enemy, false);
        return 'killed';
      }

      if (E && E.GarajonayFoxEnemy && enemy instanceof E.GarajonayFoxEnemy) {
        enemy.dead = true;
        this.score += 75;
        this.sound.stomp();
        this.particles.Burst(ex, ey, '#ea580c', 16);
        this.particles.Burst(ex, ey, '#ffffff', 8);
        this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿🦊 ¡HOJAZO! +75', '#bef264');
        return 'killed';
      }

      if (
        E &&
        ((E.PalometaEnemy && enemy instanceof E.PalometaEnemy) ||
          (E.PacificJumpHazard && enemy instanceof E.PacificJumpHazard))
      ) {
        if (typeof enemy.eliminate === 'function') {
          enemy.eliminate(5.0);
        } else {
          enemy.dead = true;
        }
        const fxColor = enemy.kind === 'magma_piranha' ? '#fb7185' : '#38bdf8';
        this.score += 65;
        this.sound.stomp();
        this.particles.Burst(ex, ey, '#4ade80', 14);
        this.particles.Burst(ex, ey, fxColor, 14);
        this.particles.FloatingText(enemy.x - 6, enemy.y - 8, '🌿 ¡HOJAZO! +65', '#bef264');
        return;
      }

      if (E && E.HorneroNest && enemy instanceof E.HorneroNest) {
        this.damageHorneroNest(enemy, true);
        return;
      }

      if (E && E.RoyalGuardEnemy && enemy instanceof E.RoyalGuardEnemy) {
        if (proj && (proj.deflected || proj.damageDisabled)) return 'ignored';
        const res = enemy.takeHit(this.particles, knockDir, true, true, proj);
        if (res === 'blocked_front') {
          const guardFacingDir =
            typeof enemy.getFacingDir === 'function'
              ? enemy.getFacingDir()
              : (enemy.facing === 'right' ? 1 : -1);
          const shieldEdgeX = guardFacingDir > 0 ? enemy.x + enemy.w : enemy.x;
          if (proj && typeof proj.deflectFromShield === 'function') {
            proj.deflectFromShield(shieldEdgeX);
          } else if (proj) {
            proj.vx = -(proj.vx || 0);
            proj.vy = -210;
            proj.deflected = true;
            proj.damageDisabled = true;
          }
          if (this.sound && typeof this.sound.shieldClang === 'function') {
            this.sound.shieldClang();
          } else if (this.sound && typeof this.sound.spikeHit === 'function') {
            this.sound.spikeHit();
          }
          this.particles.FloatingText(enemy.x - 18, enemy.y - 18, '🛡️ ¡BLOQUEADO!', '#93c5fd');
          return 'blocked_front';
        }
        if (res === 'armor_broken') {
          this.score += 25;
          this.sound.spikeHit();
          this.particles.FloatingText(enemy.x - 24, enemy.y - 18, '🛡️ ¡ESCUDO Y CASCO ROTOS!', '#fde047');
        } else if (res === 'killed') {
          this.score += 85;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#3b82f6', 18);
          this.particles.Burst(ex, ey, '#fbbf24', 10);
          this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +85', '#bef264');
        }
        return res;
      }

      if (E && E.PeacockEnemy && enemy instanceof E.PeacockEnemy) {
        const res = enemy.takeHit(this.particles, knockDir, true, true);
        if (res === 'damaged') {
          this.score += 25;
          this.sound.stomp();
          this.particles.FloatingText(enemy.x - 16, enemy.y - 18, '🦚 ¡PLUMAJE CERRADO!', '#fde047');
        } else if (res === 'killed') {
          this.score += 85;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#10b981', 18);
          this.particles.Burst(ex, ey, '#2563eb', 10);
          this.particles.Burst(ex, ey, '#fbbf24', 8);
          this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +85', '#bef264');
        }
        return res;
      }

      if (E && E.RapaNuiWarrior && enemy instanceof E.RapaNuiWarrior) {
        const res = enemy.takeHit(this.particles, knockDir, true, true);
        if (res === 'mask_broken') {
          this.score += 25;
          this.sound.spikeHit();
          this.particles.FloatingText(enemy.x - 22, enemy.y - 18, '🗿 ¡MÁSCARA ROTA!', '#fde047');
        } else if (res === 'killed') {
          this.score += 85;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#fb923c', 18);
          this.particles.Burst(ex, ey, '#94a3b8', 10);
          this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +85', '#bef264');
        }
        return;
      }

      if (E && E.PumaEnemy && enemy instanceof E.PumaEnemy) {
        const res = enemy.takeHit(this.particles, knockDir, true);
        if (res === 'damaged') {
          this.score += 20;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#fde047', 12);
        } else if (res === 'killed') {
          this.score += 85;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#f59e0b', 18);
          this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +85', '#bef264');
        }
        return;
      }

      if (E && E.KingCrabEnemy && enemy instanceof E.KingCrabEnemy) {
        const res = enemy.takeHit(this.particles, knockDir, true, true, true);
        if (res === 'armor_broken') {
          this.score += 25;
          this.sound.spikeHit();
          this.particles.FloatingText(enemy.x - 24, enemy.y - 18, '🦀 ¡CAPARAZÓN ROTO!', '#fde047');
        } else if (res === 'killed') {
          this.score += 90;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#ef4444', 18);
          this.particles.Burst(ex, ey, '#fbbf24', 10);
          this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +90', '#bef264');
        }
        return;
      }

      if (E && E.BelgranoPirateEnemy && enemy instanceof E.BelgranoPirateEnemy) {
        const res = enemy.takeHit(knockDir, true, true);
        if (res === 'enraged') {
          this.score += 25;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#ef4444', 14);
          this.particles.Burst(ex, ey, '#fbbf24', 10);
          this.particles.FloatingText(enemy.x - 18, enemy.y - 18, '😡 ¡SIN FERNET! ¡FURIA!', '#fbbf24');
        } else if (res === 'killed') {
          this.score += 85;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#4ade80', 18);
          this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +85', '#bef264');
        }
        return;
      }

      if (E && E.BarrabravaEnemy && enemy instanceof E.BarrabravaEnemy) {
        const res = enemy.takeHit(this.particles, knockDir, true, true);
        if (res === 'drum_broken') {
          this.score += 25;
          this.sound.stomp();
          this.particles.FloatingText(enemy.x - 18, enemy.y - 18, '🥁 ¡BOMBO ROTO!', '#fde047');
        } else if (res === 'killed') {
          this.score += 85;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#38bdf8', 18);
          this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +85', '#bef264');
        }
        return;
      }

      if (typeof enemy.shatter === 'function') {
        const crabRes = enemy.shatter(this.particles, knockDir, true);
        if (crabRes === 'cracked') {
          this.score += 25;
          this.sound.spikeHit();
        } else if (crabRes === 'killed' || crabRes === true) {
          this.score += 200;
          this.sound.stomp();
        }
        return;
      }

      if (
        E &&
        ((E.Boar && enemy instanceof E.Boar) ||
          (E.TramuntanaGoatEnemy && enemy instanceof E.TramuntanaGoatEnemy) ||
          (E.SerranoBurroEnemy && enemy instanceof E.SerranoBurroEnemy) ||
          (E.SeaLionEnemy && enemy instanceof E.SeaLionEnemy))
      ) {
        const res = enemy.takeHit(knockDir, true, true);
        if (res === 'damaged') {
          this.score += 20;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#fde047', 12);
        } else if (res === 'killed') {
          const isArgHeavy =
            (E.SerranoBurroEnemy && enemy instanceof E.SerranoBurroEnemy) ||
            (E.SeaLionEnemy && enemy instanceof E.SeaLionEnemy);
          const killPts = isArgHeavy ? 80 : 65;
          this.score += killPts;
          this.sound.stomp();
          this.particles.Burst(ex, ey, '#4ade80', 18);
          this.particles.FloatingText(enemy.x, enemy.y - 8, `🌿 ¡HOJAZO! +${killPts}`, '#bef264');
        }
        return;
      }

      if (enemy.onPole) {
        this.defeatPoleRockero(enemy, knockDir, '🌿 ¡HOJAZO! +65', '#bef264');
        return;
      }

      enemy.dead = true;
      if (E && E.TrapitoEnemy && enemy instanceof E.TrapitoEnemy) {
        this.collectibles.push(new E.Collectible(enemy.x + 6, enemy.y - 16, 'coin', true));
      }
      this.score += 65;
      this.sound.stomp();
      this.particles.Burst(ex, ey, '#4ade80', 18);
      this.particles.FloatingText(enemy.x, enemy.y - 8, '🌿 ¡HOJAZO! +65', '#bef264');
    }

    /** Resuelve colisión superior / ataque de jugador sobre enemigos de doble golpe (2 HP). */
    resolveHeavyStompImpact(enemy, opts) {
      const ex = enemy.x + enemy.w * 0.5;
      const ey = enemy.y + enemy.h * 0.5;
      const knockDir = ex >= this.player.x + this.player.w * 0.5 ? 1 : -1;
      const res = opts.hitFn(knockDir);
      if (res === opts.firstState) {
        this.player.y = Math.min(this.player.y, enemy.y - this.player.h - 2);
        this.applyPlayerStompBounce(opts.firstBounceVy || -380);
        this.player.isGroundPounding = false;
        this.score += opts.firstPts || 20;
        this.sound.stomp();
        if (opts.firstBurstColor) this.particles.Burst(ex, ey, opts.firstBurstColor, 14);
        if (opts.secondBurstColor) this.particles.Burst(ex, ey, opts.secondBurstColor, 10);
        if (opts.firstLabel) {
          this.particles.FloatingText(
            enemy.x + (opts.firstTextDx || 0),
            enemy.y + (opts.firstTextDy !== undefined ? opts.firstTextDy : -14),
            opts.firstLabel,
            opts.firstTextColor || '#fde047'
          );
        }
        this.saveHighScore();
      } else if (res === 'killed') {
        if (!this.player.isGroundPounding || opts.alwaysBounceOnKill) {
          this.applyPlayerStompBounce(opts.killBounceVy || -385);
        } else {
          this.grantStompGrace(0.15);
        }
        if (opts.alwaysBounceOnKill) {
          this.player.y = Math.min(this.player.y, enemy.y - this.player.h - 2);
          this.player.isGroundPounding = false;
        }
        this.score += opts.killPts;
        this.sound.stomp();
        this.particles.Burst(ex, ey, opts.killColor || '#38bdf8', 18);
        this.particles.FloatingText(
          enemy.x,
          enemy.y + (opts.killTextDy !== undefined ? opts.killTextDy : -6),
          opts.killLabel || `+${opts.killPts}`,
          opts.killTextColor || opts.killColor || '#fbbf24'
        );
        this.saveHighScore();
      }
      return res;
    }

    triggerEarthquake(cx, cy) {
      const radius = 210;
      this.sound.earthquake();
      this.triggerScreenShake(0.38, 9);
      this.particles.EarthquakeWave(cx, cy);
      this.particles.FloatingText(cx - 48, cy - 42, '¡TERREMOTO!', '#fbbf24');

      let stunnedCount = 0;
      const stunEnemies = this.pigeons
        .concat(this.scooters)
        .concat(this.seagulls)
        .concat(this.madridCats)
        .concat(this.selfieTourists)
        .concat(this.royalGuards)
        .concat(this.peacocks)
        .concat(this.crazyCyclists)
        .concat(this.greenParakeets)
        .concat(this.swarmParakeets)
        .concat(this.jellyfishes)
        .concat(this.crabs)
        .concat(this.goats)
        .concat(this.royalSeagulls)
        .concat(this.swarmRoyalSeagulls)
        .concat(this.gallotias)
        .concat(this.garajonayFoxes)
        .concat(this.gaudiLizard ? [this.gaudiLizard] : [])
        .concat(this.abubillas)
        .concat(this.swarmAbubillas)
        .concat(this.zigzagPigeons)
        .concat(this.swarmPigeons)
        .concat(this.trapitos)
        .concat(this.motochorros)
        .concat(this.barrabravas)
        .concat(this.canillitas)
        .concat(this.fatPigeons)
        .concat(this.horneros)
        .concat(this.rockeros)
        .concat(this.penguins)
        .concat(this.palometas)
        .concat(this.pacificHazards)
        .concat(this.swarmMosquitoes)
        .concat(this.belgranoPirates)
        .concat(this.serranoBurros)
        .concat(this.miniUfos)
        .concat(this.seaLions)
        .concat(this.kingCrabs)
        .concat(this.fuegianFoxes)
        .concat(this.swarmCormorants)
        .concat(this.horneroNests)
        .concat(this.pumas)
        .concat(this.condors)
        .concat(this.portPelicans)
        .concat(this.frigates)
        .concat(this.vicunas)
        .concat(this.portDogs)
        .concat(this.rapaNuiWarriors)
        .concat(this.guasoDancers)
        .concat(this.swarmFrigates);

      for (let i = 0; i < stunEnemies.length; i++) {
        const enemy = stunEnemies[i];
        if (enemy.dead || enemy.broken || enemy.fallingFromPole || enemy.defeated) continue;
        if (typeof enemy.canReceiveStatus === 'function' && !enemy.canReceiveStatus()) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        const dist = Math.hypot(ex - cx, ey - cy);
        if (dist <= radius) {
          const knockDir = ex >= cx ? 1 : -1;
          if (global.Entities && global.Entities.BelgranoPirateEnemy && enemy instanceof global.Entities.BelgranoPirateEnemy) {
            if (typeof enemy.disarmFromEarthquake === 'function' && enemy.disarmFromEarthquake(knockDir)) {
              stunnedCount++;
              this.score += 25;
              this.particles.Burst(ex, ey, '#ef4444', 14);
              this.particles.Burst(ex, ey, '#fbbf24', 10);
              this.particles.FloatingText(enemy.x - 16, enemy.y - 18, '😡 ¡SIN FERNET! ¡FURIA!', '#fbbf24');
            }
          } else if (global.Entities && global.Entities.RoyalGuardEnemy && enemy instanceof global.Entities.RoyalGuardEnemy) {
            if (enemy.hasArmor && typeof enemy.breakArmor === 'function' && enemy.breakArmor(this.particles, knockDir)) {
              stunnedCount++;
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(enemy.x - 22, enemy.y - 18, '🛡️ ¡ESCUDO Y CASCO ROTOS!', '#fde047');
            } else if (!enemy.hasArmor) {
              enemy.stun(3.0);
              stunnedCount++;
              this.particles.Burst(ex, ey, '#fbbf24', 10);
            }
          } else if (global.Entities && global.Entities.PeacockEnemy && enemy instanceof global.Entities.PeacockEnemy) {
            // Regla general de área de efecto: NO resta HP ni mata de un golpe; solo cierra la cola y lo noquea
            enemy.stun(3.2);
            stunnedCount++;
            this.particles.Burst(ex, ey, '#fbbf24', 10);
            this.particles.FloatingText(enemy.x - 16, enemy.y - 18, '🦚 ¡NOQUEADO!', '#fde047');
          } else if (global.Entities && global.Entities.GaudiLizardEnemy && enemy instanceof global.Entities.GaudiLizardEnemy) {
            if (enemy.state === 'running' && this.defeatGaudiLizard(enemy, false)) {
              stunnedCount++;
            }
          } else if (global.Entities && global.Entities.CrazyCyclistEnemy && enemy instanceof global.Entities.CrazyCyclistEnemy) {
            enemy.dead = true;
            stunnedCount++;
            this.score += 70;
            this.sound.stomp();
            this.particles.Burst(ex, ey, '#ef4444', 14);
            this.particles.Burst(ex, ey, '#facc15', 10);
            this.particles.FloatingText(enemy.x, enemy.y - 8, '🚴 +70', '#38bdf8');
          } else if (global.Entities && global.Entities.RapaNuiWarrior && enemy instanceof global.Entities.RapaNuiWarrior) {
            if (enemy.hasMask && typeof enemy.breakMask === 'function' && enemy.breakMask(this.particles, knockDir)) {
              stunnedCount++;
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(enemy.x - 22, enemy.y - 18, '🗿 ¡MÁSCARA ROTA!', '#fde047');
            } else if (!enemy.hasMask) {
              enemy.stun(3.0);
              stunnedCount++;
              this.particles.Burst(ex, ey, '#fb923c', 10);
            }
          } else if (global.Entities && global.Entities.KingCrabEnemy && enemy instanceof global.Entities.KingCrabEnemy) {
            if (enemy.hasArmor && !enemy.armorBroken && enemy.takeHit(this.particles, knockDir, true, true) === 'armor_broken') {
              stunnedCount++;
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(enemy.x - 22, enemy.y - 18, '🦀 ¡CAPARAZÓN ROTO!', '#fde047');
            } else if (enemy.armorBroken) {
              enemy.stun(3.0);
              stunnedCount++;
              this.particles.Burst(ex, ey, '#fbbf24', 10);
            }
          } else if (global.Entities && global.Entities.BarrabravaEnemy && enemy instanceof global.Entities.BarrabravaEnemy && enemy.hasDrum) {
            if (enemy.takeHit(this.particles, knockDir, false, true) === 'drum_broken') {
              stunnedCount++;
              this.score += 25;
              enemy.stun(1.2);
              this.particles.FloatingText(enemy.x - 18, enemy.y - 18, '🥁 ¡BOMBO ROTO!', '#fde047');
            }
          } else if (global.Entities && global.Entities.HorneroNest && enemy instanceof global.Entities.HorneroNest) {
            const nestRes = this.damageHorneroNest(enemy, true);
            if (nestRes === 'cracked' || nestRes === 'destroyed') {
              stunnedCount++;
            }
          } else if (enemy.onPole && this.defeatPoleRockero(enemy, ex - cx, '⚡ ¡AL SUELO! +65', '#fbbf24')) {
            stunnedCount++;
          } else if (typeof enemy.stun === 'function') {
            enemy.stun(3.0);
            stunnedCount++;
            this.particles.Burst(ex, ey, '#fbbf24', 10);
          }
        }
      }

      for (let i = 0; i < this.blindCrabs.length; i++) {
        const bc = this.blindCrabs[i];
        if (bc.dead) continue;
        const bx = bc.x + bc.w * 0.5;
        const by = bc.y + bc.h * 0.5;
        if (Math.hypot(bx - cx, by - cy) <= radius) {
          if (!bc.shellBroken) {
            const crabRes = bc.shatter(this.particles, bx >= cx ? 1 : -1, true);
            if (crabRes === 'cracked') {
              this.score += 25;
              this.sound.spikeHit();
            }
          } else {
            bc.stun(2.5);
            stunnedCount++;
            this.particles.Burst(bx, by, '#fbbf24', 8);
          }
        }
      }

      const pricklyTargets = this.hedgehogs.concat(this.boars);
      for (let i = 0; i < pricklyTargets.length; i++) {
        const h = pricklyTargets[i];
        if (h.dead) continue;
        const hx = h.x + h.w * 0.5;
        const hy = h.y + h.h * 0.5;
        if (Math.hypot(hx - cx, hy - cy) <= radius) {
          if (global.Entities && global.Entities.Boar && h instanceof global.Entities.Boar) {
            const boarRes = h.takeHit(hx >= cx ? 1 : -1, true, true);
            if (boarRes === 'damaged') {
              this.score += 20;
              this.sound.stomp();
              this.particles.Burst(hx, hy, '#fde047', 12);
            } else if (boarRes === 'killed') {
              this.score += 65;
              this.particles.Burst(hx, hy, '#f97316', 18);
              this.particles.FloatingText(h.x - 10, h.y - 10, '¡JABALÍ DERROTADO! +65', '#fbbf24');
            }
          } else {
            h.dead = true;
            this.score += 65;
            this.particles.Burst(hx, hy, '#f97316', 18);
            this.particles.FloatingText(h.x - 10, h.y - 10, '¡ERIZO DERROTADO! +65', '#fbbf24');
          }
        }
      }

      if (stunnedCount > 0) {
        this.score += stunnedCount * 20;
      }
      this.saveHighScore();
    }

    triggerHypnoticPose(cx, cy) {
      const radius = 240;
      this.sound.hypnoticPose();
      this.particles.HypnoticHeartWave(cx, cy);
      this.particles.FloatingText(cx - 52, cy - 36, '¡HIPNOSIS ♥!', '#f43f5e');

      let hypnotizedCount = 0;
      const allEnemies = this.pigeons
        .concat(this.scooters)
        .concat(this.seagulls)
        .concat(this.madridCats)
        .concat(this.selfieTourists)
        .concat(this.royalGuards)
        .concat(this.peacocks)
        .concat(this.crazyCyclists)
        .concat(this.greenParakeets)
        .concat(this.swarmParakeets)
        .concat(this.jellyfishes)
        .concat(this.crabs)
        .concat(this.goats)
        .concat(this.royalSeagulls)
        .concat(this.swarmRoyalSeagulls)
        .concat(this.gallotias)
        .concat(this.garajonayFoxes)
        .concat(this.gaudiLizard ? [this.gaudiLizard] : [])
        .concat(this.abubillas)
        .concat(this.hedgehogs)
        .concat(this.boars)
        .concat(this.zigzagPigeons)
        .concat(this.swarmPigeons)
        .concat(this.trapitos)
        .concat(this.motochorros)
        .concat(this.barrabravas)
        .concat(this.canillitas)
        .concat(this.fatPigeons)
        .concat(this.horneros)
        .concat(this.rockeros)
        .concat(this.penguins)
        .concat(this.palometas)
        .concat(this.pacificHazards)
        .concat(this.swarmMosquitoes)
        .concat(this.belgranoPirates)
        .concat(this.serranoBurros)
        .concat(this.miniUfos)
        .concat(this.seaLions)
        .concat(this.kingCrabs)
        .concat(this.fuegianFoxes)
        .concat(this.swarmCormorants)
        .concat(this.pumas)
        .concat(this.condors)
        .concat(this.portPelicans)
        .concat(this.frigates)
        .concat(this.vicunas)
        .concat(this.portDogs)
        .concat(this.rapaNuiWarriors)
        .concat(this.guasoDancers)
        .concat(this.swarmFrigates);

      for (let i = 0; i < allEnemies.length; i++) {
        const enemy = allEnemies[i];
        if (enemy.dead || enemy.fallingFromPole || enemy.defeated) continue;
        if (typeof enemy.canReceiveStatus === 'function' && !enemy.canReceiveStatus()) continue;
        const ex = enemy.x + enemy.w * 0.5;
        const ey = enemy.y + enemy.h * 0.5;
        const dist = Math.hypot(ex - cx, ey - cy);
        if (dist <= radius) {
          if (enemy.immuneToHypnosis || (global.Entities && global.Entities.MiniUfoEnemy && enemy instanceof global.Entities.MiniUfoEnemy)) {
            this.particles.Burst(ex, ey, '#38bdf8', 8);
            this.particles.FloatingText(enemy.x - 10, enemy.y - 18, '¡INMUNE!', '#38bdf8');
          } else if (enemy.onPole && this.defeatPoleRockero(enemy, ex - cx, '♥ ¡AL SUELO! +65', '#f43f5e')) {
            hypnotizedCount++;
          } else if (global.Entities && global.Entities.PeacockEnemy && enemy instanceof global.Entities.PeacockEnemy) {
            // Pose / Encanto de Andrea: NO resta HP ni mata de un golpe; cierra la cola y lo enamora con corazones
            enemy.hypnotize(3.5);
            hypnotizedCount++;
            this.particles.Burst(ex, ey, '#f43f5e', 10);
            this.particles.FloatingText(enemy.x - 18, enemy.y - 18, '🦚 ¡ENAMORADO ♥!', '#fb7185');
          } else if (global.Entities && global.Entities.GaudiLizardEnemy && enemy instanceof global.Entities.GaudiLizardEnemy) {
            if (enemy.state === 'running' && this.defeatGaudiLizard(enemy, false)) {
              hypnotizedCount++;
            }
          } else {
            enemy.hypnotize(3.0);
            hypnotizedCount++;
            this.particles.Burst(ex, ey, '#f43f5e', 10);
          }
        }
      }
      if (hypnotizedCount > 0) {
        this.score += hypnotizedCount * 20;
        this.saveHighScore();
      }
    }

    triggerTinaGrowl() {
      if (!this.tina) return;
      const emergencySwarm =
        this.swarmAlertTimer > 0 ||
        (this.swarmCormorants && this.swarmCormorants.length > 0) ||
        (this.swarmFrigates && this.swarmFrigates.length > 0) ||
        (this.swarmMosquitoes && this.swarmMosquitoes.length > 0) ||
        (this.swarmHorneros && this.swarmHorneros.length > 0) ||
        (this.swarmPigeons && this.swarmPigeons.length > 0);
      if (!this.tina.activateFierceGrowl()) {
        if (!emergencySwarm) return;
        this.tina.growlCooldown = this.tina.growlMaxCooldown;
        this.tina.growlTimer = 1.6;
        if (this.tina.isGrounded) this.tina.jump(-290);
      }

      const tx = this.tina.x + this.tina.w * 0.5;
      const ty = this.tina.y + this.tina.h * 0.5;

      // Audio Realista de Ladrido Doble ("¡Guau, guau!")
      this.sound.tinaGrowl();
      this.triggerScreenShake(0.32, 6);
      this.particles.TinaSonicGrowlWave(tx, ty);
      this.particles.FloatingText(tx - 58, ty - 38, '¡GUAU, GUAU!', '#10b981');

      let scaredCount = 0;
      const handledNests = new Set();
      const birds = this.pigeons
        .concat(this.seagulls)
        .concat(this.zigzagPigeons)
        .concat(this.greenParakeets)
        .concat(this.royalSeagulls)
        .concat(this.abubillas)
        .concat(this.fatPigeons)
        .concat(this.horneros)
        .concat(this.condors)
        .concat(this.portPelicans)
        .concat(this.frigates);
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        if (b.dead || b.scaredFlying) continue;
        if (b.nest && (b.state === 'peeking' || b.state === 'perched' || b.state === 'hidden')) {
          if (b.nest.x + b.nest.w >= this.cameraX - 50 && b.nest.x <= this.cameraX + LOGICAL_W + 50) {
            if (typeof b.scareHideInNest === 'function' && b.scareHideInNest(5.0)) {
              handledNests.add(b.nest);
              this.particles.Burst(b.nest.x + b.nest.w * 0.5, b.nest.y + b.nest.h * 0.5, '#fde68a', 8);
              this.particles.FloatingText(b.nest.x - 8, b.nest.y - 12, '¡ESCONDIDO 5s!', '#6ee7b7');
            }
          }
          continue;
        }
        if (b.state === 'peeking' || b.state === 'hidden') continue;
        if (b.x + b.w >= this.cameraX - 50 && b.x <= this.cameraX + LOGICAL_W + 50) {
          if (b.scareFlyUp()) {
            scaredCount++;
            this.particles.Burst(b.x + b.w * 0.5, b.y + b.h * 0.5, '#cbd5e1', 10);
            this.particles.FloatingText(b.x, b.y - 10, '¡HUYE! +25', '#6ee7b7');
          }
        }
      }

      let swarmScared = 0;
      const allSwarmBirds = this.swarmPigeons
        .concat(this.swarmParakeets)
        .concat(this.swarmRoyalSeagulls)
        .concat(this.swarmAbubillas)
        .concat(this.swarmHorneros)
        .concat(this.swarmMosquitoes)
        .concat(this.swarmCormorants)
        .concat(this.swarmFrigates);
      for (let i = 0; i < allSwarmBirds.length; i++) {
        const sp = allSwarmBirds[i];
        if (!sp.dead && !sp.scaredFlying && sp.scareFlyUp()) {
          swarmScared++;
          this.particles.Burst(sp.x + 12, sp.y + 10, '#6ee7b7', 8);
        }
      }

      if (swarmScared > 0) {
        this.swarmAlertTimer = 0;
        this.score += swarmScared * 25;
        this.particles.FloatingText(
          this.player.x - 40,
          this.player.y - 45,
          `¡LA TINA DESPEJÓ EL ENJAMBRE! +${swarmScared * 25}`,
          '#4ade80'
        );
      }

      // El ladrido sónico [S] también asusta y hace caer al rockero trepado al poste
      for (let i = 0; i < this.rockeros.length; i++) {
        const rk = this.rockeros[i];
        if (!rk || !rk.onPole || rk.dead || rk.fallingFromPole || rk.defeated) continue;
        if (rk.x + rk.w >= this.cameraX - 50 && rk.x <= this.cameraX + LOGICAL_W + 50) {
          this.defeatPoleRockero(rk, (rk.x + rk.w * 0.5) - tx, '🐾 ¡AL SUELO! +65', '#6ee7b7');
        }
      }

      // En Argentina (Buenos Aires y Rosario): el ladrido [S] asusta a Motochorros y Trapitos cercanos
      const barkRadius = 460;
      const leaderX = this.player ? this.player.x + this.player.w * 0.5 : tx;
      const leaderY = this.player ? this.player.y + this.player.h * 0.5 : ty;
      const withinBarkReach = (ex, ey) =>
        Math.hypot(ex - tx, ey - ty) <= barkRadius ||
        Math.hypot(ex - leaderX, ey - leaderY) <= 420;

      let scaredMotochorros = 0;
      for (let i = 0; i < this.motochorros.length; i++) {
        const m = this.motochorros[i];
        if (!m || m.dead || m.crashingFromBark || m.defeated) continue;
        if (m.x + m.w < this.cameraX - 60 || m.x > this.cameraX + LOGICAL_W + 60) continue;
        const mx = m.x + m.w * 0.5;
        const my = m.y + m.h * 0.5;
        if (withinBarkReach(mx, my) && typeof m.scareCrash === 'function' && m.scareCrash(tx)) {
          scaredMotochorros++;
          this.particles.Burst(mx, my, '#facc15', 14);
          this.particles.FloatingText(m.x - 8, m.y - 26, '❗ ¡DERRAPE!', '#facc15');
        }
      }
      if (scaredMotochorros > 0 && this.sound && typeof this.sound.playMotoSkidCrash === 'function') {
        this.sound.playMotoSkidCrash();
      }

      for (let i = 0; i < this.trapitos.length; i++) {
        const tr = this.trapitos[i];
        if (!tr || tr.dead || tr.scaredFleeing || tr.defeated) continue;
        if (tr.x + tr.w < this.cameraX - 60 || tr.x > this.cameraX + LOGICAL_W + 60) continue;
        const trx = tr.x + tr.w * 0.5;
        const tryy = tr.y + tr.h * 0.5;
        if (withinBarkReach(trx, tryy) && typeof tr.scareFlee === 'function' && tr.scareFlee(tx, leaderX)) {
          this.score += 55;
          this.particles.Burst(trx, tryy, '#6ee7b7', 12);
          this.particles.FloatingText(tr.x - 10, tr.y - 24, '🐾 +55', '#6ee7b7');
        }
      }

      // Horneros en su nido: el ladrido los asusta y los mantiene escondidos 5.0s dentro del nido
      for (let i = 0; i < this.horneroNests.length; i++) {
        const nest = this.horneroNests[i];
        if (!nest || nest.dead || nest.broken || nest.falling || handledNests.has(nest)) continue;
        if (nest.x + nest.w < this.cameraX - 50 || nest.x > this.cameraX + LOGICAL_W + 50) continue;
        if (typeof nest.scareHideInNest === 'function' && nest.scareHideInNest(5.0)) {
          handledNests.add(nest);
          this.particles.Burst(nest.x + nest.w * 0.5, nest.y + nest.h * 0.5, '#fde68a', 8);
          this.particles.FloatingText(nest.x - 8, nest.y - 12, '¡ESCONDIDO 5s!', '#6ee7b7');
        }
      }

      // En Chile (Valparaíso / Viña): el ladrido [X] alegra y ahuyenta juguetonamente al Perro Porteño
      for (let i = 0; i < this.portDogs.length; i++) {
        const pd = this.portDogs[i];
        if (!pd || pd.dead || pd.happyFleeing) continue;
        if (pd.x + pd.w < this.cameraX - 60 || pd.x > this.cameraX + LOGICAL_W + 60) continue;
        const pdx = pd.x + pd.w * 0.5;
        const pdy = pd.y + pd.h * 0.5;
        if (withinBarkReach(pdx, pdy) && typeof pd.scareFlyUp === 'function' && pd.scareFlyUp()) {
          this.score += 45;
          this.particles.Burst(pdx, pdy, '#fde047', 12);
          this.particles.FloatingText(pd.x - 12, pd.y - 24, '🐾 ¡AMIGO FIEL! +45', '#6ee7b7');
        }
      }

      // El Pirata de Belgrano es inmune al ladrido sónico de La Tina
      for (let i = 0; i < this.belgranoPirates.length; i++) {
        const bp = this.belgranoPirates[i];
        if (!bp || bp.dead) continue;
        if (bp.x + bp.w < this.cameraX - 60 || bp.x > this.cameraX + LOGICAL_W + 60) continue;
        const bpx = bp.x + bp.w * 0.5;
        const bpy = bp.y + bp.h * 0.5;
        if (withinBarkReach(bpx, bpy)) {
          bp.scareByTinaBark();
          this.particles.FloatingText(bp.x - 10, bp.y - 20, '🛡️ ¡SIN MIEDO!', '#38bdf8');
        }
      }

      if (scaredCount > 0) {
        this.score += scaredCount * 25;
      }
      this.saveHighScore();
    }

    spawnMadridClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.0;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.65, 8);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 60,
        this.player.y - 48,
        `🚨 ¡ALERTA DE PLAGA! ¡ENJAMBRE DE 20 COTORRAS! ¡USÁ [${kTina}]! 🚨`,
        '#ef4444'
      );

      this.swarmParakeets = [];
      for (let i = 0; i < 20; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const sx = this.player.x + 280 + col * 48 + row * 22;
        const sy = 40 + row * 46 + (col % 2) * 16;
        const spd = 360 + (i % 5) * 18;
        this.swarmParakeets.push(new global.Entities.SwarmParakeet(sx, sy, spd));
      }
    }

    spawnPalmaClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.0;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.7, 9);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 70,
        this.player.y - 48,
        `⛈️ ¡TORMENTA MARINA! ¡20 GAVIOTAS REALES! ¡USÁ [${kTina}]! 🚨`,
        '#38bdf8'
      );

      this.swarmRoyalSeagulls = [];
      for (let i = 0; i < 20; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const sx = this.player.x + 290 + col * 50 + row * 20;
        const sy = 36 + row * 46 + (col % 2) * 18;
        const spd = 385 + (i % 5) * 18;
        this.swarmRoyalSeagulls.push(new global.Entities.SwarmRoyalSeagull(sx, sy, spd));
      }
    }

    spawnCanariasClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.0;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.75, 9);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 75,
        this.player.y - 48,
        `🌋 ¡ALERTA VOLCÁNICA! ¡20 ABUBILLAS CANARIAS! ¡USÁ [${kTina}]! 🚨`,
        '#fb923c'
      );

      this.swarmAbubillas = [];
      for (let i = 0; i < 20; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const sx = this.player.x + 295 + col * 52 + row * 22;
        const sy = 34 + row * 46 + (col % 2) * 18;
        const spd = 395 + (i % 5) * 18;
        this.swarmAbubillas.push(new global.Entities.SwarmCanarianHoopoe(sx, sy, spd));
      }
    }

    spawnBuenosAiresClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.5;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.75, 9);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 85,
        this.player.y - 48,
        `🚨 ¡ATAQUE FINAL! ¡BANDADA DE HORNEROS TELEDIRIGIDOS! ¡USÁ [${kTina}]! 🚨`,
        '#ef4444'
      );

      this.swarmHorneros = [];
      const spawnBaseX = Math.max(this.player.x + 280, this.cameraX + LOGICAL_W + 40);
      const baSwarmAi = {
        homing: true,
        aiTier: (this.levelData && Number(this.levelData.aiTier)) || 4,
        cityKey: this.cityKey
      };
      for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const sx = spawnBaseX + col * 52 + row * 28;
        const sy = 56 + row * 68 + (col % 2) * 20;
        const spd = 370 + (i % 4) * 20;
        this.swarmHorneros.push(
          new global.Entities.HorneroEnemy(
            sx,
            sy,
            this.player.x + this.player.w * 0.5,
            this.player.y + this.player.h * 0.45,
            spd,
            baSwarmAi
          )
        );
      }
    }

    spawnRosarioClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.5;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.75, 9);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 95,
        this.player.y - 48,
        `🦟 ¡NUBE DE MOSQUITOS DEL PARANÁ! ¡USÁ A TINA [${kTina}]! 🦟`,
        '#fbbf24'
      );

      this.swarmMosquitoes = [];
      const spawnBaseX = Math.max(this.player.x + 260, this.cameraX + LOGICAL_W + 30);
      const roSwarmAi = {
        aiTier: (this.levelData && Number(this.levelData.aiTier)) || 4,
        cityKey: this.cityKey
      };
      for (let i = 0; i < 20; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const sx = spawnBaseX + col * 42 + row * 24;
        const sy = 56 + row * 58 + (col % 2) * 18;
        const spd = 290 + (i % 5) * 18;
        this.swarmMosquitoes.push(new global.Entities.SwarmMosquito(sx, sy, spd, roSwarmAi));
      }
    }

    spawnUshuaiaClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.5;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.75, 9);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 105,
        this.player.y - 48,
        `🦅 ¡20 CORMORANES AUSTRALES! ¡USÁ A TINA [${kTina}]! 🦅`,
        '#38bdf8'
      );

      this.swarmCormorants = [];
      const spawnBaseX = Math.max(this.player.x + 260, this.cameraX + LOGICAL_W + 30);
      for (let i = 0; i < 20; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const sx = spawnBaseX + col * 44 + row * 26;
        const sy = 56 + row * 58 + (col % 2) * 18;
        const spd = 295 + (i % 5) * 16;
        this.swarmCormorants.push(new global.Entities.SwarmCormorant(sx, sy, spd));
      }
    }

    spawnChilePascuaClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.5;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.75, 9);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 105,
        this.player.y - 48,
        `🦅 ¡20 FRAGATAS DEL PACÍFICO! ¡USÁ A TINA [${kTina}]! 🦅`,
        '#fb923c'
      );

      this.swarmFrigates = [];
      const spawnBaseX = Math.max(this.player.x + 260, this.cameraX + LOGICAL_W + 30);
      for (let i = 0; i < 20; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const sx = spawnBaseX + col * 44 + row * 26;
        const sy = 56 + row * 58 + (col % 2) * 18;
        const spd = 305 + (i % 5) * 16;
        this.swarmFrigates.push(new global.Entities.SwarmFrigate(sx, sy, spd));
      }
    }

    spawnClimaxSwarm() {
      this.swarmEventTriggered = true;
      this.swarmAlertTimer = 6.0;
      this.sound.alarmSiren();
      this.triggerScreenShake(0.65, 8);
      const kTina = this.getControlKeyBadge('tina', true, 'X');
      this.particles.FloatingText(
        this.player.x - 60,
        this.player.y - 48,
        `⚠️ ¡PELIGRO! ¡ENJAMBRE DE 20 PALOMAS! ¡USÁ [${kTina}]! ⚠️`,
        '#ef4444'
      );

      this.swarmPigeons = [];
      for (let i = 0; i < 20; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const sx = this.player.x + 260 + col * 52 + row * 24;
        const sy = 35 + row * 48 + (col % 2) * 18;
        const spd = 375 + (i % 5) * 16;
        this.swarmPigeons.push(new global.Entities.SwarmPigeon(sx, sy, spd));
      }
    }

    pauseGame() {
      if (this.state !== 'playing') return false;
      this.state = 'paused';
      this.clearTransientInput();
      if (this.sound) {
        if (typeof this.sound.playPauseSfx === 'function') this.sound.playPauseSfx(true);
        else if (typeof this.sound.menuSelect === 'function') this.sound.menuSelect();
        if (typeof this.sound.pauseMusic === 'function') this.sound.pauseMusic();
      }
      return true;
    }

    resumeGame() {
      if (this.state !== 'paused') return false;
      this.state = 'playing';
      this.clearTransientInput();
      if (this.sound) {
        if (typeof this.sound.resumeMusic === 'function') this.sound.resumeMusic();
        if (typeof this.sound.playPauseSfx === 'function') this.sound.playPauseSfx(false);
        else if (typeof this.sound.menuSelect === 'function') this.sound.menuSelect();
      }
      return true;
    }

    togglePause() {
      if (this.state === 'playing') return this.pauseGame();
      if (this.state === 'paused') return this.resumeGame();
      return false;
    }

    loop(timestamp) {
      requestAnimationFrame((ts) => this.loop(ts));
      const now = Number.isFinite(timestamp) ? timestamp : performance.now();
      const prev = Number.isFinite(this.lastTimestamp) ? this.lastTimestamp : now;
      const dt = Math.min(Math.max(0, (now - prev) / 1000), 0.05);
      this.lastTimestamp = now;
      if (this.state !== 'paused') {
        this.globalAnimTime += dt;
      }

      try {
        this.update(dt);
        this.render();
      } catch (err) {
        console.error('[BarcelonaGame] Error en ciclo de render:', err);
      }
    }

    update(dt) {
      if (this.screenShakeTimer > 0) {
        this.screenShakeTimer = Math.max(0, this.screenShakeTimer - dt);
      }
      if (this.state !== 'paused' && this.ghostToastTimer > 0) {
        this.ghostToastTimer = Math.max(0, this.ghostToastTimer - dt);
      }
      if (this.ghostRescueToastCooldown > 0) {
        this.ghostRescueToastCooldown = Math.max(0, this.ghostRescueToastCooldown - dt);
      }

      if (this.state === 'victory') {
        this.fireworkTimer -= dt;
        if (this.fireworkTimer <= 0) {
          this.fireworkTimer = 0.45 + Math.random() * 0.5;
          const fx = 150 + Math.random() * 660;
          const fy = 70 + Math.random() * 200;
          const colors = ['#fbbf24', '#f43f5e', '#38bdf8', '#22c55e', '#a855f7'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          this.particles.Burst(fx, fy, color, 26);
        }
        this.particles.update(dt);
        return;
      }

      if (this.state === 'player_dead') {
        this.updatePlayerDead(dt);
        return;
      }

      if (this.state === 'level_cinematic') {
        this.updateLevelCinematic(dt);
        return;
      }

      if (this.state === 'cheat_iris') {
        this.updateCheatIris(dt);
        if (this.inputManager) this.inputManager.clearStepTriggers();
        return;
      }

      if (this.state === 'splash') {
        if (this.inputManager) this.inputManager.clearStepTriggers();
        return;
      }

      if (
        this.state === 'menu' ||
        this.state === 'save_slots' ||
        this.state === 'controls' ||
        this.state === 'leaderboard' ||
        this.state === 'settings'
      ) {
        this.updateMenuLeaderDemo(dt);
      }

      if (this.state === 'level_clear') {
        this.updateLevelClearScreen(dt);
        if (this.inputManager) this.inputManager.clearStepTriggers();
        return;
      }

      if (this.state === 'map') {
        this.mapScreen.update(dt);
        if (this.inputManager) this.inputManager.clearStepTriggers();
        return;
      }
      if (this.state !== 'playing') {
        if (this.inputManager) this.inputManager.clearStepTriggers();
        return;
      }

      if (this.isAbductedByCheat && this.abductionCheat) {
        this.totalTime += dt;
        this.levelTime += dt;
        this.updateOverlayTimers(dt);

        this.updateEtHomeAbduction(dt);

        if (this.inputManager) {
          this.inputManager.clearStepTriggers();
        }
        this.clearTransientInput();
        if (this.abductionCheat && this.abductionCheat.phase !== 'falling') {
          this.particles.update(dt);
        }
        return;
      }

      if (this.isBiplaneFlightCheat && this.biplaneFlightCheat) {
        this.totalTime += dt;
        this.levelTime += dt;
        this.updateOverlayTimers(dt);

        this.updateBiplaneTourFlight(dt);

        if (this.inputManager) {
          this.inputManager.clearStepTriggers();
        }
        return;
      }

      const cheatScheme = this.getControlSchemeSafe();
      const cheatActionHeld =
        global.Input && typeof global.Input.isDown === 'function'
          ? global.Input.isDown(cheatScheme.left) ||
            global.Input.isDown(cheatScheme.right) ||
            global.Input.isDown(cheatScheme.up) ||
            global.Input.isDown(cheatScheme.down) ||
            (global.Input.isDown(cheatScheme.jump) && this.getCheatElapsedMs() > 300)
          : false;
      if (
        this.startCheatEligible &&
        (cheatActionHeld ||
          this.input.left ||
          this.input.right ||
          this.input.up ||
          this.input.down ||
          this.input.downPressed ||
          ((this.input.jumpPressed || this.input.jumpHeld) && this.getCheatElapsedMs() > 300) ||
          this.input.shootPressed ||
          this.input.tinaPressed ||
          this.input.skillPressed ||
          this.input.reservePressed ||
          Math.abs(this.input.analogX || 0) > 0.16 ||
          Math.abs(this.input.analogY || 0) > 0.16 ||
          (this.player &&
            Number.isFinite(this.cheatSpawnX) &&
            Math.abs(this.player.x - this.cheatSpawnX) > 0.5))
      ) {
        this.invalidateStartCheat();
      }

      this.levelTime += dt;
      this.levelTimer = Math.max(0, this.levelTimer - dt);
      this.timeLeft = this.levelTimer;

      // Comprobación estricta de tiempo agotado (Time Up a los 00s)
      if (this.levelTimer <= 0) {
        this.handleTimeUp();
        return;
      }

      // Alerta cuando el reloj baja de 15 segundos: pitidos, parpadeo y BGM +35%
      if (this.levelTimer < 15.0 && !this.hurryUpTriggered) {
        this.hurryUpTriggered = true;
        if (this.sound) {
          this.sound.playHurryUpAlert();
          this.sound.setHurryUp(true);
        }
        this.particles.FloatingText(
          this.player.x - 30,
          this.player.y - 40,
          '⏰ ¡15 SEGUNDOS! ¡APÚRATE! ⏰',
          '#ef4444'
        );
        this.triggerScreenShake(0.3, 5);
      }
      this.totalTime += dt;
      this.updateOverlayTimers(dt);

      // Activar carteles tutoriales discretos arriba durante ~3.8 segundos visibles al acercarse
      if (this.hints && this.player) {
        for (let i = 0; i < this.hints.length; i++) {
          const h = this.hints[i];
          if (!h.triggered && this.player.x + 80 >= h.x && this.player.x <= h.x + 280) {
            h.triggered = true;
            this.activeHintText = h.text;
            this.activeHintTimer = 3.8;
          }
        }
      }

      // 0. Evento de Clímax en Nivel 4: Enjambre de Palomas / Cotorras / Gaviotas / Abubillas / Horneros / Mosquitos
      if (
        this.levelData.swarmTriggerX &&
        !this.swarmEventTriggered &&
        this.player.x >= this.levelData.swarmTriggerX
      ) {
        if (this.isCormorantSwarm || this.cityKey === 'ushuaia') {
          this.spawnUshuaiaClimaxSwarm();
        } else if (this.isFrigateSwarm || this.cityKey === 'chile_pascua') {
          this.spawnChilePascuaClimaxSwarm();
        } else if (this.isMosquitoSwarm || this.cityKey === 'rosario') {
          this.spawnRosarioClimaxSwarm();
        } else if (this.isHorneroSwarm || this.cityKey === 'buenosaires') {
          this.spawnBuenosAiresClimaxSwarm();
        } else if (this.isCanariasSwarm || this.cityKey === 'canarias') {
          this.spawnCanariasClimaxSwarm();
        } else if (this.isPalmaSwarm || this.cityKey === 'palma') {
          this.spawnPalmaClimaxSwarm();
        } else if (this.isMadridSwarm || this.cityKey === 'madrid') {
          this.spawnMadridClimaxSwarm();
        } else {
          this.spawnClimaxSwarm();
        }
      }

      // 0b. Viento Costero Interactivo (Palma) o Viento de Tren en marcha (Buenos Aires Zona 4)
      if (this.hasWind) {
        this.windTimer = (this.windTimer + dt) % 7.5;
        this.windActive = this.windTimer >= 3.2;
        this.windForceX = this.windActive ? -52 : 0;
      } else if (this.constantWindX !== 0) {
        this.windActive = true;
        this.windForceX = this.constantWindX;
      } else {
        this.windActive = false;
        this.windForceX = 0;
      }

      // 0c. Auto-scrolling (Zona 4: Tren Mitre a Retiro)
      if (this.autoScrollSpeed > 0) {
        const maxCamX = Math.max(0, this.levelData.width - LOGICAL_W);
        this.cameraX = Math.min(maxCamX, this.cameraX + this.autoScrollSpeed * dt);
      }

      // 1. Plataformas móviles, que caen y contenedores flotantes de Puerto Madero
      for (let i = 0; i < this.movingPlatforms.length; i++) {
        this.movingPlatforms[i].update(dt);
      }
      for (let i = 0; i < this.fallingPlatforms.length; i++) {
        this.fallingPlatforms[i].update(dt);
      }
      for (let i = 0; i < this.sinkingContainers.length; i++) {
        this.sinkingContainers[i].update(dt);
      }
      for (let i = 0; i < this.ropes.length; i++) {
        this.ropes[i].update(dt);
      }
      for (let i = 0; i < this.subwayVents.length; i++) {
        this.subwayVents[i].update(dt);
      }
      for (let i = 0; i < this.overheadHazards.length; i++) {
        this.overheadHazards[i].update(dt, this.player);
      }
      for (let i = 0; i < this.hiddenBlocks.length; i++) {
        this.hiddenBlocks[i].update(dt);
      }
      const activePlatforms = this.movingPlatforms
        .concat(this.fallingPlatforms)
        .concat(this.sinkingContainers);

      // 2. Acciones especiales: Ladrido Doble de la Tina [X], Disparo de Planta [Z] y Reserva [SHIFT]
      if (this.input.tinaPressed) {
        this.triggerTinaGrowl();
      }
      if (this.input.shootPressed) {
        this.tryShootPlant();
      }
      if (this.input.reservePressed) {
        this.swapReserveItem();
      }

      // 3. Actualizar Líder y sus dos acompañantes en simultáneo
      this.input.jump = this.input.jumpHeld || this.input.jumpPressed;
      const solidHazards = this.overheadHazards.filter((h) => h.isSolidBlock !== false);
      const revealedHiddenBlocks = this.hiddenBlocks.filter((hb) => hb && hb.revealed);
      const playerSolids = this.solids.concat(solidHazards).concat(revealedHiddenBlocks);
      this.player.ghostMode = Boolean(this.ghostMode);
      this.player.update(
        dt,
        this.input,
        playerSolids,
        activePlatforms,
        this.sound,
        this.particles,
        [this.partner, this.tina],
        {
          onEarthquake: (cx, cy) => this.triggerEarthquake(cx, cy),
          onHypnoticPose: (cx, cy) => this.triggerHypnoticPose(cx, cy),
          onRevealHiddenBlock: (hb, info) => this.handleHiddenBlockReveal(hb, info)
        },
        this.windForceX,
        {
          sandMode: this.hasSandPhysics,
          iceMode: this.hasIcePhysics,
          isIceLevel: this.isIceLevel,
          saltMode: this.hasSaltPhysics,
          ropes: this.ropes,
          hiddenBlocks: this.hiddenBlocks
        }
      );
      if (this.autoScrollSpeed > 0) {
        const pushLimitX = this.cameraX + 14;
        if (this.player.x < pushLimitX) {
          const box = this.player.getActiveHitbox();
          let blockedMaxX = pushLimitX;
          for (let i = 0; i < playerSolids.length; i++) {
            const s = playerSolids[i];
            if (s.oneWay) continue;
            if (
              box.y + 4 < s.y + s.h &&
              this.player.y + this.player.h - 4 > s.y &&
              s.x >= this.player.x + this.player.w - 4 &&
              s.x - this.player.w < blockedMaxX
            ) {
              blockedMaxX = s.x - this.player.w;
            }
          }
          this.player.x = Math.min(pushLimitX, Math.max(this.player.x, blockedMaxX));
          if (this.player.x <= this.cameraX) {
            if (this.ghostMode) {
              this.player.x = pushLimitX;
              this.player.vx = Math.max(this.player.vx, 0);
            } else {
              this.sound.playerDeath();
              this.particles.FloatingText(
                this.player.x,
                Math.max(60, this.player.y - 20),
                '💥 ¡APLASTADO!',
                '#ef4444'
              );
              this.triggerPlayerDeath(false, false);
              return;
            }
          }
        }
      }
      this.player.x = Math.min(this.levelData.width - this.player.w, Math.max(0, this.player.x));

      // Impulso vertical en rejillas de Subte ('vent') y daño real en llamas votivas ('flame')
      for (let i = 0; i < this.subwayVents.length; i++) {
        const sv = this.subwayVents[i];
        const ventBox = sv.getUpdraftBox();
        if (ventBox && global.Entities.aabbOverlap(this.player, ventBox)) {
          this.player.vy = Math.max(-565, Math.min(this.player.vy - 1850 * dt, -260));
          this.player.onGround = false;
          this.player.jumpsUsed = Math.min(this.player.jumpsUsed, 1);
          if (Math.random() < 0.35) {
            this.particles.Sparkle(this.player.x + this.player.w * 0.5, this.player.y + this.player.h, '#bae6fd');
          }
        }
        const flameBox = typeof sv.getFlameHazardBox === 'function' ? sv.getFlameHazardBox() : null;
        if (!this.ghostMode && flameBox && global.Entities.aabbOverlap(this.player, flameBox)) {
          if (this.player.invincibleTimer <= 0 && !this.player.isGroundPounding) {
            this.particles.Burst(sv.x + sv.w * 0.5, sv.y - 26, '#f97316', 14);
            this.particles.FloatingText(this.player.x - 10, this.player.y - 18, '🔥 ¡QUEMA!', '#fb923c');
          }
          this.damagePlayer(sv.x + sv.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }
      if (this.inputManager) {
        this.inputManager.clearStepTriggers();
      } else {
        this.input.jumpPressed = false;
        this.input.downPressed = false;
        this.input.skillPressed = false;
        this.input.tinaPressed = false;
        this.input.shootPressed = false;
        this.input.reservePressed = false;
      }

      const screenLeft = this.cameraX - 24;
      const screenRight = this.cameraX + LOGICAL_W + 24;
      const powerUpTypes = new Set(['angel_wings', 'plant', 'calamares', 'electric_shield']);
      for (let i = 0; i < this.collectibles.length; i++) {
        const c = this.collectibles[i];
        if (!c || c.collected || !powerUpTypes.has(c.type)) continue;
        if (
          c.isReserveDrop ||
          c.popTimer > 0 ||
          (c.x + c.w >= screenLeft && c.x <= screenRight)
        ) {
          c._seenOnScreen = true;
        }
      }

      this.partner.update(dt, this.player, this.solids, activePlatforms);
      this.tina.update(dt, this.player, this.solids, activePlatforms, this.collectibles);

      // 4. ¿El Líder cayó al agua profunda, lava volcánica o en un pozo mortal? (cuesta 1 vida)
      if (this.ghostMode) {
        const rescueLimitY =
          this.hasLavaPits || this.hasDeadlyPits || this.hasWaterPits ? 494 : LOGICAL_H + 40;
        if (this.player.y > rescueLimitY) {
          this.rescueGhostFromPit();
        }
      } else {
        if (this.hasLavaPits && this.player.y > 494) {
          if (this.sound && typeof this.sound.spikeHit === 'function') {
            this.sound.spikeHit();
          }
          this.particles.Burst(this.player.x + 16, 488, '#f97316', 24);
          this.particles.FloatingText(this.player.x - 18, 450, '🌋 ¡CRÁTER ARDIENTE! -1 VIDA', '#fb923c');
          this.loseLife(true);
          return;
        }
        if (this.hasDeadlyPits && this.player.y > 494) {
          if (this.sound && typeof this.sound.pitFall === 'function') {
            this.sound.pitFall();
          }
          this.particles.Burst(this.player.x + 16, 488, '#4ade80', 18);
          this.particles.FloatingText(this.player.x - 18, 450, '🌿 ¡AL ABISMO! -1 VIDA', '#4ade80');
          this.loseLife(true);
          return;
        }
        if (this.hasWaterPits && this.player.y > 494) {
          if (this.sound && typeof this.sound.waterSplash === 'function') {
            this.sound.waterSplash();
          }
          const pitSplashCol = this.isRosarioParanaWater() ? '#e7d3b0' : '#38bdf8';
          this.particles.Burst(this.player.x + 16, 488, pitSplashCol, 22);
          this.particles.FloatingText(this.player.x - 18, 450, '🌊 ¡AL AGUA! -1 VIDA', pitSplashCol);
          this.loseLife(true);
          return;
        }
        if (this.player.y > LOGICAL_H + 60) {
          this.loseLife(true);
          return;
        }
      }

      // 5. Colisión compartida de Coleccionables y Power-Ups Mutuamente Excluyentes
      if (this.tina && this.tina.goldenBoostTimer > 0 && this.particles && Math.random() < 0.25) {
        this.particles.Sparkle(
          this.tina.x + Math.random() * this.tina.w,
          this.tina.y + Math.random() * this.tina.h,
          '#fde047'
        );
      }
      const partyMembers = [this.player, this.partner, this.tina];
      for (let i = 0; i < this.collectibles.length; i++) {
        const c = this.collectibles[i];
        c.update(dt, this.solids, this.movingPlatforms);
        if (
          !c.collected &&
          (c.type === 'extra_life_heart' || c.type === '1up_heart' || (c.type === 'tina_golden_bone' && c.isHighArcDrop)) &&
          this.particles &&
          Math.random() < 0.45
        ) {
          this.particles.Sparkle(
            c.x + 13 + (Math.random() - 0.5) * 14,
            c.y + 13 + (Math.random() - 0.5) * 14,
            c.type === 'extra_life_heart' || c.type === '1up_heart'
              ? Math.random() < 0.5 ? '#fb7185' : '#fde047'
              : Math.random() < 0.5 ? '#fef08a' : '#fbbf24'
          );
        }
        if (!c.canBePickedUp()) continue;

        const isSecret1Up = c.type === 'golden_bone' || c.type === '1up_bone';
        const tinaBlocked = (c.tinaDelayTimer || 0) > 0;
        const actors = isSecret1Up
          ? [this.player]
          : tinaBlocked
            ? [this.player, this.partner]
            : partyMembers;
        let touchedBy = null;
        for (let m = 0; m < actors.length; m++) {
          if (global.Entities.aabbOverlap(actors[m], c)) {
            touchedBy = actors[m];
            break;
          }
        }

        if (touchedBy) {
          c.collected = true;
          if (c.type === 'coin') {
            this.score += 10;
            this.totalCoins++;
            this.levelCoins++;
            this.sound.coin();
            this.particles.Burst(c.x + 12, c.y + 12, '#fbbf24', 10);
            this.particles.FloatingText(c.x, c.y, '+10', '#fde047');
            this.awardRunCoins(1);
          } else if (
            c.type === 'burger' ||
            c.type === 'heart' ||
            c.type === 'pizza' ||
            c.type === 'empanada'
          ) {
            this.score += 50;
            const maxH = this.player.maxHearts || 3;
            if (this.player.hearts < maxH) {
              this.player.hearts = Math.min(maxH, this.player.hearts + 1);
            }
            this.syncHeartsToSlot(this.player.hearts);
            this.sound.burger();
            const burstColor = c.type === 'pizza' || c.type === 'empanada' ? '#f59e0b' : '#22c55e';
            const foodLabel =
              c.type === 'pizza' ? '🍕 ¡PIZZA! +50 ♥' : c.type === 'empanada' ? '🥟 ¡EMPANADA! +50 ♥' : '+50 ♥';
            this.particles.Burst(c.x + 12, c.y + 12, burstColor, 16);
            this.particles.FloatingText(c.x - 14, c.y, foodLabel, '#4ade80');
          } else if (c.type === 'smoothie') {
            this.score += 100;
            this.player.activateSmoothie();
            this.tina.triggerBark();
            this.sound.smoothie();
            setTimeout(() => this.sound.bark(), 160);
            this.particles.Burst(c.x + 12, c.y + 12, '#ec4899', 22);
            this.particles.FloatingText(c.x - 24, c.y, '¡VELOCIDAD x1.5!', '#f472b6');
          } else if (
            c.type === 'angel_wings' ||
            c.type === 'plant' ||
            c.type === 'calamares' ||
            c.type === 'electric_shield'
          ) {
            this.handlePowerUpPickup(c, touchedBy);
          } else if (c.type === 'golden_bone' || c.type === '1up_bone') {
            if (this.collectedBonesInRun) {
              const boneKey = c.secretKey || this.getGoldenBoneKey(this.cityKey, this.levelIndex, c);
              this.collectedBonesInRun.add(boneKey);
            }
            this.score += 100;
            this.grantExtraLife();
            this.emitGoldenBonePickupEffect(c.x + 13, c.y + 13, '✨ ¡1UP SECRETO! +1 VIDA');
          } else if (c.type === 'extra_life_heart' || c.type === '1up_heart') {
            this.score += 150;
            this.grantExtraLife();
            if (this.sound && typeof this.sound.play1Up === 'function') {
              this.sound.play1Up();
            }
            this.particles.Burst(c.x + 13, c.y + 13, '#fb7185', 24);
            this.particles.Burst(c.x + 13, c.y + 13, '#fde047', 16);
            this.particles.Sparkle(c.x + 13, c.y + 13, '#ffffff');
            const prefix = touchedBy === this.tina ? '🐾❤️' : '❤️';
            this.particles.FloatingText(c.x - 36, c.y - 18, `${prefix} ¡1 VIDA EXTRA!`, '#fb7185');
          } else if (c.type === 'tina_golden_bone') {
            this.score += 250;
            if (this.tina) {
              this.tina.growlCooldown = 0;
              this.tina.goldenBoostTimer = 12.0;
              this.tina.growlTimer = Math.max(this.tina.growlTimer || 0, 1.8);
              if (this.tina.isGrounded) {
                this.tina.jump(-290);
              }
            }
            this.emitGoldenBonePickupEffect(c.x + 13, c.y + 13, '🐾🦴 ¡LA TINA RECARGADA! +250');
            if (this.sound && typeof this.sound.bark === 'function') {
              setTimeout(() => this.sound && this.sound.bark(), 160);
            }
          }
          this.saveHighScore();
        }
      }

      // 5b. Actualizar Proyectiles Botánicos de Gravedad Cero (Planta/Hoja — Tecla D)
      const allEnemyTargets = [
        ...this.pigeons,
        ...this.seagulls,
        ...this.madridCats,
        ...this.selfieTourists,
        ...this.royalGuards,
        ...this.peacocks,
        ...this.crazyCyclists,
        ...this.greenParakeets,
        ...this.swarmParakeets,
        ...this.jellyfishes,
        ...this.crabs,
        ...this.goats,
        ...this.royalSeagulls,
        ...this.swarmRoyalSeagulls,
        ...this.gallotias,
        ...this.garajonayFoxes,
        ...(this.gaudiLizard && this.gaudiLizard.state === 'running' ? [this.gaudiLizard] : []),
        ...this.abubillas,
        ...this.swarmAbubillas,
        ...this.blindCrabs,
        ...this.zigzagPigeons,
        ...this.hedgehogs,
        ...this.boars,
        ...this.scooters,
        ...this.swarmPigeons,
        ...this.trapitos,
        ...this.motochorros,
        ...this.barrabravas,
        ...this.canillitas,
        ...this.fatPigeons,
        ...this.horneros.filter((h) => h.state !== 'peeking' && h.state !== 'hidden' && !(h.scaredTimer > 0)),
        ...this.swarmHorneros,
        ...this.rockeros,
        ...this.penguins,
        ...this.palometas,
        ...this.pacificHazards,
        ...this.swarmMosquitoes,
        ...this.belgranoPirates,
        ...this.serranoBurros,
        ...this.miniUfos,
        ...this.seaLions,
        ...this.kingCrabs,
        ...this.fuegianFoxes,
        ...this.swarmCormorants,
        ...this.horneroNests,
        ...this.pumas,
        ...this.condors,
        ...this.portPelicans,
        ...this.frigates,
        ...this.vicunas,
        ...this.portDogs,
        ...this.rapaNuiWarriors,
        ...this.guasoDancers,
        ...this.swarmFrigates
      ];
      const projSolids = this.plantProjectiles.length
        ? this.solids
            .concat(solidHazards)
            .concat(this.hiddenBlocks.filter((hb) => hb && (hb.revealed || hb.visible)))
        : null;
      for (let i = this.plantProjectiles.length - 1; i >= 0; i--) {
        const proj = this.plantProjectiles[i];
        proj.update(
          dt,
          projSolids,
          activePlatforms,
          this.particles,
          this.cameraX,
          LOGICAL_W,
          LOGICAL_H
        );
        if (proj.dead) {
          this.plantProjectiles.splice(i, 1);
          continue;
        }
        if (proj.deflected || proj.damageDisabled) continue;

        if ((Math.abs(proj.dirY || 0) < 0.25 || Math.abs(proj.vy || 0) < 10) && this.salineSpits.length) {
          for (let sIdx = this.salineSpits.length - 1; sIdx >= 0; sIdx--) {
            const spit = this.salineSpits[sIdx];
            if (!spit || spit.dead) continue;
            if (global.Entities.aabbOverlap(proj, spit)) {
              proj.dead = true;
              spit.dead = true;
              this.salineSpits.splice(sIdx, 1);
              if (this.sound && typeof this.sound.spikeHit === 'function') this.sound.spikeHit();
              this.particles.Burst(spit.x + spit.w * 0.5, spit.y + spit.h * 0.5, '#f8fafc', 10);
              this.particles.Burst(spit.x + spit.w * 0.5, spit.y + spit.h * 0.5, '#bef264', 8);
              this.particles.FloatingText(spit.x - 16, spit.y - 12, '💧 ¡BLOQUEADO!', '#bae6fd');
              break;
            }
          }
          if (proj.dead) {
            this.plantProjectiles.splice(i, 1);
            continue;
          }
        }

        const E = global.Entities;
        for (let eIdx = 0; eIdx < allEnemyTargets.length; eIdx++) {
          const enemy = allEnemyTargets[eIdx];
          if (enemy.dead || enemy.broken || enemy.scaredFlying || enemy.fallingFromPole || enemy.defeated) continue;
          if (
            E &&
            ((E.PalometaEnemy && enemy instanceof E.PalometaEnemy) ||
              (E.PacificJumpHazard && enemy instanceof E.PacificJumpHazard)) &&
            typeof enemy.isAirborne === 'function' &&
            !enemy.isAirborne()
          ) {
            continue;
          }
          if (E.aabbOverlap(proj, enemy)) {
            const hitResult = this.applyPlantHitToEnemy(enemy, proj);
            if (hitResult !== 'blocked_front' && !proj.deflected) {
              proj.dead = true;
            }
            this.saveHighScore();
            break;
          }
        }
        if (proj.dead) {
          this.plantProjectiles.splice(i, 1);
        }
      }

      const playerHits = (target) =>
        !this.ghostMode && Boolean(target) && global.Entities.aabbOverlap(this.player, target);

      // 6. Enemigos: Palomas caminantes (con IA reactiva en niveles 3 y 4)
      for (let i = 0; i < this.pigeons.length; i++) {
        const p = this.pigeons[i];
        p.update(dt, this.player, this.solids);
        if (p.dead || p.scaredFlying) continue;

        const px = p.x + p.w * 0.5;
        const py = p.y + p.h * 0.5;

        if (playerHits(p)) {
          const stomp = this.isPlayerStomp(p, dt);

          if (stomp || this.player.isGroundPounding || p.isDisabled()) {
            p.dead = true;
            if (!this.player.isGroundPounding) {
              this.applyPlayerStompBounce(-380);
            } else {
              this.grantStompGrace(0.15);
            }
            this.score += 35;
            this.sound.stomp();
            this.particles.Burst(px, py, '#94a3b8', 16);
            this.particles.FloatingText(p.x, p.y, '+35', '#38bdf8');
            this.saveHighScore();
          } else {
            this.damagePlayer(px);
          }
        }
      }

      // 6b. Enemigos: Gaviotas Verticales y Palomas en Zig-Zag
      const aerialBirds = [...this.seagulls, ...this.zigzagPigeons];
      for (let i = 0; i < aerialBirds.length; i++) {
        const b = aerialBirds[i];
        b.update(dt, this.player);
        if (b.dead || b.scaredFlying) continue;

        const bx = b.x + b.w * 0.5;
        const by = b.y + b.h * 0.5;

        if (playerHits(b)) {
          const stomp = this.isPlayerStomp(b, dt);

          if (stomp || this.player.isGroundPounding || b.isDisabled()) {
            b.dead = true;
            if (!this.player.isGroundPounding) {
              this.applyPlayerStompBounce(-390);
            } else {
              this.grantStompGrace(0.15);
            }
            this.score += 45;
            this.sound.stomp();
            this.particles.Burst(bx, by, '#38bdf8', 16);
            this.particles.FloatingText(b.x, b.y, '+45', '#38bdf8');
            this.saveHighScore();
          } else {
            this.damagePlayer(bx);
          }
        }
      }

      // 6b2. Enemigos: Gatos Callejeros (física real de vigas, salto parabólico y gravedad)
      for (let i = 0; i < this.madridCats.length; i++) {
        const cat = this.madridCats[i];
        cat.update(dt, this.player, this.solids, this.movingPlatforms);
        if (!cat._waterSplashed && this.hasWaterPits && cat.y > 498 && !cat.dead) {
          cat._waterSplashed = true;
          if (this.sound && typeof this.sound.waterSplash === 'function') {
            this.sound.waterSplash();
          }
          if (this.particles) {
            this.particles.Burst(cat.x + cat.w * 0.5, 502, '#7dd3fc', 14);
          }
        }
        if (cat.dead) continue;

        const cx = cat.x + cat.w * 0.5;
        const cy = cat.y + cat.h * 0.5;

        if (playerHits(cat)) {
          const stomp = this.isPlayerStomp(cat, dt);

          if (stomp || this.player.isGroundPounding || cat.isDisabled()) {
            cat.dead = true;
            if (!this.player.isGroundPounding) {
              this.applyPlayerStompBounce(-380);
            } else {
              this.grantStompGrace(0.15);
            }
            this.score += 40;
            this.sound.stomp();
            this.particles.Burst(cx, cy, '#f59e0b', 16);
            this.particles.FloatingText(cat.x, cat.y, '¡MIAU! +40', '#fbbf24');
            this.saveHighScore();
          } else {
            this.damagePlayer(cx);
          }
        }
      }

      // 6b3. Enemigos: Turistas con Palo Selfie de Madrid (Inmunes a pisotón superior: ¡púa metálica!)
      for (let i = 0; i < this.selfieTourists.length; i++) {
        const t = this.selfieTourists[i];
        t.update(dt, this.player);
        if (t.dead) continue;

        const tx = t.x + t.w * 0.5;
        const ty = t.y + t.h * 0.5;

        if (playerHits(t)) {
          if (this.player.isGroundPounding) {
            t.dead = true;
            this.grantStompGrace(0.15);
            this.score += 75;
            this.sound.stomp();
            this.particles.Burst(tx, ty, '#f59e0b', 20);
            this.particles.FloatingText(t.x, t.y, '¡TERREMOTO! +75', '#fbbf24');
            this.saveHighScore();
          } else if (t.isDisabled()) {
            continue;
          } else {
            const stomp = this.isPlayerStomp(t, dt);
            if (stomp) {
              // El palo selfie vertical actúa como púa que daña al jugador
              this.sound.spikeHit();
              this.player.vy = -320;
              this.particles.FloatingText(
                t.x - 20,
                t.y - 18,
                '¡PALO SELFIE! ¡USÁ PLANTA O TERREMOTO!',
                '#f43f5e'
              );
              this.damagePlayer(tx);
            } else {
              this.damagePlayer(tx);
            }
          }
        }
      }

      // 6b3b. Enemigos: Guardia Real con Escudo y Casco (Madrid) — 2 HP / 2 fases
      for (let i = 0; i < this.royalGuards.length; i++) {
        const rg = this.royalGuards[i];
        rg.update(dt, this.player);
        if (rg.dead || rg.hitCooldown > 0) continue;

        const rx = rg.x + rg.w * 0.5;
        const ry = rg.y + rg.h * 0.5;
        if (playerHits(rg)) {
          const knockDir = rx >= this.player.x + this.player.w * 0.5 ? 1 : -1;
          const stomp = this.isPlayerStomp(rg, dt);
          if (rg.hasArmor) {
            if (this.player.isGroundPounding) {
              rg.breakArmor(this.particles, knockDir, rg.hypnotizedTimer > 0);
              this.player.y = Math.min(this.player.y, rg.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.player.isGroundPounding = false;
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(rg.x - 24, rg.y - 18, '🛡️ ¡ESCUDO Y CASCO ROTOS!', '#fde047');
              this.saveHighScore();
            } else if (stomp && rg.hypnotizedTimer > 0) {
              // Mientras está hipnotizado ♥ por Andrea, baja la guardia: el stomp hace volar casco y escudo y corta la hipnosis
              rg.breakArmor(this.particles, knockDir, true);
              this.player.y = Math.min(this.player.y, rg.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(rg.x - 24, rg.y - 18, '♥ ¡GUARDIA DESARMADO!', '#f472b6');
              this.saveHighScore();
            } else if (stomp) {
              // Casco emplumado protege desde arriba: el jugador rebota sin dañar al guardia ni perder vida
              this.player.y = Math.min(this.player.y, rg.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.sound.spikeHit();
              this.particles.Burst(rx, rg.y + 6, '#e2e8f0', 8);
              this.particles.FloatingText(
                rg.x - 26,
                rg.y - 18,
                this.formatControlHintText('🪖 ¡CASCO BLINDADO! ¡USÁ [Z] O [C]!'),
                '#fbbf24'
              );
            } else if (!rg.isDisabled()) {
              this.damagePlayer(rx);
            }
          } else {
            // Fase 2 (sin casco ni escudo): vulnerable a cualquier ataque
            if (stomp || this.player.isGroundPounding || rg.hypnotizedTimer > 0) {
              rg.dead = true;
              if (!this.player.isGroundPounding) {
                this.applyPlayerStompBounce(-385);
              } else {
                this.grantStompGrace(0.15);
              }
              this.score += 85;
              this.sound.stomp();
              this.particles.Burst(rx, ry, '#3b82f6', 18);
              this.particles.Burst(rx, ry, '#fbbf24', 10);
              this.particles.FloatingText(rg.x, rg.y - 8, '👑 +85', '#fde047');
              this.saveHighScore();
            } else if (!rg.isDisabled()) {
              this.damagePlayer(rx);
            }
          }
        }
      }

      // 6b3c. Enemigos: Pavos Reales de Parque del Retiro (2 HP; cola abierta inmune al salto, salvo impacto directo de Terremoto)
      for (let i = 0; i < this.peacocks.length; i++) {
        const pk = this.peacocks[i];
        pk.update(dt, this.player, this.particles, this.sound);
        if (pk.dead || pk.hitCooldown > 0) continue;

        const px = pk.x + pk.w * 0.5;
        if (playerHits(pk)) {
          const directEarthquakeHit = Boolean(
            this.player.isGroundPounding || this.player.justLandedGroundPoundThisFrame
          );
          const stomp = this.isPlayerStomp(pk, dt);
          if (directEarthquakeHit) {
            // Excepción: Terremoto de Nico cayendo directamente encima sí resta 1 HP (aun con cola abierta) y lo deja noqueado
            const wasAirPound = Boolean(this.player.isGroundPounding);
            this.player.justLandedGroundPoundThisFrame = false;
            if (wasAirPound) {
              this.player.abilityCooldown = Math.max(
                this.player.abilityCooldown || 0,
                this.player.abilityMaxCooldown || 5.0
              );
              this.triggerScreenShake(0.28, 7);
              if (this.sound && typeof this.sound.earthquakeImpact === 'function') {
                this.sound.earthquakeImpact();
              }
            }
            this.resolveHeavyStompImpact(pk, {
              hitFn: (dir) => pk.takeHit(this.particles, dir, true, true, 3.0),
              firstState: 'damaged',
              firstBounceVy: -380,
              firstPts: 25,
              firstBurstColor: '#fbbf24',
              secondBurstColor: '#10b981',
              firstTextDx: -20,
              firstTextDy: -18,
              firstLabel: '💥🦚 ¡NOQUEADO!',
              firstTextColor: '#fde047',
              alwaysBounceOnKill: true,
              killPts: 85,
              killBounceVy: -385,
              killColor: '#10b981',
              killLabel: '🦚 +85',
              killTextColor: '#34d399'
            });
          } else if (stomp && pk.tailOpen && !pk.isDisabled()) {
            // Cola abierta zamarreándose: 100 % inmune al salto normal por arriba (rebota y daña al jugador)
            this.player.y = Math.min(this.player.y, pk.y - this.player.h - 2);
            this.player.vy = -330;
            this.sound.spikeHit();
            this.particles.Burst(px, pk.y + 8, '#10b981', 10);
            this.particles.Burst(px, pk.y + 8, '#fbbf24', 6);
            this.particles.FloatingText(pk.x - 24, pk.y - 18, '🦚 ¡COLA ABIERTA! ¡INMUNE AL SALTO!', '#f43f5e');
            this.damagePlayer(px);
          } else if (stomp) {
            this.resolveHeavyStompImpact(pk, {
              hitFn: (dir) => pk.takeHit(this.particles, dir, false, true),
              firstState: 'damaged',
              firstBounceVy: -380,
              firstPts: 25,
              firstBurstColor: '#10b981',
              secondBurstColor: '#fbbf24',
              firstTextDx: -18,
              firstTextDy: -18,
              firstLabel: '🦚 ¡COLA CERRADA!',
              firstTextColor: '#6ee7b7',
              alwaysBounceOnKill: true,
              killPts: 85,
              killBounceVy: -385,
              killColor: '#10b981',
              killLabel: '🦚 +85',
              killTextColor: '#34d399'
            });
          } else if (!pk.isDisabled()) {
            this.damagePlayer(px);
          }
        }
      }

      // 6b3d. Enemigos: Ciclistas Locos de Parque del Retiro (1 HP; patrulla continua sin pausa y sin fuego amigo)
      for (let i = 0; i < this.crazyCyclists.length; i++) {
        const cc = this.crazyCyclists[i];
        cc.update(dt);
        if (cc.dead) continue;

        const cx = cc.x + cc.w * 0.5;
        const cy = cc.y + cc.h * 0.5;
        if (playerHits(cc)) {
          const stomp = this.isPlayerStomp(cc, dt);
          if (stomp || this.player.isGroundPounding || cc.isDisabled()) {
            cc.dead = true;
            if (!this.player.isGroundPounding) {
              this.applyPlayerStompBounce(-380);
            } else {
              this.grantStompGrace(0.15);
            }
            this.score += 70;
            this.sound.stomp();
            this.particles.Burst(cx, cy, '#ef4444', 14);
            this.particles.Burst(cx, cy, '#facc15', 10);
            this.particles.FloatingText(cc.x, cc.y - 8, '🚴 +70', '#38bdf8');
            this.saveHighScore();
          } else {
            this.damagePlayer(cx);
          }
        }
      }

      // 6b4. Enemigos: Cotorras Verdes de Madrid (vuelo sinusoidal rápido)
      for (let i = 0; i < this.greenParakeets.length; i++) {
        const g = this.greenParakeets[i];
        g.update(dt, this.player);
        if (g.dead || g.scaredFlying) continue;

        const gx = g.x + g.w * 0.5;
        const gy = g.y + g.h * 0.5;

        if (playerHits(g)) {
          const stomp = this.isPlayerStomp(g, dt);

          if (stomp || this.player.isGroundPounding || g.isDisabled()) {
            g.dead = true;
            if (!this.player.isGroundPounding) {
              this.applyPlayerStompBounce(-390);
            } else {
              this.grantStompGrace(0.15);
            }
            this.score += 50;
            this.sound.stomp();
            this.particles.Burst(gx, gy, g.variant === 'barcelona' ? '#10b981' : '#22c55e', 16);
            this.particles.FloatingText(g.x, g.y, '+50', '#4ade80');
            this.saveHighScore();
          } else {
            this.damagePlayer(gx);
          }
        }
      }

      // 6b5. Enemigos: Enjambre de 20 Cotorras Verdes (Clímax Nivel 4 Madrid)
      for (let i = 0; i < this.swarmParakeets.length; i++) {
        const sp = this.swarmParakeets[i];
        sp.update(dt, this.player);
        if (sp.dead || sp.scaredFlying) continue;

        if (playerHits(sp)) {
          // Impacto en ráfaga teledirigida: inflige daño y estalla en plumas
          this.particles.Burst(sp.x + sp.w * 0.5, sp.y + sp.h * 0.5, '#22c55e', 14);
          this.particles.FeatherBurst(sp.x + sp.w * 0.5, sp.y + sp.h * 0.5, '#16a34a', 8);
          this.sound.spikeHit();
          if (this.player.invincibleTimer <= 0.15) {
            this.damagePlayer(sp.x + sp.w * 0.5);
            // Reducción estricta de invulnerabilidad a 0.22s para drenar salud en ráfaga si no se usa Tina [S]
            this.player.invincibleTimer = 0.22;
          }
          sp.dead = true;
        }
      }

      // 6b6. MALLORCA: Medusas Eléctricas (Inmunes al stomp — electrocutan al caer encima)
      for (let i = 0; i < this.jellyfishes.length; i++) {
        const j = this.jellyfishes[i];
        j.update(dt, this.player);
        if (j.dead) continue;
        const jx = j.x + j.w * 0.5;
        if (playerHits(j) && !j.isDisabled()) {
          this.sound.electricShock();
          this.player.vy = -305;
          this.particles.Burst(jx, j.y + j.h * 0.5, '#22d3ee', 16);
          this.particles.FloatingText(
            j.x - 24,
            j.y - 14,
            this.formatControlHintText('⚡ ¡MEDUSA ELÉCTRICA! ¡USÁ [Z]!'),
            '#22d3ee'
          );
          this.damagePlayer(jx);
        }
      }

      // 6b7. MALLORCA: Cangrejos Costeros (Levantan pinzas bloqueando el pisotón superior)
      for (let i = 0; i < this.crabs.length; i++) {
        const c = this.crabs[i];
        c.update(dt, this.player);
        if (c.dead) continue;
        const cx = c.x + c.w * 0.5;
        const cy = c.y + c.h * 0.5;
        if (playerHits(c)) {
          if (this.player.isGroundPounding || c.isDisabled()) {
            c.dead = true;
            this.grantStompGrace(0.15);
            this.score += 65;
            this.sound.stomp();
            this.particles.Burst(cx, cy, '#f97316', 18);
            this.particles.FloatingText(c.x, c.y - 8, '🦀 +65', '#fb923c');
            this.saveHighScore();
          } else {
            const stomp = this.isPlayerStomp(c, dt);
            if (stomp && c.defenseRaised) {
              this.sound.spikeHit();
              this.player.vy = -310;
              this.particles.FloatingText(
                c.x - 20,
                c.y - 16,
                this.formatControlHintText('🦀 ¡PINZAS ALTAS! ¡USÁ [Z]!'),
                '#ef4444'
              );
              this.damagePlayer(cx);
            } else if (stomp) {
              c.dead = true;
              this.applyPlayerStompBounce(-390);
              this.score += 60;
              this.sound.stomp();
              this.particles.Burst(cx, cy, '#f97316', 16);
              this.particles.FloatingText(c.x, c.y, '+60', '#fb923c');
              this.saveHighScore();
            } else {
              this.damagePlayer(cx);
            }
          }
        }
      }

      // 6b8. MALLORCA: Cabras de Tramuntana (2 HP — 1er golpe frena embestida y retrocede)
      for (let i = 0; i < this.goats.length; i++) {
        const g = this.goats[i];
        g.update(dt, this.player);
        if (g.dead || g.hitCooldown > 0) continue;
        if (playerHits(g)) {
          const stomp = this.isPlayerStomp(g, dt);
          if (stomp || this.player.isGroundPounding || g.isDisabled()) {
            this.resolveHeavyStompImpact(g, {
              hitFn: (dir) => g.takeHit(dir, true),
              firstState: 'damaged',
              firstBurstColor: '#fde047',
              killPts: 65,
              killBounceVy: -395,
              killColor: '#d97706',
              killTextDy: 0,
              killTextColor: '#fbbf24'
            });
          } else {
            this.damagePlayer(g.x + g.w * 0.5);
          }
        }
      }

      // 6b9. MALLORCA: Gaviotas Reales + Clímax Enjambre Tormenta Nivel 4
      for (let i = 0; i < this.royalSeagulls.length; i++) {
        const r = this.royalSeagulls[i];
        r.update(dt, this.player);
        if (r.dead || r.scaredFlying) continue;
        const rx = r.x + r.w * 0.5;
        const ry = r.y + r.h * 0.5;
        if (playerHits(r)) {
          const stomp = this.isPlayerStomp(r, dt);
          if (stomp || this.player.isGroundPounding || r.isDisabled()) {
            r.dead = true;
            if (!this.player.isGroundPounding) this.applyPlayerStompBounce(-390);
            else this.grantStompGrace(0.15);
            this.score += 60;
            this.sound.stomp();
            this.particles.Burst(rx, ry, '#f8fafc', 16);
            this.particles.FloatingText(r.x, r.y, '+60', '#bae6fd');
            this.saveHighScore();
          } else {
            this.damagePlayer(rx);
          }
        }
      }

      for (let i = 0; i < this.swarmRoyalSeagulls.length; i++) {
        const sr = this.swarmRoyalSeagulls[i];
        sr.update(dt, this.player);
        if (sr.dead || sr.scaredFlying) continue;
        if (playerHits(sr) && !sr.isDisabled()) {
          this.particles.Burst(sr.x + sr.w * 0.5, sr.y + sr.h * 0.5, '#f8fafc', 14);
          this.particles.FeatherBurst(sr.x + sr.w * 0.5, sr.y + sr.h * 0.5, '#94a3b8', 8);
          this.sound.spikeHit();
          if (this.player.invincibleTimer <= 0.15) {
            this.damagePlayer(sr.x + sr.w * 0.5);
            this.player.invincibleTimer = 0.24;
          }
          sr.dead = true;
        }
      }

      // 6b10. ISLAS CANARIAS Y CHILE: Géiseres de Vapor / Agua / Lava
      for (let i = 0; i < this.geysers.length; i++) {
        const gy = this.geysers[i];
        gy.update(dt, this.sound, this.particles, this.player);
        const dbox = gy.getDamageBox();
        if (playerHits(dbox)) {
          const gLabel =
            gy.kind === 'water_spout'
              ? '💦 ¡CHORRO DEL PACÍFICO!'
              : gy.kind === 'lava_spout'
                ? '🌋 ¡GÉISER DE MAGMA!'
                : '💨 ¡VAPOR ARDIENTE!';
          const gColor = gy.kind === 'water_spout' ? '#38bdf8' : gy.kind === 'lava_spout' ? '#ef4444' : '#fb923c';
          this.particles.FloatingText(gy.x - 18, dbox.y, gLabel, gColor);
          this.damagePlayer(gy.x + gy.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      for (let i = 0; i < this.gallotias.length; i++) {
        const gl = this.gallotias[i];
        gl.update(dt, this.player);
        if (gl.dead) continue;
        const gx = gl.x + gl.w * 0.5;
        const gyPos = gl.y + gl.h * 0.5;
        if (playerHits(gl)) {
          const stomp = this.isPlayerStomp(gl, dt);
          if (stomp || this.player.isGroundPounding || gl.isDisabled()) {
            gl.dead = true;
            if (!this.player.isGroundPounding) this.applyPlayerStompBounce(-395);
            else this.grantStompGrace(0.15);
            this.score += 70;
            this.sound.stomp();
            this.particles.Burst(gx, gyPos, '#84cc16', 18);
            this.particles.FloatingText(gl.x, gl.y, '🦎 +70', '#bef264');
            this.saveHighScore();
          } else {
            this.damagePlayer(gx);
          }
        }
      }

      // Enemigo exclusivo de Garajonay: El Zorrito ágil (1 HP, sube/baja vigas y puente)
      for (let i = 0; i < this.garajonayFoxes.length; i++) {
        const fx = this.garajonayFoxes[i];
        fx.update(dt, this.player, this.solids, this.movingPlatforms, this.plantProjectiles);
        if (!fx._waterSplashed && this.hasWaterPits && fx.y > 498 && !fx.dead) {
          fx._waterSplashed = true;
          if (this.sound && typeof this.sound.waterSplash === 'function') {
            this.sound.waterSplash();
          }
          if (this.particles) {
            this.particles.Burst(fx.x + fx.w * 0.5, 502, '#7dd3fc', 14);
          }
        }
        if (fx.dead) continue;
        const cx = fx.x + fx.w * 0.5;
        const cy = fx.y + fx.h * 0.5;
        if (playerHits(fx)) {
          const stomp = this.isPlayerStomp(fx, dt);
          if (stomp || this.player.isGroundPounding || fx.isDisabled()) {
            fx.dead = true;
            if (!this.player.isGroundPounding) this.applyPlayerStompBounce(-395);
            else this.grantStompGrace(0.15);
            this.score += 75;
            this.sound.stomp();
            this.particles.Burst(cx, cy, '#ea580c', 16);
            this.particles.Burst(cx, cy, '#ffffff', 8);
            this.particles.FloatingText(fx.x, fx.y - 6, '🦊 +75', '#fdba74');
            this.saveHighScore();
          } else {
            this.damagePlayer(cx);
            if (this.state !== 'playing') return;
          }
        }
      }

      // Evento único de Park Güell: La Salamandra de Trencadís (máx. 3 pasadas antes de escapar sin 1UP)
      if (this.gaudiLizard && !this.gaudiLizard.dead) {
        const liz = this.gaudiLizard;
        const lizEv = liz.update(dt, this.player);
        if (lizEv === 'activated') {
          const lx = liz.x + liz.w * 0.5;
          const ly = liz.y + liz.h * 0.5;
          if (this.sound && typeof this.sound.coin === 'function') this.sound.coin();
          this.particles.Burst(lx, ly, '#2563eb', 14);
          this.particles.Burst(lx, ly, '#f97316', 12);
          this.particles.FloatingText(liz.x - 42, liz.y - 26, '🦎 ¡SALAMANDRA DE TRENCADÍS! ¡3 PASADAS!', '#fde047');
        } else if (lizEv === 'escaped') {
          this.lizardEventConsumed = true;
          this.gaudiLizardEventResolved = true;
          const lx = liz.x + liz.w * 0.5;
          const ly = liz.y + liz.h * 0.5;
          this.particles.Burst(lx, ly, '#06b6d4', 12);
          this.particles.FloatingText(liz.x - 28, liz.y - 22, '🦎💨 ¡ESCAPÓ! ¡SIN VIDA EXTRA!', '#94a3b8');
        }
        if ((liz.state === 'running' || liz.state === 'escaping') && this.particles && Math.random() < 0.35) {
          const mosaicPalette = ['#2563eb', '#06b6d4', '#f97316', '#facc15', '#ffffff'];
          this.particles.Sparkle(
            liz.x + liz.w * 0.5 + (Math.random() - 0.5) * 18,
            liz.y + liz.h * 0.65 + (Math.random() - 0.5) * 8,
            mosaicPalette[Math.floor(Math.random() * mosaicPalette.length)]
          );
        }
        if (!liz.dead && !liz.escaped && liz.state === 'running' && playerHits(liz)) {
          const lx = liz.x + liz.w * 0.5;
          const stomp = this.isPlayerStomp(liz, dt);
          if (stomp || this.player.isGroundPounding || (typeof liz.isDisabled === 'function' && liz.isDisabled())) {
            this.defeatGaudiLizard(liz, true);
          } else {
            this.damagePlayer(lx);
          }
        }
      }

      for (let i = 0; i < this.abubillas.length; i++) {
        const ab = this.abubillas[i];
        ab.update(dt, this.player);
        if (ab.dead || ab.scaredFlying) continue;
        const ax = ab.x + ab.w * 0.5;
        const ay = ab.y + ab.h * 0.5;
        if (playerHits(ab)) {
          const stomp = this.isPlayerStomp(ab, dt);
          if (stomp || this.player.isGroundPounding || ab.isDisabled()) {
            ab.dead = true;
            if (!this.player.isGroundPounding) this.applyPlayerStompBounce(-395);
            else this.grantStompGrace(0.15);
            this.score += 70;
            this.sound.stomp();
            this.particles.Burst(ax, ay, '#f97316', 18);
            this.particles.FloatingText(ab.x, ab.y, '🪶 +70', '#fdba74');
            this.saveHighScore();
          } else {
            this.damagePlayer(ax);
          }
        }
      }

      for (let i = 0; i < this.swarmAbubillas.length; i++) {
        const sa = this.swarmAbubillas[i];
        sa.update(dt, this.player);
        if (sa.dead || sa.scaredFlying) continue;
        if (playerHits(sa)) {
          this.particles.Burst(sa.x + sa.w * 0.5, sa.y + sa.h * 0.5, '#fb923c', 14);
          this.particles.FeatherBurst(sa.x + sa.w * 0.5, sa.y + sa.h * 0.5, '#ea580c', 8);
          this.sound.spikeHit();
          if (this.player.invincibleTimer <= 0.15) {
            this.damagePlayer(sa.x + sa.w * 0.5);
            this.player.invincibleTimer = 0.24;
          }
          sa.dead = true;
        }
      }

      for (let i = 0; i < this.blindCrabs.length; i++) {
        const bc = this.blindCrabs[i];
        bc.update(dt);
        if (bc.dead || bc.hitCooldown > 0) continue;
        const bx = bc.x + bc.w * 0.5;
        if (playerHits(bc)) {
          const knockDir = bx >= this.player.x + this.player.w * 0.5 ? 1 : -1;
          const stomp = this.isPlayerStomp(bc, dt);
          if (!bc.shellBroken) {
            if (this.player.isGroundPounding) {
              const res = bc.shatter(this.particles, knockDir);
              this.player.y = Math.min(this.player.y, bc.y - this.player.h - 2);
              this.applyPlayerStompBounce(-360);
              this.player.isGroundPounding = false;
              if (res === 'cracked') {
                this.score += 25;
                this.sound.spikeHit();
                this.saveHighScore();
              }
            } else {
              this.sound.spikeHit();
              if (stomp) this.player.vy = -310;
              this.particles.FloatingText(
                bc.x - 40,
                bc.y - 18,
                this.formatControlHintText('🛡️ ¡CORAZA INVULNERABLE! ¡USÁ TERREMOTO [C] O [Z]!'),
                '#c084fc'
              );
              this.damagePlayer(bx);
            }
          } else {
            // Fase 2 (shellBroken = true, stompImmune = false): vulnerable al salto o Planta [Z]
            if (stomp || this.player.isGroundPounding || bc.isDisabled()) {
              const res = bc.shatter(this.particles, knockDir);
              if (res === 'killed' || res === true) {
                if (!this.player.isGroundPounding) this.applyPlayerStompBounce(-385);
                else this.grantStompGrace(0.15);
                this.score += 200;
                this.sound.stomp();
                this.saveHighScore();
              }
            } else {
              this.damagePlayer(bx);
            }
          }
        }
      }

      // 6c. Enemigos: Jabalíes (Barcelona, 2 HP) y Puercoespines (Madrid) — Inmunes al salto y a la Tina
      const pricklyEnemies = this.hedgehogs.concat(this.boars);
      for (let i = 0; i < pricklyEnemies.length; i++) {
        const h = pricklyEnemies[i];
        h.update(dt, this.player);
        if (h.dead || h.hitCooldown > 0) continue;

        const hx = h.x + h.w * 0.5;
        const hy = h.y + h.h * 0.5;

        if (playerHits(h)) {
          if (this.player.isGroundPounding) {
            if (global.Entities && global.Entities.Boar && h instanceof global.Entities.Boar) {
              const knockDir = hx >= this.player.x + this.player.w * 0.5 ? 1 : -1;
              const boarRes = h.takeHit(knockDir, true);
              if (boarRes === 'damaged') {
                this.player.y = Math.min(this.player.y, h.y - this.player.h - 2);
                this.applyPlayerStompBounce(-350);
                this.player.isGroundPounding = false;
                this.score += 20;
                this.sound.stomp();
                this.particles.Burst(hx, hy, '#fde047', 12);
                this.saveHighScore();
                continue;
              }
            }
            h.dead = true;
            this.grantStompGrace(0.15);
            this.score += 75;
            this.sound.stomp();
            this.particles.Burst(hx, hy, '#f97316', 20);
            this.particles.FloatingText(h.x, h.y, '¡APLASTADO! +75', '#fb923c');
            this.saveHighScore();
          } else if (h.isDisabled()) {
            continue;
          } else {
            this.sound.spikeHit();
            this.player.vy = -310;
            const warnText = this.formatControlHintText(
              h instanceof global.Entities.Boar
                ? '¡COLMILLOS! ¡USÁ ORQUÍDEA [Z] O TERREMOTO [C]!'
                : '¡PÚAS! ¡USÁ HABILIDAD [C] O [Z]!'
            );
            this.particles.FloatingText(h.x - 20, h.y - 16, warnText, '#f97316');
            this.damagePlayer(hx);
          }
        }
      }

      // 6d. Enemigos de Clímax Nivel 4: Enjambre de 20 Palomas Agresivas
      for (let i = 0; i < this.swarmPigeons.length; i++) {
        const sp = this.swarmPigeons[i];
        sp.update(dt, this.player);
        if (sp.dead || sp.scaredFlying) continue;

        const spx = sp.x + sp.w * 0.5;
        if (playerHits(sp) && !sp.isDisabled()) {
          this.damagePlayer(spx, true);
          if (this.state !== 'playing') return;
        }
      }

      // 7. Enemigos: Patinetes eléctricos
      for (let i = 0; i < this.scooters.length; i++) {
        const s = this.scooters[i];
        s.update(dt, this.player);
        if (s.dead) continue;

        const sx = s.x + s.w * 0.5;
        const sy = s.y + s.h * 0.5;

        if (playerHits(s)) {
          if (this.player.isGroundPounding) {
            s.dead = true;
            this.score += 50;
            this.sound.stomp();
            this.particles.Burst(sx, sy, '#38bdf8', 18);
            this.particles.FloatingText(s.x, s.y, '+50', '#38bdf8');
            this.saveHighScore();
          } else if (!s.isDisabled()) {
            this.damagePlayer(sx);
          }
        }
      }

      // 7b. Buenos Aires: Fauna Urbana (Carteles/Semáforos del Tren Mitre son bloques sólidos en 3.)
      const checkBaStomp = (e, pts, burstColor, onDefeat = null, allowDisabledKill = true) => {
        const ex = e.x + e.w * 0.5;
        const ey = e.y + e.h * 0.5;
        const stomp = this.isPlayerStomp(e, dt);
        if (stomp || this.player.isGroundPounding || (allowDisabledKill && e.isDisabled())) {
          if (e.onPole) {
            this.defeatPoleRockero(e, ex - (this.player.x + this.player.w * 0.5), `+${pts}`, burstColor);
          } else {
            e.dead = true;
            this.score += pts;
            this.sound.stomp();
            this.particles.Burst(ex, ey, burstColor, 18);
            this.particles.FloatingText(e.x, e.y - 6, `+${pts}`, burstColor);
            if (onDefeat) onDefeat();
            this.saveHighScore();
          }
          if (!this.player.isGroundPounding) this.applyPlayerStompBounce(-370);
          else this.grantStompGrace(0.15);
          return true;
        }
        return false;
      };

      const argAiCtx =
        this.trapitos.length ||
        this.motochorros.length ||
        this.barrabravas.length ||
        this.canillitas.length ||
        this.horneroNests.length ||
        this.horneros.length ||
        this.swarmHorneros.length ||
        this.rockeros.length ||
        this.penguins.length ||
        this.palometas.length ||
        this.belgranoPirates.length ||
        this.fernetBottles.length ||
        this.fernetPuddles.length ||
        this.serranoBurros.length ||
        this.miniUfos.length ||
        this.fuegianFoxes.length
          ? {
              aiTier: (this.levelData && Number(this.levelData.aiTier)) || (this.levelIndex + 1),
              cityKey: this.cityKey,
              levelWidth: (this.levelData && Number(this.levelData.width)) || 8000,
              solids: this.solids,
              movingPlatforms: this.movingPlatforms,
              fallingPlatforms: this.fallingPlatforms,
              sinkingContainers: this.sinkingContainers,
              projectiles: this.plantProjectiles,
              cameraX: this.cameraX,
              allies: [
                ...this.trapitos,
                ...this.barrabravas,
                ...this.canillitas,
                ...this.rockeros,
                ...this.belgranoPirates
              ]
            }
          : null;

      for (let i = 0; i < this.trapitos.length; i++) {
        const tr = this.trapitos[i];
        tr.update(dt, this.player, argAiCtx);
        if (tr.dead || tr.scaredFleeing || tr.defeated) continue;
        const ragBox = tr.getRagAttackBox();
        if (playerHits(tr) || playerHits(ragBox)) {
          if (!checkBaStomp(tr, 55, '#84cc16', () => {
            this.collectibles.push(new global.Entities.Collectible(tr.x + 6, tr.y - 16, 'coin', true));
          })) {
            this.damagePlayer(tr.x + tr.w * 0.5);
          }
        }
      }

      for (let i = 0; i < this.motochorros.length; i++) {
        const m = this.motochorros[i];
        m.update(dt, this.player, argAiCtx);
        if (m.justDefeated) {
          m.justDefeated = false;
          const dx = Number.isFinite(m.riderX) ? m.riderX : m.x + m.w * 0.5;
          const dy = Number.isFinite(m.riderY) ? m.riderY : m.y + m.h * 0.5;
          this.score += 70;
          if (this.sound && typeof this.sound.stomp === 'function') this.sound.stomp();
          this.particles.Burst(dx, dy, '#ef4444', 18);
          this.particles.FloatingText(dx - 16, dy - 18, '+70', '#ef4444');
          this.saveHighScore();
        }
        if (m.dead || m.defeated || m.crashingFromBark) continue;
        if (playerHits(m)) {
          if (!checkBaStomp(m, 70, '#ef4444')) {
            this.damagePlayer(m.x + m.w * 0.5);
          }
        }
      }

      for (let i = 0; i < this.barrabravas.length; i++) {
        const b = this.barrabravas[i];
        b.update(dt, this.player, argAiCtx);
        if (b.dead) continue;
        if (b.justStruckWave) {
          if (this.sound && typeof this.sound.playDrumBoom === 'function') this.sound.playDrumBoom();
          const dx = (this.player.x + this.player.w * 0.5) - (b.x + b.w * 0.5);
          const dy = (this.player.y + this.player.h * 0.5) - (b.y + b.h * 0.5);
          if (!this.ghostMode && Math.hypot(dx, dy) < 210) {
            const pushDir = dx >= 0 ? 1 : -1;
            this.player.vx += pushDir * 310;
            if (this.player.onGround) this.player.vy = -120;
            this.particles.FloatingText(this.player.x - 10, this.player.y - 14, '💥 ¡BOMBO!', '#38bdf8');
          }
        }
        if (b.hitCooldown > 0) continue;
        if (playerHits(b)) {
          const stomp = this.isPlayerStomp(b, dt);
          if (stomp || this.player.isGroundPounding || b.isDisabled()) {
            this.resolveHeavyStompImpact(b, {
              hitFn: (dir) => b.takeHit(this.particles, dir, true),
              firstState: 'drum_broken',
              firstPts: 25,
              firstTextDx: -16,
              firstTextDy: -16,
              firstLabel: '🥁 ¡BOMBO ROTO!',
              killPts: 85,
              killBounceVy: -370,
              killColor: '#38bdf8'
            });
          } else {
            this.damagePlayer(b.x + b.w * 0.5);
          }
        }
      }

      for (let i = 0; i < this.canillitas.length; i++) {
        const c = this.canillitas[i];
        c.update(dt, this.player, argAiCtx);
        if (c.pendingThrow) {
          this.newspaperProjectiles.push(c.pendingThrow);
        }
        if (c.dead) continue;
        if (playerHits(c)) {
          if (!checkBaStomp(c, 60, '#60a5fa')) {
            this.damagePlayer(c.x + c.w * 0.5);
          }
        }
      }

      for (let i = this.newspaperProjectiles.length - 1; i >= 0; i--) {
        const np = this.newspaperProjectiles[i];
        np.update(dt, LOGICAL_H, this.cameraX);
        if (np.dead) {
          this.newspaperProjectiles.splice(i, 1);
          continue;
        }
        if (playerHits(np)) {
          np.dead = true;
          this.damagePlayer(np.x + np.w * 0.5);
          this.newspaperProjectiles.splice(i, 1);
        }
      }

      for (let i = 0; i < this.fatPigeons.length; i++) {
        const fp = this.fatPigeons[i];
        fp.update(dt);
        if (fp.dead || fp.scaredFlying) continue;
        if (playerHits(fp)) {
          if (!checkBaStomp(fp, 45, '#a855f7')) {
            this.damagePlayer(fp.x + fp.w * 0.5);
          }
        }
      }

      // 7c. Horneros: nidos elevados destructibles (2 HP) + Bandada teledirigida Zona 4
      for (let i = 0; i < this.horneroNests.length; i++) {
        const nest = this.horneroNests[i];
        nest.update(dt, this.player, this.cameraX, argAiCtx);
        if (nest.pendingSpawn) {
          this.horneros.push(nest.pendingSpawn);
          if (nest.pendingSpawn.state === 'attacking') {
            this.particles.Burst(nest.x + nest.w * 0.5, nest.y + nest.h * 0.5, '#f59e0b', 10);
          }
        }
        if (!nest.dead && !nest.broken && playerHits(nest)) {
          const stomp = this.isPlayerStomp(nest, dt);
          if (stomp || this.player.isGroundPounding) {
            const nestRes = this.damageHorneroNest(nest, false);
            if (nestRes === 'cracked' || nestRes === 'destroyed') {
              this.player.y = Math.min(this.player.y, nest.y - this.player.h - 1);
              this.applyPlayerStompBounce(this.player.isGroundPounding ? -320 : -375);
              this.player.jumpsUsed = 0;
              if (this.player.isGroundPounding) {
                this.player.isGroundPounding = false;
              }
            }
          }
        }
      }
      for (let i = this.horneros.length - 1; i >= 0; i--) {
        const h = this.horneros[i];
        h.update(dt, this.player, this.cameraX, argAiCtx);
        if (h.dead) {
          this.horneros.splice(i, 1);
          continue;
        }
        if (h.scaredFlying || h.state === 'peeking' || h.state === 'hidden' || h.scaredTimer > 0) continue;
        if (playerHits(h)) {
          if (h.state === 'perched') {
            checkBaStomp(h, 65, '#d97706');
          } else if (!checkBaStomp(h, 65, '#d97706')) {
            this.damagePlayer(h.x + h.w * 0.5);
          }
        }
      }
      for (let i = this.swarmHorneros.length - 1; i >= 0; i--) {
        const sh = this.swarmHorneros[i];
        sh.update(dt, this.player, this.cameraX, argAiCtx);
        if (sh.dead) {
          this.swarmHorneros.splice(i, 1);
          continue;
        }
        if (sh.scaredFlying) continue;
        if (playerHits(sh) && !sh.isDisabled()) {
          this.damagePlayer(sh.x + sh.w * 0.5, true);
          if (this.state !== 'playing') return;
        }
      }

      // 7d. Rosario: Bombos Rebotadores, Rockeros (cerveza), Pingüinos (frío/slow), Palometas y Enjambre de Mosquitos
      for (let i = 0; i < this.bouncyDrums.length; i++) {
        const bd = this.bouncyDrums[i];
        bd.update(dt);
        if (
          this.player.vy >= 0 &&
          global.Entities.aabbOverlap(this.player, bd) &&
          this.isPlayerStomp(bd, dt, { allowZeroVy: true })
        ) {
          this.player.y = bd.y - this.player.h;
          this.applyPlayerStompBounce(bd.bounceVy || -660);
          this.player.onGround = false;
          this.player.jumpsUsed = 0;
          if (bd && typeof bd.triggerBounce === 'function') {
            bd.triggerBounce();
          } else if (bd) {
            bd.squash = 1;
          }
          if (this.sound && typeof this.sound.playDrumBoom === 'function') this.sound.playDrumBoom();
          this.particles.Burst(bd.x + bd.w * 0.5, bd.y, '#facc15', 14);
          this.particles.FloatingText(bd.x, bd.y - 16, '🥁 ¡BOMBASSO!', '#fde047');
        }
      }

      for (let i = 0; i < this.lightPoles.length; i++) {
        if (this.lightPoles[i].shakeTimer > 0) {
          this.lightPoles[i].shakeTimer = Math.max(0, this.lightPoles[i].shakeTimer - dt);
        }
      }

      for (let i = 0; i < this.rockeros.length; i++) {
        const rk = this.rockeros[i];
        rk.update(dt, this.player, argAiCtx);
        if (rk.pendingThrow) {
          this.newspaperProjectiles.push(rk.pendingThrow);
        }
        if (rk.dead || rk.defeated || rk.fallingFromPole) continue;
        if (playerHits(rk)) {
          if (!checkBaStomp(rk, 65, '#f43f5e')) {
            this.damagePlayer(rk.x + rk.w * 0.5);
          }
        }
      }

      for (let i = 0; i < this.penguins.length; i++) {
        const pg = this.penguins[i];
        pg.update(dt, this.player, argAiCtx);
        if (pg.pendingBlast) {
          this.coldBlasts.push(pg.pendingBlast);
        }
        if (pg.dead) continue;
        if (playerHits(pg)) {
          if (!checkBaStomp(pg, 70, '#38bdf8')) {
            this.damagePlayer(pg.x + pg.w * 0.5);
          }
        }
      }

      for (let i = this.coldBlasts.length - 1; i >= 0; i--) {
        const cb = this.coldBlasts[i];
        cb.update(dt, this.cameraX);
        if (cb.dead) {
          this.coldBlasts.splice(i, 1);
          continue;
        }
        // Sin friendly fire entre enemigos: los proyectiles de Pingüino solo afectan al jugador
        if (playerHits(cb)) {
          cb.dead = true;
          this.coldBlasts.splice(i, 1);
          const canApplySlow = this.player && this.player.invulnTimer <= 0;
          if (canApplySlow && typeof this.player.applySlow === 'function') {
            this.player.applySlow(2.0);
          }
          if (canApplySlow) {
            this.particles.Burst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.5, '#7dd3fc', 16);
            this.particles.FloatingText(this.player.x - 16, this.player.y - 20, '❄️ ¡PECHO FRÍO! -VELOCIDAD', '#7dd3fc');
          }
          this.damagePlayer(cb.x + cb.w * 0.5);
        }
      }

      for (let i = 0; i < this.palometas.length; i++) {
        const pm = this.palometas[i];
        pm.update(dt, this.player, argAiCtx);
        this.emitJumpingFishSplash(pm, pm.waterY, this.isRosarioParanaWater() ? '#e7d3b0' : '#7dd3fc');
        if (!pm.isAirborne()) continue;
        if (this.handleJumpingFishPlayerCollision(pm, dt, { color: '#fb923c' })) {
          if (this.state !== 'playing') return;
        }
      }

      for (let i = this.swarmMosquitoes.length - 1; i >= 0; i--) {
        const mq = this.swarmMosquitoes[i];
        mq.update(dt, this.player, this.cameraX);
        if (mq.dead) {
          this.swarmMosquitoes.splice(i, 1);
          continue;
        }
        if (mq.scaredFlying) continue;
        if (playerHits(mq) && !mq.isDisabled()) {
          this.damagePlayer(mq.x + mq.w * 0.5, true);
          if (this.state !== 'playing') return;
        }
      }

      // 7e. Córdoba: El Pirata de Belgrano (2 HP + Modo Furia), Botellas/Charcos de Fernet, Burritos Serranos (2 HP) y Mini-OVNIs
      for (let i = 0; i < this.belgranoPirates.length; i++) {
        const bp = this.belgranoPirates[i];
        bp.update(dt, this.player, argAiCtx);
        if (bp.pendingThrow) {
          this.fernetBottles.push(bp.pendingThrow);
          bp.pendingThrow = null;
        }
        if (bp.dead || bp.hitCooldown > 0) continue;
        const overlapBody = playerHits(bp);
        const stomp = this.isPlayerStomp(bp, dt);
        if (overlapBody && (stomp || this.player.isGroundPounding)) {
          this.resolveHeavyStompImpact(bp, {
            hitFn: (dir) => bp.takeHit(dir, true),
            firstState: 'enraged',
            firstBounceVy: -385,
            firstPts: 25,
            firstBurstColor: '#ef4444',
            secondBurstColor: '#fbbf24',
            firstTextDx: -18,
            firstTextDy: -18,
            firstLabel: '😡 ¡SIN FERNET! ¡FURIA!',
            firstTextColor: '#fbbf24',
            alwaysBounceOnKill: true,
            killPts: 85,
            killColor: '#38bdf8'
          });
          continue;
        }
        const punchBox = bp.punchHitbox();
        if (punchBox && bp.disarmTimer <= 0 && playerHits(punchBox)) {
          this.damagePlayer(bp.x + bp.w * 0.5);
          if (this.state !== 'playing') return;
          continue;
        }
        if (overlapBody && !bp.isDisabled() && bp.disarmTimer <= 0) {
          this.damagePlayer(bp.x + bp.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      for (let i = this.fernetBottles.length - 1; i >= 0; i--) {
        const fb = this.fernetBottles[i];
        fb.update(dt, LOGICAL_H, this.cameraX, argAiCtx);
        if (fb.spawnPuddle) {
          this.fernetPuddles.push(
            new global.Entities.FernetPuddleHazard(
              fb.spawnPuddle.x,
              fb.spawnPuddle.y,
              56,
              4.2,
              fb.spawnPuddle.platform || null
            )
          );
          fb.spawnPuddle = null;
          this.particles.Burst(fb.x + fb.w * 0.5, fb.y + fb.h, '#78350f', 10);
        }
        if (fb.dead) {
          this.fernetBottles.splice(i, 1);
          continue;
        }
        if (playerHits(fb)) {
          fb.dead = true;
          this.fernetBottles.splice(i, 1);
          this.damagePlayer(fb.x + fb.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      for (let i = this.fernetPuddles.length - 1; i >= 0; i--) {
        const fp = this.fernetPuddles[i];
        fp.update(dt);
        if (fp.dead) {
          this.fernetPuddles.splice(i, 1);
          continue;
        }
        const fpBox = fp.hitbox();
        if (playerHits(fpBox)) {
          this.damagePlayer(fp.x + fp.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      for (let i = 0; i < this.serranoBurros.length; i++) {
        const sb = this.serranoBurros[i];
        sb.update(dt, this.player);
        if (sb.dead || sb.hitCooldown > 0) continue;
        if (playerHits(sb)) {
          const stomp = this.isPlayerStomp(sb, dt);
          if (stomp || this.player.isGroundPounding || sb.isDisabled()) {
            this.resolveHeavyStompImpact(sb, {
              hitFn: (dir) => sb.takeHit(dir, true),
              firstState: 'damaged',
              firstBurstColor: '#fde047',
              killPts: 80,
              killColor: '#a8a29e',
              killTextColor: '#e7e5e4'
            });
          } else {
            this.damagePlayer(sb.x + sb.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.miniUfos.length; i++) {
        const ufo = this.miniUfos[i];
        ufo.update(dt);
        if (ufo.dead) continue;
        if (ufo._beamFxCooldown > 0) {
          ufo._beamFxCooldown = Math.max(0, ufo._beamFxCooldown - dt);
        }
        if (playerHits(ufo)) {
          if (!checkBaStomp(ufo, 95, '#34d399')) {
            this.damagePlayer(ufo.x + ufo.w * 0.5);
            if (this.state !== 'playing') return;
          }
          continue;
        }
        const beamBox = ufo.getBeamHitbox();
        if (playerHits(beamBox)) {
          if (!ufo._beamFxCooldown) {
            ufo._beamFxCooldown = 0.65;
            if (this.player && typeof this.player.applySlow === 'function') {
              this.player.applySlow(1.8);
            }
            this.particles.Burst(this.player.x + this.player.w * 0.5, this.player.y + this.player.h * 0.5, '#6ee7b7', 12);
            this.particles.FloatingText(this.player.x - 16, this.player.y - 22, '🛸 ¡RAYO ABDUCTOR! -VELOCIDAD', '#34d399');
          }
          this.damagePlayer(ufo.x + ufo.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      // 7e. Ushuaia y Chile: Estalactitas, Rocas Volcánicas, Cargas Portuarias, Carámbanos y Peligros Marinos
      for (let i = 0; i < this.overheadHazards.length; i++) {
        const oh = this.overheadHazards[i];
        if ((!oh.isFallingHazard && oh.kind !== 'icicle') || typeof oh.getDamageBox !== 'function') continue;
        const dmgBox = oh.getDamageBox();
        if (playerHits(dmgBox)) {
          const ohBurst = oh.kind === 'cargo_load' ? '#ef4444' : oh.kind === 'volcanic_rock' ? '#fb923c' : oh.kind === 'stalactite' ? '#f59e0b' : '#bae6fd';
          const ohLabel = oh.kind === 'cargo_load' ? '🏗️ ¡CARGA PORTUARIA!' : oh.kind === 'volcanic_rock' ? '🌋 ¡ROCA VOLCÁNICA!' : oh.kind === 'stalactite' ? '🪨 ¡ESTALACTITA!' : '🧊 ¡CARÁMBANO!';
          const ohTxtCol = oh.kind === 'cargo_load' ? '#f87171' : oh.kind === 'volcanic_rock' ? '#fb923c' : oh.kind === 'stalactite' ? '#fde047' : '#38bdf8';
          this.particles.Burst(oh.x + oh.w * 0.5, oh.y + oh.h * 0.6, ohBurst, 12);
          this.particles.FloatingText(oh.x - 16, oh.y, ohLabel, ohTxtCol);
          if (oh.state === 'falling') {
            oh.state = 'respawning';
            oh.stateTimer = 3.2;
            oh.vy = 0;
          }
          this.damagePlayer(oh.x + oh.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      for (let i = 0; i < this.seaLions.length; i++) {
        const sl = this.seaLions[i];
        sl.update(dt, this.player);
        if (sl.dead || sl.hitCooldown > 0) continue;
        if (playerHits(sl)) {
          const stomp = this.isPlayerStomp(sl, dt);
          if (stomp || this.player.isGroundPounding || sl.isDisabled()) {
            this.resolveHeavyStompImpact(sl, {
              hitFn: (dir) => sl.takeHit(dir, true),
              firstState: 'damaged',
              firstBurstColor: '#fde047',
              killPts: 80,
              killColor: '#64748b',
              killTextColor: '#e2e8f0'
            });
          } else {
            this.damagePlayer(sl.x + sl.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.kingCrabs.length; i++) {
        const kc = this.kingCrabs[i];
        kc.update(dt);
        if (kc.dead || kc.hitCooldown > 0) continue;
        const kx = kc.x + kc.w * 0.5;
        const ky = kc.y + kc.h * 0.5;
        if (playerHits(kc)) {
          const knockDir = kx >= this.player.x + this.player.w * 0.5 ? 1 : -1;
          const stomp = this.isPlayerStomp(kc, dt);
          if (kc.hasArmor && !kc.armorBroken) {
            if (this.player.isGroundPounding) {
              kc.takeHit(this.particles, knockDir, true, true, true);
              this.player.y = Math.min(this.player.y, kc.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.player.isGroundPounding = false;
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(kc.x - 24, kc.y - 18, '🦀 ¡CAPARAZÓN ROTO!', '#fde047');
              this.saveHighScore();
            } else if (stomp && kc.hypnotizedTimer > 0) {
              kc.takeHit(this.particles, knockDir, true, true, true);
              this.player.y = Math.min(this.player.y, kc.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(kc.x - 24, kc.y - 18, '♥ ¡ARMADURA ROTA!', '#f472b6');
              this.saveHighScore();
            } else if (stomp) {
              this.player.y = Math.min(this.player.y, kc.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.sound.spikeHit();
              this.particles.Burst(kx, kc.y + 6, '#fbbf24', 8);
              this.particles.FloatingText(
                kc.x - 26,
                kc.y - 18,
                this.formatControlHintText('🦀 ¡CAPARAZÓN DURO! ¡USÁ [Z] O [C]!'),
                '#fbbf24'
              );
            } else if (!kc.isDisabled()) {
              this.damagePlayer(kx);
              if (this.state !== 'playing') return;
            }
          } else {
            if (stomp || this.player.isGroundPounding || kc.isDisabled()) {
              kc.dead = true;
              if (!this.player.isGroundPounding) {
                this.applyPlayerStompBounce(-385);
              } else {
                this.grantStompGrace(0.15);
              }
              this.score += 90;
              this.sound.stomp();
              this.particles.Burst(kx, ky, '#ef4444', 18);
              this.particles.Burst(kx, ky, '#fbbf24', 10);
              this.particles.FloatingText(kc.x, kc.y - 8, '🦀 +90', '#fde047');
              this.saveHighScore();
            } else {
              this.damagePlayer(kx);
              if (this.state !== 'playing') return;
            }
          }
        }
      }

      for (let i = 0; i < this.fuegianFoxes.length; i++) {
        const ff = this.fuegianFoxes[i];
        ff.update(dt, this.player, argAiCtx);
        if (ff.dead) continue;
        if (playerHits(ff)) {
          if (!checkBaStomp(ff, 70, '#ea580c')) {
            this.damagePlayer(ff.x + ff.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.swarmCormorants.length; i++) {
        const sc = this.swarmCormorants[i];
        sc.update(dt, this.player);
        if (sc.dead || sc.scaredFlying) continue;
        if (playerHits(sc) && !sc.isDisabled()) {
          this.particles.Burst(sc.x + sc.w * 0.5, sc.y + sc.h * 0.5, '#f8fafc', 14);
          this.particles.FeatherBurst(sc.x + sc.w * 0.5, sc.y + sc.h * 0.5, '#0f172a', 8);
          this.sound.spikeHit();
          if (this.player.invincibleTimer <= 0.15) {
            this.damagePlayer(sc.x + sc.w * 0.5, true);
            if (this.state !== 'playing') return;
            this.player.invincibleTimer = 0.24;
          }
          sc.dead = true;
        }
      }

      for (let i = 0; i < this.pumas.length; i++) {
        const pm = this.pumas[i];
        pm.update(dt, this.player);
        if (pm.dead || pm.hitCooldown > 0) continue;
        if (playerHits(pm)) {
          const stomp = this.isPlayerStomp(pm, dt);
          if (stomp || this.player.isGroundPounding || pm.isDisabled()) {
            this.resolveHeavyStompImpact(pm, {
              hitFn: (dir) => pm.takeHit(this.particles, dir, true),
              firstState: 'damaged',
              firstBurstColor: '#fde047',
              killPts: 85,
              killColor: '#f59e0b',
              killTextColor: '#fef08a'
            });
          } else {
            this.damagePlayer(pm.x + pm.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.vicunas.length; i++) {
        const vc = this.vicunas[i];
        vc.update(dt, this.player);
        if (vc.pendingSpit) {
          this.salineSpits.push(vc.pendingSpit);
          vc.pendingSpit = null;
        }
        if (vc.dead) continue;
        if (playerHits(vc)) {
          if (!checkBaStomp(vc, 65, '#f59e0b')) {
            this.damagePlayer(vc.x + vc.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = this.salineSpits.length - 1; i >= 0; i--) {
        const sp = this.salineSpits[i];
        sp.update(dt, this.solids, this.cameraX);
        if (sp.dead) {
          this.salineSpits.splice(i, 1);
          continue;
        }
        if (playerHits(sp)) {
          sp.dead = true;
          this.salineSpits.splice(i, 1);
          this.particles.Burst(sp.x + sp.w * 0.5, sp.y + sp.h * 0.5, '#f8fafc', 12);
          this.damagePlayer(sp.x + sp.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      for (let i = 0; i < this.portDogs.length; i++) {
        const pd = this.portDogs[i];
        pd.update(dt, this.player);
        if (pd.dead || pd.happyFleeing) continue;
        if (playerHits(pd)) {
          if (!checkBaStomp(pd, 60, '#a855f7')) {
            this.damagePlayer(pd.x + pd.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.guasoDancers.length; i++) {
        const gd = this.guasoDancers[i];
        gd.update(dt);
        if (gd.dead) continue;
        if (playerHits(gd)) {
          if (!checkBaStomp(gd, 75, gd.variant === 'guasa' ? '#ef4444' : '#1d4ed8')) {
            this.damagePlayer(gd.x + gd.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.condors.length; i++) {
        const cn = this.condors[i];
        cn.update(dt, this.player);
        if (cn.dead || cn.scaredFlying) continue;
        if (playerHits(cn)) {
          if (!checkBaStomp(cn, 75, '#f8fafc')) {
            this.damagePlayer(cn.x + cn.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.portPelicans.length; i++) {
        const pp = this.portPelicans[i];
        pp.update(dt, this.player, this.pelicanDrops);
        if (pp.dead || pp.scaredFlying) continue;
        if (playerHits(pp)) {
          if (!checkBaStomp(pp, 70, '#fb923c')) {
            this.damagePlayer(pp.x + pp.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = this.pelicanDrops.length - 1; i >= 0; i--) {
        const drop = this.pelicanDrops[i];
        drop.update(dt);
        if (drop.dead) {
          this.pelicanDrops.splice(i, 1);
          continue;
        }
        if (playerHits(drop)) {
          drop.dead = true;
          this.pelicanDrops.splice(i, 1);
          this.particles.Burst(drop.x + drop.w * 0.5, drop.y + drop.h * 0.5, '#38bdf8', 12);
          this.damagePlayer(drop.x + drop.w * 0.5);
          if (this.state !== 'playing') return;
        }
      }

      for (let i = 0; i < this.pacificHazards.length; i++) {
        const ph = this.pacificHazards[i];
        ph.update(dt);
        this.emitJumpingFishSplash(
          ph,
          ph.baseY - 4,
          ph.kind === 'magma_piranha' ? '#fb923c' : '#7dd3fc'
        );
        const dbox = ph.getDamageBox();
        if (!dbox) continue;
        const isMagma = ph.kind === 'magma_piranha';
        const phLabel = isMagma
          ? '🌋 ¡PEZ DE LAVA!'
          : ph.kind === 'flying_fish'
          ? '🐟 ¡PEZ VOLADOR!'
          : ph.kind === 'beagle_fish'
          ? '🐟 ¡PEZ DEL BEAGLE!'
          : '🐟 ¡PIRAÑA DEL PACÍFICO!';
        const phColor = isMagma ? '#fb7185' : '#38bdf8';
        if (this.handleJumpingFishPlayerCollision(ph, dt, { box: dbox, label: phLabel, color: phColor })) {
          if (this.state !== 'playing') return;
        }
      }

      for (let i = 0; i < this.frigates.length; i++) {
        const fr = this.frigates[i];
        fr.update(dt, this.player);
        if (fr.dead || fr.scaredFlying) continue;
        if (playerHits(fr)) {
          if (!checkBaStomp(fr, 75, '#fb923c')) {
            this.damagePlayer(fr.x + fr.w * 0.5);
            if (this.state !== 'playing') return;
          }
        }
      }

      for (let i = 0; i < this.rapaNuiWarriors.length; i++) {
        const rn = this.rapaNuiWarriors[i];
        rn.update(dt, this.player);
        if (rn.dead || rn.hitCooldown > 0) continue;
        const rx = rn.x + rn.w * 0.5;
        if (playerHits(rn)) {
          const knockDir = rx >= this.player.x + this.player.w * 0.5 ? 1 : -1;
          const stomp = this.isPlayerStomp(rn, dt);
          if (rn.hasMask) {
            if (this.player.isGroundPounding) {
              rn.takeHit(this.particles, knockDir, true, true);
              this.player.y = Math.min(this.player.y, rn.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.player.isGroundPounding = false;
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(rn.x - 22, rn.y - 18, '🗿 ¡MÁSCARA ROTA!', '#fde047');
              this.saveHighScore();
            } else if (stomp && rn.hypnotizedTimer > 0) {
              rn.breakMask(this.particles, knockDir, true);
              this.player.y = Math.min(this.player.y, rn.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.score += 25;
              this.sound.spikeHit();
              this.particles.FloatingText(rn.x - 22, rn.y - 18, '♥ ¡MÁSCARA ROTA!', '#f472b6');
              this.saveHighScore();
            } else if (stomp) {
              this.player.y = Math.min(this.player.y, rn.y - this.player.h - 2);
              this.applyPlayerStompBounce(-370);
              this.sound.spikeHit();
              this.particles.Burst(rx, rn.y + 6, '#94a3b8', 8);
              this.particles.FloatingText(
                rn.x - 26,
                rn.y - 18,
                this.formatControlHintText('🗿 ¡MÁSCARA DE PIEDRA! ¡USÁ [Z] O [C]!'),
                '#fbbf24'
              );
            } else if (!rn.isDisabled()) {
              this.damagePlayer(rx);
              if (this.state !== 'playing') return;
            }
          } else {
            if (stomp || this.player.isGroundPounding || rn.isDisabled()) {
              rn.dead = true;
              if (!this.player.isGroundPounding) {
                this.applyPlayerStompBounce(-385);
              } else {
                this.grantStompGrace(0.15);
              }
              this.score += 85;
              this.sound.stomp();
              this.particles.Burst(rx, rn.y + rn.h * 0.5, '#fb923c', 18);
              this.particles.Burst(rx, rn.y + rn.h * 0.5, '#94a3b8', 10);
              this.particles.FloatingText(rn.x, rn.y - 8, '🗿 +85', '#fde047');
              this.saveHighScore();
            } else {
              this.damagePlayer(rx);
              if (this.state !== 'playing') return;
            }
          }
        }
      }

      for (let i = 0; i < this.swarmFrigates.length; i++) {
        const sf = this.swarmFrigates[i];
        sf.update(dt, this.player);
        if (sf.dead || sf.scaredFlying) continue;
        if (playerHits(sf) && !sf.isDisabled()) {
          this.particles.Burst(sf.x + sf.w * 0.5, sf.y + sf.h * 0.5, '#f8fafc', 14);
          this.particles.FeatherBurst(sf.x + sf.w * 0.5, sf.y + sf.h * 0.5, '#1e293b', 8);
          this.sound.spikeHit();
          if (this.player.invincibleTimer <= 0.15) {
            this.damagePlayer(sf.x + sf.w * 0.5, true);
            if (this.state !== 'playing') return;
            this.player.invincibleTimer = 0.24;
          }
          sf.dead = true;
        }
      }

      // 8. Bandera / Poste de parada de meta del nivel -> Inicia la Cinemática de Fin de Nivel
      const flagBox = this.getGoalFlagHitbox();
      if (global.Entities.aabbOverlap(this.player, flagBox)) {
        this.startLevelClearCinematic();
        return;
      }

      // 9. Cámara suave siguiendo al líder (respeta piso mínimo de auto-scrolling)
      const rawTargetCamX = Math.max(
        0,
        Math.min(this.levelData.width - LOGICAL_W, this.player.x - LOGICAL_W * 0.35)
      );
      const targetCamX = this.autoScrollSpeed > 0 ? Math.max(this.cameraX, rawTargetCamX) : rawTargetCamX;
      this.cameraX += (targetCamX - this.cameraX) * Math.min(1, dt * 8);

      // 10. Actualizar partículas
      this.particles.update(dt);
    }

    damagePlayer(sourceX, isSwarm = false) {
      if (this.ghostMode) return;
      if (this.isAbductedByCheat) return;
      if (this.isBiplaneFlightCheat) return;
      const res = this.player.takeDamage(sourceX, this.sound, this.particles, isSwarm, {
        reserveItem: this.reservePowerUp,
        onConsumeReserve: () => {
          this.reservePowerUp = null;
          if (this.player) this.player.reserveItem = null;
        }
      });
      if (res && res.usedReserve) {
        this.tookDamageInZone = true;
        this.carriedPowerUp = (this.player && this.player.activePowerUp) || null;
        this.triggerScreenShake(0.18, 4);
        return;
      }
      if (res && res.damaged) {
        this.tookDamageInZone = true;
        this.triggerScreenShake(0.24, 5);
        // Si el golpe rompió el power-up activo, pasa a estado normal manteniendo intacta la Reserva [W]
        this.carriedPowerUp = (this.player && this.player.activePowerUp) || null;
        if (res.lostHeart && this.player.hearts <= 0) {
          this.loseLife(false);
        } else if (this.player && this.player.hearts >= 1) {
          this.syncHeartsToSlot(this.player.hearts);
        }
      }
    }

    loseLife(fellInPit) {
      if (this.ghostMode) return;
      if (this.isAbductedByCheat) return;
      if (this.isBiplaneFlightCheat) return;
      this.triggerPlayerDeath({ fellInPit: Boolean(fellInPit), timeUp: false });
    }

    // ========================================================================
    // RENDERIZADO HD 1080p (Escalado 2x sobre espacio lógico 960x540)
    // ========================================================================
    render() {
      const ctx = this.ctx;
      ctx.save();
      ctx.scale(RENDER_SCALE, RENDER_SCALE);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

      if (this.state === 'splash' || this.state === 'menu') {
        this.renderMenu(ctx);
        ctx.restore();
        return;
      }

      if (this.state === 'save_slots') {
        this.renderMenu(ctx);
        this.renderSaveSlotsModal(ctx);
        ctx.restore();
        return;
      }

      if (this.state === 'controls') {
        this.renderMenu(ctx);
        this.renderControlsModal(ctx);
        ctx.restore();
        return;
      }

      if (this.state === 'leaderboard') {
        this.renderMenu(ctx);
        this.renderLeaderboardModal(ctx);
        ctx.restore();
        return;
      }

      if (this.state === 'settings') {
        this.renderMenu(ctx);
        ctx.restore();
        return;
      }

      if (this.state === 'map') {
        this.mapScreen.render(ctx);
        ctx.restore();
        return;
      }

      // Temblor de cámara en impactos
      ctx.save();
      if (this.screenShakeTimer > 0) {
        const sx = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
        const sy = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
        ctx.translate(sx, sy);
      }

      this.renderWorld(ctx);
      ctx.restore();

      this.renderHUD(ctx);

      if (this.state === 'player_dead') {
        this.renderDeathIrisOverlay(ctx);
      } else if (this.state === 'cheat_iris') {
        this.drawCircularIrisOverlay(ctx, this.irisCenterX, this.irisCenterY, this.irisRadius);
      } else if (this.state === 'level_cinematic') {
        this.renderCinematicOverlay(ctx);
      } else if (this.state === 'paused') {
        this.renderPauseModal(ctx);
      } else if (this.state === 'level_clear') {
        this.renderLevelClearModal(ctx);
      } else if (this.state === 'gameover') {
        this.renderGameOverModal(ctx);
      } else if (this.state === 'victory') {
        this.renderVictoryScreen(ctx);
      }

      ctx.restore();
    }

    renderWorld(ctx) {
      // 1. Fondo Parallax de 5 capas con iluminación volumétrica radial
      this.bgRenderer.draw(
        ctx,
        this.levelData.theme,
        this.cameraX,
        LOGICAL_W,
        LOGICAL_H,
        this.globalAnimTime,
        this.levelData && this.levelData.width
      );

      // En Barri Gòtic, garantiza orden z limpio en pozos de borde a borde hasta el fondo del hueco
      if (this.waterPits && this.waterPits.length > 0 && this.levelData && this.levelData.theme === 'gotic') {
        const pitCleanGrad = ctx.createLinearGradient(0, 458, 0, LOGICAL_H);
        pitCleanGrad.addColorStop(0, '#071124');
        pitCleanGrad.addColorStop(1, '#030712');
        ctx.save();
        for (let i = 0; i < this.waterPits.length; i++) {
          const pit = this.waterPits[i];
          const sx = pit.x - this.cameraX;
          if (sx + pit.w < -16 || sx > LOGICAL_W + 16) continue;
          ctx.fillStyle = pitCleanGrad;
          ctx.fillRect(sx, 460, pit.w, LOGICAL_H - 460);
        }
        ctx.restore();
      }

      if (this.waterPits && this.waterPits.length > 0) {
        this.bgRenderer.drawWaterPits(
          ctx,
          this.waterPits,
          this.cameraX,
          LOGICAL_W,
          LOGICAL_H,
          this.globalAnimTime,
          Object.assign(
            { pass: 'back', stormy: this.hasStormWaves },
            { waterTone: this.isRosarioParanaWater() ? 'parana' : 'ocean' }
          )
        );
      }

      // 2. Plataformas fijas y móviles con relieve y biselado 3D
      for (let i = 0; i < this.solids.length; i++) {
        this.bgRenderer.drawPlatform(ctx, this.solids[i], this.cameraX);
      }
      for (let i = 0; i < this.movingPlatforms.length; i++) {
        this.bgRenderer.drawPlatform(ctx, this.movingPlatforms[i], this.cameraX);
      }
      for (let i = 0; i < this.fallingPlatforms.length; i++) {
        this.fallingPlatforms[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.hiddenBlocks.length; i++) {
        this.hiddenBlocks[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.sinkingContainers.length; i++) {
        this.bgRenderer.drawPlatform(ctx, this.sinkingContainers[i], this.cameraX);
      }
      for (let i = 0; i < this.ropes.length; i++) {
        this.ropes[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.subwayVents.length; i++) {
        this.subwayVents[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.overheadHazards.length; i++) {
        this.overheadHazards[i].draw(ctx, this.sprites, this.cameraX);
      }

      if (this.roseTunnels && this.roseTunnels.length > 0) {
        this.bgRenderer.drawRetiroRoseTunnels(
          ctx,
          this.roseTunnels,
          this.cameraX,
          LOGICAL_W,
          LOGICAL_H,
          this.globalAnimTime,
          'back'
        );
      }

      // 3. Bandera de meta HD + Boca de Metro (BCN/MAD) o Parada de Autobús EMT (Palma)
      const flagDrawX = this.getGoalFlagDrawX();
      const flagScreenX = flagDrawX - this.cameraX;
      const flagScreenY = this.levelData.flagY - 68;
      this.sprites.drawFlagHD(ctx, flagScreenX, flagScreenY, this.globalAnimTime, this.cityKey);

      const metroScreenX = this.levelData.flagX + 78 - this.cameraX;
      const metroScreenY = this.levelData.flagY + 68;
      const { isBusOrGuagua, isTeideCable, busVariant, nextDestination: nextDest } = this.getGoalStationMeta();
      if (isTeideCable) {
        this.sprites.drawCableCarStationHD(
          ctx,
          metroScreenX,
          metroScreenY,
          this.globalAnimTime,
          this.state === 'level_cinematic'
        );
      } else if (isBusOrGuagua) {
        this.sprites.drawBusStopHD(
          ctx,
          metroScreenX,
          metroScreenY,
          this.globalAnimTime,
          nextDest,
          this.state === 'level_cinematic',
          busVariant
        );
      } else {
        this.sprites.drawMetroEntranceHD(
          ctx,
          metroScreenX,
          metroScreenY,
          this.globalAnimTime,
          nextDest,
          false,
          this.cityKey
        );
      }

      // 4b. Géiseres de vapor volcánico de Canarias
      for (let i = 0; i < this.geysers.length; i++) {
        this.geysers[i].draw(ctx, this.sprites, this.cameraX);
      }

      // 5. Coleccionables, Power-Ups y Proyectiles de Calamares HD
      for (let i = 0; i < this.collectibles.length; i++) {
        this.collectibles[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.calamaresProjectiles.length; i++) {
        this.calamaresProjectiles[i].draw(ctx, this.sprites, this.cameraX);
      }

      // 6. Enemigos con sombras dinámicas
      for (let i = 0; i < this.pigeons.length; i++) {
        this.pigeons[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.seagulls.length; i++) {
        this.seagulls[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.madridCats.length; i++) {
        this.madridCats[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.selfieTourists.length; i++) {
        this.selfieTourists[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.royalGuards.length; i++) {
        this.royalGuards[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.peacocks.length; i++) {
        this.peacocks[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.crazyCyclists.length; i++) {
        this.crazyCyclists[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.greenParakeets.length; i++) {
        this.greenParakeets[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.swarmParakeets.length; i++) {
        this.swarmParakeets[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.jellyfishes.length; i++) {
        this.jellyfishes[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.crabs.length; i++) {
        this.crabs[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.goats.length; i++) {
        this.goats[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.royalSeagulls.length; i++) {
        this.royalSeagulls[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.swarmRoyalSeagulls.length; i++) {
        this.swarmRoyalSeagulls[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.gallotias.length; i++) {
        this.gallotias[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.garajonayFoxes.length; i++) {
        this.garajonayFoxes[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      if (this.gaudiLizard && !this.gaudiLizard.dead) {
        this.gaudiLizard.draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.abubillas.length; i++) {
        this.abubillas[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.swarmAbubillas.length; i++) {
        this.swarmAbubillas[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.blindCrabs.length; i++) {
        this.blindCrabs[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.hedgehogs.length; i++) {
        this.hedgehogs[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.boars.length; i++) {
        this.boars[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.zigzagPigeons.length; i++) {
        this.zigzagPigeons[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.swarmPigeons.length; i++) {
        this.swarmPigeons[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.scooters.length; i++) {
        this.scooters[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }

      for (let i = 0; i < this.trapitos.length; i++) {
        this.trapitos[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.motochorros.length; i++) {
        this.motochorros[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.barrabravas.length; i++) {
        this.barrabravas[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.canillitas.length; i++) {
        this.canillitas[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.fatPigeons.length; i++) {
        this.fatPigeons[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.horneroNests.length; i++) {
        this.horneroNests[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.horneros.length; i++) {
        this.horneros[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.swarmHorneros.length; i++) {
        this.swarmHorneros[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.bouncyDrums.length; i++) {
        this.bouncyDrums[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.lightPoles.length; i++) {
        this.sprites.drawCostaneraLightPoleHD(ctx, this.lightPoles[i], this.cameraX, this.globalAnimTime);
      }
      for (let i = 0; i < this.rockeros.length; i++) {
        this.rockeros[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.penguins.length; i++) {
        this.penguins[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.coldBlasts.length; i++) {
        this.coldBlasts[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.palometas.length; i++) {
        this.palometas[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.swarmMosquitoes.length; i++) {
        this.swarmMosquitoes[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.newspaperProjectiles.length; i++) {
        this.newspaperProjectiles[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.fernetPuddles.length; i++) {
        this.fernetPuddles[i].draw(ctx, this.sprites, this.cameraX, this.globalAnimTime);
      }
      for (let i = 0; i < this.belgranoPirates.length; i++) {
        this.belgranoPirates[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.fernetBottles.length; i++) {
        this.fernetBottles[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.serranoBurros.length; i++) {
        this.serranoBurros[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.miniUfos.length; i++) {
        this.miniUfos[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.seaLions.length; i++) {
        this.seaLions[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.kingCrabs.length; i++) {
        this.kingCrabs[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.fuegianFoxes.length; i++) {
        this.fuegianFoxes[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.swarmCormorants.length; i++) {
        this.swarmCormorants[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.pumas.length; i++) {
        this.pumas[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.condors.length; i++) {
        this.condors[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.portPelicans.length; i++) {
        this.portPelicans[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.pelicanDrops.length; i++) {
        this.pelicanDrops[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.pacificHazards.length; i++) {
        this.pacificHazards[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.vicunas.length; i++) {
        this.vicunas[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.salineSpits.length; i++) {
        this.salineSpits[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.portDogs.length; i++) {
        this.portDogs[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.rapaNuiWarriors.length; i++) {
        this.rapaNuiWarriors[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.guasoDancers.length; i++) {
        this.guasoDancers[i].draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }
      for (let i = 0; i < this.frigates.length; i++) {
        this.frigates[i].draw(ctx, this.sprites, this.cameraX);
      }
      for (let i = 0; i < this.swarmFrigates.length; i++) {
        this.swarmFrigates[i].draw(ctx, this.sprites, this.cameraX);
      }

      // 7. El Trío en Simultáneo + Teleférico / Autobús-Guagua / Metro
      const hidePartyForBus =
        (isBusOrGuagua || isTeideCable) && this.state === 'level_cinematic' && this.cinematicPartyHidden;
      const drawBusBehindBoarding =
        isBusOrGuagua && this.state === 'level_cinematic' && !this.cinematicBusExited;

      if (drawBusBehindBoarding) {
        if (busVariant === 'rosario') {
          this.sprites.drawRosarioBus(
            ctx,
            this.cinematicBusX - this.cameraX,
            this.cinematicBusY,
            this.globalAnimTime,
            nextDest,
            this.cinematicBusWheelAngle,
            this.cinematicBusDoorsOpen,
            this.cinematicPartyHidden,
            this.cinematicBusFacing || 'left',
            (this.levelData && this.levelData.busLine) || null,
            this.cinematicBusSuspensionY || 0
          );
        } else {
          this.sprites.drawUrbanBusHD(
            ctx,
            this.cinematicBusX - this.cameraX,
            this.cinematicBusY,
            this.globalAnimTime,
            nextDest,
            this.cinematicBusWheelAngle,
            this.cinematicBusDoorsOpen,
            this.cinematicPartyHidden,
            busVariant,
            this.cinematicBusFacing || 'left'
          );
        }
      }

      // Z-Order estricto de formación: Tina (fondo) -> Acompañante (medio) -> Líder (frente)
      if (!hidePartyForBus) {
        this.tina.draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
        this.partner.draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
        this.player.draw(ctx, this.sprites, this.cameraX, this.solids, this.movingPlatforms);
      }

      if (this.roseTunnels && this.roseTunnels.length > 0) {
        this.bgRenderer.drawRetiroRoseTunnels(
          ctx,
          this.roseTunnels,
          this.cameraX,
          LOGICAL_W,
          LOGICAL_H,
          this.globalAnimTime,
          'front'
        );
      }

      if (
        this.levelData &&
        this.levelData.theme === 'canarias_garajonay' &&
        typeof this.bgRenderer.drawGarajonayBridgeForeground === 'function'
      ) {
        this.bgRenderer.drawGarajonayBridgeForeground(
          ctx,
          this.solids,
          this.cameraX,
          LOGICAL_W,
          this.globalAnimTime
        );
      }

      if (this.isAbductedByCheat) {
        this.drawEtHomeAbduction(ctx);
      }

      if (this.isBiplaneFlightCheat) {
        this.drawBiplaneTourFlight(ctx);
      }

      if (isTeideCable) {
        if (this.state === 'level_cinematic' && !this.cinematicCableCarExited) {
          const isDocked = this.cinematicTimer >= 2.15 && this.cinematicTimer < 3.15;
          const swayAngle = isDocked
            ? Math.sin(this.globalAnimTime * 2.0) * 0.008
            : Math.sin(this.globalAnimTime * 2.5) * 0.028;
          const cableAngle = Number.isFinite(this.cinematicCableCarAngle)
            ? this.cinematicCableCarAngle
            : Math.atan2(736, 1188);
          this.sprites.drawCableCarCabinHD(
            ctx,
            this.cinematicCableCarX - this.cameraX,
            this.cinematicCableCarY,
            this.globalAnimTime,
            this.cinematicCableCarDoorsOpen,
            this.cinematicPartyHidden,
            swayAngle,
            cableAngle
          );
        }
      } else if (!isBusOrGuagua) {
        this.sprites.drawMetroEntranceHD(
          ctx,
          metroScreenX,
          metroScreenY,
          this.globalAnimTime,
          nextDest,
          true,
          this.cityKey
        );
      }

      if (this.waterPits && this.waterPits.length > 0) {
        this.bgRenderer.drawWaterPits(
          ctx,
          this.waterPits,
          this.cameraX,
          LOGICAL_W,
          LOGICAL_H,
          this.globalAnimTime,
          Object.assign(
            { pass: 'front', stormy: this.hasStormWaves },
            { waterTone: this.isRosarioParanaWater() ? 'parana' : 'ocean' }
          )
        );
      }

      // 8. Partículas HD a 60 FPS + Viento Costero y Oleaje de Tormenta en primer plano
      this.particles.draw(ctx, this.cameraX);

      if (this.hasWind && this.windActive && this.state === 'playing') {
        ctx.save();
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.42)';
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        for (let wIdx = 0; wIdx < 16; wIdx++) {
          const sx = LOGICAL_W - (((this.globalAnimTime * 680 + wIdx * 135) % (LOGICAL_W + 180)) - 90);
          const sy = 76 + ((wIdx * 43) % 340);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 54, sy + 6);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8b. Olas de tormenta en primer plano (Palma 4 y Ushuaia 4), recortadas exclusivamente a los pozos abiertos
      if (this.hasStormWaves && this.waterPits && this.waterPits.length > 0) {
        ctx.save();
        ctx.beginPath();
        let hasVisiblePit = false;
        for (let i = 0; i < this.waterPits.length; i++) {
          const pit = this.waterPits[i];
          const sx = Math.max(0, pit.x - this.cameraX);
          const ex = Math.min(LOGICAL_W, pit.x + pit.w - this.cameraX);
          if (ex > sx) {
            ctx.rect(sx, 456, ex - sx, LOGICAL_H - 456);
            hasVisiblePit = true;
          }
        }
        if (hasVisiblePit) {
          ctx.clip();
          ctx.fillStyle = 'rgba(2, 132, 199, 0.28)';
          ctx.beginPath();
          ctx.moveTo(0, LOGICAL_H);
          for (let wx = 0; wx <= LOGICAL_W; wx += 18) {
            const wy = 486 + Math.sin((wx + this.cameraX * 0.85) * 0.048 + this.globalAnimTime * 5.8) * 12;
            ctx.lineTo(wx, wy);
          }
          ctx.lineTo(LOGICAL_W, LOGICAL_H);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 9. Banner compacto superior al comenzar cada nivel (ancho/alto dinámicos para nunca desbordar)
      if (this.levelBannerTimer > 0 && this.state === 'playing') {
        ctx.save();
        const alpha = Math.min(1, this.levelBannerTimer);
        ctx.globalAlpha = alpha;
        const padX = 26;
        const maxBoxW = Math.min(760, LOGICAL_W - 40);
        const maxContentW = maxBoxW - padX * 2;
        const titleFont = 'bold 14px "Segoe UI", system-ui, sans-serif';
        const subFont = '11px "Segoe UI", system-ui, sans-serif';
        const titleText = String((this.levelData && this.levelData.name) || '');
        const subRaw =
          this.levelData && this.levelData.subtitle
            ? this.formatControlHintText(this.levelData.subtitle)
            : '';

        ctx.font = titleFont;
        const titleLines = this.wrapBannerText(ctx, titleText, maxContentW);
        let titleMaxW = 0;
        for (let i = 0; i < titleLines.length; i++) {
          titleMaxW = Math.max(titleMaxW, ctx.measureText(titleLines[i]).width);
        }

        ctx.font = subFont;
        const subLines = this.wrapBannerText(ctx, subRaw, maxContentW);
        let subMaxW = 0;
        for (let i = 0; i < subLines.length; i++) {
          subMaxW = Math.max(subMaxW, ctx.measureText(subLines[i]).width);
        }

        const boxW = Math.min(
          maxBoxW,
          Math.max(240, Math.ceil(Math.max(titleMaxW, subMaxW) + padX * 2))
        );
        const padY = 7;
        const titleLineH = 16;
        const subLineH = 14;
        const gapBetween = subLines.length > 0 ? 3 : 0;
        const boxH = padY * 2 + titleLines.length * titleLineH + gapBetween + subLines.length * subLineH;
        const boxX = LOGICAL_W * 0.5 - boxW * 0.5;
        const boxY = 60;

        ctx.fillStyle = 'rgba(9, 13, 22, 0.84)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.font = titleFont;
        let cursorY = boxY + padY + 11;
        for (let i = 0; i < titleLines.length; i++) {
          ctx.fillText(titleLines[i], LOGICAL_W * 0.5, cursorY, boxW - padX * 2);
          cursorY += titleLineH;
        }
        if (subLines.length > 0) {
          cursorY += gapBetween - 1;
          ctx.fillStyle = '#e2e8f0';
          ctx.font = subFont;
          for (let i = 0; i < subLines.length; i++) {
            ctx.fillText(subLines[i], LOGICAL_W * 0.5, cursorY, boxW - padX * 2);
            cursorY += subLineH;
          }
        }
        ctx.restore();
      } else if (this.activeHintTimer > 0 && this.activeHintText && this.state === 'playing') {
        // 9b. Cartel tutorial discreto arriba (~3.8s visibles tras el banner del título, con fade-out suave)
        ctx.save();
        const alpha = Math.min(1, this.activeHintTimer / 0.65);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        const hintDisplayText = this.formatControlHintText(this.activeHintText);
        const padX = 24;
        const maxBoxW = Math.min(760, LOGICAL_W - 40);
        const maxContentW = maxBoxW - padX * 2;
        const hintLines = this.wrapBannerText(ctx, hintDisplayText, maxContentW);
        let hintMaxW = 0;
        for (let i = 0; i < hintLines.length; i++) {
          hintMaxW = Math.max(hintMaxW, ctx.measureText(hintLines[i]).width);
        }
        const textW = Math.min(maxBoxW, Math.max(220, Math.ceil(hintMaxW + padX * 2)));
        const lineH = 14;
        const boxH = 12 + Math.max(1, hintLines.length) * lineH;
        ctx.fillStyle = 'rgba(9, 13, 22, 0.78)';
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(LOGICAL_W * 0.5 - textW * 0.5, 60, textW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        for (let i = 0; i < hintLines.length; i++) {
          ctx.fillText(hintLines[i], LOGICAL_W * 0.5, 60 + 17 + i * lineH, textW - padX * 2);
        }
        ctx.restore();
      }

      // 10. Alerta parpadeante de Clímax en Nivel 4 (WARNING / PELIGRO)
      if (this.swarmAlertTimer > 0 && this.state === 'playing') {
        ctx.save();
        const flash = Math.sin(this.globalAnimTime * 18) > 0;
        ctx.fillStyle = flash ? 'rgba(185, 28, 28, 0.92)' : 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = flash ? '#fef08a' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(LOGICAL_W * 0.5 - 310, 72, 620, 64, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = flash ? '#fef08a' : '#f87171';
        ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          '⚠️ WARNING / ¡PELIGRO! — ¡ATAQUE EN ENJAMBRE! ⚠️',
          LOGICAL_W * 0.5,
          100
        );
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
        const kSwarmTina = this.getControlKeyBadge('tina', true, 'X');
        const swarmText = this.isHorneroSwarm
          ? `¡BANDADA DE HORNEROS TELEDIRIGIDOS! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`
          : this.isMosquitoSwarm
          ? `¡NUBE DE MOSQUITOS DEL PARANÁ! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`
          : this.isCormorantSwarm
          ? `¡20 CORMORANES AUSTRALES EN ENJAMBRE! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`
          : this.isFrigateSwarm
          ? `¡20 FRAGATAS DEL PACÍFICO EN ENJAMBRE! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`
          : this.isCanariasSwarm
          ? `¡20 ABUBILLAS CANARIAS EN PICADA! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`
          : this.isPalmaSwarm
          ? `¡20 GAVIOTAS REALES EN TORMENTA! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`
          : this.isMadridSwarm
          ? `¡20 COTORRAS EN ENJAMBRE! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`
          : `¡20 PALOMAS AGRESIVAS! ¡ACTIVÁ EL LADRIDO DE LA TINA [${kSwarmTina}] AHORA!`;
        ctx.fillText(swarmText, LOGICAL_W * 0.5, 123);
        ctx.restore();
      }
    }

    /**
     * Renderiza la megafonía de TMB y la cortinilla circular negra (Iris Out)
     * durante la cinemática de fin de nivel.
     */
    renderCinematicOverlay(ctx) {
      const nextDest = this.levelData.nextDestination || 'El Gòtic';
      const isBusOrGuagua = this.usesBusOrGuaguaCinematic();
      const isTeideCable = this.isTeideCableCarLevel();
      const isCanarias = this.isCanariasCity();
      const isCordoba = this.isCordobaCity();
      const isUshuaia = this.isUshuaiaCity();
      const isChileMetro = this.isChileMetroCity();
      const isChileBus = this.isChileBusCity();
      const isRosario = this.isRosarioCity();
      const isBuenosAires = this.normalizeCityKey(this.cityKey) === 'buenosaires';
      const metroHeader =
        isTeideCable
          ? '🚡 TELEFÉRICO DEL TEIDE · CUMBRE DE ESPAÑA'
          : isCanarias
          ? '🚌 PARADA DE GUAGUA CANARIA'
          : isCordoba
          ? '🚌 PARADA DE COLECTIVO · TAMSE CÓRDOBA'
          : isUshuaia
          ? '🚌 PARADA AUSTRAL · USHUAIA FIN DEL MUNDO'
          : isChileMetro
          ? '🚇 MEGAFONÍA METRO DE SANTIAGO'
          : isChileBus
          ? (this.cityKey === 'chile_vina'
            ? '🚌 PARADA MICRO · VIÑA Y VALPARAÍSO'
            : this.cityKey === 'chile_atacama'
              ? '🚌 PARADA ALTIPLANO · ATACAMA'
              : '🚌 PARADA RAPA NUI · ISLA DE PASCUA')
          : isRosario
          ? '🚌 PARADA DE COLECTIVO · MOVI ROSARIO'
          : isBuenosAires
          ? '🟡 MEGAFONÍA SUBTE · ARGENTINA'
          : this.cityKey === 'madrid'
          ? '🚇 MEGAFONÍA METRO DE MADRID'
          : isBusOrGuagua
          ? '🚌 PARADA AUTOBÚS EMT PALMA'
          : '🚇 MEGAFONIA METRO BARCELONA (TMB)';
      const metroLine =
        isTeideCable
          ? '🔊 «¡Cumbre alcanzada! Próxima parada: América del Sur»'
          : isCanarias
          ? `🔊 «Guagua Canaria con destino a ${nextDest}»`
          : isUshuaia
          ? `🔊 «Próxima parada austral: ${nextDest}»`
          : isChileMetro || isBuenosAires || this.cityKey === 'madrid'
          ? `🔊 «Próxima estación: ${nextDest}»`
          : isChileBus || isCordoba || isRosario
          ? `🔊 «Próxima parada: ${nextDest}»`
          : isBusOrGuagua
          ? `🔊 «Autobús EMT amb destinació ${nextDest}»`
          : `🔊 «Tren amb destinació ${nextDest}»`;

      if (isTeideCable) {
        if (!this.cinematicCableCarExited && this.cinematicTimer >= 0.35) {
          ctx.save();
          ctx.fillStyle = 'rgba(9, 13, 22, 0.90)';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(LOGICAL_W * 0.5 - 295, 70, 590, 56, 12);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(metroHeader, LOGICAL_W * 0.5, 92);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(metroLine, LOGICAL_W * 0.5, 115);
          ctx.restore();
          if (this.cinematicPerfectZone) {
            this.drawPerfectZoneBadge(ctx, LOGICAL_W * 0.5, 134, '🌟 ¡ZONA PERFECTA! +1 VIDA · +500 PTS');
          }
        } else if (this.cinematicCableCarExited) {
          ctx.save();
          ctx.fillStyle = 'rgba(9, 13, 22, 0.94)';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(LOGICAL_W * 0.5 - 290, 168, 580, 128, 16);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#fde047';
          ctx.font = '900 30px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('🏆 ¡ESPAÑA COMPLETADA AL 100%!', LOGICAL_W * 0.5, 218);

          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('🚡 Teleférico del Teide · ¡Desbloqueando América del Sur!', LOGICAL_W * 0.5, 250);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(`⏱ Bonus de tiempo: +${this.cinematicTimeBonus} PTS`, LOGICAL_W * 0.5, 276);
          ctx.restore();
          if (this.cinematicPerfectZone) {
            this.drawPerfectZoneBadge(ctx, LOGICAL_W * 0.5, 304, '🌟 ¡ZONA PERFECTA! +1 VIDA · +500 PTS');
          }
        }
      } else if (isBusOrGuagua) {
        if (!this.cinematicBusExited && this.cinematicTimer >= 0.35) {
          ctx.save();
          ctx.fillStyle = 'rgba(9, 13, 22, 0.90)';
          ctx.strokeStyle = isCanarias ? '#eab308' : isCordoba ? '#dc2626' : isRosario ? '#0ea5e9' : '#0284c7';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(LOGICAL_W * 0.5 - 270, 70, 540, 56, 12);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = isCordoba ? '#fde047' : isRosario ? '#38bdf8' : '#fde047';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(metroHeader, LOGICAL_W * 0.5, 92);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(metroLine, LOGICAL_W * 0.5, 115);
          ctx.restore();
          if (this.cinematicPerfectZone) {
            this.drawPerfectZoneBadge(ctx, LOGICAL_W * 0.5, 134, '🌟 ¡ZONA PERFECTA! +1 VIDA · +500 PTS');
          }
        } else if (this.cinematicBusExited) {
          // Fase 5: Recién cuando el autobús salió de pantalla aparece "¡NIVEL COMPLETADO!"
          ctx.save();
          ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
          ctx.strokeStyle = isCordoba ? '#dc2626' : isRosario ? '#38bdf8' : '#fbbf24';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(LOGICAL_W * 0.5 - 260, 175, 520, 118, 16);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#fbbf24';
          ctx.font = '900 32px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('¡NIVEL COMPLETADO!', LOGICAL_W * 0.5, 226);

          ctx.fillStyle = isCanarias || isCordoba ? '#fde047' : '#38bdf8';
          ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(
            isCanarias
              ? `🚌 Próxima parada Guagua: ${nextDest}`
              : isCordoba
              ? `🚌 Próxima parada TAMSE: ${nextDest}`
              : isUshuaia
              ? `🚌 Próxima parada Austral: ${nextDest}`
              : isRosario
              ? `🚌 Próxima parada MOVI: ${nextDest}`
              : `🚌 Próxima parada EMT: ${nextDest}`,
            LOGICAL_W * 0.5,
            258
          );

          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(`⏱ Bonus de tiempo: +${this.cinematicTimeBonus} PTS`, LOGICAL_W * 0.5, 281);
          ctx.restore();
          if (this.cinematicPerfectZone) {
            this.drawPerfectZoneBadge(ctx, LOGICAL_W * 0.5, 300, '🌟 ¡ZONA PERFECTA! +1 VIDA · +500 PTS');
          }
        }
      } else if (
        this.cinematicTimer >= 0.40 &&
        (!this.cinematicMetroAllHidden || this.cinematicMetroIrisTimer < 0.7)
      ) {
        // Cartel luminoso de Megafonía mientras el equipo baja por la escalera del Metro
        ctx.save();
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(LOGICAL_W * 0.5 - 280, 70, 560, 56, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(metroHeader, LOGICAL_W * 0.5, 92);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(metroLine, LOGICAL_W * 0.5, 115);
        ctx.restore();
        if (this.cinematicPerfectZone) {
          this.drawPerfectZoneBadge(ctx, LOGICAL_W * 0.5, 134, '🌟 ¡ZONA PERFECTA! +1 VIDA · +500 PTS');
        }
      }

      // Cortinilla circular negra (Iris Out) centrada en el personaje
      const maxR = Math.hypot(LOGICAL_W, LOGICAL_H);
      if (this.irisRadius < maxR - 2) {
        this.drawCircularIrisOverlay(ctx, this.irisCenterX, this.irisCenterY, this.irisRadius);
      }
    }

    renderHUD(ctx) {
      ctx.save();

      // Barra superior HD con cristal oscuro y borde dorado
      const hudGrad = ctx.createLinearGradient(0, 0, 0, 56);
      hudGrad.addColorStop(0, 'rgba(9, 13, 22, 0.92)');
      hudGrad.addColorStop(1, 'rgba(15, 23, 42, 0.78)');
      ctx.fillStyle = hudGrad;
      ctx.fillRect(0, 0, LOGICAL_W, 56);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 54, LOGICAL_W, 2);

      // 1. Corazones y Vidas
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`VIDAS x${this.lives}`, 14, 21);

      for (let i = 0; i < this.player.maxHearts; i++) {
        const hx = 14 + i * 22;
        const hy = 27;
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.fillStyle = i < this.player.hearts ? '#ef4444' : '#334155';
        ctx.fillText('♥', hx, hy + 16);
      }

      // 2. Medidor de Habilidad del Líder (cooldown 5s)
      const kHudSkill = this.getControlKeyBadge('skill', true, 'C');
      const kHudTina = this.getControlKeyBadge('tina', true, 'X');
      const kHudShoot = this.getControlKeyBadge('shoot', true, 'Z');
      const kHudReserve = this.getControlKeyBadge('reserve', true, 'SHIFT');
      const isNico = this.player.characterKey === 'nico';
      const skillLabel =
        kHudSkill === 'C'
          ? isNico
            ? '💥 TERREMOTO [C]'
            : '💖 POSE [C]'
          : isNico
          ? `💥 TERREMOTO [${kHudSkill}]`
          : `💖 POSE [${kHudSkill}]`;
      const cd = this.player.abilityCooldown;
      const maxCd = this.player.abilityMaxCooldown;
      const ready = cd <= 0;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = ready ? '#22c55e' : '#64748b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(88, 8, 128, 40, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = ready ? '#4ade80' : '#cbd5e1';
      ctx.font = 'bold 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(skillLabel, 95, 22);

      const barW = 114;
      const progress = ready ? 1 : 1 - cd / maxCd;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(95, 29, barW, 10);
      ctx.fillStyle = ready ? '#22c55e' : '#f59e0b';
      ctx.fillRect(95, 29, barW * progress, 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px "Segoe UI", sans-serif';
      ctx.fillText(ready ? '¡LISTO!' : `${cd.toFixed(1)}s`, 136, 37.5);

      // 3. Medidor del Ladrido Doble de la Tina (cooldown 30s)
      const tinaCd = this.tina ? this.tina.growlCooldown : 0;
      const tinaMaxCd = this.tina ? this.tina.growlMaxCooldown : 30;
      const tinaReady = tinaCd <= 0;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = tinaReady ? '#10b981' : '#64748b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(222, 8, 124, 40, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = tinaReady ? '#6ee7b7' : '#cbd5e1';
      ctx.font = 'bold 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(kHudTina === 'X' ? '🐾 LA TINA [X]' : `🐾 LA TINA [${kHudTina}]`, 229, 22);

      const tinaBarW = 110;
      const tinaProgress = tinaReady ? 1 : 1 - tinaCd / tinaMaxCd;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(229, 29, tinaBarW, 10);
      ctx.fillStyle = tinaReady ? '#10b981' : '#0284c7';
      ctx.fillRect(229, 29, tinaBarW * tinaProgress, 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px "Segoe UI", sans-serif';
      ctx.fillText(tinaReady ? '¡GUAU LISTO!' : `${Math.ceil(tinaCd)}s`, 258, 37.5);

      // 3b. Indicador de Disparo de Planta
      const hasPlant = this.player.hasPlant();
      ctx.fillStyle = hasPlant ? 'rgba(20, 83, 45, 0.88)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = hasPlant ? '#4ade80' : '#475569';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(352, 8, 92, 40, 8);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = hasPlant ? '#bbf7d0' : '#cbd5e1';
      ctx.font = 'bold 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(kHudShoot === 'Z' ? '🌿 PLANTA [Z]' : `🌿 PLANTA [${kHudShoot}]`, 398, 22);
      ctx.fillStyle = hasPlant ? '#16a34a' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(359, 28, 78, 13, 4);
      ctx.fill();
      ctx.fillStyle = hasPlant ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 8.5px "Segoe UI", sans-serif';
      ctx.fillText(hasPlant ? '¡ACTIVA!' : 'DISPARAR', 398, 37.5);
      ctx.restore();

      // 4. CAJA DE RESERVA DE POWER-UP (ITEM BOX)
      ctx.fillStyle = 'rgba(9, 13, 22, 0.95)';
      ctx.strokeStyle = this.reservePowerUp ? '#fde047' : '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(ITEM_BOX_RECT.x, ITEM_BOX_RECT.y, ITEM_BOX_RECT.w, ITEM_BOX_RECT.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = this.reservePowerUp ? '#fde047' : '#94a3b8';
      ctx.font = 'bold 7.2px "Segoe UI", sans-serif';
      ctx.fillText(
        kHudReserve === 'SHIFT' ? 'RESERVA [SHIFT]' : `RESERVA [${kHudReserve}]`,
        ITEM_BOX_RECT.x + ITEM_BOX_RECT.w * 0.5,
        ITEM_BOX_RECT.y + 10
      );
      ctx.restore();

      if (this.reservePowerUp) {
        this.sprites.drawCollectibleHD(
          ctx,
          this.reservePowerUp,
          ITEM_BOX_RECT.x + 24,
          ITEM_BOX_RECT.y + 17,
          this.globalAnimTime * 3
        );
      } else {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 9.5px "Segoe UI", sans-serif';
        ctx.fillText('VACÍA', ITEM_BOX_RECT.x + ITEM_BOX_RECT.w * 0.5, ITEM_BOX_RECT.y + 34);
        ctx.restore();
      }

      // 5. Puntos, Monedas (1-UP cada 100) y Nivel
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`PUNTOS: ${String(this.score).padStart(5, '0')}`, 528, 23);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`🪙 ${this.runCoins}/100  (${this.totalCoins})`, 528, 42);

      const displayTime =
        this.state === 'level_cinematic'
          ? this.cinematicTimeLeft
          : Math.max(0, Math.ceil(this.levelTimer));
      const isHurry = this.state === 'playing' && this.levelTimer < 15.0;
      const timeTextColor = isHurry
        ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#ef4444' : '#ffffff')
        : '#cbd5e1';

      const cityHudCode =
        this.cityKey === 'madrid'
          ? 'MADRID'
          : this.cityKey === 'palma'
            ? 'PALMA'
            : this.isCanariasCity()
              ? 'CANARIAS'
              : this.cityKey === 'chile_santiago'
                ? 'SCL'
                : this.cityKey === 'chile_vina'
                  ? 'VIÑA'
                  : this.cityKey === 'chile_atacama'
                    ? 'ATCM'
                    : this.cityKey === 'chile_pascua'
                      ? 'RAPA'
                      : this.cityKey === 'ushuaia'
                        ? 'USH'
                        : this.cityKey === 'cordoba'
                          ? 'CBA'
                          : this.cityKey === 'rosario'
                          ? 'ROS'
                          : this.cityKey === 'buenosaires'
                            ? 'BA'
                            : 'BCN';
      ctx.fillStyle = isHurry ? '#ef4444' : '#38bdf8';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        `${cityHudCode} ${this.levelIndex + 1}/${this.getCityLevels().length}`,
        682,
        23
      );
      ctx.fillStyle = timeTextColor;
      ctx.font = isHurry ? '900 13px "Segoe UI", system-ui, sans-serif' : '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        this.state === 'level_cinematic' ? `⏱ BONUS: ${displayTime}s` : `⏱ ${displayTime}s`,
        682,
        42
      );

      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`RÉCORD: ${this.highScore}`, 804, 32);

      // 6. Pastilla minimalista del Poder Equipado debajo del HUD (solo ícono + 1 palabra)
      let badgeY = 64;
      const activePowerPill = this.player.hasAngelWings()
        ? { label: '🪽 ALAS', stroke: 'rgba(56, 189, 248, 0.78)', color: '#bae6fd' }
        : this.player.hasPlant()
        ? { label: '🌿 PLANTA', stroke: 'rgba(74, 222, 128, 0.78)', color: '#bbf7d0' }
        : this.player.activePowerUp
        ? {
            label: `✨ ${String(this.player.activePowerUp).split('_')[0].toUpperCase()}`,
            stroke: 'rgba(148, 163, 184, 0.78)',
            color: '#e2e8f0'
          }
        : null;

      if (activePowerPill) {
        const pillH = 22;
        const padX = 9;
        ctx.save();
        ctx.font = 'bold 10.5px "Segoe UI", system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        const pillW = Math.ceil(ctx.measureText(activePowerPill.label).width) + padX * 2;
        ctx.fillStyle = 'rgba(9, 13, 22, 0.84)';
        ctx.strokeStyle = activePowerPill.stroke;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.roundRect(16, badgeY, pillW, pillH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = activePowerPill.color;
        ctx.fillText(activePowerPill.label, 16 + padX, badgeY + pillH * 0.5 + 0.5);
        ctx.restore();
        badgeY += pillH + 6;
      }

      if (this.player.hasSmoothie()) {
        ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(16, badgeY, 210, 24, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(`🥤 BATIDO TURBO: ${this.player.smoothieTimer.toFixed(1)}s`, 25, badgeY + 16);
        badgeY += 30;
      }

      if (this.hasWind && this.windActive && this.state === 'playing') {
        ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(16, badgeY, 225, 26, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bae6fd';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('🌬️ VIENTO COSTERO ◀◀', 26, badgeY + 17);
      }

      if (this.ghostMode) {
        ctx.save();
        const bx = LOGICAL_W - 172;
        const by = 62;
        ctx.fillStyle = 'rgba(8, 28, 44, 0.88)';
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(bx, by, 156, 24, 8);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#a5f3fc';
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('👻 MODO FANTASMA', bx + 78, by + 16);
        ctx.restore();
      }

      if (this.ghostToastTimer > 0 && this.ghostToastText) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.ghostToastTimer * 1.6);
        const toastY = this.levelBannerTimer > 0 ? 110 : 62;
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.strokeStyle = this.ghostToastColor || '#67e8f9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(LOGICAL_W * 0.5 - 150, toastY, 300, 30, 10);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = this.ghostToastColor || '#67e8f9';
        ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(this.ghostToastText, LOGICAL_W * 0.5, toastY + 19);
        ctx.restore();
      }

      ctx.restore();
    }

    // ========================================================================
    // MENÚ PRINCIPAL Y MODALES HD (64/128-Bit)
    // ========================================================================
    renderMenu(ctx) {
      this.bgRenderer.draw(
        ctx,
        'barceloneta',
        this.globalAnimTime * 42,
        LOGICAL_W,
        LOGICAL_H,
        this.globalAnimTime
      );

      ctx.fillStyle = 'rgba(9, 13, 22, 0.62)';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      ctx.save();
      ctx.textAlign = 'center';

      ctx.fillStyle = '#090d16';
      ctx.font = '900 38px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('AVENTURAS POR EL MUNDO', LOGICAL_W * 0.5 + 3, 49);
      const titleGrad = ctx.createLinearGradient(0, 14, 0, 54);
      titleGrad.addColorStop(0, '#fef08a');
      titleGrad.addColorStop(0.5, '#fbbf24');
      titleGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = titleGrad;
      ctx.fillText('AVENTURAS POR EL MUNDO', LOGICAL_W * 0.5, 46);

      // Etiqueta de versión discreta en la esquina superior derecha
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(LOGICAL_W - 74, 14, 58, 24, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(GAME_VERSION, LOGICAL_W - 45, 30);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        'NICO, ANDREA Y LA TINA • VIAJE POR ESPAÑA Y EL MUNDO',
        LOGICAL_W * 0.5,
        68
      );

      // Botón compacto de Tabla de Récords Arcade (Top 5)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.62)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(310, 78, 340, 24, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        `🏆 TABLA DE RÉCORDS (TOP 5) · MEJOR: ${this.highScore} PTS`,
        LOGICAL_W * 0.5,
        94
      );

      // Dos tarjetas limpias de selección de líder
      const kMenuSkill = this.getControlKeyBadge('skill', true, 'C');
      const kMenuTina = this.getControlKeyBadge('tina', true, 'X');
      this.drawCharacterCard(
        ctx,
        175,
        110,
        265,
        154,
        'nico',
        'LÍDER: NICO',
        kMenuSkill === 'C' ? 'Terremoto (Tecla C)' : `Terremoto (Tecla ${kMenuSkill})`,
        'Aturde 3s y derrota Erizos',
        this.selectedCharacter === 'nico'
      );

      this.drawCharacterCard(
        ctx,
        520,
        110,
        265,
        154,
        'andrea',
        'LÍDER: ANDREA',
        kMenuSkill === 'C' ? 'Pose Hipnótica (Tecla C)' : `Pose Hipnótica (Tecla ${kMenuSkill})`,
        'Hipnotiza con ♥ durante 3s',
        this.selectedCharacter === 'andrea'
      );

      // Contenedor horizontal de La Tina por debajo de ambas tarjetas
      const tinaBoxX = 175;
      const tinaBoxY = 272;
      const tinaBoxW = 610;
      const tinaBoxH = 54;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.62)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tinaBoxX, tinaBoxY, tinaBoxW, tinaBoxH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(202, 283);
      ctx.scale(1.06, 1.06);
      this.sprites.drawTinaHD(
        ctx,
        0,
        0,
        'right',
        true,
        true,
        this.globalAnimTime,
        Math.sin(this.globalAnimTime * 3) > 0.7 ? 1 : 0,
        false
      );
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        kMenuTina === 'X'
          ? '🐾 LA TINA [X]  •  COMPAÑERA FIEL Y LADRIDO SÓNICO'
          : `🐾 LA TINA [${kMenuTina}]  •  COMPAÑERA FIEL Y LADRIDO SÓNICO`,
        272,
        294
      );
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        '¡Guau, guau! Espanta bandadas de aves y salta a recoger ítems cercanos',
        272,
        314
      );

      ctx.textAlign = 'center';
      const options = [
        '▶ JUGAR / PARTIDAS GUARDADAS',
        `LÍDER ACTIVO: ${this.selectedCharacter.toUpperCase()} (◄ ►)`,
        '❓ AYUDA / CONTROLES',
        '🏆 TABLA DE RÉCORDS (TOP 5)',
        '🗺 MAPA GENERAL (ESPAÑA Y EL MUNDO)',
        '⚙ CONFIGURACIÓN (AUDIO Y JUKEBOX)'
      ];

      for (let i = 0; i < options.length; i++) {
        const by = 336 + i * 32;
        const active = this.menuCursor === i;
        ctx.fillStyle = active ? '#ef4444' : 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = active ? '#fde047' : '#475569';
        ctx.lineWidth = active ? 2.8 : 1.8;
        ctx.beginPath();
        ctx.roundRect(LOGICAL_W * 0.5 - 190, by, 380, 28, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = active ? '#ffffff' : '#cbd5e1';
        ctx.font = 'bold 12.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(options[i], LOGICAL_W * 0.5, by + 18.5);
      }

      ctx.restore();
    }

    drawCharacterCard(ctx, x, y, w, h, charType, title, subtitle, skillDesc, selected) {
      ctx.save();
      ctx.fillStyle = selected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.78)';
      ctx.strokeStyle = selected ? '#fbbf24' : '#334155';
      ctx.lineWidth = selected ? 3.5 : 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 14);
      ctx.fill();
      ctx.stroke();

      let demoAnimState = 'idle';
      let demoOffsetY = 0;
      if (selected) {
        const tDemo = Number.isFinite(this.menuDemoTimer) ? this.menuDemoTimer : 0;
        if (tDemo < 3.0) {
          demoAnimState = 'run';
        } else if (charType === 'nico') {
          if (tDemo < 3.14) {
            const p = (tDemo - 3.0) / 0.14;
            demoAnimState = 'jump';
            demoOffsetY = -Math.sin(p * Math.PI) * 14;
          } else {
            demoAnimState = 'groundPound';
            demoOffsetY = Math.exp(-(tDemo - 3.14) * 10) * 2.5;
          }
        } else {
          demoAnimState = 'pose';
          const p = Math.min(1, (tDemo - 3.0) / 0.35);
          demoOffsetY = -Math.sin(p * Math.PI) * 3.5;
        }
        if (this.menuDemoParticles) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 12);
          ctx.clip();
          this.menuDemoParticles.draw(ctx, 0);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(x + w * 0.5 - 15, y + 10 + demoOffsetY);
      ctx.scale(1.18, 1.18);
      this.sprites.drawCharacterHD(
        ctx,
        charType,
        0,
        0,
        'right',
        demoAnimState,
        this.globalAnimTime,
        selected,
        0
      );
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillStyle = selected ? '#fbbf24' : '#e2e8f0';
      ctx.font = 'bold 14.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(title, x + w * 0.5, y + 84);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(subtitle, x + w * 0.5, y + 104);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(skillDesc, x + w * 0.5, y + 122);

      if (selected) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('★ LÍDER SELECCIONADO ★', x + w * 0.5, y + 142);
      }
      ctx.restore();
    }

    renderSaveSlotsModal(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 16, 0.8)';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Marco principal del selector limpio de partidas guardadas
      const panelGrad = ctx.createLinearGradient(0, 38, 0, 502);
      panelGrad.addColorStop(0, '#0f172a');
      panelGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = panelGrad;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(110, 38, 740, 464, 18);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('PARTIDAS GUARDADAS', LOGICAL_W * 0.5, 78);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        '3 Ranuras Independientes  •  ◀ / ▶: Elegir [BORRAR]  •  ENTER / ESPACIO: Confirmar  •  SUPR: Borrar  •  ESC: Volver',
        LOGICAL_W * 0.5,
        102
      );

      for (let i = 0; i < 3; i++) {
        const slotId = i + 1;
        const cardY = 126 + i * 96;
        const isSelected = this.slotCursor === i && this.deleteConfirmSlot === null;
        const summary = global.SaveSlots ? global.SaveSlots.getSummary(slotId) : null;
        const deleteFocused = Boolean(isSelected && this.slotDeleteFocus && summary);
        const cardFocused = Boolean(isSelected && !deleteFocused);
        const mainW = summary ? 562 : 676;

        // Tarjeta de ranura
        ctx.fillStyle = cardFocused
          ? 'rgba(30, 58, 138, 0.92)'
          : isSelected
            ? 'rgba(30, 41, 59, 0.92)'
            : 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = cardFocused ? '#fde047' : isSelected ? '#60a5fa' : summary ? '#38bdf8' : '#475569';
        ctx.lineWidth = cardFocused ? 3.2 : 2;
        ctx.beginPath();
        ctx.roundRect(142, cardY, mainW, 82, 12);
        ctx.fill();
        ctx.stroke();

        // Emblema izquierdo de disquete / estrella SMW
        ctx.fillStyle = summary ? '#fbbf24' : '#334155';
        ctx.beginPath();
        ctx.roundRect(160, cardY + 17, 48, 48, 10);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = summary ? '#0f172a' : '#94a3b8';
        ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(summary ? `${slotId}` : '+', 184, cardY + 49);

        ctx.textAlign = 'left';
        ctx.fillStyle = cardFocused ? '#fef08a' : '#f8fafc';
        ctx.font = '900 17px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(`PARTIDA ${slotId}`, 224, cardY + 34);

        if (summary) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(
            `${summary.cityName} • ${summary.totalScore.toLocaleString('es-ES')} pts`,
            224,
            cardY + 58
          );

          ctx.textAlign = 'right';
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(
            `🪙 ${summary.totalCoins}  •  🗺 ${summary.unlockedCount} ciudad${summary.unlockedCount === 1 ? '' : 'es'}`,
            688,
            cardY + 46
          );

          // Botón BORRAR junto a tarjetas existentes
          ctx.fillStyle = deleteFocused ? '#ef4444' : isSelected ? '#b91c1c' : '#7f1d1d';
          ctx.strokeStyle = deleteFocused ? '#fde047' : '#fca5a5';
          ctx.lineWidth = deleteFocused ? 3.2 : 2;
          ctx.beginPath();
          ctx.roundRect(716, cardY, 102, 82, 12);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = deleteFocused ? '#fef08a' : '#ffffff';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('🗑', 767, cardY + 34);
          ctx.font = '900 12px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(deleteFocused ? '▶ BORRAR' : 'BORRAR', 767, cardY + 58);
        } else {
          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('VACÍO - NUEVA PARTIDA', 224, cardY + 58);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('Empieza en Barcelona 1 ▶', 798, cardY + 46);
        }
      }

      // Botón Volver al Menú
      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(340, 426, 280, 40, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('← VOLVER AL MENÚ (ESC)', 480, 451);

      // Submodal de confirmación de borrado
      if (this.deleteConfirmSlot !== null) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
        ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(225, 165, 510, 200, 16);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f87171';
        ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          `¿Borrar progreso de la Partida ${this.deleteConfirmSlot}?`,
          LOGICAL_W * 0.5,
          214
        );

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          'Esta acción eliminará ciudades desbloqueadas, puntos y monedas de esta ranura.',
          LOGICAL_W * 0.5,
          246
        );

        // Botón SÍ, BORRAR (cursor === 0)
        const yesActive = this.deleteConfirmCursor === 0;
        ctx.fillStyle = yesActive ? '#dc2626' : '#7f1d1d';
        ctx.strokeStyle = yesActive ? '#fde047' : '#f87171';
        ctx.lineWidth = yesActive ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(265, 292, 197, 48, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('SÍ, BORRAR', 363.5, 321);

        // Botón CANCELAR (cursor === 1)
        const noActive = this.deleteConfirmCursor === 1;
        ctx.fillStyle = noActive ? '#2563eb' : '#1e293b';
        ctx.strokeStyle = noActive ? '#fde047' : '#64748b';
        ctx.lineWidth = noActive ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(498, 292, 197, 48, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CANCELAR', 596.5, 321);
      }

      ctx.restore();
    }

    renderControlsModal(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 16, 0.8)';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      const panelGrad = ctx.createLinearGradient(0, 26, 0, 514);
      panelGrad.addColorStop(0, '#0f172a');
      panelGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = panelGrad;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(64, 26, 832, 488, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('❓ AYUDA Y CONTROLES DEL EQUIPO', LOGICAL_W * 0.5, 60);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        'Guía rápida de teclado (o botones táctiles en móvil) y poderes especiales',
        LOGICAL_W * 0.5,
        80
      );

      // Sección A: Controles Básicos en dos columnas visuales con badges de teclas (esquema activo)
      const kCtrlLeft = this.getControlKeyBadge('left', true, '⬅');
      const kCtrlRight = this.getControlKeyBadge('right', true, '➡');
      const kCtrlUp = this.getControlKeyBadge('up', true, '⬆');
      const kCtrlDown = this.getControlKeyBadge('down', true, '⬇');
      const kCtrlJump = this.getControlKeyBadge('jump', true, 'ESPACIO');
      const kCtrlShoot = this.getControlKeyBadge('shoot', true, 'Z');
      const kCtrlTina = this.getControlKeyBadge('tina', true, 'X');
      const kCtrlSkill = this.getControlKeyBadge('skill', true, 'C');
      const kCtrlReserve = this.getControlKeyBadge('reserve', true, 'SHIFT');
      const ctrlMoveCombo =
        kCtrlLeft === '◀' && kCtrlRight === '▶' && kCtrlUp === '↑' && kCtrlDown === '↓'
          ? `⬅ ➡ ⬇ / ⬆ ${kCtrlJump}`
          : `${kCtrlLeft}${kCtrlRight}${kCtrlDown}${kCtrlUp} · ${kCtrlJump}`;
      const keyItems = [
        [ctrlMoveCombo, `Mover, agachar y Saltar (${kCtrlDown}+${kCtrlJump} baja vigas)`],
        [kCtrlShoot, `Disparar Planta (${kCtrlUp}+${kCtrlShoot} / ${kCtrlDown}+${kCtrlShoot} diagonal)`],
        [kCtrlTina, 'Ladrido Sónico de La Tina'],
        [kCtrlSkill, 'Habilidad Especial del Líder activo'],
        [kCtrlReserve, 'Soltar / intercambiar Ítem en Reserva'],
        ['ESC  ·  M', 'Pausa / Salir  ·  Mute Global']
      ];
      for (let i = 0; i < keyItems.length; i++) {
        const col = i < 3 ? 0 : 1;
        const row = i % 3;
        const kx = col === 0 ? 88 : 490;
        const ky = 98 + row * 48;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(kx, ky, 382, 40, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(kx + 8, ky + 7, 120, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10.5px "Consolas", monospace';
        ctx.fillText(keyItems[i][0], kx + 68, ky + 24);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '11.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(keyItems[i][1], kx + 135, ky + 24);
      }

      // Sección B: 3 Tarjetas de Habilidades con íconos y sprites
      ctx.textAlign = 'left';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('✨ HABILIDADES ESPECIALES DEL EQUIPO', 88, 262);

      const abilities = [
        {
          x: 88,
          title: `💥 Terremoto de Nico [${kCtrlSkill}]`,
          line1: 'Salta e impacta fuerte',
          line2: 'el suelo: aturde enemigos',
          line3: '3s y derrota Erizos.',
          color: '#fbbf24',
          kind: 'nico'
        },
        {
          x: 350,
          title: `💖 Pose de Andrea [${kCtrlSkill}]`,
          line1: 'Despliega una onda con',
          line2: 'corazones que hipnotiza',
          line3: 'enemigos por 3 segundos.',
          color: '#f472b6',
          kind: 'andrea'
        },
        {
          x: 612,
          title: `🐾 Ladrido de Tina [${kCtrlTina}]`,
          line1: 'Doble ladrido sónico que',
          line2: 'espanta aves y enemigos.',
          line3: 'Salta doble por ítems.',
          color: '#4ade80',
          kind: 'tina'
        }
      ];

      abilities.forEach((ab) => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = ab.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(ab.x, 274, 250, 178, 12);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        if (ab.kind === 'tina') {
          ctx.translate(ab.x + 104, 290);
          ctx.scale(1.12, 1.12);
          this.sprites.drawTinaHD(ctx, 0, 0, 'right', true, true, this.globalAnimTime, 1, false);
        } else {
          ctx.translate(ab.x + 108, 280);
          ctx.scale(1.05, 1.05);
          this.sprites.drawCharacterHD(
            ctx,
            ab.kind,
            0,
            0,
            'right',
            ab.kind === 'andrea' ? 'pose' : 'idle',
            this.globalAnimTime,
            true,
            0
          );
        }
        ctx.restore();

        ctx.textAlign = 'center';
        ctx.fillStyle = ab.color;
        ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(ab.title, ab.x + 125, 366);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(ab.line1, ab.x + 125, 392);
        ctx.fillText(ab.line2, ab.x + 125, 412);
        ctx.fillText(ab.line3, ab.x + 125, 432);
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        'Presioná ENTER, ESPACIO, ESC o hacé clic para volver al menú',
        LOGICAL_W * 0.5,
        488
      );
      ctx.restore();
    }

    renderLeaderboardRows(ctx, highlightId = null, startY = 128, rowH = 31) {
      const board = Array.isArray(this.arcadeLeaderboard) ? this.arcadeLeaderboard : [];
      const tableX = 160;
      const tableW = 640;

      // Cabecera de columnas
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.beginPath();
      ctx.roundRect(tableX, startY - 28, tableW, 24, 6);
      ctx.fill();

      ctx.font = 'bold 11.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('POS', tableX + 18, startY - 12);
      ctx.fillText('INICIALES', tableX + 112, startY - 12);
      ctx.fillText('LÍDER', tableX + 305, startY - 12);
      ctx.textAlign = 'right';
      ctx.fillText('PUNTAJE', tableX + tableW - 20, startY - 12);

      if (board.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          'Aún no hay puntajes registrados. ¡Completá una partida o registrá tus iniciales en Game Over!',
          LOGICAL_W * 0.5,
          startY + rowH * 2.5
        );
        return;
      }

      for (let i = 0; i < board.length && i < ARCADE_TOP_LIMIT; i++) {
        const entry = board[i];
        const ry = startY + i * rowH;
        const isHighlighted = highlightId && entry.id === highlightId;
        ctx.fillStyle = isHighlighted
          ? 'rgba(234, 179, 8, 0.25)'
          : i % 2 === 0
          ? 'rgba(15, 23, 42, 0.78)'
          : 'rgba(15, 23, 42, 0.52)';
        if (isHighlighted) {
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(tableX, ry, tableW, rowH - 3, 6);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.roundRect(tableX, ry, tableW, rowH - 3, 6);
          ctx.fill();
        }

        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        ctx.textAlign = 'left';
        ctx.fillStyle = i < 3 ? '#fde047' : '#cbd5e1';
        ctx.font = 'bold 13px "Consolas", monospace';
        ctx.fillText(medal, tableX + 18, ry + rowH - 10);

        ctx.fillStyle = isHighlighted ? '#fef08a' : '#ffffff';
        ctx.font = '900 14px "Consolas", monospace';
        ctx.fillText(entry.initials, tableX + 118, ry + rowH - 10);

        ctx.fillStyle = entry.leader === 'andrea' ? '#f9a8d4' : '#7dd3fc';
        ctx.font = 'bold 12.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(entry.leader === 'andrea' ? 'ANDREA' : 'NICO', tableX + 305, ry + rowH - 10);

        ctx.textAlign = 'right';
        ctx.fillStyle = i === 0 ? '#4ade80' : '#f8fafc';
        ctx.font = 'bold 13.5px "Consolas", monospace';
        ctx.fillText(`${entry.score.toLocaleString('es-ES')} PTS`, tableX + tableW - 20, ry + rowH - 10);
      }
    }

    renderLeaderboardModal(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 16, 0.84)';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      const panelGrad = ctx.createLinearGradient(0, 26, 0, 514);
      panelGrad.addColorStop(0, '#0f172a');
      panelGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = panelGrad;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.roundRect(120, 26, 720, 488, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('🏆 TABLA DE RÉCORDS (TOP 5)', LOGICAL_W * 0.5, 64);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Los 5 mejores puntajes arcade guardados en este navegador', LOGICAL_W * 0.5, 86);

      this.renderLeaderboardRows(ctx, this.savedArcadeEntryId, 148, 48);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        'Presioná ENTER, ESPACIO, ESC o hacé clic para volver al menú',
        LOGICAL_W * 0.5,
        490
      );
      ctx.restore();
    }

    renderPauseModal(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(9, 13, 22, 0.84)';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(LOGICAL_W * 0.5 - 190, 132, 380, 294, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('JUEGO EN PAUSA', LOGICAL_W * 0.5, 184);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('[P / ENTER / ESPACIO / ESC] Continuar', LOGICAL_W * 0.5, 245);
      ctx.fillText('[R] Reiniciar nivel actual', LOGICAL_W * 0.5, 292);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('[V] Volver al Mapa de Zonas', LOGICAL_W * 0.5, 339);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('[BACKSPACE / Q] Salir al menú inicial', LOGICAL_W * 0.5, 386);
      ctx.restore();
    }

    /** Insignia destacada cuando se supera la zona de punta a punta sin recibir daño. */
    drawPerfectZoneBadge(ctx, cx, y, text = '🌟 ¡ZONA PERFECTA! +1 VIDA') {
      ctx.save();
      const grad = ctx.createLinearGradient(cx - 175, y, cx + 175, y);
      grad.addColorStop(0, 'rgba(20, 83, 45, 0.94)');
      grad.addColorStop(0.5, 'rgba(21, 128, 61, 0.96)');
      grad.addColorStop(1, 'rgba(20, 83, 45, 0.94)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(cx - 175, y, 350, 26, 13);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.font = '900 13.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(text, cx, y + 17.5);
      ctx.restore();
    }

    /**
     * Paso 6 de la Cinemática de Fin de Nivel:
     * Sobre el fondo negro absoluto (#000000) dejado por el Cierre en Iris (Iris Out),
     * aparecen en letras blancas limpias los resultados desglosados del nivel:
     * Puntaje base, Monedas recogidas, Bonus de tiempo y Puntaje Total acumulado.
     */
    renderLevelClearModal(ctx) {
      const nextDest = this.levelData.nextDestination || 'El Gòtic';
      const isBusOrGuagua = this.usesBusOrGuaguaCinematic();
      const isTeideCable = this.isTeideCableCarLevel();
      const isCanarias = this.isCanariasCity();
      ctx.save();

      // Fondo negro absoluto tras el cierre en iris + fuegos artificiales silenciosos/lejanos a los 7s
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      if (this.levelClearParticles) {
        this.levelClearParticles.draw(ctx, 0);
      }

      // Emblema superior: Teleférico Teide, Guagua Canaria, Bus EMT Palma o Rombo Metro
      ctx.save();
      ctx.translate(LOGICAL_W * 0.5, 68);
      if (isTeideCable) {
        ctx.beginPath();
        ctx.roundRect(-44, -18, 88, 36, 8);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#facc15';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TEIDE', 0, 5);
      } else if (isBusOrGuagua) {
        const isRosarioClear = this.isRosarioCity();
        const isCordobaClear = this.isCordobaCity();
        const isUshuaiaClear = this.isUshuaiaCity();
        const isChileBusClear = this.isChileBusCity();
        ctx.beginPath();
        ctx.roundRect(-42, -18, 84, 36, 8);
        ctx.fillStyle = isCanarias
          ? '#eab308'
          : isCordobaClear || isChileBusClear
            ? '#dc2626'
            : isRosarioClear
              ? '#0ea5e9'
              : '#0284c7';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isCanarias
          ? '#0284c7'
          : isCordobaClear
            ? '#facc15'
            : isUshuaiaClear
              ? '#bae6fd'
              : isChileBusClear
                ? '#f8fafc'
                : isRosarioClear
                  ? '#1e3a8a'
                  : '#ffffff';
        ctx.stroke();
        ctx.fillStyle = isCanarias ? '#0f172a' : '#ffffff';
        ctx.font = '900 14px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          isCanarias
            ? 'GUAGUA'
            : isCordobaClear
              ? 'TAMSE'
              : isUshuaiaClear
                ? 'USH'
                : isChileBusClear
                  ? 'RED'
                  : isRosarioClear
                    ? 'MOVI'
                    : 'EMT',
          0,
          5
        );
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(28, 0);
        ctx.lineTo(0, 20);
        ctx.lineTo(-28, 0);
        ctx.closePath();
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('M', 0, 6);
      }
      ctx.restore();

      const isChileMetroCity = this.isChileMetroCity();
      const isChileBusCity = this.isChileBusCity();
      const isChileFinale =
        this.normalizeCityKey(this.cityKey) === 'chile_pascua' &&
        this.levelIndex + 1 >= this.getCityLevels().length;

      ctx.textAlign = 'center';
      ctx.fillStyle = isTeideCable || isChileFinale ? '#fde047' : '#ffffff';
      ctx.font = '900 26px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        isTeideCable
          ? '🏆 ¡ESPAÑA COMPLETADA AL 100%!'
          : isChileFinale
            ? '🏆 ¡CHILE COMPLETADO AL 100%!'
            : `¡${this.levelData.name.toUpperCase()} COMPLETADO!`,
        LOGICAL_W * 0.5,
        124
      );

      const isRosarioCity = this.isRosarioCity();
      const isCordobaCity = this.isCordobaCity();
      const isUshuaiaCity = this.isUshuaiaCity();
      const isUshuaiaFinale = isUshuaiaCity && this.levelIndex + 1 >= this.getCityLevels().length;
      const isBuenosAiresCity = this.normalizeCityKey(this.cityKey) === 'buenosaires';
      const clearAnnouncement =
        isTeideCable
          ? '🚡 Teleférico del Teide: «¡España 100%! Próximo continente: América del Sur»'
          : isCanarias
          ? `🚌 Guagua Canaria: «Próxima parada insular: ${nextDest}»`
          : isChileFinale
          ? '🌋 ¡CHILE COMPLETADO AL 100%! VOLCÁN RANO KAU · RUMBO A VENEZUELA'
          : isChileMetroCity
          ? `🚇 Metro de Santiago: «Próxima estación: ${nextDest}»`
          : isChileBusCity
          ? `🚌 Red / Turibus Chile: «Próxima parada: ${nextDest}»`
          : isUshuaiaFinale
          ? '🏔️ ¡ARGENTINA COMPLETADA AL 100%! FARO LES ÉCLAIREURS · FIN DEL MUNDO'
          : isUshuaiaCity
          ? `🚌 Colectivo Austral Ushuaia: «Próxima parada: ${nextDest}»`
          : isCordobaCity
          ? `🚌 Colectivo Córdoba (TAMSE): «Próxima parada: ${nextDest}»`
          : isRosarioCity
          ? `🚌 Colectivo Rosario (MOVI): «Próxima parada: ${nextDest}»`
          : isBuenosAiresCity
          ? `🟡 Subte Argentino: «Próxima estación: ${nextDest}»`
          : this.cityKey === 'madrid'
          ? `🔊 Megafonía Metro Madrid: «Próxima estación: ${nextDest}»`
          : isBusOrGuagua
          ? `🚌 Autobús EMT Palma: «Cap a ${nextDest}»`
          : `🔊 Megafonia TMB: «Tren amb destinació ${nextDest}»`;
      ctx.fillStyle = isTeideCable || isUshuaiaFinale || isChileFinale ? '#4ade80' : '#e2e8f0';
      ctx.font = 'italic 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(clearAnnouncement, LOGICAL_W * 0.5, 154);

      if (this.cinematicPerfectZone) {
        this.drawPerfectZoneBadge(ctx, LOGICAL_W * 0.5, 166, '🌟 ¡ZONA PERFECTA! +1 VIDA');
      }

      // Tabla de desglose en letras blancas limpias sobre el fondo negro
      const leftX = LOGICAL_W * 0.5 - 210;
      const rightX = LOGICAL_W * 0.5 + 210;

      ctx.font = 'bold 18px "Consolas", "Courier New", monospace';

      const easeOutProg = (t, start, span) => {
        if (this.levelClearTallyDone) return 1;
        const p = Math.max(0, Math.min(1, (t - start) / span));
        return 1 - Math.pow(1 - p, 2);
      };
      const tTally = Number.isFinite(this.levelClearTallyElapsed) ? this.levelClearTallyElapsed : 0;
      const pBase = easeOutProg(tTally, 0.00, 0.24);
      const pCoin = easeOutProg(tTally, 0.22, 0.24);
      const pTime = easeOutProg(tTally, 0.44, 0.28);
      const pPerf = this.cinematicPerfectZone ? easeOutProg(tTally, 0.68, 0.24) : 1;

      const dispBase = Math.round(this.cinematicBaseScore * pBase);
      const dispCoinsCount = Math.round(this.levelCoins * pCoin);
      const dispCoinBonus = Math.round(this.cinematicCoinBonus * pCoin);
      const dispTimeLeft = Math.round(this.cinematicInitialTimeLeft * pTime);
      const dispTimeBonus = Math.round(this.cinematicTimeBonus * pTime);
      const targetPerfBonus = this.cinematicPerfectBonus || 500;
      const dispPerfectBonus = this.cinematicPerfectZone ? Math.round(targetPerfBonus * pPerf) : 0;
      const dispTotalScore = this.levelClearTallyDone
        ? this.score
        : dispBase + dispCoinBonus + dispTimeBonus + dispPerfectBonus;

      const rows = [
        ['PUNTAJE BASE DEL NIVEL', `${dispBase} PTS`],
        [`MONEDAS RECOGIDAS (${dispCoinsCount})`, `+${dispCoinBonus} PTS`],
        [`BONUS DE TIEMPO (${dispTimeLeft}s × 50)`, `+${dispTimeBonus} PTS`]
      ];
      if (this.cinematicPerfectZone) {
        rows.push(['🌟 ZONA PERFECTA (SIN DAÑO)', `+${dispPerfectBonus} PTS`]);
      }

      const rowStartY = this.cinematicPerfectZone ? 222 : 212;
      const rowStep = this.cinematicPerfectZone ? 34 : 42;
      const dividerY = this.cinematicPerfectZone ? 342 : 326;
      const totalY = this.cinematicPerfectZone ? 378 : 364;

      rows.forEach((r, idx) => {
        const ry = rowStartY + idx * rowStep;
        ctx.fillStyle = idx === 3 ? '#fde047' : '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(r[0], leftX, ry);
        ctx.textAlign = 'right';
        ctx.fillText(r[1], rightX, ry);
      });

      // Línea divisoria blanca limpia
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX, dividerY);
      ctx.lineTo(rightX, dividerY);
      ctx.stroke();

      // Puntaje Total Acumulado
      ctx.font = '900 22px "Consolas", "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText('PUNTAJE TOTAL ACUMULADO', leftX, totalY);
      ctx.textAlign = 'right';
      ctx.fillText(`${dispTotalScore} PTS`, rightX, totalY);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        isTeideCable
          ? '¡Has completado todos los niveles de España! Se ha desbloqueado el salto intercontinental.'
          : isCanarias
          ? '¡Equipo conservado! Tu Power-Up activo y la Reserva [SHIFT] siguen contigo en la Guagua.'
          : isBusOrGuagua
          ? '¡Equipo conservado! Tu Power-Up activo y la Caja de Reserva [SHIFT] viajan contigo en el bus.'
          : '¡Equipo conservado! Tu Power-Up activo y la Caja de Reserva [SHIFT] siguen contigo en el metro.',
        LOGICAL_W * 0.5,
        418
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
      const isLastOfCity = this.levelIndex + 1 >= this.getCityLevels().length;
      ctx.fillText(
        isTeideCable
          ? 'Presioná ENTER / ESPACIO o hacé clic para viajar a Sudamérica 🌎 ▶'
          : isLastOfCity
          ? 'Presioná ENTER / ESPACIO o hacé clic para volver al Mapa 🗺 ▶'
          : 'Presioná ENTER / ESPACIO o hacé clic para volver al Submapa 🗺 ▶',
        LOGICAL_W * 0.5,
        468
      );
      ctx.restore();
    }

    renderGameOverModal(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 16, 0.9)';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      if (this.gameOverPhase === 'initials') {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(170, 56, 620, 428, 18);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 34px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('GAME OVER', LOGICAL_W * 0.5, 108);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          `Puntaje Final: ${(Number.isFinite(this.gameOverScore) ? this.gameOverScore : this.score).toLocaleString('es-ES')} PTS  ·  Líder: ${this.selectedCharacter.toUpperCase()}`,
          LOGICAL_W * 0.5,
          144
        );

        ctx.fillStyle = this.arcadeQualifies ? '#4ade80' : '#fde047';
        ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          this.arcadeQualifies
            ? '🏆 ¡ENTRASTE AL TOP 5 ARCADE! INGRESÁ TUS 3 INICIALES'
            : 'INGRESÁ TUS 3 INICIALES ARCADE',
          LOGICAL_W * 0.5,
          178
        );

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          'Escribí con teclado (A-Z) o usá ▲/▼ para cambiar letra y ◄/► para moverte',
          LOGICAL_W * 0.5,
          204
        );

        // 3 cajas Arcade A-Z (bx = 362 + i * 86)
        for (let i = 0; i < 3; i++) {
          const bx = 362 + i * 86;
          const active = this.arcadeLetterIdx === i;

          ctx.fillStyle = active ? '#fde047' : '#64748b';
          ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('▲', bx + 32, 250);

          ctx.fillStyle = active ? 'rgba(30, 58, 138, 0.95)' : 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = active ? '#fde047' : '#475569';
          ctx.lineWidth = active ? 3.5 : 2;
          ctx.beginPath();
          ctx.roundRect(bx, 262, 64, 70, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = active ? '#fef08a' : '#f8fafc';
          ctx.font = '900 36px "Consolas", monospace';
          ctx.fillText(this.arcadeInitials[i] || 'A', bx + 32, 310);

          ctx.fillStyle = active ? '#fde047' : '#64748b';
          ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
          ctx.fillText('▼', bx + 32, 354);
        }

        // Botones Confirmar Iniciales y Reintentar Nivel [R]
        ctx.fillStyle = '#16a34a';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(204, 382, 266, 42, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(486, 382, 270, 42, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('✔ GUARDAR INICIALES [ENTER]', 204 + 133, 408);
        ctx.fillText('🔄 REINTENTAR NIVEL [R]', 486 + 135, 408);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('[R] Reintentar Nivel · [ESC] Saltar al Menú Principal', LOGICAL_W * 0.5, 456);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(120, 26, 720, 482, 18);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = this.arcadeQualifies ? '#fbbf24' : '#f87171';
        ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          this.arcadeQualifies
            ? '🏆 TABLA DE RÉCORDS (TOP 5) ACTUALIZADA'
            : 'GAME OVER · 🏆 TABLA DE RÉCORDS (TOP 5)',
          LOGICAL_W * 0.5,
          62
        );

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 12.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          `Puntaje Final: ${(Number.isFinite(this.gameOverScore) ? this.gameOverScore : this.score).toLocaleString('es-ES')} PTS  ·  Líder: ${this.selectedCharacter.toUpperCase()}`,
          LOGICAL_W * 0.5,
          86
        );

        this.renderLeaderboardRows(ctx, this.savedArcadeEntryId, 134, 44);

        const actionBtns = [
          { x: 144, w: 230, label: '🗺 Volver al Mapa de Zonas [ENTER]', fill: '#15803d', stroke: '#4ade80' },
          { x: 386, w: 224, label: '🔄 REINTENTAR NIVEL [R]', fill: '#b45309', stroke: '#fde047' },
          { x: 622, w: 194, label: '🏠 Menú Principal [ESC]', fill: '#334155', stroke: '#94a3b8' }
        ];
        actionBtns.forEach((b) => {
          ctx.fillStyle = b.fill;
          ctx.strokeStyle = b.stroke;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(b.x, 438, b.w, 38, 9);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(b.label, b.x + b.w * 0.5, 462);
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11.5px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(
          'Hacé clic izquierdo en cualquier parte de la pantalla o presioná ENTER / ESC para salir',
          LOGICAL_W * 0.5,
          496
        );
      }

      ctx.restore();
    }

    renderVictoryScreen(ctx) {
      this.bgRenderer.draw(
        ctx,
        'sagrada',
        this.globalAnimTime * 15,
        LOGICAL_W,
        LOGICAL_H,
        this.globalAnimTime
      );
      this.particles.draw(ctx, 0);

      ctx.save();
      ctx.fillStyle = 'rgba(9, 13, 22, 0.78)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(LOGICAL_W * 0.5 - 270, 68, 540, 400, 18);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 28px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('¡FELICITACIONES BARCELONA!', LOGICAL_W * 0.5, 114);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        '¡Nico, Andrea y la Tina conquistaron los 4 niveles en HD!',
        LOGICAL_W * 0.5,
        144
      );

      ctx.save();
      ctx.translate(LOGICAL_W * 0.5 - 95, 165);
      ctx.scale(1.3, 1.3);
      this.sprites.drawCharacterHD(ctx, 'nico', 0, 0, 'right', 'jump', this.globalAnimTime, true, 0);
      this.sprites.drawCharacterHD(ctx, 'andrea', 55, 0, 'left', 'pose', this.globalAnimTime, true, 0);
      this.sprites.drawTinaHD(
        ctx,
        105,
        16,
        'left',
        true,
        true,
        this.globalAnimTime,
        1.0,
        false
      );
      ctx.restore();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`PUNTAJE FINAL: ${this.score} PTS`, LOGICAL_W * 0.5, 275);
      ctx.fillText(`MONEDAS RECOLECTADAS: ${this.totalCoins}`, LOGICAL_W * 0.5, 303);
      ctx.fillText(`TIEMPO TOTAL: ${Math.floor(this.totalTime)}s`, LOGICAL_W * 0.5, 331);

      ctx.fillStyle = '#f472b6';
      ctx.fillText(`MEJOR RÉCORD: ${this.highScore} PTS`, LOGICAL_W * 0.5, 361);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        'ENTER / ESPACIO / R: Rejugar  •  ESC / BACKSPACE / Q: Menú',
        LOGICAL_W * 0.5,
        420
      );
      ctx.restore();
    }
  }

  function bootstrapBarcelonaGame() {
    if (window.__barcelonaGame) return;
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      window.__barcelonaGame = new BarcelonaGame(canvas);
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrapBarcelonaGame);
  } else {
    bootstrapBarcelonaGame();
  }
})(window);
