const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const registrySandbox = {};
vm.runInNewContext(`${fs.readFileSync(path.join(root, 'js/game-registry.js'), 'utf8')}\nthis.registry = GameRegistry;`, registrySandbox);
const games = registrySandbox.registry;
const allowedModes = new Set(['Single Player', 'Two Players', 'Versus Computer']);
const expectedModes = {
  battleship: ['Two Players', 'Versus Computer'],
  checkers: ['Two Players', 'Versus Computer'],
  chess: ['Two Players', 'Versus Computer'],
  'connect-four': ['Two Players', 'Versus Computer'],
  minesweeper: ['Single Player'],
  pong: ['Two Players', 'Versus Computer'],
  snake: ['Single Player', 'Two Players'],
  solitaire: ['Single Player'],
  'tic-tac-toe': ['Two Players', 'Versus Computer']
};
const modePageLabels = { 'Single Player': 'Single Player', 'Two Players': 'Two Players', 'Versus Computer': 'Versus AI' };

assert(games.length > 0, 'The game registry must not be empty.');
assert.strictEqual(new Set(games.map(game => game.id)).size, games.length, 'Game IDs must be unique.');
assert.deepStrictEqual(
  Array.from(games, game => game.title),
  Array.from(games, game => game.title).sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' })),
  'The game registry must be alphabetized by title.'
);

for (const game of games) {
  const gameDirectory = path.join(root, 'games', game.id);
  const htmlPath = path.join(gameDirectory, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.strictEqual(game.url, `/games/${game.id}/`, `${game.id} has an inconsistent route.`);
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
  for (const mode of game.gameModes) assert(html.includes(modePageLabels[mode]), `${game.id} does not expose its ${mode} mode on the page.`);
  for (const mode of allowedModes) {
    if (!game.gameModes.includes(mode)) assert(!html.includes(modePageLabels[mode]), `${game.id} advertises unsupported ${mode} play.`);
  }
  for (const stat of game.stats.filter(label => !['High Score', 'Best Time'].includes(label))) {
    assert(html.includes(`>${stat}<`), `${game.id} does not show its tracked ${stat} statistic.`);
  }
}

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

const notFound = fs.readFileSync(path.join(root, '404.html'), 'utf8');
assert(notFound.includes('href="/"') && notFound.includes('href="/#games"'), 'The 404 page needs Home and Browse Games links.');

console.log('static tests passed');
