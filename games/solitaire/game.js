const Solitaire = (() => {
  const gameId = 'solitaire';
  const historyLimit = 100;
  const playTimer = Storage.createPlayTimer(gameId);
  let state;
  let history = [];
  let selected = null;
  let pointerDrag = null;
  let suppressClick = false;
  let active = true;
  let started = false;
  let sessionFinalized = false;
  let seconds = 0;
  let timerId = null;
  let feedbackId = null;

  function sameSource(first, second) {
    return first && second && first.type === second.type && first.pile === second.pile && first.index === second.index && first.suit === second.suit;
  }

  function formatTime(value) {
    const total = Math.max(0, Math.floor(value));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function formatTimePlayed(value) {
    const total = Math.max(0, Math.floor(value));
    return `${Math.floor(total / 60)}m ${total % 60}s`;
  }

  function setStatus(message) {
    document.getElementById('solitaire-status').textContent = message;
  }

  function startSession() {
    if (started) return;
    started = true;
    playTimer.start();
    timerId = setInterval(() => {
      if (document.visibilityState !== 'hidden' && active) {
        seconds++;
        document.getElementById('timer').textContent = formatTime(seconds);
      }
    }, 1000);
  }

  function finalizeSession(result) {
    if (sessionFinalized || !started) return;
    sessionFinalized = true;
    clearInterval(timerId);
    timerId = null;
    playTimer.stop();
    Storage.recordResult(gameId, result);
  }

  function createEmptyPile(label, className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `empty-pile ${className}`.trim();
    button.textContent = label;
    return button;
  }

  function addDropTarget(element, destination) {
    element.dataset.dropType = destination.type;
    if (destination.pile !== undefined) element.dataset.dropPile = destination.pile;
    if (destination.suit) element.dataset.dropSuit = destination.suit;
  }

  function clearPointerDrag() {
    if (!pointerDrag) return;
    pointerDrag.element.classList.remove('dragging');
    document.getElementById('solitaire-board').classList.remove('drag-active');
    pointerDrag = null;
  }

  function pointerDestination(event) {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop-type]');
    if (!target) return null;
    return target.dataset.dropType === 'foundation'
      ? { type: 'foundation', suit: target.dataset.dropSuit }
      : { type: 'tableau', pile: Number(target.dataset.dropPile) };
  }

  function movePointerDrag(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
    if (distance < 8 && !pointerDrag.dragging) return;
    pointerDrag.dragging = true;
    suppressClick = true;
    pointerDrag.element.classList.add('dragging');
    document.getElementById('solitaire-board').classList.add('drag-active');
    event.preventDefault();
  }

  function endPointerDrag(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const wasDragging = pointerDrag.dragging;
    const draggedSource = pointerDrag.source;
    const destination = wasDragging ? pointerDestination(event) : null;
    clearPointerDrag();
    if (wasDragging) {
      if (destination) attemptMove(draggedSource, destination);
      else invalidMove('Drop the card on a tableau or foundation pile.');
      setTimeout(() => { suppressClick = false; }, 0);
    }
  }

  function createRenderedCard(card, source, selectedCard = false) {
    const cardElement = PlayingCards.createCardElement(card, { selected: selectedCard, disabled: !card.faceUp });
    if (!card.faceUp) return cardElement;
    cardElement.addEventListener('click', () => {
      if (suppressClick) return;
      handleCardClick(source);
    });
    cardElement.addEventListener('dblclick', event => {
      event.preventDefault();
      if (source.type !== 'foundation') attemptMove(source, { type: 'foundation', suit: card.suit });
    });
    cardElement.addEventListener('pointerdown', event => {
      if (!active || event.button !== 0 || event.pointerType === 'touch') return;
      pointerDrag = { source, element: cardElement, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dragging: false };
    });
    return cardElement;
  }

  function renderStock() {
    const stock = document.getElementById('stock-pile');
    stock.innerHTML = '';
    if (state.stock.length) {
      const top = state.stock[state.stock.length - 1];
      const card = PlayingCards.createCardElement(top, { faceUp: false });
      card.setAttribute('aria-label', `Stock, ${state.stock.length} cards. Draw one card.`);
      card.onclick = drawStock;
      stock.appendChild(card);
    } else {
      const empty = createEmptyPile(state.waste.length ? 'Recycle' : 'Empty', 'stock-empty');
      empty.setAttribute('aria-label', state.waste.length ? 'Recycle waste into stock' : 'Stock and waste are empty');
      empty.disabled = !state.waste.length;
      empty.onclick = drawStock;
      stock.appendChild(empty);
    }
  }

  function renderWaste() {
    const waste = document.getElementById('waste-pile');
    waste.innerHTML = '';
    if (!state.waste.length) {
      const empty = createEmptyPile('Waste');
      empty.disabled = true;
      waste.appendChild(empty);
      return;
    }
    const source = { type: 'waste' };
    waste.appendChild(createRenderedCard(state.waste[state.waste.length - 1], source, sameSource(selected, source)));
  }

  function renderFoundations() {
    document.querySelectorAll('.foundation-pile').forEach(pileElement => {
      const suit = pileElement.dataset.suit;
      const pile = state.foundations[suit];
      const destination = { type: 'foundation', suit };
      pileElement.innerHTML = '';
      if (pile.length) {
        const source = { type: 'foundation', suit };
        const card = createRenderedCard(pile[pile.length - 1], source, sameSource(selected, source));
        addDropTarget(card, destination);
        pileElement.appendChild(card);
      } else {
        const empty = createEmptyPile(PlayingCards.suitSymbols[suit], 'foundation-empty');
        empty.dataset.color = PlayingCards.cardColor(suit);
        empty.setAttribute('aria-label', `Empty ${suit} foundation`);
        empty.onclick = () => selected ? attemptMove(selected, destination) : invalidMove('Choose an Ace before selecting an empty foundation.');
        addDropTarget(empty, destination);
        pileElement.appendChild(empty);
      }
      addDropTarget(pileElement, destination);
    });
  }

  function renderTableau() {
    const tableau = document.getElementById('tableau');
    tableau.innerHTML = '';
    state.tableau.forEach((pile, pileIndex) => {
      const pileElement = document.createElement('div');
      const destination = { type: 'tableau', pile: pileIndex };
      pileElement.className = 'tableau-pile';
      pileElement.setAttribute('aria-label', `Tableau column ${pileIndex + 1}`);
      if (!pile.length) {
        const empty = createEmptyPile('K');
        empty.setAttribute('aria-label', `Empty tableau column ${pileIndex + 1}. Only a King can be placed here.`);
        empty.onclick = () => selected ? attemptMove(selected, destination) : invalidMove('Choose a King or King-led stack first.');
        addDropTarget(empty, destination);
        pileElement.appendChild(empty);
      } else {
        pile.forEach((card, cardIndex) => {
          const source = { type: 'tableau', pile: pileIndex, index: cardIndex };
          const inSelectedStack = selected?.type === 'tableau' && selected.pile === pileIndex && cardIndex >= selected.index;
          const cardElement = createRenderedCard(card, source, inSelectedStack);
          if (cardIndex === pile.length - 1) addDropTarget(cardElement, destination);
          pileElement.appendChild(cardElement);
        });
      }
      addDropTarget(pileElement, destination);
      tableau.appendChild(pileElement);
    });
  }

  function render() {
    renderStock();
    renderWaste();
    renderFoundations();
    renderTableau();
    updateStats();
    document.getElementById('undo-button').disabled = !active || !history.length;
  }

  function updateStats() {
    const stats = Storage.getStats(gameId);
    const bestTime = Storage.getBestScore(gameId);
    const fewestMoves = Storage.getBestScore(`${gameId}-moves`);
    document.getElementById('timer').textContent = formatTime(seconds);
    document.getElementById('move-count').textContent = state.moves;
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('games-won').textContent = stats.wins;
    document.getElementById('win-rate').textContent = `${stats.gamesPlayed ? Math.round(stats.wins / stats.gamesPlayed * 100) : 0}%`;
    document.getElementById('best-time').textContent = bestTime === null ? '--:--' : formatTime(bestTime);
    document.getElementById('fewest-moves').textContent = fewestMoves === null ? '—' : fewestMoves;
    document.getElementById('time-played').textContent = formatTimePlayed(stats.timePlayed);
  }

  function invalidMove(message = 'That move is not available.') {
    const board = document.getElementById('solitaire-board');
    clearTimeout(feedbackId);
    board.classList.remove('invalid-move');
    void board.offsetWidth;
    board.classList.add('invalid-move');
    feedbackId = setTimeout(() => board.classList.remove('invalid-move'), 420);
    setStatus(message);
    return false;
  }

  function performAction(action, message) {
    if (!active) return false;
    const snapshot = SolitaireRules.cloneState(state);
    if (!action()) return invalidMove();
    history.push(snapshot);
    if (history.length > historyLimit) history.shift();
    selected = null;
    startSession();
    setStatus(message || `Move ${state.moves}.`);
    render();
    if (SolitaireRules.isVictory(state)) winGame();
    return true;
  }

  function drawStock() {
    const recycling = !state.stock.length && state.waste.length;
    performAction(() => SolitaireRules.drawStock(state), recycling ? 'Waste recycled into the stock.' : 'Drew one card from the stock.');
  }

  function attemptMove(source, destination) {
    return performAction(() => SolitaireRules.move(state, source, destination));
  }

  function handleCardClick(source) {
    if (!active) return;
    if (sameSource(selected, source)) {
      selected = null;
      setStatus('Selection cleared.');
      render();
      return;
    }
    if (selected) {
      const destination = source.type === 'foundation'
        ? { type: 'foundation', suit: source.suit }
        : source.type === 'tableau' ? { type: 'tableau', pile: source.pile } : null;
      if (destination && attemptMove(selected, destination)) return;
    }
    selected = source;
    setStatus('Card selected. Choose a destination.');
    render();
  }

  function undo() {
    if (!active || !history.length) return;
    state = history.pop();
    selected = null;
    setStatus(`Move undone. ${state.moves} moves remain.`);
    render();
  }

  function winGame() {
    active = false;
    finalizeSession('win');
    Storage.saveBestScore(gameId, seconds);
    Storage.saveBestScore(`${gameId}-moves`, state.moves);
    render();
    setStatus('All four foundations are complete. You won!');
    GameUI.showGameOver({
      title: 'Solitaire complete!',
      message: `${formatTime(seconds)} · ${state.moves} moves`,
      restartLabel: 'Play Again',
      onRestart: () => newGame(false)
    });
  }

  function newGame(finalizePrevious = true) {
    if (finalizePrevious && active && started) finalizeSession('complete');
    clearInterval(timerId);
    timerId = null;
    playTimer.reset();
    GameUI.clearGameOver();
    const deck = new PlayingCards.Deck().shuffle();
    state = SolitaireRules.createInitialState(deck.cards);
    history = [];
    selected = null;
    pointerDrag = null;
    active = true;
    started = false;
    sessionFinalized = false;
    seconds = 0;
    setStatus('Choose the stock or a face-up card to begin. Draw 1 with unlimited recycling.');
    render();
  }

  function setup() {
    document.querySelectorAll('.restart-btn').forEach(button => { button.onclick = () => newGame(true); });
    document.getElementById('undo-button').onclick = undo;
    document.addEventListener('pointermove', movePointerDrag, { passive: false });
    document.addEventListener('pointerup', endPointerDrag);
    document.addEventListener('pointercancel', clearPointerDrag);
    window.addEventListener('pagehide', event => {
      if (active && started) finalizeSession('complete');
      clearInterval(timerId);
      if (!event.persisted) playTimer.destroy();
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) newGame(false);
    });
    newGame(false);
  }

  window.initGame = () => newGame(true);
  window.restartGame = () => newGame(true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();

  return { newGame, undo };
})();
