# PokéType Checker v2

A dark-themed, installable, vanilla HTML/CSS/JavaScript Pokémon reference and team type-coverage tool.

## Start

Upload **all files in this folder together** to a static HTTPS host, such as GitHub Pages. The entry point is `index.html`. For local development, from this directory run `python -m http.server 8000` and open http://localhost:8000. The type checker also works when opening `index.html` directly, but installation and the service worker require HTTPS or localhost. No build, package install, API key, or account is required.

## Features

- Type checker: independently calculate each attacking type and combined defensive multipliers, including immunities.
- Pokémon lookup: search all Pokémon and battle-relevant forms listed by PokéAPI, regular/shiny artwork, defensive matchups, evolution information, and level-up moves for a selected version group (selectable from Pokémon lookup or Team Coverage).
- Type combinations: find Pokémon with one or both selected types. A single type searches **all Pokémon with that type**, including dual-types.
- Matchup: see individual type-based attack effectiveness in both directions. This does **not** predict a battle winner.
- Team: save up to six Pokémon and four moves each, limit new move choices to their published learnset for the selected version group, count defensive vulnerabilities and safe switch-in types, and show offensive coverage from documented damaging moves. Export/import teams as JSON.

## Existing teams and data

The first successful load imports the old `poketype-team-v1` localStorage team into `poketype-team-v2`. The old key is **never modified or removed**. The importer removes invalid IDs and duplicate entries, caps the team at six and moves at four, and normalizes historical move names where possible. It does not alter saved types or delete moves simply because a later game group has no matching learnset. A new installation on another origin/browser will not automatically have the old browser's localStorage: deploy v2 on the original site/origin, allow the migration, and then export the v2 team (or manually transfer the old storage). To move v2 teams between devices, use Export JSON and Import JSON.

## Online/offline behavior

The 18-type calculation data and app shell work offline after installation. Pokémon searches, lookups, evolution, move metadata, and artwork require internet the first time. The service worker retains up to 350 previously fetched API responses and 140 artwork responses for later offline access; offline results are therefore **partial**, not a complete Pokédex. The app handles unavailable data with visible messages. Refreshes do not wipe browser storage or other applications' caches.

## Calculation limitations

The type chart uses modern (Generation VI onward) basic type rules. A version-group selection filters **learnset/level-up move records**, not game-specific battle mechanics, availability, transfer legality, or evolution conditions. Type and move comparisons omit abilities, items, Terastallization, weather, stats, power, STAB, priority, accuracy, PP, move-specific exceptions, and actual game rules. Offensive coverage counts only moves with a documented attacking damage class and positive numeric base power, omitting fixed/variable-power moves. It reports effectiveness against the 18 single types plus all 153 different dual-type combinations (171 theoretical defending typings), not every obtainable opponent. Pokémon included in an API may not be obtainable in the selected game. The app cannot guarantee a legal competitive moveset.

## Testing

Run `node tests/test-core.cjs` to execute calculation and saved-team migration tests. The test script extracts the marked pure core from `index.html` so there is no second chart or engine to drift out of sync. Run `node --check sw.js`, `python -m json.tool manifest.json`, and use browser tests for UI/API workflows. Network calls need to be verified in a real browser with internet.

## Files

`index.html` — complete application and styles; `sw.js` — optional service worker; `manifest.json` — install metadata; five PNGs — original artwork and category icons; `tests/test-core.cjs` — regression tests; `.gitattributes` — Git line-ending normalization.

Data and sprite attribution: [PokéAPI](https://pokeapi.co/) and its linked [PokéAPI sprites repository](https://github.com/PokeAPI/sprites). Pokémon and related imagery are trademarks and copyright of their respective owners. This is an unofficial fan project.
