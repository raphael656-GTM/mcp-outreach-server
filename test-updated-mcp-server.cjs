#!/usr/bin/env node

// Test the updated MCP server with direct OAuth implementation
const { spawn } = require('child_process');

console.log('🔍 Testing UPDATED MCP server with direct OAuth...\n');

const serverProcess = spawn('node', ['/Users/raphaelberrebi/mcp-outreach-server/dist/index.js'], {
  cwd: '/Users/raphaelberrebi/mcp-outreach-server',
  env: {
    ...process.env,
    OUTREACH_CLIENT_ID: "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug",
    OUTREACH_CLIENT_SECRET: "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6",
    OUTREACH_REFRESH_TOKEN: "rsFNXxa8vwoU_doiUz3wx2_M4nI-kUsyH4tRpvIJLmc",
    OUTREACH_API_BASE_URL: "https://api.outreach.io/api/v2"
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let initTimeout;

serverProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log('📝 Server stderr:', output);
  
  // Look for specific success/failure indicators
  if (output.includes('✅ Access token obtained successfully')) {
    console.log('\n🎉 SUCCESS: OAuth token obtained!');
    clearTimeout(initTimeout);
    setTimeout(() => serverProcess.kill(), 2000); // Give it 2 more seconds
  }
  
  if (output.includes('❌') || output.includes('Failed to initialize')) {
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
});

// Send a simple JSON-RPC message to test initialization
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
}, 3000);

// Kill the server after 15 seconds if it hasn't finished
initTimeout = setTimeout(() => {
  console.log('\n⏰ Killing server after timeout...');
  serverProcess.kill();
}, 15000);