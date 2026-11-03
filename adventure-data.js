'use strict';
// Original Unit 1 practice: the story connects tasks; it is not textbook dialogue.
const ADVENTURE_MISSIONS = [
 {id:'signal',title:'接通信号港',skill:'听音认意',icon:'📡',scene:'meet',story:'友谊星的欢迎派对快开始了，信号却断了！听清四条消息，帮米娅接通联络器。',done:'信号接通！新朋友正在向星球靠近。',tasks:[
  {id:'hear-friend',type:'picture',word:'friend',audio:'friend',prompt:'听到的单词，对应哪幅画？',options:['friend','play','happy'],answer:'friend',hint:'friend 是能一起玩、互相帮助的朋友。'},
  {id:'hear-play',type:'picture',word:'play',audio:'play',prompt:'听消息，选择正在做这件事的画面',options:['happy','play','meet'],answer:'play',hint:'想想操场上一起踢球的画面。'},
  {id:'hear-happy',type:'picture',word:'happy',audio:'happy',prompt:'听一听，哪幅画能表示这个心情？',options:['meet','friend','happy'],answer:'happy',hint:'happy 表示高兴、快乐。'},
  {id:'hear-meet',type:'choice',word:'meet',audio:'meet-sentence',prompt:'听完整句话。小朋友正在做什么？',options:['第一次见面，友好地问候','邀请朋友踢球','说自己很开心'],answer:'第一次见面，友好地问候',hint:'Nice to meet you. 是认识新朋友时的问候。'}
 ]},
 {id:'sound',title:'修好拼读机',skill:'声音与拼读',icon:'🔧',scene:'lets',story:'飞船的拼读机缺了零件。先听清完整单词，再把声音零件排好。',done:'拼读机运转啦！下一个目的地：补给站。',tasks:[
  {id:'blend-meet',type:'build',word:'meet',audio:'meet',prompt:'听单词，再拼出来',parts:['m','ee','t'],answer:'meet',hint:'中间的字母组合是一块声音零件，别把它拆开。'},
  {id:'blend-play',type:'build',word:'play',audio:'play',prompt:'听单词，再拼出来',parts:['p','l','ay'],answer:'play',hint:'开头有两个辅音，听清后依次接上。'},
  {id:'blend-friend',type:'build',word:'friend',audio:'friend',prompt:'听单词，再拼出来',parts:['f','r','ie','n','d'],answer:'friend',hint:'中间有一组需要特别记住的字母组合，再听一次，想想顺序。'}
 ]},
 {id:'supply',title:'装满单词补给',skill:'独立拼写',icon:'🎒',scene:'friend',story:'去欢迎派对的路还很长。把物资上的单词拼对，补给箱就能装上飞船。',done:'补给箱装满了！带着它们去修复句子桥。',tasks:[
  {id:'spell-friend',type:'spell',word:'friend',audio:'friend',prompt:'为“朋友”补给箱拼出单词',answer:'friend',extra:['a'],hint:'中间两个元音字母的次序别颠倒。'},
  {id:'spell-happy',type:'spell',word:'happy',audio:'happy',prompt:'拼出“高兴的；快乐的”',answer:'happy',extra:['i'],hint:'有一个辅音字母需要用两次，别漏掉。'},
  {id:'spell-you',type:'spell',word:'you',audio:'you',prompt:'拼出“你；你们”',answer:'you',extra:['a'],hint:'先听开头，再听后面的声音，慢慢想。'},
  {id:'spell-lets',type:'spell',word:'lets',audio:'lets',prompt:'拼出“让我们”，记得带上小撇号',answer:"let's",extra:['a'],hint:"别漏掉中间的小撇号。"}
 ]},
 {id:'bridge',title:'走过句子桥',skill:'句子理解',icon:'🌉',scene:'to',story:'桥上的句子少了几块石头。读懂整句话，找回关键词，让飞船安全通过。',done:'句子桥亮起来了！朋友广场就在前面。',tasks:[
  {id:'gap-meet',type:'gap',word:'meet',audio:'meet-sentence',prompt:'第一次见到新朋友，补全问候语',sentence:'Nice to ___ you.',zh:'很高兴认识你。',options:['meet','play','happy'],answer:'meet',hint:'“认识你”用 meet you。'},
  {id:'gap-to',type:'gap',word:'to',audio:'meet-sentence',prompt:'再检查一次，这句话少了哪个小词？',sentence:'Nice ___ meet you.',zh:'很高兴认识你。',options:['you','to','friend'],answer:'to',hint:'记住整句 Nice to meet you.，to 在这里和 meet 连用。'},
  {id:'find-friend',type:'find',word:'friend',audio:'friend-sentence',prompt:'在整句话里，点出表示“朋友”的词',parts:['This','is','my','friend.'],zh:'这是我的朋友。',answer:'friend.',hint:'“我的朋友”是 my friend，点 friend。'},
  {id:'order-greeting',type:'order',word:'meet',audio:'meet-sentence',prompt:'把石头排成“很高兴认识你”',parts:['Nice','to','meet','you.'],answer:'Nice to meet you.',hint:'Nice 开头，接着 to meet，最后 you。'}
 ]},
 {id:'friends',title:'朋友广场见',skill:'情境对话',icon:'🤝',scene:'you',story:'广场上来了几位新朋友。选一句适合当下的话，让大家一起加入派对。',done:'新朋友加入队伍啦！一起去准备最后的欢迎派对。',tasks:[
  {id:'invite',type:'dialogue',word:'lets',audio:'lets-sentence',prompt:'你想邀请大家交朋友，可以说什么？',context:'米娅：我们还不认识呢，先交个朋友吧！',options:["Let's be friends.","I'm happy.",'This is my friend.'],answer:"Let's be friends.",hint:"Let's be friends. 是“让我们成为朋友吧”。"},
  {id:'say-you',type:'gap',word:'you',audio:'you-sentence',prompt:'对着面前的新朋友，把话说完整',sentence:'___ are my friend.',zh:'你是我的朋友。',options:['You','I','to'],answer:'You',hint:'对着别人说“你”，用 you；句首写 You。'},
  {id:'invite-play',type:'dialogue',word:'play',audio:'play-sentence',prompt:'球已经准备好了，怎么邀请朋友一起玩？',context:'新朋友站在球场边，你想让他一起加入。',options:['Nice to meet you.',"Let's play.",'This is my friend.'],answer:"Let's play.",hint:"Let's play. 表示“让我们一起玩吧”。"}
 ]},
 {id:'party',title:'点亮欢迎派对',skill:'听懂 · 组句 · 开口',icon:'🎉',scene:'happy',story:'所有朋友都到齐了！听懂最后一条消息，拼好欢迎语，再亲口说一句，就能点亮友谊星。',done:'欢迎派对开始！你用英语让大家成为了朋友。',tasks:[
  {id:'party-listen',type:'choice',word:'happy',audio:'happy-sentence',prompt:'听一听，米娅现在的心情是什么？',options:['很开心','在介绍朋友','在邀请大家玩'],answer:'很开心',hint:"I'm happy. 表示“我很开心”。"},
  {id:'party-order',type:'order',word:'you',audio:'you-sentence',prompt:'把“你是我的朋友”排成一句话',parts:['You','are','my','friend.'],answer:'You are my friend.',hint:'You are 开头，再接 my friend。'},
  {id:'party-say',type:'speak',audio:'lets-sentence',prompt:'用你的声音邀请大家交朋友',sentence:"Let's be friends.",zh:'让我们成为朋友吧。',hint:'先听老师，再读出整句话。let’s 最后的 /s/ 也要读到。'}
 ]}
];
const ADVENTURE_DECORATIONS = [
 {id:'lamp',icon:'💡',name:'发光星灯',cost:15,description:'让营地亮起来'},
 {id:'flag',icon:'🌈',name:'彩虹欢迎旗',cost:30,description:'迎接每一位新朋友'},
 {id:'rocket',icon:'🚀',name:'友谊小火箭',cost:45,description:'为下一次冒险准备好'}
];
