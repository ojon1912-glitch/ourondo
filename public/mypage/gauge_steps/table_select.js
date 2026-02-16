// TABLE_SELECT 단계: 테이블 선택
window.render_TABLE_SELECT = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
  var esc = gaugeUtil.esc;

  if (isAdmin) {
    // 테이블별 현황
    var tables = '';
    for (var i = 1; i <= room.table_count; i++) {
      var seated = members.filter(function(m) { return m.table_no === i; });
      var mList = seated.map(function(m) {
        var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
        return '<span class="' + gc + ' text-sm">' + esc(m.name) + '</span>';
      }).join(", ") || '<span class="text-gray-600 text-sm">비어있음</span>';
      tables += '<div class="card p-3 mb-2"><div class="font-bold text-pink-400 mb-1">T' + i + '</div><div>' + mList + '</div></div>';
    }
    var unselected = members.filter(function(m) { return !m.table_no; });
    var unList = unselected.map(function(m) {
      var gc = m.gender === "M" ? "text-blue-400" : "text-pink-400";
      return '<span class="' + gc + ' text-sm">' + esc(m.name) + '</span>';
    }).join(", ") || '<span class="text-green-400 text-sm">모두 선택 완료!</span>';

    var allSelected = unselected.length === 0 && members.length > 0;

    el.innerHTML = '<div class="fade-in">'
      + '<div class="text-center mb-4"><div class="text-2xl font-bold">테이블 배치 현황</div></div>'
      + tables
      + '<div class="card p-3 mb-4"><div class="font-bold text-gray-400 mb-1">미선택</div><div>' + unList + '</div></div>'
      + '<div class="text-center"><p class="text-sm text-gray-500">'
      + (allSelected ? '모든 참여자가 테이블을 선택했습니다. 관리자 패널에서 다음 단계로 이동하세요' : '참여자들이 테이블을 선택하고 있습니다...')
      + '</p></div></div>';
  } else {
    // 유저: 테이블 선택
    var tableButtons = '';
    for (var j = 1; j <= room.table_count; j++) {
      var seatedJ = members.filter(function(m) { return m.table_no === j; });
      var maleC = seatedJ.filter(function(m) { return m.gender === "M"; }).length;
      var femaleC = seatedJ.filter(function(m) { return m.gender === "F"; }).length;
      var isMine = myMember && myMember.table_no === j;
      var btnCls = isMine
        ? "bg-gradient-to-br from-pink-500 to-purple-600 border-pink-400 glow-pink"
        : "card hover:border-pink-400/50";
      tableButtons += '<button onclick="window._selectTable(' + j + ')" class="' + btnCls + ' p-4 sm:p-5 rounded-2xl text-center transition-all min-h-[80px]">'
        + '<div class="text-xl sm:text-2xl font-black mb-1">T' + j + '</div>'
        + '<div class="text-xs text-gray-300"><span class="text-blue-400">M ' + maleC + '</span> / <span class="text-pink-400">F ' + femaleC + '</span></div>'
        + (isMine ? '<div class="text-xs text-yellow-300 mt-1 font-bold">내 테이블</div>' : '')
        + '</button>';
    }

    var changeBtn = myMember && myMember.table_no
      ? '<p class="text-center text-sm text-gray-500 mt-4">다른 테이블을 선택하면 변경됩니다</p>' : '';

    el.innerHTML = '<div class="text-center mb-6 fade-in">'
      + '<div class="text-2xl font-bold mb-2">테이블을 선택해주세요</div>'
      + '<p class="text-gray-400 text-sm">앉고 싶은 테이블을 골라주세요</p>'
      + '</div>'
      + '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">' + tableButtons + '</div>'
      + changeBtn;
  }

  window._selectTable = async function(tableNo) {
    try {
      var res = await fetch("/api/gauge/room/" + roomId + "/table", {
        method: "POST", headers: headers,
        body: JSON.stringify({ table_no: tableNo })
      });
      if (!res.ok) { var d = await res.json(); alert(d.error || "선택 실패"); }
      gaugeUtil.pollRoom();
    } catch(e) { alert("서버 오류"); }
  };
};
