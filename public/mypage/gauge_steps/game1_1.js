// GAME1_1 단계: 질문 답변
(function() {
  var QUESTIONS = {
    1: "첫인상에서 가장 중요하게 생각하는 것은?",
    2: "이상형의 조건 3가지를 알려주세요"
  };
  var _userDone = false;

  window.render_GAME1_1 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _userDone = false; }

    if (isAdmin) {
      renderAdminView(el, room, members, headers, roomId, esc, [1, 2]);
    } else {
      if (_userDone) {
        el.innerHTML = '<div class="text-center py-12 fade-in">'
          + '<div class="text-2xl font-bold mb-4">답변이 제출되었습니다</div>'
          + '<p class="text-gray-500 pulse">잠시만 기다려주세요</p></div>';
        return;
      }
      renderUserView(el, room, myMember, members, headers, roomId, esc, [1, 2], QUESTIONS, '_submitAnswers_g1');
    }
  };

  async function renderAdminView(el, room, members, headers, roomId, esc, questionNos) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/answers?question_nos=" + questionNos.join(","), { headers: headers });
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
          var myAnswers = answers.filter(function(a) { return a.member_seq === m.member_seq && questionNos.indexOf(a.question_no) !== -1; });
          myAnswers.forEach(function(a) {
            answerHtml += '<div class="text-sm text-gray-300 mt-1 pl-4 border-l-2 border-pink-500/30">'
              + '<span class="text-gray-500">Q' + a.question_no + '.</span> ' + esc(a.answer_text) + '</div>';
          });
        }

        return '<div class="card p-3 mb-2">'
          + '<div class="flex items-center justify-between mb-1">'
          + '<span><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + '</span>'
          + statusBadge + '</div>'
          + answerHtml + '</div>';
      }).join("");

      var allDone = submitted.length >= members.length && members.length > 0;

      el.innerHTML = '<div class="fade-in">'
        + '<div class="text-center mb-4"><div class="text-2xl font-bold">Game 1-1 답변 현황</div>'
        + '<p class="text-gray-400 text-sm">' + submitted.length + '/' + members.length + '명 제출</p></div>'
        + rows
        + '<div class="text-center mt-4"><p class="text-sm text-gray-500">'
        + (allDone ? '모든 참여자가 답변을 제출했습니다! 관리자 패널에서 다음 단계로 이동하세요' : '참여자들이 답변을 작성하고 있습니다...')
        + '</p></div></div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  async function renderUserView(el, room, myMember, members, headers, roomId, esc, questionNos, questions, submitFn) {
    if (!myMember) return;

    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/answers?question_nos=" + questionNos.join(","), { headers: headers });
      var data = await res.json();
      var myAnswers = data.myAnswers || [];
      var hasSubmitted = myAnswers.length >= questionNos.length;

      if (hasSubmitted) {
        _userDone = true;
        var answersHtml = myAnswers.map(function(a) {
          return '<p class="text-gray-400 text-sm mb-1">Q' + a.question_no + '. ' + esc(questions[a.question_no] || '') + '</p>'
            + '<p class="text-white mb-3">' + esc(a.answer_text) + '</p>';
        }).join("");
        el.innerHTML = '<div class="text-center py-12 fade-in">'
          + '<div class="text-2xl font-bold mb-4">답변이 제출되었습니다</div>'
          + '<div class="card p-4 text-left mb-4">' + answersHtml + '</div>'
          + '<p class="text-gray-500 pulse">잠시만 기다려주세요</p>'
          + '</div>';
        return;
      }

      // 입력 폼 (step 변경 시에만 다시 그리기, 입력 중 덮어쓰기 방지)
      if (!document.getElementById("q" + questionNos[0] + "Input")) {
        var formHtml = '<div class="fade-in">'
          + '<div class="text-center mb-6">'
          + '<div class="text-2xl font-bold">질문에 답해주세요</div>'
          + '<p class="text-gray-400 text-sm">솔직하게 작성해주세요</p>'
          + '</div>';

        questionNos.forEach(function(qno, idx) {
          formHtml += '<div class="card p-5 mb-4">'
            + '<label class="text-pink-400 font-bold text-sm block mb-2">Q' + qno + '. ' + esc(questions[qno] || '') + '</label>'
            + '<textarea id="q' + qno + 'Input" rows="3" placeholder="답변을 입력해주세요..."'
            + ' class="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-pink-400 focus:outline-none resize-none"></textarea>'
            + '</div>';
        });

        formHtml += '<button id="submitAnswerBtn_g1" onclick="window.' + submitFn + '()" class="btn-primary w-full text-lg">제출</button></div>';
        el.innerHTML = formHtml;
      }
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  window._submitAnswers_g1 = async function() {
    var q1 = document.getElementById("q1Input").value.trim();
    var q2 = document.getElementById("q2Input").value.trim();
    if (!q1 || !q2) return alert("두 질문 모두 답변해주세요.");

    var btn = document.getElementById("submitAnswerBtn_g1");
    btn.disabled = true;
    btn.textContent = "제출 중...";

    try {
      var res = await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/answer", {
        method: "POST", headers: gaugeUtil.headers,
        body: JSON.stringify({ answers: [
          { question_no: 1, answer_text: q1 },
          { question_no: 2, answer_text: q2 }
        ]})
      });
      if (!res.ok) { var d = await res.json(); alert(d.error || "제출 실패"); btn.disabled = false; btn.textContent = "제출"; return; }
      _userDone = true;
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); btn.disabled = false; btn.textContent = "제출"; }
  };
})();
