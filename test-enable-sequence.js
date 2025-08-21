import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testEnableSequence() {
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
    console.log('✅ Got access token\n');

    // Create a complete sequence with template
    console.log('📝 Creating template...');
    const templatePayload = {
      data: {
        type: 'template',
        attributes: {
          name: 'Enable Test Template ' + Date.now(),
          subject: 'This should show: {{prospect.firstName}}',
          bodyHtml: '<h1>Hello {{prospect.firstName}}!</h1><p>This template should appear in the enabled sequence.</p>',
          shareType: 'shared',
          archived: false,
          trackLinks: true,
          trackOpens: true
        }
      }
    };

    const templateResponse = await axios.post('https://api.outreach.io/api/v2/templates', templatePayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    const templateId = templateResponse.data.data.id;
    console.log('✅ Template created:', templateId);

    // Create sequence
    console.log('\n📋 Creating sequence...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Enable Test Sequence ' + Date.now(),
          description: 'Testing if enabling sequence shows templates',
          shareType: 'shared'
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

    // Create sequence step
    console.log('\n📧 Creating sequence step...');
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

    // Link template to step
    console.log('\n🔗 Linking template to step...');
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

    await axios.post('https://api.outreach.io/api/v2/sequenceTemplates', linkPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ Template linked to step');

    // Now try to ENABLE the sequence
    console.log('\n⚡ Enabling sequence...');
    try {
      const enablePayload = {
        data: {
          type: 'sequence',
          id: sequenceId.toString(),
          attributes: {
            enabled: true
          }
        }
      };

      const enableResponse = await axios.patch(`https://api.outreach.io/api/v2/sequences/${sequenceId}`, enablePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Sequence enabled successfully!');
      console.log('Enabled status:', enableResponse.data.data.attributes.enabled);
    } catch (error) {
      console.log('❌ Failed to enable sequence:', error.response?.data?.errors?.[0]?.detail || error.message);
    }

    // Check the final state
    console.log('\n📊 Final state check...');
    const finalCheck = await axios.get(
      `https://api.outreach.io/api/v2/sequenceSteps/${stepId}?include=sequenceTemplates,sequenceTemplates.template`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      }
    );

    const hasTemplates = finalCheck.data.data.relationships.sequenceTemplates?.data?.length > 0;
    console.log('Step has templates:', hasTemplates);
    
    if (hasTemplates && finalCheck.data.included) {
      const template = finalCheck.data.included.find(item => item.type === 'template');
      if (template) {
        console.log('Template linked:', template.attributes.name);
        console.log('Template subject:', template.attributes.subject);
      }
    }

    console.log('\n🌐 IMPORTANT: Check this URL in Outreach:');
    console.log(`https://app.outreach.io/sequences/${sequenceId}/steps`);
    console.log('\nLook to see if the template appears in Step 1 after enabling the sequence.');
    console.log('If it still doesn\'t show, the issue might be:');
    console.log('1. Templates need to be assigned through a different mechanism');
    console.log('2. The UI requires manual template selection regardless of API links');
    console.log('3. There\'s a separate "default template" setting required');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testEnableSequence();