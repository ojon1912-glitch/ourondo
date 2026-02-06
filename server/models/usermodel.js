const client = require("../db");

module.exports = {

  // 로그인시 
  async getUserById(user_id) {
    return client.query(
      `
      SELECT * FROM tm_user WHERE user_id = $1 and flag='AA' LIMIT 1
    `,
      [user_id]
    );
  },

// 회원 가입 시 
  async getUserAvailableById(user_id) {
  return client.query(
    `
    SELECT * 
    FROM tm_user 
    WHERE user_id = $1
      AND flag = 'AA'
    LIMIT 1
    `,
    [user_id]
  );
},

 // 유저 생성 시 
  async createUser({ user_id, user_pw, user_name, flag }) {
    return client.query(
      `
      INSERT INTO tm_user (user_id, user_pw, user_name,flag)
      VALUES ($1, $2, $3, 'AA')
      RETURNING user_seq, user_id, user_name, flag
    `,
      [user_id, user_pw, user_name]
    );
  },
  
  // 🔹 user_seq 로 유저 조회 (로그인된 유저 비밀번호 변경용)
  async getUserBySeq(user_seq) {
    return client.query(
      `
      SELECT * 
      FROM tm_user 
      WHERE user_seq = $1 
        AND flag = 'AA'
      `,
      [user_seq]
    );
  },

  // ★ ADD: WT 상태 유저 조회 (카카오 로그인 직후)
  async getUserBySeqAnyFlag(user_seq) {
    return client.query(
      `
      SELECT *
      FROM tm_user
      WHERE user_seq = $1
      `,
      [user_seq]
    );
  },

  // 🔹 비밀번호 변경
  async updatePassword({ user_seq, user_pw }) {
    return client.query(
      `
      UPDATE tm_user
         SET user_pw = $1
       WHERE user_seq = $2
         AND flag = 'AA'
      `,
      [user_pw, user_seq]
    );
  },

  // ★ ADD: 추가 정보 입력 완료 → WT → AA
  async updateProfileAndActivate({ user_seq, name, phone, gender, birth_year }) {
    return client.query(
      `
      UPDATE tm_user
         SET name = $1,
             phone = $2,
             gender = $3,
             birth_year = $4,
             flag = 'AA'
       WHERE user_seq = $5
      `,
      [name, phone, gender, birth_year, user_seq]
    );
  },

  // 회원탈퇴 (flag = 'DD')
async deleteUser(user_seq) {
  return client.query(
    `
    UPDATE tm_user
       SET flag = 'DD'
     WHERE user_seq = $1
    `,
    [user_seq]
  );
}

};
