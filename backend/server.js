require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Serve static video files
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use(cors());
app.use(express.json());

const rendersDir = path.join(__dirname, 'renders');
const videosDir = path.join(__dirname, 'videos');
const audioDir = path.join(__dirname, 'audio');
fs.mkdirSync(rendersDir, { recursive: true });
fs.mkdirSync(videosDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

// Function to recursively delete directory
function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Successfully deleted directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error deleting directory ${dirPath}:`, error);
  }
}

// Function to find video file recursively
function findVideoFile(dir, baseName = '') {
  try {
    if (!fs.existsSync(dir)) return null;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    // First, look for .mp4 files in current directory
    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.mp4')) {
        return path.join(dir, item.name);
      }
    }
    
    // Then, recursively search subdirectories
    for (const item of items) {
      if (item.isDirectory()) {
        const result = findVideoFile(path.join(dir, item.name), baseName);
        if (result) return result;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding video file:', error);
    return null;
  }
}

// Function to clean JSON response
function cleanJsonResponse(text) {
  text = text.replace(/```json\n?/g, '');
  text = text.replace(/```\n?/g, '');
  text = text.trim();
  return text;
}

// Function to clean Python code response
function cleanPythonResponse(text) {
  text = text.replace(/```python\n?/g, '');
  text = text.replace(/```\n?/g, '');
  text = text.trim();
  return text;
}

// Function to generate narration steps
async function generateNarrationSteps(code) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert DSA educator. Generate clear, concise narration steps that explain what's happening in the algorithm visualization.

Create a JSON array of narration steps. Each step should be a short, clear sentence that explains what's happening at that moment in the algorithm execution.

Requirements:
- Each step should be 1-2 sentences maximum
- Use simple, clear language suitable for audio narration
- Focus on the key operations: comparisons, swaps, movements, updates
- Explain the "why" behind each action when relevant
- Keep each step under 150 characters for natural speech flow

Return ONLY a JSON array of strings, no markdown formatting.

Example format:
[
  "We start with an unsorted array of 6 elements",
  "The algorithm compares the first two elements: 5 and 2",
  "Since 5 is greater than 2, we swap their positions",
  "Now we move to the next pair and repeat the comparison"
]

Algorithm code:
${code}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = cleanJsonResponse(text);
    const steps = JSON.parse(cleanedText);
    console.log("Generated narration steps:", steps);
    return steps;
  } catch (error) {
    console.error('Error generating narration steps:', error);
    throw error;
  }
}

// Function to generate text-to-speech audio
async function generateAudio(narrationSteps, audioId) {
  try {
    const audioFilePath = path.join(audioDir, `${audioId}.wav`);
    const fullNarration = narrationSteps.join('. ');
    
    console.log('Generating audio for narration:', fullNarration.substring(0, 100) + '...');

    // Using pyttsx3 for text-to-speech (you'll need to install it: pip install pyttsx3)
    const pythonScript = `
import pyttsx3
import sys

def generate_speech(text, output_path):
    engine = pyttsx3.init()
    
    # Set properties
    engine.setProperty('rate', 150)  # Speed of speech
    engine.setProperty('volume', 0.8)  # Volume level (0.0 to 1.0)
    
    # Get available voices
    voices = engine.getProperty('voices')
    if len(voices) > 1:
        engine.setProperty('voice', voices[1].id)  # Use female voice if available
    
    # Save to file
    engine.save_to_file(text, output_path)
    engine.runAndWait()
    print(f"Audio saved to: {output_path}")

if __name__ == "__main__":
    text = """${fullNarration.replace(/"/g, '\\"')}"""
    output_path = "${audioFilePath.replace(/\\/g, '\\\\')}"
    generate_speech(text, output_path)
`;

    const scriptPath = path.join(audioDir, `${audioId}_script.py`);
    fs.writeFileSync(scriptPath, pythonScript);

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up the script file
        try {
          fs.unlinkSync(scriptPath);
        } catch (err) {
          console.error('Error cleaning up script file:', err);
        }

        if (code === 0 && fs.existsSync(audioFilePath)) {
          console.log('Audio generated successfully');
          resolve(audioFilePath);
        } else {
          console.error('Audio generation failed:', errorOutput);
          reject(new Error(`Audio generation failed: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start audio generation: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('Error in generateAudio:', error);
    throw error;
  }
}

// Function to combine video and audio using FFmpeg
async function combineVideoAndAudio(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,           // Input video
      '-i', audioPath,           // Input audio
      '-c:v', 'copy',            // Copy video stream without re-encoding
      '-c:a', 'aac',             // Encode audio to AAC
      '-shortest',               // End when shortest stream ends
      '-y',                      // Overwrite output file
      outputPath
    ]);

    let output = '';
    let errorOutput = '';

    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Video and audio combined successfully');
        resolve(outputPath);
      } else {
        console.error('FFmpeg failed:', errorOutput);
        reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}`));
    });
  });
}

// Function to generate approaches using Gemini
async function generateApproaches(question) {
  console.log("question:", question);

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert DSA mentor. For the given DSA problem, provide all possible solution approaches.

Return ONLY a JSON array of objects, with NO markdown formatting, NO explanations, and NO extra text. Each object must have these exact fields:
{
  "title": string,
  "timeComplexity": string,
  "spaceComplexity": string,
  "description": string,
  "code": {
  "javaCode": string (Java code),
  "pythonCode": string (Python code),
  "cppCode": string (C++ code),
  "jsCode": string (JavaScript code),
  }
  
  "pros": string[],
  "cons": string[],
  "concepts": string[]
}

Problem:
${question}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = cleanJsonResponse(text);
    const approaches = JSON.parse(cleanedText);
    console.log("approaches:", approaches);
    return approaches;
  } catch (error) {
    console.error('Error generating approaches:', error);
    throw error;
  }
}

async function generateManimScript(code, narrationSteps) {
  const scriptId = uuidv4();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const prompt = `You are an expert in the Manim animation library.

// Generate a clean, error-free Manim script that visually demonstrates the working of the given Java algorithm using a specific example input. The animation should be synchronized with the provided narration steps.

// Narration Steps: ${JSON.stringify(narrationSteps)}

// Constraints:
// - Do not include or reference the original code in the video.
// - Explain the algorithm only through animations using a step-by-step example.
// - Use appropriate Manim classes like Rectangle, Text, VGroup, and Arrow.
// - Animate index pointers (like i and j), variable values (like sum, count), and array traversal clearly.
// - Each animation step should correspond to a narration step
// - Add appropriate wait times between steps to match audio pacing (use self.wait(2) between major steps)
// - Ensure all elements are visible within screen bounds and do not overlap.
// - Make sure the text or any element does not overlap with each other. Everything should be clearly visible on the screen.
// - There should be proper spacing between texts and any other element.
// - All texts, shapes, and animations should be well-aligned and spaced.
// - Return only the Manim Python code, nothing else. Do not include markdown formatting.

// Code:
// ${code}
// `;

const prompt = `You are an expert in the Manim animation library. Generate a clean, error-free Manim script that visually demonstrates the working of the given Java algorithm using a specific example input.

CRITICAL REQUIREMENTS FOR ERROR-FREE CODE:
1. Always import required Manim classes at the top: from manim import *
2. Use proper Manim syntax and method names (e.g., Create() not create(), FadeIn() not fade_in())
3. All animations must use self.play() to execute
4. Use self.wait() for pauses, not wait()
5. Ensure proper scene class inheritance from Scene
6. Use correct positioning methods like .to_edge(), .next_to(), .shift()
7. Always check that referenced objects exist before animating them
8. Use proper color constants (RED, BLUE, GREEN, etc.)

ANIMATION STRUCTURE:
- Create a Scene class that inherits from Scene
- Implement construct(self) method
- Use concrete example data (e.g., array = [3, 7, 1, 9, 2] for sorting algorithms)
- Show algorithm execution step-by-step with the example data

VISUAL ELEMENTS GUIDELINES:
- Arrays: Use Rectangle objects arranged horizontally with Text labels inside
- Pointers/Indices: Use Arrow objects pointing to array elements, with Text labels (i, j, etc.)
- Variables: Display as Text objects in a dedicated area (top-right corner)
- Comparisons: Highlight compared elements with color changes
- Swaps/Moves: Use Transform or ReplacementTransform animations
- Status Messages: Use Text objects to show current operation

SPACING AND LAYOUT:
- Position arrays in center: array_group.move_to(ORIGIN)
- Place variables at top-right: variables.to_edge(UP + RIGHT)
- Position pointers below arrays with proper spacing: .shift(DOWN * 0.8)
- Ensure minimum 0.5 unit spacing between text elements
- Use .arrange(RIGHT, buff=0.1) for horizontal arrangement
- Use .arrange(DOWN, buff=0.3) for vertical arrangement

ANIMATION SYNCHRONIZATION:
- Each animation step should correspond to a narration step
- Use self.wait(2) between major algorithm steps
- Use self.wait(1) for minor transitions
- Add self.wait(0.5) after highlighting elements

ERROR PREVENTION CHECKLIST:
- Verify all object names match throughout the script
- Check that all animations use self.play()
- Ensure all waits use self.wait()
- Confirm proper import statement
- Validate that scene class extends Scene
- Check method is named construct(self)

EXAMPLE STRUCTURE:
python
from manim import *

class AlgorithmDemo(Scene):
    def construct(self):
        # Create visual elements
        # Show initial state
        # Step through algorithm with example
        # Each step: animate + wait


Narration Steps: ${JSON.stringify(narrationSteps)}

Algorithm Code: ${code}

Generate ONLY the Python Manim code with no markdown formatting or explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const scriptContent = cleanPythonResponse(response.text());

    return { scriptId, scriptContent };
  } catch (error) {
    console.error('Error generating Manim script:', error);
    throw error;
  }
}

// Route to handle problem analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const approaches = await generateApproaches(question);

    res.json({
      question,
      title: "Problem Analysis",
      approaches
    });
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({ error: 'Failed to analyze problem' });
  }
});

// Enhanced route to get animation URL with audio
app.post('/api/getAnimation', async (req, res) => {
  let renderDir = null;
  let audioFilePath = null;
  
  try {
    const { approach } = req.body;
    if (!approach) {
      return res.status(400).json({ error: 'Approach details are required' });
    }
    
    console.log("---------------------");
    console.log("Generating animation with audio for approach:", approach.title);

    let code = approach.code.javaCode 
        || approach.code.cppCode 
        || approach.code.pythonCode 
        || approach.code.jsCode;

    // Generate narration steps
    const narrationSteps = await generateNarrationSteps(code);
    
    // Generate Manim script with narration awareness
    const { scriptContent, scriptId } = await generateManimScript(code, narrationSteps);
    console.log('Generated Manim script with ID:', scriptId);

    // Create a unique directory for this render
    const renderId = scriptId;
    renderDir = path.join(rendersDir, renderId);
    fs.mkdirSync(renderDir, { recursive: true });

    // Write the Python script to a file
    const scriptPath = path.join(renderDir, 'animation.py');
    fs.writeFileSync(scriptPath, scriptContent);

    // Generate audio
    audioFilePath = await generateAudio(narrationSteps, renderId);
    console.log('Audio generated at:', audioFilePath);

    console.log(`Running Manim in directory: ${renderDir}`);
    console.log(`Script path: ${scriptPath}`);

    // Use child_process.spawn for better control over the Manim process
    const manim = spawn('python', ['-m', 'manim', 'animation.py', '-ql'], {
      cwd: renderDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    manim.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
    });

    manim.stderr.on('data', (data) => {
      const dataStr = data.toString();
      errorOutput += dataStr;
    });

    manim.on('close', async (code) => {
      console.log(`Manim process exited with code ${code}`);

      if (code !== 0) {
        console.error('Manim failed with output:', output);
        console.error('Manim failed with error:', errorOutput);
        
        // Clean up on failure
        if (renderDir) deleteDirectory(renderDir);
        if (audioFilePath && fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
        
        return res.status(500).json({ 
          error: `Manim failed with code ${code}`, 
          output: output,
          errorOutput: errorOutput
        });
      }

      try {
        // Find the generated video file recursively
        const videoPath = findVideoFile(renderDir);

        if (!videoPath) {
          console.error('No video file found in render directory:', renderDir);
          
          // Clean up on failure
          if (renderDir) deleteDirectory(renderDir);
          if (audioFilePath && fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
          
          return res.status(500).json({ 
            error: 'No video file generated',
            output: output,
            errorOutput: errorOutput
          });
        }

        console.log('Found video file at:', videoPath);

        // Create final video directory
        const publicDir = path.join(videosDir, renderId);
        fs.mkdirSync(publicDir, { recursive: true });

        // Combine video and audio
        const videoFileName = path.basename(videoPath);
        const baseFileName = videoFileName.replace('.mp4', '');
        const finalVideoPath = path.join(publicDir, `${baseFileName}_with_audio.mp4`);

        await combineVideoAndAudio(videoPath, audioFilePath, finalVideoPath);

        const videoUrl = `/videos/${renderId}/${baseFileName}_with_audio.mp4`;
        console.log(`Video with audio successfully generated and available at: ${videoUrl}`);

        // CLEANUP: Delete temporary files
        deleteDirectory(renderDir);
        if (audioFilePath && fs.existsSync(audioFilePath)) {
          fs.unlinkSync(audioFilePath);
        }
        console.log(`Cleaned up temporary files`);

        res.json({ videoUrl });
        
      } catch (error) {
        console.error('Error processing video/audio combination:', error);
        
        // Clean up on error
        if (renderDir) deleteDirectory(renderDir);
        if (audioFilePath && fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
        
        res.status(500).json({ 
          error: 'Error processing generated video with audio',
          details: error.message,
          output: output,
          errorOutput: errorOutput
        });
      }
    });

    manim.on('error', (error) => {
      console.error('Failed to start Manim process:', error);
      
      // Clean up on error
      if (renderDir) deleteDirectory(renderDir);
      if (audioFilePath && fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
      
      res.status(500).json({ 
        error: 'Failed to start Manim process',
        details: error.message
      });
    });

  } catch (error) {
    console.error('Error in /api/getAnimation:', error);
    
    // Clean up on error
    if (renderDir) deleteDirectory(renderDir);
    if (audioFilePath && fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
    
    res.status(500).json({ 
      error: 'Failed to generate animation with audio',
      details: error.message
    });
  }
});

// Optional: Add a cleanup endpoint to manually clean old videos if needed
app.delete('/api/cleanup/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    const videoDir = path.join(videosDir, videoId);
    
    if (fs.existsSync(videoDir)) {
      deleteDirectory(videoDir);
      res.json({ message: `Video ${videoId} deleted successfully` });
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    console.error('Error cleaning up video:', error);
    res.status(500).json({ error: 'Failed to cleanup video' });
  }
});

// Optional: Add a cleanup endpoint to clean all old videos
app.delete('/api/cleanup-all', (req, res) => {
  try {
    const videoDirectories = fs.readdirSync(videosDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    let deletedCount = 0;
    videoDirectories.forEach(dirName => {
      const dirPath = path.join(videosDir, dirName);
      deleteDirectory(dirPath);
      deletedCount++;
    });
    
    res.json({ message: `Cleaned up ${deletedCount} video directories` });
  } catch (error) {
    console.error('Error in cleanup-all:', error);
    res.status(500).json({ error: 'Failed to cleanup videos' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});