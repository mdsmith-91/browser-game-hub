const GameRegistry = [
  {
    id: 'battleship',
    title: 'Battleship',
    description: 'Place your fleet and outsmart a friend or the computer admiral.',
    url: '/games/battleship/',
    record: { label: 'Wins', type: 'stat', field: 'wins' },
    gameModes: ['Two Players', 'Versus Computer'],
    stats: ['Games Played', 'Wins', 'Losses', 'Time Played']
  },
  {
    id: 'checkers',
    title: 'Checkers',
    description: 'Capture pieces, make kings, and plan your jumps.',
    url: '/games/checkers/',
    record: { label: 'Wins', type: 'stat', field: 'wins' },
    gameModes: ['Two Players', 'Versus Computer'],
    stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played']
  },
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic strategy with a friend or a casual computer rival.',
    url: '/games/chess/',
    record: { label: 'Wins', type: 'stat', field: 'wins' },
    gameModes: ['Two Players', 'Versus Computer'],
    stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played']
  },
  {
    id: 'connect-four',
    title: 'Connect Four',
    description: 'Drop disks and make four in a row against a friend or AI.',
    url: '/games/connect-four/',
    record: { label: 'Wins', type: 'stat', field: 'wins' },
    gameModes: ['Two Players', 'Versus Computer'],
    stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played']
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    description: 'Clear the field without detonating a mine.',
    url: '/games/minesweeper/',
    record: { label: 'Best Time', type: 'low-time' },
    gameModes: ['Single Player'],
    stats: ['Games Played', 'Wins', 'Best Time', 'Time Played']
  },
  {
    id: 'pong',
    title: 'Pong',
    description: 'A fast paddle duel with local and computer opponents.',
    url: '/games/pong/',
    record: { label: 'Wins', type: 'stat', field: 'wins' },
    gameModes: ['Two Players', 'Versus Computer'],
    stats: ['Games Played', 'Wins', 'Losses', 'Time Played']
  },
  {
    id: 'snake',
    title: 'Snake',
    description: 'Chase a high score solo or race a friend on one keyboard.',
    url: '/games/snake/',
    record: { label: 'High Score', type: 'high' },
    gameModes: ['Single Player', 'Two Players'],
    stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'High Score', 'Time Played']
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Make three in a row against a friend or an unbeatable AI.',
    url: '/games/tic-tac-toe/',
    record: { label: 'Wins', type: 'stat', field: 'wins' },
    gameModes: ['Two Players', 'Versus Computer'],
    stats: ['Games Played', 'Wins', 'Losses', 'Draws', 'Time Played']
  }
].sort((first, second) => first.title.localeCompare(second.title, undefined, { sensitivity: 'base' }));

GameRegistry.getGameById = function(id) {
  return this.find(game => game.id === id);
};
