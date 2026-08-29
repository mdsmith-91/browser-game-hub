const Storage = {
  statsDefaults: { gamesPlayed: 0, wins: 0, losses: 0, multiplayerMatches: 0, player1Wins: 0, player2Wins: 0, draws: 0 },
  getHighScore(gameId) {
    try { const score = Number.parseInt(localStorage.getItem(`bgh_${gameId}_highscore`), 10); return Number.isFinite(score) ? score : null; } catch (error) { console.warn('Failed to read high score:', error); return null; }
  },
  saveHighScore(gameId, score) {
    if (!Number.isFinite(score)) return false;
    try { const current = this.getHighScore(gameId); if (current === null || score > current) { localStorage.setItem(`bgh_${gameId}_highscore`, String(score)); return true; } } catch (error) { console.warn('Failed to save high score:', error); }
    return false;
  },
  getBestScore(gameId) { return this.getHighScore(`${gameId}_best`); },
  saveBestScore(gameId, score) {
    if (!Number.isFinite(score)) return false;
    try { const current = this.getBestScore(gameId); if (current === null || score < current) { localStorage.setItem(`bgh_${gameId}_best_highscore`, String(score)); return true; } } catch (error) { console.warn('Failed to save best score:', error); }
    return false;
  },
  normalizeStats(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.keys(this.statsDefaults).reduce((stats, key) => { const number = Number(source[key]); stats[key] = Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0; return stats; }, {});
  },
  getStats(gameId) {
    try { const data = localStorage.getItem(`bgh_${gameId}_stats`); return this.normalizeStats(data ? JSON.parse(data) : {}); } catch (error) { console.warn('Failed to read stats:', error); return this.normalizeStats({}); }
  },
  saveStats(gameId, stats) { const normalized = this.normalizeStats(stats); localStorage.setItem(`bgh_${gameId}_stats`, JSON.stringify(normalized)); return normalized; },
  updateStats(gameId, won = false) {
    try { const stats = this.getStats(gameId); stats.gamesPlayed++; if (won) stats.wins++; else stats.losses++; return this.saveStats(gameId, stats); } catch (error) { console.warn('Failed to update stats:', error); return this.normalizeStats({}); }
  },
  updateMultiplayerStats(gameId, result) {
    try { const stats = this.getStats(gameId); stats.multiplayerMatches++; if (result === 'player1') stats.player1Wins++; else if (result === 'player2') stats.player2Wins++; else if (result === 'draw') stats.draws++; return this.saveStats(gameId, stats); } catch (error) { console.warn('Failed to update multiplayer stats:', error); return this.normalizeStats({}); }
  },
  clearAll() {
    try { Object.keys(localStorage).filter(key => key.startsWith('bgh_')).forEach(key => localStorage.removeItem(key)); return true; } catch (error) { console.warn('Failed to clear storage:', error); return false; }
  }
};
