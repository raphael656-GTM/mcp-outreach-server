#!/usr/bin/env node

// Test with exact credentials from Claude Desktop config
const axios = require('axios');

async function testClaudeDesktopCredentials() {
  console.log('🔐 Testing with EXACT Claude Desktop config credentials...\n');
  
  const clientId = "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug";
  const clientSecret = "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6";
  const refreshToken = "CpQMFk81S4vdorPMFx_BHnFqhV0mM2f5z4nJj5gNdxo";
  
  console.log('📋 Using credentials:');
  console.log(`Client ID: ${clientId.substring(0, 20)}...`);
  console.log(`Client Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`Refresh Token: ${refreshToken.substring(0, 20)}...`);
  
  try {
    console.log('\n🔄 Making OAuth token refresh request...');
    
    const response = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,  
      refresh_token: refreshToken,
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
    console.log(`- Status: ${response.status}`);
    console.log(`- Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    console.log(`- Token Type: ${response.data.token_type}`);
    
    console.log('\n🧪 Testing API call with new access token...');
    
    const apiResponse = await axios.get('https://api.outreach.io/api/v2/sequences?page[limit]=1', {
      headers: {
        'Authorization': `Bearer ${response.data.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ API call successful!');
    console.log(`- API Status: ${apiResponse.status}`);
    console.log(`- Sequences found: ${apiResponse.data.data?.length || 0}`);
    
    console.log('\n🎉 OAuth flow is working perfectly with Claude Desktop credentials!');
    
  } catch (error) {
    console.log('❌ Token refresh or API call failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
    
    if (error.response?.data?.error === 'invalid_client') {
      console.log('\n💡 The client credentials are invalid or the OAuth app is disabled');
    } else if (error.response?.data?.error === 'invalid_grant') {
      console.log('\n💡 The refresh token is invalid or expired');
    }
  }
}

testClaudeDesktopCredentials();