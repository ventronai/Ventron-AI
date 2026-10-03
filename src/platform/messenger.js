/**
 * ╔══════════════════════════════════════════════════╗
 * ║            VENTRON MESSENGER ADAPTER           ║
 * ║        Platform Communication Interface         ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const VentronPlatformBase =
  require('./base');

class VentronMessengerAdapter
  extends VentronPlatformBase {

  constructor(config, options = {}) {

    super(
      config,
      {
        name: 'messenger',
        version: '0.1.0',
        ...options
      }
    );

    this.settings = {
      verifyToken:
        process.env.MESSENGER_VERIFY_TOKEN ||
        '',

      pageAccessToken:
        process.env.MESSENGER_PAGE_ACCESS_TOKEN ||
        '',

      apiVersion:
        process.env.MESSENGER_API_VERSION ||
        'v1'
    };

    this.mode =
      this.settings.pageAccessToken
        ? 'production'
        : 'development';
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    super.initialize();

    this.emit(
      'ready',
      {
        platform: this.name,
        mode: this.mode
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 📥 NORMALIZE INCOMING MESSAGE
  // ═══════════════════════════════════════════════

  async normalize(payload) {

    if (
      !payload ||
      typeof payload !== 'object'
    ) {
      return null;
    }

    const message =
      payload.message ||
      payload.text ||
      '';

    const sender =
      payload.sender ||
      payload.user ||
      null;

    const thread =
      payload.thread ||
      {
        id:
          payload.threadId ||
          payload.conversationId ||
          null
      };

    if (
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return null;
    }

    return {
      id:
        payload.id ||
        `msg_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'message',

      source:
        'messenger',

      message:
        message.trim(),

      user: {
        id:
          sender?.id ||
          sender?.userId ||
          null,

        name:
          sender?.name ||
          null
      },

      thread: {
        id:
          thread?.id ||
          null
      },

      timestamp:
        payload.timestamp ||
        new Date().toISOString(),

      raw:
        payload
    };
  }

  // ═══════════════════════════════════════════════
  // 📤 SEND RESPONSE
  // ═══════════════════════════════════════════════

  async send(response) {

    if (!this.state.started) {

      return {
        success: false,
        sent: false,
        reason: 'PLATFORM_OFFLINE'
      };
    }

    if (!response) {

      return {
        success: false,
        sent: false,
        reason: 'EMPTY_RESPONSE'
      };
    }

    const recipient =
      response.recipient ||
      response.userId ||
      null;

    if (!recipient) {

      this.stats.failed++;

      return {
        success: false,
        sent: false,
        reason: 'RECIPIENT_MISSING'
      };
    }

    // ─────────────────────────────────────────
    // DEVELOPMENT MODE
    // ─────────────────────────────────────────

    if (!this.settings.pageAccessToken) {

      this.stats.sent++;

      const simulated = {
        success: true,
        sent: true,
        simulated: true,
        platform: 'messenger',
        recipient,
        response
      };

      this.emit(
        'sent',
        simulated
      );

      return simulated;
    }

    // ─────────────────────────────────────────
    // PRODUCTION ADAPTER
    // ─────────────────────────────────────────

    /*
     * Official Messenger API transport
     * will be connected here later.
     *
     * No Facebook cookie.
     * No Facebook password.
     * No personal-account automation.
     */

    this.stats.failed++;

    return {
      success: false,
      sent: false,
      reason:
        'MESSENGER_TRANSPORT_NOT_CONNECTED'
    };
  }

  // ═══════════════════════════════════════════════
  // 🔐 WEBHOOK VERIFICATION
  // ═══════════════════════════════════════════════

  verifyWebhook(token) {

    if (
      !this.settings.verifyToken
    ) {

      return false;
    }

    return (
      String(token) ===
      String(
        this.settings.verifyToken
      )
    );
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
      ...super.getStatus(),

      mode:
        this.mode,

      configured:
        Boolean(
          this.settings.pageAccessToken
        ),

      webhookConfigured:
        Boolean(
          this.settings.verifyToken
        ),

      transport:
        this.settings.pageAccessToken
          ? 'pending'
          : 'simulation'
    };
  }
}

module.exports =
  VentronMessengerAdapter;
