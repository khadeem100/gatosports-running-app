export type Route = {
  id: string;
  name: string;
  area: string;
  distanceKm: number;
  durationMin: number;
  type: 'Park' | 'Stad' | 'Trail' | 'Water';
  difficulty: 'Rustig' | 'Gemiddeld' | 'Uitdagend';
  elevationM: number;
  loop: boolean;
  points: { latitude: number; longitude: number }[];
  description: string;
};

export type Run = {
  id: string;
  startedAt: string;
  endedAt: string;
  distanceM: number;
  durationMs: number;
  averagePaceSecPerKm: number;
  feeling?: string;
  note?: string;
  points: { latitude: number; longitude: number; timestamp: number }[];
};

export type Weather = {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  precipitationMm: number;
  windKmh: number;
  sunset: string;
  isDay: boolean;
  source: 'live' | 'demo';
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: 'EUR';
  description: string;
  imageUrl?: string;
  productUrl: string;
  reasonTags: string[];
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  goalKm: number;
  joinedCount: number;
  endsAt: string;
  accent: string;
};

export type UserProfile = {
  id: string;
  name: string;
  goal: string;
  runsPerWeek: string;
  preferredDistance: string;
  terrain: string;
};
