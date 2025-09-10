/**
 * Health Check Script for Docker Container
 * 
 * This script performs a health check on the running application
 * to ensure it's responding correctly in production.
 */

const http = require('http');

const options = {
  host: process.env.HOSTNAME || 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 2000,
  headers: {
    'User-Agent': 'Docker-Health-Check/1.0'
  }
};

const request = http.request(options, (response) => {
  if (response.statusCode === 200) {
    let data = '';
    
    response.on('data', (chunk) => {
      data += chunk;
    });
    
    response.on('end', () => {
      try {
        const healthData = JSON.parse(data);
        
        // Check if the health response indicates the app is healthy
        if (healthData.overall === 'healthy') {
          console.log('✅ Health check passed');
          process.exit(0);
        } else {
          console.error('❌ Health check failed: App reports unhealthy status');
          console.error('Health data:', healthData);
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Health check failed: Invalid JSON response');
        console.error('Response data:', data);
        process.exit(1);
      }
    });
  } else {
    console.error(`❌ Health check failed: HTTP ${response.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error('❌ Health check failed: Request error');
  console.error(error.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('❌ Health check failed: Request timeout');
  request.destroy();
  process.exit(1);
});

request.end();