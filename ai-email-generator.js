// AI Email Generation Service for n8n Integration
import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';

export class AIEmailGenerator {
  constructor(config) {
    this.anthropic = new Anthropic({ apiKey: config.anthropicKey });
    this.openai = new OpenAI({ apiKey: config.openaiKey });
    this.model = config.preferredModel || 'claude-3-5-sonnet';
  }

  async generateSequence(researchData, config = {}) {
    const prompt = this.buildSequencePrompt(researchData, config);
    
    let response;
    if (this.model.includes('claude')) {
      response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });
    } else {
      response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000
      });
    }

    return this.parseSequenceResponse(response);
  }

  buildSequencePrompt(researchData, config) {
    return `
# AI Email Sequence Generation

## Research Data:
${JSON.stringify(researchData, null, 2)}

## Requirements:
- Style: ${config.style || 'Steve Jobs direct and compelling'}
- Sequence Type: ${config.sequenceType || '5-touch cold outreach'}
- Industry Focus: ${config.industry || 'healthcare'}
- Value Prop: ${config.valueProp || 'digital transformation ROI'}

## Instructions:
Create a ${config.sequenceType} email sequence with these specifications:

### Email 1 (Day 0): Hook + Problem Identification
- Subject: Compelling, personalized hook
- Opening: Reference specific company detail from research
- Problem: Highlight pain point from research data
- Teaser: Hint at solution without revealing everything
- CTA: Soft ask for brief conversation

### Email 2 (Day 3): Social Proof + Case Study  
- Subject: Reference to similar company success
- Opening: Acknowledge potential busyness
- Case Study: Specific results from similar company in same industry
- Relevance: Connect to prospect's situation
- CTA: Offer to share more details

### Email 3 (Day 7): Resource + Value
- Subject: Free resource offer
- Opening: Different angle from previous emails
- Resource: Valuable tool/report/assessment
- Value: Clear benefit to prospect
- CTA: Download/access offer

### Email 4 (Day 14): Different Angle + Urgency
- Subject: New approach/angle
- Opening: Reference industry trend/news
- Different Value Prop: Alternative benefit
- Soft Urgency: Time-sensitive opportunity
- CTA: Quick 15-minute call

### Email 5 (Day 21): Breakup + Door Opener
- Subject: "Last email" or similar
- Opening: Acknowledge lack of response
- Assumption: Maybe not the right time
- Door Opener: Open invitation for future
- CTA: Simple yes/no response

## Variables to Use:
- {{first_name}} for prospect first name
- {{account.name}} for company name
- {{account.industry}} for industry
- Use research data for personalization

## Output Format:
Return structured JSON with:
{
  "sequence": {
    "name": "sequence name",
    "description": "sequence description"
  },
  "templates": [
    {
      "step": 1,
      "name": "template name",
      "subject": "email subject",
      "bodyHtml": "HTML email body",
      "bodyText": "plain text version",
      "intervalInDays": 0
    }
  ]
}

Generate compelling, personalized emails using the research data provided.
    `;
  }

  parseSequenceResponse(response) {
    let content;
    if (response.content) {
      content = response.content[0].text; // Claude
    } else {
      content = response.choices[0].message.content; // OpenAI
    }

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to generate valid sequence structure');
    }
  }

  async generateSingleEmail(context, config = {}) {
    const prompt = `
Generate a compelling ${config.type || 'cold outreach'} email:

Context: ${JSON.stringify(context)}
Style: ${config.style || 'Professional but direct'}
Goal: ${config.goal || 'Schedule a meeting'}

Include:
- Personalized subject line using {{first_name}} or {{account.name}}
- Research-based opening
- Clear value proposition  
- Strong call-to-action
- Professional signature

Return JSON format:
{
  "subject": "email subject",
  "bodyHtml": "HTML version",
  "bodyText": "plain text version"
}
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    return this.parseEmailResponse(response);
  }

  parseEmailResponse(response) {
    const content = response.content[0].text;
    
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in email response');
    } catch (error) {
      console.error('Failed to parse email response:', error);
      throw new Error('Failed to generate valid email structure');
    }
  }

  // A/B Testing functionality
  async generateVariants(baseEmail, variantTypes = ['subject', 'opening', 'cta']) {
    const variants = {};
    
    for (const type of variantTypes) {
      const prompt = `
Create a variant of this email focusing on ${type} optimization:

Original Email: ${JSON.stringify(baseEmail)}

Generate 2 variants with different ${type} approaches.
Return JSON with variant1 and variant2 objects.
      `;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      variants[type] = this.parseVariantResponse(response);
    }

    return variants;
  }

  parseVariantResponse(response) {
    const content = response.content[0].text;
    
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      return { variant1: null, variant2: null };
    } catch (error) {
      console.error('Failed to parse variant response:', error);
      return { variant1: null, variant2: null };
    }
  }
}