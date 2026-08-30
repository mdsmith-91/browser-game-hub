const Minesweeper = (() => {
  const difficulties = { beginner: [9, 9, 10], intermediate: [16, 16, 40], expert: [16, 30, 99] };
  const playTimer = Storage.createPlayTimer('minesweeper');
  let rows, cols, mines, board, flags, firstClick, active, seconds, timerId, difficulty, flagMode;

  function initialise(nextDifficulty) {
    clearInterval(timerId);
    playTimer.reset();
    GameUI.clearGameOver();
    difficulty = nextDifficulty || document.getElementById('difficulty-select').value;
    [rows, cols, mines] = difficulties[difficulty];
    board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, count: 0 })));
    flags = 0;
    firstClick = true;
    active = true;
    seconds = 0;
    flagMode = false;
    document.getElementById('difficulty-select').value = difficulty;
    render();
    updateUI();
  }

  const inside = (row, col) => row >= 0 && row < rows && col >= 0 && col < cols;

  function neighbours(row, col) {
    const result = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if ((dr || dc) && inside(row + dr, col + dc)) result.push([row + dr, col + dc]);
    }
    return result;
  }

  function plantMines(row, col) {
    const excluded = new Set(neighbours(row, col).concat([[row, col]]).map(cell => cell.join(',')));
    const choices = [];
    board.forEach((line, r) => line.forEach((cell, c) => { if (!excluded.has(`${r},${c}`)) choices.push([r, c]); }));
    for (let index = choices.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [choices[index], choices[swap]] = [choices[swap], choices[index]];
    }
    choices.slice(0, mines).forEach(([r, c]) => { board[r][c].mine = true; });
    board.forEach((line, r) => line.forEach((cell, c) => {
      cell.count = cell.mine ? 0 : neighbours(r, c).filter(([nr, nc]) => board[nr][nc].mine).length;
    }));
  }

  function reveal(row, col) {
    const first = board[row][col];
    if (!active || first.flagged || first.revealed) return;
    if (firstClick) {
      plantMines(row, col);
      firstClick = false;
      playTimer.start();
      timerId = setInterval(() => { seconds++; updateUI(); }, 1000);
    }
    if (first.mine) {
      finish(false);
      return;
    }
    const queue = [[row, col]];
    while (queue.length) {
      const [r, c] = queue.pop();
      const cell = board[r][c];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      if (!cell.count) neighbours(r, c).forEach(next => queue.push(next));
    }
    if (board.flat().filter(cell => cell.revealed && !cell.mine).length === rows * cols - mines) finish(true);
    else {
      render();
      updateUI();
    }
  }

  function toggleFlag(row, col) {
    const cell = board[row][col];
    if (!active || cell.revealed || (!cell.flagged && flags === mines)) return;
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    render();
    updateUI();
  }

  function render() {
    const element = document.getElementById('game-board');
    element.className = 'minesweeper-board';
    element.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    element.innerHTML = '';
    board.forEach((line, row) => line.forEach((cell, col) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `cell ${cell.revealed ? 'revealed' : 'hidden'}${cell.flagged ? ' flagged' : ''}${cell.revealed && cell.mine ? ' mine' : ''}${cell.revealed && cell.count ? ` revealed-number-${cell.count}` : ''}`;
      button.textContent = cell.revealed ? (cell.mine ? '*' : cell.count || '') : '';
      const state = cell.revealed ? (cell.mine ? 'mine' : `${cell.count || 0} neighbouring mines`) : cell.flagged ? 'flagged' : 'covered';
      button.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, ${state}`);
      button.onclick = () => flagMode ? toggleFlag(row, col) : reveal(row, col);
      button.oncontextmenu = event => { event.preventDefault(); toggleFlag(row, col); };
      element.appendChild(button);
    }));
  }

  function format(value) {
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  }

  function updateUI(message) {
    const stats = Storage.getStats('minesweeper');
    const best = Storage.getBestScore('minesweeper');
    document.getElementById('timer').textContent = format(seconds);
    document.getElementById('mine-count').textContent = mines;
    document.getElementById('flags-left').textContent = mines - flags;
    document.getElementById('best-time').textContent = best === null ? '--:--' : format(best);
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('time-played').textContent = `${Math.floor(stats.timePlayed / 60)}m ${stats.timePlayed % 60}s`;
    const flagButton = document.getElementById('flag-mode');
    flagButton.classList.toggle('active', flagMode);
    flagButton.setAttribute('aria-pressed', String(flagMode));
    flagButton.textContent = `Flag mode: ${flagMode ? 'On' : 'Off'}`;
    document.getElementById('mine-status').textContent = message || (flagMode ? 'Flag mode is on. Tap a covered cell to add or remove a flag.' : 'Reveal mode. Tap a covered cell to reveal it; use Flag mode to mark mines.');
  }

  function finish(won) {
    active = false;
    clearInterval(timerId);
    playTimer.stop();
    if (won) Storage.saveBestScore('minesweeper', seconds);
    Storage.recordResult('minesweeper', won ? 'win' : 'complete');
    if (!won) board.flat().filter(cell => cell.mine).forEach(cell => { cell.revealed = true; });
    render();
    updateUI();
    GameUI.showGameOver({
      title: won ? 'Field cleared!' : 'Mine detonated',
      message: `Time: ${format(seconds)}`,
      onRestart: () => initialise(difficulty)
    });
  }

  function setup() {
    document.getElementById('flag-mode').onclick = () => { flagMode = !flagMode; updateUI(); };
    document.querySelectorAll('.restart-btn').forEach(button => button.onclick = () => initialise(difficulty));
    document.getElementById('difficulty-select').onchange = event => initialise(event.target.value);
    window.addEventListener('pagehide', () => { clearInterval(timerId); playTimer.stop(); });
    initialise();
  }

  window.initGame = initialise;
  window.restartGame = () => initialise(difficulty);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
