// n8n Custom Node for AI Prospect Research
export const aiProspectResearch = {
  displayName: 'AI Prospect Research',
  name: 'aiProspectResearch',
  group: ['input'],
  version: 1,
  description: 'AI-powered prospect research and analysis',
  
  defaults: {
    name: 'AI Prospect Research',
    color: '#ff6d5a',
  },

  inputs: ['main'],
  outputs: ['main'],

  properties: [
    {
      displayName: 'Target Criteria',
      name: 'targetCriteria',
      type: 'fixedCollection',
      default: {},
      options: [
        {
          name: 'criteria',
          displayName: 'Search Criteria',
          values: [
            {
              displayName: 'Industry',
              name: 'industry',
              type: 'string',
              default: 'healthcare',
            },
            {
              displayName: 'Company Size',
              name: 'companySize',
              type: 'options',
              options: [
                { name: '1-10', value: '1-10' },
                { name: '11-50', value: '11-50' },
                { name: '51-200', value: '51-200' },
                { name: '201-1000', value: '201-1000' },
                { name: '1000+', value: '1000+' },
              ],
              default: '51-200',
            },
            {
              displayName: 'Job Titles',
              name: 'jobTitles',
              type: 'string',
              default: 'CEO, CTO, VP Engineering',
            }
          ]
        }
      ]
    },
    {
      displayName: 'AI Model',
      name: 'aiModel',
      type: 'options',
      options: [
        { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
        { name: 'GPT-4', value: 'gpt-4' },
      ],
      default: 'claude-3-5-sonnet',
    }
  ],

  async execute() {
    const items = this.getInputData();
    const criteria = this.getNodeParameter('targetCriteria', 0);
    const aiModel = this.getNodeParameter('aiModel', 0);

    const results = [];

    for (let i = 0; i < items.length; i++) {
      // Step 1: Data Collection
      const prospectData = await this.collectProspectData(criteria);
      
      // Step 2: AI Analysis  
      const aiAnalysis = await this.analyzeWithAI(prospectData, aiModel);
      
      // Step 3: Structure for MCP
      const mcpReadyData = await this.formatForMCP(aiAnalysis);

      results.push({
        json: {
          prospects: mcpReadyData.prospects,
          sequences: mcpReadyData.sequences,
          templates: mcpReadyData.templates,
          research_insights: aiAnalysis.insights,
          personalization_data: aiAnalysis.personalization
        }
      });
    }

    return [results];
  },

  async collectProspectData(criteria) {
    // Integration with data sources
    const sources = {
      apollo: await this.searchApollo(criteria),
      linkedin: await this.searchLinkedIn(criteria),
      company_data: await this.enrichCompanyData(criteria),
      news_data: await this.getRecentNews(criteria)
    };
    
    return sources;
  },

  async analyzeWithAI(data, model) {
    const prompt = `
    Analyze this prospect data and provide:
    1. Key pain points for each company
    2. Personalization angles
    3. Best outreach timing
    4. Value propositions that would resonate
    5. Email sequence strategy
    
    Data: ${JSON.stringify(data)}
    `;

    // Call AI API (Claude/GPT)
    const analysis = await this.callAI(prompt, model);
    return analysis;
  },

  async formatForMCP(analysis) {
    // Convert AI analysis to MCP-compatible format
    return {
      prospects: analysis.prospects.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName, 
        email: p.email,
        company: p.company,
        title: p.title,
        customFields: {
          pain_points: p.painPoints,
          personalization: p.personalization,
          best_contact_time: p.contactTiming
        }
      })),
      sequences: analysis.sequences,
      templates: analysis.templates
    };
  }
};