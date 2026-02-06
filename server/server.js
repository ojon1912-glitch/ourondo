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

// ★ VERSION v20251230_6 (STORAGE_TYPE/R2_PUBLIC_URL 미정의 ReferenceError 방지)

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
const PUBLIC_PATH = path.join(__dirname, "..", PUBLIC_DIR); // ★ ADD(v20251230_1)
app.use(express.static(PUBLIC_PATH)); // ★ CHANGED(v20251230_1)

// ★ ADD(v20251230_6): /uploads fallback에서 참조하는 env 변수 정의(현재 코드 안정화 목적)
const STORAGE_TYPE = (process.env.STORAGE_TYPE || "local").toLowerCase();
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

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

// ★ ADD(v20251230_3): 배포(STORAGE_TYPE=r2)에서 DB에 /uploads 경로가 저장된 경우를 위한 fallback
app.use("/uploads", (req, res, next) => {
  if (STORAGE_TYPE !== "r2") return next();
  if (!R2_PUBLIC_URL) return next();

  const key = req.path.replace(/^\/+/, "");
  return res.redirect(`${R2_PUBLIC_URL}/${key}`);
});


// APPLY API
app.use("/api/apply", require("./routes/apply"));

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
// robots.txt / sitemap.xml (애드부스트 수집 안정화)
// ===============================
// ★ ADD(v20251230_1)
app.get("/robots.txt", (req, res) => {
  const filePath = path.join(PUBLIC_PATH, "robots.txt");
  res.type("text/plain");
  return res.sendFile(filePath);
});

// ★ ADD(v20251230_1)
app.get("/sitemap.xml", (req, res) => {
  const filePath = path.join(PUBLIC_PATH, "sitemap.xml");
  res.type("application/xml");
  return res.sendFile(filePath);
});

// ===============================
// 404 Not Found
// ===============================
// ★ ADD(v20251230_1)
app.use((req, res) => {
  return res.status(404).send("Not Found");
});

// ===============================
// 서버 시작
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 ${process.env.SERVICE_NAME || "ourondo"} server running at http://localhost:${PORT}`
  );
});
