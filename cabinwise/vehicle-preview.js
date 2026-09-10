// Presentation only. Load local 3D assets near the viewport; no vehicle APIs.
let renderer;
const stages = document.querySelectorAll('.cw-model-stage');
async function loadPreview(stage) {
  const status = stage.querySelector('.cw-model-status');
  const reset = stage.parentElement.querySelector('.cw-model-reset');
  status.textContent = 'Loading Model 3 preview…';
  const timeout = setTimeout(() => {
    status.textContent =
      'The 3D model is taking longer to load. You can keep reading below.';
  }, 30000);
  try {
    renderer ||= import('./vendor/model-viewer.min.js');
    await renderer;
    const viewer = document.createElement('model-viewer');
    const attrs = {
      src: stage.dataset.modelSrc,
      alt: 'Model 3 Highland. Drag or use arrow keys to rotate the 3D preview.',
      loading: 'eager',
      reveal: 'auto',
      'camera-controls': '',
      'touch-action': 'pan-y',
      'camera-orbit': '35deg 75deg 85%',
      'field-of-view': '30deg',
      'min-camera-orbit': 'auto 35deg 75%',
      'max-camera-orbit': 'auto 90deg 160%',
      'shadow-intensity': '1',
      'shadow-softness': '1',
      exposure: '1',
      'interaction-prompt': 'none',
      'disable-pan': '',
    };
    for (const [key, value] of Object.entries(attrs))
      viewer.setAttribute(key, value);
    viewer.addEventListener(
      'load',
      () => {
        clearTimeout(timeout);
        status.hidden = true;
        reset.disabled = false;
      },
      { once: true },
    );
    viewer.addEventListener('error', () => {
      clearTimeout(timeout);
      status.hidden = false;
      status.textContent =
        '3D preview unavailable. Reload the page to try again.';
      reset.disabled = true;
    });
    reset.addEventListener('click', () => {
      viewer.cameraOrbit = attrs['camera-orbit'];
      viewer.fieldOfView = '30deg';
      viewer.jumpCameraToGoal();
    });
    stage.append(viewer);
  } catch {
    clearTimeout(timeout);
    status.textContent =
      '3D preview unavailable. Reload the page to try again.';
  }
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          loadPreview(entry.target);
        }
    },
    { rootMargin: '200px' },
  );
  stages.forEach(stage => observer.observe(stage));
} else stages.forEach(loadPreview);
