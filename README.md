# snails.se

Startsidan för Knackpots snigelspel: en serie klassiska spel i snigelversion,
samlade i en trädgård. Statisk sajt utan byggsteg (HTML, CSS, ES-moduler),
publicerad med GitHub Pages på **snails.se**. Första spelet är
[Snäckmageddon](https://snails.se/snailmageddon/), repo
[Niklaser74/snailmageddon](https://github.com/Niklaser74/snailmageddon).

## Hur adresserna hänger ihop

Det här repot heter `Niklaser74.github.io` och är kontots *user site* i
GitHub Pages. Domänen snails.se sitter på det. GitHub serverar då varje annat
repo med Pages påslaget (och utan egen domän) under samma domän, på
`snails.se/<reponamn>/`. Spelen behöver alltså ingen egen domän och ingen
routing: repot `snailmageddon` blir `snails.se/snailmageddon/` av sig självt.

Allt på snails.se delar **en origin**. Därför:

- cache-namn i service workers, `localStorage`-nycklar och manifest-`id`
  måste vara namnrymda per spel (`snailmageddon-*`, `snackmageddon.*`,
  `/snailmageddon/` …). Hubben använder `snails.*`.
- hubben har **inget manifest och ingen riktig service worker**. Ett manifest
  med id som resolvar till `/` skulle kapa Snäckmageddons app-identitet (dess
  `id` är `/` sedan det låg på roten, och det måste förbli så för att
  installerade appar ska uppdateras i stället för att dubbleras).
- `sw.js` på roten är en **kill-switch** för den service worker spelet
  registrerade med scope `/` när det låg på roten. Den ska ligga kvar i
  månader. Se kommentaren i filen.
- `index.html` och `404.html` skickar gamla spellänkar (`?match=`, `?daily=1`,
  Stripe-returer, Supabase-länkar med `token_hash`/`#access_token`,
  `/design/…`, `/docs/…`) vidare till `/snailmageddon/`. Logiken ligger i
  `js/legacy.js` och testas i `test/legacy.test.mjs`.
- `robots.txt` och `sitemap.xml` gäller hela domänen; hubben äger dem.
- `.well-known/assetlinks.json` (Digital Asset Links för Play-appen) måste
  ligga på domänroten och bor därför här.
- `privacy.html` är seriens gemensamma policy; Play-listningar pekar hit.

## Sniglarna

`js/game/` är kopior av spelets renderare (`snails.js`, `terrain.js`,
`themes.js` …). Heron och spelkorten ritas med dem, så sniglarna på
startsidan är sniglarna i spelen. Redigera dem inte här; ändra i spelrepot och
kör `npm run sync:game`.

## Kör

| Vad | Kommando |
| --- | --- |
| Utveckling | `npm start` → http://localhost:8081/ |
| Tester | `npm test` |
| Hämta spelets renderare | `npm run sync:game` (`GAME_DIR=../dev-snailmageddon`) |
| OG-bild | `npx playwright install chromium` en gång, sedan `npm run og:image` |
| Deploy | push till `main` → `.github/workflows/pages.yml` |

## Lägga till ett spel

1. Eget publikt repo under `Niklaser74`, Pages via samma `pages.yml`, **ingen**
   `CNAME` och ingen custom domain. Det hamnar på `snails.se/<repo>/`.
2. Bara relativa sökvägar i spelet (`js/main.js`, `register('sw.js')`,
   manifest `start_url: "./"`, `scope: "./"`). Snäckmageddon har en test
   (`test/paths.test.mjs`) som stoppar rotrelativa sökvägar — kopiera den.
3. Eget `manifest.id` (t.ex. `/snailman/`), eget cache-prefix i `sw.js`, egna
   `localStorage`-nycklar.
4. Samma Supabase-projekt (`snails`, se spelrepots `supabase/README.md`), egna
   tabeller med spelets prefix. Konton delas.
5. Kort på hubben (`index.html` + strängar i `js/i18n.js`), rad i
   `sitemap.xml`.

## Struktur

```
index.html, 404.html, privacy.html   sidorna
sw.js                                 kill-switch, ingen cache
js/legacy.js                          vart gamla spellänkar ska
js/hub.js, js/i18n.js                 hero, kort, språk
js/game/                              spelets renderare (kopior)
css/hub.css                           spelets palett
img/, icons/                          figurer, favicon, OG-bild, Knackpot-märke
.well-known/assetlinks.json           Play-appens Digital Asset Links
scripts/                              serve, sync-game, og-image
test/                                 Node-tester
docs-vault/                           projektlokalt Obsidian-vault, ej i git
```
