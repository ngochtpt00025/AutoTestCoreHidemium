/**
 * State dung chung cho renderer + vai helper nho.
 */
window.State = {
  config: null,          // config luu tu main
  rows: [],              // toan bo profile doc tu file
  selected: new Set(),   // uuid dang tick
  status: {},            // uuid -> 'idle' | 'running' | 'pass' | 'fail' | 'error' | 'stopped'
  statusText: {},        // uuid -> mo ta chi tiet, vd 'error open profile'
  filter: '',
  running: false,
};

window.$ = (sel) => document.querySelector(sel);
window.$$ = (sel) => Array.from(document.querySelectorAll(sel));

window.escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

/** Ghi log ra footer */
window.logLine = (msg, kind) => {
  const box = $('#log');
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  const div = document.createElement('div');
  if (kind) div.className = 'l-' + kind;
  div.textContent = `[${time}] ${msg}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  while (box.childElementCount > 800) box.removeChild(box.firstChild);
};
