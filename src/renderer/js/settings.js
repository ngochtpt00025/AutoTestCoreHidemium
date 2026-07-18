/**
 * Panel Setting: so luong chay + danh sach muc check.
 * Moi thay doi deu duoc luu ngay vao config.json.
 */
window.Settings = (() => {
  let cfg = {};   // giu config de doc cac muc da an khoi giao dien

  function renderChecks(checks) {
    const box = $('#check-list');
    let html = '';
    let lastGroup = null;

    CHECK_ITEMS.forEach((item) => {
      if (item.group !== lastGroup) {
        html += `<div class="check-group">${escapeHtml(item.group)}</div>`;
        lastGroup = item.group;
      }
      const on = checks[item.key] ? 'checked' : '';
      html += `<label class="check-item">
        <input type="checkbox" data-key="${item.key}" ${on} />
        <span>${escapeHtml(item.label)}</span>
      </label>`;
    });

    box.innerHTML = html;
  }

  function getCheckKeys() {
    return $$('#check-list input[type="checkbox"]:checked').map((el) => el.dataset.key);
  }

  function getThreads() {
    return Math.max(1, parseInt($('#num-threads').value, 10) || 1);
  }

  /** Da an khoi UI -> lay tu config.json */
  function getTestWaitSec() {
    return Math.max(1, Math.round((cfg.testWaitMs || 10000) / 1000));
  }

  function persistChecks() {
    const checks = {};
    $$('#check-list input[type="checkbox"]').forEach((el) => (checks[el.dataset.key] = el.checked));
    window.api.config.set({ checks });
  }

  function init(config) {
    cfg = config || {};
    $('#num-threads').value = config.threads;
    renderChecks(config.checks || {});

    $('#num-threads').addEventListener('change', () => {
      const v = getThreads();
      $('#num-threads').value = v;
      window.api.config.set({ threads: v });
    });

    $('#check-list').addEventListener('change', persistChecks);

    $('#chk-all-on').addEventListener('click', () => {
      $$('#check-list input').forEach((el) => (el.checked = true));
      persistChecks();
    });
    $('#chk-all-off').addEventListener('click', () => {
      $$('#check-list input').forEach((el) => (el.checked = false));
      persistChecks();
    });
  }

  return { init, getCheckKeys, getThreads, getTestWaitSec };
})();
