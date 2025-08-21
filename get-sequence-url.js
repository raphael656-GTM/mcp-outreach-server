import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN;
const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';

async function getSequenceInfo() {
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

    // Get the sequence details to find the correct URL structure
    const sequenceId = 1204;
    console.log(`🔍 Getting sequence ${sequenceId} details...`);
    
    const sequenceResponse = await axios.get(`https://api.outreach.io/api/v2/sequences/${sequenceId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    console.log('Sequence details:');
    console.log('- Name:', sequenceResponse.data.data.attributes.name);
    console.log('- ID:', sequenceResponse.data.data.id);
    console.log('- Enabled:', sequenceResponse.data.data.attributes.enabled);
    console.log('- Step Count:', sequenceResponse.data.data.attributes.sequenceStepCount);

    // Check if there's a links section with UI URLs
    if (sequenceResponse.data.data.links) {
      console.log('- Links:', sequenceResponse.data.data.links);
    }

    // Get the steps to see their details
    console.log('\n📧 Getting sequence steps...');
    const stepsResponse = await axios.get(
      `https://api.outreach.io/api/v2/sequenceSteps?filter[sequence][id]=${sequenceId}&sort=order&include=sequenceTemplates,sequenceTemplates.template`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      }
    );

    console.log(`Found ${stepsResponse.data.data.length} steps:`);
    
    stepsResponse.data.data.forEach((step, index) => {
      console.log(`\n  Step ${step.attributes.order}:`);
      console.log(`  - ID: ${step.id}`);
      console.log(`  - Type: ${step.attributes.stepType}`);
      console.log(`  - Interval: ${step.attributes.interval} minutes`);
      
      const seqTemplatesCount = step.relationships.sequenceTemplates?.data?.length || 0;
      console.log(`  - Has sequenceTemplates: ${seqTemplatesCount > 0} (${seqTemplatesCount})`);
      
      if (seqTemplatesCount > 0 && stepsResponse.data.included) {
        const seqTemplateId = step.relationships.sequenceTemplates.data[0].id;
        const seqTemplate = stepsResponse.data.included.find(item => 
          item.type === 'sequenceTemplate' && item.id === seqTemplateId
        );
        
        if (seqTemplate) {
          const templateId = seqTemplate.relationships.template.data.id;
          const template = stepsResponse.data.included.find(item => 
            item.type === 'template' && item.id === templateId
          );
          
          if (template) {
            console.log(`  - Template: "${template.attributes.name}"`);
            console.log(`  - Subject: "${template.attributes.subject}"`);
          }
        }
      }
    });

    // Try different URL formats
    console.log('\n🌐 Possible Outreach URLs to try:');
    console.log(`1. https://app.outreach.io/sequences/${sequenceId}`);
    console.log(`2. https://outreach.io/sequences/${sequenceId}/edit`);
    console.log(`3. https://app.outreach.io/sequences/${sequenceId}/edit`);
    console.log(`4. https://app.outreach.io/home/sequences/${sequenceId}`);
    console.log(`5. https://app1.outreach.io/sequences/${sequenceId}/steps`);

    // Also try to get current user info to understand the correct domain
    try {
      const userResponse = await axios.get('https://api.outreach.io/api/v2/users?page[limit]=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }
      });

      if (userResponse.data.data.length > 0) {
        const user = userResponse.data.data[0];
        console.log('\n👤 User info:');
        console.log('- Email:', user.attributes.email);
        console.log('- First Name:', user.attributes.firstName);
        console.log('- Last Name:', user.attributes.lastName);
      }
    } catch (error) {
      console.log('Could not get user info');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

getSequenceInfo();