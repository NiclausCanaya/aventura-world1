/**
 * ============================================================================
 * AVENTURA EN BARCELONA HD - Motor Gráfico Vectorial / 3D Shaded (64/128-Bit)
 * ============================================================================
 * Reconstrucción gráfica completa en Alta Definición (sin pixel art plano ni
 * bloques básicos): utiliza curvas Bézier, gradientes radiales/lineales de
 * volumen 3D, trazos entintados suavizados y carga de renders 3D de Blender.
 */
(function (global) {
  'use strict';

  if (
    typeof CanvasRenderingContext2D !== 'undefined' &&
    !CanvasRenderingContext2D.prototype.roundRect
  ) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const radius = Math.min(typeof r === 'number' ? r : 6, w * 0.5, h * 0.5);
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      this.closePath();
      return this;
    };
  }

  class SpriteBank {
    constructor() {
      this.cache = {};
      this.blenderImages = {};
      this.tryLoadBlenderAssets();
    }

    tryLoadBlenderAssets() {
      if (window.location && window.location.protocol === 'file:') return;
      const names = ['coin_3d', 'burger_3d', 'smoothie_3d'];
      names.forEach((name) => {
        const img = new Image();
        img.onload = () => {
          this.blenderImages[name] = img;
        };
        img.onerror = () => {};
        img.src = `assets/blender/${name}.png`;
      });
    }

    /**
     * Dibuja un trazo cerrado con relleno de gradiente/color y contorno entintado HD
     */
    static fillAndStroke(ctx, fillStyle, strokeStyle = '#0f172a', lineWidth = 2.2) {
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle && lineWidth > 0) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    fillAndStroke(ctx, fillStyle, strokeStyle = '#0f172a', lineWidth = 2.2) {
      SpriteBank.fillAndStroke(ctx, fillStyle, strokeStyle, lineWidth);
    }

    /**
     * Ícono cómic de exclamación '!' sobre un enemigo asustado por el ladrido de La Tina
     */
    static drawScaredAlertIcon(ctx, x, y, time = 0) {
      const pop = 1 + Math.sin(time * 18) * 0.1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pop, pop);
      ctx.beginPath();
      ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#facc15', '#0f172a', 2.0);
      ctx.fillStyle = '#dc2626';
      ctx.font = '900 15px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 0.5);
      ctx.restore();
    }

    /**
     * Bocadillo de texto cómic reutilizable (con cola apuntando hacia abajo)
     */
    static drawComicSpeechBubble(ctx, x, y, text, opts = {}) {
      const font = opts.font || 'bold 10px "Segoe UI", sans-serif';
      const fill = opts.fill || 'rgba(255, 255, 255, 0.97)';
      const stroke = opts.stroke || '#0f172a';
      const textColor = opts.textColor || '#0f172a';
      ctx.save();
      if (typeof ctx.getTransform === 'function') {
        const tr = ctx.getTransform();
        if (tr && tr.a === 1 && tr.b === 0 && tr.c === 0 && tr.d === 1) {
          ctx.translate(Math.round(tr.e) - tr.e, Math.round(tr.f) - tr.f);
        }
      }
      ctx.font = font;
      let bw = Math.ceil(Math.max(44, ctx.measureText(text).width + 16));
      if (bw % 2 !== 0) bw += 1;
      const bh = Math.round(opts.height || 19);
      const cx = Math.round(x);
      const bx = Math.round(cx - bw * 0.5);
      const by = Math.round(y);
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      // Triángulo indicador inferior
      ctx.beginPath();
      ctx.moveTo(cx - 4, by + bh - 0.5);
      ctx.lineTo(cx + 4, by + bh - 0.5);
      ctx.lineTo(cx, by + bh + 5);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 4, by + bh);
      ctx.lineTo(cx, by + bh + 5);
      ctx.lineTo(cx + 4, by + bh);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, cx, by + bh - 5);
      ctx.restore();
    }

    static drawCapsule(ctx, x1, y1, x2, y2, radius, fillStyle, strokeStyle = '#0f172a', lw = 2.2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 0.001;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.arc(0, 0, radius, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(len, 0, radius, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, fillStyle, strokeStyle, lw);
      ctx.restore();
    }

    drawCapsule(ctx, x1, y1, x2, y2, radius, fillStyle, strokeStyle = '#0f172a', lw = 2.2) {
      SpriteBank.drawCapsule(ctx, x1, y1, x2, y2, radius, fillStyle, strokeStyle, lw);
    }

    // ========================================================================
    // RENDERIZADO HD DE PERSONAJES (NICO Y ANDREA) CON ARTICULACIÓN FLUIDA
    // ========================================================================
    drawHangingArmHD(ctx, sx, sy, elbowX, elbowY, handX, handY, skinCol, withRedBracelet = false) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(elbowX, elbowY, handX, handY);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 8.8;
      ctx.stroke();
      ctx.strokeStyle = skinCol;
      ctx.lineWidth = 4.8;
      ctx.stroke();

      if (withRedBracelet) {
        const wx = elbowX + (handX - elbowX) * 0.78;
        const wy = elbowY + (handY - elbowY) * 0.78;
        ctx.beginPath();
        ctx.arc(wx, wy, 3.4, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#e11d48', '#881337', 1.3);
      }

      // Mano cerrada sujetando firmemente la soga/cable por encima de la cabeza
      ctx.beginPath();
      ctx.arc(handX, handY, 2.9, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, skinCol, '#0f172a', 1.7);
      ctx.restore();
    }

    drawCharacterHD(ctx, charKey, x, y, facing, animState, animTimer, hasWings, wingFlapTimer) {
      ctx.save();
      ctx.translate(x + 12, y + 22);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      const isHangMoving = animState === 'hang_move';
      const isHangingPose =
        isHangMoving ||
        animState === 'hang' ||
        animState === 'isHanging' ||
        animState === 'onCable' ||
        animState === 'onZipline' ||
        animState === 'onVine';

      // Calcular ángulos de articulación según estado de animación a 60 FPS
      let legSwing = 0;
      let armSwing = 0;
      let bodyBob = 0;
      let torsoTilt = 0;
      let backHandX = 0;
      let backHandY = -32;
      let frontHandX = 6;
      let frontHandY = -32;
      let hangPhase = 0;

      if (isHangingPose) {
        hangPhase = animTimer * 13;
        const swingCycle = isHangMoving ? Math.sin(hangPhase) : Math.sin(animTimer * 2.6);
        const stepSwing = isHangMoving ? Math.sin(hangPhase) : 0;
        const frontLift = isHangMoving ? Math.max(0, Math.cos(hangPhase)) * 2.8 : 0;
        const backLift = isHangMoving ? Math.max(0, -Math.cos(hangPhase)) * 2.8 : 0;
        // Manos alineadas a localY = -32 (y + 22 - 32 = y - 10) para coincidir con el cable sin tocar la cabeza
        backHandX = -3 - stepSwing * 4.5;
        backHandY = -32 + backLift;
        frontHandX = 6 + stepSwing * 4.5;
        frontHandY = -32 + frontLift;
        legSwing = isHangMoving ? swingCycle * 0.34 - 0.12 : swingCycle * 0.12;
        bodyBob = 0;
        torsoTilt = isHangMoving ? -0.045 + swingCycle * 0.04 : swingCycle * 0.025;
      } else if (animState === 'run' || animState === 'entering_metro') {
        const phase = animTimer * 13;
        legSwing = Math.sin(phase) * 0.65;
        armSwing = -Math.sin(phase) * 0.6;
        bodyBob = Math.abs(Math.cos(phase)) * -3.2;
        torsoTilt = animState === 'entering_metro' ? 0.16 : 0.12;
      } else if (animState === 'jump') {
        legSwing = 0.45;
        armSwing = -0.85;
        bodyBob = -2;
        torsoTilt = -0.06;
      } else if (animState === 'fall') {
        legSwing = -0.25;
        armSwing = -1.1;
        torsoTilt = 0.08;
      } else if (animState === 'groundPound') {
        legSwing = 0.7;
        armSwing = 0.9;
        torsoTilt = 0.28;
      } else if (animState === 'dead') {
        legSwing = Math.sin(animTimer * 18) * 0.45;
        armSwing = -2.55;
        bodyBob = 0;
        torsoTilt = -0.18;
      } else if (animState === 'pose') {
        legSwing = 0.15;
        armSwing = -1.45;
        bodyBob = -1.5;
        torsoTilt = -0.1;
      } else if (animState === 'crouch') {
        legSwing = 0.55;
        armSwing = 0.35;
        bodyBob = 7.5;
        torsoTilt = 0.16;
      } else {
        // Respiración suave en idle
        bodyBob = Math.sin(animTimer * 3.5) * 1.2;
        armSwing = Math.sin(animTimer * 3.5) * 0.05;
      }

      ctx.translate(0, bodyBob);
      if (animState === 'crouch') {
        ctx.scale(1.06, 0.82);
      }
      ctx.rotate(torsoTilt);

      // 1. ALAS DE ÁNGEL HD (si el Power-Up está activo)
      if (hasWings) {
        this.drawAngelWingsAttached(ctx, animTimer, wingFlapTimer);
      }

      const isNico = charKey === 'nico';
      const skinColor = isNico ? '#f6d0b1' : '#ecc19c';
      const skinShadow = isNico ? '#dfa882' : '#d29b72';
      const jeansGrad = ctx.createLinearGradient(0, 4, 0, 22);
      if (isNico) {
        jeansGrad.addColorStop(0, '#374151');
        jeansGrad.addColorStop(1, '#1f2937');
      } else {
        jeansGrad.addColorStop(0, '#2563eb');
        jeansGrad.addColorStop(1, '#1d4ed8');
      }

      // 2. Brazo trasero
      if (isHangingPose) {
        const backElbowX = -9.5 - (isHangMoving ? Math.sin(hangPhase) * 2.0 : 0);
        this.drawHangingArmHD(ctx, -2.5, -7, backElbowX, -19, backHandX, backHandY, skinShadow, false);
      } else {
        const backArmX = -3 + Math.sin(-armSwing) * 8;
        const backArmY = 3 + Math.cos(-armSwing) * 9;
        SpriteBank.drawCapsule(ctx, -2, -5, backArmX, backArmY, 3.2, skinShadow);
      }

      // 3. Pierna trasera y zapatilla
      const backLegSwing = isHangingPose && !isHangMoving ? legSwing - 0.08 : -legSwing;
      const frontLegSwing = isHangingPose && !isHangMoving ? legSwing + 0.08 : legSwing;
      const backLegX = -3 + Math.sin(backLegSwing) * 9;
      const backLegY = 18 + Math.cos(backLegSwing) * 3;
      SpriteBank.drawCapsule(ctx, -2, 6, backLegX, backLegY, 3.8, jeansGrad);
      this.drawSneakerHD(ctx, backLegX, backLegY + 2, isNico);

      // 4. Pelo trasero largo (Melena de Andrea o pelo largo de Nico)
      this.drawBackHairHD(ctx, isNico, animTimer, animState);

      // 5. Torso / Camiseta con sombreado 3D
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.quadraticCurveTo(0, -10, 7, -8);
      ctx.quadraticCurveTo(9, 0, 7, 8);
      ctx.quadraticCurveTo(0, 10, -7, 8);
      ctx.quadraticCurveTo(-9, 0, -7, -8);
      ctx.closePath();

      const shirtGrad = ctx.createLinearGradient(-8, -9, 8, 9);
      if (isNico) {
        // Camiseta bordó/granate de Nico
        shirtGrad.addColorStop(0, '#be123c');
        shirtGrad.addColorStop(0.55, '#881337');
        shirtGrad.addColorStop(1, '#4c0519');
      } else {
        // Top negro escote redondo de Andrea
        shirtGrad.addColorStop(0, '#334155');
        shirtGrad.addColorStop(0.4, '#1e293b');
        shirtGrad.addColorStop(1, '#0f172a');
      }
      SpriteBank.fillAndStroke(ctx, shirtGrad, '#0f172a', 2.2);

      // Escote redondo cálido de Andrea
      if (!isNico) {
        ctx.beginPath();
        ctx.arc(1, -7, 4.2, 0, Math.PI);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, skinColor, '#0f172a', 1.4);
      }

      // 6. Pierna delantera y zapatilla
      const frontLegX = 2 + Math.sin(frontLegSwing) * 9;
      const frontLegY = 18 + Math.cos(frontLegSwing) * 3;
      SpriteBank.drawCapsule(ctx, 2, 6, frontLegX, frontLegY, 4.0, jeansGrad);
      this.drawSneakerHD(ctx, frontLegX, frontLegY + 2, isNico);

      // 7. Cabeza y Rostro HD
      ctx.save();
      ctx.translate(0, -16);

      // Óvalo de la cabeza con gradiente 3D
      const headGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 11);
      headGrad.addColorStop(0, skinColor);
      headGrad.addColorStop(1, skinShadow);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8.8, 9.6, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, headGrad, '#0f172a', 2.2);

      // Barba y bigote esculpidos de Nico / Labios cálidos de Andrea
      if (isNico) {
        const beardGrad = ctx.createLinearGradient(0, 1, 0, 10);
        beardGrad.addColorStop(0, '#5c3a21');
        beardGrad.addColorStop(1, '#2b180d');
        ctx.beginPath();
        ctx.moveTo(-7.8, 1);
        ctx.quadraticCurveTo(-8, 9.5, 0, 10.5);
        ctx.quadraticCurveTo(8.5, 9.5, 8.2, 1);
        ctx.quadraticCurveTo(4, 4.5, 0, 4.2);
        ctx.quadraticCurveTo(-4, 4.5, -7.8, 1);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, beardGrad, '#0f172a', 1.8);

        // Bigote
        ctx.beginPath();
        ctx.ellipse(2.5, 3.2, 4.2, 1.6, 0.08, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#3d2516', '#0f172a', 1.2);
      } else {
        // Sonrisa y labios rosados/terracota de Andrea
        ctx.beginPath();
        ctx.arc(2.8, 3.5, 2.8, 0.1, Math.PI - 0.1);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#e11d48', '#881337', 1.2);
      }

      if (animState === 'dead') {
        // Expresión de sorpresa/derrota: ceja levantada, ojo muy abierto y boca en 'O'
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(1.2, -5.0);
        ctx.lineTo(5.6, -4.4);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(3.6, -1.2, 2.3, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(3.8, -1.2, 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.ellipse(3.0, 3.8, 2.3, 2.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      } else {
        // Ojos expresivos con brillo corneal
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(3.6, -1.2, 1.6, 2.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4.1, -1.8, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cejas
      ctx.strokeStyle = isNico ? '#3b2314' : '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(1.5, -4.2);
      ctx.quadraticCurveTo(3.8, -5.2, 5.8, -3.8);
      ctx.stroke();

      // Cabello frontal y superior con curvas suaves
      this.drawFrontHairHD(ctx, isNico);
      ctx.restore();

      // 8. Brazo delantero (+ Pulsera roja de Andrea o puño sísmico de Nico)
      if (isHangingPose) {
        const frontElbowX = 11.5 + (isHangMoving ? Math.sin(hangPhase) * 2.5 : 0);
        this.drawHangingArmHD(ctx, 2.5, -7, frontElbowX, -19, frontHandX, frontHandY, skinColor, !isNico);
      } else {
        const frontArmX = 3 + Math.sin(armSwing) * 9;
        const frontArmY = 3 + Math.cos(armSwing) * 9;
        SpriteBank.drawCapsule(ctx, 2, -5, frontArmX, frontArmY, 3.4, skinColor);

        if (!isNico) {
          // Pulsera roja característica de Andrea en su muñeca
          ctx.beginPath();
          ctx.arc(frontArmX, frontArmY - 1, 3.6, 0, Math.PI * 2);
          SpriteBank.fillAndStroke(ctx, '#e11d48', '#881337', 1.4);
        } else if (animState === 'groundPound') {
          // Aura dorada en el puño de Nico durante el Terremoto
          const fistGlow = ctx.createRadialGradient(frontArmX, frontArmY, 1, frontArmX, frontArmY, 12);
          fistGlow.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
          fistGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = fistGlow;
          ctx.beginPath();
          ctx.arc(frontArmX, frontArmY, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    drawBackHairHD(ctx, isNico, animTimer, animState) {
      const wave = Math.sin(animTimer * (animState === 'run' ? 14 : 4)) * 3;
      const hairGrad = ctx.createLinearGradient(-12, -24, -10, 6);
      if (isNico) {
        hairGrad.addColorStop(0, '#3b2417');
        hairGrad.addColorStop(1, '#1c110b');
      } else {
        hairGrad.addColorStop(0, '#1e293b');
        hairGrad.addColorStop(0.5, '#0f172a');
        hairGrad.addColorStop(1, '#020617');
      }

      ctx.beginPath();
      ctx.moveTo(-6, -22);
      ctx.bezierCurveTo(-15, -14, -16 + wave, -2, -11 + wave, isNico ? 2 : 8);
      ctx.bezierCurveTo(-5 + wave * 0.5, isNico ? 4 : 10, 2, -2, 4, -18);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, hairGrad, '#0f172a', 2.0);
    }

    drawFrontHairHD(ctx, isNico) {
      const hairGrad = ctx.createLinearGradient(-9, -12, 8, 4);
      if (isNico) {
        hairGrad.addColorStop(0, '#4a2e1e');
        hairGrad.addColorStop(1, '#24150e');
      } else {
        hairGrad.addColorStop(0, '#334155');
        hairGrad.addColorStop(1, '#090d16');
      }

      ctx.beginPath();
      ctx.moveTo(-9, -2);
      ctx.bezierCurveTo(-10, -11, 2, -13, 8, -5);
      ctx.quadraticCurveTo(4, -7, -2, -5);
      ctx.quadraticCurveTo(-5, 0, -8, 4);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, hairGrad, '#0f172a', 1.8);
    }

    drawSneakerHD(ctx, x, y, isNico) {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.ellipse(2, 0, 5.5, 3.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(
        ctx,
        isNico ? '#2563eb' : '#f8fafc',
        '#0f172a',
        1.8
      );
      // Detalle lateral de la zapatilla
      ctx.strokeStyle = isNico ? '#ffffff' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-1, -1);
      ctx.lineTo(4, 1);
      ctx.stroke();
      ctx.restore();
    }

    drawAngelWingsAttached(ctx, animTimer, wingFlapTimer) {
      ctx.save();
      const flapSpeed = wingFlapTimer > 0 ? 28 : 7;
      const flapAngle = Math.sin(animTimer * flapSpeed) * (wingFlapTimer > 0 ? 0.55 : 0.22);
      ctx.translate(-5, -8);
      ctx.rotate(flapAngle);

      const wingGrad = ctx.createLinearGradient(-26, -18, 0, 8);
      wingGrad.addColorStop(0, '#ffffff');
      wingGrad.addColorStop(0.65, '#bae6fd');
      wingGrad.addColorStop(1, '#fbbf24');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-14, -22, -28, -14, -24, -2);
      ctx.bezierCurveTo(-20, 4, -12, 8, 0, 4);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, wingGrad, '#0284c7', 1.8);

      // Plumas internas
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.quadraticCurveTo(-16, -8, -18, 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // ========================================================================
    // LA TINA HD: Perra negra estilizada con hocico canoso, pecho blanco,
    // orejas caídas, animación de galope y Gruñido Feroz (Tecla G)
    // ========================================================================
    drawTinaHD(ctx, x, y, facing, isRunning, onGround, animTimer, growlTimer, hasTargetItem, poseOpts) {
      const pose = poseOpts && poseOpts.pose ? poseOpts.pose : 'normal';
      const climbProgress = poseOpts && typeof poseOpts.climbProgress === 'number' ? poseOpts.climbProgress : 0;

      ctx.save();
      ctx.translate(x + 17, y + 14);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      let bodyBounce;
      let legStride = 0;
      if (pose === 'swim') {
        bodyBounce = Math.sin(animTimer * 7.5) * 1.4;
        legStride = Math.sin(animTimer * 18) * 5.2;
      } else if (pose === 'ledge_grab') {
        bodyBounce = Math.sin(animTimer * 14) * 0.6;
      } else if (pose === 'climb') {
        bodyBounce = -climbProgress * 1.5;
      } else {
        const runPhase = isRunning ? animTimer * 16 : animTimer * 4;
        legStride = isRunning ? Math.sin(runPhase) * 6.5 : 0;
        bodyBounce = isRunning ? Math.abs(Math.cos(runPhase)) * -2.2 : Math.sin(runPhase) * 0.8;
      }
      ctx.translate(0, bodyBounce);

      if (pose === 'swim') {
        // Leve inclinación hacia arriba manteniendo el hocico fuera del agua
        ctx.rotate(-0.14);
      } else if (pose === 'ledge_grab') {
        // Cuelga vertical/diagonalmente con las patas traseras sueltas
        ctx.rotate(-0.56);
      } else if (pose === 'climb') {
        ctx.rotate(-0.52 * (1 - climbProgress));
      }

      const furGrad = ctx.createLinearGradient(-12, -8, 12, 10);
      furGrad.addColorStop(0, '#334155');
      furGrad.addColorStop(0.45, '#1e293b');
      furGrad.addColorStop(1, '#090d16');

      // 1. Cola larga curvada y alegre
      const tailWag =
        pose === 'ledge_grab'
          ? Math.sin(animTimer * 22) * 0.25
          : Math.sin(animTimer * (growlTimer > 0 ? 26 : 12)) * 0.35;
      ctx.save();
      ctx.translate(-11, -2);
      ctx.rotate(tailWag);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-9, -6, -12, -13);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();

      // 2. Patas traseras y delanteras articuladas según postura
      if (pose === 'swim') {
        // Estilo "perrito" chapoteando bajo la superficie del agua
        const backKick = Math.sin(animTimer * 19) * 4.2;
        const frontKick = Math.cos(animTimer * 19) * 4.5;
        SpriteBank.drawCapsule(ctx, -8, 3, -12 - backKick, 11 + Math.abs(backKick) * 0.25, 2.3, '#0f172a');
        SpriteBank.drawCapsule(ctx, 6, 3, 10 + frontKick, 10 - Math.min(0, frontKick) * 0.4, 2.3, '#0f172a');
        SpriteBank.drawCapsule(ctx, -6, 3, -9 + backKick, 11, 2.5, furGrad);
        SpriteBank.drawCapsule(ctx, 8, 2, 12 - frontKick, 9, 2.5, furGrad);
      } else if (pose === 'ledge_grab') {
        // Patas traseras colgando / pataleando suavemente y patas delanteras enganchadas arriba
        const dangle = Math.sin(animTimer * 22) * 2.4;
        SpriteBank.drawCapsule(ctx, -9, 3, -13 - dangle, 13, 2.3, '#0f172a');
        SpriteBank.drawCapsule(ctx, -7, 3, -9 + dangle, 14, 2.5, furGrad);
        // Patas delanteras enganchadas firmemente en el borde de la cornisa
        SpriteBank.drawCapsule(ctx, 6, -1, 14, -7, 2.5, '#0f172a');
        SpriteBank.drawCapsule(ctx, 8, 0, 16, -5, 2.7, furGrad);
      } else if (pose === 'climb') {
        const pull = climbProgress;
        SpriteBank.drawCapsule(ctx, -9, 3, -11 + pull * 5, 13 - pull * 2, 2.3, '#0f172a');
        SpriteBank.drawCapsule(ctx, -7, 3, -8 + pull * 5, 13 - pull * 2, 2.5, furGrad);
        SpriteBank.drawCapsule(ctx, 6, 1, 14 - pull * 6, -5 + pull * 15, 2.5, '#0f172a');
        SpriteBank.drawCapsule(ctx, 8, 2, 15 - pull * 6, -3 + pull * 14, 2.7, furGrad);
      } else {
        SpriteBank.drawCapsule(ctx, -8, 3, -9 - legStride, 12, 2.4, '#0f172a');
        SpriteBank.drawCapsule(ctx, 6, 3, 7 + legStride, 12, 2.4, '#0f172a');
        SpriteBank.drawCapsule(ctx, -6, 3, -6 + legStride, 12, 2.6, furGrad);
        SpriteBank.drawCapsule(ctx, 8, 3, 8 - legStride, 12, 2.6, furGrad);
      }

      // 3. Cuerpo esbelto de la Tina con manchita blanca en el pecho
      ctx.beginPath();
      ctx.ellipse(0, 0, 12.5, 6.2, -0.06, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furGrad, '#090d16', 2.0);

      // Manchita blanca en el pecho (como en la foto de referencia)
      ctx.beginPath();
      ctx.ellipse(9.5, 1.5, 3.2, 4.2, 0.3, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#090d16', 1.2);

      // 4. Cabeza, orejas caídas y hocico canoso (gris/blanco)
      ctx.save();
      ctx.translate(11, -6);
      if (growlTimer > 0) {
        ctx.rotate(-0.18);
      } else if (pose === 'ledge_grab') {
        ctx.rotate(0.28);
      } else if (pose === 'climb') {
        ctx.rotate(0.24 * (1 - climbProgress));
      }

      // Cráneo negro
      ctx.beginPath();
      ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furGrad, '#090d16', 2.0);

      // Hocico canoso (gris plateado y blanco como en la foto)
      const muzzleGrad = ctx.createLinearGradient(1, -2, 9, 4);
      muzzleGrad.addColorStop(0, '#cbd5e1');
      muzzleGrad.addColorStop(1, '#f8fafc');
      ctx.beginPath();
      ctx.ellipse(5.2, 1.2, 4.8, 3.4, 0.08, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, muzzleGrad, '#090d16', 1.6);

      // Boca abierta feroz si está gruñendo
      if (growlTimer > 0) {
        ctx.beginPath();
        ctx.arc(6.2, 2.8, 2.6, 0, Math.PI);
        SpriteBank.fillAndStroke(ctx, '#ef4444', '#090d16', 1.2);
      }

      // Trufa negra y ojo brillante con ceja canosa
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(9.2, 0.2, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(2.2, -3.2, 1.8, 0.9, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(2.4, -1.4, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2.8, -1.8, 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Oreja caída negra
      ctx.beginPath();
      ctx.ellipse(-2.8, 0.5, 2.6, 4.8, 0.35, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.6);

      ctx.restore();

      // Superficie de agua animada cubriendo las patas si está nadando en el mapa
      if (pose === 'swim') {
        ctx.save();
        ctx.rotate(0.14); // Mantiene la línea del mar horizontal sobre el cuerpo inclinado
        const waveShift = Math.sin(animTimer * 12) * 1.4;
        ctx.fillStyle = 'rgba(3, 105, 161, 0.58)';
        ctx.beginPath();
        ctx.moveTo(-16, 2 + waveShift);
        ctx.quadraticCurveTo(-8, 0 - waveShift, 0, 2 + waveShift);
        ctx.quadraticCurveTo(8, 4 - waveShift, 16, 2 + waveShift);
        ctx.lineTo(16, 13);
        ctx.lineTo(-16, 13);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-16, 2 + waveShift);
        ctx.quadraticCurveTo(-8, 0 - waveShift, 0, 2 + waveShift);
        ctx.quadraticCurveTo(8, 4 - waveShift, 16, 2 + waveShift);
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.92)';
        ctx.lineWidth = 1.9;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

      // Indicador sutil si la IA autónoma de la Tina detectó un ítem cercano
      if (hasTargetItem && growlTimer <= 0 && pose !== 'swim') {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillText('!', 12, -16);
      }

      ctx.restore();
    }

    // ========================================================================
    // COLECCIONABLES Y POWER-UPS HD (Moneda, Hamburguesa, Batido,
    // Power-up Eléctrico y Alas de Ángel)
    // ========================================================================
    drawCollectibleHD(ctx, type, x, y, timer) {
      const cx = x + 13;
      const cy = y + 13;
      ctx.save();

      if (type === 'coin') {
        const scaleX = Math.max(0.22, Math.abs(Math.cos(timer * 2.5)));
        ctx.translate(cx, cy);
        ctx.scale(scaleX, 1);

        const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.55, '#f59e0b');
        grad.addColorStop(1, '#b45309');

        ctx.beginPath();
        ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, grad, '#451a03', 2.0);

        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else if (type === 'burger') {
        ctx.translate(cx, cy);
        // Pan inferior
        ctx.beginPath();
        ctx.ellipse(0, 6, 10.5, 3.8, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#d97706', '#451a03', 1.8);
        // Carne
        ctx.beginPath();
        ctx.ellipse(0, 2.5, 11, 3.5, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#5c2d16', '#271206', 1.8);
        // Queso derretido y lechuga
        ctx.beginPath();
        ctx.ellipse(0, 0, 11.2, 2.8, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fbbf24', '#78350f', 1.4);
        ctx.beginPath();
        ctx.ellipse(0, -2, 11.5, 2.6, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#22c55e', '#14532d', 1.4);
        // Pan superior abombado
        const bunGrad = ctx.createRadialGradient(-3, -6, 1, 0, -4, 11);
        bunGrad.addColorStop(0, '#fcd34d');
        bunGrad.addColorStop(1, '#d97706');
        ctx.beginPath();
        ctx.arc(0, -2.5, 10.2, Math.PI, 0);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, bunGrad, '#451a03', 1.8);
      } else if (type === 'pizza') {
        // PORCIÓN DE PIZZA PORTEÑA (Muzzarella con aceituna y borde dorado)
        ctx.translate(cx, cy);
        ctx.rotate(-0.18);
        // Triángulo de muzzarella y salsa
        const cheeseGrad = ctx.createLinearGradient(-9, -9, 9, 10);
        cheeseGrad.addColorStop(0, '#fef08a');
        cheeseGrad.addColorStop(0.7, '#facc15');
        cheeseGrad.addColorStop(1, '#eab308');
        ctx.beginPath();
        ctx.moveTo(-10.5, -7);
        ctx.lineTo(10.5, -7);
        ctx.lineTo(0, 11.5);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, cheeseGrad, '#78350f', 1.8);

        // Salsa de tomate asomando bajo el borde
        ctx.beginPath();
        ctx.moveTo(-9, -6.5);
        ctx.lineTo(9, -6.5);
        ctx.lineTo(7.4, -3.5);
        ctx.lineTo(-7.4, -3.5);
        ctx.closePath();
        ctx.fillStyle = '#dc2626';
        ctx.fill();

        // Borde / Masa dorada superior ("al molde")
        ctx.beginPath();
        ctx.roundRect(-11.5, -10.2, 23, 4.6, 2.2);
        SpriteBank.fillAndStroke(ctx, '#d97706', '#451a03', 1.7);

        // Gota de queso derretido lateral
        ctx.beginPath();
        ctx.ellipse(-4.5, 2.2, 1.8, 2.8, 0.25, 0, Math.PI * 2);
        ctx.fillStyle = '#fef9c3';
        ctx.fill();

        // Aceituna verde porteña + puntitos de orégano
        ctx.beginPath();
        ctx.arc(1.8, -0.5, 2.4, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#16a34a', '#14532d', 1.1);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(1.8, -0.5, 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#166534';
        ctx.fillRect(-3.8, -2.2, 1.4, 1.4);
        ctx.fillRect(-1.2, 4.2, 1.3, 1.3);
      } else if (type === 'empanada') {
        // EMPANADA CRIOLLA ARGENTINA (Masa dorada al horno + repulgue trenzado)
        ctx.translate(cx, cy);
        ctx.rotate(-0.12);
        const empGrad = ctx.createRadialGradient(-2, -2, 1.5, 0, 2, 13);
        empGrad.addColorStop(0, '#fde68a');
        empGrad.addColorStop(0.55, '#f59e0b');
        empGrad.addColorStop(1, '#b45309');

        // Cuerpo de media luna
        ctx.beginPath();
        ctx.moveTo(-11.5, 2.5);
        ctx.quadraticCurveTo(0, -10.5, 11.5, 2.5);
        ctx.quadraticCurveTo(0, 10.5, -11.5, 2.5);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, empGrad, '#451a03', 1.9);

        // Tostado dorado en la panza
        ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, -1.2, 5.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Repulgue clásico trenzado en el borde inferior
        for (let r = -8.5; r <= 8.5; r += 3.4) {
          const ry = 5.4 - Math.abs(r) * 0.28;
          ctx.beginPath();
          ctx.ellipse(r, ry, 2.1, 1.4, r * 0.08, 0, Math.PI * 2);
          SpriteBank.fillAndStroke(ctx, '#fbbf24', '#451a03', 1.2);
        }
      } else if (type === 'smoothie') {
        ctx.translate(cx, cy);
        // Vaso de frutos rojos con menta y pajita blanca
        const cupGrad = ctx.createLinearGradient(-7, -6, 7, 10);
        cupGrad.addColorStop(0, '#fb7185');
        cupGrad.addColorStop(0.5, '#e11d48');
        cupGrad.addColorStop(1, '#881337');

        ctx.beginPath();
        ctx.moveTo(-7.5, -5);
        ctx.lineTo(7.5, -5);
        ctx.lineTo(5.5, 10);
        ctx.lineTo(-5.5, 10);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, cupGrad, '#0f172a', 1.8);

        // Pajita blanca
        SpriteBank.drawCapsule(ctx, -2, -5, -4, -12, 1.8, '#ffffff', '#0f172a', 1.4);
        // Hojita de menta
        ctx.beginPath();
        ctx.ellipse(3.5, -6.5, 4.2, 2.2, -0.35, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#22c55e', '#14532d', 1.4);
      } else if (type === 'electric_shield') {
        // POWER-UP ELÉCTRICO: Orbe de plasma y rayo dorado/cian
        ctx.translate(cx, cy);
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
        glow.addColorStop(0.6, 'rgba(250, 204, 21, 0.55)');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#0284c7', '#0f172a', 2.0);

        // Símbolo de Rayo central
        ctx.beginPath();
        ctx.moveTo(2, -9);
        ctx.lineTo(-5, 1);
        ctx.lineTo(0, 1);
        ctx.lineTo(-3, 9);
        ctx.lineTo(6, -1);
        ctx.lineTo(1, -1);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#fde047', '#713f12', 1.5);
      } else if (type === 'angel_wings') {
        // ALAS DE ÁNGEL (Triple Salto): Par de alas celestiales brillantes
        ctx.translate(cx, cy);
        const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 19);
        halo.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
        halo.addColorStop(0.6, 'rgba(186, 230, 253, 0.5)');
        halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.fill();

        [-1, 1].forEach((side) => {
          ctx.save();
          ctx.scale(side, 1);
          ctx.beginPath();
          ctx.moveTo(1, 3);
          ctx.bezierCurveTo(6, -10, 15, -9, 13, 0);
          ctx.bezierCurveTo(11, 6, 6, 8, 1, 5);
          ctx.closePath();
          SpriteBank.fillAndStroke(ctx, '#ffffff', '#0284c7', 1.8);
          ctx.restore();
        });

        // Aureola dorada superior
        ctx.beginPath();
        ctx.ellipse(0, -9, 6.5, 2.2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else if (type === 'plant' || type === 'calamares') {
        // POWER-UP BOTÁNICO: ORQUÍDEA CON MACETA DE TERRACOTA (Disparo Rectilíneo y Diagonal 45° con Tecla J)
        ctx.translate(cx, cy);
        const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
        aura.addColorStop(0, 'rgba(244, 114, 182, 0.95)');
        aura.addColorStop(0.55, 'rgba(219, 39, 119, 0.50)');
        aura.addColorStop(1, 'rgba(34, 197, 94, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        this.drawOrchidPotGraphic(ctx, 1.0);
      } else if (type === 'extra_life_heart' || type === '1up_heart') {
        // ÍTEM ESPECIAL DE 1 VIDA EXTRA (Corazón luminoso + halo dorado + insignia 1UP)
        ctx.translate(cx, cy);
        const pulse = 1 + Math.sin(timer * 2.2) * 0.08;
        ctx.scale(pulse, pulse);

        const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
        aura.addColorStop(0, 'rgba(254, 240, 138, 0.96)');
        aura.addColorStop(0.45, 'rgba(251, 113, 133, 0.65)');
        aura.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        const heartGrad = ctx.createLinearGradient(0, -11, 0, 11);
        heartGrad.addColorStop(0, '#fda4af');
        heartGrad.addColorStop(0.45, '#f43f5e');
        heartGrad.addColorStop(1, '#be123c');
        ctx.beginPath();
        ctx.moveTo(0, 10.5);
        ctx.bezierCurveTo(-13.5, 2.5, -13.5, -9.5, -6, -9.5);
        ctx.bezierCurveTo(-1.8, -9.5, 0, -5.8, 0, -4.4);
        ctx.bezierCurveTo(0, -5.8, 1.8, -9.5, 6, -9.5);
        ctx.bezierCurveTo(13.5, -9.5, 13.5, 2.5, 0, 10.5);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, heartGrad, '#fbbf24', 2.0);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Brillo especular sobre el lóbulo izquierdo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.beginPath();
        ctx.ellipse(-4.5, -4.8, 2.4, 1.4, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Etiqueta nítida '1UP' sobre el corazón
        ctx.font = '900 7.5px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#090d16';
        ctx.strokeText('1UP', 0, 0.8);
        ctx.fillStyle = '#fef08a';
        ctx.fillText('1UP', 0, 0.8);
      } else if (type === 'golden_bone' || type === '1up_bone' || type === 'tina_golden_bone') {
        // HUESITO DORADO DE LA TINA (1-UP): Brillo dorado animado + destellos ✨ + contorno definido
        ctx.translate(cx, cy);

        const glowPulse = 0.78 + 0.22 * Math.sin(timer * 1.9);
        const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
        halo.addColorStop(0, `rgba(254, 249, 195, ${0.95 * glowPulse})`);
        halo.addColorStop(0.55, `rgba(250, 204, 21, ${0.52 * glowPulse})`);
        halo.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.rotate(-0.24 + Math.sin(timer * 1.35) * 0.09);

        const boneGrad = ctx.createLinearGradient(-12, -8, 12, 8);
        boneGrad.addColorStop(0, '#fef9c3');
        boneGrad.addColorStop(0.42, '#fde047');
        boneGrad.addColorStop(0.78, '#f59e0b');
        boneGrad.addColorStop(1, '#d97706');

        // Silueta continua de hueso con contorno definido + perillas redondeadas
        ctx.beginPath();
        ctx.moveTo(-6.2, -3.1);
        ctx.arc(-8.8, -3.4, 3.6, 0.25, Math.PI * 1.55, true);
        ctx.arc(-8.8, 3.4, 3.6, Math.PI * 0.45, -0.25, true);
        ctx.lineTo(6.2, 3.1);
        ctx.arc(8.8, 3.4, 3.6, Math.PI + 0.25, Math.PI * 0.45, true);
        ctx.arc(8.8, -3.4, 3.6, -Math.PI * 0.45, Math.PI - 0.25, true);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, boneGrad, '#451a03', 2.0);

        // Reflejo especular dorado superior
        ctx.beginPath();
        ctx.roundRect(-6.5, -2.1, 13, 1.9, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.fill();
        ctx.restore();

        // Destellos animados en estrella de 4 puntas (✨)
        const sparkles = [
          { sx: -11.5, sy: -9.5, phase: 0.0, size: 4.3, col: '#fef9c3' },
          { sx: 11.8, sy: -8.0, phase: 2.1, size: 3.8, col: '#fde047' },
          { sx: 9.2, sy: 9.6, phase: 4.2, size: 3.4, col: '#ffffff' }
        ];
        sparkles.forEach((sp) => {
          const s = (0.35 + 0.65 * Math.abs(Math.sin(timer * 2.1 + sp.phase))) * sp.size;
          ctx.save();
          ctx.translate(sp.sx, sp.sy);
          ctx.fillStyle = sp.col;
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.28, -s * 0.28);
          ctx.lineTo(s, 0);
          ctx.lineTo(s * 0.28, s * 0.28);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.28, s * 0.28);
          ctx.lineTo(-s, 0);
          ctx.lineTo(-s * 0.28, -s * 0.28);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
      }

      ctx.restore();
    }

    /**
     * Caja de madera de expedición / encomienda (reemplaza por completo el bloque '?').
     * Activa: tablas de madera cálida, cantoneras/remaches oscuros y sello postal de brújula central.
     * Inerte (hit/empty/used): madera oscura gastada con marca vacía sin emblema ni reacción.
     */
    drawHiddenBlockHD(ctx, block, cameraX) {
      if (!ctx || !block || !block.revealed) return;
      const w = block.w || 32;
      const h = block.h || 32;
      const x = block.x - cameraX;
      const y = block.y + (block.bumpOffset || 0);
      if (x + w < -30 || x > 990) return;

      const isSpent = Boolean(block.hit || block.empty || block.used);
      const isVisibleCrate = block.style === 'question' || block.visible;

      ctx.save();

      // 1. Cuerpo principal de madera de expedición (cálida cuando está activa, oscura y gastada al quedar inerte)
      const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
      if (!isSpent) {
        woodGrad.addColorStop(0, '#d99b52');
        woodGrad.addColorStop(0.45, '#ad6a2c');
        woodGrad.addColorStop(1, '#6f3d16');
      } else {
        woodGrad.addColorStop(0, '#5a5047');
        woodGrad.addColorStop(0.5, '#3e3731');
        woodGrad.addColorStop(1, '#241f1c');
      }
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 3);
      SpriteBank.fillAndStroke(ctx, woodGrad, isSpent ? '#14110f' : '#3b1d08', 1.9);

      // 2. Tablas horizontales de madera con ranuras y veta sutil
      const grooveColor = isSpent ? 'rgba(12, 10, 8, 0.72)' : 'rgba(62, 30, 8, 0.75)';
      const plankHighlight = isSpent ? 'rgba(255, 255, 255, 0.05)' : 'rgba(254, 243, 199, 0.24)';
      [0.34, 0.67].forEach((ratio) => {
        const sy = Math.round(y + h * ratio);
        ctx.strokeStyle = grooveColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 2, sy);
        ctx.lineTo(x + w - 2, sy);
        ctx.stroke();

        ctx.strokeStyle = plankHighlight;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + 2.5, sy + 1.1);
        ctx.lineTo(x + w - 2.5, sy + 1.1);
        ctx.stroke();
      });

      // Veta sutil en caja gastada para acentuar el aspecto usado
      if (isSpent) {
        ctx.strokeStyle = 'rgba(12, 10, 8, 0.45)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 6);
        ctx.lineTo(x + 12, y + 10);
        ctx.moveTo(x + w - 11, y + h - 9);
        ctx.lineTo(x + w - 7, y + h - 5);
        ctx.stroke();
      }

      // 3. Esquinas metálicas oscuras reforzadas con remaches
      const bracketSize = 7;
      const bracketFill = isSpent ? '#27272a' : '#334155';
      const bracketStroke = isSpent ? '#09090b' : '#0f172a';
      const rivetFill = isSpent ? '#18181b' : '#cbd5e1';
      const corners = [
        [x + 1, y + 1, 1, 1],
        [x + w - 1, y + 1, -1, 1],
        [x + 1, y + h - 1, 1, -1],
        [x + w - 1, y + h - 1, -1, -1]
      ];
      corners.forEach(([cx0, cy0, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx0, cy0);
        ctx.lineTo(cx0 + dx * bracketSize, cy0);
        ctx.lineTo(cx0 + dx * bracketSize, cy0 + dy * 3.2);
        ctx.lineTo(cx0 + dx * 3.2, cy0 + dy * 3.2);
        ctx.lineTo(cx0 + dx * 3.2, cy0 + dy * bracketSize);
        ctx.lineTo(cx0, cy0 + dy * bracketSize);
        ctx.closePath();
        ctx.fillStyle = bracketFill;
        ctx.fill();
        ctx.strokeStyle = bracketStroke;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx0 + dx * 2.6, cy0 + dy * 2.6, 1.15, 0, Math.PI * 2);
        ctx.fillStyle = rivetFill;
        ctx.fill();
      });

      // 4. Emblema central de expedición / encomienda (cero signo '?')
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      if (isVisibleCrate) {
        if (!isSpent) {
          // Sello postal / medallón grabado con brújula de 4 puntas
          const sealGrad = ctx.createRadialGradient(cx - 1.5, cy - 1.5, 1, cx, cy, 8);
          sealGrad.addColorStop(0, '#fef9c3');
          sealGrad.addColorStop(0.65, '#f59e0b');
          sealGrad.addColorStop(1, '#b45309');

          ctx.beginPath();
          ctx.arc(cx, cy, 7.6, 0, Math.PI * 2);
          SpriteBank.fillAndStroke(ctx, sealGrad, '#5c280a', 1.2);

          // Anillo interior punteado de timbre postal
          ctx.beginPath();
          ctx.arc(cx, cy, 5.8, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(92, 40, 10, 0.55)';
          ctx.lineWidth = 0.75;
          ctx.stroke();

          // Rosa de los vientos / brújula central grabada
          ctx.beginPath();
          const outerR = 5.1;
          const innerR = 1.55;
          for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const ang = (i * Math.PI) / 4 - Math.PI / 2;
            const px = cx + Math.cos(ang) * r;
            const py = cy + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = '#451a03';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx, cy, 1.15, 0, Math.PI * 2);
          ctx.fillStyle = '#fef9c3';
          ctx.fill();
        } else {
          // Marca de caja de encomienda vacía / usada (hueco oscuro sin emblema activo)
          ctx.beginPath();
          ctx.arc(cx, cy, 5.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(18, 14, 11, 0.42)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(140, 125, 110, 0.35)';
          ctx.lineWidth = 0.9;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(156, 140, 124, 0.45)';
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(cx - 2.6, cy - 2.6);
          ctx.lineTo(cx + 2.6, cy + 2.6);
          ctx.moveTo(cx + 2.6, cy - 2.6);
          ctx.lineTo(cx - 2.6, cy + 2.6);
          ctx.stroke();
        }
      } else {
        // Caja secreta 1UP revelada: plantilla tenue grabada sobre madera gastada
        ctx.fillStyle = 'rgba(254, 243, 199, 0.5)';
        ctx.font = 'bold 9.5px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1UP', cx, cy + 0.5);
      }

      ctx.restore();
    }

    /**
     * Geometría vectorial HD de la Orquídea con su flor (pétalos rosados/fucsias)
     * plantada en una pequeña maceta de terracota.
     */
    drawOrchidPotGraphic(ctx, scale = 1.0) {
      ctx.save();
      ctx.scale(scale, scale);

      // 1. Pequeña maceta de terracota (cuerpo trapezoidal + reborde superior)
      const potGrad = ctx.createLinearGradient(-6, 3, 6, 12);
      potGrad.addColorStop(0, '#fb923c');
      potGrad.addColorStop(0.5, '#ea580c');
      potGrad.addColorStop(1, '#9a3412');

      ctx.beginPath();
      ctx.moveTo(-6.2, 4.0);
      ctx.lineTo(6.2, 4.0);
      ctx.lineTo(4.4, 11.5);
      ctx.lineTo(-4.4, 11.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, potGrad, '#431407', 1.6);

      // Tierra oscura en el borde de la maceta
      ctx.beginPath();
      ctx.ellipse(0, 3.6, 6.2, 1.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#3f2010';
      ctx.fill();

      // Reborde superior de terracota
      ctx.beginPath();
      ctx.roundRect(-7.2, 1.8, 14.4, 2.8, 1.3);
      SpriteBank.fillAndStroke(ctx, '#f97316', '#431407', 1.5);

      // 2. Hojas basales verdes carnosas de la orquídea saliendo de la maceta
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.scale(side, 1);
        ctx.beginPath();
        ctx.moveTo(0, 2.2);
        ctx.quadraticCurveTo(6.5, -1.2, 8.8, 1.8);
        ctx.quadraticCurveTo(5.0, 4.2, 0, 2.8);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#22c55e', '#052e16', 1.3);
        ctx.restore();
      });

      // 3. Tallo verde esmeralda sosteniendo la flor de orquídea
      SpriteBank.drawCapsule(ctx, 0, 2.0, 0, -4.5, 1.5, '#16a34a', '#052e16', 1.3);

      // 4. Flor de Orquídea (sépalo dorsal, sépalos inferiores y pétalos laterales rosados/fucsias)
      ctx.save();
      ctx.translate(0, -5.2);

      // Sépalos exteriores rosados
      const sepalAngles = [-Math.PI * 0.5, Math.PI * 0.22, Math.PI * 0.78];
      sepalAngles.forEach((ang) => {
        ctx.save();
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(4.2, 0, 4.4, 2.1, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#f472b6', '#831843', 1.3);
        ctx.restore();
      });

      // Dos pétalos laterales grandes y redondeados (rosado/fucsia vibrante)
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.scale(side, 1);
        const petalGrad = ctx.createRadialGradient(2, -1, 0.5, 4.5, -0.5, 5.5);
        petalGrad.addColorStop(0, '#fbcfe8');
        petalGrad.addColorStop(0.55, '#ec4899');
        petalGrad.addColorStop(1, '#be185d');

        ctx.beginPath();
        ctx.ellipse(4.6, -0.6, 4.8, 3.3, -0.18, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, petalGrad, '#831843', 1.4);
        ctx.restore();
      });

      // Labelo central característico de la orquídea (fucsia intenso / magenta con centro dorado)
      ctx.beginPath();
      ctx.ellipse(0, 1.6, 2.9, 3.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#db2777', '#500724', 1.4);

      // Columna y garganta amarilla/dorada en el corazón de la orquídea
      ctx.beginPath();
      ctx.arc(0, 0.2, 1.7, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fde047', '#831843', 1.1);

      ctx.restore();
      ctx.restore();
    }

    // ========================================================================
    // ENEMIGOS HD: PALOMA DE BARCELONA (Camina o huye volando) Y PATINETE
    // ========================================================================
    drawPigeonHD(ctx, x, y, facing, animTimer, isDisabled, isScaredFlying) {
      ctx.save();
      ctx.translate(x + 14, y + 12);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      const bob = isDisabled ? 0 : Math.sin(animTimer * 10) * 1.6;
      ctx.translate(0, bob);

      // Cuerpo redondeado de la paloma con gradiente gris azulado
      const bodyGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 11);
      bodyGrad.addColorStop(0, '#cbd5e1');
      bodyGrad.addColorStop(0.65, '#64748b');
      bodyGrad.addColorStop(1, '#334155');

      ctx.beginPath();
      ctx.ellipse(-1, 2, 9.5, 6.2, -0.1, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#0f172a', 2.0);

      // Ala (bate rápido si huye volando por el Gruñido de la Tina)
      ctx.save();
      if (isScaredFlying) {
        ctx.rotate(Math.sin(animTimer * 35) * 0.85);
      }
      ctx.beginPath();
      ctx.ellipse(-2, 1, 6.5, 4.2, 0.1, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#475569', '#0f172a', 1.6);
      ctx.restore();

      // Cuello iridiscente turquesa/violeta y cabeza
      ctx.beginPath();
      ctx.arc(6.5, -3.5, 4.8, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#14b8a6', '#0f172a', 1.8);

      // Pico naranja
      ctx.beginPath();
      ctx.moveTo(10.5, -4.5);
      ctx.lineTo(14.5, -3.0);
      ctx.lineTo(10.5, -1.8);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f97316', '#0f172a', 1.4);

      // Ojo
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7.8, -4.2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Patitas
      const step = isDisabled ? 0 : Math.sin(animTimer * 12) * 2.5;
      SpriteBank.drawCapsule(ctx, -2, 7, -2 + step, 11, 1.1, '#f97316', '#0f172a', 1.2);
      SpriteBank.drawCapsule(ctx, 2, 7, 2 - step, 11, 1.1, '#f97316', '#0f172a', 1.2);

      ctx.restore();
    }

    // ========================================================================
    // NIVEL 1+: GAVIOTA / PÁJARO VOLADOR VERTICAL (Flap HD + Pico Ganchudo)
    // ========================================================================
    drawSeagullHD(ctx, x, y, facing, animTimer, isDisabled, isScaredFlying) {
      ctx.save();
      ctx.translate(x + 16, y + 12);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      const flapSpeed = isScaredFlying ? 32 : isDisabled ? 2 : 11;
      const wingAngle = Math.sin(animTimer * flapSpeed) * 0.65;

      // Ala trasera
      ctx.save();
      ctx.rotate(-wingAngle * 0.7);
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.quadraticCurveTo(-12, -14, -18, -6);
      ctx.quadraticCurveTo(-10, -2, -2, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#cbd5e1', '#0f172a', 1.6);
      ctx.restore();

      // Cuerpo aerodinámico blanco/gris perla
      const bodyGrad = ctx.createLinearGradient(-12, -6, 12, 8);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.7, '#e2e8f0');
      bodyGrad.addColorStop(1, '#94a3b8');
      ctx.beginPath();
      ctx.ellipse(0, 1, 11, 5.5, -0.08, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#0f172a', 1.9);

      // Cola con puntas negras
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-16, -3);
      ctx.lineTo(-15, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#0f172a', 1.4);

      // Cabeza y pico amarillo con punta roja de gaviota mediterránea
      ctx.beginPath();
      ctx.arc(9, -2.5, 4.8, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#0f172a', 1.8);

      ctx.beginPath();
      ctx.moveTo(13, -4);
      ctx.quadraticCurveTo(19, -3.5, 18.5, -0.5);
      ctx.lineTo(13, -1);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#fbbf24', '#0f172a', 1.4);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(10.5, -3.2, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Ala delantera articulada con punta negra
      ctx.save();
      ctx.rotate(wingAngle);
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.bezierCurveTo(-6, -16, 8, -16, 11, -5);
      ctx.quadraticCurveTo(4, -2, -1, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#0f172a', 1.8);
      ctx.restore();

      ctx.restore();
    }

    // ========================================================================
    // NIVEL 2+: PUERCOESPÍN / ERIZO URBANO (Inmune a salto y a la Tina)
    // ========================================================================
    drawHedgehogHD(ctx, x, y, facing, animTimer, isDisabled) {
      ctx.save();
      ctx.translate(x + 17, y + 13);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      const step = isDisabled ? 0 : Math.sin(animTimer * 14) * 2.2;

      // Patitas cortas
      SpriteBank.drawCapsule(ctx, -8, 6, -8 + step, 10, 2.0, '#78350f', '#0f172a', 1.4);
      SpriteBank.drawCapsule(ctx, 5, 6, 5 - step, 10, 2.0, '#78350f', '#0f172a', 1.4);

      // Corona de PÚAS AFILADAS en el dorso (Brillan en rojo/ámbar si están activas)
      const quillCount = 7;
      for (let i = 0; i < quillCount; i++) {
        const frac = i / (quillCount - 1);
        const angle = -Math.PI * 0.88 + frac * Math.PI * 0.72;
        const pulse = isDisabled ? 0.75 : 1.0 + Math.sin(animTimer * 10 + i) * 0.08;
        const qLen = 14.5 * pulse;
        const bx = Math.cos(angle) * 6 - 2;
        const by = Math.sin(angle) * 5 + 1;
        const tx = Math.cos(angle - 0.08) * (6 + qLen) - 2;
        const ty = Math.sin(angle - 0.08) * (5 + qLen) + 1;

        ctx.beginPath();
        ctx.moveTo(bx - 2.5, by);
        ctx.lineTo(tx, ty);
        ctx.lineTo(bx + 2.5, by);
        ctx.closePath();
        const quillFill = isDisabled ? '#94a3b8' : i % 2 === 0 ? '#ef4444' : '#f59e0b';
        SpriteBank.fillAndStroke(ctx, quillFill, '#090d16', 1.5);
      }

      // Cuerpo blindado marrón oscuro
      const bodyGrad = ctx.createRadialGradient(-2, 0, 2, -2, 2, 12);
      bodyGrad.addColorStop(0, '#92400e');
      bodyGrad.addColorStop(0.65, '#451a03');
      bodyGrad.addColorStop(1, '#1c1917');
      ctx.beginPath();
      ctx.ellipse(-1, 2, 11.5, 7.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#090d16', 2.0);

      // Hocico puntiagudo y ceño fruncido
      ctx.beginPath();
      ctx.moveTo(7, -2);
      ctx.quadraticCurveTo(16, 1, 15, 4.5);
      ctx.quadraticCurveTo(10, 7, 6, 6);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#d6d3d1', '#090d16', 1.7);

      // Nariz negra y ojo agresivo
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(15, 2.5, 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDisabled ? '#f43f5e' : '#fde047';
      ctx.beginPath();
      ctx.arc(9.5, 0.5, 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ========================================================================
    // BARCELONA: JABALÍ SALVAJE (Hitbox 46x30, colmillos hacia arriba — ¡No saltar encima!)
    // ========================================================================
    static get BOAR_HITBOX() {
      return { w: 46, h: 30 };
    }

    drawBoarHD(ctx, x, y, facing, animTimer, isDisabled, hitFlash = false, hp = 2) {
      const hb = SpriteBank.BOAR_HITBOX;
      ctx.save();
      ctx.translate(x + hb.w * 0.5, y + hb.h * 0.5 + 1);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }
      const flashOn = hitFlash && Math.floor(animTimer * 36) % 2 === 0;

      const trot = isDisabled ? 0 : Math.sin(animTimer * 16) * 3.0;

      // Rabito enruladito trasero
      ctx.beginPath();
      ctx.moveTo(-18, -2);
      ctx.quadraticCurveTo(-23, -7, -21, -10);
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Cuatro patas robustas con pezuñas oscuras
      SpriteBank.drawCapsule(ctx, -11, 6, -12 - trot, 13, 2.5, '#451a03', '#090d16', 1.6);
      SpriteBank.drawCapsule(ctx, -5, 6, -5 + trot, 13, 2.5, '#5c2d16', '#090d16', 1.6);
      SpriteBank.drawCapsule(ctx, 6, 6, 6 - trot, 13, 2.5, '#451a03', '#090d16', 1.6);
      SpriteBank.drawCapsule(ctx, 12, 6, 12 + trot, 13, 2.5, '#5c2d16', '#090d16', 1.6);

      // Cerdas dorsales erizadas (advierten peligro superior junto a los colmillos)
      for (let i = 0; i < 6; i++) {
        const bx = -13 + i * 4.5;
        const by = -9 - Math.sin((i / 5) * Math.PI) * 2.5;
        ctx.beginPath();
        ctx.moveTo(bx - 2.2, by + 3);
        ctx.lineTo(bx - 1.0, by - 4.2);
        ctx.lineTo(bx + 2.2, by + 2.5);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, isDisabled ? '#64748b' : '#292524', '#090d16', 1.3);
      }

      // Cuerpo macizo y pelaje hirsuto de jabalí salvaje
      const coatGrad = ctx.createRadialGradient(-2, -2, 3, 0, 1, 18);
      coatGrad.addColorStop(0, '#78350f');
      coatGrad.addColorStop(0.6, '#451a03');
      coatGrad.addColorStop(1, '#1c1917');
      ctx.beginPath();
      ctx.ellipse(-2, 0.5, 16.5, 10.2, -0.05, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, coatGrad, '#090d16', 2.2);

      // Oreja puntiaguda peluda
      ctx.beginPath();
      ctx.moveTo(6, -6);
      ctx.lineTo(3, -13);
      ctx.lineTo(10, -8);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#5c2d16', '#090d16', 1.6);

      // Cabeza y trompa alargada de jabalí
      ctx.beginPath();
      ctx.moveTo(9, -6.5);
      ctx.quadraticCurveTo(19, -4, 21.5, 2.5);
      ctx.quadraticCurveTo(17, 7.5, 8, 6.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#5c2d16', '#090d16', 2.0);

      // Disco nasal rosado
      ctx.beginPath();
      ctx.ellipse(21, 2.2, 2.6, 3.4, -0.15, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f9a8d4', '#451a03', 1.5);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(20.6, 0.8, 1.2, 1.2);
      ctx.fillRect(20.6, 2.8, 1.2, 1.2);

      // COLMILLOS CURVOS APUNTANDO HACIA ARRIBA (marca visual de peligro al saltar)
      const tuskFill = isDisabled ? '#cbd5e1' : '#fef9c3';
      const tuskStroke = isDisabled ? '#475569' : '#b45309';
      ctx.beginPath();
      ctx.moveTo(14.5, 5.2);
      ctx.quadraticCurveTo(22.5, 4.5, 21.8, -8.5);
      ctx.quadraticCurveTo(18.5, -1.5, 16.2, 3.0);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, tuskFill, tuskStroke, 1.6);

      ctx.beginPath();
      ctx.moveTo(11.8, 5.6);
      ctx.quadraticCurveTo(17.5, 4.2, 16.4, -5.5);
      ctx.quadraticCurveTo(14.2, -0.5, 13.0, 3.2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, tuskFill, tuskStroke, 1.4);

      // Ojo salvaje y ceño furioso
      ctx.fillStyle = isDisabled ? '#94a3b8' : '#ef4444';
      ctx.beginPath();
      ctx.arc(12.2, -1.4, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(12.7, -1.8, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(9.5, -4.4);
      ctx.lineTo(14.8, -2.8);
      ctx.stroke();

      if (hp === 1 && !isDisabled) {
        // Indicador sutil de rabia / primer impacto recibido
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-11, -11, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (flashOn) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.ellipse(2, -1, 19, 11.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ========================================================================
    // NIVEL 3+: PALOMA EN ZIG-ZAG Y PALOMA TELEDIRIGIDA DEL ENJAMBRE (NIVEL 4)
    // ========================================================================
    drawZigZagPigeonHD(ctx, x, y, facing, animTimer, isDisabled, isScaredFlying, isSwarm = false) {
      ctx.save();
      ctx.translate(x + 14, y + 12);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      // Estela aerodinámica
      if (!isDisabled && !isScaredFlying) {
        ctx.strokeStyle = isSwarm ? 'rgba(239, 68, 68, 0.55)' : 'rgba(168, 85, 247, 0.45)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-11, -2);
        ctx.lineTo(-22, -4);
        ctx.moveTo(-11, 3);
        ctx.lineTo(-20, 5);
        ctx.stroke();
      }

      const bodyGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 11);
      if (isSwarm) {
        bodyGrad.addColorStop(0, '#f87171');
        bodyGrad.addColorStop(0.6, '#dc2626');
        bodyGrad.addColorStop(1, '#7f1d1d');
      } else {
        bodyGrad.addColorStop(0, '#e9d5ff');
        bodyGrad.addColorStop(0.6, '#9333ea');
        bodyGrad.addColorStop(1, '#3b0764');
      }

      ctx.beginPath();
      ctx.ellipse(-1, 1, 9.8, 5.8, -0.12, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#090d16', 2.0);

      // Alas batiendo a alta frecuencia
      const wingAngle = Math.sin(animTimer * (isSwarm ? 34 : 24)) * 0.75;
      ctx.save();
      ctx.rotate(wingAngle);
      ctx.beginPath();
      ctx.ellipse(-1, -1, 7.2, 4.0, 0.15, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, isSwarm ? '#fbbf24' : '#38bdf8', '#090d16', 1.6);
      ctx.restore();

      // Cabeza y pico
      ctx.beginPath();
      ctx.arc(7, -3, 4.6, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, isSwarm ? '#991b1b' : '#fbbf24', '#090d16', 1.8);

      ctx.beginPath();
      ctx.moveTo(11, -4);
      ctx.lineTo(15.5, -2.5);
      ctx.lineTo(11, -1);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f97316', '#090d16', 1.4);

      // Ojo brillante (rojo intenso en el enjambre)
      ctx.fillStyle = isSwarm ? '#fef08a' : '#090d16';
      ctx.beginPath();
      ctx.arc(8.2, -3.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ========================================================================
    // MADRID: GATO CALLEJERO (reemplaza a las gaviotas en Madrid / Emboscador)
    // Soporta: Patrulla, Emboscada agazapada/picada, y Salto Defensivo con Zarpazo
    // ========================================================================
    drawMadridCatHD(
      ctx,
      x,
      y,
      facing,
      animTimer,
      isDisabled,
      isAmbush = false,
      ambushState = 'patrol',
      vy = 0,
      onGround = true
    ) {
      ctx.save();
      ctx.translate(x + 17, y + 12);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      const isPerched = isAmbush && ambushState === 'perched';
      const isDiving = isAmbush && ambushState === 'diving';
      const isLeaping = ambushState === 'leaping';
      const isAttackLeap = ambushState === 'attack_leap';
      const isCrouchUp = ambushState === 'crouch_up';
      const isCrouchingWindup = isCrouchUp || ambushState === 'crouch_down' || ambushState === 'attack_crouch';
      const isClimbJump = ambushState === 'climbing_jump';
      const isDropJump = ambushState === 'drop_jump';
      const isFalling = !onGround && !isClimbJump && !isLeaping && !isAttackLeap && !isDropJump && !isDiving && vy > 40;

      if (isCrouchingWindup) {
        // Anticipación breve agachada (telegraph de salto vertical o ataque frontal)
        if (ambushState === 'attack_crouch') {
          ctx.translate(Math.sin(animTimer * 48) * 1.1, 3.6);
          ctx.scale(1.16, 0.74);
        } else {
          ctx.translate(0, 3.2);
          ctx.scale(1.12, 0.78);
        }
      } else if (isClimbJump) {
        // Pose estirada de salto felino siguiendo el arco parabólico
        const climbTilt = vy <= 0 ? -0.34 : 0.22;
        ctx.rotate(climbTilt);
        ctx.scale(1.14, 0.90);
      } else if (isDropJump) {
        ctx.rotate(vy <= 0 ? -0.10 : 0.26);
        ctx.scale(1.08, 0.94);
      } else if (isAttackLeap) {
        ctx.rotate(Math.max(-0.26, Math.min(0.38, vy * 0.0008)));
        ctx.scale(1.16, 0.88);
      } else if (isDiving) {
        ctx.rotate(Math.PI * 0.25); // Inclinación en picada vertical
      } else if (isLeaping) {
        ctx.rotate(-Math.PI * 0.24); // Salto defensivo hacia arriba al acecho aéreo
      } else if (isFalling) {
        ctx.rotate(0.20); // Caída libre natural por gravedad fuera de la viga
      }

      const walk = isDisabled || isPerched || isCrouchingWindup || !onGround ? 0 : Math.sin(animTimer * 13) * 2.4;

      // Cola erguida y curva
      const tailSway = isDisabled ? 0 : Math.sin(animTimer * 5) * 3;
      ctx.beginPath();
      ctx.moveTo(-11, 1);
      ctx.quadraticCurveTo(-19, -4 + tailSway, -15, -13 + tailSway);
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Patas / Garras extendidas según fase del salto
      if (isClimbJump) {
        // Patas delanteras alcanzando hacia arriba y traseras extendidas en impulso
        SpriteBank.drawCapsule(ctx, 5, 1, 16, -3, 2.2, '#d97706', '#090d16', 1.3);
        SpriteBank.drawCapsule(ctx, -6, 3, -15, 10, 2.2, '#d97706', '#090d16', 1.3);
      } else if (isCrouchingWindup) {
        // Patas comprimidas sobre el suelo listas para despegar
        SpriteBank.drawCapsule(ctx, -6, 4, -8, 9, 2.3, '#d97706', '#090d16', 1.3);
        SpriteBank.drawCapsule(ctx, 6, 4, 7, 9, 2.3, '#d97706', '#090d16', 1.3);
      } else if (isLeaping || isAttackLeap) {
        // Garras delanteras estiradas al frente listas para el zarpazo
        SpriteBank.drawCapsule(ctx, 4, 2, 18, 5, 2.5, '#d97706', '#090d16', 1.4);
        SpriteBank.drawCapsule(ctx, 4, -3, 17, -5, 2.5, '#d97706', '#090d16', 1.4);
        // Patas traseras recogidas
        SpriteBank.drawCapsule(ctx, -8, 4, -10, 11, 2.2, '#d97706', '#090d16', 1.3);

        // Estela de zarpazo aéreo (Slash) en arco amarillo/dorado
        ctx.save();
        ctx.strokeStyle = isAttackLeap ? '#fb923c' : '#fde047';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(14, 0, 14, -0.6, 0.6);
        ctx.stroke();
        ctx.restore();
      } else if (isDiving || isDropJump || isFalling) {
        // Garras extendidas en caída hacia abajo
        SpriteBank.drawCapsule(ctx, -6, 3, -8, 12, 2.2, '#d97706', '#090d16', 1.3);
        SpriteBank.drawCapsule(ctx, 7, 3, 9, 12, 2.2, '#d97706', '#090d16', 1.3);
      } else if (isPerched) {
        // Agazapado en cornisa
        SpriteBank.drawCapsule(ctx, -7, 4, -8, 8, 2.2, '#d97706', '#090d16', 1.3);
        SpriteBank.drawCapsule(ctx, 6, 4, 7, 8, 2.2, '#d97706', '#090d16', 1.3);
      } else {
        SpriteBank.drawCapsule(ctx, -7, 4, -7 - walk, 9.5, 1.9, '#d97706', '#090d16', 1.3);
        SpriteBank.drawCapsule(ctx, 6, 4, 6 + walk, 9.5, 1.9, '#d97706', '#090d16', 1.3);
      }

      // Cuerpo atigrado naranja
      const bodyGrad = ctx.createLinearGradient(-11, -6, 11, 8);
      bodyGrad.addColorStop(0, '#fbbf24');
      bodyGrad.addColorStop(0.55, '#f59e0b');
      bodyGrad.addColorStop(1, '#b45309');
      ctx.beginPath();
      ctx.ellipse(-1, 1, 11.5, isPerched ? 7.5 : 6.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#090d16', 1.9);

      // Rayas de tigre
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      [-6, -2, 2].forEach((sx) => {
        ctx.moveTo(sx, -4.5);
        ctx.lineTo(sx + 1, -0.5);
      });
      ctx.stroke();

      // Cabeza con orejas puntiagudas
      ctx.beginPath();
      ctx.arc(9, -2.5, 5.6, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fbbf24', '#090d16', 1.9);
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(9 + s * 1.2, -7);
        ctx.lineTo(9 + s * 4.8, -12.5);
        ctx.lineTo(9 + s * 5.8, -5.6);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#f59e0b', '#090d16', 1.4);
      });

      // Ojos (en espiral de hipnosis/aturdido si está deshabilitado, rojos si ataca/salta)
      const isAlertEyes = isDiving || isLeaping || isAttackLeap || isCrouchingWindup || isClimbJump || isDropJump;
      ctx.fillStyle = isDisabled ? '#f43f5e' : (isAlertEyes ? '#ef4444' : '#4ade80');
      ctx.beginPath();
      ctx.ellipse(10.8, -3.6, 1.5, 2.0, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.fillRect(10.4, -4.6, 0.9, 2.0);
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(14.2, -1.6, 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Bigotes
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(13, -1);
      ctx.lineTo(18.5, -2.4);
      ctx.moveTo(13, 0.2);
      ctx.lineTo(18.5, 0.8);
      ctx.stroke();

      ctx.restore();
    }

    // ========================================================================
    // MADRID: TURISTA CON PALO SELFIE (Inmune a pisotón superior por el palo)
    // ========================================================================
    drawSelfieTouristHD(ctx, x, y, facing, animTimer, isDisabled, isWinter = false) {
      ctx.save();
      ctx.translate(x + 16, y + 24);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      const walk = isDisabled ? 0 : Math.sin(animTimer * 10) * 4;

      // 1. Zapatillas deportivas / botas de nieve
      SpriteBank.drawCapsule(ctx, -7, 18, -7 - walk, 22, 3.2, isWinter ? '#334155' : '#f1f5f9', '#090d16', 1.4);
      SpriteBank.drawCapsule(ctx, 6, 18, 6 + walk, 22, 3.2, isWinter ? '#334155' : '#f1f5f9', '#090d16', 1.4);

      // 2. Piernas: pantalones térmicos oscuros (Ushuaia) o bermudas turquesas (Madrid)
      SpriteBank.drawCapsule(ctx, -6, 9, -6 - walk * 0.7, 18, 4.0, isWinter ? '#1e293b' : '#38bdf8', '#090d16', 1.5);
      SpriteBank.drawCapsule(ctx, 6, 9, 6 + walk * 0.7, 18, 4.0, isWinter ? '#1e293b' : '#38bdf8', '#090d16', 1.5);

      // 3. Torso: campera/parka gruesa acolchada o camiseta "I ❤️ MAD"
      const shirtGrad = ctx.createLinearGradient(-10, -8, 10, 10);
      if (isWinter) {
        shirtGrad.addColorStop(0, '#ef4444');
        shirtGrad.addColorStop(1, '#b91c1c');
      } else {
        shirtGrad.addColorStop(0, '#fef08a');
        shirtGrad.addColorStop(1, '#facc15');
      }
      ctx.beginPath();
      ctx.roundRect(isWinter ? -11 : -10, -7, isWinter ? 22 : 20, 18, isWinter ? 5 : 4);
      SpriteBank.fillAndStroke(ctx, shirtGrad, '#090d16', 1.8);

      if (isWinter) {
        // Borde peludo blanco de la parka + cierre frontal + bufanda tejida celeste
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-10, 8, 20, 3);
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(0, 8);
        ctx.stroke();

        // Bufanda invernal celeste/blanca alrededor del cuello
        ctx.beginPath();
        ctx.roundRect(-9, -9, 18, 5.5, 2.5);
        SpriteBank.fillAndStroke(ctx, '#38bdf8', '#090d16', 1.4);
        ctx.beginPath();
        ctx.roundRect(-5, -4, 5, 9, 2);
        SpriteBank.fillAndStroke(ctx, '#0ea5e9', '#090d16', 1.2);
      } else {
        // Corazón rojo estampado en el pecho
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-2, -1, 2.2, 0, Math.PI * 2);
        ctx.arc(2, -1, 2.2, 0, Math.PI * 2);
        ctx.lineTo(0, 4);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Cabeza, gorro de lana / sombrero explorador y gafas de sol
      ctx.beginPath();
      ctx.arc(0, -14, 7.5, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fed7aa', '#090d16', 1.6);

      if (isWinter) {
        // Mejillas rosadas del frío + gorro de lana térmico con pompón blanco
        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.beginPath();
        ctx.arc(3.5, -11.5, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -16, 8, Math.PI, 0);
        SpriteBank.fillAndStroke(ctx, '#0284c7', '#090d16', 1.5);
        ctx.beginPath();
        ctx.roundRect(-8.5, -18, 17, 4.5, 2);
        SpriteBank.fillAndStroke(ctx, '#f8fafc', '#090d16', 1.4);
        ctx.beginPath();
        ctx.arc(0, -25.5, 3.2, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#ffffff', '#090d16', 1.4);
      } else {
        // Sombrero de safari / turista
        ctx.beginPath();
        ctx.ellipse(0, -18, 11, 3.2, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#d97706', '#090d16', 1.5);
        ctx.beginPath();
        ctx.roundRect(-7, -23, 14, 6, 2);
        SpriteBank.fillAndStroke(ctx, '#b45309', '#090d16', 1.5);
      }

      // Gafas de sol negras envolventes (nieve o Madrid)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(1, -16, 7, 4, 1.2);
      ctx.fill();
      // Brillo blanco en cristal
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(2.5, -15);
      ctx.lineTo(5, -13.5);
      ctx.stroke();

      // 5. Brazo (enguantado en invierno) y PALO SELFIE METÁLICO VERTICAL (¡PÚA SUPERIOR!)
      const armBob = isDisabled ? 0 : Math.sin(animTimer * 10) * 1.5;
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(12, -8 + armBob);
      ctx.strokeStyle = isWinter ? '#dc2626' : '#fed7aa';
      ctx.lineWidth = isWinter ? 5.0 : 4.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (isWinter) {
        ctx.beginPath();
        ctx.arc(12, -8 + armBob, 2.8, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.2);
      }

      // Varilla telescópica de acero inoxidable que apunta HACIA ARRIBA (hasta y = -36)
      const stickTipX = 14;
      const stickTipY = -34 + armBob;
      ctx.beginPath();
      ctx.moveTo(12, -8 + armBob);
      ctx.lineTo(stickTipX, stickTipY);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Soporte y Teléfono Móvil en la punta (antena/púa que daña en salto)
      ctx.save();
      ctx.translate(stickTipX, stickTipY);
      ctx.rotate(0.2);
      // Carcasa del teléfono
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -9, 12, 10);
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-6, -9, 12, 10);
      // Pantalla encendida con selfie
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-4.5, -7.5, 9, 7);
      // Flash / Lente destellante
      const flashPulse = (Math.sin(animTimer * 12) + 1) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + flashPulse * 0.6})`;
      ctx.beginPath();
      ctx.arc(3, -5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Estado deshabilitado (aturdido o hipnotizado)
      if (isDisabled) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const spin = animTimer * 8;
        ctx.arc(-8, -26, 4 + Math.sin(spin) * 2, 0, Math.PI * 2);
        ctx.arc(8, -26, 4 + Math.cos(spin) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ========================================================================
    // MADRID: GUARDIA REAL CON ESCUDO Y CASCO (Palacio Real / Madrid)
    // ========================================================================
    drawRoyalGuardHD(ctx, e, x, y, time) {
      // Partículas físicas del casco y escudo saliendo volando tras el 1.er golpe
      if (e.flyingPieces && e.flyingPieces.length) {
        const camOffsetX = x - e.x;
        for (let i = 0; i < e.flyingPieces.length; i++) {
          const pc = e.flyingPieces[i];
          if (pc.life <= 0) continue;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, pc.life * 1.4));
          ctx.translate(pc.x + camOffsetX, pc.y);
          ctx.rotate(pc.angle);
          if (pc.kind === 'helmet') {
            ctx.beginPath();
            ctx.arc(0, 2, 9.5, Math.PI, 0);
            ctx.lineTo(11, 4);
            ctx.lineTo(-11, 4);
            ctx.closePath();
            SpriteBank.fillAndStroke(ctx, '#cbd5e1', '#090d16', 1.7);
            // Penacho blanco/carmesí
            ctx.beginPath();
            ctx.ellipse(-2, -9, 7, 3.2, -0.25, 0, Math.PI * 2);
            SpriteBank.fillAndStroke(ctx, '#f8fafc', '#dc2626', 1.4);
          } else {
            ctx.beginPath();
            ctx.roundRect(-7, -11, 14, 22, 4);
            SpriteBank.fillAndStroke(ctx, '#1d4ed8', '#fbbf24', 2.0);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-3, -4, 6, 6);
          }
          ctx.restore();
        }
      }

      if (e.dead) return;

      ctx.save();
      const facing = e.facing === 'left' ? -1 : 1;
      const disabled = typeof e.isDisabled === 'function' && e.isDisabled();
      const stunnedBreak = e.armorBreakTimer > 0;
      const flashOn = e.hitFlashTimer > 0 && Math.floor(e.hitFlashTimer * 36) % 2 === 0;
      const march = disabled ? 0 : Math.sin(time * 9.5) * 4.2;
      const bob = stunnedBreak ? Math.sin(time * 42) * 1.6 : disabled ? 0 : Math.abs(Math.cos(time * 9.5)) * 1.1;

      ctx.translate(x + (e.w || 34) * 0.5, y + (e.h || 50));
      ctx.scale(facing, 1);

      // 1. Botas negras de gala + pantalón azul marino con galón carmesí
      SpriteBank.drawCapsule(ctx, -5, -18, -6 - march, -2, 3.8, '#1e3a8a', '#090d16', 1.6);
      SpriteBank.drawCapsule(ctx, 5, -18, 6 + march, -2, 3.8, '#1e40af', '#090d16', 1.6);
      ctx.beginPath();
      ctx.roundRect(-10 - march, -6, 9, 6, 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#090d16', 1.4);
      ctx.beginPath();
      ctx.roundRect(1 + march, -6, 9, 6, 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#090d16', 1.4);

      // 2. Casaca de gala madrileña azul real con pechera/botones dorados y bandolera blanca
      const coatGrad = ctx.createLinearGradient(-11, -39, 11, -17);
      coatGrad.addColorStop(0, '#2563eb');
      coatGrad.addColorStop(1, '#1e3a8a');
      ctx.beginPath();
      ctx.roundRect(-11, -38 + bob, 22, 22, 5);
      SpriteBank.fillAndStroke(ctx, coatGrad, '#090d16', 2.0);

      // Cuello carmesí + charreteras doradas
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -38 + bob, 12, 4);
      ctx.beginPath();
      ctx.roundRect(-13, -38 + bob, 6, 4.5, 2);
      ctx.roundRect(7, -38 + bob, 6, 4.5, 2);
      SpriteBank.fillAndStroke(ctx, '#facc15', '#090d16', 1.3);

      // Bandolera cruzada blanca y cinturón con hebilla dorada
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-8, -36 + bob);
      ctx.lineTo(8, -20 + bob);
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-11, -22 + bob, 22, 3.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2.5, -22.5 + bob, 5, 4.5);

      // 3. Cabeza
      ctx.beginPath();
      ctx.arc(0, -43 + bob, 7.6, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fed7aa', '#090d16', 1.7);

      if (e.hasArmor) {
        // Casco metálico plateado con cimera dorada y penacho blanco/carmesí
        const helmGrad = ctx.createLinearGradient(-9, -54, 9, -42);
        helmGrad.addColorStop(0, '#f8fafc');
        helmGrad.addColorStop(0.55, '#cbd5e1');
        helmGrad.addColorStop(1, '#64748b');
        ctx.beginPath();
        ctx.arc(0, -45 + bob, 9.2, Math.PI * 0.98, Math.PI * 2.02);
        ctx.lineTo(10.5, -43 + bob);
        ctx.lineTo(-10.5, -43 + bob);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, helmGrad, '#090d16', 1.7);
        // Visera frontal dorada + penacho emplumado superior
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-1, -55 + bob, 5, 10);
        ctx.beginPath();
        ctx.ellipse(-3, -55 + bob, 7.5, 3.4, -0.18, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#f8fafc', '#090d16', 1.3);
        ctx.beginPath();
        ctx.ellipse(-7, -54 + bob, 4.2, 2.5, -0.35, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#ef4444', '#090d16', 1.2);
      } else {
        // Sin casco: cabello despeinado tras perder la armadura
        ctx.beginPath();
        ctx.moveTo(-7.5, -45 + bob);
        ctx.lineTo(-5, -52 + bob);
        ctx.lineTo(-1, -49 + bob);
        ctx.lineTo(2, -53 + bob);
        ctx.lineTo(6.5, -47 + bob);
        ctx.quadraticCurveTo(0, -48 + bob, -7.5, -45 + bob);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#451a03', '#090d16', 1.4);
      }

      // Ojo / expresión (mareado durante los 0.45s de aturdimiento)
      if (stunnedBreak) {
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(2.2, -45 + bob);
        ctx.lineTo(5.6, -42 + bob);
        ctx.moveTo(5.6, -45 + bob);
        ctx.lineTo(2.2, -42 + bob);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(3.8, -42.5 + bob, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Escudo frontal de gala (Fase 1; baja la guardia si está hipnotizado ♥) vs brazos desprotegidos (Fase 2)
      if (e.hasArmor) {
        ctx.save();
        if (e.hypnotizedTimer > 0) {
          ctx.translate(-2, 10);
          ctx.rotate(0.30);
        }
        const shieldGrad = ctx.createLinearGradient(5, -39, 19, -15);
        shieldGrad.addColorStop(0, '#1d4ed8');
        shieldGrad.addColorStop(0.5, '#1e40af');
        shieldGrad.addColorStop(1, '#991b1b');
        ctx.beginPath();
        ctx.moveTo(6, -38 + bob);
        ctx.lineTo(18, -38 + bob);
        ctx.lineTo(18, -21 + bob);
        ctx.quadraticCurveTo(12, -13 + bob, 6, -21 + bob);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, shieldGrad, '#fbbf24', 2.2);
        // Emblema dorado real en el escudo
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(12, -28 + bob, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(8.5, -35 + bob);
        ctx.lineTo(8.5, -24 + bob);
        ctx.stroke();
        ctx.restore();
      } else {
        SpriteBank.drawCapsule(ctx, -9, -34 + bob, -13, -23 + bob, 3.0, '#1e40af', '#090d16', 1.4);
        SpriteBank.drawCapsule(ctx, 9, -34 + bob, 14, -24 + bob, 3.0, '#2563eb', '#090d16', 1.4);
        ctx.beginPath();
        ctx.arc(14, -23 + bob, 2.8, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fed7aa', '#090d16', 1.2);
      }

      if (flashOn) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
        ctx.beginPath();
        ctx.roundRect(-14, -52, 32, 52, 8);
        ctx.fill();
      }

      ctx.restore();
    }

    // ========================================================================
    // MADRID Y BARCELONA: COTORRA VERDE (Vuelo ondulante / Variante Pecho Gris)
    // ========================================================================
    drawGreenParakeetHD(ctx, x, y, facing, animTimer, isDisabled, isScaredFlying = false, isSwarm = false, variant = 'madrid') {
      const isBcn = variant === 'barcelona';
      ctx.save();
      ctx.translate(x + 14, y + 11);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      if (isScaredFlying) {
        ctx.rotate(-0.4); // Vuelo asustado empinado hacia arriba
      } else if (isSwarm) {
        ctx.rotate(0.25); // Inclinación aerodinámica de caza
      }

      // Aleteo rápido (cotorras tienen frecuencia de aleteo alta)
      const flapFreq = isScaredFlying ? 26 : (isSwarm ? 22 : 16);
      const wingFlap = Math.sin(animTimer * flapFreq) * 11;

      // 1. Cola larga y afilada (esmeralda/azul característica)
      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.lineTo(isBcn ? -27 : -24, 6 + (isScaredFlying ? -4 : 0));
      ctx.lineTo(-7, 4.4);
      ctx.closePath();
      ctx.fillStyle = isBcn ? '#059669' : '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // 2. Ala trasera (visible en aleteo)
      if (wingFlap < 0) {
        ctx.beginPath();
        ctx.moveTo(-1, -3);
        ctx.lineTo(-9, -15 + wingFlap);
        ctx.lineTo(4, -3);
        ctx.fillStyle = isBcn ? '#047857' : '#15803d';
        ctx.fill();
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 3. Cuerpo verde brillante (Madrid: esmeralda-lima / Barcelona: esmeralda con pecho gris claro)
      const bodyGrad = ctx.createLinearGradient(-8, -6, 10, 8);
      bodyGrad.addColorStop(0, isBcn ? '#34d399' : '#4ade80');
      bodyGrad.addColorStop(0.5, isBcn ? '#10b981' : '#22c55e');
      bodyGrad.addColorStop(1, isBcn ? '#059669' : '#16a34a');
      ctx.beginPath();
      ctx.ellipse(0, 1, 10.5, 6.8, 0.15, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#090d16', 1.8);

      // Pecho (Barcelona: gris claro Myiopsitta monachus; Madrid: lima amarillento)
      ctx.fillStyle = isBcn ? '#e2e8f0' : '#bef264';
      ctx.beginPath();
      ctx.ellipse(4.2, 3, 5.4, 4.1, 0, 0, Math.PI * 2);
      ctx.fill();
      if (isBcn) {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(3.6, 4.2, 4.2, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Ala frontal principal
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.quadraticCurveTo(-7, -8 + wingFlap, -14, -4 + wingFlap * 1.3);
      ctx.lineTo(-2, 4);
      ctx.closePath();
      const wingGrad = ctx.createLinearGradient(-14, -8, 2, 4);
      wingGrad.addColorStop(0, isBcn ? '#0d9488' : '#0284c7');
      wingGrad.addColorStop(0.45, isBcn ? '#059669' : '#16a34a');
      wingGrad.addColorStop(1, isBcn ? '#10b981' : '#22c55e');
      SpriteBank.fillAndStroke(ctx, wingGrad, '#090d16', 1.6);

      // 5. Cabeza redondeada y pico curvo anaranjado
      ctx.beginPath();
      ctx.arc(8, -2.5, 5.4, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, isBcn ? '#10b981' : '#22c55e', '#090d16', 1.6);
      if (isBcn) {
        // Frente y mejilla gris perla suave típica de la cotorra argentina/barcelonesa
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(10.6, -1.0, 2.5, -Math.PI * 0.35, Math.PI * 0.75);
        ctx.fill();
      }

      // Pico ganchudo / curvo anaranjado
      ctx.beginPath();
      ctx.moveTo(12, -4.2);
      ctx.quadraticCurveTo(18.2, -3.4, 17.4, 0.2);
      ctx.quadraticCurveTo(14.5, 0.8, 12, 1.0);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f97316', '#090d16', 1.4);

      // Ojo con anillo ocular blanco y pupila negra
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9.8, -3.8, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isSwarm ? '#ef4444' : '#090d16';
      ctx.beginPath();
      ctx.arc(isScaredFlying ? 9.2 : 10.2, -3.8, isScaredFlying ? 1.0 : 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Gotas de sudor / pánico si huye asustada por el ladrido de la Tina
      if (isScaredFlying) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-2, -14, 2.0, 0, Math.PI * 2);
        ctx.arc(4, -18, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawScooterHD(ctx, x, y, facing, animTimer, isDisabled) {
      ctx.save();
      ctx.translate(x + 17, y + 11);
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      // Haz de luz radial del faro LED delantero
      if (!isDisabled) {
        const beam = ctx.createLinearGradient(12, -8, 52, 4);
        beam.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
        beam.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(11, -9);
        ctx.lineTo(52, -18);
        ctx.lineTo(52, 6);
        ctx.closePath();
        ctx.fill();
      }

      // Ruedas con llanta metálica
      [-11, 11].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, 7, 4.8, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 2.0);
        ctx.beginPath();
        ctx.arc(wx, 7, 2.0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#38bdf8', '#090d16', 1.0);
      });

      // Plataforma inferior con tira LED cian
      SpriteBank.drawCapsule(ctx, -11, 5, 11, 5, 2.6, '#06b6d4', '#090d16', 1.8);

      // Mástil y manillar
      SpriteBank.drawCapsule(ctx, 9, 4, 7, -11, 2.0, '#94a3b8', '#090d16', 1.8);
      SpriteBank.drawCapsule(ctx, 4, -11, 10, -11, 1.8, '#ef4444', '#090d16', 1.5);

      ctx.restore();
    }

    drawFlagHD(ctx, x, y, time, city = 'barcelona') {
      ctx.save();
      ctx.translate(x, y);

      // Base y mástil metálico con brillo
      SpriteBank.drawCapsule(ctx, 6, 0, 6, 68, 3.0, '#e2e8f0', '#0f172a', 2.2);
      ctx.beginPath();
      ctx.arc(6, -2, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fbbf24', '#0f172a', 2.0);

      // Bandera ondeando con curvas Bézier
      const flagW = 38;
      const flagH = 26;
      const wave1 = Math.sin(time * 5) * 4;
      const wave2 = Math.cos(time * 5) * 5;
      const wave = wave1;
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.bezierCurveTo(22, 2 + wave1, 34, 2 - wave2, 8 + flagW, 4 + wave2);
      ctx.lineTo(8 + flagW, 2 + flagH + wave2);
      ctx.bezierCurveTo(34, flagH - wave2, 22, flagH + wave1, 8, 2 + flagH);
      ctx.closePath();

      if (city === 'palma') {
        // BANDERA OFICIAL DE MALLORCA:
        // Senyera (4 barras rojas sobre amarillo) + franja morada vertical en el asta con castillo blanco
        ctx.save();
        ctx.clip();

        // Fondo amarillo y 4 barras rojas horizontales (proporción clásica de 9 franjas)
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(6, -6, 44, 42);
        ctx.fillStyle = '#dc2626';
        for (let s = 0; s < 4; s++) {
          const sy = 4.6 + s * 5.6 + Math.sin(time * 5) * 0.6;
          ctx.fillRect(19, sy, 31, 2.8);
        }

        // Franja vertical morada junto al mástil
        const purpleGrad = ctx.createLinearGradient(8, 2, 20, 2);
        purpleGrad.addColorStop(0, '#6b21a8');
        purpleGrad.addColorStop(1, '#581c87');
        ctx.fillStyle = purpleGrad;
        ctx.fillRect(8, -4, 12.5, 40);

        // Miniatura del castillo blanco (Castillo de la Almudaina) en la franja morada
        const cy = 10 + wave1 * 0.25;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b0764';
        ctx.lineWidth = 0.7;
        // Base del castillo
        ctx.fillRect(10.5, cy + 4, 7.5, 6);
        ctx.strokeRect(10.5, cy + 4, 7.5, 6);
        // Almenas y torreón central más alto
        ctx.fillRect(10.5, cy + 1.8, 2.0, 2.4);
        ctx.fillRect(13.2, cy, 2.1, 4.2);
        ctx.fillRect(16.0, cy + 1.8, 2.0, 2.4);
        // Puerta central del castillo
        ctx.fillStyle = '#581c87';
        ctx.fillRect(13.5, cy + 6.8, 1.5, 3.2);
        ctx.restore();

        // Contorno exterior de la bandera ondeante
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.bezierCurveTo(22, 2 + wave1, 34, 2 - wave2, 46, 4 + wave2);
        ctx.lineTo(46, 28 + wave2);
        ctx.bezierCurveTo(34, 26 - wave2, 22, 26 + wave1, 8, 28);
        ctx.closePath();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (city === 'madrid') {
        // BANDERA DE ESPAÑA (Roja, Amarilla doble ancho, Roja)
        const flagGrad = ctx.createLinearGradient(8, 2, 8, 28);
        flagGrad.addColorStop(0, '#dc2626');
        flagGrad.addColorStop(0.25, '#dc2626');
        flagGrad.addColorStop(0.251, '#facc15');
        flagGrad.addColorStop(0.749, '#facc15');
        flagGrad.addColorStop(0.75, '#dc2626');
        flagGrad.addColorStop(1, '#dc2626');
        SpriteBank.fillAndStroke(ctx, flagGrad, '#0f172a', 2.0);

        // Escudo estilizado en la franja amarilla
        ctx.beginPath();
        ctx.roundRect(19, 11 + (wave1 + wave2) * 0.2, 6, 8, 2);
        SpriteBank.fillAndStroke(ctx, '#dc2626', '#991b1b', 0.8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(20.5, 12.5 + (wave1 + wave2) * 0.2, 3, 3);
      } else if (city === 'canarias') {
        // BANDERA OFICIAL DE CANARIAS: 3 franjas verticales (Blanco, Azul, Amarillo)
        ctx.save();
        ctx.clip();
        const stripeW = flagW / 3;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, -6, stripeW + 0.5, flagH + 16);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(8 + stripeW, -6, stripeW + 0.5, flagH + 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(8 + stripeW * 2, -6, stripeW + 2, flagH + 16);

        // Sombra suave sobre la tela ondeante
        const shadeGrad = ctx.createLinearGradient(8, 2, 8 + flagW, 2);
        shadeGrad.addColorStop(0, 'rgba(255,255,255,0.16)');
        shadeGrad.addColorStop(0.5, 'rgba(15,23,42,0.0)');
        shadeGrad.addColorStop(1, 'rgba(15,23,42,0.14)');
        ctx.fillStyle = shadeGrad;
        ctx.fillRect(8, -6, flagW, flagH + 16);
        ctx.restore();

        // Contorno exterior de la bandera ondeante
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.bezierCurveTo(22, 2 + wave, 34, 2 - wave2, 8 + flagW, 4 + wave2);
        ctx.lineTo(8 + flagW, 2 + flagH + wave2);
        ctx.bezierCurveTo(34, flagH - wave2, 22, flagH + wave, 8, 2 + flagH);
        ctx.closePath();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (typeof city === 'string' && city.indexOf('chile') === 0) {
        // BANDERA DE CHILE: Cantón azul con estrella solitaria blanca + franja blanca y franja roja
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, -4, flagW + 2, flagH * 0.54 + 6);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(8, 2 + flagH * 0.5, flagW + 2, flagH * 0.58);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(8, -4, flagW * 0.4, flagH * 0.54 + 6);
        // Estrella solitaria de 5 puntas
        const starCx = 15.5;
        const starCy = 8.6 + wave1 * 0.2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 4.4 : 1.9;
          const a = -Math.PI * 0.5 + (i * Math.PI) / 5;
          const sxp = starCx + Math.cos(a) * r;
          const syp = starCy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(sxp, syp);
          else ctx.lineTo(sxp, syp);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.bezierCurveTo(22, 2 + wave1, 34, 2 - wave2, 8 + flagW, 4 + wave2);
        ctx.lineTo(8 + flagW, 2 + flagH + wave2);
        ctx.bezierCurveTo(34, flagH - wave2, 22, flagH + wave1, 8, 2 + flagH);
        ctx.closePath();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (city === 'buenosaires' || city === 'rosario' || city === 'cordoba' || city === 'ushuaia') {
        // BANDERA DE ARGENTINA: Celeste - Blanca - Celeste + Sol de Mayo
        const flagGrad = ctx.createLinearGradient(8, 2, 8, 2 + flagH);
        flagGrad.addColorStop(0, '#38bdf8');
        flagGrad.addColorStop(0.32, '#38bdf8');
        flagGrad.addColorStop(0.33, '#ffffff');
        flagGrad.addColorStop(0.67, '#ffffff');
        flagGrad.addColorStop(0.68, '#38bdf8');
        flagGrad.addColorStop(1, '#38bdf8');
        SpriteBank.fillAndStroke(ctx, flagGrad, '#0f172a', 2.0);
        const sunX = 27;
        const sunY = 15 + (wave1 + wave2) * 0.16;
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // SENYERA CATALANA (Cuatribarrada)
        const flagGrad = ctx.createLinearGradient(8, 2, 8, 28);
        flagGrad.addColorStop(0, '#fbbf24');
        flagGrad.addColorStop(0.25, '#ef4444');
        flagGrad.addColorStop(0.5, '#fbbf24');
        flagGrad.addColorStop(0.75, '#ef4444');
        flagGrad.addColorStop(1, '#fbbf24');
        SpriteBank.fillAndStroke(ctx, flagGrad, '#0f172a', 2.0);
      }

      ctx.restore();
    }

    /**
     * Proyectil Parabólico de Gravedad Progresiva del Power-Up Botánico:
     * Orquídea con su flor (pétalos rosados/fucsias) plantada en una pequeña maceta de terracota.
     */
    drawPlantProjectileHD(ctx, x, y, vx = 500, vy = 0, animTimer = 0) {
      ctx.save();
      ctx.translate(x + 10, y + 10);

      // Estela aerodinámica en la dirección opuesta al vector de velocidad (vx, vy)
      const flightAngle = Math.atan2(vy, vx);
      ctx.save();
      ctx.rotate(flightAngle);
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 17);
      glow.addColorStop(0, 'rgba(244, 114, 182, 0.90)');
      glow.addColorStop(0.55, 'rgba(219, 39, 119, 0.45)');
      glow.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();

      // Estela de pétalos/energía rosada detrás de la maceta
      ctx.beginPath();
      ctx.moveTo(-17, 0);
      ctx.lineTo(-5, -5.5);
      ctx.lineTo(-5, 5.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(244, 114, 182, 0.65)';
      ctx.fill();
      ctx.restore();

      // Inclinación dinámica hacia adelante según trayectoria (sin invertir la maceta cabeza abajo)
      const dirSign = vx < 0 ? -1 : 1;
      const tilt = Math.atan2(vy, Math.abs(vx) || 1) * 0.55 + Math.sin(animTimer * 18) * 0.08;
      ctx.scale(dirSign, 1);
      ctx.rotate(tilt + 0.18);

      // Dibujar la Orquídea con pétalos rosados/fucsias plantada en su maceta de terracota
      this.drawOrchidPotGraphic(ctx, 1.05);

      ctx.restore();
    }

    drawCalamaresProjectileHD(ctx, x, y, animTimer, vx = 500, vy = 0) {
      this.drawPlantProjectileHD(ctx, x, y, vx, vy, animTimer);
    }

    /**
     * Boca de Metro de Barcelona (TMB) con Escaleras Mecánicas y Rombo Rojo <M>
     * - frontLayerOnly = false: Dibuja el cartel de TMB, el túnel iluminado y los peldaños
     *   mecánicos detrás de los personajes.
     * - frontLayerOnly = true: Dibuja la barandilla frontal y el recorte de acera para que
     *   el trío se oculte progresivamente al bajar las escaleras hacia el andén subterráneo.
     */
    drawMetroEntranceHD(ctx, x, y, time, nextStationName = 'El Gòtic', frontLayerOnly = false, city = 'barcelona') {
      const isArgentina = city === 'buenosaires';
      ctx.save();
      ctx.translate(x, y);

      if (!frontLayerOnly) {
        // 1. Poste oficial del Metro (rombo rojo TMB) o del Subte argentino (círculo amarillo)
        SpriteBank.drawCapsule(ctx, 14, -108, 14, 0, 3.2, '#64748b', '#0f172a', 2.0);

        if (isArgentina) {
          // Logo del Subte: círculo amarillo característico con "S" negra y franja de líneas
          ctx.save();
          ctx.translate(14, -120);
          ctx.beginPath();
          ctx.arc(0, 0, 21, 0, Math.PI * 2);
          SpriteBank.fillAndStroke(ctx, '#facc15', '#0f172a', 3.0);
          ctx.beginPath();
          ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('S', 0, 8);
          const lineColors = ['#38bdf8', '#ef4444', '#2563eb', '#16a34a', '#7c3aed', '#facc15'];
          lineColors.forEach((lc, li) => {
            ctx.fillStyle = lc;
            ctx.fillRect(-13.5 + li * 4.6, 11, 4, 4);
          });
          ctx.restore();
        } else {
          // Rombo Rojo TMB
          ctx.save();
          ctx.translate(14, -118);
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(24, 0);
          ctx.lineTo(0, 18);
          ctx.lineTo(-24, 0);
          ctx.closePath();
          SpriteBank.fillAndStroke(ctx, '#dc2626', '#ffffff', 2.5);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 16px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('M', 0, 6);
          ctx.restore();
        }

        // Cartel luminoso de estación (ancho dinámico con padding >= 12px)
        const metroHeader =
          city === 'madrid'
            ? 'METRO MADRID'
            : city === 'palma'
            ? 'METRO PALMA · SFM'
            : city === 'chile_santiago'
            ? 'METRO DE SANTIAGO'
            : isArgentina
            ? 'SUBTE · BUENOS AIRES'
            : 'METRO BARCELONA · TMB';
        const metroDest =
          city === 'madrid' || isArgentina || city === 'chile_santiago'
            ? `Próxima: ${nextStationName}`
            : city === 'palma'
            ? `Pròxima: ${nextStationName}`
            : `→ ${nextStationName}`;
        const metroPadX = 12;
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        const metroHdrW = ctx.measureText(metroHeader).width;
        let metroDestFont = 10;
        let metroDestW = ctx.measureText(metroDest).width;
        const maxMetroSignW = 240;
        if (metroDestW + metroPadX * 2 > maxMetroSignW) {
          metroDestFont = Math.max(
            7.2,
            Number(((10 * (maxMetroSignW - metroPadX * 2)) / Math.max(1, metroDestW)).toFixed(2))
          );
          ctx.font = `bold ${metroDestFont}px "Segoe UI", sans-serif`;
          metroDestW = ctx.measureText(metroDest).width;
        }
        const metroSignW = Math.ceil(Math.max(138, metroHdrW + metroPadX * 2, metroDestW + metroPadX * 2));

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = isArgentina ? '#facc15' : '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(38, -108, metroSignW, 28, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(metroHeader, 38 + metroPadX, -96);
        ctx.fillStyle = '#fde047';
        ctx.font = `bold ${metroDestFont}px "Segoe UI", sans-serif`;
        ctx.fillText(metroDest, 38 + metroPadX, -84);

        // 2. Marquesina arqueada de cristal y acero estilo boca de Metro de Barcelona
        const hoodGrad = ctx.createLinearGradient(0, -64, 150, 0);
        hoodGrad.addColorStop(0, 'rgba(30, 41, 59, 0.92)');
        hoodGrad.addColorStop(0.6, 'rgba(51, 65, 85, 0.88)');
        hoodGrad.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -44);
        ctx.quadraticCurveTo(75, -68, 152, -32);
        ctx.lineTo(152, 0);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, hoodGrad, '#0f172a', 2.4);

        // Luz cálida subterránea que emana desde el interior de la estación
        const tunnelGlow = ctx.createLinearGradient(10, -30, 135, 36);
        tunnelGlow.addColorStop(0, '#090d16');
        tunnelGlow.addColorStop(0.45, '#1e293b');
        tunnelGlow.addColorStop(1, '#fbbf24');
        ctx.fillStyle = tunnelGlow;
        ctx.fillRect(8, -28, 136, 62);

        // 3. Escaleras mecánicas animadas descendiendo hacia la derecha
        const stepOffset = (time * 24) % 14;
        for (let s = 0; s < 9; s++) {
          const sx = 12 + s * 14 + stepOffset * 0.7;
          const sy = -18 + s * 6.2 + stepOffset * 0.3;
          ctx.fillStyle = '#94a3b8';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.4;
          ctx.fillRect(sx, sy, 14, 5);
          ctx.strokeRect(sx, sy, 14, 5);
          // Línea amarilla de seguridad del peldaño mecánico
          ctx.fillStyle = '#fde047';
          ctx.fillRect(sx, sy, 14, 1.5);
        }
      } else {
        // Capa frontal: Murete de granito barcelonés y pasamanos negro/rojo que oculta a los personajes al bajar
        const wallGrad = ctx.createLinearGradient(0, -18, 0, 26);
        wallGrad.addColorStop(0, '#64748b');
        wallGrad.addColorStop(0.4, '#475569');
        wallGrad.addColorStop(1, '#1e293b');

        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(42, 0);
        ctx.lineTo(148, 36);
        ctx.lineTo(156, 36);
        ctx.lineTo(156, 80);
        ctx.lineTo(-4, 80);
        ctx.closePath();
        ctx.fillStyle = '#334155';
        ctx.fill();

        // Barandilla frontal inclinada de la escalera mecánica
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(72, -16);
        ctx.lineTo(148, 16);
        ctx.lineTo(148, 32);
        ctx.lineTo(0, 32);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, wallGrad, '#0f172a', 2.2);

        // Franja corporativa en la barandilla (roja TMB / amarilla Subte)
        ctx.beginPath();
        ctx.moveTo(4, -6);
        ctx.lineTo(70, -6);
        ctx.lineTo(144, 24);
        ctx.strokeStyle = city === 'buenosaires' ? '#facc15' : '#dc2626';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Pasamanos móvil negro
        ctx.beginPath();
        ctx.moveTo(0, -17);
        ctx.lineTo(72, -17);
        ctx.lineTo(148, 15);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4.0;
        ctx.stroke();
      }

      ctx.restore();
    }

    /**
     * PALMA DE MALLORCA: Parada de Autobús EMT (reemplaza boca de Metro en Mundo 3)
     * - Poste metálico con cartel rectangular azul/blanco "PARADA EMT"
     * - Marquesina moderna de espera con cristal y banco urbano
     */
    /** Calcula dimensiones reales y offset X del cartel superior de parada según texto destino. */
    getBusStopSignLayout(ctx, nextStopName = 'Castell de Bellver', variant = 'palma') {
      const isCanarias = variant === 'canarias';
      const isRosario = variant === 'rosario';
      const isCordoba = variant === 'cordoba';
      const isUshuaia = variant === 'ushuaia';
      const isChile = variant === 'chile';
      const isArgBus = isRosario || isCordoba || isUshuaia || isChile;
      const headerText = isCanarias
        ? 'GUAGUA · BUS'
        : isUshuaia
        ? 'USHUAIA · TDF'
        : isCordoba
        ? 'TAMSE · CBA'
        : isRosario
        ? 'MOVI · TUP'
        : isChile
        ? 'RED · CHILE'
        : 'EMT · BUS';
      const subHeaderText = isCanarias
        ? 'PARADA GUAGUA'
        : isUshuaia
        ? 'FIN DEL MUNDO'
        : isCordoba
        ? 'SIERRAS · CBA'
        : isRosario
        ? '103 · 110 · 102'
        : isChile
        ? 'RUTA ANDINA'
        : 'PARADA AUTOBÚS';
      const destinoTexto = `→ ${nextStopName}`;
      const padX = 16;
      const minBaseW = isArgBus ? 116 : 108;
      const maxSignW = 228;

      ctx.font = '900 10.5px "Segoe UI", system-ui, sans-serif';
      const headerReqW = 29 + ctx.measureText(headerText).width + 20;
      ctx.font = 'bold 9.5px "Segoe UI", sans-serif';
      const subReqW = ctx.measureText(subHeaderText).width + padX * 2;
      let destFontSize = 9;
      ctx.font = `bold ${destFontSize}px "Segoe UI", sans-serif`;
      let destW = ctx.measureText(destinoTexto).width;
      if (destW + padX * 2 > maxSignW) {
        destFontSize = Math.max(
          6.8,
          Number(((9 * (maxSignW - padX * 2)) / Math.max(1, destW)).toFixed(2))
        );
        ctx.font = `bold ${destFontSize}px "Segoe UI", sans-serif`;
        destW = ctx.measureText(destinoTexto).width;
      }

      const signW = Math.ceil(Math.max(minBaseW, headerReqW, subReqW, destW + padX * 2));
      const signX = -38 - Math.round((signW - minBaseW) * 0.25);
      const signY = -142;
      const signH = 48;
      return {
        isCanarias,
        isRosario,
        isCordoba,
        isUshuaia,
        isChile,
        isArgBus,
        headerText,
        subHeaderText,
        destinoTexto,
        destFontSize,
        padX,
        minBaseW,
        signW,
        signX,
        signY,
        signH
      };
    }

    /**
     * Borde izquierdo visual relativo al ancla (flagX + 78) de la parada/estación/teleférico,
     * usado para evitar solapamientos entre la bandera ondeante y el cartel dinámico.
     */
    getGoalStationLeftOffset(ctx, opts = {}) {
      if (opts.isTeideCable) return -24;
      if (opts.isBusOrGuagua) {
        const layout = this.getBusStopSignLayout(
          ctx,
          opts.nextDestination || 'Castell de Bellver',
          opts.busVariant || 'palma'
        );
        return layout.signX;
      }
      return -12;
    }

    /** Calcula la posición X segura para `drawFlagHD` manteniendo >= 24px hasta el cartel. */
    getGoalFlagDrawX(ctx, flagX, opts = {}) {
      const stopAnchorX = flagX + 78;
      const signBoxLeftX = stopAnchorX + this.getGoalStationLeftOffset(ctx, opts);
      const flagRightOffsetFromDrawX = 46; // mástil (+6) + bandera ondeante (+38) + margen (+2)
      const clearGap = 26;
      return Math.min(flagX, signBoxLeftX - clearGap - flagRightOffsetFromDrawX);
    }

    drawBusStopHD(ctx, x, y, time, nextStopName = 'Castell de Bellver', waiting = false, variant = 'palma') {
      const layout = this.getBusStopSignLayout(ctx, nextStopName, variant);
      const {
        isCanarias,
        isRosario,
        isCordoba,
        isUshuaia,
        isChile,
        isArgBus,
        headerText,
        subHeaderText,
        destinoTexto,
        destFontSize,
        padX,
        signW,
        signX,
        signY,
        signH
      } = layout;
      ctx.save();
      ctx.translate(x, y);

      // 1. Marquesina moderna trasera de la parada
      ctx.fillStyle = isCanarias
        ? 'rgba(254, 240, 138, 0.24)'
        : isUshuaia
        ? 'rgba(224, 242, 254, 0.30)'
        : isCordoba
        ? 'rgba(254, 202, 202, 0.24)'
        : isRosario
        ? 'rgba(56, 189, 248, 0.22)'
        : 'rgba(186, 230, 253, 0.24)';
      ctx.strokeStyle = isUshuaia ? '#1e3a8a' : isCordoba ? '#991b1b' : isRosario ? '#1e3a8a' : '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(28, -80, 94, 80);
      ctx.strokeRect(28, -80, 94, 80);

      // Postes de aluminio / acero o madera fueguina de la marquesina
      SpriteBank.drawCapsule(ctx, 30, -82, 30, 0, 2.4, isUshuaia ? '#78350f' : isCordoba ? '#b91c1c' : isRosario ? '#0284c7' : '#64748b', '#0f172a', 1.4);
      SpriteBank.drawCapsule(ctx, 120, -82, 120, 0, 2.4, isUshuaia ? '#78350f' : isCordoba ? '#b91c1c' : isRosario ? '#0284c7' : '#64748b', '#0f172a', 1.4);

      // Techo corporativo (con copete nevado en Ushuaia)
      ctx.beginPath();
      ctx.roundRect(22, -88, 106, 11, 4);
      SpriteBank.fillAndStroke(
        ctx,
        isCanarias ? '#eab308' : isUshuaia ? '#0ea5e9' : isCordoba ? '#dc2626' : isRosario ? '#0ea5e9' : '#0284c7',
        '#0f172a',
        2
      );
      ctx.fillStyle = isCanarias ? '#0284c7' : isUshuaia ? '#ffffff' : isCordoba ? '#fde047' : isRosario ? '#1e3a8a' : '#fbbf24';
      ctx.fillRect(24, isUshuaia ? -88 : -81, 102, isUshuaia ? 4.5 : 2.5);

      // Banco urbano de espera dentro de la marquesina
      ctx.fillStyle = isUshuaia ? '#92400e' : isCordoba ? '#991b1b' : isRosario ? '#0369a1' : '#d97706';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.fillRect(42, -26, 66, 6);
      ctx.strokeRect(42, -26, 66, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(48, -20, 5, 20);
      ctx.fillRect(97, -20, 5, 20);

      // Tablón de líneas / horarios dentro de la marquesina
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(58, -64, 34, 28);
      ctx.strokeRect(58, -64, 34, 28);
      ctx.fillStyle = isUshuaia ? '#0284c7' : isCordoba ? '#dc2626' : isRosario ? '#0ea5e9' : '#0284c7';
      ctx.fillRect(60, -62, 30, 6);
      if (isArgBus) {
        ctx.fillStyle = isUshuaia ? '#0369a1' : isCordoba ? '#b91c1c' : '#fb923c';
        ctx.font = 'bold 6.5px "Consolas", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isUshuaia ? 'TDF·FIN' : '103·110·102', 75, -50);
      }
      ctx.fillStyle = '#475569';
      ctx.fillRect(62, -46, 20, 2);
      ctx.fillRect(62, -41, 26, 2);

      // 2. Poste principal y cartel de parada
      ctx.fillStyle = '#334155';
      ctx.fillRect(-5, -5, 14, 5);
      SpriteBank.drawCapsule(
        ctx,
        2,
        -142,
        2,
        -2,
        3.4,
        isUshuaia ? '#0284c7' : isCordoba ? '#dc2626' : isRosario ? '#0284c7' : '#94a3b8',
        '#0f172a',
        2.0
      );

      // Cartel oficial de parada (ancho dinámico según getBusStopSignLayout)
      ctx.beginPath();
      ctx.roundRect(signX, signY, signW, signH, 7);
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#0f172a', 2.4);

      // Franja superior corporativa
      ctx.beginPath();
      ctx.roundRect(signX + 1.5, signY + 1.5, signW - 3, 21, [5, 5, 0, 0]);
      ctx.fillStyle = isCanarias ? '#0284c7' : isUshuaia ? '#0369a1' : isCordoba ? '#dc2626' : isRosario ? '#0ea5e9' : '#1d4ed8';
      ctx.fill();

      // Mini silueta dentro de la franja superior
      ctx.fillStyle = isCanarias ? '#facc15' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(signX + 8, signY + 6, 16, 11, 2.5);
      ctx.fill();
      ctx.fillStyle = isCanarias ? '#0284c7' : isUshuaia ? '#0284c7' : isCordoba ? '#991b1b' : isRosario ? '#0369a1' : '#1d4ed8';
      ctx.fillRect(signX + 10, signY + 8, 5, 4);
      ctx.fillRect(signX + 16, signY + 8, 5, 4);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10.5px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(headerText, signX + 29, signY + 16);

      // Zona inferior blanca del cartel con líneas / destino
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9.5px "Segoe UI", sans-serif';
      ctx.fillText(subHeaderText, signX + padX, signY + 31);

      ctx.fillStyle = isUshuaia ? '#0284c7' : isCordoba ? '#b91c1c' : isRosario ? '#0369a1' : '#0284c7';
      ctx.font = `bold ${destFontSize}px "Segoe UI", sans-serif`;
      ctx.fillText(destinoTexto, signX + padX, signY + 42);

      // Indicador LED parpadeante si los personajes están esperando en la parada
      if (waiting) {
        const blink = Math.sin(time * 8) > 0;
        ctx.fillStyle = isArgBus
          ? (blink ? '#fb923c' : '#f97316')
          : (blink ? '#fbbf24' : '#38bdf8');
        ctx.beginPath();
        ctx.arc(signX + signW - 9, signY + 12, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /**
     * Autobús Urbano EMT de Palma de Mallorca (diseño cuadrado clásico, ruedas giratorias,
     * ventanas panorámicas, puertas plegables y pasajeros visibles al abordar).
     */
    drawUrbanBusHD(
      ctx,
      x,
      y,
      time,
      nextStopName = 'Castell de Bellver',
      wheelAngle = 0,
      doorsOpen = false,
      hasPassengers = false,
      variant = 'palma',
      facing = 'right'
    ) {
      const isCanarias = variant === 'canarias';
      const isCordoba = variant === 'cordoba';
      const isUshuaia = variant === 'ushuaia';
      const isChile = variant === 'chile';
      const isLeft = facing === 'left';
      ctx.save();
      ctx.translate(x, y);
      if (isLeft) {
        ctx.translate(99, 0);
        ctx.scale(-1, 1);
        ctx.translate(-99, 0);
      }

      // Sombra proyectada bajo el autobús
      ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
      ctx.beginPath();
      ctx.ellipse(99, 1, 96, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Unidad de aire acondicionado / calefacción polar en el techo
      ctx.beginPath();
      ctx.roundRect(42, -92, 68, 9, 4);
      SpriteBank.fillAndStroke(ctx, '#e2e8f0', '#0f172a', 2);

      // Carrocería cuadrada principal
      ctx.beginPath();
      ctx.roundRect(4, -84, 190, 68, [8, 10, 6, 6]);
      SpriteBank.fillAndStroke(ctx, isCanarias ? '#fef08a' : isUshuaia ? '#e0f2fe' : '#f8fafc', '#0f172a', 2.6);

      // Falda inferior corporativa
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(5.5, -42, 187, 25, [0, 0, 5, 5]);
      ctx.clip();
      ctx.fillStyle = isCanarias ? '#eab308' : isUshuaia ? '#0369a1' : isCordoba ? '#dc2626' : '#0284c7';
      ctx.fillRect(4, -42, 190, 26);
      // Franjas identificativas
      ctx.fillStyle = isCanarias ? '#0284c7' : isUshuaia ? '#38bdf8' : isCordoba ? '#fde047' : '#fbbf24';
      ctx.fillRect(4, -42, 190, 5.5);
      ctx.fillStyle = isCanarias ? '#ffffff' : isUshuaia ? '#ffffff' : isCordoba ? '#991b1b' : '#e11d48';
      ctx.fillRect(4, -36.5, 190, 3);
      ctx.restore();

      // Rotulación lateral (siempre legible aunque el autobús mire a la izquierda)
      ctx.save();
      ctx.translate(100, -23);
      if (isLeft) ctx.scale(-1, 1);
      ctx.fillStyle = isCanarias ? '#0f172a' : '#ffffff';
      ctx.font = '900 10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isCanarias ? 'GUAGUA CANARIA' : isUshuaia ? 'USHUAIA AUSTRAL' : isCordoba ? 'TAMSE CÓRDOBA' : isChile ? 'BUS CHILE RED' : 'EMT PALMA', 0, 0);
      ctx.restore();

      // Cartel LED luminoso frontal superior
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(148, -80, 38, 11);
      ctx.save();
      ctx.translate(167, -72);
      if (isLeft) ctx.scale(-1, 1);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 8px "Consolas", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isCanarias
          ? (isLeft ? '← GC' : 'GC →')
          : isUshuaia
          ? (isLeft ? '← USH' : 'USH →')
          : isCordoba
          ? (isLeft ? '← CBA' : 'CBA →')
          : isChile
          ? (isLeft ? '← CL' : 'CL →')
          : (isLeft ? '← EMT' : 'EMT →'),
        0,
        0
      );
      ctx.restore();

      // Ventanas rectangulares de pasajeros (y parabrisas frontal derecho)
      const windows = [
        { wx: 12, ww: 28 },
        { wx: 45, ww: 32 },
        { wx: 82, ww: 32 }
      ];
      windows.forEach((win, idx) => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(win.wx - 1.5, -75.5, win.ww + 3, 29, 3);
        ctx.fill();

        const glassGrad = ctx.createLinearGradient(0, -74, 0, -48);
        glassGrad.addColorStop(0, '#bae6fd');
        glassGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = glassGrad;
        ctx.beginPath();
        ctx.roundRect(win.wx, -74, win.ww, 26, 2);
        ctx.fill();

        // Si el trío ya subió al autobús, asoman por las ventanillas celebrando
        if (hasPassengers) {
          if (idx === 1) {
            // Nico / Andrea asomados
            ctx.fillStyle = '#f5cfa0';
            ctx.beginPath();
            ctx.arc(win.wx + 10, -56, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3b2416';
            ctx.beginPath();
            ctx.arc(win.wx + 10, -59.5, 5.8, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fde0c2';
            ctx.beginPath();
            ctx.arc(win.wx + 22, -55.5, 5.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(win.wx + 22, -59, 5.5, Math.PI, Math.PI * 2);
            ctx.fill();
          } else if (idx === 2) {
            // La Tina asomada alegremente
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(win.wx + 15, -55, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(win.wx + 18, -53.5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(win.wx + 17, -50, 2, 2.5);
          }
        }

        // Brillo diagonal del cristal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.beginPath();
        ctx.moveTo(win.wx + 3, -72);
        ctx.lineTo(win.wx + 10, -72);
        ctx.lineTo(win.wx + 5, -50);
        ctx.lineTo(win.wx + 1, -50);
        ctx.closePath();
        ctx.fill();
      });

      // Puerta central doble de subida/bajada
      ctx.fillStyle = doorsOpen ? '#1e293b' : '#cbd5e1';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(120, -75, 32, 57, 3);
      ctx.fill();
      ctx.stroke();

      if (doorsOpen) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.72)';
        ctx.fillRect(124, -72, 24, 52);
        // Hojas abiertas a los lados
        ctx.fillStyle = isCanarias ? '#eab308' : '#0284c7';
        ctx.fillRect(120, -74, 5, 55);
        ctx.fillRect(147, -74, 5, 55);
      } else {
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(123, -72, 11, 25);
        ctx.fillRect(138, -72, 11, 25);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(136, -75);
        ctx.lineTo(136, -18);
        ctx.stroke();
      }

      // Parabrisas frontal cuadrado (lado derecho)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(156, -68, 34, 34, [4, 6, 3, 3]);
      ctx.fill();
      const frontGlass = ctx.createLinearGradient(158, -66, 188, -36);
      frontGlass.addColorStop(0, '#bae6fd');
      frontGlass.addColorStop(1, '#0ea5e9');
      ctx.fillStyle = frontGlass;
      ctx.beginPath();
      ctx.roundRect(158, -66, 30, 30, [3, 5, 2, 2]);
      ctx.fill();

      // Parachoques frontal/trasero, faro delantero y piloto rojo trasero
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, -20, 14, 6);
      ctx.fillRect(180, -20, 16, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(189, -31, 6, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(3, -31, 5, 7);

      // Ruedas del autobús giratorias
      [42, 158].forEach((wx) => {
        ctx.save();
        ctx.translate(wx, -14);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(wheelAngle);
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
      });

      ctx.restore();
    }

    /**
     * Colectivo Urbano de Rosario (TUP / MOVI):
     * - Mitad superior/techo blanco y mitad inferior celeste vibrante separados por línea azul oscuro.
     * - Cartel LED naranja frontal sobre el parabrisas con línea y destino (ej. "103 - LA FLORIDA").
     * - Inscripción lateral blanca "MOVI / ROSARIO", paragolpes negros, llantas plateadas y puertas plegables.
     */
    drawRosarioBus(
      ctx,
      x,
      y,
      time,
      nextStopName = 'La Florida',
      wheelAngle = 0,
      doorsOpen = false,
      hasPassengers = false,
      facing = 'right',
      busLineLabel = null,
      suspensionOffset = 0
    ) {
      const isLeft = facing === 'left';
      const resolveLedLabel = () => {
        if (busLineLabel) return busLineLabel;
        const lower = String(nextStopName || '').toLowerCase();
        if (lower.includes('florida')) return '103 - LA FLORIDA';
        if (lower.includes('parque')) return '110 - PARQUE';
        if (lower.includes('arroyito')) return '102 - ARROYITO';
        if (lower.includes('norte')) return '102 - R. NORTE';
        return '103 - CENTRO';
      };
      const ledText = resolveLedLabel();

      ctx.save();
      ctx.translate(x, y);
      if (isLeft) {
        ctx.translate(106, 0);
        ctx.scale(-1, 1);
        ctx.translate(-106, 0);
      }

      // Sombra proyectada sobre el asfalto
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(106, 1, 102, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cuerpo con sutil movimiento de suspensión neumática / aire comprimido
      ctx.save();
      ctx.translate(0, suspensionOffset);

      // Módulo de aire acondicionado blanco aerodinámico en el techo
      ctx.beginPath();
      ctx.roundRect(42, -97, 78, 9, 4);
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#0f172a', 2);

      // Carrocería urbana moderna (mitad superior blanca, mitad inferior celeste vibrante)
      ctx.beginPath();
      ctx.roundRect(4, -88, 204, 71, [10, 14, 6, 6]);
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#0f172a', 2.6);

      // Mitad inferior pintada de celeste vibrante + línea divisoria azul oscuro
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(5.5, -45, 201, 27, [0, 0, 5, 5]);
      ctx.clip();
      const celesteGrad = ctx.createLinearGradient(0, -45, 0, -18);
      celesteGrad.addColorStop(0, '#38bdf8');
      celesteGrad.addColorStop(1, '#0ea5e9');
      ctx.fillStyle = celesteGrad;
      ctx.fillRect(4, -45, 204, 28);
      // Línea divisoria azul oscuro horizontal
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(4, -45, 204, 5.5);
      // Acento sutil inferior celeste profundo
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(4, -22, 204, 4);
      ctx.restore();

      // Inscripción lateral blanca estilizada ("MOVI / ROSARIO") en el fuselaje celeste
      ctx.save();
      ctx.translate(78, -28);
      if (isLeft) ctx.scale(-1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MOVI / ROSARIO', 0, 0);
      ctx.restore();

      // Ventanillas amplias polarizadas
      const windows = [
        { wx: 12, ww: 34 },
        { wx: 51, ww: 38 },
        { wx: 94, ww: 36 }
      ];
      windows.forEach((win, idx) => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(win.wx - 1.5, -78.5, win.ww + 3, 30, 3);
        ctx.fill();

        // Cristal polarizado amplio
        const polarGrad = ctx.createLinearGradient(0, -77, 0, -50);
        polarGrad.addColorStop(0, '#1e293b');
        polarGrad.addColorStop(0.55, '#334155');
        polarGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = polarGrad;
        ctx.beginPath();
        ctx.roundRect(win.wx, -77, win.ww, 27, 2);
        ctx.fill();

        // Si el trío ya subió al colectivo, asoman tras el cristal polarizado
        if (hasPassengers) {
          if (idx === 1) {
            ctx.fillStyle = '#f5cfa0';
            ctx.beginPath();
            ctx.arc(win.wx + 12, -59, 5.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3b2416';
            ctx.beginPath();
            ctx.arc(win.wx + 12, -62.5, 5.7, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fde0c2';
            ctx.beginPath();
            ctx.arc(win.wx + 26, -58.5, 5.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(win.wx + 26, -62, 5.4, Math.PI, Math.PI * 2);
            ctx.fill();
          } else if (idx === 2) {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(win.wx + 18, -58, 5.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(win.wx + 21, -56.5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(win.wx + 20, -53, 2, 2.5);
          }
        }

        // Reflejo diagonal sutil en vidrio polarizado
        ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
        ctx.beginPath();
        ctx.moveTo(win.wx + 4, -75);
        ctx.lineTo(win.wx + 12, -75);
        ctx.lineTo(win.wx + 6, -52);
        ctx.lineTo(win.wx + 1, -52);
        ctx.closePath();
        ctx.fill();
      });

      // Puertas plegables delanteras/centrales
      ctx.fillStyle = doorsOpen ? '#1e293b' : '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(136, -78, 30, 60, 3);
      ctx.fill();
      ctx.stroke();

      if (doorsOpen) {
        // Interior iluminado y hojas plegables recogidas a ambos lados
        ctx.fillStyle = 'rgba(254, 240, 138, 0.78)';
        ctx.fillRect(141, -75, 20, 55);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(136, -77, 4.5, 58);
        ctx.fillRect(161.5, -77, 4.5, 58);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(136, -45, 4.5, 4);
        ctx.fillRect(161.5, -45, 4.5, 4);
      } else {
        // Hojas plegables cerradas con vidrios polarizados
        ctx.fillStyle = '#334155';
        ctx.fillRect(139, -75, 10.5, 26);
        ctx.fillRect(152.5, -75, 10.5, 26);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(138, -43, 12, 23);
        ctx.fillRect(152, -43, 12, 23);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(151, -78);
        ctx.lineTo(151, -18);
        ctx.stroke();
      }

      // Cartel luminoso LED naranja en la parte superior del parabrisas
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(132, -87, 72, 11, 2.5);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(168, -79);
      if (isLeft) ctx.scale(-1, 1);
      ctx.fillStyle = '#fb923c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 7.2px "Consolas", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ledText, 0, 0);
      ctx.restore();

      // Parabrisas amplio polarizado frontal
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(170, -73, 35, 36, [3, 8, 3, 3]);
      ctx.fill();
      const windGrad = ctx.createLinearGradient(172, -71, 203, -39);
      windGrad.addColorStop(0, '#334155');
      windGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = windGrad;
      ctx.beginPath();
      ctx.roundRect(172, -71, 31, 32, [2, 6, 2, 2]);
      ctx.fill();

      // Paragolpes negro frontal/trasero y luces
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(1, -21, 17, 7, 2);
      ctx.roundRect(191, -21, 20, 7, 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(202, -32, 6.5, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(3, -32, 5.5, 7);

      ctx.restore(); // Fin de suspensión neumática de carrocería

      // Ruedas grandes con neumáticos negros y llantas plateadas giratorias
      [44, 170].forEach((wx) => {
        ctx.save();
        ctx.translate(wx, -15);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 13.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(wheelAngle);
        const rimGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9.5);
        rimGrad.addColorStop(0, '#f8fafc');
        rimGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 9.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.moveTo(0, -7);
        ctx.lineTo(0, 7);
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    }

    // ========================================================================
    // MALLORCA: MEDUSA ELÉCTRICA (Flota sobre abismos, inmune al stomp)
    // ========================================================================
    drawElectricJellyfishHD(ctx, x, y, animTimer, isDisabled) {
      ctx.save();
      ctx.translate(x + 17, y + 19);

      const pulse = 1 + Math.sin(animTimer * 6) * 0.08;
      if (!isDisabled) {
        const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 26);
        aura.addColorStop(0, 'rgba(34, 211, 238, 0.55)');
        aura.addColorStop(0.6, 'rgba(168, 85, 247, 0.25)');
        aura.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tentáculos ondulantes luminosos
      for (let t = -2; t <= 2; t++) {
        const wave = Math.sin(animTimer * 8 + t * 1.4) * 4;
        ctx.beginPath();
        ctx.moveTo(t * 4.2, 2);
        ctx.quadraticCurveTo(t * 5 + wave, 11, t * 3.8 - wave * 0.6, 20);
        ctx.strokeStyle = isDisabled ? '#94a3b8' : t % 2 === 0 ? '#22d3ee' : '#e879f9';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Campana translúcida de medusa
      ctx.save();
      ctx.scale(pulse, 2 - pulse);
      const bellGrad = ctx.createRadialGradient(-4, -8, 2, 0, -4, 17);
      if (isDisabled) {
        bellGrad.addColorStop(0, '#e2e8f0');
        bellGrad.addColorStop(1, '#64748b');
      } else {
        bellGrad.addColorStop(0, '#cffafe');
        bellGrad.addColorStop(0.5, '#38bdf8');
        bellGrad.addColorStop(1, '#7e22ce');
      }
      ctx.beginPath();
      ctx.arc(0, -1, 14, Math.PI, 0);
      ctx.bezierCurveTo(15, 6, -15, 6, -14, -1);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, bellGrad, '#0f172a', 2.0);
      ctx.restore();

      // Chispas eléctricas en corona superior (advierten que dañarà al pisar)
      if (!isDisabled) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.0;
        for (let s = 0; s < 3; s++) {
          const sx = -8 + s * 8;
          const flick = Math.sin(animTimer * 24 + s * 2) * 3;
          ctx.beginPath();
          ctx.moveTo(sx, -15);
          ctx.lineTo(sx + flick, -21);
          ctx.lineTo(sx - flick * 0.7, -25);
          ctx.stroke();
        }
      }

      // Ojos amenazantes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-4.5, -4, 1.8, 0, Math.PI * 2);
      ctx.arc(4.5, -4, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ========================================================================
    // MALLORCA: CANGREJO COSTERO (Muy rápido, levanta pinzas defensivas arriba)
    // ========================================================================
    drawCoastalCrabHD(ctx, x, y, facing, animTimer, isDisabled, defenseRaised) {
      ctx.save();
      ctx.translate(x + 19, y + 18);

      const scuttle = isDisabled ? 0 : Math.sin(animTimer * 22) * 3.2;

      // Patas articuladas laterales (3 pares)
      for (let side = -1; side <= 1; side += 2) {
        for (let leg = 0; leg < 3; leg++) {
          const lx = side * (11 + leg * 3);
          const ly = 3 + leg * 2 + (leg % 2 === 0 ? scuttle : -scuttle) * 0.5;
          SpriteBank.drawCapsule(ctx, side * 9, 2, lx, ly + 7, 1.9, '#ea580c', '#0f172a', 1.4);
        }
      }

      // Pinzas: si defenseRaised === true, suben abiertas sobre el caparazón como defensa anti-stomp
      for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        if (defenseRaised && !isDisabled) {
          ctx.translate(side * 10, -14);
          ctx.rotate(side * 0.15 + Math.sin(animTimer * 26) * 0.12);
        } else {
          ctx.translate(side * 15, -1);
          ctx.rotate(side * 0.65);
        }
        // Brazo de la pinza
        SpriteBank.drawCapsule(ctx, 0, 8, 0, 0, 2.3, '#f97316', '#0f172a', 1.5);
        // Tenaza en V afilada
        ctx.beginPath();
        ctx.arc(-2, -4, 6.2, 0.3, Math.PI + 0.5);
        ctx.lineTo(0, -1);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, defenseRaised ? '#fef08a' : '#ef4444', '#0f172a', 1.7);
        ctx.beginPath();
        ctx.arc(3.5, -4, 5.2, -0.5, Math.PI - 0.3);
        ctx.lineTo(0, -1);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, defenseRaised ? '#fef08a' : '#ef4444', '#0f172a', 1.7);
        ctx.restore();
      }

      // Caparazón ancho ovalado bermellón
      const shellGrad = ctx.createRadialGradient(-4, -4, 2, 0, 1, 16);
      shellGrad.addColorStop(0, isDisabled ? '#cbd5e1' : '#fb923c');
      shellGrad.addColorStop(0.65, isDisabled ? '#94a3b8' : '#dc2626');
      shellGrad.addColorStop(1, isDisabled ? '#64748b' : '#991b1b');
      ctx.beginPath();
      ctx.ellipse(0, 1, 14.5, 9.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, shellGrad, '#0f172a', 2.2);

      // Tallos oculares y ojos saltones
      for (let side = -1; side <= 1; side += 2) {
        SpriteBank.drawCapsule(ctx, side * 5, -7, side * 6.5, -12, 1.5, '#ea580c', '#0f172a', 1.2);
        ctx.beginPath();
        ctx.arc(side * 6.5, -12.5, 2.8, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#ffffff', '#0f172a', 1.4);
        ctx.fillStyle = defenseRaised ? '#dc2626' : '#0f172a';
        ctx.beginPath();
        ctx.arc(side * 6.5 + (facing === 'right' ? 0.6 : -0.6), -12.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ========================================================================
    // MALLORCA: CABRA DE TRAMUNTANA (Embiste en línea recta al detectar al jugador)
    // ========================================================================
    drawTramuntanaGoatHD(ctx, x, y, facing, animTimer, isDisabled, isCharging, hitFlash = false, hp = 2) {
      ctx.save();
      ctx.translate(x + 21, y + 19);
      if (facing === 'left') ctx.scale(-1, 1);

      const flashOn = hitFlash && Math.floor(animTimer * 36) % 2 === 0;
      const stride = isDisabled ? 0 : Math.sin(animTimer * (isCharging ? 28 : 12)) * (isCharging ? 6 : 3.5);
      const tilt = isCharging && !isDisabled ? 0.16 : 0;
      ctx.rotate(tilt);

      // Patas ágiles de montaña
      SpriteBank.drawCapsule(ctx, -10, 4, -12 - stride, 16, 2.5, '#78350f', '#0f172a', 1.6);
      SpriteBank.drawCapsule(ctx, -4, 4, -4 + stride, 16, 2.5, '#92400e', '#0f172a', 1.6);
      SpriteBank.drawCapsule(ctx, 6, 4, 8 - stride, 16, 2.5, '#78350f', '#0f172a', 1.6);
      SpriteBank.drawCapsule(ctx, 11, 4, 12 + stride, 16, 2.5, '#92400e', '#0f172a', 1.6);

      // Cuerpo musculoso de cabra balear (marrón oscuro y blanco crema)
      const furGrad = ctx.createLinearGradient(0, -10, 0, 10);
      furGrad.addColorStop(0, isDisabled ? '#cbd5e1' : '#b45309');
      furGrad.addColorStop(0.65, isDisabled ? '#94a3b8' : '#78350f');
      furGrad.addColorStop(1, '#451a03');
      ctx.beginPath();
      ctx.ellipse(0, 1, 14, 8.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furGrad, '#0f172a', 2.0);

      // Cabeza y hocico con perilla (más inclinada al embestir)
      ctx.save();
      ctx.translate(12, isCharging ? -2 : -6);
      if (isCharging) ctx.rotate(0.35);

      ctx.beginPath();
      ctx.ellipse(3, 0, 7.5, 5.5, 0.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#d97706', '#0f172a', 1.8);

      // Cuernos grandes curvados hacia atrás (característicos de la Cabra de Tramuntana)
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.quadraticCurveTo(-8, -17, -17, -10);
      ctx.quadraticCurveTo(-9, -11, 2, -2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#475569', '#0f172a', 1.6);

      // Chiva / perilla
      ctx.beginPath();
      ctx.moveTo(7, 4);
      ctx.lineTo(10, 10);
      ctx.lineTo(5, 5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#0f172a', 1.2);

      // Ojo fiero al embestir
      ctx.fillStyle = isCharging ? '#ef4444' : '#fde047';
      ctx.beginPath();
      ctx.arc(5.5, -1.5, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Líneas de velocidad cuando carga
      if (isCharging && !isDisabled) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-22, -6);
        ctx.lineTo(-14, -6);
        ctx.moveTo(-25, 2);
        ctx.lineTo(-16, 2);
        ctx.stroke();
      }
      if (hp === 1 && !isDisabled) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-8, -11, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      if (flashOn) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.ellipse(2, 0, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ========================================================================
    // MALLORCA: GAVIOTA REAL (Gran envergadura + Enjambre Tormenta Nivel 4)
    // ========================================================================
    drawRoyalSeagullHD(ctx, x, y, facing, animTimer, isDisabled, isScaredFlying, isSwarm = false) {
      ctx.save();
      ctx.translate(x + 18, y + 13);
      ctx.scale(facing === 'left' ? -1.16 : 1.16, 1.16);

      const flapSpeed = isScaredFlying ? 34 : isSwarm ? 20 : isDisabled ? 2 : 12;
      const wingAngle = Math.sin(animTimer * flapSpeed) * 0.68;

      // Ala trasera oscura de Gaviota Real (dorso gris pizarra)
      ctx.save();
      ctx.rotate(-wingAngle * 0.72);
      ctx.beginPath();
      ctx.moveTo(-3, -1);
      ctx.quadraticCurveTo(-14, -15, -20, -6);
      ctx.quadraticCurveTo(-11, -2, -2, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, isSwarm ? '#475569' : '#64748b', '#0f172a', 1.6);
      ctx.restore();

      // Cuerpo blanco robusto
      ctx.beginPath();
      ctx.ellipse(0, 1, 12.5, 6, -0.06, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#0f172a', 2.0);

      // Cola con franja terminal negra
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(-18, -3.5);
      ctx.lineTo(-17, 3.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#0f172a', 1.2);

      // Cabeza y pico amarillo fuerte con punto rojo característico
      ctx.beginPath();
      ctx.arc(10, -2.5, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#0f172a', 1.8);

      ctx.beginPath();
      ctx.moveTo(14, -4.2);
      ctx.quadraticCurveTo(21, -3.5, 20.5, 0);
      ctx.lineTo(14, -0.8);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f59e0b', '#0f172a', 1.5);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(18.5, -1.2, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isSwarm ? '#dc2626' : '#0f172a';
      ctx.beginPath();
      ctx.arc(11.5, -3.3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Ala delantera gris pizarra con punta negra
      ctx.save();
      ctx.rotate(wingAngle);
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.bezierCurveTo(-8, -17, 8, -17, 13, -5);
      ctx.quadraticCurveTo(5, -2, -2, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, isSwarm ? '#334155' : '#94a3b8', '#0f172a', 1.8);
      ctx.restore();

      ctx.restore();
    }

    /**
     * ISLAS CANARIAS (TEIDE): Estación de salida del Teleférico del Teide
     */
    drawCableCarStationHD(ctx, x, y, time, waiting = false) {
      ctx.save();
      ctx.translate(x, y);

      // Base de piedra volcánica basáltica con franja de seguridad amarilla
      ctx.beginPath();
      ctx.roundRect(-56, -14, 212, 14, 4);
      SpriteBank.fillAndStroke(ctx, '#334155', '#0f172a', 2.2);
      ctx.fillStyle = '#facc15';
      for (let sx = -50; sx < 148; sx += 16) {
        ctx.fillRect(sx, -13, 8, 3.5);
      }

      // Columnas metálicas de celosía de la estación (amplio despeje para cabina 1.6x)
      SpriteBank.drawCapsule(ctx, -42, -140, -42, -14, 4.5, '#64748b', '#0f172a', 2.0);
      SpriteBank.drawCapsule(ctx, 126, -152, 126, -14, 4.5, '#64748b', '#0f172a', 2.0);

      // Brazo superior y pórtico de rodillos para los cables
      ctx.beginPath();
      ctx.roundRect(-50, -154, 194, 16, 4);
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#0f172a', 2.2);

      // Franja canaria blanco / azul / amarillo en el pórtico
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-44, -151, 14, 10);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-30, -151, 14, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-16, -151, 14, 10);

      // Rótulo TELEFÉRICO DEL TEIDE
      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TELEFÉRICO · 3.555m', 6, -143);

      // Indicador LED de embarque activo
      const ledOn = !waiting || Math.sin(time * 9) > 0;
      ctx.fillStyle = waiting ? (ledOn ? '#facc15' : '#38bdf8') : '#22c55e';
      ctx.beginPath();
      ctx.arc(132, -146, 3.6, 0, Math.PI * 2);
      ctx.fill();

      // Cables tractores y portadores prolongados fuera del borde superior izquierdo y superior derecho
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-1120, -886);
      ctx.lineTo(68, -150);
      ctx.lineTo(1068, -950);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1120, -880);
      ctx.lineTo(68, -144);
      ctx.lineTo(1068, -944);
      ctx.stroke();

      // Barandilla de embarque frontal en acceso izquierdo
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.6;
      ctx.strokeRect(-54, -42, 42, 28);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-52, -39, 38, 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6.5px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMBARQUE', -33, -33);

      ctx.restore();
    }

    /**
     * Cabina panorámica 1.6x del Teleférico del Teide suspendida en cable
     * Anclada en su base inferior (y = floorY) con brazo alargado hasta polea (y - 168)
     */
    drawCableCarCabinHD(ctx, x, y, time, doorsOpen = false, hasPassengers = false, swayAngle = 0, cableAngle = 0) {
      ctx.save();
      ctx.translate(x, y);

      // Carro de poleas superior enganchado al cable (y - 168), alineado con la pendiente del cable
      ctx.save();
      ctx.translate(80, -168);
      ctx.rotate(cableAngle);
      ctx.translate(-80, 168);
      ctx.beginPath();
      ctx.roundRect(42, -176, 76, 16, 6);
      SpriteBank.fillAndStroke(ctx, '#475569', '#0f172a', 2.2);
      [54, 80, 106].forEach((px) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(px, -168, 5.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });
      ctx.restore();

      // Brazo articulado de suspensión alargado desde la polea (-160) hasta techo cabina (-94)
      ctx.save();
      ctx.translate(80, -160);
      ctx.rotate(swayAngle);
      ctx.translate(-80, 160);

      SpriteBank.drawCapsule(ctx, 80, -160, 80, -138, 4.4, '#64748b', '#0f172a', 1.8);
      SpriteBank.drawCapsule(ctx, 76, -138, 60, -94, 3.8, '#64748b', '#0f172a', 1.8);
      SpriteBank.drawCapsule(ctx, 84, -138, 100, -94, 3.8, '#64748b', '#0f172a', 1.8);
      SpriteBank.drawCapsule(ctx, 56, -118, 104, -118, 2.8, '#94a3b8', '#0f172a', 1.5);
      // Yugo de anclaje en el techo de la cabina
      ctx.beginPath();
      ctx.roundRect(48, -98, 64, 8, 3);
      SpriteBank.fillAndStroke(ctx, '#475569', '#0f172a', 1.8);

      // Cabina principal 1.6x (132 x 94 px, roja y amarilla canaria con banda azul)
      ctx.beginPath();
      ctx.roundRect(14, -94, 132, 94, [14, 14, 10, 10]);
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 2.8);

      // Banda amarilla canaria inferior + franja azul + rótulo TEIDE · CANARIAS
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(16, -32, 128, 30, [0, 0, 9, 9]);
      ctx.clip();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(14, -32, 132, 32);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, -32, 132, 6);
      ctx.restore();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 11.5px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TEIDE · CANARIAS', 80, -10.5);

      // Amplio ventanal panorámico acristalado (116 x 50 px) con capacidad cómoda para los 3 héroes
      ctx.beginPath();
      ctx.roundRect(22, -85, 116, 50, 7);
      const glassGrad = ctx.createLinearGradient(0, -85, 0, -35);
      glassGrad.addColorStop(0, '#bae6fd');
      glassGrad.addColorStop(1, '#0284c7');
      SpriteBank.fillAndStroke(ctx, glassGrad, '#0f172a', 2.0);

      // Montantes verticales sutiles del ventanal panorámico
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(58, -85, 3, 50);
      ctx.fillRect(99, -85, 3, 50);

      // Pasajeros (Nico, Andrea y La Tina) celebrando cómodamente tras el cristal del teleférico
      if (hasPassengers) {
        // Nico (izquierda)
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.roundRect(33, -49, 18, 13, 4);
        ctx.fill();
        ctx.fillStyle = '#f5cfa0';
        ctx.beginPath();
        ctx.arc(42, -57, 8.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3b2416';
        ctx.beginPath();
        ctx.arc(42, -61.5, 8.6, Math.PI, Math.PI * 2);
        ctx.fill();

        // Andrea (centro)
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.roundRect(71, -48, 18, 12, 4);
        ctx.fill();
        ctx.fillStyle = '#fde0c2';
        ctx.beginPath();
        ctx.arc(80, -56.5, 7.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(80, -61, 8.4, Math.PI, Math.PI * 2);
        ctx.fill();

        // La Tina (derecha, mirando orgullosa por la ventana)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(108, -46, 16, 10, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(116, -54.5, 7.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(118.5, -52.5, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(117.5, -47, 3, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(110, -45.5, 12, 2.5);
      }

      // Reflejo diagonal en el ventanal
      ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
      ctx.beginPath();
      ctx.moveTo(27, -82);
      ctx.lineTo(44, -82);
      ctx.lineTo(31, -38);
      ctx.lineTo(24, -38);
      ctx.closePath();
      ctx.fill();

      // Amplia puerta central corrediza a ras de acceso (translúcida al abrir para ver entrar andando)
      if (doorsOpen) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.42)';
        ctx.fillRect(58, -86, 44, 82);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(58, -86, 44, 82);
      } else {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(80, -85);
        ctx.lineTo(80, -35);
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();
    }

    /**
     * ENEMIGO CANARIAS: Lagarto Gigante Canario (Gallotia)
     */
    drawGallotiaLizardHD(ctx, enemy, time) {
      const w = enemy.w || 44;
      const h = enemy.h || 26;
      const facingRight = enemy.facing !== 'left' && enemy.vx >= 0;
      const scuttleSpeed = enemy.isCharging ? 28 : 14;
      const legWave = Math.sin(time * scuttleSpeed + enemy.x * 0.12);
      const tailWave = Math.sin(time * 9 + enemy.x * 0.08) * 3.5;

      ctx.save();
      ctx.translate(enemy.x + w / 2, enemy.y + h);
      if (!facingRight) ctx.scale(-1, 1);

      // Sombra proyectada
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(-2, 0, w * 0.56, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura de embestida veloz
      if (enemy.isCharging) {
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.72)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-26, -15);
        ctx.lineTo(-42, -16);
        ctx.moveTo(-24, -8);
        ctx.lineTo(-38, -8);
        ctx.stroke();
      }

      // Cola articulada larga rayando la arena/roca
      ctx.beginPath();
      ctx.moveTo(-12, -9);
      ctx.quadraticCurveTo(-28, -11 + tailWave, -39, -5 + tailWave * 0.7);
      ctx.quadraticCurveTo(-27, -4 + tailWave * 0.6, -11, -5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#4d7c0f', '#0f172a', 1.8);

      // Patas traseras y delanteras ágiles
      SpriteBank.drawCapsule(ctx, -10, -7, -14 + legWave * 5, -1, 2.3, '#65a30d', '#0f172a', 1.4);
      SpriteBank.drawCapsule(ctx, 10, -7, 13 - legWave * 5, -1, 2.3, '#65a30d', '#0f172a', 1.4);

      // Cuerpo escamoso robusto (verde oliva oscuro y dorso dorado)
      const bodyGrad = ctx.createLinearGradient(-15, -20, 15, -4);
      bodyGrad.addColorStop(0, '#84cc16');
      bodyGrad.addColorStop(1, '#3f6212');
      ctx.beginPath();
      ctx.ellipse(0, -10, 16.5, 7.5, -0.05, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#0f172a', 2.0);

      // Manchas oceladas azul cobalto (típicas de Gallotia canario)
      [-7, 0, 7].forEach((ox) => {
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(ox, -10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ox - 0.5, -10.5, 1.0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cresta dorsal baja dentada
      ctx.fillStyle = '#eab308';
      for (let cx = -11; cx <= 9; cx += 5) {
        ctx.beginPath();
        ctx.moveTo(cx - 2, -16);
        ctx.lineTo(cx, -20);
        ctx.lineTo(cx + 2, -16);
        ctx.closePath();
        ctx.fill();
      }

      // Cabeza triangular sauriana y lengua bífida
      ctx.beginPath();
      ctx.moveTo(10, -15);
      ctx.quadraticCurveTo(22, -18, 25, -11);
      ctx.quadraticCurveTo(21, -5, 11, -7);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#65a30d', '#0f172a', 1.9);

      // Ojo ámbar fiero con pupila vertical
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(17.5, -12.5, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(17.2, -14.2, 1.2, 3.4);

      // Lengua bífida roja al embestir o patrullar
      if (enemy.isCharging || Math.sin(time * 7 + enemy.x) > 0.35) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(25, -10);
        ctx.lineTo(31, -10);
        ctx.lineTo(34, -12.5);
        ctx.moveTo(31, -10);
        ctx.lineTo(34, -7.5);
        ctx.stroke();
      }

      // Señal de alerta cuando detecta al jugador
      if (enemy.isCharging) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 16, -24);
      }

      ctx.restore();
    }

    /**
     * EVENTO ÚNICO PARK GÜELL: La Salamandra / Lagartija de Trencadís de Gaudí ("El Drac")
     * Mosaicos multicolor en azul cobalto, turquesa, naranja, amarillo dorado y blanco con contorno nítido.
     */
    drawGaudiLizardHD(ctx, enemy, time) {
      const w = enemy.w || 56;
      const h = enemy.h || 30;
      const facingRight = enemy.facing !== 'left';
      const isEscaping = enemy.state === 'escaping';
      const runFreq = isEscaping ? 34 : 26;
      const legWave = Math.sin(time * runFreq + enemy.x * 0.14);
      const tailWave = Math.sin(time * 12 + enemy.x * 0.1) * 4.2;

      ctx.save();
      ctx.translate(enemy.x + w / 2, enemy.y + h);
      if (!facingRight) ctx.scale(-1, 1);

      // Sombra y halo dorado sutil del evento especial 1UP
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.56, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Estelas de gran velocidad detrás de la salamandra
      ctx.strokeStyle = isEscaping ? 'rgba(248, 113, 113, 0.82)' : 'rgba(250, 204, 21, 0.72)';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(-26, -18);
      ctx.lineTo(-46, -19);
      ctx.moveTo(-28, -11);
      ctx.lineTo(-44, -11);
      ctx.moveTo(-25, -5);
      ctx.lineTo(-39, -5);
      ctx.stroke();

      // Cola sinuosa revestida de mortero blanco y escamas de trencadís
      ctx.beginPath();
      ctx.moveTo(-14, -11);
      ctx.quadraticCurveTo(-31, -15 + tailWave, -43, -7 + tailWave * 0.75);
      ctx.quadraticCurveTo(-29, -4 + tailWave * 0.55, -13, -5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#090d16', 2.0);
      const tailTiles = [
        { x: -37, y: -8.5 + tailWave * 0.65, r: 3.1, c: '#2563eb' },
        { x: -31, y: -10 + tailWave * 0.5, r: 3.4, c: '#f97316' },
        { x: -24, y: -9.5 + tailWave * 0.35, r: 3.5, c: '#06b6d4' },
        { x: -18, y: -8.5 + tailWave * 0.2, r: 3.4, c: '#facc15' }
      ];
      tailTiles.forEach((t) => {
        ctx.fillStyle = t.c;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });

      // Patas traseras (fondo) y delanteras articuladas con teselas azules y naranjas
      SpriteBank.drawCapsule(ctx, -12, -8, -17 - legWave * 5, -1, 2.7, '#2563eb', '#090d16', 1.6);
      SpriteBank.drawCapsule(ctx, 11, -8, 16 + legWave * 5, -1, 2.7, '#06b6d4', '#090d16', 1.6);

      // Cuerpo escultural arqueado estilo El Drac con base cerámica blanca y contorno nítido
      ctx.beginPath();
      ctx.moveTo(-19, -7);
      ctx.quadraticCurveTo(-15, -22, 0, -21);
      ctx.quadraticCurveTo(13, -21, 18, -12);
      ctx.lineTo(14, -4);
      ctx.quadraticCurveTo(0, -3, -19, -7);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#090d16', 2.1);

      // Mosaicos fragmentados de trencadís multicolor (azul cobalto, turquesa, naranja, amarillo dorado y blanco)
      const mosaicTiles = [
        [[-14, -14], [-8, -17], [-6, -10], [-13, -8], '#2563eb'],
        [[-7, -18], [1, -19], [2, -12], [-5, -11], '#facc15'],
        [[2, -19], [10, -18], [9, -11], [3, -12], '#06b6d4'],
        [[-11, -10], [-4, -10], [-3, -5], [-10, -5], '#f97316'],
        [[-2, -11], [6, -11], [5, -5], [-2, -5], '#22d3ee'],
        [[6, -12], [13, -13], [13, -6], [6, -6], '#facc15'],
        [[10, -17], [16, -15], [14, -10], [9, -11], '#1d4ed8']
      ];
      for (let i = 0; i < mosaicTiles.length; i++) {
        const [p0, p1, p2, p3, col] = mosaicTiles[i];
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.05;
        ctx.stroke();
      }

      // Cresta dorsal de escamas cerámicas doradas/naranjas/blancas
      const spineColors = ['#facc15', '#ffffff', '#f97316', '#06b6d4', '#facc15'];
      for (let si = 0; si < spineColors.length; si++) {
        const sx = -10 + si * 5.2;
        ctx.fillStyle = spineColors[si];
        ctx.beginPath();
        ctx.moveTo(sx - 2.3, -19);
        ctx.lineTo(sx, -24.5);
        ctx.lineTo(sx + 2.3, -19);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // Cabeza icónica de salamandra modernista con teselas turquesas, cobalto y naranja
      ctx.beginPath();
      ctx.moveTo(12, -18);
      ctx.quadraticCurveTo(25, -22, 30, -13);
      ctx.quadraticCurveTo(26, -5, 13, -6);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#06b6d4', '#090d16', 2.0);

      // Parches azul cobalto, naranja y dorado en cabeza y morro
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(14, -17, 6, 5);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(21, -15, 6, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, -11, 5, 4);

      // Ojo expresivo dorado con pupila oscura nítida
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(20.5, -14.5, 2.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(21.1, -14.5, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Patas frontales alternadas (superpuestas) con garras blancas
      SpriteBank.drawCapsule(ctx, -9, -7, -6 + legWave * 5.5, -0.5, 2.6, '#f97316', '#090d16', 1.5);
      SpriteBank.drawCapsule(ctx, 13, -7, 17 - legWave * 5.5, -0.5, 2.6, '#facc15', '#090d16', 1.5);

      ctx.restore();

      // Indicador nítido de pasadas restantes sobre la salamandra mientras corre
      if (enemy.state === 'running' && !enemy.dead) {
        const curPass = Math.min(enemy.maxPasses || 3, (enemy.passesCompleted || 0) + 1);
        const cx = enemy.x + w * 0.5;
        const cy = enemy.y - 12;
        ctx.save();
        ctx.font = '900 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.beginPath();
        ctx.roundRect(cx - 28, cy - 9, 56, 15, 6);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`❤️ ${curPass}/${enemy.maxPasses || 3}`, cx, cy + 2);
        ctx.restore();
      }
    }

    /**
     * ENEMIGO CANARIAS: Abubilla Canaria (Tabobo) con cresta de abanico y picada diagonal
     */
    drawCanarianHoopoeHD(ctx, enemy, time) {
      const w = enemy.w || 38;
      const h = enemy.h || 28;
      const cx = enemy.x + w / 2;
      const cy = enemy.y + h / 2;
      const isSwarm = !!enemy.isSwarm;
      const isDiving = !!enemy.isDiving;
      const facingRight = enemy.vx >= 0;
      const wingFlap = Math.sin(time * (isDiving ? 28 : 18) + enemy.x * 0.08);
      const diveTilt = isDiving ? 0.38 : Math.max(-0.22, Math.min(0.22, (enemy.vy || 0) * 0.0012));

      ctx.save();
      ctx.translate(cx, cy);
      if (!facingRight) ctx.scale(-1, 1);
      ctx.rotate(diveTilt);

      // Cola trasera barrada blanco/negro
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-24, -4);
      ctx.lineTo(-23, 5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#090d16', 1.6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-20, -2, 5, 4.5);

      // Cresta en abanico característica de la Abubilla con puntas negras y blancas
      const crestCount = 5;
      for (let i = 0; i < crestCount; i++) {
        const ang = -1.25 + i * 0.32;
        const fx = 6 + Math.cos(ang) * 14;
        const fy = -8 + Math.sin(ang) * 14;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(4, -7);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        ctx.strokeStyle = isSwarm ? '#fb7185' : '#f97316';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(4, -7);
        ctx.lineTo(6 + Math.cos(ang) * 10.5, -8 + Math.sin(ang) * 10.5);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(6 + Math.cos(ang) * 11.2, -8 + Math.sin(ang) * 11.2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cuerpo cálido canela / naranja canario
      const bodyGrad = ctx.createLinearGradient(-12, -8, 12, 8);
      bodyGrad.addColorStop(0, isSwarm ? '#fb7185' : '#fdba74');
      bodyGrad.addColorStop(1, isSwarm ? '#e11d48' : '#ea580c');
      ctx.beginPath();
      ctx.ellipse(0, 1, 13, 8, -0.1, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#0f172a', 1.8);

      // Cabeza redondeada y pico largo fino curvado hacia abajo
      ctx.beginPath();
      ctx.arc(10, -4, 6.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, isSwarm ? '#f43f5e' : '#f97316', '#0f172a', 1.8);

      ctx.beginPath();
      ctx.moveTo(15, -5.5);
      ctx.quadraticCurveTo(23, -3.5, 29, 0.5);
      ctx.quadraticCurveTo(22, -1, 15, -2.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#0f172a', 1.5);

      // Ojo intenso
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, -5.2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(12.6, -5.2, 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Ala con franjas blancas y negras animada
      ctx.save();
      ctx.translate(-1, -1);
      ctx.rotate(isDiving ? -0.35 : wingFlap * 0.58);
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(-10, -14, 5, -11);
      ctx.quadraticCurveTo(10, -3, 2, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#0f172a', 1.6);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5, -8, 9, 2.5);
      ctx.fillRect(-3, -4, 7, 2.2);
      ctx.restore();

      // Estela de velocidad en picada
      if (isDiving) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-18, -8);
        ctx.lineTo(-30, -16);
        ctx.moveTo(-20, 4);
        ctx.lineTo(-32, -3);
        ctx.stroke();
      }

      ctx.restore();
    }

    /**
     * ENEMIGO CANARIAS: Cangrejo Ciego de Timanfaya (BlindCrab - Albino Acorazado)
     * - Caparazón blanco blindado (inmune a pisotón desde arriba y al ladrido)
     */
    drawBlindCrabHD(ctx, enemy, time) {
      const w = enemy.w || 40;
      const h = enemy.h || 28;
      const cx = enemy.x + w / 2;
      const scuttle = Math.sin(time * 13 + enemy.x * 0.14);
      const armorPulse = 0.72 + Math.sin(time * 5) * 0.25;

      ctx.save();
      ctx.translate(cx, enemy.y + h);

      // Sombra proyectada
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.52, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3 pares de patas pálidas articuladas
      for (let i = 0; i < 3; i++) {
        const yOff = -7 + i * 1.5;
        const wOff = scuttle * (i % 2 === 0 ? 3 : -3);
        SpriteBank.drawCapsule(ctx, -11, yOff, -19, -1 + wOff, 2.1, '#cbd5e1', '#0f172a', 1.4);
        SpriteBank.drawCapsule(ctx, 11, yOff, 19, -1 - wOff, 2.1, '#cbd5e1', '#0f172a', 1.4);
      }

      // Pinzas gruesas acorazadas
      const clawSnap = Math.abs(Math.sin(time * 6 + enemy.x * 0.05)) * 4;
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.arc(side * 16, -15 - clawSnap * 0.2, 5.8, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#f8fafc', '#0f172a', 1.8);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(side * 16, -18);
        ctx.lineTo(side * 19, -22 - clawSnap * 0.4);
        ctx.stroke();
      });

      // Caparazón: blindado intacto vs coraza partida/agrietada vulnerable al salto
      if (!enemy.shellBroken) {
        const shellGrad = ctx.createRadialGradient(-3, -15, 3, 0, -11, 17);
        shellGrad.addColorStop(0, '#ffffff');
        shellGrad.addColorStop(0.65, '#e2e8f0');
        shellGrad.addColorStop(1, '#94a3b8');
        ctx.beginPath();
        ctx.ellipse(0, -11, 15.5, 9.5, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, shellGrad, '#0f172a', 2.2);

        // Púas dorsales protectoras contra pisotones
        [-8, 0, 8].forEach((sx, idx) => {
          ctx.beginPath();
          ctx.moveTo(sx - 3, -18);
          ctx.lineTo(sx, idx === 1 ? -25 : -23);
          ctx.lineTo(sx + 3, -18);
          ctx.closePath();
          SpriteBank.fillAndStroke(ctx, '#f1f5f9', '#0f172a', 1.5);
        });

        // Brillo metálico de coraza inmune
        ctx.strokeStyle = `rgba(167, 139, 250, ${armorPulse.toFixed(2)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, -11, 12.5, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        // Coraza partida: dorso blando naranja/rosado expuesto y placas laterales agrietadas
        const softGrad = ctx.createRadialGradient(0, -12, 2, 0, -10, 14);
        softGrad.addColorStop(0, '#fed7aa');
        softGrad.addColorStop(0.65, '#fb923c');
        softGrad.addColorStop(1, '#ea580c');
        ctx.beginPath();
        ctx.ellipse(0, -10.5, 13.8, 8.2, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, softGrad, '#7c2d12', 1.9);

        // Restos rotos de caparazón a los lados con grieta dentada
        ctx.beginPath();
        ctx.ellipse(-9, -10, 6.2, 6.8, -0.25, Math.PI * 0.4, Math.PI * 1.6);
        SpriteBank.fillAndStroke(ctx, '#e2e8f0', '#0f172a', 1.6);
        ctx.beginPath();
        ctx.ellipse(9, -10, 6.2, 6.8, 0.25, -Math.PI * 0.6, Math.PI * 0.6);
        SpriteBank.fillAndStroke(ctx, '#e2e8f0', '#0f172a', 1.6);

        // Grieta oscura profunda central en zig-zag
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-2, -18);
        ctx.lineTo(2, -14);
        ctx.lineTo(-2.5, -10);
        ctx.lineTo(2, -5);
        ctx.stroke();
      }

      if (enemy.hitFlashTimer > 0 && Math.floor(enemy.hitFlashTimer * 36) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
        ctx.beginPath();
        ctx.ellipse(0, -11, 17, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Antenas táctiles y pedúnculos ciegos sin pupila
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4, -15);
      ctx.quadraticCurveTo(-7, -23, -12, -25);
      ctx.moveTo(4, -15);
      ctx.quadraticCurveTo(7, -23, 12, -25);
      ctx.stroke();

      [-3.5, 3.5].forEach((ex) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ex, -13, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    }

    /**
     * OBSTÁCULO CANARIAS (TIMANFAYA): Géiser de vapor volcánico intermitente
     */
    drawVolcanicGeyserHD(ctx, geyser, time) {
      const gx = geyser.x + (geyser.w || 36) / 2;
      const gy = geyser.y;
      const kind = geyser.kind || 'steam';
      const isWater = kind === 'water_spout';
      const isLava = kind === 'lava_spout';
      const isWarning = geyser.state === 'warning';
      const isErupting = geyser.state === 'erupting';
      const shakeX = isWarning ? Math.sin(time * 42) * 1.8 : 0;

      ctx.save();
      ctx.translate(gx + shakeX, gy);

      // Resplandor subterráneo / marino según tipo de chorro vertical
      if (isWarning || isErupting) {
        const glowR = isErupting ? 34 : 26;
        const magGrad = ctx.createRadialGradient(0, -4, 4, 0, -4, glowR);
        if (isWater) {
          magGrad.addColorStop(0, 'rgba(56, 189, 248, 0.72)');
          magGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        } else if (isLava) {
          magGrad.addColorStop(0, 'rgba(244, 63, 94, 0.82)');
          magGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
        } else {
          magGrad.addColorStop(0, 'rgba(251, 146, 60, 0.72)');
          magGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        }
        ctx.fillStyle = magGrad;
        ctx.beginPath();
        ctx.arc(0, -4, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Columna de vapor / chorro de océano / géiser de magma al erupcionar
      if (isErupting && geyser.currentHeight > 6) {
        const ch = geyser.currentHeight;
        const steamGrad = ctx.createLinearGradient(0, -ch, 0, -4);
        if (isWater) {
          steamGrad.addColorStop(0, 'rgba(240, 249, 255, 0.82)');
          steamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.90)');
          steamGrad.addColorStop(1, 'rgba(2, 132, 199, 0.96)');
        } else if (isLava) {
          steamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.92)');
          steamGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.94)');
          steamGrad.addColorStop(1, 'rgba(185, 28, 28, 0.98)');
        } else {
          steamGrad.addColorStop(0, 'rgba(224, 242, 254, 0.25)');
          steamGrad.addColorStop(0.5, 'rgba(241, 245, 249, 0.78)');
          steamGrad.addColorStop(1, 'rgba(255, 255, 255, 0.94)');
        }

        const colW = 14 + Math.sin(time * 24) * 2.5;
        ctx.beginPath();
        ctx.moveTo(-8, -6);
        ctx.quadraticCurveTo(-colW, -ch * 0.55, -colW * 1.15, -ch);
        ctx.lineTo(colW * 1.15, -ch);
        ctx.quadraticCurveTo(colW, -ch * 0.55, 8, -6);
        ctx.closePath();
        ctx.fillStyle = steamGrad;
        ctx.fill();

        // Gotas, burbujas o chispas ascendentes
        for (let i = 0; i < 6; i++) {
          const frac = ((time * 2.2 + i * 0.17) % 1);
          const py = -8 - frac * (ch - 6);
          const px = Math.sin(time * 12 + i * 2.1) * (5 + frac * 8);
          const rad = (isWater || isLava ? 4.5 : 7) + frac * (isWater || isLava ? 5.5 : 11);
          const particleColor = isWater
            ? `rgba(224, 242, 254, ${(0.88 * (1 - frac * 0.65)).toFixed(2)})`
            : isLava
              ? `rgba(253, 224, 71, ${(0.92 * (1 - frac * 0.55)).toFixed(2)})`
              : `rgba(255, 255, 255, ${(0.72 * (1 - frac * 0.75)).toFixed(2)})`;
          ctx.fillStyle = particleColor;
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (isWarning) {
        // Burbujeo previo de advertencia en el cráter o rompeolas
        for (let i = 0; i < 3; i++) {
          const wobble = Math.sin(time * 22 + i * 1.9);
          ctx.fillStyle = isWater
            ? 'rgba(186, 230, 253, 0.9)'
            : isLava
              ? 'rgba(251, 146, 60, 0.92)'
              : 'rgba(254, 215, 170, 0.82)';
          ctx.beginPath();
          ctx.arc(wobble * 8, -12 - i * 8, 5 + i * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Base: chorro de rompeolas turquesa/piedra o boca de cráter volcánico
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-15, -13);
      ctx.lineTo(-5, -10);
      ctx.lineTo(6, -12);
      ctx.lineTo(15, -13);
      ctx.lineTo(22, 0);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, isWater ? '#0369a1' : isLava ? '#450a0a' : '#292524', '#0f172a', 2.0);

      // Núcleo caliente / espuma azul del respiradero
      ctx.fillStyle = isWater
        ? (isErupting ? '#ffffff' : isWarning ? '#7dd3fc' : '#0284c7')
        : isLava
          ? (isErupting ? '#fef08a' : isWarning ? '#fb7185' : '#b91c1c')
          : (isErupting ? '#ffffff' : isWarning ? '#fb923c' : '#7c2d12');
      ctx.beginPath();
      ctx.ellipse(0, -10.5, 9.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    /**
     * SPRITE EXCLUSIVO MAPA MUNDI: La Tinita pilotando una avioneta clásica biplano
     * con hélice giratoria, antiparras de aviador, bufanda ondeante y estelas de aire.
     */
    drawTinaBiplane(ctx, x, y, time, dir = -1, opts = {}) {
      const facing = dir >= 0 ? 1 : -1;
      const sc = opts.scale !== undefined ? opts.scale : 1;
      const pitch = opts.pitch || 0;
      const bob = opts.bob !== undefined ? opts.bob : Math.sin(time * 5.2) * 2.2;
      const isTurbo = !!opts.turbo;
      const propSpeed = opts.propSpeed !== undefined ? opts.propSpeed : (isTurbo ? 68 : 38);
      const showContrails = opts.contrails !== false;
      const showPassengers = !!opts.passengers;

      ctx.save();
      ctx.translate(x, y + bob);
      ctx.scale(facing * sc, sc);
      ctx.rotate(pitch);

      // 1. Estelas blancas de aire/nubes en cola y puntas de alas (+ chorro turbo dorado con Shift)
      if (showContrails) {
        ctx.save();
        for (let w = 0; w < 2; w++) {
          const wy = w === 0 ? -12 : 4;
          const wx = -24;
          const wave = Math.sin(time * (isTurbo ? 20 : 12) + w * 2.1) * (isTurbo ? 2.2 : 1.6);
          const trailLen = isTurbo ? 58 : 36;
          const trailGrad = ctx.createLinearGradient(wx, wy, wx - trailLen, wy + wave);
          trailGrad.addColorStop(0, isTurbo ? 'rgba(253, 224, 71, 0.92)' : 'rgba(255, 255, 255, 0.72)');
          trailGrad.addColorStop(0.55, isTurbo ? 'rgba(251, 146, 60, 0.55)' : 'rgba(255, 255, 255, 0.32)');
          trailGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = isTurbo ? 3.2 : 2.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.quadraticCurveTo(wx - trailLen * 0.45, wy + wave, wx - trailLen, wy - wave * 0.6);
          ctx.stroke();
        }
        // Llama y estela rizada de la cola
        if (isTurbo) {
          const flameLen = 22 + Math.sin(time * 42) * 5;
          const fGrad = ctx.createLinearGradient(-23, 0, -23 - flameLen, 0);
          fGrad.addColorStop(0, '#ffffff');
          fGrad.addColorStop(0.28, '#fde047');
          fGrad.addColorStop(0.7, '#f97316');
          fGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.moveTo(-23, -3.6);
          ctx.lineTo(-23 - flameLen, Math.sin(time * 38) * 1.8);
          ctx.lineTo(-23, 3.6);
          ctx.closePath();
          ctx.fill();
        }
        const puffCount = isTurbo ? 5 : 3;
        for (let i = 0; i < puffCount; i++) {
          const ph = ((time * (isTurbo ? 4.4 : 2.8) + i / puffCount) % 1);
          ctx.fillStyle = isTurbo
            ? `rgba(253, 224, 71, ${(0.72 * (1 - ph)).toFixed(2)})`
            : `rgba(255, 255, 255, ${(0.55 * (1 - ph)).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(-28 - ph * (isTurbo ? 42 : 26), -3 + Math.sin(time * 9 + i) * 2.5, (isTurbo ? 2.8 : 2.2) + ph * 3.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Tren de aterrizaje clásico (puntales + ruedita)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(4, 7);
      ctx.lineTo(7, 15);
      ctx.moveTo(12, 6);
      ctx.lineTo(7, 15);
      ctx.moveTo(-18, 4);
      ctx.lineTo(-21, 9);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7, 16, 4.2, 0, Math.PI * 2);
      ctx.arc(-21, 10, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(7, 16, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Ala trasera / estabilizador vertical (madera roja y crema)
      ctx.beginPath();
      ctx.moveTo(-17, -1);
      ctx.lineTo(-25, -13);
      ctx.quadraticCurveTo(-28, -14, -27, -2);
      ctx.lineTo(-21, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 1.7);

      // 4. Bufanda larga roja/celeste ondeando hacia atrás desde la cabina abierta
      const scarfPts = [];
      for (let s = 0; s <= 5; s++) {
        const sx = -2 - s * 4.8;
        const sy = -9.5 + Math.sin(time * 16 - s * 1.1) * (1.2 + s * 0.55);
        scarfPts.push({ x: sx, y: sy });
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(scarfPts[0].x, scarfPts[0].y);
      for (let s = 1; s < scarfPts.length; s++) ctx.lineTo(scarfPts[s].x, scarfPts[s].y);
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(scarfPts[0].x, scarfPts[0].y + 0.8);
      for (let s = 1; s < scarfPts.length; s++) ctx.lineTo(scarfPts[s].x, scarfPts[s].y + 0.8);
      ctx.stroke();

      // 5. Fuselaje vintage de madera barnizada y morro metálico
      const woodGrad = ctx.createLinearGradient(-22, -7, 16, 8);
      woodGrad.addColorStop(0, '#92400e');
      woodGrad.addColorStop(0.5, '#d97706');
      woodGrad.addColorStop(1, '#b45309');
      ctx.beginPath();
      ctx.moveTo(-24, 1);
      ctx.quadraticCurveTo(-14, -7, 15, -7);
      ctx.lineTo(18, -5);
      ctx.lineTo(18, 6);
      ctx.quadraticCurveTo(-8, 9, -24, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, woodGrad, '#0f172a', 2.0);

      // Franja roja de aviación y estrellita dorada en el lateral
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-16, -2.5, 28, 3.2);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-11, -1, 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Capó delantero de aluminio remachado
      const metalGrad = ctx.createLinearGradient(13, -7, 22, 6);
      metalGrad.addColorStop(0, '#e2e8f0');
      metalGrad.addColorStop(1, '#64748b');
      ctx.beginPath();
      ctx.roundRect(12, -6.5, 9, 12.5, 3);
      SpriteBank.fillAndStroke(ctx, metalGrad, '#0f172a', 1.8);

      // 6. Cabina abierta con Nico, Andrea (si embarcaron) y La Tinita piloto con gafas de aviador
      if (showPassengers) {
        // Cabina trasera para Nico & Andrea (disfrutando el paseo junto a La Tinita)
        ctx.save();
        ctx.translate(-9.5, -5.8);
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8.8, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pasajero trasero 1: Andrea (cabello castaño + camperita rosa)
        ctx.beginPath();
        ctx.roundRect(-7.5, -7.2, 7.2, 7.2, 2.5);
        SpriteBank.fillAndStroke(ctx, '#ec4899', '#090d16', 1.3);
        ctx.beginPath();
        ctx.arc(-4.2, -10.5, 4.3, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fde68a', '#090d16', 1.3);
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.arc(-5.4, -11.4, 3.8, Math.PI * 0.65, Math.PI * 2.05);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(-8.0, -10.8, 3.2, 5.2, 1.4);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(-2.5, -10.6, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pasajero trasero 2: Nico (cabello oscuro + buzo azul)
        ctx.beginPath();
        ctx.roundRect(0.2, -7.5, 7.5, 7.5, 2.5);
        SpriteBank.fillAndStroke(ctx, '#2563eb', '#090d16', 1.3);
        ctx.beginPath();
        ctx.arc(4.0, -10.8, 4.4, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fed7aa', '#090d16', 1.3);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(3.6, -12.4, 4.1, Math.PI * 0.9, Math.PI * 2.15);
        ctx.fill();
        ctx.fillStyle = '#7dd3fc';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(5.8, -10.8, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(showPassengers ? 5.5 : 1, -6);
      // Borde acolchado de cuero de la cabina
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cabecita peluda de La Tinita (estilo Spitz/Pomerania oscuro como drawTinaHD)
      ctx.beginPath();
      ctx.arc(1, -6, 6.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.7);

      // Orejitas puntiagudas asomando
      ctx.beginPath();
      ctx.moveTo(-3.5, -10);
      ctx.lineTo(-4.8, -15.5);
      ctx.lineTo(0, -11.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.4);

      ctx.beginPath();
      ctx.moveTo(2.2, -10.5);
      ctx.lineTo(4.2, -15.5);
      ctx.lineTo(5.6, -9.8);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.4);

      // Hocico simpático y trufa
      ctx.beginPath();
      ctx.ellipse(6.2, -4.6, 3.2, 2.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#334155', '#090d16', 1.3);
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(8.6, -5.2, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Cinta y gafas/antiparras de aviador sobre los ojos
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-5.0, -7.2);
      ctx.lineTo(4.8, -7.4);
      ctx.stroke();

      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(3.8, -7.4, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.arc(4.0, -7.4, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4.6, -8.0, 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Parabrisas inclinado de la cabina
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(6.5, -6.5);
      ctx.lineTo(4.5, -11.5);
      ctx.stroke();

      // 7. Alas dobles del biplano (ala inferior, montantes y ala superior)
      ctx.beginPath();
      ctx.roundRect(-2, 1.5, 16, 4.5, 2.2);
      SpriteBank.fillAndStroke(ctx, '#fef3c7', '#78350f', 1.6);

      // Montantes entre las dos alas
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(3, -15);
      ctx.moveTo(11, 2);
      ctx.lineTo(12, -15);
      ctx.stroke();

      // Ala superior
      ctx.beginPath();
      ctx.roundRect(-4, -18.5, 21, 4.8, 2.4);
      SpriteBank.fillAndStroke(ctx, '#fef9c3', '#78350f', 1.7);

      // 8. Hélice frontal girando continuamente + disco traslúcido
      const propLen = 11.5 * Math.sin(time * propSpeed);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.34)';
      ctx.beginPath();
      ctx.ellipse(23.5, -0.5, 2.6, 12.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(23.5, -0.5 - propLen);
      ctx.lineTo(23.5, -0.5 + propLen);
      ctx.stroke();

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(23.5, -0.5 - propLen * 0.92);
      ctx.lineTo(23.5, -0.5 + propLen * 0.92);
      ctx.stroke();

      // Cono rojo central de la hélice
      ctx.beginPath();
      ctx.arc(22.5, -0.5, 3.0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 1.4);

      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // BUENOS AIRES: FAUNA URBANA Y MECÁNICAS DE ZONA (HD)
    // ------------------------------------------------------------------------
    drawTrapitoHD(ctx, e, time) {
      ctx.save();
      const cx = Math.round(e.x + e.w * 0.5);
      const by = Math.round(e.y + e.h);
      const facing = e.facing === 'left' ? -1 : 1;
      const fleeing = Boolean(e.scaredFleeing);
      const bob = fleeing ? Math.abs(Math.sin(time * 12)) * -2.8 : Math.sin(time * 5) * 1.4;
      const stride = fleeing ? Math.sin(time * 12) * 7.5 : 0;

      ctx.translate(cx, by);
      ctx.save();
      ctx.scale(facing, e.isCrouching ? 0.58 : 1);

      // Piernas y zapatillas (zancada rápida si huye asustado)
      SpriteBank.drawCapsule(ctx, -4, -13, -5 - stride, -2, 3.3, '#1e293b', '#090d16', 1.8);
      SpriteBank.drawCapsule(ctx, 4, -13, 5 + stride, -2, 3.3, '#334155', '#090d16', 1.8);

      // Chaleco reflectante / buzo urbano
      ctx.beginPath();
      ctx.roundRect(-10, -29 + bob, 20, 17, 5);
      SpriteBank.fillAndStroke(ctx, '#84cc16', '#090d16', 2.0);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-9, -22 + bob, 18, 3.2);

      // Cabeza y gorra visera
      ctx.beginPath();
      ctx.arc(0, -35 + bob, 8.5, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fdba74', '#090d16', 1.9);
      ctx.beginPath();
      ctx.arc(-0.5, -38 + bob, 8.8, Math.PI, 0);
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#090d16', 1.7);
      ctx.fillRect(1, -39 + bob, 11, 3);

      // Ojos: muy abiertos de susto al huir, o decididos en patrulla
      if (fleeing) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2.5, -35 + bob, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(3.2, -35 + bob, 1.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(2, -36 + bob, 2.2, 2.6);
      }

      if (fleeing) {
        // Brazos levantados en pánico mientras corre
        const armWave = Math.sin(time * 14) * 3.5;
        SpriteBank.drawCapsule(ctx, -6, -25 + bob, -13, -34 + bob + armWave, 2.6, '#fdba74', '#090d16', 1.5);
        SpriteBank.drawCapsule(ctx, 7, -25 + bob, 14, -35 + bob - armWave, 2.6, '#fdba74', '#090d16', 1.5);
      } else {
        // Brazo y Trapo girando en círculo
        const spinAng = time * (e.swingActive ? 15 : 5.5);
        const handX = 8 + Math.cos(spinAng) * 5;
        const handY = -23 + bob + Math.sin(spinAng) * 5;
        SpriteBank.drawCapsule(ctx, 6, -24 + bob, handX, handY, 2.8, '#fdba74', '#090d16', 1.5);

        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(spinAng);
        ctx.fillStyle = e.swingActive ? '#ffffff' : '#e0f2fe';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, -7, 19, -2);
        ctx.quadraticCurveTo(13, 6, 0, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      if (fleeing) {
        const showAlert = e.scareAlertTimer > 0;
        if (showAlert) {
          SpriteBank.drawScaredAlertIcon(ctx, 0, Math.round(-56 + bob), time);
        }
        SpriteBank.drawComicSpeechBubble(
          ctx,
          0,
          showAlert ? -94 : -74,
          '¡Tranquilo amigo, no pasa nada!',
          { fill: '#fef9c3', font: 'bold 10px "Segoe UI", sans-serif', height: 19 }
        );
      } else if (e.bubbleTimer === undefined || Math.sin(time * 2.1 + e.x * 0.02) > -0.35) {
        // Bocadillo icónico: "¡Una monedita, loco!" centrado y fijo en píxeles enteros
        SpriteBank.drawComicSpeechBubble(ctx, 0, -68, '¡Una monedita, loco!');
      }

      ctx.restore();
    }

    _drawMotoChassisHD(ctx, time) {
      // Escape y humo veloz
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.beginPath();
      ctx.arc(-28 - (time * 30) % 10, -8, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Ruedas con giro
      [-15, 15].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, -8, 8, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 2.0);
        ctx.beginPath();
        ctx.arc(wx, -8, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fill();
      });

      // Chasis deportivo rojo/negro
      ctx.beginPath();
      ctx.moveTo(-21, -13);
      ctx.lineTo(14, -18);
      ctx.lineTo(20, -10);
      ctx.lineTo(-16, -8);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#ef4444', '#090d16', 2.0);

      // Manubrio y faro brillante
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(10, -17);
      ctx.lineTo(14, -27);
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(19, -21, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    drawMotochorroHD(ctx, e, time) {
      if (e.crashingFromBark) {
        // 1. La moto sola derrapa y se desvanece hacia adelante
        if (e.bikeAlpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, e.bikeAlpha));
          ctx.translate((e.bikeX || e.x) + e.w * 0.5, e.crashGroundY || (e.y + e.h));
          ctx.scale(e.bikeDir || 1, 1);
          ctx.rotate(-0.18);
          this._drawMotoChassisHD(ctx, time);
          ctx.restore();
        }

        // 2. El motochorro cae al suelo girando sin equilibrio
        ctx.save();
        ctx.translate(e.riderX, e.riderY);
        ctx.rotate(e.fallRotation || 0);
        SpriteBank.drawCapsule(ctx, -4, 4, -10, 14, 3.1, '#1e293b', '#090d16', 1.7);
        SpriteBank.drawCapsule(ctx, 4, 4, 10, 13, 3.1, '#334155', '#090d16', 1.7);
        SpriteBank.drawCapsule(ctx, -6, -6, -15, -13, 2.7, '#334155', '#090d16', 1.5);
        SpriteBank.drawCapsule(ctx, 6, -6, 15, -12, 2.7, '#334155', '#090d16', 1.5);
        ctx.beginPath();
        ctx.roundRect(-8, -11, 16, 17, 5);
        SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.8);
        ctx.beginPath();
        ctx.arc(0, -17, 8, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#0f172a', '#000000', 1.8);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-3, -19, 8, 4);
        ctx.restore();

        // 3. Ícono '!' de susto sobre la cabeza al caer
        if (e.scareAlertTimer > 0) {
          SpriteBank.drawScaredAlertIcon(ctx, e.riderX, e.riderY - 34, time);
        }
        return;
      }

      ctx.save();
      const cx = e.x + e.w * 0.5;
      const by = e.y + e.h;
      const facing = e.facing === 'left' ? -1 : 1;
      const bounce = Math.sin(time * 28) * 1.4;

      ctx.translate(cx, by + bounce);
      ctx.scale(facing, 1);

      this._drawMotoChassisHD(ctx, time);

      // Conductor inclinado con casco negro
      ctx.beginPath();
      ctx.roundRect(-8, -32, 14, 15, 5);
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.8);
      ctx.beginPath();
      ctx.arc(2, -37, 8, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#000000', 1.8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -39, 7.5, 4);

      ctx.restore();
    }

    drawBarrabravaHD(ctx, e, time) {
      ctx.save();
      const cx = e.x + e.w * 0.5;
      const by = e.y + e.h;
      const facing = e.facing === 'left' ? -1 : 1;
      const pulse = e.pulseTimer > 0 ? Math.sin(e.pulseTimer * 18) * 2.5 : 0;

      // Ondas expansivas visuales del bombo de murga
      if (e.soundWaves && e.soundWaves.length) {
        for (let i = 0; i < e.soundWaves.length; i++) {
          const wv = e.soundWaves[i];
          const alpha = Math.max(0, 1 - wv.r / wv.maxR);
          ctx.save();
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.85})`;
          ctx.lineWidth = 3.5 * alpha + 1;
          ctx.beginPath();
          ctx.arc(cx, e.y + e.h * 0.5, wv.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(250, 204, 21, ${alpha * 0.55})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, e.y + e.h * 0.5, wv.r * 0.82, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.translate(cx, by);
      ctx.scale(facing, e.isCrouching ? 0.58 : 1);

      // Piernas anchas
      SpriteBank.drawCapsule(ctx, -7, -14, -8, -2, 4.2, '#1e3a8a', '#090d16', 1.9);
      SpriteBank.drawCapsule(ctx, 7, -14, 8, -2, 4.2, '#1e3a8a', '#090d16', 1.9);

      // Camiseta celeste y blanca de hinchada
      ctx.beginPath();
      ctx.roundRect(-14, -36, 28, 24, 6);
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#090d16', 2.2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-10, -35, 5, 22);
      ctx.fillRect(0, -35, 5, 22);
      ctx.fillRect(9, -35, 4, 22);

      // Cabeza + vincha albiceleste
      ctx.beginPath();
      ctx.arc(0, -42, 8.8, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fdba74', '#090d16', 1.9);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-9, -47, 18, 4.2);

      if (e.hasDrum !== false) {
        // Bombo de murga al frente
        ctx.beginPath();
        ctx.roundRect(2 - pulse * 0.3, -29, 16 + pulse * 0.4, 15, 4);
        SpriteBank.fillAndStroke(ctx, '#facc15', '#090d16', 2.0);
        ctx.fillStyle = '#fefce8';
        ctx.fillRect(5, -27, 10, 11);
        // Palillo golpeando
        const stickAng = e.pulseTimer > 0 ? -0.55 : 0.25 + Math.sin(time * 6) * 0.15;
        ctx.save();
        ctx.translate(-3, -24);
        ctx.rotate(stickAng);
        SpriteBank.drawCapsule(ctx, 0, 0, 11, -3, 2.0, '#78350f', '#090d16', 1.2);
        ctx.beginPath();
        ctx.arc(12, -3, 3.0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#ffffff', '#090d16', 1.2);
        ctx.restore();
      } else {
        // Fase 2 (sin bombo): postura agresiva cuerpo a cuerpo con puños al frente
        const jab = Math.sin(time * 11) * 2.2;
        SpriteBank.drawCapsule(ctx, 8, -32, 16 + jab, -27, 3.2, '#fdba74', '#090d16', 1.5);
        ctx.beginPath();
        ctx.arc(17 + jab, -27, 4.2, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fca5a5', '#090d16', 1.4);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(1, -43);
        ctx.lineTo(6, -41);
        ctx.stroke();
      }

      if ((e.hitFlashTimer > 0 || e.hurtTimer > 0) && Math.floor((e.hitFlashTimer || e.hurtTimer) * 36) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.54)';
        ctx.beginPath();
        ctx.roundRect(-16, -50, 34, 50, 8);
        ctx.fill();
      }

      ctx.restore();
    }

    drawCanillitaHD(ctx, e, time) {
      ctx.save();
      const cx = e.x + e.w * 0.5;
      const by = e.y + e.h;
      const facing = e.facing === 'left' ? -1 : 1;
      const walk = Math.sin(time * 7) * 1.4;

      ctx.translate(cx, by);
      ctx.scale(facing, e.isCrouching ? 0.58 : 1);

      SpriteBank.drawCapsule(ctx, -5, -13, -5 + walk, -2, 3.2, '#334155', '#090d16', 1.8);
      SpriteBank.drawCapsule(ctx, 5, -13, 5 - walk, -2, 3.2, '#334155', '#090d16', 1.8);

      // Delantal de puesto de diarios
      ctx.beginPath();
      ctx.roundRect(-10, -30, 20, 18, 5);
      SpriteBank.fillAndStroke(ctx, '#1e40af', '#090d16', 2.0);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-7, -26, 14, 12);

      // Cabeza con boina clásica de canillita
      ctx.beginPath();
      ctx.arc(0, -36, 8.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fdba74', '#090d16', 1.9);
      ctx.beginPath();
      ctx.ellipse(-1, -42, 10, 4.2, -0.1, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#475569', '#090d16', 1.6);

      // Pila de diarios bajo el brazo
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.fillRect(-13, -24, 10, 8);
      ctx.strokeRect(-13, -24, 10, 8);

      // Brazo lanzando diario
      const throwPose = e.throwAnim > 0 ? -0.9 : 0.2;
      ctx.save();
      ctx.translate(6, -24);
      ctx.rotate(throwPose);
      SpriteBank.drawCapsule(ctx, 0, 0, 8, -4, 2.5, '#fdba74', '#090d16', 1.4);
      ctx.restore();

      ctx.restore();
    }

    drawNewspaperProjectileHD(ctx, x, y, w, h, animTimer) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(animTimer * 12);
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-9, -4.5, 18, 9, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillRect(-6, -1.5, 12, 1.8);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-1.5, -4.5, 3, 9);
      ctx.restore();
    }

    drawFatPigeonHD(ctx, x, y, facing, animTimer, isDisabled, isScaredFlying) {
      ctx.save();
      ctx.translate(x + 18, y + 14);
      ctx.scale(facing === 'left' ? -1.25 : 1.25, 1.25);
      const waddle = isScaredFlying ? 0 : Math.sin(animTimer * 8) * 1.4;

      // Patitas
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-4, 7);
      ctx.lineTo(-5 + waddle, 11);
      ctx.moveTo(4, 7);
      ctx.lineTo(5 - waddle, 11);
      ctx.stroke();

      // Cuerpo rechoncho de paloma de plaza porteña
      ctx.beginPath();
      ctx.ellipse(-1, 1, 13, 9.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, isDisabled ? '#94a3b8' : '#64748b', '#0f172a', 1.8);

      // Pecho iridiscente violeta/verde
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(6, -1, 5.5, 6.5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Ala
      const flap = isScaredFlying ? Math.sin(animTimer * 28) * 8 : Math.sin(animTimer * 6) * 1.2;
      ctx.beginPath();
      ctx.ellipse(-3, 0 - flap * 0.4, 8, 5, -0.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#cbd5e1', '#0f172a', 1.4);

      // Cabeza pequeña y pico
      ctx.beginPath();
      ctx.arc(9, -6, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#475569', '#0f172a', 1.6);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(13, -7);
      ctx.lineTo(18, -5.5);
      ctx.lineTo(13, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(10.5, -7, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    drawClotheslineRopeHD(ctx, rope, cameraX, time) {
      const x1 = rope.x1 - cameraX;
      const x2 = rope.x2 - cameraX;
      if (x2 < -40 || x1 > 1000) return;
      const y = rope.y;
      const midX = (x1 + x2) * 0.5;
      const sag = rope.sag || 14;

      ctx.save();
      // Postes de soporte en conventillos
      [x1, x2].forEach((px) => {
        SpriteBank.drawCapsule(ctx, px, y - 10, px, y + 36, 3.2, '#78350f', '#090d16', 1.8);
      });

      // Soga tensa con suave curvatura
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.quadraticCurveTo(midX, y + sag, x2, y);
      ctx.stroke();

      // Ropa colgada colorida mecida por el viento de La Boca
      const colors = rope.colors || ['#ef4444', '#38bdf8', '#facc15', '#4ade80', '#ec4899'];
      const count = Math.max(3, Math.floor((x2 - x1) / 36));
      for (let i = 1; i < count; i++) {
        const t = i / count;
        const u = 1 - t;
        const gx = u * u * x1 + 2 * u * t * midX + t * t * x2;
        const gy = u * u * y + 2 * u * t * (y + sag) + t * t * y;
        const sway = Math.sin(time * 3.4 + i * 1.1) * 0.14;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(sway);
        ctx.fillStyle = colors[i % colors.length];
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(-8, 1, 16, 17 + (i % 2) * 5, 2);
        ctx.fill();
        ctx.stroke();
        // Broche de madera
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-2, -3, 4, 5);
        ctx.restore();
      }
      ctx.restore();
    }

    drawSubwayVentHD(ctx, vent, cameraX, time) {
      const x = vent.x - cameraX;
      if (x + vent.w < -40 || x > 1000) return;
      const y = vent.y;
      if (vent.kind === 'flame') {
        this.drawVotiveFlameHD(ctx, vent, x, y, time);
        return;
      }
      ctx.save();
      // Rejilla metálica del Subte en la vereda
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y - 6, vent.w, 10, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = vent.active ? '#38bdf8' : '#64748b';
      for (let gx = x + 6; gx < x + vent.w - 4; gx += 7) {
        ctx.fillRect(gx, y - 4, 3, 6);
      }

      // Columna de viento ascendente
      if (vent.active) {
        const colH = vent.height || 185;
        const grad = ctx.createLinearGradient(x, y, x, y - colH);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
        grad.addColorStop(0.6, 'rgba(186, 230, 253, 0.18)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y - colH, vent.w - 4, colH);

        ctx.strokeStyle = 'rgba(224, 242, 254, 0.72)';
        ctx.lineWidth = 1.8;
        for (let s = 0; s < 4; s++) {
          const prog = ((time * 2.4 + s * 0.25) % 1);
          const sx = x + 8 + ((s * 13) % Math.max(8, vent.w - 16));
          const sy = y - prog * colH;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.sin(time * 10 + s) * 3, sy - 22);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // ROSARIO, ARGENTINA: sprites HD de fauna local, llamas votivas y bombos
    // ------------------------------------------------------------------------
    drawVotiveFlameHD(ctx, vent, x, y, time) {
      ctx.save();
      const cx = x + vent.w * 0.5;

      // Pebetero de piedra del Monumento
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 4);
      ctx.lineTo(x + vent.w - 2, y + 4);
      ctx.lineTo(x + vent.w - 8, y - 12);
      ctx.lineTo(x + 8, y - 12);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#d6d3d1', '#292524', 2.2);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(x + 6, y - 14, vent.w - 12, 4);

      if (vent.active) {
        // Resplandor térmico del fuego real (sin columna de corriente ascendente)
        const glow = ctx.createRadialGradient(cx, y - 28, 4, cx, y - 28, 34);
        glow.addColorStop(0, 'rgba(253, 224, 71, 0.48)');
        glow.addColorStop(0.55, 'rgba(249, 115, 22, 0.24)');
        glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, y - 28, 34, 0, Math.PI * 2);
        ctx.fill();

        // Chispas locales de la llama
        for (let s = 0; s < 5; s++) {
          const prog = (time * 2.1 + s * 0.2) % 1;
          const ex = cx + Math.sin(time * 7 + s * 2.1) * (vent.w * 0.26);
          const ey = y - 16 - prog * 40;
          ctx.globalAlpha = 1 - prog;
          ctx.fillStyle = s % 2 === 0 ? '#fde047' : '#fb923c';
          ctx.beginPath();
          ctx.arc(ex, ey, 2.0 - prog * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Llama votiva parpadeante
        const flick = Math.sin(time * 14) * 3;
        ctx.beginPath();
        ctx.moveTo(cx - 12, y - 12);
        ctx.quadraticCurveTo(cx - 14, y - 32 + flick, cx, y - 54 - flick);
        ctx.quadraticCurveTo(cx + 14, y - 32 - flick, cx + 12, y - 12);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#f97316', '#7c2d12', 1.8);
        ctx.beginPath();
        ctx.moveTo(cx - 6, y - 12);
        ctx.quadraticCurveTo(cx - 7, y - 26 - flick, cx, y - 38 + flick);
        ctx.quadraticCurveTo(cx + 7, y - 26 + flick, cx + 6, y - 12);
        ctx.closePath();
        ctx.fillStyle = '#fde047';
        ctx.fill();
      } else {
        ctx.fillStyle = '#44403c';
        ctx.beginPath();
        ctx.arc(cx, y - 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawCostaneraLightPoleHD(ctx, pole, cameraX, time) {
      const sx = pole.x - cameraX;
      if (sx < -80 || sx > 1040) return;
      const baseY = Number.isFinite(pole.baseY) ? pole.baseY : 460;
      const topY = Number.isFinite(pole.topY) ? pole.topY : 214;
      const shake =
        pole.shakeTimer > 0
          ? Math.sin(pole.shakeTimer * 52) * 3.5 * Math.min(1, pole.shakeTimer / 0.4)
          : 0;
      const topX = sx + shake;
      const midX = sx + shake * 0.45;
      const lampX = topX - 24;
      const lampY = topY + 6;

      ctx.save();
      // Pedestal / zócalo de hormigón y brida metálica anclada al suelo
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(sx - 9, baseY - 22, 18, 22, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 12, baseY - 6, 24, 6);
      ctx.strokeRect(sx - 12, baseY - 6, 24, 6);

      // Columna metálica gris oscura desde el suelo hasta lo alto de la farola
      ctx.beginPath();
      ctx.moveTo(sx - 5, baseY - 22);
      ctx.lineTo(midX - 4, (baseY + topY) * 0.5);
      ctx.lineTo(topX - 3.2, topY + 6);
      ctx.lineTo(topX + 3.2, topY + 6);
      ctx.lineTo(midX + 4, (baseY + topY) * 0.5);
      ctx.lineTo(sx + 5, baseY - 22);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#475569', '#0f172a', 2);

      // Brillo longitudinal metálico sobre el caño
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx - 1.5, baseY - 24);
      ctx.lineTo(topX - 1.2, topY + 8);
      ctx.stroke();

      // Abrazaderas decorativas del poste costanero
      [topY + 34, (baseY + topY) * 0.52].forEach((cy) => {
        const bx = sx + shake * Math.max(0, (baseY - cy) / Math.max(1, baseY - topY));
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(bx - 6, cy - 3, 12, 6, 2);
        ctx.fill();
        ctx.stroke();
      });

      // Brazo curvo superior y cabezal de luminaria costanera
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 7.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(topX, topY + 8);
      ctx.quadraticCurveTo(topX - 6, topY - 12, lampX, lampY);
      ctx.stroke();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(topX, topY + 8);
      ctx.quadraticCurveTo(topX - 6, topY - 12, lampX, lampY);
      ctx.stroke();

      // Haz y halo cálido de la luminaria
      const glowPulse = 0.85 + Math.sin((time || 0) * 3.5) * 0.1;
      const glow = ctx.createRadialGradient(lampX - 2, lampY + 8, 2, lampX - 2, lampY + 12, 46);
      glow.addColorStop(0, `rgba(254, 240, 138, ${0.42 * glowPulse})`);
      glow.addColorStop(0.5, `rgba(251, 191, 36, ${0.14 * glowPulse})`);
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lampX - 2, lampY + 12, 46, 0, Math.PI * 2);
      ctx.fill();

      // Carcasa de farola y foco encendido
      ctx.beginPath();
      ctx.ellipse(lampX - 2, lampY + 1, 13, 6.5, -0.1, Math.PI, Math.PI * 2);
      ctx.lineTo(lampX + 10, lampY + 5);
      ctx.lineTo(lampX - 14, lampY + 5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.8);

      ctx.beginPath();
      ctx.ellipse(lampX - 2, lampY + 6, 8.5, 4.2, 0, 0, Math.PI);
      SpriteBank.fillAndStroke(ctx, '#fef08a', '#b45309', 1.2);
      ctx.restore();
    }

    drawRockeroHD(ctx, e, time) {
      ctx.save();
      const cx = e.x + e.w * 0.5;
      const by = e.y + e.h;
      const facing = e.facing === 'left' ? -1 : 1;

      if (e.fallingFromPole) {
        ctx.translate(cx, e.y + e.h * 0.5);
        ctx.rotate(e.fallRotation || 0);
        ctx.translate(0, e.h * 0.5);
        ctx.scale(facing, 1);

        // Piernas y brazos abiertos cayendo desde el poste
        SpriteBank.drawCapsule(ctx, -5, -15, -10, -2, 3.6, '#1e3a8a', '#090d16', 1.8);
        SpriteBank.drawCapsule(ctx, 5, -15, 11, -3, 3.6, '#1e3a8a', '#090d16', 1.8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-14, -4, 9, 4);
        ctx.fillRect(6, -5, 9, 4);

        ctx.beginPath();
        ctx.roundRect(-11, -34, 22, 21, 5);
        SpriteBank.fillAndStroke(ctx, '#18181b', '#090d16', 2.0);
        ctx.fillStyle = '#f4f4f5';
        ctx.beginPath();
        ctx.arc(0, -25, 4.2, 0, Math.PI * 2);
        ctx.fill();

        SpriteBank.drawCapsule(ctx, -8, -30, -16, -39, 2.7, '#fdba74', '#090d16', 1.4);
        SpriteBank.drawCapsule(ctx, 8, -30, 16, -38, 2.7, '#fdba74', '#090d16', 1.4);

        ctx.beginPath();
        ctx.arc(0, -40, 8.4, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fdba74', '#090d16', 1.9);
        ctx.beginPath();
        ctx.arc(0, -43, 8.8, Math.PI, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#78350f', '#090d16', 1.6);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-8.6, -45, 17.2, 3);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(3.5, -36, 2.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (e.onPole) {
        const poleDx = Math.max(11, Math.min(24, (Number.isFinite(e.poleX) ? e.poleX : cx + 17) - cx));
        const sway = Math.sin((e.swayPhase || 0) * 2.4) * 0.05;
        ctx.translate(cx, by);

        // Piernas flexionadas trepando/abrazando la columna del poste
        SpriteBank.drawCapsule(ctx, -3, -15, poleDx - 6, -12, 3.6, '#1e3a8a', '#090d16', 1.8);
        SpriteBank.drawCapsule(ctx, poleDx - 6, -12, poleDx - 1, -4, 3.5, '#1e3a8a', '#090d16', 1.8);
        SpriteBank.drawCapsule(ctx, 4, -17, poleDx - 4, -20, 3.6, '#1e3a8a', '#090d16', 1.8);
        SpriteBank.drawCapsule(ctx, poleDx - 4, -20, poleDx, -12, 3.5, '#1e3a8a', '#090d16', 1.8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(poleDx - 5, -6, 8, 4.5);
        ctx.fillRect(poleDx - 4, -14, 8, 4.5);

        ctx.save();
        ctx.rotate(-0.08 + sway);

        // Torso con remera negra de banda con calavera
        ctx.beginPath();
        ctx.roundRect(-11, -34, 22, 21, 5);
        SpriteBank.fillAndStroke(ctx, '#18181b', '#090d16', 2.0);
        ctx.fillStyle = '#f4f4f5';
        ctx.beginPath();
        ctx.arc(0, -25, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-2.6, -22, 5.2, 3);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-2.2, -26, 1.7, 1.7);
        ctx.fillRect(0.6, -26, 1.7, 1.7);

        // Brazo interno firmemente agarrado a la columna metálica del poste
        SpriteBank.drawCapsule(ctx, 6, -30, poleDx - 1, -35, 2.8, '#fdba74', '#090d16', 1.5);
        ctx.beginPath();
        ctx.arc(poleDx, -35, 3.6, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fdba74', '#090d16', 1.5);

        // Cabeza mirando hacia el jugador (melena larga y vincha roja)
        ctx.save();
        ctx.scale(facing, 1);
        ctx.beginPath();
        ctx.moveTo(-8, -40);
        ctx.quadraticCurveTo(-15, -30, -11, -20);
        ctx.lineTo(-5, -34);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#78350f', '#090d16', 1.6);
        ctx.beginPath();
        ctx.arc(0, -40, 8.4, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fdba74', '#090d16', 1.9);
        ctx.beginPath();
        ctx.arc(0, -43, 8.8, Math.PI, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#78350f', '#090d16', 1.6);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-8.6, -45, 17.2, 3);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(1.5, -40);
        ctx.lineTo(5.5, -39.2);
        ctx.moveTo(1.5, -35.6);
        ctx.quadraticCurveTo(4, -34.4, 6, -36.4);
        ctx.stroke();
        ctx.restore();

        // Brazo libre arrojando botellas hacia abajo/adelante (con breve preparación previa)
        this.drawRockeroBottleArm(ctx, e, time, {
          ox: -8 * (facing < 0 ? 1 : 0.5),
          oy: -28,
          scaleX: facing,
          ax: 11,
          ay: 4,
          bx: 9,
          by: -6,
          bh: 13,
          releaseAngle: 0.55,
          windupAngle: -0.92,
          idleAngle: 0.25 + Math.sin(time * 3.2) * 0.12
        });

        ctx.restore();
        ctx.restore();
        return;
      }

      const walk = Math.sin(time * 6) * 1.4;
      const sway = Math.sin((e.swayPhase || 0) * 2.6) * 0.09;

      ctx.translate(cx, by);
      ctx.scale(facing, e.isCrouching ? 0.58 : 1);
      ctx.rotate(sway);

      // Piernas con jean gastado y borcegos
      SpriteBank.drawCapsule(ctx, -5, -15, -5 + walk, -3, 3.6, '#1e3a8a', '#090d16', 1.8);
      SpriteBank.drawCapsule(ctx, 5, -15, 5 - walk, -3, 3.6, '#1e3a8a', '#090d16', 1.8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-9 + walk, -4, 9, 4);
      ctx.fillRect(1 - walk, -4, 9, 4);

      // Remera negra de banda con calavera
      ctx.beginPath();
      ctx.roundRect(-11, -34, 22, 21, 5);
      SpriteBank.fillAndStroke(ctx, '#18181b', '#090d16', 2.0);
      ctx.fillStyle = '#f4f4f5';
      ctx.beginPath();
      ctx.arc(0, -25, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-2.6, -22, 5.2, 3);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-2.2, -26, 1.7, 1.7);
      ctx.fillRect(0.6, -26, 1.7, 1.7);

      // Cabeza, melena larga y vincha roja
      ctx.beginPath();
      ctx.moveTo(-8, -40);
      ctx.quadraticCurveTo(-15, -30, -11, -20);
      ctx.lineTo(-5, -34);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#78350f', '#090d16', 1.6);
      ctx.beginPath();
      ctx.arc(0, -40, 8.4, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fdba74', '#090d16', 1.9);
      ctx.beginPath();
      ctx.arc(0, -43, 8.8, Math.PI, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#78350f', '#090d16', 1.6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-8.6, -45, 17.2, 3);
      // Ojos cansados y sonrisa torcida
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(1.5, -40);
      ctx.lineTo(5.5, -39.2);
      ctx.moveTo(1.5, -35.6);
      ctx.quadraticCurveTo(4, -34.4, 6, -36.4);
      ctx.stroke();

      // Brazo que sostiene / arroja el porrón (con breve preparación previa)
      this.drawRockeroBottleArm(ctx, e, time, {
        ox: 7,
        oy: -28,
        ax: 10,
        ay: -3,
        bx: 8,
        by: -16,
        bh: 14,
        releaseAngle: -1.25,
        windupAngle: -1.85,
        idleAngle: -0.25 + Math.sin(time * 3) * 0.12
      });

      ctx.restore();
    }

    /** Dibuja el brazo con botella del Rockero, incluyendo gesto de preparación y lanzamiento. */
    drawRockeroBottleArm(ctx, e, time, opts) {
      const windup = e.throwWindup > 0;
      const angle = e.throwAnim > 0 ? opts.releaseAngle : windup ? opts.windupAngle : opts.idleAngle;
      ctx.save();
      ctx.translate(opts.ox, opts.oy);
      if (opts.scaleX !== undefined) ctx.scale(opts.scaleX, 1);
      ctx.rotate(angle);
      SpriteBank.drawCapsule(ctx, 0, 0, opts.ax, opts.ay, 2.7, '#fdba74', '#090d16', 1.4);
      if (e.throwAnim <= 0) {
        if (windup) {
          const pulse = (0.55 + Math.sin(time * 28) * 0.35).toFixed(2);
          ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(opts.bx + 2.5, opts.by + 4, 9.5, -Math.PI * 0.85, Math.PI * 0.25);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.roundRect(opts.bx, opts.by, 5, opts.bh, 2);
        SpriteBank.fillAndStroke(ctx, '#92400e', '#090d16', 1.2);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(opts.bx + 1, opts.by - 2, 3, 3);
      }
      ctx.restore();
    }

    drawBeerBottleHD(ctx, x, y, w, h, angle) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(angle);
      // Porrón de cerveza ámbar con etiqueta
      ctx.beginPath();
      ctx.roundRect(-5.5, -4, 11, 16, 3);
      SpriteBank.fillAndStroke(ctx, '#b45309', '#1c0a02', 1.6);
      ctx.beginPath();
      ctx.roundRect(-2.6, -12, 5.2, 9, 2);
      SpriteBank.fillAndStroke(ctx, '#92400e', '#1c0a02', 1.4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-3, -13.5, 6, 2.6);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-4.2, 2, 8.4, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-4.2, -2, 1.6, 12);
      ctx.restore();
    }

    drawPenguinHD(ctx, e, time) {
      ctx.save();
      const cx = e.x + e.w * 0.5;
      const by = e.y + e.h;
      const facing = e.facing === 'left' ? -1 : 1;
      const blow = e.blowAnim > 0 ? Math.min(1, e.blowAnim / 0.5) : 0;
      const bob = Math.sin(time * 3.4) * 0.8;

      ctx.translate(cx, by);
      ctx.scale(facing, 1);

      // Patitas naranjas
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(-7, -2, 7, 3.4, 0, 0, Math.PI * 2);
      ctx.ellipse(7, -2, 7, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cuerpo negro con panza blanca (infla el pecho al soplar)
      const puff = 1 + blow * 0.18;
      ctx.beginPath();
      ctx.ellipse(0, -22 + bob, 15 * puff, 21, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 2.0);
      ctx.beginPath();
      ctx.ellipse(3, -19 + bob, 9.5 * puff, 16, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#94a3b8', 1.2);

      // Aletas
      ctx.beginPath();
      ctx.ellipse(-13, -20 + bob, 4.4, 11, 0.35 - blow * 0.5, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.4);

      // Bufanda rojinegra de Newell's
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-13, -33 + bob, 26, 5);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-13, -33 + bob, 6.5, 5);
      ctx.fillRect(0, -33 + bob, 6.5, 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-12, -29 + bob, 6, 10);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-12, -25 + bob, 6, 3);
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-13, -33 + bob, 26, 5);

      // Pico abierto soplando y ojo
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.moveTo(10, -38 + bob);
      ctx.lineTo(19 + blow * 3, -36 + bob - blow * 2);
      ctx.lineTo(10, -34 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -34 + bob);
      ctx.lineTo(18 + blow * 3, -33 + bob + blow * 3);
      ctx.lineTo(10, -31 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(6, -40 + bob, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(7, -40 + bob, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    drawColdBlastHD(ctx, x, y, w, h, dir, time) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.scale(dir >= 0 ? 1 : -1, 1);
      const grad = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
      grad.addColorStop(0, 'rgba(224, 242, 254, 0.0)');
      grad.addColorStop(0.45, 'rgba(125, 211, 252, 0.55)');
      grad.addColorStop(1, 'rgba(240, 249, 255, 0.85)');
      ctx.fillStyle = grad;
      for (let i = 0; i < 3; i++) {
        const oy = (i - 1) * 7 + Math.sin(time * 14 + i) * 1.6;
        ctx.beginPath();
        ctx.ellipse(-4 + i * 3, oy, w * 0.46 - i * 3, 5.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.4;
      for (let s = 0; s < 3; s++) {
        const px = w * 0.2 - ((time * 40 + s * 11) % (w * 0.8));
        const py = Math.sin(time * 9 + s * 2) * 7;
        ctx.beginPath();
        ctx.moveTo(px - 3, py);
        ctx.lineTo(px + 3, py);
        ctx.moveTo(px, py - 3);
        ctx.lineTo(px, py + 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPalometaHD(ctx, x, y, w, h, tilt, time) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(tilt); // morro hacia arriba al subir y hacia abajo al caer
      const wag = Math.sin(time * 22) * 2.2;

      // Cola
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, 0);
      ctx.lineTo(-w * 0.72, -7 + wag);
      ctx.lineTo(-w * 0.72, 7 + wag);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#ea580c', '#431407', 1.4);

      // Cuerpo plateado con vientre anaranjado
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.5, h * 0.52, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#cbd5e1', '#0f172a', 1.8);
      ctx.beginPath();
      ctx.ellipse(1, 3.2, w * 0.42, h * 0.26, 0, 0, Math.PI);
      ctx.fillStyle = '#fb923c';
      ctx.fill();
      // Aleta dorsal
      ctx.beginPath();
      ctx.moveTo(-3, -h * 0.5);
      ctx.lineTo(3, -h * 0.5 - 6);
      ctx.lineTo(8, -h * 0.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#ea580c', '#431407', 1.2);

      // Boca con dientes filosos y ojo
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(w * 0.44, -1);
      ctx.lineTo(w * 0.62, -3);
      ctx.lineTo(w * 0.5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let t = 0; t < 3; t++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.46 + t * 3.4, -1 + t * 0.6);
        ctx.lineTo(w * 0.48 + t * 3.4, 2.4 + t * 0.6);
        ctx.lineTo(w * 0.5 + t * 3.4, -0.4 + t * 0.6);
        ctx.fill();
      }
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(w * 0.26, -2.4, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(w * 0.28, -2.4, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawMosquitoHD(ctx, m, cameraX, time) {
      const sx = m.x - cameraX;
      if (sx < -40 || sx > 1000) return;
      const cx = sx + m.w * 0.5;
      const cy = m.y + m.h * 0.5;
      const facing = (m.vx || 0) >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(facing, 1);
      const flap = Math.sin(time * 70 + (m.phase || 0)) * 0.7;
      // Alas translúcidas que vibran
      ctx.fillStyle = 'rgba(203, 213, 225, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-1, -5, 5.5, 2.4 + flap, -0.5, 0, Math.PI * 2);
      ctx.ellipse(1, -5, 5.2, 2.2 - flap, 0.5, 0, Math.PI * 2);
      ctx.fill();
      // Patas finas
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-2, 2);
      ctx.lineTo(-5, 7);
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 7.5);
      ctx.moveTo(2, 2);
      ctx.lineTo(5, 7);
      ctx.stroke();
      // Cuerpo + aguijón
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5.2, -0.3, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(6.4, 0);
      ctx.lineTo(10, 1.8);
      ctx.stroke();
      ctx.restore();
    }

    drawMosquitoCloudHD(ctx, cx, cy, radius, time) {
      ctx.save();
      const pulse = 1 + Math.sin(time * 5) * 0.06;
      const r = Math.max(60, radius) * pulse;
      const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      grad.addColorStop(0, 'rgba(9, 9, 11, 0.55)');
      grad.addColorStop(0.6, 'rgba(24, 24, 27, 0.28)');
      grad.addColorStop(1, 'rgba(24, 24, 27, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawBouncyDrumHD(ctx, d, cameraX, time) {
      const x = d.x - cameraX;
      if (x + d.w < -40 || x > 1000) return;
      ctx.save();
      const cx = x + d.w * 0.5;
      const baseY = d.y + d.h;
      const squash = d.squash || 0;
      ctx.translate(cx, baseY);
      ctx.scale(1 + squash * 0.1, 1 - squash * 0.24);

      const hw = d.w * 0.5;
      const bodyH = d.h - 10;

      // Casco del bombo legüero azul con aros amarillos (colores de Central)
      const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
      bodyGrad.addColorStop(0, '#1e3a8a');
      bodyGrad.addColorStop(0.45, '#2563eb');
      bodyGrad.addColorStop(1, '#172554');
      ctx.beginPath();
      ctx.roundRect(-hw + 2, -bodyH, d.w - 4, bodyH, 6);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#020617', 2.4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-hw + 2, -bodyH + 2, d.w - 4, 5);
      ctx.fillRect(-hw + 2, -7, d.w - 4, 5);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.6;
      for (let t = -hw + 12; t < hw - 6; t += 14) {
        ctx.beginPath();
        ctx.moveTo(t, -bodyH + 7);
        ctx.lineTo(t + 7, -7);
        ctx.moveTo(t + 7, -bodyH + 7);
        ctx.lineTo(t, -7);
        ctx.stroke();
      }
      ctx.fillStyle = '#facc15';
      ctx.font = '900 11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KD', 0, -bodyH * 0.5 + 4);

      // Parche superior blanco (zona de rebote)
      const thump = squash > 0 ? squash * 3 : Math.sin(time * 4) * 0.6;
      ctx.beginPath();
      ctx.ellipse(0, -bodyH, hw - 1, 7 + thump * 0.4, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#020617', 2.2);
      ctx.beginPath();
      ctx.ellipse(0, -bodyH, hw - 9, 3.6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (squash > 0.3) {
        ctx.strokeStyle = 'rgba(250, 204, 21, ' + (squash * 0.8).toFixed(2) + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, -bodyH, hw + 6 + (1 - squash) * 12, 10 + (1 - squash) * 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawOverheadHazardHD(ctx, haz, cameraX, time) {
      const x = haz.x - cameraX;
      if (x + haz.w < -60 || x > 1020) return;
      ctx.save();

      if (haz.kind === 'icicle' || haz.kind === 'stalactite' || haz.kind === 'volcanic_rock' || haz.kind === 'cargo_load') {
        const anchorY = Number.isFinite(haz.anchorY) ? haz.anchorY : haz.y;
        const isShaking = haz.state === 'shaking';
        const isRespawning = haz.state === 'respawning';
        const shakeDx = isShaking ? Math.sin(time * 58) * 3.0 : 0;

        if (haz.kind === 'cargo_load') {
          // Polea y cable acerado de grúa portuaria
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + haz.w * 0.5 - 3, 0, 6, Math.max(0, haz.y + 2));
          ctx.beginPath();
          ctx.roundRect(x - 4, Math.max(0, anchorY - 12), haz.w + 8, 12, 3);
          SpriteBank.fillAndStroke(ctx, '#f59e0b', '#0f172a', 1.6);
        } else {
          // Cornisa rocosa / nevada / volcánica superior
          const ledgeCol = haz.kind === 'icicle' ? '#e2e8f0' : (haz.kind === 'volcanic_rock' ? '#44403c' : '#a16207');
          ctx.fillStyle = ledgeCol;
          ctx.strokeStyle = haz.kind === 'icicle' ? '#334155' : '#0f172a';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(x - 4, Math.max(0, anchorY - 12), haz.w + 8, 14, 4);
          ctx.fill();
          ctx.stroke();
        }

        if (isRespawning) {
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = haz.kind === 'icicle' ? '#bae6fd' : (haz.kind === 'cargo_load' ? '#fde047' : '#d6d3d1');
          ctx.beginPath();
          ctx.moveTo(x + 4, anchorY);
          ctx.lineTo(x + haz.w * 0.5, anchorY + 12);
          ctx.lineTo(x + haz.w - 4, anchorY);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          return;
        }

        const ix = x + shakeDx;
        const iy = haz.y;
        if (haz.kind === 'cargo_load') {
          // Contenedor / fardo suspendido de puerto con franjas de peligro amarillo/negro
          ctx.beginPath();
          ctx.roundRect(ix, iy, haz.w, haz.h, 4);
          SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 2.0);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(ix + 3, iy + haz.h - 7, haz.w - 6, 4);
          ctx.fillStyle = '#0f172a';
          for (let sx = ix + 5; sx < ix + haz.w - 8; sx += 10) {
            ctx.fillRect(sx, iy + haz.h - 7, 5, 4);
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.45)';
          ctx.lineWidth = 1.5;
          for (let rx = ix + 8; rx < ix + haz.w - 6; rx += 10) {
            ctx.beginPath();
            ctx.moveTo(rx, iy + 4);
            ctx.lineTo(rx, iy + haz.h - 10);
            ctx.stroke();
          }
        } else if (haz.kind === 'volcanic_rock') {
          const rockGrad = ctx.createLinearGradient(ix, iy, ix + haz.w, iy + haz.h);
          rockGrad.addColorStop(0, '#57534e');
          rockGrad.addColorStop(0.6, '#292524');
          rockGrad.addColorStop(1, '#dc2626');
          ctx.beginPath();
          ctx.moveTo(ix + 2, iy);
          ctx.lineTo(ix + haz.w * 0.2, iy + haz.h * 0.72);
          ctx.lineTo(ix + haz.w * 0.52, iy + haz.h);
          ctx.lineTo(ix + haz.w * 0.84, iy + haz.h * 0.65);
          ctx.lineTo(ix + haz.w - 2, iy);
          ctx.closePath();
          SpriteBank.fillAndStroke(ctx, rockGrad, '#0f172a', 1.8);
          ctx.fillStyle = '#fb923c';
          ctx.beginPath();
          ctx.arc(ix + haz.w * 0.5, iy + haz.h * 0.45, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (haz.kind === 'stalactite') {
          const stalGrad = ctx.createLinearGradient(ix, iy, ix + haz.w, iy + haz.h);
          stalGrad.addColorStop(0, '#f59e0b');
          stalGrad.addColorStop(0.55, '#b45309');
          stalGrad.addColorStop(1, '#78350f');
          ctx.beginPath();
          ctx.moveTo(ix, iy);
          ctx.lineTo(ix + haz.w * 0.25, iy + haz.h * 0.64);
          ctx.lineTo(ix + haz.w * 0.5, iy + haz.h);
          ctx.lineTo(ix + haz.w * 0.78, iy + haz.h * 0.58);
          ctx.lineTo(ix + haz.w, iy);
          ctx.closePath();
          SpriteBank.fillAndStroke(ctx, stalGrad, '#451a03', 1.8);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(ix + haz.w * 0.38, iy + 4, 3, haz.h * 0.55);
        } else {
          const icicleGrad = ctx.createLinearGradient(ix, iy, ix + haz.w, iy + haz.h);
          icicleGrad.addColorStop(0, '#f0f9ff');
          icicleGrad.addColorStop(0.55, '#7dd3fc');
          icicleGrad.addColorStop(1, '#0284c7');

          ctx.beginPath();
          ctx.moveTo(ix, iy);
          ctx.lineTo(ix + haz.w * 0.24, iy + haz.h * 0.62);
          ctx.lineTo(ix + haz.w * 0.50, iy + haz.h);
          ctx.lineTo(ix + haz.w * 0.78, iy + haz.h * 0.56);
          ctx.lineTo(ix + haz.w, iy);
          ctx.closePath();
          SpriteBank.fillAndStroke(ctx, icicleGrad, '#0c4a6e', 1.8);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ix + haz.w * 0.38, iy + 4);
          ctx.lineTo(ix + haz.w * 0.48, iy + haz.h * 0.84);
          ctx.stroke();
        }

        if (isShaking) {
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 11px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠', ix + haz.w * 0.5, iy - 4);
        }
        ctx.restore();
        return;
      }

      // Estructura metálica superior del pórtico ferroviario
      const hangerX = x + haz.w * 0.5;
      ctx.fillStyle = '#334155';
      ctx.fillRect(hangerX - 4, 0, 8, haz.y + 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(hangerX - 2, 0, 2, haz.y + 2);
      // Celosía horizontal de refuerzo del pórtico en la parte alta
      ctx.fillStyle = '#475569';
      ctx.fillRect(hangerX - 18, 0, 36, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(hangerX - 12, 8);
      ctx.lineTo(hangerX - 3, 22);
      ctx.moveTo(hangerX + 12, 8);
      ctx.lineTo(hangerX + 3, 22);
      ctx.stroke();
      // Ménsula de sujeción justo encima del cartel/semáforo
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hangerX - 9, haz.y - 5, 18, 6);

      if (haz.kind === 'signal') {
        // Semáforo ferroviario del Mitre con viseras protectoras
        ctx.beginPath();
        ctx.roundRect(x, haz.y, haz.w, haz.h, 8);
        SpriteBank.fillAndStroke(ctx, '#0f172a', '#cbd5e1', 2.2);
        const blink = Math.sin(time * 8) > 0;
        const rCx = x + haz.w * 0.32;
        const yCx = x + haz.w * 0.68;
        const cySig = haz.y + haz.h * 0.5;
        ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(rCx, cySig, 6.5, 0, Math.PI * 2);
        ctx.fill();
        if (blink) {
          ctx.fillStyle = 'rgba(248, 113, 113, 0.35)';
          ctx.beginPath();
          ctx.arc(rCx, cySig, 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(yCx, cySig, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rCx, cySig, 7.6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(yCx, cySig, 6.6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        // Cartel ferroviario oficial Trenes Argentinos ("TIGRE · RETIRO / BELGRANO R / EXPRESS RETIRO")
        ctx.beginPath();
        ctx.roundRect(x, haz.y, haz.w, haz.h, 5);
        SpriteBank.fillAndStroke(ctx, '#1e3a8a', '#f8fafc', 2.2);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(x + 3, haz.y + 3, haz.w - 6, 4.5);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(haz.label || 'RETIRO ▶', x + haz.w * 0.5, haz.y + haz.h * 0.68);
      }
      ctx.restore();
    }

    drawHorneroNestHD(ctx, nest, cameraX, time) {
      if (nest.dead && !nest.falling) return;
      const x = nest.x - cameraX;
      if (x + nest.w < -60 || x > 1020) return;
      const cx = x + nest.w * 0.5;
      const y = nest.y;
      ctx.save();

      if (nest.falling) {
        ctx.translate(cx, y + nest.h * 0.5);
        ctx.rotate(nest.rotation || 0);
        ctx.translate(-cx, -(y + nest.h * 0.5));
      } else {
        // Poste/ménsula de madera o luminaria elevada sosteniendo el horno de barro sobre suelo/andén firme
        const poleBottomY = Number.isFinite(nest.poleBaseY) ? nest.poleBaseY : 460;
        const poleTopY = y + nest.h - 4;
        const poleH = Math.max(24, poleBottomY - poleTopY);
        ctx.fillStyle = '#5c4033';
        ctx.strokeStyle = '#1e1b18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(cx - 4, poleTopY, 8, poleH);
        ctx.fill();
        ctx.stroke();

        // Base de anclaje firme sobre andén o suelo ferroviario detrás del tren
        if (poleBottomY < 460) {
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(cx - 9, poleBottomY - 6, 18, 6, 2);
          ctx.fill();
          ctx.stroke();
        }

        // Travesaño superior de apoyo
        ctx.beginPath();
        ctx.roundRect(cx - 22, y + nest.h - 6, 44, 7, 3);
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#1e1b18';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }

      // Horno de barro (cúpula de arcilla típica del Hornero)
      const hitFlash = nest.hitFlashTimer > 0 && Math.floor(nest.hitFlashTimer * 22) % 2 === 0;
      const bodyColor = hitFlash ? '#f59e0b' : nest.cracked ? '#9a3412' : '#b45309';
      ctx.beginPath();
      ctx.ellipse(cx, y + nest.h * 0.56, 20, 16, 0, Math.PI, 0, false);
      ctx.quadraticCurveTo(cx + 21, y + nest.h - 4, cx + 16, y + nest.h - 4);
      ctx.lineTo(cx - 16, y + nest.h - 4);
      ctx.quadraticCurveTo(cx - 21, y + nest.h - 4, cx - 20, y + nest.h * 0.56);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, bodyColor, '#451a03', 2.2);

      // Textura de capas de barro y pajita
      ctx.strokeStyle = 'rgba(254, 215, 170, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx - 2, y + 14, 11, Math.PI * 1.1, Math.PI * 1.85);
      ctx.stroke();

      // Boca arqueada oscura del nido
      const mouthX = cx - 7;
      const mouthY = y + nest.h * 0.66;
      const isPeeking = Boolean(
        !nest.broken &&
        !nest.falling &&
        nest.activeHornero &&
        !nest.activeHornero.dead &&
        !nest.activeHornero.scaredFlying &&
        nest.activeHornero.state === 'peeking'
      );
      const pulse = !nest.broken && nest.cooldownTimer > nest.cooldown - 0.45 ? Math.sin(time * 22) * 0.5 + 0.5 : 0;
      ctx.beginPath();
      ctx.ellipse(mouthX, mouthY, 5.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = pulse > 0 || isPeeking ? '#291509' : '#1c1917';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      // Aviso visual (~1.0s): Pico y ojitos del hornero asomándose por la boca circular del nido
      if (isPeeking) {
        const peekDir = nest.activeHornero.facing === 'right' ? 1 : -1;
        const bob = Math.sin(time * 16) * 1.1;
        const progress = Math.max(0, Math.min(1, 1 - (nest.activeHornero.stateTimer || 0) / (nest.activeHornero.peekDuration || 1.0)));
        const poke = 1.2 + Math.sin(progress * Math.PI * 0.5) * 2.2;
        ctx.save();
        ctx.translate(mouthX + peekDir * poke, mouthY + 0.5 + bob);
        // Cabecita asomando dentro del marco de barro
        ctx.beginPath();
        ctx.arc(0, 0, 4.6, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#c2410c', '#0f172a', 1.3);
        // Garganta crema sutil
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(peekDir * 1.2, 2.4, 2.6, 1.5, 0, 0, Math.PI);
        ctx.fill();
        // Dos ojitos brillantes mirando alerta
        const eyePositions = [
          { ex: peekDir * 1.8, ey: -1.4, r: 1.5 },
          { ex: -peekDir * 1.2, ey: -1.1, r: 1.25 }
        ];
        eyePositions.forEach((ep) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ep.ex, ep.ey, ep.r + 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(ep.ex + peekDir * 0.25, ep.ey, ep.r * 0.72, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ep.ex + 0.3, ep.ey - 0.35, 0.45, 0, Math.PI * 2);
          ctx.fill();
        });
        // Pico puntiagudo asomando hacia afuera
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(peekDir * 3.6, -1.3);
        ctx.lineTo(peekDir * 10.2, 0.2);
        ctx.lineTo(peekDir * 3.6, 1.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Grietas visibles al recibir el 1.er golpe (cracked / hp === 1) o al romperse
      if (nest.cracked || nest.broken || nest.hp === 1) {
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx + 3, y + 3);
        ctx.lineTo(cx - 2, y + 12);
        ctx.lineTo(cx + 6, y + 19);
        ctx.lineTo(cx + 1, y + 27);
        ctx.moveTo(cx + 5, y + 11);
        ctx.lineTo(cx + 14, y + 16);
        ctx.stroke();

        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.7;
        ctx.stroke();
      }

      ctx.restore();
    }

    drawHorneroHD(ctx, hornero, cameraX, time) {
      // Durante 'peeking' se dibuja asomando pico y ojitos dentro de la boca del nido; durante 'hidden' se esconde dentro
      if (!hornero || hornero.dead || hornero.state === 'peeking' || hornero.state === 'hidden' || hornero.scaredTimer > 0) return;
      const sx = hornero.x - cameraX;
      if (sx + hornero.w < -80 || sx > 1040) return;
      const cx = sx + hornero.w * 0.5;
      const cy = hornero.y + hornero.h * 0.5;
      const isPerched = hornero.state === 'perched' && !hornero.scaredFlying;
      const speed = Math.hypot(hornero.vx || 0, hornero.vy || 0) || 1;
      const rawAngle = isPerched ? 0 : Math.atan2(hornero.vy || 0, Math.abs(hornero.vx || 1));
      const tilt = isPerched ? 0 : Math.max(-0.65, Math.min(0.65, rawAngle));
      const disabled = typeof hornero.isDisabled === 'function' && hornero.isDisabled() && !hornero.scaredFlying;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(hornero.facing === 'left' ? -1.15 : 1.15, 1.15);
      ctx.rotate(tilt);

      if (isPerched) {
        // Hornero posado erguido de guardia sobre el techo del nido
        const headBob = Math.sin(time * 5.5) * 0.9;
        // Patitas agarrando la cúpula de barro
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-2, 5);
        ctx.lineTo(-4, 12);
        ctx.moveTo(-6, 12);
        ctx.lineTo(-1, 12);
        ctx.moveTo(3, 5);
        ctx.lineTo(3, 12);
        ctx.moveTo(1, 12);
        ctx.lineTo(6, 12);
        ctx.stroke();

        // Cola levantada de guardia
        ctx.beginPath();
        ctx.moveTo(-8, 1);
        ctx.lineTo(-18, -5);
        ctx.lineTo(-15, 2);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, disabled ? '#94a3b8' : '#7c2d12', '#0f172a', 1.4);

        // Cuerpo erguido marrón canela + pecho crema
        ctx.beginPath();
        ctx.ellipse(0, 0, 10.5, 7.8, -0.25, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, disabled ? '#cbd5e1' : '#b45309', '#0f172a', 1.7);

        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(3, 2.2, 6.2, 4.6, -0.2, -0.3, Math.PI * 0.85);
        ctx.fill();

        // Ala plegada descansando al costado
        ctx.beginPath();
        ctx.ellipse(-2.5, -0.5, 7.6, 4.0, -0.2, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, disabled ? '#94a3b8' : '#9a3412', '#0f172a', 1.4);

        // Cabeza erguida alerta vigilando + pico + ojo
        ctx.beginPath();
        ctx.arc(8.2, -6.5 + headBob, 5.2, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, disabled ? '#cbd5e1' : '#c2410c', '#0f172a', 1.6);

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(12.6, -7.8 + headBob);
        ctx.lineTo(20.5, -6.2 + headBob);
        ctx.lineTo(12.6, -4.4 + headBob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(9.8, -7.7 + headBob, 1.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(10.2, -8.1 + headBob, 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return;
      }

      // Estela roja de alerta si es bandada teledirigida del Tren Mitre
      if (hornero.isHoming && !hornero.scaredFlying) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-26, -3);
        ctx.lineTo(-10, -1);
        ctx.moveTo(-22, 4);
        ctx.lineTo(-8, 2);
        ctx.stroke();
      }

      // Cola del Hornero
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-20, -4);
      ctx.lineTo(-18, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, disabled ? '#94a3b8' : '#7c2d12', '#0f172a', 1.4);

      // Cuerpo marrón rojizo canela y vientre crema
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 8.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, disabled ? '#cbd5e1' : '#b45309', '#0f172a', 1.7);

      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(2, 3.2, 8.2, 4.4, 0, 0, Math.PI);
      ctx.fill();

      // Ala batiendo rápido en picada
      const flap = Math.sin(time * (speed > 320 ? 32 : 18)) * 7;
      ctx.beginPath();
      ctx.ellipse(-2, -3 - flap * 0.45, 8.5, 4.6, -0.25, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, disabled ? '#94a3b8' : '#9a3412', '#0f172a', 1.4);

      // Cabeza, pico recto afilado y ojo alerta
      ctx.beginPath();
      ctx.arc(9.5, -4, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, disabled ? '#cbd5e1' : '#c2410c', '#0f172a', 1.6);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(14, -5.2);
      ctx.lineTo(22, -3.5);
      ctx.lineTo(14, -1.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = hornero.isHoming ? '#ef4444' : '#0f172a';
      ctx.beginPath();
      ctx.arc(11.2, -5.2, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ========================================================================
    // CÓRDOBA, ARGENTINA: EL PIRATA (HINCHA DE BELGRANO), FERNET, BURRITO Y OVNI
    // ========================================================================
    drawFernetBottleHD(ctx, x, y, w, h, angle = 0) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      ctx.rotate(angle);
      // Botella de plástico cortada clásica con Fernet oscuro y espuma cremosa
      ctx.beginPath();
      ctx.roundRect(-7, -8, 14, 20, [2, 2, 4, 4]);
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#090d16', 1.6);
      // Líquido oscuro de Fernet con Coca
      ctx.fillStyle = '#3f1d0b';
      ctx.fillRect(-5.5, -2, 11, 12.5);
      // Espuma beige abundante en el borde cortado
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(-6.5, -7.5, 13, 6.2, 2.5);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(-2.5, -8.2, 2.8, 0, Math.PI * 2);
      ctx.arc(2.5, -8.2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Reflejo plástico
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(-4.5, -1, 1.8, 10);
      ctx.restore();
    }

    drawFernetPuddleHD(ctx, p, cameraX, time) {
      const sx = p.x - cameraX;
      if (sx + p.w < -40 || sx > 1000) return;
      const fade = p.life < 0.7 ? Math.max(0, p.life / 0.7) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(sx + p.w * 0.5, p.y);
      // Charco de fernet oscuro en el suelo
      ctx.beginPath();
      ctx.ellipse(0, -1, p.w * 0.52, 5.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#451a03', '#1c0a02', 1.5);
      // Espuma burbujeante en el centro
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(-6, -2.5, p.w * 0.25, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -2, p.w * 0.18, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const bx = -14 + i * 9 + Math.sin(time * 5 + i) * 2;
        const by = -4 - ((time * 16 + i * 3) % 7);
        ctx.fillStyle = 'rgba(254, 243, 199, 0.8)';
        ctx.beginPath();
        ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawBelgranoPirateHD(ctx, e, time) {
      ctx.save();
      const cx = e.x + e.w * 0.5;
      const by = e.y + e.h;
      const facing = e.facing === 'left' ? -1 : 1;
      const disarmed = !e.hasFernetBottle;
      const punching = disarmed && e.punchTimer > 0;
      const bob = Math.sin(time * (disarmed ? 10 : 6)) * 1.6;
      const stride = Math.sin(time * (disarmed ? 10.5 : 5.5)) * (disarmed ? 7.5 : 4.5);
      const shockShake = e.disarmTimer > 0 ? Math.sin(time * 52) * 3 : 0;

      ctx.translate(cx + shockShake, by);

      // Visual de botella cayéndose al suelo cuando el Terremoto lo desarma
      if (e.droppedBottle && e.droppedBottle.life > 0) {
        const db = e.droppedBottle;
        this.drawFernetBottleHD(ctx, db.x - cx - 9, db.y - by - 12, 18, 24, db.angle);
      }

      ctx.save();
      ctx.scale(facing, 1);

      // Piernas y bermuda/pantalón corto pirata
      SpriteBank.drawCapsule(ctx, -5, -18, -6 - stride, -2, 4.2, '#e2a376', '#090d16', 1.8);
      SpriteBank.drawCapsule(ctx, 5, -18, 6 + stride, -2, 4.2, '#d49062', '#090d16', 1.8);
      ctx.beginPath();
      ctx.roundRect(-12, -26, 24, 12, 3);
      SpriteBank.fillAndStroke(ctx, '#0c4a6e', '#090d16', 1.8);
      // Zapatillas celestes/blancas
      ctx.beginPath();
      ctx.roundRect(-10 - stride, -5, 10, 5, 2);
      SpriteBank.fillAndStroke(ctx, '#38bdf8', '#090d16', 1.5);
      ctx.beginPath();
      ctx.roundRect(1 + stride, -5, 10, 5, 2);
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#090d16', 1.5);

      // Torso ancho SIN REMERA (bronceado) con tatuajes piratas
      const skinGrad = ctx.createLinearGradient(-12, -45, 12, -24);
      skinGrad.addColorStop(0, '#fdba74');
      skinGrad.addColorStop(1, '#ea8c55');
      ctx.beginPath();
      ctx.roundRect(-13, -45 + bob, 26, 21, 7);
      SpriteBank.fillAndStroke(ctx, skinGrad, '#090d16', 2.1);

      // Tatuaje pirata / ancla & calavera estilizada en el pecho
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4, -39 + bob);
      ctx.lineTo(-4, -32 + bob);
      ctx.moveTo(-7, -36 + bob);
      ctx.lineTo(-1, -36 + bob);
      ctx.stroke();
      // Banda/pintura celeste en mejilla/pectoral
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(3, -39 + bob, 7, 2.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, -36.5 + bob, 7, 1.5);

      // Brazo trasero
      SpriteBank.drawCapsule(ctx, -10, -40 + bob, -15, -28 + bob, 3.3, '#ea8c55', '#090d16', 1.6);

      // Cabeza fiera (ROJA y furiosa en Modo Furia tras perder el Fernet) + Pañuelo celeste y blanco de Belgrano
      const isFurious = !!(e.enraged || !e.hasFernetBottle);
      const flashOn = e.hitFlashTimer > 0 && Math.floor(e.hitFlashTimer * 36) % 2 === 0;
      let headFill = '#fdba74';
      if (isFurious) {
        const rageGrad = ctx.createRadialGradient(2, -54 + bob, 1.5, 0, -52 + bob, 10);
        rageGrad.addColorStop(0, '#fca5a5');
        rageGrad.addColorStop(0.55, '#ef4444');
        rageGrad.addColorStop(1, '#b91c1c');
        headFill = rageGrad;
      }
      ctx.beginPath();
      ctx.arc(0, -52 + bob, 9.5, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, headFill, isFurious ? '#450a0a' : '#090d16', 2.0);
      // Cintas sueltas del pañuelo atrás
      ctx.beginPath();
      ctx.moveTo(-8, -55 + bob);
      ctx.lineTo(-18, -58 + bob + Math.sin(time * 9) * 2);
      ctx.lineTo(-15, -52 + bob);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#0ea5e9', '#090d16', 1.5);
      // Corona de pañuelo celeste con franja blanca
      ctx.beginPath();
      ctx.arc(0, -54.5 + bob, 9.8, Math.PI * 0.98, Math.PI * 2.02);
      SpriteBank.fillAndStroke(ctx, '#38bdf8', '#090d16', 1.8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8.5, -56.5 + bob, 17, 2.6);
      // Parche pirata de un ojo y ojo fiero al frente
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-7, -54 + bob);
      ctx.lineTo(2, -51 + bob);
      ctx.stroke();
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(4.2, -52 + bob, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isFurious ? '#fef08a' : '#ffffff';
      ctx.beginPath();
      ctx.arc(4.8, -52.5 + bob, isFurious ? 1.0 : 0.8, 0, Math.PI * 2);
      ctx.fill();
      if (isFurious) {
        // Ceja furiosa inclinada en V y boca apretada/gritando con dientes furiosos
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(1.2, -55.8 + bob);
        ctx.lineTo(7.4, -53.2 + bob);
        ctx.stroke();
        // Vena/chispa de enojo en la sien
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-4, -50 + bob);
        ctx.lineTo(-2, -48 + bob);
        ctx.moveTo(-4, -48 + bob);
        ctx.lineTo(-2, -50 + bob);
        ctx.stroke();
        // Boca gruñendo con dientes blancos apretados
        ctx.beginPath();
        ctx.roundRect(-1.5, -48.5 + bob, 8.2, 4.0, 1.4);
        SpriteBank.fillAndStroke(ctx, '#ffffff', '#450a0a', 1.2);
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(1.5, -48.5 + bob);
        ctx.lineTo(1.5, -44.5 + bob);
        ctx.moveTo(4.2, -48.5 + bob);
        ctx.lineTo(4.2, -44.5 + bob);
        ctx.stroke();
      }

      // Brazo delantero: Fase 1 con botella cortada de Fernet vs Fase 2 lanzando piñas
      if (!disarmed) {
        const lift = e.throwAnim > 0 ? -9 : Math.sin(time * 6) * 2;
        SpriteBank.drawCapsule(ctx, 10, -40 + bob, 17, -33 + bob + lift, 3.4, '#fdba74', '#090d16', 1.6);
        this.drawFernetBottleHD(ctx, 11, -51 + bob + lift, 14, 18, 0.18);
      } else {
        const reach = punching ? 23 : 13 + Math.sin(time * 12) * 2;
        const punchY = punching ? -42 + bob : -34 + bob;
        SpriteBank.drawCapsule(ctx, 9, -40 + bob, reach, punchY, 3.6, '#fdba74', '#090d16', 1.7);
        // Puño cerrado
        ctx.beginPath();
        ctx.arc(reach + 2, punchY, punching ? 5.2 : 4.2, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#fca5a5', '#090d16', 1.7);
        if (punching) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(reach + 8, punchY - 5);
          ctx.lineTo(reach + 15, punchY - 3);
          ctx.moveTo(reach + 9, punchY + 4);
          ctx.lineTo(reach + 16, punchY + 3);
          ctx.stroke();
        }
      }
      if (flashOn) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
        ctx.beginPath();
        ctx.roundRect(-16, -62, 34, 62, 8);
        ctx.fill();
      }
      ctx.restore();

      if (e.disarmTimer > 0) {
        SpriteBank.drawComicSpeechBubble(ctx, 0, -76 + bob, '¡MI FERNET!', {
          fill: '#fee2e2',
          font: 'bold 10px "Segoe UI", sans-serif',
          height: 18
        });
      }
      ctx.restore();
    }

    drawSerranoBurroHD(ctx, x, y, facing, animTimer, isDisabled, isCharging, hitFlash = false, hp = 2) {
      ctx.save();
      ctx.translate(x + 22, y + 20);
      if (facing === 'left') ctx.scale(-1, 1);
      const flashOn = hitFlash && Math.floor(animTimer * 36) % 2 === 0;

      const stride = isDisabled ? 0 : Math.sin(animTimer * (isCharging ? 30 : 12)) * (isCharging ? 6.5 : 3.5);
      if (isCharging && !isDisabled) ctx.rotate(0.14);

      // Patas con pezuñas oscuras
      SpriteBank.drawCapsule(ctx, -10, 4, -12 - stride, 16, 2.5, '#64748b', '#090d16', 1.5);
      SpriteBank.drawCapsule(ctx, -4, 4, -4 + stride, 16, 2.5, '#94a3b8', '#090d16', 1.5);
      SpriteBank.drawCapsule(ctx, 6, 4, 8 - stride, 16, 2.5, '#64748b', '#090d16', 1.5);
      SpriteBank.drawCapsule(ctx, 11, 4, 12 + stride, 16, 2.5, '#94a3b8', '#090d16', 1.5);

      // Cola fina con mechón oscuro
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.quadraticCurveTo(-19, 3, -18, 9);
      ctx.stroke();

      // Cuerpo robusto gris serrano
      const bodyGrad = ctx.createLinearGradient(0, -9, 0, 9);
      bodyGrad.addColorStop(0, isDisabled ? '#cbd5e1' : '#94a3b8');
      bodyGrad.addColorStop(1, isDisabled ? '#94a3b8' : '#475569');
      ctx.beginPath();
      ctx.ellipse(0, 1, 14.5, 8.8, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#090d16', 1.9);

      // Manta / ponchito serrano artesanal en el lomo
      ctx.beginPath();
      ctx.roundRect(-7, -7, 13, 8, 2);
      SpriteBank.fillAndStroke(ctx, '#e11d48', '#090d16', 1.3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-5, -5.5, 9, 2.5);

      // Cabeza alargada y orejas largas características de Burrito Serrano
      ctx.save();
      ctx.translate(12, isCharging ? 1 : -5);
      if (isCharging) ctx.rotate(0.42);

      // Orejas largas gris oscuro
      ctx.beginPath();
      ctx.ellipse(-2, -10, 2.8, 7.5, -0.25, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#64748b', '#090d16', 1.5);
      ctx.beginPath();
      ctx.ellipse(2.5, -10.5, 2.6, 7.2, 0.1, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#94a3b8', '#090d16', 1.5);

      // Hocico y cara
      ctx.beginPath();
      ctx.ellipse(3, -1, 8.2, 5.4, 0.25, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#94a3b8', '#090d16', 1.7);
      // Hocico crema claro
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(8.2, 1.2, 4.2, 3.6, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isCharging ? '#ef4444' : '#0f172a';
      ctx.beginPath();
      ctx.arc(3.5, -2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (isCharging && !isDisabled) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, -6);
        ctx.lineTo(-14, -6);
        ctx.moveTo(-26, 2);
        ctx.lineTo(-15, 2);
        ctx.stroke();
      }
      if (hp === 1 && !isDisabled) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-10, -11, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (flashOn) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.ellipse(2, 0, 19, 13, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawMiniUfoHD(ctx, u, cameraX, time) {
      if (u.dead) return;
      const sx = u.x - cameraX;
      if (sx < -120 || sx > 1080) return;

      const cx = sx + u.w * 0.5;
      const cy = u.y + u.h * 0.5;
      const disabled = u.isDisabled && u.isDisabled();

      ctx.save();
      // Rayo de luz vertical abductor del Uritorco (si está activo)
      if (u.beamActive && !disabled) {
        const beamH = u.beamHeight || 190;
        const grad = ctx.createLinearGradient(cx, cy + 6, cx, cy + 6 + beamH);
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.72)');
        grad.addColorStop(0.55, 'rgba(34, 211, 238, 0.34)');
        grad.addColorStop(1, 'rgba(34, 211, 238, 0.06)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 8);
        ctx.lineTo(cx - 22, cy + 8 + beamH);
        ctx.lineTo(cx + 22, cy + 8 + beamH);
        ctx.lineTo(cx + 10, cy + 8);
        ctx.closePath();
        ctx.fill();

        // Anillos energéticos descendiendo dentro del haz
        ctx.strokeStyle = 'rgba(167, 243, 208, 0.75)';
        ctx.lineWidth = 1.6;
        for (let r = 0; r < 3; r++) {
          const ry = cy + 20 + ((time * 95 + r * (beamH / 3)) % beamH);
          const rw = 10 + ((ry - cy) / beamH) * 10;
          ctx.beginPath();
          ctx.ellipse(cx, ry, rw, 3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (u.beamWarning && !disabled) {
        // Destello previo de aviso debajo del platillo
        ctx.fillStyle = `rgba(250, 204, 21, ${0.45 + 0.45 * Math.sin(time * 24)})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(time * 4.5) * 0.08);

      // Cúpula superior translúcida cian
      const domeGrad = ctx.createRadialGradient(-3, -10, 2, 0, -6, 16);
      domeGrad.addColorStop(0, '#cffafe');
      domeGrad.addColorStop(0.6, '#22d3ee');
      domeGrad.addColorStop(1, '#0e7490');
      ctx.beginPath();
      ctx.arc(0, -4, 13, Math.PI, 0);
      SpriteBank.fillAndStroke(ctx, disabled ? '#cbd5e1' : domeGrad, '#090d16', 1.7);

      // Fuselaje metálico en disco
      const hullGrad = ctx.createLinearGradient(-22, 0, 22, 0);
      hullGrad.addColorStop(0, '#64748b');
      hullGrad.addColorStop(0.5, '#e2e8f0');
      hullGrad.addColorStop(1, '#475569');
      ctx.beginPath();
      ctx.ellipse(0, 1, 22, 7.8, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, disabled ? '#94a3b8' : hullGrad, '#090d16', 2.0);

      // Luces perimetrales parpadeantes verdes y cian
      for (let i = -2; i <= 2; i++) {
        const pulse = Math.sin(time * 12 + i * 1.4) > 0;
        ctx.fillStyle = disabled ? '#cbd5e1' : (pulse ? '#4ade80' : '#22d3ee');
        ctx.beginPath();
        ctx.arc(i * 7.5, 1.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /**
     * Estela hiperespacial a velocidad de la luz y destello de eyección del OVNI del Cerro Uritorco.
     */
    drawUfoLightspeedTrailHD(ctx, u, cameraX, time, warpIntensity = 1, isFacingRight = true) {
      if (!u || warpIntensity <= 0.01) return;
      const sx = u.x - cameraX;
      if (sx < -420 || sx > 1380) return;

      const cx = sx + (u.w || 46) * 0.5;
      const cy = u.y + (u.h || 24) * 0.5;
      const trailDir = isFacingRight ? -1 : 1;
      const intensity = Math.max(0, Math.min(1.2, warpIntensity));

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Haz central blanco-cian de salto hiperespacial
      const beamLen = (210 + Math.sin(time * 42) * 28) * intensity;
      const coreGrad = ctx.createLinearGradient(cx, cy, cx + trailDir * beamLen, cy);
      coreGrad.addColorStop(0, `rgba(224, 242, 254, ${0.88 * Math.min(1, intensity)})`);
      coreGrad.addColorStop(0.24, `rgba(34, 211, 238, ${0.72 * Math.min(1, intensity)})`);
      coreGrad.addColorStop(0.62, `rgba(74, 222, 128, ${0.34 * Math.min(1, intensity)})`);
      coreGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11);
      ctx.lineTo(cx + trailDir * beamLen, cy - 3);
      ctx.lineTo(cx + trailDir * beamLen, cy + 3);
      ctx.lineTo(cx, cy + 11);
      ctx.closePath();
      ctx.fill();

      // Líneas veloces estelares multi-capa atrás del OVNI
      for (let i = 0; i < 9; i++) {
        const seed = i * 1.37;
        const yOff = ((i - 4) * 4.2) + Math.sin(time * 24 + seed) * 1.5;
        const startOff = ((i % 3) * 16 + ((time * 320 + i * 47) % 34)) * trailDir;
        const lineLen = (85 + ((i * 53) % 165)) * intensity;
        const alpha = (0.45 + 0.45 * ((i + 1) % 2)) * Math.min(1, intensity);
        ctx.strokeStyle = i % 3 === 0
          ? `rgba(255, 255, 255, ${alpha})`
          : i % 2 === 0
            ? `rgba(56, 189, 248, ${alpha})`
            : `rgba(74, 222, 128, ${alpha * 0.9})`;
        ctx.lineWidth = i % 3 === 0 ? 2.4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + startOff, cy + yOff);
        ctx.lineTo(cx + startOff + trailDir * lineLen, cy + yOff);
        ctx.stroke();
      }

      // Cono sónico luminoso en la proa del OVNI
      const noseX = cx - trailDir * 24;
      const shockGrad = ctx.createRadialGradient(noseX, cy, 2, noseX, cy, 26 * Math.max(0.6, intensity));
      shockGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * Math.min(1, intensity)})`);
      shockGrad.addColorStop(0.5, `rgba(34, 211, 238, ${0.42 * Math.min(1, intensity)})`);
      shockGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = shockGrad;
      ctx.beginPath();
      ctx.arc(noseX, cy, 26 * Math.max(0.6, intensity), 0, Math.PI * 2);
      ctx.fill();

      // Anillos sónicos quedando atrás
      for (let r = 0; r < 3; r++) {
        const ringAge = ((time * 5.2 + r * 0.33) % 1);
        const rx = cx + trailDir * (28 + ringAge * 130 * intensity);
        const ryScale = 12 + ringAge * 14;
        ctx.strokeStyle = `rgba(103, 232, 249, ${(1 - ringAge) * 0.55 * Math.min(1, intensity)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(rx, cy, 4 + ringAge * 4, ryScale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    drawUfoAbductionFxHD(ctx, u, cameraX, fx = null) {
      if (!u || !fx || fx.flashAlpha <= 0.01) return;
      const sx = u.x - cameraX + (u.w || 46) * 0.5;
      const sy = u.y + (u.h || 24) * 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const radius = fx.ringRadius || 48;
      const flashGrad = ctx.createRadialGradient(sx, sy, 4, sx, sy, radius);
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${fx.flashAlpha})`);
      flashGrad.addColorStop(0.45, `rgba(74, 222, 128, ${fx.flashAlpha * 0.65})`);
      flashGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ========================================================================
    // USHUAIA (TIERRA DEL FUEGO): FAUNA AUSTRAL EXCLUSIVA HD
    // ========================================================================

    /**
     * Lobo Marino Austral (2 HP): corpulento, bigotes patagónicos, aletas delanteras
     * y bramido embestidor cuando el jugador se acerca.
     */
    drawSeaLionHD(ctx, e, cameraX, time) {
      if (e.dead) return;
      const sx = e.x - cameraX;
      if (sx < -110 || sx > 1070) return;

      const disabled = e.isDisabled && e.isDisabled();
      const hitFlash = e.hitFlashTimer > 0 && Math.floor(e.hitFlashTimer * 36) % 2 === 0;
      const enraged = e.hp === 1 && !disabled;
      const hopBob = e.charging ? Math.abs(Math.sin(time * 12)) * 3 : Math.sin(time * 4) * 1.2;

      ctx.save();
      ctx.translate(sx + e.w * 0.5, e.y + e.h * 0.5 - hopBob);
      if (e.facing === 'left') ctx.scale(-1, 1);

      // Sombra en la nieve/roca
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, e.h * 0.45 + hopBob, 24, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const furDark = hitFlash ? '#ffffff' : disabled ? '#94a3b8' : enraged ? '#92400e' : '#57534e';
      const furLight = hitFlash ? '#ffffff' : disabled ? '#cbd5e1' : enraged ? '#d97706' : '#a8a29e';
      const bodyGrad = ctx.createLinearGradient(-22, -16, 18, 16);
      bodyGrad.addColorStop(0, furLight);
      bodyGrad.addColorStop(0.65, furDark);
      bodyGrad.addColorStop(1, '#292524');

      // Cola trasera bi-aleta
      ctx.beginPath();
      ctx.moveTo(-18, 8);
      ctx.lineTo(-30, 3);
      ctx.lineTo(-27, 13);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, furDark, '#090d16', 1.6);

      // Cuerpo musculoso curvado de lobo marino
      ctx.beginPath();
      ctx.moveTo(-22, 12);
      ctx.quadraticCurveTo(-8, -8, 10, -15);
      ctx.quadraticCurveTo(22, -14, 21, -2);
      ctx.quadraticCurveTo(16, 15, -6, 15);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#090d16', 2.0);

      // Melena gruesa del cuello (característica del macho austral)
      ctx.fillStyle = enraged ? '#b45309' : '#78716c';
      for (let m = 0; m < 4; m++) {
        ctx.beginPath();
        ctx.arc(4 - m * 3, -9 + m * 2.5, 5.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cabeza y hocico con bigotes
      ctx.beginPath();
      ctx.arc(14, -10, 8.5, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furLight, '#090d16', 1.8);
      ctx.beginPath();
      ctx.ellipse(21, -8, 5, 4, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furLight, '#090d16', 1.5);

      // Nariz negra y ojo expresivo
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(24, -10, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(15, -13, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = enraged ? '#ef4444' : '#0f172a';
      ctx.beginPath();
      ctx.arc(15.8, -13, 1.5, 0, Math.PI * 2);
      ctx.fill();
      if (e.charging || enraged) {
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(12, -16);
        ctx.lineTo(18, -14.5);
        ctx.stroke();
      }

      // Bigotes blancos
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.1;
      for (let wIdx = -1; wIdx <= 1; wIdx++) {
        ctx.beginPath();
        ctx.moveTo(21, -7 + wIdx * 1.5);
        ctx.lineTo(29, -8 + wIdx * 3);
        ctx.stroke();
      }

      // Aleta delantera remando al trotar
      const flipperAng = e.charging ? Math.sin(time * 20) * 0.42 : Math.sin(time * 7) * 0.16;
      ctx.save();
      ctx.translate(4, 6);
      ctx.rotate(flipperAng);
      ctx.beginPath();
      ctx.ellipse(5, 6, 8.5, 4.2, 0.55, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furDark, '#090d16', 1.6);
      ctx.restore();

      if (enraged) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-2, -18);
        ctx.lineTo(2, -12);
        ctx.lineTo(-4, -8);
        ctx.stroke();
      }
      ctx.restore();
    }

    /**
     * Centolla Gigante Fueguina (2 HP): caparazón acorazado con púas anti-stomp
     * en hp === 2; grietas luminosas y vulnerable al salto tras perder armadura (hp === 1).
     */
    drawKingCrabHD(ctx, e, cameraX, time) {
      if (e.dead) return;
      const sx = e.x - cameraX;
      if (sx < -110 || sx > 1070) return;

      const disabled = e.isDisabled && e.isDisabled();
      const hitFlash = e.hitFlashTimer > 0 && Math.floor(e.hitFlashTimer * 36) % 2 === 0;
      const armored = e.hp >= 2 && !e.armorBroken;
      const walk = disabled ? 0 : Math.sin(time * 12) * 3;

      ctx.save();
      ctx.translate(sx + e.w * 0.5, e.y + e.h * 0.55);
      if (e.facing === 'left') ctx.scale(-1, 1);

      const shellTop = hitFlash ? '#ffffff' : disabled ? '#94a3b8' : armored ? '#ef4444' : '#fb923c';
      const shellBot = hitFlash ? '#ffffff' : disabled ? '#64748b' : armored ? '#991b1b' : '#c2410c';

      // 3 pares de patas articuladas largas de centolla real
      for (let side = -1; side <= 1; side += 2) {
        for (let leg = 0; leg < 3; leg++) {
          const swing = (leg % 2 === 0 ? walk : -walk) * 0.6;
          const kx = side * (16 + leg * 4);
          const ky = -2 + leg * 3 + swing;
          const fx = side * (22 + leg * 3.5);
          const fy = 14 - leg * 0.5;
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 3.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(side * 10, 4);
          ctx.lineTo(kx, ky);
          ctx.lineTo(fx, fy);
          ctx.stroke();
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Pinzas delanteras grandes con borde naranja
      for (let c = -1; c <= 1; c += 2) {
        const snap = Math.sin(time * 9 + c) * 0.25;
        ctx.save();
        ctx.translate(c * 14, -4);
        ctx.rotate(c * (0.35 + snap));
        ctx.beginPath();
        ctx.ellipse(0, -6, 6.2, 4.6, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, shellTop, '#090d16', 1.6);
        ctx.restore();
      }

      // Caparazón abombado acorazado
      const cg = ctx.createRadialGradient(-3, -6, 3, 0, 0, 20);
      cg.addColorStop(0, shellTop);
      cg.addColorStop(1, shellBot);
      ctx.beginPath();
      ctx.ellipse(0, 1, 18, 12.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, cg, '#090d16', 2.0);

      if (armored) {
        // Corona de púas espinosas afiladas anti-stomp en la parte superior
        const spikeXs = [-11, -5, 0, 5, 11];
        spikeXs.forEach((px, idx) => {
          const tipY = idx === 2 ? -21 : idx === 1 || idx === 3 ? -19 : -15;
          ctx.beginPath();
          ctx.moveTo(px - 3, -9);
          ctx.lineTo(px, tipY);
          ctx.lineTo(px + 3, -9);
          ctx.closePath();
          SpriteBank.fillAndStroke(ctx, '#fde047', '#090d16', 1.3);
        });
      } else {
        // Caparazón agrietado tras perder armadura -> ¡Vulnerable al salto!
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(-1, -1);
        ctx.lineTo(5, -6);
        ctx.lineTo(2, 4);
        ctx.stroke();
      }

      // Ojos pedunculados amarillos
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(side * 5.5, -5, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(side * 5.5, -5, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /**
     * Zorro Colorado Fueguino (1 HP): pelaje rojizo cobrizo, cola tupida con punta blanca,
     * orejas punteadas y agilidad de salto evasivo ante disparos bajos.
     */
    drawFuegianFoxHD(ctx, e, cameraX, time) {
      if (e.dead) return;
      const sx = e.x - cameraX;
      if (sx < -100 || sx > 1060) return;

      const disabled = e.isDisabled && e.isDisabled();
      const legSwing = disabled ? 0 : Math.sin(time * 16) * 5;
      const inAir = !e.onGround;

      ctx.save();
      ctx.translate(sx + e.w * 0.5, e.y + e.h * 0.5);
      if (e.facing === 'left') ctx.scale(-1, 1);

      const furCoat = disabled ? '#94a3b8' : '#ea580c';
      const furBelly = disabled ? '#cbd5e1' : '#fef3c7';

      // Cola esponjosa larga con punta blanca
      ctx.save();
      ctx.translate(-12, 2);
      ctx.rotate((inAir ? -0.35 : Math.sin(time * 9) * 0.14) - 0.15);
      ctx.beginPath();
      ctx.ellipse(-10, 0, 12, 5.2, -0.15, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furCoat, '#090d16', 1.6);
      ctx.beginPath();
      ctx.ellipse(-19, -1, 4.5, 3.6, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#090d16', 1.2);
      ctx.restore();

      // Patas rápidas oscuras en los extremos
      SpriteBank.drawCapsule(ctx, -9, 5, -10 - legSwing, 15, 2.6, '#7c2d12', '#090d16', 1.3);
      SpriteBank.drawCapsule(ctx, -3, 6, -3 + legSwing * 0.7, 15, 2.5, '#9a3412', '#090d16', 1.3);
      SpriteBank.drawCapsule(ctx, 6, 5, 8 + legSwing, 15, 2.6, '#7c2d12', '#090d16', 1.3);
      SpriteBank.drawCapsule(ctx, 11, 6, 12 - legSwing * 0.7, 15, 2.5, '#9a3412', '#090d16', 1.3);

      // Cuerpo ágil y pecho crema
      ctx.beginPath();
      ctx.ellipse(0, 2, 15, 8.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furCoat, '#090d16', 1.8);
      ctx.beginPath();
      ctx.ellipse(7, 4, 7.5, 5.2, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = furBelly;
      ctx.fill();

      // Cabeza triangular astuta con hocico blanco
      ctx.beginPath();
      ctx.arc(12, -6, 7.5, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, furCoat, '#090d16', 1.7);
      ctx.beginPath();
      ctx.moveTo(15, -7);
      ctx.lineTo(24, -4.5);
      ctx.lineTo(15, -1.5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, furBelly, '#090d16', 1.4);

      // Punta nasal negra
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(23.5, -4.8, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Orejas puntiagudas negras por fuera
      for (let o = 0; o < 2; o++) {
        const ox = o === 0 ? 8 : 13;
        ctx.beginPath();
        ctx.moveTo(ox - 2.5, -11);
        ctx.lineTo(ox, -19);
        ctx.lineTo(ox + 3, -11);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, o === 0 ? '#7c2d12' : '#ea580c', '#090d16', 1.4);
      }

      // Ojo ambarino vivaz
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(14.5, -7.2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(14.8, -7.2, 0.9, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    /**
     * ENEMIGO EXCLUSIVO GARAJONAY: El Zorrito de Laurisilva (bosque enemigo.jfif).
     * Silueta orgánica y sombreado de 16 bits acorde al estilo visual de La Tina:
     * - Cabeza afilada expresiva con hocico puntiagudo blanco, trufa negra, ojos vivos y 2 orejas triangulares erguidas con interior claro
     * - Cuerpo esbelto y ágil de lomo curvado en rojizo-anaranjado cálido y pardo + pecho blanco esponjoso
     * - Cuatro patas finas con animación fluida de carrera y salto
     * - Cola larga, curva y muy esponjosa rojiza con punta blanca bien definida
     */
    drawGarajonayFoxHD(ctx, e, cameraX, time) {
      if (e.dead) return;
      const sx = e.x - cameraX;
      if (sx < -100 || sx > 1060) return;

      const disabled = e.isDisabled && e.isDisabled();
      const isCrouching =
        e.aiState === 'crouch_up' ||
        e.aiState === 'crouch_down' ||
        e.aiState === 'attack_crouch';
      const isClimbJump = e.aiState === 'climbing_jump';
      const isDropJump = e.aiState === 'drop_jump';
      const isAttackLeap = e.aiState === 'attack_leap' || e.aiState === 'dodge_jump';
      const inAir = !e.onGround;
      const isMoving = !disabled && !isCrouching && Math.abs(e.vx || 0) > 8;

      const stridePhase = time * 19;
      const stride = isMoving && !inAir ? Math.sin(stridePhase) : 0;
      const legSwing = stride * 5.2;
      const bounceY = isMoving && !inAir
        ? -Math.abs(Math.cos(stridePhase)) * 2.0
        : (isCrouching ? 2.8 : 0);

      const cx = sx + e.w * 0.5;
      const cy = e.y + e.h - 13.5;

      ctx.save();
      ctx.translate(cx, cy + bounceY);
      if (e.facing === 'left') ctx.scale(-1, 1);

      if (isCrouching) {
        const shake = e.aiState === 'attack_crouch' ? Math.sin(time * 42) * 0.8 : 0;
        ctx.translate(shake, 0);
        ctx.scale(1.10, 0.79);
      } else if (isClimbJump) {
        ctx.rotate((e.vy || 0) <= 0 ? -0.30 : 0.20);
        ctx.scale(1.09, 0.92);
      } else if (isDropJump) {
        ctx.rotate((e.vy || 0) <= 0 ? -0.08 : 0.24);
      } else if (isAttackLeap) {
        ctx.rotate(Math.max(-0.24, Math.min(0.28, (e.vy || 0) * 0.0005)));
        ctx.scale(1.09, 0.93);
      } else if (inAir) {
        ctx.rotate(Math.max(-0.22, Math.min(0.24, (e.vy || 0) * 0.00045)));
      }

      const outline = '#090d16';
      const rufousHi = disabled ? '#cbd5e1' : '#fb923c';
      const rufous = disabled ? '#94a3b8' : '#ea580c';
      const rufousDark = disabled ? '#64748b' : '#c2410c';
      const pardoBack = disabled ? '#64748b' : '#6b5b4e';
      const pardoDeep = disabled ? '#475569' : '#4a3f37';
      const whiteFur = '#ffffff';
      const creamFur = '#f1f5f9';
      const innerEar = disabled ? '#cbd5e1' : '#fed7aa';

      // 1. Cola larga, curva y esponjosa rojiza con punta blanca bien definida
      ctx.save();
      ctx.translate(-10.5, 0.2);
      const tailRot = inAir
        ? ((e.vy || 0) < 0 ? 0.16 : -0.26)
        : (isCrouching ? -0.16 : Math.sin(time * 10.5) * 0.17 - 0.06);
      ctx.rotate(tailRot);

      const traceTailBrush = () => {
        ctx.beginPath();
        ctx.moveTo(0, -2.2);
        ctx.bezierCurveTo(-8.5, -8.5, -19.5, -14.2, -27.2, -8.0);
        ctx.quadraticCurveTo(-30.0, -4.6, -26.8, -1.2);
        ctx.bezierCurveTo(-18.5, 3.0, -7.5, 3.4, 0, 2.2);
        ctx.closePath();
      };
      const tailGrad = ctx.createLinearGradient(-2, -10, -26, 2);
      tailGrad.addColorStop(0, rufousDark);
      tailGrad.addColorStop(0.5, rufous);
      tailGrad.addColorStop(1, rufousHi);

      ctx.save();
      traceTailBrush();
      ctx.fillStyle = tailGrad;
      ctx.fill();
      ctx.clip();
      // Matiz pardo suave en el lomo del penacho de la cola
      ctx.fillStyle = pardoBack;
      ctx.beginPath();
      ctx.ellipse(-10, -4.5, 8.5, 3.0, 0.22, 0, Math.PI * 2);
      ctx.fill();
      // Punta blanca bien definida con borde orgánico de mechones
      ctx.fillStyle = whiteFur;
      ctx.beginPath();
      ctx.moveTo(-18.8, -10.5);
      ctx.lineTo(-20.2, -6.5);
      ctx.lineTo(-18.4, -3.5);
      ctx.lineTo(-20.6, 0.2);
      ctx.lineTo(-29.5, 2.5);
      ctx.lineTo(-31.5, -11.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = creamFur;
      ctx.beginPath();
      ctx.ellipse(-25.5, -2.5, 5.2, 2.8, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      traceTailBrush();
      SpriteBank.fillAndStroke(ctx, null, outline, 1.65);
      ctx.restore();

      // Helper para dibujar cada pata fina con pezuña / garra oscura
      const drawFoxLeg = (hx, hy, fx, fy, legCol) => {
        SpriteBank.drawCapsule(ctx, hx, hy, fx, fy, 1.9, legCol, outline, 1.3);
        ctx.beginPath();
        ctx.ellipse(fx + 1.0, fy + 0.4, 2.1, 1.2, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#1c1917', outline, 1.0);
      };

      // Posiciones de las 4 patas según corrida, salto o agache
      let bhx = -7.5, bfx = -8.5 - legSwing, bfy = 13.0 - Math.max(0, stride) * 2.0;
      let fhx = 6.5, ffx = 7.5 + legSwing, ffy = 13.0 - Math.max(0, -stride) * 2.0;
      let bh2x = -6.0, bf2x = -6.5 + legSwing * 0.85, bf2y = 13.0 - Math.max(0, -stride) * 1.8;
      let fh2x = 8.5, ff2x = 9.0 - legSwing * 0.85, ff2y = 13.0 - Math.max(0, stride) * 1.8;

      if (inAir) {
        if (isClimbJump || isAttackLeap || (e.vy || 0) < 0) {
          bfx = -14.2; bfy = 11.8;
          bf2x = -12.0; bf2y = 12.6;
          ffx = 14.5; ffy = isAttackLeap ? 4.8 : 3.8;
          ff2x = 15.8; ff2y = isAttackLeap ? 6.6 : 6.0;
        } else {
          bfx = -10.2; bfy = 13.6;
          bf2x = -7.8; bf2y = 13.8;
          ffx = 10.5; ffy = 13.4;
          ff2x = 12.5; ff2y = 13.2;
        }
      } else if (isCrouching) {
        bfx = -8.5; bfy = 11.2;
        bf2x = -6.2; bf2y = 11.4;
        ffx = 7.2; ffy = 11.2;
        ff2x = 9.4; ff2y = 11.4;
      }

      // 2. Patas finas lejanas (detrás del torso)
      drawFoxLeg(bh2x, 3.2, bf2x, bf2y, rufousDark);
      drawFoxLeg(fh2x, 3.2, ff2x, ff2y, rufousDark);

      // 3. Cuerpo esbelto y ágil: lomo curvado cálido rojizo/pardo + pecho blanco esponjoso
      const traceTorso = () => {
        ctx.beginPath();
        ctx.moveTo(-12.2, 0.8);
        ctx.bezierCurveTo(-9.2, -8.2, 3.2, -8.6, 10.6, -4.0);
        ctx.bezierCurveTo(13.6, 0.2, 10.2, 6.2, 3.2, 6.2);
        ctx.bezierCurveTo(-4.8, 6.4, -12.2, 4.6, -12.2, 0.8);
        ctx.closePath();
      };
      const bodyGrad = ctx.createLinearGradient(-10, -8, 10, 7);
      bodyGrad.addColorStop(0, rufousHi);
      bodyGrad.addColorStop(0.55, rufous);
      bodyGrad.addColorStop(1, rufousDark);

      ctx.save();
      traceTorso();
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.clip();

      // Lomo superior pardo cálido siguiendo la curva dorsal
      const dorsalGrad = ctx.createLinearGradient(-10, -8, 4, 0);
      dorsalGrad.addColorStop(0, pardoBack);
      dorsalGrad.addColorStop(1, pardoDeep);
      ctx.fillStyle = dorsalGrad;
      ctx.beginPath();
      ctx.moveTo(-12, -1);
      ctx.bezierCurveTo(-8, -9, 2, -9, 8, -4.5);
      ctx.quadraticCurveTo(0, -2.5, -12, 1.5);
      ctx.closePath();
      ctx.fill();

      // Pecho y vientre delantero blanco esponjoso
      const chestGrad = ctx.createLinearGradient(5, -3, 12, 6);
      chestGrad.addColorStop(0, whiteFur);
      chestGrad.addColorStop(1, creamFur);
      ctx.fillStyle = chestGrad;
      ctx.beginPath();
      ctx.moveTo(6.2, -3.2);
      ctx.bezierCurveTo(13.5, -1.0, 12.8, 5.2, 7.2, 6.5);
      ctx.lineTo(3.5, 6.5);
      ctx.quadraticCurveTo(5.6, 4.2, 4.4, 2.2);
      ctx.quadraticCurveTo(6.5, 0.2, 6.2, -3.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      traceTorso();
      SpriteBank.fillAndStroke(ctx, null, outline, 1.75);

      // 4. Patas finas cercanas (delante del torso)
      drawFoxLeg(bhx, 3.0, bfx, bfy, rufous);
      drawFoxLeg(fhx, 2.8, ffx, ffy, rufousHi);

      // 5. Cabeza expresiva y afilada con 2 orejas triangulares erguidas y hocico puntiagudo blanco
      ctx.save();
      ctx.translate(10.2, -5.8);
      if (isCrouching) ctx.rotate(0.10);
      else if (inAir) ctx.rotate((e.vy || 0) < 0 ? -0.08 : 0.08);

      // Oreja trasera triangular erguida con interior claro
      const drawFoxEar = (bx, by, tx, ty, rx, ry, outerCol) => {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo((bx + tx) * 0.5 - 0.6, (by + ty) * 0.5, tx, ty);
        ctx.quadraticCurveTo((tx + rx) * 0.5 + 0.6, (ty + ry) * 0.5, rx, ry);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, outerCol, outline, 1.45);
        // Interior claro triangular
        ctx.fillStyle = innerEar;
        ctx.beginPath();
        ctx.moveTo(bx + (rx - bx) * 0.25, by - 0.8);
        ctx.lineTo(tx, ty + 2.4);
        ctx.lineTo(rx - (rx - bx) * 0.22, ry - 0.5);
        ctx.closePath();
        ctx.fill();
      };
      drawFoxEar(-3.2, -4.4, -3.6, -13.2, 1.4, -5.2, rufousDark);

      // Silueta orgánica curva de la cabeza + hocico afilado
      const traceHead = () => {
        ctx.beginPath();
        ctx.moveTo(-4.8, 0.6);
        ctx.bezierCurveTo(-4.0, -6.8, 3.8, -7.8, 7.6, -3.0);
        ctx.quadraticCurveTo(11.4, -1.8, 14.4, -0.1);
        ctx.quadraticCurveTo(11.2, 2.6, 6.2, 3.4);
        ctx.bezierCurveTo(2.4, 4.8, -2.5, 4.4, -4.8, 0.6);
        ctx.closePath();
      };
      const headGrad = ctx.createLinearGradient(-4, -7, 10, 4);
      headGrad.addColorStop(0, rufousHi);
      headGrad.addColorStop(0.55, rufous);
      headGrad.addColorStop(1, rufousDark);

      ctx.save();
      traceHead();
      ctx.fillStyle = headGrad;
      ctx.fill();
      ctx.clip();

      // Hocico puntiagudo blanco + mejillas claras esponjosas
      ctx.fillStyle = whiteFur;
      ctx.beginPath();
      ctx.moveTo(-1.2, 2.2);
      ctx.quadraticCurveTo(2.2, 0.8, 6.0, 0.0);
      ctx.quadraticCurveTo(10.8, 0.0, 14.6, 0.2);
      ctx.lineTo(14.0, 4.6);
      ctx.lineTo(-4.0, 4.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = creamFur;
      ctx.beginPath();
      ctx.ellipse(2.2, 2.6, 3.2, 1.4, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      traceHead();
      SpriteBank.fillAndStroke(ctx, null, outline, 1.7);

      // Oreja delantera triangular erguida con interior claro
      drawFoxEar(0.2, -4.2, 1.2, -13.8, 5.2, -4.8, rufous);

      // Trufa negra húmeda con brillo en la punta del hocico afilado
      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.ellipse(14.1, 0.1, 1.75, 1.35, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = whiteFur;
      ctx.beginPath();
      ctx.arc(13.8, -0.4, 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Ojo ambarino vivo expresivo con pupila vertical y punto de luz
      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.ellipse(5.5, -2.0, 2.0, 1.8, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = disabled ? '#cbd5e1' : '#fde047';
      ctx.beginPath();
      ctx.ellipse(5.6, -2.0, 1.45, 1.3, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = outline;
      ctx.beginPath();
      ctx.ellipse(5.8, -2.0, 0.6, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = whiteFur;
      ctx.beginPath();
      ctx.arc(5.1, -2.6, 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.restore();
    }

    /**
     * Enjambre de Cormoranes Australes (Imperial Shag - Zona 4 Faro Les Éclaireurs):
     * plumaje dorsal negro azulado brillante, pecho blanco, pico dorado-anaranjado.
     */
    drawSwarmCormorantHD(ctx, b, cameraX, time) {
      if (b.dead) return;
      const sx = b.x - cameraX;
      if (sx < -80 || sx > 1060) return;

      const flap = Math.sin(time * 22 + b.wingOffset);
      ctx.save();
      ctx.translate(sx + b.w * 0.5, b.y + b.h * 0.5);
      if (b.facing === 'right') ctx.scale(-1, 1);
      if (b.scaredFlying) ctx.rotate(-0.48);

      // Ala trasera negra
      ctx.save();
      ctx.rotate(-flap * 0.55);
      ctx.beginPath();
      ctx.moveTo(2, -2);
      ctx.quadraticCurveTo(10, -18, 22, -11);
      ctx.lineTo(8, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.4);
      ctx.restore();

      // Cuerpo hidrodinámico bicolor (espalda negra / vientre blanco)
      ctx.beginPath();
      ctx.ellipse(0, 1, 13, 6.2, 0.1, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.6);
      ctx.beginPath();
      ctx.ellipse(-1, 3.5, 9.5, 3.4, 0.05, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      // Cabeza estilizada negra con cresta y pico amarillo/naranja
      ctx.beginPath();
      ctx.arc(-10, -4, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.5);
      ctx.beginPath();
      ctx.moveTo(-14, -5);
      ctx.lineTo(-22, -3.5);
      ctx.lineTo(-14, -2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f59e0b', '#090d16', 1.2);

      // Ojo azul cian brillante característico del cormorán imperial
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-11.2, -5.2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Ala delantera batiendo fuerte contra el viento austral
      ctx.save();
      ctx.rotate(flap * 0.65);
      ctx.beginPath();
      ctx.moveTo(-1, -1);
      ctx.quadraticCurveTo(8, -19, 23, -9);
      ctx.lineTo(5, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#020617', 1.5);
      ctx.restore();

      ctx.restore();
    }

    // =========================================================================
    // CHILE: SPRITES HD DE FAUNA ANDINA, PORTEÑA Y RAPA NUI
    // =========================================================================
    drawPumaHD(ctx, e, x, y, time) {
      if (e.dead) return;
      const disabled = typeof e.isDisabled === 'function' && e.isDisabled();
      const rage = e.hp === 1;
      const flashWhite = (e.hitFlashTimer || 0) > 0 && Math.floor((e.hitFlashTimer || 0) * 28) % 2 === 0;
      const crouchScaleY = e.pounceState === 'crouch' ? 0.82 : 1.0;
      const stride = disabled || e.pounceState === 'crouch' ? 0 : Math.sin(time * (rage ? 15 : 10)) * 5.5;
      const coatTop = flashWhite ? '#fef08a' : rage ? '#ea580c' : '#d97706';
      const coatBot = flashWhite ? '#fde047' : rage ? '#9a3412' : '#92400e';

      ctx.save();
      ctx.translate(x + e.w * 0.5, y + e.h);
      if (e.facing === 'right') ctx.scale(-1, 1);
      ctx.scale(1, crouchScaleY);
      ctx.translate(0, -e.h * 0.5);

      if (rage) {
        ctx.shadowColor = 'rgba(239, 68, 68, 0.72)';
        ctx.shadowBlur = 10;
      }

      // Cola larga curvada con punta oscura
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(15, 2);
      ctx.quadraticCurveTo(26, -6 + Math.sin(time * 7) * 4, 29, -15);
      ctx.stroke();
      ctx.strokeStyle = coatTop;
      ctx.lineWidth = 3.8;
      ctx.stroke();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(29, -15, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Patas traseras e impulsoras
      SpriteBank.drawCapsule(ctx, 9, 6, 12 + stride, 13, 3.2, coatBot, '#0f172a', 1.6);
      SpriteBank.drawCapsule(ctx, -9, 6, -12 - stride, 13, 3.2, coatTop, '#0f172a', 1.6);

      // Cuerpo atlético del Puma Andino
      const bodyG = ctx.createLinearGradient(0, -10, 0, 10);
      bodyG.addColorStop(0, coatTop);
      bodyG.addColorStop(1, coatBot);
      ctx.beginPath();
      ctx.ellipse(2, 1, 16.5, 9, e.pounceState === 'pounce' ? -0.18 : 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyG, '#0f172a', 2.0);

      // Vientre claro
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(1, 5.5, 11, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Patas delanteras zarpadoras
      SpriteBank.drawCapsule(ctx, -11, 5, -15 + stride, 14, 3.0, coatTop, '#0f172a', 1.5);
      SpriteBank.drawCapsule(ctx, 12, 5, 16 - stride, 14, 3.0, coatBot, '#0f172a', 1.5);

      // Cabeza felina con orejas redondeadas
      ctx.save();
      ctx.translate(-14, -6);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-4, -7.5, 4.2, 0, Math.PI * 2);
      ctx.arc(3.5, -7.5, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = coatTop;
      ctx.beginPath();
      ctx.arc(-4, -7.2, 2.8, 0, Math.PI * 2);
      ctx.arc(3.5, -7.2, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, -1, 9.2, 7.6, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, coatTop, '#0f172a', 1.9);

      // Hocico pálido y nariz rosada-oscura
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(-5.5, 2.2, 4.6, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(-8.2, 1.0, 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Ojo felino ámbar brillante
      ctx.fillStyle = rage ? '#fef08a' : '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-3.5, -2.2, 2.2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4.1, -3.5, 1.1, 2.7);
      ctx.restore();

      ctx.restore();
    }

    drawVicunaHD(ctx, e, x, y, time) {
      if (e.dead) return;
      const disabled = typeof e.isDisabled === 'function' && e.isDisabled();
      const step = disabled ? 0 : Math.sin(time * 9) * 4;
      const charging = (e.spitTelegraphTimer || 0) > 0;

      ctx.save();
      ctx.translate(x + e.w * 0.5, y + e.h);
      if (e.facing === 'right') ctx.scale(-1, 1);
      ctx.translate(0, -e.h * 0.5);

      // Patas largas andinas
      SpriteBank.drawCapsule(ctx, -8, 6, -10 + step, 22, 2.6, '#b45309', '#0f172a', 1.5);
      SpriteBank.drawCapsule(ctx, -2, 6, -3 - step, 22, 2.6, '#d97706', '#0f172a', 1.5);
      SpriteBank.drawCapsule(ctx, 8, 6, 7 + step, 22, 2.6, '#b45309', '#0f172a', 1.5);
      SpriteBank.drawCapsule(ctx, 13, 6, 12 - step, 22, 2.6, '#d97706', '#0f172a', 1.5);

      // Cuerpo esbelto color canela y pecho blanco
      ctx.beginPath();
      ctx.ellipse(2, 2, 14, 8.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#d97706', '#0f172a', 1.9);

      // Mechón pectoral blanco característico de la vicuña
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.quadraticCurveTo(-15, 10, -7, 13);
      ctx.quadraticCurveTo(-2, 8, -5, 1);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#0f172a', 1.4);

      // Cuello largo curvado
      SpriteBank.drawCapsule(ctx, -8, -1, -11, -15, 4.4, '#e09f5a', '#0f172a', 1.8);

      // Cabeza grácil y orejas erguidas
      ctx.save();
      ctx.translate(-12, -17);
      // Orejas altas
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(2.5, -8, 2.2, 6.2, 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Cabeza
      ctx.beginPath();
      ctx.ellipse(-2, -1, 7.2, 4.8, 0.1, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f59e0b', '#0f172a', 1.7);
      // Mejilla hinchada / brillo salino antes de escupir
      if (charging) {
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(-6, 1, 3.6 + Math.sin(time * 28) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-2.5, -2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    drawSalineSpitHD(ctx, x, y, w, h, time, vx = -280) {
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5);
      if (vx > 0) ctx.scale(-1, 1);
      // Estela de cristales salinos
      ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.beginPath();
      ctx.arc(8, -1, 3.2, 0, Math.PI * 2);
      ctx.arc(13, 1.5, 2.1, 0, Math.PI * 2);
      ctx.fill();
      // Gota principal de sal blanca y cian
      const g = ctx.createRadialGradient(-2, -1, 1, 0, 0, 7.5);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, '#bae6fd');
      g.addColorStop(1, '#38bdf8');
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.2, 4.8, Math.sin(time * 20) * 0.15, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, g, '#0284c7', 1.5);
      ctx.restore();
    }

    drawPortDogHD(ctx, e, x, y, time) {
      if (e.dead) return;
      const disabled = typeof e.isDisabled === 'function' && e.isDisabled();
      const trot = disabled ? 0 : Math.sin(time * 16) * 4.5;

      ctx.save();
      ctx.translate(x + e.w * 0.5, y + e.h * 0.5);
      if (e.facing === 'right') ctx.scale(-1, 1);

      // Cola entusiasta en alto
      ctx.save();
      ctx.translate(12, -2);
      ctx.rotate(Math.sin(time * 18) * 0.35 - 0.5);
      SpriteBank.drawCapsule(ctx, 0, 0, 6, -8, 2.3, '#f59e0b', '#0f172a', 1.4);
      ctx.restore();

      // Patas rápidas
      SpriteBank.drawCapsule(ctx, -8, 4, -10 + trot, 12, 2.5, '#78350f', '#0f172a', 1.4);
      SpriteBank.drawCapsule(ctx, 8, 4, 10 - trot, 12, 2.5, '#9a3412', '#0f172a', 1.4);

      // Cuerpo ágil del quiltro porteño (café con mancha dorsal crema)
      ctx.beginPath();
      ctx.ellipse(0, 1, 13.5, 7.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#b45309', '#0f172a', 1.8);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(-2, 3.2, 8.2, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pañuelo rojo de puerto al cuello
      ctx.beginPath();
      ctx.moveTo(-9, -4);
      ctx.lineTo(-1, 3);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 1.3);

      // Cabeza alerta y oreja caída
      ctx.save();
      ctx.translate(-11, -5);
      ctx.beginPath();
      ctx.arc(0, 0, 6.8, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#d97706', '#0f172a', 1.8);
      // Hocico
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(-5, 1.5, 4.2, 3.0, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-8.2, 0.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      // Oreja oscura alegre
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(2.5, -3.5, 2.8, 4.8, 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Ojo
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-2.5, -1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      if (e.happyFleeing) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillText('♪', -6, -9);
      }
      ctx.restore();

      ctx.restore();
    }

    drawRapaNuiWarriorHD(ctx, e, x, y, time) {
      const hasPieces = e.flyingPieces && e.flyingPieces.length > 0;
      if (e.dead && !hasPieces) return;
      const sx = x;
      const sy = y;
      const stride = e.isDisabled && e.isDisabled() ? 0 : Math.sin(time * 9) * 4.5;
      const flashWhite = (e.hitFlashTimer || 0) > 0 && Math.floor((e.hitFlashTimer || 0) * 28) % 2 === 0;

      if (!e.dead) {
        ctx.save();
        ctx.translate(sx + e.w * 0.5, sy + e.h);
        if (e.facing === 'right') ctx.scale(-1, 1);

        // Piernas y faldón ceremonial de fibras vegetales
        SpriteBank.drawCapsule(ctx, -6, -16, -8 + stride, -2, 3.2, '#b45309', '#0f172a', 1.6);
        SpriteBank.drawCapsule(ctx, 6, -16, 8 - stride, -2, 3.2, '#92400e', '#0f172a', 1.6);
        ctx.beginPath();
        ctx.moveTo(-12, -24);
        ctx.lineTo(12, -24);
        ctx.lineTo(15, -12);
        ctx.lineTo(-15, -12);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#eab308', '#0f172a', 1.6);

        // Torso tatuado de guerrero Rapa Nui
        ctx.beginPath();
        ctx.roundRect(-11, -39, 22, 17, 5);
        SpriteBank.fillAndStroke(ctx, flashWhite ? '#fef08a' : '#c2410c', '#0f172a', 1.8);
        // Pintura blanca ceremonial Takona
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-7, -34);
        ctx.lineTo(7, -34);
        ctx.moveTo(-6, -29);
        ctx.lineTo(6, -29);
        ctx.stroke();

        // Remo ceremonial Ao en la mano trasera/lateral
        SpriteBank.drawCapsule(ctx, 11, -44, 15, -16, 2.2, '#78350f', '#0f172a', 1.4);
        ctx.beginPath();
        ctx.ellipse(10.5, -47, 5.2, 3.6, -0.25, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#92400e', '#0f172a', 1.4);

        // Tocados de plumas rojas y amarillas arriba
        const plumes = ['#dc2626', '#facc15', '#dc2626', '#ffffff'];
        plumes.forEach((pc, idx) => {
          ctx.fillStyle = pc;
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(-6 + idx * 4, -54, 2.2, 6.2, -0.2 + idx * 0.14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Cabeza descubierta o con Máscara Ceremoial de Piedra Moái (Fase 1)
        if (e.hasMask) {
          ctx.beginPath();
          ctx.roundRect(-12, -52, 24, 24, 5);
          SpriteBank.fillAndStroke(ctx, flashWhite ? '#e2e8f0' : '#64748b', '#0f172a', 2.2);
          // Ceño esculpido estilo Moái
          ctx.fillStyle = '#334155';
          ctx.fillRect(-10, -49, 20, 4);
          // Ojos brillantes de coral blanco y pupila roja
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-5, -41, 3.2, 0, Math.PI * 2);
          ctx.arc(5, -41, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-5, -41, 1.5, 0, Math.PI * 2);
          ctx.arc(5, -41, 1.5, 0, Math.PI * 2);
          ctx.fill();
          // Nariz larga rectilínea del Moái
          ctx.fillStyle = '#475569';
          ctx.fillRect(-2, -45, 4, 11);
        } else {
          ctx.beginPath();
          ctx.arc(0, -45, 8.2, 0, Math.PI * 2);
          SpriteBank.fillAndStroke(ctx, flashWhite ? '#fef08a' : '#c2410c', '#0f172a', 1.9);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-3.5, -46, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (hasPieces) {
        const camOffset = (e.x || 0) - sx;
        for (let i = 0; i < e.flyingPieces.length; i++) {
          const pc = e.flyingPieces[i];
          ctx.save();
          ctx.translate(pc.x - camOffset, pc.y);
          ctx.rotate(pc.angle);
          ctx.globalAlpha = Math.max(0, Math.min(1, pc.life * 1.4));
          ctx.beginPath();
          ctx.roundRect(-10, -10, 20, 20, 4);
          SpriteBank.fillAndStroke(ctx, '#64748b', '#0f172a', 2.0);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-6, -4, 4, 4);
          ctx.fillRect(2, -4, 4, 4);
          ctx.restore();
        }
      }
    }

    drawSwarmFrigateHD(ctx, b, cameraX, time) {
      if (b.dead) return;
      const sx = b.x - cameraX;
      if (sx < -80 || sx > 1060) return;

      const flap = Math.sin(time * 22 + b.wingOffset);
      ctx.save();
      ctx.translate(sx + b.w * 0.5, b.y + b.h * 0.5);
      if (b.facing === 'right') ctx.scale(-1, 1);
      if (b.scaredFlying) ctx.rotate(-0.48);

      // Cola profundamente ahorquillada característica de la fragata del Pacífico
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(24, -6);
      ctx.lineTo(15, 0);
      ctx.lineTo(25, 6);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#020617', '#0f172a', 1.3);

      // Ala trasera angular
      ctx.save();
      ctx.rotate(-flap * 0.55);
      ctx.beginPath();
      ctx.moveTo(1, -2);
      ctx.lineTo(14, -20);
      ctx.lineTo(22, -10);
      ctx.lineTo(8, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.4);
      ctx.restore();

      // Cuerpo negro elegante + saco gular rojo escarlata inflado en el pecho
      ctx.beginPath();
      ctx.ellipse(-1, 1, 13.5, 5.8, 0.08, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.6);

      ctx.beginPath();
      ctx.arc(-8.5, 3.8, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#7f1d1d', 1.3);

      // Cabeza y pico ganchudo
      ctx.beginPath();
      ctx.arc(-10, -4, 4.8, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.5);
      ctx.beginPath();
      ctx.moveTo(-14, -5);
      ctx.lineTo(-23, -3.2);
      ctx.lineTo(-14, -1.8);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#94a3b8', '#0f172a', 1.2);

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-11, -5, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Ala delantera larga en "W"
      ctx.save();
      ctx.rotate(flap * 0.65);
      ctx.beginPath();
      ctx.moveTo(-1, -1);
      ctx.lineTo(12, -21);
      ctx.lineTo(24, -8);
      ctx.lineTo(5, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#020617', 1.5);
      ctx.restore();

      ctx.restore();
    }

    /** Cóndor Andino HD (Santiago / Atacama): enorme envergadura negra con collarín blanco y cresta roja. */
    drawCondorHD(ctx, e, cameraX, time) {
      if (e.dead) return;
      const sx = e.x - cameraX;
      if (sx + e.w < -80 || sx > 1040) return;
      const flap = Math.sin(time * 8.5 + (e.swoopPhase || 0)) * 0.48;

      ctx.save();
      ctx.translate(sx + e.w * 0.5, e.y + e.h * 0.5);
      if (e.facing === 'right') ctx.scale(-1, 1);

      // Cola ancha escalonada
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(26, -7);
      ctx.lineTo(25, 6);
      ctx.lineTo(10, 4);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.5);

      // Ala trasera enorme con banda blanca dorsal
      ctx.save();
      ctx.rotate(-flap * 0.6);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(14, -24);
      ctx.lineTo(26, -15);
      ctx.lineTo(10, 0);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#1e293b', '#020617', 1.6);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(12, -13, 6.5, 2.6, -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cuerpo negro majestuoso
      ctx.beginPath();
      ctx.ellipse(-1, 1, 16, 7.2, 0.08, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.8);

      // Collarín blanco característico del cóndor
      ctx.beginPath();
      ctx.ellipse(-12, -1, 5.2, 6.2, -0.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#0f172a', 1.4);

      // Cabeza rosácea/grisácea + cresta roja (carúncula) + pico curvo dorado
      ctx.beginPath();
      ctx.arc(-17, -4.5, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#fca5a5', '#0f172a', 1.5);
      ctx.beginPath();
      ctx.roundRect(-20, -11.5, 7, 4.2, 2);
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#7f1d1d', 1.1);
      ctx.beginPath();
      ctx.moveTo(-21, -5.2);
      ctx.lineTo(-28, -2.5);
      ctx.lineTo(-21, -1.2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#fbbf24', '#0f172a', 1.3);

      // Ala delantera extendida con puntas primarias
      ctx.save();
      ctx.rotate(flap * 0.72);
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.lineTo(11, -25);
      ctx.lineTo(27, -14);
      ctx.lineTo(22, -6);
      ctx.lineTo(6, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#020617', '#0f172a', 1.6);
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(12, -13, 7.2, 2.8, -0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    /** Pelícano Porteño HD (Viña / Valparaíso): plumaje gris/crema y enorme bolsa naranja. */
    drawPortPelicanHD(ctx, e, cameraX, time) {
      if (e.dead) return;
      const sx = e.x - cameraX;
      if (sx + e.w < -80 || sx > 1040) return;
      const flap = Math.sin(time * 9.5) * 0.45;

      ctx.save();
      ctx.translate(sx + e.w * 0.5, e.y + e.h * 0.5);
      if (e.facing === 'right') ctx.scale(-1, 1);

      // Ala trasera
      ctx.save();
      ctx.rotate(-flap * 0.55);
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(13, -19);
      ctx.lineTo(22, -9);
      ctx.lineTo(6, 2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#64748b', '#0f172a', 1.4);
      ctx.restore();

      // Cuerpo blanco/gris costero
      ctx.beginPath();
      ctx.ellipse(1, 2, 14.5, 7.2, 0.05, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#e2e8f0', '#0f172a', 1.7);

      // Cuello + cabeza crema
      ctx.beginPath();
      ctx.arc(-11, -4.5, 5.8, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f8fafc', '#0f172a', 1.6);

      // Enorme pico largo y bolsa gular amarillo-naranja
      ctx.beginPath();
      ctx.moveTo(-15, -6);
      ctx.lineTo(-30, -3.5);
      ctx.lineTo(-16, -2.2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#eab308', '#0f172a', 1.3);

      ctx.beginPath();
      ctx.moveTo(-15, -2.5);
      ctx.quadraticCurveTo(-22, 7.5, -28, -2.8);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#fb923c', '#7c2d12', 1.3);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-12.5, -5.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Ala delantera batiente
      ctx.save();
      ctx.rotate(flap * 0.72);
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.lineTo(12, -20);
      ctx.lineTo(23, -7);
      ctx.lineTo(6, 3);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#94a3b8', '#0f172a', 1.5);
      ctx.restore();

      ctx.restore();
    }

    /** Proyectil de pez plateado dejado caer por el Pelícano Porteño. */
    drawPelicanDropHD(ctx, drop, cameraX, time) {
      if (drop.dead) return;
      const sx = drop.x - cameraX;
      if (sx < -40 || sx > 1000) return;

      ctx.save();
      ctx.translate(sx + drop.w * 0.5, drop.y + drop.h * 0.5);
      ctx.rotate(Math.sin(time * 12) * 0.25 + 1.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8.2, 4.2, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#38bdf8', '#0c4a6e', 1.5);
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-12, -4);
      ctx.lineTo(-12, 4);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#0284c7', '#0c4a6e', 1.2);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4.5, -1, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /** Peligro marino/volcánico vertical (pez volador / piraña del Pacífico / pez austral / pez magma). */
    drawPacificJumpHazardHD(ctx, haz, cameraX, time) {
      const sx = haz.x - cameraX;
      if (sx + haz.w < -60 || sx > 1020) return;
      const isMagma = haz.kind === 'magma_piranha';
      const isFlyFish = haz.kind === 'flying_fish';
      const isBeagle = haz.kind === 'beagle_fish';

      ctx.save();
      // Espuma o burbujeo de alerta en la línea de agua / magma
      if (haz.state === 'warning' || haz.state === 'air') {
        const cx = sx + haz.w * 0.5;
        const splashW = 16 + Math.sin(time * 24) * 4;
        ctx.fillStyle = isMagma ? 'rgba(251, 146, 60, 0.85)' : 'rgba(224, 242, 254, 0.86)';
        ctx.beginPath();
        ctx.ellipse(cx, haz.baseY - 2, splashW, 4.8, 0, 0, Math.PI * 2);
        ctx.fill();
        if (haz.state === 'warning') {
          ctx.fillStyle = isMagma ? '#f97316' : '#38bdf8';
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('▲', cx, haz.baseY - 9);
          ctx.restore();
          return;
        }
      }
      if (haz.state !== 'air') {
        ctx.restore();
        return;
      }

      ctx.translate(sx + haz.w * 0.5, haz.y + haz.h * 0.5);
      ctx.rotate(haz.isDescending ? 0.55 : -0.55);

      const bodyColor = isMagma ? '#ef4444' : isFlyFish ? '#0ea5e9' : isBeagle ? '#0369a1' : '#0284c7';
      const finColor = isMagma ? '#fde047' : isFlyFish ? '#7dd3fc' : isBeagle ? '#bae6fd' : '#f43f5e';
      // Aletas
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(-10, 14);
      ctx.lineTo(6, 13);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, finColor, '#0f172a', 1.4);

      if (isFlyFish) {
        // Alas pectorales anchas de pez volador
        ctx.beginPath();
        ctx.moveTo(-2, -4);
        ctx.lineTo(-15, -11);
        ctx.lineTo(10, -8);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, '#bae6fd', '#0369a1', 1.3);
      }

      // Cuerpo en salto vertical
      ctx.beginPath();
      ctx.ellipse(0, 0, 11.5, 13.5, 0, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyColor, '#0f172a', 1.8);

      if (isBeagle) {
        // Vientre plateado austral de aguas frías del Canal Beagle
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(2.5, 1.5, 6.2, 10.5, 0, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.fill();
      }

      // Ojo feroz y dientes blancos
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-4.5, -5, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-4.8, -5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      for (let tx = -5; tx <= 5; tx += 3.5) {
        ctx.beginPath();
        ctx.moveTo(tx, -12);
        ctx.lineTo(tx + 1.5, -8.5);
        ctx.lineTo(tx + 3, -12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    static drawCuecaHandkerchief(ctx, hx, hy, phase) {
      const flutter = Math.sin(phase * 2.2) * 3.2;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(Math.sin(phase * 1.4) * 0.35 - 0.15);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-7, -9 + flutter * 0.4, -12, -4 + flutter);
      ctx.quadraticCurveTo(-6, -1 + flutter * 0.5, -1, 4);
      ctx.quadraticCurveTo(3, 1, 0, 0);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#64748b', 1.2);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.lineTo(-9, -3 + flutter * 0.7);
      ctx.stroke();
      ctx.restore();
    }

    static getCuecaMotion(e, time) {
      const disabled = e.isDisabled && e.isDisabled();
      const phase = disabled ? 0 : (Number.isFinite(e.dancePhase) ? e.dancePhase : time * 5.6);
      const zapL = disabled ? 0 : Math.max(0, Math.sin(phase * 2.5)) * 4.2;
      const zapR = disabled ? 0 : Math.max(0, -Math.sin(phase * 2.5)) * 4.2;
      const sway = disabled ? 0 : Math.sin(phase * 1.3) * 2.0;
      let spinScale = 1;
      if (!disabled && (e.spinTimer || 0) > 0) {
        const raw = Math.cos((e.spinTimer / 0.24) * Math.PI);
        spinScale = Math.abs(raw) < 0.36 ? (raw < 0 ? -0.36 : 0.36) : raw;
      }
      return { disabled, phase, zapL, zapR, sway, spinScale };
    }

    drawGuasoHD(ctx, e, x, y, time) {
      if (e.dead) return;
      const m = SpriteBank.getCuecaMotion(e, time);
      ctx.save();
      ctx.translate(x + e.w * 0.5, y + e.h);
      ctx.scale((e.facing === 'right' ? -1 : 1) * m.spinScale, 1);

      // Piernas con pantalones oscuros a rayas y polainas negras
      SpriteBank.drawCapsule(ctx, -5, -18, -7, -4 - m.zapL, 3.1, '#1f2937', '#0f172a', 1.5);
      SpriteBank.drawCapsule(ctx, 5, -18, 7, -4 - m.zapR, 3.1, '#334155', '#0f172a', 1.5);

      // Botas de huaso negras + correa café + espuela plateada en el talón
      [[-7, -2 - m.zapL], [7, -2 - m.zapR]].forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.ellipse(bx - 2, by, 5.2, 2.8, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.3);
        ctx.fillStyle = '#a16207';
        ctx.fillRect(bx - 1.5, by - 4.2, 5.5, 2.2);
        // Estrella metálica de espuela en el talón trasero
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(bx + 5.2, by - 1.8, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Camisa blanca (mangas visibles) y brazo alzado con pañuelo blanco
      const handX = -9 + Math.sin(m.phase * 1.5) * 3.5;
      const handY = -44 + Math.cos(m.phase * 2.6) * 2.4;
      SpriteBank.drawCapsule(ctx, 7, -30, 12, -20, 2.5, '#f8fafc', '#0f172a', 1.3);
      SpriteBank.drawCapsule(ctx, -7, -31, handX, handY, 2.6, '#f8fafc', '#0f172a', 1.3);
      SpriteBank.drawCuecaHandkerchief(ctx, handX, handY, m.phase);

      // Chamanto / Poncho chileno rojo, blanco y azul con motivos tradicionales
      ctx.beginPath();
      ctx.moveTo(-10 + m.sway * 0.4, -36);
      ctx.lineTo(10 + m.sway * 0.4, -36);
      ctx.lineTo(13.5 + m.sway, -18);
      ctx.lineTo(-13.5 + m.sway, -18);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 1.7);

      // Franjas azul marino y blancas del chamanto
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-10.5 + m.sway * 0.6, -30.5, 21, 3.2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-11.2 + m.sway * 0.7, -27.3, 22.4, 2.1);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-12.2 + m.sway * 0.85, -21.2, 24.4, 2.6);

      // Motivos florales tradicionales (copihues / flores bordadas)
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-5 + m.sway * 0.6, -24.5, 3, 2);
      ctx.fillRect(3 + m.sway * 0.6, -34, 3, 2);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-3.5 + m.sway * 0.6, -24.8, 2, 2);
      ctx.fillRect(4.5 + m.sway * 0.6, -34.2, 2, 2);

      // Faja oscura en la cintura
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, -18.5, 16, 2.8);

      // Cabeza y rostro
      ctx.beginPath();
      ctx.arc(m.sway * 0.3, -40.5, 6.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f3cfb6', '#0f172a', 1.5);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-2.5 + m.sway * 0.3, -41, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Sombrero de huaso de ala ancha negro plano + cinta
      ctx.beginPath();
      ctx.ellipse(m.sway * 0.3, -44.2, 14.5, 3.1, -0.04, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.5);
      ctx.beginPath();
      ctx.roundRect(-6.8 + m.sway * 0.3, -51.2, 13.6, 7.2, 2);
      SpriteBank.fillAndStroke(ctx, '#111827', '#020617', 1.5);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-6.2 + m.sway * 0.3, -46.1, 12.4, 1.4);

      ctx.restore();
    }

    drawGuasaHD(ctx, e, x, y, time) {
      if (e.dead) return;
      const m = SpriteBank.getCuecaMotion(e, time);
      const skirtFlare = Math.sin(m.phase * 1.4) * 3.0;
      ctx.save();
      ctx.translate(x + e.w * 0.5, y + e.h);
      ctx.scale((e.facing === 'right' ? -1 : 1) * m.spinScale, 1);

      // Piernas y zapatos oscuros tradicionales de bailarina
      SpriteBank.drawCapsule(ctx, -4.5, -13, -5.5, -3 - m.zapL, 2.3, '#e8b896', '#0f172a', 1.2);
      SpriteBank.drawCapsule(ctx, 4.5, -13, 5.5, -3 - m.zapR, 2.3, '#e8b896', '#0f172a', 1.2);
      [[-5.5, -1.8 - m.zapL], [5.5, -1.8 - m.zapR]].forEach(([sxFoot, syFoot]) => {
        ctx.beginPath();
        ctx.ellipse(sxFoot - 1.2, syFoot, 4.2, 2.3, 0, 0, Math.PI * 2);
        SpriteBank.fillAndStroke(ctx, '#0f172a', '#020617', 1.3);
      });

      // Falda amplia de china (roja con vuelo) y volantes blancos de encaje en el borde
      ctx.beginPath();
      ctx.moveTo(-7.5 + m.sway * 0.4, -24);
      ctx.lineTo(7.5 + m.sway * 0.4, -24);
      ctx.quadraticCurveTo(17 + skirtFlare, -16, 15.5 + skirtFlare, -10.5);
      ctx.lineTo(-15.5 + skirtFlare, -10.5);
      ctx.quadraticCurveTo(-17 + skirtFlare, -16, -7.5 + m.sway * 0.4, -24);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 1.6);

      // Volantes / fustán blanco en la parte inferior de la falda
      ctx.beginPath();
      ctx.moveTo(-15 + skirtFlare, -13.5);
      ctx.lineTo(15 + skirtFlare, -13.5);
      ctx.lineTo(16.2 + skirtFlare, -9.2);
      for (let rx = 13; rx >= -13; rx -= 5.2) {
        ctx.quadraticCurveTo(rx + skirtFlare, -7.2, rx - 2.6 + skirtFlare, -9.4);
      }
      ctx.lineTo(-16.2 + skirtFlare, -9.2);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#ffffff', '#64748b', 1.2);

      // Lunares amarillos y blancos sobre el vestido rojo
      const dots = [
        [-6, -20.5, '#fde047'],
        [0, -18.5, '#ffffff'],
        [5.5, -20.2, '#fde047'],
        [-9.5, -16.5, '#ffffff'],
        [-3.5, -15.8, '#fde047'],
        [3.5, -15.6, '#ffffff'],
        [9.5, -16.4, '#fde047']
      ];
      dots.forEach(([dx, dy, dc]) => {
        ctx.fillStyle = dc;
        ctx.beginPath();
        ctx.arc(dx + skirtFlare * 0.55, dy, 1.35, 0, Math.PI * 2);
        ctx.fill();
      });

      // Blusa / cuerpo rojo con dos tiras verticales de encaje blanco y escote blanco
      ctx.beginPath();
      ctx.roundRect(-7 + m.sway * 0.35, -35.5, 14, 12, 3.5);
      SpriteBank.fillAndStroke(ctx, '#dc2626', '#0f172a', 1.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4.6 + m.sway * 0.35, -35, 2.2, 11);
      ctx.fillRect(2.4 + m.sway * 0.35, -35, 2.2, 11);
      ctx.fillRect(-3.5 + m.sway * 0.35, -35.2, 7, 2);

      // Cinta y lazo blanco atado en la cintura
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 0.9;
      ctx.fillRect(-7.5 + m.sway * 0.4, -24.8, 15, 2.6);
      ctx.beginPath();
      ctx.ellipse(7.2 + m.sway * 0.4, -22.2, 2.8, 4.4, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Brazos: uno sostiene el borde de la falda y el otro agita el pañuelo blanco en alto
      SpriteBank.drawCapsule(ctx, 7, -33, 13.5 + skirtFlare * 0.7, -17, 2.1, '#f3cfb6', '#0f172a', 1.2);
      const handX = -9.5 + Math.sin(m.phase * 1.5) * 3.4;
      const handY = -44 + Math.cos(m.phase * 2.6) * 2.4;
      SpriteBank.drawCapsule(ctx, -7, -33, handX, handY, 2.1, '#f3cfb6', '#0f172a', 1.2);
      // Mangas farol rojas con puño blanco
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(-7, -33, 3.2, 0, Math.PI * 2);
      ctx.arc(7, -33, 3.2, 0, Math.PI * 2);
      ctx.fill();
      SpriteBank.drawCuecaHandkerchief(ctx, handX, handY, m.phase);

      // Cabello castaño oscuro con coleta suelta + cabeza y sonrisa
      ctx.beginPath();
      ctx.ellipse(5.5 + m.sway * 0.4, -37.5, 4.2, 6.8, -0.32, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#291d18', '#0f172a', 1.3);
      ctx.beginPath();
      ctx.arc(m.sway * 0.25, -40.8, 6.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f3cfb6', '#0f172a', 1.5);
      // Flequillo/pelo oscuro superior
      ctx.beginPath();
      ctx.arc(m.sway * 0.25, -42.4, 6.3, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fillStyle = '#291d18';
      ctx.fill();
      // Ojo y sonrisa
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-2.5 + m.sway * 0.25, -40.6, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-3.4 + m.sway * 0.25, -37.8, 2.6, 1.2);

      ctx.restore();
    }

    drawPeacockHD(ctx, x, y, facing, animTimer, isDisabled, tailOpen = false, hitFlash = false, hp = 2) {
      ctx.save();
      ctx.translate(x + 19, y + 46);
      if (facing === 'left') ctx.scale(-1, 1);

      const flashOn = hitFlash && Math.floor(animTimer * 36) % 2 === 0;
      const walkCycle = isDisabled || tailOpen ? 0 : Math.sin(animTimer * 10);
      const bob = isDisabled ? 0 : tailOpen ? Math.sin(animTimer * 28) * 0.7 : Math.abs(walkCycle) * 1.4;

      // 1. Cola (Plegada elegante vs Abanico semicircular gigante zamarreándose)
      if (tailOpen) {
        const shakeX = isDisabled ? 0 : Math.sin(animTimer * 42) * 2.4;
        const shakeRot = isDisabled ? 0 : Math.sin(animTimer * 36) * 0.055;
        ctx.save();
        ctx.translate(-3 + shakeX, -22);
        ctx.rotate(shakeRot);

        const fanGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 32);
        fanGrad.addColorStop(0, isDisabled ? '#475569' : '#065f46');
        fanGrad.addColorStop(0.55, isDisabled ? '#64748b' : '#059669');
        fanGrad.addColorStop(0.85, isDisabled ? '#94a3b8' : '#10b981');
        fanGrad.addColorStop(1, isDisabled ? '#cbd5e1' : '#14b8a6');

        // Abanico principal con borde festoneado de plumas
        ctx.beginPath();
        ctx.moveTo(0, 4);
        const rimSteps = 14;
        for (let s = 0; s <= rimSteps; s++) {
          const ang = Math.PI * (0.94 + (s / rimSteps) * 1.12);
          const scallop = s % 2 === 0 ? 32.5 : 29.8;
          ctx.lineTo(Math.cos(ang) * scallop, Math.sin(ang) * scallop);
        }
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, fanGrad, '#064e3b', 1.6);

        // Nervaduras radiantes de plumas verdes
        ctx.strokeStyle = isDisabled ? '#cbd5e1' : 'rgba(110, 231, 183, 0.55)';
        ctx.lineWidth = 1.1;
        for (let r = 0; r <= 10; r++) {
          const ang = Math.PI * (1.02 + (r / 10) * 0.96);
          ctx.beginPath();
          ctx.moveTo(0, 1);
          ctx.lineTo(Math.cos(ang) * 28, Math.sin(ang) * 28);
          ctx.stroke();
        }

        // Ocelos radiantes azules y dorados en 2 arcos concéntricos (7 exteriores + 4 interiores)
        const drawOcelo = (ox, oy, rx, ry) => {
          ctx.fillStyle = isDisabled ? '#94a3b8' : '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(ox, oy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isDisabled ? '#64748b' : '#0ea5e9';
          ctx.beginPath();
          ctx.ellipse(ox, oy, rx * 0.68, ry * 0.68, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.ellipse(ox, oy + ry * 0.08, rx * 0.36, ry * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
        };

        for (let i = 0; i < 7; i++) {
          const ang = Math.PI * (1.04 + (i / 6) * 0.92);
          drawOcelo(Math.cos(ang) * 23.5, Math.sin(ang) * 23.5, 3.2, 2.7);
        }
        for (let i = 0; i < 4; i++) {
          const ang = Math.PI * (1.16 + (i / 3) * 0.68);
          drawOcelo(Math.cos(ang) * 14.5, Math.sin(ang) * 14.5, 2.7, 2.3);
        }
        ctx.restore();
      } else {
        // Estado Pasivo: larga cola verde esmeralda plegada hacia atrás
        const tailSway = isDisabled ? 0 : Math.sin(animTimer * 8) * 1.8;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-4, -18 - bob);
        ctx.quadraticCurveTo(-20, -14 + tailSway * 0.5, -37, -7 + tailSway);
        ctx.quadraticCurveTo(-24, -4 + tailSway * 0.7, -5, -11 - bob);
        ctx.closePath();
        const trainGrad = ctx.createLinearGradient(-37, -14, -4, -10);
        trainGrad.addColorStop(0, isDisabled ? '#64748b' : '#10b981');
        trainGrad.addColorStop(1, isDisabled ? '#475569' : '#047857');
        SpriteBank.fillAndStroke(ctx, trainGrad, '#064e3b', 1.4);

        // 4 ocelos dorados y azules sobre la cola plegada
        const trailSpots = [
          [-14, -12.5 + tailSway * 0.25],
          [-21, -10.5 + tailSway * 0.45],
          [-28, -9 + tailSway * 0.7],
          [-33.5, -7.8 + tailSway * 0.9]
        ];
        for (const [sx, sy] of trailSpots) {
          ctx.fillStyle = isDisabled ? '#94a3b8' : '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(sx, sy, 2.3, 1.6, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1d4ed8';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Patas finas articuladas
      const stride = walkCycle * 4.2;
      SpriteBank.drawCapsule(ctx, -3, -12, -4 - stride, -2, 1.5, '#d97706', '#0f172a', 1.1);
      SpriteBank.drawCapsule(ctx, 4, -12, 5 + stride, -2, 1.5, '#f59e0b', '#0f172a', 1.1);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-6 - stride, -2.2, 4.5, 2.0);
      ctx.fillRect(3 + stride, -2.2, 4.5, 2.0);

      // 3. Cuerpo erguido y ala plegada en azul cobalto brillante
      const bodyGrad = ctx.createLinearGradient(0, -28 - bob, 0, -10 - bob);
      bodyGrad.addColorStop(0, isDisabled ? '#64748b' : '#2563eb');
      bodyGrad.addColorStop(0.55, isDisabled ? '#475569' : '#1d4ed8');
      bodyGrad.addColorStop(1, '#1e3a8a');
      ctx.beginPath();
      ctx.ellipse(1, -17 - bob, 10.5, 7.6, -0.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, bodyGrad, '#0f172a', 1.7);

      // Ala lateral turquesa/cobre con textura
      ctx.beginPath();
      ctx.ellipse(-2, -16 - bob, 7.2, 4.4, 0.12, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, isDisabled ? '#64748b' : '#0f766e', '#0f172a', 1.3);

      // 4. Cuello en S, cabeza cobalto, parche facial blanco, pico ámbar y penacho real
      ctx.beginPath();
      ctx.moveTo(4, -22 - bob);
      ctx.quadraticCurveTo(10, -29 - bob, 8.5, -36.5 - bob);
      ctx.lineTo(4.2, -36.5 - bob);
      ctx.quadraticCurveTo(5, -28 - bob, 0, -21 - bob);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, isDisabled ? '#64748b' : '#1d4ed8', '#0f172a', 1.5);

      // Cabeza
      ctx.beginPath();
      ctx.arc(6.8, -37.2 - bob, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, isDisabled ? '#94a3b8' : '#2563eb', '#0f172a', 1.6);

      // Parche facial blanco y ojo
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(8.0, -37.0 - bob, 2.6, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(8.5, -37.2 - bob, 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8.7, -37.9 - bob, 0.6, 0.6);

      // Pico ámbar agudo
      ctx.beginPath();
      ctx.moveTo(11.3, -37.8 - bob);
      ctx.lineTo(16.2, -35.8 - bob);
      ctx.lineTo(11.2, -34.6 - bob);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#f59e0b', '#0f172a', 1.2);

      // Penacho / corona real en la cabeza (4 plumas con borla azul cobalto/oro)
      for (let c = 0; c < 4; c++) {
        const fan = -0.35 + c * 0.22;
        const tx = 5.5 + Math.sin(fan) * 6.5;
        const ty = -41.5 - bob - Math.cos(fan) * 6.2;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(6.2, -41.5 - bob);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.fillStyle = c % 2 === 0 ? '#38bdf8' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Indicador visual sutil cuando queda 1/2 HP o destello de impacto
      if (hp === 1 && !isDisabled) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(1, -24 - bob, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (flashOn) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
        ctx.beginPath();
        ctx.ellipse(2, -23, 18, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawCrazyCyclistHD(ctx, x, y, facing, animTimer, isDisabled = false) {
      ctx.save();
      ctx.translate(x + 21, y + 44);
      if (facing === 'left') ctx.scale(-1, 1);

      const wheelAngle = isDisabled ? 0 : animTimer * 24;
      const pedalAngle = isDisabled ? 0 : animTimer * 20;
      const bob = isDisabled ? 0 : Math.sin(animTimer * 20) * 1.1;

      // Líneas de velocidad cuando pedalea
      if (!isDisabled) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-27, -28);
        ctx.lineTo(-18, -28);
        ctx.moveTo(-30, -18);
        ctx.lineTo(-21, -18);
        ctx.stroke();
      }

      // Ruedas rápidas con rayos giratorios
      const drawWheel = (wx, wy) => {
        ctx.beginPath();
        ctx.arc(wx, wy, 9.6, 0, Math.PI * 2);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.6;
        ctx.stroke();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // Rayos giratorios
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
        ctx.lineWidth = 1.0;
        for (let s = 0; s < 3; s++) {
          const a = wheelAngle + (s * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(wx + Math.cos(a) * 8, wy + Math.sin(a) * 8);
          ctx.lineTo(wx - Math.cos(a) * 8, wy - Math.sin(a) * 8);
          ctx.stroke();
        }
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(wx, wy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      };
      drawWheel(-13, -10);
      drawWheel(13, -10);

      // Cuadro deportivo rojo/naranja de bicicleta
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const drawFramePath = () => {
        ctx.beginPath();
        ctx.moveTo(-13, -10);
        ctx.lineTo(-1, -10);
        ctx.lineTo(8, -22);
        ctx.lineTo(-4, -22);
        ctx.closePath();
        ctx.moveTo(-1, -10);
        ctx.lineTo(-5, -25);
        ctx.moveTo(8, -22);
        ctx.lineTo(13, -10);
        ctx.moveTo(8, -22);
        ctx.lineTo(10, -26.5);
      };
      drawFramePath();
      ctx.stroke();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.4;
      drawFramePath();
      ctx.stroke();

      // Manubrio curvo y asiento
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(9, -26.5);
      ctx.lineTo(13, -26.5);
      ctx.quadraticCurveTo(15.5, -25, 13.5, -22.5);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8.5, -26.5, 7, 2.5);

      // Pierna trasera pedaleando
      const px2 = -1 + Math.cos(pedalAngle + Math.PI) * 4.5;
      const py2 = -10 + Math.sin(pedalAngle + Math.PI) * 4.5;
      SpriteBank.drawCapsule(ctx, -4, -25 + bob, -1 + (px2 + 1) * 0.4, -17 + bob * 0.5, 2.4, '#1e293b', '#0f172a', 1.2);
      SpriteBank.drawCapsule(ctx, -1 + (px2 + 1) * 0.4, -17 + bob * 0.5, px2, py2, 2.1, '#d9a78b', '#0f172a', 1.1);

      // Mochila pequeña & Torso inclinado con maillot colorido (amarillo/cian)
      ctx.beginPath();
      ctx.roundRect(-8.5, -35 + bob, 6, 8, 2);
      SpriteBank.fillAndStroke(ctx, '#0284c7', '#0f172a', 1.2);

      SpriteBank.drawCapsule(ctx, -4.5, -26 + bob, 5, -34 + bob, 4.6, '#facc15', '#0f172a', 1.6);
      // Franja turquesa del maillot
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-2, -28 + bob);
      ctx.lineTo(3, -32 + bob);
      ctx.stroke();

      // Pierna delantera pedaleando rápido
      const px1 = -1 + Math.cos(pedalAngle) * 4.5;
      const py1 = -10 + Math.sin(pedalAngle) * 4.5;
      SpriteBank.drawCapsule(ctx, -3, -25 + bob, 1 + (px1 + 1) * 0.3, -17 + bob * 0.5, 2.5, '#1e293b', '#0f172a', 1.3);
      SpriteBank.drawCapsule(ctx, 1 + (px1 + 1) * 0.3, -17 + bob * 0.5, px1, py1, 2.2, '#f3cfb6', '#0f172a', 1.2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px1 - 2.5, py1 - 1.5, 5.2, 2.6);

      // Brazo extendido agarrando el manubrio
      SpriteBank.drawCapsule(ctx, 4.5, -33 + bob, 12.2, -25.8, 2.0, '#f3cfb6', '#0f172a', 1.2);

      // Cabeza, gafas de sol deportivas y casco aerodinámico
      ctx.beginPath();
      ctx.arc(6.8, -38.5 + bob, 5.2, 0, Math.PI * 2);
      SpriteBank.fillAndStroke(ctx, '#f3cfb6', '#0f172a', 1.5);

      // Gafas deportivas cian/oscuras
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(7.4, -39.8 + bob, 5.0, 2.4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(8.4, -39.5 + bob, 3.2, 1.3);

      // Casco aerodinámico azul cobalto + franja roja
      ctx.beginPath();
      ctx.ellipse(6.0, -41.4 + bob, 6.8, 3.8, -0.1, Math.PI * 0.95, Math.PI * 2.05);
      ctx.closePath();
      SpriteBank.fillAndStroke(ctx, '#2563eb', '#0f172a', 1.5);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(3.2, -43.5 + bob, 6.2, 1.5);

      ctx.restore();
    }

    /**
     * Formaciones eléctricas CSR del Tren Mitre (Trenes Argentinos) fieles a tren mitre 1.jfif y 2.jfif:
     * - Techo gris/plateado con equipos de aire acondicionado/ventilación grises
     * - Carrocería celeste brillante y blanca con franja azul oscura inferior
     * - Puertas dobles celestes, ventanas oscuras redondeadas y fuelles de acople
     * - Cabinas frontales aerodinámicas celestes con parabrisas amplio, visor M04/RETIRO,
     *   faros delanteros iluminados, pollera negra inferior y enganche amarillo característico
     */
    static drawTrenMitreCarHD(ctx, p, x, y, w, h, cameraX = 0, time = 0) {
      if (!ctx || !p || w <= 0 || h <= 0) return;
      ctx.save();

      if (h < 60) {
        // Pasarela móvil / puente ferroviario estilo Tren Mitre (18 px)
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x + 2, y + 2, Math.max(0, w - 4), 4);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(x + 2, y + 6, Math.max(0, w - 4), Math.max(2, h - 10));
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(x + 3, y + Math.max(8, h - 4.5), Math.max(0, w - 6), 3);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x + 3, y + 3, 5, Math.max(4, h - 6));
        ctx.fillRect(x + w - 8, y + 3, 5, Math.max(4, h - 6));
        ctx.restore();
        return;
      }

      const cabLeft = !!p.cabLeft;
      const cabRight = !!p.cabRight;
      const cabW = 64;
      const visBottom = y + Math.min(h, 80); // 460..540 (100% visible dentro de 540p)
      const chasisY = y + 65;

      // 1. Equipos grises de aire acondicionado / ventilación sobre el techo (tren mitre 1.jfif)
      const acStep = w < 240 ? 95 : 138;
      for (let acX = x + (cabLeft ? cabW + 14 : 26); acX < x + w - (cabRight ? cabW + 40 : 48); acX += acStep) {
        const podW = Math.min(44, Math.max(24, w - 40));
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(acX, y - 3.5, podW, 6.5, 2.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(acX + 3, y - 2.5, podW - 6, 2);
        ctx.fillStyle = '#475569';
        for (let lx = acX + 6; lx < acX + podW - 6; lx += 7) {
          ctx.fillRect(lx, y + 0.2, 4, 1.8);
        }
      }

      // 2. Bandas horizontales de librea oficial Trenes Argentinos dentro del cuerpo del coche
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2), 5);
      ctx.clip();

      // Techo curvo claro plateado/blanco
      const roofGrad = ctx.createLinearGradient(x, y, x, y + 9);
      roofGrad.addColorStop(0, '#f8fafc');
      roofGrad.addColorStop(0.65, '#cbd5e1');
      roofGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = roofGrad;
      ctx.fillRect(x, y, w, 9);

      // Franja superior celeste brillante (ventanas y puertas)
      const skyBlueGrad = ctx.createLinearGradient(x, y + 9, x, y + 40);
      skyBlueGrad.addColorStop(0, '#38bdf8');
      skyBlueGrad.addColorStop(0.28, '#0ea5e9');
      skyBlueGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = skyBlueGrad;
      ctx.fillRect(x, y + 9, w, 31);

      // Cuerpo bajo blanco luminoso + filete celeste + banda inferior azul oscuro
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y + 40, w, 18);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(x, y + 42.5, w, 2.5);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x, y + 58, w, 7.5);

      // Chasis / zona de bogies oscura visible en y + 65..80
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, chasisY, w, Math.max(0, h - 65));

      // 3. Módulos de ventanas oscuras redondeadas y puertas dobles celestes
      const bodyStart = x + (cabLeft ? cabW : 16);
      const bodyEnd = x + w - (cabRight ? cabW : 16);
      const drawCoachDoorsAndWindows = (spanX0, spanX1) => {
        const spanW = spanX1 - spanX0;
        if (spanW < 40) return;
        let cur = spanX0 + 8;
        let bayIdx = 0;
        while (cur + 30 < spanX1 - 6) {
          const isDoor = bayIdx % 3 === 1 && cur + 38 <= spanX1 - 6;
          if (isDoor) {
            // Puertas dobles celestes con doble ventanilla vertical y sello central oscuro
            const dw = 34;
            ctx.fillStyle = '#0284c7';
            ctx.strokeStyle = '#075985';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cur, y + 11, dw, 45, 2.5);
            ctx.fill();
            ctx.stroke();

            // Línea divisoria entre ambas hojas de la puerta doble
            ctx.fillStyle = '#082f49';
            ctx.fillRect(cur + dw * 0.5 - 0.9, y + 12, 1.8, 43);

            // Cristales oscuros redondeados de cada hoja
            for (let leaf = 0; leaf < 2; leaf++) {
              const gx = cur + 4 + leaf * (dw * 0.5);
              ctx.fillStyle = '#0f172a';
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 1.1;
              ctx.beginPath();
              ctx.roundRect(gx, y + 14.5, 10.5, 22, 2.5);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = 'rgba(186, 230, 253, 0.24)';
              ctx.fillRect(gx + 2, y + 16, 3.2, 14);
            }
            // Insignia "Trenes Argentinos" sobre la banda blanca junto a puertas
            if (cur + dw + 38 < spanX1 - 6) {
              ctx.fillStyle = '#0284c7';
              ctx.font = 'bold 5.5px "Segoe UI", sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText('Trenes Argentinos', cur + dw + 4, y + 53);
            }
            cur += dw + 10;
          } else {
            // Ventana oscura panorámica con marco redondeado y parante superior
            const ww = Math.min(34, spanX1 - 6 - cur);
            if (ww >= 18) {
              ctx.fillStyle = '#1e293b';
              ctx.beginPath();
              ctx.roundRect(cur - 1, y + 14.5, ww + 2, 20.5, 4.5);
              ctx.fill();
              ctx.fillStyle = '#090d16';
              ctx.beginPath();
              ctx.roundRect(cur, y + 15.5, ww, 18.5, 4);
              ctx.fill();
              // Travesaño horizontal + reflejo celeste de cielo
              ctx.fillStyle = '#334155';
              ctx.fillRect(cur + 1, y + 20.5, ww - 2, 1.4);
              ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
              ctx.beginPath();
              ctx.moveTo(cur + 3, y + 17);
              ctx.lineTo(cur + ww * 0.56, y + 17);
              ctx.lineTo(cur + 3, y + 30);
              ctx.closePath();
              ctx.fill();
            }
            cur += ww + 8;
          }
          bayIdx++;
        }
      };

      // Divisores internos (fuelles entre coches dentro de tramos largos > 440 px)
      const splitPoints = [];
      if (w >= 440) {
        const numCoaches = Math.max(2, Math.round(w / 320));
        const coachStep = w / numCoaches;
        for (let ci = 1; ci < numCoaches; ci++) {
          splitPoints.push(x + ci * coachStep);
        }
      }
      let prevSpan = bodyStart;
      splitPoints.forEach((spX) => {
        drawCoachDoorsAndWindows(prevSpan, spX - 9);
        // Fuelle de acople oscuro corrugado entre coches
        ctx.fillStyle = '#090d16';
        ctx.fillRect(spX - 8, y + 9, 16, 56);
        ctx.fillStyle = '#334155';
        for (let fy = y + 12; fy < y + 63; fy += 6) {
          ctx.fillRect(spX - 6, fy, 12, 2.5);
        }
        ctx.fillStyle = '#64748b';
        ctx.fillRect(spX - 1, y + 10, 2, 54);
        prevSpan = spX + 9;
      });
      drawCoachDoorsAndWindows(prevSpan, bodyEnd);

      // 4. Bogies y ruedas giratorias visibles dentro de y + 66..79 (por encima de 540px)
      const wheelRot = -(cameraX * 0.055 + time * 10);
      for (let bx = x + 36; bx < x + w - 42; bx += 148) {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.fillRect(bx - 16, chasisY + 2, 32, 6);
        [-10, 10].forEach((wo) => {
          const rx = bx + wo;
          const ry = visBottom - 7.5;
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(rx, ry, 5.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(rx + Math.cos(wheelRot) * 4.2, ry + Math.sin(wheelRot) * 4.2);
          ctx.lineTo(rx - Math.cos(wheelRot) * 4.2, ry - Math.sin(wheelRot) * 4.2);
          ctx.stroke();
        });
      }
      ctx.restore();

      // 5. Fuelles de acople en los extremos no-cabina del tramo (gap transitions)
      const drawEndFuelle = (fx) => {
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(fx, y + 10, 9, 55, 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#475569';
        for (let py = y + 13; py < y + 62; py += 6) {
          ctx.fillRect(fx + 1.5, py, 6, 2);
        }
      };
      if (p.fuelleLeft && !cabLeft) drawEndFuelle(x - 3);
      if (p.fuelleRight && !cabRight) drawEndFuelle(x + w - 6);

      // 6. Cabinas frontales aerodinámicas Tren Mitre (tren mitre 1.jfif y 2.jfif)
      const drawEndCab = (dir) => {
        ctx.save();
        const noseEdgeX = dir === 1 ? x + w : x;
        ctx.translate(noseEdgeX, y);
        if (dir === -1) ctx.scale(-1, 1);

        // Frente aerodinámico celeste inclinado (x local: -cabW .. +2)
        const cabGrad = ctx.createLinearGradient(-cabW, 4, 2, 54);
        cabGrad.addColorStop(0, '#38bdf8');
        cabGrad.addColorStop(0.55, '#0ea5e9');
        cabGrad.addColorStop(1, '#0284c7');
        ctx.beginPath();
        ctx.moveTo(-cabW, 2);
        ctx.lineTo(-10, 2);
        ctx.quadraticCurveTo(-2, 4, 1, 22);
        ctx.lineTo(2, 56);
        ctx.lineTo(-cabW, 56);
        ctx.closePath();
        SpriteBank.fillAndStroke(ctx, cabGrad, '#090d16', 2.0);

        // Contorno blanco en el frente y faldón inferior blanco "Trenes Argentinos"
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-48, 39);
        ctx.lineTo(1, 39);
        ctx.lineTo(1, 56);
        ctx.lineTo(-cabW, 56);
        ctx.lineTo(-cabW, 41);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 5.5px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Trenes Argentinos', -28, 52);

        // Visor LED superior de destino (M04 / RETIRO)
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-42, 6, 30, 8.5, 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 6.2px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.destCode || 'M04', -27, 12.6);

        // Parabrisas amplio negro panorámico con reflejo diagonal y limpiaparabrisas
        ctx.beginPath();
        ctx.roundRect(-44, 16, 39, 19, 3.5);
        SpriteBank.fillAndStroke(ctx, '#090d16', '#f8fafc', 1.5);
        ctx.fillStyle = 'rgba(186, 230, 253, 0.28)';
        ctx.beginPath();
        ctx.moveTo(-40, 18);
        ctx.lineTo(-22, 18);
        ctx.lineTo(-40, 32);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-24, 34);
        ctx.lineTo(-19, 22);
        ctx.stroke();

        // Ventanilla lateral del motorman
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-60, 15, 13, 18, 2.5);
        ctx.fill();

        // Faros delanteros iluminados inclinados
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-14, 38, 12, 8, 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.arc(-7, 42, 3.2, 0, Math.PI * 2);
        ctx.fill();
        const beamGrad = ctx.createRadialGradient(-3, 42, 1, 14, 42, 24);
        beamGrad.addColorStop(0, 'rgba(254, 249, 195, 0.55)');
        beamGrad.addColorStop(1, 'rgba(254, 249, 195, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.arc(4, 42, 22, -0.5, 0.5);
        ctx.lineTo(-3, 42);
        ctx.closePath();
        ctx.fill();

        // Pollera negra aerodinámica inferior
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-cabW, 56, cabW + 3, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-cabW + 6, 58, cabW - 8, 4);

        // Paragolpes / enganche amarillo característico en el morro bajo (tren mitre 1.jfif y 2.jfif)
        ctx.beginPath();
        ctx.roundRect(-6, 59, 11, 10, 2);
        SpriteBank.fillAndStroke(ctx, '#facc15', '#090d16', 1.6);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-3, 62, 5, 4);

        ctx.restore();
      };

      if (cabLeft) drawEndCab(-1);
      if (cabRight) drawEndCab(1);

      ctx.restore();
    }
  }

  SpriteBank.drawPeacockHD = function (...args) {
    return SpriteBank.prototype.drawPeacockHD.apply(this, args);
  };
  SpriteBank.drawCrazyCyclistHD = function (...args) {
    return SpriteBank.prototype.drawCrazyCyclistHD.apply(this, args);
  };

  global.SpriteBank = SpriteBank;
})(window);
