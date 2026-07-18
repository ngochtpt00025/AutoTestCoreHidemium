/**
 * LANE MANAGER - quan ly luong chay.
 *
 * Nguyen tac de KHONG BAO GIO lan du lieu giua cac luong:
 *  1. Moi luong (lane) co laneId co dinh 1..N, ton tai suot 1 lan chay.
 *  2. Tai 1 thoi diem, 1 lane chi giu DUNG 1 profile (lane.job).
 *  3. Moi thao tac deu di qua lane.ctx - vung nho rieng cua lane, bi XOA SACH khi release.
 *  4. Moi su kien phat ra deu gan { runId, laneId, uuid, seq } -> renderer loc duoc,
 *     su kien cua lan chay cu (runId khac) bi bo qua.
 *  5. Moi ghi du lieu deu goi lane.assertOwns(uuid): sai chu so huu -> nem loi ngay,
 *     thay vi ghi nham sang profile khac.
 */

class Lane {
  constructor(id, runId) {
    this.id = id;
    this.runId = runId;
    this.job = null;   // { uuid, name, profile }
    this.ctx = null;   // vung nho rieng cua lane cho profile hien tai
    this.busy = false;
  }

  /** Gan profile vao lane. Nem loi neu lane dang ban -> lo logic thay ngay. */
  bind(profile) {
    if (this.busy) {
      throw new Error(`[lane ${this.id}] dang chay ${this.job?.uuid}, khong the bind ${profile.uuid}`);
    }
    this.busy = true;
    this.job = { uuid: profile.uuid, name: profile.name || '', profile };
    this.ctx = {
      uuid: profile.uuid,
      laneId: this.id,
      runId: this.runId,
      openData: null,    // response cua openProfile
      configMap: null,   // config.hidemium da decode
      rows: {},          // ket qua theo tung check key
      startedAt: Date.now(),
    };
    return this.ctx;
  }

  /** Kiem tra du lieu sap ghi co dung profile cua lane nay khong. */
  assertOwns(uuid) {
    if (!this.busy || !this.job || this.job.uuid !== uuid) {
      throw new Error(
        `[lane ${this.id}] LECH LUONG: dang giu "${this.job?.uuid || 'trong'}" nhung nhan du lieu cua "${uuid}"`
      );
    }
  }

  /** Tra lane ve trang thai trong, xoa sach ctx. */
  release() {
    const finished = this.job;
    this.job = null;
    this.ctx = null;
    this.busy = false;
    return finished;
  }
}

class LaneManager {
  constructor(runId, count) {
    this.runId = runId;
    this.lanes = Array.from({ length: count }, (_, i) => new Lane(i + 1, runId));
    this.seq = 0;
  }

  get(id) {
    return this.lanes.find((l) => l.id === id) || null;
  }

  /** So thu tu tang dan cho moi su kien -> renderer sap xep / chong lap dung thu tu. */
  nextSeq() {
    return ++this.seq;
  }

  snapshot() {
    return this.lanes.map((l) => ({
      laneId: l.id,
      busy: l.busy,
      uuid: l.job?.uuid || null,
      name: l.job?.name || null,
    }));
  }

  /** Giai phong het khi ket thuc / dung giua chung. */
  releaseAll() {
    this.lanes.forEach((l) => {
      if (l.busy) l.release();
    });
  }
}

module.exports = { Lane, LaneManager };
