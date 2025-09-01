#!/usr/bin/env node

// Exchange authorization code for refresh token
const axios = require('axios');
require('dotenv').config();

async function exchangeAuthCode() {
  console.log('🔄 Exchanging authorization code for refresh token...\n');
  
  const clientId = process.env.OUTREACH_CLIENT_ID;
  const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
  const redirectUri = process.env.OUTREACH_REDIRECT_URI;
  const authCode = 'XrrQwGHsD89sEVaoO_Q9xqoEWBt14CN_1No1xcNzBCU';
  
  console.log('📋 Using:');
  console.log(`Client ID: ${clientId ? clientId.substring(0, 20) + '...' : 'MISSING'}`);
  console.log(`Client Secret: ${clientSecret ? clientSecret.substring(0, 10) + '...' : 'MISSING'}`);
  console.log(`Redirect URI: ${redirectUri}`);
  console.log(`Auth Code: ${authCode.substring(0, 20)}...\n`);
  
  if (!clientId || !clientSecret || !redirectUri) {
    console.log('❌ Missing required OAuth credentials');
    return;
  }
  
  try {
    const response = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,  
      code: authCode,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Authorization code exchange successful!\n');
    console.log('📊 Token Details:');
    console.log(`- Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    console.log(`- Token Type: ${response.data.token_type}\n`);
    
    console.log('🔧 Update your .env file with this refresh token:');
    console.log(`OUTREACH_REFRESH_TOKEN=${response.data.refresh_token}`);
    
  } catch (error) {
    console.log('❌ Authorization code exchange failed\n');
    
    if (error.response) {
      console.log('📊 HTTP Error Details:');
      console.log(`- Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`- Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log('❌ Network/Unknown Error:', error.message);
    }
  }
}

// Run the exchange
exchangeAuthCode().catch(console.error);