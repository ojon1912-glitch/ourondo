// GAME2_2 단계: 질문 답변 (Q3, Q4)
(function() {
  var QUESTIONS = {
    3: "어떤 데이트를 가장 좋아하나요?",
    4: "연인에게 가장 중요하게 생각하는 것은?"
  };
  var _userDone = false;

  window.render_GAME2_2 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _userDone = false; }

    if (isAdmin) {
      renderAdminView(el, room, members, headers, roomId, esc);
    } else {
      if (_userDone) {
        el.innerHTML = '<div class="text-center py-12 fade-in">'
          + '<div class="text-2xl font-bold mb-4">답변이 제출되었습니다</div>'
          + '<p class="text-gray-500 pulse">잠시만 기다려주세요</p></div>';
        return;
      }
      renderUserView(el, room, myMember, members, headers, roomId, esc);
    }
  };

  async function renderAdminView(el, room, members, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/answers?question_nos=3,4", { headers: headers });
      var data = await res.json();
      var answers = data.answers || [];
      var submitted = data.submittedMembers || [];

      var rows = members.map(function(m) {
        var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
        var isDone = submitted.indexOf(m.member_seq) !== -1;
        var statusBadge = isDone
          ? '<span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">제출완료</span>'
          : '<span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full pulse">대기중</span>';
        var answerHtml = '';
        if (isDone) {
          var myAnswers = answers.filter(function(a) { return a.member_seq === m.member_seq && (a.question_no === 3 || a.question_no === 4); });
          myAnswers.forEach(function(a) {
            answerHtml += '<div class="text-sm text-gray-300 mt-1 pl-4 border-l-2 border-pink-500/30">'
              + '<span class="text-gray-500">Q' + a.question_no + '.</span> ' + esc(a.answer_text) + '</div>';
          });
        }
        return '<div class="card p-3 mb-2"><div class="flex items-center justify-between mb-1">'
          + '<span><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + '</span>'
          + statusBadge + '</div>' + answerHtml + '</div>';
      }).join("");

      var allDone = submitted.length >= members.length && members.length > 0;
      el.innerHTML = '<div class="fade-in"><div class="text-center mb-4"><div class="text-2xl font-bold">Game 2-2 답변 현황</div>'
        + '<p class="text-gray-400 text-sm">' + submitted.length + '/' + members.length + '명 제출</p></div>'
        + rows + '<div class="text-center mt-4"><p class="text-sm text-gray-500">'
        + (allDone ? '모든 참여자가 답변을 제출했습니다!' : '참여자들이 답변을 작성하고 있습니다...')
        + '</p></div></div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  async function renderUserView(el, room, myMember, members, headers, roomId, esc) {
    if (!myMember) return;
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/answers?question_nos=3,4", { headers: headers });
      var data = await res.json();
      var myAnswers = data.myAnswers || [];
      var hasSubmitted = myAnswers.length >= 2;

      if (hasSubmitted) {
        _userDone = true;
        el.innerHTML = '<div class="text-center py-12 fade-in">'
          + '<div class="text-2xl font-bold mb-4">답변이 제출되었습니다</div>'
          + '<div class="card p-4 text-left mb-4">'
          + myAnswers.map(function(a) { return '<p class="text-gray-400 text-sm mb-1">Q' + a.question_no + '. ' + esc(QUESTIONS[a.question_no] || '') + '</p><p class="text-white mb-3">' + esc(a.answer_text) + '</p>'; }).join("")
          + '</div><p class="text-gray-500 pulse">잠시만 기다려주세요</p></div>';
        return;
      }

      if (!document.getElementById("q3Input")) {
        el.innerHTML = '<div class="fade-in"><div class="text-center mb-6">'
          + '<div class="text-2xl font-bold">질문에 답해주세요</div>'
          + '<p class="text-gray-400 text-sm">솔직하게 작성해주세요</p></div>'
          + '<div class="card p-5 mb-4"><label class="text-pink-400 font-bold text-sm block mb-2">Q3. ' + esc(QUESTIONS[3]) + '</label>'
          + '<textarea id="q3Input" rows="3" placeholder="답변을 입력해주세요..." class="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-pink-400 focus:outline-none resize-none"></textarea></div>'
          + '<div class="card p-5 mb-6"><label class="text-pink-400 font-bold text-sm block mb-2">Q4. ' + esc(QUESTIONS[4]) + '</label>'
          + '<textarea id="q4Input" rows="3" placeholder="답변을 입력해주세요..." class="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-pink-400 focus:outline-none resize-none"></textarea></div>'
          + '<button id="submitAnswerBtn_g22" onclick="window._submitAnswers_g22()" class="btn-primary w-full text-lg">제출</button></div>';
      }
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  window._submitAnswers_g22 = async function() {
    var q3 = document.getElementById("q3Input").value.trim();
    var q4 = document.getElementById("q4Input").value.trim();
    if (!q3 || !q4) return alert("두 질문 모두 답변해주세요.");
    var btn = document.getElementById("submitAnswerBtn_g22");
    btn.disabled = true; btn.textContent = "제출 중...";
    try {
      var res = await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/answer", {
        method: "POST", headers: gaugeUtil.headers,
        body: JSON.stringify({ answers: [{ question_no: 3, answer_text: q3 }, { question_no: 4, answer_text: q4 }] })
      });
      if (!res.ok) { var d = await res.json(); alert(d.error || "제출 실패"); btn.disabled = false; btn.textContent = "제출"; return; }
      _userDone = true;
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); btn.disabled = false; btn.textContent = "제출"; }
  };
})();
