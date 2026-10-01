export const CAPTURE_OVERLAY_INIT_SCRIPT = `(() => {
  const install = () => {
    if (document.querySelector('[data-portfolio-capture-cursor]')) return;
    const style = document.createElement('style');
    style.textContent = [
      '* { cursor: none !important; }',
      '[data-portfolio-capture-cursor] { position: fixed; z-index: 2147483647; left: 0; top: 0; width: 18px; height: 18px; pointer-events: none; border: 2px solid rgba(255,255,255,.96); border-radius: 999px; background: rgba(51,168,255,.22); box-shadow: 0 2px 14px rgba(0,0,0,.42); transform: translate(-50%,-50%); transition: width .12s,height .12s,background .12s; }',
      '[data-portfolio-capture-cursor][data-down="true"] { width: 34px; height: 34px; background: rgba(51,168,255,.38); }',
      '[data-portfolio-click-ring] { position: fixed; z-index: 2147483646; width: 18px; height: 18px; pointer-events: none; border: 2px solid rgba(51,168,255,.92); border-radius: 999px; transform: translate(-50%,-50%); animation: portfolio-click .55s ease-out forwards; }',
      '@keyframes portfolio-click { to { width: 64px; height: 64px; opacity: 0; } }'
    ].join('');
    document.head.appendChild(style);
    const cursor = document.createElement('div');
    cursor.setAttribute('data-portfolio-capture-cursor', '');
    document.body.appendChild(cursor);
    addEventListener('pointermove', (event) => {
      cursor.style.left = event.clientX + 'px';
      cursor.style.top = event.clientY + 'px';
    }, { passive: true });
    addEventListener('pointerdown', (event) => {
      cursor.setAttribute('data-down', 'true');
      const ring = document.createElement('div');
      ring.setAttribute('data-portfolio-click-ring', '');
      ring.style.left = event.clientX + 'px';
      ring.style.top = event.clientY + 'px';
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 650);
    }, { passive: true });
    addEventListener('pointerup', () => cursor.setAttribute('data-down', 'false'), { passive: true });
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();`;
