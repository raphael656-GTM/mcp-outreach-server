import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function testTemplateLinkingMethods() {
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

    // First, create a template
    console.log('📝 Creating template...');
    const templatePayload = {
      data: {
        type: 'template',
        attributes: {
          name: 'Test Linking Template ' + Date.now(),
          subject: 'Test Subject {{prospect.firstName}}',
          bodyHtml: '<p>Test content for {{prospect.firstName}}</p>',
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

    // Create a sequence
    console.log('\n📋 Creating sequence...');
    const sequencePayload = {
      data: {
        type: 'sequence',
        attributes: {
          name: 'Test Template Linking ' + Date.now(),
          description: 'Testing different template linking methods',
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

    // TEST 1: Try creating step with template in relationships during creation
    console.log('\n🧪 TEST 1: Creating step with template relationship...');
    try {
      const stepWithTemplatePayload = {
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

      const stepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', stepWithTemplatePayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Step created with template relationship!');
      console.log('Step ID:', stepResponse.data.data.id);
      console.log('Relationships:', JSON.stringify(stepResponse.data.data.relationships, null, 2));
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.errors?.[0]?.detail || error.message);
    }

    // TEST 2: Try with emailTemplateId attribute
    console.log('\n🧪 TEST 2: Creating step with emailTemplateId attribute...');
    try {
      const stepWithEmailTemplateId = {
        data: {
          type: 'sequenceStep',
          attributes: {
            stepType: 'auto_email',
            order: 2,
            interval: 1440,
            emailTemplateId: templateId.toString()
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

      const stepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', stepWithEmailTemplateId, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Step created with emailTemplateId!');
      console.log('Step ID:', stepResponse.data.data.id);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.errors?.[0]?.detail || error.message);
    }

    // TEST 3: Try with templateId attribute
    console.log('\n🧪 TEST 3: Creating step with templateId attribute...');
    try {
      const stepWithTemplateId = {
        data: {
          type: 'sequenceStep',
          attributes: {
            stepType: 'auto_email',
            order: 3,
            interval: 2880,
            templateId: templateId.toString()
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

      const stepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', stepWithTemplateId, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Step created with templateId!');
      console.log('Step ID:', stepResponse.data.data.id);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.errors?.[0]?.detail || error.message);
    }

    // TEST 4: Create step, then PATCH with template
    console.log('\n🧪 TEST 4: Create step then PATCH with template...');
    try {
      // First create the step
      const plainStepPayload = {
        data: {
          type: 'sequenceStep',
          attributes: {
            stepType: 'auto_email',
            order: 4,
            interval: 4320
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

      const stepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', plainStepPayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      const stepId = stepResponse.data.data.id;
      console.log('Step created:', stepId);

      // Now try to PATCH it with template
      const patchPayload = {
        data: {
          type: 'sequenceStep',
          id: stepId.toString(),
          relationships: {
            template: {
              data: {
                type: 'template',
                id: templateId.toString()
              }
            }
          }
        }
      };

      const patchResponse = await axios.patch(`https://api.outreach.io/api/v2/sequenceSteps/${stepId}`, patchPayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      console.log('✅ Step patched with template!');
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.errors?.[0]?.detail || error.message);
    }

    // TEST 5: Check if sequenceTemplates relationship actually sets the content
    console.log('\n🧪 TEST 5: Checking sequenceTemplate impact...');
    const plainStep = {
      data: {
        type: 'sequenceStep',
        attributes: {
          stepType: 'auto_email',
          order: 5,
          interval: 5760
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

    const finalStepResponse = await axios.post('https://api.outreach.io/api/v2/sequenceSteps', plainStep, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    const finalStepId = finalStepResponse.data.data.id;

    // Create sequenceTemplate
    const seqTemplatePayload = {
      data: {
        type: 'sequenceTemplate',
        relationships: {
          sequenceStep: {
            data: {
              type: 'sequenceStep',
              id: finalStepId.toString()
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

    await axios.post('https://api.outreach.io/api/v2/sequenceTemplates', seqTemplatePayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    // Now fetch the step to see what's included
    const verifyResponse = await axios.get(
      `https://api.outreach.io/api/v2/sequenceSteps/${finalStepId}?include=sequenceTemplates,sequenceTemplates.template`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      }
    );

    console.log('Step with sequenceTemplate:');
    console.log('- Has sequenceTemplates:', verifyResponse.data.data.relationships.sequenceTemplates?.data?.length > 0);
    console.log('- Included resources:', verifyResponse.data.included?.map(r => r.type));

    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`Sequence: ${sequenceId}`);
    console.log(`Template: ${templateId}`);
    console.log('\n🌐 Check in Outreach UI:');
    console.log(`https://app.outreach.io/sequences/${sequenceId}/steps`);
    console.log('\nLook for which steps (if any) have the template automatically assigned.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.response?.data || error.message);
  }
}

testTemplateLinkingMethods();