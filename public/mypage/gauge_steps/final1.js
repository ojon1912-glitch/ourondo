// FINAL1 단계: 최종 게이지 결과
(function() {
  var _userLoaded = false;

  window.render_FINAL1 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _userLoaded = false; }
    if (isAdmin) {
      renderAdminFinal1(el, room, members, headers, roomId, esc);
    } else {
      if (_userLoaded) return;
      renderUserFinal1(el, room, myMember, headers, roomId, esc);
    }
  };

  async function renderAdminFinal1(el, room, members, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/gauge-totals", { headers: headers });
      var data = await res.json();
      var list = data.members || [];

      var maxGauge = list.length > 0 ? list[0].total_gauge : 1;

      var rows = list.map(function(m, idx) {
        var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
        var barWidth = maxGauge > 0 ? Math.round((parseInt(m.total_gauge) / maxGauge) * 100) : 0;
        var medal = idx === 0 ? ' 👑' : '';

        return '<div class="card p-4 mb-3">'
          + '<div class="flex items-center justify-between mb-2">'
          + '<div><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name)
          + ' <span class="text-gray-500">"' + esc(m.nickname) + '"</span>' + medal + '</div>'
          + '<div class="text-2xl font-black text-pink-400">' + m.total_gauge + '</div>'
          + '</div>'
          + '<div class="w-full bg-white/5 rounded-full h-3">'
          + '<div class="h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style="width:' + barWidth + '%"></div>'
          + '</div>'
          + '<div class="flex justify-between text-xs text-gray-500 mt-1">'
          + '<span>게임: ' + m.score_gauge + '</span>'
          + '<span>히든: ' + m.hidden_gauge + '</span>'
          + '</div></div>';
      }).join("") || '<p class="text-gray-500 text-center">데이터 없음</p>';

      el.innerHTML = '<div class="fade-in">'
        + '<div class="text-center mb-6"><div class="text-2xl font-bold">최종 게이지 결과</div></div>'
        + rows
        + '<p class="text-sm text-gray-500 text-center mt-4">관리자 패널에서 다음 단계로 이동하세요</p>'
        + '</div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  async function renderUserFinal1(el, room, myMember, headers, roomId, esc) {
    if (!myMember) return;
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/gauge-totals", { headers: headers });
      var data = await res.json();
      var myTotal = data.myTotal || { total_gauge: 0, score_gauge: 0, hidden_gauge: 0 };
      var detail = data.detail || { scores: [], hidden_count: 0, hidden_gauge: 0 };

      var scoreDetail = detail.scores.map(function(s) {
        return '<div class="flex items-center justify-between text-sm p-2 card mb-1">'
          + '<div><span class="text-gray-500">Q' + s.question_no + '</span> ' + esc(s.answer_text).substring(0, 30) + '...</div>'
          + '<span class="text-pink-400 font-bold">+' + s.gauge_amount + '</span></div>';
      }).join("") || '<p class="text-gray-600 text-sm">게임에서 받은 게이지 없음</p>';

      el.innerHTML = '<div class="text-center fade-in">'
        + '<div class="text-3xl font-bold mb-2 glow-text">내 최종 게이지</div>'
        + '<div class="card p-8 inline-block mb-6">'
        + '<div class="text-6xl font-black text-pink-400 mb-2">' + myTotal.total_gauge + '</div>'
        + '<div class="text-gray-400">총 게이지</div>'
        + '</div>'
        + '<div class="text-left mb-4">'
        + '<h3 class="text-lg font-bold text-pink-400 mb-2">Game 1 상세</h3>'
        + scoreDetail
        + '</div>'
        + '<div class="text-left mb-4">'
        + '<h3 class="text-lg font-bold text-purple-400 mb-2">히든 게이징</h3>'
        + '<div class="card p-3"><span class="text-purple-400 font-bold">+' + detail.hidden_gauge + '</span> <span class="text-gray-500">(' + detail.hidden_count + '명이 선택)</span></div>'
        + '</div>'
        + '<p class="text-gray-500 text-sm pulse mt-4">잠시만 기다려주세요</p>'
        + '</div>';
      _userLoaded = true;
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }
})();
