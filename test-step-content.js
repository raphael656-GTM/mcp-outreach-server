import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testSequenceStepContent() {
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

    // Create a test sequence
    console.log('📝 Creating test sequence...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Test Step Content ' + Date.now(),
          description: 'Testing sequence step email content',
          shareType: 'private'
        }
      }
    };

    const sequenceResponse = await axios.post('https://api.outreach.io/api/v2/sequences', sequencePayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    const sequenceId = sequenceResponse.data.data.id;
    console.log('✅ Created sequence ID:', sequenceId);

    // Try creating sequence step with email content directly
    console.log('📧 Testing sequence step with email content...');
    const stepWithContentPayload = {
      data: {
        type: 'sequenceStep',
        attributes: {
          stepType: 'auto_email',
          order: 1,
          interval: 0,
          subject: 'Direct subject in step',
          bodyHtml: '<p>Direct HTML content in step</p>',
          bodyText: 'Direct text content in step'
        },
        relationships: {
          sequence: {
            data: {
              type: 'sequence',
              id: sequenceId.toString()
            }
          }
        }
      }
    };

    const stepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', stepWithContentPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ Created step with direct content!');
    console.log('📊 Step attributes:', stepResponse.data.data.attributes);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data?.errors) {
      error.response.data.errors.forEach(err => {
        console.error(`📝 ${err.title}: ${err.detail}`);
      });
    }
  }
}

testSequenceStepContent();