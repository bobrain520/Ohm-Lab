'use strict';
(() => {
  const video = document.getElementById('lesson-video');
  const toggle = document.getElementById('movie-toggle');
  const status = document.getElementById('movie-status');
  const chapters = document.getElementById('movie-chapters');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const showVideo = () => video.scrollIntoView({
    behavior: reducedMotion.matches ? 'instant' : 'smooth',
    block: 'center'
  });
  const play = () => video.play().catch(() => { status.textContent = '無法播放，請使用播放器或下載 MP4。'; });
  const seekTo = time => {
    const seek = () => {
      const target = Math.min(Math.max(0, time), video.duration || time);
      video.pause();
      status.textContent = '正在切換章節…';
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        video.removeEventListener('seeked', finish);
        status.textContent = '';
        play();
        showVideo();
      };
      video.addEventListener('seeked', finish, { once: true });
      video.currentTime = target;
      // Seeking to the current position does not always emit seeked.
      if (Math.abs(video.currentTime - target) < 0.05 && !video.seeking) finish();
    };
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
  };
  toggle.addEventListener('click', () => video.paused ? play() : video.pause());
  document.getElementById('movie-restart').addEventListener('click', () => seekTo(0));
  document.getElementById('begin-learning').addEventListener('click', () => video.pause());
  video.addEventListener('play', () => { toggle.textContent = '暫停影片'; status.textContent = ''; });
  video.addEventListener('pause', () => { toggle.textContent = '繼續播放'; });
  video.addEventListener('ended', () => { toggle.textContent = '再次播放'; status.textContent = '看完了！選擇起點，開始動手驗證。'; });
  video.addEventListener('error', () => { status.textContent = '影片載入失敗，請確認 video 資料夾完整。'; });
  (window.OHM_CHAPTERS || []).forEach(chapter => {
    const button = document.createElement('button');
    const seconds = Math.floor(chapter.time);
    button.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} ${chapter.title}`;
    button.addEventListener('click', () => seekTo(chapter.time));
    chapters.append(button);
  });
})();
