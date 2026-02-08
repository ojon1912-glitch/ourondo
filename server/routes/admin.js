const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const applymodel = require("../models/applymodel");
const Pay = require("../models/paymodel");
const payController = require("../controllers/paycontroller");

// 관리자 체크
function adminOnly(req, res, next) {
  if (!req.user || req.user.is_admin !== 1) {
    return res.status(403).json({ error: "관리자 전용 기능입니다." });
  }
  next();
}

// 신청자 목록
router.get("/apply", auth, adminOnly, async (req, res) => {
  const data = await applymodel.getAllApplies();
  res.json(data);
});

// 수락
router.post("/apply/:id/approve", auth, adminOnly, async (req, res) => {
  await applymodel.approveApply(req.params.id);
  res.json({ success: true });
});

// 거절
router.post("/apply/:id/reject", auth, adminOnly, async (req, res) => {
  await applymodel.rejectApply(req.params.id);
  res.json({ success: true });
});

// 관리자 환불 처리
router.post("/apply/:id/refund", auth, adminOnly, async (req, res) => {
  try {
    const applySeq = Number(req.params.id);

    const pay = await Pay.getPayByApplySeq(applySeq);
    if (!pay) {
      return res.status(404).json({ error: "결제 정보를 찾을 수 없습니다." });
    }
    if (pay.status !== "PA" && pay.status !== "RR") {
      return res.status(400).json({ error: "환불 가능한 상태가 아닙니다. (현재: " + pay.status + ")" });
    }

    // approve_json에서 tid 추출
    let tid = null;
    if (pay.approve_json) {
      const approveData = typeof pay.approve_json === "string"
        ? JSON.parse(pay.approve_json)
        : pay.approve_json;
      tid = approveData.tid || approveData.TID || null;
    }
    if (!tid) {
      return res.status(400).json({ error: "결제 승인 정보(TID)를 찾을 수 없습니다." });
    }

    const mid = pay.mid || process.env.INICIS_MID;
    const cancelResult = await payController.cancelPayment(mid, tid, "관리자 환불 처리");

    await Pay.markRefunded(pay.oid, cancelResult);
    res.json({ success: true, result: cancelResult });
  } catch (err) {
    console.error("관리자 환불 처리 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
});

module.exports = router;
