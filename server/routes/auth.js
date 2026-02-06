// ★ VERSION v20251230_1 (apply 자동채움용 프로필 조회 API 추가)

const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");

const authController = require("../controllers/authcontroller");
const auth = require("../middleware/auth");
const db = require("../db");

// ★ ADD
const User = require("../models/usermodel");

/* =========================
   기존 로컬 인증
========================= */

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.put("/password", auth, authController.changePassword);
router.delete("/delete", auth, authController.deleteAccount);

router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

/* =========================
   apply 자동채움: 내 프로필 조회
========================= */
// ★ ADD
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

/* =========================
   카카오 로그인
========================= */

router.get("/kakao", (req, res) => {
  const kakaoAuthUrl =
    "https://kauth.kakao.com/oauth/authorize?" +
    `client_id=${process.env.KAKAO_CLIENT_ID}` +
    `&redirect_uri=${process.env.KAKAO_REDIRECT_URI}` +
    "&response_type=code";

  res.redirect(kakaoAuthUrl);
});

router.get("/kakao/callback", async (req, res) => {
  const { code } = req.query;

  try {
    /* 1️⃣ 카카오 access token 요청 */
    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_CLIENT_ID,
          client_secret: process.env.KAKAO_CLIENT_SECRET || undefined,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
        },
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    /* 2️⃣ 카카오 사용자 정보 조회 */
    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoUser = userRes.data;
    const kakaoId = kakaoUser.id;
    const nickname = kakaoUser.properties?.nickname || "카카오유저";

    /* 3️⃣ 기존 유저 조회 */
    const result = await db.query(
      `
      SELECT *
        FROM tm_user
       WHERE kakao_id = $1
       LIMIT 1
      `,
      [kakaoId]
    );

    let user = result.rows[0];

    /* 4️⃣ 유저 분기 처리 */
    if (!user) {
      // 신규 가입
      const insert = await db.query(
        `
        INSERT INTO tm_user
          (user_id, user_pw, user_name, kakao_id, login_type, flag)
        VALUES
          ($1, 'KAKAO', $2, $3, 'KAKAO', 'WT')
        RETURNING *
        `,
        [`kakao_${kakaoId}`, nickname, kakaoId]
      );
      user = insert.rows[0];
    } 
    // ★ ADD: 탈퇴 유저 재가입 처리
    else if (user.flag === 'DD') {
      const revive = await db.query(
        `
        UPDATE tm_user
           SET flag = 'WT'
         WHERE user_seq = $1
        RETURNING *
        `,
        [user.user_seq]
      );
      user = revive.rows[0];
    }

    /* 5️⃣ JWT 발급 */
    const token = jwt.sign(
      {
        user_seq: user.user_seq,
        user_id: user.user_id,
        user_name: user.user_name,
        flag: user.flag,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`/auth/kakao-success.html?token=${token}`);

  } catch (err) {
    console.error("카카오 로그인 에러:", err);
    res.redirect("/auth/login.html?error=kakao");
  }
});

module.exports = router;
