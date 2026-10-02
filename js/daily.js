// Dagens spel: which game leads the front page today. The same for everyone on
// the same day, Swedish time, and every game gets its day in turn — a fixed
// rotation rather than a random pick, so no game goes a week without a turn.
// No DOM, so test/daily.test.mjs runs it in Node.

// The rotation. A new game goes in here and in index.html (data-game on its card).
export const GAMES = ['snailmageddon', 'snailrake', 'snailrow', 'snailchess', 'snailman', 'snailstory'];

// Days since 1970-01-01 by the calendar in Stockholm, so the game changes at
// midnight Swedish time, not at midnight UTC.
export function dayNumber(date = new Date(), timeZone = 'Europe/Stockholm') {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  return Math.floor(Date.parse(ymd + 'T00:00:00Z') / 86400000);
}

export function gameOfDay(date = new Date(), games = GAMES) {
  const n = games.length;
  return games[((dayNumber(date) % n) + n) % n];
}
