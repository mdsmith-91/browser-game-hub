const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const values = new Map();
values.set('bgh_battleship_highscore', '9');
values.set('bgh_pong_highscore', '4');
const sandbox = { console: { warn() {} }, localStorage: { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }, Object };
sandbox.window = sandbox;
vm.runInNewContext(`${fs.readFileSync('js/storage.js', 'utf8')}\nthis.Storage = Storage;`, sandbox);
const { Storage } = sandbox;

values.set('bgh_test_stats', JSON.stringify({ gamesPlayed: 4, wins: 2, multiplayerMatches: 1, player1Wins: 1 }));
Storage.updateMultiplayerStats('test', 'player2');
Storage.updateMultiplayerStats('test', 'player1');
Storage.updateStats('test', true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(Storage.getStats('test'))), { gamesPlayed: 8, wins: 5, losses: 1, draws: 0, timePlayed: 0 });
assert.strictEqual(JSON.parse(values.get('bgh_test_stats'))._version, 2, 'Migrated stats should be versioned once.');
values.set('bgh_corrupt_stats', '{not json');
assert.deepStrictEqual(JSON.parse(JSON.stringify(Storage.getStats('corrupt'))), { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, timePlayed: 0 });
values.set('bgh_score_highscore', '12points');
assert.strictEqual(Storage.getHighScore('score'), null);
assert.strictEqual(Storage.saveHighScore('score', -1), false);
assert.strictEqual(Storage.saveHighScore('score', 42.9), true);
assert.strictEqual(Storage.getHighScore('score'), 42);
assert.strictEqual(Storage.saveHighScore('score', 40), false);

const matchesBeforeInvalidResult = Storage.getStats('test').gamesPlayed;
Storage.updateMultiplayerStats('test', 'unknown');
assert.strictEqual(Storage.getStats('test').gamesPlayed, matchesBeforeInvalidResult);

values.set('bgh_minesweeper_stats', JSON.stringify({ gamesPlayed: 3, wins: 2, losses: 1, multiplayerMatches: 7, player1Wins: 4, player2Wins: 2, draws: 1 }));
assert.deepStrictEqual(JSON.parse(JSON.stringify(Storage.getStats('minesweeper'))), { gamesPlayed: 3, wins: 2, losses: 1, draws: 0, timePlayed: 0 });
Storage.recordResult('minesweeper', 'complete');
assert.strictEqual(Storage.getStats('minesweeper').gamesPlayed, 4);
Storage.addTimePlayed('test', 12.9);
assert.strictEqual(Storage.getStats('test').timePlayed, 12);
let clock = 0;
let visibilityListener;
sandbox.performance = { now: () => clock };
sandbox.document = {
  visibilityState: 'visible',
  addEventListener: (name, listener) => { if (name === 'visibilitychange') visibilityListener = listener; },
  removeEventListener() {}
};
const timer = Storage.createPlayTimer('timed');
timer.start();
clock = 2500;
sandbox.document.visibilityState = 'hidden';
visibilityListener();
clock = 10000;
sandbox.document.visibilityState = 'visible';
visibilityListener();
clock = 11500;
timer.stop();
assert.strictEqual(Storage.getStats('timed').timePlayed, 4, 'Hidden time should not count as active play.');
clock = 20000;
sandbox.document.visibilityState = 'hidden';
visibilityListener();
clock = 30000;
sandbox.document.visibilityState = 'visible';
visibilityListener();
clock = 35000;
timer.stop();
assert.strictEqual(Storage.getStats('timed').timePlayed, 4, 'A stopped timer must not restart on visibility changes.');
Storage.recordGameResult('blackjack', 'win', { blackjack: true });
assert.strictEqual(Storage.getStats('blackjack').blackjacks, 1, 'Blackjack naturals should persist once.');
Storage.recordGameResult('crazy-eights', 'win');
Storage.recordGameResult('crazy-eights', 'win');
Storage.recordGameResult('crazy-eights', 'loss');
assert.strictEqual(Storage.getStats('crazy-eights').bestWinStreak, 2, 'Win streaks should retain their best value.');
Storage.recordGameResult('go-fish', 'win', { booksWon: 8, books: 8 });
assert.strictEqual(Storage.getStats('go-fish').bestBooks, 8, 'Best books should retain the single-game maximum.');
assert.strictEqual(values.has('bgh_battleship_highscore'), false, 'Obsolete Battleship victories should be removed.');
assert.strictEqual(values.has('bgh_pong_highscore'), false, 'Obsolete Pong score difference should be removed.');

const originalSetItem = sandbox.localStorage.setItem;
sandbox.localStorage.setItem = () => { throw new Error('storage unavailable'); };
assert.doesNotThrow(() => Storage.saveStats('unavailable', { gamesPlayed: 1 }));
sandbox.localStorage.setItem = originalSetItem;
console.log('storage tests passed');
