'use strict';

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderStats(data) {
  document.getElementById('stat-current').textContent = data.current.rate.toFixed(2) + '%';
  document.getElementById('stat-current-date').textContent = 'as of ' + formatDate(data.current.date);

  if (data.year_ago) {
    document.getElementById('stat-yearago').textContent = data.year_ago.rate.toFixed(2) + '%';
    const change = data.current.rate - data.year_ago.rate;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    document.getElementById('stat-yearago-change').textContent =
      (change > 0 ? '+' : '') + change.toFixed(2) + ' pts (' + direction + ') vs today';
  }

  document.getElementById('stat-low').textContent = data.all_time_low.rate.toFixed(2) + '%';
  document.getElementById('stat-low-date').textContent = formatDate(data.all_time_low.date);

  document.getElementById('stat-high').textContent = data.all_time_high.rate.toFixed(2) + '%';
  document.getElementById('stat-high-date').textContent = formatDate(data.all_time_high.date);

  const generated = new Date(data.generated_at);
  document.getElementById('generated-at').textContent =
    ' Data snapshot generated ' + generated.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + '.';
}

function renderChart(data) {
  const ctx = document.getElementById('rate-chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.series.map((p) => p.date),
      datasets: [
        {
          label: '30-Year Fixed Rate (%)',
          data: data.series.map((p) => p.rate),
          borderColor: '#4f8bdf',
          backgroundColor: 'rgba(79, 139, 223, 0.15)',
          fill: true,
          tension: 0.15,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#e0e0e0' } },
      },
      scales: {
        x: {
          ticks: { color: '#9aa5b1', maxTicksLimit: 8 },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          ticks: { color: '#9aa5b1', callback: (v) => v + '%' },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
      },
    },
  });
}

fetch('data.json')
  .then((r) => r.json())
  .then((data) => {
    renderStats(data);
    renderChart(data);
  })
  .catch((err) => {
    document.querySelector('.content').insertAdjacentHTML(
      'afterbegin',
      '<p class="text-danger">Could not load data.json: ' + err + '</p>'
    );
  });
