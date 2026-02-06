
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 토큰이 없으면 req.user = undefined, 그냥 통과
  if (!authHeader) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = undefined; // 토큰이 잘못돼도 로그인 없는 것으로 처리
  }

  next();
};
