# PATCH Login + Perbaikan Kamera AR

Patch ini untuk proyek `ulartangga-profesi-main` versi integrasi Bahasa Arab/Supabase/AR sebelumnya.

1. Ekstrak ZIP patch.
2. Salin **isi patch** ke root repository GitHub yang memuat `package.json`, `src/`, dan `api/`.
3. Izinkan penimpaan sembilan file dengan path yang sama. Jangan mengganti seluruh folder proyek.
4. Commit dan push ke GitHub. Tunggu deployment Vercel selesai, atau pilih Redeploy jika diperlukan.
5. Buka alamat situs, masuk dengan akun, lalu uji tombol AR di HP.

Tidak ada query SQL baru. Folder `original/`, `src/data/questions.json`, `supabase/`, serta `api/` tidak termasuk patch.
Login kini membaca `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari koneksi otomatis Vercel–Supabase, dengan `VITE_*` tetap didukung. Tidak perlu menambahkan secret ke browser.

WebXR menggunakan DOM overlay transparan khusus. Bila gambar kamera masih hitam, tekan tombol **Kamera hitam? Tampilkan kamera** di layar AR. Mode ini adalah pratinjau video tanpa pelacakan posisi papan.
