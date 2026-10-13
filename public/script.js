/**
 * MetaBot AI — Client Application
 * Hacktiv8 Session 3 Conversational AI Chatbot
 */

(function () {
  'use strict';

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const STORAGE_KEY = 'metabot_ai_conversations';
  const ACTIVE_ID_KEY = 'metabot_ai_active_id';
  const THEME_KEY = 'metabot_ai_theme';

  let conversations = [];
  let activeConversationId = null;
  let isGenerating = false;

  // DOM Elements
  const appContainer = document.getElementById('app-container');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const newChatBtn = document.getElementById('new-chat-btn');
  const conversationList = document.getElementById('conversation-list');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeLabel = document.getElementById('theme-label');

  const chatTitle = document.getElementById('chat-title');
  const statusText = document.getElementById('status-text');
  const modelTag = document.getElementById('model-tag');
  const clearChatBtn = document.getElementById('clear-chat-btn');

  const chatViewport = document.getElementById('chat-viewport');
  const welcomeScreen = document.getElementById('welcome-screen');
  const promptGrid = document.getElementById('prompt-grid');
  const messagesContainer = document.getElementById('messages-container');
  const typingIndicator = document.getElementById('typing-indicator');

  const composerForm = document.getElementById('composer-form');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const charCount = document.getElementById('char-count');

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    loadTheme();
    loadConversations();
    setupEventListeners();
    fetchBackendHealth();
    renderCurrentConversation();
  }

  // =========================================================================
  // THEME HANDLING
  // =========================================================================

  function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'theme-dark';
    document.body.className = savedTheme;
    updateThemeLabel(savedTheme);
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'theme-light' : 'theme-dark';
    document.body.className = newTheme;
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeLabel(newTheme);
  }

  function updateThemeLabel(theme) {
    if (themeLabel) {
      themeLabel.textContent = theme === 'theme-dark' ? 'Dark Theme' : 'Light Theme';
    }
  }

  // =========================================================================
  // STORAGE & CONVERSATION MANAGEMENT
  // =========================================================================

  function loadConversations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      conversations = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to parse stored conversations:', e);
      conversations = [];
    }

    const activeId = localStorage.getItem(ACTIVE_ID_KEY);
    if (activeId && conversations.some(c => c.id === activeId)) {
      activeConversationId = activeId;
    } else if (conversations.length > 0) {
      activeConversationId = conversations[0].id;
    } else {
      createNewConversation(false);
    }
  }

  function saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      if (activeConversationId) {
        localStorage.setItem(ACTIVE_ID_KEY, activeConversationId);
      }
    } catch (e) {
      console.warn('Failed to save conversations:', e);
    }
  }

  function createNewConversation(switchNow = true) {
    const newConv = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: 'New Conversation',
      createdAt: Date.now(),
      messages: []
    };

    conversations.unshift(newConv);
    if (switchNow) {
      activeConversationId = newConv.id;
    }
    saveConversations();
    renderSidebarList();
    renderCurrentConversation();
    userInput.focus();
  }

  function getActiveConversation() {
    return conversations.find(c => c.id === activeConversationId);
  }

  function deleteConversation(id, event) {
    if (event) {
      event.stopPropagation();
    }
    conversations = conversations.filter(c => c.id !== id);
    if (activeConversationId === id) {
      activeConversationId = conversations.length > 0 ? conversations[0].id : null;
      if (!activeConversationId) {
        createNewConversation(false);
      }
    }
    saveConversations();
    renderSidebarList();
    renderCurrentConversation();
  }

  function clearCurrentConversation() {
    const conv = getActiveConversation();
    if (!conv || conv.messages.length === 0) return;

    if (confirm('Are you sure you want to clear this conversation?')) {
      conv.messages = [];
      conv.title = 'New Conversation';
      saveConversations();
      renderSidebarList();
      renderCurrentConversation();
    }
  }

  // =========================================================================
  // BACKEND HEALTH & CONFIG
  // =========================================================================

  async function fetchBackendHealth() {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.model && modelTag) {
          modelTag.textContent = data.model;
        }
        if (statusText) {
          statusText.textContent = data.apiKeyConfigured ? 'MetaBot Ready' : 'API Key Missing';
          const indicator = document.querySelector('.status-indicator');
          if (indicator) {
            indicator.style.backgroundColor = data.apiKeyConfigured ? '#10b981' : '#f59e0b';
          }
        }
      }
    } catch (err) {
      if (statusText) {
        statusText.textContent = 'Server Offline';
        const indicator = document.querySelector('.status-indicator');
        if (indicator) {
          indicator.style.backgroundColor = '#ef4444';
        }
      }
    }
  }

  // =========================================================================
  // RENDERING
  // =========================================================================

  function renderSidebarList() {
    conversationList.innerHTML = '';

    if (conversations.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'conversation-empty';
      emptyNotice.textContent = 'No conversations yet';
      conversationList.appendChild(emptyNotice);
      return;
    }

    conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'conversation-item' + (conv.id === activeConversationId ? ' active' : '');
      item.title = conv.title;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'conversation-title-text';
      titleSpan.textContent = conv.title || 'New Conversation';

      const delBtn = document.createElement('button');
      delBtn.className = 'conversation-delete-btn';
      delBtn.setAttribute('aria-label', 'Delete conversation');
      delBtn.title = 'Delete';
      delBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;

      delBtn.addEventListener('click', (e) => deleteConversation(conv.id, e));

      item.addEventListener('click', () => {
        if (activeConversationId !== conv.id) {
          activeConversationId = conv.id;
          saveConversations();
          renderSidebarList();
          renderCurrentConversation();
          closeMobileSidebar();
        }
      });

      item.appendChild(titleSpan);
      item.appendChild(delBtn);
      conversationList.appendChild(item);
    });
  }

  function renderCurrentConversation() {
    const conv = getActiveConversation();
    renderSidebarList();

    if (!conv || conv.messages.length === 0) {
      welcomeScreen.style.display = 'flex';
      messagesContainer.innerHTML = '';
      chatTitle.textContent = 'New Conversation';
      return;
    }

    welcomeScreen.style.display = 'none';
    chatTitle.textContent = conv.title;
    messagesContainer.innerHTML = '';

    conv.messages.forEach((msg, index) => {
      appendMessageToDOM(msg.role, msg.content, msg.isError, index);
    });

    scrollToBottom();
  }

  function appendMessageToDOM(role, content, isError = false, messageIndex = null) {
    const row = document.createElement('div');
    row.className = `message-row ${role === 'user' ? 'user-row' : 'assistant-row'}`;

    if (role === 'assistant') {
      const avatar = document.createElement('div');
      avatar.className = 'avatar assistant-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a8 8 0 0 0-8 8v12l4-4h8a8 8 0 0 0 8-8V6a4 4 0 0 0-4-4h-8z"/>
        </svg>
      `;
      row.appendChild(avatar);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'message-bubble-wrapper' + (isError ? ' error-bubble' : '');

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (role === 'user') {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = renderSafeMarkdown(content);
      attachCodeCopyButtons(bubble);
    }
    wrapper.appendChild(bubble);

    // Message action bar (Copy & Retry buttons)
    if (role === 'assistant') {
      const actions = document.createElement('div');
      actions.className = 'message-actions';

      if (!isError) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-response-btn';
        copyBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        `;
        copyBtn.addEventListener('click', () => copyToClipboard(content, copyBtn));
        actions.appendChild(copyBtn);
      } else {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'action-btn retry-btn';
        retryBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>Retry</span>
        `;
        retryBtn.addEventListener('click', () => handleRetry());
        actions.appendChild(retryBtn);
      }

      wrapper.appendChild(actions);
    }

    if (role === 'user') {
      const avatar = document.createElement('div');
      avatar.className = 'avatar user-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = 'U';
      row.appendChild(wrapper);
      row.appendChild(avatar);
    } else {
      row.appendChild(wrapper);
    }

    messagesContainer.appendChild(row);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  // =========================================================================
  // SAFE MARKDOWN RENDERING
  // =========================================================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderSafeMarkdown(markdownText) {
    if (!markdownText) return '';

    // First safely escape all HTML tags to prevent XSS
    let escaped = escapeHtml(markdownText);

    // Replace code blocks: ```lang\ncode\n```
    escaped = escaped.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function (match, lang, code) {
      const language = lang || 'code';
      return `<div class="code-block-wrapper">
        <div class="code-header">
          <span>${language}</span>
          <button class="code-copy-btn" data-code="${encodeURIComponent(code)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy code</span>
          </button>
        </div>
        <pre><code>${code}</code></pre>
      </div>`;
    });

    // Inline code: `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    escaped = escaped.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    escaped = escaped.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italics
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Blockquotes
    escaped = escaped.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Unordered lists
    escaped = escaped.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    escaped = escaped.replace(/(<li>.*<\/li>)/gims, function (match) {
      if (!match.startsWith('<ul>')) {
        return `<ul>${match}</ul>`;
      }
      return match;
    });

    // Paragraph breaks
    const paragraphs = escaped.split(/\n{2,}/);
    const htmlOutput = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<div class="code-block-wrapper"') ||
          p.startsWith('<h1') || p.startsWith('<h2') || p.startsWith('<h3') ||
          p.startsWith('<ul>') || p.startsWith('<blockquote>')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return htmlOutput;
  }

  function attachCodeCopyButtons(container) {
    const copyBtns = container.querySelectorAll('.code-copy-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const encodedCode = btn.getAttribute('data-code');
        const code = decodeURIComponent(encodedCode);
        navigator.clipboard.writeText(code).then(() => {
          const original = btn.innerHTML;
          btn.innerHTML = `<span>Copied!</span>`;
          setTimeout(() => {
            btn.innerHTML = original;
          }, 2000);
        }).catch(err => {
          console.error('Copy failed:', err);
        });
      });
    });
  }

  function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHtml = buttonElement.innerHTML;
      buttonElement.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copied!</span>
      `;
      setTimeout(() => {
        buttonElement.innerHTML = originalHtml;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy message:', err);
    });
  }

  // =========================================================================
  // MESSAGE SENDING & CHAT FLOW
  // =========================================================================

  async function handleSend(customText = null) {
    if (isGenerating) return;

    const rawText = customText !== null ? customText : userInput.value;
    const trimmedText = rawText.trim();

    if (!trimmedText) return;

    const conv = getActiveConversation();
    if (!conv) {
      createNewConversation(true);
    }

    const currentConv = getActiveConversation();

    // Set conversation title based on first user message
    if (currentConv.messages.length === 0) {
      const title = trimmedText.length > 28 ? trimmedText.substring(0, 28) + '...' : trimmedText;
      currentConv.title = title;
      chatTitle.textContent = title;
    }

    // Append user message to state
    currentConv.messages.push({
      role: 'user',
      content: trimmedText,
      timestamp: Date.now()
    });

    saveConversations();
    renderSidebarList();

    // Update UI
    welcomeScreen.style.display = 'none';
    appendMessageToDOM('user', trimmedText);

    // Reset composer textarea if using input
    if (customText === null) {
      userInput.value = '';
      adjustTextareaHeight();
      updateCharCount();
    }

    // Set loading state
    isGenerating = true;
    sendBtn.disabled = true;
    showTypingIndicator(true);

    try {
      // Build chronological messages payload for Gemini
      // Filter out error messages to keep context clean
      const payloadMessages = currentConv.messages
        .filter(m => !m.isError)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: payloadMessages })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      if (!data.reply) {
        throw new Error('Received empty response from server.');
      }

      // Append assistant reply to state
      currentConv.messages.push({
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now()
      });

      saveConversations();
      appendMessageToDOM('assistant', data.reply);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err.message || 'Unable to connect to server. Please try again.';

      // Store error state in conversation
      currentConv.messages.push({
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        isError: true,
        timestamp: Date.now()
      });

      saveConversations();
      appendMessageToDOM('assistant', `⚠️ ${errorMessage}`, true);
    } finally {
      isGenerating = false;
      showTypingIndicator(false);
      sendBtn.disabled = userInput.value.trim().length === 0;
      userInput.focus();
    }
  }

  function handleRetry() {
    const conv = getActiveConversation();
    if (!conv || conv.messages.length === 0 || isGenerating) return;

    // Remove the trailing error message if present
    if (conv.messages[conv.messages.length - 1].isError) {
      conv.messages.pop();
    }

    // Find the last user message
    const lastUserMsg = conv.messages[conv.messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      saveConversations();
      renderCurrentConversation();

      // Set loading state
      isGenerating = true;
      sendBtn.disabled = true;
      showTypingIndicator(true);

      const payloadMessages = conv.messages
        .filter(m => !m.isError)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages })
      })
        .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
        .then(({ ok, data, status }) => {
          if (!ok) {
            throw new Error(data.error || `Server error ${status}`);
          }
          conv.messages.push({
            role: 'assistant',
            content: data.reply,
            timestamp: Date.now()
          });
          saveConversations();
          appendMessageToDOM('assistant', data.reply);
        })
        .catch(err => {
          const errMsg = err.message || 'Retry failed. Check your network or API key.';
          conv.messages.push({
            role: 'assistant',
            content: `Error: ${errMsg}`,
            isError: true,
            timestamp: Date.now()
          });
          saveConversations();
          appendMessageToDOM('assistant', `⚠️ ${errMsg}`, true);
        })
        .finally(() => {
          isGenerating = false;
          showTypingIndicator(false);
          sendBtn.disabled = userInput.value.trim().length === 0;
        });
    }
  }

  function showTypingIndicator(show) {
    if (show) {
      typingIndicator.style.display = 'flex';
      scrollToBottom();
    } else {
      typingIndicator.style.display = 'none';
    }
  }

  // =========================================================================
  // INPUT COMPOSER HELPERS
  // =========================================================================

  function adjustTextareaHeight() {
    userInput.style.height = 'auto';
    const newHeight = Math.min(userInput.scrollHeight, 180);
    userInput.style.height = `${newHeight}px`;
  }

  function updateCharCount() {
    const len = userInput.value.length;
    charCount.textContent = `${len} / 4000`;
    sendBtn.disabled = len === 0 || isGenerating;
  }

  // =========================================================================
  // MOBILE SIDEBAR DRAWER
  // =========================================================================

  function openMobileSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }

  // =========================================================================
  // EVENT LISTENERS
  // =========================================================================

  function setupEventListeners() {
    // New chat button
    newChatBtn.addEventListener('click', () => {
      createNewConversation(true);
      closeMobileSidebar();
    });

    // Clear current chat
    clearChatBtn.addEventListener('click', clearCurrentConversation);

    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Mobile sidebar triggers
    mobileMenuBtn.addEventListener('click', openMobileSidebar);
    sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
    sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Suggested prompt cards
    const cards = promptGrid.querySelectorAll('.prompt-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const promptText = card.getAttribute('data-prompt');
        if (promptText) {
          handleSend(promptText);
        }
      });
    });

    // Form submit
    composerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSend();
    });

    // Textarea input and key shortcuts
    userInput.addEventListener('input', () => {
      adjustTextareaHeight();
      updateCharCount();
    });

    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (userInput.value.trim().length > 0 && !isGenerating) {
          handleSend();
        }
      }
    });
  }

  // Start app
  document.addEventListener('DOMContentLoaded', init);
})();
