'use strict';
const WORDS = [
  {id:'friend',word:'friend',ipa:'/frend/',pos:'n.',meaning:'朋友',tone:'#edf0df',tip:'一起玩耍、互相帮助的人，就是 friend。',example:'This is my friend.',translation:'这是我的朋友。',audio:'friend',sentence:'friend-sentence'},
  {id:'meet',word:'meet',ipa:'/miːt/',pos:'v.',meaning:'认识；结识',tone:'#f6e9dd',tip:'第一次见到新朋友，试着说：Nice to meet you.',example:'Nice to meet you.',translation:'很高兴认识你。',audio:'meet',sentence:'meet-sentence'},
  {id:'play',word:'play',ipa:'/pleɪ/',pos:'v.',meaning:'玩；玩耍',tone:'#e3ece7',tip:'把玩球的画面和 play 连在一起记。',example:"Let's play.",translation:'让我们一起玩吧。',audio:'play',sentence:'play-sentence'},
  {id:'happy',word:'happy',ipa:'/ˈhæpi/',pos:'adj.',meaning:'高兴的；快乐的',tone:'#fbefce',tip:'风筝飞起来了，她开心地笑了。这样的心情就是 happy。',example:"I'm happy.",translation:'我很高兴。',audio:'happy',sentence:'happy-sentence'},
  {id:'you',word:'you',ipa:'/juː/',pos:'pron.',meaning:'你；你们',tone:'#eee6e9',tip:'对着朋友说话，用 you 表示“你”。you 也可以表示“你们”。',example:'You are my friend.',translation:'你是我的朋友。',audio:'you',sentence:'you-sentence'},
  {id:'lets',word:"let's",ipa:'/lets/',pos:'let us 的缩写',meaning:'让我们',tone:'#e8ebda',tip:'提出一起做某事的邀请，可以用 let’s。别忘了中间的小撇号。',example:"Let's be friends.",translation:'让我们成为朋友吧。',audio:'lets',sentence:'lets-sentence'},
  {id:'to',word:'to',ipa:'/tuː/',pos:'prep. / 与动词等连用',meaning:'向；到；与动词等连用',tone:'#f2e8d8',tip:'在 Nice to meet you. 里，to 和 meet 连用，不单独翻译。',example:'Nice to meet you.',translation:'很高兴认识你。',audio:'to',sentence:'meet-sentence'}
];
const SENTENCES=[{text:"I'm Mia.",zh:'我是米娅。',audio:'introduce-self',target:"I'm"},{text:'She is my friend.',zh:'她是我的朋友。',audio:'introduce-friend',target:'friend'},{text:"We're friends.",zh:'我们是朋友。',audio:'we-friends',target:'friends'}];
const SCENES={friend:{caption:'课间，朋友帮忙捡起掉落的书。',alt:'校园里，男孩帮助女孩捡书，两位朋友微笑相望。'},meet:{caption:'新同学第一次见面，挥手问好。',alt:'明亮的教室门口，两位新同学在老师介绍下挥手打招呼。'},play:{caption:'放学后，和朋友一起踢球。',alt:'学校操场上，三个孩子开心地追逐、传递足球。'},happy:{caption:'风筝飞起来了，她开心地笑了。',alt:'女孩成功放起风筝，露出开心笑容，男孩在旁鼓励。'},you:{caption:'看着对面的朋友说：你是我的朋友。',alt:'美术教室里，女孩微笑着对男孩说话，用手势示意对方。'},lets:{caption:'发出邀请：让我们一起玩吧。',alt:'积木桌旁，男孩伸手邀请女孩坐到身边一起搭城堡。'},to:{caption:'认识新朋友：Nice to meet you.',alt:'图书室门口，男孩和女孩微笑握手，第一次认识彼此。'}};
const STORE_KEY='little-word-atlas-g3-u1-v1';
const root=document.querySelector('#main-content');
let persistenceOK=true;
let state={schema:1,words:{},history:[],speed:1,adventure:AdventureModel.blank()};
const escapeHTML = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function sanitizeState(data){
  if(!data||data.schema!==1||typeof data.words!=='object'||!data.words)throw new Error('格式不正确');
  const clean={schema:1,words:{},history:[],speed:[0.8,1].includes(data.speed)?data.speed:1,adventure:AdventureModel.sanitize(data.adventure)};
  for(const w of WORDS){const r=data.words[w.id];if(r&&Number.isInteger(r.level)&&r.level>=0&&r.level<=5&&Number.isFinite(r.due)&&r.due>=0){clean.words[w.id]={level:r.level,due:r.due,last:Number.isFinite(r.last)?r.last:0};}}
  if(Array.isArray(data.history))clean.history=data.history.filter(x=>x&&['picture','listen','spell'].includes(x.mode)&&Number.isInteger(x.correct)&&Number.isInteger(x.total)&&x.total>0&&x.total<=7&&x.correct>=0&&x.correct<=x.total&&Number.isFinite(x.at)).slice(-100).map(x=>({mode:x.mode,correct:x.correct,total:x.total,at:x.at}));
  return clean;
}
try{const stored=localStorage.getItem(STORE_KEY);if(stored)state=sanitizeState(JSON.parse(stored));}catch{persistenceOK=false;}
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));persistenceOK=true;}catch{persistenceOK=false;toast('当前浏览器无法保存，请导出记录备份。');}updateBadge();}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('toast-visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('toast-visible'),3000);}
const learned=()=>WORDS.filter(w=>(state.words[w.id]?.level||0)>0);
const dueWords=()=>WORDS.filter(w=>state.words[w.id]&&state.words[w.id].due<=Date.now());
function updateBadge(){document.querySelector('#review-badge').textContent=dueWords().length;}
function markWord(id,success){
  const previous=state.words[id];const level=success?Math.min(5,(previous?.level||0)+1):0;
  const days=[0,1,3,7,14,30];
  state.words[id]={level,due:success?Date.now()+days[level]*86400000:Date.now(),last:Date.now()};save();if(currentRoute==='stars')renderStars(success&&!(previous?.level>0)?id:'');
}
function statusFor(w){const r=state.words[w.id];return !r?'new':r.level===0?'weak':'known';}
function statusLabel(w){return ({new:'初次见面',weak:'再练一练',known:'已认识'})[statusFor(w)];}
const volumeIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/></svg>';
let activeAudio=null;
let activeAudioName='',audioAnimation=0,playGeneration=0;
let audioLoading=false;
const audioBlobCache=new Map();
function bufferedAudioSource(name){
  if(!audioBlobCache.has(name)){
    const source=`./assets/audio/${name}.mp3${['guided-meet-v6','sound-ee'].includes(name)?'?v=clear1':''}`;
    const pending=fetch(source).then(async response=>{
      if(!response.ok)throw new Error('Audio download failed');
      const bytes=await response.arrayBuffer();
      return URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));
    }).catch(error=>{audioBlobCache.delete(name);throw error;});
    audioBlobCache.set(name,pending);
  }
  return audioBlobCache.get(name);
}
function syncHighlight(){
  const a=activeAudio;
  document.querySelectorAll('[data-karaoke]').forEach(container=>{
    const matches=container.dataset.karaoke===activeAudioName;
    const words=AUDIO_TIMINGS[container.dataset.karaoke]?.words||[];
    container.querySelectorAll('[data-token]').forEach(token=>{
      const timed=words[Number(token.dataset.token)];
      const isCurrent=!!(matches&&a&&timed&&a.currentTime>=timed.start&&a.currentTime<timed.end&&!a.ended);
      token.classList.toggle('reading-now',isCurrent);
      token.classList.toggle('reading-done',!!(matches&&a&&timed&&a.currentTime>=timed.end));
      if(isCurrent)token.setAttribute('aria-current','true');else token.removeAttribute('aria-current');
    });
  });
  document.querySelectorAll('[data-transport]').forEach(button=>{
    const playing=activeAudioName===button.dataset.transport&&a&&!a.paused&&!a.ended;
    if(button.hasAttribute('data-teacher-control'))return;
    button.textContent=playing?'Ⅱ 暂停':'▶ 跟着听';
    button.setAttribute('aria-label',playing?'暂停例句朗读':'播放例句并逐词高亮');
  });
  syncTeacherLesson();
  if(a&&!a.paused&&!a.ended)audioAnimation=requestAnimationFrame(syncHighlight);
}
async function playAudio(name,start=0){
  stopAudio();const generation=playGeneration;
  const a=document.querySelector('#pronunciation-audio');
  activeAudio=a;activeAudioName=name;a.playbackRate=state.speed;audioLoading=true;syncHighlight();
  try{
    const source=await bufferedAudioSource(name);
    if(generation!==playGeneration)return;
    a.dataset.clip=name;
    if(a.getAttribute('src')!==source||a.readyState<1){
      const ready=new Promise((resolve,reject)=>{
        const clean=()=>{a.removeEventListener('loadedmetadata',done);a.removeEventListener('error',failed);};
        const done=()=>{clean();resolve();};
        const failed=()=>{clean();reject(new Error('Audio unavailable'));};
        a.addEventListener('loadedmetadata',done,{once:true});a.addEventListener('error',failed,{once:true});
      });
      a.src=source;a.load();await ready;
    }
    if(generation!==playGeneration)return;
    audioLoading=false;
    a.currentTime=start;
    a.playbackRate=state.speed;
    await a.play();if(generation===playGeneration){cancelAnimationFrame(audioAnimation);syncHighlight();}
  }catch{if(generation===playGeneration){audioLoading=false;activeAudio=null;activeAudioName='';syncHighlight();toast('发音暂时未能播放，请再点一次喇叭。');}}
}
function stopAudio(){audioLoading=false;playGeneration++;cancelAnimationFrame(audioAnimation);if(activeAudio)activeAudio.pause();activeAudio=null;activeAudioName='';syncHighlight();}
function toggleAudio(name){
  if(audioLoading&&activeAudioName===name)return;
  if(activeAudio&&activeAudioName===name&&!activeAudio.ended){
    if(activeAudio.paused){activeAudio.play().then(()=>{cancelAnimationFrame(audioAnimation);syncHighlight();}).catch(()=>toast('请再点一次播放。'));}
    else{activeAudio.pause();cancelAnimationFrame(audioAnimation);syncHighlight();}
  }else playAudio(name);
}
function karaoke(name,target=''){
  const info=AUDIO_TIMINGS[name];if(!info)return '';
  const focused=normalize(target||'').replace(/[^a-z]/g,'');
  return `<span class="karaoke-line" data-karaoke="${name}">${info.words.map((word,i)=>{
    const base=normalize(word.text).replace(/[^a-z]/g,'');
    return `<button type="button" class="spoken-word ${focused&&base===focused?'focus-word':''}" data-seek="${name}" data-token="${i}" aria-label="从 ${escapeHTML(word.text)} 开始听">${escapeHTML(word.text)}</button>`;
  }).join(' ')}</span>`;
}
function speakingPanel(name,target,translation){return `<div class="speaking-panel"><div class="speaking-label"><span>听一句 · 说一句</span><span>英式发音 GB</span></div>${karaoke(name,target)}<p class="speaking-translation">${escapeHTML(translation)}</p><div class="speaking-controls"><button class="primary" data-transport="${name}" aria-label="播放例句并逐词高亮">▶ 跟着听</button><button class="secondary" data-audio="${name}">↻ 重播</button><button class="slow-control ${state.speed===0.8?'selected':''}" data-slow aria-pressed="${state.speed===0.8}">慢速 ${state.speed===0.8?'开':'关'}</button></div><p class="speaking-hint">重点词加粗 · 读到哪里，哪里亮 · 点词可以从这里听</p></div>`;}
document.querySelector('#pronunciation-audio').addEventListener('ended',()=>{cancelAnimationFrame(audioAnimation);syncHighlight();});
document.querySelector('#pronunciation-audio').addEventListener('seeked',()=>{cancelAnimationFrame(audioAnimation);syncHighlight();});
function illustration(id,label=''){
  return `<img class="scene-image" src="${sceneSource(id)}" alt="${escapeHTML(label||SCENES[id].alt)}" width="1448" height="1086" decoding="async" loading="lazy">`;
}
function sceneSource(id){return `./assets/scenes/${id}.webp`;}
function heroArt(){return `<img src="${sceneSource('meet')}" alt="新同学第一次见面，互相挥手问好。" width="1448" height="1086">`;}
let currentRoute='learn',filter='all',search='',quiz=null,currentWordIndex=0,wordView='sentence';
function route(name){
  adventureCleanup();
  if(!['learn','practice','review','stars'].includes(name))name='learn';
  stopAudio();currentRoute=name;quiz=null;document.querySelectorAll('[data-route]').forEach(b=>{b.classList.toggle('active',b.dataset.route===name);if(b.dataset.route===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  history.replaceState(null,'',`#${name}`);render();
}
function crumb(label){return `<div class="breadcrumb"><span>我的英语图鉴</span><span>/</span><b>Unit 1 · ${label}</b></div>`;}
function render(){updateBadge();if(currentRoute==='learn')renderLearn();if(currentRoute==='practice')renderPractice();if(currentRoute==='review')renderReview();if(currentRoute==='stars')renderStars();}
function card(w,index){return `<article class="word-card" style="--tone:${w.tone}"><button class="card-open" data-word="${w.id}" aria-label="学习 ${escapeHTML(w.word)}：${escapeHTML(w.meaning)}"><div class="card-art"><span class="card-number">${String(index+1).padStart(2,'0')}</span>${statusFor(w)!=='new'?`<span class="card-status">${statusLabel(w)}</span>`:''}${illustration(w.id)}</div><div class="card-info"><p class="card-scene-caption">${escapeHTML(SCENES[w.id].caption)}</p><h3>${escapeHTML(w.word)}</h3><p>${w.ipa}</p><span class="phonics-badge ${PHONICS[w.id].kind.includes("特别")?"special":""}">${escapeHTML(PHONICS[w.id].tag)}</span><div class="card-bottom"><span>${escapeHTML(w.meaning)}</span><span style="width:29px;height:29px"></span></div></div></button><button class="sound inline-sound" data-audio="${w.audio}" aria-label="听 ${escapeHTML(w.word)} 的发音">${volumeIcon}</button></article>`;}
function filteredWords(){return WORDS.filter(w=>(filter==='all'||filter===statusFor(w))&&(!search||(w.word+' '+w.meaning).toLowerCase().includes(search.toLowerCase())));}
function renderGrid(){const grid=document.querySelector('#word-grid');if(grid)grid.innerHTML=filteredWords().map(w=>card(w,WORDS.indexOf(w))).join('')||'<div class="empty-state"><span class="empty-icon">✧</span><h3>这里还没有单词</h3><p>试试切换筛选，或换个词搜索。</p></div>';}
function renderLearn(){
  const n=learned().length;
  root.innerHTML=`${crumb('交个朋友吧')}<section class="hero"><div><span class="eyebrow">UNIT 01 · A NEW LITTLE ADVENTURE</span><h1>Let’s be <em>friends!</em></h1><p>交个朋友吧！从一声 Hello 开始，<br>把每一个新单词，变成一位老朋友。</p><div class="hero-tags"><span class="tag">外研版 · 三年级上册</span><span class="tag">7 个新增词语</span><span class="tag">问候与介绍</span></div></div><div class="hero-art">${heroArt()}</div></section><section class="study-strip" aria-label="单元学习进度"><div class="strip-copy"><span class="strip-icon">✦</span><div><b>${n===7?'七位单词朋友，都认识啦！':'今天，认识几位新朋友？'}</b><p>听一听、想一想，每天进步一点点。</p></div></div><div class="strip-progress"><div class="progress-label"><span>本单元已认识</span><strong>${n} / 7</strong></div><div class="progress-track" role="progressbar" aria-label="已认识词语" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="7"><div class="progress-fill" style="width:${n/7*100}%"></div></div></div><button class="primary" id="continue-learning">${n===7?'再看一遍':'开始学词'} <span>→</span></button></section><div class="section-heading"><h2>我的场景单词图鉴</h2><span class="serif-note">a word, a little world</span><label class="searchbox"><span>⌕</span><input id="word-search" type="search" placeholder="找单词或中文" aria-label="搜索单词或中文" value="${escapeHTML(search)}"></label></div><div class="filter-tabs" role="group" aria-label="词语筛选">${[['all','全部词语'],['new','还没认识'],['known','已认识'],['weak','再练一练']].map(([key,label])=>`<button data-filter="${key}" aria-pressed="${filter===key}" class="${filter===key?'active':''}">${label}</button>`).join('')}</div><div id="word-grid" class="word-grid"></div>${phonicsDiscovery()}<div class="section-heading sentence-heading"><h2>把单词说成一句话</h2><span class="serif-note">say hello to the world</span></div><div class="sentence-grid">${SENTENCES.map(s=>`<div class="sentence">${karaoke(s.audio,s.target)}<p class="sentence-translation">${s.zh}</p><button class="sound" data-audio="${s.audio}" aria-label="朗读：${escapeHTML(s.text)}">${volumeIcon}</button></div>`).join('')}</div><p class="bottom-note ${persistenceOK?'':'progress-warning'}"><span>◌</span>${persistenceOK?'学习进度自动保存在当前浏览器。点开词卡，认识它，再亲口说一说。':'当前浏览器未能读取或保存记录，请通过设置导出备份。'}</p>`;
  renderGrid();
  document.querySelector('#word-search').addEventListener('input',event=>{search=event.target.value;renderGrid();});
  document.querySelector('#continue-learning').addEventListener('click',()=>openWord((WORDS.find(w=>statusFor(w)!=='known')||WORDS[0]).id));
}
function openWord(id,view='sentence'){stopAudio();wordView=view;currentWordIndex=WORDS.findIndex(w=>w.id===id);if(currentWordIndex<0)return;renderWord();const d=document.querySelector('#word-dialog');if(!d.open)d.showModal();}
function renderWord(){
  const w=WORDS[currentWordIndex];const d=document.querySelector('#word-dialog');
  d.classList.toggle('showing-phonics',wordView==='phonics');
  d.innerHTML=`<div class="modal-heading"><div><span class="eyebrow">UNIT 1 · WORD ${String(currentWordIndex+1).padStart(2,'0')}</span><p style="font-size:11px;color:#8b9780;margin-top:5px">${statusLabel(w)}</p></div><button class="close-button" data-close="word-dialog" aria-label="关闭词卡">×</button></div><div class="modal-content-grid"><div class="scene-side"><div class="modal-art" style="--tone:${w.tone}">${illustration(w.id,`${w.word}的场景插画`)}</div><p class="modal-scene-caption">${escapeHTML(SCENES[w.id].caption)}</p><div class="memory-tip"><b>记忆小线索</b>${escapeHTML(w.tip)}</div></div><div class="learning-side"><div class="word-title-row"><h2 id="word-title" aria-label="${escapeHTML(w.word)}">${karaoke(w.audio,w.word)}</h2><button class="sound big-sound" data-audio="${w.audio}" aria-label="听 ${escapeHTML(w.word)} 的发音">${volumeIcon}</button></div><p class="pronunciation">${w.ipa} <small class="word-pos">${escapeHTML(w.pos)}</small> <span style="margin-left:8px;font-size:10px">英式发音 GB · Sonia</span></p><p class="word-meaning">${escapeHTML(w.meaning)}</p><div class="word-tabs" role="tablist" aria-label="词卡学习方式"><button id="tab-sentence" class="word-tab ${wordView==="sentence"?"active":""}" role="tab" aria-selected="${wordView==="sentence"}" aria-controls="word-sentence-view" data-word-view="sentence">听句子</button><button id="tab-phonics" class="word-tab ${wordView==="phonics"?"active":""}" role="tab" aria-selected="${wordView==="phonics"}" aria-controls="word-phonics-view" data-word-view="phonics">带我拼读</button></div><section id="word-sentence-view" class="word-learning-panel" role="tabpanel" aria-labelledby="tab-sentence" ${wordView==="sentence"?"":"hidden"}>${speakingPanel(w.sentence,w.word,w.translation)}</section><section id="word-phonics-view" class="word-learning-panel" role="tabpanel" aria-labelledby="tab-phonics" ${wordView==="phonics"?"":"hidden"}>${phonicsPanel(w)}</section></div></div><div class="modal-actions"><button class="secondary" id="word-again">还想再练练</button><button class="primary" id="word-known">我认识它了 ✓</button></div><div class="word-pagination"><button id="previous-word" ${currentWordIndex===0?'disabled':''}>← 上一个</button><span>${currentWordIndex+1} / 7</span><button id="next-word" ${currentWordIndex===6?'disabled':''}>下一个 →</button></div>`;
  document.querySelector('#word-known').onclick=()=>{markWord(w.id,true);toast(`已记住 ${w.word}，已安排后续复习。`);advanceWord();};
  document.querySelector('#word-again').onclick=()=>{markWord(w.id,false);toast('已放入复习，等会儿再试一次。');advanceWord();};
  document.querySelector('#previous-word').onclick=()=>{stopAudio();currentWordIndex--;renderWord();};
  document.querySelector('#next-word').onclick=()=>{stopAudio();currentWordIndex++;renderWord();};
}
function advanceWord(){stopAudio();if(currentWordIndex<6){currentWordIndex++;renderWord();}else{document.querySelector('#word-dialog').close();render();}}
function pageIntro(title,sub,label){return `${crumb(label)}<div class="page-intro"><span class="eyebrow">UNIT 01 · LET’S BE FRIENDS!</span><h1>${title}</h1><p>${sub}</p></div>`;}
function renderPractice(){renderAdventure();}
function shuffle(list){const result=[...list];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function startQuiz(mode,list=WORDS,review=false){stopAudio();quiz={mode,items:shuffle(list),index:0,correct:0,answered:false,review};renderQuestion();}
function renderQuestion(){
  if(!quiz)return;
  const q=quiz,w=q.items[q.index];q.answered=false;q.options=shuffle([w,...shuffle(WORDS.filter(x=>x.id!==w.id)).slice(0,3)]);
  const title={picture:'看图找朋友',listen:'听音小侦探',spell:'单词拼拼乐'}[q.mode];
  root.innerHTML=`${pageIntro(title,'慢慢想，答错了也能学到新东西。',q.review?'复习练习':'趣味闯关')}<section class="quiz-box"><div class="quiz-top"><span>第 ${q.index+1} / ${q.items.length} 题</span><button class="quiet-button" id="exit-quiz">结束练习 ×</button></div><div class="progress-track"><div class="progress-fill" style="width:${q.index/q.items.length*100}%"></div></div><h2 class="quiz-prompt">${q.mode==='picture'?'画面对应哪个单词？':q.mode==='listen'?'听一听，是哪位单词朋友？':escapeHTML(w.meaning)}</h2><p class="quiz-sub">${q.mode==='spell'?'先听完整单词，再自己拼一拼。':q.mode==='listen'?'点喇叭可以重复听。':escapeHTML(w.meaning)}</p>${['listen','spell'].includes(q.mode)?`<button class="listen-orb" data-audio="${w.audio}" aria-label="播放本题完整单词">${volumeIcon}${q.mode==='spell'?'<span>听单词</span>':''}</button>`:`<div class="quiz-illustration" style="--tone:${w.tone}">${illustration(w.id)}</div>`}${q.mode==='spell'?`<form class="spell-form" id="spell-form"><input id="spell-answer" aria-label="输入单词" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="30" placeholder="在这里拼单词"><button class="primary" type="submit">检查答案</button></form><p class="spell-hint">${w.word.length} 个字符${w.id==='lets'?'，含中间的小撇号':''}</p>`:`<div class="options">${q.options.map(o=>`<button class="option" data-answer="${o.id}">${escapeHTML(o.word)}</button>`).join('')}</div>`}<div class="feedback" id="answer-feedback" role="status" aria-live="polite"></div><div class="next-row" id="next-row"></div></section>`;
  document.querySelector('#exit-quiz').onclick=()=>{quiz=null;stopAudio();render();};
  if(q.mode==='spell'){document.querySelector('#spell-form').onsubmit=event=>{event.preventDefault();const input=document.querySelector('#spell-answer');if(!input.value.trim()){input.focus();toast('先试着输入一个单词吧。');return;}answer(normalize(input.value)===normalize(w.word));};}
}
function normalize(text){return text.toLowerCase().trim().replace(/[’‘]/g,"'");}
function answer(correct,selected){
  if(!quiz||quiz.answered)return;
  const q=quiz,w=q.items[q.index];q.answered=true;if(correct)q.correct++;
  markWord(w.id,correct);
  document.querySelectorAll('.option').forEach(b=>{b.disabled=true;if(b.dataset.answer===w.id)b.classList.add('correct');else if(b.dataset.answer===selected)b.classList.add('wrong');});
  document.querySelectorAll('#spell-form input,#spell-form button').forEach(el=>el.disabled=true);
  document.querySelector('#answer-feedback').textContent=correct?`答对了！${w.word} · ${w.meaning}`:`这位朋友叫 ${w.word}（${w.meaning}）。听一遍，再记住它。`;
  document.querySelector('#next-row').innerHTML=`<button class="secondary" data-audio="${w.audio}">再听一遍 ♪</button><button class="primary" id="next-question">${q.index+1<q.items.length?'下一题 →':'看看我的成绩 ✦'}</button>`;
  document.querySelector('#next-question').onclick=()=>{stopAudio();q.index++;if(q.index<q.items.length)renderQuestion();else finishQuiz();};
}
function finishQuiz(){const q=quiz;state.history.push({mode:q.mode,correct:q.correct,total:q.items.length,at:Date.now()});state.history=state.history.slice(-100);save();root.innerHTML=`${pageIntro('又向前走了一小步','每一次认真练习，都在给记忆加一点光。','练习完成')}<section class="quiz-box result"><span class="result-icon">✦</span><h2>${q.correct===q.items.length?'全部答对，真棒！':'小挑战完成啦！'}</h2><div class="score">${q.correct}<small> / ${q.items.length}</small></div><p>首次作答正确题数</p><p style="margin-top:12px">${q.correct===q.items.length?'今天认识的朋友，明天记得来看看。':'做错的单词已加入复习，再见一次就更熟啦。'}</p><div class="result-actions"><button class="secondary" id="quiz-again">再挑战一次</button><button class="primary" data-go="${q.correct===q.items.length?'stars':'review'}">${q.correct===q.items.length?'点亮我的星图':'去复习一下'} →</button></div></section>`;document.querySelector('#quiz-again').onclick=()=>startQuiz(q.mode,q.items,q.review);quiz=null;}
function renderReview(){const due=dueWords();const seen=WORDS.filter(w=>state.words[w.id]);root.innerHTML=`${pageIntro('和老朋友，再见一面','容易忘记的词，多见几次就会越来越熟。','我的复习')}<section class="study-strip"><div class="strip-copy"><span class="strip-icon">↻</span><div><b>现在有 ${due.length} 个词语等你复习</b><p>${due.length?'用一轮小练习，重新加深印象。':'认识词语后，会从明天开始安排复习。'}</p></div></div><div class="strip-progress"><div class="progress-label"><span>已经接触的词语</span><strong>${seen.length} / 7</strong></div><div class="progress-track"><div class="progress-fill" style="width:${seen.length/7*100}%"></div></div></div>${due.length?'<button class="primary" id="review-start">开始复习 →</button>':'<button class="secondary" data-go="learn">去学词 →</button>'}</section><div class="section-heading review-heading"><h2>现在复习</h2><span class="serif-note">hello, again</span></div><div class="word-grid">${due.length?due.map(w=>card(w,WORDS.indexOf(w))).join(''):'<div class="empty-state"><span class="empty-icon">☼</span><h3>现在没有到期的词语</h3><p>你可以去认识新词，也可以打开下面的词卡再看一遍。</p></div>'}</div>${seen.filter(w=>!due.includes(w)).length?`<div class="section-heading review-heading"><h2>之后再见</h2></div><div class="word-grid">${seen.filter(w=>!due.includes(w)).map(w=>card(w,WORDS.indexOf(w))).join('')}</div>`:''}<p class="bottom-note"><span>◌</span>答对后逐步安排在 1、3、7、14、30 天后复习；答错的词现在就能重练。</p>`;if(due.length)document.querySelector('#review-start').onclick=()=>startQuiz('picture',due,true);}
function renderStars(newlyLitId=''){
  const n=learned().length;
  const spots=[[17,28],[50,20],[83,29],[20,58],[81,61],[39,71],[63,74]];
  const edges=[[0,1],[1,2],[2,4],[4,6],[6,5],[5,3],[3,0],[3,2],[5,1]];
  const dust=Array.from({length:95},(_,i)=>`<i style="left:${((i*61.73+3)%100).toFixed(2)}%;top:${((i*37.19+7)%100).toFixed(2)}%;--dust-size:${i%7===0?2.5:i%3===0?1.7:1}px;--twinkle-duration:${4+i%6}s;--twinkle-delay:-${(i*.71).toFixed(2)}s"></i>`).join('');
  const lines=edges.map(([a,b])=>`<line class="${statusFor(WORDS[a])==='known'&&statusFor(WORDS[b])==='known'?'connected':''}" x1="${spots[a][0]}" y1="${spots[a][1]}" x2="${spots[b][0]}" y2="${spots[b][1]}"/>`).join('');
  root.innerHTML=`${pageIntro('你的单词小星空','认识一个单词，点亮一颗属于你的星星。','学习星图')}<section class="star-canvas" aria-label="单词学习星图，已点亮 ${n} 颗，共 7 颗"><div class="star-dust" aria-hidden="true">${dust}</div><div class="star-sky-heading"><span>友谊星 <small>UNIT 01</small></span><span class="star-sky-count"><i aria-hidden="true"></i>已点亮 <b>${n}</b> / 7</span></div><svg class="star-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg><div class="star-center" aria-hidden="true"><span class="star-planet"></span><small>LET’S BE FRIENDS</small></div>${WORDS.map((w,i)=>{const lit=statusFor(w)==='known';return `<button class="star-word ${lit?'lit':''} ${w.id===newlyLitId?'just-lit':''}" data-word="${w.id}" style="left:${spots[i][0]}%;top:${spots[i][1]}%;--star-delay:-${(i*.83).toFixed(2)}s;--star-duration:${3.8+i*.37}s" aria-label="${escapeHTML(w.word)}：${lit?'已点亮，已认识':'未点亮，'+statusLabel(w)}"><span class="star-light" aria-hidden="true"><svg viewBox="0 0 80 80"><path class="star-ray" d="M40 3C43 31 49 37 77 40C49 43 43 49 40 77C37 49 31 43 3 40C31 37 37 31 40 3Z"/><circle class="star-core" cx="40" cy="40" r="5"/></svg></span><span class="star-word-label">${escapeHTML(w.word)}</span><small class="star-word-state">${lit?'已点亮':'待点亮'}</small></button>`;}).join('')}<p class="star-caption">${n===7?'七颗单词星都亮啦！记得回来和它们打招呼。':'点击单词星，学会后点「我认识它了」'}<span>暗星等待相识 · 亮星记录进步</span></p></section><div class="stats-row"><div class="stat"><strong>${n}<small> / 7</small></strong><span>已点亮的单词</span></div><div class="stat"><strong>${state.history.length}</strong><span>完成的练习</span></div><div class="stat"><strong>${dueWords().length}</strong><span>现在可以复习</span></div></div><p class="bottom-note"><span>✧</span>星星跟随当前学习记录，做错的词再练会，就会重新亮起来。</p>`;
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(handlePhonicsButton(target))return;
  if(target.dataset.seek){const word=AUDIO_TIMINGS[target.dataset.seek]?.words[Number(target.dataset.token)];if(word)playAudio(target.dataset.seek,Math.max(0,word.start-0.015));return;}
  if(target.dataset.transport){toggleAudio(target.dataset.transport);return;}
  if(target.hasAttribute('data-slow')){setSpeed(state.speed===0.8?1:0.8);return;}
  if(target.hasAttribute('data-source')){showAudioSource();return;}
  if(target.dataset.audio){playAudio(target.dataset.audio);return;}
  if(target.dataset.word){openWord(target.dataset.word);return;}
  if(target.dataset.route){route(target.dataset.route);return;}
  if(target.dataset.go){route(target.dataset.go);return;}
  if(target.dataset.close){document.getElementById(target.dataset.close)?.close();return;}
  if(target.dataset.filter){filter=target.dataset.filter;renderLearn();return;}
  if(target.dataset.mode){startQuiz(target.dataset.mode);return;}
  if(target.dataset.answer&&quiz){answer(target.dataset.answer===quiz.items[quiz.index].id,target.dataset.answer);}
});
for(const dialog of document.querySelectorAll('dialog')){dialog.addEventListener('close',()=>{stopAudio();if(dialog.id==='word-dialog'&&!quiz)render();});dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});}
document.querySelector('#settings-open').onclick=()=>{document.querySelector('#speed').value=state.speed;document.querySelector('#settings-dialog').showModal();};
function setSpeed(speed){state.speed=speed;if(activeAudio)activeAudio.playbackRate=speed;syncHighlight();save();document.querySelectorAll('[data-slow]').forEach(b=>{b.textContent=`慢速 ${speed===0.8?'开':'关'}`;b.classList.toggle('selected',speed===0.8);b.setAttribute('aria-pressed',String(speed===0.8));});document.querySelector('#speed').value=speed;toast(speed===0.8?'已开启慢速，跟着一句句说。':'已恢复正常速度。');}
document.querySelector('#speed').onchange=event=>setSpeed(Number(event.target.value));
function showAudioSource(){stopAudio();document.querySelector('#settings-dialog').close();document.querySelector('#audio-source-dialog').showModal();}
document.querySelector('#audio-source-open').onclick=showAudioSource;
document.querySelector('#export-progress').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='单词小星球-Unit1-学习记录.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('学习记录已导出。');};
document.querySelector('#import-progress').onclick=()=>document.querySelector('#import-file').click();
document.querySelector('#import-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>200000)throw new Error('文件过大');const imported=sanitizeState(JSON.parse(await file.text()));for(const w of WORDS){const incoming=imported.words[w.id],existing=state.words[w.id];if(incoming&&(!existing||incoming.last>=existing.last))state.words[w.id]=incoming;}const byKey=new Map([...state.history,...imported.history].map(x=>[`${x.at}-${x.mode}`,x]));state.history=[...byKey.values()].sort((a,b)=>a.at-b.at).slice(-100);state.adventure=AdventureModel.merge(state.adventure,imported.adventure);adventureCleanup();save();render();toast('学习记录已合并。');}catch{toast('未能导入，请选择本网站导出的学习记录。');}event.target.value='';};
window.addEventListener('hashchange',()=>route(location.hash.slice(1)));
route(location.hash.slice(1)||'learn');
