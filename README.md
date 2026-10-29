# Screening Santri Baru — Tes Seleksi Tahfidz

Form input + rekap untuk screening/pendataan santri baru (tes seleksi tahfidz).
Project pribadi (bukan SMP ABBS). Satu file `index.html` (vanilla JS), tanpa build, tanpa server.

**Live:** https://fariqsalafy.github.io/screening-santri/

## Fitur
- **Form Santri** (3 kartu):
  1. Identitas — **pilih Putra/Putri** dulu, baru **nama santri dari dropdown** (daftar `data murid baru.xlsx`); asal sekolah/TPA terisi otomatis dari nama terpilih; jumlah hafalan diisi manual
  2. Wawancara — 3 pertanyaan standar (target hafalan, saudara yg pahal many, riwayat TPA) dengan chip jawaban cepat + mengisi detail
  3. Tahfidz — **3 kategori, semuanya wajib dinilai**:
     - **Juz 30** — melafalkan 1 surat penuh (pilih dari daftar prioritas / "Lainnya" tulis manual)
     - **Juz 28–29** — surat tidak penuh (+ ayat terakhir, opsional)
     - **Sambung Ayat** — penguji menyebut ayat, peserta menyambung (**wajib** mencatat ayat) 
     Masing-masing punya predikat: Sangat Baik / Baik / Cukup / Perlu Diulang + keterangan.
- **Rekap** — kartu statistik, pencarian & filter predikat, tabel 16 kolom sesuai template (NO | Nama | Asal | Hafalan | Target | Saudara | TPA | 3 kategori × Surat/Predikat/Keterangan) dengan garis tiap sel; urutan terbaru di atas; hapus via tombol muncul saat hover di baris.
- **Rekap & Export** — tabel rekap mengikuti `template rekapan.xlsx` (header 2 tingkat identitas + wawancara + 3 kategori × Surat/Predikat/Ket, kolom NO, seluruh sel bergaris). Data terbaru selalu tampil di atas (`_t`) & tampilan otomatis menyegarkan via Sheets (interval 30 detik + saat tab dibuka kembali). Export Excel diisi langsung ke template (JSZip) — hasilnya sama dengan rekap web; fallback SheetJS (polos, merge & lebar kolom sama) lalu CSV.
- **Data** — database **Google Spreadsheet** via Apps Script Web App (`Code.gs`); `data.json` di root hanya sebagai cadangan arsip lama, **tidak dipakai lagi oleh aplikasi**.

## Cara simpan data lintas-device
Halaman statis tidak bisa menulis repo, jadi data disimpan di Google Spreadsheet lewat Apps Script:

1. Buat Spreadsheet → **Extensions → Apps Script** → tempel `Code.gs` → Run `setup()` → Deploy sebagai **Web app** (Execute as: *Me*, Access: *Anyone*).
2. URL `…/exec` sudah ditanam di `index.html` (`GAPI`). Bisa ditimpa lewat tombol **Sinkron Sheet → Simpan URL**.
3. Save/Hapus di aplikasi otomatis merge + tulis ke sheet `data` (25 kolom). Device lain tinggal buka URL yang sama; merge antar device pakai key `"_id" || "nama|waktu"` — yang dikirim terakhir menang.

- Tanpa koneksi/URL salah = data hanya di device (localStorage `ss_rows_v3`), muncul lagi saat Sheets terjangkau.
- Sheet kosong = tampil kosong (realtime dari Sheets). Data lama `data.json` **tidak** dimuat ulang otomatis — penghapusan bersifat benar-benar permanen.
- Siapa pun yang punya URL bisa menulis; kalau mau menutupnya, isi variabel `SECRET` di `Code.gs` dan sisipkan `?secret=…` / field `secret` di tiap request.

## Struktur data (baris santri)
```json
[{
  "_id": "opsional — key merge",
  "nama": "", "asal": "", "haf": "",
  "q1": {"c": "punya|belum|-", "t": "detail"},
  "q2": {"c": "ya|tidak|-", "t": "detail"},
  "q3": {"c": "ya|tidak|-", "t": "detail"},
  "tw": {
    "juz30":   {"surat": "", "ayat": "", "li": "Lainnya-manual?", "pred": "sangat|baik|cukup|ulang|", "ket": ""},
    "juz2829": {"surat": "", "ayat": "", "li": "", "pred": "", "ket": ""},
    "sambung": {"surat": "", "ayat": "", "li": "", "pred": "", "ket": ""}
  },
  "w": "tgl, jam"
}]
```
`li` = isi bila pilihan surat "Lainnya" (judul tulis manual). `ayat` khusus kategori juz2829 (opsional) & sambung (wajib).

Di Spreadsheet, tiap baris di-*flat*-kan jadi 25 kolom oleh `Code.gs` (header otomatis: `_id, nama, asal, haf, q1c, q1t, q2c, q2t, q3c, q3t, j30s, j30l, j30p, j30k, j28s, j28a, j28l, j28p, j28k, smbs, smba, smbl, smbp, smbk, w). Boleh dibaca/dilihat langsung di sheet; edit manual per baris juga ikut sinkron.

## Konfigurasi di dalam kode (index.html)
- `SURAT` — daftar surat per kategori (urutan = prioritas; entri "Lainnya" memunculkan input manual)
- `PRED` — label predikat
- `CATS` — definisi 3 kategori (judul, apakah ada kolom ayat, wajib/tidak)
- `MURID_PUTRA` / `MURID_PUTRI` — daftar murid baru (`{n: nama, s: asal sekolah}`) untuk dropdown identitas; sumber: `data murid baru.xlsx` (sheet Putra/Putri)
- `DEMO` — data demo (fallback bila Sheets & data.json tak terbaca; key localStorage `ss_rows_v3`)
- `GAPI` — URL Web App Apps Script (bisa ditimpa lewat localStorage `ss_api`, tombol Sinkron Sheet)

## Local dev
Buka `index.html` langsung di browser, atau `python3 -m http.server` dari folder ini lalu buka localhost. (Fitur fallback baca `data.json` dari raw.githubusercontent sudah dihapus — data hanya mengalir dari Spreadsheet.)

## Rencana lanjutan (belum)
- [ ] Verifikasi multi-device nyata (2 HP, URL sama, cek merge + hapus)
- [x] Daftar murid baru (`data murid baru.xlsx`) → dropdown nama (gender dulu, lalu nama; asal otomatis) ✓
- [ ] Kirim hasil ke orang tua via WA (opsional)
- [x] Migration dari data.json (token GitHub) → Google Sheets ✓
