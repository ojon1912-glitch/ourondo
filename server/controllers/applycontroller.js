// ★ VERSION v20251230_4 (배포 R2 사용 시 DB에 접근 가능한 URL 저장 + STORAGE_TYPE 대소문자 대응 + disk/memory multer 모두 지원)

const Apply = require("../models/applymodel");
const STORAGE_TYPE = (process.env.STORAGE_TYPE || "local").toLowerCase(); // ★ CHANGED(v20251230_4)
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""); // ★ ADD(v20251230_4)
const fs = require("fs"); // ★ ADD(v20251230_4)
const path = require("path"); // ★ ADD(v20251230_4)
const crypto = require("crypto"); // ★ ADD(v20251230_4)

async function ensureFileBuffer(file) { // ★ ADD(v20251230_4)
  if (!file) return null;
  if (file.buffer) return file;
  if (file.path) {
    const buffer = await fs.promises.readFile(file.path);
    return { ...file, buffer };
  }
  return file;
}

let uploadToR2;
if (STORAGE_TYPE === "r2") {
  const r2 = require("../r2");
  const { PutObjectCommand } = require("@aws-sdk/client-s3");

  uploadToR2 = async (file) => {
    const fileWithBuffer = await ensureFileBuffer(file); // ★ ADD(v20251230_4)
    if (!fileWithBuffer || !fileWithBuffer.buffer) return null; // ★ ADD(v20251230_4)

    const ext = path.extname(fileWithBuffer.originalname || ""); // ★ ADD(v20251230_4)
    const safeName = `${Date.now()}-${crypto.randomUUID()}${ext}`; // ★ ADD(v20251230_4)
    const key = `apply/${safeName}`; // ★ CHANGED(v20251230_4)

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: fileWithBuffer.buffer, // ★ CHANGED(v20251230_4)
        ContentType: fileWithBuffer.mimetype, // ★ CHANGED(v20251230_4)
      })
    );

    // ★ CHANGED(v20251230_4): DB에는 접근 가능한 URL을 저장 (R2_PUBLIC_URL 없으면 key 저장)
    return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key;
  };
}

exports.create = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "로그인 필요" });

    const {
      product_type,
      apply_date,
      gender,
      name,
      birth_year,
      height,
      contact,
      job,
      mbti,
      source,
      message,
      agree,
    } = req.body;

    if (!agree) {
      return res.status(400).json({ error: "약관 동의 필요" });
    }

    const photos = req.files?.photos || [];
    const jobFile = req.files?.job_file?.[0];

    if (photos.length < 2) {
      return res.status(400).json({ error: "사진 2장 이상 필요" });
    }
    if (!jobFile) {
      return res.status(400).json({ error: "직업증명 필요" });
    }

    const apply = await Apply.createApply({
      user_seq: user.user_seq,
      product_type: Number(product_type),
      apply_date,
      gender,
      name,
      birth_year: Number(birth_year),
      height: Number(height),
      contact,
      job,
      mbti,
      source,
      message,
      agree: true,
    });

    const apply_seq = apply.apply_seq;

    // JOB FILE
    const jobPath =
      STORAGE_TYPE === "r2"
        ? await uploadToR2(jobFile)
        : `/uploads/${jobFile.filename}`;

    if (!jobPath) return res.status(500).json({ error: "파일 저장 실패(JOB)" }); // ★ ADD(v20251230_4)

    await Apply.insertFile({
      apply_seq,
      file_type: "JOB",
      file_path: jobPath,
      original_name: jobFile.originalname,
    });

    // PHOTOS
    for (const f of photos) {
      const photoPath =
        STORAGE_TYPE === "r2"
          ? await uploadToR2(f)
          : `/uploads/${f.filename}`;

      if (!photoPath) return res.status(500).json({ error: "파일 저장 실패(PHOTO)" }); // ★ ADD(v20251230_4)

      await Apply.insertFile({
        apply_seq,
        file_type: "PHOTO",
        file_path: photoPath,
        original_name: f.originalname,
      });
    }

    res.json({ message: "신청 완료", apply_seq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
};

// ★ REMOVED(v20251230_4): 보안상 비밀키 로그 출력 금지
// console.log("JWT_SECRET:", process.env.JWT_SECRET); // ★ REMOVED(v20251230_4)
