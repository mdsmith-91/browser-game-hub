const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const sandbox = { console, Math };
function load(file, name) {
  vm.runInNewContext(`${fs.readFileSync(file, 'utf8')}\nthis.${name} = ${name};`, sandbox, { filename: file });
}
load('js/cards.js', 'PlayingCards');
load('games/blackjack/blackjack-rules.js', 'BlackjackRules');
load('games/crazy-eights/crazy-eights-rules.js', 'CrazyEightsRules');
load('games/crazy-eights/crazy-eights-ai.js', 'CrazyEightsAI');
load('games/go-fish/go-fish-rules.js', 'GoFishRules');
load('games/go-fish/go-fish-ai.js', 'GoFishAI');
const { PlayingCards, BlackjackRules, CrazyEightsRules, CrazyEightsAI, GoFishRules, GoFishAI } = sandbox;
const card = (suit, rank) => new PlayingCards.Card(suit, rank, { faceUp: true });

assert.strictEqual(BlackjackRules.handValue([card('hearts', 'ace'), card('clubs', 'king')]).total, 21, 'Ace should count as 11 in blackjack.');
assert.strictEqual(BlackjackRules.handValue([card('hearts', 'ace'), card('clubs', 'ace'), card('spades', '9')]).total, 21, 'One Ace should fall to 1 when needed.');
assert.strictEqual(BlackjackRules.handValue([card('hearts', 'ace'), card('clubs', 'ace'), card('spades', '9'), card('diamonds', 'king')]).total, 21, 'Multiple Aces should downgrade independently.');

function blackjackDeck(playerOne, dealerOne, playerTwo, dealerTwo) {
  const cards = PlayingCards.createStandardDeck().slice(0, 48);
  cards.push(dealerTwo, playerTwo, dealerOne, playerOne);
  return cards;
}
let blackjack = BlackjackRules.createInitialState(blackjackDeck(card('spades', 'ace'), card('clubs', '10'), card('hearts', 'king'), card('diamonds', '9')));
assert.strictEqual(blackjack.result, 'win', 'A player natural should win immediately.');
blackjack = { deck: [card('clubs', '6')], hands: { player: [card('hearts', '10'), card('spades', '6')], dealer: [card('diamonds', '10'), card('clubs', '7')] }, turn: 'player', phase: 'playing', result: null };
assert.strictEqual(BlackjackRules.applyAction(blackjack, { type: 'hit' }), true);
assert.strictEqual(blackjack.result, 'loss', 'A total over 21 should bust.');
blackjack = { deck: [card('clubs', '3'), card('hearts', '6')], hands: { player: [card('hearts', '10'), card('spades', '8')], dealer: [card('diamonds', '10'), card('clubs', '6')] }, turn: 'player', phase: 'playing', result: null };
BlackjackRules.applyAction(blackjack, { type: 'stand' });
assert.strictEqual(BlackjackRules.handValue(blackjack.hands.dealer).total, 22, 'Dealer must draw on 16.');
assert.strictEqual(blackjack.result, 'win');
blackjack = { deck: [], hands: { player: [card('hearts', '10'), card('spades', '8')], dealer: [card('diamonds', '10'), card('clubs', '8')] }, turn: 'player', phase: 'playing', result: null };
BlackjackRules.applyAction(blackjack, { type: 'stand' });
assert.strictEqual(blackjack.result, 'push', 'Equal totals should push.');

function eightsState() {
  return { drawPile: [card('spades', '2')], discardPile: [card('hearts', '5')], hands: { human: [card('diamonds', '5'), card('clubs', '8')], computer: [card('spades', 'king')] }, players: {}, activeSuit: 'hearts', turn: 'human', hasDrawn: false, phase: 'playing', winner: null };
}
let eights = eightsState();
assert.strictEqual(CrazyEightsRules.isPlayable(eights.hands.human[0], eights), true, 'Matching rank should be legal.');
assert.strictEqual(CrazyEightsRules.isPlayable(card('hearts', 'queen'), eights), true, 'Matching suit should be legal.');
assert.strictEqual(CrazyEightsRules.isPlayable(card('spades', 'queen'), eights), false, 'Unmatched card should be illegal.');
assert.strictEqual(CrazyEightsRules.applyAction(eights, { type: 'play', cardId: eights.hands.human[1].id, suit: 'spades' }), true);
assert.strictEqual(eights.activeSuit, 'spades', 'Playing an Eight should set the chosen suit.');
eights = { ...eightsState(), hands: { human: [card('clubs', 'queen')], computer: [card('spades', 'king')] } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(CrazyEightsRules.legalActions(eights))), [{ type: 'draw' }]);
CrazyEightsRules.applyAction(eights, { type: 'draw' });
assert.strictEqual(eights.turn, 'computer', 'Drawing an unplayable card should end the turn.');
eights = { ...eightsState(), drawPile: [], discardPile: [card('clubs', '2'), card('diamonds', '3'), card('hearts', '5')], hands: { human: [card('spades', 'queen')], computer: [card('spades', 'king')] } };
assert.strictEqual(CrazyEightsRules.recycleDiscard(eights), true);
assert.strictEqual(eights.discardPile.length, 1, 'Recycle must preserve the top discard.');
assert.strictEqual(eights.drawPile.length, 2);
eights = { ...eightsState(), drawPile: [], discardPile: [card('hearts', '5')], hands: { human: [card('clubs', 'queen')], computer: [card('spades', 'king')] } };
assert.deepStrictEqual(JSON.parse(JSON.stringify(CrazyEightsRules.legalActions(eights))), [{ type: 'draw' }], 'An exhausted pile should still allow the no-card draw/pass action.');
CrazyEightsRules.applyAction(eights, { type: 'draw' });
assert.strictEqual(eights.turn, 'computer');
CrazyEightsRules.applyAction(eights, { type: 'draw' });
assert.strictEqual(eights.phase, 'complete', 'Two blocked turns with no draw cards must end the game.');
assert.strictEqual(eights.winner, 'draw', 'Equal hands at an exhausted-deck stalemate should draw.');
eights = eightsState(); eights.turn = 'computer'; eights.hands.computer = [card('hearts', 'queen'), card('clubs', '8'), card('spades', '3')];
const aiEightAction = CrazyEightsAI.chooseAction(eights);
assert(CrazyEightsRules.legalActions(eights).some(action => JSON.stringify(action) === JSON.stringify(aiEightAction)), 'Crazy Eights AI must choose through legal actions.');
CrazyEightsRules.applyAction(eights, aiEightAction);
assert.strictEqual(eights.turn, 'human');

function fishState() {
  return { deck: [card('clubs', '2')], hands: { human: [card('hearts', 'ace')], computer: [card('spades', 'ace'), card('clubs', 'king')] }, books: { human: [], computer: [] }, players: {}, memory: { aiKnownHumanRanks: [] }, turn: 'human', phase: 'playing', winner: null, lastAction: null };
}
let fish = fishState();
assert.deepStrictEqual(JSON.parse(JSON.stringify(GoFishRules.legalActions(fish))), [{ type: 'ask', rank: 'ace' }], 'Players may ask only for ranks they hold.');
assert.strictEqual(GoFishRules.applyAction(fish, { type: 'ask', rank: 'king' }), false, 'A request for an unheld rank must fail.');
GoFishRules.applyAction(fish, { type: 'ask', rank: 'ace' });
assert.strictEqual(fish.hands.human.filter(item => item.rank === 'ace').length, 2, 'A successful request transfers every matching card.');
assert.strictEqual(fish.turn, 'human', 'A successful request keeps the turn.');
fish = fishState(); fish.hands.computer = [card('clubs', 'king')]; fish.deck = [card('diamonds', 'ace')];
GoFishRules.applyAction(fish, { type: 'ask', rank: 'ace' });
assert.strictEqual(fish.lastAction.drewMatch, true, 'Drawing the asked rank should be recognized.');
assert.strictEqual(fish.turn, 'human', 'Fishing the asked rank keeps the turn.');
fish = fishState(); fish.hands.human = [card('clubs', '7'), card('diamonds', '7'), card('hearts', '7'), card('spades', '7')];
GoFishRules.removeBooks(fish, 'human');
assert.deepStrictEqual(Array.from(fish.books.human), ['7']);
assert.strictEqual(fish.hands.human.length, 0, 'A completed book leaves the active hand.');
fish = fishState(); fish.turn = 'computer'; fish.hands.computer = [card('clubs', 'ace'), card('diamonds', 'king')]; fish.memory.aiKnownHumanRanks = ['ace'];
const fishAiAction = GoFishAI.chooseAction(fish);
assert.strictEqual(fishAiAction.rank, 'ace', 'Go Fish AI should use remembered rank information.');
assert(GoFishRules.legalActions(fish).some(action => action.rank === fishAiAction.rank), 'Go Fish AI must choose a legal request.');
fish = fishState(); fish.deck = []; fish.hands.computer = [];
GoFishRules.applyAction(fish, { type: 'ask', rank: 'ace' });
assert.strictEqual(fish.phase, 'complete', 'An empty hand with an exhausted deck should end the game.');

assert.doesNotThrow(() => JSON.stringify(eightsState()), 'Crazy Eights state must be serializable.');
assert.doesNotThrow(() => JSON.stringify(fishState()), 'Go Fish state must be serializable.');
console.log('card game tests passed');
