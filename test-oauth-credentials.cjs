#!/usr/bin/env node

// Test current OAuth credentials to diagnose the 401 error
const axios = require('axios');
require('dotenv').config();

async function testOAuthCredentials() {
  console.log('🔐 Testing Outreach OAuth Credentials...\n');
  
  const clientId = process.env.OUTREACH_CLIENT_ID;
  const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
  const refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
  
  console.log('📋 Current Credentials:');
  console.log(`Client ID: ${clientId ? clientId.substring(0, 20) + '...' : 'MISSING'}`);
  console.log(`Client Secret: ${clientSecret ? clientSecret.substring(0, 10) + '...' : 'MISSING'}`);
  console.log(`Refresh Token: ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'MISSING'}\n`);
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.log('❌ Missing required OAuth credentials');
    return;
  }
  
  try {
    console.log('🔄 Attempting token refresh...');
    
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
    
    console.log('✅ OAuth token refresh successful!');
    console.log('📊 Response:');
    console.log(`- Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    console.log(`- Token Type: ${response.data.token_type}`);
    
  } catch (error) {
    console.log('❌ OAuth token refresh failed\n');
    
    if (error.response) {
      console.log('📊 HTTP Error Details:');
      console.log(`- Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`- Response: ${JSON.stringify(error.response.data, null, 2)}`);
      
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.log('\n🔍 Diagnosis:');
      
      if (status === 401) {
        if (errorData.error === 'invalid_client') {
          console.log('❌ INVALID CLIENT: OAuth application not found or disabled');
          console.log('🔧 Solution: Create new OAuth application in Outreach');
        } else if (errorData.error === 'invalid_grant') {
          console.log('❌ INVALID REFRESH TOKEN: Token expired or revoked');
          console.log('🔧 Solution: Re-authorize application to get new refresh token');
        } else {
          console.log(`❌ AUTHENTICATION ERROR: ${errorData.error_description || errorData.error}`);
        }
      } else if (status === 400) {
        console.log('❌ BAD REQUEST: Check request format and parameters');
      } else {
        console.log('❌ UNEXPECTED ERROR: Check Outreach API status');
      }
      
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('❌ NETWORK ERROR: Cannot reach Outreach API');
      console.log('🔧 Check your internet connection');
      
    } else if (error.code === 'ECONNABORTED') {
      console.log('❌ TIMEOUT ERROR: Request took too long');
      
    } else {
      console.log('❌ UNKNOWN ERROR:', error.message);
    }
  }
}

// Run the test
testOAuthCredentials().catch(console.error);