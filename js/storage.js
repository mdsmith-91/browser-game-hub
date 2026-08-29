const Storage = {
  prefix: 'bgh_',
  statsDefaults: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    multiplayerMatches: 0,
    player1Wins: 0,
    player2Wins: 0,
    draws: 0
  },

  scoreKey(gameId) {
    return `${this.prefix}${gameId}_highscore`;
  },

  getHighScore(gameId) {
    try {
      const saved = localStorage.getItem(this.scoreKey(gameId));
      if (saved === null || saved.trim() === '') return null;
      const score = Number(saved);
      return Number.isFinite(score) && score >= 0 ? Math.floor(score) : null;
    } catch (error) {
      console.warn('Failed to read high score:', error);
      return null;
    }
  },

  saveHighScore(gameId, score) {
    if (!Number.isFinite(score) || score < 0) return false;
    const normalized = Math.floor(score);
    try {
      const current = this.getHighScore(gameId);
      if (current === null || normalized > current) {
        localStorage.setItem(this.scoreKey(gameId), String(normalized));
        return true;
      }
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
    return false;
  },

  getBestScore(gameId) {
    return this.getHighScore(`${gameId}_best`);
  },

  saveBestScore(gameId, score) {
    if (!Number.isFinite(score) || score < 0) return false;
    const normalized = Math.floor(score);
    try {
      const current = this.getBestScore(gameId);
      if (current === null || normalized < current) {
        localStorage.setItem(this.scoreKey(`${gameId}_best`), String(normalized));
        return true;
      }
    } catch (error) {
      console.warn('Failed to save best score:', error);
    }
    return false;
  },

  normalizeStats(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.keys(this.statsDefaults).reduce((stats, key) => {
      const number = Number(source[key]);
      stats[key] = Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
      return stats;
    }, {});
  },

  getStats(gameId) {
    try {
      const data = localStorage.getItem(`${this.prefix}${gameId}_stats`);
      return this.normalizeStats(data ? JSON.parse(data) : {});
    } catch (error) {
      console.warn('Failed to read stats:', error);
      return this.normalizeStats({});
    }
  },

  saveStats(gameId, stats) {
    const normalized = this.normalizeStats(stats);
    try {
      localStorage.setItem(`${this.prefix}${gameId}_stats`, JSON.stringify(normalized));
    } catch (error) {
      console.warn('Failed to save stats:', error);
    }
    return normalized;
  },

  updateStats(gameId, won = false) {
    const stats = this.getStats(gameId);
    stats.gamesPlayed++;
    if (won) stats.wins++;
    else stats.losses++;
    return this.saveStats(gameId, stats);
  },

  updateMultiplayerStats(gameId, result) {
    if (!['player1', 'player2', 'draw'].includes(result)) return this.getStats(gameId);
    const stats = this.getStats(gameId);
    stats.multiplayerMatches++;
    if (result === 'player1') stats.player1Wins++;
    else if (result === 'player2') stats.player2Wins++;
    else stats.draws++;
    return this.saveStats(gameId, stats);
  },

  clearAll() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.warn('Failed to clear storage:', error);
      return false;
    }
  }
};
