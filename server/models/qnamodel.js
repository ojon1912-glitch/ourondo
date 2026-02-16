const client = require("../db");

module.exports = {
  // QnA 리스트
  async getQnaList() {
    return client.query(`
      SELECT 
        q.qna_seq,
        q.title,
        q.cre_dtime,
        q.is_secret,
        u.name AS user_name,
        u.user_id
      FROM tm_qna q
      LEFT JOIN tm_user u ON q.user_seq = u.user_seq
      WHERE q.flag = 'AA'
      ORDER BY q.qna_seq DESC
    `);
  },

  // QnA 상세
  async getQnaBySeq(qna_seq) {
    return client.query(
      `
      SELECT 
        q.qna_seq,
        q.user_seq,
        q.title,
        q.content,
        q.cre_dtime,
        q.is_secret,
        u.name AS user_name,
        u.user_id
      FROM tm_qna q
      LEFT JOIN tm_user u ON q.user_seq = u.user_seq
      WHERE q.qna_seq = $1
        AND q.flag = 'AA'
      LIMIT 1
      `,
      [qna_seq]
    );
  },

  // QnA 작성
  async createQna({ user_seq, title, content, is_secret }) {
    return client.query(
      `
      INSERT INTO tm_qna (user_seq, title, content, is_secret, flag)
      VALUES ($1, $2, $3, $4, 'AA')
      RETURNING qna_seq
      `,
      [user_seq, title, content, is_secret]
    );
  },

  // ===================
  // Reply
  // ===================
  async getReplies(qna_seq) {
    return client.query(
      `
      SELECT 
        r.qna_reply_seq,
        r.content,
        r.cre_dtime,
        u.name AS user_name,
        u.user_id
      FROM tm_qna_reply r
      LEFT JOIN tm_user u ON r.user_seq = u.user_seq
      WHERE r.qna_seq = $1
        AND r.flag = 'AA'
      ORDER BY r.qna_reply_seq ASC
      `,
      [qna_seq]
    );
  },

  async createReply({ user_seq, qna_seq, content }) {
    return client.query(
      `
      INSERT INTO tm_qna_reply (user_seq, qna_seq, content, flag)
      VALUES ($1, $2, $3, 'AA')
      RETURNING qna_reply_seq
      `,
      [user_seq, qna_seq, content]
    );
  },
  // ===============================
// QnA 수정
// ===============================
async updateQna({ qna_seq, content }) {
  return client.query(
    `
    UPDATE tm_qna
       SET is_modify = 1,
           modify_content = $1,
           modify_dtime = NOW()
     WHERE qna_seq = $2
       AND flag = 'AA'
    `,
    [content, qna_seq]
  );
},

// ===============================
// QnA 삭제
// ===============================
async deleteQna(qna_seq) {
  return client.query(
    `
    UPDATE tm_qna
       SET flag = 'DD'
     WHERE qna_seq = $1
    `,
    [qna_seq]
  );
},

// ===============================
// 답변 수정
// ===============================
async updateReply({ qna_reply_seq, content }) {
  return client.query(
    `
    UPDATE tm_qna_reply
       SET is_modify = 1,
           modify_content = $1,
           modify_dtime = NOW()
     WHERE qna_reply_seq = $2
       AND flag = 'AA'
    `,
    [content, qna_reply_seq]
  );
},

// ===============================
// 답변 삭제
// ===============================
async deleteReply(qna_reply_seq) {
  return client.query(
    `
    UPDATE tm_qna_reply
       SET flag = 'DD'
     WHERE qna_reply_seq = $1
    `,
    [qna_reply_seq]
  );
},

// ===============================
// 마이페이지에서 내가쓴 qna보기
// ===============================
async getMyQnaList(user_seq) {
  return client.query(
    `
      SELECT qna_seq, title, cre_dtime
      FROM tm_qna
      WHERE user_seq = $1 AND flag = 'AA'
      ORDER BY cre_dtime DESC
    `,
    [user_seq]
  );
},


};
