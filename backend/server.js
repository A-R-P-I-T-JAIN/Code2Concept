require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use(cors());
app.use(express.json());

// Function to clean JSON response
function cleanJsonResponse(text) {
  // Remove markdown code block syntax if present
  text = text.replace(/```json\n?/g, '');
  text = text.replace(/```\n?/g, '');
  
  // Remove any leading/trailing whitespace
  text = text.trim();
  
  return text;
}

// Function to generate approaches using Gemini
async function generateApproaches(question) {
  console.log("question:",question);
  
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
  "videoDuration": string (format: "5:23"),
  "concepts": string[]
}

Problem:
${question}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(text);
    
    
    // Clean the response and parse as JSON
    const cleanedText = cleanJsonResponse(text);
    const approaches = JSON.parse(cleanedText);
    console.log("approaches:",approaches);
    return approaches;
  } catch (error) {
    console.error('Error generating approaches:', error);
    throw error;
  }
}

// Function to generate animation URL using Gemini
async function generateAnimationUrl(approach) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Generate a detailed animation URL for explaining this DSA approach. The URL should be a string that represents a video or animation resource.

Approach details:
Title: ${approach.title}
Description: ${approach.description}
Time Complexity: ${approach.timeComplexity}
Space Complexity: ${approach.spaceComplexity}

Return ONLY the URL as a string, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating animation URL:', error);
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
  try {
    const { approach } = req.body;
    
    if (!approach) {
      return res.status(400).json({ error: 'Approach details are required' });
    }

    const animationUrl = await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve("http://localhost:5000/videos/video.mp4");
      }, 10000);
    });
    
    res.json({ animationUrl });
  } catch (error) {
    console.error('Error in /api/getAnimation:', error);
    res.status(500).json({ error: 'Failed to generate animation URL' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 