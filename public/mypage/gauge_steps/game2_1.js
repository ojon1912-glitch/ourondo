// GAME2_1 단계: 라이어 게임
(function() {
  var _generated = false;
  var _userLoaded = false;

  window.render_GAME2_1 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _generated = false; _userLoaded = false; }

    if (isAdmin) {
      renderAdminLiar(el, room, members, headers, roomId, esc);
    } else {
      if (_userLoaded) return;
      renderUserLiar(el, room, myMember, headers, roomId, esc);
    }
  };

  async function renderAdminLiar(el, room, members, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/liar", { headers: headers });
      var data = await res.json();
      var liarData = data.liarData || [];

      // 테이블별 그룹핑
      var tables = {};
      members.forEach(function(m) {
        if (m.table_no) {
          if (!tables[m.table_no]) tables[m.table_no] = [];
          tables[m.table_no].push(m);
        }
      });

      var generateBtn = '<button onclick="window._generateLiar()" class="btn-primary mb-6 w-full">'
        + (liarData.length > 0 ? '전체 재생성' : '라이어 게임 시작') + '</button>';

      var tableHtml = Object.keys(tables).sort().map(function(tno) {
        var tMembers = tables[tno];
        var liar = liarData.find(function(l) { return l.table_no === parseInt(tno); });

        var memberRows = tMembers.map(function(m) {
          var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
          var isLiar = liar && liar.liar_member_seq === m.member_seq;
          var badge = isLiar ? ' <span class="text-xs bg-red-500/30 text-red-400 px-2 py-0.5 rounded-full">라이어</span>' : '';
          var word = '';
          if (liar) {
            word = isLiar
              ? '<span class="text-red-400 font-bold">"' + esc(liar.nickname_for_liar) + '"</span>'
              : '<span class="text-green-400">"' + esc(liar.nickname_for_others) + '"</span>';
          }
          return '<div class="text-sm mb-1"><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + badge + ' ' + word + '</div>';
        }).join("");

        var restartBtn = liar
          ? '<button onclick="window._restartLiarTable(' + tno + ')" class="text-xs text-indigo-400 hover:text-indigo-300 mt-2">재시작 (풀 반전)</button>'
          : '';

        var poolInfo = liar ? '<div class="text-xs text-gray-600">풀: ' + liar.gender_pool + '</div>' : '';

        return '<div class="card p-4 mb-3">'
          + '<div class="flex items-center justify-between mb-2">'
          + '<div class="font-bold text-sm">테이블 ' + tno + '</div>'
          + poolInfo + '</div>'
          + memberRows + restartBtn + '</div>';
      }).join("");

      el.innerHTML = '<div class="fade-in">'
        + '<div class="text-center mb-4"><div class="text-2xl font-bold">라이어 게임</div>'
        + '<p class="text-gray-400 text-sm">테이블별 라이어 현황</p></div>'
        + generateBtn + tableHtml
        + '<div class="text-center mt-4"><p class="text-sm text-gray-500">관리자 패널에서 다음 단계로 이동하세요</p></div>'
        + '</div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  async function renderUserLiar(el, room, myMember, headers, roomId, esc) {
    if (!myMember) return;
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/liar", { headers: headers });
      var data = await res.json();

      if (!data.word) {
        el.innerHTML = '<div class="text-center py-12 fade-in">'
          + '<div class="text-3xl font-bold glow-text mb-4">라이어 게임</div>'
          + '<p class="text-gray-400 pulse">게임이 준비되고 있습니다...</p></div>';
        return;
      }

      var wordStyle = data.isLiar
        ? 'color:#ef4444; text-shadow: 0 0 20px rgba(239,68,68,0.5); font-size:2.5rem;'
        : 'color:#a78bfa; font-size:2.5rem;';

      var liarMsg = data.isLiar
        ? '<div class="text-red-400 text-sm mt-4 card p-3">당신은 <span class="font-bold">라이어</span>입니다! 들키지 않게 행동하세요!</div>'
        : '';

      el.innerHTML = '<div class="text-center py-8 fade-in">'
        + '<div class="text-3xl font-bold glow-text mb-6">라이어 게임</div>'
        + '<div class="card p-8 mb-4">'
        + '<p class="text-gray-400 text-sm mb-3">당신이 받은 단어</p>'
        + '<div class="font-black" style="' + wordStyle + '">' + esc(data.word) + '</div>'
        + liarMsg + '</div>'
        + '<p class="text-gray-500 text-sm">게임이 진행될 때까지 기다려주세요</p>'
        + '</div>';
      _userLoaded = true;
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  window._generateLiar = async function() {
    if (!confirm("라이어 게임을 생성하시겠습니까?")) return;
    try {
      await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/liar/generate", {
        method: "POST", headers: gaugeUtil.headers
      });
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); }
  };

  window._restartLiarTable = async function(tableNo) {
    if (!confirm("테이블 " + tableNo + "을(를) 재시작하시겠습니까? (성별 풀 반전)")) return;
    try {
      await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/liar/restart/" + tableNo, {
        method: "POST", headers: gaugeUtil.headers
      });
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); }
  };
})();
