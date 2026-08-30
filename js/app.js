document.addEventListener('DOMContentLoaded', renderHub);

function renderHub() {
  const categoriesContainer = document.querySelector('.game-categories');
  const categoryNav = document.querySelector('.category-nav');
  if (!categoriesContainer) return;

  categoriesContainer.innerHTML = '';
  if (categoryNav) categoryNav.innerHTML = '';

  GameCategories.forEach(category => {
    const games = GameRegistry.filter(game => game.category === category.id);
    if (!games.length) return;

    const section = document.createElement('section');
    section.className = 'game-category';
    section.id = category.id;
    section.setAttribute('aria-labelledby', `${category.id}-title`);
    section.innerHTML = `
      <div class="category-heading">
        <h3 id="${category.id}-title">${category.title}</h3>
        <p>${category.description}</p>
      </div>
      <div class="game-grid" aria-label="${category.title}"></div>
    `;

    const grid = section.querySelector('.game-grid');
    games.forEach(game => grid.appendChild(createGameCard(game)));
    categoriesContainer.appendChild(section);

    if (categoryNav) {
      const link = document.createElement('a');
      link.href = `#${category.id}`;
      link.textContent = category.title;
      categoryNav.appendChild(link);
    }
  });
}

function createGameCard(game) {
  const card = document.createElement('article');
  const record = game.record ? getRecord(game) : null;
  const modeBadges = getModeTags(game.gameModes).map(label => {
    return `<span class="mode-badge${label === 'AI' ? ' ai' : ''}">${label}</span>`;
  }).join('');
  card.className = `game-card game-${game.id}`;
  card.innerHTML = `
    <div class="card-content">
      <h4>${game.title}</h4>
      <p>${game.description}</p>
      <div class="mode-summary" aria-label="Available modes">${modeBadges}</div>
    </div>
    <div class="card-meta${record ? '' : ' recordless'}">
      ${record ? `<span class="high-score"><span>${game.record.label}</span><strong>${record.value ?? '—'}</strong></span>` : ''}
      <a class="play-btn" href="${game.url}" aria-label="Play ${game.title}">Play Now</a>
    </div>
  `;
  return card;
}

function getModeTags(gameModes) {
  const tags = [];
  if (gameModes.includes('Single Player') || gameModes.includes('Versus Computer')) tags.push('1 PLAYER');
  if (gameModes.includes('Versus Computer')) tags.push('AI');
  if (gameModes.includes('Two Players')) tags.push('LOCAL 2P');
  return tags;
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
