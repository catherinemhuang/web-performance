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
  const btnDots = getEl('btn-dots');
  const btnWrap = document.querySelector('#ui .btn-wrap');

  if (!btnWrap || !btnDots) return;

  btnDots.width = btnWrap.offsetWidth;
  btnDots.height = btnWrap.offsetHeight;

  drawDotBorder(btnDots, 'rgba(255, 71, 227, 0.75)');

  const btnDotsWelcome = getEl('btn-dots-welcome');
  const welcomeBtnWrap = document.querySelector('#welcome .btn-wrap');
  if (btnDotsWelcome && welcomeBtnWrap) {
    btnDotsWelcome.width = welcomeBtnWrap.offsetWidth;
    btnDotsWelcome.height = welcomeBtnWrap.offsetHeight;
  }
}

// Run AFTER DOM is ready (fixes most bugs)
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initDotCanvases, 100);

  // ─── Start button ───────────────────
  const startBtn = getEl('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const fullText = 'WELCOME, STRANGER';

      const welcome = getEl('welcome');
      const welcomeText = getEl('welcome-text');
      const startBtn1 = getEl('start-btn1');

      if (!welcome || !welcomeText) return;

      // Hide the home UI
      const ui = getEl('ui');
      if (ui) { ui.style.opacity = '0'; ui.style.pointerEvents = 'none'; }

      // Force welcome visible before transition
      welcome.style.display = 'flex';
      welcome.style.zIndex = '500';
      welcomeText.textContent = '';

      // Let display:flex take effect before opacity transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          welcome.classList.add('show');
        });
      });

      // Hide LET'S GO until typing finishes
      if (startBtn1) { startBtn1.style.opacity = '0'; startBtn1.style.pointerEvents = 'none'; }

      // Typewriter — letter by letter, no blink
      let idx = 0;
      const typeInterval = setInterval(() => {
        if (idx < fullText.length) {
          welcomeText.textContent = fullText.slice(0, idx + 1);
          idx++;
        } else {
          clearInterval(typeInterval);
          if (startBtn1) {
            startBtn1.style.transition = 'opacity 0.5s ease';
            startBtn1.style.opacity = '1';
            startBtn1.style.pointerEvents = 'all';
          }
        }
      }, 60);
    });
  }

  // ─── LET'S GO BUTTON ────────────────
  const startBtn1 = getEl('start-btn1');
  if (startBtn1) {
    startBtn1.addEventListener('click', () => {
      const ui = getEl('ui');
      const welcome = getEl('welcome');

      if (ui) { ui.style.display = 'none'; ui.style.opacity = ''; ui.style.pointerEvents = ''; }
      if (welcome) { welcome.classList.remove('show'); welcome.style.display = ''; welcome.style.zIndex = ''; }

      window.gameState = "Chapter1";
      window.foods = [];
      window.Chapter1generated = false;

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