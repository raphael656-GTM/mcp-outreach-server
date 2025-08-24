# Sub-Agent Framework for MCP Outreach Automation

## CONTEXT ENGINEERING APPROACH
Following the specialized sub-agent methodology where **sub-agents are researchers and strategists, not implementers**. Each sub-agent provides detailed analysis and implementation plans while the parent agent handles all actual code execution and API calls.

## AVAILABLE SUB-AGENTS

### 1. Context Manager (`@ContextManager`) ⭐ **SPECIAL AUTHORITY**
**Activation**: `claude-code "ACTIVATE: Context Manager Agent"`
- **Expertise**: Context file management, project tracking, sub-agent coordination
- **Focus**: Maintaining accurate project state and facilitating sub-agent workflows
- **Output**: Updated context files, project status reports, coordination plans
- **SPECIAL STATUS**: This agent CAN edit files - exception to research-only rule
- **Use Cases**:
  - Project status updates and milestone tracking
  - Sub-agent finding integration and workflow coordination
  - Issue documentation and resolution tracking

### 2. Prospect Research Specialist (`@ProspectResearcher`)
**Activation**: `claude-code "ACTIVATE: Prospect Research Specialist Sub-Agent"`
- **Expertise**: Apollo.io, LinkedIn Sales Navigator, company intelligence
- **Focus**: High-quality prospect analysis and data enrichment strategies
- **Output**: Research methodology and data collection plans
- **Use Cases**: 
  - Prospect discovery strategy design
  - Data source integration planning
  - Personalization data mining approaches

### 2. AI Email Strategy Specialist (`@EmailStrategist`) 
**Activation**: `claude-code "ACTIVATE: AI Email Strategy Specialist Sub-Agent"`
- **Expertise**: Claude/GPT prompt engineering, Steve Jobs communication style
- **Focus**: Email generation optimization and sequence design
- **Output**: Prompt templates and content strategy frameworks
- **Use Cases**:
  - Email sequence architecture design
  - AI prompt optimization for personalization
  - A/B testing framework development

### 3. Outreach Integration Specialist (`@OutreachIntegration`)
**Activation**: `claude-code "ACTIVATE: Outreach Integration Specialist Sub-Agent"`
- **Expertise**: Outreach API, MCP architecture, sequence optimization
- **Focus**: Seamless platform integration and performance optimization
- **Output**: Integration strategies and optimization recommendations
- **Use Cases**:
  - MCP tool design and optimization
  - OAuth and authentication strategy
  - Sequence creation workflow design

### 4. Workflow Orchestration Specialist (`@WorkflowOrchestration`)
**Activation**: `claude-code "ACTIVATE: Workflow Orchestration Specialist Sub-Agent"`
- **Expertise**: n8n workflow design, API orchestration, error handling
- **Focus**: End-to-end automation workflow optimization
- **Output**: Workflow architecture and orchestration plans
- **Use Cases**:
  - n8n workflow design and optimization
  - Multi-API coordination strategies
  - Error recovery and resilience planning

## SUB-AGENT ACTIVATION EXAMPLES

### Example 1: Prospect Research Strategy
```bash
claude-code "ACTIVATE: Prospect Research Specialist Sub-Agent

CONTEXT: Need to research healthcare prospects for cold outreach campaign

TARGET CRITERIA:
- Industry: Healthcare technology
- Company Size: 100-500 employees  
- Job Titles: CTO, VP Engineering, Head of Digital
- Geography: United States

RESEARCH OBJECTIVES:
- Identify decision makers with budget authority
- Find personalization angles (recent news, initiatives, pain points)
- Validate contact information accuracy
- Discover technology stack and current solutions

CURRENT CHALLENGES:
- Low personalization quality in existing data
- High bounce rates on email campaigns
- Need better understanding of prospect priorities

Please create a comprehensive research strategy with data sources, collection methodology, and quality validation approaches."
```

### Example 2: Email Sequence Optimization
```bash
claude-code "ACTIVATE: AI Email Strategy Specialist Sub-Agent

CONTEXT: Optimize email generation for healthcare technology prospects

CURRENT PERFORMANCE:
- Open Rate: 22% (below 35% target)
- Reply Rate: 3% (below 8% target)  
- Meeting Booking: 0.8% (below 2% target)

REQUIREMENTS:
- Steve Jobs-style direct communication
- Industry-specific pain points for healthcare
- Personalization using {{first_name}} and {{account.name}}
- 5-touch sequence with optimal timing

CONSTRAINTS:
- Email length: 75-125 words optimal
- Subject lines: 6-10 words maximum
- Must comply with CAN-SPAM regulations
- Integration with existing MCP Outreach server

Please design an optimized email strategy with prompt templates, personalization frameworks, and A/B testing approaches."
```

### Example 3: Integration Architecture Review
```bash
claude-code "ACTIVATE: Outreach Integration Specialist Sub-Agent

CONTEXT: Review and optimize MCP server integration with Outreach

CURRENT ARCHITECTURE:
- MCP Server: Node.js with OAuth 2.0
- Tools: 15+ MCP tools for prospects, sequences, templates
- Performance: ~2 second average response time
- Error Rate: ~5% (mostly OAuth token refresh issues)

OPTIMIZATION GOALS:
- Reduce response time to <1 second
- Achieve <1% error rate
- Handle 100+ concurrent requests
- Improve OAuth token management

SPECIFIC ISSUES:
- Occasional 401 errors during token refresh
- Template linking sometimes fails
- Bulk operations need optimization
- Rate limiting strategy needs refinement

Please analyze the current integration and provide optimization recommendations with specific implementation strategies."
```

### Example 4: Workflow Automation Design
```bash
claude-code "ACTIVATE: Workflow Orchestration Specialist Sub-Agent

CONTEXT: Design end-to-end automation workflow for prospect-to-sequence

REQUIREMENTS:
- Input: 50-100 prospects daily via Apollo.io
- Processing: AI-generated personalized email sequences  
- Output: Complete sequences deployed in Outreach
- Performance: <30 seconds per prospect end-to-end

CURRENT TOOLS:
- n8n for workflow orchestration
- Apollo.io API for prospect data
- Claude 3.5 Sonnet for email generation
- MCP Outreach server for sequence creation

CHALLENGES:
- Rate limiting across multiple APIs
- Error handling for partial failures
- Quality validation of AI-generated content
- Monitoring and alerting for workflow health

Please design a comprehensive workflow architecture with error handling, performance optimization, and monitoring strategies."
```

## CONTEXT HANDOFF PATTERNS

### Sequential Sub-Agent Workflow
```bash
# Phase 1: Research Strategy
claude-code "PHASE 1 - Research Planning
@ProspectResearcher: Analyze prospect research requirements and create data collection strategy for healthcare technology decision makers."

# Phase 2: Email Strategy (with context from Phase 1)
claude-code "PHASE 2 - Email Optimization  
Context from @ProspectResearcher: [Previous findings]
@EmailStrategist: Design email generation strategy using the research methodology from Phase 1."

# Phase 3: Integration Planning (with context from Phases 1-2)  
claude-code "PHASE 3 - Integration Design
Context from previous phases: [Research and email strategies]
@OutreachIntegration: Create MCP tool optimization plan incorporating research and email strategies."

# Phase 4: Workflow Implementation (with context from all phases)
claude-code "PHASE 4 - Workflow Orchestration
Context from all previous phases: [Complete strategy]
@WorkflowOrchestration: Design end-to-end automation workflow implementing all strategic recommendations."
```

### Parallel Sub-Agent Consultation
```bash
# Simultaneous consultation on different aspects
claude-code "PARALLEL CONSULTATION: Email Campaign Optimization

PRIMARY CONTEXT: Improving email campaign performance for healthcare prospects

@EmailStrategist FOCUS: Content optimization and AI prompt engineering
@OutreachIntegration FOCUS: Technical integration and delivery optimization  
@WorkflowOrchestration FOCUS: Automation workflow and error handling

SHARED REQUIREMENTS:
- Target: Healthcare technology companies (100-500 employees)
- Goal: 40% improvement in response rates
- Constraint: Must work with existing MCP Outreach server
- Timeline: Implementation within 2 weeks

Each specialist should analyze from their domain expertise and provide specific optimization recommendations."
```

## BEST PRACTICES FOR SUB-AGENT USAGE

### 1. Context Preparation
- **Always include current project context** from `CONTEXT.md`
- **Specify the domain challenge** clearly and completely
- **Include relevant technical constraints** and requirements
- **Define success criteria** and performance targets

### 2. Proper Activation
- **Use specific sub-agent activation** with clear role definition
- **Provide relevant background information** for context
- **Ask for specific deliverables** (strategy, plan, recommendations)
- **Set boundaries** on what analysis is needed

### 3. Result Integration
- **Read sub-agent outputs thoroughly** before implementation
- **Combine insights from multiple specialists** when needed
- **Use parent agent for all actual implementation** work
- **Update project context** with key strategic decisions

### 4. Quality Assurance
- **Validate sub-agent recommendations** against project requirements
- **Cross-reference specialist advice** for consistency
- **Test proposed strategies** before full implementation
- **Monitor results** and iterate based on performance

## CONTEXT MANAGEMENT

### Project Context File
**Location**: `/Users/raphaelberrebi/mcp-outreach-server/CONTEXT.md`
**Purpose**: Single source of truth for project state and decisions
**Updates**: After each major sub-agent consultation and implementation

### Sub-Agent Output Storage
**Location**: `/Users/raphaelberrebi/mcp-outreach-server/.cloudcode/agents/`
**Contents**: Specialist knowledge bases and consultation templates
**Usage**: Reference for consistent sub-agent activation and context

**REMEMBER**: Sub-agents are your specialized research and strategy team. The parent agent (you) remains the implementer who brings all the strategic insights together into working code.