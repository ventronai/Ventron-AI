/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON EVENT GATEWAY              ║
 * ║          Universal Event Input Layer            ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

class VentronEventGateway extends EventEmitter {

  constructor(config) {
    super();

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.state = {
      initialized: false,
      started: false,
      stopped: false
    };

    this.stats = {
      received: 0,
      messages: 0,
      commands: 0,
      errors: 0
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

    this.emit('initialized', {
      name: 'Event Gateway',
      timestamp: new Date().toISOString()
    });
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

    this.emit('started', {
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      status: 'online'
    };
  }

  // ═══════════════════════════════════════════════
  // 📥 RECEIVE EVENT
  // ═══════════════════════════════════════════════

  async receive(event = {}) {

    if (!this.state.started) {
      return {
        success: false,
        handled: false,
        reason: 'EVENT_GATEWAY_OFFLINE'
      };
    }

    this.stats.received++;

    try {

      const normalized =
        this.normalize(event);

      if (!normalized) {
        this.stats.errors++;

        return {
          success: false,
          handled: false,
          reason: 'INVALID_EVENT'
        };
      }

      // ─────────────────────────────────────────
      // 💬 MESSAGE
      // ─────────────────────────────────────────

      if (normalized.type === 'message') {
        this.stats.messages++;

        this.emit(
          'message',
          normalized
        );

        return {
          success: true,
          handled: true,
          type: 'message',
          event: normalized
        };
      }

      // ─────────────────────────────────────────
      // ⌨️ COMMAND
      // ─────────────────────────────────────────

      if (normalized.type === 'command') {
        this.stats.commands++;

        this.emit(
          'command',
          normalized
        );

        return {
          success: true,
          handled: true,
          type: 'command',
          event: normalized
        };
      }

      // ─────────────────────────────────────────
      // 🌐 GENERIC EVENT
      // ─────────────────────────────────────────

      this.emit(
        'event',
        normalized
      );

      return {
        success: true,
        handled: true,
        type: normalized.type,
        event: normalized
      };

    } catch (error) {

      this.stats.errors++;

      this.emit(
        'error',
        error
      );

      return {
        success: false,
        handled: false,
        reason: 'EVENT_PROCESSING_ERROR',
        error: error.message
      };
    }
  }

  // ═══════════════════════════════════════════════
  // 🔄 NORMALIZE EVENT
  // ═══════════════════════════════════════════════

  normalize(event) {

    if (!event || typeof event !== 'object') {
      return null;
    }

    const type =
      typeof event.type === 'string'
        ? event.type.toLowerCase().trim()
        : 'event';

    const user =
      event.user || null;

    const thread =
      event.thread || null;

    const message =
      typeof event.message === 'string'
        ? event.message.trim()
        : '';

    const normalized = {
      id:
        event.id ||
        `evt_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type,

      source:
        event.source || 'unknown',

      user,

      thread,

      message,

      timestamp:
        event.timestamp ||
        new Date().toISOString(),

      raw:
        event.raw || event
    };

    // ─────────────────────────────────────────
    // ⌨️ AUTO COMMAND DETECTION
    // ─────────────────────────────────────────

    const prefix =
      this.config.commands &&
      this.config.commands.prefix
        ? this.config.commands.prefix
        : '!';

    if (
      message &&
      message.startsWith(prefix)
    ) {

      normalized.type = 'command';

      const content =
        message
          .slice(prefix.length)
          .trim();

      const parts =
        content
          ? content.split(/\s+/)
          : [];

      normalized.command =
        parts.shift() || '';

      normalized.args =
        parts;

      normalized.text =
        parts.join(' ');
    }

    return normalized;
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
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

    this.emit('stopped', {
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = VentronEventGateway;
