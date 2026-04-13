import { Platform } from 'react-native';

const tintColorLight = '#3b82f6';
const tintColorDark = '#60a5fa'; // Lighter blue for dark mode

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#64748b',
    background: '#ffffff',
    card: '#f8fafc',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    border: '#f1f5f9',
    notification: '#ef4444',
  },
  dark: {
    text: '#f9fafb',
    textSecondary: '#a1a1aa',
    background: '#1c1c1e',
    card: '#2c2c2e',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#4b5563',
    tabIconSelected: tintColorDark,
    border: '#3a3a3c',
    notification: '#f87171',
  },
};

/**
 * PROPORTIONAL CORNER RADIUS SYSTEM
 * Based on Apple/Modern UI design principles.
 * cornerRadius = height * ratio
 */
export const CORNER_RATIO = {
  small: 0.18,   // For buttons, chips, small inputs (height < 60)
  medium: 0.12,  // For cards, banners, list items (height < 150)
  large: 0.1,    // For sheets, modals, large containers (height >= 150)
};

/**
 * Returns a rounded integer corner radius based on height and ratio.
 * @param height The height of the element
 * @param type 'small' | 'medium' | 'large' (defaults based on height)
 */
export function getRadius(height: number, type?: 'small' | 'medium' | 'large'): number {
  let ratio = CORNER_RATIO.medium;
  
  if (type) {
    ratio = CORNER_RATIO[type];
  } else {
    // Automatic selection based on height
    if (height < 60) ratio = CORNER_RATIO.small;
    else if (height < 150) ratio = CORNER_RATIO.medium;
    else ratio = CORNER_RATIO.large;
  }
  
  return Math.round(height * ratio);
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
