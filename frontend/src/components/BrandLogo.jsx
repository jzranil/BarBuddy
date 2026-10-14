import { useTheme } from '../lib/theme';

// BarBuddy logo (PNG files in public/brand, generated from the brand sheet).
// variant:
//   'mark'    — the B mark only
//   'compact' — B mark + "BarBuddy" wordmark (topbars, navbars)
//   'full'    — full lockup with "Philippine Bar Examination System" tagline
// height: rendered height of the mark / full logo in px
// onDark: always use the light (cream) version, e.g. on navy backgrounds.
//         Otherwise the night-mode version is used automatically in dark mode.
const SOURCES = {
  mark: { light: '/brand/barbuddy-mark.png', dark: '/brand/barbuddy-mark-light.png' },
  full: { light: '/brand/barbuddy-logo.png', dark: '/brand/barbuddy-logo-dark.png' },
};

const NAVY = '#0F1F3C';
const GOLD = '#C9A84C';
const CREAM = '#F0ECE4';

export default function BrandLogo({ variant = 'compact', height = 32, onDark = false, style }) {
  const { theme } = useTheme();
  const tone = onDark || theme === 'dark' ? 'dark' : 'light';

  if (variant === 'full') {
    return (
      <img
        src={SOURCES.full[tone]}
        alt="BarBuddy — Philippine Bar Examination System"
        style={{ height, width: 'auto', maxWidth: '100%', display: 'block', ...style }}
      />
    );
  }

  const mark = (
    <img
      src={SOURCES.mark[tone]}
      alt={variant === 'mark' ? 'BarBuddy' : ''}
      aria-hidden={variant === 'mark' ? undefined : true}
      style={{ height, width: 'auto', display: 'block', flexShrink: 0, ...(variant === 'mark' ? style : null) }}
    />
  );

  if (variant === 'mark') return mark;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(height * 0.3), ...style }}>
      {mark}
      <span
        style={{
          fontFamily: 'Playfair Display, serif',
          fontWeight: 700,
          fontSize: Math.round(height * 0.62),
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: tone === 'dark' ? CREAM : NAVY,
        }}
      >
        Bar<span style={{ color: GOLD }}>Buddy</span>
      </span>
    </span>
  );
}
