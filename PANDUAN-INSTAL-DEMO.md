# Patch v5 — admin awal dan demonstrasi siswa

Patch ini berisi **panduan dan tiga query pendek** untuk mengaktifkan admin `ari@gmail.com`. Patch ini tidak mengganti kode aplikasi, tidak membuat akun, dan tidak menyimpan kata sandi. Anda tidak perlu mengulang SQL 01–04 atau deploy ulang hanya untuk menjadikan akun admin.

## 1. Pastikan instalasi aplikasi selesai

- Proyek Ular Tangga Bahasa Arab sudah dideploy dari folder `ulartangga-profesi-main/` sebagai root repo di Vercel. Revisi login dan Bootstrap Icons (patch v3) serta perbaikan API TypeScript (patch v4) sudah diterapkan. Jika baru memakai proyek asli, pasang patch v2, v3, dan v4 secara berurutan dahulu lalu push/deploy.
- Database Supabase sudah menjalankan **`supabase/01_schema.sql`**, lalu **`02_access.sql`**, **`03_rooms.sql`**, dan **`04_roles_badges.sql`**, masing-masing di query terpisah. Jika empat file ini sudah pernah sukses pada proyek yang sama, lewati langkah tersebut.
- Proyek Vercel terhubung ke Supabase. Variabel publik untuk browser harus tersedia (`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, atau pasangan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`). Untuk tombol **Buat akun** di dashboard Admin, server juga memerlukan `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SECRET_KEY`. Jika variabel Vercel baru diperbaiki, redeploy agar nilainya dipakai.

## 2. Buat akun `ari@gmail.com`

1. Masuk ke **Supabase Dashboard → pilih proyek yang terhubung ke Vercel → Authentication → Users → Add user**.
2. Pilih pembuatan pengguna dengan email dan sandi jika pilihan itu tersedia; masukkan `ari@gmail.com` dan tentukan sandi Anda sendiri. Jika hanya ada opsi undangan, kirim undangan ke email itu, buka tautannya, lalu atur sandi. Selesaikan konfirmasi email bila diminta.
3. Akun ini adalah akun **aplikasi**, bukan login akun Supabase Dashboard. Jangan mengetik sandi ke SQL atau membagikannya kepada siswa.

## 3. Jadikan admin — jalankan satu query per tab

Buka **Supabase → SQL Editor → New query** pada **proyek yang sama**. Anda dapat membaca file SQL langsung dari ZIP; tidak wajib mengunggah file ini ke GitHub.

1. Salin seluruh isi `supabase/05a_cek_admin_ari.sql`, lalu klik **Run**. Hasil harus satu baris dengan `email = ari@gmail.com` dan `id` tidak kosong. Bila tidak ada baris, periksa akun dan proyek Supabase. Bila `id` kosong, pastikan `02_access.sql` sudah diterapkan pada proyek tersebut.
2. Di query baru, jalankan seluruh isi `supabase/05b_promosi_admin_ari.sql`. Hasil harus satu baris dengan `role = admin`. Jika hasilnya nol baris, jangan lanjut dulu; cek hasil langkah sebelumnya.
3. Di query baru, jalankan seluruh isi `supabase/05c_verifikasi_admin_ari.sql`. Pastikan `ari@gmail.com` memiliki `role = admin`.

Ketiga query ini pendek dan **dijalankan terpisah**, tidak digabung. Query promosi aman dijalankan ulang untuk akun yang sama jika diperlukan. Setelah berhasil, keluar dari aplikasi jika sedang login, kemudian masuk lagi memakai email `ari@gmail.com` dan sandi yang Anda tetapkan sendiri.

## 4. Siapkan demonstrasi kepada siswa

1. Masuk sebagai admin. Di bagian **Admin → Buat akun**, buat setidaknya dua akun siswa memakai email berbeda, nama siswa, dan sandi sementara yang hanya diberikan kepada pemilik akun. Pilih peran **Siswa**. Tidak ada menu daftar mandiri untuk siswa.
2. Buat kelas, misalnya **Kelas Demo**, dengan tahun ajaran yang Anda inginkan. Guru boleh belum dipilih. Gunakan **Masukkan siswa** untuk menambahkan masing-masing akun siswa ke kelas tersebut.
3. Di perangkat atau jendela browser terpisah, masuk sebagai siswa A dan siswa B. Uji **Main lokal** terlebih dahulu. Untuk demo dua pemain online, siswa A klik **Buat ruang online** dan membagikan kode ruang kepada siswa B; siswa B memilih **Gabung**. Kedua pemain harus tetap membuka permainannya sampai selesai.
4. Tunjukkan riwayat, badge, dan peringkat kelas setelah permainan selesai. Jika mendemonstrasikan AR pada ponsel melalui HTTPS, gunakan **Kamera hitam? Tampilkan kamera** saat WebXR tidak tersedia; pratinjau kamera tidak melacak permukaan.

## Jika tidak berhasil

- **Login ditolak:** pastikan email sudah terkonfirmasi, sandi benar, dan akun dibuat pada proyek Supabase yang terhubung ke Vercel.
- **Profil belum tersedia:** periksa keberhasilan `02_access.sql` dan hasil `05a_cek_admin_ari.sql`.
- **Menu Admin tidak muncul:** jalankan `05c_verifikasi_admin_ari.sql`, lalu keluar dan masuk kembali.
- **Buat akun siswa gagal:** pastikan Function `/api/admin-users` terdeploy tanpa error TypeScript dan variabel server `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, serta `SUPABASE_SECRET_KEY` tersedia di deployment yang aktif.
