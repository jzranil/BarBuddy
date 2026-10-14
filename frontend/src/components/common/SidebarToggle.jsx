import { useSidebar } from '../../lib/sidebar';

// ☰ button shown in the topbar on small screens (hidden on desktop via CSS).
export default function SidebarToggle() {
  const { isOpen, toggle } = useSidebar();

  return (
    <button
      type="button"
      className="app-menu-button"
      onClick={toggle}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        color: 'var(--navy)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{isOpen ? 'close' : 'menu'}</span>
    </button>
  );
}
