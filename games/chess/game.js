class ChessEngine {
  constructor(fen) {
    this.reset(fen);
  }

  reset(fen = ChessEngine.startingFen) {
    this.loadFen(fen);
  }

  loadFen(fen) {
    const [placement, turn = 'w', castling = '-', enPassant = '-'] = fen.trim().split(/\s+/);
    const ranks = placement.split('/');
    if (ranks.length !== 8) throw new Error('Invalid FEN: expected eight ranks.');

    this.board = ranks.map(rank => {
      const row = [];
      for (const token of rank) {
        if (/\d/.test(token)) {
          for (let count = 0; count < Number(token); count++) row.push(null);
        } else {
          row.push({ color: token === token.toUpperCase() ? 'w' : 'b', type: token.toLowerCase() });
        }
      }
      if (row.length !== 8) throw new Error('Invalid FEN: malformed rank.');
      return row;
    });
    this.turn = turn;
    this.castling = {
      w: { kingSide: castling.includes('K'), queenSide: castling.includes('Q') },
      b: { kingSide: castling.includes('k'), queenSide: castling.includes('q') }
    };
    this.enPassant = enPassant === '-' ? null : ChessEngine.squareToPosition(enPassant);
    this.lastMove = null;
    this.status = 'active';
    this.winner = null;
  }

  static squareToPosition(square) {
    if (!/^[a-h][1-8]$/.test(square)) throw new Error('Invalid chess square.');
    return { row: 8 - Number(square[1]), col: square.charCodeAt(0) - 97 };
  }

  static positionToSquare(position) {
    return `${String.fromCharCode(97 + position.col)}${8 - position.row}`;
  }

  static cloneState(engine) {
    return {
      board: engine.board.map(row => row.map(piece => piece ? { ...piece } : null)),
      turn: engine.turn,
      castling: {
        w: { ...engine.castling.w },
        b: { ...engine.castling.b }
      },
      enPassant: engine.enPassant ? { ...engine.enPassant } : null
    };
  }

  getState() {
    return {
      ...ChessEngine.cloneState(this),
      lastMove: this.lastMove ? {
        from: { ...this.lastMove.from },
        to: { ...this.lastMove.to }
      } : null,
      status: this.status,
      winner: this.winner,
      inCheck: this.isInCheck(this.turn)
    };
  }

  isInside(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  findKing(color, board = this.board) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece?.color === color && piece.type === 'k') return { row, col };
      }
    }
    return null;
  }

  isSquareAttacked(row, col, byColor, board = this.board) {
    const pawnSourceRow = row + (byColor === 'w' ? 1 : -1);
    for (const offset of [-1, 1]) {
      const pawn = board[pawnSourceRow]?.[col + offset];
      if (pawn?.color === byColor && pawn.type === 'p') return true;
    }

    const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    if (knightOffsets.some(([rowOffset, colOffset]) => {
      const piece = board[row + rowOffset]?.[col + colOffset];
      return piece?.color === byColor && piece.type === 'n';
    })) return true;

    const scan = (directions, types) => directions.some(([rowStep, colStep]) => {
      let scanRow = row + rowStep;
      let scanCol = col + colStep;
      while (this.isInside(scanRow, scanCol)) {
        const piece = board[scanRow][scanCol];
        if (piece) return piece.color === byColor && types.includes(piece.type);
        scanRow += rowStep;
        scanCol += colStep;
      }
      return false;
    });
    if (scan([[-1, 0], [1, 0], [0, -1], [0, 1]], ['r', 'q'])) return true;
    if (scan([[-1, -1], [-1, 1], [1, -1], [1, 1]], ['b', 'q'])) return true;

    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        if (!rowOffset && !colOffset) continue;
        const piece = board[row + rowOffset]?.[col + colOffset];
        if (piece?.color === byColor && piece.type === 'k') return true;
      }
    }
    return false;
  }

  isInCheck(color, board = this.board) {
    const king = this.findKing(color, board);
    if (!king) return true;
    return this.isSquareAttacked(king.row, king.col, color === 'w' ? 'b' : 'w', board);
  }

  addMove(moves, from, to, extra = {}) {
    const target = this.board[to.row][to.col];
    if (target?.type === 'k') return;
    moves.push({ from: { ...from }, to: { ...to }, ...extra });
  }

  getPseudoMoves(row, col) {
    const piece = this.board[row]?.[col];
    if (!piece) return [];
    const from = { row, col };
    const moves = [];
    const addStep = (toRow, toCol) => {
      if (!this.isInside(toRow, toCol)) return;
      const target = this.board[toRow][toCol];
      if (!target || target.color !== piece.color) this.addMove(moves, from, { row: toRow, col: toCol });
    };
    const addRays = directions => {
      for (const [rowStep, colStep] of directions) {
        let toRow = row + rowStep;
        let toCol = col + colStep;
        while (this.isInside(toRow, toCol)) {
          const target = this.board[toRow][toCol];
          if (!target) this.addMove(moves, from, { row: toRow, col: toCol });
          else {
            if (target.color !== piece.color) this.addMove(moves, from, { row: toRow, col: toCol });
            break;
          }
          toRow += rowStep;
          toCol += colStep;
        }
      }
    };

    if (piece.type === 'p') {
      const direction = piece.color === 'w' ? -1 : 1;
      const startRow = piece.color === 'w' ? 6 : 1;
      const promotionRow = piece.color === 'w' ? 0 : 7;
      if (!this.board[row + direction]?.[col]) {
        this.addMove(moves, from, { row: row + direction, col }, { promotion: row + direction === promotionRow });
        if (row === startRow && !this.board[row + direction * 2][col]) {
          this.addMove(moves, from, { row: row + direction * 2, col }, { doublePawn: true });
        }
      }
      for (const colOffset of [-1, 1]) {
        const to = { row: row + direction, col: col + colOffset };
        if (!this.isInside(to.row, to.col)) continue;
        const target = this.board[to.row][to.col];
        if (target && target.color !== piece.color) {
          this.addMove(moves, from, to, { promotion: to.row === promotionRow });
        } else if (this.enPassant && to.row === this.enPassant.row && to.col === this.enPassant.col) {
          const adjacent = this.board[row][to.col];
          if (adjacent?.color !== piece.color && adjacent?.type === 'p') this.addMove(moves, from, to, { enPassant: true });
        }
      }
    } else if (piece.type === 'n') {
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([rowOffset, colOffset]) => addStep(row + rowOffset, col + colOffset));
    } else if (piece.type === 'b') {
      addRays([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    } else if (piece.type === 'r') {
      addRays([[-1, 0], [1, 0], [0, -1], [0, 1]]);
    } else if (piece.type === 'q') {
      addRays([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]);
    } else if (piece.type === 'k') {
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          if (rowOffset || colOffset) addStep(row + rowOffset, col + colOffset);
        }
      }
      this.addCastlingMoves(moves, piece.color, from);
    }
    return moves;
  }

  addCastlingMoves(moves, color, from) {
    const homeRow = color === 'w' ? 7 : 0;
    const opponent = color === 'w' ? 'b' : 'w';
    if (from.row !== homeRow || from.col !== 4 || this.isInCheck(color)) return;
    const options = [
      { side: 'kingSide', rookCol: 7, emptyCols: [5, 6], safeCols: [5, 6], kingCol: 6 },
      { side: 'queenSide', rookCol: 0, emptyCols: [1, 2, 3], safeCols: [3, 2], kingCol: 2 }
    ];
    for (const option of options) {
      const rook = this.board[homeRow][option.rookCol];
      if (!this.castling[color][option.side] || rook?.color !== color || rook.type !== 'r') continue;
      if (option.emptyCols.some(col => this.board[homeRow][col])) continue;
      if (option.safeCols.some(col => this.isSquareAttacked(homeRow, col, opponent))) continue;
      this.addMove(moves, from, { row: homeRow, col: option.kingCol }, { castle: option.side });
    }
  }

  applyMoveToState(state, move, promotion = 'q') {
    const piece = state.board[move.from.row][move.from.col];
    const captured = state.board[move.to.row][move.to.col];
    state.board[move.from.row][move.from.col] = null;
    state.board[move.to.row][move.to.col] = { ...piece };

    if (move.enPassant) state.board[move.from.row][move.to.col] = null;
    if (move.castle) {
      const rookFromCol = move.castle === 'kingSide' ? 7 : 0;
      const rookToCol = move.castle === 'kingSide' ? 5 : 3;
      state.board[move.to.row][rookToCol] = state.board[move.to.row][rookFromCol];
      state.board[move.to.row][rookFromCol] = null;
    }
    if (move.promotion) state.board[move.to.row][move.to.col].type = promotion;

    if (piece.type === 'k') {
      state.castling[piece.color].kingSide = false;
      state.castling[piece.color].queenSide = false;
    }
    if (piece.type === 'r') this.disableRookCastling(state, piece.color, move.from.row, move.from.col);
    if (captured?.type === 'r') this.disableRookCastling(state, captured.color, move.to.row, move.to.col);
    state.enPassant = move.doublePawn ? { row: (move.from.row + move.to.row) / 2, col: move.from.col } : null;
  }

  disableRookCastling(state, color, row, col) {
    const homeRow = color === 'w' ? 7 : 0;
    if (row !== homeRow) return;
    if (col === 0) state.castling[color].queenSide = false;
    if (col === 7) state.castling[color].kingSide = false;
  }

  getLegalMoves(row, col) {
    const piece = this.board[row]?.[col];
    if (!piece || piece.color !== this.turn || this.status !== 'active') return [];
    return this.getPseudoMoves(row, col).filter(move => {
      const state = ChessEngine.cloneState(this);
      this.applyMoveToState(state, move);
      return !this.isInCheck(piece.color, state.board);
    });
  }

  getAllLegalMoves(color = this.turn) {
    const originalTurn = this.turn;
    this.turn = color;
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) moves.push(...this.getLegalMoves(row, col));
    }
    this.turn = originalTurn;
    return moves;
  }

  move(from, to, promotion) {
    if (this.status !== 'active') return { ok: false, reason: 'game-over' };
    const legalMove = this.getLegalMoves(from.row, from.col).find(candidate => candidate.to.row === to.row && candidate.to.col === to.col);
    if (!legalMove) return { ok: false, reason: 'illegal' };
    if (legalMove.promotion && !['q', 'r', 'b', 'n'].includes(promotion)) return { ok: false, reason: 'promotion-required', move: legalMove };

    const state = ChessEngine.cloneState(this);
    this.applyMoveToState(state, legalMove, promotion);
    this.board = state.board;
    this.castling = state.castling;
    this.enPassant = state.enPassant;
    this.lastMove = { from: { ...from }, to: { ...to } };
    this.turn = this.turn === 'w' ? 'b' : 'w';

    const replies = this.getAllLegalMoves();
    if (!replies.length) {
      if (this.isInCheck(this.turn)) {
        this.status = 'checkmate';
        this.winner = this.turn === 'w' ? 'b' : 'w';
      } else {
        this.status = 'stalemate';
      }
    }
    return { ok: true, status: this.status, check: this.isInCheck(this.turn) };
  }
}

ChessEngine.startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

if (typeof module !== 'undefined' && module.exports) module.exports = ChessEngine;

if (typeof document !== 'undefined') {
  const ChessGame = (() => {
    const symbols = {
      wk: '♚', wq: '♛', wr: '♜', wb: '♝', wn: '♞', wp: '♟',
      bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟'
    };
    const pieceNames = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    const playTimer = Storage.createPlayTimer('chess');
    let engine;
    let selected = null;
    let legalMoves = [];
    let pendingPromotion = null;
    let aiTimer = null;

    function mode() {
      return document.getElementById('mode-select').value;
    }

    function sameSquare(first, second) {
      return first && second && first.row === second.row && first.col === second.col;
    }

    function initialise() {
      clearTimeout(aiTimer);
      playTimer.reset();
      GameUI.clearGameOver();
      closePromotion();
      engine = new ChessEngine();
      selected = null;
      legalMoves = [];
      render();
    }

    function selectSquare(position) {
      if (pendingPromotion || engine.status !== 'active' || (mode() === 'computer' && engine.turn === 'b')) return;
      const piece = engine.board[position.row][position.col];
      const chosenMove = legalMoves.find(move => sameSquare(move.to, position));
      if (selected && chosenMove) {
        if (chosenMove.promotion) openPromotion(chosenMove);
        else completeMove(chosenMove);
        return;
      }
      if (sameSquare(selected, position)) {
        selected = null;
        legalMoves = [];
      } else if (piece?.color === engine.turn) {
        selected = position;
        legalMoves = engine.getLegalMoves(position.row, position.col);
      } else {
        selected = null;
        legalMoves = [];
      }
      render();
    }

    function completeMove(move, promotion) {
      playTimer.start();
      engine.move(move.from, move.to, promotion);
      selected = null;
      legalMoves = [];
      render();
      if (engine.status !== 'active') finish();
      else if (mode() === 'computer' && engine.turn === 'b') scheduleComputerMove();
    }

    function cloneEngine(source) {
      const copy = new ChessEngine();
      copy.board = source.board.map(row => row.map(piece => piece ? { ...piece } : null));
      copy.turn = source.turn;
      copy.castling = { w: { ...source.castling.w }, b: { ...source.castling.b } };
      copy.enPassant = source.enPassant ? { ...source.enPassant } : null;
      copy.lastMove = source.lastMove ? { from: { ...source.lastMove.from }, to: { ...source.lastMove.to } } : null;
      copy.status = source.status;
      copy.winner = source.winner;
      return copy;
    }

    function evaluatePosition(position) {
      if (position.status === 'checkmate') return position.winner === 'w' ? 100000 : -100000;
      if (position.status === 'stalemate') return 0;
      let score = 0;
      position.board.forEach((row, rowIndex) => row.forEach(piece => {
        if (!piece) return;
        const advancement = piece.type === 'p' ? (piece.color === 'w' ? 6 - rowIndex : rowIndex - 1) * 3 : 0;
        score += (pieceValues[piece.type] + advancement) * (piece.color === 'w' ? 1 : -1);
      }));
      return score;
    }

    function chooseComputerMove() {
      let bestScore = Infinity;
      let choices = [];
      for (const move of engine.getAllLegalMoves()) {
        const next = cloneEngine(engine);
        next.move(move.from, move.to, move.promotion ? 'q' : undefined);
        let score = evaluatePosition(next);
        if (next.status === 'active') {
          const replies = next.getAllLegalMoves();
          score = Math.max(...replies.map(reply => {
            const afterReply = cloneEngine(next);
            afterReply.move(reply.from, reply.to, reply.promotion ? 'q' : undefined);
            return evaluatePosition(afterReply);
          }));
        }
        score += Math.random() * 8;
        if (score < bestScore) {
          bestScore = score;
          choices = [move];
        } else if (score === bestScore) choices.push(move);
      }
      return choices[Math.floor(Math.random() * choices.length)];
    }

    function scheduleComputerMove() {
      clearTimeout(aiTimer);
      document.getElementById('chess-status').textContent = 'Computer is thinking…';
      aiTimer = setTimeout(() => {
        if (engine.status !== 'active' || mode() !== 'computer' || engine.turn !== 'b') return;
        const move = chooseComputerMove();
        if (move) completeMove(move, move.promotion ? 'q' : undefined);
      }, 260);
    }

    function finish() {
      clearTimeout(aiTimer);
      playTimer.stop();
      const result = engine.status === 'stalemate' ? 'draw' : engine.winner === 'w' ? 'win' : 'loss';
      Storage.recordResult('chess', result);
      updateStatsUI();
      if (engine.status === 'checkmate') {
        const winner = engine.winner === 'w' ? 'Player 1' : mode() === 'computer' ? 'Computer' : 'Player 2';
        GameUI.showGameOver({ title: 'Checkmate', message: `${winner} wins.`, restartLabel: 'New Game', onRestart: initialise });
      } else {
        GameUI.showGameOver({ title: 'Stalemate', message: 'No legal moves remain. The game is a draw.', restartLabel: 'New Game', onRestart: initialise });
      }
    }

    function openPromotion(move) {
      pendingPromotion = move;
      const dialog = document.getElementById('promotion-dialog');
      const choices = dialog.querySelector('.promotion-choices');
      choices.innerHTML = '';
      for (const type of ['q', 'r', 'b', 'n']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `promotion-choice ${engine.turn === 'w' ? 'white-piece' : 'black-piece'}`;
        button.dataset.piece = type;
        button.setAttribute('aria-label', `Promote to ${pieceNames[type]}`);
        button.textContent = symbols[`${engine.turn}${type}`];
        button.addEventListener('click', () => {
          const chosen = pendingPromotion;
          closePromotion();
          completeMove(chosen, type);
        });
        choices.appendChild(button);
      }
      dialog.hidden = false;
      choices.querySelector('button').focus();
    }

    function closePromotion() {
      pendingPromotion = null;
      const dialog = document.getElementById('promotion-dialog');
      if (dialog) dialog.hidden = true;
    }

    function statusText() {
      if (engine.status === 'checkmate') return `Checkmate. ${engine.winner === 'w' ? 'White' : 'Black'} wins.`;
      if (engine.status === 'stalemate') return 'Stalemate. The game is a draw.';
      const player = engine.turn === 'w' ? 'Player 1 (White)' : mode() === 'computer' ? 'Computer (Black)' : 'Player 2 (Black)';
      return engine.isInCheck(engine.turn) ? `${player} is in check.` : `${player} to move.`;
    }

    function render() {
      const board = document.getElementById('chess-board');
      const focused = document.activeElement?.classList.contains('chess-square') ? {
        row: Number(document.activeElement.dataset.row),
        col: Number(document.activeElement.dataset.col)
      } : null;
      const state = engine.getState();
      const checkedKing = state.inCheck ? engine.findKing(engine.turn) : null;
      board.innerHTML = '';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const position = { row, col };
          const piece = engine.board[row][col];
          const move = legalMoves.find(candidate => sameSquare(candidate.to, position));
          const square = document.createElement('button');
          square.type = 'button';
          square.className = `chess-square ${(row + col) % 2 ? 'dark' : 'light'}`;
          square.dataset.row = row;
          square.dataset.col = col;
          square.setAttribute('role', 'gridcell');
          square.setAttribute('aria-selected', sameSquare(selected, position) ? 'true' : 'false');
          square.disabled = mode() === 'computer' && engine.turn === 'b';
          square.setAttribute('aria-label', `${ChessEngine.positionToSquare(position)}${piece ? `, ${piece.color === 'w' ? 'white' : 'black'} ${pieceNames[piece.type]}` : ', empty'}`);
          if (sameSquare(selected, position)) square.classList.add('selected');
          if (move) square.classList.add(engine.board[row][col] || move.enPassant ? 'legal-capture' : 'legal-move');
          if (sameSquare(engine.lastMove?.from, position) || sameSquare(engine.lastMove?.to, position)) square.classList.add('last-move');
          if (sameSquare(checkedKing, position)) square.classList.add('in-check');
          if (piece) {
            const pieceSpan = document.createElement('span');
            pieceSpan.className = `chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`;
            pieceSpan.setAttribute('aria-hidden', 'true');
            pieceSpan.textContent = symbols[`${piece.color}${piece.type}`];
            square.appendChild(pieceSpan);
          }
          if (row === 7) {
            const file = document.createElement('span');
            file.className = 'file-label';
            file.setAttribute('aria-hidden', 'true');
            file.textContent = String.fromCharCode(97 + col);
            square.appendChild(file);
          }
          if (col === 0) {
            const rank = document.createElement('span');
            rank.className = 'rank-label';
            rank.setAttribute('aria-hidden', 'true');
            rank.textContent = 8 - row;
            square.appendChild(rank);
          }
          square.addEventListener('click', () => selectSquare(position));
          square.addEventListener('keydown', handleBoardKey);
          board.appendChild(square);
        }
      }
      document.getElementById('turn-indicator').textContent = engine.turn === 'w' ? 'Player 1 (White)' : mode() === 'computer' ? 'Computer (Black)' : 'Player 2 (Black)';
      document.getElementById('chess-status').textContent = statusText();
      updateStatsUI();
      if (focused) board.querySelector(`[data-row="${focused.row}"][data-col="${focused.col}"]`)?.focus();
    }

    function updateStatsUI() {
      const stats = Storage.getStats('chess');
      document.getElementById('games-played').textContent = stats.gamesPlayed;
      document.getElementById('wins').textContent = stats.wins;
      document.getElementById('losses').textContent = stats.losses;
      document.getElementById('draws').textContent = stats.draws;
      document.getElementById('time-played').textContent = `${Math.floor(stats.timePlayed / 60)}m ${stats.timePlayed % 60}s`;
    }

    function handleBoardKey(event) {
      const offsets = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (!offsets[event.key]) return;
      event.preventDefault();
      const row = Math.min(7, Math.max(0, Number(event.currentTarget.dataset.row) + offsets[event.key][0]));
      const col = Math.min(7, Math.max(0, Number(event.currentTarget.dataset.col) + offsets[event.key][1]));
      document.querySelector(`.chess-square[data-row="${row}"][data-col="${col}"]`)?.focus();
    }

    function setup() {
      document.getElementById('backToHub').href = '/';
      document.querySelectorAll('.restart-btn').forEach(button => button.addEventListener('click', initialise));
      document.getElementById('mode-select').addEventListener('change', initialise);
      window.addEventListener('pagehide', () => { clearTimeout(aiTimer); playTimer.stop(); });
      window.addEventListener('pageshow', event => { if (event.persisted) initialise(); });
      initialise();
    }

    window.initGame = initialise;
    window.restartGame = initialise;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
    else setup();
    return { initialise };
  })();
}
