// snails.se served Snäckmageddon at the root until September 2026. Invitation
// links, app shortcuts, push notifications, Stripe returns and Supabase e-mail/
// OAuth returns from that time still arrive at "/", and installed copies of the
// game open "/". This decides whether a request to the hub is really one of
// those and where it should go instead.
//
// Classic script (no module) so index.html can run it before anything renders;
// test/legacy.test.mjs loads it in Node the same way.
(function (root) {
  var GAME = '/snailmageddon/';
  // query keys the game used or received at the root
  var KEYS = ['match', 'daily', 'day', 'seed', 'bought', 'cancelled', 'twa', 'platform', 'noanalytics', 'pokidebug',
    'token_hash', 'type', 'error', 'error_code', 'error_description'];
  // Supabase puts the session (or an OAuth error) in the fragment
  var HASH = /(^#|[#&])(access_token|refresh_token|error|type)=/;
  // an installed copy of the old game (PWA or Play TWA) opens the root in one of these
  var MODES = ['standalone', 'fullscreen', 'minimal-ui'];

  // loc: { search, hash } · nav: { standalone } · matchMedia: function or null · referrer: string
  // Returns the game URL to go to, or null when the visitor really wants the hub.
  function legacyTarget(loc, nav, matchMedia, referrer) {
    var q = new URLSearchParams(loc.search || '');
    var query = KEYS.some(function (k) { return q.has(k); });
    var hash = HASH.test(loc.hash || '');
    var app = !!(nav && nav.standalone) || (typeof referrer === 'string' && referrer.indexOf('android-app://') === 0);
    if (!app && typeof matchMedia === 'function') {
      app = MODES.some(function (m) {
        try { return matchMedia('(display-mode: ' + m + ')').matches; } catch (e) { return false; }
      });
    }
    if (!query && !hash && !app) return null;
    return GAME + (loc.search || '') + (loc.hash || '');
  }

  root.legacyTarget = legacyTarget;
})(typeof self !== 'undefined' ? self : globalThis);
