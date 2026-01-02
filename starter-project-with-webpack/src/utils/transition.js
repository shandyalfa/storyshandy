export function transitionTo(outlet, render) {
  const setBusy = () => outlet?.setAttribute('aria-busy', 'true');
  const clearBusy = () => outlet?.removeAttribute('aria-busy');

  const run = async () => {
    setBusy();
    try { await render(); } catch (e) { console.error('View transition error:', e); }
    finally { clearBusy(); }
  };

  if (document.startViewTransition) document.startViewTransition(run);
  else run();
}
