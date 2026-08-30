const CrazyEights = (() => {
  const gameId = 'crazy-eights';
  const timer = Storage.createPlayTimer(gameId);
  let state;
  let selectedEight = null;
  let aiTimer = null;
  let started = false;
  let recorded = false;

  function formatTime(seconds) { return `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
  function start() { if (!started) { started = true; timer.start(); } }
  function updateStats() {
    const stats = Storage.getStats(gameId);
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('win-rate').textContent = `${stats.gamesPlayed ? Math.round(stats.wins / stats.gamesPlayed * 100) : 0}%`;
    document.getElementById('best-streak').textContent = stats.bestWinStreak;
    document.getElementById('time-played').textContent = formatTime(stats.timePlayed);
  }
  function renderComputer() {
    const row = document.getElementById('computer-hand');
    row.innerHTML = '';
    state.hands.computer.forEach(card => row.appendChild(PlayingCards.createCardElement(card, { faceUp: false, disabled: true })));
  }
  function chooseSuit(cardId) {
    selectedEight = cardId;
    document.getElementById('suit-picker').hidden = false;
    document.getElementById('game-status').textContent = 'Choose the suit that continues play.';
  }
  function renderHuman() {
    const row = document.getElementById('human-hand');
    row.innerHTML = '';
    const legal = CrazyEightsRules.legalActions(state);
    state.hands.human.forEach(card => {
      const canPlay = state.turn === 'human' && legal.some(action => action.type === 'play' && action.cardId === card.id);
      const element = PlayingCards.createCardElement(card, { faceUp: true, disabled: !canPlay });
      if (canPlay) element.onclick = () => card.rank === '8' ? chooseSuit(card.id) : perform({ type: 'play', cardId: card.id });
      row.appendChild(element);
    });
  }
  function renderPiles() {
    const draw = document.getElementById('draw-pile');
    const discard = document.getElementById('discard-pile');
    draw.innerHTML = '';
    discard.innerHTML = '';
    const drawAction = CrazyEightsRules.legalActions(state).find(action => action.type === 'draw');
    if (state.drawPile.length || state.discardPile.length > 1) {
      const card = PlayingCards.createCardElement(state.drawPile[0] || state.discardPile[0], { faceUp: false, disabled: !drawAction });
      card.setAttribute('aria-label', `Draw pile, ${state.drawPile.length} cards${drawAction ? '. Draw one card.' : ''}`);
      if (drawAction) card.onclick = () => perform(drawAction);
      draw.appendChild(card);
    } else if (drawAction) {
      const pass = document.createElement('button');
      pass.type = 'button'; pass.className = 'btn-secondary game-btn'; pass.textContent = 'Pass';
      pass.setAttribute('aria-label', 'No cards remain to draw. Pass turn.'); pass.onclick = () => perform(drawAction); draw.appendChild(pass);
    }
    const top = state.discardPile[state.discardPile.length - 1];
    discard.appendChild(PlayingCards.createCardElement(top, { faceUp: true, disabled: true }));
  }
  function render() {
    renderComputer(); renderHuman(); renderPiles(); updateStats();
    document.getElementById('computer-count').textContent = `${state.hands.computer.length} cards`;
    document.getElementById('human-count').textContent = `${state.hands.human.length} cards`;
    document.getElementById('active-suit').textContent = `${PlayingCards.suitSymbols[state.activeSuit]} ${state.activeSuit}`;
    document.getElementById('active-suit').style.color = PlayingCards.cardColor(state.activeSuit) === 'red' ? 'var(--danger)' : '';
    document.getElementById('turn-indicator').textContent = state.turn === 'human' ? 'Player' : 'Computer';
    if (state.phase === 'playing' && !selectedEight) document.getElementById('game-status').textContent = state.turn === 'human' ? 'Your turn. Play a card or draw.' : 'Computer is choosing a card…';
  }
  function finish() {
    if (recorded || state.phase !== 'complete') return;
    recorded = true; timer.stop(); clearTimeout(aiTimer);
    const won = state.winner === 'human';
    Storage.recordGameResult(gameId, won ? 'win' : 'loss'); updateStats(); render();
    GameUI.showGameOver({ title: won ? 'You emptied your hand!' : 'Computer wins', message: won ? 'A sharp round of Crazy Eights.' : 'The computer played its last card first.', restartLabel: 'Rematch', onRestart: newGame });
  }
  function scheduleAI() {
    if (state.phase !== 'playing' || state.turn !== 'computer') return;
    aiTimer = setTimeout(() => {
      const action = CrazyEightsAI.chooseAction(state);
      if (action) CrazyEightsRules.applyAction(state, action);
      render(); finish(); scheduleAI();
    }, 500);
  }
  function perform(action) {
    if (state.turn !== 'human' || state.phase !== 'playing') return;
    start(); selectedEight = null; document.getElementById('suit-picker').hidden = true;
    if (!CrazyEightsRules.applyAction(state, action)) return;
    render(); finish(); scheduleAI();
  }
  function newGame() {
    clearTimeout(aiTimer); timer.reset(); GameUI.clearGameOver();
    state = CrazyEightsRules.createInitialState(new PlayingCards.Deck().shuffle().cards);
    selectedEight = null; started = false; recorded = false;
    document.getElementById('suit-picker').hidden = true; render();
  }
  function setup() {
    const actions = document.getElementById('suit-actions');
    PlayingCards.suits.forEach(suit => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'btn-secondary game-btn suit-button'; button.dataset.color = PlayingCards.cardColor(suit);
      button.textContent = `${PlayingCards.suitSymbols[suit]} ${suit}`; button.onclick = () => perform({ type: 'play', cardId: selectedEight, suit }); actions.appendChild(button);
    });
    document.querySelectorAll('.restart-btn').forEach(button => { button.onclick = newGame; });
    window.addEventListener('pagehide', () => { clearTimeout(aiTimer); timer.destroy(); }); newGame();
  }
  window.initGame = newGame; window.restartGame = newGame;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
  return { newGame };
})();
