const db = require("../db");

module.exports = {
  // 방 생성
  async createRoom({ title, created_by }) {
    const result = await db.query(
      `INSERT INTO tm_gauge_room (title, created_by)
       VALUES ($1, $2)
       RETURNING *`,
      [title, created_by]
    );
    return result.rows[0];
  },

  // 열린 방 목록 (CLOSED 제외)
  async getOpenRooms() {
    const result = await db.query(
      `SELECT r.*, u.user_name AS creator_name
       FROM tm_gauge_room r
       LEFT JOIN tm_user u ON r.created_by = u.user_seq
       WHERE r.status != 'CLOSED'
       ORDER BY r.cre_dtime DESC`
    );
    return result.rows;
  },

  // 방 단건 조회
  async getRoomBySeq(room_seq) {
    const result = await db.query(
      `SELECT r.*, u.user_name AS creator_name
       FROM tm_gauge_room r
       LEFT JOIN tm_user u ON r.created_by = u.user_seq
       WHERE r.room_seq = $1`,
      [room_seq]
    );
    return result.rows[0] || null;
  },

  // 단계 변경
  async updateRoomStep(room_seq, step) {
    await db.query(
      `UPDATE tm_gauge_room SET current_step = $1 WHERE room_seq = $2`,
      [step, room_seq]
    );
  },

  // 상태 변경
  async updateRoomStatus(room_seq, status) {
    await db.query(
      `UPDATE tm_gauge_room SET status = $1 WHERE room_seq = $2`,
      [status, room_seq]
    );
  },

  // 테이블 수 변경
  async updateTableCount(room_seq, count) {
    await db.query(
      `UPDATE tm_gauge_room SET table_count = $1 WHERE room_seq = $2`,
      [count, room_seq]
    );
  },

  // 참여
  async joinRoom({ room_seq, user_seq, name, gender }) {
    const result = await db.query(
      `INSERT INTO tm_gauge_member (room_seq, user_seq, name, gender)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [room_seq, user_seq, name, gender]
    );
    return result.rows[0];
  },

  // 거절 (KICKED)
  async kickMember(member_seq) {
    await db.query(
      `UPDATE tm_gauge_member SET status = 'KICKED' WHERE member_seq = $1`,
      [member_seq]
    );
  },

  // 참여자 목록
  async getMembers(room_seq) {
    const result = await db.query(
      `SELECT * FROM tm_gauge_member
       WHERE room_seq = $1 AND status = 'JOINED'
       ORDER BY cre_dtime ASC`,
      [room_seq]
    );
    return result.rows;
  },

  // 본인 참여 정보
  async getMemberByUser(room_seq, user_seq) {
    const result = await db.query(
      `SELECT * FROM tm_gauge_member
       WHERE room_seq = $1 AND user_seq = $2 AND status = 'JOINED'`,
      [room_seq, user_seq]
    );
    return result.rows[0] || null;
  },

  // 닉네임 설정
  async setNickname(member_seq, nickname) {
    await db.query(
      `UPDATE tm_gauge_member SET nickname = $1 WHERE member_seq = $2`,
      [nickname, member_seq]
    );
  },

  // 테이블 선택
  async setTableNo(member_seq, table_no) {
    await db.query(
      `UPDATE tm_gauge_member SET table_no = $1 WHERE member_seq = $2`,
      [table_no, member_seq]
    );
  },

  // 나가기 (삭제)
  async leaveRoom(room_seq, user_seq) {
    await db.query(
      `DELETE FROM tm_gauge_member
       WHERE room_seq = $1 AND user_seq = $2 AND status = 'JOINED'`,
      [room_seq, user_seq]
    );
  },

  // ============================
  // GAME1_1: 질문 답변
  // ============================
  async submitAnswers(room_seq, member_seq, answers) {
    for (const a of answers) {
      await db.query(
        `INSERT INTO tm_gauge_answer (room_seq, member_seq, question_no, answer_text)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (room_seq, member_seq, question_no) DO UPDATE SET answer_text = $4`,
        [room_seq, member_seq, a.question_no, a.answer_text]
      );
    }
  },

  async getAnswersByRoom(room_seq) {
    const result = await db.query(
      `SELECT a.*, m.gender, m.nickname, m.name, m.table_no
       FROM tm_gauge_answer a
       JOIN tm_gauge_member m ON a.member_seq = m.member_seq
       WHERE a.room_seq = $1
       ORDER BY a.member_seq, a.question_no`,
      [room_seq]
    );
    return result.rows;
  },

  async getMyAnswers(room_seq, member_seq) {
    const result = await db.query(
      `SELECT * FROM tm_gauge_answer WHERE room_seq = $1 AND member_seq = $2 ORDER BY question_no`,
      [room_seq, member_seq]
    );
    return result.rows;
  },

  async getSubmittedMembers(room_seq, questionNos) {
    if (questionNos && questionNos.length > 0) {
      const result = await db.query(
        `SELECT member_seq FROM tm_gauge_answer
         WHERE room_seq = $1 AND question_no = ANY($2)
         GROUP BY member_seq HAVING COUNT(*) >= $3`,
        [room_seq, questionNos, questionNos.length]
      );
      return result.rows.map(r => r.member_seq);
    }
    const result = await db.query(
      `SELECT member_seq FROM tm_gauge_answer
       WHERE room_seq = $1 GROUP BY member_seq HAVING COUNT(*) >= 2`,
      [room_seq]
    );
    return result.rows.map(r => r.member_seq);
  },

  // ============================
  // GAME1_2: 게이지 배분
  // ============================
  async getOppositeGenderAnswers(room_seq, my_gender, questionNos) {
    if (questionNos && questionNos.length > 0) {
      const result = await db.query(
        `SELECT a.answer_seq, a.question_no, a.answer_text, a.member_seq
         FROM tm_gauge_answer a
         JOIN tm_gauge_member m ON a.member_seq = m.member_seq
         WHERE a.room_seq = $1 AND m.gender != $2 AND m.status = 'JOINED'
           AND a.question_no = ANY($3)
         ORDER BY a.member_seq, a.question_no`,
        [room_seq, my_gender, questionNos]
      );
      return result.rows;
    }
    const result = await db.query(
      `SELECT a.answer_seq, a.question_no, a.answer_text, a.member_seq
       FROM tm_gauge_answer a
       JOIN tm_gauge_member m ON a.member_seq = m.member_seq
       WHERE a.room_seq = $1 AND m.gender != $2 AND m.status = 'JOINED'
       ORDER BY a.member_seq, a.question_no`,
      [room_seq, my_gender]
    );
    return result.rows;
  },

  async submitGaugeScores(room_seq, from_member_seq, scores, game_step) {
    await db.query(
      `DELETE FROM tm_gauge_score WHERE room_seq = $1 AND from_member_seq = $2 AND game_step = $3`,
      [room_seq, from_member_seq, game_step]
    );
    for (const s of scores) {
      if (s.gauge_amount > 0) {
        await db.query(
          `INSERT INTO tm_gauge_score (room_seq, from_member_seq, to_answer_seq, to_member_seq, gauge_amount, game_step)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [room_seq, from_member_seq, s.to_answer_seq || null, s.to_member_seq || null, s.gauge_amount, game_step]
        );
      }
    }
  },

  async getScoresByRoom(room_seq, game_step) {
    const result = await db.query(
      `SELECT s.*, mf.name AS from_name, mf.nickname AS from_nickname, mf.gender AS from_gender,
              a.answer_text, a.question_no,
              COALESCE(s.to_member_seq, a.member_seq) AS to_member_seq,
              mt.name AS to_name, mt.nickname AS to_nickname, mt.gender AS to_gender
       FROM tm_gauge_score s
       JOIN tm_gauge_member mf ON s.from_member_seq = mf.member_seq
       LEFT JOIN tm_gauge_answer a ON s.to_answer_seq = a.answer_seq
       LEFT JOIN tm_gauge_member mt ON COALESCE(s.to_member_seq, a.member_seq) = mt.member_seq
       WHERE s.room_seq = $1 AND s.game_step = $2
       ORDER BY s.from_member_seq`,
      [room_seq, game_step]
    );
    return result.rows;
  },

  async getGaugeConfirmedMembers(room_seq, game_step) {
    const result = await db.query(
      `SELECT DISTINCT from_member_seq FROM tm_gauge_score
       WHERE room_seq = $1 AND game_step = $2`,
      [room_seq, game_step]
    );
    return result.rows.map(r => r.from_member_seq);
  },

  // ============================
  // TALK1: 내 답변 + 내가 준 게이지
  // ============================
  async getMyGivenScores(room_seq, from_member_seq, game_step) {
    const result = await db.query(
      `SELECT s.gauge_amount, a.answer_text, a.question_no,
              COALESCE(s.to_member_seq, a.member_seq) AS to_member_seq,
              mt.nickname AS to_nickname
       FROM tm_gauge_score s
       LEFT JOIN tm_gauge_answer a ON s.to_answer_seq = a.answer_seq
       LEFT JOIN tm_gauge_member mt ON COALESCE(s.to_member_seq, a.member_seq) = mt.member_seq
       WHERE s.room_seq = $1 AND s.from_member_seq = $2 AND s.game_step = $3
       ORDER BY s.gauge_amount DESC`,
      [room_seq, from_member_seq, game_step]
    );
    return result.rows;
  },

  // ============================
  // HIDDEN1: 히든 게이징
  // ============================
  async getSameTableOppositeGender(room_seq, table_no, my_gender) {
    const result = await db.query(
      `SELECT member_seq, nickname, name FROM tm_gauge_member
       WHERE room_seq = $1 AND table_no = $2 AND gender != $3 AND status = 'JOINED'`,
      [room_seq, table_no, my_gender]
    );
    return result.rows;
  },

  async submitHiddenSelection(room_seq, from_member_seq, to_member_seq, game_step) {
    const step = game_step || 'HIDDEN1';
    await db.query(
      `INSERT INTO tm_gauge_hidden (room_seq, from_member_seq, to_member_seq, game_step)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_seq, from_member_seq, game_step) DO UPDATE SET to_member_seq = EXCLUDED.to_member_seq`,
      [room_seq, from_member_seq, to_member_seq, step]
    );
  },

  async getHiddenSelections(room_seq, game_step) {
    const step = game_step || 'HIDDEN1';
    const result = await db.query(
      `SELECT h.*, mf.name AS from_name, mf.nickname AS from_nickname,
              mt.name AS to_name, mt.nickname AS to_nickname
       FROM tm_gauge_hidden h
       JOIN tm_gauge_member mf ON h.from_member_seq = mf.member_seq
       LEFT JOIN tm_gauge_member mt ON h.to_member_seq = mt.member_seq
       WHERE h.room_seq = $1 AND h.game_step = $2`,
      [room_seq, step]
    );
    return result.rows;
  },

  async getHiddenConfirmedMembers(room_seq, game_step) {
    const step = game_step || 'HIDDEN1';
    const result = await db.query(
      `SELECT DISTINCT from_member_seq FROM tm_gauge_hidden WHERE room_seq = $1 AND game_step = $2`,
      [room_seq, step]
    );
    return result.rows.map(r => r.from_member_seq);
  },

  // ============================
  // FINAL1/2: 게이지 집계
  // ============================
  async getTotalGaugeByRoom(room_seq) {
    const result = await db.query(
      `WITH answer_score_totals AS (
         SELECT a.member_seq, COALESCE(SUM(s.gauge_amount), 0) AS score_gauge
         FROM tm_gauge_answer a
         LEFT JOIN tm_gauge_score s ON s.to_answer_seq = a.answer_seq AND s.to_member_seq IS NULL
         WHERE a.room_seq = $1
         GROUP BY a.member_seq
       ),
       member_score_totals AS (
         SELECT to_member_seq AS member_seq, COALESCE(SUM(gauge_amount), 0) AS score_gauge
         FROM tm_gauge_score
         WHERE room_seq = $1 AND to_member_seq IS NOT NULL
         GROUP BY to_member_seq
       ),
       hidden_totals AS (
         SELECT to_member_seq AS member_seq, COUNT(*) * 3 AS hidden_gauge
         FROM tm_gauge_hidden WHERE room_seq = $1 AND to_member_seq IS NOT NULL
         GROUP BY to_member_seq
       )
       SELECT m.member_seq, m.name, m.nickname, m.gender, m.table_no,
              COALESCE(ast.score_gauge, 0) + COALESCE(mst.score_gauge, 0) AS score_gauge,
              COALESCE(ht.hidden_gauge, 0) AS hidden_gauge,
              COALESCE(ast.score_gauge, 0) + COALESCE(mst.score_gauge, 0) + COALESCE(ht.hidden_gauge, 0) AS total_gauge
       FROM tm_gauge_member m
       LEFT JOIN answer_score_totals ast ON m.member_seq = ast.member_seq
       LEFT JOIN member_score_totals mst ON m.member_seq = mst.member_seq
       LEFT JOIN hidden_totals ht ON m.member_seq = ht.member_seq
       WHERE m.room_seq = $1 AND m.status = 'JOINED'
       ORDER BY total_gauge DESC`,
      [room_seq]
    );
    return result.rows;
  },

  async getGaugeDetail(room_seq, member_seq) {
    // Scores via to_answer_seq (legacy GAME1_2)
    const answerScores = await db.query(
      `SELECT s.gauge_amount, s.game_step, a.answer_text, a.question_no
       FROM tm_gauge_score s
       JOIN tm_gauge_answer a ON s.to_answer_seq = a.answer_seq
       WHERE a.room_seq = $1 AND a.member_seq = $2 AND s.gauge_amount > 0 AND s.to_member_seq IS NULL
       ORDER BY s.game_step, a.question_no`,
      [room_seq, member_seq]
    );
    // Scores via to_member_seq (new nickname-based gauge)
    const memberScores = await db.query(
      `SELECT s.gauge_amount, s.game_step, NULL AS answer_text, NULL AS question_no
       FROM tm_gauge_score s
       WHERE s.room_seq = $1 AND s.to_member_seq = $2 AND s.gauge_amount > 0
       ORDER BY s.game_step`,
      [room_seq, member_seq]
    );
    const hidden = await db.query(
      `SELECT COUNT(*) AS cnt FROM tm_gauge_hidden
       WHERE room_seq = $1 AND to_member_seq = $2`,
      [room_seq, member_seq]
    );
    return {
      scores: [...answerScores.rows, ...memberScores.rows],
      hidden_count: parseInt(hidden.rows[0].cnt),
      hidden_gauge: parseInt(hidden.rows[0].cnt) * 3
    };
  },

  // ============================
  // FINAL3: 메세지
  // ============================
  async getOppositeGenderMembers(room_seq, my_gender) {
    const result = await db.query(
      `SELECT member_seq, nickname, name FROM tm_gauge_member
       WHERE room_seq = $1 AND gender != $2 AND status = 'JOINED'`,
      [room_seq, my_gender]
    );
    return result.rows;
  },

  async sendMessage(room_seq, from_member_seq, to_member_seq, message_text) {
    const result = await db.query(
      `INSERT INTO tm_gauge_message (room_seq, from_member_seq, to_member_seq, message_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_seq, from_member_seq) DO UPDATE SET to_member_seq = EXCLUDED.to_member_seq, message_text = EXCLUDED.message_text
       RETURNING *`,
      [room_seq, from_member_seq, to_member_seq || null, message_text || null]
    );
    return result.rows[0];
  },

  async getMessagesByRoom(room_seq) {
    const result = await db.query(
      `SELECT msg.*, mf.name AS from_name, mf.nickname AS from_nickname, mf.gender AS from_gender,
              mt.name AS to_name, mt.nickname AS to_nickname, mt.gender AS to_gender
       FROM tm_gauge_message msg
       JOIN tm_gauge_member mf ON msg.from_member_seq = mf.member_seq
       LEFT JOIN tm_gauge_member mt ON msg.to_member_seq = mt.member_seq
       WHERE msg.room_seq = $1
       ORDER BY msg.cre_dtime`,
      [room_seq]
    );
    return result.rows;
  },

  async getMessagesForMember(room_seq, to_member_seq) {
    const result = await db.query(
      `SELECT msg.message_text, mf.nickname AS from_nickname
       FROM tm_gauge_message msg
       JOIN tm_gauge_member mf ON msg.from_member_seq = mf.member_seq
       WHERE msg.room_seq = $1 AND msg.to_member_seq = $2`,
      [room_seq, to_member_seq]
    );
    return result.rows;
  },

  async getMessageSentMembers(room_seq) {
    const result = await db.query(
      `SELECT DISTINCT from_member_seq FROM tm_gauge_message WHERE room_seq = $1`,
      [room_seq]
    );
    return result.rows.map(r => r.from_member_seq);
  },

  // ============================
  // FINAL4: 참석 여부
  // ============================
  async submitAttendance(room_seq, member_seq, is_attend) {
    await db.query(
      `INSERT INTO tm_gauge_attendance (room_seq, member_seq, is_attend)
       VALUES ($1, $2, $3)
       ON CONFLICT (room_seq, member_seq) DO UPDATE SET is_attend = EXCLUDED.is_attend`,
      [room_seq, member_seq, is_attend]
    );
  },

  async getAttendanceByRoom(room_seq) {
    const result = await db.query(
      `SELECT att.*, m.name, m.nickname, m.gender
       FROM tm_gauge_attendance att
       JOIN tm_gauge_member m ON att.member_seq = m.member_seq
       WHERE att.room_seq = $1`,
      [room_seq]
    );
    return result.rows;
  },

  // ============================
  // 닉네임 관리 (관리자)
  // ============================
  async getMemberBySeq(member_seq) {
    const result = await db.query(
      `SELECT * FROM tm_gauge_member WHERE member_seq = $1`,
      [member_seq]
    );
    return result.rows[0] || null;
  },

  // ============================
  // GAME2_1: 라이어 게임
  // ============================
  async generateLiarGame(room_seq) {
    // 테이블별 참여자 조회
    const membersResult = await db.query(
      `SELECT member_seq, nickname, name, gender, table_no FROM tm_gauge_member
       WHERE room_seq = $1 AND status = 'JOINED' AND table_no IS NOT NULL
       ORDER BY table_no`,
      [room_seq]
    );
    const members = membersResult.rows;
    const tables = {};
    members.forEach(m => {
      if (!tables[m.table_no]) tables[m.table_no] = [];
      tables[m.table_no].push(m);
    });

    // 기존 라이어 데이터 삭제
    await db.query(`DELETE FROM tm_gauge_liar WHERE room_seq = $1`, [room_seq]);

    // 닉네임 풀 구성 (성별별)
    const mNicks = members.filter(m => m.gender === 'M').map(m => m.nickname || m.name);
    const fNicks = members.filter(m => m.gender === 'F').map(m => m.nickname || m.name);

    for (const tableNo of Object.keys(tables)) {
      const tableMembers = tables[tableNo];
      if (tableMembers.length === 0) continue;

      // 홀수 테이블 → M 닉네임, 짝수 테이블 → F 닉네임
      let pool = parseInt(tableNo) % 2 === 1 ? 'M' : 'F';
      let nickPool = pool === 'M' ? [...mNicks] : [...fNicks];
      if (nickPool.length < 2) { pool = 'M'; nickPool = [...mNicks]; }
      if (nickPool.length < 2) continue;

      // 랜덤 닉네임 2개 선정
      const shuffled = nickPool.sort(() => Math.random() - 0.5);
      const nickA = shuffled[0];
      const nickB = shuffled[1];

      // 랜덤 라이어 1명 선정
      const liarIdx = Math.floor(Math.random() * tableMembers.length);
      const liarMember = tableMembers[liarIdx];

      await db.query(
        `INSERT INTO tm_gauge_liar (room_seq, table_no, liar_member_seq, nickname_for_liar, nickname_for_others, gender_pool)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [room_seq, parseInt(tableNo), liarMember.member_seq, nickB, nickA, pool]
      );
    }
  },

  async getLiarData(room_seq) {
    const result = await db.query(
      `SELECT l.*, m.name AS liar_name, m.nickname AS liar_nickname
       FROM tm_gauge_liar l
       JOIN tm_gauge_member m ON l.liar_member_seq = m.member_seq
       WHERE l.room_seq = $1
       ORDER BY l.table_no`,
      [room_seq]
    );
    return result.rows;
  },

  async restartLiarTable(room_seq, table_no) {
    // 기존 데이터 조회해서 성별 풀 반전
    const existing = await db.query(
      `SELECT * FROM tm_gauge_liar WHERE room_seq = $1 AND table_no = $2`,
      [room_seq, table_no]
    );

    const membersResult = await db.query(
      `SELECT member_seq, nickname, name, gender, table_no FROM tm_gauge_member
       WHERE room_seq = $1 AND status = 'JOINED' AND table_no = $2`,
      [room_seq, table_no]
    );
    const tableMembers = membersResult.rows;
    if (tableMembers.length === 0) return;

    // 전체 닉네임 풀
    const allMembers = await db.query(
      `SELECT nickname, name, gender FROM tm_gauge_member
       WHERE room_seq = $1 AND status = 'JOINED'`,
      [room_seq]
    );
    const mNicks = allMembers.rows.filter(m => m.gender === 'M').map(m => m.nickname || m.name);
    const fNicks = allMembers.rows.filter(m => m.gender === 'F').map(m => m.nickname || m.name);

    // 성별 풀 반전
    let newPool = 'M';
    if (existing.rows.length > 0) {
      newPool = existing.rows[0].gender_pool === 'M' ? 'F' : 'M';
    }
    let nickPool = newPool === 'M' ? [...mNicks] : [...fNicks];
    if (nickPool.length < 2) { newPool = 'M'; nickPool = [...mNicks]; }
    if (nickPool.length < 2) return;

    const shuffled = nickPool.sort(() => Math.random() - 0.5);
    const nickA = shuffled[0];
    const nickB = shuffled[1];

    const liarIdx = Math.floor(Math.random() * tableMembers.length);
    const liarMember = tableMembers[liarIdx];

    await db.query(`DELETE FROM tm_gauge_liar WHERE room_seq = $1 AND table_no = $2`, [room_seq, table_no]);
    await db.query(
      `INSERT INTO tm_gauge_liar (room_seq, table_no, liar_member_seq, nickname_for_liar, nickname_for_others, gender_pool)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [room_seq, table_no, liarMember.member_seq, nickB, nickA, newPool]
    );
  },

  // ============================
  // GAME3_2: 같은 테이블 답변 공개
  // ============================
  async getSameTableAnswers(room_seq, table_no, questionNos) {
    const result = await db.query(
      `SELECT a.answer_seq, a.question_no, a.answer_text, a.member_seq,
              m.nickname, m.name, m.gender
       FROM tm_gauge_answer a
       JOIN tm_gauge_member m ON a.member_seq = m.member_seq
       WHERE a.room_seq = $1 AND m.table_no = $2 AND m.status = 'JOINED'
         AND a.question_no = ANY($3)
       ORDER BY a.member_seq, a.question_no`,
      [room_seq, table_no, questionNos]
    );
    return result.rows;
  },

  // ============================
  // 내 답변 필터 (question_no 범위)
  // ============================
  async getMyAnswersByQuestions(room_seq, member_seq, questionNos) {
    const result = await db.query(
      `SELECT * FROM tm_gauge_answer
       WHERE room_seq = $1 AND member_seq = $2 AND question_no = ANY($3)
       ORDER BY question_no`,
      [room_seq, member_seq, questionNos]
    );
    return result.rows;
  }
};
