#!/usr/bin/env node

// Test the MCP server directly to see what credentials it's using
const { spawn } = require('child_process');

console.log('🔍 Testing MCP server directly to see credential loading...\n');

const serverProcess = spawn('node', ['/Users/raphaelberrebi/mcp-outreach-server/dist/index.js'], {
  cwd: '/Users/raphaelberrebi/mcp-outreach-server',
  env: {
    ...process.env,
    OUTREACH_CLIENT_ID: "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug",
    OUTREACH_CLIENT_SECRET: "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6",
    OUTREACH_REFRESH_TOKEN: "CpQMFk81S4vdorPMFx_BHnFqhV0mM2f5z4nJj5gNdxo",
    OUTREACH_API_BASE_URL: "https://api.outreach.io/api/v2"
  }
});

serverProcess.stderr.on('data', (data) => {
  console.log('📝 Server stderr:', data.toString().trim());
});

serverProcess.stdout.on('data', (data) => {
  console.log('📝 Server stdout:', data.toString().trim());
});

serverProcess.on('error', (error) => {
  console.log('❌ Server error:', error);
});

serverProcess.on('exit', (code) => {
  console.log(`\n🔚 Server exited with code: ${code}`);
});

// Kill the server after 10 seconds
setTimeout(() => {
  console.log('\n⏰ Killing server after 10 seconds...');
  serverProcess.kill();
}, 10000);