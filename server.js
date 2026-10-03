/**
 * ╔══════════════════════════════════════════════════╗
 * ║                VENTRON AI SERVER                ║
 * ║          Deployment & Health Gateway            ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const http = require('http');
const config = require('./config');

const PORT = config.server.port;
const HOST = config.server.host;

const startTime = Date.now();

function getUptime() {
  return Math.floor((Date.now() - startTime) / 1000);
}

function getHealthData() {
  return {
    status: 'online',
    name: config.bot.name,
    nickname: config.bot.nickname,
    version: config.bot.version,
    environment: config.bot.environment,
    uptime: getUptime(),
    timestamp: new Date().toISOString()
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Health Check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200);

    res.end(
      JSON.stringify(
        {
          success: true,
          message: 'Ventron AI is online.',
          data: getHealthData()
        },
        null,
        2
      )
    );

    return;
  }

  // API Information
  if (req.url === '/api') {
    res.writeHead(200);

    res.end(
      JSON.stringify(
        {
          success: true,
          service: 'Ventron AI API Gateway',
          version: config.bot.version,
          status: 'ready'
        },
        null,
        2
      )
    );

    return;
  }

  // 404
  res.writeHead(404);

  res.end(
    JSON.stringify(
      {
        success: false,
        error: 'Route not found',
        path: req.url
      },
      null,
      2
    )
  );
});

server.listen(PORT, HOST, () => {
  console.log('────────────────────────────────────────────');
  console.log('🌐 VENTRON AI SERVER');
  console.log('────────────────────────────────────────────');
  console.log(`🤖 Bot       : ${config.bot.name}`);
  console.log(`📦 Version   : ${config.bot.version}`);
  console.log(`🌍 Host      : ${HOST}`);
  console.log(`🔌 Port      : ${PORT}`);
  console.log('❤️ Health    : /health');
  console.log('🔌 API       : /api');
  console.log('────────────────────────────────────────────');
  console.log('✅ Server is running.');
});

function shutdown(signal) {
  console.log(`\n🛑 ${signal} received.`);
  console.log('⏳ Shutting down server safely...');

  server.close(() => {
    console.log('✅ Server stopped safely.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
