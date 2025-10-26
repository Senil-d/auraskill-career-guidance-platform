// // server.js
// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const { ImageAnnotatorClient } = require('@google-cloud/vision');
// const path = require('path');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Configure multer for file uploads
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
// });

// // Initialize Google Cloud Vision client
// // Method 1: Using service account key file (recommended)
// const client = new ImageAnnotatorClient({
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'cvproj-471303-93aec667a2d9.json')
// });

// // Method 2: Using API key (alternative)
// // const client = new ImageAnnotatorClient({
// //   key: process.env.GOOGLE_API_KEY
// // });

// // OCR endpoint
// app.post('/api/ocr', upload.single('image'), async (req, res) => {
//   try {
//     console.log('Received OCR request');
    
//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false, 
//         error: 'No image file provided' 
//       });
//     }

//     // Check file type
//     if (!req.file.mimetype.startsWith('image/')) {
//       return res.status(400).json({
//         success: false,
//         error: 'File must be an image'
//       });
//     }

//     console.log('Processing image with Google Cloud Vision...');
    
//     // Perform text detection
//     const [result] = await client.textDetection({
//       image: { content: req.file.buffer }
//     });

//     const detections = result.textAnnotations;
    
//     if (!detections || detections.length === 0) {
//       return res.json({
//         success: true,
//         text: '',
//         message: 'No text found in the image'
//       });
//     }

//     const fullText = detections[0].description;
//     console.log('OCR completed successfully. Text length:', fullText.length);

//     res.json({
//       success: true,
//       text: fullText,
//       rawResponse: result // Optional: include full response for debugging
//     });

//   } catch (error) {
//     console.error('OCR Error:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to process image',
//       details: error.message 
//     });
//   }
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'OCR server is running' });
// });

// app.listen(port, () => {
//   console.log(`OCR server running on port ${port}`);
//   console.log(`Health check: http://localhost:${port}/health`);
// });



// server.js with Tesseract.js (FREE)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// OCR endpoint with Tesseract.js
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    console.log('Received OCR request');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    // Check file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'File must be an image'
      });
    }

    console.log('Processing image with Tesseract.js...');
    
    // Perform text detection with Tesseract
    const result = await Tesseract.recognize(
      req.file.buffer,
      'eng', // English language
      { 
        logger: m => console.log(m) // Optional logger
      }
    );

    const fullText = result.data.text;
    
    if (!fullText || fullText.trim().length === 0) {
      return res.json({
        success: true,
        text: '',
        message: 'No text found in the image'
      });
    }

    console.log('OCR completed successfully. Text length:', fullText.length);

    res.json({
      success: true,
      text: fullText,
      confidence: result.data.confidence
    });

  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process image',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'OCR server is running with Tesseract.js' });
});

app.listen(port, () => {
  console.log(`OCR server running on port ${port}`);
  console.log(`Using Tesseract.js for FREE OCR`);
  console.log(`Health check: http://localhost:${port}/health`);
});