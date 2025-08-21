import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function analyzeExistingSequences() {
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

    // Get existing sequences to analyze
    console.log('🔍 Getting existing sequences...');
    const sequencesResponse = await axios.get('https://api.outreach.io/api/v2/sequences?page[limit]=5&sort=-createdAt', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log(`Found ${sequencesResponse.data.data.length} sequences`);

    for (const sequence of sequencesResponse.data.data) {
      console.log(`\n📋 SEQUENCE: ${sequence.attributes.name} (ID: ${sequence.id})`);
      console.log(`- Steps: ${sequence.attributes.sequenceStepCount}`);
      console.log(`- Enabled: ${sequence.attributes.enabled}`);

      // Get steps for this sequence
      const stepsResponse = await axios.get(
        `https://api.outreach.io/api/v2/sequenceSteps?filter[sequence][id]=${sequence.id}&include=sequenceTemplates,sequenceTemplates.template&sort=order`, 
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
          }
        }
      );

      for (const step of stepsResponse.data.data) {
        console.log(`  📧 STEP ${step.attributes.order}: ${step.attributes.stepType}`);
        console.log(`    - ID: ${step.id}`);
        console.log(`    - Interval: ${step.attributes.interval} minutes`);
        
        // Check sequenceTemplates relationship
        const seqTemplatesCount = step.relationships.sequenceTemplates?.data?.length || 0;
        console.log(`    - SequenceTemplates: ${seqTemplatesCount}`);

        if (seqTemplatesCount > 0) {
          // Find the template in included data
          const seqTemplateId = step.relationships.sequenceTemplates.data[0].id;
          const seqTemplate = stepsResponse.data.included?.find(item => 
            item.type === 'sequenceTemplate' && item.id === seqTemplateId
          );
          
          if (seqTemplate) {
            const templateId = seqTemplate.relationships.template.data.id;
            const template = stepsResponse.data.included?.find(item => 
              item.type === 'template' && item.id === templateId
            );
            
            if (template) {
              console.log(`    - Template: "${template.attributes.name}" (ID: ${templateId})`);
              console.log(`    - Subject: "${template.attributes.subject}"`);
              console.log(`    - ShareType: ${template.attributes.shareType}`);
              console.log(`    - Archived: ${template.attributes.archived}`);
            }
          }
        }

        // Check all attributes of the step to see if there are hidden fields
        console.log(`    - All step attributes:`, Object.keys(step.attributes));
      }

      // Only analyze first 2 sequences to avoid spam
      if (sequencesResponse.data.data.indexOf(sequence) >= 1) break;
    }

    // Also check if there are any mailings associated with steps
    console.log('\n🔍 Checking for mailings...');
    const mailingsResponse = await axios.get('https://api.outreach.io/api/v2/mailings?page[limit]=3', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    if (mailingsResponse.data.data.length > 0) {
      console.log('Found mailings - checking their relationship to templates...');
      const mailing = mailingsResponse.data.data[0];
      console.log('Mailing attributes:', Object.keys(mailing.attributes));
      console.log('Mailing relationships:', Object.keys(mailing.relationships || {}));
    }

    // Check sequence templates directly
    console.log('\n🔍 Checking sequenceTemplates directly...');
    const allSeqTemplates = await axios.get('https://api.outreach.io/api/v2/sequenceTemplates?page[limit]=5', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log(`Found ${allSeqTemplates.data.data.length} sequenceTemplates`);
    if (allSeqTemplates.data.data.length > 0) {
      const seqTemplate = allSeqTemplates.data.data[0];
      console.log('SequenceTemplate attributes:', Object.keys(seqTemplate.attributes || {}));
      console.log('SequenceTemplate relationships:', Object.keys(seqTemplate.relationships || {}));
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

analyzeExistingSequences();