// ★ VERSION v20251230_2 (apply 자동채움: name 기반 폼 + gender select 지원)

(function () {
  function getToken() {
    return localStorage.getItem("token");
  }

  function setValueIfEmptyByName(fieldName, value) {
    const el = document.querySelector(`[name="${fieldName}"]`);
    if (!el) return;
    if (value === undefined || value === null) return;

    const v = String(value).trim();
    if (!v) return;

    // 이미 입력된 경우 덮어쓰기 금지
    if (String(el.value || "").trim()) return;

    el.value = v;
  }

  function setSelectIfEmptyByName(fieldName, value) {
    const el = document.querySelector(`select[name="${fieldName}"]`);
    if (!el) return;
    if (value === undefined || value === null) return;

    const v = String(value).trim();
    if (!v) return;

    // 이미 선택된 경우 덮어쓰기 금지
    if (String(el.value || "").trim()) return;

    // 옵션 존재할 때만 세팅
    const hasOption = Array.from(el.options || []).some(opt => opt.value === v);
    if (hasOption) el.value = v;
  }

  async function fetchProfile(token) {
    // routes/user.js 기준: /api/user/profile
    const endpoints = [
      "/api/user/profile",
      "/api/user/me",
      "/api/auth/profile",
      "/api/auth/me",
      "/user/profile",
      "/user/me",
      "/auth/profile",
      "/auth/me",
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) continue;

        const data = await res.json();
        if (data) return data;
      } catch (err) {
        // 다음 endpoint 시도
      }
    }
    return null;
  }

  async function run() {
    const token = getToken();
    if (!token) return;

    const user = await fetchProfile(token);
    if (!user) return;

    // 탈퇴 계정은 자동채움 제외
    if (user.flag === "DD") return;

    // 응답 키 다양성 대응
    const nameVal = user.name ?? user.user_name ?? null;
    const phoneVal = user.phone ?? user.contact ?? null;
    const birthVal = user.birth_year ?? user.birth ?? null;
    const genderVal = user.gender ?? null;

    // ★ CHANGED: apply 폼 name 기반 매핑
    setValueIfEmptyByName("name", nameVal);
    setValueIfEmptyByName("contact", phoneVal);
    setValueIfEmptyByName("birth_year", birthVal);

    // ★ CHANGED: gender는 select[name="gender"] 지원
    setSelectIfEmptyByName("gender", genderVal);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
