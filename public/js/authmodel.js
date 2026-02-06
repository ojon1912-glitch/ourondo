const client = require("../db");

module.exports = {
  async getUserById(user_id) {
    return client.query(
      `SELECT * FROM tm_user WHERE user_id = $1 LIMIT 1`,
      [user_id]
    );
  },

  async createKakaoUser(user_id, user_name) {
    return client.query(
      `INSERT INTO tm_user (user_id, user_pw, user_name) VALUES ($1, $2, $3)`,
      [user_id, "kakao_user", user_name]
    );
  }
};
