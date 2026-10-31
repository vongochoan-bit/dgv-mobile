const ENG = (function () {
/* ===== BỘ HIỂU CÂU CỦA MÁY TÍNH chạy trên iPhone =====
   build.py ghép NGUYÊN VĂN mk/vn.js + IMPREG (mk/impcore.js) + mk/ask.js + mk/timkiem.js vào giữa hai file eng_pre.js / eng_post.js,
   tất cả nằm trong một hàm riêng (ENG) → không đụng tên với app.js. Phần dưới chỉ là các "đồ thế chỗ" cho phần giao diện máy tính
   (vẽ trang, AI, file) mà bộ hiểu câu có nhắc tới nhưng iPhone không dùng. Không có dòng nào thay đổi cách tính. */
let LANG = 'vi';
const LOC = () => LANG == 'en' ? 'en-US' : 'vi-VN';
const fn = v => Math.round(v).toLocaleString(LOC());
const fp = v => isFinite(v) ? (v * 100).toFixed(1) + '%' : '–';
const fm = v => fn(v);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let R = [], YEARS = [], BRANDS = [], PAGE = 'ask', SEC = '';
let D = { R: [], sku: {}, dl: {}, stores: {}, asof: '', asofDay: 0, asofAll: '', asofDayAll: 0 };
const F = { y: 0, br: '', m0: 1, m1: 12, p: '', ch: '', ar: '', grp: '', se: '', pv: '', inc: false };
const RULES = { raw: {}, hash: '' };
const P = {}, GOHOOK = [], PAGEHOOK = [], PAGEIN = [], NAVHOOK = [], LIVEHOOK = [], RHOOK = { pre: [], after: [], mask: [] };
const page = () => '', render = () => { }, go = () => { }, toast = () => { }, onRender = () => { }, tbl = () => { }, chart = () => { }, insLine = () => '', css = () => '', brandCol = () => '#888', upd = () => { }, drawer = () => { };
const IDB = { get: async () => null, set: async () => { }, del: async () => { } };
const AIX = { on: () => false, inst: () => false, status: async () => ({}), chat: async () => { throw new Error('no-ai') } };
const appJson = async () => null, appJsonSave = async () => { }, askRunKho = () => { }, xlsxSave = async () => { };
const maxMonth = () => F.m1;
/* chỉ số bán ra theo sheet "Chỉ số" (nhận từ gói): dòng có được tính vào chỉ số id không – giống inMet của chiso.js */
let MKSE = {}; const inMet = (id, x) => { const s = MKSE[id]; return !!(s && s.has(x.k)) && (F.inc || !x.int) };
const metEnsure = () => { };

// Bỏ dấu tiếng Việt – MỘT hàm dùng chung cho toàn app (tìm kiếm, đọc file, quy tắc, xuất file). Chạy được cả trong trình duyệt lẫn node (kiểm thử).
(function (G) {
  // v104: bộ nhớ đệm + đường tắt cho chữ không dấu (ASCII) – hàm này được gọi hàng triệu lần trong các vòng lặp số liệu
  const ASC = /^[\x00-\x7f]*$/, MC = new Map(), AC = new Map(), LIM = 200000;
  const noMark0 = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const noMark = s => { s = String(s ?? ''); if (ASC.test(s)) return s; let v = MC.get(s); if (v === undefined) { if (MC.size > LIM) MC.clear(); v = noMark0(s); MC.set(s, v) } return v };
  const vnA = s => { s = String(s ?? ''); let v = AC.get(s); if (v === undefined) { if (AC.size > LIM) AC.clear(); v = (ASC.test(s) ? s : noMark0(s)).toLowerCase().replace(/\s+/g, ' ').trim(); AC.set(s, v) } return v };
  /* MỘT cách so cho mọi sheet quy tắc (Segment, Bậc CPU…): chứa (nguyên từ) · bắt đầu bằng · kết thúc bằng · đúng bằng · mẫu (biểu thức) · mọi giá trị.
     "Giá trị" ghi nhiều cách viết cách nhau dấu "|" (vd "core i5 | core ultra 5"). norm = cách chuẩn hoá chữ của nơi dùng. */
  const KIEU = { 'chua': 'has', 'bat dau bang': 'pre', 'ket thuc bang': 'suf', 'dung bang': 'eq', 'mau': 're', 'moi gia tri': 'any' };
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ruleMatch = (kieu, gt, norm) => {
    const k = KIEU[vnA(kieu)]; norm = norm || vnA;
    if (!k) return { err: 'Cách so phải là chứa / bắt đầu bằng / kết thúc bằng / đúng bằng / mẫu / mọi giá trị (đang ghi "' + kieu + '")' };
    if (k === 'any') return { k, re: /(?:)/ };
    if (k === 're') { try { return { k, re: new RegExp(String(gt ?? '').trim()) }; } catch (e) { return { err: '"Giá trị" không phải mẫu hợp lệ (' + e.message + ')' }; } }
    const vs = String(gt ?? '').split('|').map(norm).filter(Boolean);
    if (!vs.length) return { err: 'thiếu "Giá trị"' };
    const alt = vs.map(esc).join('|');
    return { k, re: k === 'has' ? new RegExp('(?:^|[^a-z0-9])(?:' + alt + ')(?![a-z0-9])') : k === 'pre' ? new RegExp('^(?:' + alt + ')') : k === 'suf' ? new RegExp('(?:' + alt + ')$') : new RegExp('^(?:' + alt + ')$') };
  };
  G.noMark = noMark; G.vnA = vnA; G.ruleMatch = ruleMatch;
  if (typeof module !== 'undefined' && module.exports) module.exports = { noMark, vnA, ruleMatch };
})(typeof window !== 'undefined' ? window : globalThis);

const IMPREG=(()=>{
 const CORE=[
  {k:'laptop',fk:'nb',pri:1,rx:/(^|[^a-z])(nb|laptop|notebook)([^a-z]|$)/i,dash:['Laptop','Laptop'],ask:['Laptop','Laptop'],short:'Laptop',sheet:'Laptop',grp:'NB',words:['laptop','notebook','nb','may tinh xach tay','xach tay','lap top']},
  {k:'pc',fk:'pc',pri:2,rx:/(^|[^a-z])(pc|desktop)([^a-z]|$)/i,dash:['Desktop','Desktop'],ask:['PC / Desktop','PC / Desktop'],short:'PC',sheet:'PC',grp:'PC',words:['pc','desktop','may bo','may tinh de ban','may tinh bo','de ban','all in one','aio','may tinh dong bo']},
  {k:'lcd',fk:'lcd',pri:3,rx:/(^|[^a-z])(lcd|monitor)([^a-z]|$)/i,dash:['Monitor','Monitor'],ask:['Màn hình','Monitor'],short:'Màn hình',sheet:'Man hinh',grp:'MONITOR',words:['man hinh','monitor','lcd']},
  {k:'ssd',fk:'ssd',pri:4,rx:/(^|[^a-z])(ssd|storage)([^a-z]|$)/i,dash:['Storage','Storage'],ask:['SSD','SSD'],short:'SSD',sheet:'SSD',grp:'STORAGE',words:['ssd','o cung','storage','luu tru','o luu tru']},
  {k:'server',fk:'server',pri:0,rx:/(^|[^a-z])server([^a-z]|$)/i,dash:['Server','Server'],ask:['Server','Server'],short:'Server',sheet:'Server',grp:'SERVER',words:['server','may chu']}];
 CORE.forEach(e=>e.core=true);
 const BYPRI=CORE.slice().sort((a,b)=>a.pri-b.pri);
 // file trong thư mục Import… KHÔNG phải số liệu nhóm hàng (dù tên có chữ NB/PC/…): nhật ký loại, quy tắc, từ điển, chuẩn ghi, nhật ký điền, file kiểm tra
 const HELPER=/^(da loai|quy tac|tu dien|chuan ghi|nhat ky|kiem tra)([^a-z]|$)/;
 const NORM=s=>noMark(s).toLowerCase();
 const RESERVED=new Set(['chung','data','nguon','all','tat_ca']);
 const SHEETRES=new Set(['chung','huong dan','moc loc','xoa khoi data']);
 let DYN=[];const subs=[];
 function mk(x){const label=String(x).replace(/\s+/g,' ').trim();let k=NORM(label).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,30).replace(/_+$/,'');if(!k)return null;
  if(RESERVED.has(k)||CORE.some(e=>e.k==k||e.fk==k))k=('x_'+k).slice(0,30);
  const w=NORM(label).replace(/[^a-z0-9]+/g,' ').trim();
  // tên sheet (Từ điển / Quy tắc) không được trùng sheet có sẵn: Chung, Huong dan, Moc loc, Xoa khoi Data, sheet của nhóm có sẵn
  let sh=label.replace(/[\[\]:*?\/\\]/g,' ').replace(/\s+/g,' ').trim().slice(0,31)||k;if(SHEETRES.has(NORM(sh))||CORE.some(e=>NORM(e.sheet)==NORM(sh)))sh=('Nhom '+sh).slice(0,31);
  return {k,fk:k,dyn:true,label,dash:[label,label],ask:[label,label],short:label,sheet:sh,grp:NORM(label).replace(/[^a-z0-9]+/g,' ').trim().toUpperCase(),words:w?[w]:[]}}
 const save=()=>{try{localStorage.setItem('bh_impreg',JSON.stringify(DYN.map(e=>e.label)))}catch(e){}};
 const sortDyn=()=>DYN.sort((a,b)=>a.label.localeCompare(b.label,'vi')||(a.k<b.k?-1:1));
 try{const a=JSON.parse(localStorage.getItem('bh_impreg')||'[]');if(Array.isArray(a))for(const x of a){const e=mk(x);if(e&&!DYN.some(d=>d.k==e.k))DYN.push(e)}sortDyn()}catch(e){}
 const R={
  list:()=>CORE.concat(DYN),keys:()=>CORE.concat(DYN).map(e=>e.k),
  get:c=>CORE.find(e=>e.k==c||e.fk==c)||DYN.find(e=>e.k==c)||null,
  fk:c=>{const e=R.get(c);return e?e.fk:null},            // mã nhóm → mã bộ lọc (laptop → nb)
  key:c=>{const e=R.get(c);return e?e.k:c},                // mã bộ lọc → mã nhóm (nb → laptop)
  short:c=>{const e=R.get(c);return e?e.short:c},
  dash:(c,en)=>{const e=R.get(c);return e?e.dash[en?1:0]:c},
  isCore:c=>{const e=R.get(c);return !!(e&&e.core)},
  helper:name=>HELPER.test(NORM(String(name).replace(/\.(xlsx|xlsm|xls)$/i,'')).replace(/^[^a-z0-9]+/,'')),
  // nhận nhóm theo tên file: nhóm có sẵn (dò chữ như trước) → nếu không, "DGV <Tên nhóm> Import …" là nhóm mới
  ofFile(name){const n=String(name).replace(/\.(xlsx|xlsm|xls)$/i,'');if(R.helper(n))return null;
   for(const e of BYPRI)if(e.rx.test(n))return e;
   const m=n.match(/^\s*DGV\s+(.+?)\s+Import(?![a-z])/i);if(!m)return null;
   const x=m[1].replace(/(?<!\d)20\d{2}(?!\d)/g,' ').replace(/[_\s]+/g,' ').trim();return x?R.add(x):null},
  add(x){const e=mk(x);if(!e)return null;const old=R.get(e.k);if(old)return old;DYN.push(e);sortDyn();save();subs.forEach(f=>{try{f(e)}catch(er){console.warn('impreg',er)}});return e},
  // bỏ nhóm mới không còn file và chưa từng dựng số liệu
  prune(keep){const n=DYN.length;DYN=DYN.filter(e=>keep.has(e.k));if(DYN.length!=n)save()},
  on:f=>{subs.push(f)}};
 return R})();
// ===== Hỏi đáp thông minh: nói hoặc gõ câu hỏi → bảng tổng hợp & phân tích (chạy hoàn toàn trên máy) =====
const NZC=new Map();const nz=s=>{s=s==null?'':typeof s=='string'?s:String(s);let v=NZC.get(s);if(v===undefined){if(NZC.size>200000)NZC.clear();v=vnA(s).replace(/[^a-z0-9%$+.\s]/g,' ').replace(/\s+/g,' ').trim();NZC.set(s,v)}return v};
const p2=n=>String(n).padStart(2,'0');
const ymAdd=(ym,k)=>{let [y,m]=ym.split('-').map(Number);m+=k;while(m<1){m+=12;y--}while(m>12){m-=12;y++}return y+'-'+p2(m)};
const ymLbl=ym=>{const [y,m]=ym.split('-');return (LANG=='en'?'M':'T')+(+m)+'/'+y.slice(2)};
const ymDiff=(a,b)=>{const [y1,m1]=a.split('-').map(Number),[y2,m2]=b.split('-').map(Number);return (y2-y1)*12+(m2-m1)};
const fusd=v=>{const a=Math.abs(v),en=LANG=='en';return a>=1e6?'$'+(v/1e6).toLocaleString(LOC(),{maximumFractionDigits:2})+(en?'M':' tr'):a>=1e3?'$'+(v/1e3).toLocaleString(LOC(),{maximumFractionDigits:1})+(en?'K':' nghìn'):'$'+fn(v)};
const fpc=v=>isFinite(v)?(v*100).toLocaleString(LOC(),{maximumFractionDigits:1})+'%':'–';
// tăng/giảm dễ đọc: chưa có cùng kỳ → "Mới"; tăng hơn 3 lần → "×N" (thay vì 2.072%)
const fgrow=(q,qP)=>!qP?L_('Mới','New'):q/qP>=4?'×'+(q/qP).toLocaleString(LOC(),{maximumFractionDigits:q/qP>=10?0:1}):fyoy(q,qP);
const shbar=(v,mx)=>`<span class="shb"><i style="width:${mx?Math.max(2,Math.round(v/mx*100)):0}%"></i></span>`;
const fyoyC=(a,b)=>`<span class="${a>=b?'up':'dn'}">${fyoy(a,b)}</span>`;
const fpts=v=>isFinite(v)?(v>=0?'+':'')+(v*100).toLocaleString(LOC(),{maximumFractionDigits:1}):'–';
const fyoy=(a,b)=>b>0?(a>=b?'▲ ':'▼ ')+Math.abs((a/b-1)*100).toLocaleString(LOC(),{maximumFractionDigits:0})+'%':'–';

// ── từ vựng ──
// nhóm hàng nhập khẩu: từ vựng / nhóm số bán / tên hiển thị đều lấy từ IMPREG (impcore.js) – nhóm mới tự có
// nhóm chỉ có ở số bán ra (không có file nhập khẩu): khai riêng ở đây
const SALEONLY=[['vga','VGA',['vga','card do hoa','card man hinh','graphics card','gpu card'],['Card đồ hoạ (VGA)','Graphics cards (VGA)']],['power','POWER',['nguon','psu','power','bo nguon'],['Nguồn','PSU']],['ups','UPS',['ups','luu dien','bo luu dien'],['UPS','UPS']],['accy','ACCY',['phu kien'],['Phụ kiện','Accessories']],['tui','TUI',['balo','ba lo','tui','tui xach','tui chong soc'],['Túi / balo','Bags']]];
const CATW={},SALEGRP={},CATN={},CATW_S={};
function askRegCat(e){CATW[e.k]=e.words.slice();let g=e.grp;if(e.dyn){const so=SALEONLY.find(x=>x[2].some(w=>e.words.includes(w)));if(so)g=so[1]}if(g)SALEGRP[e.k]=g;CATN[e.k]=e.ask.slice()}// nhóm mới trùng nhóm chỉ có ở số bán (vd PSU = Nguồn) → dùng đúng nhóm số bán đó
IMPREG.list().forEach(askRegCat);IMPREG.on(askRegCat);
for(const [k,g,w,n] of SALEONLY){SALEGRP[k]=g;CATW_S[k]=w;CATN[k]=n}
const SEGW={gaming:['gaming','choi game','game'],office:['office','van phong','pho thong','business','doanh nghiep'],workstation:['workstation','may tram'],ai:['ai nb','ai pc','ai server','may ai','may chu ai','laptop ai','pc ai','server ai','segment ai','phan khuc ai']};
const BRALIAS={giga:'gigabyte',gigabite:'gigabyte','gi ga byte':'gigabyte','gi ga bai':'gigabyte',gigabai:'gigabyte',macbook:'apple','hp':'hp','m s i':'msi','a sus':'asus',asus:'asus'};
// bậc CPU: CÙNG quy tắc với dashboard (sheet "Bậc CPU" trong quy-tac-phan-tich.xlsx)
let ASKT=null,ASKTH='';const askTiers=()=>{const IM=window.DASHBOARD_IMPORT,h=(typeof RULES!='undefined'&&RULES.hash)||'';if(!IM||!IM.compileTiers)return [];if(!ASKT||ASKTH!==h){ASKT=IM.compileTiers((typeof RULES!='undefined'&&RULES.raw&&RULES.raw.bac_cpu)||[]);ASKTH=h}return ASKT};
function cpuTierOf(s){const IM=window.DASHBOARD_IMPORT;return s&&IM&&IM.tierOf?IM.tierOf(askTiers(),s):''}
// ── số liệu nhập khẩu chi tiết (đọc từ bộ nhớ đệm trên máy) ──
const IMPDET={};
async function impDetAll(){for(const c of new Set(IMPREG.keys().concat(window.impBuiltCats?impBuiltCats():[]))){if(IMPDET[c])continue;let d=null;try{d=await IDB.get('impdet:'+c)}catch(e){}if(!d)continue;d.cat=c;d.nz={};for(const k in d.dict)d.nz[k]=d.dict[k].map(nz);d.tier=d.dict.cpum.map(cpuTierOf);IMPDET[c]=d}}
function vocabImp(){const V=[];for(const c in IMPDET){const d=IMPDET[c];[['brand',2],['sub',3],['importer',3],['segment',2]].forEach(([k,mn])=>d.dict[k].forEach((v,i)=>{const n=d.nz[k][i];if(!n||n.length<mn||/^(khong ro|unknown|others?|khac|unclassified|na)$/.test(n)||/^\d+$/.test(n))return;if(k=='sub'&&/^(gaming|office|workstation|business|consumer)$/.test(n))return;V.push({k,v,n,c})}))}return V}
function vocabSales(){const V=[],seen=new Set(),add=(k,v,n)=>{n=n||nz(v);if(!n||n.length<3||seen.has(k+n)||/^(khac|chua xac dinh|chua co du lieu)$/.test(n))return;seen.add(k+n);V.push({k,v,n,c:'sales'})};
 R.forEach(x=>{add('brand',x.br);if(x.p)add('chain',x.p);if(x.se&&!/^\d/.test(x.se))add('sale',x.se);if(x.prov)add('prov',x.prov)});
 Object.entries(D.dl).forEach(([k,d])=>{add('dealer',k,nz(k));if(d.name&&d.name.length>5)add('dealer',k,nz(d.name).replace(/^(cong ty|cty)\s(tnhh|co phan|cp)?\s?/,''))});
 Object.entries(D.sku).forEach(([k,s])=>{if(s.sb)add('model',s.sb);add('sku',k,nz(k))});return V}
function vMatch(t,V){const hit=[];let s=' '+t+' ';V.slice().sort((a,b)=>b.n.length-a.n.length).forEach(x=>{const p=' '+x.n+' ';if(s.includes(p)){hit.push(x);s=s.split(p).join('   ')}});return {hit,rest:s.trim()}}
// ── hiểu câu hỏi ──
function askParseBase(text,prev){const t0=nz(text);let t=' '+t0+' ';const Q={text,src:null,cat:null,f:{},per:null,focus:null,cmp:null,alt:[],guess:[]};
 const has=w=>t.includes(' '+w+' ');const any=a=>a.some(has);
 if(any(['nhap khau','nhap','import','imports','imported','hai quan','to khai','thi truong','thi phan','market','market share','nha nhap khau','dau moi','importer']))Q.src='imp';
 if(any(['ban ra','so ban','ban duoc','luong ban','doanh so','doanh thu','dai ly','sale','sales','revenue','sell in','sell out','chuoi','ban cho','lay hang','khach hang','loi nhuan','lai gop','bien','dealer','dealers']))Q.src=Q.src||'sales';
 for(const c in CATW)if(any(CATW[c])){Q.cat=c;break}
 if(!Q.cat)for(const c in CATW_S)if(any(CATW_S[c])){Q.cat=c;Q.src=Q.src||'sales';break}
 // GPU: số 4 chữ số (không phải năm) hoặc có chữ rtx/gtx/vga/card
 const gp=new Set();for(const m of t.matchAll(/(?:\b(rtx|gtx|vga|card|gpu|rx)\s?)?\b(\d{3,4})\b(\s?ti\b)?/g)){const n=+m[2],before=t.slice(Math.max(0,m.index-8),m.index),after=t.slice(m.index+m[0].length,m.index+m[0].length+8);
  if(!m[1]){if(n<1000||(n>=2000&&n<=2035))continue;if(/(thang|nam|quy|duoi|tren|tu|den|gia|hon)\s$/.test(before)||/^\s?(usd|do|dola|\$|trieu|tr\b|k\b|dong|chiec|%|cai|may)/.test(after))continue}
  if(n>=500)gp.add(m[2]+(m[3]?' ti':''))}
 if(gp.size)Q.f.gpu=[...gp];
 {const IM=window.DASHBOARD_IMPORT;const tiers=IM&&IM.tiersIn?IM.tiersIn(askTiers(),t):[];if(tiers.length)Q.f.cpu=tiers;}
 for(const s in SEGW)if(any(SEGW[s])){(Q.f.seg=Q.f.seg||[]).push(s)}
 let m;if(m=t.match(/(duoi|nho hon|re hon|<)\s?(\d+(?:[.,]\d+)?)\s?(usd|do|dola|\$|trieu|tr|k)?\b/))Q.f.pmax=[+m[2].replace(',','.'),m[3]||''];
 if(m=t.match(/(tren|lon hon|cao hon|>)\s?(\d+(?:[.,]\d+)?)\s?(usd|do|dola|\$|trieu|tr|k)?\b/))Q.f.pmin=[+m[2].replace(',','.'),m[3]||''];
 // thời gian (tính sau khi biết nguồn số liệu)
 Q._t=t;
 if(m=t.match(/theo (nha nhap khau|dau moi|importer)/))Q.focus='importer';else if(m=t.match(/theo (model|dong may|dong san pham|ma hang|san pham|sku|cau hinh)/))Q.focus=/cau hinh/.test(m[1])?'config':'model';
 else if(t.match(/theo (thang|quy|thoi gian|tung thang)/))Q.focus='time';else if(t.match(/theo (dai ly|khach|khach hang)/))Q.focus='dealer';else if(t.match(/theo (chuoi)/))Q.focus='chain';else if(t.match(/theo (sale|nhan vien)/))Q.focus='sale';else if(t.match(/theo (tinh|khu vuc|mien)/))Q.focus='prov';else if(t.match(/theo (gia|khoang gia|phan khuc gia)/))Q.focus='price';else if(t.match(/theo (nhan|hang|thuong hieu|brand)/))Q.focus='brand';
 if(/(so voi|so sanh|\bvs\b|doi chieu)/.test(t))Q.cmpWord=true;
 Q.follow=!!prev&&(/^ ?(chi|rieng|con|so voi|so sanh|them|bo|loai|the|vay|nhung|theo|loc|trong do|neu|xem them|cua)\b/.test(t0)||(!Q.src&&!Q.cat&&t0.split(' ').length<=6));
 return Q}
async function askResolveBase(Q,prev){await impDetAll();const t=Q._t;
 // thực thể theo từ vựng
 const VI=vocabImp(),VS=R.length?vocabSales():[];
 let tt=t;for(const a in BRALIAS)tt=tt.split(' '+a+' ').join(' '+BRALIAS[a]+' ');
 const mi=vMatch(nz(tt),VI),ms=vMatch(nz(tt),VS);
 const ent={segment:new Set(),brand:new Set(),sub:new Set(),importer:new Set(),dealer:new Set(),chain:new Set(),sale:new Set(),prov:new Set(),model:new Set(),sku:new Set()};
 const catVotes={};mi.hit.forEach(x=>{ent[x.k].add(x.v);if(x.k!='brand')catVotes[x.c]=(catVotes[x.c]||0)+1});ms.hit.forEach(x=>{if(x.k=='brand')ent.brand.add(x.v);else ent[x.k].add(x.v)});
 if(!Q.src){if(ent.dealer.size||ent.chain.size||ent.sale.size||ent.prov.size||ent.sku.size)Q.src='sales';else if(Q.f.gpu||Q.f.cpu||ent.importer.size||[...ent.brand].some(b=>!/^(gigabyte|apc)$/i.test(b)))Q.src='imp';}
 // nối tiếp câu trước
 if(Q.follow&&prev){const P=JSON.parse(JSON.stringify(prev));const only=/^ ?(chi|rieng)\b/.test(nz(Q.text)),drop=/^ ?(bo|loai)\b/.test(nz(Q.text)),addw=/^ ?them\b/.test(nz(Q.text));
  P.text=prev.text+' → '+Q.text;if(Q.src)P.src=Q.src;if(Q.cat&&Q.cat!=P.cat){P.cat=Q.cat;delete P.f.sub;delete P.f.model}
  const setF=(k,vals)=>{if(!vals||!vals.length)return;if(drop){P.f[k]=(P.f[k]||[]).filter(v=>!vals.includes(v));if(!P.f[k].length)delete P.f[k]}else if(addw||(Q.cmpWord&&P.f[k]))P.f[k]=[...new Set([...(P.f[k]||[]),...vals])];else P.f[k]=vals};
  ['gpu','cpu','seg'].forEach(k=>setF(k,Q.f[k]));['pmin','pmax'].forEach(k=>{if(Q.f[k])P.f[k]=Q.f[k]});
  Object.keys(ent).forEach(k=>setF(k,[...ent[k]]));if(Q.focus)P.focus=Q.focus;if(Q.cmpWord)P.cmpWord=true;P.perText=askTime(t,P.src)?t:P.perText;Q=P}
 else{Object.keys(ent).forEach(k=>{if(ent[k].size)Q.f[k]=[...ent[k]]});Q.perText=t}
 // phân khúc lấy đúng tên trong cột Segment (anh tự đặt) thì bỏ bộ lọc từ khoá chung
 if(Q.f.segment&&Q.f.segment.length)delete Q.f.seg;if(Q.src=='sales')delete Q.f.segment;
 // nhóm hàng mặc định
 if(!Q.src)Q.src='imp';
 if(Q.src=='imp'){const avail=Object.keys(IMPDET);if(!Q.cat||!IMPDET[Q.cat]){const voted=Object.entries(catVotes).sort((a,b)=>b[1]-a[1])[0];const g=(voted&&voted[0])||(Q.f.gpu||Q.f.cpu?'laptop':avail.includes('laptop')?'laptop':avail[0]);if(Q.cat&&!IMPDET[Q.cat])Q.guess.push((LANG=='en'?'No import data for ':'Chưa có số nhập khẩu nhóm ')+catName(Q.cat));Q.cat=g;Q.alt=avail.filter(c=>c!=g)}}
 Q.per=askTime(nz(Q.perText||''),Q.src)||askDefaultPer(Q.src);delete Q._t;return Q}
function dataEnd(src,cat,Q){if(src=='imp'){const d=IMPDET[cat];return d&&d.dayTo?d.dayTo:''}
 const grp=cat?SALEGRP[cat]:null,fb=Q&&Q.f.brand?Q.f.brand.map(nz):null;let md=0;for(const x of R){if(x.k!='S'||x.day<=md)continue;if(grp&&((D.sku[x.s]||{}).grp||x.grp)!=grp)continue;if(fb&&!fb.includes(nz(x.br)))continue;md=x.day}
 return md?new Date(md*864e5).toISOString().slice(0,10):(D.asofAll||D.asof||'')}
function askDefaultPer(src,cat){return null}
// ===== v113 – Ý ĐỊNH TƯỜNG MINH: chữ anh gõ rõ trong câu là LUẬT, không bước suy đoán nào được ghi đè =====
// Nguồn số liệu ("nhập khẩu / import / thị trường…" ↔ "bán ra / doanh số / doanh thu…") và nhóm hàng ("ssd", "màn hình", "lcd", "vga"…) đọc thẳng từ câu gốc.
// Áp ở BƯỚC CUỐI của cả hai đường hỏi (Hỏi đáp và ô tìm kiếm), sau mọi bước tìm thực thể / chỉ mục / AI – thực thể (vd hãng GIGABYTE nằm trong chỉ mục số bán) chỉ còn là bộ lọc.
// Câu nối tiếp ("chỉ gigabyte", "so với dell") không có chữ nguồn / nhóm → giữ nguyên như câu trước.
function askIntent(text){const I=askParseBase(String(text||''),null);return {src:I.src,cat:I.cat}}
function askLock(Q,text){if(!Q)return Q;const I=askIntent(text);const lk={};
 if(I.src&&Q.src!==I.src){Q.src=I.src;lk.src=1}
 if(I.cat&&Q.cat!==I.cat){Q.cat=I.cat;lk.cat=1;delete Q.f.sub;delete Q.f.model}
 // câu không nói nguồn, nhóm anh gõ chỉ có ở số bán (vd SSD khi chưa có file nhập khẩu SSD) → số bán, không đưa sang Laptop nhập khẩu
 if(!I.src&&I.cat&&Q.src=='imp'&&!IMPDET[I.cat]&&SALEGRP[I.cat]&&R.some(x=>x.grp==SALEGRP[I.cat])){Q.src='sales';lk.inf=1;Q.guess=(Q.guess||[]).filter(g=>!/nhập khẩu nhóm|import data for/.test(g)).concat([L_('Chưa có số nhập khẩu nhóm ','No import data for ')+catName(I.cat)+L_(' – đang xem số bán DGW',' – showing DGW sales')])}
 if(Q.src=='imp'){for(const k of ['dealer','chain','sale','prov','sku'])delete Q.f[k];const av=Object.keys(IMPDET).filter(c=>IMPDET[c]);
  if(av.length&&(!Q.cat||!IMPDET[Q.cat])){if(Q.cat){const g=L_('Chưa có số nhập khẩu nhóm ','No import data for ')+catName(Q.cat);if(!(Q.guess||[]).includes(g))(Q.guess=Q.guess||[]).push(g)}Q.cat=av.includes('laptop')?'laptop':av[0];Q.alt=av.filter(c=>c!=Q.cat)}}
 else if(Q.src=='sales'){for(const k of ['importer','segment','sub'])delete Q.f[k]}
 if(lk.src||lk.cat||lk.inf){Q.per=askTime(nz(Q.perText||text),Q.src)||askDefaultPer(Q.src);if(lk.src||lk.cat)Q.locked=lk}
 return Q}
function askTimeBase(t,src){if(!t)return null;let m;const lbl=[];t=t.replace(/(so voi\s)?cung ky\s(nam\s(ngoai|truoc|roi)|nam kia)/g,' ');
 const yo=/nam kia/.test(t)?2:/nam ngoai|nam truoc|nam roi/.test(t)?1:0;const r0=askTime0(t,src);if(r0&&r0.from&&yo){const f=v=>v.startsWith('Y-')||v.startsWith('Y')&&!v.startsWith('Y-')?v.replace(/^Y/,'Y'+yo):v;return {from:f(r0.from),to:f(r0.to)}}return r0}
function askTime0(t,src){let m;
 let from=null,to=null,lab='';
 if(m=t.match(/tu thang\s(\d{1,2})(?:\s(?:nam\s)?(20\d\d))?\s(?:den|toi)\s(?:thang\s)?(\d{1,2})(?:\s(?:nam\s)?(20\d\d))?/)){const y2=m[4]||m[2],y1=m[2]||y2;from=(y1||'Y')+'-'+p2(m[1]);to=(y2||'Y')+'-'+p2(m[3]);lab=''}
 else if(m=t.match(/\b(?:quy|q)\s?(1|2|3|4|i{1,3}|iv)\b(?:\s(?:nam\s)?(20\d\d))?/)){const q={i:1,ii:2,iii:3,iv:4}[m[1]]||+m[1];from=(m[2]||'Y')+'-'+p2(q*3-2);to=(m[2]||'Y')+'-'+p2(q*3)}
 else if(m=t.match(/\b(\d{1,2})\s?thang\s?(gan nhat|gan day|qua|vua qua|truoc|cuoi)/))return {last:+m[1]};
 else if(m=t.match(/\bthang\s(\d{1,2})(?:\s(?:nam\s)?(20\d\d))?\b/)){if(+m[1]>=1&&+m[1]<=12){from=to=(m[2]||'Y')+'-'+p2(m[1])}}
 else if(/thang truoc|thang roi/.test(t))return {rel:'prevm'};else if(/thang nay/.test(t))return {rel:'thism'};
 else if(/nam nay|tu dau nam|\bytd\b|luy ke nam/.test(t))return {rel:'ytd'};else if(/nam ngoai|nam truoc|nam roi/.test(t))return {rel:'lasty'};else if(/nam kia/.test(t))return {rel:'lasty',k:2};
 else if(/toan bo|tat ca cac nam|tu truoc den nay|3 nam/.test(t))return {rel:'all'};
 else if(m=t.match(/\b(?:nam\s)?(20[12]\d)\b/)){from=m[1]+'-01';to=m[1]+'-12'}
 if(!from)return null;return {from,to}}
// quy đổi kỳ thành tháng cụ thể dựa trên ngày cuối có số liệu
function askPeriodBase(Q){const end=dataEnd(Q.src,Q.cat,Q);if(!end)return null;const eym=end.slice(0,7),ey=eym.slice(0,4);let P=Q.per,from,to;
 const allMin=Q.src=='imp'?IMPDET[Q.cat].dict.ym.slice().sort()[0]:(()=>{let a='9999';R.forEach(x=>{const k=x.y+'-'+p2(x.m);if(k<a)a=k});return a})();
 // v105: câu hỏi không nói thời gian → dùng kỳ đang chọn ở thanh lọc (Năm · Từ tháng · Đến tháng) – một kỳ chung cho mọi trang
 if(!P){const f=F.y+'-'+p2(F.m0),t=F.y+'-'+p2(F.m1);P=(F.y&&t>=allMin&&f<=eym)?{from:f,to:t,glob:1}:{last:12}}
 if(P.last){to=eym;from=ymAdd(eym,-(P.last-1))}else if(P.rel=='ytd'){from=ey+'-01';to=eym}else if(P.rel=='lasty'){from=(ey-(P.k||1))+'-01';to=(ey-(P.k||1))+'-12'}else if(P.rel=='prevm'){from=to=ymAdd(eym,-1)}else if(P.rel=='thism'){from=to=eym}else if(P.rel=='all'){from=allMin;to=eym}
 else{const yo=+((P.from.match(/^Y(\d)/)||[])[1]||0);const fy=v=>v.replace(/^Y\d?/,String(ey-yo));from=fy(P.from);to=fy(P.to);if(!yo&&from>eym){from=ymAdd(from,-12);to=ymAdd(to,-12)}if(to>eym)to=eym;if(to<from)to=from}
 const n=ymDiff(from,to)+1;const cf=ymAdd(from,-12),ct=ymAdd(to,-12);const partial=end.slice(8,10)<'25'&&to==eym;
 const lab=P.last?(LANG=='en'?`Last ${P.last} months`:`${P.last} tháng gần nhất`):P.rel=='ytd'?(LANG=='en'?'Year to date':'Từ đầu năm'):P.rel=='all'?(LANG=='en'?'All data':'Toàn bộ dữ liệu'):from==to?ymLbl(from):from.slice(5)=='01'&&to.slice(5)=='12'&&from.slice(0,4)==to.slice(0,4)?(LANG=='en'?'Year ':'Năm ')+from.slice(0,4):ymLbl(from)+' → '+ymLbl(to);
 return {from,to,cf:P.rel=='all'?null:cf,ct:P.rel=='all'?null:ct,n,lab,end,partial,eym}}
// ── phân tích số nhập khẩu ──
function priceOK(Q,unit,src){const cv=(a)=>{let [v,u]=a;if(src=='sales'){return /trieu|tr/.test(u)||v<1000?v*1e6:v}return /k/.test(u)?v*1000:v};if(Q.f.pmax&&!(unit<cv(Q.f.pmax)))return false;if(Q.f.pmin&&!(unit>cv(Q.f.pmin)))return false;return true}
function anaImp(Q,P){const d=IMPDET[Q.cat];if(!d)return null;const C=d.col,DI=d.dict,NZ=d.nz,n=d.n;
 const codeSet=(k,vals,fn2)=>{if(!vals||!vals.length)return null;const vs=vals.map(nz);const s=new Set();NZ[k].forEach((v,i)=>{if(vs.some(x=>fn2?fn2(v,x,i):v==x))s.add(i)});return s};
 const sSV=codeSet('segment',Q.f.segment),sB=codeSet('brand',Q.f.brand),sS=codeSet('sub',Q.f.sub),sI=codeSet('importer',Q.f.importer);
 const sG=Q.f.gpu?(()=>{const s=new Set();NZ.gpu.forEach((v,i)=>{if(Q.f.gpu.some(g=>{const [num,ti]=g.split(' ');return new RegExp('(^|\\D)'+num+'(\\D|$)').test(v)&&(!ti||/ti\b/.test(v))&&(ti||!/\bti\b/.test(v.split(num)[1]||''))}))s.add(i)});return s})():null;
 askTiers();if(d.tierH!==ASKTH||!d.tier){d.tier=d.dict.cpum.map(cpuTierOf);d.tierH=ASKTH}// quy tắc bậc CPU đổi → tính lại
 const sC=Q.f.cpu?new Set(d.tier.map((t,i)=>Q.f.cpu.includes(t)?i:-1).filter(i=>i>=0)):null;
 const XF=typeof askXF=='function'?askXF(d,Q):null;// v86: lọc theo cấu hình (họ CPU, RAM, SSD, màn hình, tần số quét, độ phân giải, OLED…)
 const sSeg=Q.f.seg?(()=>{const s=new Set();NZ.segment.forEach((v,i)=>{if(Q.f.seg.some(x=>(x=='ai'?['ai']:SEGW[x]).some(w=>(' '+v+' ').includes(' '+w+' '))))s.add(i)});return s})():null;
 const ymC=C.ym,cur=new Uint8Array(DI.ym.length),cmp=new Uint8Array(DI.ym.length);DI.ym.forEach((y,i)=>{cur[i]=y>=P.from&&y<=P.to?1:0;cmp[i]=P.cf&&y>=P.cf&&y<=P.ct?1:0});
 const MK=impModelKeys(d);const A={qty:0,usd:0,qP:0,uP:0,brand:new Map(),brandP:new Map(),month:new Map(),monthP:new Map(),model:new Map(),imp:new Map(),band:new Map(),tier:new Map(),gpu:new Map(),ram:new Map(),seg:new Map(),rows:0};
 const M=sB?{q:0,u:0,qP:0,brand:new Map(),brandP:new Map(),month:new Map()}:null;A.mkt=M;const inc=(m,k,q,u)=>{let o=m.get(k);if(!o){o={q:0,u:0};m.set(k,o)}o.q+=q;o.u+=u;return o};
 for(let i=0;i<n;i++){const yi=ymC[i];const c1=cur[yi],c2=cmp[yi];if(!c1&&!c2)continue;
  if(sG&&!sG.has(C.gpu[i]))continue;if(sC&&!sC.has(C.cpum[i]))continue;if(sS&&!sS.has(C.sub[i]))continue;if(sI&&!sI.has(C.importer[i]))continue;if(sSeg&&!sSeg.has(C.segment[i]))continue;if(sSV&&!sSV.has(C.segment[i]))continue;if(XF&&!XF(i))continue;
  const q=d.qty[i],u=d.usd[i];if((Q.f.pmin||Q.f.pmax)&&!priceOK(Q,q?u/q:0,'imp'))continue;const b=DI.brand[C.brand[i]];
  if(M){const ym0=DI.ym[yi];if(c1){M.q+=q;M.u+=u;M.brand.set(b,(M.brand.get(b)||0)+q);M.month.set(ym0,(M.month.get(ym0)||0)+q)}if(c2){M.qP+=q;M.brandP.set(b,(M.brandP.get(b)||0)+q)}}
  if(sB&&!sB.has(C.brand[i]))continue;
  if(c2){A.qP+=q;A.uP+=u;inc(A.brandP,b,q,u);const o=A.monthP.get(DI.ym[yi])||new Map();inc(o,b,q,u);A.monthP.set(DI.ym[yi],o)}
  if(!c1)continue;A.rows++;A.qty+=q;A.usd+=u;const ob=inc(A.brand,b,q,u);(ob.sub=ob.sub||new Set()).add(C.sub[i]);
  const ym=DI.ym[yi];const om=A.month.get(ym)||new Map();inc(om,b,q,u);A.month.set(ym,om);
  const part=DI.part[C.part[i]],mk=MK.k[i];
  const mo=inc(A.model,mk,q,u);mo.b=b;mo.m=MK.m[i];if(q>0){const un=u/q;mo.mn=Math.min(mo.mn??un,un);mo.mx=Math.max(mo.mx??un,un)}mo.f=mo.f&&mo.f<ym?mo.f:ym;mo.l=mo.l&&mo.l>ym?mo.l:ym;(mo.cpu=mo.cpu||new Map()).set(DI.cpum[C.cpum[i]],(mo.cpu.get(DI.cpum[C.cpum[i]])||0)+q);(mo.gpu=mo.gpu||new Map()).set(DI.gpu[C.gpu[i]],(mo.gpu.get(DI.gpu[C.gpu[i]])||0)+q);(mo.parts=mo.parts||new Set()).add(part);(mo.imp=mo.imp||new Map()).set(DI.importer[C.importer[i]],(mo.imp.get(DI.importer[C.importer[i]])||0)+q);if(typeof askListAdd=='function')askListAdd(A,d,i,b,q,u,ym);
  const oi=inc(A.imp,DI.importer[C.importer[i]],q,u);(oi.br=oi.br||new Map()).set(b,(oi.br.get(b)||0)+q);
  inc(A.band,DI.band[C.band[i]],q,u);inc(A.tier,d.tier[C.cpum[i]]||(LANG=='en'?'Other/unknown':'Khác/không rõ'),q,u);inc(A.gpu,DI.gpu[C.gpu[i]]||'—',q,u);inc(A.ram,DI.ram[C.ram[i]]||'—',q,u);inc(A.seg,DI.segment[C.segment[i]],q,u)}
 return A}
// v110: khoá model (hãng | dòng máy, thiếu dòng thì part / mô tả) tính MỘT lần cho mỗi bộ số liệu nhập khẩu – cùng quy tắc như trước, không tính lại mỗi câu hỏi
function impModelKeys(d){if(d._mkey&&d._mkeyn===d.n)return d._mkey;const C=d.col,DI=d.dict,n=d.n,k=new Array(n),m=new Array(n),memo=new Map();
 for(let i=0;i<n;i++){const ck=C.brand[i]+','+C.sub[i]+','+C.part[i]+','+C.desc[i];let e=memo.get(ck);if(!e){const b=DI.brand[C.brand[i]],sub=DI.sub[C.sub[i]],part=DI.part[C.part[i]];const mk=b+'|'+(sub&&!/^(không rõ|—|-)$/i.test(sub)?sub:(part||DI.desc[C.desc[i]]||'?'));e=[mk,mk.split('|')[1]];memo.set(ck,e)}k[i]=e[0];m[i]=e[1]}
 d._mkeyn=n;return d._mkey={k,m}}
// chuẩn bị sẵn khi app rảnh (khoá model, khoá danh sách, chỉ mục chữ tự do) cho mọi nhóm nhập khẩu đã nạp → câu hỏi đầu tiên không phải chờ
function impWarm(){try{for(const c of Object.keys(typeof IMPDET!='undefined'?IMPDET:{})){const d=IMPDET[c];if(!d||!d.n)continue;impModelKeys(d);if(typeof askListKeys=='function')askListKeys(d);if(typeof tkIdx=='function')tkIdx(d)}}catch(e){console.warn('impWarm',e)}}
setInterval(()=>{if(typeof IMPDET!='undefined'&&Object.values(IMPDET).some(d=>d&&d.n&&!(d._mkey&&d._mkeyn===d.n&&d._lkey&&d._lkeyn===d.n)))(window.requestIdleCallback||setTimeout)(impWarm)},15e3);
// ── phân tích số bán (sell-in DGW) ──
function anaSales(Q,P){const grp=Q.cat?SALEGRP[Q.cat]:null;const nzs=a=>a?a.map(nz):null;const fb=nzs(Q.f.brand),fd=Q.f.dealer,fc=Q.f.chain,fs=Q.f.sale,fp=Q.f.prov,fm2=nzs(Q.f.model),fk=Q.f.sku;
 const A={rev:0,qty:0,gp:0,rP:0,qP:0,gP:0,brand:new Map(),brandP:new Map(),month:new Map(),monthP:new Map(),model:new Map(),dealer:new Map(),dealerP:new Map(),chain:new Map(),sale:new Map(),prov:new Map(),dl:new Set(),dlP:new Set(),rows:0};
 // v105: doanh thu / số lượng / lãi gộp theo định nghĩa chỉ số chung (chiso.js) – cùng con số với các trang
 const inc=(m,k,x,vr,vq,vg)=>{let o=m.get(k);if(!o){o={r:0,q:0,g:0,dl:new Set()};m.set(k,o)}o.r+=vr;o.q+=vq;o.g+=vg;if(x.k=='S')o.dl.add(x.d);return o};
 for(const x of R){if(x.int&&!F.inc)continue;const iR=inMet('rev',x),iQ=inMet('qty',x),iG=inMet('gp',x);if(!iR&&!iQ&&!iG)continue;const vr=iR?x.r:0,vq=iQ?x.q:0,vg=iG?x.g:0;const ym=x.y+'-'+p2(x.m);const c1=ym>=P.from&&ym<=P.to,c2=P.cf&&ym>=P.cf&&ym<=P.ct;if(!c1&&!c2)continue;
  const s=D.sku[x.s]||{};if(grp&&(s.grp||x.grp)!=grp)continue;if(fb&&!fb.includes(nz(x.br)))continue;if(fd&&!fd.includes(x.d))continue;if(fc&&!fc.includes(x.p))continue;if(fs&&!fs.includes(x.se))continue;if(fp&&!fp.includes(x.prov))continue;
  if(fk&&!fk.includes(x.s))continue;if(fm2&&!fm2.includes(nz(s.sb)))continue;
  if(Q.f.gpu&&!Q.f.gpu.some(g=>new RegExp('(^|\\D)'+g.split(' ')[0]+'(\\D|$)').test(nz(s.gpu))))continue;if(Q.f.cpu&&!Q.f.cpu.includes(cpuTierOf(s.cpu)))continue;
  if((Q.f.pmin||Q.f.pmax)&&!priceOK(Q,x.up||0,'sales'))continue;
  if(c2){A.rP+=vr;A.qP+=vq;A.gP+=vg;inc(A.brandP,x.br,x,vr,vq,vg);inc(A.dealerP,x.d,x,vr,vq,vg);if(x.k=='S')A.dlP.add(x.d);const o=A.monthP.get(ym)||new Map();inc(o,x.br,x,vr,vq,vg);A.monthP.set(ym,o)}
  if(!c1)continue;if(x.k=='S')A.rows++;A.rev+=vr;A.qty+=vq;A.gp+=vg;if(x.k=='S')A.dl.add(x.d);inc(A.brand,x.br,x,vr,vq,vg);const om=A.month.get(ym)||new Map();inc(om,x.br,x,vr,vq,vg);A.month.set(ym,om);
  const mo=inc(A.model,x.s,x,vr,vq,vg);mo.sb=s.sb;mo.d=s.d;mo.gpu=s.gpu;mo.cpu=s.cpu;mo.grp=s.grp;inc(A.dealer,x.d,x,vr,vq,vg);if(x.p)inc(A.chain,x.p,x,vr,vq,vg);if(x.se)inc(A.sale,x.se,x,vr,vq,vg);if(x.prov)inc(A.prov,x.prov,x,vr,vq,vg)}
 return A}
// ── trình bày kết quả ──
let ASK=null,ASKCTX=null,ASKH=[];try{ASKH=JSON.parse(localStorage.getItem('bh_askh')||'[]');localStorage.removeItem('bh_tts')}catch(e){}
const L_=(vi,en)=>LANG=='en'?en:vi;
const catName=c=>c?(CATN[c]||[c,c])[LANG=='en'?1:0]:L_('Mọi nhóm hàng','All groups');
const isG=b=>/gigabyte/i.test(b);
const topMap=(m,k)=>[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,k||1).map(e=>e[0]).filter(Boolean);
async function askRunBase(text,opt){text=String(text||'').trim();if(!text)return;opt=opt||{};
 let Q=askParse(text,opt.fresh?null:(ASKCTX&&ASKCTX.Q));Q=await askResolve(Q,opt.fresh?null:(ASKCTX&&ASKCTX.Q));askLock(Q,text);
 ASKH=[text].concat(ASKH.filter(x=>x!=text)).slice(0,12);try{localStorage.setItem('bh_askh',JSON.stringify(ASKH))}catch(e){}
 askCompute(Q);if(PAGE!='ask')go('ask');else render()}
function askCompute(Q){for(const k in Q.f){const a=Q.f[k];if(Array.isArray(a)&&typeof a[0]=='string'&&k!='pmin'&&k!='pmax'){const seen=new Set();Q.f[k]=a.filter(x=>{const n=nz(x);if(seen.has(n))return false;seen.add(n);return true})}}const P=askPeriod(Q);ASK={Q,P,A:null,lang:LANG};if(P)ASK.A=Q.src=='imp'?anaImp(Q,P):anaSales(Q,P);ASKCTX={Q}}
function askChips(Q,P){const ch=[];const x=(k,v,lab)=>ch.push(`<span class="achip">${esc(lab)}${k?`<i onclick="askDrop('${k}','${esc(String(v)).replace(/'/g,"\\'")}')">✕</i>`:''}</span>`);
 ch.push(`<span class="achip src">${Q.src=='imp'?L_('Số nhập khẩu','Import data'):L_('Số bán DGW','DGW sales')}</span>`);ch.push(`<span class="achip">${esc(catName(Q.cat))}</span>`);if(Q.focus=='list')ch.push(`<span class="achip src">${L_('Danh sách sản phẩm','Product list')}</span>`);
 const nm={segment:'',gpu:'VGA ',cpu:'',seg:'',brand:'',sub:'',cpuf:'CPU ',ram:'RAM ',ssd:'SSD ',disp:'',hz:'',res:'',kw:'',q:'',importer:L_('Đầu mối ','Importer '),dealer:L_('Đại lý ','Dealer '),chain:L_('Chuỗi ','Chain '),sale:'Sale ',prov:'',model:'',sku:''};
 Object.entries(Q.f).forEach(([k,vs])=>{if(k=='pmin'||k=='pmax')return x(k,'',(k=='pmin'?'> ':'< ')+vs[0]+(vs[1]?' '+vs[1]:''));vs.forEach(v=>x(k,v,((Q.ai&&Q.ai[k]&&Q.ai[k].includes(v))?'✦ ':'')+(nm[k]||'')+(k=='q'?'“'+v+'”'+(Q.fix&&Q.fix[v]?' ← '+Q.fix[v]:''):k=='cpu'?v:k=='dealer'?((D.dl[v]||{}).name||v):v)))});
 if(P)ch.push(`<span class="achip per">${esc(P.lab)}${P.cf&&!(Q.src=='imp'&&ASK&&ASK.A&&!ASK.A.qP)?' · '+L_('so cùng kỳ','vs same period LY'):''}</span>`);return ch.join('')}
function askDropBase(k,v){const Q=ASK&&ASK.Q;if(!Q)return;if(k=='pmin'||k=='pmax')delete Q.f[k];else{Q.f[k]=(Q.f[k]||[]).filter(x=>x!=v);if(!Q.f[k].length)delete Q.f[k]}askCompute(Q);render()}
function askSet(p){const Q=ASK&&ASK.Q;if(!Q)return;Object.assign(Q,p);if(p.src||p.cat){Q.alt=[]}askCompute(Q);render()}
function askHeadBase(){const Q=ASK&&ASK.Q,P=ASK&&ASK.P;
 const alts=Q?[Q.src=='imp'&&R.length?`<button class="btn sm" onclick="askSet({src:'sales'})">${L_('Xem số bán DGW','See DGW sales')}</button>`:'',Q.src=='sales'&&Object.keys(IMPDET).length?`<button class="btn sm" onclick="askSet({src:'imp',cat:'${Q.cat&&IMPDET[Q.cat]?Q.cat:'laptop'}'})">${L_('Xem số nhập khẩu','See import data')}</button>`:'',...(Q.alt||[]).map(c=>`<button class="btn sm" onclick="askSet({cat:'${c}'})">${esc(catName(c))}</button>`)].join(''):'';
 const pers=[['12 tháng gần nhất','Last 12 months',{last:12}],['6 tháng gần nhất','Last 6 months',{last:6}],['Từ đầu năm','Year to date',{rel:'ytd'}],['Năm trước','Last year',{rel:'lasty'}],['Toàn bộ','All data',{rel:'all'}]];
 return `<div class="card askh"><div class="askrow"><div class="askqt">${Q?'“'+esc(Q.text)+'”':L_('Gõ câu hỏi vào ô tìm kiếm phía trên (Ctrl K) – app tự hiểu và phân tích.','Type your question in the search box above (Ctrl K).')}</div><button class="btn sm" onclick="const i=document.getElementById('omq');if(i){i.focus()}" title="${L_('Câu tiếp theo sẽ hiểu theo ngữ cảnh câu này','Next question keeps this context')}">${L_('Hỏi tiếp','Follow up')}</button><button class="btn sm" onclick="ASKCTX=null;const i=document.getElementById('omq');if(i){i.focus()}">${L_('Câu mới','New question')}</button></div>
  ${Q?`<div class="askund"><b>${L_('Đang hiểu','Understood as')}:</b> ${askChips(Q,P)}</div>${Q?`<div class="askalt">${(Q.guess||[]).map(g=>`<span class="note">${esc(g)}</span>`).join('')}${alts}<span style="flex:1"></span><div class="seg askper">${pers.map(([v,e,p])=>{const cur=JSON.stringify(Q.per||{last:12})==JSON.stringify(p);return `<button class="${cur?'on':''}" onclick="askSet({per:${JSON.stringify(p).replace(/"/g,"'")}})">${L_(v,e)}</button>`}).join('')}</div></div>`:''}`:
  `<div class="askex">${['Danh sách laptop gaming chạy Core Ultra 9','List gaming laptops with RTX 5070 32GB RAM last 3 months','Danh sách laptop OLED 14 inch quý này','Nhập khẩu laptop VGA 3050 theo nhãn hàng','Thị phần màn hình gaming quý 3 năm 2026','Gigabyte laptop i7 giá nhập dưới 1000 đô','Đại lý nào lấy nhiều laptop Gigabyte 6 tháng gần nhất','Doanh số màn hình theo sale từ đầu năm','Laptop gigabyte nào sắp hết hàng','Nên nhập thêm màn hình bao nhiêu'].concat(ASKH).slice(0,10).map(x=>`<button class="btn sm" onclick="askRun(this.textContent)">${esc(x)}</button>`).join('')}</div>`}</div>`}
P.ask=()=>{if(ASK&&ASK.Q&&ASK.lang!=LANG)askCompute(ASK.Q);const Q=ASK&&ASK.Q,P=ASK&&ASK.P,A=ASK&&ASK.A;let h=askHead();
 if(!Q){return page(h)}
 if(!P||!A){return page(h+`<div class="card soon"><p>${Q.src=='imp'?L_('Chưa có số liệu nhập khẩu chi tiết. App đang đọc file trong thư mục Import – thử lại sau ít phút.','No detailed import data yet – the app is reading the Import folder, try again in a minute.'):L_('Chưa có số bán.','No sales data.')}</p></div>`)}
 if(Q.src=='imp')return askPageImp(h,Q,P,A);return askPageSales(h,Q,P,A)};
// thẻ KPI v91: biểu tượng · số lớn · viên tăng (xanh) / giảm (đỏ) so cùng kỳ · đường xu hướng theo tháng
function spark(vals,cls){const v=vals.map(x=>isFinite(x)?x:null),nn=v.filter(x=>x!=null);if(nn.length<2)return '';const mn=Math.min(...nn),mx=Math.max(...nn),W=120,H=36,n=v.length;
 const P=v.map((x,i)=>x==null?null:[i*(W/(n-1)),H-3-(mx>mn?(x-mn)/(mx-mn)*(H-8):(H-8)/2)]).filter(Boolean),ln=P.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
 return `<svg class="kspk ${cls||''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polygon points="${P[0][0].toFixed(1)},${H} ${ln} ${P[P.length-1][0].toFixed(1)},${H}"/><polyline points="${ln}"/><circle cx="${P[P.length-1][0].toFixed(1)}" cy="${P[P.length-1][1].toFixed(1)}" r="2.6"/></svg>`}
function kpiX(icon,l,v,cur,prev,o){o=o||{};const has=isFinite(prev)&&prev>0,up=has&&cur>=prev;
 const pill=o.pill!=null?o.pill:has?`<span class="kpill ${up?'up':'dn'}">${up?'▲':'▼'} ${Math.abs((cur/prev-1)*100).toLocaleString(LOC(),{maximumFractionDigits:1})}%</span>`:'';
 return `<div class="card kx ${o.cls||''}${o.go?' dk':''}"${o.go?` onclick="${o.go}" style="cursor:pointer"`:''}><div class="kxh"><span class="kxi">${icon}</span><span>${l}</span></div><div class="kxv">${v}</div><div class="kxd">${pill}<span class="note">${o.sub||''}</span></div>${o.spark||''}</div>`}
function kp2(l,v,d,dk){return `<div class="card kpi${dk?' dk':''}"${dk?` onclick="askDrill('all')" title="${L_('Mở Tổng quan với bộ lọc của câu hỏi','Open Overview with this question\'s filters')}"`:''}><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d||'&nbsp;'}</div></div>`}
function askPageImp(h,Q,P,A){const asp=A.qty?A.usd/A.qty:0,aspP=A.qP?A.uP/A.qP:0,nb=A.brand.size,nbP=A.brandP.size,CF=!!(P.cf&&A.qP);
 if(!A.rows){const tips=[];(Q.f.q||[]).forEach(w=>tips.push(`<button class="btn sm" onclick="askDrop('q','${esc(w)}')">${L_('Bỏ','Drop')} “${esc(w)}”</button>`));if(Q.per&&!(Q.per.rel=='all'))tips.push(`<button class="btn sm" onclick="askSet({per:{rel:'all'}})">${L_('Tìm trong toàn bộ thời gian','Search all time')}</button>`);
  return page(h+`<div class="card soon"><p>${L_('Không có lô nhập nào khớp đủ các điều kiện trong kỳ này.','No shipments match all conditions in this period.')}</p>${tips.length?`<div class="askalt" style="justify-content:center;margin-top:8px">${tips.join('')}</div>`:''}</div>`)}
 const M=A.mkt,TQ=M?M.q:A.qty,TQP=M?M.qP:A.qP,mrk=M?[...M.brand.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]):null;
 const brands=[...A.brand.entries()].map(([b,o])=>{const p=A.brandP.get(b)||{q:0,u:0};const sh=o.q/TQ,shP=TQP?p.q/TQP:NaN;return {b,q:o.q,u:o.u,asp:o.q?o.u/o.q:0,sh,shP,dsh:sh-shP,qP:p.q,yoy:p.q?o.q/p.q-1:NaN,mods:o.sub?o.sub.size:0}}).sort((a,b)=>b.q-a.q);brands.forEach((x,i)=>x.rk=mrk?mrk.indexOf(x.b)+1:i+1);
 const ins=askInsImp(Q,P,A,brands,asp,aspP);
 const months=[];for(let m=P.from;m<=P.to;m=ymAdd(m,1))months.push(m);const topB=brands.slice(0,6).map(x=>x.b);
 const models=[...A.model.values()].sort((a,b)=>b.q-a.q).slice(0,40);const imps=[...A.imp.entries()].map(([k,o])=>({k,q:o.q,u:o.u,sh:o.q/A.qty,top:topMap(o.br,3).join(', ')})).sort((a,b)=>b.q-a.q);
 const bands=[...A.band.entries()].map(([k,o])=>({k,q:o.q,sh:o.q/A.qty,asp:o.q?o.u/o.q:0})).sort((a,b)=>a.k<b.k?-1:1);const tiers=[...A.tier.entries()].map(([k,o])=>({k,q:o.q,sh:o.q/A.qty,asp:o.q?o.u/o.q:0})).sort((a,b)=>b.q-a.q);
 const gpus=[...A.gpu.entries()].map(([k,o])=>({k,q:o.q,sh:o.q/A.qty,asp:o.q?o.u/o.q:0})).sort((a,b)=>b.q-a.q).slice(0,12);
 const quarters=[...new Set(months.map(m=>m.slice(0,4)+' Q'+Math.ceil(+m.slice(5)/3)))];
 const QS=quarters.filter(k=>months.some(m=>m.slice(0,4)+' Q'+Math.ceil(+m.slice(5)/3)==k&&A.month.get(m))).slice(-8),qOf=m=>m.slice(0,4)+' Q'+Math.ceil(+m.slice(5)/3),qLab=k=>'Q'+k.slice(-1)+'/'+k.slice(2,4),qPart=k=>{const e=P.to,eq=qOf(e);return k==eq&&(+e.slice(5)%3!=0||P.partial)};
 const blkBrand=`<div class="card"><div class="askct"><h3>${L_('Nhãn hàng','Brands')}</h3><span class="note">${esc(P.lab)}${CF?' · '+L_('tăng/giảm so cùng kỳ năm trước','growth vs same period last year'):''}${QS.length>1?' · '+L_('số lượng theo quý','units by quarter'):''}${QS.some(qPart)?' · * '+L_('quý chưa đủ tháng','incomplete quarter'):''}</span></div><div class="tw" id="askb"></div></div>`;
 const blkTime=`<div class="grid c2"><div class="card"><div class="askct"><h3>${L_('Sản lượng theo tháng','Monthly volume')}</h3><span class="note">Top 6 ${L_('nhãn','brands')}</span></div><div class="cv t"><canvas id="ask1"></canvas></div></div><div class="card"><div class="askct"><h3>${L_('Diễn biến thị phần','Share trend')}</h3><span class="note">% ${L_('sản lượng theo tháng','of monthly volume')}</span></div><div class="cv t"><canvas id="ask2"></canvas></div></div></div>`;
 const blkModel=`<div class="card"><div style="display:flex;gap:8px;align-items:center"><h3 style="flex:1;margin:0">${L_('Model / dòng máy · cấu hình chi tiết','Models · full configuration')}</h3><button class="btn sm p" onclick="askListXlsx()">⇪ ${L_('Xuất Excel','Export Excel')}</button></div><div class="tw" id="askm" style="max-height:620px;margin-top:8px"></div></div>`;
 const blkCfg=`<div class="grid c2"><div class="card"><h3>${L_('Bậc CPU','CPU tier')}</h3><div class="tw" id="askc"></div></div><div class="card"><h3>VGA</h3><div class="tw" id="askg"></div></div></div>`;
 const blkImp=`<div class="card"><h3>${L_('Nhà nhập khẩu','Importers')}</h3><div class="tw" id="aski"></div></div>`;
 // v101: bảng Model tách theo từng tháng – mỗi dòng = 1 cấu hình × 1 tháng (cột Year + Month), mới nhất trước
 const LST=[];if(A.list)for(const r of A.list.values())for(const [ym,m] of r.mq){if(!m.q&&!m.u)continue;LST.push(Object.assign({},r,{q:m.q,u:m.u,mn:m.mn,mx:m.mx,imp:m.imp,f:ym,l:ym,mq:new Map([[ym,m]])}))}
 LST.sort((a,b)=>(a.f<b.f?1:a.f>b.f?-1:0)||b.q-a.q);ASK.list=LST;
 const order={list:[blkModel,blkBrand,blkCfg,blkTime,blkImp],importer:[blkImp,blkBrand,blkTime,blkModel,blkCfg],model:[blkModel,blkBrand,blkTime,blkCfg,blkImp],config:[blkCfg,blkModel,blkBrand,blkTime,blkImp],price:[blkCfg,blkBrand,blkModel,blkTime,blkImp],time:[blkTime,blkBrand,blkModel,blkCfg,blkImp]}[Q.focus]||[blkBrand,blkTime,blkModel,blkCfg,blkImp];
 const MS=months.map(m=>{const o=A.month.get(m);let q=0,u=0,gq=0;if(o)o.forEach((x,k)=>{q+=x.q;u+=x.u;if(isG(k))gq+=x.q});const tq=M?(M.month.get(m)||0):q;return {q,u,asp:q?u/q:NaN,gs:tq?gq/tq*100:NaN}});
 const G=brands.find(x=>isG(x.b)),nAll=M?M.brand.size:nb,LY=L_('Cùng kỳ','Last year');
 page(h+`<div class="grid kxg">${kpiX('▦',L_('Sản lượng nhập','Units imported'),fn(A.qty),A.qty,CF?A.qP:NaN,{go:"askDrill('all')",sub:CF?`${LY}: ${fn(A.qP)}`:'',spark:spark(MS.map(x=>x.q))})}${kpiX('$',L_('Giá trị nhập','Import value'),fusd(A.usd),A.usd,CF?A.uP:NaN,{go:"askDrill('all')",sub:CF?`${LY}: ${fusd(A.uP)}`:'',spark:spark(MS.map(x=>x.u))})}${kpiX('⌀',L_('Giá nhập TB','Avg import price'),'$'+fn(asp),asp,CF?aspP:NaN,{go:"askDrill('all')",sub:CF&&aspP?`${LY}: $${fn(aspP)}`:'',spark:spark(MS.map(x=>x.asp))})}${kpiX('G','GIGABYTE · share',G?fpc(G.sh):'–',0,NaN,{go:"askDrill('all')",cls:'kxg1',pill:G&&CF&&isFinite(G.dsh)?`<span class="kpill ${G.dsh>=0?'up':'dn'}">${G.dsh>=0?'▲':'▼'} ${fpts(G.dsh).replace(/^[+-]/,'')} ${L_('điểm','pts')}</span>`:'',sub:G?`${L_('Hạng','Rank')} #${G.rk}/${nAll}`:L_('chưa có lô nhập trong phạm vi này','no shipments in this scope'),spark:G?spark(MS.map(x=>x.gs),'g'):''})}</div>
  ${insLine(L_('Nhận định','Insights'),ins)}${order.join('')}`);
 const mxSh=Math.max(...brands.map(x=>x.sh)),qQty=(b,k)=>{let t=0;months.forEach(m=>{if(qOf(m)==k){const o=A.month.get(m);if(o&&o.get(b))t+=o.get(b).q}});return t};
 tbl('askb',[{t:'#',v:r=>r.rk},{t:L_('Nhãn hàng','Brand'),v:r=>r.b,h:r=>isG(r.b)?`<b style="color:var(--s4)">${esc(r.b)}</b>`:`<b>${esc(r.b)}</b>`},{t:L_('Số lượng','Units'),n:1,v:r=>r.q,h:r=>fn(r.q)},{t:'Share',n:1,v:r=>r.sh,h:r=>`${shbar(r.sh,mxSh)} ${fpc(r.sh)}`}]
  .concat(CF?[{t:L_('Tăng/giảm','Growth'),n:1,v:r=>r.qP?r.q/r.qP:1e9,h:r=>`<span class="${!r.qP||r.q>=r.qP?'up':'dn'}" title="${L_('Cùng kỳ','Same period LY')}: ${fn(r.qP)} → ${fn(r.q)}">${fgrow(r.q,r.qP)}</span>`}]:[])
  .concat([{t:L_('Giá trị','Value'),n:1,v:r=>r.u,h:r=>fusd(r.u)},{t:L_('Giá nhập TB','Avg price'),n:1,v:r=>r.asp,h:r=>'$'+fn(r.asp)}])
  .concat(QS.length>1?QS.map(k=>({t:qLab(k)+(qPart(k)?'*':''),n:1,v:r=>qQty(r.b,k),h:r=>{const v=qQty(r.b,k);return v?fn(v):'<span class="note">·</span>'}})):[]),brands,null,{hdr:true});
 const col=b=>brandCol(b);// v107: màu cố định theo hãng
 chart('ask1',{type:'bar',data:{labels:months.map(ymLbl),datasets:topB.map(b=>({label:b,data:months.map(m=>{const o=A.month.get(m);return o&&o.get(b)?o.get(b).q:0}),backgroundColor:col(b),stack:'s',borderRadius:2})).concat([{label:L_('Khác','Others'),data:months.map(m=>{const o=A.month.get(m);if(!o)return 0;let s=0;o.forEach((v,k)=>{if(!topB.includes(k))s+=v.q});return s}),backgroundColor:css('--line2'),stack:'s'}])},options:{scales:{x:{stacked:true,ticks:{color:css('--ink2')},grid:{display:false}},y:{stacked:true,ticks:{color:css('--ink2'),callback:v=>fn(v)},grid:{color:css('--line')}}}}});
 chart('ask2',{type:'line',data:{labels:months.map(ymLbl),datasets:topB.slice(0,5).map(b=>({label:b,data:months.map(m=>{const o=A.month.get(m);if(!o)return null;let t=0;o.forEach(v=>t+=v.q);if(M)t=M.month.get(m)||0;return t?+((o.get(b)?o.get(b).q:0)/t*100).toFixed(1):null}),borderColor:col(b),backgroundColor:col(b),tension:.3,pointRadius:2,borderWidth:isG(b)?3:2}))},options:{scales:{y:{ticks:{color:css('--ink2'),callback:v=>v+'%'},grid:{color:css('--line')}},x:{ticks:{color:css('--ink2')},grid:{display:false}}}}});
 const tm=mp=>mp?topMap(mp,1)[0]||'':'';
 {const d0=IMPDET[Q.cat],O=listOrder(d0),has=k=>LST.some(r=>r.v[k]&&r.v[k]!='-');LST.forEach((r,k)=>r.rk=k+1);
  // cột = đúng thứ tự / tên cột sheet Data; cột trống ở mọi dòng thì ẩn
  const colOf=o=>o.k=='ym'?{t:o.t,k:o.k,v:r=>r.f,fv:r=>[...r.mq.keys()],fl:ymLbl,fs:(a,b)=>a<b?-1:a>b?1:0,h:r=>`<span class="nw">T${+r.f.slice(5,7)}</span>`}
   :o.k=='q'?{t:o.t,k:o.k,n:1,v:r=>r.q,h:r=>`<b>${fn(r.q)}</b>`}:o.k=='u'?{t:o.t,k:o.k,n:1,v:r=>Math.round(r.u),h:r=>'$'+fn(r.u)}
   :o.k=='avg'?{t:o.t,k:o.k,n:1,v:r=>r.q?Math.round(r.u/r.q):0,h:r=>`<span title="${r.mn!=null?'$'+fn(r.mn)+' – $'+fn(r.mx):''}">$${fn(r.q?r.u/r.q:0)}</span>`}
   :o.k=='importer'?{t:o.t,k:o.k,v:r=>topMap(r.imp,1)[0]||''}
   :o.k=='brand'?{t:o.t,k:o.k,v:r=>r.v.brand,h:r=>isG(r.v.brand)?`<b style="color:var(--s4)">${esc(r.v.brand)}</b>`:`<b>${esc(r.v.brand)}</b>`}
   :o.k=='sub'?{t:o.t,k:o.k,v:r=>r.v.sub,h:r=>`<span class="wr">${esc(r.v.sub)}</span>`}
   :{t:o.t,k:o.k,v:r=>r.v[o.k]||''};
  const cols=[{t:'#',k:'#',v:r=>r.rk},{t:'Year',k:'yr',v:r=>r.f.slice(0,4)}].concat(O.filter(o=>LIST_NUM.has(o.k)||has(o.k)).map(colOf));ASK.listCols=cols;
  const mi=cols.findIndex(c=>c.k=='ym');
  tbl('askm',cols,LST,null,{flt:true,hdr:true,frame:true,derive:(data,F)=>F[mi]?askListMonths(data,F[mi].s):data})}
 const mxT=Math.max(...tiers.map(x=>x.sh),0),mxG=Math.max(...gpus.map(x=>x.sh),0);
 tbl('askc',[{t:'CPU',v:r=>r.k},{t:L_('Số lượng','Units'),n:1,v:r=>r.q,h:r=>fn(r.q)},{t:'Share',n:1,v:r=>r.sh,h:r=>`${shbar(r.sh,mxT)} ${fpc(r.sh)}`},{t:L_('Giá TB','Avg'),n:1,v:r=>r.asp,h:r=>'$'+fn(r.asp)}],tiers,null,{hdr:true});
 tbl('askg',[{t:'VGA',v:r=>r.k},{t:L_('Số lượng','Units'),n:1,v:r=>r.q,h:r=>fn(r.q)},{t:'Share',n:1,v:r=>r.sh,h:r=>`${shbar(r.sh,mxG)} ${fpc(r.sh)}`},{t:L_('Giá TB','Avg'),n:1,v:r=>r.asp,h:r=>'$'+fn(r.asp)}],gpus,null,{hdr:true});
 tbl('aski',[{t:L_('Nhà nhập khẩu','Importer'),v:r=>r.k},{t:L_('Số lượng','Units'),n:1,v:r=>r.q,h:r=>fn(r.q)},{t:'Share',n:1,v:r=>r.sh,h:r=>fpc(r.sh)},{t:L_('Giá trị','Value'),n:1,v:r=>r.u,h:r=>fusd(r.u)},{t:L_('Nhãn nhập nhiều nhất','Top brands'),v:r=>r.top}],imps,null,{hdr:true})}
function askInsImp(Q,P,A,brands,asp,aspP){const o=[],b=x=>`<b>${esc(x)}</b>`;
  const M=A.mkt;if(M&&M.q){const mb=[...M.brand.entries()].sort((a,c)=>c[1]-a[1]);const top=mb.slice(0,3).map(([k,v])=>`${b(k)} ${fpc(v/M.q)}`).join(', ');o.push(L_(`Toàn thị trường cùng điều kiện: ${b(fn(M.q))} chiếc`+(P.cf&&M.qP?` (${fyoy(M.q,M.qP)} so cùng kỳ)`:'')+`, ${mb.length} nhãn; dẫn đầu ${top}`,`Whole market, same conditions: ${b(fn(M.q))} units`+(P.cf&&M.qP?` (${fyoy(M.q,M.qP)} vs LY)`:'')+`, ${mb.length} brands; leaders ${top}`));
  brands.forEach(x=>o.push(L_(`${b(x.b)}: hạng #${x.rk}/${mb.length}, share ${fpc(x.sh)}`+(isFinite(x.dsh)?` (${fpts(x.dsh)} điểm)`:'')+`, giá nhập TB $${fn(x.asp)} so với thị trường $${fn(M.u/M.q)}`,`${b(x.b)}: rank #${x.rk}/${mb.length}, share ${fpc(x.sh)}`+(isFinite(x.dsh)?` (${fpts(x.dsh)} pts)`:'')+`, avg import price $${fn(x.asp)} vs market $${fn(M.u/M.q)}`)))}
 const t3=M?[]:brands.slice(0,3);if(t3.length)o.push(L_('Dẫn đầu: ','Leaders: ')+t3.map(x=>`${b(x.b)} ${fpc(x.sh)}`+(isFinite(x.dsh)?` (<span class="${x.dsh>=0?'up':'dn'}">${fpts(x.dsh)} ${L_('điểm','pts')}</span>)`:'')).join(', ')+(brands.length>3?L_(` – top 3 nắm ${fpc(t3.reduce((a,x)=>a+x.sh,0))}`,` – top 3 hold ${fpc(t3.reduce((a,x)=>a+x.sh,0))}`):''));
 const g=brands.filter(x=>x.qP>=Math.max(200,A.qP*.02)&&isFinite(x.yoy));if(g.length>1){const up=g.slice().sort((a,b)=>b.yoy-a.yoy)[0],dn=g.slice().sort((a,b)=>a.yoy-b.yoy)[0];if(up.yoy>0)o.push(L_(`Tăng nhanh nhất: ${b(up.b)} ${fyoyC(up.q,up.qP)} (${fn(up.qP)} → ${fn(up.q)} chiếc)`,`Fastest growth: ${b(up.b)} ${fyoyC(up.q,up.qP)} (${fn(up.qP)} → ${fn(up.q)} units)`));if(dn.yoy<0)o.push(L_(`Giảm mạnh nhất: ${b(dn.b)} ${fyoyC(dn.q,dn.qP)} (${fn(dn.qP)} → ${fn(dn.q)} chiếc)`,`Steepest decline: ${b(dn.b)} ${fyoyC(dn.q,dn.qP)} (${fn(dn.qP)} → ${fn(dn.q)} units)`))}
 const G=brands.find(x=>isG(x.b));if(G&&!M&&asp&&brands.length>1){const gp=(G.asp/asp-1)*100;o.push(L_(`${b('GIGABYTE')} giá nhập TB ${b('$'+fn(G.asp))} – <span class="${gp>=0?'up':'dn'}">${gp>=0?'cao':'thấp'} hơn thị trường ${Math.abs(gp).toFixed(0)}%</span> ($${fn(asp)})`,`${b('GIGABYTE')} avg import price ${b('$'+fn(G.asp))} – ${Math.abs(gp).toFixed(0)}% ${gp>=0?'above':'below'} market ($${fn(asp)})`))}
 else if(!(Q.f.brand||[]).length)o.push(L_(`${b('GIGABYTE')} chưa có lô nhập nào trong phạm vi này – khoảng trống để cân nhắc.`,`${b('GIGABYTE')} has no shipments in this scope – a gap to consider.`));
 if(P.partial)o.push(`<span class="warn">${L_(`Tháng ${ymLbl(P.eym)} mới có số liệu tới ngày ${P.end.slice(8,10)}/${P.end.slice(5,7)} – so sánh tháng cuối chưa đầy đủ.`,`${ymLbl(P.eym)} only has data up to ${P.end} – the last month is incomplete.`)}</span>`);
 return o}
function askPageSales(h,Q,P,A){if(!A.rows)return page(h+`<div class="card soon"><p>${L_('Không có dòng bán nào khớp điều kiện trong kỳ này.','No sales match these conditions in this period.')}</p></div>`);
 const asp=A.qty?A.rev/A.qty:0,gpm=A.rev?A.gp/A.rev:0;const dl=[...A.dealer.entries()].map(([k,o])=>{const p=A.dealerP.get(k);return {k,n:(D.dl[k]||{}).name||k,ch:(D.dl[k]||{}).parent||'',r:o.r,q:o.q,g:o.g,sh:o.r/A.rev,rP:p?p.r:0}}).sort((a,b)=>b.r-a.r);
 const mods=[...A.model.entries()].map(([k,o])=>({k,sb:o.sb,d:o.d,gpu:o.gpu,cpu:o.cpu,r:o.r,q:o.q,g:o.g,dl:o.dl.size})).sort((a,b)=>b.q-a.q).slice(0,40);
 const grpBy=m=>[...m.entries()].map(([k,o])=>({k,r:o.r,q:o.q,g:o.g,sh:o.r/A.rev,dl:o.dl.size})).sort((a,b)=>b.r-a.r);const ch=grpBy(A.chain),sl=grpBy(A.sale),pv=grpBy(A.prov);
 const months=[];for(let m=P.from;m<=P.to;m=ymAdd(m,1))months.push(m);const brs=[...A.brand.keys()];
 const o=[],b=x=>`<b>${esc(x)}</b>`;o.push(L_(`${b(catName(Q.cat))} – ${esc(P.lab)}: doanh thu ${askLk('all','',fm(A.rev))}, ${b(fn(A.qty))} sp, ${fn(A.dl.size)} đại lý`+(P.cf&&A.rP?`; ${fyoy(A.rev,A.rP)} so cùng kỳ`:''),`${b(catName(Q.cat))} – ${esc(P.lab)}: revenue ${askLk('all','',fm(A.rev))}, ${b(fn(A.qty))} units, ${fn(A.dl.size)} dealers`+(P.cf&&A.rP?`; ${fyoy(A.rev,A.rP)} vs LY`:'')));
 if(dl.length)o.push(L_('Đại lý lớn nhất: ','Top dealers: ')+dl.slice(0,3).map(x=>`${askLk('dealer',x.k,esc(x.n.slice(0,40)))} ${fpc(x.sh)}`).join(', '));if(ch.length)o.push(L_('Chuỗi lớn nhất: ','Top chains: ')+ch.slice(0,3).map(x=>`${askLk('chain',x.k,esc(x.k))} ${fpc(x.sh)}`).join(', '));
 if(mods.length)o.push(L_(`Mã bán nhiều nhất: ${askLk('sku',mods[0].k,esc(mods[0].k))}${mods[0].d?' ('+esc(String(mods[0].d).slice(0,48))+')':''} ${fn(mods[0].q)} sp`,`Best-selling SKU: ${askLk('sku',mods[0].k,esc(mods[0].k))}${mods[0].d?' ('+esc(String(mods[0].d).slice(0,48))+')':''} ${fn(mods[0].q)} units`));if(sl.length)o.push(L_('Sale dẫn đầu: ','Top reps: ')+sl.slice(0,3).map(x=>`${askLk('sale',x.k,esc(x.k))} ${fpc(x.sh)}`).join(', '));
 const lost=[...A.dealerP.keys()].filter(k=>!A.dealer.has(k));if(P.cf&&lost.length)o.push(L_(`${fn(lost.length)} đại lý mua cùng kỳ năm trước nhưng chưa lấy hàng kỳ này`,`${fn(lost.length)} dealers bought last year but not this period`));
 if(!noGP()&&A.rev)o.push(L_(`Biên lãi gộp ${fpc(gpm)}`,`Gross margin ${fpc(gpm)}`));
 page(h+`<div class="grid" style="grid-template-columns:repeat(4,1fr)">${kp2(metLab('rev'),fm(A.rev),P.cf?fyoy(A.rev,A.rP)+' '+L_('so cùng kỳ','vs LY'):'',1)}${kp2(metLab('qty'),fn(A.qty),P.cf?fyoy(A.qty,A.qP)+' '+L_('so cùng kỳ','vs LY'):'',1)}${kp2(metLab('asp'),fm(asp),'',1)}${HIDEP?kp2(metLab('dealers'),fn(A.dl.size),'',1):kp2(metLab('gp'),fm(A.gp),L_('Biên ','Margin ')+fpc(gpm),1)}</div>
  ${insLine(L_('Nhận định','Insights'),o)}
  <div class="card"><h3>${L_('Doanh thu theo tháng','Monthly revenue')}</h3><div class="cv t"><canvas id="ask1"></canvas></div></div>
  <div class="card"><h3>${L_('Mã hàng / model','SKUs / models')}</h3><div class="tw" id="askm"></div></div>
  <div class="grid c2"><div class="card"><h3>${L_('Đại lý','Dealers')}</h3><div class="tw" id="askd"></div></div><div class="card"><h3>${L_('Chuỗi / khách hàng cha','Chains / parent customers')}</h3><div class="tw" id="askch"></div></div></div>
  <div class="grid c2"><div class="card"><h3>Sale</h3><div class="tw" id="asks"></div></div><div class="card"><h3>${L_('Tỉnh / thành','Provinces')}</h3><div class="tw" id="askpv"></div></div></div>`);
 const S8=S();chart('ask1',{type:'bar',data:{labels:months.map(ymLbl),datasets:brs.map((br,i)=>({label:br,data:months.map(m=>{const x=A.month.get(m);return x&&x.get(br)?+x.get(br).r.toFixed(1):0}),backgroundColor:isG(br)?css('--s4'):S8[i%8],stack:'s',borderRadius:2}))},options:{scales:{x:{stacked:true,ticks:{color:css('--ink2')},grid:{display:false}},y:{stacked:true,ticks:{color:css('--ink2'),callback:v=>fm(v)},grid:{color:css('--line')}}}}});
 const gpC=noGP()?[]:[{t:L_('Lãi gộp','Gross profit'),n:1,v:r=>r.g,h:r=>fm(r.g)},{t:L_('Biên','Margin'),n:1,v:r=>r.r?r.g/r.r:0,h:r=>fpc(r.r?r.g/r.r:0)}];
 tbl('askm',[{t:L_('Mã','SKU'),v:r=>r.k},{t:L_('Dòng','Series'),v:r=>r.sb||''},{t:'CPU',v:r=>r.cpu||''},{t:'VGA',v:r=>r.gpu||''},{t:L_('Số lượng','Units'),n:1,v:r=>r.q,h:r=>fn(r.q)},{t:L_('Doanh thu','Revenue'),n:1,v:r=>r.r,h:r=>fm(r.r)},{t:L_('Giá TB','Avg price'),n:1,v:r=>r.q?r.r/r.q:0,h:r=>fm(r.q?r.r/r.q:0)},{t:L_('Số đại lý','Dealers'),n:1,v:r=>r.dl}].concat(gpC),mods,r=>{askToF();drawer('s',r.k)});
 tbl('askd',[{t:L_('Đại lý','Dealer'),v:r=>r.n,h:r=>`<span style="display:inline-block;max-width:260px;white-space:normal">${esc(r.n)}</span>`},{t:L_('Doanh thu','Revenue'),n:1,v:r=>r.r,h:r=>fm(r.r)},{t:'Share',n:1,v:r=>r.sh,h:r=>fpc(r.sh)},{t:L_('Số lượng','Units'),n:1,v:r=>r.q,h:r=>fn(r.q)},{t:L_('Tăng/giảm','Growth'),n:1,v:r=>r.rP?r.r/r.rP-1:-9,h:r=>r.rP?`<span class="${r.r>=r.rP?'up':'dn'}">${fyoy(r.r,r.rP)}</span>`:L_('mới','new')}].concat(gpC),dl.slice(0,60),r=>{askToF();drawer('d',r.k)});
 const simple=(id,lab,rows,kd)=>tbl(id,[{t:lab,v:r=>r.k},{t:L_('Doanh thu','Revenue'),n:1,v:r=>r.r,h:r=>fm(r.r)},{t:'Share',n:1,v:r=>r.sh,h:r=>fpc(r.sh)},{t:L_('Số lượng','Units'),n:1,v:r=>r.q,h:r=>fn(r.q)},{t:L_('Đại lý','Dealers'),n:1,v:r=>r.dl}].concat(gpC),rows,r=>askDrill(kd,r.k));
 simple('askch',L_('Chuỗi','Chain'),ch.slice(0,40),'chain');simple('asks','Sale',sl,'sale');simple('askpv',L_('Tỉnh','Province'),pv,'prov')}
window.NOFLT=window.NOFLT||new Set();NOFLT.add('ask');
onRender(()=>{if(PAGE=='ask'){const t=document.getElementById('ttl');if(t)t.textContent=L_('Hỏi đáp thông minh','Smart Q&A')}});
// Xuất báo cáo từ trang hỏi đáp: ghi câu hỏi + kỳ thay cho bộ lọc số bán


// ===== v86 – Tìm kiếm thông minh (Việt + Anh) trên số nhập khẩu =====
// Tầng 1 – MÁY (tức thì, chính xác tuyệt đối): hiểu họ CPU (Core Ultra 9 ≠ Core i9), RAM, SSD, khổ màn, Hz, độ phân giải, OLED,
//          thời gian kiểu Anh/Việt, "danh sách / list" → bảng sản phẩm theo cấu hình (mặc định 6 tháng gần nhất).
// Tầng 2 – AI TRÊN MÁY (Qwen3): chỉ gọi khi câu còn chữ máy chưa hiểu; AI chỉ được chọn GIÁ TRỊ CÓ THẬT trong dữ liệu,
//          không tự đặt số. Chip do AI thêm có dấu ✦ – anh bỏ chip nào là app ghi nhận AI hiểu sai.
// Tầng 3 – HỌC: anh bấm "Ghi nhớ cách hiểu" → cụm từ → bộ lọc lưu ở _DGV-GBT\tim-kiem-hoc.json; lần sau máy hiểu ngay
//          (không cần AI). Các câu đã duyệt là ví dụ mẫu cho AI và là dữ liệu đào tạo (LoRA) sau này – không rời khỏi máy.
const TKK = ['cpuf', 'ram', 'ssd', 'disp', 'hz', 'res', 'kw']; // + 'q' = chữ tự do (tìm trên mọi cột)
const TK = { mem: null, busy: false, msg: '' };
// ---- tiếng Anh → cách nói tiếng Việt mà bộ hiểu câu đã biết (sau khi bỏ dấu) ----
const TK_EN = [[/\bimport price\b/g, 'gia nhap'], [/\bimport (?:units|volume|quantity)\b/g, 'so luong nhap khau'], [/\bby dealers?\b/g, 'theo dai ly'], [/\bby (?:sales ?)?reps?\b/g, 'theo sale'], [/\bby provinces?\b/g, 'theo tinh'], [/\bby chains?\b/g, 'theo chuoi'], [/\bby skus?\b/g, 'theo ma hang'], [/\bby config(?:uration)?s?\b/g, 'theo cau hinh'],
  [/\byear (20\d\d)\b/g, 'nam $1'], [/\bmarket share\b/g, 'thi phan'], [/\b(?:sales|revenue|sell[- ]?in)\b/g, 'doanh so'], [/\bvs (?:the )?same period(?: last year)?\b|\byoy\b/g, 'so voi cung ky'], [/\b(?:last|past|previous|recent) (\d{1,2}) months?\b/g, '$1 thang gan nhat'], [/\b(?:last|past) (?:half (?:a )?year|six months)\b/g, '6 thang gan nhat'],
  [/\b(?:last|past) (\d) quarters?\b/g, (m, n) => (3 * n) + ' thang gan nhat'], [/\b(?:last|past) (?:12 months|year)\b(?! ?\d)/g, '12 thang gan nhat'], [/\bthis month\b/g, 'thang nay'], [/\blast month\b/g, 'thang truoc'],
  [/\bthis quarter\b/g, 'quy nay'], [/\blast quarter\b/g, 'quy truoc'], [/\bthis year\b|\byear to date\b/g, 'nam nay'], [/\blast year\b/g, 'nam ngoai'],
  [/\b(?:under|below|less than|cheaper than|max|up to)\b/g, 'duoi'], [/\b(?:over|above|more than|at least|from)\b(?= ?\$?\d)/g, 'tren'],
  [/\blaptops\b/g, 'laptop'], [/\bnotebooks\b/g, 'notebook'], [/\bmonitors\b/g, 'monitor'], [/\bservers\b/g, 'server'], [/\bdesktops\b|\bpcs\b/g, 'pc'],
  [/\bimports?\b|\bimported\b/g, 'nhap khau'], [/\bby brands?\b/g, 'theo nhan'], [/\bby importers?\b/g, 'theo nha nhap khau'], [/\bby models?\b/g, 'theo model'], [/\bby months?\b/g, 'theo thang'],
  [/\bdollars?\b/g, 'usd'], [/\bnua nam\b/g, '6 thang gan nhat'], [/(?<!thang )\b(\d{1,2}) thang\b(?! ?(?:gan|qua|vua|truoc|cuoi|\d))/g, '$1 thang gan nhat']];
function tkPre(text) { let t = nz(text); for (const [re, to] of TK_EN) t = t.replace(re, to); return t }
const TK_LIST = /\b(danh sach|liet ke|list|listing|show all|cac mau|cac model|nhung mau|nhung model|toan bo san pham|tat ca san pham|which models|what models|san pham nao|mau nao|model nao)\b/;
// ---- nhận diện cấu hình trong câu (chuỗi đã bỏ dấu) ----
function tkDetect(t) {
  const o = {}, add = (k, v) => { (o[k] = o[k] || []).includes(v) || o[k].push(v) }; let m;
  for (m of t.matchAll(/\b(?:core\s?)?ultra\s?([3579])\b/g)) add('cpuf', 'Core Ultra ' + m[1]);
  for (m of t.matchAll(/\b(?:core\s?)?i([3579])\b|\bcore i ([3579])\b/g)) add('cpuf', 'Core i' + (m[1] || m[2]));
  for (m of t.matchAll(/\bcore\s([357])\b/g)) add('cpuf', 'Core ' + m[1]);
  if (/\bryzen\s?ai\s?max/.test(t)) add('cpuf', 'Ryzen AI Max');
  for (m of t.matchAll(/\bryzen\s?ai\s?([3579])\b/g)) add('cpuf', 'Ryzen AI ' + m[1]);
  for (m of t.matchAll(/\bryzen\s?([3579])\b/g)) add('cpuf', 'Ryzen ' + m[1]);
  if (/\bsnapdragon\b|\bx elite\b|\bx plus\b/.test(t)) add('cpuf', 'Snapdragon X');
  if (/\b(apple|macbook|chip)\b/.test(t)) for (m of t.matchAll(/\bm([1-5])(?:\s(pro|max))?\b/g)) add('cpuf', 'Apple M' + m[1] + (m[2] ? ' ' + m[2][0].toUpperCase() + m[2].slice(1) : ''));
  for (m of t.matchAll(/\b(\d{3,5}(?:hx|hs|hk|h|u|v|k))\b/g)) if (!/^\d+k$/.test(m[1]) || /^\d{4,5}k$/.test(m[1])) add('cpuf', m[1].toUpperCase());
  // RAM: "32gb ram", "ram 32gb", hoặc "32gb" đứng riêng (không đi sau mã card, không phải ổ)
  for (m of t.matchAll(/\b(\d{1,3})\s?gb?\s?(?:ram|ddr\d?x?|lpddr\d?x?)\b|\bram\s?(\d{1,3})\s?gb?\b/g)) add('ram', (m[1] || m[2]) + 'GB');
  for (m of t.matchAll(/(?<!(?:rtx|gtx|rx|vga|vram|card|\d{3,4})\s?)\b(8|12|16|18|24|32|36|48|64|96|128)\s?gb\b(?!\s?(?:ssd|nvme|o cung|storage|vram|pcie|hdd))/g)) if (!o.ram) add('ram', m[1] + 'GB');
  for (m of t.matchAll(/\b(\d+(?:\.\d)?)\s?(tb|gb)\s?(?:ssd|nvme|o cung|storage|pcie)\b|\b(?:ssd|o cung|storage)\s?(\d+(?:\.\d)?)\s?(tb|gb)\b|\b([124])\s?tb\b/g)) {
    const v = m[1] || m[3] || m[5], u = m[2] || m[4] || 'tb'; add('ssd', v + u.toUpperCase()) }
  for (m of t.matchAll(/\b(1[0-8](?:\.\d)?)\s?(?:inch|inches|in)\b|\bman(?: hinh)?\s(1[0-8](?:\.\d)?)\b/g)) add('disp', (m[1] || m[2]) + '"');
  for (m of t.matchAll(/\b(\d{2,3})\s?hz\b/g)) add('hz', m[1] + 'Hz');
  if (/\b(fhd|full hd|1080p|wuxga)\b/.test(t)) add('res', 'FHD');
  if (/\b(qhd|wqhd|wqxga|2k|2\.5k|1440p|1600p)\b/.test(t)) add('res', 'QHD');
  if (/\b(3k|2\.8k|3\.2k)\b/.test(t)) add('res', '3K');
  if (/\b(4k|uhd|2160p)\b/.test(t)) add('res', '4K');
  if (/\boled\b/.test(t)) add('kw', 'OLED'); if (/\bmini ?led\b/.test(t)) add('kw', 'Mini LED');
  if (/\b(cam ung|touch ?screen|touch)\b/.test(t)) add('kw', 'Cảm ứng'); if (/\b(2 in 1|2 trong 1|x360|flip|xoay gap)\b/.test(t)) add('kw', '2-in-1');
  return o }
// ---- so khớp một giá trị dữ liệu với nhãn bộ lọc ----
const tkNum = (s, re) => { const m = String(s).match(re); return m ? parseFloat(m[1]) : null };
function tkGB(v) { const n = nz(v); let m; if (!n || /^-$|^no /.test(n)) return null; if (m = n.match(/(\d+)\s?x\s?(\d+)\s?gb/)) return +m[1] * +m[2]; if (m = n.match(/(\d+(?:\.\d+)?)\s?tb/)) return Math.round(+m[1] * 1024); if (m = n.match(/(\d+)\s?gb/)) return +m[1]; return null }
function tkCpuRe(lab) { const l = nz(lab); let m;
  if (m = l.match(/^core ultra (\d)$/)) return new RegExp('\\bultra ?' + m[1] + '\\b');
  if (m = l.match(/^core i(\d)$/)) return new RegExp('\\bi' + m[1] + '\\b|\\bi' + m[1] + '(?=[ -]?\\d)');
  if (m = l.match(/^core (\d)$/)) return new RegExp('(?<!ultra )\\bcore ' + m[1] + '\\b');
  if (l == 'ryzen ai max') return /ryzen ai max/; if (m = l.match(/^ryzen ai (\d)$/)) return new RegExp('ryzen ai ' + m[1] + '\\b');
  if (m = l.match(/^ryzen (\d)$/)) return new RegExp('ryzen ' + m[1] + '\\b'); if (l == 'snapdragon x') return /snapdragon|\bx elite\b|\bx plus\b|\bx1[ep]\b/;
  if (m = l.match(/^apple m(\d)( pro| max)?$/)) return new RegExp('\\bm' + m[1] + (m[2] ? m[2] : '(?! pro| max)') + '\\b');
  return new RegExp('\\b' + l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b') }
function tkResOf(t) { return /\b(4k|uhd|3840|2160p?)\b/.test(t) ? '4K' : /\b(3k|2\.8k|2880|3200|3072|3\.2k)\b/.test(t) ? '3K' : /\b(qhd\+?|wqhd|wqxga|2k|2\.5k|2560|1440p?|1600p)\b/.test(t) ? 'QHD' : /\b(fhd\+?|full hd|1920|1080p?|wuxga|1200p)\b/.test(t) ? 'FHD' : '' }
const TK_KW = { 'OLED': /\boled\b/, 'Mini LED': /\bmini ?led\b/, 'Cảm ứng': /\b(touch|cam ung)\b/, '2-in-1': /\b(2 in 1|x360|flip|2 trong 1)\b/ };
// bộ lọc theo dòng: trả hàm (i) → đúng/sai; tính sẵn theo từng mã từ điển để chạy nhanh trên hàng trăm nghìn dòng
function askXF(d, Q) {
  const F = Q.f; if (!TKK.concat(['q']).some(k => F[k] && F[k].length)) return null; const C = d.col, DI = d.dict;
  const memo = (k, fn) => { const a = new Array(DI[k].length); return i => { const c = C[k][i]; let v = a[c]; if (v === undefined) v = a[c] = fn(nz(DI[k][c] || '')); return v } };
  const desc = i => nz((DI.desc[C.desc[i]] || '') + ' ' + (DI.sub[C.sub[i]] || '') + ' ' + (DI.part[C.part[i]] || ''));
  const T = [];
  if (F.cpuf && F.cpuf.length) { const res = F.cpuf.map(tkCpuRe), on = memo('cpum', v => !v || v == '-' ? null : res.some(r => r.test(v))); T.push(i => { const r = on(i); return r === null ? res.some(x => x.test(desc(i))) : r }) }
  if (F.ram && F.ram.length) { const want = F.ram.map(tkGB), on = memo('ram', v => { const g = tkGB(v); return g == null ? null : want.includes(g) }); T.push(i => on(i) === true) }
  if (F.ssd && F.ssd.length) { const want = F.ssd.map(tkGB), on = memo('ssd', v => { const g = tkGB(String(v).split('+')[0]); return g == null ? null : want.some(w => Math.abs(w - g) <= Math.max(16, g * 0.03)) }); T.push(i => on(i) === true) }
  const scr = i => nz((DI.disp[C.disp[i]] || '') + ' ' + (DI.res[C.res[i]] || '') + ' ' + (DI.hz[C.hz[i]] || ''));
  if (F.disp && F.disp.length) { const want = F.disp.map(x => parseFloat(x)); T.push(i => { let v = tkNum(nz(DI.disp[C.disp[i]] || ''), /\b(1\d(?:\.\d+)?)\b/); if (v == null) v = tkNum(desc(i), /\b(1\d(?:\.\d)?)\s?(?:inch|in)\b/); if (v == null) return false; return want.some(w => Number.isInteger(w) ? Math.floor(v) === w : Math.abs(v - w) < 0.06) }) }
  if (F.hz && F.hz.length) { const want = F.hz.map(x => parseInt(x)); T.push(i => { let v = tkNum(nz(DI.hz[C.hz[i]] || ''), /\b(\d{2,3})\b/); if (v == null) v = tkNum(scr(i), /(\d{2,3})\s?hz/); if (v == null) v = tkNum(desc(i), /(\d{2,3})\s?hz/); return v != null && want.includes(v) }) }
  if (F.res && F.res.length) T.push(i => { let r = tkResOf(scr(i)); if (!r) r = tkResOf(desc(i)); return F.res.includes(r) });
  if (F.kw && F.kw.length) T.push(i => F.kw.every(k => { const re = TK_KW[k] || new RegExp('\\b' + nz(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b'); return re.test(scr(i)) || re.test(desc(i)) }));
  if (F.q && F.q.length) { const FT = tkIdx(d), ws = F.q.map(nz); T.push(i => ws.every(w => tkHit(w, FT.txt[i]))) }
  return i => T.every(f => f(i)) }
// ---- danh sách theo cấu hình ----
// cột bảng Model = đúng thứ tự / tên cột sheet Data (impDetail → d.order); dữ liệu cũ chưa có thì dùng thứ tự chuẩn của file Laptop
const LIST_ORDER0 = [['ym', 'Month'], ['segment', 'Segment'], ['brand', 'Brand'], ['sub', 'Sub Brand'], ['part', 'Part'], ['cpu', 'CPU Brand'], ['cpum', 'CPU Model'], ['ram', 'RAM'], ['ssd', 'SSD'], ['disp', 'Display'], ['res', 'Resolution'], ['gpu', 'GPU'], ['hz', 'Refresh Rate'], ['bat', 'Battery'], ['os', 'OS'], ['q', 'Qty'], ['avg', 'Unit Price'], ['u', 'Total USD'], ['importer', 'Importer']].map(([k, t]) => ({ k, t }));
const listOrder = d => (d && d.order && d.order.length ? d.order : LIST_ORDER0).filter(o => o.k == 'ym' || o.k == 'q' || o.k == 'u' || o.k == 'avg' || (d && d.dict && d.dict[o.k]));
const LIST_NUM = new Set(['ym', 'q', 'u', 'avg', 'importer']);
// v110: khoá dòng danh sách (ghép giá trị các cột của sheet Data) tính MỘT lần cho mỗi bộ số liệu, không ghép lại cho từng câu hỏi – cùng khoá, cùng kết quả
function askListKeys(d) { if (d._lkey && d._lkeyn === d.n) return d._lkey; const C = d.col, DI = d.dict;
  const O = d._lo || (d._lo = listOrder(d)), KS = d._lk || (d._lk = O.map(o => o.k).filter(k => !LIST_NUM.has(k)));
  const g = (k, c) => { const v = DI[k] ? DI[k][c] : ''; return v == null ? '' : String(v) }, memo = new Map(), key = new Array(d.n);
  for (let i = 0; i < d.n; i++) { const ck = KS.map(k => C[k] ? C[k][i] : -1).join(','); let s = memo.get(ck); if (s === undefined) { s = KS.map(k => g(k, C[k] ? C[k][i] : undefined)).join('|'); memo.set(ck, s) } key[i] = s }
  d._lkeyn = d.n; return d._lkey = key }
function askListAdd(A, d, i, b, q, u, ym) {
  const C = d.col, DI = d.dict, g = k => { const v = DI[k] ? DI[k][C[k][i]] : ''; return v == null ? '' : String(v) };
  const key = (d._lkey && d._lkeyn === d.n ? d._lkey : askListKeys(d))[i]; const L = A.list || (A.list = new Map()); let o = L.get(key);
  if (!o) { const KS = d._lk, v = {}; for (const k of KS) v[k] = g(k); if (!KS.includes('brand')) v.brand = b; let sub = g('sub'); if (!sub || /^(không rõ|—|-)$/i.test(sub)) sub = g('part') || g('desc') || '?';
   L.set(key, o = { v, b, sub, seg: g('segment'), parts: new Set([g('part')]), imp: new Map(), mq: new Map(), q: 0, u: 0, mn: null, mx: null, f: ym, l: ym }) }
  o.q += q; o.u += u; const im = g('importer'); o.imp.set(im, (o.imp.get(im) || 0) + q); if (q > 0) { const un = u / q; o.mn = Math.min(o.mn ?? un, un); o.mx = Math.max(o.mx ?? un, un) } if (ym < o.f) o.f = ym; if (ym > o.l) o.l = ym;
  // số theo từng tháng: lọc cột Month là cộng lại đúng các tháng đã chọn
  let m = o.mq.get(ym); if (!m) o.mq.set(ym, m = { q: 0, u: 0, mn: null, mx: null, imp: new Map() }); m.q += q; m.u += u; m.imp.set(im, (m.imp.get(im) || 0) + q); if (q > 0) { const un = u / q; m.mn = Math.min(m.mn ?? un, un); m.mx = Math.max(m.mx ?? un, un) } }
// dựng lại dòng theo các tháng đang chọn ở cột Month (sel = Set 'YYYY-MM')
function askListMonths(L, sel) { const out = []; for (const r of L) { const o = Object.assign({}, r, { q: 0, u: 0, mn: null, mx: null, f: null, l: null, imp: new Map() }); for (const [ym, m] of r.mq) { if (!sel.has(ym)) continue; o.q += m.q; o.u += m.u; if (m.mn != null) { o.mn = Math.min(o.mn ?? m.mn, m.mn); o.mx = Math.max(o.mx ?? m.mx, m.mx) } o.f = o.f && o.f < ym ? o.f : ym; o.l = o.l && o.l > ym ? o.l : ym; m.imp.forEach((v, k) => o.imp.set(k, (o.imp.get(k) || 0) + v)) } if (o.q || o.u) out.push(o) } const T = out.reduce((s, r) => s + r.q, 0); out.forEach(r => r.sh = T ? r.q / T : 0); return out }
async function askListXlsx() {
  const T = typeof TBLS != 'undefined' && TBLS.get('askm'), L = T && T.data ? T.data : ASK && ASK.list, Q = ASK && ASK.Q, P = ASK && ASK.P; if (!L || !L.length) { toast('Không có dòng nào để xuất', 3000); return }
  const r2 = x => Math.round(x * 100) / 100, O = (ASK.listCols || []).filter(o => o.k != '#'), h = O.map(o => o.t);
  const val = (o, r) => o.k == 'yr' ? +r.f.slice(0, 4) : o.k == 'ym' ? (r.f == r.l ? +r.f.slice(5, 7) : r.f + ' → ' + r.l) : o.k == 'q' ? r.q : o.k == 'u' ? r2(r.u) : o.k == 'avg' ? (r.q ? r2(r.u / r.q) : 0) : o.k == 'importer' ? (topMap(r.imp, 1)[0] || '') : (r.v[o.k] ?? '');
  const rows = L.map(r => O.map(o => val(o, r)));
  const cond = [['Câu tìm', Q.text], ['Nhóm hàng', catName(Q.cat)], ['Kỳ', P.lab + ' (' + P.from + ' → ' + P.to + ')'], ['Số liệu đến ngày', P.end || ''], ['Số dòng xuất', L.length + (ASK.list && L.length < ASK.list.length ? ' / ' + ASK.list.length + ' (đang lọc theo cột)' : '')]].concat(Object.entries(Q.f).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)]));
  await xlsxSave('Danh sach ' + catName(Q.cat) + ' ' + P.from + ' den ' + P.to + '.xlsx', [{ n: 'Danh sách', h, rows, w: O.map(o => o.k == 'yr' ? 8 : o.k == 'sub' ? 28 : o.k == 'part' || o.k == 'cpum' ? 22 : o.k == 'ym' ? 8 : 12) }, { n: 'Điều kiện', h: ['Mục', 'Giá trị'], rows: cond, w: [20, 60] }]) }
// ---- bộ nhớ học ----
async function tkMem() { if (!TK.mem) { const j = await appJson('tim-kiem-hoc').catch(() => null); TK.mem = j && j.syn ? j : { syn: [], ex: [], bad: [] } } return TK.mem }
const tkSave = () => appJsonSave('tim-kiem-hoc', TK.mem).catch(() => { });
// ---- v92: TÌM CHỮ TỰ DO trên mọi dòng nhập khẩu (kiểu Google): chữ nào máy chưa hiểu mà CÓ trong dữ liệu → thành điều kiện lọc ----
// chỉ mục: mỗi dòng → chuỗi bỏ dấu gồm hãng, model, part, CPU, GPU, cấu hình, đầu mối, mô tả (+ cột riêng của sheet Data). Dùng chung chuỗi cho các dòng giống nhau.
function tkIdx(d) { if (d._ft && d._ftn === d.n) return d._ft; const C = d.col, DI = d.dict;
  const keys = ['brand', 'sub', 'part', 'cpu', 'cpum', 'gpu', 'segment', 'importer', 'ram', 'ssd', 'disp', 'res', 'hz', 'os', 'bat', 'desc'].concat(Object.keys(DI).filter(k => /^x\d+$/.test(k))).filter(k => DI[k] && C[k]);
  const memo = new Map(), txt = new Array(d.n), words = new Map();
  for (let i = 0; i < d.n; i++) { const key = keys.map(k => C[k][i]).join(','); let t = memo.get(key); if (t === undefined) { t = ' ' + nz(keys.map(k => DI[k][C[k][i]] || '').join(' ')) + ' '; t = { t, s: t.replace(/ /g, '') }; memo.set(key, t); for (const w of t.t.split(' ')) if (w.length > 1) words.set(w, (words.get(w) || 0) + 1) } txt[i] = t }
  d._ftn = d.n; return d._ft = { txt, words } }
// một chữ có trong dòng: đầu một từ (gõ "zenbo" ra "zenbook"), hoặc trong chuỗi dính liền (gõ "rtx5070" ra "rtx 5070", "ux3405ca" ra part "UX3405CA-ST1531W")
const tkHit = (w, x) => x.t.includes(' ' + w) || (w.length >= 4 && x.s.includes(w));
function tkLev(a, b, mx) { if (Math.abs(a.length - b.length) > mx) return mx + 1; const m = a.length, n = b.length; let p = Array.from({ length: n + 1 }, (_, j) => j), c = new Array(n + 1), pp = null;
  for (let i = 1; i <= m; i++) { c[0] = i; let lo = c[0]; for (let j = 1; j <= n; j++) { c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1)); if (pp && i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1]) c[j] = Math.min(c[j], pp[j - 2] + 1); if (c[j] < lo) lo = c[j] } if (lo > mx) return mx + 1; pp = p.slice(); [p, c] = [c, p] } return p[n] }
// chữ gõ → chữ có thật trong dữ liệu: giữ nguyên nếu đã có (kể cả là đầu một từ / nằm trong chuỗi dính liền); không thì sửa lỗi gõ (sai 1 chữ, từ 7 ký tự: 2 chữ) – lấy từ hay gặp nhất
function tkFix(w, F) { if (F.words.has(w)) return w; for (const k of F.words.keys()) if (k.startsWith(w) && w.length >= 3) return w; if (w.length >= 4) for (const x of F.txt) if (x.s.includes(w)) return w;
  if (w.length < 4 || /^\d+$/.test(w)) return null; const mx = w.length >= 7 ? 2 : 1; let best = null, bf = 0, bd = 9; for (const [k, f] of F.words) { if (k.length < 3) continue; const dd = tkLev(w, k, mx); if (dd <= mx && (dd < bd || dd == bd && f > bf)) { best = k; bf = f; bd = dd } } return best }
// ---- bọc bộ hiểu câu sẵn có ----
/* v110: askParse = askParseBase (ask.js) + phần hiểu câu thông minh – một định nghĩa, không bọc lúc chạy */ function askParse(text, prev) { const t2 = tkPre(text), Q = askParseBase(t2, prev); Q.text = text; Q._t2 = ' ' + t2 + ' ';
    const X = tkDetect(Q._t2); for (const k of TKK) if (X[k]) Q.f[k] = X[k]; if (X.cpuf) delete Q.f.cpu;
    if (TK_LIST.test(Q._t2) && !Q.focus) Q.focus = 'list'; Q._x = X; return Q }
/* v110: askTime = askTimeBase (ask.js) + phần hiểu câu thông minh – một định nghĩa, không bọc lúc chạy */ function askTime(t, src) { t = tkPre(t || ''); if (/\bquy nay\b/.test(t)) return { rel: 'thisq' }; if (/\bquy truoc\b/.test(t)) return { rel: 'prevq' }; return askTimeBase(t, src) }
/* v110: askPeriod = askPeriodBase (ask.js) + phần hiểu câu thông minh – một định nghĩa, không bọc lúc chạy */ function askPeriod(Q) { const P0 = Q.per; if (P0 && (P0.rel == 'thisq' || P0.rel == 'prevq')) { const end = dataEnd(Q.src, Q.cat, Q); if (!end) return null; const eym = end.slice(0, 7); let y = +eym.slice(0, 4), qs = Math.floor((+eym.slice(5) - 1) / 3) * 3 + 1;
      if (P0.rel == 'prevq') { qs -= 3; if (qs < 1) { qs += 12; y-- } } const from = y + '-' + p2(qs), to = P0.rel == 'prevq' ? ymAdd(from, 2) : eym; Q.per = { from, to }; const r = askPeriodBase(Q); Q.per = P0; if (r) r.lab = L_(P0.rel == 'thisq' ? 'Quý này' : 'Quý trước', P0.rel == 'thisq' ? 'This quarter' : 'Last quarter') + ' (' + r.lab + ')'; return r }
    return askPeriodBase(Q) }
/* v110: askResolve = askResolveBase (ask.js) + phần hiểu câu thông minh – một định nghĩa, không bọc lúc chạy */ async function askResolve(Q, prev) {
    const X = Q._x || {}, t2 = Q._t2 || '', txt = nz(Q.text), focus = Q.focus; const mem = await tkMem();
    // cụm anh đã dạy → áp ngay (không cần AI)
    const learned = {}; for (const s of mem.syn) if ((' ' + t2 + ' ').includes(' ' + s.p + ' ')) for (const k in s.f) for (const v of s.f[k]) { if (k == 'focus') { Q.focus = Q.focus || v; continue } (learned[k] = learned[k] || []).includes(v) || learned[k].push(v) }
    const Q2 = await askResolveBase(Q, prev); const fol = Q2 !== Q, drop = /^ ?(bo|loai)\b/.test(txt), addw = /^ ?them\b/.test(txt);
    for (const k of TKK.concat(Object.keys(learned).filter(k => !TKK.includes(k)))) { const v = (X[k] || []).concat(learned[k] || []); if (!v.length) { if (!fol) delete Q2.f[k]; continue }
      if (fol && drop) { Q2.f[k] = (Q2.f[k] || []).filter(x => !v.includes(x)); if (!Q2.f[k].length) delete Q2.f[k] } else if (fol && addw) Q2.f[k] = [...new Set((Q2.f[k] || []).concat(v))]; else Q2.f[k] = [...new Set((fol || TKK.includes(k) ? [] : (Q2.f[k] || [])).concat(v))] }
    if ((X.cpuf || learned.cpuf)) delete Q2.f.cpu; if (Q.focus == 'list' || focus == 'list') Q2.focus = 'list';
    if (Object.keys(learned).length) Q2.learned = Object.keys(learned);
    // mặc định danh sách: 6 tháng gần nhất (khi câu không nói thời gian)
    if (fol && prev && prev.per && !askTime(tkPre(Q.text), Q2.src)) Q2.per = prev.per; // câu nối tiếp không nói thời gian → giữ kỳ của câu trước
    else if (Q2.focus == 'list' && !askTime(nz(Q2.perText || ''), Q2.src)) Q2.per = { last: 6 };
    // giá nhập khẩu tính bằng USD: không tự quy đổi triệu đồng (tránh số sai)
    if (Q2.src == 'imp') for (const k of ['pmin', 'pmax']) if (Q2.f[k] && /trieu|tr\b|dong|vnd/.test(Q2.f[k][1] || '')) { delete Q2.f[k]; Q2.guess.push(L_('Giá nhập khẩu tính bằng USD – anh gõ theo USD, vd "dưới 1200 usd"', 'Import prices are in USD – type e.g. "under 1200 usd"')) }
    Q2._left = tkLeft(t2, Q2); if (Q2.src == 'imp' && !(fol && !Q2._left.length)) tkFree(Q2, t2, fol); delete Q2._x; return Q2 }
function tkFree(Q, t2, fol) {
  const cats = Object.keys(IMPDET).filter(c => IMPDET[c] && IMPDET[c].n); if (!cats.length) return;
  // số 4–5 chữ số máy hiểu là VGA nhưng không có card đó trong dữ liệu → là số model (vd Latitude 5450)
  const toks = Q._left.slice(), gpuIn = c => g => IMPDET[c].dict.gpu.some(x => new RegExp('(^|\\D)' + g.split(' ')[0] + '(\\D|$)').test(nz(x)));
  if (Q.f.gpu && Q.cat && IMPDET[Q.cat]) { const bad = Q.f.gpu.filter(g => !gpuIn(Q.cat)(g)); if (bad.length) { Q.f.gpu = Q.f.gpu.filter(g => !bad.includes(g)); if (!Q.f.gpu.length) delete Q.f.gpu; bad.forEach(g => toks.push(g.split(' ')[0])) } }
  // số 3–5 chữ số chưa được hiểu (không phải năm, giá, tháng) → tìm như chữ
  const used = new Set(); for (const k in Q.f) for (const v of [].concat(Q.f[k])) (String(v).match(/\d+/g) || []).forEach(n => used.add(n));
  for (const m of t2.matchAll(/(?<!(?:thang|quy|nam|duoi|tren|gia|last|past) )\b(\d{3,5})\b(?! ?(?:usd|\$|do|dola|trieu|tr|k|thang|chiec|%))/g)) { const n = m[1]; if (!used.has(n) && !(+n >= 2015 && +n <= 2035) && !toks.includes(n)) toks.push(n) }
  if (!toks.length) return;
  // chưa nói nhóm hàng → chọn nhóm có nhiều chữ khớp nhất
  const catSaid = Object.values(CATW).some(ws => ws.some(w => (' ' + t2 + ' ').includes(' ' + w + ' ')));
  if (!catSaid && !fol && cats.length > 1) { let best = Q.cat, bs = -1; for (const c of cats) { const F = tkIdx(IMPDET[c]); const sc = toks.filter(w => tkFix(w, F)).length + (c == Q.cat ? 0.5 : 0); if (sc > bs) { bs = sc; best = c } } if (best != Q.cat) { Q.cat = best; Q.alt = cats.filter(c => c != best) } }
  const F = tkIdx(IMPDET[Q.cat]); const q = [], miss = []; Q.fix = Q.fix || {};
  for (const w of toks) { const f = tkFix(w, F); if (f) { if (!q.includes(f)) q.push(f); if (f != w) Q.fix[f] = w } else miss.push(w) }
  if (q.length) Q.f.q = [...new Set((fol ? Q.f.q || [] : []).concat(q))]; Q._left = miss; Q.miss = miss }
// ---- chữ máy chưa hiểu → mới gọi AI ----
const TK_STOP = new Set(('danh sach liet ke list show all tat ca cac hang cua hang hang nhung cac mot nhung cho toi minh anh em xem tim kiem loc chay dung voi co cua va hoac la thi trong o tai gan nhat gan day qua vua thang nam quy tuan ngay nay truoc ngoai kia tu den toi ' +
  'san pham may model mau dong loai nao gi bao nhieu the nao ra sao nhu the which what show me give find the a an of for in with and or by from to all brands brand models model product products running run on that have has is are ' +
  'gia nhap khau duoi tren usd do dola trieu tr k chiec cai theo nhan importer nha dau moi so luong thi phan share ban chay nhieu nhat it top cau hinh chi tiet day du ' +
  'core ultra intel amd ryzen ai ram ssd gb tb inch in hz man hinh do phan giai oled cam ung touch vga card rtx gtx rx cpu chip snapdragon ddr4 ddr5 lpddr5x nvme o cung fhd qhd uhd 2k 4k 3k laptop notebook may tinh xach tay ' +
  'giup nha nhe nhi a ah oi di hay hoi biet muon can lay hien thi bang thong ke so lieu du lieu con chiec em cai mau loai hang hien co dang duoc bi da se roi luon voi ve tai sao vi sao khong co chua please list show me want need get see check about').split(' '));
function tkLeft(t2, Q) {
  const known = new Set(TK_STOP); for (const c in CATW) CATW[c].forEach(w => w.split(' ').forEach(x => known.add(x))); for (const s in SEGW) SEGW[s].forEach(w => w.split(' ').forEach(x => known.add(x)));
  for (const k in Q.f) for (const v of [].concat(Q.f[k])) nz(String(v)).split(' ').forEach(x => known.add(x)); for (const a in BRALIAS) a.split(' ').forEach(x => known.add(x));
  try { vMatch(nz(t2), vocabImp()).hit.forEach(x => x.n.split(' ').forEach(w => known.add(w))) } catch (e) { }
  return nz(t2).split(' ').filter(w => w.length > 1 && !known.has(w) && !/^\d+(?:[.,]\d+)?$/.test(w) && !/^\d+(?:gb|tb|hz|k|usd|inch|w|g)$/.test(w)) }
// ---- AI hiểu phần còn lại: chỉ được chọn trong danh sách giá trị có thật ----
function tkVocab(cat) { const d = IMPDET[cat]; if (!d) return null; const cnt = k => { const m = new Map(); d.col[k].forEach((c, i) => m.set(c, (m.get(c) || 0) + d.qty[i])); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(e => d.dict[k][e[0]]).filter(v => v && v != '-' && !/^(không rõ|khong ro|unknown)$/i.test(v)) };
  return { brand: cnt('brand').slice(0, 40), segment: cnt('segment').slice(0, 12), sub: cnt('sub').slice(0, 150), gpu: cnt('gpu').slice(0, 40), cpu: cnt('cpum').slice(0, 60) } }
const TK_SCHEMA = { type: 'object', properties: { brand: { type: 'array', items: { type: 'string' } }, segment: { type: 'array', items: { type: 'string' } }, sub: { type: 'array', items: { type: 'string' } }, gpu: { type: 'array', items: { type: 'string' } }, cpu: { type: 'array', items: { type: 'string' } },
  ram: { type: 'array', items: { type: 'string' } }, ssd: { type: 'array', items: { type: 'string' } }, disp: { type: 'array', items: { type: 'string' } }, hz: { type: 'array', items: { type: 'string' } }, res: { type: 'array', items: { type: 'string', enum: ['FHD', 'QHD', '3K', '4K'] } },
  kw: { type: 'array', items: { type: 'string', enum: ['OLED', 'Mini LED', 'Cảm ứng', '2-in-1'] } }, list: { type: 'boolean' }, khong_hieu: { type: 'array', items: { type: 'string' } } }, required: ['brand', 'segment', 'sub', 'gpu', 'cpu', 'list', 'khong_hieu'] };
async function tkAI(Q) {
  if (!(Q._left && Q._left.length) || typeof AIX == 'undefined' || !AIX.on()) return; await AIX.status(); if (!AIX.inst()) return;
  if (Q.src != 'imp') { // số bán ra: AI viết lại thành câu chuẩn (chỉ khi còn chữ máy chưa hiểu)
    TK.busy = true; TK.msg = 'AI đang đọc câu hỏi'; render();
    try { const c = await aiCanon(Q.text); if (c && c.canon && nz(c.canon) !== nz(Q.text) && ASK && ASK.Q === Q) { await TK.run(String(c.canon), { fresh: true, noAI: true }); if (ASK && ASK.Q) { const L0 = ASK.Q.src + '|' + ASK.Q.cat; askLock(ASK.Q, Q.text); if (ASK.Q.src + '|' + ASK.Q.cat != L0) askCompute(ASK.Q); /* v113: câu AI viết lại không được đổi nguồn / nhóm anh đã gõ rõ */ ASK.Q.canon = { orig: Q.text, canon: String(c.canon), y: String(c.y || '') }; ASK.Q.text = Q.text } } }
    catch (e) { } finally { TK.busy = false; TK.msg = ''; if (PAGE == 'ask') render() } return }
  const V = tkVocab(Q.cat); if (!V) return; const mem = await tkMem(); const words = new Set(nz(Q.text).split(' '));
  const ex = mem.ex.map(e => ({ e, s: e.q.split(' ').filter(w => words.has(w)).length })).filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 5).map(x => `Câu: "${x.e.q}" → ${JSON.stringify(x.e.f)}`).join('\n');
  const sys = `Bạn chuyển câu tìm kiếm (tiếng Việt hoặc tiếng Anh) về bộ lọc dữ liệu nhập khẩu ${catName(Q.cat)}. CHỈ chọn giá trị có trong danh sách cho sẵn, viết đúng như danh sách. Không đoán số, không tự thêm điều kiện câu không nói. Từ nào không ứng được với giá trị nào thì đưa vào "khong_hieu". "list" = true nếu người dùng muốn xem danh sách sản phẩm.`;
  const usr = `Câu: "${Q.text}"\nMáy đã hiểu: ${JSON.stringify(Q.f)}\nCác chữ máy CHƯA hiểu: ${Q._left.join(', ')}\n\nHãng: ${V.brand.join(' | ')}\nSegment: ${V.segment.join(' | ')}\nDòng máy: ${V.sub.join(' | ')}\nVGA: ${V.gpu.join(' | ')}\nCPU: ${V.cpu.join(' | ')}\nRAM/SSD/màn hình/Hz: ghi dạng 32GB, 1TB, 16", 240Hz.\n${ex ? '\nVí dụ anh đã duyệt:\n' + ex : ''}`;
  TK.busy = true; TK.msg = 'AI đang hiểu thêm: ' + Q._left.join(', '); render();
  try { const j = await AIX.chat([{ role: 'system', content: sys }, { role: 'user', content: usr }], { schema: TK_SCHEMA, max: 300, temp: 0.1, timeout: 60 });
    if (!ASK || ASK.Q !== Q) return; const has = (arr, v) => arr.find(x => nz(x) == nz(v)); const add = {}, put = (k, v) => { if (v && !(Q.f[k] || []).some(x => nz(x) == nz(v))) (add[k] = add[k] || []).push(v) };
    (j.brand || []).forEach(v => put('brand', has(V.brand, v))); (j.segment || []).forEach(v => put('segment', has(V.segment, v))); (j.sub || []).forEach(v => put('sub', has(V.sub, v)));
    (j.gpu || []).forEach(v => { const m = String(v).match(/\b(\d{3,4})\b/); if (m && V.gpu.some(g => g.includes(m[1]))) put('gpu', m[1]) });
    (j.cpu || []).forEach(v => { const x = tkDetect(' ' + nz(v) + ' ').cpuf; if (x) x.forEach(c => put('cpuf', c)) });
    for (const k of ['ram', 'ssd', 'disp', 'hz']) (j[k] || []).forEach(v => { const x = tkDetect(' ' + nz(v) + (k == 'ram' ? ' ram' : k == 'ssd' ? ' ssd' : k == 'disp' ? ' inch' : '') + ' ')[k]; if (x) x.forEach(c => { const num = (c.match(/\d+/) || [''])[0]; if (nz(Q.text).includes(num)) put(k, c) }) }); // số phải có trong câu
    (j.res || []).forEach(v => put('res', v)); (j.kw || []).forEach(v => put('kw', v));
    if (j.list && !Q.focus) { Q.focus = 'list'; Q.aiList = true; if (!askTime(nz(Q.perText || ''), Q.src)) Q.per = { last: 6 } }
    Q.ai = add; for (const k in add) { Q.f[k] = (Q.f[k] || []).concat(add[k]); if (k == 'cpuf') delete Q.f.cpu; if (k == 'segment') delete Q.f.seg } Q.aiNo = (j.khong_hieu || []).filter(w => nz(Q.text).includes(nz(w))).slice(0, 6);
    askCompute(Q) } catch (e) { TK.msg = 'AI chưa hiểu thêm được: ' + esc(e.message || e) } finally { TK.busy = false; if (TK.msg.startsWith('AI đang')) TK.msg = ''; if (PAGE == 'ask') render() } }
/* v110: askRun = askRunKho (trolyai.js: câu về kho → đúng trang) + AI trên máy hiểu thêm phần chữ còn lại. Một định nghĩa */
async function askRun(text, opt) { opt = opt || {}; TK.msg = ''; await askRunKho(text, opt); const Q = ASK && ASK.Q; if (Q && !opt.noAI) { tkAI(Q); tkIntentAI(Q) } }
// v113: AI trên máy làm "ý kiến thứ hai" CHỈ cho câu KHÔNG nói rõ nguồn (nhập khẩu / bán ra) hoặc nhóm hàng. Không bao giờ tự đổi câu trả lời:
// AI hiểu khác máy → hiện một nút "✦ AI hiểu là … – xem" để anh bấm. Câu có chữ rõ ràng thì máy đã chắc (luật askLock) – không hỏi AI.
const TK_INTENT_SCHEMA = { type: 'object', properties: { src: { type: 'string', enum: ['imp', 'sales', '?'] }, cat: { type: 'string' } }, required: ['src', 'cat'] };
async function tkIntentAI(Q) { try {
  const I = askIntent(Q.text); if (I.src) return; /* nguồn đã nói rõ → máy chắc, không hỏi AI */ if (nz(Q.text).split(' ').length < 3) return; if (typeof AIX == 'undefined' || !AIX.on()) return; await AIX.status(); if (!AIX.inst()) return;
  const ck = nz(Q.text); if (tkIntentAI.c.has(ck)) { const v = tkIntentAI.c.get(ck); if (v && ASK && ASK.Q === Q && (v.src != Q.src || v.cat != Q.cat)) { Q.aiAlt = v; if (PAGE == 'ask') render() } return }
  const cats = Object.keys(CATW).concat(Object.keys(CATW_S)), lab = c => c + ' = ' + (CATN[c] || [c])[0];
  const sys = 'Bạn phân loại câu hỏi của quản lý nhãn hàng máy tính tại Việt Nam. src: "imp" = số liệu NHẬP KHẨU / thị trường / thị phần các hãng; "sales" = số BÁN RA của công ty (doanh số, doanh thu, đại lý, sale); "?" nếu câu không đủ để biết. cat: một mã nhóm hàng trong danh sách, hoặc "?" nếu câu không nói nhóm hàng. Không đoán khi câu không có dấu hiệu.';
  const j = await AIX.chat([{ role: 'system', content: sys }, { role: 'user', content: 'Nhóm hàng: ' + cats.map(lab).join('; ') + '\nCâu: "' + Q.text + '"' }], { schema: TK_INTENT_SCHEMA, max: 80, temp: 0, timeout: 40 });
  if (!j || !ASK || ASK.Q !== Q) return; const src = I.src || (j.src == 'imp' || j.src == 'sales' ? j.src : Q.src), cat = I.cat || (cats.includes(j.cat) ? j.cat : Q.cat);
  if (src == 'imp' && cat && !IMPDET[cat]) { tkIntentAI.c.set(ck, null); return } if (src == Q.src && cat == Q.cat) { tkIntentAI.c.set(ck, null); return }
  tkIntentAI.c.set(ck, { src, cat }); Q.aiAlt = { src, cat }; if (PAGE == 'ask') render() } catch (e) { } }
tkIntentAI.c = new Map();
TK.run = askRunKho;
// anh bỏ chip ✦ (AI thêm) → ghi nhận AI hiểu sai cụm này
/* v110: askDrop = askDropBase (ask.js) + phần hiểu câu thông minh – một định nghĩa, không bọc lúc chạy */ function askDrop(k, v) { const Q = ASK && ASK.Q; if (Q && Q.ai && Q.ai[k] && Q.ai[k].includes(v) && TK.mem) { TK.mem.bad = [{ q: nz(Q.text), k, v, at: Date.now() }].concat(TK.mem.bad || []).slice(0, 300); Q.ai[k] = Q.ai[k].filter(x => x != v); tkSave() } return askDropBase(k, v) }
// "Ghi nhớ cách hiểu này": cụm chữ trước đây máy chưa hiểu → bộ lọc đang có (anh đã duyệt) ; cả câu thành ví dụ cho AI / dữ liệu đào tạo
async function tkLearn() {
  const Q = ASK && ASK.Q; if (!Q) return; const mem = await tkMem(); const f = {}; for (const k in Q.f) if (Array.isArray(Q.f[k]) && typeof Q.f[k][0] != 'number') f[k] = Q.f[k].slice(); if (Q.focus == 'list') f.focus = ['list'];
  mem.ex = [{ q: nz(Q.text), f, cat: Q.cat, at: Date.now() }].concat(mem.ex.filter(e => e.q != nz(Q.text))).slice(0, 500);
  const left = (Q._left || []).filter(w => !(Q.aiNo || []).some(x => nz(x).split(' ').includes(w))); let n = 0;
  if (left.length && Q.ai && Object.keys(Q.ai).length) { const tw = tkPre(Q.text).split(' '), ix = tw.map((w, i) => left.includes(w) ? i : -1).filter(i => i >= 0), p = ix.length ? tw.slice(ix[0], ix[ix.length - 1] + 1).join(' ') : ''; if (p) { mem.syn = [{ p, f: Object.assign(Object.fromEntries(Object.entries(Q.ai).filter(([, v]) => v.length)), Q.aiList ? { focus: ['list'] } : {}), at: Date.now() }].concat(mem.syn.filter(s => s.p != p)).slice(0, 300); n = 1 } }
  await tkSave(); toast(n ? '✓ Đã học: lần sau gõ "<b>' + esc(mem.syn[0].p) + '</b>" app hiểu ngay, không cần AI' : '✓ Đã lưu câu này làm ví dụ cho AI', 5000); render() }
// ---- giao diện: dòng trạng thái AI + nút học dưới phần "Đang hiểu" ----
/* v110: askHead = askHeadBase (ask.js) + phần hiểu câu thông minh – một định nghĩa, không bọc lúc chạy */ function askHead() { let h = askHeadBase(); const Q = ASK && ASK.Q; if (!Q) return h.replace('Gõ câu hỏi vào ô tìm kiếm phía trên (Ctrl K) – app tự hiểu và phân tích.', 'Gõ câu hỏi tiếng Việt hoặc tiếng Anh vào ô tìm kiếm (Ctrl K), vd "danh sách laptop gaming core ultra 9", "list gaming laptops with rtx 5070 last 3 months".');
    const ai = Q.ai && Object.values(Q.ai).some(v => v.length), lt = Q.learned && Q.learned.length, cn = Q.canon;
    const line = [TK.busy ? `<span class="note">✦ ${esc(TK.msg)}…</span>` : TK.msg ? `<span class="note">${TK.msg}</span>` : '',
      ai ? `<span class="note">✦ = AI trên máy hiểu thêm từ "${esc((Q._left || []).join(' '))}" – sai thì bấm ✕ ở chip đó.</span>` : '',
      lt ? `<span class="note">✓ Hiểu theo cách anh đã dạy.</span>` : '', Q.aiAlt ? `<button class="btn sm" onclick="askSet(ASK.Q.aiAlt);delete ASK.Q.aiAlt" title="${L_('AI trên máy hiểu câu này khác – bấm để xem theo cách AI hiểu', 'The on-device AI reads this differently – click to view')}">✦ ${L_('AI hiểu là', 'AI reads it as')}: ${Q.aiAlt.src == 'imp' ? L_('Số nhập khẩu', 'Import data') : L_('Số bán DGW', 'DGW sales')} · ${esc(catName(Q.aiAlt.cat))} ›</button>` : '', Q.locked ? `<span class="note">✓ ${L_('Theo đúng chữ trong câu', 'As written in the question')}: ${Q.locked.src ? (Q.src == 'imp' ? L_('nhập khẩu', 'imports') : L_('số bán', 'sales')) : ''}${Q.locked.src && Q.locked.cat ? ' · ' : ''}${Q.locked.cat ? esc(catName(Q.cat)) : ''}</span>` : '', cn ? `<span class="note">✦ AI viết lại thành: <b>${esc(cn.canon)}</b> ${esc(cn.y || '')}</span> <button class="btn sm" onclick="askRun(${esc(JSON.stringify(cn.orig))},{noAI:true,fresh:true})">Hiểu theo cách thường</button>` : '', Q.aiNo && Q.aiNo.length ? `<span class="note">Chưa hiểu: ${esc(Q.aiNo.join(', '))}</span>` : (Q.miss && Q.miss.length && !TK.busy ? `<span class="note">${L_('Không thấy trong số nhập khẩu','Not found in import data')}: ${esc(Q.miss.join(', '))}</span>` : ''),
      !TK.busy && (ai || (Q._left || []).length) ? `<button class="btn sm" onclick="tkLearn()" title="Lưu cách hiểu hiện tại (sau khi anh đã bỏ chip sai) – lần sau app hiểu ngay">✓ Ghi nhớ cách hiểu này</button>` : ''].filter(Boolean).join(' ');
    return line && h.endsWith('</div>') ? h.slice(0, -6) + `<div class="askalt" style="margin-top:6px">${line}</div></div>` : h }

/* ===== nạp gói vào bộ hiểu câu: dựng lại IMPDET / R / D đúng khuôn của máy tính ===== */
function engLoad(pkg) {
  for (const k in IMPDET) delete IMPDET[k];
  for (const c of pkg.imp || []) { if (c.reg) { try { IMPREG.add(c.reg) } catch (e) { } }
    const d = c; d.cat = c.k; d.nz = {}; for (const k in d.dict) d.nz[k] = d.dict[k].map(nz);
    if (!d.tier || d.tier.length != d.dict.cpum.length) d.tier = d.dict.cpum.map(() => ''); d.tierH = ASKTH; IMPDET[c.k] = d }
  const S = pkg.sales; R = [];
  if (S) { const T = S.dict, C = S.col; for (const m of S.met || []) MKSE[m.id] = new Set(String(m.ks || '').split(''));
    for (let i = 0; i < S.n; i++) { const x = { y: T.y[C.y[i]], m: T.m[C.m[i]], br: T.br[C.br[i]], grp: T.grp[C.grp[i]], p: T.p[C.p[i]], d: T.d[C.d[i]], s: T.s[C.s[i]], se: T.se[C.se[i]], ch: T.ch[C.ch[i]], ar: T.ar[C.ar[i]], prov: T.prov[C.prov[i]], k: T.k[C.k[i]], int: !!T.int[C.int[i]],
      q: S.q[i], r: S.r[i], g: S.g ? S.g[i] : 0, n: S.n_[i], day: S.day ? S.day[i] : 0 }; R.push(x) }
    const dl = {}; for (const k in S.dl) { const e = S.dl[k]; dl[k] = { name: e[0], parent: e[1], prov: e[2], ch: e[3] } }
    const sku = {}; for (const k in S.sku) { const e = S.sku[k]; sku[k] = { d: e[0], grp: e[1], sg: e[2], br: e[3], sb: e[4] || '', gpu: e[5] || '', cpu: e[6] || '' } }
    D = { R, sku, dl, stores: {}, asof: S.asof || '', asofDay: S.asofDay || 0, asofAll: S.asof || '', asofDayAll: S.asofDay || 0 } }
  YEARS = [...new Set(R.map(x => x.y))].sort(); BRANDS = [...new Set(R.map(x => x.br))].sort();
  const e = pkg.eng || {}; if (e.fdef) Object.assign(F, e.fdef); else if (YEARS.length) { F.y = YEARS[YEARS.length - 1]; F.m0 = 1; let mx = 1; for (const x of R) if (x.y == F.y) mx = Math.max(mx, x.m); F.m1 = mx }
  TK.mem = e.tkl && e.tkl.syn ? e.tkl : { syn: [], ex: [], bad: [] };
  ASK = null; ASKCTX = null }
/* chạy một câu đúng như ô Hỏi đáp của máy tính: askParse → askResolve → askLock → askCompute */
async function engRun(text, fresh) { text = String(text || '').trim(); if (!text) return null; const prev = fresh ? null : (ASKCTX && ASKCTX.Q);
  let Q = askParse(text, prev); Q = await askResolve(Q, prev); askLock(Q, text); askCompute(Q); return ASK }
function engCompute(Q) { askCompute(Q); return ASK }
return { engLoad, engRun, engCompute, askInsImp, listOrder, LIST_NUM, askListMonths, topMap, ymLbl, ymAdd, catName, isG, fpc, fusd, fgrow, fpts, p2, nz, IMPDET,
  get ASK() { return ASK }, get R() { return R }, get D() { return D }, get F() { return F } };

})();
