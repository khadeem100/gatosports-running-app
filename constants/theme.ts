import { useColorScheme } from 'react-native';

const light = {
  bg: '#F4F7F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF0E7',
  ink: '#17241D',
  secondary: '#617066',
  muted: '#87938B',
  line: '#DCE5DB',
  green: '#23563A',
  lime: '#C7F36B',
  limeInk: '#182711',
  orange: '#F0A56A',
  red: '#C64A46',
  blue: '#68AEB5',
  map: '#DCE8D6',
  mapRoad: '#F8FAF6',
  shadow: 'rgba(23, 36, 29, 0.08)',
} as const;

const dark = {
  bg: '#101813',
  surface: '#18231C',
  surfaceMuted: '#202D23',
  ink: '#F3F6F0',
  secondary: '#ADB9AE',
  muted: '#829087',
  line: '#2B3B30',
  green: '#A5D985',
  lime: '#C7F36B',
  limeInk: '#182711',
  orange: '#F2AD78',
  red: '#F08075',
  blue: '#81C7CB',
  map: '#23392C',
  mapRoad: '#31473A',
  shadow: 'rgba(0, 0, 0, 0.24)',
} as const;

export function useAppTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}

export type AppTheme = typeof light;

export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30, xxl: 40 } as const;
export const radius = { sm: 12, md: 18, lg: 26, pill: 999 } as const;
