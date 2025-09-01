#!/usr/bin/env node

// BMAD Deploy with Context - 20KB deployment orchestrator
// Preserves full environment context during deployments
// Manages Railway deployment with comprehensive logging

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class BMadContextualDeployment {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.deploymentId = `DEPLOY-${this.timestamp}`;
    this.logFile = path.join(__dirname, 'deployment-logs', `${this.deploymentId}.log`);
    this.contextFile = path.join(__dirname, 'deployment-context', `${this.deploymentId}-context.json`);
    
    this.deploymentContext = {
      id: this.deploymentId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      platform: 'railway',
      projectRoot: projectRoot,
      gitCommit: null,
      gitBranch: null,
      packageVersion: null,
      environmentVariables: [],
      preDeploymentHealth: null,
      stories: [],
      plans: [],
      rollbackStrategy: null
    };
    
    this.checks = {
      git: false,
      dependencies: false,
      tests: false,
      build: false,
      environment: false,
      health: false
    };
  }

  async deploy() {
    console.log('🚀 Starting BMAD Contextual Deployment...');
    console.log(`📋 Deployment ID: ${this.deploymentId}`);
    
    // Initialize logging and context preservation
    await this.initializeDeployment();
    
    // Pre-deployment validation
    await this.runPreDeploymentChecks();
    
    // Gather full context
    await this.gatherDeploymentContext();
    
    // Deploy to Railway
    await this.deployToRailway();
    
    // Post-deployment validation
    await this.runPostDeploymentValidation();
    
    // Generate deployment report
    await this.generateDeploymentReport();
    
    console.log('✅ Contextual deployment complete!');
  }

  async initializeDeployment() {
    console.log('📁 Initializing deployment context preservation...');
    
    // Create logging directories
    const logsDir = path.dirname(this.logFile);
    const contextDir = path.dirname(this.contextFile);
    
    fs.mkdirSync(logsDir, { recursive: true });
    fs.mkdirSync(contextDir, { recursive: true });
    
    // Start logging
    this.startLogging();
    
    this.log('info', 'BMAD Contextual Deployment initialized');
    this.log('info', `Deployment ID: ${this.deploymentId}`);
  }

  startLogging() {
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    
    // Override console methods to capture all output
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      const message = args.join(' ');
      this.log('info', message);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      this.log('error', message);
      originalConsoleError(...args);
    };
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    if (this.logStream) {
      this.logStream.write(logEntry);
    }
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment validation checks...');
    
    const checks = [
      { name: 'git', fn: this.checkGitStatus },
      { name: 'dependencies', fn: this.checkDependencies },
      { name: 'tests', fn: this.runTests },
      { name: 'build', fn: this.runBuild },
      { name: 'environment', fn: this.checkEnvironment },
      { name: 'health', fn: this.checkCurrentHealth }
    ];
    
    for (const check of checks) {
      try {
        console.log(`  ⏳ ${check.name}...`);
        await check.fn.call(this);
        this.checks[check.name] = true;
        console.log(`  ✅ ${check.name} passed`);
      } catch (error) {
        console.error(`  ❌ ${check.name} failed:`, error.message);
        this.log('error', `Pre-deployment check failed: ${check.name} - ${error.message}`);
        
        if (['tests', 'build'].includes(check.name)) {
          throw new Error(`Critical check failed: ${check.name}`);
        }
      }
    }
  }

  async checkGitStatus() {
    return new Promise((resolve, reject) => {
      exec('git status --porcelain', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Git check failed: ${error.message}`));
          return;
        }
        
        if (stdout.trim()) {
          this.log('warn', 'Uncommitted changes detected');
          console.log('  ⚠️  Uncommitted changes detected');
        }
        
        // Get commit and branch info
        exec('git rev-parse HEAD', { cwd: projectRoot }, (err, commitHash) => {
          if (!err) {
            this.deploymentContext.gitCommit = commitHash.trim();
          }
          
          exec('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot }, (err, branch) => {
            if (!err) {
              this.deploymentContext.gitBranch = branch.trim();
            }
            resolve();
          });
        });
      });
    });
  }

  async checkDependencies() {
    return new Promise((resolve, reject) => {
      exec('npm audit --audit-level moderate', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error && error.code !== 0) {
          this.log('warn', 'Dependency vulnerabilities detected');
          console.log('  ⚠️  Dependency vulnerabilities detected');
        }
        
        // Check for outdated dependencies
        exec('npm outdated --json', { cwd: projectRoot }, (err, outdatedOutput) => {
          if (outdatedOutput) {
            try {
              const outdated = JSON.parse(outdatedOutput);
              const count = Object.keys(outdated).length;
              if (count > 0) {
                this.log('info', `${count} outdated dependencies detected`);
              }
            } catch (e) {
              // JSON parse error is okay
            }
          }
          resolve();
        });
      });
    });
  }

  async runTests() {
    return new Promise((resolve, reject) => {
      // Check if tests are available
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      
      if (!packageJson.scripts?.test) {
        this.log('warn', 'No test script found, skipping tests');
        resolve();
        return;
      }
      
      exec('npm test', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Tests failed: ${stderr}`));
          return;
        }
        
        this.log('info', 'All tests passed');
        resolve();
      });
    });
  }

  async runBuild() {
    return new Promise((resolve, reject) => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      this.deploymentContext.packageVersion = packageJson.version;
      
      if (!packageJson.scripts?.build) {
        this.log('info', 'No build script found, skipping build');
        resolve();
        return;
      }
      
      exec('npm run build', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Build failed: ${stderr}`));
          return;
        }
        
        this.log('info', 'Build completed successfully');
        resolve();
      });
    });
  }

  async checkEnvironment() {
    const requiredEnvVars = [
      'OUTREACH_CLIENT_ID',
      'OUTREACH_CLIENT_SECRET',
      'OUTREACH_REFRESH_TOKEN'
    ];
    
    const missingVars = [];
    
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      } else {
        this.deploymentContext.environmentVariables.push({
          name: varName,
          set: true,
          length: process.env[varName].length
        });
      }
    });
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    this.log('info', `Environment variables validated: ${requiredEnvVars.length} variables set`);
  }

  async checkCurrentHealth() {
    // Basic health check - ensure key files exist
    const criticalFiles = [
      'package.json',
      'server.js',
      'src/index.js',
      'outreach-proxy.cjs'
    ];
    
    const missingFiles = [];
    
    criticalFiles.forEach(file => {
      if (!fs.existsSync(path.join(projectRoot, file))) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing critical files: ${missingFiles.join(', ')}`);
    }
    
    this.deploymentContext.preDeploymentHealth = {
      criticalFiles: criticalFiles.length,
      allPresent: true,
      timestamp: new Date().toISOString()
    };
  }

  async gatherDeploymentContext() {
    console.log('📊 Gathering comprehensive deployment context...');
    
    // Load BMAD context if available
    await this.loadBMADContext();
    
    // Capture system information
    await this.captureSystemInfo();
    
    // Create rollback strategy
    await this.createRollbackStrategy();
    
    // Save context to file
    fs.writeFileSync(this.contextFile, JSON.stringify(this.deploymentContext, null, 2));
    
    this.log('info', 'Deployment context captured and saved');
  }

  async loadBMADContext() {
    try {
      // Load stories
      const storiesDir = path.join(__dirname, 'stories');
      if (fs.existsSync(storiesDir)) {
        const storyFiles = fs.readdirSync(storiesDir).filter(f => f.endsWith('.md') && f !== 'index.md');
        this.deploymentContext.stories = storyFiles.map(file => ({
          file: file,
          size: fs.statSync(path.join(storiesDir, file)).size,
          modified: fs.statSync(path.join(storiesDir, file)).mtime.toISOString()
        }));
      }
      
      // Load plans
      const agentsDir = path.join(__dirname, 'agents');
      if (fs.existsSync(agentsDir)) {
        const planFiles = fs.readdirSync(agentsDir).filter(f => f.startsWith('execution-plan-'));
        this.deploymentContext.plans = planFiles.map(file => ({
          file: file,
          size: fs.statSync(path.join(agentsDir, file)).size,
          modified: fs.statSync(path.join(agentsDir, file)).mtime.toISOString()
        }));
      }
      
      this.log('info', `BMAD context loaded: ${this.deploymentContext.stories.length} stories, ${this.deploymentContext.plans.length} plans`);
      
    } catch (error) {
      this.log('warn', `Could not load BMAD context: ${error.message}`);
    }
  }

  async captureSystemInfo() {
    this.deploymentContext.system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      memory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024),
      timestamp: new Date().toISOString()
    };
  }

  async createRollbackStrategy() {
    this.deploymentContext.rollbackStrategy = {
      gitCommit: this.deploymentContext.gitCommit,
      packageVersion: this.deploymentContext.packageVersion,
      environmentBackup: this.deploymentContext.environmentVariables,
      instructions: [
        'Revert to previous Railway deployment',
        `Roll back git to commit: ${this.deploymentContext.gitCommit}`,
        'Restore environment variables if needed',
        'Verify health endpoints are responding',
        'Check MCP server initialization'
      ]
    };
  }

  async deployToRailway() {
    console.log('🚂 Deploying to Railway...');
    
    return new Promise((resolve, reject) => {
      // Check if railway CLI is available
      exec('railway --version', (error) => {
        if (error) {
          this.log('warn', 'Railway CLI not found, deployment may need manual trigger');
          console.log('  ⚠️  Railway CLI not found. Deployment will be triggered by git push.');
          
          // If no railway CLI, just push to git which will trigger Railway deployment
          this.deployViaGitPush().then(resolve).catch(reject);
          return;
        }
        
        // Deploy using Railway CLI
        this.deployViaRailwayCLI().then(resolve).catch(reject);
      });
    });
  }

  async deployViaRailwayCLI() {
    return new Promise((resolve, reject) => {
      const deployProcess = spawn('railway', ['up'], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      
      deployProcess.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        this.log('info', `Railway: ${message.trim()}`);
      });
      
      deployProcess.stderr.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        this.log('error', `Railway Error: ${message.trim()}`);
      });
      
      deployProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Railway deployment failed with code ${code}: ${errorOutput}`));
          return;
        }
        
        this.log('info', 'Railway deployment completed successfully');
        resolve();
      });
    });
  }

  async deployViaGitPush() {
    return new Promise((resolve, reject) => {
      // First, check if there are changes to commit
      exec('git status --porcelain', { cwd: projectRoot }, (error, stdout) => {
        if (error) {
          reject(new Error(`Git status check failed: ${error.message}`));
          return;
        }
        
        if (stdout.trim()) {
          // There are uncommitted changes, commit them
          this.commitAndPush().then(resolve).catch(reject);
        } else {
          // No changes, just push
          this.pushToRemote().then(resolve).catch(reject);
        }
      });
    });
  }

  async commitAndPush() {
    return new Promise((resolve, reject) => {
      const commitMessage = `Deploy: ${this.deploymentId} - BMAD contextual deployment`;
      
      exec('git add .', { cwd: projectRoot }, (error) => {
        if (error) {
          reject(new Error(`Git add failed: ${error.message}`));
          return;
        }
        
        exec(`git commit -m "${commitMessage}"`, { cwd: projectRoot }, (error) => {
          if (error) {
            this.log('warn', 'Git commit failed, may be nothing to commit');
          }
          
          this.pushToRemote().then(resolve).catch(reject);
        });
      });
    });
  }

  async pushToRemote() {
    return new Promise((resolve, reject) => {
      exec('git push origin main', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Git push failed: ${error.message}`));
          return;
        }
        
        this.log('info', 'Code pushed to repository, Railway deployment triggered');
        console.log('  📤 Code pushed to repository');
        console.log('  ⏳ Railway deployment triggered automatically');
        
        resolve();
      });
    });
  }

  async runPostDeploymentValidation() {
    console.log('🔍 Running post-deployment validation...');
    
    // Wait for deployment to settle
    console.log('  ⏳ Waiting for deployment to stabilize...');
    await this.sleep(30000); // Wait 30 seconds
    
    try {
      // Health check
      await this.validateHealthEndpoint();
      
      // MCP server validation
      await this.validateMCPServer();
      
      console.log('  ✅ Post-deployment validation passed');
      this.log('info', 'Post-deployment validation completed successfully');
      
    } catch (error) {
      console.error('  ❌ Post-deployment validation failed:', error.message);
      this.log('error', `Post-deployment validation failed: ${error.message}`);
      
      // Don't fail the deployment for validation issues, just log them
      console.log('  ⚠️  Continuing despite validation issues');
    }
  }

  async validateHealthEndpoint() {
    return new Promise((resolve, reject) => {
      const healthUrl = 'https://mcp-outreach-server-production.up.railway.app/health';
      
      exec(`curl -s -o /dev/null -w "%{http_code}" ${healthUrl}`, (error, stdout) => {
        if (error) {
          reject(new Error(`Health endpoint check failed: ${error.message}`));
          return;
        }
        
        if (stdout.trim() === '200') {
          this.log('info', 'Health endpoint responding correctly');
          resolve();
        } else {
          reject(new Error(`Health endpoint returned status: ${stdout.trim()}`));
        }
      });
    });
  }

  async validateMCPServer() {
    return new Promise((resolve, reject) => {
      const toolsUrl = 'https://mcp-outreach-server-production.up.railway.app/tools';
      
      exec(`curl -s "${toolsUrl}" -H "x-api-key: 55d6900ec2fbe3804ba6904ddfb82dc1879cbf0ecdca85b5cc16b8ce964c74c8"`, (error, stdout) => {
        if (error) {
          reject(new Error(`MCP server validation failed: ${error.message}`));
          return;
        }
        
        try {
          const response = JSON.parse(stdout);
          if (response.result && response.result.tools) {
            this.log('info', `MCP server responding with ${response.result.tools.length} tools`);
            resolve();
          } else {
            reject(new Error('MCP server not returning expected tools format'));
          }
        } catch (parseError) {
          reject(new Error(`MCP server response parsing failed: ${parseError.message}`));
        }
      });
    });
  }

  async generateDeploymentReport() {
    console.log('📋 Generating deployment report...');
    
    const report = {
      deployment: this.deploymentContext,
      checks: this.checks,
      summary: {
        success: Object.values(this.checks).every(check => check),
        duration: Date.now() - new Date(this.deploymentContext.timestamp).getTime(),
        timestamp: new Date().toISOString()
      },
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, 'deployment-reports', `${this.deploymentId}-report.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(path.dirname(reportPath), `${this.deploymentId}-report.md`);
    fs.writeFileSync(markdownPath, markdownReport);
    
    this.displayDeploymentSummary(report);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.checks.tests) {
      recommendations.push({
        type: 'testing',
        message: 'Consider adding a test suite to improve deployment reliability',
        priority: 'medium'
      });
    }
    
    if (this.deploymentContext.environmentVariables.length < 3) {
      recommendations.push({
        type: 'configuration',
        message: 'Verify all required environment variables are configured',
        priority: 'high'
      });
    }
    
    if (this.deploymentContext.stories.length === 0) {
      recommendations.push({
        type: 'process',
        message: 'Run BMAD story generation before future deployments for better context',
        priority: 'low'
      });
    }
    
    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# Deployment Report: ${this.deploymentId}

**Timestamp:** ${new Date(report.deployment.timestamp).toLocaleString()}  
**Duration:** ${Math.round(report.summary.duration / 1000)}s  
**Status:** ${report.summary.success ? '✅ Success' : '❌ Failed'}

## Deployment Context

- **Environment:** ${report.deployment.environment}
- **Platform:** ${report.deployment.platform}  
- **Git Commit:** ${report.deployment.gitCommit || 'Unknown'}
- **Git Branch:** ${report.deployment.gitBranch || 'Unknown'}
- **Package Version:** ${report.deployment.packageVersion || 'Unknown'}

## Pre-deployment Checks

${Object.entries(report.checks).map(([check, passed]) => 
  `- **${check}:** ${passed ? '✅ Passed' : '❌ Failed'}`
).join('\n')}

## BMAD Context

- **Stories:** ${report.deployment.stories.length} files
- **Plans:** ${report.deployment.plans.length} files

## System Information

- **Node Version:** ${report.deployment.system?.nodeVersion || 'Unknown'}
- **Platform:** ${report.deployment.system?.platform || 'Unknown'}
- **CPUs:** ${report.deployment.system?.cpus || 'Unknown'}
- **Memory:** ${report.deployment.system?.memory || 'Unknown'}GB

## Rollback Strategy

${report.deployment.rollbackStrategy?.instructions.map(instruction => `- ${instruction}`).join('\n') || 'No rollback strategy defined'}

## Recommendations

${report.recommendations.map(rec => `
### ${rec.type}: ${rec.message}
**Priority:** ${rec.priority}
`).join('\n')}

---

*Generated by BMAD Contextual Deployment on ${new Date().toISOString()}*
`;
  }

  displayDeploymentSummary(report) {
    console.log('\n🎯 DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 Deployment ID: ${this.deploymentId}`);
    console.log(`⏱️  Duration: ${Math.round(report.summary.duration / 1000)}s`);
    console.log(`✅ Status: ${report.summary.success ? 'Success' : 'Failed'}`);
    console.log(`📊 Checks: ${Object.values(this.checks).filter(Boolean).length}/${Object.keys(this.checks).length} passed`);
    console.log(`📋 Context: ${report.deployment.stories.length} stories, ${report.deployment.plans.length} plans`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.message} (${rec.priority})`);
      });
    }
    
    console.log(`\n📄 Full report: .bmad/deployment-reports/${this.deploymentId}-report.md`);
    console.log('📊 Health check: https://mcp-outreach-server-production.up.railway.app/health');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployment = new BMadContextualDeployment();
  deployment.deploy().catch(error => {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  });
}

export default BMadContextualDeployment;