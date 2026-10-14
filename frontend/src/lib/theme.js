import { useSyncExternalStore } from 'react';

// App-wide theme: 'light' | 'dark' | 'system' (follows the OS setting).
// Applied as <html data-theme="light|dark"> (see index.css) and
// data-bs-theme for Bootstrap components. Remembered per browser.

const STORAGE_KEY = 'bb-theme';
const listeners = new Set();
const systemQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'light';
  } catch {
    return 'light';
  }
}

let preference = readPreference();

function resolve(pref) {
  if (pref === 'system') return systemQuery?.matches ? 'dark' : 'light';
  return pref;
}

function apply() {
  const resolved = resolve(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.setAttribute('data-bs-theme', resolved);
  listeners.forEach((listener) => listener());
}

systemQuery?.addEventListener?.('change', () => {
  if (preference === 'system') apply();
});

export function initTheme() {
  apply();
}

export function setThemePreference(next) {
  preference = next;

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage unavailable (private mode); theme still applies for this visit
  }

  apply();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Returns { preference, theme, setPreference, toggle }
export function useTheme() {
  const snapshot = useSyncExternalStore(subscribe, () => `${preference}|${resolve(preference)}`);
  const [pref, theme] = snapshot.split('|');

  return {
    preference: pref,
    theme,
    setPreference: setThemePreference,
    toggle: () => setThemePreference(theme === 'dark' ? 'light' : 'dark'),
  };
}
