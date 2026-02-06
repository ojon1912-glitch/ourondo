/* ===============================
   카카오 로그인 성공 처리
   =============================== */

// ★ ADD: kakao-success.html 에서만 실행
(function () {
  if (!location.pathname.includes("/auth/kakao-success.html")) return;

  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  if (!token) {
    alert("카카오 로그인 실패");
    location.href = "/auth/login.html";
    return;
  }

  localStorage.setItem("token", token);

  // JWT payload decode
  const payload = JSON.parse(
    decodeURIComponent(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
  );

  // ★ ADD: flag 기준 분기
  if (payload.flag === "WT") {
    location.href = "/auth/extra-info.html";
  } else {
    location.href = "/";
  }
})();
