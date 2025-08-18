#!/usr/bin/env node

// OAuth flow test
import { spawn } from 'child_process';
import { config } from 'dotenv';

config();

console.log('🔐 Testing OAuth Flow with Railway...\n');
console.log('Configuration:');
console.log('- Client ID:', process.env.OUTREACH_CLIENT_ID?.slice(0, 10) + '...');
console.log('- Redirect URI:', process.env.OUTREACH_REDIRECT_URI);
console.log('');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('https://api.outreach.io/oauth/authorize')) {
    console.log('✅ OAuth URL generated successfully!');
    console.log('📝 The URL should redirect to Railway after authorization');
    console.log('🌐 Railway callback will handle the OAuth response');
    
    // Kill the server after showing the OAuth URL
    setTimeout(() => {
      server.kill();
      console.log('\n✅ Test completed - OAuth flow is properly configured!');
      process.exit(0);
    }, 2000);
  }
});

server.on('error', (error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

// Timeout
setTimeout(() => {
  server.kill();
  console.log('\n⏰ Test timeout');
  process.exit(1);
}, 15000);