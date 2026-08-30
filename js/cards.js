const PlayingCards = (() => {
  const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
  const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
  const suitSymbols = { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' };
  const rankLabels = { ace: 'A', jack: 'J', queen: 'Q', king: 'K' };

  function rankValue(rank) {
    return ranks.indexOf(rank) + 1;
  }

  function cardColor(suit) {
    return suit === 'diamonds' || suit === 'hearts' ? 'red' : 'black';
  }

  function cardLabel(card) {
    const rank = card.rank.length > 2 ? `${card.rank[0].toUpperCase()}${card.rank.slice(1)}` : card.rank;
    const suit = `${card.suit[0].toUpperCase()}${card.suit.slice(1)}`;
    return `${rank} of ${suit}`;
  }

  class Card {
    constructor(suit, rank, options = {}) {
      if (!suits.includes(suit) || !ranks.includes(rank)) throw new Error('Invalid standard playing card.');
      this.suit = suit;
      this.rank = rank;
      this.color = cardColor(suit);
      this.faceUp = Boolean(options.faceUp);
      this.id = options.id || `${suit}-${rank}`;
    }

    clone() {
      return new Card(this.suit, this.rank, { id: this.id, faceUp: this.faceUp });
    }
  }

  function createStandardDeck(options = {}) {
    return suits.flatMap(suit => ranks.map(rank => new Card(suit, rank, options)));
  }

  function shuffle(cards, random = Math.random) {
    for (let index = cards.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [cards[index], cards[swap]] = [cards[swap], cards[index]];
    }
    return cards;
  }

  function countByRank(cards) {
    return cards.reduce((counts, card) => {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
      return counts;
    }, {});
  }

  function groupByRank(cards) {
    return cards.reduce((groups, card) => {
      (groups[card.rank] ||= []).push(card);
      return groups;
    }, {});
  }

  function drawCards(source, count = 1) {
    const amount = Math.min(source.length, Math.max(0, Math.floor(count)));
    return source.splice(Math.max(0, source.length - amount), amount);
  }

  class Deck {
    constructor(cards = createStandardDeck()) {
      this.originalCards = cards.map(card => card.clone());
      this.reset();
    }

    get size() {
      return this.cards.length;
    }

    shuffle(random = Math.random) {
      shuffle(this.cards, random);
      return this;
    }

    draw(count = 1) {
      return drawCards(this.cards, count);
    }

    deal(count = 1) {
      return this.draw(count);
    }

    reset() {
      this.cards = this.originalCards.map(card => card.clone());
      return this;
    }
  }

  function createCardElement(card, options = {}) {
    const element = document.createElement('button');
    const faceUp = options.faceUp === undefined ? card.faceUp : options.faceUp;
    const shortRank = rankLabels[card.rank] || card.rank;
    const symbol = suitSymbols[card.suit];
    element.type = 'button';
    element.className = `playing-card ${faceUp ? `card-face card-${card.color}` : 'card-back'}`;
    element.dataset.cardId = card.id;
    element.disabled = Boolean(options.disabled);
    element.classList.toggle('selected', Boolean(options.selected));
    element.setAttribute('aria-pressed', String(Boolean(options.selected)));
    element.setAttribute('aria-label', faceUp ? cardLabel(card) : 'Face-down card');
    if (faceUp) {
      element.innerHTML = `<span class="card-corner"><strong>${shortRank}</strong><span>${symbol}</span></span><span class="card-suit" aria-hidden="true">${symbol}</span><span class="card-corner card-corner-bottom" aria-hidden="true"><strong>${shortRank}</strong><span>${symbol}</span></span>`;
    }
    return element;
  }

  return {
    Card,
    Deck,
    suits,
    ranks,
    suitSymbols,
    rankValue,
    cardColor,
    cardLabel,
    createStandardDeck,
    shuffle,
    countByRank,
    groupByRank,
    drawCards,
    createCardElement
  };
})();
