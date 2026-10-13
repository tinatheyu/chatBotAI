/**
 * MetaBot AI — Backend Test Suite
 * Automated verification of endpoints, input validation, and security safeguards.
 */

const http = require('http');
const app = require('../index');

let server;
const PORT = 3999;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { ...headers }
    };

    let postData = null;
    if (body !== null) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   RUNNING METABOT AI BACKEND AUTOMATED TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, detail = '') {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName}`);
      if (detail) console.error(`        Detail: ${detail}`);
      failed++;
    }
  }

  // Start test server
  await new Promise(resolve => {
    server = app.listen(PORT, resolve);
  });

  try {
    // 1. Static file check
    const homeRes = await makeRequest('GET', '/');
    assert('Static files served (GET / returns 200 and HTML)', 
      homeRes.status === 200 && typeof homeRes.body === 'string' && homeRes.body.includes('MetaBot AI'),
      `Status: ${homeRes.status}`
    );

    // 2. Health check
    const healthRes = await makeRequest('GET', '/api/health');
    assert('Health Check (GET /api/health)',
      healthRes.status === 200 && healthRes.body.status === 'ok' && healthRes.body.appName === 'MetaBot AI',
      JSON.stringify(healthRes.body)
    );

    // 3. Reject empty request body
    const emptyBodyRes = await makeRequest('POST', '/api/chat', null);
    assert('POST /api/chat rejects empty body with 400',
      emptyBodyRes.status === 400 && typeof emptyBodyRes.body.error === 'string',
      `Status: ${emptyBodyRes.status}, Error: ${emptyBodyRes.body.error}`
    );

    // 4. Reject empty messages array
    const emptyMessagesRes = await makeRequest('POST', '/api/chat', { messages: [] });
    assert('POST /api/chat rejects empty messages array with 400',
      emptyMessagesRes.status === 400 && emptyMessagesRes.body.error.includes('empty'),
      `Status: ${emptyMessagesRes.status}, Error: ${emptyMessagesRes.body.error}`
    );

    // 5. Reject invalid role
    const invalidRoleRes = await makeRequest('POST', '/api/chat', {
      messages: [{ role: 'hacker', content: 'hello' }]
    });
    assert('POST /api/chat rejects invalid message role with 400',
      invalidRoleRes.status === 400 && invalidRoleRes.body.error.includes('role'),
      `Status: ${invalidRoleRes.status}, Error: ${invalidRoleRes.body.error}`
    );

    // 6. Reject empty message content
    const emptyContentRes = await makeRequest('POST', '/api/chat', {
      messages: [{ role: 'user', content: '   ' }]
    });
    assert('POST /api/chat rejects empty message content with 400',
      emptyContentRes.status === 400 && emptyContentRes.body.error.includes('empty'),
      `Status: ${emptyContentRes.status}, Error: ${emptyContentRes.body.error}`
    );

    // 7. Reject consecutive identical roles
    const consecutiveRes = await makeRequest('POST', '/api/chat', {
      messages: [
        { role: 'user', content: 'first' },
        { role: 'user', content: 'second' }
      ]
    });
    assert('POST /api/chat rejects consecutive user turns with 400',
      consecutiveRes.status === 400 && consecutiveRes.body.error.includes('Consecutive'),
      `Status: ${consecutiveRes.status}, Error: ${consecutiveRes.body.error}`
    );

    // 8. Reject last message not from user
    const lastNotUserRes = await makeRequest('POST', '/api/chat', {
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'second' }
      ]
    });
    assert('POST /api/chat rejects if last message is assistant with 400',
      lastNotUserRes.status === 400 && lastNotUserRes.body.error.includes('last message in the conversation must be from the user'),
      `Status: ${lastNotUserRes.status}, Error: ${lastNotUserRes.body.error}`
    );

    // 9. Reject history exceeding max limit
    const longHistory = [];
    for (let i = 0; i < 22; i++) {
      longHistory.push({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `message ${i}`
      });
    }
    const overflowRes = await makeRequest('POST', '/api/chat', { messages: longHistory });
    assert('POST /api/chat rejects history > 20 messages with 400',
      overflowRes.status === 400 && overflowRes.body.error.includes('exceeds the maximum limit'),
      `Status: ${overflowRes.status}, Error: ${overflowRes.body.error}`
    );

    // 10. Handle missing API key gracefully (or live API if key is present)
    const validChatPayload = {
      messages: [{ role: 'user', content: 'Hello MetaBot' }]
    };
    const chatRes = await makeRequest('POST', '/api/chat', validChatPayload);
    if (!process.env.GEMINI_API_KEY) {
      assert('POST /api/chat gracefully reports missing API key with 503',
        chatRes.status === 503 && chatRes.body.error.includes('Gemini API key is not configured'),
        `Status: ${chatRes.status}, Error: ${chatRes.body.error}`
      );
    } else {
      assert('POST /api/chat generates reply with configured API key',
        chatRes.status === 200 && typeof chatRes.body.reply === 'string',
        `Status: ${chatRes.status}, Reply: ${JSON.stringify(chatRes.body)}`
      );
    }

  } finally {
    server.close();
  }

  console.log('\n------------------------------------------------------');
  console.log(` Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
