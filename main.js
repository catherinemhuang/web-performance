// ─── Cursor ─────────────────────────────
const cursor = document.getElementById('cursor');
const coordTL = document.getElementById('coord-tl');

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';

  coordTL.textContent =
    `${(e.clientX/window.innerWidth*100).toFixed(2)} / ${(e.clientY/window.innerHeight*100).toFixed(2)}`;
});

// ─── Dot Borders ────────────────────────
function drawDotBorder(canvas, color, spacing = 10) {
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
      if (c===0 || c===cols-1 || r2===0 || r2===rows-1) {
        const x = xOff + c*spacing;
        const y = yOff + r2*spacing;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }
}

function initDotCanvases() {
  const inputDots = document.getElementById('input-dots');
  const btnDots = document.getElementById('btn-dots');

  const inputWrap = document.querySelector('.dot-input-container');
  const btnWrap = document.querySelector('.btn-wrap');

  inputDots.width = inputWrap.offsetWidth;
  inputDots.height = inputWrap.offsetHeight;

  btnDots.width = btnWrap.offsetWidth;
  btnDots.height = btnWrap.offsetHeight;

  drawDotBorder(inputDots, 'rgba(0,255,150,0.5)');
  drawDotBorder(btnDots, 'rgba(0,200,255,0.5)');
}

window.addEventListener('load', () => {
  setTimeout(initDotCanvases, 100);
});
window.addEventListener('resize', initDotCanvases);

// ─── Input display ──────────────────────
const nameInput = document.getElementById('name-input');
const nameDisplay = document.getElementById('name-display');

nameInput.addEventListener('input', () => {
  nameDisplay.textContent = nameInput.value;
});

// ─── Start button ───────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  const name = nameInput.value.trim() || 'STRANGER';

  const welcome = document.getElementById('welcome');
  document.getElementById('welcome-text').textContent =
    `WELCOME, ${name.toUpperCase()}`;

  welcome.classList.add('show');

  setTimeout(() => {
    welcome.classList.remove('show');
  }, 2800);
});