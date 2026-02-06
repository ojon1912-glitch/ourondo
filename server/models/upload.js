//const multer = require("multer");
//const path = require("path");
//const fs = require("fs");

// 업로드 폴더가 없으면 자동 생성
//const uploadPath = path.join(__dirname, "../../uploads");
//if (!fs.existsSync(uploadPath)) {
//  fs.mkdirSync(uploadPath, { recursive: true });
//}

//const storage = multer.diskStorage({
//  destination: (req, file, cb) => {
//    cb(null, uploadPath);
//  },
//  filename: (req, file, cb) => {
    // 파일명 중복 방지
//    const unique = Date.now() + "-" + Math.round(Math.random() * 9999);
//    const ext = path.extname(file.originalname);
//    cb(null, unique + ext);
//  },
//});

//const upload = multer({
//  storage,
//  limits: { fileSize: 5 * 1024 * 1024 },
//});

//module.exports = upload;


// ❌ 이 파일은 사용하지 않습니다.
// 파일 업로드는 middleware/upload.js 에서 처리합니다.
