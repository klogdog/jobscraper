const http = require('http');
const pool = require('../src/db/connection');

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/query' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);
        
        // Basic SQL injection protection
        const dangerousPatterns = /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE)\b/i;
        if (dangerousPatterns.test(query)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden query' }));
          return;
        }

        const result = await pool.query(query);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ rows: result.rows }));
      } catch (error) {
        console.error('Query error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.url === '/' || req.url === '/index.html') {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'index.html');
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Frontend API server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the job database`);
});
