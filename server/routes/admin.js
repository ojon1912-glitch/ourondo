const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const applymodel = require("../models/applymodel");

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

module.exports = router;
