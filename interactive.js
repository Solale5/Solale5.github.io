'use strict';

/* declared up front so the command palette can reference it before the
   basketball mini-game section (further down) assigns the real function */
let openBball = function () {};

/* ---------- scroll progress bar ---------- */
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }
  document.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------- command palette (Ctrl/Cmd+K) ---------- */
(function () {
  const overlay = document.getElementById('cmdk-overlay');
  const input = document.getElementById('cmdk-input');
  const list = document.getElementById('cmdk-list');
  const trigger = document.getElementById('cmdk-trigger');
  if (!overlay || !input || !list) return;

  const commands = [
    { label: 'Go to Resume', hint: 'section', run: () => scrollToId('resume') },
    { label: 'Go to Projects', hint: 'section', run: () => scrollToId('projects') },
    { label: 'Go to About / Contact', hint: 'section', run: () => scrollToId('about') },
    { label: 'Open GitHub', hint: 'external', run: () => window.open('https://github.com/Solale5', '_blank', 'noopener') },
    {
      label: 'Open LinkedIn',
      hint: 'external',
      run: () => window.open('https://www.linkedin.com/in/solomon-a-00b67a1a3/', '_blank', 'noopener'),
    },
    { label: 'Email me', hint: 'mailto', run: () => (window.location.href = 'mailto:delen901@gmail.com') },
    {
      label: 'Try the Mortgage Rate Tracker',
      hint: 'project',
      run: () => (window.location.href = 'mortgage-rate-tracker/index.html'),
    },
    {
      label: 'View Spartan Bank (live demo)',
      hint: 'project',
      run: () => window.open('https://bankapp-cs160-group1.netlify.app/', '_blank', 'noopener'),
    },
    { label: 'Play a quick basketball shootaround', hint: 'easter egg', run: () => openBball() },
  ];

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    window.scrollTo({ left: rect.left + window.pageXOffset, top: rect.top + window.pageYOffset, behavior: 'smooth' });
  }

  let activeIndex = 0;
  let filtered = commands.slice();

  function render() {
    list.innerHTML = '';
    filtered.forEach((cmd, i) => {
      const li = document.createElement('li');
      li.textContent = cmd.label;
      const hint = document.createElement('span');
      hint.className = 'cmdk-hint';
      hint.textContent = cmd.hint;
      li.appendChild(hint);
      if (i === activeIndex) li.classList.add('active');
      li.addEventListener('click', () => {
        cmd.run();
        close();
      });
      list.appendChild(li);
    });
  }

  function filter() {
    const q = input.value.toLowerCase();
    filtered = commands.filter((c) => c.label.toLowerCase().includes(q));
    activeIndex = 0;
    render();
  }

  function open() {
    overlay.hidden = false;
    input.value = '';
    filtered = commands.slice();
    activeIndex = 0;
    render();
    setTimeout(() => input.focus(), 0);
  }

  function close() {
    overlay.hidden = true;
  }

  document.addEventListener('keydown', function (e) {
    const isK = e.key === 'k' || e.key === 'K';
    if ((e.metaKey || e.ctrlKey) && isK) {
      e.preventDefault();
      overlay.hidden ? open() : close();
      return;
    }
    if (!overlay.hidden && e.key === 'Escape') {
      close();
      return;
    }
    if (!overlay.hidden && e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      render();
    }
    if (!overlay.hidden && e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      render();
    }
    if (!overlay.hidden && e.key === 'Enter' && filtered[activeIndex]) {
      filtered[activeIndex].run();
      close();
    }
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  input.addEventListener('input', filter);
  if (trigger) trigger.addEventListener('click', open);
})();

/* ---------- basketball mini-game ---------- */
(function () {
  const trigger = document.getElementById('bball-trigger');
  const overlay = document.getElementById('bball-overlay');
  const closeBtn = document.getElementById('bball-close');
  const canvas = document.getElementById('bball-canvas');
  const scoreEl = document.getElementById('bball-score');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const hoop = { x: W * 0.72, y: 90, width: 60 };
  const ballStart = { x: W * 0.5, y: H - 40 };
  let score = 0;
  let animating = false;
  let message = '';

  function drawScene() {
    ctx.clearRect(0, 0, W, H);

    // backboard
    ctx.fillStyle = '#3a4250';
    ctx.fillRect(hoop.x - 45, 30, 90, 55);

    // rim
    ctx.strokeStyle = '#e2622a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(hoop.x, hoop.y, hoop.width / 2, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // net hint
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(hoop.x + i * (hoop.width / 2 - 4), hoop.y);
      ctx.lineTo(hoop.x + i * (hoop.width / 4), hoop.y + 24);
      ctx.stroke();
    }

    if (message) {
      ctx.fillStyle = '#4f8bdf';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(message, W / 2, H / 2);
    }
  }

  function drawBall(x, y) {
    ctx.fillStyle = '#e2622a';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a0e14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  function reset() {
    message = '';
    drawScene();
    drawBall(ballStart.x, ballStart.y);
  }

  function shoot(targetX, targetY) {
    if (animating) return;
    animating = true;
    const start = performance.now();
    const duration = 550;
    const peakLift = Math.min(180, 60 + Math.abs(targetX - ballStart.x) * 0.3);

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const x = ballStart.x + (targetX - ballStart.x) * t;
      const straightY = ballStart.y + (targetY - ballStart.y) * t;
      const arc = Math.sin(Math.PI * t) * peakLift;
      const y = straightY - arc;

      drawScene();
      drawBall(x, y);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        const scored = Math.abs(targetX - hoop.x) < hoop.width / 2 && targetY < hoop.y + 40;
        if (scored) {
          score++;
          scoreEl.textContent = String(score);
          message = 'Swish! 🔥';
        } else {
          message = 'Off the rim';
        }
        drawScene();
        setTimeout(reset, 700);
        animating = false;
      }
    }
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('click', function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    shoot(x, y);
  });

  openBball = function () {
    overlay.hidden = false;
    reset();
  };

  function close() {
    overlay.hidden = true;
  }

  if (trigger) trigger.addEventListener('click', openBball);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!overlay.hidden && e.key === 'Escape') close();
  });
})();

/* ---------- konami code easter egg ---------- */
(function () {
  const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let progress = 0;
  const toast = document.getElementById('konami-toast');

  document.addEventListener('keydown', function (e) {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === sequence[progress]) {
      progress++;
      if (progress === sequence.length) {
        progress = 0;
        triggerEasterEgg();
      }
    } else {
      progress = key === sequence[0] ? 1 : 0;
    }
  });

  function triggerEasterEgg() {
    confettiBurst();
    if (toast) {
      toast.textContent = '🏀 Nice combo! Thanks for reading the source.';
      toast.hidden = false;
      setTimeout(() => {
        toast.hidden = true;
      }, 3200);
    }
  }

  function confettiBurst() {
    const colors = ['#4f8bdf', '#a9c9f5', '#e2622a', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      const duration = 1.8 + Math.random() * 1.4;
      piece.style.transition = 'transform ' + duration + 's linear, top ' + duration + 's ease-in';
      document.body.appendChild(piece);
      requestAnimationFrame(function () {
        piece.style.top = '105vh';
        piece.style.transform = 'rotate(' + (Math.random() * 720 - 360) + 'deg)';
      });
      setTimeout(function () {
        piece.remove();
      }, duration * 1000 + 100);
    }
  }
})();
