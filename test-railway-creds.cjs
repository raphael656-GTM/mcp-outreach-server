#!/usr/bin/env node

// Test Railway deployment credentials
const https = require('https');

async function testRailwayCredentials() {
  console.log('🔍 Testing Railway deployment credentials...\n');
  
  const url = 'https://mcp-outreach-server-production.up.railway.app/health';
  
  console.log(`📡 Making request to: ${url}`);
  
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}`);
        console.log(`📄 Response Headers:`, res.headers);
        console.log(`📝 Response Body:`, data);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('\n✅ Railway deployment is responding');
            console.log('🔍 Health check details:', JSON.stringify(response, null, 2));
          } catch (e) {
            console.log('\n⚠️ Railway responded but not with JSON:', data);
          }
        } else {
          console.log('\n❌ Railway deployment issue - status:', res.statusCode);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Railway request failed:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Railway request timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

testRailwayCredentials().catch(console.error);