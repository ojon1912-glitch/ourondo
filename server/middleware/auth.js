const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // 1) Authorization 헤더 확인
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "로그인이 필요한 기능입니다." });
    }

    // 2) "Bearer 토큰" 형태인지 확인
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "유효하지 않은 토큰 형식입니다." });
    }

    // 3) JWT 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) 검증 완료 → 요청에 user 정보 주입
    req.user = decoded;

    next(); // 다음 단계(controller)로 이동

  } catch (err) {
    console.error("JWT 인증 실패:", err);

    // 만료 or 위조된 토큰 처리
    return res.status(401).json({ error: "토큰이 유효하지 않거나 만료되었습니다." });
  }
};
