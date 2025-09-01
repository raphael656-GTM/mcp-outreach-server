#!/usr/bin/env node

// Verify the current refresh token is still working
const axios = require('axios');

async function verifyCurrentToken() {
  console.log('🔍 Verifying current refresh token is still valid...\n');
  
  const clientId = "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug";
  const clientSecret = "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6";
  const refreshToken = "rsFNXxa8vwoU_doiUz3wx2_M4nI-kUsyH4tRpvIJLmc";
  
  console.log('📋 Testing with:');
  console.log(`Client ID: ${clientId.substring(0, 20)}...`);
  console.log(`Client Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`Refresh Token: ${refreshToken.substring(0, 20)}...`);
  
  try {
    console.log('\n🔄 Testing OAuth token refresh...');
    
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
    
    console.log('✅ Current refresh token is STILL VALID!');
    console.log('📊 Response:');
    console.log(`- Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- New Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    
    console.log('\n🧪 Testing API call...');
    
    const apiResponse = await axios.get('https://api.outreach.io/api/v2/sequences?page[limit]=1', {
      headers: {
        'Authorization': `Bearer ${response.data.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ API call successful!');
    console.log(`- Status: ${apiResponse.status}`);
    
    console.log('\n💡 The refresh token is working fine. The issue must be elsewhere.');
    
  } catch (error) {
    console.log('❌ Current refresh token is INVALID:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
    
    if (error.response?.data?.error === 'invalid_client') {
      console.log('\n💡 Client credentials are being rejected');
    } else if (error.response?.data?.error === 'invalid_grant') {
      console.log('\n💡 Refresh token is expired or invalid');
    }
  }
}

verifyCurrentToken();