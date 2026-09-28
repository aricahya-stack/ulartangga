import { defineConfig } from 'vite';

export default defineConfig({
  // Koneksi Vercel–Supabase otomatis memberi NEXT_PUBLIC_ untuk Next.js.
  // Hanya dua nilai publik yang dibaca dari awalan tersebut pada aplikasi Vite ini.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    target: 'es2022',
    sourcemap: true
  }
});
