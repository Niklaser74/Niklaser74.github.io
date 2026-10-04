// The hub page: language, the garden hero and the small snails on the cards.
// The garden is drawn with the game's own renderers (js/game/, vendored from
// the snailmageddon repo) so the snails here are the snails in the games.
import { detectLang, setLang, t, getLang } from './i18n.js';
import { Terrain } from './game/terrain.js';
import { THEMES } from './game/themes.js';
import { drawSnail, TEAM_COLORS } from './game/snails.js';
import { mulberry32 } from './game/rng.js';
import { online } from './account.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { normalizeLook } from './game/cosmetics.js';
import { gameOfDay } from './daily.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const theme = THEMES.garden;
const SEED = 20260909; // the day the series was decided; same garden every visit
const dpr = () => Math.min(2, window.devicePixelRatio || 1);

// ---------- language ----------
setLang(detectLang());
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---------- dagens spel ----------
// One game leads the page each day (js/daily.js): its card goes first with a
// "Dagens spel" badge, and the hero's play button goes to it. Without JS the
// page still reads in its written order with Snäckmageddon in the hero.
const today = gameOfDay();
const todayCard = document.querySelector(`.card[data-game="${today}"]`);
const heroPlay = document.getElementById('hero-play');
if (todayCard) {
  todayCard.classList.add('today');
  todayCard.parentElement.prepend(todayCard);
  const badge = todayCard.querySelector('.badge');
  if (badge) { badge.dataset.i18n = 'badge.today'; badge.textContent = t('badge.today'); }
  heroPlay.href = `/${today}/`;
  heroPlay.removeAttribute('data-i18n'); // the text names the game; renderHero keeps it in the current language
}
function renderHero() {
  const title = todayCard?.querySelector('[data-title]');
  if (title) heroPlay.textContent = t('hero.today', { name: t(title.dataset.i18n) });
}
renderHero();
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', renderHero));

// ---------- account badge ----------
// Only a browser that already has a session is asked who it is; looking at the
// front page must never create an account.
(async () => {
  if (!online.signedIn()) return;
  const a = document.getElementById('acc-badge'), text = document.getElementById('acc-badge-text');
  try {
    const p = await online.rpc('snails_profile');
    const c = document.createElement('canvas');
    const s = dpr();
    c.width = 34 * s; c.height = 26 * s;
    const ctx = c.getContext('2d');
    ctx.setTransform(s, 0, 0, s, 0, 0);
    drawSnail(ctx, 'cartoon', { x: 17, y: 23, facing: 1, color: '#3aaa5c', scale: 0.55, t: 0, walking: false, look: normalizeLook(p.look || {}, p.unlocked || []) });
    a.prepend(c);
    text.removeAttribute('data-i18n');
    text.textContent = p.name || t('nav.account');
  } catch { text.dataset.i18n = 'nav.account'; text.textContent = t('nav.account'); }
})();

// ---------- live lines on the cards: Snigelkrattan and Snailman ----------
// snailrake_daily_leader, snailrake_week_top, snailrake_tourney_stats,
// snailman_daily_leader, snailman_contest_stats, snails_daily_leader and
// snailchess_streak_leader are open to anon (display names, scores and counts —
// what the boards show everyone), so this needs no account: plain calls with
// the publishable key, never online.rpc.
const live = { daily1: null, streak3: null, leader: null, week: null, stats: null, mine: null, snailman: null, smStats: null, smMine: null };
async function publicRpc(name) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: '{}',
  });
  if (!res.ok) throw new Error(`${name} ${res.status}`);
  return res.json();
}
const num = (n) => Number(n).toLocaleString(getLang() === 'sv' ? 'sv-SE' : 'en-GB');
// "2 tournaments running · 9 rounds played this week"; nothing when both are 0.
function statsLine(el, data, prefix) {
  if (!el || !data) return;
  const { open, rounds_week: rounds } = data;
  el.textContent = [
    open > 1 ? t(prefix + '.open', { open }) : open === 1 ? t(prefix + '.open1') : '',
    rounds > 1 ? t(prefix + '.rounds', { rounds }) : rounds === 1 ? t(prefix + '.rounds1') : '',
  ].filter(Boolean).join(' · ');
  el.hidden = !el.textContent;
}
// "Today X leads with N points · M have played", or an invitation to be first.
// prefix picks the card's strings: 'g1' Snäckmageddon, 'g2' Snailman, 'g3' Snäckschack
// (its "score" is the streak in days), 'g5' Snigelkrattan.
function leaderLine(el, data, prefix) {
  if (!el || !data) return;
  const top = data.leader;
  el.textContent = top
    ? t(prefix + (top.score === 1 && t(prefix + '.leader1') !== prefix + '.leader1' ? '.leader1' : '.leader'), { name: top.name, score: num(top.score) }) + (data.players > 1 ? ' · ' + t(prefix + '.players', { n: data.players }) : '')
    : t(prefix + '.noLeader');
  el.hidden = false;
}
function renderLive() {
  leaderLine(document.getElementById('g1-leader'), live.daily1, 'g1');
  leaderLine(document.getElementById('g3-leader'), live.streak3, 'g3');
  leaderLine(document.getElementById('g5-leader'), live.leader, 'g5');
  leaderLine(document.getElementById('g2-leader'), live.snailman, 'g2');
  const week = document.getElementById('g5-week');
  if (week && live.week) {
    const medals = ['🥇', '🥈', '🥉'];
    const rows = live.week.top.map((r, i) => `${medals[i]} ${r.name} ${num(r.score)}`);
    week.textContent = rows.length ? `${t('g5.week')} ${rows.join(' · ')}` : '';
    week.hidden = !rows.length;
  }
  statsLine(document.getElementById('g5-tourneys'), live.stats, 'g5');
  statsLine(document.getElementById('g2-contests'), live.smStats, 'g2');
  // Snailman's Snigelpost: the caller's running tournaments, their turn first
  const sm = document.getElementById('g2-mine');
  if (sm && live.smMine) {
    const running = live.smMine.slice(0, 3);
    sm.replaceChildren();
    if (running.length) {
      sm.append(t('g2.mine') + ' ');
      running.forEach((c, i) => {
        if (i) sm.append(' · ');
        const a = document.createElement('a');
        a.href = `/snailman/?contest=${encodeURIComponent(c.id)}`;
        a.textContent = c.next ? t('g2.turn', { round: c.next }) : t('g2.wait');
        sm.append(a, ` (${t('g2.left', { left: untilLabel(new Date(c.deadline) - new Date(c.now)) })})`);
      });
    }
    sm.hidden = !running.length;
  }
  // a browser that already has an account sees its own running tournaments, as links
  const mine = document.getElementById('g5-mine');
  if (mine && live.mine) {
    const running = live.mine.filter((m) => !m.final).slice(0, 3);
    mine.replaceChildren();
    if (running.length) {
      mine.append(t('g5.mine') + ' ');
      running.forEach((m, i) => {
        if (i) mine.append(' · ');
        const a = document.createElement('a');
        a.href = `/snailrake/?t=${encodeURIComponent(m.code)}`;
        a.textContent = m.code;
        const where = m.me_rank === 1 && m.players > 1 ? t('g5.lead') : m.me_rank ? t('g5.place', { rank: m.me_rank }) : t('g5.notYet');
        const left = m.status === 'open' ? ', ' + t('g5.left', { left: untilLabel(new Date(m.closes_at) - new Date(m.now)) }) : '';
        mine.append(a, ` (${where}${left})`);
      });
    }
    mine.hidden = !running.length;
  }
}
// "2 d 3 h", "5 h 10 min", "4 min" — the same label the game's lobby uses
function untilLabel(ms) {
  const m = Math.max(0, Math.ceil(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), min = m % 60;
  if (d) return h ? `${d} d ${h} h` : `${d} d`;
  if (h) return min ? `${h} h ${min} min` : `${h} h`;
  return `${min} min`;
}
if (SUPABASE_URL && SUPABASE_KEY) {
  publicRpc('snailrake_daily_leader').then((r) => { live.leader = r; renderLive(); }).catch(() => { /* the card reads fine without it */ });
  publicRpc('snailrake_week_top').then((r) => { live.week = r; renderLive(); }).catch(() => {});
  publicRpc('snailrake_tourney_stats').then((r) => { live.stats = r; renderLive(); }).catch(() => {});
  publicRpc('snailman_daily_leader').then((r) => { live.snailman = r; renderLive(); }).catch(() => {});
  publicRpc('snails_daily_leader').then((r) => { live.daily1 = r; renderLive(); }).catch(() => {});
  publicRpc('snailchess_streak_leader').then((r) => { live.streak3 = r; renderLive(); }).catch(() => {});
  publicRpc('snailman_contest_stats').then((r) => { live.smStats = r; renderLive(); }).catch(() => {});
  // only with a session this browser already has — the front page never creates an account
  if (online.signedIn()) {
    online.rpc('snailrake_tourney_mine').then((r) => { live.mine = r; renderLive(); }).catch(() => {});
    online.rpc('snailman_contest_mine_brief').then((r) => { live.smMine = r; renderLive(); }).catch(() => {});
  }
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', renderLive));

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
