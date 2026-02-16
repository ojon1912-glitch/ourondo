const db = require("../db");

module.exports = {
  // 잔액 조회
  async getBalance(user_seq) {
    const result = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN point_type = 'EARN' THEN amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN point_type = 'USE' THEN amount ELSE 0 END), 0)
        AS balance
      FROM tm_point
      WHERE user_seq = $1`,
      [user_seq]
    );
    return parseInt(result.rows[0].balance);
  },

  // 적립
  async earnPoint({ user_seq, apply_seq, amount, description }) {
    await db.query(
      `INSERT INTO tm_point (user_seq, apply_seq, point_type, amount, description)
       VALUES ($1, $2, 'EARN', $3, $4)`,
      [user_seq, apply_seq, amount, description]
    );
  },

  // 사용
  async usePoint({ user_seq, apply_seq, amount, description }) {
    await db.query(
      `INSERT INTO tm_point (user_seq, apply_seq, point_type, amount, description)
       VALUES ($1, $2, 'USE', $3, $4)`,
      [user_seq, apply_seq, amount, description]
    );
  },

  // 상품별 적립금 설정 조회
  async getPointConfig(product_type) {
    const result = await db.query(
      `SELECT point_amount FROM tm_point_config WHERE product_type = $1`,
      [product_type]
    );
    return result.rows[0] ? result.rows[0].point_amount : 0;
  },

  // 해당 신청건 적립금 중복 지급 방지
  async hasEarnedForApply(user_seq, apply_seq) {
    const result = await db.query(
      `SELECT point_seq FROM tm_point
       WHERE user_seq = $1 AND apply_seq = $2 AND point_type = 'EARN'`,
      [user_seq, apply_seq]
    );
    return result.rows.length > 0;
  },

  // 관리자 직접 적립금 부여 (apply_seq 없음)
  async adminEarnPoint({ user_seq, amount, description }) {
    await db.query(
      `INSERT INTO tm_point (user_seq, apply_seq, point_type, amount, description)
       VALUES ($1, NULL, 'EARN', $2, $3)`,
      [user_seq, amount, description || "관리자 직접 부여"]
    );
  },

  // 관리자 직접 적립금 차감
  async adminDeductPoint({ user_seq, amount, description }) {
    await db.query(
      `INSERT INTO tm_point (user_seq, apply_seq, point_type, amount, description)
       VALUES ($1, NULL, 'USE', $2, $3)`,
      [user_seq, amount, description || "관리자 직접 차감"]
    );
  }
};
