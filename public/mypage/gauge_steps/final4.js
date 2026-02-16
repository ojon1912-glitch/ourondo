// FINAL4 단계: 받은 메세지 + 2차 참석 여부
(function() {
  var _responded = false;

  window.render_FINAL4 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) _responded = false;

    if (isAdmin) {
      renderAdminFinal4(el, room, members, headers, roomId, esc);
    } else {
      renderUserFinal4(el, room, myMember, members, headers, roomId, esc);
    }
  };

  async function renderAdminFinal4(el, room, members, headers, roomId, esc) {
    try {
      var msgRes = await fetch("/api/gauge/room/" + roomId + "/messages", { headers: headers });
      var msgData = await msgRes.json();
      var messages = msgData.messages || [];

      var attRes = await fetch("/api/gauge/room/" + roomId + "/attendance", { headers: headers });
      var attendance = await attRes.json();

      // 메세지 내역
      var msgRows = messages.map(function(msg) {
        var fromGc = msg.from_gender === "M" ? "text-blue-400" : "text-pink-400";
        var toGc = msg.to_gender === "M" ? "text-blue-400" : "text-pink-400";
        return '<div class="card p-3 mb-2 text-sm">'
          + '<div class="flex items-center gap-2 mb-1">'
          + '<span class="' + fromGc + '">' + esc(msg.from_name) + '</span>'
          + '<span class="text-gray-600">→</span>'
          + '<span class="' + toGc + '">' + esc(msg.to_name) + '</span>'
          + '</div>'
          + '<p class="text-gray-300 pl-4 border-l-2 border-pink-500/30">' + esc(msg.message_text) + '</p>'
          + '</div>';
      }).join("") || '<p class="text-gray-500 text-sm text-center">메세지 없음</p>';

      // 참석 현황
      var attendList = attendance.filter(function(a) { return a.is_attend === 1; });
      var declineList = attendance.filter(function(a) { return a.is_attend === 0; });

      var attendRows = attendList.map(function(a) {
        var gc = a.gender === "M" ? "text-blue-400" : "text-pink-400";
        return '<span class="' + gc + ' text-sm">' + esc(a.name) + '(' + esc(a.nickname) + ')</span>';
      }).join(", ") || '<span class="text-gray-600 text-sm">없음</span>';

      var declineRows = declineList.map(function(a) {
        var gc = a.gender === "M" ? "text-blue-400" : "text-pink-400";
        return '<span class="' + gc + ' text-sm">' + esc(a.name) + '(' + esc(a.nickname) + ')</span>';
      }).join(", ") || '<span class="text-gray-600 text-sm">없음</span>';

      var notYet = members.length - attendance.length;

      el.innerHTML = '<div class="fade-in">'
        + '<div class="text-center mb-4"><div class="text-2xl font-bold">최종 결과</div></div>'
        + '<div class="mb-6">'
        + '<h3 class="text-lg font-bold text-pink-400 mb-3">메세지 내역</h3>'
        + msgRows + '</div>'
        + '<div class="mb-6">'
        + '<h3 class="text-lg font-bold text-green-400 mb-2">참석 (' + attendList.length + '명)</h3>'
        + '<div class="card p-3 mb-3">' + attendRows + '</div>'
        + '<h3 class="text-lg font-bold text-red-400 mb-2">불참 (' + declineList.length + '명)</h3>'
        + '<div class="card p-3 mb-3">' + declineRows + '</div>'
        + (notYet > 0 ? '<p class="text-yellow-400 text-sm">' + notYet + '명 미응답</p>' : '')
        + '</div>'
        + '<p class="text-sm text-gray-500 text-center">관리자 패널에서 "방 종료"를 클릭하세요</p>'
        + '</div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  async function renderUserFinal4(el, room, myMember, members, headers, roomId, esc) {
    if (!myMember) return;

    if (_responded) {
      el.innerHTML = '<div class="text-center py-12 fade-in">'
        + '<div class="text-4xl mb-4">💖</div>'
        + '<div class="text-2xl font-bold mb-2">심쿵게이지를 참여해주셔서</div>'
        + '<div class="text-2xl font-bold glow-text">감사합니다!</div>'
        + '</div>';
      return;
    }

    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/my-messages", { headers: headers });
      var messages = await res.json();

      var msgHtml = messages.map(function(msg) {
        return '<div class="card p-4 mb-3">'
          + '<div class="text-pink-400 font-bold mb-1">' + esc(msg.from_nickname) + '</div>'
          + '<p class="text-gray-300">' + esc(msg.message_text) + '</p>'
          + '</div>';
      }).join("") || '<div class="card p-4 text-center text-gray-500">받은 메세지가 없습니다</div>';

      el.innerHTML = '<div class="fade-in">'
        + '<div class="text-center mb-6">'
        + '<div class="text-3xl font-bold glow-text mb-2">받은 메세지</div>'
        + '</div>'
        + '<div class="mb-8">' + msgHtml + '</div>'
        + '<div class="card p-6 text-center">'
        + '<div class="text-xl font-bold mb-4">2차 희망!</div>'
        + '<p class="text-gray-400 text-sm mb-4">다음 모임에 참석하시겠습니까?</p>'
        + '<div class="flex gap-3 justify-center w-full">'
        + '<button onclick="window._attend(1)" class="btn-primary flex-1 py-3 text-lg max-w-[200px]">참석</button>'
        + '<button onclick="window._attend(0)" class="btn-secondary flex-1 py-3 text-lg max-w-[200px]">불참</button>'
        + '</div></div></div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  window._attend = async function(isAttend) {
    try {
      var res = await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/attendance", {
        method: "POST", headers: gaugeUtil.headers,
        body: JSON.stringify({ is_attend: isAttend })
      });
      if (!res.ok) { var d = await res.json(); alert(d.error || "제출 실패"); return; }
      _responded = true;
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); }
  };
})();
