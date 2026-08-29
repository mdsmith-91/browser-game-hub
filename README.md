# Browser Game Hub

A dependency-free static game hub with local play only: no accounts, servers, or networking.

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

The hub is rendered from `js/game-registry.js`; the registry declares each game's supported modes. Shared score and aggregate statistics use `bgh_` LocalStorage keys through `js/storage.js`. Each game remains self-contained under `games/<id>/`.

Manual checks remain the project standard: launch all eight cards, switch every mode, verify restart/back navigation, test keyboard/touch behavior where available, and confirm saved scores after reload.
