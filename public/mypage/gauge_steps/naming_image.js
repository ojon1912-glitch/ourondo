// NAMING_IMAGE 단계: 심쿵작명소 (이미지 표시)
window.render_NAMING_IMAGE = function(el, room, myMember, members, isAdmin, headers, roomId, stepChanged) {
  if (isAdmin) {
    el.innerHTML = '<div class="text-center py-12 fade-in">'
      + '<div class="text-3xl font-bold mb-4 glow-text">심쿵작명소</div>'
      + '<div class="card p-8 mb-6">'
      + '<div class="text-6xl mb-4">📸</div>'
      + '<p class="text-gray-400">이미지를 추가해주세요</p>'
      + '<p class="text-gray-600 text-sm mt-2">(추후 이미지 업로드 기능 추가 예정)</p>'
      + '</div>'
      + '<p class="text-sm text-gray-500">관리자 패널에서 다음 단계로 이동하세요</p>'
      + '</div>';
  } else {
    el.innerHTML = '<div class="text-center py-12 fade-in">'
      + '<div class="text-3xl font-bold mb-4 glow-text">심쿵작명소</div>'
      + '<div class="card p-8">'
      + '<div class="text-6xl mb-4">📸</div>'
      + '<p class="text-gray-400">이미지를 추가해주세요</p>'
      + '<p class="text-gray-600 text-sm mt-2">(추후 이미지 업로드 기능 추가 예정)</p>'
      + '</div>'
      + '<p class="text-gray-500 text-sm mt-4">호스트의 안내를 기다려주세요</p>'
      + '</div>';
  }
};
