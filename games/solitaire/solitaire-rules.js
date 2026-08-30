const SolitaireRules = (() => {
  function cloneCard(card) {
    return new PlayingCards.Card(card.suit, card.rank, { id: card.id, faceUp: card.faceUp });
  }

  function cloneState(state) {
    return {
      tableau: state.tableau.map(pile => pile.map(cloneCard)),
      stock: state.stock.map(cloneCard),
      waste: state.waste.map(cloneCard),
      foundations: Object.fromEntries(PlayingCards.suits.map(suit => [suit, state.foundations[suit].map(cloneCard)])),
      moves: state.moves
    };
  }

  function createInitialState(cards) {
    if (!Array.isArray(cards) || cards.length !== 52) throw new Error('Klondike requires a 52-card deck.');
    const remaining = cards.map(cloneCard);
    const tableau = Array.from({ length: 7 }, () => []);
    tableau.forEach((pile, column) => {
      for (let index = 0; index <= column; index++) {
        const card = remaining.pop();
        card.faceUp = index === column;
        pile.push(card);
      }
    });
    remaining.forEach(card => { card.faceUp = false; });
    return {
      tableau,
      stock: remaining,
      waste: [],
      foundations: Object.fromEntries(PlayingCards.suits.map(suit => [suit, []])),
      moves: 0
    };
  }

  function canStackOnTableau(card, destinationCard) {
    if (!destinationCard) return PlayingCards.rankValue(card.rank) === 13;
    return card.color !== destinationCard.color && PlayingCards.rankValue(card.rank) + 1 === PlayingCards.rankValue(destinationCard.rank);
  }

  function isValidSequence(cards) {
    return cards.length > 0 && cards.every((card, index) => card.faceUp && (!index || canStackOnTableau(card, cards[index - 1])));
  }

  function canMoveToFoundation(card, foundation) {
    if (!foundation.length) return PlayingCards.rankValue(card.rank) === 1;
    const top = foundation[foundation.length - 1];
    return top.suit === card.suit && PlayingCards.rankValue(card.rank) === PlayingCards.rankValue(top.rank) + 1;
  }

  function exposeTableauTop(pile) {
    const top = pile[pile.length - 1];
    if (top && !top.faceUp) {
      top.faceUp = true;
      return true;
    }
    return false;
  }

  function drawStock(state) {
    if (state.stock.length) {
      const card = state.stock.pop();
      card.faceUp = true;
      state.waste.push(card);
      state.moves++;
      return true;
    }
    if (!state.waste.length) return false;
    state.stock = state.waste.reverse();
    state.stock.forEach(card => { card.faceUp = false; });
    state.waste = [];
    state.moves++;
    return true;
  }

  function sourceCards(state, source) {
    if (source.type === 'tableau') {
      const pile = state.tableau[source.pile];
      if (!pile || source.index < 0 || source.index >= pile.length) return null;
      const cards = pile.slice(source.index);
      return isValidSequence(cards) ? cards : null;
    }
    if (source.type === 'waste') {
      return state.waste.length ? [state.waste[state.waste.length - 1]] : null;
    }
    if (source.type === 'foundation') {
      const pile = state.foundations[source.suit];
      return pile && pile.length ? [pile[pile.length - 1]] : null;
    }
    return null;
  }

  function removeSource(state, source, count) {
    if (source.type === 'tableau') {
      const pile = state.tableau[source.pile];
      const cards = pile.splice(source.index, count);
      exposeTableauTop(pile);
      return cards;
    }
    if (source.type === 'waste') return [state.waste.pop()];
    return [state.foundations[source.suit].pop()];
  }

  function move(state, source, destination) {
    const cards = sourceCards(state, source);
    if (!cards) return false;

    if (destination.type === 'tableau') {
      const pile = state.tableau[destination.pile];
      if (!pile || source.type === 'tableau' && source.pile === destination.pile) return false;
      if (!canStackOnTableau(cards[0], pile[pile.length - 1])) return false;
      pile.push(...removeSource(state, source, cards.length));
    } else if (destination.type === 'foundation') {
      const foundation = state.foundations[destination.suit];
      if (!foundation || cards.length !== 1 || source.type === 'foundation' || cards[0].suit !== destination.suit) return false;
      if (!canMoveToFoundation(cards[0], foundation)) return false;
      foundation.push(...removeSource(state, source, 1));
    } else return false;

    state.moves++;
    return true;
  }

  function isVictory(state) {
    return PlayingCards.suits.every(suit => state.foundations[suit].length === 13);
  }

  return {
    cloneState,
    createInitialState,
    canStackOnTableau,
    isValidSequence,
    canMoveToFoundation,
    exposeTableauTop,
    drawStock,
    move,
    isVictory
  };
})();
