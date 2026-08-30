const GoFish = (() => {
  const gameId = 'go-fish';
  const timer = Storage.createPlayTimer(gameId);
  let state;
  let aiTimer = null;
  let started = false;
  let recorded = false;

  function formatTime(seconds) { return `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
  function start() { if (!started) { started = true; timer.start(); } }
  function rankLabel(rank) { return rank.length > 2 ? rank[0].toUpperCase() + rank.slice(1) : rank; }
  function updateStats() {
    const stats = Storage.getStats(gameId);
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('draws').textContent = stats.draws;
    document.getElementById('books-won').textContent = stats.booksWon;
    document.getElementById('best-books').textContent = stats.bestBooks;
    document.getElementById('win-rate').textContent = `${stats.gamesPlayed ? Math.round(stats.wins / stats.gamesPlayed * 100) : 0}%`;
    document.getElementById('time-played').textContent = formatTime(stats.timePlayed);
  }
  function renderHands() {
    const human = document.getElementById('human-hand');
    const computer = document.getElementById('computer-hand');
    human.innerHTML = ''; computer.innerHTML = '';
    state.hands.human.forEach(card => human.appendChild(PlayingCards.createCardElement(card, { faceUp: true, disabled: true })));
    state.hands.computer.forEach(card => computer.appendChild(PlayingCards.createCardElement(card, { faceUp: false, disabled: true })));
  }
  function renderActions() {
    const actions = document.getElementById('rank-actions');
    actions.innerHTML = '';
    GoFishRules.legalActions(state).forEach(action => {
      if (state.turn !== 'human') return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'btn-secondary game-btn rank-button'; button.textContent = rankLabel(action.rank);
      button.setAttribute('aria-label', `Ask for ${rankLabel(action.rank)}s`); button.onclick = () => perform(action); actions.appendChild(button);
    });
  }
  function actionMessage() {
    const action = state.lastAction;
    if (!action) return 'Your turn. Choose a rank to ask for.';
    const who = action.asker === 'human' ? 'You' : 'Computer';
    if (action.received) return `${who} received ${action.received} ${rankLabel(action.rank)}${action.received > 1 ? 's' : ''} and goes again.`;
    if (action.drewMatch) return `${who}: “Go Fish!” Drew the requested rank and goes again.`;
    return `${who}: “Go Fish!” Turn passes.`;
  }
  function render() {
    renderHands(); renderActions(); updateStats();
    document.getElementById('human-count').textContent = `${state.hands.human.length} cards`;
    document.getElementById('computer-count').textContent = `${state.hands.computer.length} cards`;
    document.getElementById('human-books').textContent = `Books: ${state.books.human.map(rankLabel).join(', ') || 'none'}`;
    document.getElementById('computer-books').textContent = `Books: ${state.books.computer.map(rankLabel).join(', ') || 'none'}`;
    document.getElementById('book-score').textContent = `${state.books.human.length} – ${state.books.computer.length}`;
    document.getElementById('turn-indicator').textContent = state.turn === 'human' ? 'Player' : 'Computer';
    document.getElementById('game-status').textContent = state.phase === 'complete' ? 'All fishing is finished.' : actionMessage();
    const pond = document.getElementById('fish-pond'); pond.innerHTML = '';
    if (state.deck.length) {
      const card = PlayingCards.createCardElement(state.deck[0], { faceUp: false, disabled: true });
      card.setAttribute('aria-label', `Fish pond, ${state.deck.length} cards remaining`); pond.appendChild(card);
    } else pond.textContent = 'Pond empty';
  }
  function finish() {
    if (recorded || state.phase !== 'complete') return;
    recorded = true; clearTimeout(aiTimer); timer.stop();
    const result = state.winner === 'draw' ? 'draw' : state.winner === 'human' ? 'win' : 'loss';
    Storage.recordGameResult(gameId, result, { booksWon: state.books.human.length, books: state.books.human.length });
    updateStats(); render();
    const title = result === 'draw' ? 'It’s a draw!' : result === 'win' ? 'You caught the most books!' : 'Computer wins';
    GameUI.showGameOver({ title, message: `You ${state.books.human.length} · Computer ${state.books.computer.length}`, restartLabel: 'Rematch', onRestart: newGame });
  }
  function scheduleAI() {
    if (state.phase !== 'playing' || state.turn !== 'computer') return;
    aiTimer = setTimeout(() => {
      const action = GoFishAI.chooseAction(state);
      if (action) GoFishRules.applyAction(state, action);
      render(); finish(); scheduleAI();
    }, 650);
  }
  function perform(action) {
    if (state.turn !== 'human' || state.phase !== 'playing') return;
    start();
    if (!GoFishRules.applyAction(state, action)) return;
    render(); finish(); scheduleAI();
  }
  function newGame() {
    clearTimeout(aiTimer); timer.reset(); GameUI.clearGameOver();
    state = GoFishRules.createInitialState(new PlayingCards.Deck().shuffle().cards);
    started = false; recorded = false; render(); scheduleAI();
  }
  function setup() {
    document.querySelectorAll('.restart-btn').forEach(button => { button.onclick = newGame; });
    window.addEventListener('pagehide', () => { clearTimeout(aiTimer); timer.destroy(); }); newGame();
  }
  window.initGame = newGame; window.restartGame = newGame;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
  return { newGame };
})();
