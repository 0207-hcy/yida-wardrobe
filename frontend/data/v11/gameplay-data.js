/* 易搭 · V8 权威玩法数据（社交电量 / 身份扮演 / 跃然搭配）
 * 经典脚本 IIFE，挂 window.YidaGameplay，供 engine.js 与 product.js 运行时取用。
 * 硬约束：所有产出的 styles 必须严格落在 OutfitVocab 的 8 个受控风格内。 */
(function(){
'use strict';

const V=window.OutfitVocab||{};
const STYLES=(V.styles||['简约','通勤','文艺','甜美','运动','复古','明艳','慵懒']).slice();
const SYN=V.style_synonyms||{};
const ALLOWED=new Set(STYLES);
const norm=s=>{const one=SYN[s]||s;return ALLOWED.has(one)?one:null;};
const push=(arr,v)=>{if(v&&arr.indexOf(v)<0)arr.push(v);};

/* ---------- 身份扮演：6 组 12 身份（V8 app.js:29-37，名称含空格者保持原样） ---------- */
const identityGroups={
  '爽剧主角':['大女主','逆袭女主'],
  '女配觉醒':['恶毒女二','疯批配角'],
  '豪门上桌':['真千金','财阀大小姐'],
  '月光氛围':['白月光','黑月光'],
  '高能大佬':['反派','终极 Boss'],
  '轻松出逃':['咸鱼女主','NPC 觉醒']
};
const identityKW={
  '大女主':'主角感 · 掌控 · 完整',
  '逆袭女主':'变化感 · 提气 · 焕新',
  '恶毒女二':'精致 · 锋利 · 存在感',
  '疯批配角':'实验 · 偏轨 · 不常规',
  '真千金':'低声量 · 质感 · 底气',
  '财阀大小姐':'资源感 · 完整 · 精致',
  '白月光':'清透 · 轻 · 留白',
  '黑月光':'克制 · 深 · 边界',
  '反派':'力量 · 边界 · 外显',
  '终极 Boss':'低调 · 稳定 · 隐藏力量',
  '咸鱼女主':'省力 · 熟悉 · 低维护',
  'NPC 觉醒':'日常底色 · 主动变化'
};
/* 人工语义映射：值全部是受控 8 风格的子集，不做「某身份=某颜色」的偷懒映射。 */
const identityStyles={
  '大女主':['简约','通勤'],
  '逆袭女主':['明艳','通勤'],
  '恶毒女二':['复古','明艳'],
  '疯批配角':['复古','明艳'],
  '真千金':['文艺','简约'],
  '财阀大小姐':['复古','通勤'],
  '白月光':['文艺','简约'],
  '黑月光':['简约','文艺'],
  '反派':['明艳','通勤'],
  '终极 Boss':['简约','通勤'],
  '咸鱼女主':['慵懒','简约'],
  'NPC 觉醒':['慵懒','简约']
};

/* ---------- 社交电量：V10 五档文案 + 四档风格 ---------- */
function energyExplain(v){
  const n=clamp(v);
  if(n<=20)return '今天想省一点对外消耗，衣服以熟悉、轻维护为先。';
  if(n<=40)return '保留体面感，减少需要一直照看的细节。';
  if(n<=60)return '让表达和舒适保持平衡，层次适中。';
  if(n<=80)return '可以主动一些，让造型有清楚的视觉重点。';
  return '今天愿意承接更多目光，但天气和场合仍然优先。';
}
function energyStyles(v){
  const n=clamp(v);
  if(n<=40)return ['简约','慵懒'];
  if(n<=60)return ['通勤','文艺'];
  if(n<=80)return ['通勤','明艳'];
  return ['明艳','复古'];
}
function clamp(v){const n=Number(v);return Number.isFinite(n)?Math.max(1,Math.min(100,Math.round(n))):60;}

/* ---------- 跃然搭配：场合 / 季节正则表（V8 aw-yueran.js:8-10） ---------- */
const OCCASIONS=[
  {re:/客户|面试|汇报|正式|会议|开会|婚礼|宴会|酒会|签约|答辩|谈判/,value:5,label:'正式',styles:['通勤']},
  {re:/通勤|上班|加班|职场|工作|提案/,value:4,label:'通勤',styles:['通勤']},
  {re:/约会|见人|拍照|下午茶|朋友|生日|聚会|看展|逛展/,value:3,label:'半正式',styles:['文艺','甜美']},
  {re:/逛街|咖啡|书店|散步|旅行|出游|周末/,value:2,label:'休闲',styles:['慵懒']},
  {re:/运动|健身|跑步|骑车|爬山|徒步|打球|接送/,value:1,label:'运动',styles:['运动']}
];
const SEASONS=[
  {re:/冷|凉|降温|风大|深秋|入冬|下雪|雪|寒|冻/,key:'cold',label:'偏凉'},
  {re:/热|晒|闷|高温|出汗|炎夏|暖|初夏/,key:'hot',label:'偏热'}
];
const INPUT_STYLES=STYLES.slice();
/* 受控色短词：既能被用户写出来，也能被 colorName.includes() 命中。 */
const INPUT_COLORS=['黑','白','灰','米','驼','卡其','蓝','藏青','棕','酒红','红','绿','粉','金','咖'];
const INPUT_EXAMPLES=['陪客户吃饭，但下午要骑车过去','降温了，想穿得暖但不臃肿','周末逛展，想安静一点','第一次约会，别太用力'];

/* 解析一句自然语言 -> engine.constraints 可直接消费的约束。
   summary 是给界面展示的中文标签数组，不参与打分。 */
function parseInput(text){
  const raw=typeof text==='string'?text:'';
  const styles=[],colors=[],avoid=[],summary=[];

  /* 先摘掉否定偏好，避免「不要红」同时被当成「想要红」。 */
  const colorAlt=INPUT_COLORS.join('|');
  const avoidRe=new RegExp('(?:不要|不穿|别穿|避开|避免|别选|不想要|不用)(?:颜色|色)?(?:是)?\\s*('+colorAlt+')','g');
  let scan=raw.replace(avoidRe,(m,c)=>{push(avoid,c);push(summary,'不要'+c);return ' ';});

  /* 场合：命中几条就收几条风格（如「客户 + 骑车」同时要体面与好动）。 */
  for(const o of OCCASIONS){if(o.re.test(scan)){push(summary,o.label);o.styles.forEach(s=>push(styles,s));}}
  /* 体感：只取第一个命中的季节倾向，与 V8 一致。 */
  for(const s of SEASONS){if(s.re.test(scan)){push(summary,s.label);break;}}
  /* 直接写出的风格词：受控词优先，口语词经 style_synonyms 归一后再收。 */
  for(const s of INPUT_STYLES){if(scan.indexOf(s)>=0)push(styles,s);}
  for(const k of Object.keys(SYN)){const n=norm(k);if(n&&scan.indexOf(k)>=0)push(styles,n);}
  /* 颜色：只收未否定的短词。 */
  for(const c of INPUT_COLORS){if(scan.indexOf(c)>=0&&avoid.indexOf(c)<0)push(colors,c);}
  /* 没读到任何硬约束时，按 V8 兜底为日常通勤。 */
  if(!styles.length){push(styles,'通勤');push(styles,'简约');push(summary,'日常通勤');}

  return {styles:styles.slice(0,4),colors:colors.slice(0,3),avoid:avoid,summary:summary};
}

/* 每种玩法的一句解读，供结果页 / 数据层复用。 */
function resultReason(type,payload,words){
  const p=payload||{};
  if(type==='social_energy')return `社交电量 ${clamp(p.value)}/100：把存在感和维护负担调到这一天愿意投入的程度。`;
  if(type==='identity')return `「${p.identity||''}」只是表达方向，衣服仍需适合今天的场合与体感。`;
  if(type==='input')return `根据「${p.raw_text||''}」提取场合、活动和明确偏好，再从衣柜找完整搭配。`;
  return words||'';
}

window.YidaGameplay={
  identityGroups:identityGroups,
  identityKW:identityKW,
  identityStyles:identityStyles,
  energyExplain:energyExplain,
  energyStyles:energyStyles,
  OCCASIONS:OCCASIONS,
  SEASONS:SEASONS,
  INPUT_STYLES:INPUT_STYLES,
  INPUT_COLORS:INPUT_COLORS,
  INPUT_EXAMPLES:INPUT_EXAMPLES,
  parseInput:parseInput,
  resultReason:resultReason
};
})();
