const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const values = new Map();
const sandbox = { console: { warn() {} }, localStorage: { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }, Object };
sandbox.window = sandbox;
vm.runInNewContext(`${fs.readFileSync('js/storage.js', 'utf8')}\nthis.Storage = Storage;`, sandbox);
const { Storage } = sandbox;

values.set('bgh_test_stats', JSON.stringify({ gamesPlayed: 4, wins: 2, multiplayerMatches: 1, player1Wins: 1 }));
Storage.updateMultiplayerStats('test', 'player2');
Storage.updateMultiplayerStats('test', 'player1');
Storage.updateStats('test', true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(Storage.getStats('test'))), { gamesPlayed: 5, wins: 3, losses: 0, multiplayerMatches: 3, player1Wins: 2, player2Wins: 1, draws: 0 });
values.set('bgh_corrupt_stats', '{not json');
assert.deepStrictEqual(JSON.parse(JSON.stringify(Storage.getStats('corrupt'))), { gamesPlayed: 0, wins: 0, losses: 0, multiplayerMatches: 0, player1Wins: 0, player2Wins: 0, draws: 0 });
console.log('storage tests passed');
