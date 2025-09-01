#!/usr/bin/env node

// Direct OAuth test with the new client secret
import axios from 'axios';

async function testOAuthDirect() {
  console.log('🧪 Testing OAuth with new credentials...');
  
  const clientId = 'huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug';
  const clientSecret = 'O:UOGpXzU(zwZE}kHy)b(z.7:V.FxQjgAj#_UU{\'x8X';
  const code = 'iBPIzfOaPG_gPVCAnYu_xAfLbwImRFlVtfE0Aq2_aV4';
  const redirectUri = 'https://mcp-outreach-server-production.up.railway.app/callback';

  console.log('📋 Direct test configuration:');
  console.log(`   - Client ID: ${clientId.substring(0, 20)}...`);
  console.log(`   - Client Secret: ${clientSecret.substring(0, 8)}...`);
  console.log(`   - Code: ${code.substring(0, 8)}...`);
  console.log(`   - Redirect URI: ${redirectUri}`);
  console.log('');

  // Test 1: JSON with proper encoding
  try {
    console.log('🔄 Test 1: JSON payload with proper encoding...');
    const response1 = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Test 1 SUCCESS!');
    const { access_token, refresh_token, expires_in } = response1.data;
    console.log('🎉 Tokens obtained successfully!');
    console.log('');
    console.log('📋 OAuth Tokens:');
    console.log('================');
    console.log(`ACCESS_TOKEN=${access_token}`);
    console.log(`REFRESH_TOKEN=${refresh_token}`);
    console.log(`EXPIRES_IN=${expires_in}`);
    console.log('================');
    console.log('');
    console.log('🚀 Update Railway with:');
    console.log(`railway variables set OUTREACH_CLIENT_SECRET="${clientSecret}"`);
    console.log(`railway variables set OUTREACH_REFRESH_TOKEN="${refresh_token}"`);
    return;

  } catch (error1) {
    console.log('❌ Test 1 failed:', error1.response?.data?.error || error1.message);
  }

  // Test 2: Basic Auth
  try {
    console.log('🔄 Test 2: Basic Auth with form data...');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

    const response2 = await axios.post('https://api.outreach.io/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    console.log('✅ Test 2 SUCCESS!');
    const { access_token, refresh_token, expires_in } = response2.data;
    console.log('🎉 Tokens obtained successfully!');
    console.log('');
    console.log('📋 OAuth Tokens:');
    console.log('================');
    console.log(`ACCESS_TOKEN=${access_token}`);
    console.log(`REFRESH_TOKEN=${refresh_token}`);
    console.log(`EXPIRES_IN=${expires_in}`);
    console.log('================');

  } catch (error2) {
    console.log('❌ Test 2 failed:', error2.response?.data?.error || error2.message);
    console.log('');
    console.log('🔍 Possible issues:');
    console.log('   1. Authorization code may have expired (they expire quickly)');
    console.log('   2. Client secret may still be incorrect');
    console.log('   3. Need to generate a fresh authorization code');
    console.log('');
    console.log('💡 Try generating a new authorization code if this one is more than 10 minutes old');
  }
}

testOAuthDirect();