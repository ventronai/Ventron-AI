/**
 * ╔══════════════════════════════════════════════════╗
 * ║                VENTRON AI ENGINE               ║
 * ║           PROVIDER CONTROL SYSTEM              ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

const VentronLocalProvider =
  require('./providers/local');


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


    /* ═══════════════════════════════════════
       PROVIDERS
    ═══════════════════════════════════════ */

    this.providers =
      new Map();

    this.defaultProvider =
      null;


    /* ═══════════════════════════════════════
       STATISTICS
    ═══════════════════════════════════════ */

    this.stats = {

      requests: 0,

      responses: 0,

      failures: 0,

      providerRequests: {},

      providerFailures: {}

    };


    /* ═══════════════════════════════════════
       BUILT-IN LOCAL PROVIDER
    ═══════════════════════════════════════ */

    this.localProvider =
      new VentronLocalProvider(
        config
      );

    this.registerProvider(
      'local',
      this.localProvider
    );

    this.setDefaultProvider(
      'local'
    );
  }


  /* ═══════════════════════════════════════
     INITIALIZE
  ═══════════════════════════════════════ */

  async initialize() {

    if (this.state.initialized) {
      return;
    }


    for (
      const [name, provider]
      of this.providers
    ) {

      if (
        provider &&
        typeof provider.initialize === 'function'
      ) {

        await provider.initialize();
      }

    }


    this.state.initialized = true;
    this.state.stopped = false;


    return {
      success: true,
      status: 'initialized',
      provider:
        this.defaultProvider
    };
  }


  /* ═══════════════════════════════════════
     START
  ═══════════════════════════════════════ */

  async start() {

    if (!this.state.initialized) {
      await this.initialize();
    }

    if (this.state.started) {
      return;
    }


    for (
      const [name, provider]
      of this.providers
    ) {

      if (
        provider &&
        typeof provider.start === 'function'
      ) {

        await provider.start();
      }

    }


    this.state.started = true;
    this.state.stopped = false;


    this.emit(
      'started'
    );


    return {
      success: true,
      status: 'online',
      provider:
        this.defaultProvider
    };
  }


  /* ═══════════════════════════════════════
     REGISTER PROVIDER
  ═══════════════════════════════════════ */

  registerProvider(
    name,
    provider
  ) {

    const providerName =
      String(name || '')
        .trim()
        .toLowerCase();


    if (!providerName) {
      throw new Error(
        'AI provider name is required.'
      );
    }


    if (!provider) {
      throw new Error(
        `AI provider "${providerName}" is invalid.`
      );
    }


    this.providers.set(
      providerName,
      provider
    );


    if (!this.stats.providerRequests[providerName]) {
      this.stats.providerRequests[providerName] = 0;
    }


    if (!this.stats.providerFailures[providerName]) {
      this.stats.providerFailures[providerName] = 0;
    }


    return provider;
  }


  /* ═══════════════════════════════════════
     REMOVE PROVIDER
  ═══════════════════════════════════════ */

  removeProvider(name) {

    const providerName =
      String(name || '')
        .trim()
        .toLowerCase();


    if (
      providerName === this.defaultProvider
    ) {

      throw new Error(
        'Cannot remove the default AI provider.'
      );
    }


    return this.providers.delete(
      providerName
    );
  }


  /* ═══════════════════════════════════════
     GET PROVIDER
  ═══════════════════════════════════════ */

  getProvider(name) {

    const providerName =
      String(
        name ||
        this.defaultProvider ||
        ''
      )
        .trim()
        .toLowerCase();


    return this.providers.get(
      providerName
    ) || null;
  }


  /* ═══════════════════════════════════════
     SET DEFAULT PROVIDER
  ═══════════════════════════════════════ */

  setDefaultProvider(name) {

    const providerName =
      String(name || '')
        .trim()
        .toLowerCase();


    if (!providerName) {
      throw new Error(
        'Default AI provider is required.'
      );
    }


    if (
      !this.providers.has(providerName)
    ) {

      throw new Error(
        `AI provider "${providerName}" is not registered.`
      );
    }


    this.defaultProvider =
      providerName;


    return providerName;
  }


  /* ═══════════════════════════════════════
     GENERATE RESPONSE
  ═══════════════════════════════════════ */

  async generate(input = {}) {

    this.stats.requests++;


    const message =
      typeof input === 'string'
        ? input
        : (
            input.message ||
            input.text ||
            ''
          );


    if (!String(message).trim()) {

      this.stats.failures++;

      return {
        success: false,
        error: 'AI_MESSAGE_EMPTY'
      };
    }


    const providerName =
      String(
        input.provider ||
        this.defaultProvider ||
        'local'
      )
        .trim()
        .toLowerCase();


    const provider =
      this.getProvider(
        providerName
      );


    if (!provider) {

      this.stats.failures++;

      if (
        !this.stats.providerFailures[providerName]
      ) {

        this.stats.providerFailures[providerName] = 0;
      }

      this.stats.providerFailures[
        providerName
      ]++;


      return {
        success: false,
        error: 'AI_PROVIDER_NOT_FOUND',
        provider: providerName
      };
    }


    if (
      !this.stats.providerRequests[providerName]
    ) {

      this.stats.providerRequests[
        providerName
      ] = 0;
    }


    this.stats.providerRequests[
      providerName
    ]++;


    try {

      let result;


      /*
       * Preferred provider method:
       * generate()
       */

      if (
        typeof provider.generate === 'function'
      ) {

        result =
          await provider.generate({

            ...input,

            message,

            context:
              input.context || '',

            history:
              input.history || [],

            userId:
              input.userId || null,

            threadId:
              input.threadId || null,

            metadata:
              input.metadata || {}

          });

      }


      /*
       * Compatibility method:
       * chat()
       */

      else if (
        typeof provider.chat === 'function'
      ) {

        result =
          await provider.chat({

            ...input,

            message,

            context:
              input.context || '',

            history:
              input.history || [],

            userId:
              input.userId || null,

            threadId:
              input.threadId || null,

            metadata:
              input.metadata || {}

          });

      }


      else {

        throw new Error(
          `Provider "${providerName}" has no generate/chat method.`
        );
      }


      this.stats.responses++;


      this.emit(
        'response',
        {
          provider:
            providerName,

          input,

          result
        }
      );


      return {

        success:
          result?.success !== false,

        provider:
          providerName,

        response:
          result?.response ??
          result?.text ??
          result?.message ??
          String(result ?? ''),

        raw:
          result
      };


    } catch (error) {

      this.stats.failures++;


      this.stats.providerFailures[
        providerName
      ]++;


      this.emit(
        'error',
        error
      );


      return {

        success: false,

        error:
          'AI_PROVIDER_ERROR',

        message:
          error.message,

        provider:
          providerName
      };
    }
  }


  /* ═══════════════════════════════════════
     CHAT ALIAS
  ═══════════════════════════════════════ */

  async chat(input = {}) {

    return this.generate(
      input
    );
  }


  /* ═══════════════════════════════════════
     STATUS
  ═══════════════════════════════════════ */

  getStatus() {

    const providerStatus = {};


    for (
      const [name, provider]
      of this.providers
    ) {

      try {

        if (
          provider &&
          typeof provider.getStatus === 'function'
        ) {

          providerStatus[name] =
            provider.getStatus();

        } else {

          providerStatus[name] = {
            name,
            available: true
          };
        }

      } catch (error) {

        providerStatus[name] = {
          name,
          available: false,
          error:
            error.message
        };
      }
    }


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

      providerStatus,

      stats: {
        ...this.stats,

        providerRequests: {
          ...this.stats.providerRequests
        },

        providerFailures: {
          ...this.stats.providerFailures
        }
      }
    };
  }


  /* ═══════════════════════════════════════
     STOP
  ═══════════════════════════════════════ */

  async stop() {

    if (!this.state.started) {
      return;
    }


    for (
      const [name, provider]
      of this.providers
    ) {

      try {

        if (
          provider &&
          typeof provider.stop === 'function'
        ) {

          await provider.stop();
        }

      } catch (error) {

        this.stats.providerFailures[
          name
        ]++;

      }
    }


    this.state.started = false;
    this.state.stopped = true;


    this.emit(
      'stopped'
    );


    return {
      success: true,
      status: 'stopped'
    };
  }
}


module.exports =
  VentronAIEngine;
