'use strict';

// start of text section for typing
const typedTextSpan = document.querySelector('.typed-text');
const cursorSpan = document.querySelector('.cursor');

const textArray = [
  'a computer science major at SJSU',
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
//my first very inefficient way of doing smooth scroll
// //select links in navbar and store in nodelist
// const resumeScroll = document.querySelectorAll('.navbar-nav a');

// //select resume section
// const resume = document.querySelector('#resume');
// //select project section
// const projects = document.querySelector('#projects');
// //select about section
// const about = document.querySelector('#about');
// // store links from three sections in nodelist
// const resumeLink = resumeScroll[0];
// const projectLink = resumeScroll[1];
// const aboutLink = resumeScroll[2];
// console.log(aboutLink);

// resumeLink.addEventListener('click', function () {
//   const s1coords = resume.getBoundingClientRect();
//   window.scrollTo({
//     left: s1coords.left + window.pageXOffset,
//     top: s1coords.top + window.pageYOffset,
//     behavior: 'smooth',
//   });
// });

// projectLink.addEventListener('click', function () {
//   const s1coords = projects.getBoundingClientRect();
//   window.scrollTo({
//     left: s1coords.left + window.pageXOffset,
//     top: s1coords.top + window.pageYOffset,
//     behavior: 'smooth',
//   });
// });
// aboutLink.addEventListener('click', function () {
//   const s1coords = about.getBoundingClientRect();
//   window.scrollTo({
//     left: s1coords.left + window.pageXOffset,
//     top: s1coords.top + window.pageYOffset,
//     behavior: 'smooth',
//   });
// });
//best practice smooth scroll implementation
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

const container = document.querySelector('.qoute');

//adds quote to page
let i = 1;
const quoteAddToPage = function (string, author) {
  let html = `<p class="thetext${i}">"${string}" - ${author}</p>`;
  container.insertAdjacentHTML('beforeend', html);
};

//runs app
const doIt = function () {
  // get quote data using quote api
  fetch(`https://api.quotable.io/random`)
    .then(function (response) {
      //   console.log(response);
      return response.json(); //using the json method returns a new Promise so we call then method again
    })
    .then(function (data) {
      //   const random = Math.floor(Math.random() * 10);

      let quote = data.content;
      let author = data.author;
      quoteAddToPage(quote, author);
    });
};
document.querySelector('.bt').addEventListener('click', function () {
  doIt();
  i++;
  document.querySelector(`.thetext${i - 1}`).remove();
});
doIt();
