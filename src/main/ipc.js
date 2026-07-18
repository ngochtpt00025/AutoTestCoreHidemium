/**
 * Dang ky toan bo IPC handler. Them kenh moi thi them o day.
 */
const { ipcMain, dialog, shell } = require('electron');
const store = require('./store');
const { readProfiles } = require('./excel');
const runner = require('./runner');
const { readProfileConfig } = require('./configReader');
const { CHECK_ITEMS } = require('../shared/checkItems');
const { WEBSITES } = require('../shared/websites');

function register(getWindow) {
  /** Detail Log gio la overlay trong cua so chinh -> chi can ban toi day. */
  const broadcast = (channel, payload) => {
    const w = getWindow();
    if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
  };

  // ---- Config ----
  ipcMain.handle('config:get', () => store.load());
  ipcMain.handle('config:set', (_e, patch) => store.save(patch || {}));

  ipcMain.handle('meta:all', () => ({ checkItems: CHECK_ITEMS, websites: WEBSITES }));

  // ---- File excel ----
  ipcMain.handle('file:pick', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(getWindow(), {
      title: 'Chon file Excel / CSV',
      properties: ['openFile'],
      filters: [
        { name: 'Excel / CSV', extensions: ['xlsx', 'xls', 'csv'] },
        { name: 'Tat ca', extensions: ['*'] },
      ],
    });
    if (canceled || !filePaths.length) return { canceled: true };
    store.set('excelPath', filePaths[0]);
    return { canceled: false, filePath: filePaths[0] };
  });

  ipcMain.handle('file:read', (_e, filePath) => {
    const target = filePath || store.get('excelPath');
    if (!target) return { ok: false, error: 'Chua chon file.' };
    try {
      const data = readProfiles(target);
      store.set('excelPath', target);
      return { ok: true, filePath: target, ...data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /** Xem config da decode cua 1 profile bat ky (khong can chay). */
  ipcMain.handle('profile:read-config', (_e, profilePath) => readProfileConfig(profilePath));

  ipcMain.handle('shell:open-external', (_e, url) => {
    shell.openExternal(url);
    return { ok: true };
  });

  // ---- Run ----
  ipcMain.handle('run:start', async (_e, payload) => {
    const { profiles, checkKeys, threads, mode } = payload || {};
    const cfg = store.load();

    try {
      const summary = await runner.start(
        {
          profiles: profiles || [],
          checkKeys: checkKeys || [],
          threads: threads || 1,
          options: {
            apiBase: cfg.apiBase,
            autoClose: cfg.autoClose,
            mode: mode || 'check',
            testWaitMs: cfg.testWaitMs,
          },
        },
        (evt) => broadcast('run:event', evt)
      );
      return { ok: true, summary };
    } catch (err) {
      broadcast('run:event', { type: 'finish', summary: null, error: err.message });
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('run:stop', () => ({ ok: true, wasRunning: runner.stop() }));
  ipcMain.handle('run:status', () => ({ running: runner.isRunning(), lanes: runner.lanes() }));
}

module.exports = { register };
