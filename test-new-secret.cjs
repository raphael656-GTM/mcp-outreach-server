#!/usr/bin/env node

// Test new secret credentials
const axios = require('axios');

async function testNewSecret() {
  console.log('🔐 Testing NEW Client Secret...\n');
  
  const clientId = "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug";
  const clientSecret = "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6";
  const oldRefreshToken = "N0ts8xaF4BjHVtxaBlHrWKm97R1kJvVSSl80cpZn0Mc";
  
  console.log('📋 Testing with:');
  console.log(`Client ID: ${clientId.substring(0, 20)}...`);
  console.log(`NEW Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`Old Refresh Token: ${oldRefreshToken.substring(0, 20)}...\n`);
  
  try {
    console.log('🔄 Testing if old refresh token still works with new secret...');
    
    const response = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,  
      refresh_token: oldRefreshToken,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS! Old refresh token works with new secret!');
    console.log('📊 Response:');
    console.log(`- Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- NEW Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    console.log('\n🔧 You can now test Claude Desktop - OAuth should work!');
    
  } catch (error) {
    console.log('❌ Old refresh token failed with new secret\n');
    
    if (error.response) {
      console.log('📊 Error Details:');
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.data.error === 'invalid_grant') {
        console.log('\n💡 Need to re-authorize to get new refresh token with new secret');
        console.log('🔧 Run: npm run setup');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testNewSecret();