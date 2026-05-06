// ─── GLOBAL STATE (shared with p5) ─────
window.gameState = "intro";
window.foods = [];
window.Chapter1generated = false;

// ─── SAFE ELEMENT GETTER ───────────────
function getEl(id) {
  return document.getElementById(id);
}

// ─── Cursor ───────────────────────────
const cursor = getEl('cursor');
const coordTL = getEl('coord-tl');

document.addEventListener('mousemove', e => {
  if (cursor) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  }

  if (coordTL) {
    coordTL.textContent =
      `${(e.clientX / window.innerWidth * 100).toFixed(2)} / ${(e.clientY / window.innerHeight * 100).toFixed(2)}`;
  }
});

// ─── Dot Borders ──────────────────────
function drawDotBorder(canvas, color, spacing = 10) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;

  const r = 2.5;
  const cols = Math.floor(W / spacing);
  const rows = Math.floor(H / spacing);

  const xOff = (W - (cols - 1) * spacing) / 2;
  const yOff = (H - (rows - 1) * spacing) / 2;

  for (let c = 0; c < cols; c++) {
    for (let r2 = 0; r2 < rows; r2++) {
      if (c === 0 || c === cols - 1 || r2 === 0 || r2 === rows - 1) {
        const x = xOff + c * spacing;
        const y = yOff + r2 * spacing;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function initDotCanvases() {
  const inputDots = getEl('input-dots');
  const btnDots = getEl('btn-dots');

  const inputWrap = document.querySelector('.dot-input-container');
  const btnWrap = document.querySelector('.btn-wrap');

  if (!inputWrap || !btnWrap || !inputDots || !btnDots) return;

  inputDots.width = inputWrap.offsetWidth;
  inputDots.height = inputWrap.offsetHeight;

  btnDots.width = btnWrap.offsetWidth;
  btnDots.height = btnWrap.offsetHeight;

  drawDotBorder(inputDots, 'rgba(0,255,150,0.5)');
  drawDotBorder(btnDots, 'rgba(0,200,255,0.5)');
}

// Run AFTER DOM is ready (fixes most bugs)
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initDotCanvases, 100);

  // ─── Input display ──────────────────
  const nameInput = getEl('name-input');
  const nameDisplay = getEl('name-display');

  if (nameInput && nameDisplay) {
    nameInput.addEventListener('input', () => {
      nameDisplay.textContent = nameInput.value;
    });
  }

  // ─── Start button ───────────────────
  const startBtn = getEl('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const name = (nameInput?.value || '').trim() || 'STRANGER';

      const welcome = getEl('welcome');
      const welcomeText = getEl('welcome-text');

      if (welcomeText) {
        welcomeText.textContent = `WELCOME, ${name.toUpperCase()}`;
      }

      if (welcome) {
        welcome.classList.add('show');

        setTimeout(() => {
          welcome.classList.remove('show');
        }, 2800);
      }
    });
  }

  // ─── LET'S GO BUTTON ────────────────
  const startBtn1 = getEl('start-btn1');
  if (startBtn1) {
    startBtn1.addEventListener('click', () => {
      const ui = getEl('ui');
      const welcome = getEl('welcome');

      if (ui) ui.style.display = 'none';
      if (welcome) welcome.classList.remove('show');

      // IMPORTANT: switch global state
      window.gameState = "Chapter1";

      // reset scene safely for p5
      window.foods = [];
      window.Chapter1generated = false;

      // reset snake size to original
      if (window.resetSnake) window.resetSnake();
    });
  }
});

window.addEventListener('resize', initDotCanvases);

// ─── BACKGROUND AUDIO ────────────────
const bgAudio = getEl('bg-audio');
const muteBtn = getEl('mute-btn');
const iconSound = getEl('icon-sound');
const iconMute = getEl('icon-mute');
let bgStarted = false;

function startBgAudio() {
  if (bgStarted || !bgAudio) return;
  bgStarted = true;
  bgAudio.volume = 0.5;
  bgAudio.play().catch(() => {});
}

// Start on first interaction
document.addEventListener('mousedown', startBgAudio, { once: true });
document.addEventListener('click', startBgAudio, { once: true });

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    if (!bgAudio) return;
    bgAudio.muted = !bgAudio.muted;
    iconSound.style.display = bgAudio.muted ? 'none' : '';
    iconMute.style.display  = bgAudio.muted ? '' : 'none';
  });
}