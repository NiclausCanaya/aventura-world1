/**
 * ============================================================================
 * AVENTURA EN BARCELONA HD - 4 Niveles + Fondos de 5 Capas Parallax (64/128-Bit)
 * ============================================================================
 * Incluye:
 * - Power-Ups y Sistema de Escudo en los 4 niveles:
 *   * Power-up Eléctrico ('electric_shield'): Campo de rayos que destruye enemigos (10s).
 *   * Alas de Ángel ('angel_wings'): TRIPLE SALTO aéreo recargable en suelo firme.
 *   * Hamburguesa ('burger') y Batido ('smoothie').
 * - 5 Capas de Scroll Parallax con iluminación radial (farolas, sol, reflectores)
 *   y texturas de relieve detalladas (trencadís, sillería gótica, andamios y madera).
 */
(function (global) {
  'use strict';

  const GROUND_Y = 460;

  const LEVELS = [
    // ========================================================================
    // NIVEL 1: LA BARCELONETA (Palomas, Patinetes y Gaviotas Verticales)
    // ========================================================================
    {
      id: 1,
      name: '1. La Barceloneta',
      subtitle: 'Playa, Patinetes y Gaviotas Voladoras — ¡Nico, Andrea y la Tina!',
      nextDestination: 'El Gòtic',
      theme: 'barceloneta',
      width: 3120,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 2820,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '🐾 La Tina ladra real ("¡Guau, guau!") con [X] y espanta aves (CD 30s)' },
        { x: 1061, y: 265, text: '🌿 Power-Up Planta: Dispara recto con [Z] o en diagonal 45° con [↑+Z] y [↓+Z] en el aire' },
        { x: 2311, y: 245, text: '🪽 Alas de Ángel (3x Salto [↑]): Presioná [SHIFT] para soltar tu Power-Up de reserva y hacer SWAP' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 780, h: 100, style: 'promenade' },
        { x: 870, y: GROUND_Y, w: 680, h: 100, style: 'promenade' },
        { x: 1650, y: GROUND_Y, w: 560, h: 100, style: 'sand' },
        { x: 2310, y: GROUND_Y, w: 810, h: 100, style: 'promenade' },

        { x: 340, y: 385, w: 130, h: 18, oneWay: true, style: 'wood' },
        { x: 530, y: 325, w: 140, h: 18, oneWay: true, style: 'wood' },
        { x: 960, y: 380, w: 150, h: 18, oneWay: true, style: 'wood' },
        { x: 1200, y: 320, w: 150, h: 18, oneWay: true, style: 'wood' },
        { x: 1560, y: 375, w: 130, h: 18, oneWay: true, style: 'wood' },
        { x: 1760, y: 315, w: 160, h: 18, oneWay: true, style: 'wood' },
        { x: 1980, y: 265, w: 150, h: 18, oneWay: true, style: 'wood' },
        { x: 2220, y: 375, w: 120, h: 18, oneWay: true, style: 'wood' },
        { x: 2450, y: 350, w: 150, h: 18, oneWay: true, style: 'wood' }
      ],
      movingPlatforms: [],
      collectibles: [
        { x: 220, y: 415, type: 'coin' },
        { x: 260, y: 415, type: 'coin' },
        { x: 365, y: 345, type: 'coin' },
        { x: 415, y: 345, type: 'coin' },
        { x: 800, y: 375, type: 'coin' },
        { x: 835, y: 360, type: 'coin' },
        { x: 1000, y: 340, type: 'coin' },
        { x: 1045, y: 340, type: 'coin' },
        { x: 1749, y: 417, type: 'burger' },
        { x: 1800, y: 275, type: 'coin' },
        { x: 1850, y: 275, type: 'coin' },
        { x: 2500, y: 310, type: 'coin' },
        { x: 2550, y: 310, type: 'coin' },
        { x: 2680, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1221, y: 198, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 2471, y: 228, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pigeons: [
        { x: 600, y: GROUND_Y, minX: 420, maxX: 760, speed: 68 },
        { x: 1120, y: GROUND_Y, minX: 900, maxX: 1420, speed: 75 },
        { x: 1820, y: 315, minX: 1765, maxX: 1915, speed: 62 },
        { x: 2480, y: GROUND_Y, minX: 2330, maxX: 2750, speed: 80 }
      ],
      scooters: [
        { x: 1350, y: GROUND_Y, minX: 900, maxX: 1520, speed: 205 },
        { x: 1950, y: GROUND_Y, minX: 1680, maxX: 2180, speed: 220 }
      ],
      seagulls: [
        { x: 815, minY: 230, maxY: 410, speed: 95 },
        { x: 1595, minY: 215, maxY: 395, speed: 105 },
        { x: 2255, minY: 220, maxY: 405, speed: 110 }
      ],
      boars: [],
      zigzagPigeons: []
    },

    // ========================================================================
    // NIVEL 2: EL GÒTIC (Se suman Jabalíes Salvajes con Colmillos)
    // ========================================================================
    {
      id: 2,
      name: '2. El Gòtic',
      subtitle: 'Callejones Medievales y Jabalíes Salvajes (¡Inmunes al Salto!)',
      nextDestination: 'Park Güell',
      theme: 'gotic',
      width: 3320,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3020,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 85, y: 300, text: '🐗 ¡CUIDADO! Los Jabalíes tienen colmillos hacia arriba: NO les saltes encima' },
        { x: 830, y: 240, text: '🌿 Derrota Jabalíes con Orquídea [Z], Terremoto [C] o Hipnosis de Andrea [C]' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 640, h: 100, style: 'cobble' },
        { x: 745, y: GROUND_Y, w: 590, h: 100, style: 'cobble' },
        { x: 1445, y: GROUND_Y, w: 620, h: 100, style: 'cobble' },
        { x: 2175, y: GROUND_Y, w: 360, h: 100, style: 'cobble' },
        { x: 2640, y: GROUND_Y, w: 680, h: 100, style: 'cobble' },

        { x: 260, y: 385, w: 140, h: 16, oneWay: true, style: 'balcony' },
        { x: 450, y: 320, w: 150, h: 16, oneWay: true, style: 'balcony' },
        { x: 640, y: 260, w: 150, h: 16, oneWay: true, style: 'balcony' },

        { x: 850, y: 380, w: 160, h: 16, oneWay: true, style: 'balcony' },
        { x: 1060, y: 310, w: 170, h: 16, oneWay: true, style: 'balcony' },
        { x: 1280, y: 245, w: 160, h: 16, oneWay: true, style: 'balcony' },
        { x: 1475, y: 168, w: 96, h: 16, oneWay: true, style: 'balcony' },

        { x: 1520, y: 375, w: 150, h: 16, oneWay: true, style: 'balcony' },
        { x: 1730, y: 305, w: 180, h: 16, oneWay: true, style: 'balcony' },
        { x: 1960, y: 245, w: 150, h: 16, oneWay: true, style: 'balcony' },

        { x: 2240, y: 365, w: 160, h: 16, oneWay: true, style: 'balcony' },
        { x: 2460, y: 310, w: 160, h: 16, oneWay: true, style: 'balcony' },
        { x: 2700, y: 365, w: 150, h: 16, oneWay: true, style: 'balcony' }
      ],
      movingPlatforms: [],
      collectibles: [
        { x: 295, y: 345, type: 'coin' },
        { x: 345, y: 345, type: 'coin' },
        { x: 900, y: 340, type: 'coin' },
        { x: 950, y: 340, type: 'coin' },
        { x: 1527, y: 125, type: 'plant' },
        { x: 1575, y: 335, type: 'coin' },
        { x: 2020, y: 205, type: 'coin' },
        { x: 2052, y: 202, type: 'burger' },
        { x: 2515, y: 270, type: 'coin' },
        { x: 2565, y: 270, type: 'coin' },
        { x: 2755, y: 325, type: 'coin' },
        { x: 2805, y: 325, type: 'coin' },
        { x: 2920, y: 415, type: 'coin' }
      ],
      pigeons: [
        { x: 480, y: 320, minX: 455, maxX: 595, speed: 62 },
        { x: 900, y: GROUND_Y, minX: 760, maxX: 1120, speed: 78 },
        { x: 1090, y: 310, minX: 1065, maxX: 1220, speed: 66 },
        { x: 1760, y: 305, minX: 1735, maxX: 1900, speed: 70 },
        { x: 2780, y: GROUND_Y, minX: 2660, maxX: 2960, speed: 80 }
      ],
      scooters: [
        { x: 1020, y: GROUND_Y, minX: 760, maxX: 1310, speed: 225 },
        { x: 1680, y: GROUND_Y, minX: 1460, maxX: 2040, speed: 240 }
      ],
      seagulls: [
        { x: 690, minY: 200, maxY: 410, speed: 105 },
        { x: 2110, minY: 195, maxY: 405, speed: 115 }
      ],
      boars: [
        { x: 380, y: GROUND_Y, minX: 200, maxX: 610, speed: 72 },
        { x: 1160, y: GROUND_Y, minX: 820, maxX: 1310, speed: 76 },
        { x: 1860, y: GROUND_Y, minX: 1500, maxX: 2030, speed: 78 },
        { x: 2320, y: GROUND_Y, minX: 2190, maxX: 2510, speed: 80 }
      ],
      zigzagPigeons: []
    },

    // ========================================================================
    // NIVEL 3: PARK GÜELL (Palomas en Zig-Zag + IA Reactiva de Persecución)
    // ========================================================================
    {
      id: 3,
      name: '3. Park Güell',
      subtitle: 'Palomas en Zig-Zag, Trencadís y Enemigos con IA Reactiva',
      nextDestination: 'Sagrada Família',
      theme: 'parkguell',
      width: 3520,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3220,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 90, y: 300, text: '⚠️ ¡NIVEL 3! Los enemigos te persiguen al saltar: usá Disparo Diagonal 45° [↑+Z] o [↓+Z]' },
        { x: 1580, y: 225, text: '📦 Usá [SHIFT] para soltar tu Power-Up de la Caja de Reserva y hacer SWAP en cualquier momento' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 580, h: 100, style: 'mosaic' },
        { x: 880, y: GROUND_Y, w: 560, h: 100, style: 'mosaic' },
        { x: 1540, y: GROUND_Y, w: 540, h: 100, style: 'mosaic' },
        { x: 2660, y: GROUND_Y, w: 860, h: 100, style: 'mosaic' },

        { x: 280, y: 385, w: 140, h: 18, oneWay: true, style: 'mosaic' },
        { x: 960, y: 380, w: 150, h: 18, oneWay: true, style: 'mosaic' },
        { x: 1180, y: 315, w: 150, h: 18, oneWay: true, style: 'mosaic' },
        { x: 1620, y: 380, w: 150, h: 18, oneWay: true, style: 'mosaic' },
        { x: 1840, y: 320, w: 160, h: 18, oneWay: true, style: 'mosaic' },
        { x: 2330, y: 390, w: 120, h: 18, oneWay: true, style: 'mosaic' },
        { x: 2760, y: 370, w: 150, h: 18, oneWay: true, style: 'mosaic' },
        { x: 2960, y: 310, w: 150, h: 18, oneWay: true, style: 'mosaic' },
        { x: 2215, y: 128, w: 86, h: 16, oneWay: true, style: 'mosaic' }
      ],
      movingPlatforms: [
        { x: 610, y: 410, w: 120, h: 18, endX: 740, endY: 410, speed: 105, style: 'mosaic' },
        { x: 1380, y: 415, w: 115, h: 18, endX: 1380, endY: 285, speed: 100, style: 'mosaic' },
        { x: 2110, y: 400, w: 120, h: 18, endX: 2210, endY: 360, speed: 105, style: 'mosaic' },
        { x: 2470, y: 375, w: 120, h: 18, endX: 2540, endY: 415, speed: 105, style: 'mosaic' }
      ],
      collectibles: [
        { x: 665, y: 360, type: 'coin' },
        { x: 715, y: 360, type: 'coin' },
        { x: 1010, y: 338, type: 'coin' },
        { x: 1275, y: 275, type: 'coin' },
        { x: 1425, y: 240, type: 'coin' },
        { x: 1670, y: 340, type: 'coin' },
        { x: 2170, y: 320, type: 'coin' },
        { x: 2245, y: 88, type: 'golden_bone' },
        { x: 2353, y: 347, type: 'burger' },
        { x: 2520, y: 330, type: 'coin' },
        { x: 2810, y: 330, type: 'coin' },
        { x: 3010, y: 270, type: 'coin' },
        { x: 3060, y: 270, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1701, y: 258, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      pigeons: [
        { x: 360, y: GROUND_Y, minX: 180, maxX: 550, speed: 75 },
        { x: 1050, y: GROUND_Y, minX: 900, maxX: 1410, speed: 80 },
        { x: 1870, y: 320, minX: 1845, maxX: 1990, speed: 68 },
        { x: 2850, y: GROUND_Y, minX: 2690, maxX: 3140, speed: 84 }
      ],
      scooters: [
        { x: 1750, y: GROUND_Y, minX: 1560, maxX: 2050, speed: 235 },
        { x: 2920, y: GROUND_Y, minX: 2680, maxX: 3180, speed: 245 }
      ],
      seagulls: [
        { x: 755, minY: 210, maxY: 395, speed: 110 },
        { x: 2300, minY: 200, maxY: 380, speed: 115 }
      ],
      boars: [
        { x: 1180, y: GROUND_Y, minX: 910, maxX: 1410, speed: 78 },
        { x: 1700, y: GROUND_Y, minX: 1560, maxX: 2050, speed: 82 },
        { x: 2780, y: GROUND_Y, minX: 2680, maxX: 3120, speed: 84 }
      ],
      zigzagPigeons: [
        { x: 640, baseY: 285, minX: 540, maxX: 920, ampY: 46, speed: 130 },
        { x: 1450, baseY: 270, minX: 1280, maxX: 1680, ampY: 50, speed: 138 },
        { x: 2180, baseY: 275, minX: 2020, maxX: 2620, ampY: 52, speed: 145 }
      ]
    },

    // ========================================================================
    // NIVEL 4: SAGRADA FAMILIA (Clímax Final + Evento de Supervivencia Enjambre)
    // ========================================================================
    {
      id: 4,
      name: '4. Sagrada Familia',
      subtitle: 'Clímax Final: ¡Guarda el Ladrido de la Tina [X] para el Enjambre!',
      nextDestination: 'Madrid',
      theme: 'sagrada',
      width: 3770,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3460,
      flagY: GROUND_Y - 68,
      swarmTriggerX: 2920,
      hints: [
        { x: 95, y: 300, text: '⚠️ ¡NIVEL FINAL! Enemigos a máxima velocidad (+52%). ¡No gastes a la Tina [X] al final!' },
        { x: 2490, y: 235, text: '🚨 ¡ZONA DE ALERTA ADELANTE! Asegurate de tener listo el Ladrido Doble de la Tina [X]' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 620, h: 100, style: 'stone' },
        { x: 725, y: GROUND_Y, w: 580, h: 100, style: 'stone' },
        { x: 1580, y: GROUND_Y, w: 620, h: 100, style: 'stone' },
        { x: 2480, y: GROUND_Y, w: 460, h: 100, style: 'stone' },
        { x: 3040, y: GROUND_Y, w: 730, h: 100, style: 'stone' },

        { x: 260, y: 385, w: 140, h: 16, oneWay: true, style: 'scaffold' },
        { x: 440, y: 320, w: 150, h: 16, oneWay: true, style: 'scaffold' },
        { x: 820, y: 380, w: 150, h: 16, oneWay: true, style: 'scaffold' },
        { x: 1030, y: 310, w: 160, h: 16, oneWay: true, style: 'scaffold' },
        { x: 1210, y: 250, w: 140, h: 16, oneWay: true, style: 'scaffold' },

        { x: 1670, y: 380, w: 160, h: 16, oneWay: true, style: 'scaffold' },
        { x: 1880, y: 315, w: 160, h: 16, oneWay: true, style: 'scaffold' },
        { x: 2080, y: 250, w: 150, h: 16, oneWay: true, style: 'scaffold' },
        { x: 2255, y: 172, w: 96, h: 16, oneWay: true, style: 'scaffold' },

        { x: 2560, y: 375, w: 150, h: 16, oneWay: true, style: 'scaffold' },
        { x: 2750, y: 315, w: 150, h: 16, oneWay: true, style: 'scaffold' },
        { x: 3120, y: 370, w: 160, h: 16, oneWay: true, style: 'scaffold' }
      ],
      movingPlatforms: [
        { x: 1330, y: 395, w: 130, h: 18, endX: 1440, endY: 345, speed: 115, style: 'crane' },
        { x: 2225, y: 395, w: 135, h: 18, endX: 2335, endY: 350, speed: 120, style: 'crane' }
      ],
      collectibles: [
        { x: 315, y: 342, type: 'coin' },
        { x: 870, y: 340, type: 'coin' },
        { x: 920, y: 340, type: 'coin' },
        { x: 1265, y: 210, type: 'coin' },
        { x: 1390, y: 320, type: 'coin' },
        { x: 1735, y: 338, type: 'coin' },
        { x: 1769, y: 337, type: 'burger' },
        { x: 2135, y: 210, type: 'coin' },
        { x: 2307, y: 129, type: 'plant' },
        { x: 2610, y: 335, type: 'coin' },
        { x: 2800, y: 275, type: 'coin' },
        { x: 2980, y: 360, type: 'coin' },
        { x: 3320, y: 415, type: 'coin' },
        { x: 3370, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1134, y: 188, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pigeons: [
        { x: 350, y: GROUND_Y, minX: 200, maxX: 590, speed: 78 },
        { x: 1050, y: 310, minX: 1035, maxX: 1180, speed: 68 },
        { x: 1900, y: 315, minX: 1885, maxX: 2030, speed: 72 },
        { x: 2620, y: GROUND_Y, minX: 2500, maxX: 2910, speed: 85 }
      ],
      scooters: [
        { x: 920, y: GROUND_Y, minX: 740, maxX: 1280, speed: 245 },
        { x: 1820, y: GROUND_Y, minX: 1600, maxX: 2170, speed: 255 },
        { x: 2680, y: GROUND_Y, minX: 2500, maxX: 2920, speed: 255 }
      ],
      seagulls: [
        { x: 675, minY: 195, maxY: 405, speed: 115 },
        { x: 1510, minY: 190, maxY: 395, speed: 120 },
        { x: 2420, minY: 195, maxY: 395, speed: 125 }
      ],
      boars: [
        { x: 840, y: GROUND_Y, minX: 740, maxX: 1260, speed: 80 },
        { x: 1720, y: GROUND_Y, minX: 1600, maxX: 2160, speed: 82 },
        { x: 2580, y: GROUND_Y, minX: 2495, maxX: 2910, speed: 85 }
      ],
      zigzagPigeons: [
        { x: 1380, baseY: 260, minX: 1200, maxX: 1650, ampY: 50, speed: 145 },
        { x: 2260, baseY: 265, minX: 2080, maxX: 2540, ampY: 54, speed: 150 }
      ]
    }
  ];

  // ==========================================================================
  // ==========================================================================
  // NIVELES DE MADRID (MUNDO 2: CAPITAL DE ESPAÑA)
  // 4 Niveles completos y detallados con nuevas mecánicas, pozos, trampas y enemigos:
  // - Gatos Callejeros de Madrid (terrestres y en emboscada vertical desde cornisas)
  // - Turistas con Palo Selfie (inmunes a pisotón superior: ¡púa que daña al jugador!)
  // - Cotorras Verdes (vuelo sinusoidal rápido; huyen con el doble ladrido de la Tina)
  // - Clímax de Nivel 4 (Palacio Real): Enjambre de 20 cotorras teledirigidas
  // ==========================================================================
    const MADRID_LEVELS = [
    // ========================================================================
    // NIVEL 1: PUERTA DEL SOL (Palomas terrestres, Gatos en cornisas, Moving V/H)
    // ========================================================================
    {
      id: 1,
      city: 'madrid',
      name: '1. Puerta del Sol',
      subtitle: 'Kilómetro Cero — Palomas en suelo, Gatos en cornisas y Plataformas Móviles',
      nextDestination: 'Plaza Mayor',
      theme: 'madrid_sol',
      width: 3300,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3000,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '☀️ Madrid: saltos precisos sobre los pozos con plataformas móviles H/V' },
        { x: 820, y: 255, text: '🐱 ¡Gatos acechando en cornisas! Interceptan tu salto con un zarpazo' },
        { x: 1620, y: 245, text: '⏰ ¡Cuidado con los 60 segundos! Mantené buen ritmo hacia la meta' }
      ],
      solids: [
        // Tramos cortos de suelo cortados por pozos reales (sin viga infinita)
        { x: 0, y: GROUND_Y, w: 460, h: 100, style: 'promenade' },
        { x: 760, y: GROUND_Y, w: 480, h: 100, style: 'promenade' },
        { x: 1580, y: GROUND_Y, w: 500, h: 100, style: 'promenade' },
        { x: 2420, y: GROUND_Y, w: 880, h: 100, style: 'promenade' },

        // Cornisas aisladas (2 bloques máximo) donde acechan los gatos
        { x: 930, y: 360, w: 95, h: 18, oneWay: true, style: 'stone' },
        { x: 1410, y: 315, w: 85, h: 18, oneWay: true, style: 'stone' },
        { x: 1760, y: 365, w: 95, h: 18, oneWay: true, style: 'stone' },
        { x: 2630, y: 365, w: 95, h: 18, oneWay: true, style: 'stone' }
      ],
      movingPlatforms: [
        // Plataforma móvil horizontal (2-3 bloques) sobre Pozo 1
        { x: 495, y: 420, endX: 645, endY: 420, sx: 495, sy: 420, ex: 645, ey: 420, w: 95, h: 18, speed: 90, style: 'stone' },
        // Plataforma móvil VERTICAL (sube y baja) sobre Pozo 2
        { x: 1270, y: 425, endX: 1270, endY: 300, sx: 1270, sy: 425, ex: 1270, ey: 300, w: 90, h: 18, speed: 90, style: 'crane' },
        // Plataforma móvil horizontal sobre Pozo 3
        { x: 2240, y: 400, endX: 2330, endY: 400, sx: 2240, sy: 400, ex: 2330, ey: 400, w: 90, h: 18, speed: 95, style: 'stone' }
      ],
      fallingPlatforms: [
        { x: 2120, y: 415, w: 80, h: 18, style: 'wood' }
      ],
      hiddenBlocks: [
        { x: 1792, y: 265, w: 32, h: 32, item: 'golden_bone', style: 'secret_gold' }
      ],
      collectibles: [
        { x: 230, y: 415, type: 'coin' },
        { x: 580, y: 375, type: 'coin' },
        { x: 1120, y: 415, type: 'coin' },
        { x: 1800, y: 325, type: 'coin' },
        { x: 1967, y: 417, type: 'burger' },
        { x: 2320, y: 355, type: 'coin' },
        { x: 2670, y: 325, type: 'coin' },
        { x: 2840, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1436, y: 193, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      // ENEMIGOS NIVEL 1: Palomas terrestres + Gatos acechando desde cornisas
      pigeons: [
        { x: 280, y: GROUND_Y, minX: 160, maxX: 440, speed: 66 },
        { x: 900, y: GROUND_Y, minX: 780, maxX: 1210, speed: 72 },
        { x: 1700, y: GROUND_Y, minX: 1600, maxX: 1810, speed: 76 },
        { x: 2580, y: GROUND_Y, minX: 2440, maxX: 2920, speed: 80 }
      ],
      cats: [
        { x: 960, y: 360, minX: 935, maxX: 1018, speed: 40, isAmbush: true },
        { x: 1790, y: 365, minX: 1765, maxX: 1848, speed: 42, isAmbush: true },
        { x: 1940, y: GROUND_Y, minX: 1850, maxX: 2055, speed: 82, isAmbush: false },
        { x: 2660, y: 365, minX: 2635, maxX: 2718, speed: 46, isAmbush: true }
      ],
      selfieTourists: [],
      royalGuards: [
        { x: 1080, y: GROUND_Y, minX: 980, maxX: 1210, speed: 56 },
        { x: 2760, y: GROUND_Y, minX: 2620, maxX: 2920, speed: 60 }
      ],
      greenParakeets: [
        { x: 640, baseY: 300, minX: 470, maxX: 830, ampY: 42, speed: 115 }
      ]
    },

    // ========================================================================
    // NIVEL 2: PLAZA MAYOR (Turistas en suelo, Gatos en plataformas intermedias)
    // ========================================================================
    {
      id: 2,
      city: 'madrid',
      name: '2. Plaza Mayor',
      subtitle: 'Soportales Iluminados — Turistas con Palo Selfie y Gatos en balcones',
      nextDestination: 'Parque del Retiro',
      theme: 'madrid_plaza',
      width: 3400,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3120,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '📸 ¡Turistas en el suelo! Usá Orquídea [Z] o Pose [C], ¡no saltes encima del palo!' },
        { x: 840, y: 255, text: '⬆️ Ascensor vertical de obra: sincronizá el salto al llegar arriba' },
        { x: 1700, y: 240, text: '💥 Terremoto de Nico [C] destruye el palo selfie sin daño' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 480, h: 100, style: 'cobble' },
        { x: 800, y: GROUND_Y, w: 500, h: 100, style: 'cobble' },
        { x: 1680, y: GROUND_Y, w: 500, h: 100, style: 'cobble' },
        { x: 2540, y: GROUND_Y, w: 860, h: 100, style: 'cobble' },

        // Plataformas intermedias de 2 bloques máximo para Gatos
        { x: 280, y: 365, w: 95, h: 18, oneWay: true, style: 'balcony' },
        { x: 1020, y: 355, w: 95, h: 18, oneWay: true, style: 'balcony' },
        { x: 1470, y: 320, w: 90, h: 18, oneWay: true, style: 'balcony' },
        { x: 1615, y: 242, w: 88, h: 18, oneWay: true, style: 'balcony' },
        { x: 1900, y: 360, w: 95, h: 18, oneWay: true, style: 'balcony' },
        { x: 2780, y: 365, w: 95, h: 18, oneWay: true, style: 'balcony' }
      ],
      movingPlatforms: [
        // Móvil horizontal sobre Pozo 1
        { x: 510, y: 415, endX: 680, endY: 415, sx: 510, sy: 415, ex: 680, ey: 415, w: 95, h: 18, speed: 100, style: 'balcony' },
        // Móvil vertical sobre Pozo 2
        { x: 1335, y: 430, endX: 1335, endY: 295, sx: 1335, sy: 430, ex: 1335, ey: 295, w: 90, h: 18, speed: 95, style: 'crane' },
        // Móvil horizontal sobre Pozo 3
        { x: 2210, y: 410, endX: 2320, endY: 410, sx: 2210, sy: 410, ex: 2320, ey: 410, w: 90, h: 18, speed: 105, style: 'balcony' },
        // Móvil vertical subida final sobre Pozo 3
        { x: 2430, y: 430, endX: 2430, endY: 315, sx: 2430, sy: 430, ex: 2430, ey: 315, w: 85, h: 18, speed: 100, style: 'crane' }
      ],
      fallingPlatforms: [
        { x: 1580, y: 390, w: 80, h: 18, style: 'wood' }
      ],
      collectibles: [
        { x: 210, y: 415, type: 'coin' },
        { x: 615, y: 370, type: 'coin' },
        { x: 1646, y: 199, type: 'angel_wings' },
        { x: 1935, y: 320, type: 'coin' },
        { x: 2280, y: 365, type: 'coin' },
        { x: 2815, y: 325, type: 'coin' },
        { x: 2960, y: 415, type: 'coin' }
      ],
      // ENEMIGOS NIVEL 2: Turistas con Palo Selfie en suelo + Gatos en plataformas intermedias
      selfieTourists: [
        { x: 300, y: GROUND_Y, minX: 180, maxX: 460, speed: 52 },
        { x: 1160, y: GROUND_Y, minX: 1040, maxX: 1270, speed: 55 },
        { x: 1840, y: GROUND_Y, minX: 1700, maxX: 2150, speed: 58 },
        { x: 2660, y: GROUND_Y, minX: 2560, maxX: 3020, speed: 62 }
      ],
      cats: [
        { x: 310, y: 365, minX: 285, maxX: 368, speed: 41, isAmbush: true },
        { x: 1050, y: 355, minX: 1025, maxX: 1110, speed: 44, isAmbush: true },
        { x: 1930, y: 360, minX: 1905, maxX: 1990, speed: 48, isAmbush: true },
        { x: 2810, y: 365, minX: 2785, maxX: 2870, speed: 51, isAmbush: true }
      ],
      pigeons: [
        { x: 880, y: GROUND_Y, minX: 820, maxX: 1015, speed: 75 }
      ],
      royalGuards: [
        { x: 960, y: GROUND_Y, minX: 830, maxX: 1030, speed: 58 },
        { x: 2880, y: GROUND_Y, minX: 2740, maxX: 3040, speed: 62 }
      ],
      greenParakeets: [
        { x: 1500, baseY: 275, minX: 1320, maxX: 1720, ampY: 42, speed: 124 }
      ]
    },

    // ========================================================================
    // NIVEL 3: PARQUE DEL RETIRO (Cotorras en vuelo senoidal cruzado + Turistas)
    // ========================================================================
    {
      id: 3,
      city: 'madrid',
      name: '3. Parque del Retiro',
      subtitle: 'El Estanque Grande — Cotorras Verdes cruzadas y Turistas en pasos estrechos',
      nextDestination: 'Palacio Real y Almudena',
      theme: 'madrid_retiro',
      width: 3450,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3200,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '🦜 ¡Plaga en el Retiro! Cotorras en vuelo senoidal. Usá a la Tina [X]' },
        { x: 750, y: 255, text: '🚤 Plataformas de madera y ascensores verticales sobre el estanque' },
        { x: 1680, y: 240, text: '📸 Turistas bloqueando los pasos estrechos del suelo: dispará [Z]' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 460, h: 100, style: 'stone' },
        { x: 800, y: GROUND_Y, w: 460, h: 100, style: 'stone' },
        { x: 1640, y: GROUND_Y, w: 480, h: 100, style: 'stone' },
        { x: 2500, y: GROUND_Y, w: 950, h: 100, style: 'stone' },

        { x: 280, y: 365, w: 90, h: 18, oneWay: true, style: 'wood' },
        { x: 1435, y: 305, w: 90, h: 18, oneWay: true, style: 'wood' },
        { x: 1840, y: 360, w: 90, h: 18, oneWay: true, style: 'wood' },
        { x: 2740, y: 360, w: 90, h: 18, oneWay: true, style: 'wood' }
      ],
      movingPlatforms: [
        // Barcaza horizontal sobre el estanque (Pozo 1)
        { x: 495, y: 415, endX: 685, endY: 415, sx: 495, sy: 415, ex: 685, ey: 415, w: 95, h: 18, speed: 105, style: 'wood' },
        // Plataforma vertical sobre Pozo 2
        { x: 1295, y: 430, endX: 1295, endY: 285, sx: 1295, sy: 430, ex: 1295, ey: 285, w: 90, h: 18, speed: 100, style: 'crane' },
        // Barcaza horizontal sobre Pozo 3
        { x: 2150, y: 410, endX: 2270, endY: 410, sx: 2150, sy: 410, ex: 2270, ey: 410, w: 90, h: 18, speed: 110, style: 'wood' },
        // Ascensor vertical subida a tramo final
        { x: 2385, y: 430, endX: 2385, endY: 310, sx: 2385, sy: 430, ex: 2385, ey: 310, w: 90, h: 18, speed: 105, style: 'crane' }
      ],
      fallingPlatforms: [
        { x: 1550, y: 380, w: 80, h: 18, style: 'wood' }
      ],
      collectibles: [
        { x: 200, y: 415, type: 'coin' },
        { x: 600, y: 370, type: 'coin' },
        { x: 1875, y: 320, type: 'coin' },
        { x: 2220, y: 365, type: 'coin' },
        { x: 2677, y: 417, type: 'burger' },
        { x: 2775, y: 320, type: 'coin' },
        { x: 3000, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1869, y: 238, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      // ENEMIGOS NIVEL 3: Cotorras Verdes en vuelo senoidal cruzado + Turistas en pasos estrechos
      greenParakeets: [
        { x: 560, baseY: 335, minX: 380, maxX: 840, ampY: 46, speed: 128 },
        { x: 950, baseY: 245, minX: 760, maxX: 1260, ampY: 50, speed: 140 },
        { x: 1420, baseY: 325, minX: 1220, maxX: 1680, ampY: 48, speed: 136 },
        { x: 1860, baseY: 255, minX: 1640, maxX: 2150, ampY: 54, speed: 145 },
        { x: 2340, baseY: 340, minX: 2120, maxX: 2620, ampY: 46, speed: 140 },
        { x: 2820, baseY: 280, minX: 2550, maxX: 3080, ampY: 50, speed: 150 }
      ],
      selfieTourists: [
        { x: 310, y: GROUND_Y, minX: 190, maxX: 440, speed: 55 },
        { x: 890, y: GROUND_Y, minX: 820, maxX: 1015, speed: 58 },
        { x: 1820, y: GROUND_Y, minX: 1660, maxX: 2090, speed: 62 },
        { x: 2700, y: GROUND_Y, minX: 2520, maxX: 3080, speed: 65 }
      ],
      cats: [
        { x: 1870, y: 360, minX: 1845, maxX: 1925, speed: 46, isAmbush: true },
        { x: 2770, y: 360, minX: 2745, maxX: 2825, speed: 50, isAmbush: true }
      ],
      hedgehogs: [
        { x: 1130, y: GROUND_Y, minX: 1045, maxX: 1235, speed: 68 }
      ]
    },

    // ========================================================================
    // NIVEL 4: PALACIO REAL Y ALMUDENA (Clímax: Turistas + Gatos + Enjambre 20 Cotorras)
    // ========================================================================
    {
      id: 4,
      city: 'madrid',
      name: '4. Palacio Real y Almudena',
      subtitle: 'Plaza de la Armería — ¡Supervivencia contra Enjambre de 20 Cotorras!',
      nextDestination: 'Palma de Mallorca (Mundo 3)',
      theme: 'madrid_palacio',
      width: 3600,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3380,
      flagY: GROUND_Y - 68,
      swarmTriggerX: 2620,
      isMadridSwarm: true,
      hints: [
        { x: 60, y: 305, text: '👑 Palacio Real: ¡Guardá el doble ladrido [X] de Tina para el Enjambre final!' },
        { x: 1260, y: 245, text: '⚠️ Ascensores verticales y plataformas móviles sobre las fosas reales' },
        { x: 2560, y: 235, text: '🚨 ¡ALERTA PLAGA ADELANTE! Las 20 cotorras te perseguirán sin piedad' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 460, h: 100, style: 'stone' },
        { x: 800, y: GROUND_Y, w: 500, h: 100, style: 'stone' },
        { x: 1700, y: GROUND_Y, w: 480, h: 100, style: 'stone' },
        { x: 2540, y: GROUND_Y, w: 1060, h: 100, style: 'stone' },

        { x: 280, y: 360, w: 95, h: 18, oneWay: true, style: 'stone' },
        { x: 1020, y: 355, w: 95, h: 18, oneWay: true, style: 'stone' },
        { x: 1475, y: 310, w: 90, h: 18, oneWay: true, style: 'stone' },
        { x: 1900, y: 355, w: 95, h: 18, oneWay: true, style: 'stone' },
        { x: 2305, y: 235, w: 92, h: 18, oneWay: true, style: 'stone' },
        { x: 2820, y: 360, w: 95, h: 18, oneWay: true, style: 'stone' }
      ],
      movingPlatforms: [
        { x: 495, y: 415, endX: 685, endY: 415, sx: 495, sy: 415, ex: 685, ey: 415, w: 95, h: 18, speed: 110, style: 'stone' },
        { x: 1335, y: 430, endX: 1335, endY: 285, sx: 1335, sy: 430, ex: 1335, ey: 285, w: 90, h: 18, speed: 110, style: 'crane' },
        { x: 2210, y: 410, endX: 2320, endY: 410, sx: 2210, sy: 410, ex: 2320, ey: 410, w: 90, h: 18, speed: 115, style: 'stone' },
        { x: 2425, y: 430, endX: 2425, endY: 315, sx: 2425, sy: 430, ex: 2425, ey: 315, w: 90, h: 18, speed: 110, style: 'crane' }
      ],
      fallingPlatforms: [
        { x: 1595, y: 385, w: 80, h: 18, style: 'wood' }
      ],
      collectibles: [
        { x: 200, y: 415, type: 'coin' },
        { x: 590, y: 370, type: 'coin' },
        { x: 1831, y: 417, type: 'burger' },
        { x: 2270, y: 365, type: 'coin' },
        { x: 2354, y: 192, type: 'angel_wings' },
        { x: 2855, y: 320, type: 'coin' },
        { x: 3120, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1051, y: 233, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      // ENEMIGOS NIVEL 4: Mezcla de Turistas, Gatos en plataformas + Enjambre teledirigido
      selfieTourists: [
        { x: 300, y: GROUND_Y, minX: 180, maxX: 440, speed: 60 },
        { x: 920, y: GROUND_Y, minX: 820, maxX: 1035, speed: 62 },
        { x: 1840, y: GROUND_Y, minX: 1720, maxX: 1955, speed: 65 },
        { x: 2950, y: GROUND_Y, minX: 2680, maxX: 3260, speed: 68 }
      ],
      cats: [
        { x: 305, y: 360, minX: 285, maxX: 368, speed: 48, isAmbush: true },
        { x: 1050, y: 355, minX: 1025, maxX: 1110, speed: 51, isAmbush: true },
        { x: 1185, y: GROUND_Y, minX: 1085, maxX: 1275, speed: 92, isAmbush: false },
        { x: 1930, y: 355, minX: 1905, maxX: 1990, speed: 53, isAmbush: true },
        { x: 2850, y: 360, minX: 2825, maxX: 2910, speed: 55, isAmbush: true }
      ],
      greenParakeets: [
        { x: 650, baseY: 310, minX: 460, maxX: 880, ampY: 45, speed: 145 },
        { x: 1450, baseY: 270, minX: 1250, maxX: 1700, ampY: 50, speed: 154 },
        { x: 2300, baseY: 315, minX: 2100, maxX: 2560, ampY: 48, speed: 150 }
      ],
      royalGuards: [
        { x: 1060, y: GROUND_Y, minX: 980, maxX: 1260, speed: 64 },
        { x: 1960, y: GROUND_Y, minX: 1780, maxX: 2040, speed: 66 },
        { x: 3160, y: GROUND_Y, minX: 2980, maxX: 3310, speed: 70 }
      ],
      hedgehogs: [
        { x: 2050, y: GROUND_Y, minX: 1985, maxX: 2155, speed: 72 }
      ]
    }
  ];

  // ==========================================================================
  // MUNDO 3: PALMA DE MALLORCA (4 Niveles — Escalón Superior de Dificultad)
  // - Plataformas más estrechas sobre agua profunda (caer cuesta 1 vida)
  // - Enemigos +20% más rápidos que Madrid (Medusas, Cangrejos, Cabras, Gaviotas Reales)
  // - Viento costero interactivo en Niveles 2 y 3
  // - Clímax Nivel 4 con tormenta marina, oleaje y enjambre de Gaviotas Reales
  // ==========================================================================
  const PALMA_LEVELS = [
    // NIVEL 1: CATEDRAL DE MALLORCA (LA SEU) Y PASEO MARÍTIMO
    {
      id: 1,
      city: 'palma',
      name: '1. La Seu y Paseo Marítimo',
      subtitle: 'Mallorca: Muelles estrechos sobre el mar, Medusas Eléctricas y Cangrejos',
      nextDestination: 'Castell de Bellver',
      theme: 'palma_seu',
      hasWaterPits: true,
      width: 3530,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 2990,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '🏝️ Palma de Mallorca: ¡Caer al agua profunda cuesta 1 vida y enemigos +20%!' },
        { x: 350, y: 270, text: '⚡ Medusas Eléctricas: ¡Inmunes al salto! Esquivalas o usá Planta [Z]' },
        { x: 470, y: 270, text: '🦀 Cangrejos Costeros: ¡Levantan pinzas si saltás encima! Usá [Z] o esquivá' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 340, h: 100, style: 'stone' },
        { x: 445, y: GROUND_Y, w: 185, h: 100, style: 'stone' },
        { x: 740, y: GROUND_Y - 25, w: 120, h: 125, style: 'stone' },
        { x: 965, y: GROUND_Y, w: 280, h: 100, style: 'stone' },
        { x: 1645, y: GROUND_Y, w: 290, h: 100, style: 'stone' },
        { x: 2045, y: GROUND_Y, w: 145, h: 100, style: 'stone' },
        { x: 2295, y: GROUND_Y - 28, w: 125, h: 128, style: 'stone' },
        { x: 2525, y: GROUND_Y, w: 1005, h: 100, style: 'stone' },

        { x: 220, y: 365, w: 80, h: 18, oneWay: true, style: 'balcony' },
        { x: 1050, y: 365, w: 80, h: 18, oneWay: true, style: 'stone' },
        { x: 1750, y: 360, w: 80, h: 18, oneWay: true, style: 'stone' },
        { x: 2680, y: 365, w: 85, h: 18, oneWay: true, style: 'balcony' }
      ],
      movingPlatforms: [
        { x: 1295, y: 415, endX: 1500, endY: 415, sx: 1295, sy: 415, ex: 1500, ey: 415, w: 74, h: 18, speed: 125, style: 'wood' }
      ],
      fallingPlatforms: [
        { x: 2205, y: 425, w: 72, h: 18, style: 'wood' }
      ],
      collectibles: [
        { x: 180, y: 415, type: 'coin' },
        { x: 525, y: 415, type: 'coin' },
        { x: 788, y: 390, type: 'coin' },
        { x: 1410, y: 365, type: 'coin' },
        { x: 2105, y: 415, type: 'coin' },
        { x: 2345, y: 385, type: 'coin' },
        { x: 2692, y: 322, type: 'burger' },
        { x: 2910, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1774, y: 238, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      jellyfishes: [
        { x: 375, baseY: 360, ampY: 52, speed: 84 },
        { x: 668, baseY: 345, ampY: 55, speed: 88 },
        { x: 1410, baseY: 315, ampY: 48, speed: 90 },
        { x: 1972, baseY: 350, ampY: 54, speed: 88 },
        { x: 2455, baseY: 345, ampY: 54, speed: 92 }
      ],
      crabs: [
        { x: 510, y: GROUND_Y, minX: 455, maxX: 620, speed: 108 },
        { x: 1080, y: GROUND_Y, minX: 980, maxX: 1230, speed: 114 },
        { x: 1760, y: GROUND_Y, minX: 1660, maxX: 1920, speed: 116 },
        { x: 2630, y: GROUND_Y, minX: 2540, maxX: 2760, speed: 120 }
      ],
      goats: [
        { x: 2820, y: GROUND_Y, minX: 2720, maxX: 2955, speed: 82 }
      ]
    },

    // NIVEL 2: CASTELL DE BELLVER (Viento costero interactivo + Cabras + Fosados)
    {
      id: 2,
      city: 'palma',
      name: '2. Castell de Bellver',
      subtitle: 'Fosos medievales, ráfagas de viento costero y Cabras de Tramuntana',
      nextDestination: 'Calas y Acantilados',
      theme: 'palma_bellver',
      hasWaterPits: true,
      hasWind: true,
      width: 3630,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3090,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '🌬️ VIENTO COSTERO: ¡Ráfagas que desvían tus saltos en el aire!' },
        { x: 670, y: 270, text: '🐐 Cabra de Tramuntana: ¡Embiste a toda velocidad cuando te ve!' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 320, h: 100, style: 'cobble' },
        { x: 425, y: GROUND_Y - 18, w: 140, h: 118, style: 'stone' },
        { x: 670, y: GROUND_Y, w: 230, h: 100, style: 'cobble' },
        { x: 1105, y: GROUND_Y, w: 220, h: 100, style: 'stone' },
        { x: 1520, y: 360, w: 80, h: 18, oneWay: true, style: 'stone' },
        { x: 1765, y: GROUND_Y, w: 260, h: 100, style: 'cobble' },
        { x: 2125, y: GROUND_Y - 26, w: 135, h: 126, style: 'stone' },
        { x: 2495, y: GROUND_Y, w: 1135, h: 100, style: 'cobble' },

        { x: 195, y: 365, w: 76, h: 18, oneWay: true, style: 'stone' },
        { x: 740, y: 355, w: 76, h: 18, oneWay: true, style: 'balcony' },
        { x: 1850, y: 355, w: 78, h: 18, oneWay: true, style: 'stone' },
        { x: 1965, y: 274, w: 84, h: 18, oneWay: true, style: 'stone' },
        { x: 2680, y: 360, w: 80, h: 18, oneWay: true, style: 'stone' }
      ],
      movingPlatforms: [
        { x: 1380, y: 430, endX: 1380, endY: 315, sx: 1380, sy: 430, ex: 1380, ey: 315, w: 72, h: 18, speed: 120, style: 'wood' },
        { x: 1630, y: 405, endX: 1705, endY: 405, sx: 1630, sy: 405, ex: 1705, ey: 405, w: 72, h: 18, speed: 115, style: 'stone' }
      ],
      fallingPlatforms: [
        { x: 965, y: 420, w: 72, h: 18, style: 'wood' },
        { x: 2345, y: 405, w: 72, h: 18, style: 'wood' }
      ],
      collectibles: [
        { x: 485, y: 398, type: 'coin' },
        { x: 1190, y: 415, type: 'coin' },
        { x: 1268, y: 417, type: 'burger' },
        { x: 1548, y: 320, type: 'coin' },
        { x: 1978, y: 231, type: 'angel_wings' },
        { x: 2180, y: 390, type: 'coin' },
        { x: 2980, y: 415, type: 'coin' }
      ],
      jellyfishes: [
        { x: 358, baseY: 355, ampY: 54, speed: 88 },
        { x: 602, baseY: 350, ampY: 56, speed: 92 },
        { x: 1472, baseY: 310, ampY: 50, speed: 90 },
        { x: 2058, baseY: 350, ampY: 54, speed: 94 },
        { x: 2430, baseY: 345, ampY: 56, speed: 95 }
      ],
      crabs: [
        { x: 470, y: GROUND_Y - 18, minX: 432, maxX: 558, speed: 116 },
        { x: 2170, y: GROUND_Y - 26, minX: 2132, maxX: 2252, speed: 120 },
        { x: 2880, y: GROUND_Y, minX: 2780, maxX: 3020, speed: 124 }
      ],
      goats: [
        { x: 770, y: GROUND_Y, minX: 682, maxX: 890, speed: 80 },
        { x: 1210, y: GROUND_Y, minX: 1118, maxX: 1315, speed: 84 },
        { x: 1890, y: GROUND_Y, minX: 1780, maxX: 2010, speed: 86 },
        { x: 2650, y: GROUND_Y, minX: 2515, maxX: 2800, speed: 90 }
      ],
      royalSeagulls: [
        { x: 1580, baseY: 280, minX: 1320, maxX: 1860, ampY: 42, speed: 155 },
        { x: 2620, baseY: 275, minX: 2380, maxX: 2950, ampY: 44, speed: 162 }
      ]
    },

    // NIVEL 3: CALAS Y ACANTILADOS (Rocas estrechas sobre mar turquesa + Viento)
    {
      id: 3,
      city: 'palma',
      name: '3. Calas y Acantilados',
      subtitle: 'Islotes rocosos sobre agua turquesa, viento de Tramuntana y Gaviotas Reales',
      nextDestination: 'Puerto de Palma y Faro',
      theme: 'palma_calas',
      hasWaterPits: true,
      hasWind: true,
      width: 3780,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3240,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '🌊 Calas de Mallorca: ¡Saltos milimétricos entre islotes con viento fuerte!' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 280, h: 100, style: 'sand' },
        { x: 380, y: 432, w: 92, h: 108, style: 'stone' },
        { x: 570, y: 405, w: 86, h: 135, style: 'stone' },
        { x: 755, y: 440, w: 190, h: 100, style: 'sand' },
        { x: 1365, y: GROUND_Y, w: 230, h: 100, style: 'sand' },
        { x: 1830, y: 398, w: 86, h: 142, style: 'stone' },
        { x: 2010, y: 432, w: 170, h: 108, style: 'stone' },
        { x: 2390, y: 348, w: 90, h: 18, oneWay: true, style: 'stone' },
        { x: 2560, y: 436, w: 200, h: 104, style: 'sand' },
        { x: 2990, y: GROUND_Y, w: 790, h: 100, style: 'sand' },

        { x: 165, y: 365, w: 74, h: 18, oneWay: true, style: 'stone' },
        { x: 810, y: 345, w: 76, h: 18, oneWay: true, style: 'stone' },
        { x: 1440, y: 355, w: 76, h: 18, oneWay: true, style: 'stone' },
        { x: 2630, y: 340, w: 78, h: 18, oneWay: true, style: 'stone' }
      ],
      movingPlatforms: [
        { x: 1005, y: 412, endX: 1235, endY: 412, sx: 1005, sy: 412, ex: 1235, ey: 412, w: 74, h: 18, speed: 130, style: 'stone' },
        { x: 2245, y: 430, endX: 2245, endY: 318, sx: 2245, sy: 430, ex: 2245, ey: 318, w: 74, h: 18, speed: 125, style: 'wood' }
      ],
      fallingPlatforms: [
        { x: 1675, y: 425, w: 72, h: 18, style: 'wood' },
        { x: 2840, y: 415, w: 72, h: 18, style: 'wood' }
      ],
      collectibles: [
        { x: 415, y: 390, type: 'coin' },
        { x: 602, y: 362, type: 'coin' },
        { x: 1125, y: 368, type: 'coin' },
        { x: 1862, y: 355, type: 'coin' },
        { x: 2048, y: 389, type: 'burger' },
        { x: 2425, y: 305, type: 'coin' },
        { x: 3140, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1462, y: 233, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      jellyfishes: [
        { x: 315, baseY: 348, ampY: 56, speed: 92 },
        { x: 505, baseY: 340, ampY: 56, speed: 94 },
        { x: 690, baseY: 345, ampY: 55, speed: 95 },
        { x: 1140, baseY: 310, ampY: 52, speed: 96 },
        { x: 1765, baseY: 335, ampY: 54, speed: 96 },
        { x: 2498, baseY: 335, ampY: 55, speed: 98 },
        { x: 2925, baseY: 345, ampY: 56, speed: 98 }
      ],
      crabs: [
        { x: 830, y: 440, minX: 765, maxX: 935, speed: 122 },
        { x: 1465, y: GROUND_Y, minX: 1378, maxX: 1580, speed: 126 },
        { x: 2085, y: 432, minX: 2020, maxX: 2170, speed: 128 },
        { x: 2650, y: 436, minX: 2572, maxX: 2748, speed: 130 }
      ],
      goats: [
        { x: 1500, y: GROUND_Y, minX: 1380, maxX: 1585, speed: 88 },
        { x: 3075, y: GROUND_Y, minX: 3005, maxX: 3205, speed: 92 }
      ],
      royalSeagulls: [
        { x: 640, baseY: 275, minX: 430, maxX: 900, ampY: 44, speed: 165 },
        { x: 1260, baseY: 265, minX: 1020, maxX: 1520, ampY: 48, speed: 170 },
        { x: 1960, baseY: 280, minX: 1720, maxX: 2220, ampY: 46, speed: 172 },
        { x: 2820, baseY: 270, minX: 2560, maxX: 3080, ampY: 48, speed: 178 }
      ]
    },

    // NIVEL 4: PUERTO DE PALMA Y FARO DE PORTO PÍ (Tormenta Nocturna + Oleaje + Enjambre Gaviotas Reales)
    {
      id: 4,
      city: 'palma',
      name: '4. Puerto de Palma y Faro',
      subtitle: 'Tormenta en Porto Pí — ¡Oleaje alto y Bandada de 20 Gaviotas Reales!',
      nextDestination: 'Palma Intermodal · Islas Canarias',
      theme: 'palma_puerto',
      hasWaterPits: true,
      hasStormWaves: true,
      swarmTriggerX: 2520,
      isPalmaSwarm: true,
      width: 3860,
      timeLimit: 120,
      spawn: { x: 80, y: 390 },
      flagX: 3320,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 60, y: 305, text: '⛈️ Faro de Porto Pí: ¡Espigones de tormenta! Reservá el Ladrido [X] para el clímax' },
        { x: 2470, y: 245, text: '🚨 ¡TORMENTA FINAL! 20 Gaviotas Reales te acechan antes de la meta' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 330, h: 100, style: 'wood' },
        { x: 430, y: GROUND_Y, w: 160, h: 100, style: 'stone' },
        { x: 1020, y: GROUND_Y, w: 250, h: 100, style: 'stone' },
        { x: 1495, y: GROUND_Y - 25, w: 130, h: 125, style: 'stone' },
        { x: 1850, y: GROUND_Y, w: 240, h: 100, style: 'wood' },
        { x: 2470, y: GROUND_Y, w: 1390, h: 100, style: 'stone' },

        { x: 195, y: 360, w: 80, h: 18, oneWay: true, style: 'wood' },
        { x: 1100, y: 355, w: 80, h: 18, oneWay: true, style: 'stone' },
        { x: 1565, y: 230, w: 84, h: 18, oneWay: true, style: 'wood' },
        { x: 1930, y: 355, w: 80, h: 18, oneWay: true, style: 'wood' },
        { x: 2820, y: 360, w: 85, h: 18, oneWay: true, style: 'crane' },
        { x: 2440, y: 255, w: 62, h: 16, oneWay: true, style: 'faro_rock' }
      ],
      movingPlatforms: [
        { x: 655, y: 420, endX: 890, endY: 420, sx: 655, sy: 420, ex: 890, ey: 420, w: 76, h: 18, speed: 135, style: 'wood' },
        { x: 1700, y: 415, endX: 1700, endY: 310, sx: 1700, sy: 415, ex: 1700, ey: 310, w: 74, h: 18, speed: 130, style: 'crane' },
        { x: 2155, y: 410, endX: 2335, endY: 410, sx: 2155, sy: 410, ex: 2335, ey: 410, w: 74, h: 18, speed: 140, style: 'wood' }
      ],
      fallingPlatforms: [
        { x: 1345, y: 415, w: 74, h: 18, style: 'wood' },
        { x: 2070, y: 315, w: 58, h: 16, fallDelay: 0.40, style: 'wood' },
        { x: 2195, y: 280, w: 58, h: 16, fallDelay: 0.40, style: 'wood' },
        { x: 2320, y: 255, w: 58, h: 16, fallDelay: 0.40, style: 'wood' }
      ],
      collectibles: [
        { x: 500, y: 415, type: 'coin' },
        { x: 785, y: 370, type: 'coin' },
        { x: 1550, y: 390, type: 'coin' },
        { x: 1941, y: 312, type: 'burger' },
        { x: 2255, y: 362, type: 'coin' },
        { x: 2458, y: 215, type: 'golden_bone' },
        { x: 3140, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1124, y: 233, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 2846, y: 238, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      jellyfishes: [
        { x: 365, baseY: 345, ampY: 56, speed: 96 },
        { x: 600, baseY: 340, ampY: 56, speed: 98 },
        { x: 960, baseY: 345, ampY: 56, speed: 98 },
        { x: 1290, baseY: 340, ampY: 56, speed: 100 },
        { x: 1635, baseY: 325, ampY: 54, speed: 100 },
        { x: 2100, baseY: 340, ampY: 55, speed: 102 },
        { x: 2410, baseY: 335, ampY: 55, speed: 102 }
      ],
      crabs: [
        { x: 495, y: GROUND_Y, minX: 440, maxX: 580, speed: 128 },
        { x: 1110, y: GROUND_Y, minX: 1032, maxX: 1258, speed: 132 },
        { x: 1940, y: GROUND_Y, minX: 1862, maxX: 2078, speed: 135 },
        { x: 2680, y: GROUND_Y, minX: 2540, maxX: 2880, speed: 136 },
        { x: 3060, y: GROUND_Y, minX: 2940, maxX: 3240, speed: 138 }
      ],
      goats: [
        { x: 1170, y: GROUND_Y, minX: 1032, maxX: 1258, speed: 90 },
        { x: 2010, y: GROUND_Y, minX: 1862, maxX: 2078, speed: 92 },
        { x: 2920, y: GROUND_Y, minX: 2660, maxX: 3240, speed: 96 }
      ],
      royalSeagulls: [
        { x: 780, baseY: 268, minX: 540, maxX: 1020, ampY: 46, speed: 175 },
        { x: 1550, baseY: 255, minX: 1320, maxX: 1820, ampY: 50, speed: 182 },
        { x: 2240, baseY: 265, minX: 2000, maxX: 2500, ampY: 48, speed: 185 }
      ]
    }
  ];

  // ==========================================================================
  // MUNDO 4: ISLAS CANARIAS (Dificultad Máxima - Final de España)
  // ==========================================================================
  const CANARIAS_LEVELS = [
    {
      id: 1,
      name: '1. Dunas de Maspalomas',
      nextDestination: 'Bosque de Garajonay',
      subtitle: 'Arenas movedizas · Plataformas diagonales · Precisión en el vacío',
      theme: 'canarias_maspalomas',
      width: 3740,
      timeLimit: 120,
      hasSandPhysics: true,
      hasWaterPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 3200,
      flagY: GROUND_Y - 68,
      solids: [
        // Islas de arena separadas por grandes fosos atlánticos (cruce obligatorio móvil/temporal)
        { x: 0, y: GROUND_Y, w: 420, h: 100, style: 'sand' },
        { x: 790, y: GROUND_Y, w: 330, h: 100, style: 'sand' },
        { x: 1630, y: GROUND_Y, w: 380, h: 100, style: 'sand' },
        { x: 2490, y: GROUND_Y, w: 330, h: 100, style: 'sand' },
        { x: 3040, y: GROUND_Y, w: 700, h: 100, style: 'sand' },

        // Solo 2 estáticas suspendidas muy separadas (cero secuencias por arriba)
        { x: 215, y: 378, w: 78, h: 16, oneWay: true, style: 'wood' },
        { x: 2340, y: 368, w: 80, h: 16, oneWay: true, style: 'sand' }
      ],
      movingPlatforms: [
        // Diagonal oscilante #1 (sube hacia la derecha / baja hacia la izquierda)
        { sx: 1175, sy: 415, w: 82, h: 16, mode: 'oscillate', angleDeg: -25, dist: 150, phase: 0, speed: 118, style: 'wood' },
        // Viga vertical rápida entre abismo y límite superior
        { sx: 1465, sy: 135, w: 72, h: 16, mode: 'oscillate', angleDeg: 90, dist: 303, phase: 0.7, speed: 155, style: 'crane' },
        // Diagonal oscilante #2 en sentido contrario (phase Math.PI, baja hacia la derecha)
        { sx: 2065, sy: 372, w: 82, h: 16, mode: 'oscillate', angleDeg: 20, dist: 140, phase: Math.PI, speed: 122, style: 'wood' }
      ],
      fallingPlatforms: [
        { x: 485, y: 405, w: 68, h: 16, style: 'wood', fallDelay: 0.6 },
        { x: 625, y: 392, w: 68, h: 16, style: 'wood', fallDelay: 0.6 },
        { x: 2890, y: 405, w: 68, h: 16, style: 'wood', fallDelay: 0.6 }
      ],
      collectibles: [
        { type: 'coin', x: 140, y: 420 },
        { type: 'coin', x: 508, y: 365 },
        { type: 'coin', x: 648, y: 352 },
        { type: 'coin', x: 940, y: 418 },
        { type: 'coin', x: 1280, y: 325 },
        { type: 'coin', x: 1490, y: 210 },
        { x: 1731, y: 417, type: 'burger' },
        { type: 'coin', x: 2915, y: 365 },
        { type: 'coin', x: 3090, y: 418 }
      ],
      questionBlocks: [
        { x: 2364, y: 246, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      pigeons: [
        { x: 1720, y: GROUND_Y, minX: 1640, maxX: 1995, speed: 125, reactive: true },
        { x: 2560, y: GROUND_Y, minX: 2500, maxX: 2805, speed: 130, reactive: true }
      ],
      scooters: [],
      seagulls: [],
      hedgehogs: [],
      gallotias: [
        { x: 960, y: GROUND_Y, minX: 800, maxX: 1110, speed: 145 },
        { x: 1840, y: GROUND_Y, minX: 1640, maxX: 2000, speed: 152 },
        { x: 2680, y: GROUND_Y, minX: 2500, maxX: 2810, speed: 158 }
      ],
      abubillas: [
        { x: 740, baseY: 232, minX: 560, maxX: 920, vx: 154, amplitude: 24, diveSpeed: 285 },
        { x: 1420, baseY: 220, minX: 1140, maxX: 1690, vx: -162, amplitude: 24, diveSpeed: 295 },
        { x: 2280, baseY: 224, minX: 2020, maxX: 2560, vx: 166, amplitude: 26, diveSpeed: 305 },
        { x: 2990, baseY: 218, minX: 2780, maxX: 3240, vx: -168, amplitude: 24, diveSpeed: 308 }
      ]
    },

    {
      id: 2,
      name: '2. Bosque de Garajonay',
      nextDestination: 'Volcanes de Timanfaya',
      subtitle: 'Laurisilva milenaria · Diagonales cruzadas · Ramas de 0.6s',
      theme: 'canarias_garajonay',
      width: 3920,
      timeLimit: 120,
      hasDeadlyPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 3380,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 340, h: 100, style: 'branch' },
        { x: 820, y: GROUND_Y, w: 300, h: 100, style: 'branch' },
        { x: 1750, y: GROUND_Y, w: 300, h: 100, style: 'branch' },
        { x: 2820, y: GROUND_Y, w: 270, h: 100, style: 'branch' },
        { x: 3265, y: GROUND_Y, w: 655, h: 100, style: 'branch' },

        // Solo 2 estáticas aisladas sobre abismos distintos (prohibido camino superior)
        { x: 675, y: 365, w: 80, h: 16, oneWay: true, style: 'branch' },
        { x: 2395, y: 360, w: 78, h: 16, oneWay: true, style: 'branch' }
      ],
      movingPlatforms: [
        // Par de diagonales cruzadas en sentidos opuestos sobre abismo principal
        { sx: 1180, sy: 405, w: 80, h: 16, mode: 'oscillate', angleDeg: -30, dist: 165, phase: 0, speed: 125, style: 'branch' },
        { sx: 1465, sy: 325, w: 80, h: 16, mode: 'oscillate', angleDeg: 26, dist: 155, phase: Math.PI, speed: 128, style: 'branch' },
        // Viga vertical rápida hacia abismo de niebla
        { sx: 2115, sy: 125, w: 70, h: 16, mode: 'oscillate', angleDeg: 90, dist: 315, phase: 0, speed: 165, style: 'crane' },
        // Rama elevada secreta sobre la niebla para Huesito Dorado
        { sx: 2295, sy: 118, w: 62, h: 16, mode: 'oscillate', angleDeg: 0, dist: 42, phase: 0.5, speed: 88, style: 'branch' },
        // Diagonal #3 hacia el tramo final
        { sx: 2535, sy: 392, w: 80, h: 16, mode: 'oscillate', angleDeg: -26, dist: 130, phase: 0.8, speed: 130, style: 'branch' }
      ],
      fallingPlatforms: [
        { x: 405, y: 406, w: 68, h: 16, style: 'branch', fallDelay: 0.6 },
        { x: 545, y: 388, w: 68, h: 16, style: 'branch', fallDelay: 0.6 },
        { x: 2255, y: 386, w: 68, h: 16, style: 'branch', fallDelay: 0.6 },
        { x: 3145, y: 404, w: 68, h: 16, style: 'branch', fallDelay: 0.6 }
      ],
      collectibles: [
        { type: 'coin', x: 185, y: 420 },
        { type: 'coin', x: 428, y: 366 },
        { type: 'coin', x: 568, y: 348 },
        { type: 'coin', x: 960, y: 418 },
        { type: 'coin', x: 1330, y: 312 },
        { type: 'coin', x: 1580, y: 312 },
        { type: 'coin', x: 2140, y: 185 },
        { type: 'golden_bone', x: 2320, y: 78 },
        { x: 2405, y: 317, type: 'burger' },
        { type: 'coin', x: 2945, y: 418 },
        { type: 'coin', x: 3320, y: 418 }
      ],
      questionBlocks: [
        { x: 1885, y: 336, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pigeons: [
        { x: 1825, y: GROUND_Y, minX: 1760, maxX: 2035, speed: 130, reactive: true }
      ],
      scooters: [],
      seagulls: [],
      hedgehogs: [],
      gallotias: [
        { x: 950, y: GROUND_Y, minX: 830, maxX: 1110, speed: 155 },
        { x: 1890, y: GROUND_Y, minX: 1760, maxX: 2040, speed: 162 },
        { x: 2940, y: GROUND_Y, minX: 2830, maxX: 3080, speed: 168 }
      ],
      abubillas: [
        { x: 890, baseY: 224, minX: 650, maxX: 1180, vx: 166, amplitude: 26, diveSpeed: 305 },
        { x: 1460, baseY: 212, minX: 1160, maxX: 1760, vx: -172, amplitude: 28, diveSpeed: 312 },
        { x: 2480, baseY: 215, minX: 2100, maxX: 2860, vx: 175, amplitude: 28, diveSpeed: 318 },
        { x: 3100, baseY: 210, minX: 2850, maxX: 3360, vx: -178, amplitude: 28, diveSpeed: 322 }
      ]
    },

    {
      id: 3,
      name: '3. Timanfaya y Volcanes',
      nextDestination: 'Pico del Teide',
      subtitle: 'Pozos de lava · Vigas verticales rápidas · Diagonales sincronizadas',
      theme: 'canarias_timanfaya',
      width: 4120,
      timeLimit: 120,
      hasLavaPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 3580,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 380, h: 100, style: 'basalt' },
        { x: 850, y: GROUND_Y, w: 370, h: 100, style: 'basalt' },
        { x: 1840, y: GROUND_Y, w: 380, h: 100, style: 'basalt' },
        { x: 2960, y: GROUND_Y, w: 300, h: 100, style: 'basalt' },
        { x: 3450, y: GROUND_Y, w: 670, h: 100, style: 'basalt' },

        // Solo 2 estáticas basálticas aisladas
        { x: 1000, y: 364, w: 76, h: 16, oneWay: true, style: 'basalt' },
        { x: 2420, y: 368, w: 76, h: 16, oneWay: true, style: 'basalt' }
      ],
      movingPlatforms: [
        // Diagonal #1 (sube hacia la derecha)
        { sx: 575, sy: 412, w: 80, h: 16, mode: 'oscillate', angleDeg: -32, dist: 145, phase: 0, speed: 132, style: 'basalt' },
        // Viga vertical rápida #1 rozando lava
        { sx: 1290, sy: 122, w: 70, h: 16, mode: 'oscillate', angleDeg: 90, dist: 320, phase: 0.3, speed: 170, style: 'basalt' },
        // Diagonal #2 en sentido contrario (phase Math.PI, baja hacia la derecha)
        { sx: 1560, sy: 340, w: 80, h: 16, mode: 'oscillate', angleDeg: 26, dist: 140, phase: Math.PI, speed: 136, style: 'basalt' },
        // Viga vertical rápida #2 rozando lava
        { sx: 2565, sy: 118, w: 70, h: 16, mode: 'oscillate', angleDeg: 90, dist: 326, phase: Math.PI, speed: 175, style: 'basalt' },
        // Diagonal #3 final hacia el último tramo basáltico
        { sx: 2700, sy: 405, w: 78, h: 16, mode: 'oscillate', angleDeg: -30, dist: 125, phase: 0.5, speed: 138, style: 'basalt' }
      ],
      fallingPlatforms: [
        { x: 445, y: 404, w: 68, h: 16, style: 'basalt', fallDelay: 0.6 },
        { x: 1430, y: 390, w: 68, h: 16, style: 'basalt', fallDelay: 0.6 },
        { x: 2285, y: 402, w: 68, h: 16, style: 'basalt', fallDelay: 0.6 },
        { x: 3315, y: 402, w: 68, h: 16, style: 'basalt', fallDelay: 0.6 }
      ],
      geysers: [
        { x: 335, y: GROUND_Y, period: 3.1, eruptDuration: 1.1, phase: 0.2, height: 148 },
        { x: 1020, y: GROUND_Y, period: 2.9, eruptDuration: 1.15, phase: 1.4, height: 154 },
        { x: 1170, y: GROUND_Y, period: 3.0, eruptDuration: 1.15, phase: 0.6, height: 150 },
        { x: 2015, y: GROUND_Y, period: 2.8, eruptDuration: 1.1, phase: 1.8, height: 156 },
        { x: 2165, y: GROUND_Y, period: 3.1, eruptDuration: 1.2, phase: 0.9, height: 154 },
        { x: 3110, y: GROUND_Y, period: 2.7, eruptDuration: 1.15, phase: 2.1, height: 158 }
      ],
      collectibles: [
        { type: 'coin', x: 468, y: 364 },
        { type: 'coin', x: 675, y: 318 },
        { type: 'coin', x: 1315, y: 185 },
        { type: 'coin', x: 1455, y: 350 },
        { x: 1903, y: 417, type: 'burger' },
        { type: 'coin', x: 2590, y: 185 },
        { type: 'coin', x: 3060, y: 418 },
        { type: 'coin', x: 3500, y: 418 }
      ],
      questionBlocks: [
        { x: 2442, y: 246, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      pigeons: [
        { x: 1920, y: GROUND_Y, minX: 1850, maxX: 2205, speed: 132, reactive: true }
      ],
      scooters: [],
      seagulls: [],
      hedgehogs: [],
      blindCrabs: [
        { x: 960, y: GROUND_Y, minX: 860, maxX: 1210, speed: 112 },
        { x: 1980, y: GROUND_Y, minX: 1850, maxX: 2210, speed: 120 },
        { x: 3080, y: GROUND_Y, minX: 2970, maxX: 3250, speed: 124 }
      ],
      gallotias: [
        { x: 910, y: GROUND_Y, minX: 865, maxX: 1210, speed: 162 },
        { x: 1900, y: GROUND_Y, minX: 1855, maxX: 2210, speed: 166 },
        { x: 3000, y: GROUND_Y, minX: 2965, maxX: 3250, speed: 170 }
      ],
      abubillas: [
        { x: 720, baseY: 222, minX: 520, maxX: 940, vx: 174, amplitude: 26, diveSpeed: 314 },
        { x: 1690, baseY: 210, minX: 1460, maxX: 1940, vx: -178, amplitude: 28, diveSpeed: 320 },
        { x: 2810, baseY: 208, minX: 2580, maxX: 3070, vx: 182, amplitude: 28, diveSpeed: 326 }
      ]
    },

    {
      id: 4,
      name: '4. Pico del Teide (Clímax Final)',
      nextDestination: 'Cumbre del Teide · América del Sur',
      subtitle: 'Dificultad extrema · Diagonales oblicuas · ¡Enjambre de Abubillas!',
      theme: 'canarias_teide',
      width: 4040,
      timeLimit: 120,
      hasLavaPits: true,
      isCanariasSwarm: true,
      swarmTriggerX: 2980,
      spawn: { x: 80, y: 390 },
      flagX: 3740,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 320, h: 100, style: 'basalt' },
        { x: 920, y: GROUND_Y, w: 320, h: 100, style: 'basalt' },
        { x: 1850, y: GROUND_Y, w: 320, h: 100, style: 'basalt' },
        { x: 2910, y: GROUND_Y, w: 330, h: 100, style: 'basalt' },
        { x: 3570, y: GROUND_Y, w: 470, h: 100, style: 'basalt' },

        // Solo 2 cornisas estáticas muy alejadas entre sí
        { x: 785, y: 362, w: 74, h: 16, oneWay: true, style: 'basalt' },
        { x: 2500, y: 358, w: 74, h: 16, oneWay: true, style: 'basalt' }
      ],
      movingPlatforms: [
        // Diagonal #1 (sube hacia la derecha / baja hacia la izquierda)
        { sx: 515, sy: 412, w: 78, h: 16, mode: 'oscillate', angleDeg: -34, dist: 155, phase: 0, speed: 138, style: 'basalt' },
        // Viga vertical rápida #1 rozando lava
        { sx: 1305, sy: 115, w: 68, h: 16, mode: 'oscillate', angleDeg: 90, dist: 329, phase: 0, speed: 178, style: 'basalt' },
        // Diagonal #2 (sentido contrario, phase Math.PI, baja hacia la derecha)
        { sx: 1435, sy: 318, w: 78, h: 16, mode: 'oscillate', angleDeg: 28, dist: 150, phase: Math.PI, speed: 142, style: 'basalt' },
        // Diagonal #3 (sube hacia la derecha)
        { sx: 2235, sy: 405, w: 78, h: 16, mode: 'oscillate', angleDeg: -30, dist: 145, phase: 0.4, speed: 144, style: 'basalt' },
        // Viga vertical rápida #2 rozando lava
        { sx: 2645, sy: 112, w: 68, h: 16, mode: 'oscillate', angleDeg: 90, dist: 333, phase: 1.9, speed: 182, style: 'basalt' },
        // Cornisa basáltica elevada de desvío para Huesito Dorado
        { sx: 2745, sy: 170, w: 68, h: 16, mode: 'oscillate', angleDeg: 0, dist: 48, phase: 0.3, speed: 84, style: 'basalt' },
        // Diagonal #4 bajo el enjambre final de Abubillas
        { sx: 3300, sy: 398, w: 78, h: 16, mode: 'oscillate', angleDeg: -26, dist: 140, phase: Math.PI, speed: 146, style: 'basalt' }
      ],
      fallingPlatforms: [
        { x: 385, y: 404, w: 66, h: 16, style: 'basalt', fallDelay: 0.6 },
        { x: 1715, y: 392, w: 66, h: 16, style: 'basalt', fallDelay: 0.6 },
        { x: 2775, y: 398, w: 66, h: 16, style: 'basalt', fallDelay: 0.6 }
      ],
      geysers: [
        { x: 260, y: GROUND_Y, period: 2.9, eruptDuration: 1.1, phase: 0.3, height: 148 },
        { x: 1080, y: GROUND_Y, period: 2.7, eruptDuration: 1.15, phase: 1.5, height: 156 },
        { x: 2005, y: GROUND_Y, period: 2.7, eruptDuration: 1.15, phase: 0.8, height: 158 },
        { x: 3070, y: GROUND_Y, period: 2.6, eruptDuration: 1.2, phase: 1.2, height: 160 }
      ],
      collectibles: [
        { type: 'coin', x: 408, y: 364 },
        { type: 'coin', x: 615, y: 306 },
        { type: 'coin', x: 1015, y: 418 },
        { type: 'coin', x: 1330, y: 185 },
        { type: 'coin', x: 1525, y: 318 },
        { type: 'coin', x: 1738, y: 352 },
        { x: 1901, y: 417, type: 'burger' },
        { type: 'coin', x: 2335, y: 318 },
        { type: 'coin', x: 2670, y: 185 },
        { type: 'coin', x: 3405, y: 325 },
        { type: 'coin', x: 3620, y: 418 }
      ],
      questionBlocks: [
        { x: 2521, y: 236, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pigeons: [
        { x: 1010, y: GROUND_Y, minX: 930, maxX: 1225, speed: 138, reactive: true }
      ],
      scooters: [],
      seagulls: [],
      hedgehogs: [],
      blindCrabs: [
        { x: 1040, y: GROUND_Y, minX: 930, maxX: 1230, speed: 122 },
        { x: 1960, y: GROUND_Y, minX: 1860, maxX: 2160, speed: 128 }
      ],
      gallotias: [
        { x: 980, y: GROUND_Y, minX: 935, maxX: 1230, speed: 172 },
        { x: 1920, y: GROUND_Y, minX: 1860, maxX: 2160, speed: 178 },
        { x: 2980, y: GROUND_Y, minX: 2920, maxX: 3230, speed: 184 }
      ],
      abubillas: [
        { x: 760, baseY: 215, minX: 510, maxX: 1020, vx: 180, amplitude: 28, diveSpeed: 328 },
        { x: 1640, baseY: 204, minX: 1400, maxX: 1920, vx: -184, amplitude: 28, diveSpeed: 332 },
        { x: 2480, baseY: 205, minX: 2200, maxX: 2860, vx: 186, amplitude: 30, diveSpeed: 336 },
        { x: 3420, baseY: 208, minX: 3180, maxX: 3660, vx: -188, amplitude: 30, diveSpeed: 340 }
      ]
    }
  ];

  // ==========================================================================
  // SUDAMÉRICA - MUNDO 1: BUENOS AIRES, ARGENTINA (4 Zonas Urbanas)
  // ==========================================================================
  const BUENOS_AIRES_LEVELS = [
    // ZONA 1: CAMINITO (LA BOCA) - Longitud doble, pozos más anchos, 2 niveles elevados y saltos encadenados
    {
      id: 1,
      name: '1. Caminito (La Boca)',
      nextDestination: 'Avenida Corrientes',
      subtitle: 'Conventillos en dos niveles · Saltos encadenados y sogas sobre el callejón',
      aiTier: 1,
      theme: 'ba_caminito',
      musicTheme: 'ba_tango',
      width: 6840,
      timeLimit: 120,
      hasDeadlyPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 6560,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 540, h: 100, style: 'cobble' },
        { x: 760, y: GROUND_Y, w: 600, h: 100, style: 'cobble' },
        { x: 1505, y: GROUND_Y, w: 555, h: 100, style: 'cobble' },
        // Tramo rítmico 1: dos saltos seguidos sin frenar sobre techos suspendidos (2060..2875)
        { x: 2185, y: 402, w: 105, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#ef4444' },
        { x: 2415, y: 364, w: 105, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#facc15' },
        { x: 2645, y: 402, w: 105, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#38bdf8' },
        { x: 2875, y: GROUND_Y, w: 745, h: 100, style: 'cobble' },
        { x: 3890, y: GROUND_Y, w: 630, h: 100, style: 'cobble' },
        { x: 4665, y: GROUND_Y, w: 535, h: 100, style: 'cobble' },
        // Tramo rítmico 2: secuencia encadenada en altura antes de la plaza final (5200..6015)
        { x: 5325, y: 396, w: 105, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#ec4899' },
        { x: 5555, y: 352, w: 105, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#16a34a' },
        { x: 5785, y: 394, w: 105, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#f97316' },
        { x: 6015, y: GROUND_Y, w: 825, h: 100, style: 'cobble' },

        // Escalonados y techos de chapa en DOS NIVELES + apoyos bajo las sogas
        { x: 250, y: 372, w: 150, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#ef4444' },
        { x: 420, y: 304, w: 140, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#facc15' },
        { x: 610, y: 404, w: 95, h: 16, oneWay: true, style: 'tin_roof', roofColor: '#38bdf8' },
        { x: 900, y: 372, w: 160, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#16a34a' },
        { x: 1090, y: 304, w: 155, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#ec4899' },
        { x: 1660, y: 368, w: 160, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#0284c7' },
        { x: 1850, y: 298, w: 155, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#facc15' },
        { x: 3040, y: 372, w: 165, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#16a34a' },
        { x: 3240, y: 300, w: 165, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#ec4899' },
        { x: 3440, y: 366, w: 145, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#f97316' },
        { x: 3705, y: 404, w: 98, h: 16, oneWay: true, style: 'tin_roof', roofColor: '#ef4444' },
        { x: 4050, y: 368, w: 165, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#0284c7' },
        { x: 4250, y: 298, w: 155, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#facc15' },
        { x: 4810, y: 368, w: 155, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#ef4444' },
        { x: 4990, y: 300, w: 145, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#38bdf8' },
        { x: 6160, y: 366, w: 170, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#ec4899' },
        { x: 6360, y: 296, w: 140, h: 18, oneWay: true, style: 'tin_roof', roofColor: '#facc15' }
      ],
      ropes: [
        { x1: 545, x2: 785, y: 280, sag: 14 },
        { x1: 3625, x2: 3875, y: 278, sag: 15 }
      ],
      movingPlatforms: [],
      collectibles: [
        { type: 'coin', x: 315, y: 330 },
        { type: 'coin', x: 645, y: 362 },
        { type: 'coin', x: 965, y: 330 },
        { type: 'coin', x: 1915, y: 256 },
        { type: 'coin', x: 2225, y: 360 },
        { type: 'coin', x: 2685, y: 360 },
        { x: 3528, y: 323, type: 'empanada' },
        { type: 'coin', x: 3745, y: 362 },
        { type: 'coin', x: 5045, y: 258 },
        { type: 'coin', x: 5365, y: 354 },
        { type: 'coin', x: 5825, y: 352 }
      ],
      questionBlocks: [
        { x: 2435, y: 242, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 4910, y: 246, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [
        { x: 1080, y: GROUND_Y },
        { x: 2990, y: GROUND_Y },
        { x: 4120, y: GROUND_Y },
        { x: 5060, y: GROUND_Y },
        { x: 6240, y: GROUND_Y }
      ],
      fatPigeons: [
        { x: 350, y: GROUND_Y, minX: 190, maxX: 520, speed: 50 },
        { x: 1230, y: GROUND_Y, minX: 780, maxX: 1340, speed: 52 },
        { x: 3360, y: GROUND_Y, minX: 2900, maxX: 3580, speed: 54 },
        { x: 4860, y: GROUND_Y, minX: 4680, maxX: 5180, speed: 56 },
        { x: 6320, y: GROUND_Y, minX: 6040, maxX: 6490, speed: 58 }
      ],
      canillitas: [
        { x: 1840, y: GROUND_Y, minX: 1580, maxX: 2020, speed: 44 },
        { x: 3315, y: 300, minX: 3255, maxX: 3390, speed: 36 },
        { x: 4350, y: GROUND_Y, minX: 3940, maxX: 4480, speed: 46 },
        { x: 6250, y: 366, minX: 6175, maxX: 6315, speed: 38 }
      ],
      horneroNests: [
        { x: 960, y: 170, aggroRange: 360, cooldown: 3.2, speed: 345 },
        { x: 2680, y: 168, aggroRange: 375, cooldown: 3.1, speed: 355 },
        { x: 4260, y: 164, aggroRange: 380, cooldown: 3.0, speed: 365 },
        { x: 6080, y: 162, aggroRange: 390, cooldown: 2.9, speed: 375 }
      ],
      motochorros: [],
      barrabravas: []
    },

    // ZONA 2: AVENIDA CORRIENTES - Longitud doble, ascensores móviles horizontales/verticales y pasarelas estrechas
    {
      id: 2,
      name: '2. Avenida Corrientes',
      nextDestination: 'Puerto Madero',
      subtitle: 'Plataformas móviles y pasarelas estrechas de neón · Ritmo rápido nocturno',
      aiTier: 2,
      theme: 'ba_corrientes',
      musicTheme: 'ba_rock',
      width: 7120,
      timeLimit: 120,
      hasDeadlyPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 6820,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 680, h: 100, style: 'cobble' },
        { x: 815, y: GROUND_Y, w: 660, h: 100, style: 'cobble' },
        { x: 1915, y: GROUND_Y, w: 665, h: 100, style: 'cobble' },
        // Pasarelas estrechas sobre fosos de obra en Corrientes (2580..3360)
        { x: 2705, y: 394, w: 90, h: 16, oneWay: true, style: 'marquee', marqueeText: 'CINE' },
        { x: 2925, y: 366, w: 90, h: 16, oneWay: true, style: 'marquee', marqueeText: 'JAZZ' },
        { x: 3140, y: 394, w: 90, h: 16, oneWay: true, style: 'marquee', marqueeText: 'ROCK' },
        { x: 3360, y: GROUND_Y, w: 850, h: 100, style: 'cobble' },
        // Pasarela estrecha en altura tras elevador vertical (4455)
        { x: 4455, y: 348, w: 92, h: 16, oneWay: true, style: 'marquee', marqueeText: 'OPERA' },
        { x: 4435, y: 256, w: 130, h: 16, oneWay: true, style: 'marquee', marqueeText: 'ASTRO' },
        { x: 4885, y: GROUND_Y, w: 705, h: 100, style: 'cobble' },
        // Tramo rápido final de pasarelas estrechas antes del Obelisco (5590..6145)
        { x: 5715, y: 388, w: 88, h: 16, oneWay: true, style: 'marquee', marqueeText: 'TANGO' },
        { x: 5930, y: 388, w: 88, h: 16, oneWay: true, style: 'marquee', marqueeText: 'PIZZA' },
        { x: 6145, y: GROUND_Y, w: 975, h: 100, style: 'cobble' },

        // Marquesinas luminosas clásicas y paso estrecho sobre primer foso
        { x: 450, y: 310, w: 210, h: 18, oneWay: true, style: 'marquee', marqueeText: 'TEATRO' },
        { x: 695, y: 372, w: 105, h: 16, oneWay: true, style: 'marquee', marqueeText: 'CINE' },
        { x: 1135, y: 296, w: 220, h: 18, oneWay: true, style: 'marquee', marqueeText: 'REVISTA' },
        { x: 1775, y: 388, w: 90, h: 16, oneWay: true, style: 'marquee', marqueeText: 'NEON' },
        { x: 2160, y: 296, w: 220, h: 18, oneWay: true, style: 'marquee', marqueeText: 'GRAN REX' },
        { x: 3580, y: 304, w: 215, h: 18, oneWay: true, style: 'marquee', marqueeText: 'BROADWAY' },
        { x: 5110, y: 294, w: 220, h: 18, oneWay: true, style: 'marquee', marqueeText: 'MAIPO' },
        { x: 5365, y: 216, w: 92, h: 16, oneWay: true, style: 'marquee', marqueeText: 'VIP' },
        { x: 5475, y: 90, w: 86, h: 16, oneWay: true, style: 'marquee', marqueeText: 'CÚPULA' },
        { x: 6380, y: 302, w: 220, h: 18, oneWay: true, style: 'marquee', marqueeText: 'OBELISCO' }
      ],
      subwayVents: [
        { x: 370, y: GROUND_Y, w: 54, height: 215, period: 0, phase: 0 },
        { x: 1050, y: GROUND_Y, w: 54, height: 220, period: 0, phase: 0 },
        { x: 2070, y: GROUND_Y, w: 54, height: 220, period: 0, phase: 0 },
        { x: 3495, y: GROUND_Y, w: 54, height: 215, period: 0, phase: 0 },
        { x: 5020, y: GROUND_Y, w: 54, height: 220, period: 0, phase: 0 },
        { x: 6295, y: GROUND_Y, w: 54, height: 215, period: 0, phase: 0 }
      ],
      movingPlatforms: [
        // Plataforma móvil horizontal sobre calle abierta
        { sx: 1510, sy: 388, w: 92, h: 18, mode: 'oscillate', angleDeg: 0, dist: 165, phase: 0, speed: 108, style: 'industrial_crane' },
        // Plataforma móvil vertical (ascensor de marquesina) + enlace horizontal en altura
        { sx: 4245, sy: 420, w: 94, h: 18, mode: 'oscillate', angleDeg: -90, dist: 115, phase: 0.4, speed: 98, style: 'industrial_crane' },
        { sx: 4595, sy: 348, w: 94, h: 18, mode: 'oscillate', angleDeg: 0, dist: 155, phase: 1.0, speed: 116, style: 'industrial_crane' }
      ],
      collectibles: [
        { type: 'coin', x: 540, y: 268 },
        { type: 'coin', x: 1235, y: 254 },
        { type: 'coin', x: 1805, y: 346 },
        { type: 'coin', x: 2740, y: 352 },
        { type: 'coin', x: 3175, y: 352 },
        { x: 3674, y: 261, type: 'pizza' },
        { type: 'coin', x: 5205, y: 252 },
        { x: 5414, y: 173, type: 'plant' },
        { type: 'golden_bone', x: 5505, y: 50 },
        { type: 'coin', x: 5965, y: 346 },
        { type: 'coin', x: 6480, y: 260 }
      ],
      questionBlocks: [
        { x: 2734, y: 272, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      motochorros: [
        { x: 580, y: GROUND_Y, minX: 250, maxX: 665, speed: 280 },
        { x: 1340, y: GROUND_Y, minX: 830, maxX: 1460, speed: 295 },
        { x: 2420, y: GROUND_Y, minX: 1940, maxX: 2560, speed: 305 },
        { x: 4020, y: GROUND_Y, minX: 3380, maxX: 4180, speed: 315 },
        { x: 5460, y: GROUND_Y, minX: 4905, maxX: 5570, speed: 320 },
        { x: 6640, y: GROUND_Y, minX: 6170, maxX: 6750, speed: 325 }
      ],
      barrabravas: [
        { x: 1210, y: 296, minX: 1145, maxX: 1345, speed: 50 },
        { x: 3780, y: GROUND_Y, minX: 3520, maxX: 4120, speed: 56 },
        { x: 5210, y: GROUND_Y, minX: 4950, maxX: 5480, speed: 58 },
        { x: 6460, y: GROUND_Y, minX: 6220, maxX: 6720, speed: 62 }
      ],
      trapitos: [
        { x: 530, y: 310 },
        { x: 2230, y: 296 },
        { x: 3650, y: 304 },
        { x: 5180, y: 294 },
        { x: 6450, y: 302 }
      ],
      canillitas: [
        { x: 930, y: GROUND_Y, minX: 845, maxX: 1020, speed: 46 },
        { x: 2250, y: 296, minX: 2175, maxX: 2365, speed: 40 },
        { x: 3920, y: GROUND_Y, minX: 3750, maxX: 4140, speed: 48 },
        { x: 6530, y: 302, minX: 6395, maxX: 6585, speed: 42 }
      ],
      fatPigeons: [
        { x: 1990, y: GROUND_Y, minX: 1925, maxX: 2160, speed: 52 },
        { x: 5000, y: GROUND_Y, minX: 4900, maxX: 5160, speed: 56 }
      ],
      horneroNests: [
        { x: 1180, y: 162, aggroRange: 365, cooldown: 3.0, speed: 360 },
        { x: 2890, y: 166, aggroRange: 380, cooldown: 2.9, speed: 370 },
        { x: 4520, y: 154, aggroRange: 390, cooldown: 2.8, speed: 380 },
        { x: 6200, y: 160, aggroRange: 400, cooldown: 2.7, speed: 390 }
      ]
    },

    // ZONA 3: PUERTO MADERO - Plataformas que caen, aterrizajes vigilados y ruta alta vs ruta baja
    {
      id: 3,
      name: '3. Puerto Madero',
      nextDestination: 'Tren Mitre a Retiro',
      subtitle: 'Tablas que caen al pisarlas · Ruta aérea con premio o muelle de trampas',
      aiTier: 3,
      theme: 'ba_madero',
      musicTheme: 'ba_electropop',
      width: 7360,
      timeLimit: 120,
      hasWaterPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 7060,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 460, h: 100, style: 'promenade' },
        { x: 1090, y: GROUND_Y, w: 440, h: 100, style: 'promenade' },
        // Bifurcación 1: Ruta alta con premios (1770, 2280) vs Ruta baja con trampas (2110..2560)
        { x: 1770, y: 254, w: 165, h: 18, oneWay: true, style: 'industrial_crane' },
        { x: 2280, y: 278, w: 170, h: 18, oneWay: true, style: 'industrial_crane' },
        { x: 2110, y: GROUND_Y, w: 690, h: 100, style: 'promenade' },
        { x: 3550, y: GROUND_Y, w: 490, h: 100, style: 'promenade' },
        // Bifurcación 2: Vigas altas de grúa (4215, 4820) vs Muelle bajo emboscado (4660..5140)
        { x: 4215, y: 262, w: 180, h: 18, oneWay: true, style: 'industrial_crane' },
        { x: 4820, y: 268, w: 185, h: 18, oneWay: true, style: 'industrial_crane' },
        { x: 4660, y: GROUND_Y, w: 480, h: 100, style: 'promenade' },
        { x: 5480, y: GROUND_Y, w: 440, h: 100, style: 'promenade' },
        { x: 6590, y: GROUND_Y, w: 770, h: 100, style: 'promenade' }
      ],
      fallingPlatforms: [
        // Tablas y pasarelas que se desploman al pisarlas sobre el agua del dique
        { x: 1945, y: 404, w: 86, h: 18, style: 'wood', fallDelay: 0.72 },
        { x: 2055, y: 272, w: 90, h: 18, style: 'wood', fallDelay: 0.72 },
        { x: 2910, y: 406, w: 84, h: 18, style: 'wood', fallDelay: 0.70 },
        { x: 3110, y: 388, w: 84, h: 18, style: 'wood', fallDelay: 0.70 },
        { x: 4470, y: 406, w: 84, h: 18, style: 'wood', fallDelay: 0.68 },
        { x: 5120, y: 292, w: 92, h: 18, style: 'wood', fallDelay: 0.70 },
        { x: 6030, y: 406, w: 84, h: 18, style: 'wood', fallDelay: 0.68 },
        { x: 6410, y: 388, w: 84, h: 18, style: 'wood', fallDelay: 0.68 }
      ],
      sinkingContainers: [
        { x: 520, y: 406, w: 94, h: 24, maxSink: 96, sinkSpeed: 34, color: '#dc2626' },
        { x: 690, y: 382, w: 94, h: 24, maxSink: 96, sinkSpeed: 36, color: '#0284c7' },
        { x: 1590, y: 398, w: 92, h: 24, maxSink: 96, sinkSpeed: 36, color: '#ea580c' },
        { x: 1765, y: 388, w: 92, h: 24, maxSink: 96, sinkSpeed: 38, color: '#0d9488' },
        { x: 4110, y: 400, w: 92, h: 24, maxSink: 96, sinkSpeed: 38, color: '#dc2626' },
        { x: 4290, y: 390, w: 92, h: 24, maxSink: 96, sinkSpeed: 38, color: '#0284c7' },
        { x: 6220, y: 396, w: 94, h: 24, maxSink: 96, sinkSpeed: 40, color: '#ea580c' }
      ],
      movingPlatforms: [
        { sx: 915, sy: 348, w: 96, h: 18, mode: 'oscillate', angleDeg: 0, dist: 90, phase: 0, speed: 106, style: 'industrial_crane' },
        { sx: 1510, sy: 338, w: 92, h: 18, mode: 'oscillate', angleDeg: -22, dist: 110, phase: 0.5, speed: 114, style: 'industrial_crane' },
        { sx: 3295, sy: 358, w: 96, h: 18, mode: 'oscillate', angleDeg: -12, dist: 120, phase: 1.0, speed: 116, style: 'industrial_crane' },
        { sx: 4025, sy: 366, w: 90, h: 18, mode: 'oscillate', angleDeg: -90, dist: 105, phase: 0.2, speed: 104, style: 'industrial_crane' },
        { sx: 4490, sy: 266, w: 94, h: 18, mode: 'oscillate', angleDeg: 0, dist: 165, phase: 0.8, speed: 120, style: 'industrial_crane' },
        { sx: 5215, sy: 348, w: 98, h: 18, mode: 'oscillate', angleDeg: 0, dist: 140, phase: Math.PI * 0.5, speed: 120, style: 'industrial_crane' }
      ],
      collectibles: [
        { type: 'coin', x: 560, y: 366 },
        { type: 'coin', x: 950, y: 308 },
        { type: 'coin', x: 1885, y: 212 },
        { type: 'coin', x: 3140, y: 348 },
        { x: 3831, y: 417, type: 'pizza' },
        { type: 'coin', x: 4895, y: 226 },
        { type: 'coin', x: 6255, y: 356 }
      ],
      questionBlocks: [
        { x: 2425, y: 336, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5570, y: 336, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      barrabravas: [
        { x: 1190, y: GROUND_Y, minX: 1105, maxX: 1495, speed: 58 },
        { x: 2330, y: GROUND_Y, minX: 2130, maxX: 2740, speed: 62 },
        { x: 3680, y: GROUND_Y, minX: 3570, maxX: 4000, speed: 64 },
        { x: 4840, y: GROUND_Y, minX: 4680, maxX: 5110, speed: 66 },
        { x: 6740, y: GROUND_Y, minX: 6610, maxX: 6990, speed: 68 }
      ],
      canillitas: [
        { x: 1400, y: GROUND_Y, minX: 1290, maxX: 1500, speed: 44 },
        { x: 2490, y: GROUND_Y, minX: 2360, maxX: 2740, speed: 46 },
        { x: 3900, y: GROUND_Y, minX: 3720, maxX: 4010, speed: 48 },
        { x: 5000, y: GROUND_Y, minX: 4840, maxX: 5115, speed: 48 }
      ],
      motochorros: [
        { x: 340, y: GROUND_Y, minX: 160, maxX: 445, speed: 280 },
        { x: 2440, y: GROUND_Y, minX: 2130, maxX: 2750, speed: 305 },
        { x: 3820, y: GROUND_Y, minX: 3575, maxX: 4015, speed: 315 },
        { x: 5760, y: GROUND_Y, minX: 5500, maxX: 5895, speed: 320 }
      ],
      trapitos: [
        { x: 1135, y: GROUND_Y },
        { x: 2610, y: GROUND_Y },
        { x: 3600, y: GROUND_Y },
        { x: 4725, y: GROUND_Y },
        { x: 5545, y: GROUND_Y },
        { x: 6660, y: GROUND_Y }
      ],
      fatPigeons: [
        { x: 270, y: GROUND_Y, minX: 140, maxX: 430, speed: 52 },
        { x: 5690, y: GROUND_Y, minX: 5510, maxX: 5890, speed: 56 }
      ],
      horneroNests: [
        { x: 1210, y: 170, aggroRange: 380, cooldown: 2.9, speed: 375 },
        { x: 2560, y: 166, aggroRange: 390, cooldown: 2.8, speed: 385 },
        { x: 4340, y: 152, aggroRange: 400, cooldown: 2.7, speed: 395 },
        { x: 5720, y: 164, aggroRange: 405, cooldown: 2.7, speed: 400 }
      ]
    },

    // ZONA 4: TREN MITRE A RETIRO - Longitud doble, secuencias móviles encadenadas, formación horneros y pareja élite
    {
      id: 4,
      name: '4. Tren Mitre a Retiro',
      nextDestination: 'Estación Retiro · Rosario',
      subtitle: 'Auto-scrolling largo · Pasarelas móviles, emboscadas en pareja y bandada [X] en Retiro',
      aiTier: 4,
      theme: 'ba_tren_mitre',
      musicTheme: 'ba_cumbia',
      width: 8640,
      timeLimit: 120,
      autoScrollSpeed: 120,
      constantWindX: -24,
      hasDeadlyPits: true,
      swarmTriggerX: 7600,
      isHorneroSwarm: true,
      spawn: { x: 110, y: 390 },
      flagX: 8320,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 700, h: 100, style: 'train_roof' },
        { x: 800, y: GROUND_Y, w: 660, h: 100, style: 'train_roof' },
        { x: 1565, y: GROUND_Y, w: 655, h: 100, style: 'train_roof' },
        { x: 2325, y: GROUND_Y, w: 655, h: 100, style: 'train_roof' },
        // Bogie intermedio entre pasarelas móviles 1 (3375..3545)
        { x: 3375, y: GROUND_Y, w: 170, h: 100, style: 'train_roof' },
        { x: 3825, y: GROUND_Y, w: 795, h: 100, style: 'train_roof' },
        { x: 4725, y: GROUND_Y, w: 795, h: 100, style: 'train_roof' },
        // Bogie intermedio entre pasarelas móviles 2 (5910..6090)
        { x: 5910, y: GROUND_Y, w: 180, h: 100, style: 'train_roof' },
        { x: 6405, y: GROUND_Y, w: 875, h: 100, style: 'train_roof' },
        // Andén largo de llegada en Estación Retiro
        { x: 7385, y: GROUND_Y, w: 1255, h: 100, style: 'promenade' },
        // Pórtico ferroviario elevado sobre el acople 4 (ruta secreta Huesito Dorado)
        { x: 2700, y: 380, w: 100, h: 16, oneWay: true, style: 'balcony' },
        { x: 2845, y: 300, w: 96, h: 16, oneWay: true, style: 'balcony' },
        { x: 2985, y: 220, w: 96, h: 16, oneWay: true, style: 'balcony' }
      ],
      movingPlatforms: [
        { sx: 3060, sy: 428, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 120, phase: 0, speed: 106, style: 'train_roof' },
        { sx: 3630, sy: 410, w: 100, h: 18, mode: 'oscillate', angleDeg: -18, dist: 90, phase: 0.9, speed: 96, style: 'train_roof' },
        { sx: 5605, sy: 422, w: 98, h: 18, mode: 'oscillate', angleDeg: 0, dist: 125, phase: 0.4, speed: 112, style: 'train_roof' },
        { sx: 6175, sy: 408, w: 98, h: 18, mode: 'oscillate', angleDeg: 0, dist: 132, phase: 1.2, speed: 118, style: 'train_roof' }
      ],
      overheadHazards: [
        { x: 430, y: 386, w: 58, h: 38, kind: 'signal' },
        { x: 1045, y: 384, w: 96, h: 40, kind: 'sign', label: 'TIGRE · RETIRO' },
        { x: 1835, y: 386, w: 58, h: 38, kind: 'signal' },
        { x: 2565, y: 384, w: 96, h: 40, kind: 'sign', label: 'BELGRANO C' },
        { x: 4110, y: 384, w: 96, h: 40, kind: 'sign', label: 'BELGRANO R' },
        { x: 4980, y: 386, w: 58, h: 38, kind: 'signal' },
        { x: 5280, y: 386, w: 58, h: 38, kind: 'signal' },
        { x: 6640, y: 384, w: 96, h: 40, kind: 'sign', label: 'EXPRESS RETIRO' },
        { x: 6970, y: 386, w: 58, h: 38, kind: 'signal' }
      ],
      collectibles: [
        { type: 'coin', x: 605, y: 418 },
        { type: 'coin', x: 910, y: 418 },
        { type: 'coin', x: 2070, y: 418 },
        { x: 3002, y: 177, type: 'angel_wings' },
        { type: 'coin', x: 3445, y: 418 },
        { x: 4448, y: 417, type: 'empanada' },
        { type: 'coin', x: 5980, y: 418 },
        { type: 'coin', x: 8050, y: 418 }
      ],
      questionBlocks: [
        { x: 6495, y: 336, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      barrabravas: [
        { x: 1220, y: GROUND_Y, minX: 1140, maxX: 1420, speed: 54 },
        { x: 2770, y: GROUND_Y, minX: 2670, maxX: 2955, speed: 58 },
        { x: 4380, y: GROUND_Y, minX: 4230, maxX: 4590, speed: 64 },
        { x: 6810, y: GROUND_Y, minX: 6730, maxX: 7220, speed: 68 },
        { x: 7940, y: GROUND_Y, minX: 7780, maxX: 8180, speed: 70 }
      ],
      trapitos: [
        { x: 560, y: GROUND_Y },
        { x: 2050, y: GROUND_Y },
        { x: 4480, y: GROUND_Y },
        { x: 5985, y: GROUND_Y },
        { x: 7860, y: GROUND_Y }
      ],
      canillitas: [
        { x: 1365, y: GROUND_Y, minX: 1260, maxX: 1440, speed: 40 },
        { x: 2910, y: GROUND_Y, minX: 2790, maxX: 2965, speed: 42 },
        { x: 5400, y: GROUND_Y, minX: 5320, maxX: 5495, speed: 46 },
        { x: 7160, y: GROUND_Y, minX: 7020, maxX: 7255, speed: 48 }
      ],
      fatPigeons: [
        { x: 920, y: GROUND_Y, minX: 820, maxX: 1020, speed: 50 },
        { x: 1650, y: GROUND_Y, minX: 1580, maxX: 1800, speed: 52 },
        { x: 4840, y: GROUND_Y, minX: 4745, maxX: 4960, speed: 56 }
      ],
      horneroNests: [
        { x: 1470, y: 162, aggroRange: 380, cooldown: 2.9, speed: 385 },
        { x: 2920, y: 164, aggroRange: 390, cooldown: 2.8, speed: 395 },
        { x: 4620, y: 158, aggroRange: 400, cooldown: 2.7, speed: 405 },
        { x: 6460, y: 154, aggroRange: 410, cooldown: 2.5, speed: 415 },
        { x: 6820, y: 154, aggroRange: 410, cooldown: 2.5, speed: 420 }
      ],
      motochorros: []
    }
  ];

  // ==========================================================================
  // SUDAMÉRICA - MUNDO 2: ROSARIO, ARGENTINA (4 Zonas dobles + IA aún más agresiva)
  // ==========================================================================
  const ROSARIO_LEVELS = [
    // ZONA 1: MONUMENTO A LA BANDERA - Doble longitud, pozos anchos, 2 niveles en galerías y saltos encadenados
    {
      id: 1,
      name: '1. Monumento a la Bandera',
      nextDestination: 'La Florida',
      busLine: '103 - LA FLORIDA',
      subtitle: 'Propileo en dos niveles y dinteles encadenados · ¡Cuidado con las llamas votivas!',
      aiTier: 1,
      theme: 'ro_monumento',
      musicTheme: 'ro_trova',
      width: 7200,
      timeLimit: 120,
      hasDeadlyPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 6900,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 620, h: 100, style: 'promenade' },
        { x: 745, y: GROUND_Y, w: 435, h: 100, style: 'promenade' },
        // Escalinata ascendente del Propileo hacia la Torre (escalones alcanzables con salto normal)
        { x: 1180, y: 410, w: 120, h: 150, style: 'monument' },
        { x: 1300, y: 360, w: 120, h: 200, style: 'monument' },
        { x: 1420, y: 310, w: 120, h: 250, style: 'monument' },
        { x: 1540, y: 260, w: 120, h: 300, style: 'monument' },
        { x: 1660, y: 220, w: 115, h: 340, style: 'monument' },
        { x: 1775, y: 165, w: 185, h: 395, style: 'monument' },
        { x: 1960, y: 200, w: 120, h: 360, style: 'monument' },
        { x: 2080, y: 250, w: 120, h: 310, style: 'monument' },
        { x: 2200, y: 300, w: 120, h: 260, style: 'monument' },
        { x: 2320, y: 350, w: 120, h: 210, style: 'monument' },
        { x: 2440, y: 400, w: 120, h: 160, style: 'monument' },
        { x: 2560, y: GROUND_Y, w: 300, h: 100, style: 'promenade' },
        // Tramo encadenado 1 de dinteles sin frenar sobre foso ancho (2860..3704)
        { x: 2990, y: 404, w: 108, h: 18, oneWay: true, style: 'monument' },
        { x: 3228, y: 366, w: 108, h: 18, oneWay: true, style: 'monument' },
        { x: 3466, y: 404, w: 108, h: 18, oneWay: true, style: 'monument' },
        { x: 3704, y: GROUND_Y, w: 576, h: 100, style: 'promenade' },
        { x: 4428, y: GROUND_Y, w: 532, h: 100, style: 'promenade' },
        // Tramo encadenado 2 en dos alturas hasta el Patio final (4960..6035)
        { x: 5095, y: 400, w: 105, h: 18, oneWay: true, style: 'monument' },
        { x: 5330, y: 358, w: 105, h: 18, oneWay: true, style: 'monument' },
        { x: 5565, y: 324, w: 105, h: 18, oneWay: true, style: 'monument' },
        { x: 5800, y: 394, w: 105, h: 18, oneWay: true, style: 'monument' },
        { x: 6035, y: GROUND_Y, w: 1165, h: 100, style: 'promenade' },

        // Cornisas en dos niveles sobre las explanadas cívicas
        { x: 860, y: 300, w: 140, h: 16, oneWay: true, style: 'monument' },
        { x: 1030, y: 236, w: 135, h: 16, oneWay: true, style: 'monument' },
        { x: 3820, y: 368, w: 170, h: 16, oneWay: true, style: 'monument' },
        { x: 4015, y: 296, w: 165, h: 16, oneWay: true, style: 'monument' },
        { x: 6260, y: 310, w: 165, h: 16, oneWay: true, style: 'monument' }
      ],
      subwayVents: [
        { x: 836, y: GROUND_Y, w: 44, height: 90, period: 0, phase: 0, kind: 'flame' },
        { x: 1600, y: 260, w: 40, height: 70, period: 0, phase: 0, kind: 'flame' },
        { x: 3870, y: GROUND_Y, w: 44, height: 100, period: 0, phase: 0, kind: 'flame' },
        { x: 6220, y: GROUND_Y, w: 44, height: 95, period: 0, phase: 0, kind: 'flame' }
      ],
      movingPlatforms: [],
      collectibles: [
        { type: 'coin', x: 330, y: 418 },
        { type: 'coin', x: 910, y: 258 },
        { type: 'coin', x: 1800, y: 123 },
        { type: 'coin', x: 3035, y: 362 },
        { type: 'coin', x: 3272, y: 324 },
        { x: 3528, y: 361, type: 'empanada' },
        { type: 'coin', x: 6320, y: 268 },
        { type: 'coin', x: 6680, y: 418 }
      ],
      questionBlocks: [
        { x: 2650, y: 336, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5585, y: 202, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [
        { x: 1000, y: GROUND_Y },
        { x: 2720, y: GROUND_Y },
        { x: 3980, y: GROUND_Y },
        { x: 4720, y: GROUND_Y },
        { x: 6460, y: GROUND_Y }
      ],
      rockeros: [
        { x: 1840, y: 165, minX: 1790, maxX: 1945, speed: 32 },
        { x: 3900, y: 368, minX: 3830, maxX: 3975, speed: 30 },
        { x: 4120, y: GROUND_Y, minX: 3740, maxX: 4250, speed: 36 },
        { x: 4620, y: GROUND_Y, minX: 4460, maxX: 4920, speed: 38 },
        { x: 6680, y: GROUND_Y, minX: 6320, maxX: 6810, speed: 40 }
      ],
      horneroNests: [
        { x: 1030, y: 160, aggroRange: 360, cooldown: 3.1, speed: 355 },
        { x: 2620, y: 170, aggroRange: 370, cooldown: 3.0, speed: 365 },
        { x: 4180, y: 162, aggroRange: 380, cooldown: 2.9, speed: 375 },
        { x: 6180, y: 162, aggroRange: 395, cooldown: 2.8, speed: 385 }
      ]
    },

    // ZONA 2: LA FLORIDA Y PUENTE ROSARIO-VICTORIA - Doble longitud, muelles estrechos, móviles y palometas
    {
      id: 2,
      name: '2. La Florida y Puente Rosario-Victoria',
      nextDestination: 'Parque Independencia',
      busLine: '110 - PARQUE',
      subtitle: 'Kayaks, muelles estrechos y balsas móviles sobre el Paraná',
      aiTier: 2,
      theme: 'ro_florida',
      musicTheme: 'ro_cumbia',
      width: 7200,
      timeLimit: 120,
      hasWaterPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 6900,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 520, h: 100, style: 'sand' },
        { x: 1010, y: GROUND_Y, w: 450, h: 100, style: 'sand' },
        { x: 1950, y: GROUND_Y, w: 470, h: 100, style: 'sand' },
        // Pasarelas estrechas de muelle sobre el río (2830, 3035)
        { x: 2830, y: 390, w: 84, h: 18, oneWay: false, style: 'wood' },
        { x: 3035, y: 362, w: 84, h: 18, oneWay: false, style: 'wood' },
        { x: 3420, y: GROUND_Y, w: 600, h: 100, style: 'sand' },
        { x: 3465, y: 378, w: 84, h: 16, oneWay: true, style: 'wood' },
        { x: 3580, y: 298, w: 190, h: 16, oneWay: true, style: 'wood' },
        { x: 3810, y: 218, w: 94, h: 16, oneWay: true, style: 'wood' },
        // Muelle estrecho en tramo rápido 2 (4265) y antes de playa final (5930)
        { x: 4265, y: 398, w: 86, h: 18, oneWay: false, style: 'wood' },
        { x: 4950, y: GROUND_Y, w: 570, h: 100, style: 'sand' },
        { x: 5930, y: 392, w: 86, h: 18, oneWay: false, style: 'wood' },
        { x: 6560, y: GROUND_Y, w: 640, h: 100, style: 'sand' }
      ],
      sinkingContainers: [
        { x: 560, y: 416, w: 96, h: 20, maxSink: 34, sinkSpeed: 28, color: '#f97316', style: 'kayak' },
        { x: 722, y: 402, w: 90, h: 18, maxSink: 34, sinkSpeed: 28, color: '#f8fafc', style: 'sup' },
        { x: 884, y: 414, w: 96, h: 20, maxSink: 34, sinkSpeed: 28, color: '#facc15', style: 'kayak' },
        { x: 1500, y: 410, w: 90, h: 18, maxSink: 34, sinkSpeed: 30, color: '#f8fafc', style: 'sup' },
        { x: 1660, y: 398, w: 96, h: 20, maxSink: 34, sinkSpeed: 30, color: '#ef4444', style: 'kayak' },
        { x: 1820, y: 410, w: 90, h: 18, maxSink: 34, sinkSpeed: 30, color: '#f8fafc', style: 'sup' },
        { x: 4090, y: 412, w: 92, h: 20, maxSink: 34, sinkSpeed: 32, color: '#38bdf8', style: 'kayak' },
        { x: 4440, y: 408, w: 92, h: 18, maxSink: 34, sinkSpeed: 32, color: '#f8fafc', style: 'sup' },
        { x: 5595, y: 414, w: 94, h: 20, maxSink: 34, sinkSpeed: 34, color: '#f97316', style: 'kayak' },
        { x: 5760, y: 402, w: 90, h: 18, maxSink: 34, sinkSpeed: 34, color: '#f8fafc', style: 'sup' },
        { x: 6105, y: 412, w: 94, h: 20, maxSink: 34, sinkSpeed: 34, color: '#facc15', style: 'kayak' }
      ],
      movingPlatforms: [
        { sx: 2490, sy: 410, w: 96, h: 18, mode: 'oscillate', angleDeg: 0, dist: 165, phase: 0, speed: 112, style: 'wood' },
        { sx: 3230, sy: 422, w: 92, h: 18, mode: 'oscillate', angleDeg: -90, dist: 110, phase: 0.4, speed: 100, style: 'wood' },
        { sx: 4615, sy: 392, w: 94, h: 18, mode: 'oscillate', angleDeg: 0, dist: 155, phase: 0.9, speed: 122, style: 'wood' },
        { sx: 6280, sy: 404, w: 94, h: 18, mode: 'oscillate', angleDeg: 0, dist: 135, phase: 0.2, speed: 126, style: 'wood' }
      ],
      palometas: [
        { x: 689, waterY: 484, peakY: 334, wait: 1.05, phase: 0.0 },
        { x: 848, waterY: 484, peakY: 332, wait: 1.25, phase: 0.6 },
        { x: 1624, waterY: 484, peakY: 330, wait: 1.15, phase: 0.3 },
        { x: 1785, waterY: 484, peakY: 328, wait: 1.0, phase: 0.8 },
        { x: 2980, waterY: 484, peakY: 318, wait: 1.1, phase: 0.2 },
        { x: 4215, waterY: 484, peakY: 324, wait: 1.05, phase: 0.5 },
        { x: 4395, waterY: 484, peakY: 322, wait: 1.2, phase: 0.9 },
        { x: 5720, waterY: 484, peakY: 320, wait: 1.0, phase: 0.1 },
        { x: 6060, waterY: 484, peakY: 320, wait: 1.1, phase: 0.7 }
      ],
      collectibles: [
        { type: 'coin', x: 300, y: 418 },
        { type: 'coin', x: 596, y: 374 },
        { type: 'coin', x: 920, y: 372 },
        { type: 'coin', x: 1695, y: 356 },
        { type: 'coin', x: 2865, y: 348 },
        { type: 'coin', x: 3070, y: 320 },
        { x: 3700, y: 255, type: 'empanada' },
        { type: 'coin', x: 5965, y: 350 }
      ],
      questionBlocks: [
        { x: 2310, y: 336, w: 32, h: 32, item: 'angel_wings', style: 'question' },
        { x: 5355, y: 336, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      trapitos: [
        { x: 360, y: GROUND_Y },
        { x: 1295, y: GROUND_Y },
        { x: 3810, y: GROUND_Y },
        { x: 5340, y: GROUND_Y },
        { x: 6680, y: GROUND_Y }
      ],
      rockeros: [
        { x: 1140, y: GROUND_Y, minX: 1030, maxX: 1255, speed: 38 },
        {
          x: 1385,
          y: 320,
          minX: 1385,
          maxX: 1385,
          speed: 0,
          onPole: true,
          poleX: 1417,
          poleBaseY: GROUND_Y,
          poleTopY: 214
        },
        { x: 2150, y: GROUND_Y, minX: 1990, maxX: 2380, speed: 42 },
        { x: 3680, y: GROUND_Y, minX: 3460, maxX: 3960, speed: 44 },
        { x: 5180, y: GROUND_Y, minX: 4990, maxX: 5470, speed: 46 },
        { x: 6760, y: GROUND_Y, minX: 6610, maxX: 6850, speed: 46 }
      ],
      horneroNests: [
        { x: 420, y: 162, aggroRange: 370, cooldown: 3.0, speed: 365 },
        { x: 2040, y: 160, aggroRange: 385, cooldown: 2.9, speed: 375 },
        { x: 3740, y: 158, aggroRange: 395, cooldown: 2.8, speed: 385 },
        { x: 5260, y: 162, aggroRange: 405, cooldown: 2.7, speed: 395 }
      ]
    },

    // ZONA 3: PARQUE INDEPENDENCIA - Doble longitud, tablas que caen, aterrizajes vigilados y ruta alta vs baja
    {
      id: 3,
      name: '3. Parque Independencia',
      nextDestination: 'Arroyito',
      busLine: '102 - ARROYITO',
      subtitle: 'Botecitos a pedal y tablas que caen · Ruta alta de pérgolas o lago de trampas',
      aiTier: 3,
      theme: 'ro_parque',
      musicTheme: 'ro_funk',
      width: 7600,
      timeLimit: 120,
      hasWaterPits: true,
      spawn: { x: 80, y: 390 },
      flagX: 7300,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 460, h: 100, style: 'cobble' },
        { x: 1040, y: GROUND_Y, w: 540, h: 100, style: 'cobble' },
        { x: 2020, y: GROUND_Y, w: 240, h: 100, style: 'cobble' },
        { x: 2790, y: GROUND_Y, w: 530, h: 100, style: 'cobble' },
        // Bifurcación: Pérgolas altas de recompensa (3410, 4130) vs Isla baja de trampas (3820..4180)
        { x: 3140, y: 344, w: 135, h: 16, oneWay: true, style: 'wood' },
        { x: 3410, y: 268, w: 155, h: 16, oneWay: true, style: 'wood' },
        { x: 4130, y: 272, w: 170, h: 16, oneWay: true, style: 'wood' },
        { x: 3820, y: GROUND_Y, w: 360, h: 100, style: 'cobble' },
        { x: 4610, y: GROUND_Y, w: 610, h: 100, style: 'cobble' },
        { x: 5890, y: GROUND_Y, w: 350, h: 100, style: 'cobble' },
        { x: 6690, y: GROUND_Y, w: 910, h: 100, style: 'cobble' },
        // Pérgolas opcionales del Rosedal
        { x: 1180, y: 346, w: 135, h: 16, oneWay: true, style: 'wood' },
        { x: 4790, y: 348, w: 140, h: 16, oneWay: true, style: 'wood' },
        { x: 6840, y: 348, w: 140, h: 16, oneWay: true, style: 'wood' }
      ],
      fallingPlatforms: [
        { x: 1660, y: 416, w: 86, h: 18, style: 'wood', fallDelay: 0.72 },
        { x: 1845, y: 402, w: 86, h: 18, style: 'wood', fallDelay: 0.72 },
        { x: 2350, y: 410, w: 84, h: 18, style: 'wood', fallDelay: 0.70 },
        { x: 4265, y: 414, w: 84, h: 18, style: 'wood', fallDelay: 0.68 },
        { x: 4440, y: 414, w: 84, h: 18, style: 'wood', fallDelay: 0.68 },
        { x: 4430, y: 292, w: 90, h: 18, style: 'wood', fallDelay: 0.70 },
        { x: 6330, y: 412, w: 84, h: 18, style: 'wood', fallDelay: 0.68 },
        { x: 6510, y: 402, w: 84, h: 18, style: 'wood', fallDelay: 0.68 }
      ],
      movingPlatforms: [
        { sx: 480, sy: 420, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 120, phase: 0, speed: 98, style: 'pedal_boat' },
        { sx: 700, sy: 410, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 120, phase: Math.PI, speed: 102, style: 'pedal_boat' },
        { sx: 900, sy: 420, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 100, phase: 0.6, speed: 98, style: 'pedal_boat' },
        { sx: 2520, sy: 412, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 120, phase: 0.3, speed: 106, style: 'pedal_boat' },
        { sx: 3360, sy: 420, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 115, phase: 0.5, speed: 108, style: 'pedal_boat' },
        { sx: 3590, sy: 410, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 110, phase: Math.PI + 0.5, speed: 110, style: 'pedal_boat' },
        // Pasarela móvil alta conectando las pérgolas de la ruta superior
        { sx: 3710, sy: 266, w: 108, h: 16, mode: 'oscillate', angleDeg: 0, dist: 185, phase: 0.1, speed: 114, style: 'wood' },
        { sx: 5250, sy: 420, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 120, phase: 0.2, speed: 108, style: 'pedal_boat' },
        { sx: 5470, sy: 410, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 120, phase: Math.PI + 0.2, speed: 112, style: 'pedal_boat' },
        { sx: 5670, sy: 420, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 100, phase: 0.9, speed: 108, style: 'pedal_boat' }
      ],
      collectibles: [
        { type: 'coin', x: 300, y: 418 },
        { type: 'coin', x: 760, y: 362 },
        { type: 'coin', x: 1230, y: 304 },
        { type: 'coin', x: 1700, y: 374 },
        { x: 4168, y: 229, type: 'empanada' },
        { type: 'coin', x: 5305, y: 372 },
        { type: 'coin', x: 5525, y: 362 }
      ],
      questionBlocks: [
        { x: 3171, y: 222, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 6873, y: 226, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      penguins: [
        { x: 1420, y: GROUND_Y },
        { x: 2880, y: GROUND_Y },
        { x: 3860, y: GROUND_Y },
        { x: 4950, y: GROUND_Y },
        { x: 5950, y: GROUND_Y },
        { x: 6980, y: GROUND_Y }
      ],
      trapitos: [
        { x: 1085, y: GROUND_Y },
        { x: 3980, y: GROUND_Y },
        { x: 4680, y: GROUND_Y },
        { x: 6760, y: GROUND_Y }
      ],
      rockeros: [
        { x: 1250, y: GROUND_Y, minX: 1100, maxX: 1360, speed: 42 },
        { x: 2130, y: GROUND_Y, minX: 2040, maxX: 2225, speed: 44 },
        { x: 3160, y: GROUND_Y, minX: 2960, maxX: 3290, speed: 46 },
        { x: 4070, y: GROUND_Y, minX: 3920, maxX: 4150, speed: 46 },
        { x: 5080, y: GROUND_Y, minX: 4720, maxX: 5180, speed: 48 },
        { x: 6120, y: GROUND_Y, minX: 5990, maxX: 6210, speed: 46 },
        { x: 7080, y: GROUND_Y, minX: 6820, maxX: 7210, speed: 48 }
      ],
      horneroNests: [
        { x: 1470, y: 164, aggroRange: 390, cooldown: 2.8, speed: 385 },
        { x: 2980, y: 160, aggroRange: 400, cooldown: 2.7, speed: 395 },
        { x: 4540, y: 152, aggroRange: 410, cooldown: 2.6, speed: 405 },
        { x: 6220, y: 158, aggroRange: 415, cooldown: 2.5, speed: 415 }
      ]
    },

    // ZONA 4: ARROYITO (EL GIGANTE) - Doble longitud, andamios móviles en serie, emboscadas y Enjambre de Mosquitos
    {
      id: 4,
      name: '4. Arroyito (El Gigante)',
      nextDestination: 'Córdoba Capital',
      busLine: '102 - CÓRDOBA',
      subtitle: 'Auto-scrolling extremo · Andamios móviles, formación cerrada y Nube de Mosquitos [X]',
      aiTier: 4,
      theme: 'ro_arroyito',
      musicTheme: 'ro_cancha',
      width: 8600,
      timeLimit: 120,
      autoScrollSpeed: 140,
      hasDeadlyPits: true,
      swarmTriggerX: 7520,
      isMosquitoSwarm: true,
      spawn: { x: 110, y: 390 },
      flagX: 8260,
      flagY: GROUND_Y - 68,
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'promenade' },
        { x: 985, y: GROUND_Y, w: 930, h: 100, style: 'promenade' },
        { x: 2000, y: GROUND_Y, w: 900, h: 100, style: 'promenade' },
        { x: 3000, y: GROUND_Y, w: 560, h: 100, style: 'promenade' },
        // Isla intermedia entre secuencia móvil 1 (3960..4120)
        { x: 3960, y: GROUND_Y, w: 160, h: 100, style: 'promenade' },
        { x: 4520, y: GROUND_Y, w: 960, h: 100, style: 'promenade' },
        { x: 5880, y: GROUND_Y, w: 380, h: 100, style: 'promenade' },
        // Recta final de estadio rumbo al clímax (6660..8600)
        { x: 6660, y: GROUND_Y, w: 1940, h: 100, style: 'promenade' },
        // Paraavalanchas de tribuna
        { x: 470, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 1240, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 1570, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 2390, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 2760, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 3260, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 4030, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 4810, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 5140, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 6020, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 6840, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        { x: 7120, y: GROUND_Y - 38, w: 26, h: 38, style: 'crowd_barrier' },
        // Palcos altos de tribuna
        { x: 710, y: 290, w: 140, h: 16, oneWay: true, style: 'balcony' },
        { x: 1330, y: 290, w: 140, h: 16, oneWay: true, style: 'balcony' },
        { x: 2090, y: 290, w: 140, h: 16, oneWay: true, style: 'balcony' },
        { x: 2485, y: 368, w: 75, h: 16, oneWay: true, style: 'balcony' },
        { x: 2590, y: 290, w: 140, h: 16, oneWay: true, style: 'balcony' },
        { x: 2775, y: 210, w: 94, h: 16, oneWay: true, style: 'balcony' },
        { x: 4920, y: 286, w: 150, h: 16, oneWay: true, style: 'balcony' },
        { x: 6940, y: 282, w: 160, h: 16, oneWay: true, style: 'balcony' }
      ],
      fallingPlatforms: [
        { x: 3790, y: 284, w: 96, h: 18, style: 'balcony', fallDelay: 0.68 },
        { x: 4290, y: 276, w: 96, h: 18, style: 'balcony', fallDelay: 0.68 }
      ],
      hiddenBlocks: [
        { x: 2644, y: 192, w: 32, h: 32, item: 'golden_bone', style: 'secret_gold' }
      ],
      movingPlatforms: [
        { sx: 3630, sy: 416, w: 102, h: 18, mode: 'oscillate', angleDeg: 0, dist: 140, phase: 0, speed: 122, style: 'balcony' },
        { sx: 4195, sy: 404, w: 102, h: 18, mode: 'oscillate', angleDeg: 0, dist: 140, phase: 1.0, speed: 126, style: 'balcony' },
        { sx: 5560, sy: 410, w: 100, h: 18, mode: 'oscillate', angleDeg: 0, dist: 145, phase: 0.3, speed: 128, style: 'balcony' },
        { sx: 6340, sy: 398, w: 100, h: 18, mode: 'oscillate', angleDeg: -12, dist: 145, phase: 1.2, speed: 132, style: 'balcony' }
      ],
      bouncyDrums: [
        { x: 740, y: GROUND_Y },
        { x: 1360, y: GROUND_Y },
        { x: 2120, y: GROUND_Y },
        { x: 2620, y: GROUND_Y },
        { x: 4950, y: GROUND_Y },
        { x: 6960, y: GROUND_Y }
      ],
      collectibles: [
        { type: 'coin', x: 300, y: 418 },
        { type: 'coin', x: 1130, y: 418 },
        { type: 'coin', x: 2130, y: 248 },
        { type: 'coin', x: 2630, y: 248 },
        { x: 2792, y: 167, type: 'angel_wings' },
        { x: 4699, y: 417, type: 'empanada' },
        { type: 'coin', x: 8040, y: 418 }
      ],
      questionBlocks: [
        { x: 6150, y: 336, w: 32, h: 32, item: 'plant', style: 'question' }
      ],
      trapitos: [
        { x: 600, y: GROUND_Y },
        { x: 1700, y: GROUND_Y },
        { x: 3100, y: GROUND_Y },
        { x: 5260, y: GROUND_Y },
        { x: 6090, y: GROUND_Y },
        { x: 7300, y: GROUND_Y },
        { x: 7780, y: GROUND_Y }
      ],
      rockeros: [
        { x: 1850, y: GROUND_Y, minX: 1740, maxX: 1895, speed: 44 },
        { x: 2860, y: GROUND_Y, minX: 2790, maxX: 2890, speed: 46 },
        { x: 5340, y: GROUND_Y, minX: 5200, maxX: 5460, speed: 52 },
        { x: 6160, y: GROUND_Y, minX: 6050, maxX: 6245, speed: 52 },
        { x: 7370, y: GROUND_Y, minX: 7210, maxX: 7490, speed: 56 },
        { x: 7850, y: GROUND_Y, minX: 7680, maxX: 8080, speed: 58 }
      ],
      horneroNests: [
        { x: 1080, y: 160, aggroRange: 390, cooldown: 2.7, speed: 395 },
        { x: 2300, y: 160, aggroRange: 400, cooldown: 2.6, speed: 405 },
        { x: 4680, y: 156, aggroRange: 415, cooldown: 2.5, speed: 415 },
        { x: 6760, y: 152, aggroRange: 430, cooldown: 2.3, speed: 425 },
        { x: 7080, y: 148, aggroRange: 430, cooldown: 2.3, speed: 430 },
        { x: 7380, y: 154, aggroRange: 440, cooldown: 2.2, speed: 435 }
      ]
    }
  ];

  // ==========================================================================
  // SUDAMÉRICA - MUNDO 3: CÓRDOBA, ARGENTINA (4 Zonas dobles · Dificultad Media-Alta)
  // ==========================================================================
  const CORDOBA_LEVELS = [
    // ZONA 1: CÓRDOBA CAPITAL
    {
      id: 1,
      city: 'cordoba',
      name: '1. Córdoba Capital',
      subtitle: 'La Docta: calicanto de La Cañada, Pirata de Belgrano [C] + [Z] y Arco de Córdoba',
      nextDestination: 'Villa Carlos Paz',
      theme: 'co_arco',
      musicTheme: 'co_cuarteto',
      aiTier: 1,
      timeLimit: 120,
      busLine: 'TAMSE 20 · CARLOS PAZ',
      width: 7040,
      spawn: { x: 80, y: 390 },
      flagX: 6820,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 180, y: 245, text: '¡BIENVENIDOS A CÓRDOBA! SALTA LOS CANALES DE LA CAÑADA Y ESQUIVA EL FERNET.' },
        { x: 1160, y: 235, text: 'EL PIRATA DE BELGRANO NO TEME AL LADRIDO [X]: ¡USA TERREMOTO [C] Y REMÁTALO [Z]!' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 80, style: 'cobble' },
        { x: 350, y: 382, w: 185, h: 20, oneWay: true, style: 'stone' },
        { x: 605, y: 308, w: 175, h: 20, oneWay: true, style: 'promenade' },
        { x: 995, y: 392, w: 95, h: 20, oneWay: true, style: 'stone' },
        { x: 1205, y: GROUND_Y, w: 845, h: 80, style: 'cobble' },
        { x: 1470, y: 382, w: 190, h: 20, oneWay: true, style: 'stone' },
        { x: 1730, y: 306, w: 175, h: 20, oneWay: true, style: 'promenade' },
        { x: 2140, y: 395, w: 95, h: 20, oneWay: true, style: 'stone' },
        { x: 2325, y: 378, w: 90, h: 20, oneWay: true, style: 'promenade' },
        { x: 2490, y: GROUND_Y, w: 870, h: 80, style: 'cobble' },
        { x: 2635, y: 382, w: 185, h: 20, oneWay: true, style: 'wood' },
        { x: 2890, y: 306, w: 195, h: 20, oneWay: true, style: 'stone' },
        { x: 3145, y: 376, w: 150, h: 20, oneWay: true, style: 'promenade' },
        { x: 3750, y: 380, w: 105, h: 20, oneWay: true, style: 'promenade' },
        { x: 3920, y: GROUND_Y, w: 980, h: 80, style: 'cobble' },
        { x: 4320, y: 382, w: 185, h: 20, oneWay: true, style: 'stone' },
        { x: 4570, y: 306, w: 185, h: 20, oneWay: true, style: 'promenade' },
        { x: 4985, y: 395, w: 95, h: 20, oneWay: true, style: 'stone' },
        { x: 5480, y: GROUND_Y, w: 1560, h: 80, style: 'cobble' },
        { x: 5720, y: 382, w: 185, h: 20, oneWay: true, style: 'stone' },
        { x: 5980, y: 308, w: 205, h: 20, oneWay: true, style: 'promenade' },
        { x: 6320, y: 382, w: 170, h: 20, oneWay: true, style: 'stone' }
      ],
      movingPlatforms: [
        { x: 3440, y: 394, w: 110, h: 18, endX: 3585, endY: 394, speed: 112, style: 'stone' },
        { x: 5150, y: 372, w: 105, h: 18, endX: 5290, endY: 372, speed: 118, style: 'promenade' }
      ],
      fallingPlatforms: [
        { x: 4840, y: 280, w: 56, h: 16, fallDelay: 0.42, style: 'wood' },
        { x: 4970, y: 260, w: 56, h: 16, fallDelay: 0.42, style: 'wood' },
        { x: 5100, y: 245, w: 56, h: 16, fallDelay: 0.42, style: 'wood' },
        { x: 5230, y: 245, w: 56, h: 16, fallDelay: 0.42, style: 'wood' }
      ],
      collectibles: [
        { x: 230, y: 415, type: 'coin' },
        { x: 410, y: 337, type: 'coin' },
        { x: 465, y: 337, type: 'coin' },
        { x: 1040, y: 347, type: 'coin' },
        { x: 1565, y: 337, type: 'coin' },
        { x: 2185, y: 350, type: 'coin' },
        { x: 2985, y: 261, type: 'coin' },
        { x: 3768, y: 337, type: 'burger' },
        { x: 4410, y: 337, type: 'coin' },
        { x: 5030, y: 350, type: 'coin' },
        { x: 5245, y: 205, type: 'golden_bone' },
        { x: 6390, y: 337, type: 'coin' },
        { x: 6445, y: 337, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2354, y: 256, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5750, y: 260, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [
        { x: 560, y: GROUND_Y },
        { x: 1690, y: GROUND_Y },
        { x: 3120, y: GROUND_Y },
        { x: 4460, y: GROUND_Y },
        { x: 5640, y: GROUND_Y },
        { x: 6660, y: GROUND_Y }
      ],
      belgranoPirates: [
        { x: 1320, y: GROUND_Y, speed: 78 },
        { x: 2740, y: GROUND_Y, speed: 80 },
        { x: 4140, y: GROUND_Y, speed: 82 },
        { x: 6420, y: GROUND_Y, speed: 86 }
      ]
    },

    // ZONA 2: VILLA CARLOS PAZ
    {
      id: 2,
      city: 'cordoba',
      name: '2. Villa Carlos Paz',
      subtitle: 'Costanera del Lago San Roque, Burritos Serranos que embisten y muelles móviles',
      nextDestination: 'Villa General Belgrano',
      theme: 'co_cucu',
      musicTheme: 'co_cucu',
      aiTier: 2,
      timeLimit: 120,
      busLine: 'SIERRAS 1 · GRAL. BELGRANO',
      width: 7440,
      spawn: { x: 80, y: 390 },
      flagX: 7220,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 1850, y: 210, text: '¡CUIDADO CON EL BURRITO SERRANO! CUANDO TE VE A SU ALTURA, EMPIEZA A EMBESTIR.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 860, h: 80, style: 'promenade' },
        { x: 350, y: 382, w: 175, h: 20, oneWay: true, style: 'stone' },
        { x: 600, y: 306, w: 165, h: 20, oneWay: true, style: 'wood' },
        { x: 940, y: 394, w: 105, h: 20, oneWay: true, style: 'wood' },
        { x: 1460, y: GROUND_Y, w: 1000, h: 80, style: 'promenade' },
        { x: 1660, y: 382, w: 220, h: 20, oneWay: true, style: 'stone' },
        { x: 1945, y: 304, w: 255, h: 20, oneWay: true, style: 'stone' },
        { x: 2545, y: 396, w: 100, h: 20, oneWay: true, style: 'wood' },
        { x: 2725, y: 332, w: 105, h: 20, oneWay: true, style: 'stone' },
        { x: 2855, y: 252, w: 96, h: 20, oneWay: true, style: 'wood' },
        { x: 3240, y: GROUND_Y, w: 1040, h: 80, style: 'promenade' },
        { x: 3420, y: 380, w: 265, h: 20, oneWay: true, style: 'stone' },
        { x: 3760, y: 302, w: 245, h: 20, oneWay: true, style: 'wood' },
        { x: 4365, y: 394, w: 95, h: 20, oneWay: true, style: 'stone' },
        { x: 4700, y: 326, w: 115, h: 20, oneWay: true, style: 'wood' },
        { x: 5140, y: GROUND_Y, w: 1020, h: 80, style: 'promenade' },
        { x: 5340, y: 380, w: 200, h: 20, oneWay: true, style: 'stone' },
        { x: 5620, y: 302, w: 195, h: 20, oneWay: true, style: 'wood' },
        { x: 6240, y: 392, w: 105, h: 20, oneWay: true, style: 'stone' },
        { x: 6410, y: GROUND_Y, w: 1030, h: 80, style: 'promenade' },
        { x: 6680, y: 378, w: 190, h: 20, oneWay: true, style: 'stone' }
      ],
      movingPlatforms: [
        { x: 1120, y: 380, w: 110, h: 18, endX: 1275, endY: 380, speed: 116, style: 'wood' },
        { x: 2910, y: 384, w: 105, h: 18, endX: 3055, endY: 384, speed: 122, style: 'wood' },
        { x: 4530, y: 400, w: 105, h: 18, endX: 4530, endY: 305, speed: 104, style: 'stone' },
        { x: 4875, y: 378, w: 105, h: 18, endX: 4960, endY: 378, speed: 132, style: 'wood' }
      ],
      fallingPlatforms: [],
      collectibles: [
        { x: 240, y: 415, type: 'coin' },
        { x: 435, y: 337, type: 'coin' },
        { x: 990, y: 349, type: 'coin' },
        { x: 1770, y: 337, type: 'coin' },
        { x: 3550, y: 335, type: 'coin' },
        { x: 3894, y: 259, type: 'burger' },
        { x: 5440, y: 335, type: 'coin' },
        { x: 5704, y: 259, type: 'plant' },
        { x: 6290, y: 347, type: 'coin' },
        { x: 6950, y: 415, type: 'coin' },
        { x: 7000, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2745, y: 210, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [
        { x: 560, y: GROUND_Y },
        { x: 1830, y: GROUND_Y },
        { x: 3420, y: GROUND_Y },
        { x: 3860, y: GROUND_Y },
        { x: 5580, y: GROUND_Y },
        { x: 6760, y: GROUND_Y },
        { x: 7020, y: GROUND_Y }
      ],
      belgranoPirates: [
        { x: 1620, y: GROUND_Y, speed: 82 },
        { x: 3560, y: GROUND_Y, speed: 86 },
        { x: 5310, y: GROUND_Y, speed: 88 },
        { x: 6770, y: 378, speed: 88 }
      ],
      serranoBurros: [
        { x: 2060, y: 304, minX: 1960, maxX: 2185, speed: 86 },
        { x: 3540, y: 380, minX: 3435, maxX: 3670, speed: 88 },
        { x: 4060, y: GROUND_Y, minX: 3780, maxX: 4230, speed: 90 },
        { x: 5430, y: 380, minX: 5355, maxX: 5525, speed: 92 },
        { x: 5980, y: GROUND_Y, minX: 5640, maxX: 6120, speed: 94 },
        { x: 6910, y: GROUND_Y, minX: 6660, maxX: 7060, speed: 96 }
      ]
    },

    // ZONA 3: VILLA GENERAL BELGRANO
    {
      id: 3,
      city: 'cordoba',
      name: '3. Villa General Belgrano',
      subtitle: 'Chalets bávaros, arroyos cristalinos y saltos encadenados en balcones de madera',
      nextDestination: 'Cerro Uritorco',
      theme: 'co_belgrano',
      musicTheme: 'co_oktober',
      aiTier: 3,
      timeLimit: 120,
      busLine: 'VALLE · CAPILLA DEL MONTE',
      width: 7800,
      spawn: { x: 80, y: 390 },
      flagX: 7580,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 220, y: 245, text: 'PASEO ALPINO: ENCADENA LOS SALTOS SOBRE EL ARROYO SIN FRENAR ENTRE BALCONES.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 800, h: 80, style: 'cobble' },
        { x: 320, y: 380, w: 170, h: 20, oneWay: true, style: 'balcony' },
        { x: 560, y: 304, w: 170, h: 20, oneWay: true, style: 'wood' },
        { x: 880, y: 396, w: 100, h: 20, oneWay: true, style: 'wood' },
        { x: 1055, y: 332, w: 105, h: 20, oneWay: true, style: 'balcony' },
        { x: 1245, y: 384, w: 100, h: 20, oneWay: true, style: 'wood' },
        { x: 1440, y: GROUND_Y, w: 960, h: 80, style: 'cobble' },
        { x: 1620, y: 380, w: 265, h: 20, oneWay: true, style: 'balcony' },
        { x: 1960, y: 304, w: 255, h: 20, oneWay: true, style: 'wood' },
        { x: 2475, y: 395, w: 95, h: 20, oneWay: true, style: 'wood' },
        { x: 2910, y: 332, w: 115, h: 20, oneWay: true, style: 'wood' },
        { x: 3360, y: GROUND_Y, w: 1060, h: 80, style: 'cobble' },
        { x: 3560, y: 380, w: 235, h: 20, oneWay: true, style: 'branch' },
        { x: 3875, y: 302, w: 270, h: 20, oneWay: true, style: 'balcony' },
        { x: 4495, y: 395, w: 90, h: 20, oneWay: true, style: 'stone' },
        { x: 4655, y: 344, w: 95, h: 20, oneWay: true, style: 'branch' },
        { x: 5095, y: 395, w: 85, h: 20, oneWay: true, style: 'stone' },
        { x: 5255, y: GROUND_Y, w: 1025, h: 80, style: 'cobble' },
        { x: 5520, y: 380, w: 220, h: 20, oneWay: true, style: 'balcony' },
        { x: 5820, y: 302, w: 210, h: 20, oneWay: true, style: 'wood' },
        { x: 6355, y: 392, w: 100, h: 20, oneWay: true, style: 'wood' },
        { x: 6820, y: GROUND_Y, w: 980, h: 80, style: 'cobble' },
        { x: 7020, y: 380, w: 185, h: 20, oneWay: true, style: 'balcony' },
        { x: 7245, y: 304, w: 140, h: 20, oneWay: true, style: 'wood' }
      ],
      movingPlatforms: [
        { x: 2630, y: 392, w: 105, h: 18, endX: 2775, endY: 325, speed: 122, style: 'balcony' },
        { x: 3085, y: 380, w: 100, h: 18, endX: 3175, endY: 380, speed: 128, style: 'stone' },
        { x: 4815, y: 360, w: 100, h: 18, endX: 4950, endY: 360, speed: 132, style: 'wood' },
        { x: 6515, y: 365, w: 100, h: 18, endX: 6640, endY: 365, speed: 138, style: 'balcony' }
      ],
      fallingPlatforms: [],
      collectibles: [
        { x: 240, y: 415, type: 'coin' },
        { x: 405, y: 335, type: 'coin' },
        { x: 1105, y: 287, type: 'coin' },
        { x: 1750, y: 335, type: 'coin' },
        { x: 3675, y: 335, type: 'coin' },
        { x: 4078, y: 259, type: 'burger' },
        { x: 4700, y: 299, type: 'coin' },
        { x: 5925, y: 257, type: 'coin' },
        { x: 6405, y: 347, type: 'coin' },
        { x: 7295, y: 259, type: 'coin' },
        { x: 7340, y: 259, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2506, y: 273, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5877, y: 180, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [
        { x: 520, y: GROUND_Y },
        { x: 1960, y: GROUND_Y },
        { x: 3580, y: GROUND_Y },
        { x: 4180, y: GROUND_Y },
        { x: 5580, y: GROUND_Y },
        { x: 6140, y: GROUND_Y },
        { x: 6960, y: GROUND_Y },
        { x: 7450, y: GROUND_Y }
      ],
      belgranoPirates: [
        { x: 1580, y: GROUND_Y, speed: 88 },
        { x: 3760, y: GROUND_Y, speed: 92 },
        { x: 5630, y: 380, speed: 90 },
        { x: 7100, y: GROUND_Y, speed: 98 },
        { x: 7110, y: 380, speed: 94 }
      ],
      serranoBurros: [
        { x: 1750, y: 380, minX: 1635, maxX: 1870, speed: 90 },
        { x: 2220, y: GROUND_Y, minX: 1940, maxX: 2360, speed: 94 },
        { x: 3900, y: GROUND_Y, minX: 3720, maxX: 4100, speed: 98 },
        { x: 4000, y: 302, minX: 3890, maxX: 4130, speed: 96 },
        { x: 5420, y: GROUND_Y, minX: 5290, maxX: 5620, speed: 96 },
        { x: 5920, y: 302, minX: 5835, maxX: 6015, speed: 100 },
        { x: 7340, y: GROUND_Y, minX: 7180, maxX: 7490, speed: 102 }
      ]
    },

    // ZONA 4: CERRO URITORCO — Cámara libre (SIN autoScrollSpeed) + Mini-OVNIs inmunes a hipnosis
    {
      id: 4,
      city: 'cordoba',
      name: '4. Cerro Uritorco',
      subtitle: 'Cumbre mística del Uritorco, desfiladeros rocosos y Mini-OVNIs inmunes a hipnosis',
      nextDestination: 'Ushuaia Centro',
      theme: 'co_uritorco',
      musicTheme: 'co_uritorco',
      aiTier: 4,
      timeLimit: 120,
      busLine: 'RUTA 38 · CÓRDOBA',
      width: 8200,
      spawn: { x: 80, y: 390 },
      flagX: 7980,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 210, y: 245, text: '¡CERRO URITORCO! LOS MINI-OVNIS SON INMUNES A LA HIPNOSIS: DERRÍBALOS CON [Z].' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 800, h: 80, style: 'stone' },
        { x: 340, y: 380, w: 175, h: 20, oneWay: true, style: 'volcano' },
        { x: 585, y: 302, w: 165, h: 20, oneWay: true, style: 'stone' },
        { x: 880, y: 395, w: 95, h: 20, oneWay: true, style: 'stone' },
        { x: 1045, y: 330, w: 100, h: 20, oneWay: true, style: 'volcano' },
        { x: 1220, y: 268, w: 105, h: 20, oneWay: true, style: 'stone' },
        { x: 1365, y: 190, w: 96, h: 20, oneWay: true, style: 'volcano' },
        { x: 1410, y: 378, w: 105, h: 20, oneWay: true, style: 'volcano' },
        { x: 1595, y: GROUND_Y, w: 1085, h: 80, style: 'stone' },
        { x: 1800, y: 380, w: 280, h: 20, oneWay: true, style: 'stone' },
        { x: 2170, y: 302, w: 270, h: 20, oneWay: true, style: 'volcano' },
        { x: 2755, y: 396, w: 90, h: 20, oneWay: true, style: 'stone' },
        { x: 3205, y: 312, w: 135, h: 20, oneWay: true, style: 'stone' },
        { x: 3680, y: GROUND_Y, w: 1200, h: 80, style: 'stone' },
        { x: 4000, y: 380, w: 290, h: 20, oneWay: true, style: 'volcano' },
        { x: 4380, y: 302, w: 215, h: 20, oneWay: true, style: 'stone' },
        { x: 4950, y: 395, w: 90, h: 20, oneWay: true, style: 'volcano' },
        { x: 5100, y: 334, w: 95, h: 20, oneWay: true, style: 'stone' },
        { x: 5550, y: 386, w: 100, h: 20, oneWay: true, style: 'stone' },
        { x: 5720, y: GROUND_Y, w: 1140, h: 80, style: 'stone' },
        { x: 5920, y: 380, w: 270, h: 20, oneWay: true, style: 'stone' },
        { x: 6270, y: 302, w: 265, h: 20, oneWay: true, style: 'volcano' },
        { x: 6930, y: 392, w: 95, h: 20, oneWay: true, style: 'stone' },
        { x: 7300, y: GROUND_Y, w: 900, h: 80, style: 'stone' },
        { x: 7500, y: 380, w: 195, h: 20, oneWay: true, style: 'volcano' }
      ],
      movingPlatforms: [
        { x: 2895, y: 382, w: 105, h: 18, endX: 3060, endY: 310, speed: 132, style: 'volcano' },
        { x: 3390, y: 324, w: 105, h: 18, endX: 3500, endY: 388, speed: 128, style: 'stone' },
        { x: 5250, y: 338, w: 100, h: 18, endX: 5400, endY: 338, speed: 138, style: 'volcano' },
        { x: 7075, y: 360, w: 95, h: 18, endX: 7145, endY: 325, speed: 145, style: 'volcano' }
      ],
      fallingPlatforms: [],
      collectibles: [
        { x: 240, y: 415, type: 'coin' },
        { x: 425, y: 335, type: 'coin' },
        { x: 1095, y: 285, type: 'coin' },
        { x: 1940, y: 335, type: 'coin' },
        { x: 4145, y: 335, type: 'coin' },
        { x: 4219, y: 337, type: 'burger' },
        { x: 5145, y: 289, type: 'coin' },
        { x: 6055, y: 335, type: 'coin' },
        { x: 6341, y: 259, type: 'plant' },
        { x: 6975, y: 347, type: 'coin' },
        { x: 7770, y: 415, type: 'coin' },
        { x: 7820, y: 415, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2356, y: 180, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [
        { x: 530, y: GROUND_Y },
        { x: 2050, y: GROUND_Y },
        { x: 2340, y: GROUND_Y },
        { x: 3860, y: GROUND_Y },
        { x: 4290, y: GROUND_Y },
        { x: 5900, y: GROUND_Y },
        { x: 6720, y: GROUND_Y },
        { x: 7420, y: GROUND_Y },
        { x: 7850, y: GROUND_Y }
      ],
      belgranoPirates: [
        { x: 1710, y: GROUND_Y, speed: 92 },
        { x: 4060, y: GROUND_Y, speed: 96 },
        { x: 6240, y: GROUND_Y, speed: 102 },
        { x: 7540, y: GROUND_Y, speed: 104 },
        { x: 7740, y: GROUND_Y, speed: 106 }
      ],
      serranoBurros: [
        { x: 1930, y: 380, minX: 1815, maxX: 2065, speed: 96 },
        { x: 2450, y: GROUND_Y, minX: 2180, maxX: 2630, speed: 98 },
        { x: 4140, y: 380, minX: 4015, maxX: 4275, speed: 98 },
        { x: 4480, y: 302, minX: 4395, maxX: 4580, speed: 100 },
        { x: 5860, y: GROUND_Y, minX: 5750, maxX: 6150, speed: 104 },
        { x: 6040, y: 380, minX: 5935, maxX: 6175, speed: 102 },
        { x: 6600, y: GROUND_Y, minX: 6380, maxX: 6810, speed: 104 },
        { x: 7595, y: 380, minX: 7515, maxX: 7680, speed: 106 }
      ],
      miniUfos: [
        { x: 960, baseY: 168, minX: 760, maxX: 1320, vx: 108, ampY: 22, period: 4.1, beamHeight: 205 },
        { x: 1850, baseY: 166, minX: 1620, maxX: 2140, vx: 112, ampY: 24, period: 4.0, beamHeight: 205 },
        { x: 2880, baseY: 170, minX: 2660, maxX: 3240, vx: 118, ampY: 24, period: 3.9, beamHeight: 205 },
        { x: 3920, baseY: 172, minX: 3700, maxX: 4220, vx: 122, ampY: 26, period: 3.9, beamHeight: 205 },
        { x: 4720, baseY: 168, minX: 4460, maxX: 5040, vx: 126, ampY: 24, period: 3.8, beamHeight: 205 },
        { x: 5820, baseY: 170, minX: 5560, maxX: 6140, vx: 128, ampY: 24, period: 3.8, beamHeight: 205 },
        { x: 6640, baseY: 168, minX: 6360, maxX: 6960, vx: 132, ampY: 22, period: 3.7, beamHeight: 205 },
        { x: 7580, baseY: 174, minX: 7340, maxX: 7820, vx: 136, ampY: 22, period: 3.6, beamHeight: 205 }
      ]
    }
  ];

  // ============================================================================
  // USHUAIA (TIERRA DEL FUEGO — CLÍMAX FINAL DE ARGENTINA, 4 ZONAS)
  // ============================================================================
  const USHUAIA_LEVELS = [
    {
      id: 1,
      city: 'ushuaia',
      name: '1. Ushuaia Centro',
      subtitle: 'Hielo resbaladizo, Canal Beagle y turistas abrigados con palo selfie',
      nextDestination: 'Tren del Fin del Mundo',
      theme: 'ushuaia_centro',
      musicTheme: 'ush_centro',
      aiTier: 1,
      timeLimit: 120,
      hasIcePhysics: true,
      hasWaterPits: true,
      busLine: 'USHUAIA · FIN DEL MUNDO',
      width: 6200,
      spawn: { x: 80, y: 390 },
      flagX: 5940,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 185, y: 245, text: '¡USHUAIA FIN DEL MUNDO! CUIDADO CON EL HIELO RESBALADIZO Y EL CANAL BEAGLE.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 860, h: 100, style: 'snow_dock' },
        { x: 340, y: 380, w: 165, h: 20, oneWay: true, style: 'ice' },
        { x: 615, y: 304, w: 155, h: 20, oneWay: true, style: 'ice' },
        { x: 980, y: GROUND_Y, w: 780, h: 100, style: 'ice' },
        { x: 1125, y: 380, w: 185, h: 20, oneWay: true, style: 'ice' },
        { x: 1435, y: 304, w: 175, h: 20, oneWay: true, style: 'ice' },
        { x: 2260, y: GROUND_Y, w: 780, h: 100, style: 'snow_dock' },
        { x: 2450, y: 378, w: 175, h: 20, oneWay: true, style: 'ice' },
        { x: 2740, y: 302, w: 165, h: 20, oneWay: true, style: 'ice' },
        { x: 3170, y: GROUND_Y, w: 810, h: 100, style: 'ice' },
        { x: 3340, y: 376, w: 190, h: 20, oneWay: true, style: 'ice' },
        { x: 3650, y: 298, w: 180, h: 20, oneWay: true, style: 'ice' },
        { x: 4520, y: GROUND_Y, w: 740, h: 100, style: 'snow_dock' },
        { x: 4720, y: 378, w: 175, h: 20, oneWay: true, style: 'ice' },
        { x: 5390, y: GROUND_Y, w: 810, h: 100, style: 'snow_dock' },
        { x: 5560, y: 376, w: 165, h: 20, oneWay: true, style: 'ice' }
      ],
      movingPlatforms: [
        { sx: 1840, sy: 400, w: 112, h: 18, endX: 2070, endY: 388, speed: 104, style: 'ice' },
        { sx: 4070, sy: 406, w: 115, h: 18, endX: 4320, endY: 382, speed: 112, style: 'ice' }
      ],
      fallingPlatforms: [],
      collectibles: [
        { x: 260, y: 416, type: 'coin' },
        { x: 685, y: 260, type: 'coin' },
        { x: 1985, y: 342, type: 'coin' },
        { x: 2530, y: 334, type: 'coin' },
        { x: 3384, y: 333, type: 'empanada' },
        { x: 3735, y: 254, type: 'coin' },
        { x: 4220, y: 338, type: 'coin' },
        { x: 5640, y: 332, type: 'coin' },
        { x: 5790, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2477, y: 256, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 4835, y: 256, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [],
      bundledTourists: [
        { x: 620, y: GROUND_Y, minX: 460, maxX: 820, speed: 64 },
        { x: 1580, y: GROUND_Y, minX: 1360, maxX: 1730, speed: 68 },
        { x: 2820, y: 302, minX: 2745, maxX: 2895, speed: 56 },
        { x: 4920, y: GROUND_Y, minX: 4680, maxX: 5210, speed: 72 },
        { x: 5620, y: GROUND_Y, minX: 5440, maxX: 5830, speed: 74 }
      ],
      penguins: [
        { x: 1260, y: GROUND_Y, minX: 1020, maxX: 1340, speed: 44 },
        { x: 2620, y: GROUND_Y, minX: 2320, maxX: 2890, speed: 46 },
        { x: 3560, y: GROUND_Y, minX: 3220, maxX: 3820, speed: 48 }
      ],
      seaLions: [
        { x: 1500, y: 304, minX: 1445, maxX: 1600, speed: 54 },
        { x: 2520, y: 378, minX: 2455, maxX: 2615, speed: 56 },
        { x: 3450, y: 376, minX: 3350, maxX: 3520, speed: 58 },
        { x: 4780, y: GROUND_Y, minX: 4540, maxX: 4880, speed: 62 }
      ],
      royalSeagulls: [
        { x: 890, y: 172, minX: 740, maxX: 1120, patrolSpeed: 98, diveSpeed: 290 },
        { x: 2120, y: 162, minX: 1860, maxX: 2380, patrolSpeed: 104, diveSpeed: 300 },
        { x: 4320, y: 158, minX: 4040, maxX: 4620, patrolSpeed: 108, diveSpeed: 310 }
      ]
    },
    {
      id: 2,
      city: 'ushuaia',
      name: '2. Tren del Fin del Mundo',
      subtitle: 'Auto-scrolling sobre vagones, viento helado y zorros fueguinos ágiles',
      nextDestination: 'Glaciar Martial',
      theme: 'ushuaia_tren',
      musicTheme: 'ush_tren',
      aiTier: 2,
      timeLimit: 120,
      autoScrollSpeed: 135,
      hasWind: true,
      hasDeadlyPits: true,
      busLine: 'FCAF · TREN DEL FIN DEL MUNDO',
      width: 5200,
      spawn: { x: 80, y: 390 },
      flagX: 4920,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 220, y: 245, text: '¡TREN DEL FIN DEL MUNDO! AVANZÁ CON EL SCROLL, VENCÉ CENTOLLAS CON [Z] O [C] Y ZORROS EN DIAGONAL [↑+Z].' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'fin_del_mundo_train' },
        { x: 360, y: 378, w: 180, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 620, y: 308, w: 165, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 1025, y: GROUND_Y, w: 815, h: 100, style: 'fin_del_mundo_train' },
        { x: 1260, y: 378, w: 180, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 1540, y: 308, w: 170, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 2360, y: GROUND_Y, w: 860, h: 100, style: 'fin_del_mundo_train' },
        { x: 2240, y: 376, w: 135, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 2375, y: 296, w: 125, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 2495, y: 215, w: 150, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 2820, y: 376, w: 185, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 3330, y: GROUND_Y, w: 790, h: 100, style: 'fin_del_mundo_train' },
        { x: 3560, y: 376, w: 185, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 3825, y: 308, w: 175, h: 20, oneWay: true, style: 'fin_del_mundo_train' },
        { x: 4230, y: GROUND_Y, w: 970, h: 100, style: 'fin_del_mundo_train', isLocomotive: true },
        { x: 4480, y: 378, w: 170, h: 20, oneWay: true, style: 'fin_del_mundo_train' }
      ],
      movingPlatforms: [
        { sx: 1930, sy: 410, w: 120, h: 18, endX: 2150, endY: 386, speed: 120, style: 'fin_del_mundo_train' }
      ],
      fallingPlatforms: [],
      collectibles: [
        { x: 445, y: 334, type: 'coin' },
        { x: 1345, y: 334, type: 'coin' },
        { x: 1642, y: 265, type: 'angel_wings' },
        { x: 2080, y: 344, type: 'coin' },
        { x: 2587, y: 172, type: 'burger' },
        { x: 3645, y: 332, type: 'coin' },
        { x: 3931, y: 265, type: 'plant' },
        { x: 4560, y: 334, type: 'coin' },
        { x: 4780, y: 416, type: 'coin' }
      ],
      trapitos: [],
      fuegianFoxes: [
        { x: 520, y: GROUND_Y, minX: 310, maxX: 880, speed: 108 },
        { x: 1450, y: GROUND_Y, minX: 1120, maxX: 1790, speed: 114 },
        { x: 2740, y: GROUND_Y, minX: 2420, maxX: 3160, speed: 118 },
        { x: 3750, y: GROUND_Y, minX: 3420, maxX: 4070, speed: 120 },
        { x: 4540, y: GROUND_Y, minX: 4290, maxX: 4840, speed: 122 }
      ],
      kingCrabs: [
        { x: 740, y: GROUND_Y, minX: 540, maxX: 890, speed: 68 },
        { x: 1610, y: 308, minX: 1550, maxX: 1700, speed: 64 },
        { x: 2910, y: 376, minX: 2825, maxX: 2995, speed: 68 },
        { x: 3660, y: 376, minX: 3565, maxX: 3735, speed: 70 },
        { x: 4680, y: GROUND_Y, minX: 4410, maxX: 4860, speed: 74 }
      ],
      penguins: [
        { x: 1210, y: GROUND_Y, minX: 1055, maxX: 1440, speed: 48 },
        { x: 3460, y: GROUND_Y, minX: 3360, maxX: 3780, speed: 50 }
      ]
    },
    {
      id: 3,
      city: 'ushuaia',
      name: '3. Glaciar Martial',
      subtitle: 'Grietas profundas, hielo frágil que se desploma, aerosilla y estalactitas',
      nextDestination: 'Faro Les Éclaireurs',
      theme: 'ushuaia_glaciar',
      musicTheme: 'ush_glaciar',
      aiTier: 3,
      timeLimit: 120,
      hasIcePhysics: true,
      hasDeadlyPits: true,
      busLine: 'AEROSILLA · GLACIAR MARTIAL',
      width: 6400,
      spawn: { x: 80, y: 390 },
      flagX: 6120,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 205, y: 245, text: '¡GLACIAR MARTIAL! EL HIELO FRÁGIL CEDE EN 0.6s Y LAS ESTALACTITAS TIEMBLAN ANTES DE CAER.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 780, h: 100, style: 'ice' },
        { x: 340, y: 378, w: 170, h: 20, oneWay: true, style: 'ice' },
        { x: 560, y: 300, w: 150, h: 20, oneWay: true, style: 'ice' },
        { x: 1240, y: GROUND_Y, w: 780, h: 100, style: 'ice' },
        { x: 1440, y: 378, w: 185, h: 20, oneWay: true, style: 'ice' },
        { x: 1710, y: 302, w: 175, h: 20, oneWay: true, style: 'ice' },
        { x: 2680, y: GROUND_Y, w: 780, h: 100, style: 'ice' },
        { x: 2920, y: 376, w: 175, h: 20, oneWay: true, style: 'ice' },
        { x: 3180, y: 298, w: 165, h: 20, oneWay: true, style: 'ice' },
        { x: 3960, y: GROUND_Y, w: 800, h: 100, style: 'ice' },
        { x: 4160, y: 376, w: 180, h: 20, oneWay: true, style: 'ice' },
        { x: 4440, y: 302, w: 175, h: 20, oneWay: true, style: 'ice' },
        { x: 5400, y: GROUND_Y, w: 1000, h: 100, style: 'ice' },
        { x: 5600, y: 378, w: 175, h: 20, oneWay: true, style: 'ice' },
        { x: 2435, y: 112, w: 86, h: 16, oneWay: true, style: 'ice' }
      ],
      movingPlatforms: [
        { sx: 2110, sy: 410, w: 108, h: 18, endX: 2485, endY: 318, speed: 124, style: 'aerosilla' },
        { sx: 4855, sy: 404, w: 110, h: 18, endX: 5205, endY: 334, speed: 128, style: 'aerosilla' }
      ],
      fallingPlatforms: [
        { x: 875, y: 415, w: 96, h: 18, style: 'fragile_ice', fallDelay: 0.6 },
        { x: 1065, y: 392, w: 96, h: 18, style: 'fragile_ice', fallDelay: 0.6 },
        { x: 3560, y: 412, w: 98, h: 18, style: 'fragile_ice', fallDelay: 0.6 },
        { x: 3755, y: 386, w: 98, h: 18, style: 'fragile_ice', fallDelay: 0.6 }
      ],
      overheadHazards: [
        { x: 470, y: 56, w: 32, h: 48, kind: 'icicle' },
        { x: 1580, y: 58, w: 32, h: 48, kind: 'icicle' },
        { x: 3060, y: 54, w: 34, h: 50, kind: 'icicle' },
        { x: 4280, y: 56, w: 32, h: 48, kind: 'icicle' },
        { x: 4540, y: 60, w: 34, h: 50, kind: 'icicle' },
        { x: 5740, y: 58, w: 34, h: 50, kind: 'icicle' }
      ],
      collectibles: [
        { x: 250, y: 416, type: 'coin' },
        { x: 1790, y: 258, type: 'coin' },
        { x: 2340, y: 305, type: 'coin' },
        { x: 2465, y: 72, type: 'golden_bone' },
        { x: 3282, y: 255, type: 'pizza' },
        { x: 4240, y: 332, type: 'coin' },
        { x: 5080, y: 312, type: 'coin' },
        { x: 5685, y: 334, type: 'coin' },
        { x: 5940, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 1825, y: 180, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 4189, y: 254, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      trapitos: [],
      seaLions: [
        { x: 1540, y: GROUND_Y, minX: 1290, maxX: 1890, speed: 68 },
        { x: 3010, y: GROUND_Y, minX: 2740, maxX: 3390, speed: 70 },
        { x: 5580, y: GROUND_Y, minX: 5440, maxX: 5980, speed: 74 }
      ],
      kingCrabs: [
        { x: 600, y: 300, minX: 565, maxX: 700, speed: 68 },
        { x: 1785, y: 302, minX: 1715, maxX: 1875, speed: 72 },
        { x: 4460, y: GROUND_Y, minX: 4050, maxX: 4710, speed: 76 }
      ],
      fuegianFoxes: [
        { x: 2980, y: 376, minX: 2925, maxX: 3085, speed: 112 },
        { x: 4240, y: GROUND_Y, minX: 4000, maxX: 4580, speed: 118 },
        { x: 5820, y: GROUND_Y, minX: 5520, maxX: 6040, speed: 122 }
      ],
      penguins: [
        { x: 1360, y: GROUND_Y, minX: 1260, maxX: 1620, speed: 50 },
        { x: 4510, y: 302, minX: 4445, maxX: 4605, speed: 46 }
      ],
      royalSeagulls: [
        { x: 1080, y: 152, minX: 840, maxX: 1320, patrolSpeed: 114, diveSpeed: 315 },
        { x: 2380, y: 146, minX: 2100, maxX: 2660, patrolSpeed: 118, diveSpeed: 325 },
        { x: 3740, y: 154, minX: 3480, maxX: 3980, patrolSpeed: 122, diveSpeed: 330 },
        { x: 5120, y: 148, minX: 4840, maxX: 5420, patrolSpeed: 124, diveSpeed: 335 }
      ]
    },
    {
      id: 4,
      city: 'ushuaia',
      name: '4. Faro Les Éclaireurs',
      subtitle: 'Tormenta austral, islotes del Beagle y bandada de 20 Cormoranes Australes',
      nextDestination: 'Fin del Mundo · Rumbo a Chile',
      theme: 'ushuaia_faro',
      musicTheme: 'ush_faro',
      aiTier: 4,
      timeLimit: 120,
      hasWind: true,
      hasStormWaves: true,
      hasWaterPits: true,
      isCormorantSwarm: true,
      swarmTriggerX: 2960,
      busLine: 'FARO LES ÉCLAIREURS · BEAGLE',
      width: 4060,
      spawn: { x: 80, y: 390 },
      flagX: 3760,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 200, y: 245, text: '¡FARO DEL FIN DEL MUNDO! PREPARÁ A LA TINA [X] ANTE LA BANDADA DE CORMORANES.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 780, h: 100, style: 'faro_rock' },
        { x: 320, y: 380, w: 165, h: 20, oneWay: true, style: 'ice' },
        { x: 545, y: 306, w: 155, h: 20, oneWay: true, style: 'ice' },
        { x: 1240, y: GROUND_Y, w: 520, h: 100, style: 'faro_rock' },
        { x: 1410, y: 378, w: 180, h: 20, oneWay: true, style: 'snow_dock' },
        { x: 1870, y: GROUND_Y, w: 810, h: 100, style: 'faro_rock' },
        { x: 2040, y: 380, w: 140, h: 20, oneWay: true, style: 'ice' },
        { x: 2185, y: 302, w: 130, h: 20, oneWay: true, style: 'ice' },
        { x: 2315, y: 222, w: 145, h: 20, oneWay: true, style: 'ice' },
        { x: 3240, y: GROUND_Y, w: 820, h: 100, style: 'faro_rock' },
        { x: 3420, y: 376, w: 170, h: 20, oneWay: true, style: 'snow_dock' }
      ],
      movingPlatforms: [
        { sx: 1055, sy: 402, w: 100, h: 18, endX: 1125, endY: 392, speed: 124, style: 'ice' },
        { sx: 2770, sy: 410, w: 108, h: 18, endX: 3045, endY: 392, speed: 132, style: 'ice' }
      ],
      fallingPlatforms: [
        { x: 875, y: 416, w: 94, h: 18, style: 'fragile_ice', fallDelay: 0.6 }
      ],
      collectibles: [
        { x: 395, y: 336, type: 'coin' },
        { x: 1523, y: 335, type: 'empanada' },
        { x: 2105, y: 336, type: 'coin' },
        { x: 2348, y: 179, type: 'plant' },
        { x: 2920, y: 344, type: 'coin' },
        { x: 3630, y: 416, type: 'coin' }
      ],
      trapitos: [],
      bundledTourists: [
        { x: 560, y: GROUND_Y, minX: 400, maxX: 740, speed: 74 },
        { x: 2420, y: GROUND_Y, minX: 2220, maxX: 2640, speed: 78 }
      ],
      seaLions: [
        { x: 1460, y: GROUND_Y, minX: 1280, maxX: 1710, speed: 74 },
        { x: 3480, y: GROUND_Y, minX: 3290, maxX: 3690, speed: 78 }
      ],
      kingCrabs: [
        { x: 605, y: 306, minX: 550, maxX: 690, speed: 72 },
        { x: 2120, y: GROUND_Y, minX: 1920, maxX: 2360, speed: 76 },
        { x: 3500, y: 376, minX: 3425, maxX: 3580, speed: 76 }
      ],
      fuegianFoxes: [
        { x: 2260, y: GROUND_Y, minX: 1960, maxX: 2600, speed: 122 },
        { x: 3560, y: GROUND_Y, minX: 3320, maxX: 3700, speed: 124 }
      ],
      penguins: [
        { x: 2540, y: GROUND_Y, minX: 2380, maxX: 2650, speed: 52 }
      ],
      royalSeagulls: [
        { x: 960, y: 152, minX: 760, maxX: 1220, patrolSpeed: 124, diveSpeed: 335 },
        { x: 2050, y: 148, minX: 1840, maxX: 2340, patrolSpeed: 126, diveSpeed: 340 }
      ]
    }
  ];

  // ============================================================================
  // CHILE — CAPÍTULO SUDAMERICANO (4 CIUDADES × 4 ZONAS = 16 NIVELES)
  // ============================================================================
  const CHILE_SANTIAGO_LEVELS = [
    {
      id: 1,
      city: 'chile_santiago',
      name: '1. Plaza de Armas y La Moneda',
      subtitle: 'Centro cívico de Santiago entre fosos profundos, cóndores y pumas cordilleranos',
      nextDestination: 'Cerro San Cristóbal',
      theme: 'ch_santiago_plaza',
      musicTheme: 'ch_santiago_plaza',
      aiTier: 2,
      timeLimit: 120,
      hasDeadlyPits: true,
      busLine: 'RED · EJE ALAMEDA / LA MONEDA',
      width: 6700,
      spawn: { x: 80, y: 390 },
      flagX: 6380,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: '¡BIENVENIDOS A SANTIAGO! CUIDÁ LOS ABISMOS, VIGAS ALTAS, PERROS, CÓNDORES Y PUMAS.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'cobble' },
        { x: 1050, y: GROUND_Y, w: 600, h: 100, style: 'stone' },
        { x: 1890, y: GROUND_Y, w: 660, h: 100, style: 'cobble' },
        { x: 2780, y: GROUND_Y, w: 600, h: 100, style: 'stone' },
        { x: 3532, y: GROUND_Y, w: 688, h: 100, style: 'cobble' },
        { x: 4465, y: GROUND_Y, w: 600, h: 100, style: 'stone' },
        { x: 5300, y: GROUND_Y, w: 600, h: 100, style: 'cobble' },
        { x: 6120, y: GROUND_Y, w: 580, h: 100, style: 'stone' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'stone' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 880, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 1150, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 1990, y: 382, w: 175, h: 20, oneWay: true, style: 'stone' },
        { x: 2220, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 2880, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 3340, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 3630, y: 382, w: 175, h: 20, oneWay: true, style: 'stone' },
        { x: 3860, y: 304, w: 170, h: 20, oneWay: true, style: 'balcony' },
        { x: 4565, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 4795, y: 304, w: 170, h: 20, oneWay: true, style: 'balcony' },
        { x: 5400, y: 382, w: 175, h: 20, oneWay: true, style: 'stone' },
        { x: 5630, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 6180, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' }
      ],
      movingPlatforms: [
        { sx: 1718, sy: 420, w: 104, h: 18, endX: 1718, endY: 266, speed: 108, style: 'steel' },
        { sx: 4265, sy: 404, w: 108, h: 18, endX: 4385, endY: 404, speed: 112, style: 'steel' },
        { sx: 5958, sy: 422, w: 104, h: 18, endX: 5958, endY: 274, speed: 114, style: 'steel' }
      ],
      fallingPlatforms: [
        { x: 2592, y: 416, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 2682, y: 400, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 5106, y: 416, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 5198, y: 398, w: 78, h: 18, style: 'steel', fallDelay: 0.50 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 975, y: 268, type: 'coin' },
        { x: 1234, y: 338, type: 'coin' },
        { x: 2074, y: 338, type: 'coin' },
        { x: 3384, y: 269, type: 'empanada' },
        { x: 3435, y: 268, type: 'coin' },
        { x: 3942, y: 260, type: 'coin' },
        { x: 4650, y: 338, type: 'coin' },
        { x: 4880, y: 260, type: 'coin' },
        { x: 6190, y: 416, type: 'coin' },
        { x: 6264, y: 338, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2246, y: 182, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 4906, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      portDogs: [
        { x: 740, y: GROUND_Y, minX: 580, maxX: 882, speed: 132 },
        { x: 2960, y: GROUND_Y, minX: 2800, maxX: 3140, speed: 138 },
        { x: 5490, y: GROUND_Y, minX: 5320, maxX: 5670, speed: 132 }
      ],
      pumas: [
        { x: 2220, y: GROUND_Y, minX: 2020, maxX: 2525, speed: 120 },
        { x: 4810, y: GROUND_Y, minX: 4590, maxX: 5045, speed: 126 }
      ],
      guasos: [
        { x: 460, y: GROUND_Y, minX: 400, maxX: 600, speed: 82 },
        { x: 1320, y: GROUND_Y, minX: 1180, maxX: 1390, speed: 86 },
        { x: 2040, y: 382, minX: 1998, maxX: 2158, speed: 74 },
        { x: 3880, y: GROUND_Y, minX: 3740, maxX: 3960, speed: 88 },
        { x: 6160, y: GROUND_Y, minX: 6132, maxX: 6320, speed: 86 }
      ],
      guasas: [
        { x: 1140, y: GROUND_Y, minX: 1068, maxX: 1245, speed: 80 },
        { x: 2360, y: GROUND_Y, minX: 2260, maxX: 2490, speed: 84 },
        { x: 3675, y: 382, minX: 3638, maxX: 3798, speed: 74 },
        { x: 4540, y: GROUND_Y, minX: 4480, maxX: 4690, speed: 88 },
        { x: 5680, y: GROUND_Y, minX: 5580, maxX: 5830, speed: 86 }
      ],
      condors: [
        { x: 780, baseY: 148, minX: 560, maxX: 1000, speed: 136 },
        { x: 1290, baseY: 180, minX: 1070, maxX: 1510, speed: 142 },
        { x: 1800, baseY: 206, minX: 1580, maxX: 2020, speed: 148 },
        { x: 2820, baseY: 180, minX: 2600, maxX: 3040, speed: 136 },
        { x: 3330, baseY: 206, minX: 3110, maxX: 3550, speed: 142 },
        { x: 4350, baseY: 180, minX: 4130, maxX: 4570, speed: 154 },
        { x: 5370, baseY: 148, minX: 5150, maxX: 5590, speed: 142 },
        { x: 6320, baseY: 164, minX: 6100, maxX: 6520, speed: 154 }
      ]
    },
    {
      id: 2,
      city: 'chile_santiago',
      name: '2. Cerro San Cristóbal',
      subtitle: 'Ascenso en Funicular y Teleférico entre Pumas y Cóndores precordilleranos',
      nextDestination: 'Barrio Lastarria y Bellavista',
      theme: 'ch_santiago_cristobal',
      musicTheme: 'ch_santiago_cristobal',
      aiTier: 3,
      timeLimit: 120,
      hasDeadlyPits: true,
      busLine: 'FUNICULAR & TELEFÉRICO · PARQUE METROPOLITANO',
      width: 6900,
      spawn: { x: 80, y: 390 },
      flagX: 6660,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'EL PUMA AGUANTA 2 GOLPES. USÁ ELEVADORES VERTICALES Y VIGAS DE ACERO SOBRE LOS ABISMOS.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'stone' },
        { x: 1050, y: GROUND_Y, w: 570, h: 100, style: 'wood' },
        { x: 1860, y: GROUND_Y, w: 640, h: 100, style: 'stone' },
        { x: 2740, y: GROUND_Y, w: 520, h: 100, style: 'wood' },
        { x: 3480, y: GROUND_Y, w: 660, h: 100, style: 'stone' },
        { x: 4385, y: GROUND_Y, w: 600, h: 100, style: 'wood' },
        { x: 5135, y: GROUND_Y, w: 620, h: 100, style: 'stone' },
        { x: 6005, y: GROUND_Y, w: 345, h: 100, style: 'wood' },
        { x: 6500, y: GROUND_Y, w: 400, h: 100, style: 'stone' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'teleferico' },
        { x: 880, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 1150, y: 382, w: 175, h: 20, oneWay: true, style: 'teleferico' },
        { x: 1960, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 2190, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 2840, y: 382, w: 175, h: 20, oneWay: true, style: 'teleferico' },
        { x: 3530, y: 380, w: 140, h: 20, oneWay: true, style: 'wood' },
        { x: 3685, y: 300, w: 140, h: 20, oneWay: true, style: 'steel' },
        { x: 3835, y: 220, w: 155, h: 20, oneWay: true, style: 'teleferico' },
        { x: 4485, y: 382, w: 175, h: 20, oneWay: true, style: 'teleferico' },
        { x: 4965, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 5235, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 5465, y: 304, w: 170, h: 20, oneWay: true, style: 'teleferico' },
        { x: 6085, y: 382, w: 175, h: 20, oneWay: true, style: 'teleferico' },
        { x: 6540, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' }
      ],
      movingPlatforms: [
        { sx: 1656, sy: 408, w: 106, h: 18, endX: 1756, endY: 360, speed: 112, style: 'funicular' },
        { sx: 3318, sy: 422, w: 104, h: 18, endX: 3318, endY: 256, speed: 114, style: 'teleferico' },
        { sx: 4180, sy: 404, w: 106, h: 18, endX: 4305, endY: 404, speed: 116, style: 'funicular' }
      ],
      fallingPlatforms: [
        { x: 2542, y: 416, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 2636, y: 398, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 5798, y: 416, w: 78, h: 18, style: 'wood', fallDelay: 0.50 },
        { x: 5894, y: 396, w: 78, h: 18, style: 'wood', fallDelay: 0.50 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 975, y: 268, type: 'coin' },
        { x: 1234, y: 338, type: 'coin' },
        { x: 2044, y: 338, type: 'coin' },
        { x: 3559, y: 337, type: 'empanada' },
        { x: 3600, y: 336, type: 'coin' },
        { x: 3755, y: 256, type: 'coin' },
        { x: 5012, y: 269, type: 'plant' },
        { x: 5060, y: 268, type: 'coin' },
        { x: 5319, y: 338, type: 'coin' },
        { x: 5547, y: 260, type: 'coin' },
        { x: 6169, y: 338, type: 'coin' },
        { x: 6530, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2301, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1190, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 2140, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 3690, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 4680, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 5560, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' }
      ],
      portDogs: [
        { x: 1330, y: GROUND_Y, minX: 1130, maxX: 1580, speed: 144 },
        { x: 3990, y: GROUND_Y, minX: 3820, maxX: 4120, speed: 150 },
        { x: 6160, y: GROUND_Y, minX: 6025, maxX: 6330, speed: 138 }
      ],
      pumas: [
        { x: 2200, y: GROUND_Y, minX: 1960, maxX: 2475, speed: 122 },
        { x: 5520, y: GROUND_Y, minX: 5260, maxX: 5730, speed: 126 }
      ],
      guasos: [
        { x: 470, y: GROUND_Y, minX: 400, maxX: 610, speed: 86 },
        { x: 1920, y: GROUND_Y, minX: 1872, maxX: 2070, speed: 90 },
        { x: 3560, y: GROUND_Y, minX: 3495, maxX: 3700, speed: 92 },
        { x: 4530, y: 382, minX: 4492, maxX: 4652, speed: 78 },
        { x: 6620, y: GROUND_Y, minX: 6520, maxX: 6760, speed: 92 }
      ],
      guasas: [
        { x: 700, y: GROUND_Y, minX: 630, maxX: 850, speed: 86 },
        { x: 1200, y: 382, minX: 1158, maxX: 1318, speed: 76 },
        { x: 2880, y: GROUND_Y, minX: 2765, maxX: 3000, speed: 90 },
        { x: 4740, y: GROUND_Y, minX: 4600, maxX: 4860, speed: 94 },
        { x: 5280, y: GROUND_Y, minX: 5160, maxX: 5390, speed: 90 }
      ],
      condors: [
        { x: 811, baseY: 148, minX: 591, maxX: 1031, speed: 143 },
        { x: 1350, baseY: 180, minX: 1130, maxX: 1570, speed: 149 },
        { x: 2430, baseY: 148, minX: 2210, maxX: 2650, speed: 161 },
        { x: 2970, baseY: 180, minX: 2750, maxX: 3190, speed: 143 },
        { x: 4050, baseY: 148, minX: 3830, maxX: 4270, speed: 155 },
        { x: 4590, baseY: 180, minX: 4370, maxX: 4810, speed: 161 },
        { x: 5670, baseY: 148, minX: 5450, maxX: 5890, speed: 149 },
        { x: 6210, baseY: 180, minX: 5990, maxX: 6430, speed: 155 }
      ]
    },
    {
      id: 3,
      city: 'chile_santiago',
      name: '3. Barrio Lastarria y Bellavista',
      subtitle: 'Patios bohemios, murales coloridos y desfiladeros urbanos',
      nextDestination: 'Costanera Center y Cordillera de los Andes',
      theme: 'ch_santiago_lastarria',
      musicTheme: 'ch_santiago_lastarria',
      bgmTrack: 'assets/audio/chile_santiago_z3.mp3.mp3',
      aiTier: 3,
      timeLimit: 120,
      hasDeadlyPits: true,
      busLine: 'METRO L1 · BAQUEDANO / BELLAVISTA',
      width: 7200,
      spawn: { x: 80, y: 390 },
      flagX: 6900,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'LASTARRIA Y BELLAVISTA: ESQUIVÁ ESTALACTITAS QUE TIEMBLAN Y PUENTES FRÁGILES DE 0.5S.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'cobble' },
        { x: 1052, y: GROUND_Y, w: 580, h: 100, style: 'cobble' },
        { x: 1882, y: GROUND_Y, w: 640, h: 100, style: 'cobble' },
        { x: 2768, y: GROUND_Y, w: 580, h: 100, style: 'cobble' },
        { x: 3568, y: GROUND_Y, w: 640, h: 100, style: 'cobble' },
        { x: 4358, y: GROUND_Y, w: 580, h: 100, style: 'cobble' },
        { x: 5188, y: GROUND_Y, w: 640, h: 100, style: 'cobble' },
        { x: 6068, y: GROUND_Y, w: 480, h: 100, style: 'cobble' },
        { x: 6700, y: GROUND_Y, w: 500, h: 100, style: 'cobble' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 880, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 1152, y: 382, w: 175, h: 20, oneWay: true, style: 'mosaic' },
        { x: 1982, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 2212, y: 304, w: 170, h: 20, oneWay: true, style: 'mosaic' },
        { x: 2868, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 3668, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 3898, y: 304, w: 170, h: 20, oneWay: true, style: 'mosaic' },
        { x: 4458, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 5288, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 5518, y: 304, w: 170, h: 20, oneWay: true, style: 'mosaic' },
        { x: 6168, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 6750, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' }
      ],
      movingPlatforms: [
        { sx: 1668, sy: 402, w: 106, h: 18, endX: 1790, endY: 402, speed: 118, style: 'steel' },
        { sx: 3406, sy: 422, w: 104, h: 18, endX: 3406, endY: 254, speed: 118, style: 'balcony' },
        { sx: 5864, sy: 404, w: 106, h: 18, endX: 5984, endY: 404, speed: 120, style: 'balcony' }
      ],
      fallingPlatforms: [
        { x: 2564, y: 418, w: 78, h: 18, style: 'wood', fallDelay: 0.50 },
        { x: 2658, y: 398, w: 78, h: 18, style: 'wood', fallDelay: 0.50 },
        { x: 4980, y: 416, w: 78, h: 18, style: 'wood', fallDelay: 0.50 },
        { x: 5076, y: 396, w: 78, h: 18, style: 'wood', fallDelay: 0.50 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 975, y: 268, type: 'coin' },
        { x: 1236, y: 338, type: 'coin' },
        { x: 2066, y: 338, type: 'coin' },
        { x: 3742, y: 339, type: 'empanada' },
        { x: 3980, y: 260, type: 'coin' },
        { x: 4542, y: 338, type: 'coin' },
        { x: 5372, y: 338, type: 'coin' },
        { x: 5600, y: 260, type: 'coin' },
        { x: 6252, y: 338, type: 'coin' },
        { x: 6760, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2323, y: 182, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5333, y: 260, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1200, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 2150, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 3060, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 3960, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 4680, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 5560, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' }
      ],
      portDogs: [
        { x: 1340, y: GROUND_Y, minX: 1120, maxX: 1605, speed: 154 },
        { x: 3780, y: GROUND_Y, minX: 3588, maxX: 4180, speed: 156 },
        { x: 6260, y: GROUND_Y, minX: 6088, maxX: 6520, speed: 158 }
      ],
      pumas: [
        { x: 2230, y: GROUND_Y, minX: 1940, maxX: 2498, speed: 132 },
        { x: 5500, y: GROUND_Y, minX: 5230, maxX: 5805, speed: 134 }
      ],
      guasos: [
        { x: 480, y: GROUND_Y, minX: 410, maxX: 620, speed: 90 },
        { x: 1940, y: GROUND_Y, minX: 1894, maxX: 2100, speed: 94 },
        { x: 3715, y: 382, minX: 3676, maxX: 3836, speed: 80 },
        { x: 4510, y: GROUND_Y, minX: 4390, maxX: 4630, speed: 96 },
        { x: 6760, y: GROUND_Y, minX: 6712, maxX: 6930, speed: 94 }
      ],
      guasas: [
        { x: 700, y: GROUND_Y, minX: 635, maxX: 855, speed: 90 },
        { x: 1200, y: 382, minX: 1160, maxX: 1320, speed: 78 },
        { x: 2960, y: GROUND_Y, minX: 2810, maxX: 3060, speed: 94 },
        { x: 4720, y: GROUND_Y, minX: 4640, maxX: 4880, speed: 96 },
        { x: 5335, y: 382, minX: 5296, maxX: 5456, speed: 80 }
      ],
      condors: [
        { x: 775, baseY: 148, minX: 555, maxX: 995, speed: 152 },
        { x: 1285, baseY: 180, minX: 1065, maxX: 1505, speed: 158 },
        { x: 2305, baseY: 148, minX: 2085, maxX: 2525, speed: 170 },
        { x: 2815, baseY: 180, minX: 2595, maxX: 3035, speed: 152 },
        { x: 3835, baseY: 148, minX: 3615, maxX: 4055, speed: 164 },
        { x: 4345, baseY: 180, minX: 4125, maxX: 4565, speed: 170 },
        { x: 5365, baseY: 148, minX: 5145, maxX: 5585, speed: 158 },
        { x: 5875, baseY: 180, minX: 5655, maxX: 6095, speed: 164 }
      ]
    },
    {
      id: 4,
      city: 'chile_santiago',
      name: '4. Costanera Center y Cordillera de los Andes',
      subtitle: 'Mirador Sky Costanera entre vientos cordilleranos, abismos y cumbres nevadas',
      nextDestination: 'Viña del Mar y Valparaíso',
      theme: 'ch_santiago_costanera',
      musicTheme: 'ch_santiago_costanera',
      bgmTrack: 'assets/audio/chile_santiago_z4.mp3.mp3',
      aiTier: 4,
      timeLimit: 120,
      hasDeadlyPits: true,
      hasWind: true,
      busLine: 'TERMINAL ALAMEDA · RUTA 68 AL PACÍFICO',
      width: 7600,
      spawn: { x: 80, y: 390 },
      flagX: 7300,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'VIENTO CORDILLERANO Y HIELOS DE ALTURA SOBRE ABISMOS RUMBO AL PACÍFICO.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'steel' },
        { x: 1120, y: GROUND_Y, w: 580, h: 100, style: 'stone' },
        { x: 1950, y: GROUND_Y, w: 640, h: 100, style: 'steel' },
        { x: 2840, y: GROUND_Y, w: 600, h: 100, style: 'stone' },
        { x: 3660, y: GROUND_Y, w: 440, h: 100, style: 'steel' },
        { x: 4320, y: GROUND_Y, w: 660, h: 100, style: 'stone' },
        { x: 5235, y: GROUND_Y, w: 640, h: 100, style: 'steel' },
        { x: 6125, y: GROUND_Y, w: 560, h: 100, style: 'stone' },
        { x: 6925, y: GROUND_Y, w: 675, h: 100, style: 'steel' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'teleferico' },
        { x: 880, y: 312, w: 200, h: 20, oneWay: true, style: 'steel' },
        { x: 1220, y: 382, w: 175, h: 20, oneWay: true, style: 'teleferico' },
        { x: 2050, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 2280, y: 304, w: 170, h: 20, oneWay: true, style: 'teleferico' },
        { x: 2940, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 3760, y: 382, w: 175, h: 20, oneWay: true, style: 'teleferico' },
        { x: 4362, y: 380, w: 140, h: 20, oneWay: true, style: 'teleferico' },
        { x: 4517, y: 300, w: 140, h: 20, oneWay: true, style: 'steel' },
        { x: 4667, y: 220, w: 155, h: 20, oneWay: true, style: 'teleferico' },
        { x: 5335, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 5565, y: 304, w: 170, h: 20, oneWay: true, style: 'teleferico' },
        { x: 6225, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 7025, y: 382, w: 175, h: 20, oneWay: true, style: 'teleferico' }
      ],
      movingPlatforms: [
        { sx: 1732, sy: 404, w: 106, h: 18, endX: 1860, endY: 368, speed: 122, style: 'teleferico' },
        { sx: 3498, sy: 422, w: 104, h: 18, endX: 3498, endY: 254, speed: 124, style: 'teleferico' },
        { sx: 5908, sy: 404, w: 106, h: 18, endX: 6035, endY: 404, speed: 126, style: 'teleferico' }
      ],
      fallingPlatforms: [
        { x: 970, y: 416, w: 80, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 2630, y: 416, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 2728, y: 398, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 4170, y: 416, w: 80, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 5022, y: 416, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 5120, y: 398, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 6726, y: 416, w: 78, h: 18, style: 'steel', fallDelay: 0.50 },
        { x: 6820, y: 398, w: 78, h: 18, style: 'steel', fallDelay: 0.50 }
      ],
      hiddenBlocks: [
        { x: 4728, y: 122, w: 32, h: 32, item: 'golden_bone', style: 'secret_gold' }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 980, y: 268, type: 'coin' },
        { x: 1304, y: 338, type: 'coin' },
        { x: 2134, y: 338, type: 'coin' },
        { x: 3955, y: 417, type: 'empanada' },
        { x: 4432, y: 336, type: 'coin' },
        { x: 4548, y: 257, type: 'plant' },
        { x: 4587, y: 256, type: 'coin' },
        { x: 5419, y: 338, type: 'coin' },
        { x: 5647, y: 260, type: 'coin' },
        { x: 7140, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2391, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1240, y: 118, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 2180, y: 136, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 3140, y: 118, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 3860, y: 136, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 4680, y: 118, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 5540, y: 136, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 6420, y: 118, w: 34, h: 42, kind: 'icicle', label: '' }
      ],
      portDogs: [
        { x: 2220, y: GROUND_Y, minX: 1970, maxX: 2565, speed: 169 },
        { x: 6380, y: GROUND_Y, minX: 6145, maxX: 6660, speed: 158 }
      ],
      pumas: [
        { x: 3160, y: GROUND_Y, minX: 2890, maxX: 3418, speed: 149 },
        { x: 5600, y: GROUND_Y, minX: 5280, maxX: 5855, speed: 146 }
      ],
      guasos: [
        { x: 480, y: GROUND_Y, minX: 400, maxX: 620, speed: 96 },
        { x: 1270, y: 382, minX: 1228, maxX: 1388, speed: 82 },
        { x: 3760, y: GROUND_Y, minX: 3680, maxX: 3910, speed: 100 },
        { x: 4680, y: GROUND_Y, minX: 4540, maxX: 4790, speed: 102 },
        { x: 7075, y: 382, minX: 7032, maxX: 7192, speed: 84 }
      ],
      guasas: [
        { x: 710, y: GROUND_Y, minX: 635, maxX: 860, speed: 96 },
        { x: 1410, y: GROUND_Y, minX: 1280, maxX: 1520, speed: 98 },
        { x: 2980, y: 382, minX: 2948, maxX: 3108, speed: 82 },
        { x: 4440, y: GROUND_Y, minX: 4335, maxX: 4530, speed: 100 },
        { x: 5390, y: 382, minX: 5342, maxX: 5502, speed: 84 }
      ],
      condors: [
        { x: 752, baseY: 148, minX: 532, maxX: 972, speed: 165 },
        { x: 1218, baseY: 180, minX: 998, maxX: 1438, speed: 171 },
        { x: 2150, baseY: 148, minX: 1930, maxX: 2370, speed: 183 },
        { x: 2615, baseY: 180, minX: 2395, maxX: 2835, speed: 165 },
        { x: 3547, baseY: 148, minX: 3327, maxX: 3767, speed: 177 },
        { x: 4012, baseY: 180, minX: 3792, maxX: 4232, speed: 183 },
        { x: 4944, baseY: 148, minX: 4724, maxX: 5164, speed: 171 },
        { x: 5875, baseY: 212, minX: 5655, maxX: 6095, speed: 183 },
        { x: 6807, baseY: 180, minX: 6587, maxX: 7027, speed: 171 }
      ]
    }
  ];

  const CHILE_VINA_LEVELS = [
    {
      id: 1,
      city: 'chile_vina',
      name: '1. Reloj de Flores y Reñaca',
      subtitle: 'Jardines florales de Viña del Mar, borde costero y pelícanos del Pacífico',
      nextDestination: 'Palacio Vergara (Quinta Vergara)',
      theme: 'ch_vina_reloj',
      musicTheme: 'ch_vina_reloj',
      aiTier: 2,
      timeLimit: 120,
      hasWaterPits: true,
      busLine: 'BORDE COSTERO · RELOJ DE FLORES / REÑACA',
      width: 6600,
      spawn: { x: 80, y: 390 },
      flagX: 6280,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: '¡VIÑA DEL MAR! LADRÁ CON [X] PARA ALEJAR PELÍCANOS Y SALTÁ SOBRE LOS FOSOS DEL PACÍFICO.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'floral_lawn' },
        { x: 1050, y: GROUND_Y, w: 550, h: 100, style: 'promenade' },
        { x: 1835, y: GROUND_Y, w: 625, h: 100, style: 'tropical_sand' },
        { x: 2610, y: GROUND_Y, w: 540, h: 100, style: 'floral_lawn' },
        { x: 3300, y: GROUND_Y, w: 580, h: 100, style: 'promenade' },
        { x: 4120, y: GROUND_Y, w: 560, h: 100, style: 'tropical_sand' },
        { x: 4830, y: GROUND_Y, w: 620, h: 100, style: 'floral_lawn' },
        { x: 5600, y: GROUND_Y, w: 480, h: 100, style: 'promenade' },
        { x: 6300, y: GROUND_Y, w: 300, h: 100, style: 'tropical_sand' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'floral_lawn' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'wood' },
        { x: 1150, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 1935, y: 382, w: 175, h: 20, oneWay: true, style: 'promenade' },
        { x: 2165, y: 304, w: 170, h: 20, oneWay: true, style: 'floral_lawn' },
        { x: 2710, y: 382, w: 175, h: 20, oneWay: true, style: 'floral_lawn' },
        { x: 3400, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 3630, y: 304, w: 170, h: 20, oneWay: true, style: 'promenade' },
        { x: 4220, y: 382, w: 175, h: 20, oneWay: true, style: 'promenade' },
        { x: 4930, y: 382, w: 175, h: 20, oneWay: true, style: 'floral_lawn' },
        { x: 5160, y: 304, w: 170, h: 20, oneWay: true, style: 'wood' },
        { x: 5700, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' }
      ],
      movingPlatforms: [
        { sx: 1638, sy: 402, w: 106, h: 18, endX: 1730, endY: 368, speed: 104, style: 'wood' },
        { sx: 3916, sy: 402, w: 106, h: 18, endX: 4014, endY: 368, speed: 104, style: 'wood' },
        { sx: 6138, sy: 422, w: 104, h: 18, endX: 6138, endY: 272, speed: 106, style: 'wood' }
      ],
      fallingPlatforms: [
        { x: 4680, y: 416, w: 78, h: 18, style: 'wood', fallDelay: 0.50 },
        { x: 4752, y: 402, w: 78, h: 18, style: 'wood', fallDelay: 0.50 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1234, y: 338, type: 'coin' },
        { x: 2019, y: 338, type: 'coin' },
        { x: 3439, y: 339, type: 'empanada' },
        { x: 3712, y: 260, type: 'coin' },
        { x: 4304, y: 338, type: 'coin' },
        { x: 5014, y: 338, type: 'coin' },
        { x: 5242, y: 260, type: 'coin' },
        { x: 5784, y: 338, type: 'coin' },
        { x: 6360, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2234, y: 182, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 4975, y: 260, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pacificHazards: [
        { x: 975, baseY: 488, period: 2.6, height: 162, phase: 0.0, kind: 'flying_fish' },
        { x: 1718, baseY: 488, period: 2.7, height: 164, phase: 0.65, kind: 'flying_fish' },
        { x: 2535, baseY: 488, period: 2.6, height: 162, phase: 1.2, kind: 'flying_fish' },
        { x: 3225, baseY: 488, period: 2.6, height: 162, phase: 1.8, kind: 'flying_fish' },
        { x: 4000, baseY: 488, period: 2.7, height: 164, phase: 0.3, kind: 'flying_fish' }
      ],
      portDogs: [
        { x: 1330, y: GROUND_Y, minX: 1120, maxX: 1560, speed: 136 },
        { x: 3560, y: GROUND_Y, minX: 3320, maxX: 3830, speed: 136 },
        { x: 5830, y: GROUND_Y, minX: 5620, maxX: 6050, speed: 136 }
      ],
      guasos: [
        { x: 470, y: GROUND_Y, minX: 400, maxX: 580, speed: 82 },
        { x: 2065, y: 382, minX: 1993, maxX: 2153, speed: 74 },
        { x: 4220, y: GROUND_Y, minX: 4155, maxX: 4330, speed: 86 },
        { x: 5060, y: GROUND_Y, minX: 4930, maxX: 5170, speed: 88 }
      ],
      guasas: [
        { x: 700, y: GROUND_Y, minX: 610, maxX: 810, speed: 80 },
        { x: 2840, y: 382, minX: 2768, maxX: 2928, speed: 74 },
        { x: 3530, y: 382, minX: 3458, maxX: 3618, speed: 74 },
        { x: 4460, y: GROUND_Y, minX: 4370, maxX: 4580, speed: 84 }
      ],
      portPelicans: [
        { x: 750, baseY: 138, minX: 530, maxX: 970, speed: 114 },
        { x: 1670, baseY: 202, minX: 1450, maxX: 1890, speed: 126 },
        { x: 2130, baseY: 138, minX: 1910, maxX: 2350, speed: 132 },
        { x: 3050, baseY: 202, minX: 2830, maxX: 3270, speed: 120 },
        { x: 3510, baseY: 138, minX: 3290, maxX: 3730, speed: 126 },
        { x: 4430, baseY: 202, minX: 4210, maxX: 4650, speed: 114 },
        { x: 4890, baseY: 138, minX: 4670, maxX: 5110, speed: 120 },
        { x: 5810, baseY: 202, minX: 5590, maxX: 6030, speed: 132 }
      ]
    },
    {
      id: 2,
      city: 'chile_vina',
      name: '2. Palacio Vergara (Quinta Vergara)',
      subtitle: 'Arcos neogóticos venecianos, jardines históricos y pasarelas altas',
      nextDestination: 'Cerros y Ascensores de Valparaíso',
      theme: 'ch_vina_quinta',
      musicTheme: 'ch_vina_quinta',
      aiTier: 3,
      timeLimit: 120,
      hasDeadlyPits: true,
      busLine: 'EFE · ESTACIÓN VIÑA / QUINTA VERGARA',
      width: 7000,
      spawn: { x: 80, y: 390 },
      flagX: 6680,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'QUINTA VERGARA: SI TE ANIMÁS A BAJAR DEL PUENTE, PODÉS VOLVER POR EL OTRO LADO.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'cobble' },
        { x: 1028, y: GROUND_Y, w: 560, h: 100, style: 'stone' },
        { x: 1828, y: GROUND_Y, w: 640, h: 100, style: 'cobble' },
        { x: 2576, y: GROUND_Y, w: 560, h: 100, style: 'stone' },
        { x: 3244, y: GROUND_Y, w: 640, h: 100, style: 'cobble' },
        { x: 4124, y: GROUND_Y, w: 560, h: 100, style: 'stone' },
        { x: 4792, y: GROUND_Y, w: 640, h: 100, style: 'cobble' },
        { x: 5540, y: GROUND_Y, w: 560, h: 100, style: 'stone' },
        { x: 6340, y: GROUND_Y, w: 660, h: 100, style: 'cobble' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'branch' },
        { x: 1138, y: 382, w: 175, h: 20, oneWay: true, style: 'branch' },
        { x: 1938, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 2168, y: 304, w: 170, h: 20, oneWay: true, style: 'balcony' },
        { x: 2686, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 3354, y: 380, w: 140, h: 20, oneWay: true, style: 'branch' },
        { x: 3509, y: 300, w: 140, h: 20, oneWay: true, style: 'wood' },
        { x: 3659, y: 220, w: 155, h: 20, oneWay: true, style: 'branch' },
        { x: 4234, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 4902, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 5132, y: 304, w: 170, h: 20, oneWay: true, style: 'branch' },
        { x: 5650, y: 382, w: 175, h: 20, oneWay: true, style: 'branch' },
        { x: 6450, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 6680, y: 304, w: 170, h: 20, oneWay: true, style: 'balcony' },
        { x: 4012, y: 498, w: 54, h: 16, oneWay: true, style: 'balcony' }
      ],
      movingPlatforms: [
        { sx: 1602, sy: 402, w: 106, h: 18, endX: 1716, endY: 368, speed: 108, style: 'balcony' },
        { sx: 3898, sy: 402, w: 106, h: 18, endX: 4012, endY: 368, speed: 108, style: 'balcony' },
        { sx: 6114, sy: 402, w: 106, h: 18, endX: 6228, endY: 368, speed: 108, style: 'balcony' }
      ],
      fallingPlatforms: [
        { x: 3900, y: 494, w: 54, h: 16, fallDelay: 0.42, style: 'wood' }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1222, y: 338, type: 'coin' },
        { x: 2022, y: 338, type: 'coin' },
        { x: 3424, y: 336, type: 'coin' },
        { x: 3538, y: 257, type: 'empanada' },
        { x: 3579, y: 256, type: 'coin' },
        { x: 4026, y: 460, type: 'golden_bone' },
        { x: 4318, y: 338, type: 'coin' },
        { x: 4986, y: 338, type: 'coin' },
        { x: 5173, y: 261, type: 'plant' },
        { x: 5214, y: 260, type: 'coin' },
        { x: 5734, y: 338, type: 'coin' },
        { x: 6490, y: 416, type: 'coin' },
        { x: 6762, y: 260, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2279, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1178, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 2118, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 3674, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 4942, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' }
      ],
      portDogs: [
        { x: 1445, y: GROUND_Y, minX: 1280, maxX: 1573, speed: 148 },
        { x: 3421, y: GROUND_Y, minX: 3259, maxX: 3586, speed: 148 },
        { x: 5844, y: GROUND_Y, minX: 5679, maxX: 6009, speed: 148 }
      ],
      portPelicans: [
        { x: 890, baseY: 138, minX: 670, maxX: 1110, speed: 125 },
        { x: 1630, baseY: 170, minX: 1410, maxX: 1850, speed: 131 },
        { x: 3110, baseY: 138, minX: 2890, maxX: 3330, speed: 143 },
        { x: 3850, baseY: 170, minX: 3630, maxX: 4070, speed: 125 },
        { x: 5330, baseY: 138, minX: 5110, maxX: 5550, speed: 137 },
        { x: 6070, baseY: 170, minX: 5850, maxX: 6290, speed: 143 }
      ],
      guasos: [
        { x: 470, y: GROUND_Y, minX: 400, maxX: 580, speed: 84 },
        { x: 1265, y: 382, minX: 1193, maxX: 1353, speed: 74 },
        { x: 2810, y: 382, minX: 2738, maxX: 2898, speed: 74 },
        { x: 4360, y: 382, minX: 4288, maxX: 4448, speed: 74 },
        { x: 6490, y: GROUND_Y, minX: 6415, maxX: 6575, speed: 88 }
      ],
      guasas: [
        { x: 700, y: GROUND_Y, minX: 610, maxX: 810, speed: 82 },
        { x: 1990, y: GROUND_Y, minX: 1865, maxX: 2135, speed: 86 },
        { x: 3560, y: GROUND_Y, minX: 3440, maxX: 3720, speed: 88 },
        { x: 5030, y: 382, minX: 4958, maxX: 5118, speed: 74 },
        { x: 5770, y: 382, minX: 5698, maxX: 5858, speed: 74 }
      ],
      pumas: [
        { x: 2307, y: GROUND_Y, minX: 2142, maxX: 2453, speed: 128 },
        { x: 4541, y: GROUND_Y, minX: 4376, maxX: 4669, speed: 123 }
      ]
    },
    {
      id: 3,
      city: 'chile_vina',
      name: '3. Cerros y Ascensores de Valparaíso',
      subtitle: 'Escaleras multicolores, funiculares empinados y cargas portuarias',
      nextDestination: 'Barco de Carga · Puerto de Valparaíso',
      theme: 'ch_vina_ascensores',
      musicTheme: 'ch_vina_ascensores',
      aiTier: 3,
      timeLimit: 120,
      hasWaterPits: true,
      busLine: 'ASCENSOR ARTILLERÍA · CERRO ALEGRE',
      width: 7300,
      spawn: { x: 80, y: 390 },
      flagX: 6980,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'VALPARAÍSO: EVITÁ LAS CARGAS SUSPENDIDAS Y SUBÍ EN ASCENSORES PATRIMONIALES.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'valpo_stairs' },
        { x: 1028, y: GROUND_Y, w: 560, h: 100, style: 'valpo_stairs' },
        { x: 1828, y: GROUND_Y, w: 640, h: 100, style: 'valpo_stairs' },
        { x: 2728, y: GROUND_Y, w: 560, h: 100, style: 'valpo_stairs' },
        { x: 3396, y: GROUND_Y, w: 640, h: 100, style: 'valpo_stairs' },
        { x: 4276, y: GROUND_Y, w: 560, h: 100, style: 'valpo_stairs' },
        { x: 5096, y: GROUND_Y, w: 640, h: 100, style: 'valpo_stairs' },
        { x: 5844, y: GROUND_Y, w: 560, h: 100, style: 'valpo_stairs' },
        { x: 6644, y: GROUND_Y, w: 656, h: 100, style: 'valpo_stairs' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'valpo_stairs' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'balcony' },
        { x: 1138, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 1938, y: 382, w: 175, h: 20, oneWay: true, style: 'mosaic' },
        { x: 2168, y: 304, w: 170, h: 20, oneWay: true, style: 'valpo_stairs' },
        { x: 2838, y: 382, w: 175, h: 20, oneWay: true, style: 'valpo_stairs' },
        { x: 3506, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 3736, y: 304, w: 170, h: 20, oneWay: true, style: 'mosaic' },
        { x: 4386, y: 382, w: 175, h: 20, oneWay: true, style: 'mosaic' },
        { x: 5206, y: 382, w: 175, h: 20, oneWay: true, style: 'valpo_stairs' },
        { x: 5436, y: 304, w: 170, h: 20, oneWay: true, style: 'balcony' },
        { x: 5954, y: 382, w: 175, h: 20, oneWay: true, style: 'balcony' },
        { x: 6754, y: 382, w: 175, h: 20, oneWay: true, style: 'mosaic' },
        { x: 6984, y: 304, w: 170, h: 20, oneWay: true, style: 'valpo_stairs' }
      ],
      movingPlatforms: [
        { sx: 1602, sy: 402, w: 106, h: 18, endX: 1716, endY: 368, speed: 114, style: 'funicular' },
        { sx: 4050, sy: 402, w: 106, h: 18, endX: 4164, endY: 368, speed: 114, style: 'funicular' },
        { sx: 6418, sy: 402, w: 106, h: 18, endX: 6532, endY: 368, speed: 114, style: 'funicular' }
      ],
      fallingPlatforms: [
        { x: 2516, y: 418, w: 76, h: 18, style: 'wood', fallDelay: 0.64 },
        { x: 2626, y: 404, w: 76, h: 18, style: 'wood', fallDelay: 0.62 },
        { x: 4884, y: 418, w: 76, h: 18, style: 'wood', fallDelay: 0.64 },
        { x: 4994, y: 404, w: 76, h: 18, style: 'wood', fallDelay: 0.62 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1222, y: 338, type: 'coin' },
        { x: 2022, y: 338, type: 'coin' },
        { x: 3615, y: 339, type: 'empanada' },
        { x: 3818, y: 260, type: 'coin' },
        { x: 4470, y: 338, type: 'coin' },
        { x: 5290, y: 338, type: 'coin' },
        { x: 5518, y: 260, type: 'coin' },
        { x: 6038, y: 338, type: 'coin' },
        { x: 6790, y: 416, type: 'coin' },
        { x: 7066, y: 260, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2279, y: 182, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5462, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pacificHazards: [
        { x: 960, baseY: 488, period: 2.4000000000000004, height: 162, phase: 0.0, kind: 'pacific_piranha' },
        { x: 1696, baseY: 488, period: 2.5, height: 164, phase: 0.65, kind: 'pacific_piranha' },
        { x: 2583, baseY: 488, period: 2.39, height: 168, phase: 1.4, kind: 'pacific_piranha' },
        { x: 3328, baseY: 488, period: 2.4000000000000004, height: 162, phase: 1.7999999999999998, kind: 'pacific_piranha' },
        { x: 4144, baseY: 488, period: 2.5, height: 164, phase: 0.30000000000000027, kind: 'pacific_piranha' }
      ],
      overheadHazards: [
        { x: 1178, y: 118, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 2118, y: 136, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 3826, y: 118, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 5246, y: 136, w: 44, h: 34, kind: 'cargo_load', label: '' }
      ],
      portDogs: [
        { x: 1445, y: GROUND_Y, minX: 1280, maxX: 1573, speed: 158 },
        { x: 3744, y: GROUND_Y, minX: 3579, maxX: 3909, speed: 163 },
        { x: 6261, y: GROUND_Y, minX: 6096, maxX: 6389, speed: 163 }
      ],
      portPelicans: [
        { x: 831, baseY: 138, minX: 611, maxX: 1051, speed: 134 },
        { x: 1453, baseY: 170, minX: 1233, maxX: 1673, speed: 140 },
        { x: 2697, baseY: 138, minX: 2477, maxX: 2917, speed: 152 },
        { x: 3319, baseY: 170, minX: 3099, maxX: 3539, speed: 134 },
        { x: 4563, baseY: 138, minX: 4343, maxX: 4783, speed: 146 },
        { x: 5185, baseY: 170, minX: 4965, maxX: 5405, speed: 152 },
        { x: 6429, baseY: 138, minX: 6209, maxX: 6649, speed: 140 }
      ],
      guasos: [
        { x: 470, y: GROUND_Y, minX: 400, maxX: 580, speed: 86 },
        { x: 2065, y: 382, minX: 1993, maxX: 2153, speed: 74 },
        { x: 2965, y: 382, minX: 2893, maxX: 3053, speed: 74 },
        { x: 4515, y: 382, minX: 4443, maxX: 4603, speed: 74 },
        { x: 6780, y: GROUND_Y, minX: 6700, maxX: 6865, speed: 90 }
      ],
      guasas: [
        { x: 700, y: GROUND_Y, minX: 610, maxX: 810, speed: 84 },
        { x: 1265, y: 382, minX: 1193, maxX: 1353, speed: 74 },
        { x: 3635, y: 382, minX: 3563, maxX: 3723, speed: 74 },
        { x: 5335, y: 382, minX: 5263, maxX: 5423, speed: 74 },
        { x: 6080, y: 382, minX: 6008, maxX: 6168, speed: 74 }
      ],
      pumas: [
        { x: 2307, y: GROUND_Y, minX: 2142, maxX: 2453, speed: 136 },
        { x: 4693, y: GROUND_Y, minX: 4528, maxX: 4821, speed: 131 }
      ]
    },
    {
      id: 4,
      city: 'chile_vina',
      name: '4. Puerto de Valparaíso (Barco en Marcha)',
      subtitle: 'Cubierta móvil de buque mercante, contenedores, grúas pórtico y atardecer',
      nextDestination: 'Desierto de Atacama',
      theme: 'ch_vina_puerto',
      musicTheme: 'ch_vina_puerto',
      aiTier: 4,
      timeLimit: 120,
      hasWaterPits: true,
      hasWind: true,
      autoScrollSpeed: 132,
      busLine: 'MUELLE PRAT · BUQUE MERCANTE DEL PACÍFICO',
      width: 7700,
      spawn: { x: 80, y: 390 },
      flagX: 7380,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: '¡BUQUE EN MARCHA! CORRÉ POR CONTENEDORES, PUENTE DE MANDO Y GRÚAS DEL PUERTO.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'ship_deck' },
        { x: 1016, y: GROUND_Y, w: 560, h: 100, style: 'ship_deck' },
        { x: 1816, y: GROUND_Y, w: 640, h: 100, style: 'container_red' },
        { x: 2716, y: GROUND_Y, w: 560, h: 100, style: 'ship_deck' },
        { x: 3372, y: GROUND_Y, w: 640, h: 100, style: 'ship_deck' },
        { x: 4252, y: GROUND_Y, w: 560, h: 100, style: 'ship_deck' },
        { x: 5072, y: GROUND_Y, w: 640, h: 100, style: 'container_red' },
        { x: 5808, y: GROUND_Y, w: 560, h: 100, style: 'ship_deck' },
        { x: 6608, y: GROUND_Y, w: 400, h: 100, style: 'ship_deck' },
        { x: 7208, y: GROUND_Y, w: 492, h: 100, style: 'ship_deck' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'container_red' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'container_blue' },
        { x: 550, y: 232, w: 145, h: 20, oneWay: true, style: 'ship_bridge' },
        { x: 1126, y: 382, w: 175, h: 20, oneWay: true, style: 'container_blue' },
        { x: 1926, y: 382, w: 175, h: 20, oneWay: true, style: 'container_yellow' },
        { x: 2156, y: 304, w: 170, h: 20, oneWay: true, style: 'industrial_crane' },
        { x: 2826, y: 382, w: 175, h: 20, oneWay: true, style: 'industrial_crane' },
        { x: 3482, y: 382, w: 175, h: 20, oneWay: true, style: 'container_red' },
        { x: 3712, y: 304, w: 170, h: 20, oneWay: true, style: 'container_blue' },
        { x: 4362, y: 380, w: 140, h: 20, oneWay: true, style: 'container_blue' },
        { x: 4517, y: 300, w: 140, h: 20, oneWay: true, style: 'container_yellow' },
        { x: 4667, y: 220, w: 155, h: 20, oneWay: true, style: 'container_blue' },
        { x: 5182, y: 382, w: 175, h: 20, oneWay: true, style: 'container_yellow' },
        { x: 5412, y: 304, w: 170, h: 20, oneWay: true, style: 'industrial_crane' },
        { x: 5918, y: 382, w: 175, h: 20, oneWay: true, style: 'industrial_crane' },
        { x: 6718, y: 382, w: 175, h: 20, oneWay: true, style: 'container_red' },
        { x: 6820, y: 304, w: 170, h: 20, oneWay: true, style: 'container_blue' }
      ],
      geysers: [
        { x: 1228, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.0, height: 185, kind: 'water_spout' },
        { x: 2059, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.85, height: 185, kind: 'water_spout' },
        { x: 2928, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 1.7, height: 185, kind: 'water_spout' },
        { x: 3615, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 2.55, height: 185, kind: 'water_spout' }
      ],
      movingPlatforms: [
        { sx: 1590, sy: 402, w: 106, h: 18, endX: 1704, endY: 368, speed: 120, style: 'industrial_crane' },
        { sx: 4026, sy: 402, w: 106, h: 18, endX: 4140, endY: 368, speed: 120, style: 'industrial_crane' },
        { sx: 6382, sy: 402, w: 106, h: 18, endX: 6496, endY: 368, speed: 120, style: 'industrial_crane' }
      ],
      fallingPlatforms: [
        { x: 2504, y: 418, w: 76, h: 18, style: 'container_yellow', fallDelay: 0.60 },
        { x: 2614, y: 404, w: 76, h: 18, style: 'container_yellow', fallDelay: 0.58 },
        { x: 4860, y: 418, w: 76, h: 18, style: 'container_yellow', fallDelay: 0.60 },
        { x: 4970, y: 404, w: 76, h: 18, style: 'container_yellow', fallDelay: 0.58 },
        { x: 7032, y: 418, w: 76, h: 18, style: 'container_yellow', fallDelay: 0.60 },
        { x: 7120, y: 404, w: 76, h: 18, style: 'container_yellow', fallDelay: 0.58 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1210, y: 338, type: 'coin' },
        { x: 2010, y: 338, type: 'coin' },
        { x: 2258, y: 261, type: 'angel_wings' },
        { x: 3750, y: 261, type: 'empanada' },
        { x: 3794, y: 260, type: 'coin' },
        { x: 4432, y: 336, type: 'coin' },
        { x: 4587, y: 256, type: 'coin' },
        { x: 4759, y: 177, type: 'plant' },
        { x: 5266, y: 338, type: 'coin' },
        { x: 5494, y: 260, type: 'coin' },
        { x: 6002, y: 338, type: 'coin' },
        { x: 6950, y: 416, type: 'coin' }
      ],
      pacificHazards: [
        { x: 954, baseY: 488, period: 2.3000000000000003, height: 162, phase: 0.0, kind: 'pacific_piranha' },
        { x: 1684, baseY: 488, period: 2.4, height: 164, phase: 0.65, kind: 'pacific_piranha' },
        { x: 2571, baseY: 488, period: 2.27, height: 168, phase: 1.4, kind: 'pacific_piranha' },
        { x: 3310, baseY: 488, period: 2.3000000000000003, height: 162, phase: 1.7999999999999998, kind: 'pacific_piranha' },
        { x: 4120, baseY: 488, period: 2.4, height: 164, phase: 0.30000000000000027, kind: 'pacific_piranha' },
        { x: 4927, baseY: 488, period: 2.27, height: 168, phase: 1.1, kind: 'pacific_piranha' }
      ],
      overheadHazards: [
        { x: 1166, y: 118, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 2106, y: 136, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 3146, y: 118, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 4402, y: 136, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 5362, y: 118, w: 44, h: 34, kind: 'cargo_load', label: '' },
        { x: 6238, y: 136, w: 44, h: 34, kind: 'cargo_load', label: '' }
      ],
      portDogs: [
        { x: 1993, y: GROUND_Y, minX: 1831, maxX: 2158, speed: 171 },
        { x: 5551, y: GROUND_Y, minX: 5386, maxX: 5697, speed: 156 }
      ],
      portPelicans: [
        { x: 756, baseY: 138, minX: 536, maxX: 976, speed: 147 },
        { x: 1702, baseY: 202, minX: 1482, maxX: 1922, speed: 159 },
        { x: 2175, baseY: 138, minX: 1955, maxX: 2395, speed: 165 },
        { x: 3120, baseY: 202, minX: 2900, maxX: 3340, speed: 153 },
        { x: 3593, baseY: 138, minX: 3373, maxX: 3813, speed: 159 },
        { x: 4539, baseY: 202, minX: 4319, maxX: 4759, speed: 147 },
        { x: 5485, baseY: 170, minX: 5265, maxX: 5705, speed: 159 },
        { x: 6430, baseY: 138, minX: 6210, maxX: 6650, speed: 147 },
        { x: 6903, baseY: 170, minX: 6683, maxX: 7123, speed: 153 }
      ],
      guasos: [
        { x: 470, y: GROUND_Y, minX: 400, maxX: 580, speed: 88 },
        { x: 1255, y: 382, minX: 1183, maxX: 1343, speed: 74 },
        { x: 2955, y: 382, minX: 2883, maxX: 3043, speed: 74 },
        { x: 4480, y: GROUND_Y, minX: 4400, maxX: 4620, speed: 92 },
        { x: 6845, y: 382, minX: 6773, maxX: 6933, speed: 74 }
      ],
      guasas: [
        { x: 700, y: GROUND_Y, minX: 610, maxX: 810, speed: 86 },
        { x: 1380, y: GROUND_Y, minX: 1300, maxX: 1520, speed: 88 },
        { x: 3610, y: 382, minX: 3538, maxX: 3698, speed: 74 },
        { x: 5310, y: 382, minX: 5238, maxX: 5398, speed: 74 },
        { x: 6045, y: 382, minX: 5973, maxX: 6133, speed: 74 }
      ],
      pumas: [
        { x: 3720, y: GROUND_Y, minX: 3555, maxX: 3885, speed: 134 },
        { x: 6112, y: GROUND_Y, minX: 5947, maxX: 6277, speed: 149 }
      ]
    }
  ];

  const CHILE_ATACAMA_LEVELS = [
    {
      id: 1,
      city: 'chile_atacama',
      name: '1. Valle de la Luna',
      subtitle: 'Dunas esculpidas, puentes frágiles de arcilla y fuertes ráfagas',
      nextDestination: 'Géiseres del Tatio',
      theme: 'ch_atacama_luna',
      musicTheme: 'ch_atacama_luna',
      aiTier: 1,
      timeLimit: 120,
      hasDeadlyPits: true,
      hasWind: true,
      busLine: 'CORDILLERA DE LA SAL · VALLE DE LA LUNA',
      width: 7400,
      spawn: { x: 80, y: 390 },
      flagX: 7080,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'VALLE DE LA LUNA: CRESTAS ROJIZAS FRÁGILES, VIENTO Y CÓNDORES EN PICADA.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'red_rock' },
        { x: 1016, y: GROUND_Y, w: 560, h: 100, style: 'red_rock' },
        { x: 1816, y: GROUND_Y, w: 640, h: 100, style: 'red_rock' },
        { x: 2716, y: GROUND_Y, w: 560, h: 100, style: 'red_rock' },
        { x: 3372, y: GROUND_Y, w: 640, h: 100, style: 'red_rock' },
        { x: 4252, y: GROUND_Y, w: 560, h: 100, style: 'red_rock' },
        { x: 5072, y: GROUND_Y, w: 640, h: 100, style: 'red_rock' },
        { x: 5808, y: GROUND_Y, w: 560, h: 100, style: 'red_rock' },
        { x: 6608, y: GROUND_Y, w: 792, h: 100, style: 'red_rock' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'salt' },
        { x: 1126, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 1926, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 2156, y: 304, w: 170, h: 20, oneWay: true, style: 'salt' },
        { x: 2826, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 3482, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 3712, y: 304, w: 170, h: 20, oneWay: true, style: 'salt' },
        { x: 4362, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 5182, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 5412, y: 304, w: 170, h: 20, oneWay: true, style: 'salt' },
        { x: 5918, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 6718, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 6948, y: 304, w: 170, h: 20, oneWay: true, style: 'salt' }
      ],
      geysers: [
        { x: 1368, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 0.0, height: 185, kind: 'steam' },
        { x: 2388, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 0.85, height: 185, kind: 'steam' },
        { x: 3068, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 1.7, height: 185, kind: 'steam' },
        { x: 3942, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 2.55, height: 185, kind: 'steam' },
        { x: 4610, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 0.8, height: 185, kind: 'steam' },
        { x: 5644, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 1.65, height: 185, kind: 'steam' }
      ],
      movingPlatforms: [
        { sx: 1590, sy: 402, w: 106, h: 18, endX: 1704, endY: 368, speed: 114, style: 'red_rock' },
        { sx: 4026, sy: 402, w: 106, h: 18, endX: 4140, endY: 368, speed: 114, style: 'red_rock' },
        { sx: 6382, sy: 402, w: 106, h: 18, endX: 6496, endY: 368, speed: 114, style: 'red_rock' }
      ],
      fallingPlatforms: [
        { x: 2504, y: 418, w: 76, h: 18, style: 'red_rock', fallDelay: 0.64 },
        { x: 2614, y: 404, w: 76, h: 18, style: 'red_rock', fallDelay: 0.62 },
        { x: 4860, y: 418, w: 76, h: 18, style: 'red_rock', fallDelay: 0.64 },
        { x: 4970, y: 404, w: 76, h: 18, style: 'red_rock', fallDelay: 0.62 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1210, y: 338, type: 'coin' },
        { x: 2010, y: 338, type: 'coin' },
        { x: 3794, y: 260, type: 'coin' },
        { x: 3871, y: 417, type: 'empanada' },
        { x: 4446, y: 338, type: 'coin' },
        { x: 5266, y: 338, type: 'coin' },
        { x: 5494, y: 260, type: 'coin' },
        { x: 6002, y: 338, type: 'coin' },
        { x: 6890, y: 416, type: 'coin' },
        { x: 7030, y: 260, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2267, y: 182, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5945, y: 260, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1166, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 2106, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 3146, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 3522, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 4542, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 5502, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' }
      ],
      vicunas: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 98 },
        { x: 1433, y: GROUND_Y, minX: 1268, maxX: 1561, speed: 108 },
        { x: 1993, y: GROUND_Y, minX: 1831, maxX: 2158, speed: 113 },
        { x: 3020, y: GROUND_Y, minX: 2855, maxX: 3185, speed: 98 },
        { x: 3549, y: GROUND_Y, minX: 3387, maxX: 3714, speed: 108 },
        { x: 4556, y: GROUND_Y, minX: 4391, maxX: 4721, speed: 113 },
        { x: 5551, y: GROUND_Y, minX: 5386, maxX: 5697, speed: 98 },
        { x: 6112, y: GROUND_Y, minX: 5947, maxX: 6277, speed: 108 },
        { x: 6859, y: GROUND_Y, minX: 6694, maxX: 7024, speed: 113 }
      ],
      condors: [
        { x: 783, baseY: 148, minX: 563, maxX: 1003, speed: 156 },
        { x: 1310, baseY: 180, minX: 1090, maxX: 1530, speed: 162 },
        { x: 2363, baseY: 148, minX: 2143, maxX: 2583, speed: 174 },
        { x: 2890, baseY: 180, minX: 2670, maxX: 3110, speed: 156 },
        { x: 3416, baseY: 212, minX: 3196, maxX: 3636, speed: 162 },
        { x: 4470, baseY: 180, minX: 4250, maxX: 4690, speed: 174 },
        { x: 4996, baseY: 212, minX: 4776, maxX: 5216, speed: 156 },
        { x: 6050, baseY: 180, minX: 5830, maxX: 6270, speed: 168 },
        { x: 6576, baseY: 212, minX: 6356, maxX: 6796, speed: 174 }
      ],
      pumas: [
        { x: 684, y: GROUND_Y, minX: 519, maxX: 849, speed: 135 },
        { x: 1433, y: GROUND_Y, minX: 1268, maxX: 1561, speed: 140 },
        { x: 1993, y: GROUND_Y, minX: 1831, maxX: 2158, speed: 145 },
        { x: 3851, y: GROUND_Y, minX: 3686, maxX: 3997, speed: 135 },
        { x: 4409, y: GROUND_Y, minX: 4267, maxX: 4574, speed: 140 },
        { x: 5420, y: GROUND_Y, minX: 5255, maxX: 5585, speed: 145 },
        { x: 6225, y: GROUND_Y, minX: 6060, maxX: 6353, speed: 130 }
      ]
    },
    {
      id: 2,
      city: 'chile_atacama',
      name: '2. Géiseres del Tatio',
      subtitle: 'Fumarolas termales del altiplano a 4.300m entre abismos, vicuñas y cóndores',
      nextDestination: 'Salar de Atacama',
      theme: 'ch_atacama_tatio',
      musicTheme: 'ch_atacama_tatio',
      aiTier: 2,
      timeLimit: 120,
      hasDeadlyPits: true,
      busLine: 'ALTIPLANO ANDINO · GÉISERES DEL TATIO',
      width: 6600,
      spawn: { x: 80, y: 390 },
      flagX: 6280,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'EL TATIO: ESPERÁ QUE BAJE EL VAPOR, SALTÁ LOS ABISMOS Y BLOQUEÁ EL SALITRE CON [Z].' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'basalt' },
        { x: 1050, y: GROUND_Y, w: 730, h: 100, style: 'basalt' },
        { x: 2010, y: GROUND_Y, w: 550, h: 100, style: 'basalt' },
        { x: 2790, y: GROUND_Y, w: 600, h: 100, style: 'basalt' },
        { x: 3540, y: GROUND_Y, w: 680, h: 100, style: 'basalt' },
        { x: 4460, y: GROUND_Y, w: 680, h: 100, style: 'basalt' },
        { x: 5375, y: GROUND_Y, w: 545, h: 100, style: 'basalt' },
        { x: 6070, y: GROUND_Y, w: 530, h: 100, style: 'basalt' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 1210, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 1470, y: 304, w: 170, h: 20, oneWay: true, style: 'red_rock' },
        { x: 2110, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 3000, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 3715, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 3915, y: 304, w: 170, h: 20, oneWay: true, style: 'red_rock' },
        { x: 4510, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 5475, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 6150, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' }
      ],
      geysers: [
        { x: 1132, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 0.0, height: 185, kind: 'steam' },
        { x: 1700, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 0.85, height: 185, kind: 'steam' },
        { x: 2355, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 1.7, height: 185, kind: 'steam' },
        { x: 2923, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 2.55, height: 185, kind: 'steam' },
        { x: 3640, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 0.8, height: 185, kind: 'steam' },
        { x: 4145, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 1.65, height: 185, kind: 'steam' },
        { x: 4755, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 2.5, height: 185, kind: 'steam' }
      ],
      movingPlatforms: [
        { sx: 905, sy: 412, w: 135, h: 18, endX: 905, endY: 298, speed: 78, style: 'steel' },
        { sx: 1842, sy: 422, w: 104, h: 18, endX: 1842, endY: 266, speed: 106, style: 'red_rock' },
        { sx: 3395, sy: 412, w: 140, h: 18, endX: 3395, endY: 298, speed: 82, style: 'steel' },
        { sx: 4262, sy: 404, w: 108, h: 18, endX: 4380, endY: 404, speed: 110, style: 'basalt' },
        { sx: 5925, sy: 412, w: 140, h: 18, endX: 5925, endY: 298, speed: 86, style: 'steel' }
      ],
      fallingPlatforms: [
        { x: 2600, y: 416, w: 78, h: 18, style: 'basalt', fallDelay: 0.50 },
        { x: 2692, y: 398, w: 78, h: 18, style: 'basalt', fallDelay: 0.50 },
        { x: 5180, y: 416, w: 78, h: 18, style: 'basalt', fallDelay: 0.50 },
        { x: 5274, y: 398, w: 78, h: 18, style: 'basalt', fallDelay: 0.50 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 975, y: 268, type: 'coin' },
        { x: 1292, y: 338, type: 'coin' },
        { x: 3074, y: 339, type: 'empanada' },
        { x: 3465, y: 268, type: 'coin' },
        { x: 3792, y: 338, type: 'coin' },
        { x: 3995, y: 260, type: 'coin' },
        { x: 4632, y: 338, type: 'coin' },
        { x: 6150, y: 416, type: 'coin' },
        { x: 6234, y: 338, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2207, y: 260, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 4582, y: 260, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      vicunas: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 80 },
        { x: 1380, y: GROUND_Y, minX: 1180, maxX: 1640, speed: 90 },
        { x: 2240, y: GROUND_Y, minX: 2040, maxX: 2530, speed: 95 },
        { x: 3820, y: GROUND_Y, minX: 3670, maxX: 4080, speed: 90 },
        { x: 4860, y: GROUND_Y, minX: 4765, maxX: 5115, speed: 95 },
        { x: 5620, y: GROUND_Y, minX: 5400, maxX: 5895, speed: 82 },
        { x: 6200, y: GROUND_Y, minX: 6090, maxX: 6420, speed: 88 }
      ],
      condors: [
        { x: 750, baseY: 148, minX: 530, maxX: 970, speed: 134 },
        { x: 1670, baseY: 212, minX: 1450, maxX: 1890, speed: 146 },
        { x: 2130, baseY: 148, minX: 1910, maxX: 2350, speed: 152 },
        { x: 2590, baseY: 180, minX: 2370, maxX: 2810, speed: 134 },
        { x: 3510, baseY: 148, minX: 3290, maxX: 3730, speed: 146 },
        { x: 3970, baseY: 180, minX: 3750, maxX: 4190, speed: 152 },
        { x: 4430, baseY: 212, minX: 4210, maxX: 4650, speed: 134 },
        { x: 5350, baseY: 180, minX: 5130, maxX: 5570, speed: 146 },
        { x: 5810, baseY: 212, minX: 5590, maxX: 6030, speed: 152 }
      ]
    },
    {
      id: 3,
      city: 'chile_atacama',
      name: '3. Salar de Atacama',
      subtitle: 'Costra de sal resbaladiza sobre lagunas turquesa y estalactitas',
      nextDestination: 'Observatorio Astronómico ALMA',
      theme: 'ch_atacama_salar',
      musicTheme: 'ch_atacama_salar',
      aiTier: 3,
      timeLimit: 120,
      hasWaterPits: true,
      hasSaltPhysics: true,
      busLine: 'LAGUNA CHAXA · SALAR DE ATACAMA',
      width: 7000,
      spawn: { x: 80, y: 390 },
      flagX: 6680,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'COSTRA DE SAL RESBALADIZA: FRENÁ ANTES DE CADA LAGUNA Y GÉISER DE AGUA.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'salt' },
        { x: 1028, y: GROUND_Y, w: 560, h: 100, style: 'salt' },
        { x: 1828, y: GROUND_Y, w: 640, h: 100, style: 'salt' },
        { x: 2576, y: GROUND_Y, w: 560, h: 100, style: 'salt' },
        { x: 3244, y: GROUND_Y, w: 640, h: 100, style: 'salt' },
        { x: 4124, y: GROUND_Y, w: 560, h: 100, style: 'salt' },
        { x: 4792, y: GROUND_Y, w: 640, h: 100, style: 'salt' },
        { x: 5540, y: GROUND_Y, w: 560, h: 100, style: 'salt' },
        { x: 6340, y: GROUND_Y, w: 660, h: 100, style: 'salt' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'red_rock' },
        { x: 1138, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 1938, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 2168, y: 304, w: 170, h: 20, oneWay: true, style: 'red_rock' },
        { x: 2686, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 3354, y: 380, w: 140, h: 20, oneWay: true, style: 'salt' },
        { x: 3509, y: 300, w: 140, h: 20, oneWay: true, style: 'red_rock' },
        { x: 3659, y: 220, w: 155, h: 20, oneWay: true, style: 'salt' },
        { x: 4234, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 4902, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 5132, y: 304, w: 170, h: 20, oneWay: true, style: 'red_rock' },
        { x: 5650, y: 382, w: 175, h: 20, oneWay: true, style: 'red_rock' },
        { x: 6450, y: 382, w: 175, h: 20, oneWay: true, style: 'salt' },
        { x: 6680, y: 304, w: 170, h: 20, oneWay: true, style: 'red_rock' }
      ],
      geysers: [
        { x: 1375, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 0.0, height: 185, kind: 'water_spout' },
        { x: 2395, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 0.85, height: 185, kind: 'steam' },
        { x: 2930, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 1.7, height: 185, kind: 'water_spout' },
        { x: 3296, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 2.55, height: 185, kind: 'steam' },
        { x: 4480, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 0.8, height: 185, kind: 'water_spout' },
        { x: 5362, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 1.65, height: 185, kind: 'steam' }
      ],
      movingPlatforms: [
        { sx: 1602, sy: 402, w: 106, h: 18, endX: 1716, endY: 368, speed: 108, style: 'salt' },
        { sx: 3898, sy: 402, w: 106, h: 18, endX: 4012, endY: 368, speed: 108, style: 'salt' },
        { sx: 6114, sy: 402, w: 106, h: 18, endX: 6228, endY: 368, speed: 108, style: 'salt' }
      ],
      fallingPlatforms: [
      ],
      hiddenBlocks: [
        { x: 3720, y: 136, w: 32, h: 32, item: 'golden_bone', style: 'secret_gold' }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1222, y: 338, type: 'coin' },
        { x: 2022, y: 338, type: 'coin' },
        { x: 3424, y: 336, type: 'coin' },
        { x: 3579, y: 256, type: 'coin' },
        { x: 3692, y: 177, type: 'empanada' },
        { x: 4318, y: 338, type: 'coin' },
        { x: 4986, y: 338, type: 'coin' },
        { x: 5173, y: 261, type: 'plant' },
        { x: 5214, y: 260, type: 'coin' },
        { x: 5734, y: 338, type: 'coin' },
        { x: 6490, y: 416, type: 'coin' },
        { x: 6762, y: 260, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2279, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1178, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 2118, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 3006, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 4274, y: 136, w: 34, h: 42, kind: 'stalactite', label: '' },
        { x: 5082, y: 118, w: 34, h: 42, kind: 'stalactite', label: '' }
      ],
      vicunas: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 90 },
        { x: 1445, y: GROUND_Y, minX: 1280, maxX: 1573, speed: 100 },
        { x: 2005, y: GROUND_Y, minX: 1843, maxX: 2170, speed: 105 },
        { x: 2880, y: GROUND_Y, minX: 2715, maxX: 3045, speed: 90 },
        { x: 3421, y: GROUND_Y, minX: 3259, maxX: 3586, speed: 100 },
        { x: 4428, y: GROUND_Y, minX: 4263, maxX: 4593, speed: 105 },
        { x: 5271, y: GROUND_Y, minX: 5106, maxX: 5417, speed: 90 },
        { x: 5844, y: GROUND_Y, minX: 5679, maxX: 6009, speed: 100 },
        { x: 6843, y: GROUND_Y, minX: 6678, maxX: 6985, speed: 105 }
      ],
      condors: [
        { x: 816, baseY: 148, minX: 596, maxX: 1036, speed: 145 },
        { x: 2000, baseY: 212, minX: 1780, maxX: 2220, speed: 157 },
        { x: 2592, baseY: 148, minX: 2372, maxX: 2812, speed: 163 },
        { x: 3184, baseY: 180, minX: 2964, maxX: 3404, speed: 145 },
        { x: 4368, baseY: 148, minX: 4148, maxX: 4588, speed: 157 },
        { x: 4960, baseY: 180, minX: 4740, maxX: 5180, speed: 163 },
        { x: 6144, baseY: 148, minX: 5924, maxX: 6364, speed: 151 }
      ],
      pumas: [
        { x: 1332, y: GROUND_Y, minX: 1167, maxX: 1497, speed: 125 },
        { x: 2307, y: GROUND_Y, minX: 2142, maxX: 2453, speed: 130 },
        { x: 2733, y: GROUND_Y, minX: 2591, maxX: 2898, speed: 135 },
        { x: 3592, y: GROUND_Y, minX: 3427, maxX: 3757, speed: 120 },
        { x: 4541, y: GROUND_Y, minX: 4376, maxX: 4669, speed: 125 },
        { x: 5844, y: GROUND_Y, minX: 5679, maxX: 6009, speed: 135 }
      ]
    },
    {
      id: 4,
      city: 'chile_atacama',
      name: '4. Observatorio Astronómico ALMA',
      subtitle: 'Radiotelescopios gigantes en el Llano de Chajnantor a 5.000m bajo el cielo azul andino',
      nextDestination: 'Isla de Pascua (Rapa Nui)',
      theme: 'ch_atacama_alma',
      musicTheme: 'ch_atacama_alma',
      aiTier: 4,
      timeLimit: 120,
      hasDeadlyPits: true,
      hasWind: true,
      busLine: 'LLANO DE CHAJNANTOR · ALMA 5.000m',
      width: 7700,
      spawn: { x: 80, y: 390 },
      flagX: 7380,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'OBSERVATORIO ALMA A 5.000M: CUIDADO CON EL HIELO QUE CAE Y LA FAUNA ANDINA.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'observatory' },
        { x: 1016, y: GROUND_Y, w: 560, h: 100, style: 'steel' },
        { x: 1816, y: GROUND_Y, w: 640, h: 100, style: 'observatory' },
        { x: 2716, y: GROUND_Y, w: 560, h: 100, style: 'steel' },
        { x: 3372, y: GROUND_Y, w: 640, h: 100, style: 'observatory' },
        { x: 4252, y: GROUND_Y, w: 560, h: 100, style: 'steel' },
        { x: 5072, y: GROUND_Y, w: 640, h: 100, style: 'observatory' },
        { x: 5808, y: GROUND_Y, w: 560, h: 100, style: 'steel' },
        { x: 6608, y: GROUND_Y, w: 400, h: 100, style: 'observatory' },
        { x: 7208, y: GROUND_Y, w: 492, h: 100, style: 'steel' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'observatory' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 1126, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 1926, y: 382, w: 175, h: 20, oneWay: true, style: 'observatory' },
        { x: 2156, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 2826, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 3482, y: 382, w: 175, h: 20, oneWay: true, style: 'observatory' },
        { x: 3712, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 4362, y: 380, w: 140, h: 20, oneWay: true, style: 'steel' },
        { x: 4517, y: 300, w: 140, h: 20, oneWay: true, style: 'observatory' },
        { x: 4667, y: 220, w: 155, h: 20, oneWay: true, style: 'steel' },
        { x: 5182, y: 382, w: 175, h: 20, oneWay: true, style: 'observatory' },
        { x: 5412, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 5918, y: 382, w: 175, h: 20, oneWay: true, style: 'steel' },
        { x: 6718, y: 382, w: 175, h: 20, oneWay: true, style: 'observatory' },
        { x: 6820, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' }
      ],
      geysers: [
        { x: 1368, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.0, height: 185, kind: 'steam' },
        { x: 2388, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.85, height: 185, kind: 'steam' },
        { x: 3068, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 1.7, height: 185, kind: 'steam' },
        { x: 3942, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 2.55, height: 185, kind: 'steam' },
        { x: 4305, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.8, height: 185, kind: 'steam' },
        { x: 5644, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 1.65, height: 185, kind: 'steam' }
      ],
      movingPlatforms: [
        { sx: 1590, sy: 402, w: 106, h: 18, endX: 1704, endY: 368, speed: 120, style: 'observatory' },
        { sx: 4026, sy: 402, w: 106, h: 18, endX: 4140, endY: 368, speed: 120, style: 'observatory' },
        { sx: 6382, sy: 402, w: 106, h: 18, endX: 6496, endY: 368, speed: 120, style: 'observatory' }
      ],
      fallingPlatforms: [
        { x: 2504, y: 418, w: 76, h: 18, style: 'steel', fallDelay: 0.60 },
        { x: 2614, y: 404, w: 76, h: 18, style: 'steel', fallDelay: 0.58 },
        { x: 4860, y: 418, w: 76, h: 18, style: 'steel', fallDelay: 0.60 },
        { x: 4970, y: 404, w: 76, h: 18, style: 'steel', fallDelay: 0.58 },
        { x: 7032, y: 418, w: 76, h: 18, style: 'steel', fallDelay: 0.60 },
        { x: 7120, y: 404, w: 76, h: 18, style: 'steel', fallDelay: 0.58 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1210, y: 338, type: 'coin' },
        { x: 2010, y: 338, type: 'coin' },
        { x: 3750, y: 261, type: 'empanada' },
        { x: 3794, y: 260, type: 'coin' },
        { x: 4432, y: 336, type: 'coin' },
        { x: 4587, y: 256, type: 'coin' },
        { x: 4759, y: 177, type: 'plant' },
        { x: 5266, y: 338, type: 'coin' },
        { x: 5494, y: 260, type: 'coin' },
        { x: 6002, y: 338, type: 'coin' },
        { x: 6950, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2267, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1166, y: 118, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 2106, y: 136, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 3146, y: 118, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 4402, y: 136, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 5362, y: 118, w: 34, h: 42, kind: 'icicle', label: '' },
        { x: 6238, y: 136, w: 34, h: 42, kind: 'icicle', label: '' }
      ],
      vicunas: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 106 },
        { x: 1433, y: GROUND_Y, minX: 1268, maxX: 1561, speed: 116 },
        { x: 1993, y: GROUND_Y, minX: 1831, maxX: 2158, speed: 121 },
        { x: 3020, y: GROUND_Y, minX: 2855, maxX: 3185, speed: 106 },
        { x: 3549, y: GROUND_Y, minX: 3387, maxX: 3714, speed: 116 },
        { x: 4556, y: GROUND_Y, minX: 4391, maxX: 4721, speed: 121 },
        { x: 5551, y: GROUND_Y, minX: 5386, maxX: 5697, speed: 106 },
        { x: 6112, y: GROUND_Y, minX: 5947, maxX: 6277, speed: 116 },
        { x: 6847, y: GROUND_Y, minX: 6682, maxX: 6993, speed: 121 }
      ],
      condors: [
        { x: 756, baseY: 148, minX: 536, maxX: 976, speed: 167 },
        { x: 1229, baseY: 180, minX: 1009, maxX: 1449, speed: 173 },
        { x: 2175, baseY: 148, minX: 1955, maxX: 2395, speed: 185 },
        { x: 2647, baseY: 180, minX: 2427, maxX: 2867, speed: 167 },
        { x: 3120, baseY: 212, minX: 2900, maxX: 3340, speed: 173 },
        { x: 4066, baseY: 180, minX: 3846, maxX: 4286, speed: 185 },
        { x: 4539, baseY: 212, minX: 4319, maxX: 4759, speed: 167 },
        { x: 5012, baseY: 148, minX: 4792, maxX: 5232, speed: 173 },
        { x: 5957, baseY: 212, minX: 5737, maxX: 6177, speed: 185 },
        { x: 6430, baseY: 148, minX: 6210, maxX: 6650, speed: 167 },
        { x: 6903, baseY: 180, minX: 6683, maxX: 7123, speed: 173 }
      ],
      pumas: [
        { x: 684, y: GROUND_Y, minX: 519, maxX: 849, speed: 143 },
        { x: 1433, y: GROUND_Y, minX: 1268, maxX: 1561, speed: 148 },
        { x: 1993, y: GROUND_Y, minX: 1831, maxX: 2158, speed: 153 },
        { x: 3851, y: GROUND_Y, minX: 3686, maxX: 3997, speed: 143 },
        { x: 4409, y: GROUND_Y, minX: 4267, maxX: 4574, speed: 148 },
        { x: 5420, y: GROUND_Y, minX: 5255, maxX: 5585, speed: 153 },
        { x: 6785, y: GROUND_Y, minX: 6623, maxX: 6950, speed: 143 }
      ]
    }
  ];

  const CHILE_PASCUA_LEVELS = [
    {
      id: 1,
      city: 'chile_pascua',
      name: '1. Ahu Tongariki',
      subtitle: 'Amanecer ceremonial en los 15 Moáis de piedra volcánica y primeras fragatas',
      nextDestination: 'Volcán Rano Raraku',
      theme: 'ch_pascua_tongariki',
      musicTheme: 'ch_pascua_tongariki',
      aiTier: 2,
      timeLimit: 120,
      hasDeadlyPits: true,
      busLine: 'AHU TONGARIKI · LOS 15 MOÁIS',
      width: 6800,
      spawn: { x: 80, y: 390 },
      flagX: 6480,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'AHU TONGARIKI: GUERREROS CON MÁSCARA [Z/C], ABISMOS VOLCÁNICOS Y FRAGATAS EN EL CIELO.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 900, h: 100, style: 'moai_stone' },
        { x: 1050, y: GROUND_Y, w: 750, h: 100, style: 'basalt' },
        { x: 2035, y: GROUND_Y, w: 645, h: 100, style: 'moai_stone' },
        { x: 2830, y: GROUND_Y, w: 810, h: 100, style: 'basalt' },
        { x: 3880, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 4755, y: GROUND_Y, w: 625, h: 100, style: 'basalt' },
        { x: 5530, y: GROUND_Y, w: 570, h: 100, style: 'moai_stone' },
        { x: 6320, y: GROUND_Y, w: 480, h: 100, style: 'moai_stone' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'steel' },
        { x: 880, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 1150, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 1580, y: 304, w: 170, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 2135, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 2660, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 2930, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 3360, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 3980, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 4210, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 4855, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 5360, y: 312, w: 190, h: 20, oneWay: true, style: 'steel' },
        { x: 5630, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 6390, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 2425, y: 172, w: 66, h: 16, oneWay: true, style: 'moai_stone' }
      ],
      geysers: [
        { x: 1132, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 0.0, height: 185, kind: 'lava_spout' },
        { x: 1723, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 0.85, height: 185, kind: 'lava_spout' },
        { x: 2332, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 1.7, height: 185, kind: 'lava_spout' },
        { x: 2923, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 2.55, height: 185, kind: 'lava_spout' },
        { x: 3532, y: GROUND_Y, period: 3.26, eruptDuration: 1.43, phase: 0.8, height: 185, kind: 'lava_spout' }
      ],
      movingPlatforms: [
        { sx: 1865, sy: 422, w: 104, h: 18, endX: 1865, endY: 266, speed: 108, style: 'moai_stone' },
        { sx: 3680, sy: 404, w: 108, h: 18, endX: 3800, endY: 404, speed: 112, style: 'basalt' },
        { sx: 6158, sy: 422, w: 104, h: 18, endX: 6158, endY: 272, speed: 112, style: 'moai_stone' }
      ],
      fallingPlatforms: [
        { x: 2055, y: 248, w: 56, h: 16, fallDelay: 0.40, style: 'volcano' },
        { x: 2180, y: 204, w: 56, h: 16, fallDelay: 0.40, style: 'volcano' },
        { x: 2305, y: 172, w: 56, h: 16, fallDelay: 0.40, style: 'volcano' },
        { x: 4560, y: 416, w: 78, h: 18, fallDelay: 0.50, style: 'volcano' },
        { x: 4654, y: 398, w: 78, h: 18, fallDelay: 0.50, style: 'volcano' }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 975, y: 268, type: 'coin' },
        { x: 1234, y: 338, type: 'coin' },
        { x: 2445, y: 132, type: 'golden_bone' },
        { x: 3398, y: 261, type: 'empanada' },
        { x: 3442, y: 260, type: 'coin' },
        { x: 4064, y: 338, type: 'coin' },
        { x: 4292, y: 260, type: 'coin' },
        { x: 4939, y: 338, type: 'coin' },
        { x: 5714, y: 338, type: 'coin' },
        { x: 6360, y: 416, type: 'coin' },
        { x: 6474, y: 338, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2691, y: 190, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5391, y: 190, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1120, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 1660, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 3110, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 4030, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 5750, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' }
      ],
      rapaNuiWarriors: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 86 },
        { x: 700, y: GROUND_Y, minX: 540, maxX: 878, speed: 91 },
        { x: 1400, y: GROUND_Y, minX: 1180, maxX: 1660, speed: 96 },
        { x: 2480, y: GROUND_Y, minX: 2370, maxX: 2660, speed: 101 },
        { x: 3190, y: GROUND_Y, minX: 2960, maxX: 3480, speed: 92 },
        { x: 4180, y: GROUND_Y, minX: 3910, maxX: 4480, speed: 96 },
        { x: 5040, y: GROUND_Y, minX: 4780, maxX: 5340, speed: 101 },
        { x: 5820, y: GROUND_Y, minX: 5560, maxX: 6070, speed: 94 },
        { x: 6460, y: GROUND_Y, minX: 6340, maxX: 6680, speed: 101 }
      ],
      frigates: [
        { x: 758, baseY: 148, minX: 538, maxX: 978, ampY: 22, speed: 134 },
        { x: 1235, baseY: 180, minX: 1015, maxX: 1455, ampY: 28, speed: 140 },
        { x: 1711, baseY: 212, minX: 1491, maxX: 1931, ampY: 34, speed: 146 },
        { x: 2188, baseY: 148, minX: 1968, maxX: 2408, ampY: 22, speed: 152 },
        { x: 2665, baseY: 180, minX: 2445, maxX: 2885, ampY: 28, speed: 134 },
        { x: 3141, baseY: 212, minX: 2921, maxX: 3361, ampY: 34, speed: 140 },
        { x: 3618, baseY: 148, minX: 3398, maxX: 3838, ampY: 22, speed: 146 },
        { x: 4095, baseY: 180, minX: 3875, maxX: 4315, ampY: 28, speed: 152 },
        { x: 4571, baseY: 212, minX: 4351, maxX: 4791, ampY: 34, speed: 134 },
        { x: 5048, baseY: 148, minX: 4828, maxX: 5268, ampY: 22, speed: 140 },
        { x: 5525, baseY: 180, minX: 5305, maxX: 5745, ampY: 28, speed: 146 },
        { x: 6001, baseY: 212, minX: 5781, maxX: 6221, ampY: 34, speed: 152 }
      ]
    },
    {
      id: 2,
      city: 'chile_pascua',
      name: '2. Volcán Rano Raraku',
      subtitle: 'Praderas de toba volcánica en la gran cantera de Moáis, magma y rocas ardientes',
      nextDestination: 'Playa Anakena',
      theme: 'ch_pascua_raraku',
      musicTheme: 'ch_pascua_raraku',
      aiTier: 3,
      timeLimit: 120,
      hasDeadlyPits: true,
      busLine: 'VOLCÁN RANO RARAKU · CANTERA DE MOÁIS',
      width: 7100,
      spawn: { x: 80, y: 390 },
      flagX: 6780,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'VOLCÁN RANO RARAKU: ROCAS VOLCÁNICAS DEL CRÁTER, GÉISERES DE LAVA Y GUERREROS.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'moai_stone' },
        { x: 1028, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 1828, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 2576, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 3244, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 4124, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 4792, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 5540, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 6340, y: GROUND_Y, w: 760, h: 100, style: 'moai_stone' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 1138, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 1938, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 2168, y: 304, w: 170, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 2686, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 3354, y: 380, w: 140, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 3509, y: 300, w: 140, h: 20, oneWay: true, style: 'basalt' },
        { x: 3659, y: 220, w: 155, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 4234, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 4902, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 5132, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 5650, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 6450, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 6680, y: 304, w: 170, h: 20, oneWay: true, style: 'moai_stone' }
      ],
      geysers: [
        { x: 1390, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 0.0, height: 185, kind: 'lava_spout' },
        { x: 2385, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 0.85, height: 185, kind: 'lava_spout' },
        { x: 2940, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 1.7, height: 185, kind: 'lava_spout' },
        { x: 4520, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 2.55, height: 185, kind: 'lava_spout' },
        { x: 5920, y: GROUND_Y, period: 3.12, eruptDuration: 1.51, phase: 1.1, height: 185, kind: 'lava_spout' }
      ],
      movingPlatforms: [
        { sx: 1602, sy: 402, w: 106, h: 18, endX: 1716, endY: 368, speed: 108, style: 'moai_stone' },
        { sx: 3898, sy: 402, w: 106, h: 18, endX: 4012, endY: 368, speed: 108, style: 'moai_stone' },
        { sx: 6114, sy: 402, w: 106, h: 18, endX: 6228, endY: 368, speed: 108, style: 'moai_stone' }
      ],
      fallingPlatforms: [
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1222, y: 338, type: 'coin' },
        { x: 2022, y: 338, type: 'coin' },
        { x: 3424, y: 336, type: 'coin' },
        { x: 3579, y: 256, type: 'coin' },
        { x: 3692, y: 177, type: 'empanada' },
        { x: 4318, y: 338, type: 'coin' },
        { x: 4986, y: 338, type: 'coin' },
        { x: 5173, y: 261, type: 'plant' },
        { x: 5214, y: 260, type: 'coin' },
        { x: 5734, y: 338, type: 'coin' },
        { x: 6590, y: 416, type: 'coin' },
        { x: 6762, y: 260, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2279, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      overheadHazards: [
        { x: 1380, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 2320, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 2940, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 4520, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 5780, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 6520, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' }
      ],
      rapaNuiWarriors: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 92 },
        { x: 684, y: GROUND_Y, minX: 519, maxX: 849, speed: 96 },
        { x: 1185, y: GROUND_Y, minX: 1043, maxX: 1350, speed: 100 },
        { x: 1445, y: GROUND_Y, minX: 1280, maxX: 1573, speed: 104 },
        { x: 2176, y: GROUND_Y, minX: 2011, maxX: 2341, speed: 96 },
        { x: 2307, y: GROUND_Y, minX: 2142, maxX: 2453, speed: 100 },
        { x: 2850, y: GROUND_Y, minX: 2640, maxX: 3045, speed: 104 },
        { x: 3421, y: GROUND_Y, minX: 3259, maxX: 3586, speed: 98 },
        { x: 3723, y: GROUND_Y, minX: 3558, maxX: 3869, speed: 102 },
        { x: 4428, y: GROUND_Y, minX: 4263, maxX: 4593, speed: 104 },
        { x: 4969, y: GROUND_Y, minX: 4807, maxX: 5134, speed: 98 },
        { x: 5140, y: GROUND_Y, minX: 4975, maxX: 5305, speed: 102 },
        { x: 5780, y: GROUND_Y, minX: 5580, maxX: 6020, speed: 105 },
        { x: 6566, y: GROUND_Y, minX: 6401, maxX: 6731, speed: 106 }
      ],
      frigates: [
        { x: 735, baseY: 148, minX: 515, maxX: 955, ampY: 22, speed: 140 },
        { x: 1165, baseY: 180, minX: 945, maxX: 1385, ampY: 28, speed: 146 },
        { x: 1595, baseY: 212, minX: 1375, maxX: 1815, ampY: 34, speed: 152 },
        { x: 2025, baseY: 148, minX: 1805, maxX: 2245, ampY: 22, speed: 158 },
        { x: 2455, baseY: 180, minX: 2235, maxX: 2675, ampY: 28, speed: 140 },
        { x: 2885, baseY: 212, minX: 2665, maxX: 3105, ampY: 34, speed: 146 },
        { x: 3315, baseY: 148, minX: 3095, maxX: 3535, ampY: 22, speed: 152 },
        { x: 3745, baseY: 180, minX: 3525, maxX: 3965, ampY: 28, speed: 158 },
        { x: 4175, baseY: 212, minX: 3955, maxX: 4395, ampY: 34, speed: 140 },
        { x: 4605, baseY: 148, minX: 4385, maxX: 4825, ampY: 22, speed: 146 },
        { x: 5035, baseY: 180, minX: 4815, maxX: 5255, ampY: 28, speed: 152 },
        { x: 5465, baseY: 212, minX: 5245, maxX: 5685, ampY: 34, speed: 158 },
        { x: 5980, baseY: 148, minX: 5760, maxX: 6200, ampY: 22, speed: 146 }
      ]
    },
    {
      id: 3,
      city: 'chile_pascua',
      name: '3. Playa Anakena',
      subtitle: 'Arenas blancas polinesias, palmeras, Moáis con Pukao y peces del Pacífico',
      nextDestination: 'Volcán Rano Kau',
      theme: 'ch_pascua_anakena',
      musicTheme: 'ch_pascua_anakena',
      aiTier: 3,
      timeLimit: 120,
      hasWaterPits: true,
      hasWind: true,
      busLine: 'AHU NAU NAU · PLAYA ANAKENA',
      width: 7500,
      spawn: { x: 80, y: 390 },
      flagX: 7180,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: 'PLAYA ANAKENA: PIRAÑAS DEL PACÍFICO SALTAN DESDE LAS OLAS Y LOS GÉISERES QUEMAN.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'tropical_sand' },
        { x: 1016, y: GROUND_Y, w: 560, h: 100, style: 'moai_stone' },
        { x: 1816, y: GROUND_Y, w: 640, h: 100, style: 'tropical_sand' },
        { x: 2716, y: GROUND_Y, w: 560, h: 100, style: 'moai_stone' },
        { x: 3372, y: GROUND_Y, w: 640, h: 100, style: 'tropical_sand' },
        { x: 4252, y: GROUND_Y, w: 560, h: 100, style: 'moai_stone' },
        { x: 5072, y: GROUND_Y, w: 640, h: 100, style: 'tropical_sand' },
        { x: 5808, y: GROUND_Y, w: 560, h: 100, style: 'moai_stone' },
        { x: 6608, y: GROUND_Y, w: 892, h: 100, style: 'tropical_sand' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'branch' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 1126, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 1926, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 2156, y: 304, w: 170, h: 20, oneWay: true, style: 'branch' },
        { x: 2826, y: 382, w: 175, h: 20, oneWay: true, style: 'branch' },
        { x: 3482, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 3712, y: 304, w: 170, h: 20, oneWay: true, style: 'wood' },
        { x: 4362, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 5182, y: 382, w: 175, h: 20, oneWay: true, style: 'branch' },
        { x: 5412, y: 304, w: 170, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 5918, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 6718, y: 382, w: 175, h: 20, oneWay: true, style: 'wood' },
        { x: 6948, y: 304, w: 170, h: 20, oneWay: true, style: 'branch' }
      ],
      geysers: [
        { x: 1410, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 0.0, height: 185, kind: 'water_spout' },
        { x: 2385, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 0.85, height: 185, kind: 'water_spout' },
        { x: 3110, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 1.7, height: 185, kind: 'water_spout' },
        { x: 3940, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 2.55, height: 185, kind: 'water_spout' },
        { x: 4635, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 0.8, height: 185, kind: 'water_spout' },
        { x: 5640, y: GROUND_Y, period: 2.98, eruptDuration: 1.59, phase: 1.65, height: 185, kind: 'water_spout' }
      ],
      movingPlatforms: [
        { sx: 1590, sy: 402, w: 106, h: 18, endX: 1704, endY: 368, speed: 114, style: 'wood' },
        { sx: 4026, sy: 402, w: 106, h: 18, endX: 4140, endY: 368, speed: 114, style: 'wood' },
        { sx: 6382, sy: 402, w: 106, h: 18, endX: 6496, endY: 368, speed: 114, style: 'wood' }
      ],
      fallingPlatforms: [
        { x: 2504, y: 418, w: 76, h: 18, style: 'basalt', fallDelay: 0.64 },
        { x: 2614, y: 404, w: 76, h: 18, style: 'basalt', fallDelay: 0.62 },
        { x: 4860, y: 418, w: 76, h: 18, style: 'basalt', fallDelay: 0.64 },
        { x: 4970, y: 404, w: 76, h: 18, style: 'basalt', fallDelay: 0.62 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1210, y: 338, type: 'coin' },
        { x: 2010, y: 338, type: 'coin' },
        { x: 3750, y: 261, type: 'empanada' },
        { x: 3794, y: 260, type: 'coin' },
        { x: 4446, y: 338, type: 'coin' },
        { x: 5266, y: 338, type: 'coin' },
        { x: 5494, y: 260, type: 'coin' },
        { x: 6002, y: 338, type: 'coin' },
        { x: 6990, y: 416, type: 'coin' },
        { x: 7030, y: 260, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2267, y: 182, w: 32, h: 32, item: 'plant', style: 'question' },
        { x: 5945, y: 260, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pacificHazards: [
        { x: 954, baseY: 488, period: 2.5, height: 162, phase: 0.0, kind: 'flying_fish' },
        { x: 1684, baseY: 488, period: 2.6, height: 164, phase: 0.65, kind: 'pacific_piranha' },
        { x: 2571, baseY: 488, period: 2.5, height: 162, phase: 1.2, kind: 'flying_fish' },
        { x: 3310, baseY: 488, period: 2.5, height: 162, phase: 1.8, kind: 'pacific_piranha' },
        { x: 4120, baseY: 488, period: 2.6, height: 164, phase: 0.3, kind: 'flying_fish' },
        { x: 4927, baseY: 488, period: 2.5, height: 162, phase: 0.8, kind: 'pacific_piranha' },
        { x: 5748, baseY: 488, period: 2.5, height: 162, phase: 1.4, kind: 'flying_fish' },
        { x: 6476, baseY: 488, period: 2.6, height: 164, phase: 2.25, kind: 'pacific_piranha' }
      ],
      rapaNuiWarriors: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 102 },
        { x: 684, y: GROUND_Y, minX: 519, maxX: 849, speed: 106 },
        { x: 1173, y: GROUND_Y, minX: 1031, maxX: 1338, speed: 110 },
        { x: 1320, y: GROUND_Y, minX: 1155, maxX: 1485, speed: 114 },
        { x: 1993, y: GROUND_Y, minX: 1831, maxX: 2158, speed: 106 },
        { x: 2295, y: GROUND_Y, minX: 2130, maxX: 2441, speed: 112 },
        { x: 3020, y: GROUND_Y, minX: 2855, maxX: 3185, speed: 116 },
        { x: 3133, y: GROUND_Y, minX: 2968, maxX: 3261, speed: 106 },
        { x: 3549, y: GROUND_Y, minX: 3387, maxX: 3714, speed: 110 },
        { x: 3720, y: GROUND_Y, minX: 3555, maxX: 3885, speed: 114 },
        { x: 3851, y: GROUND_Y, minX: 3686, maxX: 3997, speed: 118 },
        { x: 4409, y: GROUND_Y, minX: 4267, maxX: 4574, speed: 106 },
        { x: 4556, y: GROUND_Y, minX: 4391, maxX: 4721, speed: 110 },
        { x: 5249, y: GROUND_Y, minX: 5087, maxX: 5414, speed: 114 },
        { x: 5551, y: GROUND_Y, minX: 5386, maxX: 5697, speed: 118 },
        { x: 6112, y: GROUND_Y, minX: 5947, maxX: 6277, speed: 106 },
        { x: 6737, y: GROUND_Y, minX: 6623, maxX: 6902, speed: 114 },
        { x: 6850, y: GROUND_Y, minX: 6685, maxX: 7015, speed: 118 }
      ],
      frigates: [
        { x: 749, baseY: 148, minX: 529, maxX: 969, ampY: 22, speed: 152 },
        { x: 1207, baseY: 180, minX: 987, maxX: 1427, ampY: 28, speed: 158 },
        { x: 1666, baseY: 212, minX: 1446, maxX: 1886, ampY: 34, speed: 164 },
        { x: 2125, baseY: 148, minX: 1905, maxX: 2345, ampY: 22, speed: 170 },
        { x: 2583, baseY: 180, minX: 2363, maxX: 2803, ampY: 28, speed: 152 },
        { x: 3042, baseY: 212, minX: 2822, maxX: 3262, ampY: 34, speed: 158 },
        { x: 3500, baseY: 148, minX: 3280, maxX: 3720, ampY: 22, speed: 164 },
        { x: 3959, baseY: 180, minX: 3739, maxX: 4179, ampY: 28, speed: 170 },
        { x: 4417, baseY: 212, minX: 4197, maxX: 4637, ampY: 34, speed: 152 },
        { x: 4876, baseY: 148, minX: 4656, maxX: 5096, ampY: 22, speed: 158 },
        { x: 5335, baseY: 180, minX: 5115, maxX: 5555, ampY: 28, speed: 164 },
        { x: 5793, baseY: 212, minX: 5573, maxX: 6013, ampY: 34, speed: 170 },
        { x: 6252, baseY: 148, minX: 6032, maxX: 6472, ampY: 22, speed: 156 },
        { x: 6710, baseY: 180, minX: 6490, maxX: 6930, ampY: 28, speed: 162 }
      ]
    },
    {
      id: 4,
      city: 'chile_pascua',
      name: '4. Volcán Rano Kau',
      subtitle: 'Acantilados del cráter sagrado de Orongo frente al gran enjambre de Fragatas',
      nextDestination: 'Rumbo a Venezuela',
      theme: 'ch_pascua_kau',
      musicTheme: 'ch_pascua_kau',
      aiTier: 4,
      timeLimit: 120,
      hasWaterPits: true,
      hasWind: true,
      isFrigateSwarm: true,
      swarmTriggerX: 6350,
      busLine: 'CRÁTER RANO KAU · RUMBO A VENEZUELA',
      width: 7800,
      spawn: { x: 80, y: 390 },
      flagX: 7480,
      flagY: GROUND_Y - 68,
      hints: [
        { x: 190, y: 245, text: '¡CLÍMAX VOLCÁN RANO KAU! ESQUIVÁ GÉISERES Y PREPARÁ A LA TINA [X] ANTE LAS 20 FRAGATAS.' }
      ],
      solids: [
        { x: 0, y: GROUND_Y, w: 920, h: 100, style: 'moai_stone' },
        { x: 1016, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 1816, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 2716, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 3372, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 4252, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 5072, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 5808, y: GROUND_Y, w: 560, h: 100, style: 'basalt' },
        { x: 6608, y: GROUND_Y, w: 640, h: 100, style: 'moai_stone' },
        { x: 7508, y: GROUND_Y, w: 292, h: 100, style: 'basalt' },
        { x: 110, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 340, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 1126, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 1926, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 2156, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 2826, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 3482, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 3712, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 4362, y: 380, w: 140, h: 20, oneWay: true, style: 'basalt' },
        { x: 4517, y: 300, w: 140, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 4667, y: 220, w: 155, h: 20, oneWay: true, style: 'basalt' },
        { x: 5182, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 5412, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' },
        { x: 5918, y: 382, w: 175, h: 20, oneWay: true, style: 'basalt' },
        { x: 6718, y: 382, w: 175, h: 20, oneWay: true, style: 'moai_stone' },
        { x: 6948, y: 304, w: 170, h: 20, oneWay: true, style: 'basalt' }
      ],
      geysers: [
        { x: 1228, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.0, height: 185, kind: 'lava_spout' },
        { x: 2059, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.85, height: 185, kind: 'water_spout' },
        { x: 2928, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 1.7, height: 185, kind: 'lava_spout' },
        { x: 3615, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 2.55, height: 185, kind: 'water_spout' },
        { x: 4464, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 0.8, height: 185, kind: 'lava_spout' },
        { x: 5315, y: GROUND_Y, period: 2.84, eruptDuration: 1.67, phase: 1.65, height: 185, kind: 'water_spout' }
      ],
      movingPlatforms: [
        { sx: 1590, sy: 402, w: 106, h: 18, endX: 1704, endY: 368, speed: 120, style: 'moai_stone' },
        { sx: 4026, sy: 402, w: 106, h: 18, endX: 4140, endY: 368, speed: 120, style: 'moai_stone' },
        { sx: 6382, sy: 402, w: 106, h: 18, endX: 6496, endY: 368, speed: 120, style: 'moai_stone' }
      ],
      fallingPlatforms: [
        { x: 2504, y: 418, w: 76, h: 18, style: 'basalt', fallDelay: 0.60 },
        { x: 2614, y: 404, w: 76, h: 18, style: 'basalt', fallDelay: 0.58 },
        { x: 4860, y: 418, w: 76, h: 18, style: 'basalt', fallDelay: 0.60 },
        { x: 4970, y: 404, w: 76, h: 18, style: 'basalt', fallDelay: 0.58 },
        { x: 7296, y: 418, w: 76, h: 18, style: 'basalt', fallDelay: 0.60 },
        { x: 7406, y: 404, w: 76, h: 18, style: 'basalt', fallDelay: 0.58 }
      ],
      collectibles: [
        { x: 422, y: 260, type: 'coin' },
        { x: 1210, y: 338, type: 'coin' },
        { x: 2010, y: 338, type: 'coin' },
        { x: 3750, y: 261, type: 'empanada' },
        { x: 3794, y: 260, type: 'coin' },
        { x: 4432, y: 336, type: 'coin' },
        { x: 4587, y: 256, type: 'coin' },
        { x: 4759, y: 177, type: 'plant' },
        { x: 5266, y: 338, type: 'coin' },
        { x: 5494, y: 260, type: 'coin' },
        { x: 6002, y: 338, type: 'coin' },
        { x: 7290, y: 416, type: 'coin' }
      ],
      questionBlocks: [
        { x: 2267, y: 182, w: 32, h: 32, item: 'angel_wings', style: 'question' }
      ],
      pacificHazards: [
        { x: 954, baseY: 488, period: 2.3000000000000003, height: 162, phase: 0.0, kind: 'pacific_piranha' },
        { x: 1684, baseY: 488, period: 2.4, height: 164, phase: 0.65, kind: 'magma_piranha' },
        { x: 2571, baseY: 488, period: 2.27, height: 168, phase: 1.4, kind: 'pacific_piranha' },
        { x: 3310, baseY: 488, period: 2.3000000000000003, height: 162, phase: 1.7999999999999998, kind: 'magma_piranha' },
        { x: 4120, baseY: 488, period: 2.4, height: 164, phase: 0.30000000000000027, kind: 'pacific_piranha' },
        { x: 4927, baseY: 488, period: 2.27, height: 168, phase: 1.1, kind: 'magma_piranha' },
        { x: 5746, baseY: 488, period: 2.3000000000000003, height: 162, phase: 1.3999999999999995, kind: 'pacific_piranha' },
        { x: 6476, baseY: 488, period: 2.4, height: 164, phase: 2.25, kind: 'magma_piranha' }
      ],
      overheadHazards: [
        { x: 1166, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 2106, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 3146, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 3522, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 4542, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 5502, y: 136, w: 34, h: 42, kind: 'volcanic_rock', label: '' },
        { x: 5958, y: 118, w: 34, h: 42, kind: 'volcanic_rock', label: '' }
      ],
      rapaNuiWarriors: [
        { x: 551, y: GROUND_Y, minX: 386, maxX: 716, speed: 116 },
        { x: 787, y: GROUND_Y, minX: 622, maxX: 905, speed: 126 },
        { x: 1173, y: GROUND_Y, minX: 1031, maxX: 1338, speed: 131 },
        { x: 1320, y: GROUND_Y, minX: 1155, maxX: 1485, speed: 116 },
        { x: 1993, y: GROUND_Y, minX: 1831, maxX: 2158, speed: 126 },
        { x: 2295, y: GROUND_Y, minX: 2130, maxX: 2441, speed: 121 },
        { x: 2873, y: GROUND_Y, minX: 2731, maxX: 3038, speed: 121 },
        { x: 3133, y: GROUND_Y, minX: 2968, maxX: 3261, speed: 116 },
        { x: 3549, y: GROUND_Y, minX: 3387, maxX: 3714, speed: 116 },
        { x: 3851, y: GROUND_Y, minX: 3686, maxX: 3997, speed: 131 },
        { x: 4556, y: GROUND_Y, minX: 4391, maxX: 4721, speed: 121 },
        { x: 5249, y: GROUND_Y, minX: 5087, maxX: 5414, speed: 131 },
        { x: 5551, y: GROUND_Y, minX: 5386, maxX: 5697, speed: 121 },
        { x: 5965, y: GROUND_Y, minX: 5823, maxX: 6130, speed: 126 },
        { x: 6112, y: GROUND_Y, minX: 5947, maxX: 6277, speed: 131 },
        { x: 6785, y: GROUND_Y, minX: 6623, maxX: 6950, speed: 121 }
      ],
      frigates: [
        { x: 730, baseY: 148, minX: 510, maxX: 950, ampY: 22, speed: 167 },
        { x: 1150, baseY: 180, minX: 930, maxX: 1370, ampY: 28, speed: 173 },
        { x: 1570, baseY: 212, minX: 1350, maxX: 1790, ampY: 34, speed: 179 },
        { x: 1990, baseY: 148, minX: 1770, maxX: 2210, ampY: 22, speed: 185 },
        { x: 2410, baseY: 180, minX: 2190, maxX: 2630, ampY: 28, speed: 167 },
        { x: 2830, baseY: 212, minX: 2610, maxX: 3050, ampY: 34, speed: 173 },
        { x: 3250, baseY: 148, minX: 3030, maxX: 3470, ampY: 22, speed: 179 },
        { x: 3670, baseY: 180, minX: 3450, maxX: 3890, ampY: 28, speed: 185 },
        { x: 4090, baseY: 212, minX: 3870, maxX: 4310, ampY: 34, speed: 167 },
        { x: 4510, baseY: 148, minX: 4290, maxX: 4730, ampY: 22, speed: 173 },
        { x: 4930, baseY: 180, minX: 4710, maxX: 5150, ampY: 28, speed: 179 },
        { x: 5350, baseY: 212, minX: 5130, maxX: 5570, ampY: 34, speed: 185 },
        { x: 5770, baseY: 148, minX: 5550, maxX: 5990, ampY: 22, speed: 167 },
        { x: 6190, baseY: 180, minX: 5970, maxX: 6410, ampY: 28, speed: 173 },
        { x: 6610, baseY: 212, minX: 6390, maxX: 6830, ampY: 34, speed: 179 },
        { x: 7030, baseY: 148, minX: 6810, maxX: 7250, ampY: 22, speed: 185 }
      ]
    }
  ];

  const CITY_DEFS = {
    barcelona: {
      key: 'barcelona',
      name: 'Barcelona',
      country: 'spain',
      musicTheme: 'es_barcelona',
      playable: true,
      defaultUnlocked: true,
      next: 'madrid',
      levels: LEVELS
    },
    madrid: {
      key: 'madrid',
      name: 'Madrid',
      country: 'spain',
      musicTheme: 'es_madrid',
      playable: true,
      defaultUnlocked: false,
      next: 'palma',
      levels: MADRID_LEVELS
    },
    palma: {
      key: 'palma',
      name: 'Palma de Mallorca',
      country: 'spain',
      musicTheme: 'es_palma',
      playable: true,
      defaultUnlocked: false,
      next: 'canarias',
      levels: PALMA_LEVELS
    },
    canarias: {
      key: 'canarias',
      name: 'Islas Canarias',
      country: 'spain',
      musicTheme: 'es_canarias',
      playable: true,
      defaultUnlocked: false,
      next: null,
      levels: CANARIAS_LEVELS
    },
    buenosaires: {
      key: 'buenosaires',
      name: 'Buenos Aires',
      country: 'argentina',
      musicTheme: 'ba_caminito',
      playable: true,
      defaultUnlocked: false,
      next: 'rosario',
      levels: BUENOS_AIRES_LEVELS
    },
    rosario: {
      key: 'rosario',
      name: 'Rosario',
      country: 'argentina',
      musicTheme: 'ro_trova',
      playable: true,
      defaultUnlocked: false,
      next: 'cordoba',
      levels: ROSARIO_LEVELS
    },
    cordoba: {
      key: 'cordoba',
      name: 'Córdoba',
      country: 'argentina',
      musicTheme: 'co_cuarteto',
      playable: true,
      defaultUnlocked: false,
      next: 'ushuaia',
      levels: CORDOBA_LEVELS
    },
    ushuaia: {
      key: 'ushuaia',
      name: 'Ushuaia',
      country: 'argentina',
      musicTheme: 'ush_centro',
      playable: true,
      defaultUnlocked: false,
      next: 'chile_santiago',
      levels: USHUAIA_LEVELS
    },
    chile: {
      key: 'chile',
      name: 'Chile',
      country: 'chile',
      isCountry: true,
      musicTheme: 'ch_santiago_plaza',
      playable: true,
      defaultUnlocked: false,
      next: null,
      levels: []
    },
    chile_santiago: {
      key: 'chile_santiago',
      name: 'Santiago de Chile',
      country: 'chile',
      musicTheme: 'ch_santiago_plaza',
      playable: true,
      defaultUnlocked: false,
      next: 'chile_vina',
      levels: CHILE_SANTIAGO_LEVELS
    },
    chile_vina: {
      key: 'chile_vina',
      name: 'Viña y Valparaíso',
      country: 'chile',
      musicTheme: 'ch_vina_reloj',
      playable: true,
      defaultUnlocked: false,
      next: 'chile_atacama',
      levels: CHILE_VINA_LEVELS
    },
    chile_atacama: {
      key: 'chile_atacama',
      name: 'Desierto de Atacama',
      country: 'chile',
      musicTheme: 'ch_atacama_luna',
      playable: true,
      defaultUnlocked: false,
      next: 'chile_pascua',
      levels: CHILE_ATACAMA_LEVELS
    },
    chile_pascua: {
      key: 'chile_pascua',
      name: 'Isla de Pascua',
      country: 'chile',
      musicTheme: 'ch_pascua_tongariki',
      playable: true,
      defaultUnlocked: false,
      next: null,
      levels: CHILE_PASCUA_LEVELS
    },
    venezuela: {
      key: 'venezuela',
      name: 'Venezuela',
      country: 'venezuela',
      isCountry: true,
      musicTheme: 'ro_cumbia',
      playable: false,
      defaultUnlocked: false,
      next: null,
      levels: []
    },
    france: {
      key: 'france',
      name: 'Francia',
      country: 'france',
      continent: 'europe',
      isCountry: true,
      musicTheme: 'es_barcelona',
      playable: false,
      defaultUnlocked: false,
      next: null,
      levels: []
    },
    portugal: {
      key: 'portugal',
      name: 'Portugal',
      country: 'portugal',
      continent: 'europe',
      isCountry: true,
      musicTheme: 'es_madrid',
      playable: false,
      defaultUnlocked: false,
      next: null,
      levels: []
    }
  };

  Object.keys(CITY_DEFS).forEach((ck) => {
    const def = CITY_DEFS[ck];
    if (def && def.musicTheme && Array.isArray(def.levels)) {
      def.levels.forEach((lvl) => {
        if (!lvl.musicTheme) lvl.musicTheme = def.musicTheme;
      });
    }
  });

  function getCityZoneCount(cityKey) {
    const key = cityKey === 'mallorca' ? 'palma' : cityKey;
    const def = CITY_DEFS[key];
    return def && Array.isArray(def.levels) && def.levels.length > 0 ? def.levels.length : 4;
  }

  // ==========================================================================
  // RENDERIZADOR HD DE 5 CAPAS PARALLAX E ILUMINACIÓN VOLUMÉTRICA
  // ==========================================================================
  class BackgroundRenderer {
    draw(ctx, theme, cameraX, width, height, time) {
      const levelWidth = arguments.length > 6 ? arguments[6] : null;
      BackgroundRenderer.drawParallax(ctx, theme, cameraX, width, height, time, levelWidth);
    }

    drawParallax(ctx, theme, cameraX, width, height, time, levelWidth = null) {
      BackgroundRenderer.drawParallax(ctx, theme, cameraX, width, height, time, levelWidth);
    }

    drawPlatform(ctx, p, cameraX) {
      BackgroundRenderer.drawPlatform(ctx, p, cameraX);
    }

    drawWaterPits(ctx, pits, cameraX, width, height, time, opts = {}) {
      BackgroundRenderer.drawWaterPits(ctx, pits, cameraX, width, height, time, opts);
    }

    /**
     * Dibuja masa de agua azul/turquesa semitransparente con oleaje y línea de espuma
     * animada en la base de cada pozo costero o con peces saltarines.
     */
    static drawWaterPits(ctx, pits, cameraX, w, h, time, opts = {}) {
      if (!Array.isArray(pits) || pits.length === 0) return;
      const pass = opts.pass === 'front' ? 'front' : 'back';
      const stormy = !!opts.stormy;
      const amp = stormy ? 4.2 : 2.6;
      const spd = stormy ? 4.8 : 2.8;
      const pad = pass === 'back' ? 4 : 0;

      for (let i = 0; i < pits.length; i++) {
        const pit = pits[i];
        if (!pit || !Number.isFinite(pit.x) || !Number.isFinite(pit.w) || pit.w <= 0) continue;
        const sx = pit.x - cameraX;
        if (sx + pit.w < -24 || sx > w + 24) continue;

        const drawX = Math.max(-24, sx - pad);
        const rightX = Math.min(w + 24, sx + pit.w + pad);
        const drawW = rightX - drawX;
        if (drawW <= 0) continue;

        const baseSurfaceY = Number.isFinite(pit.surfaceY) ? pit.surfaceY : 484;
        const step = Math.max(8, Math.min(14, drawW / 6));
        const phaseBase = i * 1.1;
        const waveYAt = (vx) => baseSurfaceY + Math.sin((vx + cameraX) * 0.042 + time * spd + phaseBase) * amp;

        ctx.save();
        if (pass === 'front') {
          ctx.beginPath();
          ctx.rect(drawX, baseSurfaceY - amp - 8, drawW, h - (baseSurfaceY - amp - 8));
          ctx.clip();
        }

        ctx.beginPath();
        ctx.moveTo(drawX, h);
        for (let px = drawX; px < rightX; px += step) {
          ctx.lineTo(px, waveYAt(px));
        }
        ctx.lineTo(rightX, waveYAt(rightX));
        ctx.lineTo(rightX, h);
        ctx.closePath();

        if (pass === 'back') {
          const backGrad = ctx.createLinearGradient(0, baseSurfaceY - 2, 0, h);
          backGrad.addColorStop(0, 'rgba(6, 182, 212, 0.74)');
          backGrad.addColorStop(0.38, 'rgba(2, 132, 199, 0.86)');
          backGrad.addColorStop(1, 'rgba(7, 89, 133, 0.94)');
          ctx.fillStyle = backGrad;
          ctx.fill();
        } else {
          const frontGrad = ctx.createLinearGradient(0, baseSurfaceY, 0, h);
          frontGrad.addColorStop(0, 'rgba(34, 211, 238, 0.34)');
          frontGrad.addColorStop(0.45, 'rgba(14, 165, 233, 0.42)');
          frontGrad.addColorStop(1, 'rgba(3, 105, 161, 0.52)');
          ctx.fillStyle = frontGrad;
          ctx.fill();

          // Línea de espuma y cresta brillante sobre el oleaje de cada pozo
          ctx.strokeStyle = stormy ? '#f0f9ff' : '#cffafe';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(drawX, waveYAt(drawX));
          for (let px = drawX + step; px < rightX; px += step) {
            ctx.lineTo(px, waveYAt(px));
          }
          ctx.lineTo(rightX, waveYAt(rightX));
          ctx.stroke();

          // Destellos sutiles de agua bajo la superficie
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.42)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let px = drawX + 10; px < rightX - 10; px += 44) {
            const ry = baseSurfaceY + 12 + ((px % 3) * 4);
            ctx.moveTo(px, ry);
            ctx.lineTo(Math.min(rightX - 6, px + 18), ry);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    static draw(ctx, theme, cameraX, width, height, time, levelWidth = null) {
      this.drawParallax(ctx, theme, cameraX, width, height, time, levelWidth);
    }

    static drawParallax(ctx, theme, cameraX, width, height, time, levelWidth = null) {
      if (typeof theme === 'string' && theme.indexOf('ch_') === 0) {
        this.drawChileTheme(ctx, theme, cameraX, width, height, time, levelWidth);
      } else if (theme === 'ushuaia_centro') {
        this.drawUshuaiaCentro(ctx, cameraX, width, height, time);
      } else if (theme === 'ushuaia_tren') {
        this.drawUshuaiaTren(ctx, cameraX, width, height, time);
      } else if (theme === 'ushuaia_glaciar') {
        this.drawUshuaiaGlaciar(ctx, cameraX, width, height, time);
      } else if (theme === 'ushuaia_faro') {
        this.drawUshuaiaFaro(ctx, cameraX, width, height, time);
      } else if (theme === 'co_arco') {
        this.drawCoArco(ctx, cameraX, width, height, time);
      } else if (theme === 'co_cucu') {
        this.drawCoCucu(ctx, cameraX, width, height, time);
      } else if (theme === 'co_belgrano') {
        this.drawCoBelgrano(ctx, cameraX, width, height, time);
      } else if (theme === 'co_uritorco') {
        this.drawCoUritorco(ctx, cameraX, width, height, time);
      } else if (theme === 'ro_monumento') {
        this.drawRoMonumento(ctx, cameraX, width, height, time);
      } else if (theme === 'ro_florida') {
        this.drawRoFlorida(ctx, cameraX, width, height, time);
      } else if (theme === 'ro_parque') {
        this.drawRoParque(ctx, cameraX, width, height, time);
      } else if (theme === 'ro_arroyito') {
        this.drawRoArroyito(ctx, cameraX, width, height, time);
      } else if (theme === 'ba_caminito') {
        this.drawBaCaminito(ctx, cameraX, width, height, time);
      } else if (theme === 'ba_corrientes') {
        this.drawBaCorrientes(ctx, cameraX, width, height, time);
      } else if (theme === 'ba_madero') {
        this.drawBaMadero(ctx, cameraX, width, height, time);
      } else if (theme === 'ba_tren_mitre') {
        this.drawBaTrenMitre(ctx, cameraX, width, height, time);
      } else if (theme === 'canarias_maspalomas') {
        this.drawCanariasMaspalomas(ctx, cameraX, width, height, time);
      } else if (theme === 'canarias_garajonay') {
        this.drawCanariasGarajonay(ctx, cameraX, width, height, time);
      } else if (theme === 'canarias_timanfaya') {
        this.drawCanariasTimanfaya(ctx, cameraX, width, height, time);
      } else if (theme === 'canarias_teide') {
        this.drawCanariasTeide(ctx, cameraX, width, height, time);
      } else if (typeof theme === 'string' && theme.indexOf('canarias') === 0) {
        this.drawCanariasMaspalomas(ctx, cameraX, width, height, time);
      } else if (theme === 'palma_seu') {
        this.drawPalmaSeu(ctx, cameraX, width, height, time);
      } else if (theme === 'palma_bellver') {
        this.drawPalmaBellver(ctx, cameraX, width, height, time);
      } else if (theme === 'palma_calas') {
        this.drawPalmaCalas(ctx, cameraX, width, height, time);
      } else if (theme === 'palma_puerto') {
        this.drawPalmaPuerto(ctx, cameraX, width, height, time);
      } else if (typeof theme === 'string' && theme.indexOf('palma') === 0) {
        this.drawPalmaSeu(ctx, cameraX, width, height, time);
      } else if (theme === 'madrid_sol') {
        this.drawMadridSol(ctx, cameraX, width, height, time);
      } else if (theme === 'madrid_plaza') {
        this.drawMadridPlaza(ctx, cameraX, width, height, time);
      } else if (theme === 'madrid_retiro') {
        this.drawMadridRetiro(ctx, cameraX, width, height, time);
      } else if (theme === 'madrid_palacio') {
        this.drawMadridPalacio(ctx, cameraX, width, height, time);
      } else if (typeof theme === 'string' && theme.indexOf('madrid') === 0) {
        this.drawMadridSol(ctx, cameraX, width, height, time);
      } else if (theme === 'barceloneta') {
        this.drawBarceloneta(ctx, cameraX, width, height, time);
      } else if (theme === 'gotic') {
        this.drawGotic(ctx, cameraX, width, height, time);
      } else if (theme === 'parkguell' || theme === 'guell') {
        this.drawParkGuell(ctx, cameraX, width, height, time);
      } else {
        this.drawSagradaFamilia(ctx, cameraX, width, height, time);
      }
    }

    static drawVolumetricClouds(ctx, cameraX, time, yBase, fillStyle) {
      const p = -(cameraX * 0.05 + time * 9);
      ctx.save();
      ctx.fillStyle = fillStyle;
      for (let i = 0; i < 8; i++) {
        const cx = ((i * 220 + p) % 1500) + (i * 220 + p < -200 ? 1500 : 0);
        const cy = yBase + (i % 3) * 22;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 6, 30, 0, Math.PI * 2);
        ctx.arc(cx + 48, cy, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // MADRID (PLACEHOLDER): cielo cálido + siluetas de edificios en 3 capas
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // MADRID ESCENARIO 1: PUERTA DEL SOL (Neón Tío Pepe, Oso y Madroño, Farolas)
    // ------------------------------------------------------------------------
    static drawMadridSol(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.04): Cielo vespertino madrileño, atardecer cálido y sol radiante
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#ea580c');
      sky.addColorStop(0.45, '#f59e0b');
      sky.addColorStop(0.8, '#fde68a');
      sky.addColorStop(1, '#fffbeb');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const sunX = 720 - cameraX * 0.04;
      const sun = ctx.createRadialGradient(sunX, 95, 8, sunX, 95, 175);
      sun.addColorStop(0, 'rgba(255, 255, 255, 1)');
      sun.addColorStop(0.3, 'rgba(254, 240, 138, 0.75)');
      sun.addColorStop(0.7, 'rgba(249, 115, 22, 0.2)');
      sun.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(sunX, 95, 175, 0, Math.PI * 2);
      ctx.fill();

      this.drawVolumetricClouds(ctx, cameraX, time, 65, 'rgba(255, 255, 255, 0.72)');

      // CAPA 2 (0.12): Skyline lejano de Madrid (Gran Vía, cúpula Metrópolis, Telefónica)
      const p2 = -(cameraX * 0.12);
      ctx.save();
      ctx.fillStyle = '#9a3412';
      ctx.globalAlpha = 0.55;
      for (let i = 0; i < 14; i++) {
        const bx = ((i * 135 + p2) % 1890) + (i * 135 + p2 < -120 ? 1890 : 0);
        const bh = 90 + ((i * 37) % 65);
        ctx.fillRect(bx, 380 - bh, 95, bh + 100);
        // Cúpulas y agujas clásicas
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(bx + 47, 380 - bh, 22, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(bx + 45, 380 - bh - 32, 4, 32);
        }
      }
      ctx.restore();

      // CAPA 3 (0.24): Real Casa de Correos y arquitectura neoclásica de la Puerta del Sol
      const p3 = -(cameraX * 0.24);
      ctx.save();
      ctx.fillStyle = '#7c2d12';
      for (let i = 0; i < 10; i++) {
        const bx = ((i * 190 + p3) % 1900) + (i * 190 + p3 < -160 ? 1900 : 0);
        ctx.fillRect(bx, 280, 150, 200);
        // Friso y cornisas
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(bx - 6, 274, 162, 8);
        ctx.fillRect(bx - 2, 330, 154, 5);
        // Ventanales arqueados con luz cálida
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 3; col++) {
            const wx = bx + 18 + col * 44;
            const wy = 295 + row * 45;
            ctx.beginPath();
            ctx.arc(wx + 10, wy, 10, Math.PI, 0);
            ctx.lineTo(wx + 20, wy + 20);
            ctx.lineTo(wx, wy + 20);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.fillStyle = '#7c2d12';
      }
      ctx.restore();

      // CAPA 4 (0.42): Hitos Icónicos: Cartel Neón Tío Pepe, El Oso y el Madroño y Farolas
      const p4 = -(cameraX * 0.42);
      ctx.save();

      // 1. Cartel de TÍO PEPE iluminado en el tejado
      const tioX = ((780 + p4) % 1600) + (780 + p4 < -250 ? 1600 : 0);
      const tioY = 210;
      // Botella de Tío Pepe (silueta con chaquetilla y sombrero cordobés rojo)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(tioX, tioY + 12, 18, 48); // Botella
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(tioX - 2, tioY + 22, 22, 24); // Chaquetilla roja
      ctx.fillRect(tioX - 6, tioY + 6, 30, 6); // Ala sombrero
      ctx.fillRect(tioX - 2, tioY, 22, 6); // Copa sombrero
      // Neón rojo brillante "TÍO PEPE" con pulso
      const neonPulse = (Math.sin(time * 6) + 1) * 0.5;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.75 + neonPulse * 0.25})`;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14 + neonPulse * 8;
      ctx.font = '900 18px "Arial Black", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TÍO PEPE', tioX + 28, tioY + 36);
      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.fillText('SOL DE ANDALUCÍA EMBOTELLADO', tioX + 28, tioY + 50);
      ctx.shadowBlur = 0;

      // 2. Estatua de "El Oso y el Madroño"
      const osoX = ((1250 + p4) % 1600) + (1250 + p4 < -200 ? 1600 : 0);
      const osoY = 380;
      // Pedestal de granito
      ctx.fillStyle = '#475569';
      ctx.fillRect(osoX - 20, osoY + 20, 64, 45);
      ctx.fillStyle = '#334155';
      ctx.fillRect(osoX - 24, osoY + 16, 72, 6);
      // Árbol Madroño (tronco de bronce y copa frondosa con bayas rojas)
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(osoX + 16, osoY - 40, 10, 60);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(osoX + 21, osoY - 48, 26, 0, Math.PI * 2);
      ctx.fill();
      // Frutos rojos brillantes del madroño
      ctx.fillStyle = '#ef4444';
      [[-8, -8], [6, -14], [12, 4], [-4, 12]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(osoX + 21 + ox, osoY - 48 + oy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      // Silueta de bronce del Oso apoyado en dos patas sobre el tronco
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.ellipse(osoX + 2, osoY - 6, 15, 24, 0.35, 0, Math.PI * 2); // Cuerpo
      ctx.fill();
      ctx.beginPath();
      ctx.arc(osoX + 12, osoY - 26, 9, 0, Math.PI * 2); // Cabeza
      ctx.fill();
      // Orejas
      ctx.arc(osoX + 8, osoY - 34, 3, 0, Math.PI * 2);
      ctx.arc(osoX + 16, osoY - 34, 3, 0, Math.PI * 2);
      ctx.fill();

      // 3. Farolas fernandinas clásicas de 5 brazos con globos cálidos
      for (let fi = 0; fi < 4; fi++) {
        const fx = ((fi * 440 + p4) % 1760) + (fi * 440 + p4 < -100 ? 1760 : 0);
        const fy = 370;
        // Poste de hierro forjado negro
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx - 3, fy - 65, 6, 95);
        ctx.fillRect(fx - 7, fy + 24, 14, 6);
        // Brazos y 5 faroles con resplandor cálido
        [-16, -8, 0, 8, 16].forEach((bx) => {
          ctx.beginPath();
          ctx.arc(fx + bx, fy - 68, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // MADRID ESCENARIO 2: PLAZA MAYOR (Soportales, Arcadas, Ladrillo y Balcones)
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // MADRID ESCENARIO 2: PLAZA MAYOR (Soportales, Arcadas, Ladrillo Terracota Iluminado)
    // Paleta con alto contraste, faroles dorados intensos y relieve nítido
    // ------------------------------------------------------------------------
    static drawMadridPlaza(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.05): Cielo nocturno/crepuscular madrileño iluminado con farolas
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1e1b4b'); // Azul noche profundo en la cúspide
      sky.addColorStop(0.35, '#7c2d12'); // Ámbar cobrizo de transición
      sky.addColorStop(0.7, '#ea580c'); // Luz terracota cálida de la plaza
      sky.addColorStop(0.92, '#f59e0b'); // Resplandor dorado de las farolas
      sky.addColorStop(1, '#fef3c7'); // Horizonte claro para máximo contraste
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX, time, 55, 'rgba(254, 243, 199, 0.75)');

      // CAPA 2 (0.15): Tejados de pizarra oscura con reflejos y torreones angulares
      const p2 = -(cameraX * 0.15);
      ctx.save();
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 9; i++) {
        const tx = ((i * 210 + p2) % 1890) + (i * 210 + p2 < -160 ? 1890 : 0);
        // Torreón con tejado piramidal de pizarra
        ctx.beginPath();
        ctx.moveTo(tx, 260);
        ctx.lineTo(tx + 40, 155);
        ctx.lineTo(tx + 80, 260);
        ctx.closePath();
        ctx.fill();
        // Veleta dorada
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(tx + 40, 155);
        ctx.lineTo(tx + 40, 125);
        ctx.stroke();
      }
      ctx.restore();

      // CAPA 3 (0.30): Fachadas de ladrillo terracota iluminado con balcones contrastados
      const p3 = -(cameraX * 0.30);
      ctx.save();
      for (let i = 0; i < 11; i++) {
        const bx = ((i * 170 + p3) % 1870) + (i * 170 + p3 < -150 ? 1870 : 0);
        // Fachada de ladrillo terracota madrileño iluminado
        const brickGrad = ctx.createLinearGradient(bx, 230, bx, 440);
        brickGrad.addColorStop(0, '#ea580c'); // Terracota cálido iluminado
        brickGrad.addColorStop(0.5, '#c2410c');
        brickGrad.addColorStop(1, '#9a3412');
        ctx.fillStyle = brickGrad;
        ctx.fillRect(bx, 220, 148, 230);

        // Molduras blancas / cornisas de relieve
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(bx - 2, 218, 152, 4);

        // Filas rítmicas de balconadas de hierro forjado
        for (let row = 0; row < 3; row++) {
          const by = 248 + row * 46;
          // Ventanal con marco blanco contrastado
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx + 14, by - 14, 32, 34);
          ctx.fillRect(bx + 60, by - 14, 32, 34);
          ctx.fillRect(bx + 102, by - 14, 32, 34);
          // Interior oscuro del ventanal
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(bx + 16, by - 12, 28, 30);
          ctx.fillRect(bx + 62, by - 12, 28, 30);
          ctx.fillRect(bx + 104, by - 12, 28, 30);
          // Barandilla de forja negra nítida
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 2.2;
          ctx.strokeRect(bx + 12, by + 10, 36, 12);
          ctx.strokeRect(bx + 58, by + 10, 36, 12);
          ctx.strokeRect(bx + 100, by + 10, 36, 12);
          // Geranios rojos brillantes y flores blancas contrastadas
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(bx + 26, by + 10, 4, 0, Math.PI * 2);
          ctx.arc(bx + 72, by + 10, 4, 0, Math.PI * 2);
          ctx.arc(bx + 114, by + 10, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx + 34, by + 9, 2.5, 0, Math.PI * 2);
          ctx.arc(bx + 80, by + 9, 2.5, 0, Math.PI * 2);
          ctx.arc(bx + 122, by + 9, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // CAPA 4 (0.48): Gran galería de soportales de granito claro con faroles dorados
      const p4 = -(cameraX * 0.48);
      ctx.save();
      for (let i = 0; i < 12; i++) {
        const ax = ((i * 160 + p4) % 1920) + (i * 160 + p4 < -140 ? 1920 : 0);
        // Pilastras de granito claro
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ax, 340, 26, 120);
        ctx.fillRect(ax + 134, 340, 26, 120);
        // Arco de medio punto de granito claro
        ctx.beginPath();
        ctx.arc(ax + 80, 370, 56, Math.PI, 0);
        ctx.lineWidth = 22;
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        // Cornisa tenue en segundo plano integrada en la fachada
        ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.fillRect(ax + 4, 336, 152, 8);

        // Cono de luz proyectado desde el farol hacia el suelo
        const cone = ctx.createLinearGradient(ax + 80, 370, ax + 80, 460);
        cone.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        cone.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(ax + 74, 370);
        ctx.lineTo(ax + 115, 460);
        ctx.lineTo(ax + 45, 460);
        ctx.closePath();
        ctx.fill();

        // Farola colgante de forja con bombilla dorada intensa
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(ax + 80, 345);
        ctx.lineTo(ax + 80, 366);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ax + 80, 370, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // MADRID ESCENARIO 3: PARQUE DEL RETIRO (Palacio de Cristal y Gran Estanque)
    // ------------------------------------------------------------------------
    static drawMadridRetiro(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.04): Cielo diáfano azul turquesa y sol primaveral
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.5, '#38bdf8');
      sky.addColorStop(0.85, '#bae6fd');
      sky.addColorStop(1, '#f0fdf4');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const sunX = 750 - cameraX * 0.04;
      const sun = ctx.createRadialGradient(sunX, 85, 6, sunX, 85, 160);
      sun.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sun.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)');
      sun.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(sunX, 85, 160, 0, Math.PI * 2);
      ctx.fill();

      this.drawVolumetricClouds(ctx, cameraX, time, 70, 'rgba(255, 255, 255, 0.75)');

      // CAPA 2 (0.14): Bosque frondoso del Retiro (castaños, robles y pinos centenarios)
      const p2 = -(cameraX * 0.14);
      ctx.save();
      for (let i = 0; i < 18; i++) {
        const tx = ((i * 110 + p2) % 1980) + (i * 110 + p2 < -100 ? 1980 : 0);
        const th = 110 + ((i * 47) % 60);
        const treeGrad = ctx.createLinearGradient(tx, 400 - th, tx, 420);
        treeGrad.addColorStop(0, '#15803d');
        treeGrad.addColorStop(1, '#14532d');
        ctx.fillStyle = treeGrad;
        ctx.beginPath();
        ctx.arc(tx + 40, 400 - th, 55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // CAPA 3 (0.28): El emblemático PALACIO DE CRISTAL (hierro y cúpula transparente)
      const p3 = -(cameraX * 0.28);
      ctx.save();
      const pcX = ((640 + p3) % 1700) + (640 + p3 < -350 ? 1700 : 0);
      const pcY = 240;
      // Estructura de cristal con reflejo prisma y degradado
      const glassGrad = ctx.createLinearGradient(pcX, pcY, pcX + 220, pcY + 160);
      glassGrad.addColorStop(0, 'rgba(186, 230, 253, 0.72)');
      glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.88)');
      glassGrad.addColorStop(1, 'rgba(125, 211, 252, 0.65)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(pcX, pcY + 40, 220, 140);
      // Cúpula central abovedada
      ctx.beginPath();
      ctx.arc(pcX + 110, pcY + 40, 52, Math.PI, 0);
      ctx.fill();
      // Filigrana de hierro fundido victoriano negro/verde oscuro
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.4;
      ctx.strokeRect(pcX, pcY + 40, 220, 140);
      ctx.beginPath();
      ctx.arc(pcX + 110, pcY + 40, 52, Math.PI, 0);
      ctx.stroke();
      // Arquería interna de cristal
      for (let ax = pcX + 20; ax < pcX + 210; ax += 36) {
        ctx.beginPath();
        ctx.moveTo(ax, pcY + 40);
        ctx.lineTo(ax, pcY + 180);
        ctx.stroke();
      }
      ctx.restore();

      // CAPA 4 (0.45): Gran Estanque del Retiro: orilla de piedra, agua y barcas de remos
      const p4 = -(cameraX * 0.45);
      ctx.save();
      // Agua del estanque con reflejos ondulantes
      const waterGrad = ctx.createLinearGradient(0, 390, 0, 480);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(0.5, '#0369a1');
      waterGrad.addColorStop(1, '#075985');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 410, w, 70);

      // Barquitas de remos flotando en el estanque
      for (let bi = 0; bi < 3; bi++) {
        const bx = ((bi * 520 + 200 + p4) % 1600) + (bi * 520 + 200 + p4 < -120 ? 1600 : 0);
        const by = 422 + Math.sin(time * 3 + bi) * 3;
        // Casco azul de la barca del Retiro
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(bx - 24, by);
        ctx.lineTo(bx + 24, by);
        ctx.lineTo(bx + 18, by + 12);
        ctx.lineTo(bx - 18, by + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        // Remos de madera
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by + 4);
        ctx.lineTo(bx - 26, by - 6);
        ctx.moveTo(bx + 6, by + 4);
        ctx.lineTo(bx + 26, by - 6);
        ctx.stroke();
      }

      // Muro bajo sutil del estanque al fondo (sin apariencia de viga jugable)
      ctx.fillStyle = 'rgba(203, 213, 225, 0.42)';
      for (let i = 0; i < 8; i++) {
        const rx = ((i * 220 + p4) % 1760) + (i * 220 + p4 < -140 ? 1760 : 0);
        ctx.fillRect(rx, 436, 110, 6);
        ctx.fillRect(rx + 4, 428, 14, 14);
        ctx.fillRect(rx + 92, 428, 14, 14);
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // MADRID ESCENARIO 4: PALACIO REAL Y ALMUDENA (Sabatini, Columnas y Crepúsculo)
    // ------------------------------------------------------------------------
    static drawMadridPalacio(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.05): Atardecer regio crepuscular con tonos violetas y dorados
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#312e81');
      sky.addColorStop(0.4, '#6366f1');
      sky.addColorStop(0.7, '#f43f5e');
      sky.addColorStop(0.92, '#fbbf24');
      sky.addColorStop(1, '#fef08a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX, time, 65, 'rgba(254, 215, 170, 0.65)');

      // CAPA 2 (0.14): Siluetas góticas de la Catedral de la Almudena (cúpula y torres)
      const p2 = -(cameraX * 0.14);
      ctx.save();
      ctx.fillStyle = '#4338ca';
      ctx.globalAlpha = 0.65;
      const almx = ((720 + p2) % 1700) + (720 + p2 < -300 ? 1700 : 0);
      // Cúpula neogótica
      ctx.beginPath();
      ctx.arc(almx + 90, 250, 48, Math.PI, 0);
      ctx.fill();
      // Torres laterales
      ctx.fillRect(almx, 220, 36, 170);
      ctx.fillRect(almx + 144, 220, 36, 170);
      ctx.restore();

      // CAPA 3 (0.30): Monumental fachada del PALACIO REAL de piedra blanca de Colmenar
      const p3 = -(cameraX * 0.30);
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const px = ((i * 240 + p3) % 1920) + (i * 240 + p3 < -200 ? 1920 : 0);
        // Fachada de piedra blanca majestuosa
        const stoneGrad = ctx.createLinearGradient(px, 200, px, 430);
        stoneGrad.addColorStop(0, '#f8fafc');
        stoneGrad.addColorStop(0.6, '#e2e8f0');
        stoneGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = stoneGrad;
        ctx.fillRect(px, 210, 215, 230);

        // Columnata corintia en relieve
        ctx.fillStyle = '#94a3b8';
        for (let c = 0; c < 4; c++) {
          const colX = px + 16 + c * 52;
          ctx.fillRect(colX, 230, 16, 190);
          // Capiteles corintios
          ctx.fillRect(colX - 4, 225, 24, 7);
          ctx.fillRect(colX - 3, 415, 22, 6);
        }

        // Gran cornisa superior con estatuas visigodas
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - 6, 204, 227, 10);
        // Estatuas de reyes visigodos sobre la cornisa
        ctx.fillStyle = '#475569';
        for (let s = 0; s < 4; s++) {
          const sx = px + 22 + s * 52;
          ctx.fillRect(sx, 186, 6, 18);
          ctx.beginPath();
          ctx.arc(sx + 3, 184, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // CAPA 4 (0.48): Jardines de Sabatini: parterres geométricos y fuentes de mármol
      const p4 = -(cameraX * 0.48);
      ctx.save();
      // Setos recortados geométricos estilo versallesco
      for (let hi = 0; hi < 12; hi++) {
        const hx = ((hi * 160 + p4) % 1920) + (hi * 160 + p4 < -140 ? 1920 : 0);
        ctx.fillStyle = '#14532d';
        ctx.fillRect(hx, 385, 130, 50);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(hx + 4, 380, 122, 8);

        // Fuente clásica de mármol con surtidor de agua celeste
        if (hi % 3 === 1) {
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.ellipse(hx + 65, 410, 36, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          // Chorro de agua que brota
          const jetPulse = Math.sin(time * 6 + hi) * 4;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(hx + 62, 408);
          ctx.lineTo(hx + 65, 380 + jetPulse);
          ctx.lineTo(hx + 68, 408);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // ESCENARIO 1: LA BARCELONETA (5 Capas Parallax + Sol Radial Volumétrico)
    // ------------------------------------------------------------------------
    static drawBarceloneta(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.04): Cielo mediterráneo + Iluminación radial solar + Nubes
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.5, '#38bdf8');
      sky.addColorStop(0.82, '#fde68a');
      sky.addColorStop(1, '#fffbeb');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const sunX = 760 - cameraX * 0.04;
      const sunGlow = ctx.createRadialGradient(sunX, 90, 8, sunX, 90, 180);
      sunGlow.addColorStop(0, 'rgba(255, 251, 235, 1)');
      sunGlow.addColorStop(0.25, 'rgba(251, 191, 36, 0.65)');
      sunGlow.addColorStop(0.6, 'rgba(251, 191, 36, 0.18)');
      sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, 90, 180, 0, Math.PI * 2);
      ctx.fill();

      this.drawVolumetricClouds(ctx, cameraX, time, 70, 'rgba(255, 255, 255, 0.78)');

      // CAPA 2 (0.14): Montjuïc y Silueta curva 3D del Hotel W (Vela)
      const p2 = -(cameraX * 0.14);
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(0, 345);
      ctx.quadraticCurveTo(180 + p2 * 0.5, 240, 420 + p2 * 0.5, 345);
      ctx.closePath();
      ctx.fill();

      const wx = 660 + p2;
      const wGrad = ctx.createLinearGradient(wx, 185, wx + 75, 345);
      wGrad.addColorStop(0, '#38bdf8');
      wGrad.addColorStop(0.5, '#0284c7');
      wGrad.addColorStop(1, '#1e3a8a');
      ctx.beginPath();
      ctx.moveTo(wx, 345);
      ctx.bezierCurveTo(wx + 4, 235, wx + 38, 190, wx + 68, 182);
      ctx.lineTo(wx + 76, 345);
      ctx.closePath();
      global.SpriteBank.fillAndStroke(ctx, wGrad, '#0f172a', 2.0);

      // CAPA 3 (0.28): Mar Mediterráneo con olas curvas y veleros
      const p3 = -(cameraX * 0.28);
      const seaGrad = ctx.createLinearGradient(0, 332, 0, 420);
      seaGrad.addColorStop(0, '#0369a1');
      seaGrad.addColorStop(0.5, '#0284c7');
      seaGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 332, w, 90);

      for (let i = 0; i < 6; i++) {
        const bx = ((i * 260 + p3) % 1400) + (i * 260 + p3 < -80 ? 1400 : 0);
        const by = 334 + Math.sin(time * 2.5 + i) * 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + 14, by - 26);
        ctx.lineTo(bx + 24, by);
        ctx.closePath();
        global.SpriteBank.fillAndStroke(ctx, '#ffffff', '#0f172a', 1.4);
      }

      // CAPA 4 (0.48): Dunas de arena dorada curvas y Palmeras HD
      const p4 = -(cameraX * 0.48);
      const sandGrad = ctx.createLinearGradient(0, 390, 0, 470);
      sandGrad.addColorStop(0, '#fde68a');
      sandGrad.addColorStop(1, '#d97706');
      ctx.beginPath();
      ctx.moveTo(0, 402);
      for (let sx = 0; sx <= w + 120; sx += 120) {
        ctx.quadraticCurveTo(sx + 60, 386 + Math.sin(sx * 0.01 + p4 * 0.02) * 8, sx + 120, 402);
      }
      ctx.lineTo(w, 480);
      ctx.lineTo(0, 480);
      ctx.closePath();
      ctx.fillStyle = sandGrad;
      ctx.fill();

      for (let i = 0; i < 12; i++) {
        const px = ((i * 220 + p4) % 2400) + (i * 220 + p4 < -120 ? 2400 : 0);
        // Tronco curvado de palmera
        ctx.beginPath();
        ctx.moveTo(px, 410);
        ctx.quadraticCurveTo(px - 10, 340, px + 8, 275);
        ctx.lineWidth = 11;
        ctx.strokeStyle = '#78350f';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Hojas curvas de palmera
        [-1.2, -0.6, 0, 0.6, 1.2].forEach((ang) => {
          ctx.save();
          ctx.translate(px + 8, 275);
          ctx.rotate(ang + Math.sin(time * 2 + i) * 0.05);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(22, -14, 42, 6);
          ctx.quadraticCurveTo(20, -2, 0, 0);
          global.SpriteBank.fillAndStroke(ctx, '#16a34a', '#052e16', 1.4);
          ctx.restore();
        });
      }

      // CAPA 5 (0.72): Sombrillas de playa y balaustrada marítima en primer plano
      const p5 = -(cameraX * 0.72);
      for (let i = 0; i < 14; i++) {
        const ux = ((i * 190 + p5) % 2400) + (i * 190 + p5 < -100 ? 2400 : 0);
        global.SpriteBank.drawCapsule(ctx, ux + 22, 376, ux + 22, 425, 2.5, '#e2e8f0', '#0f172a', 1.5);
        ctx.beginPath();
        ctx.arc(ux + 22, 382, 27, Math.PI, 0);
        ctx.closePath();
        global.SpriteBank.fillAndStroke(
          ctx,
          i % 2 === 0 ? '#f43f5e' : '#06b6d4',
          '#0f172a',
          1.8
        );
      }
    }

    // ------------------------------------------------------------------------
    // ESCENARIO 2: EL GÒTIC (5 Capas Parallax + Iluminación Radial de Farolas)
    // ------------------------------------------------------------------------
    static drawGotic(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.04): Cielo crepuscular + Luna llena con halo radial
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#090d16');
      sky.addColorStop(0.5, '#311042');
      sky.addColorStop(1, '#be123c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const moonX = 740 - cameraX * 0.04;
      const moonGlow = ctx.createRadialGradient(moonX, 85, 10, moonX, 85, 130);
      moonGlow.addColorStop(0, 'rgba(254, 249, 195, 0.95)');
      moonGlow.addColorStop(0.35, 'rgba(253, 224, 71, 0.35)');
      moonGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, 85, 130, 0, Math.PI * 2);
      ctx.fill();

      // CAPA 2 (0.14): Silueta de las agujas de la Catedral de Barcelona
      const p2 = -(cameraX * 0.14);
      for (let i = 0; i < 8; i++) {
        const bx = i * 240 + (p2 % 240);
        ctx.beginPath();
        ctx.moveTo(bx, 460);
        ctx.lineTo(bx, 160);
        ctx.lineTo(bx + 60, 160);
        ctx.lineTo(bx + 95, 55);
        ctx.lineTo(bx + 130, 160);
        ctx.lineTo(bx + 190, 160);
        ctx.lineTo(bx + 190, 460);
        ctx.closePath();
        ctx.fillStyle = '#18122b';
        ctx.fill();
      }

      // CAPA 3 (0.30): Palacios medievales con rosetones góticos
      const p3 = -(cameraX * 0.3);
      for (let i = 0; i < 10; i++) {
        const gx = i * 260 + (p3 % 260);
        const bGrad = ctx.createLinearGradient(gx, 165, gx, 460);
        bGrad.addColorStop(0, '#2e2344');
        bGrad.addColorStop(1, '#1a1429');
        ctx.beginPath();
        ctx.roundRect(gx, 165, 210, 300, 8);
        global.SpriteBank.fillAndStroke(ctx, bGrad, '#090d16', 2.2);

        // Ventanales ojivales iluminados
        [45, 135].forEach((ox) => {
          ctx.beginPath();
          ctx.moveTo(gx + ox, 255);
          ctx.quadraticCurveTo(gx + ox + 15, 210, gx + ox + 30, 255);
          ctx.lineTo(gx + ox + 30, 285);
          ctx.lineTo(gx + ox, 285);
          ctx.closePath();
          global.SpriteBank.fillAndStroke(ctx, '#fbbf24', '#090d16', 1.8);
        });
      }

      // CAPA 4 (0.50): Arcos elevados estilo Pont del Bisbe
      const p4 = -(cameraX * 0.5);
      for (let i = 0; i < 8; i++) {
        const ax = i * 320 + (p4 % 320);
        ctx.beginPath();
        ctx.moveTo(ax, 220);
        ctx.lineTo(ax + 120, 220);
        ctx.lineTo(ax + 120, 270);
        ctx.quadraticCurveTo(ax + 60, 232, ax, 270);
        ctx.closePath();
        global.SpriteBank.fillAndStroke(ctx, '#473c63', '#090d16', 2.0);
      }

      // CAPA 5 (0.74): Farolas de hierro forjado con iluminación radial intensa
      const p5 = -(cameraX * 0.74);
      for (let i = 0; i < 12; i++) {
        const lx = i * 230 + (p5 % 230);
        global.SpriteBank.drawCapsule(ctx, lx, 305, lx, 460, 3.2, '#1e293b', '#090d16', 1.8);

        const lampRadius = 64 + Math.sin(time * 4 + i) * 5;
        const glow = ctx.createRadialGradient(lx, 300, 3, lx, 300, lampRadius);
        glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        glow.addColorStop(0.4, 'rgba(251, 191, 36, 0.45)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx, 300, lampRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ------------------------------------------------------------------------
    // ESCENARIO 3: PARK GÜELL (5 Capas Parallax + Mosaicos Trencadís)
    // ------------------------------------------------------------------------
    static drawParkGuell(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.04): Cielo soleado + Nubes
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1d4ed8');
      sky.addColorStop(0.6, '#7dd3fc');
      sky.addColorStop(1, '#fef9c3');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      this.drawVolumetricClouds(ctx, cameraX, time, 60, 'rgba(255, 255, 255, 0.85)');

      // CAPA 2 (0.14): Horizonte de Barcelona y Torre Glòries
      const p2 = -(cameraX * 0.14);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 320, w, 150);
      const tx = 580 + p2;
      ctx.beginPath();
      ctx.arc(tx, 255, 28, Math.PI, 0);
      ctx.lineTo(tx + 28, 340);
      ctx.lineTo(tx - 28, 340);
      ctx.closePath();
      global.SpriteBank.fillAndStroke(ctx, '#0284c7', '#0f172a', 2.0);

      // CAPA 3 (0.30): Colinas verdes de Collserola y Pinos Mediterráneos
      const p3 = -(cameraX * 0.3);
      for (let i = 0; i < 8; i++) {
        const hx = i * 300 + (p3 % 300);
        const hillGrad = ctx.createRadialGradient(hx + 140, 380, 20, hx + 140, 440, 170);
        hillGrad.addColorStop(0, '#4ade80');
        hillGrad.addColorStop(1, '#15803d');
        ctx.beginPath();
        ctx.arc(hx + 140, 450, 155, Math.PI, 0);
        ctx.fillStyle = hillGrad;
        ctx.fill();
      }

      // CAPA 4 (0.50): Pabellones de Gaudí con tejados orgánicos y cruz
      const p4 = -(cameraX * 0.5);
      for (let i = 0; i < 8; i++) {
        const px = i * 320 + (p4 % 320);
        ctx.beginPath();
        ctx.roundRect(px + 40, 285, 110, 130, 12);
        global.SpriteBank.fillAndStroke(ctx, '#d97706', '#451a03', 2.2);

        ctx.beginPath();
        ctx.arc(px + 95, 285, 58, Math.PI, 0);
        global.SpriteBank.fillAndStroke(ctx, '#fb7185', '#881337', 2.2);

        // Cruz gaudiana
        global.SpriteBank.drawCapsule(ctx, px + 95, 198, px + 95, 245, 4, '#06b6d4', '#0f172a', 1.8);
        global.SpriteBank.drawCapsule(ctx, px + 80, 212, px + 110, 212, 3.5, '#fbbf24', '#0f172a', 1.8);
      }

      // CAPA 5 (0.75): Banco serpenteante de trencadís multicolor en relieve
      const p5 = -(cameraX * 0.75);
      const colors = ['#fbbf24', '#06b6d4', '#f43f5e', '#8b5cf6', '#10b981'];
      for (let i = 0; i < 28; i++) {
        const mx = i * 70 + (p5 % 70);
        ctx.beginPath();
        ctx.arc(mx, 450, 38, Math.PI, 0);
        global.SpriteBank.fillAndStroke(ctx, colors[i % colors.length], '#0f172a', 2.0);
      }
    }

    // ------------------------------------------------------------------------
    // ESCENARIO 4: SAGRADA FAMILIA (5 Capas Parallax + Haces de Luz y Basílica)
    // ------------------------------------------------------------------------
    static drawSagradaFamilia(ctx, cameraX, w, h, time) {
      // CAPA 1 (0.04): Cielo de atardecer épico + Haces de luz celestes
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#090d16');
      sky.addColorStop(0.45, '#3b0764');
      sky.addColorStop(0.8, '#be123c');
      sky.addColorStop(1, '#f59e0b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // CAPA 2 (0.12): LA SAGRADA FAMILIA GIGANTE EN ALTA DEFINICIÓN
      const sagradaX = 330 - cameraX * 0.1;
      this.drawSagradaSilhouette(ctx, sagradaX, 460, 1.0);

      // CAPA 3 (0.28): Edificios modernistas del Eixample
      const p3 = -(cameraX * 0.28);
      for (let i = 0; i < 8; i++) {
        const ex = i * 320 + (p3 % 320);
        ctx.beginPath();
        ctx.roundRect(ex, 275, 165, 190, 6);
        global.SpriteBank.fillAndStroke(ctx, '#1e1b4b', '#090d16', 2.0);
      }

      // CAPA 4 (0.50): Grúas torre iluminadas
      const p4 = -(cameraX * 0.5);
      for (let i = 0; i < 7; i++) {
        const cx = i * 360 + (p4 % 360) + 190;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(cx, 110, 14, 345);
        ctx.beginPath();
        ctx.moveTo(cx - 70, 125);
        ctx.lineTo(cx + 120, 125);
        ctx.lineTo(cx + 7, 90);
        ctx.closePath();
        ctx.stroke();
      }

      // CAPA 5 (0.74): Andamios tubulares y focos de obra con halo radial
      const p5 = -(cameraX * 0.74);
      for (let i = 0; i < 12; i++) {
        const sx = i * 240 + (p5 % 240);
        const spot = ctx.createRadialGradient(sx + 45, 330, 3, sx + 45, 330, 55);
        spot.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
        spot.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.arc(sx + 45, 330, 55, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    static drawSagradaSilhouette(ctx, baseX, bottomY, scale = 1.0) {
      ctx.save();
      ctx.translate(baseX, bottomY);
      ctx.scale(scale, scale);

      const bodyGrad = ctx.createLinearGradient(40, -250, 360, 0);
      bodyGrad.addColorStop(0, '#581c87');
      bodyGrad.addColorStop(1, '#311042');
      ctx.beginPath();
      ctx.roundRect(40, -240, 320, 240, 12);
      global.SpriteBank.fillAndStroke(ctx, bodyGrad, '#090d16', 2.6);

      const towers = [
        { x: 55, w: 38, h: 350 },
        { x: 110, w: 42, h: 380 },
        { x: 172, w: 56, h: 430 },
        { x: 248, w: 42, h: 380 },
        { x: 307, w: 38, h: 350 }
      ];

      towers.forEach((t, idx) => {
        const tGrad = ctx.createLinearGradient(t.x, -t.h, t.x + t.w, 0);
        tGrad.addColorStop(0, idx === 2 ? '#a855f7' : '#7e22ce');
        tGrad.addColorStop(1, '#3b0764');

        ctx.beginPath();
        ctx.moveTo(t.x, 0);
        ctx.lineTo(t.x, -200);
        ctx.quadraticCurveTo(t.x + t.w / 2, -t.h - 25, t.x + t.w, -200);
        ctx.lineTo(t.x + t.w, 0);
        ctx.closePath();
        global.SpriteBank.fillAndStroke(ctx, tGrad, '#090d16', 2.4);

        // Pináculo iluminado radialmente
        const pinGlow = ctx.createRadialGradient(
          t.x + t.w / 2,
          -t.h + 14,
          2,
          t.x + t.w / 2,
          -t.h + 14,
          22
        );
        pinGlow.addColorStop(0, '#fef08a');
        pinGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = pinGlow;
        ctx.beginPath();
        ctx.arc(t.x + t.w / 2, -t.h + 14, 22, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rosetón central de vitral con gradiente radial
      const rose = ctx.createRadialGradient(200, -135, 4, 200, -135, 34);
      rose.addColorStop(0, '#fef08a');
      rose.addColorStop(0.5, '#f43f5e');
      rose.addColorStop(1, '#06b6d4');
      ctx.beginPath();
      ctx.arc(200, -135, 34, 0, Math.PI * 2);
      global.SpriteBank.fillAndStroke(ctx, rose, '#090d16', 2.5);

      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // PALMA DE MALLORCA: AGUA PROFUNDA EN POZOS MARINOS (Normal / Tormenta)
    // ------------------------------------------------------------------------
    static drawPalmaSeaFloor(ctx, cameraX, w, h, time, stormy = false) {
      const seaTop = stormy ? 470 : 482;
      const seaGrad = ctx.createLinearGradient(0, seaTop, 0, h);
      if (stormy) {
        seaGrad.addColorStop(0, '#0284c7');
        seaGrad.addColorStop(0.45, '#075985');
        seaGrad.addColorStop(1, '#082f49');
      } else {
        seaGrad.addColorStop(0, '#06b6d4');
        seaGrad.addColorStop(0.5, '#0284c7');
        seaGrad.addColorStop(1, '#075985');
      }
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, seaTop, w, h - seaTop);

      // Olas animadas en la superficie de los abismos
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, h);
      const amp = stormy ? 11 : 4.5;
      const freq = stormy ? 0.042 : 0.032;
      const spd = stormy ? 5.2 : 2.6;
      for (let x = 0; x <= w; x += 12) {
        const wy = seaTop + Math.sin((x + cameraX * 0.65) * freq + time * spd) * amp;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = stormy ? 'rgba(14, 165, 233, 0.55)' : 'rgba(56, 189, 248, 0.55)';
      ctx.fill();

      // Espuma brillante en las crestas
      ctx.strokeStyle = stormy ? '#f0f9ff' : '#bae6fd';
      ctx.lineWidth = stormy ? 3 : 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 12) {
        const wy = seaTop + Math.sin((x + cameraX * 0.65) * freq + time * spd) * amp;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // PALMA NIVEL 1: CATEDRAL DE MALLORCA (LA SEU) Y PASEO MARÍTIMO
    // ------------------------------------------------------------------------
    static drawPalmaSeu(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.5, '#38bdf8');
      sky.addColorStop(0.85, '#bae6fd');
      sky.addColorStop(1, '#fef9c3');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const sun = ctx.createRadialGradient(780 - cameraX * 0.04, 85, 8, 780 - cameraX * 0.04, 85, 160);
      sun.addColorStop(0, '#ffffff');
      sun.addColorStop(0.35, 'rgba(254, 240, 138, 0.68)');
      sun.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(780 - cameraX * 0.04, 85, 160, 0, Math.PI * 2);
      ctx.fill();

      this.drawVolumetricClouds(ctx, cameraX, time, 64, 'rgba(255, 255, 255, 0.8)');

      // CAPA 2 (0.12): Serra de Tramuntana azulada al fondo
      const p2 = -(cameraX * 0.12);
      ctx.save();
      ctx.fillStyle = 'rgba(30, 64, 175, 0.32)';
      ctx.beginPath();
      ctx.moveTo(0, 420);
      for (let i = 0; i <= 14; i++) {
        const px = i * 95 + (p2 % 95);
        const py = 270 + Math.sin(i * 1.4) * 35;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(w, 420);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // CAPA 3 (0.24): Catedral Gótica de Mallorca (La Seu) en piedra marès dorada
      const p3 = -(cameraX * 0.24);
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const cx = ((i * 680 + p3) % 2040) + (i * 680 + p3 < -320 ? 2040 : 0);
        // Nave central y contrafuertes con arbotantes
        ctx.fillStyle = '#d97706';
        ctx.fillRect(cx + 60, 215, 210, 195);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx + 95, 170, 140, 240);

        // Pináculos y arbotantes góticos laterales
        for (let b = 0; b < 5; b++) {
          const bx = cx + 70 + b * 44;
          ctx.fillStyle = '#b45309';
          ctx.fillRect(bx, 188, 12, 222);
          ctx.beginPath();
          ctx.moveTo(bx - 2, 188);
          ctx.lineTo(bx + 6, 152);
          ctx.lineTo(bx + 14, 188);
          ctx.closePath();
          ctx.fillStyle = '#fde68a';
          ctx.fill();
        }

        // Campanario lateral
        ctx.fillStyle = '#b45309';
        ctx.fillRect(cx + 265, 150, 42, 260);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx + 277, 175, 18, 30);

        // Gran Rosetón luminoso "Ojo del Gótico"
        const rose = ctx.createRadialGradient(cx + 165, 228, 3, cx + 165, 228, 28);
        rose.addColorStop(0, '#fef08a');
        rose.addColorStop(0.55, '#f43f5e');
        rose.addColorStop(1, '#38bdf8');
        ctx.beginPath();
        ctx.arc(cx + 165, 228, 28, 0, Math.PI * 2);
        global.SpriteBank.fillAndStroke(ctx, rose, '#451a03', 2.4);

        // Muralla del Parc de la Mar bajo la catedral
        ctx.fillStyle = '#92400e';
        ctx.fillRect(cx - 20, 365, 390, 60);
      }
      ctx.restore();

      // CAPA 4 (0.42): Palmeras del Paseo Marítimo y veleros lejanos
      const p4 = -(cameraX * 0.42);
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const px = ((i * 220 + p4) % 1760) + (i * 220 + p4 < -80 ? 1760 : 0);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(px, 470);
        ctx.quadraticCurveTo(px + 10, 385, px + 4, 330);
        ctx.stroke();

        ctx.fillStyle = '#15803d';
        for (let a = 0; a < 5; a++) {
          const ang = -Math.PI + a * 0.62 + Math.sin(time * 2 + i) * 0.06;
          ctx.beginPath();
          ctx.ellipse(px + 4 + Math.cos(ang) * 18, 330 + Math.sin(ang) * 10, 22, 6, ang, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      this.drawPalmaSeaFloor(ctx, cameraX, w, h, time, false);
    }

    // ------------------------------------------------------------------------
    // PALMA NIVEL 2: CASTELL DE BELLVER (Bosque de pinos, castillo circular, fosos)
    // ------------------------------------------------------------------------
    static drawPalmaBellver(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0369a1');
      sky.addColorStop(0.55, '#0ea5e9');
      sky.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX, time, 58, 'rgba(255, 255, 255, 0.72)');

      // CAPA 2 (0.14): Colina boscosa y pinar mediterráneo
      const p2 = -(cameraX * 0.14);
      ctx.save();
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(0, 480);
      for (let i = 0; i <= 16; i++) {
        const hx = i * 80 + (p2 % 80);
        const hy = 315 + Math.sin(i * 0.9) * 35;
        ctx.lineTo(hx, hy);
      }
      ctx.lineTo(w, 480);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // CAPA 3 (0.26): Icónico Castillo Circular Gótico de Bellver + Torre del Homenaje
      const p3 = -(cameraX * 0.26);
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const bx = ((i * 760 + p3) % 2280) + (i * 760 + p3 < -320 ? 2280 : 0);
        // Tambor circular principal de piedra dorada
        const wallGrad = ctx.createLinearGradient(bx + 40, 200, bx + 260, 200);
        wallGrad.addColorStop(0, '#92400e');
        wallGrad.addColorStop(0.5, '#f59e0b');
        wallGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(bx + 50, 225, 210, 155);

        // Tres torres semicirculares adosadas y Torre del Homenaje al lado con puente
        ctx.fillStyle = '#b45309';
        ctx.fillRect(bx + 40, 195, 32, 185);
        ctx.fillRect(bx + 140, 190, 34, 190);
        ctx.fillRect(bx + 240, 195, 32, 185);

        // Torre del Homenaje independiente conectada por puente elevado
        ctx.fillRect(bx + 308, 150, 40, 230);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(bx + 272, 225, 38, 12);

        // Almenas del castillo
        ctx.fillStyle = '#fde68a';
        for (let a = 0; a < 11; a++) {
          ctx.fillRect(bx + 48 + a * 20, 215, 11, 10);
        }
        // Galería de arcos góticos
        ctx.fillStyle = '#451a03';
        for (let ar = 0; ar < 5; ar++) {
          ctx.beginPath();
          ctx.arc(bx + 85 + ar * 36, 260, 9, Math.PI, 0);
          ctx.lineTo(bx + 94 + ar * 36, 282);
          ctx.lineTo(bx + 76 + ar * 36, 282);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();

      // CAPA 4 (0.44): Pinos de Bellver meciéndose con el viento
      const p4 = -(cameraX * 0.44);
      ctx.save();
      for (let i = 0; i < 12; i++) {
        const px = ((i * 150 + p4) % 1800) + (i * 150 + p4 < -80 ? 1800 : 0);
        const sway = Math.sin(time * 3.2 + i) * 4;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 4, 380, 8, 95);
        ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
        ctx.beginPath();
        ctx.ellipse(px + sway, 372, 34, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(px + 12 + sway * 1.2, 355, 24, 15, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      this.drawPalmaSeaFloor(ctx, cameraX, w, h, time, false);
    }

    // ------------------------------------------------------------------------
    // PALMA NIVEL 3: CALAS Y ACANTILADOS (Agua turquesa, cuevas marinas y rocas)
    // ------------------------------------------------------------------------
    static drawPalmaCalas(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.5, '#22d3ee');
      sky.addColorStop(1, '#fef9c3');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX, time, 54, 'rgba(255, 255, 255, 0.82)');

      // CAPA 2 (0.14): Cabos y acantilados lejanos de la Serra
      const p2 = -(cameraX * 0.14);
      ctx.save();
      ctx.fillStyle = '#0f766e';
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 320 + p2) % 1920) + (i * 320 + p2 < -180 ? 1920 : 0);
        ctx.beginPath();
        ctx.moveTo(cx, 440);
        ctx.lineTo(cx + 40, 270);
        ctx.lineTo(cx + 180, 285);
        ctx.lineTo(cx + 240, 440);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // CAPA 3 (0.28): Acantilados calizos dorados con Cuevas Marinas arqueadas
      const p3 = -(cameraX * 0.28);
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const ax = ((i * 390 + p3) % 1950) + (i * 390 + p3 < -220 ? 1950 : 0);
        const cliffGrad = ctx.createLinearGradient(ax, 220, ax, 470);
        cliffGrad.addColorStop(0, '#fde68a');
        cliffGrad.addColorStop(0.4, '#d97706');
        cliffGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = cliffGrad;
        ctx.beginPath();
        ctx.moveTo(ax, 480);
        ctx.lineTo(ax + 24, 240);
        ctx.lineTo(ax + 195, 252);
        ctx.lineTo(ax + 235, 480);
        ctx.closePath();
        ctx.fill();

        // Corona verde de pinos en lo alto del acantilado
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(ax + 110, 242, 85, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cueva marina oscura a nivel del agua turquesa
        ctx.fillStyle = '#082f49';
        ctx.beginPath();
        ctx.arc(ax + 112, 430, 38, Math.PI, 0);
        ctx.lineTo(ax + 150, 480);
        ctx.lineTo(ax + 74, 480);
        ctx.closePath();
        ctx.fill();

        // Reflejo turquesa dentro de la cueva marina
        ctx.fillStyle = 'rgba(45, 212, 191, 0.35)';
        ctx.fillRect(ax + 82, 462, 60, 16);
      }
      ctx.restore();

      // CAPA 4 (0.45): Horizonte de cala turquesa cristalina con brillos solares
      const coveSea = ctx.createLinearGradient(0, 455, 0, 495);
      coveSea.addColorStop(0, '#2dd4bf');
      coveSea.addColorStop(1, '#0891b2');
      ctx.fillStyle = coveSea;
      ctx.fillRect(0, 455, w, 40);

      this.drawPalmaSeaFloor(ctx, cameraX, w, h, time, false);
    }

    // ------------------------------------------------------------------------
    // PALMA NIVEL 4: PUERTO DE PALMA Y FARO DE PORTO PÍ (Noche, Haz de luz y Tormenta)
    // ------------------------------------------------------------------------
    static drawPalmaPuerto(ctx, cameraX, w, h, time) {
      const lightning = Math.pow(Math.max(0, Math.sin(time * 1.1) * Math.sin(time * 4.7)), 18);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, lightning > 0.35 ? '#334155' : '#020617');
      sky.addColorStop(0.55, lightning > 0.35 ? '#1e3a8a' : '#0f172a');
      sky.addColorStop(1, '#1e293b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Lluvia nocturna en diagonal sobre el puerto
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.4;
      for (let r = 0; r < 55; r++) {
        const rx = ((r * 37 + time * 260) % (w + 120)) - 40;
        const ry = ((r * 83 + time * 480) % h);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 10, ry + 20);
        ctx.stroke();
      }
      ctx.restore();

      // CAPA 2 (0.14): Faro de Porto Pí con haz de luz rotatorio barriendo la noche
      const lightX = Math.max(140, Math.min(820, 740 - (cameraX * 0.14) % 720));
      const lightY = 165;
      ctx.save();
      // Haz volumétrico giratorio del faro
      ctx.save();
      ctx.translate(lightX, lightY);
      ctx.rotate(Math.sin(time * 1.2) * 0.55 - 0.15);
      const beam = ctx.createLinearGradient(0, 0, -520, 0);
      beam.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
      beam.addColorStop(0.6, 'rgba(254, 240, 138, 0.16)');
      beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-540, -95);
      ctx.lineTo(-540, 95);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Torre blanca del Faro de Porto Pí
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(lightX - 18, lightY, 36, 295);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lightX - 20, lightY + 45, 40, 18);
      ctx.fillRect(lightX - 20, lightY + 125, 40, 18);
      // Linterna iluminada
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lightX - 14, lightY - 22, 28, 22);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(lightX, lightY - 22, 16, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      // CAPA 3 (0.34): Mástiles de veleros balanceándose en la tormenta
      const p3 = -(cameraX * 0.34);
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const mx = ((i * 210 + p3) % 1680) + (i * 210 + p3 < -90 ? 1680 : 0);
        const rock = Math.sin(time * 2.4 + i * 1.3) * 0.09;
        ctx.save();
        ctx.translate(mx, 445);
        ctx.rotate(rock);
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(-26, 0);
        ctx.lineTo(26, 0);
        ctx.lineTo(18, 16);
        ctx.lineTo(-18, 16);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -110);
        ctx.stroke();
        // Luz de posición del mástil
        ctx.fillStyle = i % 2 === 0 ? '#f87171' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -112, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Oleaje tormentoso alto en el fondo inferior
      this.drawPalmaSeaFloor(ctx, cameraX, w, h, time, true);
    }

    // ------------------------------------------------------------------------
    // CANARIAS NIVEL 1: DUNAS DE MASPALOMAS (Dunas doradas, Faro de Maspalomas)
    // ------------------------------------------------------------------------
    static drawCanariasMaspalomas(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.45, '#38bdf8');
      sky.addColorStop(0.85, '#fef08a');
      sky.addColorStop(1, '#fdba74');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Sol atlántico intenso
      const sunGrad = ctx.createRadialGradient(780, 96, 12, 780, 96, 140);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
      sunGrad.addColorStop(0.35, 'rgba(253, 224, 71, 0.65)');
      sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(780, 96, 140, 0, Math.PI * 2);
      ctx.fill();

      this.drawVolumetricClouds(ctx, cameraX, time, 64, 'rgba(255, 255, 255, 0.55)');

      // CAPA 2 (0.12): Faro histórico de Maspalomas al horizonte + Oasis de palmeras
      const p2 = -(cameraX * 0.12);
      const faroX = 560 + p2 * 0.6;
      ctx.save();
      ctx.fillStyle = '#57534e';
      ctx.fillRect(faroX - 15, 195, 30, 175);
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(faroX - 18, 200, 36, 12);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(faroX - 13, 176, 26, 20);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(faroX, 186, 8, 0, Math.PI * 2);
      ctx.fill();
      // Cúpula negra del faro
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(faroX, 174, 15, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      // CAPA 3 (0.20): Dunas lejanas ocres onduladas
      const p3 = -(cameraX * 0.2);
      ctx.save();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(0, 460);
      for (let i = 0; i <= 14; i++) {
        const dx = i * 95 + (p3 % 95);
        const dy = 315 + Math.sin(i * 0.85) * 44;
        ctx.lineTo(dx, dy);
      }
      ctx.lineTo(w + 100, 460);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // CAPA 4 (0.34): Dunas doradas intermedias con cresta iluminada y sombra marcada
      const p4 = -(cameraX * 0.34);
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const dx = ((i * 280 + p4) % 1680) + (i * 280 + p4 < -260 ? 1680 : 0);
        const duneGrad = ctx.createLinearGradient(dx, 330, dx + 220, 470);
        duneGrad.addColorStop(0, '#fde047');
        duneGrad.addColorStop(0.55, '#f59e0b');
        duneGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = duneGrad;
        ctx.beginPath();
        ctx.moveTo(dx - 80, 475);
        ctx.quadraticCurveTo(dx + 60, 325, dx + 135, 345);
        ctx.quadraticCurveTo(dx + 220, 365, dx + 310, 475);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Mar azul eléctrico en la parte baja de las dunas (Maspalomas costero)
      this.drawPalmaSeaFloor(ctx, cameraX, w, h, time, false);
    }

    // ------------------------------------------------------------------------
    // CANARIAS NIVEL 2: BOSQUE DE GARAJONAY (Laurisilva milenaria y niebla móvil)
    // ------------------------------------------------------------------------
    static drawCanariasGarajonay(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#064e3b');
      sky.addColorStop(0.5, '#047857');
      sky.addColorStop(1, '#134e4a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Rayos de sol filtrados entre la laurisilva
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const rx = 120 + i * 210 - (cameraX * 0.08) % 210;
        const beam = ctx.createLinearGradient(rx, 0, rx + 80, 460);
        beam.addColorStop(0, 'rgba(209, 250, 229, 0.22)');
        beam.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + 65, 0);
        ctx.lineTo(rx + 185, 480);
        ctx.lineTo(rx + 60, 480);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // CAPA 2 (0.16): Troncos gigantes lejanos de laurisilva y lianas
      const p2 = -(cameraX * 0.16);
      ctx.save();
      for (let i = 0; i < 10; i++) {
        const tx = ((i * 150 + p2) % 1500) + (i * 150 + p2 < -90 ? 1500 : 0);
        ctx.fillStyle = '#022c22';
        ctx.fillRect(tx - 16, 0, 32, 490);
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.arc(tx, 90 + (i % 3) * 28, 72, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Franja de niebla húmeda media flotando
      ctx.save();
      const fogShift = -(cameraX * 0.22 + time * 18);
      ctx.fillStyle = 'rgba(236, 253, 245, 0.22)';
      for (let i = 0; i < 8; i++) {
        const fx = ((i * 210 + fogShift) % 1680) + (i * 210 + fogShift < -180 ? 1680 : 0);
        ctx.beginPath();
        ctx.ellipse(fx, 320 + Math.sin(i * 1.4 + time * 0.7) * 18, 165, 36, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // CAPA 4 (0.38): Árboles retorcidos con musgo en primer plano
      const p4 = -(cameraX * 0.38);
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const tx = ((i * 240 + p4) % 1680) + (i * 240 + p4 < -120 ? 1680 : 0);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(tx - 11, 140, 22, 340);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(tx, 148, 76, 44, 0, 0, Math.PI * 2);
        ctx.fill();
        // Barbas de musgo verde colgando
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2.2;
        for (let m = -36; m <= 36; m += 18) {
          ctx.beginPath();
          ctx.moveTo(tx + m, 182);
          ctx.lineTo(tx + m + Math.sin(time * 2 + i + m) * 4, 218);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Niebla densa cubriendo el fondo de los barrancos
      const mistBottom = ctx.createLinearGradient(0, 390, 0, h);
      mistBottom.addColorStop(0, 'rgba(209, 250, 229, 0)');
      mistBottom.addColorStop(0.55, 'rgba(167, 243, 208, 0.36)');
      mistBottom.addColorStop(1, 'rgba(6, 78, 59, 0.92)');
      ctx.fillStyle = mistBottom;
      ctx.fillRect(0, 390, w, h - 390);
    }

    // ------------------------------------------------------------------------
    // CANARIAS NIVEL 3: TIMANFAYA Y VOLCANES (Cráteres negros y grietas magma)
    // ------------------------------------------------------------------------
    static drawCanariasTimanfaya(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#450a0a');
      sky.addColorStop(0.42, '#9a3412');
      sky.addColorStop(0.85, '#ea580c');
      sky.addColorStop(1, '#f97316');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Sol ocre envuelto en calima volcánica
      ctx.fillStyle = 'rgba(254, 215, 170, 0.72)';
      ctx.beginPath();
      ctx.arc(680, 118, 48, 0, Math.PI * 2);
      ctx.fill();

      // CAPA 2 (0.14): Montañas del Fuego y grandes cráteres humeantes
      const p2 = -(cameraX * 0.14);
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const vx = ((i * 340 + p2) % 1700) + (i * 340 + p2 < -240 ? 1700 : 0);
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.moveTo(vx - 140, 480);
        ctx.lineTo(vx - 38, 210);
        ctx.lineTo(vx + 38, 210);
        ctx.lineTo(vx + 150, 480);
        ctx.closePath();
        ctx.fill();

        // Resplandor rojo saliendo de la boca del cráter
        const craterGlow = 0.45 + Math.sin(time * 3 + i) * 0.25;
        ctx.fillStyle = `rgba(251, 146, 60, ${craterGlow.toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(vx, 210, 34, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // CAPA 3 (0.30): Laderas de picón negro/rojizo con grietas de magma brillante
      const p3 = -(cameraX * 0.3);
      ctx.save();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(0, 480);
      for (let i = 0; i <= 14; i++) {
        const lx = i * 90 + (p3 % 90);
        const ly = 340 + ((i % 3) * 26);
        ctx.lineTo(lx, ly);
      }
      ctx.lineTo(w + 90, 480);
      ctx.closePath();
      ctx.fill();

      // Grietas brillantes en la roca volcánica
      const pulse = 0.65 + Math.sin(time * 4.5) * 0.3;
      ctx.strokeStyle = `rgba(249, 115, 22, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 8; i++) {
        const gx = ((i * 190 + p3) % 1520) + (i * 190 + p3 < -90 ? 1520 : 0);
        ctx.beginPath();
        ctx.moveTo(gx, 385);
        ctx.lineTo(gx + 18, 412);
        ctx.lineTo(gx + 8, 445);
        ctx.stroke();
      }
      ctx.restore();

      // Pavesas flotantes de ceniza caliente
      ctx.save();
      for (let i = 0; i < 16; i++) {
        const sx = ((i * 97 + time * 28 - cameraX * 0.35) % w + w) % w;
        const sy = ((i * 71 - time * 42) % 420 + 420) % 420;
        ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#fb923c';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Brillo de lava fundida en el fondo de los barrancos
      const lavaGlow = ctx.createLinearGradient(0, 455, 0, h);
      lavaGlow.addColorStop(0, 'rgba(234, 88, 12, 0)');
      lavaGlow.addColorStop(0.55, 'rgba(249, 115, 22, 0.72)');
      lavaGlow.addColorStop(1, '#fde047');
      ctx.fillStyle = lavaGlow;
      ctx.fillRect(0, 455, w, h - 455);
    }

    // ------------------------------------------------------------------------
    // CANARIAS NIVEL 4: PICO DEL TEIDE (Cumbre sobre el Mar de Nubes)
    // ------------------------------------------------------------------------
    static drawCanariasTeide(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(0.35, '#1e3a8a');
      sky.addColorStop(0.75, '#0284c7');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Estrellas tenues en el cenit de alta montaña (3.718m)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let i = 0; i < 18; i++) {
        const sx = (i * 113 + 37) % w;
        const sy = 14 + (i * 43) % 92;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.restore();

      // CAPA 2 (0.12): Cono Majestuoso del Pico del Teide al fondo con penacho fumarólico
      const p2 = -(cameraX * 0.08);
      const teideX = 520 + p2 * 0.5;
      ctx.save();
      const peakGrad = ctx.createLinearGradient(teideX, 82, teideX, 390);
      peakGrad.addColorStop(0, '#f8fafc');
      peakGrad.addColorStop(0.24, '#cbd5e1');
      peakGrad.addColorStop(0.55, '#57534e');
      peakGrad.addColorStop(1, '#292524');
      ctx.fillStyle = peakGrad;
      ctx.beginPath();
      ctx.moveTo(teideX - 310, 410);
      ctx.lineTo(teideX - 28, 92);
      ctx.lineTo(teideX + 28, 92);
      ctx.lineTo(teideX + 330, 410);
      ctx.closePath();
      ctx.fill();

      // Fumarola tibia de la cima
      for (let i = 0; i < 4; i++) {
        const plumeY = 78 - ((time * 16 + i * 16) % 60);
        const alpha = 0.45 * (1 - ((78 - plumeY) / 60));
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.max(0, alpha).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(teideX + Math.sin(time * 2 + i) * 10, plumeY, 14 + i * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // CAPA 3 (0.24): Mar de Nubes (Sea of Clouds) esponjoso bajo los precipicios
      const p3 = -(cameraX * 0.24 + time * 10);
      ctx.save();
      ctx.fillStyle = 'rgba(241, 245, 249, 0.88)';
      for (let i = 0; i < 14; i++) {
        const cx = ((i * 120 + p3) % 1680) + (i * 120 + p3 < -120 ? 1680 : 0);
        ctx.beginPath();
        ctx.arc(cx, 358 + Math.sin(i * 1.1) * 12, 68, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillRect(0, 365, w, 125);
      ctx.restore();

      // CAPA 4 (0.40): Roques de García y agujas volcánicas recortadas
      const p4 = -(cameraX * 0.4);
      ctx.save();
      ctx.fillStyle = '#44403c';
      for (let i = 0; i < 6; i++) {
        const rx = ((i * 310 + p4) % 1860) + (i * 310 + p4 < -120 ? 1860 : 0);
        ctx.beginPath();
        ctx.moveTo(rx - 28, 465);
        ctx.lineTo(rx - 14, 285);
        ctx.lineTo(rx + 12, 275);
        ctx.lineTo(rx + 28, 465);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Calor volcánico profundo en las simas del Teide
      const ashGlow = ctx.createLinearGradient(0, 462, 0, h);
      ashGlow.addColorStop(0, 'rgba(234, 88, 12, 0)');
      ashGlow.addColorStop(0.6, 'rgba(249, 115, 22, 0.65)');
      ashGlow.addColorStop(1, '#fb923c');
      ctx.fillStyle = ashGlow;
      ctx.fillRect(0, 462, w, h - 462);
    }

    // ------------------------------------------------------------------------
    // PLATAFORMAS HD CON TEXTURAS DE RELIEVE (Trencadís, Piedra, Andamios, Madera)
    // Validación estricta y defensiva: asegura que x, y, w, h sean números finitos
    // para evitar excepciones no capturadas en createLinearGradient o canvas.
    // ------------------------------------------------------------------------
    static drawPlatform(ctx, p, cameraX) {
      if (!ctx || !p) return;

      const rawX = Number.isFinite(p.x) ? p.x : (Number.isFinite(p.sx) ? p.sx : 0);
      const rawY = Number.isFinite(p.y) ? p.y : (Number.isFinite(p.sy) ? p.sy : 0);
      const w = Number.isFinite(p.w) ? p.w : (Number.isFinite(p.width) ? p.width : 0);
      const h = Number.isFinite(p.h) ? p.h : (Number.isFinite(p.height) ? p.height : 0);
      const camX = Number.isFinite(cameraX) ? cameraX : 0;

      if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || !Number.isFinite(w) || !Number.isFinite(h)) {
        return;
      }
      if (w <= 0 || h <= 0) return;

      const x = rawX - camX;
      const y = rawY;

      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (x + w < -30 || x > 990) return;

      const gradY2 = y + h;
      if (!Number.isFinite(gradY2)) return;

      ctx.save();

      // Cuerpo principal redondeado con gradiente de relieve 3D
      let baseGrad;
      try {
        baseGrad = ctx.createLinearGradient(x, y, x, gradY2);
      } catch (e) {
        ctx.restore();
        return;
      }
      if (p.style === 'promenade' || p.style === 'sand') {
        baseGrad.addColorStop(0, p.style === 'sand' ? '#fde68a' : '#cbd5e1');
        baseGrad.addColorStop(0.2, p.style === 'sand' ? '#f59e0b' : '#94a3b8');
        baseGrad.addColorStop(1, p.style === 'sand' ? '#92400e' : '#334155');
      } else if (p.style === 'wood' || p.style === 'branch') {
        baseGrad.addColorStop(0, p.style === 'branch' ? '#15803d' : '#d97706');
        baseGrad.addColorStop(0.32, '#78350f');
        baseGrad.addColorStop(1, '#451a03');
      } else if (p.style === 'basalt' || p.style === 'volcano') {
        baseGrad.addColorStop(0, '#57534e');
        baseGrad.addColorStop(0.28, '#292524');
        baseGrad.addColorStop(1, '#0c0a09');
      } else if (p.style === 'cobble' || p.style === 'stone') {
        baseGrad.addColorStop(0, '#94a3b8');
        baseGrad.addColorStop(0.25, '#475569');
        baseGrad.addColorStop(1, '#1e293b');
      } else if (p.style === 'balcony') {
        baseGrad.addColorStop(0, '#64748b');
        baseGrad.addColorStop(1, '#0f172a');
      } else if (p.style === 'mosaic') {
        baseGrad.addColorStop(0, '#0284c7');
        baseGrad.addColorStop(1, '#0f172a');
      } else if (p.style === 'tin_roof') {
        const rc = p.roofColor || '#ef4444';
        baseGrad.addColorStop(0, rc);
        baseGrad.addColorStop(1, '#1e293b');
      } else if (p.style === 'marquee') {
        baseGrad.addColorStop(0, '#4c1d95');
        baseGrad.addColorStop(0.5, '#1e1b4b');
        baseGrad.addColorStop(1, '#090d16');
      } else if (p.style === 'container') {
        const cc = p.color || '#dc2626';
        baseGrad.addColorStop(0, cc);
        baseGrad.addColorStop(1, '#0f172a');
      } else if (p.style === 'industrial_crane') {
        baseGrad.addColorStop(0, '#f59e0b');
        baseGrad.addColorStop(1, '#78350f');
      } else if (p.style === 'train_roof') {
        baseGrad.addColorStop(0, '#cbd5e1');
        baseGrad.addColorStop(0.28, '#64748b');
        baseGrad.addColorStop(1, '#1e293b');
      } else if (p.style === 'fin_del_mundo_train') {
        if (h >= 60) {
          baseGrad.addColorStop(0, '#334155');
          baseGrad.addColorStop(0.14, '#1e293b');
          baseGrad.addColorStop(0.18, '#dc2626');
          baseGrad.addColorStop(0.76, '#7f1d1d');
          baseGrad.addColorStop(0.84, '#1f2937');
          baseGrad.addColorStop(1, '#090d16');
        } else {
          baseGrad.addColorStop(0, '#475569');
          baseGrad.addColorStop(0.32, '#b91c1c');
          baseGrad.addColorStop(1, '#450a0a');
        }
      } else if (p.style === 'monument') {
        baseGrad.addColorStop(0, '#f8fafc');
        baseGrad.addColorStop(0.45, '#e2e8f0');
        baseGrad.addColorStop(1, '#94a3b8');
      } else if (p.style === 'kayak') {
        baseGrad.addColorStop(0, '#fb923c');
        baseGrad.addColorStop(0.6, '#ea580c');
        baseGrad.addColorStop(1, '#9a3412');
      } else if (p.style === 'sup') {
        baseGrad.addColorStop(0, '#38bdf8');
        baseGrad.addColorStop(0.5, '#0ea5e9');
        baseGrad.addColorStop(1, '#0369a1');
      } else if (p.style === 'pedal_boat') {
        baseGrad.addColorStop(0, '#fef08a');
        baseGrad.addColorStop(0.55, '#facc15');
        baseGrad.addColorStop(1, '#ca8a04');
      } else if (p.style === 'crowd_barrier') {
        baseGrad.addColorStop(0, '#1e3a8a');
        baseGrad.addColorStop(0.5, '#facc15');
        baseGrad.addColorStop(1, '#172554');
      } else if (p.style === 'ice' || p.style === 'fragile_ice') {
        baseGrad.addColorStop(0, p.style === 'fragile_ice' ? '#e0f2fe' : '#bae6fd');
        baseGrad.addColorStop(0.42, p.style === 'fragile_ice' ? '#7dd3fc' : '#38bdf8');
        baseGrad.addColorStop(1, p.style === 'fragile_ice' ? '#0284c7' : '#0369a1');
      } else if (p.style === 'aerosilla') {
        baseGrad.addColorStop(0, '#0284c7');
        baseGrad.addColorStop(0.5, '#1e3a8a');
        baseGrad.addColorStop(1, '#0f172a');
      } else if (p.style === 'snow_dock') {
        baseGrad.addColorStop(0, '#f8fafc');
        baseGrad.addColorStop(0.28, '#92400e');
        baseGrad.addColorStop(1, '#451a03');
      } else if (p.style === 'faro_rock') {
        baseGrad.addColorStop(0, '#64748b');
        baseGrad.addColorStop(0.45, '#334155');
        baseGrad.addColorStop(1, '#0f172a');
      } else if (p.style === 'funicular') {
        baseGrad.addColorStop(0, '#dc2626');
        baseGrad.addColorStop(0.55, '#991b1b');
        baseGrad.addColorStop(1, '#450a0a');
      } else if (p.style === 'teleferico') {
        baseGrad.addColorStop(0, '#38bdf8');
        baseGrad.addColorStop(0.55, '#0369a1');
        baseGrad.addColorStop(1, '#0c4a6e');
      } else if (p.style === 'valpo_stairs') {
        baseGrad.addColorStop(0, '#fbbf24');
        baseGrad.addColorStop(0.5, '#0ea5e9');
        baseGrad.addColorStop(1, '#be123c');
      } else if (p.style === 'salt') {
        baseGrad.addColorStop(0, '#ffffff');
        baseGrad.addColorStop(0.48, '#e0f2fe');
        baseGrad.addColorStop(1, '#7dd3fc');
      } else if (p.style === 'red_rock') {
        baseGrad.addColorStop(0, '#ea580c');
        baseGrad.addColorStop(0.52, '#b45309');
        baseGrad.addColorStop(1, '#7c2d12');
      } else if (p.style === 'observatory') {
        baseGrad.addColorStop(0, '#e2e8f0');
        baseGrad.addColorStop(0.45, '#475569');
        baseGrad.addColorStop(1, '#0f172a');
      } else if (p.style === 'moai_stone') {
        baseGrad.addColorStop(0, '#a8a29e');
        baseGrad.addColorStop(0.52, '#57534e');
        baseGrad.addColorStop(1, '#292524');
      } else if (p.style === 'tropical_sand') {
        baseGrad.addColorStop(0, '#fef9c3');
        baseGrad.addColorStop(0.5, '#fde68a');
        baseGrad.addColorStop(1, '#d97706');
      } else if (p.style === 'ship_deck') {
        baseGrad.addColorStop(0, '#475569');
        baseGrad.addColorStop(0.22, '#1e293b');
        baseGrad.addColorStop(1, '#090d16');
      } else if (p.style === 'ship_bridge') {
        baseGrad.addColorStop(0, '#ffffff');
        baseGrad.addColorStop(0.4, '#cbd5e1');
        baseGrad.addColorStop(1, '#475569');
      } else if (p.style === 'ship_funnel') {
        baseGrad.addColorStop(0, '#0f172a');
        baseGrad.addColorStop(0.28, '#dc2626');
        baseGrad.addColorStop(1, '#7f1d1d');
      } else if (p.style === 'container_red') {
        baseGrad.addColorStop(0, '#ef4444');
        baseGrad.addColorStop(0.55, '#b91c1c');
        baseGrad.addColorStop(1, '#450a0a');
      } else if (p.style === 'container_blue') {
        baseGrad.addColorStop(0, '#38bdf8');
        baseGrad.addColorStop(0.55, '#1d4ed8');
        baseGrad.addColorStop(1, '#172554');
      } else if (p.style === 'container_yellow') {
        baseGrad.addColorStop(0, '#fde047');
        baseGrad.addColorStop(0.55, '#d97706');
        baseGrad.addColorStop(1, '#78350f');
      } else if (p.style === 'floral_lawn') {
        baseGrad.addColorStop(0, '#84cc16');
        baseGrad.addColorStop(0.28, '#16a34a');
        baseGrad.addColorStop(1, '#14532d');
      } else {
        baseGrad.addColorStop(0, p.style === 'crane' ? '#fbbf24' : '#94a3b8');
        baseGrad.addColorStop(1, p.style === 'crane' ? '#b45309' : '#334155');
      }

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      global.SpriteBank.fillAndStroke(ctx, baseGrad, '#090d16', 2.4);

      // Borde superior claro (#ffffff, dorado suave #fef08a, o brasa basáltica #fb923c)
      ctx.fillStyle =
        p.style === 'basalt' || p.style === 'volcano'
          ? '#fb923c'
          : p.style === 'wood' || p.style === 'crane' || p.style === 'balcony' || p.style === 'branch'
          ? '#fef08a'
          : '#ffffff';
      ctx.fillRect(x + 4, y, Math.max(0, w - 8), 2.2);

      // Relieve superior de trencadís, sillería, basaltos con magma, o vigas metálicas
      if (p.style === 'basalt' || p.style === 'volcano') {
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let vx = x + 16; vx < x + w - 16; vx += 34) {
          ctx.moveTo(vx, y + 4);
          ctx.lineTo(vx + 6, y + Math.min(h - 3, 14));
        }
        ctx.stroke();
      } else if (p.style === 'branch') {
        ctx.fillStyle = '#4ade80';
        for (let bx = x + 10; bx < x + w - 10; bx += 20) {
          ctx.fillRect(bx, y + 2, 10, 4);
        }
      } else if (p.style === 'mosaic') {
        const shardColors = ['#fbbf24', '#06b6d4', '#f43f5e', '#a855f7', '#10b981', '#ffffff'];
        for (let mx = 6; mx < w - 8; mx += 14) {
          ctx.beginPath();
          ctx.arc(x + mx + 4, y + 6, 5.2, 0, Math.PI * 2);
          global.SpriteBank.fillAndStroke(
            ctx,
            shardColors[Math.floor(mx / 14) % shardColors.length],
            '#090d16',
            1.2
          );
        }
      } else if (p.style === 'cobble' || p.style === 'stone' || p.style === 'promenade') {
        for (let sx = 8; sx < w - 16; sx += 26) {
          ctx.beginPath();
          ctx.roundRect(x + sx, y + 3, 20, 8, 3);
          global.SpriteBank.fillAndStroke(
            ctx,
            p.style === 'promenade' ? '#fb923c' : '#cbd5e1',
            '#0f172a',
            1.2
          );
        }
      } else if (p.style === 'balcony') {
        // Barandilla de hierro forjado y maceta florida
        for (let bx = x + 8; bx < x + w - 6; bx += 14) {
          global.SpriteBank.drawCapsule(ctx, bx, y - 12, bx, y, 1.5, '#334155', '#090d16', 1.2);
        }
        global.SpriteBank.drawCapsule(ctx, x + 6, y - 12, x + w - 6, y - 12, 2.0, '#94a3b8', '#090d16', 1.4);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y - 10, 7, 0, Math.PI * 2);
        global.SpriteBank.fillAndStroke(ctx, '#f43f5e', '#090d16', 1.4);
      } else if (p.style === 'scaffold' || p.style === 'crane') {
        // Celosía metálica diagonal en relieve
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let tx = x + 6; tx < x + w - 14; tx += 16) {
          ctx.moveTo(tx, y + 3);
          ctx.lineTo(tx + 12, y + h - 3);
          ctx.moveTo(tx + 12, y + 3);
          ctx.lineTo(tx, y + h - 3);
        }
        ctx.stroke();
      } else if (p.style === 'tin_roof') {
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 1.6;
        for (let rx = x + 10; rx < x + w - 6; rx += 12) {
          ctx.beginPath();
          ctx.moveTo(rx, y + 2);
          ctx.lineTo(rx, y + h - 2);
          ctx.stroke();
        }
      } else if (p.style === 'marquee') {
        // Bombillas de neón bordeando la marquesina de Av. Corrientes
        for (let lx = x + 10; lx < x + w - 8; lx += 16) {
          ctx.fillStyle = Math.floor(lx / 16) % 2 === 0 ? '#fde047' : '#f472b6';
          ctx.beginPath();
          ctx.arc(lx, y + h * 0.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.style === 'container') {
        ctx.strokeStyle = 'rgba(15,23,42,0.45)';
        ctx.lineWidth = 2;
        for (let cx = x + 10; cx < x + w - 8; cx += 12) {
          ctx.beginPath();
          ctx.moveTo(cx, y + 2);
          ctx.lineTo(cx, y + h - 2);
          ctx.stroke();
        }
      } else if (p.style === 'industrial_crane') {
        // Cables colgantes de la grúa de Puerto Madero
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 14, y);
        ctx.lineTo(x + 14, 0);
        ctx.moveTo(x + w - 14, y);
        ctx.lineTo(x + w - 14, 0);
        ctx.stroke();
      } else if (p.style === 'train_roof') {
        // Detalles celeste y blanco del Tren Mitre sobre la carrocería
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x + 4, y + 10, Math.max(0, w - 8), 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 18, Math.max(0, w - 8), 5);
        for (let wx = x + 22; wx < x + w - 26; wx += 44) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(wx, y + 28, 26, 16);
        }
      } else if (p.style === 'fin_del_mundo_train') {
        const nowSec = typeof performance !== 'undefined' ? performance.now() * 0.001 : Date.now() * 0.001;
        if (h >= 60) {
          // Techo pizarra con borde de nieve blanca fueguina
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 3, y + 1, Math.max(0, w - 6), 4.5);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(x + 6, y + 5.5, Math.max(0, w - 12), 2.5);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 2, y + 9, Math.max(0, w - 4), 7);

          // Moldura de madera oscura y listón dorado del Ferrocarril Austral Fueguino
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(x + 4, y + 16, Math.max(0, w - 8), 5);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(x + 8, y + 54, Math.max(0, w - 16), 2.2);

          // Divisores / fuelles oscuros cada ~250 px entre vagones de la formación
          const bodyBottom = y + h - 22;
          for (let segX = x; segX <= x + w - 20; segX += 250) {
            if (segX > x + 40 && segX < x + w - 50) {
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(segX - 7, y + 12, 14, bodyBottom - (y + 12));
              ctx.fillStyle = '#334155';
              ctx.fillRect(segX - 3, y + 14, 6, bodyBottom - (y + 14));
            }
          }
          // Acoples/fuelles en los extremos izquierdo y derecho de cada carro
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x - 3, y + 14, 8, bodyBottom - (y + 14));
          if (!p.isLocomotive) {
            ctx.fillRect(x + w - 5, y + 14, 8, bodyBottom - (y + 14));
          }

          // Ventanales rectangulares cálidos iluminados
          for (let wx = x + 22; wx < x + w - 46; wx += 46) {
            if (wx % 250 > 228) continue;
            ctx.fillStyle = '#451a03';
            ctx.fillRect(wx - 2, y + 23, 30, 24);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(wx + 1, y + 26, 24, 18);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.fillRect(wx + 1, y + 26, 24, 6);
          }

          // Chasis oscuro inferior + ruedas ferroviarias giratorias
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 4, bodyBottom, Math.max(0, w - 8), 8);
          const wheelRot = -(cameraX * 0.05 + nowSec * 9.5);
          for (let rx = x + 36; rx < x + w - 28; rx += 86) {
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(rx, y + h - 10, 9.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(rx, y + h - 10, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(rx + Math.cos(wheelRot) * 7.5, y + h - 10 + Math.sin(wheelRot) * 7.5);
            ctx.lineTo(rx - Math.cos(wheelRot) * 7.5, y + h - 10 - Math.sin(wheelRot) * 7.5);
            ctx.stroke();
          }

          // Locomotora a vapor frontal (chimenea, humo blanco y Bandera Argentina en la punta derecha)
          if (p.isLocomotive && w > 220) {
            const lx = x + w - 168;
            // Chimenea negra y caldera cilíndrica
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(lx + 42, y - 24, 16, 26);
            ctx.fillRect(lx + 38, y - 28, 24, 6);
            // Penacho de humo blanco saliendo de la chimenea
            for (let s = 0; s < 5; s++) {
              const drift = ((nowSec * 3.2 + s * 0.4) % 2.0) / 2.0;
              const sx = lx + 44 - drift * 110 - s * 16;
              const sy = y - 34 - drift * 36 - s * 7;
              ctx.fillStyle = `rgba(255, 255, 255, ${(0.82 - drift * 0.55).toFixed(2)})`;
              ctx.beginPath();
              ctx.arc(sx, sy, 9 + drift * 13 + s * 2, 0, Math.PI * 2);
              ctx.fill();
            }
            // Quitanieves negro frontal en el morro derecho
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(x + w - 12, y + h - 6);
            ctx.lineTo(x + w + 14, y + h - 6);
            ctx.lineTo(x + w - 12, y + 52);
            ctx.closePath();
            ctx.fill();
            // Bandera Argentina en el lateral de la locomotora
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(lx + 74, y + 26, 44, 24);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(lx + 74, y + 26, 44, 8);
            ctx.fillRect(lx + 74, y + 42, 44, 8);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(lx + 96, y + 38, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.6;
            ctx.strokeRect(lx + 74, y + 26, 44, 24);
          }
        } else {
          // Plataforma elevada / techo superior de vagón con moldura nieve + acero + viga carmesí
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 3, y + 1, Math.max(0, w - 6), 3.2);
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 2, y + 4.2, Math.max(0, w - 4), 4);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(x + 6, y + Math.max(9, h - 5), Math.max(0, w - 12), 1.8);
          for (let rx = x + 16; rx < x + w - 14; rx += 28) {
            ctx.fillStyle = '#fecaca';
            ctx.fillRect(rx, y + 11, 3, 3);
          }
        }
      } else if (p.style === 'monument') {
        // Relieve de mármol travertino del Monumento a la Bandera
        ctx.strokeStyle = 'rgba(100,116,139,0.35)';
        ctx.lineWidth = 1.5;
        for (let mx = x + 24; mx < x + w - 16; mx += 32) {
          ctx.beginPath();
          ctx.moveTo(mx, y + 2);
          ctx.lineTo(mx, y + h - 2);
          ctx.stroke();
        }
      } else if (p.style === 'kayak') {
        // Remo apoyado y franja blanca deportiva
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 12, y + h * 0.45, Math.max(0, w - 24), 4);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + 4, Math.min(18, w * 0.25), 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.style === 'sup') {
        // Pad antideslizante de tabla SUP sobre el Paraná
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 10, y + 3, Math.max(0, w - 20), 4);
      } else if (p.style === 'pedal_boat') {
        // Pico naranja y ojo de bote a pedal con forma de pato
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(x + w - 8, y + 8, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + w - 16, y + 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.style === 'crowd_barrier') {
        // Paravalanchas azul y amarillo del Gigante de Arroyito
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x + 4, y + 2, Math.max(0, w - 8), 5);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(x + 4, y + 10, Math.max(0, w - 8), Math.max(4, h - 14));
      } else if (p.style === 'ice' || p.style === 'fragile_ice') {
        // Capa superior de nieve cristalina + reflejos diagonales de hielo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 3, y + 1, Math.max(0, w - 6), 4);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1.6;
        for (let ix = x + 10; ix < x + w - 12; ix += 24) {
          ctx.beginPath();
          ctx.moveTo(ix, y + 6);
          ctx.lineTo(ix + 10, y + h - 3);
          ctx.stroke();
        }
        if (p.style === 'fragile_ice') {
          ctx.strokeStyle = '#0c4a6e';
          ctx.lineWidth = 1.5;
          for (let fx = x + 16; fx < x + w - 14; fx += 28) {
            ctx.beginPath();
            ctx.moveTo(fx, y + 2);
            ctx.lineTo(fx + 5, y + h * 0.55);
            ctx.lineTo(fx - 2, y + h - 2);
            ctx.stroke();
          }
        }
      } else if (p.style === 'aerosilla') {
        // Cable y percha de acero de la Aerosilla del Glaciar Martial
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y);
        ctx.lineTo(x + w * 0.5, 0);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 8, y + 3, Math.max(0, w - 16), 4);
      } else if (p.style === 'snow_dock') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 1, Math.max(0, w - 4), Math.min(7, h * 0.3));
        ctx.fillStyle = '#78350f';
        for (let dx = x + 18; dx < x + w - 12; dx += 36) {
          ctx.fillRect(dx, y + Math.min(8, h * 0.35), 2, Math.max(4, h - 10));
        }
      } else if (p.style === 'faro_rock') {
        // Musgo dorado-oliva fueguino y cristales rocosos
        ctx.fillStyle = '#84cc16';
        for (let mx = x + 8; mx < x + w - 18; mx += 34) {
          ctx.fillRect(mx, y + 2, 16, 4);
        }
      } else if (p.style === 'funicular') {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(x + 8, y + 4, Math.max(0, w - 16), 4);
        ctx.fillStyle = '#1e293b';
        for (let fx = x + 12; fx < x + w - 14; fx += 20) {
          ctx.fillRect(fx, y + 10, 12, Math.max(4, h - 13));
        }
      } else if (p.style === 'teleferico') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y);
        ctx.lineTo(x + w * 0.5, 0);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x + 10, y + 4, Math.max(0, w - 20), 4);
      } else if (p.style === 'valpo_stairs') {
        const stairCols = ['#facc15', '#38bdf8', '#fb7185', '#4ade80'];
        for (let sx = 6, idx = 0; sx < w - 12; sx += 22, idx++) {
          ctx.fillStyle = stairCols[idx % stairCols.length];
          ctx.fillRect(x + sx, y + 3, 18, Math.max(4, h - 6));
        }
      } else if (p.style === 'salt') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 1, Math.max(0, w - 4), 4);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.42)';
        ctx.lineWidth = 1.4;
        for (let sx = x + 14; sx < x + w - 14; sx += 26) {
          ctx.strokeRect(sx, y + 5, 16, Math.max(4, h - 8));
        }
      } else if (p.style === 'red_rock') {
        ctx.fillStyle = '#fdba74';
        ctx.fillRect(x + 4, y + 2, Math.max(0, w - 8), 3);
        ctx.fillStyle = '#431407';
        for (let rx = x + 14; rx < x + w - 18; rx += 30) {
          ctx.fillRect(rx, y + 9, 14, 3);
        }
      } else if (p.style === 'observatory') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 6, y + 2, Math.max(0, w - 12), 2.5);
        for (let ox = x + 14; ox < x + w - 12; ox += 24) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(ox, y + 7, 10, Math.max(3, h - 10));
        }
      } else if (p.style === 'moai_stone') {
        ctx.fillStyle = '#d6d3d1';
        ctx.fillRect(x + 4, y + 2, Math.max(0, w - 8), 3);
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1.5;
        for (let mx = x + 18; mx < x + w - 16; mx += 32) {
          ctx.beginPath();
          ctx.moveTo(mx, y + 3);
          ctx.lineTo(mx + 4, y + h - 3);
          ctx.stroke();
        }
      } else if (p.style === 'tropical_sand') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 1, Math.max(0, w - 8), 3);
        ctx.fillStyle = '#f59e0b';
        for (let tx = x + 12; tx < x + w - 12; tx += 22) {
          ctx.fillRect(tx, y + 7, 6, 3);
        }
      } else if (p.style === 'ship_deck') {
        // Cubierta de buque mercante: barandilla metálica superior, franja blanca/ámbar naval y remaches del casco
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + 3, y + 3, Math.max(0, w - 6), 3.5);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x + 4, y + 8, Math.max(0, w - 8), 2.5);
        ctx.fillStyle = '#94a3b8';
        for (let rx = x + 12; rx < x + w - 12; rx += 26) {
          ctx.beginPath();
          ctx.arc(rx, y + 16, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Baranda de acero en plataformas elevadas o tramos cortos
        if (h <= 28) {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.4;
          for (let bx = x + 10; bx < x + w - 8; bx += 20) {
            ctx.beginPath();
            ctx.moveTo(bx, y);
            ctx.lineTo(bx, y - 9);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(x + 6, y - 9);
          ctx.lineTo(x + w - 6, y - 9);
          ctx.stroke();
        }
      } else if (p.style === 'ship_bridge') {
        // Puente de mando blanco con ventanas panorámicas iluminadas en ámbar/celeste
        ctx.fillStyle = '#1e293b';
        for (let wx = x + 14; wx < x + w - 26; wx += 30) {
          ctx.fillRect(wx, y + 7, 20, Math.min(12, Math.max(6, h - 12)));
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(wx + 2, y + 9, 16, Math.min(8, Math.max(4, h - 16)));
          ctx.fillStyle = '#1e293b';
        }
      } else if (p.style === 'ship_funnel') {
        // Chimenea naval con banda dorada y franjas de ventilación
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x + 4, y + 8, Math.max(0, w - 8), 4);
        ctx.fillStyle = '#450a0a';
        for (let fx = x + 12; fx < x + w - 14; fx += 18) {
          ctx.fillRect(fx, y + 16, 9, Math.max(4, h - 22));
        }
      } else if (p.style === 'container_red' || p.style === 'container_blue' || p.style === 'container_yellow') {
        // Nervaduras corrugadas verticales de contenedor marítimo + insignia lateral blanca
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.lineWidth = 2;
        for (let cx = x + 10; cx < x + w - 10; cx += 12) {
          ctx.beginPath();
          ctx.moveTo(cx, y + 4);
          ctx.lineTo(cx, y + h - 4);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(x + Math.max(8, w * 0.14), y + 6, Math.min(28, w * 0.25), 5);
      } else if (p.style === 'floral_lawn') {
        // Césped verde vivo con flores rojas y amarillas de Viña del Mar
        ctx.fillStyle = '#bef264';
        ctx.fillRect(x + 3, y + 1, Math.max(0, w - 6), 4);
        for (let fx = x + 14; fx < x + w - 12; fx += 24) {
          ctx.fillStyle = Math.floor(fx / 24) % 2 === 0 ? '#f43f5e' : '#fde047';
          ctx.beginPath();
          ctx.arc(fx, y + 9, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // BUENOS AIRES: 4 FONDOS PARALLAX HD POR BARRIO / ZONA
    // ------------------------------------------------------------------------
    static drawBaCaminito(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0369a1');
      sky.addColorStop(0.55, '#fb923c');
      sky.addColorStop(1, '#fde68a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Puente Transbordador Nicolás Avellaneda en la lejanía (capa 1)
      ctx.save();
      const bx = -((cameraX * 0.14) % 520);
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 3;
      for (let rx = bx; rx < w + 300; rx += 520) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.35)';
        ctx.fillRect(rx + 90, 120, 22, 240);
        ctx.fillRect(rx + 360, 120, 22, 240);
        ctx.fillRect(rx + 60, 128, 350, 14);
      }
      ctx.restore();

      // Conventillos multicolores de chapa de La Boca (capa 2 & 3)
      const colors = ['#dc2626', '#2563eb', '#eab308', '#16a34a', '#db2777', '#ea580c'];
      const offset = -((cameraX * 0.38) % 240);
      for (let i = -1; i < 6; i++) {
        const hx = offset + i * 240;
        const c1 = colors[(i + 6) % colors.length];
        const c2 = colors[(i + 8) % colors.length];
        ctx.fillStyle = c1;
        ctx.fillRect(hx + 10, 210, 105, 250);
        ctx.fillStyle = c2;
        ctx.fillRect(hx + 122, 185, 108, 275);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 10, 210, 105, 250);
        ctx.strokeRect(hx + 122, 185, 108, 275);
        // Balcones y ventanas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hx + 34, 240, 26, 36);
        ctx.fillRect(hx + 70, 240, 26, 36);
        ctx.fillRect(hx + 148, 222, 26, 38);
        ctx.fillRect(hx + 184, 222, 26, 38);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(hx + 22, 282, 82, 5);
        ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.08 * Math.sin(time + i)})`;
        ctx.fillRect(hx + 150, 225, 22, 12);
      }
    }

    static drawBaCorrientes(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#090d16');
      sky.addColorStop(0.55, '#1e1b4b');
      sky.addColorStop(1, '#312e81');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Obelisco de Buenos Aires iluminado al fondo
      const obX = ((680 - cameraX * 0.12) % (w + 420) + (w + 420)) % (w + 420) - 120;
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(obX - 18, 420);
      ctx.lineTo(obX - 9, 98);
      ctx.lineTo(obX, 72);
      ctx.lineTo(obX + 9, 98);
      ctx.lineTo(obX + 18, 420);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(253, 224, 71, 0.32)';
      ctx.fillRect(obX - 24, 72, 48, 348);

      // Teatros y carteles neón de Avenida Corrientes
      const off = -((cameraX * 0.36) % 280);
      const neons = ['#ec4899', '#22d3ee', '#facc15', '#a855f7'];
      for (let i = -1; i < 5; i++) {
        const bx = off + i * 280;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx + 12, 145, 246, 315);
        const col = neons[(i + 4) % neons.length];
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.72 + 0.25 * Math.sin(time * 4 + i);
        ctx.fillRect(bx + 28, 178, 214, 24);
        ctx.fillRect(bx + 44, 224, 180, 14);
        ctx.globalAlpha = 1;
      }

      // Estelas rápidas de autos abajo en la avenida
      for (let t = 0; t < 8; t++) {
        const carX = ((t * 170 - time * 320) % (w + 180) + (w + 180)) % (w + 180) - 90;
        ctx.fillStyle = t % 2 === 0 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(254, 240, 138, 0.75)';
        ctx.fillRect(carX, 444 + (t % 2) * 8, 46, 4);
      }
    }

    static drawBaMadero(ctx, cameraX, w, h, time) {
      const t = Number.isFinite(time) ? time : 0;
      const waterY = h - 128; // ~412px: agua nocturna del dique
      const quayY = waterY - 22; // ~390px: borde de piedra del muelle

      // 1. Cielo nocturno / crepuscular de Puerto Madero (azul marino profundo a cálido anochecer en el horizonte)
      const sky = ctx.createLinearGradient(0, 0, 0, waterY);
      sky.addColorStop(0.0, '#050e22');
      sky.addColorStop(0.38, '#0c234b');
      sky.addColorStop(0.64, '#24305e');
      sky.addColorStop(0.84, '#6d4568');
      sky.addColorStop(1.0, '#b26856');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, waterY);

      // Estrellas sutiles en la parte alta del cielo marino
      ctx.save();
      for (let i = 0; i < 36; i++) {
        const sx = ((i * 197 + 41 - cameraX * 0.02) % w + w) % w;
        const sy = 14 + ((i * 73) % Math.max(40, Math.round(waterY * 0.34)));
        const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1 + i * 1.7));
        ctx.fillStyle = `rgba(226, 232, 240, ${twinkle.toFixed(2)})`;
        ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1.5, i % 3 === 0 ? 2 : 1.5);
      }

      // Nubes tenues teñidas por el resplandor cálido del atardecer
      const cloudShift = -((cameraX * 0.05) % w);
      for (let c = 0; c < 6; c++) {
        const cx = ((cloudShift + c * 210 + 90) % (w + 260)) - 130;
        const cy = 175 + (c % 3) * 34;
        const cw = 150 + (c % 2) * 55;
        const cg = ctx.createRadialGradient(cx, cy, 8, cx, cy, cw);
        cg.addColorStop(0, 'rgba(226, 138, 134, 0.16)');
        cg.addColorStop(0.55, 'rgba(130, 92, 148, 0.14)');
        cg.addColorStop(1, 'rgba(30, 41, 82, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, 28 + (c % 2) * 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2. Horizonte de Rascacielos modernos iluminados (parallax lejano 0.16)
      const skyClusterW = 860;
      const skyOff = -(((cameraX * 0.16) % skyClusterW + skyClusterW) % skyClusterW);
      for (let rep = -1; rep < 3; rep++) {
        const bx = skyOff + rep * skyClusterW;

        // A) Torre residencial alta izquierda con corona dorada cálida y antena
        ctx.fillStyle = '#111b30';
        ctx.fillRect(bx + 150, 92, 54, quayY - 92);
        ctx.fillStyle = '#1d2d4a';
        ctx.fillRect(bx + 154, 96, 22, quayY - 96);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(bx + 162, 82, 30, 10);
        ctx.fillRect(bx + 176, 62, 2, 20);
        // Grilla de ventanas cálidas y frías
        for (let wy = 104; wy < quayY - 24; wy += 12) {
          for (let wx = 0; wx < 4; wx++) {
            const lit = ((wx * 7 + wy * 3 + rep) % 5) !== 0;
            if (!lit) continue;
            ctx.fillStyle = (wx + wy) % 3 === 0 ? 'rgba(253, 224, 71, 0.72)' : 'rgba(186, 230, 253, 0.45)';
            ctx.fillRect(bx + 155 + wx * 12, wy, 7, 6);
          }
        }

        // B) Torre gemela escalonada con techo inclinado luminoso
        ctx.fillStyle = '#16243d';
        ctx.fillRect(bx + 210, 118, 44, quayY - 118);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(bx + 214, 118);
        ctx.lineTo(bx + 250, 102);
        ctx.lineTo(bx + 250, 118);
        ctx.closePath();
        ctx.fill();
        for (let wy = 128; wy < quayY - 26; wy += 11) {
          ctx.fillStyle = (wy % 22 === 0) ? 'rgba(253, 230, 138, 0.65)' : 'rgba(125, 211, 252, 0.35)';
          ctx.fillRect(bx + 216, wy, 32, 4);
        }

        // C) Torre de vidrio diagonal azul-cian (estilo Torre Repsol-YPF / Madero)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx + 276, 134);
        ctx.lineTo(bx + 332, 110);
        ctx.lineTo(bx + 344, quayY);
        ctx.lineTo(bx + 266, quayY);
        ctx.closePath();
        const glassG = ctx.createLinearGradient(bx + 266, 110, bx + 344, quayY);
        glassG.addColorStop(0, '#0ea5e9');
        glassG.addColorStop(0.45, '#1e3a5f');
        glassG.addColorStop(1, '#0f172a');
        ctx.fillStyle = glassG;
        ctx.fill();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // Rayas horizontales acristaladas + remate violeta
        for (let wy = 136; wy < quayY - 18; wy += 13) {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
          ctx.fillRect(bx + 274, wy, 60, 2.5);
        }
        ctx.fillStyle = 'rgba(217, 70, 239, 0.72)';
        ctx.beginPath();
        ctx.moveTo(bx + 292, 127);
        ctx.lineTo(bx + 332, 110);
        ctx.lineTo(bx + 333, 132);
        ctx.lineTo(bx + 293, 146);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // D) Torre cilíndrica / escalonada alta central (Torre YPF / Mulieris)
        const towerG = ctx.createLinearGradient(bx + 354, 70, bx + 414, quayY);
        towerG.addColorStop(0, '#334155');
        towerG.addColorStop(0.5, '#1e293b');
        towerG.addColorStop(1, '#0f172a');
        ctx.fillStyle = towerG;
        ctx.beginPath();
        ctx.moveTo(bx + 358, 72);
        ctx.quadraticCurveTo(bx + 384, 66, bx + 410, 76);
        ctx.lineTo(bx + 414, quayY);
        ctx.lineTo(bx + 354, quayY);
        ctx.closePath();
        ctx.fill();
        // Ventanas horizontales iluminadas en ámbar suave y blanco
        for (let wy = 92; wy < quayY - 22; wy += 10) {
          ctx.fillStyle = wy % 20 === 0 ? 'rgba(253, 224, 71, 0.58)' : 'rgba(226, 232, 240, 0.30)';
          ctx.fillRect(bx + 360, wy, 48, 3);
        }
        // Baliza roja aérea
        const beaconAlpha = 0.5 + 0.5 * Math.sin(t * 4.2 + rep);
        ctx.fillStyle = `rgba(239, 68, 68, ${beaconAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(bx + 384, 67, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // E) Dos torres esbeltas a la derecha con iluminación ámbar cálida
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx + 424, 152, 42, quayY - 152);
        ctx.fillRect(bx + 474, 162, 34, quayY - 162);
        ctx.fillRect(bx + 522, 184, 38, quayY - 184);
        ctx.fillRect(bx + 534, 168, 14, 16);
        for (let wy = 166; wy < quayY - 20; wy += 11) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
          ctx.fillRect(bx + 430, wy, 12, 4);
          ctx.fillRect(bx + 448, wy + 4, 12, 4);
          ctx.fillStyle = 'rgba(186, 230, 253, 0.42)';
          ctx.fillRect(bx + 480, wy + 8, 22, 4);
          if (wy >= 194) {
            ctx.fillStyle = 'rgba(253, 224, 71, 0.52)';
            ctx.fillRect(bx + 528, wy, 26, 4);
          }
        }

        // F) Edificios vidriados de media altura en el sector izquierdo del dique + letrero vertical azul
        ctx.fillStyle = '#172554';
        ctx.fillRect(bx + 24, 286, 212, quayY - 286);
        for (let wy = 296; wy < quayY - 14; wy += 16) {
          ctx.fillStyle = wy % 32 === 0 ? 'rgba(186, 230, 253, 0.65)' : 'rgba(253, 230, 138, 0.68)';
          ctx.fillRect(bx + 32, wy, 196, 8);
        }
        // Letrero vertical luminoso azul-violeta en el extremo del complejo
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(bx + 4, 294, 22, 74);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bx + 4, 294, 22, 74);
        ctx.fillStyle = '#e0f2fe';
        for (let ly = 304; ly <= 354; ly += 12) {
          ctx.fillRect(bx + 9, ly, 12, 5);
        }
      }

      // 3. Diques históricos de ladrillo rojizo reciclado y grúas portuarias amarillas (parallax medio 0.28)
      const dockClusterW = 760;
      const dockOff = -(((cameraX * 0.28) % dockClusterW + dockClusterW) % dockClusterW);
      for (let rep = -1; rep < 3; rep++) {
        const dx = dockOff + rep * dockClusterW;

        // Diques de ladrillo rojizo reciclados en el sector derecho del muelle
        const warehouseX = dx + 430;
        const warehouseW = 306;
        const warehouseY = quayY - 76;
        // Fachada principal de ladrillo rojizo cálido
        const brickG = ctx.createLinearGradient(warehouseX, warehouseY, warehouseX, quayY);
        brickG.addColorStop(0, '#7c2d12');
        brickG.addColorStop(0.5, '#9a3412');
        brickG.addColorStop(1, '#5c1d0c');
        ctx.fillStyle = brickG;
        ctx.fillRect(warehouseX, warehouseY, warehouseW, quayY - warehouseY);
        // Techo mansarda oscuro de zinc
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(warehouseX - 6, warehouseY);
        ctx.lineTo(warehouseX + 8, warehouseY - 14);
        ctx.lineTo(warehouseX + warehouseW - 8, warehouseY - 14);
        ctx.lineTo(warehouseX + warehouseW + 6, warehouseY);
        ctx.closePath();
        ctx.fill();
        // Pilastras de ladrillo y arcos iluminados cálidos en planta baja (restaurantes del dique)
        for (let ax = warehouseX + 14; ax < warehouseX + warehouseW - 18; ax += 32) {
          // Ventana superior del depósito reciclado
          ctx.fillStyle = (ax % 64 === 0) ? 'rgba(253, 224, 71, 0.58)' : 'rgba(254, 240, 138, 0.34)';
          ctx.fillRect(ax + 2, warehouseY + 12, 16, 14);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(ax + 2, warehouseY + 12, 16, 14);
          // Arco luminoso inferior de paseo gastronómico
          ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
          ctx.beginPath();
          ctx.arc(ax + 10, quayY - 16, 9, Math.PI, 0);
          ctx.lineTo(ax + 19, quayY);
          ctx.lineTo(ax + 1, quayY);
          ctx.closePath();
          ctx.fill();
        }
        // Edificio vidriado bajo junto a los diques de ladrillo
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dx + 258, quayY - 56, 166, 56);
        for (let wy = quayY - 48; wy < quayY - 10; wy += 13) {
          ctx.fillStyle = wy % 26 === 0 ? 'rgba(253, 224, 71, 0.72)' : 'rgba(186, 230, 253, 0.52)';
          ctx.fillRect(dx + 266, wy, 150, 6);
        }

        // Grúas portuarias amarillas históricas sobre el muelle (dique derecho)
        const drawYellowCrane = (cxPos, scale = 1, dir = 1) => {
          ctx.save();
          ctx.translate(cxPos, quayY);
          ctx.scale(dir * scale, scale);
          // Pórtico metálico amarillo inferior
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(-9, -34);
          ctx.lineTo(9, -34);
          ctx.lineTo(16, 0);
          ctx.moveTo(-12, -16);
          ctx.lineTo(12, -16);
          ctx.stroke();
          // Cabina amarilla iluminada
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-13, -60, 26, 26);
          ctx.strokeRect(-13, -60, 26, 26);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(3, -55, 8, 9);
          // Torre celosía superior y pluma inclinada
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(-6, -60);
          ctx.lineTo(0, -104);
          ctx.lineTo(6, -60);
          ctx.stroke();
          // Brazo largo en celosía amarilla apuntando sobre el dique
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.moveTo(4, -58);
          ctx.lineTo(78, -142);
          ctx.lineTo(70, -138);
          ctx.lineTo(-2, -62);
          ctx.stroke();
          // Tirantes y cable de carga
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(0, -104);
          ctx.lineTo(76, -140);
          ctx.moveTo(76, -140);
          ctx.lineTo(76, -74);
          ctx.stroke();
          ctx.restore();
        };
        drawYellowCrane(dx + 478, 0.98, 1);
        drawYellowCrane(dx + 688, 0.86, -1);

        // Muro de muelle de granito + barandas y faroles cálidos del paseo
        ctx.fillStyle = '#334155';
        ctx.fillRect(dx, quayY, dockClusterW, waterY - quayY);
        ctx.fillStyle = '#475569';
        ctx.fillRect(dx, quayY, dockClusterW, 4);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(dx, quayY - 8);
        ctx.lineTo(dx + dockClusterW, quayY - 8);
        ctx.stroke();
        for (let lx = dx + 28; lx < dx + dockClusterW; lx += 95) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(lx - 1, quayY - 22, 2, 22);
          const lg = ctx.createRadialGradient(lx, quayY - 24, 1, lx, quayY - 24, 16);
          lg.addColorStop(0, '#fef9c3');
          lg.addColorStop(0.35, 'rgba(253, 224, 71, 0.45)');
          lg.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.arc(lx, quayY - 24, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Hito arquitectónico central: Puente de la Mujer de Santiago Calatrava (parallax 0.36)
      const bridgeCycle = 1120;
      const bridgeOff = -(((cameraX * 0.36) % bridgeCycle + bridgeCycle) % bridgeCycle);
      for (let b = -1; b < 3; b++) {
        const bx = bridgeOff + b * bridgeCycle;
        const pierX = bx + 425;
        const deckLeftX = bx + 165;
        const deckRightX = bx + 760;
        const deckY = waterY - 24; // ~388px sobre el dique
        const mastBaseX = pierX - 24;
        const mastBaseY = deckY + 2;
        const mastTipX = pierX + 206; // mástil diagonal inclinado (~39°)
        const mastTipY = 166;

        // Resplandor nocturno violeta / fucsia tras la pasarela y el pilote del puente
        const bridgeGlow = ctx.createRadialGradient(pierX, deckY, 12, pierX, deckY, 190);
        bridgeGlow.addColorStop(0, 'rgba(217, 70, 239, 0.34)');
        bridgeGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.16)');
        bridgeGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = bridgeGlow;
        ctx.beginPath();
        ctx.ellipse(pierX + 40, deckY, 260, 52, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pilote central ovoide blanco/violeta rotatorio en el agua
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(pierX - 18, deckY + 2);
        ctx.lineTo(pierX + 18, deckY + 2);
        ctx.lineTo(pierX + 12, waterY + 18);
        ctx.lineTo(pierX - 12, waterY + 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(217, 70, 239, 0.65)';
        ctx.fillRect(pierX - 12, waterY + 12, 24, 5);
        // Pilonos secundarios de apoyo del tablero
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(bx + 266, deckY + 3, 10, waterY - deckY + 8);
        ctx.fillRect(bx + 610, deckY + 3, 9, waterY - deckY + 7);

        // Abanico de 18 tensores blancos desde la aguja inclinada hacia el tablero derecho/central
        ctx.save();
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.78)';
        ctx.lineWidth = 1.25;
        for (let c = 0; c < 18; c++) {
          const frac = c / 17;
          const attachFrac = 0.22 + frac * 0.76;
          const mx = mastBaseX + (mastTipX - mastBaseX) * attachFrac;
          const my = mastBaseY + (mastTipY - mastBaseY) * attachFrac;
          const txDeck = pierX + 26 + frac * 258;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(txDeck, deckY - 3);
          ctx.stroke();
        }
        ctx.restore();

        // Pasarela blanca curva con baranda superior y tira LED violeta/blanca inferior
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(deckLeftX, deckY + 4);
        ctx.quadraticCurveTo(pierX, deckY - 8, deckRightX, deckY + 2);
        ctx.lineTo(deckRightX, deckY + 11);
        ctx.quadraticCurveTo(pierX, deckY + 3, deckLeftX, deckY + 12);
        ctx.closePath();
        ctx.fill();

        // Filo inferior luminoso violeta-fucsia del Puente de la Mujer
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(deckLeftX + 12, deckY + 11);
        ctx.quadraticCurveTo(pierX, deckY + 3, deckRightX - 12, deckY + 10);
        ctx.stroke();

        // Mástil blanco inclinado afilado (aguja característica de Calatrava)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(mastBaseX - 38, deckY + 2);
        ctx.quadraticCurveTo(mastBaseX + 2, deckY - 12, mastTipX, mastTipY);
        ctx.lineTo(mastTipX + 4, mastTipY + 3);
        ctx.quadraticCurveTo(mastBaseX + 34, deckY - 6, mastBaseX + 36, deckY + 4);
        ctx.closePath();
        const mastG = ctx.createLinearGradient(mastBaseX, mastBaseY, mastTipX, mastTipY);
        mastG.addColorStop(0, '#ffffff');
        mastG.addColorStop(0.55, '#e2e8f0');
        mastG.addColorStop(1, '#f8fafc');
        ctx.fillStyle = mastG;
        ctx.fill();
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Agua oscura del dique de Puerto Madero y reflejos nocturnos (violeta, blanco y dorado)
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
      waterGrad.addColorStop(0, '#09142b');
      waterGrad.addColorStop(0.5, '#060d1f');
      waterGrad.addColorStop(1, '#030712');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterY, w, h - waterY);

      // Columnas de reflejos verticales ondulantes sincronizadas con edificios, grúas y puente
      for (let rep = -1; rep < 3; rep++) {
        const bx = bridgeOff + rep * bridgeCycle;
        const pierX = bx + 425;
        // Reflejos violeta / fucsia y blanco del Puente de la Mujer
        for (let strip = 0; strip < 7; strip++) {
          const rx = pierX - 140 + strip * 52;
          if (rx < -80 || rx > w + 80) continue;
          const colG = ctx.createLinearGradient(rx, waterY, rx, h);
          const isCenter = strip === 2 || strip === 3;
          colG.addColorStop(0, isCenter ? 'rgba(248, 250, 252, 0.44)' : 'rgba(217, 70, 239, 0.42)');
          colG.addColorStop(0.45, 'rgba(168, 85, 247, 0.28)');
          colG.addColorStop(1, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = colG;
          ctx.fillRect(rx - 14, waterY + 2, 28, h - waterY);
        }
      }

      // Reflejos dorados y cálidos de rascacielos, diques de ladrillo y grúas amarillas en el agua
      for (let rep = -1; rep < 3; rep++) {
        const dx = dockOff + rep * dockClusterW;
        for (let ax = dx + 60; ax < dx + dockClusterW - 20; ax += 74) {
          if (ax < -50 || ax > w + 50) continue;
          const goldG = ctx.createLinearGradient(ax, waterY, ax, h);
          goldG.addColorStop(0, ax > dx + 410 ? 'rgba(251, 191, 36, 0.36)' : 'rgba(253, 224, 71, 0.26)');
          goldG.addColorStop(0.65, 'rgba(217, 119, 6, 0.14)');
          goldG.addColorStop(1, 'rgba(217, 119, 6, 0)');
          ctx.fillStyle = goldG;
          ctx.fillRect(ax - 9, waterY + 2, 18, h - waterY);
        }
      }

      // Ondas y brillos horizontales animados en la superficie del dique
      ctx.save();
      for (let row = 0; row < 6; row++) {
        const wy = waterY + 8 + row * 18;
        const speed = row % 2 === 0 ? 1.8 : -1.4;
        for (let rx = -20; rx < w + 40; rx += 64) {
          const shift = Math.sin(t * speed + rx * 0.04 + row) * 8;
          ctx.fillStyle =
            row < 2
              ? 'rgba(240, 171, 252, 0.24)'
              : row % 2 === 0
              ? 'rgba(253, 224, 71, 0.18)'
              : 'rgba(186, 230, 253, 0.18)';
          ctx.fillRect(rx + shift, wy, 26 - row * 2, 2.2);
        }
      }
      ctx.restore();
    }

    static drawBaTrenMitre(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1e3a8a');
      sky.addColorStop(0.65, '#f97316');
      sky.addColorStop(1, '#fef08a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Edificios de Buenos Aires pasando a toda velocidad por efecto del tren
      const speedSlide = time * 260 + cameraX * 0.55;
      const off = -(speedSlide % 220);
      for (let i = -1; i < 6; i++) {
        const bx = off + i * 220;
        const bh = 160 + ((i * 53) % 90);
        ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#334155';
        ctx.fillRect(bx, h - bh - 55, 175, bh);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        for (let wy = h - bh - 35; wy < h - 85; wy += 24) {
          ctx.fillRect(bx + 18, wy, 138, 6);
        }
      }

      // Líneas de velocidad + catenaria superior eléctrica
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 96);
      ctx.lineTo(w, 96);
      ctx.stroke();
      for (let s = 0; s < 6; s++) {
        const sx = ((w - ((time * 780 + s * 190) % (w + 220))) + w) % w;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(sx, 130 + s * 46, 95, 2.5);
      }
    }

    // ------------------------------------------------------------------------
    // CÓRDOBA: 4 FONDOS PARALLAX HD POR ZONA EMBLEMÁTICA
    // ------------------------------------------------------------------------
    static drawCoArco(ctx, cameraX, w, h, time) {
      // Zona 1: Córdoba Capital (La Cañada y Arco de Córdoba · fiel a foto de referencia)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.55, '#38bdf8');
      sky.addColorStop(0.84, '#bae6fd');
      sky.addColorStop(1, '#fef3c7');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX * 0.4, time, 64, 'rgba(255,255,255,0.62)');

      // Silueta lejana del perfil urbano de Córdoba Capital
      const skyOff = -((cameraX * 0.08) % 520);
      ctx.save();
      ctx.fillStyle = 'rgba(71, 85, 105, 0.34)';
      for (let i = -1; i < 4; i++) {
        const bx = skyOff + i * 520;
        ctx.fillRect(bx + 30, 268, 44, 150);
        ctx.fillRect(bx + 92, 236, 54, 182);
        ctx.fillRect(bx + 170, 258, 38, 160);
        ctx.fillRect(bx + 290, 242, 62, 176);
        ctx.fillRect(bx + 390, 266, 48, 152);
      }
      ctx.restore();

      // Parque verde del bulevar donde se erige el Arco de Córdoba
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(0, 405, w, h - 405);
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(0, 405, w, 12);

      // MONUMENTO ARCO DE CÓRDOBA (dos torres coloniales de piedra crema/ocre con cúpulas, balcones y 3 banderas argentinas)
      const arcoSpan = 1040;
      const arcoOff = -((cameraX * 0.16) % arcoSpan);
      const drawTinyArgFlag = (fx, fy, phase) => {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy - 34);
        ctx.stroke();
        const wave = Math.sin(time * 5.2 + phase) * 2.5;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(fx, fy - 34, 24, 4 + wave * 0.12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx, fy - 30, 24, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(fx, fy - 26, 24, 4 - wave * 0.12);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(fx + 12, fy - 28, 1.5, 0, Math.PI * 2);
        ctx.fill();
      };

      for (let i = -1; i < 3; i++) {
        const ax = arcoOff + i * arcoSpan + 480;
        const baseY = 412;

        // Puente arqueado central entre ambas torres
        ctx.fillStyle = '#d6c7a9';
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ax - 74, 206);
        ctx.lineTo(ax + 74, 206);
        ctx.lineTo(ax + 74, 296);
        ctx.arc(ax, 296, 62, 0, Math.PI, true);
        ctx.lineTo(ax - 74, 296);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Escudo central colonial y placa sobre el arco + franja teja
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(ax - 74, 204, 148, 5);
        ctx.fillStyle = '#a8997a';
        ctx.beginPath();
        ctx.roundRect(ax - 12, 198, 24, 24, 4);
        ctx.fill();
        ctx.stroke();
        drawTinyArgFlag(ax, 198, i * 1.4);

        // Dos torres cilíndricas de piedra crema/dorada con balcones volados y cúpulas
        [-88, 88].forEach((offset, tIdx) => {
          const tx = ax + offset;
          const towerGrad = ctx.createLinearGradient(tx - 34, 0, tx + 34, 0);
          towerGrad.addColorStop(0, '#c7b898');
          towerGrad.addColorStop(0.45, '#e7dcc2');
          towerGrad.addColorStop(1, '#a8997a');
          ctx.fillStyle = towerGrad;
          ctx.fillRect(tx - 33, 186, 66, baseY - 186);
          ctx.strokeStyle = '#78716c';
          ctx.strokeRect(tx - 33, 186, 66, baseY - 186);

          // Líneas sutiles de mampostería de piedra
          ctx.strokeStyle = 'rgba(120, 113, 108, 0.25)';
          for (let my = 200; my < baseY; my += 14) {
            ctx.beginPath();
            ctx.moveTo(tx - 32, my);
            ctx.lineTo(tx + 32, my);
            ctx.stroke();
          }

          // Balcón circular sobresaliente con ménsulas
          ctx.fillStyle = '#d6c7a9';
          ctx.fillRect(tx - 42, 304, 84, 14);
          ctx.strokeStyle = '#57534e';
          ctx.strokeRect(tx - 42, 304, 84, 14);

          // Ventanas superiores arqueadas
          [-13, 13].forEach((wx) => {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(tx + wx, 272, 6.5, Math.PI, 0);
            ctx.lineTo(tx + wx + 6.5, 294);
            ctx.lineTo(tx + wx - 6.5, 294);
            ctx.closePath();
            ctx.fill();
          });

          // Portal inferior arqueado
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(tx, baseY - 34, 12, Math.PI, 0);
          ctx.lineTo(tx + 12, baseY);
          ctx.lineTo(tx - 12, baseY);
          ctx.closePath();
          ctx.fill();

          // Cúpula redondeada coronando cada torre + bandera argentina
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(tx - 35, 182, 70, 5);
          ctx.fillStyle = '#e7dcc2';
          ctx.beginPath();
          ctx.arc(tx, 182, 22, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = '#78716c';
          ctx.stroke();
          drawTinyArgFlag(tx, 160, i * 2 + tIdx * 0.9);
        });
      }

      // CANAL DE LA CAÑADA DE CÓRDOBA (muros de calicanto piedra blanca + agua celeste + arboleda de tipas)
      const canalY = 412;
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(0, canalY, w, 14);
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 1.5;
      const stoneOff = -((cameraX * 0.34) % 44);
      for (let sx = stoneOff - 44; sx < w + 44; sx += 44) {
        ctx.strokeRect(sx, canalY, 44, 14);
      }
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, canalY + 14, w, h - (canalY + 14));
      ctx.fillStyle = 'rgba(224, 242, 254, 0.38)';
      for (let wx = stoneOff; wx < w; wx += 78) {
        ctx.fillRect(wx + Math.sin(time * 2.5 + wx) * 4, canalY + 24, 34, 2.5);
      }

      // Tipas frondosas bordeando La Cañada
      const treeOff = -((cameraX * 0.28) % 210);
      for (let t = -1; t < 7; t++) {
        const tx = treeOff + t * 210 + 95;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - 4, 344, 8, 68);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(tx - 16, 338, 28, 0, Math.PI * 2);
        ctx.arc(tx + 18, 340, 26, 0, Math.PI * 2);
        ctx.arc(tx, 322, 32, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    static drawCoCucu(ctx, cameraX, w, h, time) {
      // Zona 2: Villa Carlos Paz (El Reloj Cucú y Lago San Roque · fiel a foto de referencia)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0369a1');
      sky.addColorStop(0.55, '#38bdf8');
      sky.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX * 0.35, time, 56, 'rgba(255,255,255,0.68)');

      // Cordón de Sierras Chicas tras el Lago San Roque
      const sOff = -((cameraX * 0.07) % 600);
      ctx.fillStyle = '#3b6b7a';
      ctx.beginPath();
      ctx.moveTo(0, 340);
      for (let i = -1; i < 4; i++) {
        const bx = sOff + i * 600;
        ctx.lineTo(bx + 90, 224);
        ctx.lineTo(bx + 220, 256);
        ctx.lineTo(bx + 365, 206);
        ctx.lineTo(bx + 510, 248);
        ctx.lineTo(bx + 600, 232);
      }
      ctx.lineTo(w, 340);
      ctx.closePath();
      ctx.fill();

      // LAGO SAN ROQUE zafiro con veleros suaves
      const lakeGrad = ctx.createLinearGradient(0, 320, 0, 445);
      lakeGrad.addColorStop(0, '#0284c7');
      lakeGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = lakeGrad;
      ctx.fillRect(0, 320, w, 130);

      for (let b = 0; b < 3; b++) {
        const bx = ((b * 340 + time * 12 - cameraX * 0.12) % (w + 160) + (w + 160)) % (w + 160) - 80;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(bx, 348);
        ctx.lineTo(bx + 12, 324);
        ctx.lineTo(bx + 18, 348);
        ctx.closePath();
        ctx.fill();
      }

      // Costanera verde y puente / paseo inferior
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 410, w, h - 410);
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(0, 404, w, 8);

      // ICÓNICO RELOJ CUCÚ DE VILLA CARLOS PAZ (chalet alpino madera oscura, pedestal de piedra, cabeza de ciervo, hojas verdes, cuadrante negro y pajarito cucú animado)
      const cucuSpan = 960;
      const cucuOff = -((cameraX * 0.16) % cucuSpan);
      const cucuCycle = time % 5.0;
      const birdOut = cucuCycle < 1.7;
      const popFrac = birdOut ? Math.sin((cucuCycle / 1.7) * Math.PI) : 0;

      const drawOakLeaf = (lx, ly, scale = 1, rot = 0) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#2e8b57';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(9, -8);
        ctx.lineTo(14, 2);
        ctx.lineTo(8, 12);
        ctx.lineTo(0, 16);
        ctx.lineTo(-8, 12);
        ctx.lineTo(-14, 2);
        ctx.lineTo(-9, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      for (let i = -1; i < 3; i++) {
        const cx = cucuOff + i * cucuSpan + 520;
        const groundY = 412;

        // Ligustros tupidos flanqueando la base de piedra como en la foto
        ctx.fillStyle = '#14532d';
        ctx.fillRect(cx - 125, 315, 76, 98);
        ctx.fillRect(cx + 49, 315, 76, 98);

        // Pedestal trapezoidal de mampostería de piedra gris claro
        ctx.fillStyle = '#d6d3d1';
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - 46, 304);
        ctx.lineTo(cx + 46, 304);
        ctx.lineTo(cx + 58, groundY);
        ctx.lineTo(cx - 58, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(87, 83, 78, 0.35)';
        ctx.beginPath();
        ctx.moveTo(cx - 48, 336);
        ctx.lineTo(cx + 48, 336);
        ctx.moveTo(cx - 52, 372);
        ctx.lineTo(cx + 52, 372);
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 10, 344, 20, 12);

        // Cuerpo alpino de madera marrón cálida
        ctx.fillStyle = '#7c3f1d';
        ctx.strokeStyle = '#3f1d0b';
        ctx.lineWidth = 2;
        ctx.fillRect(cx - 54, 152, 108, 152);
        ctx.strokeRect(cx - 54, 152, 108, 152);
        ctx.fillStyle = '#5c2c14';
        ctx.fillRect(cx - 64, 294, 128, 12);

        // Techo a dos aguas muy inclinado con intradós crema
        ctx.fillStyle = '#e7e5e4';
        ctx.beginPath();
        ctx.moveTo(cx - 88, 168);
        ctx.lineTo(cx, 114);
        ctx.lineTo(cx + 88, 168);
        ctx.lineTo(cx + 68, 190);
        ctx.lineTo(cx, 146);
        ctx.lineTo(cx - 68, 190);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(cx - 94, 168);
        ctx.lineTo(cx, 108);
        ctx.lineTo(cx + 94, 168);
        ctx.lineTo(cx + 86, 178);
        ctx.lineTo(cx, 122);
        ctx.lineTo(cx - 86, 178);
        ctx.closePath();
        ctx.fill();

        // Cabeza de ciervo tallada con astas en el vértice superior
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(cx, 106, 7.5, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d6d3d1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 3, 98);
        ctx.lineTo(cx - 14, 72);
        ctx.moveTo(cx - 9, 84);
        ctx.lineTo(cx - 17, 81);
        ctx.moveTo(cx + 3, 98);
        ctx.lineTo(cx + 14, 72);
        ctx.moveTo(cx + 9, 84);
        ctx.lineTo(cx + 17, 81);
        ctx.stroke();

        // Ventanitas blancas laterales con arco superior
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#3f1d0b';
        ctx.lineWidth = 1.4;
        [-30, 14].forEach((wx) => {
          ctx.beginPath();
          ctx.roundRect(cx + wx, 182, 16, 26, [8, 8, 1, 1]);
          ctx.fill();
          ctx.stroke();
        });

        // Puerta central del PAJARITO CUCÚ (se abre periódicamente)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(cx - 10, 162, 20, 26, [10, 10, 0, 0]);
        ctx.fill();
        ctx.strokeStyle = '#e7e5e4';
        ctx.stroke();
        if (birdOut) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(cx + 10, 164, 10, 22);
          const lift = popFrac * 5;
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(cx + 2, 178 - lift, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(cx + 6, 177 - lift);
          ctx.lineTo(cx + 13, 178 - lift);
          ctx.lineTo(cx + 6, 180 - lift);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('¡CU-CÚ!', cx, 152 - lift);
        }

        // Cuadrante negro del reloj con números romanos y agujas blancas
        ctx.beginPath();
        ctx.arc(cx, 248, 34, 0, Math.PI * 2);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#e5e7eb';
        ctx.font = 'bold 8px serif';
        ctx.textAlign = 'center';
        ctx.fillText('XII', cx, 224);
        ctx.fillText('VI', cx, 276);
        ctx.fillText('III', cx + 25, 251);
        ctx.fillText('IX', cx - 25, 251);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx, 248);
        ctx.lineTo(cx + Math.cos(time * 0.6 - 1.2) * 18, 248 + Math.sin(time * 0.6 - 1.2) * 18);
        ctx.moveTo(cx, 248);
        ctx.lineTo(cx + Math.cos(time * 0.08 + 0.5) * 12, 248 + Math.sin(time * 0.08 + 0.5) * 12);
        ctx.stroke();

        // 5 Hojas verdes talladas características
        drawOakLeaf(cx - 52, 148, 1.35, -0.35);
        drawOakLeaf(cx + 52, 148, 1.35, 0.35);
        drawOakLeaf(cx - 58, 240, 1.45, -0.2);
        drawOakLeaf(cx + 58, 240, 1.45, 0.2);
        drawOakLeaf(cx, 304, 1.45, 0);
      }
    }

    static drawCoBelgrano(ctx, cameraX, w, h, time) {
      // Zona 3: Villa General Belgrano (Paseo Alpino / Oktoberfest · fiel a foto de referencia)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1d4ed8');
      sky.addColorStop(0.55, '#60a5fa');
      sky.addColorStop(1, '#fde68a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX * 0.3, time, 52, 'rgba(255,255,255,0.65)');

      // Bosque denso de altos pinos de Calamuchita detrás del pueblo
      const pineOff = -((cameraX * 0.1) % 90);
      for (let i = -1; i < 14; i++) {
        const px = pineOff + i * 90 + 35;
        const ph = 115 + (i % 3) * 28;
        ctx.fillStyle = i % 2 === 0 ? '#14532d' : '#166534';
        ctx.beginPath();
        ctx.moveTo(px, 340 - ph);
        ctx.lineTo(px + 34, 340);
        ctx.lineTo(px - 34, 340);
        ctx.closePath();
        ctx.fill();
      }

      // CHALETS ALPINOS CENTROEUROPEOS (techos rojos empinados a dos aguas, entramado de madera, macetas y carteles)
      const chaletSpan = 640;
      const cOff = -((cameraX * 0.22) % chaletSpan);
      for (let i = -1; i < 4; i++) {
        const bx = cOff + i * chaletSpan;

        ctx.fillStyle = '#fafaf9';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2.5;
        ctx.fillRect(bx + 36, 250, 176, 155);
        ctx.strokeRect(bx + 36, 250, 176, 155);

        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.moveTo(bx + 18, 256);
        ctx.lineTo(bx + 124, 158);
        ctx.lineTo(bx + 230, 256);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        [bx + 68, bx + 148].forEach((wx) => {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(wx - 4, 278, 36, 30);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(wx + 2, 282, 24, 22);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(wx - 6, 308, 40, 8);
          ctx.fillStyle = '#dc2626';
          for (let fx = 0; fx <= 30; fx += 8) {
            ctx.beginPath();
            ctx.arc(wx + fx, 308, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.fillStyle = '#78350f';
        ctx.fillRect(bx + 188, 270, 56, 30);
        ctx.strokeStyle = '#451a03';
        ctx.strokeRect(bx + 188, 270, 56, 30);
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 9.5px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAFÉ', bx + 216, 283);
        ctx.fillText('ALPINO', bx + 216, 294);

        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(bx + 286, 240, 220, 165);
        ctx.strokeRect(bx + 286, 240, 220, 165);
        ctx.strokeStyle = '#5c2c14';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx + 286, 315);
        ctx.lineTo(bx + 506, 315);
        ctx.moveTo(bx + 396, 240);
        ctx.lineTo(bx + 396, 405);
        ctx.stroke();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(bx + 266, 246);
        ctx.lineTo(bx + 396, 148);
        ctx.lineTo(bx + 526, 246);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        [bx + 312, bx + 340, bx + 462].forEach((rx) => {
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.ellipse(rx, 392, 11, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 398, w, 24);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, 420, w, h - 420);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
      const stOff = -((cameraX * 0.35) % 85);
      for (let x = stOff; x < w; x += 85) {
        ctx.fillRect(x + Math.sin(time * 3 + x) * 5, 434, 40, 2.5);
      }
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 386, w, 5);
      for (let px = stOff - 40; px < w + 40; px += 48) {
        ctx.fillRect(px, 384, 6, 24);
      }
    }

    static drawCoUritorco(ctx, cameraX, w, h, time) {
      // Zona 4: Capilla del Monte (Cerro Uritorco · fiel a silueta rocosa de referencia + atardecer místico + OVNIs aleatorios)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1e1b4b');
      sky.addColorStop(0.38, '#6b21a8');
      sky.addColorStop(0.72, '#db2777');
      sky.addColorStop(1, '#f97316');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let s = 0; s < 28; s++) {
        const sx = ((s * 97 + cameraX * -0.02) % w + w) % w;
        const sy = 18 + ((s * 53) % 120);
        const tw = 0.8 + 0.7 * Math.sin(time * 3.5 + s);
        ctx.beginPath();
        ctx.arc(sx, sy, tw, 0, Math.PI * 2);
        ctx.fill();
      }

      // MONUMENTAL SILUETA ESCALONADA DEL CERRO URITORCO
      const mSpan = 1100;
      const mOff = -((cameraX * 0.09) % mSpan);
      for (let i = -1; i < 3; i++) {
        const mx = mOff + i * mSpan + 520;
        const rockGrad = ctx.createLinearGradient(mx - 420, 120, mx + 440, 440);
        rockGrad.addColorStop(0, '#a8a29e');
        rockGrad.addColorStop(0.42, '#b45309');
        rockGrad.addColorStop(1, '#57534e');
        ctx.fillStyle = rockGrad;
        ctx.beginPath();
        ctx.moveTo(mx - 560, 460);
        ctx.lineTo(mx - 420, 232);
        ctx.lineTo(mx - 290, 214);
        ctx.lineTo(mx - 120, 148);
        ctx.lineTo(mx - 15, 114);
        ctx.lineTo(mx + 135, 134);
        ctx.lineTo(mx + 265, 168);
        ctx.lineTo(mx + 410, 224);
        ctx.lineTo(mx + 560, 460);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
        ctx.beginPath();
        ctx.moveTo(mx - 10, 122);
        ctx.lineTo(mx + 145, 226);
        ctx.lineTo(mx + 390, 290);
        ctx.lineTo(mx + 490, 390);
        ctx.lineTo(mx + 120, 330);
        ctx.lineTo(mx + 35, 210);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(mx - 190, 240);
        ctx.lineTo(mx - 95, 295);
        ctx.lineTo(mx - 150, 355);
        ctx.closePath();
        ctx.fill();
      }

      const scrubOff = -((cameraX * 0.17) % 160);
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.moveTo(0, 460);
      for (let x = scrubOff - 160; x < w + 160; x += 80) {
        ctx.lineTo(x + 40, 365 + Math.sin(x * 0.03) * 16);
        ctx.lineTo(x + 80, 382);
      }
      ctx.lineTo(w, 460);
      ctx.closePath();
      ctx.fill();

      // EVENTOS ALEATORIOS DE OVNIS SURCANDO EL CIELO DEL URITORCO
      const slotDuration = 6.5;
      const slot = Math.floor(time / slotDuration);
      const localT = (time % slotDuration) / slotDuration;
      if (localT < 0.62) {
        const progress = localT / 0.62;
        const fromLeft = slot % 2 === 0;
        const startX = fromLeft ? -70 : w + 70;
        const endX = fromLeft ? w + 70 : -70;
        const ux = startX + (endX - startX) * progress;
        const arc = Math.sin(progress * Math.PI) * -42;
        const uy = 68 + ((slot * 37) % 75) + arc;
        const fadeAlpha = progress < 0.15 ? progress / 0.15 : (progress > 0.85 ? (1 - progress) / 0.15 : 1);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, fadeAlpha));
        for (let d = 1; d <= 4; d++) {
          const dir = fromLeft ? -1 : 1;
          ctx.fillStyle = d % 2 === 0 ? 'rgba(52, 211, 153, 0.55)' : 'rgba(34, 211, 238, 0.5)';
          ctx.beginPath();
          ctx.arc(ux + dir * d * 14, uy + Math.sin(time * 18 + d) * 3, Math.max(1, 3.2 - d * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(ux, uy - 3, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(ux, uy, 16, 4.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = Math.sin(time * 18) > 0 ? '#4ade80' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(ux, uy, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ------------------------------------------------------------------------
    // USHUAIA (TIERRA DEL FUEGO): 4 FONDOS PARALLAX HD DEL FIN DEL MUNDO
    // ------------------------------------------------------------------------
    static drawSnowParticles(ctx, cameraX, w, h, time, count = 42, wind = -38) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < count; i++) {
        const speedY = 44 + (i % 5) * 14;
        const sx = (((i * 73 + time * wind - cameraX * 0.25) % w) + w) % w;
        const sy = ((i * 59 + time * speedY) % (h - 20));
        const r = 1.4 + (i % 3) * 0.85;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    static drawUshuaiaMountains(ctx, cameraX, w, horizonY, time, nightTint = false) {
      const mOff = -((cameraX * 0.08) % 640);
      for (let i = -1; i < 3; i++) {
        const bx = mOff + i * 640;
        const peaks = [
          [0, 140], [120, 48], [240, 105], [375, 26], [495, 118], [585, 60], [640, 140]
        ];
        ctx.fillStyle = nightTint ? '#1e293b' : '#475569';
        ctx.beginPath();
        ctx.moveTo(bx, horizonY);
        peaks.forEach(([px, pyOff]) => ctx.lineTo(bx + px, horizonY - pyOff));
        ctx.lineTo(bx + 640, horizonY);
        ctx.closePath();
        ctx.fill();

        // Casquetes nevados triangulares en las cumbres
        ctx.fillStyle = nightTint ? 'rgba(226, 232, 240, 0.82)' : '#f8fafc';
        [120, 375, 585].forEach((cxOff, idx) => {
          const topY = horizonY - (idx === 1 ? 148 : idx === 0 ? 118 : 104);
          const peakTip = horizonY - (idx === 0 ? 48 : idx === 1 ? 26 : 60);
          ctx.beginPath();
          ctx.moveTo(bx + cxOff, peakTip);
          ctx.lineTo(bx + cxOff - 52, Math.max(peakTip + 48, topY));
          ctx.lineTo(bx + cxOff - 16, Math.max(peakTip + 38, topY - 8));
          ctx.lineTo(bx + cxOff + 14, Math.max(peakTip + 44, topY - 4));
          ctx.lineTo(bx + cxOff + 54, Math.max(peakTip + 50, topY + 2));
          ctx.closePath();
          ctx.fill();
        });
      }
    }

    static drawUshuaiaCentro(ctx, cameraX, w, h, time) {
      // Zona 1: "Ushuaia Centro" — Cordillera Martial nevada, ladera urbana iluminada, edificios emblemáticos y bahía del Canal Beagle
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(0.28, '#1e3a8a');
      sky.addColorStop(0.56, '#0284c7');
      sky.addColorStop(0.76, '#7dd3fc');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX * 0.22, time, 54, 'rgba(224,242,254,0.65)');

      // 1) Cordillera Martial nevada + franja boscosa nevada al pie (parallax 0.07)
      const mSpan = 960;
      const mOff = -((cameraX * 0.07) % mSpan);
      for (let i = -1; i < 2; i++) {
        const bx = mOff + i * mSpan;
        ctx.beginPath();
        ctx.moveTo(bx, 255);
        ctx.lineTo(bx + 70, 128);
        ctx.lineTo(bx + 175, 114);
        ctx.lineTo(bx + 295, 86);
        ctx.lineTo(bx + 430, 108);
        ctx.lineTo(bx + 560, 72);
        ctx.lineTo(bx + 690, 96);
        ctx.lineTo(bx + 835, 118);
        ctx.lineTo(bx + mSpan, 146);
        ctx.lineTo(bx + mSpan, 255);
        ctx.closePath();
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // Ladera nevada superior de los cerros Martial
        ctx.beginPath();
        ctx.moveTo(bx + 12, 208);
        ctx.lineTo(bx + 70, 128);
        ctx.lineTo(bx + 175, 114);
        ctx.lineTo(bx + 295, 86);
        ctx.lineTo(bx + 430, 108);
        ctx.lineTo(bx + 560, 72);
        ctx.lineTo(bx + 690, 96);
        ctx.lineTo(bx + 835, 118);
        ctx.lineTo(bx + mSpan, 146);
        ctx.lineTo(bx + mSpan, 198);
        ctx.quadraticCurveTo(bx + 740, 168, bx + 590, 192);
        ctx.quadraticCurveTo(bx + 430, 152, bx + 290, 194);
        ctx.quadraticCurveTo(bx + 145, 166, bx + 12, 208);
        ctx.closePath();
        const snowGrad = ctx.createLinearGradient(0, 72, 0, 210);
        snowGrad.addColorStop(0, '#f8fafc');
        snowGrad.addColorStop(0.58, '#bae6fd');
        snowGrad.addColorStop(1, '#334155');
        ctx.fillStyle = snowGrad;
        ctx.fill();

        // Lenguas diagonales de nieve en quebradas rocosas
        ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
        [150, 285, 420, 560, 705, 850].forEach((sxOff, idx) => {
          ctx.beginPath();
          ctx.moveTo(bx + sxOff, 115 + (idx % 2) * 14);
          ctx.lineTo(bx + sxOff - 24, 186);
          ctx.lineTo(bx + sxOff - 6, 188);
          ctx.closePath();
          ctx.fill();
        });
      }

      // Franja de bosque subantártico nevado + laderas altas urbanas (parallax 0.14)
      ctx.fillStyle = '#14332a';
      ctx.fillRect(0, 198, w, 66);
      const slopeOff = -((cameraX * 0.14) % 720);
      for (let sx = slopeOff - 80; sx < w + 120; sx += 36) {
        const treeH = 18 + ((Math.abs(Math.round(sx)) * 13) % 14);
        ctx.fillStyle = '#0f2922';
        ctx.beginPath();
        ctx.moveTo(sx, 242);
        ctx.lineTo(sx + 13, 242 - treeH);
        ctx.lineTo(sx + 26, 242);
        ctx.closePath();
        ctx.fill();
        // Copo de nieve en el pino fueguino
        ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
        ctx.beginPath();
        ctx.moveTo(sx + 5, 242 - treeH * 0.45);
        ctx.lineTo(sx + 13, 242 - treeH);
        ctx.lineTo(sx + 21, 242 - treeH * 0.45);
        ctx.closePath();
        ctx.fill();
      }

      // Casitas escalonadas en la ladera de Ushuaia con luminarias doradas
      const hillColors = ['#b91c1c', '#d97706', '#475569', '#e2e8f0', '#0369a1'];
      const hillOff = -((cameraX * 0.16) % 660);
      for (let hx = hillOff - 100; hx < w + 140; hx += 66) {
        const idx = Math.abs(Math.round(hx / 66)) % hillColors.length;
        const baseY = 258 - ((idx * 17) % 26);
        const bw = 44 + (idx % 2) * 10;
        const bh = 28 + (idx % 3) * 8;
        ctx.fillStyle = hillColors[idx];
        ctx.fillRect(hx, baseY - bh, bw, bh);
        ctx.fillStyle = idx % 2 === 0 ? '#7f1d1d' : '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(hx - 3, baseY - bh);
        ctx.lineTo(hx + bw * 0.5, baseY - bh - 12);
        ctx.lineTo(hx + bw + 3, baseY - bh);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(hx + 7, baseY - bh + 7, 7, 8);
        ctx.fillRect(hx + 20, baseY - bh + 7, 7, 8);
        ctx.fillStyle = 'rgba(251, 146, 60, 0.25)';
        ctx.beginPath();
        ctx.arc(hx + 12, baseY - 2, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2) Edificios emblemáticos de Ushuaia Centro sobre la avenida costera (parallax 0.23)
      const townSpan = 1120;
      const townOff = -((cameraX * 0.23) % townSpan);
      for (let tIdx = -1; tIdx < 2; tIdx++) {
        const tx = townOff + tIdx * townSpan;

        // Cabaña / kiosco rojo fueguino con techo nevado
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.fillRect(tx + 92, 296, 52, 42);
        ctx.strokeRect(tx + 92, 296, 52, 42);
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(tx + 86, 296);
        ctx.lineTo(tx + 118, 274);
        ctx.lineTo(tx + 150, 296);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(tx + 104, 308, 12, 14);
        ctx.fillRect(tx + 124, 308, 12, 14);

        // Domo geodésico blanco nevado (Plaza Cívica / centro)
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(tx + 210, 338, 28, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
        ctx.beginPath();
        ctx.moveTo(tx + 190, 326);
        ctx.lineTo(tx + 230, 326);
        ctx.moveTo(tx + 198, 314);
        ctx.lineTo(tx + 222, 338);
        ctx.moveTo(tx + 222, 314);
        ctx.lineTo(tx + 198, 338);
        ctx.stroke();

        // Edificio histórico de ladrillo rojizo con buhardillas (Museo / Correo)
        ctx.fillStyle = '#9a3412';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.fillRect(tx + 286, 266, 132, 72);
        ctx.strokeRect(tx + 286, 266, 132, 72);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(tx + 280, 266);
        ctx.lineTo(tx + 352, 240);
        ctx.lineTo(tx + 424, 266);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        for (let wx = 0; wx < 5; wx++) {
          ctx.fillRect(tx + 298 + wx * 23, 278, 13, 18);
          ctx.fillRect(tx + 298 + wx * 23, 306, 13, 18);
        }

        // Campanario de madera iluminado al fondo del casco céntrico
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx + 448, 224, 22, 114);
        ctx.beginPath();
        ctx.moveTo(tx + 444, 224);
        ctx.lineTo(tx + 459, 194);
        ctx.lineTo(tx + 474, 224);
        ctx.closePath();
        ctx.fillStyle = '#451a03';
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(tx + 455, 232, 8, 12);

        // Icónico edificio de techo piramidal alto gris-oscuro de Ushuaia Centro
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(tx + 506, 292, 124, 46);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(tx + 530, 314, 76, 24);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tx + 494, 292);
        ctx.lineTo(tx + 568, 200);
        ctx.lineTo(tx + 642, 292);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Ventanal triangular en la pirámide
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(tx + 561, 244, 14, 16);
        for (let px = 0; px < 4; px++) {
          ctx.fillRect(tx + 518 + px * 26, 298, 14, 11);
        }

        // Esquina comercial blanca con cartel verde/amarillo "FARMACIA"
        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.4;
        ctx.fillRect(tx + 662, 256, 118, 82);
        ctx.strokeRect(tx + 662, 256, 118, 82);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(tx + 656, 256);
        ctx.lineTo(tx + 721, 232);
        ctx.lineTo(tx + 786, 256);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        for (let fx = 0; fx < 3; fx++) {
          ctx.fillRect(tx + 676 + fx * 32, 268, 18, 20);
        }
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx + 668, 298, 106, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(tx + 672, 304, 10, 26);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(tx + 706, 294, 58, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FARMACIA', tx + 735, 304);
        ctx.textAlign = 'left';

        // Icónico galpón amarillo del puerto de Ushuaia
        ctx.fillStyle = '#eab308';
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 1.5;
        ctx.fillRect(tx + 826, 294, 146, 44);
        ctx.strokeRect(tx + 826, 294, 146, 44);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(tx + 818, 294);
        ctx.lineTo(tx + 899, 270);
        ctx.lineTo(tx + 980, 294);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        for (let gx = 0; gx < 5; gx++) {
          ctx.fillRect(tx + 840 + gx * 26, 308, 14, 12);
        }

        // Edificio costero azul-grisáceo moderno junto al puerto
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx + 994, 276, 108, 62);
        ctx.fillStyle = '#fde047';
        for (let mx = 0; mx < 4; mx++) {
          ctx.fillRect(tx + 1006 + mx * 24, 290, 12, 16);
          ctx.fillRect(tx + 1006 + mx * 24, 314, 12, 16);
        }
      }

      // Avenida Maipú / costanera nevada con faroles cálidos
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 336, w, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 333, w, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 350, w, 7);

      const lampOff = -((cameraX * 0.25) % 130);
      for (let lx = lampOff - 40; lx < w + 60; lx += 130) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(lx, 312, 3, 28);
        const halo = ctx.createRadialGradient(lx + 1.5, 312, 2, lx + 1.5, 312, 24);
        halo.addColorStop(0, 'rgba(254, 240, 138, 0.92)');
        halo.addColorStop(0.4, 'rgba(250, 204, 21, 0.35)');
        halo.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(lx + 1.5, 312, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3) Canal Beagle con reflejos dorados nocturnos y embarcaciones amarradas
      const waterGrad = ctx.createLinearGradient(0, 357, 0, h);
      waterGrad.addColorStop(0, '#0b2545');
      waterGrad.addColorStop(0.5, '#0f172a');
      waterGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 357, w, h - 357);

      // Muelle de madera oscuro en el sector izquierdo
      const pierX = 36 - ((cameraX * 0.22) % 980);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(pierX, 353, 185, 9);
      for (let px = 8; px < 180; px += 22) {
        ctx.fillRect(pierX + px, 358, 5, 22);
      }

      // Reflejos dorados y cálidos verticales ondulando en el Canal Beagle
      const refOff = -((cameraX * 0.20) % 96);
      for (let rx = refOff - 40; rx < w + 60; rx += 48) {
        const wave = Math.sin(time * 2.6 + rx * 0.08) * 3;
        const barW = 10 + (Math.abs(Math.round(rx)) % 3) * 5;
        const rGrad = ctx.createLinearGradient(0, 358, 0, 446);
        rGrad.addColorStop(0, 'rgba(254, 240, 138, 0.56)');
        rGrad.addColorStop(0.45, 'rgba(250, 204, 21, 0.34)');
        rGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = rGrad;
        ctx.fillRect(rx + wave, 358, barW, 88);
      }

      // Embarcaciones turísticas / veleros en el puerto del Beagle
      const boats = [
        { x: 265, scale: 1.0 },
        { x: 760, scale: 0.92 }
      ];
      boats.forEach((bt) => {
        const bx = bt.x - ((cameraX * 0.18) % 960);
        if (bx < -120 || bx > w + 120) return;
        ctx.save();
        ctx.translate(bx, 355);
        ctx.scale(bt.scale, bt.scale);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(36, -2);
        ctx.lineTo(36, -54);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(84, 0);
        ctx.lineTo(74, 11);
        ctx.lineTo(10, 11);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(16, -9, 44, 9);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(22, -7, 30, 5);
        ctx.restore();
      });

      // 4) Cartel icónico de madera tallada "USHUAIA / fin del mundo" frente a la costanera
      const signX = 248 - cameraX * 0.30;
      if (signX > -220 && signX < w + 220) {
        const sy = 258;
        ctx.save();
        ctx.fillStyle = '#451a03';
        ctx.fillRect(signX + 18, sy + 146, 10, 56);
        ctx.fillRect(signX + 142, sy + 146, 10, 56);
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(signX, sy + 28, 170, 122, 8);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(signX + 85, sy + 30, 56, Math.PI, 0);
        ctx.fillStyle = '#92400e';
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.stroke();
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(signX + 46, sy + 42, 78, 44);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.4;
        ctx.strokeRect(signX + 46, sy + 42, 78, 44);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(signX + 47, sy + 72, 76, 13);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px "Georgia", serif';
        ctx.fillText('USHUAIA', signX + 85, sy + 109);
        ctx.font = 'italic bold 11px "Georgia", serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('fin del mundo', signX + 85, sy + 124);
        ctx.font = '8px "Segoe UI", sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Los Pobladores les damos la bienvenida', signX + 85, sy + 141);
        ctx.restore();
      }

      this.drawSnowParticles(ctx, cameraX, w, h, time, 46, -42);
    }

    static drawUshuaiaTren(ctx, cameraX, w, h, time) {
      // Zona 2: Tren del Fin del Mundo (fondo subantártico contrastado + rieles y durmientes a alta velocidad)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0b132b');
      sky.addColorStop(0.55, '#1e3a5f');
      sky.addColorStop(1, '#334155');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawUshuaiaMountains(ctx, cameraX, w, 330, time, true);

      // Laderas oscuras de bosque subpolar de lengas (contraste nítido con los vagones rojos y bordes nevados)
      ctx.fillStyle = '#052e16';
      ctx.fillRect(0, 322, w, 138);
      const treeOff = -((cameraX * 0.28) % 64);
      ctx.fillStyle = '#022c22';
      for (let tx = treeOff; tx < w + 64; tx += 44) {
        const th = 34 + ((Math.round(tx + cameraX * 0.28) % 3) * 8);
        ctx.beginPath();
        ctx.moveTo(tx, 342);
        ctx.lineTo(tx + 18, 342 - th);
        ctx.lineTo(tx + 36, 342);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 392, w, 72);

      // Terraplén y rieles escénicos medios en el valle fueguino
      const trainX = ((cameraX * 0.34) % 920) > 460
        ? 420 - cameraX * 0.14
        : 260 - cameraX * 0.14;
      const ty = 330;
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, ty + 38, w, 4);

      // Penacho de humo desde la locomotora lejana
      for (let p = 0; p < 6; p++) {
        const px = trainX + 46 + p * 22 + Math.sin(time * 4 + p) * 6;
        const py = ty - 26 - p * 13;
        const pr = 11 + p * 4.5;
        ctx.fillStyle = `rgba(226, 232, 240, ${0.42 - p * 0.05})`;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Silueta del tren en el valle lejano
      for (let v = 0; v < 3; v++) {
        const vx = trainX + 128 + v * 92;
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(vx, ty + 2, 82, 30);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(vx - 2, ty - 2, 86, 5);
        for (let wIdx = 0; wIdx < 4; wIdx++) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.72)';
          ctx.fillRect(vx + 8 + wIdx * 18, ty + 8, 10, 8);
        }
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(trainX + 16, ty + 20, 104, 14);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(trainX + 16, ty + 4, 72, 20);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(trainX + 40, ty - 12, 10, 18);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(trainX + 82, ty - 12, 36, 34);
      ctx.restore();

      // Balasto oscuro + durmientes de madera + rieles de acero corriendo a gran velocidad bajo la formación
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 488, w, h - 488);
      const speedTieOff = -((cameraX + time * 520) % 38);
      for (let tx = speedTieOff; tx < w + 42; tx += 38) {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(tx, 502, 22, 11);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx + 2, 503, 18, 3);
      }
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 498, w, 4);
      ctx.fillRect(0, 510, w, 4);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 498, w, 1.5);
      ctx.fillRect(0, 510, w, 1.5);

      // Tocones oscuros de lengas pasando rápidamente junto a las vías
      const stumpOff = -((cameraX * 0.45 + time * 140) % 310);
      for (let sx = stumpOff; sx < w + 120; sx += 310) {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx, 464);
        ctx.lineTo(sx + 8, 434);
        ctx.lineTo(sx + 28, 434);
        ctx.lineTo(sx + 38, 464);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      this.drawSnowParticles(ctx, cameraX, w, h, time, 46, -68);
    }

    static drawUshuaiaGlaciar(ctx, cameraX, w, h, time) {
      // Zona 3: Glaciar Martial y Aerosilla (picos nevados y torres/cables con sillas colgantes)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#94a3b8');
      sky.addColorStop(0.5, '#cbd5e1');
      sky.addColorStop(1, '#f8fafc');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawUshuaiaMountains(ctx, cameraX, w, 360, time, false);

      // Laderas blancas de nieve profunda y grietas glaciar celestes
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 328, w, 132);
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(0, 390);
      ctx.lineTo(280, 358);
      ctx.lineTo(540, 405);
      ctx.lineTo(w, 344);
      ctx.lineTo(w, 460);
      ctx.lineTo(0, 460);
      ctx.closePath();
      ctx.fill();

      // Cables diagonales de la Aerosilla + torres metálicas y sillitas colgantes animadas
      ctx.save();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 290);
      ctx.lineTo(w, 108);
      ctx.moveTo(0, 314);
      ctx.lineTo(w, 132);
      ctx.stroke();

      const towerOff = -((cameraX * 0.25) % 440);
      for (let tx = towerOff + 140; tx < w + 120; tx += 440) {
        const cableY = 290 - (tx / w) * 182;
        ctx.fillStyle = '#475569';
        ctx.fillRect(tx - 4, cableY - 8, 8, 460 - cableY);
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 24, cableY - 6, 48, 6);
      }

      // Sillitas celestes móviles deslizándose por el cable
      for (let c = 0; c < 4; c++) {
        const u = ((time * 0.08 + c * 0.25) % 1);
        const cx = u * w;
        const cy = 290 - u * 182;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + 20);
        ctx.stroke();
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(cx - 12, cy + 20, 24, 10);
      }
      ctx.restore();

      this.drawSnowParticles(ctx, cameraX, w, h, time, 58, -62);
    }

    static drawUshuaiaFaro(ctx, cameraX, w, h, time) {
      // Zona 4: Faro Les Éclaireurs (Crepúsculo austral + aurora + Canal Beagle + islote y faro rojo-blanco-rojo)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#020617');
      sky.addColorStop(0.35, '#0f172a');
      sky.addColorStop(0.7, '#1e3a8a');
      sky.addColorStop(1, '#38bdf8');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Aurora Austral luminosa verde-cian ondulando en el cielo nocturno
      ctx.save();
      for (let a = 0; a < 2; a++) {
        const ag = ctx.createLinearGradient(0, 40 + a * 34, 0, 165 + a * 20);
        ag.addColorStop(0, 'rgba(16, 185, 129, 0)');
        ag.addColorStop(0.5, a === 0 ? 'rgba(52, 211, 153, 0.34)' : 'rgba(56, 189, 248, 0.28)');
        ag.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.moveTo(0, 130 + a * 20);
        for (let x = 0; x <= w; x += 60) {
          ctx.lineTo(x, 82 + a * 24 + Math.sin(x * 0.012 + time * 1.1 + a) * 26);
        }
        ctx.lineTo(w, 180 + a * 20);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Estrellas australes parpadeantes (Cruz del Sur)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      for (let s = 0; s < 34; s++) {
        const sx = ((s * 97 + cameraX * -0.02) % w + w) % w;
        const sy = 14 + ((s * 53) % 150);
        ctx.beginPath();
        ctx.arc(sx, sy, 0.9 + 0.6 * Math.sin(time * 3 + s), 0, Math.PI * 2);
        ctx.fill();
      }

      // Cordillera Fueguina lejana cubierta de nieve en la costa chilena/fueguina
      this.drawUshuaiaMountains(ctx, cameraX, w, 355, time, true);

      // Mar picado del Canal Beagle al fondo
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(0, 350, w, 110);

      // Protagonista Monumental cerca del fin del nivel (x mundial ~ 3680): ISLOTE Y FARO LES ÉCLAIREURS
      const faroX = 3680 - cameraX;
      if (faroX > -280 && faroX < w + 280) {
        ctx.save();
        // Islote rocoso oscuro con musgo oliva/dorado
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(faroX - 150, 460);
        ctx.lineTo(faroX - 105, 368);
        ctx.lineTo(faroX - 38, 336);
        ctx.lineTo(faroX + 42, 334);
        ctx.lineTo(faroX + 112, 376);
        ctx.lineTo(faroX + 160, 460);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Musgo fueguino en la cima del islote
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.ellipse(faroX, 344, 46, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Haz luminoso rotatorio del faro sobre la tormenta austral
        const beamSweep = Math.sin(time * 2.1) * 0.38;
        ctx.save();
        ctx.translate(faroX, 160);
        ctx.rotate(beamSweep);
        const beamG = ctx.createLinearGradient(0, 0, -460, 0);
        beamG.addColorStop(0, 'rgba(254, 240, 138, 0.72)');
        beamG.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = beamG;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-460, -88);
        ctx.lineTo(-460, 88);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Torre troncocónica oficial del Faro Les Éclaireurs: franjas ROJO - BLANCO - ROJO
        const baseY = 338;
        // 1) Base ROJA
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(faroX - 24, baseY);
        ctx.lineTo(faroX - 20, baseY - 56);
        ctx.lineTo(faroX + 20, baseY - 56);
        ctx.lineTo(faroX + 24, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 2) Banda central BLANCA
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(faroX - 20, baseY - 56);
        ctx.lineTo(faroX - 16, baseY - 114);
        ctx.lineTo(faroX + 16, baseY - 114);
        ctx.lineTo(faroX + 20, baseY - 56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 3) Franja superior ROJA
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(faroX - 16, baseY - 114);
        ctx.lineTo(faroX - 13, baseY - 166);
        ctx.lineTo(faroX + 13, baseY - 166);
        ctx.lineTo(faroX + 16, baseY - 114);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 4) Balcón galería negro y linterna encendida
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(faroX - 18, baseY - 172, 36, 7);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(faroX - 10, baseY - 190, 20, 18);
        ctx.strokeRect(faroX - 10, baseY - 190, 20, 18);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(faroX, baseY - 190, 11, Math.PI, 0);
        ctx.fill();
        ctx.restore();
      }

      this.drawSnowParticles(ctx, cameraX, w, h, time, 54, -74);
    }

    // ------------------------------------------------------------------------
    // ROSARIO: 4 FONDOS PARALLAX HD POR ZONA EMBLEMÁTICA
    // ------------------------------------------------------------------------
    static drawRoMonumento(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.54, '#7dd3fc');
      sky.addColorStop(0.84, '#e0f2fe');
      sky.addColorStop(1, '#f8fafc');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX * 0.36, time, 78, 'rgba(255,255,255,0.72)');

      // Reflejo lejano del Río Paraná y arboleda ribereña en el horizonte
      ctx.fillStyle = 'rgba(14, 116, 144, 0.28)';
      ctx.fillRect(0, h - 84, w, 84);

      // Complejo ÚNICO protagonista: Monumento Histórico Nacional a la Bandera (sin obelisco ni repetición)
      // 3 cuerpos conectados en piedra caliza / mármol travertino:
      // 1) Propileo Triunfal (galería columnada izquierda), 2) Patio Cívico central elevado, 3) Torre Principal + Proa
      const mx = w * 0.59 - cameraX * 0.08;
      const baseFloorY = h - 78;

      ctx.save();

      // --- ARBOLADO Y EDIFICIO LADRILLO RIBEREÑO DISCRETO A LA DERECHA (marco real) ---
      ctx.fillStyle = '#3f5e42';
      ctx.beginPath();
      ctx.arc(mx + 215, baseFloorY - 8, 34, Math.PI, Math.PI * 2);
      ctx.arc(mx + 250, baseFloorY - 4, 28, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9a5844';
      ctx.fillRect(mx + 186, baseFloorY - 74, 30, 56);
      ctx.fillStyle = '#e5ddd0';
      ctx.fillRect(mx + 194, baseFloorY - 82, 12, 8);

      // --- 1. PROPILEO TRIUNFAL DE LA PATRIA (Galería horizontal izquierda con columnata) ---
      const propX = mx - 355;
      const propW = 198;
      const propTopY = baseFloorY - 122;
      const propH = 122;

      // Muro basal de piedra travertino + friso superior escalonado
      ctx.fillStyle = '#d6cebe';
      ctx.fillRect(propX, propTopY, propW, propH);
      // Cornisa y coronamiento central del Propileo
      ctx.fillStyle = '#e5ddd0';
      ctx.fillRect(propX - 3, propTopY - 4, propW + 6, 16);
      ctx.fillStyle = '#c2b9a7';
      ctx.fillRect(propX + 94, propTopY - 14, 34, 10);

      // Vanos profundos sombreados + hileras de pilares verticales del Propileo
      const colonnadeY = propTopY + 14;
      const colonnadeH = 58;
      ctx.fillStyle = '#292724';
      ctx.fillRect(propX + 12, colonnadeY, propW - 22, colonnadeH);
      ctx.fillStyle = '#e8e1d5';
      for (let col = 0; col < 10; col++) {
        const cx = propX + 16 + col * 17;
        ctx.fillRect(cx, colonnadeY, 7, colonnadeH);
        ctx.fillStyle = '#b4ab98';
        ctx.fillRect(cx + 5, colonnadeY, 2, colonnadeH);
        ctx.fillStyle = '#e8e1d5';
      }
      // Antecuerpo / basamento del Propileo bajo la columnata
      ctx.fillStyle = '#cdc4b2';
      ctx.fillRect(propX, colonnadeY + colonnadeH, propW, baseFloorY - (colonnadeY + colonnadeH));

      // --- 2. PATIO CÍVICO CENTRAL ELEVADO Y ESCALINATA CONECTORAS ---
      const patioX = propX + propW - 4;
      const patioW = 92;
      ctx.fillStyle = '#d9d1c2';
      ctx.fillRect(patioX, baseFloorY - 82, patioW, 82);
      ctx.fillStyle = '#b4ab98';
      ctx.fillRect(patioX, baseFloorY - 82, patioW, 8);
      // Gradas horizontales del Patio Cívico hacia la Proa
      for (let st = 0; st < 4; st++) {
        ctx.fillStyle = st % 2 === 0 ? '#e3dbcd' : '#bfb6a4';
        ctx.fillRect(patioX - 4, baseFloorY - 58 + st * 14, patioW + 14, 6);
      }

      // --- 3. TORRE PRINCIPAL (70m estriada y coronada plana con óculo, NO obelisco) ---
      const towerX = mx - 46;
      const towerW = 92;
      const towerTopY = 48;
      const pedestalTopY = baseFloorY - 178;

      // Cara lateral en sombra (perspectiva tridimensional monumental)
      ctx.fillStyle = '#978e7d';
      ctx.fillRect(towerX, towerTopY + 14, 24, pedestalTopY - towerTopY - 14);
      // Costilla lateral izquierda escalonada
      ctx.fillStyle = '#7e7667';
      ctx.fillRect(towerX + 6, towerTopY + 8, 12, pedestalTopY - towerTopY - 8);

      // Cara frontal iluminada en travertino cálido
      ctx.fillStyle = '#dbd3c4';
      ctx.fillRect(towerX + 24, towerTopY + 12, towerW - 24, pedestalTopY - towerTopY - 12);
      // Contrafuerte vertical central derecho + líneas de estrías de piedra
      ctx.fillStyle = '#e7e0d3';
      ctx.fillRect(towerX + 38, towerTopY + 24, towerW - 40, pedestalTopY - towerTopY - 24);
      ctx.strokeStyle = 'rgba(130, 120, 105, 0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(towerX + 54, towerTopY + 28);
      ctx.lineTo(towerX + 54, pedestalTopY);
      ctx.moveTo(towerX + 74, towerTopY + 28);
      ctx.lineTo(towerX + 74, pedestalTopY);
      ctx.stroke();

      // Coronamiento superior plano escalonado de la Torre con óculo solar superior
      ctx.fillStyle = '#a89f8d';
      ctx.beginPath();
      ctx.moveTo(towerX + 8, towerTopY + 14);
      ctx.lineTo(towerX + 24, towerTopY);
      ctx.lineTo(towerX + 72, towerTopY);
      ctx.lineTo(towerX + towerW - 6, towerTopY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dbd3c4';
      ctx.fillRect(towerX + 26, towerTopY + 2, 46, 22);
      // Óculo / rosetón circular en el mirador superior
      ctx.fillStyle = '#332f29';
      ctx.beginPath();
      ctx.arc(towerX + 58, towerTopY + 14, 5.2, 0, Math.PI * 2);
      ctx.fill();

      // Relieve bronce del Sol de Mayo a media altura de la torre
      ctx.fillStyle = '#5b5649';
      ctx.beginPath();
      ctx.arc(towerX + 62, towerTopY + 112, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#756e5c';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#b4ab98';
      ctx.beginPath();
      ctx.arc(towerX + 62, towerTopY + 112, 4.2, 0, Math.PI * 2);
      ctx.fill();

      // --- BASAMENTO MONUMENTAL DE LA TORRE + PROA NAVAL ---
      const baseX = mx - 76;
      const baseW = 148;
      // Bloque izquierdo del cuerpo basal en sombra
      ctx.fillStyle = '#8b8272';
      ctx.fillRect(baseX, pedestalTopY + 8, 34, baseFloorY - pedestalTopY - 8);
      // Bloque central travertino
      ctx.fillStyle = '#d3cbb9';
      ctx.fillRect(baseX + 34, pedestalTopY, baseW - 34, baseFloorY - pedestalTopY);

      // Inscripción histórica tallada en el frente superior del pedestal
      ctx.fillStyle = 'rgba(72, 66, 56, 0.55)';
      for (let row = 0; row < 4; row++) {
        ctx.fillRect(baseX + 64, pedestalTopY + 16 + row * 6, 46, 2.2);
      }

      // Cruz monumental calada/tallada en relieve en la cara frontal del pedestal
      const crossX = baseX + 86;
      const crossY = pedestalTopY + 50;
      ctx.fillStyle = '#978d7c';
      ctx.fillRect(crossX - 5, crossY, 10, 44);
      ctx.fillRect(crossX - 15, crossY + 11, 30, 9);
      ctx.fillStyle = '#e5ddd0';
      ctx.fillRect(crossX - 3, crossY + 1, 7, 42);
      ctx.fillRect(crossX - 13, crossY + 12, 26, 7);

      // Grupos escultóricos de bronce/piedra característicos sobre las cornisas
      // Estatua clara en nicho superior izquierdo
      ctx.fillStyle = '#e8e1d4';
      ctx.fillRect(baseX + 41, pedestalTopY + 8, 9, 24);
      ctx.beginPath();
      ctx.arc(baseX + 45.5, pedestalTopY + 5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      // Grupo escultórico en terraza lateral izquierda (hacia Patio Cívico)
      ctx.fillStyle = '#2d3b32';
      ctx.fillRect(baseX - 16, pedestalTopY + 62, 16, 24);
      ctx.fillRect(baseX - 18, pedestalTopY + 50, 3, 24);
      // Escultura monumental de bronce verdoso coronando la Proa (derecha)
      ctx.fillStyle = '#283c32';
      ctx.beginPath();
      ctx.moveTo(baseX + 106, pedestalTopY + 72);
      ctx.lineTo(baseX + 116, pedestalTopY + 14);
      ctx.lineTo(baseX + 130, pedestalTopY + 26);
      ctx.lineTo(baseX + 138, pedestalTopY + 72);
      ctx.closePath();
      ctx.fill();

      // Escalinata/Proa curva avanzando hacia adelante y derecha como proa de barco
      ctx.fillStyle = '#cec6b4';
      ctx.beginPath();
      ctx.moveTo(baseX + 58, baseFloorY);
      ctx.lineTo(baseX + 58, pedestalTopY + 118);
      ctx.quadraticCurveTo(baseX + 94, pedestalTopY + 108, baseX + 108, pedestalTopY + 72);
      ctx.lineTo(baseX + 142, pedestalTopY + 72);
      ctx.lineTo(baseX + 188, baseFloorY);
      ctx.closePath();
      ctx.fill();
      // Columna proa clara y talud escalonado frontal
      ctx.fillStyle = '#e8e1d5';
      ctx.fillRect(baseX + 124, pedestalTopY + 72, 16, baseFloorY - (pedestalTopY + 72));
      ctx.fillStyle = '#a49b89';
      ctx.beginPath();
      ctx.moveTo(baseX + 34, baseFloorY);
      ctx.lineTo(baseX + 54, baseFloorY - 30);
      ctx.lineTo(baseX + 104, baseFloorY - 30);
      ctx.lineTo(baseX + 118, baseFloorY);
      ctx.closePath();
      ctx.fill();
      // Base frontal horizontal escalonada
      ctx.fillStyle = '#e5ddd0';
      ctx.fillRect(baseX - 10, baseFloorY - 8, baseW + 116, 10);

      // Pequeña Bandera Argentina ondeando en el mástil junto al Propileo
      const wave = Math.sin(time * 4.0) * 3;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(propX + 150, propTopY - 38, 2, 40);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(propX + 152, propTopY - 38, 24, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(propX + 152, propTopY - 34, 24, 4 + wave * 0.08);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(propX + 152, propTopY - 30, 24, 4);

      ctx.restore();
    }

    static drawRoFlorida(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0ea5e9');
      sky.addColorStop(0.55, '#bae6fd');
      sky.addColorStop(0.75, '#fef3c7');
      sky.addColorStop(1, '#155e75');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      this.drawVolumetricClouds(ctx, cameraX * 0.5, time, 74, 'rgba(255,255,255,0.75)');

      // Puente atirantado Rosario-Victoria cruzando el horizonte del Paraná
      const px = -((cameraX * 0.18) % 680);
      for (let r = -1; r < 3; r++) {
        const bx = px + r * 680;
        // Pilones gemelos de hormigón blanco en A
        [bx + 180, bx + 440].forEach((tx) => {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(tx - 24, 388);
          ctx.lineTo(tx, 128);
          ctx.lineTo(tx + 24, 388);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(241, 245, 249, 0.7)';
          ctx.lineWidth = 1.4;
          for (let c = -3; c <= 3; c++) {
            ctx.beginPath();
            ctx.moveTo(tx, 146);
            ctx.lineTo(tx + c * 36, 366);
            ctx.stroke();
          }
        });
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(bx, 366, 680, 8);
      }

      // Islas del Delta verdes a lo lejos y agua marrón-turquesa del Paraná
      ctx.fillStyle = '#15803d';
      for (let k = -1; k < 5; k++) {
        const ix = -((cameraX * 0.28) % 340) + k * 340;
        ctx.beginPath();
        ctx.ellipse(ix + 160, 412, 140, 22, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(14, 116, 144, 0.65)';
      ctx.fillRect(0, 412, w, h - 412);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let rx = 0; rx < w; rx += 56) {
        ctx.fillRect(rx + Math.sin(time * 2.8 + rx) * 7, 434 + ((rx % 3) * 14), 26, 2.5);
      }
    }

    static drawRoParque(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(0.42, '#4c1d95');
      sky.addColorStop(0.76, '#fb7185');
      sky.addColorStop(1, '#fdba74');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Sol dorado al atardecer sobre el Parque Independencia
      ctx.fillStyle = 'rgba(253, 224, 71, 0.72)';
      ctx.beginPath();
      ctx.arc(w * 0.24, 198, 44, 0, Math.PI * 2);
      ctx.fill();

      // Horizonte lejano del Estadio Marcelo Bielsa ("El Coloso") asomando entre la arboleda del Parque
      // Fiel a la referencia: tribunas escalonadas divididas en rojo vibrante y negro intenso + torres de luz + "10"
      const colX = w * 0.54 - cameraX * 0.08;
      const colY = 236;
      ctx.save();
      // Anillo inferior rojinegro y césped interior asomando en perspectiva
      ctx.fillStyle = '#09090b';
      ctx.fillRect(colX - 210, colY + 62, 420, 46);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(colX - 200, colY + 72, 200, 26);
      ctx.fillStyle = '#111827';
      ctx.fillRect(colX, colY + 72, 200, 26);
      ctx.fillStyle = 'rgba(21, 128, 61, 0.85)';
      ctx.fillRect(colX - 150, colY + 86, 300, 12);

      // Tribuna Alta Principal izquierda (doble bandeja escalonada mitad rojo / mitad negro + escudo blanco)
      ctx.beginPath();
      ctx.moveTo(colX - 218, colY + 62);
      ctx.lineTo(colX - 186, colY + 8);
      ctx.lineTo(colX + 18, colY + 2);
      ctx.lineTo(colX + 36, colY + 62);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Mitad derecha negra de la tribuna principal (corte limpio oblicuo rojinegro)
      ctx.beginPath();
      ctx.moveTo(colX - 96, colY + 5);
      ctx.lineTo(colX + 18, colY + 2);
      ctx.lineTo(colX + 36, colY + 62);
      ctx.lineTo(colX - 58, colY + 62);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Escudo / banda diagonal blanca característica de la tribuna roja y negra
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(colX - 104, colY + 20, 32, 30);
      ctx.beginPath();
      ctx.moveTo(colX - 104, colY + 20);
      ctx.lineTo(colX - 72, colY + 50);
      ctx.stroke();

      // Escalonado blanco sutil de las gradas y cenefa publicitaria inferior
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(colX - 208, colY + 56, 240, 5);

      // Tribuna Alta Opuesta / Cabecera (derecha): mitad izquierda rojo, mitad derecha negro con el "10" blanco
      const rStandX = colX + 54;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(rStandX, colY + 12);
      ctx.lineTo(rStandX + 76, colY + 14);
      ctx.lineTo(rStandX + 68, colY + 62);
      ctx.lineTo(rStandX - 6, colY + 62);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(rStandX + 76, colY + 14);
      ctx.lineTo(rStandX + 152, colY + 18);
      ctx.lineTo(rStandX + 146, colY + 62);
      ctx.lineTo(rStandX + 68, colY + 62);
      ctx.closePath();
      ctx.fill();

      // Número "10" blanco icónico en la tribuna rojinegra
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('10', rStandX + 76, colY + 42);
      ctx.textAlign = 'left';

      // Torres esbeltas de iluminación en las esquinas del Estadio Marcelo Bielsa
      [colX - 210, colX + 26, colX + 196].forEach((tx) => {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(tx - 3, colY - 30, 6, 98);
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 11, colY - 36, 22, 12);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(tx - 8, colY - 33, 16, 6);
      });
      ctx.restore();

      // Arboleda de tipas y eucaliptos del Parque Independencia + faroles románticos
      const off = -((cameraX * 0.22) % 240);
      for (let i = -1; i < 6; i++) {
        const tx = off + i * 240;
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(tx + 55, 344, 52, 0, Math.PI * 2);
        ctx.arc(tx + 120, 328, 62, 0, Math.PI * 2);
        ctx.arc(tx + 185, 348, 46, 0, Math.PI * 2);
        ctx.fill();

        // Farol clásico del Rosedal / Laguito
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(tx + 216, 294, 5, 106);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(tx + 218.5, 290, 8 + Math.sin(time * 3 + i) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fuente de Aguas Danzantes y espejo del Laguito
      ctx.fillStyle = 'rgba(30, 58, 138, 0.65)';
      ctx.fillRect(0, 398, w, h - 398);
      const jetX = w * 0.5 - ((cameraX * 0.12) % 300);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
      for (let j = -2; j <= 2; j++) {
        const jh = 46 + Math.sin(time * 5 + j) * 14;
        ctx.fillRect(jetX + j * 14, 398 - jh, 4, jh);
      }
    }

    static drawRoArroyito(ctx, cameraX, w, h, time) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#020617');
      sky.addColorStop(0.45, '#0f172a');
      sky.addColorStop(0.72, '#1e3a8a');
      sky.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Fondo fluvial del Río Paraná bordeando la parte posterior (norte) del barrio Arroyito
      ctx.fillStyle = '#334e68';
      ctx.fillRect(0, 128, w, 108);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
      for (let rx = 20; rx < w; rx += 92) {
        ctx.fillRect(rx + Math.sin(time * 2.1 + rx) * 6, 152 + ((rx % 3) * 18), 44, 2);
      }
      // Siluetas ribereñas de Arroyito (torres costeras y tinglados junto al Paraná a la derecha)
      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.78 - cameraX * 0.05, 118, 28, 118);
      ctx.fillRect(w * 0.85 - cameraX * 0.05, 132, 22, 104);

      // ESTADIO GIGANTE DE ARROYITO (Fiel a la referencia de la Tercera Bandeja)
      // - Cuenco ovalado cerrado de dos bandejas azul oscuro con franja/cornisa amarilla brillante
      // - Tercera Bandeja asimétrica de color azul oscuro ÚNICAMENTE sobre la tribuna lateral del río
      // - Letras amarillas "GIGANTE DE ARROYITO" en la bandeja superior lateral
      // - 4 icónicas torres altas de iluminación azul oscuro en las esquinas
      const gx = w * 0.5 - cameraX * 0.08;
      const bowlCy = 294;
      const bowlRx = 262;
      const bowlRy = 86;

      ctx.save();

      // Haces diagonales suaves de las 4 torres de iluminación antes del contorno frontal
      const towers = [
        { x: gx - 270, topY: 76, baseY: 368 },
        { x: gx + 216, topY: 74, baseY: 320 },
        { x: gx - 246, topY: 132, baseY: 410 },
        { x: gx + 272, topY: 112, baseY: 396 },
      ];
      towers.forEach((tw) => {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.07)';
        ctx.beginPath();
        ctx.moveTo(tw.x, tw.topY + 12);
        ctx.lineTo(gx - 90, bowlCy + 20);
        ctx.lineTo(gx + 90, bowlCy + 20);
        ctx.closePath();
        ctx.fill();
      });

      // --- TERCERA BANDEJA ASIMÉTRICA (exclusiva sobre la tribuna lateral superior del río) ---
      const b3Left = gx - 186;
      const b3Right = gx + 158;
      const b3Top = 152;
      const b3Bot = 216;
      ctx.fillStyle = '#172554';
      ctx.beginPath();
      ctx.moveTo(b3Left + 10, b3Top);
      ctx.lineTo(b3Right - 8, b3Top - 4);
      ctx.lineTo(b3Right, b3Bot);
      ctx.lineTo(b3Left, b3Bot + 4);
      ctx.closePath();
      ctx.fill();
      // Remate y costillas superiores en azul profundo con tenue línea amarilla superior
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(b3Left + 4, b3Top + 6, b3Right - b3Left - 8, 44);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b3Left + 10, b3Top);
      ctx.lineTo(b3Right - 8, b3Top - 4);
      ctx.stroke();
      // Bocas de acceso oscuras en la base de la Tercera Bandeja
      ctx.fillStyle = '#020617';
      for (let p = 0; p < 3; p++) {
        ctx.fillRect(b3Left + 52 + p * 102, b3Bot - 12, 16, 8);
      }

      // --- CUENCO CERRADO DE DOS BANDEJAS (Azul oscuro + bordes y franjas amarillo vivo) ---
      // Base exterior azul oscuro
      ctx.fillStyle = '#0f1f4b';
      ctx.beginPath();
      ctx.ellipse(gx, bowlCy + 28, bowlRx, bowlRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anillo exterior de dos bandejas con borde superior amarillo brillante
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(gx, bowlCy, bowlRx, bowlRy, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4.5;
      ctx.stroke();

      // Costillas verticales amarillas en la estructura externa inferior (delante/lados)
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.52)';
      ctx.lineWidth = 2;
      for (let ang = 0.22; ang <= Math.PI - 0.22; ang += 0.14) {
        const vx1 = gx + Math.cos(ang) * (bowlRx - 2);
        const vy1 = bowlCy + Math.sin(ang) * (bowlRy - 2);
        ctx.beginPath();
        ctx.moveTo(vx1, vy1);
        ctx.lineTo(vx1, vy1 + 26);
        ctx.stroke();
      }

      // Interior escalonado del cuenco (bandeja superior + franja amarilla intermedia + bandeja baja + césped)
      ctx.fillStyle = '#172554';
      ctx.beginPath();
      ctx.ellipse(gx, bowlCy, bowlRx - 16, bowlRy - 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Franja amarilla de pasillo central e identificación en la tribuna superior del río: "GIGANTE DE ARROYITO"
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GIGANTE DE ARROYITO', gx - 10, bowlCy - 51);
      ctx.textAlign = 'left';

      // Dos franjas verticales amarillas en el sector central de la bandeja baja
      ctx.fillStyle = 'rgba(250, 204, 21, 0.78)';
      ctx.fillRect(gx - 22, bowlCy - 42, 8, 20);
      ctx.fillRect(gx + 10, bowlCy - 42, 8, 20);

      // Césped verde iluminado asomando en el interior del estadio
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.ellipse(gx, bowlCy + 10, bowlRx - 78, bowlRy - 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(74, 222, 128, 0.28)';
      ctx.fillRect(gx - 110, bowlCy + 2, 220, 14);

      // Techo metálico de palcos sobre la tribuna delantera más cercana
      ctx.fillStyle = '#64748b';
      ctx.fillRect(gx - 92, bowlCy + 38, 198, 16);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(gx - 92, bowlCy + 38, 198, 4);

      // --- 4 TORRES ALTAS DE ILUMINACIÓN AZUL OSCURO EN LAS ESQUINAS ---
      towers.forEach((tw) => {
        // Columna estructural azul oscuro alta
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(tw.x - 5, tw.topY, 10, tw.baseY - tw.topY);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(tw.x - 2, tw.topY, 3, tw.baseY - tw.topY);

        // Parrilla rectangular de reflectores blancos en la cima
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tw.x - 10, tw.topY - 6, 20, 22);
        ctx.fillStyle = '#f8fafc';
        for (let r = 0; r < 3; r++) {
          ctx.fillRect(tw.x - 7, tw.topY - 3 + r * 6, 14, 4);
        }
      });

      ctx.restore();

      // Papelitos azul y amarillo volando en el viento canalla
      for (let c = 0; c < 14; c++) {
        const cx = ((c * 95 + time * 180) % (w + 60)) - 30;
        const cy = 90 + ((c * 57 + time * 45) % 260);
        ctx.fillStyle = c % 2 === 0 ? '#facc15' : '#60a5fa';
        ctx.fillRect(cx, cy, 5, 4);
      }
    }

    static drawChileTheme(ctx, theme, cameraX, w, h, time, levelWidth = null) {
      const isAlmaObs = theme === 'ch_atacama_alma';
      const isTatio = theme === 'ch_atacama_tatio';
      const isSalar = theme === 'ch_atacama_salar';
      const isLuna = theme === 'ch_atacama_luna';
      const isAnakena = theme === 'ch_pascua_anakena';
      const isRanoKau = theme === 'ch_pascua_kau';
      const isPascua = theme.indexOf('ch_pascua') === 0;
      const isAtacama = theme.indexOf('ch_atacama') === 0;
      const isVina = theme.indexOf('ch_vina') === 0;
      const isSunriseTongariki = theme === 'ch_pascua_tongariki';
      const isPuertoDusk = theme === 'ch_vina_puerto';
      const isSantiagoPlaza = theme === 'ch_santiago_plaza';
      const isSanCristobal = theme === 'ch_santiago_cristobal';
      const isCostaneraDusk = theme === 'ch_santiago_costanera';

      // 1. Cielo gradiente por región chilena (cada zona con identidad cromática propia)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      if (isAlmaObs) {
        sky.addColorStop(0, '#041f57');
        sky.addColorStop(0.38, '#0b3c8f');
        sky.addColorStop(0.76, '#1b5eb8');
        sky.addColorStop(1, '#588cd4');
      } else if (isTatio) {
        sky.addColorStop(0, '#061a40');
        sky.addColorStop(0.42, '#0c3573');
        sky.addColorStop(0.76, '#1d4ed8');
        sky.addColorStop(0.92, '#60a5fa');
        sky.addColorStop(1, '#fdba74');
      } else if (isSalar) {
        sky.addColorStop(0, '#082f6b');
        sky.addColorStop(0.42, '#0284c7');
        sky.addColorStop(0.78, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
      } else if (isLuna) {
        sky.addColorStop(0, '#03438f');
        sky.addColorStop(0.48, '#0284c7');
        sky.addColorStop(0.84, '#60a5fa');
        sky.addColorStop(1, '#dbeafe');
      } else if (isSunriseTongariki) {
        sky.addColorStop(0, '#312e81');
        sky.addColorStop(0.38, '#be185d');
        sky.addColorStop(0.75, '#fb923c');
        sky.addColorStop(1, '#fde047');
      } else if (isAnakena) {
        sky.addColorStop(0, '#0369a1');
        sky.addColorStop(0.34, '#38bdf8');
        sky.addColorStop(0.70, '#bae6fd');
        sky.addColorStop(1, '#f0f9ff');
      } else if (isRanoKau) {
        // Cielo celeste luminoso y despejado en la parte alta hacia bruma suave costera (Mirador Rano Kau)
        sky.addColorStop(0, '#1e88c7');
        sky.addColorStop(0.36, '#5bb5e8');
        sky.addColorStop(0.74, '#bae6fd');
        sky.addColorStop(1, '#e0f2fe');
      } else if (isPuertoDusk) {
        sky.addColorStop(0, '#0f172a');
        sky.addColorStop(0.28, '#155e75');
        sky.addColorStop(0.58, '#f59e0b');
        sky.addColorStop(0.84, '#fdba74');
        sky.addColorStop(1, '#1e293b');
      } else if (isAtacama) {
        sky.addColorStop(0, '#0284c7');
        sky.addColorStop(0.56, '#38bdf8');
        sky.addColorStop(1, '#fed7aa');
      } else if (isPascua) {
        sky.addColorStop(0, '#0369a1');
        sky.addColorStop(0.54, '#0ea5e9');
        sky.addColorStop(1, '#bae6fd');
      } else if (isCostaneraDusk) {
        // Cielo crepuscular azul cobalto profundo hacia violeta-rosado suave en el horizonte (Costanera Center al atardecer)
        sky.addColorStop(0, '#0b2161');
        sky.addColorStop(0.28, '#173685');
        sky.addColorStop(0.56, '#433878');
        sky.addColorStop(0.80, '#9d6b99');
        sky.addColorStop(1, '#e899a0');
      } else {
        // Cielo azul celeste limpio y despejado (Santiago de día: Plaza de Armas, San Cristóbal, Lastarria)
        sky.addColorStop(0, '#0284c7');
        sky.addColorStop(0.54, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // 2. Astro / Resplandor Solar Andino / Nubes alargadas / Nubes costeras
      if (isAlmaObs) {
        ctx.save();
        const sunX = ((w * 0.78 - cameraX * 0.02) % w + w) % w;
        const sunGlow = ctx.createRadialGradient(sunX, 62, 6, sunX, 62, 130);
        sunGlow.addColorStop(0, 'rgba(255, 252, 235, 0.92)');
        sunGlow.addColorStop(0.22, 'rgba(191, 219, 254, 0.30)');
        sunGlow.addColorStop(1, 'rgba(11, 60, 143, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, 62, 130, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(sunX, 62, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (isTatio) {
        // Sol bajo brillante del amanecer altiplánico asomando sobre el horizonte oscuro
        ctx.save();
        const sunX = w * 0.64 - ((cameraX * 0.015) % 140);
        const sunY = h - 172;
        const dawnHalo = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 175);
        dawnHalo.addColorStop(0, 'rgba(255, 251, 235, 0.98)');
        dawnHalo.addColorStop(0.16, 'rgba(254, 240, 138, 0.80)');
        dawnHalo.addColorStop(0.42, 'rgba(251, 146, 60, 0.34)');
        dawnHalo.addColorStop(1, 'rgba(29, 78, 216, 0)');
        ctx.fillStyle = dawnHalo;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 175, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fefce8';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (isSalar) {
        // Nubes blancas largas y finas estiradas por el viento del altiplano sobre el Salar
        ctx.save();
        const streakPeriod = 1280;
        const pStreak = ((-(cameraX * 0.05) + time * 6) % streakPeriod + streakPeriod) % streakPeriod - streakPeriod;
        const streaks = [
          { dx: 80, y: 66, len: 290, h: 10, a: 0.72 },
          { dx: 420, y: 98, len: 360, h: 12, a: 0.80 },
          { dx: 790, y: 58, len: 310, h: 9, a: 0.68 },
          { dx: 1040, y: 124, len: 260, h: 11, a: 0.74 },
          { dx: 230, y: 146, len: 210, h: 8, a: 0.56 }
        ];
        for (let sx0 = pStreak; sx0 < w + streakPeriod; sx0 += streakPeriod) {
          for (let s = 0; s < streaks.length; s++) {
            const st = streaks[s];
            ctx.fillStyle = `rgba(255, 255, 255, ${st.a})`;
            ctx.beginPath();
            ctx.ellipse(sx0 + st.dx, st.y, st.len * 0.5, st.h, -0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(241, 245, 249, ${(st.a * 0.6).toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(sx0 + st.dx + st.len * 0.18, st.y + 4, st.len * 0.34, st.h * 0.65, -0.01, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      } else if (isLuna) {
        // Cielo azul intenso limpio de desierto en Valle de la Luna (luminosidad seca sin bruma densa)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        const wispX = ((-(cameraX * 0.04) % 900) + 900) % 900 - 200;
        for (let k = wispX; k < w + 300; k += 900) {
          ctx.beginPath();
          ctx.ellipse(k + 340, 72, 135, 5, -0.03, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (isAnakena) {
        // Nubes blancas amplias y suaves cubriendo parte del horizonte costero de Anakena
        ctx.save();
        const cloudPeriod = 1280;
        const pCloud = ((-(cameraX * 0.06) + time * 4) % cloudPeriod + cloudPeriod) % cloudPeriod - cloudPeriod;
        for (let cx0 = pCloud; cx0 < w + cloudPeriod; cx0 += cloudPeriod) {
          // Velo amplio diagonal luminoso cruzando desde el cielo central hacia el horizonte derecho
          const veilGrad = ctx.createLinearGradient(cx0, 0, cx0 + 1100, h * 0.72);
          veilGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
          veilGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.68)');
          veilGrad.addColorStop(1, 'rgba(241, 245, 249, 0.88)');
          ctx.fillStyle = veilGrad;
          ctx.beginPath();
          ctx.moveTo(cx0 + 180, 18);
          ctx.bezierCurveTo(cx0 + 480, 10, cx0 + 780, 52, cx0 + cloudPeriod, 120);
          ctx.lineTo(cx0 + cloudPeriod, h * 0.76);
          ctx.lineTo(cx0, h * 0.76);
          ctx.bezierCurveTo(cx0 + 40, h * 0.56, cx0 + 120, 190, cx0 + 180, 18);
          ctx.closePath();
          ctx.fill();

          // Masas suaves de cúmulos blancos sobre el horizonte marítimo-tropical
          const puffs = [
            { dx: 110, y: 122, rx: 145, ry: 48, col: 'rgba(255, 255, 255, 0.62)' },
            { dx: 360, y: 84, rx: 185, ry: 56, col: 'rgba(255, 255, 255, 0.72)' },
            { dx: 640, y: 148, rx: 220, ry: 68, col: 'rgba(248, 250, 252, 0.86)' },
            { dx: 950, y: 118, rx: 235, ry: 72, col: 'rgba(255, 255, 255, 0.82)' },
            { dx: 1140, y: 215, rx: 195, ry: 58, col: 'rgba(241, 245, 249, 0.84)' },
            { dx: 820, y: 235, rx: 210, ry: 46, col: 'rgba(255, 255, 255, 0.78)' },
            // Acumulación suave grisácea costera en el sector derecho del horizonte
            { dx: 1030, y: 175, rx: 125, ry: 42, col: 'rgba(100, 116, 139, 0.30)' },
            { dx: 1110, y: 192, rx: 92, ry: 34, col: 'rgba(71, 85, 105, 0.24)' }
          ];
          for (let p = 0; p < puffs.length; p++) {
            const pf = puffs[p];
            ctx.fillStyle = pf.col;
            ctx.beginPath();
            ctx.ellipse(cx0 + pf.dx, pf.y, pf.rx, pf.ry, -0.06, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      } else if (isRanoKau) {
        // Nubes suaves y bajas sobre el horizonte marino en Rano Kau (manteniendo el cielo despejado y gran contraste)
        ctx.save();
        const cloudPeriod = 1280;
        const pCloud = -(((cameraX * 0.05 + time * 4) % cloudPeriod + cloudPeriod) % cloudPeriod);
        const lowBanks = [
          { x: 55, y: 174, w: 170, h: 14 },
          { x: 245, y: 168, w: 215, h: 16 },
          { x: 520, y: 176, w: 185, h: 13 },
          { x: 790, y: 166, w: 240, h: 17 },
          { x: 1090, y: 175, w: 165, h: 13 }
        ];
        for (let rep = 0; rep < 2; rep++) {
          const bx0 = pCloud + rep * cloudPeriod;
          for (let i = 0; i < lowBanks.length; i++) {
            const c = lowBanks[i];
            const cx = bx0 + c.x;
            ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
            ctx.beginPath();
            ctx.ellipse(cx + 8, c.y + 5, c.w * 0.52, c.h * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
            ctx.beginPath();
            ctx.ellipse(cx, c.y, c.w * 0.46, c.h * 0.78, 0, 0, Math.PI * 2);
            ctx.ellipse(cx - c.w * 0.22, c.y + 3, c.w * 0.26, c.h * 0.62, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + c.w * 0.24, c.y + 3, c.w * 0.25, c.h * 0.58, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      } else if (isCostaneraDusk) {
        // Resplandor crepuscular cálido en el horizonte y suaves nubes violeta-rosadas al atardecer
        const glowX = w * 0.28;
        const glowY = h * 0.42;
        const duskGlow = ctx.createRadialGradient(glowX, glowY, 12, glowX, glowY, 310);
        duskGlow.addColorStop(0, 'rgba(254, 215, 170, 0.34)');
        duskGlow.addColorStop(0.45, 'rgba(244, 114, 182, 0.16)');
        duskGlow.addColorStop(1, 'rgba(23, 54, 133, 0)');
        ctx.fillStyle = duskGlow;
        ctx.fillRect(0, 0, w, h);
        this.drawVolumetricClouds(
          ctx,
          cameraX * 0.45,
          time * 0.5,
          68,
          'rgba(216, 140, 154, 0.24)'
        );
      } else {
        const sunX = isSunriseTongariki ? w * 0.62 : (isPuertoDusk ? w * 0.72 : w * 0.78);
        const sunY = isSunriseTongariki ? 235 : (isPuertoDusk ? 170 : 92);
        ctx.fillStyle = isSunriseTongariki ? '#fde047' : (isPuertoDusk ? 'rgba(251, 191, 36, 0.75)' : 'rgba(254, 240, 138, 0.92)');
        ctx.beginPath();
        ctx.arc(sunX, sunY, isSunriseTongariki ? 46 : 34, 0, Math.PI * 2);
        ctx.fill();
        this.drawVolumetricClouds(
          ctx,
          cameraX,
          time,
          isPascua ? 72 : 64,
          isPuertoDusk ? 'rgba(253, 186, 116, 0.35)' : 'rgba(255, 255, 255, 0.85)'
        );
      }

      // Helper compartido: evita cortes abruptos asegurando salida completa por -120px y entrada > w+120px
      const wrapItemX = (scrollOffset, initialX, minLocalX, maxLocalX, minCycle = 0) => {
        const leftPad = Math.max(120, Math.ceil(maxLocalX + 120));
        const span = Math.max(minCycle, Math.ceil(w + leftPad - minLocalX + 120));
        const raw = scrollOffset + initialX + leftPad;
        return ((raw % span) + span) % span - leftPad;
      };

      // 3. Cordillera de los Andes / Volcán Licancabur / Picos áridos de Chajnantor / Cerros Tatio
      if (isAlmaObs) {
        const pMtn = -(cameraX * 0.08);
        for (let i = 0; i < 6; i++) {
          const mx = wrapItemX(pMtn, -120 + i * 260, -45, 290, 1560);
          const ridgeH = 44 + (i % 3) * 18;
          ctx.fillStyle = i % 2 === 0 ? '#6b422d' : '#8c5538';
          ctx.beginPath();
          ctx.moveTo(mx - 45, h - 125);
          ctx.lineTo(mx + 95, h - 125 - ridgeH);
          ctx.lineTo(mx + 290, h - 125);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#b07756';
          ctx.beginPath();
          ctx.moveTo(mx + 95, h - 125 - ridgeH);
          ctx.lineTo(mx + 148, h - 125 - ridgeH * 0.42);
          ctx.lineTo(mx + 250, h - 125);
          ctx.lineTo(mx + 112, h - 125);
          ctx.closePath();
          ctx.fill();
        }
      } else if (isTatio) {
        // Cordón de cerros andinos oscuros al amanecer detrás del campo geotermal de El Tatio
        const pMtn = -(cameraX * 0.08);
        const hillPeriod = 1440;
        const hillStart = ((pMtn % hillPeriod) + hillPeriod) % hillPeriod - hillPeriod;
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.moveTo(hillStart, h);
        for (let hx = hillStart; hx < w + hillPeriod; hx += hillPeriod) {
          ctx.lineTo(hx, h - 155);
          ctx.lineTo(hx + 210, h - 210);
          ctx.lineTo(hx + 430, h - 168);
          ctx.lineTo(hx + 680, h - 224);
          ctx.lineTo(hx + 940, h - 162);
          ctx.lineTo(hx + 1180, h - 202);
          ctx.lineTo(hx + hillPeriod, h - 155);
        }
        ctx.lineTo(w + hillPeriod, h);
        ctx.closePath();
        ctx.fill();

        // Sutil filo dorado de contraluz sobre el borde de los cerros oscuros
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let hx = hillStart; hx < w + hillPeriod; hx += hillPeriod) {
          ctx.moveTo(hx, h - 155);
          ctx.lineTo(hx + 210, h - 210);
          ctx.lineTo(hx + 430, h - 168);
          ctx.lineTo(hx + 680, h - 224);
          ctx.lineTo(hx + 940, h - 162);
          ctx.lineTo(hx + 1180, h - 202);
          ctx.lineTo(hx + hillPeriod, h - 155);
        }
        ctx.stroke();
      } else if (isSalar) {
        // Horizonte lejano del Salar: volcanes suaves (Licancabur) y cerros rojizos con nieve sutil en cumbres
        const pVolc = -(cameraX * 0.09);
        const volcPeriod = 1520;
        const vStart = ((pVolc % volcPeriod) + volcPeriod) % volcPeriod - volcPeriod;
        for (let vx = vStart; vx < w + volcPeriod; vx += volcPeriod) {
          // Cordón de cerros rojizos anchos y suaves al fondo
          ctx.fillStyle = '#9a3412';
          ctx.beginPath();
          ctx.moveTo(vx, h - 138);
          ctx.quadraticCurveTo(vx + 180, h - 188, vx + 360, h - 154);
          ctx.quadraticCurveTo(vx + 560, h - 182, vx + 780, h - 144);
          ctx.quadraticCurveTo(vx + 1180, h - 184, vx + volcPeriod, h - 138);
          ctx.lineTo(vx + volcPeriod, h - 120);
          ctx.lineTo(vx, h - 120);
          ctx.closePath();
          ctx.fill();

          // Volcán Licancabur cónico simétrico + volcán gemelo con ligeros toques de nieve en cumbre
          const peaks = [
            { px: 470, baseW: 340, peakH: 108, snow: true },
            { px: 960, baseW: 290, peakH: 88, snow: true },
            { px: 1310, baseW: 260, peakH: 66, snow: false }
          ];
          for (let k = 0; k < peaks.length; k++) {
            const pk = peaks[k];
            const cx = vx + pk.px;
            const topY = h - 140 - pk.peakH;
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.moveTo(cx - pk.baseW * 0.5, h - 138);
            ctx.quadraticCurveTo(cx - pk.baseW * 0.14, topY + pk.peakH * 0.25, cx - 14, topY);
            ctx.lineTo(cx + 14, topY);
            ctx.quadraticCurveTo(cx + pk.baseW * 0.14, topY + pk.peakH * 0.25, cx + pk.baseW * 0.5, h - 138);
            ctx.closePath();
            ctx.fill();
            // Ladera derecha en sombra rojiza suave
            ctx.fillStyle = '#7c2d12';
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx + 14, topY);
            ctx.quadraticCurveTo(cx + pk.baseW * 0.14, topY + pk.peakH * 0.25, cx + pk.baseW * 0.5, h - 138);
            ctx.lineTo(cx + 12, h - 138);
            ctx.closePath();
            ctx.fill();
            // Ligeros toques de nieve en las cumbres más altas
            if (pk.snow) {
              ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
              ctx.beginPath();
              ctx.moveTo(cx - 14, topY);
              ctx.lineTo(cx + 14, topY);
              ctx.lineTo(cx + 26, topY + 18);
              ctx.lineTo(cx + 6, topY + 12);
              ctx.lineTo(cx - 8, topY + 20);
              ctx.lineTo(cx - 24, topY + 14);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      } else if (!isVina && !isPascua && !isAtacama) {
        if (isCostaneraDusk) {
          // Cordillera de los Andes al atardecer: cumbres nevadas con reflejos rosados/dorados y laderas oscuras en alto contraste
          const andesScroll = -(cameraX * 0.08);
          const ridgeSpan = 1680;
          const peaks = [
            { x: 0, peakY: h - 388, w: 320, subPeakY: h - 350 },
            { x: 260, peakY: h - 418, w: 350, subPeakY: h - 365 },
            { x: 540, peakY: h - 394, w: 310, subPeakY: h - 356 },
            { x: 800, peakY: h - 430, w: 360, subPeakY: h - 372 },
            { x: 1110, peakY: h - 402, w: 340, subPeakY: h - 360 },
            { x: 1390, peakY: h - 392, w: 340, subPeakY: h - 352 }
          ];
          // Masa nevada superior iluminada por el crepúsculo
          for (let rep = -1; rep <= 1; rep++) {
            const baseOff = ((andesScroll % ridgeSpan) + ridgeSpan) % ridgeSpan - ridgeSpan + rep * ridgeSpan;
            for (let i = 0; i < peaks.length; i++) {
              const pk = peaks[i];
              const mx = baseOff + pk.x;
              if (mx + pk.w < -120 || mx - 40 > w + 120) continue;
              const snowGrad = ctx.createLinearGradient(mx, pk.peakY, mx, h - 255);
              snowGrad.addColorStop(0, '#fbcfe8');
              snowGrad.addColorStop(0.45, '#fda4af');
              snowGrad.addColorStop(0.8, '#fed7aa');
              snowGrad.addColorStop(1, '#c08497');
              ctx.fillStyle = snowGrad;
              ctx.beginPath();
              ctx.moveTo(mx - 35, h - 230);
              ctx.lineTo(mx + pk.w * 0.24, pk.subPeakY);
              ctx.lineTo(mx + pk.w * 0.50, pk.peakY);
              ctx.lineTo(mx + pk.w * 0.72, pk.subPeakY + 12);
              ctx.lineTo(mx + pk.w + 30, h - 230);
              ctx.closePath();
              ctx.fill();
              // Vertiente este en sombra azul-violeta y aristas rocosas sobre la nieve
              ctx.fillStyle = 'rgba(49, 46, 129, 0.58)';
              ctx.beginPath();
              ctx.moveTo(mx + pk.w * 0.50, pk.peakY);
              ctx.lineTo(mx + pk.w * 0.62, pk.peakY + 42);
              ctx.lineTo(mx + pk.w * 0.72, pk.subPeakY + 12);
              ctx.lineTo(mx + pk.w + 30, h - 230);
              ctx.lineTo(mx + pk.w * 0.42, h - 230);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = '#e2e8f0';
              ctx.beginPath();
              ctx.moveTo(mx + pk.w * 0.50, pk.peakY);
              ctx.lineTo(mx + pk.w * 0.36, pk.peakY + 46);
              ctx.lineTo(mx + pk.w * 0.48, pk.peakY + 34);
              ctx.closePath();
              ctx.fill();
            }
          }
          // Laderas inferiores oscuras en sombra profunda de la precordillera
          const foothillGrad = ctx.createLinearGradient(0, h - 338, 0, h - 180);
          foothillGrad.addColorStop(0, '#1e1b4b');
          foothillGrad.addColorStop(0.5, '#0f172a');
          foothillGrad.addColorStop(1, '#1e293b');
          ctx.fillStyle = foothillGrad;
          for (let rep = -1; rep <= 1; rep++) {
            const baseOff = ((andesScroll * 1.15 % ridgeSpan) + ridgeSpan) % ridgeSpan - ridgeSpan + rep * ridgeSpan;
            ctx.beginPath();
            ctx.moveTo(baseOff - 80, h - 120);
            ctx.lineTo(baseOff + 140, h - 318);
            ctx.lineTo(baseOff + 420, h - 302);
            ctx.lineTo(baseOff + 680, h - 332);
            ctx.lineTo(baseOff + 960, h - 306);
            ctx.lineTo(baseOff + 1280, h - 336);
            ctx.lineTo(baseOff + 1560, h - 308);
            ctx.lineTo(baseOff + ridgeSpan + 80, h - 120);
            ctx.closePath();
            ctx.fill();
          }
          // Neblina rosado-violácea al pie de la cordillera + luces lejanas en la precordillera
          const valleyMist = ctx.createLinearGradient(0, h - 255, 0, h - 175);
          valleyMist.addColorStop(0, 'rgba(157, 107, 153, 0)');
          valleyMist.addColorStop(0.6, 'rgba(216, 140, 154, 0.24)');
          valleyMist.addColorStop(1, 'rgba(15, 23, 42, 0.72)');
          ctx.fillStyle = valleyMist;
          ctx.fillRect(0, h - 255, w, 85);
          ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
          for (let ld = 0; ld < 42; ld++) {
            const lx = ((ld * 47 + andesScroll * 1.4) % w + w) % w;
            const ly = h - 226 + (ld % 4) * 5;
            ctx.fillRect(lx, ly, 2, 1.5);
          }
        } else {
          const pMtn = -(cameraX * 0.14);
          const lowDistantAndes = isSantiagoPlaza || isSanCristobal;
          const mtnColor = lowDistantAndes ? '#64748b' : '#475569';
          const peakH = lowDistantAndes ? 148 : 218;
          const snowDrop = lowDistantAndes ? 38 : 56;
          const snowMid = lowDistantAndes ? 28 : 42;
          ctx.fillStyle = mtnColor;
          for (let i = 0; i < 6; i++) {
            const mx = wrapItemX(pMtn, -135 + i * 260, -40, 275, 1560);
            ctx.beginPath();
            ctx.moveTo(mx - 40, h - 70);
            ctx.lineTo(mx + 115, h - 70 - peakH);
            ctx.lineTo(mx + 275, h - 70);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(mx + 115, h - 70 - peakH);
            ctx.lineTo(mx + 78, h - 70 - peakH + snowDrop);
            ctx.lineTo(mx + 115, h - 70 - peakH + snowMid);
            ctx.lineTo(mx + 154, h - 70 - peakH + snowDrop);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = mtnColor;
          }
        }
      }

      const pMid = -(cameraX * 0.34);
      ctx.save();

      // ========================================================================
      // A. SANTIAGO (Plaza/La Moneda, San Cristóbal, Lastarria, Costanera Center)
      // ========================================================================
      if (theme === 'ch_santiago_plaza') {
        // Progreso real del nivel para posicionar Palacio de La Moneda UNA SOLA VEZ en el centro (~50%)
        const plazaLevelW = Number.isFinite(levelWidth) && levelWidth > w ? levelWidth : 6700;
        const plazaMaxCam = Math.max(1, plazaLevelW - w);
        const plazaProg = Math.max(0, Math.min(1, cameraX / plazaMaxCam));
        const monedaCenterX = w * 0.5 + (0.50 - plazaProg) * plazaMaxCam * 0.52;

        const drawChileFlag = (fx, fy, fw, fh, phaseOffset) => {
          const wave = Math.sin(time * 4.2 + phaseOffset) * 2.5;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx, fy + wave * 0.2, fw, fh * 0.5);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(fx, fy + fh * 0.5 + wave * 0.25, fw, fh * 0.5);
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(fx, fy + wave * 0.2, fw * 0.36, fh * 0.5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx + fw * 0.14, fy + fh * 0.17 + wave * 0.2, Math.max(2, fw * 0.09), Math.max(2, fh * 0.14));
        };

        // 1. Entorno de Plaza de Armas al inicio y tramo final del nivel (plaza de armas fondo.jfif)
        const plazaSectors = [-2350, -1900, -1450, -1000, -590, 590, 1000, 1450, 1900, 2350];
        for (let s = 0; s < plazaSectors.length; s++) {
          const secOff = plazaSectors[s];
          const secX = monedaCenterX + secOff;
          if (secX < -360 || secX > w + 360) continue;
          const variant = s % 3;

          // Torres modernas al fondo detras de los edificios historicos
          if (variant === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(secX - 140, h - 385, 86, 290);
            ctx.fillStyle = '#475569';
            ctx.fillRect(secX - 110, h - 375, 26, 260);
            ctx.fillStyle = '#64748b';
            for (let fl = 0; fl < 10; fl++) {
              ctx.fillRect(secX - 134, h - 365 + fl * 18, 74, 3);
            }
            ctx.fillStyle = '#334155';
            ctx.fillRect(secX - 122, h - 404, 2, 20);
            drawChileFlag(secX - 120, h - 404, 16, 10, s);
          } else if (variant === 1) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(secX - 65, h - 355, 82, 260);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(secX + 5, h - 335, 58, 240);
            ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
            for (let wy = 0; wy < 9; wy++) {
              ctx.fillRect(secX - 58, h - 344 + wy * 20, 68, 7);
            }
          } else {
            // Torre moderna rojiza/ladrillo y cristal acero
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(secX + 35, h - 348, 84, 250);
            ctx.fillStyle = '#475569';
            ctx.fillRect(secX + 46, h - 338, 62, 195);
            ctx.fillStyle = '#cbd5e1';
            for (let wy = 0; wy < 8; wy++) {
              ctx.fillRect(secX + 50, h - 330 + wy * 18, 54, 4);
            }
          }

          // Edificios neoclásicos beige/piedra de varios pisos
          const bX = secX - 165;
          const bW = 330;
          const bTop = variant === 1 ? h - 258 : h - 246;
          const bH = h - 76 - bTop;
          ctx.fillStyle = variant === 0 ? '#e7dcc8' : (variant === 1 ? '#d6c7b2' : '#c2b098');
          ctx.fillRect(bX, bTop, bW, bH);
          // Cornisa moldurada superior y parapeto
          ctx.fillStyle = '#b09d84';
          ctx.fillRect(bX - 4, bTop - 6, bW + 8, 8);
          ctx.fillStyle = '#f5efe6';
          ctx.fillRect(bX - 2, bTop + 14, bW + 4, 4);
          // Pilastras verticales y ventanas rítmicas con balcones en plantas altas
          for (let col = 0; col < 8; col++) {
            const wx = bX + 18 + col * 39;
            ctx.fillStyle = '#b09d84';
            ctx.fillRect(wx - 7, bTop + 18, 4, bH - 22);
            // Tercer piso / segundo piso
            ctx.fillStyle = '#334155';
            ctx.fillRect(wx, bTop + 26, 20, 26);
            ctx.fillRect(wx, bTop + 68, 20, 30);
            ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
            ctx.fillRect(wx + 3, bTop + 29, 14, 18);
            ctx.fillRect(wx + 3, bTop + 71, 14, 20);
            // Baranda de balcon oscuro
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(wx - 2, bTop + 94, 24, 5);
            // Arcos de planta baja
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(wx + 10, h - 104, 10, Math.PI, 0);
            ctx.lineTo(wx + 20, h - 76);
            ctx.lineTo(wx, h - 76);
            ctx.closePath();
            ctx.fill();
          }
          // Banderas chilenas pequenas en azoteas neoclasicas
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(bX + 26, bTop - 32, 2, 26);
          drawChileFlag(bX + 28, bTop - 32, 15, 9, s * 0.7);
          ctx.fillRect(bX + bW - 34, bTop - 32, 2, 26);
          drawChileFlag(bX + bW - 32, bTop - 32, 15, 9, s * 1.3);

          // Pavimento piedra cálida de Plaza de Armas
          ctx.fillStyle = '#d6b89e';
          ctx.fillRect(bX - 18, h - 92, bW + 36, 24);
          ctx.fillStyle = '#c4a488';
          ctx.fillRect(bX - 18, h - 80, bW + 36, 5);

          // Canteros circulares con césped verde y palmeras altas de Plaza de Armas
          const palmPositions = [secX - 110, secX + 95];
          for (let p = 0; p < palmPositions.length; p++) {
            const px = palmPositions[p];
            const palmTopY = p === 0 ? h - 292 : h - 274;
            // Cantero circular de piedra + césped verde
            ctx.fillStyle = '#a8a29e';
            ctx.beginPath();
            ctx.ellipse(px, h - 74, 28, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.ellipse(px, h - 75, 24, 6.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(px - 3, h - 76, 16, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tronco alto de palmera chilena
            ctx.fillStyle = '#78716c';
            ctx.beginPath();
            ctx.moveTo(px - 6, h - 75);
            ctx.lineTo(px - 3.5, palmTopY);
            ctx.lineTo(px + 3.5, palmTopY);
            ctx.lineTo(px + 6, h - 75);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#a8a29e';
            for (let ring = 14; ring < h - 78 - palmTopY; ring += 16) {
              ctx.fillRect(px - 4, palmTopY + ring, 8, 2);
            }
            // Copa frondosa de palmera
            for (let fr = 0; fr < 9; fr++) {
              const ang = -Math.PI + (fr / 8) * Math.PI * 1.4 - 0.2;
              ctx.save();
              ctx.translate(px, palmTopY);
              ctx.rotate(ang);
              ctx.fillStyle = fr % 2 === 0 ? '#166534' : '#4d7c0f';
              ctx.beginPath();
              ctx.ellipse(24, 0, 26, 6.5, 0.14, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // Bancos de plaza de madera y hierro
          const benchX = secX - 24;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(benchX - 22, h - 82, 3, 12);
          ctx.fillRect(benchX + 19, h - 82, 3, 12);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(benchX - 24, h - 88, 48, 5);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(benchX - 24, h - 81, 48, 4);

          // Farolas urbanas altas con múltiples focos luminosos blancos
          const lampX = secX + 28;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(lampX - 2, h - 196, 4, 120);
          ctx.fillRect(lampX - 6, h - 88, 12, 12);
          ctx.fillRect(lampX - 11, h - 196, 22, 3);
          const globeOffsets = [
            { dx: -10, dy: -201 },
            { dx: 10, dy: -201 },
            { dx: -6, dy: -210 },
            { dx: 6, dy: -210 },
            { dx: 0, dy: -217 }
          ];
          for (let g = 0; g < globeOffsets.length; g++) {
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(lampX + globeOffsets[g].dx, h + globeOffsets[g].dy, 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef9c3';
            ctx.beginPath();
            ctx.arc(lampX + globeOffsets[g].dx, h + globeOffsets[g].dy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Estatua ecuestre sobre pedestal escalonado de piedra rosada
          if (Math.abs(secOff) === 1450) {
            const stX = secX - 60;
            ctx.fillStyle = '#d6b89e';
            ctx.fillRect(stX - 22, h - 82, 44, 10);
            ctx.fillStyle = '#b09d84';
            ctx.fillRect(stX - 15, h - 104, 30, 22);
            ctx.fillStyle = '#334155';
            ctx.fillRect(stX - 11, h - 122, 22, 12);
            ctx.fillRect(stX - 9, h - 112, 4, 8);
            ctx.fillRect(stX + 5, h - 112, 4, 8);
            ctx.fillRect(stX - 3, h - 134, 7, 13);
            ctx.beginPath();
            ctx.arc(stX + 1, h - 137, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 2. Palacio de La Moneda ÚNICO en el centro del nivel (casa moneda.jfif)
        if (monedaCenterX > -480 && monedaCenterX < w + 480) {
          // Edificios ministeriales laterales en perspectiva
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(monedaCenterX - 370, h - 228, 105, 136);
          ctx.fillRect(monedaCenterX + 265, h - 228, 105, 136);
          ctx.fillStyle = '#64748b';
          for (let my = 0; my < 4; my++) {
            for (let mx = 0; mx < 4; mx++) {
              ctx.fillRect(monedaCenterX - 356 + mx * 22, h - 210 + my * 26, 12, 16);
              ctx.fillRect(monedaCenterX + 276 + mx * 22, h - 210 + my * 26, 12, 16);
            }
          }

          // Cuerpo principal neoclasico blanco horizontal de dos plantas (520 px)
          const palW = 520;
          const palX = monedaCenterX - palW * 0.5;
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(palX, h - 196, palW, 104);
          // Zócalo inferior de piedra gris y cornisa horizontal intermedia
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(palX, h - 104, palW, 12);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(palX - 3, h - 148, palW + 6, 5);
          // Cornisa superior y balaustrada blanca a lo largo del techo
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(palX - 4, h - 198, palW + 8, 5);
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(palX, h - 210, palW, 12);
          ctx.fillStyle = '#94a3b8';
          for (let balX = palX + 8; balX < palX + palW - 6; balX += 14) {
            ctx.fillRect(balX, h - 208, 6, 8);
          }

          // Cuerpo superior central escalonado (ático) con frontón triangular y bandera chilena en la azotea
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(monedaCenterX - 76, h - 238, 152, 42);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(monedaCenterX - 79, h - 242, 158, 5);
          // Balaustrada superior del ático + frontón triangular
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.moveTo(monedaCenterX - 48, h - 238);
          ctx.lineTo(monedaCenterX, h - 258);
          ctx.lineTo(monedaCenterX + 48, h - 238);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Escudo/relieve en el tímpano y 3 ventanas en el cuerpo alto
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(monedaCenterX, h - 245, 5, 0, Math.PI * 2);
          ctx.fill();
          for (let aw = -1; aw <= 1; aw++) {
            const ax = monedaCenterX + aw * 36 - 7;
            ctx.fillStyle = '#475569';
            ctx.fillRect(ax, h - 228, 14, 20);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(ax + 2, h - 226, 10, 16);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(ax - 2, h - 210, 18, 4);
          }
          // Mástil central en la azotea del palacio con la Bandera de Chile
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(monedaCenterX - 1.5, h - 294, 3, 38);
          drawChileFlag(monedaCenterX + 1.5, h - 293, 28, 17, 0.2);

          // Pilastras verticales y 14 vanos simétricos de ventanas con balcones de hierro oscuro
          for (let bay = -7; bay <= 7; bay++) {
            if (Math.abs(bay) <= 1) continue;
            const bxBay = monedaCenterX + bay * 33;
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(bxBay - 14, h - 194, 4, 98);
            // Planta alta con balcón de hierro
            ctx.fillStyle = '#334155';
            ctx.fillRect(bxBay - 7, h - 186, 14, 28);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(bxBay - 5, h - 184, 10, 22);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(bxBay - 9, h - 160, 18, 5);
            // Planta baja con ventana enrejada
            ctx.fillStyle = '#334155';
            ctx.fillRect(bxBay - 7, h - 138, 14, 24);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(bxBay - 5, h - 136, 10, 20);
          }

          // Pórtico central arqueado con reja de hierro y vista al patio interior
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(monedaCenterX - 36, h - 194, 72, 102);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(monedaCenterX - 32, h - 192, 64, 100);
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(monedaCenterX, h - 122, 17, Math.PI, 0);
          ctx.lineTo(monedaCenterX + 17, h - 92);
          ctx.lineTo(monedaCenterX - 17, h - 92);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(monedaCenterX - 7, h - 118, 14, 26);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.4;
          for (let gx = -12; gx <= 12; gx += 4) {
            ctx.beginPath();
            ctx.moveTo(monedaCenterX + gx, h - 124);
            ctx.lineTo(monedaCenterX + gx, h - 92);
            ctx.stroke();
          }
          // Dos ventanas flanqueando la planta alta del pórtico central
          ctx.fillStyle = '#334155';
          ctx.fillRect(monedaCenterX - 6, h - 184, 12, 26);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(monedaCenterX - 8, h - 160, 16, 5);

          // 3. Plaza de la Ciudadanía frente a La Moneda: césped verde + senderos de piedra + fila de mástiles
          ctx.fillStyle = '#d6d3d1';
          ctx.fillRect(monedaCenterX - 360, h - 92, 720, 24);
          // Sendero central de piedra clara
          ctx.fillStyle = '#e7e5e4';
          ctx.fillRect(monedaCenterX - 88, h - 92, 176, 24);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(monedaCenterX - 92, h - 92, 4, 24);
          ctx.fillRect(monedaCenterX + 88, h - 92, 4, 24);
          // Parterres de césped verde simétricos a izquierda y derecha
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(monedaCenterX - 340, h - 88, 240, 16);
          ctx.fillRect(monedaCenterX + 100, h - 88, 240, 16);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(monedaCenterX - 340, h - 77, 240, 5);
          ctx.fillRect(monedaCenterX + 100, h - 77, 240, 5);
          // Escalinatas de piedra bajas
          ctx.fillStyle = '#a8a29e';
          ctx.fillRect(monedaCenterX - 245, h - 90, 62, 3);
          ctx.fillRect(monedaCenterX + 183, h - 90, 62, 3);

          // Fila de mástiles altos con banderas chilenas frente a La Moneda
          const flagPoles = [-265, -198, -118, 118, 198, 265];
          for (let fp = 0; fp < flagPoles.length; fp++) {
            const fpX = monedaCenterX + flagPoles[fp];
            const fpTop = Math.abs(flagPoles[fp]) < 150 ? h - 295 : h - 268;
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(fpX - 2, fpTop, 4, h - 76 - fpTop);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(fpX - 4, h - 84, 8, 8);
            drawChileFlag(fpX + 2, fpTop + 4, 34, 20, fp * 0.9);
          }
        }
      } else if (theme === 'ch_santiago_cristobal') {
        // Laderas verdes del Parque Metropolitano en fondo medio
        for (let hIdx = 0; hIdx < 4; hIdx++) {
          const hx = wrapItemX(pMid * 0.52, -160 + hIdx * 420, -210, 220, 1680);
          ctx.fillStyle = hIdx % 2 === 0 ? '#166534' : '#15803d';
          ctx.beginPath();
          ctx.moveTo(hx - 210, h - 60);
          ctx.quadraticCurveTo(hx, h - 245, hx + 220, h - 60);
          ctx.closePath();
          ctx.fill();
        }

        // Santuario Monumental de la Virgen del Cerro San Cristóbal (cumbre hacia 60% - 75% del nivel)
        const cristobalW = Number.isFinite(levelWidth) && levelWidth > w ? levelWidth : 6900;
        const cristobalMaxCam = Math.max(1, cristobalW - w);
        const cristobalProg = Math.max(0, Math.min(1, cameraX / cristobalMaxCam));
        const sx = w * 0.5 + (0.675 - cristobalProg) * cristobalMaxCam * 0.48;
        if (sx > -380 && sx < w + 380) {
          // Ladera verde principal del Cerro San Cristóbal + escalinatas ascendentes de piedra
          const hillGrad = ctx.createLinearGradient(sx, h - 255, sx, h - 60);
          hillGrad.addColorStop(0, '#4d7c0f');
          hillGrad.addColorStop(0.55, '#15803d');
          hillGrad.addColorStop(1, '#14532d');
          ctx.fillStyle = hillGrad;
          ctx.beginPath();
          ctx.moveTo(sx - 300, h - 60);
          ctx.quadraticCurveTo(sx - 135, h - 228, sx - 65, h - 232);
          ctx.lineTo(sx + 65, h - 232);
          ctx.quadraticCurveTo(sx + 150, h - 226, sx + 305, h - 60);
          ctx.closePath();
          ctx.fill();

          // Vegetación frondosa en la ladera (copas cálidas y verdes oscuros)
          const foliage = [
            { dx: -158, dy: h - 188, r: 46, c: '#3f6212' },
            { dx: -112, dy: h - 208, r: 40, c: '#65a30d' },
            { dx: -76, dy: h - 182, r: 36, c: '#4d7c0f' },
            { dx: 112, dy: h - 206, r: 42, c: '#84cc16' },
            { dx: 158, dy: h - 178, r: 48, c: '#65a30d' },
            { dx: -188, dy: h - 138, r: 52, c: '#166534' },
            { dx: 196, dy: h - 134, r: 54, c: '#4d7c0f' }
          ];
          for (let f = 0; f < foliage.length; f++) {
            const fl = foliage[f];
            ctx.fillStyle = fl.c;
            ctx.beginPath();
            ctx.arc(sx + fl.dx, fl.dy, fl.r, 0, Math.PI * 2);
            ctx.fill();
          }

          // Terrazas escalonadas de mampostería de piedra + jardineras verdes y flores amarillas
          const drawStoneTerrace = (tx, ty, tw, th, rowH) => {
            ctx.fillStyle = '#78716c';
            ctx.fillRect(tx, ty, tw, th);
            // Aparejo de bloques de piedra natural en mampostería
            for (let row = 0; row * rowH < th; row++) {
              const ry = ty + row * rowH;
              const offset = (row % 2) * 10;
              for (let bx = tx + offset; bx < tx + tw - 8; bx += 22) {
                ctx.fillStyle = ((bx + row) % 3 === 0) ? '#a8a29e' : '#57534e';
                ctx.fillRect(bx + 1, ry + 1, Math.min(19, tx + tw - bx - 2), rowH - 2);
              }
            }
            ctx.fillStyle = '#d6d3d1';
            ctx.fillRect(tx - 2, ty - 3, tw + 4, 4);
            // Jardineras verdes y flores amarillas sobre la terraza
            for (let gx = tx + 10; gx < tx + tw - 12; gx += 18) {
              ctx.fillStyle = (gx % 36 < 18) ? '#15803d' : '#166534';
              ctx.beginPath();
              ctx.arc(gx, ty - 6, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#4d7c0f';
              ctx.beginPath();
              ctx.arc(gx + 5, ty - 9, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#facc15';
              ctx.fillRect(gx - 3, ty - 11, 3, 3);
              ctx.fillStyle = '#fde047';
              ctx.fillRect(gx + 4, ty - 13, 3, 3);
            }
          };
          drawStoneTerrace(sx - 185, h - 122, 370, 54, 11);
          drawStoneTerrace(sx - 148, h - 166, 296, 44, 10);
          drawStoneTerrace(sx - 120, h - 208, 240, 42, 10);

          // Carteles naranjas de madera con el texto "SILENCIO" sobre los muretes de las terrazas
          const drawSilenceSign = (signX, signY) => {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(signX - 1.5, signY + 9, 3, 10);
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(signX - 24, signY, 48, 12);
            ctx.strokeStyle = '#fed7aa';
            ctx.lineWidth = 1;
            ctx.strokeRect(signX - 24, signY, 48, 12);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SILENCIO', signX, signY + 8.5);
          };
          drawSilenceSign(sx - 78, h - 184);
          drawSilenceSign(sx + 92, h - 140);

          // Escalinatas de piedra ascendentes en la ladera hacia el mirador (escalinata central de piedra)
          ctx.fillStyle = '#57534e';
          ctx.beginPath();
          ctx.moveTo(sx - 18, h - 222);
          ctx.lineTo(sx + 38, h - 222);
          ctx.lineTo(sx + 74, h - 64);
          ctx.lineTo(sx - 36, h - 64);
          ctx.closePath();
          ctx.fill();
          // Muretes laterales de la escalinata central
          ctx.strokeStyle = '#d6d3d1';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sx - 18, h - 222);
          ctx.lineTo(sx - 36, h - 64);
          ctx.moveTo(sx + 38, h - 222);
          ctx.lineTo(sx + 74, h - 64);
          ctx.stroke();
          for (let st = 0; st < 16; st++) {
            const tSt = st / 15;
            const sy = h - 216 + tSt * 144;
            const sw = 54 + tSt * 52;
            const stepX = sx - 17 - tSt * 18;
            ctx.fillStyle = st % 2 === 0 ? '#d6d3d1' : '#a8a29e';
            ctx.fillRect(stepX, sy, sw, 6);
            ctx.fillStyle = '#44403c';
            ctx.fillRect(stepX, sy + 6, sw, 3);
          }

          // Farolas de parque y postes de iluminación del santuario
          const drawLightPole = (px, topY, botY, dir) => {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(px, botY);
            ctx.lineTo(px, topY);
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px + (dir >= 0 ? -2 : -10), topY - 4, 12, 6);
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(px + (dir >= 0 ? 4 : -4), topY - 4, 3.8, 0, Math.PI * 2);
            ctx.fill();
          };
          drawLightPole(sx - 102, h - 332, h - 222, 1);
          drawLightPole(sx + 96, h - 294, h - 214, -1);
          drawLightPole(sx - 140, h - 235, h - 166, 1);
          drawLightPole(sx + 132, h - 212, h - 144, -1);

          // Palmeras altas y cipreses flanqueando la estatua blanca sobre cielo azul limpio
          const drawSanCrisPalm = (palmX, palmBaseY, palmTopY) => {
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.moveTo(palmX - 6.5, palmBaseY);
            ctx.lineTo(palmX - 4.5, palmTopY);
            ctx.lineTo(palmX + 4.5, palmTopY);
            ctx.lineTo(palmX + 7.5, palmBaseY);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#92400e';
            ctx.fillRect(palmX - 5.5, palmTopY + 6, 11, 24);
            for (let fr = 0; fr < 9; fr++) {
              const ang = -Math.PI + (fr / 8) * Math.PI * 1.35 - 0.18;
              ctx.save();
              ctx.translate(palmX, palmTopY);
              ctx.rotate(ang);
              ctx.fillStyle = fr % 2 === 0 ? '#15803d' : '#4d7c0f';
              ctx.beginPath();
              ctx.ellipse(25, 0, 27, 6.5, 0.12, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          };
          const drawCypress = (cxp, cBaseY, cHeight, cWidth) => {
            ctx.fillStyle = '#064e3b';
            ctx.beginPath();
            ctx.moveTo(cxp, cBaseY - cHeight);
            ctx.quadraticCurveTo(cxp - cWidth, cBaseY - cHeight * 0.35, cxp - cWidth * 0.72, cBaseY);
            ctx.lineTo(cxp + cWidth * 0.72, cBaseY);
            ctx.quadraticCurveTo(cxp + cWidth, cBaseY - cHeight * 0.35, cxp, cBaseY - cHeight);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.moveTo(cxp - 1, cBaseY - cHeight + 6);
            ctx.quadraticCurveTo(cxp - cWidth * 0.5, cBaseY - cHeight * 0.4, cxp - cWidth * 0.35, cBaseY);
            ctx.lineTo(cxp + cWidth * 0.1, cBaseY);
            ctx.closePath();
            ctx.fill();
          };
          drawCypress(sx - 168, h - 164, 146, 22);
          drawCypress(sx - 82, h - 220, 112, 17);
          drawCypress(sx + 84, h - 216, 118, 18);
          drawCypress(sx + 158, h - 164, 152, 23);
          drawSanCrisPalm(sx - 134, h - 178, h - 352);
          drawSanCrisPalm(sx + 128, h - 172, h - 336);

          // Muro base de piedra + terraza mirador + baranda metálica negra
          ctx.fillStyle = '#78716c';
          ctx.fillRect(sx - 106, h - 226, 212, 18);
          ctx.fillStyle = '#d6d3d1';
          ctx.fillRect(sx - 108, h - 230, 216, 5);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx - 104, h - 243);
          ctx.lineTo(sx + 104, h - 243);
          ctx.moveTo(sx - 104, h - 236);
          ctx.lineTo(sx + 104, h - 236);
          for (let bx = -104; bx <= 104; bx += 13) {
            ctx.moveTo(sx + bx, h - 243);
            ctx.lineTo(sx + bx, h - 229);
          }
          ctx.stroke();

          // Capilla Base / Pedestal cilíndrico-cónico blanco con cornisa superior y puerta de madera
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(sx - 34, h - 230);
          ctx.lineTo(sx - 27, h - 294);
          ctx.lineTo(sx + 27, h - 294);
          ctx.lineTo(sx + 34, h - 230);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(sx - 22, h - 230);
          ctx.lineTo(sx - 18, h - 294);
          ctx.lineTo(sx + 12, h - 294);
          ctx.lineTo(sx + 15, h - 230);
          ctx.closePath();
          ctx.fill();
          // Arco y puerta de madera de la Capilla
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(sx, h - 252, 13, Math.PI, 0);
          ctx.lineTo(sx + 13, h - 230);
          ctx.lineTo(sx - 13, h - 230);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#451a03';
          ctx.fillRect(sx - 9, h - 252, 18, 22);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx - 7, h - 250, 6, 20);
          ctx.fillRect(sx + 1, h - 250, 6, 20);
          // Cornisa superior moldeada y cúpula base
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(sx - 31, h - 297, 62, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx - 33, h - 302, 66, 5);
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.ellipse(sx, h - 303, 25, 11, 0, Math.PI, 0);
          ctx.fill();

          // Estatua Monumental de la Virgen de la Inmaculada Concepción (brazos extendidos + túnica drapeada)
          // Base/nube al pie de la estatua
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.ellipse(sx, h - 312, 19, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          // Brazos abiertos extendidos hacia los costados y manto drapeado
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.moveTo(sx - 14, h - 313);
          ctx.quadraticCurveTo(sx - 22, h - 344, sx - 32, h - 378);
          ctx.lineTo(sx - 40, h - 384);
          ctx.lineTo(sx - 25, h - 386);
          ctx.quadraticCurveTo(sx - 12, h - 392, sx, h - 394);
          ctx.quadraticCurveTo(sx + 12, h - 392, sx + 25, h - 384);
          ctx.lineTo(sx + 38, h - 379);
          ctx.lineTo(sx + 31, h - 373);
          ctx.quadraticCurveTo(sx + 21, h - 344, sx + 14, h - 313);
          ctx.closePath();
          ctx.fill();
          // Túnica central iluminada y pliegues verticales escultóricos
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(sx - 11, h - 313);
          ctx.lineTo(sx - 8, h - 392);
          ctx.lineTo(sx + 8, h - 392);
          ctx.lineTo(sx + 11, h - 313);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sx - 4, h - 385);
          ctx.lineTo(sx - 6, h - 315);
          ctx.moveTo(sx + 1, h - 386);
          ctx.lineTo(sx + 2, h - 315);
          ctx.moveTo(sx + 6, h - 384);
          ctx.lineTo(sx + 8, h - 316);
          ctx.stroke();
          // Cabeza con velo blanco y mirada al frente
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(sx, h - 403, 7.5, 9.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.ellipse(sx, h - 402, 4.2, 5.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Teleférico del San Cristóbal: cables superior/inferior + cabinas roja y azul animadas
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 178);
        ctx.lineTo(w, 122);
        ctx.moveTo(0, 206);
        ctx.lineTo(w, 150);
        ctx.stroke();
        const cabRedX = wrapItemX(time * 52 - cameraX * 0.25, 80, -18, 18);
        const cabRedY = 178 - (cabRedX / w) * 56;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cabRedX, cabRedY);
        ctx.lineTo(cabRedX, cabRedY + 7);
        ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(cabRedX - 16, cabRedY + 6, 32, 22);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cabRedX - 14, cabRedY + 6, 28, 3);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(cabRedX - 12, cabRedY + 11, 24, 9);

        const cabBlueX = wrapItemX(-time * 46 - cameraX * 0.25, 560, -18, 18);
        const cabBlueY = 206 - (cabBlueX / w) * 56;
        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(cabBlueX, cabBlueY);
        ctx.lineTo(cabBlueX, cabBlueY + 7);
        ctx.stroke();
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(cabBlueX - 16, cabBlueY + 6, 32, 22);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cabBlueX - 14, cabBlueY + 6, 28, 3);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(cabBlueX - 12, cabBlueY + 11, 24, 9);
      } else if (theme === 'ch_santiago_lastarria') {
        const cols = ['#e11d48', '#2563eb', '#eab308', '#0d9488', '#ea580c'];
        for (let i = 0; i < 7; i++) {
          const lx = wrapItemX(pMid, -180 + i * 210, 0, 132, 1470);
          ctx.fillStyle = cols[i % cols.length];
          ctx.fillRect(lx, h - 216, 132, 150);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(lx + 18, h - 184, 30, 36);
          ctx.fillRect(lx + 82, h - 184, 30, 36);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(lx + 22, h - 180, 22, 28);
          ctx.fillRect(lx + 86, h - 180, 22, 28);
        }
      } else if (theme === 'ch_santiago_costanera') {
        const costLevelW = Number.isFinite(levelWidth) && levelWidth > w ? levelWidth : 7600;
        const costMaxCam = Math.max(1, costLevelW - w);
        const costProg = Math.max(0, Math.min(1, cameraX / costMaxCam));

        // 1. Tejido urbano iluminado en el plano medio + edificios modernos acristalados (Sanhattan / Providencia)
        const cityScroll = -(cameraX * 0.22);
        const skylineBlocks = [
          { x: 30, bw: 58, bh: 132, c: '#0f172a', type: 'glass' },
          { x: 105, bw: 56, bh: 184, c: '#1e293b', type: 'pyramid' },
          { x: 175, bw: 74, bh: 122, c: '#0f172a', type: 'glass' },
          { x: 262, bw: 52, bh: 162, c: '#334155', type: 'glass' },
          { x: 325, bw: 96, bh: 118, c: '#475569', type: 'modern_white' },
          { x: 438, bw: 62, bh: 146, c: '#1e293b', type: 'glass' },
          { x: 520, bw: 54, bh: 158, c: '#334155', type: 'glass' },
          { x: 690, bw: 64, bh: 136, c: '#1e293b', type: 'glass' },
          { x: 770, bw: 84, bh: 120, c: '#334155', type: 'modern_white' },
          { x: 870, bw: 58, bh: 168, c: '#0f172a', type: 'glass' }
        ];
        for (let b = 0; b < skylineBlocks.length; b++) {
          const blk = skylineBlocks[b];
          const bx = wrapItemX(cityScroll, blk.x, 0, blk.bw, 1020);
          const by = h - 70 - blk.bh;
          if (blk.type === 'pyramid') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(bx, by + 26, blk.bw, blk.bh - 26);
            ctx.beginPath();
            ctx.moveTo(bx, by + 26);
            ctx.lineTo(bx + blk.bw * 0.48, by);
            ctx.lineTo(bx + blk.bw, by + 26);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(bx + blk.bw * 0.45, by + 3, 4, 24);
          } else if (blk.type === 'modern_white') {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(bx, by, blk.bw, blk.bh);
            ctx.fillStyle = '#1e293b';
            for (let row = 8; row < blk.bh - 16; row += 12) {
              ctx.fillRect(bx + 6, by + row, blk.bw - 12, 6);
            }
          } else {
            ctx.fillStyle = blk.c;
            ctx.fillRect(bx, by, blk.bw, blk.bh);
            ctx.fillStyle = 'rgba(253, 224, 71, 0.32)';
            for (let wy = by + 10; wy < h - 88; wy += 12) {
              for (let wx = bx + 6; wx < bx + blk.bw - 8; wx += 10) {
                if ((wx + wy) % 3 === 0) ctx.fillRect(wx, wy, 5, 6);
              }
            }
          }
        }

        // Bandas urbanas oscuras inferiores y luces cálidas de avenidas (costanera center.jfif)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, h - 108, w, 40);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.fillRect(0, h - 92, w, 2.5);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.fillRect(0, h - 82, w, 2);
        for (let al = 0; al < 36; al++) {
          const lx = wrapItemX(cityScroll * 1.4, al * 44, -6, 6, 1584);
          ctx.fillStyle = al % 4 === 0 ? '#ef4444' : (al % 2 === 0 ? '#fef08a' : '#fbbf24');
          ctx.fillRect(lx, h - 94 + (al % 3) * 7, 5, 2.5);
        }

        // 2. Hito Principal: Gran Torre Santiago (Costanera Center) con silueta obelisco-ahusada, reflejos de atardecer y coronación azul eléctrica
        const towerCenterX = w * 0.65 + (0.45 - costProg) * 280;
        const towerBaseY = h - 70;
        const towerTopY = h - 462;
        const baseHalfW = 48;
        const topHalfW = 26;

        // Resplandor sutil azul eléctrico en la coronación
        const crownGlow = ctx.createRadialGradient(towerCenterX, towerTopY + 18, 4, towerCenterX, towerTopY + 18, 72);
        crownGlow.addColorStop(0, 'rgba(59, 130, 246, 0.34)');
        crownGlow.addColorStop(0.55, 'rgba(37, 99, 235, 0.14)');
        crownGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = crownGlow;
        ctx.beginPath();
        ctx.arc(towerCenterX, towerTopY + 18, 72, 0, Math.PI * 2);
        ctx.fill();

        // Silueta obelisco-ahusada principal en vidrio azul pizarra oscuro
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(towerCenterX - baseHalfW, towerBaseY);
        ctx.lineTo(towerCenterX - topHalfW, towerTopY + 12);
        ctx.lineTo(towerCenterX - topHalfW * 0.88, towerTopY);
        ctx.lineTo(towerCenterX + topHalfW * 0.88, towerTopY);
        ctx.lineTo(towerCenterX + topHalfW, towerTopY + 12);
        ctx.lineTo(towerCenterX + baseHalfW, towerBaseY);
        ctx.closePath();
        ctx.fill();

        // Faceta izquierda en cristal azul medio
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(towerCenterX - baseHalfW + 3, towerBaseY);
        ctx.lineTo(towerCenterX - topHalfW + 2, towerTopY + 14);
        ctx.lineTo(towerCenterX - 6, towerTopY + 14);
        ctx.lineTo(towerCenterX - 10, towerBaseY);
        ctx.closePath();
        ctx.fill();

        // Reflejos naranjas/dorados del atardecer en la faceta acristalada vertical central-izquierda
        const sunsetGlass = ctx.createLinearGradient(0, towerTopY + 28, 0, towerBaseY - 90);
        sunsetGlass.addColorStop(0, '#fed7aa');
        sunsetGlass.addColorStop(0.28, '#fb923c');
        sunsetGlass.addColorStop(0.62, '#f97316');
        sunsetGlass.addColorStop(0.86, '#9a3412');
        sunsetGlass.addColorStop(1, '#1e293b');
        ctx.fillStyle = sunsetGlass;
        ctx.beginPath();
        ctx.moveTo(towerCenterX - 24, towerBaseY - 60);
        ctx.lineTo(towerCenterX - 16, towerTopY + 26);
        ctx.lineTo(towerCenterX - 2, towerTopY + 26);
        ctx.lineTo(towerCenterX - 3, towerBaseY - 60);
        ctx.closePath();
        ctx.fill();

        // Faceta derecha con nervadura azul acero y borde iluminado
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(towerCenterX + 4, towerBaseY);
        ctx.lineTo(towerCenterX + 3, towerTopY + 14);
        ctx.lineTo(towerCenterX + topHalfW - 2, towerTopY + 14);
        ctx.lineTo(towerCenterX + baseHalfW - 3, towerBaseY);
        ctx.closePath();
        ctx.fill();

        // Retícula horizontal de pisos acristalados y oficinas encendidas
        for (let floorY = towerTopY + 34; floorY < towerBaseY - 56; floorY += 9) {
          const tFloor = (floorY - towerTopY) / (towerBaseY - towerTopY);
          const halfSpan = topHalfW + (baseHalfW - topHalfW) * tFloor - 3;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
          ctx.fillRect(towerCenterX - halfSpan, floorY, halfSpan * 2, 1.5);
          if (floorY > towerBaseY - 190 || floorY < towerTopY + 95) {
            ctx.fillStyle = (floorY % 18 === 0) ? 'rgba(254, 240, 138, 0.65)' : 'rgba(186, 230, 253, 0.45)';
            ctx.fillRect(towerCenterX + 6, floorY - 5, Math.max(8, halfSpan - 12), 3);
          }
        }

        // Coronación superior iluminada en azul eléctrico vibrante (#2563eb / #3b82f6 / #60a5fa)
        const crownGrad = ctx.createLinearGradient(0, towerTopY, 0, towerTopY + 38);
        crownGrad.addColorStop(0, '#93c5fd');
        crownGrad.addColorStop(0.45, '#3b82f6');
        crownGrad.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = crownGrad;
        ctx.beginPath();
        ctx.moveTo(towerCenterX - topHalfW + 3, towerTopY + 34);
        ctx.lineTo(towerCenterX - topHalfW * 0.85, towerTopY + 2);
        ctx.lineTo(towerCenterX + topHalfW * 0.85, towerTopY + 2);
        ctx.lineTo(towerCenterX + topHalfW - 3, towerTopY + 34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(towerCenterX - 3, towerTopY + 2, 5, 34);
        ctx.fillRect(towerCenterX - 15, towerTopY + 5, 2, 28);
        ctx.fillRect(towerCenterX + 13, towerTopY + 5, 2, 28);

        // Complejo comercial iluminado en la base de Costanera Center (Mall Costanera)
        const mallW = 164;
        const mallX = towerCenterX - 72;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(mallX, h - 118, mallW, 48);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(mallX + 74, h - 114, 86, 44);
        // Vitrinas, logos y pisos iluminados del centro comercial
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(mallX + 8, h - 108, 56, 30);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(mallX + 78, h - 98, 78, 8);
        ctx.fillRect(mallX + 78, h - 84, 78, 8);
        ctx.fillStyle = '#fde047';
        for (let mc = 0; mc < 3; mc++) {
          ctx.beginPath();
          ctx.arc(mallX + 38 + mc * 11, h - 112, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mallX + 34, h - 108, 3, 38);

      // ========================================================================
      // B. VIÑA DEL MAR & VALPARAÍSO (Fiel a las fotos de Reloj, Palacio Vergara y Puerto)
      // ========================================================================
      } else if (isVina) {
        if (theme === 'ch_vina_reloj') {
          // 1. Parque arbolado oscuro de fondo (tal como en foto de referencia Reloj de Flores)
          ctx.fillStyle = '#14532d';
          ctx.fillRect(0, 72, w, 175);
          for (let t = 0; t < 16; t++) {
            const fx = wrapItemX(pMid * 0.4, -90 + t * 90, -64, 64, 1440);
            ctx.fillStyle = t % 2 === 0 ? '#166534' : '#052e16';
            ctx.beginPath();
            ctx.arc(fx, 145 + (t % 3) * 16, 44 + (t % 3) * 10, 0, Math.PI * 2);
            ctx.fill();
          }
          // Franja azul del Pacífico al costado oeste
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(0, h - 140, w, 78);

          // 2. Reloj de Flores ÚNICO (sin bucle %) con desplazamiento progresivo lento derecha -> izquierda
          const vinaW = Number.isFinite(levelWidth) && levelWidth > w ? levelWidth : 6600;
          const progress = Math.max(0, Math.min(1, cameraX / Math.max(1, vinaW - w)));
          const rx = w * 0.72 + (w * 0.10 - w * 0.72) * progress;
          // Talud verde brillante
          ctx.fillStyle = '#65a30d';
          ctx.beginPath();
          ctx.moveTo(rx - 285, h - 65);
          ctx.lineTo(rx - 220, 185);
          ctx.lineTo(rx + 220, 185);
          ctx.lineTo(rx + 285, h - 65);
          ctx.closePath();
          ctx.fill();

          // Cartel superior en flores rojas con borde dorado y letras amarillas "VIÑA DEL MAR"
          ctx.fillStyle = '#eab308';
          ctx.fillRect(rx - 155, 198, 310, 28);
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(rx - 150, 203, 300, 19);
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('VIÑA DEL MAR', rx, 217);

          // Anillo empedrado exterior + esfera floral roja del Reloj
          ctx.fillStyle = '#e7e5e4';
          ctx.beginPath();
          ctx.ellipse(rx, 294, 134, 62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#9f1239';
          ctx.beginPath();
          ctx.ellipse(rx, 294, 124, 55, 0, 0, Math.PI * 2);
          ctx.fill();
          // Núcleo verde/dorado interno
          ctx.fillStyle = '#4d7c0f';
          ctx.beginPath();
          ctx.ellipse(rx, 294, 62, 27, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#be123c';
          ctx.beginPath();
          ctx.ellipse(rx, 294, 48, 20, 0, 0, Math.PI * 2);
          ctx.fill();

          // 12 Números horarios amarillos florales
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 10px "Segoe UI", sans-serif';
          for (let num = 1; num <= 12; num++) {
            const ang = (num / 12) * Math.PI * 2 - Math.PI * 0.5;
            const nx = rx + Math.cos(ang) * 94;
            const ny = 297 + Math.sin(ang) * 41;
            ctx.fillText(String(num), nx, ny);
          }

          // Manecillas blancas largas giratorias
          ctx.strokeStyle = '#ffffff';
          ctx.lineCap = 'round';
          const minA = time * 0.55;
          const hrA = time * 0.09 + 0.8;
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(rx, 294);
          ctx.lineTo(rx + Math.cos(minA) * 98, 294 + Math.sin(minA) * 42);
          ctx.stroke();
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(rx, 294);
          ctx.lineTo(rx + Math.cos(hrA) * 66, 294 + Math.sin(hrA) * 29);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(rx, 294, 5, 0, Math.PI * 2);
          ctx.fill();

          // Cartel inferior ancho en flores rojas + letras amarillas "VIÑA DEL MAR"
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.roundRect(rx - 220, 366, 440, 34, 8);
          ctx.fill();
          ctx.fillStyle = '#881337';
          ctx.beginPath();
          ctx.roundRect(rx - 214, 371, 428, 24, 6);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 17px "Segoe UI", sans-serif';
          ctx.fillText('VIÑA DEL MAR', rx, 389);

          // Arbusto esférico a la izquierda y palmera a la derecha (como en la foto)
          ctx.fillStyle = '#3f6212';
          ctx.beginPath();
          ctx.arc(rx - 235, 342, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#78350f';
          ctx.fillRect(rx + 225, 165, 14, 150);
          ctx.fillStyle = '#15803d';
          for (let fr = 0; fr < 5; fr++) {
            ctx.beginPath();
            ctx.ellipse(rx + 232, 164, 52, 12, (fr - 2) * 0.42, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (theme === 'ch_vina_quinta') {
          // Fiel a Foto 2: Palacio Vergara neogótico veneciano rosado-crema + explanada y estatua de bronce
          const px = wrapItemX(pMid, 60, -116, 686, 2040);
          // Árboles del parque Quinta Vergara detrás y a los costados
          ctx.fillStyle = '#166534';
          for (let t = 0; t < 7; t++) {
            ctx.beginPath();
            ctx.arc(px - 60 + t * 115, 225 + (t % 2) * 18, 56, 0, Math.PI * 2);
            ctx.fill();
          }
          // Explanada clara de pavimento
          ctx.fillStyle = '#e7e5e4';
          ctx.fillRect(0, h - 138, w, 82);

          // Ala izquierda más baja del Palacio
          ctx.fillStyle = '#fce7f3';
          ctx.fillRect(px + 20, 220, 175, 195);
          ctx.fillStyle = '#fbcfe8';
          ctx.fillRect(px + 20, 214, 175, 10);
          for (let wIdx = 0; wIdx < 4; wIdx++) {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(px + 42 + wIdx * 36, 250, 20, 38, [10, 10, 0, 0]);
            ctx.fill();
          }

          // Cuerpo principal Palacio Vergara (rosado-marfil veneciano con crestería calada y arcos ojivales)
          const pw = 370;
          const pLeft = px + 195;
          ctx.fillStyle = '#fdf2f8';
          ctx.fillRect(pLeft, 152, pw, 264);
          ctx.strokeStyle = '#f5d0fe';
          ctx.lineWidth = 2;
          ctx.strokeRect(pLeft, 152, pw, 264);

          // Crestería calada gótica en la cornisa superior
          ctx.fillStyle = '#ffffff';
          for (let cx = pLeft + 6; cx < pLeft + pw - 8; cx += 16) {
            ctx.beginPath();
            ctx.moveTo(cx, 152);
            ctx.lineTo(cx + 8, 134);
            ctx.lineTo(cx + 16, 152);
            ctx.closePath();
            ctx.fill();
          }

          // Piso superior: ventanales venecianos tríforos / bíforos con parteluces blancos
          for (let a = 0; a < 7; a++) {
            const wx = pLeft + 22 + a * 48;
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(wx, 185, 32, 62, [16, 16, 0, 0]);
            ctx.fill();
            ctx.fillStyle = '#fdf2f8';
            ctx.fillRect(wx + 15, 185, 3, 62);
          }

          // Balaustrada blanca de entrepiso
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pLeft, 266, pw, 8);
          ctx.fillStyle = '#cbd5e1';
          for (let bx = pLeft + 8; bx < pLeft + pw - 8; bx += 14) {
            ctx.fillRect(bx, 256, 5, 10);
          }

          // Piso inferior: columnata de arcos ojivales oscuros profundos con columnas claras esbeltas
          for (let a = 0; a < 7; a++) {
            const ax = pLeft + 18 + a * 49;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(ax, 290, 36, 98, [18, 18, 0, 0]);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ax - 7, 290, 7, 100);
          }
          // Zócalo del palacio
          ctx.fillStyle = '#e7e5e4';
          ctx.fillRect(pLeft, 388, pw, 28);

          // Pedestal rectangular + estatua de bronce oscuro + bancas de parque en primer plano (izq)
          const stX = px - 28;
          ctx.fillStyle = '#a8a29e';
          ctx.fillRect(stX, 342, 46, 74);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(stX - 4, 336, 54, 8);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(stX + 16, 286, 14, 50);
          ctx.beginPath();
          ctx.arc(stX + 24, 278, 8, 0, Math.PI * 2);
          ctx.fill();
          // Banca oscura clásica
          ctx.fillStyle = '#292524';
          ctx.fillRect(stX - 38, 378, 34, 24);
          ctx.fillRect(stX + 48, 378, 34, 24);
        } else if (theme === 'ch_vina_ascensores') {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(0, h - 140, w, 75);
          // Cerros multicolores de Valparaíso en anfiteatro + funiculares inclinados
          const colors = ['#facc15', '#38bdf8', '#fb7185', '#a855f7', '#4ade80', '#fb923c'];
          for (let i = 0; i < 10; i++) {
            const vx = wrapItemX(pMid, -150 + i * 145, -4, 122, 1450);
            const hh = 105 + (i % 3) * 44;
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(vx, h - 75 - hh, 118, hh);
            ctx.fillStyle = '#334155';
            ctx.fillRect(vx - 4, h - 83 - hh, 126, 8);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(vx + 20, h - 55 - hh + 24, 22, 24);
            ctx.fillRect(vx + 70, h - 55 - hh + 24, 22, 24);
          }
          // Vías inclinadas y ascensor animado
          const ascX = wrapItemX(pMid * 0.7, 320, -80, 110, 1450);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ascX - 80, h - 68);
          ctx.lineTo(ascX + 110, 145);
          ctx.stroke();
          const tFrac = 0.5 + 0.42 * Math.sin(time * 0.9);
          const carX = ascX - 80 + tFrac * 190;
          const carY = (h - 68) - tFrac * (h - 213);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(carX - 18, carY - 22, 36, 26);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(carX - 12, carY - 17, 24, 11);
        } else {
          // ch_vina_puerto (Fiel a Foto 3): Bahía nocturna iluminada, océano, buques y grúas azules con contenedores
          // 1. Cerros de la bahía en silueta oscura + cientos de luces urbanas doradas
          const hillOffset = -(cameraX * 0.14);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(0, 260);
          for (let hx = 0; hx <= w + 60; hx += 60) {
            const hy = 212 + Math.sin((hx - hillOffset) * 0.012) * 26;
            ctx.lineTo(hx, hy);
          }
          ctx.lineTo(w, 330);
          ctx.lineTo(0, 330);
          ctx.closePath();
          ctx.fill();
          for (let l = 0; l < 90; l++) {
            const lx = ((l * 137 - cameraX * 0.14) % w + w) % w;
            const ly = 232 + ((l * 29) % 48);
            ctx.fillStyle = l % 4 === 0 ? '#fef08a' : (l % 3 === 0 ? '#38bdf8' : '#fbbf24');
            ctx.fillRect(lx, ly, 2.5, 2.5);
          }

          // 2. Océano Pacífico vibrante con reflejo del atardecer y estelas dinámicas del barco en marcha
          const seaGrad = ctx.createLinearGradient(0, 280, 0, h);
          seaGrad.addColorStop(0, '#475569');
          seaGrad.addColorStop(0.35, '#1e3a8a');
          seaGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = seaGrad;
          ctx.fillRect(0, 280, w, h - 280);
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.36)';
          ctx.lineWidth = 2;
          for (let wv = 0; wv < 14; wv++) {
            const wx = wrapItemX(-time * 115 - cameraX * 0.5, -90 + wv * 165, 0, 55, 2310);
            const wy = 296 + (wv % 5) * 32;
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(wx + 55, wy);
            ctx.stroke();
          }

          // 3. Buques mercantes anclados en la bahía + Grúas pórtico azules y contenedores multicolores
          for (let s = 0; s < 3; s++) {
            const bx = wrapItemX(pMid * 0.55, -150 + s * 480, 0, 130, 1440);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(bx, 272, 130, 14);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(bx + 18, 258, 30, 14);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(bx + 52, 260, 28, 12);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(bx + 88, 250, 24, 22);
          }
          for (let g = 0; g < 4; g++) {
            const gx = wrapItemX(pMid, -160 + g * 380, -28, 236, 1520);
            // Grúa Pórtico azul marino de Valparaíso
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(gx + 16, 150, 14, 210);
            ctx.fillRect(gx + 82, 150, 14, 210);
            ctx.fillRect(gx - 28, 150, 162, 14);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(gx + 23, 150);
            ctx.lineTo(gx + 54, 118);
            ctx.lineTo(gx + 89, 150);
            ctx.stroke();
            // Pila de contenedores iluminados rojo/azul/amarillo en el muelle
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(gx + 120, 315, 58, 26);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(gx + 124, 289, 52, 26);
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(gx + 182, 315, 54, 26);
          }
        }

      // ========================================================================
      // C. ATACAMA (Géiseres del Tatio, Salar/Chaxa, Valle de la Luna, ALMA)
      // ========================================================================
      } else if (theme === 'ch_atacama_tatio') {
        // Suelo geotermal oscuro del altiplano de El Tatio (4.300m al amanecer)
        const horizonY = h - 155;
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        groundGrad.addColorStop(0, '#3f3b38');
        groundGrad.addColorStop(0.42, '#292524');
        groundGrad.addColorStop(1, '#141210');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        // Vetas minerales ceniza y pequeñas rocas volcánicas dispersas en el suelo oscuro
        const pGroundTatio = -(cameraX * 0.36);
        const rockPeriod = 1200;
        const rockStart = ((pGroundTatio % rockPeriod) + rockPeriod) % rockPeriod - rockPeriod;
        for (let gx0 = rockStart; gx0 < w + rockPeriod; gx0 += rockPeriod) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
          ctx.beginPath();
          ctx.ellipse(gx0 + 320, h - 120, 140, 9, 0, 0, Math.PI * 2);
          ctx.ellipse(gx0 + 880, h - 98, 175, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          for (let r = 0; r < 14; r++) {
            const rx = gx0 + 35 + r * 84;
            const ry = h - 142 + ((r * 37) % 66);
            ctx.fillStyle = r % 3 === 0 ? '#57534e' : (r % 2 === 0 ? '#44403c' : '#292524');
            ctx.beginPath();
            ctx.ellipse(rx, ry, 7 + (r % 5), 4 + (r % 3), (r % 3) * 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Helper de cráter cercado con muro semicircular de piedra gris rústica + gran columna de vapor
        const drawTatioGeyserCrater = (cx, cy, s, seed, steamH) => {
          // Costra geotermal clara y poza termal humeante detrás del muro
          ctx.fillStyle = '#9ca3af';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 2 * s, 52 * s, 13 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0c4a6e';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 38 * s, 9.5 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(254, 240, 138, 0.36)';
          ctx.beginPath();
          ctx.ellipse(cx - 4 * s, cy - 1 * s, 20 * s, 4.5 * s, 0, 0, Math.PI * 2);
          ctx.fill();

          // Gran columna densa de vapor blanco erupcionando y dispersándose con el viento horizontalmente
          ctx.save();
          const pulse = 1 + Math.sin(time * 2.2 + seed) * 0.08;
          const totalH = steamH * s * pulse;
          for (let p = 0; p < 12; p++) {
            const f = p / 11;
            const windDrift = f * f * (96 + 18 * Math.sin(time * 1.4 + seed)) * s;
            const sway = Math.sin(time * 3.1 + seed + p * 0.55) * (4 + f * 9) * s;
            const px = cx + windDrift + sway;
            const py = cy - 4 * s - f * totalH;
            const radX = (13 + f * 38) * s;
            const radY = (10 + f * 19) * s;
            const alpha = Math.max(0.16, 0.90 - f * 0.58);
            ctx.fillStyle = p > 7 ? `rgba(254, 243, 199, ${(alpha * 0.52).toFixed(2)})` : `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(px, py, radX, radY, -0.16 * f, 0, Math.PI * 2);
            ctx.fill();
            if (p <= 8) {
              ctx.fillStyle = `rgba(248, 250, 252, ${(alpha * 0.78).toFixed(2)})`;
              ctx.beginPath();
              ctx.ellipse(px - 5 * s, py + 2 * s, radX * 0.72, radY * 0.78, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          // Penacho horizontal denso barrido por el viento en el horizonte
          ctx.fillStyle = 'rgba(248, 250, 252, 0.36)';
          ctx.beginPath();
          ctx.ellipse(cx + 122 * s, cy - totalH * 0.88, 78 * s, 18 * s, -0.04, 0, Math.PI * 2);
          ctx.ellipse(cx + 108 * s, cy - 22 * s, 85 * s, 13 * s, -0.02, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Muro bajo curvo semicircular de piedra gris rústica al frente/costados del cráter (Foto El Tatio)
          const wallTopY = cy - 11 * s;
          const wallBotY = cy + 16 * s;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.beginPath();
          ctx.ellipse(cx + 8 * s, wallBotY + 3 * s, 58 * s, 11 * s, 0, 0, Math.PI);
          ctx.fill();
          const drawWallArc = () => {
            ctx.beginPath();
            ctx.ellipse(cx, cy + 4 * s, 52 * s, 14 * s, 0, 0, Math.PI, false);
            ctx.lineTo(cx - 52 * s, wallTopY + 5 * s);
            ctx.ellipse(cx, wallTopY + 4 * s, 52 * s, 10 * s, 0, Math.PI, 0, true);
            ctx.closePath();
          };
          drawWallArc();
          ctx.fillStyle = '#334155';
          ctx.fill();
          ctx.save();
          drawWallArc();
          ctx.clip();
          const stoneColors = ['#64748b', '#475569', '#94a3b8', '#78716c', '#52525b'];
          for (let row = 0; row < 2; row++) {
            const ry = wallTopY + row * 12 * s;
            let bx = cx - 54 * s - row * 6 * s;
            for (let b = 0; b < 9; b++) {
              const bw = (11 + ((b + row) % 3) * 3) * s;
              ctx.fillStyle = stoneColors[(b * 2 + row + Math.round(seed)) % stoneColors.length];
              ctx.fillRect(bx + 1, ry + 1, bw - 2, 11 * s);
              ctx.fillStyle = 'rgba(241, 245, 249, 0.24)';
              ctx.fillRect(bx + 1.5, ry + 1, bw - 3, 2 * s);
              bx += bw;
            }
          }
          ctx.restore();
        };

        const pTatio = -(cameraX * 0.28);
        const tatioPeriod = 1440;
        const tStart = ((pTatio % tatioPeriod) + tatioPeriod) % tatioPeriod - tatioPeriod;
        const geyserSpecs = [
          { dx: 145, cy: h - 134, s: 0.66, seed: 0.5, sh: 175 },
          { dx: 365, cy: h - 116, s: 0.94, seed: 1.7, sh: 230 },
          { dx: 640, cy: h - 132, s: 0.72, seed: 2.9, sh: 168 },
          { dx: 895, cy: h - 108, s: 1.04, seed: 4.1, sh: 245 },
          { dx: 1170, cy: h - 128, s: 0.78, seed: 5.3, sh: 185 },
          { dx: 1340, cy: h - 118, s: 0.88, seed: 6.4, sh: 198 }
        ];
        for (let tx0 = tStart; tx0 < w + tatioPeriod; tx0 += tatioPeriod) {
          for (let g = 0; g < geyserSpecs.length; g++) {
            const gs = geyserSpecs[g];
            drawTatioGeyserCrater(tx0 + gs.dx, gs.cy, gs.s, gs.seed, gs.sh);
          }
        }
      } else if (theme === 'ch_atacama_salar') {
        // Planicie infinita extremadamente amplia de tierra ocre-rojiza y sal blanca pura
        const horizonY = h - 140;
        const salarGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        salarGrad.addColorStop(0, '#c2784d');
        salarGrad.addColorStop(0.45, '#a35b36');
        salarGrad.addColorStop(1, '#7c3f23');
        ctx.fillStyle = salarGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        // Costra salina blanca pura lejana y vetas extensas horizontales sobre la llanura
        const pSalar = -(cameraX * 0.30);
        const salarPeriod = 1480;
        const sStart = ((pSalar % salarPeriod) + salarPeriod) % salarPeriod - salarPeriod;
        for (let sx0 = sStart; sx0 < w + salarPeriod; sx0 += salarPeriod) {
          // Vetas largas y manchones irregulares de sal blanca pura sobre la tierra ocre-rojiza
          const saltPatches = [
            { x: 95, y: h - 130, rx: 120, ry: 8, rot: -0.02 },
            { x: 380, y: h - 122, rx: 165, ry: 11, rot: 0.03 },
            { x: 740, y: h - 131, rx: 140, ry: 9, rot: -0.01 },
            { x: 1140, y: h - 124, rx: 175, ry: 12, rot: 0.02 },
            { x: 240, y: h - 98, rx: 145, ry: 13, rot: 0.04 },
            { x: 640, y: h - 90, rx: 165, ry: 14, rot: -0.03 },
            { x: 980, y: h - 104, rx: 135, ry: 11, rot: 0.02 },
            { x: 1340, y: h - 88, rx: 130, ry: 12, rot: -0.02 }
          ];
          for (let sp = 0; sp < saltPatches.length; sp++) {
            const pt = saltPatches[sp];
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(sx0 + pt.x, pt.y, pt.rx, pt.ry, pt.rot, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.ellipse(sx0 + pt.x + 12, pt.y + 3, pt.rx * 0.74, pt.ry * 0.55, pt.rot, 0, Math.PI * 2);
            ctx.fill();
          }

          // Lagunas salinas oscuras en primer/segundo plano rodeadas de grueso borde cristalino blanco
          const lagoons = [
            { x: 465, y: h - 94, rx: 118, ry: 18 },
            { x: 1125, y: h - 82, rx: 142, ry: 21 }
          ];
          for (let l = 0; l < lagoons.length; l++) {
            const lg = lagoons[l];
            // Borde grueso de costra de sal blanca pura alrededor de la laguna
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(sx0 + lg.x, lg.y, lg.rx + 18, lg.ry + 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Espejo de agua salina oscura reflejando el azul del cielo
            const lagGrad = ctx.createLinearGradient(0, lg.y - lg.ry, 0, lg.y + lg.ry);
            lagGrad.addColorStop(0, '#0f172a');
            lagGrad.addColorStop(0.55, '#0c4a6e');
            lagGrad.addColorStop(1, '#155e75');
            ctx.fillStyle = lagGrad;
            ctx.beginPath();
            ctx.ellipse(sx0 + lg.x, lg.y + 1, lg.rx, lg.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
            ctx.beginPath();
            ctx.ellipse(sx0 + lg.x - 18, lg.y - 3, lg.rx * 0.45, lg.ry * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Textura poligonal cristalina sutil en el primer plano del salar
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let v = 0; v < 8; v++) {
            const vx = sx0 + 60 + v * 185;
            ctx.moveTo(vx, h - 76);
            ctx.lineTo(vx + 55, h - 82);
            ctx.lineTo(vx + 108, h - 73);
          }
          ctx.stroke();
        }
      } else if (theme === 'ch_atacama_luna') {
        // 1. Lomas desérticas lejanas en tonos malva-terracota y pizarra + Cordillera de la Sal dentada
        const pLunaFar = -(cameraX * 0.14);
        const farPeriod = 1400;
        const farStart = ((pLunaFar % farPeriod) + farPeriod) % farPeriod - farPeriod;
        for (let fx = farStart; fx < w + farPeriod; fx += farPeriod) {
          // Cerros suaves de horizonte alto (foto Valle de la Luna)
          ctx.fillStyle = '#7c6473';
          ctx.beginPath();
          ctx.moveTo(fx, h - 130);
          ctx.quadraticCurveTo(fx + 210, h - 268, fx + 460, h - 220);
          ctx.quadraticCurveTo(fx + 740, h - 276, fx + 1040, h - 215);
          ctx.quadraticCurveTo(fx + 1230, h - 252, fx + farPeriod, h - 130);
          ctx.lineTo(fx + farPeriod, h - 95);
          ctx.lineTo(fx, h - 95);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(180, 142, 130, 0.55)';
          ctx.beginPath();
          ctx.ellipse(fx + 350, h - 222, 155, 18, 0.12, 0, Math.PI * 2);
          ctx.ellipse(fx + 910, h - 228, 175, 20, -0.1, 0, Math.PI * 2);
          ctx.fill();

          const farPeaks = [
            { x0: 0, tipX: 110, tipY: h - 224, x1: 250 },
            { x0: 190, tipX: 335, tipY: h - 252, x1: 495 },
            { x0: 425, tipX: 555, tipY: h - 216, x1: 710 },
            { x0: 650, tipX: 810, tipY: h - 260, x1: 980 },
            { x0: 910, tipX: 1050, tipY: h - 228, x1: 1210 },
            { x0: 1140, tipX: 1270, tipY: h - 246, x1: 1400 }
          ];
          for (let fp = 0; fp < farPeaks.length; fp++) {
            const pk = farPeaks[fp];
            ctx.fillStyle = '#d97745';
            ctx.beginPath();
            ctx.moveTo(fx + pk.x0, h - 98);
            ctx.lineTo(fx + pk.tipX, pk.tipY);
            ctx.lineTo(fx + pk.tipX + 18, h - 98);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#7c2d12';
            ctx.beginPath();
            ctx.moveTo(fx + pk.tipX, pk.tipY);
            ctx.lineTo(fx + pk.x1, h - 98);
            ctx.lineTo(fx + pk.tipX + 6, h - 98);
            ctx.closePath();
            ctx.fill();
          }
        }

        // 2. Plano medio: Crestas afiladas/estrías de Cordillera de la Sal + dunas gris-ceniza
        const pLunaMid = -(cameraX * 0.28);
        const midPeriod = 1480;
        const midStart = ((pLunaMid % midPeriod) + midPeriod) % midPeriod - midPeriod;
        for (let mx0 = midStart; mx0 < w + midPeriod; mx0 += midPeriod) {
          const ridges = [
            { x: 40, w: 320, h: 168, hasDune: false },
            { x: 380, w: 390, h: 184, hasDune: true, duneDir: 1 },
            { x: 810, w: 340, h: 158, hasDune: true, duneDir: -1 },
            { x: 1170, w: 330, h: 174, hasDune: false }
          ];
          for (let r = 0; r < ridges.length; r++) {
            const rg = ridges[r];
            const bx = mx0 + rg.x;
            const by = h - 96;
            // Crestas dentadas y escarpadas (terracota, naranja oxidado y ocre cálido)
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + rg.w * 0.22, by - rg.h * 0.72);
            ctx.lineTo(bx + rg.w * 0.34, by - rg.h * 0.56);
            ctx.lineTo(bx + rg.w * 0.50, by - rg.h);
            ctx.lineTo(bx + rg.w * 0.66, by - rg.h * 0.68);
            ctx.lineTo(bx + rg.w * 0.80, by - rg.h * 0.82);
            ctx.lineTo(bx + rg.w, by);
            ctx.closePath();
            ctx.fill();

            // Caras diagonales en sombra profunda (terracota oscuro / marrón oxidado)
            ctx.fillStyle = '#7c2d12';
            ctx.beginPath();
            ctx.moveTo(bx + rg.w * 0.50, by - rg.h);
            ctx.lineTo(bx + rg.w * 0.66, by - rg.h * 0.68);
            ctx.lineTo(bx + rg.w * 0.80, by - rg.h * 0.82);
            ctx.lineTo(bx + rg.w, by);
            ctx.lineTo(bx + rg.w * 0.42, by);
            ctx.closePath();
            ctx.fill();

            // Estrías rocosas verticales/diagonales esculpidas con luz ocre y sombra profunda (foto real)
            for (let fl = 0; fl < 6; fl++) {
              const fx0 = bx + rg.w * (0.12 + fl * 0.14);
              const fh = rg.h * (0.48 + ((fl * 3) % 5) * 0.08);
              ctx.fillStyle = fl < 3 ? '#e29568' : '#59230e';
              ctx.beginPath();
              ctx.moveTo(fx0 - 12, by);
              ctx.lineTo(fx0, by - fh);
              ctx.lineTo(fx0 + 10, by);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = 'rgba(243, 222, 199, 0.42)';
              ctx.fillRect(fx0 - 2, by - fh, 2.5, fh * 0.35);
            }

            // Dunas lisas de arena gris-ceniza adosadas a las crestas rocosas (Gran Duna)
            if (rg.hasDune) {
              const dTopX = rg.duneDir > 0 ? bx + rg.w * 0.68 : bx + rg.w * 0.28;
              const dTopY = by - rg.h * 0.68;
              const dLeftX = dTopX - 185;
              const dRightX = dTopX + 215;
              const duneLight = ctx.createLinearGradient(dLeftX, by, dTopX, dTopY);
              duneLight.addColorStop(0, '#cbd5e1');
              duneLight.addColorStop(1, '#94a3b8');
              ctx.fillStyle = duneLight;
              ctx.beginPath();
              ctx.moveTo(dLeftX, by);
              ctx.quadraticCurveTo(dTopX - 65, dTopY + 38, dTopX, dTopY);
              ctx.lineTo(dTopX - 18, by);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = '#64748b';
              ctx.beginPath();
              ctx.moveTo(dTopX, dTopY);
              ctx.quadraticCurveTo(dTopX + 75, dTopY + 34, dRightX, by);
              ctx.lineTo(dTopX - 18, by);
              ctx.closePath();
              ctx.fill();
              // Sombras proyectadas de las crestas sobre la duna gris-ceniza
              ctx.fillStyle = 'rgba(30, 41, 59, 0.32)';
              ctx.beginPath();
              ctx.moveTo(dTopX - 12, dTopY + 12);
              ctx.lineTo(dTopX + 86, by);
              ctx.lineTo(dTopX + 26, by);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // 3. Valles planos cubiertos por costras blancas de sal en la base
        const saltBaseGrad = ctx.createLinearGradient(0, h - 102, 0, h);
        saltBaseGrad.addColorStop(0, '#f8fafc');
        saltBaseGrad.addColorStop(0.55, '#e2e8f0');
        saltBaseGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = saltBaseGrad;
        ctx.fillRect(0, h - 102, w, 102);

        const pLunaGround = -(cameraX * 0.40);
        const grdPeriod = 960;
        const gStart = ((pLunaGround % grdPeriod) + grdPeriod) % grdPeriod - grdPeriod;
        for (let gx = gStart; gx < w + grdPeriod; gx += grdPeriod) {
          // Afloramientos suaves ocre-terracota bajo la costra blanca de sal
          ctx.fillStyle = 'rgba(180, 83, 9, 0.24)';
          ctx.beginPath();
          ctx.ellipse(gx + 210, h - 96, 95, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(gx + 680, h - 92, 115, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          // Costra salina blanca luminosa y grietas poligonales del valle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.ellipse(gx + 430, h - 84, 155, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(gx + 80, h - 78);
          ctx.lineTo(gx + 190, h - 84);
          ctx.lineTo(gx + 310, h - 76);
          ctx.moveTo(gx + 540, h - 75);
          ctx.lineTo(gx + 660, h - 83);
          ctx.lineTo(gx + 810, h - 76);
          ctx.stroke();
        }
      } else if (theme === 'ch_atacama_alma') {
        // Suelo de tierra rojizo-ocre del altiplano de Chajnantor (5.000m)
        const horizonY = h - 142;
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        groundGrad.addColorStop(0, '#c28862');
        groundGrad.addColorStop(0.45, '#a36945');
        groundGrad.addColorStop(1, '#7e4c2e');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        // Franja de ripio, dunas bajas y piedras dispersas
        const pGroundAlma = -(cameraX * 0.35);
        ctx.fillStyle = '#b0744e';
        for (let g = 0; g < 8; g++) {
          const gx = wrapItemX(pGroundAlma, -90 + g * 210, 0, 180, 1680);
          ctx.beginPath();
          ctx.ellipse(gx + 90, h - 102 + (g % 3) * 14, 78, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#6b3e24';
        for (let st = 0; st < 18; st++) {
          const sx = wrapItemX(-(cameraX * 0.44), -60 + st * 95, -8, 12, 1710);
          const sy = h - 126 + ((st * 29) % 58);
          ctx.fillRect(sx, sy, 5 + (st % 4), 2.5);
        }

        const drawAlmaAntenna = (cx, baseY, s, dishTilt, showStairs, showFence) => {
          ctx.save();
          // Sombra proyectada en el suelo rojizo-ocre
          ctx.fillStyle = 'rgba(67, 36, 18, 0.34)';
          ctx.beginPath();
          ctx.ellipse(cx - 10 * s, baseY + 2 * s, 52 * s, 9 * s, 0, 0, Math.PI * 2);
          ctx.fill();

          // Base cónica de hormigón y acero con puerta de acceso
          ctx.fillStyle = '#64748b';
          ctx.fillRect(cx - 30 * s, baseY - 5 * s, 60 * s, 5 * s);
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(cx - 26 * s, baseY - 5 * s);
          ctx.lineTo(cx - 19 * s, baseY - 35 * s);
          ctx.lineTo(cx + 19 * s, baseY - 35 * s);
          ctx.lineTo(cx + 26 * s, baseY - 5 * s);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(cx - 26 * s, baseY - 5 * s);
          ctx.lineTo(cx - 19 * s, baseY - 35 * s);
          ctx.lineTo(cx - 6 * s, baseY - 35 * s);
          ctx.lineTo(cx - 8 * s, baseY - 5 * s);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(cx - 4 * s, baseY - 22 * s, 9 * s, 16 * s);

          // Anillo de giro azimutal y cabina superior + horquilla Az-El
          ctx.fillStyle = '#475569';
          ctx.fillRect(cx - 22 * s, baseY - 41 * s, 44 * s, 6 * s);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(cx - 21 * s, baseY - 72 * s, 42 * s, 31 * s);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(cx - 21 * s, baseY - 72 * s, 14 * s, 31 * s);

          // Escaleras metálicas exteriores con pasamanos (en antenas cercanas y medias)
          if (showStairs) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = Math.max(1.2, 2.2 * s);
            ctx.beginPath();
            ctx.moveTo(cx - 34 * s, baseY - 4 * s);
            ctx.lineTo(cx - 22 * s, baseY - 38 * s);
            ctx.lineTo(cx - 20 * s, baseY - 68 * s);
            ctx.moveTo(cx - 28 * s, baseY - 4 * s);
            ctx.lineTo(cx - 16 * s, baseY - 38 * s);
            ctx.moveTo(cx - 25 * s, baseY - 38 * s);
            ctx.lineTo(cx - 10 * s, baseY - 38 * s);
            ctx.moveTo(cx - 24 * s, baseY - 68 * s);
            ctx.lineTo(cx - 6 * s, baseY - 68 * s);
            ctx.stroke();
            // Pasamanos y peldaños
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = Math.max(1, 1.4 * s);
            ctx.beginPath();
            ctx.moveTo(cx - 36 * s, baseY - 12 * s);
            ctx.lineTo(cx - 25 * s, baseY - 46 * s);
            ctx.lineTo(cx - 24 * s, baseY - 76 * s);
            ctx.lineTo(cx - 10 * s, baseY - 76 * s);
            for (let st = 0; st < 6; st++) {
              const ty = baseY - 8 * s - st * 5 * s;
              const tx = cx - 32 * s + st * 1.8 * s;
              ctx.moveTo(tx, ty);
              ctx.lineTo(tx + 6 * s, ty);
            }
            ctx.stroke();
          }

          // Brazos bifurcados de elevación (Yoke)
          const pivotY = baseY - 88 * s;
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(cx - 23 * s, baseY - 64 * s);
          ctx.lineTo(cx - 18 * s, pivotY - 5 * s);
          ctx.lineTo(cx - 6 * s, pivotY - 5 * s);
          ctx.lineTo(cx - 5 * s, baseY - 64 * s);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.moveTo(cx + 5 * s, baseY - 64 * s);
          ctx.lineTo(cx + 6 * s, pivotY - 5 * s);
          ctx.lineTo(cx + 20 * s, pivotY - 5 * s);
          ctx.lineTo(cx + 23 * s, baseY - 64 * s);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(cx, pivotY, 6 * s, 0, Math.PI * 2);
          ctx.fill();

          // Plato parabólico segmentado + cuna trasera + tetrápodo subreflector
          ctx.save();
          ctx.translate(cx, pivotY);
          ctx.rotate(dishTilt);
          const rx = 74 * s;
          const ry = 27 * s;
          const dy = -26 * s;

          // Contrapeso y estructura dorsal bajo el plato
          ctx.fillStyle = '#475569';
          ctx.fillRect(-16 * s, -4 * s, 32 * s, 14 * s);
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(-rx * 0.72, dy + 2 * s);
          ctx.quadraticCurveTo(0, dy + 42 * s, rx * 0.72, dy + 2 * s);
          ctx.lineTo(rx * 0.35, dy + 16 * s);
          ctx.lineTo(-rx * 0.35, dy + 16 * s);
          ctx.closePath();
          ctx.fill();

          // Parábola interior cóncava con gradiente 3D
          const dishGrad = ctx.createLinearGradient(-rx, dy + ry, rx, dy - ry);
          dishGrad.addColorStop(0, '#94a3b8');
          dishGrad.addColorStop(0.55, '#e2e8f0');
          dishGrad.addColorStop(1, '#f8fafc');
          ctx.fillStyle = dishGrad;
          ctx.beginPath();
          ctx.ellipse(0, dy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.2, 2.8 * s);
          ctx.stroke();

          // Uniones radiales y anillos concéntricos de los paneles del reflector
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.38)';
          ctx.lineWidth = Math.max(0.7, 1.1 * s);
          for (let r = 0; r < 10; r++) {
            const ang = (r / 10) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, dy + 4 * s);
            ctx.lineTo(Math.cos(ang) * rx * 0.98, dy + Math.sin(ang) * ry * 0.98);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.ellipse(0, dy + 2 * s, rx * 0.44, ry * 0.44, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, dy + 1 * s, rx * 0.74, ry * 0.74, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Receptor central en el vértice del plato
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.ellipse(0, dy + 4 * s, 7 * s, 3.5 * s, 0, 0, Math.PI * 2);
          ctx.fill();

          // Arches metálicos blancos del tetrápodo y subreflector superior
          const apexY = dy - 64 * s;
          const legs = [
            { ax: -rx * 0.72, ay: dy - ry * 0.25, cx: -rx * 0.48, cy: dy - 48 * s, shade: '#cbd5e1' },
            { ax: rx * 0.72, ay: dy - ry * 0.25, cx: rx * 0.48, cy: dy - 48 * s, shade: '#f8fafc' },
            { ax: -rx * 0.52, ay: dy + ry * 0.42, cx: -rx * 0.34, cy: dy - 38 * s, shade: '#f8fafc' },
            { ax: rx * 0.52, ay: dy + ry * 0.42, cx: rx * 0.34, cy: dy - 38 * s, shade: '#ffffff' }
          ];
          for (let l = 0; l < legs.length; l++) {
            const lg = legs[l];
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = Math.max(1.3, 3.2 * s);
            ctx.beginPath();
            ctx.moveTo(lg.ax, lg.ay);
            ctx.quadraticCurveTo(lg.cx, lg.cy, 0, apexY);
            ctx.stroke();
            ctx.strokeStyle = lg.shade;
            ctx.lineWidth = Math.max(1, 2.1 * s);
            ctx.beginPath();
            ctx.moveTo(lg.ax, lg.ay);
            ctx.quadraticCurveTo(lg.cx, lg.cy, 0, apexY);
            ctx.stroke();
          }
          // Tirantes transversales de celosía entre arcos del tetrápodo
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = Math.max(0.8, 1.3 * s);
          ctx.beginPath();
          ctx.moveTo(-rx * 0.44, dy - 20 * s);
          ctx.lineTo(-rx * 0.25, dy - 36 * s);
          ctx.moveTo(rx * 0.44, dy - 20 * s);
          ctx.lineTo(rx * 0.25, dy - 36 * s);
          ctx.moveTo(-rx * 0.24, dy - 42 * s);
          ctx.lineTo(rx * 0.24, dy - 42 * s);
          ctx.stroke();

          // Cabezal subreflector en la cúspide
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.ellipse(0, apexY + 2 * s, 9 * s, 3.5 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(0, apexY, 9 * s, 3.2 * s, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Cerca perimetral de seguridad metálica alrededor de la base
          if (showFence) {
            const fw = 128 * s;
            const fh = 17 * s;
            const fx0 = cx - fw * 0.5;
            const fy0 = baseY - fh + 3 * s;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = Math.max(1, 1.5 * s);
            ctx.strokeRect(fx0, fy0, fw, fh);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = Math.max(0.8, 1.1 * s);
            ctx.beginPath();
            ctx.moveTo(fx0, fy0 + fh * 0.45);
            ctx.lineTo(fx0 + fw, fy0 + fh * 0.45);
            const bars = showStairs ? 14 : 9;
            for (let b = 1; b < bars; b++) {
              const bx = fx0 + (fw * b) / bars;
              ctx.moveTo(bx, fy0);
              ctx.lineTo(bx, fy0 + fh);
            }
            ctx.stroke();
          }
          ctx.restore();
        };

        // 3 capas parallax de radiotelescopios ALMA
        const pFarAlma = -(cameraX * 0.14);
        const farTilts = [-0.34, 0.28, -0.22, 0.36, -0.30, 0.24];
        for (let a = 0; a < 6; a++) {
          const ax = wrapItemX(pFarAlma, -80 + a * 250, -60, 120, 1500);
          drawAlmaAntenna(ax, h - 134, 0.36 + (a % 2) * 0.05, farTilts[a], false, false);
        }

        const pMidAlma = -(cameraX * 0.25);
        const midTilts = [0.30, -0.36, 0.22, -0.28, 0.34];
        for (let a = 0; a < 5; a++) {
          const ax = wrapItemX(pMidAlma, -110 + a * 310, -90, 180, 1550);
          drawAlmaAntenna(ax, h - 110, 0.58 + (a % 2) * 0.06, midTilts[a], true, true);
        }

        const pNearAlma = -(cameraX * 0.40);
        const nearTilts = [-0.28, 0.25, -0.32];
        for (let a = 0; a < 3; a++) {
          const ax = wrapItemX(pNearAlma, 95 + a * 540, -140, 280, 1620);
          drawAlmaAntenna(ax, h - 72, 0.96 + (a === 1 ? 0.08 : 0), nearTilts[a], true, true);
        }

      // ========================================================================
      // D. ISLA DE PASCUA / RAPA NUI
      // D.1 PLAYA ANAKENA & AHU NAU NAU (Exclusiva Zona 3 - Referencia Real)
      // ========================================================================
      } else if (theme === 'ch_pascua_anakena') {
        const drawAnakenaPalm = (px, baseY, height, swaySeed, lean = 1) => {
          const sway = Math.sin(time * 2.0 + swaySeed) * 4.5;
          const topX = px + lean * height * 0.09 + sway * 0.45;
          const topY = baseY - height;
          const ctrlX = px + lean * height * 0.03;
          const ctrlY = baseY - height * 0.52;

          // Tronco delgado ligeramente curvo y anillado
          ctx.strokeStyle = '#4a3828';
          ctx.lineWidth = 6.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px, baseY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, topX, topY);
          ctx.stroke();
          ctx.strokeStyle = '#7c6248';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(px - 1, baseY);
          ctx.quadraticCurveTo(ctrlX - 1, ctrlY, topX - 1, topY);
          ctx.stroke();

          // Racimo de cocos bajo la copa
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(topX - 2, topY + 4, 2.8, 0, Math.PI * 2);
          ctx.arc(topX + 3, topY + 5, 2.6, 0, Math.PI * 2);
          ctx.fill();

          // Frondas cocoteras arqueadas y mecidas por la brisa costera
          const fronds = [
            { ang: -2.75, len: 38, col: '#14532d' },
            { ang: -2.15, len: 42, col: '#166534' },
            { ang: -1.45, len: 36, col: '#15803d' },
            { ang: -0.78, len: 42, col: '#4d7c0f' },
            { ang: -0.22, len: 44, col: '#15803d' },
            { ang: 0.34, len: 38, col: '#166534' },
            { ang: 2.68, len: 34, col: '#14532d' },
            { ang: 1.95, len: 32, col: '#15803d' }
          ];
          for (let f = 0; f < fronds.length; f++) {
            const fr = fronds[f];
            const wave = Math.sin(time * 2.3 + swaySeed + f * 0.7) * 0.05;
            const endX = topX + Math.cos(fr.ang + wave) * fr.len;
            const endY = topY + Math.sin(fr.ang + wave) * fr.len * 0.65 + fr.len * 0.24;
            const midX = (topX + endX) * 0.52;
            const midY = Math.min(topY, endY) - fr.len * 0.26;
            ctx.strokeStyle = fr.col;
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(topX, topY);
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();
            // Hojuelas plumosas de cada palma
            ctx.fillStyle = fr.col;
            for (let k = 1; k <= 5; k++) {
              const t = k / 5.5;
              const inv = 1 - t;
              const lx = inv * inv * topX + 2 * inv * t * midX + t * t * endX;
              const ly = inv * inv * topY + 2 * inv * t * midY + t * t * endY;
              const span = (1 - t * 0.45) * 9;
              ctx.beginPath();
              ctx.moveTo(lx, ly);
              ctx.lineTo(lx - 4, ly + span);
              ctx.lineTo(lx + 4, ly + span * 0.75);
              ctx.closePath();
              ctx.fill();
            }
          }
        };

        const drawAnakenaMoai = (mx, baseY, mh, mw, isIntact, hasPukao) => {
          if (!isIntact) {
            // Restos bajos erosionados del costado izquierdo de Ahu Nau Nau
            ctx.fillStyle = '#78716c';
            ctx.beginPath();
            ctx.moveTo(mx - mw * 0.5, baseY);
            ctx.lineTo(mx - mw * 0.46, baseY - mh * 0.78);
            ctx.quadraticCurveTo(mx, baseY - mh * 1.05, mx + mw * 0.44, baseY - mh * 0.76);
            ctx.lineTo(mx + mw * 0.48, baseY);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.moveTo(mx + mw * 0.08, baseY - mh * 0.92);
            ctx.lineTo(mx + mw * 0.44, baseY - mh * 0.76);
            ctx.lineTo(mx + mw * 0.48, baseY);
            ctx.lineTo(mx + mw * 0.06, baseY);
            ctx.closePath();
            ctx.fill();
            return;
          }

          const topY = baseY - mh;
          // Torso monolítico en toba ocre-gris (vista 3/4 mirando tierra adentro)
          ctx.fillStyle = '#a89f91';
          ctx.beginPath();
          ctx.moveTo(mx - mw * 0.48, baseY);
          ctx.lineTo(mx - mw * 0.52, topY + mh * 0.42);
          ctx.lineTo(mx + mw * 0.48, topY + mh * 0.42);
          ctx.lineTo(mx + mw * 0.44, baseY);
          ctx.closePath();
          ctx.fill();
          // Sombra profunda lateral derecha del torso
          ctx.fillStyle = '#57534e';
          ctx.beginPath();
          ctx.moveTo(mx + mw * 0.08, topY + mh * 0.42);
          ctx.lineTo(mx + mw * 0.48, topY + mh * 0.42);
          ctx.lineTo(mx + mw * 0.44, baseY);
          ctx.lineTo(mx + mw * 0.04, baseY);
          ctx.closePath();
          ctx.fill();
          // Brazo/abdomen tallado sutil
          ctx.strokeStyle = 'rgba(41, 37, 36, 0.5)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(mx - mw * 0.36, baseY - mh * 0.24);
          ctx.lineTo(mx - mw * 0.08, baseY - mh * 0.14);
          ctx.stroke();

          // Cabeza alargada en perspectiva 3/4 con arcada, nariz y mentón marcado
          ctx.fillStyle = '#b8afa0';
          ctx.fillRect(mx - mw * 0.41, topY, mw * 0.80, mh * 0.44);
          ctx.fillStyle = '#44403c';
          ctx.fillRect(mx + mw * 0.09, topY, mw * 0.32, mh * 0.44);
          // Cuencas oculares oscuras bajo el entrecejo saliente
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(mx - mw * 0.39, topY + mh * 0.07, mw * 0.52, mh * 0.06);
          // Nariz prominente 3/4 y labios firmes
          ctx.fillStyle = '#c7beb0';
          ctx.fillRect(mx - mw * 0.28, topY + mh * 0.11, mw * 0.16, mh * 0.20);
          ctx.fillStyle = '#292524';
          ctx.fillRect(mx - mw * 0.33, topY + mh * 0.35, mw * 0.38, mh * 0.03);
          // Oreja larga tallada en el costado derecho
          ctx.fillStyle = '#78716c';
          ctx.fillRect(mx + mw * 0.18, topY + mh * 0.13, mw * 0.11, mh * 0.22);

          // Tocado cilíndrico de escoria roja volcánica (Pukao de Ahu Nau Nau)
          if (hasPukao) {
            const pkW = mw * 1.04;
            const pkH = mh * 0.20;
            const pkY = topY - pkH + 1;
            // Sombrero/copete superior (hau) del pukao
            ctx.fillStyle = '#7c2d12';
            ctx.fillRect(mx - mw * 0.22, pkY - mh * 0.05, mw * 0.42, mh * 0.06);
            // Tambor cilíndrico rojizo
            const pkGrad = ctx.createLinearGradient(mx - pkW * 0.5, pkY, mx + pkW * 0.5, pkY);
            pkGrad.addColorStop(0, '#b45309');
            pkGrad.addColorStop(0.55, '#9a3412');
            pkGrad.addColorStop(1, '#451a03');
            ctx.fillStyle = pkGrad;
            ctx.beginPath();
            ctx.moveTo(mx - pkW * 0.46, pkY);
            ctx.lineTo(mx + pkW * 0.46, pkY);
            ctx.lineTo(mx + pkW * 0.52, pkY + pkH);
            ctx.lineTo(mx - pkW * 0.52, pkY + pkH);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(28, 25, 23, 0.35)';
            ctx.fillRect(mx - pkW * 0.48, pkY + pkH - 3, pkW * 0.96, 3);
          }
        };

        // 1. Panorama continuo: colina verde brillante, grupos de palmeras y Ahu Nau Nau
        const pAnakena = -(cameraX * 0.30);
        const panPeriod = 1440;
        const panStart = ((pAnakena % panPeriod) + panPeriod) % panPeriod - panPeriod;

        for (let tileX = panStart; tileX < w + 240; tileX += panPeriod) {
          // Suave colina de césped verde brillante hacia el sector derecho del ahu
          const hillGrad = ctx.createLinearGradient(0, h - 195, 0, h - 75);
          hillGrad.addColorStop(0, '#a3e635');
          hillGrad.addColorStop(0.45, '#65a30d');
          hillGrad.addColorStop(1, '#3f6212');
          ctx.fillStyle = hillGrad;
          ctx.beginPath();
          ctx.moveTo(tileX, h - 110);
          ctx.lineTo(tileX + 490, h - 110);
          ctx.bezierCurveTo(tileX + 740, h - 154, tileX + 940, h - 190, tileX + 1180, h - 188);
          ctx.bezierCurveTo(tileX + 1295, h - 186, tileX + 1375, h - 142, tileX + panPeriod, h - 110);
          ctx.lineTo(tileX + panPeriod, h - 40);
          ctx.lineTo(tileX, h - 40);
          ctx.closePath();
          ctx.fill();

          // Textura suave de pastizal soleado sobre la colina verde
          ctx.fillStyle = 'rgba(190, 242, 100, 0.36)';
          ctx.beginPath();
          ctx.ellipse(tileX + 970, h - 160, 145, 16, -0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(63, 98, 18, 0.25)';
          ctx.beginPath();
          ctx.ellipse(tileX + 860, h - 122, 175, 18, 0.06, 0, Math.PI * 2);
          ctx.fill();

          // Grupo de palmeras detrás del ala derecha del ahu y sobre la ladera verde
          const palms = [
            { dx: 432, baseY: h - 120, h: 108, seed: 0.4, lean: 0.7 },
            { dx: 468, baseY: h - 124, h: 132, seed: 1.3, lean: -0.5 },
            { dx: 516, baseY: h - 126, h: 118, seed: 2.1, lean: 0.9 },
            { dx: 642, baseY: h - 134, h: 116, seed: 2.9, lean: 0.5 },
            { dx: 710, baseY: h - 142, h: 134, seed: 3.7, lean: -0.6 },
            { dx: 778, baseY: h - 148, h: 146, seed: 4.5, lean: 0.8 },
            { dx: 856, baseY: h - 156, h: 128, seed: 5.2, lean: -0.4 },
            { dx: 955, baseY: h - 166, h: 144, seed: 1.9, lean: 0.7 },
            { dx: 1110, baseY: h - 172, h: 136, seed: 3.1, lean: -0.5 },
            { dx: 1235, baseY: h - 162, h: 122, seed: 4.8, lean: 0.6 }
          ];
          for (let p = 0; p < palms.length; p++) {
            const pm = palms[p];
            drawAnakenaPalm(tileX + pm.dx, pm.baseY, pm.h, pm.seed, pm.lean);
          }

          // Gran plataforma escalonada de piedra volcánica oscura: Ahu Nau Nau
          const ahuX = tileX + 38;
          const platTopY = h - 156;
          const drawAhuPolygon = () => {
            ctx.beginPath();
            ctx.moveTo(ahuX - 18, h - 76);
            ctx.lineTo(ahuX + 8, platTopY + 14);
            ctx.lineTo(ahuX + 20, platTopY);
            ctx.lineTo(ahuX + 356, platTopY);
            ctx.lineTo(ahuX + 366, platTopY + 20);
            ctx.lineTo(ahuX + 495, platTopY + 24);
            ctx.lineTo(ahuX + 648, h - 98);
            ctx.lineTo(ahuX + 668, h - 74);
            ctx.closePath();
          };

          drawAhuPolygon();
          ctx.fillStyle = '#1c1917';
          ctx.fill();

          // Bloques irregulares bien marcados con juntas y sombras sobre el muro del ahu
          ctx.save();
          drawAhuPolygon();
          ctx.clip();
          const stoneCols = ['#292524', '#332e2b', '#44403c', '#57534e', '#6c635b', '#78716c'];
          const rowHeights = [16, 15, 17, 16, 18];
          let cy = platTopY;
          for (let row = 0; row < rowHeights.length; row++) {
            const rh = rowHeights[row];
            let cx = ahuX - 24 - (row % 2) * 14;
            let idx = 0;
            while (cx < ahuX + 675) {
              const bw = 20 + ((idx * 17 + row * 11) % 24);
              const bh = rh - ((idx + row) % 3);
              ctx.fillStyle = stoneCols[(idx * 3 + row * 2) % stoneCols.length];
              ctx.fillRect(cx + 1, cy + 1, bw - 2, bh - 2);
              ctx.fillStyle = 'rgba(214, 211, 209, 0.16)';
              ctx.fillRect(cx + 2, cy + 1, bw - 4, 2.5);
              ctx.fillStyle = 'rgba(12, 10, 9, 0.45)';
              ctx.fillRect(cx + 1, cy + bh - 3, bw - 2, 2.5);
              cx += bw;
              idx++;
            }
            cy += rh;
          }
          // Reborde superior de la plataforma ceremonial
          ctx.fillStyle = 'rgba(168, 162, 158, 0.25)';
          ctx.fillRect(ahuX + 18, platTopY, 342, 4);
          ctx.restore();

          // Hilera real de Ahu Nau Nau: 2 restos erosionados a la izq + 4 Moáis altos con Pukao
          drawAnakenaMoai(ahuX + 46, platTopY, 22, 17, false, false);
          drawAnakenaMoai(ahuX + 86, platTopY, 44, 22, false, false);
          drawAnakenaMoai(ahuX + 142, platTopY, 102, 34, true, true);
          drawAnakenaMoai(ahuX + 196, platTopY, 100, 34, true, true);
          drawAnakenaMoai(ahuX + 252, platTopY, 108, 36, true, true);
          drawAnakenaMoai(ahuX + 312, platTopY, 105, 36, true, true);
        }

        // 2. Dunas onduladas de arena blanca-crema coralina en franja inferior + pasto costero aislado
        const duneGrad = ctx.createLinearGradient(0, h - 108, 0, h);
        duneGrad.addColorStop(0, '#fffdf7');
        duneGrad.addColorStop(0.45, '#f6efe0');
        duneGrad.addColorStop(1, '#e4d9c3');
        const pDunes = -(cameraX * 0.44);
        const dunePeriod = 720;
        const duneStart = ((pDunes % dunePeriod) + dunePeriod) % dunePeriod - dunePeriod;
        ctx.fillStyle = duneGrad;
        ctx.beginPath();
        ctx.moveTo(duneStart, h);
        ctx.lineTo(duneStart, h - 92);
        for (let dx = duneStart; dx < w + dunePeriod; dx += dunePeriod) {
          ctx.bezierCurveTo(dx + 160, h - 114, dx + 270, h - 84, dx + 420, h - 96);
          ctx.bezierCurveTo(dx + 550, h - 106, dx + 640, h - 84, dx + dunePeriod, h - 92);
        }
        ctx.lineTo(w + dunePeriod, h);
        ctx.closePath();
        ctx.fill();

        // Sombras suaves de relieve eólico y pequeños manojos aislados de pasto sobre la arena
        for (let dx = duneStart; dx < w + dunePeriod; dx += dunePeriod) {
          ctx.fillStyle = 'rgba(214, 200, 176, 0.48)';
          ctx.beginPath();
          ctx.moveTo(dx + 120, h - 96);
          ctx.quadraticCurveTo(dx + 250, h - 76, dx + 385, h - 90);
          ctx.quadraticCurveTo(dx + 245, h - 68, dx + 120, h - 96);
          ctx.fill();

          const tufts = [
            { x: 148, y: h - 96, col: '#65a30d', s: 1.0 },
            { x: 356, y: h - 84, col: '#a3a263', s: 1.15 },
            { x: 562, y: h - 94, col: '#4d7c0f', s: 0.9 },
            { x: 648, y: h - 82, col: '#84a93c', s: 0.8 }
          ];
          for (let t = 0; t < tufts.length; t++) {
            const tf = tufts[t];
            ctx.strokeStyle = tf.col;
            ctx.lineWidth = 1.6;
            for (let b = -3; b <= 3; b++) {
              ctx.beginPath();
              ctx.moveTo(dx + tf.x + b * 2 * tf.s, tf.y);
              ctx.lineTo(dx + tf.x + b * 4.5 * tf.s, tf.y - (10 - Math.abs(b) * 1.4) * tf.s);
              ctx.stroke();
            }
          }
        }

      // ========================================================================
      // D.1B VOLCÁN RANO KAU (CHILE PASCUA Z4: Acantilado, Motus, Cráter y Cartel)
      // ========================================================================
      } else if (theme === 'ch_pascua_kau') {
        const seaTop = h - 342; // Horizonte marino amplio (~y=198 en canvas 540px)
        const baseY = h - 68;   // Altura base de referencia (= GROUND_Y 472)

        // 1. OCÉANO PACÍFICO DE HORIZONTE + BAJÍO TURQUESA + TRES MOTUS
        // Tonos oceánicos desaturados en perspectiva atmosférica para mantener nítido el primer plano jugable
        const seaGrad = ctx.createLinearGradient(0, seaTop, 0, h);
        seaGrad.addColorStop(0, '#2a5f85');
        seaGrad.addColorStop(0.32, '#346e93');
        seaGrad.addColorStop(0.68, '#4d8a9d');
        seaGrad.addColorStop(1, '#5897a6');
        ctx.fillStyle = seaGrad;
        ctx.fillRect(0, seaTop, w, h - seaTop);

        // Bruma atmosférica en el horizonte marino para suavizar el contraste del fondo
        const seaMist = ctx.createLinearGradient(0, seaTop, 0, seaTop + 56);
        seaMist.addColorStop(0, 'rgba(224, 242, 254, 0.36)');
        seaMist.addColorStop(1, 'rgba(224, 242, 254, 0)');
        ctx.fillStyle = seaMist;
        ctx.fillRect(0, seaTop, w, 56);

        // Tenues líneas horizontales de oleaje calmo en mar abierto
        const waveDrift = -(((cameraX * 0.08 + time * 10) % 140 + 140) % 140);
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.16)';
        ctx.lineWidth = 1.2;
        for (let wy = seaTop + 26; wy < h - 30; wy += 24) {
          for (let wx = waveDrift - 40; wx < w + 80; wx += 140) {
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(wx + 48 + ((wy * 7) % 24), wy);
            ctx.stroke();
          }
        }

        // Motus volcánicos mar adentro: Motu Nui (aterrazado), Motu Iti y aguja Motu Kao Kao
        const motuShift = -(cameraX * 0.08);
        const mxGroup = wrapItemX(motuShift, 18, -60, 310, 1480);

        // Espuma blanca sutil rodeando los islotes
        ctx.fillStyle = 'rgba(241, 245, 249, 0.50)';
        ctx.beginPath();
        ctx.ellipse(mxGroup + 82, seaTop + 92, 68, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(mxGroup + 236, seaTop + 106, 22, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Motu Nui (islote mayor plano/aterrazado a la izquierda)
        ctx.fillStyle = '#524d47';
        ctx.beginPath();
        ctx.moveTo(mxGroup + 22, seaTop + 91);
        ctx.lineTo(mxGroup + 36, seaTop + 76);
        ctx.lineTo(mxGroup + 88, seaTop + 73);
        ctx.lineTo(mxGroup + 114, seaTop + 81);
        ctx.lineTo(mxGroup + 124, seaTop + 91);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#627241'; // cubierta herbácea olivácea tenue sobre Motu Nui
        ctx.beginPath();
        ctx.moveTo(mxGroup + 38, seaTop + 77);
        ctx.lineTo(mxGroup + 86, seaTop + 74);
        ctx.lineTo(mxGroup + 108, seaTop + 81);
        ctx.lineTo(mxGroup + 44, seaTop + 82);
        ctx.closePath();
        ctx.fill();

        // Motu Iti (peñón más bajo junto a Motu Nui)
        ctx.fillStyle = '#47433e';
        ctx.beginPath();
        ctx.moveTo(mxGroup + 120, seaTop + 91);
        ctx.lineTo(mxGroup + 131, seaTop + 83);
        ctx.lineTo(mxGroup + 144, seaTop + 85);
        ctx.lineTo(mxGroup + 150, seaTop + 91);
        ctx.closePath();
        ctx.fill();

        // Motu Kao Kao (aguja rocosa vertical característica más próxima al acantilado)
        ctx.fillStyle = '#3b3834';
        ctx.beginPath();
        ctx.moveTo(mxGroup + 223, seaTop + 106);
        ctx.lineTo(mxGroup + 229, seaTop + 78);
        ctx.lineTo(mxGroup + 235, seaTop + 65);
        ctx.lineTo(mxGroup + 240, seaTop + 77);
        ctx.lineTo(mxGroup + 247, seaTop + 106);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5d574f';
        ctx.beginPath();
        ctx.moveTo(mxGroup + 235, seaTop + 65);
        ctx.lineTo(mxGroup + 240, seaTop + 77);
        ctx.lineTo(mxGroup + 247, seaTop + 106);
        ctx.lineTo(mxGroup + 236, seaTop + 106);
        ctx.closePath();
        ctx.fill();

        // 2. PANORAMA DEL ACANTILADO COSTERO Y LA GRAN CALDERA CIRCULAR DE RANO KAU
        // Ciclo panorámico sin costuras: al inicio del nivel (cameraX=0) muestra el Pacífico + Motus a la izquierda
        // y la curva del acantilado cayendo al mar junto al anfiteatro del cráter hacia el centro/derecha.
        const panPeriod = 1480;
        const pKau = -(((cameraX * 0.16) % panPeriod + panPeriod) % panPeriod);

        for (let rep = 0; rep < 2; rep++) {
          const px0 = pKau + rep * panPeriod;
          if (px0 > w + 40 || px0 + panPeriod < -40) continue;

          // Sombra sumergida del acantilado y franja de espuma blanca rompiendo en la base
          const surfPulse = Math.sin(time * 2.2 + rep) * 2.5;
          ctx.fillStyle = 'rgba(28, 63, 92, 0.55)';
          ctx.beginPath();
          ctx.moveTo(px0 + 305, h);
          ctx.bezierCurveTo(px0 + 365, h - 135, px0 + 430, seaTop + 110, px0 + 505, seaTop + 44);
          ctx.lineTo(px0 + 560, seaTop + 44);
          ctx.lineTo(px0 + 465, h);
          ctx.closePath();
          ctx.fill();

          ctx.save();
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
          ctx.lineWidth = 7 + surfPulse * 0.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px0 + 322, h);
          ctx.bezierCurveTo(px0 + 382, h - 132, px0 + 444, seaTop + 112, px0 + 508, seaTop + 46);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(224, 242, 254, 0.44)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(px0 + 340, h - 24);
          ctx.bezierCurveTo(px0 + 398, h - 140, px0 + 455, seaTop + 115, px0 + 516, seaTop + 48);
          ctx.stroke();
          ctx.restore();

          // Gran macizo de la caldera Rano Kau (corte de acantilado basáltico + anfiteatro volcánico)
          ctx.fillStyle = '#403c38';
          ctx.beginPath();
          ctx.moveTo(px0 + 348, h);
          ctx.bezierCurveTo(px0 + 410, h - 140, px0 + 462, seaTop + 115, px0 + 514, seaTop + 44);
          ctx.quadraticCurveTo(px0 + 558, seaTop - 16, px0 + 622, seaTop - 16);
          ctx.bezierCurveTo(px0 + 780, seaTop - 22, px0 + 1040, seaTop - 14, px0 + 1235, seaTop + 28);
          ctx.quadraticCurveTo(px0 + 1355, seaTop + 72, px0 + 1438, h);
          ctx.closePath();
          ctx.fill();

          // Pared vertical basáltica en sombra que cae al Océano Pacífico (izquierda del filo)
          const cliffGrad = ctx.createLinearGradient(px0 + 350, seaTop + 10, px0 + 565, h);
          cliffGrad.addColorStop(0, '#544e46');
          cliffGrad.addColorStop(0.55, '#3b3733');
          cliffGrad.addColorStop(1, '#2d2a27');
          ctx.fillStyle = cliffGrad;
          ctx.beginPath();
          ctx.moveTo(px0 + 348, h);
          ctx.bezierCurveTo(px0 + 410, h - 140, px0 + 462, seaTop + 115, px0 + 514, seaTop + 44);
          ctx.quadraticCurveTo(px0 + 558, seaTop - 16, px0 + 622, seaTop - 16);
          ctx.lineTo(px0 + 594, seaTop + 62);
          ctx.bezierCurveTo(px0 + 536, seaTop + 150, px0 + 516, h - 105, px0 + 548, h);
          ctx.closePath();
          ctx.fill();

          // Facetas rocosas verticales en el acantilado
          ctx.fillStyle = 'rgba(28, 25, 23, 0.34)';
          const cliffRibs = [
            { x0: 545, y0: seaTop + 34, w: 32, h: 120 },
            { x0: 492, y0: seaTop + 110, w: 38, h: 145 },
            { x0: 425, y0: h - 155, w: 46, h: 155 }
          ];
          for (let cr = 0; cr < cliffRibs.length; cr++) {
            const rb = cliffRibs[cr];
            ctx.beginPath();
            ctx.moveTo(px0 + rb.x0, rb.y0);
            ctx.lineTo(px0 + rb.x0 + rb.w, rb.y0 + 18);
            ctx.lineTo(px0 + rb.x0 + rb.w - 14, rb.y0 + rb.h);
            ctx.lineTo(px0 + rb.x0 - 12, rb.y0 + rb.h);
            ctx.closePath();
            ctx.fill();
          }

          // Laderas interiores oliváceas y musgosas de la caldera de Rano Kau (contraste suavizado)
          const calderaWallGrad = ctx.createLinearGradient(px0 + 580, seaTop - 16, px0 + 1120, h);
          calderaWallGrad.addColorStop(0, '#6a7a47');
          calderaWallGrad.addColorStop(0.45, '#556538');
          calderaWallGrad.addColorStop(1, '#3f4c2b');
          ctx.fillStyle = calderaWallGrad;
          ctx.beginPath();
          ctx.moveTo(px0 + 622, seaTop - 16);
          ctx.bezierCurveTo(px0 + 780, seaTop - 22, px0 + 1040, seaTop - 14, px0 + 1235, seaTop + 28);
          ctx.quadraticCurveTo(px0 + 1355, seaTop + 72, px0 + 1438, h);
          ctx.lineTo(px0 + 548, h);
          ctx.bezierCurveTo(px0 + 516, h - 105, px0 + 536, seaTop + 150, px0 + 594, seaTop + 62);
          ctx.closePath();
          ctx.fill();

          // Estriaciones radiales oscuras y lomas internas del anfiteatro volcánico
          ctx.fillStyle = 'rgba(54, 48, 42, 0.36)';
          for (let sr = 0; sr < 9; sr++) {
            const sxTop = px0 + 602 + sr * 68;
            const syTop = seaTop - 4 + sr * 4;
            const sxBot = px0 + 638 + sr * 74;
            ctx.beginPath();
            ctx.moveTo(sxTop, syTop);
            ctx.lineTo(sxTop + 34, syTop + 8);
            ctx.lineTo(sxBot + 26, h - 115);
            ctx.lineTo(sxBot - 14, h - 115);
            ctx.closePath();
            ctx.fill();
          }

          // Filo iluminado del borde del cráter (cresta con pastizal oliváceo)
          ctx.strokeStyle = '#7c8d52';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(px0 + 514, seaTop + 44);
          ctx.quadraticCurveTo(px0 + 558, seaTop - 16, px0 + 622, seaTop - 16);
          ctx.bezierCurveTo(px0 + 780, seaTop - 22, px0 + 1040, seaTop - 14, px0 + 1235, seaTop + 28);
          ctx.stroke();

          // Suelo plano inferior del cráter y gran laguna volcánica salpicada con islas de totora
          ctx.fillStyle = '#4a5733';
          ctx.beginPath();
          ctx.ellipse(px0 + 965, h - 115, 330, 82, -0.02, 0, Math.PI * 2);
          ctx.fill();

          // Laguna de Rano Kau (azul pizarra verdoso tenue con reflejo del cielo)
          const lakeGrad = ctx.createLinearGradient(px0 + 700, h - 175, px0 + 1180, h - 55);
          lakeGrad.addColorStop(0, '#295b58');
          lakeGrad.addColorStop(0.55, '#204a48');
          lakeGrad.addColorStop(1, '#316a6a');
          ctx.fillStyle = lakeGrad;
          ctx.beginPath();
          ctx.ellipse(px0 + 968, h - 112, 268, 60, -0.02, 0, Math.PI * 2);
          ctx.fill();

          // Islotes flotantes y parches de totora ocre-oliva sobre la laguna del cráter
          const totoraPatches = [
            { dx: 790, y: h - 126, rx: 52, ry: 12, col: '#7c7640' },
            { dx: 880, y: h - 110, rx: 68, ry: 15, col: '#8d8249' },
            { dx: 955, y: h - 134, rx: 46, ry: 10, col: '#6d6938' },
            { dx: 1025, y: h - 102, rx: 74, ry: 16, col: '#857c45' },
            { dx: 1120, y: h - 122, rx: 58, ry: 13, col: '#77713d' },
            { dx: 845, y: h - 88, rx: 44, ry: 9, col: '#696635' },
            { dx: 1085, y: h - 84, rx: 50, ry: 11, col: '#8d8249' }
          ];
          for (let tp = 0; tp < totoraPatches.length; tp++) {
            const pt = totoraPatches[tp];
            ctx.fillStyle = pt.col;
            ctx.beginPath();
            ctx.ellipse(px0 + pt.dx, pt.y, pt.rx, pt.ry, -0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(168, 154, 92, 0.55)';
            ctx.beginPath();
            ctx.ellipse(px0 + pt.dx - 6, pt.y - 2, pt.rx * 0.62, pt.ry * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Afloramiento rocoso cálido en el borde inferior-derecho del mirador
          ctx.fillStyle = '#5c4d3c';
          ctx.beginPath();
          ctx.moveTo(px0 + 910, h);
          ctx.lineTo(px0 + 968, h - 78);
          ctx.lineTo(px0 + 1055, h - 62);
          ctx.lineTo(px0 + 1140, h);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#78624a';
          ctx.beginPath();
          ctx.moveTo(px0 + 968, h - 78);
          ctx.lineTo(px0 + 1018, h - 68);
          ctx.lineTo(px0 + 1035, h - 22);
          ctx.lineTo(px0 + 952, h);
          ctx.closePath();
          ctx.fill();
        }

        // Velo atmosférico sutil sobre todo el fondo marino/cráter para asegurar contraste nítido del primer plano
        ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
        ctx.fillRect(0, seaTop, w, h - seaTop);

        // 3. HITO ÚNICO AL INICIO DEL NIVEL: CARTEL TURÍSTICO DE MADERA RANO KAU (NO REPETITIVO)
        const signScreenX = 615 - cameraX;
        if (signScreenX > -280 && signScreenX < w + 280) {
          ctx.save();
          // Loma suave de pasto verde en el mirador donde se apoya el cartel
          const knollGrad = ctx.createLinearGradient(0, baseY - 22, 0, baseY + 14);
          knollGrad.addColorStop(0, '#627c32');
          knollGrad.addColorStop(1, '#3f5321');
          ctx.fillStyle = knollGrad;
          ctx.beginPath();
          ctx.moveTo(signScreenX - 185, baseY + 10);
          ctx.quadraticCurveTo(signScreenX - 95, baseY - 16, signScreenX, baseY - 14);
          ctx.quadraticCurveTo(signScreenX + 105, baseY - 16, signScreenX + 195, baseY + 10);
          ctx.closePath();
          ctx.fill();

          // Dos postes cilíndricos de madera marrón
          const postPositions = [signScreenX - 58, signScreenX + 46];
          for (let pp = 0; pp < postPositions.length; pp++) {
            const postX = postPositions[pp];
            const postGrad = ctx.createLinearGradient(postX, baseY - 76, postX + 12, baseY - 76);
            postGrad.addColorStop(0, '#462c1c');
            postGrad.addColorStop(0.45, '#6d452c');
            postGrad.addColorStop(1, '#3a2214');
            ctx.fillStyle = postGrad;
            ctx.fillRect(postX, baseY - 76, 12, 82);
            ctx.strokeStyle = '#29170c';
            ctx.lineWidth = 1.1;
            ctx.strokeRect(postX, baseY - 76, 12, 82);
          }

          // Placa rectangular inferior entre los postes (info del mirador + mapa esquemático blanco)
          const pLeft = signScreenX - 45;
          const pTop = baseY - 68;
          const pW = 90;
          const pH = 54;
          const panelGrad = ctx.createLinearGradient(pLeft, pTop, pLeft, pTop + pH);
          panelGrad.addColorStop(0, '#69442c');
          panelGrad.addColorStop(1, '#4f321f');
          ctx.fillStyle = panelGrad;
          ctx.fillRect(pLeft, pTop, pW, pH);
          ctx.strokeStyle = '#2b190e';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(pLeft, pTop, pW, pH);

          // Juntas horizontales entre tablones de madera de la placa
          ctx.strokeStyle = 'rgba(30, 17, 9, 0.65)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pLeft, pTop + 26);
          ctx.lineTo(pLeft + pW, pTop + 26);
          ctx.moveTo(pLeft, pTop + 42);
          ctx.lineTo(pLeft + pW, pTop + 42);
          ctx.stroke();

          // Marco blanco interior, texto informativo y mapa esquemático costero + cráter Rano Kau
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.86)';
          ctx.lineWidth = 1;
          ctx.strokeRect(pLeft + 5, pTop + 4, pW - 10, pH - 12);
          ctx.strokeRect(pLeft + 46, pTop + 6, 36, pH - 12);

          // Emblema/texto informativo en blanco sobre los tablones inferiores
          ctx.fillStyle = 'rgba(248, 250, 252, 0.90)';
          ctx.font = 'bold 5.5px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Mirador crater', pLeft + 11, pTop + 12);
          ctx.fillText('1600m Ø • 200m', pLeft + 11, pTop + 20);
          ctx.fillText('profundidad', pLeft + 11, pTop + 28);
          ctx.beginPath();
          ctx.arc(pLeft + 36, pTop + 45, 5.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = 'bold 5.5px sans-serif';
          ctx.fillText('21', pLeft + 32.5, pTop + 47);

          // Mapa esquemático blanco del borde costero, anillo circular de la caldera y flecha Norte
          ctx.beginPath();
          ctx.moveTo(pLeft + 62, pTop + 9);
          ctx.bezierCurveTo(pLeft + 56, pTop + 16, pLeft + 54, pTop + 28, pLeft + 55, pTop + 40);
          ctx.quadraticCurveTo(pLeft + 62, pTop + 47, pLeft + 74, pTop + 42);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(pLeft + 62, pTop + 37, 4.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pLeft + 76, pTop + 22);
          ctx.lineTo(pLeft + 76, pTop + 14);
          ctx.lineTo(pLeft + 74, pTop + 17);
          ctx.moveTo(pLeft + 76, pTop + 14);
          ctx.lineTo(pLeft + 78, pTop + 17);
          ctx.stroke();

          // Tablón superior ancho de madera envejecida con silueta superior esculpida siguiendo el perfil del cráter
          const headGrad = ctx.createLinearGradient(signScreenX - 96, baseY - 148, signScreenX + 96, baseY - 68);
          headGrad.addColorStop(0, '#78482c');
          headGrad.addColorStop(0.45, '#8f5938');
          headGrad.addColorStop(0.75, '#7a4b30');
          headGrad.addColorStop(1, '#927966');
          ctx.fillStyle = headGrad;
          ctx.beginPath();
          ctx.moveTo(signScreenX - 76, baseY - 69);
          ctx.quadraticCurveTo(signScreenX - 98, baseY - 82, signScreenX - 96, baseY - 104);
          ctx.quadraticCurveTo(signScreenX - 92, baseY - 122, signScreenX - 66, baseY - 122);
          ctx.lineTo(signScreenX - 52, baseY - 134);
          ctx.lineTo(signScreenX - 56, baseY - 139);
          ctx.quadraticCurveTo(signScreenX - 32, baseY - 127, signScreenX - 18, baseY - 130);
          ctx.lineTo(signScreenX - 12, baseY - 146);
          ctx.lineTo(signScreenX + 4, baseY - 146);
          ctx.quadraticCurveTo(signScreenX + 18, baseY - 136, signScreenX + 48, baseY - 132);
          ctx.quadraticCurveTo(signScreenX + 94, baseY - 128, signScreenX + 96, baseY - 101);
          ctx.quadraticCurveTo(signScreenX + 94, baseY - 73, signScreenX + 68, baseY - 69);
          ctx.quadraticCurveTo(signScreenX, baseY - 66, signScreenX - 76, baseY - 69);
          ctx.closePath();
          ctx.fill();

          // Sombra diagonal de la talla del perfil del cráter
          ctx.fillStyle = 'rgba(59, 31, 16, 0.25)';
          ctx.beginPath();
          ctx.moveTo(signScreenX - 54, baseY - 137);
          ctx.lineTo(signScreenX - 20, baseY - 106);
          ctx.lineTo(signScreenX + 16, baseY - 116);
          ctx.lineTo(signScreenX - 10, baseY - 144);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#331d10';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(signScreenX - 76, baseY - 69);
          ctx.quadraticCurveTo(signScreenX - 98, baseY - 82, signScreenX - 96, baseY - 104);
          ctx.quadraticCurveTo(signScreenX - 92, baseY - 122, signScreenX - 66, baseY - 122);
          ctx.lineTo(signScreenX - 52, baseY - 134);
          ctx.lineTo(signScreenX - 56, baseY - 139);
          ctx.quadraticCurveTo(signScreenX - 32, baseY - 127, signScreenX - 18, baseY - 130);
          ctx.lineTo(signScreenX - 12, baseY - 146);
          ctx.lineTo(signScreenX + 4, baseY - 146);
          ctx.quadraticCurveTo(signScreenX + 18, baseY - 136, signScreenX + 48, baseY - 132);
          ctx.quadraticCurveTo(signScreenX + 94, baseY - 128, signScreenX + 96, baseY - 101);
          ctx.quadraticCurveTo(signScreenX + 94, baseY - 73, signScreenX + 68, baseY - 69);
          ctx.quadraticCurveTo(signScreenX, baseY - 66, signScreenX - 76, baseY - 69);
          ctx.stroke();

          // Texto tallado 'RANO KAU' en blanco claro con sombra interior profunda
          ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#3b1e0f';
          ctx.fillText('RANO KAU', signScreenX - 1.5, baseY - 99.5);
          ctx.fillStyle = '#f8fafc';
          ctx.fillText('RANO KAU', signScreenX, baseY - 98);

          // Briznas de pasto verde en la base del cartel
          ctx.strokeStyle = '#708d38';
          ctx.lineWidth = 1.4;
          for (let gb = -66; gb <= 66; gb += 11) {
            const gx = signScreenX + gb;
            const gh = 8 + ((gb * 7) & 7);
            ctx.beginPath();
            ctx.moveTo(gx, baseY + 6);
            ctx.quadraticCurveTo(gx - 3, baseY - gh * 0.5, gx - 5, baseY - gh);
            ctx.moveTo(gx + 3, baseY + 6);
            ctx.quadraticCurveTo(gx + 6, baseY - gh * 0.6, gx + 8, baseY - gh + 2);
            ctx.stroke();
          }
          ctx.restore();
        }

      // ========================================================================
      // D.2 RESTO DE ISLA DE PASCUA (Tongariki Z1 y Rano Raraku Z2)
      // ========================================================================
      } else if (isPascua) {
        // 1. Océano Pacífico profundo al horizonte + arboleda costera izquierda
        ctx.fillStyle = isSunriseTongariki ? '#1e3a8a' : '#0369a1';
        ctx.fillRect(0, h - 150, w, 85);

        // Arboleda redondeada oscura en el horizonte izquierdo (como en la foto de los 7 Moáis)
        ctx.fillStyle = isSunriseTongariki ? '#0f172a' : '#14532d';
        for (let tr = 0; tr < 4; tr++) {
          ctx.beginPath();
          ctx.arc(28 + tr * 42, h - 135, 32 + (tr % 2) * 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Ladera inclinada de pradera verde lima con rocas volcánicas
        const meadowGrad = ctx.createLinearGradient(0, h - 145, 0, h - 45);
        meadowGrad.addColorStop(0, isSunriseTongariki ? '#365314' : '#84cc16');
        meadowGrad.addColorStop(1, isSunriseTongariki ? '#1a2e05' : '#3f6212');
        ctx.fillStyle = meadowGrad;
        ctx.beginPath();
        ctx.moveTo(0, h - 110);
        ctx.lineTo(w, h - 145);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // 3. Plataforma ceremonial Ahu en piedra volcánica seca + Moáis en perspectiva (Foto 4!)
        const count = isSunriseTongariki ? 10 : 7;
        const ahuBaseX = wrapItemX(pMid, 80, -30, count * 105 + 45);
        // Muro diagonal de mampostería ceremonial Ahu
        ctx.fillStyle = isSunriseTongariki ? '#1c1917' : '#44403c';
        ctx.beginPath();
        ctx.moveTo(ahuBaseX - 30, h - 108);
        ctx.lineTo(ahuBaseX + count * 105 + 45, h - 142);
        ctx.lineTo(ahuBaseX + count * 105 + 45, h - 100);
        ctx.lineTo(ahuBaseX - 30, h - 75);
        ctx.closePath();
        ctx.fill();
        // Rocas basálticas salpicadas en el prado delantero
        ctx.fillStyle = '#1c1917';
        for (let r = 0; r < 14; r++) {
          const rx = wrapItemX(pMid, -40 + r * 92, -12, 12, 1288);
          ctx.beginPath();
          ctx.ellipse(rx, h - 82 + (r % 3) * 10, 12, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Dibujo de los 7 Moáis (escala creciente en perspectiva de izquierda a derecha, o 10-15 en Tongariki)
        for (let m = 0; m < count; m++) {
          const persp = isSunriseTongariki ? 0.92 : (0.52 + (m / (count - 1)) * 0.62);
          const mx = ahuBaseX + m * (isSunriseTongariki ? 88 : 108);
          const ahuY = (h - 110) - (m / Math.max(1, count - 1)) * 32;
          const mw = 46 * persp;
          const mh = 152 * persp;
          const my = ahuY - mh;

          // Torso ancho de toba gris-ocre
          ctx.fillStyle = isSunriseTongariki ? '#0f172a' : '#a8a29e';
          ctx.fillRect(mx - mw * 0.5, my + mh * 0.34, mw, mh * 0.66);
          // Sombra profunda lateral derecha esculpida
          ctx.fillStyle = isSunriseTongariki ? '#020617' : '#44403c';
          ctx.fillRect(mx + mw * 0.14, my + mh * 0.34, mw * 0.36, mh * 0.66);

          // Cabeza monolítica alargada + arcada supraciliar saliente y nariz recta
          ctx.fillStyle = isSunriseTongariki ? '#0f172a' : '#d6d3d1';
          ctx.fillRect(mx - mw * 0.42, my, mw * 0.84, mh * 0.37);
          ctx.fillStyle = isSunriseTongariki ? '#020617' : '#57534e';
          ctx.fillRect(mx + mw * 0.08, my, mw * 0.34, mh * 0.37);
          // Ceja y cuencas oculares oscuras
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(mx - mw * 0.38, my + mh * 0.07, mw * 0.66, mh * 0.05);
          // Nariz larga caracterísitica
          ctx.fillStyle = isSunriseTongariki ? '#020617' : '#78716c';
          ctx.fillRect(mx - mw * 0.12, my + mh * 0.11, mw * 0.18, mh * 0.17);
          // Labios / mentón firme
          ctx.fillStyle = '#292524';
          ctx.fillRect(mx - mw * 0.24, my + mh * 0.30, mw * 0.44, mh * 0.03);
        }
      }
      ctx.restore();
    }
  }

  global.LEVELS = LEVELS;
  global.MADRID_LEVELS = MADRID_LEVELS;
  global.PALMA_LEVELS = PALMA_LEVELS;
  global.CANARIAS_LEVELS = CANARIAS_LEVELS;
  global.BUENOS_AIRES_LEVELS = BUENOS_AIRES_LEVELS;
  global.ROSARIO_LEVELS = ROSARIO_LEVELS;
  global.CORDOBA_LEVELS = CORDOBA_LEVELS;
  global.USHUAIA_LEVELS = USHUAIA_LEVELS;
  global.CHILE_SANTIAGO_LEVELS = CHILE_SANTIAGO_LEVELS;
  global.CHILE_VINA_LEVELS = CHILE_VINA_LEVELS;
  global.CHILE_ATACAMA_LEVELS = CHILE_ATACAMA_LEVELS;
  global.CHILE_PASCUA_LEVELS = CHILE_PASCUA_LEVELS;
  global.CITY_DEFS = CITY_DEFS;
  global.getCityZoneCount = getCityZoneCount;
  global.BackgroundRenderer = BackgroundRenderer;
})(window);
