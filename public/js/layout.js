// 헤더가 페이지에 삽입된 뒤에 호출해줘야 함
function initHeader() {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");

  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });
}


// 로그인 상태 적용 (JWT 기준 최종 정답)
function applyLoginState() {
  const token = localStorage.getItem("token");   // 🔥 기준은 token
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // 데스크탑
  const loginMenu = document.getElementById("loginMenu");
  const logoutMenu = document.getElementById("logoutMenu");
  const mypageMenu = document.getElementById("mypageMenu");

  // 모바일
  const mobileLoginMenu = document.getElementById("mobileLoginMenu");
  const mobileLogoutMenu = document.getElementById("mobileLogoutMenu");
  const mobileMypageMenu = document.getElementById("mobileMypageMenu");

  if (token) {
    // ✅ 로그인 상태 (token 기준)
    loginMenu?.classList.add("hidden");
    logoutMenu?.classList.remove("hidden");
    mypageMenu?.classList.remove("hidden");

    mobileLoginMenu?.classList.add("hidden");
    mobileLogoutMenu?.classList.remove("hidden");
    mobileMypageMenu?.classList.remove("hidden");

  } else {
    // ❌ 로그아웃 상태
    loginMenu?.classList.remove("hidden");
    logoutMenu?.classList.add("hidden");
    mypageMenu?.classList.add("hidden");

    mobileLoginMenu?.classList.remove("hidden");
    mobileLogoutMenu?.classList.add("hidden");
    mobileMypageMenu?.classList.add("hidden");
  }
}


// 로그아웃 함수
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  alert("로그아웃 되었습니다.");
  location.href = "/";
}
