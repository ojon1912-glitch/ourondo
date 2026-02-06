const Qna = require("../models/qnamodel");

// =============================
// QnA 리스트
// =============================
exports.getList = async (req, res) => {
  try {
    const result = await Qna.getQnaList();
    res.json(result.rows);
  } catch (err) {
    console.error("QnA 리스트 오류:", err);
    res.status(500).json({ error: "QnA 리스트 조회 중 서버 오류" });
  }
};

// =============================
// QnA 상세
// =============================
exports.getDetail = async (req, res) => {
  try {
    const { qna_seq } = req.params;
    
    console.log("🔥 [DEBUG] req.user =", req.user);  // ← 여기에 넣기!!!

    const result = await Qna.getQnaBySeq(qna_seq);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "존재하지 않는 QnA 글입니다." });

    const data = result.rows[0];

const tokenUser = req.user; // 로그인 안했어도 undefined
const isMine = tokenUser && tokenUser.user_seq === data.user_seq;
const isAdmin = tokenUser && Number(tokenUser.is_admin) === 1;  // 🔥 타입 변환 필수

// 비밀글 접근 제한
if (data.is_secret === 1 && !(isMine || isAdmin)) {
  return res.json({
    qna_seq: data.qna_seq,
    title: data.title,
    content: "비밀글입니다.",
    user_name: data.user_name,
    user_id: data.user_id,
    cre_dtime: data.cre_dtime,
    is_secret: 1,
    replies: []
  });
}




    // 답변 로드
    const replyResult = await Qna.getReplies(qna_seq);

    return res.json({
      ...data,
      replies: replyResult.rows
    });

  } catch (err) {
    console.error("QnA 상세 오류:", err);
    res.status(500).json({ error: "QnA 상세 조회 중 서버 오류" });
  }
};


// =============================
// QnA 작성
// =============================
exports.create = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({ error: "로그인이 필요합니다." });

    const { title, content, is_secret } = req.body;

    if (!title || !content)
      return res.status(400).json({ error: "제목과 내용을 입력해주세요." });

    const result = await Qna.createQna({
      user_seq: user.user_seq,
      title,
      content,
      is_secret: is_secret ? 1 : 0,
    });

    res.json({
      message: "QnA 글이 등록되었습니다.",
      qna_seq: result.rows[0].qna_seq,
    });

  } catch (err) {
    console.error("QnA 작성 오류:", err);
    res.status(500).json({ error: "QnA 작성 중 서버 오류" });
  }
};

// =============================
// 답변 작성
// =============================
exports.createReply = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({ error: "로그인이 필요합니다." });

    const { qna_seq } = req.params;
    const { content } = req.body;

    if (!content)
      return res.status(400).json({ error: "내용을 입력해주세요." });

    const result = await Qna.createReply({
      user_seq: user.user_seq,
      qna_seq,
      content,
    });

    res.json({
      message: "답변 등록 완료",
      qna_reply_seq: result.rows[0].qna_reply_seq,
    });

  } catch (err) {
    console.error("QnA 답변 작성 오류:", err);
    res.status(500).json({ error: "답변 작성 중 서버 오류" });
  }
};

// =============================
// QnA 수정
// =============================
exports.update = async (req, res) => {
  try {
    const user = req.user;
    const { qna_seq } = req.params;
    const { content } = req.body;

    const qna = await Qna.getQnaBySeq(qna_seq);
    if (qna.rows.length === 0)
      return res.status(404).json({ error: "글이 없습니다." });

    if (qna.rows[0].user_seq !== user.user_seq)
      return res.status(403).json({ error: "수정 권한이 없습니다." });

    await Qna.updateQna({ qna_seq, content });

    res.json({ message: "수정이 완료되었습니다." });

  } catch (err) {
    console.error("QnA 수정 오류:", err);
    res.status(500).json({ error: "QnA 수정 중 서버 오류" });
  }
};

// =============================
// QnA 삭제
// =============================
exports.remove = async (req, res) => {
  try {
    const user = req.user;
    const { qna_seq } = req.params;

    const qna = await Qna.getQnaBySeq(qna_seq);
    if (qna.rows.length === 0)
      return res.status(404).json({ error: "글이 없습니다." });

    if (qna.rows[0].user_seq !== user.user_seq)
      return res.status(403).json({ error: "삭제 권한이 없습니다." });

    await Qna.deleteQna(qna_seq);

    res.json({ message: "삭제되었습니다." });

  } catch (err) {
    console.error("QnA 삭제 오류:", err);
    res.status(500).json({ error: "QnA 삭제 중 서버 오류" });
  }
};

// =============================
// 답변 수정
// =============================
exports.updateReply = async (req, res) => {
  try {
    const user = req.user;
    const { reply_seq } = req.params;
    const { content } = req.body;

    const reply = await Qna.getReplyBySeq(reply_seq);
    if (reply.rows.length === 0)
      return res.status(404).json({ error: "답변이 없습니다." });

    if (reply.rows[0].user_seq !== user.user_seq)
      return res.status(403).json({ error: "수정 권한이 없습니다." });

    await Qna.updateReply({ qna_reply_seq: reply_seq, content });

    res.json({ message: "답변이 수정되었습니다." });

  } catch (err) {
    console.error("답변 수정 오류:", err);
    res.status(500).json({ error: "답변 수정 중 서버 오류" });
  }
};

// =============================
// 답변 삭제
// =============================
exports.deleteReply = async (req, res) => {
  try {
    const user = req.user;
    const { reply_seq } = req.params;

    const reply = await Qna.getReplyBySeq(reply_seq);
    if (reply.rows.length === 0)
      return res.status(404).json({ error: "답변이 없습니다." });

    if (reply.rows[0].user_seq !== user.user_seq)
      return res.status(403).json({ error: "삭제 권한이 없습니다." });

    await Qna.deleteReply(reply_seq);

    res.json({ message: "답변이 삭제되었습니다." });

  } catch (err) {
    console.error("답변 삭제 오류:", err);
    res.status(500).json({ error: "답변 삭제 중 서버 오류" });
  }
};

// my page 에서 내가쓴 qna 보기

exports.getMyList = async (req, res) => {
  try {
    const user = req.user;

    const result = await Qna.getMyQnaList(user.user_seq);
    res.json(result.rows);

  } catch (err) {
    console.error("내 QnA 조회 오류:", err);
    res.status(500).json({ error: "내 QnA 조회 중 서버 오류" });
  }
};
