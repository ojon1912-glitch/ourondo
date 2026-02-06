const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ★ VERSION v20251230_5 (STORAGE_TYPE 대소문자/공백 정규화 + 안전 fallback)

const STORAGE_TYPE_RAW = process.env.STORAGE_TYPE || "local"; // ★ ADD(v20251230_5)
const STORAGE_TYPE = String(STORAGE_TYPE_RAW).trim().toLowerCase(); // ★ CHANGED(v20251230_5)

/* ============================
   LOCAL STORAGE (disk)
============================ */
let storage;

// ★ ADD(v20251230_5): local 외 값이 들어와도 기본은 local로 fallback
const isLocal = STORAGE_TYPE === "local"; // ★ ADD(v20251230_5)
const isR2 = STORAGE_TYPE === "r2"; // ★ ADD(v20251230_5)

if (isLocal || (!isLocal && !isR2)) { // ★ CHANGED(v20251230_5)
  const uploadPath = path.join(__dirname, "../../uploads");

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, unique + ext);
    },
  });
}

/* ============================
   R2 STORAGE (memory)
============================ */
if (isR2) { // ★ CHANGED(v20251230_5)
  storage = multer.memoryStorage();
}

/* ============================
   EXPORT
============================ */
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
