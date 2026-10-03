/**
 * ╔══════════════════════════════════════════════════╗
 * ║                 VENTRON AI                     ║
 * ║              MAIN RUNTIME CORE                 ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const http = require('http');

const config = require('./config');
const VentronCore = require('./src/core/manager');
const VentronDiagnostics = require('./src/core/diagnostics');


/* ═══════════════════════════════════════
   CORE
═══════════════════════════════════════ */

const core =
  new VentronCore();


const diagnostics =
  new VentronDiagnostics(
    core
  );


/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

function sendJSON(
  response,
  statusCode,
  data
) {

  const body =
    JSON.stringify(
      data,
      null,
      2
    );


  response.writeHead(
    statusCode,
    {
      'Content-Type':
        'application/json; charset=utf-8',

      'Content-Length':
        Buffer.byteLength(body)
    }
  );


  response.end(
    body
  );
}


function sendText(
  response,
  statusCode,
  text
) {

  response.writeHead(
    statusCode,
    {
      'Content-Type':
        'text/plain; charset=utf-8',

      'Content-Length':
        Buffer.byteLength(text)
    }
  );


  response.end(
    text
  );
}


/* ═══════════════════════════════════════
   HTTP SERVER
═══════════════════════════════════════ */

const server =
  http.createServer(
    async (request, response) => {

      try {

        const url =
          new URL(
            request.url,
            `http://${request.headers.host || 'localhost'}`
          );


        const pathname =
          url.pathname;


        /* ═══════════════════════════════
           ROOT
        ═══════════════════════════════ */

        if (
          request.method === 'GET' &&
          pathname === '/'
        ) {

          return sendJSON(
            response,
            200,
            {

              success: true,

              bot:
                config.bot.name,

              version:
                config.bot.version,

              status:
                core.state.started
                  ? 'ONLINE'
                  : 'STANDBY',

              message:
                'Ventron AI runtime is active.',

              endpoints: {

                health:
                  '/health',

                status:
                  '/status',

                diagnostics:
                  '/diagnostics',

                selftest:
                  '/selftest',

                api:
                  '/api',

                webhook:
                  '/webhook'

              }

            }
          );
        }


        /* ═══════════════════════════════
           HEALTH
        ═══════════════════════════════ */

        if (
          request.method === 'GET' &&
          pathname === '/health'
        ) {

          const status =
            core.getStatus();


          return sendJSON(
            response,
            status.started
              ? 200
              : 503,
            {

              success:
                status.started,

              status:
                status.started
                  ? 'ONLINE'
                  : 'OFFLINE',

              bot:
                config.bot.name,

              version:
                config.bot.version,

              uptime:
                Math.floor(
                  process.uptime()
                ),

              timestamp:
                new Date().toISOString()

            }
          );
        }


        /* ═══════════════════════════════
           STATUS
        ═══════════════════════════════ */

        if (
          request.method === 'GET' &&
          pathname === '/status'
        ) {

          return sendJSON(
            response,
            200,
            core.getStatus()
          );
        }


        /* ═══════════════════════════════
           DIAGNOSTICS
        ═══════════════════════════════ */

        if (
          request.method === 'GET' &&
          pathname === '/diagnostics'
        ) {

          return sendJSON(
            response,
            200,
            diagnostics.getReport()
          );
        }


        /* ═══════════════════════════════
           SELF TEST
        ═══════════════════════════════ */

        if (
          request.method === 'GET' &&
          pathname === '/selftest'
        ) {

          const result =
            await core.runSelfTest();


          return sendJSON(
            response,
            result.success
              ? 200
              : 503,
            result
          );
        }


        /* ═══════════════════════════════
           API INFO
        ═══════════════════════════════ */

        if (
          request.method === 'GET' &&
          pathname === '/api'
        ) {

          return sendJSON(
            response,
            200,
            {

              name:
                'Ventron AI API',

              version:
                config.bot.version,

              endpoints: {

                GET: [

                  '/',

                  '/health',

                  '/status',

                  '/diagnostics',

                  '/selftest',

                  '/api'

                ],

                POST: [

                  '/webhook'

                ]

              }

            }
          );
        }


        /* ═══════════════════════════════
           WEBHOOK
        ═══════════════════════════════ */

        if (
          pathname === '/webhook' ||
          pathname === config.webhook?.path
        ) {

          return core.webhook.handle(
            request,
            response
          );
        }


        /* ═══════════════════════════════
           404
        ═══════════════════════════════ */

        return sendJSON(
          response,
          404,
          {

            success: false,

            error:
              'NOT_FOUND',

            path:
              pathname,

            message:
              'Ventron endpoint was not found.'

          }
        );

      } catch (error) {

        return sendJSON(
          response,
          500,
          {

            success: false,

            error:
              'INTERNAL_SERVER_ERROR',

            message:
              error.message

          }
        );
      }
    }
  );


/* ═══════════════════════════════════════
   STARTUP
═══════════════════════════════════════ */

async function start() {

  try {

    console.log(`
╔══════════════════════════════════════════════╗
║                VENTRON AI                  ║
║             SYSTEM STARTUP                 ║
╠══════════════════════════════════════════════╣
║ 🤖 Bot      : ${config.bot.name}
║ 📦 Version  : ${config.bot.version}
║ 👤 Author   : ${config.bot.author}
║ 🟢 Runtime  : Node.js ${process.version}
║ 🌐 Port     : ${config.server.port}
╚══════════════════════════════════════════════╝
`);


    /* ═══════════════════════════════════
       CORE START
    ═══════════════════════════════════ */

    await core.initialize();

    await core.start();


    /* ═══════════════════════════════════
       HTTP SERVER
    ═══════════════════════════════════ */

    server.listen(
      config.server.port,
      config.server.host,
      () => {

        console.log(
          `🌐 Ventron HTTP server listening on ${config.server.host}:${config.server.port}`
        );

        console.log(
          `❤️ Health   : /health`
        );

        console.log(
          `📊 Status   : /status`
        );

        console.log(
          `🔎 Diagnose : /diagnostics`
        );

        console.log(
          `🧪 SelfTest : /selftest`
        );

        console.log(
          `🔗 Webhook  : /webhook`
        );

        console.log(
          `⚡ Ventron AI is ONLINE.\n`
        );

      }
    );


    /* ═══════════════════════════════════
       STARTUP SELF TEST
    ═══════════════════════════════════ */

    const test =
      await core.runSelfTest();


    console.log(
      '\n🧪 SELF TEST'
    );

    console.log(
      `Status : ${test.status}`
    );

    console.log(
      `Passed : ${test.summary.passed}/${test.summary.total}`
    );

    console.log(
      `Failed : ${test.summary.failed}`
    );

    console.log(
      `Time   : ${test.durationMs}ms\n`
    );


    if (!test.success) {

      console.warn(
        '⚠️ Ventron started, but self-test requires attention.'
      );

    } else {

      console.log(
        '✅ ALL VENTRON SYSTEMS OPERATIONAL.\n'
      );
    }


  } catch (error) {

    console.error(
      '\n❌ VENTRON STARTUP FAILED'
    );

    console.error(
      error
    );


    process.exitCode =
      1;
  }
}


/* ═══════════════════════════════════════
   SHUTDOWN
═══════════════════════════════════════ */

async function shutdown(
  signal
) {

  console.log(
    `\n🛑 ${signal} received. Shutting down Ventron...`
  );


  try {

    await core.stop();


    if (
      server.listening
    ) {

      server.close();
    }


    console.log(
      '✅ Ventron shutdown complete.'
    );


    process.exit(
      0
    );

  } catch (error) {

    console.error(
      '❌ Shutdown error:',
      error.message
    );


    process.exit(
      1
    );
  }
}


process.once(
  'SIGINT',
  () => shutdown('SIGINT')
);


process.once(
  'SIGTERM',
  () => shutdown('SIGTERM')
);


/* ═══════════════════════════════════════
   START
═══════════════════════════════════════ */

start();
