/**
 * ╔══════════════════════════════════════════════════╗
 * ║                 VENTRON AI CORE                 ║
 * ║          NEXT-GENERATION BOT FRAMEWORK          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const os = require('os');
const http = require('http');

const config =
  require('./config');

const VentronCore =
  require('./src/core/manager');

const VentronDiagnostics =
  require('./src/core/diagnostics');

const VENTRON = {
  name:
    config.bot.name,

  nickname:
    config.bot.nickname,

  version:
    config.bot.version,

  author:
    config.bot.author
};

// ═══════════════════════════════════════════════
// 🖥️ SYSTEM INFORMATION
// ═══════════════════════════════════════════════

function getSystemInfo() {

  const totalMemory =
    os.totalmem();

  const freeMemory =
    os.freemem();

  return {

    platform:
      process.platform,

    architecture:
      process.arch,

    node:
      process.version,

    cpuCores:
      os.cpus().length,

    totalMemoryMB:
      Math.round(
        totalMemory /
        1024 /
        1024
      ),

    freeMemoryMB:
      Math.round(
        freeMemory /
        1024 /
        1024
      ),

    uptimeSeconds:
      Math.floor(
        process.uptime()
      )
  };
}

// ═══════════════════════════════════════════════
// 🎨 BANNER
// ═══════════════════════════════════════════════

function printBanner() {

  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║              V E N T R O N   A I                    ║
║                                                      ║
║          NEXT-GENERATION AI FRAMEWORK               ║
║                                                      ║
║              ${VENTRON.nickname.padEnd(28)}║
║              v${VENTRON.version.padEnd(27)}║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);
}

// ═══════════════════════════════════════════════
// 🌐 HEALTH SERVER
// ═══════════════════════════════════════════════

function startHealthServer(core) {

  const server =
    http.createServer(
      (req, res) => {

        res.setHeader(
          'Content-Type',
          'application/json; charset=utf-8'
        );

        // ─────────────────────────────────────
        // ❤️ HEALTH
        // ─────────────────────────────────────

        if (
          req.url === '/' ||
          req.url === '/health'
        ) {

          const status =
            core.getStatus();

          const healthy =
            status.started === true;

          res.writeHead(
            healthy
              ? 200
              : 503
          );

          res.end(
            JSON.stringify(
              {
                success:
                  healthy,

                status:
                  healthy
                    ? 'online'
                    : 'starting',

                bot:
                  VENTRON.name,

                version:
                  VENTRON.version,

                core: {
                  initialized:
                    status.initialized,

                  started:
                    status.started,

                  uptime:
                    status.uptime
                },

                systems: {

                  commandEngine:
                    status.commandEngine.started,

                  eventGateway:
                    status.eventGateway.started,

                  messageRouter:
                    status.messageRouter.started,

                  aiEngine:
                    status.ai.started,

                  responseEngine:
                    status.response.started,

                  platformManager:
                    status.platforms.started,

                  messenger:
                    status.platforms
                      .platforms
                      .messenger
                      ?.started || false
                },

                commands:
                  status.commandEngine
                    .commands
                    .length,

                platforms
