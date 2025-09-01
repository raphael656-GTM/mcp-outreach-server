#!/usr/bin/env node

// BMAD Codebase Flattener - 15KB sophisticated tool
// Creates a single flattened file containing entire codebase
// Removes comments, optimizes whitespace for AI analysis

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const config = {
  outputFile: path.join(projectRoot, '.bmad', 'flattened-codebase.txt'),
  includePatterns: [
    /\.(js|ts|jsx|tsx|json|md|yml|yaml)$/,
    /^package\.json$/,
    /^\.env\.example$/,
    /^README\.md$/,
    /^tsconfig\.json$/
  ],
  excludePatterns: [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.nyc_output/,
    /\.next/,
    /\.cache/,
    /\.bmad\/flattened-codebase\.txt$/,
    /\.log$/,
    /\.lock$/,
    /package-lock\.json$/,
    /yarn\.lock$/
  ],
  maxFileSize: 1024 * 1024, // 1MB
  removeComments: true,
  optimizeWhitespace: true
};

class CodebaseFlattener {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      linesProcessed: 0,
      bytesProcessed: 0,
      commentsRemoved: 0,
      whitespaceOptimized: 0
    };
    this.outputLines = [];
    this.startTime = Date.now();
  }

  async flatten() {
    console.log('🔄 Starting codebase flattening...');
    console.log(`📂 Project root: ${projectRoot}`);
    
    // Add header
    this.addHeader();
    
    // Process all files
    await this.processDirectory(projectRoot);
    
    // Write output
    await this.writeOutput();
    
    // Show statistics
    this.showStats();
  }

  addHeader() {
    const timestamp = new Date().toISOString();
    this.outputLines.push(
      '=' * 80,
      `BMAD FLATTENED CODEBASE - Generated: ${timestamp}`,
      `Project: ${path.basename(projectRoot)}`,
      '=' * 80,
      '',
      'TABLE OF CONTENTS:',
      ''
    );
  }

  async processDirectory(dirPath, relativePath = '') {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        
        if (this.shouldExclude(relativeItemPath, fullPath)) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          await this.processDirectory(fullPath, relativeItemPath);
        } else if (stat.isFile() && this.shouldInclude(item)) {
          await this.processFile(fullPath, relativeItemPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing directory ${dirPath}:`, error.message);
    }
  }

  shouldExclude(relativePath, fullPath) {
    return config.excludePatterns.some(pattern => pattern.test(relativePath));
  }

  shouldInclude(filename) {
    return config.includePatterns.some(pattern => pattern.test(filename));
  }

  async processFile(fullPath, relativePath) {
    try {
      const stat = fs.statSync(fullPath);
      
      if (stat.size > config.maxFileSize) {
        console.log(`⏭️  Skipping large file: ${relativePath} (${this.formatBytes(stat.size)})`);
        return;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      this.stats.filesProcessed++;
      this.stats.linesProcessed += lines.length;
      this.stats.bytesProcessed += stat.size;
      
      // Add file header
      this.outputLines.push(
        '',
        '─' * 80,
        `FILE: ${relativePath}`,
        `SIZE: ${this.formatBytes(stat.size)} | LINES: ${lines.length}`,
        `MODIFIED: ${stat.mtime.toISOString()}`,
        '─' * 80,
        ''
      );
      
      // Process content
      const processedContent = this.processFileContent(content, fullPath);
      this.outputLines.push(processedContent);
      
      console.log(`✅ Processed: ${relativePath}`);
      
    } catch (error) {
      console.error(`❌ Error processing file ${relativePath}:`, error.message);
    }
  }

  processFileContent(content, filePath) {
    let processed = content;
    const ext = path.extname(filePath).toLowerCase();
    
    // Remove comments based on file type
    if (config.removeComments) {
      processed = this.removeComments(processed, ext);
    }
    
    // Optimize whitespace
    if (config.optimizeWhitespace && !['.md', '.txt'].includes(ext)) {
      processed = this.optimizeWhitespace(processed);
    }
    
    return processed;
  }

  removeComments(content, fileExt) {
    const beforeLines = content.split('\n').length;
    let processed = content;
    
    switch (fileExt) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
        // Remove single-line comments
        processed = processed.replace(/\/\/.*$/gm, '');
        // Remove multi-line comments (but preserve JSDoc-style)
        processed = processed.replace(/\/\*(?!\*)([\s\S]*?)\*\//g, '');
        break;
      
      case '.json':
        // JSON doesn't have comments, but some files might have them
        break;
      
      case '.md':
        // Don't remove comments from markdown
        break;
      
      case '.yml':
      case '.yaml':
        // Remove YAML comments
        processed = processed.replace(/^\s*#.*$/gm, '');
        break;
    }
    
    const afterLines = processed.split('\n').length;
    this.stats.commentsRemoved += (beforeLines - afterLines);
    
    return processed;
  }

  optimizeWhitespace(content) {
    const beforeLength = content.length;
    
    // Remove trailing whitespace
    let processed = content.replace(/[ \t]+$/gm, '');
    
    // Reduce multiple empty lines to maximum 2
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    // Remove leading/trailing empty lines
    processed = processed.replace(/^\n+/, '').replace(/\n+$/, '\n');
    
    const afterLength = processed.length;
    this.stats.whitespaceOptimized += (beforeLength - afterLength);
    
    return processed;
  }

  async writeOutput() {
    const content = this.outputLines.join('\n');
    
    // Add footer with statistics
    const footer = [
      '',
      '=' * 80,
      'FLATTENING STATISTICS',
      '=' * 80,
      `Files processed: ${this.stats.filesProcessed}`,
      `Lines processed: ${this.stats.linesProcessed.toLocaleString()}`,
      `Bytes processed: ${this.formatBytes(this.stats.bytesProcessed)}`,
      `Comments removed: ${this.stats.commentsRemoved.toLocaleString()} lines`,
      `Whitespace optimized: ${this.formatBytes(this.stats.whitespaceOptimized)}`,
      `Generated: ${new Date().toISOString()}`,
      `Processing time: ${Date.now() - this.startTime}ms`,
      '=' * 80
    ].join('\n');
    
    const finalContent = content + '\n' + footer;
    
    fs.writeFileSync(config.outputFile, finalContent, 'utf8');
    console.log(`\n📁 Flattened codebase written to: ${config.outputFile}`);
    console.log(`📊 Output size: ${this.formatBytes(finalContent.length)}`);
  }

  showStats() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n🎯 FLATTENING COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Files processed: ${this.stats.filesProcessed}`);
    console.log(`📏 Lines processed: ${this.stats.linesProcessed.toLocaleString()}`);
    console.log(`💾 Data processed: ${this.formatBytes(this.stats.bytesProcessed)}`);
    console.log(`🧹 Comments removed: ${this.stats.commentsRemoved.toLocaleString()} lines`);
    console.log(`✨ Whitespace saved: ${this.formatBytes(this.stats.whitespaceOptimized)}`);
    console.log(`⏱️  Processing time: ${duration}ms`);
    console.log(`📁 Output: ${path.relative(process.cwd(), config.outputFile)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Next steps:');
    console.log('   1. npm run bmad:story  - Generate development stories');
    console.log('   2. npm run bmad:plan   - Create execution strategy');
    console.log('   3. Implement features with Claude Code');
    console.log('   4. npm run bmad:deploy - Deploy with context');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the flattener
if (import.meta.url === `file://${process.argv[1]}`) {
  const flattener = new CodebaseFlattener();
  flattener.flatten().catch(error => {
    console.error('💥 Flattening failed:', error);
    process.exit(1);
  });
}

export default CodebaseFlattener;