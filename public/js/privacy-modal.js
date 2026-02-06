/**
 * privacy-modal.js
 *
 * footer.html 은 fetch 로 동적 로드되므로
 * 이벤트 위임 방식으로 모달 제어
 */

// ★ VERSION v20251230_1 (apply 페이지 "보기" 버튼(openPrivacyBtnApply) 지원 + 백드롭/ESC 닫기)

document.addEventListener("click", (e) => {
  // ★ ADD: apply 페이지에서도 footer 모달 열기 지원
  if (e.target.id === "openPrivacyBtnApply") {
    const modal = document.getElementById("privacyModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // 열기
  if (e.target.id === "openPrivacyBtn") {
    const modal = document.getElementById("privacyModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // 닫기
  if (e.target.id === "closePrivacyBtn") {
    const modal = document.getElementById("privacyModal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  // ★ ADD: 백드롭 클릭 시 닫기 (모달 바깥 영역)
  if (e.target && e.target.id === "privacyModal") {
    const modal = document.getElementById("privacyModal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
});

// ★ ADD: ESC 키로 닫기
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  const modal = document.getElementById("privacyModal");
  if (!modal) return;

  if (!modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
});
