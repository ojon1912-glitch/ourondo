// ★ ADD: 전역 WT 유저 접근 가드
(function () {
  const path = location.pathname;

  // ★ ADD: 인증/예외 허용 경로
  const allowList = [
    "/auth/login.html",
    "/auth/signup.html",
    "/auth/register.html",
    "/auth/kakao-success.html",
    "/auth/extra-info.html",
  ];

  // auth 폴더는 전부 허용 (추가 페이지 생겨도 안전)
  if (path.startsWith("/auth/")) return;

  const token = localStorage.getItem("token");
  if (!token) return; // 비로그인 사용자는 기존 정책 유지

  try {
    const payload = JSON.parse(
      decodeURIComponent(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );

    // ★ ADD: WT 유저는 서비스 페이지 접근 불가
    if (payload.flag === "WT") {
      location.href = "/auth/extra-info.html";
    }

  } catch (err) {
    // 토큰 이상 → 로그아웃 처리
    localStorage.removeItem("token");
    location.href = "/auth/login.html";
  }
})();
