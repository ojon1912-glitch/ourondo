const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const reviewModel = require("../models/reviewmodel");
const applyModel = require("../models/applymodel");
const Point = require("../models/pointmodel");

// [공개] 상품 타입별 리뷰 목록 (페이지네이션)
// GET /api/review?product_type=1&page=1&limit=5
router.get("/", async (req, res) => {
  try {
    const product_type = Number(req.query.product_type) || 1;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const data = await reviewModel.getReviewsByProductType(product_type, page, limit);
    res.json(data);
  } catch (err) {
    console.error("리뷰 목록 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// [인증] 리뷰 작성
// POST /api/review
router.post("/", auth, async (req, res) => {
  try {
    const { apply_seq, review_desc } = req.body;
    const user_seq = req.user.user_seq;
    const user_id = req.user.user_id;

    if (!apply_seq || !review_desc || !review_desc.trim()) {
      return res.status(400).json({ error: "신청번호와 리뷰 내용을 입력해주세요." });
    }

    // 본인 신청건인지 확인
    const apply = await applyModel.getApplyBySeq(apply_seq);
    if (!apply || apply.user_seq !== user_seq) {
      return res.status(403).json({ error: "본인의 신청건만 리뷰를 작성할 수 있습니다." });
    }

    // 참여확인 상태인지 확인
    if (apply.is_confirmed !== 1) {
      return res.status(400).json({ error: "참여확인된 신청건만 리뷰를 작성할 수 있습니다." });
    }

    // 이미 리뷰를 작성했는지 확인
    const existing = await reviewModel.getReviewByApplySeq(apply_seq);
    if (existing) {
      return res.status(400).json({ error: "이미 이 신청건에 대한 리뷰를 작성했습니다." });
    }

    // 리뷰 생성
    const review = await reviewModel.createReview({
      user_seq,
      user_id,
      apply_seq,
      review_desc: review_desc.trim(),
      product_type: apply.product_type,
    });

    // 적립금 지급
    const already = await Point.hasEarnedForApply(user_seq, apply_seq);
    if (!already) {
      const pointAmount = await Point.getPointConfig(Number(apply.product_type));
      if (pointAmount > 0) {
        await Point.earnPoint({
          user_seq,
          apply_seq,
          amount: pointAmount,
          description: `리뷰 작성 적립 (${Number(apply.product_type) === 1 ? "Classic" : "Spark"})`
        });
      }
    }

    res.json({ success: true, review_seq: review.review_seq });
  } catch (err) {
    console.error("리뷰 작성 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
