const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const registrySandbox = {};
vm.runInNewContext(`${fs.readFileSync(path.join(root, 'js/game-registry.js'), 'utf8')}\nthis.registry = GameRegistry; this.categories = GameCategories;`, registrySandbox);
const games = registrySandbox.registry;
const categories = registrySandbox.categories;
const allowedModes = new Set(['Single Player', 'Two Players', 'Versus Computer']);
const expectedModes = {
  battleship: ['Two Players', 'Versus Computer'],
  blackjack: ['Single Player'],
  'brick-breaker': ['Single Player'],
  checkers: ['Two Players', 'Versus Computer'],
  chess: ['Two Players', 'Versus Computer'],
  'connect-four': ['Two Players', 'Versus Computer'],
  'crazy-eights': ['Versus Computer'],
  'falling-blocks': ['Single Player'],
  'gin-rummy': ['Versus Computer'],
  'go-fish': ['Versus Computer'],
  minesweeper: ['Single Player'],
  mancala: ['Two Players', 'Versus Computer'],
  pool: ['Two Players'],
  pong: ['Two Players', 'Versus Computer'],
  reversi: ['Two Players', 'Versus Computer'],
  shuffleboard: ['Two Players'],
  snake: ['Single Player'],
  solitaire: ['Single Player'],
  'tic-tac-toe': ['Two Players', 'Versus Computer']
};
const modePageLabels = { 'Single Player': 'Single Player', 'Two Players': 'Two Players', 'Versus Computer': 'Versus AI' };

assert.strictEqual(games.length, 19, 'The live catalog must contain exactly the intended 19 games.');
assert.strictEqual(new Set(games.map(game => game.id)).size, games.length, 'Game IDs must be unique.');
assert.deepStrictEqual(
  Array.from(games, game => game.title),
  Array.from(games, game => game.title).sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' })),
  'The game registry must be alphabetized by title.'
);
assert.deepStrictEqual(
  Array.from(categories, category => category.id),
  ['board-games', 'card-games', 'arcade', 'puzzle', 'tavern-games'],
  'Game categories must remain in the intended browse order.'
);

const categoryIds = new Set(categories.map(category => category.id));
const expectedCategories = {
  battleship: 'board-games',
  blackjack: 'card-games',
  'brick-breaker': 'arcade',
  checkers: 'board-games',
  chess: 'board-games',
  'connect-four': 'board-games',
  'crazy-eights': 'card-games',
  'falling-blocks': 'arcade',
  'gin-rummy': 'card-games',
  'go-fish': 'card-games',
  minesweeper: 'puzzle',
  mancala: 'board-games',
  pool: 'tavern-games',
  pong: 'arcade',
  reversi: 'board-games',
  shuffleboard: 'tavern-games',
  snake: 'arcade',
  solitaire: 'card-games',
  'tic-tac-toe': 'board-games'
};

for (const game of games) {
  const gameDirectory = path.join(root, 'games', game.id);
  const htmlPath = path.join(gameDirectory, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.strictEqual(game.url, `/games/${game.id}/`, `${game.id} has an inconsistent route.`);
  assert(categoryIds.has(game.category), `${game.id} references an undefined category.`);
  assert.strictEqual(game.category, expectedCategories[game.id], `${game.id} belongs in the wrong category.`);
  assert(game.gameModes.length > 0 && game.gameModes.every(mode => allowedModes.has(mode)), `${game.id} has invalid mode metadata.`);
  assert.deepStrictEqual(Array.from(game.gameModes), expectedModes[game.id], `${game.id} has misleading mode metadata.`);
  assert(game.stats.length > 0 && game.stats.includes('Games Played') && game.stats.includes('Time Played'), `${game.id} needs explicit tracked-stat metadata.`);
  assert(fs.existsSync(path.join(gameDirectory, 'style.css')), `${game.id} is missing style.css.`);
  assert(fs.existsSync(path.join(gameDirectory, 'game.js')), `${game.id} is missing game.js.`);
  assert.strictEqual((html.match(/<meta name="description"/g) || []).length, 1, `${game.id} needs one description.`);
  assert.strictEqual((html.match(/<link rel="canonical"/g) || []).length, 1, `${game.id} needs one canonical URL.`);
  assert.strictEqual((html.match(/<link rel="icon"/g) || []).length, 1, `${game.id} needs one favicon.`);
  assert(html.includes(`<title>${game.title} | Alt Tab Tavern</title>`), `${game.id} has an inconsistent title.`);
  assert(/<h1 class="game-title">/.test(html), `${game.id} needs a top-level heading.`);
  assert(/<a href="\/" id="backToHub" class="back-btn">Back to Tavern<\/a>/.test(html), `${game.id} needs consistent Tavern navigation.`);
  assert(html.includes('/js/storage.js'), `${game.id} must load shared stat persistence.`);
  assert(html.includes('/js/game-ui.js'), `${game.id} must load the shared game-over dialog.`);
  assert(html.includes('aria-live='), `${game.id} needs a live status announcement region.`);
  for (const mode of game.gameModes) assert(html.includes(modePageLabels[mode]), `${game.id} does not expose its ${mode} mode on the page.`);
  for (const mode of allowedModes) {
    if (!game.gameModes.includes(mode)) assert(!html.includes(modePageLabels[mode]), `${game.id} advertises unsupported ${mode} play.`);
  }
  for (const stat of game.stats.filter(label => !['High Score', 'Best Time'].includes(label))) {
    assert(html.includes(`>${stat}<`), `${game.id} does not show its tracked ${stat} statistic.`);
  }
}

for (const category of categories) {
  const titles = games.filter(game => game.category === category.id).map(game => game.title);
  assert.deepStrictEqual(
    Array.from(titles),
    Array.from(titles).sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' })),
    `${category.title} must be alphabetized.`
  );
}

const appSandbox = { document: { addEventListener() {} } };
vm.runInNewContext(`${fs.readFileSync(path.join(root, 'js/app.js'), 'utf8')}\nthis.getTags = getModeTags;`, appSandbox);
assert.deepStrictEqual(Array.from(appSandbox.getTags(['Single Player'])), ['1 PLAYER']);
assert.deepStrictEqual(Array.from(appSandbox.getTags(['Versus Computer'])), ['1 PLAYER', 'AI']);
assert.deepStrictEqual(Array.from(appSandbox.getTags(['Two Players', 'Versus Computer'])), ['1 PLAYER', 'AI', 'LOCAL 2P']);

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const game of games) assert(sitemap.includes(`https://alttabtavern.com${game.url}`), `${game.id} is missing from the sitemap.`);

const gameDirectories = fs.readdirSync(path.join(root, 'games'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();
assert.deepStrictEqual(gameDirectories, Array.from(games, game => game.id).sort(), 'Every game directory must belong to the registry.');

const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(!/data-game-count|hero-art|card-icon/.test(homepage), 'The homepage must not contain count-dependent or decorative artwork markup.');
assert(!/Play\s*<|game-night-note/.test(homepage), 'The redundant homepage CTA or filler panel is still present.');
assert(homepage.includes('class="category-nav"') && homepage.includes('class="game-categories"'), 'The homepage needs category navigation and a generated category container.');
assert(!/noscript-game-list|\/games\/battleship\//.test(homepage), 'The homepage must not duplicate the registry game list.');

const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
assert(appSource.includes('if (!games.length) return;'), 'Empty categories must be omitted.');
assert(!appSource.includes('const games = ['), 'Homepage code must not duplicate registry games.');

const notFound = fs.readFileSync(path.join(root, '404.html'), 'utf8');
assert(notFound.includes('href="/"') && notFound.includes('href="/#games"'), 'The 404 page needs Home and Browse Games links.');

console.log('static tests passed');
