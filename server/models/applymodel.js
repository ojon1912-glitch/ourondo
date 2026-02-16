const db = require("../db");

module.exports = {
  // 1️⃣ 신청서 생성
  async createApply(data) {
    const result = await db.query(
      `
      INSERT INTO tm_apply
      (
        user_seq,
        product_type,
        apply_date,
        gender,
        name,
        birth_year,
        height,
        contact,
        job,
        mbti,
        source,
        message,
        agree
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING apply_seq
      `,
      [
        data.user_seq,
        data.product_type,
        data.apply_date,
        data.gender,
        data.name,
        data.birth_year,
        data.height,
        data.contact,
        data.job,
        data.mbti,
        data.source,
        data.message,
        data.agree,
      ]
    );

    return result.rows[0];
  },

  // 2️⃣ 파일 저장
  async insertFile({ apply_seq, file_type, file_path, original_name }) {
    await db.query(
      `
      INSERT INTO tm_apply_files
      (apply_seq, file_type, file_path, original_name)
      VALUES ($1,$2,$3,$4)
      `,
      [apply_seq, file_type, file_path, original_name]
    );
  },

  // 3️⃣ 관리자: 전체 신청자
  async getAllApplies() {
    const result = await db.query(`
      SELECT
        a.apply_seq,
        a.user_seq,
        a.product_type,
        a.apply_date,
        a.name,
        a.gender,
        a.birth_year,
        a.height,
        a.contact,
        a.job,
        a.mbti,
        a.source,
        a.message,
        a.cre_dtime,
        a.flag,
        a.is_confirmed,
        p.status AS pay_status,
        p.oid,
        COALESCE(
          array_agg(f.file_path) FILTER (WHERE f.file_path IS NOT NULL),
          '{}'
        ) AS photos
      FROM tm_apply a
      LEFT JOIN tm_apply_files f
        ON a.apply_seq = f.apply_seq
       AND f.file_type = 'PHOTO'
      LEFT JOIN tm_pay p
        ON a.apply_seq = p.apply_seq
      GROUP BY
        a.apply_seq,
        a.user_seq,
        a.product_type,
        a.apply_date,
        a.name,
        a.gender,
        a.birth_year,
        a.height,
        a.contact,
        a.job,
        a.mbti,
        a.source,
        a.message,
        a.flag,
        a.is_confirmed,
        a.cre_dtime,
        p.status,
        p.oid
      ORDER BY a.cre_dtime DESC
    `);

    return result.rows;
  },

  // 4️⃣ 관리자: 수락
  async approveApply(applySeq) {
    await db.query(
      `UPDATE tm_apply SET flag = 'PS' WHERE apply_seq = $1`,
      [applySeq]
    );
  },

  // 5️⃣ 관리자: 거절
  async rejectApply(applySeq) {
    await db.query(
      `UPDATE tm_apply SET flag = 'RJ' WHERE apply_seq = $1`,
      [applySeq]
    );
  },

  // 6️⃣ 신청서 단건 조회 (결제용)
  async getApplyBySeq(applySeq) {
    const result = await db.query(
      `SELECT * FROM tm_apply WHERE apply_seq = $1`,
      [applySeq]
    );
    return result.rows[0] || null;
  },

  // 7️⃣ 🔥 사용자: 내 지원 내역 (마이페이지)
  async getMyApplies(userSeq) {
    const result = await db.query(
      `
      SELECT
        a.apply_seq,
        a.product_type,
        a.apply_date,
        a.flag,
        a.is_confirmed,
        p.status AS pay_status,
        p.oid,
        CASE WHEN rv.review_seq IS NOT NULL THEN true ELSE false END AS has_review
      FROM tm_apply a
      LEFT JOIN tm_pay p ON a.apply_seq = p.apply_seq
      LEFT JOIN tm_review rv ON a.apply_seq = rv.apply_seq AND rv.flag = 1
      WHERE a.user_seq = $1
      ORDER BY a.apply_date DESC, a.cre_dtime DESC
      `,
      [userSeq]
    );

    return result.rows;
  },

  // 8️⃣ 관리자: 참여확인
  async confirmApply(applySeq) {
    await db.query(
      `UPDATE tm_apply SET is_confirmed = 1, confirmed_dtime = now() WHERE apply_seq = $1`,
      [applySeq]
    );
  }
};
