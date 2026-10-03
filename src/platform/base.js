/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON PLATFORM BASE              ║
 * ║        Universal Messaging Adapter Layer        ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

class VentronPlatformBase extends EventEmitter {

  constructor(config, options = {}) {

    super();

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.name =
      options.name ||
      'unknown';

    this.version =
      options.version ||
      '0.1.0';

    this.state = {
      initialized: false,
      started: false,
      stopped: false
    };

    this.stats = {
      received: 0,
      sent: 0,
      failed: 0
    };
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.state.initialized = true;

    this.emit(
      'initialized',
      {
        platform:
          this.name,

        timestamp:
          new Date().toISOString()
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🚀 START
  // ═══════════════════════════════════════════════

  async start() {

    if (!this.state.initialized) {
      this.initialize();
    }

    if (this.state.started) {
      return;
    }

    this.state.started = true;
    this.state.stopped = false;

    this.emit(
      'started'
    );

    return {
      success: true,
      status: 'online',
      platform: this.name
    };
  }

  // ═══════════════════════════════════════════════
  // 📥 RECEIVE
  // ═══════════════════════════════════════════════

  async receive(payload) {

    if (!this.state.started) {

      return {
        success: false,
        handled: false,
        reason: 'PLATFORM_OFFLINE'
      };
    }

    this.stats.received++;

    try {

      const event =
        await this.normalize(
          payload
        );

      if (!event) {

        this.stats.failed++;

        return {
          success: false,
          handled: false,
          reason: 'INVALID_PLATFORM_EVENT'
        };
      }

      this.emit(
        'event',
        event
      );

      return {
        success: true,
        handled: true,
        event
      };

    } catch (error) {

      this.stats.failed++;

      this.emit(
        'error',
        error
      );

      return {
        success: false,
        handled: false,
        reason: 'PLATFORM_RECEIVE_ERROR',
        error: error.message
      };
    }
  }

  // ═══════════════════════════════════════════════
  // 📤 SEND
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

    throw new Error(
      'send() must be implemented by the platform adapter.'
    );
  }

  // ═══════════════════════════════════════════════
  // 🔄 NORMALIZE
  // ═══════════════════════════════════════════════

  async normalize() {

    throw new Error(
      'normalize() must be implemented by the platform adapter.'
    );
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
      platform:
        this.name,

      version:
        this.version,

      initialized:
        this.state.initialized,

      started:
        this.state.started,

      stopped:
        this.state.stopped,

      stats: {
        ...this.stats
      }
    };
  }

  // ═══════════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════════

  async stop() {

    if (!this.state.started) {
      return;
    }

    this.state.started = false;
    this.state.stopped = true;

    this.emit(
      'stopped',
      {
        platform:
          this.name,

        timestamp:
          new Date().toISOString()
      }
    );
  }
}

module.exports =
  VentronPlatformBase;
