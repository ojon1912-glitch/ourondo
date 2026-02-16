// TALK2 단계: 대화 시간 (Game 2 라운드)
(function() {
  var _userLoaded = false;

  window.render_TALK2 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _userLoaded = false; }

    if (isAdmin) {
      el.innerHTML = '<div class="text-center py-12 fade-in">'
        + '<div class="text-3xl font-bold mb-4 glow-text">대화 시간 (Round 2)</div>'
        + '<div class="card p-8 mb-6"><div class="text-6xl mb-4">💬</div>'
        + '<p class="text-gray-400">참여자들이 대화를 나누고 있습니다</p></div>'
        + '<p class="text-sm text-gray-500">관리자 패널에서 다음 단계로 이동하세요</p></div>';
      return;
    }

    if (!myMember) return;
    if (_userLoaded) return;
    renderUserTalk2(el, myMember, headers, roomId, esc);
  };

  async function renderUserTalk2(el, myMember, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/my-talk-data?game_step=GAME2_3&question_nos=3,4", { headers: headers });
      var data = await res.json();
      var myAnswers = data.myAnswers || [];
      var givenGauges = data.givenGauges || [];

      var myHtml = myAnswers.map(function(a) {
        return '<div class="card p-3 mb-2"><div class="text-xs text-gray-500 mb-1">Q' + a.question_no + '</div><p class="text-sm">' + esc(a.answer_text) + '</p></div>';
      }).join("") || '<p class="text-gray-500 text-sm">답변 없음</p>';

      var givenHtml = givenGauges.map(function(g) {
        return '<div class="card p-3 mb-2 flex items-center justify-between"><div class="flex-1"><div class="text-xs text-gray-500 mb-1">' + (g.answer_text ? 'Q' + g.question_no : (g.to_nickname || '')) + '</div>'
          + (g.answer_text ? '<p class="text-sm">' + esc(g.answer_text) + '</p>' : '') + '</div>'
          + '<div class="ml-3 text-center"><div class="text-2xl font-black text-pink-400">' + g.gauge_amount + '</div><div class="text-xs text-gray-500">게이지</div></div></div>';
      }).join("") || '<p class="text-gray-500 text-sm">배분한 게이지 없음</p>';

      el.innerHTML = '<div class="fade-in"><div class="text-center mb-6"><div class="text-3xl font-bold glow-text mb-2">대화 시간 (Round 2)</div>'
        + '<div class="card p-6 inline-block mb-4"><div class="text-5xl">💬</div></div></div>'
        + '<div class="mb-6"><h3 class="text-lg font-bold text-pink-400 mb-3">내가 쓴 답변</h3>' + myHtml + '</div>'
        + '<div><h3 class="text-lg font-bold text-purple-400 mb-3">내가 게이지를 준 답변</h3>' + givenHtml + '</div></div>';
      _userLoaded = true;
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }
})();
