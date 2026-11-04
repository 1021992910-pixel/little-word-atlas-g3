/* Shared word-card view for the course and the independent experience. */
function pacedPanel(w, audioName, guideAttribute, hint) {
 const lesson = PACED_PHONICS[w.id];
 const id = escapeHTML(w.id);
 const title = [...lesson.word].map((letter, i) => `<span data-paced-letter="${i}">${escapeHTML(letter)}</span>`).join('');
 const headers = lesson.grid.map(([part], i) => `<th scope="col" data-paced-cell="${i}">${escapeHTML(part.replace('_','…'))}</th>`).join('');
 const sounds = lesson.grid.map(([, sound], i) => `<td data-paced-cell="${i}">${escapeHTML(sound)}</td>`).join('');
 return `<section class="blend-panel paced-panel" data-teacher-lesson="${id}" aria-label="${escapeHTML(w.word)} 拼读">
  <div class="paced-word" lang="en-GB" aria-label="${escapeHTML(w.word)}">${title}</div>
  <p class="paced-ipa">${escapeHTML(w.ipa)} <span>${escapeHTML(w.meaning)}</span></p>
  <table class="paced-grid" aria-label="字母和读音" aria-hidden="true"><thead><tr>${headers}</tr></thead><tbody><tr>${sounds}</tr></tbody></table>
  <span class="paced-stage" data-paced-stage>${lesson.split ? '拆分音节' : '先听整词'}</span>
  <p class="paced-hint">${escapeHTML(hint || '')}</p>
  <p class="blend-status" data-blend-status role="status">点一下，跟着声音读。</p>
  <div class="blend-controls"><button class="primary" data-transport="${escapeHTML(audioName)}" data-teacher-control ${guideAttribute}>▶ 带我拼读</button><small>约 ${Math.round(lesson.duration)} 秒</small></div>
 </section>`;
}

function syncPacedPanel(panel, lesson, media, matched, preparing) {
 const time = matched && !preparing ? media.currentTime : 0;
 const second = time >= lesson.stageTwo;
 const finished = matched && media.ended;
 const cue = lesson.cues.find(step => time >= step.start && time < step.end);
 const whole = finished || time >= lesson.finalStart;
 panel.querySelector('.paced-grid').setAttribute('aria-hidden', String(!second));
 teacherText(panel.querySelector('[data-paced-stage]'), !second ? (lesson.split ? '拆分音节' : '先听整词') : '自然拼读');
 panel.querySelectorAll('[data-paced-letter]').forEach(el => {
  el.classList.toggle('sound-on', whole || Boolean(cue?.letters.includes(Number(el.dataset.pacedLetter))));
 });
 panel.querySelectorAll('[data-paced-cell]').forEach(el => {
  el.classList.toggle('sound-on', second && Boolean(cue?.cells.includes(Number(el.dataset.pacedCell))));
 });
 teacherText(panel.querySelector('[data-blend-status]'), preparing ? '正在准备声音…'
  : finished || (whole && !cue) ? '轮到你读一遍了。'
  : matched && media.paused ? '已暂停，点一下继续。'
  : !matched ? '点一下，跟着声音读。'
  : !second ? '听一听这个词。'
  : time < lesson.blendStart ? '看字母，听声音。'
  : time < lesson.finalStart ? '把声音接起来。' : '听完整单词。');
}
