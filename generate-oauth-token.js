#!/usr/bin/env node

// OAuth Token Generator for Outreach MCP Server
// This script will help generate a new refresh token

import { OutreachOAuth } from './dist/oauth.js';
import { config } from 'dotenv';

config();

async function generateOAuthToken() {
  console.log('🔐 Starting OAuth token generation...');
  console.log('');

  // Check environment variables
  const clientId = process.env.OUTREACH_CLIENT_ID;
  const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
  const redirectUri = process.env.OUTREACH_REDIRECT_URI || 'http://localhost:3000/callback';

  if (!clientId || !clientSecret) {
    console.error('❌ Missing required environment variables:');
    console.error('   - OUTREACH_CLIENT_ID');
    console.error('   - OUTREACH_CLIENT_SECRET');
    console.error('');
    console.error('Please make sure these are set in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded:');
  console.log(`   - Client ID: ${clientId.substring(0, 8)}...`);
  console.log(`   - Client Secret: ${clientSecret.substring(0, 8)}...`);
  console.log(`   - Redirect URI: ${redirectUri}`);
  console.log('');

  try {
    // Initialize OAuth client
    const oauth = new OutreachOAuth({
      clientId,
      clientSecret,
      redirectUri,
      scope: 'prospects.all users.all sequences.all sequenceStates.all mailboxes.all sequenceSteps.all sequenceTemplates.all templates.all contentCategories.all accounts.all contentCategoryMemberships.all emailAddresses.all mailings.all mailAliases.read personas.all phoneNumbers.all tasks.all stages.all snippets.all calls.all'
    });

    console.log('🚀 Starting OAuth flow...');
    console.log('📱 This will open your browser for authorization');
    console.log('');

    // Start OAuth flow
    const accessToken = await oauth.initialize();
    
    console.log('');
    console.log('🎉 OAuth flow completed successfully!');
    console.log('✅ Access token obtained');
    
    // The refresh token is stored in the OAuth instance
    const tokenData = oauth.tokenData;
    if (tokenData && tokenData.refresh_token) {
      console.log('');
      console.log('📋 New OAuth credentials:');
      console.log('----------------------------');
      console.log(`ACCESS_TOKEN=${accessToken}`);
      console.log(`REFRESH_TOKEN=${tokenData.refresh_token}`);
      console.log(`EXPIRES_AT=${new Date(tokenData.expires_at).toISOString()}`);
      console.log('----------------------------');
      console.log('');
      console.log('🔧 Update your Railway environment variables with:');
      console.log(`   OUTREACH_REFRESH_TOKEN=${tokenData.refresh_token}`);
      console.log('');
      console.log('💡 The refresh token has been saved to ~/.mcp-outreach/token.json');
    }

    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ OAuth flow failed:', error.message);
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('   1. Check that your Outreach OAuth app is configured correctly');
    console.error('   2. Verify the redirect URI matches your app settings');
    console.error('   3. Ensure the client ID and secret are correct');
    console.error('');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 OAuth flow cancelled');
  process.exit(0);
});

generateOAuthToken();