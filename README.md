# Alt Tab Tavern

Alt Tab Tavern is a dependency-free static browser game hub containing eight playable games with local multiplayer support. It has no accounts, servers, or networking.

## Run locally

Serve the repository root so root-relative assets resolve:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/`.

## Modes

Tic-Tac-Toe, Checkers, and Connect Four are local two-player games. Pong supports Versus Computer and Two Players (Player 1: W/S; Player 2: arrow keys). Battleship supports Versus Computer and a private two-player hot-seat mode. Snake, Memory Match, and Minesweeper each offer Single Player and Two Players.

Snake two-player mode is simultaneous and keyboard-first: Player 1 uses W/A/S/D and Player 2 uses arrow keys. A wall, body, or head-to-head collision loses the round; simultaneous crashes are a draw.

Memory two-player mode alternates turns. A matching pair is worth one point and gives the same player another turn; the most pairs wins.

Minesweeper Duel uses a shared beginner board. Players alternate valid reveals: every newly revealed safe cell is +1, a mine is -3 and passes the turn, and flags are disabled. The highest score after all safe cells are found wins.

Battleship hot-seat play has two private setup turns. After every setup and combat turn, a neutral handoff screen hides both boards until the next player selects Continue. Each player has Carrier (5), Battleship (4), Cruiser (3), Submarine (3), and Destroyer (2); rotate, randomize, and reset are available during placement.

## Architecture and checks

The hub is rendered from `js/game-registry.js`; the registry declares each game's supported modes. Shared score and aggregate statistics use established `bgh_` LocalStorage keys through `js/storage.js`. Each game remains self-contained under `games/<id>/`. The repository directory may remain `browser-game-hub`; the public site name is Alt Tab Tavern.

## Design system

Alt Tab Tavern uses a dependency-free, CSS-first visual system. Shared palette tokens and homepage components live in `css/main.css`; shared game-page controls and panels live in `css/games.css`. Keep public branding as **Alt Tab Tavern**, use the warm `--accent` palette for primary actions, and reuse the shared button, status, and control-group classes on game pages. The homepage game cards use CSS-only artwork keyed by each registry ID, so no external images are required.

Manual checks remain the project standard: launch all eight cards, switch every mode, verify restart/back navigation, test keyboard/touch behavior where available, and confirm saved scores after reload.
