// HIDDEN3 단계: 히든 게이징 타임 (Round 3)
(function() {
  var _confirmed = false;
  var _userDone = false;

  window.render_HIDDEN3 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _confirmed = false; _userDone = false; }

    if (isAdmin) {
      renderAdminHidden3(el, room, members, headers, roomId, esc);
    } else {
      if (_userDone) { el.innerHTML = '<div class="text-center py-12 fade-in"><div class="text-2xl font-bold mb-4">선택 완료!</div><p class="text-gray-500 pulse">잠시만 기다려주세요</p></div>'; return; }
      renderUserHidden3(el, room, myMember, members, headers, roomId, esc);
    }
  };

  async function renderAdminHidden3(el, room, members, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/hidden-status?game_step=HIDDEN3", { headers: headers });
      var data = await res.json();
      var selections = data.selections || [];
      var confirmed = data.confirmedMembers || [];

      var rows = members.map(function(m) {
        var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
        var isDone = confirmed.indexOf(m.member_seq) !== -1;
        var status = isDone ? '<span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">완료</span>' : '<span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full pulse">대기</span>';
        var sel = selections.find(function(s) { return s.from_member_seq === m.member_seq; });
        var detail = '';
        if (sel) { detail = sel.to_member_seq ? '<div class="text-xs text-gray-500 mt-1 ml-4">→ ' + esc(sel.to_nickname || sel.to_name) + ' (+3)</div>' : '<div class="text-xs text-gray-500 mt-1 ml-4">→ 없음</div>'; }
        return '<div class="card p-3 mb-2"><div class="flex items-center justify-between"><span><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + ' <span class="text-gray-500 text-sm">T' + (m.table_no || '?') + '</span></span>' + status + '</div>' + detail + '</div>';
      }).join("");

      var allDone = confirmed.length >= members.length && members.length > 0;
      el.innerHTML = '<div class="fade-in"><div class="text-center mb-4"><div class="text-2xl font-bold">히든 게이징 타임 (Round 3)</div>'
        + '<p class="text-gray-400 text-sm">' + confirmed.length + '/' + members.length + '명 완료</p></div>' + rows
        + '<div class="text-center mt-4"><p class="text-sm text-gray-500">' + (allDone ? '모두 완료!' : '참여자들이 선택하고 있습니다...') + '</p></div></div>';
    } catch(e) { el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>'; }
  }

  async function renderUserHidden3(el, room, myMember, members, headers, roomId, esc) {
    if (!myMember) return;
    if (_confirmed) { _userDone = true; el.innerHTML = '<div class="text-center py-12 fade-in"><div class="text-2xl font-bold mb-4">선택 완료!</div><p class="text-gray-500 pulse">잠시만 기다려주세요</p></div>'; return; }

    if (!document.getElementById("hiddenContainer_h3")) {
      try {
        var res = await fetch("/api/gauge/room/" + roomId + "/hidden-targets", { headers: headers });
        var targets = await res.json();
        var options = targets.map(function(t) {
          return '<label class="card p-4 flex items-center gap-4 cursor-pointer hover:border-pink-400/50 transition min-h-[56px]"><input type="radio" name="hiddenTarget_h3" value="' + t.member_seq + '" class="accent-pink-500 w-6 h-6 shrink-0" /><span class="text-lg">' + esc(t.nickname || t.name) + '</span></label>';
        }).join("");
        options += '<label class="card p-4 flex items-center gap-4 cursor-pointer hover:border-gray-400/50 transition min-h-[56px]"><input type="radio" name="hiddenTarget_h3" value="none" class="accent-gray-500 w-6 h-6 shrink-0" /><span class="text-lg text-gray-400">없음</span></label>';

        el.innerHTML = '<div class="fade-in" id="hiddenContainer_h3"><div class="text-center mb-6"><div class="text-3xl font-bold glow-text mb-2">히든 게이징 타임! (Round 3)</div>'
          + '<p class="text-gray-400">같은 테이블의 이성 중 한 명을 선택해주세요</p><p class="text-pink-400 text-sm mt-1">선택한 사람에게 +3 게이지!</p></div>'
          + '<div class="space-y-3 mb-6">' + options + '</div>'
          + '<button id="hiddenConfirmBtn_h3" onclick="window._confirmHidden_h3()" class="btn-primary w-full text-lg">확인</button></div>';
      } catch(e) { el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>'; }
    }
  }

  window._confirmHidden_h3 = async function() {
    var selected = document.querySelector('input[name="hiddenTarget_h3"]:checked');
    if (!selected) return alert("한 명을 선택해주세요.");
    var btn = document.getElementById("hiddenConfirmBtn_h3");
    btn.disabled = true; btn.textContent = "제출 중...";
    var toMemberSeq = selected.value === 'none' ? null : parseInt(selected.value);
    try {
      var res = await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/hidden-select", { method: "POST", headers: gaugeUtil.headers, body: JSON.stringify({ to_member_seq: toMemberSeq, game_step: 'HIDDEN3' }) });
      if (!res.ok) { var d = await res.json(); alert(d.error || "선택 실패"); btn.disabled = false; btn.textContent = "확인"; return; }
      _confirmed = true; _userDone = true; gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); btn.disabled = false; btn.textContent = "확인"; }
  };
})();
