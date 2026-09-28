# Ular Tangga Bahasa Arab 3D — akun, ruang online, AR

## Isi paket

- `src/` aplikasi Vite + TypeScript + PlayCanvas, 50 soal Bahasa Arab.
- `original/` dibuat pada tingkat ZIP (di luar folder aplikasi): salinan utuh semua berkas ZIP yang Anda kirim. Jangan edit jika ingin memulihkan versi awal.
- `supabase/01_schema.sql` → tabel profil, kelas, nilai, jawaban, badge.
- `supabase/02_access.sql` → profil otomatis, RLS dan hak akses.
- `supabase/03_rooms.sql` → ruang online, dadu server, aksi, Realtime.
- `supabase/04_roles_badges.sql` → peran, pemberian badge, ranking kelas, pengelolaan bank soal.
- `api/admin-users.ts` → pembuatan akun oleh admin di Vercel, dengan secret hanya di server.

## 1. Buat database Supabase

1. Buat proyek Supabase baru. Buka **SQL Editor → New query**.
2. Salin **seluruh isi** `supabase/01_schema.sql`, klik **Run**; tunggu berhasil.
3. Buka query baru, jalankan **seluruh isi** `supabase/02_access.sql`.
4. Buka query baru, jalankan **seluruh isi** `supabase/03_rooms.sql`.
5. Buka query baru, jalankan **seluruh isi** `supabase/04_roles_badges.sql`.

Jalankan keempat file sesuai urutan; **jangan tempel semuanya menjadi satu query**. SQL adalah instalasi awal satu kali pada proyek baru. Jika satu query gagal, selesaikan errornya sebelum menjalankan query berikutnya.

### Membuat admin pertama

1. Daftar dengan email melalui aplikasi yang telah terhubung dengan Supabase. Jika konfirmasi email aktif di Supabase, buka tautan konfirmasi terlebih dulu.
2. Di Supabase SQL Editor, lihat daftar akun:

```sql
select u.id, u.email, p.role from auth.users u
join public.profiles p on p.id = u.id order by u.created_at desc;
```

3. Salin **UUID akun Anda sendiri** dari hasil di atas, lalu jalankan satu kali:

```sql
update public.profiles set role = 'admin'
where id = 'GANTI_DENGAN_UUID_AKUN_ANDA';
```

4. Keluar lalu masuk lagi. Menu Admin tersedia. Jangan memakai email atau password dalam query pembaruan peran.

## 2. Hubungkan ke Vercel

Push **folder `ulartangga-profesi-main/` sebagai root repo** GitHub. Salinan `original/` di ZIP adalah arsip pribadi; jika ingin menyimpan di GitHub, lakukan sebagai folder terpisah.

Di Vercel, import repo dan set:

- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: **22.x** (sesuai `package.json`)

Atur Environment Variables Vercel (Development/Preview/Production sesuai kebutuhan):

| Nama | Sumber | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL | Terlihat di browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Terlihat di browser; RLS melindungi data |
| `SUPABASE_URL` | Supabase Project URL | Untuk Vercel Function |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Untuk verifikasi pengguna di server |
| `SUPABASE_SECRET_KEY` | Supabase secret key | **Hanya server; jangan awali `VITE_`** |

Di Supabase Auth → URL Configuration atur Site URL ke URL produksi Vercel dan tambahkan URL lokal/preview yang digunakan ke Redirect URLs. Deploy ulang setelah mengubah variabel lingkungan. **Jangan commit `.env`**.

Untuk lokal: salin `.env.example` menjadi `.env`, isi nilainya, `npm install`, `npm run dev`. Vite dev server tidak mengeksekusi `api/admin-users.ts`; fitur admin membuat akun diuji di deployment Vercel.

## 3. Alur penggunaan

1. Siswa daftar/login; guru dan admin dapat dibuat dari dashboard Admin setelah akun admin pertama disiapkan.
2. Admin membuat akun guru/siswa, membuat kelas, memilih guru, kemudian memasukkan siswa ke kelas. Admin dapat mengatur ulang kata sandi akun melalui dashboard; pengguna dapat meminta tautan pemulihan dari halaman login. Guru/admin dapat mengedit soal Bahasa Arab satu per satu di dashboard; format kunci mengikuti JSON (`0`, `true`, `[0,2]`, indeks mulai dari nol). Perubahan bank berlaku global pada permainan baru. Hindari mengedit soal saat ada pertandingan online berlangsung.
3. **Main lokal:** dua pion pada satu perangkat; hanya hasil pion A yang dihubungkan ke akun login.
4. **Main online:** pemain A membuat ruang dan membagikan kode 8 karakter; pemain B login di perangkat lain dan memasukkan kode. Pertandingan dimulai otomatis pada kedua perangkat; masing-masing mengendalikan pionnya. Dadu dan urutan giliran dikirim melalui Supabase; jawaban lawan disalin ke papan perangkat lain. Pertahankan kedua tab terbuka sampai permainan selesai.
5. Setiap akun melihat riwayat, badge dan peringkat kelas. Guru melihat hasil kelas yang diajar dan dapat ekspor CSV; admin mengelola akun dan kelas.
6. Tombol **Mulai AR** tersedia setelah game dimuat. Gunakan perangkat/browser dengan dukungan WebXR AR dan HTTPS. Papan muncul sekitar 1,25 m di depan kamera, dalam skala mini; panel soal tetap berupa tombol HTML. Bila WebXR tidak tersedia, gunakan tampilan 3D biasa.

## Hal yang perlu diketahui

- Logika dadu, ular, tangga, skoring dan jenis soal game asli dipertahankan. Perubahan di `src/main.ts`, dua file antarmuka dan satu baris `CameraController.ts` hanya menambahkan portal, nama zona Arab dan kemampuan XR; salinan persis sumber lama ada di `../original/`.
- Game berakhir setelah pemain menjawab Final Challenge di petak 50. Bank zona acak: soal ID `ARB-50` tidak selalu tampil persis di petak 50. Bank JSON bawaan dipakai bila belum ada bank pengganti di Supabase.
- Sesi yang ditutup sebelum kemenangan menyimpan progres terakhir; **belum ada pemulihan posisi permainan**. Ruang online juga tidak menyediakan join ulang/reconnect di tengah pertandingan atau penentuan hasil oleh server saat lawan keluar.
- Hasil dan jawaban berasal dari browser pemain. RLS membatasi akses dan pengiriman antarpengguna, tetapi hasil belum diverifikasi ulang di server. Jika digunakan untuk ujian bernilai tinggi, tambahkan validasi otoritatif server sebelum dipakai untuk penilaian resmi.
- AR memerlukan dukungan WebXR; belum ada deteksi marker atau peletakan papan melalui ketukan permukaan. Posisi papan relatif ke awal sesi XR.
- Fitur online dan admin API memerlukan proyek Supabase serta deployment Vercel aktif; tidak dapat diuji penuh hanya dengan build lokal.

## Pemeriksaan setelah deploy

1. Login dua akun siswa berbeda di dua perangkat/browsers.
2. Buat ruang, gabung dengan kode, lempar dadu bergantian dan jawab soal dari kedua sisi.
3. Pastikan akhir pertandingan, jawaban, badge, ranking kelas dan CSV terlihat sesuai peran.
4. Coba tombol AR pada HP yang mendukung WebXR melalui URL HTTPS Vercel.
