const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// =============================
// 로그인
// =============================
exports.login = async (req, res) => {
  const { user_id, user_pw } = req.body;

  if (!user_id || !user_pw) {
    return res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요." });
  }

  const result = await User.getUserById(user_id);
  if (result.rows.length === 0) {
    return res.status(400).json({ error: "존재하지 않는 아이디입니다." });
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(user_pw, user.user_pw);
  if (!isMatch) {
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
  }

  const token = jwt.sign(
    {
      user_seq: user.user_seq,
      user_id: user.user_id,
      user_name: user.user_name,
      is_admin: user.is_admin,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "1h" }
  );

  res.json({
    message: "로그인 성공",
    token,
    user: {
      user_seq: user.user_seq,
      user_id: user.user_id,
      user_name: user.user_name,
      is_admin: user.is_admin,
    },
  });
};


// =============================
// 회원가입
// =============================
exports.signup = async (req, res) => {
  try {
    console.log("회원가입 요청:", req.body);

    const { user_id, user_pw, user_name } = req.body;

    if (!user_id || !user_pw) {
      return res.status(400).json({ error: "아이디와 비밀번호는 필수입니다." });
    }

    const existed = await User.getUserById(user_id);
    if (existed.rows.length > 0) {
      return res.status(400).json({ error: "이미 존재하는 아이디입니다." });
    }

    const hashedPw = await bcrypt.hash(user_pw, 10);

    const result = await User.createUser({
      user_id,
      user_pw: hashedPw,
      user_name,
    });

    const newUser = result.rows[0];

    const token = jwt.sign(
      {
        user_seq: newUser.user_seq,
        user_id: newUser.user_id,
        user_name: newUser.user_name,
        is_admin: newUser.is_admin ?? 0,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "2h" }
    );

    return res.json({
      message: "회원가입 및 로그인 성공",
      token,
      user: {
        user_seq: newUser.user_seq,
        user_id: newUser.user_id,
        user_name: newUser.user_name,
        is_admin: newUser.is_admin ?? 0,
      }
    });

  } catch (err) {
    console.error("회원가입 오류:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
};



// =============================
// 비밀번호 변경
// =============================
exports.changePassword = async (req, res) => {
  try {
    const loginUser = req.user;

    if (!loginUser) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const { current_pw, new_pw } = req.body;

    if (!current_pw || !new_pw) {
      return res.status(400).json({ error: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요." });
    }

    const result = await User.getUserBySeq(loginUser.user_seq);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "회원 정보를 찾을 수 없습니다." });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(current_pw, user.user_pw);
    if (!isMatch) {
      return res.status(401).json({ error: "현재 비밀번호가 일치하지 않습니다." });
    }

    const hashedPw = await bcrypt.hash(new_pw, 10);

    await User.updatePassword({
      user_seq: user.user_seq,
      user_pw: hashedPw,
    });

    return res.json({ message: "비밀번호가 성공적으로 변경되었습니다." });

  } catch (err) {
    console.error("비밀번호 변경 오류:", err);
    res.status(500).json({ error: "비밀번호 변경 중 서버 오류" });
  }
};


// ===============================
// 회원 탈퇴
// ===============================
exports.deleteAccount = async (req, res) => {
  try {
    // ★ REMOVED
    // 비밀번호 기반 탈퇴 로직 제거
    // const { user_pw } = req.body;

    // ★ ADD
    // JWT 미들웨어(auth.js)에서 주입된 값
    const { user_seq } = req.user;

    if (!user_seq) {
      return res.status(401).json({ error: "인증 정보가 없습니다." });
    }

    // ★ ADD
    // 이미 탈퇴한 유저인지 확인 (flag 상관없이 조회)
    const userResult = await User.getUserBySeqAnyFlag(user_seq);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    const user = userResult.rows[0];

    if (user.flag === "DD") {
      return res.status(400).json({ error: "이미 탈퇴된 계정입니다." });
    }

    // ★ ADD
    // 소프트 탈퇴 처리
    await User.deleteUser(user_seq);

    return res.json({ success: true });

  } catch (err) {
    console.error("회원탈퇴 오류:", err);
    return res.status(500).json({ error: "회원탈퇴 중 서버 오류" });
  }
};

