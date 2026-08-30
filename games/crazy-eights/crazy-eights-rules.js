const CrazyEightsRules = (() => {
  function drawOne(state, playerId) {
    recycleDiscard(state);
    const card = PlayingCards.drawCards(state.drawPile, 1)[0];
    if (card) state.hands[playerId].push(card);
    return card || null;
  }

  function recycleDiscard(state) {
    if (state.drawPile.length || state.discardPile.length < 2) return false;
    const top = state.discardPile.pop();
    state.drawPile = PlayingCards.shuffle(state.discardPile);
    state.discardPile = [top];
    return true;
  }

  function isPlayable(card, state) {
    const top = state.discardPile[state.discardPile.length - 1];
    return card.rank === '8' || card.rank === top.rank || card.suit === state.activeSuit;
  }

  function playableCards(state, playerId = state.turn) {
    return state.hands[playerId].filter(card => isPlayable(card, state));
  }

  function nextPlayer(playerId) {
    return playerId === 'human' ? 'computer' : 'human';
  }

  function legalActions(state) {
    if (state.phase !== 'playing') return [];
    const playable = playableCards(state);
    const actions = playable.flatMap(card => card.rank === '8'
      ? PlayingCards.suits.map(suit => ({ type: 'play', cardId: card.id, suit }))
      : [{ type: 'play', cardId: card.id }]);
    if (!actions.length && !state.hasDrawn) actions.push({ type: 'draw' });
    if (!actions.length && state.hasDrawn) actions.push({ type: 'pass' });
    return actions;
  }

  function finishTurn(state) {
    state.turn = nextPlayer(state.turn);
    state.hasDrawn = false;
  }

  function applyAction(state, action) {
    const legal = legalActions(state);
    const match = legal.find(candidate => candidate.type === action?.type &&
      (candidate.cardId === undefined || candidate.cardId === action.cardId) &&
      (candidate.suit === undefined || candidate.suit === action.suit));
    if (!match) return false;
    if (action.type === 'draw') {
      state.hasDrawn = true;
      const card = drawOne(state, state.turn);
      if (!card || !isPlayable(card, state)) finishTurn(state);
      return true;
    }
    if (action.type === 'pass') {
      finishTurn(state);
      return true;
    }
    const hand = state.hands[state.turn];
    const index = hand.findIndex(card => card.id === action.cardId);
    const [card] = hand.splice(index, 1);
    state.discardPile.push(card);
    state.activeSuit = card.rank === '8' ? action.suit : card.suit;
    if (!hand.length) {
      state.phase = 'complete';
      state.winner = state.turn;
    } else finishTurn(state);
    return true;
  }

  function createInitialState(cards) {
    if (!Array.isArray(cards) || cards.length !== 52) throw new Error('Crazy Eights requires a 52-card deck.');
    const drawPile = cards.slice();
    const hands = { human: [], computer: [] };
    for (let index = 0; index < 7; index++) {
      hands.human.push(drawPile.pop());
      hands.computer.push(drawPile.pop());
    }
    let first = drawPile.pop();
    const deferred = [];
    while (first?.rank === '8' && drawPile.length) {
      deferred.push(first);
      first = drawPile.pop();
    }
    drawPile.unshift(...deferred);
    return {
      drawPile,
      discardPile: [first],
      hands,
      players: {
        human: { id: 'human', controller: 'human' },
        computer: { id: 'computer', controller: 'ai' }
      },
      activeSuit: first.suit,
      turn: 'human',
      hasDrawn: false,
      phase: 'playing',
      winner: null
    };
  }

  return { createInitialState, recycleDiscard, isPlayable, playableCards, legalActions, applyAction };
})();
