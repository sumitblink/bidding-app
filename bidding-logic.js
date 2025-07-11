const bidders = {
  insurance: {
    name: "Insurance Pro Network",
    bidRate: 0.75,
    minBid: 8.00,
    maxBid: 18.00,
    delay: 500,
    phone: "+919870335500"
  },
  homeServices: {
    name: "Home Services Plus", 
    bidRate: 0.60,
    minBid: 12.00,
    maxBid: 28.00,
    delay: 800,
    phone: "+919870335500"
  },
  premium: {
    name: "Premium Leads Exchange",
    bidRate: 0.85,
    minBid: 15.00,
    maxBid: 35.00,
    delay: 300,
    phone: "+919870335500"
  }
};

// Statistics tracking
let stats = {
  totalRequests: 0,
  totalBids: 0,
  totalRevenue: 0,
  bidsByBidder: {},
  recentActivity: []
};

function calculateBid(bidder, request) {
  const { callerState, callerZip, minBidAmount, maxBidAmount, minBid, maxBid } = request;
  
  // Use bidder defaults if min/max not provided in request
  const requestMin = parseFloat(minBidAmount || minBid) || bidder.minBid;
  const requestMax = parseFloat(maxBidAmount || maxBid) || bidder.maxBid;
  
  console.log(`[${bidder.name}] Bid range: $${requestMin} - $${requestMax}`);
  
  let baseBid = Math.random() * (bidder.maxBid - bidder.minBid) + bidder.minBid;
  let multiplier = 1.0;
  
  // State preferences
  const goodStates = ['CA', 'NY', 'TX', 'FL'];
  if (goodStates.includes(callerState)) {
    multiplier = 1.2;
    console.log(`[${bidder.name}] State bonus applied: ${callerState}`);
  }
  
  // Zip code quality
  if (callerZip) {
    const zip = parseInt(callerZip);
    if (zip >= 90000 || (zip >= 10000 && zip <= 19999)) {
      multiplier *= 1.15;
      console.log(`[${bidder.name}] ZIP bonus applied: ${callerZip}`);
    }
  }
  
  const finalBid = Math.min(baseBid * multiplier, Math.min(bidder.maxBid, requestMax));
  const result = Math.max(finalBid, requestMin);
  
  console.log(`[${bidder.name}] Final bid: $${result.toFixed(2)}`);
  return result;
}

async function processBid(bidder, request) {
  console.log(`\n🎯 ${bidder.name} processing bid request`);
  
  // Update stats
  stats.totalRequests++;
  
  // Handle undefined request body
  if (!request) {
    console.log('❌ Request body is undefined');
    throw new Error('Request body is missing');
  }
  
  // Handle string request body (parse if needed)
  if (typeof request === 'string') {
    try {
      request = JSON.parse(request);
    } catch (e) {
      console.log('❌ Failed to parse request JSON:', e.message);
      throw new Error('Invalid JSON in request body');
    }
  }
  
  // Validate required fields
  const requestId = request.requestId || `generated_${Date.now()}`;
  const campaignId = request.campaignId || 'unknown_campaign';
  const callerId = request.callerId || 'unknown_caller';
  const callerState = request.callerState || 'Unknown';
  
  console.log(`Request ID: ${requestId}`);
  console.log(`Campaign: ${campaignId}`);
  console.log(`Caller: ${callerId}`);
  console.log(`State: ${callerState}`);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, bidder.delay));
  
  // Decide to bid
  const shouldBid = Math.random() < bidder.bidRate;
  
  if (!shouldBid) {
    console.log(`❌ ${bidder.name} declined to bid`);
    
    // Add to recent activity
    stats.recentActivity.unshift({
      timestamp: new Date().toISOString(),
      bidder: bidder.name,
      requestId: requestId,
      callerId: callerId,
      state: callerState,
      result: 'No Bid',
      amount: null
    });
    
    if (stats.recentActivity.length > 20) {
      stats.recentActivity = stats.recentActivity.slice(0, 20);
    }
    
    return null;
  }
  
  const bidAmount = calculateBid(bidder, request);
  
  // Update stats
  stats.totalBids++;
  stats.totalRevenue += bidAmount;
  if (!stats.bidsByBidder[bidder.name]) {
    stats.bidsByBidder[bidder.name] = { count: 0, total: 0 };
  }
  stats.bidsByBidder[bidder.name].count++;
  stats.bidsByBidder[bidder.name].total += bidAmount;
  
  const response = {
    requestId: requestId,
    bidAmount: parseFloat(bidAmount.toFixed(2)),
    bidCurrency: 'USD',
    destinationNumber: bidder.phone,
    requiredDuration: 30,
    accepted: true,
    metadata: {
      bidderName: bidder.name,
      timestamp: new Date().toISOString()
    }
  };
  
  // Add to recent activity
  stats.recentActivity.unshift({
    timestamp: new Date().toISOString(),
    bidder: bidder.name,
    requestId: requestId,
    callerId: callerId,
    state: callerState,
    result: 'Bid',
    amount: bidAmount
  });
  
  if (stats.recentActivity.length > 20) {
    stats.recentActivity = stats.recentActivity.slice(0, 20);
  }
  
  console.log(`✅ ${bidder.name} BID: ${response.bidAmount} → ${response.destinationNumber}`);
  return response;
}

module.exports = {
  bidders,
  stats,
  calculateBid,
  processBid
};