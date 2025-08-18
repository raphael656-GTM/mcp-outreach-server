#!/usr/bin/env node

// Test script for MCP Outreach Server
import { spawn } from 'child_process';
import { config } from 'dotenv';

config();

console.log('🧪 Testing MCP Outreach Server...\n');

// Test that starts the MCP server and sends a test request
const testMCPServer = () => {
  return new Promise((resolve, reject) => {
    console.log('📡 Starting MCP server...');
    
    // Start the MCP server
    const mcpServer = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    mcpServer.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📝 Server output:', data.toString().trim());
    });

    mcpServer.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('⚠️ Server stderr:', data.toString().trim());
      
      // Check if server is ready
      if (data.toString().includes('MCP Outreach server running')) {
        console.log('✅ MCP server is running!\n');
        
        // Send a test request to list tools
        console.log('🔧 Testing list_tools request...');
        const listToolsRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list'
        };
        
        mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');
        
        // Wait for response
        setTimeout(() => {
          mcpServer.kill();
          resolve({ output, errorOutput });
        }, 5000);
      }
    });

    mcpServer.on('error', (error) => {
      console.error('❌ Failed to start MCP server:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      mcpServer.kill();
      reject(new Error('Test timed out'));
    }, 30000);
  });
};

// Run the test
testMCPServer()
  .then(({ output, errorOutput }) => {
    console.log('\n📊 Test Results:');
    console.log('✅ MCP server started successfully');
    if (output.includes('tools')) {
      console.log('✅ Tools endpoint responded');
    }
    if (errorOutput.includes('OAuth') || errorOutput.includes('token')) {
      console.log('⚠️ OAuth flow initiated (expected for first run)');
    }
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });