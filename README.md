<div align="center">

# 🎙️ Transkrip

**Local AI-Powered Audio & Video Transcription Desktop App**

*Transcribe audio and video files privately on your own machine — no cloud, no uploads, no data leaks.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)]()
[![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)]()
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)]()

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Building for Production](#-building-for-production)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🧭 Overview

**Transkrip** is a cross-platform desktop application that converts speech from audio and video files into accurate written text — entirely **on-device**. Built on top of OpenAI Whisper running locally, Transkrip is designed for journalists, researchers, content creators, and enterprises who need **privacy-first** transcription without sending sensitive media to third-party servers.

---

## ✨ Features

- 🔒 **100% Local Processing** — All transcription runs on your device; no network required after setup.
- 🎧 **Multi-Format Support** — Accepts common audio and video formats (MP3, WAV, M4A, MP4, MOV, etc.).
- 🌐 **Multilingual** — Leverages Whisper models capable of transcribing and translating many languages.
- 📝 **Rich Export Options** — Export transcripts to `.txt`, `.docx`, and `.pdf`.
- 🗂️ **Transcription History** — Persistent local history powered by SQLite (`better-sqlite3`).
- ⚙️ **Customizable Settings** — Choose model size, language, and output preferences.
- 🖥️ **Native Desktop UX** — Built with Electron for macOS, Windows, and Linux.
- ⚡ **Modern UI** — Clean, responsive interface built with React 19 and Tailwind CSS 4.

---

## 🖼️ Screenshots

> _Add screenshots in the `docs/screenshots/` directory and reference them here._

| Upload | Transcription | History |
| :---: | :---: | :---: |
| _Coming soon_ | _Coming soon_ | _Coming soon_ |

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| 🖼️ **Frontend** | React 19, TypeScript 6, Tailwind CSS 4, Vite 8 |
| 🖥️ **Desktop Shell** | Electron 41 |
| 🗄️ **Database** | better-sqlite3 |
| 🧠 **AI Engine** | OpenAI Whisper (local) |
| 📄 **Document Export** | docx, jspdf, file-saver |
| 📦 **Packaging** | electron-builder |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│            Renderer (React + Vite)          │
│  UI · UploadZone · Settings · HistoryList   │
└────────────────────┬────────────────────────┘
                     │ IPC (preload)
┌────────────────────▼────────────────────────┐
│             Main Process (Electron)         │
│  whisper.ts · database.ts · main.ts         │
└────────────────────┬────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
  Whisper CLI    SQLite DB      File System
```

---

## 📥 Installation Guide

Transkrip membutuhkan dua komponen: **(1) aplikasi desktop-nya** dan **(2) dependency sistem** (`ffmpeg` + `whisper.cpp`). Tanpa dependency sistem, aplikasi akan tetap terbuka tapi tidak bisa melakukan transkripsi.

### 🔧 Step 0 — Install System Dependencies (Wajib)

Semua metode instalasi membutuhkan ini. Buka **Terminal** dan jalankan:

#### macOS (Homebrew)

```bash
# Install Homebrew dulu kalau belum ada:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install ffmpeg (untuk konversi audio/video)
brew install ffmpeg

# Install whisper.cpp (engine transkripsi AI)
brew install whisper-cpp
```

Verifikasi instalasi:
```bash
ffmpeg -version        # harus menampilkan versi
whisper-cli --help     # harus menampilkan help menu
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y ffmpeg build-essential cmake git

# Build whisper.cpp dari source
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp && make && sudo cp main /usr/local/bin/whisper-cli
```

#### Windows

1. Install [ffmpeg](https://www.gyan.dev/ffmpeg/builds/) → extract → tambahkan `bin/` ke PATH
2. Download [whisper.cpp Windows build](https://github.com/ggerganov/whisper.cpp/releases) → letakkan di PATH

---

### 🅰️ Metode A — Install dari File DMG (Recommended untuk macOS)

Paling mudah. Cocok untuk end-user yang tidak mau compile.

#### Langkah 1 — Download

Buka halaman Release di GitHub:

👉 **https://github.com/romizone/transkrip/releases/latest**

Download file:
- 🍎 **macOS Apple Silicon (M1/M2/M3/M4):** `Transkrip-1.0.0-arm64.dmg`

#### Langkah 2 — Install via Finder (Cara GUI)

1. **Double-click** file `Transkrip-1.0.0-arm64.dmg` di folder Downloads
2. Jendela DMG akan terbuka — **drag icon Transkrip** ke folder `Applications`
3. Tunggu proses copy selesai
4. **Eject DMG**: klik kanan icon DMG di Finder sidebar → Eject

#### Langkah 3 — Bypass Gatekeeper (WAJIB)

> ⚠️ Saat pertama dibuka, macOS akan menampilkan error **"Transkrip is damaged and can't be opened"**. Ini BUKAN bug. Penyebabnya: DMG di-distribute unsigned (tanpa Apple Developer ID $99/tahun). Solusinya gampang.

Buka **Terminal** (`Cmd+Space` → ketik "Terminal") dan jalankan:

```bash
xattr -cr /Applications/Transkrip.app
```

Selesai. Sekarang buka Transkrip dari Launchpad atau Applications folder — akan berjalan normal.

#### Langkah 3 (Alternatif) — Install via Terminal (Lebih Cepat)

Kalau kamu nyaman dengan Terminal, satu blok command ini menggantikan semua langkah di atas:

```bash
# Mount DMG, copy ke Applications, bypass Gatekeeper, unmount, lalu buka
hdiutil attach ~/Downloads/Transkrip-1.0.0-arm64.dmg && \
cp -R "/Volumes/Transkrip 1.0.0-arm64/Transkrip.app" /Applications/ && \
xattr -cr /Applications/Transkrip.app && \
hdiutil detach "/Volumes/Transkrip 1.0.0-arm64" && \
open /Applications/Transkrip.app
```

Copy-paste seluruh blok ke Terminal → tekan Enter → aplikasi langsung terbuka. ✨

---

### 🅱️ Metode B — Compile dari Source Code (Developer)

Cocok untuk developer yang ingin modifikasi kode atau build untuk platform selain macOS ARM64.

#### Prasyarat

- **Node.js** ≥ 18 ([download](https://nodejs.org/))
- **npm** ≥ 9 (bundled dengan Node.js)
- **Git**
- System dependencies dari **Step 0** di atas

#### Langkah 1 — Clone Repository

```bash
git clone https://github.com/romizone/transkrip.git
cd transkrip
```

#### Langkah 2 — Install Node Dependencies

```bash
npm install
```

Proses ini akan:
- Download semua library (Electron, React, dll)
- Compile `better-sqlite3` native module untuk Electron (via postinstall)
- Butuh 1–3 menit tergantung koneksi

#### Langkah 3a — Jalankan dalam Mode Development

Untuk testing / development dengan hot-reload:

```bash
npm run dev
```

Ini akan:
1. Compile TypeScript Electron main process
2. Start Vite dev server di `http://localhost:5173`
3. Launch Electron window yang menampilkan React app

Tutup app untuk stop dev server.

#### Langkah 3b — Build Installer DMG/EXE/AppImage

Untuk menghasilkan installer yang bisa di-distribute:

```bash
npm run dist
```

Hasil build ada di folder `release/`:
- 🍎 **macOS:** `release/Transkrip-1.0.0-arm64.dmg`
- 🪟 **Windows:** `release/Transkrip Setup 1.0.0.exe` (jalankan di Windows)
- 🐧 **Linux:** `release/Transkrip-1.0.0.AppImage` (jalankan di Linux)

> 💡 Build hanya bisa menghasilkan installer untuk OS tempat kamu build. Untuk build macOS DMG, kamu harus build di Mac.

Setelah `npm run dist` selesai, install DMG-nya mengikuti **Metode A — Langkah 2 & 3** di atas.

---

## 🎯 Cara Menggunakan Aplikasi

### 1️⃣ Pertama Kali Buka

Saat pertama kali dibuka, Transkrip akan:
- Membuat database lokal di `~/Library/Application Support/Transkrip/` (macOS)
- Menampilkan halaman **Upload** sebagai default

### 2️⃣ Transkripsi File Pertama

#### Langkah demi langkah:

1. **Pilih file audio/video** — dua cara:
   - Klik area drop zone → file picker terbuka → pilih file
   - Drag file langsung dari Finder/Explorer ke drop zone

   Format yang didukung: `MP3, MP4, WAV, OGG, M4A, WEBM, FLAC, AAC, MOV, MKV, AVI, WMV, OPUS, WMA`

2. **Pilih bahasa** di dropdown **Language**:
   - `Auto Detect` — Whisper akan deteksi otomatis (recommended)
   - Atau pilih manual: Indonesian, English, Japanese, dll (15 bahasa tersedia)

3. **Pilih model AI** di dropdown **Model**:

   | Model | Ukuran | Kecepatan | Akurasi |
   |---|---|---|---|
   | **Tiny** | ~75 MB | ⚡⚡⚡⚡⚡ | ⭐⭐ |
   | **Base** | ~142 MB | ⚡⚡⚡⚡ | ⭐⭐⭐ (default) |
   | **Small** | ~466 MB | ⚡⚡⚡ | ⭐⭐⭐⭐ |
   | **Medium** | ~1.5 GB | ⚡⚡ | ⭐⭐⭐⭐⭐ |

   > 📥 Model akan **otomatis di-download** saat pertama kali digunakan. Download sekali, simpan di `~/Library/Application Support/Transkrip/models/`. Tidak perlu download ulang.

4. **(Opsional) Centang "Include timestamps"** — menambahkan waktu `[00:12]` di setiap segmen teks.

5. Klik **Start Transcription**.

6. Tunggu proses:
   - **Downloading model** (hanya saat pertama pakai model tertentu)
   - **Transcribing** — progress bar akan update secara real-time
   - Durasi transkripsi tergantung panjang audio & model yang dipilih. Rule of thumb: Base model ≈ 0.3× durasi audio di Apple Silicon.

### 3️⃣ Lihat & Edit Hasil Transkripsi

Setelah selesai, kamu otomatis di-redirect ke halaman **Transcription View** yang menampilkan:
- Teks lengkap dengan timestamp (kalau dicentang)
- Tombol Export (TXT, DOCX, PDF, SRT)
- Tombol Edit

### 4️⃣ Export Hasil

Klik tombol export sesuai format yang diinginkan:

| Format | Untuk apa |
|---|---|
| 📄 **TXT** | Plain text, cocok untuk copy-paste |
| 📝 **DOCX** | Word document, untuk editing lebih lanjut |
| 📕 **PDF** | Dokumen final, siap cetak / share |
| 🎬 **SRT** | Subtitle file, untuk video editing |

File akan di-download ke folder Downloads default OS-mu.

### 5️⃣ Kelola Riwayat

Klik **History** di sidebar kiri untuk melihat semua transkripsi sebelumnya. Dari sini kamu bisa:
- 👁️ **View** — buka kembali hasil lama
- 🗑️ **Delete** — hapus dari database lokal

Semua data tersimpan lokal — tidak pernah dikirim ke server manapun.

---

## 🧯 Troubleshooting

| Masalah | Penyebab | Solusi |
|---|---|---|
| `"Transkrip" is damaged and can't be opened` | Gatekeeper quarantine | `xattr -cr /Applications/Transkrip.app` |
| `whisper-cpp not found` | Belum install whisper.cpp | `brew install whisper-cpp` |
| `ffmpeg not found` | Belum install ffmpeg | `brew install ffmpeg` |
| Transkripsi sangat lambat | Model terlalu besar | Ganti ke Base atau Small |
| Model download gagal | Koneksi internet lambat | Retry — model re-download atomic, tidak korup |
| Drag & drop tidak bekerja | Electron 32+ webUtils issue | Gunakan file picker (klik drop zone) |
| Teks hasil jelek | Model terlalu kecil / bahasa salah | Pakai Medium + pilih bahasa manual |

---

## 📜 Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite + Electron in development mode |
| `npm run build` | Build both Electron main process and renderer |
| `npm run build:electron` | Compile Electron main-process TypeScript |
| `npm run build:renderer` | Build the React renderer with Vite |
| `npm run dist` | Package the app with electron-builder |

---

## 📁 Project Structure

```
transkrip/
├── electron/              # Electron main process
│   ├── main.ts            # App entry point
│   ├── preload.ts         # Secure IPC bridge
│   ├── whisper.ts         # Whisper integration
│   └── database.ts        # SQLite persistence layer
├── src/                   # React renderer
│   ├── components/        # UI components
│   │   ├── UploadZone.tsx
│   │   ├── TranscriptionView.tsx
│   │   ├── HistoryList.tsx
│   │   ├── Settings.tsx
│   │   └── Sidebar.tsx
│   ├── lib/               # Utilities (export, helpers)
│   ├── styles/            # Global styles
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.electron.json
└── vite.config.ts
```

---

## ⚙️ Configuration

App settings are managed via the in-app **Settings** panel and persisted to the local SQLite database. Configurable options include:

- 🧠 **Model size** — tiny, base, small, medium, large
- 🌍 **Language** — auto-detect or force a specific language
- 📂 **Default output folder**
- 📝 **Export format** — TXT, DOCX, PDF

---

## 📦 Building for Production

```bash
# Build and package the desktop app
npm run dist
```

The installer will be output to the `release/` directory.

Supported targets:

- 🍎 **macOS** — `.dmg`
- 🪟 **Windows** — `.exe` (NSIS)
- 🐧 **Linux** — `.AppImage`

---

## 🗺️ Roadmap

- [ ] 🎚️ Real-time microphone transcription
- [ ] 👥 Speaker diarization
- [ ] ✂️ In-app transcript editor with timestamps
- [ ] ☁️ Optional cloud sync (opt-in)
- [ ] 🌐 Additional export formats (SRT, VTT)
- [ ] 🧪 Unit & E2E test coverage

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔁 Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and ensure code is formatted before committing.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 📬 Contact

**Romi Nur Ismanto**
🔗 GitHub: [@romizone](https://github.com/romizone)
📦 Project: [github.com/romizone/transkrip](https://github.com/romizone/transkrip)

---

<div align="center">

**⭐ If you find this project useful, please consider giving it a star!**

Made with ❤️ and ☕ by [romizone](https://github.com/romizone)

</div>
