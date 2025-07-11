const express = require('express');
const cors = require('cors');
const path = require('path');
const { bidders, stats, processBid } = require('./bidding-logic');
const dashboardHTML = require('./dashboard');

const app = express();

// Enhanced middleware for better request parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Multiple body parsers to handle different content types
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text());
app.use(express.raw());

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`\n${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body type:', typeof req.body);
  console.log('Body content:', req.body);
  console.log('Raw body:', req.body ? JSON.stringify(req.body, null, 2) : 'undefined');
  next();
});

// ============================================
// UI ROUTES
// ============================================

// Main UI Dashboard
app.get('/', (req, res) => {
  res.send(dashboardHTML);
});

// API endpoint for stats
app.get('/api/stats', (req, res) => {
  res.json(stats);
});

// ============================================
// API ROUTES
// ============================================

// Insurance Pro Network
app.post('/insurance-bid', async (req, res) => {
  try {
    console.log('\n🏦 Insurance Pro Network endpoint hit');
    console.log('Request body received:', req.body);
    
    const result = await processBid(bidders.insurance, req.body);
    if (result) {
      console.log('✅ Insurance Pro responding with bid:', result);
      res.json(result);
    } else {
      console.log('📵 Insurance Pro no bid (204)');
      res.status(204).send();
    }
  } catch (error) {
    console.error('❌ Insurance bidder error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Bidding failed',
      message: error.message,
      bidder: 'Insurance Pro Network'
    });
  }
});

// Home Services Plus
app.post('/home-services-bid', async (req, res) => {
  try {
    console.log('\n🏠 Home Services Plus endpoint hit');
    console.log('Request body received:', req.body);
    
    const result = await processBid(bidders.homeServices, req.body);
    if (result) {
      console.log('✅ Home Services responding with bid:', result);
      res.json(result);
    } else {
      console.log('📵 Home Services no bid (204)');
      res.status(204).send();
    }
  } catch (error) {
    console.error('❌ Home services bidder error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Bidding failed',
      message: error.message,
      bidder: 'Home Services Plus'
    });
  }
});

// Premium Leads Exchange
app.post('/premium-bid', async (req, res) => {
  try {
    console.log('\n💎 Premium Leads Exchange endpoint hit');
    console.log('Request body received:', req.body);
    
    const result = await processBid(bidders.premium, req.body);
    if (result) {
      console.log('✅ Premium Leads responding with bid:', result);
      res.json(result);
    } else {
      console.log('📵 Premium Leads no bid (204)');
      res.status(204).send();
    }
  } catch (error) {
    console.error('❌ Premium bidder error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Bidding failed',
      message: error.message,
      bidder: 'Premium Leads Exchange'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    server: 'RTB Bidder Server',
    bidders: [
      {
        name: bidders.insurance.name,
        endpoint: '/insurance-bid',
        active: true,
        bidRate: `${bidders.insurance.bidRate * 100}%`,
        range: `$${bidders.insurance.minBid}-$${bidders.insurance.maxBid}`,
        phone: bidders.insurance.phone
      },
      {
        name: bidders.homeServices.name,
        endpoint: '/home-services-bid',
        active: true,
        bidRate: `${bidders.homeServices.bidRate * 100}%`,
        range: `$${bidders.homeServices.minBid}-$${bidders.homeServices.maxBid}`,
        phone: bidders.homeServices.phone
      },
      {
        name: bidders.premium.name,
        endpoint: '/premium-bid',
        active: true,
        bidRate: `${bidders.premium.bidRate * 100}%`,
        range: `$${bidders.premium.minBid}-$${bidders.premium.maxBid}`,
        phone: bidders.premium.phone
      }
    ]
  });
});

// Test all bidders
app.post('/test-all', async (req, res) => {
  console.log('\n🧪 Testing all bidders...');
  
  const testRequest = {
    requestId: `test_${Date.now()}`,
    campaignId: 'test_campaign',
    callerId: '+1-555-123-4567',
    callerState: 'CA',
    callerZip: '90210',
    minBidAmount: 5.00,
    maxBidAmount: 30.00,
    ...req.body
  };
  
  const results = [];
  
  // Test each bidder
  for (const [key, bidder] of Object.entries(bidders)) {
    try {
      const result = await processBid(bidder, testRequest);
      if (result) {
        results.push({
          bidder: bidder.name,
          bid: result.bidAmount,
          phone: result.destinationNumber,
          status: 'bid'
        });
      } else {
        results.push({
          bidder: bidder.name,
          bid: null,
          phone: null,
          status: 'no_bid'
        });
      }
    } catch (error) {
      results.push({
        bidder: bidder.name,
        error: error.message,
        status: 'error'
      });
    }
  }
  
  // Find winner
  const validBids = results.filter(r => r.status === 'bid');
  const winner = validBids.length > 0 
    ? validBids.reduce((highest, current) => 
        current.bid > highest.bid ? current : highest)
    : null;
  
  console.log('\n🏆 Test Results:');
  results.forEach(result => {
    if (result.status === 'bid') {
      const isWinner = winner && result.bidder === winner.bidder;
      console.log(`  ${isWinner ? '🏆' : '💰'} ${result.bidder}: $${result.bid}`);
    } else {
      console.log(`  ❌ ${result.bidder}: ${result.status}`);
    }
  });
  
  res.json({
    testRequest,
    results,
    winner: winner ? {
      bidder: winner.bidder,
      amount: winner.bid,
      phone: winner.phone
    } : null,
    summary: {
      totalBidders: results.length,
      validBids: validBids.length
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET / (Dashboard)',
      'POST /insurance-bid',
      'POST /home-services-bid',
      'POST /premium-bid',
      'GET /health',
      'GET /status',
      'POST /test-all',
      'GET /api/stats'
    ]
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('\n🚀 RTB Bidder Server Started!');
  console.log('================================');
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`📊 Status API: http://localhost:${PORT}/status`);
  console.log('\n📡 Bidding Endpoints:');
  console.log(`  🏦 Insurance:     POST /insurance-bid`);
  console.log(`  🏠 Home Services: POST /home-services-bid`);
  console.log(`  💎 Premium:       POST /premium-bid`);
  console.log('\n🔧 Testing:');
  console.log(`  📊 Status:  GET /status`);
  console.log(`  ❤️  Health: GET /health`);
  console.log(`  🧪 Test:   POST /test-all`);
  console.log('\n🎯 Ready for RTB requests!');
  console.log('================================\n');
});

process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down...');
  process.exit(0);
});

// For Vercel deployment, export the app
module.exports = app;

// For local development, start server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log('🚀 RTB Bidder Server Started!');
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  });
}