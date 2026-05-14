# Panduan Membuat APK JamuKu

Aplikasi ini sudah dikonfigurasi menggunakan **Capacitor** agar bisa diubah menjadi aplikasi Android (APK). Karena proses pembuatan APK (Build) membutuhkan **Android Studio** yang terinstall di komputer Anda, berikut adalah langkah-langkahnya:

## 1. Persiapan di Komputer Anda
Pastikan Anda sudah menginstall:
- **Node.js**
- **Android Studio** (beserta Android SDK)

## 2. Download Source Code
1. Klik menu **Settings** (ikon gerigi) di pojok kiri bawah AI Studio.
2. Pilih **Export as ZIP** atau **Export to GitHub**.
3. Ekstrak file ZIP tersebut di komputer Anda.

## 3. Proses Build
Buka terminal/command prompt di folder hasil ekstrak tadi, lalu jalankan perintah:

```bash
# 1. Install semua dependency
npm install

# 2. Build aplikasi web dan sinkronisasi ke folder Android
npm run mobile:build

# 3. Buka project di Android Studio
npm run mobile:open
```

## 4. Membuat APK di Android Studio
Setelah Android Studio terbuka:
1. Tunggu proses **Gradle Sync** selesai.
2. Klik menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Setelah selesai, akan muncul notifikasi "APK generated successfully". Klik **locate** untuk mengambil file `.apk` nya.

Sekarang file tersebut bisa Anda kirim ke HP Android dan di-install! 🍃
