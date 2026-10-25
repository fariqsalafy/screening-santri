/**
 * Screening Santri — backend Google Spreadsheet (Apps Script Web App)
 *
 * Cara pasang:
 * 1. Buat Spreadsheet baru di sheets.google.com (jadi database-nya).
 * 2. Extensions → Apps Script → hapus isi, tempel file ini → Save.
 * 3. Jalankan fungsi setup() sekali (bila diminta, izinkan semua auth).
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy Web app URL (…/exec) → dipakai di index.html sebagai GAPI.
 *
 * API (dipakai client):
 *   GET  ?action=ping                → {ok:true}
 *   GET  ?action=list                → {ok:true, rows:[...]}   (format sama dgn data.json)
 *   POST {action:'merge', rows:[…]}  → merge lalu {ok:true, rows:[...]}
 *   POST {action:'delete', _id / nama, w} → hapus lalu {ok:true, rows:[...]}
 * Key merge: _id || "nama|waktu" — yang dikirim terakhir menang (sama dgn client).
 * JSONP: tambahkan &callback=nama di GET (fallback kalau CORS rewel).
 *
 * Opsional: isi SECRET dgn teks rahasia supaya semua request wajib
 * bawa secret=… (GET param / field body). Kosongkan untuk menonaktifkan.
 */

const SHEET_NAME = 'data';
const TOMB_NAME = 'deleted';
const SECRET = '';

const HEADERS = [
  '_id', 'nama', 'asal', 'haf',
  'q1c', 'q1t', 'q2c', 'q2t', 'q3c', 'q3t',
  'j30s', 'j30l', 'j30p', 'j30k',
  'j28s', 'j28a', 'j28l', 'j28p', 'j28k',
  'smbs', 'smba', 'smbl', 'smbp', 'smbk',
  'w', '_t'
];

/** Jalankan sekali setelah paste, untuk authorize + bikin sheet. */
function setup() {
  const sh = ss_();
  return 'OK — sheet "' + SHEET_NAME + '" siap (' + HEADERS.length + ' kolom)';
}

function doGet(e) {
  try {
    const q = (e && e.parameter) || {};
    const bad = (q.action !== 'ping') ? checkSecret_(q) : null;
    if (bad) return send_(bad, q.callback);
    let res;
    if (!q.action || q.action === 'list') res = { ok: true, rows: readRows_() };
    else if (q.action === 'ping') res = { ok: true, name: 'screening-santri-gas', time: new Date().toISOString() };
    else res = { ok: false, error: 'action tidak dikenal: ' + q.action };
    return send_(res, q.callback);
  } catch (err) {
    return send_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = parseBody_(e);
    const bad = checkSecret_({ secret: body.secret || ((e && e.parameter && e.parameter.secret) || '') });
    if (bad) return send_(bad);
    if (body.action === 'merge') return send_(mergeRows_(body.rows || []));
    if (body.action === 'delete') return send_(deleteRow_(body));
    if (body.action === 'list') return send_({ ok: true, rows: readRows_() });
    return send_({ ok: false, error: 'action tidak dikenal: ' + (body.action || '(kosong)') });
  } catch (err) {
    return send_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ——— sheet ————————————————————————————————————— */

function ss_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  } else {
    // self-heal: jika skema kolom berubah (mis. penambahan kolom _t), perbarui baris header
    const cur = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('\u0001');
    if (cur !== HEADERS.join('\u0001')) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    }
  }
  return sh;
}

function readRows_() {
  const sh = ss_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const vals = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return vals.filter(r => String(r[1]).trim() || String(r[HEADERS.length - 1]).trim()).map(rowToObj_);
}

function writeRows_(objs) {
  const sh = ss_();
  const n = Math.max(sh.getLastRow() - 1, 0);
  if (n > 0) sh.getRange(2, 1, n, HEADERS.length).clearContent();
  if (objs.length) {
    const vals = objs.map(objToRow_);
    sh.getRange(2, 1, vals.length, HEADERS.length).setValues(vals);
  }
}

/* ——— mapping objek ⇄ kolom ——————————————————————— */

function rowToObj_(r) {
  const s = i => String(r[i] == null ? '' : r[i]);
  return {
    _id: s(0),
    nama: s(1), asal: s(2), haf: s(3),
    q1: { c: s(4), t: s(5) },
    q2: { c: s(6), t: s(7) },
    q3: { c: s(8), t: s(9) },
    tw: {
      juz30:   { surat: s(10), ayat: '', li: s(11), pred: s(12), ket: s(13) },
      juz2829: { surat: s(14), ayat: s(15), li: s(16), pred: s(17), ket: s(18) },
      sambung: { surat: s(19), ayat: s(20), li: s(21), pred: s(22), ket: s(23) }
    },
    w: s(24),
    _t: s(25)
  };
}

function objToRow_(o) {
  const g = (a, k) => (a && a[k] != null) ? String(a[k]) : '';
  return [
    g(o, '_id'),
    g(o, 'nama'), g(o, 'asal'), g(o, 'haf'),
    g(o.q1, 'c'), g(o.q1, 't'), g(o.q2, 'c'), g(o.q2, 't'), g(o.q3, 'c'), g(o.q3, 't'),
    g(o.tw && o.tw.juz30, 'surat'), g(o.tw && o.tw.juz30, 'li'),
    g(o.tw && o.tw.juz30, 'pred'), g(o.tw && o.tw.juz30, 'ket'),
    g(o.tw && o.tw.juz2829, 'surat'), g(o.tw && o.tw.juz2829, 'ayat'),
    g(o.tw && o.tw.juz2829, 'li'), g(o.tw && o.tw.juz2829, 'pred'), g(o.tw && o.tw.juz2829, 'ket'),
    g(o.tw && o.tw.sambung, 'surat'), g(o.tw && o.tw.sambung, 'ayat'),
    g(o.tw && o.tw.sambung, 'li'), g(o.tw && o.tw.sambung, 'pred'), g(o.tw && o.tw.sambung, 'ket'),
    g(o, 'w'),
    g(o, '_t')
  ];
}

/* ——— operasi data ———————————————————————————————— */

function keyOf_(r) {
  return r._id ? 'i:' + r._id : 'k:' + (r.nama || '') + '|' + (r.w || '');
}

function mergeRows_(incoming) {
  const tomb = tombs_();
  const objs = readRows_().filter(o => !tomb['t:' + keyOf_(o)]);
  const map = {};
  objs.forEach((o, i) => { map[keyOf_(o)] = i; });
  incoming.forEach(o => {
    const k = keyOf_(o);
    if (tomb['t:' + k]) return;           // sudah dihapus di tempat lain — jangan hidupkan ulang
    if (map[k] != null) objs[map[k]] = o;
    else { map[k] = objs.length; objs.push(o); }
  });
  writeRows_(objs);
  return { ok: true, rows: readRows_() };
}

function deleteRow_(body) {
  const k = body._id ? 'i:' + body._id
    : (body.nama || body.w) ? 'k:' + (body.nama || '') + '|' + (body.w || '') : null;
  if (!k) return { ok: false, error: 'kirim _id, atau nama & w' };
  const objs = readRows_().filter(o => keyOf_(o) !== k);
  writeRows_(objs);
  tombAdd_(k);                             // catat sebagai dihapus — cegah restore dari salinan device lain
  return { ok: true, rows: readRows_() };
}

/* catat key yang dihapus pada sheet "deleted" */
function tombs_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(TOMB_NAME);
  if (!sh || sh.getLastRow() < 2) return {};
  const m = {};
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(r => {
    const v = String(r[0]).trim();
    if (v) m['t:' + v] = 1;
  });
  return m;
}

function tombAdd_(k) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(TOMB_NAME);
  if (!sh) {
    sh = ss.insertSheet(TOMB_NAME);
    sh.appendRow(['key', 'at']);
  }
  sh.appendRow([k, new Date().toISOString()]);
}

/* ——— util request/response ——————————————————————— */

function parseBody_(e) {
  try {
    if (e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  } catch (err) { throw new Error('body bukan JSON valid'); }
  return (e && e.parameter) || {};
}

function checkSecret_(src) {
  if (!SECRET) return null;
  return (src && src.secret) === SECRET ? null : { ok: false, error: 'secret salah' };
}

function send_(obj, cb) {
  if (cb && /^[A-Za-z_$][\w$]*$/.test(cb)) {
    return ContentService.createTextOutput(
      cb + '(' + JSON.stringify(obj) + ')'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
