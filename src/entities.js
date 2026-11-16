/**
 * ============================================================================
 * AVENTURA EN BARCELONA HD - Entidades, Trío, La Tina Autónoma y Power-Ups
 * ============================================================================
 * Incluye:
 * 1. Trío en Simultáneo: Player (Líder: Nico o Andrea), PartnerCompanion y
 *    TinaCompanion (La Tina).
 * 2. Habilidades del Líder (Cooldown 5s):
 *    - Nico: Ground Pound / Terremoto (Aire + S/↓) -> grietas, escombros y stun 3s.
 *    - Andrea: Pose Hipnótica (Tecla E) -> onda y partículas de ♥, hipnosis 3s.
 * 3. La Tina (Tecla G / botón 🐾, Cooldown 30s + IA Autónoma 120-150px):
 *    - Gruñido Feroz: hace que todas las palomas visibles en pantalla salgan
 *      volando hacia arriba y desaparezcan.
 *    - IA de búsqueda por proximidad (140px): se desvía sola a buscar monedas o
 *      power-ups cercanos y aborta si el líder se aleja rápido.
 * 4. Power-Ups y Sistema de Escudo / Armadura:
 *    - Power-up Eléctrico (10s): campo de rayos que electrocuta y destruye enemigos
 *      por contacto cercano.
 *    - Alas de Ángel: TRIPLE SALTO (base + 2 impulsos aéreos), recargable al tocar suelo.
 *    - Sistema de Escudo: recibir daño con power-ups activos NO resta corazones;
 *      consume los power-ups y da 1s de invencibilidad.
 */
(function (global) {
  'use strict';

  const GRAVITY = 1380;
  const MAX_FALL_SPEED = 780;
  const GROUND_POUND_SPEED = 900;
  const BASE_SPEED = 240;
  const JUMP_FORCE = -545;
  const ANGEL_WING_JUMP_FORCE = -505;
  const SLOW_SPEED_FACTOR = 0.50; // Aire helado del Pingüino Pecho Frío: velocidad horizontal
  const SLOW_JUMP_FACTOR = 0.85;  // Aire helado del Pingüino Pecho Frío: impulso de salto (permite saltar otro proyectil sin stunlock)
  const ABILITY_COOLDOWN_MAX = 5.0;
  const TINA_COOLDOWN_MAX = 30.0;
  const ELECTRIC_FIELD_RADIUS = 68;
  // Offset vertical (y) al colgarse para que las manos alzadas (localY = -32) sujeten el cable sobre la cabeza
  const HANG_ANCHOR_OFFSET = 10;

  function isActorHanging(actor) {
    return Boolean(
      actor && (actor.hangingRope || actor.isHanging || actor.onCable || actor.onZipline || actor.onVine)
    );
  }

  function clearActorHangingState(actor) {
    if (!actor) return;
    actor.hangingRope = null;
    actor.isHanging = false;
    actor.onCable = false;
    actor.onZipline = false;
    actor.onVine = false;
  }

  function resolveHangingAnimState(actor) {
    return Math.abs((actor && actor.vx) || 0) > 10 ? 'hang_move' : 'hang';
  }

  function aabbOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  /**
   * Sombra dinámica suave HD proyectada bajo el personaje que responde a la altura del salto
   */
  function drawProjectedShadow(ctx, entityX, entityBottomY, entityW, solids, movingPlatforms, cameraX) {
    const centerX = entityX + entityW * 0.5;
    let shadowY = null;
    let minDist = 280;

    const all = solids.concat(movingPlatforms || []);
    for (let i = 0; i < all.length; i++) {
      const p = all[i];
      if (centerX >= p.x && centerX <= p.x + p.w && p.y >= entityBottomY - 8) {
        const dist = p.y - entityBottomY;
        if (dist < minDist) {
          minDist = dist;
          shadowY = p.y;
        }
      }
    }

    if (shadowY === null) return;

    const heightFactor = Math.max(0.22, 1 - minDist / 260);
    const rx = (entityW * 0.68) * heightFactor;
    const ry = Math.max(2.5, 6.0 * heightFactor);
    const sx = centerX - cameraX;
    const sy = shadowY + 1;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(1, ry / (rx || 1));
    const grad = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
    grad.addColorStop(0, `rgba(6, 9, 20, ${(0.55 * heightFactor).toFixed(2)})`);
    grad.addColorStop(0.65, `rgba(6, 9, 20, ${(0.25 * heightFactor).toFixed(2)})`);
    grad.addColorStop(1, 'rgba(6, 9, 20, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Aplica al personaje el vector de desplazamiento compuesto (vx, vy) / (dx, dy)
   * de la plataforma móvil mientras permanece parado sobre ella.
   */
  function applyStandingPlatformDisplacement(actor, dt) {
    const plat = actor.standingPlatform;
    if (!plat) {
      actor.platformVx = 0;
      actor.platformVy = 0;
      return;
    }
    const vx = Number.isFinite(plat.vx) ? plat.vx : (dt > 0 ? (plat.dx || 0) / dt : 0);
    const vy = Number.isFinite(plat.vy) ? plat.vy : (dt > 0 ? (plat.dy || 0) / dt : 0);
    actor.platformVx = vx;
    actor.platformVy = vy;
    actor.x += Number.isFinite(plat.dx) ? plat.dx : vx * dt;
    actor.y += Number.isFinite(plat.dy) ? plat.dy : vy * dt;
  }

  /**
   * Transfiere parte del vector de inercia (vx, vy) de la plataforma al saltar.
   */
  function captureJumpPlatformInertia(actor) {
    if (!actor.standingPlatform || !actor.standingPlatform.isMoving) {
      actor.airPlatformVx = 0;
      return 0;
    }
    const pvx = Number.isFinite(actor.platformVx)
      ? actor.platformVx
      : (actor.standingPlatform.vx || 0);
    const pvy = Number.isFinite(actor.platformVy)
      ? actor.platformVy
      : (actor.standingPlatform.vy || 0);
    actor.airPlatformVx = Math.max(-135, Math.min(135, pvx * 0.55));
    return Math.max(-70, Math.min(40, pvy * 0.18));
  }

  /**
   * Mantiene la inercia horizontal heredada en el aire tras despegar de una plataforma móvil.
   */
  function applyAirPlatformInertia(actor, dt) {
    if (actor.onGround) {
      actor.airPlatformVx = 0;
      return;
    }
    if (Math.abs(actor.airPlatformVx || 0) > 1) {
      actor.x += actor.airPlatformVx * dt;
      actor.airPlatformVx *= Math.pow(0.08, dt);
    } else {
      actor.airPlatformVx = 0;
    }
  }

  // ==========================================================================
  // LÍDER DEL GRUPO (NICO O ANDREA)
  // ==========================================================================
  class Player {
    constructor(x, y, characterKey = 'nico') {
      this.spawnX = x;
      this.spawnY = y;
      this.x = x;
      this.y = y;
      this.w = 24;
      this.h = 44;
      this.vx = 0;
      this.vy = 0;
      this.characterKey = characterKey;
      this.facing = 'right';
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.jumpHeld = false;
      this.wasJumpDown = false;

      // Control de saltos: Estado base = 1 salto. Con Alas de Ángel = 3 saltos (Triple Salto).
      this.jumpsUsed = 0;

      // Salto, agache y plataformas one-way
      this.dropThroughTimer = 0;
      this.isCrouching = false;

      // Salud e invencibilidad
      this.hearts = 3;
      this.maxHearts = 3;
      this.invincibleTimer = 0;
      this.stompGraceTimer = 0;
      this.hurtTimer = 0;
      this.prevY = y;
      this.prevBottom = y + this.h;

      // Power-ups Mutuamente Excluyentes (Estilo Super Mario World):
      // 'angel_wings' (Triple Salto) O 'calamares' (Disparo Parabólico con Tecla F)
      // NUNCA ambos a la vez.
      this.activePowerUp = null;       // null | 'angel_wings' | 'plant'
      this.reserveItem = null;         // Reserva salvavidas [W] sincronizada con Game.reservePowerUp
      this.angelWingsActive = false;
      this.plantActive = false;
      this.calamaresActive = false;
      this.electricTimer = 0;          // Compatibilidad legado
      this.wingsTimer = 0;             // Compatibilidad legado
      this.smoothieTimer = 0;          // Batido: Velocidad x1.45 (8s)
      this.slowTimer = 0;              // Aire helado (Pingüino Pecho Frío): movimiento y salto reducidos
      this.wingFlapTimer = 0;
      this.shootCooldown = 0;

      // Habilidades Especiales (Cooldown 5s)
      this.abilityCooldown = 0;
      this.abilityMaxCooldown = ABILITY_COOLDOWN_MAX;
      this.isGroundPounding = false;
      this.justLandedGroundPoundThisFrame = false;
      this.poseTimer = 0;

      this.animTimer = 0;
      this.animState = 'idle';
      this.state = 'active'; // 'active' | 'entering_metro'
      this.hiddenInMetro = false;
      this.ghostMode = false;
      this.standingPlatform = null;
      this.platformVx = 0;
      this.platformVy = 0;
      this.airPlatformVx = 0;
      this.hangingRope = null;
      this.ropeCooldown = 0;
      this.isHanging = false;
      this.onCable = false;
      this.onZipline = false;
      this.onVine = false;
    }

    getActiveHitbox() {
      if (this.isCrouching) {
        return { x: this.x, y: this.y + 18, w: this.w, h: this.h - 18 };
      }
      return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    hasElectricField() {
      return this.electricTimer > 0;
    }

    hasAngelWings() {
      return this.activePowerUp === 'angel_wings' || Boolean(this.angelWingsActive);
    }

    hasPlant() {
      return (
        this.activePowerUp === 'plant' ||
        this.activePowerUp === 'calamares' ||
        Boolean(this.plantActive) ||
        Boolean(this.calamaresActive)
      );
    }

    hasCalamares() {
      return this.hasPlant();
    }

    hasSmoothie() {
      return this.smoothieTimer > 0;
    }

    hasAnyPowerUp() {
      return this.activePowerUp !== null || this.hasAngelWings() || this.hasPlant();
    }

    getMaxJumps() {
      return this.hasAngelWings() ? 3 : 1; // Sin doble salto en estado base; Triple Salto con Alas
    }

    /**
     * Equipa un Power-Up garantizando EXCLUSIÓN TOTAL (solo UNO activo a la vez).
     */
    equipPowerUp(type) {
      if (type === 'angel_wings') {
        this.activePowerUp = 'angel_wings';
        this.angelWingsActive = true;
        this.plantActive = false;
        this.calamaresActive = false;
        this.electricTimer = 0;
        this.wingsTimer = 999999;
      } else if (type === 'plant' || type === 'calamares') {
        this.activePowerUp = 'plant';
        this.plantActive = true;
        this.calamaresActive = true;
        this.angelWingsActive = false;
        this.electricTimer = 0;
        this.wingsTimer = 0;
        this.jumpsUsed = Math.min(this.jumpsUsed, 1);
      }
    }

    activateElectricField() {
      this.equipPowerUp('plant');
    }

    activateAngelWings() {
      this.equipPowerUp('angel_wings');
    }

    activatePlant() {
      this.equipPowerUp('plant');
    }

    activateCalamares() {
      this.equipPowerUp('plant');
    }

    applySlow(sec = 2.0) {
      if (this.ghostMode) return;
      this.slowTimer = Math.max(this.slowTimer, sec);
    }

    activateSmoothie() {
      this.smoothieTimer = 8.0;
    }

    clearAllPowerUps() {
      this.activePowerUp = null;
      this.angelWingsActive = false;
      this.plantActive = false;
      this.calamaresActive = false;
      this.electricTimer = 0;
      this.wingsTimer = 0;
      this.smoothieTimer = 0;
    }

    /**
     * Intercambio limpio y directo en memoria con la Caja de Reserva [SHIFT]:
     * [equipped, reserveItem] = [reserveItem, equipped], sin soltar ítems físicos del cielo.
     */
    swapReserveItem() {
      const equipped = this.hasAnyPowerUp()
        ? (this.hasAngelWings() ? 'angel_wings' : 'plant')
        : null;
      const reserved = this.reserveItem || null;
      if (!equipped && !reserved) {
        return {
          swapped: false,
          equipped: null,
          reserveItem: null,
          prevEquipped: null,
          prevReserve: null
        };
      }
      const [nextEquipped, nextReserve] = [reserved, equipped];
      this.clearAllPowerUps();
      if (nextEquipped) {
        this.equipPowerUp(nextEquipped);
      }
      this.reserveItem = nextReserve;
      return {
        swapped: true,
        equipped: nextEquipped,
        reserveItem: nextReserve,
        prevEquipped: equipped,
        prevReserve: reserved
      };
    }

    /**
     * Regla directa de recolección de power-up sobre Player:
     * 1) Sin poder equipado -> equipa el nuevo.
     * 2) Con poder equipado y Reserva vacía -> conserva el equipado y guarda el nuevo en reserveItem.
     * 3) Ambos ocupados -> devuelve status 'full' para otorgar +500 PTS sin desaparecer en vano.
     */
    collectPowerup(rawType) {
      const itemType = rawType && typeof rawType === 'object' ? rawType.type : rawType;
      const isReserveDrop = Boolean(
        (rawType && typeof rawType === 'object' && rawType.isReserveDrop) || arguments[1]
      );
      const newType = itemType === 'electric_shield' || itemType === 'calamares' ? 'plant' : itemType;
      if (newType !== 'angel_wings' && newType !== 'plant') {
        return { status: 'ignored', equipped: this.activePowerUp, reserveItem: this.reserveItem };
      }
      if (isReserveDrop) {
        const currentEquipped = this.hasAnyPowerUp()
          ? (this.activePowerUp || (this.hasAngelWings() ? 'angel_wings' : 'plant'))
          : null;
        this.equipPowerUp(newType);
        this.reserveItem = currentEquipped;
        return {
          status: currentEquipped ? 'swapped' : 'equipped',
          equipped: this.activePowerUp,
          reserveItem: this.reserveItem,
          message: currentEquipped ? '¡INTERCAMBIO REALIZADO!' : '✨ ¡EQUIPADO DE RESERVA!'
        };
      }
      if (!this.hasAnyPowerUp()) {
        this.equipPowerUp(newType);
        return { status: 'equipped', equipped: this.activePowerUp, reserveItem: this.reserveItem };
      }
      if (!this.reserveItem) {
        this.reserveItem = newType;
        return { status: 'stored', equipped: this.activePowerUp, reserveItem: this.reserveItem };
      }
      return { status: 'full', equipped: this.activePowerUp, reserveItem: this.reserveItem };
    }

    respawn(x, y) {
      this.x = x !== undefined ? x : this.spawnX;
      this.y = y !== undefined ? y : this.spawnY;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.standingPlatform = null;
      this.invincibleTimer = 1.5;
      this.hurtTimer = 0;
      this.isGroundPounding = false;
      this.justLandedGroundPoundThisFrame = false;
      this.poseTimer = 0;
      this.jumpsUsed = 0;
      this.state = 'active';
      this.hiddenInMetro = false;
    }

    /**
     * SISTEMA DE ARMADURA / ESCUDO:
     * Si el jugador recibe daño teniendo un power-up equipado, NO pierde corazones;
     * rompe el power-up activo (brokeShield = true) y vuelve al estado normal,
     * conservando intacto cualquier ítem guardado en la Caja de Reserva [W].
     */
    takeDamage(sourceX, sound, particles, isSwarm = false, reserveCallbacks = null) {
      if (this.ghostMode || this.invincibleTimer > 0 || this.isGroundPounding) {
        return { damaged: false, lostHeart: false, brokeShield: false };
      }
      if (this.stompGraceTimer > 0) {
        return { damaged: false, lostHeart: false, brokeShield: false };
      }

      const savedReserve = (reserveCallbacks && reserveCallbacks.reserveItem) || this.reserveItem || null;
      if (savedReserve) {
        this.reserveItem = null;
        if (reserveCallbacks && typeof reserveCallbacks.onConsumeReserve === 'function') {
          reserveCallbacks.onConsumeReserve(savedReserve);
        }
        this.equipPowerUp(savedReserve);
        this.invincibleTimer = isSwarm ? 0.22 : 1.0;
        this.hurtTimer = 0.25;
        this.vy = isSwarm ? -180 : -240;
        this.vx = this.x < sourceX ? -160 : 160;
        if (sound) sound.powerup();
        if (particles) {
          particles.Burst(this.x + this.w / 2, this.y + this.h / 2, '#fde047', 24);
          particles.FloatingText(this.x - 36, this.y - 12, '📦 ¡SALVAVIDAS [SHIFT] EQUIPADO!', '#fde047');
        }
        return {
          damaged: false,
          lostHeart: false,
          brokeShield: false,
          usedReserve: true,
          equippedType: savedReserve
        };
      }

      this.invincibleTimer = isSwarm ? 0.22 : 1.0;
      this.hurtTimer = 0.25;
      this.vy = isSwarm ? -210 : -300;
      this.vx = this.x < sourceX ? -200 : 200;

      if (this.hasAnyPowerUp()) {
        const brokenType = this.activePowerUp;
        this.clearAllPowerUps();
        if (sound) sound.shieldBreak();
        if (particles) {
          particles.Burst(this.x + this.w / 2, this.y + this.h / 2, '#38bdf8', 22);
          particles.FloatingText(this.x - 30, this.y - 10, '🛡️ ¡POWER-UP PERDIDO!', '#38bdf8');
        }
        return { damaged: true, lostHeart: false, brokeShield: true, brokenType };
      }

      this.hearts--;
      if (sound) sound.hurt();
      if (particles) {
        particles.Burst(this.x + this.w / 2, this.y + this.h / 2, '#f43f5e', 18);
      }
      return { damaged: true, lostHeart: true, brokeShield: false };
    }

    update(dt, input, solids, movingPlatforms, sound, particles, companions, callbacks, windForceX = 0, physicsModifiers = null) {
      if (this.state === 'entering_metro') return;
      const inputApi = global.Input;
      const controlScheme =
        inputApi && typeof inputApi.getControlScheme === 'function'
          ? inputApi.getControlScheme()
          : null;
      const isActionDown = (actionKey) =>
        Boolean(
          controlScheme &&
            inputApi &&
            typeof inputApi.isDown === 'function' &&
            inputApi.isDown(controlScheme[actionKey])
        );
      const moveLeftDown = Boolean(input.left || isActionDown('left'));
      const moveRightDown = Boolean(input.right || isActionDown('right'));
      const downActive = Boolean(input.down || isActionDown('down'));
      const jumpActive = Boolean(input.jump || input.jumpHeld || isActionDown('jump'));
      input.down = downActive;
      input.jump = jumpActive;

      this.prevY = this.y;
      this.prevBottom = this.y + this.h;
      if (this.invincibleTimer > 0) this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
      if (this.stompGraceTimer > 0) this.stompGraceTimer = Math.max(0, this.stompGraceTimer - dt);
      if (this.hurtTimer > 0) this.hurtTimer = Math.max(0, this.hurtTimer - dt);
      this.justLandedGroundPoundThisFrame = false;
      if (this.abilityCooldown > 0) this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
      if (this.poseTimer > 0) this.poseTimer = Math.max(0, this.poseTimer - dt);
      if (this.wingFlapTimer > 0) this.wingFlapTimer = Math.max(0, this.wingFlapTimer - dt);
      if (this.shootCooldown > 0) this.shootCooldown = Math.max(0, this.shootCooldown - dt);
      if (this.ropeCooldown > 0) this.ropeCooldown = Math.max(0, this.ropeCooldown - dt);

      // Desplazamiento horizontal colgado de soga de ropa, cable, zipline o liana
      if (this.hangingRope) {
        const rope = this.hangingRope;
        let ropeDir = 0;
        if (typeof input.analogX === 'number' && Math.abs(input.analogX) > 0.18) {
          ropeDir = Math.sign(input.analogX);
        } else {
          if (moveLeftDown) ropeDir -= 1;
          if (moveRightDown) ropeDir += 1;
        }
        this.vx = ropeDir * 215;
        this.x += this.vx * dt;
        if (ropeDir !== 0) this.facing = ropeDir > 0 ? 'right' : 'left';
        const cx = this.x + this.w * 0.5;
        this.y = rope.getYAt(cx) + HANG_ANCHOR_OFFSET;
        this.vy = 0;
        this.onGround = false;
        this.isHanging = true;
        this.jumpsUsed = 0;

        const jumpNow = jumpActive && !this.wasJumpDown;
        this.wasJumpDown = jumpActive;
        if (jumpNow || input.jumpPressed) {
          this.vy = JUMP_FORCE * 0.94;
          clearActorHangingState(this);
          this.ropeCooldown = 0.28;
          this.jumpsUsed = 1;
          this.jumpHeld = true;
          this.animState = 'jump';
          if (sound) sound.jump(1);
          if (particles) particles.Dust(this.x + this.w * 0.5, this.y + this.h);
        } else if (input.downPressed || cx < rope.x1 - 4 || cx > rope.x2 + 4) {
          clearActorHangingState(this);
          this.ropeCooldown = 0.28;
          this.animState = 'fall';
        } else {
          this.animState = resolveHangingAnimState(this);
        }
        this.animTimer += dt;
        return;
      }

      if (this.hasPlant() && particles && Math.random() < 0.35) {
        particles.Sparkle(this.x + Math.random() * this.w, this.y + Math.random() * this.h, '#4ade80');
      }
      if (this.smoothieTimer > 0) {
        this.smoothieTimer = Math.max(0, this.smoothieTimer - dt);
        if (particles && Math.random() < 0.4) {
          particles.Sparkle(this.x + Math.random() * this.w, this.y + Math.random() * this.h, '#f43f5e');
        }
      }
      if (this.slowTimer > 0) {
        this.slowTimer = Math.max(0, this.slowTimer - dt);
        if (particles && Math.random() < 0.35) {
          particles.Sparkle(this.x + Math.random() * this.w, this.y + Math.random() * this.h, '#bae6fd');
        }
      }

      applyStandingPlatformDisplacement(this, dt);
      if (this.dropThroughTimer > 0) {
        this.dropThroughTimer = Math.max(0, this.dropThroughTimer - dt);
      }

      // Sobre plataformas atravesables (one-way):
      // - Solo ↓ (Abajo): el líder se agacha encima de la viga sin atravesarla.
      // - ↓ + Salto: desciende atravesando la viga sin ejecutar salto.
      const jumpPressedThisStep = Boolean(input.jumpPressed || (jumpActive && !this.wasJumpDown));
      let droppedThroughOneWay = false;
      if (
        this.onGround &&
        this.standingPlatform &&
        this.standingPlatform.oneWay &&
        input.down &&
        jumpPressedThisStep &&
        !this.isGroundPounding
      ) {
        this.dropThroughTimer = 0.24;
        this.onGround = false;
        this.standingPlatform = null;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.isCrouching = false;
        this.y += 4;
        this.vy = Math.max(this.vy, 90, (this.platformVy || 0) + 110);
        droppedThroughOneWay = true;
      }

      const wantsCrouch =
        !droppedThroughOneWay && this.onGround && downActive && !this.isGroundPounding;
      let ceilingBlocked = false;
      if (!wantsCrouch && this.isCrouching && this.onGround) {
        const headTop = this.y;
        const crouchTop = this.y + 18;
        for (let i = 0; i < solids.length; i++) {
          const p = solids[i];
          if (p.oneWay) continue;
          if (
            this.x + 2 < p.x + p.w &&
            this.x + this.w - 2 > p.x &&
            headTop < p.y + p.h &&
            crouchTop > p.y
          ) {
            ceilingBlocked = true;
            break;
          }
        }
      }
      this.isCrouching = wantsCrouch || ceilingBlocked;

      // --- HABILIDAD ESPECIAL DE NICO: Terremoto (Tecla A): en aire = Ground Pound; en suelo = onda sísmica ---
      if (
        this.characterKey === 'nico' &&
        !this.isGroundPounding &&
        this.abilityCooldown <= 0 &&
        input.skillPressed
      ) {
        if (!this.onGround) {
          this.isGroundPounding = true;
          this.vx = 0;
          this.vy = GROUND_POUND_SPEED;
          if (sound) sound.groundPoundStart();
        } else {
          this.poseTimer = 0.28;
          this.abilityCooldown = this.abilityMaxCooldown;
          if (sound) sound.earthquakeImpact();
          if (callbacks && callbacks.onEarthquake) {
            callbacks.onEarthquake(this.x + this.w * 0.5, this.y + this.h);
          }
        }
      }

      // --- HABILIDAD ESPECIAL DE ANDREA: Pose Hipnótica (Tecla A / botón HAB) ---
      if (
        this.characterKey === 'andrea' &&
        this.abilityCooldown <= 0 &&
        input.skillPressed
      ) {
        this.poseTimer = 0.48;
        this.abilityCooldown = this.abilityMaxCooldown;
        if (sound) sound.hypnoticPose();
        if (callbacks && callbacks.onHypnoticPose) {
          callbacks.onHypnoticPose(this.x + this.w * 0.5, this.y + this.h * 0.45);
        }
      }

      const speedMult =
        (this.hasSmoothie() ? 1.45 : 1.0) *
        (this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0);
      const jumpScale = this.slowTimer > 0 ? SLOW_JUMP_FACTOR : 1.0;
      const moveSpeed = BASE_SPEED * speedMult;

      if (this.isGroundPounding) {
        this.vx = 0;
        this.vy = GROUND_POUND_SPEED;
        if (particles) {
          particles.Sparkle(this.x + Math.random() * this.w, this.y, '#fbbf24');
        }
      } else if (this.hurtTimer <= 0) {
        let dir = 0;
        if (typeof input.analogX === 'number' && Math.abs(input.analogX) > 0.15) {
          // Soporte suave de Joystick Analógico: inclinación gradual y velocidad plena a partir del 60%
          const scaled = Math.sign(input.analogX) * Math.min(1, Math.abs(input.analogX) / 0.65);
          dir = scaled;
        } else {
          if (moveLeftDown) dir -= 1;
          if (moveRightDown) dir += 1;
        }

        const isSandGround = !!(physicsModifiers && physicsModifiers.sandMode && this.onGround);
        const isIceGround = !!(
          physicsModifiers &&
          (physicsModifiers.isIceLevel || physicsModifiers.iceMode) &&
          this.onGround &&
          !isSandGround
        );
        const isSaltGround = !!(
          this.onGround &&
          !isSandGround &&
          !isIceGround &&
          ((physicsModifiers && physicsModifiers.saltMode) ||
            (this.standingPlatform && this.standingPlatform.style === 'salt'))
        );

        if (isIceGround) {
          // Física unificada de hielo en Ushuaia: gobierna de pie, agachado, arranque y contrafrenado
          // Fricción mínima idéntica (~0.965 por frame a 60 Hz) tanto de pie como agachado
          const iceFriction = Math.pow(0.965, dt * 60);
          const inputX =
            this.isCrouching || Math.abs(dir) <= 0.05 ? 0 : Math.max(-1, Math.min(1, dir));
          const maxIceVx = moveSpeed * 1.05;
          const iceAccel = moveSpeed * 1.75;        // Tracción gradual sobre hielo (~420 px/s^2)
          const iceCounterBrake = moveSpeed * 4.25; // Contrafrenado ~2.5x-3x respecto a fricción pasiva promedio

          if (inputX === 0) {
            this.vx *= iceFriction;
            if (Math.abs(this.vx) < 0.05) {
              this.vx *= 0.5;
            }
            if (
              particles &&
              Math.abs(this.vx) > 28 &&
              Math.random() < (this.isCrouching ? 0.72 : 0.42)
            ) {
              const trailX = this.vx > 0 ? this.x + 5 : this.x + this.w - 5;
              particles.Sparkle(
                trailX,
                this.y + this.h - 2,
                Math.random() < 0.65 ? '#ffffff' : '#e0f2fe'
              );
            }
            if (this.isCrouching && Math.abs(dir) > 0.05) {
              this.facing = dir > 0 ? 'right' : 'left';
            }
          } else if (Math.sign(inputX) !== Math.sign(this.vx) && Math.abs(this.vx) > 0.2) {
            // Contrafrenado progresivo con nieve/escarcha hasta frenar antes de invertir marcha
            const deltaBrake = inputX * iceCounterBrake * dt;
            if (Math.abs(deltaBrake) >= Math.abs(this.vx)) {
              const fracUsed = Math.abs(this.vx) / Math.abs(deltaBrake);
              this.vx = inputX * iceAccel * dt * (1 - fracUsed);
            } else {
              this.vx += deltaBrake;
            }
            this.facing = inputX > 0 ? 'right' : 'left';
            if (particles) {
              for (let sp = 0; sp < 2; sp++) {
                particles.Sparkle(
                  this.x + this.w * 0.5 + (Math.random() - 0.5) * 14,
                  this.y + this.h - 2,
                  Math.random() < 0.78 ? '#ffffff' : '#e0f2fe'
                );
              }
            }
          } else {
            // Tracción gradual en la dirección pulsada hasta velocidad máxima
            this.vx += inputX * iceAccel * dt;
            if (Math.abs(this.vx) > maxIceVx) {
              this.vx = Math.sign(this.vx) * maxIceVx;
            }
            this.facing = inputX > 0 ? 'right' : 'left';
            if (particles && Math.random() < 0.34) {
              particles.Sparkle(
                this.x + (inputX > 0 ? 4 : this.w - 4),
                this.y + this.h - 2,
                Math.random() < 0.45 ? '#ffffff' : '#bae6fd'
              );
            }
          }
        } else if (this.isCrouching && this.onGround) {
          this.vx = 0;
          if (Math.abs(dir) > 0.05) {
            this.facing = dir > 0 ? 'right' : 'left';
          }
        } else if (Math.abs(dir) > 0.05) {
          if (isSandGround) {
            const targetVx = dir * moveSpeed * 0.88;
            const sandAccel = 1 - Math.exp(-dt * 5.2);
            this.vx += (targetVx - this.vx) * sandAccel;
            if (particles && Math.random() < 0.35) {
              particles.Sparkle(
                this.x + (dir > 0 ? 4 : this.w - 4),
                this.y + this.h - 2,
                '#fbbf24'
              );
            }
          } else if (isSaltGround) {
            // Salar de Atacama: costra de sal blanca cristalina con deslizamiento ligero y chispas salinas
            const targetVx = dir * moveSpeed * 1.1;
            const saltAccel = 1 - Math.exp(-dt * 7.6);
            this.vx += (targetVx - this.vx) * saltAccel;
            if (particles && Math.random() < 0.34) {
              particles.Sparkle(
                this.x + (dir > 0 ? 4 : this.w - 4),
                this.y + this.h - 2,
                Math.random() < 0.5 ? '#f8fafc' : '#e0f2fe'
              );
            }
          } else {
            this.vx = dir * moveSpeed;
          }
          this.facing = dir > 0 ? 'right' : 'left';
        } else {
          if (isSaltGround) {
            this.vx *= Math.pow(0.16, dt);
          } else if (isSandGround) {
            this.vx *= Math.pow(0.045, dt);
          } else {
            this.vx *= Math.pow(0.001, dt);
          }
          if (Math.abs(this.vx) < 8) this.vx = 0;
        }

        // Viento Costero Interactivo (Niveles 2 y 3 de Palma): altera la inercia en el aire
        if (!this.onGround && !this.isGroundPounding && windForceX !== 0) {
          if (Math.abs(dir) > 0.05) {
            this.vx += windForceX;
          } else {
            this.vx += (windForceX - this.vx * 2.5) * dt * 2.2;
          }
        }
      }

      // Recarga de saltos ÚNICAMENTE al volver a tocar suelo firme
      if (this.onGround) {
        this.coyoteTimer = 0.11;
        this.jumpsUsed = 0;
      } else {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      }

      const jumpPressedNow =
        !droppedThroughOneWay && Boolean(input.jumpPressed || (jumpActive && !this.wasJumpDown));
      if (jumpPressedNow) {
        this.jumpBufferTimer = 0.11;
      } else {
        this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
      }

      // Ejecución de salto:
      // - Salto base (1er salto) desde suelo o coyote time
      // - Impulsos aéreos 2do y 3er salto SOLO si tiene Alas de Ángel activas
      if (!droppedThroughOneWay && this.jumpBufferTimer > 0 && !this.isGroundPounding) {
        if (this.coyoteTimer > 0 && this.jumpsUsed === 0) {
          const inertiaVy = captureJumpPlatformInertia(this);
          this.vy = JUMP_FORCE * jumpScale + inertiaVy;
          this.onGround = false;
          this.coyoteTimer = 0;
          this.jumpBufferTimer = 0;
          this.standingPlatform = null;
          this.jumpsUsed = 1;
          this.jumpHeld = true;
          if (sound) sound.jump(1);
          if (companions) {
            companions.forEach((c) => {
              if (c.isGrounded) c.queueJump();
            });
          }
          if (particles) particles.Dust(this.x + this.w / 2, this.y + this.h);
        } else if (this.hasAngelWings() && this.jumpsUsed < this.getMaxJumps()) {
          // Si saltó después de caer de un borde sin saltar, cuenta como el 2do salto
          if (this.jumpsUsed === 0) this.jumpsUsed = 1;
          this.jumpsUsed++;
          this.vy = ANGEL_WING_JUMP_FORCE * jumpScale;
          this.jumpBufferTimer = 0;
          this.jumpHeld = true;
          this.wingFlapTimer = 0.35;
          if (sound) sound.jump(this.jumpsUsed);
          if (companions) {
            companions.forEach((c) => {
              if (c.isGrounded) c.queueJump();
            });
          }
          if (particles) {
            particles.FeatherBurst(this.x + this.w * 0.5, this.y + this.h * 0.6);
          }
        }
      }

      if (!input.jump && this.jumpHeld && this.vy < -210) {
        this.vy *= 0.52;
        this.jumpHeld = false;
      }
      this.wasJumpDown = Boolean(input.jump || droppedThroughOneWay);

      if (!this.isGroundPounding) {
        this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
      }

      const allPlatforms = solids.concat(movingPlatforms);

      // --- Resolver Eje X ---
      if (!this.isGroundPounding) {
        applyAirPlatformInertia(this, dt);
      }
      this.x += this.vx * dt;
      if (this.x < 0) {
        this.x = 0;
        this.vx = 0;
      }

      const bodyTopX = this.isCrouching ? this.y + 18 : this.y;
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (p.oneWay) continue;
        if (
          this.x < p.x + p.w &&
          this.x + this.w > p.x &&
          bodyTopX + 4 < p.y + p.h &&
          this.y + this.h - 4 > p.y
        ) {
          const footOverlap = (this.y + this.h) - p.y;
          if (this.vy >= 0 && footOverlap > 0 && footOverlap <= 5) {
            this.y = p.y - this.h;
          } else if (this.vx > 0) {
            this.x = p.x - this.w;
            this.vx = 0;
          } else if (this.vx < 0) {
            this.x = p.x + p.w;
            this.vx = 0;
          }
        }
      }

      // --- Resolver Eje Y ---
      const prevBottom = this.y + this.h;
      const crouchOffsetY = this.isCrouching ? 18 : 0;
      const prevBodyTopY = this.y + crouchOffsetY;
      this.y += this.vy * dt;
      const wasGroundPounding = this.isGroundPounding;
      this.onGround = false;
      this.standingPlatform = null;

      // Detección de Bloques Ocultos / Invisibles al golpearlos desde abajo
      const hiddenBlocks =
        physicsModifiers && Array.isArray(physicsModifiers.hiddenBlocks)
          ? physicsModifiers.hiddenBlocks
          : null;
      if (hiddenBlocks && this.vy < 0) {
        const curBodyTopY = this.y + crouchOffsetY;
        for (let i = 0; i < hiddenBlocks.length; i++) {
          const hb = hiddenBlocks[i];
          if (!hb || hb.revealed || hb.hit || hb.used || hb.empty) continue;
          if (
            this.x + 2 < hb.x + hb.w &&
            this.x + this.w - 2 > hb.x &&
            prevBodyTopY >= hb.y + hb.h - 12 &&
            curBodyTopY < hb.y + hb.h
          ) {
            this.y = hb.y + hb.h - crouchOffsetY;
            this.vy = 0;
            const info = typeof hb.reveal === 'function' ? hb.reveal(particles, sound) : null;
            if (callbacks && typeof callbacks.onRevealHiddenBlock === 'function') {
              callbacks.onRevealHiddenBlock(hb, info);
            }
            break;
          }
        }
      }

      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (p.state === 'respawning') continue;
        if (this.x + 2 < p.x + p.w && this.x + this.w - 2 > p.x) {
          const dyUp = Math.max(0, -(p.dy || 0));
          const dyDown = Math.max(0, p.dy || 0);
          if (p.oneWay) {
            if (this.dropThroughTimer > 0) continue;
            if (
              this.vy >= 0 &&
              prevBottom <= p.y + 16 + dyUp + dyDown * 1.5 &&
              this.y + this.h >= p.y &&
              this.y + this.h <= p.y + 30 + dyUp + dyDown * 1.5
            ) {
              this.y = p.y - this.h;
              this.vy = 0;
              this.onGround = true;
              this.airPlatformVx = 0;
              this.jumpsUsed = 0;
              this.standingPlatform = p;
              if (p.isMoving || p.isFallingPlatform) {
                if (p.onSteppedOn) p.onSteppedOn();
              }
            }
          } else {
            const bodyTopY = this.y + crouchOffsetY;
            if (bodyTopY < p.y + p.h && this.y + this.h > p.y) {
              if (this.vy >= 0 && prevBottom <= p.y + 18 + dyUp + dyDown * 1.5) {
                this.y = p.y - this.h;
                this.vy = 0;
                this.onGround = true;
                this.airPlatformVx = 0;
                this.jumpsUsed = 0;
                if (p.isMoving || p.isFallingPlatform) {
                  this.standingPlatform = p;
                  if (p.onSteppedOn) p.onSteppedOn();
                }
              } else if (this.vy < 0 && (bodyTopY >= p.y + p.h - 18 || prevBodyTopY >= p.y + p.h - 12)) {
                this.y = p.y + p.h - crouchOffsetY;
                this.vy = 0;
                if (p.isHiddenBlock) {
                  if (!p.hit && !p.used && !p.empty && typeof p.reveal === 'function') {
                    const info = p.reveal(particles, sound);
                    if (callbacks && typeof callbacks.onRevealHiddenBlock === 'function') {
                      callbacks.onRevealHiddenBlock(p, info);
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Agarre automático a sogas horizontales de Caminito al cruzarse en el aire
      const ropes = physicsModifiers && Array.isArray(physicsModifiers.ropes) ? physicsModifiers.ropes : null;
      if (ropes && !this.onGround && !this.isGroundPounding && this.ropeCooldown <= 0 && this.vy >= -120) {
        const cx = this.x + this.w * 0.5;
        for (let i = 0; i < ropes.length; i++) {
          const r = ropes[i];
          if (cx >= r.x1 + 4 && cx <= r.x2 - 4) {
            const ry = r.getYAt(cx);
            if (Math.abs((this.y + 8) - ry) <= 18) {
              this.hangingRope = r;
              this.isHanging = true;
              this.y = ry + HANG_ANCHOR_OFFSET;
              this.vy = 0;
              this.vx = 0;
              this.jumpsUsed = 0;
              this.animState = 'hang';
              if (sound) sound.menuSelect();
              return;
            }
          }
        }
      }

      // Impacto sísmico del Terremoto de Nico
      if (wasGroundPounding && this.onGround) {
        this.isGroundPounding = false;
        this.justLandedGroundPoundThisFrame = true;
        this.abilityCooldown = this.abilityMaxCooldown;
        if (sound) sound.earthquakeImpact();
        if (callbacks && callbacks.onEarthquake) {
          callbacks.onEarthquake(this.x + this.w * 0.5, this.y + this.h);
        }
      }

      const hangingActive = isActorHanging(this);
      this.isHanging = hangingActive;
      this.animTimer += dt;
      if (this.isGroundPounding) {
        this.animState = 'groundPound';
      } else if (this.poseTimer > 0) {
        this.animState = 'pose';
      } else if (this.hurtTimer > 0) {
        this.animState = 'hurt';
      } else if (hangingActive && !this.onGround) {
        this.animState = resolveHangingAnimState(this);
      } else if (!this.onGround) {
        this.animState = this.vy < 0 ? 'jump' : 'fall';
      } else if (this.isCrouching) {
        this.animState = 'crouch';
      } else if (Math.abs(this.vx) > 15) {
        this.animState = 'run';
      } else {
        this.animState = 'idle';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.hiddenInMetro) return;
      if (!this.dead && this.state !== 'entering_metro') {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);

        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 18) % 2 === 0) {
          return;
        }
      }

      const screenX = this.x - cameraX;
      const screenY = this.y;
      const cx = screenX + this.w * 0.5;
      const cy = screenY + this.h * 0.5;
      const applyGhostAlpha = Boolean(this.ghostMode && !this.dead);
      if (applyGhostAlpha) {
        ctx.save();
        ctx.globalAlpha *= 0.65;
      }

      // Iluminación radial de Escudo / Power-Ups activos
      if (this.hasAnyPowerUp()) {
        ctx.save();
        const pulse = 0.45 + 0.2 * Math.sin(performance.now() * 0.014);
        const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 44);
        if (this.hasPlant()) {
          grad.addColorStop(0, `rgba(74, 222, 128, ${pulse})`);
          grad.addColorStop(0.65, `rgba(34, 197, 94, ${pulse * 0.7})`);
          grad.addColorStop(1, 'rgba(22, 163, 74, 0)');
        } else if (this.hasAngelWings()) {
          grad.addColorStop(0, `rgba(254, 240, 138, ${pulse})`);
          grad.addColorStop(0.65, `rgba(186, 230, 253, ${pulse * 0.6})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          grad.addColorStop(0, `rgba(251, 113, 133, ${pulse})`);
          grad.addColorStop(1, 'rgba(251, 113, 133, 0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const drawAnimState = this.dead
        ? 'dead'
        : isActorHanging(this) && !this.onGround && !this.isGroundPounding && this.hurtTimer <= 0
          ? resolveHangingAnimState(this)
          : this.animState;

      // Dibujar personaje HD con articulación fluida
      sprites.drawCharacterHD(
        ctx,
        this.characterKey,
        screenX,
        screenY,
        this.facing,
        drawAnimState,
        this.animTimer,
        this.dead ? false : this.hasAngelWings(),
        this.wingFlapTimer
      );

      // Aire helado del Pingüino Pecho Frío: aura celeste mientras dura la ralentización
      if (this.slowTimer > 0 && !this.dead) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.55, 0.2 + this.slowTimer * 0.18);
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.w * 0.78, this.h * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Indicador visual cuando tiene el Power-Up Botánico (Orquídea en Maceta — Tecla D) activo
      if (this.hasPlant() && this.state !== 'entering_metro') {
        ctx.save();
        const orbX = this.facing === 'right' ? screenX + this.w + 8 : screenX - 8;
        const orbY = screenY + 20 + Math.sin(this.animTimer * 8) * 2.5;
        ctx.translate(orbX, orbY);
        if (sprites && typeof sprites.drawOrchidPotGraphic === 'function') {
          sprites.drawOrchidPotGraphic(ctx, 0.58);
        }
        ctx.restore();
      }

      // Indicador de Líder e impulsos restantes de Triple Salto (oculto durante descenso al Metro)
      if (this.state !== 'entering_metro') {
        ctx.save();
        const arrowY = screenY - 12 + Math.sin(this.animTimer * 6) * 2;
        ctx.fillStyle = this.hasPlant()
          ? '#4ade80'
          : this.hasAngelWings()
            ? '#38bdf8'
            : '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(cx - 4, arrowY);
        ctx.lineTo(cx + 4, arrowY);
        ctx.lineTo(cx, arrowY + 5);
        ctx.closePath();
        ctx.fill();

        if (this.hasAngelWings()) {
          const jumpsLeft = Math.max(0, 3 - this.jumpsUsed);
          for (let j = 0; j < 3; j++) {
            ctx.fillStyle = j < jumpsLeft ? '#fef08a' : 'rgba(148, 163, 184, 0.4)';
            ctx.beginPath();
            ctx.arc(cx - 8 + j * 8, arrowY - 5, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      if (applyGhostAlpha) {
        ctx.restore();
      }
    }

    drawElectricFieldArcs(ctx, cx, cy) {
      ctx.save();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(cx, cy, ELECTRIC_FIELD_RADIUS * 0.72, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.stroke();

      // 4 Arcos de rayos quebrados dinámicos a 60 FPS
      for (let b = 0; b < 4; b++) {
        const baseAngle = this.animTimer * 8 + (b * Math.PI) / 2;
        ctx.beginPath();
        for (let s = 0; s <= 6; s++) {
          const ang = baseAngle + (s / 6) * 1.1;
          const jitter = (Math.random() - 0.5) * 12;
          const rad = ELECTRIC_FIELD_RADIUS * 0.68 + jitter;
          const px = cx + Math.cos(ang) * rad;
          const py = cy + Math.sin(ang) * rad;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = b % 2 === 0 ? '#fde047' : '#38bdf8';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /**
   * Encuentra la superficie continua de apoyo debajo de un actor (suelo o plataforma activa),
   * uniendo tramos estáticos contiguos al mismo nivel Y para detectar sus bordes reales.
   */
  function findSupportingSurfaceSpan(actor, allPlatforms) {
    if (!actor || !allPlatforms || allPlatforms.length === 0) return null;

    const actorBottom = actor.y + actor.h;
    const footLeft = actor.x + 3;
    const footRight = actor.x + actor.w - 3;

    const isUsable = (p) =>
      Boolean(p && p.state !== 'respawning' && !p.isBroken && !p.isCeiling);

    let basePlat = null;
    if (
      actor.standingPlatform &&
      isUsable(actor.standingPlatform) &&
      footRight > actor.standingPlatform.x &&
      footLeft < actor.standingPlatform.x + actor.standingPlatform.w &&
      Math.abs(actorBottom - actor.standingPlatform.y) <= 10
    ) {
      basePlat = actor.standingPlatform;
    }

    if (!basePlat) {
      let bestDy = 10;
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!isUsable(p)) continue;
        if (footRight <= p.x || footLeft >= p.x + p.w) continue;
        const dy = Math.abs(actorBottom - p.y);
        if (dy <= bestDy) {
          bestDy = dy;
          basePlat = p;
        }
      }
    }

    if (!basePlat) return null;

    let left = basePlat.x;
    let right = basePlat.x + basePlat.w;
    const y = basePlat.y;

    // Las plataformas móviles o que caen conservan su ancho real sin fusionarse con suelo cercano
    if (!basePlat.isMoving && !basePlat.isFallingPlatform) {
      let expanded = true;
      while (expanded) {
        expanded = false;
        for (let i = 0; i < allPlatforms.length; i++) {
          const q = allPlatforms[i];
          if (!isUsable(q) || q.isMoving || q.isFallingPlatform) continue;
          if (Math.abs(q.y - y) > 2) continue;
          const qLeft = q.x;
          const qRight = q.x + q.w;
          if (qRight >= left - 2 && qLeft <= right + 2) {
            if (qLeft < left) {
              left = qLeft;
              expanded = true;
            }
            if (qRight > right) {
              right = qRight;
              expanded = true;
            }
          }
        }
      }
    }

    return {
      plat: basePlat,
      left,
      right,
      width: right - left,
      y,
      isMoving: Boolean(basePlat.isMoving),
      isFallingPlatform: Boolean(basePlat.isFallingPlatform),
    };
  }

  /**
   * Calcula el rango horizontal seguro [minX, maxX] sobre una superficie,
   * garantizando un margen de seguridad mínimo respecto a ambos bordes.
   */
  function getActorSafeBoundsOnSpan(span, actorW, edgeMargin = 7) {
    if (!span) return null;
    const slack = span.width - actorW;
    if (slack <= 0) {
      const centeredX = span.left + slack * 0.5;
      return { minX: centeredX, maxX: centeredX };
    }
    const margin = Math.min(edgeMargin, slack * 0.5);
    return {
      minX: span.left + margin,
      maxX: span.right - actorW - margin,
    };
  }

  function surfaceSpansMatch(a, b) {
    if (!a || !b) return false;
    if (Math.abs(a.y - b.y) > 4) return false;
    return a.right >= b.left - 4 && b.right >= a.left - 4;
  }

  /**
   * Calcula posiciones objetivo de formación (Acompañante + La Tina) detrás del Líder
   * con compresión dinámica proporcional en vigas angostas, plataformas chicas o bordes.
   */
  function computeCompanionFormationTargets(
    leader,
    allPlatforms,
    partnerW = 24,
    tinaW = 34,
    edgeMargin = 7
  ) {
    const facingRight = !leader || leader.facing !== 'left';
    const nomPartnerDx = facingRight ? -36 : 36;
    const nomTinaDx = facingRight ? -68 : 62;

    let leaderSpan = findSupportingSurfaceSpan(leader, allPlatforms);
    if (leaderSpan && leader) {
      leader._lastSurfaceSpan = leaderSpan;
    } else if (
      leader &&
      leader._lastSurfaceSpan &&
      (!allPlatforms ||
        !leader._lastSurfaceSpan.plat ||
        allPlatforms.indexOf(leader._lastSurfaceSpan.plat) !== -1) &&
      leader.x + leader.w > leader._lastSurfaceSpan.left - 24 &&
      leader.x < leader._lastSurfaceSpan.right + 24 &&
      leader.y + leader.h <= leader._lastSurfaceSpan.y + 18 &&
      (!leader._lastSurfaceSpan.plat ||
        leader._lastSurfaceSpan.plat.state !== 'respawning')
    ) {
      leaderSpan = leader._lastSurfaceSpan;
    }

    if (!leaderSpan) {
      return {
        targetPartnerX: (leader ? leader.x : 0) + nomPartnerDx,
        targetTinaX: (leader ? leader.x : 0) + nomTinaDx,
        leaderSpan: null,
        partnerSafeRange: null,
        tinaSafeRange: null,
        availableBehind: Infinity,
        scale: 1,
        compressed: false,
      };
    }

    const partnerSafe = getActorSafeBoundsOnSpan(leaderSpan, partnerW, edgeMargin);
    const tinaSafe = getActorSafeBoundsOnSpan(leaderSpan, tinaW, edgeMargin);
    const clampVal = (v, minV, maxV) => Math.max(minV, Math.min(maxV, v));

    const nominalRearDist = Math.abs(nomTinaDx);
    const availableBehind = facingRight
      ? Math.max(0, leader.x - tinaSafe.minX)
      : Math.max(0, tinaSafe.maxX - leader.x);
    const scale = Math.max(0, Math.min(1, availableBehind / nominalRearDist));

    const targetPartnerX = clampVal(
      leader.x + nomPartnerDx * scale,
      partnerSafe.minX,
      partnerSafe.maxX
    );
    const targetTinaX = clampVal(
      leader.x + nomTinaDx * scale,
      tinaSafe.minX,
      tinaSafe.maxX
    );

    return {
      targetPartnerX,
      targetTinaX,
      leaderSpan,
      partnerSafeRange: partnerSafe,
      tinaSafeRange: tinaSafe,
      availableBehind,
      scale,
      compressed: scale < 0.999,
    };
  }

  /**
   * Mantiene a los acompañantes apoyados dentro de [safeMinX, safeMaxX] cuando comparten superficie
   * con el Líder o se acomodan sobre su plataforma actual, evitando caídas por inercia en vigas.
   */
  function applyCompanionFollowEdgeGuard(actor, allPlatforms, formation, leader, targetX) {
    if (!actor || !actor.isGrounded) return;
    const compSpan = findSupportingSurfaceSpan(actor, allPlatforms);
    const compSafe = compSpan ? getActorSafeBoundsOnSpan(compSpan, actor.w, 7) : null;
    if (!compSafe) return;

    const sameSurfaceAsLeader = Boolean(
      formation.leaderSpan && surfaceSpansMatch(compSpan, formation.leaderSpan)
    );
    const leaderDroppedBelow = Boolean(leader && leader.y > actor.y + 28);
    const targetOnOwnSpan =
      targetX >= compSpan.left - 6 && targetX <= compSpan.right - actor.w + 6;

    if (sameSurfaceAsLeader || (!leaderDroppedBelow && targetOnOwnSpan)) {
      if (actor.x < compSafe.minX) {
        actor.x = compSafe.minX;
        if (actor.vx < 0) actor.vx = 0;
      } else if (actor.x > compSafe.maxX) {
        actor.x = compSafe.maxX;
        if (actor.vx > 0) actor.vx = 0;
      }
    }
  }

  // ==========================================================================
  // ACOMPAÑANTE HUMANO (ANDREA O NICO)
  // ==========================================================================
  class PartnerCompanion {
    constructor(x, y, characterKey = 'andrea') {
      this.x = x - 34;
      this.y = y;
      this.w = 24;
      this.h = 44;
      this.vx = 0;
      this.vy = 0;
      this.characterKey = characterKey;
      this.facing = 'right';
      this.onGround = false;
      this.isGrounded = false;
      this.animTimer = 0;
      this.state = 'active';
      this.hiddenInMetro = false;
      this.dropThroughTimer = 0;
      this.jumpQueue = [];
      this.standingPlatform = null;
      this.platformVx = 0;
      this.platformVy = 0;
      this.airPlatformVx = 0;
      this.hangingRope = null;
      this.ropeCooldown = 0;
      this.isHanging = false;
      this.onCable = false;
      this.onZipline = false;
      this.onVine = false;
    }

    getActiveHitbox() {
      if (this.isCrouching) {
        return { x: this.x, y: this.y + 18, w: this.w, h: this.h - 18 };
      }
      return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    jump(force = JUMP_FORCE * 0.96) {
      if (!this.isGrounded) return false;
      const inertiaVy = captureJumpPlatformInertia(this);
      this.vy = force + inertiaVy;
      this.onGround = false;
      this.isGrounded = false;
      this.standingPlatform = null;
      return true;
    }

    queueJump() {
      if (!this.isGrounded) return;
      this.jumpQueue = [0.08];
    }

    resetNear(leader, solids = null, movingPlatforms = null) {
      const allPlatforms = solids ? solids.concat(movingPlatforms || []) : null;
      const formation = allPlatforms
        ? computeCompanionFormationTargets(leader, allPlatforms, this.w, 34, 7)
        : null;
      this.x = formation ? formation.targetPartnerX : leader.x - 34;
      this.y =
        formation && formation.leaderSpan
          ? formation.leaderSpan.y - this.h
          : leader.y;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.isGrounded = false;
      this.standingPlatform = null;
      this.state = 'active';
      this.hiddenInMetro = false;
      this.dropThroughTimer = 0;
      this.jumpQueue = [];
    }

    update(dt, leader, solids, movingPlatforms) {
      this.animTimer += dt;
      if (this.dropThroughTimer > 0) {
        this.dropThroughTimer = Math.max(0, this.dropThroughTimer - dt);
      }

      applyStandingPlatformDisplacement(this, dt);

      for (let i = this.jumpQueue.length - 1; i >= 0; i--) {
        this.jumpQueue[i] -= dt;
        if (this.jumpQueue[i] <= 0) {
          this.jumpQueue.splice(i, 1);
          if (this.isGrounded) {
            this.jump(JUMP_FORCE * 0.96);
          }
        }
      }

      const allPlatforms = solids.concat(movingPlatforms);
      const formation = computeCompanionFormationTargets(
        leader,
        allPlatforms,
        this.w,
        34,
        7
      );
      const targetX = formation.targetPartnerX;
      const diffX = targetX - this.x;

      if (Math.abs(diffX) > 5) {
        const followSpeed = Math.min(410, Math.abs(diffX) * 5.6 + 110);
        this.vx = Math.sign(diffX) * followSpeed;
        this.facing = diffX > 0 ? 'right' : 'left';
      } else {
        this.vx *= 0.72;
        if (Math.abs(this.vx) < 6) this.vx = 0;
        this.facing = leader.facing;
      }

      if (this.isGrounded && leader.y + 30 < this.y && Math.abs(diffX) < 115) {
        this.jump(JUMP_FORCE);
      }

      applyAirPlatformInertia(this, dt);
      this.x += this.vx * dt;
      applyCompanionFollowEdgeGuard(this, allPlatforms, formation, leader, targetX);
      // La gravedad siempre aplica hasta que toque una superficie sólida
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);

      const prevBottom = this.y + this.h;
      this.y += this.vy * dt;
      this.onGround = false;
      this.isGrounded = false;
      this.standingPlatform = null;

      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (p.state === 'respawning') continue;
        if (p.oneWay && this.dropThroughTimer > 0) continue;
        const dyUp = Math.max(0, -(p.dy || 0));
        const dyDown = Math.max(0, p.dy || 0);
        if (
          this.x + 3 < p.x + p.w &&
          this.x + this.w - 3 > p.x &&
          this.vy >= 0 &&
          prevBottom <= p.y + 18 + dyUp + dyDown * 1.5 &&
          this.y + this.h >= p.y &&
          this.y + this.h <= p.y + 26 + dyUp + dyDown * 1.5
        ) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
          this.isGrounded = true;
          this.airPlatformVx = 0;
          if (p.isMoving || p.isFallingPlatform) this.standingPlatform = p;
        }
      }

      if (Math.abs(this.x - leader.x) > 340 || this.y > 620) {
        this.x = targetX;
        this.y =
          formation.leaderSpan
            ? formation.leaderSpan.y - this.h - 2
            : leader.y - 4;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.isGrounded = false;
        this.jumpQueue = [];
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.hiddenInMetro) return;
      if (this.state !== 'entering_metro') {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const animState =
        this.state === 'entering_metro'
          ? 'entering_metro'
          : isActorHanging(this) && !this.onGround
            ? resolveHangingAnimState(this)
            : !this.onGround
              ? this.vy < 0
                ? 'jump'
                : 'fall'
              : Math.abs(this.vx) > 18
                ? 'run'
                : 'idle';

      sprites.drawCharacterHD(
        ctx,
        this.characterKey,
        this.x - cameraX,
        this.y,
        this.facing,
        animState,
        this.animTimer,
        false,
        0
      );
    }
  }

  // ==========================================================================
  // LA TINA (Perra compañera con Gruñido Feroz [S] cada 30s e IA Autónoma
  // de búsqueda de ítems en radio 120-150px)
  // ==========================================================================
  class TinaCompanion {
    constructor(x, y) {
      this.x = x - 68;
      this.y = y + 18;
      this.w = 34;
      this.h = 26;
      this.vx = 0;
      this.vy = 0;
      this.facing = 'right';
      this.onGround = false;
      this.isGrounded = false;
      this.animTimer = 0;
      this.state = 'active';
      this.hiddenInMetro = false;
      this.growlTimer = 0;
      this.jumpQueue = [];
      this.standingPlatform = null;
      this.platformVx = 0;
      this.platformVy = 0;
      this.airPlatformVx = 0;

      // Estado de agarre y escalada en bordes (Ledge Grab)
      this.ledgeState = null; // null | 'ledge_grab' | 'climb'
      this.ledgeTimer = 0;
      this.ledgeDuration = 0;
      this.ledgePlatform = null;
      this.ledgeSide = 'left';
      this.ledgeGrabX = 0;
      this.ledgeGrabY = 0;
      this.ledgeEndX = 0;
      this.ledgeEndY = 0;
      this.ledgeCooldown = 0;

      // Cooldown de 30s para el Gruñido Feroz (Tecla G)
      this.growlCooldown = 0;
      this.growlMaxCooldown = TINA_COOLDOWN_MAX;
      this.goldenBoostTimer = 0;

      // IA de búsqueda de proximidad (120-150px), Doble Salto y Pathfinding anti-atascos
      this.detectionRadius = 142;
      this.targetItem = null;
      this.rescueItem = null;
      this.jumpsUsed = 0;
      this.maxJumps = 2;
      this.doubleJumpDone = false;
      this.stuckJumpCount = 0;
      this.headBonkCount = 0;
      this.lastJumpX = 0;
      this.lastJumpY = 0;
      this.jumpedForElevated = false;
      this.detourPlatform = null;
      this.detourSide = 'left';
      this.detourTargetX = 0;
      this.detourTimer = 0;
      this.itemSearchTimer = 0;
      this.ignoredItems = new Map();
    }

    jump(force = -510, trackingElevated = false) {
      if (!this.isGrounded || this.ledgeState) return false;
      const inertiaVy = captureJumpPlatformInertia(this);
      this.lastJumpX = this.x;
      this.lastJumpY = this.y;
      this.jumpedForElevated = Boolean(trackingElevated);
      this.vy = force + inertiaVy;
      this.onGround = false;
      this.isGrounded = false;
      this.standingPlatform = null;
      this.jumpsUsed = 1;
      this.doubleJumpDone = false;
      return true;
    }

    doubleJump(force = -485) {
      if (this.isGrounded || this.ledgeState || this.jumpsUsed >= this.maxJumps) return false;
      if (this.jumpsUsed === 0) this.jumpsUsed = 1;
      this.vy = force;
      this.jumpsUsed = this.maxJumps;
      this.doubleJumpDone = true;
      return true;
    }

    queueJump() {
      if (!this.isGrounded || this.ledgeState) return;
      this.jumpQueue = [0.14];
    }

    triggerBark() {
      this.growlTimer = 1.4;
      if (this.isGrounded) {
        this.jump(-250);
      }
    }

    canGrowl() {
      return this.growlCooldown <= 0;
    }

    activateFierceGrowl() {
      if (this.growlCooldown > 0) return false;
      this.growlCooldown = this.growlMaxCooldown;
      this.growlTimer = 1.6;
      if (this.isGrounded) {
        this.jump(-290);
      }
      return true;
    }

    resetNear(leader, solids = null, movingPlatforms = null) {
      const allPlatforms = solids ? solids.concat(movingPlatforms || []) : null;
      const formation = allPlatforms
        ? computeCompanionFormationTargets(leader, allPlatforms, 24, this.w, 7)
        : null;
      this.x = formation ? formation.targetTinaX : leader.x - 68;
      this.y =
        formation && formation.leaderSpan
          ? formation.leaderSpan.y - this.h
          : leader.y + 18;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.isGrounded = false;
      this.standingPlatform = null;
      this.jumpQueue = [];
      this.targetItem = null;
      this.ledgeState = null;
      this.ledgePlatform = null;
      this.ledgeTimer = 0;
      this.ledgeCooldown = 0;
      this.jumpsUsed = 0;
      this.doubleJumpDone = false;
      this.stuckJumpCount = 0;
      this.headBonkCount = 0;
      this.jumpedForElevated = false;
      this.detourPlatform = null;
      this.detourTimer = 0;
      this.itemSearchTimer = 0;
      this.ignoredItems.clear();
    }

    isPlatformActive(p) {
      return Boolean(p && !(p.isFallingPlatform && (p.state === 'falling' || p.state === 'respawning')));
    }

    hasSolidOverhead(allPlatforms, clearance = 56) {
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!this.isPlatformActive(p) || p.oneWay) continue;
        const pBottom = p.y + (p.h || 20);
        if (
          this.x + this.w - 4 > p.x &&
          this.x + 4 < p.x + p.w &&
          pBottom <= this.y + 4 &&
          pBottom >= this.y - clearance
        ) {
          return true;
        }
      }
      return false;
    }

    findOverheadBlockingPlatform(allPlatforms, maxHeight = 185) {
      const cx = this.x + this.w * 0.5;
      let best = null;
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!this.isPlatformActive(p)) continue;
        if (p.oneWay && this.dropThroughTimer > 0) continue;
        if (cx >= p.x - 10 && cx <= p.x + p.w + 10 && p.y < this.y + 4 && this.y - p.y <= maxHeight) {
          if (!best || (!p.oneWay && best.oneWay) || (p.oneWay === best.oneWay && p.y > best.y)) {
            best = p;
          }
        }
      }
      return best;
    }

    beginPlatformDetour(p, leader, wantedX) {
      if (!p) return;
      const margin = 16;
      const leftTarget = p.x - this.w - margin;
      const rightTarget = p.x + p.w + margin;
      const distLeft = leftTarget >= 6 ? Math.abs(this.x - leftTarget) : Infinity;
      const distRight = Math.abs(this.x - rightTarget);
      let side = distLeft <= distRight ? 'left' : 'right';
      if (Math.abs(distLeft - distRight) < 42 && Number.isFinite(wantedX) && distLeft < Infinity) {
        const biasX = leader ? (wantedX + leader.x) * 0.5 : wantedX;
        side = Math.abs(biasX - leftTarget) <= Math.abs(biasX - rightTarget) ? 'left' : 'right';
      }
      if (side === 'left' && leftTarget < 6) side = 'right';
      this.detourPlatform = p;
      this.detourSide = side;
      this.detourTargetX = side === 'left' ? Math.max(6, leftTarget) : rightTarget;
      this.detourTimer = 2.4;
    }

    findPlatformForElevatedItem(allPlatforms, item) {
      if (!item) return null;
      const cx = item.x + 12;
      let best = null;
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!this.isPlatformActive(p)) continue;
        if (p.oneWay && this.dropThroughTimer > 0) continue;
        if (
          p.y < this.y + this.h - 20 &&
          item.y + 24 <= p.y + 14 &&
          item.y >= p.y - 96 &&
          cx >= p.x - 16 &&
          cx <= p.x + p.w + 16
        ) {
          if (!best || p.y > best.y) best = p;
        }
      }
      return best;
    }

    startLedgeGrab(p, side) {
      this.ledgeState = 'ledge_grab';
      this.ledgeTimer = 0;
      this.ledgeDuration = 0.15;
      this.ledgePlatform = p;
      this.ledgeSide = side;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.isGrounded = false;
      this.jumpQueue = [];
      this.standingPlatform = p.isMoving || p.isFallingPlatform ? p : null;

      if (side === 'left') {
        this.facing = 'right';
        this.ledgeGrabX = p.x - this.w * 0.62;
        this.ledgeEndX =
          p.w >= this.w ? Math.min(p.x + p.w - this.w, p.x + 12) : p.x + (p.w - this.w) * 0.5;
      } else {
        this.facing = 'left';
        this.ledgeGrabX = p.x + p.w - this.w * 0.38;
        this.ledgeEndX =
          p.w >= this.w ? Math.max(p.x, p.x + p.w - this.w - 12) : p.x + (p.w - this.w) * 0.5;
      }
      this.ledgeGrabY = p.y - 4;
      this.ledgeEndY = p.y - this.h;
      this.x = this.ledgeGrabX;
      this.y = this.ledgeGrabY;
    }

    tryDetectLedgeGrab(allPlatforms, leader, targetX) {
      if (this.onGround || this.isGrounded || this.ledgeCooldown > 0) return false;
      // Requiere altura cerca del ápice/subida o caída, buscando ítem o al líder elevado
      const seekingElevated =
        (this.targetItem && !this.targetItem.collected && this.targetItem.y + 12 < this.y + this.h) ||
        leader.y + 24 < this.y;
      if (!seekingElevated || this.vy < -280) return false;

      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!this.isPlatformActive(p)) continue;
        if (p.oneWay && this.dropThroughTimer > 0) continue;
        // La parte superior de la hitbox (y patas delanteras) debe quedar a <16px de la superficie
        if (Math.abs(this.y - p.y) >= 16) continue;

        const nearLeft =
          this.x + this.w >= p.x - 16 &&
          this.x <= p.x + 12 &&
          (this.facing === 'right' || this.vx >= -45 || targetX >= p.x);
        const nearRight =
          this.x <= p.x + p.w + 16 &&
          this.x + this.w >= p.x + p.w - 12 &&
          (this.facing === 'left' || this.vx <= 45 || targetX <= p.x + p.w);

        if (!nearLeft && !nearRight) continue;

        // Evita falsos agarres en costuras continuas del mismo nivel
        const cornerX = nearLeft ? p.x : p.x + p.w;
        let seamFlush = false;
        for (let j = 0; j < allPlatforms.length; j++) {
          if (j === i) continue;
          const q = allPlatforms[j];
          if (!this.isPlatformActive(q) || Math.abs(q.y - p.y) > 4) continue;
          if (nearLeft && q.x + q.w >= p.x - 6 && q.x < p.x) {
            seamFlush = true;
            break;
          }
          if (nearRight && q.x <= p.x + p.w + 6 && q.x + q.w > p.x + p.w) {
            seamFlush = true;
            break;
          }
        }
        if (seamFlush || cornerX === undefined) continue;

        const side = nearLeft ? 'left' : 'right';
        this.startLedgeGrab(p, side);
        return true;
      }
      return false;
    }

    update(dt, leader, solids, movingPlatforms, collectibles) {
      this.animTimer += dt;
      if (this.dropThroughTimer > 0) this.dropThroughTimer = Math.max(0, this.dropThroughTimer - dt);
      if (this.growlTimer > 0) this.growlTimer = Math.max(0, this.growlTimer - dt);
      if (this.goldenBoostTimer > 0) this.goldenBoostTimer = Math.max(0, this.goldenBoostTimer - dt);
      if (this.growlCooldown > 0) {
        const cooldownScale = this.goldenBoostTimer > 0 ? 2.0 : 1.0;
        this.growlCooldown = Math.max(0, this.growlCooldown - dt * cooldownScale);
      }
      if (this.ledgeCooldown > 0) this.ledgeCooldown = Math.max(0, this.ledgeCooldown - dt);

      const allPlatforms = solids.concat(movingPlatforms || []);

      // Secuencia activa de agarre (ledge_grab) y escalada suave (climb)
      if (this.ledgeState) {
        const distToLeaderLedge = Math.hypot(leader.x - this.x, leader.y - this.y);
        const p = this.ledgePlatform;
        if (distToLeaderLedge > 380 || !this.isPlatformActive(p)) {
          this.ledgeState = null;
          this.ledgePlatform = null;
        } else {
          const pdx = p.dx || 0;
          const pdy = p.dy || 0;
          this.ledgeGrabX += pdx;
          this.ledgeGrabY += pdy;
          this.ledgeEndX += pdx;
          this.ledgeEndY += pdy;

          this.ledgeTimer += dt;
          if (this.ledgeState === 'ledge_grab') {
            this.x = this.ledgeGrabX;
            this.y = this.ledgeGrabY;
            this.facing = this.ledgeSide === 'left' ? 'right' : 'left';
            if (this.ledgeTimer >= this.ledgeDuration) {
              this.ledgeState = 'climb';
              this.ledgeTimer = 0;
              this.ledgeDuration = 0.22;
            }
          } else {
            const t = Math.min(1, this.ledgeTimer / this.ledgeDuration);
            const easeY = 1 - Math.pow(1 - t, 2.2);
            const easeX = t * t * (3 - 2 * t);
            this.x = this.ledgeGrabX + (this.ledgeEndX - this.ledgeGrabX) * easeX;
            this.y = this.ledgeGrabY + (this.ledgeEndY - this.ledgeGrabY) * easeY;
            if (t >= 1) {
              this.x = this.ledgeEndX;
              this.y = this.ledgeEndY;
              this.vx = 0;
              this.vy = 0;
              this.onGround = true;
              this.isGrounded = true;
              this.standingPlatform = p.isMoving || p.isFallingPlatform ? p : null;
              this.ledgeState = null;
              this.ledgePlatform = null;
              this.ledgeCooldown = 0.45;
              this.jumpsUsed = 0;
              this.doubleJumpDone = false;
              this.stuckJumpCount = 0;
              this.headBonkCount = 0;
              this.detourPlatform = null;
            }
          }
          return;
        }
      }

      applyStandingPlatformDisplacement(this, dt);

      for (let i = this.jumpQueue.length - 1; i >= 0; i--) {
        this.jumpQueue[i] -= dt;
        if (this.jumpQueue[i] <= 0) {
          this.jumpQueue.splice(i, 1);
          if (this.isGrounded && !this.detourPlatform) {
            this.jump(-515);
          }
        }
      }

      const formation = computeCompanionFormationTargets(
        leader,
        allPlatforms,
        24,
        this.w,
        7
      );

      // --- IA AUTÓNOMA DE RESCATE ILIMITADO [SHIFT] Y POWER-UPS EN PANTALLA ---
      const isPowerUpCollectible = (item) =>
        Boolean(
          item &&
            !item.collected &&
            (item.type === 'angel_wings' ||
              item.type === 'plant' ||
              item.type === 'calamares' ||
              item.type === 'electric_shield')
        );
      let activeRescue = null;
      if (collectibles && collectibles.length > 0) {
        let bestReserveDist = Infinity;
        let bestScreenDist = Infinity;
        let bestScreenItem = null;
        const myCx = this.x + this.w * 0.5;
        const myCy = this.y + this.h * 0.5;
        const leaderCx = leader.x + leader.w * 0.5;

        for (let i = 0; i < collectibles.length; i++) {
          const c = collectibles[i];
          if (!isPowerUpCollectible(c)) continue;
          const surfaceY =
            typeof c.getLandingSurfaceY === 'function'
              ? c.getLandingSurfaceY(solids, movingPlatforms)
              : 442;
          const itemCx = c.x + c.w * 0.5;
          const d = Math.hypot(itemCx - myCx, (c.y + c.h * 0.5) - myCy);

          if (c.isReserveDrop) {
            const playerDodged = Math.abs(leaderCx - itemCx) > 72;
            const landedWithoutCatch = !c.falling;
            if (landedWithoutCatch || (c.pickupDelay <= 0 && playerDodged)) {
              if (d < bestReserveDist) {
                bestReserveDist = d;
                activeRescue = c;
              }
            }
          } else if (c._seenOnScreen && c.popTimer <= 0 && c.pickupDelay <= 0) {
            if (d < bestScreenDist) {
              bestScreenDist = d;
              bestScreenItem = c;
            }
          }
        }
        if (!activeRescue && bestScreenItem) {
          activeRescue = bestScreenItem;
        }
      }
      this.rescueItem = activeRescue;

      const distToLeader = Math.hypot(leader.x - this.x, leader.y - this.y);
      const leaderMovingAwayFast =
        !this.rescueItem &&
        (distToLeader > 220 || (Math.abs(leader.vx) > 195 && distToLeader > 155));

      if (this.rescueItem) {
        if (this.targetItem !== this.rescueItem) {
          this.targetItem = this.rescueItem;
          this.itemSearchTimer = 0;
          this.stuckJumpCount = 0;
          this.headBonkCount = 0;
          this.detourPlatform = null;
        }
      } else if (leaderMovingAwayFast) {
        // Si el líder se aleja demasiado rápido, aborta la búsqueda normal y vuelve a la formación
        this.targetItem = null;
        this.itemSearchTimer = 0;
      } else if (collectibles && collectibles.length > 0) {
        if (this.targetItem && this.targetItem.collected) {
          this.targetItem = null;
          this.itemSearchTimer = 0;
          this.stuckJumpCount = 0;
          this.headBonkCount = 0;
          this.detourPlatform = null;
        }
        if (this.targetItem && !this.targetItem.collected) {
          this.itemSearchTimer += dt;
          if (this.itemSearchTimer >= 4.0) {
            // Ítem inaccesible tras 4s: cancelar búsqueda y volver junto al líder activo
            this.ignoredItems.set(this.targetItem, this.animTimer + 6.0);
            this.targetItem = null;
            this.itemSearchTimer = 0;
            this.detourPlatform = null;
            this.stuckJumpCount = 0;
            this.headBonkCount = 0;
            this.jumpedForElevated = false;
            if (distToLeader > 250) {
              this.x = formation.targetTinaX;
              this.y =
                formation.leaderSpan
                  ? formation.leaderSpan.y - this.h - 2
                  : leader.y + 14;
              this.vy = 0;
              this.vx = 0;
              this.onGround = false;
              this.isGrounded = false;
              this.jumpsUsed = 0;
              this.doubleJumpDone = false;
            }
          }
        }
        if (!this.targetItem) {
          let bestDist = this.detectionRadius;
          let bestCandidate = null;
          const myCx = this.x + this.w * 0.5;
          const myCy = this.y + this.h * 0.5;

          for (let i = 0; i < collectibles.length; i++) {
            const c = collectibles[i];
            if (c.collected || c.type === 'golden_bone' || c.type === '1up_bone') continue;
            if ((c.tinaDelayTimer || 0) > 0) continue; // Esperar 1.0s (1000 ms) antes de que La Tina corra a recogerlo
            if (c.isHighArcDrop && c.vy < 0) continue;
            const blockedUntil = this.ignoredItems.get(c) || 0;
            if (blockedUntil > this.animTimer) continue;
            const d = Math.hypot((c.x + 12) - myCx, (c.y + 12) - myCy);
            const dLeader = Math.hypot((c.x + 12) - leader.x, (c.y + 12) - leader.y);
            if (d <= bestDist && dLeader <= 210) {
              bestDist = d;
              bestCandidate = c;
            }
          }
          if (bestCandidate) {
            this.targetItem = bestCandidate;
            this.itemSearchTimer = 0;
            this.stuckJumpCount = 0;
            this.headBonkCount = 0;
          }
        }
      } else {
        this.itemSearchTimer = 0;
      }

      const hasActiveItem = Boolean(this.targetItem && !this.targetItem.collected);
      const wantedX = hasActiveItem ? this.targetItem.x : formation.targetTinaX;
      const wantedY = hasActiveItem ? this.targetItem.y : leader.y;

      let targetX = wantedX;
      let suppressVerticalJump = false;

      let itemPlat = null;
      if (this.detourPlatform) {
        this.detourTimer -= dt;
        const dp = this.detourPlatform;
        if (!this.isPlatformActive(dp) || this.detourTimer <= 0) {
          this.detourPlatform = null;
          this.stuckJumpCount = 0;
          this.headBonkCount = 0;
        } else {
          const clearedLeft =
            this.detourSide === 'left' &&
            (this.x + this.w <= dp.x - 4 || Math.abs(this.x - this.detourTargetX) <= 10);
          const clearedRight =
            this.detourSide === 'right' &&
            (this.x >= dp.x + dp.w + 4 || Math.abs(this.x - this.detourTargetX) <= 10);

          if (clearedLeft || clearedRight) {
            if (this.isGrounded) {
              this.jump(-530, true);
              targetX = this.detourSide === 'left' ? dp.x + 10 : dp.x + dp.w - this.w - 10;
              this.detourPlatform = null;
              this.stuckJumpCount = 0;
              this.headBonkCount = 0;
            } else {
              targetX = this.detourTargetX;
              suppressVerticalJump = true;
            }
          } else {
            // Desplazarse lateralmente buscando el extremo libre sin seguir saltando debajo
            targetX = this.detourTargetX;
            if (this.x + this.w > dp.x - 4 && this.x < dp.x + dp.w + 4) {
              suppressVerticalJump = true;
            }
          }
        }
      } else {
        if (hasActiveItem) {
          targetX = this.targetItem.x;
          itemPlat = this.findPlatformForElevatedItem(allPlatforms, this.targetItem);
          const verticalGap = itemPlat ? this.y + this.h - itemPlat.y : 0;

          if (itemPlat && verticalGap > 24 && (!itemPlat.oneWay || verticalGap > 74)) {
            // Si la plataforma es alta o sólida, se acerca a la esquina lateral para saltar y agarrarse al borde
            const leftLaunchX = itemPlat.x - this.w * 0.65;
            const rightLaunchX = itemPlat.x + itemPlat.w - this.w * 0.35;
            const cornerX =
              Math.abs(this.x - leftLaunchX) <= Math.abs(this.x - rightLaunchX)
                ? leftLaunchX
                : rightLaunchX;
            if (Math.abs(this.x - cornerX) <= 34) {
              if (this.isGrounded && !suppressVerticalJump) {
                this.jump(-525, true);
              }
              targetX = cornerX === leftLaunchX ? itemPlat.x + 4 : itemPlat.x + itemPlat.w - this.w - 4;
            } else {
              targetX = cornerX;
            }
          } else if (
            this.isGrounded &&
            !suppressVerticalJump &&
            this.targetItem.y + 12 < this.y &&
            Math.abs(targetX - this.x) < 75
          ) {
            const blocking = this.findOverheadBlockingPlatform(allPlatforms, 170);
            if (blocking && !blocking.oneWay && this.stuckJumpCount >= 2) {
              this.beginPlatformDetour(blocking, leader, wantedX);
              targetX = this.detourTargetX;
            } else {
              this.jump(-520, true);
            }
          }
        } else {
          targetX = wantedX;
        }
      }

      const diffX = targetX - this.x;
      if (Math.abs(diffX) > 6) {
        const followSpeed = this.rescueItem
          ? Math.min(500, Math.abs(diffX) * 6.8 + 190)
          : Math.min(410, Math.abs(diffX) * 5.4 + 105);
        this.vx = Math.sign(diffX) * followSpeed;
        this.facing = diffX > 0 ? 'right' : 'left';
      } else {
        this.vx *= 0.7;
        if (Math.abs(this.vx) < 5) this.vx = 0;
        if (!hasActiveItem && !this.detourPlatform) this.facing = leader.facing;
      }

      // Salto proactivo al rescatar el Power-Up [W] si hay un hueco o está cayendo cerca en el aire
      if (this.rescueItem && !this.detourPlatform && !suppressVerticalJump) {
        const probeX = this.x + (diffX >= 0 ? this.w + 18 : -18);
        let hasGroundAhead = false;
        for (let i = 0; i < allPlatforms.length; i++) {
          const p = allPlatforms[i];
          if (!this.isPlatformActive(p)) continue;
          if (probeX >= p.x && probeX <= p.x + p.w && Math.abs(p.y - (this.y + this.h)) <= 46) {
            hasGroundAhead = true;
            break;
          }
        }
        if (this.isGrounded && ((!hasGroundAhead && Math.abs(diffX) > 30) || (Math.abs(diffX) < 110 && this.rescueItem.y + 8 < this.y + this.h))) {
          this.jump(-525, true);
        } else if (!this.isGrounded && this.jumpsUsed === 0 && this.y > this.rescueItem.y - 6 && this.vy > 40) {
          this.doubleJump(-495);
        }
      }

      if (
        this.isGrounded &&
        !this.detourPlatform &&
        !suppressVerticalJump &&
        !hasActiveItem &&
        leader.y + 42 < this.y &&
        Math.abs(diffX) < 120
      ) {
        const blocking = this.findOverheadBlockingPlatform(allPlatforms, 175);
        if (blocking && this.stuckJumpCount >= 2) {
          this.beginPlatformDetour(blocking, leader, wantedX);
          targetX = this.detourTargetX;
        } else {
          this.jump(-515, true);
        }
      }

      // Doble Salto de Whippet en el aire cuando el objetivo (ítem o líder) está más alto
      if (
        !this.isGrounded &&
        !this.detourPlatform &&
        this.jumpsUsed === 1 &&
        this.jumpsUsed < this.maxJumps
      ) {
        const seekingHigher =
          (hasActiveItem && this.targetItem.y + 18 < this.y) ||
          (!hasActiveItem && leader.y + 36 < this.y);
        if (
          seekingHigher &&
          this.vy >= -95 &&
          this.vy <= 190 &&
          wantedY < this.y + this.h - 24 &&
          !this.hasSolidOverhead(allPlatforms, 58)
        ) {
          this.doubleJump(-485);
        }
      }

      applyAirPlatformInertia(this, dt);
      this.x += this.vx * dt;
      if (!hasActiveItem && !this.detourPlatform) {
        applyCompanionFollowEdgeGuard(this, allPlatforms, formation, leader, targetX);
      }
      // La gravedad siempre aplica hasta que la Tina toque el suelo o una plataforma
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);

      const wasGrounded = this.isGrounded;
      const prevTop = this.y;
      const prevBottom = this.y + this.h;
      this.y += this.vy * dt;
      this.onGround = false;
      this.isGrounded = false;
      this.standingPlatform = null;

      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!this.isPlatformActive(p)) continue;
        if (p.oneWay && this.dropThroughTimer > 0) continue;
        const dyUp = Math.max(0, -(p.dy || 0));
        const dyDown = Math.max(0, p.dy || 0);
        if (
          this.x + 4 < p.x + p.w &&
          this.x + this.w - 4 > p.x &&
          this.vy >= 0 &&
          prevBottom <= p.y + 16 + dyUp + dyDown * 1.5 &&
          this.y + this.h >= p.y &&
          this.y + this.h <= p.y + 24 + dyUp + dyDown * 1.5
        ) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
          this.isGrounded = true;
          this.jumpsUsed = 0;
          this.doubleJumpDone = false;
          this.airPlatformVx = 0;
          if (p.isMoving || p.isFallingPlatform) this.standingPlatform = p;
        } else if (
          !p.oneWay &&
          this.vy < 0 &&
          this.x + 4 < p.x + p.w &&
          this.x + this.w - 4 > p.x &&
          this.y < p.y + p.h &&
          prevTop >= p.y + p.h - 18
        ) {
          // Choque de cabeza contra techo sólido: evita rebote infinito y busca borde lateral
          this.y = p.y + p.h;
          this.vy = 0;
          this.headBonkCount++;
          this.stuckJumpCount++;
          if (this.stuckJumpCount >= 2 || this.headBonkCount >= 2) {
            this.beginPlatformDetour(p, leader, wantedX);
          }
        }
      }

      // Al aterrizar, evalúa si quedó atascada saltando en el mismo lugar debajo de una plataforma
      if (!wasGrounded && this.isGrounded) {
        if (this.jumpedForElevated) {
          const targetStillHigher =
            (hasActiveItem && this.targetItem.y + 18 < this.y) ||
            (!hasActiveItem && leader.y + 36 < this.y);
          if (this.y < this.lastJumpY - 18) {
            this.stuckJumpCount = 0;
            this.headBonkCount = 0;
          } else if (
            targetStillHigher &&
            this.y >= this.lastJumpY - 12 &&
            Math.abs(this.x - this.lastJumpX) < 72
          ) {
            this.stuckJumpCount++;
            if (this.stuckJumpCount >= 2 && !this.detourPlatform) {
              const blocking =
                this.findOverheadBlockingPlatform(allPlatforms, 190) || itemPlat;
              if (blocking) {
                this.beginPlatformDetour(blocking, leader, wantedX);
              }
            }
          }
        }
        this.jumpedForElevated = false;
      }

      // Detección de borde (<16px de distancia vertical a esquina lateral de plataforma)
      if (!this.isGrounded) {
        this.tryDetectLedgeGrab(allPlatforms, leader, targetX);
      }

      const rescueActive = Boolean(this.rescueItem && !this.rescueItem.collected);
      if (rescueActive && this.y > 630) {
        // Si cayó al vacío cruzando un abismo al rescatar un ítem lejano, reubicar sobre el ítem sin cancelar el rescate
        this.x = this.rescueItem.x;
        this.y = Math.max(40, this.rescueItem.y - 24);
        this.vy = 0;
        this.onGround = false;
        this.isGrounded = false;
        this.jumpsUsed = 0;
        this.doubleJumpDone = false;
        this.stuckJumpCount = 0;
        this.headBonkCount = 0;
        this.detourPlatform = null;
        this.jumpQueue = [];
        this.ledgeState = null;
        this.ledgePlatform = null;
      } else if ((!rescueActive && Math.abs(this.x - leader.x) > 360) || this.y > 630) {
        this.x = formation.targetTinaX;
        this.y =
          formation.leaderSpan
            ? formation.leaderSpan.y - this.h - 2
            : leader.y + 14;
        this.vy = 0;
        this.vx = 0;
        this.onGround = false;
        this.isGrounded = false;
        this.jumpsUsed = 0;
        this.doubleJumpDone = false;
        this.stuckJumpCount = 0;
        this.headBonkCount = 0;
        this.detourPlatform = null;
        this.jumpQueue = [];
        this.targetItem = null;
        this.rescueItem = null;
        this.itemSearchTimer = 0;
        this.ledgeState = null;
        this.ledgePlatform = null;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.hiddenInMetro) return;
      if (this.state !== 'entering_metro' && !this.ledgeState) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }

      const screenX = this.x - cameraX;
      const screenY = this.y;
      let poseOpts = null;
      if (this.ledgeState === 'ledge_grab' || this.ledgeState === 'climb') {
        const climbProgress =
          this.ledgeState === 'climb'
            ? Math.min(1, this.ledgeTimer / Math.max(0.01, this.ledgeDuration))
            : 0;
        poseOpts = { pose: this.ledgeState, climbProgress };
      }

      sprites.drawTinaHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.state === 'entering_metro' || Math.abs(this.vx) > 20,
        this.onGround || Boolean(this.ledgeState),
        this.animTimer,
        this.growlTimer,
        Boolean(this.targetItem),
        poseOpts
      );

      if (this.growlTimer > 0) {
        ctx.save();
        const bubbleX = screenX - 6;
        const bubbleY = screenY - 26 - Math.sin(this.animTimer * 12) * 3;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, 74, 20, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillText('¡GRRR-GUAU!', bubbleX + 5, bubbleY + 14);
        ctx.restore();
      }
    }
  }

  // ==========================================================================
  // ENEMIGOS HD: PALOMAS (Huyen volando hacia arriba con el Gruñido de la Tina)
  // Y PATINETES ELÉCTRICOS
  // ==========================================================================
  function drawEnemyStatusOverlay(ctx, screenX, screenY, w, stunTimer, hypnotizedTimer, animTimer, slowTimer = 0, h = 36) {
    if (slowTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.42 + Math.sin(animTimer * 10) * 0.1;
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.ellipse(screenX + w * 0.5, screenY + h * 0.52, w * 0.64, h * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#bae6fd';
      ctx.stroke();
      ctx.globalAlpha = 0.95;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#bae6fd';
      const bob = Math.sin(animTimer * 6) * 2.5;
      ctx.fillText('❄', screenX + w * 0.5 - 6, screenY - 7 + bob);
      ctx.restore();
    }
    if (hypnotizedTimer > 0) {
      ctx.save();
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      const offset1 = Math.sin(animTimer * 8) * 5;
      const offset2 = Math.cos(animTimer * 8) * 5;
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('♥', screenX + 2 + offset1, screenY - 6);
      ctx.fillStyle = '#fb7185';
      ctx.fillText('♥', screenX + w - 12 + offset2, screenY - 12);
      ctx.restore();
    } else if (stunTimer > 0) {
      ctx.save();
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#fbbf24';
      const ox = Math.cos(animTimer * 10) * 10;
      ctx.fillText('★', screenX + w * 0.5 - 6 + ox, screenY - 6);
      ctx.fillText('★', screenX + w * 0.5 - 6 - ox, screenY - 11);
      ctx.restore();
    }
  }

  function initHeavyHitFields(e, hp = 2) {
    e.hp = hp;
    e.maxHp = hp;
    e.hurtTimer = 0;
    e.hitFlashTimer = 0;
    e.hitCooldown = 0;
    e.knockbackVx = 0;
    e.knockbackTimer = 0;
  }

  function tickHeavyHitFields(e, dt) {
    if (e.hurtTimer > 0) e.hurtTimer = Math.max(0, e.hurtTimer - dt);
    if (e.hitFlashTimer > 0) e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
    if (e.hitCooldown > 0) e.hitCooldown = Math.max(0, e.hitCooldown - dt);
    if (e.knockbackTimer > 0) {
      e.knockbackTimer = Math.max(0, e.knockbackTimer - dt);
      if (Number.isFinite(e.knockbackVx) && Math.abs(e.knockbackVx) > 1) {
        const prevX = e.x;
        e.x += e.knockbackVx * dt;
        e.knockbackVx *= Math.pow(0.08, dt);
        if (
          !e.noKnockbackBoundClamp &&
          Number.isFinite(e.minX) &&
          Number.isFinite(e.maxX) &&
          prevX >= e.minX &&
          prevX + e.w <= e.maxX
        ) {
          if (e.x < e.minX) {
            e.x = e.minX;
            e.knockbackVx = 0;
          } else if (e.x + e.w > e.maxX) {
            e.x = e.maxX - e.w;
            e.knockbackVx = 0;
          }
        }
      }
      return true;
    }
    return false;
  }

  function applyHeavyImpact(e, knockDir = 1, opts = {}) {
    if (e.dead) return 'none';
    if (!opts.ignoreCooldown && e.hitCooldown > 0) return 'ignored';
    if (e.hp > 1) {
      e.hp -= 1;
      e.hitFlashTimer = opts.flashDuration || 0.30;
      e.hitCooldown = opts.cooldownDuration || 0.28;
      e.knockbackVx = (knockDir >= 0 ? 1 : -1) * (opts.knockbackSpeed || 135);
      e.knockbackTimer = opts.knockbackDuration || 0.24;
      if (opts.clearDisable) {
        e.stunTimer = 0;
        e.hypnotizedTimer = 0;
      }
      if ('isCharging' in e) {
        e.isCharging = false;
        e.chargeTimer = 0;
        e.chargeCooldown = Math.max(e.chargeCooldown || 0, opts.chargeCooldown || 0.95);
      }
      return 'damaged';
    }
    e.hp = 0;
    e.dead = true;
    return 'killed';
  }

  // Escalado de velocidad por nivel (+15% acumulativo por cada nivel consecutivo)
  function getLevelSpeedScale(levelIndex = 0) {
    return Math.pow(1.15, Math.max(0, levelIndex));
  }

  class Pigeon {
    constructor(x, y, minX, maxX, speed = 65, levelIndex = 0, alwaysReactive = false) {
      this.x = x;
      this.y = y - 22;
      this.w = 28;
      this.h = 22;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.alwaysReactive = !!alwaysReactive;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = this.baseSpeed;
      this.vy = 0;
      this.facing = 'right';
      this.dead = false;
      this.scaredFlying = false; // Huye volando hacia arriba con el Gruñido de la Tina
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -460 - Math.random() * 120;
      this.vx = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 90);
      this.facing = this.vx >= 0 ? 'right' : 'left';
      return true;
    }

    update(dt, leader, solids = null) {
      if (this.dead) return;
      this.animTimer += dt;

      if (!this._platformClamped && Array.isArray(solids) && solids.length > 0) {
        this._platformClamped = true;
        const footY = this.y + this.h;
        if (footY < 455) {
          let support = null;
          for (let i = 0; i < solids.length; i++) {
            const s = solids[i];
            if (!s || Math.abs(s.y - footY) > 4) continue;
            if (s.x + s.w >= this.minX && s.x <= this.maxX) {
              support = s;
              break;
            }
          }
          if (support && support.w > this.w + 4) {
            this.minX = Math.max(this.minX, support.x + 2);
            this.maxX = Math.min(this.maxX, support.x + support.w - 2);
            if (this.minX + this.w > this.maxX) {
              this.minX = support.x;
              this.maxX = support.x + support.w;
            }
            this.x = Math.max(this.minX, Math.min(this.maxX - this.w, this.x));
          }
        }
      }

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -80) {
          this.dead = true;
        }
        return;
      }

      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);

      if (this.isDisabled()) return;

      // IA Reactiva / Aggro en Niveles 3-4 y desde Nivel 1 en Canarias: gira hacia el líder y acelera si salta cerca
      let currentSpeed = this.baseSpeed;
      if ((this.alwaysReactive || this.levelIndex >= 2) && leader) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = Math.abs(leader.y - this.y);
        const detectDist = this.alwaysReactive ? 280 : 235;
        if (Math.abs(dx) < detectDist && dy < 135) {
          const jumpBoost = !leader.onGround ? (this.alwaysReactive ? 1.82 : 1.65) : (this.alwaysReactive ? 1.48 : 1.38);
          currentSpeed = this.baseSpeed * jumpBoost;
          if (Math.abs(dx) > 10) {
            this.facing = dx >= 0 ? 'right' : 'left';
          }
        }
      }

      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * currentSpeed;
      this.x += this.vx * dt;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.vx = currentSpeed;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.vx = -currentSpeed;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      if (!this.scaredFlying) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawPigeonHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled() && !this.scaredFlying,
        this.scaredFlying
      );
      if (!this.scaredFlying) {
        drawEnemyStatusOverlay(
          ctx,
          screenX,
          screenY,
          this.w,
          this.stunTimer,
          this.hypnotizedTimer,
          this.animTimer
        );
      }
    }
  }

  class Scooter {
    constructor(x, y, minX, maxX, speed = 220, levelIndex = 0) {
      this.x = x;
      this.y = y - 22;
      this.w = 34;
      this.h = 22;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = speed >= 0 ? this.baseSpeed : -this.baseSpeed;
      this.facing = speed >= 0 ? 'right' : 'left';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = 0;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);

      if (this.isDisabled()) return;

      // En Niveles 3 y 4: acelera y persigue al líder si entra en su visión o salta cerca
      let currentSpeed = this.baseSpeed;
      if (this.levelIndex >= 2 && leader) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = Math.abs(leader.y - this.y);
        if (Math.abs(dx) < 260 && dy < 115) {
          currentSpeed = this.baseSpeed * (!leader.onGround ? 1.48 : 1.3);
          if (Math.abs(dx) > 16) {
            this.facing = dx >= 0 ? 'right' : 'left';
          }
        }
      }

      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * currentSpeed;
      this.x += this.vx * dt;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.vx = currentSpeed;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.vx = -currentSpeed;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      const bounce = this.isDisabled() ? 0 : Math.sin(this.animTimer * 24) * 1.2;
      const screenY = this.y - bounce;
      sprites.drawScooterHD(ctx, screenX, screenY, this.facing, this.animTimer, this.isDisabled());
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer
      );
    }
  }

  // ==========================================================================
  // NIVEL 1+: GAVIOTA / PÁJARO VOLADOR VERTICAL (Patrulla arriba/abajo,
  // anticipa el salto en niveles 3-4, eliminable con stomp o gruñido de Tina)
  // ==========================================================================
  class Seagull {
    constructor(x, minY, maxY, speed = 95, levelIndex = 0) {
      this.baseX = x;
      this.x = x;
      this.y = (minY + maxY) * 0.5;
      this.w = 32;
      this.h = 24;
      this.minY = minY;
      this.maxY = maxY;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vy = this.baseSpeed;
      this.vx = 0;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 4;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -480 - Math.random() * 110;
      this.vx = (Math.random() < 0.5 ? -1 : 1) * (130 + Math.random() * 80);
      this.facing = this.vx >= 0 ? 'right' : 'left';
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -80) this.dead = true;
        return;
      }

      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      if (leader) {
        this.facing = leader.x < this.x ? 'left' : 'right';
      }

      // En Niveles 3 y 4: anticipa la posición aérea del jugador al saltar
      let vertSpeed = this.baseSpeed;
      if (this.levelIndex >= 2 && leader && Math.abs(leader.x - this.x) < 235 && !leader.onGround) {
        const predictedY = Math.max(this.minY, Math.min(this.maxY, leader.y + leader.vy * 0.22));
        const dy = predictedY - this.y;
        if (Math.abs(dy) > 8) {
          this.vy = Math.sign(dy) * vertSpeed * 1.45;
        }
      }

      this.y += this.vy * dt;
      this.x = this.baseX + Math.sin(this.animTimer * 2.5) * 14;

      if (this.y <= this.minY) {
        this.y = this.minY;
        this.vy = Math.abs(vertSpeed);
      } else if (this.y + this.h >= this.maxY) {
        this.y = this.maxY - this.h;
        this.vy = -Math.abs(vertSpeed);
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      if (!this.scaredFlying) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawSeagullHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled() && !this.scaredFlying,
        this.scaredFlying
      );
      if (!this.scaredFlying) {
        drawEnemyStatusOverlay(
          ctx,
          screenX,
          screenY,
          this.w,
          this.stunTimer,
          this.hypnotizedTimer,
          this.animTimer
        );
      }
    }
  }

  // ==========================================================================
  // NIVEL 2+: PUERCOESPÍN / ERIZO URBANO
  // - Inmune al salto (saltarle encima daña al jugador por sus púas)
  // - Inmune al Gruñido de la Tina
  // - Solo derrotado por Terremoto de Nico / Rayo Eléctrico, o superado sin
  //   daño mientras está hipnotizado por la Pose de Andrea (3s)
  // ==========================================================================
  class Hedgehog {
    constructor(x, y, minX, maxX, speed = 72, levelIndex = 1) {
      this.x = x;
      this.y = y - 24;
      this.w = 34;
      this.h = 24;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = this.baseSpeed;
      this.facing = 'right';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 4;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    // Inmune al gruñido de la Tina
    scareFlyUp() {
      return false;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      let currentSpeed = this.baseSpeed;
      if (this.levelIndex >= 2 && leader) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = Math.abs(leader.y - this.y);
        if (Math.abs(dx) < 240 && dy < 115) {
          currentSpeed = this.baseSpeed * (!leader.onGround ? 1.65 : 1.4);
          if (Math.abs(dx) > 10) {
            this.facing = dx >= 0 ? 'right' : 'left';
          }
        }
      }

      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * currentSpeed;
      this.x += this.vx * dt;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.vx = currentSpeed;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.vx = -currentSpeed;
      }
    }

    drawSprite(ctx, sprites, screenX, screenY) {
      sprites.drawHedgehogHD(ctx, screenX, screenY, this.facing, this.animTimer, this.isDisabled());
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      const screenY = this.y;
      this.drawSprite(ctx, sprites, screenX, screenY);
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer
      );
    }
  }

  // ==========================================================================
  // BARCELONA: JABALÍ SALVAJE (Reemplaza al Puercoespín en Barcelona)
  // - Hereda patrulla reactiva, inmunidad al salto (colmillos hacia arriba) y
  //   vulnerabilidad a Orquídea [D], Terremoto de Nico [A] o Hipnosis.
  // ==========================================================================
  class Boar extends Hedgehog {
    constructor(x, y, minX, maxX, speed = 72, levelIndex = 1) {
      super(x, y, minX, maxX, speed, levelIndex);
      const hb = global.SpriteBank && global.SpriteBank.BOAR_HITBOX
        ? global.SpriteBank.BOAR_HITBOX
        : { w: 46, h: 30 };
      this.w = hb.w;
      this.h = hb.h;
      this.y = y - this.h;
      initHeavyHitFields(this, 2);
    }

    triggerBounce() {}

    takeHit(knockDir = 1, clearDisable = true, ignoreCooldown = false) {
      return applyHeavyImpact(this, knockDir, { clearDisable, ignoreCooldown });
    }

    update(dt, leader) {
      if (this.dead) return;
      if (tickHeavyHitFields(this, dt)) {
        this.animTimer += dt;
        if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
        if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
        return;
      }
      super.update(dt, leader);
    }

    drawSprite(ctx, sprites, screenX, screenY) {
      sprites.drawBoarHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.hitFlashTimer > 0,
        this.hp
      );
    }
  }

  // ==========================================================================
  // MADRID: GATO CALLEJERO (MadridCatEnemy) - FÍSICA REAL Y SALTO PARABÓLICO
  // - Hitbox horizontal (34x24) con gravedad continua y soporte real sobre vigas/suelo.
  // - Sin teletransporte al subir a vigas altas: anticipación breve (~150ms) + arco parabólico real.
  // - Caída libre real por gravedad al saltar fuera de una viga (suelo inferior o muerte en pozo).
  // ==========================================================================
  const CAT_GRAVITY = 1120;

  class MadridCatEnemy {
    constructor(x, y, minX, maxX, speed = 85, levelIndex = 0, isAmbush = false) {
      this.x = x;
      this.y = y - 24;
      this.initialX = x;
      this.initialY = this.y;
      this.initialPlatformY = y;
      this.w = 34;
      this.h = 24;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      // Velocidad base con escalado de Madrid (+20% base sobre Mundo 1)
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * 1.2;
      this.vx = this.baseSpeed;
      this.vy = 0;
      this.onGround = true;
      this.facing = 'right';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.pauseTimer = 0;
      this.animTimer = Math.random() * 4;
      this.isAmbush = isAmbush;
      this.ambushState = isAmbush ? 'perched' : 'patrol'; // 'perched' | 'diving' | 'leaping' | 'attack_crouch' | 'attack_leap' | 'crouch_up' | 'climbing_jump' | 'crouch_down' | 'drop_jump' | 'ground' | 'patrol'
      this.diveTimer = 0;
      this.leapCooldown = 0;
      this.attackCooldown = 0;
      this.verticalCooldown = 0;
      this.groundTimer = 0;
      this.crouchTimer = 0;
      this.jumpCooldown = 0;
      this.jumpTargetPlat = null;
      this.dropFromPlat = null;
      this.dropLandingX = 0;
      this.attackDir = 1;
      this.jumpFlightVx = 0;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    _facingSign() {
      return this.facing === 'right' ? 1 : -1;
    }

    _resetTransientJumpState() {
      if (
        this.ambushState === 'leaping' ||
        this.ambushState === 'attack_leap' ||
        this.ambushState === 'attack_crouch' ||
        this.ambushState === 'diving' ||
        this.ambushState === 'crouch_up' ||
        this.ambushState === 'climbing_jump' ||
        this.ambushState === 'crouch_down' ||
        this.ambushState === 'drop_jump'
      ) {
        this.ambushState = 'ground';
        this.crouchTimer = 0;
        this.jumpTargetPlat = null;
        this.dropFromPlat = null;
        this.vx *= 0.25;
      }
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this._resetTransientJumpState();
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this._resetTransientJumpState();
    }

    scareFlyUp() {
      return false; // Los gatos son inmunes al ladrido aéreo
    }

    _hasFloorSupportAt(platforms, probeX, targetY, toleranceY = 12) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken) continue;
        if (probeX >= p.x + 2 && probeX <= p.x + p.w - 2 && Math.abs(p.y - targetY) <= toleranceY) {
          return true;
        }
      }
      return false;
    }

    _findSupportingPlatform(platforms) {
      const footLeft = this.x + 4;
      const footRight = this.x + this.w - 4;
      const feetY = this.y + this.h;
      let best = null;
      let bestDiff = 5;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken) continue;
        if (footRight > p.x && footLeft < p.x + p.w) {
          const diff = Math.abs(feetY - p.y);
          if (diff <= bestDiff) {
            bestDiff = diff;
            best = p;
          }
        }
      }
      return best;
    }

    _findClimbableHighPlatform(platforms, preferX = null) {
      const catCx = this.x + this.w * 0.5;
      let best = null;
      let bestScore = Infinity;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken) continue;
        const targetTopY = p.y - this.h;
        const deltaY = this.y - targetTopY;
        if (deltaY < 26 || deltaY > 175) continue;
        // Evitar saltar de cabeza contra bloques sólidos opacos directamente encima
        const horizontallyOutside = this.x + this.w <= p.x + 4 || this.x >= p.x + p.w - 4;
        if (!p.oneWay && !horizontallyOutside) continue;
        const platCx = p.x + p.w * 0.5;
        const distHoriz = Math.abs(catCx - platCx);
        if (distHoriz > p.w * 0.5 + 150) continue;
        const targetBias = preferX !== null ? Math.abs(platCx - preferX) * 0.45 : 0;
        const origBias = Math.abs(p.y - this.initialPlatformY) <= 10 && this.isAmbush ? -80 : 0;
        const score = distHoriz + deltaY * 0.35 + targetBias + origBias;
        if (score < bestScore) {
          bestScore = score;
          best = p;
        }
      }
      return best;
    }

    _findLowerLandingSpot(platforms, currentPlat, preferX = null) {
      if (!currentPlat) return null;
      let best = null;
      let bestScore = Infinity;
      const desiredX = preferX !== null ? preferX - this.w * 0.5 : this.x;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken || p === currentPlat) continue;
        const dropDy = p.y - (this.y + this.h);
        if (dropDy < 24 || dropDy > 210) continue;
        const pSafeMin = p.x + 12;
        const pSafeMax = p.x + p.w - this.w - 12;
        if (pSafeMax < pSafeMin) continue;

        const candidates = [];
        if (currentPlat.oneWay) {
          const reachMin = Math.max(pSafeMin, currentPlat.x - 70);
          const reachMax = Math.min(pSafeMax, currentPlat.x + currentPlat.w + 70 - this.w);
          if (reachMin <= reachMax) {
            candidates.push(Math.max(reachMin, Math.min(reachMax, desiredX)));
          }
        } else {
          const leftOff = currentPlat.x - this.w - 8;
          const rightOff = currentPlat.x + currentPlat.w + 8;
          if (leftOff >= pSafeMin && leftOff <= pSafeMax) candidates.push(leftOff);
          if (rightOff >= pSafeMin && rightOff <= pSafeMax) candidates.push(rightOff);
        }

        for (let c = 0; c < candidates.length; c++) {
          const cx = candidates[c];
          if (
            !this._hasFloorSupportAt(platforms, cx + 4, p.y, 10) ||
            !this._hasFloorSupportAt(platforms, cx + this.w - 4, p.y, 10)
          ) {
            continue;
          }
          const score = Math.abs(cx - this.x) + dropDy * 0.25 + Math.abs(cx - desiredX) * 0.35;
          if (score < bestScore) {
            bestScore = score;
            best = { plat: p, targetX: cx };
          }
        }
      }
      return best;
    }

    _applyGravityAndLanding(dt, allPlatforms, ignorePlat = null) {
      const prevBottom = this.y + this.h;
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + CAT_GRAVITY * dt);
      this.y += this.vy * dt;
      this.onGround = false;

      if (this.dropFromPlat && prevBottom > this.dropFromPlat.y + 16) {
        this.dropFromPlat = null;
      }

      if (this.vy >= 0 && allPlatforms.length > 0) {
        const footLeft = this.x + 4;
        const footRight = this.x + this.w - 4;
        let landedPlat = null;
        let bestY = Infinity;
        for (let i = 0; i < allPlatforms.length; i++) {
          const p = allPlatforms[i];
          if (!p || p.broken) continue;
          if (ignorePlat && p === ignorePlat && prevBottom <= ignorePlat.y + 16) continue;
          if (
            footRight > p.x &&
            footLeft < p.x + p.w &&
            prevBottom <= p.y + 12 &&
            this.y + this.h >= p.y &&
            this.y + this.h <= p.y + 30
          ) {
            if (p.y < bestY) {
              bestY = p.y;
              landedPlat = p;
            }
          }
        }
        if (landedPlat) {
          this.y = landedPlat.y - this.h;
          this.vy = 0;
          this.onGround = true;
          this.dropFromPlat = null;
          return landedPlat;
        }
      }

      if (this.y > 540) {
        this.dead = true;
      }
      return null;
    }

    _setVerticalCooldown(seconds = 3.0) {
      this.verticalCooldown = seconds;
      this.jumpCooldown = seconds;
    }

    _startClimbJumpWindup(plat) {
      const catCx = this.x + this.w * 0.5;
      this.ambushState = 'crouch_up';
      this.crouchTimer = 0.15;
      this.jumpTargetPlat = plat;
      this.dropFromPlat = null;
      this.vx = 0;
      this.facing = plat.x + plat.w * 0.5 >= catCx ? 'right' : 'left';
    }

    _startDropJumpWindup(dropSpot, currentPlat) {
      this.ambushState = 'crouch_down';
      this.crouchTimer = 0.14;
      this.jumpTargetPlat = dropSpot.plat;
      this.dropLandingX = dropSpot.targetX;
      this.dropFromPlat = currentPlat && currentPlat.oneWay ? currentPlat : null;
      this.vx = 0;
      this.facing = dropSpot.targetX >= this.x ? 'right' : 'left';
    }

    _reversePatrol(nextFacing) {
      this.facing = nextFacing;
      this.vx = 0;
      this.pauseTimer = 0.28;
    }

    update(dt, leader, solids = [], movingPlatforms = []) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.leapCooldown > 0) this.leapCooldown = Math.max(0, this.leapCooldown - dt);
      if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      if (this.verticalCooldown > 0) {
        this.verticalCooldown = Math.max(0, this.verticalCooldown - dt);
        this.jumpCooldown = this.verticalCooldown;
      }

      const allPlatforms =
        solids.length || movingPlatforms.length
          ? solids.concat(movingPlatforms)
          : [];

      // Verificar soporte real en pies cuando está apoyado
      let supportPlat = null;
      if (allPlatforms.length > 0 && this.onGround) {
        supportPlat = this._findSupportingPlatform(allPlatforms);
        if (!supportPlat) {
          this.onGround = false;
        }
      }

      // Incluso estando aturdido o hipnotizado, el gato sigue sometido a gravedad real
      if (this.isDisabled()) {
        if (!this.onGround && allPlatforms.length > 0) {
          this.x += this.vx * 0.25 * dt;
          const landed = this._applyGravityAndLanding(dt, allPlatforms, this.dropFromPlat);
          if (landed) {
            this.vx = 0;
            this.ambushState =
              this.isAmbush && Math.abs(landed.y - this.initialPlatformY) <= 10
                ? 'perched'
                : 'ground';
          }
        }
        return;
      }

      // 1A. Anticipación breve agachada antes de ataque frontal hacia el jugador ('attack_crouch')
      if (this.ambushState === 'attack_crouch') {
        if (!this.onGround && allPlatforms.length > 0) {
          const landed = this._applyGravityAndLanding(dt, allPlatforms);
          if (!landed) return;
        }
        this.vx = 0;
        this.facing = this.attackDir >= 0 ? 'right' : 'left';
        this.crouchTimer -= dt;
        if (this.crouchTimer <= 0) {
          this.vy = -345;
          this.vx = this.attackDir * 255;
          this.onGround = false;
          this.ambushState = 'attack_leap';
          this.attackCooldown = 2.4;
        }
        return;
      }

      // 1B. Anticipación breve (~150 ms) antes de saltar del suelo hacia una viga alta
      if (this.ambushState === 'crouch_up') {
        if (!this.onGround && allPlatforms.length > 0) {
          const landed = this._applyGravityAndLanding(dt, allPlatforms);
          if (!landed) return;
        }
        this.vx = 0;
        this.crouchTimer -= dt;
        const targetPlat = this.jumpTargetPlat;
        if (targetPlat) {
          const catCx = this.x + this.w * 0.5;
          const platCx = targetPlat.x + targetPlat.w * 0.5;
          this.facing = platCx >= catCx ? 'right' : 'left';
        }
        if (this.crouchTimer <= 0) {
          if (targetPlat && !targetPlat.broken) {
            const targetTopY = targetPlat.y - this.h;
            const deltaY = Math.max(24, this.y - targetTopY);
            const clearance = 28;
            const peakH = deltaY + clearance;
            const vy0 = -Math.sqrt(2 * CAT_GRAVITY * peakH);
            const tUp = -vy0 / CAT_GRAVITY;
            const tDown = Math.sqrt((2 * clearance) / CAT_GRAVITY);
            const flightTime = Math.max(0.22, tUp + tDown);
            const safeMin = targetPlat.x + 14;
            const safeMax = Math.max(safeMin, targetPlat.x + targetPlat.w - this.w - 14);
            const targetLandX = Math.max(safeMin, Math.min(safeMax, this.x));
            const rawVx = (targetLandX - this.x) / flightTime;
            this.vx = Math.max(-245, Math.min(245, rawVx));
            this.vy = vy0;
            this.onGround = false;
            this.facing = this.vx >= 0 ? 'right' : 'left';
            this.ambushState = 'climbing_jump';
            this._setVerticalCooldown(3.0);
          } else {
            this.ambushState = 'ground';
          }
          this.jumpTargetPlat = null;
        }
        return;
      }

      // 1C. Anticipación breve antes de bajar de una viga alta hacia el suelo inferior ('crouch_down')
      if (this.ambushState === 'crouch_down') {
        if (!this.onGround && allPlatforms.length > 0) {
          const landed = this._applyGravityAndLanding(dt, allPlatforms, this.dropFromPlat);
          if (!landed) return;
        }
        this.vx = 0;
        this.crouchTimer -= dt;
        if (this.crouchTimer <= 0) {
          const targetPlat = this.jumpTargetPlat;
          if (targetPlat && !targetPlat.broken) {
            const vy0 = -175;
            const fallDist = Math.max(20, (targetPlat.y - this.h) - this.y);
            const tTotal = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * CAT_GRAVITY * fallDist)) / CAT_GRAVITY;
            const rawVx = (this.dropLandingX - this.x) / Math.max(0.2, tTotal);
            this.vx = Math.max(-210, Math.min(210, rawVx));
            this.vy = vy0;
            this.onGround = false;
            if (Math.abs(this.vx) > 4) this.facing = this.vx >= 0 ? 'right' : 'left';
            this.ambushState = 'drop_jump';
            this._setVerticalCooldown(3.0);
          } else {
            this.dropFromPlat = null;
            this.ambushState = 'perched';
          }
          this.jumpTargetPlat = null;
        }
        return;
      }

      // 2. Trayectorias parabólicas en el aire (ataque frontal SIN freno en bordes, subida, bajada o intercepto)
      if (
        this.ambushState === 'attack_leap' ||
        this.ambushState === 'climbing_jump' ||
        this.ambushState === 'drop_jump' ||
        this.ambushState === 'leaping'
      ) {
        const finishedVertical =
          this.ambushState === 'climbing_jump' || this.ambushState === 'drop_jump';
        this.x += this.vx * dt;
        const landed = this._applyGravityAndLanding(
          dt,
          allPlatforms,
          this.ambushState === 'drop_jump' ? this.dropFromPlat : null
        );
        if (this.dead) return;
        if (landed) {
          this.vx = 0;
          const onInitialPerch = this.isAmbush && Math.abs(landed.y - this.initialPlatformY) <= 10;
          this.ambushState = onInitialPerch ? 'perched' : (this.isAmbush ? 'ground' : 'patrol');
          this.pauseTimer = this.ambushState === 'perched' ? 0.28 : 0.34;
          this.groundTimer = onInitialPerch ? 0 : 1.5;
          if (finishedVertical) {
            // Regla estricta: 3.0s completos desde que termina la subida/bajada antes del próximo cambio vertical
            this._setVerticalCooldown(3.0);
          }
        }
        return;
      }

      // 3. Emboscada en picada vertical hacia abajo ('diving') hasta terreno verificado
      if (this.ambushState === 'diving') {
        const landed = this._applyGravityAndLanding(dt, allPlatforms);
        if (this.dead) return;
        if (landed) {
          this.vx = 0;
          this.ambushState = 'ground';
          this.diveTimer = 0.45;
          this.groundTimer = 1.8;
          this._setVerticalCooldown(3.0);
        }
        return;
      }

      // 4. Caída libre continua si perdió soporte físico real
      if (!this.onGround && allPlatforms.length > 0) {
        const landed = this._applyGravityAndLanding(dt, allPlatforms);
        if (this.dead) return;
        if (landed) {
          this.vx = 0;
          const onInitialPerch = this.isAmbush && Math.abs(landed.y - this.initialPlatformY) <= 10;
          if (!onInitialPerch && this.ambushState === 'perched') {
            this.ambushState = 'ground';
            this.groundTimer = 1.6;
          }
          this.pauseTimer = 0.2;
        }
        return;
      }

      // --- IA Reactiva con pies firmes ---
      if (leader && !this.dead) {
        const catCenterX = this.x + this.w * 0.5;
        const leaderCenterX = leader.x + leader.w * 0.5;
        const dx = leaderCenterX - catCenterX;
        const absDx = Math.abs(dx);
        const dy = leader.y - this.y;
        const catFeetY = this.y + this.h;
        const leaderFeetY = leader.y + leader.h;
        const facingSign = this._facingSign();

        // A. ATAQUE FRONTAL EN SALTO HACIA ADELANTE (mismo plano vertical + mirando al jugador + cooldown listo)
        const sameVerticalPlane = Boolean(leader.onGround && Math.abs(leaderFeetY - catFeetY) <= 16);
        const lookSign = Math.sign(leader.x - this.x) || Math.sign(dx);
        const facingPlayer = lookSign !== 0 && lookSign === facingSign;
        if (sameVerticalPlane && facingPlayer && absDx <= 195 && this.attackCooldown <= 0) {
          this.ambushState = 'attack_crouch';
          this.crouchTimer = 0.18;
          this.attackDir = facingSign;
          this.vx = 0;
          return;
        }

        // B. BAJAR DE VIGA ALTA AL SUELO (regido por verticalCooldown === 0 y siempre sobre suelo firme)
        if (
          allPlatforms.length > 0 &&
          supportPlat &&
          this.y + this.h < 430 &&
          this.verticalCooldown <= 0 &&
          leaderFeetY >= catFeetY + 24 &&
          absDx < 200
        ) {
          const dropSpot = this._findLowerLandingSpot(allPlatforms, supportPlat, leaderCenterX);
          if (dropSpot) {
            if (
              this.isAmbush &&
              this.ambushState === 'perched' &&
              absDx < 85 &&
              dy > 18 &&
              this._hasFloorSupportAt(allPlatforms, catCenterX, dropSpot.plat.y, 12)
            ) {
              this.ambushState = 'diving';
              this.onGround = false;
              this.vy = 420;
              this.facing = dx < 0 ? 'left' : 'right';
              this._setVerticalCooldown(3.0);
              return;
            }
            this._startDropJumpWindup(dropSpot, supportPlat);
            return;
          }
        }

        // C. SUBIR DEL SUELO A UNA VIGA ALTA (regido estrictamente por verticalCooldown === 0)
        if (
          allPlatforms.length > 0 &&
          this.verticalCooldown <= 0 &&
          leaderFeetY <= this.y - 18 &&
          leaderFeetY >= this.y - 175 &&
          absDx < 165
        ) {
          const climbPlat = this._findClimbableHighPlatform(allPlatforms, leaderCenterX);
          if (climbPlat) {
            this._startClimbJumpWindup(climbPlat);
            return;
          }
        }

        // D. Intercepto aéreo corto si el jugador salta encima (solo si hay suelo firme todo el salto, sin suicidio en pozo)
        if (
          this.leapCooldown <= 0 &&
          absDx < 95 &&
          dy >= -68 &&
          dy <= 10 &&
          !leader.onGround &&
          (
            !allPlatforms.length ||
            (this._hasFloorSupportAt(allPlatforms, catCenterX + (dx >= 0 ? 40 : -40), catFeetY, 14) &&
              this._hasFloorSupportAt(allPlatforms, catCenterX + (dx >= 0 ? 82 : -82), catFeetY, 14))
          )
        ) {
          this.ambushState = 'leaping';
          this.onGround = false;
          this.vy = -380;
          this.vx = (dx < 0 ? -1 : 1) * 110;
          this.facing = dx < 0 ? 'left' : 'right';
          this.leapCooldown = 2.2;
          return;
        }
      }

      // Retorno controlado de emboscada a su viga original respetando verticalCooldown (3.0s)
      if (this.ambushState === 'ground') {
        if (this.diveTimer > 0) {
          this.diveTimer = Math.max(0, this.diveTimer - dt);
          return;
        }
        if (this.groundTimer > 0) {
          this.groundTimer = Math.max(0, this.groundTimer - dt);
        }
        if (
          this.isAmbush &&
          allPlatforms.length > 0 &&
          this.groundTimer <= 0 &&
          this.verticalCooldown <= 0 &&
          this.y > this.initialY + 18
        ) {
          const homePlat = this._findClimbableHighPlatform(allPlatforms, this.initialX + this.w * 0.5);
          if (homePlat) {
            this._startClimbJumpWindup(homePlat);
            return;
          }
        }
      }

      if (this.pauseTimer > 0) {
        this.pauseTimer = Math.max(0, this.pauseTimer - dt);
        return;
      }

      // 5. PATRULLA INTELIGENTE SIN SUICIDIOS EN POZOS
      const dir = this._facingSign();
      const stepVx = dir * this.baseSpeed;
      const nextX = this.x + stepVx * dt;

      if (supportPlat && allPlatforms.length > 0) {
        const edgeTooClose =
          dir > 0
            ? nextX + this.w > supportPlat.x + supportPlat.w - 4
            : nextX < supportPlat.x + 4;
        const leadProbeX = dir > 0 ? nextX + this.w + 5 : nextX - 5;
        const floorAhead = !edgeTooClose || this._hasFloorSupportAt(allPlatforms, leadProbeX, supportPlat.y, 12);
        if (!floorAhead) {
          const safeLeft = supportPlat.x + 4;
          const safeRight = Math.max(safeLeft, supportPlat.x + supportPlat.w - this.w - 4);
          this.x = Math.max(safeLeft, Math.min(safeRight, this.x));
          this._reversePatrol(dir > 0 ? 'left' : 'right');
          return;
        }
      }

      this.vx = stepVx;
      this.x = nextX;

      const onOriginalHeight = Math.abs(this.y + this.h - this.initialPlatformY) <= 10;
      if (onOriginalHeight) {
        if (this.x <= this.minX) {
          this.x = this.minX;
          this._reversePatrol('right');
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this._reversePatrol('left');
        }
      } else if (!allPlatforms.length) {
        if (this.x <= this.minX) {
          this.x = this.minX;
          this._reversePatrol('right');
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this._reversePatrol('left');
        }
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      if (this.ambushState !== 'perched' && this.ambushState !== 'diving') {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawMadridCatHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.pauseTimer > 0 ? 0 : this.animTimer,
        this.isDisabled(),
        this.isAmbush,
        this.ambushState,
        this.vy,
        this.onGround
      );
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer
      );
    }
  }

  // ==========================================================================
  // MADRID: TURISTA CON PALO SELFIE (SelfieTouristEnemy)
  // Lleva un palo selfie metálico apuntando estrictamente HACIA ARRIBA.
  // REGLA CRÍTICA: Inmune a pisotón superior (actúa como púa/erizo y daña al jugador).
  // Inmune al ladrido de la Tina.
  // Vulnerable a: Ground Pound (Terremoto de Nico), Pose Hipnótica (Andrea) o Proyectiles.
  // ==========================================================================
  class SelfieTouristEnemy {
    constructor(x, y, minX, maxX, speed = 55, levelIndex = 0, variant = 'madrid') {
      this.x = x;
      this.y = y - 48; // Enemigo humanoide alto (48px de altura)
      this.w = 32;
      this.h = 48;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.variant = variant || 'madrid';
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * 1.15;
      this.vx = this.baseSpeed;
      this.facing = 'right';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.pauseTimer = 0;
      this.animTimer = Math.random() * 5;
      this.hasSelfieStickSpike = true; // Marca distintiva para detección de colisión
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false; // Los turistas no se asustan con ladridos de perro
    }

    update(dt, leader) {
      if (this.dead) return;
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      this.animTimer += dt * (this.slowTimer > 0 ? 0.55 : 1.0);
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      if (this.pauseTimer > 0) {
        this.pauseTimer = Math.max(0, this.pauseTimer - dt);
        return;
      }

      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.baseSpeed * spdScale;
      this.x += this.vx * dt;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.pauseTimer = 0.4;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.pauseTimer = 0.4;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawSelfieTouristHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.pauseTimer > 0 ? 0 : this.animTimer,
        this.isDisabled(),
        this.variant === 'winter'
      );
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer,
        this.slowTimer,
        this.h
      );
    }
  }

  // ==========================================================================
  // MADRID: GUARDIA REAL CON ESCUDO Y CASCO (RoyalGuardEnemy)
  // - Fase 1 (hasArmor = true, hp = 2): Casco y escudo bloquean pisotones y
  //   protegen de morir de 1 golpe; Planta [Z] o Terremoto [C] los hacen volar
  //   dejándolo aturdido 0.45s.
  // - Fase 2 (hasArmor = false, hp = 1): Vulnerable a salto o segundo [Z].
  // ==========================================================================
  class RoyalGuardEnemy {
    constructor(x, y, minX, maxX, speed = 62, levelIndex = 0) {
      this.w = 34;
      this.h = 50;
      this.x = x;
      this.y = y - this.h;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = -this.baseSpeed;
      this.facing = 'left';
      this.dead = false;
      this.hasArmor = true;
      initHeavyHitFields(this, 2);
      this.stunTimer = 0;
      this.armorBreakTimer = 0;
      this.hypnotizedTimer = 0;
      this.turnReactionTimer = 0;
      this.animTimer = Math.random() * 5;
      this.flyingPieces = [];
    }

    getFacingDir() {
      if (typeof this.facing === 'number') return Math.sign(this.facing) || -1;
      return this.facing === 'right' ? 1 : -1;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.armorBreakTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      return false;
    }

    triggerBounce() {}

    breakArmor(particles = null, knockDir = 1, clearHypnosis = false) {
      if (this.dead || !this.hasArmor) return false;
      this.hasArmor = false;
      this.hp = 1;
      this.armorBreakTimer = 0.45;
      if (clearHypnosis) {
        this.hypnotizedTimer = 0;
        this.armorBreakTimer = 0;
      }
      this.hitFlashTimer = 0.30;
      this.hitCooldown = 0.28;
      this.knockbackVx = (knockDir >= 0 ? 1 : -1) * 115;
      this.knockbackTimer = 0.22;
      const cx = this.x + this.w * 0.5;
      const frontDir = this.facing === 'right' ? 1 : -1;
      this.flyingPieces = [
        {
          kind: 'helmet',
          x: cx,
          y: this.y + 8,
          vx: -frontDir * 85 + (knockDir >= 0 ? 35 : -35),
          vy: -290,
          angle: 0,
          vr: -9.5,
          life: 0.95
        },
        {
          kind: 'shield',
          x: cx + frontDir * 12,
          y: this.y + 24,
          vx: frontDir * 130 + (knockDir >= 0 ? 35 : -35),
          vy: -245,
          angle: 0,
          vr: 8.5,
          life: 0.95
        }
      ];
      if (particles) {
        particles.Burst(cx, this.y + 18, '#e2e8f0', 14);
        particles.Burst(cx, this.y + 22, '#fbbf24', 10);
      }
      return true;
    }

    takeHit(particles = null, knockDir = 1, fromArmorBreaker = false, ignoreCooldown = false, projectile = null) {
      if (this.dead) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      if (this.hasArmor) {
        if (projectile) {
          const rawVx =
            Number.isFinite(projectile.vx) && projectile.vx !== 0
              ? projectile.vx
              : (projectile.dirX || knockDir || 0);
          const projDir = Math.sign(rawVx);
          const guardDir = Math.sign(this.getFacingDir());
          // Defensa frontal real: proyectil de Planta en dirección opuesta a donde mira el policía rebota en el escudo
          if (projDir !== 0 && projDir !== guardDir) {
            if (particles) {
              const frontX = this.x + this.w * 0.5 + guardDir * (this.w * 0.45);
              const hitY = Number.isFinite(projectile.y)
                ? projectile.y + (projectile.h || 20) * 0.5
                : this.y + this.h * 0.45;
              particles.Burst(frontX, hitY, '#f8fafc', 8);
              particles.Burst(frontX, hitY, '#fbbf24', 10);
              particles.Sparkle(frontX + guardDir * 3, hitY - 4, '#fef08a');
              particles.Sparkle(frontX - guardDir * 2, hitY + 4, '#38bdf8');
            }
            return 'blocked_front';
          }
        }
        if (!fromArmorBreaker) return 'blocked';
        this.breakArmor(particles, knockDir);
        return 'armor_broken';
      }
      this.hp = 0;
      this.dead = true;
      return 'killed';
    }

    update(dt, leader) {
      if (this.flyingPieces && this.flyingPieces.length) {
        for (let i = this.flyingPieces.length - 1; i >= 0; i--) {
          const pc = this.flyingPieces[i];
          pc.life -= dt;
          if (pc.life <= 0) {
            this.flyingPieces.splice(i, 1);
            continue;
          }
          pc.vy = Math.min(MAX_FALL_SPEED, pc.vy + GRAVITY * dt);
          pc.x += pc.vx * dt;
          pc.y += pc.vy * dt;
          pc.angle += pc.vr * dt;
        }
      }
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.armorBreakTimer > 0) this.armorBreakTimer = Math.max(0, this.armorBreakTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (tickHeavyHitFields(this, dt)) return;
      if (this.isDisabled()) return;

      if (this.hasArmor && leader && !leader.dead) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = Math.abs(leader.y - this.y);
        if (Math.abs(dx) < 175 && Math.abs(dx) > 20 && dy < 90) {
          const desiredFacing = dx >= 0 ? 'right' : 'left';
          if (desiredFacing === this.facing) {
            this.turnReactionTimer = 0;
          } else {
            this.turnReactionTimer += dt;
            if (this.turnReactionTimer >= 0.58) {
              this.facing = desiredFacing;
              this.turnReactionTimer = 0;
            }
          }
        } else {
          this.turnReactionTimer = 0;
        }
      } else {
        this.turnReactionTimer = 0;
      }

      const dir = this.facing === 'right' ? 1 : -1;
      const moveSpeed = this.baseSpeed * (this.hasArmor ? 1.0 : 1.12);
      this.vx = dir * moveSpeed;
      this.x += this.vx * dt;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.turnReactionTimer = 0;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.turnReactionTimer = 0;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      const hasPieces = this.flyingPieces && this.flyingPieces.length > 0;
      if (this.dead && !hasPieces) return;
      if (!this.dead) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawRoyalGuardHD(ctx, this, screenX, screenY, this.animTimer);
      if (!this.dead) {
        drawEnemyStatusOverlay(
          ctx,
          screenX,
          screenY,
          this.w,
          Math.max(this.stunTimer, this.armorBreakTimer),
          this.hypnotizedTimer,
          this.animTimer
        );
      }
    }
  }

  // ==========================================================================
  // MADRID (PARQUE DEL RETIRO): PAVO REAL (PeacockEnemy) — 2 HP
  // - Estado Pasivo (tailOpen = false): camina luciendo su cola plegada esmeralda;
  //   vulnerable a salto en la cabeza (-1 HP por salto).
  // - Estado Cola Abierta (tailOpen = true): se detiene y despliega su abanico
  //   de plumas con ocelos zamarreándose; 100 % INMUNE al salto superior (daña al
  //   jugador y rebota). Planta [Z] le hace daño; Especiales [C] por área solo
  //   cierran su cola y lo noquean/enamoran sin quitarle HP (salvo Terremoto de
  //   Nico cayendo directamente encima, que resta 1 HP y lo deja noqueado).
  // ==========================================================================
  class PeacockEnemy {
    constructor(x, y, minX, maxX, speed = 62, levelIndex = 0) {
      this.w = 38;
      this.h = 46;
      this.x = x;
      this.y = y - this.h;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = this.baseSpeed;
      this.facing = 'right';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.pauseTimer = 0;
      this.animTimer = Math.random() * 4;
      this.tailOpen = false;
      this.stateTimer = Math.abs(Math.sin(x)) * 1.2;
      this.passiveDuration = 2.8;
      this.openDuration = 2.2;
      this.reopenCooldown = 0;
      this.shakeParticleTimer = 0;
      initHeavyHitFields(this, 2);
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.2) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.hypnotizedTimer = 0;
      this.tailOpen = false;
      this.stateTimer = 0;
      this.reopenCooldown = 1.6;
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this.stunTimer = 0;
      this.tailOpen = false;
      this.stateTimer = 0;
      this.reopenCooldown = 1.6;
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false;
    }

    takeHit(particles = null, knockDir = 1, fromPlantOrSpecial = false, ignoreCooldown = false, stunDuration = 0.55) {
      if (this.dead) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'cooldown';
      if (this.tailOpen && !fromPlantOrSpecial && !this.isDisabled()) {
        return 'tail_blocked';
      }
      this.hp = Math.max(0, (Number.isFinite(this.hp) ? this.hp : 2) - 1);
      if (this.hp >= 1) {
        this.tailOpen = false;
        this.stateTimer = 0;
        this.reopenCooldown = 1.6;
        this.hypnotizedTimer = 0;
        this.stunTimer = Math.max(this.stunTimer, stunDuration);
        this.hitFlashTimer = 0.30;
        this.hitCooldown = 0.28;
        this.knockbackVx = (knockDir >= 0 ? 1 : -1) * 110;
        this.knockbackTimer = 0.20;
        if (particles) {
          const cx = this.x + this.w * 0.5;
          const cy = this.y + this.h * 0.45;
          particles.Burst(cx, cy, '#10b981', 12);
          particles.Burst(cx, cy, '#2563eb', 8);
          particles.Burst(cx, cy, '#fbbf24', 6);
        }
        return 'damaged';
      }
      this.dead = true;
      this.tailOpen = false;
      return 'killed';
    }

    update(dt, player = null, particles = null, sound = null) {
      if (this.dead) return;
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      this.animTimer += dt * (this.slowTimer > 0 ? 0.6 : 1.0);
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (tickHeavyHitFields(this, dt)) return;
      if (this.isDisabled()) {
        this.tailOpen = false;
        return;
      }
      if (this.reopenCooldown > 0) this.reopenCooldown = Math.max(0, this.reopenCooldown - dt);

      this.stateTimer += dt;
      if (!this.tailOpen) {
        const playerNear =
          player &&
          !player.dead &&
          Math.abs(player.x + player.w * 0.5 - (this.x + this.w * 0.5)) < 105 &&
          Math.abs(player.y + player.h - (this.y + this.h)) < 75;
        if (this.reopenCooldown <= 0 && (this.stateTimer >= this.passiveDuration || playerNear)) {
          this.tailOpen = true;
          this.stateTimer = 0;
          this.vx = 0;
          this.shakeParticleTimer = 0;
          if (player && !player.dead) {
            this.facing = player.x + player.w * 0.5 >= this.x + this.w * 0.5 ? 'right' : 'left';
          }
          if (particles) {
            const cx = this.x + this.w * 0.5;
            const cy = this.y + this.h * 0.42;
            particles.Burst(cx, cy, '#10b981', 8);
            particles.Burst(cx, cy, '#fbbf24', 6);
          }
          if (sound && typeof sound.peacockFan === 'function') {
            sound.peacockFan();
          }
        }
      } else {
        this.vx = 0;
        this.shakeParticleTimer += dt;
        if (particles && this.shakeParticleTimer >= 0.35) {
          this.shakeParticleTimer = 0;
          const cx = this.x + this.w * 0.5 + (Math.random() - 0.5) * 28;
          const cy = this.y + this.h * 0.35 + (Math.random() - 0.5) * 18;
          particles.Sparkle(cx, cy, Math.random() < 0.5 ? '#10b981' : '#fbbf24');
        }
        if (this.stateTimer >= this.openDuration) {
          this.tailOpen = false;
          this.stateTimer = 0;
          this.reopenCooldown = 1.4;
        }
      }

      if (!this.tailOpen) {
        const dir = this.facing === 'right' ? 1 : -1;
        this.vx = dir * this.baseSpeed * spdScale;
        this.x += this.vx * dt;
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.facing = 'right';
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this.facing = 'left';
        }
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawPeacockHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.tailOpen,
        this.hitFlashTimer > 0,
        this.hp
      );
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer,
        this.slowTimer,
        this.h
      );
    }
  }

  // ==========================================================================
  // MADRID (PARQUE DEL RETIRO): CICLISTA LOCO (CrazyCyclistEnemy) — 1 HP
  // Patrulla continua y rápida de punta a punta entre pozos sin detenerse jamás.
  // No persigue al jugador ni tiene fuego amigo; muere de 1 solo golpe.
  // ==========================================================================
  class CrazyCyclistEnemy {
    constructor(x, y, minX, maxX, speed = 158, levelIndex = 0) {
      this.w = 42;
      this.h = 44;
      this.x = x;
      this.y = y - this.h;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.max(135, Math.abs(speed)) * getLevelSpeedScale(levelIndex);
      this.facing = speed >= 0 ? 'right' : 'left';
      this.vx = (this.facing === 'right' ? 1 : -1) * this.baseSpeed;
      this.dead = false;
      this.hp = 1;
      this.maxHp = 1;
      this.pauseTimer = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 4;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false;
    }

    update(dt) {
      if (this.dead) return;
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      this.animTimer += dt * (this.slowTimer > 0 ? 0.55 : 1.0);
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      this.pauseTimer = 0;
      this.vx = (this.facing === 'right' ? 1 : -1) * this.baseSpeed * spdScale;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.vx = Math.abs(this.vx);
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.vx = -Math.abs(this.vx);
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawCrazyCyclistHD(ctx, screenX, screenY, this.facing, this.animTimer, this.isDisabled());
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer,
        this.slowTimer,
        this.h
      );
    }
  }

  // ==========================================================================
  // MADRID: COTORRA VERDE (GreenParakeetEnemy)
  // Ave invasora muy rápida y común en Madrid. Vuela en trayectoria sinusoidal
  // a media altura. Al escuchar el ladrido doble de la Tina ("¡Guau, guau!"),
  // huye despavorida hacia arriba fuera de la pantalla.
  // ==========================================================================
  class GreenParakeetEnemy {
    constructor(x, baseY, minX, maxX, ampY = 36, speed = 120, levelIndex = 0, variant = 'madrid') {
      this.x = x;
      this.baseY = baseY;
      this.y = baseY;
      this.w = 28;
      this.h = 22;
      this.minX = minX;
      this.maxX = maxX;
      this.ampY = ampY;
      this.levelIndex = levelIndex;
      this.variant = variant || 'madrid';
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * (this.variant === 'barcelona' ? 1.02 : 1.15);
      this.vx = this.baseSpeed;
      this.vy = 0;
      this.facing = 'right';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 6;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -450;
      this.vx = this.facing === 'left' ? -220 : 220;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -120) {
          this.dead = true;
        }
        return;
      }

      if (this.isDisabled()) return;

      const dir = this.facing === 'right' ? 1 : -1;
      this.x += dir * this.baseSpeed * dt;
      this.y = this.baseY + Math.sin(this.animTimer * 4.6) * this.ampY;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      if (!this.scaredFlying && this.y < 420) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawGreenParakeetHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.scaredFlying,
        false,
        this.variant
      );
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer
      );
    }
  }

  // ==========================================================================
  // CLÍMAX FINAL MADRID (NIVEL 4): ENJAMBRE DE 20 COTORRAS VERDES (SwarmParakeet)
  // Aparecen en picada coordinada hacia el jugador cerca del Palacio Real.
  // El ladrido doble de la Tina ("¡Guau, guau!") las dispersa a todas en desbandada.
  // ==========================================================================
  class SwarmParakeet {
    constructor(x, y, speed = 390) {
      this.x = x;
      this.y = y;
      this.w = 26;
      this.h = 20;
      this.speed = speed;
      this.vx = -speed * 0.65;
      this.vy = 0;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 4;
      this.attackSpeed = speed + Math.random() * 45;
      this.homingAgility = 7.5 + Math.random() * 3.5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -540 - Math.random() * 140;
      this.vx = (Math.random() - 0.5) * 360;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -120) {
          this.dead = true;
        }
        return;
      }

      if (this.isDisabled()) return;

      // HOMING AGRESIVO TELEDIRIGIDO DIRECTO HACIA EL JUGADOR
      if (leader && !leader.dead) {
        const targetX = leader.x + leader.w * 0.5;
        const targetY = leader.y + leader.h * 0.45;
        const dx = targetX - (this.x + this.w * 0.5);
        const dy = targetY - (this.y + this.h * 0.5);
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        const desiredVx = nx * this.attackSpeed;
        const desiredVy = ny * this.attackSpeed;

        this.vx += (desiredVx - this.vx) * Math.min(1, this.homingAgility * dt);
        this.vy += (desiredVy - this.vy) * Math.min(1, this.homingAgility * dt);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.facing = this.vx >= 0 ? 'right' : 'left';
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawGreenParakeetHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.scaredFlying,
        true
      );
    }
  }

  // ==========================================================================
  // MALLORCA (+20% VELOCIDAD BASE): ENEMIGOS DEL MUNDO 3 (PALMA DE MALLORCA)
  // ==========================================================================
  // 1. MEDUSA ELÉCTRICA: Flota verticalmente sobre abismos marinos bloqueando el paso;
  //    INMUNE al pisotón (si el jugador cae encima recibe daño eléctrico).
  class ElectricJellyfishEnemy {
    constructor(x, baseY, ampY = 58, speed = 88, levelIndex = 0) {
      this.x = x;
      this.baseY = baseY;
      this.y = baseY;
      this.w = 34;
      this.h = 38;
      this.ampY = ampY;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * 1.15 * 1.2;
      this.phase = Math.random() * Math.PI * 2;
      this.freq = this.baseSpeed / Math.max(24, ampY);
      this.dead = false;
      this.isElectric = true;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      return false;
    }

    update(dt) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      this.y = this.baseY + Math.sin(this.animTimer * this.freq + this.phase) * this.ampY;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawElectricJellyfishHD(ctx, screenX, screenY, this.animTimer, this.isDisabled());
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer
      );
    }
  }

  // 2. CANGREJO COSTERO: Corre muy rápido lateralmente y levanta sus pinzas hacia
  //    arriba cuando el jugador se acerca por encima para bloquear el stomp superior.
  class CoastalCrabEnemy {
    constructor(x, y, minX, maxX, speed = 112, levelIndex = 0) {
      this.x = x;
      this.y = y - 28;
      this.w = 38;
      this.h = 28;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * 1.15 * 1.2;
      this.vx = this.baseSpeed;
      this.facing = 'right';
      this.dead = false;
      this.defenseRaised = false;
      this.guardTimer = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.defenseRaised = false;
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this.defenseRaised = false;
    }

    scareFlyUp() {
      return false;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) {
        this.defenseRaised = false;
        return;
      }

      if (this.guardTimer > 0) this.guardTimer = Math.max(0, this.guardTimer - dt);

      // Levanta las pinzas defensivas cuando siente al jugador acercándose por arriba o cayendo
      if (leader && !leader.dead) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const aboveOrJumping = leader.y + leader.h <= this.y + 30 && leader.y + leader.h >= this.y - 140;
        if (Math.abs(dx) < 96 && aboveOrJumping) {
          this.defenseRaised = true;
          this.guardTimer = 0.45;
        }
      }
      if (this.guardTimer <= 0) {
        this.defenseRaised = false;
      }

      const dir = this.facing === 'right' ? 1 : -1;
      const spd = this.defenseRaised ? this.baseSpeed * 0.55 : this.baseSpeed;
      this.vx = dir * spd;
      this.x += this.vx * dt;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawCoastalCrabHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.defenseRaised
      );
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer
      );
    }
  }

  // 3. CABRA DE TRAMUNTANA: Enemigo terrestre que embiste rápidamente en línea recta
  //    al detectar al jugador dentro de su radio de visión.
  class TramuntanaGoatEnemy {
    constructor(x, y, minX, maxX, speed = 80, levelIndex = 0) {
      this.x = x;
      this.y = y - 34;
      this.w = 42;
      this.h = 34;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.patrolSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * 1.15 * 1.2;
      this.chargeSpeed = this.patrolSpeed * 2.5;
      this.vx = this.patrolSpeed;
      this.facing = 'left';
      this.dead = false;
      this.isCharging = false;
      this.chargeTimer = 0;
      this.chargeCooldown = 0;
      initHeavyHitFields(this, 2);
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.isCharging = false;
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this.isCharging = false;
    }

    scareFlyUp() {
      return false;
    }

    triggerBounce() {}

    takeHit(knockDir = 1, clearDisable = true, ignoreCooldown = false) {
      return applyHeavyImpact(this, knockDir, { clearDisable, ignoreCooldown, chargeCooldown: 0.95 });
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (tickHeavyHitFields(this, dt)) return;
      if (this.isDisabled()) return;

      if (this.chargeCooldown > 0) this.chargeCooldown = Math.max(0, this.chargeCooldown - dt);

      if (!this.isCharging && this.chargeCooldown <= 0 && leader && !leader.dead) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = leader.y + leader.h * 0.5 - (this.y + this.h * 0.5);
        if (Math.abs(dx) <= 270 && Math.abs(dy) <= 95) {
          this.facing = dx >= 0 ? 'right' : 'left';
          this.isCharging = true;
          this.chargeTimer = 0.85;
        }
      }

      if (this.isCharging) {
        this.chargeTimer -= dt;
        const dir = this.facing === 'right' ? 1 : -1;
        this.vx = dir * this.chargeSpeed;
        this.x += this.vx * dt;
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.isCharging = false;
          this.chargeCooldown = 0.85;
          this.facing = 'right';
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this.isCharging = false;
          this.chargeCooldown = 0.85;
          this.facing = 'left';
        } else if (this.chargeTimer <= 0) {
          this.isCharging = false;
          this.chargeCooldown = 0.75;
        }
        return;
      }

      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.patrolSpeed;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawTramuntanaGoatHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.isCharging,
        this.hitFlashTimer > 0,
        this.hp
      );
      drawEnemyStatusOverlay(
        ctx,
        screenX,
        screenY,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer
      );
    }
  }

  // 4. GAVIOTA REAL (Patrulla costera rápida y versión Clímax de Tormenta Marina)
  class RoyalSeagullEnemy {
    constructor(x, baseY, minX, maxX, ampY = 46, speed = 150, levelIndex = 0) {
      this.x = x;
      this.baseY = baseY;
      this.y = baseY;
      this.w = 36;
      this.h = 26;
      this.minX = minX;
      this.maxX = maxX;
      this.ampY = ampY;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * 1.15 * 1.2;
      this.vx = -this.baseSpeed;
      this.vy = 0;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -520;
      this.vx = (Math.random() - 0.5) * 200;
      return true;
    }

    update(dt) {
      if (this.dead) return;
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      this.animTimer += dt * (this.slowTimer > 0 ? 0.55 : 1.0);
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -120) this.dead = true;
        return;
      }

      if (this.isDisabled()) return;

      this.x += this.vx * spdScale * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.vx = this.baseSpeed;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.vx = -this.baseSpeed;
        this.facing = 'left';
      }

      this.y = this.baseY + Math.sin(this.animTimer * 4.5) * this.ampY;
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      if (!this.scaredFlying) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawRoyalSeagullHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled() && !this.scaredFlying,
        this.scaredFlying,
        false
      );
      if (!this.scaredFlying) {
        drawEnemyStatusOverlay(
          ctx,
          screenX,
          screenY,
          this.w,
          this.stunTimer,
          this.hypnotizedTimer,
          this.animTimer,
          this.slowTimer,
          this.h
        );
      }
    }
  }

  class SwarmRoyalSeagull {
    constructor(x, y, speed = 420) {
      this.x = x;
      this.y = y;
      this.w = 36;
      this.h = 26;
      this.vx = -speed;
      this.vy = 70;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
      this.attackSpeed = speed + Math.random() * 48;
      this.homingAgility = 8.0 + Math.random() * 3.5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -560 - Math.random() * 140;
      this.vx = (Math.random() - 0.5) * 380;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -120) this.dead = true;
        return;
      }

      if (this.isDisabled()) return;

      if (leader && !leader.dead) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = leader.y + leader.h * 0.45 - (this.y + this.h * 0.5);
        const dist = Math.hypot(dx, dy) || 1;
        const desiredVx = (dx / dist) * this.attackSpeed;
        const desiredVy = (dy / dist) * this.attackSpeed;
        this.vx += (desiredVx - this.vx) * Math.min(1, this.homingAgility * dt);
        this.vy += (desiredVy - this.vy) * Math.min(1, this.homingAgility * dt);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.facing = this.vx >= 0 ? 'right' : 'left';
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawRoyalSeagullHD(
        ctx,
        this.x - cameraX,
        this.y,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.scaredFlying,
        true
      );
    }
  }

  // ==========================================================================
  // NIVEL 3+: PALOMA EN ZIG-ZAG (Trayectoria sinusoidal/zig-zag a media altura,
  // anticipa el salto del jugador, eliminable con stomp o gruñido de la Tina)
  // ==========================================================================
  class ZigZagPigeon {
    constructor(x, baseY, minX, maxX, ampY = 46, speed = 130, levelIndex = 2) {
      this.x = x;
      this.baseY = baseY;
      this.targetBaseY = baseY;
      this.y = baseY;
      this.w = 28;
      this.h = 22;
      this.minX = minX;
      this.maxX = maxX;
      this.ampY = ampY;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = this.baseSpeed;
      this.vy = 0;
      this.facing = 'right';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 6;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -490 - Math.random() * 120;
      this.vx = (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 90);
      this.facing = this.vx >= 0 ? 'right' : 'left';
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -80) this.dead = true;
        return;
      }

      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      // Anticipación del salto del jugador en Niveles 3 y 4
      if (this.levelIndex >= 2 && leader && Math.abs(leader.x - this.x) < 250 && !leader.onGround) {
        const predictedY = Math.max(150, Math.min(390, leader.y + leader.vy * 0.2));
        this.targetBaseY += (predictedY - this.targetBaseY) * Math.min(1, dt * 4.5);
      } else {
        this.targetBaseY += (this.baseY - this.targetBaseY) * Math.min(1, dt * 2.5);
      }

      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.vx = this.baseSpeed;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.vx = -this.baseSpeed;
        this.facing = 'left';
      }

      this.y = this.targetBaseY + Math.sin(this.animTimer * 5.2) * this.ampY;
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      if (!this.scaredFlying) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawZigZagPigeonHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled() && !this.scaredFlying,
        this.scaredFlying,
        false
      );
      if (!this.scaredFlying) {
        drawEnemyStatusOverlay(
          ctx,
          screenX,
          screenY,
          this.w,
          this.stunTimer,
          this.hypnotizedTimer,
          this.animTimer
        );
      }
    }
  }

  // ==========================================================================
  // NIVEL 4 CLÍMAX: PALOMA TELEDIRIGIDA DEL ENJAMBRE MASIVO (20 Palomas)
  // - Caza directamente al líder a gran velocidad
  // - El Gruñido Feroz de la Tina ('G') espanta instantáneamente a las 20
  // - Si la Tina está en cooldown, atacan en picada hasta drenar 3 ♥ (1 vida)
  // ==========================================================================
  class SwarmPigeon {
    constructor(x, y, speed = 395) {
      this.x = x;
      this.y = y;
      this.w = 28;
      this.h = 22;
      this.speed = speed;
      this.vx = -speed;
      this.vy = 80;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying;
    }

    stun(seconds = 1.5) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 1.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -540 - Math.random() * 160;
      this.vx = (Math.random() - 0.5) * 320;
      this.facing = this.vx >= 0 ? 'right' : 'left';
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -90) this.dead = true;
        return;
      }

      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      if (leader) {
        const tx = leader.x + leader.w * 0.5;
        const ty = leader.y + leader.h * 0.45;
        const dx = tx - (this.x + this.w * 0.5);
        const dy = ty - (this.y + this.h * 0.5);
        const dist = Math.hypot(dx, dy) || 1;
        const desiredVx = (dx / dist) * this.speed;
        const desiredVy = (dy / dist) * this.speed;
        this.vx += (desiredVx - this.vx) * Math.min(1, dt * 8);
        this.vy += (desiredVy - this.vy) * Math.min(1, dt * 8);
        this.facing = this.vx >= 0 ? 'right' : 'left';
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      const screenX = this.x - cameraX;
      const screenY = this.y;
      sprites.drawZigZagPigeonHD(
        ctx,
        screenX,
        screenY,
        this.facing,
        this.animTimer,
        this.isDisabled() && !this.scaredFlying,
        this.scaredFlying,
        true
      );
    }
  }

  // ==========================================================================
  // PLATAFORMA MÓVIL (MovingPlatform)
  // Constructor defensivo: soporta argumentos sueltos o un objeto de configuración
  // y garantiza que todas las coordenadas sean números finitos seguros.
  // ==========================================================================
  class MovingPlatform {
    constructor(x, y, w, h, endX, endY, speed = 90, style = 'mosaic', opts = null) {
      const cfg = (typeof x === 'object' && x !== null) ? x : (opts || null);
      const startX = cfg && typeof x === 'object'
        ? (Number.isFinite(cfg.x) ? cfg.x : (Number.isFinite(cfg.sx) ? cfg.sx : 0))
        : (Number.isFinite(x) ? x : 0);
      const startY = cfg && typeof x === 'object'
        ? (Number.isFinite(cfg.y) ? cfg.y : (Number.isFinite(cfg.sy) ? cfg.sy : 0))
        : (Number.isFinite(y) ? y : 0);
      const finalW = cfg && typeof x === 'object'
        ? (Number.isFinite(cfg.w) ? cfg.w : (Number.isFinite(cfg.width) ? cfg.width : 80))
        : (Number.isFinite(w) ? w : 80);
      const finalH = cfg && typeof x === 'object'
        ? (Number.isFinite(cfg.h) ? cfg.h : (Number.isFinite(cfg.height) ? cfg.height : 18))
        : (Number.isFinite(h) ? h : 18);

      const hasAngle = cfg && (Number.isFinite(cfg.angle) || Number.isFinite(cfg.angleDeg));
      const angleRad = hasAngle
        ? (Number.isFinite(cfg.angle) ? cfg.angle : (cfg.angleDeg * Math.PI) / 180)
        : 0;
      const hasDist = cfg && Number.isFinite(cfg.dist);

      let finalEndX = cfg && typeof x === 'object'
        ? (Number.isFinite(cfg.endX) ? cfg.endX : (Number.isFinite(cfg.ex) ? cfg.ex : startX))
        : (Number.isFinite(endX) ? endX : startX);
      let finalEndY = cfg && typeof x === 'object'
        ? (Number.isFinite(cfg.endY) ? cfg.endY : (Number.isFinite(cfg.ey) ? cfg.ey : startY))
        : (Number.isFinite(endY) ? endY : startY);

      if (hasAngle && hasDist) {
        finalEndX = startX + Math.cos(angleRad) * cfg.dist;
        finalEndY = startY + Math.sin(angleRad) * cfg.dist;
      }

      const finalSpeed = cfg && typeof x === 'object'
        ? (Number.isFinite(cfg.speed) ? cfg.speed : 90)
        : (Number.isFinite(speed) ? speed : 90);
      const finalStyle = cfg && typeof x === 'object'
        ? (cfg.style || 'mosaic')
        : (style || 'mosaic');

      this.startX = startX;
      this.startY = startY;
      this.endX = finalEndX;
      this.endY = finalEndY;
      this.w = finalW;
      this.h = finalH;
      this.speed = finalSpeed;
      this.style = finalStyle;
      this.isMoving = true;
      this.oneWay = true;

      this.dist = hasDist && hasAngle
        ? cfg.dist
        : Math.hypot(this.endX - this.startX, this.endY - this.startY);
      this.angle = hasAngle
        ? angleRad
        : Math.atan2(this.endY - this.startY, this.endX - this.startX);
      this.mode = (cfg && cfg.mode) ? cfg.mode : (hasAngle ? 'oscillate' : 'linear');
      this.phase = cfg && Number.isFinite(cfg.phase) ? cfg.phase : 0;

      if (this.mode === 'oscillate') {
        const progress = 0.5 - 0.5 * Math.cos(this.phase);
        const disp = this.dist * progress;
        this.x = this.startX + Math.cos(this.angle) * disp;
        this.y = this.startY + Math.sin(this.angle) * disp;
      } else {
        this.x = startX;
        this.y = startY;
      }

      this.t = 0;
      this.dir = 1;
      this.dx = 0;
      this.dy = 0;
      this.vx = 0;
      this.vy = 0;
    }

    update(dt) {
      const totalDist = Math.max(1, this.dist || Math.hypot(this.endX - this.startX, this.endY - this.startY));
      const prevX = this.x;
      const prevY = this.y;

      if (this.mode === 'oscillate') {
        const omega = (this.speed * 2) / totalDist;
        this.phase += omega * dt;
        const progress = 0.5 - 0.5 * Math.cos(this.phase);
        const disp = totalDist * progress;
        this.x = this.startX + Math.cos(this.angle) * disp;
        this.y = this.startY + Math.sin(this.angle) * disp;

        const tangentSpeed = 0.5 * totalDist * omega * Math.sin(this.phase);
        this.vx = Math.cos(this.angle) * tangentSpeed;
        this.vy = Math.sin(this.angle) * tangentSpeed;
      } else {
        this.t += (this.speed / totalDist) * dt * this.dir;
        if (this.t >= 1) {
          this.t = 1;
          this.dir = -1;
        } else if (this.t <= 0) {
          this.t = 0;
          this.dir = 1;
        }

        const s = this.t * this.t * (3 - 2 * this.t);
        this.x = this.startX + (this.endX - this.startX) * s;
        this.y = this.startY + (this.endY - this.startY) * s;
        this.vx = dt > 0 ? (this.x - prevX) / dt : 0;
        this.vy = dt > 0 ? (this.y - prevY) / dt : 0;
      }

      this.dx = this.x - prevX;
      this.dy = this.y - prevY;
    }
  }

  // ==========================================================================
  // PLATAFORMAS QUE CAEN (FallingPlatform)
  // Tiemblan y caen tras fallDelay (0.8s por defecto, 0.6s en Canarias).
  // Reaparecen tras 3.5s si caen al vacío para permitir reintentos.
  // ==========================================================================
  class FallingPlatform {
    constructor(x, y, w = 85, h = 18, style = 'wood', fallDelay = 0.8) {
      this.initialX = x;
      this.initialY = y;
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.style = style;
      this.fallDelay = Number.isFinite(fallDelay) && fallDelay > 0 ? fallDelay : 0.8;
      this.oneWay = true;
      this.isFallingPlatform = true;
      this.isMoving = true;
      this.state = 'idle'; // 'idle' | 'shaking' | 'falling' | 'respawning'
      this.shakeTimer = 0;
      this.respawnTimer = 0;
      this.vy = 0;
      this.dx = 0;
      this.dy = 0;
      this.shakeOffset = 0;
    }

    onSteppedOn() {
      if (this.state === 'idle') {
        this.state = 'shaking';
        this.shakeTimer = this.fallDelay; // Tiembla durante 0.6s-0.8s antes de desplomarse
      }
    }

    update(dt) {
      const prevX = this.x;
      const prevY = this.y;

      if (this.state === 'shaking') {
        this.shakeTimer = Math.max(0, this.shakeTimer - dt);
        this.shakeOffset = Math.sin((this.fallDelay - this.shakeTimer) * 55) * 2.8;
        this.x = this.initialX + this.shakeOffset;
        if (this.shakeTimer <= 0) {
          this.state = 'falling';
          this.vy = 80;
          this.x = this.initialX;
        }
      } else if (this.state === 'falling') {
        this.vy += 1150 * dt;
        this.y += this.vy * dt;
        if (this.y > 650) {
          this.state = 'respawning';
          this.respawnTimer = 3.5;
          this.y = -9999; // Fuera de pantalla para no estorbar
        }
      } else if (this.state === 'respawning') {
        this.respawnTimer = Math.max(0, this.respawnTimer - dt);
        if (this.respawnTimer <= 0) {
          this.state = 'idle';
          this.x = this.initialX;
          this.y = this.initialY;
          this.vy = 0;
          this.shakeOffset = 0;
        }
      }

      this.dx = this.x - prevX;
      this.dy = this.y - prevY;
    }

    draw(ctx, sprites, cameraX) {
      if (this.state === 'respawning') return;
      ctx.save();
      if (this.state === 'shaking') {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
      }
      global.BackgroundRenderer.drawPlatform(ctx, this, cameraX);
      ctx.restore();
    }
  }

  // ==========================================================================
  // COLECCIONABLES Y POWER-UPS HD:
  // 'coin' | 'burger' | 'pizza' | 'empanada' | 'smoothie' | 'angel_wings' | 'calamares'
  // Soporta caída física desde la Caja de Reserva (fromReserveDrop = true)
  // ==========================================================================
  class Collectible {
    constructor(x, y, type = 'coin', fromReserveDrop = false) {
      this.baseY = y;
      this.x = x;
      this.y = y;
      this.type = type;
      this.w = 26;
      this.h = 26;
      this.collected = false;
      this.timer = Math.random() * Math.PI * 2;
      const isPowerUpType =
        type === 'angel_wings' ||
        type === 'plant' ||
        type === 'calamares' ||
        type === 'electric_shield';
      this.isReserveDrop = Boolean(fromReserveDrop && isPowerUpType);
      this.fromReserveDrop = fromReserveDrop;
      this.isHighArcDrop = false;
      this.highArcRiseGravity = 560;
      this.vx = 0;
      this.arcBounds = null;
      this.tinaDelayTimer = 0;
      this._seenOnScreen = Boolean(fromReserveDrop);
      this.falling = fromReserveDrop;
      this.vy = this.isReserveDrop ? 148 : fromReserveDrop ? 85 : 0;
      this.pickupDelay = this.isReserveDrop ? 0.22 : fromReserveDrop ? 0.26 : 0;
      this.landingSurfaceY = 442;
      this.popTimer = 0;
      this.popDuration = 0.28;
      this.popStartY = y;
      this.popTargetY = y;
    }

    /** Escupe el coleccionable en arco lateral con retardo configurable para La Tina (1.0s para 1UP). */
    startSidewaysArc(vx, vy = -330, tinaDelay = 1.0, pickupDelay = 0.45, bounds = null) {
      this._seenOnScreen = true;
      this.falling = true;
      this.isHighArcDrop = false;
      this.popTimer = 0;
      this.vx = vx || 0;
      this.vy = vy;
      this.arcBounds = bounds || null;
      this.tinaDelayTimer = Math.max(0, Number(tinaDelay) || 0);
      this.pickupDelay = Math.max(this.pickupDelay, Number(pickupDelay) || 0);
    }

    startBlockPop(startY, targetY, duration = 0.28) {
      this._seenOnScreen = true;
      this.falling = false;
      this.isHighArcDrop = false;
      this.vx = 0;
      this.vy = 0;
      this.popDuration = Math.max(0.1, duration);
      this.popTimer = this.popDuration;
      this.popStartY = startY;
      this.popTargetY = targetY;
      this.baseY = targetY;
      this.y = startY;
      this.pickupDelay = Math.max(this.pickupDelay, 0.22);
    }

    /** Lanza el coleccionable hacia lo alto de la pantalla para luego caer suavemente hacia el suelo. */
    startHighLaunch(startY, peakY = 54) {
      this._seenOnScreen = true;
      this.falling = true;
      this.isHighArcDrop = true;
      this.popTimer = 0;
      this.highArcRiseGravity = 560;
      const riseDist = Math.max(40, startY - peakY);
      this.vy = -Math.sqrt(2 * this.highArcRiseGravity * riseDist);
      this.y = startY;
      this.baseY = startY;
      this.pickupDelay = Math.max(this.pickupDelay, 0.22);
    }

    canBePickedUp() {
      return !this.collected && this.pickupDelay <= 0;
    }

    getLandingSurfaceY(solids = [], movingPlatforms = []) {
      let bestSurfaceY = 442;
      const all = (solids || []).concat(movingPlatforms || []);
      for (let i = 0; i < all.length; i++) {
        const p = all[i];
        if (!p || p.broken || p.fallen) continue;
        if (
          this.x + this.w > p.x + 2 &&
          this.x < p.x + p.w - 2 &&
          p.y >= this.y + this.h - 14 &&
          p.y < bestSurfaceY
        ) {
          bestSurfaceY = p.y;
        }
      }
      return bestSurfaceY;
    }

    update(dt, solids = [], movingPlatforms = []) {
      if (this.collected) return;
      this.timer += dt * 4;
      if (this.pickupDelay > 0) {
        this.pickupDelay = Math.max(0, this.pickupDelay - dt);
      }
      if (this.tinaDelayTimer > 0) {
        this.tinaDelayTimer = Math.max(0, this.tinaDelayTimer - dt);
      }

      if (this.popTimer > 0) {
        this.popTimer = Math.max(0, this.popTimer - dt);
        const progress = 1 - this.popTimer / (this.popDuration || 0.28);
        const eased = 1 - (1 - progress) * (1 - progress);
        this.y = this.popStartY + (this.popTargetY - this.popStartY) * eased;
        this.baseY = this.popTargetY;
        return;
      }

      if (this.isReserveDrop) {
        this.landingSurfaceY = this.getLandingSurfaceY(solids, movingPlatforms);
      }

      if (this.falling) {
        const prevBottom = this.y + this.h;
        if (this.vx) {
          this.x += this.vx * dt;
          if (this.arcBounds) {
            if (this.x < this.arcBounds.minX) {
              this.x = this.arcBounds.minX;
              this.vx = 0;
            } else if (this.x + this.w > this.arcBounds.maxX) {
              this.x = this.arcBounds.maxX - this.w;
              this.vx = 0;
            }
          }
        }
        if (this.isReserveDrop) {
          // Caída vertical recta a velocidad media constante sin aceleración de gravedad
          this.vy = 148;
        } else if (this.isHighArcDrop) {
          if (this.vy < 0) {
            this.vy = Math.min(0, this.vy + (this.highArcRiseGravity || 560) * dt);
          } else {
            this.vy = Math.min(115, this.vy + 210 * dt);
          }
        } else {
          this.vy = Math.min(420, this.vy + 720 * dt);
        }
        this.y += this.vy * dt;

        if (this.vy >= 0) {
          const all = solids.concat(movingPlatforms || []);
          for (let i = 0; i < all.length; i++) {
            const p = all[i];
            if (!p || p.broken || p.fallen) continue;
            if (
              this.x + this.w > p.x + 2 &&
              this.x < p.x + p.w - 2 &&
              prevBottom <= p.y + 18 &&
              this.y + this.h >= p.y
            ) {
              this.y = p.y - this.h - 4;
              this.baseY = this.y;
              this.falling = false;
              this.isHighArcDrop = false;
              this.vx = 0;
              this.vy = 0;
              break;
            }
          }

          // Si cae sobre un hueco sin plataforma debajo, aterriza a altura de suelo seguro (nunca cae al vacío)
          const safeFloorY = this.isReserveDrop ? 416 : 428;
          if (this.falling && this.y >= safeFloorY) {
            this.y = safeFloorY;
            this.baseY = safeFloorY;
            this.falling = false;
            this.isHighArcDrop = false;
            this.vx = 0;
            this.vy = 0;
          }
        }
      } else {
        this.y = this.baseY + Math.sin(this.timer) * 4;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.collected) return;
      sprites.drawCollectibleHD(ctx, this.type, this.x - cameraX, this.y, this.timer);
    }
  }

  // ==========================================================================
  // BLOQUE OCULTO / INVISIBLE SECRETO (HiddenBlock)
  // Invisible y sin colisión hasta que el jugador lo golpea desde abajo.
  // ==========================================================================
  class HiddenBlock {
    constructor(x, y, w = 32, h = 32, item = 'golden_bone', style = 'secret_gold', secretKey = null, visible = false) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.item = item || 'golden_bone';
      this.style = style || 'secret_gold';
      this.secretKey = secretKey;
      this.visible = Boolean(visible);
      this.isHiddenBlock = true;
      this.oneWay = false;
      this.revealed = this.visible;
      this.hit = false;
      this.used = false;
      this.empty = false;
      this.bumpTimer = 0;
      this.bumpDuration = 0.22;
      this.bumpOffset = 0;
    }

    reveal(particles = null, sound = null) {
      const wasUsed = Boolean(this.hit || this.used || this.empty);
      if (wasUsed) {
        return {
          wasUsed: true,
          item: null,
          spawnX: this.x + (this.w - 26) * 0.5,
          spawnY: this.y - 6,
          targetY: this.y - 32
        };
      }
      const rewardItem = this.item || 'golden_bone';
      this.revealed = true;
      this.hit = true;
      this.used = true;
      this.empty = true;
      this.item = null;
      this.bumpTimer = this.bumpDuration;
      if (sound && typeof sound.playHiddenBlockReveal === 'function') {
        sound.playHiddenBlockReveal();
      } else if (sound && typeof sound.menuSelect === 'function') {
        sound.menuSelect();
      }
      if (particles) {
        particles.Burst(this.x + this.w * 0.5, this.y + this.h * 0.5, '#d99b52', 16);
        particles.Burst(this.x + this.w * 0.5, this.y + this.h * 0.5, '#fef3c7', 10);
        particles.FloatingText(
          this.x - 24,
          this.y - 12,
          this.visible ? '🧭 ¡SUMINISTROS!' : '✨ ¡CAJA SECRETA!',
          '#fde047'
        );
      }
      return {
        wasUsed: false,
        item: rewardItem,
        spawnX: this.x + (this.w - 26) * 0.5,
        spawnY: this.y - 6,
        targetY: this.y - 32
      };
    }

    update(dt) {
      if (this.bumpTimer > 0) {
        this.bumpTimer = Math.max(0, this.bumpTimer - dt);
        const progress = 1 - this.bumpTimer / (this.bumpDuration || 0.22);
        this.bumpOffset = -Math.sin(progress * Math.PI) * 8;
      } else {
        this.bumpOffset = 0;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (!this.revealed) return;
      if (sprites && typeof sprites.drawHiddenBlockHD === 'function') {
        sprites.drawHiddenBlockHD(ctx, this, cameraX);
      }
    }
  }

  // ==========================================================================
  // PROYECTIL BOTÁNICO DE GRAVEDAD PROGRESIVA: PLANTA / HOJA (Tecla D)
  // - Tramo inicial tenso (~150 px con gravedad leve) que curva suavemente hacia
  //   abajo hasta tocar suelo (~380-420 px en horizontal).
  // - Soporta tiro horizontal (0°), diagonal arriba (45° en arco parabólico
  //   con ↑) y diagonal abajo (+45° en el aire con ↓).
  // - Desaparece con partículas verdes/hojas al chocar suelo o plataformas.
  // ==========================================================================
  class PlantProjectile {
    constructor(x, y, dirX = 1, dirY = 0) {
      this.x = x;
      this.y = y;
      this.startX = x;
      this.startY = y;
      this.w = 20;
      this.h = 20;
      this.speed = 540;

      const norm = Math.hypot(dirX, dirY) || 1;
      this.dirX = dirX / norm;
      this.dirY = dirY / norm;
      this.vx = this.dirX * this.speed;
      this.vy = this.dirY * this.speed;

      // Gravedad progresiva: arranque firme y caída parabólica (+25 % de alcance: ~252 px en suelo, ~414 px a 45°)
      const isDiagonal = Math.abs(this.dirY) > 0.1;
      this.baseGravity = isDiagonal ? 13 : 26;
      this.maxGravity = isDiagonal ? 2360 : 3700;
      this.gravityStartDist = 94;
      this.gravityRampDist = 238;
      this.gravity = this.baseGravity;
      this.dead = false;
      this.deflected = false;
      this.damageDisabled = false;
      this.deflectLife = 0;
      this.animTimer = 0;
    }

    computeProgressiveGravity() {
      const traveled = Math.hypot(this.x - this.startX, this.y - this.startY);
      const u = Math.min(1, Math.max(0, traveled - this.gravityStartDist) / this.gravityRampDist);
      return this.baseGravity + (this.maxGravity - this.baseGravity) * (u * u);
    }

    emitSurfaceImpact(particles, impactX, impactY) {
      if (!particles) return;
      if (typeof particles.Burst === 'function') {
        particles.Burst(impactX, impactY, '#22c55e', 7);
      }
      if (Array.isArray(particles.particles)) {
        const leafPalette = ['#4ade80', '#bef264', '#16a34a'];
        for (let i = 0; i < 5; i++) {
          const spreadAngle = -Math.PI * (0.15 + 0.7 * (i / 4)) + (Math.random() - 0.5) * 0.28;
          const speed = 55 + Math.random() * 95;
          particles.particles.push({
            x: impactX + (Math.random() - 0.5) * 6,
            y: impactY - 1,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed - 25,
            radius: 3.4 + Math.random() * 1.4,
            color: leafPalette[i % leafPalette.length],
            life: 0.34 + Math.random() * 0.18,
            maxLife: 0.52,
            gravity: 340,
            shape: 'leaf',
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 6)
          });
        }
      }
    }

    findSurfaceCollision(solids, platforms, prevX, prevY, prevBottom) {
      const horizOverlap = (s) => this.x + this.w > s.x && this.x < s.x + s.w;
      const surfaceLists = [solids, platforms];
      for (let li = 0; li < surfaceLists.length; li++) {
        const list = surfaceLists[li];
        if (!Array.isArray(list)) continue;
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          if (!s || !(s.w > 0 && s.h > 0)) continue;
          if (s.revealed === false && s.visible === false) continue;
          if (s.state === 'respawning' || s.y < -500) continue;

          const isOneWay = Boolean(s.oneWay || s.isOneWay);
          if (this.vy >= 0 && prevBottom <= s.y + 8 && this.y + this.h >= s.y && horizOverlap(s)) {
            return {
              snapY: s.y - this.h,
              impactX: this.x + this.w * 0.5,
              impactY: s.y
            };
          }
          if (isOneWay) continue;

          if (horizOverlap(s) && this.y + this.h >= s.y && this.y < s.y + s.h) {
            if (prevY >= s.y + s.h - 8 && this.vy < 0) {
              return { snapY: s.y + s.h, impactX: this.x + this.w * 0.5, impactY: s.y + s.h };
            }
            if (prevX + this.w <= s.x + 8) {
              return { snapX: s.x - this.w, impactX: s.x, impactY: this.y + this.h * 0.5 };
            }
            if (prevX >= s.x + s.w - 8) {
              return { snapX: s.x + s.w, impactX: s.x + s.w, impactY: this.y + this.h * 0.5 };
            }
            return {
              impactX: this.x + this.w * 0.5,
              impactY: Math.min(Math.max(this.y + this.h * 0.5, s.y), s.y + s.h)
            };
          }
        }
      }
      return null;
    }

    deflectFromShield(shieldX = null) {
      if (this.deflected) return;
      this.deflected = true;
      this.damageDisabled = true;
      this.dead = false;
      const prevVx =
        Number.isFinite(this.vx) && this.vx !== 0
          ? this.vx
          : (this.dirX >= 0 ? 1 : -1) * this.speed;
      this.vx = -Math.sign(prevVx) * Math.max(240, Math.abs(prevVx) * 0.48);
      this.vy = -Math.max(195, Math.abs(this.vy || 0) * 0.35 + 210);
      this.gravity = 980;
      this.deflectLife = 0.42;
      if (Number.isFinite(shieldX)) {
        this.x = prevVx > 0 ? Math.min(this.x, shieldX - this.w) : Math.max(this.x, shieldX);
      }
    }

    update(dt, solids = [], movingPlatforms = [], particles = null, cameraX = 0, viewW = 960, viewH = 540) {
      if (this.dead) return;
      this.animTimer += dt;

      if (this.deflected) {
        this.deflectLife -= dt;
        if (this.deflectLife <= 0) {
          this.dead = true;
          return;
        }
        if (particles && Math.random() < 0.65) {
          particles.Sparkle(
            this.x + 10,
            this.y + 10,
            Math.random() < 0.5 ? '#fde047' : '#f8fafc'
          );
        }
      } else {
        this.gravity = this.computeProgressiveGravity();
        if (particles && Math.random() < 0.7) {
          particles.Sparkle(
            this.x + 10,
            this.y + 10,
            Math.random() < 0.5 ? '#bef264' : '#4ade80'
          );
        }
      }

      const prevX = this.x;
      const prevY = this.y;
      const prevBottom = this.y + this.h;

      // Arco de gravedad progresiva (o rebote tras bloqueo con escudo)
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (!this.deflected) {
        const hit = this.findSurfaceCollision(solids, movingPlatforms, prevX, prevY, prevBottom);
        if (hit) {
          if (Number.isFinite(hit.snapX)) this.x = hit.snapX;
          if (Number.isFinite(hit.snapY)) this.y = hit.snapY;
          this.emitSurfaceImpact(particles, hit.impactX, hit.impactY);
          this.dead = true;
          return;
        }
      }

      // Desaparece al salir del encuadre visible de la cámara
      if (
        this.x + this.w < cameraX - 36 ||
        this.x > cameraX + viewW + 36 ||
        this.y + this.h < -36 ||
        this.y > viewH + 36
      ) {
        this.dead = true;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      if (this.deflected) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.deflectLife / 0.28));
        sprites.drawPlantProjectileHD(ctx, this.x - cameraX, this.y, this.vx, this.vy, this.animTimer * 3.2);
        ctx.restore();
        return;
      }
      sprites.drawPlantProjectileHD(ctx, this.x - cameraX, this.y, this.vx, this.vy, this.animTimer);
    }
  }

  const CalamaresProjectile = PlantProjectile;

  // ==========================================================================
  // SISTEMA DE PARTÍCULAS HD A 60 FPS (Grietas y escombros para Nico,
  // Corazones para Andrea, Ondas expansivas para la Tina, Chispas eléctricas)
  // ==========================================================================
  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.rings = [];
      this.cracks = [];
    }

    Burst(x, y, color, count = 14) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 65 + Math.random() * 175;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          radius: 2.5 + Math.random() * 3.0,
          color,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          gravity: 420
        });
      }
    }

    EarthquakeWave(x, y, scale = 1) {
      const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
      this.rings.push({
        x,
        y,
        r: 14 * s,
        maxR: 200 * s,
        color: '#fbbf24',
        life: 0.48,
        maxLife: 0.48,
        type: 'quake'
      });

      // Grietas sísmicas en el suelo
      const segments = [];
      for (let b = -3; b <= 3; b++) {
        if (b === 0) continue;
        segments.push({
          x1: x + b * 12 * s,
          y1: y,
          x2: x + (b * 24 + (Math.random() - 0.5) * 10) * s,
          y2: y + (10 + Math.random() * 14) * s
        });
      }
      this.cracks.push({
        x,
        y,
        segments,
        life: 1.8,
        maxLife: 1.8
      });

      // Escombros de roca saliendo disparados
      const count = s < 0.8 ? 16 : 24;
      for (let i = 0; i < count; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 44 * s,
          y: y - 4 * s,
          vx: dir * (50 + Math.random() * 250) * s,
          vy: (-130 - Math.random() * 240) * s,
          radius: (3 + Math.random() * 3.5) * Math.max(0.65, s),
          color: i % 3 === 0 ? '#fbbf24' : '#94a3b8',
          life: 0.6,
          maxLife: 0.6,
          gravity: 700 * Math.max(0.6, s)
        });
      }
    }

    HypnoticHeartWave(x, y, scale = 1) {
      const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
      this.rings.push({
        x,
        y,
        r: 16 * s,
        maxR: 235 * s,
        color: '#f43f5e',
        life: 0.56,
        maxLife: 0.56,
        type: 'heart'
      });
      const count = s < 0.8 ? 14 : 18;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = (75 + Math.random() * 135) * s;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 25 * s,
          text: '♥',
          color: i % 2 === 0 ? '#f43f5e' : '#fb7185',
          life: 0.9,
          maxLife: 0.9,
          gravity: -35 * s
        });
      }
    }

    TinaSonicGrowlWave(x, y) {
      for (let w = 0; w < 3; w++) {
        this.rings.push({
          x,
          y,
          r: 10 + w * 18,
          maxR: 380 + w * 40,
          color: w % 2 === 0 ? '#10b981' : '#6ee7b7',
          life: 0.65 + w * 0.1,
          maxLife: 0.65 + w * 0.1,
          type: 'sonic'
        });
      }
    }

    ElectricSpark(cx, cy, radius) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      this.particles.push({
        x: cx + Math.cos(ang) * r,
        y: cy + Math.sin(ang) * r,
        vx: Math.cos(ang) * (40 + Math.random() * 80),
        vy: Math.sin(ang) * (40 + Math.random() * 80),
        radius: 2.0,
        color: Math.random() < 0.5 ? '#fde047' : '#38bdf8',
        life: 0.22,
        maxLife: 0.22,
        gravity: 0
      });
    }

    FeatherBurst(cx, cy) {
      for (let i = 0; i < 12; i++) {
        const ang = Math.PI * 0.2 + (Math.PI * 0.6 * i) / 12;
        this.particles.push({
          x: cx + (Math.random() - 0.5) * 18,
          y: cy,
          vx: Math.cos(ang) * (40 + Math.random() * 90) * (i % 2 === 0 ? 1 : -1),
          vy: 20 + Math.random() * 60,
          radius: 3.0,
          color: i % 2 === 0 ? '#ffffff' : '#fef08a',
          life: 0.55,
          maxLife: 0.55,
          gravity: -25
        });
      }
    }

    Sparkle(x, y, color = '#fbbf24') {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 30,
        vy: -20 - Math.random() * 40,
        radius: 2.2,
        color,
        life: 0.35,
        maxLife: 0.35,
        gravity: 0
      });
    }

    Dust(x, y) {
      for (let i = 0; i < 7; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y - 2,
          vx: (Math.random() - 0.5) * 85,
          vy: -15 - Math.random() * 35,
          radius: 2.8,
          color: '#cbd5e1',
          life: 0.28,
          maxLife: 0.28,
          gravity: 50
        });
      }
    }

    FloatingText(x, y, text, color = '#fbbf24') {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: -55,
        text,
        color,
        life: 0.95,
        maxLife: 0.95,
        gravity: 0
      });
    }

    update(dt) {
      for (let i = this.cracks.length - 1; i >= 0; i--) {
        this.cracks[i].life -= dt;
        if (this.cracks[i].life <= 0) this.cracks.splice(i, 1);
      }

      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.life -= dt;
        if (r.life <= 0) {
          this.rings.splice(i, 1);
          continue;
        }
        const progress = 1 - r.life / r.maxLife;
        r.r = 12 + (r.maxR - 12) * progress;
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.gravity || 0) * dt;
        if (p.rotSpeed) p.rotation = (p.rotation || 0) + p.rotSpeed * dt;
      }
    }

    draw(ctx, cameraX = 0) {
      ctx.save();

      // 1. Grietas sísmicas en el suelo (Terremoto de Nico)
      for (let i = 0; i < this.cracks.length; i++) {
        const c = this.cracks[i];
        ctx.globalAlpha = Math.max(0, c.life / c.maxLife);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        c.segments.forEach((seg) => {
          ctx.beginPath();
          ctx.moveTo(seg.x1 - cameraX, seg.y1);
          ctx.lineTo(seg.x2 - cameraX, seg.y2);
          ctx.stroke();
        });
      }

      // 2. Ondas expansivas (Terremoto, Pose Hipnótica y Gruñido de la Tina)
      for (let i = 0; i < this.rings.length; i++) {
        const r = this.rings[i];
        const alpha = Math.max(0, r.life / r.maxLife);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.type === 'quake' ? 5 : 4;
        ctx.beginPath();
        if (r.type === 'quake') {
          ctx.ellipse(r.x - cameraX, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(r.x - cameraX, r.y, r.r, 0, Math.PI * 2);
        }
        ctx.stroke();
      }

      // 3. Partículas suaves HD
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        if (p.text) {
          ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 3;
          ctx.strokeText(p.text, p.x - cameraX, p.y);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x - cameraX, p.y);
        } else if (p.shape === 'leaf') {
          const r = p.radius || 3.8;
          ctx.save();
          ctx.translate(p.x - cameraX, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.35, r * 0.68, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(-r * 0.9, 0);
          ctx.lineTo(r * 0.9, 0);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x - cameraX, p.y, p.radius || 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  // ==========================================================================
  // PARK GÜELL (EVENTO ÚNICO POR PARTIDA): LA SALAMANDRA / LAGARTIJA DE TRENCADÍS
  // Corre a gran velocidad un máximo de 3 pasadas (ida, vuelta e ida) sobre una
  // plataforma larga cerca del 50 %; derrotarla otorga 1 VIDA EXTRA (con delay 1s Tina).
  // ==========================================================================
  class GaudiLizardEnemy {
    constructor(
      x,
      surfaceY,
      platformX = 3290,
      platformW = 480,
      minX = 3298,
      maxX = 3762,
      speed = 296,
      levelIndex = 2,
      triggerX = 3060,
      maxPasses = 3
    ) {
      this.w = 56;
      this.h = 30;
      this.platformX = platformX;
      this.platformW = platformW;
      this.surfaceY = surfaceY;
      this.minX = minX;
      this.maxX = maxX;
      this.x = Number.isFinite(x) ? x : maxX - this.w;
      this.y = surfaceY - this.h;
      this.levelIndex = levelIndex;
      this.runSpeed = Math.max(270, Math.abs(speed));
      this.triggerX = Number.isFinite(triggerX) ? triggerX : platformX - 240;
      this.maxPasses = Math.max(1, maxPasses || 3);
      this.passesCompleted = 0;
      this.state = 'waiting'; // 'waiting' | 'running' | 'escaping'
      this.facing = 'left';
      this.vx = -this.runSpeed;
      this.vy = 0;
      this.dead = false;
      this.defeated = false;
      this.escaped = false;
      this.escapeTimer = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = 0;
    }

    canReceiveStatus() {
      return this.state === 'running' && !this.dead && !this.escaped && !this.defeated;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 2.5) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 2.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false;
    }

    update(dt, leader) {
      if (this.dead) return null;
      this.animTimer += dt;

      if (this.state === 'waiting') {
        if (leader && leader.x + (leader.w || 32) >= this.triggerX) {
          this.state = 'running';
          this.facing = 'left';
          this.passesCompleted = 0;
          this.x = this.maxX - this.w;
          this.y = this.surfaceY - this.h;
          this.vx = -this.runSpeed;
          return 'activated';
        }
        return null;
      }

      if (this.state === 'escaping') {
        this.escapeTimer += dt;
        this.vx = -560;
        this.vy = Math.min(480, this.vy + 900 * dt);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.escapeTimer >= 1.15 || this.y > 540 || this.x + this.w < this.platformX - 520) {
          this.escaped = true;
          this.dead = true;
        }
        return null;
      }

      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return null;

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.runSpeed * spdScale;
      this.x += this.vx * dt;

      if (this.facing === 'left' && this.x <= this.minX) {
        this.x = this.minX;
        this.passesCompleted++;
        if (this.passesCompleted >= this.maxPasses) {
          this.state = 'escaping';
          this.vy = -140;
          this.escapeTimer = 0;
          return 'escaped';
        }
        this.facing = 'right';
      } else if (this.facing === 'right' && this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.passesCompleted++;
        if (this.passesCompleted >= this.maxPasses) {
          this.state = 'escaping';
          this.vy = -140;
          this.escapeTimer = 0;
          return 'escaped';
        }
        this.facing = 'left';
      }
      return null;
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead || this.state === 'waiting') return;
      const sx = this.x - cameraX;
      if (sx < -120 || sx > 1080) return;

      if (this.state === 'running') {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawGaudiLizardHD(ctx, this, this.animTimer);
      ctx.restore();
      drawEnemyStatusOverlay(
        ctx,
        sx,
        this.y,
        this.w,
        this.stunTimer,
        this.hypnotizedTimer,
        this.animTimer,
        this.slowTimer,
        this.h
      );
    }
  }

  // ==========================================================================
  // MUNDO 4: ISLAS CANARIAS - GÉISER VOLCÁNICO Y FAUNA EXCLUSIVA
  // ==========================================================================
  class VolcanicGeyser {
    constructor(x, y, cyclePeriod = 3.2, eruptDuration = 1.15, phaseOffset = 0, plumeHeight = 150, kind = 'steam') {
      this.x = x;
      this.y = y;
      this.w = 36;
      this.h = 14;
      this.kind = kind || 'steam'; // 'steam' | 'water_spout' | 'lava_spout'
      this.cyclePeriod = Math.max(1.8, cyclePeriod);
      this.eruptDuration = Math.min(this.cyclePeriod - 0.9, eruptDuration);
      this.warningDuration = 0.72;
      this.timer = ((phaseOffset % this.cyclePeriod) + this.cyclePeriod) % this.cyclePeriod;
      this.plumeHeight = plumeHeight;
      this.currentHeight = 0;
      this.state = 'idle'; // 'idle' | 'warning' | 'erupting'
      this.animTimer = Math.random() * 4;
      this.justErupted = false;
    }

    update(dt, sound, particles, leader) {
      this.animTimer += dt;
      const prevState = this.state;
      this.timer = (this.timer + dt) % this.cyclePeriod;
      const eruptStart = this.cyclePeriod - this.eruptDuration;
      const warnStart = eruptStart - this.warningDuration;

      if (this.timer >= eruptStart) {
        this.state = 'erupting';
        const localT = this.timer - eruptStart;
        const rampUp = Math.min(1, localT / 0.16);
        const rampDown = Math.min(1, Math.max(0, (this.eruptDuration - localT) / 0.16));
        this.currentHeight = this.plumeHeight * Math.min(rampUp, rampDown);
        if (prevState !== 'erupting') {
          this.justErupted = true;
          if (leader && Math.abs(leader.x - this.x) < 520) {
            if (sound && typeof sound.geyserHiss === 'function') sound.geyserHiss();
            if (particles) {
              const burstColor = this.kind === 'water_spout' ? '#7dd3fc' : (this.kind === 'lava_spout' ? '#fb7185' : '#fdba74');
              particles.Burst(this.x + this.w / 2, this.y - 16, burstColor, 10);
            }
          }
        }
      } else if (this.timer >= warnStart) {
        this.state = 'warning';
        this.currentHeight = 0;
      } else {
        this.state = 'idle';
        this.currentHeight = 0;
      }
    }

    getDamageBox() {
      if (this.state !== 'erupting' || this.currentHeight < 22) return null;
      return {
        x: this.x + 5,
        y: this.y - this.currentHeight + 8,
        w: this.w - 10,
        h: this.currentHeight - 10
      };
    }

    draw(ctx, sprites, cameraX) {
      const screenX = this.x - cameraX;
      if (screenX < -90 || screenX > 1060) return;
      ctx.save();
      ctx.translate(-cameraX, 0);
      if (sprites && typeof sprites.drawVolcanicGeyserHD === 'function') {
        sprites.drawVolcanicGeyserHD(ctx, this, this.animTimer);
      } else {
        ctx.fillStyle = '#292524';
        ctx.fillRect(this.x, this.y - 12, this.w, 12);
        if (this.state === 'erupting') {
          ctx.fillStyle = 'rgba(224,242,254,0.8)';
          ctx.fillRect(this.x + 6, this.y - this.currentHeight, this.w - 12, this.currentHeight);
        }
      }
      ctx.restore();
    }
  }

  class GallotiaLizardEnemy {
    constructor(x, y, minX, maxX, speed = 138, levelIndex = 0) {
      this.x = x;
      this.y = y - 26;
      this.w = 44;
      this.h = 26;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.patrolSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.chargeSpeed = this.patrolSpeed * 2.25;
      this.vx = this.patrolSpeed;
      this.vy = 0;
      this.facing = 'right';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.isCharging = false;
      this.chargeTimer = 0;
      this.cooldownTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.isCharging = false;
      this.chargeTimer = 0;
    }

    hypnotize(seconds = 3.2) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this.isCharging = false;
      this.chargeTimer = 0;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.cooldownTimer > 0) this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

      if (this.isDisabled()) return;

      if (!this.isCharging && this.cooldownTimer <= 0 && leader) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = Math.abs(leader.y + leader.h - (this.y + this.h));
        if (Math.abs(dx) < 265 && dy < 72 && this.x + this.w < this.maxX - 10 && this.x > this.minX + 10) {
          this.isCharging = true;
          this.chargeTimer = 0.85;
          this.facing = dx >= 0 ? 'right' : 'left';
        }
      }

      if (this.isCharging) {
        this.chargeTimer -= dt;
        const dir = this.facing === 'right' ? 1 : -1;
        this.vx = dir * this.chargeSpeed;
        this.x += this.vx * dt;
        if (this.chargeTimer <= 0 || this.x <= this.minX || this.x + this.w >= this.maxX) {
          this.isCharging = false;
          this.cooldownTimer = 0.85;
        }
      } else {
        const dir = this.facing === 'right' ? 1 : -1;
        this.vx = dir * this.patrolSpeed;
        this.x += this.vx * dt;
      }

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.vx = this.patrolSpeed;
        this.isCharging = false;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.vx = -this.patrolSpeed;
        this.isCharging = false;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -80 || sx > 1050) return;

      drawProjectedShadow(ctx, sx + this.w / 2, this.y + this.h, this.w * 0.9, solids, movingPlatforms, cameraX);
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawGallotiaLizardHD(ctx, this, this.animTimer);
      if (this.stunTimer > 0) {
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', this.x + this.w / 2, this.y - 8);
      } else if (this.hypnotizedTimer > 0) {
        ctx.fillStyle = '#e879f9';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('♥', this.x + this.w / 2, this.y - 8);
      }
      ctx.restore();
    }
  }

  // ==========================================================================
  // CANARIAS (BOSQUE DE GARAJONAY): EL ZORRITO (GarajonayFoxEnemy) - 1 HP
  // - Exclusivo de Garajonay (Z2 Canarias).
  // - Ágil, escurridizo, esquiva tiros bajos y salta activamente entre suelo y vigas altas.
  // ==========================================================================
  const FOX_GRAVITY = 1080;

  class GarajonayFoxEnemy {
    constructor(x, y, minX, maxX, speed = 165, levelIndex = 0) {
      this.w = 40;
      this.h = 28;
      this.x = x;
      this.y = y - this.h;
      this.initialPlatformY = y;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.max(125, Math.abs(speed)) * getLevelSpeedScale(levelIndex);
      this.vx = -this.baseSpeed;
      this.vy = 0;
      this.onGround = true;
      this.facing = 'left';
      this.dead = false;
      this.hp = 1;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.aiState = 'patrol';
      this.crouchTimer = 0;
      this.verticalCooldown = 0.7;
      this.attackCooldown = 0;
      this.dodgeCooldown = 0;
      this.patrolHopCooldown = 1.6 + Math.random() * 1.2;
      this.dartTimer = 1.1 + Math.random() * 1.1;
      this.jumpTargetPlat = null;
      this.dropFromPlat = null;
      this.dropLandingX = 0;
      this.attackDir = 1;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this._resetTransientJumpState();
    }

    hypnotize(seconds = 3.2) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this._resetTransientJumpState();
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    _resetTransientJumpState() {
      if (this.aiState !== 'patrol') {
        this.aiState = 'patrol';
        this.crouchTimer = 0;
        this.jumpTargetPlat = null;
        this.dropFromPlat = null;
        this.vx *= 0.25;
      }
    }

    _hasFloorSupportAt(platforms, probeX, targetY, toleranceY = 12) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken) continue;
        if (probeX >= p.x + 2 && probeX <= p.x + p.w - 2 && Math.abs(p.y - targetY) <= toleranceY) {
          return true;
        }
      }
      return false;
    }

    _findSupportingPlatform(platforms) {
      const footLeft = this.x + 4;
      const footRight = this.x + this.w - 4;
      const feetY = this.y + this.h;
      let best = null;
      let bestDiff = 6;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken) continue;
        if (footRight > p.x && footLeft < p.x + p.w) {
          const diff = Math.abs(feetY - p.y);
          if (diff <= bestDiff) {
            bestDiff = diff;
            best = p;
          }
        }
      }
      return best;
    }

    _findClimbableHighPlatform(platforms, preferX = null) {
      const foxCx = this.x + this.w * 0.5;
      let best = null;
      let bestScore = Infinity;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken || p.style === 'crane') continue;
        if (Number.isFinite(p.fallDelay) || p.isFalling) continue;
        const targetTopY = p.y - this.h;
        const deltaY = this.y - targetTopY;
        if (deltaY < 24 || deltaY > 185) continue;
        const horizontallyOutside = this.x + this.w <= p.x + 4 || this.x >= p.x + p.w - 4;
        if (!p.oneWay && !horizontallyOutside) continue;
        const platCx = p.x + p.w * 0.5;
        const distHoriz = Math.abs(foxCx - platCx);
        if (distHoriz > p.w * 0.5 + 165) continue;
        const targetBias = preferX !== null ? Math.abs(platCx - preferX) * 0.42 : 0;
        const score = distHoriz + deltaY * 0.32 + targetBias;
        if (score < bestScore) {
          bestScore = score;
          best = p;
        }
      }
      return best;
    }

    _findLowerLandingSpot(platforms, currentPlat, preferX = null) {
      if (!currentPlat) return null;
      let best = null;
      let bestScore = Infinity;
      const desiredX = preferX !== null ? preferX - this.w * 0.5 : this.x;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (!p || p.broken || p === currentPlat || p.style === 'crane') continue;
        if (Number.isFinite(p.fallDelay) || p.isFalling) continue;
        const dropDy = p.y - (this.y + this.h);
        if (dropDy < 22 || dropDy > 215) continue;
        const pSafeMin = p.x + 12;
        const pSafeMax = p.x + p.w - this.w - 12;
        if (pSafeMax < pSafeMin) continue;

        const candidates = [];
        if (currentPlat.oneWay) {
          const reachMin = Math.max(pSafeMin, currentPlat.x - 85);
          const reachMax = Math.min(pSafeMax, currentPlat.x + currentPlat.w + 85 - this.w);
          if (reachMin <= reachMax) {
            candidates.push(Math.max(reachMin, Math.min(reachMax, desiredX)));
          }
        } else {
          const leftOff = currentPlat.x - this.w - 10;
          const rightOff = currentPlat.x + currentPlat.w + 10;
          if (leftOff >= pSafeMin && leftOff <= pSafeMax) candidates.push(leftOff);
          if (rightOff >= pSafeMin && rightOff <= pSafeMax) candidates.push(rightOff);
        }

        for (let c = 0; c < candidates.length; c++) {
          const cx = candidates[c];
          if (
            !this._hasFloorSupportAt(platforms, cx + 4, p.y, 10) ||
            !this._hasFloorSupportAt(platforms, cx + this.w - 4, p.y, 10)
          ) {
            continue;
          }
          const score = Math.abs(cx - this.x) + dropDy * 0.25 + Math.abs(cx - desiredX) * 0.35;
          if (score < bestScore) {
            bestScore = score;
            best = { plat: p, targetX: cx };
          }
        }
      }
      return best;
    }

    _applyGravityAndLanding(dt, allPlatforms, ignorePlat = null) {
      const prevBottom = this.y + this.h;
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + FOX_GRAVITY * dt);
      this.y += this.vy * dt;
      this.onGround = false;

      if (this.dropFromPlat && prevBottom > this.dropFromPlat.y + 16) {
        this.dropFromPlat = null;
      }

      if (this.vy >= 0 && allPlatforms.length > 0) {
        const footLeft = this.x + 4;
        const footRight = this.x + this.w - 4;
        let landedPlat = null;
        let bestY = Infinity;
        for (let i = 0; i < allPlatforms.length; i++) {
          const p = allPlatforms[i];
          if (!p || p.broken) continue;
          if (ignorePlat && p === ignorePlat && prevBottom <= ignorePlat.y + 16) continue;
          if (
            footRight > p.x &&
            footLeft < p.x + p.w &&
            prevBottom <= p.y + 12 &&
            this.y + this.h >= p.y &&
            this.y + this.h <= p.y + 30
          ) {
            if (p.y < bestY) {
              bestY = p.y;
              landedPlat = p;
            }
          }
        }
        if (landedPlat) {
          this.y = landedPlat.y - this.h;
          this.vy = 0;
          this.onGround = true;
          this.dropFromPlat = null;
          return landedPlat;
        }
      }

      if (this.y > 540) {
        this.dead = true;
      }
      return null;
    }

    _startClimbJumpWindup(plat) {
      const foxCx = this.x + this.w * 0.5;
      this.aiState = 'crouch_up';
      this.crouchTimer = 0.11;
      this.jumpTargetPlat = plat;
      this.dropFromPlat = null;
      this.vx = 0;
      this.facing = plat.x + plat.w * 0.5 >= foxCx ? 'right' : 'left';
    }

    _startDropJumpWindup(dropSpot, currentPlat) {
      this.aiState = 'crouch_down';
      this.crouchTimer = 0.10;
      this.jumpTargetPlat = dropSpot.plat;
      this.dropLandingX = dropSpot.targetX;
      this.dropFromPlat = currentPlat && currentPlat.oneWay ? currentPlat : null;
      this.vx = 0;
      this.facing = dropSpot.targetX >= this.x ? 'right' : 'left';
    }

    update(dt, leader, solids = [], movingPlatforms = [], projectiles = []) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (this.verticalCooldown > 0) this.verticalCooldown = Math.max(0, this.verticalCooldown - dt);
      if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
      if (this.patrolHopCooldown > 0) this.patrolHopCooldown = Math.max(0, this.patrolHopCooldown - dt);
      if (this.dartTimer > 0) this.dartTimer = Math.max(0, this.dartTimer - dt);

      const allPlatforms =
        solids.length || movingPlatforms.length
          ? solids.concat(movingPlatforms)
          : [];

      let supportPlat = null;
      if (allPlatforms.length > 0 && this.onGround) {
        supportPlat = this._findSupportingPlatform(allPlatforms);
        if (supportPlat) {
          if (Number.isFinite(supportPlat.dx) && supportPlat.dx !== 0) {
            this.x += supportPlat.dx;
          }
          if (Number.isFinite(supportPlat.dy) && supportPlat.dy !== 0) {
            this.y += supportPlat.dy;
          }
        } else {
          this.onGround = false;
        }
      }

      if (this.isDisabled()) {
        if (!this.onGround && allPlatforms.length > 0) {
          this.x += this.vx * 0.25 * dt;
          const landed = this._applyGravityAndLanding(dt, allPlatforms, this.dropFromPlat);
          if (landed) {
            this.vx = 0;
            this.aiState = 'patrol';
          }
        }
        return;
      }

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;

      // 1A. Anticipación breve agachada antes de saltar HACIA ARRIBA a una viga elevada
      if (this.aiState === 'crouch_up') {
        if (!this.onGround && allPlatforms.length > 0) {
          const landed = this._applyGravityAndLanding(dt, allPlatforms);
          if (!landed) return;
        }
        this.vx = 0;
        this.crouchTimer -= dt;
        const targetPlat = this.jumpTargetPlat;
        if (targetPlat) {
          this.facing = targetPlat.x + targetPlat.w * 0.5 >= this.x + this.w * 0.5 ? 'right' : 'left';
        }
        if (this.crouchTimer <= 0) {
          if (targetPlat && !targetPlat.broken) {
            const targetTopY = targetPlat.y - this.h;
            const deltaY = Math.max(24, this.y - targetTopY);
            const clearance = 26;
            const peakH = deltaY + clearance;
            const vy0 = -Math.sqrt(2 * FOX_GRAVITY * peakH);
            const tUp = -vy0 / FOX_GRAVITY;
            const tDown = Math.sqrt((2 * clearance) / FOX_GRAVITY);
            const flightTime = Math.max(0.22, tUp + tDown);
            const leadX = Number.isFinite(targetPlat.vx) ? targetPlat.vx * flightTime * 0.65 : 0;
            const safeMin = targetPlat.x + 12 + leadX;
            const safeMax = Math.max(safeMin, targetPlat.x + targetPlat.w - this.w - 12 + leadX);
            const targetLandX = Math.max(safeMin, Math.min(safeMax, this.x + leadX * 0.5));
            const rawVx = (targetLandX - this.x) / flightTime;
            this.vx = Math.max(-275, Math.min(275, rawVx));
            this.vy = vy0;
            this.onGround = false;
            this.facing = this.vx >= 0 ? 'right' : 'left';
            this.aiState = 'climbing_jump';
            this.verticalCooldown = 1.65;
            this.patrolHopCooldown = 2.6;
          } else {
            this.aiState = 'patrol';
          }
          this.jumpTargetPlat = null;
        }
        return;
      }

      // 1B. Anticipación breve agachada antes de BAJAR de una viga hacia el suelo inferior
      if (this.aiState === 'crouch_down') {
        if (!this.onGround && allPlatforms.length > 0) {
          const landed = this._applyGravityAndLanding(dt, allPlatforms, this.dropFromPlat);
          if (!landed) return;
        }
        this.vx = 0;
        this.crouchTimer -= dt;
        if (this.crouchTimer <= 0) {
          const targetPlat = this.jumpTargetPlat;
          if (targetPlat && !targetPlat.broken) {
            const vy0 = -165;
            const fallDist = Math.max(20, (targetPlat.y - this.h) - this.y);
            const tTotal = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * FOX_GRAVITY * fallDist)) / FOX_GRAVITY;
            const rawVx = (this.dropLandingX - this.x) / Math.max(0.2, tTotal);
            this.vx = Math.max(-235, Math.min(235, rawVx));
            this.vy = vy0;
            this.onGround = false;
            if (Math.abs(this.vx) > 4) this.facing = this.vx >= 0 ? 'right' : 'left';
            this.aiState = 'drop_jump';
            this.verticalCooldown = 1.65;
            this.patrolHopCooldown = 2.6;
          } else {
            this.dropFromPlat = null;
            this.aiState = 'patrol';
          }
          this.jumpTargetPlat = null;
        }
        return;
      }

      // 1C. Anticipación de brinco ágil de caza sobre el mismo plano
      if (this.aiState === 'attack_crouch') {
        if (!this.onGround && allPlatforms.length > 0) {
          const landed = this._applyGravityAndLanding(dt, allPlatforms);
          if (!landed) return;
        }
        this.vx = 0;
        this.facing = this.attackDir >= 0 ? 'right' : 'left';
        this.crouchTimer -= dt;
        if (this.crouchTimer <= 0) {
          this.vy = -315;
          this.vx = this.attackDir * 248 * spdScale;
          this.onGround = false;
          this.aiState = 'attack_leap';
          this.attackCooldown = 1.85;
        }
        return;
      }

      // 2. Trayectorias parabólicas en el aire
      if (
        this.aiState === 'climbing_jump' ||
        this.aiState === 'drop_jump' ||
        this.aiState === 'attack_leap' ||
        this.aiState === 'dodge_jump'
      ) {
        this.x += this.vx * dt;
        const landed = this._applyGravityAndLanding(
          dt,
          allPlatforms,
          this.aiState === 'drop_jump' ? this.dropFromPlat : null
        );
        if (this.dead) return;
        if (landed) {
          if (this.aiState === 'climbing_jump' || this.aiState === 'drop_jump') {
            this.verticalCooldown = 1.5;
          }
          this.aiState = 'patrol';
        }
        return;
      }

      // 3. Caída libre continua si perdió soporte real
      if (!this.onGround && allPlatforms.length > 0) {
        const landed = this._applyGravityAndLanding(dt, allPlatforms);
        if (this.dead) return;
        if (landed) {
          this.aiState = 'patrol';
        }
        return;
      }

      // 4. Esquiva ágil saltando por encima de proyectiles bajos de Planta [Z] (solo sobre suelo seguro)
      if (this.onGround && this.dodgeCooldown <= 0 && Array.isArray(projectiles) && projectiles.length > 0) {
        for (let i = 0; i < projectiles.length; i++) {
          const p = projectiles[i];
          if (!p || p.dead) continue;
          const isLowHorizontal = Math.abs(p.vy || 0) < 45;
          const distX = (this.x + this.w * 0.5) - (p.x + (p.w || 16) * 0.5);
          if (isLowHorizontal && Math.abs(distX) >= 45 && Math.abs(distX) <= 235 && ((p.vx || 0) * distX > 0)) {
            if (p.y + (p.h || 14) * 0.5 >= this.y - 12 && p.y <= this.y + this.h + 8) {
              const foxCx = this.x + this.w * 0.5;
              const hopDir = this.facing === 'right' ? 1 : -1;
              const landSafe =
                !supportPlat ||
                this._hasFloorSupportAt(allPlatforms, foxCx + hopDir * 75, supportPlat.y, 12);
              if (landSafe) {
                this.vy = -355;
                this.vx = hopDir * this.baseSpeed * 0.9 * spdScale;
                this.onGround = false;
                this.aiState = 'dodge_jump';
                this.dodgeCooldown = 1.1;
                return;
              }
            }
          }
        }
      }

      // 5. Lógica activa de persecución y saltos entre vigas elevadas y suelo
      const foxCx = this.x + this.w * 0.5;
      const foxFeetY = this.y + this.h;
      let chasingPlayer = false;

      if (leader && !leader.dead) {
        const leaderCx = leader.x + leader.w * 0.5;
        const leaderFeetY = leader.y + leader.h;
        const dx = leaderCx - foxCx;
        const absDx = Math.abs(dx);

        // A. Si el jugador está debajo y el zorrito está en viga elevada -> saltar abajo limpiamente
        if (
          allPlatforms.length > 0 &&
          supportPlat &&
          foxFeetY < 440 &&
          this.verticalCooldown <= 0 &&
          leaderFeetY >= foxFeetY + 20 &&
          absDx < 245
        ) {
          const dropSpot = this._findLowerLandingSpot(allPlatforms, supportPlat, leaderCx);
          if (dropSpot) {
            this._startDropJumpWindup(dropSpot, supportPlat);
            return;
          }
        }

        // B. Si el jugador está en viga superior cercana -> saltar arriba para cazarlo
        if (
          allPlatforms.length > 0 &&
          this.verticalCooldown <= 0 &&
          leaderFeetY <= this.y - 16 &&
          leaderFeetY >= this.y - 185 &&
          absDx < 220
        ) {
          const climbPlat = this._findClimbableHighPlatform(allPlatforms, leaderCx);
          if (climbPlat) {
            this._startClimbJumpWindup(climbPlat);
            return;
          }
        }

        // C. En el mismo plano: persecución rápida y salto frontal si hay suelo seguro adelante
        if (absDx < 260 && Math.abs(leaderFeetY - foxFeetY) <= 24) {
          chasingPlayer = true;
          this.facing = dx >= 0 ? 'right' : 'left';
          const lookDir = dx >= 0 ? 1 : -1;
          if (absDx >= 68 && absDx <= 178 && this.attackCooldown <= 0) {
            const safeJump =
              !supportPlat ||
              (this._hasFloorSupportAt(allPlatforms, foxCx + lookDir * 58, supportPlat.y, 12) &&
                this._hasFloorSupportAt(allPlatforms, foxCx + lookDir * 118, supportPlat.y, 12));
            if (safeJump) {
              this.aiState = 'attack_crouch';
              this.crouchTimer = 0.09;
              this.attackDir = lookDir;
              this.vx = 0;
              return;
            }
          }
        }
      }

      // D. Incluso durante patrulla libre, subir/bajar entre vigas elevadas y suelo para dinamismo vertical
      if (allPlatforms.length > 0 && this.verticalCooldown <= 0 && this.patrolHopCooldown <= 0) {
        if (supportPlat && foxFeetY < 440) {
          const dropSpot = this._findLowerLandingSpot(allPlatforms, supportPlat, leader ? leader.x : null);
          if (dropSpot) {
            this._startDropJumpWindup(dropSpot, supportPlat);
            return;
          }
        } else {
          const climbPlat = this._findClimbableHighPlatform(allPlatforms, foxCx);
          if (climbPlat) {
            this._startClimbJumpWindup(climbPlat);
            return;
          }
        }
        this.patrolHopCooldown = 1.8;
      }

      // E. Movimiento escurridizo horizontal (con cambios rápidos de dirección)
      if (!chasingPlayer && this.dartTimer <= 0) {
        this.facing = this.facing === 'right' ? 'left' : 'right';
        this.dartTimer = 1.25 + Math.random() * 1.25;
      }

      const dir = this.facing === 'right' ? 1 : -1;
      const moveSpeed = this.baseSpeed * (chasingPlayer ? 1.26 : 1.0) * spdScale;
      const stepVx = dir * moveSpeed;
      const nextX = this.x + stepVx * dt;

      if (supportPlat && allPlatforms.length > 0) {
        const edgeTooClose =
          dir > 0
            ? nextX + this.w > supportPlat.x + supportPlat.w - 6
            : nextX < supportPlat.x + 6;
        const leadProbeX = dir > 0 ? nextX + this.w + 6 : nextX - 6;
        const floorAhead = !edgeTooClose || this._hasFloorSupportAt(allPlatforms, leadProbeX, supportPlat.y, 12);
        if (!floorAhead) {
          const safeLeft = supportPlat.x + 6;
          const safeRight = Math.max(safeLeft, supportPlat.x + supportPlat.w - this.w - 6);
          this.x = Math.max(safeLeft, Math.min(safeRight, this.x));
          this.facing = dir > 0 ? 'left' : 'right';
          this.vx = 0;
          this.dartTimer = 1.0 + Math.random() * 0.9;
          return;
        }
      }

      this.vx = stepVx;
      this.x = nextX;

      const onOriginalHeight = Math.abs(this.y + this.h - this.initialPlatformY) <= 10;
      if (onOriginalHeight || !allPlatforms.length) {
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.facing = 'right';
          this.dartTimer = 1.1;
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this.facing = 'left';
          this.dartTimer = 1.1;
        }
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      sprites.drawGarajonayFoxHD(ctx, this, cameraX, this.animTimer);
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  class CanarianHoopoeEnemy {
    constructor(x, y, minX, maxX, vx = 155, amplitude = 24, diveSpeed = 290, levelIndex = 0) {
      this.x = x;
      this.baseY = y;
      this.y = y;
      this.w = 38;
      this.h = 28;
      this.minX = minX;
      this.maxX = maxX;
      this.vx = (vx >= 0 ? 1 : -1) * Math.max(125, Math.abs(vx)) * getLevelSpeedScale(levelIndex);
      this.baseCruiseSpeed = Math.abs(this.vx);
      this.vy = 0;
      this.amplitude = amplitude;
      this.diveSpeed = diveSpeed * getLevelSpeedScale(levelIndex);
      this.timer = Math.random() * 6;
      this.animTimer = Math.random() * 5;
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.isDiving = false;
      this.diveTimer = 0;
      this.diveCooldown = 0.6 + Math.random() * 0.8;
      this.diveDirX = this.vx >= 0 ? 1 : -1;
      this.diveDirY = 1;
      this.facing = this.vx >= 0 ? 'right' : 'left';
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.isDiving = false;
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this.isDiving = false;
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.isDiving = false;
      this.vy = -500 - Math.random() * 110;
      this.vx = (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 80);
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -90) this.dead = true;
        return;
      }

      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      if (this.diveCooldown > 0) this.diveCooldown = Math.max(0, this.diveCooldown - dt);

      if (!this.isDiving && this.diveCooldown <= 0 && leader) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        const dy = (leader.y + leader.h * 0.5) - (this.y + this.h * 0.5);
        if (Math.abs(dx) > 25 && Math.abs(dx) < 270 && dy > -10 && dy < 170) {
          this.isDiving = true;
          this.diveTimer = 0.72;
          const dist = Math.max(40, Math.hypot(dx, dy));
          this.diveDirX = dx / dist;
          this.diveDirY = dy / dist;
          this.facing = this.diveDirX >= 0 ? 'right' : 'left';
        }
      }

      if (this.isDiving) {
        this.diveTimer -= dt;
        this.vx = this.diveDirX * this.diveSpeed;
        this.vy = this.diveDirY * this.diveSpeed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.diveTimer <= 0 || this.y > 410 || this.x <= this.minX || this.x + this.w >= this.maxX) {
          this.isDiving = false;
          this.diveCooldown = 1.25;
          this.vx = (this.facing === 'right' ? 1 : -1) * this.baseCruiseSpeed;
        }
      } else {
        this.timer += dt * 3.1;
        this.x += this.vx * dt;
        const targetY = this.baseY + Math.sin(this.timer) * this.amplitude;
        this.vy = (targetY - this.y) * 5.0;
        this.y += this.vy * dt;
      }

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.vx = Math.abs(this.baseCruiseSpeed);
        this.facing = 'right';
        this.isDiving = false;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.vx = -Math.abs(this.baseCruiseSpeed);
        this.facing = 'left';
        this.isDiving = false;
      }
      if (this.y < 36) this.y = 36;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -80 || sx > 1050) return;
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawCanarianHoopoeHD(ctx, this, this.animTimer);
      if (this.stunTimer > 0) {
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', this.x + this.w / 2, this.y - 8);
      } else if (this.hypnotizedTimer > 0) {
        ctx.fillStyle = '#e879f9';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('♥', this.x + this.w / 2, this.y - 8);
      }
      ctx.restore();
    }
  }

  class SwarmCanarianHoopoe {
    constructor(startX, y, speed = 265, swoopAmp = 28) {
      this.x = startX;
      this.y = y;
      this.w = 38;
      this.h = 28;
      this.speed = speed;
      this.vx = -speed;
      this.vy = 0;
      this.swoopAmp = swoopAmp;
      this.timer = Math.random() * 10;
      this.dead = false;
      this.scaredFlying = false;
      this.isSwarm = true;
      this.isDiving = false;
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -520 - Math.random() * 120;
      this.vx = 170 + Math.random() * 110;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.timer += dt;
      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -90) this.dead = true;
        return;
      }

      if (leader) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = leader.y + leader.h * 0.45 - (this.y + this.h * 0.5);
        const dist = Math.hypot(dx, dy);
        this.isDiving = dist < 240 && dy > -15;
        if (dx < 60 && dist > 8) {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed * 0.92 + Math.sin(this.timer * 7.5) * this.swoopAmp * 0.6;
        } else {
          this.vx = -this.speed * 0.85;
          this.vy = Math.sin(this.timer * 6.5) * 40;
        }
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.x < leader.x - 620) this.dead = true;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawCanarianHoopoeHD(ctx, this, this.timer);
      ctx.restore();
    }
  }

  class BlindCrabEnemy {
    constructor(x, y, minX, maxX, speed = 108, levelIndex = 0) {
      this.x = x;
      this.y = y - 28;
      this.w = 40;
      this.h = 28;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = this.baseSpeed;
      this.vy = 0;
      this.facing = 'right';
      this.dead = false;
      this.shellBroken = false;
      this.stompImmune = true;
      this.barkImmune = true;
      this.canHypnotize = false;
      initHeavyHitFields(this, 2);
      this.stunTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0;
    }

    stun(seconds = 2.5) {
      if (this.shellBroken) {
        this.stunTimer = Math.max(this.stunTimer, seconds);
      }
    }

    scareFlyUp() {
      // Totalmente inmune al ladrido sónico de La Tina
      return false;
    }

    hypnotize() {
      // Ciego: inmune a la hipnosis visual de Andrea
      return false;
    }

    triggerBounce() {}

    shatter(particles, knockDir = 1, ignoreCooldown = false) {
      if (this.dead) return 'none';
      if (!this.shellBroken) {
        this.shellBroken = true;
        this.stompImmune = false;
        this.hp = 1;
        this.hitFlashTimer = 0.30;
        this.hitCooldown = 0.28;
        this.knockbackVx = (knockDir >= 0 ? 1 : -1) * 120;
        this.knockbackTimer = 0.24;
        if (particles) {
          particles.Burst(this.x + this.w / 2, this.y + this.h / 2, '#f8fafc', 16);
          particles.Burst(this.x + this.w / 2, this.y + this.h / 2, '#94a3b8', 10);
          particles.FloatingText(this.x - 24, this.y - 14, '💥 ¡CORAZA PARTIDA!', '#fde047');
        }
        return 'cracked';
      }
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      this.hp = 0;
      this.dead = true;
      if (particles) {
        particles.Burst(this.x + this.w / 2, this.y + this.h / 2, '#f8fafc', 18);
        particles.Burst(this.x + this.w / 2, this.y + this.h / 2, '#fb923c', 12);
        particles.FloatingText(this.x - 24, this.y - 12, '💥 ¡CORAZA ROTA! +200', '#fde047');
      }
      return 'killed';
    }

    update(dt) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (tickHeavyHitFields(this, dt)) return;
      if (this.stunTimer > 0) return;
      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.baseSpeed;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.vx = this.baseSpeed;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.vx = -this.baseSpeed;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -80 || sx > 1050) return;
      drawProjectedShadow(ctx, sx + this.w / 2, this.y + this.h, this.w * 0.9, solids, movingPlatforms, cameraX);
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawBlindCrabHD(ctx, this, this.animTimer);
      ctx.restore();
      if (this.stunTimer > 0) {
        drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, 0, this.animTimer);
      }
    }
  }

  // ==========================================================================
  // SUDAMÉRICA - BUENOS AIRES: MECÁNICAS Y FAUNA URBANA
  // ==========================================================================
  function tickEnemyStatus(e, dt) {
    if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - dt);
    e.animTimer += dt * (e.slowTimer > 0 ? 0.55 : 1.0);
    if (e.stunTimer > 0) e.stunTimer = Math.max(0, e.stunTimer - dt);
    if (e.hypnotizedTimer > 0) e.hypnotizedTimer = Math.max(0, e.hypnotizedTimer - dt);
    return e.stunTimer > 0 || e.hypnotizedTimer > 0;
  }

  function patrolBetweenBounds(e, dt) {
    const dir = e.facing === 'right' ? 1 : -1;
    const spdScale = e.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
    e.vx = dir * e.baseSpeed * spdScale;
    e.x += e.vx * dt;
    if (e.x <= e.minX) {
      e.x = e.minX;
      e.facing = 'right';
    } else if (e.x + e.w >= e.maxX) {
      e.x = e.maxX - e.w;
      e.facing = 'left';
    }
  }

  class ClotheslineRope {
    constructor(x1, x2, y, sag = 14, colors = null) {
      this.x1 = Math.min(x1, x2);
      this.x2 = Math.max(x1, x2);
      this.y = y;
      this.sag = sag;
      this.colors = colors || ['#ef4444', '#38bdf8', '#facc15', '#4ade80', '#ec4899'];
      this.animTimer = 0;
    }

    getYAt(x) {
      const span = Math.max(1, this.x2 - this.x1);
      const t = Math.max(0, Math.min(1, (x - this.x1) / span));
      return this.y + 4 * this.sag * t * (1 - t);
    }

    update(dt) {
      this.animTimer += dt;
    }

    draw(ctx, sprites, cameraX) {
      if (sprites && typeof sprites.drawClotheslineRopeHD === 'function') {
        sprites.drawClotheslineRopeHD(ctx, this, cameraX, this.animTimer);
      }
    }
  }

  class SubwayVent {
    constructor(x, y, w = 52, height = 195, period = 0, phase = 0, kind = 'vent') {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = 12;
      this.height = height;
      this.period = period;
      this.timer = phase;
      this.kind = kind; // 'vent' (rejilla de Subte) | 'flame' (llama votiva del Monumento)
      this.active = true;
      this.animTimer = Math.random() * 4;
    }

    update(dt) {
      this.animTimer += dt;
      if (this.period > 0) {
        this.timer = (this.timer + dt) % this.period;
        this.active = this.timer < this.period * 0.72;
      } else {
        this.active = true;
      }
    }

    getUpdraftBox() {
      if (!this.active || this.kind === 'flame') return null;
      return {
        x: this.x + 2,
        y: this.y - this.height,
        w: this.w - 4,
        h: this.height
      };
    }

    getFlameHazardBox() {
      if (!this.active || this.kind !== 'flame') return null;
      return {
        x: this.x + 8,
        y: this.y - 48,
        w: Math.max(18, this.w - 16),
        h: 44
      };
    }

    draw(ctx, sprites, cameraX) {
      if (sprites && typeof sprites.drawSubwayVentHD === 'function') {
        sprites.drawSubwayVentHD(ctx, this, cameraX, this.animTimer);
      }
    }
  }

  class SinkingContainer {
    constructor(x, y, w = 88, h = 24, maxSink = 98, sinkSpeed = 34, color = '#dc2626') {
      this.initialX = x;
      this.initialY = y;
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.maxSink = maxSink;
      this.sinkSpeed = sinkSpeed;
      this.floatSpeed = 24;
      this.color = color;
      this.style = 'container';
      this.oneWay = true;
      this.isMoving = true;
      this.isContainer = true;
      this.steppedThisFrame = false;
      this.dx = 0;
      this.dy = 0;
    }

    onSteppedOn() {
      this.steppedThisFrame = true;
    }

    update(dt) {
      const prevY = this.y;
      if (this.steppedThisFrame) {
        this.y = Math.min(this.initialY + this.maxSink, this.y + this.sinkSpeed * dt);
      } else {
        this.y = Math.max(this.initialY, this.y - this.floatSpeed * dt);
      }
      this.steppedThisFrame = false;
      this.dx = 0;
      this.dy = this.y - prevY;
    }
  }

  const FALLING_OVERHEAD_KINDS = {
    icicle: true,
    stalactite: true,
    volcanic_rock: true,
    cargo_load: true
  };

  class OverheadHazard {
    constructor(x, y, w = 52, h = 28, kind = 'signal', label = 'RETIRO ▶') {
      this.x = x;
      this.y = y;
      this.anchorY = y;
      this.w = w;
      this.h = h;
      this.kind = kind;
      this.label = label;
      this.oneWay = false;
      this.isFallingHazard = !!FALLING_OVERHEAD_KINDS[this.kind];
      this.isSolidBlock = !this.isFallingHazard;
      this.state = 'hanging';
      this.stateTimer = 0;
      this.vy = 0;
      this.animTimer = Math.random() * 3;
    }

    update(dt, leader = null) {
      this.animTimer += dt;
      if (!this.isFallingHazard) return;

      const detectRange = this.kind === 'cargo_load' ? 115 : 96;
      const shakeTime = this.kind === 'cargo_load' ? 0.52 : 0.44;
      if (this.state === 'hanging') {
        if (leader && !leader.dead) {
          const lx = leader.x + leader.w * 0.5;
          const cx = this.x + this.w * 0.5;
          if (Math.abs(lx - cx) <= detectRange && leader.y >= this.anchorY - 12 && leader.y <= 475) {
            this.state = 'shaking';
            this.stateTimer = shakeTime;
          }
        }
      } else if (this.state === 'shaking') {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'falling';
          this.vy = 90;
        }
      } else if (this.state === 'falling') {
        this.vy = Math.min(540, this.vy + 980 * dt);
        this.y += this.vy * dt;
        if (this.y > 496) {
          this.state = 'respawning';
          this.stateTimer = 3.2;
          this.vy = 0;
        }
      } else if (this.state === 'respawning') {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.y = this.anchorY;
          this.state = 'hanging';
        }
      }
    }

    getDamageBox() {
      if (this.isFallingHazard && (this.state === 'respawning' || this.state === 'hanging')) {
        // Solo daña cuando tiembla/cae o si el jugador choca contra su cuerpo suspendido;
        // para peligros que caen, evitar golpe injusto durante respawning y respetar caja ajustada
        if (this.state === 'respawning') return null;
      }
      return { x: this.x + 5, y: this.y + 4, w: Math.max(8, this.w - 10), h: Math.max(8, this.h - 6) };
    }

    draw(ctx, sprites, cameraX) {
      if (sprites && typeof sprites.drawOverheadHazardHD === 'function') {
        sprites.drawOverheadHazardHD(ctx, this, cameraX, this.animTimer);
      }
    }
  }

  // ==========================================================================
  // ESCALADA DE IA PROGRESIVA ARGENTINA (aiTier 1..4 · Más agresiva en Rosario)
  // ==========================================================================
  function getArgentinaAIConfig(zoneTier = 1, cityKey = 'buenosaires') {
    const tier = Math.max(1, Math.min(4, Number(zoneTier) || 1));
    const isRosario = cityKey === 'rosario';
    const cityAggro = isRosario ? 1.18 : 1.0;
    const speedMult = (1 + (tier - 1) * 0.14) * (isRosario ? 1.13 : 1.0);
    const detectRange = (210 + (tier - 1) * 65) * cityAggro;
    const cooldownMult = Math.max(0.54, (1 - (tier - 1) * 0.11) * (isRosario ? 0.88 : 1.0));
    return { tier, isRosario, cityAggro, speedMult, detectRange, cooldownMult };
  }

  function initTacticalGroundFields(e, aiOpts = null) {
    e.aiTier = Math.max(1, Math.min(4, Number(aiOpts && aiOpts.aiTier) || 1));
    e.aiCity = (aiOpts && aiOpts.cityKey) || 'buenosaires';
    e.homeX = e.x;
    e.baseW = e.w;
    e.baseH = e.h;
    e.vy = 0;
    e.onGround = true;
    e.jumpCooldown = 0;
    e.dodgeCooldown = 0;
    e.crouchTimer = 0;
    e.isCrouching = false;
    e.feintTimer = 0.6 + Math.random() * 0.8;
    e.feintMode = 1;
    e.partnerBoost = false;
    e.turnCooldown = 0;
  }

  function getActiveAIPlatforms(aiCtx) {
    if (!aiCtx) return [];
    const list = [];
    const pushList = (arr) => {
      if (!arr) return;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        if (p && p.state !== 'falling' && p.state !== 'respawning' && !p.broken) {
          list.push(p);
        }
      }
    };
    pushList(aiCtx.solids);
    pushList(aiCtx.movingPlatforms);
    pushList(aiCtx.fallingPlatforms);
    return list;
  }

  function detectIncomingPlantShot(e, projectiles) {
    if (!projectiles || !projectiles.length) return null;
    const eCx = e.x + e.w * 0.5;
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p || p.dead) continue;
      const vx = Number.isFinite(p.vx) ? p.vx : (p.dirX || 0) * 300;
      const dx = eCx - (p.x + (p.w || 16) * 0.5);
      // Solo reacciona si el disparo se acerca desde media/larga distancia (>= 105px)
      if (Math.abs(dx) < 105 || Math.abs(dx) > 340) continue;
      if (vx * dx <= 0) continue;
      const pCy = p.y + (p.h || 14) * 0.5;
      if (pCy >= e.y - 18 && pCy <= e.y + e.h + 12) {
        return pCy < e.y + e.h * 0.54 ? 'duck' : 'jump';
      }
    }
    return null;
  }

  function hasSurfaceWithin(allPlatforms, testX, feetY, maxGapW = 140) {
    for (let i = 0; i < allPlatforms.length; i++) {
      const p = allPlatforms[i];
      if (!p || Math.abs(p.y - feetY) > 78) continue;
      if (testX >= p.x - maxGapW && testX <= p.x + p.w + maxGapW) {
        if (testX + 12 >= p.x && testX - 12 <= p.x + p.w) return p;
      }
    }
    return null;
  }

  function findContiguousGroundSpan(allPlatforms, e) {
    if (!allPlatforms || !allPlatforms.length || !e) return null;
    const feetY = e.y + e.h;
    const cx = e.x + (e.w || 28) * 0.5;
    let seed = null;
    for (let i = 0; i < allPlatforms.length; i++) {
      const p = allPlatforms[i];
      if (!p || Math.abs(p.y - feetY) > 16) continue;
      if (cx >= p.x - 4 && cx <= p.x + p.w + 4) {
        seed = p;
        break;
      }
    }
    if (!seed) return null;
    let spanMin = seed.x;
    let spanMax = seed.x + seed.w;
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!p || Math.abs(p.y - seed.y) > 14) continue;
        if (p.x <= spanMax + 6 && p.x + p.w >= spanMin - 6) {
          if (p.x < spanMin) {
            spanMin = p.x;
            expanded = true;
          }
          if (p.x + p.w > spanMax) {
            spanMax = p.x + p.w;
            expanded = true;
          }
        }
      }
    }
    return { x: spanMin, w: spanMax - spanMin, y: seed.y };
  }

  function clampAndReverseAtBound(e, minX, maxX, edgeDir, turnCooldownSec = 0.28) {
    const ew = e.w || 28;
    const spanW = maxX - minX;
    const pad = Math.min(8, Math.max(2, (spanW - ew) * 0.15));
    const safeMin = minX + pad;
    const safeMax = Math.max(safeMin, maxX - ew - pad);
    e.x = edgeDir > 0 ? safeMax : safeMin;
    if ((e.turnCooldown || 0) <= 0) {
      const revDir = edgeDir > 0 ? -1 : 1;
      e.vx = revDir * Math.max(40, Math.abs(e.vx || 0));
      e.facing = revDir > 0 ? 'right' : 'left';
      e.turnCooldown = turnCooldownSec;
      return revDir;
    }
    e.vx = 0;
    return edgeDir;
  }

  function updateTacticalGroundAI(e, dt, leader, aiCtx = null, opts = {}) {
    const tier = (aiCtx && aiCtx.aiTier) || e.aiTier || 1;
    const cityKey = (aiCtx && aiCtx.cityKey) || e.aiCity || 'buenosaires';
    e.aiTier = tier;
    e.aiCity = cityKey;
    const cfg = getArgentinaAIConfig(tier, cityKey);

    if (e.jumpCooldown > 0) e.jumpCooldown = Math.max(0, e.jumpCooldown - dt);
    if (e.dodgeCooldown > 0) e.dodgeCooldown = Math.max(0, e.dodgeCooldown - dt);
    if (e.turnCooldown > 0) e.turnCooldown = Math.max(0, e.turnCooldown - dt);

    // Restaurar o mantener hitbox agachada con pies anclados al suelo
    if (e.crouchTimer > 0) {
      e.crouchTimer = Math.max(0, e.crouchTimer - dt);
      if (!e.isCrouching) {
        const feetY = e.y + e.h;
        e.h = Math.max(16, Math.round((e.baseH || e.h) * 0.58));
        e.y = feetY - e.h;
        e.isCrouching = true;
      }
    } else if (e.isCrouching) {
      const feetY = e.y + e.h;
      e.h = e.baseH || e.h;
      e.y = feetY - e.h;
      e.isCrouching = false;
    }

    const allPlatforms = getActiveAIPlatforms(aiCtx);
    const dx = leader ? (leader.x + leader.w * 0.5) - (e.x + e.w * 0.5) : 9999;
    const dy = leader ? (leader.y + leader.h * 0.5) - (e.y + e.h * 0.5) : 9999;
    const absDx = Math.abs(dx);
    const inSight = Boolean(leader) && absDx <= cfg.detectRange && Math.abs(dy) < 140;

    // Tier 3+: Esquivar disparos [D] lejanos saltando o agachándose
    if (cfg.tier >= 3 && e.dodgeCooldown <= 0 && !opts.noDodge && aiCtx && aiCtx.projectiles) {
      const evadeType = detectIncomingPlantShot(e, aiCtx.projectiles);
      if (evadeType === 'duck' && e.onGround) {
        e.crouchTimer = 0.48;
        e.dodgeCooldown = cfg.isRosario ? 1.15 : 1.45;
      } else if (evadeType === 'jump' && e.onGround && e.jumpCooldown <= 0) {
        e.vy = -465;
        e.onGround = false;
        e.jumpCooldown = 0.55;
        e.dodgeCooldown = cfg.isRosario ? 1.15 : 1.45;
      }
    }

    // Tier 4: Bonificación por coordinación en pareja cercana
    e.partnerBoost = false;
    if (cfg.tier >= 4 && aiCtx && aiCtx.allies) {
      for (let i = 0; i < aiCtx.allies.length; i++) {
        const ally = aiCtx.allies[i];
        if (!ally || ally === e || ally.dead) continue;
        if (Math.hypot((ally.x - e.x), (ally.y - e.y)) < 220) {
          e.partnerBoost = true;
          break;
        }
      }
    }

    // Tier 3+: Amague y variación táctica de velocidad
    if (cfg.tier >= 3) {
      e.feintTimer -= dt;
      if (e.feintTimer <= 0) {
        e.feintTimer = cfg.isRosario ? 0.55 + Math.random() * 0.65 : 0.7 + Math.random() * 0.8;
        e.feintMode = e.feintMode === 1 ? 1.36 : 0.68;
      }
    } else {
      e.feintMode = 1;
    }

    // Cálculo de dirección y velocidad horizontal según aiTier
    const patrolSpan = Math.max(0, (e.maxX || e.x) - (e.minX || e.x));
    const canPatrol = opts.forcePatrol || patrolSpan > (e.w || 30) + 4;
    const baseSpd = Math.max(opts.minSpeed || 32, Math.abs(e.baseSpeed || 42)) * cfg.speedMult;

    let moveDir = e.facing === 'right' ? 1 : -1;
    let targetSpeed = 0;

    if (e.isCrouching) {
      targetSpeed = 0;
    } else if ((e.turnCooldown || 0) > 0) {
      // Mantener dirección post-giro estable durante turnCooldown sin re-invertir cada frame
      targetSpeed = baseSpd * (inSight ? 0.96 : 0.9);
    } else if (cfg.tier >= 2 && inSight && absDx > 10) {
      // Tier 2+: Persecución activa hacia el líder a media/larga distancia
      moveDir = dx >= 0 ? 1 : -1;
      e.facing = moveDir > 0 ? 'right' : 'left';
      targetSpeed = baseSpd * (1.22 + (cfg.tier - 2) * 0.1) * e.feintMode * (e.partnerBoost ? 1.15 : 1.0);
    } else if (canPatrol) {
      targetSpeed = baseSpd * (inSight ? 1.24 : 1.0);
    } else if (opts.tetherChase && inSight && absDx > 16) {
      // Trapito u otros guardias locales avanzan dentro de su área en Tier 1
      moveDir = dx >= 0 ? 1 : -1;
      e.facing = moveDir > 0 ? 'right' : 'left';
      targetSpeed = baseSpd * 0.95;
    }

    const supSpan = e.onGround && allPlatforms.length > 0 ? findContiguousGroundSpan(allPlatforms, e) : null;

    // Detección de obstáculos verticales (escalones / barandas) y bordes/huecos en plataformas
    if (targetSpeed > 0 && allPlatforms.length > 0 && e.onGround && e.jumpCooldown <= 0) {
      const feetY = e.y + e.h;
      const frontX = moveDir > 0 ? e.x + e.w + 10 : e.x - 10;

      // 1. Escalón / baranda enfrente -> saltar encima en Tier 2+
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!p || p.oneWay) continue;
        if (frontX >= p.x && frontX <= p.x + p.w) {
          const stepH = feetY - p.y;
          if (stepH >= 8 && stepH <= 68 && cfg.tier >= 2) {
            e.vy = -455;
            e.onGround = false;
            e.jumpCooldown = 0.55;
            break;
          } else if (stepH > 68) {
            // Muro alto: invertir dirección respetando cooldown
            if ((e.turnCooldown || 0) <= 0) {
              moveDir *= -1;
              e.facing = moveDir > 0 ? 'right' : 'left';
              e.turnCooldown = 0.25;
            } else {
              targetSpeed = 0;
            }
            break;
          }
        }
      }

      // 2. Comprobar suelo adelante o hueco saltable
      if (e.onGround && targetSpeed > 0) {
        const probeAheadX = moveDir > 0 ? e.x + e.w + 8 : e.x - 8;
        let supportAhead = false;
        for (let i = 0; i < allPlatforms.length; i++) {
          const p = allPlatforms[i];
          if (!p) continue;
          if (probeAheadX >= p.x && probeAheadX <= p.x + p.w && Math.abs(p.y - feetY) <= 18) {
            supportAhead = true;
            break;
          }
        }
        if (!supportAhead) {
          // Si hay tierra al otro lado de un hueco pequeño (24..132px), salta en Tier 2+; si no, gira en el borde con clamp y turnCooldown
          let landingFound = false;
          if (cfg.tier >= 2) {
            for (let scan = 28; scan <= 132; scan += 22) {
              const lx = e.x + e.w * 0.5 + moveDir * scan;
              if (hasSurfaceWithin(allPlatforms, lx, feetY, 0)) {
                landingFound = true;
                break;
              }
            }
          }
          if (landingFound) {
            e.vy = -445;
            e.onGround = false;
            e.jumpCooldown = 0.6;
            targetSpeed = Math.max(targetSpeed, 155 * cfg.cityAggro);
          } else if ((e.turnCooldown || 0) <= 0) {
            const edgeDir = moveDir;
            e.vx = edgeDir * targetSpeed;
            if (supSpan) {
              moveDir = clampAndReverseAtBound(e, supSpan.x, supSpan.x + supSpan.w, edgeDir, 0.28);
            } else {
              moveDir = -edgeDir;
              e.vx = -e.vx;
              e.facing = moveDir > 0 ? 'right' : 'left';
              e.turnCooldown = 0.28;
            }
            targetSpeed *= 0.85;
          } else {
            if (supSpan) {
              clampAndReverseAtBound(e, supSpan.x, supSpan.x + supSpan.w, moveDir, 0.28);
            }
            targetSpeed = 0;
          }
        }
      }

      // 3. Tier 3+: Saltar para subir a plataformas bajas donde se ubica el líder
      if (
        cfg.tier >= 3 &&
        e.onGround &&
        e.jumpCooldown <= 0 &&
        leader &&
        leader.y + leader.h < e.y - 14 &&
        leader.y + leader.h >= e.y - 122 &&
        absDx < 155
      ) {
        const center = e.x + e.w * 0.5;
        for (let i = 0; i < allPlatforms.length; i++) {
          const p = allPlatforms[i];
          if (!p) continue;
          const upGap = feetY - p.y;
          if (upGap >= 28 && upGap <= 118 && center >= p.x - 45 && center <= p.x + p.w + 45) {
            e.vy = -518;
            e.onGround = false;
            e.jumpCooldown = 0.72;
            break;
          }
        }
      }
    }

    e.vx = targetSpeed > 0 ? moveDir * targetSpeed : 0;
    e.x += e.vx * dt;

    // Límites suaves cuando está en patrulla pasiva o cuando no hay plataformas provistas
    if (allPlatforms.length === 0) {
      if (canPatrol) {
        if (e.x <= e.minX) {
          e.x = e.minX;
          if ((e.turnCooldown || 0) <= 0) {
            e.vx = Math.abs(e.vx || targetSpeed || 40);
            e.facing = 'right';
            e.turnCooldown = 0.25;
          }
        } else if (e.x + e.w >= e.maxX) {
          e.x = e.maxX - e.w;
          if ((e.turnCooldown || 0) <= 0) {
            e.vx = -Math.abs(e.vx || targetSpeed || 40);
            e.facing = 'left';
            e.turnCooldown = 0.25;
          }
        }
      } else if (opts.tetherChase) {
        const minT = (e.homeX || e.x) - 85;
        const maxT = (e.homeX || e.x) + 85;
        if (e.x < minT) {
          e.x = minT;
          if ((e.turnCooldown || 0) <= 0) {
            e.vx = Math.abs(e.vx || targetSpeed || 40);
            e.facing = 'right';
            e.turnCooldown = 0.25;
          }
        } else if (e.x > maxT) {
          e.x = maxT;
          if ((e.turnCooldown || 0) <= 0) {
            e.vx = -Math.abs(e.vx || targetSpeed || 40);
            e.facing = 'left';
            e.turnCooldown = 0.25;
          }
        }
      }
      return;
    }

    // Asegurar clamp seguro dentro del tramo continuo de suelo tras avanzar a pie
    if (e.onGround && supSpan) {
      const ew = e.w || 28;
      if (e.x < supSpan.x + 2) {
        clampAndReverseAtBound(e, supSpan.x, supSpan.x + supSpan.w, -1, 0.28);
      } else if (e.x + ew > supSpan.x + supSpan.w - 2) {
        clampAndReverseAtBound(e, supSpan.x, supSpan.x + supSpan.w, 1, 0.28);
      }
    }

    // Gravedad y aterrizaje sobre plataformas activas cuando hay gravedad/salto
    if (!e.onGround || e.vy !== 0) {
      const prevBottom = e.y + e.h;
      e.vy = Math.min(MAX_FALL_SPEED, e.vy + GRAVITY * dt);
      e.y += e.vy * dt;
      e.onGround = false;
      for (let i = 0; i < allPlatforms.length; i++) {
        const p = allPlatforms[i];
        if (!p) continue;
        if (
          e.vy >= 0 &&
          e.x + e.w - 3 > p.x &&
          e.x + 3 < p.x + p.w &&
          prevBottom <= p.y + 18 &&
          e.y + e.h >= p.y &&
          e.y + e.h <= p.y + 28
        ) {
          e.y = p.y - e.h;
          e.vy = 0;
          e.onGround = true;
          break;
        }
      }
      if (e.y > 540) e.dead = true;
    } else if (cfg.tier < 2 && canPatrol && !inSight) {
      if (e.x <= e.minX) {
        e.x = e.minX;
        if ((e.turnCooldown || 0) <= 0) {
          e.vx = Math.abs(e.vx || targetSpeed || 40);
          e.facing = 'right';
          e.turnCooldown = 0.25;
        }
      } else if (e.x + e.w >= e.maxX) {
        e.x = e.maxX - e.w;
        if ((e.turnCooldown || 0) <= 0) {
          e.vx = -Math.abs(e.vx || targetSpeed || 40);
          e.facing = 'left';
          e.turnCooldown = 0.25;
        }
      }
    }
  }

  class TrapitoEnemy {
    constructor(x, y, aiOpts = null) {
      this.x = x;
      this.y = y - 42;
      this.w = 28;
      this.h = 42;
      this.minX = x - 110;
      this.maxX = x + 110;
      this.baseSpeed = 58;
      this.vx = 0;
      this.facing = 'left';
      this.dead = false;
      this.defeated = false;
      this.scaredFleeing = false;
      this.fleeDir = 1;
      this.fleeHesitateTimer = 0;
      this.scareAlertTimer = 0;
      this.fleeSpeechTimer = 0;
      this.fleeBaseY = this.y;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
      this.swingActive = false;
      this.bubbleTimer = 0;
      this.turnCooldown = 0;
      initTacticalGroundFields(this, aiOpts);
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFleeing || this.defeated;
    }
    stun(sec = 2.5) { this.stunTimer = Math.max(this.stunTimer, sec); }
    hypnotize(sec = 2.5) { this.hypnotizedTimer = Math.max(this.hypnotizedTimer, sec); }

    scareFlee(scareOriginX, playerX = scareOriginX) {
      if (this.dead || this.scaredFleeing || this.defeated) return false;
      const cx = this.x + this.w * 0.5;
      const threatX =
        Number.isFinite(playerX) && Math.abs(cx - playerX) >= 4
          ? playerX
          : scareOriginX;
      this.fleeDir = cx >= (Number.isFinite(threatX) ? threatX : cx - 1) ? 1 : -1;
      this.scaredFleeing = true;
      this.defeated = true;
      this.swingActive = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.facing = this.fleeDir >= 0 ? 'right' : 'left';
      this.scareAlertTimer = 1.45;
      this.fleeSpeechTimer = 2.6;
      this.fleeHesitateTimer = 0.10;
      this.fleeBaseY = this.y;
      this.vy = -145;
      this.vx = 0;
      return true;
    }

    update(dt, leader, aiCtx = null) {
      if (this.dead) return;
      if (this.scaredFleeing) {
        this.animTimer += dt * 2.4;
        this.swingActive = false;
        if (this.scareAlertTimer > 0) this.scareAlertTimer = Math.max(0, this.scareAlertTimer - dt);
        if (this.fleeSpeechTimer > 0) this.fleeSpeechTimer = Math.max(0, this.fleeSpeechTimer - dt);
        if (this.fleeHesitateTimer > 0) {
          this.fleeHesitateTimer = Math.max(0, this.fleeHesitateTimer - dt);
          this.vx = 0;
        } else {
          this.facing = this.fleeDir >= 0 ? 'right' : 'left';
          this.vx = this.fleeDir * 345;
          this.x += this.vx * dt;
        }
        const allPlatforms = aiCtx
          ? []
              .concat(aiCtx.solids || [])
              .concat(aiCtx.movingPlatforms || [])
              .concat(aiCtx.fallingPlatforms || [])
          : [];
        const prevBottom = this.y + this.h;
        this.vy = Math.min(MAX_FALL_SPEED, (this.vy || 0) + GRAVITY * dt);
        this.y += this.vy * dt;
        if (allPlatforms.length > 0) {
          for (let i = 0; i < allPlatforms.length; i++) {
            const p = allPlatforms[i];
            if (!p) continue;
            if (
              this.vy >= 0 &&
              this.x + this.w - 3 > p.x &&
              this.x + 3 < p.x + p.w &&
              prevBottom <= p.y + 18 &&
              this.y + this.h >= p.y &&
              this.y + this.h <= p.y + 28
            ) {
              this.y = p.y - this.h;
              this.vy = 0;
              break;
            }
          }
          if (this.y > 540) this.dead = true;
        } else if (this.y >= this.fleeBaseY) {
          this.y = this.fleeBaseY;
          this.vy = 0;
        }
        const camX =
          aiCtx && Number.isFinite(aiCtx.cameraX)
            ? aiCtx.cameraX
            : leader
              ? leader.x - 360
              : this.x - 480;
        if (this.x + this.w < camX - 140 || this.x > camX + 1100) {
          this.dead = true;
        }
        return;
      }
      if (tickEnemyStatus(this, dt)) {
        this.swingActive = false;
        return;
      }
      updateTacticalGroundAI(this, dt, leader, aiCtx, { tetherChase: true, minSpeed: 56 });
      if (aiCtx && Array.isArray(aiCtx.allies)) {
        const minSep = 120;
        const myH = this.h || 42;
        for (let i = 0; i < aiCtx.allies.length; i++) {
          const ally = aiCtx.allies[i];
          if (
            !ally ||
            ally === this ||
            !(ally instanceof TrapitoEnemy) ||
            ally.dead ||
            ally.scaredFleeing ||
            ally.defeated ||
            (typeof ally.isDisabled === 'function' && ally.isDisabled())
          ) {
            continue;
          }
          if (Math.abs((ally.y || 0) - this.y) >= 30) continue;
          const myCx = this.x + this.w * 0.5;
          const allyCx = ally.x + (ally.w || this.w) * 0.5;
          const diffX = myCx - allyCx;
          if (Math.abs(diffX) < minSep) {
            const pushDir = diffX === 0 ? (this.x <= ally.x ? -1 : 1) : (diffX > 0 ? 1 : -1);
            const step = Math.min(220 * dt, (minSep - Math.abs(diffX)) * 0.5);
            const candidateX = this.x + pushDir * step;
            let onFirmSurface = true;
            if (Array.isArray(aiCtx.solids) && aiCtx.solids.length > 0) {
              const footY = this.y + myH;
              onFirmSurface = false;
              for (let sIdx = 0; sIdx < aiCtx.solids.length; sIdx++) {
                const s = aiCtx.solids[sIdx];
                if (!s || Math.abs(s.y - footY) > 10) continue;
                const safeMargin = s.w - this.w >= 20 ? 8 : 3;
                if (
                  candidateX >= s.x + safeMargin &&
                  candidateX + this.w <= s.x + s.w - safeMargin
                ) {
                  onFirmSurface = true;
                  break;
                }
              }
            }
            if (onFirmSurface) {
              this.x = candidateX;
              if ((this.turnCooldown || 0) <= 0 && pushDir * (this.vx || 0) < 0) {
                this.vx = pushDir * Math.max(40, Math.abs(this.vx || 0));
              }
            }
          }
        }
      }
      if (leader) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        if ((this.turnCooldown || 0) <= 0 && Math.abs(dx) > 10) {
          this.facing = dx >= 0 ? 'right' : 'left';
        }
        const swingRange = 135 + ((this.aiTier || 1) - 1) * 14 + (this.aiCity === 'rosario' ? 18 : 0);
        this.swingActive = Math.abs(dx) < swingRange && Math.abs(leader.y - this.y) < 88;
      }
    }

    getRagAttackBox() {
      if (this.dead || this.scaredFleeing || this.isDisabled() || !this.swingActive) return null;
      return { x: this.x - 10, y: this.y + 8, w: this.w + 20, h: this.h - 10 };
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const camX = Math.round(cameraX);
      const sx = Math.round(this.x - camX);
      if (sx < -160 || sx > 1120) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, camX);
      ctx.save();
      ctx.translate(-camX, 0);
      sprites.drawTrapitoHD(ctx, this, this.animTimer);
      ctx.restore();
      if (!this.scaredFleeing) {
        drawEnemyStatusOverlay(ctx, sx, Math.round(this.y), this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
      }
    }
  }

  class MotochorroEnemy {
    constructor(x, y, minX, maxX, speed = 285, levelIndex = 0, aiOpts = null) {
      this.x = x;
      this.y = y - 40;
      this.w = 50;
      this.h = 40;
      this.minX = minX;
      this.maxX = maxX;
      const tier = (aiOpts && aiOpts.aiTier) || (levelIndex + 1);
      const cityKey = (aiOpts && aiOpts.cityKey) || 'buenosaires';
      const cfg = getArgentinaAIConfig(tier, cityKey);
      this.baseSpeed = Math.abs(speed) * (1 + Math.min(0.24, levelIndex * 0.06)) * (cfg.isRosario ? 1.08 : 1.0);
      this.vx = -this.baseSpeed;
      this.facing = 'left';
      this.dead = false;
      this.defeated = false;
      this.crashingFromBark = false;
      this.justDefeated = false;
      this.scareAlertTimer = 0;
      this.homeGroundY = Number.isFinite(y) ? y : 460;
      this.crashGroundY = this.homeGroundY;
      this.bikeX = this.x;
      this.bikeY = this.y;
      this.bikeVx = 0;
      this.bikeAlpha = 1;
      this.bikeDir = -1;
      this.riderX = this.x + this.w * 0.5;
      this.riderY = this.y + 12;
      this.riderVx = 0;
      this.riderVy = 0;
      this.fallRotation = 0;
      this.fallSpinSpeed = 0;
      this.crashLanded = false;
      this.crashSettleTimer = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
      initTacticalGroundFields(this, { aiTier: tier, cityKey });
    }

    isDisabled() { return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.crashingFromBark || this.defeated; }
    stun(sec = 2.5) { this.stunTimer = Math.max(this.stunTimer, sec); }
    hypnotize(sec = 2.5) { this.hypnotizedTimer = Math.max(this.hypnotizedTimer, sec); }

    scareCrash(scareOriginX) {
      if (this.dead || this.crashingFromBark || this.defeated) return false;
      const cx = this.x + this.w * 0.5;
      const bikeDir = this.vx !== 0 ? (this.vx > 0 ? 1 : -1) : (cx >= (Number.isFinite(scareOriginX) ? scareOriginX : cx) ? 1 : -1);
      this.crashingFromBark = true;
      this.defeated = true;
      this.justDefeated = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.scareAlertTimer = 0.72;
      this.crashGroundY = this.onGround ? this.y + this.h : this.homeGroundY;
      this.bikeDir = bikeDir;
      this.bikeX = this.x;
      this.bikeY = this.y;
      this.bikeVx = bikeDir * Math.max(320, Math.abs(this.vx) || this.baseSpeed);
      this.bikeAlpha = 1.0;
      this.riderX = cx;
      this.riderY = this.y + 14;
      this.riderVx = -bikeDir * 95;
      this.riderVy = -270;
      this.fallRotation = 0;
      this.fallSpinSpeed = -bikeDir * 10.5;
      this.crashLanded = false;
      this.crashSettleTimer = 0;
      return true;
    }

    update(dt, leader = null, aiCtx = null) {
      if (this.dead) return;
      if (this.crashingFromBark) {
        this.animTimer += dt;
        if (this.scareAlertTimer > 0) this.scareAlertTimer = Math.max(0, this.scareAlertTimer - dt);
        this.bikeX += this.bikeVx * dt;
        this.bikeVx *= Math.pow(0.28, dt);
        this.bikeAlpha = Math.max(0, this.bikeAlpha - dt * 1.45);
        if (!this.crashLanded) {
          this.riderVy = Math.min(MAX_FALL_SPEED, this.riderVy + GRAVITY * dt);
          this.riderX += this.riderVx * dt;
          this.riderY += this.riderVy * dt;
          this.fallRotation += this.fallSpinSpeed * dt;
          if (this.riderY >= this.crashGroundY - 10) {
            this.riderY = this.crashGroundY - 10;
            this.crashLanded = true;
            this.crashSettleTimer = 0.16;
            this.fallRotation = (this.bikeDir >= 0 ? -1 : 1) * Math.PI * 0.5;
          }
        } else {
          this.crashSettleTimer -= dt;
          if (this.crashSettleTimer <= 0) {
            this.dead = true;
            this.justDefeated = true;
          }
        }
        return;
      }
      if (tickEnemyStatus(this, dt)) return;
      const tier = (aiCtx && aiCtx.aiTier) || this.aiTier || 1;
      const cityKey = (aiCtx && aiCtx.cityKey) || this.aiCity || 'buenosaires';
      const cfg = getArgentinaAIConfig(tier, cityKey);
      if (this.jumpCooldown > 0) this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
      if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);

      // Tier 3+: Motochorro salta disparos [D] lejanos manteniendo su patrulla veloz
      if (tier >= 3 && this.dodgeCooldown <= 0 && this.onGround && aiCtx && aiCtx.projectiles) {
        if (detectIncomingPlantShot(this, aiCtx.projectiles)) {
          this.vy = -440;
          this.onGround = false;
          this.dodgeCooldown = 1.6;
        }
      }
      const inSight = leader && Math.abs(leader.x - this.x) < cfg.detectRange && Math.abs(leader.y - this.y) < 110;
      const savedSpeed = this.baseSpeed;
      if (inSight && tier >= 2) this.baseSpeed *= 1.16;
      patrolBetweenBounds(this, dt);
      this.baseSpeed = savedSpeed;

      if (!this.onGround || this.vy !== 0) {
        const groundTop = 460 - this.h;
        this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
        this.y += this.vy * dt;
        if (this.y >= groundTop) {
          this.y = groundTop;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = (this.crashingFromBark ? this.riderX - this.w * 0.5 : this.x) - cameraX;
      if (sx < -160 || sx > 1120) return;
      if (!this.crashingFromBark) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawMotochorroHD(ctx, this, this.animTimer);
      ctx.restore();
      if (!this.crashingFromBark) {
        drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
      }
    }
  }

  class BarrabravaEnemy {
    constructor(x, y, minX, maxX, speed = 52, aiOpts = null) {
      this.x = x;
      this.y = y - 46;
      this.w = 34;
      this.h = 46;
      this.minX = minX;
      this.maxX = maxX;
      this.baseSpeed = Math.abs(speed);
      this.vx = this.baseSpeed;
      this.facing = 'left';
      this.dead = false;
      this.hasDrum = true;
      initHeavyHitFields(this, 2);
      this.noKnockbackBoundClamp = true;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
      this.beatTimer = 1.2 + Math.random() * 0.8;
      this.pulseTimer = 0;
      this.soundWaves = [];
      this.justStruckWave = false;
      initTacticalGroundFields(this, aiOpts);
    }

    isDisabled() { return this.stunTimer > 0 || this.hypnotizedTimer > 0; }
    stun(sec = 2.5) { this.stunTimer = Math.max(this.stunTimer, sec); }
    hypnotize(sec = 2.5) { this.hypnotizedTimer = Math.max(this.hypnotizedTimer, sec); }
    triggerBounce() {}

    takeHit(particles = null, knockDir = 1, clearDisable = true, ignoreCooldown = false) {
      if (this.dead) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      if (this.hasDrum || this.hp > 1) {
        // Mantener coordenada exacta actual sin reasignar x/y ni devolverlo al rango inicial
        this.hasDrum = false;
        this.hp = 1;
        this.pulseTimer = 0;
        this.soundWaves = [];
        this.justStruckWave = false;
        this.hurtTimer = 0.35;
        this.hitFlashTimer = 0.35;
        this.hitCooldown = 0.35;
        this.knockbackVx = (knockDir >= 0 ? 1 : -1) * 90;
        this.knockbackTimer = 0.16;
        if (Number.isFinite(this.minX)) this.minX = Math.min(this.minX, this.x - 60);
        if (Number.isFinite(this.maxX)) this.maxX = Math.max(this.maxX, this.x + this.w + 60);
        if (clearDisable) {
          this.stunTimer = 0;
          this.hypnotizedTimer = 0;
        }
        if (particles) {
          particles.Burst(this.x + this.w * 0.5, this.y + this.h * 0.5, '#facc15', 14);
          particles.Burst(this.x + this.w * 0.5, this.y + this.h * 0.5, '#38bdf8', 10);
        }
        return 'drum_broken';
      }
      this.hp = 0;
      this.dead = true;
      return 'killed';
    }

    update(dt, leader, aiCtx = null) {
      this.justStruckWave = false;
      for (let i = this.soundWaves.length - 1; i >= 0; i--) {
        const wv = this.soundWaves[i];
        wv.r += 240 * dt;
        if (wv.r >= wv.maxR) this.soundWaves.splice(i, 1);
      }
      if (this.pulseTimer > 0) this.pulseTimer = Math.max(0, this.pulseTimer - dt);
      if (this.dead) return;
      let supportPlat = null;
      if (this.knockbackTimer > 0 && aiCtx) {
        const allPlats = (aiCtx.solids || []).concat(aiCtx.movingPlatforms || []);
        const feetY = this.y + this.h;
        const cx = this.x + this.w * 0.5;
        for (let i = 0; i < allPlats.length; i++) {
          const p = allPlats[i];
          if (p && cx >= p.x - 4 && cx <= p.x + p.w + 4 && Math.abs(feetY - p.y) <= 14) {
            supportPlat = p;
            break;
          }
        }
      }
      const knockingBack = tickHeavyHitFields(this, dt);
      if (knockingBack && supportPlat) {
        const minEdge = supportPlat.x + 2;
        const maxEdge = Math.max(minEdge, supportPlat.x + supportPlat.w - this.w - 2);
        if (this.x < minEdge) {
          this.x = minEdge;
          this.knockbackVx = 0;
        } else if (this.x > maxEdge) {
          this.x = maxEdge;
          this.knockbackVx = 0;
        }
      }
      if (tickEnemyStatus(this, dt) || knockingBack) return;

      updateTacticalGroundAI(this, dt, leader, aiCtx, {
        forcePatrol: true,
        minSpeed: this.hasDrum ? 48 : 62
      });
      if (leader) {
        this.facing = leader.x >= this.x ? 'right' : 'left';
      }
      if (this.hasDrum) {
        const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
        this.beatTimer -= dt;
        if (this.beatTimer <= 0) {
          this.beatTimer = (2.35 * cfg.cooldownMult) * (this.partnerBoost ? 0.86 : 1.0);
          if (leader && Math.abs((leader.x + leader.w * 0.5) - (this.x + this.w * 0.5)) < 460) {
            this.pulseTimer = 0.45;
            this.soundWaves.push({ r: 16, maxR: 210 });
            this.justStruckWave = true;
          }
        }
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -240 || sx > 1180) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawBarrabravaHD(ctx, this, this.animTimer);
      ctx.restore();
      drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
    }
  }

  class NewspaperProjectile {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.w = 18;
      this.h = 12;
      this.vx = vx;
      this.vy = vy;
      this.gravity = 760;
      this.dead = false;
      this.animTimer = 0;
    }

    update(dt, viewH = 540, cameraX = 0) {
      if (this.dead) return;
      this.animTimer += dt;
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y > viewH + 40 || this.x < cameraX - 120 || this.x > cameraX + 1080) {
        this.dead = true;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawNewspaperProjectileHD(ctx, this.x - cameraX, this.y, this.w, this.h, this.animTimer);
    }
  }

  class CanillitaEnemy {
    constructor(x, y, minX, maxX, speed = 42, aiOpts = null) {
      this.x = x;
      this.y = y - 42;
      this.w = 28;
      this.h = 42;
      this.minX = minX;
      this.maxX = maxX;
      this.baseSpeed = Math.abs(speed);
      this.facing = 'left';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
      // Cadencia reducida en Argentina (~65-80% menos disparos: 2.8s - 3.4s entre diarios)
      this.throwCooldown = 2.4 + Math.random() * 0.8;
      this.throwAnim = 0;
      this.pendingThrow = null;
      initTacticalGroundFields(this, aiOpts);
    }

    isDisabled() { return this.stunTimer > 0 || this.hypnotizedTimer > 0; }
    stun(sec = 2.5) { this.stunTimer = Math.max(this.stunTimer, sec); }
    hypnotize(sec = 2.5) { this.hypnotizedTimer = Math.max(this.hypnotizedTimer, sec); }

    update(dt, leader, aiCtx = null) {
      this.pendingThrow = null;
      if (this.throwAnim > 0) this.throwAnim = Math.max(0, this.throwAnim - dt);
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) return;

      updateTacticalGroundAI(this, dt, leader, aiCtx, { minSpeed: 38 });
      const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
      if (leader) {
        const leadDist = cfg.tier >= 3 ? (leader.vx || 0) * 0.28 : 0;
        const dx = (leader.x + leader.w * 0.5 + leadDist) - (this.x + this.w * 0.5);
        this.facing = dx >= 0 ? 'right' : 'left';
        this.throwCooldown -= dt;
        const throwRange = 430 + (cfg.tier - 1) * 32;
        if (this.throwCooldown <= 0 && Math.abs(dx) < throwRange) {
          this.throwCooldown = Math.max(2.8, Math.min(3.4, 3.4 * cfg.cooldownMult * (this.partnerBoost ? 0.92 : 1.0)));
          this.throwAnim = 0.28;
          const dir = dx >= 0 ? 1 : -1;
          const speedX = Math.max(145, Math.min(310, Math.abs(dx) * 0.85));
          this.pendingThrow = new NewspaperProjectile(this.x + this.w * 0.5, this.y + 10, dir * speedX, -365);
        }
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -120 || sx > 1080) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawCanillitaHD(ctx, this, this.animTimer);
      ctx.restore();
      drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
    }
  }

  class FatPigeonEnemy {
    constructor(x, y, minX, maxX, speed = 46) {
      this.x = x;
      this.y = y - 28;
      this.w = 36;
      this.h = 28;
      this.minX = minX;
      this.maxX = maxX;
      this.baseSpeed = Math.abs(speed);
      this.vx = this.baseSpeed;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() { return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying; }
    stun(sec = 2.5) { this.stunTimer = Math.max(this.stunTimer, sec); }
    hypnotize(sec = 2.5) { this.hypnotizedTimer = Math.max(this.hypnotizedTimer, sec); }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vx = (Math.random() - 0.5) * 180;
      this.facing = this.vx >= 0 ? 'right' : 'left';
      return true;
    }

    update(dt) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y -= 390 * dt;
        if (this.y < -80) this.dead = true;
        return;
      }
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;
      patrolBetweenBounds(this, dt);
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -100 || sx > 1060) return;
      if (!this.scaredFlying) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      sprites.drawFatPigeonHD(ctx, sx, this.y, this.facing, this.animTimer, this.isDisabled() && !this.scaredFlying, this.scaredFlying);
      if (!this.scaredFlying) {
        drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
      }
    }
  }

  class HorneroEnemy {
    constructor(spawnX, spawnY, targetX, targetY, speed = 355, options = {}) {
      this.w = 34;
      this.h = 26;
      this.x = spawnX - this.w * 0.5;
      this.y = spawnY - this.h * 0.5;
      this.aiTier = Math.max(1, Math.min(4, Number(options && options.aiTier) || 1));
      this.aiCity = (options && options.cityKey) || 'buenosaires';
      const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
      this.speed = Math.max(120, Number(speed) || 355) * (1 + (cfg.tier - 1) * 0.05) * (cfg.isRosario ? 1.08 : 1.0);
      this.isHoming = Boolean(options && options.homing);
      this.isSwarm = this.isHoming;
      this.nest = (options && options.nest) || null;
      this.state = this.isHoming
        ? 'attacking'
        : ((options && options.initialState) || (this.nest ? 'peeking' : 'attacking'));
      this.peekDuration = 1.0;
      this.stateTimer = this.state === 'peeking' ? this.peekDuration : 0;
      this.aggroRange =
        (options && Number.isFinite(Number(options.aggroRange)) ? Number(options.aggroRange) : 0) ||
        (this.nest ? this.nest.aggroRange : 360);

      const dx = (Number.isFinite(targetX) ? targetX : spawnX - 180) - spawnX;
      const dy = (Number.isFinite(targetY) ? targetY : spawnY + 120) - spawnY;
      const len = Math.hypot(dx, dy) || 1;
      if (this.state === 'attacking') {
        this.vx = (dx / len) * this.speed;
        this.vy = (dy / len) * this.speed;
        this.facing = this.vx >= 0 ? 'right' : 'left';
      } else {
        this.vx = 0;
        this.vy = 0;
        this.facing = dx >= 0 ? 'right' : 'left';
        if (this.nest) {
          const nestCx = this.nest.x + this.nest.w * 0.5;
          this.x = nestCx - this.w * 0.5;
          this.y = this.state === 'perched' ? this.nest.y - this.h + 4 : this.nest.y + this.nest.h * 0.35;
        }
      }
      this.dead = false;
      this.scaredFlying = false;
      this.scaredTimer = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.scaredFlying;
    }

    isPlayerInVerticalDeadZone(leader, nest = this.nest) {
      if (!leader || !nest) return false;
      const playerCenterX = leader.x + (leader.w || 0) * 0.5;
      const nestCenterX = nest.x + (nest.w || 42) * 0.5;
      return Math.abs(playerCenterX - nestCenterX) < (nest.w || 42) * 0.85 && leader.y > nest.y;
    }

    canDamagePlayer() {
      return this.state === 'attacking' && !this.scaredFlying && !this.dead && !this.isDisabled();
    }

    canReceiveStatus() {
      return (
        this.state !== 'peeking' &&
        this.state !== 'hidden' &&
        (this.scaredTimer || 0) <= 0 &&
        !this.scaredFlying &&
        !this.dead
      );
    }

    launchAttack(leader, aiCtx = null) {
      const tier = (aiCtx && aiCtx.aiTier) || this.aiTier || 1;
      const cx = this.x + this.w * 0.5;
      const cy = this.y + this.h * 0.5;
      const leadOffset = tier >= 2 && leader ? (leader.vx || 0) * (tier >= 4 ? 0.24 : 0.14) : 0;
      const tx = leader ? leader.x + leader.w * 0.5 + leadOffset : cx - 180;
      const ty = leader ? leader.y + leader.h * 0.45 : cy + 120;
      const dx = tx - cx;
      const dy = ty - cy;
      const len = Math.hypot(dx, dy) || 1;
      this.state = 'attacking';
      this.stateTimer = 0;
      this.vx = (dx / len) * this.speed;
      this.vy = (dy / len) * this.speed;
      this.facing = this.vx >= 0 ? 'right' : 'left';
    }

    stun(sec = 2.5) {
      if (this.isHoming || this.state === 'peeking' || this.state === 'hidden' || (this.scaredTimer || 0) > 0) return;
      this.stunTimer = Math.max(this.stunTimer, sec);
    }

    hypnotize(sec = 2.5) {
      if (this.isHoming || this.state === 'peeking' || this.state === 'hidden' || (this.scaredTimer || 0) > 0) return;
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, sec);
    }

    scareHideInNest(duration = 5.0) {
      if (this.dead || this.scaredFlying || !this.nest) return false;
      if (this.state !== 'peeking' && this.state !== 'perched' && this.state !== 'hidden') return false;
      const sec = Number.isFinite(Number(duration)) && Number(duration) > 0 ? Number(duration) : 5.0;
      this.state = 'hidden';
      this.scaredTimer = Math.max(this.scaredTimer || 0, sec);
      this.stateTimer = this.peekDuration;
      this.vx = 0;
      this.vy = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      const nestCx = this.nest.x + this.nest.w * 0.5;
      this.x = nestCx - this.w * 0.5;
      this.y = this.nest.y + this.nest.h * 0.35;
      if (this.nest) {
        this.nest.scaredTimer = Math.max(this.nest.scaredTimer || 0, this.scaredTimer);
      }
      return true;
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.state = 'attacking';
      this.scaredFlying = true;
      this.vx = (Math.random() - 0.5) * 180;
      this.vy = -560 - Math.random() * 140;
      return true;
    }

    update(dt, leader, cameraX = 0, aiCtx = null) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -110) this.dead = true;
        return;
      }
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) return;

      if (
        this.nest &&
        (this.nest.dead || this.nest.broken || this.nest.falling) &&
        (this.state === 'hidden' || this.state === 'peeking' || this.state === 'perched')
      ) {
        this.scareFlyUp();
        return;
      }

      // Estado escondido temporalmente dentro del nido (asustado por el ladrido de La Tina)
      if (this.state === 'hidden' || this.scaredTimer > 0) {
        if (this.nest) {
          const nestCx = this.nest.x + this.nest.w * 0.5;
          this.x = nestCx - this.w * 0.5;
          this.y = this.nest.y + this.nest.h * 0.35;
        }
        this.vx = 0;
        this.vy = 0;
        this.scaredTimer = Math.max(0, (this.scaredTimer || 0) - dt);
        if (this.scaredTimer <= 0) {
          this.state = 'peeking';
          this.stateTimer = this.peekDuration;
        }
        return;
      }

      // Estado 1: Asoma pico y ojitos dentro del nido durante ~1.0s como aviso visual
      if (this.state === 'peeking') {
        if (this.nest) {
          const nestCx = this.nest.x + this.nest.w * 0.5;
          this.x = nestCx - this.w * 0.5;
          this.y = this.nest.y + this.nest.h * 0.35;
          if (leader) {
            this.facing = (leader.x + leader.w * 0.5) >= nestCx ? 'right' : 'left';
          }
        }
        this.vx = 0;
        this.vy = 0;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'perched';
          this.stateTimer = 0;
          if (this.nest) {
            this.x = this.nest.x + this.nest.w * 0.5 - this.w * 0.5;
            this.y = this.nest.y - this.h + 4;
          }
        }
        return;
      }

      // Estado 2: Posado en guardia arriba del techo del nido esperando rango lateral/diagonal válido
      if (this.state === 'perched') {
        if (this.nest) {
          const nestCx = this.nest.x + this.nest.w * 0.5;
          const nestCy = this.nest.y + this.nest.h * 0.5;
          this.x = nestCx - this.w * 0.5;
          this.y = this.nest.y - this.h + 4;
          this.vx = 0;
          this.vy = 0;
          if (leader) {
            const pCx = leader.x + leader.w * 0.5;
            const pCy = leader.y + leader.h * 0.45;
            this.facing = pCx >= nestCx ? 'right' : 'left';
            const dist = Math.hypot(pCx - nestCx, pCy - nestCy);
            const inDeadZone = this.isPlayerInVerticalDeadZone(leader, this.nest);
            if (dist <= this.aggroRange && !inDeadZone) {
              this.launchAttack(leader, aiCtx);
            }
          }
        } else {
          this.launchAttack(leader, aiCtx);
        }
        if (this.state === 'perched') return;
      }

      const tier = (aiCtx && aiCtx.aiTier) || this.aiTier || 1;
      const cityKey = (aiCtx && aiCtx.cityKey) || this.aiCity || 'buenosaires';
      const cfg = getArgentinaAIConfig(tier, cityKey);

      if (leader && (this.isHoming || (tier >= 3 && this.y < leader.y + 10))) {
        const cx = this.x + this.w * 0.5;
        const cy = this.y + this.h * 0.5;
        const leadX = tier >= 4 ? (leader.vx || 0) * 0.16 : 0;
        const tx = leader.x + leader.w * 0.5 + leadX;
        const ty = leader.y + leader.h * 0.45;
        const dx = tx - cx;
        const dy = ty - cy;
        const dist = Math.hypot(dx, dy) || 1;
        // Aceleración en picada en Tier 4 / proximidad
        const diveMult = this.isHoming
          ? (dist < 240 ? 1.18 : 1.04) * (cfg.isRosario ? 1.06 : 1.0)
          : 1.0;
        const targetVx = (dx / dist) * this.speed * diveMult;
        const targetVy = (dy / dist) * this.speed * diveMult;
        if (this.isHoming) {
          this.vx = targetVx;
          this.vy = targetVy;
        } else {
          // Tier 3-4: ligera corrección en picada antes de cruzar al jugador
          const steer = Math.min(1, dt * (tier >= 4 ? 2.8 : 1.5) * cfg.cityAggro);
          this.vx += (targetVx - this.vx) * steer;
          this.vy += (targetVy - this.vy) * steer;
        }
        this.facing = this.vx >= 0 ? 'right' : 'left';
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (!this.isHoming) {
        if (
          this.x < cameraX - 200 ||
          this.x > cameraX + 1160 ||
          this.y < -150 ||
          this.y > 620
        ) {
          this.dead = true;
        }
      } else if (leader && this.x < leader.x - 660) {
        this.dead = true;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -120 || sx > 1080) return;
      sprites.drawHorneroHD(ctx, this, cameraX, this.animTimer);
      if (!this.scaredFlying && this.state !== 'peeking' && this.state !== 'hidden' && (this.scaredTimer || 0) <= 0) {
        drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
      }
    }
  }

  class HorneroNest {
    constructor(x, y, aggroRange = 360, cooldown = 3.2, diveSpeed = 355, aiOpts = null) {
      this.x = x;
      this.y = y;
      this.anchorY = y;
      this.poleBaseY = Number.isFinite(aiOpts && aiOpts.baseY) ? aiOpts.baseY : 460;
      this.w = 42;
      this.h = 34;
      this.aiTier = Math.max(1, Math.min(4, Number(aiOpts && aiOpts.aiTier) || 1));
      this.aiCity = (aiOpts && aiOpts.cityKey) || 'buenosaires';
      const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
      this.aggroRange = Math.max(120, Number(aggroRange) || 360) * (1 + (cfg.tier - 1) * 0.07) * (cfg.isRosario ? 1.12 : 1.0);
      // Cadencia ligeramente más espaciada (~22% menos frecuente) manteniendo intacta la velocidad de vuelo
      this.cooldown = Math.max(1.35, (Number(cooldown) || 3.2) * cfg.cooldownMult * 1.28);
      this.diveSpeed = Math.max(180, Number(diveSpeed) || 355) * (1 + (cfg.tier - 1) * 0.05) * (cfg.isRosario ? 1.08 : 1.0);
      this.cooldownTimer = 0;
      this.scaredTimer = 0;
      this.animTimer = Math.random() * 4;
      this.activeHornero = null;
      this.pendingSpawn = null;
      initHeavyHitFields(this, 2);
      this.cracked = false;
      this.broken = false;
      this.dead = false;
      this.falling = false;
      this.fallVy = 0;
      this.rotation = 0;
    }

    scareHideInNest(duration = 5.0) {
      if (this.dead || this.broken || this.falling) return false;
      const sec = Number.isFinite(Number(duration)) && Number(duration) > 0 ? Number(duration) : 5.0;
      this.scaredTimer = Math.max(this.scaredTimer || 0, sec);
      if (
        this.activeHornero &&
        !this.activeHornero.dead &&
        (this.activeHornero.state === 'peeking' ||
          this.activeHornero.state === 'perched' ||
          this.activeHornero.state === 'hidden')
      ) {
        this.activeHornero.scareHideInNest(sec);
        return true;
      }
      this.cooldownTimer = Math.max(this.cooldownTimer || 0, sec);
      return true;
    }

    takeHit(particles = null, ignoreCooldown = false) {
      if (this.dead || this.broken) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      this.hitCooldown = 0.28;
      this.hitFlashTimer = 0.34;
      const cx = this.x + this.w * 0.5;
      const cy = this.y + this.h * 0.5;
      if (this.hp > 1) {
        this.hp = 1;
        this.cracked = true;
        if (particles) {
          particles.Burst(cx, cy, '#92400e', 10);
          particles.Burst(cx, cy, '#fde68a', 6);
        }
        return 'cracked';
      }
      this.hp = 0;
      this.cracked = true;
      this.broken = true;
      this.dead = true;
      this.falling = true;
      this.fallVy = -115;
      if (
        this.activeHornero &&
        (this.activeHornero.state === 'hidden' ||
          this.activeHornero.state === 'peeking' ||
          this.activeHornero.state === 'perched')
      ) {
        this.activeHornero.scareFlyUp();
      }
      this.activeHornero = null;
      this.pendingSpawn = null;
      if (particles) {
        particles.Burst(cx, cy, '#78350f', 16);
        particles.Burst(cx, cy, '#fcd34d', 10);
      }
      return 'destroyed';
    }

    update(dt, leader, cameraX = 0, aiCtx = null) {
      if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
      if (this.hitCooldown > 0) this.hitCooldown = Math.max(0, this.hitCooldown - dt);
      if (this.scaredTimer > 0) this.scaredTimer = Math.max(0, this.scaredTimer - dt);
      if (this.falling) {
        this.animTimer += dt;
        this.pendingSpawn = null;
        this.fallVy += GRAVITY * dt;
        this.y += this.fallVy * dt;
        this.rotation += dt * 4.5;
        if (this.y > 640) {
          this.falling = false;
        }
        return;
      }
      if (this.dead || this.broken) {
        this.pendingSpawn = null;
        return;
      }

      this.animTimer += dt;
      this.pendingSpawn = null;

      const prev = this.activeHornero;
      let keepActive = false;
      if (prev && !prev.dead && !prev.scaredFlying) {
        if (prev.state === 'hidden' || prev.state === 'peeking' || prev.state === 'perched') {
          keepActive = this.x + this.w >= cameraX - 240 && this.x <= cameraX + 1200;
          if (!keepActive) {
            prev.dead = true;
          }
        } else {
          const prevInViewport = prev.x <= cameraX + 1020 && prev.x + prev.w >= cameraX - 80;
          keepActive = prevInViewport && (
            !leader ||
            (prev.vx < 0 ? prev.x + prev.w >= leader.x - 40 : prev.x <= leader.x + leader.w + 40)
          );
        }
      }
      if (!keepActive) {
        if (this.activeHornero) {
          this.cooldownTimer = this.cooldown;
        }
        this.activeHornero = null;
      }
      if (!this.activeHornero && this.cooldownTimer > 0) {
        this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
      }

      if (!leader) return;
      const sx = this.x - cameraX;
      if (sx < -80 || sx > 1040) return;

      const tier = (aiCtx && aiCtx.aiTier) || this.aiTier || 1;
      const cityKey = (aiCtx && aiCtx.cityKey) || this.aiCity || 'buenosaires';
      const nestCx = this.x + this.w * 0.5;
      const nestCy = this.y + this.h * 0.5;
      const leadOffset = tier >= 2 ? (leader.vx || 0) * (tier >= 4 ? 0.24 : 0.14) : 0;
      const targetX = leader.x + leader.w * 0.5 + leadOffset;
      const targetY = leader.y + leader.h * 0.45;

      if (this.cooldownTimer <= 0 && this.scaredTimer <= 0 && !this.activeHornero) {
        this.cooldownTimer = this.cooldown;
        this.pendingSpawn = new HorneroEnemy(nestCx, nestCy, targetX, targetY, this.diveSpeed, {
          homing: false,
          aiTier: tier,
          cityKey,
          nest: this,
          initialState: 'peeking',
          aggroRange: this.aggroRange
        });
        this.activeHornero = this.pendingSpawn;
      }
    }

    draw(ctx, sprites, cameraX) {
      sprites.drawHorneroNestHD(ctx, this, cameraX, this.animTimer);
    }
  }

  // ==========================================================================
  // ROSARIO, ARGENTINA — Fauna local, bombos de la hinchada y Enjambre de Mosquitos
  // ==========================================================================
  class BeerBottleProjectile extends NewspaperProjectile {
    constructor(x, y, vx, vy) {
      super(x, y, vx, vy);
      this.w = 12;
      this.h = 24;
      this.gravity = 820;
      this.spin = (vx >= 0 ? 1 : -1) * 9;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawBeerBottleHD(ctx, this.x - cameraX, this.y, this.w, this.h, this.animTimer * this.spin);
    }
  }

  // El Rockero Borracho reemplaza al Canillita: arroja porrones en trayectoria parabólica
  class RockeroEnemy extends CanillitaEnemy {
    constructor(x, y, minX, maxX, speed = 34, aiOpts = null) {
      super(x, y, minX, maxX, speed, aiOpts);
      this.w = 30;
      this.h = 44;
      this.baseH = 44;
      this.y = y - this.h;
      this.throwCooldown = 1.45 + Math.random() * 0.9;
      this.throwWindup = 0;
      this.throwWindupDuration = 0.32;
      this.swayPhase = Math.random() * 6;
      this.onPole = Boolean(aiOpts && aiOpts.onPole);
      this.wasOnPole = this.onPole;
      this.poleX = aiOpts && Number.isFinite(aiOpts.poleX) ? aiOpts.poleX : this.x + this.w + 2;
      this.poleBaseY = aiOpts && Number.isFinite(aiOpts.poleBaseY) ? aiOpts.poleBaseY : 460;
      this.poleTopY = aiOpts && Number.isFinite(aiOpts.poleTopY) ? aiOpts.poleTopY : 214;
      this.fallingFromPole = false;
      this.defeated = false;
      this.fallRotation = 0;
      this.fallSpinSpeed = 0;
      if (this.onPole) {
        this.x = this.poleX - this.w - 2;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
      }
    }

    isDisabled() {
      return this.defeated || this.fallingFromPole || super.isDisabled();
    }

    knockOffPole(impulseX = null) {
      if (this.dead || this.fallingFromPole) return false;
      this.onPole = false;
      this.fallingFromPole = true;
      this.defeated = true;
      this.pendingThrow = null;
      this.throwAnim = 0;
      this.throwWindup = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      const dir =
        Number.isFinite(impulseX) && impulseX !== 0
          ? impulseX > 0
            ? 1
            : -1
          : this.facing === 'right'
            ? -1
            : 1;
      this.vx = dir * 92;
      this.vy = -175;
      this.fallRotation = 0;
      this.fallSpinSpeed = dir * 7.8;
      return true;
    }

    update(dt, leader, aiCtx = null) {
      this.pendingThrow = null;
      if (this.throwAnim > 0) this.throwAnim = Math.max(0, this.throwAnim - dt);
      if (this.dead) return;
      if (this.fallingFromPole) {
        this.animTimer += dt;
        this.vy = Math.min(MAX_FALL_SPEED, (this.vy || 0) + GRAVITY * dt);
        this.x += (this.vx || 0) * dt;
        this.y += this.vy * dt;
        this.fallRotation += (this.fallSpinSpeed || 7.2) * dt;
        if (this.y > 600) {
          this.dead = true;
        }
        return;
      }
      if (tickEnemyStatus(this, dt)) {
        this.throwWindup = 0;
        return;
      }
      this.swayPhase += dt;

      if (!this.onPole) {
        updateTacticalGroundAI(this, dt, leader, aiCtx, { minSpeed: 36 });
      } else {
        this.vx = 0;
        this.vy = 0;
      }
      const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
      if (leader && !this.isDisabled()) {
        const predictOffset = cfg.tier >= 3 ? (leader.vx || 0) * 0.34 : 0;
        const dx = (leader.x + leader.w * 0.5 + predictOffset) - (this.x + this.w * 0.5);
        this.facing = dx >= 0 ? 'right' : 'left';
        const throwRange = (this.onPole ? 510 : 470) + (cfg.tier - 1) * 35;
        if (this.throwWindup > 0) {
          this.throwWindup = Math.max(0, this.throwWindup - dt);
          if (this.throwWindup <= 0) {
            // +40% de pausa entre lanzamientos (~2.2–2.6s) tras completar la preparación
            this.throwCooldown = Math.max(
              2.2,
              Math.min(
                2.6,
                (2.32 + Math.random() * 0.28) *
                  (0.86 + cfg.cooldownMult * 0.16) *
                  (this.partnerBoost ? 0.94 : 1.0)
              )
            );
            this.throwAnim = 0.34;
            const dir = dx >= 0 ? 1 : -1;
            const dist = Math.abs(dx);
            if (this.onPole) {
              // Desde lo alto de la farola costanera, arroja el porrón hacia adelante y abajo
              const throwY = this.y + 18;
              const speedX = Math.max(105, Math.min(285, dist * 0.92 + (Math.random() - 0.5) * 32));
              const speedY = leader.y > this.y + 20 ? -185 : -330;
              this.pendingThrow = new BeerBottleProjectile(
                this.x + (dir > 0 ? this.w - 4 : 4),
                throwY,
                dir * speedX,
                speedY
              );
            } else {
              // Balística aproximada con menor dispersión en Tier 3-4
              const flightTime = 0.55 + Math.min(0.45, dist / 900);
              const wobble = (Math.random() - 0.5) * (cfg.tier >= 3 ? 34 : 68);
              const speedX = Math.max(125, Math.min(330, dist / flightTime + wobble));
              this.pendingThrow = new BeerBottleProjectile(
                this.x + this.w * 0.5,
                this.y + 12,
                dir * speedX,
                cfg.tier >= 3 ? -415 : -400
              );
            }
          }
        } else {
          this.throwCooldown -= dt;
          if (this.throwCooldown <= 0 && Math.abs(dx) < throwRange) {
            this.throwWindup = this.throwWindupDuration;
          }
        }
      } else {
        this.throwWindup = 0;
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -120 || sx > 1080) return;
      if (!this.onPole && !this.fallingFromPole) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawRockeroHD(ctx, this, this.animTimer);
      ctx.restore();
      if (!this.fallingFromPole) {
        drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
      }
    }
  }

  // Ráfaga horizontal de aire helado: NO quita vida, ralentiza movimiento y salto durante 2 s
  // Alcance reducido al 50 % (life: 1.7 s -> ~399.5 px a 1.0x, ~455.4 px a 1.14x en Rosario)
  class ColdBlastProjectile {
    constructor(x, y, dir = -1, speedScale = 1.0, owner = null) {
      this.w = 44;
      this.h = 26;
      this.x = dir >= 0 ? x : x - this.w;
      this.startX = this.x;
      this.y = y;
      this.dir = dir >= 0 ? 1 : -1;
      this.vx = this.dir * 235 * (Number(speedScale) || 1.0);
      this.life = 1.7;
      this.maxRange = Math.abs(this.vx) * this.life;
      this.dead = false;
      this.animTimer = 0;
      this.slowSeconds = 2.0;
      this.owner = owner;
    }

    update(dt, cameraX = 0) {
      if (this.dead) return;
      this.animTimer += dt;
      this.life -= dt;
      this.x += this.vx * dt;
      if (
        this.life <= 0 ||
        Math.abs(this.x - this.startX) >= this.maxRange ||
        this.x < cameraX - 160 ||
        this.x > cameraX + 1120
      ) {
        this.dead = true;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawColdBlastHD(ctx, this.x - cameraX, this.y, this.w, this.h, this.dir, this.animTimer);
    }
  }

  // El Pingüino Pecho Frío (estático en Rosario, patrullero en témpanos/muelles de Ushuaia): dispara ráfagas heladas
  class PenguinEnemy {
    constructor(x, y, aiOpts = null) {
      this.w = 32;
      this.h = 44;
      this.x = x;
      this.y = y - this.h;
      this.facing = 'left';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.fireCooldown = 1.0 + Math.random() * 0.9;
      this.blowAnim = 0;
      this.pendingBlast = null;
      this.minX = aiOpts && Number.isFinite(aiOpts.minX) ? aiOpts.minX : null;
      this.maxX = aiOpts && Number.isFinite(aiOpts.maxX) ? aiOpts.maxX : null;
      this.baseSpeed = aiOpts && Number.isFinite(aiOpts.speed) ? Math.abs(aiOpts.speed) : 48;
      this.vx = -this.baseSpeed;
      this.aiTier = Math.max(1, Math.min(4, Number(aiOpts && aiOpts.aiTier) || 3));
      this.aiCity = (aiOpts && aiOpts.cityKey) || 'rosario';
    }

    isDisabled() { return this.stunTimer > 0 || this.hypnotizedTimer > 0; }
    stun(sec = 2.5) { this.stunTimer = Math.max(this.stunTimer, sec); }
    hypnotize(sec = 2.5) { this.hypnotizedTimer = Math.max(this.hypnotizedTimer, sec); }
    applySlow(sec = 2.0) { this.slowTimer = Math.max(this.slowTimer || 0, sec); }

    update(dt, leader, aiCtx = null) {
      this.pendingBlast = null;
      if (this.blowAnim > 0) this.blowAnim = Math.max(0, this.blowAnim - dt);
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) return;
      if (!leader) return;

      const tier = (aiCtx && aiCtx.aiTier) || this.aiTier || 3;
      const cityKey = (aiCtx && aiCtx.cityKey) || this.aiCity || 'rosario';
      const cfg = getArgentinaAIConfig(tier, cityKey);

      const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
      const dy = (leader.y + leader.h * 0.5) - (this.y + this.h * 0.5);
      if (this.minX !== null && this.maxX !== null && this.maxX > this.minX + this.w && this.blowAnim <= 0) {
        patrolBetweenBounds(this, dt);
      }
      if (this.blowAnim > 0 || (Math.abs(dx) < 360 && Math.abs(dy) < 160)) {
        this.facing = dx >= 0 ? 'right' : 'left';
      }
      this.fireCooldown -= dt * (this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0);
      const range = 520 + (cfg.tier - 1) * 35;
      if (this.fireCooldown <= 0 && Math.abs(dx) < range && Math.abs(dy) < 175) {
        this.fireCooldown = Math.max(1.85, 2.75 * cfg.cooldownMult);
        this.blowAnim = 0.5;
        this.facing = dx >= 0 ? 'right' : 'left';
        const dir = dx >= 0 ? 1 : -1;
        const originX = dir > 0 ? this.x + this.w : this.x;
        this.pendingBlast = new ColdBlastProjectile(originX, this.y + 14, dir, cfg.isRosario ? 1.14 : 1.0, this);
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -120 || sx > 1080) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawPenguinHD(ctx, this, this.animTimer);
      ctx.restore();
      drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  function eliminateJumpingFish(fish, delay = 5.0, submergedY = 550) {
    fish.respawnDelay = Number.isFinite(delay) && delay > 0 ? delay : 5.0;
    fish.respawnTimer = fish.respawnDelay;
    fish.dead = true;
    fish.stunTimer = 0;
    fish.hypnotizedTimer = 0;
    fish.y = submergedY;
  }

  function tickJumpingFishCooldownAndStatus(fish, dt, submergedY) {
    if (fish.dead || fish.respawnTimer > 0) {
      fish.respawnTimer = Math.max(0, fish.respawnTimer - dt);
      fish.y = submergedY;
      if (fish.respawnTimer <= 0) {
        fish.dead = false;
        fish.stunTimer = 0;
        fish.hypnotizedTimer = 0;
        return 'respawned';
      }
      return 'waiting_respawn';
    }
    if (fish.stunTimer > 0 || fish.hypnotizedTimer > 0) {
      if (fish.stunTimer > 0) fish.stunTimer = Math.max(0, fish.stunTimer - dt);
      if (fish.hypnotizedTimer > 0) fish.hypnotizedTimer = Math.max(0, fish.hypnotizedTimer - dt);
      return fish.stunTimer === 0 && fish.hypnotizedTimer === 0 ? 'status_ended' : 'disabled';
    }
    return 'active';
  }

  // La Palometa del Paraná (Zona 2+): salta verticalmente desde el agua con reacción táctica en Rosario
  class PalometaEnemy {
    constructor(x, waterY = 482, peakY = 330, waitTime = 1.2, phase = 0, aiOpts = null) {
      this.w = 30;
      this.h = 18;
      this.centerX = x;
      this.x = x - this.w * 0.5;
      this.waterY = waterY;
      this.peakY = Number.isFinite(peakY) ? peakY : 330;
      this.aiTier = Math.max(1, Math.min(4, Number(aiOpts && aiOpts.aiTier) || 2));
      this.aiCity = (aiOpts && aiOpts.cityKey) || 'rosario';
      this.gravity = 1250;
      this.jumpVy = -Math.sqrt(2 * this.gravity * Math.max(40, this.waterY - this.peakY));
      const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
      this.waitTime = Math.max(0.55, (Number.isFinite(waitTime) ? waitTime : 1.2) * cfg.cooldownMult);
      this.timer = this.waitTime + (Number.isFinite(phase) ? phase : 0);
      this.state = 'wait'; // 'wait' | 'jump'
      this.y = waterY + 90;
      this.vy = 0;
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.respawnDelay = 5.0;
      this.respawnTimer = 0;
      this.animTimer = Math.random() * 4;
      this.splashEvent = null; // 'out' | 'in'
    }

    isDisabled() {
      return !this.dead && this.respawnTimer <= 0 && (this.stunTimer > 0 || this.hypnotizedTimer > 0);
    }

    isAirborne() {
      return !this.dead && this.respawnTimer <= 0 && this.state === 'jump' && this.y < this.waterY - 2;
    }

    canReceiveStatus() {
      return this.isAirborne();
    }

    stun(duration = 3.0) {
      if (!this.canReceiveStatus()) return false;
      this.stunTimer = Math.max(this.stunTimer, duration);
      return true;
    }

    hypnotize(duration = 3.0) {
      if (!this.canReceiveStatus()) return false;
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, duration);
      return true;
    }

    eliminate(delay = 5.0) {
      eliminateJumpingFish(this, delay, this.waterY + 90);
      this.state = 'wait';
      this.vy = 0;
      this.timer = this.waitTime;
    }

    update(dt, leader = null, aiCtx = null) {
      this.splashEvent = null;
      this.animTimer += dt;
      const phase = tickJumpingFishCooldownAndStatus(this, dt, this.waterY + 90);
      if (phase === 'waiting_respawn') {
        this.state = 'wait';
        this.vy = 0;
        return;
      }
      if (phase === 'respawned') {
        this.state = 'jump';
        this.vy = this.jumpVy;
        this.y = this.waterY - 4;
        this.splashEvent = 'out';
        return;
      }
      if (phase === 'disabled') {
        return;
      }
      if (phase === 'status_ended') {
        this.vy = Math.max(0, this.vy);
      }
      const tier = (aiCtx && aiCtx.aiTier) || this.aiTier || 2;
      if (this.state === 'wait') {
        this.timer -= dt;
        // Tier 2+ Rosario: acelera emboscada si el jugador salta sobre el canal cerca
        if (tier >= 2 && leader && !leader.onGround && Math.abs((leader.x + leader.w * 0.5) - this.centerX) < 135) {
          this.timer = Math.min(this.timer, 0.24);
        }
        this.y = this.waterY + 90;
        if (this.timer <= 0) {
          this.state = 'jump';
          this.vy = this.jumpVy;
          this.y = this.waterY;
          this.splashEvent = 'out';
        }
      } else {
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;
        if (this.vy > 0 && this.y >= this.waterY) {
          this.state = 'wait';
          this.timer = this.waitTime;
          this.y = this.waterY + 90;
          this.splashEvent = 'in';
        }
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead || this.respawnTimer > 0) return;
      const sx = this.x - cameraX;
      if (sx < -80 || sx > 1040) return;
      if (this.state !== 'jump') return;
      const tilt = this.isDisabled() ? 0 : Math.max(-1.1, Math.min(1.1, this.vy / 640));
      sprites.drawPalometaHD(ctx, sx, this.y, this.w, this.h, tilt, this.animTimer);
      drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, 0, this.h);
    }
  }

  // Bombo gigante de la hinchada (Zona 4): rebote alto al caer sobre su parche
  class BouncyDrum {
    constructor(x, y, w = 72, h = 46, bounceVy = -740) {
      this.w = Number(w) || 72;
      this.h = Number(h) || 46;
      this.x = x;
      this.y = y - this.h;
      this.bounceVy = Number(bounceVy) || -740;
      this.squash = 0;
      this.cooldown = 0;
      this.animTimer = Math.random() * 3;
    }

    triggerBounce() {
      this.squash = 1;
      this.cooldown = 0.18;
    }

    update(dt) {
      this.animTimer += dt;
      if (this.squash > 0) this.squash = Math.max(0, this.squash - dt * 4.2);
      if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    }

    tryBounce(player, dt) {
      if (!player || this.cooldown > 0 || player.vy <= 0 || player.dead) return false;
      const feet = player.y + player.h;
      const prevFeet = feet - player.vy * dt;
      const overlapX = player.x + player.w - 6 > this.x && player.x + 6 < this.x + this.w;
      if (overlapX && prevFeet <= this.y + 14 && feet >= this.y - 2 && feet <= this.y + 28) {
        player.y = this.y - player.h;
        player.vy = this.bounceVy;
        player.onGround = false;
        player.standingPlatform = null;
        player.jumpsUsed = Math.min(player.jumpsUsed || 0, 1);
        this.triggerBounce();
        return true;
      }
      return false;
    }

    draw(ctx, sprites, cameraX) {
      sprites.drawBouncyDrumHD(ctx, this, cameraX, this.animTimer);
    }
  }

  // Mosquito del Enjambre de Arroyito: enemigo 'homing' masivo que busca ineludiblemente al jugador
  class SwarmMosquito {
    constructor(x, y, speed = 185, aiOpts = null) {
      this.w = 14;
      this.h = 12;
      this.x = x;
      this.y = y;
      this.aiTier = Math.max(1, Math.min(4, Number(aiOpts && aiOpts.aiTier) || 4));
      this.aiCity = (aiOpts && aiOpts.cityKey) || 'rosario';
      const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
      this.speed = speed * (cfg.isRosario ? 1.12 : 1.0);
      this.vx = -this.speed;
      this.vy = 0;
      this.phase = Math.random() * 10;
      this.timer = Math.random() * 10;
      this.dead = false;
      this.scaredFlying = false;
      this.scatterTimer = 0;
      this.isSwarm = true;
      this.isHoming = true;
    }

    isDisabled() { return this.scaredFlying; }
    stun() {}
    hypnotize() {}

    // El Ladrido de La Tina dispersa la nube: cada mosquito sale despedido hacia afuera y arriba
    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.scatterTimer = 1.4;
      const ang = Math.random() * Math.PI * 2;
      const force = 280 + Math.random() * 260;
      this.vx = Math.cos(ang) * force;
      this.vy = Math.sin(ang) * force - 220;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.timer += dt;
      if (this.scaredFlying) {
        this.scatterTimer -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.scatterTimer <= 0 || this.y < -140) this.dead = true;
        return;
      }
      if (!leader) return;

      const leadOffsetX = this.aiTier >= 4 ? (leader.vx || 0) * 0.14 : 0;
      const tx = leader.x + leader.w * 0.5 + leadOffsetX;
      const ty = leader.y + leader.h * 0.45;
      const dx = tx - (this.x + this.w * 0.5);
      const dy = ty - (this.y + this.h * 0.5);
      const dist = Math.hypot(dx, dy) || 1;
      const diveMult = dist < 240 && this.aiTier >= 4 ? 1.16 : 1.0;
      const jitterX = Math.sin(this.timer * 11 + this.phase) * 85;
      const jitterY = Math.cos(this.timer * 9 + this.phase * 1.7) * 85;
      const desiredVx = (dx / dist) * this.speed * diveMult + jitterX;
      const desiredVy = (dy / dist) * this.speed * diveMult + jitterY;
      const k = Math.min(1, dt * (this.aiTier >= 4 ? 4.8 : 3.4));
      this.vx += (desiredVx - this.vx) * k;
      this.vy += (desiredVy - this.vy) * k;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.x < leader.x - 720) this.dead = true;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawMosquitoHD(ctx, this, cameraX, this.timer);
    }
  }

  // ==========================================================================
  // CÓRDOBA, ARGENTINA: EL PIRATA DE BELGRANO, FERNET, BURRITO Y MINI-OVNI
  // ==========================================================================
  class FernetBottleProjectile {
    constructor(x, y, vx, vy) {
      this.w = 18;
      this.h = 24;
      this.x = x - this.w * 0.5;
      this.y = y - this.h * 0.5;
      this.vx = vx;
      this.vy = vy;
      this.angle = 0;
      this.dead = false;
      this.spawnPuddle = null;
    }

    triggerBounce() {
      this.vy = -240;
    }

    update(dt, viewH = 540, cameraX = 0, aiCtx = null) {
      if (this.dead) return;
      const prevBottom = this.y + this.h;
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * 0.72 * dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.angle += (this.vx >= 0 ? 1 : -1) * dt * 8.5;

      if (aiCtx && this.vy > 0) {
        const candidates = [];
        if (Array.isArray(aiCtx.solids)) {
          for (let i = 0; i < aiCtx.solids.length; i++) {
            const s = aiCtx.solids[i];
            candidates.push({ surface: s, isDynamic: Boolean(s && s.isMoving) });
          }
        }
        if (Array.isArray(aiCtx.movingPlatforms)) {
          for (let i = 0; i < aiCtx.movingPlatforms.length; i++) {
            candidates.push({ surface: aiCtx.movingPlatforms[i], isDynamic: true });
          }
        }
        if (Array.isArray(aiCtx.fallingPlatforms)) {
          for (let i = 0; i < aiCtx.fallingPlatforms.length; i++) {
            candidates.push({ surface: aiCtx.fallingPlatforms[i], isDynamic: true });
          }
        }
        if (Array.isArray(aiCtx.sinkingContainers)) {
          for (let i = 0; i < aiCtx.sinkingContainers.length; i++) {
            candidates.push({ surface: aiCtx.sinkingContainers[i], isDynamic: true });
          }
        }
        for (let i = 0; i < candidates.length; i++) {
          const s = candidates[i].surface;
          if (!s || s.broken || s.fallen || s.dead || s.state === 'falling' || s.state === 'respawning' || s.y < -900) {
            continue;
          }
          const dyTol = 26 + (Number.isFinite(s.dy) ? Math.abs(s.dy) : 0);
          if (
            this.x + this.w > s.x + 4 &&
            this.x < s.x + s.w - 4 &&
            this.y + this.h >= s.y &&
            prevBottom <= s.y + dyTol
          ) {
            this.dead = true;
            const halfW = Math.min(28, Math.max(8, s.w * 0.45));
            this.spawnPuddle = {
              x: Math.max(s.x + halfW, Math.min(s.x + s.w - halfW, this.x + this.w * 0.5)),
              y: s.y,
              platform: candidates[i].isDynamic ? s : null
            };
            return;
          }
        }
      }

      if (this.y > viewH + 60 || Math.abs(this.x - cameraX) > 1500) {
        this.dead = true;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -60 || sx > 1020) return;
      sprites.drawFernetBottleHD(ctx, sx, this.y, this.w, this.h, this.angle);
    }
  }

  class FernetPuddleHazard {
    constructor(centerX, y, w = 56, life = 4.2, attachedPlatform = null) {
      this.w = w;
      this.h = 10;
      this.x = centerX - w * 0.5;
      this.y = y;
      this.life = life;
      this.maxLife = life;
      this.dead = false;
      this.attachedPlatform = attachedPlatform || null;
      this.offsetX = this.attachedPlatform ? this.x - this.attachedPlatform.x : 0;
      this.offsetY = this.attachedPlatform ? this.y - this.attachedPlatform.y : 0;
    }

    hitbox() {
      return {
        x: this.x + 5,
        y: this.y - 8,
        w: Math.max(12, this.w - 10),
        h: 9
      };
    }

    update(dt) {
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        return;
      }
      if (this.attachedPlatform) {
        const p = this.attachedPlatform;
        if (
          p.broken ||
          p.fallen ||
          p.dead ||
          p.state === 'falling' ||
          p.state === 'respawning' ||
          p.y < -900 ||
          p.y > 520
        ) {
          this.dead = true;
          return;
        }
        this.x = p.x + this.offsetX;
        this.y = p.y + this.offsetY;
      }
    }

    draw(ctx, sprites, cameraX, time) {
      if (this.dead) return;
      sprites.drawFernetPuddleHD(ctx, this, cameraX, time);
    }
  }

  function hasGroundSupportAt(platforms, probeX, probeY, feetY) {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!p || p.state === 'falling' || p.state === 'respawning' || p.broken || p.fallen) continue;
      if (
        probeX >= p.x &&
        probeX <= p.x + p.w &&
        Math.abs(p.y - feetY) <= 12 &&
        probeY >= p.y &&
        probeY <= p.y + Math.max(20, p.h)
      ) {
        return true;
      }
    }
    return false;
  }

  function moveBelgranoFreePatrol(e, dt, moveSpeed, aiCtx, flipOnObstacle = true) {
    const dir = e.facing === 'right' ? 1 : -1;
    const spdScale = e.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
    const stepVx = dir * Math.abs(moveSpeed) * spdScale;
    const nextX = e.x + stepVx * dt;
    const feetY = e.y + e.h;
    const levelWidth = aiCtx && Number.isFinite(aiCtx.levelWidth) ? aiCtx.levelWidth : 8500;
    const platforms = getActiveAIPlatforms(aiCtx);

    // 1. Bordes laterales del nivel (0 y level.width)
    if (nextX <= 0) {
      e.x = 0;
      if (flipOnObstacle) e.facing = 'right';
      e.vx = flipOnObstacle ? Math.abs(moveSpeed) * spdScale : 0;
      return false;
    }
    if (nextX + e.w >= levelWidth) {
      e.x = levelWidth - e.w;
      if (flipOnObstacle) e.facing = 'left';
      e.vx = flipOnObstacle ? -Math.abs(moveSpeed) * spdScale : 0;
      return false;
    }

    // 2. Choque frontal contra muros o bloques sólidos no atravesables
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!p || p.oneWay) continue;
      if (p.y < feetY - 10 && p.y + p.h > e.y + 4) {
        if (dir > 0 && e.x + e.w <= p.x + 8 && nextX + e.w >= p.x) {
          e.x = p.x - e.w;
          if (flipOnObstacle) e.facing = 'left';
          e.vx = flipOnObstacle ? -Math.abs(moveSpeed) * spdScale : 0;
          return false;
        }
        if (dir < 0 && e.x >= p.x + p.w - 8 && nextX <= p.x + p.w) {
          e.x = p.x + p.w;
          if (flipOnObstacle) e.facing = 'right';
          e.vx = flipOnObstacle ? Math.abs(moveSpeed) * spdScale : 0;
          return false;
        }
      }
    }

    // 3. Borde de suelo/plataforma adelante: punto frontal (x + w/2 + dir * (w/2 + 6), y + h + 4)
    if (platforms.length > 0) {
      const probeX = nextX + e.w * 0.5 + dir * (e.w * 0.5 + 6);
      const probeY = feetY + 4;
      if (!hasGroundSupportAt(platforms, probeX, probeY, feetY)) {
        if (flipOnObstacle) e.facing = dir > 0 ? 'left' : 'right';
        e.vx = flipOnObstacle ? -dir * Math.abs(moveSpeed) * spdScale : 0;
        return false;
      }
    }

    e.x = nextX;
    e.vx = stepVx;
    return true;
  }

  class BelgranoPirateEnemy {
    constructor(x, y, _minX = null, _maxX = null, speed = 78, aiOpts = {}) {
      this.w = 42;
      this.h = 58;
      this.x = x;
      this.y = y - this.h;
      this.freeRoam = true;
      this.aiTier = (aiOpts && aiOpts.aiTier) || 1;
      this.aiCity = (aiOpts && aiOpts.cityKey) || 'cordoba';
      const cfg = getArgentinaAIConfig(this.aiTier, this.aiCity);
      this.baseSpeed = Math.abs(speed) * cfg.speedMult * 1.04;
      this.vx = -this.baseSpeed;
      this.facing = 'left';
      this.dead = false;

      // Fase 1: armado con botella cortada de Fernet (hp = 2); Fase 2: Modo Furia sin Fernet (hp = 1, +0.25 velocidad)
      this.hasFernetBottle = true;
      this.enraged = false;
      initHeavyHitFields(this, 2);
      this.throwCooldown = 1.05 + Math.random() * 0.85;
      this.throwAnim = 0;
      this.pendingThrow = null;
      this.disarmTimer = 0;
      this.droppedBottle = null;

      this.punchCooldown = 0;
      this.punchTimer = 0;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 6;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 2.4) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    scareByTinaBark() {
      return false;
    }

    triggerBounce() {}

    loseFernetAndEnrage(knockDir = null) {
      if (!this.hasFernetBottle) return false;
      this.hasFernetBottle = false;
      this.enraged = true;
      this.hp = 1;
      this.pendingThrow = null; // Proyectiles ya lanzados en game.fernetBottles siguen su trayectoria
      this.disarmTimer = 0.45;
      this.hitFlashTimer = 0.30;
      this.hitCooldown = 0.28;
      this.punchCooldown = 0.45;
      const kDir = knockDir !== null ? (knockDir >= 0 ? 1 : -1) : (this.facing === 'right' ? -1 : 1);
      this.knockbackVx = kDir * 95;
      this.knockbackTimer = 0.18;
      this.droppedBottle = {
        x: this.x + this.w * 0.5,
        y: this.y + 18,
        vx: (this.facing === 'right' ? 1 : -1) * 110,
        vy: -255,
        angle: 0,
        life: 0.9
      };
      return true;
    }

    disarmFromEarthquake() {
      return this.loseFernetAndEnrage(null);
    }

    takeHit(knockDir = 1, clearDisable = true, ignoreCooldown = false) {
      if (this.dead) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      if (clearDisable) {
        this.stunTimer = 0;
        this.hypnotizedTimer = 0;
      }
      if (this.hasFernetBottle || this.hp > 1) {
        this.loseFernetAndEnrage(knockDir);
        return 'enraged';
      }
      this.hp = 0;
      this.dead = true;
      return 'killed';
    }

    punchHitbox() {
      if (this.hasFernetBottle || this.punchTimer <= 0 || this.isDisabled() || this.dead) return null;
      const reachW = 22;
      return {
        x: this.facing === 'right' ? this.x + this.w - 4 : this.x - reachW + 4,
        y: this.y + 14,
        w: reachW,
        h: 28
      };
    }

    update(dt, leader = null, aiCtx = null) {
      if (this.dead) return;
      if (this.droppedBottle && this.droppedBottle.life > 0) {
        const db = this.droppedBottle;
        db.life -= dt;
        db.vy = Math.min(MAX_FALL_SPEED, db.vy + GRAVITY * dt);
        db.x += db.vx * dt;
        db.y += db.vy * dt;
        db.angle += dt * 11;
      }

      if (this.throwAnim > 0) this.throwAnim = Math.max(0, this.throwAnim - dt);
      if (this.punchTimer > 0) this.punchTimer = Math.max(0, this.punchTimer - dt);
      if (this.punchCooldown > 0) this.punchCooldown = Math.max(0, this.punchCooldown - dt);

      const knockingBack = tickHeavyHitFields(this, dt);
      if (tickEnemyStatus(this, dt) || knockingBack) return;

      if (this.disarmTimer > 0) {
        this.disarmTimer = Math.max(0, this.disarmTimer - dt);
        return;
      }

      const tier = (aiCtx && aiCtx.aiTier) || this.aiTier || 1;
      const cfg = getArgentinaAIConfig(tier, (aiCtx && aiCtx.cityKey) || this.aiCity);
      const cx = this.x + this.w * 0.5;
      const dx = leader ? (leader.x + leader.w * 0.5) - cx : 9999;
      const dy = leader ? (leader.y + leader.h * 0.5) - (this.y + this.h * 0.5) : 9999;

      if (this.hasFernetBottle) {
        // FASE 1: recorrido libre sobre su superficie y lanzamiento de Fernet
        moveBelgranoFreePatrol(this, dt, this.baseSpeed, aiCtx, true);
        this.throwCooldown -= dt;
        if (leader && !leader.dead && Math.abs(dx) < Math.max(430, cfg.detectRange) && Math.abs(dy) < 235) {
          if (Math.abs(dx) > 16) this.facing = dx >= 0 ? 'right' : 'left';
          if (this.throwCooldown <= 0) {
            this.throwCooldown = (2.15 + Math.random() * 0.45) * cfg.cooldownMult;
            this.throwAnim = 0.34;
            const dir = dx >= 0 ? 1 : -1;
            const dist = Math.abs(dx);
            const flightTime = 0.58 + Math.min(0.42, dist / 860);
            const speedX = Math.max(120, Math.min(310, dist / flightTime));
            this.pendingThrow = new FernetBottleProjectile(
              cx + dir * 12,
              this.y + 14,
              dir * speedX,
              -395
            );
          }
        }
      } else {
        // FASE 2 (Modo Furia): recorrido libre + persecución respetando bordes de pozos y muros
        const rageSpeed = this.baseSpeed * (this.enraged ? 1.25 : 1.0);
        const chaseRange = Math.max(420, cfg.detectRange);
        if (leader && !leader.dead && Math.abs(dx) < chaseRange && Math.abs(dy) < 170) {
          this.facing = dx >= 0 ? 'right' : 'left';
          const dist = Math.abs(dx);
          if (dist > 34) {
            moveBelgranoFreePatrol(this, dt, rageSpeed, aiCtx, false);
          } else {
            this.vx = 0;
          }
          if (dist <= 68 && Math.abs(dy) <= 60 && this.punchCooldown <= 0) {
            this.punchTimer = 0.28;
            this.punchCooldown = 0.88;
          }
        } else {
          moveBelgranoFreePatrol(this, dt, rageSpeed, aiCtx, true);
        }
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -140 || sx > 1100) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      ctx.save();
      ctx.translate(-cameraX, 0);
      sprites.drawBelgranoPirateHD(ctx, this, this.animTimer);
      ctx.restore();
      drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
    }
  }

  class SerranoBurroEnemy {
    constructor(x, y, minX, maxX, speed = 82, levelIndex = 0) {
      this.w = 44;
      this.h = 36;
      this.x = x;
      this.y = y - this.h;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.patrolSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex) * 1.15;
      this.chargeSpeed = this.patrolSpeed * 2.55;
      this.vx = this.patrolSpeed;
      this.facing = 'left';
      this.dead = false;
      this.isCharging = false;
      this.chargeTimer = 0;
      this.chargeCooldown = 0;
      initHeavyHitFields(this, 2);
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.animTimer = Math.random() * 6;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.isCharging = false;
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this.isCharging = false;
    }

    triggerBounce() {}

    takeHit(knockDir = 1, clearDisable = true, ignoreCooldown = false) {
      return applyHeavyImpact(this, knockDir, { clearDisable, ignoreCooldown, chargeCooldown: 0.95 });
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (tickHeavyHitFields(this, dt)) return;
      if (this.isDisabled()) return;

      if (this.chargeCooldown > 0) this.chargeCooldown = Math.max(0, this.chargeCooldown - dt);

      if (!this.isCharging && this.chargeCooldown <= 0 && leader && !leader.dead) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = leader.y + leader.h * 0.5 - (this.y + this.h * 0.5);
        if (Math.abs(dx) <= 285 && Math.abs(dy) <= 88) {
          this.facing = dx >= 0 ? 'right' : 'left';
          this.isCharging = true;
          this.chargeTimer = 0.88;
        }
      }

      if (this.isCharging) {
        this.chargeTimer -= dt;
        const dir = this.facing === 'right' ? 1 : -1;
        this.vx = dir * this.chargeSpeed;
        this.x += this.vx * dt;
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.isCharging = false;
          this.chargeCooldown = 0.85;
          this.facing = 'right';
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this.isCharging = false;
          this.chargeCooldown = 0.85;
          this.facing = 'left';
        } else if (this.chargeTimer <= 0) {
          this.isCharging = false;
          this.chargeCooldown = 0.75;
        }
        return;
      }

      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.patrolSpeed;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const sx = this.x - cameraX;
      if (sx < -120 || sx > 1080) return;
      sprites.drawSerranoBurroHD(
        ctx,
        sx,
        this.y,
        this.facing,
        this.animTimer,
        this.isDisabled(),
        this.isCharging,
        this.hitFlashTimer > 0,
        this.hp
      );
      drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
    }
  }

  class MiniUfoEnemy {
    constructor(x, baseY, minX, maxX, vx = 98, ampY = 26, period = 4.6, beamHeight = 195) {
      this.w = 46;
      this.h = 24;
      this.x = x;
      this.baseY = baseY;
      this.y = baseY;
      this.minX = minX;
      this.maxX = maxX;
      this.vx = Math.abs(vx);
      this.ampY = ampY;
      this.facing = 'right';
      this.period = Math.max(3.6, period);
      this.beamHeight = beamHeight;
      this.beamCycle = Math.random() * this.period;
      this.beamWarning = false;
      this.beamActive = false;
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.immuneToHypnosis = true;
      this.animTimer = Math.random() * 6;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.beamActive = false;
      this.beamWarning = false;
    }

    hypnotize() {
      // Nave/máquina extraterrestre: completamente inmune a la Pose Hipnótica de Andrea
      return false;
    }

    triggerBounce() {}

    getBeamHitbox() {
      if (!this.beamActive || this.isDisabled() || this.dead) return null;
      return {
        x: this.x + this.w * 0.5 - 15,
        y: this.y + this.h - 2,
        w: 30,
        h: this.beamHeight
      };
    }

    update(dt) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.isDisabled()) {
        this.beamActive = false;
        this.beamWarning = false;
        return;
      }

      const dir = this.facing === 'right' ? 1 : -1;
      const moveMult = this.beamActive ? 0.55 : 1.0;
      this.x += dir * this.vx * moveMult * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
      this.y = this.baseY + Math.sin(this.animTimer * 3.1) * this.ampY;

      this.beamCycle = (this.beamCycle + dt) % this.period;
      if (this.beamCycle >= this.period - 1.65) {
        this.beamActive = true;
        this.beamWarning = false;
      } else if (this.beamCycle >= this.period - 2.25) {
        this.beamActive = false;
        this.beamWarning = true;
      } else {
        this.beamActive = false;
        this.beamWarning = false;
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawMiniUfoHD(ctx, this, cameraX, this.animTimer);
      const sx = this.x - cameraX;
      drawEnemyStatusOverlay(ctx, sx, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer);
    }
  }

  // ==========================================================================
  // USHUAIA (TIERRA DEL FUEGO): ENEMIGOS EXCLUSIVOS AUSTRALES
  // ==========================================================================

  /** Lobo Marino Austral (2 HP): reposa en rocas/muelles y embiste a saltos cortos. */
  class SeaLionEnemy {
    constructor(x, y, minX, maxX, speed = 64, levelIndex = 0) {
      this.w = 46;
      this.h = 34;
      this.x = x;
      this.y = y - this.h;
      this.groundY = y;
      this.minX = minX;
      this.maxX = maxX;
      const scale = getLevelSpeedScale(levelIndex);
      this.baseSpeed = Math.abs(speed) * scale;
      this.chargeSpeed = this.baseSpeed * 2.05;
      this.facing = 'left';
      this.dead = false;
      initHeavyHitFields(this, 2);
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.charging = false;
      this.chargeTimer = 0;
      this.chargeCooldown = 0;
      this.hopTimer = 0;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    takeHit(knockDir = 1, ignoreCooldown = false) {
      return applyHeavyImpact(this, knockDir, {
        ignoreCooldown,
        knockbackSpeed: 140,
        flashDuration: 0.34,
        cooldownDuration: 0.30
      });
    }

    update(dt, leader) {
      if (this.dead) return;
      const knockingBack = tickHeavyHitFields(this, dt);
      if (tickEnemyStatus(this, dt) || knockingBack) return;

      if (this.chargeCooldown > 0) this.chargeCooldown = Math.max(0, this.chargeCooldown - dt);

      if (!this.charging && this.chargeCooldown <= 0 && leader && !leader.dead) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        const dy = (leader.y + leader.h * 0.5) - (this.y + this.h * 0.5);
        if (Math.abs(dx) <= 235 && Math.abs(dy) <= 85) {
          this.facing = dx >= 0 ? 'right' : 'left';
          this.charging = true;
          this.chargeTimer = 0.85;
        }
      }

      const prevSpeed = this.baseSpeed;
      if (this.charging) {
        this.chargeTimer -= dt;
        this.baseSpeed = this.chargeSpeed;
        patrolBetweenBounds(this, dt);
        this.baseSpeed = prevSpeed;
        if (this.chargeTimer <= 0 || this.x <= this.minX + 1 || this.x + this.w >= this.maxX - 1) {
          this.charging = false;
          this.chargeCooldown = 0.95;
        }
      } else {
        patrolBetweenBounds(this, dt);
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.groundY, this.w, solids, movingPlatforms, cameraX);
      sprites.drawSeaLionHD(ctx, this, cameraX, this.animTimer);
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /**
   * Centolla Gigante Fueguina (2 HP):
   * - Con armadura (hp === 2): caparazón espinoso inmune a pisotón normal.
   * - Primer golpe de Planta [Z], Terremoto [C] o pisotón bajo Hipnosis [C] rompe armadura (hp = 1).
   * - Segundo golpe (cualquiera, incluido pisotón normal) la elimina.
   */
  class KingCrabEnemy {
    constructor(x, y, minX, maxX, speed = 72, levelIndex = 0) {
      this.w = 42;
      this.h = 34;
      this.x = x;
      this.y = y - this.h;
      this.minX = minX;
      this.maxX = maxX;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = 'left';
      this.dead = false;
      this.hasArmor = true;
      this.armorBroken = false;
      this.hasShellSpikes = true;
      initHeavyHitFields(this, 2);
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    takeHit(particles = null, knockDir = 1, fromArmorBreaker = false, ignoreCooldown = false, clearHypnosis = false) {
      if (this.dead) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      if (this.hasArmor && !this.armorBroken) {
        if (!fromArmorBreaker) return 'blocked';
        this.hasArmor = false;
        this.armorBroken = true;
        this.hasShellSpikes = false;
        this.hp = 1;
        this.hitFlashTimer = 0.34;
        this.hitCooldown = 0.30;
        this.knockbackVx = (knockDir >= 0 ? 1 : -1) * 125;
        this.knockbackTimer = 0.22;
        if (clearHypnosis) this.hypnotizedTimer = 0;
        if (particles) {
          const cx = this.x + this.w * 0.5;
          particles.Burst(cx, this.y + 12, '#ef4444', 14);
          particles.Burst(cx, this.y + 12, '#fde047', 10);
        }
        return 'armor_broken';
      }
      this.hp = 0;
      this.dead = true;
      return 'killed';
    }

    update(dt) {
      if (this.dead) return;
      const knockingBack = tickHeavyHitFields(this, dt);
      if (tickEnemyStatus(this, dt) || knockingBack) return;
      const spd = this.armorBroken ? this.baseSpeed * 1.28 : this.baseSpeed;
      const prevSpeed = this.baseSpeed;
      this.baseSpeed = spd;
      patrolBetweenBounds(this, dt);
      this.baseSpeed = prevSpeed;
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      sprites.drawKingCrabHD(ctx, this, cameraX, this.animTimer);
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Zorro Colorado Fueguino (1 HP): veloz en bosques, salta ágilmente para esquivar tiros rasantes [Z]. */
  class FuegianFoxEnemy {
    constructor(x, y, minX, maxX, speed = 112, levelIndex = 0) {
      this.w = 38;
      this.h = 30;
      this.x = x;
      this.y = y - this.h;
      this.groundY = y;
      this.minX = minX;
      this.maxX = maxX;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = 'left';
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.vy = 0;
      this.onGround = true;
      this.jumpCooldown = 0;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.2) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    update(dt, leader, aiCtx = null) {
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) return;

      if (this.jumpCooldown > 0) this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);

      // Esquiva ágil saltando por encima de proyectiles horizontales bajos de Planta [Z]
      if (this.onGround && this.jumpCooldown <= 0 && aiCtx && Array.isArray(aiCtx.projectiles)) {
        for (let i = 0; i < aiCtx.projectiles.length; i++) {
          const p = aiCtx.projectiles[i];
          if (!p || p.dead) continue;
          const isLowHorizontal = Math.abs(p.vy || 0) < 40;
          const distX = (this.x + this.w * 0.5) - (p.x + (p.w || 16) * 0.5);
          if (isLowHorizontal && Math.abs(distX) >= 55 && Math.abs(distX) <= 235 && ((p.vx || 0) * distX > 0)) {
            if (p.y + (p.h || 14) * 0.5 >= this.y - 12 && p.y <= this.groundY + 6) {
              const jumpScale = this.slowTimer > 0 ? SLOW_JUMP_FACTOR : 1.0;
              this.vy = -370 * jumpScale;
              this.onGround = false;
              this.jumpCooldown = 0.85;
              break;
            }
          }
        }
      }

      if (!this.onGround) {
        this.vy += GRAVITY * dt;
        this.y += this.vy * dt;
        if (this.y + this.h >= this.groundY) {
          this.y = this.groundY - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }

      patrolBetweenBounds(this, dt);
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.groundY, this.w, solids, movingPlatforms, cameraX);
      sprites.drawFuegianFoxHD(ctx, this, cameraX, this.animTimer);
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Enjambre de Cormoranes Australes (Zona 4 Faro Les Éclaireurs): ahuyentados por La Tina [X]. */
  class SwarmCormorant {
    constructor(x, y, attackSpeed = 305) {
      this.x = x;
      this.y = y;
      this.w = 28;
      this.h = 20;
      this.attackSpeed = attackSpeed;
      this.homingAgility = 3.0;
      this.vx = -attackSpeed * 0.8;
      this.vy = 0;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 6;
      this.wingOffset = Math.random() * Math.PI * 2;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -565 - Math.random() * 145;
      this.vx = (Math.random() - 0.5) * 380;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) return;

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -120) this.dead = true;
        return;
      }

      if (leader && !leader.dead) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = leader.y + leader.h * 0.45 - (this.y + this.h * 0.5);
        const dist = Math.hypot(dx, dy) || 1;
        const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
        const desiredVx = (dx / dist) * this.attackSpeed * spdScale;
        const desiredVy = (dy / dist) * this.attackSpeed * spdScale;
        this.vx += (desiredVx - this.vx) * Math.min(1, this.homingAgility * dt);
        this.vy += (desiredVy - this.vy) * Math.min(1, this.homingAgility * dt);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.facing = this.vx >= 0 ? 'right' : 'left';
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawSwarmCormorantHD(ctx, this, cameraX, this.animTimer);
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  // ==========================================================================
  // CHILE: FAUNA ANDINA, PORTEÑA Y GUARDIANES DE RAPA NUI
  // ==========================================================================

  /**
   * Puma Andino (2 HP):
   * - Patrulla velozmente y prepara emboscadas en salto parabólico sobre el jugador.
   * - 1.er golpe (stomp / Planta [Z] / Terremoto [C]): detiene el salto, aturde brevemente y pasa a Fase 2 furiosa (hp = 1).
   * - 2.do golpe: elimina al enemigo.
   */
  class PumaEnemy {
    constructor(x, y, minX, maxX, speed = 96, levelIndex = 0, isAmbush = false) {
      this.w = 44;
      this.h = 30;
      this.x = x;
      this.y = y - this.h;
      this.initialX = x;
      this.initialY = this.y;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = 'left';
      this.vx = -this.baseSpeed;
      this.vy = 0;
      this.dead = false;
      this.isAmbush = !!isAmbush;
      this.pounceState = 'patrol'; // 'patrol' | 'crouch' | 'pounce' | 'recover'
      this.stateTimer = 0;
      this.leapCooldown = 0.6;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 4;
      initHeavyHitFields(this, 2);
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      if (this.pounceState === 'pounce' || this.pounceState === 'crouch') {
        this.pounceState = 'recover';
        this.vy = Math.max(0, this.vy);
      }
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      if (this.pounceState === 'pounce' || this.pounceState === 'crouch') {
        this.pounceState = 'recover';
        this.vy = Math.max(0, this.vy);
      }
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false;
    }

    takeHit(particles = null, knockDir = 1, ignoreCooldown = false) {
      if (this.dead) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      const dir = knockDir >= 0 ? 1 : -1;
      const cx = this.x + this.w * 0.5;
      const cy = this.y + this.h * 0.5;
      if (this.hp > 1) {
        this.hp = 1;
        this.hitFlashTimer = 0.36;
        this.hitCooldown = 0.25;
        this.knockbackVx = dir * 150;
        this.knockbackTimer = 0.24;
        this.stunTimer = Math.max(this.stunTimer, 0.7);
        this.pounceState = 'recover';
        this.vy = Math.max(0, this.vy);
        this.vx = 0;
        this.baseSpeed *= 1.28;
        this.leapCooldown = 0.95;
        if (particles) {
          particles.Burst(cx, cy, '#f59e0b', 14);
          particles.Burst(cx, cy, '#fde047', 8);
        }
        return 'damaged';
      }
      this.hp = 0;
      this.dead = true;
      return 'killed';
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (this.leapCooldown > 0) this.leapCooldown = Math.max(0, this.leapCooldown - dt);

      if (this.y < this.initialY && (this.isDisabled() || this.knockbackTimer > 0 || this.pounceState === 'recover')) {
        this.vy = Math.min(MAX_FALL_SPEED, this.vy + 980 * dt);
        this.y += this.vy * dt;
        if (this.y >= this.initialY) {
          this.y = this.initialY;
          this.vy = 0;
          if (this.pounceState === 'recover') this.pounceState = 'patrol';
        }
      }

      if (tickHeavyHitFields(this, dt)) {
        this.x = Math.max(this.minX, Math.min(this.maxX - this.w, this.x));
        return;
      }
      if (this.isDisabled()) return;

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;

      if (this.pounceState === 'crouch') {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          const dir = this.facing === 'right' ? 1 : -1;
          this.pounceState = 'pounce';
          this.vx = dir * (this.hp === 1 ? 265 : 230) * spdScale;
          this.vy = this.hp === 1 ? -395 : -360;
        }
        return;
      }

      if (this.pounceState === 'pounce') {
        this.vy = Math.min(MAX_FALL_SPEED, this.vy + 980 * dt);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.vx = Math.abs(this.vx) * 0.5;
          this.facing = 'right';
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this.vx = -Math.abs(this.vx) * 0.5;
          this.facing = 'left';
        }
        if (this.y >= this.initialY) {
          this.y = this.initialY;
          this.vy = 0;
          this.pounceState = 'patrol';
          this.leapCooldown = this.hp === 1 ? 1.45 : 2.15;
        }
        return;
      }

      if (leader && !leader.dead && this.leapCooldown <= 0) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        const dy = leader.y - this.y;
        if (Math.abs(dx) < (this.isAmbush ? 235 : 190) && Math.abs(dy) < 115) {
          this.facing = dx >= 0 ? 'right' : 'left';
          this.pounceState = 'crouch';
          this.stateTimer = this.hp === 1 ? 0.16 : 0.24;
          return;
        }
      }

      const dir = this.facing === 'right' ? 1 : -1;
      const moveSpeed = this.baseSpeed * spdScale;
      this.vx = dir * moveSpeed;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      sprites.drawPumaHD(ctx, this, screenX, this.y, this.animTimer);
      drawEnemyStatusOverlay(ctx, screenX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Proyectil salino horizontal disparado por la Vicuña Andina. */
  class SalineSpitProjectile {
    constructor(x, y, vx, owner = null) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = 0;
      this.w = 14;
      this.h = 10;
      this.owner = owner;
      this.dead = false;
      this.animTimer = 0;
      this.life = 2.6;
    }

    update(dt, solids, cameraX = 0) {
      if (this.dead) return;
      this.animTimer += dt;
      this.life -= dt;
      if (this.life <= 0) {
        this.dead = true;
        return;
      }
      this.x += this.vx * dt;
      if (this.x < cameraX - 160 || this.x > cameraX + 1140) {
        this.dead = true;
        return;
      }
      if (Array.isArray(solids)) {
        for (let i = 0; i < solids.length; i++) {
          const s = solids[i];
          if (!s || s.oneWay) continue;
          if (aabbOverlap(this, s)) {
            this.dead = true;
            return;
          }
        }
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      const sx = this.x - cameraX;
      if (sx < -40 || sx > 1000) return;
      sprites.drawSalineSpitHD(ctx, sx, this.y, this.w, this.h, this.animTimer, this.vx);
    }
  }

  /**
   * Vicuña Andina (1 HP):
   * - Patrulla sectores rocosos/salinos y escupe proyectiles salinos horizontales a distancia.
   * - Vulnerable a disparo diagonal [↑+Z], salto en la cabeza o Terremoto [C].
   */
  class VicunaEnemy {
    constructor(x, y, minX, maxX, speed = 64, levelIndex = 0) {
      this.w = 36;
      this.h = 48;
      this.x = x;
      this.y = y - this.h;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = 'left';
      this.vx = -this.baseSpeed;
      this.hp = 1;
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 4;
      this.spitCooldown = 1.1 + Math.random() * 0.7;
      this.spitTelegraphTimer = 0;
      this.pendingSpit = null;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
      this.spitTelegraphTimer = 0;
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
      this.spitTelegraphTimer = 0;
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false;
    }

    update(dt, leader) {
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (this.spitCooldown > 0) this.spitCooldown = Math.max(0, this.spitCooldown - dt);
      if (this.isDisabled()) return;

      if (this.spitTelegraphTimer > 0) {
        this.spitTelegraphTimer -= dt;
        if (this.spitTelegraphTimer <= 0) {
          const dir = this.facing === 'right' ? 1 : -1;
          const mouthX = this.facing === 'right' ? this.x + this.w - 4 : this.x - 10;
          const mouthY = this.y + 13;
          this.pendingSpit = new SalineSpitProjectile(mouthX, mouthY, dir * 295, this);
          this.spitCooldown = 2.25;
        }
        return;
      }

      if (leader && !leader.dead && this.spitCooldown <= 0) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        const dy = (leader.y + leader.h * 0.5) - (this.y + 18);
        if (Math.abs(dx) < 350 && Math.abs(dy) < 95) {
          this.facing = dx >= 0 ? 'right' : 'left';
          this.spitTelegraphTimer = 0.28;
          return;
        }
      }

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.baseSpeed * spdScale;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      sprites.drawVicunaHD(ctx, this, screenX, this.y, this.animTimer);
      drawEnemyStatusOverlay(ctx, screenX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Perro Porteño (1 HP): patrullero veloz en escaleras y cerros de Valparaíso. */
  class PortDogEnemy {
    constructor(x, y, minX, maxX, speed = 114, levelIndex = 0) {
      this.w = 34;
      this.h = 26;
      this.x = x;
      this.y = y - this.h;
      this.baseY = this.y;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = 'left';
      this.vx = -this.baseSpeed;
      this.hp = 1;
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.happyFleeing = false;
      this.scaredFlying = false;
      this.animTimer = Math.random() * 4;
      this.hopOffsetY = 0;
      this.hopVy = 0;
      this.hopCooldown = 1.0 + Math.random();
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0 || this.happyFleeing;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.happyFleeing) return false;
      this.happyFleeing = true;
      this.scaredFlying = true;
      this.hopVy = -380;
      this.hopOffsetY = Math.min(this.hopOffsetY, -2);
      this.vx = (this.facing === 'right' ? 1 : -1) * Math.max(195, this.baseSpeed * 1.9);
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      if (this.happyFleeing) {
        this.animTimer += dt * 1.8;
        this.hopVy += 880 * dt;
        this.y += this.hopVy * dt;
        this.x += this.vx * dt;
        if (this.y > 600) this.dead = true;
        return;
      }
      if (tickEnemyStatus(this, dt)) return;
      this.hopCooldown = Math.max(0, this.hopCooldown - dt);

      if (this.hopOffsetY < 0 || this.hopVy < 0) {
        this.hopVy += 920 * dt;
        this.hopOffsetY += this.hopVy * dt;
        if (this.hopOffsetY >= 0) {
          this.hopOffsetY = 0;
          this.hopVy = 0;
        }
      } else if (leader && !leader.dead && this.hopCooldown <= 0) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        if (Math.abs(dx) < 165 && Math.abs(leader.y - this.baseY) < 95) {
          this.facing = dx >= 0 ? 'right' : 'left';
          this.hopVy = -210;
          this.hopOffsetY = -1;
          this.hopCooldown = 1.85;
        }
      }

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.baseSpeed * spdScale;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
      this.y = this.baseY + this.hopOffsetY;
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.baseY + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      sprites.drawPortDogHD(ctx, this, screenX, this.y, this.animTimer);
      drawEnemyStatusOverlay(ctx, screenX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /**
   * Guerrero Rapa Nui (2 HP — Isla de Pascua):
   * - Fase 1 (hasMask = true, hp = 2): máscara ceremonial de piedra bloquea saltos directos.
   *   Planta [Z], Terremoto [C] o salto tras hipnosis [C] de Andrea rompen la máscara (hp = 1).
   * - Fase 2 (hasMask = false, hp = 1): cualquier golpe lo elimina.
   */
  class RapaNuiWarrior {
    constructor(x, y, minX, maxX, speed = 72, levelIndex = 0) {
      this.w = 36;
      this.h = 52;
      this.x = x;
      this.y = y - this.h;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.vx = -this.baseSpeed;
      this.facing = 'left';
      this.dead = false;
      this.hasMask = true;
      initHeavyHitFields(this, 2);
      this.stunTimer = 0;
      this.maskBreakTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.flyingPieces = [];
    }

    isDisabled() {
      return this.stunTimer > 0 || this.maskBreakTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.5) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false;
    }

    breakMask(particles = null, knockDir = 1, clearHypnosis = false) {
      if (this.dead || !this.hasMask) return false;
      this.hasMask = false;
      this.hp = 1;
      this.maskBreakTimer = 0.42;
      if (clearHypnosis) {
        this.hypnotizedTimer = 0;
        this.maskBreakTimer = 0;
      }
      this.hitFlashTimer = 0.30;
      this.hitCooldown = 0.28;
      this.knockbackVx = (knockDir >= 0 ? 1 : -1) * 120;
      this.knockbackTimer = 0.22;
      const cx = this.x + this.w * 0.5;
      this.flyingPieces = [
        {
          kind: 'mask',
          x: cx,
          y: this.y + 14,
          vx: (knockDir >= 0 ? 1 : -1) * 115,
          vy: -280,
          angle: 0,
          vr: 9.0,
          life: 0.95
        }
      ];
      if (particles) {
        particles.Burst(cx, this.y + 16, '#94a3b8', 16);
        particles.Burst(cx, this.y + 18, '#fb923c', 10);
      }
      return true;
    }

    takeHit(particles = null, knockDir = 1, fromMaskBreaker = false, ignoreCooldown = false) {
      if (this.dead) return 'none';
      if (!ignoreCooldown && this.hitCooldown > 0) return 'ignored';
      if (this.hasMask) {
        if (!fromMaskBreaker) return 'blocked';
        this.breakMask(particles, knockDir);
        return 'mask_broken';
      }
      this.hp = 0;
      this.dead = true;
      return 'killed';
    }

    update(dt, leader) {
      if (this.flyingPieces && this.flyingPieces.length) {
        for (let i = this.flyingPieces.length - 1; i >= 0; i--) {
          const pc = this.flyingPieces[i];
          pc.life -= dt;
          if (pc.life <= 0) {
            this.flyingPieces.splice(i, 1);
            continue;
          }
          pc.vy = Math.min(MAX_FALL_SPEED, pc.vy + GRAVITY * dt);
          pc.x += pc.vx * dt;
          pc.y += pc.vy * dt;
          pc.angle += pc.vr * dt;
        }
      }
      if (this.dead) return;
      this.animTimer += dt;
      if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.maskBreakTimer > 0) this.maskBreakTimer = Math.max(0, this.maskBreakTimer - dt);
      if (this.hypnotizedTimer > 0) this.hypnotizedTimer = Math.max(0, this.hypnotizedTimer - dt);
      if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
      if (tickHeavyHitFields(this, dt)) {
        this.x = Math.max(this.minX, Math.min(this.maxX - this.w, this.x));
        return;
      }
      if (this.isDisabled()) return;

      if (this.hasMask && leader && !leader.dead) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        if (Math.abs(dx) < 170 && Math.abs(leader.y - this.y) < 90) {
          this.facing = dx >= 0 ? 'right' : 'left';
        }
      }

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      const dir = this.facing === 'right' ? 1 : -1;
      const moveSpeed = this.baseSpeed * (this.hasMask ? 1.0 : 1.18) * spdScale;
      this.vx = dir * moveSpeed;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      const hasPieces = this.flyingPieces && this.flyingPieces.length > 0;
      if (this.dead && !hasPieces) return;
      if (!this.dead) {
        drawProjectedShadow(ctx, this.x, this.y + this.h, this.w, solids, movingPlatforms, cameraX);
      }
      const screenX = this.x - cameraX;
      sprites.drawRapaNuiWarriorHD(ctx, this, screenX, this.y, this.animTimer);
      if (!this.dead) {
        drawEnemyStatusOverlay(
          ctx,
          screenX,
          this.y,
          this.w,
          Math.max(this.stunTimer, this.maskBreakTimer),
          this.hypnotizedTimer,
          this.animTimer,
          this.slowTimer,
          this.h
        );
      }
    }
  }

  /**
   * Bailarines típicos chilenos de cueca (exclusivos de Santiago y Viña del Mar/Valparaíso):
   * Patrullan tramos cortos de ida y vuelta zapateando, girando y agitando su pañuelo blanco.
   * No lanzan proyectiles y mueren de 1 golpe (hp = 1).
   */
  class CuecaDancerBase {
    constructor(variant, x, y, minX, maxX, speed = 84, levelIndex = 0) {
      this.variant = variant;
      this.w = 34;
      this.h = 46;
      this.x = x;
      this.y = y - this.h;
      this.baseY = this.y;
      this.minX = Number.isFinite(minX) ? minX : x - 80;
      this.maxX = Number.isFinite(maxX) ? maxX : x + 80;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = Math.random() < 0.5 ? 'left' : 'right';
      this.vx = (this.facing === 'right' ? 1 : -1) * this.baseSpeed;
      this.hp = 1;
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.dancePhase = Math.random() * Math.PI * 2;
      this.spinTimer = 0;
      this.spinCooldown = 1.6 + Math.random() * 1.4;
      this.hopOffsetY = 0;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    canReceiveStatus() {
      return !this.dead;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      return false;
    }

    update(dt) {
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) {
        this.hopOffsetY = 0;
        this.y = this.baseY;
        return;
      }

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      this.dancePhase += dt * 5.6 * spdScale;
      if (this.spinTimer > 0) {
        this.spinTimer = Math.max(0, this.spinTimer - dt);
      }
      this.spinCooldown -= dt * spdScale;
      if (this.spinCooldown <= 0) {
        this.spinTimer = 0.24;
        this.spinCooldown = 1.9 + Math.random() * 1.1;
      }

      const cadence = 0.72 + 0.42 * Math.abs(Math.cos(this.dancePhase * 0.9));
      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.baseSpeed * spdScale * cadence;
      this.x += this.vx * dt;

      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
        this.spinTimer = 0.24;
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
        this.spinTimer = 0.24;
      }

      this.hopOffsetY = -Math.abs(Math.sin(this.dancePhase * 2.5)) * 4.5;
      this.y = this.baseY + this.hopOffsetY;
    }

    draw(ctx, sprites, cameraX, solids, movingPlatforms) {
      if (this.dead) return;
      drawProjectedShadow(ctx, this.x, this.baseY + this.h, this.w, solids, movingPlatforms, cameraX);
      const screenX = this.x - cameraX;
      if (this.variant === 'guasa') {
        sprites.drawGuasaHD(ctx, this, screenX, this.y, this.animTimer);
      } else {
        sprites.drawGuasoHD(ctx, this, screenX, this.y, this.animTimer);
      }
      drawEnemyStatusOverlay(ctx, screenX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Bailarín típico chileno (Guaso): sombrero negro, chamanto tricolor, espuelas y pañuelo blanco. */
  class GuasoEnemy extends CuecaDancerBase {
    constructor(x, y, minX, maxX, speed = 84, levelIndex = 0) {
      super('guaso', x, y, minX, maxX, speed, levelIndex);
    }
  }

  /** Bailarina típica chilena (Guasa / China): vestido rojo de lunares con volantes y pañuelo blanco. */
  class GuasaEnemy extends CuecaDancerBase {
    constructor(x, y, minX, maxX, speed = 86, levelIndex = 0) {
      super('guasa', x, y, minX, maxX, speed, levelIndex);
    }
  }

  /** Fragata del Pacífico (Isla de Pascua): patrulla aérea costera en Z1-Z4 o enjambre en Z4; ahuyentada por La Tina [X]. */
  class SwarmFrigate {
    constructor(x, y, attackSpeed = 305, patrolOpts = null) {
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.w = 32;
      this.h = 22;
      this.isPatrol = Boolean(patrolOpts && Number.isFinite(patrolOpts.minX) && Number.isFinite(patrolOpts.maxX));
      this.minX = this.isPatrol ? patrolOpts.minX : 0;
      this.maxX = this.isPatrol ? patrolOpts.maxX : 0;
      this.ampY = (patrolOpts && Number.isFinite(patrolOpts.ampY)) ? patrolOpts.ampY : 24;
      this.attackSpeed = attackSpeed;
      this.homingAgility = 3.1;
      this.vx = this.isPatrol ? -Math.abs(attackSpeed || 135) : -attackSpeed * 0.8;
      this.vy = 0;
      this.facing = 'left';
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 6;
      this.wingOffset = Math.random() * Math.PI * 2;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -575 - Math.random() * 145;
      this.vx = (Math.random() - 0.5) * 390;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) return;

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < -120) this.dead = true;
        return;
      }

      if (this.isPatrol) {
        const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
        const spd = Math.abs(this.attackSpeed || 135) * spdScale;
        const dir = this.facing === 'right' ? 1 : -1;
        this.vx = dir * spd;
        this.x += this.vx * dt;
        if (this.x <= this.minX) {
          this.x = this.minX;
          this.facing = 'right';
        } else if (this.x + this.w >= this.maxX) {
          this.x = this.maxX - this.w;
          this.facing = 'left';
        }
        this.y = this.baseY + Math.sin(this.animTimer * 3.0 + this.wingOffset) * this.ampY;
        return;
      }

      if (leader && !leader.dead) {
        const dx = leader.x + leader.w * 0.5 - (this.x + this.w * 0.5);
        const dy = leader.y + leader.h * 0.45 - (this.y + this.h * 0.5);
        const dist = Math.hypot(dx, dy) || 1;
        const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
        const desiredVx = (dx / dist) * this.attackSpeed * spdScale;
        const desiredVy = (dy / dist) * this.attackSpeed * spdScale;
        this.vx += (desiredVx - this.vx) * Math.min(1, this.homingAgility * dt);
        this.vy += (desiredVy - this.vy) * Math.min(1, this.homingAgility * dt);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.facing = this.vx >= 0 ? 'right' : 'left';
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      sprites.drawSwarmFrigateHD(ctx, this, cameraX, this.animTimer);
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Cóndor Andino (1 HP — Santiago y Atacama): planea alto y desciende en picada táctica; ahuyentado por La Tina [X]. */
  class CondorEnemy {
    constructor(x, y, minX, maxX, speed = 136, levelIndex = 0) {
      this.w = 48;
      this.h = 28;
      this.x = x;
      this.y = y;
      this.anchorY = y;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = 'left';
      this.vx = -this.baseSpeed;
      this.vy = 0;
      this.hp = 1;
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.swoopPhase = Math.random() * Math.PI * 2;
      this.diveCooldown = 1.4 + Math.random() * 1.4;
      this.diveOffsetY = 0;
      this.diving = false;
      this.diveTimer = 0;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.diving = false;
      this.vy = -520;
      this.vx = (Math.random() - 0.5) * 320;
      return true;
    }

    update(dt, leader) {
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) return;

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy -= 260 * dt;
        if (this.y < -120) this.dead = true;
        return;
      }

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      this.swoopPhase += dt * 2.7;
      this.diveCooldown = Math.max(0, this.diveCooldown - dt);

      if (!this.diving && leader && !leader.dead && this.diveCooldown <= 0) {
        const dx = (leader.x + leader.w * 0.5) - (this.x + this.w * 0.5);
        if (Math.abs(dx) < 195 && leader.y > this.anchorY + 35 && leader.y < 465) {
          this.diving = true;
          this.diveTimer = 0;
          this.diveDuration = 1.35;
          this.diveDepth = Math.min(135, Math.max(58, leader.y - this.anchorY - 14));
          this.diveCooldown = Math.max(2.3, 3.3 - this.levelIndex * 0.14);
          this.facing = dx >= 0 ? 'right' : 'left';
        }
      }

      if (this.diving) {
        this.diveTimer += dt;
        const p = Math.min(1, this.diveTimer / (this.diveDuration || 1.35));
        this.diveOffsetY = Math.sin(p * Math.PI) * (this.diveDepth || 85);
        if (p >= 1) {
          this.diving = false;
          this.diveOffsetY = 0;
        }
      }

      const dir = this.facing === 'right' ? 1 : -1;
      const boost = this.diving ? 1.24 : 1.0;
      this.vx = dir * this.baseSpeed * boost * spdScale;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
      this.y = this.anchorY + Math.sin(this.swoopPhase) * 14 + this.diveOffsetY;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      if (sprites && typeof sprites.drawCondorHD === 'function') {
        sprites.drawCondorHD(ctx, this, cameraX, this.animTimer);
      }
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Pescado/estrella soltado en picada por el Pelícano Porteño. */
  class PelicanDropProjectile {
    constructor(x, y, vx = 0, vy = 105) {
      this.x = x;
      this.y = y;
      this.w = 18;
      this.h = 16;
      this.vx = vx;
      this.vy = vy;
      this.dead = false;
      this.animTimer = Math.random() * 4;
    }

    update(dt) {
      if (this.dead) return;
      this.animTimer += dt;
      this.vy = Math.min(460, this.vy + 430 * dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y > 498) this.dead = true;
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      if (sprites && typeof sprites.drawPelicanDropHD === 'function') {
        sprites.drawPelicanDropHD(ctx, this, cameraX, this.animTimer);
      }
    }
  }

  /** Pelícano Porteño (1 HP — Viña del Mar y Valparaíso): sobrevuela playas/muelles y deja caer peces; huye ante La Tina [X]. */
  class PortPelicanEnemy {
    constructor(x, y, minX, maxX, speed = 116, levelIndex = 0) {
      this.w = 44;
      this.h = 28;
      this.x = x;
      this.y = y;
      this.anchorY = y;
      this.minX = minX;
      this.maxX = maxX;
      this.levelIndex = levelIndex;
      this.baseSpeed = Math.abs(speed) * getLevelSpeedScale(levelIndex);
      this.facing = 'left';
      this.vx = -this.baseSpeed;
      this.vy = 0;
      this.hp = 1;
      this.dead = false;
      this.scaredFlying = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.slowTimer = 0;
      this.animTimer = Math.random() * 5;
      this.dropCooldown = 1.2 + Math.random() * 1.4;
    }

    isDisabled() {
      return this.stunTimer > 0 || this.hypnotizedTimer > 0;
    }

    stun(seconds = 3.0) {
      this.stunTimer = Math.max(this.stunTimer, seconds);
    }

    hypnotize(seconds = 3.0) {
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, seconds);
    }

    applySlow(seconds = 2.0) {
      this.slowTimer = Math.max(this.slowTimer || 0, seconds);
    }

    scareFlyUp() {
      if (this.dead || this.scaredFlying) return false;
      this.scaredFlying = true;
      this.vy = -510;
      this.vx = (Math.random() - 0.5) * 300;
      return true;
    }

    update(dt, leader, dropCollector) {
      if (this.dead) return;
      if (tickEnemyStatus(this, dt)) return;

      if (this.scaredFlying) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy -= 240 * dt;
        if (this.y < -120) this.dead = true;
        return;
      }

      const spdScale = this.slowTimer > 0 ? SLOW_SPEED_FACTOR : 1.0;
      const dir = this.facing === 'right' ? 1 : -1;
      this.vx = dir * this.baseSpeed * spdScale;
      this.x += this.vx * dt;
      if (this.x <= this.minX) {
        this.x = this.minX;
        this.facing = 'right';
      } else if (this.x + this.w >= this.maxX) {
        this.x = this.maxX - this.w;
        this.facing = 'left';
      }
      this.y = this.anchorY + Math.sin(this.animTimer * 3.1) * 10;

      this.dropCooldown = Math.max(0, this.dropCooldown - dt);
      if (dropCollector && leader && !leader.dead && this.dropCooldown <= 0) {
        const dx = Math.abs((leader.x + leader.w * 0.5) - (this.x + this.w * 0.5));
        if (dx < 230 && leader.y > this.y + 18) {
          this.dropCooldown = Math.max(1.55, 2.45 - this.levelIndex * 0.14);
          dropCollector.push(
            new PelicanDropProjectile(
              this.x + this.w * 0.5 - 9,
              this.y + this.h - 2,
              this.vx * 0.16,
              115
            )
          );
        }
      }
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead) return;
      if (sprites && typeof sprites.drawPortPelicanHD === 'function') {
        sprites.drawPortPelicanHD(ctx, this, cameraX, this.animTimer);
      }
      drawEnemyStatusOverlay(ctx, this.x - cameraX, this.y, this.w, this.stunTimer, this.hypnotizedTimer, this.animTimer, this.slowTimer, this.h);
    }
  }

  /** Peligro vertical marino/volcánico desde abajo (Viña/Puerto e Isla de Pascua): pez volador, piraña del Pacífico o pez de lava. */
  class PacificJumpHazard {
    constructor(x, baseY = 472, cyclePeriod = 2.9, jumpHeight = 165, phaseOffset = 0, kind = 'pacific_piranha') {
      this.x = x;
      this.baseY = baseY;
      this.y = baseY + 34;
      this.w = 28;
      this.h = 30;
      this.kind = kind || 'pacific_piranha'; // 'flying_fish' | 'pacific_piranha' | 'magma_piranha'
      this.cyclePeriod = Math.max(2.0, cyclePeriod);
      this.warningDuration = 0.65;
      this.airDuration = Math.min(this.cyclePeriod - 0.85, 1.32);
      this.jumpHeight = jumpHeight;
      this.timer = ((phaseOffset % this.cyclePeriod) + this.cyclePeriod) % this.cyclePeriod;
      this.state = 'submerged'; // 'submerged' | 'warning' | 'air'
      this.isDescending = false;
      this.dead = false;
      this.stunTimer = 0;
      this.hypnotizedTimer = 0;
      this.respawnDelay = 5.0;
      this.respawnTimer = 0;
      this.animTimer = Math.random() * 5;
      this.splashEvent = null; // 'out' | 'in'
    }

    isDisabled() {
      return !this.dead && this.respawnTimer <= 0 && (this.stunTimer > 0 || this.hypnotizedTimer > 0);
    }

    isAirborne() {
      return !this.dead && this.respawnTimer <= 0 && this.state === 'air' && this.y <= this.baseY - 8;
    }

    canReceiveStatus() {
      return this.isAirborne();
    }

    stun(duration = 3.0) {
      if (!this.canReceiveStatus()) return false;
      this.stunTimer = Math.max(this.stunTimer, duration);
      return true;
    }

    hypnotize(duration = 3.0) {
      if (!this.canReceiveStatus()) return false;
      this.hypnotizedTimer = Math.max(this.hypnotizedTimer, duration);
      return true;
    }

    eliminate(delay = 5.0) {
      eliminateJumpingFish(this, delay, this.baseY + 36);
      this.state = 'submerged';
      this.isDescending = false;
      this.splashEvent = null;
    }

    update(dt) {
      this.animTimer += dt;
      this.splashEvent = null;
      const prevState = this.state;
      const phase = tickJumpingFishCooldownAndStatus(this, dt, this.baseY + 36);
      if (phase === 'waiting_respawn') {
        this.state = 'submerged';
        this.isDescending = false;
        return;
      }
      const airStart = this.cyclePeriod - this.airDuration;
      if (phase === 'respawned') {
        this.timer = Math.max(0, airStart + 0.05);
        this.state = 'air';
        this.isDescending = false;
        this.splashEvent = 'out';
        const frac = Math.max(0, Math.min(1, (this.timer - airStart) / this.airDuration));
        this.y = this.baseY - Math.sin(frac * Math.PI) * this.jumpHeight;
        return;
      }
      if (phase === 'disabled') {
        return;
      }
      if (phase === 'status_ended') {
        const midTimer = airStart + this.airDuration * 0.55;
        if (this.timer < midTimer) this.timer = midTimer;
      }
      this.timer = (this.timer + dt) % this.cyclePeriod;
      const warnStart = airStart - this.warningDuration;
      if (this.timer >= airStart) {
        this.state = 'air';
        if (prevState !== 'air') this.splashEvent = 'out';
        const frac = Math.max(0, Math.min(1, (this.timer - airStart) / this.airDuration));
        this.isDescending = frac >= 0.5;
        const lift = Math.sin(frac * Math.PI) * this.jumpHeight;
        this.y = this.baseY - lift;
      } else if (this.timer >= warnStart) {
        this.state = 'warning';
        this.isDescending = false;
        this.y = this.baseY + 26;
        if (prevState === 'air') this.splashEvent = 'in';
      } else {
        this.state = 'submerged';
        this.isDescending = false;
        this.y = this.baseY + 36;
        if (prevState === 'air') this.splashEvent = 'in';
      }
    }

    getDamageBox() {
      if (!this.isAirborne()) return null;
      return { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 8 };
    }

    draw(ctx, sprites, cameraX) {
      if (this.dead || this.respawnTimer > 0) return;
      if (sprites && typeof sprites.drawPacificJumpHazardHD === 'function') {
        sprites.drawPacificJumpHazardHD(ctx, this, cameraX, this.animTimer);
      }
      if (this.state === 'air') {
        drawEnemyStatusOverlay(
          ctx,
          this.x - cameraX,
          this.y,
          this.w,
          this.stunTimer,
          this.hypnotizedTimer,
          this.animTimer,
          0,
          this.h
        );
      }
    }
  }

  global.Entities = {
    CondorEnemy,
    PelicanDropProjectile,
    PortPelicanEnemy,
    PacificJumpHazard,
    PumaEnemy,
    SalineSpitProjectile,
    VicunaEnemy,
    'VicuñaEnemy': VicunaEnemy,
    PortDogEnemy,
    RapaNuiWarrior,
    GuasoEnemy,
    GuasaEnemy,
    SwarmFrigate,
    SeaLionEnemy,
    KingCrabEnemy,
    FuegianFoxEnemy,
    SwarmCormorant,
    FernetBottleProjectile,
    FernetPuddleHazard,
    BelgranoPirateEnemy,
    SerranoBurroEnemy,
    MiniUfoEnemy,
    ELECTRIC_FIELD_RADIUS,
    getLevelSpeedScale,
    getArgentinaAIConfig,
    findSupportingSurfaceSpan,
    getActorSafeBoundsOnSpan,
    computeCompanionFormationTargets,
    applyCompanionFollowEdgeGuard,
    aabbOverlap,
    drawProjectedShadow,
    Player,
    PartnerCompanion,
    TinaCompanion,
    Pigeon,
    Scooter,
    Seagull,
    Hedgehog,
    Boar,
    MadridCatEnemy,
    SelfieTouristEnemy,
    RoyalGuardEnemy,
    PeacockEnemy,
    CrazyCyclistEnemy,
    GreenParakeetEnemy,
    SwarmParakeet,
    ElectricJellyfishEnemy,
    CoastalCrabEnemy,
    TramuntanaGoatEnemy,
    RoyalSeagullEnemy,
    SwarmRoyalSeagull,
    VolcanicGeyser,
    GallotiaLizardEnemy,
    GarajonayFoxEnemy,
    GaudiLizardEnemy,
    CanarianHoopoeEnemy,
    SwarmCanarianHoopoe,
    BlindCrabEnemy,
    ClotheslineRope,
    SubwayVent,
    SinkingContainer,
    OverheadHazard,
    TrapitoEnemy,
    MotochorroEnemy,
    BarrabravaEnemy,
    NewspaperProjectile,
    CanillitaEnemy,
    FatPigeonEnemy,
    HorneroEnemy,
    HorneroNest,
    BeerBottleProjectile,
    RockeroEnemy,
    ColdBlastProjectile,
    PenguinEnemy,
    PalometaEnemy,
    BouncyDrum,
    SwarmMosquito,
    FallingPlatform,
    ZigZagPigeon,
    SwarmPigeon,
    MovingPlatform,
    Collectible,
    HiddenBlock,
    PlantProjectile,
    CalamaresProjectile,
    ParticleSystem
  };
})(window);
