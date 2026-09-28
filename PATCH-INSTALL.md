# Patch v3 — Login tanpa pendaftaran + Bootstrap Icons

Patch ini dipasang di atas proyek **ulartangga-profesi-main** yang sudah memakai patch v2 Login + AR (atau ZIP lengkap revisi sebelumnya). Isinya hanya file yang berubah. Tidak perlu mengulang query SQL jika 01–04 sudah berhasil dijalankan.

1. Ekstrak ZIP patch dan **salin seluruh isi ke root proyek `ulartangga-profesi-main/`**. Izinkan penimpaan file dengan nama yang sama; jangan meletakkan folder patch sebagai subfolder proyek.
2. Jalankan `npm install` pada root proyek. `bootstrap-icons` sudah tercantum di `package.json` dan `package-lock.json`.
3. Jalankan `npm run build` bila ingin memeriksa lokal, lalu commit/push perubahan. Vercel akan build dan deploy ulang (atau lakukan redeploy setelah push).
4. Admin pertama: di Supabase buka **Authentication → Users → Add user**, buat akun menggunakan email dan kata sandi Anda. Jalankan satu query UPDATE peran dalam `README-INSTALASI.md`, lalu masuk. Akun guru/siswa berikutnya dibuat melalui dashboard Admin. Tidak tersedia menu pendaftaran mandiri dan tidak ada username/password bawaan.

Setelah deploy, buka ulang halaman (hard refresh bila masih melihat login lama) dan masuk memakai email serta kata sandi akun yang telah dibuat.
