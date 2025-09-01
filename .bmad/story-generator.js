#!/usr/bin/env node

// BMAD Story Generator - 11KB story creation engine
// Generates detailed development stories with acceptance criteria
// Creates user stories, technical requirements, and implementation plans

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class BMadStoryGenerator {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.flattenedFile = path.join(__dirname, 'flattened-codebase.txt');
    this.outputDir = path.join(__dirname, 'stories');
    this.codebaseContext = null;
    
    this.storyTemplates = {
      feature: {
        priority: 'high',
        category: 'feature',
        template: 'user-story'
      },
      enhancement: {
        priority: 'medium', 
        category: 'enhancement',
        template: 'improvement'
      },
      bugfix: {
        priority: 'high',
        category: 'bugfix', 
        template: 'defect'
      },
      technical: {
        priority: 'low',
        category: 'technical-debt',
        template: 'refactor'
      }
    };
  }

  async generateStories() {
    console.log('📖 Starting BMAD Story Generation...');
    console.log(`🕒 Timestamp: ${this.timestamp}`);
    
    // Load flattened codebase
    await this.loadCodebaseContext();
    
    // Analyze codebase for story opportunities
    const opportunities = await this.analyzeCodebase();
    
    // Generate stories from opportunities
    const stories = await this.createStories(opportunities);
    
    // Write stories to files
    await this.writeStories(stories);
    
    // Generate summary report
    await this.generateSummary(stories);
    
    console.log('✅ Story generation complete!');
  }

  async loadCodebaseContext() {
    try {
      if (!fs.existsSync(this.flattenedFile)) {
        console.log('⚠️  No flattened codebase found. Run `npm run bmad:flatten` first.');
        process.exit(1);
      }
      
      this.codebaseContext = fs.readFileSync(this.flattenedFile, 'utf8');
      console.log('📚 Loaded flattened codebase context');
      
    } catch (error) {
      console.error('❌ Error loading codebase context:', error.message);
      process.exit(1);
    }
  }

  async analyzeCodebase() {
    console.log('🔍 Analyzing codebase for story opportunities...');
    
    const opportunities = [];
    
    // Analyze package.json for missing features
    const packageAnalysis = this.analyzePackageJson();
    opportunities.push(...packageAnalysis);
    
    // Analyze source files for improvement areas
    const codeAnalysis = this.analyzeSourceCode();
    opportunities.push(...codeAnalysis);
    
    // Analyze documentation gaps
    const docAnalysis = this.analyzeDocumentation();
    opportunities.push(...docAnalysis);
    
    // Analyze testing coverage
    const testAnalysis = this.analyzeTestCoverage();
    opportunities.push(...testAnalysis);
    
    console.log(`📊 Found ${opportunities.length} potential story opportunities`);
    return opportunities;
  }

  analyzePackageJson() {
    const opportunities = [];
    
    // Look for MCP-specific improvements
    if (this.codebaseContext.includes('mcp-outreach-server')) {
      opportunities.push({
        type: 'feature',
        title: 'Enhanced MCP Error Handling',
        description: 'Improve error handling and user feedback for MCP protocol validation errors',
        context: 'MCP server validation issues detected',
        priority: 'high',
        estimatedHours: 8,
        category: 'reliability'
      });
      
      opportunities.push({
        type: 'enhancement',
        title: 'MCP Server Health Monitoring',
        description: 'Add comprehensive health monitoring and diagnostics for MCP server',
        context: 'Production reliability improvement',
        priority: 'medium',
        estimatedHours: 12,
        category: 'monitoring'
      });
    }
    
    // Check for Outreach API improvements
    if (this.codebaseContext.includes('outreach') || this.codebaseContext.includes('Outreach')) {
      opportunities.push({
        type: 'feature',
        title: 'Outreach API Rate Limiting',
        description: 'Implement intelligent rate limiting and retry logic for Outreach API calls',
        context: 'API reliability and performance optimization',
        priority: 'high',
        estimatedHours: 16,
        category: 'performance'
      });
      
      opportunities.push({
        type: 'enhancement',
        title: 'Bulk Operations Optimization',
        description: 'Optimize bulk prospect creation and sequence enrollment operations',
        context: 'Performance improvement for large datasets',
        priority: 'medium',
        estimatedHours: 10,
        category: 'performance'
      });
    }
    
    return opportunities;
  }

  analyzeSourceCode() {
    const opportunities = [];
    
    // Look for TODO comments
    const todoMatches = this.codebaseContext.match(/\/\/ TODO:.*$/gm) || [];
    todoMatches.forEach(todo => {
      opportunities.push({
        type: 'technical',
        title: `Address TODO: ${todo.replace('// TODO:', '').trim()}`,
        description: `Implement or resolve the TODO item: ${todo}`,
        context: 'Technical debt cleanup',
        priority: 'low',
        estimatedHours: 4,
        category: 'technical-debt'
      });
    });
    
    // Look for FIXME comments  
    const fixmeMatches = this.codebaseContext.match(/\/\/ FIXME:.*$/gm) || [];
    fixmeMatches.forEach(fixme => {
      opportunities.push({
        type: 'bugfix',
        title: `Fix Issue: ${fixme.replace('// FIXME:', '').trim()}`,
        description: `Resolve the identified issue: ${fixme}`,
        context: 'Bug fix required',
        priority: 'high',
        estimatedHours: 6,
        category: 'bugfix'
      });
    });
    
    // Analyze error handling patterns
    if (this.codebaseContext.includes('console.error') && !this.codebaseContext.includes('winston')) {
      opportunities.push({
        type: 'enhancement',
        title: 'Structured Logging Implementation',
        description: 'Replace console logging with structured logging using Winston or similar',
        context: 'Production logging improvement',
        priority: 'medium',
        estimatedHours: 8,
        category: 'infrastructure'
      });
    }
    
    return opportunities;
  }

  analyzeDocumentation() {
    const opportunities = [];
    
    // Check for README completeness
    if (!this.codebaseContext.includes('## Installation') || 
        !this.codebaseContext.includes('## Usage')) {
      opportunities.push({
        type: 'technical',
        title: 'Complete README Documentation',
        description: 'Add comprehensive installation, usage, and deployment documentation',
        context: 'Documentation improvement',
        priority: 'medium',
        estimatedHours: 4,
        category: 'documentation'
      });
    }
    
    // Check for API documentation
    if (this.codebaseContext.includes('express') && !this.codebaseContext.includes('swagger')) {
      opportunities.push({
        type: 'enhancement',
        title: 'API Documentation with Swagger',
        description: 'Add Swagger/OpenAPI documentation for all API endpoints',
        context: 'API documentation improvement',
        priority: 'low',
        estimatedHours: 12,
        category: 'documentation'
      });
    }
    
    return opportunities;
  }

  analyzeTestCoverage() {
    const opportunities = [];
    
    // Check for testing framework
    if (!this.codebaseContext.includes('jest') && !this.codebaseContext.includes('mocha')) {
      opportunities.push({
        type: 'technical',
        title: 'Testing Framework Setup',
        description: 'Set up comprehensive testing framework with Jest and testing utilities',
        context: 'Quality assurance foundation',
        priority: 'high',
        estimatedHours: 16,
        category: 'testing'
      });
    }
    
    // Look for untested critical functions
    const functionMatches = this.codebaseContext.match(/(?:async\s+)?function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || [];
    if (functionMatches.length > 5 && !this.codebaseContext.includes('describe(')) {
      opportunities.push({
        type: 'technical',
        title: 'Unit Test Coverage Implementation',
        description: 'Add comprehensive unit tests for all critical functions and modules',
        context: 'Test coverage improvement',
        priority: 'medium',
        estimatedHours: 20,
        category: 'testing'
      });
    }
    
    return opportunities;
  }

  async createStories(opportunities) {
    console.log('✏️  Creating detailed user stories...');
    
    const stories = [];
    
    for (const opportunity of opportunities) {
      const story = await this.createStoryFromOpportunity(opportunity);
      stories.push(story);
    }
    
    // Sort by priority
    stories.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    return stories;
  }

  async createStoryFromOpportunity(opportunity) {
    const storyId = this.generateStoryId();
    const template = this.storyTemplates[opportunity.type] || this.storyTemplates.feature;
    
    const story = {
      id: storyId,
      title: opportunity.title,
      type: opportunity.type,
      priority: opportunity.priority,
      category: opportunity.category,
      estimatedHours: opportunity.estimatedHours,
      created: new Date().toISOString(),
      
      // User story format
      asA: this.generateAsA(opportunity),
      iWant: this.generateIWant(opportunity),
      soThat: this.generateSoThat(opportunity),
      
      // Technical details
      description: opportunity.description,
      context: opportunity.context,
      
      // Acceptance criteria
      acceptanceCriteria: this.generateAcceptanceCriteria(opportunity),
      
      // Technical requirements
      technicalRequirements: this.generateTechnicalRequirements(opportunity),
      
      // Testing requirements
      testingRequirements: this.generateTestingRequirements(opportunity),
      
      // Definition of done
      definitionOfDone: this.generateDefinitionOfDone(opportunity)
    };
    
    return story;
  }

  generateStoryId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `STORY-${timestamp}-${random}`;
  }

  generateAsA(opportunity) {
    switch (opportunity.category) {
      case 'reliability':
        return 'a developer using the MCP server';
      case 'monitoring':
        return 'a system administrator';
      case 'performance':
        return 'a user of the Outreach integration';
      case 'documentation':
        return 'a new developer joining the project';
      case 'testing':
        return 'a quality assurance engineer';
      default:
        return 'a user of the system';
    }
  }

  generateIWant(opportunity) {
    return opportunity.title.toLowerCase().replace(/^(add|implement|create|fix|improve|enhance)/, 'to $1');
  }

  generateSoThat(opportunity) {
    switch (opportunity.category) {
      case 'reliability':
        return 'I can have confidence in the system\'s stability and error handling';
      case 'monitoring':
        return 'I can proactively identify and resolve system issues';
      case 'performance':
        return 'I can work more efficiently with faster response times';
      case 'documentation':
        return 'I can understand and contribute to the codebase quickly';
      case 'testing':
        return 'I can ensure code quality and prevent regressions';
      default:
        return 'I can accomplish my goals more effectively';
    }
  }

  generateAcceptanceCriteria(opportunity) {
    const criteria = [
      'Feature implementation is complete and functional',
      'All existing tests continue to pass',
      'New functionality is covered by appropriate tests',
      'Code follows existing style and conventions',
      'Documentation is updated to reflect changes'
    ];
    
    // Add specific criteria based on opportunity type
    switch (opportunity.type) {
      case 'feature':
        criteria.unshift('User can successfully use the new feature as described');
        break;
      case 'enhancement':
        criteria.unshift('Performance improvement is measurably better than baseline');
        break;
      case 'bugfix':
        criteria.unshift('The identified issue is completely resolved');
        criteria.push('Fix does not introduce new issues');
        break;
      case 'technical':
        criteria.unshift('Technical debt is reduced without breaking existing functionality');
        break;
    }
    
    return criteria;
  }

  generateTechnicalRequirements(opportunity) {
    const requirements = [];
    
    if (opportunity.context.includes('MCP')) {
      requirements.push('Maintain compatibility with MCP protocol specification');
      requirements.push('Ensure proper error handling and validation');
    }
    
    if (opportunity.context.includes('API')) {
      requirements.push('Implement proper rate limiting and retry logic');
      requirements.push('Add comprehensive error handling for API failures');
    }
    
    if (opportunity.category === 'testing') {
      requirements.push('Achieve minimum 80% code coverage');
      requirements.push('Include both unit and integration tests');
    }
    
    if (opportunity.category === 'performance') {
      requirements.push('Establish performance benchmarks');
      requirements.push('Implement monitoring for performance metrics');
    }
    
    return requirements;
  }

  generateTestingRequirements(opportunity) {
    return [
      'Unit tests for all new/modified functions',
      'Integration tests for external API interactions',
      'Error case testing for all failure scenarios',
      'Performance testing if applicable',
      'User acceptance testing checklist'
    ];
  }

  generateDefinitionOfDone(opportunity) {
    return [
      'Code is written and peer reviewed',
      'All tests pass including new test coverage',
      'Documentation is updated',
      'Feature is deployed to staging environment',
      'User acceptance testing is completed',
      'Performance impact is measured and acceptable',
      'Security review is completed if applicable',
      'Feature is ready for production deployment'
    ];
  }

  async writeStories(stories) {
    console.log('💾 Writing stories to files...');
    
    // Ensure output directory exists
    fs.mkdirSync(this.outputDir, { recursive: true });
    
    // Write individual story files
    for (const story of stories) {
      const filename = `${story.id}-${story.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
      const filepath = path.join(this.outputDir, filename);
      
      const content = this.generateStoryMarkdown(story);
      fs.writeFileSync(filepath, content, 'utf8');
      
      console.log(`📄 Created: ${filename}`);
    }
    
    // Write stories index
    const indexContent = this.generateStoriesIndex(stories);
    fs.writeFileSync(path.join(this.outputDir, 'index.md'), indexContent, 'utf8');
    
    console.log(`📚 Created stories index with ${stories.length} stories`);
  }

  generateStoryMarkdown(story) {
    return `# ${story.title}

**Story ID:** ${story.id}  
**Type:** ${story.type}  
**Priority:** ${story.priority}  
**Category:** ${story.category}  
**Estimated Hours:** ${story.estimatedHours}  
**Created:** ${new Date(story.created).toLocaleDateString()}

## User Story

**As a** ${story.asA}  
**I want** ${story.iWant}  
**So that** ${story.soThat}

## Description

${story.description}

## Context

${story.context}

## Acceptance Criteria

${story.acceptanceCriteria.map(criterion => `- [ ] ${criterion}`).join('\n')}

## Technical Requirements

${story.technicalRequirements.map(req => `- ${req}`).join('\n')}

## Testing Requirements

${story.testingRequirements.map(req => `- ${req}`).join('\n')}

## Definition of Done

${story.definitionOfDone.map(item => `- [ ] ${item}`).join('\n')}

---

*Generated by BMAD Story Generator on ${new Date().toISOString()}*
`;
  }

  generateStoriesIndex(stories) {
    const priorityGroups = {
      high: stories.filter(s => s.priority === 'high'),
      medium: stories.filter(s => s.priority === 'medium'), 
      low: stories.filter(s => s.priority === 'low')
    };
    
    let content = `# Development Stories Index

Generated: ${new Date().toISOString()}  
Total Stories: ${stories.length}

## Summary by Priority

- **High Priority:** ${priorityGroups.high.length} stories (${priorityGroups.high.reduce((sum, s) => sum + s.estimatedHours, 0)} hours)
- **Medium Priority:** ${priorityGroups.medium.length} stories (${priorityGroups.medium.reduce((sum, s) => sum + s.estimatedHours, 0)} hours)
- **Low Priority:** ${priorityGroups.low.length} stories (${priorityGroups.low.reduce((sum, s) => sum + s.estimatedHours, 0)} hours)

**Total Estimated Effort:** ${stories.reduce((sum, s) => sum + s.estimatedHours, 0)} hours

## Stories by Priority

`;
    
    for (const [priority, storyList] of Object.entries(priorityGroups)) {
      if (storyList.length > 0) {
        content += `\n### ${priority.toUpperCase()} Priority\n\n`;
        
        storyList.forEach(story => {
          const filename = `${story.id}-${story.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
          content += `- [${story.title}](${filename}) (${story.estimatedHours}h) - ${story.category}\n`;
        });
      }
    }
    
    content += `\n---

## Next Steps

1. Review and prioritize stories with team
2. Run \`npm run bmad:plan\` to generate implementation plans
3. Begin implementation starting with high-priority stories
4. Use \`npm run bmad:deploy\` when ready to deploy

*Generated by BMAD Story Generator*
`;
    
    return content;
  }

  async generateSummary(stories) {
    const summary = {
      generated: new Date().toISOString(),
      totalStories: stories.length,
      totalEstimatedHours: stories.reduce((sum, s) => sum + s.estimatedHours, 0),
      priorityBreakdown: {
        high: stories.filter(s => s.priority === 'high').length,
        medium: stories.filter(s => s.priority === 'medium').length,
        low: stories.filter(s => s.priority === 'low').length
      },
      categoryBreakdown: stories.reduce((acc, story) => {
        acc[story.category] = (acc[story.category] || 0) + 1;
        return acc;
      }, {}),
      nextSteps: [
        'Review generated stories in .bmad/stories/',
        'Run npm run bmad:plan to create implementation strategies',
        'Begin development with highest priority stories',
        'Use generated acceptance criteria for validation'
      ]
    };
    
    console.log('\n🎯 STORY GENERATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📚 Total stories: ${summary.totalStories}`);
    console.log(`⏱️  Total estimated hours: ${summary.totalEstimatedHours}`);
    console.log(`🔴 High priority: ${summary.priorityBreakdown.high}`);
    console.log(`🟡 Medium priority: ${summary.priorityBreakdown.medium}`);
    console.log(`🟢 Low priority: ${summary.priorityBreakdown.low}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Next steps:');
    summary.nextSteps.forEach((step, i) => {
      console.log(`   ${i + 1}. ${step}`);
    });
  }
}

// Run story generator
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new BMadStoryGenerator();
  generator.generateStories().catch(error => {
    console.error('💥 Story generation failed:', error);
    process.exit(1);
  });
}

export default BMadStoryGenerator;