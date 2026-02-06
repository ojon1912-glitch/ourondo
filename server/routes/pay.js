// ★ VERSION v20260206_1 (이니시스 INIpay Standard 결제 라우터 추가)

const express = require("express");
const router = express.Router();

const optionalAuth = require("../middleware/optionalauth");
const payController = require("../controllers/paycontroller");

// 결제 준비(주문 생성 + 결제창 파라미터 생성)
router.get("/ready", optionalAuth, payController.ready);

// 이니시스 returnUrl (POST) - 인증결과 수신 + 승인요청 + DB 저장 + 결과 페이지 응답
router.post("/return", payController.inicisReturn);

module.exports = router;
