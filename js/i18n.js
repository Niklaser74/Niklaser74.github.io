// Strings for the hub, Swedish first. Same shape as the game's js/i18n.js: t(),
// applyDom() over data-i18n attributes, and the choice kept in localStorage
// under a hub-specific key (everything on snails.se shares one origin).
export const LANGS = { sv: 'Svenska', en: 'English' };
const LS_KEY = 'snails.lang';

const dict = {
  sv: {
    'title': 'snails.se – snigelspel från Knackpot',
    'meta.description': 'Klassiska spel i snigelversion, samlade på snails.se. Snäckmageddon är först: turbaserat artilleri med afrikanska jättesnäckor.',
    'nav.games': 'Spelen',
    'nav.garden': 'Trädgården',
    'hero.kicker': 'Snigelspel',
    'hero.title': 'Klassikerna. Fast långsamt.',
    'hero.text': 'Nästan alla klassiska spel bygger på fart. Sniglar är långsamma. Det är hela skämtet, och vi tänker dra det så långt det går.',
    'hero.play': 'Spela Snäckmageddon',
    'hero.more': 'Alla spel',
    'games.title': 'Spelen',
    'games.lead': 'Två spel är spelbara, resten kryper hitåt. Samma sniglar i alla, ritade av samma kod.',
    'badge.live': 'Spelbart nu',
    'badge.soon': 'På gång',
    'g1.title': 'Snäckmageddon',
    'g1.text': 'Turbaserat artilleri med afrikanska jättesnäckor. Långsamma. Skalade. Dödliga. Spela mot datorn, mot kompisar på samma skärm eller via Snigelpost i egen takt – ett drag när du hinner.',
    'g1.tag1': 'Worms-stil',
    'g1.tag2': 'Snigelpost',
    'g1.tag3': 'Dagens skott',
    'g1.tag4': 'Funkar offline',
    'g1.play': 'Spela',
    'g1.itch': 'Även på itch.io',
    'g2.title': 'Snailman',
    'g2.text': 'Pac-Man där spökena jagar i snigelfart. Slemspåret är mekaniken: du får inte korsa ditt eget.',
    'g3.title': 'Snäckschack',
    'g3.text': 'Schack med Snäckmageddons sniglar. Pjäserna kryper till sin ruta. Snällt schack för nybörjare, eller battle light där varje slag avgörs i en liten duell. Mot datorn eller två på samma enhet.',
    'g3.tag1': 'Snällt schack', 'g3.tag2': 'Battle light', 'g3.tag3': 'Funkar offline', 'g3.play': 'Spela',
    'g4.title': 'Snail Story',
    'g4.text': 'Sköt om en snigel. Den gör ingenting. Den lever i tre år och du får en notis på födelsedagen.',
    'garden.title': 'Trädgården',
    'garden.lead': 'Alla spelen utspelar sig i samma trädgård, med samma figurer. Ett spel kan alltid peka vidare till nästa.',
    'garden.gardener': 'Trädgårdsmästaren',
    'garden.gardener.text': 'Fienden. Salt, ölfällor och kopparband.',
    'garden.blackbird': 'Koltrasten',
    'garden.blackbird.text': 'Kommer uppifrån. Snabb, vilket är orättvist.',
    'garden.hedgehog': 'Igelkotten',
    'garden.hedgehog.text': 'Äter sniglar, men är nästan lika långsam.',
    'garden.lettuce': 'Salladslandet',
    'garden.lettuce.text': 'Målet med allt.',
    'footer.by': 'En Knackpot-produkt',
    'footer.privacy': 'Integritetspolicy',
    'footer.source': 'Källkod på GitHub',
    'footer.contact': 'hej@snails.se',
    'footer.lang': 'Språk',
  },
  en: {
    'title': 'snails.se – snail games by Knackpot',
    'meta.description': 'Classic games, snail edition, gathered at snails.se. Snailmageddon comes first: turn-based artillery with giant African land snails.',
    'nav.games': 'Games',
    'nav.garden': 'The garden',
    'hero.kicker': 'Snail games',
    'hero.title': 'The classics. Only slow.',
    'hero.text': 'Almost every classic game is about speed. Snails are slow. That is the whole joke, and we intend to take it as far as it goes.',
    'hero.play': 'Play Snailmageddon',
    'hero.more': 'All games',
    'games.title': 'The games',
    'games.lead': 'Two games are playable, the rest are crawling this way. The same snails in all of them, drawn by the same code.',
    'badge.live': 'Playable now',
    'badge.soon': 'In the works',
    'g1.title': 'Snailmageddon',
    'g1.text': 'Turn-based artillery with giant African land snails. Slow. Shelled. Deadly. Play the computer, friends on one screen, or by Snail Mail at your own pace – one turn whenever you have a minute.',
    'g1.tag1': 'Worms-style',
    'g1.tag2': 'Snail Mail',
    'g1.tag3': 'Shot of the day',
    'g1.tag4': 'Works offline',
    'g1.play': 'Play',
    'g1.itch': 'Also on itch.io',
    'g2.title': 'Snailman',
    'g2.text': 'Pac-Man where the ghosts hunt at snail speed. The slime trail is the mechanic: you may not cross your own.',
    'g3.title': 'Snail Chess',
    'g3.text': 'Chess with the Snailmageddon snails. The pieces crawl to their square. Gentle chess for beginners, or battle light where every capture is settled in a little duel. Against the computer or two on one device.',
    'g3.tag1': 'Gentle chess', 'g3.tag2': 'Battle light', 'g3.tag3': 'Works offline', 'g3.play': 'Play',
    'g4.title': 'Snail Story',
    'g4.text': 'Look after a snail. It does nothing. It lives for three years and you get a notification on its birthday.',
    'garden.title': 'The garden',
    'garden.lead': 'Every game is set in the same garden, with the same cast. One game can always point to the next.',
    'garden.gardener': 'The gardener',
    'garden.gardener.text': 'The enemy. Salt, beer traps and copper tape.',
    'garden.blackbird': 'The blackbird',
    'garden.blackbird.text': 'Comes from above. Fast, which is unfair.',
    'garden.hedgehog': 'The hedgehog',
    'garden.hedgehog.text': 'Eats snails, but is almost as slow.',
    'garden.lettuce': 'The lettuce patch',
    'garden.lettuce.text': 'The point of everything.',
    'footer.by': 'A Knackpot product',
    'footer.privacy': 'Privacy policy',
    'footer.source': 'Source on GitHub',
    'footer.contact': 'hej@snails.se',
    'footer.lang': 'Language',
  },
};

let lang = 'sv';

// ?lang= wins (a shared link says what it means), then the stored choice, then the browser.
export function detectLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (dict[q]) return q;
  try { const s = localStorage.getItem(LS_KEY); if (dict[s]) return s; } catch { /* storage blocked */ }
  return (navigator.language || 'sv').toLowerCase().startsWith('sv') ? 'sv' : 'en';
}
export function setLang(l) {
  if (!dict[l]) return;
  lang = l;
  try { localStorage.setItem(LS_KEY, l); } catch { /* storage blocked */ }
  document.documentElement.lang = l;
  applyDom();
}
export function getLang() { return lang; }
export function t(key) { return dict[lang][key] ?? dict.sv[key] ?? key; }

export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    el.setAttribute(attr, t(key));
  });
  document.title = t('title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  root.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}
