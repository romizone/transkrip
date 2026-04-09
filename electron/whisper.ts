import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execFile, spawn } from 'child_process';
import https from 'https';
import http from 'http';

const MODELS_DIR = () => path.join(app.getPath('userData'), 'models');

const MODEL_URLS: Record<string, string> = {
  'tiny': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
  'base': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
  'small': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
  'medium': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
};

export function getModelPath(modelName: string): string {
  return path.join(MODELS_DIR(), `ggml-${modelName}.bin`);
}

function followRedirects(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          followRedirects(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
    }).on('error', reject);
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

  await followRedirects(url, modelPath);
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
  // Check common install locations
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

  // Try to find via which
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

    ffmpeg.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`ffmpeg exited with code ${code}. Make sure ffmpeg is installed (brew install ffmpeg).`));
    });

    ffmpeg.on('error', () => {
      reject(new Error('ffmpeg not found. Please install it: brew install ffmpeg'));
    });
  });
}

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResult> {
  const { filePath, language, modelName, timestamps, onProgress } = options;

  // Convert to WAV 16kHz mono
  onProgress?.(5);
  const wavPath = await convertToWav(filePath);
  onProgress?.(15);

  const modelPath = getModelPath(modelName);
  const whisperBin = getWhisperBinaryPath();

  const args = [
    '-m', modelPath,
    '-f', wavPath,
    '--output-json',
    '--no-prints',
  ];

  if (language && language !== 'auto') {
    args.push('-l', language);
  }

  return new Promise((resolve, reject) => {
    onProgress?.(20);

    const outputJsonPath = wavPath + '.json';
    args.push('--output-file', wavPath);

    const proc = spawn(whisperBin, args);

    let stderr = '';

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
      // Try to parse progress from whisper output
      const match = data.toString().match(/progress\s*=\s*(\d+)%/);
      if (match) {
        const p = parseInt(match[1], 10);
        onProgress?.(20 + p * 0.75);
      }
    });

    proc.on('close', (code) => {
      // Clean up temp wav
      try { fs.unlinkSync(wavPath); } catch {}

      if (code !== 0) {
        // Cleanup
        try { fs.unlinkSync(outputJsonPath); } catch {}
        reject(new Error(`Whisper exited with code ${code}. ${stderr}\n\nMake sure whisper.cpp is installed: brew install whisper-cpp`));
        return;
      }

      try {
        const jsonContent = fs.readFileSync(outputJsonPath, 'utf-8');
        const json = JSON.parse(jsonContent);
        fs.unlinkSync(outputJsonPath);

        const segments: Segment[] = (json.transcription || []).map((seg: any) => ({
          start: seg.offsets?.from ? seg.offsets.from / 1000 : 0,
          end: seg.offsets?.to ? seg.offsets.to / 1000 : 0,
          text: seg.text?.trim() || '',
        }));

        const fullText = segments.map(s => s.text).join(' ');
        const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

        onProgress?.(100);
        resolve({ text: fullText, segments, duration });
      } catch (parseError: any) {
        // Fallback: try reading text output
        try { fs.unlinkSync(outputJsonPath); } catch {}
        reject(new Error(`Failed to parse whisper output: ${parseError.message}`));
      }
    });

    proc.on('error', () => {
      try { fs.unlinkSync(wavPath); } catch {}
      reject(new Error('whisper-cpp not found. Install it with: brew install whisper-cpp'));
    });
  });
}
