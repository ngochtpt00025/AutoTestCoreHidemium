/**
 * Ve bang profile + xu ly checkbox / tim kiem.
 */
window.Table = (() => {
  const STATUS_LABEL = {
    idle: 'Cho',
    running: 'Dang chay',
    pass: 'PASS',
    fail: 'FAIL',
    error: 'LOI',
    stopped: 'Da dung',
  };

  function visibleRows() {
    const q = State.filter.trim().toLowerCase();
    if (!q) return State.rows;
    return State.rows.filter(
      (r) => r.uuid.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q)
    );
  }

  function render() {
    const rows = visibleRows();
    const tbody = $('#tbody');

    tbody.innerHTML = rows
      .map((r, i) => {
        const st = State.status[r.uuid] || 'idle';
        const stText = State.statusText[r.uuid] || STATUS_LABEL[st];
        const checked = State.selected.has(r.uuid) ? 'checked' : '';
        return `<tr data-uuid="${escapeHtml(r.uuid)}">
          <td class="col-chk"><input type="checkbox" class="row-chk" ${checked} /></td>
          <td class="col-no">${i + 1}</td>
          <td class="uuid">${escapeHtml(r.uuid)}</td>
          <td>${escapeHtml(r.name || '-')}</td>
          <td class="col-status"><span class="st st-${st}" title="${escapeHtml(stText)}">${escapeHtml(stText)}</span></td>
        </tr>`;
      })
      .join('');

    $('#empty').style.display = rows.length ? 'none' : 'block';
    updateCount();
  }

  function updateCount() {
    $('#sel-count').textContent = `${State.selected.size} / ${State.rows.length}`;
    const vis = visibleRows();
    const all = vis.length > 0 && vis.every((r) => State.selected.has(r.uuid));
    $('#chk-all').checked = all;
  }

  /** Cap nhat trang thai 1 dong ma khong ve lai ca bang */
  function setStatus(uuid, status, statusText) {
    State.status[uuid] = status;
    State.statusText[uuid] = statusText || '';
    const tr = $(`tr[data-uuid="${CSS.escape(uuid)}"]`);
    if (!tr) return;
    const span = tr.querySelector('.st');
    span.className = 'st st-' + status;
    span.textContent = statusText || STATUS_LABEL[status] || status;
    span.title = statusText || '';
  }

  function persistSelection() {
    window.api.config.set({ selectedUuids: Array.from(State.selected) });
  }

  function init() {
    // Tick tung dong
    $('#tbody').addEventListener('change', (e) => {
      if (!e.target.classList.contains('row-chk')) return;
      const uuid = e.target.closest('tr').dataset.uuid;
      e.target.checked ? State.selected.add(uuid) : State.selected.delete(uuid);
      updateCount();
      persistSelection();
    });

    // Chon tat ca (theo ket qua dang loc)
    $('#chk-all').addEventListener('change', (e) => {
      const on = e.target.checked;
      visibleRows().forEach((r) => (on ? State.selected.add(r.uuid) : State.selected.delete(r.uuid)));
      render();
      persistSelection();
    });

    // Tim kiem
    let t;
    $('#txt-search').addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        State.filter = e.target.value;
        render();
      }, 150);
    });
  }

  function selectedProfiles() {
    return State.rows.filter((r) => State.selected.has(r.uuid));
  }

  function resetStatus() {
    State.status = {};
    State.statusText = {};
    render();
  }

  return { init, render, setStatus, selectedProfiles, resetStatus, updateCount };
})();
