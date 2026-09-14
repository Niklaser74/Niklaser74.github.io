// snails.se/account/ — the series' account page. Sign in, link an anonymous
// account to Google or e-mail, pick name and look. The same flows used to live
// in Snäckmageddon's menu; the client (js/account.js) is shared with the games.
import { online } from './account.js';
import { detectLang, setLang, getLang, t, applyDom } from './i18n.js';
import { drawSnail } from './game/snails.js';
import { SHELLS, HATS, DEFAULT_LOOK, normalizeLook } from './game/cosmetics.js';

const $ = (id) => document.getElementById(id);
setLang(detectLang());

// Where to go back: ?next=/snailchess/ from a game, kept across the OAuth round-trip
const NEXT_KEY = 'snails.next', BEFORE_KEY = 'snails.beforeOauth';
const nextParam = new URLSearchParams(location.search).get('next');
let next = null;
try { next = nextParam || sessionStorage.getItem(NEXT_KEY); if (nextParam) sessionStorage.setItem(NEXT_KEY, nextParam); } catch { /* storage blocked */ }
if (next && /^\/[a-z0-9-]+\/?$/i.test(next)) { $('acc-back').href = next; $('acc-back').dataset.i18n = 'acc.backToGame'; } // applyDom() below sets the text

const redirectTo = () => location.origin + location.pathname; // https://snails.se/account/
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const msg = (text) => { $('acc-msg').textContent = text; };
const accountError = (e) => {
  if (e.code === 'rate_limit') return t('acc.rateLimited');
  if (e.code === 'email_exists' || /already been registered/i.test(e.message)) return t('acc.emailTaken');
  if (/signups? not allowed|not found|otp_disabled/i.test(e.message)) return t('acc.noAccount');
  return t('acc.error', { msg: e.message });
};

// ---------- the snail ----------
let look = { ...DEFAULT_LOOK };
function drawMe() {
  const c = $('acc-snail'), ctx = c.getContext('2d');
  const s = Math.min(2, window.devicePixelRatio || 1);
  c.width = 220 * s; c.height = 140 * s;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, 220, 140);
  drawSnail(ctx, 'cartoon', { x: 110, y: 118, facing: 1, color: '#3aaa5c', scale: 2.6, t: 0, walking: false, look });
}

// ---------- status ----------
async function render() {
  const st = $('acc-status');
  $('acc-signin').hidden = true; $('acc-link').hidden = true; $('btn-logout').hidden = true; $('acc-profile').hidden = true;
  if (!online.signedIn()) { st.textContent = t('acc.noSession'); $('acc-signin').hidden = false; drawMe(); return; }
  try {
    const u = await online.user(true);
    if (u.email && !u.anonymous) { st.textContent = t(u.provider === 'google' ? 'acc.linkedVia' : 'acc.linked', { email: u.email }); $('btn-logout').hidden = false; }
    else if (u.pendingEmail) { st.textContent = t('acc.pending', { email: u.pendingEmail }); $('acc-link').hidden = false; }
    else { st.textContent = t('acc.anonymous'); $('acc-link').hidden = false; }
    $('acc-profile').hidden = false;
    await loadProfile();
  } catch (e) { st.textContent = t('acc.offline'); drawMe(); }
}

// ---------- sign in / link ----------
const goGoogle = async (link) => {
  try {
    try { sessionStorage.setItem(BEFORE_KEY, online.userId() || ''); } catch { /* ignore */ }
    location.assign(await online.googleUrl(redirectTo(), link));
  } catch (e) { msg(accountError(e)); }
};
$('btn-google').addEventListener('click', () => goGoogle(true));
$('btn-google-login').addEventListener('click', () => goGoogle(false));
$('btn-google-instead').addEventListener('click', () => goGoogle(false));

const emailAction = (btn, input, fn) => btn.addEventListener('click', async () => {
  const email = $(input).value.trim().toLowerCase();
  if (!emailOk(email)) { msg(t('acc.invalid')); return; }
  btn.disabled = true;
  try { msg(await fn(email)); } catch (e) { msg(accountError(e)); }
  btn.disabled = false;
  render();
});
emailAction($('btn-link-email'), 'acc-email', async (email) => { await online.linkEmail(email, redirectTo()); return t('acc.linkSent', { email }); });
emailAction($('btn-login-email-2'), 'acc-email', async (email) => { await online.sendLoginLink(email, redirectTo()); return t('acc.loginSent', { email }); });
emailAction($('btn-login-email'), 'acc-email-login', async (email) => { await online.sendLoginLink(email, redirectTo()); return t('acc.loginSent', { email }); });
$('btn-logout').addEventListener('click', () => { online.signOut(); location.reload(); });

// coming back from Google or a mail link
const afterAuth = async (back) => {
  if (back.type === 'error') {
    if (back.code === 'identity_already_exists' || back.code === 'email_exists') { msg(t('acc.googleTaken')); $('btn-google-instead').hidden = false; }
    else msg(t('acc.error', { msg: back.message }));
  } else {
    const now = await online.ensureUserId().catch(() => null);
    let before = null;
    try { before = sessionStorage.getItem(BEFORE_KEY); sessionStorage.removeItem(BEFORE_KEY); } catch { /* ignore */ }
    const same = back.type === 'email_change' || (back.type === 'oauth' && !!before && before === now);
    msg(t(same ? 'acc.welcomeLinked' : 'acc.welcomeLogin'));
  }
  render();
};
const back = online.handleRedirect();
if (back) afterAuth(back);
// scanner-proof mail link: the token is spent only when the player presses the button
const q = new URLSearchParams(location.search);
if (q.get('token_hash') && q.get('type')) {
  const tokenHash = q.get('token_hash'), type = q.get('type');
  q.delete('token_hash'); q.delete('type');
  history.replaceState(null, '', location.pathname + ([...q].length ? '?' + q : ''));
  msg(t('acc.confirmHint'));
  $('btn-confirm').hidden = false;
  $('btn-confirm').addEventListener('click', async () => {
    $('btn-confirm').disabled = true;
    try { await afterAuth(await online.verifyToken(tokenHash, type)); $('btn-confirm').hidden = true; }
    catch (e) { msg(accountError(e)); $('btn-confirm').disabled = false; }
  });
}

// ---------- name and look ----------
let unlocked = [];
async function loadProfile() {
  const p = await online.rpc('snails_profile');
  unlocked = p.unlocked || [];
  look = normalizeLook(p.look || {}, unlocked);
  $('acc-name').value = p.name || '';
  buildPicker('pick-shell', SHELLS, 'shell');
  buildPicker('pick-hat', HATS, 'hat');
  drawMe();
}
function buildPicker(id, items, kind) {
  const box = $(id);
  box.innerHTML = '';
  for (const c of items) {
    const locked = !unlocked.includes(c.id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = (look[kind] === c.id ? 'sel' : '') + (locked ? ' locked' : '');
    b.disabled = locked;
    b.textContent = (locked ? '🔒 ' : '') + t(`cos.${kind}.${c.id}`);
    if (!locked) b.addEventListener('click', () => { look[kind] = c.id; buildPicker(id, items, kind); drawMe(); });
    box.appendChild(b);
  }
}
$('btn-save').addEventListener('click', async () => {
  $('btn-save').disabled = true;
  try {
    const p = await online.rpc('snails_profile_set', { p_name: $('acc-name').value.trim().slice(0, 24), p_look: look });
    look = normalizeLook(p.look || look, p.unlocked || unlocked);
    $('acc-profile-msg').textContent = t('acc.saved');
    drawMe();
  } catch (e) { $('acc-profile-msg').textContent = t('acc.error', { msg: e.message }); }
  $('btn-save').disabled = false;
});

document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); render(); }));
applyDom();
render();
void getLang;
