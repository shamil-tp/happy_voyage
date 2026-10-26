/**
 * Happy Voyage · Generative Animated Truchet Engine
 * Dedicated to: Fasil
 * Features: Seeded Palettes, Continuous Flow Animation, Interactive Ripple, Confetti
 */

// PRNG Utilities
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded Palettes (Matching Screenshot)
const PALETTES = {
  classic: {
    name: 'Shamil Classic',
    bg: '#edf5f0',
    colors: ['#009f6b', '#fca8b1', '#794bf3', '#18181b'],
    accent: '#009f6b'
  },
  sunset: {
    name: 'Sunset Voyage',
    bg: '#faf4ed',
    colors: ['#d97706', '#f87171', '#4338ca', '#1c1917'],
    accent: '#d97706'
  },
  cyber: {
    name: 'Cyberpunk',
    bg: '#f0f4ff',
    colors: ['#06b6d4', '#f43f5e', '#8b5cf6', '#0f172a'],
    accent: '#06b6d4'
  },
  kerala: {
    name: 'Kerala Monsoon',
    bg: '#edf7f2',
    colors: ['#047857', '#fbbf24', '#0f766e', '#132e22'],
    accent: '#047857'
  },
  monochrome: {
    name: 'Monochrome',
    bg: '#f4f4f5',
    colors: ['#18181b', '#52525b', '#a1a1aa', '#27272a'],
    accent: '#18181b'
  }
};

const SURPRISE_WORDS = [
  'austria-bound', 'msc-comp-sci', 'vienna-skies', 'fasil-scholar',
  'smooth-runway', 'wanderlust', 'boundless', 'bon-voyage-fasil'
];

// App State
const state = {
  seed: 'fasil-austria-msc-cs',
  paletteKey: 'classic',
  tileSize: 80,
  strokeWidth: 15,
  flowAnimation: true,
  dashOffset: 0,
  mouse: { x: -1000, y: -1000, targetX: -1000, targetY: -1000 },
  audioCtx: null,
  animatingRegen: false,
  regenProgress: 1
};

// Canvas & Context
const canvas = document.getElementById('truchet-canvas');
const ctx = canvas.getContext('2d');

// Subtle Web Audio Synthesis
function playChime(freq = 520) {
  try {
    if (!state.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioContextClass();
    }
    if (!state.audioCtx) return;
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    const now = state.audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(state.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {}
}

// Resize Canvas
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

// Render Truchet Loop
function drawScene(time) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const palette = PALETTES[state.paletteKey] || PALETTES.classic;

  // Clear background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  const tileSize = state.tileSize;
  const cols = Math.ceil(width / tileSize) + 1;
  const rows = Math.ceil(height / tileSize) + 1;
  const R = tileSize / 2;

  const baseHash = xmur3(state.seed)();

  // Mouse interpolation
  state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.1;
  state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.1;

  // Flow animation offset
  if (state.flowAnimation) {
    state.dashOffset = (time * 0.04) % (tileSize * 2);
  }

  // 1. Pass: Draw base solid curves
  ctx.lineWidth = state.strokeWidth;
  ctx.lineCap = 'round';
  ctx.setLineDash([]); // solid

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize;
      const y = r * tileSize;

      const tileSeed = (baseHash + c * 374761393 + r * 668265263) >>> 0;
      const rng = mulberry32(tileSeed);

      // Determine orientation
      let orientation = rng() > 0.5 ? 1 : 0;

      // Mouse ripple effect: tiles near cursor have a chance to invert orientation
      const dist = Math.hypot((x + R) - state.mouse.x, (y + R) - state.mouse.y);
      if (dist < 120) {
        const ripple = Math.sin((dist / 120) * Math.PI);
        if (ripple > 0.6) {
          orientation = 1 - orientation;
        }
      }

      const color1 = palette.colors[Math.floor(rng() * palette.colors.length)];
      const color2 = palette.colors[Math.floor(rng() * palette.colors.length)];

      const arcProgress = state.regenProgress;

      if (orientation === 0) {
        ctx.beginPath();
        ctx.strokeStyle = color1;
        ctx.arc(x, y, R, 0, (Math.PI / 2) * arcProgress, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = color2;
        ctx.arc(x + tileSize, y + tileSize, R, Math.PI, Math.PI + ((Math.PI / 2) * arcProgress), false);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.strokeStyle = color1;
        ctx.arc(x + tileSize, y, R, Math.PI / 2, (Math.PI / 2) + ((Math.PI / 2) * arcProgress), false);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = color2;
        ctx.arc(x, y + tileSize, R, 1.5 * Math.PI, (1.5 * Math.PI) + ((Math.PI / 2) * arcProgress), false);
        ctx.stroke();
      }
    }
  }

  // 2. Pass: Flowing glowing packets along the paths (if enabled)
  if (state.flowAnimation && state.regenProgress === 1) {
    ctx.lineWidth = Math.max(3, state.strokeWidth * 0.35);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.setLineDash([tileSize * 0.18, tileSize * 0.82]);
    ctx.lineDashOffset = -state.dashOffset;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tileSize;
        const y = r * tileSize;

        const tileSeed = (baseHash + c * 374761393 + r * 668265263) >>> 0;
        const rng = mulberry32(tileSeed);
        let orientation = rng() > 0.5 ? 1 : 0;

        const dist = Math.hypot((x + R) - state.mouse.x, (y + R) - state.mouse.y);
        if (dist < 120 && Math.sin((dist / 120) * Math.PI) > 0.6) {
          orientation = 1 - orientation;
        }

        if (orientation === 0) {
          ctx.beginPath();
          ctx.arc(x, y, R, 0, Math.PI / 2, false);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x + tileSize, y + tileSize, R, Math.PI, 1.5 * Math.PI, false);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x + tileSize, y, R, Math.PI / 2, Math.PI, false);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y + tileSize, R, 1.5 * Math.PI, 2 * Math.PI, false);
          ctx.stroke();
        }
      }
    }
  }

  requestAnimationFrame(drawScene);
}

// Pattern Regeneration Animation
function triggerRegenerationAnimation() {
  playChime(640);
  state.animatingRegen = true;
  state.regenProgress = 0;

  const startTime = performance.now();
  const duration = 450; // ms

  function step(now) {
    const elapsed = now - startTime;
    const p = Math.min(elapsed / duration, 1);
    // Smooth ease-out cubic
    state.regenProgress = 1 - Math.pow(1 - p, 3);

    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      state.regenProgress = 1;
      state.animatingRegen = false;
    }
  }

  requestAnimationFrame(step);
}

// Set New Seed
function setSeed(newSeed, animate = true) {
  state.seed = newSeed;
  updateBoardingPassPattern();

  if (animate) {
    triggerRegenerationAnimation();
  }
}

// Surprise Me Action
function surpriseMe() {
  const word = SURPRISE_WORDS[Math.floor(Math.random() * SURPRISE_WORDS.length)];
  const num = Math.floor(Math.random() * 900 + 100);
  const newSeed = `${word}-${num}`;

  const keys = Object.keys(PALETTES);
  const nextPalette = keys[Math.floor(Math.random() * keys.length)];
  setPalette(nextPalette);

  setSeed(newSeed, true);
  showToast(`✨ ${PALETTES[nextPalette].name} (${newSeed})`);
}

// Set Palette
function setPalette(key) {
  if (!PALETTES[key]) return;
  state.paletteKey = key;
  document.documentElement.setAttribute('data-palette', key);

  const nameEl = document.getElementById('current-palette-name');
  if (nameEl) nameEl.textContent = PALETTES[key].name.split(' ')[0];

  document.querySelectorAll('.palette-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.palette === key);
  });

  updateBoardingPassPattern();
}

// Toast helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// Confetti Celebration
function fireConfetti() {
  playChime(880);
  const palette = PALETTES[state.paletteKey] || PALETTES.classic;
  const confettiCanvas = document.createElement('canvas');
  confettiCanvas.style.position = 'fixed';
  confettiCanvas.style.inset = '0';
  confettiCanvas.style.width = '100vw';
  confettiCanvas.style.height = '100vh';
  confettiCanvas.style.pointerEvents = 'none';
  confettiCanvas.style.zIndex = '500';
  document.body.appendChild(confettiCanvas);

  const cCtx = confettiCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  confettiCanvas.width = window.innerWidth * dpr;
  confettiCanvas.height = window.innerHeight * dpr;
  cCtx.scale(dpr, dpr);

  const particles = [];
  const count = 90;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.75) * 20,
      size: Math.random() * 8 + 6,
      color: palette.colors[Math.floor(Math.random() * palette.colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      alpha: 1
    });
  }

  const startTime = performance.now();
  function loop(now) {
    const elapsed = now - startTime;
    cCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let active = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // gravity
      p.rotation += p.vRot;
      p.alpha = Math.max(0, 1 - elapsed / 2200);

      if (p.alpha > 0) {
        active = true;
        cCtx.save();
        cCtx.translate(p.x, p.y);
        cCtx.rotate((p.rotation * Math.PI) / 180);
        cCtx.fillStyle = p.color;
        cCtx.globalAlpha = p.alpha;
        cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        cCtx.restore();
      }
    });

    if (active && elapsed < 2400) {
      requestAnimationFrame(loop);
    } else {
      confettiCanvas.remove();
    }
  }

  requestAnimationFrame(loop);
}

// Update Boarding Pass Mini Pattern
function updateBoardingPassPattern() {
  const container = document.getElementById('ticket-pattern-container');
  if (!container) return;

  const palette = PALETTES[state.paletteKey] || PALETTES.classic;
  container.innerHTML = `
    <svg viewBox="0 0 400 52" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="background: ${palette.bg}">
      <path d="M 0 26 Q 50 6 100 26 T 200 26 T 300 26 T 400 26" stroke="${palette.colors[0]}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 0 26 Q 50 46 100 26 T 200 26 T 300 26 T 400 26" stroke="${palette.colors[1]}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="26" r="8" fill="${palette.colors[2]}"/>
      <circle cx="200" cy="26" r="8" fill="${palette.colors[3]}"/>
      <circle cx="300" cy="26" r="8" fill="${palette.colors[0]}"/>
    </svg>
  `;
}

// Event Listeners
function setupEvents() {
  // Regenerate pattern button on card
  const btnRegen = document.getElementById('btn-regen');
  if (btnRegen) {
    btnRegen.addEventListener('click', () => {
      const num = Math.floor(Math.random() * 900 + 100);
      setSeed(`fasil-path-${num}`, true);
      showToast('🔀 Pattern regenerated!');
    });
  }

  // Surprise me button
  const btnSurprise = document.getElementById('btn-surprise');
  if (btnSurprise) {
    btnSurprise.addEventListener('click', surpriseMe);
  }

  // Bon Voyage Celebrate button
  const btnBonVoyage = document.getElementById('btn-bon-voyage');
  if (btnBonVoyage) {
    btnBonVoyage.addEventListener('click', () => {
      fireConfetti();
      showToast('🇦🇹 Bon Voyage, Fasil! All the best for MSc CS in Austria!');
    });
  }

  // Fasil Photo click interaction
  const photoTrigger = document.getElementById('photo-trigger');
  if (photoTrigger) {
    photoTrigger.addEventListener('click', () => {
      fireConfetti();
      showToast('🎓 Fasil · Austria Bound for MSc Computer Science! 🇦🇹');
    });
  }

  // Menu Modal
  const btnMenu = document.getElementById('btn-menu');
  const pillLabel = document.getElementById('pill-label-trigger');
  const menuOverlay = document.getElementById('menu-overlay');
  const btnCloseMenu = document.getElementById('btn-close-menu');

  function openMenu() {
    if (menuOverlay) menuOverlay.classList.add('active');
  }

  function closeMenu() {
    if (menuOverlay) menuOverlay.classList.remove('active');
  }

  if (btnMenu) btnMenu.addEventListener('click', openMenu);
  if (pillLabel) pillLabel.addEventListener('click', openMenu);
  if (btnCloseMenu) btnCloseMenu.addEventListener('click', closeMenu);

  if (menuOverlay) {
    menuOverlay.addEventListener('click', (e) => {
      if (e.target === menuOverlay) closeMenu();
    });
  }

  // Palette switching options
  document.querySelectorAll('.palette-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setPalette(opt.dataset.palette);
      playChime(580);
      showToast(`Palette: ${PALETTES[opt.dataset.palette].name}`);
    });
  });

  // Flow animation toggle
  const btnToggleFlow = document.getElementById('btn-toggle-flow');
  if (btnToggleFlow) {
    btnToggleFlow.addEventListener('click', () => {
      state.flowAnimation = !state.flowAnimation;
      btnToggleFlow.textContent = state.flowAnimation ? 'Active ⚡' : 'Paused ⏸️';
      btnToggleFlow.style.background = state.flowAnimation ? 'var(--color-green)' : '#71717a';
    });
  }

  // Boarding Pass Modal
  const btnOpenPass = document.getElementById('btn-open-pass');
  const modalPass = document.getElementById('modal-boarding-pass');
  const btnClosePass = document.getElementById('btn-close-pass');
  const btnPrintPass = document.getElementById('btn-print-pass');

  if (btnOpenPass && modalPass) {
    btnOpenPass.addEventListener('click', () => {
      updateBoardingPassPattern();
      modalPass.classList.add('active');
    });
  }

  if (btnClosePass && modalPass) {
    btnClosePass.addEventListener('click', () => modalPass.classList.remove('active'));
  }

  if (modalPass) {
    modalPass.addEventListener('click', (e) => {
      if (e.target === modalPass) modalPass.classList.remove('active');
    });
  }

  if (btnPrintPass) {
    btnPrintPass.addEventListener('click', () => window.print());
  }

  // Mouse / Touch ripple tracking
  window.addEventListener('mousemove', (e) => {
    state.mouse.targetX = e.clientX;
    state.mouse.targetY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    state.mouse.targetX = -1000;
    state.mouse.targetY = -1000;
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches[0]) {
      state.mouse.targetX = e.touches[0].clientX;
      state.mouse.targetY = e.touches[0].clientY;
    }
  }, { passive: true });

  // Window Resize
  window.addEventListener('resize', resizeCanvas);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  setupEvents();
  updateBoardingPassPattern();
  requestAnimationFrame(drawScene);
});
