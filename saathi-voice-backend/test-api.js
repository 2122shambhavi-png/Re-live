#!/usr/bin/env node

/**
 * Saathi Voice API Test Script
 * 
 * Tests all major endpoints to verify backend is working correctly.
 * Run: node test-api.js
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test-user-' + Date.now();

console.log('🧪 Saathi Voice API Test Suite');
console.log('================================\n');
console.log(`Testing API at: ${BASE_URL}\n`);

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function success(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function error(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.yellow}ℹ ${message}${colors.reset}`);
}

// Test functions
async function testHealthCheck() {
  console.log('\n1️⃣  Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    if (response.data.status === 'healthy') {
      success('Health check passed');
      return true;
    } else {
      error('Health check failed: unexpected status');
      return false;
    }
  } catch (err) {
    error(`Health check failed: ${err.message}`);
    return false;
  }
}

async function testGetRoles() {
  console.log('\n2️⃣  Testing Get Available Roles...');
  try {
    const response = await axios.get(`${BASE_URL}/api/roles`);
    const roles = response.data.roles;
    
    if (roles && roles.length > 0) {
      success(`Found ${roles.length} roles`);
      info(`Available roles: ${roles.map(r => r.id).join(', ')}`);
      return true;
    } else {
      error('No roles returned');
      return false;
    }
  } catch (err) {
    error(`Get roles failed: ${err.message}`);
    return false;
  }
}

async function testCreateUser() {
  console.log('\n3️⃣  Testing Create User...');
  try {
    const response = await axios.post(`${BASE_URL}/api/users`, {
      userId: TEST_USER_ID,
      name: 'Test User',
      phone: '+919999999999',
      email: 'test@example.com'
    });
    
    if (response.data.user) {
      success(`User created: ${TEST_USER_ID}`);
      info(`Default role: ${response.data.user.current_role}`);
      return true;
    } else {
      error('User creation failed');
      return false;
    }
  } catch (err) {
    error(`Create user failed: ${err.message}`);
    return false;
  }
}

async function testGetUser() {
  console.log('\n4️⃣  Testing Get User...');
  try {
    const response = await axios.get(`${BASE_URL}/api/users/${TEST_USER_ID}`);
    
    if (response.data.user && response.data.user.user_id === TEST_USER_ID) {
      success('User retrieved successfully');
      info(`User name: ${response.data.user.name}`);
      return true;
    } else {
      error('Get user failed');
      return false;
    }
  } catch (err) {
    error(`Get user failed: ${err.message}`);
    return false;
  }
}

async function testSelectRole() {
  console.log('\n5️⃣  Testing Select Role...');
  try {
    const response = await axios.post(`${BASE_URL}/api/users/select-role`, {
      userId: TEST_USER_ID,
      role: 'daughter',
      languageMix: 'hi-en'
    });
    
    if (response.data.role === 'daughter') {
      success('Role selected: daughter');
      info(`Personality: ${response.data.personality}`);
      return true;
    } else {
      error('Role selection failed');
      return false;
    }
  } catch (err) {
    error(`Select role failed: ${err.message}`);
    return false;
  }
}

async function testTextConversation() {
  console.log('\n6️⃣  Testing Text Conversation...');
  try {
    const testMessage = 'Aaj mujhe bahut akela feel ho raha hai';
    info(`Sending message: "${testMessage}"`);
    
    const response = await axios.post(`${BASE_URL}/api/conversation/text`, {
      userId: TEST_USER_ID,
      message: testMessage
    });
    
    if (response.data.response) {
      success('AI response received');
      info(`Response: "${response.data.response}"`);
      info(`Mood detected: ${response.data.mood}`);
      info(`Crisis level: ${response.data.crisisLevel}`);
      return true;
    } else {
      error('No response from AI');
      return false;
    }
  } catch (err) {
    error(`Text conversation failed: ${err.message}`);
    if (err.response?.data) {
      console.log('Error details:', err.response.data);
    }
    return false;
  }
}

async function testConversationHistory() {
  console.log('\n7️⃣  Testing Get Conversation History...');
  try {
    const response = await axios.get(`${BASE_URL}/api/conversation/history/${TEST_USER_ID}?limit=5`);
    
    if (response.data.conversations) {
      success(`Retrieved ${response.data.conversations.length} conversations`);
      return true;
    } else {
      error('No conversation history returned');
      return false;
    }
  } catch (err) {
    error(`Get history failed: ${err.message}`);
    return false;
  }
}

async function testGetMemory() {
  console.log('\n8️⃣  Testing Get Memory Summary...');
  try {
    const response = await axios.get(`${BASE_URL}/api/conversation/memory/${TEST_USER_ID}`);
    
    if (response.data) {
      success('Memory summary retrieved');
      if (response.data.memory) {
        info(`Summary: ${response.data.memory.summary || 'No summary yet'}`);
        info(`Last mood: ${response.data.memory.last_mood || 'Unknown'}`);
      }
      return true;
    } else {
      error('Memory retrieval failed');
      return false;
    }
  } catch (err) {
    error(`Get memory failed: ${err.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  const startTime = Date.now();
  const results = [];
  
  // Run tests sequentially
  results.push(await testHealthCheck());
  results.push(await testGetRoles());
  results.push(await testCreateUser());
  results.push(await testGetUser());
  results.push(await testSelectRole());
  results.push(await testTextConversation());
  results.push(await testConversationHistory());
  results.push(await testGetMemory());
  
  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log('\n================================');
  console.log('📊 Test Summary');
  console.log('================================');
  console.log(`Total tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Duration: ${duration}s`);
  console.log('');
  
  if (failed === 0) {
    console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Note about voice test
console.log(`${colors.yellow}Note: Voice endpoint test requires audio file and valid API keys${colors.reset}`);
console.log(`${colors.yellow}Text conversation test requires valid ANTHROPIC_API_KEY${colors.reset}\n`);

// Run tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
