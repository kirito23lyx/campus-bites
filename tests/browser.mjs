import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { menu } from '../menu.js';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const server = process.env.BASE_URL ? null : spawn(process.execPath, ['scripts/serve.mjs'], { stdio: 'ignore', windowsHide: true });
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(baseURL)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(baseURL);
  await page.locator('.food-card').first().waitFor();
  assert.equal(await page.locator('.food-card').count(), 25);
  // Load and inspect every actual photo, including cards below the fold.
  await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.images].every(image => image.complete), null, { timeout: 20000 });
  const broken = await page.locator('.food-photo').evaluateAll(images => images.filter(image => image.naturalWidth < 100 || !image.currentSrc.includes('/assets/food/')).map(image => image.alt));
  assert.deepEqual(broken, [], 'All 25 dish photos must load successfully');
  assert.equal(new Set(await page.locator('.food-photo').evaluateAll(images => images.map(image => image.src))).size, 25);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });

  await page.locator('#categories [data-category="tea"]').click();
  assert.equal(await page.locator('.food-card').count(), 10);
  await page.locator('#budget').fill('10');
  assert.equal(await page.locator('.food-card').count(), 3);
  await page.selectOption('#taste', '香甜');
  assert.equal(await page.locator('.food-card').count(), 1);
  assert.equal(await page.locator('.card-title-button').innerText(), '酥皮蛋挞');
  await page.locator('#reset-filters').click();
  await page.locator('#search').fill('虾');
  assert.equal(await page.locator('.food-card').count(), 2);
  await page.locator('#reset-filters').click();
  await page.selectOption('#sort', 'price-asc');
  assert.equal(await page.locator('.card-title-button').first().innerText(), '麻婆豆腐饭');

  await page.getByRole('button', { name: '收藏鸡腿饭', exact: true }).click();
  await page.locator('#favorites-tab').click();
  assert.equal(await page.locator('.food-card').count(), 1);
  await page.reload();
  await page.locator('#favorites-tab').click();
  assert.equal(await page.locator('.food-card').count(), 1, 'Favorite survives reload');
  await page.getByRole('button', { name: '取消收藏鸡腿饭', exact: true }).click();
  assert.equal(await page.locator('.food-card').count(), 0);
  assert.equal(await page.locator('#empty-state').isVisible(), true);
  await page.locator('#empty-reset').click();
  assert.equal(await page.locator('.food-card').count(), 25);

  await page.locator('#categories [data-category="tea"]').click();
  await page.locator('#budget').fill('10');
  await page.locator('#hero-random').click();
  assert.equal(await page.locator('#food-dialog').isVisible(), true);
  const firstDish = await page.locator('#dialog-title').innerText();
  assert.ok(['蜜汁叉烧包', '香煎萝卜糕', '酥皮蛋挞'].includes(firstDish));
  await page.locator('[data-dialog-random]').click();
  assert.notEqual(await page.locator('#dialog-title').innerText(), firstDish);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#food-dialog').isVisible(), false);
  await page.locator('#budget').fill('5');
  await page.locator('#hero-random').click();
  assert.equal(await page.locator('#food-dialog').isVisible(), false);
  assert.match(await page.locator('#toast').innerText(), /没有符合条件/);
  await page.locator('#reset-filters').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  await page.locator('.food-card').first().waitFor();
  await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
  const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].map(element => ({ element: element.tagName + '.' + element.className, right: element.getBoundingClientRect().right, left: element.getBoundingClientRect().left })).filter(bounds => bounds.right > innerWidth + 1 || bounds.left < -1));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Mobile page must not overflow horizontally: ' + JSON.stringify(overflow.slice(0, 12)));
  await page.locator('#explore-tea').click();
  assert.equal(await page.locator('.food-card').count(), 10);
  await page.getByRole('button', { name: '查看水晶虾饺详情' }).click();
  assert.equal(await page.locator('#dialog-title').innerText(), '水晶虾饺');
  await page.screenshot({ path: 'artifacts/mobile-dialog.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: '图片来源与授权' }).click();
  await page.locator('.credit-item').first().waitFor();
  assert.equal(await page.locator('.credit-item').count(), menu.length);
  assert.deepEqual(pageErrors, []);
  console.log('Browser QA passed: 25 photos, filters, search, sorting, persistent favorites, constrained random choices, empty states, mobile layout, dialog and photo credits.');
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}
