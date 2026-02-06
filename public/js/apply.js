// ★ VERSION v20251230_1 (apply 자동채움: 신청서 DOM(id) 구조에 맞게 보정 + profile/me 다중 엔드포인트 시도)

// ★ CHANGED: apply 페이지 진입 시 유저 정보 자동 채움
(async function fillApplyFromUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  // ★ ADD: 여러 엔드포인트를 순차 시도 (/api/auth 우선, /auth fallback)
  const endpoints = [
    "/api/auth/profile",
    "/api/auth/me",
    "/auth/profile",
    "/auth/me",
  ];

  function setValueIfEmpty(el, value) {
    if (!el) return;
    if (value === undefined || value === null) return;
    const v = String(value).trim();
    if (!v) return;

    // 이미 사용자가 입력했으면 덮어쓰지 않음
    if (el.value && String(el.value).trim()) return;

    el.value = v;
  }

  function setRadioIfEmpty(name, value) {
    if (value === undefined || value === null) return;
    const v = String(value).trim();
    if (!v) return;

    // 이미 체크된 값이 있으면 덮어쓰지 않음
    const already = document.querySelector(`input[name="${name}"]:checked`);
    if (already) return;

    const target = document.querySelector(`input[name="${name}"][value="${v}"]`);
    if (target) target.checked = true;
  }

  let user = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (data) {
        user = data;
        break;
      }
    } catch (err) {
      // 다음 endpoint 시도
    }
  }

  if (!user) return;

  try {
    // ★ CHANGED: 신청서 실제 DOM(id)에 맞춤
    const nameEl = document.getElementById("name");
    const contactEl = document.getElementById("contact");
    const birthEl = document.getElementById("birth");

    // 백엔드 응답 키 다양성 대비 (name/user_name, phone/contact, birth_year/birth)
    const nameVal = user.name ?? user.user_name ?? null;
    const phoneVal = user.phone ?? user.contact ?? null;
    const birthVal = user.birth_year ?? user.birth ?? null;
    const genderVal = user.gender ?? null;

    setValueIfEmpty(nameEl, nameVal);
    setValueIfEmpty(contactEl, phoneVal);
    setValueIfEmpty(birthEl, birthVal);
    setRadioIfEmpty("gender", genderVal);
  } catch (err) {
    console.error("apply 자동완성 실패:", err);
  }
})();
