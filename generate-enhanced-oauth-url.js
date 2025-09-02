#!/usr/bin/env node

/**
 * Generate Enhanced OAuth URL with Required Scopes for Template Linking
 */

const CLIENT_ID = process.env.OUTREACH_CLIENT_ID || "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug";
const REDIRECT_URI = "http://localhost:3000/callback";

// Enhanced scopes including template linking
const REQUIRED_SCOPES = [
  'sequences.read',
  'sequences.write',
  'templates.read', 
  'templates.write',
  'sequenceTemplates.read',
  'sequenceTemplates.write',  // Critical for template linking
  'prospects.read',
  'prospects.write',
  'sequenceStates.read',
  'sequenceStates.write',
  'mailings.read',
  'users.read'
].join(' ');

const authUrl = `https://api.outreach.io/oauth/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(REQUIRED_SCOPES)}`;

console.log('🔐 Enhanced Outreach OAuth Authorization URL:');
console.log('==================================================');
console.log(authUrl);
console.log('');
console.log('📋 Included Scopes:');
REQUIRED_SCOPES.split(' ').forEach(scope => {
  console.log(`  - ${scope}${scope.includes('sequenceTemplates') ? ' ← CRITICAL' : ''}`);
});
console.log('');
console.log('🚀 Next Steps:');
console.log('1. Click the URL above to authorize with enhanced scopes');
console.log('2. Complete the OAuth flow');
console.log('3. Use the authorization code to get a new refresh token');
console.log('4. Update your environment variables with the new token');
console.log('5. Test template linking: create_sequence_template(sequenceStepId: X, templateId: Y)');