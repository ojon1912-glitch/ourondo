// LOBBY 단계: 대기 화면
window.render_LOBBY = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
  var esc = gaugeUtil.esc;

  if (isAdmin) {
    var memberRows = members.map(function(m) {
      var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
      return '<div class="flex items-center justify-between p-3 card mb-2">'
        + '<span><span class="' + gc + '">[' + m.gender + ']</span> ' + esc(m.name) + '</span>'
        + '<button onclick="kickMember(' + m.member_seq + ')" class="text-xs text-red-400 hover:text-red-300 border border-red-400/30 px-2 py-1 rounded">거절</button>'
        + '</div>';
    }).join("") || '<p class="text-gray-500 text-center">아직 참여자가 없습니다.</p>';

    el.innerHTML = '<div class="fade-in">'
      + '<div class="text-center mb-6">'
      + '<div class="text-4xl mb-2">대기실</div>'
      + '<p class="text-gray-400">참여자들이 입장하고 있습니다</p>'
      + '</div>'
      + '<div class="card p-4 mb-4">'
      + '<h3 class="font-bold mb-3 text-indigo-300">입장한 참여자 (' + members.length + '명)</h3>'
      + memberRows
      + '</div>'
      + '<div class="text-center"><p class="text-sm text-gray-500">관리자 패널에서 다음 단계로 이동하세요</p></div>'
      + '</div>';
  } else {
    el.innerHTML = '<div class="text-center py-16 fade-in">'
      + '<div class="text-5xl mb-6">심쿵게이지</div>'
      + '<div class="card p-6 inline-block mb-6">'
      + '<p class="text-lg text-gray-300">참여자들을 기다리고 있습니다.</p>'
      + '<p class="text-gray-400 mt-2">잠시만 기다려주세요</p>'
      + '<p class="text-sm text-gray-500 mt-4">현재 참여자: <span class="text-pink-400 font-bold">' + members.length + '</span>명</p>'
      + '</div>'
      + '</div>';
  }
};
