'use strict';

const EventEmitter = require('events');

class VentronMessageRouter extends EventEmitter {

  constructor(config) {
    super();

    if (!config) {
      throw new Error('Ventron configuration is required.');
    }

    this.config = config;

    this.state = {
      initialized: false,
      started: false
    };

    this.stats = {
      routed: 0,
      messages: 0,
      commands: 0,
      events: 0,
      ignored: 0,
      errors: 0
    };
  }

  initialize() {
    if (this.state.initialized) {
      return;
    }

    this.state.initialized = true;

    this.emit('initialized');
  }

  async start() {
    if (!this.state.initialized) {
      this.initialize();
    }

    if (this.state.started) {
      return;
    }

    this.state.started = true;

    this.emit('started');

    return {
      success: true,
      status: 'online'
    };
  }

  async route(event) {

    if (!this.state.started) {
      return {
        success: false,
        routed: false,
        reason: 'MESSAGE_ROUTER_OFFLINE'
      };
    }

    if (!event || typeof event !== 'object') {
      this.stats.errors++;

      return {
        success: false,
        routed: false,
        reason: 'INVALID_EVENT'
      };
    }

    this.stats.routed++;

    try {

      // ═════════════════════════════════════════
      // ⌨️ COMMAND
      // ═════════════════════════════════════════

      if (event.type === 'command') {

        this.stats.commands++;

        const result = {
          route: 'command',
          event
        };

        this.emit('command', result);

        return {
          success: true,
          routed: true,
          ...result
        };
      }

      // ═════════════════════════════════════════
      // 💬 MESSAGE / AI CHAT
      // ═════════════════════════════════════════

      if (event.type === 'message') {

        this.stats.messages++;

        const result = {
          route: 'chat',
          event
        };

        this.emit('chat', result);

        return {
          success: true,
          routed: true,
          ...result
        };
      }

      // ═════════════════════════════════════════
      // 🌐 OTHER EVENTS
      // ═════════════════════════════════════════

      if (event.type === 'event') {

        this.stats.events++;

        const result = {
          route: 'event',
          event
        };

        this.emit('event', result);

        return {
          success: true,
          routed: true,
          ...result
        };
      }

      // ═════════════════════════════════════════
      // 🚫 UNKNOWN
      // ═════════════════════════════════════════

      this.stats.ignored++;

      this.emit('ignored', event);

      return {
        success: true,
        routed: false,
        reason: 'UNKNOWN_EVENT_TYPE'
      };

    } catch (error) {

      this.stats.errors++;

      this.emit('error', error);

      return {
        success: false,
        routed: false,
        reason: 'ROUTING_ERROR',
        error: error.message
      };
    }
  }

  getStatus() {
    return {
      initialized: this.state.initialized,
      started: this.state.started,
      stats: {
        ...this.stats
      }
    };
  }

  async stop() {

    if (!this.state.started) {
      return;
    }

    this.state.started = false;

    this.emit('stopped');
  }
}

module.exports = VentronMessageRouter;
