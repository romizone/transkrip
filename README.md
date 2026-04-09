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

Transkrip requires two components: **(1) the desktop app itself** and **(2) system dependencies** (`ffmpeg` + `whisper.cpp`). Without the system dependencies, the app will still open but won't be able to perform transcription.

### 🔧 Step 0 — Install System Dependencies (Required)

All installation methods require this. Open **Terminal** and run:

#### macOS (Homebrew)

```bash
# Install Homebrew first if you don't have it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install ffmpeg (for audio/video conversion)
brew install ffmpeg

# Install whisper.cpp (the AI transcription engine)
brew install whisper-cpp
```

Verify the installation:
```bash
ffmpeg -version        # should print a version
whisper-cli --help     # should print the help menu
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y ffmpeg build-essential cmake git

# Build whisper.cpp from source
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp && make && sudo cp main /usr/local/bin/whisper-cli
```

#### Windows

1. Install [ffmpeg](https://www.gyan.dev/ffmpeg/builds/) → extract → add the `bin/` folder to PATH
2. Download a [whisper.cpp Windows build](https://github.com/ggerganov/whisper.cpp/releases) → place it on PATH

---

### 🅰️ Method A — Install from the DMG (Recommended for macOS)

The easiest route. Best for end users who don't want to compile anything.

#### Step 1 — Download

Open the latest release page on GitHub:

👉 **https://github.com/romizone/transkrip/releases/latest**

Download:
- 🍎 **macOS Apple Silicon (M1/M2/M3/M4):** `Transkrip-1.0.0-arm64.dmg`

#### Step 2 — Install via Finder (GUI)

1. **Double-click** `Transkrip-1.0.0-arm64.dmg` in your Downloads folder
2. The DMG window opens — **drag the Transkrip icon** into the `Applications` folder
3. Wait for the copy to finish
4. **Eject the DMG**: right-click the DMG in the Finder sidebar → Eject

#### Step 3 — Bypass Gatekeeper (REQUIRED)

> ⚠️ On first launch, macOS will show **"Transkrip is damaged and can't be opened"**. This is NOT a bug. The DMG is distributed unsigned (no $99/year Apple Developer ID). The fix is trivial.

Open **Terminal** (`Cmd+Space` → type "Terminal") and run:

```bash
xattr -cr /Applications/Transkrip.app
```

That's it. Now open Transkrip from Launchpad or the Applications folder — it will run normally.

#### Step 3 (Alternative) — Install via Terminal (Faster)

If you're comfortable with Terminal, a single command block replaces all the GUI steps above:

```bash
# Mount DMG, copy to Applications, bypass Gatekeeper, unmount, then launch
hdiutil attach ~/Downloads/Transkrip-1.0.0-arm64.dmg && \
cp -R "/Volumes/Transkrip 1.0.0-arm64/Transkrip.app" /Applications/ && \
xattr -cr /Applications/Transkrip.app && \
hdiutil detach "/Volumes/Transkrip 1.0.0-arm64" && \
open /Applications/Transkrip.app
```

Paste the whole block into Terminal → press Enter → the app launches. ✨

---

### 🅱️ Method B — Build from Source (Developers)

For developers who want to modify the code or build for platforms other than macOS ARM64.

#### Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org/))
- **npm** ≥ 9 (bundled with Node.js)
- **Git**
- System dependencies from **Step 0** above

#### Step 1 — Clone the Repository

```bash
git clone https://github.com/romizone/transkrip.git
cd transkrip
```

#### Step 2 — Install Node Dependencies

```bash
npm install
```

This will:
- Download all libraries (Electron, React, etc.)
- Compile the `better-sqlite3` native module for Electron (via postinstall)
- Take 1–3 minutes depending on your connection

#### Step 3a — Run in Development Mode

For testing / development with hot-reload:

```bash
npm run dev
```

This will:
1. Compile the TypeScript Electron main process
2. Start the Vite dev server at `http://localhost:5173`
3. Launch an Electron window hosting the React app

Close the window to stop the dev server.

#### Step 3b — Build Installer (DMG / EXE / AppImage)

To produce a distributable installer:

```bash
npm run dist
```

Output lands in the `release/` folder:
- 🍎 **macOS:** `release/Transkrip-1.0.0-arm64.dmg`
- 🪟 **Windows:** `release/Transkrip Setup 1.0.0.exe` (build on Windows)
- 🐧 **Linux:** `release/Transkrip-1.0.0.AppImage` (build on Linux)

> 💡 You can only build an installer for the OS you're building on. To build a macOS DMG, you must build on a Mac.

After `npm run dist` finishes, install the DMG using **Method A — Steps 2 & 3** above.

---

## 🎯 How to Use the App

### 1️⃣ First Launch

On first launch, Transkrip will:
- Create a local database at `~/Library/Application Support/Transkrip/` (macOS)
- Show the **Upload** page as the default view

### 2️⃣ Transcribe Your First File

#### Step by step:

1. **Select an audio/video file** — two ways:
   - Click the drop zone → the file picker opens → choose a file
   - Drag a file directly from Finder/Explorer into the drop zone

   Supported formats: `MP3, MP4, WAV, OGG, M4A, WEBM, FLAC, AAC, MOV, MKV, AVI, WMV, OPUS, WMA`

2. **Pick a language** in the **Language** dropdown:
   - `Auto Detect` — let Whisper figure it out (recommended)
   - Or pick manually: Indonesian, English, Japanese, etc. (15 languages available)

3. **Pick an AI model** in the **Model** dropdown:

   | Model | Size | Speed | Accuracy |
   |---|---|---|---|
   | **Tiny** | ~75 MB | ⚡⚡⚡⚡⚡ | ⭐⭐ |
   | **Base** | ~142 MB | ⚡⚡⚡⚡ | ⭐⭐⭐ (default) |
   | **Small** | ~466 MB | ⚡⚡⚡ | ⭐⭐⭐⭐ |
   | **Medium** | ~1.5 GB | ⚡⚡ | ⭐⭐⭐⭐⭐ |

   > 📥 Models are **downloaded automatically** the first time you use them, then cached at `~/Library/Application Support/Transkrip/models/`. You only pay the download cost once.

4. **(Optional) Check "Include timestamps"** — adds `[00:12]` style markers to each segment.

5. Click **Start Transcription**.

6. Wait for:
   - **Downloading model** (only on first use of a given model)
   - **Transcribing** — the progress bar updates in real time
   - Duration depends on audio length and chosen model. Rule of thumb: the Base model runs at ~0.3× audio duration on Apple Silicon.

### 3️⃣ View & Edit the Result

When transcription finishes, you're redirected to the **Transcription View** page which shows:
- The full text with timestamps (if enabled)
- Export buttons (TXT, DOCX, PDF, SRT)
- An Edit button

### 4️⃣ Export the Result

Click the export button for the format you want:

| Format | Use case |
|---|---|
| 📄 **TXT** | Plain text — easy to copy-paste |
| 📝 **DOCX** | Word document — for further editing |
| 📕 **PDF** | Finished document — ready to print or share |
| 🎬 **SRT** | Subtitle file — for video editing |

The file is saved to your OS's default Downloads folder.

### 5️⃣ Manage History

Click **History** in the left sidebar to see all previous transcriptions. From there you can:
- 👁️ **View** — reopen an old result
- 🗑️ **Delete** — remove it from the local database

All data stays on your device — nothing is ever sent to a server.

---

## 🧯 Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `"Transkrip" is damaged and can't be opened` | Gatekeeper quarantine | `xattr -cr /Applications/Transkrip.app` |
| `whisper-cpp not found` | whisper.cpp not installed | `brew install whisper-cpp` |
| `ffmpeg not found` | ffmpeg not installed | `brew install ffmpeg` |
| Transcription is very slow | Model too large | Switch to Base or Small |
| Model download fails | Slow or unstable connection | Retry — downloads are atomic and won't corrupt |
| Drag & drop doesn't work | Electron 32+ webUtils issue | Use the file picker (click the drop zone) |
| Poor transcription quality | Model too small / wrong language | Use Medium + pick the language manually |

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
