const ConnectFour = (() => {
  const ROWS = 6;
  const COLS = 7;
  const columnOrder = [3, 2, 4, 1, 5, 0, 6];
  const playTimer = Storage.createPlayTimer('connect-four');
  let board;
  let currentPlayer;
  let gameActive;
  let selectedCol = 3;
  let aiTimer = null;

  function mode() {
    return document.getElementById('mode-select').value;
  }

  function initialise() {
    clearTimeout(aiTimer);
    playTimer.reset();
    GameUI.clearGameOver();
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    currentPlayer = 'red';
    gameActive = true;
    selectedCol = 3;
    render();
    updateUI();
  }

  function availableRow(state, col) {
    for (let row = ROWS - 1; row >= 0; row--) if (!state[row][col]) return row;
    return -1;
  }

  function winningCells(state, col, row, player) {
    for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const cells = [{ col, row }];
      for (const sign of [-1, 1]) {
        for (let step = 1; step < 4; step++) {
          const nextCol = col + dc * step * sign;
          const nextRow = row + dr * step * sign;
          if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS || state[nextRow][nextCol] !== player) break;
          cells.push({ col: nextCol, row: nextRow });
        }
      }
      if (cells.length >= 4) return cells;
    }
    return null;
  }

  function scoreWindow(cells) {
    const yellow = cells.filter(cell => cell === 'yellow').length;
    const red = cells.filter(cell => cell === 'red').length;
    const empty = 4 - yellow - red;
    if (yellow === 4) return 100000;
    if (red === 4) return -100000;
    if (yellow === 3 && empty === 1) return 90;
    if (yellow === 2 && empty === 2) return 12;
    if (red === 3 && empty === 1) return -110;
    if (red === 2 && empty === 2) return -10;
    return 0;
  }

  function evaluate(state) {
    let score = state.reduce((total, row) => total + (row[3] === 'yellow' ? 5 : row[3] === 'red' ? -5 : 0), 0);
    const windows = [];
    for (let row = 0; row < ROWS; row++) for (let col = 0; col <= COLS - 4; col++) windows.push(state[row].slice(col, col + 4));
    for (let col = 0; col < COLS; col++) for (let row = 0; row <= ROWS - 4; row++) windows.push([0, 1, 2, 3].map(step => state[row + step][col]));
    for (let row = 0; row <= ROWS - 4; row++) for (let col = 0; col <= COLS - 4; col++) {
      windows.push([0, 1, 2, 3].map(step => state[row + step][col + step]));
      windows.push([0, 1, 2, 3].map(step => state[row + 3 - step][col + step]));
    }
    return score + windows.reduce((total, cells) => total + scoreWindow(cells), 0);
  }

  function minimax(state, depth, maximizing, alpha, beta, lastMove) {
    if (lastMove && winningCells(state, lastMove.col, lastMove.row, lastMove.player)) return lastMove.player === 'yellow' ? 1000000 + depth : -1000000 - depth;
    const legal = columnOrder.filter(col => availableRow(state, col) >= 0);
    if (!depth || !legal.length) return evaluate(state);
    if (maximizing) {
      let value = -Infinity;
      for (const col of legal) {
        const row = availableRow(state, col);
        state[row][col] = 'yellow';
        value = Math.max(value, minimax(state, depth - 1, false, alpha, beta, { col, row, player: 'yellow' }));
        state[row][col] = null;
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
      return value;
    }
    let value = Infinity;
    for (const col of legal) {
      const row = availableRow(state, col);
      state[row][col] = 'red';
      value = Math.min(value, minimax(state, depth - 1, true, alpha, beta, { col, row, player: 'red' }));
      state[row][col] = null;
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  function chooseAiColumn() {
    let best = -Infinity;
    let choices = [];
    for (const col of columnOrder.filter(item => availableRow(board, item) >= 0)) {
      const row = availableRow(board, col);
      board[row][col] = 'yellow';
      const score = minimax(board, 5, false, -Infinity, Infinity, { col, row, player: 'yellow' });
      board[row][col] = null;
      if (score > best) {
        best = score;
        choices = [col];
      } else if (score === best) choices.push(col);
    }
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function playColumn(col, computerMove = false) {
    if (!gameActive || (mode() === 'computer' && currentPlayer === 'yellow' && !computerMove)) return;
    const row = availableRow(board, col);
    if (row < 0) return;
    playTimer.start();
    board[row][col] = currentPlayer;
    const winning = winningCells(board, col, row, currentPlayer);
    render(winning);
    if (winning) finish(currentPlayer);
    else if (board.every(rowCells => rowCells.every(Boolean))) finish(null);
    else {
      currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
      updateUI();
      render();
      if (mode() === 'computer' && currentPlayer === 'yellow') {
        aiTimer = setTimeout(() => playColumn(chooseAiColumn(), true), 260);
      }
    }
  }

  function finish(winner) {
    gameActive = false;
    clearTimeout(aiTimer);
    playTimer.stop();
    Storage.recordResult('connect-four', winner === null ? 'draw' : winner === 'red' ? 'win' : 'loss');
    updateUI();
    const opponent = mode() === 'computer' ? 'Computer' : 'Player 2';
    GameUI.showGameOver({
      title: winner === null ? 'Draw' : winner === 'red' ? 'Player 1 wins!' : `${opponent} wins!`,
      message: winner === null ? 'The board is full.' : 'Four in a row.',
      onRestart: initialise
    });
  }

  function render(winning = null) {
    const element = document.getElementById('game-board');
    element.className = 'connect4-board';
    element.innerHTML = '';
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('button');
      const occupied = board[row][col];
      cell.type = 'button';
      cell.tabIndex = row === 0 ? 0 : -1;
      cell.disabled = !gameActive || availableRow(board, col) < 0 || (mode() === 'computer' && currentPlayer === 'yellow');
      cell.className = `cell${occupied ? '' : ' empty'}${winning?.some(item => item.row === row && item.col === col) ? ' winning-pieces' : ''}`;
      cell.setAttribute('aria-label', `${occupied ? `${occupied} disk` : `Drop a disk in column ${col + 1}`}`);
      cell.addEventListener('click', () => playColumn(col));
      if (occupied) {
        const piece = document.createElement('span');
        piece.className = `piece ${occupied}`;
        cell.appendChild(piece);
      }
      element.appendChild(cell);
    }
    updateSelection();
  }

  function updateSelection() {
    document.querySelectorAll('#game-board .cell').forEach((cell, index) => {
      if (index % COLS === selectedCol && !board[Math.floor(index / COLS)][selectedCol]) cell.classList.add('highlight-column');
    });
  }

  function updateUI() {
    const stats = Storage.getStats('connect-four');
    document.getElementById('turn-indicator').textContent = currentPlayer === 'red' ? 'Player 1 (Red)' : mode() === 'computer' ? 'Computer (Yellow)' : 'Player 2 (Yellow)';
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('draws').textContent = stats.draws;
    document.getElementById('time-played').textContent = `${Math.floor(stats.timePlayed / 60)}m ${stats.timePlayed % 60}s`;
  }

  function keydown(event) {
    if (!gameActive || (mode() === 'computer' && currentPlayer === 'yellow')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectedCol = Math.max(0, selectedCol - 1); render(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectedCol = Math.min(COLS - 1, selectedCol + 1); render(); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); playColumn(selectedCol); }
  }

  function setup() {
    document.querySelectorAll('.restart-btn').forEach(button => button.addEventListener('click', initialise));
    document.getElementById('mode-select').addEventListener('change', initialise);
    document.addEventListener('keydown', keydown);
    window.addEventListener('pagehide', () => { clearTimeout(aiTimer); playTimer.stop(); });
    window.addEventListener('pageshow', event => { if (event.persisted) initialise(); });
    initialise();
  }

  window.initGame = initialise;
  window.restartGame = initialise;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
