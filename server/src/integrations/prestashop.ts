export type ShopProduct = {
  id: string;
  prestashopId: string;
  imageId: string | null;
  name: string;
  category: string;
  price: number;
  currency: 'EUR';
  description: string;
  imageUrl?: string;
  productUrl: string;
  reasonTags: string[];
};

let cache: { expiresAt: number; products: ShopProduct[] } | null = null;

function textValue(value: unknown, languageId: string): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const match = value.find((entry) => entry && typeof entry === 'object' && String((entry as Record<string, unknown>)['@_id'] ?? '') === languageId);
    return textValue(match ?? value[0], languageId);
  }
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  if (record.language !== undefined) return textValue(record.language, languageId);
  if (record['#text'] !== undefined) return textValue(record['#text'], languageId);
  if (record.value !== undefined) return textValue(record.value, languageId);
  return '';
}

function apiRoot() {
  const raw = process.env.PRESTASHOP_API_BASE_URL?.trim();
  if (!raw) return null;
  const base = new URL(raw.endsWith('/') ? raw : `${raw}/`);
  if (base.pathname.replace(/\/$/, '').endsWith('/api')) base.pathname = base.pathname.replace(/\/$/, '').slice(0, -4) || '/';
  return new URL('api/', base.toString().endsWith('/') ? base : `${base}/`).toString();
}

function authHeaders() {
  const key = process.env.PRESTASHOP_WEB_SERVICE_KEY;
  if (!key) return null;
  return { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`, Accept: 'application/json' };
}

export function productImageUrl(productId: string) {
  const root = (process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4100}`).replace(/\/$/, '');
  return `${root}/v1/products/${encodeURIComponent(productId)}/image`;
}

export async function getShopProducts(): Promise<ShopProduct[] | null> {
  const root = apiRoot();
  const headers = authHeaders();
  if (!root || !headers) return null;
  if (cache && cache.expiresAt > Date.now()) return cache.products;

  try {
    const url = new URL('products/', root);
    url.searchParams.set('display', 'full');
    url.searchParams.set('filter[active]', '[1]');
    url.searchParams.set('limit', '0,100');
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(7_000) });
    if (!response.ok) throw new Error(`PrestaShop returned ${response.status}`);
    const payload = await response.json() as Record<string, unknown>;
    const prestashop = payload.prestashop as Record<string, unknown> | undefined;
    const collection = prestashop?.products as Record<string, unknown> | undefined;
    const records = collection?.product;
    const items = Array.isArray(records) ? records : records ? [records] : [];
    const languageId = process.env.PRESTASHOP_LANGUAGE_ID ?? '1';
    const baseUrl = new URL(root).origin;
    const itemsById = new Map<string, ShopProduct>();
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      const value = raw as Record<string, unknown>;
      const id = textValue(value.id, languageId);
      const active = textValue(value.active, languageId);
      const available = textValue(value.available_for_order, languageId);
      const name = textValue(value.name, languageId).trim();
      const slug = textValue(value.link_rewrite, languageId).trim();
      const price = Number.parseFloat(textValue(value.price, languageId));
      if (!id || !name || active === '0' || available === '0' || !Number.isFinite(price) || price < 0) continue;
      const imageId = textValue(value.id_default_image, languageId) || null;
      const categoryId = textValue(value.id_category_default, languageId);
      const item: ShopProduct = {
        id: `prestashop-${id}`,
        prestashopId: id,
        imageId,
        name,
        category: 'Hardlopen',
        price,
        currency: 'EUR',
        description: textValue(value.description_short ?? value.description, languageId).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        ...(imageId ? { imageUrl: productImageUrl(`prestashop-${id}`) } : {}),
        productUrl: slug ? `${baseUrl}/${id}-${encodeURIComponent(slug)}.html` : `${baseUrl}/index.php?controller=product&id_product=${encodeURIComponent(id)}`,
        reasonTags: categoryId ? [`categorie-${categoryId}`] : [],
      };
      itemsById.set(item.id, item);
    }
    const result = [...itemsById.values()];
    cache = { products: result, expiresAt: Date.now() + 5 * 60 * 1000 };
    return result;
  } catch (error) {
    console.error('PrestaShop product sync unavailable:', error instanceof Error ? error.message : 'unknown error');
    return cache?.products ?? null;
  }
}

export async function getShopProductImage(productId: string) {
  const product = (await getShopProducts())?.find((item) => item.id === productId);
  if (!product?.imageId) return null;
  const root = apiRoot();
  const headers = authHeaders();
  if (!root || !headers) return null;
  const response = await fetch(new URL(`images/products/${product.prestashopId}/${product.imageId}`, root), { headers, signal: AbortSignal.timeout(7_000) });
  if (!response.ok) return null;
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) return null;
  return { body: Buffer.from(await response.arrayBuffer()), contentType };
}
