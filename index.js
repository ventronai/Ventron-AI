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

const config = require('./config');

const VentronCore =
  require('./src/core/manager');

const VentronDiagnostics =
  require('./src/core/diagnostics');

// ═══════════════════════════════════════════════════
// 🤖 IDENTITY
// ═══════════════════════════════════════════════════

const VENTRON = {
  name: config.bot.name,
  nickname: config.bot.nickname,
  version: config.bot.version,
  author: config.bot.author
};

// ═══════════════════════════════════════════════════
// 🖥️ SYSTEM INFO
// ═══════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════
// 🎨 BANNER
// ═══════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════
// 🌐 HEALTH SERVER
// ═══════════════════════════════════════════════════

function startHealthServer(core) {

  const server =
    http.createServer(
      (req, res) => {

        res.setHeader(
          'Content-Type',
          'application/json; charset=utf-8'
        );

        // ═══════════════════════════════════════
        // ❤️ HEALTH
        // ═══════════════════════════════════════

        if (
          req.url === '/' ||
          req.url === '/health'
        ) {

          const status =
            core.getStatus();

          res.writeHead(
            status.started
              ? 200
              : 503
          );

          res.end(
            JSON.stringify(
              {
                success: true,

                status:
                  status.started
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
                    status.started
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

                  memory:
                    status.ai.memory.sessions
                },

                commands:
                  status
                    .commandEngine
                    .commands,

                uptime:
                  status.uptime,

                timestamp:
                  new Date().toISOString()
              },
              null,
              2
            )
          );

          return;
        }

        // ═══════════════════════════════════════
        // 🔌 API INFO
        // ═══════════════════════════════════════

        if (req.url === '/api') {

          res.writeHead(200);

          res.end(
            JSON.stringify(
              {
                success: true,

                service:
                  'Ventron AI API Gateway',

                bot:
                  VENTRON.name,

                version:
                  VENTRON.version,

                status:
                  'ready',

                endpoints: [
                  '/',
                  '/health',
                  '/api'
                ]
              },
              null,
              2
            )
          );

          return;
        }

        // ═══════════════════════════════════════
        // 📊 SYSTEM STATUS
        // ═══════════════════════════════════════

        if (req.url === '/status') {

          res.writeHead(200);

          res.end(
            JSON.stringify(
              core.getStatus(),
              null,
              2
            )
          );

          return;
        }

        // ═══════════════════════════════════════
        // ❌ NOT FOUND
        // ═══════════════════════════════════════

        res.writeHead(404);

        res.end(
          JSON.stringify(
            {
              success: false,

              error:
                'Route not found',

              path:
                req.url
            },
            null,
            2
          )
        );
      }
    );

  server.listen(
    config.server.port,
    config.server.host,
    () => {

      console.log(
        '\n🌐 Ventron HTTP Health Server ONLINE'
      );

      console.log(
        `🔌 Port: ${config.server.port}`
      );

      console.log(
        '❤️ Health endpoint: /health'
      );

      console.log(
        '📊 Status endpoint: /status'
      );

      console.log(
        '🔌 API endpoint: /api\n'
      );
    }
  );

  return server;
}

// ═══════════════════════════════════════════════════
// 📊 DIAGNOSTICS
// ═══════════════════════════════════════════════════

function printDiagnostics(report) {

  console.log(
    '\n┌──────────────────────────────────────────────┐'
  );

  console.log(
    '│          VENTRON DIAGNOSTIC REPORT          │'
  );

  console.log(
    '├──────────────────────────────────────────────┤'
  );

  console.log(
    `│ Overall Status    : ${report.status}`
  );

  console.log(
    `│ Core              : ${
      report.core.started
        ? 'ONLINE'
        : 'STANDBY'
    }`
  );

  console.log(
    `│ Command Engine    : ${
      report.commands.status
    }`
  );

  console.log(
    `│ Commands Loaded   : ${
      report.commands.count
    }`
  );

  console.log(
    `│ Command Failures  : ${
      report.commands.failed
    }`
  );

  console.log(
    `│ Event Gateway     : ${
      report.eventGateway.status
    }`
  );

  console.log(
    `│ Message Router    : ${
      report.messageRouter.status
    }`
  );

  console.log(
    `│ AI Service        : ${
      report.ai.status
    }`
  );

  console.log(
    `│ AI Provider       : ${
      report.ai.provider
    }`
  );

  console.log(
    `│ Memory Sessions   : ${
      report.ai.memorySessions
    }`
  );

  console.log(
    `│ Security Layer    : ${
      report.security.status
    }`
  );

  console.log(
    `│ CPU Cores         : ${
      report.system.cpuCores
    }`
  );

  console.log(
    `│ Node.js           : ${
      report.system.node
    }`
  );

  console.log(
    '└──────────────────────────────────────────────┘'
  );

  if (
    report.commands.commands.length
  ) {

    console.log(
      '\n🧩 Loaded Commands:'
    );

    for (
      const command
      of report.commands.commands
    ) {

      console.log(
        `   • ${config.commands.prefix}${command}`
      );
    }
  }
}

// ═══════════════════════════════════════════════════
// 🚀 START VENTRON
// ═══════════════════════════════════════════════════

async function startVentron() {

  printBanner();

  console.log(
    '⚡ Initializing Ventron AI Core...\n'
  );

  const core =
    new VentronCore(config);

  // ═══════════════════════════════════════════
  // 🔔 CORE EVENTS
  // ═══════════════════════════════════════════

  core.on(
    'initialized',
    (data) => {

      console.log(
        `🧠 Core initialized: ${
          data.bot
        } v${data.version}`
      );

      console.log(
        `🧩 Commands discovered: ${
          data.commands.length
        }`
      );
    }
  );

  core.on(
    'commandEngineStarted',
    (data) => {

      console.log(
        `⚡ Command Engine online: ${
          data.commands.length
        } commands`
      );
    }
  );

  core.eventGateway.on(
    'started',
    () => {

      console.log(
        '📡 Event Gateway online.'
      );
    }
  );

  core.messageRouter.on(
    'started',
    () => {

      console.log(
        '🔀 Message Router online.'
      );
    }
  );

  core.aiService.engine.on(
    'started',
    () => {

      console.log(
        '🧠 AI Engine online.'
      );
    }
  );

  core.on(
    'aiResponse',
    () => {

      console.log(
        '💬 AI response generated.'
      );
    }
  );

  core.on(
    'commandResponse',
    () => {

      console.log(
        '⌨️ Command processed.'
      );
    }
  );

  core.on(
    'pipelineError',
    (error) => {

      console.error(
        '❌ Pipeline Error:',
        error.message
      );
    }
  );

  core.on(
    'started',
    () => {

      console.log(
        '🚀 Ventron Core started.'
      );
    }
  );

  // ═══════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════

  core.initialize();

  const system =
    getSystemInfo();

  console.log(
    '\n┌──────────────────────────────────────────────┐'
  );

  console.log(
    '│              VENTRON CORE STATUS             │'
  );

  console.log(
    '├──────────────────────────────────────────────┤'
  );

  console.log(
    '│ 🧠 AI Engine       : INITIALIZING            │'
  );

  console.log(
    '│ 💾 AI Memory       : INITIALIZING            │'
  );

  console.log(
    '│ 📡 Event Gateway   : INITIALIZING            │'
  );

  console.log(
    '│ 🔀 Message Router  : INITIALIZING            │'
  );

  console.log(
    '│ 🧩 Plugin Engine   : STANDBY                 │'
  );

  console.log(
    '│ 🛡️ Security Layer  : ACTIVE                 │'
  );

  console.log(
    '│ ⚡ Command Engine  : INITIALIZING            │'
  );

  console.log(
    '└──────────────────────────────────────────────┘'
  );

  console.log(
    '\n🖥️ Node.js   : ' +
    system.node
  );

  console.log(
    '💻 Platform  : ' +
    system.platform
  );

  console.log(
    '🧠 CPU Cores : ' +
    system.cpuCores
  );

  console.log(
    '💾 Memory    : ' +
    system.freeMemoryMB +
    ' MB free'
  );

  // ═══════════════════════════════════════════
  // 🚀 START CORE
  // ═══════════════════════════════════════════

  await core.start();

  // ═══════════════════════════════════════════
  // 📊 DIAGNOSTICS
  // ═══════════════════════════════════════════

  const diagnostics =
    new VentronDiagnostics(core);

  const report =
    diagnostics.getReport();

  printDiagnostics(report);

  // ═══════════════════════════════════════════
  // 🌐 HTTP SERVER
  // ═══════════════════════════════════════════

  const server =
    startHealthServer(core);

  console.log(
    '\n────────────────────────────────────────────────'
  );

  console.log(
    '✅ Ventron AI is ready.'
  );

  console.log(
    '🧠 AI architecture is online.'
  );

  console.log(
    '📡 Event pipeline is online.'
  );

  console.log(
    '🌐 Health server is online.'
  );

  console.log(
    '⚡ Waiting for runtime events...\n'
  );

  return {
    core,
    server
  };
}

// ═══════════════════════════════════════════════════
// 🛡️ ERROR HANDLING
// ═══════════════════════════════════════════════════

process.on(
  'uncaughtException',
  (error) => {

    console.error(
      '\n❌ Uncaught Exception'
    );

    console.error(error);
  }
);

process.on(
  'unhandledRejection',
  (reason) => {

    console.error(
      '\n❌ Unhandled Promise Rejection'
    );

    console.error(reason);
  }
);

// ═══════════════════════════════════════════════════
// 🛑 SAFE SHUTDOWN
// ═══════════════════════════════════════════════════

let runtime = null;

async function shutdown(signal) {

  console.log(
    `\n🛑 ${signal} received.`
  );

  if (runtime) {

    if (runtime.core) {
      await runtime.core.stop();
    }

    if (runtime.server) {

      await new Promise(
        (resolve) => {

          runtime.server.close(
            resolve
          );
        }
      );
    }
  }

  console.log(
    '✅ Ventron AI stopped safely.'
  );

  process.exit(0);
}

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

// ═══════════════════════════════════════════════════
// ▶️ BOOT
// ═══════════════════════════════════════════════════

startVentron()
  .then(
    (result) => {

      runtime = result;

    }
  )
  .catch(
    (error) => {

      console.error(
        '\n❌ Ventron AI failed to start.'
      );

      console.error(error);

      process.exit(1);
    }
  );
