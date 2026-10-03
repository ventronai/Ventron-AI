/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON COMMAND ENGINE            ║
 * ║       Handler + Loader Integration Layer        ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const CommandHandler = require('./handler');
const CommandLoader = require('./loader');

class CommandEngine {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    // Command processing system
    this.handler = new CommandHandler(config);

    // Dynamic command loader
    this.loader = new CommandLoader(
      this.handler
    );

    this.initialized = false;
    this.started = false;
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.initialized) {
      return;
    }

    const result = this.loader.loadAll();

    this.initialized = true;

    return {
      success: true,
      loaded: result.loaded,
      failed: result.failed
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
      commands: this.handler.list()
    };
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
  // 💬 PROCESS MESSAGE
  // ═══════════════════════════════════════════════

  async process(message, context = {}) {

    if (!this.started) {
      return {
        handled: false,
        reason: 'COMMAND_ENGINE_OFFLINE'
      };
    }

    return this.handler.execute(
      message,
      {
        ...context,
        handler: this.handler,
        engine: this
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
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
      initialized: this.initialized,
      started: this.started,
      commandCount: this.handler.list().length,
      commands: this.handler.list(),
      loader: this.loader.getStatus()
    };
  }
}

module.exports = CommandEngine;
