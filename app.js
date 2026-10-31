/* DGV-GBT Mobile – app xem số liệu trên iPhone, chạy offline hoàn toàn.
   Số liệu chỉ đến từ gói .dgvp do nút "Phone Data" trên máy tính tạo (gửi qua Phone Link), mã hoá AES-256-GCM.
   App KHÔNG có kết nối mạng nào (CSP connect-src 'none'); gói lưu trên iPhone ở dạng còn mã hoá. */
'use strict';
const APPV = '115';
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
const fP = (x, d) => isFinite(x) ? vnN(x * 100, d == null ? 1 : d) + '%' : '—';
const fVnd = v => { const a = Math.abs(v); return a >= 1000 ? vnN(v / 1000, 2) + ' tỷ' : vnN(v, 1) + ' tr' };
function fG(cur, prev) { if (!(prev > 0)) return cur > 0 ? '<span class="up">Mới</span>' : '—'; const g = cur / prev - 1; return `<span class="${g >= 0 ? 'up' : 'dn'}">${g >= 0 ? '▲' : '▼'}${vnN(Math.abs(g) * 100, Math.abs(g) < .1 ? 1 : 0)}%</span>` }
function fPts(d) { if (!isFinite(d)) return ''; return `<span class="${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'}${vnN(Math.abs(d) * 100, 1)} điểm</span>` }
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
const TABS = [['home', 'Tổng quan'], ['imp', 'Nhập khẩu'], ['set', 'Cài đặt']];
function shell(title, sub, body) { return `<header class="hdr"><div class="hrow"><div class="ttl">${title}</div></div>${sub ? `<div class="asof">${sub}</div>` : ''}</header><main class="main">${body}</main>
 <nav class="nav">${TABS.map(([k, l]) => `<button data-a="tab" data-v="${k}" class="${S.tab == k ? 'on' : ''}"><svg viewBox="0 0 24 24">${ICON[k]}</svg>${l}</button>`).join('')}</nav>` }
function render(keep) { const y = keep ? window.scrollY : 0; const a = $('#app');
  if (!S.d) { a.innerHTML = S.pkg || S.pend ? gateLock() : gateWelcome(); return }
  a.innerHTML = S.tab == 'imp' ? pageImp() : S.tab == 'set' ? pageSet() : pageHome(); window.scrollTo(0, y); onScroll() }
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
  return `<div class="cd"><h3>Bán ra DGW<span class="sp"></span><small>T1–T${mx}/${y}</small></h3><div class="kp" style="margin:0">
  <div class="k"><div class="l">Doanh thu ròng</div><div class="v num">${fVnd(r)}</div><div class="d">${ys.includes(y - 1) ? fG(r, r0) + ' cùng kỳ' : ''}</div></div>
  <div class="k"><div class="l">Số lượng bán ròng</div><div class="v num">${fQ(q)}</div><div class="d">${ys.includes(y - 1) ? fG(q, q0) + ' cùng kỳ' : ''}</div></div></div>
  <div class="empty" style="padding:10px 0 0">Chi tiết đại lý · sale · so sánh: bản tiếp theo</div></div>` }

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
  <div class="k gb"><div class="l">GIGABYTE</div><div class="v num" style="color:var(--gb)">${fV(a.g, P.met)}</div><div class="d">${b ? fG(a.g, b.g) + ' cùng kỳ' : ''}</div></div>
  <div class="k gb"><div class="l">Thị phần GIGABYTE</div><div class="v num">${fP(sh)}</div><div class="d">${rk ? 'Hạng ' + rk + ' ' : ''}${b ? fPts(sh - sh0) : ''}</div></div>
  <div class="k"><div class="l">Giá nhập TB thị trường</div><div class="v num">${isFinite(asp) ? fU(asp) : '—'}</div><div class="d">${gq ? 'GIGABYTE ' + fU(gu / gq) : ''}${b && isFinite(asp0) ? ' · ' + fG(asp, asp0) : ''}</div></div></div>`;
  h += trendCard(C, P, a, b, 'Theo tháng · ' + P.y);
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
function trendCard(C, P, a, b, title) { const ms = []; const mx = Math.max(C.maxM[P.y] || 12, P.m1); for (let m = 1; m <= mx; m++) ms.push(m);
  let top_ = 0; for (const m of ms) top_ = Math.max(top_, a.mv[m], b ? b.mv[m] : 0); top_ = top_ || 1;
  const bars = ms.map(m => { const v = a.mv[m], g = a.mg[m], on = m >= P.m0 && m <= P.m1; return `<button data-a="month" data-v="${m}" class="${on ? 'on' : 'off'}"><div class="col" style="height:${Math.max(1.5, v / top_ * 100)}%"><i style="height:${v ? g / v * 100 : 0}%"></i></div><span>${m}</span></button>` }).join('');
  return `<div class="cd"><h3>${title}<span class="sp"></span><small>chạm tháng để xem</small></h3><div class="trend">${bars}</div>
  <div class="leg"><span><i style="background:#2b5a80"></i>Thị trường</span><span><i style="background:var(--gb)"></i>Phần GIGABYTE</span>${P.m0 != 1 || P.m1 != (C.maxM[P.y] || 12) ? '<span>· mờ = ngoài kỳ đang xem</span>' : ''}</div></div>` }
function brandCard(C, P, a, b, n) { const L = topL(C, a.by.brand, 'brand'), mx = L.length ? L[0][1] : 1;
  const row = ([i, v], r) => { const nm = C.dict.brand[i], col = bCol(nm), v0 = b ? b.by.brand[i] : 0;
    return `<button class="br ${C.gb[i] ? 'me' : ''}" data-a="brand" data-v="${i}"><span class="rk">${r + 1}</span><span class="nm"><b><i class="dot" style="background:${col}"></i>${esc(nm || '(trống)')}</b><div class="bar"><i style="width:${v / mx * 100}%;background:${col}"></i></div></span><span class="rv num">${fV(v, P.met)}<small>${fP(v / a.v)}${b ? ' · ' + fG(v, v0) : ''}</small></span></button>` };
  return `<div class="cd" id="brands"><h3>Nhãn hàng<span class="sp"></span><small>${L.length} hãng</small></h3>${L.slice(0, n).map(row).join('')}${L.length > n ? `<button class="more" data-a="allbrands">Xem cả ${L.length} hãng ›</button>` : ''}</div>` }
function barCard(C, P, a, k, title, n, accent) { const L = topL(C, a.by[k], k), tot = a.v || 1; if (!L.length) return ''; const mx = L[0][1];
  return `<div class="cd"><h3>${title}<span class="sp"></span><small>${L.length}</small></h3>${L.slice(0, n).map(([i, v]) => `<div class="hb"><span class="n">${esc(C.dict[k][i])}</span><span class="t"><i style="width:${v / mx * 100}%;${accent ? 'background:' + accent : ''}"></i></span><span class="x num">${fP(v / tot, 0)}</span></div>`).join('')}</div>` }

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
  h += trendCard(C, P, a2, b, 'Theo tháng · ' + P.y).replace('<span><i style="background:var(--gb)"></i>Phần GIGABYTE</span>', '');
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

/* ---------- bảng trượt ---------- */
function openSheet(html, full) { $('#sheet').innerHTML = `<div class="bg" data-a="close"></div><div class="sh ${full ? 'full' : ''}">${full ? '' : '<div class="grab"></div>'}${html}</div>`; document.body.style.overflow = 'hidden' }
function closeSheet() { $('#sheet').innerHTML = ''; document.body.style.overflow = '' }
function perSheet() { const C = curC(), P = S.imp; let h = '<h2>Chọn kỳ</h2><div class="chips" style="margin-bottom:6px">' + C.years.map(y => `<button class="chip ${y == P.y ? 'on' : ''}" data-a="py" data-v="${y}">${y}</button>`).join('') + '</div>';
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
function load(d) { (d.imp || []).forEach(prepImp); S.d = d; if (!S.imp || !(d.imp || []).some(c => c.k == S.imp.cat)) S.imp = d.imp && d.imp.length ? impDefault(d.imp[0].k) : null; render() }

/* ---------- thao tác ---------- */
const ACT = {
  tab: v => { S.tab = v; closeSheet(); render() },
  pick, unlock,
  cat: v => { S.imp = impDefault(v); S.tab = 'imp'; render() },
  per: () => perSheet(), seg: () => segSheet(),
  met: v => { S.imp.met = v; render(true) },
  py: v => { const C = curC(), y = +v; S.imp.y = y; S.imp.m0 = 1; S.imp.m1 = C.maxM[y] || 12; closeSheet(); render(true) },
  pm: v => { const [a, b] = v.split('-').map(Number); S.imp.m0 = a; S.imp.m1 = b; closeSheet(); render(true) },
  ps: v => { S.imp.seg = +v; closeSheet(); render(true) },
  month: v => { const m = +v; if (S.imp.m0 == m && S.imp.m1 == m) { S.imp.m0 = 1; S.imp.m1 = curC().maxM[S.imp.y] || 12 } else { S.imp.m0 = S.imp.m1 = m } if ($('#sheet').innerHTML && S.det != null) { brandSheet(S.det); render(true); return } render(true) },
  brand: v => { S.det = +v; brandSheet(+v) },
  allbrands: () => allBrandsSheet(),
  close: () => { S.det = null; closeSheet() },
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
if ('serviceWorker' in navigator && location.protocol == 'https:' || location.hostname == 'localhost' || location.hostname == '127.0.0.1') {
  try { navigator.serviceWorker.register('sw.js').catch(() => { }); let r = 0; navigator.serviceWorker.addEventListener('controllerchange', () => { if (r++ == 0 && S.d) toast('Đã cập nhật app – mở lại để dùng bản mới', 4000) }) } catch (e) { } }
boot();
