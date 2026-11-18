export const initialFilters = Object.freeze({ category: 'all', budget: 30, canteen: 'all', taste: 'all', query: '', favoritesOnly: false, sort: 'recommended' });

export function filterMenu(items, filters, favorites = new Set()) {
  const query = filters.query.trim().toLocaleLowerCase('zh-CN');
  const result = items.filter(item =>
    (filters.category === 'all' || item.category === filters.category) &&
    item.price <= Number(filters.budget) &&
    (filters.canteen === 'all' || item.canteen === filters.canteen) &&
    (filters.taste === 'all' || item.taste.includes(filters.taste)) &&
    (!filters.favoritesOnly || favorites.has(item.id)) &&
    (!query || [item.name, item.canteen, item.window, ...item.taste].some(text => text.toLocaleLowerCase('zh-CN').includes(query)))
  );
  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (filters.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  return result;
}

export function pickRandom(items, previousId = null, random = Math.random) {
  if (!items.length) return null;
  const candidates = items.length > 1 ? items.filter(item => item.id !== previousId) : items;
  return candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)))];
}

export function readFavorites(storage, validIds) {
  try {
    const value = JSON.parse(storage.getItem('campus-bites:favorites:v1') || '[]');
    return new Set(Array.isArray(value) ? value.filter(id => typeof id === 'string' && validIds.has(id)) : []);
  } catch { return new Set(); }
}

export function saveFavorites(storage, favorites) {
  try { storage.setItem('campus-bites:favorites:v1', JSON.stringify([...favorites])); return true; }
  catch { return false; }
}
