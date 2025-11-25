/**
 * Force cleanup of any lingering modal states
 * Useful for ensuring UI remains interactive after modal operations
 */
export const forceModalCleanup = () => {
  // Remove any pointer-events blocks
  document.body.style.removeProperty('pointer-events');
  document.documentElement.style.removeProperty('pointer-events');
  
  // Remove any inert attributes
  const root = document.getElementById('root');
  if (root) {
    root.removeAttribute('inert');
    root.removeAttribute('aria-hidden');
  }
  
  // Remove any radix portal overlays that might be stuck
  const overlays = document.querySelectorAll('[data-radix-portal]');
  overlays.forEach(overlay => {
    const hasOpenState = overlay.querySelector('[data-state="open"]');
    if (!hasOpenState) {
      // Only remove if no open modals inside
      const parent = overlay.parentElement;
      if (parent && parent.childNodes.length === 1) {
        parent.remove();
      }
    }
  });
};

// Auto-cleanup on route changes
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', forceModalCleanup);
}
