const db = require("../db");

module.exports = {
  // 리뷰 작성
  async createReview({ user_seq, user_id, apply_seq, review_desc, product_type }) {
    const result = await db.query(
      `INSERT INTO tm_review (user_seq, user_id, apply_seq, review_desc, product_type, flag)
       VALUES ($1, $2, $3, $4, $5, 1)
       RETURNING review_seq`,
      [user_seq, user_id, apply_seq, review_desc, product_type]
    );
    return result.rows[0];
  },

  // 상품 타입별 리뷰 목록 (페이지네이션)
  async getReviewsByProductType(product_type, page = 1, limit = 5) {
    const offset = (page - 1) * limit;
    const dataResult = await db.query(
      `SELECT r.review_seq, r.user_id, r.review_desc, r.cre_dtime, r.product_type,
              u.name AS user_name
       FROM tm_review r
       LEFT JOIN tm_user u ON u.user_seq = r.user_seq
       WHERE r.product_type = $1 AND r.flag = 1
       ORDER BY r.cre_dtime DESC
       LIMIT $2 OFFSET $3`,
      [product_type, limit, offset]
    );
    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM tm_review WHERE product_type = $1 AND flag = 1`,
      [product_type]
    );
    return {
      reviews: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit
    };
  },

  // 특정 신청건에 대한 리뷰 존재 여부 확인
  async getReviewByApplySeq(apply_seq) {
    const result = await db.query(
      `SELECT review_seq FROM tm_review WHERE apply_seq = $1 AND flag = 1`,
      [apply_seq]
    );
    return result.rows[0] || null;
  }
};
