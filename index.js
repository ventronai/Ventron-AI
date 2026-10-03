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

const os =
  require('os');

const http =
  require('http');

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
// 🌐 HTTP SERVER
// ═══════════════════════════════════════════════

function startHealthServer(core) {

  const server =
    http.createServer(
      async (
        req,
        res
      ) => {

        const url =
          new URL(
            req.url,
            `http://${req.headers.host || 'localhost'}`
          );


        // ═════════════════════════════════════
        // 📡 WEBHOOK
        // ═════════════════════════════════════

        if (
          url.pathname ===
          core.webhook.path
        ) {

          const handled =
            await core.webhook.handle(
              req,
              res,
              url
            );

          if (handled) {
            return;
          }
        }


        res.setHeader(
          'Content-Type',
          'application/json; charset=utf-8'
        );


        // ═════════════════════════════════════
        // ❤️ HEALTH
        // ═════════════════════════════════════

        if (
          url.pathname === '/' ||
          url.pathname === '/health'
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
                      ?.started ||
                    false,

                  security:
                    status.security.started,

                  webhook:
                    status.webhook.started,

                  webhookTester:
                    status.webhookTester
                      ? true
                      : false
                },

                commands:
                  status.commandEngine
                    .commands
                    .length,

                platforms:
                  status.platforms
                    .platforms
                    ? Object.keys(
                        status.platforms
                          .platforms
                      )
                    : [],

                timestamp:
                  new Date()
                    .toISOString()
              },

              null,

              2
            )
          );

          return;
        }


        // ═════════════════════════════════════
        // 🔌 API
        // ═════════════════════════════════════

        if (
          url.pathname === '/api'
        ) {

          res.writeHead(200);

          res.end(
            JSON.stringify(
              {

                success:
                  true,

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

                  '/status',

                  '/selftest',

                  '/api',

                  '/webhook'
                ]
              },

              null,

              2
            )
          );

          return;
        }


        // ═════════════════════════════════════
        // 📊 STATUS
        // ═════════════════════════════════════

        if (
          url.pathname === '/status'
        ) {

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


        // ═════════════════════════════════════
        // 🧪 LIVE SELF TEST
        // ═════════════════════════════════════

        if (
          url.pathname === '/selftest'
        ) {

          try {

            const result =
              await core.runSelfTest();


            res.writeHead(
              result.success
                ? 200
                : 503
            );


            res.end(
              JSON.stringify(
                {

                  success:
                    result.success,

                  service:
                    'Ventron AI Live Self-Test',

                  bot:
                    VENTRON.name,

                  version:
                    VENTRON.version,

                  total:
                    result.total,

                  passed:
                    result.passed,

                  failed:
                    result.failed,

                  result:
                    result.success
                      ? 'PASS'
                      : 'ATTENTION_REQUIRED',

                  tests:
                    result.tests,

                  timestamp:
                    result.timestamp
                },

                null,

                2
              )
            );

          } catch (error) {

            res.writeHead(500);

            res.end(
              JSON.stringify(
                {

                  success:
                    false,

                  error:
                    'Self-test execution failed.',

                  message:
                    error.message,

                  timestamp:
                    new Date()
                      .toISOString()
                },

                null,

                2
              )
            );
          }

          return;
        }


        // ═════════════════════════════════════
        // ❌ NOT FOUND
        // ═════════════════════════════════════

        res.writeHead(404);

        res.end(
          JSON.stringify(
            {

              success:
                false,

              error:
                'Route not found',

              path:
                url.pathname
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
        '❤️ Health: /health'
      );

      console.log(
        '📊 Status: /status'
      );

      console.log(
        '🧪 Live Self-Test: /selftest'
      );

      console.log(
        '🔌 API: /api'
      );

      console.log(
        `📡 Webhook: ${core.webhook.path}\n`
      );
    }
  );


  return server;
}


// ═══════════════════════════════════════════════
// 📊 DIAGNOSTICS DISPLAY
// ═══════════════════════════════════════════════

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
    `│ Command Engine    : ${report.commands.status}`
  );

  console.log(
    `│ Commands Loaded   : ${report.commands.count}`
  );

  console.log(
    `│ Command Failures  : ${report.commands.failed}`
  );

  console.log(
    `│ Event Gateway     : ${report.eventGateway.status}`
  );

  console.log(
    `│ Message Router    : ${report.messageRouter.status}`
  );

  console.log(
    `│ AI Service        : ${report.ai.status}`
  );

  console.log(
    `│ AI Provider       : ${report.ai.provider}`
  );

  console.log(
    `│ Memory Sessions   : ${report.ai.memorySessions}`
  );

  console.log(
    `│ Security Layer    : ${report.security.status}`
  );

  console.log(
    `│ CPU Cores         : ${report.system.cpuCores}`
  );

  console.log(
    `│ Node.js           : ${report.system.node}`
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


// ═══════════════════════════════════════════════
// 🧪 SELF TEST DISPLAY
// ═══════════════════════════════════════════════

function printSelfTest(report) {

  console.log(
    '\n┌──────────────────────────────────────────────┐'
  );

  console.log(
    '│             VENTRON SELF TEST               │'
  );

  console.log(
    '├──────────────────────────────────────────────┤'
  );

  console.log(
    `│ Total Tests       : ${report.total}`
  );

  console.log(
    `│ Passed            : ${report.passed}`
  );

  console.log(
    `│ Failed            : ${report.failed}`
  );

  console.log(
    `│ Result            : ${
      report.success
        ? 'PASS'
        : 'ATTENTION'
    }`
  );

  console.log(
    '└──────────────────────────────────────────────┘'
  );


  for (
    const test
    of report.tests
  ) {

    console.log(
      `   ${
        test.passed
          ? '✅'
          : '❌'
      } ${test.name} (${test.duration}ms)`
    );


    if (
      test.error
    ) {

      console.log(
        `      └─ ${test.error}`
      );
    }
  }
}


// ═══════════════════════════════════════════════
// 🚀 START VENTRON
// ═══════════════════════════════════════════════

async function startVentron() {

  printBanner();


  console.log(
    '⚡ Initializing Ventron AI Core...\n'
  );


  const core =
    new VentronCore(
      config
    );


  core.on(
    'initialized',

    (
      data
    ) => {

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

      console.log(
        `🌐 Platforms registered: ${
          data.platforms.length
        }`
      );
    }
  );


  core.on(
    'commandEngineStarted',

    (
      data
    ) => {

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


  core.responseEngine.on(
    'started',

    () => {

      console.log(
        '📦 Response Engine online.'
      );
    }
  );


  core.platformManager.on(
    'started',

    (
      data
    ) => {

      console.log(
        `🌐 Platform online: ${
          data.name
        }`
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
    'platformResponse',

    () => {

      console.log(
        '📤 Platform response processed.'
      );
    }
  );


  core.on(
    'pipelineError',

    (
      error
    ) => {

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
    '│ 📦 Response Engine : INITIALIZING            │'
  );

  console.log(
    '│ 🌐 Platform Layer  : INITIALIZING            │'
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
    '│ 📡 Webhook Tester  : READY                  │'
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


  await core.start();


  const diagnostics =
    new VentronDiagnostics(
      core
    );


  const report =
    diagnostics.getReport();


  printDiagnostics(
    report
  );


  console.log(
    '\n🧪 Running Ventron internal self-test...'
  );


  const selfTest =
    await core.runSelfTest();


  printSelfTest(
    selfTest
  );


  const server =
    startHealthServer(
      core
    );


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
    '📦 Response Engine is online.'
  );

  console.log(
    '🌐 Platform layer is online.'
  );

  console.log(
    `🧪 Self-Test: ${
      selfTest.success
        ? 'PASS'
        : 'ATTENTION'
    }`
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


// ═══════════════════════════════════════════════
// ❌ PROCESS ERROR HANDLERS
// ═══════════════════════════════════════════════

process.on(
  'uncaughtException',

  (
    error
  ) => {

    console.error(
      '\n❌ Uncaught Exception'
    );

    console.error(
      error
    );
  }
);


process.on(
  'unhandledRejection',

  (
    reason
  ) => {

    console.error(
      '\n❌ Unhandled Promise Rejection'
    );

    console.error(
      reason
    );
  }
);


// ═══════════════════════════════════════════════
// 🛑 SAFE SHUTDOWN
// ═══════════════════════════════════════════════

let runtime =
  null;


async function shutdown(
  signal
) {

  console.log(
    `\n🛑 ${signal} received.`
  );


  if (runtime) {

    if (
      runtime.core
    ) {

      await runtime.core.stop();
    }


    if (
      runtime.server
    ) {

      await new Promise(
        (
          resolve
        ) => {

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

  () =>
    shutdown(
      'SIGINT'
    )
);


process.on(
  'SIGTERM',

  () =>
    shutdown(
      'SIGTERM'
    )
);


// ═══════════════════════════════════════════════
// 🚀 BOOT
// ═══════════════════════════════════════════════

startVentron()
  .then(
    (
      result
    ) => {

      runtime =
        result;
    }
  )
  .catch(
    (
      error
    ) => {

      console.error(
        '\n❌ Ventron AI failed to start.'
      );

      console.error(
        error
      );

      process.exit(1);
    }
  );
