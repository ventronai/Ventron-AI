/**
 * ╔══════════════════════════════════════════════════╗
 * ║            VENTRON AI ENGINE                   ║
 * ║        Conversation Processing Core             ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

class VentronAIEngine extends EventEmitter {

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
      requests: 0,
      responses: 0,
      failures: 0
    };

    this.providers = new Map();
    this.defaultProvider = null;
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

    this.emit('started');

    return {
      success: true,
      status: 'online'
    };
  }

  // ═══════════════════════════════════════════════
  // 🔌 REGISTER AI PROVIDER
  // ═══════════════════════════════════════════════

  registerProvider(name, provider) {

    if (
      !name ||
      typeof name !== 'string'
    ) {
      throw new TypeError(
        'Provider name must be a string.'
      );
    }

    if (
      !provider ||
      typeof provider.generate !== 'function'
    ) {
      throw new TypeError(
        `Provider "${name}" must have a generate() function.`
      );
    }

    const providerName =
      name.toLowerCase().trim();

    if (this.providers.has(providerName)) {
      throw new Error(
        `AI provider "${providerName}" is already registered.`
      );
    }

    this.providers.set(
      providerName,
      provider
    );

    if (!this.defaultProvider) {
      this.defaultProvider =
        providerName;
    }

    this.emit('providerRegistered', {
      name: providerName
    });

    return true;
  }

  // ═══════════════════════════════════════════════
  // 🎯 SET DEFAULT PROVIDER
  // ═══════════════════════════════════════════════

  setDefaultProvider(name) {

    const providerName =
      String(name)
        .toLowerCase()
        .trim();

    if (!this.providers.has(providerName)) {
      throw new Error(
        `AI provider "${providerName}" is not registered.`
      );
    }

    this.defaultProvider =
      providerName;

    return true;
  }

  // ═══════════════════════════════════════════════
  // 💬 GENERATE RESPONSE
  // ═══════════════════════════════════════════════

  async generate(input = {}) {

    if (!this.state.started) {
      return {
        success: false,
        response: null,
        reason: 'AI_ENGINE_OFFLINE'
      };
    }

    this.stats.requests++;

    try {

      const message =
        typeof input.message === 'string'
          ? input.message.trim()
          : '';

      if (!message) {
        return {
          success: false,
          response: null,
          reason: 'EMPTY_MESSAGE'
        };
      }

      const providerName =
        input.provider
          ? String(input.provider)
              .toLowerCase()
              .trim()
          : this.defaultProvider;

      if (!providerName) {

        return {
          success: false,
          response: null,
          reason: 'NO_AI_PROVIDER'
        };
      }

      const provider =
        this.providers.get(
          providerName
        );

      if (!provider) {

        return {
          success: false,
          response: null,
          reason: 'AI_PROVIDER_NOT_FOUND'
        };
      }

      const result =
        await provider.generate({
          message,
          user: input.user || null,
          thread: input.thread || null,
          context: input.context || {},
          history: input.history || []
        });

      this.stats.responses++;

      const response = {
        success: true,

        provider:
          providerName,

        response:
          result,

        timestamp:
          new Date().toISOString()
      };

      this.emit(
        'response',
        response
      );

      return response;

    } catch (error) {

      this.stats.failures++;

      this.emit(
        'error',
        error
      );

      return {
        success: false,
        response: null,
        reason: 'AI_GENERATION_ERROR',
        error: error.message
      };
    }
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

      defaultProvider:
        this.defaultProvider,

      providers:
        Array.from(
          this.providers.keys()
        ),

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

    this.emit('stopped');
  }
}

module.exports = VentronAIEngine;
