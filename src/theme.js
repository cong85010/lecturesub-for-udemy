(() => {
  'use strict';
  const KEY = 'lecturesub-theme', root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; } };
  const apply = choice => {
    if (choice === 'light' || choice === 'dark') root.dataset.theme = choice; else delete root.dataset.theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      const on = button.dataset.themeChoice === choice;
      button.setAttribute('aria-checked', String(on)); button.tabIndex = on ? 0 : -1;
    });
  };
  apply(read());
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = [...document.querySelectorAll('[data-theme-choice]')];
    const choose = (choice, focus) => {
      try { localStorage.setItem(KEY, choice); } catch {}
      apply(choice);
      if (focus) buttons.find(button => button.dataset.themeChoice === choice)?.focus();
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => choose(button.dataset.themeChoice));
      button.addEventListener('keydown', event => {
        const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        choose(buttons[(index + step + buttons.length) % buttons.length].dataset.themeChoice, true);
      });
    });
    apply(read());
  });
})();
