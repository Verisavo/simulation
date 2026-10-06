/* Verisavo Market Simulation — simplified light interface */
setCountries(AFRICA);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const NS='http://www.w3.org/2000/svg';
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,60):ms));
const fmtO=v=>(v>=0?'+':'−')+Math.abs(v*30).toFixed(1)+'%';
const arrow=v=>v>.004?'▲':v<-.004?'▼':'■';
const adverse=(a,x)=>a.inv?x>0:x<0;
const confWord=c=>c>=.72?'High':c>=.5?'Moderate':'Low';
const clock=()=>new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
const STEP_NAMES=['Today','Intervention','First reactions','Knock-on effects','Wider effects','Market response','Possible outcome'];
const EXAMPLES=['What could happen if we reduce the price of our detergent by 15% in Kano?','Which Nigerian state should we expand into next?','What could happen to food prices if fuel prices rise?','How could a new telecom regulation affect mobile operators in Kenya?','What happens if a major distributor stops serving this region?','Should a bank expand agent banking into this community?','Where is demand for solar installations likely to grow?','What happens to hotel bookings in Kigali if airline capacity falls?'];

const S={spec:null,W:null,mc:null,path:'A',tau:0,playing:false,view:'both',detail:null,memory:[],decision:null,rank:null,rankSel:0,nav:null,cam:null,camT:null,reveal:{n:999,sig:1,edge:1},lastStep:-1,busy:false,netKey:'',inv:{},sens:null,cmpMode:'int',cmp:null,navTarget:null};
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2600)}
function remember(kind,text){S.memory.unshift({t:clock(),kind,text});if($('#dMem').open)renderMemory()}

/* ---------- Map ---------- */
const MW={w:600,h:440};let hctx=null;
function initMap(){
  hctx=$('#heat').getContext('2d');
  $('#gC').innerHTML=AFRICA.map(c=>`<path class="cty" data-id="${c.id}" d="${c.d}"><title>${h(c.name)}</title></path>`).join('');
  if(typeof ResizeObserver!=='undefined'){new ResizeObserver(sizeMap).observe($('#mapWrap'));new ResizeObserver(()=>{if(!S.W)return;const r=$('#netWrap').getBoundingClientRect();if(S.netSize&&Math.abs(r.width-S.netSize[0])<4&&Math.abs(r.height-S.netSize[1])<4)return;S.netKey='';buildNet()}).observe($('#netWrap'))}
  window.addEventListener('resize',sizeMap);
  $('#map').addEventListener('click',e=>{
    const n=e.target.closest('[data-geo]');if(n){const g=JSON.parse(n.dataset.geo);navTo(g);offerSim(g);return}
    const c=e.target.closest('.cty');if(c&&c.dataset.id!=='732'){const g=mkGeo('country',{cid:c.dataset.id});navTo(g);offerSim(g)}});
}
function offerSim(g){const b=$('#simHere');if(S.W&&JSON.stringify(g)===JSON.stringify(S.W.geo)){b.hidden=true;return}S.navTarget=g;b.textContent=`Simulate in ${geoShort(g)}`;b.hidden=false}
function sizeMap(){const r=$('#mapWrap').getBoundingClientRect();if(r.width<10)return;MW.w=r.width;MW.h=r.height;const d=window.devicePixelRatio||1;const HC=$('#heat');HC.width=Math.round(MW.w*d);HC.height=Math.round(MW.h*d);if(S.cam){S.cam=fixAspect(S.cam);if(S.camT)S.camT.to=fixAspect(S.camT.to)}applyCam()}
function fixAspect(c){const a=MW.w/MW.h,cx=c.x+c.w/2,cy=c.y+c.h/2;let w=c.w,hh=c.h;if(w/hh<a)w=hh*a;else hh=w/a;return {x:cx-w/2,y:cy-hh/2,w,h:hh}}
function fitBB(bb,pad=.1){const bw=Math.max(bb[2]-bb[0],3),bh=Math.max(bb[3]-bb[1],3);return fixAspect({x:bb[0]-bw*pad,y:bb[1]-bh*pad,w:bw*(1+2*pad),h:bh*(1+2*pad)})}
function flyTo(bb){const to=fitBB(bb);if(!S.cam||RM){S.cam=to;S.camT=null;applyCam();return}S.camT={from:{...S.cam},to,t0:performance.now(),d:900}}
function applyCam(){if(!S.cam)return;const c=S.cam;$('#map').setAttribute('viewBox',`${c.x} ${c.y} ${c.w} ${c.h}`);scaleMarks()}
const U=()=>S.cam?S.cam.w/MW.w:1;
function scaleMarks(){const u=U();$$('#map [data-r]').forEach(e=>e.setAttribute('r',(e.dataset.r*u).toFixed(3)));$$('#map [data-fs]').forEach(e=>{e.setAttribute('font-size',(e.dataset.fs*u).toFixed(3));e.setAttribute('stroke-width',(3*u).toFixed(3));e.setAttribute('y',(+e.dataset.y+(+e.dataset.dy||0)*u).toFixed(3))})}
function bbFor(g){
  if(g.level==='africa')return [0,0,850,790];
  if(g.level==='region'){const bs=REG[g.region].map(c=>CTRY[c]&&CTRY[c].bb).filter(Boolean);return [Math.min(...bs.map(b=>b[0])),Math.min(...bs.map(b=>b[1])),Math.max(...bs.map(b=>b[2])),Math.max(...bs.map(b=>b[3]))]}
  if(g.level==='country')return CTRY[g.cid].bb;
  if(g.level==='city'){const c=CITY[g.city];const pts=[[c.x,c.y],...c.ds.map(d=>[DIST[d].x,DIST[d].y])];const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,s=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),4.5)/2+1.2;return [cx-s,cy-s,cx+s,cy+s]}
  const d=DIST[g.district];return [d.x-1.6,d.y-1.6,d.x+1.6,d.y+1.6];
}
function geoPos(g){if(g.level==='district')return [DIST[g.district].x,DIST[g.district].y];if(g.level==='city')return [CITY[g.city].x,CITY[g.city].y];if(g.level==='country'){return FEAT[g.cid]?[CITY[FEAT[g.cid].cityIds[0]].x,CITY[FEAT[g.cid].cityIds[0]].y]:CTRY[g.cid].c}return [425,395]}
function navTo(g){S.nav=g;flyTo(bbFor(g));renderMapLayers();renderCrumbs()}
function navChildren(g){if(g.level==='country'&&FEAT[g.cid])return FEAT[g.cid].cityIds.map(id=>mkGeo('city',{city:id}));if(g.level==='city'||g.level==='district')return CITY[g.city].ds.map(d=>mkGeo('district',{district:d}));if(g.level==='region')return REG[g.region].filter(c=>FEAT[c]).map(cid=>mkGeo('country',{cid}));return []}
function renderMapLayers(){
  if(!S.nav)return;const nav=S.nav,W=S.W;
  $$('#gC .cty').forEach(p=>{const id=p.dataset.id;p.classList.toggle('on',nav.cid===id&&!['africa','region'].includes(nav.level));p.classList.toggle('dim',['country','city','district'].includes(nav.level)&&nav.cid!==id)});
  let r='',pl='',nv='',lb='';
  const lab=(x,y,t,cls,fs=11,dy=-9)=>`<text class="lbl ${cls||''}" x="${x}" y="${y}" data-y="${y}" data-dy="${dy}" data-fs="${fs}" text-anchor="middle">${h(t)}</text>`;
  if(W){const P=W.placeIdx;W.routes.forEach(([a,b])=>{const A=P[a],B=P[b];if(A&&B)r+=`<line class="rt" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`});
    W.places.filter(p=>!p.tags.includes('route')).forEach(p=>{pl+=`<circle class="pl ${p.tags.includes('far')?'far':''}" cx="${p.x}" cy="${p.y}" data-r="2.6"/>`;
      const show=['city','district'].includes(nav.level)||(nav.level==='country'&&p.tags.includes('city'));if(show&&!p.tags.includes('rural'))lb+=lab(p.x,p.y,p.name.replace(/ hub$/,''),'',p.tags.includes('far')?10:11)})}
  navChildren(nav).forEach(g=>{const [x,y]=geoPos(g),nm=geoShort(g);nv+=`<circle class="nav" cx="${x}" cy="${y}" data-r="8" data-geo='${JSON.stringify(g)}'><title>${h(nm)}</title></circle>`;if(!(W&&W.places.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.y-y)<.01)))lb+=lab(x,y,nm,'',10.5,-12)});
  if(['africa','region'].includes(nav.level))Object.keys(FEAT).forEach(cid=>{if(nav.level==='region'&&regionOf(cid)!==nav.region)return;const k=CTRY[cid];lb+=lab(k.c[0],k.c[1],k.name,'c',9.5,0)});
  if(S.rank)S.rank.forEach((c,i)=>{const [x,y]=geoPos(c.geo);lb+=`<text class="rank" x="${x}" y="${y}" data-y="${y}" data-dy="4" data-fs="10.5" text-anchor="middle" style="stroke:none">${i+1}</text>`});
  $('#gR').innerHTML=r;$('#gP').innerHTML=pl;$('#gN').innerHTML=nv;$('#gL').innerHTML=lb;scaleMarks();
}
function renderCrumbs(){const cr=geoCrumbs(S.nav).filter(c=>!c.stateOnly);$('#crumbs').innerHTML=cr.map((c,i)=>(i?'<span>›</span>':'')+`<button data-crumb='${JSON.stringify({level:c.level,region:c.region,cid:c.cid,city:c.city,district:c.district})}' aria-current="${i===cr.length-1}">${h(c.label)}</button>`).join('')}

/* heat on a light ground */
const C_SUP='97,140,208',C_PR='194,123,20',C_INK='31,39,63';
function blob(x,y,r,a,col){if(a<=.005||r<=.5)return;const g=hctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},${Math.min(.85,a)})`);g.addColorStop(.5,`rgba(${col},${Math.min(.85,a)*.35})`);g.addColorStop(1,`rgba(${col},0)`);hctx.fillStyle=g;hctx.beginPath();hctx.arc(x,y,r,0,6.2832);hctx.fill()}
function ring(x,y,r,a,col,w=1.4){if(a<=.01)return;hctx.strokeStyle=`rgba(${col},${Math.min(1,a)})`;hctx.lineWidth=w;hctx.beginPath();hctx.arc(x,y,r,0,6.2832);hctx.stroke()}
function glow(x,y,I,conf,mode,col,seed,T){
  I=Math.min(1.2,I);const r=8+26*I;let a=.18+.5*Math.min(1,I);if(mode==='weakening')a*=.45;
  if(mode==='contested'||mode==='collide'){const ph=Math.sin(T*2.4+seed);blob(x-r*.28,y,r*.8,a*(.55+.35*ph),C_SUP);blob(x+r*.28,y,r*.8,a*(.55-.35*ph),C_PR);return}
  if(conf<.55){for(let k=0;k<4;k++){const an=seed*7+k*1.57+T*.25,d=r*.38;blob(x+Math.cos(an)*d,y+Math.sin(an)*d,r*.5,a*.55,col)}}else blob(x,y,r,a,col);
  if(conf>=.72){hctx.fillStyle=`rgba(${col},.9)`;hctx.beginPath();hctx.arc(x,y,2.6,0,6.2832);hctx.fill()}
  if(mode==='emerging'){const p=((T*.5+seed)%1);ring(x,y,4+p*r*1.2,(1-p)*.6,col)}
  else if(mode==='spreading'){for(let k=0;k<2;k++){const p=((T*.4+seed+k*.5)%1);ring(x,y,r*.5+p*r*2,(1-p)*.4,col,1.1)}}
}
function curPath(){return S.mc?(S.mc.paths.find(p=>p.id===S.path)||S.mc.paths[0]):null}
function curRep(){const p=curPath();return p?p.rep:null}
function xAt(rep,i,tau){const t0=Math.floor(tau),t1=Math.min(STEPS,t0+1),f=tau-t0;return rep.X[t0][i]*(1-f)+rep.X[t1][i]*f}
function minDist(W,p){let d=1e9;W.origin.forEach(id=>{const o=W.placeIdx[id];if(o)d=Math.min(d,Math.hypot(o.x-p.x,o.y-p.y))});return d===1e9?0:d}
function extent(W){if(W._ext)return W._ext;let m=1;W.places.forEach(p=>{if(!p.tags.includes('far'))m=Math.max(m,minDist(W,p))});return W._ext=m}
function spatial(W,p,tau){if(tau<=.02)return 0;return Math.exp(-(minDist(W,p)/extent(W))/(.06+.24*Math.max(0,tau-.4)))}
function drawHeat(T){
  const d=window.devicePixelRatio||1;hctx.setTransform(d,0,0,d,0,0);hctx.clearRect(0,0,MW.w,MW.h);
  const W=S.W;if(!W||!S.cam)return;
  const toS=(x,y)=>[(x-S.cam.x)/S.cam.w*MW.w,(y-S.cam.y)/S.cam.h*MW.h];
  const rep=curRep(),tau=S.tau,P=W.placeIdx;
  hctx.globalCompositeOperation='source-over';
  if(S.rank){const mn=Math.min(...S.rank.map(r=>r.mean)),mx=Math.max(...S.rank.map(r=>r.mean));S.rank.forEach((c,i)=>{const [x,y]=toS(...geoPos(c.geo));const I=.3+.7*((c.mean-mn)/((mx-mn)||1));blob(x,y,10+22*I,.25+.4*I,C_SUP);hctx.fillStyle=`rgba(${C_INK},${i===S.rankSel?1:.75})`;hctx.beginPath();hctx.arc(x,y,8,0,6.2832);hctx.fill()})}
  if(rep&&tau>0&&S.reveal.sig){
    const acc={};
    W.agents.forEach((a,i)=>{if(S.hl&&!S.hl.agents.has(i))return;const x=xAt(rep,i,tau);if(Math.abs(x)<.02)return;const adv=adverse(a,x);a.places.forEach(pid=>{const p=P[pid];if(!p||p.tags.includes('route'))return;const I=Math.abs(x)*spatial(W,p,tau);const o=acc[pid]=acc[pid]||{pr:0,sp:0};if(adv)o.pr+=I;else o.sp+=I})});
    Object.entries(acc).forEach(([pid,o],k)=>{const p=P[pid];const [x,y]=toS(p.x,p.y);const pr=Math.min(1,o.pr*.8),sp=Math.min(1,o.sp*.8);
      if(pr>.06&&sp>.06)glow(x,y,Math.max(pr,sp),W.prof.evidence,'collide',C_SUP,k,T);else if(pr>.02||sp>.02)glow(x,y,Math.max(pr,sp),W.prof.evidence,'spreading',pr>sp?C_PR:C_SUP,k*.31,T)});
    W.places.filter(p=>p.tags.includes('route')).forEach((rp,k)=>{let act=0,adv=false;W.agents.forEach((a,i)=>{if(ROLES[a.id].pl!=='routes')return;const x=xAt(rep,i,tau);const v=Math.abs(x)*spatial(W,rp,tau);if(v>act){act=v;adv=adverse(a,x)}});
      if(act<.03)return;const A=P[rp.route[0]],B=P[rp.route[1]];if(!A||!B)return;const n=Math.min(5,1+Math.floor(act*8));
      for(let j=0;j<n;j++){const s=((T*(.12+act*.4))+j/n+k*.13)%1;const [x,y]=toS(A.x+(B.x-A.x)*s,A.y+(B.y-A.y)*s);hctx.fillStyle=`rgba(${adv?C_PR:C_SUP},.85)`;hctx.beginPath();hctx.arc(x,y,2.6,0,6.2832);hctx.fill()}});
  }
  if(S.reveal.sig)W.signals.forEach((s,k)=>{if(!s.on||(S.hl&&S.hl.k!==k))return;const I=s.strength*lifeF(s,Math.max(1,tau))*.7;const a=W.agents[s.tg[0][0]],col=adverse(a,s.tg[0][1])?C_PR:C_SUP;
    s.places.forEach((pid,j)=>{const p=P[pid];if(!p)return;const [x,y]=toS(p.x,p.y);glow(x+(j%2?6:-6),y-4,I,s.conf,s.life,col,k*.53+j,T)})});
  hctx.globalCompositeOperation='source-over';
}

/* ---------- Agents network ---------- */
let NP=[];
function netLayout(W){
  const r=$('#netWrap').getBoundingClientRect(),w=Math.max(280,r.width||440),hh=Math.max(300,r.height||440);$('#net').setAttribute('viewBox',`0 0 ${w} ${hh}`);
  const others=W.agents.map((a,i)=>({a,i})).filter(o=>o.i!==W.out).sort((p,q)=>p.a.col-q.a.col||p.i-q.i);
  const cx=w/2,cy=hh/2+6,rx=Math.max(90,w/2-66),ry=Math.max(90,hh/2-62);
  W.agents[W.out].nx=cx;W.agents[W.out].ny=cy;
  others.forEach((o,k)=>{const an=Math.PI+k/others.length*2*Math.PI;o.a.nx=cx+Math.cos(an)*rx;o.a.ny=cy+Math.sin(an)*ry});S.netSize=[w,hh];
}
function wrap2(s){const w=s.split(' ');let a='',b='';for(const x of w){if((a+' '+x).trim().length<=16&&!b)a=(a+' '+x).trim();else b=(b+' '+x).trim()}if(b.length>18)b=b.slice(0,17)+'…';return [a,b].filter(Boolean)}
function edgeGeom(A,B){const dx=B.nx-A.nx,dy=B.ny-A.ny,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,off=Math.min(36,L*.16);const c=[(A.nx+B.nx)/2-uy*off,(A.ny+B.ny)/2+ux*off];const tr=(P,Q,r)=>{const vx=Q[0]-P[0],vy=Q[1]-P[1],l=Math.hypot(vx,vy)||1;return [P[0]+vx/l*r,P[1]+vy/l*r]};return {p0:tr([A.nx,A.ny],c,24),c,p1:tr([B.nx,B.ny],c,27)}}
function qpt(g,t){const u=1-t;return [u*u*g.p0[0]+2*u*t*g.c[0]+t*t*g.p1[0],u*u*g.p0[1]+2*u*t*g.c[1]+t*t*g.p1[1]]}
function arcPath(r,frac,dir){frac=Math.max(0,Math.min(.92,frac));if(frac<.01)return '';const a0=-Math.PI/2,a1=a0+dir*frac*2*Math.PI;return `M${(r*Math.cos(a0)).toFixed(2)},${(r*Math.sin(a0)).toFixed(2)} A${r},${r} 0 ${frac>.5?1:0} ${dir>0?1:0} ${(r*Math.cos(a1)).toFixed(2)},${(r*Math.sin(a1)).toFixed(2)}`}
function buildNet(){
  const W=S.W;if(!W){$('#nE').innerHTML=$('#nN').innerHTML=$('#nP').innerHTML='';return}netLayout(W);
  $('#nE').innerHTML=`<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9z" fill="#A8C6E8"/></marker></defs>`+W.edges.map(e=>{const g=edgeGeom(W.agents[e.from],W.agents[e.to]);e.g=g;return `<path class="ed" id="ne${e.i}" d="M${g.p0[0]},${g.p0[1]} Q${g.c[0]},${g.c[1]} ${g.p1[0]},${g.p1[1]}" marker-end="url(#arrow)"/>`}).join('');
  $('#nN').innerHTML=W.agents.map((a,i)=>`<g class="nd ${a.k==='force'?'force':''} ${i===W.out?'out':''}" data-agent="${i}" tabindex="0" role="button" aria-label="${h(a.n)}" transform="translate(${a.nx.toFixed(1)},${a.ny.toFixed(1)})">
    <circle class="halo" r="24"/>${a.k==='condition'?'<rect class="body" x="-22" y="-16" width="44" height="32" rx="7"/>':'<circle class="body" r="19"/>'}<path class="ring"/>
    <text class="nv" text-anchor="middle" y="3.5"></text>${(a.n.length>18?wrap2(a.n):[a.n]).map((t,j)=>`<text class="nn" text-anchor="middle" y="${36+j*12}">${h(t)}</text>`).join('')}</g>`).join('');
  NP=[];$('#nP').innerHTML='';for(let k=0;k<60;k++){const c=document.createElementNS(NS,'circle');c.setAttribute('r','2.4');c.setAttribute('opacity','0');$('#nP').appendChild(c);NP.push(c)}
}
function w2(){return S.netSize&&S.netSize[0]<520?20:28}
function updateNet(T){
  const W=S.W,rep=curRep();if(!W)return;const tau=S.tau,t=Math.max(1,Math.min(STEPS,Math.ceil(tau)||1)),nodes=$('#nN').children;
  for(let i=0;i<W.agents.length;i++){const g=nodes[i];if(!g)continue;const a=W.agents[i];g.style.opacity=i<S.reveal.n?'':'0';
    g.classList.toggle('sel',!!(S.detail&&S.detail.type==='agent'&&S.detail.i===i));if(!rep)continue;
    const x=xAt(rep,i,tau),adv=adverse(a,x);const rg=g.querySelector('.ring');rg.setAttribute('d',arcPath(24,Math.min(1,Math.abs(x)*1.1),x>=0?1:-1));rg.setAttribute('stroke',adv?'#C27B14':'#4362B2');
    g.querySelector('.nv').textContent=tau>0.05?fmtO(x):'';
    const dd=Math.abs(rep.X[t][i]-rep.X[t-1][i]),ph=(T*1.3+i*.3)%1,halo=g.querySelector('.halo');halo.setAttribute('stroke',adv?'#C27B14':'#618CD0');halo.setAttribute('opacity',S.playing?(dd*2.4*(1-ph)).toFixed(3):'0');halo.setAttribute('r',(22+ph*12).toFixed(1))}
  let pi=0;
  W.edges.forEach(e=>{const el=$('#ne'+e.i);if(!el)return;el.style.opacity=S.reveal.edge?'':'0';let v=0;if(rep&&tau>0){const c=rep.C[t][e.to].find(c=>c[0]==='a'&&c[3]===e.i);if(c)v=c[2]}
    el.classList.toggle('on',Math.abs(v)>.02);if(!S.reveal.edge||Math.abs(v)<.015||RM)return;const n=Math.min(3,Math.ceil(Math.abs(v)*14)),adv=adverse(W.agents[e.to],v);
    for(let k=0;k<n&&pi<NP.length;k++,pi++){const s=((T*(.25+Math.abs(v)*1.4))+k/n+e.i*.17)%1,[x,y]=qpt(e.g,s);const c=NP[pi];c.setAttribute('cx',x.toFixed(1));c.setAttribute('cy',y.toFixed(1));c.setAttribute('fill',adv?'#C27B14':'#4362B2');c.setAttribute('opacity',(Math.sin(s*Math.PI)*.9).toFixed(2))}});
  for(;pi<NP.length;pi++)NP[pi].setAttribute('opacity','0');
}

/* ---------- Loop ---------- */
let lastT=0;
function frame(now){
  const T=now/1000,dt=Math.min(.1,(now-lastT)/1000||0);lastT=now;
  if(S.camT){const k=Math.min(1,(now-S.camT.t0)/S.camT.d),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,f=S.camT.from,t=S.camT.to;S.cam={x:f.x+(t.x-f.x)*e,y:f.y+(t.y-f.y)*e,w:f.w+(t.w-f.w)*e,h:f.h+(t.h-f.h)*e};applyCam();if(k>=1)S.camT=null}
  if(S.playing&&S.mc){S.tau=Math.min(STEPS,S.tau+dt/1.5);if(S.tau>=STEPS){S.playing=false;renderPlay()}$('#scrub').value=S.tau}
  const st=Math.floor(S.tau+1e-6);if(st!==S.lastStep){S.lastStep=st;renderStep();if(S.detail&&S.detail.type!=='signal')renderSide()}
  if(S.W){drawHeat(T);updateNet(T);applyHlNet()}
  requestAnimationFrame(frame);
}

/* ---------- Journey ---------- */
const EXAMPLES2=[['Pricing','What could happen if we reduce the price of our detergent by 15% in Kano?'],['Expansion','Which Nigerian state should we expand into next?'],['Supply','What could happen to food prices if fuel prices rise?'],['Policy','How could a new telecom regulation affect mobile operators in Kenya?'],['Distribution','What happens if a major distributor stops serving this region?'],['Banking','Should a bank expand agent banking into this community?']];
function go(v){S.screen=v;$('#vAsk').hidden=v!=='ask';$('#vSetup').hidden=v!=='setup';$('#vResults').hidden=v!=='results';$('#newQ').hidden=v==='ask';
  const order=['ask','setup','results'],avail={ask:true,setup:!!S.setup,results:!!S.mc};
  $$('#journey [data-go]').forEach(b=>{const k=b.dataset.go,i=order.indexOf(k),c=order.indexOf(v);b.className=k===v?'now':i<c||avail[k]?'done':'';b.disabled=!avail[k]||k===v;b.querySelector('.n').textContent=(i<c||(avail[k]&&k!==v))?'✓':i+1});
  window.scrollTo&&window.scrollTo(0,0);if(v==='results')setTimeout(()=>{sizeMap();if(S.W){S.netKey='';buildNet()}},40)}
function initAsk(){
  $('#ex').innerHTML=EXAMPLES2.slice(0,4).map(([k,q])=>`<button type="button" class="excard" data-q="${h(q)}"><i>${k}</i><span>${h(q)}</span><b aria-hidden="true">→</b></button>`).join('');
  $('#ask').addEventListener('submit',e=>{e.preventDefault();startSetup($('#q').value.trim()||$('#q').placeholder)});
  $('#q').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#ask').requestSubmit?$('#ask').requestSubmit():startSetup($('#q').value.trim()||$('#q').placeholder)}});
}
/* ---------- Step 2: set up ---------- */
const cloneSpec=sp=>({...sp,events:sp.events.map(e=>[...e]),mods:new Set(sp.mods),notes:[...sp.notes],outcomeRole:sp.outcomeRole?[...sp.outcomeRole]:null});
function startSetup(q){
  const spec=understand(q,S.W?S.W.geo:null);$('#q').value=q;
  S.setup={q,spec,off:new Set(),know:{},biz:'',drop:new Set(),added:[]};
  renderSetup();go('setup');
}
function applySetup(W){const st=S.setup;if(!st)return W;
  W.signals.forEach(s=>{if(st.off.has(s.id))s.on=false});
  W.events=W.events.filter(e=>!st.drop.has(e.id));
  W.assumptions.forEach(a=>{const c=st.know[a.id];if(c&&c!=='unsure'){a.mean=a.mean+(c==='high'?1:-1)*a.sd;a.sd=a.sd*.5;a.userSet=true}});
  if(st.biz){const y=W.agents.find(a=>['you','g_provider','bank'].includes(a.id));if(y)y.n=st.biz}
  W.measure=W.events.length?'effect':'level';return W}
function previewWorld(){const W=buildWorld(cloneSpec(S.setup.spec));return applySetup(W)}
const SECTOR_OPTS=()=>[...Object.entries(SECTORS).filter(([k])=>k!=='generic').map(([k,v])=>[k,v.label]),...Object.entries(GENERIC_NAMES).map(([k,v])=>[k,v.label])];
function geoSelects(g){
  const ctry=Object.values(CTRY).filter(c=>c.id!=='732').sort((a,b)=>a.name.localeCompare(b.name));
  const cid=g.level==='africa'||g.level==='region'?'':g.cid;
  const cOpts=`<option value="africa" ${g.level==='africa'?'selected':''}>All of Africa</option><optgroup label="Detailed coverage">${ctry.filter(c=>FEAT[c.id]).map(c=>`<option value="${c.id}" ${cid===c.id?'selected':''}>${h(c.name)}</option>`).join('')}</optgroup><optgroup label="Limited coverage">${ctry.filter(c=>!FEAT[c.id]).map(c=>`<option value="${c.id}" ${cid===c.id?'selected':''}>${h(c.name)}</option>`).join('')}</optgroup>`;
  const f=cid&&FEAT[cid];const city=g.city||'';
  const ciOpts=f?`<option value="">Whole country</option>${f.cityIds.map(id=>`<option value="${id}" ${city===id?'selected':''}>${h(CITY[id].name)} · ${h(CITY[id].state)}</option>`).join('')}`:'';
  const ds=city?CITY[city].ds:[];const arOpts=ds.length?`<option value="">Whole city</option>${ds.map(d=>`<option value="${d}" ${g.district===d?'selected':''}>${h(DIST[d].name)}</option>`).join('')}`:'';
  return `<div class="row3"><div class="field"><label for="sCountry">Country</label><select class="inp" id="sCountry">${cOpts}</select></div>
   <div class="field"><label for="sCity">City</label><select class="inp" id="sCity" ${f?'':'disabled'}>${ciOpts||'<option>Not available</option>'}</select></div>
   <div class="field"><label for="sArea">Area</label><select class="inp" id="sArea" ${ds.length?'':'disabled'}>${arOpts||'<option>Not available</option>'}</select></div></div>`;
}
function renderSetup(){
  const st=S.setup,sp=st.spec,W=previewWorld();st.W=W;
  $('#setQ').innerHTML=`From your question <q>${h(st.q)}</q> Everything below was filled in for you. Change anything that isn’t right, then run the simulation.`;
  const ranking=sp.type==='ranking';
  const evList=W.events.map(e=>{const isPrice=/^price(Down|Up)/.test(e.key);const idx=sp.events.findIndex(x=>x[0]===e.key&&(x[1]==null||x[1]===e.arg));
    return `<div class="evrow"><div><b>${h(e.label)}</b><div class="sub">${e.custom?'Detected in your question':EVENTS[e.key]&&EVENTS[e.key].mod?'Adds '+h(MODS[EVENTS[e.key].mod].roles.map(r=>ROLES[r].n.toLowerCase()).join(' and '))+' to the market':'Applied from the first step'}</div>${isPrice&&idx>=0?`<input type="range" min="5" max="30" step="5" value="${e.arg}" data-evpct="${idx}" aria-label="Size of price change">`:''}</div><button class="x" ${e.custom?`data-dropcustom="${h(e.id)}"`:`data-rmspec="${idx}"`} aria-label="Remove ${h(e.label)}">×</button></div>`}).join('');
  const addOpts=[...COMPOSER,...((SECTORS[sp.sector]||SECTORS.generic).strategies.flatMap(s=>s[1]))].filter((e,i,a)=>a.findIndex(x=>x[0]===e[0]&&x[1]===e[1])===i);
  const outs=W.agents.map((a,i)=>({a,i})).filter(o=>o.a.k!=='force');
  const sigs=buildWorld(cloneSpec(sp)).signals;
  const hz=sp.horizon;
  $('#form').innerHTML=`
  <div class="fsec"><div><h3>${ranking?'What are you comparing?':'What change are you testing?'}</h3><span class="why">${ranking?'We’ll run the same change in each location and rank them.':'The decision or event the market will react to.'}</span></div><div class="fbody">
   ${evList||'<div class="evrow"><div><b>No change selected</b><div class="sub">We’ll simulate how the market moves under its current signals.</div></div></div>'}
   <select class="addsel" id="sAdd" aria-label="Add a change"><option value="">+ Add a change or event</option>${addOpts.map(([k,a])=>`<option value="${k}|${a==null?'':a}">${h(EVENTS[k].label(a))}</option>`).join('')}</select></div></div>
  <div class="fsec"><div><h3>Where?</h3><span class="why">${ranking?'Pick the area to compare within. We’ll compare the places inside it.':'Location shapes how agents behave: income, infrastructure, competition.'}</span></div><div class="fbody">${geoSelects(sp.geo)}<span class="small muted">Evidence coverage here: <b style="color:var(--ink)">${W.prof.evidence.toFixed(2)}</b> · ${W.prof.evidence>=.6?'good':W.prof.evidence>=.4?'moderate':'limited, so results will be wider'}</span></div></div>
  <div class="fsec"><div><h3>Your market</h3><span class="why">Decides which agents and relationships we build.</span></div><div class="fbody"><div class="row2">
   <div class="field"><label for="sSector">Sector</label><select class="inp" id="sSector">${SECTOR_OPTS().map(([k,l])=>`<option value="${k}" ${sp.sector===k?'selected':''}>${h(l)}</option>`).join('')}</select></div>
   <div class="field"><label for="sBiz">Your business or brand (optional)</label><input class="inp" id="sBiz" value="${h(st.biz)}" placeholder="${h(W.agents[W.out].n)}"></div></div>
   ${sp.sector==='fmcg'?`<div class="field"><label for="sProd">Product</label><input class="inp" id="sProd" value="${h(sp.product||'')}" placeholder="e.g. detergent, noodles, cooking oil"></div>`:''}</div></div>
  <div class="fsec"><div><h3>What should we measure?</h3><span class="why">The result we report at the end.</span></div><div class="fbody"><select class="inp" id="sOut">${outs.map(o=>`<option value="${o.a.id}" ${o.i===W.out?'selected':''}>${h(o.a.n)} · ${h(o.a.m.toLowerCase())}</option>`).join('')}</select></div></div>
  <div class="fsec"><div><h3>Time period</h3><span class="why">How far ahead to simulate, in six steps.</span></div><div class="fbody"><div class="seg" id="sHz">${[4,8,12,26].map(n=>`<button data-hz="${n}" aria-pressed="${hz===n&&sp.stepUnit!=='Mo'}">${n} weeks</button>`).join('')}</div></div></div>
  <div class="fsec"><div><h3>What do you already know?</h3><span class="why">Optional. Where you’re not sure, we keep a wide range and flag it as unknown.</span></div><div class="fbody">${W.assumptions.map(a=>{const c=st.know[a.id]||'unsure';return `<div class="know"><div><b>${h(a.label)}</b><span>${h(a.unknown)}</span></div><div class="seg sm">${[['low','Lower'],['unsure','Not sure'],['high','Higher']].map(([v,l])=>`<button data-know="${a.id}" data-val="${v}" aria-pressed="${c===v}">${l}</button>`).join('')}</div></div>`}).join('')}</div></div>
  <div class="fsec"><div><h3>Signals to include</h3><span class="why">Evidence Verisavo found for this market. Untick any you don’t trust.</span></div><div class="fbody"><div>${sigs.map(s=>`<label class="sigrow"><input type="checkbox" data-sig="${h(s.id)}" ${st.off.has(s.id)?'':'checked'}><span>${h(s.title)}<small>${h(s.src)} · confidence ${s.conf.toFixed(2)}${s.client?' · your private data':''}</small></span><span class="st ${s.state}">${s.state}</span></label>`).join('')}</div></div></div>
  <div class="fsec"><div><h3>Anything else?</h3><span class="why">Add context in your own words, such as another event or a competitor move.</span></div><div class="fbody"><textarea class="inp" id="sMore" placeholder="e.g. Fuel prices are rising and a competitor may enter with a cheaper product."></textarea><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn sm" id="sMoreBtn">Add to setup</button>${st.added.length?`<span class="added">Added: ${h(st.added.join(', '))}</span>`:''}</div></div></div>`;
  renderPreview(W);
}
function setupSentence(W){const sp=S.setup.spec,out=W.agents[W.out],ev=W.events.map(e=>e.label).join(' + ');
  return sp.type==='ranking'?`Compare <b>${h(rankCandidates(sp.geo).length)} locations</b> in <b>${h(geoLabel(sp.geo))}</b>${ev?` for <b>${h(ev)}</b>`:''}, measuring <b>${h(out.m.toLowerCase())}</b> over <b>${sp.horizon} weeks</b>.`
  :`${ev?`Test <b>${h(ev)}</b>`:'Watch the market'} in <b>${h(geoLabel(W.geo))}</b> over <b>${sp.horizon} ${sp.stepUnit==='Mo'?'months':'weeks'}</b>, measuring <b>${h(out.n)}: ${h(out.m.toLowerCase())}</b>.`}
function renderPreview(W){
  const sp=S.setup.spec,g=sp.geo,cid=g.cid,pos=g.level==='africa'?null:geoPos(g);
  const open=W.assumptions.filter(a=>!a.userSet).length;
  $('#preview').innerHTML=`<div class="pv-sec"><span class="label">You’ll simulate</span><p class="pv-sum" style="margin:0">${setupSentence(W)}</p>
   <svg class="mapmini" viewBox="0 0 850 790" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${AFRICA.map(c=>`<path class="${c.id===cid?'on':''}" d="${c.d}"/>`).join('')}${pos?`<circle cx="${pos[0]}" cy="${pos[1]}" r="14" fill="#1F273F"/><circle cx="${pos[0]}" cy="${pos[1]}" r="28" fill="none" stroke="#1F273F" stroke-width="3" opacity=".3"/>`:''}</svg></div>
  <div class="pv-sec"><div class="stats"><div><b>${W.agents.length}</b><span>agents</span></div><div><b>${W.signals.filter(s=>s.on).length}</b><span>signals</span></div><div><b>${open}</b><span>unknowns</span></div></div>
   <span class="label" style="margin-top:4px">Market we’ll build</span><div class="chips">${W.agents.map((a,i)=>`<span class="chip ${i===W.out?'out':/Added/.test(a.why||'')?'new':''}">${h(a.n)}</span>`).join('')}</div></div>
  <div class="pv-sec"><div style="display:flex;justify-content:space-between" class="small"><span class="muted">Evidence coverage</span><b>${W.prof.evidence.toFixed(2)}</b></div><div class="meter"><span style="width:${W.prof.evidence*100}%"></span></div>
   ${sp.notes.length?`<span class="small pr">${h(sp.notes.map(n=>n.replace(/\.$/,'')).join('. '))}.</span>`:''}</div>
  <div class="pv-sec"><button class="btn pri lg" id="runBtn">Run simulation</button><span class="small muted" style="text-align:center">200 runs · takes a few seconds</span><button class="btn ghost sm" data-go="ask">Back to question</button></div>`;
}
function setupChange(fn){fn(S.setup.spec);renderSetup()}
function bindSetup(){
  document.addEventListener('change',e=>{if(S.screen!=='setup')return;const t=e.target,st=S.setup;
    if(t.id==='sCountry')return setupChange(sp=>{sp.geo=t.value==='africa'?mkGeo('africa',{}):FEAT[t.value]?mkGeo('city',{city:FEAT[t.value].cityIds[0]}):mkGeo('country',{cid:t.value});if(sp.type==='ranking'&&t.value!=='africa')sp.geo=mkGeo('country',{cid:t.value});sp.notes=sp.notes.filter(n=>!/^(No location|No geography|“This”)/.test(n))});
    if(t.id==='sCity')return setupChange(sp=>{sp.geo=t.value?mkGeo('city',{city:t.value}):mkGeo('country',{cid:sp.geo.cid})});
    if(t.id==='sArea')return setupChange(sp=>{sp.geo=t.value?mkGeo('district',{district:t.value}):mkGeo('city',{city:sp.geo.city})});
    if(t.id==='sSector')return setupChange(sp=>{sp.sector=t.value;if(t.value!=='fmcg')sp.product=null;sp.outcomeRole=null;sp.notes=sp.notes.filter(n=>!/^No sector/.test(n));st.know={}});
    if(t.id==='sOut')return setupChange(sp=>{sp.outcomeRole=[t.value]});
    if(t.id==='sBiz'){st.biz=t.value.trim();return renderSetup()}
    if(t.id==='sProd')return setupChange(sp=>{sp.product=t.value.trim().toLowerCase()||null});
    if(t.id==='sAdd'&&t.value){const [k,a]=t.value.split('|');return setupChange(sp=>{sp.events.push(a===''?[k]:[k,+a])})}
    if(t.dataset.evpct!=null)return setupChange(sp=>{sp.events[+t.dataset.evpct][1]=+t.value});
    if(t.dataset.sig){t.checked?st.off.delete(t.dataset.sig):st.off.add(t.dataset.sig);return renderPreview(previewWorld())}
  });
  document.addEventListener('click',e=>{if(S.screen!=='setup')return;const t=e.target;let b;
    if((b=t.closest('[data-rmspec]'))){const i=+b.dataset.rmspec;return setupChange(sp=>{if(i>=0)sp.events.splice(i,1)})}
    if((b=t.closest('[data-dropcustom]'))){S.setup.drop.add(b.dataset.dropcustom);return renderSetup()}
    if((b=t.closest('[data-hz]')))return setupChange(sp=>{sp.horizon=+b.dataset.hz;sp.stepUnit='Wk';sp.notes=sp.notes.filter(n=>!/^No time/.test(n))});
    if((b=t.closest('[data-know]'))){S.setup.know[b.dataset.know]=b.dataset.val;return renderSetup()}
    if(t.id==='sMoreBtn'){const txt=$('#sMore').value.trim();if(!txt)return;const extra=understand(txt,S.setup.spec.geo);const sp=S.setup.spec,added=[];
      extra.events.forEach(ev=>{if(ev[0]==='launch'&&sp.events.length)return;if(!sp.events.some(x=>x[0]===ev[0])){sp.events.push(ev);added.push(EVENTS[ev[0]].label(ev[1]))}});
      extra.mods.forEach(m=>sp.mods.add(m));if(extra.product&&!sp.product)sp.product=extra.product;
      if(!extra.notes.some(n=>/^(No location|No geography|“This”)/.test(n))&&JSON.stringify(extra.geo)!==JSON.stringify(sp.geo)){sp.geo=extra.geo;added.push(geoShort(extra.geo))}
      sp.q=sp.q+' '+txt;S.setup.added.push(...(added.length?added:['context noted']));renderSetup();toast(added.length?`Added ${added.join(', ')}`:'Noted. No new event was detected.');return}
    if(t.id==='runBtn'){runSim();return}
  });
}
/* ---------- Step 3: run ---------- */
async function runSim(){
  if(S.busy)return;S.busy=true;const spec=cloneSpec(S.setup.spec);
  Object.assign(S,{spec,W:null,mc:null,rank:null,rankSel:0,detail:null,tau:0,playing:false,decision:null,inv:{},sens:null,cmp:null,path:'A',lastStep:-1,reveal:{n:0,sig:0,edge:0},hl:null,deploy:{},changes:[],openGap:null,agentQ:null,tabI:'signals'});
  go('results');$('#evBanner').hidden=true;$('#changed').hidden=true;$('#hlBar').hidden=true;$('#exhibits').innerHTML='';$('#takeaway').innerHTML='';$('#boundary').innerHTML='';$('#nextActs').innerHTML='';$('#dCmp').open=false;$('#simHere').hidden=true;$('#side').innerHTML='';$('#below').innerHTML='';$('#resTitle').textContent=S.setup.q;$('#resMeta').innerHTML='';
  await sleep(60);sizeMap();buildNet();renderPlay();
  if(!S.nav)S.nav=mkGeo('africa',{});if(!S.cam){S.cam=fitBB(bbFor(mkGeo('africa',{})));applyCam()}
  const steps=['Finding the market','Connecting evidence','Placing market agents','Simulating 200 possible futures'];if(spec.type==='ranking')steps.splice(3,0,'Comparing locations');
  const sub=[];$('#build').hidden=false;
  const draw=k=>{$('#buildCard').innerHTML=`<h3>Building the market</h3>`+steps.map((s,i)=>`<div class="bstep ${i<k?'done':i===k?'on':''}"><i>${i<k?'✓':i===k?'›':'·'}</i><span>${h(s)}${sub[i]?`<small>${h(sub[i])}</small>`:''}</span></div>`).join('')};
  sub[0]=geoLabel(spec.geo);draw(0);navTo(fullGeo(spec.geo));await sleep(700);
  let W=applySetup(buildWorld(spec));S.W=W;
  sub[1]=`${W.signals.filter(s=>s.on).length} signals from ${new Set(W.signals.map(s=>s.src)).size} kinds of source`;draw(1);renderMapLayers();await sleep(350);
  sub[2]=W.agents.map(a=>a.n).join(', ');draw(2);buildNet();S.reveal.sig=1;
  for(let i=1;i<=W.agents.length;i++){S.reveal.n=i;await sleep(70)}S.reveal.edge=1;await sleep(220);
  let k=3;
  if(spec.type==='ranking'){const c=rankCandidates(spec.geo);sub[3]=`${c.length} locations`;draw(3);await sleep(50);S.rank=rankRun(spec,80);const g=S.rank.findIndex(r=>!r.thin);S.rankSel=g<0?0:g;W=applySetup(buildWorld(spec,S.rank[S.rankSel].geo));S.W=W;buildNet();k=4}
  draw(k);await sleep(50);simulate(true);$('#build').hidden=true;
  remember('Simulation',`${h(S.setup.q)} → ${h(geoLabel(W.geo))}. ${W.agents.length} agents, ${W.signals.filter(s=>s.on).length} signals.`);
  if(spec.type==='strategy'){S.cmpMode='int';$('#dCmp').open=true;renderCompare()}
  S.busy=false;S.tau=0;S.playing=!RM;renderPlay();go('results');
}
function renderResHeader(){
  const W=S.W,sp=S.spec,out=W.agents[W.out];
  $('#resTitle').textContent=S.setup?S.setup.q:sp.q;
  const open=W.assumptions.filter(a=>!a.verified&&!a.userSet).length;
  $('#resMeta').innerHTML=[...W.events.map(e=>e.label),geoLabel(W.geo),`${sp.horizon} ${sp.stepUnit==='Mo'?'months':'weeks'}`,`Measuring ${out.m.toLowerCase()}`].map(x=>`<span class="chip">${h(x)}</span>`).join('')+(open?`<span class="chip" style="border-style:dashed">${open} unknown${open>1?'s':''}</span>`:'');
}

function simulate(quiet,keepPath){
  const W=S.W;W._ext=null;const prev=S.path;S.mc=monteCarlo(W,200);S.sens=null;S.cmp=null;
  const best=S.mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0];S.path=keepPath&&S.mc.paths.find(p=>p.id===prev)?prev:best.id;
  if(!quiet)remember('Re-run',`${W.events.map(e=>h(e.label)).join(', ')||'No intervention'}. Most likely: ${h(best.title)} (${Math.round(best.prob*100)}%).`);
  renderAll();
}
function renderAll(){renderResHeader();renderMapLayers();buildNet();renderCrumbs();renderTicks();renderStep();renderScenario();renderSide();if($('#dEvi').open)renderEvidence();if($('#dMem').open)renderMemory();if($('#dCmp').open)renderCompare()}

/* ---------- Player ---------- */
function stepIdx(){return Math.max(0,Math.min(STEPS,Math.floor(S.tau+1e-6)))}
function stepWhen(t){const d=S.spec.horizon/STEPS;return t===0?'Now':`${S.spec.stepUnit==='Mo'?'Month':'Week'} ${Math.max(1,Math.round(t*d))}`}
function renderTicks(){$('#ticks').innerHTML=Array.from({length:STEPS+1},(_,t)=>`<span data-t="${t}">${t===0?'Now':stepWhen(t).replace('Week ','W').replace('Month ','M')}</span>`).join('')}
function renderPlay(){const b=$('#bPlay');b.textContent=S.playing?'❚❚':'▶';b.setAttribute('aria-label',S.playing?'Pause':'Play')}
function renderStep(){
  if(!S.mc)return;const t=stepIdx(),W=S.W,rep=curRep();
  $$('#ticks span').forEach(s=>s.classList.toggle('on',+s.dataset.t===t));
  $('#stepLbl').innerHTML=`${STEP_NAMES[t]}<small>${stepWhen(t)}</small>`;
  if(t===0){$('#stepNote').innerHTML=`${W.signals.filter(s=>s.on).length} signals are active in the market. Press play to watch the agents respond.`;return}
  const mv=W.agents.map((a,i)=>({a,i,d:rep.X[t][i]-rep.X[t-1][i]})).filter(m=>Math.abs(m.d)>.01).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).slice(0,2);
  const acts=rep.acts.filter(a=>a.t===t).map(a=>`<b>Turning point:</b> ${h(a.text)}.`);
  const parts=mv.map(m=>{const top=rep.C[t][m.i].filter(c=>c[0]!=='self').sort((a,b)=>Math.abs(b[2])-Math.abs(a[2]))[0];return `<b>${h(m.a.n)}</b> <span class="${adverse(m.a,m.d)?'pr':'up'}">${arrow(m.d)}</span> ${h(m.a.m.toLowerCase())}${top?`, driven by ${h(srcName(W,top).toLowerCase())}`:''}`});
  $('#stepNote').innerHTML=[...acts,parts.join(' · ')].filter(Boolean).join(' ')||'The market holds steady this step.';
}

/* ---------- Scenario ---------- */
function renderScenario(){
  const W=S.W;
  $('#scenario').innerHTML=`<span class="label">Scenario</span>`+(W.events.length?W.events.map(e=>`<span class="echip">${h(e.label)}<button data-rmev="${h(e.id)}" aria-label="Remove ${h(e.label)}">×</button></span>`).join(''):'<span class="muted" style="font-size:12.5px">Current signals only</span>')+
  `<select id="addEv" aria-label="Add an event"><option value="">+ Add an event</option>${COMPOSER.map(([k,a])=>`<option value="${k}|${a==null?'':a}">${h(EVENTS[k].label(a))}</option>`).join('')}</select>`;
}

/* ---------- Side column ---------- */
function renderSide(){
  const W=S.W,mc=S.mc;if(!mc)return;const out=W.agents[W.out],best=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0];
  const sens=ensureSens(),gap=sens.find(s=>!s.a.verified&&!s.a.userSet),st=gap?S.inv[gap.a.id]:null;
  const strategies=(SECTORS[S.spec.sector]||SECTORS.generic).strategies.map(s=>s[0]);
  let html=S.detail?detailHTML():'';
  if(S.rank)html+=`<div class="blk"><h3>Locations compared</h3><div>${S.rank.map((r,i)=>`<button class="rk ${i===S.rankSel?'sel':''}" data-rank="${i}"><span class="n">${i+1}</span><span>${h(r.label)}${r.thin?' <span class="muted" style="font-size:11.5px">· limited evidence</span>':''}</span><span class="v">${fmtO(r.mean)}</span></button>`).join('')}</div><span class="muted" style="font-size:12px">Showing ${h(S.rank[S.rankSel].label)}. Select another to load it.</span></div>`;
  html+=`<div class="blk"><span class="label">${h(out.n)} · ${h(out.m)}</span><span class="big num">${fmtO(mc.p50)}</span>
   <span class="muted" style="font-size:13px">${mc.eff?'Likely effect after':'Likely change after'} ${S.spec.horizon} ${S.spec.stepUnit==='Mo'?'months':'weeks'}${mc.eff?', compared with doing nothing':''}. Most runs fall between ${fmtO(mc.p10)} and ${fmtO(mc.p90)}.</span>${miniChart(mc)}</div>`;
  html+=`<div class="blk"><h3>How it could play out</h3><div class="paths">${mc.paths.slice().sort((a,b)=>b.prob-a.prob).map(p=>`<button class="prow ${p.id===S.path?'sel':''}" data-path="${p.id}"><span class="id">${p.id}</span><span class="t">${h(p.title)}</span><span class="pct">${Math.round(p.prob*100)}%</span><span class="bar"><span style="width:${Math.round(p.prob*100)}%"></span></span></button>`).join('')}</div><span class="muted" style="font-size:12px">Share of ${mc.N} simulated runs. Select one to play it. These are possibilities, not predictions.</span></div>`;
  html+=`<div class="blk"><h3>Your decision</h3><div class="opts">${[...strategies,'Investigate first','Do not proceed'].map(d=>`<button data-decide="${h(d)}" class="${S.decision===d?'chosen':''}">${h(d)}</button>`).join('')}</div><span class="muted" style="font-size:12px">${S.decision?`Recorded in Market Memory: ${h(S.decision)}.`:'Verisavo supports the decision. You make it.'}</span></div>`;
  $('#side').innerHTML=html;
  let bl='';
  bl+=`<div class="blk"><h3>What happened</h3><p style="margin:0;font-size:13.5px">${h(narrative(W,curPath()))}</p></div>`;
  if(gap)bl+=`<div class="blk"><h3>Biggest unknown</h3><p style="margin:0;font-size:13.5px">${h(gap.a.unknown)}</p><span class="muted" style="font-size:12.5px">It could move the result between ${fmtO(Math.min(gap.lo,gap.hi))} and ${fmtO(Math.max(gap.lo,gap.hi))}. Verisavo would check it with: ${h(gap.a.method.toLowerCase())}, ${gap.a.n} observations.</span>
    ${st?`<ul class="prog">${INV.map((p,i)=>`<li class="${i<st.step||st.done?'done':i===st.step?'now':''}">${i<st.step||st.done?'✓':i===st.step?'›':'·'} ${p}${i===1&&st.step>=1?` <span class="mono">${Math.min(gap.a.n,st.recv||0)}/${gap.a.n}</span>`:''}</li>`).join('')}</ul>`:`<button class="btn" data-investigate="${gap.a.id}" style="justify-self:start">Investigate this</button>`}</div>`;
  const doneInv=Object.entries(S.inv).filter(([,v])=>v.done);
  if(doneInv.length)bl+=`<div class="blk"><h3>Verified since you asked</h3>${doneInv.map(([id,v])=>{const a=W.assumptions.find(x=>x.id===id);return a?`<div class="finding"><b>${h(a.label)}</b><span>${h(a.finding.text)}</span><span class="muted">${h(v.change)}</span></div>`:''}).join('')}</div>`;
  $('#below').innerHTML=bl;
}
function miniChart(mc){
  const b=mc.band,w=320,hh=84,all=[...b.flat(),0],mn=Math.min(...all),mx=Math.max(...all),sy=v=>hh-14-(v-mn)/((mx-mn)||1)*(hh-24),sx=t=>4+t/STEPS*(w-12);
  const area=b.map((q,t)=>`${sx(t)},${sy(q[2])}`).join(' ')+' '+b.slice().reverse().map((q,i)=>`${sx(STEPS-i)},${sy(q[0])}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${hh}" width="100%" role="img" aria-label="Outcome over time with range"><line x1="4" x2="${w-8}" y1="${sy(0)}" y2="${sy(0)}" stroke="#CCDDF1" stroke-dasharray="3 3"/><polygon points="${area}" fill="#E3EBF8"/><polyline fill="none" stroke="#4362B2" stroke-width="2" points="${b.map((q,t)=>`${sx(t)},${sy(q[1])}`).join(' ')}"/><circle cx="${sx(STEPS)}" cy="${sy(b[STEPS][1])}" r="3" fill="#1F273F"/><text x="4" y="${hh-1}" font-size="9.5" fill="#8A94AE">Now</text><text x="${w-8}" y="${hh-1}" font-size="9.5" fill="#8A94AE" text-anchor="end">${stepWhen(STEPS)}</text></svg>`;
}
function narrative(W,p){
  const rep=p.rep,seen=new Set(),groups=[];
  const ph=(i,x)=>{const a=W.agents[i],v=`${x>0?'up':'down'} ${fmtO(x).replace(/^[+−]/,'')}`;return a.k==='actor'?`${a.m.toLowerCase()} for ${a.n.toLowerCase()} ${v}`:`${a.n.toLowerCase()} ${v}`};
  for(let t=1;t<=STEPS&&groups.length<2;t++){const items=[];W.agents.forEach((a,i)=>{if(seen.has(i)||i===W.out)return;if(Math.abs(rep.X[t][i])>.09){seen.add(i);items.push(ph(i,rep.X[t][i]))}});const acts=rep.acts.filter(a=>a.t===t).map(a=>a.text.toLowerCase());if(items.length||acts.length)groups.push({t,items:items.slice(0,2),acts})}
  const join=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
  let s=groups.map(g=>`By ${stepWhen(g.t).toLowerCase()}, ${join(g.items)}${g.acts.length?(g.items.length?'; then ':'')+join(g.acts):''}.`).join(' ');
  return (s+` On this path, ${W.agents[W.out].n.toLowerCase()} ends ${fmtO(p.mean)}${S.mc.eff?' versus doing nothing':''}.`).trim();
}
function ensureSens(){if(!S.sens)S.sens=sensitivity(S.W,40);return S.sens}
function detailHTML(){
  const W=S.W,d=S.detail,rep=curRep(),t=Math.max(1,stepIdx());
  if(d.type==='agent'){const i=d.i,a=W.agents[i],x=rep.X[t][i],role=ROLES[a.id];
    const cc=rep.C[t][i].filter(c=>c[0]!=='self').sort((p,q)=>Math.abs(q[2])-Math.abs(p[2]));
    const sigs=W.signals.filter(s=>s.tg.some(g=>g[0]===i)),conf=sigs.length?sigs.reduce((s,x)=>s+x.conf,0)/sigs.length:W.prof.evidence;
    const react=Math.abs(x)>.05?((x>0?role.up:role.dn)||`${a.m} ${x>0?'increases':'decreases'}`):'No change in behaviour yet.';
    return `<div class="detail"><div class="detail-h"><div><span class="label">${a.k==='actor'?'Market agent':a.k==='condition'?'Market condition':'Outside force'} · ${stepWhen(t)}</span><h3>${h(a.n)}</h3></div><button class="x" data-close aria-label="Close">×</button></div>
     <dl class="kv"><dt>Now</dt><dd>${h(a.m)} <b class="${adverse(a,x)?'pr':'up'}">${fmtO(x)}</b></dd><dt>Main pressure</dt><dd>${cc[0]?h(srcName(W,cc[0])):'None yet'}</dd><dt>Likely reaction</dt><dd>${h(react)}</dd><dt>Evidence</dt><dd>${sigs.length?`${sigs.reduce((s,x)=>s+x.frequency,0)} observations, ${confWord(conf).toLowerCase()} confidence`:'Follows its relationships and assumptions'}</dd></dl>
     <span class="label">Why</span>${chainHTML(W,trace(W,rep,i,t))}</div>`}
  if(d.type==='why'){const ch=trace(W,rep,W.out,t);return `<div class="detail"><div class="detail-h"><div><span class="label">${stepWhen(t)}</span><h3>Why ${h(W.agents[W.out].n.toLowerCase())} moved</h3></div><button class="x" data-close aria-label="Close">×</button></div>${chainHTML(W,ch)}<span class="muted" style="font-size:12px">Each line follows the strongest cause back to the evidence that started it. Tap an agent for its own chain.</span></div>`}
  const s=W.signals[d.k];
  return `<div class="detail"><div class="detail-h"><div><span class="label">Signal</span><h3>${h(s.title)}</h3></div><button class="x" data-close aria-label="Close">×</button></div>
   <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="st ${s.state}">${s.state}</span><span class="st Inference" style="background:var(--tint);color:var(--muted)">${s.life}</span></div>
   <dl class="kv"><dt>Source</dt><dd>${h(s.src)}${s.client?' · your private data':''}</dd><dt>Where</dt><dd>${h(s.places.map(p=>W.placeIdx[p]?.name).filter(Boolean).join(', '))}</dd><dt>Confidence</dt><dd>${s.conf.toFixed(2)} · ${confWord(s.conf)}</dd><dt>Last seen</dt><dd>${s.freshness} day${s.freshness>1?'s':''} ago, ${s.frequency} observations</dd><dt>Affects</dt><dd>${h(s.tg.map(x=>W.agents[x[0]].n).join(', '))}</dd>${s.contradictions?`<dt>Contradicted by</dt><dd>${h(W.signals.find(x=>x.id===s.contraWith)?.title||'')}</dd>`:''}</dl>
   <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" data-sigtoggle="${d.k}" ${s.on?'checked':''}> Include this signal</label></div>`;
}
function chainHTML(W,chain){return `<ul class="chain">${chain.map(c=>{if(c.type==='a'){const a=W.agents[c.i];return `<li><i></i><span><b style="font-weight:500">${h(a.n)}</b> ${arrow(c.x)} ${fmtO(c.x)}${c.edge?`<small>via ${h(c.edge.label.toLowerCase())}</small>`:''}</span></li>`}
  const s=c.type==='s'?W.signals[c.c[1]]:null;return `<li class="src"><i></i><span><b style="font-weight:500">${h(srcName(W,c.c))}</b>${s?`<small>${s.state} · ${s.src} · confidence ${s.conf.toFixed(2)}</small>`:c.type==='e'?'<small>Your scenario</small>':c.type==='as'?'<small>Assumption, evidence incomplete</small>':'<small>Agent action</small>'}</span></li>`}).join('')}</ul>`}

/* ---------- Investigate ---------- */
const INV=['Search existing sources','Ask SavoScouts for field evidence','Verify the evidence','Update agents and re-run'];
async function investigate(id){
  const W=S.W,a=W.assumptions.find(x=>x.id===id);if(!a||S.inv[id])return;const before=S.mc;
  const st=S.inv[id]={step:0,recv:0};remember('Investigation',h(a.unknown));
  for(let i=0;i<INV.length;i++){st.step=i;renderSide();
    if(i===1){for(let k=0;k<=a.n;k+=Math.max(1,Math.ceil(a.n/8))){st.recv=k;renderSide();await sleep(120)}st.recv=a.n}else await sleep(600)}
  a.mean=a.finding.mean;a.sd=a.finding.sd;a.verified=true;a.state='Inference';
  simulate(true,true);const after=S.mc;st.done=true;st.change=`Range was ${fmtO(before.p10)} to ${fmtO(before.p90)}, now ${fmtO(after.p10)} to ${fmtO(after.p90)}.`;
  remember('Verified',`${h(a.finding.text)} ${h(st.change)}`);renderSide();toast('Evidence verified. Simulation updated.');
}

/* ---------- Folded sections ---------- */
function renderEvidence(){
  const W=S.W;const warn=[];if(W.prof.evidence<.4)warn.push(`Evidence for ${geoShort(W.geo)} is limited, so ranges are wider.`);W.signals.filter(s=>s.life==='contested').forEach(s=>warn.push(`“${s.title}” is contradicted by other evidence.`));
  $('#evi').innerHTML=`${warn.length?`<p style="margin:0;color:var(--pressure);font-size:13px">${h(warn.join(' '))}</p>`:''}<div class="cols"><div><span class="label">Signals</span><div class="list">${W.signals.map((s,k)=>`<button class="li" data-signal="${k}" style="${s.on?'':'opacity:.5'}"><span class="r1"><b>${h(s.title)}</b><span class="st ${s.state}">${s.state}</span></span><small>${h(s.src)} · confidence ${s.conf.toFixed(2)} · ${s.life}</small></button>`).join('')}</div></div>
  <div><span class="label">Assumptions</span><div class="list">${W.assumptions.map(a=>`<div class="li"><span class="r1"><b>${h(a.label)}</b><span class="st ${a.verified?'Inference':a.userSet?'User':'Assumption'}">${a.verified?'Verified':a.userSet?'Your input':'Assumption'}</span></span><small>${h(a.verified?a.finding.text:a.unknown)}</small></div>`).join('')}</div>
  <span class="label" style="display:block;margin-top:14px">Agents in this market</span><div class="list">${W.agents.map((a,i)=>`<button class="li" data-agent="${i}"><span class="r1"><b>${h(a.n)}</b></span><small>${h(a.why||'')}</small></button>`).join('')}</div></div></div>`;
}
function renderCompare(){
  const W=S.W,spec=S.spec;
  if(!S.cmp||S.cmp.mode!==S.cmpMode){
    if(S.cmpMode==='geo'){const cur=W.geo;let alts=[];if(cur.city)alts=FEAT[cur.cid].cityIds.filter(id=>id!==cur.city).slice(0,2).map(id=>mkGeo('city',{city:id}));else alts=Object.keys(FEAT).filter(c=>c!==cur.cid).slice(0,2).map(cid=>mkGeo('country',{cid}));S.cmp={mode:'geo',geos:[cur,...alts]}}
    else S.cmp={mode:'int'}
    const extra=W.events.filter(e=>e.src!=='question').map(e=>[e.key,e.arg]);
    if(S.cmpMode==='geo')S.cmp.res=S.cmp.geos.map(g=>{const W2=buildWorld(spec,g);extra.forEach(e=>addEvent(W2,e,'composer'));return {name:geoShort(g),W:W2,mc:monteCarlo(W2,90)}});
    else S.cmp.res=[{name:'Your scenario',W,mc:S.mc},...(SECTORS[spec.sector]||SECTORS.generic).strategies.map(([name,evs])=>{const W2=buildWorld({...spec,events:evs,mods:new Set(spec.mods)},W.geo);return {name,W:W2,mc:monteCarlo(W2,90)}})];
  }
  const opts=[];Object.entries(FEAT).forEach(([cid,f])=>{opts.push([JSON.stringify(mkGeo('country',{cid})),CTRY[cid].name]);f.cityIds.forEach(id=>opts.push([JSON.stringify(mkGeo('city',{city:id})),`${CITY[id].name}, ${CTRY[cid].name}`]))});
  $('#cmp').innerHTML=`<div class="cmp-h"><div class="seg"><button data-cmpmode="int" aria-pressed="${S.cmpMode==='int'}">Strategies</button><button data-cmpmode="geo" aria-pressed="${S.cmpMode==='geo'}">Locations</button></div>
   ${S.cmpMode==='geo'?S.cmp.geos.map((g,i)=>`<select data-cmpgeo="${i}" aria-label="Location ${i+1}">${opts.map(([v,l])=>`<option value='${v}' ${v===JSON.stringify(g)?'selected':''}>${h(l)}</option>`).join('')}${opts.some(o=>o[0]===JSON.stringify(g))?'':`<option value='${JSON.stringify(g)}' selected>${h(geoShort(g))}</option>`}</select>`).join(''):''}</div>
   <div class="mults">${S.cmp.res.map(r=>{const b=r.mc.paths.slice().sort((x,y)=>y.prob-x.prob)[0];return `<div class="mult"><h4>${h(r.name)}</h4><span class="v num">${fmtO(r.mc.p50)}</span><span class="muted" style="font-size:12px">${h(r.W.agents[r.W.out].m)} · range ${fmtO(r.mc.p10)} to ${fmtO(r.mc.p90)}</span>${miniChart(r.mc)}<span style="font-size:12.5px">Most likely: ${h(b.title)} (${Math.round(b.prob*100)}%)</span></div>`}).join('')}</div>`;
}
function renderMemory(){$('#mem').innerHTML=`<ul class="mem">${S.memory.map(m=>`<li><span class="t">${m.t}</span><span class="k">${h(m.kind)}</span><span>${m.text}</span></li>`).join('')||'<li><span></span><span></span><span class="muted">Nothing yet.</span></li>'}</ul>`}

/* ---------- Events ---------- */
function bind(){
  document.addEventListener('click',e=>{const t=e.target;let b;
    if((b=t.closest('[data-q]'))){startSetup(b.dataset.q);return}
    if((b=t.closest('[data-go]'))){go(b.dataset.go);return}
    if(t.closest('#home')||t.closest('#newQ')){$('#q').value='';go('ask');$('#q').focus();return}
    if(t.id==='editSetup'){go('setup');return}
    if(S.screen!=='results')return;
    if((b=t.closest('[data-agent]'))){S.detail={type:'agent',i:+b.dataset.agent};S.playing=false;renderPlay();if(S.tau<1){S.tau=1;$('#scrub').value=1}renderSide();window.innerWidth<1000&&$('#side').scrollIntoView({behavior:RM?'auto':'smooth'});return}
    if((b=t.closest('[data-signal]'))){S.detail={type:'signal',k:+b.dataset.signal};renderSide();$('#side').scrollIntoView({behavior:RM?'auto':'smooth',block:'nearest'});return}
    if(t.closest('[data-close]')){S.detail=null;renderSide();return}
    if((b=t.closest('[data-crumb]'))){const c=JSON.parse(b.dataset.crumb);const g=mkGeo(c.level,c);navTo(g);if(g.level!=='africa'&&g.level!=='region')offerSim(g);return}
    if((b=t.closest('[data-v]'))){S.view=b.dataset.v;$$('#viewSeg button').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#stageBody').className='stage-body'+(S.view==='both'?'':' v-'+S.view);setTimeout(sizeMap,30);return}
    if((b=t.closest('[data-path]'))){S.path=b.dataset.path;S.tau=0;S.playing=true;renderPlay();renderSide();return}
    if((b=t.closest('[data-rmev]'))){S.W.events=S.W.events.filter(x=>x.id!==b.dataset.rmev);S.tau=0;simulate();S.playing=true;renderPlay();return}
    if((b=t.closest('[data-investigate]'))){investigate(b.dataset.investigate);return}
    if((b=t.closest('[data-rank]'))){S.rankSel=+b.dataset.rank;S.W=applySetup(buildWorld(S.spec,S.rank[S.rankSel].geo));S.tau=0;S.detail=null;simulate(true);S.playing=true;renderPlay();return}
    if((b=t.closest('[data-decide]'))){S.decision=b.dataset.decide;remember('Decision',h(S.decision));renderSide();toast('Decision recorded');return}
    if((b=t.closest('[data-cmpmode]'))){S.cmpMode=b.dataset.cmpmode;S.cmp=null;renderCompare();return}
  });
  document.addEventListener('change',e=>{const t=e.target;if(S.screen!=='results')return;
    if(t.id==='addEv'&&t.value){const [k,a]=t.value.split('|');const n0=S.W.agents.length;const ev=addEvent(S.W,[k,a===''?undefined:+a],'composer');if(!ev){toast('That event has no counterpart in this market');renderScenario();return}const added=S.W.agents.slice(n0).map(x=>x.n);toast(added.length?`${ev.label} added. New agents: ${added.join(', ')}`:`${ev.label} added`);S.tau=0;simulate();S.playing=true;renderPlay();return}
    if(t.dataset.sigtoggle!=null){S.W.signals[+t.dataset.sigtoggle].on=t.checked;simulate(false,true);return}
    if(t.dataset.cmpgeo!=null){S.cmp.geos[+t.dataset.cmpgeo]=JSON.parse(t.value);const keep=S.cmp.geos;S.cmp=null;S.cmpMode='geo';
      const W=S.W,extra=W.events.filter(e=>e.src!=='question').map(e=>[e.key,e.arg]);S.cmp={mode:'geo',geos:keep,res:keep.map(g=>{const W2=buildWorld(S.spec,g);extra.forEach(x=>addEvent(W2,x,'composer'));return {name:geoShort(g),W:W2,mc:monteCarlo(W2,90)}})};renderCompare();return}
  });
  ['dCmp','dEvi','dMem'].forEach(id=>$('#'+id).addEventListener('toggle',()=>{if(!$('#'+id).open||!S.W)return;({dCmp:renderCompare,dEvi:renderEvidence,dMem:renderMemory})[id]()}));
  $('#bPlay').onclick=()=>{if(!S.mc)return;if(S.tau>=STEPS)S.tau=0;S.playing=!S.playing;renderPlay()};
  $('#scrub').addEventListener('input',e=>{S.playing=false;renderPlay();S.tau=+e.target.value});
  $('#whyBtn').onclick=()=>{if(!S.mc)return;S.playing=false;renderPlay();if(S.tau<1){S.tau=STEPS;$('#scrub').value=STEPS}S.detail={type:'why'};renderSide()};
  $('#simHere').onclick=()=>{const g=S.navTarget;if(!g)return;const extra=S.W.events.filter(e=>e.src!=='question').map(e=>[e.key,e.arg]);S.W=applySetup(buildWorld(S.spec,g));extra.forEach(x=>addEvent(S.W,x,'composer'));S.rank=null;S.detail=null;S.tau=0;$('#simHere').hidden=true;simulate(true);remember('Location',`Rebuilt for ${h(geoLabel(g))}.`);toast(`Simulating in ${geoShort(g)}`);S.playing=true;renderPlay()};
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('#net .nd')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
}
initAsk();initMap();bind();bindSetup();bindV4();go('ask');requestAnimationFrame(frame);

/* =====================================================================
   v4: connected intelligence, consulting-grade exhibits, SavoScout loop,
   agent questions and the simulation report. Later declarations replace
   earlier ones with the same name.
   ===================================================================== */
Object.assign(S,{tabI:'signals',hl:null,saved:[],deploy:{},changes:[],contrib:null,openGap:null,agentQ:null});
const ASM_EVIDENCE={
 priceSens:['Price paid at different price points','Willingness to switch brand','Pack size bought','Purchase frequency'],
 retailWill:['Retailer interest in stocking','Expected margin','Preferred pack size','Minimum order quantity','Expected turnover'],
 compResp:['Competitor price changes','Trade discounts offered to retailers','Promotion frequency','Sales rep visits'],
 passThrough:['Haulage rates by route','Trader mark-ups','Time taken to reprice'],output:['Expected harvest volumes','Planting area','Input use'],
 subst:['Staples bought last month','Switching between staples','Quantity per purchase'],liquidity:['Cash float held','Days agents ran short','Distance to cash hub'],
 trust:['Willingness to use an agent','Past experience with agents','Preferred channel'],fintechResp:['Competitor fees','Agent commissions offered','New wallet sign-ups'],
 passTariff:['Regulatory guidance on tariffs','Operator statements','Past tariff reviews'],subsSens:['Bundle size bought','Response to price rises','SIM count'],
 timeline:['Official statements on timing','Consultation responses','Precedents'],wtp:['Price households would pay','Financing preference','Current energy spend'],
 repay:['Repayment rates','Default reasons','Collection channels'],installCap:['Certified technicians','Installs per month','Stock levels'],
 enforce:['Enforcement actions so far','Inspection capacity','Penalties applied'],passCost:['Planned price changes','Margin headroom','Competitor plans'],
 soften:['Official statements','Lobbying activity','Precedents'],channelWill:['Partner interest','Margin needed','Capacity'],
 fuelPass:['Transport fares before and after','Time to reprice','Route differences'],altResp:['Distributors interested','Fleet capacity','Credit terms required']};
const RESPONDENTS={markets:'Retailers and shoppers',routes:'Transporters and distributors',rural:'Farmers and aggregators',capital:'Officials and industry experts',city:'Local businesses',hub:'Local businesses'};
const pts=v=>(v>=0?'+':'−')+Math.abs(v*30).toFixed(1)+' pts';
const impactOf=sw=>sw*30>=1.5?'High':sw*30>=.5?'Medium':'Low';
function levelMean(W,N,evs){let s=0;for(let k=0;k<N;k++){const r=runOnce(W,(W.seed^Math.imul(k+11,2246822519))>>>0,false,evs);s+=r.X[STEPS][W.out]}return s/N}
function computeContrib(){
  const W=S.W,N=36,all=levelMean(W,N,W.events),items=[];
  if(W.events.length)items.push({name:W.events.map(e=>e.label).join(' + '),v:all-levelMean(W,N,[]),type:'e'});
  W.signals.forEach((s,k)=>{if(!s.on)return;s.on=false;const v=all-levelMean(W,N,W.events);s.on=true;items.push({name:s.title,v,type:'s',k})});
  const sum=items.reduce((a,b)=>a+b.v,0);items.push({name:'Agent interactions and other effects',v:all-sum,type:'o'});
  return {all,items};
}
function influenceSet(W,k){const s=W.signals[k],set=new Set();s.tg.forEach(([i])=>{set.add(i);W.agents[i].outE.forEach(e=>{set.add(e.to);W.agents[e.to].outE.forEach(e2=>set.add(e2.to))})});return set}
function affectsList(W,s){const out=[];s.tg.forEach(([i])=>{out.push(W.agents[i]);W.agents[i].outE.forEach(e=>out.push(W.agents[e.to]))});return [...new Set(out)].slice(0,5).map(a=>a.k==='actor'?a.m:a.n)}
function strengthWord(s){const v=s.conf*(.6+.4*s.strength);return v>=.62?'Strong':v>=.45?'Moderate':'Weak'}
function obsDate(s){const d=new Date(2026,9,6-s.freshness);return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}

/* ---------- Render orchestration ---------- */
function renderAll(){
  renderResHeader();renderMapLayers();buildNet();renderCrumbs();renderTicks();renderStep();renderScenario();
  S.contrib=computeContrib();renderBoundary();renderTakeaway();renderSide();renderExhibits();renderChanged();
  if($('#dMem').open)renderMemory();if($('#dCmp').open)renderCompare();
}
function renderBoundary(){
  const W=S.W,on=W.signals.filter(s=>s.on).length,off=W.signals.length-on,asm=W.assumptions.filter(a=>!a.verified).length,unk=ensureSens().filter(x=>!x.a.verified&&!x.a.userSet&&impactOf(x.swing)!=='Low').length;
  const cell=(k,n,txt,tab)=>`<button data-bnd="${tab}"><span class="k">${k}</span><b>${n}</b><span>${txt}</span></button>`;
  $('#boundary').innerHTML=cell('Included',on,'signals shaping this simulation','signals')+cell('Excluded',off,off?'signals you removed':'signals removed','signals')+cell('Assumed',asm,'values the model must assume','unknowns')+cell('Unknown',unk,'gaps that could change the result','unknowns');
}
function actionSentence(W,mc){
  const out=W.agents[W.out],dir=mc.p50>=0?'rise':'fall',v=fmtO(mc.p50).replace(/^[+−]/,''),hz=`${S.spec.horizon} ${S.spec.stepUnit==='Mo'?'months':'weeks'}`;
  const ev=W.events.map(e=>e.label).join(' and ');
  return mc.eff?`With ${h(ev)}, ${h(out.n.toLowerCase())} ${h(out.m.toLowerCase())} is likely to ${dir} by <b>${v}</b> within ${hz}, compared with doing nothing.`:`Under current signals, ${h(out.m.toLowerCase())} is likely to ${dir} by <b>${v}</b> within ${hz}.`;
}
function renderTakeaway(){
  const W=S.W,mc=S.mc,best=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0],on=W.signals.filter(s=>s.on);
  const conf=on.length?on.reduce((a,s)=>a+s.conf,0)/on.length:W.prof.evidence;const gap=ensureSens().find(x=>!x.a.verified&&!x.a.userSet);
  $('#takeaway').innerHTML=`<div><span class="label">Key result</span><span class="big num">${fmtO(mc.p50)}</span><span class="act">${actionSentence(W,mc)}</span><span class="small muted">80% of ${mc.N} runs fall between ${fmtO(mc.p10)} and ${fmtO(mc.p90)}.</span></div>
   <div><span class="label">Most likely path</span><span class="v">${h(best.title)}</span><span class="small muted">${Math.round(best.prob*100)}% of runs</span></div>
   <div><span class="label">Evidence confidence</span><span class="v">${confWord(conf)} (${conf.toFixed(2)})</span><span class="small muted">${on.length} signals, coverage ${W.prof.evidence.toFixed(2)}</span></div>
   <div><span class="label">Biggest unknown</span><span class="v">${gap?h(gap.a.label):'None open'}</span><span class="small muted">${gap?`${impactOf(gap.swing)} impact · <button class="btn ghost sm" style="padding:0" data-gap="${gap.a.id}">Investigate</button>`:'All gaps resolved or set by you'}</span></div>`;
}

/* ---------- Intelligence panel ---------- */
function renderSide(){
  const W=S.W;if(!W||!S.mc)return;
  const nUnk=ensureSens().filter(x=>!x.a.verified).length;
  let html=S.detail?detailHTML()+agentAsk():'';
  html+=`<div class="itabs" role="tablist"><button data-itab="signals" aria-selected="${S.tabI==='signals'}">Signals<span>${W.signals.filter(s=>s.on).length}</span></button><button data-itab="know" aria-selected="${S.tabI==='know'}">What we know</button><button data-itab="unknowns" aria-selected="${S.tabI==='unknowns'}">Unknowns<span>${nUnk}</span></button></div>`;
  html+=`<div class="ipanel">${S.tabI==='signals'?signalsTab():S.tabI==='know'?knowTab():unknownsTab()}</div>`;
  $('#side').innerHTML=html;renderBelow();
}
function signalsTab(){
  const W=S.W,C=S.contrib,imp=k=>{const it=C&&C.items.find(x=>x.type==='s'&&x.k===k);return it?it.v:null};
  const card=(s)=>{const v=imp(s.k);return `<div class="sigc ${s.on?'':'off'} ${S.hl&&S.hl.k===s.k?'hl':''}">
    <label class="t"><input type="checkbox" data-sigtoggle="${s.k}" ${s.on?'checked':''} aria-label="Include ${h(s.title)}"><span>${h(s.title)}</span></label>
    <div class="meta"><span>${h(s.places.map(p=>W.placeIdx[p]?.name.replace(/ hub$/,'')).filter(Boolean).slice(0,2).join(', '))}</span><span>Observed ${obsDate(s)}</span><span>${h(s.src)}${s.client?' · your data':''}</span></div>
    <div class="str"><span>Evidence</span><span class="bar"><span style="width:${Math.round(s.conf*100)}%"></span></span><span>${strengthWord(s)} · <span class="st ${s.state}" style="font-size:9.5px">${s.state}</span></span></div>
    <div class="aff">Affects ${affectsList(W,s).map(x=>`<span>${h(x)}</span>`).join('')}</div>
    <div class="foot2"><span class="imp ${v==null?'muted':v>=0?'up':'pr'}">${s.on&&v!=null?`Moves result ${pts(v)}`:'Not in this run'}</span>${s.on?`<button class="btn sm" data-hl="${s.k}">${S.hl&&S.hl.k===s.k?'Hide influence':'Show influence'}</button>`:''}</div></div>`};
  const on=W.signals.filter(s=>s.on).sort((a,b)=>Math.abs(imp(b.k)||0)-Math.abs(imp(a.k)||0)),off=W.signals.filter(s=>!s.on);
  return `<div class="ihint">Relevant signals Verisavo already holds for ${h(geoShort(W.geo))}, from ${[...new Set(W.signals.map(s=>s.src))].join(', ')}. Untick one to re-run without it.</div>${on.map(card).join('')}${off.length?`<div class="kcat">Excluded by you</div>${off.map(card).join('')}`:''}`;
}
const CAT_OF=id=>R_DEMAND.includes(id)||id==='income'?'Customer understanding':['retailers','wholesalers','merchants','bagents','g_channel','availability','distributors','altdist','aggregators','paygo','installers'].includes(id)?'Retail and distribution':['competitors','entrant','fintech','g_competitor'].includes(id)?'Competitive understanding':'Market conditions';
function knowTab(){
  const W=S.W,cats={'Market conditions':[],'Customer understanding':[],'Retail and distribution':[],'Competitive understanding':[],'Geographic understanding':[]};
  W.signals.forEach(s=>{const a=W.agents[s.tg[0][0]];cats[CAT_OF(a.id)].push({t:s.title,state:s.state,ev:`${s.frequency} observation${s.frequency>1?'s':''}. Scope: ${s.scope}.`,src:s.src,loc:s.places.map(p=>W.placeIdx[p]?.name).filter(Boolean).join(', '),time:`${obsDate(s)} 2026 (${s.freshness} days ago)`,ver:s.state==='Fact'?'Verified':'Not yet verified',conf:s.conf,rs:s.title,ra:s.tg.map(x=>W.agents[x[0]].n).join(', '),used:s.on})});
  W.assumptions.filter(a=>a.verified).forEach(a=>{const ag=W.agents.find(x=>x.asF.includes(a.id))||W.agents[W.out];cats[CAT_OF(ag.id)].push({t:a.finding.text,state:'Inference',ev:`${a.n} verified observations from a SavoScout investigation in this session.`,src:'SavoScouts investigation',loc:geoShort(W.geo),time:'Today',ver:'Verified',conf:.85,rs:'—',ra:ag.n,used:true})});
  const p=W.prof,lvl=v=>v>=.6?'high':v>=.4?'moderate':'low';
  [['income','Household income is '],['infra','Infrastructure quality is '],['informal','Informal retail accounts for a '],['competition','Competitive intensity is '],['digital','Digital and mobile money adoption is ']].forEach(([k,t])=>cats['Geographic understanding'].push({t:k==='informal'?`${t}${lvl(p[k])} share of trade`:`${t}${lvl(p[k])}`,state:'Inference',ev:`Verisavo index ${p[k].toFixed(2)} for ${geoShort(W.geo)}, derived from connected market evidence.`,src:'Connected market intelligence',loc:geoShort(W.geo),time:'2026',ver:'Derived',conf:p.evidence,rs:'—',ra:k==='income'||k==='digital'?'Customers':k==='informal'?'Retailers':k==='competition'?'Competitors':'Distributors',used:true}));
  cats['Geographic understanding'].push({t:`${W.places.filter(x=>!x.tags.includes('route')).length} locations and ${W.routes.length} trade routes mapped`,state:'Fact',ev:'Location graph from Verisavo’s geographic layer.',src:'Platform intelligence',loc:geoShort(W.geo),time:'2026',ver:'Verified',conf:.9,rs:'—',ra:'All agents',used:true});
  const item=i=>`<details class="kitem"><summary><span>${h(i.t)}${i.used?'':' <span class="muted">(excluded)</span>'}</span><span class="st ${i.state}">${i.state}</span></summary><dl><dt>Evidence</dt><dd>${h(i.ev)}</dd><dt>Source</dt><dd>${h(i.src)}</dd><dt>Location</dt><dd>${h(i.loc)}</dd><dt>Time</dt><dd>${h(i.time)}</dd><dt>Verification</dt><dd>${h(i.ver)}</dd><dt>Confidence</dt><dd>${i.conf.toFixed(2)} · ${confWord(i.conf)}</dd><dt>Related signals</dt><dd>${h(i.rs)}</dd><dt>Related agents</dt><dd>${h(i.ra)}</dd></dl></details>`;
  return `<div class="ihint">What the available evidence currently supports. Expand any item to see where it comes from. States: Fact, Inference, Hypothesis, Assumption, Unknown.</div>`+Object.entries(cats).filter(([,v])=>v.length).map(([k,v])=>`<div class="kcat">${k}</div>${v.map(item).join('')}`).join('');
}
function unknownsTab(){
  const W=S.W,sens=ensureSens(),span=Math.max(.01,...sens.map(x=>Math.max(Math.abs(x.lo),Math.abs(x.hi))))*1.15;
  const pos=v=>(50+v/span*50).toFixed(1);
  return `<div class="ihint">Missing information ranked by how much it could change the result. Investigate the ones that matter; deploy SavoScouts where field evidence is needed.</div>`+sens.map(x=>{const a=x.a,d=S.deploy[a.id],lvl=a.verified?'Done':impactOf(x.swing),lo=Math.min(x.lo,x.hi),hi=Math.max(x.lo,x.hi),open=S.openGap===a.id;
    const where=W.places.filter(p=>p.tags.includes(a.where==='markets'?'market':a.where==='routes'?'route':a.where==='rural'?'rural':a.where==='capital'?'capital':'hub')).slice(0,3).map(p=>p.name.replace(/ hub$/,''));
    return `<div class="gapc"><span class="ipill ${lvl}">${a.verified?'Resolved':a.userSet?lvl+' impact · set by you':lvl+' impact'}</span><h4>${h(a.verified?a.finding.text:a.unknown)}</h4>
     <div class="rangebar" title="Range of outcomes"><span style="left:${pos(lo)}%;width:${Math.max(1.5,(hi-lo)/span*50)}%"></span><i style="left:${pos(0)}%"></i></div>
     <span class="small muted">${a.verified?'Verified and applied to the simulation.':`Could move the result between ${fmtO(lo)} and ${fmtO(hi)}. Currently assumed: ${h(a.label.toLowerCase())} ${a.mean.toFixed(2)} ± ${a.sd.toFixed(2)}.`}</span>
     ${d?deployStatus(a,d):a.verified?'':open?`<div class="invest">
       <div><h5>What needs to be learned</h5><p>${h(a.label)} in ${h(geoShort(W.geo))}.</p></div>
       <div><h5>Why it matters</h5><p>The simulation currently assumes ${a.mean.toFixed(2)}. If the real value is lower the result moves to ${fmtO(x.lo)}; if higher, ${fmtO(x.hi)}.${x.swing*30>=1.5?' That is enough to change which path is most likely.':''}</p></div>
       <div><h5>Evidence that would answer it</h5><ul>${(ASM_EVIDENCE[a.id]||['Direct observations','Respondent statements']).map(e=>`<li>${h(e)}</li>`).join('')}</ul></div>
       <div><h5>How Verisavo would investigate</h5><p>1. Existing intelligence searched: ${W.prof.evidence>=.7?'two related records found, not enough to resolve it':'no direct records found'}.<br>2. Ground-Level Intelligence: ${h(a.method.toLowerCase())}, ${a.n} observations from ${h((RESPONDENTS[a.where]||'local respondents').toLowerCase())}${where.length?' in '+h(where.join(', ')):''}.</p></div>
       <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-deploy="${a.id}">Deploy SavoScout</button><button class="btn sm ghost" data-gap="">Close</button></div></div>`:`<button class="btn sm" data-gap="${a.id}" style="justify-self:start">Investigate</button>`}</div>`}).join('');
}
function deployStatus(a,d){
  if(d.status==='field')return `<div class="invest"><h5>SavoScouts in the field</h5><div class="prog2"><span style="width:${Math.round(d.recv/a.n*100)}%"></span></div><span class="small muted">${d.recv} of ${a.n} observations received · verification runs as they arrive</span></div>`;
  if(d.status==='verify')return `<div class="invest"><h5>Verifying evidence</h5><span class="small muted">Cross-source checks, contributor reliability and contradiction detection.</span></div>`;
  if(d.status==='ready')return `<div class="invest"><h5>New evidence available</h5><p>${a.n} observations verified.</p><button class="btn pri sm" data-applyev="${a.id}" style="justify-self:start">Update simulation</button></div>`;
  return '';
}
function agentAsk(){
  if(!S.detail||S.detail.type!=='agent')return '';
  const W=S.W,i=S.detail.i,a=W.agents[i],rep=curRep(),t=Math.max(1,stepIdx()),q=S.agentQ;
  let ans='';
  if(q==='why'){const ch=trace(W,rep,i,t);ans=ch.length>1?`My ${h(a.m.toLowerCase())} is ${fmtO(rep.X[t][i])} because ${ch.slice(1).map(c=>c.type==='a'?h(W.agents[c.i].n.toLowerCase()):h(srcName(W,c.c).toLowerCase())).join(', which reflects ')}.`:'Nothing has pushed me far from today’s position yet.'}
  if(q==='change'){const ins=a.inE.map(e=>({e,v:Math.abs(e.w*e.lf)})).sort((x,y)=>y.v-x.v).slice(0,2);const ru=W.rules.find(r=>r.agent===a.id);ans=`I respond most to ${ins.map(x=>h(W.agents[x.e.from].n.toLowerCase())+' ('+h(x.e.label.toLowerCase())+')').join(' and ')||'outside forces'}. If those moved the other way, so would I.${ru?` If pressure persists, I may: ${h(ru.text.toLowerCase())}.`:''}`}
  if(q==='need'){const sigs=W.signals.filter(s=>s.tg.some(g=>g[0]===i));const weak=sigs.sort((x,y)=>x.conf-y.conf)[0];const asm=W.assumptions.find(x=>a.asF.includes(x.id)&&!x.verified);ans=asm?`My behaviour rests on an assumption: ${h(asm.label.toLowerCase())}. Field evidence on that would firm up my response.`:weak?`My least certain input is “${h(weak.title)}” (confidence ${weak.conf.toFixed(2)}). More observations would help.`:'My behaviour follows my relationships; direct observations of me would add confidence.'}
  return `<div class="ask-agent"><span class="label">Ask ${h(a.n)}</span><div class="opts">${[['why','Why are you reacting this way?'],['change','What would change your behaviour?'],['need','What evidence would make you more certain?']].map(([k,l])=>`<button data-askagent="${k}" class="${q===k?'chosen':''}">${l}</button>`).join('')}</div>${ans?`<div class="answer">${ans}<small>Reasoning summary generated from the simulation and its evidence, not a chat persona.</small></div>`:''}</div>`;
}
function renderBelow(){
  const W=S.W,mc=S.mc,best=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0],sens=ensureSens(),gap=sens.find(x=>!x.a.verified&&!x.a.userSet);
  const strategies=(SECTORS[S.spec.sector]||SECTORS.generic).strategies.map(s=>s[0]);
  const risk=mc.paths.filter(p=>p.id==='C'||p.id==='D').sort((a,b)=>b.prob-a.prob)[0];
  let rec;if(gap&&impactOf(gap.swing)==='High')rec=`Investigate ${gap.a.label.toLowerCase()} before committing. Deploying SavoScouts for ${gap.a.n} observations would narrow the range most.`;
  else if(best.prob>=.6&&((mc.fr==='gain'&&mc.p10>0)||mc.fr!=='gain'))rec=`The evidence supports the most likely path. Consider a limited pilot and monitor the strongest signals weekly.`;
  else if(risk&&risk.prob>=.25)rec=`Prepare a response to “${risk.title.toLowerCase()}”, which appears in ${Math.round(risk.prob*100)}% of runs.`;
  else rec='Compare alternative strategies before committing; no option is clearly supported yet.';
  $('#below').innerHTML=`<div class="blk"><h3>What happened</h3><p style="margin:0;font-size:13.5px">${h(narrative(W,curPath()))}</p></div>
   <div class="blk"><h3>Recommended next step</h3><p style="margin:0;font-size:13.5px">${h(rec)}</p><span class="label" style="margin-top:4px">Your decision</span><div class="opts">${[...strategies,'Investigate first','Do not proceed'].map(d=>`<button data-decide="${h(d)}" class="${S.decision===d?'chosen':''}">${h(d)}</button>`).join('')}</div><span class="small muted">${S.decision?`Recorded in Market Memory: ${h(S.decision)}.`:'Verisavo supports the decision. You make it.'}</span></div>`;
  S.recText=rec;
}

/* ---------- Exhibits (consulting style) ---------- */
function niceTicks(mn,mx,n=4){const r=mx-mn||1,raw=r/n,mag=Math.pow(10,Math.floor(Math.log10(raw))),st=[1,2,2.5,5,10].map(m=>m*mag).find(s=>s>=raw)||mag*10;const out=[];for(let v=Math.ceil(mn/st)*st;v<=mx+1e-9;v+=st)out.push(+v.toFixed(6));return out}
function quant(arr,p){const a=arr.slice().sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.max(0,Math.round(p*(a.length-1))))]}
function exhFan(mc,W,small){
  const Q=[];for(let t=0;t<=STEPS;t++){const v=mc.runs.map(r=>r.series[t]*30);Q.push([.1,.25,.5,.75,.9].map(p=>quant(v,p)))}
  const w=560,hh=small?200:250,L=46,R=96,T=16,B=30,all=[0,...Q.flat()],ticks=niceTicks(Math.min(...all),Math.max(...all)),mn=Math.min(ticks[0],...all),mx=Math.max(ticks[ticks.length-1],...all);
  const sx=t=>L+t/STEPS*(w-L-R),sy=v=>T+(mx-v)/((mx-mn)||1)*(hh-T-B);
  const band=(lo,hi)=>Q.map((q,t)=>`${sx(t)},${sy(q[hi])}`).join(' ')+' '+Q.slice().reverse().map((q,i)=>`${sx(STEPS-i)},${sy(q[lo])}`).join(' ');
  const end=Q[STEPS];
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Outcome range over time">${ticks.map(v=>`<line x1="${L}" x2="${w-R}" y1="${sy(v)}" y2="${sy(v)}" stroke="${v===0?'#98A1B8':'#EEF2F8'}" ${v===0?'stroke-dasharray="3 3"':''}/><text x="${L-8}" y="${sy(v)+4}" font-size="11" fill="#646E8A" text-anchor="end">${v>0?'+':''}${v}%</text>`).join('')}
   <polygon points="${band(0,4)}" fill="#E3EBF8"/><polygon points="${band(1,3)}" fill="#BFD0EC"/>
   <polyline points="${Q.map((q,t)=>`${sx(t)},${sy(q[2])}`).join(' ')}" fill="none" stroke="#1F273F" stroke-width="2.5"/><circle cx="${sx(STEPS)}" cy="${sy(end[2])}" r="4" fill="#1F273F"/>
   <text x="${sx(STEPS)+10}" y="${sy(end[2])+4}" font-size="13" font-weight="700" fill="#1F273F">${end[2]>=0?'+':''}${end[2].toFixed(1)}%</text>
   <text x="${sx(STEPS)+10}" y="${sy(end[4])+3}" font-size="10.5" fill="#646E8A">80% range</text><text x="${sx(STEPS)+10}" y="${Math.min(sy(end[0])+12,hh-B)}" font-size="10.5" fill="#646E8A">${end[0].toFixed(1)}% to ${end[4].toFixed(1)}%</text>
   ${[0,2,4,6].map(t=>`<text x="${sx(t)}" y="${hh-8}" font-size="11" fill="#646E8A" text-anchor="middle">${stepWhen(t)}</text>`).join('')}</svg>`;
}
function exhPaths(mc){
  const ps=mc.paths.slice().sort((a,b)=>b.prob-a.prob),rowH=58,w=560,hh=ps.length*rowH+8,L=230,R=70;
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Share of runs by path">${ps.map((p,i)=>{const y=i*rowH+6,bw=(w-L-R)*p.prob,lines=wrapTxt(p.title,34);return `${lines.map((l,j)=>`<text x="0" y="${y+15+j*14}" font-size="12.5" fill="#1F273F" ${i===0?'font-weight="600"':''}>${h(l)}</text>`).join('')}<text x="0" y="${y+19+lines.length*14}" font-size="10.5" fill="#98A1B8">Path ${p.id} · result ${fmtO(p.mean)}</text>
     <rect x="${L}" y="${y+6}" width="${w-L-R}" height="18" fill="#F3F6FB" rx="2"/><rect x="${L}" y="${y+6}" width="${Math.max(2,bw)}" height="18" fill="${i===0?'#1F273F':p.id==='C'||p.id==='D'?'#E0B36B':'#8FAEDF'}" rx="2"/><text x="${L+Math.max(2,bw)+8}" y="${y+20}" font-size="13" font-weight="600" fill="#1F273F">${Math.round(p.prob*100)}%</text>`}).join('')}</svg>`;
}
function wrapTxt(s,n){const w=s.split(' '),out=[];let cur='';for(const x of w){if((cur+' '+x).trim().length>n){out.push(cur.trim());cur=x}else cur+=' '+x}if(cur.trim())out.push(cur.trim());const r=out.slice(0,2);if(out.length>2)r[1]+='…';r.more=out.length>1;return r}
function oneLine(s,n){const r=wrapTxt(s,n);return r.more?r[0]+'…':r[0]}
function exhDrivers(C){
  const items=C.items.filter(x=>Math.abs(x.v*30)>=.05).sort((a,b)=>a.type==='e'?-1:b.type==='e'?1:a.type==='o'?1:b.type==='o'?-1:Math.abs(b.v)-Math.abs(a.v)).slice(0,7);
  const rows=[...items,{name:'Total change vs today',v:C.all,type:'t'}];let cum=0;const seg=rows.map(r=>{if(r.type==='t')return {r,a:0,b:r.v};const a=cum;cum+=r.v;return {r,a,b:cum}});
  const vals=[0,...seg.flatMap(s=>[s.a*30,s.b*30])],ticks=niceTicks(Math.min(...vals),Math.max(...vals),4),mn=Math.min(ticks[0],...vals),mx=Math.max(ticks[ticks.length-1],...vals);
  const w=560,rowH=30,L=230,R=58,T=8,hh=rows.length*rowH+T+24,sx=v=>L+(v-mn)/((mx-mn)||1)*(w-L-R);
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Contribution of each driver">${ticks.map(v=>`<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${hh-22}" stroke="${v===0?'#98A1B8':'#EEF2F8'}"/><text x="${sx(v)}" y="${hh-6}" font-size="10.5" fill="#646E8A" text-anchor="middle">${v>0?'+':''}${v}</text>`).join('')}
   ${seg.map((s,i)=>{const y=T+i*rowH,x0=sx(Math.min(s.a,s.b)*30),x1=sx(Math.max(s.a,s.b)*30),tot=s.r.type==='t',col=tot?'#1F273F':s.r.v>=0?'#4362B2':'#C27B14',lbl=oneLine(s.r.name,33);
     return `<text x="0" y="${y+18}" font-size="12" fill="#1F273F" ${tot?'font-weight="700"':''}>${h(lbl)}</text><rect x="${x0}" y="${y+6}" width="${Math.max(1.5,x1-x0)}" height="17" fill="${col}" rx="1.5" ${s.r.type==='o'?'opacity=".45"':''}/>${i<seg.length-1&&!tot?`<line x1="${sx(s.b*30)}" x2="${sx(s.b*30)}" y1="${y+23}" y2="${y+rowH+6}" stroke="#98A1B8" stroke-dasharray="2 2"/>`:''}<text x="${x1+6}" y="${y+19}" font-size="11.5" font-weight="600" fill="${col}">${(s.r.v*30>=0?'+':'−')+Math.abs(s.r.v*30).toFixed(1)}</text>`}).join('')}</svg>`;
}
function exhTornado(sens){
  const rows=sens.slice(0,5),base=S.mc.p50*30,vals=[base,...rows.flatMap(x=>[x.lo*30,x.hi*30])],ticks=niceTicks(Math.min(...vals),Math.max(...vals),4),mn=Math.min(ticks[0],...vals),mx=Math.max(ticks[ticks.length-1],...vals);
  const w=560,rowH=40,L=230,R=40,T=10,hh=rows.length*rowH+T+26,sx=v=>L+(v-mn)/((mx-mn)||1)*(w-L-R);
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Sensitivity of the result to each unknown">${ticks.map(v=>`<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${hh-22}" stroke="#EEF2F8"/><text x="${sx(v)}" y="${hh-6}" font-size="10.5" fill="#646E8A" text-anchor="middle">${v>0?'+':''}${v}%</text>`).join('')}
   <line x1="${sx(base)}" x2="${sx(base)}" y1="${T-4}" y2="${hh-22}" stroke="#1F273F" stroke-width="1.5"/>
   ${rows.map((x,i)=>{const y=T+i*rowH,lo=x.lo*30,hi=x.hi*30,a=x.a;return `<text x="0" y="${y+15}" font-size="12" fill="#1F273F">${h(oneLine(a.label,32))}</text><text x="0" y="${y+29}" font-size="10.5" fill="${a.verified?'#2F7A5A':'#98A1B8'}">${a.verified?'Verified':a.userSet?'Set by you':impactOf(x.swing)+' impact · unknown'}</text>
     <rect x="${sx(Math.min(lo,base))}" y="${y+8}" width="${Math.abs(sx(base)-sx(lo))}" height="16" fill="#E0B36B"/><rect x="${sx(Math.min(hi,base))}" y="${y+8}" width="${Math.abs(sx(hi)-sx(base))}" height="16" fill="#8FAEDF"/>`}).join('')}
   <text x="${sx(base)+4}" y="${T+2}" font-size="10" fill="#1F273F">central ${base>=0?'+':''}${base.toFixed(1)}%</text></svg>`;
}
function renderExhibits(){
  const W=S.W,mc=S.mc,C=S.contrib,out=W.agents[W.out],best=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0],sens=ensureSens();
  const drv=C.items.filter(x=>x.type!=='o').sort((a,b)=>b.v-a.v),top=drv[0],neg=drv.filter(x=>x.v<0).sort((a,b)=>a.v-b.v)[0];
  const t1=`${out.m} ${mc.p50>=0?'rises':'falls'} ${fmtO(mc.p50).replace(/^[+−]/,'')} by ${stepWhen(STEPS).toLowerCase()}; the range widens as effects spread`;
  const t2=`“${best.title}” is the most likely path, in ${Math.round(best.prob*100)}% of runs`;
  const t3=top?`${top.type==='e'?'Your change':'“'+oneLine(top.name,40)+'”'} adds most (${pts(top.v)})${neg?`; ${oneLine(neg.name,40).toLowerCase()} takes most away (${pts(neg.v)})`:''}`:'Drivers of the result';
  const t4=sens[0]?`The result is most sensitive to ${sens[0].a.label.toLowerCase()}${sens[0].a.verified?', now verified':''}`:'Sensitivity to unknowns';
  const ex=(n,t,sub,svg,src)=>`<article class="exh"><span class="no">Exhibit ${n}</span><h3>${h(t)}</h3><span class="sub">${sub}</span>${svg}<span class="src">${src}</span></article>`;
  const srcLine=`Source: Verisavo Market Simulation, ${mc.N} runs over ${S.spec.horizon} ${S.spec.stepUnit==='Mo'?'months':'weeks'}; ${W.signals.filter(s=>s.on).length} signals. Evidence illustrative.`;
  $('#exhibits').innerHTML=`<div class="exhead"><div><span class="label">Results</span><h2>What the simulation shows</h2></div><button class="btn sm" id="aRep2">Open full report</button></div>`+
   ex(1,t1,`${h(out.n)}, ${h(out.m.toLowerCase())}${mc.eff?', change versus doing nothing':''}, %. Line shows the median run; bands hold 50% and 80% of runs.`,exhFan(mc,W),srcLine)+
   ex(2,t2,'Share of simulated runs by path. Amber paths involve an outside response or disruption.',exhPaths(mc),srcLine)+
   ex(3,t3,`Contribution to ${h(out.m.toLowerCase())} by ${stepWhen(STEPS).toLowerCase()}, percentage points. Each bar is the result with that driver minus the result without it. Your change’s bar is the effect in the key result; the signal bars show what the market itself is doing.`,exhDrivers(C),srcLine+' Signals estimated by switching each one off.')+
   ex(4,t4,'Result if each unknown were at the low (amber) or high (blue) end of its plausible range, %. Longer bars mean the unknown matters more.',exhTornado(sens),srcLine);
}
function renderChanged(){
  const c=S.changes[0],el=$('#changed');if(!c){el.hidden=true;return}el.hidden=false;
  el.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:start"><div><span class="label" style="color:var(--good)">Simulation updated with new evidence</span><h3>${h(c.title)}</h3></div><button class="x" data-closechanged aria-label="Dismiss">×</button></div>
   <div class="ba"><div class="h"></div><div class="h">Before investigation</div><div class="h">After investigation</div>
    <div class="l">Status</div><div><span class="st Assumption">Assumption</span></div><div><span class="st Inference">Verified</span></div>
    <div class="l">Confidence</div><div>Low</div><div>High</div>
    <div class="l">New evidence</div><div>None</div><div>${c.n} verified observations</div>
    <div class="l">What we learned</div><div>${h(c.label)} assumed ${c.m0.toFixed(2)} ± ${c.s0.toFixed(2)}</div><div>${h(c.finding)}</div>
    <div class="l">Most likely path</div><div>${h(c.b.best)} (${c.b.p}%)</div><div>${h(c.a.best)} (${c.a.p}%)</div>
    <div class="l">Result range</div><div>${fmtO(c.b.p10)} to ${fmtO(c.b.p90)}</div><div>${fmtO(c.a.p10)} to ${fmtO(c.a.p90)}</div></div>
   <p class="small" style="margin:0"><b>Simulation impact:</b> ${h(c.impact)}</p>`;
}

/* ---------- Investigation and SavoScout deployment ---------- */
function investigate(id){S.tabI='unknowns';S.openGap=id;renderSide();$('#side').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'})}
function openModal(html,wide){$('#modalCard').className='modal-card'+(wide?' wide':'');$('#modalCard').innerHTML=html;$('#modal').hidden=false;document.body.style.overflow='hidden'}
function closeModal(){$('#modal').hidden=true;document.body.style.overflow=''}
function openDeploy(id){
  const W=S.W,a=W.assumptions.find(x=>x.id===id),sens=ensureSens().find(x=>x.a.id===id),resp=RESPONDENTS[a.where]||'Local respondents';
  const where=W.places.filter(p=>p.tags.includes(a.where==='markets'?'market':a.where==='routes'?'route':a.where==='rural'?'rural':a.where==='capital'?'capital':'hub')).slice(0,4).map(p=>p.name.replace(/ hub$/,''));
  const prod=S.spec.product||W.sectorLabel.toLowerCase(),biz=(W.agents.find(x=>['you','g_provider','bank'].includes(x.id))||{n:'the client'}).n;
  const brief=`Visit ${resp.toLowerCase()} in ${where.join(', ')||geoShort(W.geo)} and assess ${a.label.toLowerCase()} for ${prod}: ${(ASM_EVIDENCE[a.id]||['direct observations']).map(x=>x.toLowerCase()).join(', ')}.`;
  const rel=W.signals.filter(s=>s.on).slice(0,3).map(s=>s.title);
  openModal(`<div class="mh"><div><span class="label">SavoScout deployment · pre-filled from your simulation</span><h2>Deploy SavoScouts</h2></div><button class="x" data-closemodal aria-label="Close">×</button></div>
   <div class="mb"><div class="carry">The simulation context has been carried across. Review the task and approve. In the full platform this opens the SavoScout deployment workflow.</div>
   <div class="ctx">
    <span>Simulation</span><div class="ro">${h(S.setup?S.setup.q:S.spec.q)}</div>
    <span>Market</span><div class="ro">${h(W.sectorLabel)}${S.spec.product?' · '+h(S.spec.product):''}</div>
    <span>Geography</span><div class="ro">${h(geoLabel(W.geo))}${where.length?' · '+h(where.join(', ')):''}</div>
    <span>Question to answer</span><div class="ro">${h(a.unknown)}</div>
    <label for="dBrief" style="color:var(--muted);font-size:12.5px;padding-top:8px">Task brief</label><textarea class="inp" id="dBrief">${h(brief)}</textarea>
    <span>Required evidence</span><div class="ro">${(ASM_EVIDENCE[a.id]||['Direct observations']).map(e=>`<label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" checked> ${h(e)}</label>`).join('')}</div>
    <label for="dResp" style="color:var(--muted);font-size:12.5px;padding-top:8px">Target respondents</label><input class="inp" id="dResp" value="${h(resp)}">
    <label for="dN" style="color:var(--muted);font-size:12.5px;padding-top:8px">Observations required</label><input class="inp" id="dN" type="number" min="5" max="500" value="${a.n}">
    <span>Priority</span><div class="ro"><span class="ipill ${impactOf(sens?sens.swing:0)}">${impactOf(sens?sens.swing:0)}</span></div>
    <span>Relevant business</span><div class="ro">${h(biz)}</div>
    <span>Existing evidence</span><div class="ro small">${rel.map(h).join('<br>')}</div>
    <span>Verification</span><div class="ro small">Geo-tagged and time-stamped; photo where possible; contributor reliability checked; cross-checked against existing evidence; contradictions flagged.</div>
    <span>Capture channels</span><div class="ro small">${h(a.channels)}</div></div></div>
   <div class="mf"><button class="btn" data-closemodal>Cancel</button><button class="btn pri" data-approve="${a.id}">Approve deployment</button></div>`);
}
function approveDeploy(id){
  const W=S.W,a=W.assumptions.find(x=>x.id===id),n=Math.max(5,+($('#dN')||{value:a.n}).value||a.n);a.n=n;closeModal();
  const d=S.deploy[id]={status:'field',recv:0,n};remember('SavoScouts',`Deployed: ${h(a.unknown)} (${n} observations).`);toast('SavoScouts deployed. Evidence will return here.');
  S.tabI='unknowns';S.openGap=id;renderSide();
  const tick=setInterval(()=>{if(!S.W||!S.W.assumptions.includes(a)){clearInterval(tick);return}d.recv=Math.min(n,d.recv+Math.ceil(n/10));if(S.tabI==='unknowns')renderSide();
    if(d.recv>=n){clearInterval(tick);d.status='verify';renderSide();setTimeout(()=>{d.status='ready';renderSide();const where=geoShort(W.geo);
      $('#evBanner').hidden=false;$('#evBanner').innerHTML=`<span><b>New evidence available.</b> ${n} ${h((RESPONDENTS[a.where]||'respondent').toLowerCase())} observations have been verified from ${h(where)}.</span><span style="display:flex;gap:8px"><button class="btn sm" data-later>Later</button><button class="btn pri sm" data-applyev="${id}">Update simulation</button></span>`;
      remember('Evidence',`${n} observations verified for ${h(a.label.toLowerCase())}.`)},RM?100:1400)}},RM?60:420);
}
function applyEvidence(id){
  const W=S.W,a=W.assumptions.find(x=>x.id===id);if(!a||a.verified)return;
  const mc0=S.mc,b0=mc0.paths.slice().sort((x,y)=>y.prob-x.prob)[0],m0=a.mean,s0=a.sd;
  a.mean=a.finding.mean;a.sd=a.finding.sd;a.verified=true;a.state='Inference';delete S.deploy[id];
  S.inv[id]={done:true,change:''};$('#evBanner').hidden=true;
  simulate(true,false);
  const mc1=S.mc,b1=mc1.paths.slice().sort((x,y)=>y.prob-x.prob)[0];
  const narrowed=(mc0.p90-mc0.p10)-(mc1.p90-mc1.p10);
  const impact=`${b1.title===b0.title?`“${b1.title}” remains most likely, now in ${Math.round(b1.prob*100)}% of runs (was ${Math.round(b0.prob*100)}%).`:`The most likely path changed to “${b1.title}”.`} The range ${narrowed>0?'narrowed':'widened'} by ${Math.abs(narrowed*30).toFixed(1)} points and the central result moved from ${fmtO(mc0.p50)} to ${fmtO(mc1.p50)}.`;
  S.changes.unshift({title:`${a.label}: now verified`,label:a.label,m0,s0,n:a.n,finding:a.finding.text,b:{best:b0.title,p:Math.round(b0.prob*100),p10:mc0.p10,p90:mc0.p90},a:{best:b1.title,p:Math.round(b1.prob*100),p10:mc1.p10,p90:mc1.p90},impact});
  remember('Updated',h(impact));renderChanged();$('#changed').scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});toast('Simulation updated with verified evidence');
}

/* ---------- Report (structured, consulting style) ---------- */
function openReport(){
  const W=S.W,mc=S.mc,best=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0],sens=ensureSens(),out=W.agents[W.out];
  const date=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const on=W.signals.filter(s=>s.on),off=W.signals.filter(s=>!s.on);
  const ex=(n,t,svg)=>`<div class="exh"><span class="no">Exhibit ${n}</span><h3 style="font-size:14.5px">${h(t)}</h3>${svg}</div>`;
  openModal(`<div class="mh"><div><span class="label">Verisavo · Simulation report · ${date}</span><h2>${h(S.setup?S.setup.q:S.spec.q)}</h2></div><button class="x" data-closemodal aria-label="Close">×</button></div>
   <div class="mb rep">
    <div><h3>Executive summary</h3><p class="exec">${actionSentence(W,mc)} 80% of ${mc.N} simulated runs fall between ${fmtO(mc.p10)} and ${fmtO(mc.p90)}. The most likely path is “${h(best.title)}” (${Math.round(best.prob*100)}% of runs). ${h(narrative(W,best))}</p></div>
    <div class="reco"><span class="label">Recommendation</span><p style="margin:0;font-size:15px;font-weight:500">${h(S.recText||'')}</p><span class="small muted">The decision remains with you. This report shows plausible outcomes under stated assumptions, not a forecast.</span></div>
    <div class="repx">${ex(1,'Outcome range over time',exhFan(mc,W,true))}${ex(2,'Possible paths',exhPaths(mc))}${ex(3,'What drives the result (pts)',exhDrivers(S.contrib))}${ex(4,'Sensitivity to unknowns',exhTornado(sens))}</div>
    <div><h3>Intelligence boundary</h3><p style="margin:0;font-size:13.5px"><b>Included:</b> ${on.length} signals. <b>Excluded by you:</b> ${off.length?off.map(s=>h(s.title)).join('; '):'none'}. <b>Assumed:</b> ${W.assumptions.filter(a=>!a.verified).map(a=>h(a.label.toLowerCase())).join(', ')||'none'}. <b>Unknown:</b> effects beyond ${S.spec.horizon} weeks and any factor not represented by the agents below.</p></div>
    <div><h3>What we don’t know yet</h3><div style="overflow-x:auto"><table><thead><tr><th>Intelligence gap</th><th>Impact</th><th>Range of result</th><th>Recommended investigation</th></tr></thead><tbody>${sens.map(x=>`<tr><td>${h(x.a.verified?x.a.finding.text:x.a.unknown)}</td><td>${x.a.verified?'Resolved':impactOf(x.swing)}</td><td>${fmtO(Math.min(x.lo,x.hi))} to ${fmtO(Math.max(x.lo,x.hi))}</td><td>${h(x.a.method)}, ${x.a.n} obs.</td></tr>`).join('')}</tbody></table></div></div>
    <div><h3>Market simulated</h3><p style="margin:0;font-size:13.5px">${h(geoLabel(W.geo))} · ${h(W.sectorLabel)} · ${W.agents.length} agents: ${W.agents.map(a=>h(a.n)).join(', ')}.</p></div>
    <div><h3>Evidence appendix</h3><div style="overflow-x:auto"><table><thead><tr><th>Signal</th><th>State</th><th>Source</th><th>Location</th><th>Observed</th><th>Confidence</th><th>Used</th></tr></thead><tbody>${W.signals.map(s=>`<tr><td>${h(s.title)}</td><td>${s.state}</td><td>${h(s.src)}</td><td>${h(s.places.map(p=>W.placeIdx[p]?.name).filter(Boolean).join(', '))}</td><td>${obsDate(s)}</td><td>${s.conf.toFixed(2)}</td><td>${s.on?'Yes':'Excluded'}</td></tr>`).join('')}</tbody></table></div></div>
    ${S.changes.length?`<div><h3>Evidence gathered this session</h3>${S.changes.map(c=>`<p style="margin:0 0 6px;font-size:13.5px"><b>${h(c.label)}:</b> ${h(c.finding)} ${h(c.impact)}</p>`).join('')}</div>`:''}
    <p class="small muted" style="margin:0">Prototype. Evidence, figures and sources are illustrative.</p></div>
   <div class="mf"><button class="btn" data-closemodal>Close</button><button class="btn pri" id="copyRep">Copy summary</button></div>`,true);
}

/* ---------- Compare (dot-range exhibit) ---------- */
function renderCompare(){
  const W=S.W,spec=S.spec;
  if(!S.cmp||S.cmp.mode!==S.cmpMode){
    const extra=W.events.filter(e=>e.src!=='question').map(e=>[e.key,e.arg]);
    if(S.cmpMode==='geo'){const cur=W.geo;const alts=cur.city?FEAT[cur.cid].cityIds.filter(id=>id!==cur.city).slice(0,3).map(id=>mkGeo('city',{city:id})):Object.keys(FEAT).filter(c=>c!==cur.cid).slice(0,3).map(cid=>mkGeo('country',{cid}));
      S.cmp={mode:'geo',res:[cur,...alts].map(g=>{const W2=applySetup(buildWorld(spec,g));extra.forEach(e=>addEvent(W2,e,'composer'));return {name:geoShort(g),W:W2,mc:monteCarlo(W2,90)}})}}
    else S.cmp={mode:'int',res:[{name:'Your scenario',W,mc:S.mc},...S.saved.map(sv=>{const W2=applySetup(buildWorld(sv.spec));return {name:'Saved: '+sv.name,W:W2,mc:monteCarlo(W2,90)}}),...(SECTORS[spec.sector]||SECTORS.generic).strategies.map(([name,evs])=>{const W2=applySetup(buildWorld({...cloneSpec(spec),events:evs},W.geo));return {name,W:W2,mc:monteCarlo(W2,90)}})]}
  }
  const res=S.cmp.res,vals=[0,...res.flatMap(r=>[r.mc.p10*30,r.mc.p90*30])],ticks=niceTicks(Math.min(...vals),Math.max(...vals),5),mn=Math.min(ticks[0],...vals),mx=Math.max(ticks[ticks.length-1],...vals);
  const w=760,rowH=40,L=250,R=80,T=10,hh=res.length*rowH+T+26,sx=v=>L+(v-mn)/((mx-mn)||1)*(w-L-R);
  const bestR=res.slice().sort((a,b)=>b.mc.p50-a.mc.p50)[0];
  const svg=`<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Comparison of options">${ticks.map(v=>`<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${hh-22}" stroke="${v===0?'#98A1B8':'#EEF2F8'}"/><text x="${sx(v)}" y="${hh-6}" font-size="11" fill="#646E8A" text-anchor="middle">${v>0?'+':''}${v}%</text>`).join('')}
   ${res.map((r,i)=>{const y=T+i*rowH+16,b=r===bestR,pb=r.mc.paths.slice().sort((x,z)=>z.prob-x.prob)[0];return `<text x="0" y="${y+1}" font-size="13" fill="#1F273F" ${b?'font-weight="700"':''}>${h(wrapTxt(r.name,34)[0])}</text><text x="0" y="${y+15}" font-size="10.5" fill="#98A1B8">${h(wrapTxt(pb.title,44)[0])} · ${Math.round(pb.prob*100)}%</text>
     <line x1="${sx(r.mc.p10*30)}" x2="${sx(r.mc.p90*30)}" y1="${y}" y2="${y}" stroke="${b?'#1F273F':'#8FAEDF'}" stroke-width="5" stroke-linecap="round" opacity=".5"/><circle cx="${sx(r.mc.p50*30)}" cy="${y}" r="6" fill="${b?'#1F273F':'#4362B2'}"/><text x="${sx(r.mc.p90*30)+10}" y="${y+4}" font-size="12.5" font-weight="600" fill="#1F273F">${fmtO(r.mc.p50)}</text>`}).join('')}</svg>`;
  $('#cmp').innerHTML=`<div class="cmp-h"><div class="seg"><button data-cmpmode="int" aria-pressed="${S.cmpMode==='int'}">Strategies${S.saved.length?' and saved':''}</button><button data-cmpmode="geo" aria-pressed="${S.cmpMode==='geo'}">Locations</button></div></div>
   <article class="exh"><span class="no">Exhibit 5</span><h3>${h(bestR.name)} gives the strongest central result (${fmtO(bestR.mc.p50)})</h3><span class="sub">Central result (dot) and 80% range (bar) for ${h(W.agents[W.out].m.toLowerCase())}, %, ${S.cmpMode==='geo'?'same scenario in each location':'each option in '+h(geoShort(W.geo))}. Below each name: the most likely path.</span><div style="overflow-x:auto">${svg}</div><span class="src">Source: Verisavo Market Simulation, 90 runs per option. Evidence illustrative.</span></article>`;
}

/* ---------- Bindings for v4 ---------- */
function bindV4(){
  document.addEventListener('click',e=>{const t=e.target;let b;
    if(t.closest('[data-closemodal]')||t.id==='modal'){closeModal();return}
    if((b=t.closest('[data-approve]'))){approveDeploy(b.dataset.approve);return}
    if(t.id==='copyRep'){const txt=$('#modalCard').querySelector('.exec').textContent+' '+(S.recText||'');try{navigator.clipboard.writeText(txt).then(()=>toast('Summary copied'),()=>toast('Copy not available here'))}catch(_){toast('Copy not available here')}return}
    if(S.screen!=='results')return;
    if((b=t.closest('[data-itab]'))){S.tabI=b.dataset.itab;renderSide();return}
    if((b=t.closest('[data-bnd]'))){S.tabI=b.dataset.bnd;renderSide();$('#side').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return}
    if((b=t.closest('[data-hl]'))){const k=+b.dataset.hl;S.hl=S.hl&&S.hl.k===k?null:{k,agents:influenceSet(S.W,k)};renderHl();renderSide();return}
    if(t.id==='hlClear'){S.hl=null;renderHl();renderSide();return}
    if((b=t.closest('[data-gap]'))){S.tabI='unknowns';S.openGap=b.dataset.gap||null;renderSide();if(b.dataset.gap)$('#side').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return}
    if((b=t.closest('[data-deploy]'))){openDeploy(b.dataset.deploy);return}
    if((b=t.closest('[data-applyev]'))){applyEvidence(b.dataset.applyev);return}
    if(t.closest('[data-later]')){$('#evBanner').hidden=true;return}
    if(t.closest('[data-closechanged]')){S.changes.shift();renderChanged();return}
    if((b=t.closest('[data-askagent]'))){S.agentQ=b.dataset.askagent;renderSide();return}
    if(t.closest('[data-agent]'))S.agentQ=null;
    if(t.id==='aRun'){S.tau=0;S.playing=true;renderPlay();$('#results').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return}
    if(t.id==='aCmp'){$('#dCmp').open=true;renderCompare();$('#dCmp').scrollIntoView({behavior:RM?'auto':'smooth'});return}
    if(t.id==='aSave'){const name=`${S.W.events.map(x=>x.label).join(' + ')||'Current signals'} · ${geoShort(S.W.geo)}`;S.saved.push({name,spec:cloneSpec(S.spec)});S.cmp=null;remember('Saved',h(name));toast('Scenario saved. Compare it under Compare options.');return}
    if(t.id==='aInv'){const g=ensureSens().find(x=>!x.a.verified&&!x.a.userSet);investigate(g?g.a.id:null);return}
    if(t.id==='aRep'||t.id==='aRep2'){openReport();return}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal()});
}
function renderHl(){const b=$('#hlBar');if(!S.hl){b.hidden=true;return}const s=S.W.signals[S.hl.k];b.hidden=false;b.innerHTML=`<span>Showing the influence of <b>${h(s.title)}</b> across ${S.hl.agents.size} agents.</span><button class="btn sm" id="hlClear">Show everything</button>`;if(!S.playing){S.tau=Math.max(S.tau,3);$('#scrub').value=S.tau}}
function applyHlNet(){if(!S.W)return;const nodes=$('#nN').children;const set=S.hl?S.hl.agents:null;for(let i=0;i<nodes.length;i++){if(set&&!set.has(i))nodes[i].style.opacity='.18'}
  if(set)S.W.edges.forEach(e=>{const el=$('#ne'+e.i);if(el&&!(set.has(e.from)&&set.has(e.to)))el.style.opacity='.1'})}

/* Next actions: boxed prompts */
const _rt=renderTakeaway;
renderTakeaway=function(){_rt();const g=ensureSens().find(x=>!x.a.verified&&!x.a.userSet);
  const card=(act,k,t,d)=>`<button class="actcard" data-act="${act}"><span class="k">${k}</span><b>${t}</b><span>${d}</span><i aria-hidden="true">→</i></button>`;
  $('#nextActs').innerHTML=card('inv','Close a gap',g?h('Investigate '+g.a.label.toLowerCase()):'All gaps closed',g?`${impactOf(g.swing)} impact on the result`:'Re-run as new signals arrive')+card('agent','Ask the market','Ask an agent why','Tap any agent to hear its reasoning')+card('cmp','Weigh options','Compare strategies','Side by side, with ranges')+card('rep','Share it','Open the report','Executive summary and exhibits');
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||S.screen!=='results')return;const a=b.dataset.act;
  if(a==='inv')$('#aInv').click();else if(a==='cmp')$('#aCmp').click();else if(a==='rep')openReport();else if(a==='agent'){S.detail={type:'agent',i:S.W.out};S.agentQ='why';S.playing=false;renderPlay();if(S.tau<1){S.tau=STEPS;$('#scrub').value=STEPS}renderSide();$('#side').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'})}});

/* ===== v5: swarm-style agent graph (MiroFish-inspired) ===== */
const TYPES=[['business','Your business','#1F273F'],['customers','Customers','#4362B2'],['channel','Channels and logistics','#80AADC'],['competition','Competition','#C27B14'],['supply','Supply and inputs','#7A869F'],['condition','Market conditions','#B9CBE6'],['external','External forces and policy','#98A1B8']];
const TCOL=Object.fromEntries(TYPES.map(t=>[t[0],t[2]]));
function typeOf(a){const id=a.id;
  if(['you','bank','g_provider','operators','businesses'].includes(id))return 'business';
  if(R_DEMAND.includes(id)||id==='mmusers'||id==='workers')return 'customers';
  if(['competitors','entrant','fintech','g_competitor'].includes(id))return 'competition';
  if(a.k==='condition')return 'condition';
  if(a.k==='force'||['regulator','government','tradegroups','investors'].includes(id))return 'external';
  if(['suppliers','g_supplier','farmers','importers'].includes(id))return 'supply';
  return 'channel'}
function netLayout(W){
  const r=$('#netWrap').getBoundingClientRect(),w=Math.max(300,r.width||460),hh=Math.max(340,r.height||520);$('#net').setAttribute('viewBox',`0 0 ${w} ${hh}`);S.netSize=[w,hh];
  const TOP=Math.max(96,S.netSize[0]<520?118:96),BOT=108,n=W.agents.length,deg=new Array(n).fill(0);W.edges.forEach(e=>{deg[e.from]++;deg[e.to]++});const md=Math.max(...deg,1);
  W.agents.forEach((a,i)=>{a.deg=deg[i]/md;a.nr=i===W.out?18:8+6*a.deg});
  const order=['supply','external','business','channel','condition','customers','competition'];
  const others=W.agents.map((a,i)=>({a,i})).filter(o=>o.i!==W.out).sort((p,q)=>order.indexOf(typeOf(p.a))-order.indexOf(typeOf(q.a))||p.a.col-q.a.col||p.i-q.i);
  const cx=w/2,cy=TOP+(hh-TOP-BOT)/2,rx=Math.max(56,w/2-(w<560?176:160)),ry=Math.max(60,(hh-TOP-BOT)/2-6);
  W.agents[W.out].nx=cx;W.agents[W.out].ny=cy;W.agents[W.out].lab='below';
  others.forEach((o,k)=>{const an=Math.PI+(k+.5)/others.length*2*Math.PI,c=Math.cos(an);o.a.nx=cx+c*rx;o.a.ny=cy+Math.sin(an)*ry;o.a.lab=c<-.15?'left':'right'});
}
let SW=[];
function buildNet(){
  const W=S.W;if(!W){$('#nE').innerHTML=$('#nN').innerHTML=$('#nP').innerHTML='';SW=[];return}netLayout(W);
  $('#nE').innerHTML=W.edges.map(e=>{const A=W.agents[e.from],B=W.agents[e.to];const g=edgeGeomR(A,B);e.g=g;return `<path class="ed" id="ne${e.i}" d="M${g.p0[0].toFixed(1)},${g.p0[1].toFixed(1)} Q${g.c[0].toFixed(1)},${g.c[1].toFixed(1)} ${g.p1[0].toFixed(1)},${g.p1[1].toFixed(1)}"/>`}).join('');
  let sw='';SW=[];
  W.agents.forEach((a,i)=>{if(a.k!=='actor'||i===W.out)return;const m=12;for(let j=0;j<m;j++){const an=j/m*Math.PI*2+i,rr=a.nr+9+(j%3)*4;SW.push({i,j,m,an,rr});sw+=`<circle class="mdot" r="2.1"/>`}});
  $('#nP').innerHTML=sw+Array.from({length:50},()=>'<circle class="pt" r="2.3" opacity="0"/>').join('');
  $('#nN').innerHTML=W.agents.map((a,i)=>{const t=typeOf(a),col=TCOL[t],out=i===W.out,right=a.nx<S.netSize[0]*.62;
    return `<g class="nd2 ${out?'out':''}" data-agent="${i}" tabindex="0" role="button" aria-label="${h(a.n)}" transform="translate(${a.nx.toFixed(1)},${a.ny.toFixed(1)})">
      <circle class="halo" r="${a.nr+6}" fill="none"/><circle class="core" r="${a.nr}" fill="${out?'#1F273F':col}" ${a.k==='force'?'fill-opacity=".35" stroke="'+col+'" stroke-dasharray="3 2"':''}/>${out?`<circle r="${a.nr+4}" fill="none" stroke="#1F273F" stroke-opacity=".2" stroke-width="4"/>`:''}
      ${(()=>{const L=a.lab,dx=L==='left'?-(a.nr+10):L==='right'?a.nr+10:0,anc=L==='left'?'end':L==='right'?'start':'middle',y1=L==='above'?-(a.nr+22):L==='below'?a.nr+24:-1;return `<text class="nl" x="${dx}" y="${y1}" text-anchor="${anc}">${h(a.n)}</text><text class="nvl" x="${dx}" y="${y1+13}" text-anchor="${anc}"></text>`})()}</g>`}).join('');
  if(!$('#netLegend')){$('#netWrap').insertAdjacentHTML('beforeend','<div class="netlegend" id="netLegend"></div><div class="netfeed" id="netFeed"></div>')}
  const used=new Set(W.agents.map(typeOf));$('#netLegend').innerHTML=TYPES.filter(t=>used.has(t[0])).map(t=>`<span><i style="background:${t[2]}"></i>${t[1]}</span>`).join('');
}
function edgeGeomR(A,B){const dx=B.nx-A.nx,dy=B.ny-A.ny,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,off=Math.min(18,L*.08);const c=[(A.nx+B.nx)/2-uy*off,(A.ny+B.ny)/2+ux*off];const tr=(P,Q,r)=>{const vx=Q[0]-P[0],vy=Q[1]-P[1],l=Math.hypot(vx,vy)||1;return [P[0]+vx/l*r,P[1]+vy/l*r]};return {p0:tr([A.nx,A.ny],c,A.nr+3),c,p1:tr([B.nx,B.ny],c,B.nr+4)}}
function updateNet(T){
  const W=S.W,rep=curRep();if(!W)return;const tau=S.tau,t=Math.max(1,Math.min(STEPS,Math.ceil(tau)||1)),nodes=$('#nN').children;
  for(let i=0;i<W.agents.length;i++){const g=nodes[i];if(!g)continue;const a=W.agents[i];g.style.opacity=i<S.reveal.n?'':'0';g.classList.toggle('sel',!!(S.detail&&S.detail.type==='agent'&&S.detail.i===i));if(!rep)continue;
    const x=xAt(rep,i,tau),adv=adverse(a,x),v=g.querySelector('.nvl');v.textContent=tau>.05?`${fmtO(x)} ${a.m.toLowerCase()}`.slice(0,w2()):a.m.toLowerCase().slice(0,w2());v.setAttribute('fill',tau>.05&&Math.abs(x)>.01?(adv?'#B9730F':'#4362B2'):'#98A1B8');
    const dd=Math.abs(rep.X[t][i]-rep.X[t-1][i]),ph=(T*1.2+i*.37)%1,hl=g.querySelector('.halo');hl.setAttribute('stroke',adv?'#C27B14':'#618CD0');hl.setAttribute('stroke-width','2');hl.setAttribute('opacity',S.playing?(dd*3*(1-ph)).toFixed(3):'0');hl.setAttribute('r',(a.nr+5+ph*14).toFixed(1))}
  const dots=$('#nP').querySelectorAll('.mdot');
  SW.forEach((d,k)=>{const el=dots[k];if(!el)return;const a=W.agents[d.i];if(d.i>=S.reveal.n){el.setAttribute('opacity','0');return}
    const x=rep?xAt(rep,d.i,tau):0,on=tau>.05&&d.j/d.m<Math.min(1,Math.abs(x)*2.2),adv=adverse(a,x),wob=RM?0:Math.sin(T*.8+d.j*1.7+d.i)*.18;
    el.setAttribute('cx',(a.nx+Math.cos(d.an+wob)*d.rr).toFixed(1));el.setAttribute('cy',(a.ny+Math.sin(d.an+wob)*d.rr).toFixed(1));
    el.setAttribute('fill',on?(adv?'#C27B14':'#4362B2'):'#D3DCEA');el.setAttribute('opacity',on?'.95':'.8')});
  const pts=$('#nP').querySelectorAll('.pt');let pi=0;
  W.edges.forEach(e=>{const el=$('#ne'+e.i);if(!el)return;el.style.opacity=S.reveal.edge?'':'0';let v=0;if(rep&&tau>0){const c=rep.C[t][e.to].find(c=>c[0]==='a'&&c[3]===e.i);if(c)v=c[2]}
    const on=Math.abs(v)>.02,adv=adverse(W.agents[e.to],v);el.setAttribute('stroke',on?(adv?'#E0B36B':'#8FAEDF'):'#E3E9F2');el.setAttribute('stroke-width',on?(1+Math.min(2.5,Math.abs(v)*14)).toFixed(1):'1');
    if(!S.reveal.edge||!on||RM)return;const n=Math.min(3,Math.ceil(Math.abs(v)*14));for(let k=0;k<n&&pi<pts.length;k++,pi++){const s=((T*(.25+Math.abs(v)*1.4))+k/n+e.i*.17)%1,[x,y]=qpt(e.g,s);const c=pts[pi];c.setAttribute('cx',x.toFixed(1));c.setAttribute('cy',y.toFixed(1));c.setAttribute('fill',adv?'#C27B14':'#4362B2');c.setAttribute('opacity',(Math.sin(s*Math.PI)*.9).toFixed(2))}});
  for(;pi<pts.length;pi++)pts[pi].setAttribute('opacity','0');
  const st=stepIdx();if(S._feedStep!==st&&rep){S._feedStep=st;const f=$('#netFeed');if(f){const items=[];if(st===0)items.push('Agents at today’s position. Press play.');else{rep.acts.filter(a=>a.t<=st).slice(-2).forEach(a=>items.push(`<b>W${Math.max(1,Math.round(a.t*S.spec.horizon/STEPS))}</b> ${h(a.text)}`));
      W.agents.map((a,i)=>({a,i,d:rep.X[st][i]-rep.X[st-1][i]})).filter(m=>Math.abs(m.d)>.01).sort((p,q)=>Math.abs(q.d)-Math.abs(p.d)).slice(0,3-items.length).forEach(m=>items.push(`<b>${h(stepWhen(st).replace('Week ','W'))}</b> ${h(m.a.n)} ${arrow(m.d)} ${h(m.a.m.toLowerCase())}`))}
    f.innerHTML=items.map(x=>`<div>${x}</div>`).join('')}}
}
function applyHlNet(){if(!S.W)return;const nodes=$('#nN').children,set=S.hl?S.hl.agents:null;if(!set)return;for(let i=0;i<nodes.length;i++)if(!set.has(i))nodes[i].style.opacity='.15';
  S.W.edges.forEach(e=>{const el=$('#ne'+e.i);if(el&&!(set.has(e.from)&&set.has(e.to)))el.style.opacity='.08'});const dots=$('#nP').querySelectorAll('.mdot');SW.forEach((d,k)=>{if(!set.has(d.i)&&dots[k])dots[k].setAttribute('opacity','.12')})}

/* ===== v6: zoomable full map, signal markers, moving agent populations, simple home ===== */
const POP={consumers:60,households:60,bcustomers:50,subscribers:50,solarH:50,consumersP:50,g_demand:50,retailers:36,wholesalers:24,merchants:24,bagents:24,distributors:20,altdist:8,transport:24,aggregators:16,farmers:40,competitors:6,entrant:3,fintech:5,g_competitor:6,suppliers:10,g_supplier:10,importers:8,installers:14,paygo:6,smes:30,businesses:30,workers:40,operators:4,towers:6,investors:10,mmusers:40,tradegroups:4,g_channel:20,altdist2:0};
function popOf(a,i,W){if(i===W.out&&a.k!=='actor')return 0;if(a.k!=='actor')return 0;if(['you','bank','g_provider','government','regulator'].includes(a.id))return 0;return POP[a.id]||12}
function fullGeo(g){return (g.level==='city'||g.level==='district')?mkGeo('country',{cid:g.cid}):g}
/* ---- agents: SVG nodes + canvas population ---- */
let SWD=[],nctx=null;
function buildNet(){
  const W=S.W;if(!W){$('#nE').innerHTML=$('#nN').innerHTML=$('#nP').innerHTML='';SWD=[];return}
  if(!$('#netc')){$('#net').insertAdjacentHTML('beforebegin','<canvas id="netc"></canvas>')}
  netLayout(W);const [w,hh]=S.netSize,c=$('#netc'),d=window.devicePixelRatio||1;c.width=Math.round(w*d);c.height=Math.round(hh*d);nctx=c.getContext('2d');
  $('#nE').innerHTML=W.edges.map(e=>{const A=W.agents[e.from],B=W.agents[e.to],g=edgeGeomR(A,B);e.g=g;return `<path class="ed" id="ne${e.i}" d="M${g.p0[0].toFixed(1)},${g.p0[1].toFixed(1)} Q${g.c[0].toFixed(1)},${g.c[1].toFixed(1)} ${g.p1[0].toFixed(1)},${g.p1[1].toFixed(1)}"/>`}).join('');
  $('#nP').innerHTML=Array.from({length:40},()=>'<circle class="pt" r="2.3" opacity="0"/>').join('');
  const r=mulberry32(W.seed);SWD=[];
  W.agents.forEach((a,i)=>{const n=popOf(a,i,W);a.pop=n;const R=a.nr+16+Math.min(26,n*.45);
    for(let j=0;j<n;j++){const an=r()*Math.PI*2,rad=a.nr+8+Math.sqrt(r())*(R-a.nr-8);SWD.push({i,j,n,hx:Math.cos(an)*rad,hy:Math.sin(an)*rad,x:a.nx+Math.cos(an)*rad,y:a.ny+Math.sin(an)*rad,vx:0,vy:0,ph:r()*6.28,trip:null,rank:r()})}});
  $('#nN').innerHTML=W.agents.map((a,i)=>{const t=typeOf(a),col=TCOL[t],out=i===W.out,L=a.lab,dx=L==='left'?-(a.nr+(a.pop?34:10)):a.nr+(a.pop?34:10),anc=L==='left'?'end':'start';
    return `<g class="nd2 ${out?'out':''}" data-agent="${i}" tabindex="0" role="button" aria-label="${h(a.n)}" transform="translate(${a.nx.toFixed(1)},${a.ny.toFixed(1)})">
      <circle class="halo" r="${a.nr+6}" fill="none"/><circle class="core" r="${a.nr}" fill="${out?'#1F273F':col}" ${a.k==='force'?'fill-opacity=".35" stroke="'+col+'" stroke-dasharray="3 2"':''}/>${out?`<circle r="${a.nr+4}" fill="none" stroke="#1F273F" stroke-opacity=".2" stroke-width="4"/>`:''}
      <text class="nl" x="${out?0:dx}" y="${out?a.nr+20:-1}" text-anchor="${out?'middle':anc}">${h(a.n)}${a.pop?` <tspan class="cnt">· ${a.pop}</tspan>`:''}</text><text class="nvl" x="${out?0:dx}" y="${out?a.nr+33:12}" text-anchor="${out?'middle':anc}"></text></g>`}).join('');
  if(!$('#netLegend')){$('#netWrap').insertAdjacentHTML('beforeend','<div class="netlegend" id="netLegend"></div><div class="netfeed" id="netFeed"></div>')}
  const used=new Set(W.agents.map(typeOf));$('#netLegend').innerHTML=TYPES.filter(t=>used.has(t[0])).map(t=>`<span><i style="background:${t[2]}"></i>${t[1]}</span>`).join('')+`<span class="muted">· each small dot is one simulated agent</span>`;
}
function drawSwarm(T,dt){
  if(!nctx||!S.W)return;const W=S.W,rep=curRep(),tau=S.tau,[w,hh]=S.netSize,d=window.devicePixelRatio||1;nctx.setTransform(d,0,0,d,0,0);nctx.clearRect(0,0,w,hh);
  const t=Math.max(1,Math.min(STEPS,Math.ceil(tau)||1));
  const act=W.agents.map((a,i)=>rep?xAt(rep,i,tau):0);
  const flows={};if(rep&&tau>0)W.edges.forEach(e=>{const c=rep.C[t][e.to].find(c=>c[0]==='a'&&c[3]===e.i);if(c&&Math.abs(c[2])>.025)(flows[e.from]=flows[e.from]||[]).push({e,v:c[2]})});
  const sp=RM?0:1;
  SWD.forEach(p=>{const a=W.agents[p.i];if(p.i>=S.reveal.n)return;const x=act[p.i],frac=Math.min(1,Math.abs(x)*2.4),on=tau>.05&&p.j/p.n<frac,energy=.25+Math.min(1.6,Math.abs(x)*4);
    if(sp){
      if(p.trip){p.trip.s+=dt*(.45+energy*.25)*p.trip.dir;const g=p.trip.e.g;if(p.trip.s>=1){p.trip.dir=-1}if(p.trip.s<=0){p.trip=null}else{const [qx,qy]=qpt(g,Math.min(1,p.trip.s));p.x=qx;p.y=qy}}
      if(!p.trip){const hx=a.nx+p.hx+Math.cos(T*.6*energy+p.ph)*4*energy,hy=a.ny+p.hy+Math.sin(T*.7*energy+p.ph*1.3)*4*energy;
        p.vx+=(hx-p.x)*.06+(Math.random()-.5)*.6*energy;p.vy+=(hy-p.y)*.06+(Math.random()-.5)*.6*energy;p.vx*=.82;p.vy*=.82;p.x+=p.vx;p.y+=p.vy;
        if(on&&flows[p.i]&&S.playing&&p.rank<.06*Math.min(3,energy)&&Math.random()<dt*.9){const f=flows[p.i][Math.floor(Math.random()*flows[p.i].length)];p.trip={e:f.e,s:0,dir:1}}}
    }else{p.x=a.nx+p.hx;p.y=a.ny+p.hy}
    const dim=S.hl&&!S.hl.agents.has(p.i);
    nctx.globalAlpha=dim?.12:p.trip?.95:on?.9:.75;nctx.fillStyle=on?(adverse(a,x)?'#C27B14':'#4362B2'):'#C9D3E3';
    nctx.beginPath();nctx.arc(p.x,p.y,p.trip?2.6:2.1,0,6.2832);nctx.fill()});
  nctx.globalAlpha=1;
}
function updateNet(T){
  const W=S.W,rep=curRep();if(!W)return;const tau=S.tau,t=Math.max(1,Math.min(STEPS,Math.ceil(tau)||1)),nodes=$('#nN').children;
  const now=performance.now(),dt=Math.min(.1,(now-(S._swT||now))/1000);S._swT=now;drawSwarm(T,dt);
  for(let i=0;i<W.agents.length;i++){const g=nodes[i];if(!g)continue;const a=W.agents[i];g.style.opacity=i<S.reveal.n?'':'0';g.classList.toggle('sel',!!(S.detail&&S.detail.type==='agent'&&S.detail.i===i));if(!rep)continue;
    const x=xAt(rep,i,tau),adv=adverse(a,x),v=g.querySelector('.nvl'),reacting=a.pop?Math.round(Math.min(1,Math.abs(x)*2.4)*a.pop):0;
    v.textContent=tau>.05?(a.pop?`${fmtO(x)} · ${reacting}/${a.pop} active`:`${fmtO(x)} ${a.m.toLowerCase()}`.slice(0,w2())):a.m.toLowerCase().slice(0,w2());v.setAttribute('fill',tau>.05&&Math.abs(x)>.01?(adv?'#B9730F':'#4362B2'):'#98A1B8');
    const dd=Math.abs(rep.X[t][i]-rep.X[t-1][i]),ph=(T*1.2+i*.37)%1,hl=g.querySelector('.halo');hl.setAttribute('stroke',adv?'#C27B14':'#618CD0');hl.setAttribute('stroke-width','2');hl.setAttribute('opacity',S.playing&&!a.pop?(dd*3*(1-ph)).toFixed(3):'0');hl.setAttribute('r',(a.nr+5+ph*14).toFixed(1))}
  const pts=$('#nP').querySelectorAll('.pt');let pi=0;
  W.edges.forEach(e=>{const el=$('#ne'+e.i);if(!el)return;el.style.opacity=S.reveal.edge?'':'0';let v=0;if(rep&&tau>0){const c=rep.C[t][e.to].find(c=>c[0]==='a'&&c[3]===e.i);if(c)v=c[2]}
    const on=Math.abs(v)>.02,adv=adverse(W.agents[e.to],v);el.setAttribute('stroke',on?(adv?'#E8C58C':'#B4C8EA'):'#E6EBF3');el.setAttribute('stroke-width',on?(1+Math.min(2.5,Math.abs(v)*14)).toFixed(1):'1');
    if(!S.reveal.edge||!on||RM||W.agents[e.from].pop)return;const n=Math.min(3,Math.ceil(Math.abs(v)*14));for(let k=0;k<n&&pi<pts.length;k++,pi++){const s=((T*(.25+Math.abs(v)*1.4))+k/n+e.i*.17)%1,[x,y]=qpt(e.g,s);const c=pts[pi];c.setAttribute('cx',x.toFixed(1));c.setAttribute('cy',y.toFixed(1));c.setAttribute('fill',adv?'#C27B14':'#4362B2');c.setAttribute('opacity',(Math.sin(s*Math.PI)*.9).toFixed(2))}});
  for(;pi<pts.length;pi++)pts[pi].setAttribute('opacity','0');
  const st=stepIdx();if(S._feedStep!==st&&rep){S._feedStep=st;const f=$('#netFeed');if(f){const items=[];if(st===0)items.push('Agents at today’s position. Press play to watch them move.');else{rep.acts.filter(a=>a.t<=st).slice(-2).forEach(a=>items.push(`<b>W${Math.max(1,Math.round(a.t*S.spec.horizon/STEPS))}</b> ${h(a.text)}`));
      W.agents.map((a,i)=>({a,i,d:rep.X[st][i]-rep.X[st-1][i],x:rep.X[st][i]})).filter(m=>Math.abs(m.d)>.01).sort((p,q)=>Math.abs(q.d)-Math.abs(p.d)).slice(0,3-items.length).forEach(m=>items.push(`<b>${h(stepWhen(st).replace('Week ','W'))}</b> ${m.a.pop?Math.round(Math.min(1,Math.abs(m.x)*2.4)*m.a.pop)+' of '+m.a.pop+' ':''}${h(m.a.n.toLowerCase())} ${arrow(m.d)} ${h(m.a.m.toLowerCase())}`))}
    f.innerHTML=items.map(x=>`<div>${x}</div>`).join('')}}
}
function applyHlNet(){if(!S.W||!S.hl)return;const nodes=$('#nN').children,set=S.hl.agents;for(let i=0;i<nodes.length;i++)if(!set.has(i))nodes[i].style.opacity='.15';S.W.edges.forEach(e=>{const el=$('#ne'+e.i);if(el&&!(set.has(e.from)&&set.has(e.to)))el.style.opacity='.08'})}

/* ---- map: zoom, pan, signal markers ---- */
function zoomBy(f,px,py){if(!S.cam)return;S.camT=null;const c=S.cam,ux=c.x+(px==null?.5:px/MW.w)*c.w,uy=c.y+(py==null?.5:py/MW.h)*c.h;let nw=Math.max(2.5,Math.min(1100,c.w*f));const k=nw/c.w;S.cam={x:ux-(ux-c.x)*k,y:uy-(uy-c.y)*k,w:nw,h:c.h*k};applyCam()}
function initZoom(){
  const wrap=$('#mapWrap');wrap.insertAdjacentHTML('beforeend','<div class="zoombar"><button id="zIn" aria-label="Zoom in">+</button><button id="zOut" aria-label="Zoom out">−</button><button id="zFit" aria-label="Fit the simulated area">Fit</button><button id="zAll" aria-label="Show all of Africa">Africa</button></div>');
  $('#zIn').onclick=()=>zoomBy(.6);$('#zOut').onclick=()=>zoomBy(1.6);$('#zFit').onclick=()=>S.W&&flyTo(bbFor(fullGeo(S.W.geo)));$('#zAll').onclick=()=>flyTo(bbFor(mkGeo('africa',{})));
  const m=$('#map');m.addEventListener('wheel',e=>{e.preventDefault();const r=m.getBoundingClientRect();zoomBy(e.deltaY>0?1.15:.87,e.clientX-r.left,e.clientY-r.top)},{passive:false});
  let drag=null;m.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:S.cam.x,cy:S.cam.y,moved:false}});
  window.addEventListener('pointermove',e=>{if(!drag||!S.cam)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;if(drag.moved){S.camT=null;S.cam={...S.cam,x:drag.cx-dx*U(),y:drag.cy-dy*U()};applyCam();m.style.cursor='grabbing'}});
  window.addEventListener('pointerup',()=>{if(drag&&drag.moved){m.addEventListener('click',ev=>{ev.stopPropagation();ev.preventDefault()},{capture:true,once:true})}drag=null;m.style.cursor=''});
}
const _dh=drawHeat;
drawHeat=function(T){_dh(T);const W=S.W;if(!W||!S.cam||!S.reveal.sig)return;
  const toS=(x,y)=>[(x-S.cam.x)/S.cam.w*MW.w,(y-S.cam.y)/S.cam.h*MW.h],P=W.placeIdx,placed=[];
  const sigs=W.signals.map((s,k)=>({s,k})).filter(o=>o.s.on&&(!S.hl||S.hl.k===o.k)).sort((a,b)=>b.s.strength*b.s.conf-a.s.strength*a.s.conf);
  hctx.font='600 11px Geist, Arial, sans-serif';
  sigs.forEach(({s,k},rank)=>{const p=P[s.places[0]];if(!p)return;let [x,y]=toS(p.x,p.y);if(x<-20||y<-20||x>MW.w+20||y>MW.h+20)return;
    const a=W.agents[s.tg[0][0]],adv=adverse(a,s.tg[0][1]),col=adv?'#C27B14':'#4362B2',pul=RM?0:(T*.7+k*.3)%1;
    hctx.strokeStyle=col;hctx.globalAlpha=(1-pul)*.6;hctx.lineWidth=1.5;hctx.beginPath();hctx.arc(x,y,6+pul*18,0,6.2832);hctx.stroke();hctx.globalAlpha=1;
    hctx.fillStyle='#fff';hctx.beginPath();hctx.arc(x,y,6.5,0,6.2832);hctx.fill();hctx.fillStyle=col;hctx.beginPath();hctx.arc(x,y,4.5,0,6.2832);hctx.fill();
    if(rank>=4)return;const txt=(s.title.length>34?s.title.slice(0,33)+'…':s.title),tw=hctx.measureText(txt).width+18;let lx=x+10,ly=y-24;if(lx+tw>MW.w-58)lx=x-10-tw;lx=Math.max(8,Math.min(MW.w-58-tw,lx));
    for(let tries=0;tries<6&&placed.some(r=>!(lx+tw<r[0]||lx>r[0]+r[2]||ly+20<r[1]||ly>r[1]+r[3]));tries++)ly+=22;
    if(ly<30)ly=30;placed.push([lx,ly,tw,20]);
    hctx.fillStyle='rgba(255,255,255,.96)';hctx.strokeStyle='#D3DCEA';hctx.lineWidth=1;rr(hctx,lx,ly,tw,20,10);hctx.fill();hctx.stroke();
    hctx.fillStyle=col;hctx.beginPath();hctx.arc(lx+9,ly+10,3,0,6.2832);hctx.fill();hctx.fillStyle='#1F273F';hctx.fillText(txt,lx+15,ly+14);
    hctx.strokeStyle='#D3DCEA';hctx.beginPath();hctx.moveTo(x,y);hctx.lineTo(lx<x?lx+tw:lx,ly+10);hctx.stroke()});
};
function rr(c,x,y,w,h2,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h2,r);c.arcTo(x+w,y+h2,x,y+h2,r);c.arcTo(x,y+h2,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
/* ---- simple home ---- */
function renderSimpleExamples(){$('#ex').innerHTML='<span class="trylbl">Try</span>'+EXAMPLES2.slice(0,4).map(([k,q])=>`<button type="button" class="exlink" data-q="${h(q)}">${h(q)}</button>`).join('')}
initZoom();renderSimpleExamples();

/* ===== v7: consulting-grade exhibits ===== */
const EX_INK='#1F273F',EX_BLUE='#4362B2',EX_B2='#8FAEDF',EX_B3='#C7D5EE',EX_B4='#E6EDF8',EX_AMB='#C27B14',EX_AMB2='#E8C58C',EX_GRID='#EDF1F7',EX_TX='#5F6984';
function exhFan(mc,W,small){
  const Q=[];for(let t=0;t<=STEPS;t++){const v=mc.runs.map(r=>r.series[t]*30);Q.push([.1,.25,.5,.75,.9].map(p=>quant(v,p)))}
  const w=600,hh=small?220:290,L=50,R=118,T=26,B=40,all=[0,...Q.flat()],tk=niceTicks(Math.min(...all),Math.max(...all),5),mn=Math.min(tk[0],...all),mx=Math.max(tk[tk.length-1],...all);
  const sx=t=>L+t/STEPS*(w-L-R),sy=v=>T+(mx-v)/((mx-mn)||1)*(hh-T-B);
  const band=(lo,hi)=>Q.map((q,t)=>`${sx(t)},${sy(q[hi])}`).join(' ')+' '+Q.slice().reverse().map((q,i)=>`${sx(STEPS-i)},${sy(q[lo])}`).join(' ');
  const e=Q[STEPS],best=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0],acts=(best.rep.acts||[]).slice(0,2);
  const evT=W.events.length?1:null;
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Outcome range over time">
   <rect x="${sx(STEPS*2/3)}" y="${T}" width="${sx(STEPS)-sx(STEPS*2/3)}" height="${hh-T-B}" fill="#FAFBFD"/>
   <text x="${sx(STEPS)-6}" y="${hh-B-8}" font-size="9.5" fill="${EX_TX}" letter-spacing=".06em" text-anchor="end">OUTCOME WINDOW</text>
   ${tk.map(v=>`<line x1="${L}" x2="${w-R}" y1="${sy(v)}" y2="${sy(v)}" stroke="${v===0?'#9AA3B8':EX_GRID}" stroke-width="${v===0?1.2:1}"/><text x="${L-10}" y="${sy(v)+4}" font-size="11" fill="${EX_TX}" text-anchor="end" font-weight="${v===0?600:400}">${v>0?'+':''}${v}%</text>`).join('')}
   <polygon points="${band(0,4)}" fill="${EX_B4}"/><polygon points="${band(1,3)}" fill="${EX_B3}"/>
   <polyline points="${Q.map((q,t)=>`${sx(t)},${sy(q[2])}`).join(' ')}" fill="none" stroke="${EX_INK}" stroke-width="2.8" stroke-linejoin="round"/>
   ${Q.map((q,t)=>`<circle cx="${sx(t)}" cy="${sy(q[2])}" r="${t===STEPS?5:2.5}" fill="${t===STEPS?EX_INK:'#fff'}" stroke="${EX_INK}" stroke-width="1.6"/>`).join('')}
   ${evT?`<line x1="${sx(evT)}" x2="${sx(evT)}" y1="${T}" y2="${hh-B}" stroke="${EX_BLUE}" stroke-dasharray="3 3"/><text x="${sx(evT)+5}" y="${T+12}" font-size="10.5" fill="${EX_BLUE}" font-weight="600">${h(oneLine(W.events[0].label,22))} applied</text>`:''}
   ${acts.map((a,i)=>`<line x1="${sx(a.t)}" x2="${sx(a.t)}" y1="${T+34+i*16}" y2="${sy(Q[a.t][2])}" stroke="${EX_AMB}" stroke-dasharray="2 3"/><circle cx="${sx(a.t)}" cy="${sy(Q[a.t][2])}" r="4" fill="${EX_AMB}"/><text x="${sx(a.t)+(a.t>STEPS/2?-5:5)}" y="${T+30+i*16}" font-size="10.5" fill="${EX_AMB}" font-weight="600" text-anchor="${a.t>STEPS/2?'end':'start'}">${h(oneLine(a.text,30))}</text>`).join('')}
   <g transform="translate(${w-R+12},0)">
    <text x="0" y="${sy(e[2])-6}" font-size="20" font-weight="800" fill="${EX_INK}">${e[2]>=0?'+':''}${e[2].toFixed(1)}%</text><text x="0" y="${sy(e[2])+9}" font-size="10" fill="${EX_TX}">median run</text>
    <line x1="-6" x2="-1" y1="${sy(e[4])}" y2="${sy(e[4])}" stroke="${EX_TX}"/><line x1="-6" x2="-1" y1="${sy(e[0])}" y2="${sy(e[0])}" stroke="${EX_TX}"/><line x1="-1" x2="-1" y1="${sy(e[4])}" y2="${sy(e[0])}" stroke="${EX_TX}"/>
    <text x="4" y="${Math.max(T+8,sy(e[4])-14)}" font-size="10" fill="${EX_TX}">80%: ${e[0].toFixed(1)} to ${e[4].toFixed(1)}</text>
    <text x="4" y="${Math.min(hh-B+14,sy(e[0])+24)}" font-size="10" fill="${EX_TX}">50%: ${e[1].toFixed(1)} to ${e[3].toFixed(1)}</text></g>
   ${Array.from({length:STEPS+1},(_,t)=>`<text x="${sx(t)}" y="${hh-B+18}" font-size="11" fill="${EX_TX}" text-anchor="middle" font-weight="${t===STEPS?600:400}">${t===0?'Now':stepWhen(t).replace('Week ','W').replace('Month ','M')}</text>`).join('')}
   <g transform="translate(${L},${hh-10})"><rect width="14" height="8" fill="${EX_B3}"/><text x="19" y="8" font-size="10" fill="${EX_TX}">50% of runs</text><rect x="92" width="14" height="8" fill="${EX_B4}"/><text x="111" y="8" font-size="10" fill="${EX_TX}">80% of runs</text><line x1="190" x2="206" y1="4" y2="4" stroke="${EX_INK}" stroke-width="2.6"/><text x="211" y="8" font-size="10" fill="${EX_TX}">median</text>${acts.length?`<circle cx="268" cy="4" r="4" fill="${EX_AMB}"/><text x="276" y="8" font-size="10" fill="${EX_TX}">turning point</text>`:''}</g></svg>`;
}
function exhPaths(mc){
  const ps=mc.paths.slice().sort((a,b)=>b.prob-a.prob),w=600,L=0,barH=34,rowH=40,top=barH+44,hh=top+ps.length*rowH+6;
  const col=(p,i)=>i===0?EX_INK:(p.id==='C'||p.id==='D')?EX_AMB2:EX_B2;let cx=0;
  const stack=ps.map((p,i)=>{const wd=(w)*p.prob,x=cx;cx+=wd;return `<rect x="${x}" y="8" width="${Math.max(1,wd-2)}" height="${barH}" fill="${col(p,i)}"/>${wd>38?`<text x="${x+wd/2}" y="${8+barH/2+5}" font-size="13" font-weight="700" fill="${i===0?'#fff':EX_INK}" text-anchor="middle">${Math.round(p.prob*100)}%</text>`:''}${wd>22?`<text x="${x+6}" y="${8+barH+16}" font-size="10.5" fill="${EX_TX}" font-weight="600">${p.id}</text>`:''}`}).join('');
  const mx=Math.max(...ps.map(p=>Math.abs(p.mean*30)),.1);
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Share of runs by path">${stack}
   <text x="0" y="${top-6}" font-size="10" fill="${EX_TX}" letter-spacing=".06em">PATH</text><text x="${w-200}" y="${top-6}" font-size="10" fill="${EX_TX}" letter-spacing=".06em">RESULT ON THIS PATH</text>
   ${ps.map((p,i)=>{const y=top+i*rowH,bw=Math.abs(p.mean*30)/mx*120,neg=p.mean<0;return `<line x1="0" x2="${w}" y1="${y}" y2="${y}" stroke="${EX_GRID}"/><rect x="0" y="${y+12}" width="10" height="10" fill="${col(p,i)}"/><text x="18" y="${y+21}" font-size="12.5" fill="${EX_INK}" font-weight="${i===0?700:500}">${p.id} · ${h(oneLine(p.title,44))}</text>
     <text x="${w-210}" y="${y+21}" font-size="12" fill="${EX_TX}" text-anchor="end">${Math.round(p.prob*100)}%</text><rect x="${w-200}" y="${y+10}" width="${Math.max(2,bw)}" height="14" fill="${neg?EX_AMB:EX_BLUE}" opacity=".85"/><text x="${w-200+Math.max(2,bw)+6}" y="${y+21}" font-size="12" font-weight="700" fill="${neg?EX_AMB:EX_INK}">${fmtO(p.mean)}</text>`}).join('')}</svg>`;
}
function exhDrivers(C){
  const items=C.items.filter(x=>Math.abs(x.v*30)>=.05).sort((a,b)=>a.type==='e'?-1:b.type==='e'?1:a.type==='o'?1:b.type==='o'?-1:Math.abs(b.v)-Math.abs(a.v)).slice(0,7);
  const rows=[{name:'Today',v:0,type:'start'},...items,{name:'Net change by end of period',v:C.all,type:'t'}];let cum=0;
  const seg=rows.map(r=>{if(r.type==='start')return {r,a:0,b:0};if(r.type==='t')return {r,a:0,b:r.v};const a=cum;cum+=r.v;return {r,a,b:cum}});
  const vals=[0,...seg.flatMap(s=>[s.a*30,s.b*30])],tk=niceTicks(Math.min(...vals),Math.max(...vals),5),mn=Math.min(tk[0],...vals),mx=Math.max(tk[tk.length-1],...vals);
  const w=600,rowH=31,L=236,R=62,T=22,hh=rows.length*rowH+T+30,sx=v=>L+(v-mn)/((mx-mn)||1)*(w-L-R);
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Contribution of each driver"><text x="${L}" y="12" font-size="10" fill="${EX_TX}" letter-spacing=".06em">TAKES AWAY ◀</text><text x="${w-R}" y="12" font-size="10" fill="${EX_TX}" letter-spacing=".06em" text-anchor="end">▶ ADDS</text>
   ${tk.map(v=>`<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${hh-26}" stroke="${v===0?'#9AA3B8':EX_GRID}"/><text x="${sx(v)}" y="${hh-10}" font-size="10.5" fill="${EX_TX}" text-anchor="middle">${v>0?'+':''}${v}</text>`).join('')}
   ${seg.map((s,i)=>{const y=T+i*rowH,tot=s.r.type==='t',st=s.r.type==='start',x0=sx(Math.min(s.a,s.b)*30),x1=sx(Math.max(s.a,s.b)*30),col=tot?EX_INK:s.r.v>=0?EX_BLUE:EX_AMB;
     return `${tot?`<line x1="0" x2="${w}" y1="${y+2}" y2="${y+2}" stroke="${EX_INK}"/>`:''}<text x="0" y="${y+19}" font-size="12" fill="${EX_INK}" font-weight="${tot||s.r.type==='e'?700:500}">${h(oneLine(s.r.name,34))}</text>
      ${st?`<circle cx="${sx(0)}" cy="${y+14}" r="4" fill="${EX_INK}"/>`:`<rect x="${x0}" y="${y+6}" width="${Math.max(1.5,x1-x0)}" height="17" fill="${col}" ${s.r.type==='o'?'fill-opacity=".4"':''}/>`}
      ${i<seg.length-1&&!tot&&seg[i+1].r.type!=='t'?`<line x1="${sx(s.b*30)}" x2="${sx(s.b*30)}" y1="${y+23}" y2="${y+rowH+6}" stroke="#9AA3B8" stroke-dasharray="2 2"/>`:''}
      ${st?'':`<text x="${s.r.v>=0||tot?x1+6:x0-6}" y="${y+19}" font-size="11.5" font-weight="700" fill="${col}" text-anchor="${s.r.v>=0||tot?'start':'end'}">${(s.r.v*30>=0?'+':'−')+Math.abs(s.r.v*30).toFixed(1)}</text>`}`}).join('')}</svg>`;
}
function exhTornado(sens){
  const rows=sens.slice(0,5),base=S.mc.p50*30,vals=[base,...rows.flatMap(x=>[x.lo*30,x.hi*30])],tk=niceTicks(Math.min(...vals),Math.max(...vals),5),mn=Math.min(tk[0],...vals),mx=Math.max(tk[tk.length-1],...vals);
  const w=600,rowH=44,L=236,R=50,T=28,hh=rows.length*rowH+T+30,sx=v=>L+(v-mn)/((mx-mn)||1)*(w-L-R);
  return `<svg viewBox="0 0 ${w} ${hh}" role="img" aria-label="Sensitivity to unknowns">
   ${tk.map(v=>`<line x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${hh-26}" stroke="${EX_GRID}"/><text x="${sx(v)}" y="${hh-10}" font-size="10.5" fill="${EX_TX}" text-anchor="middle">${v>0?'+':''}${v}%</text>`).join('')}
   <line x1="${sx(base)}" x2="${sx(base)}" y1="${T-8}" y2="${hh-26}" stroke="${EX_INK}" stroke-width="1.6"/><text x="${sx(base)}" y="${T-12}" font-size="10.5" font-weight="700" fill="${EX_INK}" text-anchor="middle">Central ${base>=0?'+':''}${base.toFixed(1)}%</text>
   ${rows.map((x,i)=>{const y=T+i*rowH,lo=x.lo*30,hi=x.hi*30,a=x.a,lvl=a.verified?'Verified':a.userSet?'Set by you':impactOf(x.swing)+' impact';return `<text x="0" y="${y+17}" font-size="12.5" font-weight="600" fill="${EX_INK}">${h(oneLine(a.label,32))}</text><text x="0" y="${y+31}" font-size="10.5" fill="${a.verified?'#2F7A5A':EX_TX}">${lvl}</text>
     <rect x="${sx(Math.min(lo,base))}" y="${y+10}" width="${Math.max(1,Math.abs(sx(base)-sx(lo)))}" height="18" fill="${EX_AMB2}"/><rect x="${sx(Math.min(hi,base))}" y="${y+10}" width="${Math.max(1,Math.abs(sx(hi)-sx(base)))}" height="18" fill="${EX_B2}"/>
     <text x="${sx(Math.min(lo,hi))-5}" y="${y+23}" font-size="10.5" fill="${EX_TX}" text-anchor="end">${lo>=0?'+':''}${lo.toFixed(1)}</text><text x="${sx(Math.max(lo,hi))+5}" y="${y+23}" font-size="10.5" fill="${EX_TX}">${hi>=0?'+':''}${hi.toFixed(1)}</text>`}).join('')}
   <g transform="translate(${L},${hh-2})"></g></svg>`;
}
const _re=renderExhibits;
renderExhibits=function(){_re();const W=S.W,mc=S.mc,C=S.contrib,best=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0],top=C.items.filter(x=>x.type!=='o').sort((a,b)=>Math.abs(b.v)-Math.abs(a.v))[0],sens=ensureSens();
  const kf=`<div class="kfig"><div><span>Central result</span><b>${fmtO(mc.p50)}</b><i>median of ${mc.N} runs</i></div><div><span>Range (80% of runs)</span><b>${(Math.abs(mc.p90-mc.p10)*30).toFixed(1)} pts</b><i>${fmtO(mc.p10)} to ${fmtO(mc.p90)}</i></div><div><span>Most likely path</span><b>${Math.round(best.prob*100)}%</b><i>${h(oneLine(best.title,30))}</i></div><div><span>Largest driver</span><b>${top?pts(top.v):'—'}</b><i>${top?h(oneLine(top.type==='e'?'Your change':top.name,30)):''}</i></div><div><span>Top unknown swing</span><b>${sens[0]?(sens[0].swing*30).toFixed(1)+' pts':'—'}</b><i>${sens[0]?h(oneLine(sens[0].a.label,30)):''}</i></div></div>`;
  $('#exhibits .exhead').insertAdjacentHTML('afterend',kf);
  const names=['Outcome trajectory','Path probabilities','Driver bridge','Sensitivity'];
  $$('#exhibits .exh .no').forEach((el,i)=>{el.innerHTML=`Exhibit ${i+1} <span>| ${names[i]}</span>`});
  $$('#exhibits .exh .src').forEach(el=>{el.innerHTML=`<b>Note:</b> simulated index changes; paths are possibilities, not forecasts. <b>Source:</b> Verisavo Market Simulation, ${mc.N} runs, ${W.signals.filter(s=>s.on).length} signals; evidence illustrative.`});
};
