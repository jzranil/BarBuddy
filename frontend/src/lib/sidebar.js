import { useSyncExternalStore } from 'react';

// Open/closed state of the slide-in sidebar on small screens (≤ 900px).
// Shared by the topbar's menu button, the sidebar and the layout backdrop.
// On wider screens the sidebar is always visible and this state is ignored.

let open = false;
const listeners = new Set();

function set(next) {
  open = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSidebar() {
  const isOpen = useSyncExternalStore(subscribe, () => open);

  return {
    isOpen,
    toggle: () => set(!open),
    close: () => set(false),
  };
}
