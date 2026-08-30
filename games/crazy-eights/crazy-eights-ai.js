const CrazyEightsAI = (() => {
  function chooseAction(state) {
    const actions = CrazyEightsRules.legalActions(state);
    if (!actions.length) return null;
    const plays = actions.filter(action => action.type === 'play');
    if (!plays.length) return actions[0];
    const hand = state.hands[state.turn];
    const suitCounts = PlayingCards.suits.reduce((counts, suit) => {
      counts[suit] = hand.filter(card => card.suit === suit && card.rank !== '8').length;
      return counts;
    }, {});
    return plays.slice().sort((first, second) => {
      const firstCard = hand.find(card => card.id === first.cardId);
      const secondCard = hand.find(card => card.id === second.cardId);
      const firstScore = (firstCard.rank === '8' ? -20 : 0) + suitCounts[first.suit || firstCard.suit];
      const secondScore = (secondCard.rank === '8' ? -20 : 0) + suitCounts[second.suit || secondCard.suit];
      return secondScore - firstScore;
    })[0];
  }

  return { chooseAction };
})();
