import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testTemplates() {
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

    // Create a test template
    console.log('📝 Creating email template...');
    const templatePayload = {
      data: {
        type: 'template',
        attributes: {
          name: 'Welcome Email Template ' + Date.now(),
          subject: 'Welcome to our platform, {{prospect.firstName}}!',
          bodyHtml: `<p>Hi {{prospect.firstName}},</p>

<p>Welcome to our platform! We're excited to have you on board.</p>

<p>Here's what you can expect:</p>
<ul>
  <li>Personalized onboarding</li>
  <li>24/7 support</li>
  <li>Access to exclusive resources</li>
</ul>

<p>Best regards,<br>
The Team</p>

<p><em>P.S. If you have any questions, just reply to this email!</em></p>`,
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

    console.log('✅ Template created successfully!');
    console.log('📊 Template Details:', {
      id: templateResponse.data.data.id,
      name: templateResponse.data.data.attributes.name,
      subject: templateResponse.data.data.attributes.subject
    });

    const templateId = templateResponse.data.data.id;

    // Create a sequence with steps and link the template
    console.log('\n📝 Creating sequence with template...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Template-based Sequence ' + Date.now(),
          description: 'Testing template linking',
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

    // Create a sequence step
    console.log('📧 Adding email step to sequence...');
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
    console.log('✅ Created step ID:', stepId);

    // Link the template to the step - create sequenceTemplate resource
    console.log('🔗 Linking template to step via sequenceTemplate...');
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

    const linkResponse = await axios.post(`https://api.outreach.io/api/v2/sequenceTemplates`, linkPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('✅ Template linked successfully!');
    console.log('🎉 Complete sequence with email template is ready!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.error('\n🔒 Permission Error: Your app may need templates.all scope.');
    }
  }
}

testTemplates();