import { writeFile } from 'node:fs/promises';
import { menu } from '../menu.js';
import { photos } from '../photos.js';
const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cards = menu.map(item => {
  const credit = photos[item.id];
  return `<article class="credit-item"><img src="${credit.path}" alt="${item.name}" loading="lazy" width="95" height="80"><div><h2>${item.name}</h2><p>摄影：${esc(credit.author)}</p><p><a href="${esc(credit.source)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons 原图页面</a></p><p>许可：<a href="${esc(credit.licenseUrl || credit.source)}" target="_blank" rel="noopener noreferrer">${esc(credit.license)}</a></p></div></article>`;
}).join('\n');
await writeFile(new URL('../credits.html', import.meta.url), `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f8f7f3"><title>图片来源与授权 · 食间</title><link rel="icon" href="./assets/favicon.svg"><link rel="stylesheet" href="./styles.css"></head><body><main class="credit-page"><a class="credit-back" href="./">← 返回食间</a><div class="eyebrow">PHOTO CREDITS</div><h1>每一张照片，都有出处。</h1><p>本项目使用 Wikimedia Commons 上允许再使用的照片，以下分别记录原作者、原图页面和适用许可。照片文件未修改，页面通过 CSS 调整显示区域；图片仅用于菜品示意，不代表所标注食堂的实际出品。照片版权归各自权利人所有，适用各自的原始许可，与项目代码的 MIT 许可独立。</p><div class="credit-grid">${cards}</div><p>完整机器可读记录：<a href="./image-credits.json">image-credits.json</a>。</p></main></body></html>`, 'utf8');
console.log(`Generated credits.html for ${menu.length} photographs.`);
