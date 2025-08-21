import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function debugTemplateVisibility() {
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

    // Step 1: Create a template
    console.log('📝 Creating template...');
    const templatePayload = {
      data: {
        type: 'template',
        attributes: {
          name: 'Debug Template ' + Date.now(),
          subject: 'Test Subject {{prospect.firstName}}',
          bodyHtml: '<p>Test email body for {{prospect.firstName}}</p>',
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
    console.log('Template details:', {
      name: templateResponse.data.data.attributes.name,
      subject: templateResponse.data.data.attributes.subject
    });

    // Step 2: Create a sequence
    console.log('\n📋 Creating sequence...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Debug Sequence ' + Date.now(),
          description: 'Testing template visibility',
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

    // Step 3: Create sequence step
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

    // Step 4: Link template to step
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

    const linkResponse = await axios.post('https://api.outreach.io/api/v2/sequenceTemplates', linkPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ SequenceTemplate created:', linkResponse.data.data.id);

    // Step 5: Verify the link by fetching the step again
    console.log('\n🔍 Verifying template is linked to step...');
    const verifyStepResponse = await axios.get(`https://api.outreach.io/api/v2/sequenceSteps/${stepId}?include=sequenceTemplates`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('Step relationships:', JSON.stringify(verifyStepResponse.data.data.relationships, null, 2));

    // Step 6: Get the sequenceTemplates for this step
    console.log('\n📋 Getting sequenceTemplates for this step...');
    const seqTemplatesResponse = await axios.get(`https://api.outreach.io/api/v2/sequenceTemplates?filter[sequenceStep][id]=${stepId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('SequenceTemplates found:', seqTemplatesResponse.data.data.length);
    if (seqTemplatesResponse.data.data.length > 0) {
      console.log('SequenceTemplate details:', {
        id: seqTemplatesResponse.data.data[0].id,
        relationships: seqTemplatesResponse.data.data[0].relationships
      });
    }

    // Step 7: Check if we need to do something else
    console.log('\n📝 Summary:');
    console.log(`- Template ID: ${templateId}`);
    console.log(`- Sequence ID: ${sequenceId}`);
    console.log(`- Step ID: ${stepId}`);
    console.log(`- SequenceTemplate ID: ${linkResponse.data.data.id}`);
    console.log('\n⚠️  If template is not showing in Outreach UI:');
    console.log('1. The template might need to be activated/enabled');
    console.log('2. There might be a different relationship structure needed');
    console.log('3. The UI might require additional fields or configuration');
    console.log('4. Check if you need to set a default template for the step');

    // Step 8: Try to get the template content through the step
    console.log('\n🔍 Checking step details with template included...');
    const stepWithTemplateResponse = await axios.get(
      `https://api.outreach.io/api/v2/sequenceSteps/${stepId}?include=sequenceTemplates,sequenceTemplates.template`, 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      }
    );

    if (stepWithTemplateResponse.data.included) {
      console.log('Included resources:', stepWithTemplateResponse.data.included.map(r => ({
        type: r.type,
        id: r.id,
        name: r.attributes?.name
      })));
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugTemplateVisibility();