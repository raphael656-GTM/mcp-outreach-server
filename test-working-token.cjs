#!/usr/bin/env node

// Test with the exact working token from previous test
const axios = require('axios');

async function testWorkingToken() {
  console.log('🔐 Testing with EXACT working token from previous test...\n');
  
  const clientId = "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug";
  const clientSecret = "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6";
  const workingRefreshToken = "CpQMFk81S4vdorPMFx_BHnFqhV0mM2f5z4nJj5gNdxo";
  
  try {
    const response = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,  
      refresh_token: workingRefreshToken,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ OAuth token refresh SUCCESSFUL!');
    console.log('📊 Response:');
    console.log(`- Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    
    // Update .env with the latest refresh token
    const fs = require('fs');
    const envPath = '/Users/raphaelberrebi/mcp-outreach-server/.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(
      /OUTREACH_REFRESH_TOKEN=.*/,
      `OUTREACH_REFRESH_TOKEN=${response.data.refresh_token}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Updated .env with latest refresh token');
    console.log('🔧 Now restart Claude Desktop and test!');
    
  } catch (error) {
    console.log('❌ Token refresh failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
  }
}

testWorkingToken();