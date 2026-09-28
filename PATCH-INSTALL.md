# Patch v4 — perbaikan error TypeScript pada Vercel API

Pasang patch ini di atas proyek yang sudah menerima patch v3 (atau setidaknya proyek dengan halaman login Bootstrap Icons). Ekstrak isinya langsung ke root repo `ulartangga-profesi-main/`, timpa tiga file yang ada, lalu commit dan push ke GitHub agar Vercel melakukan deploy ulang.

Perubahan: menambahkan `@types/node` untuk variabel `process.env` di `api/admin-users.ts`, serta memasukkan folder `api` ke pemeriksaan TypeScript saat `npm run build`. Vercel akan menginstal dependensi baru dari lockfile. Tidak perlu mengulang SQL Supabase.

Peringatan Vercel bahwa Node 22.x mengesampingkan Project Settings 24.x hanya menunjukkan pilihan versi; proyek ini menetapkan Node 22.x. Peringatan ukuran bundle dan `node:worker_threads` tidak menghentikan build.

Setelah redeploy, uji pembuatan akun lewat dashboard Admin; keberhasilan build saja belum menguji akses Supabase atau fungsi API secara langsung.
