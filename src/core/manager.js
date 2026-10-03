/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON AI CORE MANAGER            ║
 * ║        Central Framework Management Layer       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');
const CommandEngine = require('../commands/engine');

class VentronCore extends EventEmitter {

  constructor(config) {
    super();

    if (!config || !config.bot) {
      throw new Error(
        'Valid Ventron configuration is required.'
      );
    }

    this.config = config;

    this.state = {
      initialized: false,
      started: false,
      stopped: false,
      startTime: null
    };

    this.modules = new Map();

    // ═══════════════════════════════════════════════
    // ⚡ COMMAND ENGINE
    // ═══════════════════════════════════════════════

    this.commandEngine = new CommandEngine(config);
  }

  // ═════════════════════════════════════════════════
  // 🧩 MODULE MANAGEMENT
  // ═════════════════════════════════════════════════

  registerModule(name, module) {

    if (!name || typeof name !== 'string') {
      throw new TypeError(
        'Module name must be a string.'
      );
    }

    if (!module) {
      throw new Error(
        `Module "${name}" cannot be empty.`
      );
    }

    if (this.modules.has(name)) {
      throw new Error(
        `Module "${name}" is already registered.`
      );
    }

    this.modules.set(name, module);

    this.emit('moduleRegistered', {
      name,
      module
    });

    return true;
  }

  getModule(name) {
    return this.modules.get(name);
  }

  hasModule(name) {
    return this.modules.has(name);
  }

  removeModule(name) {

    const removed = this.modules.delete(name);

    if (removed) {
      this.emit('moduleRemoved', name);
    }

    return removed;
  }

  listModules() {
    return Array.from(this.modules.keys());
  }

  // ═════════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═════════════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    // Initialize command system
    const commandStatus =
      this.commandEngine.initialize();

    this.state.initialized = true;

    this.emit('initialized', {
      bot: this.config.bot.name,
      version: this.config.bot.version,
      commands: commandStatus.loaded.map(
        command => command.name
      )
    });
  }

  // ═════════════════════════════════════════════════
  // 🚀 START CORE
  // ═════════════════════════════════════════════════

  async start() {

    if (!this.state.initialized) {
      this.initialize();
    }

    if (this.state.started) {
      return;
    }

    this.state.started = true;
    this.state.stopped = false;
    this.state.startTime = Date.now();

    // Start command engine
    await this.commandEngine.start();

    this.emit('commandEngineStarted', {
      commands: this.commandEngine
        .handler
        .list()
    });

    // Start registered modules
    for (const [name, module] of this.modules) {

      try {

        if (typeof module.start === 'function') {
          await module.start(this);
        }

        this.emit(
          'moduleStarted',
          name
        );

      } catch (error) {

        this.emit('moduleError', {
          name,
          error
        });

        console.error(
          `❌ Module "${name}" failed to start:`,
          error.message
        );
      }
    }

    this.emit('started', {
      timestamp: new Date().toISOString()
    });
  }

  // ═════════════════════════════════════════════════
  // 💬 PROCESS MESSAGE
  // ═════════════════════════════════════════════════

  async processMessage(message, context = {}) {

    return this.commandEngine.process(
      message,
      {
        ...context,
        core: this
      }
    );
  }

  // ═════════════════════════════════════════════════
  // 🛑 STOP CORE
  // ═════════════════════════════════════════════════

  async stop() {

    if (
      !this.state.started ||
      this.state.stopped
    ) {
      return;
    }

    const modules =
      Array.from(
        this.modules.entries()
      ).reverse();

    // Stop registered modules
    for (const [name, module] of modules) {

      try {

        if (typeof module.stop === 'function') {
          await module.stop(this);
        }

        this.emit(
          'moduleStopped',
          name
        );

      } catch (error) {

        this.emit('moduleError', {
          name,
          error
        });

        console.error(
          `❌ Module "${name}" failed to stop:`,
          error.message
        );
      }
    }

    // Stop command engine
    await this.commandEngine.stop();

    this.state.started = false;
    this.state.stopped = true;

    this.emit('stopped', {
      timestamp: new Date().toISOString()
    });
  }

  // ═════════════════════════════════════════════════
  // 📊 STATUS
  // ═════════════════════════════════════════════════

  getStatus() {

    return {
      bot: this.config.bot.name,
      version: this.config.bot.version,

      initialized:
        this.state.initialized,

      started:
        this.state.started,

      stopped:
        this.state.stopped,

      modules:
        this.listModules(),

      commandEngine:
        this.commandEngine.getStatus(),

      uptime:
        this.state.startTime
          ? Math.floor(
              (Date.now() -
                this.state.startTime) /
              1000
            )
          : 0
    };
  }
}

module.exports = VentronCore;
