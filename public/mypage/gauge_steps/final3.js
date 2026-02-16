// FINAL3 단계: 메세지 보내기
(function() {
  var _sent = false;
  var _userDone = false;

  window.render_FINAL3 = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
    var esc = gaugeUtil.esc;
    if (stepChanged) { _sent = false; _userDone = false; }

    if (isAdmin) {
      renderAdminFinal3(el, room, members, headers, roomId, esc);
    } else {
      if (_userDone) {
        el.innerHTML = '<div class="text-center py-12 fade-in">'
          + '<div class="text-2xl font-bold mb-4">메세지가 전송되었습니다!</div>'
          + '<p class="text-gray-500 pulse">잠시 기다려 주세요</p></div>';
        return;
      }
      renderUserFinal3(el, room, myMember, members, headers, roomId, esc);
    }
  };

  async function renderAdminFinal3(el, room, members, headers, roomId, esc) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/messages", { headers: headers });
      var data = await res.json();
      var messages = data.messages || [];
      var sentMembers = data.sentMembers || [];

      var rows = members.map(function(m) {
        var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
        var isDone = sentMembers.indexOf(m.member_seq) !== -1;
        var status = isDone
          ? '<span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">전송완료</span>'
          : '<span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full pulse">대기</span>';

        var msg = messages.find(function(msg) { return msg.from_member_seq === m.member_seq; });
        var detail = '';
        if (msg) {
          if (msg.to_member_seq) {
            detail = '<div class="text-xs text-gray-500 mt-1 ml-4">→ ' + esc(msg.to_name) + '(' + esc(msg.to_nickname) + '): "' + esc(msg.message_text || '').substring(0, 50) + '"</div>';
          } else {
            detail = '<div class="text-xs text-gray-500 mt-1 ml-4">→ 보내지 않음</div>';
          }
        }

        return '<div class="card p-3 mb-2">'
          + '<div class="flex items-center justify-between"><span><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + '</span>' + status + '</div>'
          + detail + '</div>';
      }).join("");

      var allDone = sentMembers.length >= members.length && members.length > 0;

      el.innerHTML = '<div class="fade-in">'
        + '<div class="text-center mb-4"><div class="text-2xl font-bold">메세지 전송 현황</div>'
        + '<p class="text-gray-400 text-sm">' + sentMembers.length + '/' + members.length + '명 전송</p></div>'
        + rows
        + '<div class="text-center mt-4"><p class="text-sm text-gray-500">'
        + (allDone ? '모두 전송 완료! 관리자 패널에서 다음 단계로 이동하세요' : '참여자들이 메세지를 작성하고 있습니다...')
        + '</p></div></div>';
    } catch(e) {
      el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
    }
  }

  async function renderUserFinal3(el, room, myMember, members, headers, roomId, esc) {
    if (!myMember) return;

    if (_sent) {
      _userDone = true;
      el.innerHTML = '<div class="text-center py-12 fade-in">'
        + '<div class="text-2xl font-bold mb-4">메세지가 전송되었습니다!</div>'
        + '<p class="text-gray-500 pulse">잠시 기다려 주세요</p></div>';
      return;
    }

    if (!document.getElementById("msgContainer")) {
      try {
        var res = await fetch("/api/gauge/room/" + roomId + "/message-targets", { headers: headers });
        var targets = await res.json();

        var options = targets.map(function(t) {
          return '<option value="' + t.member_seq + '">' + esc(t.nickname || t.name) + '</option>';
        }).join("");

        el.innerHTML = '<div class="fade-in" id="msgContainer">'
          + '<div class="text-center mb-6">'
          + '<div class="text-3xl font-bold glow-text mb-2">메세지 보내기</div>'
          + '<p class="text-gray-400">이성에게 메세지를 보내세요!</p>'
          + '</div>'
          + '<div class="card p-5 mb-4">'
          + '<label class="text-sm text-gray-400 block mb-2">받는 사람</label>'
          + '<select id="msgTarget" class="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-pink-400 focus:outline-none mb-4">'
          + '<option value="">선택해주세요</option>'
          + '<option value="none">보내지 않음</option>'
          + options
          + '</select>'
          + '<div id="msgTextWrap">'
          + '<label class="text-sm text-gray-400 block mb-2">메세지</label>'
          + '<textarea id="msgText" rows="4" placeholder="메세지를 입력해주세요..."'
          + ' class="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white focus:border-pink-400 focus:outline-none resize-none"></textarea>'
          + '</div></div>'
          + '<button id="sendMsgBtn" onclick="window._sendMsg()" class="btn-primary w-full text-lg">메세지 보내기</button>'
          + '</div>';

        // "보내지 않음" 선택 시 메세지 영역 숨기기
        document.getElementById("msgTarget").addEventListener("change", function() {
          var wrap = document.getElementById("msgTextWrap");
          if (this.value === "none") {
            wrap.style.display = "none";
          } else {
            wrap.style.display = "block";
          }
        });
      } catch(e) {
        el.innerHTML = '<div class="text-center py-8"><p class="text-red-400">데이터 로드 실패</p></div>';
      }
    }
  }

  window._sendMsg = async function() {
    var target = document.getElementById("msgTarget").value;
    if (!target) return alert("받는 사람을 선택해주세요.");

    var toMemberSeq = null;
    var text = null;

    if (target !== "none") {
      toMemberSeq = parseInt(target);
      text = document.getElementById("msgText").value.trim();
      if (!text) return alert("메세지를 입력해주세요.");
    }

    var btn = document.getElementById("sendMsgBtn");
    btn.disabled = true;
    btn.textContent = "전송 중...";

    try {
      var res = await fetch("/api/gauge/room/" + gaugeUtil.roomId + "/message", {
        method: "POST", headers: gaugeUtil.headers,
        body: JSON.stringify({ to_member_seq: toMemberSeq, message_text: text })
      });
      if (!res.ok) { var d = await res.json(); alert(d.error || "전송 실패"); btn.disabled = false; btn.textContent = "메세지 보내기"; return; }
      _sent = true;
      _userDone = true;
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); btn.disabled = false; btn.textContent = "메세지 보내기"; }
  };
})();
