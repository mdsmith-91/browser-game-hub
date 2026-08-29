# Alt Tab Tavern

Alt Tab Tavern is a dependency-free static browser game hub for instant solo, computer-opponent, and local multiplayer play. It has no accounts, servers, or networking.

## Prerequisites and local development

No install step or package manager is required. Use any static HTTP server; Python 3 is the documented option.

Serve the repository root so root-relative assets resolve:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/`.

There is no compile or production build step. The source tree is the deployable artifact.

## Validation

Run the dependency-free checks from the repository root:

```powershell
node tests/storage.test.js
node tests/static.test.js
node tests/chess.test.js
```

Then serve the site and manually check the homepage, every registry route, each mode and restart flow, keyboard/touch input, saved records after reload, and the 320 px through desktop responsive layouts.

## Modes

Chess, Tic-Tac-Toe, Checkers, and Connect Four are local two-player games. Pong supports Versus Computer and Two Players (Player 1: W/S; Player 2: arrow keys). Battleship supports Versus Computer and a private two-player hot-seat mode. Snake and Minesweeper each offer Single Player and Two Players.

Snake two-player mode is simultaneous and keyboard-first: Player 1 uses W/A/S/D and Player 2 uses arrow keys. A wall, body, or head-to-head collision loses the round; simultaneous crashes are a draw.

Minesweeper Duel uses a shared beginner board. Players alternate valid reveals: every newly revealed safe cell is +1, a mine is -3 and passes the turn, and flags are disabled. The highest score after all safe cells are found wins.

Chess implements complete local play, including check, checkmate, stalemate, castling, en passant, and promotion choices.

Battleship hot-seat play has two private setup turns. After every setup and combat turn, a neutral handoff screen hides both boards until the next player selects Continue. Each player has Carrier (5), Battleship (4), Cruiser (3), Submarine (3), and Destroyer (2); rotate, randomize, and reset are available during placement.

## Project structure

- `index.html` is the shared hub shell.
- `js/game-registry.js` is the source of truth for game cards, routes, modes, and displayed records.
- `js/storage.js` normalizes and persists local scores and statistics.
- `js/game-ui.js` provides the shared accessible game-over dialog.
- `css/main.css` contains brand tokens and hub styles; `css/games.css` contains shared game controls and panels.
- `games/<id>/` contains each game's HTML, CSS, and JavaScript.
- `404.html`, `robots.txt`, and `sitemap.xml` support static hosting and discovery.
- `tests/` contains dependency-free Node checks.

## Architecture and persistence

The hub is rendered from `js/game-registry.js`; the registry declares each game's supported modes and sorts the library by title. Shared score and aggregate statistics use established `bgh_` LocalStorage keys through `js/storage.js`. Each game remains self-contained under `games/<id>/`. The repository directory may remain `browser-game-hub`; the public site name is Alt Tab Tavern.

## Design system

Statistics are normalized on every read, keeping solo results (`gamesPlayed`, `wins`, `losses`) separate from local multiplayer results (`multiplayerMatches`, `player1Wins`, `player2Wins`, `draws`). Registry `record` metadata declares whether a homepage card uses a high score, lowest time, or statistics field.

Alt Tab Tavern uses a dependency-free, CSS-first visual system. Shared palette tokens and homepage components live in `css/main.css`; shared game-page controls and panels live in `css/games.css`. Keep public branding as **Alt Tab Tavern**, use the warm `--accent` palette for primary actions, and reuse the shared button, status, and control-group classes on game pages.

Manual browser checks complement the dependency-free tests: launch every card, switch every mode, verify restart/back navigation, test keyboard/touch behavior where available, and confirm saved scores after reload.

## Mobile and touch support

Every game page uses a mobile viewport and touch-sized primary controls. Board games use tap targets and retain keyboard and mouse support. Minesweeper has a visible **Flag mode** toggle on touch devices (right-click still flags on desktop); larger Minesweeper boards scroll within their board area rather than shrinking cells below a usable size.

Snake supports a portrait D-pad and board swipes in single-player mode. Its simultaneous two-player mode remains keyboard recommended: Player 1 uses W/A/S/D and Player 2 uses arrow keys. Pong supports direct paddle dragging on the playfield; two-player touch Pong is best on a tablet, where each player can drag in their half of the playfield. Battleship uses tap-to-select ships, rotate, and tap-to-place, with stacked boards on phones and private handoff screens for local play.

## Deployment

Deploy the repository root to a static host without rewriting game URLs. Preserve directory-style routes such as `/games/snake/`, serve `404.html` for unknown paths, and publish over HTTPS so canonical URLs remain `https://alttabtavern.com/...`. No environment variables or generated assets are required.
