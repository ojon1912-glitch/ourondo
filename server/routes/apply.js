const express = require("express");
const multer = require("multer");
const router = express.Router();

// ★ VERSION v20260206_1 (비회원 신청 허용을 위해 optionalauth 적용)
// const auth = require("../middleware/auth"); // ★ REMOVED(v20260206_1)
const optionalAuth = require("../middleware/optionalauth"); // ★ ADD v20260206_1
const upload = require("../middleware/upload");
const applyController = require("../controllers/applycontroller");

// photos 여러장 + job_file 1개
router.post(
  "/",
  // auth, // ★ REMOVED(v20260206_1)
  optionalAuth, // ★ CHANGED(v20260206_1)
  (req, res, next) => {
    upload.fields([
      { name: "photos", maxCount: 10 },
      { name: "job_file", maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "파일 크기가 너무 큽니다. 50MB 이하로 업로드해주세요." });
        }
        return res.status(400).json({ error: `업로드 오류: ${err.message}` });
      }
      if (err) {
        return res.status(500).json({ error: "파일 업로드 중 오류가 발생했습니다." });
      }
      next();
    });
  },
  applyController.create
);

module.exports = router;
