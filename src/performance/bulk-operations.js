// Bulk Operations Manager for batch API calls
import { setTimeout as delay } from 'timers/promises';

class BulkOperationsManager {
  constructor(outreachClient, config = {}) {
    this.client = outreachClient;
    this.batchSize = config.batchSize || 25;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.parallelLimit = config.parallelLimit || 5;

    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      retriedOperations: 0
    };
  }

  // Bulk create prospects with error handling
  async bulkCreateProspects(prospectsData, options = {}) {
    console.error(`📦 Starting bulk prospect creation: ${prospectsData.length} prospects`);
    
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: prospectsData.length,
        succeeded: 0,
        failed: 0,
        batchesProcessed: 0
      }
    };

    // Split into batches
    const batches = this.createBatches(prospectsData, this.batchSize);
    console.error(`🔄 Processing ${batches.length} batches of ${this.batchSize} prospects each`);

    // Process batches with limited parallelism
    for (let i = 0; i < batches.length; i += this.parallelLimit) {
      const batchGroup = batches.slice(i, i + this.parallelLimit);
      const batchPromises = batchGroup.map((batch, index) => 
        this.processBatch(batch, i + index, 'prospects')
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Aggregate results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.successful.push(...result.value.successful);
          results.failed.push(...result.value.failed);
          results.summary.batchesProcessed++;
        } else {
          console.error(`❌ Batch processing failed: ${result.reason}`);
          results.failed.push({ error: result.reason, batch: true });
        }
      });

      // Rate limiting between batch groups
      if (i + this.parallelLimit < batches.length) {
        await delay(500);
      }
    }

    results.summary.succeeded = results.successful.length;
    results.summary.failed = results.failed.length;

    console.error(`✅ Bulk prospect creation complete: ${results.summary.succeeded}/${results.summary.total} successful`);
    return results;
  }

  // Process individual batch with retry logic
  async processBatch(batch, batchIndex, operationType, attempt = 1) {
    const results = { successful: [], failed: [] };

    try {
      console.error(`⚡ Processing batch ${batchIndex + 1}: ${batch.length} items (attempt ${attempt})`);

      for (const item of batch) {
        try {
          let result;
          
          switch (operationType) {
            case 'prospects':
              result = await this.client.createProspect(item);
              break;
            case 'sequences':
              result = await this.client.createSequence(item);
              break;
            case 'templates':
              result = await this.client.createSequenceTemplate(item);
              break;
            default:
              throw new Error(`Unknown operation type: ${operationType}`);
          }

          results.successful.push({
            input: item,
            result: result,
            batchIndex: batchIndex
          });

          this.stats.successfulOperations++;
          
          // Small delay between individual API calls
          await delay(100);

        } catch (error) {
          console.error(`❌ Individual operation failed: ${error.message}`);
          results.failed.push({
            input: item,
            error: error.message,
            batchIndex: batchIndex
          });
          this.stats.failedOperations++;
        }
      }

      this.stats.totalOperations += batch.length;
      return results;

    } catch (error) {
      console.error(`❌ Batch ${batchIndex + 1} failed: ${error.message}`);

      // Retry logic for entire batch
      if (attempt < this.maxRetries) {
        console.error(`🔄 Retrying batch ${batchIndex + 1} in ${this.retryDelay}ms (attempt ${attempt + 1})`);
        this.stats.retriedOperations++;
        
        await delay(this.retryDelay * attempt); // Exponential backoff
        return this.processBatch(batch, batchIndex, operationType, attempt + 1);
      }

      // Mark entire batch as failed
      batch.forEach(item => {
        results.failed.push({
          input: item,
          error: `Batch failed after ${this.maxRetries} attempts: ${error.message}`,
          batchIndex: batchIndex
        });
      });

      this.stats.failedOperations += batch.length;
      return results;
    }
  }

  // Bulk create sequences
  async bulkCreateSequences(sequencesData, options = {}) {
    console.error(`📦 Starting bulk sequence creation: ${sequencesData.length} sequences`);
    
    const batches = this.createBatches(sequencesData, Math.min(this.batchSize, 10)); // Smaller batches for sequences
    const results = { successful: [], failed: [], summary: { total: sequencesData.length, succeeded: 0, failed: 0 } };

    for (let i = 0; i < batches.length; i++) {
      const batchResult = await this.processBatch(batches[i], i, 'sequences');
      results.successful.push(...batchResult.successful);
      results.failed.push(...batchResult.failed);
      
      await delay(1000); // Longer delay for sequences
    }

    results.summary.succeeded = results.successful.length;
    results.summary.failed = results.failed.length;

    console.error(`✅ Bulk sequence creation complete: ${results.summary.succeeded}/${results.summary.total} successful`);
    return results;
  }

  // Bulk create templates
  async bulkCreateTemplates(templatesData, options = {}) {
    console.error(`📦 Starting bulk template creation: ${templatesData.length} templates`);
    
    const batches = this.createBatches(templatesData, Math.min(this.batchSize, 15));
    const results = { successful: [], failed: [], summary: { total: templatesData.length, succeeded: 0, failed: 0 } };

    for (let i = 0; i < batches.length; i++) {
      const batchResult = await this.processBatch(batches[i], i, 'templates');
      results.successful.push(...batchResult.successful);
      results.failed.push(...batchResult.failed);
      
      await delay(500);
    }

    results.summary.succeeded = results.successful.length;
    results.summary.failed = results.failed.length;

    console.error(`✅ Bulk template creation complete: ${results.summary.succeeded}/${results.summary.total} successful`);
    return results;
  }

  // Bulk enroll prospects in sequences
  async bulkEnrollProspects(enrollmentData, options = {}) {
    console.error(`📦 Starting bulk prospect enrollment: ${enrollmentData.length} enrollments`);
    
    const results = { successful: [], failed: [], summary: { total: enrollmentData.length, succeeded: 0, failed: 0 } };
    
    // Process enrollments in smaller batches to avoid overwhelming the API
    const batches = this.createBatches(enrollmentData, Math.min(this.batchSize, 20));
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        for (const enrollment of batch) {
          try {
            const result = await this.client.addProspectToSequence(
              enrollment.prospectId,
              enrollment.sequenceId,
              enrollment.options || {}
            );
            
            results.successful.push({
              input: enrollment,
              result: result
            });
            
            await delay(200); // Slightly longer delay for enrollments
            
          } catch (error) {
            results.failed.push({
              input: enrollment,
              error: error.message
            });
          }
        }
        
      } catch (batchError) {
        console.error(`❌ Enrollment batch ${i + 1} failed: ${batchError.message}`);
      }
      
      await delay(1000); // Delay between batches
    }

    results.summary.succeeded = results.successful.length;
    results.summary.failed = results.failed.length;

    console.error(`✅ Bulk enrollment complete: ${results.summary.succeeded}/${results.summary.total} successful`);
    return results;
  }

  // Utility method to create batches
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  // Get operation statistics
  getStats() {
    const successRate = this.stats.totalOperations > 0 
      ? ((this.stats.successfulOperations / this.stats.totalOperations) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      successRate: `${successRate}%`
    };
  }

  // Health check
  getHealth() {
    const stats = this.getStats();
    return {
      status: 'healthy',
      batchSize: this.batchSize,
      parallelLimit: this.parallelLimit,
      successRate: stats.successRate,
      totalOperations: stats.totalOperations
    };
  }
}

export default BulkOperationsManager;