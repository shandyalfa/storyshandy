# SPA Map Stories (WCAG + Map + Camera)

Proyek ini memenuhi kriteria asesmen:
- **SPA + Hash Routing** dengan **custom View Transition** dan arsitektur **MVP**.
- **Menampilkan data API** dalam **daftar** dan di **peta Leaflet** dengan **marker + popup**.
- **Interaktivitas peta**: filter kategori, sinkronisasi list ↔ peta, highlight marker aktif.
- **Multiple tile layers** + **layer control**.
- **Tambah data** melalui form (upload berkas), pilih koordinat **klik di peta**, dan **opsi kamera (MediaStream)**. Stream ditutup otomatis.
- **Aksesibilitas**: elemen semantik, label form, teks alternatif, **skip to content**, **keyboard-friendly**, **responsif** (375 / 768 / 1024px).

## Cara Menjalankan (Lokal)
> Memerlukan Node.js 18+

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Jalankan Mock API (untuk pengujian lokal)**
   ```bash
   npm run mock-api
   ```
   API akan aktif di `http://localhost:5174`. Anda bisa mengganti endpoint melalui field **API Base** di halaman Beranda.
3. **Jalankan Aplikasi**
   Buka terminal lain:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser.

> **Catatan**: Untuk submission ke API resmi (Story API) dari platform Anda, cukup set **API Base** (di bagian atas daftar pada halaman Beranda) ke URL Story API. Tidak perlu mengubah kode.

## Struktur Proyek Singkat
```
src/
  app.js               # bootstrap SPA + router + transition
  router.js            # hash router
  api.js               # adapter API (GET/POST, multipart upload)
  models/storyModel.js # Model
  presenters/          # Presenter untuk halaman
  views/               # View (Home/Story, Add, Auth)
api/mock-server.js     # Server Express mock API (GET/POST /stories)
index.html             # Semantik + skip link
styles.css             # Responsif + aksesibilitas
```

## Kriteria Penting yang Dipenuhi
- **Kriteria 1 (SPA & Transisi)**: Hash routing, View Transitions API (fallback tersedia), arsitektur MVP (Presenter + View + Model).
- **Kriteria 2 (Data & Peta)**: GET data dari API, render list + **Leaflet** marker + popup, **filter kategori**, **sinkronisasi** list ↔ peta, **multiple tile layers** (OSM/HOT/Dark).
- **Kriteria 3 (Tambah Data)**: Form multipart, **pilih koordinat via klik peta**, validasi, pesan sukses/error, **opsi kamera langsung**, stream ditutup.
- **Kriteria 4 (Aksesibilitas)**: Alt text, elemen semantik, label form, **skip to content**, **keyboard operable**, layout responsif.

## Catatan Tambahan
- Tile OSM tidak memerlukan API key. Jika Anda memakai provider lain, isikan kunci di `STUDENT.txt`.
- Pastikan Story API Anda mengizinkan CORS untuk domain dev (`http://localhost:5173`).

Selamat mengerjakan dan semoga lulus dengan nilai maksimal 🎉
