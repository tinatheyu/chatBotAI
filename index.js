const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';

// Configuration parameters
const SYSTEM_INSTRUCTION =
  'You are MetaBot AI, a helpful and knowledgeable AI assistant. ' +
  'Respond naturally and clearly. Adapt to the user\'s language. ' +
  'Explain technical topics step by step and provide practical examples when useful. ' +
  'Acknowledge uncertainty when information is insufficient. ' +
  'Do not invent facts or claim to have performed actions that you have not performed.';

const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40
};

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

// Initialize GoogleGenAI client if API key is provided
let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err.message);
  }
}

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory rate limiter (per IP, max 30 requests per minute)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, clientData);
    return true;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  clientData.count += 1;
  rateLimitMap.set(ip, clientData);
  return true;
}

// Periodic cleanup of stale rate-limit records
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'MetaBot AI',
    model: GEMINI_MODEL,
    apiKeyConfigured: Boolean(GEMINI_API_KEY)
  });
});

// Main Chat API Endpoint
app.post('/api/chat', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Too many requests. Please slow down and try again in a minute.'
    });
  }

  const { messages } = req.body || {};

  // Validation: Check messages array
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: 'Invalid request body. "messages" array is required.'
    });
  }

  if (messages.length === 0) {
    return res.status(400).json({
      error: 'Conversation history cannot be empty.'
    });
  }

  if (messages.length > MAX_HISTORY_MESSAGES) {
    return res.status(400).json({
      error: `Conversation exceeds the maximum limit of ${MAX_HISTORY_MESSAGES} messages.`
    });
  }

  // Validate individual messages
  const validatedContents = [];
  const validRoles = new Set(['user', 'assistant', 'model']);

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (!msg || typeof msg !== 'object') {
      return res.status(400).json({
        error: `Message at index ${i} is invalid.`
      });
    }

    if (!msg.role || !validRoles.has(msg.role)) {
      return res.status(400).json({
        error: `Invalid role "${msg.role}" at index ${i}. Role must be "user" or "assistant".`
      });
    }

    if (typeof msg.content !== 'string' || msg.content.trim() === '') {
      return res.status(400).json({
        error: `Message content at index ${i} cannot be empty.`
      });
    }

    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Message at index ${i} exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`
      });
    }

    // Role mapping: Gemini SDK expects 'user' or 'model'
    const sdkRole = msg.role === 'assistant' ? 'model' : msg.role;

    // Check chronological order (alternation between user and model)
    if (i > 0) {
      const prevRole = validatedContents[i - 1].role;
      if (prevRole === sdkRole) {
        return res.status(400).json({
          error: `Malformed conversation order at index ${i}. Consecutive "${msg.role}" turns are not allowed.`
        });
      }
    }

    validatedContents.push({
      role: sdkRole,
      parts: [{ text: msg.content.trim() }]
    });
  }

  // The last message must be from the user
  const lastMessage = validatedContents[validatedContents.length - 1];
  if (lastMessage.role !== 'user') {
    return res.status(400).json({
      error: 'The last message in the conversation must be from the user.'
    });
  }

  // Check API key configuration after validating request payload
  if (!GEMINI_API_KEY || !aiClient) {
    return res.status(503).json({
      error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.'
    });
  }

  try {
    // Generate response using official @google/genai SDK
    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: validatedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: GENERATION_CONFIG.temperature,
        topP: GENERATION_CONFIG.topP,
        topK: GENERATION_CONFIG.topK
      }
    });

    const reply = response.text;

    if (!reply || reply.trim() === '') {
      return res.status(500).json({
        error: 'The model returned an empty response. Please rephrase or try again.'
      });
    }

    return res.json({ reply: reply.trim() });
  } catch (error) {
    const errorMsg = error?.message || String(error);
    console.error('Gemini API Error:', errorMsg);

    // Map common error patterns to user-friendly safe responses
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid') || error?.status === 401) {
      return res.status(401).json({
        error: 'The configured Gemini API key is invalid or unauthorized. Please verify your API key in the .env file.'
      });
    }

    if (errorMsg.includes('RESOURCE_EXHAUSTED') || error?.status === 429 || errorMsg.includes('quota')) {
      return res.status(429).json({
        error: 'Gemini API rate limit or quota exceeded. Please wait a moment and try again.'
      });
    }

    if (errorMsg.includes('NOT_FOUND') || errorMsg.includes('is not found') || errorMsg.includes('not supported') || error?.status === 404) {
      return res.status(404).json({
        error: `Configured model "${GEMINI_MODEL}" is unavailable or not supported. Check GEMINI_MODEL in .env.`
      });
    }

    if (errorMsg.includes('UNAVAILABLE') || errorMsg.includes('503') || error?.status === 503) {
      return res.status(503).json({
        error: 'Gemini service is temporarily unavailable. Please try again shortly.'
      });
    }

    return res.status(500).json({
      error: 'An unexpected error occurred while communicating with Gemini AI. Please try again.'
    });
  }
});

// Fallback error handler for invalid JSON or uncaught errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  console.error('Unhandled server error:', err.message);
  return res.status(500).json({ error: 'Internal server error.' });
});

// Start server when executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` MetaBot AI Server running at http://localhost:${PORT}`);
    console.log(` Configured Model : ${GEMINI_MODEL}`);
    console.log(` Gemini API Key   : ${GEMINI_API_KEY ? 'Configured [Active]' : 'Not Set [Configuration Required]'}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
