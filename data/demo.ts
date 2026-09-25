import type { Challenge, Product, Route, UserProfile, Weather } from '@/types/domain';
export const demoProfile: UserProfile = {
  id: 'guest-runner',
  name: 'Hardloper',
  goal: 'Blijf lekker in beweging',
  runsPerWeek: '2 keer per week',
  preferredDistance: '5–10 km',
  terrain: 'Parken',
};

const routes: Route[] = [
  {
    id: 'demo-vondelpark-loop',
    name: 'Vondelpark Loop',
    area: 'Amsterdam · Oud-Zuid',
    distanceKm: 5.8,
    durationMin: 34,
    type: 'Park',
    difficulty: 'Rustig',
    elevationM: 12,
    loop: true,
    points: [
      { latitude: 52.3576, longitude: 4.8686 }, { latitude: 52.3589, longitude: 4.8584 },
      { latitude: 52.3652, longitude: 4.8582 }, { latitude: 52.3682, longitude: 4.8653 },
      { latitude: 52.3635, longitude: 4.8734 }, { latitude: 52.3576, longitude: 4.8686 },
    ],
    description: 'Een groene ronde over brede paden, met rustige stukken langs het water.',
  },
  {
    id: 'demo-amstel-waterlijn',
    name: 'Amstel Waterlijn',
    area: 'Amsterdam · De Pijp',
    distanceKm: 8.2,
    durationMin: 48,
    type: 'Water',
    difficulty: 'Gemiddeld',
    elevationM: 18,
    loop: false,
    points: [
      { latitude: 52.3512, longitude: 4.9057 }, { latitude: 52.3424, longitude: 4.9149 },
      { latitude: 52.3317, longitude: 4.9182 }, { latitude: 52.3201, longitude: 4.9241 },
      { latitude: 52.3126, longitude: 4.9361 },
    ],
    description: 'Een lange, vlakke route langs het water. Keer om wanneer het genoeg is.',
  },
  {
    id: 'demo-utrecht-singel',
    name: 'Singel & Park',
    area: 'Utrecht · Binnenstad',
    distanceKm: 4.6,
    durationMin: 28,
    type: 'Stad',
    difficulty: 'Rustig',
    elevationM: 8,
    loop: true,
    points: [
      { latitude: 52.0953, longitude: 5.1182 }, { latitude: 52.1016, longitude: 5.1217 },
      { latitude: 52.1057, longitude: 5.1311 }, { latitude: 52.0994, longitude: 5.1397 },
      { latitude: 52.0932, longitude: 5.1291 }, { latitude: 52.0953, longitude: 5.1182 },
    ],
    description: 'Een compacte stadsronde met een groen tussenstuk en weinig hoogtemeters.',
  },
];

export const demoRoutes = routes;

export const demoWeather: Weather = {
  temperatureC: 14,
  apparentTemperatureC: 12,
  humidityPercent: 71,
  precipitationMm: 0,
  windKmh: 9,
  sunset: '19:41',
  isDay: true,
  source: 'demo',
};

export const demoProducts: Product[] = [
  {
    id: 'gato-light-vest', name: 'GatoSports Reflective Run Vest', category: 'Zichtbaarheid',
    price: 34.95, currency: 'EUR',
    description: 'Licht en goed zichtbaar voor je avondrondes, zonder je bewegingsvrijheid te beperken.',
    productUrl: '', reasonTags: ['schemert'],
  },
  {
    id: 'gato-wind-shell', name: 'GatoSports Lightweight Wind Shell', category: 'Jas',
    price: 69.95, currency: 'EUR',
    description: 'Een lichte extra laag voor frisse runs met wind of een korte bui.',
    productUrl: '', reasonTags: ['wind'],
  },
  {
    id: 'gato-hydration-belt', name: 'GatoSports Hydration Belt', category: 'Hydratatie',
    price: 39.95, currency: 'EUR',
    description: 'Neem drinken mee zonder je tempo of route te hoeven aanpassen.',
    productUrl: '', reasonTags: ['lange afstand'],
  },
];

export const demoChallenges: Challenge[] = [
  {
    id: 'demo-frisse-start', name: 'Frisse start', description: 'Loop deze week samen 15 kilometer.',
    goalKm: 15, joinedCount: 248, endsAt: 'Deze zondag', accent: '#C7F36B',
  },
  {
    id: 'demo-rondje-groen', name: 'Rondje groen', description: 'Ontdek drie nieuwe routes in de natuur.',
    goalKm: 12, joinedCount: 146, endsAt: 'Nog 12 dagen', accent: '#94CDA0',
  },
  {
    id: 'demo-avond-energie', name: 'Avondenergie', description: 'Maak twee keer tijd voor een ontspannen avondrun.',
    goalKm: 8, joinedCount: 391, endsAt: 'Nog 18 dagen', accent: '#F0A56A',
  },
];

