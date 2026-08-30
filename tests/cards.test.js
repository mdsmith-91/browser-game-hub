const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const sandbox = { console, Math };
vm.runInNewContext(`${fs.readFileSync('js/cards.js', 'utf8')}\nthis.PlayingCards = PlayingCards;`, sandbox);
vm.runInNewContext(`${fs.readFileSync('games/solitaire/solitaire-rules.js', 'utf8')}\nthis.SolitaireRules = SolitaireRules;`, sandbox);
const { PlayingCards, SolitaireRules } = sandbox;

function card(suit, rank, faceUp = true) {
  return new PlayingCards.Card(suit, rank, { faceUp });
}

function emptyState() {
  return {
    tableau: Array.from({ length: 7 }, () => []),
    stock: [],
    waste: [],
    foundations: Object.fromEntries(PlayingCards.suits.map(suit => [suit, []])),
    moves: 0
  };
}

const standardDeck = PlayingCards.createStandardDeck();
assert.strictEqual(standardDeck.length, 52, 'A standard deck must contain 52 cards.');
assert.strictEqual(new Set(standardDeck.map(item => item.id)).size, 52, 'Every card ID must be unique.');
for (const suit of PlayingCards.suits) assert.strictEqual(standardDeck.filter(item => item.suit === suit).length, 13, `${suit} must contain 13 ranks.`);
for (const rank of PlayingCards.ranks) assert.strictEqual(standardDeck.filter(item => item.rank === rank).length, 4, `${rank} must appear once per suit.`);
assert.strictEqual(card('hearts', 'ace').color, 'red');
assert.strictEqual(card('spades', 'king').color, 'black');

const originalIds = standardDeck.map(item => item.id);
const shuffled = PlayingCards.shuffle(standardDeck.map(item => item.clone()), () => 0.25);
assert.deepStrictEqual(Array.from(shuffled, item => item.id).sort(), [...originalIds].sort(), 'Shuffle must preserve every card.');
assert.notDeepStrictEqual(Array.from(shuffled, item => item.id), originalIds, 'Shuffle should change card order.');

const reusableDeck = new PlayingCards.Deck();
const drawn = reusableDeck.draw(5);
assert.strictEqual(drawn.length, 5);
assert.strictEqual(reusableDeck.size, 47);
reusableDeck.reset();
assert.strictEqual(reusableDeck.size, 52, 'Reset must restore the full deck.');

const initial = SolitaireRules.createInitialState(PlayingCards.createStandardDeck());
assert.deepStrictEqual(Array.from(initial.tableau, pile => pile.length), [1, 2, 3, 4, 5, 6, 7], 'Tableau piles must contain one through seven cards.');
assert.strictEqual(initial.stock.length, 24, 'The undealt 24 cards must remain in stock.');
initial.tableau.forEach(pile => {
  assert.strictEqual(pile.filter(item => item.faceUp).length, 1, 'Each initial tableau pile needs one face-up card.');
  assert.strictEqual(pile[pile.length - 1].faceUp, true, 'Only the top tableau card starts face up.');
});

assert.strictEqual(SolitaireRules.canStackOnTableau(card('hearts', '7'), card('clubs', '8')), true, 'Tableau accepts descending alternating colors.');
assert.strictEqual(SolitaireRules.canStackOnTableau(card('diamonds', '7'), card('hearts', '8')), false, 'Tableau rejects matching colors.');
assert.strictEqual(SolitaireRules.canStackOnTableau(card('spades', '6'), card('hearts', '8')), false, 'Tableau rejects ranks that are not descending by one.');
assert.strictEqual(SolitaireRules.canStackOnTableau(card('clubs', 'king'), null), true, 'A King can enter an empty tableau column.');
assert.strictEqual(SolitaireRules.canStackOnTableau(card('clubs', 'queen'), null), false, 'Only a King can enter an empty tableau column.');

assert.strictEqual(SolitaireRules.canMoveToFoundation(card('hearts', 'ace'), []), true, 'A foundation begins with an Ace.');
assert.strictEqual(SolitaireRules.canMoveToFoundation(card('hearts', '2'), [card('hearts', 'ace')]), true, 'A foundation builds by rank in one suit.');
assert.strictEqual(SolitaireRules.canMoveToFoundation(card('diamonds', '2'), [card('hearts', 'ace')]), false, 'A foundation rejects another suit.');
assert.strictEqual(SolitaireRules.canMoveToFoundation(card('hearts', '3'), [card('hearts', 'ace')]), false, 'A foundation rejects skipped ranks.');

const exposing = emptyState();
exposing.tableau[0] = [card('spades', '9', false), card('hearts', '8')];
exposing.tableau[1] = [card('clubs', '9')];
assert.strictEqual(SolitaireRules.move(exposing, { type: 'tableau', pile: 0, index: 1 }, { type: 'tableau', pile: 1 }), true);
assert.strictEqual(exposing.tableau[0][0].faceUp, true, 'Moving the top card must expose and flip the next tableau card.');

const sequence = emptyState();
sequence.tableau[0] = [card('hearts', 'queen'), card('clubs', 'jack'), card('diamonds', '10')];
sequence.tableau[1] = [card('spades', 'king')];
assert.strictEqual(SolitaireRules.isValidSequence(sequence.tableau[0]), true);
assert.strictEqual(SolitaireRules.move(sequence, { type: 'tableau', pile: 0, index: 0 }, { type: 'tableau', pile: 1 }), true, 'A valid ordered stack should move together.');
assert.strictEqual(sequence.tableau[1].length, 4);

const stockState = emptyState();
stockState.stock = [card('clubs', 'ace', false)];
assert.strictEqual(SolitaireRules.drawStock(stockState), true);
assert.strictEqual(stockState.stock.length, 0);
assert.strictEqual(stockState.waste[0].faceUp, true, 'Drawing turns the waste card face up.');
assert.strictEqual(SolitaireRules.drawStock(stockState), true, 'An empty stock recycles a non-empty waste.');
assert.strictEqual(stockState.stock[0].faceUp, false, 'Recycled cards return face down.');

const foundationMove = emptyState();
foundationMove.waste = [card('diamonds', 'ace')];
assert.strictEqual(SolitaireRules.move(foundationMove, { type: 'waste' }, { type: 'foundation', suit: 'diamonds' }), true);
foundationMove.tableau[0] = [card('clubs', '2')];
assert.strictEqual(SolitaireRules.move(foundationMove, { type: 'foundation', suit: 'diamonds' }, { type: 'tableau', pile: 0 }), true, 'Foundation cards may return to a valid tableau pile.');

const undoSource = emptyState();
undoSource.stock = [card('spades', 'ace', false)];
const undoSnapshot = SolitaireRules.cloneState(undoSource);
SolitaireRules.drawStock(undoSource);
assert.strictEqual(undoSource.moves, 1);
assert.strictEqual(undoSnapshot.moves, 0, 'An undo snapshot must preserve the previous move count.');
assert.strictEqual(undoSnapshot.stock.length, 1, 'An undo snapshot must preserve stock and face state independently.');
assert.strictEqual(undoSnapshot.stock[0].faceUp, false);

const won = emptyState();
for (const suit of PlayingCards.suits) won.foundations[suit] = PlayingCards.ranks.map(rank => card(suit, rank));
assert.strictEqual(SolitaireRules.isVictory(won), true, 'Victory requires all 52 cards in the foundations.');
won.foundations.clubs.pop();
assert.strictEqual(SolitaireRules.isVictory(won), false);

console.log('card and Solitaire tests passed');
