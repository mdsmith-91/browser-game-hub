const GameUI = (() => {
  let activeModal = null;
  let escapeHandler = null;

  function clearGameOver() {
    if (escapeHandler) document.removeEventListener('keydown', escapeHandler);
    if (activeModal) activeModal.remove();
    activeModal = null;
    escapeHandler = null;
  }

  function showGameOver({ title, message = '', restartLabel = 'Play Again', onRestart }) {
    clearGameOver();

    const modal = document.createElement('div');
    const content = document.createElement('div');
    const heading = document.createElement('h2');
    const description = document.createElement('p');
    const button = document.createElement('button');

    modal.className = 'game-over-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'game-over-title');
    modal.setAttribute('aria-describedby', 'game-over-description');
    content.className = 'modal-content';
    heading.id = 'game-over-title';
    heading.textContent = title;
    description.id = 'game-over-description';
    description.textContent = message;
    button.type = 'button';
    button.className = 'game-btn btn-primary';
    button.textContent = restartLabel;

    const restart = () => {
      clearGameOver();
      onRestart();
    };

    button.addEventListener('click', restart);
    escapeHandler = event => {
      if (event.key === 'Escape') restart();
      if (event.key === 'Tab') {
        event.preventDefault();
        button.focus();
      }
    };
    document.addEventListener('keydown', escapeHandler);

    content.append(heading, description, button);
    modal.appendChild(content);
    document.body.appendChild(modal);
    activeModal = modal;
    button.focus();
  }

  return { clearGameOver, showGameOver };
})();
