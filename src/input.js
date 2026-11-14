/**
 * ============================================================================
 * AVENTURAS POR EL MUNDO HD - Sistema de Controles (Teclado, Táctil y Puntero)
 * ============================================================================
 * Esquema dual de teclado para escritorio (en paralelo):
 * - Movimiento / Salto:
 *     * ArrowLeft / ArrowRight : Moverse
 *     * ArrowUp / Space        : Saltar (Jump); ArrowUp también apunta arriba al disparar
 *     * ArrowDown              : Agacharse (en vigas one-way: ↓ + Espacio para bajar) / Apuntar abajo en aire
 * - Acciones Estándar Arcade 2D (y atajo paralelo WASD):
 *     * Shift / (W) : Soltar o intercambiar Power-Up (Caja de Reserva)
 *     * C     / (A) : Habilidad Especial del Líder (Terremoto de Nico / Pose Hipnótica de Andrea)
 *     * X     / (S) : Ladrido Sónico de La Tina (Onda sónica / disolver bandadas)
 *     * Z     / (D) : Disparar Planta / Proyectil Botánico
 * ============================================================================
 */
(function (global) {
  'use strict';

  const LOGICAL_W = 960;
  const LOGICAL_H = 540;
  const CONTROL_STORAGE_KEY = 'aventura_control_scheme';

  const MAPPABLE_ACTIONS = [
    { key: 'up', label: 'Arriba' },
    { key: 'down', label: 'Abajo' },
    { key: 'left', label: 'Izquierda' },
    { key: 'right', label: 'Derecha' },
    { key: 'jump', label: 'Saltar' },
    { key: 'shoot', label: 'Planta (Disparo)' },
    { key: 'tina', label: 'La Tina' },
    { key: 'skill', label: 'Habilidad Especial' },
    { key: 'reserve', label: 'Intercambio Reserva' }
  ];

  const CONTROL_PRESETS = {
    preset_a: {
      profile: 'preset_a',
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
      jump: 'Space',
      shoot: 'KeyZ',
      tina: 'KeyX',
      skill: 'KeyC',
      reserve: 'ShiftLeft'
    },
    preset_b: {
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
    }
  };

  function clonePreset(presetId) {
    const src = presetId === 'preset_b' ? CONTROL_PRESETS.preset_b : CONTROL_PRESETS.preset_a;
    return Object.assign({}, src);
  }

  function formatKeyCode(code, compact = false) {
    if (!code) return compact ? '—' : 'Sin asignar';
    if (code === 'ArrowUp') return compact ? '↑' : 'Flecha Arriba (↑)';
    if (code === 'ArrowDown') return compact ? '↓' : 'Flecha Abajo (↓)';
    if (code === 'ArrowLeft') return compact ? '←' : 'Flecha Izquierda (←)';
    if (code === 'ArrowRight') return compact ? '→' : 'Flecha Derecha (→)';
    if (code === 'Space') return compact ? 'ESPACIO' : 'Espacio (Space)';
    if (code === 'ShiftLeft') return compact ? 'SHIFT' : 'ShiftLeft';
    if (code === 'ShiftRight') return compact ? 'R-SHIFT' : 'ShiftRight';
    if (code === 'ControlLeft' || code === 'ControlRight') return compact ? 'CTRL' : code;
    if (code === 'AltLeft' || code === 'AltRight') return compact ? 'ALT' : code;
    if (code.indexOf('Key') === 0 && code.length === 4) {
      return code.slice(3).toUpperCase();
    }
    if (code.indexOf('Digit') === 0 && code.length === 6) {
      return code.slice(5);
    }
    if (code.indexOf('Numpad') === 0) {
      return 'NUM ' + code.slice(6);
    }
    return code;
  }

  class InputManager {
    constructor(game) {
      this.game = game;
      InputManager.activeInstance = this;
      this.heldCodes = new Set();
      this.touchState = {
        left: false,
        right: false,
        up: false,
        down: false,
        jumpHeld: false
      };
      this.controlScheme = this.loadControlScheme();
      this.heldJumpKeys = {
        ArrowUp: false,
        Space: false
      };
      this.state = {
        left: false,
        right: false,
        up: false,
        down: false,
        analogX: 0,
        analogY: 0,
        analogAngle: 0,
        downPressed: false,
        jumpPressed: false,
        jumpHeld: false,
        jump: false,
        skillPressed: false,
        tinaPressed: false,
        shootPressed: false,
        reservePressed: false
      };
    }

    loadControlScheme() {
      const base = clonePreset('preset_a');
      try {
        const raw = localStorage.getItem(CONTROL_STORAGE_KEY);
        if (!raw) return base;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return base;
        const prof = parsed.profile === 'preset_b' || parsed.profile === 'custom' ? parsed.profile : 'preset_a';
        if (prof === 'preset_b') {
          const pb = clonePreset('preset_b');
          if (parsed.shoot !== pb.shoot || parsed.skill !== pb.skill || parsed.tina !== pb.tina) {
            try {
              localStorage.setItem(CONTROL_STORAGE_KEY, JSON.stringify(pb));
            } catch (e) {}
          }
          return pb;
        }
        if (prof === 'preset_a') return clonePreset('preset_a');

        const custom = clonePreset('preset_a');
        custom.profile = 'custom';
        const used = new Set();
        for (let i = 0; i < MAPPABLE_ACTIONS.length; i++) {
          const k = MAPPABLE_ACTIONS[i].key;
          const val = parsed[k];
          if (val === null) {
            custom[k] = null;
          } else if (typeof val === 'string' && val.trim()) {
            const norm = val === ' ' ? 'Space' : val.trim();
            if (!used.has(norm)) {
              custom[k] = norm;
              used.add(norm);
            } else {
              custom[k] = null;
            }
          }
        }
        return custom;
      } catch (e) {
        return base;
      }
    }

    saveControlScheme() {
      try {
        localStorage.setItem(CONTROL_STORAGE_KEY, JSON.stringify(this.controlScheme));
      } catch (e) {}
    }

    getControlScheme() {
      return this.controlScheme;
    }

    getControlActions() {
      return MAPPABLE_ACTIONS.slice();
    }

    getControlPresets() {
      return {
        preset_a: clonePreset('preset_a'),
        preset_b: clonePreset('preset_b')
      };
    }

    applyPreset(presetId) {
      if (presetId === 'custom') {
        this.controlScheme.profile = 'custom';
      } else {
        this.controlScheme = clonePreset(presetId);
      }
      this.saveControlScheme();
      this.syncGameplayInputFromHeld();
      return this.controlScheme;
    }

    rebindAction(actionKey, rawCode) {
      const valid = MAPPABLE_ACTIONS.some((a) => a.key === actionKey);
      if (!valid) return { ok: false, canceled: false };
      const code = rawCode === ' ' ? 'Space' : String(rawCode || '').trim();
      if (!code || code === 'Escape') {
        return { ok: false, canceled: true };
      }
      let clearedAction = null;
      for (let i = 0; i < MAPPABLE_ACTIONS.length; i++) {
        const item = MAPPABLE_ACTIONS[i];
        if (item.key !== actionKey && this.controlScheme[item.key] === code) {
          this.controlScheme[item.key] = null;
          clearedAction = item;
        }
      }
      this.controlScheme[actionKey] = code;
      this.controlScheme.profile = 'custom';
      this.saveControlScheme();
      this.syncGameplayInputFromHeld();
      return {
        ok: true,
        code,
        clearedAction,
        scheme: this.controlScheme
      };
    }

    isDown(code) {
      if (!code) return false;
      return this.heldCodes.has(code);
    }

    isActionDown(actionKey) {
      const scheme = this.controlScheme || CONTROL_PRESETS.preset_a;
      const code = scheme[actionKey];
      const kbDown = Boolean(code && this.heldCodes.has(code));
      if (actionKey === 'jump') return kbDown || !!this.touchState.jumpHeld;
      if (actionKey === 'left' || actionKey === 'right' || actionKey === 'up' || actionKey === 'down') {
        return kbDown || !!this.touchState[actionKey];
      }
      return kbDown;
    }

    isCodeBoundInControlScheme(code) {
      if (!code) return false;
      const scheme = this.controlScheme || CONTROL_PRESETS.preset_a;
      for (let i = 0; i < MAPPABLE_ACTIONS.length; i++) {
        if (scheme[MAPPABLE_ACTIONS[i].key] === code) return true;
      }
      return false;
    }

    syncGameplayInputFromHeld() {
      const s = this.state;
      s.left = this.isActionDown('left');
      s.right = this.isActionDown('right');
      s.up = this.isActionDown('up');
      s.down = this.isActionDown('down');
      s.jumpHeld = this.isActionDown('jump');
    }

    formatKeyCode(code, compact = false) {
      return formatKeyCode(code, compact);
    }

    clearTransient() {
      this.heldCodes.clear();
      this.touchState.left = false;
      this.touchState.right = false;
      this.touchState.up = false;
      this.touchState.down = false;
      this.touchState.jumpHeld = false;
      this.heldJumpKeys = {
        ArrowUp: false,
        Space: false
      };
      const s = this.state;
      s.left = false;
      s.right = false;
      s.up = false;
      s.down = false;
      s.analogX = 0;
      s.analogY = 0;
      s.analogAngle = 0;
      s.jumpHeld = false;
      s.jump = false;
      s.jumpPressed = false;
      s.downPressed = false;
      s.skillPressed = false;
      s.tinaPressed = false;
      s.shootPressed = false;
      s.reservePressed = false;
    }

    setJumpKeyState(keySlot, isDown, isRepeat = false) {
      const hasAnyJumpHeld = () => {
        for (const k in this.heldJumpKeys) {
          if (this.heldJumpKeys[k]) return true;
        }
        return this.isActionDown('jump');
      };
      if (isDown) {
        const wasHeld = hasAnyJumpHeld() || this.state.jumpHeld;
        this.heldJumpKeys[keySlot] = true;
        if (!wasHeld && !isRepeat) {
          this.state.jumpPressed = true;
        }
        this.state.jumpHeld = true;
      } else {
        this.heldJumpKeys[keySlot] = false;
        this.state.jumpHeld = hasAnyJumpHeld();
      }
    }

    clearStepTriggers() {
      const s = this.state;
      s.jumpPressed = false;
      s.downPressed = false;
      s.skillPressed = false;
      s.tinaPressed = false;
      s.shootPressed = false;
      s.reservePressed = false;
    }

    /**
     * Detecta si el dispositivo es táctil:
     * - matchMedia('(pointer: coarse)') => puntero principal impreciso (móviles/tablets)
     * - o soporte 'ontouchstart' / maxTouchPoints, SIEMPRE que no tenga puntero fino principal.
     */
    isTouchDevice() {
      const mm = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
      if (mm('(pointer: coarse)')) return true;
      const hasTouchApi = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasFinePointer = mm('(hover: hover) and (pointer: fine)');
      return hasTouchApi && !hasFinePointer;
    }

    applyInputMode() {
      const enable = () => document.body.classList.add('touch-device');
      if (this.isTouchDevice()) {
        enable();
        return;
      }
      window.addEventListener(
        'touchstart',
        () => {
          enable();
        },
        { once: true, passive: true }
      );
    }

    lockLandscapeOrientation() {
      if (document.body.classList.contains('touch-device') || this.isTouchDevice()) {
        document.body.classList.add('force-landscape');
        if (
          document.documentElement &&
          document.documentElement.requestFullscreen &&
          !document.fullscreenElement
        ) {
          try {
            const fsPromise = document.documentElement.requestFullscreen();
            if (fsPromise && typeof fsPromise.catch === 'function') {
              fsPromise.catch(() => {});
            }
          } catch (e) {}
        }
      }
      if (screen && screen.orientation && typeof screen.orientation.lock === 'function') {
        try {
          const lockPromise = screen.orientation.lock('landscape');
          if (lockPromise && typeof lockPromise.catch === 'function') {
            lockPromise.catch(() => {});
          }
        } catch (e) {}
      }
    }

    getLogicalPointerCoords(clientX, clientY) {
      const rect = this.game.canvas.getBoundingClientRect();
      const isRotatedPortrait =
        document.body.classList.contains('touch-device') &&
        window.innerHeight > window.innerWidth &&
        window.innerWidth <= 920;

      if (isRotatedPortrait) {
        const cx = ((clientY - rect.top) / Math.max(1, rect.height)) * LOGICAL_W;
        const cy = ((rect.right - clientX) / Math.max(1, rect.width)) * LOGICAL_H;
        return { cx, cy };
      }

      const cx = ((clientX - rect.left) / Math.max(1, rect.width)) * LOGICAL_W;
      const cy = ((clientY - rect.top) / Math.max(1, rect.height)) * LOGICAL_H;
      return { cx, cy };
    }

    bindEvents() {
      const game = this.game;

      window.addEventListener('keydown', (e) => {
        game.sound.init();
        game.sound.resume();
        const rawCode = e.code || '';
        const code = rawCode === '' && e.key === ' ' ? 'Space' : rawCode;

        // Captura exclusiva en estado "Esperando tecla..." del submenú CONTROLES
        if (game.state === 'settings' && game.settingsSubmenu === 'controls' && game.awaitingKeyAction) {
          e.preventDefault();
          if (e.repeat) return;
          if (code === 'Escape') {
            if (typeof game.cancelKeyRebind === 'function') game.cancelKeyRebind();
            return;
          }
          if (
            code &&
            code !== 'Unidentified' &&
            code !== 'MetaLeft' &&
            code !== 'MetaRight' &&
            code !== 'ContextMenu'
          ) {
            if (typeof game.completeKeyRebind === 'function') game.completeKeyRebind(code);
          }
          return;
        }

        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) ||
          (game.state === 'playing' && this.isCodeBoundInControlScheme(code))
        ) {
          e.preventDefault();
        }

        // Silencio rápido de sistema [M] (excepto al escribir iniciales Arcade, si KeyM está reasignada o si completa cheat 'ethome')
        const typingArcadeInitials =
          game.state === 'gameover' && game.gameOverPhase === 'initials';
        const mBoundInGameplay =
          game.state === 'playing' && this.isCodeBoundInControlScheme('KeyM');
        const mCompletingEtHomeCheat =
          game.state === 'playing' &&
          !game.isAbductedByCheat &&
          typeof game.etHomeBuffer === 'string' &&
          game.etHomeBuffer.endsWith('etho');
        if (code === 'KeyM' && !e.repeat && !typingArcadeInitials && !mBoundInGameplay && !mCompletingEtHomeCheat) {
          game.sound.toggleMute();
          return;
        }

        const isConfirm = code === 'Enter' || code === 'Space';
        const isBackOrQuit = code === 'Backspace' || code === 'KeyQ';

        // 1. Menú Principal
        if (game.state === 'menu') {
          if (code === 'ArrowLeft') {
            game.selectedCharacter = 'nico';
            game.sound.menuSelect();
          } else if (code === 'ArrowRight') {
            game.selectedCharacter = 'andrea';
            game.sound.menuSelect();
          } else if (code === 'ArrowUp') {
            game.menuCursor = (game.menuCursor + 5) % 6;
            game.sound.menuSelect();
          } else if (code === 'ArrowDown') {
            game.menuCursor = (game.menuCursor + 1) % 6;
            game.sound.menuSelect();
          } else if (isConfirm && !e.repeat) {
            game.activateMenuOption();
          }
          return;
        }

        // 2. Modal de Selección de Partidas Guardadas (3 Ranuras Independientes)
        if (game.state === 'save_slots') {
          if (e.repeat) return;
          if (game.deleteConfirmSlot !== null) {
            if (code === 'ArrowLeft' || code === 'ArrowRight') {
              game.deleteConfirmCursor = game.deleteConfirmCursor === 0 ? 1 : 0;
              game.sound.menuSelect();
            } else if (isConfirm) {
              if (game.deleteConfirmCursor === 0) {
                game.confirmDeleteSlot();
              } else {
                game.cancelDeleteSlot();
              }
            } else if (code === 'Escape' || isBackOrQuit) {
              game.cancelDeleteSlot();
            }
            return;
          }

          if (code === 'ArrowUp') {
            game.slotCursor = (game.slotCursor + 2) % 3;
            game.slotDeleteFocus = false;
            game.sound.menuSelect();
          } else if (code === 'ArrowDown') {
            game.slotCursor = (game.slotCursor + 1) % 3;
            game.slotDeleteFocus = false;
            game.sound.menuSelect();
          } else if (code === 'ArrowRight') {
            const currentSlotId = game.slotCursor + 1;
            const hasSavedData = Boolean(global.SaveSlots && global.SaveSlots.getSlot(currentSlotId));
            if (hasSavedData && !game.slotDeleteFocus) {
              game.slotDeleteFocus = true;
              game.sound.menuSelect();
            }
          } else if (code === 'ArrowLeft') {
            if (game.slotDeleteFocus) {
              game.slotDeleteFocus = false;
              game.sound.menuSelect();
            }
          } else if (isConfirm) {
            if (game.slotDeleteFocus) {
              game.requestDeleteSlot(game.slotCursor + 1);
            } else {
              game.selectSaveSlot(game.slotCursor + 1);
            }
          } else if (code === 'Delete') {
            game.requestDeleteSlot(game.slotCursor + 1);
          } else if (code === 'Escape' || isBackOrQuit) {
            game.closeSaveSlots();
          }
          return;
        }

        // 3. Mapa General (Overworld): Flechas + ENTER/Espacio + ESC/Backspace/Q
        if (game.state === 'map') {
          if (game.mapScreen && game.mapScreen.resetConfirmOpen) {
            if (!e.repeat) {
              if (code === 'ArrowLeft' || code === 'ArrowRight') {
                game.mapScreen.resetConfirmCursor = game.mapScreen.resetConfirmCursor === 0 ? 1 : 0;
                game.sound.menuSelect();
              } else if (isConfirm) {
                if (game.mapScreen.resetConfirmCursor === 0) {
                  game.mapScreen.confirmResetActiveSlot();
                } else {
                  game.mapScreen.cancelResetActiveSlot();
                }
              } else if (code === 'Escape' || isBackOrQuit) {
                game.mapScreen.cancelResetActiveSlot();
              }
            }
            return;
          }

          if (code === 'ArrowLeft') this.state.left = true;
          if (code === 'ArrowRight') this.state.right = true;
          if (code === 'ArrowUp') this.state.up = true;
          if (code === 'ArrowDown') this.state.down = true;
          if (!e.repeat) {
            if (isConfirm) {
              game.mapScreen.confirm();
            } else if (code === 'Escape' || isBackOrQuit) {
              game.mapScreen.back();
            }
          }
          return;
        }

        // 4. Pantalla de Ayuda / Controles
        if (game.state === 'controls') {
          if (!e.repeat && (isConfirm || code === 'Escape' || isBackOrQuit)) {
            game.state = 'menu';
            game.sound.menuSelect();
          }
          return;
        }

        // 4a. Tabla de Récords Arcade (Top 10)
        if (game.state === 'leaderboard') {
          if (!e.repeat && (isConfirm || code === 'Escape' || isBackOrQuit)) {
            game.closeLeaderboardModal(true);
          }
          return;
        }

        // 4b. Modal de Configuración (Mezclador + Jukebox + Submenú Controles)
        if (game.state === 'settings') {
          if (game.settingsSubmenu === 'controls') {
            if (code === 'Escape' || isBackOrQuit) {
              if (!e.repeat) {
                e.preventDefault();
                if (typeof game.closeControlsSubmenu === 'function') {
                  game.closeControlsSubmenu();
                } else {
                  game.closeSettingsModal(true);
                }
              }
            } else if (code === 'ArrowUp') {
              e.preventDefault();
              if (typeof game.moveControlsCursor === 'function') game.moveControlsCursor(-1);
            } else if (code === 'ArrowDown') {
              e.preventDefault();
              if (typeof game.moveControlsCursor === 'function') game.moveControlsCursor(1);
            } else if (code === 'ArrowLeft') {
              e.preventDefault();
              if (typeof game.moveControlsHorizontal === 'function') game.moveControlsHorizontal(-1);
            } else if (code === 'ArrowRight') {
              e.preventDefault();
              if (typeof game.moveControlsHorizontal === 'function') game.moveControlsHorizontal(1);
            } else if (isConfirm && !e.repeat) {
              e.preventDefault();
              if (typeof game.activateControlsSubmenuItem === 'function') game.activateControlsSubmenuItem();
            }
            return;
          }

          if (code === 'Escape' || code === 'Backspace' || code === 'KeyQ') {
            if (!e.repeat) {
              e.preventDefault();
              game.closeSettingsModal(true);
            }
          } else if (code === 'ArrowUp') {
            e.preventDefault();
            game.moveSettingsCursor(-1);
          } else if (code === 'ArrowDown') {
            e.preventDefault();
            game.moveSettingsCursor(1);
          } else if (code === 'ArrowLeft') {
            e.preventDefault();
            game.adjustSettingsSlider(-5);
          } else if (code === 'ArrowRight') {
            e.preventDefault();
            game.adjustSettingsSlider(5);
          } else if (isConfirm && !e.repeat) {
            e.preventDefault();
            game.activateSettingsItem();
          }
          return;
        }

        // 5. Pausa
        if (game.state === 'paused') {
          if (e.repeat) return;
          if (code === 'KeyP' || code === 'Escape' || isConfirm) {
            if (typeof game.resumeGame === 'function') game.resumeGame();
            else {
              game.state = 'playing';
              game.sound.menuSelect();
            }
          } else if (code === 'KeyR') {
            if (game.sound && typeof game.sound.resumeMusic === 'function') game.sound.resumeMusic();
            game.loadLevel(game.levelIndex);
            game.state = 'playing';
          } else if (code === 'KeyV') {
            if (typeof game.returnToLastPlayedMap === 'function') {
              game.returnToLastPlayedMap();
            }
          } else if (isBackOrQuit) {
            game.returnToMenu(true);
          }
          return;
        }

        // 6. Resumen de Nivel Completado (ENTER/ESPACIO completan conteo o vuelven al Submapa; ESC/Q al menú)
        if (game.state === 'level_clear') {
          if (e.repeat) return;
          if (isConfirm) {
            if (typeof game.confirmLevelClear === 'function') {
              game.confirmLevelClear();
            } else {
              game.nextLevel();
            }
          } else if (code === 'Escape' || isBackOrQuit) {
            game.returnToMenu(true);
          }
          return;
        }

        // 7. Cinemática de Fin de Nivel: Backspace / Q permiten salir limpiamente al menú
        if (game.state === 'level_cinematic') {
          if (!e.repeat && isBackOrQuit) {
            game.returnToMenu(true);
          }
          return;
        }

        // 8. Game Over (Ingreso de Iniciales 3 letras o Top 10) o Victoria
        if (game.state === 'gameover') {
          if (game.gameOverPhase === 'initials') {
            if (code === 'ArrowUp') {
              game.stepArcadeInitial(1);
            } else if (code === 'ArrowDown') {
              game.stepArcadeInitial(-1);
            } else if (code === 'ArrowLeft') {
              game.arcadeLetterIdx = (game.arcadeLetterIdx + 2) % 3;
              game.sound.menuSelect();
            } else if (code === 'ArrowRight') {
              game.arcadeLetterIdx = (game.arcadeLetterIdx + 1) % 3;
              game.sound.menuSelect();
            } else if (code === 'Backspace') {
              e.preventDefault();
              game.arcadeLetterIdx = Math.max(0, game.arcadeLetterIdx - 1);
              game.sound.menuSelect();
            } else if (isConfirm && !e.repeat) {
              game.confirmArcadeInitials();
            } else if (code === 'KeyR' && !e.repeat) {
              game.retryCurrentZone();
            } else if (code === 'Escape' && !e.repeat) {
              game.lives = 3;
              game.returnToMenu(false);
            } else if (
              !e.repeat &&
              !e.ctrlKey &&
              !e.metaKey &&
              !e.altKey &&
              typeof e.key === 'string' &&
              /^[a-zA-Z]$/.test(e.key)
            ) {
              e.preventDefault();
              game.typeArcadeInitial(e.key);
            }
            return;
          }
          if (e.repeat) return;
          if (isConfirm) {
            if (typeof game.returnToLastPlayedMap === 'function') {
              game.returnToLastPlayedMap();
            } else {
              game.lives = 3;
              game.openMap({
                level: 'city',
                cursorCity: game.cityKey,
                cursorZone: (game.levelIndex | 0) + 1
              });
            }
          } else if (code === 'KeyR') {
            game.retryCurrentZone();
          } else if (code === 'Escape' || isBackOrQuit) {
            game.lives = 3;
            game.returnToMenu(false);
          }
          return;
        }
        if (game.state === 'victory') {
          if (e.repeat) return;
          if (isConfirm || code === 'KeyR') {
            game.startNewGame();
          } else if (code === 'Escape' || isBackOrQuit) {
            game.returnToMenu(false);
          }
          return;
        }

        // 9. En Partida ('playing'):
        //    * Estándar Arcade 2D   : Flechas Mover/Agachar, ↑/Espacio Saltar, [Z] Planta, [X] La Tina, [C] Especial, [Shift] Reserva
        //    * Atajo paralelo WASD  : [W] Reserva, [A] Especial Líder, [S] La Tina, [D] Planta
        //    * Pausa / Mute         : [ESC] / [P] / [Backspace] / [Q] Pausa  ·  [M] Mute
        if (game.state === 'playing') {
          if (game.isAbductedByCheat) {
            this.clearTransient();
            return;
          }
          if (!e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (typeof game.handleStartCheatKey === 'function' && game.handleStartCheatKey(code)) {
              return;
            }
            const isSpaceCheatCheck = code === 'Space' || e.key === ' ';
            const isMenuConfirmKey = code === 'Enter' || code === 'NumpadEnter';
            const isLegacyCheatInvalidKey =
              code === 'ArrowLeft' ||
              code === 'ArrowRight' ||
              code === 'ArrowUp' ||
              code === 'ArrowDown' ||
              code === 'KeyA' ||
              code === 'KeyD' ||
              code === 'KeyW' ||
              code === 'KeyS' ||
              code === 'KeyZ' ||
              code === 'KeyC' ||
              code === 'KeyX' ||
              code === 'ShiftLeft' ||
              code === 'ShiftRight';
            const isCheatInvalidationKey =
              isLegacyCheatInvalidKey ||
              (!isSpaceCheatCheck && this.isCodeBoundInControlScheme(code)) ||
              (isSpaceCheatCheck &&
                (typeof game.getCheatElapsedMs !== 'function' || game.getCheatElapsedMs() > 300));
            if (!isMenuConfirmKey && isCheatInvalidationKey && typeof game.invalidateStartCheat === 'function') {
              game.invalidateStartCheat();
            }
            if (typeof game.handleEtHomeCheatKey === 'function' && game.handleEtHomeCheatKey(e.key, code)) {
              this.clearTransient();
              return;
            }
          }

          const pauseBlockedByCustomBind =
            code !== 'Escape' && this.isCodeBoundInControlScheme(code);
          if ((code === 'KeyP' || code === 'Escape' || isBackOrQuit) && !pauseBlockedByCustomBind && !e.repeat) {
            if (typeof game.pauseGame === 'function') {
              game.pauseGame();
            } else {
              game.state = 'paused';
              this.clearTransient();
              game.sound.menuSelect();
            }
            return;
          }

          const scheme = this.controlScheme || CONTROL_PRESETS.preset_a;
          const wasDownHeld = this.isActionDown('down');
          if (code) this.heldCodes.add(code);
          this.syncGameplayInputFromHeld();

          const isSpaceKey = code === 'Space' || e.key === ' ';
          const jumpCode = scheme.jump || 'Space';
          if (code === jumpCode || (jumpCode === 'Space' && isSpaceKey)) {
            this.setJumpKeyState(jumpCode === 'Space' ? 'Space' : code, true, e.repeat);
          }

          if (code === scheme.down && !wasDownHeld && !e.repeat) {
            this.state.downPressed = true;
          }

          if (!e.repeat) {
            if (code === scheme.reserve) {
              this.state.reservePressed = true;
            } else if (code === scheme.skill) {
              this.state.skillPressed = true;
            } else if (code === scheme.tina) {
              this.state.tinaPressed = true;
            } else if (code === scheme.shoot) {
              this.state.shootPressed = true;
            }
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        const rawCode = e.code || '';
        const code = rawCode === '' && e.key === ' ' ? 'Space' : rawCode;
        if (code) this.heldCodes.delete(code);

        if (this.game && this.game.state === 'playing') {
          if (this.game.isAbductedByCheat) {
            this.clearTransient();
            return;
          }
          const scheme = this.controlScheme || CONTROL_PRESETS.preset_a;
          const jumpCode = scheme.jump || 'Space';
          const isSpaceKey = code === 'Space' || e.key === ' ';
          if (code === jumpCode || (jumpCode === 'Space' && isSpaceKey)) {
            this.setJumpKeyState(jumpCode === 'Space' ? 'Space' : code, false);
          }
          this.syncGameplayInputFromHeld();
          return;
        }

        if (code === 'ArrowLeft') this.state.left = !!this.touchState.left;
        if (code === 'ArrowRight') this.state.right = !!this.touchState.right;
        if (code === 'ArrowUp') this.state.up = !!this.touchState.up;
        const isSpaceKey = code === 'Space' || e.key === ' ';
        if (code === 'ArrowUp' || isSpaceKey) {
          this.setJumpKeyState(code === 'ArrowUp' ? 'ArrowUp' : 'Space', false);
        }
        if (code === 'ArrowDown') this.state.down = !!this.touchState.down;
      });

      window.addEventListener('blur', () => {
        this.clearTransient();
      });

      // Clics y toques sobre el Canvas (solo botón izquierdo para mouse)
      game.canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        game.sound.init();
        game.sound.resume();
        const { cx, cy } = this.getLogicalPointerCoords(e.clientX, e.clientY);
        game.handleCanvasPointer(cx, cy);
      });

      game.canvas.addEventListener('pointermove', (e) => {
        if (typeof game.handleCanvasPointerMove === 'function') {
          const { cx, cy } = this.getLogicalPointerCoords(e.clientX, e.clientY);
          game.handleCanvasPointerMove(cx, cy);
        }
      });

      game.canvas.addEventListener('click', () => {
        game.sound.init();
        game.sound.resume();
      });

      this.bindTouchControls();
    }

    bindTouchControls() {
      const game = this.game;
      const joystickZone = document.getElementById('joystick-zone');
      const joystickBase = document.getElementById('joystick-base');
      const joystickStick = document.getElementById('joystick-stick');

      let joystickTouchId = null;
      let isMouseDraggingJoystick = false;
      let joyCenterX = 0;
      let joyCenterY = 0;
      const MAX_STICK_RADIUS = 34;

      const updateJoystickFromClientPoint = (clientX, clientY) => {
        if (!joystickBase || !joystickStick) return;

        const isRotatedPortrait =
          window.innerHeight > window.innerWidth && window.innerWidth <= 920;

        const rawDx = clientX - joyCenterX;
        const rawDy = clientY - joyCenterY;
        const dx = isRotatedPortrait ? rawDy : rawDx;
        const dy = isRotatedPortrait ? -rawDx : rawDy;

        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(MAX_STICK_RADIUS, dist);

        const stickX = Math.cos(angle) * clampedDist;
        const stickY = Math.sin(angle) * clampedDist;
        joystickStick.style.transform = `translate3d(${stickX.toFixed(1)}px, ${stickY.toFixed(1)}px, 0)`;

        const norm = clampedDist / MAX_STICK_RADIUS;
        const DEADZONE = 0.16;

        if (norm < DEADZONE) {
          this.touchState.left = false;
          this.touchState.right = false;
          this.touchState.up = false;
          this.touchState.down = false;
          this.state.left = game.state === 'playing' ? this.isActionDown('left') : false;
          this.state.right = game.state === 'playing' ? this.isActionDown('right') : false;
          this.state.up = game.state === 'playing' ? this.isActionDown('up') : false;
          this.state.down = game.state === 'playing' ? this.isActionDown('down') : false;
          this.state.analogX = 0;
          this.state.analogY = 0;
          this.state.analogAngle = 0;
          return;
        }

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        this.state.analogX = stickX / MAX_STICK_RADIUS;
        this.state.analogY = stickY / MAX_STICK_RADIUS;
        this.state.analogAngle = angle;

        this.touchState.left = cosA < -0.32;
        this.touchState.right = cosA > 0.32;
        this.touchState.up = sinA < -0.38;

        const nowDown = sinA > 0.38;
        if (nowDown && !this.state.down) {
          this.state.downPressed = true;
        }
        this.touchState.down = nowDown;

        this.state.left = this.touchState.left || (game.state === 'playing' && this.isActionDown('left'));
        this.state.right = this.touchState.right || (game.state === 'playing' && this.isActionDown('right'));
        this.state.up = this.touchState.up || (game.state === 'playing' && this.isActionDown('up'));
        this.state.down = this.touchState.down || (game.state === 'playing' && this.isActionDown('down'));
        if (game.state === 'playing' && typeof game.invalidateStartCheat === 'function') {
          game.invalidateStartCheat();
        }
      };

      const resetJoystickToCenter = () => {
        joystickTouchId = null;
        isMouseDraggingJoystick = false;
        if (joystickStick) {
          joystickStick.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        if (joystickBase) {
          joystickBase.classList.remove('active');
        }
        this.touchState.left = false;
        this.touchState.right = false;
        this.touchState.up = false;
        this.touchState.down = false;
        this.state.left = game.state === 'playing' ? this.isActionDown('left') : false;
        this.state.right = game.state === 'playing' ? this.isActionDown('right') : false;
        this.state.up = game.state === 'playing' ? this.isActionDown('up') : false;
        this.state.down = game.state === 'playing' ? this.isActionDown('down') : false;
        this.state.analogX = 0;
        this.state.analogY = 0;
        this.state.analogAngle = 0;
      };

      if (joystickZone && joystickBase) {
        joystickZone.addEventListener(
          'touchstart',
          (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            game.sound.init();

            const touch =
              (ev.targetTouches && ev.targetTouches[0]) ||
              (ev.changedTouches && ev.changedTouches[0]);
            if (!touch) return;

            joystickTouchId = touch.identifier;
            const rect = joystickBase.getBoundingClientRect();
            joyCenterX = rect.left + rect.width * 0.5;
            joyCenterY = rect.top + rect.height * 0.5;

            joystickBase.classList.add('active');
            updateJoystickFromClientPoint(touch.clientX, touch.clientY);
          },
          { passive: false }
        );

        window.addEventListener(
          'touchmove',
          (ev) => {
            if (joystickTouchId === null) return;
            for (let i = 0; i < ev.changedTouches.length; i++) {
              const t = ev.changedTouches[i];
              if (t.identifier === joystickTouchId) {
                ev.preventDefault();
                updateJoystickFromClientPoint(t.clientX, t.clientY);
                break;
              }
            }
          },
          { passive: false }
        );

        const handleJoystickTouchEnd = (ev) => {
          if (joystickTouchId === null) return;
          for (let i = 0; i < ev.changedTouches.length; i++) {
            if (ev.changedTouches[i].identifier === joystickTouchId) {
              resetJoystickToCenter();
              break;
            }
          }
        };

        window.addEventListener('touchend', handleJoystickTouchEnd, { passive: false });
        window.addEventListener('touchcancel', handleJoystickTouchEnd, { passive: false });

        joystickZone.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          game.sound.init();
          isMouseDraggingJoystick = true;
          const rect = joystickBase.getBoundingClientRect();
          joyCenterX = rect.left + rect.width * 0.5;
          joyCenterY = rect.top + rect.height * 0.5;
          joystickBase.classList.add('active');
          updateJoystickFromClientPoint(ev.clientX, ev.clientY);
        });

        window.addEventListener('mousemove', (ev) => {
          if (!isMouseDraggingJoystick) return;
          updateJoystickFromClientPoint(ev.clientX, ev.clientY);
        });

        window.addEventListener('mouseup', () => {
          if (isMouseDraggingJoystick) {
            resetJoystickToCenter();
          }
        });
      }

      const bindTouchButton = (id, onDown, onUp) => {
        const el = document.getElementById(id);
        if (!el) return;
        const activeTouches = new Set();

        const handleTouchStart = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          game.sound.init();

          const touches =
            ev.targetTouches && ev.targetTouches.length > 0
              ? ev.targetTouches
              : ev.changedTouches;
          for (let i = 0; i < touches.length; i++) {
            activeTouches.add(touches[i].identifier);
          }
          el.classList.add('active');
          onDown();
        };

        const handleTouchEnd = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          for (let i = 0; i < ev.changedTouches.length; i++) {
            activeTouches.delete(ev.changedTouches[i].identifier);
          }
          if (activeTouches.size === 0) {
            el.classList.remove('active');
            if (onUp) onUp();
          }
        };

        const handleMouseDown = (ev) => {
          ev.preventDefault();
          game.sound.init();
          el.classList.add('active');
          onDown();
        };

        const handleMouseUp = (ev) => {
          ev.preventDefault();
          if (el.classList.contains('active')) {
            el.classList.remove('active');
            if (onUp) onUp();
          }
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: false });
        el.addEventListener('touchend', handleTouchEnd, { passive: false });
        el.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        el.addEventListener('mousedown', handleMouseDown);
        el.addEventListener('mouseup', handleMouseUp);
        el.addEventListener('mouseleave', handleMouseUp);
      };

      // Rombo táctil derecho (SNES / PlayStation) mapeado al nuevo esquema
      bindTouchButton(
        'btn-jump',
        () => {
          if (game.state === 'menu') {
            game.openSaveSlots('play');
          } else if (game.state === 'save_slots') {
            game.selectSaveSlot(game.slotCursor + 1);
          } else if (game.state === 'controls') {
            game.state = 'menu';
            game.sound.menuSelect();
          } else if (game.state === 'leaderboard') {
            game.closeLeaderboardModal(true);
          } else if (game.state === 'level_clear') {
            if (typeof game.confirmLevelClear === 'function') {
              game.confirmLevelClear();
            } else {
              game.nextLevel();
            }
          } else if (game.state === 'gameover') {
            if (game.gameOverPhase === 'initials') {
              game.confirmArcadeInitials();
            } else if (typeof game.returnToLastPlayedMap === 'function') {
              game.returnToLastPlayedMap();
            } else {
              game.lives = 3;
              game.openMap({
                level: 'city',
                cursorCity: game.cityKey,
                cursorZone: (game.levelIndex | 0) + 1
              });
            }
          } else if (game.state === 'victory') {
            game.startNewGame();
          } else if (game.state === 'map') {
            game.mapScreen.confirm();
          } else {
            if (game.state === 'playing' && typeof game.invalidateStartCheat === 'function') {
              game.invalidateStartCheat();
            }
            this.touchState.jumpHeld = true;
            this.state.jumpPressed = true;
            this.state.jumpHeld = true;
          }
        },
        () => {
          this.touchState.jumpHeld = false;
          this.state.jumpHeld = game.state === 'playing' ? this.isActionDown('jump') : false;
        }
      );

      // Botón Izquierdo: Disparo de Planta [D]
      bindTouchButton('btn-shoot', () => {
        if (game.state === 'playing' && typeof game.invalidateStartCheat === 'function') {
          game.invalidateStartCheat();
        }
        this.state.shootPressed = true;
      });

      // Botón Superior: Intercambio de Power-Up / Reserva [W] (en el Mapa: volver)
      bindTouchButton('btn-reserve', () => {
        if (game.state === 'map') {
          game.mapScreen.back();
        } else {
          if (game.state === 'playing' && typeof game.invalidateStartCheat === 'function') {
            game.invalidateStartCheat();
          }
          this.state.reservePressed = true;
        }
      });

      // Botón Derecho: Habilidad Especial [A] / La Tina [S]
      bindTouchButton('btn-skill', () => {
        game.triggerDynamicMobileSkill();
      });

      // Franja central: Ladrido de La Tina [S] y Pausa [P]
      bindTouchButton('btn-tina', () => {
        if (game.state === 'playing' && typeof game.invalidateStartCheat === 'function') {
          game.invalidateStartCheat();
        }
        this.state.tinaPressed = true;
      });
      bindTouchButton('btn-pause-touch', () => {
        if (game.state === 'playing' && typeof game.invalidateStartCheat === 'function') {
          game.invalidateStartCheat();
        }
        if (typeof game.togglePause === 'function') {
          game.togglePause();
        } else if (game.state === 'playing') {
          game.state = 'paused';
        } else if (game.state === 'paused') {
          game.state = 'playing';
        }
      });
    }
  }

  global.InputManager = InputManager;
  global.Input = {
    isDown(code) {
      const inst = InputManager.activeInstance;
      return inst ? inst.isDown(code) : false;
    },
    isActionDown(actionKey) {
      const inst = InputManager.activeInstance;
      return inst ? inst.isActionDown(actionKey) : false;
    },
    getControlScheme() {
      const inst = InputManager.activeInstance;
      return inst ? inst.getControlScheme() : clonePreset('preset_a');
    },
    getControlActions() {
      return MAPPABLE_ACTIONS.slice();
    },
    getControlPresets() {
      return {
        preset_a: clonePreset('preset_a'),
        preset_b: clonePreset('preset_b')
      };
    },
    applyPreset(presetId) {
      const inst = InputManager.activeInstance;
      return inst ? inst.applyPreset(presetId) : clonePreset(presetId);
    },
    rebindAction(actionKey, code) {
      const inst = InputManager.activeInstance;
      return inst ? inst.rebindAction(actionKey, code) : { scheme: clonePreset('preset_a'), clearedAction: null };
    },
    isCodeBound(code) {
      const inst = InputManager.activeInstance;
      return inst ? inst.isCodeBoundInControlScheme(code) : false;
    },
    formatKeyCode(code, compact = false) {
      return formatKeyCode(code, compact);
    }
  };
})(window);
