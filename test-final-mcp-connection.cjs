#!/usr/bin/env node

// Test the final MCP server connection
const { spawn } = require('child_process');

console.log('🔍 Testing FINAL MCP server with corrected OAuth...\n');

const serverProcess = spawn('node', ['/Users/raphaelberrebi/mcp-outreach-server/dist/index.js'], {
  cwd: '/Users/raphaelberrebi/mcp-outreach-server',
  env: {
    ...process.env,
    OUTREACH_CLIENT_ID: "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug",
    OUTREACH_CLIENT_SECRET: "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6",
    OUTREACH_REFRESH_TOKEN: "shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s",
    OUTREACH_API_BASE_URL: "https://api.outreach.io/api/v2"
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let success = false;
let initTimeout;

serverProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log('📝 Server stderr:', output);
  
  // Look for success indicators
  if (output.includes('✅ Access token obtained successfully')) {
    console.log('\n🎉 SUCCESS: OAuth token obtained!');
    success = true;
  }
  
  if (output.includes('✅ MCP Outreach server initialized with OAuth credentials')) {
    console.log('🎉 SUCCESS: MCP server fully initialized!');
    success = true;
    clearTimeout(initTimeout);
    setTimeout(() => serverProcess.kill(), 2000);
  }
  
  // Look for failure indicators
  if (output.includes('❌ Failed to initialize MCP client') || output.includes('invalid_client')) {
    console.log('\n❌ FAILURE: OAuth initialization failed');
    clearTimeout(initTimeout);
    setTimeout(() => serverProcess.kill(), 1000);
  }
});

serverProcess.stdout.on('data', (data) => {
  console.log('📝 Server stdout:', data.toString().trim());
});

serverProcess.on('error', (error) => {
  console.log('❌ Server error:', error);
});

serverProcess.on('exit', (code) => {
  console.log(`\n🔚 Server exited with code: ${code}`);
  clearTimeout(initTimeout);
  
  if (success) {
    console.log('🎉 OAuth authentication is now working correctly!');
    console.log('✅ Claude Desktop should be able to connect without errors.');
  } else {
    console.log('❌ There may still be issues with OAuth authentication.');
  }
});

// Send initialize message after a brief delay
setTimeout(() => {
  const initMessage = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  }) + '\n';
  
  console.log('📤 Sending initialize message...');
  serverProcess.stdin.write(initMessage);
}, 5000);

// Kill server after 15 seconds if not finished
initTimeout = setTimeout(() => {
  console.log('\n⏰ Timeout - killing server...');
  serverProcess.kill();
}, 15000);