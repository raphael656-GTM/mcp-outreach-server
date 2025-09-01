#!/usr/bin/env node

// Debug OAuth credentials to identify the mismatch
import { config } from 'dotenv';

config();

console.log('🔍 OAuth Credentials Debug');
console.log('==========================');
console.log('');

const clientId = process.env.OUTREACH_CLIENT_ID;
const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
const refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
const redirectUri = process.env.OUTREACH_REDIRECT_URI;

console.log('📋 Current Environment Variables:');
console.log(`OUTREACH_CLIENT_ID: ${clientId || 'NOT SET'}`);
console.log(`OUTREACH_CLIENT_SECRET: ${clientSecret ? clientSecret.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`OUTREACH_REFRESH_TOKEN: ${refreshToken ? refreshToken.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`OUTREACH_REDIRECT_URI: ${redirectUri || 'NOT SET'}`);
console.log('');

console.log('🔗 The authorization URL that worked was:');
console.log('https://api.outreach.io/oauth/authorize?client_id=huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW%7Exeug&redirect_uri=https%3A%2F%2Fmcp-outreach-server-production.up.railway.app%2Fcallback&response_type=code&scope=prospects.all+users.all+sequences.all+sequenceStates.all+mailboxes.all+sequenceSteps.all+sequenceTemplates.all+templates.all+contentCategories.all+accounts.all+contentCategoryMemberships.all+emailAddresses.all+mailings.all+mailAliases.read+personas.all+phoneNumbers.all+tasks.all+stages.all+snippets.all+calls.all');
console.log('');

// Extract client ID from the working URL
const workingClientId = 'huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug'; // URL decoded version

console.log('🔍 Analysis:');
console.log(`Working Client ID from URL: ${workingClientId}`);
console.log(`Environment Client ID:      ${clientId}`);
console.log(`Match: ${workingClientId === clientId ? '✅ YES' : '❌ NO'}`);
console.log('');

if (workingClientId !== clientId) {
  console.log('❌ CLIENT ID MISMATCH DETECTED!');
  console.log('');
  console.log('🔧 To fix this, update your environment variables with:');
  console.log(`OUTREACH_CLIENT_ID=${workingClientId}`);
  console.log('');
  console.log('💡 The client secret may also need to be updated to match this client ID.');
} else {
  console.log('✅ Client ID matches - the issue must be with the CLIENT_SECRET');
  console.log('');
  console.log('🔧 Please verify the CLIENT_SECRET in your Outreach OAuth app settings');
}