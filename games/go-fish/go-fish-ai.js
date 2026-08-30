const GoFishAI = (() => {
  function chooseAction(state) {
    const actions = GoFishRules.legalActions(state);
    if (!actions.length) return null;
    const known = new Set(state.memory.aiKnownHumanRanks);
    const counts = PlayingCards.countByRank(state.hands[state.turn]);
    return actions.slice().sort((first, second) => {
      const firstScore = (known.has(first.rank) ? 100 : 0) + counts[first.rank];
      const secondScore = (known.has(second.rank) ? 100 : 0) + counts[second.rank];
      return secondScore - firstScore;
    })[0];
  }

  return { chooseAction };
})();
