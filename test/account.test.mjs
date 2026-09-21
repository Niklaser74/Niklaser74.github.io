// The shared account client, run in Node with a fake localStorage and fetch.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const jwt = (sub) => 'h.' + Buffer.from(JSON.stringify({ sub })).toString('base64url') + '.s';
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
const calls = [];
let responses = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), method: init.method || 'GET', auth: init.headers?.Authorization || null });
  const next = responses.shift() || { status: 200, body: {} };
  return { ok: next.status < 400, status: next.status, json: async () => next.body, text: async () => JSON.stringify(next.body) };
};

const { online } = await import('../js/account.js');
// the module caches the session in a closure; read the storage after each call to see what it wrote
const stored = (k) => JSON.parse(mem.get(k) || 'null');

beforeEach(() => { mem.clear(); calls.length = 0; responses = []; online.signOut(); });

test('no session: signedIn is false and nothing is fetched', () => {
  assert.equal(online.signedIn(), false);
  assert.equal(online.userId(), null);
  assert.equal(calls.length, 0);
});

test('a session left by the old per-game key is moved to snails.session', () => {
  const legacy = { access_token: jwt('u1'), refresh_token: 'r1', expires_at: Date.now() + 3600e3, user_id: 'u1' };
  mem.set('snackmageddon.session', JSON.stringify(legacy));
  assert.equal(online.signedIn(), true);
  assert.equal(online.userId(), 'u1');
  assert.deepEqual(stored('snails.session'), legacy, 'copied to the new key');
  assert.deepEqual(stored('snackmageddon.session'), legacy, 'the old copy is left for games not yet updated');
});

test('signing out removes both keys so the old copy cannot come back', () => {
  mem.set('snackmageddon.session', JSON.stringify({ access_token: jwt('u1'), refresh_token: 'r1', expires_at: Date.now() + 3600e3, user_id: 'u1' }));
  assert.equal(online.signedIn(), true);
  online.signOut();
  assert.equal(mem.has('snails.session'), false);
  assert.equal(mem.has('snackmageddon.session'), false);
  assert.equal(online.signedIn(), false);
});

test('rpc retries once after a 401 with a refreshed token', async () => {
  mem.set('snails.session', JSON.stringify({ access_token: 'old', refresh_token: 'r1', expires_at: Date.now() + 3600e3, user_id: 'u1' }));
  responses = [
    { status: 401, body: { message: 'JWT expired' } },
    { status: 200, body: { access_token: jwt('u1'), refresh_token: 'r2', expires_in: 3600, user: { id: 'u1' } } },
    { status: 200, body: { ok: true } },
  ];
  const out = await online.rpc('snails_profile');
  assert.deepEqual(out, { ok: true });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].auth, 'Bearer old');
  assert.match(calls[1].url, /token\?grant_type=refresh_token/);
  assert.equal(calls[2].auth, `Bearer ${jwt('u1')}`);
  assert.equal(stored('snails.session').refresh_token, 'r2');
});

test('with no session the first call signs in anonymously once, even for concurrent callers', async () => {
  responses = [
    { status: 200, body: { access_token: jwt('anon1'), refresh_token: 'r', expires_in: 3600, user: { id: 'anon1' } } },
    { status: 200, body: 1 },
    { status: 200, body: 2 },
  ];
  const [a, b] = await Promise.all([online.rpc('x'), online.rpc('y')]);
  assert.deepEqual([a, b], [1, 2]);
  assert.equal(calls.filter((c) => c.url.endsWith('/auth/v1/signup')).length, 1, 'one sign-up shared by both callers');
  assert.equal(online.userId(), 'anon1');
});

// ---------- login-CSRF: a callback is only accepted if this browser started one ----------
const smem = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (smem.has(k) ? smem.get(k) : null),
  setItem: (k, v) => smem.set(k, String(v)),
  removeItem: (k) => smem.delete(k),
};
globalThis.history = { replaceState: () => {} };
const arriveWith = (fragment) => {
  globalThis.location = { hash: '#' + fragment, search: '', pathname: '/account/' };
  return online.handleRedirect();
};
const tokens = (sub) => `access_token=${jwt(sub)}&refresh_token=r&expires_in=3600`;

test('an unsolicited Google callback is refused and stores nothing', () => {
  smem.clear();
  const back = arriveWith(tokens('attacker'));
  assert.equal(back.type, 'error');
  assert.equal(back.code, 'unsolicited');
  assert.equal(mem.has('snails.session'), false, 'the attacker session must not be stored');
  assert.equal(online.signedIn(), false);
});

test('a Google callback is accepted after startAuth', () => {
  smem.clear();
  online.startAuth();
  const back = arriveWith(tokens('u1'));
  assert.equal(back.type, 'oauth');
  assert.equal(stored('snails.session').user_id, 'u1');
});

test('one attempt buys one callback: a replayed link is refused', () => {
  smem.clear();
  online.startAuth();
  assert.equal(arriveWith(tokens('u1')).type, 'oauth');
  online.signOut();
  const again = arriveWith(tokens('attacker'));
  assert.equal(again.code, 'unsolicited');
  assert.equal(online.signedIn(), false);
});

test('an attempt older than fifteen minutes is refused', () => {
  smem.clear();
  smem.set('snails.pendingAuth', JSON.stringify({ at: Date.now() - 16 * 60 * 1000, uid: null }));
  assert.equal(arriveWith(tokens('attacker')).code, 'unsolicited');
  assert.equal(online.signedIn(), false);
});

test('a mail link on another device is held until the player confirms', () => {
  smem.clear();
  const back = arriveWith(tokens('u2') + '&type=magiclink');
  assert.equal(back.needsConfirm, true);
  assert.equal(back.type, 'magiclink');
  assert.equal(online.signedIn(), false, 'nothing is stored before the press');
  assert.equal(online.heldUserId(), 'u2', 'the page can say whose account it is');
  online.confirmHeld();
  assert.equal(stored('snails.session').user_id, 'u2');
});

test('a mail link opened where it was requested needs no confirmation', () => {
  smem.clear();
  online.startAuth();
  const back = arriveWith(tokens('u3') + '&type=magiclink');
  assert.equal(back.needsConfirm, undefined);
  assert.equal(stored('snails.session').user_id, 'u3');
});

test('a browser that blocks sessionStorage can still sign in with Google', () => {
  const real = globalThis.sessionStorage;
  Object.defineProperty(globalThis, 'sessionStorage', { get() { throw new Error('blocked'); }, configurable: true });
  try {
    const back = arriveWith(tokens('u4'));
    assert.equal(back.type, 'oauth', 'refusing here would lock the player out entirely');
  } finally {
    Object.defineProperty(globalThis, 'sessionStorage', { value: real, writable: true, configurable: true });
  }
});
