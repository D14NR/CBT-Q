# Cara Hosting ke Cloudflare Pages

Aplikasi ini dibuat menggunakan React dan Vite. Hasil build ada di folder `dist` dan siap untuk di-hosting di Cloudflare Pages.

## Prasyarat

Pastikan Anda sudah melakukan build project:

```bash
npm run build
```

Perintah ini akan membuat folder `dist` yang berisi file website siap pakai.

## Metode 1: Upload Manual (Melalui Dashboard Cloudflare)

Cara ini paling mudah jika Anda tidak ingin menggunakan Git.

1.  Login ke [Dashboard Cloudflare](https://dash.cloudflare.com/).
2.  Pilih menu **Workers & Pages** di sidebar kiri.
3.  Klik tombol **Create Application** (Buat Aplikasi).
4.  Pilih tab **Pages**.
5.  Pilih **Upload Assets** (Upload Aset).
6.  Beri nama project Anda (contoh: `cbt-app`), lalu klik **Create Project**.
7.  Upload **folder `dist`** yang ada di komputer Anda ke halaman tersebut.
8.  Klik **Deploy Site**.

## Metode 2: Integrasi Git / GitHub (Direkomendasikan)

Cara ini otomatis melakukan update setiap kali Anda mengubah kode di GitHub.

1.  Upload kode project ini ke repository GitHub Anda.
2.  Login ke [Dashboard Cloudflare](https://dash.cloudflare.com/).
3.  Pilih menu **Workers & Pages**.
4.  Klik **Create Application**.
5.  Pilih tab **Pages**.
6.  Klik **Connect to Git**.
7.  Pilih repository GitHub Anda.
8.  Konfigurasi pengaturan build:
    *   **Framework preset**: Cari dan pilih `Vite` (atau `React` / `React (Vite)` jika tersedia).
        *   **JANGAN** pilih `VitePress` (ini berbeda).
    *   **Build command**: Pastikan isinya `npm run build`
    *   **Build output directory**: Pastikan isinya `dist`
9.  Klik **Save and Deploy**.

## Penting: Routing (Navigasi)

Saya sudah menambahkan file `_redirects` di dalam folder `public`. File ini penting agar saat pengguna me-refresh halaman (misalnya di halaman `/peserta`), tidak muncul error 404.

Cloudflare akan membaca file ini secara otomatis saat Anda melakukan deploy.
