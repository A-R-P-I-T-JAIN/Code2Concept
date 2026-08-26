require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

// ─── Ensure FFmpeg is in PATH for both Manim and child_process ───────────────
function ensureFfmpegInPath() {
  const winGetDir = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(winGetDir)) {
    try {
      const entries = fs.readdirSync(winGetDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.toLowerCase().includes('ffmpeg')) {
          const binPath = path.join(winGetDir, entry.name, 'ffmpeg-9.0.1-full_build', 'bin');
          if (fs.existsSync(binPath) && !process.env.PATH.includes(binPath)) {
            process.env.PATH = `${binPath};${process.env.PATH}`;
            console.log(`[INFO] Added FFmpeg to PATH: ${binPath}`);
            return;
          }
          // Generic search for bin directory under ffmpeg package
          const packagePath = path.join(winGetDir, entry.name);
          const subEntries = fs.readdirSync(packagePath, { withFileTypes: true });
          for (const sub of subEntries) {
            if (sub.isDirectory()) {
              const subBin = path.join(packagePath, sub.name, 'bin');
              if (fs.existsSync(subBin) && !process.env.PATH.includes(subBin)) {
                process.env.PATH = `${subBin};${process.env.PATH}`;
                console.log(`[INFO] Added FFmpeg to PATH: ${subBin}`);
                return;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[WARN] Could not auto-detect FFmpeg path:', e.message);
    }
  }
}
ensureFfmpegInPath();

// ─── Startup validation ───────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error('[FATAL] GEMINI_API_KEY environment variable is not set. Please add it to backend/.env');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model is configurable via GEMINI_MODEL env var.
// Default: gemini-3.5-flash-lite — designed for high-throughput, ~1500 RPD on free tier.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
console.log(`[INFO] Using Gemini model: ${GEMINI_MODEL}`);

// ─── Gemini retry wrapper (handles 429 rate-limit with exponential backoff) ────
async function withGeminiRetry(fn, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const is429 = err.message?.includes('429') || err.status === 429;
      if (!is429 || attempt === maxAttempts) throw err;
      // Parse retry-after from error message (default: exponential backoff)
      const match = err.message?.match(/retry in (\d+)/);
      const waitMs = match ? parseInt(match[1], 10) * 1000 : Math.min(2 ** attempt * 5000, 60000);
      console.log(`[WARN] Gemini 429 on attempt ${attempt}/${maxAttempts} — waiting ${waitMs / 1000}s`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use(cors());
app.use(express.json());

// ─── Directory setup ──────────────────────────────────────────────────────────
const rendersDir = path.join(__dirname, 'renders');
const videosDir = path.join(__dirname, 'videos');
const audioDir = path.join(__dirname, 'audio');
fs.mkdirSync(rendersDir, { recursive: true });
fs.mkdirSync(videosDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

// ─── In-memory job store ──────────────────────────────────────────────────────
// job shape: { status, step, stepLabel, progress, videoUrl, error, createdAt }
const jobs = new Map();

const STEPS = [
  { id: 'narration', label: 'Generating narration script…', progress: 10 },
  { id: 'script', label: 'Writing Manim animation script…', progress: 30 },
  { id: 'audio', label: 'Generating voice narration…', progress: 50 },
  { id: 'render', label: 'Rendering animation frames…', progress: 70 },
  { id: 'merge', label: 'Combining audio & video…', progress: 90 },
];

function createJob() {
  const jobId = uuidv4();
  jobs.set(jobId, {
    status: 'pending',
    step: null,
    stepLabel: 'Starting…',
    progress: 0,
    videoUrl: null,
    error: null,
    createdAt: Date.now(),
  });
  return jobId;
}

function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (job) jobs.set(jobId, { ...job, ...updates });
}

function advanceStep(jobId, stepIndex) {
  const s = STEPS[stepIndex];
  if (!s) return;
  updateJob(jobId, { status: 'running', step: s.id, stepLabel: s.label, progress: s.progress });
}

// Cleanup jobs older than 1 hour every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 30 * 60 * 1000);

// ─── Utility helpers ──────────────────────────────────────────────────────────
function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.error(`[ERROR] deleting directory ${dirPath}:`, err.message);
  }
}

function findVideoFile(dir) {
  try {
    if (!fs.existsSync(dir)) return null;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.mp4')) return path.join(dir, item.name);
    }
    for (const item of items) {
      if (item.isDirectory()) {
        const result = findVideoFile(path.join(dir, item.name));
        if (result) return result;
      }
    }
    return null;
  } catch (err) {
    console.error('[ERROR] finding video file:', err.message);
    return null;
  }
}

function cleanJson(text) {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

function cleanPython(text) {
  return text.replace(/```python\n?/g, '').replace(/```\n?/g, '').trim();
}

// ─── AI helpers ───────────────────────────────────────────────────────────────
async function generateNarrationSteps(code) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = `You are an expert DSA educator. Generate clear, concise narration steps that explain what's happening in the algorithm visualization.

Create a JSON array of narration steps. Each step should be a short, clear sentence that explains what's happening at that moment in the algorithm execution.

Requirements:
- Each step should be 1-2 sentences maximum
- Use simple, clear language suitable for audio narration
- Focus on the key operations: comparisons, swaps, movements, updates
- Explain the "why" behind each action when relevant
- Keep each step under 150 characters for natural speech flow

Return ONLY a JSON array of strings, no markdown formatting.

Algorithm code:
${code}`;

  const result = await withGeminiRetry(() => model.generateContent(prompt));
  const text = result.response.text();
  return JSON.parse(cleanJson(text));
}

async function generateManimScript(code, narrationSteps, previousError = null) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const errorClause = previousError
    ? `\n\nCRITICAL FIX NEEDED: A previous attempt produced this Python error — fix it thoroughly:\n${previousError}\n`
    : '';

  const prompt = `You are an expert in the Manim Community animation library. Generate clean, error-free Manim Python script demonstrating the working of the algorithm using a concrete example.
${errorClause}
ABSOLUTE RULES FOR MANIM TO PREVENT PYTHON RUNTIME CRASHES:
1. ALWAYS import: from manim import *
2. Scene Class: Create a class extending Scene: class AlgorithmDemo(Scene): def construct(self):
3. NEVER PASS A MOBJECT DIRECTLY TO self.play()!
   - BAD: self.play(Square()) or self.play(rect) or self.play(Text("x"))  <-- THIS CAUSES TypeError: Unexpected argument!
   - GOOD: self.play(Create(Square())) or self.play(FadeIn(rect)) or self.play(Write(Text("x")))
   - If you don't need animation, use self.add(mobject)
4. Use .animate for property transitions:
   - GOOD: self.play(arrow.animate.next_to(box, DOWN))
   - GOOD: self.play(rect.animate.set_fill(GREEN, opacity=0.5))
   - GOOD: self.play(Transform(a, b)) or ReplacementTransform(a, b)
5. Use self.wait(1) or self.wait(2) between steps (NEVER just wait()).
6. Color constants: Use RED, BLUE, GREEN, YELLOW, WHITE, ORANGE, PURPLE (all caps).
7. Sizing & Positioning:
   - Screen bounds are approx width 14, height 8.
   - Position array centered: array_group.move_to(ORIGIN)
   - Position variables: var_group.to_edge(UP + RIGHT)
   - Position status text: status.to_edge(UP + LEFT)
   - Ensure texts and rectangles do not overlap.

VISUAL DEMONSTRATION STRUCTURE:
- Choose a small concrete input array (e.g. [4, 2, 7, 1, 3] or [2, 7, 11, 15])
- Show initial state with Create()/Write()
- Walk through each step with animations, matching the narration sequence
- Highlight active elements with color changes (e.g., rect.animate.set_color(YELLOW))
- Conclude with final result highlighted in GREEN

Narration Steps to synchronize:
${JSON.stringify(narrationSteps)}

Algorithm Code:
${code}

Return ONLY the executable Python script without markdown backticks or commentary.`;

  const result = await withGeminiRetry(() => model.generateContent(prompt));
  return cleanPython(result.response.text());
}

async function generateAudio(narrationSteps, audioId) {
  const audioFilePath = path.join(audioDir, `${audioId}.wav`);
  const fullNarration = narrationSteps.join('. ');

  const pythonScript = `
import pyttsx3

def generate_speech(text, output_path):
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)
    engine.setProperty('volume', 0.8)
    voices = engine.getProperty('voices')
    if len(voices) > 1:
        engine.setProperty('voice', voices[1].id)
    engine.save_to_file(text, output_path)
    engine.runAndWait()

if __name__ == "__main__":
    text = """${fullNarration.replace(/"/g, '\\"')}"""
    output_path = "${audioFilePath.replace(/\\/g, '\\\\')}"
    generate_speech(text, output_path)
`;

  const scriptPath = path.join(audioDir, `${audioId}_tts.py`);
  fs.writeFileSync(scriptPath, pythonScript);

  return new Promise((resolve, reject) => {
    const proc = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let errOut = '';
    proc.stderr.on('data', d => { errOut += d.toString(); });
    proc.on('close', code => {
      try { fs.unlinkSync(scriptPath); } catch (_) { }
      if (code === 0 && fs.existsSync(audioFilePath)) resolve(audioFilePath);
      else reject(new Error('TTS generation failed'));
    });
    proc.on('error', err => reject(new Error(`Failed to start TTS: ${err.message}`)));
  });
}

function combineVideoAndAudio(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-i', videoPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      '-y',
      outputPath,
    ]);
    let errOut = '';
    ff.stderr.on('data', d => { errOut += d.toString(); });
    ff.on('close', code => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`FFmpeg failed (code ${code})`));
    });
    ff.on('error', err => reject(new Error(`Failed to start FFmpeg: ${err.message}`)));
  });
}

// ─── Core animation pipeline (runs in background) ─────────────────────────────
async function runAnimationPipeline(jobId, approach) {
  let renderDir = null;
  let audioPath = null;
  const renderId = jobId;

  try {
    const code = approach.code?.javaCode
      || approach.code?.cppCode
      || approach.code?.pythonCode
      || approach.code?.jsCode;

    if (!code) throw new Error('No code found in approach');

    // Step 1 — Narration
    advanceStep(jobId, 0);
    const narrationSteps = await generateNarrationSteps(code);

    // Step 2 — Manim script (with up to 2 retries on Manim failure)
    advanceStep(jobId, 1);
    let scriptContent = await generateManimScript(code, narrationSteps);

    renderDir = path.join(rendersDir, renderId);
    fs.mkdirSync(renderDir, { recursive: true });
    const scriptPath = path.join(renderDir, 'animation.py');
    fs.writeFileSync(scriptPath, scriptContent);

    // Step 3 — Audio (non-fatal: if pyttsx3 isn't installed, serve video-only)
    advanceStep(jobId, 2);
    let audioAvailable = false;
    try {
      audioPath = await generateAudio(narrationSteps, renderId);
      audioAvailable = true;
    } catch (audioErr) {
      console.warn(`[WARN] Job ${jobId}: TTS failed (${audioErr.message}) — will serve video without audio`);
    }

    // Step 4 — Render (with retry)
    advanceStep(jobId, 3);
    let manimError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { exitCode, errorOutput } = await runManim(renderDir);
      if (exitCode === 0) { manimError = null; break; }
      manimError = errorOutput;
      console.error(`[MANIM] Attempt ${attempt + 1}/3 failed (exit ${exitCode}):\n${errorOutput.slice(-1500)}`);
      if (attempt < 2) {
        console.log(`[INFO] Regenerating Manim script with error context…`);
        scriptContent = await generateManimScript(code, narrationSteps, errorOutput.slice(0, 2000));
        fs.writeFileSync(scriptPath, scriptContent);
      }
    }
    if (manimError) throw new Error('Manim rendering failed after 3 attempts');

    // Step 5 — Merge (or copy if no audio)
    advanceStep(jobId, 4);
    const rawVideoPath = findVideoFile(renderDir);
    if (!rawVideoPath) throw new Error('No video file produced by Manim');

    const publicDir = path.join(videosDir, renderId);
    fs.mkdirSync(publicDir, { recursive: true });
    const baseName = path.basename(rawVideoPath, '.mp4');
    const finalVideoPath = path.join(publicDir, `${baseName}_with_audio.mp4`);

    if (audioAvailable && audioPath) {
      await combineVideoAndAudio(rawVideoPath, audioPath, finalVideoPath);
    } else {
      // No audio — just copy the raw video to the public dir
      fs.copyFileSync(rawVideoPath, finalVideoPath);
    }

    const videoUrl = `/videos/${renderId}/${baseName}_with_audio.mp4`;

    // Cleanup temp files
    deleteDirectory(renderDir);
    if (audioPath && fs.existsSync(audioPath)) try { fs.unlinkSync(audioPath); } catch (_) { }

    updateJob(jobId, { status: 'done', step: 'done', stepLabel: audioAvailable ? 'Complete!' : 'Complete (no audio)', progress: 100, videoUrl });
    console.log(`[INFO] Job ${jobId} complete → ${videoUrl} (audio: ${audioAvailable})`);

  } catch (err) {
    console.error(`[ERROR] Job ${jobId} failed:`, err.message);
    if (renderDir) deleteDirectory(renderDir);
    if (audioPath && fs.existsSync(audioPath)) try { fs.unlinkSync(audioPath); } catch (_) { }
    updateJob(jobId, { status: 'failed', error: err.message, stepLabel: 'Failed' });
  }
}

function runManim(cwd) {
  return new Promise(resolve => {
    const proc = spawn('python', ['-m', 'manim', 'animation.py', '-ql'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let errorOutput = '';
    proc.stderr.on('data', d => { errorOutput += d.toString(); });
    proc.on('close', exitCode => resolve({ exitCode, errorOutput }));
    proc.on('error', err => resolve({ exitCode: -1, errorOutput: err.message }));
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Analyze problem → return approaches
app.post('/api/analyze', async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string' || question.trim().length < 10) {
    return res.status(400).json({ error: 'A valid question (at least 10 characters) is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are an expert DSA mentor. For the given DSA problem, provide all possible solution approaches.

Return ONLY a JSON array of objects, with NO markdown formatting, NO explanations, and NO extra text. Each object must have these exact fields:
{
  "title": string,
  "timeComplexity": string,
  "spaceComplexity": string,
  "description": string,
  "code": {
    "javaCode": string,
    "pythonCode": string,
    "cppCode": string,
    "jsCode": string
  },
  "pros": string[],
  "cons": string[],
  "concepts": string[]
}

Problem:
${question.trim()}`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    const text = result.response.text();
    const approaches = JSON.parse(cleanJson(text));

    res.json({ question: question.trim(), title: 'Problem Analysis', approaches });
  } catch (err) {
    console.error('[ERROR] /api/analyze:', err.message);
    res.status(500).json({ error: 'Failed to analyze problem. Please try again.' });
  }
});

// Start animation job → return jobId immediately
app.post('/api/getAnimation', (req, res) => {
  const { approach } = req.body;

  if (!approach || !approach.code || typeof approach.code !== 'object') {
    return res.status(400).json({ error: 'A valid approach object with code is required.' });
  }

  const jobId = createJob();
  // Fire-and-forget — pipeline runs in background
  runAnimationPipeline(jobId, approach);

  res.json({ jobId });
});

// Poll job status
app.get('/api/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  res.json({
    status: job.status,
    step: job.step,
    stepLabel: job.stepLabel,
    progress: job.progress,
    videoUrl: job.videoUrl
      ? `http://localhost:${port}${job.videoUrl}`
      : null,
    error: job.status === 'failed' ? job.error : null,
  });
});

// Manual cleanup of a specific video
app.delete('/api/cleanup/:videoId', (req, res) => {
  try {
    const videoDir = path.join(videosDir, req.params.videoId);
    if (!fs.existsSync(videoDir)) return res.status(404).json({ error: 'Video not found.' });
    deleteDirectory(videoDir);
    res.json({ message: `Video ${req.params.videoId} deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Cleanup failed.' });
  }
});

app.listen(port, () => {
  console.log(`[INFO] Server running on port ${port}`);
});
