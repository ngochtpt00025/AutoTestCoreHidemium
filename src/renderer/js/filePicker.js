/**
 * Xu ly chon file + load du lieu vao bang.
 */
window.FilePicker = (() => {
  function setPath(p) {
    $('#txt-path').value = p || '';
  }

  async function loadFile(filePath, { silent = false } = {}) {
    const res = await window.api.file.read(filePath);
    if (!res.ok) {
      if (!silent) logLine('Loi doc file: ' + res.error, 'err');
      $('#file-info').textContent = '';
      return false;
    }

    setPath(res.filePath);
    State.rows = res.rows;
    State.status = {};

    // Khoi phuc cac uuid da tick lan truoc (neu con ton tai trong file)
    const saved = new Set(State.config?.selectedUuids || []);
    State.selected = new Set(res.rows.map((r) => r.uuid).filter((u) => saved.has(u)));

    $('#file-info').textContent = `${res.total} profile - sheet "${res.sheetName}"`;
    Table.render();
    logLine(`Da load ${res.total} profile tu ${res.filePath}`, 'ok');
    return true;
  }

  async function pick() {
    const res = await window.api.file.pick();
    if (res.canceled) return;
    State.config = await window.api.config.get();
    await loadFile(res.filePath);
  }

  function init() {
    $('#btn-pick').addEventListener('click', pick);
    $('#btn-reload').addEventListener('click', () => {
      const p = $('#txt-path').value;
      if (p) loadFile(p);
    });
  }

  return { init, loadFile, setPath };
})();
