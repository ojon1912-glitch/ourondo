// GAME3_2 단계: 같은 테이블 답변 공개 (읽기 전용)
(function() {
  var _userLoaded = false;

  window.render_GAME3_2 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _userLoaded = false; }

    if (isAdmin) {
      renderAdminView(el, room, members, headers, roomId, esc);
    } else {
      if (_userLoaded) return;
      renderUserView(el, room, myMember, headers, roomId, esc);
    }
  };

  async function renderAdminView(el, room, members, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/table-answers?question_nos=5,6", { headers: headers });
      var answers = await res.json();

      // 테이블별 그룹핑
      var tables = {};
      answers.forEach(function(a) {
        var tno = a.table_no || 0;
        if (!tables[tno]) tables[tno] = [];
        tables[tno].push(a);
      });

      var html = '<div class="fade-in"><div class="text-center mb-4"><div class="text-2xl font-bold">테이블별 답변 공개</div>'
        + '<p class="text-gray-400 text-sm">같은 테이블 참여자들의 답변을 확인하세요</p></div>';

      Object.keys(tables).sort().forEach(function(tno) {
        html += '<div class="card p-4 mb-4"><div class="font-bold text-sm mb-3 text-purple-400">테이블 ' + tno + '</div>';
        // 멤버별 그룹핑
        var memberAnswers = {};
        tables[tno].forEach(function(a) {
          if (!memberAnswers[a.member_seq]) memberAnswers[a.member_seq] = { name: a.name, nickname: a.nickname, gender: a.gender, answers: [] };
          memberAnswers[a.member_seq].answers.push(a);
        });
        Object.keys(memberAnswers).forEach(function(mseq) {
          var m = memberAnswers[mseq];
          var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
          html += '<div class="mb-3 pl-3 border-l-2 border-purple-500/30"><div class="text-sm mb-1"><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + '</div>';
          m.answers.forEach(function(a) { html += '<div class="text-sm text-gray-300"><span class="text-gray-500">Q' + a.question_no + '.</span> ' + esc(a.answer_text) + '</div>'; });
          html += '</div>';
        });
        html += '</div>';
      });

      html += '<div class="text-center mt-4"><p class="text-sm text-gray-500">관리자 패널에서 다음 단계로 이동하세요</p></div></div>';
      el.innerHTML = html;
    } catch(e) { el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>'; }
  }

  async function renderUserView(el, room, myMember, headers, roomId, esc) {
    if (!myMember) return;
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/table-answers?question_nos=5,6", { headers: headers });
      var answers = await res.json();

      if (answers.length === 0) {
        el.innerHTML = '<div class="text-center py-12"><p class="text-gray-400">표시할 답변이 없습니다.</p></div>';
        return;
      }

      // 멤버별 그룹핑
      var memberAnswers = {};
      answers.forEach(function(a) {
        if (!memberAnswers[a.member_seq]) memberAnswers[a.member_seq] = { name: a.name, nickname: a.nickname, gender: a.gender, answers: [] };
        memberAnswers[a.member_seq].answers.push(a);
      });

      var html = '<div class="fade-in"><div class="text-center mb-6"><div class="text-2xl font-bold mb-1">같은 테이블 답변 공개</div>'
        + '<p class="text-gray-400 text-sm">테이블 멤버들의 답변을 확인하세요</p></div>'
        + '<div class="space-y-4 mb-6">';

      Object.keys(memberAnswers).forEach(function(mseq) {
        var m = memberAnswers[mseq];
        var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
        var isMe = parseInt(mseq) === myMember.member_seq;
        var nameLabel = isMe ? '<span class="text-pink-400 font-bold">나</span>' : '<span class="' + gc + '">' + esc(m.nickname || m.name) + '</span>';
        html += '<div class="card p-4"><div class="text-sm font-bold mb-2">' + nameLabel + '</div>';
        m.answers.forEach(function(a) {
          html += '<div class="mb-2"><div class="text-xs text-gray-500">Q' + a.question_no + '</div>'
            + '<div class="bg-white/5 rounded-xl p-3"><p class="text-sm">' + esc(a.answer_text) + '</p></div></div>';
        });
        html += '</div>';
      });

      html += '</div><p class="text-center text-gray-500 text-sm pulse">다음 단계를 기다려주세요</p></div>';
      el.innerHTML = html;
      _userLoaded = true;
    } catch(e) { el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>'; }
  }
})();
