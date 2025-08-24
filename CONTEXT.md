# MCP Outreach Automation - Project Context

## PROJECT OVERVIEW
**Name**: AI-Powered Prospect Research & Outreach Automation
**Goal**: Automate end-to-end prospect research, email generation, and sequence creation in Outreach
**Architecture**: MCP Server + n8n Workflows + AI Processing + Multi-source Data Integration

## CURRENT TECH STACK
- **MCP Server**: Node.js with Outreach API integration, OAuth 2.0 authentication
- **Workflow Engine**: n8n for automation orchestration  
- **AI Processing**: Claude 3.5 Sonnet for email generation and prospect analysis
- **Data Sources**: Apollo.io, LinkedIn Sales Navigator, company websites
- **Integration**: RESTful APIs, JSON:API format for Outreach

## PROJECT STRUCTURE
```
/mcp-outreach-server/
├── src/
│   ├── index.js              # MCP server main entry
│   ├── outreach-client.js     # Outreach API client with OAuth
│   ├── tools.js              # MCP tool definitions
│   └── setup-oauth.js        # OAuth setup utilities
├── /n8n-automation/          # Workflow automation
│   ├── workflows/            # n8n workflow templates
│   └── custom-nodes/         # Custom n8n nodes
└── /.env                     # Configuration and credentials
```

## CURRENT STATE
✅ **Working Components**:
- Complete MCP server with OAuth authentication
- Full CRUD operations for prospects, sequences, templates
- Steve Jobs-style email templates with correct Outreach variables
- n8n environment setup with workflow templates
- GitHub repository with all code

🔄 **Integration Points**:
- MCP server running on localhost:3000
- Outreach API integration via OAuth 2.0
- Template creation with {{first_name}} and {{account.name}} variables
- Sequence creation with automatic step linking

## BUSINESS OBJECTIVES
- **Automation Scale**: 50-100 prospects researched daily
- **Personalization**: 90%+ accuracy in personalized outreach
- **Response Rates**: 40% improvement over generic templates  
- **Time Savings**: 85% reduction vs manual process
- **Quality**: Steve Jobs-style direct, compelling communication

## TECHNICAL CONSTRAINTS
- **Rate Limits**: Outreach API limits, AI API quotas
- **Data Quality**: Ensure accurate prospect enrichment
- **Security**: OAuth token refresh, secure credential storage
- **Performance**: <30 second end-to-end automation
- **Reliability**: Error handling and retry mechanisms

## CODING STANDARDS
- **Style**: ES6+ JavaScript modules, async/await patterns
- **Error Handling**: Comprehensive try/catch with retry logic
- **Documentation**: JSDoc comments for all functions
- **Testing**: Unit tests for core business logic
- **Security**: No secrets in code, environment variables only

## CURRENT CHALLENGES
1. **Token Management**: OAuth refresh automation
2. **AI Optimization**: Prompt engineering for consistent quality  
3. **Scalability**: Handling high-volume prospect processing
4. **Integration**: Seamless n8n to MCP server communication
5. **Quality Assurance**: Validating AI-generated content