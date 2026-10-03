/**
 * ╔══════════════════════════════════════════════════╗
 * ║           VENTRON AI DIAGNOSTICS               ║
 * ║        COMPLETE SYSTEM HEALTH MONITOR          ║
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
      new Date().toISOString();
  }


  /* ═══════════════════════════════════════
     CORE
  ═══════════════════════════════════════ */

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


  /* ═══════════════════════════════════════
     STORAGE
  ═══════════════════════════════════════ */

  checkStorage() {

    try {

      const status =
        this.core.storage.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : (
                status.initialized
                  ? 'READY'
                  : 'OFFLINE'
              ),

        driver:
          status.driver,

        initialized:
          status.initialized,

        started:
          status.started,

        records:
          status.records,

        stats:
          status.stats

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     PROFILE
  ═══════════════════════════════════════ */

  checkProfile() {

    try {

      const status =
        this.core.profile.getStatus();


      return {

        status: 'ONLINE',

        users:
          status.users,

        threads:
          status.threads,

        stats:
          status.stats

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     COMMANDS
  ═══════════════════════════════════════ */

  checkCommands() {

    try {

      const status =
        this.core.commandEngine.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'STANDBY',

        initialized:
          status.initialized,

        started:
          status.started,

        count:
          status.commandCount,

        commands:
          status.commands,

        loaded:
          status.loader?.loadedCount || 0,

        failed:
          status.loader?.failedCount || 0

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     EVENT GATEWAY
  ═══════════════════════════════════════ */

  checkEventGateway() {

    try {

      const status =
        this.core.eventGateway.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'STANDBY',

        initialized:
          status.initialized,

        started:
          status.started,

        received:
          status.stats?.received || 0,

        messages:
          status.stats?.messages || 0,

        commands:
          status.stats?.commands || 0,

        errors:
          status.stats?.errors || 0

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     MESSAGE ROUTER
  ═══════════════════════════════════════ */

  checkMessageRouter() {

    try {

      const status =
        this.core.messageRouter.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'STANDBY',

        initialized:
          status.initialized,

        started:
          status.started,

        routed:
          status.stats?.routed || 0,

        messages:
          status.stats?.messages || 0,

        commands:
          status.stats?.commands || 0,

        events:
          status.stats?.events || 0,

        ignored:
          status.stats?.ignored || 0,

        errors:
          status.stats?.errors || 0

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     AI SYSTEM
  ═══════════════════════════════════════ */

  checkAI() {

    try {

      const status =
        this.core.aiService.getStatus();


      const engine =
        status.engine || {};

      const memory =
        status.memory || {};

      const profile =
        status.profile || {};


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'STANDBY',

        initialized:
          status.initialized,

        started:
          status.started,

        provider:
          engine.defaultProvider ||
          'none',

        providers:
          engine.providers || [],

        requests:
          engine.stats?.requests || 0,

        responses:
          engine.stats?.responses || 0,

        failures:
          engine.stats?.failures || 0,

        memorySessions:
          memory.sessions || 0,

        memoryMessagesLimit:
          memory.maxMessages || 0,

        profileConnected:
          profile.connected !== false

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     RESPONSE ENGINE
  ═══════════════════════════════════════ */

  checkResponse() {

    try {

      const status =
        this.core.responseEngine.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'STANDBY',

        initialized:
          status.initialized,

        started:
          status.started,

        responses:
          status.stats?.responses || 0,

        failures:
          status.stats?.failures || 0

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     PLATFORM
  ═══════════════════════════════════════ */

  checkPlatform() {

    try {

      const status =
        this.core.platformManager.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'STANDBY',

        initialized:
          status.initialized,

        started:
          status.started,

        platforms:
          status.platforms ||
          status.adapters ||
          []

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     MESSENGER
  ═══════════════════════════════════════ */

  checkMessenger() {

    try {

      const adapter =
        this.core.platformManager.get(
          'messenger'
        );


      if (!adapter) {

        return {

          status: 'NOT_REGISTERED'

        };
      }


      const status =
        typeof adapter.getStatus === 'function'
          ? adapter.getStatus()
          : {};


      return {

        status:
          status.mode === 'production'
            ? 'PRODUCTION'
            : 'DEVELOPMENT',

        registered: true,

        mode:
          status.mode ||
          'development',

        configured:
          status.configured ??
          false

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     WEBHOOK
  ═══════════════════════════════════════ */

  checkWebhook() {

    try {

      const status =
        this.core.webhook.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'STANDBY',

        initialized:
          status.initialized,

        started:
          status.started,

        path:
          status.path ||
          '/webhook',

        requests:
          status.stats?.requests || 0,

        successful:
          status.stats?.successful || 0,

        failed:
          status.stats?.failed || 0

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     SECURITY
  ═══════════════════════════════════════ */

  checkSecurity() {

    try {

      const status =
        this.core.security.getStatus();


      return {

        status:
          status.started
            ? 'ACTIVE'
            : 'READY',

        initialized:
          status.initialized,

        started:
          status.started,

        maxRequests:
          this.core.config.security.maxRequests,

        cooldown:
          this.core.config.security.cooldown,

        environmentSecrets:
          Boolean(
            process.env.ADMIN_UID ||
            process.env.API_KEY ||
            process.env.MESSENGER_PAGE_ACCESS_TOKEN
          )

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     LOGGER
  ═══════════════════════════════════════ */

  checkLogger() {

    try {

      const status =
        this.core.logger.getStatus();


      return {

        status:
          status.started
            ? 'ONLINE'
            : 'READY',

        initialized:
          status.initialized,

        started:
          status.started,

        file:
          status.file,

        stats:
          status.stats

      };

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     SYSTEM
  ═══════════════════════════════════════ */

  checkSystem() {

    const memoryTotal =
      os.totalmem();

    const memoryFree =
      os.freemem();

    const memoryUsed =
      memoryTotal -
      memoryFree;


    const load =
      os.loadavg();


    return {

      platform:
        process.platform,

      architecture:
        process.arch,

      node:
        process.version,

      pid:
        process.pid,

      cpuCores:
        os.cpus().length,

      hostname:
        os.hostname(),

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
          ),

        usedPercent:
          Number(
            (
              memoryUsed /
              memoryTotal *
              100
            ).toFixed(2)
          )

      },

      loadAverage:
        load,

      processUptime:
        Math.floor(
          process.uptime()
        )

    };
  }


  /* ═══════════════════════════════════════
     SELF TEST STATUS
  ═══════════════════════════════════════ */

  checkSelfTest() {

    try {

      return this.core.selfTest
        .getStatus();

    } catch (error) {

      return {

        status: 'ERROR',

        error:
          error.message

      };
    }
  }


  /* ═══════════════════════════════════════
     COMPLETE REPORT
  ═══════════════════════════════════════ */

  getReport() {

    const core =
      this.checkCore();

    const storage =
      this.checkStorage();

    const profile =
      this.checkProfile();

    const commands =
      this.checkCommands();

    const eventGateway =
      this.checkEventGateway();

    const messageRouter =
      this.checkMessageRouter();

    const ai =
      this.checkAI();

    const response =
      this.checkResponse();

    const platform =
      this.checkPlatform();

    const messenger =
      this.checkMessenger();

    const webhook =
      this.checkWebhook();

    const security =
      this.checkSecurity();

    const logger =
      this.checkLogger();

    const system =
      this.checkSystem();

    const selfTest =
      this.checkSelfTest();


    /*
     * Only actual system failures affect
     * the diagnostic health state.
     */

    const criticalFailures = [

      core.status === 'STANDBY',

      storage.status === 'ERROR',

      profile.status === 'ERROR',

      commands.status === 'ERROR' ||
        commands.failed > 0,

      eventGateway.status === 'ERROR' ||
        eventGateway.errors > 0,

      messageRouter.status === 'ERROR' ||
        messageRouter.errors > 0,

      ai.status === 'ERROR' ||
        ai.failures > 0,

      response.status === 'ERROR',

      platform.status === 'ERROR',

      webhook.status === 'ERROR',

      security.status === 'ERROR',

      logger.status === 'ERROR',

      selfTest.failed > 0

    ];


    const healthy =
      !criticalFailures.some(
        value => value === true
      );


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

      createdAt:
        this.createdAt,


      core,

      storage,

      profile,

      commands,

      eventGateway,

      messageRouter,

      ai,

      response,

      platform,

      messenger,

      webhook,

      security,

      logger,

      system,

      selfTest

    };
  }
}


module.exports =
  VentronDiagnostics;
