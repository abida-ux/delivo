// Global chunk-recovery: detect failed dynamic imports and reload once to recover after deployment

function isChunkLoadError(err) {
  if (!err) return false;
  const msg = err.message || err + '';
  return /Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Loading CSS chunk|ChunkLoadError/.test(msg);
}

let handled = false;

function attemptReload() {
  try {
    if (sessionStorage.getItem('app_reload_attempted')) return;
    sessionStorage.setItem('app_reload_attempted', '1');
    // Force reload from network
    window.location.reload(true);
  } catch (e) {
    // ignore
    console.error('Reload attempt failed', e);
  }
}

window.addEventListener('error', (event) => {
  const err = event.error || event;
  if (isChunkLoadError(err) && !handled) {
    handled = true;
    attemptReload();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (isChunkLoadError(reason) && !handled) {
    handled = true;
    attemptReload();
  }
});

// Clear reload flag on successful load of app
try {
  sessionStorage.removeItem('app_reload_attempted');
} catch (e) {
  // ignore
}

export {};
