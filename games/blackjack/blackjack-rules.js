const BlackjackRules = (() => {
  function handValue(hand) {
    let total = 0;
    let aces = 0;
    hand.forEach(card => {
      if (card.rank === 'ace') {
        total += 11;
        aces++;
      } else total += Math.min(10, PlayingCards.rankValue(card.rank));
    });
    while (total > 21 && aces) {
      total -= 10;
      aces--;
    }
    return { total, soft: aces > 0 };
  }

  function isBlackjack(hand) {
    return hand.length === 2 && handValue(hand).total === 21;
  }

  function drawOne(state, hand) {
    const card = PlayingCards.drawCards(state.deck, 1)[0];
    if (card) hand.push(card);
    return card || null;
  }

  function settle(state) {
    const playerTotal = handValue(state.hands.player).total;
    const dealerTotal = handValue(state.hands.dealer).total;
    if (playerTotal > 21) state.result = 'loss';
    else if (dealerTotal > 21 || playerTotal > dealerTotal) state.result = 'win';
    else if (playerTotal < dealerTotal) state.result = 'loss';
    else state.result = 'push';
    state.phase = 'complete';
  }

  function dealerTurn(state) {
    state.phase = 'dealer';
    while (handValue(state.hands.dealer).total < 17 && state.deck.length) drawOne(state, state.hands.dealer);
    settle(state);
  }

  function createInitialState(cards) {
    if (!Array.isArray(cards) || cards.length !== 52) throw new Error('Blackjack requires a 52-card deck.');
    const state = {
      deck: cards.slice(),
      hands: { player: [], dealer: [] },
      players: {
        player: { id: 'player', controller: 'human' },
        dealer: { id: 'dealer', controller: 'fixed' }
      },
      turn: 'player',
      phase: 'playing',
      result: null
    };
    drawOne(state, state.hands.player);
    drawOne(state, state.hands.dealer);
    drawOne(state, state.hands.player);
    drawOne(state, state.hands.dealer);
    const playerBlackjack = isBlackjack(state.hands.player);
    const dealerBlackjack = isBlackjack(state.hands.dealer);
    if (playerBlackjack || dealerBlackjack) {
      state.result = playerBlackjack && dealerBlackjack ? 'push' : playerBlackjack ? 'win' : 'loss';
      state.phase = 'complete';
    }
    return state;
  }

  function legalActions(state) {
    return state.phase === 'playing' && state.turn === 'player' ? [{ type: 'hit' }, { type: 'stand' }] : [];
  }

  function applyAction(state, action) {
    if (!legalActions(state).some(candidate => candidate.type === action?.type)) return false;
    if (action.type === 'hit') {
      if (!drawOne(state, state.hands.player)) return false;
      if (handValue(state.hands.player).total > 21) settle(state);
      else if (handValue(state.hands.player).total === 21) dealerTurn(state);
    } else dealerTurn(state);
    return true;
  }

  return { handValue, isBlackjack, createInitialState, legalActions, applyAction, dealerTurn };
})();
