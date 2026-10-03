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

class VentronCore extends EventEmitter {

  constructor(config) {
    super();

    this.config = config;

    this.state = {
      initialized: false,
      started: false,
      stopped: false,
      startTime: null
    };

    this.modules = new Map();
  }

  registerModule(name, module) {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Module name must be a string.');
    }

    if (!module) {
      throw new Error(`Module "${name}" cannot be empty.`);
    }

    if (this.modules.has(name)) {
      throw new Error(`Module "${name}" is already registered.`);
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

  initialize() {
    if (this.state.initialized) {
      return;
    }

    this.state.initialized = true;

    this.emit('initialized', {
      bot: this.config.bot.name,
      version: this.config.bot.version
    });
  }

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

    for (const [name, module] of this.modules) {
      if (typeof module.start === 'function') {
        await module.start(this);
      }

      this.emit('moduleStarted', name);
    }

    this.emit('started', {
      timestamp: new Date().toISOString()
    });
  }

  async stop() {
    if (!this.state.started || this.state.stopped) {
      return;
    }

    for (const [name, module] of this.modules) {
      if (typeof module.stop === 'function') {
        await module.stop(this);
      }

      this.emit('moduleStopped', name);
    }

    this.state.started = false;
    this.state.stopped = true;

    this.emit('stopped', {
      timestamp: new Date().toISOString()
    });
  }

  getStatus() {
    return {
      initialized: this.state.initialized,
      started: this.state.started,
      stopped: this.state.stopped,
      modules: this.listModules(),
      uptime: this.state.startTime
        ? Math.floor((Date.now() - this.state.startTime) / 1000)
        : 0
    };
  }
}

module.exports = VentronCore;
