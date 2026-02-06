const User = require("../models/usermodel");

// ★ ADD: 추가 정보 입력 API (WT → AA)
exports.updateProfile = async (req, res) => {
  try {
    const loginUser = req.user;

    const { name, phone, gender, birth_year } = req.body;

    if (!name || !phone || !gender || !birth_year) {
      return res.status(400).json({ error: "모든 항목을 입력해주세요." });
    }

    const result = await User.getUserBySeqAnyFlag(loginUser.user_seq);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "유저를 찾을 수 없습니다." });
    }

    const user = result.rows[0];

    if (user.flag !== 'WT') {
      return res.status(400).json({ error: "이미 추가 정보가 입력된 유저입니다." });
    }

    await User.updateProfileAndActivate({
      user_seq: user.user_seq,
      name,
      phone,
      gender,
      birth_year,
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("추가 정보 입력 오류:", err);
    return res.status(500).json({ error: "서버 오류" });
  }
};
