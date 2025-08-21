import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testSequenceSteps() {
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

    // Create a test sequence first
    console.log('📝 Creating test sequence...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Test Sequence with Steps ' + Date.now(),
          description: 'Testing sequence step creation',
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

    // Now add a sequence step (email)
    console.log('📧 Adding email step to sequence...');
    const stepPayload = {
      data: {
        type: 'sequenceStep',
        attributes: {
          stepType: 'auto_email',
          order: 1,
          interval: 0  // 0 minutes = immediate
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

    const stepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', stepPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ Created sequence step successfully!');
    console.log('📊 Step Details:', {
      id: stepResponse.data.data.id,
      stepType: stepResponse.data.data.attributes.stepType,
      order: stepResponse.data.data.attributes.order,
      subject: stepResponse.data.data.attributes.subject
    });

    // Add a second step (follow-up email)
    console.log('📧 Adding follow-up email step...');
    const followupPayload = {
      data: {
        type: 'sequenceStep',
        attributes: {
          stepType: 'auto_email',
          order: 2,
          interval: 4320  // 3 days * 24 hours * 60 minutes = 4320 minutes
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

    const followupResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', followupPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ Created follow-up step successfully!');
    console.log('🎉 Sequence with steps is ready!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSequenceSteps();