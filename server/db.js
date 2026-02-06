// ===============================
// DB Connection (Local / Fly.io)
// ===============================

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Client } = require("pg");

let client;

// ===============================
// Fly.io (DATABASE_URL 사용)
// ===============================
if (process.env.DATABASE_URL) {
  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // 🔥 Fly Postgres 필수
    },
  });
} 
// ===============================
// Local 개발용
// ===============================
else {
  client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
}

// ===============================
// Connect
// ===============================
client
  .connect()
  .then(() => {
    console.log("🟢 PostgreSQL Connected");
  })
  .catch((err) => {
    console.error("🔴 PostgreSQL Connection Error", err);
    process.exit(1); // ❗ DB 죽으면 서버도 같이 죽이는 게 맞음
  });

module.exports = client;
