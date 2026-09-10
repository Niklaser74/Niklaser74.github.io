// The hub page: language, the garden hero and the small snails on the cards.
// The garden is drawn with the game's own renderers (js/game/, vendored from
// the snailmageddon repo) so the snails here are the snails in the games.
import { detectLang, setLang } from './i18n.js';
import { Terrain } from './game/terrain.js';
import { THEMES } from './game/themes.js';
import { drawSnail, TEAM_COLORS } from './game/snails.js';
import { mulberry32 } from './game/rng.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const theme = THEMES.garden;
const SEED = 20260909; // the day the series was decided; same garden every visit
const dpr = () => Math.min(2, window.devicePixelRatio || 1);

// ---------- language ----------
setLang(detectLang());
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---------- hero: the garden ----------
const hero = document.getElementById('garden');
const hctx = hero.getContext('2d');
let W = 0, H = 0, terrain = null, clouds = [], snails = [];

function layout() {
  const r = hero.getBoundingClientRect();
  W = Math.max(320, Math.round(r.width));
  H = Math.max(240, Math.round(r.height));
  const s = dpr();
  hero.width = Math.round(W * s);
  hero.height = Math.round(H * s);
  hctx.setTransform(s, 0, 0, s, 0, 0);
  const rng = mulberry32(SEED);
  terrain = new Terrain(W, H, rng, { theme });
  clouds = Array.from({ length: 6 }, () => ({ x: rng() * W, y: 30 + rng() * (H * 0.28), s: 0.7 + rng() * 0.9, v: 4 + rng() * 6 }));
  const n = W < 640 ? 3 : 4;
  snails = TEAM_COLORS.slice(0, n).map((c, i) => ({
    x: W * (0.1 + (i * 0.8) / n), color: c.hex, v: 5 + ((i * 3) % 7), phase: i * 1.7,
  }));
}

function hills(color, base) {
  hctx.fillStyle = color;
  hctx.beginPath();
  hctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) hctx.lineTo(x, H * base + Math.sin(x * 0.004) * 50 + Math.sin(x * 0.011 + 1) * 25);
  hctx.lineTo(W, H);
  hctx.closePath();
  hctx.fill();
}

function drawGarden(t) {
  // sky, sun and parallax hills exactly as Game.draw does it
  const sky = hctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(0.6, theme.sky[1]);
  sky.addColorStop(1, theme.sky[2]);
  hctx.fillStyle = sky;
  hctx.fillRect(0, 0, W, H);
  hctx.fillStyle = theme.sun;
  hctx.beginPath(); hctx.arc(W * 0.82, H * 0.16, 36, 0, Math.PI * 2); hctx.fill();
  hills(theme.hills[0], 0.5);
  hills(theme.hills[1], 0.62);
  hctx.fillStyle = theme.cloud;
  for (const c of clouds) {
    const x = ((c.x + c.v * t) % (W + 200)) - 100, r = 18 * c.s;
    hctx.beginPath();
    hctx.arc(x, c.y, r, 0, Math.PI * 2);
    hctx.arc(x + r, c.y + r * 0.3, r * 0.8, 0, Math.PI * 2);
    hctx.arc(x - r, c.y + r * 0.3, r * 0.7, 0, Math.PI * 2);
    hctx.fill();
  }
  hctx.drawImage(terrain.canvas, 0, 0);
  for (const s of snails) {
    const x = ((s.x + s.v * t) % (W + 80)) - 40; // crawl right, come back from the left
    const xi = Math.max(0, Math.min(W - 1, Math.round(x)));
    drawSnail(hctx, 'cartoon', { x, y: terrain.heights[xi], facing: 1, color: s.color, scale: 1.6, t: t + s.phase, walking: !reduced });
  }
}

// ---------- the small snails on the cards ----------
const cards = [...document.querySelectorAll('canvas.snail')].map((c) => {
  const s = dpr();
  c.width = Math.round(280 * s);
  c.height = Math.round(160 * s);
  const ctx = c.getContext('2d');
  ctx.setTransform(s, 0, 0, s, 0, 0);
  return { ctx, color: c.dataset.color || TEAM_COLORS[0].hex, style: c.dataset.style || 'cartoon', phase: Math.random() * 6 };
});
function drawCards(t) {
  for (const k of cards) {
    k.ctx.clearRect(0, 0, 280, 160);
    drawSnail(k.ctx, k.style, { x: 140, y: 132, facing: 1, color: k.color, scale: 3.2, t: t + k.phase, walking: !reduced });
  }
}

// ---------- loop ----------
layout();
let resizeTimer = 0;
new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { layout(); if (reduced) drawGarden(0); }, 150);
}).observe(hero);

if (reduced) {
  drawGarden(0);
  drawCards(0);
} else {
  const start = performance.now();
  const loop = (now) => {
    if (!document.hidden) { const t = (now - start) / 1000; drawGarden(t); drawCards(t); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
