/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON SECURITY MANAGER            ║
 * ║          RATE LIMIT + SECURITY CONTROL          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

class VentronSecurityManager {

  constructor(config = {}) {

    this.config = config;

    this.requests = new Map();

    this.initialized = false;
    this.started = false;

    this.cleanupTimer = null;

    this.stats = {
      totalChecks: 0,
      allowed: 0,
      blocked: 0,
      cleaned: 0
    };

    this.maxRequests =
      Number(
        process.env.MAX_REQUESTS ||
        config.security?.maxRequests ||
        30
      );

    this.cooldown =
      Number(
        process.env.COOLDOWN ||
        config.security?.cooldown ||
        3000
      );

    this.cleanupInterval =
      Number(
        process.env.SECURITY_CLEANUP_INTERVAL ||
        60000
      );

  }


  /* ═══════════════════════════════════════
     INITIALIZE
  ═══════════════════════════════════════ */

  async initialize() {

    this.initialized = true;

    return true;
  }


  /* ═══════════════════════════════════════
     START
  ═══════════════════════════════════════ */

  async start() {

    if (!this.initialized) {

      await this.initialize();
    }


    if (this.started) {

      return true;
    }


    this.started = true;


    this.cleanupTimer =
      setInterval(
        () => {

          try {

            this.cleanup();

          } catch (error) {

            console.warn(
              '⚠️ Security cleanup error:',
              error.message
            );

          }

        },
        this.cleanupInterval
      );


    /* Prevent timer from keeping Node alive */
    if (
      this.cleanupTimer &&
      typeof this.cleanupTimer.unref === 'function'
    ) {

      this.cleanupTimer.unref();
    }


    return true;
  }


  /* ═══════════════════════════════════════
     REQUEST CHECK
  ═══════════════════════════════════════ */

  check(identifier = 'unknown') {

    this.stats.totalChecks++;


    const key =
      String(identifier);


    const now =
      Date.now();


    let record =
      this.requests.get(key);


    if (!record) {

      record = {

        count: 0,

        windowStart:
          now,

        lastRequest:
          0

      };

      this.requests.set(
        key,
        record
      );
    }


    /*
     * Reset request window
     */

    if (
      now - record.windowStart >=
      this.cooldown
    ) {

      record.count = 0;

      record.windowStart =
        now;
    }


    /*
     * Cooldown protection
     */

    if (
      record.lastRequest &&
      now - record.lastRequest <
      100
    ) {

      this.stats.blocked++;

      return {

        allowed: false,

        reason:
          'TOO_FAST',

        retryAfter:
          100 -
          (now - record.lastRequest)

      };
    }


    /*
     * Maximum request protection
     */

    if (
      record.count >=
      this.maxRequests
    ) {

      this.stats.blocked++;

      return {

        allowed: false,

        reason:
          'RATE_LIMITED',

        retryAfter:
          Math.max(
            0,
            this.cooldown -
            (now - record.windowStart)
          )

      };
    }


    record.count++;

    record.lastRequest =
      now;


    this.stats.allowed++;


    return {

      allowed: true,

      remaining:
        Math.max(
          0,
          this.maxRequests -
          record.count
        )

    };
  }


  /* ═══════════════════════════════════════
     CLEANUP
  ═══════════════════════════════════════ */

  cleanup() {

    const now =
      Date.now();


    let removed =
      0;


    for (
      const [
        key,
        record
      ] of this.requests
    ) {

      if (
        !record ||
        now - record.windowStart >
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


  /* ═══════════════════════════════════════
     STOP
  ═══════════════════════════════════════ */

  async stop() {

    if (
      this.cleanupTimer
    ) {

      clearInterval(
        this.cleanupTimer
      );

      this.cleanupTimer =
        null;
    }


    this.requests.clear();

    this.started = false;

    return true;
  }


  /* ═══════════════════════════════════════
     STATUS
  ═══════════════════════════════════════ */

  getStatus() {

    return {

      initialized:
        this.initialized,

      started:
        this.started,

      activeIdentifiers:
        this.requests.size,

      maxRequests:
        this.maxRequests,

      cooldown:
        this.cooldown,

      cleanupInterval:
        this.cleanupInterval,

      cleanupRunning:
        Boolean(
          this.cleanupTimer
        ),

      stats: {
        ...this.stats
      }

    };
  }

}


module.exports =
  VentronSecurityManager;
