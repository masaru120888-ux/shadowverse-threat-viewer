// Shadowverse class & format emblems as inline SVG (fill uses currentColor so each
// can be tinted per class via CSS). Approximated brand emblems — self-contained,
// no external image dependency.
window.SHADOWVERSE_CLASS_ICONS = {
  // エルフ / Forestcraft — leaf
  forest:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.8 7.6 6.8 16.4 12 22c5.2-5.6 5.2-14.4 0-20zm-.7 5.2h1.4v8.9l-.7 1.4-.7-1.4V7.2z"/></svg>',
  // ロイヤル / Swordcraft — crown
  sword:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8.3l4.4 3.3L12 4.6l4.6 7L21 8.3 19.3 18H4.7L3 8.3z"/><rect x="4.7" y="19" width="14.6" height="2.2" rx="0.4"/></svg>',
  // ウィッチ / Runecraft — octagram
  rune:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5.2" y="5.2" width="13.6" height="13.6"/><rect x="5.2" y="5.2" width="13.6" height="13.6" transform="rotate(45 12 12)"/></svg>',
  // ドラゴン / Dragoncraft — flame
  dragon:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.7 2c1.1 3.3-.4 5.2-1.8 7-1 1.4-1.8 2.7-1.2 4.6-1.5-.6-2.5-2-2.8-3.8C6.1 11.4 5 14 5 16.3a7 7 0 0 0 14 0c0-2.9-1.5-5-2.9-6.9-1-1.4-2-2.6-1.5-4.3-1.2.6-1.9 1.8-1.9 3.3-1.1-1.4-1-3.3.7-5.3-.8-.3-1.6-.6-2.2-1.1z"/></svg>',
  // ナイトメア / Nightmare — bat
  nightmare:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 8.4c-.9-1.7-2.1-2.6-3.7-2.6.4 1-.1 1.8-1 2.1-1.4-.8-2.7-.6-3.6.7 1 .1 1.4.8 1.2 1.8C3.4 11 2.9 12.4 2.9 14c1.5-1.3 2.8-1.3 4.1-.3-.2 1.1.2 2 1.2 2.7.3-1.5 1.1-2.4 2.1-2.7l1.7 1.8 1.7-1.8c1 .3 1.8 1.2 2.1 2.7 1-.7 1.4-1.6 1.2-2.7 1.3-1 2.6-1 4.1.3 0-1.6-.5-3-2.3-3.7-.2-1 .2-1.7 1.2-1.8-.9-1.3-2.2-1.5-3.6-.7-.9-.3-1.4-1.1-1-2.1-1.6 0-2.8.9-3.7 2.6z"/></svg>',
  // ビショップ / Havencraft — feather
  bishop:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.8 3.4c-1.1 0-7.2.4-10.8 4S5 16.1 4.8 17.9L3 19.7c-.4.4-.4 1 0 1.4s1 .4 1.4 0l1.8-1.8c1.8-.2 5.9-.6 9.5-4.2s3.6-9.9 4.1-11.7zM8.9 17.1c.3-1.7 1-4.5 3.6-7.1 1.9-1.9 4.1-3 5.8-3.5-1 1.7-2.6 3.9-4.7 6.1-2.1 2.1-3.4 3.4-4.7 4.5z"/></svg>',
  // ネメシス / Portalcraft — geometric core
  portal:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.6l3.2 4.6L12 10.8 8.8 6.2 12 1.6zm0 11.6l3.2 4.6L12 22.4l-3.2-4.6L12 13.2zM1.6 12l4.6-3.2L10.8 12l-4.6 3.2L1.6 12zm11.6 0l4.6-3.2L22.4 12l-4.6 3.2L13.2 12zM12 9.4l2.6 2.6L12 14.6 9.4 12 12 9.4z"/></svg>',
  // ローテーション — crystal / gem
  rotation:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2.5h10l3.5 5.5L12 21.5 3.5 8 7 2.5zm.6 2L5.8 7.3h3.6l1-2.8H7.6zm3.5 0l-1 2.8h3.8l-1-2.8h-1.8zm3.4 0l1 2.8h3.6l-1.8-2.8h-2.8zM6.2 9.3l3.7 6.1-1.4-6.1H6.2zm4 0l1.8 7.4 1.8-7.4h-3.6zm5.3 0L14 15.4l3.8-6.1h-2.3z"/></svg>',
  // アンリミテッド — infinity
  unlimited:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.3 7.4a4.6 4.6 0 1 0 0 9.2c1.9 0 3.4-1.2 4.4-2.5l.3-.4.3.4c1 1.3 2.5 2.5 4.4 2.5a4.6 4.6 0 1 0 0-9.2c-1.9 0-3.4 1.2-4.4 2.5l-.3.4-.3-.4C10.7 8.6 9.2 7.4 7.3 7.4zm0 2.2c.9 0 1.8.6 2.6 1.7l.5.7-.5.7c-.8 1.1-1.7 1.7-2.6 1.7a2.4 2.4 0 1 1 0-4.8zm9.4 0a2.4 2.4 0 1 1 0 4.8c-.9 0-1.8-.6-2.6-1.7l-.5-.7.5-.7c.8-1.1 1.7-1.7 2.6-1.7z"/></svg>',
};
