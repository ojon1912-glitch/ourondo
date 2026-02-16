const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Gauge = require("../models/gaugemodel");

// 관리자 체크
function adminOnly(req, res, next) {
  if (!req.user || req.user.is_admin !== 1) {
    return res.status(403).json({ error: "관리자 전용 기능입니다." });
  }
  next();
}

// ============================
// 관리자 API
// ============================

// 방 생성
router.post("/room", auth, adminOnly, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "방 제목을 입력해주세요." });
    const room = await Gauge.createRoom({ title, created_by: req.user.user_seq });
    res.json(room);
  } catch (err) {
    console.error("방 생성 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 단계 변경
router.post("/room/:id/step", auth, adminOnly, async (req, res) => {
  try {
    const { step } = req.body;
    if (!step) return res.status(400).json({ error: "step 필요" });
    await Gauge.updateRoomStep(req.params.id, step);
    // LOBBY 이외 단계로 넘어가면 PLAYING 상태로 전환
    if (step !== "LOBBY") {
      await Gauge.updateRoomStatus(req.params.id, "PLAYING");
    }
    if (step === "CLOSED") {
      await Gauge.updateRoomStatus(req.params.id, "CLOSED");
    }
    res.json({ success: true });
  } catch (err) {
    console.error("단계 변경 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 테이블 수 설정
router.post("/room/:id/table-count", auth, adminOnly, async (req, res) => {
  try {
    const { count } = req.body;
    if (!count || count < 1) return res.status(400).json({ error: "유효한 테이블 수를 입력해주세요." });
    await Gauge.updateTableCount(req.params.id, count);
    res.json({ success: true });
  } catch (err) {
    console.error("테이블 수 설정 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 참여자 거절
router.post("/room/:id/kick/:member_seq", auth, adminOnly, async (req, res) => {
  try {
    await Gauge.kickMember(req.params.member_seq);
    res.json({ success: true });
  } catch (err) {
    console.error("참여자 거절 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 방 종료
router.post("/room/:id/close", auth, adminOnly, async (req, res) => {
  try {
    await Gauge.updateRoomStatus(req.params.id, "CLOSED");
    await Gauge.updateRoomStep(req.params.id, "CLOSED");
    res.json({ success: true });
  } catch (err) {
    console.error("방 종료 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// 사용자 API
// ============================

// 열린 방 목록
router.get("/rooms", auth, async (req, res) => {
  try {
    const rooms = await Gauge.getOpenRooms();
    res.json(rooms);
  } catch (err) {
    console.error("방 목록 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 방 상태 조회 (폴링용)
router.get("/room/:id", auth, async (req, res) => {
  try {
    const room = await Gauge.getRoomBySeq(req.params.id);
    if (!room) return res.status(404).json({ error: "방을 찾을 수 없습니다." });
    const members = await Gauge.getMembers(req.params.id);
    const myMember = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    res.json({ room, members, myMember });
  } catch (err) {
    console.error("방 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 방 입장
router.post("/room/:id/join", auth, async (req, res) => {
  try {
    const room = await Gauge.getRoomBySeq(req.params.id);
    if (!room) return res.status(404).json({ error: "방을 찾을 수 없습니다." });
    if (room.status !== "WAIT") return res.status(400).json({ error: "입장할 수 없는 상태입니다." });

    // 이미 참여 중인지 확인
    const existing = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (existing) return res.json(existing);

    const { name, gender } = req.body;
    if (!name || !gender) return res.status(400).json({ error: "이름과 성별을 입력해주세요." });

    const member = await Gauge.joinRoom({
      room_seq: req.params.id,
      user_seq: req.user.user_seq,
      name,
      gender
    });
    res.json(member);
  } catch (err) {
    console.error("방 입장 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 방 나가기
router.post("/room/:id/leave", auth, async (req, res) => {
  try {
    await Gauge.leaveRoom(req.params.id, req.user.user_seq);
    res.json({ success: true });
  } catch (err) {
    console.error("방 나가기 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 닉네임 설정
router.post("/room/:id/nickname", auth, async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname) return res.status(400).json({ error: "닉네임을 입력해주세요." });
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    await Gauge.setNickname(member.member_seq, nickname);
    res.json({ success: true });
  } catch (err) {
    console.error("닉네임 설정 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 테이블 선택
router.post("/room/:id/table", auth, async (req, res) => {
  try {
    const { table_no } = req.body;
    if (table_no === undefined || table_no === null) return res.status(400).json({ error: "테이블 번호를 입력해주세요." });
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    await Gauge.setTableNo(member.member_seq, table_no);
    res.json({ success: true });
  } catch (err) {
    console.error("테이블 선택 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 참여자 목록
router.get("/room/:id/members", auth, async (req, res) => {
  try {
    const members = await Gauge.getMembers(req.params.id);
    res.json(members);
  } catch (err) {
    console.error("참여자 목록 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// GAME1_1: 질문 답변
// ============================
router.post("/room/:id/answer", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const { answers } = req.body;
    if (!answers || answers.length < 2) return res.status(400).json({ error: "두 개의 답변을 모두 입력해주세요." });
    await Gauge.submitAnswers(req.params.id, member.member_seq, answers);
    res.json({ success: true });
  } catch (err) {
    console.error("답변 제출 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/room/:id/answers", auth, async (req, res) => {
  try {
    // question_nos 쿼리 파라미터 지원
    let questionNos = null;
    if (req.query.question_nos) {
      questionNos = req.query.question_nos.split(",").map(Number);
    }
    const answers = await Gauge.getAnswersByRoom(req.params.id);
    const submitted = await Gauge.getSubmittedMembers(req.params.id, questionNos);
    if (req.user.is_admin === 1) {
      return res.json({ answers, submittedMembers: submitted });
    }
    // 일반 유저: 제출 상태만
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    let myAnswers = [];
    if (member) {
      myAnswers = questionNos
        ? await Gauge.getMyAnswersByQuestions(req.params.id, member.member_seq, questionNos)
        : await Gauge.getMyAnswers(req.params.id, member.member_seq);
    }
    res.json({ myAnswers, submittedMembers: submitted });
  } catch (err) {
    console.error("답변 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// GAME1_2: 게이지 배분
// ============================
router.get("/room/:id/game-answers", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    let questionNos = null;
    if (req.query.question_nos) {
      questionNos = req.query.question_nos.split(",").map(Number);
    }
    const answers = await Gauge.getOppositeGenderAnswers(req.params.id, member.gender, questionNos);
    // 익명화: member_seq를 person 단위 그룹핑용 임시ID로 변환, member_seq도 반환
    let personMap = {};
    let personIdx = 0;
    const anonymized = answers.map(a => {
      if (!personMap[a.member_seq]) personMap[a.member_seq] = ++personIdx;
      return { answer_seq: a.answer_seq, question_no: a.question_no, answer_text: a.answer_text, person_id: personMap[a.member_seq], member_seq: a.member_seq };
    });
    res.json(anonymized);
  } catch (err) {
    console.error("게임 답변 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/room/:id/gauge-score", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const { scores, game_step } = req.body;
    if (!scores || !game_step) return res.status(400).json({ error: "점수 데이터가 필요합니다." });
    const total = scores.reduce((sum, s) => sum + (s.gauge_amount || 0), 0);
    if (total > 7) return res.status(400).json({ error: "게이지 합계는 7을 초과할 수 없습니다." });
    await Gauge.submitGaugeScores(req.params.id, member.member_seq, scores.map(s => ({
      to_answer_seq: s.answer_seq || null,
      to_member_seq: s.to_member_seq || null,
      gauge_amount: s.gauge_amount
    })), game_step);
    res.json({ success: true });
  } catch (err) {
    console.error("게이지 제출 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/room/:id/gauge-scores", auth, adminOnly, async (req, res) => {
  try {
    const game_step = req.query.game_step || "GAME1_2";
    const scores = await Gauge.getScoresByRoom(req.params.id, game_step);
    const confirmed = await Gauge.getGaugeConfirmedMembers(req.params.id, game_step);
    res.json({ scores, confirmedMembers: confirmed });
  } catch (err) {
    console.error("게이지 점수 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// TALK1: 내 답변 + 내가 준 게이지
// ============================
router.get("/room/:id/my-talk-data", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const gameStep = req.query.game_step || "GAME1_2";
    let questionNos = null;
    if (req.query.question_nos) {
      questionNos = req.query.question_nos.split(",").map(Number);
    }
    const myAnswers = questionNos
      ? await Gauge.getMyAnswersByQuestions(req.params.id, member.member_seq, questionNos)
      : await Gauge.getMyAnswers(req.params.id, member.member_seq);
    const givenGauges = await Gauge.getMyGivenScores(req.params.id, member.member_seq, gameStep);
    res.json({ myAnswers, givenGauges });
  } catch (err) {
    console.error("대화 데이터 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// HIDDEN1: 히든 게이징
// ============================
router.get("/room/:id/hidden-targets", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    if (!member.table_no) return res.json([]);
    const targets = await Gauge.getSameTableOppositeGender(req.params.id, member.table_no, member.gender);
    res.json(targets);
  } catch (err) {
    console.error("히든 대상 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/room/:id/hidden-select", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const { to_member_seq, game_step } = req.body;
    // to_member_seq가 null이면 "없음" 선택
    await Gauge.submitHiddenSelection(req.params.id, member.member_seq, to_member_seq || null, game_step || 'HIDDEN1');
    res.json({ success: true });
  } catch (err) {
    console.error("히든 선택 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/room/:id/hidden-status", auth, adminOnly, async (req, res) => {
  try {
    const gameStep = req.query.game_step || 'HIDDEN1';
    const selections = await Gauge.getHiddenSelections(req.params.id, gameStep);
    const confirmed = await Gauge.getHiddenConfirmedMembers(req.params.id, gameStep);
    res.json({ selections, confirmedMembers: confirmed });
  } catch (err) {
    console.error("히든 상태 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// FINAL1/2: 게이지 집계
// ============================
router.get("/room/:id/gauge-totals", auth, async (req, res) => {
  try {
    const totals = await Gauge.getTotalGaugeByRoom(req.params.id);
    if (req.user.is_admin === 1) {
      return res.json({ members: totals });
    }
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const myTotal = totals.find(t => t.member_seq === member.member_seq);
    const detail = await Gauge.getGaugeDetail(req.params.id, member.member_seq);
    res.json({ myTotal, detail });
  } catch (err) {
    console.error("게이지 집계 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/room/:id/gauge-top", auth, async (req, res) => {
  try {
    const totals = await Gauge.getTotalGaugeByRoom(req.params.id);
    const topM = totals.find(t => t.gender === "M") || null;
    const topF = totals.find(t => t.gender === "F") || null;
    if (req.user.is_admin === 1) {
      return res.json({ topM, topF });
    }
    res.json({
      topM: topM ? { nickname: topM.nickname, total_gauge: topM.total_gauge } : null,
      topF: topF ? { nickname: topF.nickname, total_gauge: topF.total_gauge } : null
    });
  } catch (err) {
    console.error("게이지 톱 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// FINAL3: 메세지
// ============================
router.get("/room/:id/message-targets", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const targets = await Gauge.getOppositeGenderMembers(req.params.id, member.gender);
    res.json(targets);
  } catch (err) {
    console.error("메세지 대상 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/room/:id/message", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const { to_member_seq, message_text } = req.body;
    // to_member_seq와 message_text 모두 null 허용 ("보내지 않음")
    await Gauge.sendMessage(req.params.id, member.member_seq, to_member_seq || null, message_text || null);
    res.json({ success: true });
  } catch (err) {
    console.error("메세지 전송 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/room/:id/messages", auth, adminOnly, async (req, res) => {
  try {
    const messages = await Gauge.getMessagesByRoom(req.params.id);
    const sentMembers = await Gauge.getMessageSentMembers(req.params.id);
    res.json({ messages, sentMembers });
  } catch (err) {
    console.error("메세지 목록 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// FINAL4: 받은 메세지 + 참석
// ============================
router.get("/room/:id/my-messages", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const messages = await Gauge.getMessagesForMember(req.params.id, member.member_seq);
    res.json(messages);
  } catch (err) {
    console.error("받은 메세지 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/room/:id/attendance", auth, async (req, res) => {
  try {
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const { is_attend } = req.body;
    if (is_attend === undefined) return res.status(400).json({ error: "참석 여부를 선택해주세요." });
    await Gauge.submitAttendance(req.params.id, member.member_seq, is_attend);
    res.json({ success: true });
  } catch (err) {
    console.error("참석 여부 제출 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/room/:id/attendance", auth, adminOnly, async (req, res) => {
  try {
    const attendance = await Gauge.getAttendanceByRoom(req.params.id);
    res.json(attendance);
  } catch (err) {
    console.error("참석 현황 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// 관리자 닉네임 수정
// ============================
router.patch("/room/:id/member/:member_seq/nickname", auth, adminOnly, async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname) return res.status(400).json({ error: "닉네임을 입력해주세요." });
    const member = await Gauge.getMemberBySeq(req.params.member_seq);
    if (!member) return res.status(404).json({ error: "참여자를 찾을 수 없습니다." });
    await Gauge.setNickname(req.params.member_seq, nickname);
    res.json({ success: true });
  } catch (err) {
    console.error("닉네임 수정 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// GAME2_1: 라이어 게임
// ============================
router.post("/room/:id/liar/generate", auth, adminOnly, async (req, res) => {
  try {
    await Gauge.generateLiarGame(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("라이어 게임 생성 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/room/:id/liar", auth, async (req, res) => {
  try {
    const liarData = await Gauge.getLiarData(req.params.id);
    if (req.user.is_admin === 1) {
      return res.json({ liarData, isAdmin: true });
    }
    // 일반 유저: 자신의 테이블 라이어 데이터만
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    const myTable = liarData.find(l => l.table_no === member.table_no);
    if (!myTable) return res.json({ word: null, isLiar: false });
    const isLiar = myTable.liar_member_seq === member.member_seq;
    res.json({
      word: isLiar ? myTable.nickname_for_liar : myTable.nickname_for_others,
      isLiar
    });
  } catch (err) {
    console.error("라이어 데이터 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

router.post("/room/:id/liar/restart/:table_no", auth, adminOnly, async (req, res) => {
  try {
    await Gauge.restartLiarTable(req.params.id, Number(req.params.table_no));
    res.json({ success: true });
  } catch (err) {
    console.error("라이어 재시작 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ============================
// GAME3_2: 같은 테이블 답변 공개
// ============================
router.get("/room/:id/table-answers", auth, async (req, res) => {
  try {
    const questionNos = req.query.question_nos ? req.query.question_nos.split(",").map(Number) : [5, 6];
    if (req.user.is_admin === 1) {
      // 관리자: 전체 답변
      const answers = await Gauge.getAnswersByRoom(req.params.id);
      const filtered = answers.filter(a => questionNos.includes(a.question_no));
      return res.json(filtered);
    }
    const member = await Gauge.getMemberByUser(req.params.id, req.user.user_seq);
    if (!member) return res.status(404).json({ error: "참여 정보를 찾을 수 없습니다." });
    if (!member.table_no) return res.json([]);
    const answers = await Gauge.getSameTableAnswers(req.params.id, member.table_no, questionNos);
    res.json(answers);
  } catch (err) {
    console.error("테이블 답변 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
