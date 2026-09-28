> **Paket integrasi:** baca [README-INSTALASI.md](README-INSTALASI.md) untuk pemasangan Supabase, Vercel, multiplayer, dan AR. Dokumen di bawah adalah README game asli.

# Ular Tangga 3D — 4 Kompetensi Guru

**PlayCanvas Engine + Vite + TypeScript — v3.3.0**

Versi ini merupakan rebuild dari proyek Babylon sebelumnya. Mesin 3D ditulis ulang menggunakan PlayCanvas Engine standalone, sedangkan logika permainan dan bank soal 50 butir tetap dipertahankan.

## Fitur utama

- 1 vs 1, Player A dan Player B.
- Papan 3D 50 petak dengan lima zona kompetensi.
- Ubin kini **bertingkat / bersusun**: petak 1 paling rendah dan petak 50 paling tinggi untuk menonjolkan efek 3D perjalanan naik.
- Angka **1–50 menggunakan DOM world-to-screen overlay**, sehingga tidak bergantung pada tekstur petak dan tetap terbaca ketika kamera berpindah sudut.
- 5 tangga: 4→13, 9→18, 17→28, 26→36, 34→44.
- 5 ular: 15→6, 24→14, 32→21, 43→31, 48→37.
- 5 bonus: 7, 20, 29, 39, 46.
- Final Challenge di petak 50.
- 50 soal literasi: 20 PG, 10 benar/salah, 10 menjodohkan, 10 multi-answer.
- Tiap zona tepat 10 soal: 4 PG + 2 B/S + 2 matching + 2 multi-select.
- Soal diacak sesuai zona dan tidak diulang antarpemain selama bank zona masih tersedia.
- Ular procedural terdiri dari banyak segmen dan bergerak halus setiap frame.
- Tangga procedural 3D dengan rail, rung, metal caps, dan kini mengikuti perbedaan ketinggian ubin.
- Ditambahkan **favicon** khusus game.
- Pion berdiri, bukan bidak pipih.
- Material pion dapat dipilih: Glossy Plastic, Metallic, Matte, Marble.
- Material premium: walnut procedural, felt, metal trim, snake scales, marble.
- Dadu 3D procedural dengan pip fisik.
- Kamera sinematik dengan beberapa preset, drag-to-orbit, scroll-to-zoom, dan auto-focus pada dadu/pion/event.
- Pencahayaan key + cool fill + warm fill dan shadow-casting directional light.
- Sparkle effect procedural pada bonus, tangga berhasil, dan kemenangan.
- MediaPipe controller disiapkan sebagai fondasi, tetapi kamera tidak diminta secara otomatis.

## Zona materi

- 1–10: Pedagogik
- 11–20: Profesional
- 21–30: Kepribadian
- 31–40: Sosial
- 41–50: Integratif

## Menjalankan lokal

Gunakan Node.js 22.x.

```bash
npm install
npm run dev
```

Untuk build produksi:

```bash
npm run build
npm run preview
```

## Deploy ke Vercel

- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: **22.x**

`vercel.json` sudah disediakan.

## Arsitektur

```text
src/
├── game/
│   ├── Board.ts
│   ├── Dice.ts
│   ├── GameManager.ts
│   ├── Player.ts
│   ├── TileEvent.ts
│   └── TurnManager.ts
├── questions/
│   ├── QuestionEngine.ts
│   ├── SingleChoice.ts
│   ├── TrueFalse.ts
│   ├── Matching.ts
│   ├── MultiSelect.ts
│   └── types.ts
├── scene/
│   ├── GameScene.ts
│   ├── BoardFactory.ts
│   ├── CameraController.ts
│   ├── LadderFactory.ts
│   ├── Lighting.ts
│   ├── MaterialFactory.ts
│   ├── PawnFactory.ts
│   └── SnakeFactory.ts
├── effects/
│   ├── Animations.ts
│   ├── ParticleEffects.ts
│   ├── FinalTileEffects.ts
│   └── PostProcessing.ts
├── ui/
│   ├── HUD.ts
│   └── TileNumberOverlay.ts
├── vision/
│   └── MediaPipeController.ts
├── data/
│   └── questions.json
└── main.ts
```

## Mengapa ular tidak memakai GLB?

Ular perlu menghubungkan petak yang jaraknya berbeda-beda. Meregangkan satu GLB akan membuat kepala, tubuh, dan tekstur ikut terdistorsi. Pada v3.0 ular dibuat sebagai rangkaian segmen procedural sehingga panjangnya otomatis mengikuti pasangan petak, tubuh dapat berkelok, dan animasi dapat mengalir sepanjang badan.

## GLB

GLB tidak dibutuhkan untuk versi ini. `public/models/` tetap tersedia bila nanti ingin menambahkan aset dekorasi atau mengganti pion dengan model eksternal. Gunakan aset buatan sendiri, CC0, atau lisensi yang jelas mengizinkan penggunaan tersebut.

## Validasi yang dilakukan

- Bank soal: 50/50 tervalidasi.
- Setiap kompetensi: 10 soal.
- Tipe keseluruhan: 20 PG, 10 B/S, 10 matching, 10 multi-select.
- Seluruh 28 file TypeScript ditranspilasi untuk validasi sintaks tanpa error.
- API PlayCanvas yang dipakai untuk primitive `torus`, material blending/depth, dan light range/intensity dicek terhadap referensi Engine API 2.22.x.
- `npm install` penuh tidak selesai di container pembuatan karena akses registry mengalami timeout, sehingga build produksi tetap perlu dijalankan sekali di mesin lokal/Vercel.
- Versi dependency dikunci di `package.json`: PlayCanvas 2.22.2, Vite 8.3.0, TypeScript 5.8.3, MediaPipe Tasks Vision 1.0.1.


## Peningkatan sinematik v3.3.0

### Transisi naik level
- Pion menggunakan arc movement yang lebih tinggi saat selisih elevasi lebih besar.
- Ditambahkan squash-and-stretch saat melompat dan landing bounce saat menyentuh ubin.
- Orientasi pion mengikuti arah gerak agar perpindahan terasa seperti gerakan 3D, bukan teleportasi.
- Setiap pendaratan memunculkan pulse ring bercahaya dan shimmer vertikal singkat.
- Durasi gerak otomatis sedikit lebih panjang untuk lompatan elevasi besar seperti naik tangga.

### Petak 50 / Final Summit
- Petak 50 memiliki emissive yang paling kuat.
- Ditambahkan tiga halo emas beranimasi.
- Ditambahkan beacon cahaya vertikal transparan.
- Ditambahkan crown glow yang berputar di atas puncak.
- Omni light emas berdenyut secara real-time untuk memberi efek puncak/final.

### Kamera mendaki
- Kamera mengikuti posisi pion selama perpindahan antarpetak.
- Target kamera otomatis naik mengikuti elevasi papan.
- Radius kamera mengecil secara progresif saat mencapai petak yang lebih tinggi.
- Pitch dan yaw berubah halus selama lompatan agar kesan mendaki lebih terasa.
- Petak 50 memiliki final approach khusus sebelum pertanyaan Final Challenge.
- Jika Final Challenge benar, kamera melakukan victory orbit sebelum menampilkan layar kemenangan.
- Input orbit pengguna dikunci sementara selama shot sinematik supaya framing tidak rusak.

## Penyesuaian v3.3.0
- Arah kamera overview diubah agar melihat papan **dari angka rendah ke angka tinggi**, sehingga rasa perjalanan naik ke puncak lebih kuat.
- Scene dibuat **lebih cerah** melalui peningkatan exposure, ambient light, key light, fill light, dan summit glow.
- Clear color kamera juga dibuat sedikit lebih terang agar keseluruhan scene terasa lebih hidup.

## Upgrade v3.3.0
- UI soal didesain ulang menjadi panel modern dengan event emblem, nama pemain, nomor petak, zona, jenis soal, dan progress bank soal per zona.
- Stimulus, tantangan, opsi jawaban, kunci jawaban, dan pembahasan memiliki hierarchy visual yang lebih jelas.
- Dadu 3D memakai tiga bounce yang mengecil, drift ringan, squash/stretch saat impact, final orientation yang sesuai hasil angka, serta impact ring.
- Event tangga: flash emas, rising rings, sparkle, dan camera focus.
- Event ular salah: warning flash merah, warning rings, temporary red omni light, lalu animasi turun.
- Event ular berhasil dihindari: escape flash hijau dan sparkle.
- Bonus tile: flash biru, rising rings, dan sparkle.
- Seluruh fitur v3.2.1 tetap dipertahankan: kamera dari angka rendah ke tinggi, scene lebih cerah, papan bertingkat, final summit FX, material pion, dan favicon.
