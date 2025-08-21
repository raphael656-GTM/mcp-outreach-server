import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testCreateSequence() {
  try {
    // Get access token
    console.log('🔄 Getting access token...');
    const tokenResponse = await axios.post('https://api.outreach.io/oauth/token', 
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Got access token');

    // Try to create a test sequence
    console.log('📝 Attempting to create test sequence...');
    
    const payload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Test Sequence via MCP ' + Date.now(),
          description: 'Test sequence created via MCP server',
          shareType: 'private'
        }
      }
    };

    const response = await axios.post('https://api.outreach.io/api/v2/sequences', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ Sequence created successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.error('\n🔒 Permission Error: Your app may need additional scopes.');
      console.error('Make sure your Outreach OAuth app has WRITE permissions for sequences.');
    }
  }
}

testCreateSequence();