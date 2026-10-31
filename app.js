/* DGV-GBT Mobile – app xem số liệu trên iPhone, chạy offline hoàn toàn.
   Số liệu chỉ đến từ gói .dgvp do nút "Phone Data" trên máy tính tạo (gửi qua Phone Link), mã hoá AES-256-GCM.
   App KHÔNG có kết nối mạng nào (CSP connect-src 'none'); gói lưu trên iPhone ở dạng còn mã hoá. */
'use strict';
const APPV = '116.1';
const PHFMT = 1, PHITER = 600000;
function phUnpack(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), ml = dv.getUint32(0, true);
  const meta = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + ml))), head = 8 + ml, base = head + (8 - head % 8) % 8;
  const buf = u8.buffer.slice(u8.byteOffset + base, u8.byteOffset + u8.byteLength);
  const T = { u8: Uint8Array, u16: Uint16Array, u32: Uint32Array, f64: Float64Array };
  const walk = v => { if (Array.isArray(v)) return v.map(walk); if (v && typeof v == 'object') { if (v.$b !== undefined && T[v.t]) return new T[v.t](buf, v.$b, v.n); const o = {}; for (const k in v) o[k] = walk(v[k]); return o } return v };
  return walk(meta) }

/* ---------- nén / mã hoá (Web Crypto + CompressionStream có sẵn trong trình duyệt, Safari iOS 16.4+ cũng có) ---------- */
async function phZip(u8, de) { const s = new Blob([u8]).stream().pipeThrough(de ? new DecompressionStream('gzip') : new CompressionStream('gzip')); return new Uint8Array(await new Response(s).arrayBuffer()) }
const phB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s) };
const phUnB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function phKey(pw, salt, it) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: it }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) }
async function phSeal(plain, pw, info) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const hdr = new TextEncoder().encode(JSON.stringify(Object.assign({ f: PHFMT, kdf: 'pbkdf2-sha256', it: PHITER, enc: 'aes-256-gcm', zip: 'gzip', salt: phB64(salt), iv: phB64(iv) }, info)));
  const key = await phKey(pw, salt, PHITER);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: hdr }, key, await phZip(plain)));
  const out = new Uint8Array(7 + hdr.length + ct.length); out.set([68, 71, 86, 80, 1], 0); new DataView(out.buffer).setUint16(5, hdr.length, true); out.set(hdr, 7); out.set(ct, 7 + hdr.length);
  return out }
/* đọc đầu gói (không cần mật khẩu) */
function phHead(u8) { if (u8.length < 8 || String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) != 'DGVP' || u8[4] != 1) throw new Error('not-dgvp');
  const hl = new DataView(u8.buffer, u8.byteOffset).getUint16(5, true); return { hb: u8.subarray(7, 7 + hl), h: JSON.parse(new TextDecoder().decode(u8.subarray(7, 7 + hl))), body: u8.subarray(7 + hl) } }
/* mở gói bằng mật khẩu → dữ liệu (dùng chung cho app iPhone ở v115) */
async function phOpen(u8, pw) { const { hb, h, body } = phHead(u8);
  const key = await phKey(pw, phUnB64(h.salt), h.it); let plain;
  try { plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: phUnB64(h.iv), additionalData: hb }, key, body)) } catch (e) { throw new Error('bad-password') }
  const d = phUnpack(await phZip(plain, 1)); d.head = h; return d }



/* ---------- tiện ích ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vnN = (v, d) => Number(v).toLocaleString('vi-VN', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
const fQ = v => vnN(Math.round(v));
const fU = v => { const a = Math.abs(v); return a >= 1e9 ? '$' + vnN(v / 1e9, 2) + ' tỷ' : a >= 1e6 ? '$' + vnN(v / 1e6, 1) + ' tr' : '$' + vnN(Math.round(v)) };
const fV = (v, m) => m == 'u' ? fU(v) : fQ(v);
const fP = (x, d) => isFinite(x) ? vnN(x * 100, d == null ? (Math.abs(x) < .1 ? 2 : 1) : d) + '%' : '—';
const fVnd = v => { const a = Math.abs(v); return a >= 1000 ? vnN(v / 1000, 2) + ' tỷ' : vnN(v, 1) + ' tr' };
function fG(cur, prev) { if (!(prev > 0)) return cur > 0 ? '<span class="up">Mới</span>' : '—'; const g = cur / prev - 1; if (Math.abs(g) < .0005) return '<span style="color:var(--mute)">=</span>'; return `<span class="${g >= 0 ? 'up' : 'dn'}">${g >= 0 ? '▲' : '▼'}${vnN(Math.abs(g) * 100, Math.abs(g) < .1 ? 1 : 0)}%</span>` }
function fPts(d) { if (!isFinite(d)) return ''; if (Math.abs(d) < .00005) return '<span style="color:var(--mute)">= cùng kỳ</span>'; return `<span class="${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'}${vnN(Math.abs(d) * 100, Math.abs(d) < .01 ? 2 : 1)} điểm</span>` }
const fDate = s => { if (!s) return ''; const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : s };
const fMade = s => { const t = new Date(s); if (isNaN(t)) return ''; const p = n => String(n).padStart(2, '0'); return p(t.getDate()) + '/' + p(t.getMonth() + 1) + ' ' + p(t.getHours()) + ':' + p(t.getMinutes()) };
function toast(t, ms) { const e = $('#toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => e.style.display = 'none', ms || 2600) }
const isGB = b => /gigabyte/i.test(b);
const BRC = { gigabyte: '#fbbf24', aorus: '#fbbf24', apc: '#34d399', asus: '#22d3ee', rog: '#22d3ee', lenovo: '#f87171', dell: '#a78bfa', alienware: '#a78bfa', hp: '#fb923c', acer: '#4ade80', msi: '#f472b6',
  apple: '#94a3b8', samsung: '#60a5fa', lg: '#c084fc', viewsonic: '#2dd4bf', huawei: '#f43f5e', microsoft: '#38bdf8', supermicro: '#a3e635', kingston: '#fb7185', 'western digital': '#818cf8', wd: '#818cf8', seagate: '#facc15' };
const BRP = ['#22d3ee', '#fb923c', '#34d399', '#f472b6', '#4ade80', '#a78bfa', '#f87171', '#60a5fa', '#c084fc', '#2dd4bf', '#f43f5e', '#a3e635'];
const noMark = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
function bCol(n) { const k = noMark(n); if (/^(khac|other|others|khong ro|unknown|)$/.test(k)) return '#475569'; let v = BRC[k] || BRC[k.split(' ')[0]]; if (v) return v; let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0; return BRP[h % BRP.length] }
const blank = v => /^(|-|khong ro|unknown|n\/a|na|khac)$/i.test(noMark(v));

/* ---------- lưu trên iPhone (IndexedDB): gói còn mã hoá + (tuỳ chọn) khoá không xuất ra được ---------- */
const IDB = { db: null,
  open() { return this.db ? Promise.resolve(this.db) : new Promise((ok, no) => { const r = indexedDB.open('dgvm', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(this.db = r.result); r.onerror = () => no(r.error) }) },
  async get(k) { const db = await this.open(); return new Promise((ok, no) => { const r = db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error) }) },
  async set(k, v) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => ok(); t.onerror = () => no(t.error) }) },
  async del(k) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = () => ok(); t.onerror = () => no(t.error) }) } };

async function openWithKey(u8, key) { const { hb, h, body } = phHead(u8); let plain;
  try { plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: phUnB64(h.iv), additionalData: hb }, key, body)) } catch (e) { throw new Error('bad-password') }
  const d = phUnpack(await phZip(plain, 1)); d.head = h; return d }

/* ---------- trạng thái ---------- */
const S = { d: null, pkg: null, name: '', pend: null, tab: 'home', imp: null, det: null };

/* ---------- chuẩn bị số nhập khẩu (một lần sau khi mở gói) ---------- */
function prepImp(C) {
  const Y = C.dict.ym; C.ymY = new Int16Array(Y.length); C.ymM = new Int8Array(Y.length); C.has = {};
  Y.forEach((v, i) => { const m = String(v).match(/(\d{4})\D?(\d{1,2})/); C.ymY[i] = m ? +m[1] : 0; C.ymM[i] = m ? +m[2] : 0 });
  for (let i = 0; i < C.n; i++) { const j = C.col.ym[i], y = C.ymY[j], m = C.ymM[j]; if (!y) continue; const a = C.has[y] = C.has[y] || new Uint8Array(13); a[m] = 1 }
  C.years = Object.keys(C.has).map(Number).sort((a, b) => b - a);
  C.maxM = {}; for (const y of C.years) { let mx = 0; for (let m = 1; m <= 12; m++) if (C.has[y][m]) mx = m; C.maxM[y] = mx }
  C.dims = ['brand', 'importer', 'segment', 'band', 'sub', 'gpu', 'cpum'].filter(k => C.col[k] && C.dict[k] && C.dict[k].some(v => !blank(v)));
  C.gb = new Uint8Array(C.dict.brand.length); C.dict.brand.forEach((b, i) => C.gb[i] = isGB(b) ? 1 : 0) }
/* một lượt quét: tổng kỳ + theo từng chiều + theo tháng của cả năm (f.br = chỉ số hãng, -1 = mọi hãng) */
function agg(C, f) { const met = f.met == 'u' ? C.usd : C.qty, o = { v: 0, q: 0, u: 0, g: 0, mv: new Float64Array(13), mg: new Float64Array(13), by: {} };
  for (const k of C.dims) o.by[k] = new Float64Array(C.dict[k].length);
  const byQ = new Float64Array(C.dict.brand.length), byU = new Float64Array(C.dict.brand.length);
  const cy = C.col.ym, cs = C.col.segment, cb = C.col.brand, seg = f.seg == null ? -1 : f.seg, brs = f.br == null ? -1 : f.br;
  for (let i = 0; i < C.n; i++) { const j = cy[i]; if (C.ymY[j] !== f.y) continue; if (seg >= 0 && cs[i] !== seg) continue; const b = cb[i]; if (brs >= 0 && b !== brs) continue;
    const v = met[i], m = C.ymM[j]; o.mv[m] += v; if (C.gb[b]) o.mg[m] += v;
    if (m < f.m0 || m > f.m1) continue; o.v += v; o.q += C.qty[i]; o.u += C.usd[i]; if (C.gb[b]) o.g += v; byQ[b] += C.qty[i]; byU[b] += C.usd[i];
    for (const k of C.dims) o.by[k][C.col[k][i]] += v }
  o.byQ = byQ; o.byU = byU; return o }
const topL = (C, arr, k, n) => { const L = []; for (let i = 0; i < arr.length; i++) if (arr[i] > 0 && !(k != 'brand' && blank(C.dict[k][i]))) L.push([i, arr[i]]); L.sort((a, b) => b[1] - a[1]); return n ? L.slice(0, n) : L };
function perLabel(p) { if (p.m0 == 1 && p.m1 == 12) return 'Cả năm ' + p.y; if (p.m0 == p.m1) return 'Tháng ' + p.m0 + '/' + p.y; if (p.m0 == 1) return 'T1–T' + p.m1 + '/' + p.y;
  if ((p.m0 - 1) % 3 == 0 && p.m1 == p.m0 + 2) return 'Quý ' + ((p.m0 - 1) / 3 + 1) + '/' + p.y; return 'T' + p.m0 + '–T' + p.m1 + '/' + p.y }
function impDefault(k) { const C = S.d.imp.find(c => c.k == k) || S.d.imp[0]; const y = C.years[0]; return { cat: C.k, y, m0: 1, m1: C.maxM[y] || 12, met: 'q', seg: -1 } }
const curC = () => S.d.imp.find(c => c.k == S.imp.cat);
/* kỳ so sánh: cùng tháng năm trước – chỉ khi năm trước có số trong đúng các tháng đó */
function prevOk(C, p) { const a = C.has[p.y - 1]; if (!a) return false; for (let m = p.m0; m <= p.m1; m++) if (a[m]) return true; return false }

/* ---------- vẽ ---------- */
const ICON = { home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', imp: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>', set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>' };
ICON.cmp = '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'; ICON.sales = '<path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6"/><circle cx="9" cy="20.5" r="1.3"/><circle cx="18" cy="20.5" r="1.3"/>'; ICON.find = '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>';
const TABS = [['home', 'Tổng quan'], ['imp', 'Nhập khẩu'], ['cmp', 'So sánh'], ['sales', 'Bán hàng'], ['find', 'Tìm']];
function shell(title, sub, body) { return `<header class="hdr"><div class="hrow"><div class="ttl">${title}</div><button class="hbtn ${S.tab == 'set' ? 'on' : ''}" data-a="tab" data-v="set" aria-label="Cài đặt"><svg viewBox="0 0 24 24">${ICON.set}</svg></button></div>${sub ? `<div class="asof">${sub}</div>` : ''}</header><main class="main">${body}</main>
 <nav class="nav">${TABS.map(([k, l]) => `<button data-a="tab" data-v="${k}" class="${S.tab == k ? 'on' : ''}"><svg viewBox="0 0 24 24">${ICON[k]}</svg>${l}</button>`).join('')}</nav>` }
function render(keep) { const y = keep ? window.scrollY : 0; const a = $('#app');
  if (!S.d) { a.innerHTML = S.pkg || S.pend ? gateLock() : gateWelcome(); return }
  a.innerHTML = S.tab == 'imp' ? pageImp() : S.tab == 'set' ? pageSet() : S.tab == 'sales' ? pageSales() : S.tab == 'cmp' ? pageCmp() : S.tab == 'find' ? pageFind() : pageHome(); window.scrollTo(0, y); onScroll() }
function onScroll() { const h = $('.hdr'); if (h) h.classList.toggle('sh', window.scrollY > 4) }
window.addEventListener('scroll', onScroll, { passive: true });
const subLine = () => { const h = S.d.head || {}; return 'Dữ liệu đến ' + fDate(S.d.asof || h.asof || '') + ' · gói ' + fMade(h.made || S.d.made) };

/* màn chào: chưa có gói */
function gateWelcome() { return `<div class="gate"><div class="logo">DGV<span style="color:var(--acc)">-GBT</span></div>
 <p>Xem số liệu nhập khẩu và bán hàng trên iPhone, chạy hoàn toàn offline.</p>
 <div class="steps"><div><b>1</b><span>Trên máy tính: bấm <strong>📱 Phone Data</strong> → đặt mật khẩu → Tạo gói</span></div><div><b>2</b><span>Chuột phải file .dgvp → Chia sẻ → iPhone (Phone Link)</span></div><div><b>3</b><span>Trên iPhone: lưu file vào app Tệp</span></div><div><b>4</b><span>Bấm <strong>Nạp dữ liệu</strong> bên dưới, chọn file</span></div></div>
 <button class="btn b1" data-a="pick">Nạp dữ liệu</button><div class="err" id="err"></div>
 <p style="font-size:12px;color:var(--mute)">Bản ${APPV} · không kết nối Internet</p></div>` }
/* màn mở khoá */
function gateLock() { const u8 = S.pend || S.pkg; let h = {}; try { h = phHead(u8).h } catch (e) { }
  return `<div class="gate"><div class="logo">DGV<span style="color:var(--acc)">-GBT</span></div>
 <p>${S.pend ? 'Gói mới' : 'Gói đã lưu'}: ${esc(S.pend ? S.pendName : S.name)}<br>tạo lúc ${fMade(h.made)}${h.asof ? ' · dữ liệu đến ' + fDate(h.asof) : ''}</p>
 <input class="inp" id="pw" type="password" autocomplete="current-password" placeholder="Mật khẩu gói" enterkeyhint="go">
 <label class="ck"><input type="checkbox" id="rem" checked> Ghi nhớ trên iPhone này (không hỏi lại mật khẩu)</label>
 <button class="btn b1" data-a="unlock">Mở</button><div class="err" id="err"></div>
 <button class="btn b2" data-a="pick">Nạp gói khác</button></div>` }

/* Tổng quan */
function pageHome() { const d = S.d; let h = '';
  if (d.imp && d.imp.length) { h += `<div class="cd"><h3>Thị trường nhập khẩu<span class="sp"></span><small>từ đầu năm</small></h3>`;
    for (const C of d.imp) { const y = C.years[0], p = { y, m0: 1, m1: C.maxM[y] || 12, met: 'q' }; const a = agg(C, p), ok = prevOk(C, p), b = ok ? agg(C, Object.assign({}, p, { y: y - 1 })) : null;
      const sh = a.v ? a.g / a.v : NaN, rk = gbRank(C, a.by.brand);
      h += `<button class="br" data-a="cat" data-v="${esc(C.k)}"><span class="rk">›</span><span class="nm"><b>${esc(C.label)}</b><small style="color:var(--mute);font-size:11.5px">${perLabel(p)} · ${fQ(a.v)} chiếc ${b ? fG(a.v, b.v) : ''}</small></span><span class="rv" style="color:var(--gb)">${fP(sh)}<small>GIGABYTE${rk ? ' · hạng ' + rk : ''}</small></span></button>` }
    h += `</div>` }
  if (d.sales) h += homeSales(d.sales);
  return shell('Tổng quan', subLine(), h || '<div class="empty">Gói không có số liệu</div>') }
function gbRank(C, by) { const L = topL(C, by, 'brand'); const i = L.findIndex(([j]) => C.gb[j]); return i >= 0 ? i + 1 : 0 }
/* bán ra: Doanh thu ròng / Số lượng ròng theo đúng định nghĩa sheet Chỉ số (không tính dòng nội bộ) */
function salesMet(Sl, id) { const m = (Sl.met || []).find(x => x.id == id); if (!m) return null; const ks = new Set(m.ks.split('')); const kOk = Sl.dict.k.map(k => ks.has(k)); const arr = m.col == 'r' ? Sl.r : m.col == 'q' ? Sl.q : m.col == 'g' ? Sl.g : null; return arr ? { kOk, arr, m } : null }
function salesSum(Sl, id, y, m0, m1) { const M = salesMet(Sl, id); if (!M) return NaN; const C = Sl.col, T = Sl.dict; let s = 0;
  for (let i = 0; i < Sl.n; i++) { if (T.y[C.y[i]] !== y) continue; const m = T.m[C.m[i]]; if (m < m0 || m > m1) continue; if (!M.kOk[C.k[i]] || T.int[C.int[i]]) continue; s += M.arr[i] } return s }
function homeSales(Sl) { const T = Sl.dict, ys = [...new Set(T.y)].sort((a, b) => b - a), y = ys[0]; let mx = 0; for (let i = 0; i < Sl.n; i++) if (T.y[Sl.col.y[i]] === y) mx = Math.max(mx, T.m[Sl.col.m[i]]);
  const r = salesSum(Sl, 'rev', y, 1, mx), q = salesSum(Sl, 'qty', y, 1, mx), r0 = salesSum(Sl, 'rev', y - 1, 1, mx), q0 = salesSum(Sl, 'qty', y - 1, 1, mx);
  return `<div class="cd" data-a="tab" data-v="sales"><h3>Bán ra DGW<span class="sp"></span><small>T1–T${mx}/${y} ›</small></h3><div class="kp" style="margin:0">
  <div class="k"><div class="l">Doanh thu ròng</div><div class="v num">${fVnd(r)}</div><div class="d">${ys.includes(y - 1) ? fG(r, r0) + ' cùng kỳ' : ''}</div></div>
  <div class="k"><div class="l">Số lượng bán ròng</div><div class="v num">${fQ(q)}</div><div class="d">${ys.includes(y - 1) ? fG(q, q0) + ' cùng kỳ' : ''}</div></div></div>
</div>` }

/* Nhập khẩu */
function pageImp() { const d = S.d; if (!d.imp || !d.imp.length) return shell('Nhập khẩu', subLine(), '<div class="empty">Gói này không có số nhập khẩu</div>');
  const P = S.imp, C = curC(), segName = P.seg >= 0 ? C.dict.segment[P.seg] : 'Mọi phân khúc';
  const a = agg(C, P), ok = prevOk(C, P), b = ok ? agg(C, Object.assign({}, P, { y: P.y - 1 })) : null;
  const sh = a.v ? a.g / a.v : NaN, sh0 = b && b.v ? b.g / b.v : NaN, rk = gbRank(C, a.by.brand), asp = a.q ? a.u / a.q : NaN, asp0 = b && b.q ? b.u / b.q : NaN, gq = gbSum(C, a.byQ), gu = gbSum(C, a.byU);
  let h = `<div class="chips">${d.imp.map(c => `<button class="chip ${c.k == P.cat ? 'on' : ''}" data-a="cat" data-v="${esc(c.k)}">${esc(c.label)}</button>`).join('')}</div>
  <div class="chips"><button class="chip" data-a="per">${perLabel(P)} <span class="car">▾</span></button><button class="chip ${P.seg >= 0 ? 'on' : ''}" data-a="seg">${esc(segName)} <span class="car">▾</span></button></div>
  <div class="seg" style="margin:2px 0 8px"><button class="${P.met == 'q' ? 'on' : ''}" data-a="met" data-v="q">Số lượng (chiếc)</button><button class="${P.met == 'u' ? 'on' : ''}" data-a="met" data-v="u">Giá trị (USD)</button></div>`;
  if (!a.v) return shell('Nhập khẩu', subLine(), h + '<div class="empty">Không có số trong kỳ này</div>');
  h += `<div class="ins">${insight(C, P, a, b, rk, sh, sh0)}</div>`;
  h += `<div class="kp">
  <div class="k"><div class="l">Tổng thị trường</div><div class="v num">${fV(a.v, P.met)}</div><div class="d">${b ? fG(a.v, b.v) + ' cùng kỳ' : 'chưa có cùng kỳ'}</div></div>
  <div class="k gb" data-a="gbdet"><div class="l">GIGABYTE ›</div><div class="v num" style="color:var(--gb)">${fV(a.g, P.met)}</div><div class="d">${b ? fG(a.g, b.g) + ' cùng kỳ' : ''}</div></div>
  <div class="k gb" data-a="gbdet"><div class="l">Thị phần GIGABYTE</div><div class="v num">${fP(sh)}</div><div class="d">${rk ? 'Hạng ' + rk + ' ' : ''}${b ? fPts(sh - sh0) : ''}</div></div>
  <div class="k"><div class="l">Giá nhập TB thị trường</div><div class="v num">${isFinite(asp) ? fU(asp) : '—'}</div><div class="d">${b && isFinite(asp0) ? fG(asp, asp0) + ' cùng kỳ' : ''}${gq ? (b && isFinite(asp0) ? ' · ' : '') + 'GIGABYTE ' + fU(gu / gq) : ''}</div></div></div>`;
  h += trendCard(C, P, a, b, 'Theo tháng · ' + P.y, Array.from(a.mv, (v, m) => v ? a.mg[m] / v : NaN), 'Thị phần GIGABYTE');
  h += brandCard(C, P, a, b, 10);
  const ttl = { importer: 'Nhà nhập khẩu', segment: 'Phân khúc', band: 'Khoảng giá', sub: 'Dòng máy', gpu: 'GPU', cpum: 'CPU' };
  for (const k of ['importer', 'segment', 'band']) if (C.dims.includes(k) && !(k == 'segment' && P.seg >= 0)) h += barCard(C, P, a, k, ttl[k], 8);
  return shell('Nhập khẩu', subLine(), h) }
const gbSum = (C, by) => { let s = 0; for (let i = 0; i < by.length; i++) if (C.gb[i]) s += by[i]; return s };
function insight(C, P, a, b, rk, sh, sh0) { const L = [];
  L.push(`${esc(C.label)} · ${perLabel(P)}: <b>${fV(a.v, P.met)}</b>${b ? ' ' + fG(a.v, b.v) : ''}`);
  if (a.g > 0) L.push(`GIGABYTE <b>hạng ${rk}</b>, thị phần <b>${fP(sh)}</b>${b && isFinite(sh0) ? ' ' + fPts(sh - sh0) : ''}`); else L.push('GIGABYTE chưa có số trong kỳ');
  if (b) { let best = null; for (const [i, v] of topL(C, a.by.brand, 'brand', 10)) { const v0 = b.by.brand[i]; if (v0 > 0 && v > v0 && (!best || v / v0 > best[1])) best = [i, v / v0] }
    if (best) L.push(`tăng mạnh nhất trong top 10: <b>${esc(C.dict.brand[best[0]])}</b> ▲${vnN((best[1] - 1) * 100)}%`) }
  return L.join(' · ') }
function trendCard(C, P, a, b, title, shr, shl) { const ms = []; const mx = Math.max(C.maxM[P.y] || 12, P.m1); for (let m = 1; m <= mx; m++) ms.push(m);
  let top_ = 0; for (const m of ms) top_ = Math.max(top_, a.mv[m], b ? b.mv[m] : 0); top_ = top_ || 1;
  const bars = ms.map(m => { const v = a.mv[m], g = a.mg[m], on = m >= P.m0 && m <= P.m1; return `<button data-a="month" data-v="${m}" class="${on ? 'on' : 'off'}"><div class="col" style="height:${Math.max(1.5, v / top_ * 100)}%"><i style="height:${v ? g / v * 100 : 0}%"></i></div><span>${m}</span></button>` }).join('');
  const sr = shr ? `<div class="shr">${ms.map(m => `<span class="${m >= P.m0 && m <= P.m1 ? '' : 'off'}">${isFinite(shr[m]) && a.mv[m] ? vnN(shr[m] * 100, shr[m] < .1 ? 1 : 0) : '–'}</span>`).join('')}</div>` : '';
  return `<div class="cd"><h3>${title}<span class="sp"></span><small>chạm tháng để xem</small></h3><div class="trend">${bars}</div>${sr}
  <div class="leg"><span><i style="background:#2b5a80"></i>${a.mg.some(x => x) ? 'Thị trường' : 'Số nhập'}</span>${a.mg.some(x => x) ? '<span><i style="background:var(--gb)"></i>Phần GIGABYTE</span>' : ''}${shr ? '<span style="color:var(--gb)">số vàng = ' + shl + ' (%)</span>' : ''}${P.m0 != 1 || P.m1 != (C.maxM[P.y] || 12) ? '<span>· mờ = ngoài kỳ đang xem</span>' : ''}</div></div>` }
function brandCard(C, P, a, b, n) { const L = topL(C, a.by.brand, 'brand'), mx = L.length ? L[0][1] : 1;
  const row = ([i, v], r) => { const nm = C.dict.brand[i], col = bCol(nm), v0 = b ? b.by.brand[i] : 0;
    return `<button class="br ${C.gb[i] ? 'me' : ''}" data-a="brand" data-v="${i}"><span class="rk">${r + 1}</span><span class="nm"><b><i class="dot" style="background:${col}"></i>${esc(nm || '(trống)')}</b><div class="bar"><i style="width:${v / mx * 100}%;background:${col}"></i></div></span><span class="rv num">${fV(v, P.met)}<small>${fP(v / a.v)}${b ? ' · ' + fG(v, v0) : ''}</small></span></button>` };
  return `<div class="cd" id="brands"><h3>Nhãn hàng<span class="sp"></span><small>${L.length} hãng</small></h3>${L.slice(0, n).map(row).join('')}${L.length > n ? L.map((x, r) => [x, r]).filter(([x, r]) => r >= n && C.gb[x[0]]).map(([x, r]) => '<div class="gap">⋯</div>' + row(x, r)).join('') : ''}${L.length > n ? `<button class="more" data-a="allbrands">Xem cả ${L.length} hãng ›</button>` : ''}</div>` }
function barCard(C, P, a, k, title, n, accent) { const L = topL(C, a.by[k], k), tot = a.v || 1; if (!L.length) return ''; const mx = L[0][1];
  return `<div class="cd"><h3>${title}<span class="sp"></span><small>${L.length}</small></h3>${L.slice(0, n).map(([i, v]) => `<div class="hb"><span class="n">${esc(C.dict[k][i])}</span><span class="t"><i style="width:${v / mx * 100}%;${accent ? 'background:' + accent : ''}"></i></span><span class="x num">${fP(v / tot, v / tot < .1 ? 1 : 0)}</span></div>`).join('')}</div>` }

/* chi tiết một hãng (toàn màn hình) */
function brandSheet(i) { const C = curC(), P = S.imp, nm = C.dict.brand[i], col = bCol(nm), f = Object.assign({}, P, { br: i });
  const all = agg(C, P), a = agg(C, f), ok = prevOk(C, P), b = ok ? agg(C, Object.assign({}, f, { y: P.y - 1 })) : null, ball = ok ? agg(C, Object.assign({}, P, { y: P.y - 1 })) : null;
  const L = topL(C, all.by.brand, 'brand'), rk = L.findIndex(x => x[0] == i) + 1, sh = all.v ? a.v / all.v : NaN, sh0 = ball && ball.v ? (b.v / ball.v) : NaN, asp = a.q ? a.u / a.q : NaN, mAsp = all.q ? all.u / all.q : NaN;
  const a2 = Object.assign({}, a, { mg: new Float64Array(13) });
  let h = `<button class="back" data-a="close">‹ Nhập khẩu</button><h2 style="display:flex;align-items:center;gap:8px"><i class="dot" style="background:${col};width:12px;height:12px"></i>${esc(nm)}</h2>
  <div class="asof" style="margin:-6px 0 10px">${esc(C.label)} · ${perLabel(P)}${P.seg >= 0 ? ' · ' + esc(C.dict.segment[P.seg]) : ''}</div>
  <div class="kp"><div class="k"><div class="l">${P.met == 'u' ? 'Giá trị nhập' : 'Số lượng nhập'}</div><div class="v num">${fV(a.v, P.met)}</div><div class="d">${b ? fG(a.v, b.v) + ' cùng kỳ' : ''}</div></div>
  <div class="k"><div class="l">Thị phần · hạng</div><div class="v num">${fP(sh)}</div><div class="d">Hạng ${rk}/${L.length} ${b ? fPts(sh - sh0) : ''}</div></div>
  <div class="k"><div class="l">Giá nhập TB</div><div class="v num">${isFinite(asp) ? fU(asp) : '—'}</div><div class="d">thị trường ${isFinite(mAsp) ? fU(mAsp) : '—'}</div></div>
  <div class="k"><div class="l">${P.met == 'u' ? 'Số lượng' : 'Giá trị'}</div><div class="v num">${P.met == 'u' ? fQ(a.q) : fU(a.u)}</div><div class="d">${b ? fG(P.met == 'u' ? a.q : a.u, P.met == 'u' ? b.q : b.u) + ' cùng kỳ' : ''}</div></div></div>`;
  h += trendCard(C, P, a2, b, 'Theo tháng · ' + P.y, Array.from(a.mv, (v, m) => all.mv[m] ? v / all.mv[m] : NaN), 'thị phần ' + esc(nm));
  const ttl = { sub: 'Dòng máy', segment: 'Phân khúc', importer: 'Nhà nhập khẩu', band: 'Khoảng giá', cpum: 'CPU', gpu: 'GPU' };
  for (const k of ['sub', 'segment', 'importer', 'band', 'cpum', 'gpu']) if (C.dims.includes(k) && !(k == 'segment' && P.seg >= 0)) h += barCard(C, P, a, k, ttl[k], 8, col);
  openSheet(h, true) }

/* Cài đặt */
function pageSet() { const d = S.d, h = d.head || {}, sz = S.pkg ? S.pkg.length : 0;
  const scope = [d.imp && d.imp.length ? 'Nhập khẩu (' + d.imp.map(c => esc(c.label)).join(', ') + ')' : '', d.sales ? 'Bán ra' + (d.sales.g ? ' + lãi gộp' : '') : ''].filter(Boolean).join(' · ');
  return shell('Cài đặt', '', `<div class="cd"><h3>Gói đang xem</h3>
  <div class="kv"><span>File</span><span style="font-size:12.5px">${esc(S.name)}</span></div><div class="kv"><span>Tạo lúc</span><span>${fMade(h.made)}</span></div>
  <div class="kv"><span>Dữ liệu đến</span><span>${fDate(d.asof || h.asof)}</span></div><div class="kv"><span>Nội dung</span><span>${scope}</span></div>
  <div class="kv"><span>Dung lượng</span><span>${sz > 1048576 ? vnN(sz / 1048576, 1) + ' MB' : vnN(sz / 1024) + ' KB'}</span></div><div class="kv" style="border:0"><span>Bảo mật</span><span>AES-256 · ${S.keyed ? 'đã ghi nhớ trên iPhone' : 'hỏi mật khẩu mỗi lần mở'}</span></div></div>
  <button class="btn b1" data-a="pick">Nạp gói mới</button><div style="height:10px"></div>
  <button class="btn b2" data-a="lock">Khoá ngay (hỏi lại mật khẩu)</button><div style="height:10px"></div>
  <button class="btn b3" data-a="wipe">Xoá dữ liệu khỏi iPhone</button>
  <p class="asof" style="text-align:center;margin-top:16px">DGV-GBT Mobile · bản ${APPV} · không kết nối Internet</p>`) }

/* ================= v116: BÁN HÀNG ================= */
/* số bán ra: tính theo đúng định nghĩa sheet "Chỉ số" của máy tính (loại dòng được tính), không tính dòng nội bộ */
function prepSales(Sl) { const T = Sl.dict, C = Sl.col, n = Sl.n; Sl.yv = new Int16Array(n); Sl.mo = new Int8Array(n);
  const ks = id => { const m = (Sl.met || []).find(x => x.id == id); return m ? new Set(m.ks.split('')) : new Set() };
  const kR = ks('rev'), kQ = ks('qty'), kG = ks('gp'), kD = ks('dealers'); const okR = T.k.map(k => kR.has(k)), okQ = T.k.map(k => kQ.has(k)), okG = T.k.map(k => kG.has(k)), okD = T.k.map(k => kD.has(k));
  Sl.rv = new Float64Array(n); Sl.qv = new Float64Array(n); Sl.gv = new Float64Array(n); Sl.dOk = new Uint8Array(n); Sl.hasG = !!Sl.g && (Sl.met || []).some(m => m.id == 'gp');
  Sl.has = {};
  for (let i = 0; i < n; i++) { const y = T.y[C.y[i]], m = T.m[C.m[i]]; Sl.yv[i] = y; Sl.mo[i] = m; const a = Sl.has[y] = Sl.has[y] || new Uint8Array(13); a[m] = 1;
    if (T.int[C.int[i]]) continue; const k = C.k[i]; if (okR[k]) Sl.rv[i] = Sl.r[i]; if (okQ[k]) Sl.qv[i] = Sl.q[i]; if (Sl.hasG && okG[k]) Sl.gv[i] = Sl.g[i]; if (okD[k]) Sl.dOk[i] = 1 }
  Sl.years = Object.keys(Sl.has).map(Number).sort((a, b) => b - a); Sl.maxM = {}; for (const y of Sl.years) { let mx = 0; for (let m = 1; m <= 12; m++) if (Sl.has[y][m]) mx = m; Sl.maxM[y] = mx }
  Sl.dims = ['d', 'p', 'se', 's', 'grp', 'prov', 'br'].filter(k => C[k]);
  Sl.gbBr = T.br.findIndex(b => isGB(b)) }
function sagg(Sl, f) { const C = Sl.col, n = Sl.n, o = { r: 0, q: 0, g: 0, dl: 0, mr: new Float64Array(13), mq: new Float64Array(13), mg: new Float64Array(13), by: {} };
  for (const k of Sl.dims) { const L = Sl.dict[k].length; o.by[k] = { r: new Float64Array(L), q: new Float64Array(L), g: new Float64Array(L) } }
  const seen = new Uint8Array(Sl.dict.d.length), br = f.br == null ? -1 : f.br, grp = f.grp == null ? -1 : f.grp, fd = f.dim, fi = f.idx;
  for (let i = 0; i < n; i++) { if (Sl.yv[i] !== f.y) continue; if (br >= 0 && C.br[i] !== br) continue; if (grp >= 0 && C.grp[i] !== grp) continue; if (fd && C[fd][i] !== fi) continue;
    const r = Sl.rv[i], q = Sl.qv[i], g = Sl.gv[i], m = Sl.mo[i]; o.mr[m] += r; o.mq[m] += q; o.mg[m] += g;
    if (m < f.m0 || m > f.m1) continue; o.r += r; o.q += q; o.g += g; if (Sl.dOk[i]) { const d = C.d[i]; if (!seen[d]) { seen[d] = 1; o.dl++ } }
    for (const k of Sl.dims) { const b = o.by[k], j = C[k][i]; b.r[j] += r; b.q[j] += q; b.g[j] += g } }
  return o }
const slPrevOk = (Sl, p) => { const a = Sl.has[p.y - 1]; if (!a) return false; for (let m = p.m0; m <= p.m1; m++) if (a[m]) return true; return false };
function slDefault() { const Sl = S.d.sales, y = Sl.years[0]; return { y, m0: 1, m1: Sl.maxM[y] || 12, br: Sl.gbBr, grp: -1, view: 'd', met: 'r' } }
const SLV = [['d', 'Đại lý'], ['p', 'Chuỗi'], ['se', 'Sale'], ['s', 'Mã hàng'], ['grp', 'Nhóm hàng'], ['prov', 'Tỉnh']];
const SLM = { r: 'Doanh thu', q: 'Số lượng', g: 'Lãi gộp' };
const fSl = (v, met) => met == 'q' ? fQ(v) : fVnd(v);
function slName(dim, j) { const Sl = S.d.sales, v = Sl.dict[dim][j]; if (dim == 'd') { const e = Sl.dl[v]; return e && e[0] ? e[0] : v } return v === '' || v == null ? '(trống)' : String(v) }
function slSub(dim, j) { const Sl = S.d.sales, v = Sl.dict[dim][j]; if (dim == 'd') { const e = Sl.dl[v] || []; return [v, e[2]].filter(Boolean).join(' · ') } if (dim == 's') { const e = Sl.sku[v] || []; return e[0] || '' } return '' }
function slRank(Sl, a, b, dim, met, n, sel) { const arr = a.by[dim][met], L = []; for (let j = 0; j < arr.length; j++) if (arr[j] > 0 || (met == 'r' && a.by[dim].q[j] > 0)) L.push([j, arr[j]]); L.sort((x, y) => y[1] - x[1]);
  const tot = met == 'q' ? a.q : met == 'g' ? a.g : a.r, mx = L.length ? Math.max(L[0][1], 1e-9) : 1;
  const row = ([j, v], r) => { const v0 = b ? b.by[dim][met][j] : 0, mg = met == 'r' && Sl.hasG && v ? a.by[dim].g[j] / v : NaN, sub = slSub(dim, j);
    return `<button class="br" data-a="sent" data-v="${dim}:${j}"><span class="rk">${r + 1}</span><span class="nm"><b>${esc(slName(dim, j))}</b>${sub ? `<small class="sb2">${esc(sub)}</small>` : ''}<div class="bar"><i style="width:${Math.max(0, v / mx * 100)}%;background:var(--acc)"></i></div></span><span class="rv num">${fSl(v, met)}<small>${tot ? fP(v / tot) : ''}${b ? ' · ' + fG(v, v0) : ''}${isFinite(mg) ? ' · biên ' + fP(mg, 1) : ''}</small></span></button>` };
  return { html: L.slice(0, n).map(row).join(''), n: L.length } }
function slTrend(a, b, p, mx, act) { const ms = []; for (let m = 1; m <= Math.max(mx, p.m1); m++) ms.push(m); let t = 0; for (const m of ms) t = Math.max(t, a.mr[m]); t = t || 1;
  const bars = ms.map(m => { const on = m >= p.m0 && m <= p.m1; return `<button data-a="${act}" data-v="${m}" class="${on ? 'on' : 'off'}"><div class="col" style="height:${Math.max(1.5, Math.max(0, a.mr[m]) / t * 100)}%"></div><span>${m}</span></button>` }).join('');
  const yoy = b ? `<div class="shr">${ms.map(m => { const v = a.mr[m], v0 = b.mr[m]; if (!(v0 > 0) || !v) return '<span class="off">–</span>'; const g = v / v0 - 1; return `<span class="${on(m) ? '' : 'off'}" style="color:${g >= 0 ? 'var(--up)' : 'var(--dn)'}">${g >= 0 ? '+' : ''}${vnN(g * 100)}</span>` }).join('')}</div>` : '';
  function on(m) { return m >= p.m0 && m <= p.m1 }
  return `<div class="cd"><h3>Doanh thu theo tháng · ${p.y}<span class="sp"></span><small>chạm tháng để xem</small></h3><div class="trend">${bars}</div>${yoy}<div class="leg"><span><i style="background:#2b5a80"></i>Doanh thu ròng</span>${b ? '<span>số xanh/đỏ = % so cùng tháng năm trước</span>' : ''}</div></div>` }
function pageSales() { const Sl = S.d.sales; if (!Sl) return shell('Bán hàng', subLine(), '<div class="empty">Gói này không có số bán ra – trên máy tính chọn "Bán ra" khi tạo gói</div>');
  const P = S.sl, a = sagg(Sl, P), ok = slPrevOk(Sl, P), b = ok ? sagg(Sl, Object.assign({}, P, { y: P.y - 1 })) : null;
  const brN = P.br >= 0 ? Sl.dict.br[P.br] : 'Mọi nhãn', grN = P.grp >= 0 ? Sl.dict.grp[P.grp] || '(trống)' : 'Mọi nhóm hàng';
  let h = `<div class="chips"><button class="chip ${P.br < 0 ? 'on' : ''}" data-a="sbr" data-v="-1">Mọi nhãn</button>${Sl.dict.br.map((x, i) => [x, i]).filter(([x]) => x).map(([x, i]) => `<button class="chip ${P.br == i ? 'on' : ''}" data-a="sbr" data-v="${i}">${esc(x)}</button>`).join('')}</div>
  <div class="chips"><button class="chip" data-a="per">${perLabel(P)} <span class="car">▾</span></button><button class="chip ${P.grp >= 0 ? 'on' : ''}" data-a="sgrpS">${esc(grN)} <span class="car">▾</span></button></div>`;
  if (!a.r && !a.q) return shell('Bán hàng', subLine(), h + '<div class="empty">Không có số bán trong kỳ này</div>');
  const mg = Sl.hasG && a.r ? a.g / a.r : NaN, mg0 = b && Sl.hasG && b.r ? b.g / b.r : NaN;
  const topD = slTop(a, 'd'), topS = slTop(a, 'se');
  h += `<div class="ins">${esc(brN)} · ${perLabel(P)}: doanh thu ròng <b>${fVnd(a.r)}</b>${b ? ' ' + fG(a.r, b.r) : ''}${topD >= 0 ? ` · đại lý lớn nhất <b>${esc(slName('d', topD))}</b> (${fP(a.by.d.r[topD] / a.r)})` : ''}${topS >= 0 ? ` · sale dẫn đầu <b>${esc(slName('se', topS))}</b>` : ''}</div>`;
  h += `<div class="kp"><div class="k"><div class="l">Doanh thu ròng</div><div class="v num">${fVnd(a.r)}</div><div class="d">${b ? fG(a.r, b.r) + ' cùng kỳ' : 'chưa có cùng kỳ'}</div></div>
  <div class="k"><div class="l">Số lượng bán ròng</div><div class="v num">${fQ(a.q)}</div><div class="d">${b ? fG(a.q, b.q) + ' cùng kỳ' : ''}</div></div>
  ${Sl.hasG ? `<div class="k"><div class="l">Lãi gộp · biên</div><div class="v num">${fVnd(a.g)}</div><div class="d">biên ${fP(mg, 1)} ${b ? fPts(mg - mg0) : ''}</div></div>` : `<div class="k"><div class="l">Giá bán TB</div><div class="v num">${a.q ? fVnd(a.r / a.q) : '—'}</div><div class="d">mỗi chiếc</div></div>`}
  <div class="k"><div class="l">Đại lý có mua</div><div class="v num">${fQ(a.dl)}</div><div class="d">${b ? fG(a.dl, b.dl) + ' cùng kỳ' : ''}</div></div></div>`;
  h += slTrend(a, b, P, Sl.maxM[P.y] || 12, 'smonth');
  const mets = Sl.hasG ? ['r', 'q', 'g'] : ['r', 'q'];
  h += `<div class="chips">${SLV.filter(([k]) => Sl.col[k]).map(([k, l]) => `<button class="chip ${P.view == k ? 'on' : ''}" data-a="sview" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="seg" style="margin:0 0 8px">${mets.map(m => `<button class="${P.met == m ? 'on' : ''}" data-a="smet" data-v="${m}">${SLM[m]}</button>`).join('')}</div>`;
  const R = slRank(Sl, a, b, P.view, P.met, 15);
  h += `<div class="cd"><h3>${SLV.find(x => x[0] == P.view)[1]} · ${SLM[P.met]}<span class="sp"></span><small>${R.n}</small></h3>${R.html || '<div class="empty">Không có</div>'}${R.n > 15 ? `<button class="more" data-a="sall">Xem cả ${R.n} ›</button>` : ''}</div>`;
  return shell('Bán hàng', subLine(), h) }
function slTop(a, dim) { const r = a.by[dim] ? a.by[dim].r : []; let j = -1, v = 0; for (let i = 0; i < r.length; i++) if (r[i] > v) { v = r[i]; j = i } return j }
function slAllSheet() { const Sl = S.d.sales, P = S.sl, a = sagg(Sl, P), b = slPrevOk(Sl, P) ? sagg(Sl, Object.assign({}, P, { y: P.y - 1 })) : null, R = slRank(Sl, a, b, P.view, P.met, 1e9);
  openSheet(`<button class="back" data-a="close">‹ Bán hàng</button><h2>${SLV.find(x => x[0] == P.view)[1]} · ${perLabel(P)}</h2><div class="cd">${R.html}</div>`, true) }
/* chi tiết một đại lý / chuỗi / sale / mã hàng / nhóm / tỉnh */
const SLSUB = { d: ['s', 'grp', 'se'], p: ['d', 'grp', 'se'], se: ['d', 'p', 'grp'], s: ['d', 'se', 'prov'], grp: ['s', 'd', 'se'], prov: ['d', 'se', 'grp'] };
function slEntSheet(dim, j) { const Sl = S.d.sales, P = S.sl, f = Object.assign({}, P, { dim, idx: j }), a = sagg(Sl, f), ok = slPrevOk(Sl, P), b = ok ? sagg(Sl, Object.assign({}, f, { y: P.y - 1 })) : null, all = sagg(Sl, P);
  const mg = Sl.hasG && a.r ? a.g / a.r : NaN, sub = slSub(dim, j), lab = SLV.find(x => x[0] == dim)[1];
  let h = `<button class="back" data-a="close">‹ Bán hàng</button><h2>${esc(slName(dim, j))}</h2><div class="asof" style="margin:-6px 0 10px">${lab}${sub ? ' · ' + esc(sub) : ''} · ${P.br >= 0 ? esc(Sl.dict.br[P.br]) + ' · ' : ''}${perLabel(P)}</div>
  <div class="kp"><div class="k"><div class="l">Doanh thu ròng</div><div class="v num">${fVnd(a.r)}</div><div class="d">${b ? fG(a.r, b.r) + ' cùng kỳ' : ''}</div></div>
  <div class="k"><div class="l">Tỷ trọng</div><div class="v num">${all.r ? fP(a.r / all.r) : '—'}</div><div class="d">trên tổng ${P.br >= 0 ? esc(Sl.dict.br[P.br]) : 'mọi nhãn'}</div></div>
  <div class="k"><div class="l">Số lượng</div><div class="v num">${fQ(a.q)}</div><div class="d">${b ? fG(a.q, b.q) + ' cùng kỳ' : ''}</div></div>
  <div class="k"><div class="l">${Sl.hasG ? 'Lãi gộp · biên' : 'Giá bán TB'}</div><div class="v num">${Sl.hasG ? fVnd(a.g) : a.q ? fVnd(a.r / a.q) : '—'}</div><div class="d">${Sl.hasG ? 'biên ' + fP(mg, 1) : 'mỗi chiếc'}</div></div></div>`;
  h += slTrend(a, b, P, Sl.maxM[P.y] || 12, 'smonth');
  for (const k of SLSUB[dim] || []) if (Sl.col[k] && k != dim) { const R = slRank(Sl, a, b, k, 'r', 8); if (R.n) h += `<div class="cd"><h3>${SLV.find(x => x[0] == k)[1]}<span class="sp"></span><small>${R.n}</small></h3>${R.html}</div>` }
  S.ent = [dim, j]; openSheet(h, true) }

/* ================= v116: SO SÁNH HÃNG (nhập khẩu) ================= */
function cmpDefault(k) { const C = S.d.imp.find(c => c.k == k) || S.d.imp[0], y = C.years[0], P = { cat: C.k, y, m0: 1, m1: C.maxM[y] || 12, met: 'q', view: 'v', brs: [] };
  const L = topL(C, agg(C, P).by.brand, 'brand'); const g = L.find(([i]) => C.gb[i]); if (g) P.brs.push(g[0]); for (const [i] of L) { if (P.brs.length >= 4) break; if (!P.brs.includes(i)) P.brs.push(i) } return P }
const cmpC = () => S.d.imp.find(c => c.k == S.cmp.cat);
function lineChart(series, ms, fmt, on) { const W = 340, H = 170, pl = 6, pr = 6, pt = 10, pb = 22; let mx = 0, mn = Infinity; for (const s of series) for (const m of ms) if (isFinite(s.v[m])) { mx = Math.max(mx, s.v[m]); mn = Math.min(mn, s.v[m]) } mx = mx || 1;
  const lo = mn > mx * .3 ? Math.max(0, mn - (mx - mn) * .25) : 0, sp = (mx - lo) || 1;
  const x = k => pl + (ms.length < 2 ? (W - pl - pr) / 2 : k * (W - pl - pr) / (ms.length - 1)), y = v => pt + (H - pt - pb) * (1 - (v - lo) / sp);
  let g = `<line x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" stroke="#1e3a5f"/>` + [0, .5, 1].map(f => lo + sp * f).map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#13213d" stroke-dasharray="3 4"/><text x="${W - pr}" y="${y(v) - 3}" text-anchor="end" font-size="9" fill="#5b7699">${fmt(v)}</text>`).join('');
  g += ms.map((m, k) => `<text x="${x(k)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="${on(m) ? '#9fb3d1' : '#3b4f6b'}">${m}</text>`).join('');
  for (const s of series) { const pts = ms.map((m, k) => isFinite(s.v[m]) ? x(k).toFixed(1) + ',' + y(s.v[m]).toFixed(1) : null).filter(Boolean);
    g += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.c}" stroke-width="${s.me ? 3 : 2}" stroke-linejoin="round" stroke-linecap="round"/>` + ms.map((m, k) => isFinite(s.v[m]) ? `<circle cx="${x(k)}" cy="${y(s.v[m])}" r="${s.me ? 3.2 : 2.4}" fill="${s.c}"/>` : '').join('') }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" class="lc">${g}</svg>` }
function pageCmp() { const d = S.d; if (!d.imp || !d.imp.length) return shell('So sánh', subLine(), '<div class="empty">Gói này không có số nhập khẩu</div>');
  const P = S.cmp, C = cmpC(), all = agg(C, P), ok = prevOk(C, P), ball = ok ? agg(C, Object.assign({}, P, { y: P.y - 1 })) : null;
  let h = `<div class="chips">${d.imp.map(c => `<button class="chip ${c.k == P.cat ? 'on' : ''}" data-a="ccat" data-v="${esc(c.k)}">${esc(c.label)}</button>`).join('')}</div>
  <div class="chips"><button class="chip" data-a="per">${perLabel(P)} <span class="car">▾</span></button><button class="chip" data-a="cpick">＋ Chọn hãng (${P.brs.length}/4) <span class="car">▾</span></button></div>
  <div class="seg" style="margin:2px 0 8px"><button class="${P.met == 'q' ? 'on' : ''}" data-a="cmet" data-v="q">Số lượng</button><button class="${P.met == 'u' ? 'on' : ''}" data-a="cmet" data-v="u">Giá trị USD</button><button class="${P.view == 'sh' ? 'on' : ''}" data-a="cview" data-v="${P.view == 'sh' ? 'v' : 'sh'}">Thị phần %</button></div>`;
  if (!P.brs.length) return shell('So sánh', subLine(), h + '<div class="empty">Chọn ít nhất 2 hãng để so sánh</div>');
  const B = P.brs.map(i => { const f = Object.assign({}, P, { br: i }), a = agg(C, f), b = ok ? agg(C, Object.assign({}, f, { y: P.y - 1 })) : null; return { i, nm: C.dict.brand[i], c: bCol(C.dict.brand[i]), me: !!C.gb[i], a, b } });
  const rkL = topL(C, all.by.brand, 'brand'), rank = i => rkL.findIndex(x => x[0] == i) + 1;
  h += `<div class="cd"><h3>${esc(C.label)} · ${perLabel(P)}<span class="sp"></span><small>${P.met == 'u' ? 'USD' : 'chiếc'}</small></h3><div class="ct"><div class="ch"><span></span><span>${P.met == 'u' ? 'Giá trị' : 'Số lượng'}</span><span>Thị phần</span><span>Cùng kỳ</span><span>Giá TB</span></div>
  ${B.map(x => `<button class="cr ${x.me ? 'me' : ''}" data-a="cbrand" data-v="${x.i}"><span class="cn"><i class="dot" style="background:${x.c}"></i>${esc(x.nm)}<small>#${rank(x.i) || '–'}</small></span><span class="num">${fV(x.a.v, P.met)}</span><span class="num">${all.v ? fP(x.a.v / all.v) : '—'}</span><span class="num">${x.b ? fG(x.a.v, x.b.v) : '—'}</span><span class="num">${x.a.q ? fU(x.a.u / x.a.q) : '—'}</span></button>`).join('')}</div></div>`;
  const mx = Math.max(C.maxM[P.y] || 12, P.m1), ms = []; for (let m = 1; m <= mx; m++) ms.push(m); const on = m => m >= P.m0 && m <= P.m1;
  const sh = P.view == 'sh', ser = B.map(x => ({ c: x.c, me: x.me, v: Array.from(x.a.mv, (v, m) => sh ? (all.mv[m] ? v / all.mv[m] * 100 : NaN) : v) }));
  h += `<div class="cd"><h3>${sh ? 'Thị phần theo tháng (%)' : (P.met == 'u' ? 'Giá trị' : 'Số lượng') + ' theo tháng'} · ${P.y}</h3>${lineChart(ser, ms, sh ? v => vnN(v, 1) + '%' : v => P.met == 'u' ? fU(v) : fQ(v), on)}
  <div class="leg">${B.map(x => `<span><i style="background:${x.c}"></i>${esc(x.nm)}</span>`).join('')}</div></div>`;
  for (const [k, t] of [['segment', 'Cơ cấu phân khúc'], ['band', 'Cơ cấu khoảng giá'], ['importer', 'Nhà nhập khẩu chính']]) if (C.dims.includes(k)) h += mixCard(C, B, k, t);
  return shell('So sánh', subLine(), h) }
/* thanh 100% cho từng hãng theo một chiều (phân khúc / khoảng giá …): 5 nhóm lớn nhất của cả nhóm hãng đang so + Khác */
function mixCard(C, B, k, t) { const tot = new Float64Array(C.dict[k].length); for (const x of B) x.a.by[k].forEach((v, i) => tot[i] += v); const keys = topL(C, tot, k, 5).map(z => z[0]); if (!keys.length) return '';
  const pal = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#475569'];
  const rows = B.map(x => { const s = x.a.v || 1; let rest = s; const seg = keys.map((i, n) => { const v = x.a.by[k][i]; rest -= v; return [v / s, pal[n]] }); seg.push([Math.max(0, rest) / s, pal[5]]);
    return `<div class="mx"><span class="mn">${esc(x.nm)}</span><span class="mb">${seg.map(([f, c]) => f > 0 ? `<i style="width:${f * 100}%;background:${c}">${f >= .12 ? vnN(f * 100) : ''}</i>` : '').join('')}</span></div>` }).join('');
  return `<div class="cd"><h3>${t}<span class="sp"></span><small>% trong từng hãng</small></h3>${rows}<div class="leg">${keys.map((i, n) => `<span><i style="background:${pal[n]}"></i>${esc(C.dict[k][i])}</span>`).join('')}<span><i style="background:${pal[5]}"></i>Khác</span></div></div>` }
function cmpPickSheet() { const P = S.cmp, C = cmpC(), L = topL(C, agg(C, P).by.brand, 'brand', 40);
  openSheet(`<h2>Chọn 2–4 hãng</h2>` + L.map(([i, v]) => `<button class="opt ${P.brs.includes(i) ? 'on' : ''}" data-a="ctog" data-v="${i}"><span><i class="dot" style="background:${bCol(C.dict.brand[i])};display:inline-block;margin-right:8px"></i>${esc(C.dict.brand[i])}</span></button>`).join('') + `<div style="height:10px"></div><button class="btn b1" data-a="close">Xong</button>`) }

/* ================= v116: TÌM & HỎI ================= */
const CATW = { laptop: ['laptop', 'notebook', 'nb', 'xach tay', 'may tinh xach tay'], lcd: ['man hinh', 'monitor', 'lcd'], pc: ['pc', 'desktop', 'may bo', 'de ban', 'may tinh de ban', 'aio'], ssd: ['ssd', 'o cung', 'storage', 'luu tru'], server: ['server', 'may chu'], vga: ['vga', 'card man hinh', 'card do hoa'] };
const wre = w => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
function findIdx() { if (S.fx) return S.fx; const X = { imp: [], sl: [] };
  for (const C of S.d.imp || []) for (const k of ['brand', 'sub', 'importer']) if (C.col[k]) C.dict[k].forEach((v, i) => { if (!blank(v)) X.imp.push({ c: C.k, k, i, v, n: noMark(v) }) });
  const Sl = S.d.sales; if (Sl) for (const k of ['d', 'p', 'se', 's', 'br', 'grp']) if (Sl.col[k]) Sl.dict[k].forEach((v, i) => { if (v === '' || v == null) return; const nm = slName(k, i), sub = slSub(k, i); X.sl.push({ k, i, v: nm, sub, n: noMark(nm + ' ' + (k == 'd' || k == 's' ? v + ' ' + sub : '')) }) });
  return S.fx = X }
function parseQ(t) { const n = noMark(t), o = { n, src: null, cats: [], y: 0, m0: 0, m1: 0 };
  if (/nhap khau|\bnhap\b|import/.test(n)) o.src = 'imp'; else if (/doanh so|doanh thu|ban ra|ban hang|\bban\b|sell|revenue|dai ly|chuoi/.test(n)) o.src = 'sl';
  const y = n.match(/\b(20\d\d)\b/); if (y) o.y = +y[1];
  const q = n.match(/\b(?:quy|q)\s?([1-4])\b/), m = n.match(/\b(?:thang|t)\s?(1[0-2]|[1-9])\b/); if (q) { o.m0 = (q[1] - 1) * 3 + 1; o.m1 = o.m0 + 2 } else if (m) o.m0 = o.m1 = +m[1];
  for (const C of S.d.imp || []) { const ws = (CATW[C.k] || []).concat([noMark(C.label)]); if (ws.some(w => wre(w).test(n))) o.cats.push(C.k) }
  const X = findIdx(); o.ib = []; const seenB = new Set();
  for (const e of X.imp) if (e.k == 'brand' && e.n.length >= 2 && wre(e.n).test(n) && !seenB.has(e.c + e.i)) { seenB.add(e.c + e.i); o.ib.push(e) }
  o.se = X.sl.filter(e => (e.k == 'br' || e.k == 'se' || e.k == 'd' || e.k == 'p' || e.k == 's') && noMark(e.v).length >= 2 && wre(noMark(e.v)).test(n));
  return o }
function perOf(o, years, maxM) { const y = o.y && years.includes(o.y) ? o.y : years[0]; if (o.m0) return { y, m0: o.m0, m1: o.m1 }; return { y, m0: 1, m1: maxM[y] || 12 } }
function quick(t) { const o = parseQ(t), out = []; if (!t.trim()) return '';
  if (o.src != 'sl' && (o.cats.length || o.ib.length)) { const cats = o.cats.length ? o.cats : [...new Set(o.ib.map(e => e.c))];
    for (const ck of cats.slice(0, 5)) { const C = S.d.imp.find(c => c.k == ck); const p = Object.assign(perOf(o, C.years, C.maxM), { met: 'q' }); const all = agg(C, p), ok = prevOk(C, p), b0 = ok ? agg(C, Object.assign({}, p, { y: p.y - 1 })) : null;
      const brs = o.ib.filter(e => e.c == ck); const list = brs.length ? brs.map(e => e.i) : topL(C, all.by.brand, 'brand').filter(([i]) => C.gb[i]).map(x => x[0]).slice(0, 1); const rk = topL(C, all.by.brand, 'brand');
      for (const i of list.slice(0, 3)) { const a = agg(C, Object.assign({}, p, { br: i })), b = ok ? agg(C, Object.assign({}, p, { br: i, y: p.y - 1 })) : null;
        out.push(`<button class="qa" data-a="qimp" data-v="${ck}|${i}|${p.y}|${p.m0}|${p.m1}"><div class="qt">Nhập khẩu · ${esc(C.label)} · ${esc(C.dict.brand[i])} · ${perLabel(p)}</div><div class="qv num">${fQ(a.v)} <small>chiếc</small></div><div class="qd">${b ? fG(a.v, b.v) + ' cùng kỳ · ' : ''}thị phần ${all.v ? fP(a.v / all.v) : '—'} · hạng ${rk.findIndex(x => x[0] == i) + 1}/${rk.length} · ${fU(a.u)}</div></button>`) }
      if (!list.length) out.push(`<button class="qa" data-a="qimp" data-v="${ck}|-1|${p.y}|${p.m0}|${p.m1}"><div class="qt">Nhập khẩu · ${esc(C.label)} · ${perLabel(p)}</div><div class="qv num">${fQ(all.v)} <small>chiếc</small></div><div class="qd">${b0 ? fG(all.v, b0.v) + ' cùng kỳ · ' : ''}${fU(all.u)}</div></button>`) } }
  const Sl = S.d.sales; if (Sl && o.src != 'imp' && (o.se.length || o.src == 'sl')) { const p = perOf(o, Sl.years, Sl.maxM); const ents = o.se.length ? o.se.slice(0, 3) : [null];
    for (const e of ents) { const f = Object.assign({}, p, e ? (e.k == 'br' ? { br: e.i } : { dim: e.k, idx: e.i }) : {}), a = sagg(Sl, f), b = slPrevOk(Sl, p) ? sagg(Sl, Object.assign({}, f, { y: p.y - 1 })) : null;
      out.push(`<button class="qa" data-a="qsl" data-v="${e ? e.k + ':' + e.i : ''}|${p.y}|${p.m0}|${p.m1}"><div class="qt">Bán ra · ${e ? esc(e.v) : 'toàn bộ'} · ${perLabel(p)}</div><div class="qv num">${fVnd(a.r)} <small>doanh thu ròng</small></div><div class="qd">${b ? fG(a.r, b.r) + ' cùng kỳ · ' : ''}${fQ(a.q)} chiếc${Sl.hasG && a.r ? ' · biên ' + fP(a.g / a.r, 1) : ''}</div></button>`) } }
  return out.join('') }
function findList(t) { const n = noMark(t).trim(); if (n.length < 2) return ''; const cw = new Set(Object.values(CATW).flat().concat((S.d.imp || []).map(c => noMark(c.label))).join(' ').split(' ')); const ws = n.split(/\s+/).filter(w => w.length >= 2 && !cw.has(w) && !/^(20\d\d|nhap|khau|doanh|so|thu|ban|ra|thang|quy|nam|t\d+|q\d)$/.test(w)); if (!ws.length) return '';
  const X = findIdx(), hit = e => ws.every(w => e.n.includes(w)); const KL = { brand: 'Hãng (nhập khẩu)', sub: 'Dòng máy', importer: 'Nhà nhập khẩu', d: 'Đại lý', p: 'Chuỗi', se: 'Sale', s: 'Mã hàng', br: 'Nhãn (bán ra)', grp: 'Nhóm hàng' };
  const I = X.imp.filter(hit).slice(0, 12), L = X.sl.filter(hit).slice(0, 12); if (!I.length && !L.length) return quick(t) ? '' : '<div class="empty">Không thấy kết quả</div>';
  const cl = c => (S.d.imp.find(x => x.k == c) || {}).label || c;
  return `<div class="cd">${I.map(e => `<button class="fr" data-a="fimp" data-v="${e.c}|${e.k}|${e.i}"><b>${esc(e.v)}</b><small>${KL[e.k]} · ${esc(cl(e.c))}</small></button>`).join('')}${L.map(e => `<button class="fr" data-a="fsl" data-v="${e.k}:${e.i}"><b>${esc(e.v)}</b><small>${KL[e.k]}${e.sub ? ' · ' + esc(e.sub) : ''}</small></button>`).join('')}</div>` }
function pageFind() { return shell('Tìm & Hỏi', subLine(), `<input class="inp" id="fq" type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="VD: nhập khẩu ssd gigabyte 2026" value="${esc(S.q || '')}">
  <div id="fres" style="margin-top:10px">${findBody(S.q || '')}</div>`) }
function findBody(t) { if (!t.trim()) return `<div class="cd"><h3>Gợi ý</h3>${['nhập khẩu laptop gigabyte 2026', 'màn hình dell quý 3', 'doanh số gigabyte tháng 9', 'ssd 2025'].map(x => `<button class="fr" data-a="fsug" data-v="${esc(x)}"><b>${esc(x)}</b></button>`).join('')}</div><div class="asof" style="text-align:center">Tìm hãng, dòng máy, nhà nhập khẩu, đại lý, sale, mã hàng – hoặc hỏi kèm nhóm hàng và thời gian</div>`;
  const q = quick(t); return (q ? `<div class="qs">${q}</div>` : '') + findList(t) }
document.addEventListener('input', e => { if (e.target.id != 'fq') return; S.q = e.target.value; clearTimeout(S.fqT); S.fqT = setTimeout(() => { const r = $('#fres'); if (r) r.innerHTML = findBody(S.q) }, 120) });

/* ---------- bảng trượt ---------- */
function openSheet(html, full) { $('#sheet').innerHTML = `<div class="bg" data-a="close"></div><div class="sh ${full ? 'full' : ''}">${full ? '' : '<div class="grab"></div>'}${html}</div>`; document.body.style.overflow = 'hidden' }
function closeSheet() { $('#sheet').innerHTML = ''; document.body.style.overflow = '' }
function perCtx() { if (S.tab == 'sales') { const Sl = S.d.sales; return { P: S.sl, C: Sl } } if (S.tab == 'cmp') return { P: S.cmp, C: cmpC() }; return { P: S.imp, C: curC() } }
function perSheet() { const { P, C } = perCtx(); let h = '<h2>Chọn kỳ</h2><div class="chips" style="margin-bottom:6px">' + C.years.map(y => `<button class="chip ${y == P.y ? 'on' : ''}" data-a="py" data-v="${y}">${y}</button>`).join('') + '</div>';
  const mx = C.maxM[P.y] || 12, O = [['ytd', mx < 12 ? 'Từ đầu năm (T1–T' + mx + ')' : 'Cả năm', 1, mx]];
  if (mx == 12) O[0] = ['y', 'Cả năm', 1, 12];
  for (let q = 1; q <= 4; q++) if ((q - 1) * 3 + 1 <= mx) O.push(['q' + q, 'Quý ' + q + ((q * 3 > mx) ? ' (chưa đủ tháng)' : ''), (q - 1) * 3 + 1, Math.min(q * 3, 12)]);
  for (let m = mx; m >= 1; m--) O.push(['m' + m, 'Tháng ' + m, m, m]);
  h += O.map(([k, l, a, b]) => `<button class="opt ${P.m0 == a && P.m1 == b ? 'on' : ''}" data-a="pm" data-v="${a}-${b}">${l}</button>`).join(''); openSheet(h) }
function segSheet() { const C = curC(), P = S.imp; if (!C.col.segment) return; const L = C.dict.segment.map((v, i) => [i, v]).filter(([i, v]) => !blank(v));
  openSheet('<h2>Phân khúc</h2>' + `<button class="opt ${P.seg < 0 ? 'on' : ''}" data-a="ps" data-v="-1">Mọi phân khúc</button>` + L.map(([i, v]) => `<button class="opt ${P.seg == i ? 'on' : ''}" data-a="ps" data-v="${i}">${esc(v)}</button>`).join('')) }
function allBrandsSheet() { const C = curC(), P = S.imp, a = agg(C, P), b = prevOk(C, P) ? agg(C, Object.assign({}, P, { y: P.y - 1 })) : null;
  openSheet(`<button class="back" data-a="close">‹ Nhập khẩu</button><h2>Mọi nhãn hàng · ${perLabel(P)}</h2>` + brandCard(C, P, a, b, 1e9).replace('<h3>Nhãn hàng', '<h3>' + esc(C.label)), true) }

/* ---------- nạp + mở gói ---------- */
function pick() { const i = document.createElement('input'); i.type = 'file'; i.style.display = 'none'; document.body.appendChild(i);
  i.onchange = async () => { const f = i.files && i.files[0]; i.remove(); if (!f) return; try { const u8 = new Uint8Array(await f.arrayBuffer()); phHead(u8); S.pend = u8; S.pendName = f.name; closeSheet(); S.d = null; render(); setTimeout(() => { const p = $('#pw'); if (p) p.focus() }, 50) }
    catch (e) { toast('File này không phải gói DGV-GBT (.dgvp)', 3500) } };
  i.click() }
async function unlock() { const pw = $('#pw').value, rem = $('#rem').checked, er = $('#err'), btn = document.querySelector('[data-a=unlock]'); if (!pw) { er.textContent = 'Nhập mật khẩu'; return }
  const u8 = S.pend || S.pkg; btn.disabled = true; btn.textContent = 'Đang mở…'; er.textContent = '';
  try { const { h } = phHead(u8); const key = await phKey(pw, phUnB64(h.salt), h.it); const d = await openWithKey(u8, key);
    if (S.pend) { await IDB.set('pkg', { u8: S.pend, name: S.pendName }); S.pkg = S.pend; S.name = S.pendName; S.pend = null }
    if (rem) { await IDB.set('key', key); S.keyed = true } else { await IDB.del('key'); S.keyed = false }
    load(d); toast('✓ Đã mở gói') }
  catch (e) { er.textContent = e.message == 'bad-password' ? 'Sai mật khẩu' : 'Không mở được gói: ' + e.message; btn.disabled = false; btn.textContent = 'Mở' } }
function load(d) { (d.imp || []).forEach(prepImp); if (d.sales) prepSales(d.sales); S.d = d; S.fx = null; if (!S.imp || !(d.imp || []).some(c => c.k == S.imp.cat)) S.imp = d.imp && d.imp.length ? impDefault(d.imp[0].k) : null;
  S.cmp = d.imp && d.imp.length ? cmpDefault(S.imp.cat) : null; S.sl = d.sales ? slDefault() : null; render() }

/* ---------- thao tác ---------- */
const ACT = {
  tab: v => { S.tab = v; closeSheet(); render() },
  pick, unlock,
  cat: v => { S.imp = impDefault(v); S.tab = 'imp'; render() },
  per: () => perSheet(), seg: () => segSheet(),
  met: v => { S.imp.met = v; render(true) },
  py: v => { const { P, C } = perCtx(), y = +v; P.y = y; P.m0 = 1; P.m1 = C.maxM[y] || 12; closeSheet(); render(true) },
  pm: v => { const { P } = perCtx(); const [a, b] = v.split('-').map(Number); P.m0 = a; P.m1 = b; closeSheet(); render(true) },
  ps: v => { S.imp.seg = +v; closeSheet(); render(true) },
  month: v => { const m = +v; if (S.imp.m0 == m && S.imp.m1 == m) { S.imp.m0 = 1; S.imp.m1 = curC().maxM[S.imp.y] || 12 } else { S.imp.m0 = S.imp.m1 = m } if ($('#sheet').innerHTML && S.det != null) { brandSheet(S.det); render(true); return } render(true) },
  brand: v => { S.det = +v; brandSheet(+v) },
  gbdet: () => { const C = curC(), L = topL(C, agg(C, S.imp).by.brand, 'brand').filter(([i]) => C.gb[i]); if (!L.length) { toast('GIGABYTE chưa có số trong kỳ này'); return } S.det = L[0][0]; brandSheet(L[0][0]) },
  allbrands: () => allBrandsSheet(),
  close: () => { S.det = null; S.ent = null; closeSheet(); if (S.tab == 'cmp') render(true) },
  sbr: v => { S.sl.br = +v; render(true) }, sview: v => { S.sl.view = v; render(true) }, smet: v => { S.sl.met = v; render(true) }, sall: () => slAllSheet(),
  sgrpS: () => { const Sl = S.d.sales, P = S.sl; openSheet('<h2>Nhóm hàng</h2>' + `<button class="opt ${P.grp < 0 ? 'on' : ''}" data-a="sgrp" data-v="-1">Mọi nhóm hàng</button>` + Sl.dict.grp.map((g, i) => [g, i]).filter(([g]) => g).map(([g, i]) => `<button class="opt ${P.grp == i ? 'on' : ''}" data-a="sgrp" data-v="${i}">${esc(g)}</button>`).join('')) },
  sgrp: v => { S.sl.grp = +v; closeSheet(); render(true) },
  sent: v => { const [d, j] = v.split(':'); slEntSheet(d, +j) },
  smonth: v => { const P = S.sl, m = +v; if (P.m0 == m && P.m1 == m) { P.m0 = 1; P.m1 = S.d.sales.maxM[P.y] || 12 } else P.m0 = P.m1 = m; if (S.ent && $('#sheet').innerHTML) slEntSheet(S.ent[0], S.ent[1]); render(true) },
  ccat: v => { S.cmp = cmpDefault(v); render(true) }, cmet: v => { S.cmp.met = v; if (S.cmp.view == 'sh') S.cmp.view = 'v'; render(true) }, cview: v => { S.cmp.view = v; render(true) },
  cpick: () => cmpPickSheet(),
  ctog: v => { const i = +v, B = S.cmp.brs, k = B.indexOf(i); if (k >= 0) { if (B.length <= 1) return toast('Giữ ít nhất 1 hãng'); B.splice(k, 1) } else { if (B.length >= 4) return toast('Tối đa 4 hãng'); B.push(i) } cmpPickSheet(); render(true) },
  cbrand: v => { const P = S.cmp; S.imp = { cat: P.cat, y: P.y, m0: P.m0, m1: P.m1, met: P.met, seg: -1 }; S.det = +v; brandSheet(+v) },
  fsug: v => { S.q = v; render() },
  qimp: v => { const [c, i, y, a, b] = v.split('|'); S.imp = { cat: c, y: +y, m0: +a, m1: +b, met: 'q', seg: -1 }; S.tab = 'imp'; render(); if (+i >= 0) { S.det = +i; brandSheet(+i) } },
  qsl: v => { const [e, y, a, b] = v.split('|'); Object.assign(S.sl, { y: +y, m0: +a, m1: +b }); S.tab = 'sales'; if (e) { const [k, i] = e.split(':'); if (k == 'br') { S.sl.br = +i; render() } else { render(); slEntSheet(k, +i) } } else render() },
  fimp: v => { const [c, k, i] = v.split('|'); S.imp = impDefault(c); S.tab = 'imp'; render(); const C = curC(); let b = +i;
    if (k != 'brand') { const cnt = new Float64Array(C.dict.brand.length); for (let r = 0; r < C.n; r++) if (C.col[k][r] == +i) cnt[C.col.brand[r]] += C.qty[r]; b = cnt.indexOf(Math.max(...cnt)) } if (k != 'importer') { S.det = b; brandSheet(b) } },
  fsl: v => { const [k, i] = v.split(':'); S.tab = 'sales'; if (k == 'br') { S.sl.br = +i; render() } else { render(); slEntSheet(k, +i) } },
  lock: async () => { await IDB.del('key'); S.keyed = false; S.d = null; render(); toast('Đã khoá – lần sau nhập lại mật khẩu') },
  wipe: async () => { if (!confirm('Xoá gói số liệu khỏi iPhone này?')) return; await IDB.del('key'); await IDB.del('pkg'); S.d = null; S.pkg = null; S.name = ''; render(); toast('Đã xoá dữ liệu') } };
document.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; const f = ACT[t.dataset.a]; if (f) { e.preventDefault(); f(t.dataset.v, t) } });
document.addEventListener('keydown', e => { if (e.key == 'Enter' && e.target.id == 'pw') unlock() });

/* ---------- khởi động ---------- */
async function boot() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist() } catch (e) { }
  try { const p = await IDB.get('pkg'); if (p && p.u8) { S.pkg = p.u8; S.name = p.name || '' }
    const k = S.pkg && await IDB.get('key'); if (k) { try { S.keyed = true; load(await openWithKey(S.pkg, k)); return } catch (e) { await IDB.del('key'); S.keyed = false } } } catch (e) { console.warn(e) }
  render() }
/* tự lên bản mới: hỏi bản mới mỗi lần mở / quay lại app; có bản mới → tải lại trang (số liệu + khoá ghi nhớ giữ nguyên) */
if ('serviceWorker' in navigator && (location.protocol == 'https:' || location.hostname == 'localhost' || location.hostname == '127.0.0.1')) {
  try { const had = !!navigator.serviceWorker.controller; let done = false;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => { const up = () => { try { reg.update() } catch (e) { } }; up();
      document.addEventListener('visibilitychange', () => { if (document.visibilityState == 'visible') up() }) }).catch(() => { });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!had || done) return; done = true; if ($('#pw') && $('#pw').value) { toast('Đã có bản mới – mở lại app để dùng', 4000); return } location.reload() }) } catch (e) { } }
boot();
