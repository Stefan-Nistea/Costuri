/**
 * UI MODULE — Visual-only helpers and enhancements that do not affect
 * business logic. Includes responsiveness tweaks, layout corrections
 * and small interaction improvements.
 */
 
 
/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The input string.
 *
 * @returns {string} The capitalized string.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/* ================================================
 * GLOBAL UI — PAGE ZOOM CONTROL (CTRL + SCROLL)
 * ================================================ */

/**
 * Allows zooming the entire page content via Ctrl + scroll.
 * Uses a transform scale on #zoomWrapper for smooth resizing.
 * 
 * - Ctrl + scroll up   → Zoom in
 * - Ctrl + scroll down → Zoom out (min 50%)
 * - Ctrl + 0           → Reset zoom to 100%
 */

let zoomLevel = 1;

/**
 * Applies the current zoom level to the wrapper container.
 */
function applyZoom() {
  const wrapper = document.getElementById('zoomWrapper');
  if (wrapper) wrapper.style.transform = `scale(${zoomLevel})`;
}

// Ctrl + scroll → zoom in/out
window.addEventListener('wheel', function (e) {
  if (!e.ctrlKey) return; // Only active when Ctrl is held
  e.preventDefault();     // Prevent browser's native zoom

  zoomLevel += (e.deltaY < 0 ? 0.05 : -0.05);
  zoomLevel = Math.max(0.5, zoomLevel); // Limit minimum zoom
  applyZoom();
}, { passive: false });

// Ctrl + 0 → reset zoom
window.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === '0') {
    zoomLevel = 1;
    applyZoom();
    e.preventDefault();
  }
});

/**
 * Adds or removes a `.scrolled` CSS class when
 * the daily transactions table is scrolled vertically.
 * Used to apply subtle shadow or styling effects
 * to the fixed table header on the Zilnic page.
 */
document.addEventListener('scroll', e => {
  const container = document.querySelector('#zilnicTableContainer');
  if (!container) return;
  if (container.scrollTop > 5) container.classList.add('scrolled');
  else container.classList.remove('scrolled');
}, true);