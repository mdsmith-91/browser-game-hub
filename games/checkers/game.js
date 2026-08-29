const CheckersGame = (() => {
  let board;
  let currentPlayer;
  let selectedPiece;
  let legalMoves;
  let mustContinueFrom;
  let captures;
  let gameActive;

  const directionsFor = piece => piece.king
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === 'red' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

  function initialise() {
    board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) if ((row + col) % 2) board[row][col] = { color: 'white', king: false };
    }
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) if ((row + col) % 2) board[row][col] = { color: 'red', king: false };
    }
    currentPlayer = 'red';
    selectedPiece = null;
    legalMoves = [];
    mustContinueFrom = null;
    captures = { red: 0, white: 0 };
    gameActive = true;
    render();
    updateUI();
  }

  const inside = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

  function movesFor(row, col, capturesOnly = false) {
    const piece = board[row][col];
    if (!piece) return [];
    const moves = [];
    directionsFor(piece).forEach(([dr, dc]) => {
      const adjacentRow = row + dr;
      const adjacentCol = col + dc;
      const landingRow = row + dr * 2;
      const landingCol = col + dc * 2;
      if (!capturesOnly && inside(adjacentRow, adjacentCol) && !board[adjacentRow][adjacentCol]) {
        moves.push({ row: adjacentRow, col: adjacentCol, capture: null });
      }
      if (inside(landingRow, landingCol) && !board[landingRow][landingCol] && inside(adjacentRow, adjacentCol)) {
        const jumped = board[adjacentRow][adjacentCol];
        if (jumped && jumped.color !== piece.color) moves.push({ row: landingRow, col: landingCol, capture: { row: adjacentRow, col: adjacentCol } });
      }
    });
    return capturesOnly ? moves.filter(move => move.capture) : moves;
  }

  function playerHasCapture(color) {
    return board.some((row, rowIndex) => row.some((piece, colIndex) => piece?.color === color && movesFor(rowIndex, colIndex, true).length));
  }

  function handleCell(row, col) {
    if (!gameActive) return;
    const piece = board[row][col];
    if (piece?.color === currentPlayer && (!mustContinueFrom || (mustContinueFrom.row === row && mustContinueFrom.col === col))) {
      const capturesRequired = Boolean(mustContinueFrom) || playerHasCapture(currentPlayer);
      const moves = movesFor(row, col, capturesRequired);
      if (moves.length) {
        selectedPiece = { row, col };
        legalMoves = moves;
        render();
      }
      return;
    }
    const move = legalMoves.find(candidate => candidate.row === row && candidate.col === col);
    if (selectedPiece && move) executeMove(move);
  }

  function executeMove(move) {
    const piece = board[selectedPiece.row][selectedPiece.col];
    board[selectedPiece.row][selectedPiece.col] = null;
    board[move.row][move.col] = piece;
    if (move.capture) {
      board[move.capture.row][move.capture.col] = null;
      captures[currentPlayer]++;
    }
    const promoted = !piece.king && ((piece.color === 'red' && move.row === 0) || (piece.color === 'white' && move.row === 7));
    if (promoted) piece.king = true;

    // In American checkers, crowning ends a capture sequence.
    const followUps = move.capture && !promoted ? movesFor(move.row, move.col, true) : [];
    if (followUps.length) {
      mustContinueFrom = { row: move.row, col: move.col };
      selectedPiece = mustContinueFrom;
      legalMoves = followUps;
      render();
      updateUI();
      return;
    }
    endTurn();
  }

  function endTurn() {
    selectedPiece = null;
    legalMoves = [];
    mustContinueFrom = null;
    currentPlayer = currentPlayer === 'red' ? 'white' : 'red';
    if (!hasPieces(currentPlayer) || !hasLegalMove(currentPlayer)) {
      finish(currentPlayer === 'red' ? 'white' : 'red');
      return;
    }
    render();
    updateUI();
  }

  function hasPieces(color) {
    return board.some(row => row.some(piece => piece?.color === color));
  }

  function hasLegalMove(color) {
    const capturesRequired = playerHasCapture(color);
    return board.some((row, rowIndex) => row.some((piece, colIndex) => piece?.color === color && movesFor(rowIndex, colIndex, capturesRequired).length));
  }

  function render() {
    const element = document.getElementById('game-board');
    element.className = 'checkers-board';
    element.innerHTML = '';
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const cell = document.createElement('button');
      const target = legalMoves.find(move => move.row === row && move.col === col);
      cell.type = 'button';
      cell.className = `checkers-cell ${(row + col) % 2 ? 'dark' : 'light'}${target ? (target.capture ? ' highlight-capture' : ' valid-move') : ''}`;
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}`);
      cell.addEventListener('click', () => handleCell(row, col));
      const piece = board[row][col];
      if (piece) {
        const pieceEl = document.createElement('span');
        pieceEl.className = `piece ${piece.color}${piece.king ? ' king' : ''}${selectedPiece?.row === row && selectedPiece.col === col ? ' selected' : ''}`;
        cell.appendChild(pieceEl);
      }
      element.appendChild(cell);
    }
  }

  function updateUI() {
    const count = color => board.flat().filter(piece => piece?.color === color).length;
    document.getElementById('turn-indicator').textContent = currentPlayer === 'red' ? 'Red' : 'White';
    document.getElementById('red-captures').textContent = captures.red;
    document.getElementById('white-captures').textContent = captures.white;
    document.getElementById('red-pieces').textContent = count('red');
    document.getElementById('white-pieces').textContent = count('white');
  }

  function finish(winner) {
    gameActive = false;
    Storage.updateStats('checkers', true);
    Storage.saveHighScore('checkers', captures[winner]);
    render();
    updateUI();
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.innerHTML = `<div class="modal-content"><h2>${winner === 'red' ? 'Red' : 'White'} wins!</h2><p>No legal moves remain for the opponent.</p><button class="game-btn btn-primary">Play Again</button></div>`;
    modal.querySelector('button').addEventListener('click', () => { modal.remove(); initialise(); });
    document.body.appendChild(modal);
  }

  function setup() {
    document.getElementById('backToHub').href = '/';
    document.querySelectorAll('.restart-btn').forEach(button => button.addEventListener('click', initialise));
    initialise();
  }

  window.initGame = initialise;
  window.restartGame = initialise;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
