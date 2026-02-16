// ★ VERSION v20260206_1 (이니시스 INIpay Standard: ready + return/승인요청 구현)

const crypto = require("crypto");
const https = require("https");
const http = require("http");
const querystring = require("querystring");

const Pay = require("../models/paymodel");
const Apply = require("../models/applymodel");
const Point = require("../models/pointmodel");

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function sha512Hex(str) {
  return crypto.createHash("sha512").update(str, "utf8").digest("hex");
}

// NVP signature: key 기준 알파벳 정렬 + key=value & 연결 후 SHA256
// (oid, price, timestamp) :contentReference[oaicite:1]{index=1}
function makeNvpSignature(params) {
  const keys = Object.keys(params).sort();
  const nvp = keys.map((k) => `${k}=${params[k]}`).join("&");
  return sha256Hex(nvp);
}

function postForm(url, data) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const body = querystring.stringify(data);
      const transport = parsed.protocol === "http:" ? http : https;

      const req = transport.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "http:" ? 80 : 443),
          path: parsed.pathname + (parsed.search || ""),
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => (raw += chunk));
          res.on("end", () => resolve(raw));
        }
      );

      req.on("error", reject);
      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

exports.ready = async (req, res) => {
  try {
    const apply_seq = Number(req.query.apply_seq);
    if (!apply_seq) return res.status(400).json({ error: "apply_seq 필요" });

    const apply = await Apply.getApplyBySeq(apply_seq);
    if (!apply) return res.status(404).json({ error: "신청서 없음" });

    // 비회원 식별: contact(휴대폰)
    if (!apply.contact) return res.status(400).json({ error: "연락처 없음" });

    // 환경변수 (키 없으면 결제창 오픈 불가)
    const mid = process.env.INICIS_MID;
    const signKey = process.env.INICIS_SIGNKEY;

    // ★ ADD(v20260206_1): 키 없으면 ready 차단 (심사용은 반드시 세팅 필요)
    if (!mid || !signKey) {
      return res.status(400).json({
        error:
          "결제 설정 미완료(INICIS_MID/INICIS_SIGNKEY). 키 발급 후 다시 시도해주세요.",
      });
    }

    // 상품/금액: 운영값은 env로 고정 (추측 금지)
    const priceClassic = Number(process.env.PRICE_CLASSIC || 0);
    const priceSpark = Number(process.env.PRICE_SPARK || 0);
    const priceGauge = Number(process.env.PRICE_GAUGE || 40000);

    const product_type = Number(apply.product_type);
    const originalPrice =
      product_type === 1 ? priceClassic
        : product_type === 2 ? priceSpark
        : product_type === 3 ? priceGauge
        : 0;

    if (!originalPrice || originalPrice <= 0) {
      return res.status(400).json({
        error:
          "상품 금액 설정 필요(PRICE_CLASSIC/PRICE_SPARK/PRICE_GAUGE). 카드심사/운영을 위해 0원 불가",
      });
    }

    // 적립금 차감 처리
    let usedPoint = 0;
    const usePointReq = Number(req.query.use_point) || 0;
    const user_seq = apply.user_seq || (req.user ? req.user.user_seq : null);

    if (usePointReq > 0 && user_seq) {
      const balance = await Point.getBalance(user_seq);
      usedPoint = Math.min(usePointReq, balance, originalPrice - 1); // 최소 1원은 결제
      if (usedPoint > 0) {
        const productLabel = product_type === 1 ? "Classic" : product_type === 2 ? "Spark" : product_type === 3 ? "Gauge" : "기타";
        await Point.usePoint({
          user_seq,
          apply_seq: apply_seq,
          amount: usedPoint,
          description: `결제 시 적립금 사용 (${productLabel})`
        });
      }
    }

    const price = originalPrice - usedPoint;

    const timestamp = Date.now().toString();
    const oid = `ourondo_${apply_seq}_${timestamp}`.slice(0, 40);

    // mKey: SHA256(signKey) :contentReference[oaicite:2]{index=2}
    const mKey = sha256Hex(signKey);

    // signature: oid, price, timestamp (NVP SHA256) :contentReference[oaicite:3]{index=3}
    const signature = makeNvpSignature({
      oid: oid,
      price: String(price),
      timestamp: timestamp,
    });

    // verification: oid, price, signKey, timestamp (NVP SHA256) :contentReference[oaicite:4]{index=4}
    const verification = makeNvpSignature({
      oid: oid,
      price: String(price),
      signKey: signKey,
      timestamp: timestamp,
    });

    // 결제 결과를 받을 URL(동일 도메인 권장)
    // SITE_DOMAIN이 없으면 요청 헤더에서 자동 감지
    let siteDomain = process.env.SITE_DOMAIN;
    if (!siteDomain) {
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      if (host) {
        siteDomain = `${proto}://${host}`;
      } else {
        return res.status(400).json({ error: "SITE_DOMAIN 환경변수 필요" });
      }
    }

    const returnUrl = `${siteDomain}/api/pay/return`;
    const mobileReturnUrl = `${siteDomain}/api/pay/mobile-return`;
    const closeUrl = `${siteDomain}/pay/close.html`;

    // DB: 결제 준비 레코드 생성
    await Pay.createPayReady({
      apply_seq,
      oid,
      mid,
      price,
      buyer_name: apply.name,
      buyer_tel: apply.contact,
      buyer_email: process.env.DEFAULT_BUYER_EMAIL || "no-reply@ourondo.com",
      product_type,
      user_seq: apply.user_seq || null,
    });

    // 프론트에서 결제창 호출에 필요한 필드만 전달
    res.json({
      mid,
      oid,
      price: String(price),
      timestamp,
      signature,
      verification,
      mKey,
      returnUrl,
      mobileReturnUrl,
      closeUrl,
      // 적립금 정보
      originalPrice: String(originalPrice),
      usedPoint: usedPoint,
      // 표시용
      goodname:
        product_type === 1 ? "ourondo Classic" : product_type === 2 ? "ourondo Spark" : product_type === 3 ? "ourondo Gauge" : "ourondo",
      buyername: apply.name,
      buyertel: apply.contact,
      buyeremail: process.env.DEFAULT_BUYER_EMAIL || "no-reply@ourondo.com",
      currency: "WON",
      paymethod: "Card",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
};

exports.cancelPayment = async function cancelPayment(mid, tid, msg) {
  const INIAPIKey = process.env.INICIS_INIAPI_KEY;
  if (!INIAPIKey) throw new Error("INICIS_INIAPI_KEY 환경변수 미설정");

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const timestamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const clientIp = process.env.SERVER_IP || "127.0.0.1";
  const type = "Refund";
  const paymethod = "Card";

  const hashData = sha512Hex(
    INIAPIKey + type + paymethod + timestamp + clientIp + mid + tid
  );

  const formData = {
    type,
    paymethod,
    timestamp,
    clientIp,
    mid,
    tid,
    msg: msg || "고객 환불 요청",
    hashData,
  };

  const raw = await postForm("https://iniapi.inicis.com/api/v1/refund", formData);
  let result;
  try {
    result = JSON.parse(raw);
  } catch (e) {
    throw new Error("이니시스 응답 파싱 실패: " + raw);
  }

  if (result.resultCode !== "00") {
    throw new Error(`이니시스 환불 실패: [${result.resultCode}] ${result.resultMsg}`);
  }

  return result;
};

exports.inicisReturn = async (req, res) => {
  // 이니시스 returnUrl은 POST로 호출됨 :contentReference[oaicite:6]{index=6}
  try {
    const {
      resultCode,
      resultMsg,
      mid,
      orderNumber,
      authToken,
      authUrl,
      netCancelUrl,
      merchantData,
    } = req.body || {};

    if (resultCode !== "0000") {
      await Pay.markPayFailed(orderNumber || null, {
        resultCode,
        resultMsg,
        raw: req.body,
      });

      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent(resultMsg || "결제 실패")}`
      );
    }

    // 승인요청: authUrl 로 POST (mid, authToken, timestamp, signature, verification, charset)
    // signature: authToken, timestamp SHA256
    // verification: authToken, signKey, timestamp SHA256 :contentReference[oaicite:7]{index=7}
    const signKey = process.env.INICIS_SIGNKEY;
    if (!signKey) {
      // 승인요청 불가 -> 망취소 시도
      if (netCancelUrl && authToken && mid) {
        try {
          await postForm(netCancelUrl, { mid, authToken });
        } catch (e) {
          console.error("netCancel failed:", e);
        }
      }

      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent("서버 결제키 미설정")}`
      );
    }

    const timestamp = Date.now().toString();
    const signature = makeNvpSignature({
      authToken: authToken,
      timestamp: timestamp,
    });

    const verification = makeNvpSignature({
      authToken: authToken,
      signKey: signKey,
      timestamp: timestamp,
    });

    // 승인요청 데이터
    const approveReq = {
      mid: mid,
      authToken: authToken,
      timestamp: timestamp,
      signature: signature,
      verification: verification,
      charset: "UTF-8",
      format: "JSON",
    };

    let approveRaw = "";
    try {
      approveRaw = await postForm(authUrl, approveReq);
    } catch (e) {
      console.error("approve request failed:", e);

      // 승인결과 수신 실패 -> 망취소 :contentReference[oaicite:8]{index=8}
      if (netCancelUrl) {
        try {
          await postForm(netCancelUrl, approveReq);
        } catch (e2) {
          console.error("netCancel failed:", e2);
        }
      }

      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent("결제 승인 통신 실패")}`
      );
    }

    // 승인 응답은 JSON이 일반적(format=JSON)
    let approve = null;
    try {
      approve = JSON.parse(approveRaw);
    } catch (e) {
      approve = null;
    }

    // DB 저장
    try {
      await Pay.markPayApproved(orderNumber, {
        approve_raw: approveRaw,
        approve_json: approve,
        merchantData: merchantData,
      });
    } catch (dbErr) {
      console.error("DB save failed:", dbErr);

      // DB 저장 실패 -> 망취소 :contentReference[oaicite:9]{index=9}
      if (netCancelUrl) {
        try {
          await postForm(netCancelUrl, approveReq);
        } catch (e2) {
          console.error("netCancel failed:", e2);
        }
      }

      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent("DB 저장 오류로 망취소 처리되었습니다")}`
      );
    }

    return res.redirect(
      `/pay/result.html?status=ok&oid=${encodeURIComponent(orderNumber)}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// ★ 모바일 결제 리턴 핸들러
// 이니시스 모바일은 P_NEXT_URL로 GET 리다이렉트
// P_STATUS === "00" 이면 P_REQ_URL로 승인 요청
exports.mobileReturn = async (req, res) => {
  try {
    const params = req.query;
    const P_STATUS = params.P_STATUS;
    const P_RMESG1 = params.P_RMESG1 || "";
    const P_TID = params.P_TID || "";
    const P_REQ_URL = params.P_REQ_URL || "";
    const P_OID = params.P_ORDERID || params.P_OID || "";

    if (P_STATUS !== "00") {
      await Pay.markPayFailed(P_OID || null, {
        P_STATUS,
        P_RMESG1,
        raw: params,
      });
      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent(P_RMESG1 || "결제 실패")}`
      );
    }

    // 모바일 승인 요청: P_REQ_URL로 POST (P_TID, P_MID만 전송)
    const mid = process.env.INICIS_MID;
    let approveRaw = "";
    try {
      approveRaw = await postForm(P_REQ_URL, {
        P_TID: P_TID,
        P_MID: mid,
      });
    } catch (e) {
      console.error("mobile approve request failed:", e);
      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent("모바일 결제 승인 통신 실패")}`
      );
    }

    // 모바일 승인 응답 파싱 (key=value& 형식)
    let approve = {};
    try {
      // 먼저 JSON 시도
      approve = JSON.parse(approveRaw);
    } catch (e) {
      // URL-encoded 형식 파싱
      const parsed = querystring.parse(approveRaw);
      approve = parsed;
    }

    const resultCode = approve.P_STATUS || approve.resultCode || "";
    const resultMsg = approve.P_RMESG1 || approve.resultMsg || "";
    const tid = approve.P_TID || P_TID;
    const orderNumber = approve.P_OID || P_OID;

    if (resultCode !== "00" && resultCode !== "0000") {
      await Pay.markPayFailed(orderNumber || null, {
        resultCode,
        resultMsg,
        raw: approveRaw,
      });
      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent(resultMsg || "결제 승인 실패")}`
      );
    }

    // DB 저장
    try {
      await Pay.markPayApproved(orderNumber, {
        approve_raw: approveRaw,
        approve_json: { ...approve, tid: tid },
        merchantData: null,
      });
    } catch (dbErr) {
      console.error("mobile DB save failed:", dbErr);
      return res.redirect(
        `/pay/result.html?status=fail&msg=${encodeURIComponent("DB 저장 오류")}`
      );
    }

    return res.redirect(
      `/pay/result.html?status=ok&oid=${encodeURIComponent(orderNumber)}`
    );
  } catch (err) {
    console.error("mobileReturn error:", err);
    res.status(500).send("server error");
  }
};
