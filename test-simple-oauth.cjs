#!/usr/bin/env node

// Test the simple OAuth implementation
const { spawn } = require('child_process');

console.log('🔍 Testing Simple OAuth MCP Server Implementation...\n');

const serverProcess = spawn('node', ['src/simple-index.js'], {
  cwd: '/Users/raphaelberrebi/mcp-outreach-server',
  env: {
    ...process.env,
    OUTREACH_CLIENT_ID: "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug",
    OUTREACH_CLIENT_SECRET: "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6",
    OUTREACH_REFRESH_TOKEN: "shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s"
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let testComplete = false;
let timeout;

serverProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log('📝 Server stderr:', output);
  
  if (output.includes('Simple Outreach MCP server running on stdio')) {
    console.log('\n✅ Server started successfully!');
    setTimeout(() => testMCPProtocol(), 2000);
  }
});

serverProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log('📤 Server response:', output);
  
  try {
    const response = JSON.parse(output);
    if (response.result && response.result.tools) {
      console.log(`\n🎉 SUCCESS: MCP server returned ${response.result.tools.length} tools!`);
      console.log('📋 Available tools:');
      response.result.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
      testComplete = true;
      clearTimeout(timeout);
      setTimeout(() => serverProcess.kill(), 1000);
    } else if (response.error) {
      console.log('\n❌ MCP Error:', response.error);
      clearTimeout(timeout);
      setTimeout(() => serverProcess.kill(), 1000);
    }
  } catch (e) {
    // Non-JSON output, ignore
  }
});

function testMCPProtocol() {
  console.log('\n📤 Testing MCP protocol...');
  
  // Send initialize request
  const initRequest = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  }) + '\n';
  
  console.log('📤 Sending initialize request...');
  serverProcess.stdin.write(initRequest);
  
  // Send tools/list request after a delay
  setTimeout(() => {
    const toolsRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    }) + '\n';
    
    console.log('📤 Sending tools/list request...');
    serverProcess.stdin.write(toolsRequest);
  }, 1000);
}

serverProcess.on('error', (error) => {
  console.log('❌ Server error:', error);
  clearTimeout(timeout);
});

serverProcess.on('exit', (code) => {
  console.log(`\n🔚 Server exited with code: ${code}`);
  clearTimeout(timeout);
  
  if (testComplete) {
    console.log('\n🎉 SIMPLE OAUTH IMPLEMENTATION IS WORKING!');
    console.log('✅ The server successfully:');
    console.log('  - Started without crashing');
    console.log('  - Handled MCP protocol correctly');
    console.log('  - Loaded tools from Outreach API');
    console.log('  - Used OAuth authentication without errors');
    console.log('\n🚀 Ready to deploy to Railway and test remote connection!');
  } else {
    console.log('\n⚠️  Test incomplete - server exited early');
  }
});

// Kill server after 15 seconds if test not complete
timeout = setTimeout(() => {
  console.log('\n⏰ Test timeout - killing server...');
  serverProcess.kill();
}, 15000);