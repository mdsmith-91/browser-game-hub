const Storage = {
  getHighScore(gameId) {
    try {
      const score = localStorage.getItem(`bgh_${gameId}_highscore`);
      const parsed = Number.parseInt(score, 10);
      return Number.isFinite(parsed) ? parsed : null;
    } catch (e) {
      console.warn('Failed to read high score:', e);
      return null;
    }
  },
  
  saveHighScore(gameId, score) {
    try {
      const current = this.getHighScore(gameId);
      if (current === null || score > current) {
        localStorage.setItem(`bgh_${gameId}_highscore`, score);
        return true; // New record
      }
      return false;
    } catch (e) {
      console.warn('Failed to save high score:', e);
      return false;
    }
  },

  getBestScore(gameId) {
    return this.getHighScore(`${gameId}_best`);
  },

  saveBestScore(gameId, score) {
    try {
      const current = this.getBestScore(gameId);
      if (current === null || score < current) {
        localStorage.setItem(`bgh_${gameId}_best_highscore`, score);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to save best score:', e);
      return false;
    }
  },
  
  getStats(gameId) {
    try {
      const data = localStorage.getItem(`bgh_${gameId}_stats`);
      const parsed = data ? JSON.parse(data) : {};
      return {
        gamesPlayed: Number.isFinite(parsed.gamesPlayed) ? parsed.gamesPlayed : 0,
        wins: Number.isFinite(parsed.wins) ? parsed.wins : 0
      };
    } catch (e) {
      console.warn('Failed to read stats:', e);
      return { gamesPlayed: 0, wins: 0 };
    }
  },
  
  updateStats(gameId, win = false) {
    try {
      const stats = this.getStats(gameId);
      stats.gamesPlayed += 1;
      if (win) stats.wins += 1;
      localStorage.setItem(`bgh_${gameId}_stats`, JSON.stringify(stats));
      return stats;
    } catch (e) {
      console.warn('Failed to update stats:', e);
      return { gamesPlayed: 0, wins: 0 };
    }
  },

  updateMultiplayerStats(gameId, result) {
    try {
      const stats = this.getStats(gameId);
      stats.multiplayerMatches = (Number.isFinite(stats.multiplayerMatches) ? stats.multiplayerMatches : 0) + 1;
      if (result === 'player1') stats.player1Wins = (Number.isFinite(stats.player1Wins) ? stats.player1Wins : 0) + 1;
      if (result === 'player2') stats.player2Wins = (Number.isFinite(stats.player2Wins) ? stats.player2Wins : 0) + 1;
      if (result === 'draw') stats.draws = (Number.isFinite(stats.draws) ? stats.draws : 0) + 1;
      localStorage.setItem(`bgh_${gameId}_stats`, JSON.stringify(stats));
      return stats;
    } catch (e) {
      console.warn('Failed to update multiplayer stats:', e);
      return { gamesPlayed: 0, wins: 0 };
    }
  },
  
  clearAll() {
    try {
      Object.keys(localStorage).filter(key => key.startsWith('bgh_')).forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.warn('Failed to clear storage:', e);
      return false;
    }
  }
};

if (window.location.pathname.startsWith('/games/')) {
  if (!document.title.includes('Alt Tab Tavern')) {
    document.title = `${document.title} | Alt Tab Tavern`;
  }

  const backToHub = document.getElementById('backToHub');
  if (backToHub) {
    backToHub.textContent = '← Back to Alt Tab Tavern';
  }
}
