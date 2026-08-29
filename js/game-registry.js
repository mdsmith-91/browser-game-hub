const GameRegistry = [
  { id: 'tic-tac-toe', title: 'Tic-Tac-Toe', description: 'Classic two-player strategy in a three-by-three grid.', url: '/games/tic-tac-toe/', record: { label: 'Player 1 wins', type: 'stat', field: 'player1Wins' }, gameModes: ['Two Players'] },
  { id: 'checkers', title: 'Checkers', description: 'Capture pieces, make kings, and plan your jumps.', url: '/games/checkers/', record: { label: 'Player 1 wins', type: 'stat', field: 'player1Wins' }, gameModes: ['Two Players'] },
  { id: 'connect-four', title: 'Connect Four', description: 'Drop disks and make four in a row.', url: '/games/connect-four/', record: { label: 'Player 1 wins', type: 'stat', field: 'player1Wins' }, gameModes: ['Two Players'] },
  { id: 'snake', title: 'Snake', description: 'Grow the snake while avoiding walls and yourself.', url: '/games/snake/', record: { label: 'High score', type: 'high' }, gameModes: ['Single Player', 'Two Players'] },
  { id: 'memory', title: 'Memory Match', description: 'Find every matching pair in the shortest time.', url: '/games/memory/', record: { label: 'Best time', type: 'low-time' }, gameModes: ['Single Player', 'Two Players'] },
  { id: 'minesweeper', title: 'Minesweeper', description: 'Clear the field without detonating a mine.', url: '/games/minesweeper/', record: { label: 'Best time', type: 'low-time' }, gameModes: ['Single Player', 'Two Players'] },
  { id: 'pong', title: 'Pong', description: 'A fast paddle duel with local and computer opponents.', url: '/games/pong/', record: { label: 'Best difference', type: 'high' }, gameModes: ['Versus Computer', 'Two Players'] },
  { id: 'battleship', title: 'Battleship', description: 'Place your fleet and outsmart the computer admiral.', url: '/games/battleship/', record: { label: 'Victories', type: 'high' }, gameModes: ['Versus Computer', 'Two Players'] }
];

GameRegistry.getGameById = function(id) {
  return this.find(game => game.id === id);
};
