// ★ ADD: WT 유저만 접근 가능하게 체크
(function () {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/auth/login.html";
    return;
  }

  const payload = JSON.parse(
    decodeURIComponent(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
  );

  if (payload.flag !== "WT") {
    location.href = "/";
  }
})();

async function submitProfile() {
  const token = localStorage.getItem("token");

  const body = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    gender: document.getElementById("gender").value,
    birth_year: Number(document.getElementById("birth_year").value),
  };

  if (!body.name || !body.phone || !body.gender || !body.birth_year) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  const res = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    // ★ ADD: 입력 완료 후 메인 진입
    location.href = "/";
  } else {
    alert("저장 중 오류가 발생했습니다.");
  }
}
