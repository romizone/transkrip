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

## ⚠️ macOS: "Transkrip is damaged and can't be opened"

The DMG is distributed **unsigned** (no Apple Developer ID), so macOS Gatekeeper will quarantine it. This is expected — the app is **not** actually damaged.

**Fix** — after dragging `Transkrip.app` to `/Applications`, run this once in Terminal:

```bash
xattr -cr /Applications/Transkrip.app
```

Then open the app normally. Done. ✅

> 💡 Alternatively, you can clear the quarantine flag directly on the DMG before installing:
> ```bash
> xattr -cr ~/Downloads/Transkrip-1.0.0-arm64.dmg
> ```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Whisper** installed locally (e.g. via [whisper.cpp](https://github.com/ggerganov/whisper.cpp) or `openai-whisper`)
- **Python 3** (if using `openai-whisper`)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/romizone/transkrip.git
cd transkrip

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev
```

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
