# Repository Guidelines

## Project Structure & Module Organization

This is a dependency-free browser game hub published as **Alt Tab Tavern**. The root `index.html` loads the
shared application shell. Public-facing copy, metadata, and navigation use Alt Tab Tavern; internal repository and LocalStorage identifiers remain unchanged. Shared code is in `js/`: `app.js` manages hub and
game navigation, `game-registry.js` lists games, and `storage.js` handles local
high scores. Shared styles live in `css/`.

Each game is self-contained under `games/<game-id>/` with `index.html`,
`style.css`, and `game.js`; current IDs include `snake`, `minesweeper`,
`memory`, `connect-four`, `checkers`, and `tic-tac-toe`. Keep game-specific
DOM, styling, and logic inside that directory.

Game metadata in `js/game-registry.js` declares supported modes. Use the
consistent labels `Single Player`, `Two Players`, and `Versus Computer` and
reset all round state when the selector changes. Multiplayer status must name
the current player in text, use an `aria-live` status region for turn/end
updates, and keep private state hidden during hot-seat handoffs.

## Build, Test, and Development Commands

There is no build system, package manager, or automated test suite. Serve the
repository from its root so absolute paths such as `/js/app.js` resolve:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/` and manually exercise the hub, each game,
restart behavior, navigation back to the hub, keyboard/touch controls, and
stored high scores. Do not rely on opening `index.html` directly from disk.

## Coding Style & Naming Conventions

Use two-space indentation and semicolons, matching the existing HTML, CSS, and
JavaScript. Use `camelCase` for JavaScript variables and functions,
`PascalCase` for constructor-like/module names (for example `GameRegistry`),
and kebab-case for CSS classes, file names, and game IDs (for example
`games/connect-four/`). Prefer `const` and `let`; keep globals intentional and
expose only integration points required by the hub, such as `window.initGame`.

No formatter or linter is configured. Preserve the existing style and verify
changes in a browser before submitting them.

## Testing Guidelines

Manual browser testing is the project standard. For a new game or rule change,
test normal play, invalid moves, win/loss states, restart, resizing, and a
fresh page load. When changing registry or storage behavior, test every game
card and confirm a saved score remains visible after reload.

## Commit & Pull Request Guidelines

Git history is not present in this checkout, so no repository-specific commit
convention can be inferred. Use concise imperative subjects, such as `Add
snake pause control`. Keep commits focused. Pull requests should describe the
user-visible change, link relevant issues, list manual checks performed, and
include screenshots or short recordings for visual or gameplay changes.
