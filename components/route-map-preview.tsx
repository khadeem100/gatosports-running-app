import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { Route } from '@/types/domain';
import { useAppTheme } from '@/constants/theme';

export function RouteMapPreview({ route, height = 168, dark = false }: { route?: Route; height?: number; dark?: boolean }) {
  const colors = useAppTheme();
  const palette = dark
    ? { bg: '#173323', road: '#254633', green: '#496D4D', path: '#C7F36B' }
    : { bg: colors.map, road: colors.mapRoad, green: '#C8DCC0', path: '#2D693F' };
  const pts = route?.points?.length ? route.points : [
    { latitude: 52.36, longitude: 4.86 }, { latitude: 52.365, longitude: 4.865 },
    { latitude: 52.362, longitude: 4.874 }, { latitude: 52.356, longitude: 4.869 },
  ];
  const lats = pts.map((p) => p.latitude);
  const lngs = pts.map((p) => p.longitude);
  const minLat = Math.min(...lats) - 0.001;
  const maxLat = Math.max(...lats) + 0.001;
  const minLng = Math.min(...lngs) - 0.001;
  const maxLng = Math.max(...lngs) + 0.001;
  const coordinates = pts.map((p) => {
    const x = 26 + ((p.longitude - minLng) / Math.max(maxLng - minLng, 0.001)) * 268;
    const y = 22 + (1 - (p.latitude - minLat) / Math.max(maxLat - minLat, 0.001)) * 132;
    return [x, y] as const;
  });
  const routePath = coordinates.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const start = coordinates[0];
  const finish = coordinates[coordinates.length - 1];
  return (
    <Svg width="100%" height={height} viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" accessibilityLabel={`${route?.name ?? 'Route'} voorbeeldkaart`}>
      <Rect x="0" y="0" width="320" height="180" rx="19" fill={palette.bg} />
      <Path d="M-14 33C48 60 91 14 154 35S259 68 336 26M-20 139c67-52 115 26 185-3s101-48 161-14M71-15c-17 54 12 72-3 118s-15 55-5 92M233-14c9 50-20 73-5 116s30 51 27 91" fill="none" stroke={palette.road} strokeWidth="13" strokeLinecap="round" />
      <Path d="M14 88c32-13 45-23 74-25M225 124c29-6 49 4 78 14M28 167c38-12 65-8 93 7" fill="none" stroke={palette.green} strokeWidth="23" strokeLinecap="round" />
      <Path d={routePath} fill="none" stroke={dark ? '#13271D' : '#FFFFFF'} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={routePath} fill="none" stroke={palette.path} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={start?.[0] ?? 0} cy={start?.[1] ?? 0} r="8" fill="#FFFFFF" />
      <Circle cx={start?.[0] ?? 0} cy={start?.[1] ?? 0} r="5" fill="#287848" />
      <Circle cx={finish?.[0] ?? 0} cy={finish?.[1] ?? 0} r="8" fill={palette.path} />
      <Circle cx={finish?.[0] ?? 0} cy={finish?.[1] ?? 0} r="3" fill={dark ? '#14301F' : '#FFFFFF'} />
    </Svg>
  );
}
