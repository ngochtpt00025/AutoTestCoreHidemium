/**
 * Diem khoi dong renderer: nap config -> dung UI -> tu load lai file cu.
 */
(async function bootstrap() {
  const config = await window.api.config.get();
  State.config = config;

  Settings.init(config);
  Table.init();
  FilePicker.init();
  DetailLog.init();
  RunnerUI.init();

  if (config.excelPath) {
    FilePicker.setPath(config.excelPath);
    const ok = await FilePicker.loadFile(config.excelPath, { silent: true });
    if (!ok) logLine('Khong doc duoc file da luu, hay chon lai: ' + config.excelPath, 'warn');
  } else {
    logLine('Hay chon file Excel / CSV de bat dau.');
  }
})();
