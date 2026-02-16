// FINAL2 단계: 최고 게이지 수상자
(function() {
  var _loaded = false;

  window.render_FINAL2 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _loaded = false; }
    if (_loaded) return;
    renderFinal2(el, isAdmin, headers, roomId, esc);
  };

  async function renderFinal2(el, isAdmin, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/gauge-top", { headers: headers });
      var data = await res.json();

      var topMHtml = data.topM
        ? '<div class="card p-6 text-center">'
          + '<div class="text-4xl mb-3">👑</div>'
          + '<div class="text-blue-400 text-sm font-bold mb-1">남성 1위</div>'
          + '<div class="text-2xl font-black">' + esc(data.topM.nickname) + '</div>'
          + (isAdmin ? '<div class="text-gray-400 text-sm mt-1">' + esc(data.topM.name) + ' | ' + data.topM.total_gauge + ' 게이지</div>' : '')
          + '</div>'
        : '<div class="card p-6 text-center text-gray-500">데이터 없음</div>';

      var topFHtml = data.topF
        ? '<div class="card p-6 text-center">'
          + '<div class="text-4xl mb-3">👑</div>'
          + '<div class="text-pink-400 text-sm font-bold mb-1">여성 1위</div>'
          + '<div class="text-2xl font-black">' + esc(data.topF.nickname) + '</div>'
          + (isAdmin ? '<div class="text-gray-400 text-sm mt-1">' + esc(data.topF.name) + ' | ' + data.topF.total_gauge + ' 게이지</div>' : '')
          + '</div>'
        : '<div class="card p-6 text-center text-gray-500">데이터 없음</div>';

      el.innerHTML = '<div class="text-center fade-in">'
        + '<div class="text-3xl font-bold mb-6 glow-text">최고 게이지 수상자!</div>'
        + '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">'
        + topMHtml + topFHtml
        + '</div>'
        + (isAdmin ? '<p class="text-sm text-gray-500">관리자 패널에서 다음 단계로 이동하세요</p>' : '<p class="text-gray-500 text-sm pulse">잠시만 기다려주세요</p>')
        + '</div>';
      _loaded = true;
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }
})();
