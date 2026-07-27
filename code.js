'use strict';

// start of text section for typing
const typedTextSpan = document.querySelector('.typed-text');
const cursorSpan = document.querySelector('.cursor');

const textArray = [
  'a Software Engineer at Zillow',
  'a basketball enthusiast',
];
const typingDelay = 100;
const erasingDelay = 50;
const newTextDelay = 1000; // Delay between current and next text
let textArrayIndex = 0;
let charIndex = 0;

function type() {
  if (charIndex < textArray[textArrayIndex].length) {
    if (!cursorSpan.classList.contains('typing'))
      cursorSpan.classList.add('typing');
    typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
    charIndex++;
    setTimeout(type, typingDelay);
  } else {
    cursorSpan.classList.remove('typing');
    setTimeout(erase, newTextDelay);
  }
}

function erase() {
  if (charIndex > 0) {
    if (!cursorSpan.classList.contains('typing'))
      cursorSpan.classList.add('typing');
    typedTextSpan.textContent = textArray[textArrayIndex].substring(
      0,
      charIndex - 1
    );
    charIndex--;
    setTimeout(erase, erasingDelay);
  } else {
    cursorSpan.classList.remove('typing');
    textArrayIndex++;
    if (textArrayIndex >= textArray.length) textArrayIndex = 0;
    setTimeout(type, typingDelay + 1100);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // On DOM Load initiate the effect
  if (textArray.length) setTimeout(type, newTextDelay + 250);
});
document.querySelector('.navbar-nav').addEventListener('click', function (e) {
  e.preventDefault();
  if (e.target.classList.contains('nav-link')) {
    const theid = e.target.getAttribute('href');
    const id = document.querySelector(theid);
    const s1coords = id.getBoundingClientRect();
    window.scrollTo({
      left: s1coords.left + window.pageXOffset,
      top: s1coords.top + window.pageYOffset,
      behavior: 'smooth',
    });
  }
});

//reveal sections on scroll!!!!

const sections = document.querySelectorAll('.section');

sections.forEach(function (section) {
  section.classList.add('hidden');
});

const options = {
  root: null,
  threshold: 0,
};

const observer = new IntersectionObserver(function (entries, observer) {
  entries.forEach(function (e) {
    const element = e.target;

    if (e.isIntersecting) {
      element.classList.remove('hidden');
      observer.unobserve(element);
    } else {
      return;
    }
  });
}, options);

// observer.observe(section);
sections.forEach(function (section) {
  observer.observe(section);
});

