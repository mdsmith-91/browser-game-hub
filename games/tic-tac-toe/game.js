const TicTacToe = (() => {
  const winningCombos = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const playTimer = Storage.createPlayTimer('tic-tac-toe');
  let board = [];
  let currentPlayer = 'X';
  let gameActive = false;
  let aiTimer = null;

  function mode() {
    return document.getElementById('mode-select').value;
  }

  function initGame() {
    clearTimeout(aiTimer);
    playTimer.reset();
    GameUI.clearGameOver();
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    renderBoard();
    updateUI();
  }

  function winner(state) {
    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (state[a] && state[a] === state[b] && state[a] === state[c]) return { player: state[a], combo };
    }
    return state.every(Boolean) ? { player: null, combo: null } : null;
  }

  function minimax(state, maximizing) {
    const result = winner(state);
    if (result) return result.player === 'O' ? 10 : result.player === 'X' ? -10 : 0;
    const scores = [];
    state.forEach((cell, index) => {
      if (cell) return;
      state[index] = maximizing ? 'O' : 'X';
      scores.push(minimax(state, !maximizing));
      state[index] = null;
    });
    return maximizing ? Math.max(...scores) : Math.min(...scores);
  }

  function chooseAiMove() {
    let bestScore = -Infinity;
    let bestMoves = [];
    board.forEach((cell, index) => {
      if (cell) return;
      board[index] = 'O';
      const score = minimax(board, false);
      board[index] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [index];
      } else if (score === bestScore) bestMoves.push(index);
    });
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function play(index) {
    if (!gameActive || board[index] || (mode() === 'computer' && currentPlayer === 'O')) return;
    playTimer.start();
    makeMove(index);
  }

  function makeMove(index) {
    board[index] = currentPlayer;
    const result = winner(board);
    renderBoard(result?.combo);
    if (result) {
      finish(result.player);
      return;
    }
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateUI();
    renderBoard();
    if (mode() === 'computer' && currentPlayer === 'O') {
      aiTimer = setTimeout(() => {
        if (gameActive && currentPlayer === 'O') makeMove(chooseAiMove());
      }, 240);
    }
  }

  function finish(winningPlayer) {
    gameActive = false;
    clearTimeout(aiTimer);
    playTimer.stop();
    const result = !winningPlayer ? 'draw' : winningPlayer === 'X' ? 'win' : 'loss';
    Storage.recordResult('tic-tac-toe', result);
    updateUI();
    const opponent = mode() === 'computer' ? 'Computer' : 'Player 2';
    GameUI.showGameOver({
      title: !winningPlayer ? 'Draw' : winningPlayer === 'X' ? 'Player 1 wins!' : `${opponent} wins!`,
      message: !winningPlayer ? 'Every square is filled.' : 'Three in a row.',
      onRestart: initGame
    });
  }

  function renderBoard(winning = null) {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';
    for (let index = 0; index < 9; index++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `cell ${board[index] ? 'taken' : ''} ${board[index]?.toLowerCase() || ''}${winning?.includes(index) ? ' winning' : ''}`;
      cell.setAttribute('aria-label', `Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}, ${board[index] || 'empty'}`);
      cell.disabled = Boolean(board[index]) || !gameActive || (mode() === 'computer' && currentPlayer === 'O');
      cell.textContent = board[index] || '';
      cell.addEventListener('click', () => play(index));
      boardEl.appendChild(cell);
    }
  }

  function updateUI() {
    const stats = Storage.getStats('tic-tac-toe');
    const opponent = mode() === 'computer' ? 'Computer' : 'Player 2';
    document.getElementById('turn-indicator').textContent = currentPlayer === 'X' ? 'Player 1 (X)' : `${opponent} (O)`;
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('draws').textContent = stats.draws;
    document.getElementById('time-played').textContent = formatDuration(stats.timePlayed);
  }

  function formatDuration(seconds) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  function setup() {
    document.querySelectorAll('.restart-btn').forEach(button => button.addEventListener('click', initGame));
    document.getElementById('mode-select').addEventListener('change', initGame);
    window.addEventListener('pagehide', () => { clearTimeout(aiTimer); playTimer.stop(); });
    window.addEventListener('pageshow', event => { if (event.persisted) initGame(); });
    initGame();
  }

  window.initGame = initGame;
  window.restartGame = initGame;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
