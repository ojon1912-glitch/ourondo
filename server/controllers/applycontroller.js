// ★ VERSION v20260206_1 (비회원 신청 저장 허용 + 결제 진행을 위한 apply_seq 반환 유지)

const Apply = require("../models/applymodel");
const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";

let uploadToR2;
if (STORAGE_TYPE === "r2") {
  const r2 = require("../r2");
  const { PutObjectCommand } = require("@aws-sdk/client-s3");

  uploadToR2 = async (file) => {
    const key = `apply/${Date.now()}-${file.originalname}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return key;
  };
}

exports.create = async (req, res) => {
  try {
    const user = req.user;

    // ★ CHANGED(v20260206_1): 비회원도 신청 가능 (user 없어도 진행)
    const user_seq = user ? user.user_seq : null;

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

    // ★ ADD(v20260206_1): 비회원 식별(contact=휴대폰) 필수 체크
    if (!contact || String(contact).trim().length < 8) {
      return res.status(400).json({ error: "연락처(휴대폰) 입력 필요" });
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
      user_seq: user_seq, // ★ CHANGED(v20260206_1)
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

      await Apply.insertFile({
        apply_seq,
        file_type: "PHOTO",
        file_path: photoPath,
        original_name: f.originalname,
      });
    }

    // ★ CHANGED(v20260206_1): 프론트에서 결제페이지로 이동할 수 있도록 apply_seq 반환
    res.json({ message: "신청 완료", apply_seq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
};
console.log("JWT_SECRET:", process.env.JWT_SECRET);
