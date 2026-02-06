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
        COALESCE(
          array_agg(f.file_path) FILTER (WHERE f.file_path IS NOT NULL),
          '{}'
        ) AS photos
      FROM tm_apply a
      LEFT JOIN tm_apply_files f
        ON a.apply_seq = f.apply_seq
       AND f.file_type = 'PHOTO'
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
        a.cre_dtime
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

  // 6️⃣ 🔥 사용자: 내 지원 내역 (마이페이지)
  async getMyApplies(userSeq) {
    const result = await db.query(
      `
      SELECT
        apply_seq,
        product_type,
        apply_date,
        flag
      FROM tm_apply
      WHERE user_seq = $1
      ORDER BY apply_date DESC, cre_dtime DESC
      `,
      [userSeq]
    );

    return result.rows;
  }
};
