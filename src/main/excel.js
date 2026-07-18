/**
 * Doc file .xlsx / .xls / .csv -> tra ve danh sach { uuid, name, raw }
 * Tu dong do ten cot (khong phan biet hoa thuong / dau gach / khoang trang).
 */
const fs = require('fs');
const XLSX = require('xlsx');

// Cac ten cot co the gap cho tung truong. Them alias moi vao day neu file excel khac.
const UUID_ALIASES = ['uuid', 'id', 'profileid', 'profile_id', 'profileuuid'];
const NAME_ALIASES = ['profilename', 'profile_name', 'name', 'profile', 'tenprofile'];

function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[\s_\-.]/g, '');
}

function pickValue(row, aliases) {
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (normalizeKey(key) === alias) {
        const v = row[key];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
      }
    }
  }
  return '';
}

/**
 * @param {string} filePath
 * @returns {{ rows: Array<{uuid:string,name:string,raw:object}>, headers: string[], total:number }}
 */
function readProfiles(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('File khong ton tai: ' + filePath);
  }

  const wb = XLSX.readFile(filePath, { cellDates: false, raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('File khong co sheet nao.');

  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  const headers = json.length ? Object.keys(json[0]) : [];

  const rows = json
    .map((row, idx) => {
      const uuid = pickValue(row, UUID_ALIASES);
      const name = pickValue(row, NAME_ALIASES);
      return { index: idx, uuid, name, raw: row };
    })
    .filter((r) => r.uuid !== ''); // bo dong trong / dong khong co uuid

  return { rows, headers, total: rows.length, sheetName };
}

module.exports = { readProfiles, UUID_ALIASES, NAME_ALIASES };
