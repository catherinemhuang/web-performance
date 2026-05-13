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

  drawDotBorder(inputDots, 'rgba(212, 255, 0, 1)');
  drawDotBorder(btnDots, 'rgba(255, 71, 227, 0.75)');
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
      const fullText = `WELCOME, ${name.toUpperCase()}`;

      const welcome = getEl('welcome');
      const welcomeText = getEl('welcome-text');
      const startBtn1 = getEl('start-btn1');

      if (!welcome || !welcomeText) return;

      // Hide the button until typing is done
      if (startBtn1) startBtn1.style.opacity = '0';

      welcomeText.textContent = '';
      welcome.classList.add('show');

      // Typewriter
      const cursor = '\u258C';
      let idx = 0;
      welcomeText.textContent = cursor;

      const typeInterval = setInterval(() => {
        if (idx < fullText.length) {
          welcomeText.textContent = fullText.slice(0, idx + 1) + cursor;
          idx++;
        } else {
          // Blink cursor 3 times then reveal button
          let blinks = 0;
          const blinkInterval = setInterval(() => {
            welcomeText.textContent = (blinks % 2 === 0)
              ? fullText
              : fullText + cursor;
            blinks++;
            if (blinks >= 6) {
              clearInterval(blinkInterval);
              welcomeText.textContent = fullText;
              if (startBtn1) {
                startBtn1.style.transition = 'opacity 0.5s ease';
                startBtn1.style.opacity = '1';
              }
            }
          }, 300);
          clearInterval(typeInterval);
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