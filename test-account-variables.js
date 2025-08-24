#!/usr/bin/env node

import OutreachClient from './src/outreach-client.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new OutreachClient();

async function exploreAccountVariables() {
  try {
    console.log('🔍 Exploring Outreach account variables and custom fields...\n');

    // Get a sample account to see available fields
    console.log('1. Getting sample account data...');
    const accounts = await client.searchAccounts({});
    
    if (accounts.data && accounts.data.length > 0) {
      const sampleAccount = accounts.data[0];
      console.log('Sample account structure:');
      console.log(JSON.stringify(sampleAccount, null, 2));
      
      console.log('\n📋 Available account fields for templates:');
      const attributes = sampleAccount.attributes || {};
      Object.keys(attributes).forEach(field => {
        console.log(`- {{account.${field}}} = ${attributes[field]}`);
      });
      
      // Look for custom fields specifically
      const customFields = Object.keys(attributes).filter(key => key.startsWith('custom'));
      if (customFields.length > 0) {
        console.log('\n🎯 Custom fields found:');
        customFields.forEach(field => {
          console.log(`- {{account.${field}}} = ${attributes[field]}`);
        });
      } else {
        console.log('\n⚠️  No custom fields found in this account');
      }
    }

    // Try to get field type definitions
    console.log('\n2. Checking API types endpoint for field definitions...');
    try {
      const types = await client.client.get('/types');
      console.log('Field definitions available:', !!types.data);
      
      // Look for account-related type definitions
      if (types.data && types.data.data) {
        const accountTypes = types.data.data.filter(type => 
          type.attributes && type.attributes.name === 'account'
        );
        if (accountTypes.length > 0) {
          console.log('Account field types:', JSON.stringify(accountTypes[0], null, 2));
        }
      }
    } catch (typeError) {
      console.log('Types endpoint not accessible:', typeError.message);
    }

    // Test common account variables that might be available
    console.log('\n3. Common account variables you can likely use:');
    const commonVars = [
      'account.name',
      'account.domain', 
      'account.industry',
      'account.description',
      'account.employees',
      'account.revenue',
      'account.custom1',
      'account.custom2',
      'account.custom3',
      'account.custom4',
      'account.custom5'
    ];
    
    commonVars.forEach(variable => {
      console.log(`- {{${variable}}}`);
    });

  } catch (error) {
    console.error('❌ Error exploring account variables:', error.message);
    
    console.log('\n📚 Based on Outreach documentation, these variables should work:');
    console.log('Standard account fields:');
    console.log('- {{account.name}} - Account name');
    console.log('- {{account.domain}} - Account domain');  
    console.log('- {{account.industry}} - Account industry');
    console.log('- {{account.description}} - Account description');
    console.log('- {{account.employees}} - Number of employees');
    console.log('- {{account.revenue}} - Annual revenue');
    console.log('\nCustom fields (if configured):');
    console.log('- {{account.custom1}} through {{account.custom50}}');
    console.log('- Custom field names depend on your Outreach setup');
  }
}

exploreAccountVariables();