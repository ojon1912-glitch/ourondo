const express = require("express");
const router = express.Router();
const qnaController = require("../controllers/qnacontroller");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalauth");

// 1) QnA 전체 리스트
router.get("/", optionalAuth, qnaController.getList);

// 2) 내가 쓴 글 리스트 (⭐ 숫자보다 위에 있어야 함)
router.get("/my", auth, qnaController.getMyList);

// 3) QnA 상세보기 (숫자)
router.get("/:qna_seq", optionalAuth, qnaController.getDetail);

// 4) 글 작성
router.post("/", auth, qnaController.create);

// 5) 답변 작성
router.post("/:qna_seq/reply", auth, qnaController.createReply);

// 6) 글 수정, 삭제
router.put("/:qna_seq", auth, qnaController.update);
router.delete("/:qna_seq", auth, qnaController.remove);

// 7) 답변 수정, 삭제
router.put("/reply/:reply_seq", auth, qnaController.updateReply);
router.delete("/reply/:reply_seq", auth, qnaController.deleteReply);

module.exports = router;
