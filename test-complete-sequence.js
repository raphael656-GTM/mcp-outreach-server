import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testCompleteSequence() {
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

    // Get existing templates to see their structure
    console.log('🔍 Checking existing templates structure...');
    const existingTemplates = await axios.get('https://api.outreach.io/api/v2/templates?page[limit]=2', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    if (existingTemplates.data.data.length > 0) {
      console.log('Example template attributes:', Object.keys(existingTemplates.data.data[0].attributes));
      console.log('First template:', {
        name: existingTemplates.data.data[0].attributes.name,
        archived: existingTemplates.data.data[0].attributes.archived,
        shareType: existingTemplates.data.data[0].attributes.shareType
      });
    }

    // Create a template with all possible attributes
    console.log('\n📝 Creating comprehensive template...');
    const templatePayload = {
      data: {
        type: 'template',
        attributes: {
          name: 'Complete Template ' + Date.now(),
          subject: 'Important: {{prospect.firstName}}, this is for you',
          bodyHtml: `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; }
.container { padding: 20px; }
</style>
</head>
<body>
<div class="container">
<p>Hi {{prospect.firstName}},</p>
<p>This is a complete email template with full HTML content.</p>
<p>Best regards,<br>{{sender.firstName}}</p>
</div>
</body>
</html>`,
          shareType: 'shared',  // Changed to shared to make it visible
          archived: false,
          trackLinks: true,
          trackOpens: true,
          toRecipients: ['{{prospect.email}}'],
          ccRecipients: [],
          bccRecipients: []
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
    console.log('Template attributes:', Object.keys(templateResponse.data.data.attributes));

    // Create sequence
    console.log('\n📋 Creating sequence...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Complete Sequence Test ' + Date.now(),
          description: 'Testing complete template integration',
          shareType: 'shared',  // Changed to shared to make it visible
          sequenceType: 'interval'  // Try specifying sequence type
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

    // Create THREE steps with different intervals
    console.log('\n📧 Creating multiple sequence steps...');
    
    const steps = [
      { order: 1, interval: 0, name: 'Initial Email' },
      { order: 2, interval: 1440, name: 'Day 1 Follow-up' },  // 1 day later
      { order: 3, interval: 4320, name: 'Day 3 Follow-up' }   // 3 days later
    ];

    const stepIds = [];
    for (const step of steps) {
      const stepPayload = {
        data: {
          type: 'sequenceStep',
          attributes: {
            stepType: 'auto_email',
            order: step.order,
            interval: step.interval,
            // displayName is read-only
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

      stepIds.push(stepResponse.data.data.id);
      console.log(`✅ Step ${step.order} created:`, stepResponse.data.data.id);
    }

    // Link template to FIRST step only
    console.log('\n🔗 Linking template to first step...');
    const linkPayload = {
      data: {
        type: 'sequenceTemplate',
        attributes: {
          // Try adding attributes if any are available
        },
        relationships: {
          sequenceStep: {
            data: {
              type: 'sequenceStep',
              id: stepIds[0].toString()
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

    const linkResponse = await axios.post('https://api.outreach.io/api/v2/sequenceTemplates', linkPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ Template linked to step 1');

    // Final verification
    console.log('\n📊 Final Summary:');
    console.log('================');
    console.log(`Sequence: ${sequenceId}`);
    console.log(`Template: ${templateId}`);
    console.log(`Steps: ${stepIds.join(', ')}`);
    console.log(`SequenceTemplate: ${linkResponse.data.data.id}`);
    console.log('\n🌐 View in Outreach:');
    console.log(`https://app.outreach.io/sequences/${sequenceId}/steps`);
    console.log('\n⚠️  Check if the template appears in step 1 in the UI');
    console.log('If not visible, you may need to:');
    console.log('1. Enable/activate the template in Outreach settings');
    console.log('2. Set template as "shared" instead of "private"');
    console.log('3. Use a different template type or category');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCompleteSequence();