# CLAUDE.md

snails.se — startsidan (hubben) för Knackpots snigelspel. Statisk sajt utan
byggsteg som publiceras med GitHub Pages på domänen snails.se. Spelen bor i
egna repon och hamnar på `snails.se/<repo>/` för att det här repot är kontots
user site (`Niklaser74.github.io`). README förklarar mekaniken.

## Kör

| Vad | Kommando |
| --- | --- |
| Installera | `npm install` (bara Playwright för OG-bilden) |
| Utveckling | `npm start` → http://localhost:8081/ |
| Tester | `npm test` |
| Spelets renderare | `npm run sync:game` |
| Deploy | push till `main` |

Kör testerna innan du säger att du är klar.

## Struktur

```
index.html / 404.html / privacy.html   sidorna
js/legacy.js                            vilka rot-URL:er som är gamla spellänkar → /snailmageddon/
js/account.js                           seriens Supabase-klient — källan; spelen vendorar
account/index.html, js/account-page.js  kontosidan (inloggning, koppling, namn, utseende)
js/hub.js, js/i18n.js                   hero, kort, sv/en
js/game/                                kopior från snailmageddon-repot — redigera aldrig här
sw.js                                   kill-switch för spelets gamla service worker på scope /
```

## Konventioner

- Svenska först, engelska via `data-i18n` och `js/i18n.js`. Nya strängar i
  båda språken samtidigt.
- Rotabsoluta sökvägar (`/css/hub.css`) — hubben äger roten, och `404.html`
  serveras på godtyckliga sökvägar. `test/paths.test.mjs` kontrollerar att
  målen finns.
- Paletten är spelets (`css/hub.css` `:root`). Nya färger hämtas från
  `js/game/themes.js` eller spelets `css/style.css`, inte påhittade.
- Allt på snails.se delar origin: `localStorage`-nycklar prefixas `snails.`,
  ingen egen cache, inget manifest.

## Rör inte

- `sw.js` — kill-switch som ska ligga kvar i månader. Ingen `fetch`-handler,
  ingen cache, ingen push. Testet låser det.
- Inget `<link rel="manifest">` på hubben — det skulle kapa Snäckmageddons
  app-identitet (dess manifest-`id` är `/`).
- `js/legacy.js` nyckellista och `404.html`-prefix — gamla länkar i omlopp
  (push-notiser, Snigelpost-inbjudningar, Stripe, e-postlänkar) beror på dem.
- `.well-known/assetlinks.json`, `privacy.html` — externa parter (Play) pekar
  på dem.
- `js/game/*` — kopior; ändra i spelrepot och synka.
- `js/account.js` ägs av hubben och vendoras till spelen: ändringar här måste
  följas av `npm run sync:account` i Snäckmageddon, Snäckschack och Snail Story
  i samma veva (sessionsnyckeln `snails.session` delas; olika versioner med
  roterande refresh-tokens ger två konton på samma enhet).
- `docs-vault/` — projektlokalt Obsidian-vault, ska aldrig committas
  (`.gitignore`).

## Git

Små commits med begripliga meddelanden på svenska. Push till `main` deployar
direkt till snails.se, så kör `npm test` och titta på `npm start` först.
