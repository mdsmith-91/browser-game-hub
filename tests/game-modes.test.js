const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function createHarness(ids, values = {}) {
  const timers = new Map();
  let nextTimer = 1;
  const documentListeners = {};

  class ClassList {
    constructor(element) { this.element = element; }
    contains(name) { return this.element.classes.has(name); }
    add(...names) { names.forEach(name => this.element.classes.add(name)); }
    remove(...names) { names.forEach(name => this.element.classes.delete(name)); }
    toggle(name, force) {
      const enabled = force === undefined ? !this.contains(name) : force;
      if (enabled) this.add(name); else this.remove(name);
      return enabled;
    }
  }

  class Element {
    constructor(tag = 'div', id = '') {
      this.tagName = tag.toUpperCase();
      this.id = id;
      this.children = [];
      this.classes = new Set();
      this.classList = new ClassList(this);
      this.dataset = {};
      this.style = {};
      this.attributes = {};
      this.listeners = {};
      this.textContent = '';
      this.value = values[id] || '';
      this.hidden = false;
      this.disabled = false;
    }
    set className(value) { this.classes = new Set(String(value).split(/\s+/).filter(Boolean)); }
    get className() { return [...this.classes].join(' '); }
    set innerHTML(value) { if (value === '') this.children = []; }
    get innerHTML() { return ''; }
    appendChild(child) { this.children.push(child); return child; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
    dispatch(name, event = {}) { (this.listeners[name] || []).forEach(listener => listener({ currentTarget: this, target: this, preventDefault() {}, ...event })); }
    click() { if (!this.disabled) { if (this.onclick) this.onclick(); this.dispatch('click'); } }
    focus() { document.activeElement = this; }
    descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
    querySelectorAll(selector) { return this.descendants().filter(element => matches(element, selector)); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }

  function matches(element, selector) {
    if (selector === 'button') return element.tagName === 'BUTTON';
    if (selector.startsWith('.')) return element.classList.contains(selector.slice(1));
    return false;
  }

  const elements = Object.fromEntries(ids.map(id => [id, new Element('div', id)]));
  elements['mode-select'] && (elements['mode-select'].tagName = 'SELECT');
  elements['promotion-dialog']?.appendChild(Object.assign(new Element('div'), { className: 'promotion-choices' }));

  const document = {
    activeElement: null,
    readyState: 'loading',
    visibilityState: 'visible',
    createElement: tag => new Element(tag),
    getElementById: id => elements[id] || null,
    addEventListener: (name, listener) => { (documentListeners[name] ||= []).push(listener); },
    removeEventListener() {},
    querySelectorAll(selector) {
      if (selector === '.restart-btn') return [];
      if (selector === '#game-board .cell') return (elements['game-board']?.descendants() || []).filter(item => item.classList.contains('cell'));
      if (selector === '.cell') return Object.values(elements).flatMap(element => element.descendants()).filter(item => item.classList.contains('cell'));
      return [];
    },
    querySelector() { return null; }
  };

  const stats = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, timePlayed: 0 };
  const Storage = {
    createPlayTimer: () => ({ start() {}, stop() {}, reset() {} }),
    getStats: () => ({ ...stats }),
    recordResult(game, result) {
      stats.gamesPlayed++;
      if (result === 'win') stats.wins++;
      if (result === 'loss') stats.losses++;
      if (result === 'draw') stats.draws++;
    }
  };
  const GameUI = { clearGameOver() {}, showGameOver(options) { this.last = options; } };
  const window = { addEventListener() {} };
  const sandbox = {
    console,
    document,
    window,
    Storage,
    GameUI,
    Math,
    setTimeout(callback) { const id = nextTimer++; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  window.window = window;
  window.document = document;

  return {
    sandbox,
    elements,
    stats,
    start(file) {
      vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
      (documentListeners.DOMContentLoaded || []).forEach(listener => listener());
    },
    flushTimers(limit = 20) {
      let count = 0;
      while (timers.size && count++ < limit) {
        const callbacks = [...timers.values()];
        timers.clear();
        callbacks.forEach(callback => callback());
      }
      assert(count <= limit, 'Timer queue did not settle.');
    }
  };
}

{
  const harness = createHarness(
    ['backToHub', 'game-board', 'mode-select', 'turn-indicator', 'games-played', 'wins', 'losses', 'draws', 'time-played'],
    { 'mode-select': 'computer' }
  );
  harness.start('games/tic-tac-toe/game.js');
  harness.elements['game-board'].children[0].click();
  harness.flushTimers();
  const marks = harness.elements['game-board'].children.map(cell => cell.textContent).filter(Boolean);
  assert.deepStrictEqual(marks.sort(), ['O', 'X'], 'Tic-Tac-Toe AI should make one legal reply.');
  assert.strictEqual(harness.elements['turn-indicator'].textContent, 'Player 1 (X)');
  harness.elements['mode-select'].value = 'two';
  harness.elements['mode-select'].dispatch('change');
  for (const index of [0, 3, 1, 4, 2]) harness.elements['game-board'].children[index].click();
  assert.deepStrictEqual(harness.stats, { gamesPlayed: 1, wins: 1, losses: 0, draws: 0, timePlayed: 0 }, 'A completed local match should record one Player 1 win.');
  harness.sandbox.window.restartGame();
  assert.strictEqual(harness.stats.gamesPlayed, 1, 'A rematch must not record an extra result.');
}

{
  const harness = createHarness(
    ['backToHub', 'game-board', 'mode-select', 'turn-indicator', 'games-played', 'wins', 'losses', 'draws', 'time-played'],
    { 'mode-select': 'computer' }
  );
  harness.start('games/connect-four/game.js');
  harness.elements['game-board'].children[0].click();
  harness.flushTimers();
  const disks = harness.elements['game-board'].descendants().filter(element => element.classList.contains('piece'));
  assert.strictEqual(disks.length, 2, 'Connect Four AI should drop exactly one legal reply.');
  assert(disks.some(disk => disk.classList.contains('red')) && disks.some(disk => disk.classList.contains('yellow')));
  assert.strictEqual(harness.elements['turn-indicator'].textContent, 'Player 1 (Red)');
}

{
  const harness = createHarness(
    ['backToHub', 'game-board', 'mode-select', 'turn-indicator', 'red-captures', 'white-captures', 'red-pieces', 'white-pieces', 'games-played', 'wins', 'losses', 'draws', 'time-played'],
    { 'mode-select': 'computer' }
  );
  harness.start('games/checkers/game.js');
  const before = harness.elements['game-board'].children.map(cell => cell.getAttribute('aria-label'));
  harness.elements['game-board'].children[5 * 8].click();
  harness.elements['game-board'].children[4 * 8 + 1].click();
  harness.flushTimers();
  const after = harness.elements['game-board'].children.map(cell => cell.getAttribute('aria-label'));
  assert.notDeepStrictEqual(after, before, 'Checkers board should change after the player and AI moves.');
  assert.strictEqual(harness.elements['turn-indicator'].textContent, 'Player 1 (Red)');
}

{
  const harness = createHarness(
    ['backToHub', 'chess-board', 'mode-select', 'turn-indicator', 'chess-status', 'games-played', 'wins', 'losses', 'draws', 'time-played', 'promotion-dialog'],
    { 'mode-select': 'computer' }
  );
  harness.start('games/chess/game.js');
  const before = harness.elements['chess-board'].children.map(cell => cell.getAttribute('aria-label'));
  harness.elements['chess-board'].children[6 * 8 + 4].click();
  harness.elements['chess-board'].children[4 * 8 + 4].click();
  harness.flushTimers();
  const after = harness.elements['chess-board'].children.map(cell => cell.getAttribute('aria-label'));
  assert.notDeepStrictEqual(after, before, 'Chess board should change after the player and AI moves.');
  assert.strictEqual(harness.elements['turn-indicator'].textContent, 'Player 1 (White)');
  assert.strictEqual(harness.elements['chess-board'].children.length, 64);
}

console.log('game mode tests passed');
