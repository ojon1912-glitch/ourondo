// ★ VERSION v20260206_1 (checkout.html: 결제 준비 호출 + INIStdPay.pay 실행)

document.addEventListener("DOMContentLoaded", async () => {
  const qs = new URLSearchParams(location.search);
  const apply_seq = qs.get("apply_seq");

  const payBtn = document.getElementById("payBtn");
  const payInfo = document.getElementById("payInfo");
  const form = document.getElementById("SendPayForm_id");

  if (!apply_seq) {
    alert("apply_seq가 없습니다.");
    location.href = "/";
    return;
  }

  async function ready() {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`/api/pay/ready?apply_seq=${encodeURIComponent(apply_seq)}`, { headers });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "결제 준비 실패");
      throw new Error(data.error || "ready failed");
    }

    // 표시
    payInfo.innerHTML = `
      <div class="text-sm text-white/70">상품</div>
      <div class="text-lg font-semibold mt-1">${data.goodname}</div>
      <div class="text-sm text-white/70 mt-4">금액</div>
      <div class="text-lg font-semibold mt-1">${Number(data.price).toLocaleString()}원</div>
      <div class="text-xs text-white/50 mt-3">주문번호: ${data.oid}</div>
    `;

    // 폼 주입
    form.querySelector('input[name="mid"]').value = data.mid;
    form.querySelector('input[name="oid"]').value = data.oid;
    form.querySelector('input[name="goodname"]').value = data.goodname;
    form.querySelector('input[name="price"]').value = data.price;
    form.querySelector('input[name="buyername"]').value = data.buyername;
    form.querySelector('input[name="buyertel"]').value = data.buyertel;
    form.querySelector('input[name="buyeremail"]').value = data.buyeremail;
    form.querySelector('input[name="timestamp"]').value = data.timestamp;
    form.querySelector('input[name="signature"]').value = data.signature;
    form.querySelector('input[name="verification"]').value = data.verification;
    form.querySelector('input[name="mKey"]').value = data.mKey;
    form.querySelector('input[name="returnUrl"]').value = data.returnUrl;
    form.querySelector('input[name="closeUrl"]').value = data.closeUrl;

    return data;
  }

  let readyData = null;
  try {
    readyData = await ready();
  } catch (e) {
    console.error(e);
    return;
  }

  payBtn.addEventListener("click", () => {
    try {
      if (!readyData) return alert("결제 준비가 되지 않았습니다.");
      // INIStdPay.pay("폼ID")
      INIStdPay.pay("SendPayForm_id");
    } catch (e) {
      console.error(e);
      alert("결제창 호출 실패");
    }
  });
});
