const GoFishRules = (() => {
  function removeBooks(state, playerId) {
    const groups = PlayingCards.groupByRank(state.hands[playerId]);
    Object.entries(groups).forEach(([rank, cards]) => {
      if (cards.length !== 4) return;
      state.books[playerId].push(rank);
      const ids = new Set(cards.map(card => card.id));
      state.hands[playerId] = state.hands[playerId].filter(card => !ids.has(card.id));
      if (playerId === 'human') state.memory.aiKnownHumanRanks = state.memory.aiKnownHumanRanks.filter(known => known !== rank);
    });
  }

  function replenish(state, playerId) {
    if (state.hands[playerId].length || !state.deck.length) return;
    state.hands[playerId].push(...PlayingCards.drawCards(state.deck, Math.min(7, state.deck.length)));
    removeBooks(state, playerId);
  }

  function isComplete(state) {
    return state.books.human.length + state.books.computer.length === 13 ||
      (!state.deck.length && (!state.hands.human.length || !state.hands.computer.length));
  }

  function complete(state) {
    state.phase = 'complete';
    state.winner = state.books.human.length === state.books.computer.length ? 'draw' :
      state.books.human.length > state.books.computer.length ? 'human' : 'computer';
  }

  function legalActions(state) {
    if (state.phase !== 'playing') return [];
    return Object.keys(PlayingCards.countByRank(state.hands[state.turn])).map(rank => ({ type: 'ask', rank }));
  }

  function applyAction(state, action) {
    if (!legalActions(state).some(candidate => candidate.type === action?.type && candidate.rank === action.rank)) return false;
    const asker = state.turn;
    const opponent = asker === 'human' ? 'computer' : 'human';
    if (asker === 'human' && !state.memory.aiKnownHumanRanks.includes(action.rank)) state.memory.aiKnownHumanRanks.push(action.rank);
    const matches = state.hands[opponent].filter(card => card.rank === action.rank);
    state.lastAction = { asker, rank: action.rank, received: matches.length, drewMatch: false };
    if (matches.length) {
      state.hands[opponent] = state.hands[opponent].filter(card => card.rank !== action.rank);
      state.hands[asker].push(...matches);
      if (asker === 'computer') state.memory.aiKnownHumanRanks = state.memory.aiKnownHumanRanks.filter(rank => rank !== action.rank);
      removeBooks(state, asker);
      replenish(state, opponent);
      replenish(state, asker);
    } else {
      const drawn = PlayingCards.drawCards(state.deck, 1)[0];
      if (drawn) state.hands[asker].push(drawn);
      state.lastAction.drewMatch = Boolean(drawn && drawn.rank === action.rank);
      removeBooks(state, asker);
      replenish(state, asker);
      replenish(state, opponent);
      if (!state.lastAction.drewMatch) state.turn = opponent;
    }
    if (isComplete(state)) complete(state);
    return true;
  }

  function createInitialState(cards) {
    if (!Array.isArray(cards) || cards.length !== 52) throw new Error('Go Fish requires a 52-card deck.');
    const deck = cards.slice();
    const state = {
      deck,
      hands: { human: [], computer: [] },
      books: { human: [], computer: [] },
      players: {
        human: { id: 'human', controller: 'human' },
        computer: { id: 'computer', controller: 'ai' }
      },
      memory: { aiKnownHumanRanks: [] },
      turn: 'human',
      phase: 'playing',
      winner: null,
      lastAction: null
    };
    for (let index = 0; index < 7; index++) {
      state.hands.human.push(deck.pop());
      state.hands.computer.push(deck.pop());
    }
    removeBooks(state, 'human');
    removeBooks(state, 'computer');
    replenish(state, 'human');
    replenish(state, 'computer');
    return state;
  }

  return { createInitialState, removeBooks, replenish, isComplete, legalActions, applyAction };
})();
