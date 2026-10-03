/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON WEBHOOK GATEWAY            ║
 * ║        External Event Ingestion Layer           ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const http =
  require('http');

const crypto =
  require('crypto');

class VentronWebhookServer {

  constructor(
    config,
    core
  ) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    if (!core) {
      throw new Error(
        'Ventron Core instance is required.'
      );
    }

    this.config =
      config;

    this.core =
      core;

    this.server =
      null;

    this.started =
      false;

    this.path =
      process.env.WEBHOOK_PATH ||
      '/webhook';

    this.verifyToken =
      process.env.MESSENGER_VERIFY_TOKEN ||
      '';

    this.maxBodySize =
      Number(
        process.env.WEBHOOK_MAX_BODY
      ) ||
      1024 * 1024;

    this.stats = {
      received: 0,
      accepted: 0,
      rejected: 0,
      errors: 0
    };
  }

  // ═══════════════════════════════════════════
  // 🧠 REQUEST BODY
  // ═══════════════════════════════════════════

  readBody(req) {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        let body = '';

        req.on(
          'data',
          chunk => {

            body +=
              chunk.toString();

            if (
              Buffer.byteLength(
                body,
                'utf8'
              ) >
              this.maxBodySize
            ) {

              reject(
                new Error(
                  'Webhook payload is too large.'
                )
              );

              req.destroy();
            }
          }
        );

        req.on(
          'end',
          () => {

            resolve(
              body
            );
          }
        );

        req.on(
          'error',
          reject
        );
      }
    );
  }

  // ═══════════════════════════════════════════
  // 🔐 VERIFY TOKEN
  // ═══════════════════════════════════════════

  verifyRequestToken(
    token
  ) {

    if (
      !this.verifyToken
    ) {
      return false;
    }

    return (
      String(token) ===
      String(this.verifyToken)
    );
  }

  // ═══════════════════════════════════════════
  // 🔏 SIGNATURE CHECK
  // ═══════════════════════════════════════════

  verifySignature(
    body,
    signature,
    appSecret
  ) {

    if (
      !signature ||
      !appSecret
    ) {
      return false;
    }

    const prefix =
      'sha256=';

    if (
      !signature.startsWith(
        prefix
      )
    ) {
      return false;
    }

    const received =
      signature.slice(
        prefix.length
      );

    const expected =
      crypto
        .createHmac(
          'sha256',
          appSecret
        )
        .update(
          body,
          'utf8'
        )
        .digest(
          'hex'
        );

    if (
      received.length !==
      expected.length
    ) {
      return false;
    }

    try {

      return crypto.timingSafeEqual(
        Buffer.from(received),
        Buffer.from(expected)
      );

    } catch {

      return false;
    }
  }

  // ═══════════════════════════════════════════
  // 📡 HANDLE REQUEST
  // ═══════════════════════════════════════════

  async handle(
    req,
    res
  ) {

    this.stats.received++;

    const url =
      new URL(
        req.url,
        `http://${req.headers.host || 'localhost'}`
      );


    // ───────────────────────────────────────
    // ❤️ HEALTH
    // ───────────────────────────────────────

    if (
      req.method === 'GET' &&
      url.pathname === '/health'
    ) {

      return this.sendJSON(
        res,
        200,
        {
          success: true,
          service:
            'Ventron Webhook Gateway',
          status:
            'online'
        }
      );
    }


    // ───────────────────────────────────────
    // 🔐 WEBHOOK VERIFICATION
    // ───────────────────────────────────────

    if (
      req.method === 'GET' &&
      url.pathname === this.path
    ) {

      const mode =
        url.searchParams.get(
          'hub.mode'
        );

      const token =
        url.searchParams.get(
          'hub.verify_token'
        );

      const challenge =
        url.searchParams.get(
          'hub.challenge'
        );


      if (
        mode === 'subscribe' &&
        this.verifyRequestToken(
          token
        )
      ) {

        this.stats.accepted++;

        return this.sendText(
          res,
          200,
          challenge || ''
        );
      }

      this.stats.rejected++;

      return this.sendJSON(
        res,
        403,
        {
          success: false,
          error:
            'Webhook verification failed.'
        }
      );
    }


    // ───────────────────────────────────────
    // 📥 WEBHOOK EVENT
    // ───────────────────────────────────────

    if (
      req.method === 'POST' &&
      url.pathname === this.path
    ) {

      try {

        const body =
          await this.readBody(
            req
          );

        const signature =
          req.headers[
            'x-hub-signature-256'
          ];

        const appSecret =
          process.env.MESSENGER_APP_SECRET ||
          '';


        if (
          appSecret &&
          !this.verifySignature(
            body,
            signature,
            appSecret
          )
        ) {

          this.stats.rejected++;

          return this.sendJSON(
            res,
            403,
            {
              success: false,
              error:
                'Invalid webhook signature.'
            }
          );
        }


        let payload;

        try {

          payload =
            JSON.parse(
              body
            );

        } catch {

          this.stats.rejected++;

          return this.sendJSON(
            res,
            400,
            {
              success: false,
              error:
                'Invalid JSON payload.'
            }
          );
        }


        await this.processPayload(
          payload
        );


        this.stats.accepted++;


        return this.sendJSON(
          res,
          200,
          {
            success: true,
            received: true
          }
        );

      } catch (error) {

        this.stats.errors++;

        this.core.logger.error(
          'Webhook processing error.',
          {
            error:
              error.message
          }
        );

        return this.sendJSON(
          res,
          500,
          {
            success: false,
            error:
              'Webhook processing failed.'
          }
        );
      }
    }


    // ───────────────────────────────────────
    // ❌ NOT FOUND
    // ───────────────────────────────────────

    return this.sendJSON(
      res,
      404,
      {
        success: false,
        error:
          'Webhook route not found.'
      }
    );
  }

  // ═══════════════════════════════════════════
  // 🔄 PROCESS PAYLOAD
  // ═══════════════════════════════════════════

  async processPayload(
    payload
  ) {

    if (
      !payload ||
      typeof payload !== 'object'
    ) {
      return;
    }


    /*
     * Generic development event.
     */

    if (
      payload.type &&
      payload.message
    ) {

      await this.core
        .receiveFromPlatform(
          'messenger',
          payload
        );

      return;
    }


    /*
     * Generic Messenger-style entries.
     * Detailed Meta event mapping will be added
     * in the official transport layer.
     */

    if (
      Array.isArray(
        payload.entry
      )
    ) {

      for (
        const entry
        of payload.entry
      ) {

        if (
          !Array.isArray(
            entry.messaging
          )
        ) {
          continue;
        }

        for (
          const event
          of entry.messaging
        ) {

          const senderId =
            event.sender?.id ||
            null;

          const messageText =
            event.message?.text ||
            '';

          if (
            !messageText
          ) {
            continue;
          }

          await this.core
            .receiveFromPlatform(
              'messenger',
              {

                id:
                  event.message?.mid ||
                  null,

                message:
                  messageText,

                sender: {
                  id:
                    senderId
                },

                thread: {
                  id:
                    senderId
                },

                timestamp:
                  event.timestamp ||
                  Date.now(),

                raw:
                  event
              }
            );
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  // 🌐 START SERVER
  // ═══════════════════════════════════════════

  start() {

    if (
      this.started
    ) {
      return this.server;
    }

    const host =
      this.config.server.host;

    const port =
      this.config.server.port;


    this.server =
      http.createServer(
        (
          req,
          res
        ) => {

          this.handle(
            req,
            res
          ).catch(
            error => {

              this.core.logger.error(
                error
              );

              if (
                !res.headersSent
              ) {

                this.sendJSON(
                  res,
                  500,
                  {
                    success: false,
                    error:
                      'Internal webhook error.'
                  }
                );
              }
            }
          );
        }
      );


    this.server.listen(
      port,
      host,
      () => {

        this.started =
          true;

        this.core.logger.info(
          'Webhook Gateway started.',
          {
            path:
              this.path,

            port
          }
        );
      }
    );


    return this.server;
  }

  // ═══════════════════════════════════════════
  // 📤 JSON RESPONSE
  // ═══════════════════════════════════════════

  sendJSON(
    res,
    status,
    data
  ) {

    if (
      res.headersSent
    ) {
      return;
    }

    res.writeHead(
      status,
      {
        'Content-Type':
          'application/json; charset=utf-8'
      }
    );

    res.end(
      JSON.stringify(
        data,
        null,
        2
      )
    );
  }

  // ═══════════════════════════════════════════
  // 📤 TEXT RESPONSE
  // ═══════════════════════════════════════════

  sendText(
    res,
    status,
    text
  ) {

    if (
      res.headersSent
    ) {
      return;
    }

    res.writeHead(
      status,
      {
        'Content-Type':
          'text/plain; charset=utf-8'
      }
    );

    res.end(
      String(text)
    );
  }

  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    return {

      started:
        this.started,

      path:
        this.path,

      verifyTokenConfigured:
        Boolean(
          this.verifyToken
        ),

      appSecretConfigured:
        Boolean(
          process.env.MESSENGER_APP_SECRET
        ),

      stats: {
        ...this.stats
      }
    };
  }

  // ═══════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════

  async stop() {

    if (
      !this.server
    ) {
      return;
    }

    await new Promise(
      resolve => {

        this.server.close(
          () => {
            resolve();
          }
        );
      }
    );

    this.started =
      false;

    this.server =
      null;

    this.core.logger.info(
      'Webhook Gateway stopped.'
    );
  }
}

module.exports =
  VentronWebhookServer;
