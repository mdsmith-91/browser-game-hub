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
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-icon" aria-hidden="true">${game.icon}</div>
      <div class="card-content">
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <p class="mode-summary">${game.playerCount} player${game.playerCount === '1' ? '' : 's'} &middot; Local multiplayer${game.aiOpponent ? ' &middot; AI opponent' : ''}</p>
      </div>
      <div class="card-meta">
        <span class="high-score">${game.highScoreLabel || 'High Score'}: ${highScore ?? '—'}</span>
        <a class="play-btn" href="${game.url}" aria-label="Play ${game.title}">Play Now</a>
      </div>
    `;
    gamesContainer.appendChild(card);
  });
}
