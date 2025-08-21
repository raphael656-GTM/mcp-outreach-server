// Generate the authorization URL for Outreach OAuth

const CLIENT_ID = 'huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug';
const REDIRECT_URI = 'https://mcp-outreach-server-production.up.railway.app/callback';

// Use the correct Outreach scopes - adding mailings for email content investigation
const SCOPES = 'mailboxes.all prospects.all sequences.all sequenceSteps.all sequenceStates.all templates.all sequenceTemplates.all mailings.all users.all';

const authUrl = `https://api.outreach.io/oauth/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPES)}`;

console.log('\n🔗 Visit this URL to authorize the app:\n');
console.log(authUrl);
console.log('\n📝 After authorizing, you\'ll be redirected to the Railway app.');
console.log('Copy the authorization code from the URL and run: node exchange-new-code.js YOUR_CODE\n');