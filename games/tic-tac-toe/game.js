const TicTacToe = (function() {
  let board = [];
  let currentPlayer = 'X';
  let gameActive = false;
  const winningCombos = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6]            // diagonals
  ];

  function initGame() {
    GameUI.clearGameOver();
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    
    renderBoard();
    updateTurnIndicator();
    updateStatsUI();
  }

  function renderBoard() {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `cell ${board[i] ? 'taken' : ''} ${board[i]?.toLowerCase()}`;
      cell.dataset.index = i;
      const row = Math.floor(i / 3) + 1;
      const column = i % 3 + 1;
      cell.setAttribute('aria-label', `Row ${row}, column ${column}, ${board[i] || 'empty'}`);
      cell.disabled = Boolean(board[i]) || !gameActive;
      
      if (board[i]) {
        cell.textContent = board[i];
      }
      
      cell.addEventListener('click', () => handleCellClick(i));
      boardEl.appendChild(cell);
    }
  }

  function handleCellClick(index) {
    if (!gameActive || board[index]) return;

    // Place mark
    board[index] = currentPlayer;
    
    // Update UI
    renderBoard();

    // Check for win/draw
    if (checkWin()) {
      endGame(false);
    } else if (board.every(cell => cell !== null)) {
      endGame(true);
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateTurnIndicator();
    }
  }

  function checkWin() {
    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        highlightWinningCells(combo);
        return true;
      }
    }
    return false;
  }

  function highlightWinningCells(indices) {
    const cells = document.querySelectorAll('.cell');
    indices.forEach(index => {
      cells[index].classList.add('winning');
    });
  }

  function endGame(draw) {
    gameActive = false;
    document.querySelectorAll('#game-board .cell').forEach(cell => { cell.disabled = true; });
    
    if (draw) {
      Storage.updateMultiplayerStats('tic-tac-toe', 'draw');
      showGameOver('Draw!', 'No one wins this round.');
    } else {
      Storage.updateMultiplayerStats('tic-tac-toe', currentPlayer === 'X' ? 'player1' : 'player2');
      
      showGameOver(
        `Player ${currentPlayer} Wins!`,
        'Congratulations on the victory!'
      );
    }
    
    updateStatsUI();
  }

  function showGameOver(title, message) {
    GameUI.showGameOver({ title, message, onRestart: initGame });
  }

  function updateTurnIndicator() {
    const el = document.getElementById('turn-indicator');
    el.textContent = currentPlayer;
    el.style.color = currentPlayer === 'X' ? 'var(--primary)' : 'var(--secondary)';
  }

  function updateStatsUI() {
    const stats = Storage.getStats('tic-tac-toe');
    document.getElementById('x-wins').textContent = stats.player1Wins;
    document.getElementById('o-wins').textContent = stats.player2Wins;
    document.getElementById('draws').textContent = stats.draws;
  }

  function restartGame() {
    initGame();
  }

  function setup() {
    document.getElementById('backToHub').href = '/';
    document.querySelectorAll('.restart-btn').forEach(button => button.addEventListener('click', restartGame));
    initGame();
  }

  window.initGame = initGame;
  window.restartGame = restartGame;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
