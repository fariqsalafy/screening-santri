# Screening Santri Baru — Tes Seleksi Tahfidz

Form input + rekap untuk screening/pendataan santri baru (tes seleksi tahfidz).
Project pribadi (bukan SMP ABBS). Satu file `index.html` (vanilla JS), tanpa build, tanpa server.

**Live:** https://fariqsalafy.github.io/screening-santri/

## Fitur
- **Form Santri** (3 kartu):
  1. Identitas — nama, asal sekolah/TPA, jumlah hafalan *(semua opsional)*
  2. Wawancara — 3 pertanyaan standar (target hafalan, saudara yg pahal many, riwayat TPA) dengan chip jawaban cepat + mengisi detail
  3. Tilawah — **3 kategori, semuanya wajib dinilai**:
     - **Juz 30** — melafalkan 1 surat penuh (pilih dari daftar prioritas / "Lainnya" tulis manual)
     - **Juz 28–29** — surat tidak penuh (+ ayat terakhir, opsional)
     - **Sambung Ayat** — penguji menyebut ayat, peserta menyambung (**wajib** mencatat ayat) 
     Masing-masing punya predikat: Sangat Baik / Baik / Cukup / Perlu Diulang + keterangan.
- **Rekap** — kartu statistik, pencarian & filter predikat, tabel: Nama | Asal | Hafalan | Wawancara (3 jawaban langsung) | Juz 30 | Juz 28–29 | Sambung Ayat (surat + badge predikat + keterangan) | Waktu. Klik baris → detail lengkap + hapus.
- **Export** — Excel `.xlsx` (SheetJS CDN; fallback CSV kalau library gagal dimuat).
- **Data** — tersimpan di **data.json** di root repo ini.

## Cara simpan data lintas-device
Halaman statis tidak bisa menulis repo, jadi penulisan memakai GitHub Contents API:

1. Buat Personal Access Token (fine-grained): https://github.com/settings/personal-access-tokens/new
   - Repository access: **Only** `fariqsalafy/screening-santri`
   - Permissions: **Contents → Read and write**
2. Di aplikasi: tombol **Sinkron GitHub** → tempel token → LyknCache.
3. Token disimpan di localStorage device (tidak ikut repo). Tiap Save/Hapus setelahnya otomatis merge + push ke `data.json`.

- Tanpa token = data hanya di device (localStorage), tidak muncul ke device lain.
- Token = akses penuh menulis data.json → jangan disebar ke luar tim penguji.
- Merge antar device pakai key `"_id" || "nama|waktu"`; bila dua device menulis baris sama hampir bersamaan, yang dikirim terakhir menang.

## Struktur data.json
```json
[{
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

## Konfigurasi di dalam kode (index.html)
- `SURAT` — daftar surat per kategori (urutan = prioritas; entri "Lainnya" memunculkan input manual)
- `PRED` — label predikat
- `CATS` — definisi 3 kategori (judul, apakah ada kolom ayat, wajib/tidak)
- `DEMO` — data demo (fallback bila data.json tak terbaca; key localStorage `ss_rows_v3`)
- `API` — repo target Contents API

## Local dev
Buka `index.html` langsung di browser, atau `python3 -m http.server` dari folder ini lalu buka localhost. Read data.json otomatis fallback ke raw.githubusercontent.com bila fetch lokal gagal.

## Rencana lanjutan (belum)
- [ ] Verifikasi multi-device nyata (2 HP, token sama, cek merge)
- [ ] Bila daftar pendaftar dari spreadsheet → import sebagai urutan form
- [ ] Kirim hasil ke orang tua via WA (opsional)
- [ ] Rotasi token / langkah aman bila token habis
