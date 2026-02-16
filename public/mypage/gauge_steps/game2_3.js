// GAME2_3 단계: 게이지 배분 (닉네임별, Q3/Q4 답변 표시)
(function() {
  var _gaugeState = {};
  var _loaded = false;
  var _confirmed = false;
  var _userDone = false;

  window.render_GAME2_3 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _gaugeState = {}; _loaded = false; _confirmed = false; _userDone = false; }

    if (isAdmin) {
      renderAdmin(el, room, members, headers, roomId, esc);
    } else {
      if (_userDone) {
        el.innerHTML = '<div class="text-center py-12 fade-in"><div class="text-2xl font-bold mb-4">게이지 배분 완료!</div><p class="text-gray-500 pulse">잠시만 기다려주세요</p></div>';
        return;
      }
      renderUser(el, room, myMember, members, headers, roomId, esc);
    }
  };

  async function renderAdmin(el, room, members, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/gauge-scores?game_step=GAME2_3", { headers: headers });
      var data = await res.json();
      var confirmed = data.confirmedMembers || [];
      var scores = data.scores || [];

      var rows = members.map(function(m) {
        var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
        var isDone = confirmed.indexOf(m.member_seq) !== -1;
        var status = isDone
          ? '<span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">완료</span>'
          : '<span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full pulse">배분중</span>';
        var givenScores = scores.filter(function(s) { return s.from_member_seq === m.member_seq; });
        var scoreDetail = givenScores.map(function(s) {
          return '<div class="text-xs text-gray-400 ml-4">→ ' + esc(s.to_name || '') + ': <span class="text-pink-400 font-bold">' + s.gauge_amount + '</span></div>';
        }).join("");
        return '<div class="card p-3 mb-2"><div class="flex items-center justify-between"><span><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + '</span>' + status + '</div>' + scoreDetail + '</div>';
      }).join("");

      var allDone = confirmed.length >= members.length && members.length > 0;
      el.innerHTML = '<div class="fade-in"><div class="text-center mb-4"><div class="text-2xl font-bold">Game 2-3 게이지 배분</div>'
        + '<p class="text-gray-400 text-sm">' + confirmed.length + '/' + members.length + '명 완료</p></div>'
        + rows + '<div class="text-center mt-4"><p class="text-sm text-gray-500">'
        + (allDone ? '모든 참여자가 게이지를 배분했습니다!' : '참여자들이 게이지를 배분하고 있습니다...')
        + '</p></div></div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  async function renderUser(el, room, myMember, members, headers, roomId, esc) {
    if (!myMember) return;
    if (_confirmed) { _userDone = true; el.innerHTML = '<div class="text-center py-12 fade-in"><div class="text-2xl font-bold mb-4">게이지 배분 완료!</div><p class="text-gray-500 pulse">잠시만 기다려주세요</p></div>'; return; }

    if (!_loaded || !document.getElementById("bubbleContainer_g23")) {
      try {
        var res = await fetch("/api/gauge/room/" + roomId + "/game-answers?question_nos=3,4", { headers: headers });
        var answers = await res.json();
        if (answers.length === 0) { el.innerHTML = '<div class="text-center py-12"><p class="text-gray-400">표시할 답변이 없습니다.</p></div>'; return; }

        var persons = {};
        answers.forEach(function(a) { if (!persons[a.member_seq]) persons[a.member_seq] = { answers: [], person_id: a.person_id }; persons[a.member_seq].answers.push(a); });

        var html = '<div class="fade-in"><div class="text-center mb-4"><div class="text-2xl font-bold mb-1">이성의 답변을 읽고</div><div class="text-lg text-pink-400">게이지를 배분하세요</div>'
          + '<div class="card inline-block px-4 py-2 mt-3"><span class="text-gray-400 text-sm">남은 게이지: </span><span id="remainGauge_g23" class="text-2xl font-black text-pink-400">7</span><span class="text-gray-500 text-sm"> / 7</span></div></div>'
          + '<div id="bubbleContainer_g23" class="space-y-4 mb-6">';

        Object.keys(persons).forEach(function(memberSeq) {
          var p = persons[memberSeq];
          var gaugeVal = _gaugeState[memberSeq] || 0;
          html += '<div class="card p-4"><div class="flex items-center justify-between mb-2"><div class="text-xs text-gray-500">익명 ' + p.person_id + '</div>'
            + '<div class="flex items-center gap-2"><input type="range" min="0" max="7" value="' + gaugeVal + '" class="accent-pink-500 gauge-slider-g23" data-member="' + memberSeq + '" style="width:120px;" />'
            + '<span class="text-lg font-bold text-pink-400 w-6 text-center gauge-val-g23" data-member="' + memberSeq + '">' + gaugeVal + '</span></div></div>';
          p.answers.forEach(function(a) { html += '<div class="mb-2"><div class="text-xs text-gray-500 mb-1">Q' + a.question_no + '</div><div class="bg-white/5 rounded-2xl rounded-tl-sm p-3"><p class="text-sm">' + esc(a.answer_text) + '</p></div></div>'; });
          html += '</div>';
        });

        html += '</div><button id="confirmGaugeBtn_g23" onclick="window._confirmGauge_g23()" class="btn-primary w-full text-lg">확인</button></div>';
        el.innerHTML = html;
        _loaded = true;

        document.querySelectorAll(".gauge-slider-g23").forEach(function(slider) {
          slider.addEventListener("input", function() {
            var memberSeq = slider.dataset.member;
            var newVal = parseInt(slider.value);
            var oldVal = _gaugeState[memberSeq] || 0;
            var used = Object.values(_gaugeState).reduce(function(s, v) { return s + v; }, 0);
            var remaining = 7 - used + oldVal;
            if (newVal > remaining) { newVal = remaining; slider.value = newVal; }
            _gaugeState[memberSeq] = newVal;
            var valEl = document.querySelector('.gauge-val-g23[data-member="' + memberSeq + '"]');
            if (valEl) valEl.textContent = newVal;
            var totalUsed = Object.values(_gaugeState).reduce(function(s, v) { return s + v; }, 0);
            var remainEl = document.getElementById("remainGauge_g23");
            if (remainEl) remainEl.textContent = 7 - totalUsed;
            document.querySelectorAll(".gauge-slider-g23").forEach(function(other) {
              if (other !== slider) { var oSeq = other.dataset.member; var oVal = _gaugeState[oSeq] || 0; other.max = Math.min(7, 7 - totalUsed + oVal); }
            });
          });
        });
      } catch(e) { el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>'; }
    }
  }

  window._confirmGauge_g23 = async function() {
    var scores = [];
    Object.keys(_gaugeState).forEach(function(memberSeq) { if (_gaugeState[memberSeq] > 0) scores.push({ to_member_seq: parseInt(memberSeq), gauge_amount: _gaugeState[memberSeq] }); });
    var total = scores.reduce(function(s, v) { return s + v.gauge_amount; }, 0);
    if (total === 0) return alert("최소 1 게이지 이상 배분해주세요.");
    if (total > 7) return alert("게이지 합계는 7을 초과할 수 없습니다.");
    var btn = document.getElementById("confirmGaugeBtn_g23");
    btn.disabled = true; btn.textContent = "제출 중...";
    try {
      var res = await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/gauge-score", { method: "POST", headers: gaugeUtil.headers, body: JSON.stringify({ scores: scores, game_step: "GAME2_3" }) });
      if (!res.ok) { var d = await res.json(); alert(d.error || "제출 실패"); btn.disabled = false; btn.textContent = "확인"; return; }
      _confirmed = true; _userDone = true; gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); btn.disabled = false; btn.textContent = "확인"; }
  };
})();
