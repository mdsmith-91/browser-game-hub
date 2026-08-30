const assert = require('assert');
const fs = require('fs');
const ChessEngine = require('../games/chess/game.js');
const chessSource = fs.readFileSync('games/chess/game.js', 'utf8');

assert(/wb: '♝'/.test(chessSource) && /bb: '♝'/.test(chessSource), 'Both bishops should use the same silhouette and rely on CSS for color.');
assert(/promotion-choice.*white-piece.*black-piece/.test(chessSource), 'Promotion glyphs should receive the moving side color.');

const position = ChessEngine.squareToPosition;
const play = (game, from, to, promotion) => game.move(position(from), position(to), promotion);
const destinations = (game, square) => game.getLegalMoves(position(square).row, position(square).col).map(move => ChessEngine.positionToSquare(move.to));
const clone = game => {
  const copy = new ChessEngine();
  copy.board = game.board.map(row => row.map(piece => piece ? { ...piece } : null));
  copy.turn = game.turn;
  copy.castling = { w: { ...game.castling.w }, b: { ...game.castling.b } };
  copy.enPassant = game.enPassant ? { ...game.enPassant } : null;
  copy.status = game.status;
  copy.winner = game.winner;
  return copy;
};
const perft = (game, depth) => {
  if (!depth) return 1;
  return game.getAllLegalMoves().reduce((nodes, move) => {
    const next = clone(game);
    assert(next.move(move.from, move.to, move.promotion ? 'q' : undefined).ok);
    return nodes + perft(next, depth - 1);
  }, 0);
};

const opening = new ChessEngine();
assert(destinations(opening, 'e2').includes('e4'), 'A pawn must be able to move two squares from its starting rank.');
assert(destinations(opening, 'g1').includes('f3'), 'A knight must be able to jump over pieces.');
assert(!destinations(opening, 'a1').includes('a3'), 'A rook must not move through its own pawn.');
assert(play(opening, 'e2', 'e4').ok, 'A legal pawn move should succeed.');
assert.strictEqual(opening.turn, 'b', 'Turns must alternate after a move.');
assert(!play(opening, 'e4', 'e5').ok, 'A player must not move the opponent\'s piece.');

assert.strictEqual(perft(new ChessEngine(), 1), 20, 'The opening position must have 20 legal moves.');
assert.strictEqual(perft(new ChessEngine(), 2), 400, 'The opening position must have 400 legal two-ply sequences.');
assert.strictEqual(perft(new ChessEngine(), 3), 8902, 'The opening position must have 8,902 legal three-ply sequences.');

const pinned = new ChessEngine('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
assert(!destinations(pinned, 'e2').includes('d2'), 'A move that exposes the king to check must be illegal.');
assert(destinations(pinned, 'e2').includes('e8'), 'A pinned piece may capture the checking line piece when legal.');

const castling = new ChessEngine('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
assert(destinations(castling, 'e1').includes('g1'), 'Kingside castling should be available when the path is clear and safe.');
assert(destinations(castling, 'e1').includes('c1'), 'Queenside castling should be available when the path is clear and safe.');
assert(play(castling, 'e1', 'g1').ok, 'Kingside castling should succeed.');
assert.strictEqual(castling.board[position('f1').row][position('f1').col].type, 'r', 'Castling must move the rook.');
assert.strictEqual(castling.castling.w.kingSide, false, 'Castling rights must end after the king moves.');

const attackedCastle = new ChessEngine('r3kr1r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
assert(!destinations(attackedCastle, 'e1').includes('g1'), 'Castling through an attacked square must be illegal.');

const movedRook = new ChessEngine('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1');
assert(play(movedRook, 'h1', 'h2').ok && play(movedRook, 'e8', 'e7').ok && play(movedRook, 'h2', 'h1').ok && play(movedRook, 'e7', 'e8').ok);
assert(!destinations(movedRook, 'e1').includes('g1'), 'Castling rights must not return when a rook returns home.');

const enPassant = new ChessEngine('4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1');
assert(play(enPassant, 'd7', 'd5').ok, 'The double pawn move should succeed.');
assert(destinations(enPassant, 'e5').includes('d6'), 'En passant should be available immediately after a double pawn move.');
assert(play(enPassant, 'e5', 'd6').ok, 'En passant capture should succeed.');
assert.strictEqual(enPassant.board[position('d5').row][position('d5').col], null, 'En passant must remove the passed pawn.');

const expiredEnPassant = new ChessEngine('4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1');
play(expiredEnPassant, 'd7', 'd5');
play(expiredEnPassant, 'e1', 'e2');
play(expiredEnPassant, 'e8', 'e7');
assert(!destinations(expiredEnPassant, 'e5').includes('d6'), 'En passant must expire after one reply.');

const promotion = new ChessEngine('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
assert.strictEqual(play(promotion, 'a7', 'a8').reason, 'promotion-required', 'Promotion must require an explicit piece choice.');
assert(play(promotion, 'a7', 'a8', 'n').ok, 'Promotion with a valid piece choice should succeed.');
assert.strictEqual(promotion.board[position('a8').row][position('a8').col].type, 'n', 'The selected promotion piece must be used.');

const checkmate = new ChessEngine();
for (const [from, to] of [['e2', 'e4'], ['e7', 'e5'], ['f1', 'c4'], ['b8', 'c6'], ['d1', 'h5'], ['g8', 'f6'], ['h5', 'f7']]) {
  assert(play(checkmate, from, to).ok, `${from}-${to} should be legal in the checkmate sequence.`);
}
assert.strictEqual(checkmate.status, 'checkmate', 'The engine must detect checkmate.');
assert.strictEqual(checkmate.winner, 'w', 'The checkmating player must be the winner.');
assert.strictEqual(checkmate.getAllLegalMoves().length, 0, 'A checkmated player must have no legal moves.');

const stalemate = new ChessEngine('7k/8/5QK1/8/8/8/8/8 w - - 0 1');
assert(play(stalemate, 'f6', 'f7').ok, 'The stalemating move should be legal.');
assert.strictEqual(stalemate.status, 'stalemate', 'The engine must detect stalemate.');
assert.strictEqual(stalemate.winner, null, 'Stalemate must not declare a winner.');

console.log('chess tests passed');
