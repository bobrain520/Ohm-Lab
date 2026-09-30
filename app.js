(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const { current, validate, format: f, matches } = OhmModel;
  const base = () => ({ v: 5, r: 100 });
  const lessons = [
    { title: '先認識，一個簡單的電路。', description: 'V 是電壓、I 是電流、R 是電阻。5 V 加在 100 Ω 的電阻上，電流就是 50 mA。接下來，一次改變一個條件。', note: '先記住這組基準：5 V ／ 100 Ω ／ 50 mA。' },
    { title: '固定 R，看看提高 V 的結果。', description: '電阻固定在 100 Ω。把電壓從 5 V 提高到 10 V，直接觀察電流與工作點怎麼改變。', target: { v: 10, r: 100 }, answer: 'up', explanation: 'R 固定，I 與 V 成正比。電壓加倍，電流從 50 mA 增加到 100 mA。', note: '圖上的圓點是工作點，表示目前的電壓與電流。固定 R 時，工作點會沿同一條直線移動。' },
    { title: '固定 V，看看提高 R 的結果。', description: '電壓固定在 5 V。把電阻從 100 Ω 改成 200 Ω，直接觀察電流與 I–V 線怎麼改變。', target: { v: 5, r: 200 }, answer: 'down', explanation: 'V 固定，I 與 R 成反比。電阻加倍，電流從 50 mA 降到 25 mA。', note: '斜率表示電壓增加時，電流增加得多快。電阻變大，直線會變平。' },
    { title: '電壓、電阻一起加倍，電流呢？', description: '固定電阻時，提高電壓會讓電流增加；固定電壓時，提高電阻會讓電流減少。如果兩個一起加倍，會發生什麼事？', target: { v: 10, r: 200 }, answer: 'same', explanation: 'V 和 R 同時加倍，比值 V／R 不變，所以電流仍然是 50 mA。', note: '先預測，再驗證。接下來練習自己調出指定的電流。' },
    { title: '現在，換你改變條件。', description: '自由調整電壓和電阻。試著一次只改一個量，或存下目前設定，再比較下一次的變化。', note: '試試 V＝0，或讓 V 和 R 一起改變，觀察電流是否符合你的預測。' }
  ];
  const tasks = [
    { title: '固定 5 V，找到 20 mA。', description: '這次只調整電阻。讓電流剛好等於 20 mA，再檢查答案。', initial: { v: 5, r: 100 }, key: 'r', target: 0.02, hint: '先把 20 mA 換成 0.02 A。由 I＝V／R，可整理成 R＝V／I。', explanation: 'R＝5／0.02＝250 Ω。在 5 V 下，250 Ω 的電阻讓電流等於 20 mA。' },
    { title: '固定 200 Ω，找到 30 mA。', description: '這次只調整電壓。讓電流剛好等於 30 mA，再檢查答案。', initial: { v: 5, r: 200 }, key: 'v', target: 0.03, hint: '先把 30 mA 換成 0.03 A。使用 V＝I × R，求需要的電壓。', explanation: 'V＝0.03 × 200＝6 V。電阻是 200 Ω 時，需要 6 V 才能得到 30 mA。' },
    { title: '電阻加倍，讓電流維持不變。', description: '原本是 5 V／100 Ω，電流 50 mA。現在電阻已加倍到 200 Ω 並固定，請調整電壓，找回 50 mA。', initial: { v: 5, r: 200 }, key: 'v', target: 0.05, hint: '要維持 V／R 的比值，分母 R 加倍，分子 V 應該怎麼變？', explanation: 'V＝0.05 × 200＝10 V。R 加倍，V 也要加倍，才能維持原本的 50 mA。' }
  ];
  const state = { ...base(), path: null, step: 0, task: null, taskSolved: false, baseline: base(), prediction: null, revealed: false, running: false, completed: new Set() };
  // Put task selection before the active exercise, not below the entire lab.
  document.querySelector('.lesson').before($('challenge-section'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  $('motion-toggle').checked = !reduced.matches;
  reduced.addEventListener('change', () => { $('motion-toggle').checked = !reduced.matches; });
  let animationId = 0, experimentRunId = 0;
  const svgNS = 'http://www.w3.org/2000/svg';
  const point = (v, mA) => ({ x: 52 + v / 12 * 380, y: 245 - mA / 240 * 210 });
  function element(name, attrs, content) {
    const node = document.createElementNS(svgNS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (content !== undefined) node.textContent = content;
    return node;
  }
  for (let mA = 0; mA <= 240; mA += 60) {
    const { y } = point(0, mA);
    $('graph-grid').append(element('line', { x1: 52, x2: 432, y1: y, y2: y, class: mA === 0 ? 'axis-line' : 'grid-line' }), element('text', { x: 41, y: y + 4, 'text-anchor': 'end', class: 'tick-text' }, mA));
  }
  for (let v = 0; v <= 12; v += 3) {
    const { x } = point(v, 0);
    $('graph-grid').append(element('line', { x1: x, x2: x, y1: 35, y2: 245, class: v === 0 ? 'axis-line' : 'grid-line' }), element('text', { x, y: 264, 'text-anchor': 'middle', class: 'tick-text' }, v));
  }
  $('graph-grid').append(element('text', { x: 14, y: 18, class: 'axis-label' }, 'I（mA）'), element('text', { x: 434, y: 284, 'text-anchor': 'end', class: 'axis-label' }, 'V（V）'));
  const flowPath = $('flow-path');
  const pathLength = flowPath.getTotalLength();
  const particles = Array.from({ length: 19 }, () => { const node = element('circle', { r: 3.2, fill: '#167666', opacity: '.8' }); $('particles').append(node); return node; });
  let offset = 0, previousTime = 0;
  function drawParticles() {
    particles.forEach((node, i) => { const p = flowPath.getPointAtLength((offset + i * pathLength / particles.length) % pathLength); node.setAttribute('cx', p.x); node.setAttribute('cy', p.y); });
  }
  function tick(time) {
    const dt = Math.min((time - previousTime) / 1000, .05); previousTime = time;
    if ($('motion-toggle').checked && !document.hidden && current(state.v, state.r) > 0) { offset = (offset + dt * 250 * Math.sqrt(current(state.v, state.r) / .24)) % pathLength; drawParticles(); }
    requestAnimationFrame(tick);
  }
  drawParticles(); requestAnimationFrame(tick);
  function unlocked(key) {
    if (state.running) return false;
    if (state.task !== null) return tasks[state.task].key === key;
    if (state.step === 4) return true;
    if (state.path === 'basics') return !state.revealed && ((state.step === 1 && key === 'v') || (state.step === 2 && key === 'r'));
    return Boolean(state.prediction) && !state.revealed && state.step === 3;
  }
  function lineFor(r) {
    const start = point(0, 0), end = point(12, current(12, r) * 1000);
    return `M${start.x} ${start.y} L${end.x} ${end.y}`;
  }
  function positionCircle(id, p) { $(id).setAttribute('cx', p.x); $(id).setAttribute('cy', p.y); }
  function replayClass(node, className) {
    if (reduced.matches || !node) return;
    node.classList.remove(className);
    void node.getBoundingClientRect();
    node.classList.add(className);
  }
  function signalChange(key) {
    const controls = key === 'both' ? ['v', 'r'] : [key];
    controls.forEach(name => replayClass(document.querySelector('.' + name + '-control'), 'control-pulse'));
    replayClass($('circuit-i'), 'value-pulse');
    replayClass($('after-current'), 'value-pulse');
    replayClass($('working-point-halo'), 'point-pulse');
    if (key === 'r' || key === 'both') replayClass($('current-line'), 'line-pulse');
  }
  function renderValues() {
    const amps = current(state.v, state.r), mA = amps * 1000, baseline = state.baseline;
    for (const key of ['v', 'r']) {
      $(key + '-range').value = state[key]; $(key + '-number').value = f(state[key], 1);
      for (const kind of ['range', 'number']) $(key + '-' + kind).disabled = !unlocked(key);
      $(key + '-lock').textContent = unlocked(key) ? '可調整' : state.running ? '變化中' : state.path === 'challenge' && state.prediction === null && state.step === 3 && state.task === null ? '先做預測' : '固定';
    }
    $('circuit-v').textContent = f(state.v, 1) + ' V'; $('circuit-r').textContent = f(state.r, 1) + ' Ω'; $('circuit-i').textContent = f(mA) + ' mA';
    $('before-current').textContent = baseline ? f(current(baseline.v, baseline.r) * 1000) + ' mA' : '未設定';
    $('after-current').textContent = f(mA) + ' mA';
    $('circuit-svg-desc').textContent = `電壓 ${f(state.v, 1)} V，電阻 ${f(state.r, 1)} Ω，電流 ${f(mA)} mA。傳統電流由電源正極經電阻流向負極。`;
    $('calculation-values').textContent = `${f(state.v, 1)} / ${f(state.r, 1)} = ${f(amps, 6)} A = ${f(mA)} mA`;
    $('slope-badge').textContent = 'R = ' + f(state.r, 1) + ' Ω';
    $('current-line').setAttribute('d', lineFor(state.r));
    const p = point(state.v, mA);
    positionCircle('working-point', p); positionCircle('working-point-halo', p);
    $('point-guides').setAttribute('d', `M52 ${p.y} H${p.x} V245`);
    $('point-label').setAttribute('x', p.x > 325 ? p.x - 12 : p.x + 12);
    $('point-label').setAttribute('y', p.y < 55 ? p.y + 22 : p.y - 12);
    $('point-label').setAttribute('text-anchor', p.x > 325 ? 'end' : 'start');
    $('point-label').textContent = `${f(mA)} mA`;
    $('graph-svg-desc').textContent = `座標固定為 0 至 12 V、0 至 240 mA。R 為 ${f(state.r, 1)} Ω，目前工作點是 ${f(state.v, 1)} V、${f(mA)} mA。`;
    for (const id of ['baseline-line', 'baseline-point', 'baseline-legend']) $(id).style.display = baseline ? '' : 'none';
    if (baseline) { $('baseline-line').setAttribute('d', lineFor(baseline.r)); positionCircle('baseline-point', point(baseline.v, current(baseline.v, baseline.r) * 1000)); }
    for (const [prefix, value] of [['base', baseline], ['now', state]]) {
      $(prefix + '-v').textContent = value ? f(value.v, 1) + ' V' : '—';
      $(prefix + '-r').textContent = value ? f(value.r, 1) + ' Ω' : '—';
      $(prefix + '-i').textContent = value ? f(current(value.v, value.r) * 1000) + ' mA' : '—';
    }
    let insight = '固定 R 時，I 與 V 成正比；改變 R，直線斜率就會改變。座標範圍固定，方便前後比較。';
    if (baseline) {
      insight = Math.abs(state.r - baseline.r) < 1e-8 ? '電阻相同，兩條直線重合。調整電壓時，工作點沿同一條直線移動。' : state.r > baseline.r ? '電阻變大，直線變平。同樣的電壓下，電流比基準更小。' : '電阻變小，直線變陡。同樣的電壓下，電流比基準更大。';
      const delta = mA - current(baseline.v, baseline.r) * 1000;
      $('comparison-note').textContent = Math.abs(delta) < 1e-7 ? '與基準相比，電流不變。' : `與基準相比，電流${delta > 0 ? '增加' : '減少'} ${f(Math.abs(delta))} mA。`;
    } else $('comparison-note').textContent = '存下目前條件，就能比較下一次的變化。';
    $('graph-insight').textContent = insight;
    $('clear-baseline').disabled = !baseline;
  }
  function renderChrome() {
    const isTask = state.task !== null, lesson = isTask ? tasks[state.task] : lessons[state.step];
    const stage = isTask ? 'practice' : state.step === 4 ? 'explore' : state.step === 3 ? 'challenge' : 'review';
    const hasPath = state.path !== null;
    document.querySelector('.steps').hidden = state.path !== 'challenge';
    $('review-experiments').hidden = state.path !== 'basics';
    document.querySelector('.lesson').hidden = !hasPath;
    document.querySelector('.workspace').hidden = !hasPath;
    document.querySelector('.lesson-actions').hidden = !isTask && (state.step === 4 || (state.path === 'basics' && state.step === 0));
    document.querySelector('.lesson').classList.toggle('lesson-simple', isTask || state.step === 4);
    $('lesson-kicker').textContent = isTask ? `02 操作任務 · 第 ${state.task + 1} 題，共 3 題` : state.step === 3 ? '01 預測挑戰 · 把兩個關係合起來想' : state.step === 4 ? '03 自由探索 · 驗證自己的想法' : '基礎實驗 · 一次只改變一個量';
    $('lesson-title').textContent = lesson.title; $('lesson-description').textContent = lesson.description;
    document.querySelectorAll('[data-stage]').forEach(button => { if (button.dataset.stage === stage) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    document.querySelectorAll('[data-step]').forEach(button => { if (Number(button.dataset.step) === state.step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    $('begin-basics').setAttribute('aria-pressed', String(state.path === 'basics'));
    $('begin-challenge').setAttribute('aria-pressed', String(state.path === 'challenge'));
    $('prediction').hidden = isTask || state.path !== 'challenge' || state.step !== 3;
    document.querySelectorAll('[data-predict]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.predict === state.prediction)); button.disabled = state.running || state.revealed; });
    const basicExperiment = state.path === 'basics' && (state.step === 1 || state.step === 2);
    $('run-experiment').hidden = isTask || state.revealed || (basicExperiment ? false : !state.prediction);
    $('run-experiment').disabled = state.running;
    $('run-experiment').textContent = state.running ? '觀察條件變化中…' : state.step === 1 ? '把電壓調到 10 V ↗' : state.step === 2 ? '把電阻調到 200 Ω ↗' : '同時加倍 V 與 R ↗';
    $('baseline-actions').hidden = state.step !== 4 || isTask;
    $('baseline-status').hidden = state.step !== 4 || isTask || !$('baseline-status').textContent;
    $('lesson-status').textContent = isTask ? '' : state.revealed ? state.path === 'basics' ? lesson.explanation : (state.prediction === lesson.answer ? '你的預測正確。' : '這次結果和預測不同，看看原因：') + lesson.explanation : state.prediction ? '預測已記下。現在改變條件，親眼驗證。' : '';
    $('lesson-status').classList.toggle('feedback-success', !isTask && state.revealed && (state.path === 'basics' || state.prediction === lesson.answer));
    $('lesson-status').classList.toggle('feedback-guidance', !isTask && state.revealed && state.path === 'challenge' && state.prediction !== lesson.answer);
    $('flow-note').textContent = isTask ? '一次只改變一個量，觀察「目前電流」如何接近目標。' : lesson.note;
    const nextLabel = isTask ? state.task < 2 ? '下一個任務 →' : '進入自由探索 →' : state.step === 3 ? '開始操作任務 →' : state.step === 4 ? '再練習操作任務 →' : state.step === 0 ? '開始第一個實驗 →' : state.step === 1 ? '下一個實驗 →' : '開始預測挑戰 →';
    const nextDisabled = state.running || (isTask ? !state.taskSolved : state.step > 0 && state.step < 4 && !state.revealed);
    $('next').textContent = nextLabel;
    $('next').disabled = nextDisabled;
    $('reset').textContent = isTask ? '重設這個任務' : state.step === 4 ? '恢復 5 V／100 Ω' : '重設這一步';
    $('reset').hidden = state.path === 'basics' && state.step === 0;
    $('challenge-section').hidden = !isTask;
    $('return-explore').hidden = !isTask; $('task-guide').hidden = !isTask; $('task-panel').hidden = !isTask;
    $('return-explore').textContent = '直接自由探索 ↗';
    if (isTask) {
      $('slider-guide-copy').innerHTML = `拖動 <strong>${lesson.key === 'v' ? '橘色電壓 V' : '紫色電阻 R'} 滑桿</strong>的圓點；也可以點右上角數字，直接輸入數值。`;
      $('task-guide').classList.toggle('task-v', lesson.key === 'v');
      $('task-guide').classList.toggle('task-r', lesson.key === 'r');
    }
    $('control-instruction').textContent = isTask ? `你的目標：${f(lesson.target * 1000)} mA。拖動${lesson.key === 'v' ? '電壓 V' : '電阻 R'}滑桿，再檢查答案。` : state.step === 4 ? '拖動任一滑桿，同時觀察電流數字與 I–V 圖上的工作點。' : state.revealed ? lesson.explanation : state.step === 0 ? '先觀察：5 V 加在 100 Ω 上，產生 50 mA 電流。' : state.step === 3 ? state.prediction ? '按「同時加倍 V 與 R」，觀察電流有沒有改變。' : '本次實驗：5 V → 10 V，100 Ω → 200 Ω。先在上方選一個預測。' : `拖動${state.step === 1 ? '電壓到 10 V' : '電阻到 200 Ω'}，或按上方示範按鈕，直接觀察結果。`;
    document.querySelector('.v-control').classList.toggle('control-active', unlocked('v'));
    document.querySelector('.r-control').classList.toggle('control-active', unlocked('r'));
    const activeControls = isTask
      ? [lesson.key]
      : state.step === 4 || state.step === 3
        ? ['v', 'r']
        : state.path === 'basics' && state.step === 1
          ? ['v']
          : state.path === 'basics' && state.step === 2
            ? ['r']
            : [];
    const workspace = document.querySelector('.workspace');
    workspace.dataset.activeControls = activeControls.length === 1 ? activeControls[0] : activeControls.length === 2 ? 'both' : 'none';
    $('fixed-condition').textContent = activeControls.length === 1
      ? activeControls[0] === 'v' ? `固定條件 · R 電阻 ${f(state.r, 1)} Ω` : `固定條件 · V 電壓 ${f(state.v, 1)} V`
      : '';
    document.querySelectorAll('[data-task]').forEach(button => { const n = Number(button.dataset.task); button.setAttribute('aria-pressed', String(n === state.task)); button.querySelector('.task-link').textContent = state.completed.has(n) ? '已完成 · 再試一次 →' : '開始操作 →'; });
  }
  function render() { renderChrome(); renderValues(); }
  function clearErrors() { for (const key of ['v', 'r']) { $(key + '-error').textContent = ''; $(key + '-number').removeAttribute('aria-invalid'); } }
  function stopExperiment() { cancelAnimationFrame(animationId); experimentRunId += 1; state.running = false; }
  function setAnalysisDisclosure(open) {
    const expanded = !window.matchMedia('(max-width: 760px)').matches || open;
    $('analysis-toggle').setAttribute('aria-expanded', String(expanded));
    $('analysis-content').hidden = !expanded;
  }
  function scrollToElement(target, pause = 0) {
    if (reduced.matches) { target.scrollIntoView({ behavior: 'instant', block: 'start' }); return Promise.resolve(); }
    const distance = Math.abs(target.getBoundingClientRect().top);
    if (distance < 4) return new Promise(resolve => setTimeout(resolve, pause));
    return new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener('scrollend', finish);
        setTimeout(resolve, pause);
      };
      window.addEventListener('scrollend', finish, { once: true });
      setTimeout(finish, 1200);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  let navigationFrame = 0;
  function showLesson(includePathNavigation = false) {
    cancelAnimationFrame(navigationFrame);
    // Wait for the new layout, then keep the active path navigation in context.
    navigationFrame = requestAnimationFrame(() => {
      $('lesson-title').focus({ preventScroll: true });
      const target = includePathNavigation ? state.path === 'basics' ? $('review-experiments') : document.querySelector('.steps') : document.querySelector('.lesson');
      scrollToElement(target);
    });
  }
  function goStep(index, focus = false) {
    stopExperiment(); Object.assign(state, base(), { path: index < 3 ? 'basics' : 'challenge', step: index, task: null, taskSolved: false, baseline: base(), prediction: null, revealed: false });
    $('review-experiments').open = index < 3;
    clearErrors(); $('task-feedback').textContent = ''; $('baseline-status').textContent = ''; setAnalysisDisclosure(index === 4); render();
    if (focus) showLesson(true);
  }
  function startTask(index, focus = true) {
    stopExperiment(); const task = tasks[index];
    Object.assign(state, task.initial, { path: 'challenge', step: 4, task: index, taskSolved: false, baseline: index === 2 ? base() : { ...task.initial }, prediction: null, revealed: false });
    $('review-experiments').open = false;
    clearErrors(); $('task-feedback').textContent = ''; $('baseline-status').textContent = ''; $('task-hint').open = false; $('hint-text').textContent = task.hint; setAnalysisDisclosure(false);
    render();
    if (focus) showLesson();
  }
  function detectResult() {
    const target = lessons[state.step].target;
    if (state.task === null && target && (state.path === 'basics' || state.prediction) && Math.abs(state.v - target.v) < 1e-8 && Math.abs(state.r - target.r) < 1e-8) { state.revealed = true; setAnalysisDisclosure(true); }
  }
  function setValue(key, raw) {
    if (!unlocked(key)) return;
    const result = validate(key, raw);
    $(key + '-error').textContent = result.valid ? '' : result.message;
    $(key + '-number').setAttribute('aria-invalid', String(!result.valid));
    if (!result.valid) { $(key + '-number').value = state[key]; return; }
    state[key] = result.value;
    $('baseline-status').textContent = '';
    if (state.task !== null) {
      state.taskSolved = false;
      const feedback = $('task-feedback');
      if (feedback.textContent) {
        feedback.textContent = '數值已變更，上次的檢查結果已失效。請再次按「檢查答案」。';
        feedback.classList.remove('feedback-success');
        feedback.classList.add('feedback-guidance');
      }
    }
    detectResult(); render(); signalChange(key);
  }
  for (const key of ['v', 'r']) {
    $(key + '-range').addEventListener('input', event => setValue(key, event.target.value));
    $(key + '-number').addEventListener('change', event => setValue(key, event.target.value));
    $(key + '-number').addEventListener('keydown', event => { if (event.key === 'Enter') { setValue(key, event.target.value); } });
  }
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => goStep(Number(button.dataset.step), true)));
  document.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => button.dataset.stage === 'practice' ? startTask(0) : goStep(button.dataset.stage === 'challenge' ? 3 : 4, true)));
  const showLearningRoutes = () => { $('learning-start').focus({ preventScroll: true }); $('learning-start').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  $('begin-learning').addEventListener('click', showLearningRoutes);
  $('intro-learn').addEventListener('click', showLearningRoutes);
  $('intro-video').addEventListener('click', () => { $('video-title').setAttribute('tabindex', '-1'); $('video-title').focus({ preventScroll: true }); $('video-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('begin-basics').addEventListener('click', () => goStep(0, true));
  $('begin-challenge').addEventListener('click', () => goStep(3, true));
  document.querySelectorAll('[data-predict]').forEach(button => button.addEventListener('click', () => { state.prediction = button.dataset.predict; render(); }));
  document.querySelectorAll('[data-task]').forEach(button => button.addEventListener('click', () => startTask(Number(button.dataset.task))));
  $('analysis-toggle').addEventListener('click', () => setAnalysisDisclosure($('analysis-toggle').getAttribute('aria-expanded') !== 'true'));
  $('run-experiment').addEventListener('click', async () => {
    if (state.running || state.revealed || (state.path === 'challenge' && !state.prediction)) return;
    const from = { v: state.v, r: state.r }, to = lessons[state.step].target;
    clearErrors();
    if (reduced.matches) { Object.assign(state, to); detectResult(); render(); return; }
    state.running = true; render();
    const runId = ++experimentRunId;
    const observationTarget = window.matchMedia('(max-width: 760px)').matches
      ? document.querySelector('.graph-content > .card-heading')
      : document.querySelector('.controls');
    await scrollToElement(observationTarget, 260);
    if (runId !== experimentRunId || !state.running) return;
    const start = performance.now();
    const animate = time => {
      const t = Math.min((time - start) / 1100, 1), ease = t * t * (3 - 2 * t);
      // Keep displayed inputs and the calculation identical at every frame.
      // The simultaneous experiment uses the same discrete multiplier for V and R.
      const progress = state.step === 3 ? Math.round(ease * 10) / 10 : ease;
      state.v = Math.round((from.v + (to.v - from.v) * progress) * 10) / 10;
      state.r = Math.round((from.r + (to.r - from.r) * progress) / 10) * 10;
      renderValues();
      if (t < 1) animationId = requestAnimationFrame(animate);
      else { Object.assign(state, to); state.running = false; detectResult(); render(); signalChange('both'); }
    };
    animationId = requestAnimationFrame(animate);
  });
  function advance() {
    if ($('next').disabled) return;
    if (state.task !== null) { if (state.task < 2) startTask(state.task + 1); else enterExplore(); }
    else if (state.step < 2) goStep(state.step + 1, true);
    else if (state.step === 2) goStep(3, true);
    else startTask(0);
  }
  $('next').addEventListener('click', advance);
  $('reset').addEventListener('click', () => state.task === null ? goStep(state.step, true) : startTask(state.task));
  $('set-baseline').addEventListener('click', () => { state.baseline = { v: state.v, r: state.r }; renderValues(); $('baseline-status').textContent = `已將 ${f(state.v, 1)} V／${f(state.r, 1)} Ω 設為比較基準。`; renderChrome(); });
  $('clear-baseline').addEventListener('click', () => { state.baseline = null; renderValues(); $('baseline-status').textContent = '已清除比較基準；目前沒有基準線。'; renderChrome(); });
  function enterExplore() {
    stopExperiment(); state.path = 'challenge'; state.task = null; state.step = 4; state.taskSolved = false;
    state.baseline = { v: state.v, r: state.r }; state.prediction = null; state.revealed = false;
    clearErrors(); $('baseline-status').textContent = ''; setAnalysisDisclosure(true); render(); showLesson();
  }
  $('return-explore').addEventListener('click', enterExplore);
  $('check-answer').addEventListener('click', async () => {
    const task = tasks[state.task];
    const correct = matches(state.v, state.r, task.target);
    $('task-feedback').classList.toggle('feedback-success', correct);
    $('task-feedback').classList.toggle('feedback-guidance', !correct);
    if (correct) { state.completed.add(state.task); state.taskSolved = true; setAnalysisDisclosure(true); $('task-feedback').textContent = '答對了！' + task.explanation; renderChrome(); signalChange(task.key); }
    else { const actual = current(state.v, state.r); $('task-feedback').textContent = `目前是 ${f(actual * 1000)} mA，比目標${actual > task.target ? '高' : '低'}。再調整${task.key === 'v' ? '電壓' : '電阻'}試試，或展開提示。`; replayClass($('task-feedback'), 'feedback-pulse'); }
    await scrollToElement(document.querySelector('.current-comparison'));
  });
  render();
})();
