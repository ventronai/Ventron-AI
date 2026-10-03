/**
 * ╔══════════════════════════════════════════════════╗
 * ║           VENTRON AI DIAGNOSTICS               ║
 * ║        Internal System Health Monitor           ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const os = require('os');

class VentronDiagnostics {

  constructor(core) {

    if (!core) {
      throw new Error(
        'Ventron Core instance is required.'
      );
    }

    this.core = core;

    this.createdAt =
      Date.now();
  }

  // ═══════════════════════════════════════════════
  // 🧠 CORE
  // ═══════════════════════════════════════════════

  checkCore() {

    const status =
      this.core.getStatus();

    return {

      status:
        status.started
          ? 'ONLINE'
          : 'STANDBY',

      initialized:
        status.initialized,

      started:
        status.started,

      stopped:
        status.stopped
    };
  }

  // ═══════════════════════════════════════════════
  // ⌨️ COMMAND ENGINE
  // ═══════════════════════════════════════════════

  checkCommands() {

    const status =
      this.core.commandEngine
        .getStatus();

    return {

      status:
        status.started
          ? 'ONLINE'
          : 'STANDBY',

      count:
        status.commandCount,

      commands:
        status.commands,

      loaded:
        status.loader.loadedCount,

      failed:
        status.loader.failedCount
    };
  }

  // ═══════════════════════════════════════════════
  // 📡 EVENT GATEWAY
  // ═══════════════════════════════════════════════

  checkEventGateway() {

    const status =
      this.core.eventGateway
        .getStatus();

    return {

      status:
        status.started
          ? 'ONLINE'
          : 'STANDBY',

      initialized:
        status.initialized,

      received:
        status.stats.received,

      messages:
        status.stats.messages,

      commands:
        status.stats.commands,

      errors:
        status.stats.errors
    };
  }

  // ═══════════════════════════════════════════════
  // 🔀 MESSAGE ROUTER
  // ═══════════════════════════════════════════════

  checkMessageRouter() {

    const status =
      this.core.messageRouter
        .getStatus();

    return {

      status:
        status.started
          ? 'ONLINE'
          : 'STANDBY',

      initialized:
        status.initialized,

      routed:
        status.stats.routed,

      messages:
        status.stats.messages,

      commands:
        status.stats.commands,

      events:
        status.stats.events,

      ignored:
        status.stats.ignored,

      errors:
        status.stats.errors
    };
  }

  // ═══════════════════════════════════════════════
  // 🧠 AI SERVICE
  // ═══════════════════════════════════════════════

  checkAI() {

    const status =
      this.core.aiService
        .getStatus();

    return {

      status:
        status.started
          ? 'ONLINE'
          : 'STANDBY',

      initialized:
        status.initialized,

      provider:
        status.engine
          .defaultProvider ||
        'none',

      providers:
        status.engine.providers,

      requests:
        status.engine.stats.requests,

      responses:
        status.engine.stats.responses,

      failures:
        status.engine.stats.failures,

      memorySessions:
        status.memory.sessions,

      memoryMessagesLimit:
        status.memory.maxMessages
    };
  }

  // ═══════════════════════════════════════════════
  // 🖥️ SYSTEM
  // ═══════════════════════════════════════════════

  checkSystem() {

    const memoryTotal =
      os.totalmem();

    const memoryFree =
      os.freemem();

    const memoryUsed =
      memoryTotal -
      memoryFree;

    return {

      platform:
        process.platform,

      architecture:
        process.arch,

      node:
        process.version,

      cpuCores:
        os.cpus().length,

      memory: {

        totalMB:
          Math.round(
            memoryTotal /
            1024 /
            1024
          ),

        freeMB:
          Math.round(
            memoryFree /
            1024 /
            1024
          ),

        usedMB:
          Math.round(
            memoryUsed /
            1024 /
            1024
          )
      },

      processUptime:
        Math.floor(
          process.uptime()
        )
    };
  }

  // ═══════════════════════════════════════════════
  // 🛡️ SECURITY
  // ═══════════════════════════════════════════════

  checkSecurity() {

    const security =
      this.core.config.security;

    return {

      status:
        'ACTIVE',

      maxRequests:
        security.maxRequests,

      cooldown:
        security.cooldown,

      environmentSecrets:
        Boolean(
          process.env.ADMIN_UID ||
          process.env.API_KEY
        )
    };
  }

  // ═══════════════════════════════════════════════
  // ❤️ OVERALL REPORT
  // ═══════════════════════════════════════════════

  getReport() {

    const core =
      this.checkCore();

    const commands =
      this.checkCommands();

    const eventGateway =
      this.checkEventGateway();

    const messageRouter =
      this.checkMessageRouter();

    const ai =
      this.checkAI();

    const system =
      this.checkSystem();

    const security =
      this.checkSecurity();

    const healthy =
      core.started &&
      commands.failed === 0 &&
      eventGateway.errors === 0 &&
      messageRouter.errors === 0 &&
      ai.failures === 0;

    return {

      success:
        true,

      status:
        healthy
          ? '
