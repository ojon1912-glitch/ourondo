// ★ VERSION v20251230_1 (apply 자동채움용 프로필 조회 API 추가)

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/usercontroller");

// ★ ADD
const User = require("../models/usermodel");

// ★ ADD: apply 자동채움: 내 프로필 조회
router.get("/profile", auth, async (req, res) => {
  try {
    const loginUser = req.user;

    if (!loginUser || !loginUser.user_seq) {
      return res.status(401).json({ error: "로그인이 필요한 기능입니다." });
    }

    const result = await User.getUserBySeqAnyFlag(loginUser.user_seq);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "회원 정보를 찾을 수 없습니다." });
    }

    const user = result.rows[0];

    if (user.flag === "DD") {
      return res.status(403).json({ error: "탈퇴된 계정입니다." });
    }

    // 자동채움에 필요한 값만 안전하게 내려줌 (user_pw 등 민감정보 제외)
    return res.json({
      user_seq: user.user_seq,
      user_id: user.user_id,
      user_name: user.user_name,
      name: user.name ?? null,
      phone: user.phone ?? null,
      gender: user.gender ?? null,
      birth_year: user.birth_year ?? null,
      flag: user.flag,
      is_admin: user.is_admin,
    });
  } catch (err) {
    console.error("프로필 조회 오류:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
});

// ★ ADD: 추가 정보 입력
router.patch("/profile", auth, userController.updateProfile);

module.exports = router;
