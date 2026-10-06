/* =====================================================================
   v8: decision workspace. Centred prompt home, results with tabs,
   summary banner, KPI strip, Verisavo Intelligence Assistant with
   "What if" testing, dark callout chips on the map.
   ===================================================================== */
Object.assign(S,{rtab:'overview',chat:[],homeLoc:'',homeHz:''});
const ICON={arrow:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>',
  up:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5"/></svg>'};
const bestPath=()=>S.mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0];
const hzText=()=>`${S.spec.horizon} ${S.spec.stepUnit==='Mo'?'months':'weeks'}`;
const evConf=W=>{const on=W.signals.filter(s=>s.on);return on.length?on.reduce((a,s)=>a+s.conf,0)/on.length:W.prof.evidence};

/* ---------- Home ---------- */
const HOME_EX=[['Pricing','Cut detergent price 15% in Kano','What could happen if we reduce the price of our detergent by 15% in Kano?'],
 ['Expansion','Next Nigerian state to enter','Which Nigerian state should we expand into next?'],
 ['Supply','Fuel prices and food prices','What could happen to food prices if fuel prices rise?'],
 ['Policy','Telecom regulation in Kenya','How could a new telecom regulation affect mobile operators in Kenya?'],
 ['Banking','Agent banking in Ghana','Should a bank expand agent banking into Kumasi?'],
 ['Energy','Solar demand growth','Where is demand for solar installations likely to grow in Kenya?']];
renderSimpleExamples=function(){$('#ex').innerHTML=HOME_EX.map(([k,t,q])=>`<button type="button" class="qpill" data-q="${h(q)}" title="${h(q)}"><i>${k}</i>${h(t)}</button>`).join('')};
(function initHome(){
  renderSimpleExamples();
  const sel=$('#hLoc');sel.innerHTML+=AFRICA.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`<option value="${h(c.name)}">${h(c.name)}</option>`).join('');
  sel.addEventListener('change',()=>{S.homeLoc=sel.value;sel.closest('.chipsel').title=sel.value||'Location'});
  $('#hHz').addEventListener('change',e=>{S.homeHz=e.target.value});
  document.addEventListener('submit',e=>{if(e.target.id!=='ask')return;const q=$('#q');let v=q.value.trim()||q.placeholder;
    if(S.homeLoc&&!v.toLowerCase().includes(S.homeLoc.toLowerCase()))v=v.replace(/[?.!\s]+$/,'')+` in ${S.homeLoc}?`;q.value=v},true);
})();
const _ss=startSetup;
startSetup=function(q){_ss(q);if(S.homeHz&&S.setup){S.setup.spec.horizon=+S.homeHz;S.setup.spec.stepUnit='Wk';S.setup.spec.notes=S.setup.spec.notes.filter(n=>!/^No time/.test(n));renderSetup()}};

/* ---------- Results tabs ---------- */
function setTab(t){S.rtab=t;$$('#rtabs [data-rtab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.rtab===t));$$('#vResults .tp').forEach(p=>p.hidden=p.dataset.tp!==t);
  if(t==='compare'){$('#dCmp').open=true;if(S.W)renderCompare()}
  if(t==='memory'){$('#dMem').open=true;renderMemory()}
  if(t==='overview')setTimeout(()=>{sizeMap();S.netKey='';S.W&&buildNet()},30)}
document.addEventListener('click',e=>{const t=e.target;let b;
  if((b=t.closest('[data-rtab]'))){setTab(b.dataset.rtab);return}
  if(S.screen!=='results')return;
  if(t.closest('#aCmp'))setTab('compare');
  else if(t.closest('[data-gap],[data-deploy],[data-itab],[data-bnd],#aInv,[data-agent],[data-signal],[data-ask],#aRun')&&S.rtab!=='overview')setTab('overview');
},true);

/* ---------- Header ---------- */
const _rh=renderResHeader;
renderResHeader=function(){_rh();const W=S.W;$('#rcGeo').textContent=geoLabel(W.geo);$('#rcLive').textContent=`${S.mc?S.mc.N:200} runs · ${hzText()}`;
  const tab=$('#rtabs [data-rtab="analysis"] span');if(tab)tab.textContent='4'};

/* ---------- Recommendation ---------- */
function recOf(){
  const mc=S.mc,best=bestPath(),gap=ensureSens().find(x=>!x.a.verified&&!x.a.userSet),risk=mc.paths.filter(p=>p.id==='C'||p.id==='D').sort((a,b)=>b.prob-a.prob)[0];
  if(gap&&impactOf(gap.swing)==='High')return {k:'inv',t:`Investigate ${gap.a.label.toLowerCase()} before committing.`,d:`Deploying SavoScouts for ${gap.a.n} observations would narrow the range most.`};
  if(best.prob>=.6&&((mc.fr==='gain'&&mc.p10>0)||mc.fr!=='gain'))return {k:'pilot',t:'The evidence supports the most likely path.',d:'Consider a limited pilot and monitor the strongest signals weekly.'};
  if(risk&&risk.prob>=.25)return {k:'risk',t:`Prepare a response to “${risk.title.toLowerCase()}”.`,d:`It appears in ${Math.round(risk.prob*100)}% of runs.`};
  return {k:'cmp',t:'Compare alternatives before committing.',d:'No option is clearly supported yet.'};
}

/* ---------- Summary banner + KPI strip ---------- */
function sparkMedian(mc){const w=200,hh=40,v=mc.band.map(q=>q[1]),mn=Math.min(0,...v),mx=Math.max(0,...v),sx=t=>2+t/STEPS*(w-8),sy=x=>hh-4-(x-mn)/((mx-mn)||1)*(hh-10);
  const pts2=v.map((x,t)=>`${sx(t)},${sy(x)}`).join(' '),up=v[STEPS]>=0;
  return `<svg viewBox="0 0 ${w} ${hh}" aria-hidden="true"><defs><linearGradient id="spk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${up?'#618CD0':'#C27B14'}" stop-opacity=".28"/><stop offset="1" stop-color="${up?'#618CD0':'#C27B14'}" stop-opacity="0"/></linearGradient></defs><line x1="2" x2="${w-6}" y1="${sy(0)}" y2="${sy(0)}" stroke="#D6DDE8" stroke-dasharray="2 3"/><polygon points="${sx(0)},${sy(0)} ${pts2} ${sx(STEPS)},${sy(0)}" fill="url(#spk)"/><polyline points="${pts2}" fill="none" stroke="${up?'#4362B2':'#C27B14'}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${sx(STEPS)}" cy="${sy(v[STEPS])}" r="3.5" fill="#1F273F" stroke="#fff" stroke-width="1.5"/></svg>`}
function gaugeSvg(c){const n=24,seg=[],cx=80,cy=74,r1=50,r2=66;for(let i=0;i<n;i++){const a=Math.PI+(i+.5)/n*Math.PI,on=(i+.5)/n<=c;const x1=cx+Math.cos(a)*r1,y1=cy+Math.sin(a)*r1,x2=cx+Math.cos(a)*r2,y2=cy+Math.sin(a)*r2;
  seg.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${on?(c>=.72?'#1F273F':c>=.5?'#4362B2':'#C27B14'):'#E3E8F0'}" stroke-width="4.2" stroke-linecap="round"/>`)}
  return `<svg class="gauge" viewBox="0 0 160 84" role="img" aria-label="Evidence confidence ${c.toFixed(2)}">${seg.join('')}<text x="80" y="66" text-anchor="middle" font-size="22" font-weight="700" fill="#1F273F" letter-spacing="-.5">${c.toFixed(2)}</text><text x="80" y="80" text-anchor="middle" font-size="9.5" fill="#69728B">of 1.00</text></svg>`}
renderTakeaway=function(){
  const W=S.W,mc=S.mc,best=bestPath(),on=W.signals.filter(s=>s.on),conf=evConf(W),sens=ensureSens(),gap=sens.find(x=>!x.a.verified&&!x.a.userSet),rec=recOf();S.recText=rec.t+' '+rec.d;
  $('#nextActs').innerHTML=`<div class="sumbar"><div class="sb-l"><span class="sb-k"><i></i>Verisavo summary</span><p>${actionSentence(W,mc)} The most likely path is <b>${h(best.title.toLowerCase())}</b>, in ${Math.round(best.prob*100)}% of runs.</p><p class="sb-rec"><b>Recommended next step:</b> ${h(rec.t)} ${h(rec.d)}</p></div>
   <div class="sb-r">${gap?`<button class="w" data-gap="${gap.a.id}">Investigate the biggest gap</button>`:''}<button data-act="cmp">Compare strategies</button><button data-ask="whatif">Test a what-if</button></div></div>`;
  const lo=Math.min(mc.p10,0),hi=Math.max(mc.p90,0),pad=(hi-lo)*.12||.01,L=lo-pad,R=hi+pad,pc=v=>((v-L)/(R-L)*100).toFixed(1);
  const ps=mc.paths.slice().sort((a,b)=>b.prob-a.prob);
  $('#takeaway').innerHTML=`
   <div class="kpi dark"><span class="kl">Central result<em>${mc.eff?'vs doing nothing':'change'}</em></span><span class="kv num">${fmtO(mc.p50)}</span>${sparkMedian(mc)}<span class="ks">${h(W.agents[W.out].n)} · ${h(W.agents[W.out].m.toLowerCase())}, by ${stepWhen(STEPS).toLowerCase()}</span></div>
   <div class="kpi"><span class="kl">Range of outcomes<em>80% of runs</em></span><span class="kv num">${(Math.abs(mc.p90-mc.p10)*30).toFixed(1)}<small>pts wide</small></span>
    <div class="rtrack" aria-hidden="true"><span class="rng" style="left:${pc(mc.p10)}%;width:${(pc(mc.p90)-pc(mc.p10)).toFixed(1)}%"></span><span class="zero" style="left:${pc(0)}%"></span><span class="med" style="left:${pc(mc.p50)}%"></span></div>
    <div class="rlbl"><span>${fmtO(mc.p10)}</span><span>${fmtO(mc.p90)}</span></div></div>
   <div class="kpi"><span class="kl">Most likely path<em>Path ${best.id}</em></span><span class="kv num">${Math.round(best.prob*100)}%</span>
    <div class="pseg" role="group" aria-label="Paths">${ps.map((p,i)=>`<button data-path="${p.id}" class="${i===0?'top':''} ${(p.id==='C'||p.id==='D')&&i?'risk':''} ${p.id===S.path?'sel':''}" style="flex:${Math.max(.04,p.prob)}" title="${h(p.id+' · '+p.title+' · '+Math.round(p.prob*100)+'%')}" aria-label="Play path ${p.id}"></button>`).join('')}</div>
    <span class="ks"><b>${h(best.title)}</b></span></div>
   <div class="kpi"><span class="kl">Evidence confidence<em>${confWord(conf)}</em></span>${gaugeSvg(conf)}<span class="ks">${on.length} signals · coverage ${W.prof.evidence.toFixed(2)}</span></div>
   <div class="kpi"><span class="kl">Biggest unknown${gap?`<em style="background:${impactOf(gap.swing)==='High'?'var(--amber-soft)':'var(--tint-2)'};color:${impactOf(gap.swing)==='High'?'var(--pressure)':'var(--ink-2)'}">${impactOf(gap.swing)} impact</em>`:''}</span>
    ${gap?`<span class="kq">${h(gap.a.label)}</span><span class="ks">Could move the result between <b>${fmtO(Math.min(gap.lo,gap.hi))}</b> and <b>${fmtO(Math.max(gap.lo,gap.hi))}</b>.</span><button class="klink" data-gap="${gap.a.id}">Investigate ${ICON.arrow.replace('<svg','<svg width="13" height="13"')}</button>`:`<span class="kq">No open gaps</span><span class="ks">All unknowns are resolved or set by you.</span>`}</div>`;
};

/* ---------- Intelligence panel with the Assistant ---------- */
renderSide=function(){
  const W=S.W;if(!W||!S.mc)return;
  const keep=$('#asQ')?{v:$('#asQ').value,f:document.activeElement&&document.activeElement.id==='asQ'}:null;
  const nUnk=ensureSens().filter(x=>!x.a.verified).length,tab=S.tabI||'assist';
  let html=S.detail?detailHTML()+agentAsk():'';
  if(S.rank){const mx=Math.max(...S.rank.map(r=>Math.abs(r.mean)),.001);html+=`<div class="rankbox"><div class="rbh"><b>Locations compared</b><span>${S.rank.length} places · same scenario</span></div>${S.rank.map((r,i)=>`<button class="rk2 ${i===S.rankSel?'sel':''}" data-rank="${i}"><span class="n">${i+1}</span><span class="nm">${h(r.label)}${r.thin?'<small>limited evidence</small>':''}</span><span class="bar"><i style="width:${Math.round(Math.abs(r.mean)/mx*100)}%;background:${r.mean<0?'var(--amber)':'var(--blue)'}"></i></span><span class="v">${fmtO(r.mean)}</span></button>`).join('')}</div>`}
  html+=`<div class="itabs" role="tablist"><button data-itab="assist" aria-selected="${tab==='assist'}">Assistant</button><button data-itab="signals" aria-selected="${tab==='signals'}">Signals<span>${W.signals.filter(s=>s.on).length}</span></button><button data-itab="know" aria-selected="${tab==='know'}">What we know</button><button data-itab="unknowns" aria-selected="${tab==='unknowns'}">Unknowns<span>${nUnk}</span></button></div>`;
  html+=`<div class="ipanel">${tab==='assist'?assistTab():tab==='signals'?signalsTab():tab==='know'?knowTab():unknownsTab()}</div>`;
  $('#side').innerHTML=html;renderBelow();
  if(keep&&$('#asQ')){$('#asQ').value=keep.v;if(keep.f)$('#asQ').focus()}
  const lg=$('#asLog');if(lg&&S._scrollChat){S._scrollChat=false;const last=lg.lastElementChild;last&&last.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'})}
};
const AS_CHIPS=[['why','Why this result?'],['risk','What is the biggest risk?'],['unknown','What don’t we know?'],['confidence','How reliable is this?'],['next','What should we do next?'],['whatif','Test a what-if']];
function assistTab(){
  const W=S.W,log=S.chat;
  const intro=`<p class="as-hello">Ask about this simulation, <span>or test a what-if.</span></p>`;
  return `<div class="assist"><div class="as-head"><span class="as-ic" aria-hidden="true"></span><div><b>Verisavo Intelligence Assistant</b><span>Answers come from this simulation and its evidence.</span></div></div>
   ${log.length?'':intro}
   <div class="as-log" id="asLog">${log.map(m=>`<div class="msg-u">${h(m.q)}</div><div class="msg-a">${m.a}</div>`).join('')}</div>
   <div class="as-chips">${AS_CHIPS.filter(([k])=>!log.length||k!=='whatif'||true).map(([k,l])=>`<button data-ask="${k}">${k==='whatif'?'<i>+</i>':''}${l}</button>`).join('')}</div>
   <form class="as-in" id="asForm"><input id="asQ" autocomplete="off" placeholder="Ask, or try “What if fuel prices rise?”" aria-label="Ask the assistant"><button class="send" type="submit" aria-label="Send">${ICON.up}</button></form>
   <div class="as-wi"><span>What-ifs re-run all ${S.mc.N} runs with the new condition.</span>${W.events.filter(e=>e.src==='composer').length?`<b>${W.events.filter(e=>e.src==='composer').length} added</b>`:''}</div></div>`;
}
function agentWhy(i){const W=S.W,a=W.agents[i],rep=curRep(),t=STEPS,ch=trace(W,rep,i,t);
  return ch.length>1?`${h(a.n)}: ${h(a.m.toLowerCase())} ends at <b>${fmtO(rep.X[t][i])}</b> on this path, because ${ch.slice(1).map(c=>c.type==='a'?h(W.agents[c.i].n.toLowerCase()):h(srcName(W,c.c).toLowerCase())).join(', which reflects ')}.`:`${h(a.n)} has not moved far from today’s position on this path.`}
function answer(kind,q){
  const W=S.W,mc=S.mc,best=bestPath(),C=S.contrib,sens=ensureSens(),gap=sens.find(x=>!x.a.verified&&!x.a.userSet);
  if(kind==='why'){const drv=C.items.filter(x=>x.type!=='o').sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,3);
    return `<span class="mk">Why this result</span><span>${h(narrative(W,curPath()))}</span><div class="mv">${drv.map(d=>`<span>${h(oneLine(d.type==='e'?'Your change':d.name,30))} <b>${pts(d.v)}</b></span>`).join('')}</div><small>Contributions estimated by switching each driver off. See Analysis, Exhibit 3.</small>`}
  if(kind==='risk'){const r=mc.paths.filter(p=>p.id==='C'||p.id==='D').sort((a,b)=>b.prob-a.prob)[0]||mc.paths.slice().sort((a,b)=>a.mean-b.mean)[0];const act=(r.rep.acts||[])[0];
    return `<span class="mk">Biggest risk</span><span>Path ${r.id}, <b>${h(r.title.toLowerCase())}</b>, appears in ${Math.round(r.prob*100)}% of runs and ends at ${fmtO(r.mean)}.${act?` The turning point is when ${h(act.text.toLowerCase())} (${stepWhen(act.t).toLowerCase()}).`:''}</span><div class="acts"><button class="btn sm" data-path="${r.id}">Play this path</button></div>`}
  if(kind==='unknown'){if(!gap)return `<span class="mk">What we don’t know</span><span>All material unknowns are resolved or set by you. Remaining uncertainty comes from signal confidence and agent interactions.</span>`;
    const more=sens.filter(x=>!x.a.verified&&!x.a.userSet).slice(1,3);
    return `<span class="mk">What we don’t know</span><span>The biggest gap is <b>${h(gap.a.label.toLowerCase())}</b>. It is assumed, not observed, and could move the result between ${fmtO(Math.min(gap.lo,gap.hi))} and ${fmtO(Math.max(gap.lo,gap.hi))}.${more.length?` Next: ${more.map(x=>h(x.a.label.toLowerCase())).join(' and ')}.`:''}</span><div class="acts"><button class="btn sm pri" data-gap="${gap.a.id}">Investigate</button><button class="btn sm" data-itab="unknowns">See all unknowns</button></div>`}
  if(kind==='confidence'){const conf=evConf(W),st={};W.signals.filter(s=>s.on).forEach(s=>st[s.state]=(st[s.state]||0)+1);const asm=W.assumptions.filter(a=>!a.verified&&!a.userSet).length;
    return `<span class="mk">How reliable this is</span><span>Evidence confidence is <b>${confWord(conf).toLowerCase()} (${conf.toFixed(2)})</b> across ${W.signals.filter(s=>s.on).length} signals, with coverage of ${W.prof.evidence.toFixed(2)} for ${h(geoShort(W.geo))}. ${asm} value${asm===1?' is':'s are'} still assumed rather than observed.</span><div class="mv">${Object.entries(st).map(([k,v])=>`<span>${k} <b>${v}</b></span>`).join('')}</div><small>This is a simulation of plausible outcomes, not a forecast.</small>`}
  if(kind==='next'){const r=recOf();return `<span class="mk">Suggested next step</span><span><b>${h(r.t)}</b> ${h(r.d)}</span><div class="acts">${r.k==='inv'&&gap?`<button class="btn sm pri" data-gap="${gap.a.id}">Investigate</button>`:''}<button class="btn sm" data-act="cmp">Compare strategies</button><button class="btn sm" data-act="rep">Open report</button></div><small>Verisavo supports the decision. You make it.</small>`}
  if(kind==='whatif')return `<span class="mk">Test a what-if</span><span>Describe a change in your own words, or pick one. Verisavo adds it to the market and re-runs every simulation.</span><div class="acts">${COMPOSER.slice(0,8).map(([k,a])=>`<button class="btn sm" data-wi="${k}|${a==null?'':a}">${h(EVENTS[k].label(a))}</button>`).join('')}</div>`;
  if(kind==='agent')return `<span class="mk">Agent reasoning</span><span>${agentWhy(q)}</span><div class="acts"><button class="btn sm" data-agent="${q}">Open ${h(S.W.agents[q].n)}</button></div><small>Reasoning summary generated from the simulation and its evidence.</small>`;
  return `<span class="mk">I can help with</span><span>Questions about why the market moved, risks, unknowns, reliability and next steps, or a what-if such as a price change, fuel rise, competitor entry or distributor exit.</span>`;
}
function runWhatIf(evs,label){
  const W=S.W,b={p50:S.mc.p50,best:bestPath()},added=[];
  evs.forEach(ev=>{if(W.events.some(x=>x.key===ev[0]))return;const e=addEvent(W,ev,'composer');if(e)added.push(e)});
  if(!added.length)return `<span class="mk">No change</span><span>That condition is already part of this simulation, or it has no counterpart in this market.</span>`;
  S.tau=0;simulate();S.playing=!RM;renderPlay();const a=bestPath();
  return `<span class="mk">What-if result</span><span>Added <b>${h(added.map(e=>e.label).join(' and '))}</b>. The central result moves from ${fmtO(b.p50)} to <b>${fmtO(S.mc.p50)}</b>. ${a.title===b.best.title?`The most likely path is still ${h(a.title.toLowerCase())} (${Math.round(a.prob*100)}%).`:`The most likely path changes to <b>${h(a.title.toLowerCase())}</b> (${Math.round(a.prob*100)}%).`}</span>
   <div class="mv"><span>Before <b>${fmtO(b.p50)}</b></span><span>After <b>${fmtO(S.mc.p50)}</b></span><span>Change <b>${((S.mc.p50-b.p50)*30>=0?'+':'−')+Math.abs((S.mc.p50-b.p50)*30).toFixed(1)} pts</b></span></div>
   <div class="acts">${added.map(e=>`<button class="btn sm" data-rmev="${h(e.id)}">Undo ${h(oneLine(e.label,22).toLowerCase())}</button>`).join('')}<button class="btn sm" data-rtab="analysis">See exhibits</button></div>`;
}
function ask(text){
  const W=S.W,t=text.trim();if(!t)return;const l=t.toLowerCase();let a;
  const sp=understand(t,W.geo);let evs=sp.events.filter(e=>e[0]!=='launch');
  if(/competitor|rival/.test(l)&&evs.some(e=>e[0]==='priceDown'))evs=[['entrant']];
  const agentI=W.agents.findIndex(x=>{const n=x.n.toLowerCase();return n.length>3&&(l.includes(n)||l.includes(n.replace(/s$/,'')))});
  if(evs.length&&!/^why\b/.test(l))a=runWhatIf(evs);
  else if(/what if|suppose|imagine/.test(l))a=`<span class="mk">Not recognised yet</span><span>I couldn’t map that to a market event this prototype models. Try one of these.</span><div class="acts">${COMPOSER.slice(0,8).map(([k,x])=>`<button class="btn sm" data-wi="${k}|${x==null?'':x}">${h(EVENTS[k].label(x))}</button>`).join('')}</div>`;
  else if(agentI>=0)a=answer('agent',agentI);
  else if(/risk|worst|downside|threat|danger/.test(l))a=answer('risk');
  else if(/unknown|gap|missing|don.t know|uncertain/.test(l))a=answer('unknown');
  else if(/confiden|reliab|sure|trust|evidence|accurate/.test(l))a=answer('confidence');
  else if(/should|recommend|next|do now|decide/.test(l))a=answer('next');
  else if(/why|explain|cause|driv/.test(l))a=answer('why');
  else a=answer('help');
  S.chat.push({q:t,a});S.tabI='assist';S._scrollChat=true;remember('Assistant',h(t));renderSide();
}
document.addEventListener('submit',e=>{if(e.target.id!=='asForm')return;e.preventDefault();const v=$('#asQ').value;$('#asQ').value='';ask(v)});
document.addEventListener('click',e=>{const t=e.target;let b;if(S.screen!=='results')return;
  if((b=t.closest('[data-ask]'))){const k=b.dataset.ask,l=(AS_CHIPS.find(x=>x[0]===k)||[,''])[1];S.tabI='assist';S.chat.push({q:l,a:answer(k)});S._scrollChat=true;renderSide();if(b.closest('.sumbar'))$('#side').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return}
  if((b=t.closest('[data-wi]'))){const [k,x]=b.dataset.wi.split('|');const ev=x===''?[k]:[k,+x];const a=runWhatIf([ev]);S.chat.push({q:'What if: '+EVENTS[k].label(x===''?undefined:+x),a});S.tabI='assist';S._scrollChat=true;renderSide();return}
});
const _run=runSim;
runSim=async function(){const p=_run();S.tabI='assist';S.chat=[];setTab('overview');$('#side').scrollTop=0;return p};

/* ---------- Map: soft glow markers with dark callout cards ---------- */
drawHeat=function(T){_dh(T);const W=S.W;if(!W||!S.cam||!S.reveal.sig)return;
  const toS=(x,y)=>[(x-S.cam.x)/S.cam.w*MW.w,(y-S.cam.y)/S.cam.h*MW.h],P=W.placeIdx;
  const sigs=W.signals.map((s,k)=>({s,k})).filter(o=>o.s.on&&(!S.hl||S.hl.k===o.k));
  const G=new Map();sigs.forEach(o=>{const pid=o.s.places[0];if(!P[pid])return;const a=W.agents[o.s.tg[0][0]];o.adv=adverse(a,o.s.tg[0][1]);const C=S.contrib&&S.contrib.items.find(it=>it.type==='s'&&it.k===o.k);o.v=C?C.v:null;o.w=o.s.strength*o.s.conf;if(!G.has(pid))G.set(pid,[]);G.get(pid).push(o)});
  const groups=[...G.entries()].map(([pid,l])=>({p:P[pid],l:l.sort((a,b)=>Math.abs(b.v||0)-Math.abs(a.v||0)||b.w-a.w),w:l.reduce((a,o)=>a+o.w,0)})).sort((a,b)=>b.w-a.w);
  const boxes=[];
  groups.forEach((g,gi)=>{let [x,y]=toS(g.p.x,g.p.y);g.x=x;g.y=y;if(x<-30||y<-30||x>MW.w+30||y>MW.h+30){g.off=true;return}
    const nAdv=g.l.filter(o=>o.adv).length,adv=nAdv>g.l.length/2,col=adv?'#C27B14':'#4362B2',rgb=adv?'194,123,20':'67,98,178',pul=RM?.5:(T*.5+gi*.31)%1,R=22+Math.min(18,g.l.length*4)+pul*10;
    const gr=hctx.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,`rgba(${rgb},.32)`);gr.addColorStop(.55,`rgba(${rgb},.10)`);gr.addColorStop(1,`rgba(${rgb},0)`);hctx.fillStyle=gr;hctx.beginPath();hctx.arc(x,y,R,0,6.2832);hctx.fill();
    hctx.fillStyle='#fff';hctx.beginPath();hctx.arc(x,y,g.l.length>1?10:7.5,0,6.2832);hctx.fill();hctx.fillStyle=col;hctx.beginPath();hctx.arc(x,y,g.l.length>1?8:5,0,6.2832);hctx.fill();
    if(g.l.length>1){hctx.font='700 9.5px Geist, Arial, sans-serif';hctx.fillStyle='#fff';hctx.textAlign='center';hctx.fillText(g.l.length,x,y+3.4);hctx.textAlign='left'}});
  const vis=groups.filter(g=>!g.off),pins=vis.map(g=>[g.x-12,g.y-12,24,24]);
  vis.slice(0,MW.w<520?2:3).forEach(g=>{
    const rows=g.l.slice(0,3),more=g.l.length-rows.length,cw=Math.min(232,Math.max(180,MW.w*.5)),rh=19,ch=30+rows.length*rh+(more?16:6);
    const hit=(x,y)=>x<8||y<40||x+cw>MW.w-56||y+ch>MW.h-36||[...boxes,...pins].some(b=>!(x+cw<b[0]||x>b[0]+b[2]||y+ch<b[1]||y>b[1]+b[3]));
    const cand=[[g.x+18,g.y-ch/2,'r'],[g.x-18-cw,g.y-ch/2,'l'],[g.x-cw/2,g.y-ch-18,'t'],[g.x-cw/2,g.y+18,'b'],[g.x+18,g.y-ch-10,'r'],[g.x-18-cw,g.y+10,'l']];
    let pick=cand.find(c=>!hit(c[0],c[1]));if(!pick){const fx=Math.max(8,Math.min(MW.w-56-cw,g.x-cw/2));let fy=40;while(fy<MW.h-ch-8&&boxes.some(b=>!(fx+cw<b[0]||fx>b[0]+b[2]||fy+ch<b[1]||fy>b[1]+b[3])))fy+=8;if(fy>=MW.h-ch-8)return;pick=[fx,fy,fy+ch<g.y?'t':'b']}
    let [lx,ly,side]=pick;lx=Math.max(8,Math.min(MW.w-56-cw,lx));
    boxes.push([lx,ly,cw,ch]);
    hctx.save();hctx.shadowColor='rgba(31,39,63,.30)';hctx.shadowBlur=18;hctx.shadowOffsetY=6;hctx.fillStyle='#1F273F';rr(hctx,lx,ly,cw,ch,14);hctx.fill();hctx.restore();
    hctx.fillStyle='#1F273F';hctx.beginPath();if(side==='r'||side==='l'){const ay=Math.max(ly+14,Math.min(ly+ch-14,g.y));if(side==='r'){hctx.moveTo(lx,ay-6);hctx.lineTo(lx-6,ay);hctx.lineTo(lx,ay+6)}else{hctx.moveTo(lx+cw,ay-6);hctx.lineTo(lx+cw+6,ay);hctx.lineTo(lx+cw,ay+6)}}else{const ax=Math.max(lx+16,Math.min(lx+cw-16,g.x));if(side==='t'){hctx.moveTo(ax-6,ly+ch);hctx.lineTo(ax,ly+ch+6);hctx.lineTo(ax+6,ly+ch)}else{hctx.moveTo(ax-6,ly);hctx.lineTo(ax,ly-6);hctx.lineTo(ax+6,ly)}}hctx.fill();
    hctx.font='700 11.5px Geist, Arial, sans-serif';hctx.fillStyle='#fff';hctx.fillText(g.p.name.replace(/ hub$/,''),lx+12,ly+19);
    hctx.font='500 10px Geist, Arial, sans-serif';hctx.fillStyle='#93A3C4';hctx.textAlign='right';hctx.fillText(`${g.l.length} signal${g.l.length>1?'s':''}`,lx+cw-12,ly+19);hctx.textAlign='left';
    hctx.strokeStyle='rgba(255,255,255,.10)';hctx.beginPath();hctx.moveTo(lx+12,ly+27);hctx.lineTo(lx+cw-12,ly+27);hctx.stroke();
    rows.forEach((o,i)=>{const yy=ly+30+i*rh+12;hctx.fillStyle=o.adv?'#E8C58C':'#A8C6E8';hctx.beginPath();hctx.arc(lx+15,yy-3.5,3,0,6.2832);hctx.fill();
      hctx.font='500 10.5px Geist, Arial, sans-serif';hctx.fillStyle='#E6ECF6';let nm=o.s.title;while(hctx.measureText(nm).width>cw-86&&nm.length>4)nm=nm.slice(0,-2);if(nm!==o.s.title)nm=nm.replace(/\s*\S?$/,'')+'…';hctx.fillText(nm,lx+24,yy);
      if(o.v!=null){hctx.font='700 10.5px Geist, Arial, sans-serif';hctx.fillStyle=o.adv?'#F2D29C':'#C9DAF2';hctx.textAlign='right';hctx.fillText(pts(o.v),lx+cw-12,yy);hctx.textAlign='left'}});
    if(more){hctx.font='500 10px Geist, Arial, sans-serif';hctx.fillStyle='#93A3C4';hctx.fillText(`+${more} more in the Signals tab`,lx+24,ly+ch-8)}});
};
setTab('overview');
