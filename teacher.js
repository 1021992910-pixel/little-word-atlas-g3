/* One button: hear each grapheme, blend the word, then try it yourself. */
function teacherPanel(w){
 const lesson=TEACHER_LESSONS[w.id];
 if(PACED_PHONICS[w.id])return pacedPanel(w,lesson.audio,'',lesson.hint);
 return `<section class="blend-panel" data-teacher-lesson="${w.id}" aria-label="${escapeHTML(w.word)} 拼读"><p class="blend-lead">先分开听，再听老师连起来。</p><div class="blend-row" aria-label="${escapeHTML(w.word)} 的声音分组">${lesson.parts.map((part,i)=>`<span class="blend-part ${i===lesson.focus?'special-part':''}" data-blend-part="${i}"><b>${escapeHTML(part)}</b><i aria-hidden="true"></i></span>`).join('')}<span class="blend-arrow" aria-hidden="true">→</span><strong class="blend-word" data-blend-word>${escapeHTML(w.word)}</strong></div><p class="blend-hint" data-blend-hint><span aria-hidden="true">♪</span> ${escapeHTML(lesson.hint)}</p><p class="blend-status" data-blend-status role="status">听老师拼一遍，再轮到你。</p><div class="blend-controls"><button class="primary" data-transport="${lesson.audio}" data-teacher-control>▶ 带我拼读</button><small>约 ${Math.round(lesson.duration)} 秒</small></div></section>`;
}
function teacherText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function syncTeacherLesson(){
 const panel=document.querySelector('[data-teacher-lesson]');if(!panel)return;
 const lesson=TEACHER_LESSONS[panel.dataset.teacherLesson],a=activeAudio;
 const matched=!!(a&&activeAudioName===lesson.audio),loading=matched&&audioLoading;
 const playing=matched&&!a.paused&&!a.ended&&!loading,finished=matched&&a.ended;
 const step=matched&&!loading?lesson.steps.find(s=>a.currentTime>=s.start&&a.currentTime<s.end):null;
 const button=panel.querySelector('[data-teacher-control]');
 const label=loading?'正在准备声音…':playing?'Ⅱ 暂停拼读':finished?'↻ 再拼一遍':matched&&a.currentTime>0?'▶ 继续拼读':'▶ 带我拼读';
 teacherText(button,label);button.disabled=loading;button.setAttribute('aria-label',loading?label:label.slice(2));
 const paced=PACED_PHONICS[panel.dataset.teacherLesson];
 if(paced){syncPacedPanel(panel,paced,a,matched,loading);return;}
 teacherText(panel.querySelector('[data-blend-status]'),loading?'正在准备声音…':finished?'现在试着自己拼一遍，也可以再听一次。':matched&&a.paused?'已暂停，点按钮继续。':step?.phase==='reminder'?'留意亮起来的部分，听老师的小提醒。':step?.text||'听老师拼一遍，再轮到你。');
 const linked=step?.phase==='connected';
 const index=linked?step.phones?.find(p=>a.currentTime>=p.start&&a.currentTime<p.end)?.index:step?.index;
 panel.querySelectorAll('[data-blend-part]').forEach(part=>{
  const current=matched&&Number.isInteger(index)&&Number(part.dataset.blendPart)===index;
  part.classList.toggle('reading-now',!!current);
  part.classList.toggle('blending-done',!!(linked&&Number.isInteger(index)&&Number(part.dataset.blendPart)<index));
  if(current)part.setAttribute('aria-current','true');else part.removeAttribute('aria-current');
 });
 panel.querySelector('[data-blend-word]').classList.toggle('reading-now',!!(step&&['blend','connected','word','echo'].includes(step.phase)));
 panel.querySelector('[data-blend-hint]').classList.toggle('reminder-now',step?.phase==='reminder');
}
