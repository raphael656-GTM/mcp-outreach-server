#!/usr/bin/env node

// Generate OAuth authorization URL with complete scopes
import { config } from 'dotenv';

config();

function generateOAuthURL() {
  console.log('🔐 Generating OAuth Authorization URL');
  console.log('=====================================');
  console.log('');

  const clientId = process.env.OUTREACH_CLIENT_ID;
  const redirectUri = process.env.OUTREACH_REDIRECT_URI || 'https://mcp-outreach-server-production.up.railway.app/callback';

  // Complete scopes from your specification
  const scopes = [
    'prospects.all',
    'users.all', 
    'sequences.all',
    'sequenceStates.all',
    'mailboxes.all',
    'sequenceSteps.all',
    'sequenceTemplates.all',
    'templates.all',
    'contentCategories.all',
    'accounts.all',
    'contentCategoryMemberships.all',
    'emailAddresses.all',
    'mailings.all',
    'mailAliases.read',
    'personas.all',
    'phoneNumbers.all',
    'tasks.all',
    'stages.all',
    'snippets.all',
    'calls.all'
  ].join(' ');

  console.log('📋 Configuration:');
  console.log(`   - Client ID: ${clientId?.substring(0, 8)}...`);
  console.log(`   - Redirect URI: ${redirectUri}`);
  console.log(`   - Scopes: ${scopes.split(' ').length} scopes`);
  console.log('');

  // Build authorization URL
  const authUrl = new URL('https://api.outreach.io/oauth/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes);

  console.log('🔗 Complete OAuth Authorization URL:');
  console.log('=====================================');
  console.log(authUrl.toString());
  console.log('');
  console.log('📱 Instructions:');
  console.log('1. Copy the URL above');
  console.log('2. Open it in your browser');
  console.log('3. Authorize the application with all scopes');
  console.log('4. Copy the authorization code from the callback');
  console.log('5. Provide the code for token exchange');
  console.log('');
  console.log('✨ This URL includes ALL the scopes you specified for comprehensive access');
  console.log('');

  // Also show the scopes breakdown
  console.log('📊 Included Scopes:');
  console.log('-------------------');
  const scopeCategories = {
    'Read Access': ['prospects.all', 'users.all', 'sequences.all', 'sequenceStates.all', 'mailboxes.all', 'sequenceSteps.all', 'sequenceTemplates.all', 'templates.all', 'contentCategories.all', 'accounts.all', 'contentCategoryMemberships.all', 'emailAddresses.all', 'mailings.all', 'mailAliases.read', 'personas.all', 'phoneNumbers.all', 'tasks.all', 'stages.all', 'snippets.all', 'calls.all']
  };

  Object.entries(scopeCategories).forEach(([category, scopeList]) => {
    console.log(`\n${category}:`);
    scopeList.forEach(scope => console.log(`  ✓ ${scope}`));
  });
}

generateOAuthURL();