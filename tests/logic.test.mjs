import test from 'node:test';
import assert from 'node:assert/strict';
import { menu } from '../menu.js';
import { initialFilters, filterMenu, pickRandom, readFavorites, saveFavorites } from '../logic.js';

test('菜单包含25个不重复条目和10款广式早茶，价格、描述及口味均完整', () => {
  assert.equal(menu.length, 25);
  assert.equal(new Set(menu.map(item => item.id)).size, 25);
  assert.equal(menu.filter(item => item.category === 'tea').length, 10);
  assert.ok(menu.every(item => item.price > 0 && item.taste.length && item.description && item.canteen));
});
test('分类、预算、食堂、口味与关键词同时生效', () => {
  const results = filterMenu(menu, { ...initialFilters, category: 'tea', budget: 14, canteen: '第一食堂', taste: '鲜香', query: '肠粉' });
  assert.deepEqual(results.map(item => item.id), ['rice-rolls']);
  assert.equal(filterMenu(menu, { ...initialFilters, budget: 5 }).length, 0);
});
test('价格排序不会更改原菜单顺序', () => {
  const order = menu.map(item => item.id);
  const results = filterMenu(menu, { ...initialFilters, sort: 'price-asc' });
  assert.ok(results.every((item, index) => index === 0 || item.price >= results[index - 1].price));
  assert.deepEqual(menu.map(item => item.id), order);
});
test('收藏页尊重筛选，并能处理空收藏', () => {
  assert.equal(filterMenu(menu, { ...initialFilters, favoritesOnly: true }).length, 0);
  assert.deepEqual(filterMenu(menu, { ...initialFilters, favoritesOnly: true }, new Set(['egg-tarts'])).map(item => item.id), ['egg-tarts']);
});
test('随机推荐使用候选列表，不连续重复且兼容零个或一个候选', () => {
  assert.equal(pickRandom([]), null);
  assert.equal(pickRandom([menu[0]], menu[0].id).id, menu[0].id);
  assert.equal(pickRandom(menu.slice(0, 2), menu[0].id, () => 0).id, menu[1].id);
});
test('收藏可保存和恢复，损坏或过期数据不会阻断页面', () => {
  let content = '';
  const storage = { getItem: () => content, setItem: (_, value) => { content = value; } };
  const ids = new Set(menu.map(item => item.id));
  assert.equal(saveFavorites(storage, new Set(['egg-tarts'])), true);
  assert.deepEqual([...readFavorites(storage, ids)], ['egg-tarts']);
  content = '["deleted-dish", "egg-tarts", 12]';
  assert.deepEqual([...readFavorites(storage, ids)], ['egg-tarts']);
  content = '{broken';
  assert.equal(readFavorites(storage, ids).size, 0);
  assert.equal(saveFavorites({ setItem() { throw new Error('storage blocked'); } }, new Set()), false);
});
