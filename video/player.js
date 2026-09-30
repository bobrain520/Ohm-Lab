'use strict';
(() => {
  const frame = document.getElementById('lesson-video');
  const toggle = document.getElementById('movie-toggle');
  const status = document.getElementById('movie-status');
  const chapters = document.getElementById('movie-chapters');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let player;
  let playerReady = false;
  let isPlaying = false;
  let queuedAction;

  const showVideo = () => frame.scrollIntoView({
    behavior: reducedMotion.matches ? 'instant' : 'smooth',
    block: 'center'
  });

  const whenReady = action => {
    if (playerReady) action();
    else {
      queuedAction = action;
      status.textContent = '正在準備 YouTube 播放器…';
    }
  };

  const play = () => whenReady(() => player.playVideo());
  const pause = () => {
    queuedAction = undefined;
    if (playerReady) player.pauseVideo();
  };
  const seekTo = time => whenReady(() => {
    status.textContent = '正在切換章節…';
    player.seekTo(Math.max(0, time), true);
    player.playVideo();
    showVideo();
  });

  toggle.addEventListener('click', () => isPlaying ? pause() : play());
  document.getElementById('movie-restart').addEventListener('click', () => seekTo(0));
  document.getElementById('begin-learning').addEventListener('click', pause);

  (window.OHM_CHAPTERS || []).forEach(chapter => {
    const button = document.createElement('button');
    const seconds = Math.floor(chapter.time);
    button.type = 'button';
    button.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} ${chapter.title}`;
    button.addEventListener('click', () => seekTo(chapter.time));
    chapters.append(button);
  });

  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof previousReady === 'function') previousReady();
    player = new window.YT.Player(frame, {
      events: {
        onReady: () => {
          playerReady = true;
          status.textContent = '';
          if (queuedAction) {
            const action = queuedAction;
            queuedAction = undefined;
            action();
          }
        },
        onStateChange: event => {
          const states = window.YT.PlayerState;
          isPlaying = event.data === states.PLAYING;
          if (isPlaying) {
            toggle.textContent = '暫停影片';
            status.textContent = '';
          } else if (event.data === states.PAUSED) {
            toggle.textContent = '繼續播放';
          } else if (event.data === states.ENDED) {
            toggle.textContent = '再次播放';
            status.textContent = '看完了！選擇起點，開始動手驗證。';
          } else if (event.data === states.BUFFERING) {
            status.textContent = '正在調整畫質與緩衝…';
          }
        },
        onError: () => {
          status.textContent = 'YouTube 播放器暫時無法載入，請改用「在 YouTube 觀看」。';
        }
      }
    });
  };

  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  api.async = true;
  api.addEventListener('error', () => {
    status.textContent = 'YouTube 播放器暫時無法載入，請改用「在 YouTube 觀看」。';
  });
  document.head.append(api);
})();
