import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testDifferentStepApproaches() {
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

    // Create sequence
    console.log('📋 Creating sequence...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Different Approaches Test ' + Date.now(),
          description: 'Testing different ways to create steps with content',
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

    // TEST 1: Try creating an "unnamed" template as mentioned in docs
    console.log('\n🧪 TEST 1: Creating unnamed template...');
    try {
      const unnamedTemplatePayload = {
        data: {
          type: 'template',
          attributes: {
            // No name field - making it "unnamed"
            subject: 'Unnamed Template Subject {{prospect.firstName}}',
            bodyHtml: '<p>This is an unnamed template for {{prospect.firstName}}</p>',
            shareType: 'shared',
            archived: false
          }
        }
      };

      const unnamedTemplateResponse = await axios.post('https://api.outreach.io/api/v2/templates', unnamedTemplatePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Unnamed template created:', unnamedTemplateResponse.data.data.id);
      console.log('Template name:', unnamedTemplateResponse.data.data.attributes.name);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.errors?.[0]?.detail || error.message);
    }

    // TEST 2: Try different step creation order - create template and step together
    console.log('\n🧪 TEST 2: Creating template and step together...');
    
    // Create template first
    const templatePayload = {
      data: {
        type: 'template',
        attributes: {
          name: 'Inline Template ' + Date.now(),
          subject: 'Inline Subject {{prospect.firstName}}',
          bodyHtml: '<h1>Inline Content</h1><p>This should work for {{prospect.firstName}}</p>',
          shareType: 'shared',
          archived: false
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

    // Now create step and sequenceTemplate in rapid succession
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

    // Immediately create sequenceTemplate link
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

    console.log('✅ Template and step created together, sequenceTemplate:', linkResponse.data.data.id);

    // TEST 3: Check if we need to do something with mailings
    console.log('\n🧪 TEST 3: Investigating mailing relationship...');
    
    // Let's see what the step looks like now
    const stepCheck = await axios.get(`https://api.outreach.io/api/v2/sequenceSteps/${stepId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('Step relationships keys:', Object.keys(stepCheck.data.data.relationships));
    if (stepCheck.data.data.relationships.mailings) {
      console.log('Mailings relationship:', stepCheck.data.data.relationships.mailings);
    }

    // TEST 4: Check the sequence-level templates
    console.log('\n🧪 TEST 4: Checking sequence-level template relationships...');
    const sequenceCheck = await axios.get(`https://api.outreach.io/api/v2/sequences/${sequenceId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('Sequence relationships keys:', Object.keys(sequenceCheck.data.data.relationships || {}));

    // TEST 5: Try creating a step with different stepType values
    console.log('\n🧪 TEST 5: Trying manual_email stepType...');
    try {
      const manualStepPayload = {
        data: {
          type: 'sequenceStep',
          attributes: {
            stepType: 'manual_email',  // Try manual instead of auto
            order: 2,
            interval: 1440
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

      const manualStepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', manualStepPayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Manual email step created:', manualStepResponse.data.data.id);

      // Link template to manual step
      const manualLinkPayload = {
        data: {
          type: 'sequenceTemplate',
          relationships: {
            sequenceStep: {
              data: {
                type: 'sequenceStep',
                id: manualStepResponse.data.data.id.toString()
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

      await axios.post('https://api.outreach.io/api/v2/sequenceTemplates', manualLinkPayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Template linked to manual email step');
    } catch (error) {
      console.log('❌ Manual email step failed:', error.response?.data?.errors?.[0]?.detail || error.message);
    }

    console.log('\n📊 SUMMARY');
    console.log('================');
    console.log(`Sequence: ${sequenceId}`);
    console.log(`Template: ${templateId}`);
    console.log('\n🌐 Check this URL:');
    console.log(`https://app.outreach.io/sequences/${sequenceId}/steps`);
    console.log('\nLook specifically for differences between:');
    console.log('- Step 1 (auto_email)');
    console.log('- Step 2 (manual_email)');
    console.log('- Whether templates appear in either case');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDifferentStepApproaches();