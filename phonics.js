/* Unit-linked phonics discovery: graphemes are visual hints, not letter-name TTS. */
const PHONICS={
  meet:{tag:'ee 一起读',kind:'组合小规律',focus:1,parts:['m','ee','t'],sounds:['/m/','/iː/','/t/'],tips:['m 对应开头的音。','两个 e 放在一起，在 meet 里合起来发一个音。','t 对应结尾的音。'],hint:'找到中间的 ee：两个字母，合起来发一个音。',adult:'meet /miːt/：m—ee—t 对应 3 个音。ee 在这里表示 /iː/，不要拆成两个 e 的字母名称。',question:'听完单词，找出中间一起发音的两个字母。',choices:['e','ee','et'],correct:1,success:'找对了！ee 在 meet 里一起发一个音。'},
  play:{tag:'ay 一起读',kind:'组合小规律',focus:2,parts:['p','l','ay'],sounds:['/p/','/l/','/eɪ/'],tips:['p 对应开头的音。','l 紧接着 p；p 和 l 是两个音。','结尾的 a 和 y 在这里合起来发一个音。'],hint:'留意结尾的 ay：两个字母一起读。',adult:'play /pleɪ/：p—l—ay 对应 3 个音。pl 是辅音连缀，不是一个音；ay 在这里表示 /eɪ/。',question:'听完单词，找出结尾一起发音的两个字母。',choices:['a','ay','pl'],correct:1,success:'找对了！结尾的 ay 一起发 /eɪ/。'},
  happy:{tag:'词尾 y 的声音',kind:'词尾小规律',focus:3,parts:['h','a','pp','y'],sounds:['/h/','/æ/','/p/','/i/'],tips:['h 对应开头的音。','a 在 happy 中发短元音。','两个 p 写在一起，这里只对应一个音。','词尾的 y 在 happy 里发短短的 /i/。'],hint:'听听词尾的 y；再看看 pp，两个 p 在这里只发一个音。',adult:'happy /ˈhæp.i/：h—a—pp—y 对应 4 个音，2 个音节。词尾 y 表示 /i/；pp 对应一个 /p/，不是把字母 P 的名称读两遍。',question:'听完 happy，最后那个短短的音由哪个字母表示？',choices:['a','pp','y'],correct:2,success:'找对了！happy 结尾的 y 发 /i/。'},
  friend:{tag:'ie 特别记',kind:'特别记一记',focus:2,parts:['f','r','ie','n','d'],sounds:['/f/','/r/','/e/','/n/','/d/'],tips:['f 对应开头的音。','r 紧接着 f；两个字母对应两个音。','ie 在 friend 里发 /e/，是这个词要特别记的部分。','n 对应接近结尾的音。','d 对应结尾的音。'],hint:'特别记住 friend 中间的 ie；这个词不能直接照搬其他 ie 的读法。',adult:'friend /frend/：f—r—ie—n—d 对应 5 个音。ie 在这里表示 /e/，不是通常先学到的 /aɪ/；其余部分仍可以对应声音。',question:'friend 里，哪一组字母的读法要特别记住？',choices:['fr','ie','nd'],correct:1,success:'找对了！friend 中间的 ie 在这里发 /e/。'},
  you:{tag:'ou 特别记',kind:'特别记一记',focus:1,parts:['y','ou'],sounds:['/j/','/uː/'],tips:['y 在这里表示开头的 /j/。','ou 在 you 里发 /uː/；先记住这个常用词的读法。'],hint:'you 很常用。开头的 y 和后面的 ou 连在一起，听一听。',adult:'you 的强读形式为 /juː/，这里按 y—ou 对应 /j/—/uː/。ou 有不同读法，不能把这一种读法套给所有含 ou 的词。',question:'you 里，哪一部分由两个字母组成？',choices:['y','ou','yo'],correct:1,success:'找对了！ou 在 you 里一起发 /uː/。'},
  to:{tag:'o 的特别读法',kind:'特别记一记',focus:1,parts:['t','o'],sounds:['/t/','/uː/'],tips:['t 对应开头的音。','单独读 to 时，o 在这里发 /uː/，要特别记住。'],hint:'先听清 to 单独读的声音；句子里它还可能读得轻一些。',adult:'to 的强读形式 /tuː/：t—o 对应 /t/—/uː/。弱读可为 /tə/；本模块听完整单词时使用强读，不将 o 总结成永远发 /uː/。',question:'to 里，哪一个字母的读法要特别记住？',choices:['t','o'],correct:1,success:'找对了！单独读 to 时，o 在这里发 /uː/。'},
  lets:{tag:'缩写小提醒',kind:'缩写小提醒',focus:3,parts:['l','e','t',"'s"],sounds:['/l/','/e/','/t/','/s/'],tips:['l 对应开头的音。','e 在 let 里发短元音。','t 对应 let 最后的音。',"let's 是 let us 的缩写；小撇号不单独发音，这里的 s 发 /s/。"],hint:"先认识 let，再留意 's。小撇号本身不用读出一个音。",adult:"let's /lets/ 是 let us 的缩写。按 l—e—t—'s 看这里的 4 个音；把 's 作为书写部分展示，不表示小撇号也会发音。",question:"let's 中的小撇号，需要单独读出一个音吗？",choices:['需要','不需要'],correct:1,success:'答对了！小撇号不单独发音，把整个词连起来听。'}
};

function phonicsPanel(w){return `<div class="phonics-panel" data-phonics-word="${w.id}">${teacherPanel(w)}</div>`;}
function phonicsDiscovery(){return '';}
function handlePhonicsButton(target){
 if(target.dataset.phonicsOpen){openWord(target.dataset.phonicsOpen,'phonics');return true;}
 if(target.dataset.wordView){stopAudio();wordView=target.dataset.wordView;renderWord();document.querySelector(`[data-word-view="${wordView}"]`)?.focus();return true;}
 return false;
}
