// NICKNAME 단계: 닉네임 정하기
window.render_NICKNAME = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
  var esc = gaugeUtil.esc;

  if (isAdmin) {
    var rows = members.map(function(m) {
      var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
      var hasNick = !!m.nickname;
      var statusBadge = hasNick
        ? '<span class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">완료</span>'
        : '<span class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">대기</span>';
      var nickText = hasNick ? '<span class="text-pink-300 font-bold">"' + esc(m.nickname) + '"</span>' : '<span class="text-gray-600">미설정</span>';
      var editBtn = '<button onclick="window._editNickAdmin(' + m.member_seq + ')" class="text-xs text-indigo-400 hover:text-indigo-300 ml-2">수정</button>';
      return '<div class="flex items-center justify-between p-3 card mb-2" id="nickRow_' + m.member_seq + '">'
        + '<div><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + ' ' + nickText + editBtn + '</div>'
        + statusBadge
        + '</div>';
    }).join("");

    var allDone = members.every(function(m) { return !!m.nickname; }) && members.length > 0;

    el.innerHTML = '<div class="fade-in">'
      + '<div class="text-center mb-6"><div class="text-2xl font-bold">닉네임 현황</div></div>'
      + '<div class="space-y-1 mb-4">' + rows + '</div>'
      + '<div class="text-center"><p class="text-sm text-gray-500">'
      + (allDone ? '모두 닉네임을 설정했습니다! 관리자 패널에서 다음 단계로 이동하세요' : '참여자들이 닉네임을 설정하고 있습니다...')
      + '</p></div></div>';
  } else {
    var currentNick = myMember ? (myMember.nickname || "") : "";
    var isSet = !!currentNick;

    // 닉네임 설정 완료 시에만 업데이트, 입력 중에는 덮어쓰지 않음
    var existingInput = document.getElementById("nickInput");
    if (existingInput && !isSet) return;

    el.innerHTML = '<div class="text-center fade-in">'
      + '<div class="text-2xl font-bold mb-2">닉네임을 정해주세요</div>'
      + '<p class="text-gray-400 text-sm mb-6">게임에서 사용할 닉네임을 입력하세요</p>'
      + '<div class="card p-6 w-full max-w-sm mx-auto">'
      + '<input id="nickInput" type="text" value="' + esc(currentNick) + '" placeholder="닉네임 입력"'
      + ' class="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-center text-lg mb-4 focus:border-pink-400 focus:outline-none" />'
      + '<button onclick="window._setNick()" class="btn-primary w-full">' + (isSet ? '수정' : '확인') + '</button>'
      + '</div>'
      + (isSet ? '<p class="text-green-400 mt-4">현재 닉네임: <span class="font-bold">"' + esc(currentNick) + '"</span></p>' : '')
      + (isSet ? '<p class="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>' : '')
      + '</div>';
  }

  window._setNick = async function() {
    var nick = document.getElementById("nickInput").value.trim();
    if (!nick) return alert("닉네임을 입력해주세요.");
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/nickname", {
        method: "POST", headers: headers,
        body: JSON.stringify({ nickname: nick })
      });
      if (!res.ok) { var d = await res.json(); alert(d.error || "설정 실패"); }
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); }
  };

  window._editNickAdmin = function(memberSeq) {
    var row = document.getElementById("nickRow_" + memberSeq);
    if (!row) return;
    var newNick = prompt("새 닉네임을 입력하세요:");
    if (!newNick || !newNick.trim()) return;
    fetch("/api/gauge/room/" + roomId + "/member/" + memberSeq + "/nickname", {
      method: "PATCH", headers: headers,
      body: JSON.stringify({ nickname: newNick.trim() })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        gaugeUtil.pollRoom();
      } else {
        alert(data.error || "수정 실패");
      }
    })
    .catch(function() { alert("서버 오류"); });
  };
};
