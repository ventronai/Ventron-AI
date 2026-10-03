/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON COMMAND ENGINE             ║
 * ║          Central Command Processing Core         ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const CommandHandler =
  require('./handler');

const CommandLoader =
  require('./loader');

class CommandEngine {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.handler =
      new CommandHandler(config);

    this.loader =
      new CommandLoader(
        this.handler
      );

    this.initialized = false;
    this.started = false;

    // Core reference
    this.core = null;
  }

  // ═══════════════════════════════════════════════
  // 🔗 CONNECT CORE
  // ═══════════════════════════════════════════════

  setCore(core) {

    this.core = core;

    return true;
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.initialized) {
      return;
    }

    const result =
      this.loader.loadAll();

    this.initialized = true;

    return {
      success: true,

      loaded:
        result.loaded,

      failed:
        result.failed
    };
  }

  // ═══════════════════════════════════════════════
  // 🚀 START
  // ═══════════════════════════════════════════════

  async start() {

    if (!this.initialized) {
      this.initialize();
    }

    if (this.started) {
      return;
    }

    this.started = true;

    return {
      success: true,

      commands:
        this.handler.list()
    };
  }

  // ═══════════════════════════════════════════════
  // ⚡ PROCESS COMMAND
  // ═══════════════════════════════════════════════

  async process(
    message,
    context = {}
  ) {

    if (!this.started) {

      return {
        handled: false,

        reason:
          'COMMAND_ENGINE_OFFLINE'
      };
    }

    return this.handler.execute(
      message,
      {
        ...context,

        config:
          this.config,

        core:
          this.core,

        handler:
          this.handler,

        engine:
          this
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🔄 RELOAD
  // ═══════════════════════════════════════════════

  reload(commandName) {

    return this.loader.reload(
      commandName
    );
  }

  // ═══════════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════════

  async stop() {

    if (!this.started) {
      return;
    }

    this.started = false;
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {

      initialized:
        this.initialized,

      started:
        this.started,

      coreConnected:
        Boolean(this.core),

      commandCount:
        this.handler.list().length,

      commands:
        this.handler.list(),

      loader:
        this.loader.getStatus()
    };
  }
}

module.exports =
  CommandEngine;
