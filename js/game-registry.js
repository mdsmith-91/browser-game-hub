const GameRegistry = [
  { id: 'tic-tac-toe', title: 'Tic-Tac-Toe', description: 'Classic two-player strategy in a three-by-three grid.', icon: 'X/O', url: '/games/tic-tac-toe/', record: { label: 'Player 1 wins', type: 'stat', field: 'player1Wins' }, singlePlayer: false, localMultiplayer: true, aiOpponent: false, playerCount: '2', gameModes: ['Two Players'] },
  { id: 'checkers', title: 'Checkers', description: 'Capture pieces, make kings, and plan your jumps.', icon: 'Checkers', url: '/games/checkers/', record: { label: 'Player 1 wins', type: 'stat', field: 'player1Wins' }, singlePlayer: false, localMultiplayer: true, aiOpponent: false, playerCount: '2', gameModes: ['Two Players'] },
  { id: 'connect-four', title: 'Connect Four', description: 'Drop disks and make four in a row.', icon: '4', url: '/games/connect-four/', record: { label: 'Player 1 wins', type: 'stat', field: 'player1Wins' }, singlePlayer: false, localMultiplayer: true, aiOpponent: false, playerCount: '2', gameModes: ['Two Players'] },
  { id: 'snake', title: 'Snake', description: 'Grow the snake while avoiding walls and yourself.', icon: 'Snake', url: '/games/snake/', record: { label: 'High score', type: 'high' }, singlePlayer: true, localMultiplayer: true, aiOpponent: false, playerCount: '1-2', gameModes: ['Single Player', 'Two Players'] },
  { id: 'memory', title: 'Memory Match', description: 'Find every matching pair in the shortest time.', icon: 'Cards', url: '/games/memory/', record: { label: 'Best time', type: 'low-time' }, singlePlayer: true, localMultiplayer: true, aiOpponent: false, playerCount: '1-2', gameModes: ['Single Player', 'Two Players'] },
  { id: 'minesweeper', title: 'Minesweeper', description: 'Clear the field without detonating a mine.', icon: 'Mine', url: '/games/minesweeper/', record: { label: 'Best time', type: 'low-time' }, singlePlayer: true, localMultiplayer: true, aiOpponent: false, playerCount: '1-2', gameModes: ['Single Player', 'Two Players'] },
  { id: 'pong', title: 'Pong', description: 'A fast paddle duel with local and computer opponents.', icon: 'Pong', url: '/games/pong/', record: { label: 'Best difference', type: 'high' }, singlePlayer: true, localMultiplayer: true, aiOpponent: true, playerCount: '1-2', gameModes: ['Versus Computer', 'Two Players'] },
  { id: 'battleship', title: 'Battleship', description: 'Place your fleet and outsmart the computer admiral.', icon: 'Fleet', url: '/games/battleship/', record: { label: 'Victories', type: 'high' }, singlePlayer: true, localMultiplayer: true, aiOpponent: true, playerCount: '1-2', gameModes: ['Versus Computer', 'Two Players'] }
];

GameRegistry.getGameById = function(id) {
  return this.find(game => game.id === id);
};
