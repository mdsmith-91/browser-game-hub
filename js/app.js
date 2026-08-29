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
    const highScore = Storage.getHighScore(game.id);
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
        <span class="high-score">${game.highScoreLabel || 'High Score'}: ${highScore ?? '—'}</span>
        <a class="play-btn" href="${game.url}" aria-label="Play ${game.title}">Play Now</a>
      </div>
    `;
    gamesContainer.appendChild(card);
  });
}
