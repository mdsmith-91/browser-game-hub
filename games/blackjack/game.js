const Blackjack = (() => {
  const gameId = 'blackjack';
  const timer = Storage.createPlayTimer(gameId);
  let state;
  let started = false;
  let recorded = false;

  function formatTime(seconds) { return `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
  function start() { if (!started) { started = true; timer.start(); } }
  function renderHand(id, hand, hideHole = false) {
    const row = document.getElementById(id);
    row.innerHTML = '';
    hand.forEach((card, index) => row.appendChild(PlayingCards.createCardElement(card, { faceUp: !(hideHole && index === 1), disabled: true })));
  }
  function updateStats() {
    const stats = Storage.getStats(gameId);
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('pushes').textContent = stats.draws;
    document.getElementById('blackjacks').textContent = stats.blackjacks;
    document.getElementById('win-rate').textContent = `${stats.gamesPlayed ? Math.round(stats.wins / stats.gamesPlayed * 100) : 0}%`;
    document.getElementById('time-played').textContent = formatTime(stats.timePlayed);
  }
  function resultMessage() {
    const labels = { win: 'You win!', loss: 'Dealer wins.', push: 'Push — same total.' };
    if (BlackjackRules.isBlackjack(state.hands.player)) return state.result === 'push' ? 'Two blackjacks — push.' : 'Blackjack! You win.';
    return labels[state.result];
  }
  function finish() {
    if (recorded || state.phase !== 'complete') return;
    recorded = true;
    timer.stop();
    Storage.recordGameResult(gameId, state.result === 'push' ? 'draw' : state.result, { blackjack: state.result === 'win' && BlackjackRules.isBlackjack(state.hands.player) });
    updateStats();
    GameUI.showGameOver({ title: resultMessage(), message: `You: ${BlackjackRules.handValue(state.hands.player).total} · Dealer: ${BlackjackRules.handValue(state.hands.dealer).total}`, restartLabel: 'New Round', onRestart: newGame });
  }
  function render() {
    const playing = state.phase === 'playing';
    renderHand('dealer-hand', state.hands.dealer, playing);
    renderHand('player-hand', state.hands.player);
    document.getElementById('player-value').textContent = BlackjackRules.handValue(state.hands.player).total;
    document.getElementById('dealer-value').textContent = playing ? BlackjackRules.handValue([state.hands.dealer[0]]).total : BlackjackRules.handValue(state.hands.dealer).total;
    document.getElementById('hit-button').disabled = !playing;
    document.getElementById('stand-button').disabled = !playing;
    document.getElementById('game-status').textContent = playing ? 'Your turn. Hit or stand.' : resultMessage();
    updateStats();
  }
  function act(type) { if (state.phase !== 'playing') return; start(); BlackjackRules.applyAction(state, { type }); render(); finish(); }
  function newGame() {
    timer.reset();
    GameUI.clearGameOver();
    state = BlackjackRules.createInitialState(new PlayingCards.Deck().shuffle().cards);
    started = false;
    recorded = false;
    render();
    finish();
  }
  function setup() {
    document.getElementById('hit-button').onclick = () => act('hit');
    document.getElementById('stand-button').onclick = () => act('stand');
    document.querySelectorAll('.restart-btn').forEach(button => { button.onclick = newGame; });
    window.addEventListener('pagehide', () => timer.destroy());
    newGame();
  }
  window.initGame = newGame;
  window.restartGame = newGame;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
  return { newGame };
})();
