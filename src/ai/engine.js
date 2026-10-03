/**
 * ╔══════════════════════════════════════════════════╗
 * ║                  VENTRON AI ENGINE             ║
 * ║            AI PROVIDER CONTROL SYSTEM           ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter =
  require('events');


class VentronAIEngine extends EventEmitter {

  constructor(config) {

    super();

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config =
      config;

    this.state = {

      initialized:
        false,

      started:
        false,

      stopped:
        false
    };


    this.providers =
      new Map();

    this.defaultProvider =
      null;


    this.stats = {

      requests:
        0,

      responses:
        0,

      failures:
        0
    };
  }


  // ═══════════════════════════════════════════
  // 🚀 INITIALIZE
  // ═══════════════════════════════════════════

  initialize() {

    if (
      this.state.initialized
    ) {
      return;
    }

    this.state.initialized =
      true;

    this.state.stopped =
      false;


    return {

      success:
        true,

      status:
        'initialized'
    };
  }


  // ═══════════════════════════════════════════
  // ⚡ START
  // ═══════════════════════════════════════════

  async start() {

    if (
      !this.state.initialized
    ) {
      this.initialize();
    }

    if (
      this.state.started
    ) {
      return;
    }


    for (
      const [
        name,
        provider
      ] of this.providers
    ) {

      try {

        if (
          typeof provider.start ===
          'function'
        ) {

          await provider.start();
        }

      } catch (error) {

        this.emit(
          'providerError',
          {
            name,
            error
          }
        );
      }
    }


    this.state.started =
      true;

    this.state.stopped =
      false;


    return {

      success:
        true,

      status:
        'online'
    };
  }


  // ═══════════════════════════════════════════
  // 🔌 REGISTER PROVIDER
  // ═══════════════════════════════════════════

  registerProvider(
    name,
    provider
  ) {

    if (
      !name ||
      typeof name !== 'string'
    ) {

      throw new TypeError(
        'AI provider name must be a string.'
      );
    }


    if (
      !provider ||
      typeof provider.generate !==
      'function'
    ) {

      throw new TypeError(
        `AI provider "${name}" must implement generate().`
      );
    }


    this.providers.set(
      name,
      provider
    );


    if (
      !this.defaultProvider
    ) {

      this.defaultProvider =
        name;
    }


    this.emit(
      'providerRegistered',
      {
        name
      }
    );


    return true;
  }


  // ═══════════════════════════════════════════
  // ⭐ DEFAULT PROVIDER
  // ═══════════════════════════════════════════

  setDefaultProvider(
    name
  ) {

    if (
      !this.providers.has(name)
    ) {

      throw new Error(
        `AI provider "${name}" is not registered.`
      );
    }


    this.defaultProvider =
      name;


    return true;
  }


  // ═══════════════════════════════════════════
  // 🤖 GENERATE
  // ═══════════════════════════════════════════

  async generate(
    input = {}
  ) {

    this.stats.requests++;


    try {

      const providerName =
        input.provider ||
        this.defaultProvider;


      if (
        !providerName
      ) {

        this.stats.failures++;


        return {

          success:
            false,

          reason:
            'NO_AI_PROVIDER',

          response:
            'কোনো AI provider চালু নেই।'
        };
      }


      const provider =
        this.providers.get(
          providerName
        );


      if (
        !provider
      ) {

        this.stats.failures++;


        return {

          success:
            false,

          reason:
            'PROVIDER_NOT_FOUND',

          provider:
            providerName
        };
      }


      // ═════════════════════════════════════════
      // 🧠 NORMALIZE MEMORY CONTEXT
      // ═════════════════════════════════════════

      const context =
        Array.isArray(
          input.context
        )
          ? input.context
          : [];


      const history =
        Array.isArray(
          input.history
        )
          ? input.history
          : context;


      // ═════════════════════════════════════════
      // 🚀 SEND TO PROVIDER
      // ═════════════════════════════════════════

      const result =
        await provider.generate({

          message:
            input.message || '',

          user:
            input.user || null,

          thread:
            input.thread || null,

          userId:
            input.userId || null,

          threadId:
            input.threadId || null,

          context,

          history,

          metadata:
            input.metadata || {}
        });


      let response;


      if (
        typeof result === 'string'
      ) {

        response =
          result;

      } else if (
        result &&
        typeof result.response ===
        'string'
      ) {

        response =
          result.response;

      } else if (
        result &&
        typeof result.text ===
        'string'
      ) {

        response =
          result.text;

      } else {

        response =
          '';
      }


      if (!response) {

        this.stats.failures++;


        return {

          success:
            false,

          reason:
            'EMPTY_AI_RESPONSE',

          provider:
            providerName
        };
      }


      this.stats.responses++;


      this.emit(
        'response',
        {

          provider:
            providerName,

          response
        }
      );


      return {

        success:
          true,

        response,

        provider:
          providerName
      };

    } catch (error) {

      this.stats.failures++;


      this.emit(
        'error',
        error
      );


      return {

        success:
          false,

        reason:
          'AI_GENERATION_ERROR',

        error:
          error.message,

        response:
          ''
      };
    }
  }


  // ═══════════════════════════════════════════
  // 💬 CHAT COMPATIBILITY
  // ═══════════════════════════════════════════

  async chat(
    input = {}
  ) {

    return this.generate(
      input
    );
  }


  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

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

      providerCount:
        this.providers.size,

      stats:
        {
          ...this.stats
        }
    };
  }


  // ═══════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════

  async stop() {

    if (
      !this.state.started
    ) {
      return;
    }


    for (
      const [
        name,
        provider
      ] of this.providers
    ) {

      try {

        if (
          typeof provider.stop ===
          'function'
        ) {

          await provider.stop();
        }

      } catch (error) {

        this.emit(
          'providerError',
          {
            name,
            error
          }
        );
      }
    }


    this.state.started =
      false;

    this.state.stopped =
      true;
  }
}


module.exports =
  VentronAIEngine;
