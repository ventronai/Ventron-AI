/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON SECURITY MANAGER           ║
 * ║          Runtime Protection & Guard Layer       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

class VentronSecurityManager {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.state = {
      initialized: false,
      started: false
    };

    this.requests =
      new Map();

    this.stats = {
      checked: 0,
      allowed: 0,
      blocked: 0,
      cleaned: 0
    };

    this.maxRequests =
      Number(
        config.security?.maxRequests
      ) || 30;

    this.cooldown =
      Number(
        config.security?.cooldown
      ) || 3000;
  }

  // ═══════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════

  initialize() {

    if (
      this.state.initialized
    ) {
      return;
    }

    this.state.initialized =
      true;
  }

  // ═══════════════════════════════════════════
  // 🚀 START
  // ═══════════════════════════════════════════

  start() {

    if (
      !this.state.initialized
    ) {
      this.initialize();
    }

    if (
      this.state.started
    ) {
      return;
    }

    this.state.started =
      true;

    return {
      success: true,
      status: 'online'
    };
  }

  // ═══════════════════════════════════════════
  // 🔐 IDENTIFIER
  // ═══════════════════════════════════════════

  normalizeIdentifier(
    identifier
  ) {

    if (
      identifier === null ||
      identifier === undefined
    ) {
      return 'unknown';
    }

    return String(
      identifier
    ).trim() || 'unknown';
  }

  // ═══════════════════════════════════════════
  // 🛡️ REQUEST CHECK
  // ═══════════════════════════════════════════

  check(
    identifier
  ) {

    this.stats.checked++;

    const key =
      this.normalizeIdentifier(
        identifier
      );

    const now =
      Date.now();

    let record =
      this.requests.get(
        key
      );

    if (!record) {

      record = {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        blockedUntil: 0
      };

      this.requests.set(
        key,
        record
      );
    }

    // Previous block still active
    if (
      record.blockedUntil > now
    ) {

      this.stats.blocked++;

      return {
        allowed: false,
        blocked: true,
        reason: 'RATE_LIMITED',
        retryAfter:
          record.blockedUntil - now
      };
    }

    // Reset window
    if (
      now -
      record.firstRequest >
      this.cooldown
    ) {

      record.count = 0;
      record.firstRequest = now;
    }

    record.count++;
    record.lastRequest = now;

    if (
      record.count >
      this.maxRequests
    ) {

      record.blockedUntil =
        now + this.cooldown;

      this.stats.blocked++;

      return {
        allowed: false,
        blocked: true,
        reason: 'RATE_LIMITED',
        retryAfter:
          this.cooldown
      };
    }

    this.stats.allowed++;

    return {
      allowed: true,
      blocked: false,
      remaining:
        Math.max(
          0,
          this.maxRequests -
          record.count
        )
    };
  }

  // ═══════════════════════════════════════════
  // 🧹 CLEAN OLD RECORDS
  // ═══════════════════════════════════════════

  cleanup() {

    const now =
      Date.now();

    let removed = 0;

    for (
      const [
        key,
        record
      ] of this.requests
    ) {

      if (
        now -
        record.lastRequest >
        this.cooldown * 2
      ) {

        this.requests.delete(
          key
        );

        removed++;
      }
    }

    this.stats.cleaned +=
      removed;

    return removed;
  }

  // ═══════════════════════════════════════════
  // 🔑 SECRET CHECK
  // ═══════════════════════════════════════════

  hasAdminUID() {

    return Boolean(
      process.env.ADMIN_UID
    );
  }

  hasAPIKey() {

    return Boolean(
      process.env.API_KEY
    );
  }

  hasMessengerToken() {

    return Boolean(
      process.env.MESSENGER_PAGE_ACCESS_TOKEN
    );
  }

  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    return {

      initialized:
        this.state.initialized,

      started:
        this.state.started,

      activeIdentifiers:
        this.requests.size,

      limits: {

        maxRequests:
          this.maxRequests,

        cooldown:
          this.cooldown
      },

      secrets: {

        adminUID:
          this.hasAdminUID(),

        apiKey:
          this.hasAPIKey(),

        messengerToken:
          this.hasMessengerToken()
      },

      stats: {
        ...this.stats
      }
    };
  }

  // ═══════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════

  stop() {

    this.requests.clear();

    this.state.started =
      false;

    return true;
  }
}

module.exports =
  VentronSecurityManager;
