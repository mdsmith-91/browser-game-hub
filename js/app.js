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
    const modeBadges = game.gameModes.map(mode => {
      const label = mode === 'Single Player' ? 'Solo' : mode === 'Two Players' ? '2 Players' : 'Versus AI';
      return `<span class="mode-badge${mode === 'Versus Computer' ? ' ai' : ''}">${label}</span>`;
    }).join('');
    card.className = `game-card game-${game.id}`;
    card.innerHTML = `
      <div class="card-icon" aria-hidden="true"><span class="card-art"></span></div>
      <div class="card-content">
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <div class="mode-summary" aria-label="Available modes">${modeBadges}</div>
      </div>
      <div class="card-meta">
        <span class="high-score"><span>${game.record?.label || 'High score'}</span><strong>${highScore ?? '—'}</strong></span>
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
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}
