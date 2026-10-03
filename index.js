function startHealthServer(core) {

  const server =
    http.createServer(
      async (req, res) => {

        const url =
          new URL(
            req.url,
            `http://${req.headers.host || 'localhost'}`
          );


        // ═══════════════════════════════════════
        // 📡 VENTRON WEBHOOK
        // ═══════════════════════════════════════

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


        // ═══════════════════════════════════════
        // ❤️ HEALTH
        // ═══════════════════════════════════════

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
                      ?.started || false,

                  security:
                    status.security.started,

                  webhook:
                    status.webhook.started
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


        // ═══════════════════════════════════════
        // 🔌 API
        // ═══════════════════════════════════════

        if (
          url.pathname === '/api'
        ) {

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


        // ═══════════════════════════════════════
        // 📊 STATUS
        // ═══════════════════════════════════════

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


        // ═══════════════════════════════════════
        // 🧪 SELF TEST
        // ═══════════════════════════════════════

        if (
          url.pathname === '/selftest'
        ) {

          const result =
            core.selfTest
              .getStatus();

          res.writeHead(
            result.failed === 0
              ? 200
              : 503
          );

          res.end(
            JSON.stringify(
              result,
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
        '🧪 Self-Test: /selftest'
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
