/**
 * Panel Setting: so luong chay + danh sach muc check.
 * Moi thay doi deu duoc luu ngay vao config.json.
 */
window.Settings = (() => {
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

  function getTestWaitSec() {
    return Math.max(1, parseInt($('#num-testwait').value, 10) || 10);
  }

  function persistChecks() {
    const checks = {};
    $$('#check-list input[type="checkbox"]').forEach((el) => (checks[el.dataset.key] = el.checked));
    window.api.config.set({ checks });
  }

  function init(config) {
    $('#num-threads').value = config.threads;
    $('#txt-api').value = config.apiBase || 'http://127.0.0.1:2222';
    $('#chk-autoclose').checked = !!config.autoClose;
    $('#num-testwait').value = Math.round((config.testWaitMs || 10000) / 1000);
    renderChecks(config.checks || {});

    $('#num-threads').addEventListener('change', () => {
      const v = getThreads();
      $('#num-threads').value = v;
      window.api.config.set({ threads: v });
    });

    $('#txt-api').addEventListener('change', (e) => {
      const v = e.target.value.trim().replace(/\/+$/, '') || 'http://127.0.0.1:2222';
      e.target.value = v;
      window.api.config.set({ apiBase: v });
    });

    $('#chk-autoclose').addEventListener('change', (e) => {
      window.api.config.set({ autoClose: e.target.checked });
    });

    $('#num-testwait').addEventListener('change', (e) => {
      const sec = Math.max(1, parseInt(e.target.value, 10) || 10);
      e.target.value = sec;
      window.api.config.set({ testWaitMs: sec * 1000 });
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
