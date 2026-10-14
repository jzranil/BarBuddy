import { useSidebar } from '../../lib/sidebar';

// Dimmed overlay behind the slide-in sidebar on small screens; tap to close.
export default function SidebarBackdrop() {
  const { isOpen, close } = useSidebar();

  return <div className={`app-sidebar-backdrop${isOpen ? ' is-open' : ''}`} onClick={close} aria-hidden="true" />;
}
