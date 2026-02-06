/**
 * bodyLayout.js
 * body 전역 레이아웃 / 배경 / 보케 옵션 모듈
 *
 * 사용법:
 * <script>
 *   window.BODY_LAYOUT = {
 *     theme: "dark",      // dark | light
 *     bokeh: true,        // true | false
 *     admin: false        // true | false
 *   };
 * </script>
 * <script src="/js/bodyLayout.js"></script>
 */

(function () {
  const config = window.BODY_LAYOUT || {};

  const theme = config.theme || "dark";   // 기본 dark
  const bokehOn = config.bokeh !== false; // 기본 true
  const isAdmin = config.admin === true;

  /* ================= body 기본 클래스 ================= */
  document.body.classList.add(
    "min-h-screen",
    "relative",
    "overflow-x-hidden"
  );

  if (theme === "dark") {
    document.body.classList.add("bg-zinc-900", "text-white");
  } else {
    document.body.classList.add("bg-gray-50", "text-gray-900");
  }

  /* ================= 관리자 페이지 ================= */
  if (isAdmin) {
    // 관리자 페이지는 심플하게
    document.body.classList.remove("overflow-x-hidden");
    return;
  }

  /* ================= 보케 배경 ================= */
  if (bokehOn) {
    // ★ FIX: body가 아니라 html 기준으로 보케를 깐다
    const root = document.documentElement;

    // 보케 이미지 레이어
    const bokeh = document.createElement("div");
    bokeh.id = "global-bokeh";
    bokeh.style.position = "fixed";
    bokeh.style.inset = "0";
    bokeh.style.zIndex = "-2";
    bokeh.style.backgroundImage = "url('/img/bokeh-bg.jpg')";
    bokeh.style.backgroundSize = "cover";
    bokeh.style.backgroundPosition = "center";
    bokeh.style.filter = "blur(30px)";
    bokeh.style.opacity = "0.4";
    bokeh.style.transform = "scale(1.1)";

    // 어두운 오버레이 (가독성용)
    const overlay = document.createElement("div");
    overlay.id = "global-bokeh-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "-1";
    overlay.style.backgroundColor = "rgba(0,0,0,0.45)";

    // ★ FIX: html 최상단에 삽입
    root.prepend(bokeh);
    root.prepend(overlay);
  }

})();
