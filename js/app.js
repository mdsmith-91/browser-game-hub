document.addEventListener('DOMContentLoaded', renderHub);

function renderHub() {
  const gamesContainer = document.querySelector('.game-grid');
  if (!gamesContainer) return;

  document.querySelectorAll('[data-game-count]').forEach(element => {
    element.textContent = GameRegistry.length;
  });

  gamesContainer.innerHTML = '';
  GameRegistry.forEach(game => {
    const card = document.createElement('article');
    const highScore = getRecord(game).value;
    const modeBadges = [
      game.singlePlayer ? '<span class="mode-badge">Solo</span>' : '',
      game.localMultiplayer ? '<span class="mode-badge">2 Players</span>' : '',
      game.aiOpponent ? '<span class="mode-badge ai">Versus AI</span>' : ''
    ].join('');
    card.className = `game-card game-${game.id}`;
    card.innerHTML = `
      <div class="card-icon" aria-hidden="true"><span class="card-art"></span></div>
      <div class="card-content">
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <div class="mode-summary" aria-label="Available modes">${modeBadges}</div>
      </div>
      <div class="card-meta">
        <span class="high-score">${game.record?.label || 'High score'}: ${highScore ?? '—'}</span>
        <a class="play-btn" href="${game.url}" aria-label="Play ${game.title}">Play Now</a>
      </div>
    `;
    gamesContainer.appendChild(card);
  });
}

function getRecord(game) {
  const record = game.record || { type: 'high' };
  let value;
  if (record.type === 'stat') value = Storage.getStats(game.id)[record.field];
  else if (record.type === 'low-time') value = Storage.getBestScore(game.id);
  else value = Storage.getHighScore(game.id);
  return { value: value === null || value === undefined ? null : record.type === 'low-time' ? formatTime(value) : value };
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
