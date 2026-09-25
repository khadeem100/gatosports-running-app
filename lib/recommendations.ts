import type { Product, Weather } from '@/types/domain';

export type RunContext = {
  distanceKm: number;
  sunsetSoon: boolean;
  ownedCategories?: string[];
};

export function recommendGear(products: Product[], weather: Weather, context: RunContext): (Product & { reason: string })[] {
  const owned = new Set((context.ownedCategories ?? []).map((x) => x.toLowerCase()));
  const scores = products.map((product) => {
    const category = product.category.toLowerCase();
    const name = product.name.toLowerCase();
    let reason = '';
    let score = 0;
    if (context.sunsetSoon && /zicht|reflect|led/.test(category + name)) { score += 5; reason = 'Het wordt straks donker'; }
    if (weather.temperatureC < 10 && /jas|laag|warm|wind/.test(category + name)) { score += 4; reason = 'Past bij de frisse temperatuur'; }
    if ((weather.precipitationMm > 0 || weather.windKmh > 20) && /regen|shell|wind|water/.test(category + name)) { score += 3; reason = 'Handig bij wind of een bui'; }
    if ((context.distanceKm > 10 || context.distanceKm * 6 > 60) && /hydr|drink|water/.test(category + name)) { score += 4; reason = 'Handig voor je langere afstand'; }
    if (owned.has(category)) score -= 10;
    return { product, reason, score };
  });
  return scores.filter((x) => x.score > 0 && x.reason).sort((a, b) => b.score - a.score)
    .slice(0, 3).map((x) => ({ ...x.product, reason: x.reason }));
}
