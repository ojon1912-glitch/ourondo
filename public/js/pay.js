// ★ VERSION v20260211_1 (적립금 사용 기능 추가)

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
    navigator.userAgent
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  const qs = new URLSearchParams(location.search);
  const apply_seq = qs.get("apply_seq");

  const payBtn = document.getElementById("payBtn");
  const payInfo = document.getElementById("payInfo");
  const pcForm = document.getElementById("SendPayForm_id");
  const mobileForm = document.getElementById("MobilePayForm");

  const pointArea = document.getElementById("pointArea");
  const pointBalanceEl = document.getElementById("pointBalance");
  const usePointCheck = document.getElementById("usePointCheck");

  if (!apply_seq) {
    alert("apply_seq가 없습니다.");
    location.href = "/";
    return;
  }

  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // 적립금 잔액 조회
  let myPointBalance = 0;
  if (token) {
    try {
      const pRes = await fetch("/api/mypage/point", { headers });
      if (pRes.ok) {
        const pData = await pRes.json();
        myPointBalance = pData.balance || 0;
      }
    } catch (e) { /* 비회원이면 무시 */ }
  }

  if (myPointBalance > 0) {
    pointArea.classList.remove("hidden");
    pointBalanceEl.textContent = myPointBalance.toLocaleString();
  }

  async function ready(usePoint) {
    let url = `/api/pay/ready?apply_seq=${encodeURIComponent(apply_seq)}`;
    if (usePoint > 0) url += `&use_point=${usePoint}`;

    const res = await fetch(url, { headers });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "결제 준비 실패");
      throw new Error(data.error || "ready failed");
    }

    // 결제 정보 표시
    const origPrice = Number(data.originalPrice);
    const usedPt = Number(data.usedPoint) || 0;
    const finalPrice = Number(data.price);

    let priceHtml = `<div class="text-lg font-semibold mt-1">${finalPrice.toLocaleString()}원</div>`;
    if (usedPt > 0) {
      priceHtml = `
        <div class="text-sm text-white/50 line-through mt-1">${origPrice.toLocaleString()}원</div>
        <div class="text-xs text-green-400">적립금 -${usedPt.toLocaleString()}원</div>
        <div class="text-lg font-semibold text-green-300">${finalPrice.toLocaleString()}원</div>
      `;
    }

    payInfo.innerHTML = `
      <div class="text-sm text-white/70">상품</div>
      <div class="text-lg font-semibold mt-1">${data.goodname}</div>
      <div class="text-sm text-white/70 mt-4">금액</div>
      ${priceHtml}
      <div class="text-xs text-white/50 mt-3">주문번호: ${data.oid}</div>
    `;

    // PC 폼 주입
    pcForm.querySelector('input[name="mid"]').value = data.mid;
    pcForm.querySelector('input[name="oid"]').value = data.oid;
    pcForm.querySelector('input[name="goodname"]').value = data.goodname;
    pcForm.querySelector('input[name="price"]').value = data.price;
    pcForm.querySelector('input[name="buyername"]').value = data.buyername;
    pcForm.querySelector('input[name="buyertel"]').value = data.buyertel;
    pcForm.querySelector('input[name="buyeremail"]').value = data.buyeremail;
    pcForm.querySelector('input[name="timestamp"]').value = data.timestamp;
    pcForm.querySelector('input[name="signature"]').value = data.signature;
    pcForm.querySelector('input[name="verification"]').value = data.verification;
    pcForm.querySelector('input[name="mKey"]').value = data.mKey;
    pcForm.querySelector('input[name="returnUrl"]').value = data.returnUrl;
    pcForm.querySelector('input[name="closeUrl"]').value = data.closeUrl;

    // 모바일 폼 주입
    mobileForm.querySelector('input[name="P_MID"]').value = data.mid;
    mobileForm.querySelector('input[name="P_OID"]').value = data.oid;
    mobileForm.querySelector('input[name="P_AMT"]').value = data.price;
    mobileForm.querySelector('input[name="P_GOODS"]').value = data.goodname;
    mobileForm.querySelector('input[name="P_UNAME"]').value = data.buyername;
    mobileForm.querySelector('input[name="P_MOBILE"]').value = data.buyertel;
    mobileForm.querySelector('input[name="P_EMAIL"]').value = data.buyeremail;
    mobileForm.querySelector('input[name="P_NEXT_URL"]').value = data.mobileReturnUrl || data.returnUrl.replace("/return", "/mobile-return");

    return data;
  }

  // 적립금 체크박스 변경 시 ready 재호출
  if (usePointCheck) {
    usePointCheck.addEventListener("change", async () => {
      try {
        payBtn.disabled = true;
        const usePoint = usePointCheck.checked ? myPointBalance : 0;
        readyData = await ready(usePoint);
        payBtn.disabled = false;
      } catch (e) {
        console.error(e);
        payBtn.disabled = false;
      }
    });
  }

  let readyData = null;
  try {
    readyData = await ready(0);
  } catch (e) {
    console.error(e);
    return;
  }

  payBtn.addEventListener("click", () => {
    try {
      if (!readyData) return alert("결제 준비가 되지 않았습니다.");

      if (isMobile()) {
        mobileForm.submit();
      } else {
        INIStdPay.pay("SendPayForm_id");
      }
    } catch (e) {
      console.error(e);
      alert("결제창 호출 실패");
    }
  });
});
