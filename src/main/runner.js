/**
 * Runner: dieu phoi N lane chay song song.
 *
 * Quan ly luong:
 *  - Tao dung N lane, moi lane la 1 worker vong lap doc tu hang doi chung.
 *  - Worker i CHI dung lane i tu dau den cuoi -> khong co chuyen 2 profile chung 1 lane.
 *  - Moi su kien phat ra deu duoc bo sung { runId, laneId, seq } tai day (1 cho duy nhat).
 *  - runId tang moi lan bam Chay -> renderer bo qua su kien cua lan chay cu.
 */
const { LaneManager } = require('./laneManager');

/** Cac che do chay. Them che do moi -> them 1 dong o day. */
const PIPELINES = {
  check: require('./checks').runProfileCheck,        // check that
  testLane: require('./checks/testLane').runProfileCheck, // mo -> doi 10s -> dong
};

class Runner {
  constructor() {
    this.running = false;
    this.controller = null;
    this.manager = null;
    this.runId = 0;
  }

  /**
   * @param {object} params
   * @param {Array} params.profiles
   * @param {string[]} params.checkKeys
   * @param {number} params.threads
   * @param {object} params.options  { apiBase, autoClose }
   * @param {(evt:object)=>void} onEvent
   */
  async start({ profiles, checkKeys, threads, options = {} }, onEvent) {
    const mode = options.mode || 'check';
    const runProfileCheck = PIPELINES[mode];
    if (!runProfileCheck) throw new Error('Che do khong hop le: ' + mode);

    if (this.running) throw new Error('Dang chay roi - bam Dung truoc da.');
    if (!profiles?.length) throw new Error('Chua chon profile nao.');
    if (mode === 'check' && !checkKeys?.length) throw new Error('Chua chon muc check nao.');

    const runId = ++this.runId;
    this.running = true;
    this.controller = new AbortController();
    const signal = this.controller.signal;

    const concurrency = Math.max(1, Math.min(Number(threads) || 1, profiles.length));
    const manager = new LaneManager(runId, concurrency);
    this.manager = manager;

    const queue = profiles.map((p, i) => ({ ...p, order: i + 1 }));
    const summary = { total: profiles.length, pass: 0, fail: 0, error: 0, stopped: 0 };
    let done = 0;

    // Cho duy nhat phat su kien -> moi event chac chan co du runId/laneId/seq.
    const emitFrom = (lane) => (evt) =>
      onEvent({ ...evt, runId, laneId: lane.id, seq: manager.nextSeq() });

    const emitGlobal = (evt) => onEvent({ ...evt, runId, seq: manager.nextSeq() });

    emitGlobal({
      type: 'start',
      mode,
      total: profiles.length,
      threads: concurrency,
      checkKeys,
      lanes: manager.snapshot(),
      profiles: profiles.map((p) => ({ uuid: p.uuid, name: p.name })),
    });

    const worker = async (lane) => {
      while (!signal.aborted) {
        const profile = queue.shift();
        if (!profile) break;

        const emit = emitFrom(lane);
        lane.bind(profile);
        emit({ type: 'profile-start', uuid: profile.uuid, name: profile.name, order: profile.order });

        let status = 'error';
        let statusText = '';
        try {
          const res = await runProfileCheck(lane, checkKeys, { signal, emit, options });
          lane.assertOwns(profile.uuid); // chot chan cuoi cung truoc khi ghi ket qua
          status = res.ok ? 'pass' : 'fail';
          statusText = res.status || '';
          if (res.ok) summary.pass++;
          else {
            summary.fail++;
            emit({ type: 'log', uuid: profile.uuid, message: res.error || res.status, kind: 'err' });
          }
        } catch (err) {
          if (signal.aborted) {
            status = 'stopped';
            summary.stopped++;
          } else {
            status = 'error';
            summary.error++;
            emit({ type: 'log', uuid: profile.uuid, message: 'LOI: ' + err.message, kind: 'err' });
          }
        } finally {
          emit({ type: 'profile-done', uuid: profile.uuid, status, statusText });
          lane.release();
          done++;
          emitGlobal({ type: 'progress', done, total: profiles.length, lanes: manager.snapshot() });
        }
      }
      emitGlobal({ type: 'lane-idle', laneId: lane.id });
    };

    await Promise.all(manager.lanes.map((lane) => worker(lane)));

    manager.releaseAll();
    const stopped = signal.aborted;
    this.running = false;
    this.controller = null;
    this.manager = null;

    emitGlobal({ type: 'finish', summary, stopped });
    return summary;
  }

  stop() {
    const was = this.running;
    if (this.controller) this.controller.abort();
    return was;
  }

  isRunning() {
    return this.running;
  }

  lanes() {
    return this.manager ? this.manager.snapshot() : [];
  }
}

module.exports = new Runner();
