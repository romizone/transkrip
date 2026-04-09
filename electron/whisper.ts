import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import https from 'https';
import http from 'http';

const MODELS_DIR = () => path.join(app.getPath('userData'), 'models');

const MODEL_URLS: Record<string, string> = {
  'tiny': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
  'base': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
  'small': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
  'medium': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
};

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

export function getModelPath(modelName: string): string {
  return path.join(MODELS_DIR(), `ggml-${modelName}.bin`);
}

function safeUnlink(p: string) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
}

function followRedirects(url: string, dest: string, depth = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (depth > 10) {
      reject(new Error('Too many redirects'));
      return;
    }
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (response) => {
      if (response.statusCode && REDIRECT_CODES.has(response.statusCode)) {
        const redirectUrl = response.headers.location;
        response.resume();
        if (redirectUrl) {
          const nextUrl = redirectUrl.startsWith('http')
            ? redirectUrl
            : new URL(redirectUrl, url).toString();
          followRedirects(nextUrl, dest, depth + 1).then(resolve).catch(reject);
          return;
        }
        reject(new Error('Redirect without Location header'));
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close((err) => (err ? reject(err) : resolve()));
      });
      file.on('error', (err) => {
        safeUnlink(dest);
        reject(err);
      });
      response.on('error', (err) => {
        safeUnlink(dest);
        reject(err);
      });
    });
    req.on('error', (err) => {
      safeUnlink(dest);
      reject(err);
    });
  });
}

export async function downloadModel(modelName: string): Promise<string> {
  const modelsDir = MODELS_DIR();
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  const modelPath = getModelPath(modelName);
  if (fs.existsSync(modelPath)) return modelPath;

  const url = MODEL_URLS[modelName];
  if (!url) throw new Error(`Unknown model: ${modelName}`);

  const tmpPath = `${modelPath}.part`;
  try {
    await followRedirects(url, tmpPath);
    fs.renameSync(tmpPath, modelPath);
  } catch (err) {
    safeUnlink(tmpPath);
    throw err;
  }
  return modelPath;
}

export interface TranscribeOptions {
  filePath: string;
  language: string;
  modelName: string;
  timestamps: boolean;
  onProgress?: (progress: number) => void;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface TranscribeResult {
  text: string;
  segments: Segment[];
  duration: number;
}

function getWhisperBinaryPath(): string {
  const possiblePaths = [
    '/opt/homebrew/bin/whisper-cli',
    '/opt/homebrew/bin/whisper-cpp',
    '/opt/homebrew/bin/main',
    '/usr/local/bin/whisper-cli',
    '/usr/local/bin/whisper-cpp',
    '/usr/local/bin/main',
    path.join(app.getPath('userData'), 'bin', 'whisper-cli'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  return 'whisper-cli';
}

function convertToWav(inputPath: string): Promise<string> {
  const outputPath = path.join(app.getPath('temp'), `transkrip-${Date.now()}.wav`);
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      '-y',
      outputPath,
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    ffmpeg.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`ffmpeg exited with code ${code}. Make sure ffmpeg is installed (brew install ffmpeg).\n${stderr}`));
    });

    ffmpeg.on('error', () => {
      reject(new Error('ffmpeg not found. Please install it: brew install ffmpeg'));
    });
  });
}

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResult> {
  const { filePath, language, modelName, onProgress } = options;

  onProgress?.(5);
  const wavPath = await convertToWav(filePath);
  onProgress?.(15);

  const modelPath = getModelPath(modelName);
  const whisperBin = getWhisperBinaryPath();

  // whisper.cpp writes output to `<output-file>.json` when --output-json is set.
  // Use a clean basename without the .wav extension.
  const outputBase = wavPath.replace(/\.wav$/, '');
  const outputJsonPath = `${outputBase}.json`;

  const args = [
    '-m', modelPath,
    '-f', wavPath,
    '--output-json',
    '--output-file', outputBase,
    // Always pass -l explicitly. whisper.cpp defaults to "en" when omitted,
    // so auto-detect requires "-l auto".
    '-l', language && language.length > 0 ? language : 'auto',
  ];

  return new Promise((resolve, reject) => {
    onProgress?.(20);

    const proc = spawn(whisperBin, args);
    let stderr = '';
    let cleanedWav = false;
    const cleanupWav = () => {
      if (!cleanedWav) {
        cleanedWav = true;
        safeUnlink(wavPath);
      }
    };

    const parseProgress = (chunk: string) => {
      // whisper.cpp prints `progress = NN%` to stderr
      const match = chunk.match(/progress\s*=\s*(\d+)\s*%/);
      if (match) {
        const p = parseInt(match[1], 10);
        onProgress?.(Math.min(95, 20 + p * 0.75));
      }
    };

    proc.stderr.on('data', (data: Buffer) => {
      const s = data.toString();
      stderr += s;
      parseProgress(s);
    });

    proc.stdout.on('data', (data: Buffer) => {
      parseProgress(data.toString());
    });

    proc.on('close', (code) => {
      cleanupWav();

      if (code !== 0) {
        safeUnlink(outputJsonPath);
        reject(new Error(`Whisper exited with code ${code}. ${stderr}\n\nMake sure whisper.cpp is installed: brew install whisper-cpp`));
        return;
      }

      try {
        const jsonContent = fs.readFileSync(outputJsonPath, 'utf-8');
        const json = JSON.parse(jsonContent);
        safeUnlink(outputJsonPath);

        const segments: Segment[] = (json.transcription || [])
          .map((seg: any) => ({
            start: seg.offsets?.from ? seg.offsets.from / 1000 : 0,
            end: seg.offsets?.to ? seg.offsets.to / 1000 : 0,
            text: seg.text?.trim() || '',
          }))
          .filter((s: Segment) => s.text.length > 0);

        const fullText = segments.map((s) => s.text).join(' ');
        const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

        onProgress?.(100);
        resolve({ text: fullText, segments, duration });
      } catch (parseError: any) {
        safeUnlink(outputJsonPath);
        reject(new Error(`Failed to parse whisper output: ${parseError.message}`));
      }
    });

    proc.on('error', () => {
      cleanupWav();
      reject(new Error('whisper-cpp not found. Install it with: brew install whisper-cpp'));
    });
  });
}
