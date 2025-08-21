import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function debug403Error() {
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

    // Test 1: Check what scopes we actually have
    console.log('\n🔍 Testing current permissions...');
    
    // Test templates access
    try {
      const templatesTest = await axios.get('https://api.outreach.io/api/v2/templates?page[limit]=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });
      console.log('✅ Templates read access: OK');
    } catch (err) {
      console.log('❌ Templates read access:', err.response?.status, err.response?.data?.errors?.[0]?.detail);
    }

    // Test sequenceTemplates access
    try {
      const seqTemplatesTest = await axios.get('https://api.outreach.io/api/v2/sequenceTemplates?page[limit]=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });
      console.log('✅ SequenceTemplates read access: OK');
    } catch (err) {
      console.log('❌ SequenceTemplates read access:', err.response?.status, err.response?.data?.errors?.[0]?.detail);
    }

    // Test 2: Try creating template (to confirm this works)
    console.log('\n📝 Testing template creation...');
    const templatePayload = {
      data: {
        type: 'template',
        attributes: {
          name: 'Debug Template ' + Date.now(),
          subject: 'Debug subject {{prospect.firstName}}',
          bodyHtml: '<p>Debug content for {{prospect.firstName}}</p>',
          trackLinks: true,
          trackOpens: true
        }
      }
    };

    let templateId;
    try {
      const templateResponse = await axios.post('https://api.outreach.io/api/v2/templates', templatePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });
      templateId = templateResponse.data.data.id;
      console.log('✅ Template created:', templateId);
    } catch (err) {
      console.log('❌ Template creation failed:', err.response?.status, err.response?.data?.errors?.[0]?.detail);
      return;
    }

    // Test 3: Create sequence and step
    console.log('\n📋 Creating sequence and step...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Debug Sequence ' + Date.now(),
          description: 'Debug sequence for 403 error',
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
    console.log('✅ Sequence created:', sequenceId);

    const stepPayload = {
      data: {
        type: 'sequenceStep',
        attributes: {
          stepType: 'auto_email',
          order: 1,
          interval: 0
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

    const stepId = stepResponse.data.data.id;
    console.log('✅ Step created:', stepId);

    // Test 4: Try linking template (this is where the 403 likely occurs)
    console.log('\n🔗 Testing template linking...');
    const linkPayload = {
      data: {
        type: 'sequenceTemplate',
        relationships: {
          sequenceStep: {
            data: {
              type: 'sequenceStep',
              id: stepId.toString()
            }
          },
          template: {
            data: {
              type: 'template',
              id: templateId.toString()
            }
          }
        }
      }
    };

    try {
      const linkResponse = await axios.post('https://api.outreach.io/api/v2/sequenceTemplates', linkPayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });
      console.log('✅ Template linked successfully!');
      console.log('🎉 All operations completed successfully!');
    } catch (err) {
      console.log('❌ Template linking failed:');
      console.log('Status:', err.response?.status);
      console.log('Error:', err.response?.data);
      
      if (err.response?.status === 403) {
        console.log('\n🔒 403 FORBIDDEN - This indicates:');
        console.log('1. Missing OAuth scope (likely sequenceTemplates.write)');
        console.log('2. Insufficient permissions in Outreach');
        console.log('3. Account-level restrictions');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.response?.data || error.message);
  }
}

debug403Error();