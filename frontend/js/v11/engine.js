(function(){
'use strict';
const AW=window.AW;
const LABELS={top:'上装',bottom:'下装',outer:'外套',dress:'连衣裙',shoe:'鞋履',bag:'包袋',accessory:'配饰'};
const styleAliases={'温柔':'文艺','精致':'简约','帅气':'简约','清爽基础':'简约','日常通勤':'通勤'};
const SIGNS=[
 {id:1,name:'云开见山',poem:'云散青山在，风来衣袂轻。',reading:'给今天留一点轻盈。柔和的浅色与干净线条，让出门这件事变得简单。',styles:['简约','文艺'],colors:['白','米','浅'],weight:1},
 {id:2,name:'竹影随行',poem:'竹影摇窗绿，清风满袖来。',reading:'按自己的节奏走。选择舒适、方便活动的衣服，颜色彼此呼应就很好。',styles:['慵懒','运动'],colors:['绿','白','灰'],weight:1},
 {id:3,name:'花信如期',poem:'一枝春信到，花与故人逢。',reading:'为见面多留一分心意。用一件柔软或明亮的单品，点亮熟悉的日常。',styles:['甜美','文艺'],colors:['粉','杏','白'],weight:1},
 {id:4,name:'长风入怀',poem:'长风开远路，一步一从容。',reading:'从容也可以很有力量。利落的轮廓、稳重的配色，陪你进入今天的场合。',styles:['通勤','简约'],colors:['黑','蓝','灰'],weight:1},
 {id:5,name:'拾光成诗',poem:'旧巷藏新意，微光落衣襟。',reading:'熟悉的衣服也有新意。试试有质感的暖色与复古细节，找到自己的表达。',styles:['复古','文艺'],colors:['棕','卡其','咖'],weight:1},
 {id:6,name:'晴日生花',poem:'晴光落肩上，步步自生花。',reading:'今天可以多一点明亮。选一个喜欢的色彩作为重点，其余单品安静相衬。',styles:['明艳','甜美'],colors:['红','黄','白'],weight:1}
];
const MAP=window.YIDA_TAROT_RULES.map(c=>c.style_tags.map(s=>window.OutfitVocab.style_synonyms[s]||s));
const normalize=x=>{
 const category=x.category==='shoes'?'shoe':x.category;
 const st=x.style_tags_cn||x.style_tags||[];
 return {...x,id:x.id||x.item_id,item_id:x.item_id||x.id,category,name:x.name||x.type||'未命名单品',image:x.image||x.image_url,image_url:x.image_url||x.image,styles:st.map(s=>window.OutfitVocab?.style_synonyms?.[s]||styleAliases[s]||s),kind:LABELS[category]||'配饰',colorName:x.color_name||x.colorName||'',seasons:(x.visible_traits?.season||x.seasons||x.season||[]).map(s=>({'春':'spring','夏':'summer','秋':'autumn','冬':'winter'}[s]||s)),active:x.active!==false};
};
function constraints(context){
 if(context.type==='sign')return {styles:context.payload.sign.styles,colors:context.payload.sign.colors,avoid:[],words:context.payload.sign.name};
 const G=window.YidaGameplay;
 if(context.type==='social_energy'&&G){const raw=Number(context.payload?.value),v=Number.isFinite(raw)?Math.max(1,Math.min(100,Math.round(raw))):60;return {styles:G.energyStyles(v),colors:[],avoid:[],words:`${v} / 100`};}
 if(context.type==='identity'&&G){const id=context.payload?.identity||'';return {styles:(G.identityStyles[id]||[]).slice(),colors:[],avoid:[],words:`${id} · ${G.identityKW[id]||''}`};}
 if(context.type==='input'&&G){const parsed=G.parseInput(context.payload?.raw_text||'');return {styles:parsed.styles,colors:parsed.colors,avoid:parsed.avoid,words:context.payload?.raw_text||''};}
 const cards=context.payload.cards||[],weights=[1,2,1],tags={},colors={},avoid={};
 cards.forEach((c,i)=>{const card=window.YIDA_TAROT_RULES.find(t=>t.no===c.no);if(!card)return;const w=weights[i];for(const raw of card.style_tags){const t=window.OutfitVocab.style_synonyms[raw]||raw;tags[t]=(tags[t]||0)+w;}for(const color of card.must_colors)colors[color]=(colors[color]||0)+w;for(const color of card.avoid_colors)avoid[color]=(avoid[color]||0)+w;});
 // Preserve the original constraintFromTarot3 scoring thresholds, including its [1,2,1] weighting.
 const main=Object.entries(colors).filter(([,score])=>score>=2).map(([c])=>c);
 return {styles:Object.entries(tags).sort((a,b)=>b[1]-a[1]).map(([tag])=>tag),colors:main.length?main:Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c])=>c),avoid:Object.entries(avoid).filter(([,score])=>score>=3).map(([c])=>c),words:cards.map(c=>c.cn).join(' · ')};
}
function seasonOK(item,season){const ss=item.seasons;return !season||season==='all'||!ss?.length||ss.includes(season)||ss.includes('四季')||ss.includes('all');}
function combinations(raw,context,season,limit){
 const c=constraints(context),pool=raw.map(normalize).filter(x=>x.active&&x.image&&seasonOK(x,season));
 const score=x=>x.styles.reduce((a,s)=>a+(c.styles.includes(s)?4:0),0)+c.colors.reduce((a,s)=>a+(x.colorName.includes(s)?2:0),0)-(c.avoid||[]).reduce((a,s)=>a+(x.colorName.includes(s)?8:0),0);
 const ranked=cat=>pool.filter(x=>x.category===cat).sort((a,b)=>score(b)-score(a)||String(a.id).localeCompare(String(b.id)));
 const tops=ranked('top'),bottoms=ranked('bottom'),shoes=ranked('shoe'),dresses=ranked('dress'),bags=ranked('bag'),outers=ranked('outer');
 const output=[],seen=new Set();
 const add=items=>{if(items.some(x=>!x))return;const key=items.map(x=>x.id).sort().join('|');if(seen.has(key))return;seen.add(key);output.push({items,score:items.reduce((a,x)=>a+score(x),0)});};
 // Finite complete combinations. Never fill a missing category with an unrelated garment.
 for(const sh of shoes){for(const top of tops.slice(0,16)){for(const bottom of bottoms.slice(0,16))add([top,bottom,sh]);}for(const dress of dresses.slice(0,24))add([dress,sh]);}
 output.sort((a,b)=>b.score-a.score);
 const picked=[];
 // A diversity penalty prevents near-identical top-ranked results while retaining card/tag relevance.
 while(output.length&&picked.length<limit){let bi=0,best=-Infinity;for(let i=0;i<output.length;i++){const o=output[i],overlap=picked.reduce((a,p)=>a+o.items.filter(it=>p.items.some(x=>x.id===it.id)).length,0),v=o.score-overlap*5;if(v>best){best=v;bi=i;}}picked.push(output.splice(bi,1)[0]);}
 return picked.map((o,i)=>{const its=o.items.slice();if(bags.length)its.push(bags[i%bags.length]);if(['autumn','winter'].includes(season)&&outers.length)its.push(outers[i%outers.length]);return {items:its,score:o.score};});
}
function recommend(personal,system,context,season){
 const mine=combinations(personal,context,season,3),lib=combinations(system,context,season,4);
 if(lib.length<4)throw Error('系统衣库当前季节不足四套完整搭配，请切换季节后重试。');
 const useMine=mine.length===3,chosen=useMine?[...mine.map(x=>({...x,source:'personal'})),{...lib[0],source:'system'}]:lib.map(x=>({...x,source:'system'}));
 const c=constraints(context),tails=['轻盈有序','从容日常','恰好自在','另一种心情'];
 return chosen.map((x,i)=>({id:crypto.randomUUID?.()||Date.now()+'-'+i,source:x.source,name:tails[i],items:x.items,reason:`${c.words}，带来「${c.styles.slice(0,3).join('、')}」的穿搭方向。${x.items.slice(0,2).map(t=>t.name).join('搭配')}，以${x.items.find(t=>t.category==='shoe').name}收尾。${x.items.some(t=>t.category==='outer')?'加一件外套，方便应对温差。':''}这些是穿搭灵感，舒适与场合由你决定。`}));
}
window.YidaEngine={SIGNS,MAP,LABELS,normalize,constraints,combinations,recommend};
})();
