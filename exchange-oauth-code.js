#!/usr/bin/env node

// Exchange OAuth authorization code for tokens
import axios from 'axios';
import { config } from 'dotenv';

config();

async function exchangeCodeForTokens() {
  console.log('🔄 Exchanging authorization code for tokens...');
  
  const code = 'iBPIzfOaPG_gPVCAnYu_xAfLbwImRFlVtfE0Aq2_aV4';
  const clientId = process.env.OUTREACH_CLIENT_ID;
  const clientSecret = process.env.OUTREACH_CLIENT_SECRET || 'O:UOGpXzU(zwZE}kHy)b(z.7:V.FxQjgAj#_UU{\'x8X';
  const redirectUri = process.env.OUTREACH_REDIRECT_URI || 'https://mcp-outreach-server-production.up.railway.app/callback';

  console.log('📋 Using configuration:');
  console.log(`   - Client ID: ${clientId?.substring(0, 8)}...`);
  console.log(`   - Redirect URI: ${redirectUri}`);
  console.log(`   - Code: ${code.substring(0, 8)}...`);
  console.log('');

  try {
    // Try method 1: JSON payload
    console.log('🔄 Attempting method 1: JSON payload...');
    let response;
    
    try {
      response = await axios.post('https://api.outreach.io/oauth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error1) {
      console.log('⚠️  Method 1 failed, trying method 2: Basic Auth + Form data...');
      
      // Try method 2: Basic Auth with form data
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const params = new URLSearchParams();
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', redirectUri);
      
      response = await axios.post('https://api.outreach.io/oauth/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      });
    }

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    console.log('🎉 OAuth tokens obtained successfully!');
    console.log('');
    console.log('📋 New OAuth credentials:');
    console.log('================================');
    console.log(`ACCESS_TOKEN=${access_token}`);
    console.log(`REFRESH_TOKEN=${refresh_token}`);
    console.log(`EXPIRES_IN=${expires_in} seconds`);
    console.log(`EXPIRES_AT=${expiresAt.toISOString()}`);
    console.log('================================');
    console.log('');
    console.log('🚀 To update Railway environment variables:');
    console.log(`railway variables set OUTREACH_REFRESH_TOKEN="${refresh_token}"`);
    console.log('');
    console.log('✨ The MCP server should now initialize properly!');

  } catch (error) {
    console.error('❌ Failed to exchange code for tokens:', error.response?.data || error.message);
    console.error('');
    console.error('🔍 Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

exchangeCodeForTokens();