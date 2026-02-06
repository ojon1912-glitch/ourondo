// 항상 로딩 (경로용)
require("dotenv").config({ path: ".env.path" });

// ===============================
// dotenv (로컬 전용)
// ===============================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const path = require("path");

// DB 연결
require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// 미들웨어
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🔥 로그인(form) 때문에 필수
app.use(cors());

// ===============================
// 정적 파일 경로
// ===============================
const PUBLIC_DIR = process.env.PUBLIC_DIR || "public";
app.use(express.static(path.join(__dirname, "..", PUBLIC_DIR)));

// ===============================
// API 라우터
// ===============================

// TODOS API
if (process.env.API_TODOS) {
  app.use(
    process.env.API_TODOS,
    require(path.join(__dirname, "routes", "todos"))
  );
}

// AUTH API (기존 로그인 / 회원가입용)
let authRouter = null;
try {
  authRouter = require(path.join(__dirname, "routes", "auth"));
} catch (e) {
  authRouter = null;
}

// ✅ /api/auth 유지 (프론트가 이걸로 때릴 가능성이 높음)
if (process.env.API_AUTH && authRouter) {
  app.use(process.env.API_AUTH, authRouter);
}

// ✅ 카카오 로그인용 /auth 유지 (기존 유지)
if (authRouter) {
  app.use("/auth", authRouter);
}

// QNA API
if (process.env.API_QNA) {
  app.use(
    process.env.API_QNA,
    require(path.join(__dirname, "routes", "qna"))
  );
}

// ===============================
// 파일 업로드 정적 제공 (로컬 개발용)
// ===============================
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// APPLY API
app.use("/api/apply", require("./routes/apply"));

// ★ VERSION v20260206_1 (이니시스 결제 API 추가)
app.use("/api/pay", require("./routes/pay")); // ★ ADD v20260206_1

// admin 전용 페이지
app.use("/api/admin", require("./routes/admin"));

// mypage
app.use("/api/mypage", require("./routes/mypage"));

// ===============================
// Health check
// ===============================
app.get("/health", (_, res) => {
  res.status(200).send("OK");
});

// ===============================
// kakao login 
// ===============================
app.use("/api/user", require("./routes/user"));

// ===============================
// 서버 시작
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 ${process.env.SERVICE_NAME || "ourondo"} server running at http://localhost:${PORT}`
  );
});
