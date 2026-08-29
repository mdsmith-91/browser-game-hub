const ConnectFour = (() => {
  const ROWS = 6;
  const COLS = 7;
  let board;
  let currentPlayer;
  let gameActive;
  let selectedCol = 0;
  let scores = { red: 0, yellow: 0, draws: 0 };

  function initialise() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    currentPlayer = 'red';
    gameActive = true;
    selectedCol = 0;
    render();
    updateUI();
  }

  function playColumn(col) {
    if (!gameActive) return;
    const row = [...Array(ROWS).keys()].reverse().find(index => !board[index][col]);
    if (row === undefined) return;
    board[row][col] = currentPlayer;
    const winning = winningCells(col, row);
    render(winning);
    if (winning) finish(false);
    else if (board.every(rowCells => rowCells.every(Boolean))) finish(true);
    else {
      currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
      updateUI();
      updateSelection();
    }
  }

  function winningCells(col, row) {
    for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const cells = [{ col, row }];
      for (const sign of [-1, 1]) for (let step = 1; step < 4; step++) {
        const nextCol = col + dc * step * sign;
        const nextRow = row + dr * step * sign;
        if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS || board[nextRow][nextCol] !== currentPlayer) break;
        cells.push({ col: nextCol, row: nextRow });
      }
      if (cells.length >= 4) return cells;
    }
    return null;
  }

  function render(winning = null) {
    const element = document.getElementById('game-board');
    element.className = 'connect4-board';
    element.innerHTML = '';
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('button');
      const occupied = board[row][col];
      cell.type = 'button';
      cell.className = `cell${occupied ? '' : ' empty'}${winning?.some(item => item.row === row && item.col === col) ? ' winning-pieces' : ''}`;
      cell.setAttribute('aria-label', `Drop a piece in column ${col + 1}`);
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
    document.querySelectorAll('.cell').forEach((cell, index) => {
      if (index % COLS === selectedCol && !board[Math.floor(index / COLS)][selectedCol]) cell.classList.add('highlight-column');
    });
  }

  function finish(draw) {
    gameActive = false;
    if (draw) scores.draws++;
    else scores[currentPlayer]++;
    Storage.updateMultiplayerStats('connect-four', draw ? 'draw' : currentPlayer === 'red' ? 'player1' : 'player2');
    updateUI();
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.innerHTML = `<div class="modal-content"><h2>${draw ? 'Draw!' : `${currentPlayer === 'red' ? 'Red' : 'Yellow'} wins!`}</h2><p>${draw ? 'The board is full.' : 'Four in a row!'}</p><button class="game-btn btn-primary">Play Again</button></div>`;
    modal.querySelector('button').addEventListener('click', () => { modal.remove(); initialise(); });
    document.body.appendChild(modal);
  }

  function updateUI() {
    const stats = Storage.getStats('connect-four');
    document.getElementById('turn-indicator').textContent = currentPlayer === 'red' ? 'Red' : 'Yellow';
    document.getElementById('red-wins').textContent = stats.player1Wins;
    document.getElementById('draws').textContent = stats.draws;
  }

  function keydown(event) {
    if (!gameActive) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectedCol = Math.max(0, selectedCol - 1); render(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectedCol = Math.min(COLS - 1, selectedCol + 1); render(); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); playColumn(selectedCol); }
  }

  function setup() {
    document.getElementById('backToHub').href = '/';
    document.querySelectorAll('.restart-btn').forEach(button => button.addEventListener('click', initialise));
    document.addEventListener('keydown', keydown);
    initialise();
  }

  window.initGame = initialise;
  window.restartGame = initialise;
  window.cleanupGame = () => document.removeEventListener('keydown', keydown);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
