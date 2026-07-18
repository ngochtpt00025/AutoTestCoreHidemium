/**
 * CHE DO TEST LUONG.
 *
 * Moi profile: mo -> doi N giay -> dong.
 * Muc dich: nhin bang mat xem co dung so luong browser mo cung luc = so luong (threads) khong,
 * va moi lane co dong dung profile no da mo khong.
 *
 * Chay tren cung LaneManager voi che do check that -> test cai gi thi that chay cai do.
 */
const { openProfile, closeProfile } = require('../hidemiumApi');

/** Sleep co the huy giua chung khi bam Dung. */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('aborted'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new Error('aborted'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * @param {import('../laneManager').Lane} lane
 * @param {string[]} _checkKeys  khong dung o che do nay
 * @param {{ signal:AbortSignal, emit:(e:object)=>void, options:object }} ctx
 */
async function runProfileCheck(lane, _checkKeys, ctx) {
  const { uuid, name } = lane.job;
  const { signal, emit, options } = ctx;
  const waitMs = Number(options.testWaitMs) || 10000;
  const step = (message, kind) => emit({ type: 'log', uuid, message, kind });

  const t0 = Date.now();
  step(`[TEST LUONG] lane #${lane.id} mo ${name || uuid}...`);

  // ---------- Mo ----------
  const opened = await openProfile(uuid, { baseUrl: options.apiBase, signal });
  lane.assertOwns(uuid);

  if (!opened.ok) {
    emit({ type: 'profile-error', uuid, stage: 'open', error: opened.error });
    return { ok: false, status: 'error open profile', error: opened.error, rows: {} };
  }

  lane.ctx.openData = opened.data;
  emit({ type: 'profile-opened', uuid, data: opened.data });
  step(`Da mo sau ${Date.now() - t0}ms - port ${opened.data.remote_port}`, 'ok');

  // ---------- Doi ----------
  let closeErr = null;
  try {
    step(`Giu mo ${waitMs / 1000}s...`);
    await sleep(waitMs, signal);
    lane.assertOwns(uuid);
  } finally {
    // Du bi bam Dung giua chung van phai dong profile da mo -> khong bo browser mo coi.
    step('Dong profile...');
    const closed = await closeProfile(uuid, { baseUrl: options.apiBase });
    lane.assertOwns(uuid);

    if (closed.ok) {
      step(`Da dong. Tong ${Date.now() - t0}ms`, 'ok');
    } else {
      closeErr = closed.error;
      step('Dong that bai: ' + closed.error, 'err');
      emit({ type: 'profile-error', uuid, stage: 'close', error: closed.error });
    }
  }

  if (closeErr) return { ok: false, status: 'error close profile', error: closeErr, rows: {} };
  return { ok: true, status: 'test ok', rows: {} };
}

module.exports = { runProfileCheck };
