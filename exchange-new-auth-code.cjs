#!/usr/bin/env node

// Exchange authorization code for refresh token using clean credentials
const axios = require('axios');

async function exchangeAuthCode() {
  console.log('🔄 Exchanging authorization code for refresh token...\n');
  
  const clientId = "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug";
  const clientSecret = "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6";
  const authorizationCode = "zjW7LT5QGX38zrdm8Nir6P6PTBxnPYdPs7jFkSeusbg";
  const redirectUri = "https://mcp-outreach-server-production.up.railway.app/callback";
  
  console.log('📋 Using credentials:');
  console.log(`Client ID: ${clientId.substring(0, 20)}...`);
  console.log(`Client Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`Auth Code: ${authorizationCode.substring(0, 20)}...`);
  console.log(`Redirect URI: ${redirectUri}\n`);
  
  try {
    const response = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ Authorization code exchange SUCCESSFUL!');
    console.log('📊 Token Response:');
    console.log(`- Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- NEW Refresh Token: ${response.data.refresh_token}`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    console.log(`- Token Type: ${response.data.token_type}`);
    console.log(`- Scope: ${response.data.scope}`);
    
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
    
    console.log('\n🔧 UPDATE REQUIRED:');
    console.log('Update your .env and Claude Desktop config with this NEW refresh token:');
    console.log(`OUTREACH_REFRESH_TOKEN=${response.data.refresh_token}`);
    
    return response.data.refresh_token;
    
  } catch (error) {
    console.log('❌ Authorization code exchange failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
    
    if (error.response?.data?.error === 'invalid_client') {
      console.log('\n💡 Client credentials are invalid');
    } else if (error.response?.data?.error === 'invalid_grant') {
      console.log('\n💡 Authorization code is invalid, expired, or already used');
    }
    
    throw error;
  }
}

exchangeAuthCode().catch(console.error);