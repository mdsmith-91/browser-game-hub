const SnakeGame = (() => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');
  const TILE = 20;
  let width, height, snakes, food, mode, timer, active, scores, level, speed;

  function initialise() {
    clearInterval(timer);
    GameUI.clearGameOver();
    mode = document.getElementById('mode-select').value;
    const size = Math.max(300, Math.min(600, window.innerWidth - 32, window.innerHeight - 220));
    canvas.width = Math.floor(size / TILE) * TILE;
    canvas.height = canvas.width;
    width = canvas.width / TILE;
    height = canvas.height / TILE;
    const mid = Math.floor(height / 2);
    snakes = [{ name: 'Player 1', color: '#48bb78', body: [{ x: 6, y: mid }, { x: 5, y: mid }, { x: 4, y: mid }], dx: 1, dy: 0, nextDx: 1, nextDy: 0 }];
    if (mode === 'two') snakes.push({ name: 'Player 2', color: '#60a5fa', body: [{ x: width - 7, y: mid }, { x: width - 6, y: mid }, { x: width - 5, y: mid }], dx: -1, dy: 0, nextDx: -1, nextDy: 0 });
    scores = [0, 0]; level = 1; speed = 150; active = true;
    spawnFood(); updateUI(); draw(); timer = setInterval(tick, speed);
  }
  function spawnFood() { const occupied = snakes.flatMap(snake => snake.body); do food = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) }; while (occupied.some(cell => cell.x === food.x && cell.y === food.y)); }
  function tick() {
    if (!active) return;
    const heads = snakes.map(snake => ({ x: snake.body[0].x + snake.nextDx, y: snake.body[0].y + snake.nextDy }));
    snakes.forEach(snake => { snake.dx = snake.nextDx; snake.dy = snake.nextDy; });
    const eating = heads.map(head => head.x === food.x && head.y === food.y);
    const deaths = snakes.map((snake, index) => {
      const head = heads[index];
      if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) return true;
      if (heads.some((other, otherIndex) => otherIndex !== index && other.x === head.x && other.y === head.y)) return true;
      return snakes.some((other, otherIndex) => other.body.some((cell, cellIndex) => {
        const vacatingTail = !eating[otherIndex] && cellIndex === other.body.length - 1;
        return !vacatingTail && cell.x === head.x && cell.y === head.y;
      }));
    });
    if (deaths.some(Boolean)) { endRound(deaths); return; }
    snakes.forEach((snake, index) => { snake.body.unshift(heads[index]); if (eating[index]) scores[index] += 10; else snake.body.pop(); });
    if (eating.some(Boolean)) { spawnFood(); if (mode === 'single' && scores[0] % 50 === 0) { level++; speed = Math.max(60, speed - 10); clearInterval(timer); timer = setInterval(tick, speed); } }
    updateUI(); draw();
  }
  function endRound(deaths) {
    active = false; clearInterval(timer); let message;
    if (mode === 'two') { const result = deaths[0] === deaths[1] ? 'draw' : deaths[0] ? 'player2' : 'player1'; Storage.updateMultiplayerStats('snake', result); message = result === 'draw' ? 'Draw: both snakes crashed on the same move.' : `${result === 'player1' ? 'Player 1' : 'Player 2'} wins!`; }
    else { Storage.saveHighScore('snake', scores[0]); Storage.updateStats('snake'); message = `Game over. Score: ${scores[0]}`; }
    updateUI(message); showEnd(message);
  }
  function draw() { ctx.fillStyle = '#2d3748'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#f56565'; ctx.beginPath(); ctx.arc(food.x * TILE + 10, food.y * TILE + 10, 8, 0, Math.PI * 2); ctx.fill(); snakes.forEach(snake => snake.body.forEach((cell, index) => { ctx.fillStyle = index ? snake.color : '#f8fafc'; ctx.fillRect(cell.x * TILE + 1, cell.y * TILE + 1, TILE - 3, TILE - 3); })); }
  function updateUI(message) { document.getElementById('score').textContent = scores[0]; document.getElementById('player-two-score').textContent = mode === 'two' ? scores[1] : '-'; document.getElementById('high-score-display').textContent = Storage.getHighScore('snake') || 0; document.getElementById('level').textContent = level; document.getElementById('speed-display').textContent = level > 1 ? 'Faster' : 'Normal'; document.getElementById('snake-status').textContent = message || (mode === 'two' ? 'Two-player Snake is keyboard recommended: Player 1 uses WASD; Player 2 uses arrow keys.' : 'Swipe the board, use the D-pad, or use arrows/WASD to move.'); }
  function showEnd(message) { GameUI.showGameOver({ title: message, onRestart: initialise }); }
  function turn(index, dx, dy) { const snake = snakes[index]; if (snake && !(snake.dx === -dx && snake.dy === -dy)) { snake.nextDx = dx; snake.nextDy = dy; } }
  function keydown(event) { const key = event.key.toLowerCase(); const directions = { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] }; if (!active || !directions[key]) return; event.preventDefault(); turn(mode === 'two' && key.startsWith('arrow') ? 1 : 0, ...directions[key]); }
  function setup() { document.getElementById('backToHub').href = '/'; document.querySelectorAll('.restart-btn').forEach(button => button.onclick = initialise); document.getElementById('mode-select').onchange = initialise; document.querySelectorAll('[data-dir]').forEach(button => button.onclick = () => { const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }; turn(0, ...directions[button.dataset.dir]); }); let swipeStart; canvas.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') { swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId }; canvas.setPointerCapture(event.pointerId); } }); canvas.addEventListener('pointerup', event => { if (!swipeStart || swipeStart.id !== event.pointerId) return; const dx = event.clientX - swipeStart.x; const dy = event.clientY - swipeStart.y; swipeStart = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24 || mode !== 'single') return; if (Math.abs(dx) > Math.abs(dy)) turn(0, dx > 0 ? 1 : -1, 0); else turn(0, 0, dy > 0 ? 1 : -1); }); document.addEventListener('keydown', keydown); initialise(); }
  function cleanup() { active = false; clearInterval(timer); document.removeEventListener('keydown', keydown); }
  window.addEventListener('pagehide', cleanup);
  window.addEventListener('pageshow', event => { if (event.persisted) { document.addEventListener('keydown', keydown); initialise(); } });
  window.initGame = initialise; window.restartGame = initialise; window.cleanupGame = cleanup;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
