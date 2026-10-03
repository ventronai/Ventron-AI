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
    this.createdAt = Date.now();
  }

  // ═══════════════════════════════════════════════
  // 🧠 CORE CHECK
  // ═══════════════════════════════════════════════

  checkCore() {

    const status = this.core.getStatus();

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
  // ⚡ COMMAND CHECK
  // ═══════════════════════════════════════════════

  checkCommands() {

    const engine =
      this.core.commandEngine;

    const status =
      engine.getStatus();

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
  // 🖥️ SYSTEM CHECK
  // ═══════════════════════════════════════════════

  checkSystem() {

    const memoryTotal =
      os.totalmem();

    const memoryFree =
      os.freemem();

    const memoryUsed =
      memoryTotal - memoryFree;

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
  // 🛡️ SECURITY CHECK
  // ═══════════════════════════════════════════════

  checkSecurity() {

    const security =
      this.core.config.security;

    return {
      status: 'ACTIVE',

      maxRequests:
        security.maxRequests,

      cooldown:
        security.cooldown,

      secretsFromEnvironment:
        Boolean(
          process.env.ADMIN_UID ||
          process.env.API_KEY
        )
    };
  }

  // ═══════════════════════════════════════════════
  // 📊 FULL REPORT
  // ═══════════════════════════════════════════════

  getReport() {

    const core =
      this.checkCore();

    const commands =
      this.checkCommands();

    const system =
      this.checkSystem();

    const security =
      this.checkSecurity();

    const healthy =
      core.started &&
      commands.failed === 0;

    return {
      success: true,

      status:
        healthy
          ? 'HEALTHY'
          : 'ATTENTION_REQUIRED',

      bot:
        this.core.config.bot.name,

      version:
        this.core.config.bot.version,

      timestamp:
        new Date().toISOString(),

      core,
      commands,
      system,
      security
    };
  }
}

module.exports = VentronDiagnostics;
