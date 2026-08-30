const PongGame = (() => {
  const WIDTH = 900;
  const HEIGHT = 500;
  const WINNING_SCORE = 5;
  const paddle = { width: 16, height: 100, speed: 470 };
  const canvas = document.getElementById('pong-board');
  const context = canvas.getContext('2d');
  const pressed = new Set();
  const playTimer = Storage.createPlayTimer('pong');
  let left;
  let right;
  let ball;
  let scores;
  let animationId = null;
  let lastFrame = 0;
  let active = false;

  function newMatch() {
    cancelAnimationFrame(animationId);
    playTimer.reset();
    GameUI.clearGameOver();
    pressed.clear();
    scores = { left: 0, right: 0 };
    left = { y: (HEIGHT - paddle.height) / 2 };
    right = { y: (HEIGHT - paddle.height) / 2 };
    serve(Math.random() > .5 ? 1 : -1);
    active = true;
    lastFrame = performance.now();
    updateUI();
    playTimer.start();
    animationId = requestAnimationFrame(loop);
  }

  function serve(direction) {
    ball = { x: WIDTH / 2, y: HEIGHT / 2, radius: 10, vx: direction * 360, vy: Math.random() * 180 - 90, speed: 360 };
  }

  function loop(now) {
    if (!active) return;
    const elapsed = Math.min((now - lastFrame) / 1000, .035);
    lastFrame = now;
    update(elapsed);
    draw();
    if (!active) return;
    animationId = requestAnimationFrame(loop);
  }

  function update(elapsed) {
    movePaddle(left, (pressed.has('w') ? -1 : 0) + (pressed.has('s') ? 1 : 0), elapsed);
    if (mode() === 'local') movePaddle(right, (pressed.has('arrowup') ? -1 : 0) + (pressed.has('arrowdown') ? 1 : 0), elapsed);
    else moveComputer(elapsed);
    ball.x += ball.vx * elapsed;
    ball.y += ball.vy * elapsed;
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= HEIGHT) {
      ball.y = Math.max(ball.radius, Math.min(HEIGHT - ball.radius, ball.y));
      ball.vy *= -1;
    }
    const leftX = 34;
    const rightX = WIDTH - 34 - paddle.width;
    if (ball.vx < 0 && hitsPaddle(leftX, left.y) && ball.x - ball.radius <= leftX + paddle.width) bounce(leftX + paddle.width, left.y, 1);
    if (ball.vx > 0 && hitsPaddle(rightX, right.y) && ball.x + ball.radius >= rightX) bounce(rightX, right.y, -1);
    if (ball.x < -ball.radius) scorePoint('right');
    if (ball.x > WIDTH + ball.radius) scorePoint('left');
  }

  function movePaddle(target, direction, elapsed) {
    target.y = Math.max(0, Math.min(HEIGHT - paddle.height, target.y + direction * paddle.speed * elapsed));
  }

  function hitsPaddle(x, y) {
    return ball.y + ball.radius >= y && ball.y - ball.radius <= y + paddle.height && ball.x + ball.radius >= x && ball.x - ball.radius <= x + paddle.width;
  }

  function bounce(x, y, direction) {
    ball.x = x + direction * ball.radius;
    const relative = (ball.y - (y + paddle.height / 2)) / (paddle.height / 2);
    ball.speed = Math.min(680, ball.speed + 24);
    ball.vx = direction * ball.speed * Math.max(.72, 1 - Math.abs(relative) * .22);
    ball.vy = relative * ball.speed * .8;
  }

  function moveComputer(elapsed) {
    const settings = { easy: [190, 42], normal: [300, 25], hard: [405, 12] }[document.getElementById('difficulty-select').value];
    const target = ball.vx > 0 ? ball.y + Math.random() * settings[1] * 2 - settings[1] : HEIGHT / 2;
    movePaddle(right, Math.sign(target - (right.y + paddle.height / 2)), elapsed * settings[0] / paddle.speed);
  }

  function scorePoint(side) {
    scores[side]++;
    if (scores[side] >= WINNING_SCORE) finish(side);
    else {
      serve(side === 'left' ? -1 : 1);
      updateUI(`${side === 'left' ? 'Player 1' : mode() === 'single' ? 'Computer' : 'Player 2'} scores!`);
    }
  }

  function finish(winner) {
    active = false;
    cancelAnimationFrame(animationId);
    playTimer.stop();
    const playerWon = winner === 'left';
    Storage.recordResult('pong', playerWon ? 'win' : 'loss');
    const winnerName = playerWon ? 'Player 1' : mode() === 'single' ? 'Computer' : 'Player 2';
    updateUI(`${winnerName} wins the match!`);
    GameUI.showGameOver({ title: `${winnerName} wins!`, message: `Final score ${scores.left}–${scores.right}.`, onRestart: newMatch });
  }

  function draw() {
    context.fillStyle = '#172033';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.strokeStyle = 'rgba(226,232,240,.28)';
    context.lineWidth = 5;
    context.setLineDash([12, 15]);
    context.beginPath();
    context.moveTo(WIDTH / 2, 0);
    context.lineTo(WIDTH / 2, HEIGHT);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = '#818cf8';
    context.fillRect(34, left.y, paddle.width, paddle.height);
    context.fillStyle = '#ec4899';
    context.fillRect(WIDTH - 34 - paddle.width, right.y, paddle.width, paddle.height);
    context.fillStyle = '#f8fafc';
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
  }

  function mode() { return document.getElementById('mode-select').value; }

  function updateUI(message) {
    const stats = Storage.getStats('pong');
    document.getElementById('player-one-score').textContent = scores.left;
    document.getElementById('player-two-score').textContent = scores.right;
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('time-played').textContent = `${Math.floor(stats.timePlayed / 60)}m ${stats.timePlayed % 60}s`;
    document.getElementById('pong-status').textContent = message || `First to ${WINNING_SCORE} wins. ${mode() === 'single' ? 'You are Player 1.' : 'Local two-player match.'}`;
    document.getElementById('difficulty-control').hidden = mode() === 'local';
    document.getElementById('player-two-touch').hidden = mode() === 'single';
  }

  function keydown(event) {
    const key = event.key.toLowerCase();
    if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
      event.preventDefault();
      pressed.add(key);
    }
  }

  function keyup(event) { pressed.delete(event.key.toLowerCase()); }

  function setTouch(button, enabled) {
    const key = button.dataset.player === 'one' ? (button.dataset.direction === 'up' ? 'w' : 's') : (button.dataset.direction === 'up' ? 'arrowup' : 'arrowdown');
    if (enabled) pressed.add(key); else pressed.delete(key);
  }

  function moveTouchPaddle(event) {
    if (!active || event.pointerType === 'mouse' && event.buttons === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * WIDTH;
    const y = (event.clientY - rect.top) / rect.height * HEIGHT;
    const target = mode() === 'local' && x > WIDTH / 2 ? right : left;
    target.y = Math.max(0, Math.min(HEIGHT - paddle.height, y - paddle.height / 2));
  }

  function setup() {
    document.getElementById('backToHub').href = '/';
    document.querySelectorAll('.restart-btn').forEach(button => button.addEventListener('click', newMatch));
    document.getElementById('mode-select').addEventListener('change', newMatch);
    document.getElementById('difficulty-select').addEventListener('change', newMatch);
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
    canvas.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') canvas.setPointerCapture(event.pointerId); moveTouchPaddle(event); });
    canvas.addEventListener('pointermove', moveTouchPaddle);
    document.querySelectorAll('.pong-touch-controls button').forEach(button => {
      button.addEventListener('pointerdown', event => { event.preventDefault(); setTouch(button, true); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(name => button.addEventListener(name, () => setTouch(button, false)));
    });
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('pageshow', event => { if (event.persisted) { document.addEventListener('keydown', keydown); document.addEventListener('keyup', keyup); newMatch(); } });
    newMatch();
  }

  function cleanup() {
    active = false;
    cancelAnimationFrame(animationId);
    playTimer.stop();
    pressed.clear();
    document.removeEventListener('keydown', keydown);
    document.removeEventListener('keyup', keyup);
  }

  window.initGame = newMatch;
  window.restartGame = newMatch;
  window.cleanupGame = cleanup;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
})();
