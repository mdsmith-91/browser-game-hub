const Storage = {
  prefix: 'bgh_',
  statsVersion: 2,
  statsDefaults: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    timePlayed: 0
  },
  gameStatsDefaults: {
    blackjack: { blackjacks: 0 },
    'crazy-eights': { bestWinStreak: 0, currentWinStreak: 0 },
    'go-fish': { booksWon: 0, bestBooks: 0 }
  },

  scoreKey(gameId) {
    return `${this.prefix}${gameId}_highscore`;
  },

  statsKey(gameId) {
    return `${this.prefix}${gameId}_stats`;
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

  normalizeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  },

  normalizeStats(value, gameId) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const defaults = { ...this.statsDefaults, ...(this.gameStatsDefaults[gameId] || {}) };
    return Object.keys(defaults).reduce((stats, key) => {
      stats[key] = this.normalizeNumber(source[key]);
      return stats;
    }, {});
  },

  migrateStats(value, gameId) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    if (source._version === this.statsVersion) return this.normalizeStats(source, gameId);
    const stats = this.normalizeStats(source, gameId);
    if (gameId !== 'minesweeper') {
      stats.gamesPlayed += this.normalizeNumber(source.multiplayerMatches);
      stats.wins += this.normalizeNumber(source.player1Wins);
      stats.losses += this.normalizeNumber(source.player2Wins);
    } else stats.draws = 0;
    return stats;
  },

  getStats(gameId) {
    try {
      const data = localStorage.getItem(this.statsKey(gameId));
      if (!data) return this.normalizeStats({}, gameId);
      const source = JSON.parse(data);
      const stats = this.migrateStats(source, gameId);
      if (source?._version !== this.statsVersion) this.saveStats(gameId, stats);
      return stats;
    } catch (error) {
      console.warn('Failed to read stats:', error);
      return this.normalizeStats({}, gameId);
    }
  },

  saveStats(gameId, stats) {
    const normalized = this.normalizeStats(stats, gameId);
    try {
      localStorage.setItem(this.statsKey(gameId), JSON.stringify({ ...normalized, _version: this.statsVersion }));
    } catch (error) {
      console.warn('Failed to save stats:', error);
    }
    return normalized;
  },

  recordResult(gameId, result) {
    if (!['win', 'loss', 'draw', 'complete'].includes(result)) return this.getStats(gameId);
    const stats = this.getStats(gameId);
    stats.gamesPlayed++;
    if (result === 'win') stats.wins++;
    else if (result === 'loss') stats.losses++;
    else if (result === 'draw') stats.draws++;
    return this.saveStats(gameId, stats);
  },

  recordGameResult(gameId, result, metrics = {}) {
    if (!['win', 'loss', 'draw', 'complete'].includes(result)) return this.getStats(gameId);
    const stats = this.getStats(gameId);
    stats.gamesPlayed++;
    if (result === 'win') stats.wins++;
    else if (result === 'loss') stats.losses++;
    else if (result === 'draw') stats.draws++;
    const allowed = Object.keys(this.gameStatsDefaults[gameId] || {});
    allowed.forEach(key => {
      if (key === 'bestBooks' || key === 'bestWinStreak' || key === 'blackjacks') return;
      stats[key] += this.normalizeNumber(metrics[key]);
    });
    if (gameId === 'blackjack' && metrics.blackjack) stats.blackjacks++;
    if (gameId === 'crazy-eights') {
      stats.currentWinStreak = result === 'win' ? stats.currentWinStreak + 1 : 0;
      stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
    }
    if (gameId === 'go-fish') stats.bestBooks = Math.max(stats.bestBooks, this.normalizeNumber(metrics.books));
    return this.saveStats(gameId, stats);
  },

  updateStats(gameId, won = false) {
    return this.recordResult(gameId, won ? 'win' : 'loss');
  },

  updateMultiplayerStats(gameId, result) {
    if (!['player1', 'player2', 'draw'].includes(result)) return this.getStats(gameId);
    return this.recordResult(gameId, result === 'player1' ? 'win' : result === 'player2' ? 'loss' : 'draw');
  },

  addTimePlayed(gameId, seconds) {
    const elapsed = this.normalizeNumber(seconds);
    if (!elapsed) return this.getStats(gameId);
    const stats = this.getStats(gameId);
    stats.timePlayed += elapsed;
    return this.saveStats(gameId, stats);
  },

  createPlayTimer(gameId) {
    let active = false;
    let running = false;
    let startedAt = 0;
    let elapsedMs = 0;
    const now = () => typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const pageVisible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';
    const pause = () => {
      if (!running) return;
      elapsedMs += Math.max(0, now() - startedAt);
      running = false;
    };
    const resume = () => {
      if (!active || running || !pageVisible()) return;
      startedAt = now();
      running = true;
    };
    const visibilityChange = () => pageVisible() && active ? resume() : pause();
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visibilityChange);

    return {
      start() {
        active = true;
        resume();
      },
      stop() {
        active = false;
        pause();
        const seconds = Math.floor(elapsedMs / 1000);
        elapsedMs -= seconds * 1000;
        if (seconds) Storage.addTimePlayed(gameId, seconds);
        return seconds;
      },
      reset() {
        this.stop();
        elapsedMs = 0;
      },
      destroy() {
        this.stop();
        if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibilityChange);
      }
    };
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

try {
  ['bgh_battleship_highscore', 'bgh_pong_highscore'].forEach(key => localStorage.removeItem(key));
} catch (error) {
  console.warn('Failed to remove obsolete records:', error);
}
