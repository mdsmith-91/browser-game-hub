const GameCategories = [
  { id: 'board-games', title: 'Board Games', description: 'Classic strategy and head-to-head games.' },
  { id: 'card-games', title: 'Card Games', description: 'Deal in and play a quick hand.' },
  { id: 'arcade', title: 'Arcade', description: 'Fast reflexes, high scores, and quick rematches.' },
  { id: 'puzzle', title: 'Puzzle', description: 'Logic challenges for a thoughtful break.' },
  { id: 'tavern-games', title: 'Tavern Games', description: 'Familiar favorites from around the tavern.' }
];

const GameRegistry = [
  { id: 'battleship', title: 'Battleship', description: 'Place your fleet and outsmart a friend or the computer admiral.', url: '/games/battleship/', category: 'board-games', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Two Players', 'Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Time Played'] },
  { id: 'blackjack', title: 'Blackjack', description: 'Hit or stand against the house in a quick round of twenty-one.', url: '/games/blackjack/', category: 'card-games', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Single Player'], stats: ['Games Played', 'Wins', 'Losses', 'Pushes', 'Blackjacks', 'Win Rate', 'Time Played'] },
  { id: 'checkers', title: 'Checkers', description: 'Capture pieces, make kings, and plan your jumps.', url: '/games/checkers/', category: 'board-games', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Two Players', 'Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played'] },
  { id: 'chess', title: 'Chess', description: 'Classic strategy with a friend or a casual computer rival.', url: '/games/chess/', category: 'board-games', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Two Players', 'Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played'] },
  { id: 'connect-four', title: 'Connect Four', description: 'Drop disks and make four in a row against a friend or AI.', url: '/games/connect-four/', category: 'board-games', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Two Players', 'Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played'] },
  { id: 'crazy-eights', title: 'Crazy Eights', description: 'Match suits and ranks, wield wild Eights, and outplay the computer.', url: '/games/crazy-eights/', category: 'card-games', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Win Rate', 'Best Streak', 'Time Played'] },
  { id: 'go-fish', title: 'Go Fish', description: 'Ask smart, collect books, and test your memory against the computer.', url: '/games/go-fish/', category: 'card-games', record: { label: 'Books Won', type: 'stat', field: 'booksWon' }, gameModes: ['Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Books Won', 'Best Books', 'Win Rate', 'Time Played'] },
  { id: 'minesweeper', title: 'Minesweeper', description: 'Clear the field without detonating a mine.', url: '/games/minesweeper/', category: 'puzzle', record: { label: 'Best Time', type: 'low-time' }, gameModes: ['Single Player'], stats: ['Games Played', 'Wins', 'Best Time', 'Time Played'] },
  { id: 'pong', title: 'Pong', description: 'A fast paddle duel with local and computer opponents.', url: '/games/pong/', category: 'arcade', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Two Players', 'Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Time Played'] },
  { id: 'snake', title: 'Snake', description: 'Chase a high score in this classic arcade game.', url: '/games/snake/', category: 'arcade', record: { label: 'High Score', type: 'high' }, gameModes: ['Single Player'], stats: ['Games Played', 'High Score', 'Time Played'] },
  { id: 'solitaire', title: 'Solitaire', description: 'Settle in with classic Draw 1 Klondike, complete with undo.', url: '/games/solitaire/', category: 'card-games', record: { label: 'Best Time', type: 'low-time' }, gameModes: ['Single Player'], stats: ['Games Played', 'Games Won', 'Win Rate', 'Best Time', 'Fewest Moves', 'Time Played'] },
  { id: 'tic-tac-toe', title: 'Tic-Tac-Toe', description: 'Make three in a row against a friend or an unbeatable AI.', url: '/games/tic-tac-toe/', category: 'board-games', record: { label: 'Wins', type: 'stat', field: 'wins' }, gameModes: ['Two Players', 'Versus Computer'], stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played'] }
].sort((first, second) => first.title.localeCompare(second.title, undefined, { sensitivity: 'base' }));

GameRegistry.getGameById = function(id) {
  return this.find(game => game.id === id);
};
