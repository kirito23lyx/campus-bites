// Original inline SVG interface icons. Dish photos are credited separately.
export function icon(name, className = '') {
  const paths = {
    shuffle: '<path d="M3 5h3c5 0 7 14 12 14h3m-4-4 4 4-4 4M3 19h3c2 0 4-3 5-6m2-3c2-3 3-5 5-5h3m-4-4 4 4-4 4"/>',
    heart: '<path d="M20.8 4.6a5.6 5.6 0 0 0-7.9 0L12 5.5l-.9-.9a5.6 5.6 0 0 0-7.9 7.9L12 21l8.8-8.5a5.6 5.6 0 0 0 0-7.9Z"/>',
    search: '<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4M4 7v13h17V7M21 12h-6v4h6"/><path d="M17.5 14h.1"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    pepper: '<path d="M17 9C16 4 19 3 21 4M16 8c-7-3-9 4-10 7s-3 5-4 6c7 0 16-3 17-9 0-2-1-3-3-4Z"/>',
    reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    rice: '<path d="M3 12h18c-1 6-4 9-9 9S4 18 3 12ZM7 12a5 5 0 0 1 10 0M8 3v3m4-4v3m4-2v3"/>',
    noodles: '<path d="M3 13h18c-1 5-4 8-9 8s-8-3-9-8ZM7 13V7c0-4 4-4 4 0v6m4 0V5M4 3l17 4M5 1l17 4"/>',
    tea: '<path d="M4 10h14v5a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-5Zm14 1h2a3 3 0 0 1 0 6h-3M8 3v3m5-4v4"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
  };
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.rice}</svg>`;
}

