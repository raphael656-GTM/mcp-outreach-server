// Exchange authorization code for refresh token
import axios from 'axios';
import fs from 'fs';

const CLIENT_ID = 'huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug';
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';
const REDIRECT_URI = 'https://mcp-outreach-server-production.up.railway.app/callback';

const AUTH_CODE = process.argv[2];

if (!AUTH_CODE) {
  console.log('Usage: node exchange-new-code.js YOUR_AUTHORIZATION_CODE');
  process.exit(1);
}

async function exchangeCode() {
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code: AUTH_CODE
    });

    console.log('📝 Exchanging code for tokens...');
    const response = await axios.post('https://api.outreach.io/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Update .env file with refresh token
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(
      /OUTREACH_REFRESH_TOKEN=.*/,
      `OUTREACH_REFRESH_TOKEN=${refresh_token}`
    );
    fs.writeFileSync('.env', envContent);

    console.log('\n✅ OAuth setup complete!');
    console.log('📝 Refresh token saved to .env file');
    console.log(`🔑 Access Token: ${access_token.substring(0, 20)}...`);
    console.log(`🔄 Refresh Token: ${refresh_token.substring(0, 20)}...`);
    console.log(`⏰ Expires In: ${expires_in} seconds`);
    console.log('\nYou can now use the MCP server!\n');

  } catch (error) {
    console.error('Error exchanging code:', error.response?.data || error.message);
  }
}

exchangeCode();