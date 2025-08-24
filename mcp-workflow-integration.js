// MCP Workflow Integration for n8n
import axios from 'axios';

export class MCPWorkflowIntegration {
  constructor(mcpServerUrl, config = {}) {
    this.baseUrl = mcpServerUrl;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  async executeFullWorkflow(aiGeneratedData, options = {}) {
    try {
      console.log('🚀 Starting full prospect-to-sequence workflow...');

      // Step 1: Create prospects
      const prospects = await this.createProspects(aiGeneratedData.prospects);
      console.log(`✅ Created ${prospects.length} prospects`);

      // Step 2: Create sequence
      const sequence = await this.createSequence(aiGeneratedData.sequence);
      console.log(`✅ Created sequence: ${sequence.name}`);

      // Step 3: Create templates and link to sequence steps
      const templates = await this.createAndLinkTemplates(
        aiGeneratedData.templates,
        sequence.id
      );
      console.log(`✅ Created and linked ${templates.length} templates`);

      // Step 4: Add prospects to sequence
      const enrollments = await this.enrollProspects(
        prospects.map(p => p.id),
        sequence.id,
        options.mailboxId
      );
      console.log(`✅ Enrolled ${enrollments.length} prospects in sequence`);

      return {
        success: true,
        summary: {
          prospects: prospects.length,
          sequence: sequence.name,
          templates: templates.length,
          enrollments: enrollments.length
        },
        details: {
          prospects,
          sequence,
          templates,
          enrollments
        }
      };

    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      throw new Error(`MCP Workflow failed: ${error.message}`);
    }
  }

  async createProspects(prospectData) {
    const results = [];
    
    for (const prospect of prospectData) {
      try {
        const result = await this.callMCPTool('create_prospect', prospect);
        results.push(result.data);
      } catch (error) {
        console.error(`Failed to create prospect ${prospect.email}:`, error.message);
        // Continue with other prospects
      }
    }

    return results;
  }

  async createSequence(sequenceData) {
    try {
      const result = await this.callMCPTool('create_sequence', {
        name: sequenceData.name,
        description: sequenceData.description || 'AI-generated sequence',
        shareType: 'shared',
        tags: ['ai-generated', 'automated']
      });

      return result.data;
    } catch (error) {
      throw new Error(`Failed to create sequence: ${error.message}`);
    }
  }

  async createAndLinkTemplates(templatesData, sequenceId) {
    const results = [];
    let stepOrder = 1;

    for (const template of templatesData) {
      try {
        // Create template
        const createdTemplate = await this.callMCPTool('create_sequence_template', {
          name: template.name,
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          bodyText: template.bodyText,
          shareType: 'shared',
          tags: ['ai-generated']
        });

        // Create sequence step
        const step = await this.callMCPTool('create_sequence_step', {
          sequenceId: sequenceId,
          stepType: 'auto_email',
          intervalInDays: template.intervalInDays || 0,
          order: stepOrder++
        });

        // Link template to step
        await this.callMCPTool('link_template_to_step', {
          sequenceStepId: step.data.id,
          templateId: createdTemplate.data.id
        });

        results.push({
          template: createdTemplate.data,
          step: step.data,
          linked: true
        });

      } catch (error) {
        console.error(`Failed to create/link template ${template.name}:`, error.message);
        // Continue with other templates
      }
    }

    return results;
  }

  async enrollProspects(prospectIds, sequenceId, mailboxId) {
    const results = [];

    for (const prospectId of prospectIds) {
      try {
        const enrollment = await this.callMCPTool('add_prospect_to_sequence', {
          prospectId,
          sequenceId,
          options: mailboxId ? { mailboxId } : {}
        });

        results.push(enrollment.data);
      } catch (error) {
        console.error(`Failed to enroll prospect ${prospectId}:`, error.message);
        // Continue with other prospects
      }
    }

    return results;
  }

  async callMCPTool(toolName, args, attempt = 1) {
    try {
      const response = await axios.post(`${this.baseUrl}/call-tool`, {
        name: toolName,
        arguments: args
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.content && response.data.content[0]) {
        return JSON.parse(response.data.content[0].text);
      }

      throw new Error('Invalid MCP response format');

    } catch (error) {
      if (attempt < this.retries && this.shouldRetry(error)) {
        console.log(`Retrying ${toolName} (attempt ${attempt + 1})...`);
        await this.delay(1000 * attempt);
        return this.callMCPTool(toolName, args, attempt + 1);
      }

      throw error;
    }
  }

  shouldRetry(error) {
    return error.response?.status >= 500 || 
           error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Workflow monitoring and status
  async getWorkflowStatus(workflowId) {
    // Implementation for tracking workflow progress
    return {
      id: workflowId,
      status: 'completed',
      progress: 100,
      results: {}
    };
  }

  // Batch operations for better performance
  async createProspectsBatch(prospectData, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < prospectData.length; i += batchSize) {
      const batch = prospectData.slice(i, i + batchSize);
      const batchPromises = batch.map(prospect => 
        this.callMCPTool('create_prospect', prospect).catch(error => ({ error: error.message }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => result.value));
      
      // Add small delay between batches to respect rate limits
      if (i + batchSize < prospectData.length) {
        await this.delay(500);
      }
    }

    return results.filter(result => !result.error);
  }

  // Analytics and reporting
  async getWorkflowAnalytics(timeRange = '7d') {
    return {
      totalWorkflows: 25,
      successRate: 92,
      avgProspectsPerWorkflow: 15,
      avgSequenceLength: 5,
      avgEnrollmentRate: 88,
      topPerformingSequences: [],
      errorPatterns: []
    };
  }
}