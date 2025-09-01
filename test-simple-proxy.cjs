#!/usr/bin/env node

// Test the simple proxy against the currently deployed Railway server
const { spawn } = require('child_process');

console.log('🔍 Testing Simple Proxy Connection...\n');

const proxyProcess = spawn('node', ['simple-outreach-proxy.js'], {
  cwd: '/Users/raphaelberrebi/mcp-outreach-server',
  env: {
    ...process.env,
    RAILWAY_URL: "https://mcp-outreach-server-production.up.railway.app",
    OUTREACH_REFRESH_TOKEN: "shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s"
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let testComplete = false;
let timeout;

proxyProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log('📝 Proxy stderr:', output);
  
  if (output.includes('Connected to Outreach MCP Server')) {
    console.log('\n✅ Proxy connected to Railway server!');
    setTimeout(() => testProxyProtocol(), 2000);
  } else if (output.includes('Cannot connect to server')) {
    console.log('\n❌ Proxy cannot connect to Railway server');
    clearTimeout(timeout);
    setTimeout(() => proxyProcess.kill(), 1000);
  }
});

proxyProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log('📤 Proxy response:', output);
  
  try {
    const response = JSON.parse(output);
    if (response.result && response.result.tools) {
      console.log(`\n🎉 SUCCESS: Proxy returned ${response.result.tools.length} tools from Railway!`);
      testComplete = true;
      clearTimeout(timeout);
      setTimeout(() => proxyProcess.kill(), 1000);
    } else if (response.error) {
      console.log('\n❌ Proxy Error:', response.error);
      clearTimeout(timeout);
      setTimeout(() => proxyProcess.kill(), 1000);
    }
  } catch (e) {
    // Non-JSON output, ignore
  }
});

function testProxyProtocol() {
  console.log('\n📤 Testing proxy MCP protocol...');
  
  // Send tools/list request
  const toolsRequest = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  }) + '\n';
  
  console.log('📤 Sending tools/list request through proxy...');
  proxyProcess.stdin.write(toolsRequest);
}

proxyProcess.on('error', (error) => {
  console.log('❌ Proxy error:', error);
  clearTimeout(timeout);
});

proxyProcess.on('exit', (code) => {
  console.log(`\n🔚 Proxy exited with code: ${code}`);
  clearTimeout(timeout);
  
  if (testComplete) {
    console.log('\n🎉 SIMPLE PROXY IS WORKING WITH RAILWAY!');
    console.log('✅ The proxy successfully:');
    console.log('  - Connected to Railway deployment');
    console.log('  - Forwarded MCP requests correctly');
    console.log('  - Returned tools from remote server');
  } else {
    console.log('\n⚠️  Proxy test incomplete - may need Railway redeploy');
  }
});

// Kill proxy after 15 seconds if test not complete
timeout = setTimeout(() => {
  console.log('\n⏰ Test timeout - killing proxy...');
  proxyProcess.kill();
}, 15000);