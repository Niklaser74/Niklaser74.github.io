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
