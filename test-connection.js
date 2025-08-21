import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testConnection() {
  try {
    // First, get a new access token using the refresh token
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

    // Test API connection by fetching user info
    console.log('📝 Fetching current user...');
    const userResponse = await axios.get('https://api.outreach.io/api/v2/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json'
      },
      params: {
        'page[limit]': 1
      }
    });

    console.log('✅ API connection successful!');
    console.log('👤 User:', userResponse.data.data[0]?.attributes?.email || 'No user found');

    // Test fetching sequences
    console.log('\n📝 Fetching sequences...');
    const sequenceResponse = await axios.get('https://api.outreach.io/api/v2/sequences', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json'
      },
      params: {
        'page[limit]': 3
      }
    });

    console.log(`✅ Found ${sequenceResponse.data.data.length} sequences`);
    sequenceResponse.data.data.forEach(seq => {
      console.log(`  - ${seq.attributes.name}`);
    });

    console.log('\n🎉 All tests passed! Your MCP server is ready to use.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testConnection();