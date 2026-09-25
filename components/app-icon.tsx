import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

type IconName =
  | 'home' | 'routes' | 'run' | 'challenge' | 'profile' | 'sun' | 'wind' | 'rain' | 'arrow'
  | 'chevron' | 'back' | 'pin' | 'target' | 'check' | 'plus' | 'safe' | 'gear' | 'shoe'
  | 'heart' | 'map' | 'clock' | 'play' | 'pause' | 'stop' | 'share' | 'moon' | 'search'
  | 'settings' | 'calendar' | 'logout' | 'spark' | 'close' | 'trophy' | 'refresh';

const paths: Record<IconName, string> = {
  home: 'M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z',
  routes: 'M4 6.5h7l2 3h7v9H4z M7 13h10 M7 16h6',
  run: 'M14.2 4.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM12 7l-3 4 3.5 2.5-1 4M12 7l4 2 2 3M8.8 11 6 14M13.5 13.5l-2.5 2.7-2 4M17.5 12l2 2.5',
  challenge: 'M8 4h8v3a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 11v5M8 20h8M10 16h4',
  profile: 'M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  wind: 'M3 8h12a3 3 0 1 0-3-3M2 12h17a2 2 0 1 1-2 2M4 16h9a3 3 0 1 1-3 3',
  rain: 'M7 16.5l-.7 2.1M12 16.5l-.7 2.1M17 16.5l-.7 2.1M5 14a4 4 0 0 1 1-7.9A6 6 0 0 1 17 8a3 3 0 1 1 1 6z',
  arrow: 'M4 12h15M13 5l7 7-7 7',
  chevron: 'm9 18 6-6-6-6',
  back: 'm15 18-6-6 6-6M20 12H9',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z M12 10a2 2 0 1 0 0-.1',
  target: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z M12 10v4M10 12h4',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  safe: 'M12 3 20 6v5c0 5-3.6 8.3-8 10-4.4-1.7-8-5-8-10V6zM9 12l2 2 4-4',
  gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  shoe: 'M5 5c1.4 3 3.2 5 6 6l3 1 2 3 5 1v4H3v-4l3-3 1-4zM8 10l2 1M10 8l2 2',
  heart: 'M20.8 8.6c0 5.2-8.8 11-8.8 11S3.2 13.8 3.2 8.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z',
  map: 'M3 6 8 3l8 3 5-3v15l-5 3-8-3-5 3zM8 3v15M16 6v15',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  play: 'm8 5 11 7-11 7z',
  pause: 'M8 5v14M16 5v14',
  stop: 'M6 6h12v12H6z',
  share: 'M12 16V3M7 8l5-5 5 5M5 13v7h14v-7',
  moon: 'M20.5 14A8.5 8.5 0 0 1 10 3.5 8.6 8.6 0 1 0 20.5 14Z',
  search: 'm20 20-4.3-4.3M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 3.1-.2-.1a1.8 1.8 0 0 0-1.9 0 1.8 1.8 0 0 0-.9 1.5v.2H9v-.2a1.8 1.8 0 0 0-.9-1.5 1.8 1.8 0 0 0-1.9 0l-.2.1-1.8-3.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.8 1.8 0 0 0-1.5-1H3v-4h.1a1.8 1.8 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L6 3.9l.2.1a1.8 1.8 0 0 0 1.9 0A1.8 1.8 0 0 0 9 2.5v-.2h6v.2a1.8 1.8 0 0 0 .9 1.5 1.8 1.8 0 0 0 1.9 0l.2-.1 1.8 3.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.8 1.8 0 0 0 1.5 1h.1v4h-.1a1.8 1.8 0 0 0-1.5 1Z',
  calendar: 'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16M8 14h3M8 17h5',
  logout: 'M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7',
  spark: 'm12 3 1.9 5.8L20 11l-6.1 2.1L12 19l-1.9-5.9L4 11l6.1-2.2zM19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  close: 'm6 6 12 12M18 6 6 18',
  trophy: 'M8 4h8v4a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 20h8M9 17h6',
  refresh: 'M20 7v5h-5M4 17v-5h5M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2',
};

export function AppIcon({ name, size = 22, color = '#17241D', strokeWidth = 1.8 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const round = ['sun', 'wind', 'rain', 'profile', 'heart', 'target', 'clock', 'search', 'settings', 'gear'].includes(name);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
      {name === 'target' ? <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'profile' ? <Circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'sun' || name === 'gear' ? <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'search' ? <Circle cx="10.8" cy="10.8" r="7.2" stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'clock' ? <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'heart' ? <Path d={paths[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {name === 'wind' || name === 'rain' || name === 'profile' || name === 'search' || name === 'clock' || name === 'sun' || name === 'gear' || name === 'target' || name === 'settings' ?
        <Path d={paths[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
      {!round && name !== 'heart' && name !== 'target' ?
        <Path d={paths[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
      {name === 'profile' ? <Path d="M4 21a8 8 0 0 1 16 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" /> : null}
      {name === 'shoe' ? <Line x1="4" y1="16" x2="21" y2="16" stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'routes' ? <Rect x="4" y="6.5" width="16" height="12" rx="2" stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'run' ? <Circle cx="14.2" cy="3" r="1.8" fill={color} /> : null}
      {name === 'pin' ? <Circle cx="12" cy="10" r="1.6" fill={color} /> : null}
      {name === 'check' ? <Polyline points="5,12 9,16 19,6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {name === 'plus' ? <><Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={strokeWidth} /><Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth} /></> : null}
    </Svg>
  );
}
