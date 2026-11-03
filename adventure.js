'use strict';
const AdventureModel = {
 blank:()=>({version:1,completed:{},decorations:[],run:null}),
 balance(data){return Object.keys(data.completed).length*15-data.decorations.reduce((sum,id)=>sum+(ADVENTURE_DECORATIONS.find(x=>x.id===id)?.cost||0),0);},
 unlocked(data,index){return index===0||!!data.completed[ADVENTURE_MISSIONS[index-1].id];},
 sanitize(input){
  const out=this.blank();if(!input||typeof input!=='object')return out;
  for(const m of ADVENTURE_MISSIONS){
   const r=input.completed?.[m.id];if(!r)break;
   const total=m.tasks.filter(t=>t.type!=='speak').length;
   if(!Number.isInteger(r.correct)||r.correct<0||r.correct>total)break;
   out.completed[m.id]={correct:r.correct,total,stars:this.stars(r.correct,total),attempts:Number.isInteger(r.attempts)?Math.min(9999,Math.max(1,r.attempts)):1,last:Number.isFinite(r.last)?Math.max(0,r.last):0};
  }
  for(const id of Array.isArray(input.decorations)?input.decorations:[]){const item=ADVENTURE_DECORATIONS.find(x=>x.id===id);if(item&&!out.decorations.includes(id)&&this.balance(out)>=item.cost)out.decorations.push(id);}
  const r=input.run,m=ADVENTURE_MISSIONS.find(x=>x.id===r?.mission);
  if(m&&this.unlocked(out,ADVENTURE_MISSIONS.indexOf(m))&&Number.isInteger(r.index)&&r.index>=0&&r.index<m.tasks.length){
   const answers={};let index=0;
   for(const task of m.tasks){if(!['first','retry','practice'].includes(r.answers?.[task.id]))break;answers[task.id]=r.answers[task.id];index++;}
   const misses=(Array.isArray(r.misses)?r.misses:[]).filter(id=>m.tasks.some(t=>t.id===id));
   const wordResults={};for(const task of m.tasks)if(task.word&&typeof r.wordResults?.[task.word]==='boolean')wordResults[task.word]=r.wordResults[task.word];
   out.run={mission:m.id,index:Math.min(r.index,index,m.tasks.length-1),answers,misses:[...new Set(misses)],wordResults,updated:Number.isFinite(r.updated)?r.updated:0};
  }
  return out;
 },
 stars(correct,total){return correct===total?3:correct>=Math.ceil(total/2)?2:1;},
 begin(data,id){const index=ADVENTURE_MISSIONS.findIndex(m=>m.id===id);if(index<0||!this.unlocked(data,index))return false;if(data.run?.mission!==id)data.run={mission:id,index:0,answers:{},misses:[],wordResults:{},updated:Date.now()};return true;},
 finish(data){
  const run=data.run,m=ADVENTURE_MISSIONS.find(x=>x.id===run?.mission);if(!m||!m.tasks.every(t=>run.answers[t.id]))return null;
  const total=m.tasks.filter(t=>t.type!=='speak').length,correct=m.tasks.filter(t=>t.type!=='speak'&&run.answers[t.id]==='first').length;
  const old=data.completed[m.id],stars=this.stars(correct,total),reward=old?0:15;
  data.completed[m.id]={correct:Math.max(old?.correct||0,correct),total,stars:Math.max(old?.stars||0,stars),attempts:(old?.attempts||0)+1,last:Date.now()};
  data.run=null;return {mission:m.id,correct,total,stars,reward,wordResults:run.wordResults};
 },
 buy(data,id){const item=ADVENTURE_DECORATIONS.find(x=>x.id===id);if(!item||data.decorations.includes(id)||this.balance(data)<item.cost)return false;data.decorations.push(id);return true;},
 merge(a,b){
  const left=this.sanitize(a),right=this.sanitize(b),result=this.blank();
  for(const m of ADVENTURE_MISSIONS){const x=left.completed[m.id],y=right.completed[m.id];if(!x&&!y)break;result.completed[m.id]=!x?y:!y?x:{...x,correct:Math.max(x.correct,y.correct),stars:Math.max(x.stars,y.stars),attempts:Math.max(x.attempts,y.attempts),last:Math.max(x.last,y.last)};}
  result.decorations=[...new Set([...left.decorations,...right.decorations])];
  result.run=(right.run?.updated||0)>(left.run?.updated||0)?right.run:left.run;
  return this.sanitize(result);
 }
};
let adventureSession=null,adventureRecorder=null,adventureStream=null,adventureRecordingURL='',adventureRecordTimer=0,adventureRecordGeneration=0;
const adventureHeard=new Set();
function adventureData(){if(!state.adventure)state.adventure=AdventureModel.blank();return state.adventure;}
function adventurePersist(){if(adventureData().run)adventureData().run.updated=Date.now();save();}
function adventureCurrent(){const run=adventureData().run;const mission=ADVENTURE_MISSIONS.find(m=>m.id===run?.mission);return mission?{run,mission,task:mission.tasks[run.index]}:null;}
function adventureCleanup(){
 adventureRecordGeneration++;clearTimeout(adventureRecordTimer);
 if(adventureRecorder&&adventureRecorder.state!=='inactive'){try{adventureRecorder.stop();}catch{}}
 adventureStream?.getTracks().forEach(t=>t.stop());adventureStream=null;adventureRecorder=null;
 if(adventureRecordingURL)URL.revokeObjectURL(adventureRecordingURL);adventureRecordingURL='';adventureSession=null;
}
function adventureScene(id,alt){return `<img src="${sceneSource(id)}" alt="${escapeHTML(alt||SCENES[id].alt)}" width="1448" height="1086" decoding="async">`;}
function adventureDestination(id,alt=''){
 const descriptions={signal:'两位小伙伴在星球信号港戴着耳机接收消息。',sound:'两位小伙伴在温暖的工坊里合作修好拼读机器。',supply:'小伙伴把书、背包和补给箱装上飞船。',bridge:'小伙伴手拉手走过花园里的发光石桥。',friends:'小伙伴在喷泉广场向新朋友打招呼。',party:'大家在灯笼和星空下参加欢迎派对。'};
 return `<img src="./assets/adventure/${id}-v2.webp" alt="${escapeHTML(alt||descriptions[id]||'友谊星冒险场景')}" width="900" height="600" loading="lazy" decoding="async">`;
}
function adventureWallet(){const data=adventureData();return `<span class="adv-wallet" aria-label="可用金币 ${AdventureModel.balance(data)}">🪙 <b>${AdventureModel.balance(data)}</b> 金币</span>`;}
function adventureDecorations(){
 const data=adventureData();
 const arranged=ADVENTURE_DECORATIONS.filter(item=>data.decorations.includes(item.id));
 return `<section class="adv-camp adv-camp-illustrated" aria-labelledby="camp-title"><div class="adv-section-head"><div><span class="adv-kicker">把奖励变成星球的一部分</span><h2 id="camp-title">我的欢迎营地</h2></div>${adventureWallet()}</div><div class="adv-camp-stage" role="group" aria-label="欢迎营地，已布置 ${arranged.length} 件奖励装饰"><img class="adv-camp-base" src="./assets/adventure/camp-base-v2.webp" width="1600" height="800" loading="lazy" decoding="async" alt="月色下的星球营地，小伙伴在金色帐篷旁整理书本，草地上有三处可以放奖励的石台。">${ADVENTURE_DECORATIONS.map(item=>`<span class="adv-reward adv-reward-${item.id}" data-camp-reward="${item.id}" ${data.decorations.includes(item.id)?'':'hidden'}><img src="./assets/adventure/${item.id}-v2.webp" alt="${escapeHTML(item.name)}已摆进营地" width="420" height="${item.id==='lamp'?630:504}" loading="lazy" decoding="async"></span>`).join('')}<span class="adv-camp-caption">${arranged.length===3?'欢迎营地布置好啦，准备下一次冒险！':arranged.length?'营地又多了一件你赢来的礼物':'这是你的营地，用通关金币把礼物搬进来'}</span></div><div class="adv-shop">${ADVENTURE_DECORATIONS.map(item=>{const owned=data.decorations.includes(item.id);return `<div class="adv-shop-item"><span class="adv-shop-art" aria-hidden="true"><img src="./assets/adventure/${item.id}-v2.webp" width="64" height="64" loading="lazy" decoding="async" alt=""></span><div><b>${item.name}</b><small>${item.description}</small></div><button type="button" data-adv-buy="${item.id}" ${owned||AdventureModel.balance(data)<item.cost?'disabled':''}>${owned?'已摆进营地 ✓':`${item.cost} 金币点亮`}</button></div>`;}).join('')}</div><p class="adv-note">金币只用于布置星球，不用花钱购买。记录保存在当前浏览器。</p></section>`;
}
function renderAdventure(keepScroll=false){
 const scrollPosition=window.scrollY;adventureCleanup();const data=adventureData(),completed=Object.keys(data.completed).length;
 const next=ADVENTURE_MISSIONS.find((m,i)=>AdventureModel.unlocked(data,i)&&!data.completed[m.id]);
 const resume=data.run?ADVENTURE_MISSIONS.find(m=>m.id===data.run.mission):next;
 root.innerHTML=`<div class="adv"><div class="adv-topline"><span>UNIT 1 · LET’S BE FRIENDS!</span>${adventureWallet()}</div><section class="adv-hero"><div class="adv-hero-copy"><span class="adv-kicker">单词小星球 · 第一章</span><h1>友谊星<br><em>大冒险</em></h1><p>欢迎派对快开始啦！<br>完成 6 个任务，和米娅一起点亮友谊星。</p><button class="adv-primary" data-adv-start="${resume?.id||'signal'}">${data.run?'继续未完成的任务':completed===6?'再去冒险一次':'出发！接收第一条信号'} <span>→</span></button></div><div class="adv-hero-image">${adventureDestination(completed===6?'party':'signal')}<span class="adv-chapter-tag">${completed===6?'🎉 欢迎派对已点亮':'目的地：友谊星'}</span></div></section><div class="adv-story-strip"><span aria-hidden="true">✦</span><p><b>${completed===6?'六枚友谊徽章集齐啦！':'米娅的任务留言'}</b>${completed===6?'可以重玩关卡、练习容易忘的词，也可以继续布置欢迎营地。':'先接通信号，再修好机器、装上补给。到了广场，用英语邀请新朋友！'}</p><strong>${completed}<small> / 6 徽章</small></strong></div><div class="adv-section-head"><div><span class="adv-kicker">每站几道小任务，随时可以休息</span><h2>你的冒险路线</h2></div><span class="adv-progress-label">${completed===6?'整章已完成':'从亮着的关卡开始'}</span></div><section class="adv-map" aria-label="友谊星六关路线">${ADVENTURE_MISSIONS.map((m,i)=>{const unlocked=AdventureModel.unlocked(data,i),record=data.completed[m.id],active=!record&&unlocked;return `<button type="button" class="adv-stop ${record?'cleared':active?'current':'locked'}" data-adv-start="${m.id}" ${!unlocked?'disabled':''} aria-label="第 ${i+1} 关 ${m.title}，${record?'已完成，可以重玩':unlocked?'可以开始':'先完成上一关'}"><div class="adv-stop-top"><span>任务 ${String(i+1).padStart(2,'0')}</span><span>${record?'已完成 ✓':active?'正在等你':'未解锁'}</span></div><div class="adv-stop-art">${adventureDestination(m.id)}${!unlocked?'<span class="adv-art-lock" aria-hidden="true">🔒</span>':''}</div><h3>${m.title}</h3><p>${m.skill}</p><div class="adv-stop-bottom"><span class="adv-stars" aria-label="${record?.stars||0} 颗星">${record?'★'.repeat(record.stars)+'☆'.repeat(3-record.stars):'☆☆☆'}</span><span>${record?'再玩一次 ↗':unlocked?'去探险 →':'完成前一站'}</span></div></button>`;}).join('')}</section>${adventureDecorations()}</div>`;
 window.scrollTo(0,keepScroll?scrollPosition:0);
}
function adventureStart(id){
 const data=adventureData();if(!AdventureModel.begin(data,id))return;
 stopAudio();adventureCleanup();adventureHeard.clear();adventurePersist();adventureRenderTask();
}
function adventureRenderTask(){
 const current=adventureCurrent();if(!current)return renderAdventure();
 const {mission:m,run,task:q}=current;adventureCleanup();
 const selected=[],bank=shuffle(q.parts||[...String(q.answer),...(q.extra||[])]);
 adventureSession={task:q.id,selected,bank,heard:adventureHeard.has(q.id),modelEnded:false,followAlong:false,recorded:false};
 const solved=!!run.answers[q.id];
 const questionAudio=q.audio?`<button type="button" class="adv-listen" data-adv-listen aria-label="${['build','spell'].includes(q.type)?'听完整单词':'听本题英式发音'}"><span aria-hidden="true">▶</span>${['build','spell'].includes(q.type)?'听单词':q.type==='speak'?'先听老师读一句':'听一听'}</button>`:'';
 let body='';
 if(q.type==='picture')body=`<div class="adv-picture-options">${shuffle(q.options).map(id=>`<button class="adv-picture-choice" data-adv-choice="${id}" ${solved?'disabled':''}>${adventureScene(id)}<span>${escapeHTML(SCENES[id].caption)}</span></button>`).join('')}</div>`;
 if(['choice','dialogue','gap'].includes(q.type))body=`${q.context?`<p class="adv-dialogue">${escapeHTML(q.context)}</p>`:''}${q.sentence?`<div class="adv-sentence">${escapeHTML(q.sentence).replace('___','<span class="adv-blank">?</span>')}</div><p class="adv-translation">${escapeHTML(q.zh)}</p>`:''}<div class="adv-choices">${shuffle(q.options).map((text,i)=>`<button data-adv-choice="${escapeHTML(text)}" ${solved?'disabled':''}><span>${i+1}</span>${escapeHTML(text)}</button>`).join('')}</div>`;
 if(q.type==='find')body=`<div class="adv-find-line">${q.parts.map(text=>`<button data-adv-choice="${escapeHTML(text)}" ${solved?'disabled':''}>${escapeHTML(text)}</button>`).join('')}</div><p class="adv-translation">${escapeHTML(q.zh)}</p>`;
 if(['spell','build','order'].includes(q.type))body=`${q.type==='spell'?`<p class="adv-spell-context">${escapeHTML(WORDS.find(w=>w.id===q.word).meaning)}</p>`:''}<div class="adv-assembly" aria-label="你的${q.type==='order'?'句子':'拼写'}" data-adv-assembly><span>点下面的零件，把它们放到这里</span></div><div class="adv-bank" aria-label="点选${q.type==='order'?'单词':'字母'}">${bank.map((text,i)=>`<button data-adv-tile="${i}" aria-label="加入 ${escapeHTML(text)}" ${solved?'disabled':''}>${escapeHTML(text)}</button>`).join('')}</div><div class="adv-build-actions"><button class="secondary" data-adv-clear ${solved?'disabled':''}>重新排</button><button class="adv-primary" data-adv-check ${solved?'disabled':''}>检查${q.type==='order'?'句子':'拼写'} ✓</button></div>${q.type==='spell'?'<details class="adv-keyboard"><summary>也可以用键盘拼写</summary><form id="adv-spell-form"><input name="spelling" aria-label="键盘输入单词" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="30"><button class="secondary" type="submit">检查</button></form></details>':''}`;
 if(q.type==='speak')body=`<div class="adv-speak-line">${karaoke(q.audio,"let's")}</div><p class="adv-translation">${q.zh}</p><div class="adv-speech-box"><p>听老师 → 读一句 → 听听自己的声音</p><button class="adv-record" data-adv-record ${solved?'disabled':''}>● 录下我的声音</button><p class="adv-note">点录音后才会申请麦克风。声音留在本页，离开这道题就清除。</p><div data-adv-recording></div><p data-adv-record-status role="status"></p><button class="adv-follow" data-adv-follow ${solved?'disabled':''}>不用录音，我跟着读一遍</button><p class="adv-note">这是朗读练习，不自动判断发音对错。</p><button class="adv-primary" data-adv-spoken ${solved?'disabled':''}>我已经开口练过了 ✓</button></div>`;
 root.innerHTML=`<div class="adv adv-game"><div class="adv-game-top"><button class="adv-back" data-adv-map>← 回冒险地图</button>${adventureWallet()}</div><div class="adv-task-progress"><span>${m.icon} ${m.title}</span><span>第 ${run.index+1} / ${m.tasks.length} 步</span></div><progress class="adv-progress" max="${m.tasks.length}" value="${run.index+(solved?1:0)}" aria-label="本关任务进度"></progress><section class="adv-task-card"><div class="adv-story-card">${adventureDestination(m.id)}<p><span>来自友谊星的任务</span>${escapeHTML(run.index===0?m.story:'离目的地又近了一步，继续帮帮新朋友吧！')}</p></div><h1 tabindex="-1">${escapeHTML(q.prompt)}</h1>${questionAudio}${['picture','choice'].includes(q.type)?'<p class="adv-note adv-center">先听消息，再选答案。可以重复听。</p>':''}${body}<div class="adv-feedback ${solved?'success':''}" role="status" aria-live="polite" data-adv-feedback>${solved?'这一步已经完成，继续向前走吧！':''}</div><div class="adv-task-footer"><button class="adv-hint-button" data-adv-hint>需要一点提示？</button><button class="adv-primary" data-adv-next ${!solved?'hidden':''}>${run.index===m.tasks.length-1?'完成任务，领徽章 →':'接着走 →'}</button></div><p class="adv-hint" data-adv-hint-text hidden>${escapeHTML(q.hint)}</p></section><p class="adv-note adv-center">答错可以重试，不会扣金币。退出后会记住已经走到哪一步。</p></div>`;
 root.querySelector('h1').focus({preventScroll:true});window.scrollTo(0,0);
 if(solved&&['spell','build','order'].includes(q.type)){root.querySelector('[data-adv-assembly]').textContent=q.answer;}
 const form=document.querySelector('#adv-spell-form');if(form)form.onsubmit=e=>{e.preventDefault();adventureAttempt(form.elements.spelling.value);};
}
function adventureFeedback(text,success=false){const el=root.querySelector('[data-adv-feedback]');if(el){el.textContent=text;el.className='adv-feedback '+(success?'success':'try-again');}}
function adventureAttempt(value){
 const current=adventureCurrent();if(!current||!adventureSession||adventureSession.task!==current.task.id)return;
 const {run,task:q}=current;if(run.answers[q.id])return;
 if(['picture','choice'].includes(q.type)&&!adventureSession.heard){adventureFeedback('先点“听一听”，听清这条消息再选哦。');return;}
 if(!String(value).trim()){adventureFeedback('先放上字母或单词，再检查吧。');return;}
 const correct=normalize(value).replace(/\s+/g,' ')===normalize(q.answer).replace(/\s+/g,' ');
 if(!correct){
  if(!run.misses.includes(q.id))run.misses.push(q.id);
  if(q.word){run.wordResults[q.word]=false;markWord(q.word,false);}
  adventurePersist();adventureFeedback('差一点，再试试。'+q.hint);return;
 }
 run.answers[q.id]=run.misses.includes(q.id)?'retry':'first';
 if(q.word&&run.wordResults[q.word]!==false)run.wordResults[q.word]=true;
 adventurePersist();
 root.querySelectorAll('[data-adv-choice],[data-adv-tile],[data-adv-check],[data-adv-clear],#adv-spell-form input,#adv-spell-form button').forEach(b=>b.disabled=true);
 root.querySelector('[data-adv-next]').hidden=false;
 const progress=root.querySelector('progress');if(progress)progress.value=run.index+1;
 adventureFeedback((run.misses.includes(q.id)?'这一步完成啦，再见到它就更熟啦！':'找对了！')+' '+q.answer,true);
}
function adventureAssembly(){
 if(!adventureSession)return;const {bank,selected}=adventureSession;
 root.querySelector('[data-adv-assembly]').innerHTML=selected.length?selected.map((index,pos)=>`<button data-adv-remove="${pos}" aria-label="移回 ${escapeHTML(bank[index])}">${escapeHTML(bank[index])}</button>`).join(''):'<span>点下面的零件，把它们放到这里</span>';
 root.querySelectorAll('[data-adv-tile]').forEach(b=>b.disabled=selected.includes(Number(b.dataset.advTile)));
}
function adventureNext(){
 const current=adventureCurrent();if(!current||!current.run.answers[current.task.id])return;
 stopAudio();if(current.run.index+1<current.mission.tasks.length){current.run.index++;adventurePersist();adventureRenderTask();return;}
 const result=AdventureModel.finish(adventureData());if(!result)return;
 for(const [word,correct] of Object.entries(result.wordResults))markWord(word,correct);
 adventurePersist();adventureRenderResult(result);
}
function adventureRenderResult(result){
 adventureCleanup();const i=ADVENTURE_MISSIONS.findIndex(m=>m.id===result.mission),m=ADVENTURE_MISSIONS[i],next=ADVENTURE_MISSIONS[i+1];
 root.innerHTML=`<div class="adv adv-result"><div class="adv-result-art">${adventureDestination(m.id)}<span>${m.icon}</span></div><span class="adv-kicker">${i===5?'友谊星欢迎派对已点亮':'友谊徽章已收好'}</span><h1>${m.title}，完成！</h1><div class="adv-result-stars" aria-label="本次 ${result.stars} 颗星">${'★'.repeat(result.stars)}${'☆'.repeat(3-result.stars)}</div><p>${m.done}</p><div class="adv-result-numbers"><div><b>${result.reward?'+15':'已领取'}</b><span>${result.reward?'冒险金币':'本关首次通关奖励'}</span></div><div><b>${result.correct} / ${result.total}</b><span>本次首次作答答对</span></div></div>${i===5?'<p class="adv-note">本关还完成了一次开口练习；朗读不计入正确题数，也不代表发音已通过评分。</p>':''}<div class="adv-result-actions"><button class="secondary" data-adv-map>回地图，布置星球</button>${next?`<button class="adv-primary" data-adv-start="${next.id}">去${next.title} →</button>`:'<button class="adv-primary" data-go="review">看看需要复习的词 →</button>'}</div><p class="adv-note">重玩能提升星星；同一关的金币只领一次。</p></div>`;
 window.scrollTo(0,0);
}
async function adventureRecord(){
 const current=adventureCurrent();if(current?.task.type!=='speak'||!adventureSession)return;
 if(adventureRecorder?.state==='recording'){adventureRecorder.stop();return;}
 if(!adventureSession.modelEnded){adventureFeedback('先把老师这句话完整听一遍，再录你的声音。');return;}
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){adventureFeedback('这个浏览器暂时不能录音。可以点“不用录音”，听完示范后跟读。');return;}
 stopAudio();const generation=++adventureRecordGeneration,button=root.querySelector('[data-adv-record]');
 button.disabled=true;button.textContent='等待麦克风许可…';
 let stream;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:true});
  if(generation!==adventureRecordGeneration){stream.getTracks().forEach(t=>t.stop());return;}
  adventureStream=stream;const chunks=[];const recorder=new MediaRecorder(stream);adventureRecorder=recorder;const started=Date.now();
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onerror=()=>{stream.getTracks().forEach(t=>t.stop());clearTimeout(adventureRecordTimer);if(generation===adventureRecordGeneration){adventureFeedback('录音没有成功，可以再试一次，也可以直接跟读。');button.disabled=false;button.textContent='● 重新录音';}};
  recorder.onstop=()=>{
   clearTimeout(adventureRecordTimer);stream.getTracks().forEach(t=>t.stop());
   if(generation!==adventureRecordGeneration)return;
   button.textContent='● 再录一次';button.disabled=false;
   const blob=new Blob(chunks,{type:recorder.mimeType});
   if(Date.now()-started<800||blob.size<400){adventureFeedback('这次录得有点短，再读完整一句吧。');return;}
   if(adventureRecordingURL)URL.revokeObjectURL(adventureRecordingURL);
   adventureRecordingURL=URL.createObjectURL(blob);adventureSession.recorded=true;
   root.querySelector('[data-adv-recording]').innerHTML=`<label>听听我刚才读的<audio controls aria-label="我的朗读录音" src="${adventureRecordingURL}"></audio></label>`;
   root.querySelector('[data-adv-record-status]').textContent='录好了。对比老师和自己的声音，留意最后的 /s/。';
  };
  recorder.start();button.disabled=false;button.textContent='■ 停止录音';root.querySelector('[data-adv-record-status]').textContent='正在录音，请读出整句话。最多录 15 秒。';
  adventureRecordTimer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},15000);
 }catch{stream?.getTracks().forEach(t=>t.stop());if(generation===adventureRecordGeneration){button.disabled=false;button.textContent='● 再试一次录音';adventureFeedback('没有取得麦克风。你仍然可以听示范，再点“不用录音”跟读。');}}
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.advStart){adventureStart(b.dataset.advStart);return;}
 if(b.hasAttribute('data-adv-map')){stopAudio();renderAdventure();return;}
 if(b.dataset.advBuy){if(AdventureModel.buy(adventureData(),b.dataset.advBuy)){adventurePersist();renderAdventure(true);toast('营地又亮了一点！');}return;}
 const current=adventureCurrent();if(!current||!adventureSession)return;const {task:q,run}=current;
 if(b.hasAttribute('data-adv-listen')){if(adventureRecorder?.state==='recording'){adventureFeedback('先停止录音，再听老师。');return;}root.querySelector('[data-adv-recording] audio')?.pause();playAudio(q.audio);return;}
 if(b.hasAttribute('data-adv-hint')){root.querySelector('[data-adv-hint-text]').hidden=false;return;}
 if(b.hasAttribute('data-adv-next')){adventureNext();return;}
 if(b.hasAttribute('data-adv-choice')){adventureAttempt(b.dataset.advChoice);return;}
 if(run.answers[q.id])return;
 if(b.hasAttribute('data-adv-tile')){const index=Number(b.dataset.advTile);if(!adventureSession.selected.includes(index))adventureSession.selected.push(index);adventureAssembly();return;}
 if(b.hasAttribute('data-adv-remove')){adventureSession.selected.splice(Number(b.dataset.advRemove),1);adventureAssembly();return;}
 if(b.hasAttribute('data-adv-clear')){adventureSession.selected=[];adventureAssembly();return;}
 if(b.hasAttribute('data-adv-check')){adventureAttempt(adventureSession.selected.map(i=>adventureSession.bank[i]).join(q.type==='order'?' ':''));return;}
 if(b.hasAttribute('data-adv-record')){adventureRecord();return;}
 if(b.hasAttribute('data-adv-follow')){if(!adventureSession.modelEnded){adventureFeedback('先把老师这句话完整听一遍，再跟着读。');return;}adventureSession.followAlong=true;b.textContent='已选择跟读，请自己读完整一句';adventureFeedback('轮到你了：Let’s be friends. 读好后，再点完成。');return;}
 if(b.hasAttribute('data-adv-spoken')){
  if(adventureRecorder?.state==='recording'){adventureFeedback('先停止录音，再听一听自己读的句子。');return;}
  if(!adventureSession.modelEnded||(!adventureSession.recorded&&!adventureSession.followAlong)){adventureFeedback('先听完示范，再录一句，或者选择不用录音跟读。');return;}
  run.answers[q.id]='practice';adventurePersist();root.querySelector('[data-adv-next]').hidden=false;
  root.querySelectorAll('[data-adv-record],[data-adv-follow],[data-adv-spoken]').forEach(x=>x.disabled=true);
  adventureFeedback('开口练习完成！还可以对比老师的声音，再读一次。',true);
 }
});
document.addEventListener('DOMContentLoaded',()=>{
 const audio=document.querySelector('#pronunciation-audio');
 audio.addEventListener('playing',()=>{const current=adventureCurrent();if(adventureSession&&current&&activeAudioName===current.task.audio){adventureSession.heard=true;adventureHeard.add(current.task.id);}});
 audio.addEventListener('ended',()=>{const current=adventureCurrent();if(adventureSession&&current&&activeAudioName===current.task.audio)adventureSession.modelEnded=true;});
});
window.addEventListener('pagehide',adventureCleanup);
