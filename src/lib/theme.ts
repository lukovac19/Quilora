export const themeColors = {
  dark: {
    bg: '#0a1929',
    bgSecondary: '#1a2f45',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.6)',
    accent: '#266ba7',
    accentLight: '#3b82c4',
    accentDark: '#1e5a8f',
    border: 'rgba(38, 107, 167, 0.2)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    cardBg: 'rgba(26, 47, 69, 0.4)',
  },
  light: {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    text: '#0a1929',
    textSecondary: 'rgba(10, 25, 41, 0.7)',
    textTertiary: 'rgba(10, 25, 41, 0.6)',
    accent: '#266ba7',
    accentLight: '#3b82c4',
    accentDark: '#1e5a8f',
    border: 'rgba(38, 107, 167, 0.2)',
    borderLight: 'rgba(10, 25, 41, 0.1)',
    cardBg: 'rgba(248, 250, 252, 0.8)',
  },
};

export type Theme = 'dark' | 'light';

export function getThemeColors(theme: Theme) {
  return themeColors[theme];
}
