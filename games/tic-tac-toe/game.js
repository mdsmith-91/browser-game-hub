const TicTacToe = (function() {
  let board = [];
  let currentPlayer = 'X';
  let gameActive = false;
  let scores = { X: 0, O: 0, draws: 0 };
  const winningCombos = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6]            // diagonals
  ];

  function initGame() {
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
      const cell = document.createElement('div');
      cell.className = `cell ${board[i] ? 'taken' : ''} ${board[i]?.toLowerCase()}`;
      cell.dataset.index = i;
      
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
    const cells = document.querySelectorAll('.cell');
    cells[index].textContent = currentPlayer;
    cells[index].classList.add('taken', currentPlayer.toLowerCase());

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
    
    if (draw) {
      scores.draws += 1;
      Storage.updateStats('tic-tac-toe');
      showGameOver('Draw!', 'No one wins this round.');
    } else {
      scores[currentPlayer] += 1;
      Storage.saveHighScore('tic-tac-toe', scores.X);
      Storage.updateStats('tic-tac-toe');
      
      showGameOver(
        `Player ${currentPlayer} Wins!`,
        `Congratulations on the victory!`,
        true
      );
    }
    
    updateStatsUI();
  }

  function showGameOver(title, message, isWin = false) {
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2 style="color: ${isWin ? 'var(--accent)' : 'inherit'}">${title}</h2>
        <p>${message}</p>
        <button class="game-btn btn-primary restart-btn">Play Again</button>
      </div>
    `;
    
    modal.querySelector('.restart-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      initGame();
    });
    
    document.body.appendChild(modal);
  }

  function updateTurnIndicator() {
    const el = document.getElementById('turn-indicator');
    el.textContent = currentPlayer;
    el.style.color = currentPlayer === 'X' ? 'var(--primary)' : 'var(--secondary)';
  }

  function updateStatsUI() {
    document.getElementById('x-wins').textContent = scores.X;
    document.getElementById('draws').textContent = scores.draws;
    
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
