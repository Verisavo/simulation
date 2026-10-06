/* =====================================================================
   Verisavo Universal Market Simulation — engine (no DOM)
   Geography, sector modules, question interpreter, world builder,
   agent simulation with memory and actions, branching futures.
   All market data below is illustrative.
   ===================================================================== */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gaussOf(r){return()=>{let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}}
function hashStr(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}

/* ---------- Projection (matches the embedded map) ---------- */
const PK=10,PR=Math.PI/180,mercY=l=>Math.log(Math.tan(Math.PI/4+l*PR/2))/PR,PY0=mercY(38);
const proj=(lat,lon)=>[(lon+26)*PK,(PY0-mercY(lat))*PK];

/* ---------- Regions (UN M49 groupings) ---------- */
const REG={
  North:['012','818','434','504','788','729','732'],
  West:['204','854','132','384','270','288','324','624','430','466','478','562','566','686','694','768'],
  Central:['024','120','140','148','178','180','226','266','678'],
  East:['108','174','262','232','231','404','450','454','480','508','646','690','706','728','834','800','894','716'],
  Southern:['072','748','426','516','710']
};
const REG_NAME={North:'North Africa',West:'West Africa',Central:'Central Africa',East:'East Africa',Southern:'Southern Africa'};
const REG_DEF={
  North:{income:.55,informal:.45,infra:.6,digital:.45,competition:.6,climate:.3,fx:.6,evidence:.3},
  West:{income:.35,informal:.8,infra:.4,digital:.5,competition:.55,climate:.55,fx:.65,evidence:.28},
  Central:{income:.3,informal:.85,infra:.25,digital:.35,competition:.4,climate:.55,fx:.4,evidence:.2},
  East:{income:.35,informal:.75,infra:.45,digital:.7,competition:.5,climate:.5,fx:.45,evidence:.28},
  Southern:{income:.5,informal:.5,infra:.6,digital:.55,competition:.6,climate:.45,fx:.5,evidence:.3}
};
const regionOf=id=>Object.keys(REG).find(r=>REG[r].includes(id))||'West';
const PROFILE_KEYS=['income','informal','infra','digital','competition','climate','fx','evidence'];
const PROFILE_LABEL={income:'Household income',informal:'Informal retail share',infra:'Infrastructure quality',digital:'Digital and mobile money adoption',competition:'Competitive intensity',climate:'Climate exposure',fx:'Currency pressure',evidence:'Verisavo evidence coverage'};

/* ---------- Featured countries: cities, districts, corridors ----------
   city: [id, name, state, lat, lon, overrides, districts[[id,name,lat,lon,tag]]] */
const FEAT={
 '566':{adj:['nigerian'],p:{income:.38,informal:.82,infra:.38,digital:.55,competition:.7,climate:.55,fx:.8,evidence:.8},
  cities:[
   ['lagos','Lagos','Lagos State',6.52,3.38,{port:1,income:.5,infra:.45,competition:.85,informal:.7,evidence:.85},[['ikeja','Ikeja',6.60,3.35,'commercial'],['mushin','Mushin',6.535,3.35,'market'],['lagosisland','Lagos Island',6.455,3.395,'market'],['apapa','Apapa',6.44,3.36,'port'],['lekki','Lekki',6.44,3.52,'commercial']]],
   ['ibadan','Ibadan','Oyo State',7.38,3.94,{income:.36,informal:.88,competition:.55,evidence:.75},[['bodija','Bodija',7.43,3.92,'market'],['dugbe','Dugbe',7.39,3.885,'market'],['ojaba',"Oja'ba",7.372,3.905,'market'],['challenge','Challenge',7.35,3.875,'residential'],['mokola','Mokola',7.405,3.89,'commercial']]],
   ['abuja','Abuja','Federal Capital Territory',9.06,7.49,{capital:1,income:.52,informal:.62,infra:.6,evidence:.7},[['wuse','Wuse',9.075,7.47,'market'],['garki','Garki',9.035,7.49,'commercial'],['nyanya','Nyanya',9.02,7.57,'market']]],
   ['kano','Kano','Kano State',12.0,8.52,{income:.3,informal:.9,infra:.4,competition:.55,climate:.6,evidence:.65},[['kantinkwari','Kantin Kwari',12.0,8.51,'market'],['sabongari','Sabon Gari',12.012,8.535,'market'],['dawanau','Dawanau',12.07,8.47,'market']]],
   ['kaduna','Kaduna','Kaduna State',10.52,7.44,{income:.32,informal:.87,evidence:.55},[['kadunacentral','Central Market',10.515,7.435,'market'],['sabontasha','Sabon Tasha',10.45,7.48,'residential'],['kawo','Kawo',10.58,7.45,'market']]],
   ['portharcourt','Port Harcourt','Rivers State',4.82,7.03,{port:1,income:.45,climate:.7,evidence:.6},[['mile1','Mile 1',4.795,7.0,'market'],['onne','Onne',4.71,7.15,'port'],['rumuokoro','Rumuokoro',4.87,7.0,'market']]],
   ['onitsha','Onitsha','Anambra State',6.15,6.79,{income:.4,informal:.92,competition:.75,evidence:.6},[['onitshamain','Main Market',6.155,6.78,'market'],['headbridge','Head Bridge',6.14,6.765,'market']]]
  ],routes:[['lagos','ibadan'],['ibadan','abuja'],['abuja','kaduna'],['kaduna','kano'],['lagos','onitsha'],['onitsha','portharcourt'],['abuja','onitsha']]},
 '288':{adj:['ghanaian'],p:{income:.45,informal:.75,infra:.5,digital:.65,competition:.55,climate:.45,fx:.7,evidence:.65},
  cities:[
   ['accra','Accra','Greater Accra',5.60,-0.19,{port:1,capital:1,income:.52,evidence:.7},[['makola','Makola',5.55,-0.21,'market'],['kaneshie','Kaneshie',5.57,-0.24,'market'],['tema','Tema',5.64,0.02,'port'],['madina','Madina',5.68,-0.17,'residential']]],
   ['kumasi','Kumasi','Ashanti Region',6.69,-1.62,{evidence:.6},[['kejetia','Kejetia',6.70,-1.625,'market'],['adum','Adum',6.688,-1.632,'commercial']]],
   ['tamale','Tamale','Northern Region',9.40,-0.85,{income:.3,climate:.6,evidence:.45},[['aboabo','Aboabo Market',9.41,-0.84,'market']]]
  ],routes:[['accra','kumasi'],['kumasi','tamale']]},
 '404':{adj:['kenyan'],p:{income:.42,informal:.7,infra:.52,digital:.85,competition:.65,climate:.5,fx:.45,evidence:.72},
  cities:[
   ['nairobi','Nairobi','Nairobi County',-1.29,36.82,{capital:1,income:.55,competition:.75,evidence:.8},[['gikomba','Gikomba',-1.28,36.84,'market'],['eastleigh','Eastleigh',-1.27,36.852,'market'],['westlands','Westlands',-1.265,36.80,'commercial'],['kibera','Kibera',-1.31,36.785,'residential']]],
   ['mombasa','Mombasa','Mombasa County',-4.04,39.67,{port:1,evidence:.65},[['kilindini','Kilindini Port',-4.06,39.65,'port'],['kongowea','Kongowea',-4.03,39.69,'market']]],
   ['kisumu','Kisumu','Kisumu County',-0.09,34.77,{income:.32,climate:.65,evidence:.55},[['kibuye','Kibuye Market',-0.09,34.76,'market']]],
   ['nakuru','Nakuru','Nakuru County',-0.30,36.07,{evidence:.55},[]],
   ['eldoret','Eldoret','Uasin Gishu County',0.51,35.27,{evidence:.5},[]]
  ],routes:[['mombasa','nairobi'],['nairobi','nakuru'],['nakuru','eldoret'],['nakuru','kisumu']]},
 '710':{adj:['south african'],p:{income:.62,informal:.35,infra:.75,digital:.6,competition:.75,climate:.35,fx:.5,evidence:.7},
  cities:[
   ['johannesburg','Johannesburg','Gauteng',-26.20,28.05,{income:.65,evidence:.75},[['soweto','Soweto',-26.27,27.86,'residential'],['sandton','Sandton',-26.11,28.06,'commercial'],['alexandra','Alexandra',-26.10,28.10,'market']]],
   ['pretoria','Pretoria','Gauteng',-25.75,28.19,{capital:1,evidence:.65},[['marabastad','Marabastad',-25.74,28.18,'market']]],
   ['capetown','Cape Town','Western Cape',-33.92,18.42,{port:1,income:.6,evidence:.7},[['khayelitsha','Khayelitsha',-34.04,18.68,'residential'],['bellville','Bellville',-33.90,18.63,'market']]],
   ['durban','Durban','KwaZulu-Natal',-29.86,31.02,{port:1,evidence:.65},[['durbanport','Durban Harbour',-29.87,31.03,'port'],['umlazi','Umlazi',-29.97,30.88,'residential'],['warwick','Warwick Junction',-29.855,31.01,'market']]]
  ],routes:[['durban','johannesburg'],['johannesburg','pretoria'],['johannesburg','capetown']]},
 '818':{adj:['egyptian'],p:{income:.5,informal:.5,infra:.65,digital:.45,competition:.65,climate:.2,fx:.75,evidence:.55},
  cities:[
   ['cairo','Cairo','Cairo Governorate',30.04,31.24,{capital:1,evidence:.6},[['attaba','Attaba',30.052,31.247,'market'],['nasrcity','Nasr City',30.06,31.33,'commercial'],['giza','Giza',30.01,31.21,'residential']]],
   ['alexandria','Alexandria','Alexandria Governorate',31.20,29.92,{port:1,evidence:.55},[['alexport','Alexandria Port',31.18,29.87,'port'],['manshiyya','Manshiyya',31.20,29.895,'market']]]
  ],routes:[['cairo','alexandria']]},
 '231':{adj:['ethiopian'],p:{income:.28,informal:.85,infra:.38,digital:.35,competition:.4,climate:.5,fx:.7,evidence:.45},
  cities:[
   ['addis','Addis Ababa','Addis Ababa',9.03,38.74,{capital:1,income:.38,evidence:.55},[['merkato','Merkato',9.035,38.73,'market'],['bole','Bole',8.99,38.79,'commercial'],['piassa','Piassa',9.037,38.752,'market']]],
   ['adama','Adama','Oromia',8.54,39.27,{evidence:.35},[]],
   ['diredawa','Dire Dawa','Dire Dawa',9.59,41.86,{evidence:.35},[]]
  ],routes:[['addis','adama'],['adama','diredawa']]},
 '384':{adj:['ivorian'],p:{income:.45,informal:.75,infra:.55,digital:.55,competition:.55,climate:.45,fx:.3,evidence:.55},
  cities:[
   ['abidjan','Abidjan','District of Abidjan',5.36,-4.01,{port:1,evidence:.6},[['adjame','Adjamé',5.37,-4.02,'market'],['treichville','Treichville',5.30,-4.01,'market'],['abidjanport','Port of Abidjan',5.285,-3.99,'port'],['yopougon','Yopougon',5.34,-4.08,'residential']]],
   ['yamoussoukro','Yamoussoukro','Yamoussoukro',6.82,-5.28,{capital:1,evidence:.4},[]],
   ['bouake','Bouaké','Vallée du Bandama',7.69,-5.03,{evidence:.4},[]]
  ],routes:[['abidjan','yamoussoukro'],['yamoussoukro','bouake']]},
 '686':{adj:['senegalese'],p:{income:.4,informal:.75,infra:.55,digital:.6,competition:.5,climate:.4,fx:.3,evidence:.5},
  cities:[
   ['dakar','Dakar','Dakar Region',14.69,-17.45,{port:1,capital:1,evidence:.55},[['sandaga','Sandaga',14.67,-17.435,'market'],['dakarport','Port of Dakar',14.68,-17.42,'port'],['pikine','Pikine',14.75,-17.39,'residential']]],
   ['thies','Thiès','Thiès Region',14.79,-16.93,{evidence:.4},[]],
   ['touba','Touba','Diourbel Region',14.85,-15.88,{evidence:.35},[]]
  ],routes:[['dakar','thies'],['thies','touba']]},
 '646':{adj:['rwandan'],p:{income:.35,informal:.65,infra:.65,digital:.7,competition:.4,climate:.45,fx:.4,evidence:.55},
  cities:[
   ['kigali','Kigali','City of Kigali',-1.95,30.06,{capital:1,evidence:.65},[['nyabugogo','Nyabugogo',-1.94,30.045,'market'],['kimironko','Kimironko',-1.94,30.13,'market'],['remera','Remera',-1.955,30.11,'commercial']]],
   ['musanze','Musanze','Northern Province',-1.50,29.63,{evidence:.4},[]],
   ['huye','Huye','Southern Province',-2.60,29.74,{evidence:.4},[]]
  ],routes:[['kigali','musanze'],['kigali','huye']]},
 '834':{adj:['tanzanian'],p:{income:.33,informal:.8,infra:.45,digital:.7,competition:.45,climate:.5,fx:.45,evidence:.5},
  cities:[
   ['dar','Dar es Salaam','Dar es Salaam Region',-6.79,39.21,{port:1,evidence:.6},[['kariakoo','Kariakoo',-6.82,39.27,'market'],['darport','Dar es Salaam Port',-6.835,39.29,'port'],['kinondoni','Kinondoni',-6.77,39.24,'residential']]],
   ['dodoma','Dodoma','Dodoma Region',-6.16,35.75,{capital:1,evidence:.4},[]],
   ['arusha','Arusha','Arusha Region',-3.37,36.68,{evidence:.45},[]],
   ['mwanza','Mwanza','Mwanza Region',-2.52,32.90,{climate:.55,evidence:.4},[]]
  ],routes:[['dar','dodoma'],['dodoma','mwanza'],['dodoma','arusha']]},
 '800':{adj:['ugandan'],p:{income:.32,informal:.82,infra:.4,digital:.7,competition:.45,climate:.5,fx:.45,evidence:.5},
  cities:[
   ['kampala','Kampala','Central Region',0.35,32.58,{capital:1,evidence:.6},[['owino','Owino Market',0.31,32.57,'market'],['kikuubo','Kikuubo',0.315,32.58,'market'],['nakawa','Nakawa',0.33,32.62,'market']]],
   ['gulu','Gulu','Northern Region',2.78,32.30,{evidence:.35},[]],
   ['mbarara','Mbarara','Western Region',-0.61,30.65,{evidence:.4},[]]
  ],routes:[['kampala','gulu'],['kampala','mbarara']]},
 '504':{adj:['moroccan'],p:{income:.55,informal:.5,infra:.7,digital:.5,competition:.6,climate:.3,fx:.35,evidence:.45},
  cities:[
   ['casablanca','Casablanca','Casablanca-Settat',33.57,-7.59,{port:1,evidence:.5},[['derbomar','Derb Omar',33.59,-7.61,'market'],['casaport','Port of Casablanca',33.605,-7.62,'port']]],
   ['rabat','Rabat','Rabat-Salé-Kénitra',34.02,-6.84,{capital:1,evidence:.45},[]],
   ['marrakesh','Marrakesh','Marrakesh-Safi',31.63,-8.01,{evidence:.4},[]],
   ['fez','Fez','Fès-Meknès',34.03,-5.00,{evidence:.4},[]],
   ['tangier','Tangier','Tanger-Tétouan-Al Hoceïma',35.77,-5.80,{port:1,evidence:.4},[]]
  ],routes:[['casablanca','rabat'],['rabat','fez'],['casablanca','marrakesh'],['rabat','tangier']]},
 '120':{adj:['cameroonian'],p:{income:.35,informal:.8,infra:.35,digital:.45,competition:.45,climate:.5,fx:.3,evidence:.45},
  cities:[
   ['douala','Douala','Littoral Region',4.05,9.77,{port:1,evidence:.5},[['marchecentral','Marché Central',4.05,9.70,'market'],['doualaport','Port of Douala',4.04,9.685,'port']]],
   ['yaounde','Yaoundé','Centre Region',3.85,11.50,{capital:1,evidence:.45},[['mokolo','Mokolo Market',3.88,11.50,'market']]],
   ['bafoussam','Bafoussam','West Region',5.48,10.42,{evidence:.35},[]]
  ],routes:[['douala','yaounde'],['douala','bafoussam']]},
 '894':{adj:['zambian'],p:{income:.33,informal:.7,infra:.45,digital:.5,competition:.4,climate:.45,fx:.65,evidence:.45},
  cities:[
   ['lusaka','Lusaka','Lusaka Province',-15.39,28.32,{capital:1,evidence:.55},[['sowetomkt','Soweto Market',-15.42,28.27,'market'],['kamwala','Kamwala',-15.43,28.29,'market']]],
   ['ndola','Ndola','Copperbelt Province',-12.96,28.64,{evidence:.4},[]],
   ['kitwe','Kitwe','Copperbelt Province',-12.80,28.21,{evidence:.4},[]],
   ['livingstone','Livingstone','Southern Province',-17.84,25.86,{evidence:.35},[]]
  ],routes:[['lusaka','ndola'],['ndola','kitwe'],['lusaka','livingstone']]}
};
const CORRIDORS=[['abidjan','accra'],['accra','lagos'],['mombasa','nairobi'],['nairobi','kampala'],['kampala','kigali'],['dar','dodoma'],['durban','johannesburg'],['johannesburg','lusaka'],['cairo','alexandria'],['dakar','abidjan'],['douala','lagos'],['addis','nairobi'],['casablanca','dakar']];

/* Index cities and districts */
const CITY={},DIST={};
for(const [cid,f] of Object.entries(FEAT)){
  f.cityIds=[];
  for(const c of f.cities){
    const [id,name,state,lat,lon,o,ds]=c; const [x,y]=proj(lat,lon);
    CITY[id]={id,name,state,lat,lon,x,y,o,cid,ds:[]}; f.cityIds.push(id);
    for(const d of ds){const [did,dn,dlat,dlon,tag]=d;const [dx,dy]=proj(dlat,dlon);DIST[did]={id:did,name:dn,lat:dlat,lon:dlon,x:dx,y:dy,tag,city:id,cid};CITY[id].ds.push(did)}
  }
}
let CTRY={}; // filled by setCountries(AFRICA data)
function setCountries(arr){CTRY={};for(const c of arr)CTRY[c.id]=c}
const COUNTRY_ALIAS={'ivory coast':'384',"cote d'ivoire":'384','côte d’ivoire':'384','drc':'180','congo-kinshasa':'180','congo brazzaville':'178','swaziland':'748','cape verde':'132','the gambia':'270','south sudan':'728','car':'140'};

function profileOf(geo){
  const p={...REG_DEF[regionOf(geo.cid)]};
  const f=FEAT[geo.cid]; if(f)Object.assign(p,f.p);
  if(geo.city){const o=CITY[geo.city].o;PROFILE_KEYS.forEach(k=>{if(o[k]!=null)p[k]=o[k]})}
  if(geo.district){const t=DIST[geo.district].tag;if(t==='market')p.informal=clamp(p.informal+.06);if(t==='commercial'){p.income=clamp(p.income+.1);p.informal=clamp(p.informal-.15)}if(t==='residential')p.income=clamp(p.income-.03)}
  return p;
}
function geoLabel(geo){
  if(geo.level==='africa')return 'Africa';
  if(geo.level==='region')return REG_NAME[geo.region];
  const cn=CTRY[geo.cid]?CTRY[geo.cid].name:'';
  if(geo.level==='country')return cn;
  const c=CITY[geo.city];
  if(geo.level==='city')return `${c.name}, ${c.state}, ${cn}`;
  return `${DIST[geo.district].name}, ${c.name}, ${cn}`;
}
function geoShort(geo){if(geo.level==='district')return DIST[geo.district].name;if(geo.level==='city')return CITY[geo.city].name;if(geo.level==='country')return CTRY[geo.cid].name;if(geo.level==='region')return REG_NAME[geo.region];return 'Africa'}
function geoCrumbs(geo){
  const out=[{level:'africa',label:'Africa'}];
  if(geo.level==='africa')return out;
  const region=geo.region||regionOf(geo.cid);
  out.push({level:'region',region,label:REG_NAME[region]});
  if(geo.level==='region')return out;
  out.push({level:'country',cid:geo.cid,region,label:CTRY[geo.cid].name});
  if(geo.level==='country')return out;
  const c=CITY[geo.city];
  out.push({level:'state',cid:geo.cid,region,city:geo.city,label:c.state,stateOnly:true});
  out.push({level:'city',cid:geo.cid,region,city:geo.city,label:c.name});
  if(geo.level==='city')return out;
  out.push({level:'district',cid:geo.cid,region,city:geo.city,district:geo.district,label:DIST[geo.district].name});
  return out;
}
function mkGeo(level,o){const g={level,...o};if(g.district&&!g.city)g.city=DIST[g.district].city;if(g.city&&!g.cid)g.cid=CITY[g.city].cid;if(g.cid&&!g.region)g.region=regionOf(g.cid);return g}

/* ---------- Agent role library ----------
   k: actor | condition | force   inv: an increase is pressure/adverse   pl: where it shows on the map */
const ROLES={
 you:{n:'Your business',m:'Sales volume',k:'actor',pl:'city',col:1,c:['Volume','Margin','Distribution reach','Market share'],up:'Expand supply and push for more outlets',dn:'Protect margin and cut weaker outlets'},
 consumers:{n:'Consumers',m:'Purchase intent',k:'actor',pl:'markets',col:5,c:['Price','Income','Availability','Preference','Convenience','Trust','Brand familiarity','Alternatives'],up:'Buy more often or trial the product',dn:'Trade down, switch brand or buy less'},
 retailers:{n:'Retailers',m:'Willingness to stock',k:'actor',pl:'markets',col:4,c:['Margin','Turnover','Demand','Stock risk','Supplier reliability','Credit','Shelf space','Customer requests','Competitor activity'],up:'Increase orders and shelf space',dn:'Reduce orders or trial alternative suppliers'},
 distributors:{n:'Distributors',m:'Delivery costs and delays',k:'actor',pl:'routes',col:3,inv:1,c:['Transport cost','Inventory','Route reliability','Order volume','Payment terms','Warehouse capacity'],up:'Raise delivery fees and cut low-volume routes',dn:'Extend routes and increase drop frequency'},
 suppliers:{n:'Suppliers',m:'Input costs',k:'actor',pl:'city',col:0,inv:1,c:['Raw material prices','Exchange rate','Energy cost','Order volume'],up:'Raise input prices',dn:'Offer better terms'},
 competitors:{n:'Competitors',m:'Competitive activity',k:'actor',pl:'markets',col:4,inv:1,c:['Pricing','Promotions','Distribution','Product changes','Advertising','Retail incentives'],up:'Run promotions or offer retailer incentives',dn:'Hold prices and protect margin'},
 prices:{n:'Shelf prices',m:'Price level',k:'condition',pl:'markets',col:4,inv:1},
 availability:{n:'Product availability',m:'Availability',k:'condition',pl:'markets',col:4},
 regulator:{n:'Regulator',m:'Regulatory pressure',k:'actor',pl:'capital',col:0,inv:1,c:['Policy objectives','Compliance','Market behaviour','Political and economic conditions'],up:'Tighten enforcement',dn:'Allow more time or relax requirements'},
 fuel:{n:'Fuel supply',m:'Fuel price',k:'force',pl:'ports',col:0,inv:1},
 transport:{n:'Transporters',m:'Operating costs',k:'actor',pl:'routes',col:1,inv:1,c:['Fuel','Route conditions','Vehicle costs','Load volume'],up:'Raise haulage rates and consolidate loads',dn:'Cut rates to win loads'},
 roads:{n:'Road network',m:'Route accessibility',k:'force',pl:'routes',col:1},
 weather:{n:'Weather conditions',m:'Rainfall disruption',k:'force',pl:'all',col:0,inv:1},
 ports:{n:'Ports',m:'Congestion',k:'force',pl:'ports',col:0,inv:1},
 importers:{n:'Importers',m:'Import delays',k:'actor',pl:'ports',col:1,inv:1,c:['Clearing time','Demurrage','Exchange rate','Order cycles'],up:'Delay orders and ration stock',dn:'Rebuild stock'},
 income:{n:'Household income',m:'Purchasing power',k:'condition',pl:'markets',col:5},
 fx:{n:'Exchange rate',m:'Currency pressure',k:'force',pl:'city',col:0,inv:1},
 power:{n:'Power supply',m:'Grid reliability',k:'force',pl:'all',col:0},
 altdist:{n:'Alternative distributors',m:'Capacity offered',k:'actor',pl:'routes',col:2,c:['Spare fleet','Route familiarity','Credit risk'],up:'Take over abandoned routes',dn:'Stay out of the area'},
 entrant:{n:'New entrant',m:'Market activity',k:'actor',pl:'markets',col:4,inv:1,c:['Price point','Retailer incentives','Brand building'],up:'Push into more outlets',dn:'Pull back'},
 farmers:{n:'Farmers',m:'Farm output',k:'actor',pl:'rural',col:0,c:['Input costs','Rainfall','Farm-gate prices','Access to market'],up:'Bring more produce to market',dn:'Hold back or lose output'},
 aggregators:{n:'Aggregators',m:'Aggregation costs',k:'actor',pl:'rural',col:2,inv:1,c:['Haulage','Storage','Farm-gate prices','Credit'],up:'Pay farmers less or pass costs on',dn:'Buy more volume'},
 wholesalers:{n:'Wholesale traders',m:'Wholesale prices',k:'actor',pl:'markets',col:3,inv:1,c:['Supply volume','Haulage costs','Demand','Storage'],up:'Raise prices or hold stock',dn:'Clear stock at lower prices'},
 foodprices:{n:'Food prices',m:'Retail food prices',k:'condition',pl:'markets',col:4,inv:1},
 households:{n:'Households',m:'Food purchasing',k:'actor',pl:'markets',col:5,c:['Income','Price','Substitutes','Market access'],up:'Buy more',dn:'Switch to cheaper staples or smaller quantities'},
 bank:{n:'Your bank',m:'Agent-channel transactions',k:'actor',pl:'city',col:1,c:['Agent recruitment','Float support','Fees','Brand trust'],up:'Recruit more agents',dn:'Consolidate the agent network'},
 bagents:{n:'Banking agents',m:'Agent viability',k:'actor',pl:'markets',col:2,c:['Commission','Cash float','Footfall','Security','Network uptime'],up:'Stay open longer and hold more float',dn:'Close or switch to a competitor'},
 bcustomers:{n:'Customers',m:'Use of agent services',k:'actor',pl:'markets',col:4,c:['Distance to branch','Fees','Trust','Network reliability','Alternatives'],up:'Deposit and transfer through agents',dn:'Stay with cash or mobile wallets'},
 merchants:{n:'Merchants',m:'Digital payment acceptance',k:'actor',pl:'markets',col:3,c:['Fees','Settlement speed','Customer requests'],up:'Accept more digital payments',dn:'Prefer cash'},
 fintech:{n:'Fintech companies',m:'Competitive activity',k:'actor',pl:'city',col:3,inv:1,c:['Fees','Product features','Agent incentives','Marketing'],up:'Cut fees and court agents',dn:'Focus elsewhere'},
 mno:{n:'Mobile networks',m:'Network coverage and reliability',k:'force',pl:'all',col:0},
 operators:{n:'Mobile operators',m:'Operator margins',k:'actor',pl:'city',col:2,c:['ARPU','Compliance cost','Spectrum','Tower costs','Tax'],up:'Invest and discount',dn:'Raise tariffs and slow capex'},
 tariffs:{n:'Tariffs',m:'Price of data and airtime',k:'condition',pl:'markets',col:3,inv:1},
 subscribers:{n:'Subscribers',m:'Data and airtime usage',k:'actor',pl:'markets',col:4,c:['Price','Network quality','Income','Alternatives'],up:'Use more data',dn:'Buy smaller bundles or consolidate SIMs'},
 towers:{n:'Infrastructure providers',m:'Network investment',k:'actor',pl:'all',col:3,c:['Operator demand','Energy costs','Funding'],up:'Build more sites',dn:'Delay rollout'},
 investors:{n:'Investors',m:'Investment appetite',k:'actor',pl:'city',col:1,c:['Returns','Regulatory certainty','Currency'],up:'Commit capital',dn:'Wait or exit'},
 mmusers:{n:'Mobile money users',m:'Transaction volume',k:'actor',pl:'markets',col:5,c:['Fees','Agent access','Trust'],up:'Transact more',dn:'Return to cash'},
 government:{n:'Government',m:'Policy intensity',k:'actor',pl:'capital',col:0,c:['Fiscal needs','Public pressure','Political timing'],up:'Push implementation',dn:'Delay or soften'},
 businesses:{n:'Businesses',m:'Business activity',k:'actor',pl:'city',col:2,c:['Costs','Demand','Compliance','Credit'],up:'Expand and hire',dn:'Cut costs and pause hiring'},
 workers:{n:'Workers',m:'Employment',k:'actor',pl:'markets',col:3,c:['Hiring','Wages','Hours'],up:'More hours and jobs',dn:'Fewer hours'},
 tradegroups:{n:'Trade groups',m:'Advocacy pressure',k:'actor',pl:'capital',col:1,inv:1,c:['Member costs','Public support'],up:'Lobby against the policy',dn:'Stay quiet'},
 consumersP:{n:'Consumers',m:'Household spending',k:'actor',pl:'markets',col:5,c:['Prices','Income','Confidence'],up:'Spend more',dn:'Cut back'},
 pricesP:{n:'Prices',m:'Consumer price level',k:'condition',pl:'markets',col:4,inv:1},
 grid:{n:'Grid power',m:'Grid reliability',k:'force',pl:'all',col:0},
 solarH:{n:'Households',m:'Solar demand',k:'actor',pl:'markets',col:4,c:['Grid reliability','Diesel costs','Upfront price','Financing','Trust in installers'],up:'Buy or finance a system',dn:'Stay on grid or generator'},
 smes:{n:'Small businesses',m:'Solar demand',k:'actor',pl:'city',col:4,c:['Generator costs','Grid reliability','Cash flow'],up:'Install solar to cut generator costs',dn:'Keep using generators'},
 installers:{n:'Solar installers',m:'Installation capacity',k:'actor',pl:'city',col:2,c:['Trained technicians','Panel imports','Demand'],up:'Hire and stock up',dn:'Hold capacity'},
 paygo:{n:'PAYG financing providers',m:'Financing availability',k:'actor',pl:'markets',col:2,c:['Repayment rates','Mobile money','Funding'],up:'Extend credit to more households',dn:'Tighten lending'},
 solarDemand:{n:'Solar demand',m:'Installations',k:'condition',pl:'markets',col:5},
 g_supplier:{n:'Suppliers',m:'Input costs',k:'actor',pl:'city',col:0,inv:1,c:['Input prices','Exchange rate','Energy'],up:'Raise prices',dn:'Offer better terms'},
 g_provider:{n:'Providers',m:'Revenue',k:'actor',pl:'city',col:1,c:['Demand','Costs','Capacity','Competition'],up:'Expand capacity',dn:'Protect margin'},
 g_channel:{n:'Channel partners',m:'Reach',k:'actor',pl:'markets',col:2,c:['Margin','Volume','Reliability'],up:'Promote and stock more',dn:'Deprioritise'},
 g_prices:{n:'Prices',m:'Price level',k:'condition',pl:'markets',col:3,inv:1},
 g_demand:{n:'Customers',m:'Demand',k:'actor',pl:'markets',col:5,c:['Price','Income','Access','Trust','Alternatives'],up:'Buy more',dn:'Buy less or switch'},
 g_competitor:{n:'Competitors',m:'Competitive activity',k:'actor',pl:'markets',col:4,inv:1,c:['Pricing','Promotions','Capacity'],up:'Compete harder',dn:'Hold back'},
 g_financing:{n:'Financing',m:'Credit availability',k:'actor',pl:'city',col:3,c:['Interest rates','Risk appetite'],up:'Lend more',dn:'Tighten'},
 g_infra:{n:'Infrastructure',m:'Reliability',k:'force',pl:'all',col:1}
};
const R_DEMAND=['consumers','households','bcustomers','subscribers','solarH','consumersP','g_demand'];
const R_PRICES=['prices','foodprices','tariffs','pricesP','g_prices'];
const R_AVAIL=['availability','g_channel','bagents','paygo'];
const R_DIST=['distributors','aggregators','g_channel','wholesalers'];
const R_SUPPLY=['suppliers','g_supplier','importers','farmers','installers'];
const R_COMP=['competitors','fintech','g_competitor'];
const R_PROVIDER=['you','bank','operators','g_provider','businesses','installers'];
const R_RETAIL=['retailers','wholesalers','merchants','g_channel'];

/* Generic-sector naming (the same structure renamed for each sector) */
const GENERIC_NAMES={
 healthcare:{label:'Healthcare',g_demand:['Patients','Care-seeking'],g_provider:['Clinics and hospitals','Patient volume'],g_channel:['Pharmacies','Reach'],g_supplier:['Drug importers and manufacturers','Input costs'],g_competitor:['Competing providers','Competitive activity'],g_financing:['Health insurance','Coverage'],g_infra:['Cold chain and logistics','Reliability'],g_prices:['Medicine and consultation prices','Price level']},
 pharma:{label:'Pharmaceuticals',g_demand:['Patients','Medicine purchases'],g_provider:['Pharmaceutical companies','Sales volume'],g_channel:['Pharmacies and drug shops','Stocking'],g_supplier:['API and packaging suppliers','Input costs'],g_competitor:['Generic importers','Competitive activity'],g_financing:['Health insurance','Coverage'],g_infra:['Cold chain','Reliability'],g_prices:['Medicine prices','Price level']},
 education:{label:'Education',g_demand:['Families','Enrolment demand'],g_provider:['Schools','Enrolment'],g_channel:['Admissions and referrals','Reach'],g_supplier:['Teacher and staff costs','Cost pressure'],g_competitor:['Competing schools','Competitive activity'],g_financing:['School-fee financing','Credit availability'],g_infra:['Transport and power','Reliability'],g_prices:['School fees','Fee level']},
 realestate:{label:'Real estate',g_demand:['Buyers and renters','Housing demand'],g_provider:['Developers','Sales and lettings'],g_channel:['Agents and brokers','Reach'],g_supplier:['Building materials','Input costs'],g_competitor:['Competing developments','Competitive activity'],g_financing:['Mortgage lenders','Credit availability'],g_infra:['Roads and utilities','Reliability'],g_prices:['Property prices and rents','Price level']},
 construction:{label:'Construction',g_demand:['Project owners','Construction demand'],g_provider:['Contractors','Order book'],g_channel:['Procurement pipelines','Reach'],g_supplier:['Cement and materials','Input costs'],g_competitor:['Competing contractors','Competitive activity'],g_financing:['Project finance','Credit availability'],g_infra:['Power and roads','Reliability'],g_prices:['Material prices','Price level']},
 insurance:{label:'Insurance',g_demand:['Households and small firms','Policy uptake'],g_provider:['Insurers','Premium income'],g_channel:['Agents and bancassurance','Reach'],g_supplier:['Claims and reinsurance costs','Cost pressure'],g_competitor:['Competing insurers','Competitive activity'],g_financing:['Mobile money partners','Payment access'],g_infra:['Digital rails','Reliability'],g_prices:['Premiums','Price level']},
 hospitality:{label:'Hospitality and tourism',g_demand:['Travellers','Bookings'],g_provider:['Hotels','Occupancy'],g_channel:['Booking platforms and tour operators','Reach'],g_supplier:['Food, energy and staff costs','Cost pressure'],g_competitor:['Competing hotels','Competitive activity'],g_financing:['Airline capacity','Seat availability'],g_infra:['Airports and roads','Reliability'],g_prices:['Room rates','Price level']},
 manufacturing:{label:'Manufacturing',g_demand:['Buyers','Orders'],g_provider:['Manufacturers','Output'],g_channel:['Distributors','Reach'],g_supplier:['Input suppliers','Input costs'],g_competitor:['Imported finished goods','Competitive activity'],g_financing:['Trade finance','Credit availability'],g_infra:['Power supply','Reliability'],g_prices:['Ex-factory prices','Price level']},
 automotive:{label:'Automotive',g_demand:['Vehicle buyers','Purchases'],g_provider:['Dealers','Unit sales'],g_channel:['Dealer network','Reach'],g_supplier:['Importers and assemblers','Landed costs'],g_competitor:['Used-vehicle imports','Competitive activity'],g_financing:['Vehicle finance','Credit availability'],g_infra:['Fuel and roads','Reliability'],g_prices:['Vehicle prices','Price level']},
 mining:{label:'Mining',g_demand:['Commodity buyers','Offtake'],g_provider:['Mining operators','Output'],g_channel:['Export logistics','Capacity'],g_supplier:['Equipment and energy','Input costs'],g_competitor:['Other producing regions','Competitive activity'],g_financing:['Investors','Capital availability'],g_infra:['Rail and ports','Reliability'],g_prices:['Operating costs','Cost level']},
 media:{label:'Media',g_demand:['Audiences','Engagement'],g_provider:['Media companies','Revenue'],g_channel:['Distribution platforms','Reach'],g_supplier:['Content costs','Cost pressure'],g_competitor:['Social platforms','Competitive activity'],g_financing:['Advertisers','Ad spend'],g_infra:['Data affordability','Access'],g_prices:['Subscription prices','Price level']},
 technology:{label:'Technology',g_demand:['Users','Adoption'],g_provider:['Technology companies','Revenue'],g_channel:['Sales partners','Reach'],g_supplier:['Cloud and talent costs','Cost pressure'],g_competitor:['Competing platforms','Competitive activity'],g_financing:['Venture funding','Capital availability'],g_infra:['Connectivity','Reliability'],g_prices:['Subscription prices','Price level']},
 ecommerce:{label:'E-commerce',g_demand:['Online shoppers','Orders'],g_provider:['E-commerce platforms','Gross sales'],g_channel:['Delivery partners','Delivery reach'],g_supplier:['Sellers and inventory','Supply costs'],g_competitor:['Social commerce sellers','Competitive activity'],g_financing:['Payment providers','Payment access'],g_infra:['Last-mile logistics','Reliability'],g_prices:['Delivered prices','Price level']},
 transportS:{label:'Transport',g_demand:['Passengers','Trips'],g_provider:['Transport operators','Ridership'],g_channel:['Routes and terminals','Coverage'],g_supplier:['Fuel and vehicle costs','Cost pressure'],g_competitor:['Informal operators','Competitive activity'],g_financing:['Vehicle finance','Credit availability'],g_infra:['Road network','Reliability'],g_prices:['Fares','Fare level']},
 logistics:{label:'Logistics',g_demand:['Shippers','Shipment volume'],g_provider:['Logistics operators','Volume handled'],g_channel:['Warehouses and depots','Capacity'],g_supplier:['Fuel and drivers','Cost pressure'],g_competitor:['Competing carriers','Competitive activity'],g_financing:['Fleet finance','Credit availability'],g_infra:['Roads and ports','Reliability'],g_prices:['Freight rates','Rate level']},
 professional:{label:'Professional services',g_demand:['Clients','Engagements'],g_provider:['Firms','Fee income'],g_channel:['Referral networks','Reach'],g_supplier:['Talent costs','Cost pressure'],g_competitor:['Competing firms','Competitive activity'],g_financing:['Client budgets','Spending capacity'],g_infra:['Digital tools','Reliability'],g_prices:['Fees','Fee level']}
};

/* ---------- Sector modules ---------- */
// edge: [from, to, w, label, locationFactor?, assumptionId?]  endpoints may be fallback lists
const SECTORS={
 fmcg:{label:'Consumer goods (FMCG)',roles:['suppliers','you','distributors','retailers','prices','availability','consumers','competitors'],
  edges:[['suppliers','prices',.3,'Cost pass-through'],['distributors','prices',.22,'Delivery cost pass-through','infraSens'],['distributors','availability',-.45,'Delays reduce stock','infraSens'],
   ['retailers','availability',.45,'Shelf presence','informal'],['prices','consumers',-.55,'Affordability','priceSens','priceSens'],['availability','consumers',.28,'Ease of purchase'],
   ['consumers','you',.55,'Purchases','income'],['availability','you',.3,'Reach'],['consumers','retailers',.32,'Demand pull'],['competitors','consumers',-.3,'Switching pressure','comp'],
   ['competitors','retailers',-.22,'Trade incentives','comp'],['you','competitors',.3,'Share loss provokes a response']],
  out:'you',
  assumptions:[
   {id:'priceSens',label:'Consumer price sensitivity',kind:'edge',mean:1,sd:.3,unknown:'How strongly shoppers here respond to price has not been measured for this product.',method:'Shopper price tests',where:'markets',n:180,channels:'SavoScouts mobile app and voice',finding:{mean:1.15,sd:.08,text:'Price tests with 180 shoppers showed slightly stronger sensitivity than assumed.'}},
   {id:'retailWill',label:'Retailer willingness to stock',kind:'force',agent:'retailers',mean:0,sd:.15,unknown:'Retailer willingness to stock this product remains unknown.',method:'Retailer test',where:'markets',n:40,channels:'SavoScouts mobile app and WhatsApp',finding:{mean:.06,sd:.04,text:'31 of 40 retailers said they would stock at current margins. 6 asked for credit terms.'}},
   {id:'compResp',label:'Competitor response propensity',kind:'actionP',mean:.35,sd:.2,unknown:'Whether the leading competitor will respond in this location has not been observed.',method:'Retailer reports and price scans',where:'markets',n:25,channels:'SavoScouts and digital platforms',finding:{mean:.5,sd:.08,text:'9 of 25 retailers report competitor reps offering trade discounts.'}}],
  rules:[
   {id:'compPromo',agent:'competitors',reactor:1,when:(x,t,I)=>t>=2&&x(I.you)>.1,p:A=>A.compResp*(.3+A._prof.competition),eff:[['consumers',-.28,.85],['retailers',-.18,.85]],text:'Competitor launches a counter-promotion',path:'Competitor counter-promotion narrows the advantage'},
   {id:'retailSwitch',agent:'retailers',streak:2,when:(x,t,I)=>x(I.availability)<-.12,p:()=>.8,eff:[['retailers',-.25,.9]],text:'Retailers shift orders to alternative suppliers after repeated stockouts'}],
  signals:[
   {id:'pp',t:c=>`Household purchasing power under pressure in ${c.area}`,tg:[[R_DEMAND,-.12]],src:'Public records',pl:'markets',pat:'rising',dir:'↓',scope:c=>`Households, ${c.area}`},
   {id:'stockout',t:c=>`${c.Product} stockouts reported at kiosks in ${c.district}`,tg:[['availability',-.1],['retailers',.06]],src:'SavoScouts',pl:'markets',pat:'new',dir:'↑',scope:c=>`Informal retail, ${c.area}`},
   {id:'promo',t:c=>`Competitor promotion observed in ${c.district}`,tg:[['competitors',.16]],src:'SavoScouts',pl:'markets',pat:'rising',dir:'↑',scope:c=>`Modern and informal retail, ${c.area}`},
   {id:'inputs',t:()=>'Raw material and packaging costs rising',tg:[['suppliers',.2]],src:'Public records',pl:'city',pat:'stable',dir:'↑',scope:()=>'National'},
   {id:'delays',t:c=>`Delivery delays on the ${c.route} route`,tg:[['distributors',.16]],src:'Company data',client:1,pl:'routes',pat:'stable',dir:'↑',scope:c=>`Your dispatch logs, ${c.route}`},
   {id:'steady',t:c=>`Retailers in ${c.district2} report steady demand`,tg:[[R_DEMAND,.07]],src:'SavoScouts',pl:'markets',pat:'stable',dir:'→',contra:'pp',scope:c=>`Kiosks, ${c.area}`}],
  strategies:[['Reduce price 10%',[['priceDown',10]]],['Smaller pack',[['smallPack']]],['Increase distribution',[['coverage']]],['Increase marketing',[['marketing']]]]
 },
 agri:{label:'Agriculture and food',roles:['farmers','transport','aggregators','wholesalers','foodprices','households'],
  edges:[['farmers','wholesalers',-.4,'Supply volume'],['transport','aggregators',.5,'Haulage costs','infraSens','passThrough'],['aggregators','wholesalers',.45,'Cost pass-through'],
   ['wholesalers','foodprices',.6,'Retail mark-up'],['foodprices','households',-.5,'Affordability','priceSens'],['households','wholesalers',.18,'Demand pull'],['transport','farmers',-.15,'Market access']],
  out:'foodprices',framing:'impact',
  assumptions:[
   {id:'passThrough',label:'Transport cost pass-through',kind:'edge',mean:1,sd:.3,unknown:'How much of higher haulage costs traders pass on is not directly observed in these markets.',method:'Trader interviews and price scans',where:'markets',n:60,channels:'SavoScouts voice and mobile app',finding:{mean:1.2,sd:.08,text:'Traders in 4 markets report passing on most haulage increases within two weeks.'}},
   {id:'output',label:'Farm output response',kind:'force',agent:'farmers',mean:0,sd:.15,unknown:'The coming harvest outlook for this area is uncertain.',method:'Farmer and aggregator check-ins',where:'rural',n:80,channels:'SavoScouts USSD and voice',finding:{mean:.04,sd:.05,text:'Aggregators expect near-average volumes this season.'}},
   {id:'subst',label:'Household substitution',kind:'actionP',mean:.4,sd:.2,unknown:'How quickly households switch to cheaper staples is unmeasured here.',method:'Household purchase diaries',where:'markets',n:120,channels:'SavoScouts WhatsApp',finding:{mean:.55,sd:.08,text:'Diaries show households shifting to cheaper staples within a month.'}}],
  rules:[
   {id:'substitute',agent:'households',reactor:1,streak:2,when:(x,t,I)=>x(I.foodprices)>.22,p:A=>A.subst,eff:[['wholesalers',-.2,.9]],text:'Households switch to cheaper staples, easing demand',path:'Household substitution eases price pressure'},
   {id:'hoard',agent:'wholesalers',when:(x,t,I)=>t>=2&&x(I.wholesalers)>.3,p:()=>.3,eff:[['wholesalers',.15,.8]],text:'Some traders hold stock expecting higher prices'}],
  signals:[
   {id:'haul',t:c=>`Haulage rates rising on the ${c.route} route`,tg:[['transport',.14]],src:'SavoScouts',pl:'routes',pat:'rising',dir:'↑',scope:c=>`Trucking, ${c.route}`},
   {id:'whole',t:c=>`Wholesale grain prices up in ${c.district}`,tg:[['wholesalers',.12]],src:'SavoScouts',pl:'markets',pat:'rising',dir:'↑',scope:c=>`Wholesale markets, ${c.area}`},
   {id:'inputsA',t:()=>'Fertiliser and seed costs up ahead of planting',tg:[['farmers',-.12]],src:'Public records',pl:'rural',pat:'stable',dir:'↑',scope:()=>'National'},
   {id:'harvest',t:()=>'Harvest expected near average',tg:[['farmers',.08]],src:'Research',pl:'rural',pat:'stable',dir:'→',contra:'inputsA',scope:()=>'Main producing areas'}],
  strategies:[['Release grain reserves',[['reserves']]],['Temporary fuel relief',[['fuelRelief']]],['Corridor support',[['corridor']]],['Do nothing',[]]]
 },
 banking:{label:'Banking and fintech',roles:['bank','bagents','bcustomers','merchants','fintech','mno','regulator'],
  edges:[['bank','bagents',.5,'Recruitment and float support'],['bagents','bcustomers',.45,'Access to services','digital','trust'],['mno','bagents',.28,'Network uptime'],['mno','bcustomers',.18,'Connectivity'],
   ['bcustomers','bagents',.32,'Transactions and commission'],['bcustomers','bank',.55,'Transaction volume'],['bagents','bank',.25,'Network reach'],['merchants','bcustomers',.2,'Places to pay'],
   ['bcustomers','merchants',.25,'Customer requests'],['fintech','bcustomers',-.3,'Wallet competition','digital'],['bank','fintech',.25,'Competitive response'],['regulator','bagents',-.25,'KYC and compliance']],
  out:'bank',
  assumptions:[
   {id:'liquidity',label:'Agent cash-float availability',kind:'force',agent:'bagents',mean:0,sd:.15,unknown:'Whether agents here can hold enough cash float is not known.',method:'Agent liquidity checks',where:'markets',n:35,channels:'SavoScouts mobile app',finding:{mean:-.05,sd:.04,text:'12 of 35 agents ran short of float at least weekly.'}},
   {id:'trust',label:'Customer trust in agents',kind:'edge',mean:1,sd:.3,unknown:'Customer trust in agents in this community has not been measured.',method:'Customer intercepts',where:'markets',n:150,channels:'SavoScouts voice and USSD',finding:{mean:1.1,sd:.08,text:'Most customers said they would use an agent recommended by a neighbour.'}},
   {id:'fintechResp',label:'Fintech competitive response',kind:'actionP',mean:.35,sd:.2,unknown:'How fintech competitors would respond locally is unobserved.',method:'Agent and merchant reports',where:'markets',n:30,channels:'SavoScouts and digital platforms',finding:{mean:.45,sd:.08,text:'Two wallets are already offering agents higher commissions.'}}],
  rules:[
   {id:'fintechCut',agent:'fintech',reactor:1,when:(x,t,I)=>t>=2&&x(I.bank)>.1,p:A=>A.fintechResp,eff:[['bcustomers',-.25,.85]],text:'Fintech competitors cut transfer fees',path:'Fintech fee cuts limit uptake'},
   {id:'agentExit',agent:'bagents',streak:2,when:(x,t,I)=>x(I.bagents)<-.1,p:()=>.7,eff:[['bagents',-.25,.9]],text:'Agents exit after thin commissions'}],
  signals:[
   {id:'mm',t:c=>`Mobile money use rising in ${c.district}`,tg:[['bcustomers',.12]],src:'Digital platforms',pl:'markets',pat:'rising',dir:'↑',scope:c=>`Retail payments, ${c.area}`},
   {id:'float',t:c=>`Agent cash shortages reported in ${c.district}`,tg:[['bagents',-.12]],src:'SavoScouts',pl:'markets',pat:'new',dir:'↑',scope:c=>`Agent outlets, ${c.area}`},
   {id:'outage',t:c=>`Network outages in ${c.district2}`,tg:[['mno',-.15]],src:'SavoScouts',pl:'markets',pat:'stable',dir:'↑',scope:c=>`Mobile networks, ${c.area}`},
   {id:'kyc',t:()=>'New KYC tiering guidance under discussion',tg:[['regulator',.12]],src:'Public records',pl:'capital',pat:'new',dir:'↑',scope:()=>'National'}],
  strategies:[['Expand agent network',[['expandAgents']]],['Lower transfer fees',[['feeCut']]],['Partner with merchants',[['merchantPartner']]],['Increase marketing',[['marketing']]]]
 },
 telecom:{label:'Telecommunications',roles:['regulator','operators','tariffs','subscribers','mmusers','towers','investors','government'],
  edges:[['regulator','operators',-.55,'Compliance costs'],['operators','tariffs',-.4,'Margin protection','','passTariff'],['tariffs','subscribers',-.45,'Affordability','priceSens','subsSens'],['subscribers','operators',.45,'Revenue'],
   ['operators','towers',.35,'Capex budgets'],['towers','subscribers',.2,'Network quality'],['operators','investors',.4,'Returns'],['investors','towers',.3,'Funding'],['subscribers','mmusers',.3,'Active SIMs'],['mmusers','operators',.2,'Mobile money revenue'],['operators','government',.25,'Tax revenue']],
  out:'operators',framing:'impact',
  assumptions:[
   {id:'passTariff',label:'Tariff pass-through allowed',kind:'edge',mean:1,sd:.35,unknown:'Whether operators may raise tariffs to absorb the cost is not settled.',method:'Regulatory filings and operator statements',where:'capital',n:6,channels:'Public records and expert review',finding:{mean:.8,sd:.1,text:'Consultation papers suggest tariff increases will face review.'}},
   {id:'subsSens',label:'Subscriber price sensitivity',kind:'edge',mean:1,sd:.3,unknown:'How subscribers would react to higher bundle prices is unmeasured.',method:'Subscriber intercepts',where:'markets',n:200,channels:'SavoScouts USSD and voice',finding:{mean:1.15,sd:.08,text:'Most subscribers said they would move to smaller bundles.'}},
   {id:'timeline',label:'Phased implementation likelihood',kind:'actionP',mean:.3,sd:.2,unknown:'The implementation timeline has not been confirmed.',method:'Public records and stakeholder interviews',where:'capital',n:8,channels:'Public records and expert review',finding:{mean:.45,sd:.08,text:'Officials have signalled openness to a phased start.'}}],
  rules:[
   {id:'phase',agent:'government',reactor:1,streak:2,when:(x,t,I)=>x(I.operators)<-.18,p:A=>A.timeline,eff:[['regulator',-.3,.9]],text:'Government agrees a phased implementation',path:'Phased implementation softens the impact'},
   {id:'simConsol',agent:'subscribers',streak:2,when:(x,t,I)=>x(I.subscribers)<-.15,p:()=>.6,eff:[['subscribers',-.1,.9]],text:'Subscribers consolidate SIMs'}],
  signals:[
   {id:'data',t:c=>`Data usage growing in ${c.cityName}`,tg:[['subscribers',.14]],src:'Digital platforms',pl:'markets',pat:'rising',dir:'↑',scope:c=>`Mobile data, ${c.area}`},
   {id:'draft',t:()=>'Draft regulation published for consultation',tg:[['regulator',.12]],src:'Public records',pl:'capital',pat:'new',dir:'↑',scope:()=>'National'},
   {id:'energy',t:()=>'Tower energy costs rising',tg:[['towers',-.12]],src:'Research',pl:'all',pat:'stable',dir:'↑',scope:()=>'National tower estate'},
   {id:'capex',t:()=>'Operators signalling a capex review',tg:[['investors',-.08]],src:'Digital platforms',pl:'city',pat:'new',dir:'↓',scope:()=>'Listed operators'}],
  strategies:[['Pass costs to tariffs',[['tariffPass']]],['Absorb the cost',[['absorb']]],['Seek phased implementation',[['phase']]],['Invest in efficiency',[['efficiency']]]]
 },
 solar:{label:'Energy (solar)',roles:['grid','fuel','solarH','smes','installers','paygo','regulator','solarDemand'],
  edges:[['grid','solarH',-.45,'Unreliable grid pushes demand'],['grid','smes',-.5,'Outages hurt trading'],['fuel','smes',.35,'Generator running costs'],['fuel','solarH',.18,'Generator running costs'],
   ['paygo','solarH',.4,'Pay-as-you-go access','digital','wtp'],['installers','solarH',.2,'Installation capacity'],['installers','smes',.25,'Installation capacity'],['solarH','installers',.3,'Demand builds capacity'],['smes','installers',.3,'Demand builds capacity'],
   ['solarH','paygo',.22,'Portfolio growth'],['regulator','installers',-.28,'Import duties on panels'],['solarH','solarDemand',.5,'Household installations'],['smes','solarDemand',.5,'Business installations']],
  out:'solarDemand',
  assumptions:[
   {id:'wtp',label:'Willingness to pay for solar',kind:'edge',mean:1,sd:.3,unknown:'Household willingness to pay in this location is not measured.',method:'Household intercepts',where:'markets',n:150,channels:'SavoScouts voice and USSD',finding:{mean:1.1,sd:.08,text:'Households cited outages and generator costs as their main reasons to buy.'}},
   {id:'repay',label:'PAYG repayment performance',kind:'force',agent:'paygo',mean:0,sd:.15,unknown:'Repayment rates for pay-as-you-go here are unknown.',method:'Provider data request and agent checks',where:'markets',n:20,channels:'Platform intelligence and SavoScouts',finding:{mean:.03,sd:.04,text:'Providers report repayment broadly in line with national averages.'}},
   {id:'installCap',label:'Installer capacity',kind:'actionP',mean:.5,sd:.2,unknown:'Local installer capacity is not mapped.',method:'Installer census',where:'city',n:30,channels:'SavoScouts mobile app',finding:{mean:.4,sd:.08,text:'Fewer than half of listed installers have certified technicians.'}}],
  rules:[
   {id:'bottleneck',agent:'installers',reactor:1,when:(x,t,I)=>t>=2&&x(I.solarH)>.22&&x(I.installers)<.3,p:A=>A.installCap,eff:[['solarH',-.2,.85],['smes',-.12,.85]],text:'Installer shortages delay connections',path:'Installer bottleneck slows growth'}],
  signals:[
   {id:'outages',t:c=>`Grid outages averaging long hours in ${c.cityName}`,tg:[['grid',p=>-(1-p.infra)*.35]],src:'SavoScouts',pl:'all',pat:'stable',dir:'↑',scope:c=>`Households and shops, ${c.area}`},
   {id:'diesel',t:()=>'Diesel prices elevated',tg:[['fuel',p=>.08+.1*p.fx]],src:'Public records',pl:'city',pat:'stable',dir:'↑',scope:()=>'National'},
   {id:'payg',t:c=>`Pay-as-you-go solar uptake reported in ${c.district}`,tg:[['paygo',p=>.05+.14*p.digital]],src:'Platform intelligence',pl:'markets',pat:'rising',dir:'↑',scope:c=>`Households, ${c.area}`},
   {id:'duty',t:()=>'Review of import duty on panels',tg:[['regulator',.08]],src:'Public records',pl:'capital',pat:'new',dir:'↑',scope:()=>'National'}],
  strategies:[['PAYG partnership',[['paygoPartner']]],['Train more installers',[['installersUp']]],['Reduce system price',[['priceDown',10]]],['Increase marketing',[['marketing']]]]
 },
 policy:{label:'Government and public policy',roles:['government','regulator','businesses','pricesP','consumersP','investors','workers','tradegroups'],
  edges:[['government','regulator',.6,'Implementation'],['regulator','businesses',-.45,'Compliance costs','','enforce'],['regulator','pricesP',.3,'Cost pass-through','','passCost'],['pricesP','consumersP',-.45,'Affordability','priceSens'],
   ['consumersP','businesses',.35,'Sales'],['businesses','workers',.4,'Hiring'],['workers','consumersP',.3,'Wages'],['businesses','investors',.35,'Returns'],['investors','businesses',.25,'Capital'],
   ['businesses','tradegroups',-.5,'Pressure builds as activity falls'],['tradegroups','government',-.3,'Lobbying']],
  out:'businesses',framing:'impact',
  assumptions:[
   {id:'enforce',label:'Enforcement strength',kind:'edge',mean:1,sd:.3,unknown:'How strictly the policy will be enforced is not yet clear.',method:'Public records and expert review',where:'capital',n:6,channels:'Public records and expert review',finding:{mean:.85,sd:.1,text:'Past rules of this kind were enforced gradually.'}},
   {id:'passCost',label:'Cost pass-through to consumers',kind:'edge',mean:1,sd:.3,unknown:'How much firms will pass costs on is unknown.',method:'Business intercepts',where:'markets',n:60,channels:'SavoScouts mobile app',finding:{mean:1.1,sd:.08,text:'Most firms surveyed plan to pass on part of the cost.'}},
   {id:'soften',label:'Likelihood of softening',kind:'actionP',mean:.35,sd:.2,unknown:'Whether government would soften the policy under pressure is uncertain.',method:'Stakeholder interviews',where:'capital',n:10,channels:'Expert review',finding:{mean:.4,sd:.1,text:'Officials have softened similar measures before.'}}],
  rules:[
   {id:'softens',agent:'government',reactor:1,when:(x,t,I)=>t>=3&&x(I.tradegroups)>.22,p:A=>A.soften,eff:[['government',-.4,.9]],text:'Government delays or softens implementation',path:'Pushback leads government to soften the policy'}],
  signals:[
   {id:'consult',t:()=>'Policy consultation underway',tg:[['government',.1]],src:'Public records',pl:'capital',pat:'new',dir:'↑',scope:()=>'National'},
   {id:'costs',t:c=>`Businesses in ${c.cityName} report rising operating costs`,tg:[['businesses',-.1]],src:'SavoScouts',pl:'city',pat:'rising',dir:'↑',scope:c=>`SMEs, ${c.area}`},
   {id:'lobby',t:()=>'Trade associations voicing concerns',tg:[['tradegroups',.1]],src:'Digital platforms',pl:'capital',pat:'new',dir:'↑',scope:()=>'National'}],
  strategies:[['Phase implementation',[['phase']]],['Exempt small firms',[['exemptSmall']]],['Pair with tax relief',[['taxRelief']]],['Enforce strictly',[['enforceStrict']]]]
 },
 generic:{label:'Market',roles:['g_supplier','g_provider','g_channel','g_prices','g_demand','g_competitor','g_financing','g_infra'],
  edges:[['g_supplier','g_prices',.4,'Cost pass-through'],['g_prices','g_demand',-.5,'Affordability','priceSens','priceSens'],['g_channel','g_demand',.35,'Access'],['g_provider','g_channel',.4,'Capacity and reach'],
   ['g_demand','g_provider',.55,'Revenue'],['g_competitor','g_demand',-.3,'Switching','comp'],['g_provider','g_competitor',.3,'Response'],['g_financing','g_demand',.3,'Affordable financing'],['g_infra','g_channel',.3,'Enabling infrastructure','infraSens']],
  out:'g_provider',
  assumptions:[
   {id:'priceSens',label:'Customer price sensitivity',kind:'edge',mean:1,sd:.3,unknown:'Customer price sensitivity in this market has not been measured.',method:'Customer intercepts',where:'markets',n:150,channels:'SavoScouts voice and mobile app',finding:{mean:1.1,sd:.08,text:'Intercepts showed moderate sensitivity, slightly above the assumption.'}},
   {id:'channelWill',label:'Channel partner commitment',kind:'force',agent:'g_channel',mean:0,sd:.15,unknown:'How committed channel partners would be is unknown.',method:'Partner interviews',where:'markets',n:30,channels:'SavoScouts mobile app',finding:{mean:.04,sd:.05,text:'Most partners would commit if margins hold.'}},
   {id:'compResp',label:'Competitor response propensity',kind:'actionP',mean:.35,sd:.2,unknown:'Competitor response in this location is unobserved.',method:'Market scans',where:'markets',n:25,channels:'SavoScouts and digital platforms',finding:{mean:.45,sd:.08,text:'Two competitors have recently matched price moves.'}}],
  rules:[
   {id:'compMove',agent:'g_competitor',reactor:1,when:(x,t,I)=>t>=2&&x(I.g_provider)>.1,p:A=>A.compResp*(.3+A._prof.competition),eff:[['g_demand',-.25,.85]],text:'Competitors counter with price or service moves',path:'Competitor counter-move narrows the advantage'}],
  signals:[
   {id:'demandG',t:c=>`Demand indicators rising in ${c.cityName}`,tg:[['g_demand',.1]],src:'Digital platforms',pl:'markets',pat:'rising',dir:'↑',scope:c=>c.area},
   {id:'costG',t:()=>'Input costs rising',tg:[['g_supplier',.14]],src:'Public records',pl:'city',pat:'stable',dir:'↑',scope:()=>'National'},
   {id:'compG',t:c=>`New competitor activity in ${c.district}`,tg:[['g_competitor',.12]],src:'SavoScouts',pl:'markets',pat:'new',dir:'↑',scope:c=>c.area}],
  strategies:[['Lower prices',[['priceDown',10]]],['Expand channel',[['channel']]],['Increase marketing',[['marketing']]],['Financing partnership',[['financing']]]]
 }
};

/* ---------- Modifiers: forces the question brings into the world ---------- */
const MODS={
 fuel:{kw:'fuel prices',roles:['fuel','transport'],edges:[['fuel','transport',.6,'Fuel costs','infraSens','fuelPass'],['transport',['distributors','aggregators','g_channel'],.5,'Haulage costs'],['fuel',['farmers'],-.18,'Diesel for pumps and tractors'],['fuel',['g_supplier','suppliers'],.12,'Energy costs']],
  assumptions:[{id:'fuelPass',label:'Fuel pass-through to haulage rates',kind:'edge',mean:1,sd:.25,unknown:'How fast transporters reprice is not observed on these routes.',method:'Transporter interviews at parks',where:'routes',n:40,channels:'SavoScouts voice',finding:{mean:1.15,sd:.07,text:'Transporters at 4 parks raised rates within a week of the last fuel increase.'}}],
  signals:[{id:'pump',t:c=>`Fuel pump prices up at ${c.cityName} depots`,tg:[['fuel',.14]],src:'Public records',pl:'ports',pat:'rising',dir:'↑',scope:()=>'Retail fuel stations'}]},
 flood:{kw:'flooding',roles:['weather','roads','transport'],edges:[['weather','roads',-.6,'Flooded routes','climate'],['roads','transport',-.45,'Detours raise costs'],['roads',['distributors','aggregators','g_channel'],-.4,'Access to outlets'],['weather',['farmers'],-.4,'Crop damage','climate'],['transport',['distributors','aggregators','g_channel'],.4,'Haulage costs']],
  rules:[{id:'reroute',agent:'transport',streak:2,when:(x,t,I)=>x(I.roads)<-.3,p:()=>.6,eff:[['transport',-.15,.9]],text:'Transporters reroute through alternative corridors'}],
  signals:[{id:'rainfall',t:()=>'Heavy rainfall forecast for the coming weeks',tg:[['weather',.1]],src:'Public records',pl:'all',pat:'new',dir:'↑',scope:()=>'Regional weather service'}]},
 road:{kw:'road access',roles:['roads'],edges:[['roads',['distributors','aggregators','g_channel','bagents'],-.5,'Access'],['roads',['transport'],-.4,'Detours raise costs'],['roads',['retailers'],.2,'Deliveries reach outlets']],
  rules:[{id:'rerouteR',agent:'distributors',streak:2,when:(x,t,I)=>x(I.roads)<-.3,p:()=>.6,eff:[['distributors',-.18,.9]],text:'Distributors reroute through longer alternative roads'}],
  signals:[{id:'potholes',t:c=>`Road surface deteriorating on the ${c.route} route`,tg:[['roads',-.08]],src:'SavoScouts',pl:'routes',pat:'rising',dir:'↓',scope:c=>c.route}]},
 distExit:{kw:'distributor exit',roles:['distributors','altdist'],edges:[['altdist','distributors',-.45,'Replacement capacity'],['distributors',['availability','g_channel','retailers'],-.4,'Gaps in supply']],
  assumptions:[{id:'altResp',label:'Alternative distributor step-in',kind:'actionP',mean:.5,sd:.2,unknown:'Whether another distributor would take over these routes is unknown.',method:'Distributor outreach',where:'routes',n:8,channels:'Expert review and SavoScouts',finding:{mean:.65,sd:.08,text:'Two regional distributors expressed interest in the routes.'}}],
  rules:[{id:'stepIn',agent:'altdist',reactor:1,streak:2,when:(x,t,I)=>x(I.distributors)>.3,p:A=>A.altResp,eff:[['altdist',.5,.95]],text:'Alternative distributor steps in',path:'Alternative distributor restores supply'}],reactorPriority:1},
 entrant:{kw:'new competitor',roles:['entrant'],edges:[['entrant',R_DEMAND,-.35,'Switching to a cheaper option','priceSens'],['entrant',R_RETAIL,-.2,'Trade incentives']],
  signals:[{id:'listing',t:c=>`New low-price brand listed in ${c.district}`,tg:[['entrant',.1]],src:'SavoScouts',pl:'markets',pat:'new',dir:'↑',scope:c=>c.area}]},
 income:{kw:'household income',roles:['income'],edges:[['income',R_DEMAND,.5,'Purchasing power']]},
 port:{kw:'port congestion',roles:['ports','importers'],edges:[['ports','importers',.6,'Clearing delays'],['importers',['availability','g_channel','wholesalers'],-.35,'Late stock'],['importers',R_PRICES,.3,'Scarcity pricing'],['importers',['distributors'],.25,'Idle trucks waiting at port']],
  signals:[{id:'dwell',t:c=>`Container dwell times rising at ${c.portName}`,tg:[['ports',.14]],src:'Public records',pl:'ports',pat:'rising',dir:'↑',scope:c=>c.portName}]},
 fx:{kw:'currency',roles:['fx'],edges:[['fx',R_SUPPLY,.5,'Imported input costs','fx'],['fx',['importers'],.4,'Import costs','fx']]},
 power:{kw:'power supply',roles:['power'],edges:[['power',R_SUPPLY,-.3,'Generator costs when the grid fails'],['power',['businesses','g_provider'],.25,'Operating hours']]},
 reg:{kw:'regulation',roles:['regulator'],edges:[['regulator',R_PROVIDER,-.35,'Compliance costs'],['regulator',R_PRICES,.2,'Cost pass-through']]}
};

/* ---------- Events (interventions, composer, strategies) ---------- */
const EVENTS={
 priceDown:{label:k=>`Price ↓ ${k}%`,tg:k=>[[R_PRICES,-k/100*2.1]],fb:k=>[[R_DEMAND,k/100*1.3]]},
 priceUp:{label:k=>`Price ↑ ${k}%`,tg:k=>[[R_PRICES,k/100*2.1]],fb:k=>[[R_DEMAND,-k/100*1.3]]},
 smallPack:{label:()=>'Smaller pack',tg:()=>[[R_DEMAND,p=>.2*(1.4-p.income)],[R_RETAIL,p=>.16*(.5+p.informal)]]},
 coverage:{label:()=>'Retail coverage +25%',tg:()=>[[R_AVAIL,.28]]},
 marketing:{label:()=>'Marketing spend ↑',tg:()=>[[R_DEMAND,.12]]},
 launch:{label:()=>'Launch or enter',tg:()=>[[R_AVAIL,p=>.14+.24*p.infra],[R_DEMAND,p=>.02+.12*p.income]],fb:()=>[[R_PROVIDER,.3]]},
 entrant:{label:()=>'Competitor enters',mod:'entrant',tg:()=>[[['entrant'],.55]]},
 fuelUp:{label:()=>'Fuel costs ↑',mod:'fuel',tg:()=>[[['fuel'],.5]]},
 rain:{label:()=>'Rainfall disruption',mod:'flood',tg:()=>[[['weather'],.6]]},
 regulation:{label:()=>'New regulation introduced',mod:'reg',tg:()=>[[['regulator'],.5]]},
 incomeDown:{label:()=>'Customer income ↓',mod:'income',tg:()=>[[['income'],-.45]]},
 distExit:{label:()=>'Distributor exits',mod:'distExit',tg:()=>[[['distributors'],.7]]},
 roadClosure:{label:()=>'Road closure',mod:'road',tg:()=>[[['roads'],-.7]]},
 port:{label:()=>'Port congestion',mod:'port',tg:()=>[[['ports'],.6]]},
 fxDown:{label:()=>'Currency depreciation',mod:'fx',tg:()=>[[['fx'],.5]]},
 powerDown:{label:()=>'Power outages worsen',mod:'power',tg:()=>[[['power','grid'],-.45]]},
 expandAgents:{label:()=>'Expand agent banking',tg:()=>[[['bank'],.3]]},
 feeCut:{label:()=>'Lower transfer fees',tg:()=>[[['bcustomers'],.2]]},
 merchantPartner:{label:()=>'Partner with merchants',tg:()=>[[['merchants'],.3]]},
 tariffPass:{label:()=>'Pass costs to tariffs',tg:()=>[[['tariffs'],.2],[['operators'],.12]]},
 absorb:{label:()=>'Absorb the cost',tg:()=>[[['operators'],-.1]]},
 phase:{label:()=>'Phased implementation',tg:()=>[[['regulator'],-.25]]},
 efficiency:{label:()=>'Invest in efficiency',tg:()=>[[['operators'],.15]]},
 reserves:{label:()=>'Release grain reserves',tg:()=>[[['wholesalers'],-.3]]},
 fuelRelief:{label:()=>'Temporary fuel relief',tg:()=>[[['fuel','transport'],-.3]]},
 corridor:{label:()=>'Corridor support',tg:()=>[[['transport'],-.22]]},
 paygoPartner:{label:()=>'PAYG partnership',tg:()=>[[['paygo'],.32]]},
 installersUp:{label:()=>'Train more installers',tg:()=>[[['installers'],.32]]},
 exemptSmall:{label:()=>'Exempt small firms',tg:()=>[[['regulator'],-.18],[['businesses'],.08]]},
 taxRelief:{label:()=>'Pair with tax relief',tg:()=>[[['businesses'],.2]]},
 enforceStrict:{label:()=>'Enforce strictly',tg:()=>[[['regulator'],.25]]},
 regulationMain:{label:()=>'The regulation or policy takes effect',tg:()=>[[['regulator','government'],.5]]},
 ratesUp:{label:()=>'Interest rates ↑',tg:()=>[[['g_financing','paygo','investors','bank'],-.4]],fb:()=>[[R_DEMAND,-.15]]},
 ratesDown:{label:()=>'Interest rates ↓',tg:()=>[[['g_financing','paygo','investors','bank'],.35]],fb:()=>[[R_DEMAND,.12]]},
 channel:{label:()=>'Expand channel',tg:()=>[[['g_channel'],.3]]},
 financing:{label:()=>'Financing partnership',tg:()=>[[['g_financing'],.3]]}
};
const COMPOSER=[['priceDown',10],['priceUp',10],['smallPack'],['entrant'],['fuelUp'],['coverage'],['rain'],['regulation'],['incomeDown'],['marketing'],['distExit'],['roadClosure'],['port'],['fxDown']];

/* ---------- Question interpreter ---------- */
const PRODUCTS=['detergent','soap','noodles','cooking oil','vegetable oil','beverage','drink','juice','flour','rice','sugar','toothpaste','diapers','nappies','biscuits','snacks','milk','tea','coffee','cocoa','seasoning','bread','water','phones','smartphones','fertiliser','fertilizer','beer','spirits','cosmetics','hair care','sanitary pads'];
const SECTOR_KW=[
 ['banking',/\b(bank|banks|banking|agent banking|mobile money|fintech|loans?|savings|payments?|microfinance|wallets?)\b/],
 ['telecom',/\b(telecom|telecoms|mobile operators?|network operators?|spectrum|airtime|data bundles?|sim cards?|telco)\b/],
 ['agri',/\b(food prices?|farmers?|crops?|maize|harvest|agricultur\w*|fertili[sz]er|grain|livestock|cassava|staples?)\b/],
 ['solar',/\b(solar|off-grid|mini-grids?|electricity access|renewable)\b/],
 ['healthcare',/\b(health|clinics?|hospitals?|patients?)\b/],['pharma',/\b(pharma\w*|medicines?|drugs?|pharmac\w*)\b/],
 ['education',/\b(schools?|education|universit\w*|students?)\b/],['realestate',/\b(housing|real estate|property|properties|rent|mortgages?)\b/],
 ['construction',/\b(construction|building materials|contractors?|cement|housing projects?)\b/],['insurance',/\binsur\w*\b/],['hospitality',/\b(hotels?|tourism|tourists?|hospitality)\b/],
 ['manufacturing',/\b(factor(y|ies)|manufactur\w*)\b/],['automotive',/\b(cars?|vehicles?|motorcycles?|automotive)\b/],['mining',/\b(mining|mines?|copper|gold|cobalt)\b/],
 ['media',/\b(media|tv|television|radio|newspapers?|streaming)\b/],['technology',/\b(app|software|saas|cloud|tech companies)\b/],['ecommerce',/\b(e-commerce|ecommerce|online shopping|marketplaces?)\b/],
 ['transportS',/\b(bus|buses|ride-hailing|okada|keke|matatus?|passengers?|commuters?)\b/],['logistics',/\b(logistics|freight|trucking|warehous\w*|shipping)\b/],['professional',/\b(consulting|legal services|accounting|professional services)\b/],
 ['fmcg',/\b(products?|packs?|sachets?|brands?|fmcg|consumer goods|retail\w*|shops?|stores?|kiosks?)\b/]
];
function understand(q,ctxGeo){
  const raw=q.trim(), t=raw.toLowerCase().replace(/[’']/g,"'"), notes=[];
  const spec={q:raw,events:[],mods:new Set(),notes,type:'intervention',outcomeRole:null,horizon:12,stepUnit:'Wk'};
  // geography: deepest match wins
  let geo=null;
  for(const d of Object.values(DIST)){if(new RegExp('\\b'+esc(d.name.toLowerCase())+'\\b').test(t)){geo=mkGeo('district',{district:d.id});break}}
  if(!geo)for(const c of Object.values(CITY)){if(new RegExp('\\b'+esc(c.name.toLowerCase())+'\\b').test(t)){geo=mkGeo('city',{city:c.id});break}}
  if(!geo)for(const c of Object.values(CITY)){const s=c.state.toLowerCase().replace(/ (state|region|province|county|governorate)$/,'');if(s.length>3&&new RegExp('\\b'+esc(s)+'( state| region| province| county)?\\b').test(t)&&!/\bnigerian state\b/.test(t)){geo=mkGeo('city',{city:c.id});break}}
  if(!geo){for(const c of Object.values(CTRY)){const n=c.name.toLowerCase();const adj=(FEAT[c.id]&&FEAT[c.id].adj)||[];if(new RegExp('\\b'+esc(n)+'\\b').test(t)||adj.some(a=>new RegExp('\\b'+a+'\\b').test(t))){geo=mkGeo('country',{cid:c.id});break}}
    if(!geo)for(const [a,id] of Object.entries(COUNTRY_ALIAS))if(t.includes(a)){geo=mkGeo('country',{cid:id});break}}
  if(!geo)for(const [r,n] of Object.entries(REG_NAME))if(t.includes(n.toLowerCase())){geo=mkGeo('region',{region:r});break}
  if(!geo&&/\bafrica\b|\bacross the continent\b/.test(t))geo=mkGeo('africa',{});
  // sector
  let sector=null;for(const [s,re] of SECTOR_KW)if(re.test(t)){sector=s;break}
  const product=PRODUCTS.find(p=>new RegExp('\\b'+p+'\\b').test(t));
  if(product&&(!sector||sector==='fmcg'))sector='fmcg';
  // question type
  const ranking=/^(which|where)\b/.test(t)&&/\b(expand|grow|launch|enter|likely|best|next|invest|open|go)\b/.test(t)&&!/strategy|channel/.test(t);
  const strategy=/\bstrateg(y|ies)\b|\bwhich (approach|option|channel)\b|\b(supermarkets?|modern trade) or (informal|open markets?|kiosks?)\b/.test(t);
  const history=/\b(how did|last (six|6|three|3|twelve|12) months|over the past|has .* changed|history)\b/.test(t);
  if(ranking)spec.type='ranking';else if(strategy)spec.type='strategy';else if(history)spec.type='history';
  // modifiers and events
  const pct=(t.match(/(\d{1,2})\s?(%|percent)/)||[])[1];
  const rising=/(rise|rises|rising|increase|increases|go(es)? up|higher|spike|hike|jump|double)/;
  const falling=/(fall|falls|falling|drop|drops|decline|declines|reduce|reduced|cut|lower|squeez)/;
  if(/\b(fuel|petrol|diesel|pms)\b/.test(t)&&sector!=='solar'){spec.mods.add('fuel');if(rising.test(t))spec.events.push(['fuelUp'])}
  if(/\b(flood\w*|heavy rain\w*|rainfall|storms?)\b/.test(t)){spec.mods.add('flood');spec.events.push(['rain'])}
  if(/\b(road|bridge|route|highway)\b/.test(t)&&/(inaccessible|closed|closure|blocked|collapse|cut off|impassable|washed)/.test(t)){spec.mods.add('road');spec.events.push(['roadClosure'])}
  if(/\bdistributors?\b/.test(t)&&/(stop|stops|exit|exits|leave|leaves|withdraw|pulls? out|no longer)/.test(t)){spec.mods.add('distExit');spec.events.push(['distExit'])}
  if(/\b(a|new|major|another|big) (competitor|rival)\b.{0,20}\b(enters?|launch\w*|introduc\w*)|new (competitor|entrant)s?\b|cheaper (product|alternative|brand)|competitors? (enters?|launch(es)?)\b/.test(t)){spec.mods.add('entrant');spec.events.push(['entrant'])}
  if(/\b(income|purchasing power|household budgets?|wages)\b/.test(t)&&falling.test(t)){spec.mods.add('income');spec.events.push(['incomeDown'])}
  if(/\bports?\b/.test(t)&&/(congest|delay|strike|backlog)/.test(t)){spec.mods.add('port');spec.events.push(['port'])}
  if(/\b(naira|cedi|shilling|rand|kwacha|birr|currency|devaluation|exchange rate)\b/.test(t)){spec.mods.add('fx');spec.events.push(['fxDown'])}
  if(/\b(power supply|power cuts?|electricity|outages?|load.?shedding|grid)\b/.test(t)&&sector!=='solar'){spec.mods.add('power');if(falling.test(t)||/outage|shedding/.test(t))spec.events.push(['powerDown'])}
  const policyWords=/\b(regulations?|policy|policies|levy|levies|tax|taxes|ban|bans|law|rules?|subsid\w*)\b/;
  if(policyWords.test(t)){if(!sector)sector='policy';if(sector==='telecom'||sector==='policy')spec.events.push(['regulationMain']);else{spec.mods.add('reg');spec.events.push(['regulation'])}}
  if(/(reduce|cut|lower|drop|slash)\w*.{0,30}price|price.{0,12}(cut|reduction|drop)/.test(t))spec.events.push(['priceDown',+(pct||10)]);
  else if(/(raise|increase|hike)\w*.{0,30}price|price.{0,12}(increase|rise|hike)/.test(t)&&!spec.mods.has('fuel'))spec.events.push(['priceUp',+(pct||10)]);
  if(/\b(interest rates?|cost of credit|borrowing costs?|lending rates?)\b/.test(t)){spec.events.push([rising.test(t)?'ratesUp':'ratesDown'])}
  if(/smaller pack|pack size|sachet|single-serve|mini pack/.test(t))spec.events.push(['smallPack']);
  if(/\b(marketing|advertis\w*|campaign|awareness)\b/.test(t))spec.events.push(['marketing']);
  if(/(more|expand|increase)\w* (distribution|coverage|retailers|outlets)/.test(t))spec.events.push(['coverage']);
  if(sector==='banking'&&/(expand|launch|roll out|open|introduc)/.test(t))spec.events.push(['expandAgents']);
  else if(/\b(launch|enter|expand|introduc\w*|open)\b/.test(t)&&!spec.events.length)spec.events.push(['launch']);
  // outcome focus
  const of=t.match(/(?:happen to|affect|impact on|impact)\s+(?:the\s+)?([a-z ]{3,30}?)(?:\s+in\b|\s+if\b|\?|$)/)||t.match(/how (?:might|would|could|will) ([a-z ]{3,20}?) respond/)||t.match(/what (?:might|could|would) happen to ([a-z ]{3,20}?) (?:if|when)/);
  if(of){const w=of[1];
    const map=[[/retailer|shop|kiosk/,['retailers','g_channel','wholesalers']],[/consumer|customer|household|shopper|demand/,R_DEMAND],[/farmer/,['farmers']],[/operator/,['operators']],[/distributor/,['distributors']],[/competitor/,R_COMP],[/food price/,['foodprices']],[/price/,R_PRICES],[/business|firm|sme/,['businesses','g_provider']],[/bank/,['bank']],[/distribut/,R_DIST],[/maker|manufacturer|producer|compan|brand/,R_PROVIDER]];
    for(const [re,roles] of map)if(re.test(w)){spec.outcomeRole=roles;break}}
  if(!sector){sector='fmcg';notes.push('No sector named. Treated as a consumer goods market; ask again naming the sector to change it.')}
  if(!spec.events.length&&spec.type!=='history'&&spec.type!=='ranking'){if(sector==='agri')spec.events.push(['fuelUp'],spec.mods.add('fuel'));}
  spec.events=spec.events.filter(Boolean).filter(e=>Array.isArray(e));
  // geography defaults
  const thisRef=/\bthis (community|region|market|area|city|state|town|road|location)\b/.test(t);
  if(!geo){
    if(ctxGeo&&thisRef){geo=ctxGeo;notes.push(`“This” read as ${geoLabel(ctxGeo)}, the location already on screen.`)}
    else if(spec.type==='ranking'){geo=mkGeo('africa',{});notes.push('No geography named. Comparing featured markets across Africa.')}
    else{const m=t.match(/\bthis (community|region|market|area|city|state|town|road|location)\b/);const kind=m?m[1]:'';geo=/community|area|market/.test(kind)?mkGeo('district',{district:'mushin'}):/region|state|road/.test(kind)?mkGeo('city',{city:sector==='agri'?'kano':'ibadan'}):mkGeo('city',{city:'lagos'});notes.push(`No location named${kind?` for “this ${kind}”`:''}. Using ${geoLabel(geo)} as a starting point; pick another place on the map to rebuild.`)}
  }
  const hz=t.match(/(\d{1,2})\s*(weeks?|months?)/);
  if(hz){spec.horizon=+hz[1];spec.stepUnit=/month/.test(hz[2])?'Mo':'Wk'}
  else notes.push('No time period named. Simulating 12 weeks in two-week steps (an assumption).');
  if(spec.stepUnit==='Mo')spec.horizon=Math.max(3,spec.horizon);
  spec.geo=geo;spec.sector=sector;spec.product=product||null;
  return spec;
}
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

/* ---------- World builder ---------- */
function buildPlaces(geo){
  const places=[],routes=[],add=(p)=>{places.push(p);return p};
  const cityPlace=(c,tags,lvl)=>({id:c.id,name:c.name,x:c.x,y:c.y,tags:[...tags,...(c.o.port?['port']:[]),...(c.o.capital?['capital']:[])],geo:mkGeo('city',{city:c.id}),lvl});
  let focus,origin=[];
  if(geo.level==='africa'||geo.level==='region'){
    const ids=geo.level==='africa'?Object.keys(FEAT):REG[geo.region];
    for(const cid of ids){
      const f=FEAT[cid];
      if(f){const c=CITY[f.cityIds[0]];add({...cityPlace(c,['market','city','hub'],'country'),name:`${c.name}, ${CTRY[cid].name}`,cid})}
      else if(geo.level==='region'&&CTRY[cid]){const k=CTRY[cid];add({id:'c'+cid,name:k.name,x:k.c[0],y:k.c[1],tags:['market','city','thin'],geo:mkGeo('country',{cid}),lvl:'country',cid})}
    }
    const has=new Set(places.map(p=>p.id));
    CORRIDORS.forEach(([a,b])=>{if(has.has(a)&&has.has(b))routes.push([a,b])});
    if(geo.level==='region'&&routes.length<places.length-1){const ps=places.slice().sort((a,b)=>a.x-b.x);for(let i=1;i<ps.length;i++)if(!routes.some(r=>r.includes(ps[i].id)))routes.push([ps[i-1].id,ps[i].id])}
    origin=[places[0]&&places[0].id];
  } else if(geo.level==='country'&&!FEAT[geo.cid]){
    const k=CTRY[geo.cid];const [cx,cy]=k.c;
    const pts=[['Capital region',0,0,['capital','city','market','hub']],['Secondary towns',14,10,['market','city']],['Rural markets',-12,12,['rural','market']],['Border trade',10,-14,['market','port']]];
    pts.forEach(([n,dx,dy,tags],i)=>add({id:'s'+i,name:n,x:cx+dx,y:cy+dy,tags:[...tags,'thin'],geo:mkGeo('country',{cid:geo.cid}),lvl:'country'}));
    routes.push(['s0','s1'],['s0','s2'],['s0','s3']);origin=['s0'];
  } else if(geo.level==='country'){
    const f=FEAT[geo.cid];
    for(const id of f.cityIds){add(cityPlace(CITY[id],['market','city'],'city'))}
    const k=CTRY[geo.cid];
    for(const id of f.cityIds.slice(0,4)){const c=CITY[id];add({id:id+'_r',name:`${c.name} hinterland`,x:c.x+(k.c[0]-c.x)*.3,y:c.y+(k.c[1]-c.y)*.3,tags:['rural'],geo:mkGeo('city',{city:id}),lvl:'city'})}
    f.routes.forEach(r=>routes.push(r));origin=[f.cityIds[0]];
  } else {
    const c=CITY[geo.city];
    add({id:c.id,name:`${c.name} hub`,x:c.x,y:c.y,tags:['hub','city',...(c.o.capital?['capital']:[]),...(c.o.port&&!c.ds.some(d=>DIST[d].tag==='port')?['port']:[])],geo:mkGeo('city',{city:c.id}),lvl:'city'});
    const ds=c.ds.length?c.ds:[];
    for(const did of ds){const d=DIST[did];add({id:did,name:d.name,x:d.x,y:d.y,tags:[d.tag==='port'?'port':'market',d.tag],geo:mkGeo('district',{district:did}),lvl:'district'});routes.push([c.id,did])}
    if(!ds.length){add({id:c.id+'_m',name:`${c.name} central market`,x:c.x+.4,y:c.y+.3,tags:['market'],geo:mkGeo('city',{city:c.id}),lvl:'district'});routes.push([c.id,c.id+'_m'])}
    add({id:c.id+'_o1',name:`${c.name} outskirts (north)`,x:c.x-.9,y:c.y-1.1,tags:['rural'],geo:mkGeo('city',{city:c.id}),lvl:'district'});
    add({id:c.id+'_o2',name:`${c.name} outskirts (south)`,x:c.x+1.0,y:c.y+1.0,tags:['rural'],geo:mkGeo('city',{city:c.id}),lvl:'district'});
    routes.push([c.id,c.id+'_o1'],[c.id,c.id+'_o2']);
    const f=FEAT[c.cid];
    for(const oid of f.cityIds){if(oid===c.id)continue;add({...cityPlace(CITY[oid],['market','city','far'],'city')})}
    f.routes.forEach(r=>routes.push(r));
    origin=[geo.district||c.id];
  }
  // route midpoints become places for corridor activity
  const byId=Object.fromEntries(places.map(p=>[p.id,p]));
  routes.forEach(([a,b],i)=>{const A=byId[a],B=byId[b];if(!A||!B)return;add({id:'rt'+i,name:`${A.name.replace(/ hub$/,'')}–${B.name.replace(/ hub$/,'')} route`,x:(A.x+B.x)/2,y:(A.y+B.y)/2,tags:['route'],route:[a,b],lvl:'route'})});
  return {places,routes:routes.filter(([a,b])=>byId[a]&&byId[b]),origin};
}
function placesFor(type,places){
  const pick=tag=>places.filter(p=>p.tags.includes(tag)&&!p.tags.includes('far'));
  let r;
  if(type==='markets')r=pick('market');else if(type==='city')r=pick('hub').concat(pick('capital')).slice(0,2);
  else if(type==='routes')r=pick('route');else if(type==='ports')r=pick('port');else if(type==='capital')r=pick('capital');else if(type==='rural')r=pick('rural');
  else r=places.filter(p=>!p.tags.includes('route')&&!p.tags.includes('far'));
  if(!r||!r.length)r=pick('hub').length?pick('hub'):places.filter(p=>p.tags.includes('city')).slice(0,1);
  if(!r.length)r=places.slice(0,1);
  return [...new Set(r.map(p=>p.id))];
}
function resolveRole(list,has){if(typeof list==='string')list=[list];return list.find(r=>has.has(r))}
function buildWorld(spec,geoOverride){
  const geo=geoOverride||spec.geo, prof=profileOf(geo.level==='africa'||geo.level==='region'?mkGeo('country',{cid:geo.level==='region'?(REG[geo.region].find(c=>FEAT[c])||REG[geo.region][0]):'566'}):geo);
  if(geo.level==='africa'||geo.level==='region'){prof.evidence=clamp(prof.evidence-.15)}
  const sec=SECTORS[spec.sector]||SECTORS.generic, isGeneric=!SECTORS[spec.sector];
  const names=isGeneric?GENERIC_NAMES[spec.sector]:null;
  const seed=hashStr(spec.q+JSON.stringify(geo));
  const W={spec,geo,prof,seed,agents:[],idx:{},edges:[],signals:[],assumptions:[],rules:[],events:[],decay:.45,sectorLabel:names?names.label:sec.label,isGeneric};
  const P=buildPlaces(geo);W.places=P.places;W.routes=P.routes;W.origin=P.origin;W.placeIdx=Object.fromEntries(P.places.map(p=>[p.id,p]));
  const we=/\b(we|our|us)\b/i.test(spec.q);
  const addRole=(r,why)=>{if(W.idx[r]!=null)return W.idx[r];const R=ROLES[r];const a={id:r,...R,why,places:placesFor(R.pl,W.places),inE:[],sigIn:[],asF:[]};
    if(names&&names[r]){a.n=names[r][0];a.m=names[r][1]}
    if(r==='g_provider'&&we){a.n='Your business'}
    if(r==='you'&&!we){a.n='Leading brands';a.why='Represents the brands active in this category (no business of yours named).'}
    if((r==='you'||r==='g_provider')&&spec.product&&we)a.n=`Your ${spec.product}`;
    W.idx[r]=W.agents.length;W.agents.push(a);return W.idx[r]};
  const has=()=>new Set(Object.keys(W.idx));
  sec.roles.forEach(r=>addRole(r,`Core actor in ${(names?names.label:sec.label).toLowerCase()} markets.`));
  W.modsApplied=[];
  const applyMod=(m)=>{if(W.modsApplied.includes(m))return;const M=MODS[m];W.modsApplied.push(m);
    (M.roles||[]).forEach(r=>addRole(r,`Added because the question involves ${M.kw}.`));
    (M.assumptions||[]).forEach(a=>W.assumptions.push({...a,state:'Assumption',mod:m}));
    (M.rules||[]).forEach(r=>W.rules.push({...r,reactor:r.reactor&&M.reactorPriority?2:r.reactor}));
    (M.signals||[]).forEach(s=>W.sigTemplates.push(s));
    W.edgeTemplates.push(...(M.edges||[]))};
  W.sigTemplates=[...sec.signals];W.edgeTemplates=[...sec.edges];
  sec.assumptions.forEach(a=>W.assumptions.push({...a,state:'Assumption'}));
  sec.rules.forEach(r=>W.rules.push({...r}));
  spec.mods.forEach(applyMod);
  W.applyMod=applyMod;W.addRole=addRole;
  // events from the question (may add modifiers)
  spec.events.forEach(e=>{const ev=EVENTS[e[0]];if(ev&&ev.mod)applyMod(ev.mod)});
  finalizeWorld(W);
  spec.events.forEach(e=>addEvent(W,e,'question'));
  // agent-named changes in the question ("airline capacity falls", "tariffs rise")
  const ql=spec.q.toLowerCase();
  const outGuess=spec.outcomeRole?resolveRole(spec.outcomeRole,new Set(Object.keys(W.idx))):sec.out;
  W.agents.forEach((a,i)=>{if(a.id===outGuess||W.events.some(ev=>ev.tg.some(t=>t[0]===i)))return;
    const nm=a.n.toLowerCase(),words=[nm,nm.replace(/s$/,''),a.m.toLowerCase()].filter(w=>w.length>4);
    for(const w of words){const re=new RegExp('\\b'+esc(w)+'\\b.{0,12}?\\b(rises?|rising|increases?|grows?|goes up|falls?|falling|drops?|declines?|shrinks?|goes down|collapses?)\\b');const m=ql.match(re);
      if(m){const up=/ris|increas|grow|up/.test(m[1]);const ev={id:'custom_'+a.id,key:'custom',label:`${a.n} ${up?'↑':'↓'}`,src:'question',start:1,tg:[[i,up?.45:-.45]],custom:1};W.events.push(ev);break}}});
  W.measure=W.events.length?'effect':'level';
  // outcome
  let out=sec.out;
  if(spec.outcomeRole){const r=resolveRole(spec.outcomeRole,has());if(r)out=r}
  W.out=W.idx[out];W.framing=(sec.framing||'gain');
  if(out!==sec.out){const a=W.agents[W.out];W.framing=(R_DEMAND.includes(out)||R_PROVIDER.includes(out)||a.k==='actor'&&!a.inv)?'gain':'impact'}
  W.agents[W.out].why=(W.agents[W.out].why||'')+' Tracked as the outcome.';
  // wildcard (Path D) from the location
  const w=[];
  if(prof.climate>.5&&W.idx.roads==null)w.push({text:'Flash flooding cuts key routes',pathName:'Unexpected flooding changes the outcome',roles:[R_DIST.concat(['transport','bagents','operators','g_channel']),.35]});
  if(prof.fx>.6)w.push({text:'Sharp currency depreciation',pathName:'Currency shock changes the outcome',roles:[R_SUPPLY.concat(R_PRICES),.35]});
  if(prof.infra<.5)w.push({text:'Bridge or road failure on a main corridor',pathName:'Infrastructure failure changes the outcome',roles:[R_DIST.concat(['transport','g_infra','bagents','towers']),.35]});
  w.push({text:'Fuel supply shortage',pathName:'Fuel shortage changes the outcome',roles:[['transport','distributors','aggregators','g_supplier','suppliers','smes','towers','businesses'],.3]});
  const wr=mulberry32(seed)();const pick=w[Math.floor(wr*w.length)];
  const target=resolveRole(pick.roles[0],has());
  W.wild=target?{...pick,a:W.idx[target],w:W.agents[W.idx[target]].inv?pick.roles[1]:-pick.roles[1],p:.1+.08*(1-prof.infra)}:null;
  // reactor: highest priority
  const reactors=W.rules.filter(r=>r.reactor&&W.idx[r.agent]!=null).sort((a,b)=>b.reactor-a.reactor);
  W.reactor=reactors[0]||null;
  W.rules.forEach(r=>{r.isReactor=r===W.reactor});
  return W;
}
function lf(key,p){switch(key){case 'priceSens':return 1.4-p.income;case 'infraSens':return 1.5-p.infra;case 'comp':return .6+p.competition;case 'digital':return .5+p.digital;case 'climate':return .4+p.climate;case 'fx':return .5+p.fx;case 'informal':return .5+p.informal;case 'income':return .55+.9*p.income;default:return 1}}
function finalizeWorld(W){
  const has=new Set(Object.keys(W.idx));
  // edges
  W.edges=[];W.agents.forEach(a=>{a.inE=[];a.sigIn=[];a.asF=[];a.outE=[]});
  const seen=new Set();
  for(const e of W.edgeTemplates){const f=resolveRole(e[0],has),t=resolveRole(e[1],has);if(!f||!t||f===t)continue;const key=f+'>'+t;if(seen.has(key))continue;seen.add(key);
    const E={i:W.edges.length,from:W.idx[f],to:W.idx[t],w:e[2]*.8,label:e[3],lf:lf(e[4],W.prof),lfKey:e[4]||'',as:e[5]&&W.assumptions.some(a=>a.id===e[5])?e[5]:null};
    W.edges.push(E);W.agents[E.to].inE.push(E);W.agents[E.from].outE.push(E)}
  W.assumptions.forEach(a=>{if(a.kind==='force'&&W.idx[a.agent]!=null)W.agents[W.idx[a.agent]].asF.push(a.id)});
  W.assumptions=W.assumptions.filter(a=>a.kind!=='edge'||W.edges.some(e=>e.as===a.id));
  W.assumptions=W.assumptions.filter((a,i,arr)=>arr.findIndex(b=>b.id===a.id)===i);
  // signals (rebuild, keeping live and modified ones)
  const keep=W.signals.filter(s=>s.live);const prevOn=Object.fromEntries(W.signals.map(s=>[s.id,s.on]));
  W.signals=[];
  const c=sigCtx(W);
  W.sigTemplates.forEach(tp=>{const s=makeSignal(W,tp,c);if(s){if(prevOn[s.id]===false)s.on=false;W.signals.push(s)}});
  keep.forEach(s=>{s.tg=s.tgRoles.map(([r,w])=>{const rr=resolveRole(r,has);return rr?[W.idx[rr],w]:null}).filter(Boolean);W.signals.push(s)});
  W.signals.forEach((s,k)=>{s.k=k;s.tg.forEach(([ai,w])=>W.agents[ai].sigIn.push([k,w]))});
  W.signals.forEach(s=>{if(s.contraId){const o=W.signals.find(x=>x.id===s.contraId);if(o){o.contradictions=(o.contradictions||0)+1;s.contradictions=(s.contradictions||0)+1;o.contraWith=s.id;s.contraWith=o.id}}});
  W.signals.forEach(s=>{s.life=lifecycle(s)});
  // agent placement refresh
  W.agents.forEach(a=>{a.places=placesFor(ROLES[a.id].pl,W.places)});
  layoutAgents(W);
  // events re-resolve
  W.events.forEach(ev=>resolveEvent(W,ev));
}
function sigCtx(W){
  const pl=W.places, mk=pl.filter(p=>p.tags.includes('market')&&!p.tags.includes('far')), rt=pl.filter(p=>p.tags.includes('route')), port=pl.find(p=>p.tags.includes('port'));
  const city=W.geo.city?CITY[W.geo.city].name:(W.geo.cid&&CTRY[W.geo.cid]?CTRY[W.geo.cid].name:'major cities');
  return {area:geoShort(W.geo),cityName:city,district:(mk[0]||pl[0]).name.replace(/ hub$/,''),district2:(mk[1]||mk[0]||pl[0]).name.replace(/ hub$/,''),route:rt[0]?rt[0].name.replace(/ route$/,''):`${city} supply`,portName:port?port.name:'the main port',
    product:W.spec.product||'product',Product:W.spec.product?W.spec.product[0].toUpperCase()+W.spec.product.slice(1):'Product'};
}
const SRC_Q={'SavoScouts':['Verified field observations',.1],'Public records':['Public record',.1],'Company data':['Your company records',.05],'Digital platforms':['Platform listings and activity',0],'Research':['Published research',.02],'Platform intelligence':['Connected platform evidence',.05],'Distributor records':['Distributor records',.04]};
function makeSignal(W,tp,c){
  const has=new Set(Object.keys(W.idx));
  const tg=tp.tg.map(([r,w])=>{const rr=resolveRole(r,has);if(!rr)return null;return [W.idx[rr],typeof w==='function'?w(W.prof):w]}).filter(Boolean);
  if(!tg.length)return null;
  const r=mulberry32(hashStr(W.seed+tp.id)),ev=W.prof.evidence,[qual,bonus]=SRC_Q[tp.src]||['Report',0];
  const pat=tp.pat,places=placesFor(tp.pl,W.places);const reachN=Math.min(places.length,pat==='rising'?3:pat==='new'?1:2);
  const sp=[];const pool=places.slice();for(let i=0;i<reachN&&pool.length;i++)sp.push(pool.splice(Math.floor(r()*pool.length),1)[0]);
  const conf=clamp(ev*(.72+.35*r())+bonus,.15,.95);
  const strength=clamp(.4+.45*r());
  const vel=pat==='rising'?.05+.06*r():pat==='new'?.08+.05*r():pat==='falling'?-(.04+.05*r()):(r()-.5)*.02;
  const freq=tp.src==='SavoScouts'?Math.round(8+50*r()*ev):tp.src==='Digital platforms'?Math.round(20+180*r()):tp.src==='Company data'?Math.round(8+22*r()):Math.round(1+3*r());
  const fresh=pat==='falling'?Math.round(25+25*r()):Math.round(1+18*r());
  const hist={rising:[0,.12,.3,.52,.76,1],new:[0,0,0,0,.45,1],stable:[.82,.86,.9,.95,1,1],falling:[1,1,.9,.72,.52,.36]}[pat].map(v=>v*strength);
  const st=conf>=.72&&['SavoScouts','Public records','Company data'].includes(tp.src)?'Fact':conf<.45?'Hypothesis':'Inference';
  return {id:tp.id,title:tp.t(c),tgRoles:tp.tg,tg,src:tp.src,quality:qual,client:!!tp.client,places:sp,strength,dir:tp.dir||'↑',conf,velocity:vel,frequency:freq,freshness:fresh,
    duration:pat==='new'?Math.round(2+2*r()):pat==='rising'?Math.round(6+4*r()):Math.round(14+12*r()),persistence:{rising:'Building',new:'Episodic',stable:'Persistent',falling:'Fading'}[pat],
    scope:tp.scope?tp.scope(c):c.area,hist,pat,state:tp.st||st,contraId:tp.contra||null,contradictions:0,on:true,eff:strength/.62*.7};
}
function lifecycle(s){
  if(s.contradictions>0)return 'contested';
  if(s.velocity<-.03||s.freshness>30)return 'weakening';
  if(s.pat==='new'||s.frequency<5)return 'emerging';
  if(s.places.length>=2&&s.velocity>.04)return 'spreading';
  if(s.velocity>.04)return 'growing';
  if(s.conf>=.65&&s.frequency>=8)return 'confirmed';
  return 'stable';
}
function lifeF(s,t){switch(s.life){case 'growing':case 'spreading':return 1+.08*(t-1);case 'emerging':return .6+.1*(t-1);case 'weakening':return Math.max(.25,1-.13*(t-1));case 'contested':return .75;default:return 1}}
function layoutAgents(W){
  const cols={};W.agents.forEach(a=>{(cols[a.col]=cols[a.col]||[]).push(a)});
  const keys=Object.keys(cols).map(Number).sort((a,b)=>a-b),nc=keys.length;
  keys.forEach((k,ci)=>{const list=cols[k];const x=60+ci*(480/Math.max(1,nc-1));list.forEach((a,j)=>{a.nx=nc===1?300:x;a.ny=list.length===1?220:60+j*(320/(list.length-1))+(ci%2?18:0)})});
}
function addEvent(W,e,src){
  const [key,arg]=e,E=EVENTS[key];if(!E)return null;
  if(E.mod&&!W.modsApplied.includes(E.mod)){W.applyMod(E.mod);finalizeWorld(W)}
  const ev={id:key+(arg!=null?arg:'')+'_'+W.events.length,key,arg,label:E.label(arg),src,start:1};
  resolveEvent(W,ev);if(!ev.tg.length)return null;
  W.events.push(ev);return ev;
}
function resolveEvent(W,ev){
  if(ev.custom)return;
  const E=EVENTS[ev.key],has=new Set(Object.keys(W.idx));
  let tg=E.tg(ev.arg).map(([r,w])=>{const rr=resolveRole(r,has);return rr?[W.idx[rr],typeof w==='function'?w(W.prof):w]:null}).filter(Boolean);
  if(!tg.length&&E.fb)tg=E.fb(ev.arg).map(([r,w])=>{const rr=resolveRole(r,has);return rr?[W.idx[rr],typeof w==='function'?w(W.prof):w]:null}).filter(Boolean);
  ev.tg=tg;
}

/* ---------- Simulation ---------- */
const STEPS=6;
function runOnce(W,seed,rec,evOverride){
  const r=mulberry32(seed),g=gaussOf(r),n=W.agents.length,evs=evOverride||W.events;
  const A={_prof:W.prof};W.assumptions.forEach(a=>{A[a.id]=a.kind==='actionP'?clamp(a.mean+g()*a.sd,0,1):a.kind==='edge'?Math.max(.1,a.mean+g()*a.sd):a.mean+g()*a.sd});
  const sm=W.signals.map(s=>{const z=g();return s.on?Math.max(0,1+z*(1-s.conf)*1.1):0});
  const X=[new Float64Array(n)],M=new Float64Array(n),C=rec?[null]:null,dyn=[],acts=[],fired=new Set(),streak={};
  const wild=W.wild&&r()<W.wild.p?{t:2+Math.floor(r()*3)}:null;
  const I=W.idx;
  for(let t=1;t<=STEPS;t++){
    if(wild&&t===wild.t){dyn.push({id:'wild',a:W.wild.a,w:W.wild.w,decay:.85,start:t,text:W.wild.text});acts.push({t,id:'wild',text:W.wild.text,agent:W.wild.a})}
    const prev=X[t-1],cur=new Float64Array(n),ct=rec?[]:null;
    for(let i=0;i<n;i++){
      const a=W.agents[i];let u=0;const cc=rec?[]:null;
      for(const e of a.inE){let w=e.w*e.lf;if(e.as)w*=A[e.as];const v=w*prev[e.from];u+=v;if(rec&&Math.abs(v)>1e-4)cc.push(['a',e.from,v,e.i])}
      for(const [k,w] of a.sigIn){const s=W.signals[k];if(!s.on)continue;const v=w*s.eff*lifeF(s,t)*sm[k];u+=v;if(rec)cc.push(['s',k,v])}
      for(const ev of evs){if(t<ev.start)continue;for(const [ai,w] of ev.tg)if(ai===i){u+=w;if(rec)cc.push(['e',ev.id,w])}}
      for(const f of dyn){if(f.a===i&&t>=f.start){const v=f.w*Math.pow(f.decay,t-f.start);u+=v;if(rec)cc.push(['f',f.id,v,f.text])}}
      for(const id of a.asF){const v=A[id]*(t<=3?1:.7);u+=v;if(rec)cc.push(['as',id,v])}
      if(M[i]*u>0)u*=1+.35*Math.min(1,Math.abs(M[i]));
      const self=W.decay*prev[i];cur[i]=Math.tanh(self+u);
      if(rec){if(Math.abs(self)>1e-4)cc.push(['self',i,self]);ct.push(cc)}
    }
    for(let i=0;i<n;i++)M[i]=.6*M[i]+cur[i];
    X.push(cur);if(rec)C.push(ct);
    const xf=j=>j==null?0:cur[j];
    for(const ru of W.rules){
      if(fired.has(ru.id)||I[ru.agent]==null)continue;
      let ok=false;try{ok=ru.when(xf,t,I)}catch(e){ok=false}
      streak[ru.id]=ok?(streak[ru.id]||0)+1:0;
      if(streak[ru.id]>=(ru.streak||1)&&t<STEPS&&r()<ru.p(A)){fired.add(ru.id);
        ru.eff.forEach(([role,w,d])=>{if(I[role]!=null)dyn.push({id:ru.id,a:I[role],w,decay:d,start:t+1,text:ru.text})});
        acts.push({t:t+1,id:ru.id,text:ru.text,agent:I[ru.agent],reactor:ru.isReactor})}
    }
  }
  return {X,C,acts,wild,A,seed};
}
function framingOf(W,mean){return W.framing==='impact'?'impact':mean>=0?'gain':'loss'}
function bucket(W,fr,v){if(fr==='impact'){const a=Math.abs(v);return a>=.25?'hi':a>=.1?'mid':'lo'}if(fr==='gain')return v>=.2?'hi':v>=.07?'mid':'lo';return v>=-.1?'hi':v>=-.25?'mid':'lo'}
function monteCarlo(W,N=200,evOverride){
  const runs=[];
  const evs=evOverride||W.events,eff=evs.length>0;
  for(let k=0;k<N;k++){const s=(W.seed^Math.imul(k+1,2654435761))>>>0;const r=runOnce(W,s,false,evs);
    const b=eff?runOnce(W,s,false,[]):null;const series=r.X.map((x,t)=>x[W.out]-(b?b.X[t][W.out]:0));
    runs.push({seed:s,v:series[STEPS],series,base:b?b.X[STEPS][W.out]:r.X[STEPS][W.out],acts:r.acts,wild:!!r.wild,A:r.A})}
  const vals=runs.map(r=>r.v).sort((a,b)=>a-b),mean=vals.reduce((a,b)=>a+b,0)/N,q=p=>vals[Math.min(N-1,Math.floor(p*N))];
  const fr=framingOf(W,mean);
  const reId=W.reactor&&W.reactor.id;
  runs.forEach(r=>{r.path=r.wild?'D':(reId&&r.acts.some(a=>a.id===reId))?'C':(bucket(W,fr,r.v)==='hi'?'A':'B')});
  const band=rs=>{const out=[];for(let t=0;t<=STEPS;t++){const v=rs.map(r=>r.series[t]).sort((a,b)=>a-b);out.push([v[Math.floor(.1*(v.length-1))],v[Math.floor(.5*(v.length-1))],v[Math.floor(.9*(v.length-1))]])}return out};
  const paths=[];
  for(const id of ['A','B','C','D']){const rs=runs.filter(r=>r.path===id);if(!rs.length)continue;
    const sorted=rs.slice().sort((a,b)=>a.v-b.v),med=sorted[Math.floor(sorted.length/2)];
    const rep=runOnce(W,med.seed,true,evs);rep.base=eff?runOnce(W,med.seed,true,[]):null;
    const pm=rs.reduce((a,r)=>a+r.v,0)/rs.length;
    paths.push({id,prob:rs.length/N,mean:pm,band:band(rs),rep,runs:rs})}
  paths.forEach(p=>describePath(W,p,fr,runs));
  const baseMean=runs.reduce((a,r)=>a+r.base,0)/N;
  return {N,runs,mean,p10:q(.1),p50:q(.5),p90:q(.9),fr,paths,band:band(runs),evs,eff,baseMean};
}
/* ---------- Analysis ---------- */
function srcName(W,c){if(c[0]==='a')return W.agents[c[1]].n;if(c[0]==='s')return W.signals[c[1]].title;if(c[0]==='e'){const e=(W.events.find(x=>x.id===c[1])||{label:'Intervention'});return e.label}if(c[0]==='f')return c[3]||'Agent action';if(c[0]==='as'){const a=W.assumptions.find(x=>x.id===c[1]);return a?`Assumption: ${a.label.toLowerCase()}`:'Assumption'}return ''}
function contribTotals(W,rep,i){const tot={};for(let t=1;t<=STEPS;t++)for(const c of rep.C[t][i]){if(c[0]==='self')continue;const k=c[0]+':'+c[1];tot[k]=(tot[k]||{c,v:0});tot[k].v+=c[2]}return Object.values(tot).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v))}
function describePath(W,p,fr,runs){
  const out=W.agents[W.out],met=out.m.toLowerCase(),tot=contribTotals(W,p.rep,W.out);
  const pos=tot.filter(x=>x.v>0),neg=tot.filter(x=>x.v<0);
  const nm=x=>x?srcName(W,x.c):'other factors';
  const dir=p.mean>=0?'rise':'fall';
  if(p.id==='D'){p.title=W.wild.pathName;p.desc=`${W.wild.text} arrives mid-simulation and redirects ${met}.`}
  else if(p.id==='C'){p.title=W.reactor.path;p.desc=`${W.reactor.text}. The market adjusts around this response.`}
  else if(fr==='gain'){if(p.id==='A'){p.title=`Strong ${met} gain`;p.desc=`${nm(pos[0])} carries the effect through and no major counter-move appears.`}else{p.title=neg[0]?`Moderate gain, held back by ${nm(neg[0]).toLowerCase()}`:`Moderate ${met} gain`;p.desc=`The intervention helps, but ${nm(neg[0]).toLowerCase()} limits how far ${met} moves.`}}
  else if(fr==='loss'){if(p.id==='A'){p.title=`Contained ${met} loss`;p.desc=pos[0]?`${nm(pos[0])} absorbs part of the shock.`:'The shock fades before it spreads far.'}else{p.title=`Deep ${met} loss through ${nm(neg[0]).toLowerCase()}`;p.desc=`The shock passes through ${nm(neg[0]).toLowerCase()} with little to cushion it.`}}
  else{const drv=(p.mean>=0?pos:neg)[0],damp=(p.mean>=0?neg:pos)[0];if(p.id==='A'){p.title=drv?`Strong ${met} ${dir} via ${nm(drv).toLowerCase()}`:`Strong ${met} ${dir}`;p.desc=drv?`${nm(drv)} transmits most of the change.`:'The change passes through in full.'}else{p.title=damp?`Contained ${met} ${dir}, dampened by ${nm(damp).toLowerCase()}`:`Contained ${met} ${dir}`;p.desc=damp?`${nm(damp)} offsets part of the pressure.`:'The change passes through only partly within the period.'}}
  // critical assumptions: largest shift vs all runs
  p.critical=W.assumptions.map(a=>{const all=runs.reduce((s,r)=>s+r.A[a.id],0)/runs.length,pm=p.runs.reduce((s,r)=>s+r.A[a.id],0)/p.runs.length;return {a,z:(pm-all)/(a.sd||1),pm}}).sort((x,y)=>Math.abs(y.z)-Math.abs(x.z)).slice(0,2);
  p.keySignals=strongestSignals(W,p.rep).slice(0,3);
  p.turning=p.rep.acts.slice();
  const cs=p.keySignals.map(x=>W.signals[x.k].conf);p.evidence=cs.length?cs.reduce((a,b)=>a+b,0)/cs.length:W.prof.evidence;
}
function strongestSignals(W,rep){const tot={};for(let t=1;t<=STEPS;t++)rep.C[t].forEach((cc)=>cc.forEach(c=>{if(c[0]==='s'){tot[c[1]]=(tot[c[1]]||0)+Math.abs(c[2])}}));return Object.entries(tot).map(([k,v])=>({k:+k,v})).sort((a,b)=>b.v-a.v)}
function keyAgents(W,rep){const tot=new Array(W.agents.length).fill(0);for(let t=1;t<=STEPS;t++)rep.C[t].forEach(cc=>cc.forEach(c=>{if(c[0]==='a')tot[c[1]]+=Math.abs(c[2])}));return tot.map((v,i)=>({i,v})).filter(x=>x.i!==W.out).sort((a,b)=>b.v-a.v)}
function topEdges(W,rep){const tot={};for(let t=1;t<=STEPS;t++)rep.C[t].forEach((cc,i)=>cc.forEach(c=>{if(c[0]==='a'){tot[c[3]]=(tot[c[3]]||0)+Math.abs(c[2])}}));return Object.entries(tot).map(([e,v])=>({e:W.edges[+e],v})).sort((a,b)=>b.v-a.v)}
function trace(W,rep,i,t,depth=5){
  const chain=[{type:'a',i,t,x:rep.X[t][i],d:rep.X[t][i]-(t>0?rep.X[t-1][i]:0)}];
  let ci=i,tt=t;
  for(let k=0;k<depth&&tt>=1;k++){
    const cc=rep.C[tt][ci].filter(c=>c[0]!=='self').sort((a,b)=>Math.abs(b[2])-Math.abs(a[2]));
    const top=cc[0];if(!top||Math.abs(top[2])<.01)break;
    if(top[0]==='a'){ci=top[1];tt=tt-1;chain.push({type:'a',i:ci,t:tt,x:rep.X[tt][ci],v:top[2],edge:W.edges[top[3]]});if(tt<1)break}
    else{chain.push({type:top[0],c:top,v:top[2]});break}
  }
  return chain;
}
function sensitivity(W,N=80){
  return W.assumptions.map(a=>{const keep=a.mean,sd=a.sd;
    a.mean=keep-1.2*sd;const lo=monteCarloLite(W,N);a.mean=keep+1.2*sd;const hi=monteCarloLite(W,N);a.mean=keep;
    return {a,lo,hi,swing:Math.abs(hi-lo)}}).sort((x,y)=>y.swing-x.swing);
}
function monteCarloLite(W,N,evs){evs=evs||W.events;let s=0;for(let k=0;k<N;k++){const sd=(W.seed^Math.imul(k+7,40503))>>>0;const r=runOnce(W,sd,false,evs);const b=evs.length?runOnce(W,sd,false,[]):null;s+=r.X[STEPS][W.out]-(b?b.X[STEPS][W.out]:0)}return s/N}


/* ---------- Ranking across locations ---------- */
function rankCandidates(geo){
  if(geo.level==='africa')return Object.keys(FEAT).map(cid=>mkGeo('country',{cid}));
  if(geo.level==='region')return REG[geo.region].filter(c=>CTRY[c]&&c!=='732').map(cid=>mkGeo('country',{cid}));
  if(geo.level==='country'&&FEAT[geo.cid])return FEAT[geo.cid].cityIds.map(city=>mkGeo('city',{city}));
  if(geo.level==='city'&&CITY[geo.city].ds.length)return CITY[geo.city].ds.map(district=>mkGeo('district',{district}));
  return [geo];
}
function rankRun(spec,N=90){
  const out=rankCandidates(spec.geo).map(g=>{const W=buildWorld(spec,g);const mc=monteCarlo(W,N);const top=mc.paths.slice().sort((a,b)=>b.prob-a.prob)[0];
    return {geo:g,label:geoShort(g),sub:g.level==='city'?CITY[g.city].state:g.level==='country'?REG_NAME[regionOf(g.cid)]:'',mean:mc.mean,p10:mc.p10,p90:mc.p90,fr:mc.fr,top,ev:W.prof.evidence,prof:W.prof,thin:W.prof.evidence<.35}});
  return out.sort((a,b)=>b.mean-a.mean);
}
if(typeof module!=='undefined')module.exports={rankRun,setCountries,understand,buildWorld,monteCarlo,runOnce,sensitivity,trace,addEvent,finalizeWorld,FEAT,CITY,DIST,STEPS,geoLabel};
