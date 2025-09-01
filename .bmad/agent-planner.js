#!/usr/bin/env node

// BMAD Agent Planner - Sub-agent execution strategies
// Creates detailed implementation roadmaps and task breakdowns
// Plans multi-tier specialist consultation workflows

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class BMadAgentPlanner {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.storiesDir = path.join(__dirname, 'stories');
    this.agentsDir = path.join(__dirname, 'agents');
    this.stories = [];
    
    this.specialistTiers = {
      tier1: {
        name: 'Core Development Specialists',
        description: 'Primary specialists for common development tasks',
        specialists: [
          'Full-Stack Developer',
          'API Integration Specialist', 
          'Testing Engineer',
          'DevOps Engineer'
        ]
      },
      tier2: {
        name: 'Domain Specialists',
        description: 'Specialized expertise for specific domains',
        specialists: [
          'MCP Protocol Specialist',
          'Outreach API Expert',
          'Performance Optimization Engineer',
          'Security Specialist',
          'UI/UX Designer'
        ]
      },
      tier3: {
        name: 'Strategic Consultants',
        description: 'High-level architectural and business consultants',
        specialists: [
          'Software Architect',
          'Product Manager',
          'Technical Lead',
          'Business Analyst',
          'Quality Assurance Director'
        ]
      }
    };
    
    this.executionStrategies = {
      sequential: 'Execute tasks one after another in defined order',
      parallel: 'Execute multiple tasks simultaneously where possible',
      iterative: 'Execute in iterations with feedback loops',
      phased: 'Execute in distinct phases with gates between phases'
    };
  }

  async generatePlans() {
    console.log('🎯 Starting BMAD Agent Planning...');
    console.log(`🕒 Timestamp: ${this.timestamp}`);
    
    // Load stories from story generator output
    await this.loadStories();
    
    // Generate execution plans for each story
    const plans = await this.createExecutionPlans();
    
    // Generate specialist consultation strategies
    const consultationStrategies = await this.createConsultationStrategies();
    
    // Create resource allocation plans
    const resourcePlans = await this.createResourcePlans(plans);
    
    // Write all plans to files
    await this.writePlans(plans, consultationStrategies, resourcePlans);
    
    // Generate master execution roadmap
    await this.generateMasterRoadmap(plans);
    
    console.log('✅ Agent planning complete!');
  }

  async loadStories() {
    try {
      if (!fs.existsSync(this.storiesDir)) {
        console.log('⚠️  No stories directory found. Run `npm run bmad:story` first.');
        process.exit(1);
      }
      
      const files = fs.readdirSync(this.storiesDir).filter(f => f.endsWith('.md') && f !== 'index.md');
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(this.storiesDir, file), 'utf8');
        const story = this.parseStoryFromMarkdown(content, file);
        if (story) {
          this.stories.push(story);
        }
      }
      
      console.log(`📚 Loaded ${this.stories.length} stories for planning`);
      
    } catch (error) {
      console.error('❌ Error loading stories:', error.message);
      process.exit(1);
    }
  }

  parseStoryFromMarkdown(content, filename) {
    const lines = content.split('\n');
    const story = {
      filename,
      title: '',
      id: '',
      type: '',
      priority: '',
      category: '',
      estimatedHours: 0,
      acceptanceCriteria: [],
      technicalRequirements: [],
      testingRequirements: []
    };
    
    // Extract basic info
    const titleMatch = content.match(/^# (.+)$/m);
    if (titleMatch) story.title = titleMatch[1];
    
    const idMatch = content.match(/\*\*Story ID:\*\* (.+)$/m);
    if (idMatch) story.id = idMatch[1];
    
    const typeMatch = content.match(/\*\*Type:\*\* (.+)$/m);
    if (typeMatch) story.type = typeMatch[1];
    
    const priorityMatch = content.match(/\*\*Priority:\*\* (.+)$/m);
    if (priorityMatch) story.priority = priorityMatch[1];
    
    const categoryMatch = content.match(/\*\*Category:\*\* (.+)$/m);
    if (categoryMatch) story.category = categoryMatch[1];
    
    const hoursMatch = content.match(/\*\*Estimated Hours:\*\* (.+)$/m);
    if (hoursMatch) story.estimatedHours = parseInt(hoursMatch[1]);
    
    return story;
  }

  async createExecutionPlans() {
    console.log('🗺️  Creating execution plans for each story...');
    
    const plans = [];
    
    for (const story of this.stories) {
      const plan = await this.createPlanForStory(story);
      plans.push(plan);
    }
    
    return plans;
  }

  async createPlanForStory(story) {
    const planId = `PLAN-${story.id}`;
    
    // Determine execution strategy based on story characteristics
    const strategy = this.selectExecutionStrategy(story);
    
    // Break down into tasks
    const tasks = this.breakdownIntoTasks(story);
    
    // Identify required specialists
    const requiredSpecialists = this.identifyRequiredSpecialists(story);
    
    // Estimate timeline
    const timeline = this.estimateTimeline(tasks, story.estimatedHours);
    
    // Identify dependencies
    const dependencies = this.identifyDependencies(story, tasks);
    
    // Create risk assessment
    const risks = this.assessRisks(story, tasks);
    
    const plan = {
      id: planId,
      storyId: story.id,
      storyTitle: story.title,
      priority: story.priority,
      category: story.category,
      strategy: strategy,
      tasks: tasks,
      requiredSpecialists: requiredSpecialists,
      timeline: timeline,
      dependencies: dependencies,
      risks: risks,
      created: new Date().toISOString()
    };
    
    return plan;
  }

  selectExecutionStrategy(story) {
    // Select strategy based on story characteristics
    if (story.category === 'bugfix') {
      return {
        type: 'sequential',
        rationale: 'Bug fixes require careful sequential approach to avoid introducing new issues'
      };
    } else if (story.category === 'performance') {
      return {
        type: 'iterative',
        rationale: 'Performance improvements benefit from iterative testing and optimization'
      };
    } else if (story.estimatedHours > 16) {
      return {
        type: 'phased',
        rationale: 'Large stories benefit from phased approach with validation gates'
      };
    } else if (story.category === 'testing') {
      return {
        type: 'parallel',
        rationale: 'Testing tasks can often be executed in parallel'
      };
    } else {
      return {
        type: 'sequential',
        rationale: 'Standard sequential approach for feature development'
      };
    }
  }

  breakdownIntoTasks(story) {
    const tasks = [];
    
    // Standard development tasks based on story type
    if (story.type === 'feature') {
      tasks.push(
        {
          id: `${story.id}-RESEARCH`,
          name: 'Research and Design',
          description: 'Research requirements and design solution approach',
          estimatedHours: Math.ceil(story.estimatedHours * 0.2),
          dependencies: [],
          specialist: 'Full-Stack Developer'
        },
        {
          id: `${story.id}-IMPLEMENT`,
          name: 'Core Implementation',
          description: 'Implement the main feature functionality',
          estimatedHours: Math.ceil(story.estimatedHours * 0.5),
          dependencies: [`${story.id}-RESEARCH`],
          specialist: 'Full-Stack Developer'
        },
        {
          id: `${story.id}-TEST`,
          name: 'Testing Implementation',
          description: 'Create and execute comprehensive tests',
          estimatedHours: Math.ceil(story.estimatedHours * 0.2),
          dependencies: [`${story.id}-IMPLEMENT`],
          specialist: 'Testing Engineer'
        },
        {
          id: `${story.id}-REVIEW`,
          name: 'Code Review and Refinement',
          description: 'Peer review and address feedback',
          estimatedHours: Math.ceil(story.estimatedHours * 0.1),
          dependencies: [`${story.id}-TEST`],
          specialist: 'Technical Lead'
        }
      );
    } else if (story.type === 'enhancement') {
      tasks.push(
        {
          id: `${story.id}-ANALYZE`,
          name: 'Performance Analysis',
          description: 'Analyze current performance and identify bottlenecks',
          estimatedHours: Math.ceil(story.estimatedHours * 0.25),
          dependencies: [],
          specialist: 'Performance Optimization Engineer'
        },
        {
          id: `${story.id}-OPTIMIZE`,
          name: 'Implementation Optimization',
          description: 'Implement performance improvements',
          estimatedHours: Math.ceil(story.estimatedHours * 0.5),
          dependencies: [`${story.id}-ANALYZE`],
          specialist: 'Full-Stack Developer'
        },
        {
          id: `${story.id}-VALIDATE`,
          name: 'Performance Validation',
          description: 'Validate performance improvements meet requirements',
          estimatedHours: Math.ceil(story.estimatedHours * 0.25),
          dependencies: [`${story.id}-OPTIMIZE`],
          specialist: 'Performance Optimization Engineer'
        }
      );
    } else if (story.type === 'bugfix') {
      tasks.push(
        {
          id: `${story.id}-REPRODUCE`,
          name: 'Bug Reproduction',
          description: 'Reproduce and fully understand the bug',
          estimatedHours: Math.ceil(story.estimatedHours * 0.3),
          dependencies: [],
          specialist: 'Full-Stack Developer'
        },
        {
          id: `${story.id}-FIX`,
          name: 'Bug Fix Implementation',
          description: 'Implement the fix for the identified bug',
          estimatedHours: Math.ceil(story.estimatedHours * 0.4),
          dependencies: [`${story.id}-REPRODUCE`],
          specialist: 'Full-Stack Developer'
        },
        {
          id: `${story.id}-VERIFY`,
          name: 'Fix Verification',
          description: 'Verify fix resolves issue without side effects',
          estimatedHours: Math.ceil(story.estimatedHours * 0.3),
          dependencies: [`${story.id}-FIX`],
          specialist: 'Testing Engineer'
        }
      );
    } else if (story.type === 'technical') {
      tasks.push(
        {
          id: `${story.id}-REFACTOR`,
          name: 'Code Refactoring',
          description: 'Refactor code to address technical debt',
          estimatedHours: Math.ceil(story.estimatedHours * 0.6),
          dependencies: [],
          specialist: 'Full-Stack Developer'
        },
        {
          id: `${story.id}-VALIDATE`,
          name: 'Regression Testing',
          description: 'Ensure refactoring doesn\'t break existing functionality',
          estimatedHours: Math.ceil(story.estimatedHours * 0.4),
          dependencies: [`${story.id}-REFACTOR`],
          specialist: 'Testing Engineer'
        }
      );
    }
    
    return tasks;
  }

  identifyRequiredSpecialists(story) {
    const specialists = new Set();
    
    // Always need core development
    specialists.add('Full-Stack Developer');
    
    // Add based on category
    switch (story.category) {
      case 'reliability':
      case 'monitoring':
        specialists.add('DevOps Engineer');
        specialists.add('MCP Protocol Specialist');
        break;
      case 'performance':
        specialists.add('Performance Optimization Engineer');
        break;
      case 'testing':
        specialists.add('Testing Engineer');
        specialists.add('Quality Assurance Director');
        break;
      case 'documentation':
        specialists.add('Technical Writer');
        break;
      case 'security':
        specialists.add('Security Specialist');
        break;
    }
    
    // Add based on story content
    if (story.title.toLowerCase().includes('api')) {
      specialists.add('API Integration Specialist');
    }
    if (story.title.toLowerCase().includes('outreach')) {
      specialists.add('Outreach API Expert');
    }
    if (story.title.toLowerCase().includes('mcp')) {
      specialists.add('MCP Protocol Specialist');
    }
    
    // Add higher tier specialists for complex stories
    if (story.estimatedHours > 16) {
      specialists.add('Technical Lead');
      specialists.add('Software Architect');
    }
    
    return Array.from(specialists);
  }

  estimateTimeline(tasks, totalHours) {
    const workingHoursPerDay = 6; // Accounting for meetings, breaks, etc.
    const totalDays = Math.ceil(totalHours / workingHoursPerDay);
    
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + totalDays);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalDays: totalDays,
      totalHours: totalHours,
      workingHoursPerDay: workingHoursPerDay
    };
  }

  identifyDependencies(story, tasks) {
    const dependencies = [];
    
    // Internal task dependencies are already defined
    // Add external dependencies
    if (story.category === 'performance') {
      dependencies.push({
        type: 'external',
        description: 'Baseline performance metrics must be established',
        impact: 'Cannot validate improvements without baseline'
      });
    }
    
    if (story.category === 'testing') {
      dependencies.push({
        type: 'external', 
        description: 'Core functionality must be stable',
        impact: 'Testing framework changes may affect existing tests'
      });
    }
    
    if (story.title.toLowerCase().includes('api')) {
      dependencies.push({
        type: 'external',
        description: 'External API must be accessible and stable',
        impact: 'API changes or downtime will block implementation'
      });
    }
    
    return dependencies;
  }

  assessRisks(story, tasks) {
    const risks = [];
    
    // Technical risks
    if (story.category === 'performance') {
      risks.push({
        type: 'technical',
        description: 'Performance improvements may introduce new bugs',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Comprehensive regression testing and gradual rollout'
      });
    }
    
    if (story.category === 'reliability') {
      risks.push({
        type: 'technical',
        description: 'Changes to error handling may mask other issues',
        probability: 'low',
        impact: 'high',
        mitigation: 'Thorough testing with error injection scenarios'
      });
    }
    
    // Resource risks
    if (story.estimatedHours > 20) {
      risks.push({
        type: 'resource',
        description: 'Large story may exceed time estimates',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Break into smaller deliverable chunks with regular checkpoints'
      });
    }
    
    // External risks
    if (story.title.toLowerCase().includes('api')) {
      risks.push({
        type: 'external',
        description: 'External API changes may break integration',
        probability: 'low',
        impact: 'high',
        mitigation: 'Monitor API documentation and implement robust error handling'
      });
    }
    
    return risks;
  }

  async createConsultationStrategies() {
    console.log('👥 Creating specialist consultation strategies...');
    
    const strategies = {};
    
    // Analyze all required specialists across all stories
    const specialistNeeds = this.analyzeSpecialistNeeds();
    
    for (const [specialist, needs] of Object.entries(specialistNeeds)) {
      strategies[specialist] = this.createConsultationStrategy(specialist, needs);
    }
    
    return strategies;
  }

  analyzeSpecialistNeeds() {
    const needs = {};
    
    this.stories.forEach(story => {
      const requiredSpecialists = this.identifyRequiredSpecialists(story);
      
      requiredSpecialists.forEach(specialist => {
        if (!needs[specialist]) {
          needs[specialist] = {
            stories: [],
            totalHours: 0,
            priorities: { high: 0, medium: 0, low: 0 },
            categories: {}
          };
        }
        
        needs[specialist].stories.push(story);
        needs[specialist].totalHours += story.estimatedHours;
        needs[specialist].priorities[story.priority]++;
        needs[specialist].categories[story.category] = (needs[specialist].categories[story.category] || 0) + 1;
      });
    });
    
    return needs;
  }

  createConsultationStrategy(specialist, needs) {
    const tier = this.getSpecialistTier(specialist);
    
    return {
      specialist: specialist,
      tier: tier,
      totalEngagement: needs.totalHours,
      storiesCount: needs.stories.length,
      consultationApproach: this.determineConsultationApproach(specialist, needs),
      scheduleRecommendation: this.createScheduleRecommendation(specialist, needs),
      deliverables: this.defineConsultationDeliverables(specialist, needs),
      success_criteria: this.defineSuccessCriteria(specialist, needs)
    };
  }

  getSpecialistTier(specialist) {
    for (const [tier, info] of Object.entries(this.specialistTiers)) {
      if (info.specialists.includes(specialist)) {
        return tier;
      }
    }
    return 'tier1'; // default
  }

  determineConsultationApproach(specialist, needs) {
    if (needs.totalHours > 40) {
      return 'embedded'; // Work closely with team throughout
    } else if (needs.priorities.high > 2) {
      return 'intensive'; // Focused intensive sessions
    } else {
      return 'advisory'; // Periodic advisory sessions
    }
  }

  createScheduleRecommendation(specialist, needs) {
    const approach = this.determineConsultationApproach(specialist, needs);
    
    switch (approach) {
      case 'embedded':
        return {
          frequency: 'daily',
          duration: '2-4 hours per day',
          totalWeeks: Math.ceil(needs.totalHours / 20),
          milestones: 'Weekly progress reviews'
        };
      case 'intensive':
        return {
          frequency: 'twice weekly',
          duration: '2-3 hour sessions',
          totalWeeks: Math.ceil(needs.totalHours / 10),
          milestones: 'Bi-weekly deliverable reviews'
        };
      case 'advisory':
        return {
          frequency: 'weekly',
          duration: '1-2 hour sessions',
          totalWeeks: Math.ceil(needs.totalHours / 5),
          milestones: 'Monthly strategic reviews'
        };
      default:
        return {
          frequency: 'as needed',
          duration: 'variable',
          totalWeeks: 'flexible',
          milestones: 'deliverable-driven'
        };
    }
  }

  defineConsultationDeliverables(specialist, needs) {
    const deliverables = [];
    
    switch (specialist) {
      case 'Software Architect':
        deliverables.push('Architecture review and recommendations');
        deliverables.push('Technical design documentation');
        deliverables.push('Integration strategy plan');
        break;
      case 'Performance Optimization Engineer':
        deliverables.push('Performance baseline analysis');
        deliverables.push('Optimization implementation plan');
        deliverables.push('Performance validation report');
        break;
      case 'Testing Engineer':
        deliverables.push('Test strategy and plan');
        deliverables.push('Test automation framework');
        deliverables.push('Test coverage report');
        break;
      default:
        deliverables.push('Requirements analysis');
        deliverables.push('Implementation guidance');
        deliverables.push('Quality review and recommendations');
    }
    
    return deliverables;
  }

  defineSuccessCriteria(specialist, needs) {
    return [
      'All assigned stories meet acceptance criteria',
      'Deliverables are completed on time and within scope',
      'Knowledge transfer is completed to development team',
      'Quality standards are met or exceeded',
      'No critical issues introduced in specialist\'s area'
    ];
  }

  async createResourcePlans(plans) {
    console.log('📊 Creating resource allocation plans...');
    
    const resourcePlan = {
      totalProjects: plans.length,
      totalEstimatedHours: plans.reduce((sum, plan) => sum + plan.timeline.totalHours, 0),
      priorityBreakdown: this.calculatePriorityBreakdown(plans),
      specialistWorkload: this.calculateSpecialistWorkload(plans),
      timelineAnalysis: this.analyzeTimelines(plans),
      resourceRecommendations: this.generateResourceRecommendations(plans)
    };
    
    return resourcePlan;
  }

  calculatePriorityBreakdown(plans) {
    return plans.reduce((breakdown, plan) => {
      breakdown[plan.priority] = (breakdown[plan.priority] || 0) + 1;
      return breakdown;
    }, {});
  }

  calculateSpecialistWorkload(plans) {
    const workload = {};
    
    plans.forEach(plan => {
      plan.requiredSpecialists.forEach(specialist => {
        if (!workload[specialist]) {
          workload[specialist] = {
            projectCount: 0,
            totalHours: 0,
            priorities: { high: 0, medium: 0, low: 0 }
          };
        }
        
        workload[specialist].projectCount++;
        workload[specialist].totalHours += plan.timeline.totalHours;
        workload[specialist].priorities[plan.priority]++;
      });
    });
    
    return workload;
  }

  analyzeTimelines(plans) {
    const timelines = plans.map(plan => plan.timeline.totalDays);
    
    return {
      shortestProject: Math.min(...timelines),
      longestProject: Math.max(...timelines),
      averageProject: Math.round(timelines.reduce((sum, days) => sum + days, 0) / timelines.length),
      totalSequentialDays: timelines.reduce((sum, days) => sum + days, 0),
      parallelExecutionDays: Math.max(...timelines)
    };
  }

  generateResourceRecommendations(plans) {
    const recommendations = [];
    
    // Prioritization recommendations
    const highPriorityCount = plans.filter(p => p.priority === 'high').length;
    if (highPriorityCount > 3) {
      recommendations.push({
        type: 'prioritization',
        message: `${highPriorityCount} high-priority stories detected. Consider staggered execution.`,
        action: 'Create execution phases to prevent resource conflicts'
      });
    }
    
    // Specialist capacity recommendations
    const specialistWorkload = this.calculateSpecialistWorkload(plans);
    Object.entries(specialistWorkload).forEach(([specialist, workload]) => {
      if (workload.totalHours > 80) {
        recommendations.push({
          type: 'capacity',
          message: `${specialist} has ${workload.totalHours}h workload across ${workload.projectCount} projects`,
          action: 'Consider additional specialists or extended timeline'
        });
      }
    });
    
    // Parallelization opportunities
    const parallelizable = plans.filter(plan => plan.strategy.type === 'parallel');
    if (parallelizable.length > 1) {
      recommendations.push({
        type: 'optimization',
        message: `${parallelizable.length} stories can be executed in parallel`,
        action: 'Schedule parallel execution to reduce overall timeline'
      });
    }
    
    return recommendations;
  }

  async writePlans(plans, consultationStrategies, resourcePlans) {
    console.log('💾 Writing execution plans to files...');
    
    // Ensure output directory exists
    fs.mkdirSync(this.agentsDir, { recursive: true });
    
    // Write individual execution plans
    for (const plan of plans) {
      const filename = `execution-plan-${plan.storyId}.md`;
      const filepath = path.join(this.agentsDir, filename);
      
      const content = this.generatePlanMarkdown(plan);
      fs.writeFileSync(filepath, content, 'utf8');
      
      console.log(`📄 Created: ${filename}`);
    }
    
    // Write consultation strategies
    const consultationContent = this.generateConsultationMarkdown(consultationStrategies);
    fs.writeFileSync(path.join(this.agentsDir, 'specialist-consultation-strategies.md'), consultationContent, 'utf8');
    
    // Write resource plan
    const resourceContent = this.generateResourcePlanMarkdown(resourcePlans);
    fs.writeFileSync(path.join(this.agentsDir, 'resource-allocation-plan.md'), resourceContent, 'utf8');
    
    console.log(`📚 Created ${plans.length} execution plans and resource strategies`);
  }

  generatePlanMarkdown(plan) {
    return `# Execution Plan: ${plan.storyTitle}

**Plan ID:** ${plan.id}  
**Story ID:** ${plan.storyId}  
**Priority:** ${plan.priority}  
**Category:** ${plan.category}  
**Created:** ${new Date(plan.created).toLocaleDateString()}

## Execution Strategy

**Type:** ${plan.strategy.type}  
**Rationale:** ${plan.strategy.rationale}

## Task Breakdown

${plan.tasks.map(task => `
### ${task.name}
- **Task ID:** ${task.id}
- **Estimated Hours:** ${task.estimatedHours}
- **Specialist:** ${task.specialist}
- **Dependencies:** ${task.dependencies.length ? task.dependencies.join(', ') : 'None'}
- **Description:** ${task.description}
`).join('\n')}

## Required Specialists

${plan.requiredSpecialists.map(specialist => `- ${specialist}`).join('\n')}

## Timeline

- **Start Date:** ${plan.timeline.startDate}
- **End Date:** ${plan.timeline.endDate}  
- **Total Days:** ${plan.timeline.totalDays}
- **Total Hours:** ${plan.timeline.totalHours}
- **Working Hours/Day:** ${plan.timeline.workingHoursPerDay}

## Dependencies

${plan.dependencies.length ? plan.dependencies.map(dep => `
### ${dep.type} Dependency
- **Description:** ${dep.description}
- **Impact:** ${dep.impact}
`).join('\n') : 'No external dependencies identified.'}

## Risk Assessment

${plan.risks.map(risk => `
### ${risk.type} Risk: ${risk.description}
- **Probability:** ${risk.probability}
- **Impact:** ${risk.impact}  
- **Mitigation:** ${risk.mitigation}
`).join('\n')}

---

*Generated by BMAD Agent Planner on ${new Date().toISOString()}*
`;
  }

  generateConsultationMarkdown(strategies) {
    let content = `# Specialist Consultation Strategies

Generated: ${new Date().toISOString()}

## Overview

This document outlines consultation strategies for each required specialist across all planned stories.

`;

    Object.values(strategies).forEach(strategy => {
      content += `
## ${strategy.specialist}

**Tier:** ${strategy.tier}  
**Total Engagement:** ${strategy.totalEngagement} hours  
**Stories Count:** ${strategy.storiesCount}  
**Approach:** ${strategy.consultationApproach}

### Schedule Recommendation
- **Frequency:** ${strategy.scheduleRecommendation.frequency}
- **Duration:** ${strategy.scheduleRecommendation.duration}
- **Total Weeks:** ${strategy.scheduleRecommendation.totalWeeks}
- **Milestones:** ${strategy.scheduleRecommendation.milestones}

### Expected Deliverables
${strategy.deliverables.map(d => `- ${d}`).join('\n')}

### Success Criteria
${strategy.success_criteria.map(c => `- ${c}`).join('\n')}

---
`;
    });

    return content;
  }

  generateResourcePlanMarkdown(resourcePlan) {
    return `# Resource Allocation Plan

Generated: ${new Date().toISOString()}

## Summary

- **Total Projects:** ${resourcePlan.totalProjects}
- **Total Estimated Hours:** ${resourcePlan.totalEstimatedHours}

## Priority Breakdown

${Object.entries(resourcePlan.priorityBreakdown).map(([priority, count]) => 
  `- **${priority}:** ${count} projects`
).join('\n')}

## Timeline Analysis

- **Shortest Project:** ${resourcePlan.timelineAnalysis.shortestProject} days
- **Longest Project:** ${resourcePlan.timelineAnalysis.longestProject} days  
- **Average Project:** ${resourcePlan.timelineAnalysis.averageProject} days
- **Sequential Execution:** ${resourcePlan.timelineAnalysis.totalSequentialDays} days
- **Parallel Execution:** ${resourcePlan.timelineAnalysis.parallelExecutionDays} days

## Specialist Workload

${Object.entries(resourcePlan.specialistWorkload).map(([specialist, workload]) => `
### ${specialist}
- **Projects:** ${workload.projectCount}
- **Total Hours:** ${workload.totalHours}
- **High Priority:** ${workload.priorities.high}
- **Medium Priority:** ${workload.priorities.medium}  
- **Low Priority:** ${workload.priorities.low}
`).join('\n')}

## Recommendations

${resourcePlan.resourceRecommendations.map(rec => `
### ${rec.type}: ${rec.message}
**Action:** ${rec.action}
`).join('\n')}

---

*Generated by BMAD Agent Planner*
`;
  }

  async generateMasterRoadmap(plans) {
    console.log('🗺️  Generating master execution roadmap...');
    
    // Sort plans by priority and dependencies
    const sortedPlans = this.sortPlansByExecution(plans);
    
    const roadmap = {
      phases: this.createExecutionPhases(sortedPlans),
      milestones: this.defineMilestones(sortedPlans),
      criticalPath: this.identifyCriticalPath(sortedPlans),
      resourceTimeline: this.createResourceTimeline(sortedPlans)
    };
    
    const content = this.generateRoadmapMarkdown(roadmap);
    fs.writeFileSync(path.join(this.agentsDir, 'master-execution-roadmap.md'), content, 'utf8');
    
    this.displayRoadmapSummary(roadmap);
  }

  sortPlansByExecution(plans) {
    // Sort by priority first, then by dependencies
    return plans.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by estimated hours (smaller first)
      return a.timeline.totalHours - b.timeline.totalHours;
    });
  }

  createExecutionPhases(sortedPlans) {
    const phases = [
      { name: 'Phase 1: Critical Foundation', plans: [] },
      { name: 'Phase 2: Core Features', plans: [] },
      { name: 'Phase 3: Enhancements', plans: [] },
      { name: 'Phase 4: Optimization', plans: [] }
    ];
    
    sortedPlans.forEach(plan => {
      if (plan.priority === 'high' && plan.category === 'bugfix') {
        phases[0].plans.push(plan);
      } else if (plan.priority === 'high') {
        phases[1].plans.push(plan);
      } else if (plan.priority === 'medium') {
        phases[2].plans.push(plan);
      } else {
        phases[3].plans.push(plan);
      }
    });
    
    return phases;
  }

  defineMilestones(sortedPlans) {
    const milestones = [];
    let cumulativeHours = 0;
    
    sortedPlans.forEach((plan, index) => {
      cumulativeHours += plan.timeline.totalHours;
      
      if (index % 3 === 2 || index === sortedPlans.length - 1) {
        milestones.push({
          name: `Milestone ${Math.floor(index / 3) + 1}`,
          completedProjects: index + 1,
          cumulativeHours: cumulativeHours,
          description: `Complete ${index + 1} of ${sortedPlans.length} planned stories`
        });
      }
    });
    
    return milestones;
  }

  identifyCriticalPath(sortedPlans) {
    // Identify plans that are blocking others or are highest priority
    return sortedPlans.filter(plan => 
      plan.priority === 'high' || 
      plan.category === 'bugfix' ||
      plan.dependencies.some(dep => dep.type === 'external')
    );
  }

  createResourceTimeline(sortedPlans) {
    const timeline = {};
    let currentWeek = 1;
    
    sortedPlans.forEach(plan => {
      const weeks = Math.ceil(plan.timeline.totalDays / 7);
      
      plan.requiredSpecialists.forEach(specialist => {
        if (!timeline[specialist]) {
          timeline[specialist] = [];
        }
        
        timeline[specialist].push({
          weeks: `Week ${currentWeek}-${currentWeek + weeks - 1}`,
          project: plan.storyTitle,
          priority: plan.priority
        });
      });
      
      currentWeek += weeks;
    });
    
    return timeline;
  }

  generateRoadmapMarkdown(roadmap) {
    return `# Master Execution Roadmap

Generated: ${new Date().toISOString()}

## Execution Phases

${roadmap.phases.map(phase => `
### ${phase.name}
${phase.plans.length ? phase.plans.map(plan => 
  `- **${plan.storyTitle}** (${plan.timeline.totalHours}h, ${plan.priority} priority)`
).join('\n') : '- No projects assigned to this phase'}
`).join('\n')}

## Milestones

${roadmap.milestones.map(milestone => `
### ${milestone.name}
- **Completed Projects:** ${milestone.completedProjects}
- **Cumulative Hours:** ${milestone.cumulativeHours}
- **Description:** ${milestone.description}
`).join('\n')}

## Critical Path

${roadmap.criticalPath.map(plan => `
### ${plan.storyTitle}
- **Priority:** ${plan.priority}
- **Category:** ${plan.category}
- **Hours:** ${plan.timeline.totalHours}
- **Rationale:** Critical for project success
`).join('\n')}

## Resource Timeline

${Object.entries(roadmap.resourceTimeline).map(([specialist, assignments]) => `
### ${specialist}
${assignments.map(assignment => 
  `- **${assignment.weeks}:** ${assignment.project} (${assignment.priority})`
).join('\n')}
`).join('\n')}

---

*Generated by BMAD Agent Planner*
`;
  }

  displayRoadmapSummary(roadmap) {
    console.log('\n🎯 EXECUTION PLANNING COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Total execution plans: ${this.stories.length}`);
    console.log(`🚩 Critical path items: ${roadmap.criticalPath.length}`);
    console.log(`🎯 Execution phases: ${roadmap.phases.length}`);
    console.log(`📍 Milestones defined: ${roadmap.milestones.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Next steps:');
    console.log('   1. Review execution plans in .bmad/agents/');
    console.log('   2. Begin with Phase 1 critical foundation items');
    console.log('   3. Engage specialists according to consultation strategies');
    console.log('   4. Use npm run bmad:deploy when ready for deployment');
  }
}

// Run agent planner
if (import.meta.url === `file://${process.argv[1]}`) {
  const planner = new BMadAgentPlanner();
  planner.generatePlans().catch(error => {
    console.error('💥 Agent planning failed:', error);
    process.exit(1);
  });
}

export default BMadAgentPlanner;