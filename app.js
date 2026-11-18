import { menu, categories } from './menu.js';
import { initialFilters, filterMenu, pickRandom, readFavorites, saveFavorites } from './logic.js';
import { icon } from './art.js';
import { photos } from './photos.js';

const $ = selector => document.querySelector(selector);
const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const filters = { ...initialFilters };
const validIds = new Set(menu.map(item => item.id));
let storage;
try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw Error('Unavailable'); } }; }
let favorites = readFavorites(storage, validIds);
let previousRandomId = null;
let currentDialogId = null;
let dialogMode = 'details';
let toastTimer;

document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });

function photo(item, className = 'food-photo', lazy = true) {
  const source = photos[item.id];
  return `<img class="${className}" src="${source.path}" alt="${escape(item.name)}实拍示意照片" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" width="800" height="600">`;
}

$('#hero-art').removeAttribute('role');
$('#hero-art').removeAttribute('aria-label');
$('#hero-art').innerHTML = `${photo(menu[0], 'hero-photo-main', false)}${photo(menu.find(item => item.id === 'shrimp-dumplings'), 'hero-photo-small', false)}<div class="photo-sticker"><span>✦</span>今日份小确幸</div><div class="hero-photo-caption">好好吃饭，认真生活。<small>HAPPY EVERY BITE</small></div>`;

function showToast(message) {
  const element = $('#toast');
  clearTimeout(toastTimer);
  element.textContent = message;
  element.classList.add('visible');
  toastTimer = setTimeout(() => element.classList.remove('visible'), 3000);
}

function renderCategories() {
  $('#categories').innerHTML = categories.map(category => `<button class="category-button ${category.id === filters.category ? 'active' : ''}" data-category="${category.id}" aria-pressed="${category.id === filters.category}">${icon(category.icon)}${category.label}<span class="category-count">${category.id === 'all' ? menu.length : menu.filter(item => item.category === category.id).length}</span></button>`).join('');
}

function favoriteButton(item) {
  const selected = favorites.has(item.id);
  return `<button class="favorite-button ${selected ? 'selected' : ''}" data-favorite="${item.id}" aria-label="${selected ? '取消收藏' : '收藏'}${escape(item.name)}" aria-pressed="${selected}">${icon('heart')}</button>`;
}

function render() {
  renderCategories();
  $('#favorite-count').textContent = favorites.size;
  $('#favorites-tab').classList.toggle('active', filters.favoritesOnly);
  $('#favorites-tab').setAttribute('aria-pressed', filters.favoritesOnly);
  $('#discover-tab').classList.toggle('active', !filters.favoritesOnly);
  $('#discover-tab').setAttribute('aria-pressed', !filters.favoritesOnly);
  $('#section-title').innerHTML = `${filters.favoritesOnly ? '把喜欢的味道，留在这里' : '寻找你的下一口心动'}<span class="heading-dot">。</span>`;
  const items = filterMenu(menu, filters, favorites);
  $('#results-summary').innerHTML = `${filters.favoritesOnly ? '收藏中找到' : '为你找到'} <strong>${items.length}</strong> 道美食`;
  $('#food-grid').innerHTML = items.map(item => `<article class="food-card" style="--card-bg:${item.color}" data-dish="${item.id}"><button class="card-image-button" data-details="${item.id}" aria-label="查看${escape(item.name)}详情">${photo(item)}${item.label || item.category === 'tea' ? `<span class="card-badge ${item.category === 'tea' ? 'tea-badge' : ''}">${item.label || '广式早茶'}</span>` : ''}</button>${favoriteButton(item)}<div class="card-body"><div class="card-title-line"><button class="card-title-button" data-details="${item.id}"><h3>${item.name}</h3></button><span class="price"><small>¥</small>${item.price}</span></div><div class="card-tags">${item.taste.map(taste => `<span class="tag ${taste.includes('辣') ? 'spicy' : ''}">${taste}</span>`).join('')}<span class="tag">${item.category === 'tea' ? '早茶点心' : '校园好味'}</span></div><div class="card-bottom"><span class="card-place">${icon('pin')}${item.canteen} · ${item.window.replace('窗口', '')}</span><span class="card-unit">${item.unit ? item.unit === '只' ? '1只 / 份' : `${item.unit} / 份` : '每份'}</span></div></div></article>`).join('');
  $('#empty-state').hidden = items.length > 0;
  $('#empty-icon').innerHTML = icon(filters.favoritesOnly ? 'heart' : 'search');
  const noFavorites = filters.favoritesOnly && favorites.size === 0;
  $('#empty-title').textContent = noFavorites ? '喜欢的味道，等你来收藏' : '还没有找到合适的美食';
  $('#empty-description').textContent = noFavorites ? '点击菜品右上角的小爱心，把下一顿想吃的留在这里。' : '试试提高预算、换一种口味，或清空搜索关键词。';
  $('#empty-reset').textContent = noFavorites ? '去发现美食' : '重置筛选，重新发现';
  attachImageFallbacks();
}

function attachImageFallbacks() {
  document.querySelectorAll('img').forEach(image => {
    image.addEventListener('error', () => {
      image.alt = image.alt.replace('实拍示意照片', '') + '（图片暂不可用）';
      image.style.objectFit = 'contain';
      image.src = './assets/favicon.svg';
    }, { once: true });
  });
}

function toggleFavorite(id) {
  if (!validIds.has(id)) return;
  const item = menu.find(dish => dish.id === id);
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  const saved = saveFavorites(storage, favorites);
  render();
  showToast(saved ? `${favorites.has(id) ? '已收藏' : '已取消收藏'} · ${item.name}` : '浏览器限制了存储，本次收藏仅在当前页面保留');
  if (currentDialogId) renderDialog(menu.find(dish => dish.id === currentDialogId));
}

function syncInputs() {
  $('#search').value = filters.query;
  $('#budget').value = filters.budget;
  $('#budget-value').textContent = `¥${filters.budget} 内`;
  $('#canteen').value = filters.canteen;
  $('#taste').value = filters.taste;
  $('#sort').value = filters.sort;
}

function resetFilters(favoritesOnly = filters.favoritesOnly) {
  Object.assign(filters, initialFilters, { favoritesOnly });
  syncInputs();
  render();
}

function renderDialog(item) {
  const credit = photos[item.id];
  const selected = favorites.has(item.id);
  $('#dialog-content').innerHTML = `${photo(item, 'dialog-photo', false)}<div class="dialog-info"><p class="dialog-eyebrow">${dialogMode === 'random' ? '这一餐，就选它吧 · 为你随机推荐' : '好好吃饭 · 菜品详情'}</p><div class="dialog-heading"><h2 id="dialog-title">${item.name}</h2><span class="price"><small>¥</small>${item.price}</span></div><div class="dialog-tags">${item.taste.map(taste => `<span class="tag">${taste}</span>`).join('')}<span class="tag">${item.unit || '1份'}</span></div><p class="dialog-description">${item.description}</p><div class="dialog-place">${icon('pin')}${item.canteen} · ${item.window}（示例位置）</div><div class="dialog-buttons"><button class="button primary" data-dialog-random>${icon('shuffle')}换一道试试</button><button class="button secondary" data-dialog-favorite="${item.id}" aria-pressed="${selected}">${icon('heart')}${selected ? '已收藏' : '加入收藏'}</button></div><p class="dialog-source">菜品与价格为演示数据，图片仅用于示意。<br>摄影：${escape(credit.author)} · <a href="${credit.source}" target="_blank" rel="noopener noreferrer">图片来源</a> · <a href="${credit.licenseUrl || credit.source}" target="_blank" rel="noopener noreferrer">${escape(credit.license)}</a></p></div>`;
  attachImageFallbacks();
}

function openDish(item, mode = 'details') {
  currentDialogId = item.id;
  dialogMode = mode;
  renderDialog(item);
  if (!$('#food-dialog').open) $('#food-dialog').showModal();
}

function recommend() {
  const candidates = filterMenu(menu, filters, favorites);
  const selected = pickRandom(candidates, previousRandomId);
  if (!selected) { showToast(filters.favoritesOnly ? '当前没有符合条件的收藏，试试切换到发现美食' : '当前没有符合条件的菜品，试试放宽筛选条件'); return; }
  previousRandomId = selected.id;
  openDish(selected, 'random');
}

$('#categories').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (button) { filters.category = button.dataset.category; render(); } });
$('#search').addEventListener('input', event => { filters.query = event.target.value; render(); });
$('#budget').addEventListener('input', event => { filters.budget = Number(event.target.value); $('#budget-value').textContent = `¥${filters.budget} 内`; render(); });
$('#canteen').addEventListener('change', event => { filters.canteen = event.target.value; render(); });
$('#taste').addEventListener('change', event => { filters.taste = event.target.value; render(); });
$('#sort').addEventListener('change', event => { filters.sort = event.target.value; render(); });
$('#reset-filters').addEventListener('click', () => resetFilters());
$('#empty-reset').addEventListener('click', () => resetFilters(filters.favoritesOnly && favorites.size > 0));
$('#discover-tab').addEventListener('click', () => { resetFilters(false); $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('#favorites-tab').addEventListener('click', () => { resetFilters(true); $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('#hero-random').addEventListener('click', recommend);
$('#explore-tea').addEventListener('click', () => { resetFilters(false); filters.category = 'tea'; render(); $('#menu').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('#food-grid').addEventListener('click', event => {
  const favorite = event.target.closest('[data-favorite]');
  if (favorite) return toggleFavorite(favorite.dataset.favorite);
  const details = event.target.closest('[data-details]');
  if (details) openDish(menu.find(item => item.id === details.dataset.details));
});
$('#dialog-close').addEventListener('click', () => $('#food-dialog').close());
$('#food-dialog').addEventListener('close', () => { currentDialogId = null; });
$('#food-dialog').addEventListener('click', event => {
  if (event.target.closest('[data-dialog-random]')) return recommend();
  const favorite = event.target.closest('[data-dialog-favorite]');
  if (favorite) return toggleFavorite(favorite.dataset.dialogFavorite);
  if (event.target === $('#food-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); }
});
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !$('#food-dialog').open) { event.preventDefault(); $('#search').focus(); } });
window.addEventListener('storage', event => { if (event.key === 'campus-bites:favorites:v1' || event.key === null) { favorites = readFavorites(storage, validIds); render(); if (currentDialogId) renderDialog(menu.find(item => item.id === currentDialogId)); } });
const footerCredit = document.createElement('a');
footerCredit.href = './credits.html'; footerCredit.className = 'credits-link'; footerCredit.textContent = '图片来源与授权';
$('.footer-note').insertAdjacentElement('afterend', footerCredit);
render();
