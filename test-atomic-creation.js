import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testAtomicCreation() {
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

    // TEST: Create everything in rapid succession and then check if there's a delay needed
    console.log('⚡ Creating complete sequence with template in atomic operation...');
    
    // Step 1: Create sequence
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Atomic Creation Test ' + Date.now(),
          description: 'Testing atomic creation of sequence with templates',
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

    // Step 2: Create THREE different templates for three steps
    const templates = [];
    for (let i = 1; i <= 3; i++) {
      const templatePayload = {
        data: {
          type: 'template',
          attributes: {
            name: `Email ${i} Template ${Date.now()}`,
            subject: `Step ${i}: Important message for {{prospect.firstName}}`,
            bodyHtml: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: Arial, sans-serif;">
                <h2>Email ${i} in Sequence</h2>
                <p>Hi {{prospect.firstName}},</p>
                <p>This is email number ${i} in our sequence.</p>
                <p>Best regards,<br>{{sender.firstName}}</p>
              </body>
              </html>
            `,
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

      templates.push({
        id: templateResponse.data.data.id,
        name: templateResponse.data.data.attributes.name
      });
      console.log(`✅ Template ${i} created:`, templateResponse.data.data.id);
    }

    // Step 3: Create THREE sequence steps rapidly
    const steps = [];
    const stepTimings = [0, 1440, 4320]; // immediate, 1 day, 3 days

    for (let i = 0; i < 3; i++) {
      const stepPayload = {
        data: {
          type: 'sequenceStep',
          attributes: {
            stepType: 'auto_email',
            order: i + 1,
            interval: stepTimings[i]
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

      steps.push({
        id: stepResponse.data.data.id,
        order: i + 1
      });
      console.log(`✅ Step ${i + 1} created:`, stepResponse.data.data.id);
    }

    // Step 4: Create sequenceTemplate links for all steps IMMEDIATELY
    console.log('\n🔗 Linking all templates to steps immediately...');
    const sequenceTemplates = [];

    for (let i = 0; i < 3; i++) {
      const linkPayload = {
        data: {
          type: 'sequenceTemplate',
          relationships: {
            sequenceStep: {
              data: {
                type: 'sequenceStep',
                id: steps[i].id.toString()
              }
            },
            template: {
              data: {
                type: 'template',
                id: templates[i].id.toString()
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

      sequenceTemplates.push(linkResponse.data.data.id);
      console.log(`✅ Template ${i + 1} linked to step ${i + 1}:`, linkResponse.data.data.id);
    }

    // Step 5: Immediate verification
    console.log('\n🔍 Immediate verification of all steps...');
    for (let i = 0; i < 3; i++) {
      const stepCheck = await axios.get(
        `https://api.outreach.io/api/v2/sequenceSteps/${steps[i].id}?include=sequenceTemplates,sequenceTemplates.template`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
          }
        }
      );

      const hasTemplates = stepCheck.data.data.relationships.sequenceTemplates?.data?.length > 0;
      console.log(`Step ${i + 1} has templates: ${hasTemplates}`);
      
      if (hasTemplates && stepCheck.data.included) {
        const template = stepCheck.data.included.find(item => item.type === 'template');
        if (template) {
          console.log(`  └─ Template: "${template.attributes.name}"`);
        }
      }
    }

    // Step 6: Wait and check again (maybe there's a delay in UI updates)
    console.log('\n⏱️  Waiting 5 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    for (let i = 0; i < 3; i++) {
      const stepCheck = await axios.get(
        `https://api.outreach.io/api/v2/sequenceSteps/${steps[i].id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
          }
        }
      );

      console.log(`Step ${i + 1} after delay - attributes keys:`, Object.keys(stepCheck.data.data.attributes));
    }

    console.log('\n📊 ATOMIC CREATION SUMMARY');
    console.log('==========================');
    console.log(`Sequence: ${sequenceId}`);
    console.log(`Templates: ${templates.map(t => t.id).join(', ')}`);
    console.log(`Steps: ${steps.map(s => s.id).join(', ')}`);
    console.log(`SequenceTemplates: ${sequenceTemplates.join(', ')}`);
    
    console.log('\n🌐 CRITICAL TEST:');
    console.log(`https://app.outreach.io/sequences/${sequenceId}/steps`);
    console.log('\nIf templates STILL don\'t show after this atomic creation:');
    console.log('1. The issue is not timing/order related');
    console.log('2. The issue is not in the linking process');
    console.log('3. The issue is likely in a missing API field or different resource');
    console.log('4. We may need to investigate mailings or other resources');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAtomicCreation();