const http = require('http');

const TEST_SCENARIOS = [
  {
    name: 'Insurance Lead - CA (High Value)',
    data: {
      requestId: 'test-insurance-001',
      campaignId: 'insurance-leads-ca',
      callerId: '+1-415-555-1234',
      callerState: 'CA',
      callerZip: '90210',
      minBidAmount: 5.00,
      maxBidAmount: 25.00,
      currency: 'USD'
    }
  },
  {
    name: 'Home Services - NY (Premium)',
    data: {
      requestId: 'test-home-002', 
      campaignId: 'home-services-ny',
      callerId: '+1-212-555-5678',
      callerState: 'NY',
      callerZip: '10001',
      minBidAmount: 8.00,
      maxBidAmount: 35.00,
      currency: 'USD'
    }
  },
  {
    name: 'Premium Leads - TX (Exclusive)',
    data: {
      requestId: 'test-premium-003',
      campaignId: 'premium-leads-tx',
      callerId: '+1-469-555-9012',
      callerState: 'TX',
      callerZip: '75201',
      minBidAmount: 12.00,
      maxBidAmount: 40.00,
      currency: 'USD'
    }
  },
  {
    name: 'Low Value Test - MT (Budget)',
    data: {
      requestId: 'test-budget-004',
      campaignId: 'budget-leads-mt',
      callerId: '+1-406-555-3456',
      callerState: 'MT',
      callerZip: '59701',
      minBidAmount: 2.00,
      maxBidAmount: 8.00,
      currency: 'USD'
    }
  }
];

const ENDPOINTS = [
  { path: '/insurance-bid', name: 'Insurance Pro Network' },
  { path: '/home-services-bid', name: 'Home Services Plus' },
  { path: '/premium-bid', name: 'Premium Leads Exchange' }
];

async function runTest(endpoint, scenario) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(scenario.data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            endpoint: endpoint.name,
            scenario: scenario.name,
            status: res.statusCode,
            response: res.statusCode === 204 ? 'No Bid' : JSON.parse(data)
          };
          resolve(result);
        } catch (e) {
          resolve({
            endpoint: endpoint.name,
            scenario: scenario.name,
            status: res.statusCode,
            response: 'Parse Error',
            error: e.message
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 Starting RTB Bidding Tests...\n');
  
  // Test health check first
  try {
    console.log('🔍 Checking server health...');
    const health = await testHealthCheck();
    console.log(`✅ Server is ${health.status} (uptime: ${Math.round(health.uptime)}s)\n`);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    console.log('Make sure the server is running on port 3001\n');
    return;
  }
  
  for (const scenario of TEST_SCENARIOS) {
    console.log(`📋 Testing Scenario: ${scenario.name}`);
    console.log(`   Caller: ${scenario.data.callerId} (${scenario.data.callerState})`);
    console.log(`   Bid Range: ${scenario.data.minBidAmount} - ${scenario.data.maxBidAmount}`);
    console.log('─'.repeat(60));
    
    const results = [];
    
    for (const endpoint of ENDPOINTS) {
      try {
        const result = await runTest(endpoint, scenario);
        results.push(result);
        
        if (result.status === 204) {
          console.log(`  ${endpoint.name}: ❌ No Bid`);
        } else if (result.status === 200) {
          console.log(`  ${endpoint.name}: ✅ ${result.response.bidAmount} → ${result.response.destinationNumber}`);
        } else {
          console.log(`  ${endpoint.name}: ❌ Error ${result.status}`);
        }
      } catch (error) {
        console.log(`  ${endpoint.name}: ❌ ${error.message}`);
      }
    }
    
    // Find winner
    const validBids = results.filter(r => r.status === 200);
    if (validBids.length > 0) {
      const winner = validBids.reduce((highest, current) => 
        current.response.bidAmount > highest.response.bidAmount ? current : highest);
      console.log(`\n  🏆 WINNER: ${winner.endpoint} with ${winner.response.bidAmount}`);
    } else {
      console.log('\n  ❌ No bids received for this scenario');
    }
    
    console.log('');
  }
  
  console.log('🎯 All tests completed!');
  console.log('\n📊 Check the dashboard at: http://localhost:3001');
  process.exit(0);
}

if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, runTest, testHealthCheck };
