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
  // Only the Play shell counts as an app referrer. Every Android app that opens
  // a link in a Custom Tab (the Google app, Gmail, Messages) sends its own
  // android-app:// referrer, and treating those as the game sent first-time
  // visitors from a phone straight past the hub.
  var APP = 'android-app://se.snails.app';

  // loc: { search, hash } · nav: { standalone } · matchMedia: function or null · referrer: string
  // Returns the game URL to go to, or null when the visitor really wants the hub.
  function legacyTarget(loc, nav, matchMedia, referrer) {
    var q = new URLSearchParams(loc.search || '');
    var query = KEYS.some(function (k) { return q.has(k); });
    var hash = HASH.test(loc.hash || '');
    var fromApp = typeof referrer === 'string' && (referrer === APP || referrer.indexOf(APP + '/') === 0);
    var app = !!(nav && nav.standalone) || fromApp;
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
