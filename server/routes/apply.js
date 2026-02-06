const express = require("express");
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
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "job_file", maxCount: 1 },
  ]),
  applyController.create
);

module.exports = router;
