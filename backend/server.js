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
fs.mkdirSync(rendersDir, { recursive: true });
fs.mkdirSync(videosDir, { recursive: true });

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
  // Remove markdown code block syntax if present
  text = text.replace(/```json\n?/g, '');
  text = text.replace(/```\n?/g, '');
  
  // Remove any leading/trailing whitespace
  text = text.trim();
  
  return text;
}

// Function to clean Python code response
function cleanPythonResponse(text) {
  // Remove markdown code block syntax if present
  text = text.replace(/```python\n?/g, '');
  text = text.replace(/```\n?/g, '');
  
  // Remove any leading/trailing whitespace
  text = text.trim();
  
  return text;
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
  "code": string (Java code),
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

    // Clean the response and parse as JSON
    const cleanedText = cleanJsonResponse(text);
    const approaches = JSON.parse(cleanedText);
    console.log("approaches:", approaches);
    return approaches;
  } catch (error) {
    console.error('Error generating approaches:', error);
    throw error;
  }
}

async function generateManimScript(code) {
  const scriptId = uuidv4();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert in the Manim animation library.

Generate a clean, error-free Manim script that visually demonstrates the working of the given Java algorithm using a specific example input. Do not show or animate the code. The goal is to help viewers understand the algorithm visually.

Constraints:
- Do not include or reference the original code in the video.
- Explain the algorithm only through animations using a step-by-step example.
- Use appropriate Manim classes like Rectangle, Text, VGroup, and Arrow.
- Animate index pointers (like i and j), variable values (like sum, count), and array traversal clearly.
- Ensure all elements are visible within screen bounds and do not overlap.
- Make sure the text or any element does not overlap with each other. Everything should be clearly visible on the screen.
- There should be proper spacing between texts and any other element.
- All texts, shapes, and animations should be well-aligned and spaced.
- Return only the Manim Python code, nothing else. Do not include markdown formatting.

code:
${code}
`;

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

// Route to get animation URL
app.post('/api/getAnimation', async (req, res) => {
  let renderDir = null;
  
  try {
    const { approach } = req.body;
    if (!approach) {
      return res.status(400).json({ error: 'Approach details are required' });
    }
    
    console.log("---------------------");
    console.log("Generating animation for approach:", approach.title);

    const { scriptContent, scriptId } = await generateManimScript(approach.code);
    console.log('Generated Manim script with ID:', scriptId);

    // Create a unique directory for this render
    const renderId = scriptId;
    renderDir = path.join(rendersDir, renderId);
    fs.mkdirSync(renderDir, { recursive: true });

    // Write the Python script to a file
    const scriptPath = path.join(renderDir, 'animation.py');
    fs.writeFileSync(scriptPath, scriptContent);

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

    manim.on('close', (code) => {
      console.log(`Manim process exited with code ${code}`);

      if (code !== 0) {
        console.error('Manim failed with output:', output);
        console.error('Manim failed with error:', errorOutput);
        
        // Clean up render directory on failure
        if (renderDir) {
          deleteDirectory(renderDir);
        }
        
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
          
          // Clean up render directory on failure
          if (renderDir) {
            deleteDirectory(renderDir);
          }
          
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

        // Get the video filename
        const videoFileName = path.basename(videoPath);
        const finalVideoPath = path.join(publicDir, videoFileName);

        // Copy the video to the final location
        fs.copyFileSync(videoPath, finalVideoPath);

        const videoUrl = `/videos/${renderId}/${videoFileName}`;
        console.log(`Video successfully generated and available at: ${videoUrl}`);

        // CLEANUP: Delete the entire render directory since we only need the final video
        deleteDirectory(renderDir);
        console.log(`Cleaned up temporary render directory: ${renderDir}`);

        res.json({ videoUrl });
        
      } catch (error) {
        console.error('Error processing video file:', error);
        
        // Clean up render directory on error
        if (renderDir) {
          deleteDirectory(renderDir);
        }
        
        res.status(500).json({ 
          error: 'Error processing generated video',
          details: error.message,
          output: output,
          errorOutput: errorOutput
        });
      }
    });

    manim.on('error', (error) => {
      console.error('Failed to start Manim process:', error);
      
      // Clean up render directory on error
      if (renderDir) {
        deleteDirectory(renderDir);
      }
      
      res.status(500).json({ 
        error: 'Failed to start Manim process',
        details: error.message
      });
    });

  } catch (error) {
    console.error('Error in /api/getAnimation:', error);
    
    // Clean up render directory on error
    if (renderDir) {
      deleteDirectory(renderDir);
    }
    
    res.status(500).json({ 
      error: 'Failed to generate animation',
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