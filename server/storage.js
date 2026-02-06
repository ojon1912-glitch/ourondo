const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("./r2");

// ★ VERSION v20251230_3 (STORAGE_TYPE 대소문자 대응 + R2_PUBLIC_URL trailing slash 정리)
const STORAGE_TYPE = (process.env.STORAGE_TYPE || "local").toLowerCase(); // ★ CHANGED(v20251230_3)
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""); // ★ CHANGED(v20251230_3)

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function filename(originalname) {
  const ext = path.extname(originalname || "");
  return `${crypto.randomUUID()}${ext}`;
}

/* ======================
   LOCAL
====================== */
async function saveLocal(file, folder) {
  const baseDir = path.join(__dirname, "..", "uploads", folder);
  ensureDir(baseDir);

  const name = filename(file.originalname);
  const fullPath = path.join(baseDir, name);

  await fs.promises.writeFile(fullPath, file.buffer);

  return {
    key: `${folder}/${name}`,
    url: `/uploads/${folder}/${name}`,
  };
}

/* ======================
   R2
====================== */
async function saveR2(file, folder) {
  const name = filename(file.originalname);
  const key = `${folder}/${name}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: `${R2_PUBLIC_URL}/${key}`,
  };
}

/* ======================
   PUBLIC API
====================== */
async function uploadFile(file, folder) {
  if (!file) return null;
  if (STORAGE_TYPE === "r2") return saveR2(file, folder);
  return saveLocal(file, folder);
}

async function uploadFiles(files = [], folder) {
  const results = [];
  for (const file of files) {
    results.push(await uploadFile(file, folder));
  }
  return results;
}

module.exports = {
  uploadFile,
  uploadFiles,
};
