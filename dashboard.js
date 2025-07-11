module.exports = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RTB Bidding Server Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; padding: 20px; color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { 
            text-align: center; color: white; margin-bottom: 30px;
            background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .status { color: #00ff88; font-weight: bold; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { 
            background: rgba(255,255,255,0.95); border-radius: 12px; padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); backdrop-filter: blur(10px);
        }
        .card h2 { color: #667eea; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .bidder { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px; margin: 8px 0; background: #f8f9fa; border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .bidder-name { font-weight: bold; }
        .bidder-details { font-size: 0.9rem; color: #666; }
        .status-dot { 
            width: 10px; height: 10px; border-radius: 50%; background: #00ff88;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .stat { text-align: center; padding: 15px; background: #667eea; color: white; border-radius: 8px; }
        .stat-value { font-size: 1.8rem; font-weight: bold; }
        .stat-label { font-size: 0.9rem; opacity: 0.9; margin-top: 5px; }
        .test-section { margin-top: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; }
        input, select { 
            width: 100%; padding: 10px; border: 2px solid #e1e5e9; border-radius: 6px;
            font-size: 14px; transition: border-color 0.3s;
        }
        input:focus, select:focus { outline: none; border-color: #667eea; }
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; padding: 12px 20px; border-radius: 6px;
            font-weight: 600; cursor: pointer; transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .activity-item { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 6px;
            font-size: 0.9rem;
        }
        .bid-amount { color: #28a745; font-weight: bold; }
        .no-bid { color: #dc3545; }
        .loading { display: none; color: #667eea; font-weight: bold; }
        .results { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .endpoint { 
            font-family: monospace; background: #e9ecef; padding: 4px 8px; 
            border-radius: 4px; font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 RTB Bidding Server</h1>
            <div class="status">● Server Running</div>
            <div>Ready to receive bid requests</div>
        </div>

        <div class="cards">
            <!-- Bidders Status -->
            <div class="card">
                <h2>🏢 Active Bidders</h2>
                <div class="bidder">
                    <div>
                        <div class="bidder-name">Insurance Pro Network</div>
                        <div class="bidder-details">75% bid rate • $8-18 range • <span class="endpoint">/insurance-bid</span></div>
                    </div>
                    <div class="status-dot"></div>
                </div>
                <div class="bidder">
                    <div>
                        <div class="bidder-name">Home Services Plus</div>
                        <div class="bidder-details">60% bid rate • $12-28 range • <span class="endpoint">/home-services-bid</span></div>
                    </div>
                    <div class="status-dot"></div>
                </div>
                <div class="bidder">
                    <div>
                        <div class="bidder-name">Premium Leads Exchange</div>
                        <div class="bidder-details">85% bid rate • $15-35 range • <span class="endpoint">/premium-bid</span></div>
                    </div>
                    <div class="status-dot"></div>
                </div>
            </div>

            <!-- Live Statistics -->
            <div class="card">
                <h2>📊 Live Statistics</h2>
                <div class="stats-grid">
                    <div class="stat">
                        <div class="stat-value" id="totalRequests">0</div>
                        <div class="stat-label">Total Requests</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" id="totalBids">0</div>
                        <div class="stat-label">Successful Bids</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" id="avgBid">$0</div>
                        <div class="stat-label">Average Bid</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" id="bidRate">0%</div>
                        <div class="stat-label">Bid Success Rate</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="cards">
            <!-- Test RTB System -->
            <div class="card">
                <h2>🧪 Test RTB System</h2>
                <div class="test-section">
                    <div class="form-group">
                        <label for="callerId">Caller ID</label>
                        <input type="tel" id="callerId" value="+1-555-123-4567" placeholder="+1-234-567-8890">
                    </div>
                    <div class="form-group">
                        <label for="callerState">Caller State</label>
                        <select id="callerState">
                            <option value="CA">California</option>
                            <option value="NY">New York</option>
                            <option value="TX">Texas</option>
                            <option value="FL">Florida</option>
                            <option value="IL">Illinois</option>
                            <option value="OH">Ohio</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="callerZip">ZIP Code</label>
                        <input type="text" id="callerZip" value="90210" placeholder="90210">
                    </div>
                    <div class="form-group">
                        <label for="campaignId">Campaign Type</label>
                        <select id="campaignId">
                            <option value="insurance-leads-premium">Insurance Leads (Premium)</option>
                            <option value="home-services-residential">Home Services (Residential)</option>
                            <option value="premium-leads-exclusive">Premium Leads (Exclusive)</option>
                            <option value="test-campaign">Test Campaign</option>
                        </select>
                    </div>
                    <button class="btn" onclick="testAllBidders()">🚀 Test All Bidders</button>
                    <div class="loading" id="loading">Testing bidders...</div>
                    <div class="results" id="results" style="display: none;"></div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="card">
                <h2>⚡ Recent Activity</h2>
                <div id="activityList">
                    <div style="text-align: center; color: #666; padding: 20px;">
                        No recent activity. Run a test to see results!
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh stats every 5 seconds
        setInterval(refreshStats, 5000);
        refreshStats();

        async function refreshStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('totalRequests').textContent = stats.totalRequests;
                document.getElementById('totalBids').textContent = stats.totalBids;
                document.getElementById('avgBid').textContent = stats.totalBids > 0 
                    ? '$' + (stats.totalRevenue / stats.totalBids).toFixed(2)
                    : '$0';
                document.getElementById('bidRate').textContent = stats.totalRequests > 0
                    ? Math.round((stats.totalBids / stats.totalRequests) * 100) + '%'
                    : '0%';
                
                // Update recent activity
                const activityList = document.getElementById('activityList');
                if (stats.recentActivity && stats.recentActivity.length > 0) {
                    activityList.innerHTML = stats.recentActivity.map(activity => {
                        const time = new Date(activity.timestamp).toLocaleTimeString();
                        const result = activity.result === 'Bid' 
                            ? \`<span class="bid-amount">$\${activity.amount}</span>\`
                            : \`<span class="no-bid">No Bid</span>\`;
                        return \`
                            <div class="activity-item">
                                <div>
                                    <strong>\${activity.bidder}</strong><br>
                                    <small>\${activity.callerId} • \${activity.state}</small>
                                </div>
                                <div style="text-align: right;">
                                    \${result}<br>
                                    <small>\${time}</small>
                                </div>
                            </div>
                        \`;
                    }).join('');
                } else {
                    activityList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No recent activity</div>';
                }
            } catch (error) {
                console.error('Failed to refresh stats:', error);
            }
        }

        async function testAllBidders() {
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            
            loading.style.display = 'block';
            results.style.display = 'none';
            
            const testData = {
                callerId: document.getElementById('callerId').value,
                callerState: document.getElementById('callerState').value,
                callerZip: document.getElementById('callerZip').value,
                campaignId: document.getElementById('campaignId').value,
                minBidAmount: 5.00,
                maxBidAmount: 30.00
            };
            
            try {
                const response = await fetch('/test-all', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData)
                });
                
                const data = await response.json();
                
                loading.style.display = 'none';
                results.style.display = 'block';
                
                let resultsHtml = '<h3>🎯 Bidding Results</h3>';
                
                data.results.forEach(result => {
                    if (result.status === 'bid') {
                        const isWinner = data.winner && result.bidder === data.winner.bidder;
                        resultsHtml += \`
                            <div class="activity-item" style="background: \${isWinner ? '#d4edda' : '#f8f9fa'}">
                                <div>
                                    <strong>\${isWinner ? '🏆 ' : '💰 '}\${result.bidder}</strong>
                                    \${isWinner ? '<small> - WINNER</small>' : ''}
                                </div>
                                <div class="bid-amount">$\${result.bid}</div>
                            </div>
                        \`;
                    } else {
                        resultsHtml += \`
                            <div class="activity-item">
                                <div><strong>❌ \${result.bidder}</strong></div>
                                <div class="no-bid">No Bid</div>
                            </div>
                        \`;
                    }
                });
                
                if (data.winner) {
                    resultsHtml += \`
                        <div style="margin-top: 15px; padding: 15px; background: #d4edda; border-radius: 6px;">
                            <strong>🏆 Winner: \${data.winner.bidder}</strong><br>
                            Amount: <span class="bid-amount">$\${data.winner.amount}</span><br>
                            Phone: <span class="endpoint">\${data.winner.phone}</span>
                        </div>
                    \`;
                }
                
                results.innerHTML = resultsHtml;
                
                // Refresh stats after test
                setTimeout(refreshStats, 1000);
                
            } catch (error) {
                loading.style.display = 'none';
                results.style.display = 'block';
                results.innerHTML = '<div style="color: #dc3545;">Error: ' + error.message + '</div>';
            }
        }
    </script>
</body>
</html>
`;