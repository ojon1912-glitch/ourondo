const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const applymodel = require("../models/applymodel");
const Pay = require("../models/paymodel");

router.get("/apply", auth, async (req, res) => {
  const userSeq = req.user.user_seq;
  const list = await applymodel.getMyApplies(userSeq);
  res.json(list);
});

// 사용자 환불 신청
router.post("/apply/:id/refund", auth, async (req, res) => {
  try {
    const applySeq = Number(req.params.id);
    const userSeq = req.user.user_seq;

    // 본인 신청건인지 확인
    const apply = await applymodel.getApplyBySeq(applySeq);
    if (!apply || apply.user_seq !== userSeq) {
      return res.status(403).json({ error: "본인의 신청건만 환불 신청할 수 있습니다." });
    }

    // 결제 정보 확인
    const pay = await Pay.getPayByApplySeq(applySeq);
    if (!pay || pay.status !== "PA") {
      return res.status(400).json({ error: "결제 완료 상태에서만 환불 신청이 가능합니다." });
    }

    await Pay.markRefundRequested(pay.oid);
    res.json({ success: true });
  } catch (err) {
    console.error("환불 신청 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
