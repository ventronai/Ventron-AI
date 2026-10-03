'use strict';

const crypto = require('crypto');

class VentronWebhookServer {

  constructor(config, core) {

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

    this.config = config;
    this.core = core;

    this.path =
      process.env.WEBHOOK_PATH ||
      '/webhook';

    this.verifyToken =
      process.env.MESSENGER_VERIFY_TOKEN ||
      '';

    this.maxBodySize =
      Number(
        process.env.WEBHOOK_MAX_BODY
      ) || 1024 * 1024;

    this.started = false;

    this.stats = {
      received: 0,
      accepted: 0,
      rejected: 0,
      errors: 0
    };
  }

  verifyRequestToken(token) {

    if (!this.verifyToken) {
      return false;
    }

    return String(token) ===
      String(this.verifyToken);
  }

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

    if (
      !signature.startsWith('sha256=')
    ) {
      return false;
    }

    const received =
      signature.slice(7);

    const expected =
      crypto
        .createHmac(
          'sha256',
          appSecret
        )
        .update(body, 'utf8')
        .digest('hex');

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

  async readBody(req) {

    return new Promise(
      (resolve, reject) => {

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
              ) > this.maxBodySize
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
          () => resolve(body)
        );

        req.on(
          'error',
          reject
        );
      }
    );
  }

  async handle(
    req,
    res,
    url
  ) {

    this.stats.received++;

    // ═══════════════════════════════════════
    // 🔐 META WEBHOOK VERIFICATION
    // ═══════════════════════════════════════

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
        this.verifyRequestToken(token)
      ) {

        this.stats.accepted++;

        res.writeHead(
          200,
          {
            'Content-Type':
              'text/plain; charset=utf-8'
          }
        );

        res.end(
          challenge || ''
        );

        return true;
      }

      this.stats.rejected++;

      this.sendJSON(
        res,
        403,
        {
          success: false,
          error:
            'Webhook verification failed.'
        }
      );

      return true;
    }

    // ═══════════════════════════════════════
    // 📥 WEBHOOK EVENT
    // ═══════════════════════════════════════

    if (
      req.method === 'POST' &&
      url.pathname === this.path
    ) {

      try {

        const body =
          await this.readBody(req);

        const appSecret =
          process.env.MESSENGER_APP_SECRET ||
          '';

        const signature =
          req.headers[
            'x-hub-signature-256'
          ];

        if (
          appSecret &&
          !this.verifySignature(
            body,
            signature,
            appSecret
          )
        ) {

          this.stats.rejected++;

          this.sendJSON(
            res,
            403,
            {
              success: false,
              error:
                'Invalid webhook signature.'
            }
          );

          return true;
        }

        let payload;

        try {

          payload =
            JSON.parse(body);

        } catch {

          this.stats.rejected++;

          this.sendJSON(
            res,
            400,
            {
              success: false,
              error:
                'Invalid JSON payload.'
            }
          );

          return true;
        }

        await this.processPayload(
          payload
        );

        this.stats.accepted++;

        this.sendJSON(
          res,
          200,
          {
            success: true,
            received: true
          }
        );

        return true;

      } catch (error) {

        this.stats.errors++;

        this.core.logger.error(
          'Webhook processing error.',
          {
            error:
              error.message
          }
        );

        this.sendJSON(
          res,
          500,
          {
            success: false,
            error:
              'Webhook processing failed.'
          }
        );

        return true;
      }
    }

    return false;
  }

  async processPayload(payload) {

    if (
      !payload ||
      typeof payload !== 'object'
    ) {
      return;
    }

    // Development event
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

    // Messenger-style events
    if (
      !Array.isArray(
        payload.entry
      )
    ) {
      return;
    }

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

        const messageText =
          event.message?.text ||
          '';

        if (!messageText) {
          continue;
        }

        const senderId =
          event.sender?.id ||
          null;

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

  sendJSON(
    res,
    status,
    data
  ) {

    if (res.headersSent) {
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

  start() {

    this.started = true;

    this.core.logger.info(
      'Webhook Gateway connected.'
    );
  }

  async stop() {

    this.started = false;

    this.core.logger.info(
      'Webhook Gateway disconnected.'
    );
  }

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
}

module.exports =
  VentronWebhookServer;
