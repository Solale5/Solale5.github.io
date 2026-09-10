'use strict';
const menuButton = document.getElementById('menu-toggle');
const siteLinks = document.getElementById('site-links');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  siteLinks.classList.toggle('is-open', open);
});
siteLinks.addEventListener('click', event => {
  if (event.target.closest('a')) {
    menuButton.setAttribute('aria-expanded', 'false');
    siteLinks.classList.remove('is-open');
  }
});
document.addEventListener('keydown', event => {
  if (
    event.key === 'Escape' &&
    menuButton.getAttribute('aria-expanded') === 'true'
  ) {
    menuButton.setAttribute('aria-expanded', 'false');
    siteLinks.classList.remove('is-open');
    menuButton.focus();
  }
});
