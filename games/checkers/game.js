const CheckersGame = (() => {
  let board;
  let currentPlayer;
  let selectedPiece;
  let legalMoves;
  let mustContinueFrom;
  let captures;
  let gameActive;
  let quietMoves;
  let aiTimer = null;
  const playTimer = Storage.createPlayTimer('checkers');

  function mode() {
    return document.getElementById('mode-select').value;
  }

  const directionsFor = piece => piece.king
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === 'red' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

  function initialise() {
    clearTimeout(aiTimer);
    playTimer.reset();
    GameUI.clearGameOver();
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
    quietMoves = 0;
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
    if (!gameActive || (mode() === 'computer' && currentPlayer === 'white')) return;
    if (selectedPiece?.row === row && selectedPiece.col === col && !mustContinueFrom) {
      selectedPiece = null;
      legalMoves = [];
      render();
      return;
    }
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
    playTimer.start();
    const piece = board[selectedPiece.row][selectedPiece.col];
    board[selectedPiece.row][selectedPiece.col] = null;
    board[move.row][move.col] = piece;
    if (move.capture) {
      board[move.capture.row][move.capture.col] = null;
      captures[currentPlayer]++;
    }
    const promoted = !piece.king && ((piece.color === 'red' && move.row === 0) || (piece.color === 'white' && move.row === 7));
    if (promoted) piece.king = true;
    quietMoves = move.capture || promoted ? 0 : quietMoves + 1;

    // In American checkers, crowning ends a capture sequence.
    const followUps = move.capture && !promoted ? movesFor(move.row, move.col, true) : [];
    if (followUps.length) {
      mustContinueFrom = { row: move.row, col: move.col };
      selectedPiece = mustContinueFrom;
      legalMoves = followUps;
      render();
      updateUI();
      if (mode() === 'computer' && currentPlayer === 'white') scheduleComputerMove();
      return;
    }
    if (quietMoves >= 80) {
      finish(null);
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
    if (mode() === 'computer' && currentPlayer === 'white') scheduleComputerMove();
  }

  function allMoves(color) {
    const capturesRequired = playerHasCapture(color);
    const moves = [];
    board.forEach((row, rowIndex) => row.forEach((piece, colIndex) => {
      if (piece?.color !== color) return;
      movesFor(rowIndex, colIndex, capturesRequired).forEach(move => moves.push({ from: { row: rowIndex, col: colIndex }, move }));
    }));
    return moves;
  }

  function chooseComputerMove() {
    const choices = mustContinueFrom
      ? movesFor(mustContinueFrom.row, mustContinueFrom.col, true).map(move => ({ from: { ...mustContinueFrom }, move }))
      : allMoves('white');
    let bestScore = -Infinity;
    let best = [];
    choices.forEach(choice => {
      const piece = board[choice.from.row][choice.from.col];
      const captured = choice.move.capture ? board[choice.move.capture.row][choice.move.capture.col] : null;
      const promotes = !piece.king && choice.move.row === 7;
      const centre = 4 - Math.abs(3.5 - choice.move.col);
      const safety = choice.move.row === 0 || choice.move.row === 7 ? 3 : 0;
      const score = (captured ? (captured.king ? 140 : 100) : 0) + (promotes ? 65 : 0) + centre + safety + Math.random() * 2;
      if (score > bestScore) {
        bestScore = score;
        best = [choice];
      } else if (score === bestScore) best.push(choice);
    });
    return best[Math.floor(Math.random() * best.length)];
  }

  function scheduleComputerMove() {
    clearTimeout(aiTimer);
    aiTimer = setTimeout(() => {
      if (!gameActive || mode() !== 'computer' || currentPlayer !== 'white') return;
      const choice = chooseComputerMove();
      if (!choice) {
        finish('red');
        return;
      }
      selectedPiece = choice.from;
      legalMoves = [choice.move];
      executeMove(choice.move);
    }, 320);
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
      const piece = board[row][col];
      const state = piece ? `${piece.color}${piece.king ? ' king' : ''}` : target ? (target.capture ? 'capture destination' : 'valid move') : 'empty';
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, ${state}`);
      cell.addEventListener('click', () => handleCell(row, col));
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
    document.getElementById('turn-indicator').textContent = currentPlayer === 'red' ? 'Player 1 (Red)' : mode() === 'computer' ? 'Computer (White)' : 'Player 2 (White)';
    document.getElementById('red-captures').textContent = captures.red;
    document.getElementById('white-captures').textContent = captures.white;
    document.getElementById('red-pieces').textContent = count('red');
    document.getElementById('white-pieces').textContent = count('white');
    const stats = Storage.getStats('checkers');
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('draws').textContent = stats.draws;
    document.getElementById('time-played').textContent = `${Math.floor(stats.timePlayed / 60)}m ${stats.timePlayed % 60}s`;
  }

  function finish(winner) {
    gameActive = false;
    clearTimeout(aiTimer);
    playTimer.stop();
    Storage.recordResult('checkers', winner === null ? 'draw' : winner === 'red' ? 'win' : 'loss');
    render();
    updateUI();
    GameUI.showGameOver({
      title: winner === null ? 'Draw' : winner === 'red' ? 'Player 1 wins!' : `${mode() === 'computer' ? 'Computer' : 'Player 2'} wins!`,
      message: winner === null ? 'No capture or promotion occurred in 40 moves per player.' : 'No legal moves remain for the opponent.',
      onRestart: initialise
    });
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
