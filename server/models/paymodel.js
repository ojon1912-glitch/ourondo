// ★ VERSION v20260206_1 (tm_pay 기반 결제 준비/완료 저장)

const db = require("../db");

module.exports = {
  async createPayReady({
    apply_seq,
    oid,
    mid,
    price,
    buyer_name,
    buyer_tel,
    buyer_email,
    product_type,
    user_seq,
  }) {
    await db.query(
      `
      INSERT INTO tm_pay
      (
        apply_seq,
        oid,
        mid,
        price,
        buyer_name,
        buyer_tel,
        buyer_email,
        product_type,
        user_seq,
        status,
        cre_dtime
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,'RD', now())
      `,
      [
        apply_seq,
        oid,
        mid,
        price,
        buyer_name,
        buyer_tel,
        buyer_email,
        product_type,
        user_seq,
      ]
    );
  },

  async markPayApproved(oid, payload) {
    await db.query(
      `
      UPDATE tm_pay
      SET
        status = 'PA',
        approve_raw = $2,
        approve_json = $3,
        merchant_data = $4,
        upd_dtime = now()
      WHERE oid = $1
      `,
      [
        oid,
        payload.approve_raw || null,
        payload.approve_json ? JSON.stringify(payload.approve_json) : null,
        payload.merchantData || null,
      ]
    );
  },

  async markPayFailed(oid, payload) {
    if (!oid) return;
    await db.query(
      `
      UPDATE tm_pay
      SET
        status = 'FA',
        fail_json = $2,
        upd_dtime = now()
      WHERE oid = $1
      `,
      [oid, JSON.stringify(payload || {})]
    );
  },

  async getPayByApplySeq(apply_seq) {
    const result = await db.query(
      `SELECT * FROM tm_pay WHERE apply_seq = $1 ORDER BY cre_dtime DESC LIMIT 1`,
      [apply_seq]
    );
    return result.rows[0] || null;
  },

  async markRefundRequested(oid) {
    await db.query(
      `UPDATE tm_pay SET status = 'RR', upd_dtime = now() WHERE oid = $1`,
      [oid]
    );
  },

  async markRefunded(oid, cancelJson) {
    await db.query(
      `UPDATE tm_pay SET status = 'RF', cancel_json = $2, upd_dtime = now() WHERE oid = $1`,
      [oid, JSON.stringify(cancelJson || {})]
    );
  },
};
