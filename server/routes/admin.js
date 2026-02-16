const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const applymodel = require("../models/applymodel");
const Pay = require("../models/paymodel");
const payController = require("../controllers/paycontroller");
const Point = require("../models/pointmodel");
const User = require("../models/usermodel");

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

// 참여확인
router.post("/apply/:id/confirm", auth, adminOnly, async (req, res) => {
  try {
    const applySeq = Number(req.params.id);

    const apply = await applymodel.getApplyBySeq(applySeq);
    if (!apply || apply.flag !== "PS") {
      return res.status(400).json({ error: "수락 상태인 신청건만 참여확인할 수 있습니다." });
    }

    const pay = await Pay.getPayByApplySeq(applySeq);
    if (!pay || pay.status !== "PA") {
      return res.status(400).json({ error: "결제 완료된 신청건만 참여확인할 수 있습니다." });
    }

    await applymodel.confirmApply(applySeq);
    res.json({ success: true });
  } catch (err) {
    console.error("참여확인 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ─── 사용자 관리 ───

// 사용자 목록 조회 (검색/필터)
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const { search, flag } = req.query;
    const result = await User.getAllUsers({ search: search || "", flag: flag || "" });

    const users = [];
    for (const user of result.rows) {
      const balance = await Point.getBalance(user.user_seq);
      users.push({ ...user, point_balance: balance });
    }

    res.json(users);
  } catch (err) {
    console.error("사용자 목록 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 사용자 flag 변경
router.patch("/user/:id/flag", auth, adminOnly, async (req, res) => {
  try {
    const userSeq = Number(req.params.id);
    const { flag } = req.body;

    const validFlags = ["AA", "WT", "DD"];
    if (!validFlags.includes(flag)) {
      return res.status(400).json({ error: "유효하지 않은 상태값입니다. (AA, WT, DD)" });
    }

    if (userSeq === req.user.user_seq) {
      return res.status(400).json({ error: "자신의 상태는 변경할 수 없습니다." });
    }

    const userResult = await User.getUserBySeqAnyFlag(userSeq);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    await User.updateUserFlag(userSeq, flag);
    res.json({ success: true });
  } catch (err) {
    console.error("사용자 flag 변경 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// 관리자 적립금 부여/차감
router.post("/user/:id/point", auth, adminOnly, async (req, res) => {
  try {
    const userSeq = Number(req.params.id);
    const { amount, description } = req.body;

    if (!amount || !Number.isInteger(amount) || amount === 0) {
      return res.status(400).json({ error: "유효한 적립금 금액을 입력해주세요." });
    }

    const absAmount = Math.abs(amount);
    if (absAmount > 100000) {
      return res.status(400).json({ error: "1회 최대 금액은 100,000원입니다." });
    }

    const userResult = await User.getUserBySeqAnyFlag(userSeq);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    if (amount < 0) {
      // 차감
      const balance = await Point.getBalance(userSeq);
      if (balance < absAmount) {
        return res.status(400).json({ error: `잔액이 부족합니다. (현재 잔액: ${balance.toLocaleString()}원)` });
      }
      await Point.adminDeductPoint({
        user_seq: userSeq,
        amount: absAmount,
        description: description || "관리자 직접 차감",
      });
    } else {
      // 부여
      await Point.adminEarnPoint({
        user_seq: userSeq,
        amount,
        description: description || "관리자 직접 부여",
      });
    }

    const newBalance = await Point.getBalance(userSeq);
    res.json({ success: true, newBalance });
  } catch (err) {
    console.error("적립금 부여/차감 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
