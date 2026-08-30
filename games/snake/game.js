const SnakeGame = (() => {
  const canvas = document.getElementById('game-board');
  const ctx = canvas.getContext('2d');
  const TILE = 20;
  const playTimer = Storage.createPlayTimer('snake');
  let width, height, snake, food, timer, active, score, level, speed;

  function initialise() {
    clearInterval(timer);
    playTimer.reset();
    GameUI.clearGameOver();
    const size = Math.max(300, Math.min(600, window.innerWidth - 32, window.innerHeight - 220));
    canvas.width = Math.floor(size / TILE) * TILE;
    canvas.height = canvas.width;
    width = canvas.width / TILE;
    height = canvas.height / TILE;
    const mid = Math.floor(height / 2);
    snake = { color: '#48bb78', body: [{ x: 6, y: mid }, { x: 5, y: mid }, { x: 4, y: mid }], dx: 1, dy: 0, nextDx: 1, nextDy: 0 };
    score = 0; level = 1; speed = 150; active = true;
    spawnFood(); updateUI(); draw(); timer = setInterval(tick, speed);
    playTimer.start();
  }

  function spawnFood() {
    do food = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) };
    while (snake.body.some(cell => cell.x === food.x && cell.y === food.y));
  }

  function tick() {
    if (!active) return;
    const head = { x: snake.body[0].x + snake.nextDx, y: snake.body[0].y + snake.nextDy };
    snake.dx = snake.nextDx; snake.dy = snake.nextDy;
    const eating = head.x === food.x && head.y === food.y;
    const hitsWall = head.x < 0 || head.x >= width || head.y < 0 || head.y >= height;
    const hitsBody = snake.body.some((cell, index) => !(index === snake.body.length - 1 && !eating) && cell.x === head.x && cell.y === head.y);
    if (hitsWall || hitsBody) { endRound(); return; }
    snake.body.unshift(head);
    if (eating) {
      score += 10;
      spawnFood();
      if (score % 50 === 0) {
        level++;
        speed = Math.max(60, speed - 10);
        clearInterval(timer);
        timer = setInterval(tick, speed);
      }
    } else snake.body.pop();
    updateUI(); draw();
  }

  function endRound() {
    active = false;
    clearInterval(timer);
    playTimer.stop();
    Storage.saveHighScore('snake', score);
    Storage.recordResult('snake', 'complete');
    const message = `Game over. Score: ${score}`;
    updateUI(message);
    GameUI.showGameOver({ title: message, onRestart: initialise });
  }

  function draw() {
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f56565';
    ctx.beginPath();
    ctx.arc(food.x * TILE + 10, food.y * TILE + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    snake.body.forEach((cell, index) => {
      ctx.fillStyle = index ? snake.color : '#f8fafc';
      ctx.fillRect(cell.x * TILE + 1, cell.y * TILE + 1, TILE - 3, TILE - 3);
    });
  }

  function updateUI(message) {
    const stats = Storage.getStats('snake');
    document.getElementById('score').textContent = score;
    document.getElementById('high-score-display').textContent = Storage.getHighScore('snake') || 0;
    document.getElementById('level').textContent = level;
    document.getElementById('speed-display').textContent = level > 1 ? 'Faster' : 'Normal';
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('time-played').textContent = `${Math.floor(stats.timePlayed / 60)}m ${stats.timePlayed % 60}s`;
    document.getElementById('snake-status').textContent = message || 'Swipe the board, use the D-pad, or use arrows/WASD to move.';
  }

  function turn(dx, dy) {
    if (!(snake.dx === -dx && snake.dy === -dy)) {
      snake.nextDx = dx;
      snake.nextDy = dy;
    }
  }

  function keydown(event) {
    const key = event.key.toLowerCase();
    const directions = { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] };
    if (!active || !directions[key]) return;
    event.preventDefault();
    turn(...directions[key]);
  }

  function setup() {
    document.getElementById('backToHub').href = '/';
    document.querySelectorAll('.restart-btn').forEach(button => button.onclick = initialise);
    document.querySelectorAll('[data-dir]').forEach(button => button.onclick = () => {
      const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      turn(...directions[button.dataset.dir]);
    });
    let swipeStart;
    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse') {
        swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
        canvas.setPointerCapture(event.pointerId);
      }
    });
    canvas.addEventListener('pointerup', event => {
      if (!swipeStart || swipeStart.id !== event.pointerId) return;
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
      else turn(0, dy > 0 ? 1 : -1);
    });
    document.addEventListener('keydown', keydown);
    initialise();
  }

  function cleanup() {
    active = false;
    clearInterval(timer);
    playTimer.stop();
    document.removeEventListener('keydown', keydown);
  }

  window.addEventListener('pagehide', cleanup);
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      document.addEventListener('keydown', keydown);
      initialise();
    }
  });
  window.initGame = initialise;
  window.restartGame = initialise;
  window.cleanupGame = cleanup;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
