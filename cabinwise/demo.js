'use strict';
// Standalone presentation data. No requests, credentials, storage, or vehicle commands.
const examples = Object.freeze({
  fresh: {
    battery: '72%',
    cabin: '76°F',
    charging: '7 kW',
    message:
      'Fresh sample · just now. A measured cabin temperature is separate from the requested target.',
  },
  stale: {
    battery: '72%',
    cabin: '76°F',
    charging: '7 kW',
    message:
      'Last-known sample · 25 minutes old. The vehicle is asleep; these values do not describe its current state. Reading status does not wake it.',
  },
  unavailable: {
    battery: '—',
    cabin: '—',
    charging: '—',
    message:
      'Unavailable sample · no usable reading. Battery, temperature, and charging remain unknown; missing data is not zero or off.',
  },
});
const selector = document.getElementById('reading-state');
selector.addEventListener('change', () => {
  const sample = examples[selector.value];
  if (!sample) return;
  for (const field of ['battery', 'cabin', 'charging', 'message']) {
    document.getElementById('sample-' + field).textContent = sample[field];
  }
});
