# MetaBot AI — Hacktiv8 Session 3 Conversational AI Chatbot

[![Node.js](https://img.shields.io/badge/Node.js-v24.14.0-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21.2-blue.svg)](https://expressjs.com/)
[![Google Gen AI SDK](https://img.shields.io/badge/@google/genai-v2.29.0-orange.svg)](https://www.npmjs.com/package/@google/genai)
[![License: ISC](https://img.shields.io/badge/License-ISC-brightgreen.svg)](https://opensource.org/licenses/ISC)

**MetaBot AI** is a modern, responsive, full-stack AI chatbot web application developed for the Hacktiv8 Session 3 assignment. Powered by the official Google Gemini `@google/genai` JavaScript SDK and an Express.js backend, MetaBot AI provides an intelligent conversational assistant for learning complex topics, drafting writing, brainstorming ideas, and programming guidance.

---

## Table of Contents

1. [Project Objectives](#1-project-objectives)
2. [Features](#2-features)
3. [Technology Stack](#3-technology-stack)
4. [Project Directory Structure](#4-project-directory-structure)
5. [Prerequisites](#5-prerequisites)
6. [Installation Instructions](#6-installation-instructions)
7. [How to Obtain a Gemini API Key](#7-how-to-obtain-a-gemini-api-key)
8. [How to Configure the .env File](#8-how-to-configure-the-env-file)
9. [How to Select a Supported Gemini Model](#9-how-to-select-a-supported-gemini-model)
10. [How to Run the Application Locally](#10-how-to-run-the-application-locally)
11. [How to Test the Chatbot](#11-how-to-test-the-chatbot)
12. [API Endpoint Documentation](#12-api-endpoint-documentation)
13. [Common Errors and Solutions](#13-common-errors-and-solutions)
14. [Security Notes](#14-security-notes)
15. [GitHub Publication Instructions](#15-github-publication-instructions)
16. [Assignment Deliverables & Screenshot Checklist](#16-assignment-deliverables--screenshot-checklist)

---

## 1. Project Objectives

The key goals of this assignment are:
- Accept natural-language queries from users in an intuitive web interface.
- Integrate the official Google Gemini AI SDK (`@google/genai`) to generate intelligent, context-aware responses.
- Maintain conversation context across multiple alternating turns within a session.
- Implement server-side input validation, strict role mapping, and security boundaries.
- Gracefully handle loading states, unconfigured keys, rate limits, and network errors.
- Ensure cross-device responsiveness (desktop, tablet, and mobile) without external frontend frameworks.
- Provide a clean, maintainable project structure ready for publication on GitHub.

---

## 2. Features

- **Modern Minimalist UI**: Built with a sleek Slate & Indigo design system, consistent typography (`Inter` and `JetBrains Mono`), smooth transitions, and accessible contrast.
- **Dark / Light Theme Toggle**: Seamless dual-theme support stored locally in `localStorage`.
- **Responsive Sidebar Drawer**:
  - "+ New Chat" button to initialize clean sessions.
  - Recent conversation history list with dynamic titles derived from the first user prompt.
  - Delete individual chats or switch between previous sessions.
  - Slide-out navigation drawer with backdrop overlay on mobile devices.
- **Interactive Welcome Screen**: Displays 4 clickable prompt suggestion cards (Complex Topics, Writing, Ideas, Programming) that immediately start a conversation.
- **Safe Markdown & Code Rendering**:
  - Code blocks with language labels and one-click **"Copy code"** buttons.
  - Headings, lists, quotes, and inline code formatting safely escaped to prevent Cross-Site Scripting (XSS).
- **Message Composer**:
  - Multiline auto-expanding `<textarea>` up to 180px.
  - Keyboard shortcuts: `Enter` to send, `Shift+Enter` for new line.
  - Dynamic character counter (`0 / 4000`).
  - Send button state management (disabled when empty or while waiting for AI).
  - Draft retention on network or server error so user prompts are never lost.
- **Thinking Indicator**: Animated 3-dot pulse indicator while waiting for Gemini.
- **One-Click Copy & Retry**: Copy AI responses to clipboard and retry failed requests with a single click.

---

## 3. Technology Stack

- **Frontend**:
  - HTML5 (Semantic elements, accessible labels)
  - CSS3 (Vanilla CSS variables, responsive Grid & Flexbox, dark/light theme tokens)
  - Vanilla JavaScript (ES6+, DOM API, `fetch()`, zero external UI frameworks)
- **Backend**:
  - Node.js (Runtime `v18+` or `v20+` / `v24+`)
  - Express.js (REST API, static asset hosting, input validation middleware)
- **AI Integration**:
  - Google Gemini API
  - Official `@google/genai` JavaScript SDK (`v2.29.0`)
- **Configuration & Security**:
  - `dotenv` (Environment variables management)
  - In-memory rate limiting and strict payload sanitization

---

## 4. Project Directory Structure

```text
chatBot/
├── public/
│   ├── index.html          # Main HTML5 layout and semantic components
│   ├── style.css           # Vanilla CSS design system (Dark & Light themes, mobile drawer)
│   └── script.js           # Client-side state manager, safe markdown parser, event handling
├── test/
│   └── backend-test.js     # Automated test suite for endpoints, validation, and error paths
├── index.js                # Express backend server with Gemini integration and security checks
├── package.json            # Node.js dependencies and run scripts
├── package-lock.json       # Deterministic dependency tree
├── .env.example            # Environment variables template
├── .gitignore              # Ignores .env, node_modules, and OS metadata
└── README.md               # Complete assignment guide and documentation
```

---

## 5. Prerequisites

Before installing, ensure your environment has:
- **Node.js**: `v18.0.0` or higher (verified on Node `v24.14.0`). Check with:
  ```bash
  node -v
  ```
- **npm**: `v9.0.0` or higher (verified on npm `11.9.0`). Check with:
  ```bash
  npm -v
  ```
- A modern web browser (Google Chrome, Firefox, Safari, or Microsoft Edge).
- A valid Google Gemini API key from Google AI Studio.

---

## 6. Installation Instructions

1. Clone or navigate to the project directory:
   ```bash
   cd /path/to/chatBot
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

3. Verify that all dependencies installed without errors:
   - `@google/genai`
   - `dotenv`
   - `express`

---

## 7. How to Obtain a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **"Get API key"** in the sidebar navigation.
4. Click **"Create API key"** (choose an existing Google Cloud project or create a free project).
5. Copy your newly generated API key.
   > **Note**: Keep this key confidential. Never commit your API key to GitHub or expose it in client-side code.

---

## 8. How to Configure the .env File

1. Duplicate `.env.example` to create a local `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your text editor and fill in your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   PORT=3000
   ```

3. Save the file.
   > **Safety Guarantee**: The `.gitignore` file includes `.env` to prevent accidental commits.

---

## 9. How to Select a Supported Gemini Model

The `GEMINI_MODEL` environment variable controls which Gemini model processes chat requests. Supported models through Google AI Studio include:

- `gemini-2.5-flash` *(Recommended default: fast, capable, cost-efficient)*
- `gemini-1.5-flash` *(Widely available standard tier)*
- `gemini-1.5-pro` *(High-reasoning model for complex logic)*

If not specified, MetaBot AI defaults to `gemini-2.5-flash`.

---

## 10. How to Run the Application Locally

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production / Standard Mode:
```bash
npm start
```

Once started, open your web browser and navigate to:
```text
http://localhost:3000
```

---

## 11. How to Test the Chatbot

### Automated Backend Tests
Run the included automated test suite to verify all endpoints and validation checks:
```bash
npm test
```
This tests:
- Static frontend file serving.
- `GET /api/health` response and model reporting.
- Rejection of empty bodies, malformed JSON, and empty message content (`400 Bad Request`).
- Rejection of invalid roles, consecutive non-alternating messages, and out-of-order history.
- Maximum conversation history bounds (`20` messages limit).
- Safe reporting of missing API key (`503 Service Unavailable`).

### Manual Functional Testing in Browser
1. **Welcome Screen**: Verify brand logo, "How can I help you today?" heading, and 4 suggested prompt cards.
2. **Suggested Prompt Cards**: Click any card (e.g. *"Explain a complex topic"*). Verify that the prompt is submitted and the welcome screen transitions to the chat view.
3. **Conversational Context**:
   - Send: *"My favorite programming language is JavaScript."*
   - Follow up with: *"What did I say my favorite language was?"*
   - Verify that Gemini remembers the answer from previous context.
4. **Theme Switcher**: Click the theme toggle button in the sidebar footer to switch between Dark and Light themes.
5. **New Chat**: Click "+ New Chat" to start a fresh thread.
6. **Mobile Responsiveness**: Open Developer Tools (F12) -> Toggle Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M) -> Test at iPhone SE (375px) width to verify the hamburger drawer.

---

## 12. API Endpoint Documentation

### 1. `GET /api/health`
Health check and backend configuration status.
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "appName": "MetaBot AI",
    "model": "gemini-2.5-flash",
    "apiKeyConfigured": true
  }
  ```

### 2. `POST /api/chat`
Submits a conversation history for Gemini AI generation.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "messages": [
      {
        "role": "user",
        "content": "Explain asynchronous programming in JavaScript."
      }
    ]
  }
  ```

- **Validation Rules**:
  - `messages` must be a non-empty array with maximum 20 items.
  - Allowed roles: `"user"`, `"assistant"`, or `"model"`.
  - Roles must alternate chronologically (`user` -> `model` -> `user`).
  - Last message must be from `"user"`.
  - Each message content string must be between 1 and 4,000 characters.

- **Success Response `200 OK`**:
  ```json
  {
    "reply": "Asynchronous programming in JavaScript allows long-running tasks..."
  }
  ```

- **Error Responses**:
  - `400 Bad Request`: Payload validation failed (e.g., malformed format, bad role).
  - `401 Unauthorized`: Gemini API key is invalid or unauthorized.
  - `404 Not Found`: Configured `GEMINI_MODEL` is unavailable.
  - `429 Too Many Requests`: IP rate limit (30 req/min) or Gemini quota exhausted.
  - `503 Service Unavailable`: API key is unconfigured or upstream service is temporarily down.

---

## 13. Common Errors and Solutions

| Error Message | Cause | Solution |
| :--- | :--- | :--- |
| `Gemini API key is not configured.` | `.env` file does not exist or `GEMINI_API_KEY` is empty. | Create `.env` from `.env.example` and insert your API key from Google AI Studio. |
| `The configured Gemini API key is invalid or unauthorized.` | The API key pasted into `.env` is incorrect or revoked. | Copy a fresh key from Google AI Studio and restart the server. |
| `Configured model ... is unavailable or not supported.` | The model identifier in `GEMINI_MODEL` is mistyped or retired. | Set `GEMINI_MODEL=gemini-2.5-flash` in `.env`. |
| `Too many requests. Please slow down...` | IP exceeded 30 requests within 60 seconds. | Wait one minute before making further requests. |
| `Address already in use :::3000` | Another process is already running on port 3000. | Change `PORT=3001` in `.env` or stop the conflicting process. |

---

## 14. Security Notes

- **Backend-Only Secrets**: The Gemini API key is exclusively loaded in Node.js via `dotenv`. It is never returned in HTTP responses or exposed to browser scripts.
- **XSS Prevention**: User and assistant messages are HTML-escaped before Markdown tokens are parsed, preventing `<script>` tag execution and arbitrary DOM injection.
- **Input Sanitization**: Client-provided conversation histories are strictly validated for length, size, role integrity, and alternation.
- **Rate Limiting**: An in-memory rate limiter protects `/api/chat` against denial-of-service spam (max 30 requests per minute per IP address).

---

## 15. GitHub Publication Instructions

To publish this project to your own GitHub account:

1. Check git status to ensure `.env` and `node_modules` are ignored:
   ```bash
   git status
   ```

2. Stage and commit the project files:
   ```bash
   git add .
   git commit -m "feat: complete MetaBot AI Hacktiv8 Session 3 implementation"
   ```

3. Rename the default branch to `main`:
   ```bash
   git branch -M main
   ```

4. Create a new repository on [GitHub](https://github.com/new).

5. Link your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   ```

6. Push your commits to GitHub:
   ```bash
   git push -u origin main
   ```

---

## 16. Assignment Deliverables & Screenshot Checklist

Prepare the following 4 screenshots for your submission:

- **Screenshot 1: Welcome Screen**
  - Navigate to `http://localhost:3000`.
  - Capture the desktop view showing the MetaBot AI branding, sidebar, 4 suggestion cards, and message composer.
- **Screenshot 2: Real AI Interaction**
  - Send a prompt (e.g., *"Explain how recursion works with a simple example"*).
  - Capture the screen showing your message and Gemini's response.
- **Screenshot 3: Conversational Memory**
  - Send a follow-up query relying on context (e.g., *"Can you convert the previous recursion code to an iterative loop?"*).
  - Capture the screen showing the continuous context retention.
- **Screenshot 4: Mobile Responsive View**
  - Toggle mobile emulation in browser DevTools (width `375px` to `420px`).
  - Open the mobile navigation drawer via the hamburger button and capture the responsive layout.
