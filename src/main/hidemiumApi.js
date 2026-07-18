/**
 * Client goi Local API cua Hidemium (mac dinh http://127.0.0.1:2222).
 */
const http = require('http');

const DEFAULT_BASE = 'http://127.0.0.1:2222';
const DEFAULT_TIMEOUT = 120000;

function httpGetJson(url, { timeout = DEFAULT_TIMEOUT, signal } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on('timeout', () => req.destroy(new Error('Timeout sau ' + timeout + 'ms')));
    req.on('error', reject);

    if (signal) {
      if (signal.aborted) return req.destroy(new Error('aborted'));
      signal.addEventListener('abort', () => req.destroy(new Error('aborted')), { once: true });
    }
  });
}

/**
 * GET /openProfile?uuid={uuid}
 * @returns {{ ok:boolean, data?:object, error?:string, raw?:any }}
 */
async function openProfile(uuid, { baseUrl = DEFAULT_BASE, signal, timeout } = {}) {
  const url = `${baseUrl}/openProfile?uuid=${encodeURIComponent(uuid)}`;
  try {
    const res = await httpGetJson(url, { signal, timeout });
    const body = res.body;

    if (!body) return { ok: false, error: 'Response khong phai JSON: ' + String(res.raw).slice(0, 200) };
    if (body.status !== 'successfully') {
      return { ok: false, error: body.message || body.status || 'error open profile', raw: body };
    }
    if (!body.data || !body.data.profile_path) {
      return { ok: false, error: 'Response thieu data.profile_path', raw: body };
    }
    return { ok: true, data: body.data, raw: body };
  } catch (err) {
    return { ok: false, error: 'Khong goi duoc API: ' + err.message };
  }
}

/**
 * GET /closeProfile?uuid={uuid}
 *
 * Hidemium doi format response giua cac ban, nen chap nhan ca 3 dang:
 *   { "result": true }
 *   { "uuid": "...", "message": "Profile closed" }
 *   { "status": "successfully" }
 */
function isCloseSuccess(body) {
  if (!body || typeof body !== 'object') return false;
  if (body.result === true) return true;
  if (body.status === 'successfully') return true;
  if (typeof body.message === 'string' && /clos/i.test(body.message)) return true;
  return false;
}

async function closeProfile(uuid, { baseUrl = DEFAULT_BASE, timeout = 60000, signal } = {}) {
  const url = `${baseUrl}/closeProfile?uuid=${encodeURIComponent(uuid)}`;
  try {
    const res = await httpGetJson(url, { timeout, signal });
    if (!res.body) return { ok: false, error: 'Response khong phai JSON: ' + String(res.raw).slice(0, 200) };
    if (!isCloseSuccess(res.body)) {
      return { ok: false, error: 'closeProfile that bai: ' + JSON.stringify(res.body).slice(0, 200), raw: res.body };
    }
    return { ok: true, message: res.body.message || '', raw: res.body };
  } catch (err) {
    return { ok: false, error: 'Khong goi duoc API: ' + err.message };
  }
}

module.exports = { openProfile, closeProfile, isCloseSuccess, httpGetJson, DEFAULT_BASE };
