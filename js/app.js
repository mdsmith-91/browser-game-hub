document.addEventListener('DOMContentLoaded', renderHub);

function renderHub() {
  const gamesContainer = document.querySelector('.game-grid');
  if (!gamesContainer) return;

  gamesContainer.innerHTML = '';
  GameRegistry.forEach(game => {
    const card = document.createElement('article');
    const record = game.record ? getRecord(game) : null;
    const tags = game.tags || game.gameModes.map(mode => mode === 'Single Player' ? '1 Player' : mode === 'Two Players' ? '2 Players' : 'AI');
    const modeBadges = tags.map(label => {
      return `<span class="mode-badge${label === 'AI' ? ' ai' : ''}">${label}</span>`;
    }).join('');
    card.className = `game-card game-${game.id}`;
    card.innerHTML = `
      <div class="card-content">
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <div class="mode-summary" aria-label="Available modes">${modeBadges}</div>
      </div>
      <div class="card-meta${record ? '' : ' recordless'}">
        ${record ? `<span class="high-score"><span>${game.record.label}</span><strong>${record.value ?? '—'}</strong></span>` : ''}
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
