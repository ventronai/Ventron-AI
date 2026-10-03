/**
 * ╔══════════════════════════════════════════════════╗
 * ║                 VENTRON AI SERVICE             ║
 * ║          AI + MEMORY + STORAGE BRIDGE          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const VentronAIEngine =
  require('./engine');

const VentronAIMemory =
  require('./memory');


class VentronAIService {

  constructor(config) {

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
        false
    };


    // ═══════════════════════════════════════════
    // 🧠 AI ENGINE
    // ═══════════════════════════════════════════

    this.engine =
      new VentronAIEngine(
        config
      );


    // ═══════════════════════════════════════════
    // 💭 AI MEMORY
    // ═══════════════════════════════════════════

    this.memory =
      new VentronAIMemory(
        config
      );


    this.core =
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
  // 🔗 CORE CONNECTION
  // ═══════════════════════════════════════════

  setCore(core) {

    if (!core) {

      throw new Error(
        'Ventron Core instance is required.'
      );
    }

    this.core =
      core;


    // Connect persistent storage
    if (
      core.storage
    ) {

      this.memory.setStorage(
        core.storage
      );
    }


    return true;
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


    // Make sure storage is connected
    if (
      this.core?.storage &&
      !this.memory.storage
    ) {

      this.memory.setStorage(
        this.core.storage
      );
    }


    this.engine.initialize();

    this.memory.initialize();


    this.state.initialized =
      true;


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


    await this.engine.start();

    await this.memory.start();


    this.state.started =
      true;


    return {

      success:
        true,

      status:
        'online'
    };
  }


  // ═══════════════════════════════════════════
  // 🧠 CHAT
  // ═══════════════════════════════════════════

  async chat(input = {}) {

    this.stats.requests++;


    try {

      const message =
        String(
          input.message || ''
        ).trim();


      if (!message) {

        this.stats.failures++;

        return {

          success:
            false,

          reason:
            'EMPTY_MESSAGE',

          response:
            'কোনো মেসেজ পাওয়া যায়নি।'
        };
      }


      const userId =
        String(
          input.userId ||
          input.user?.id ||
          'unknown'
        );


      const threadId =
        String(
          input.threadId ||
          input.thread?.id ||
          'default'
        );


      // ═════════════════════════════════════════
      // 📚 LOAD PREVIOUS MEMORY
      // ═════════════════════════════════════════

      const context =
        this.memory.getContext(
          userId,
          threadId
        );


      // ═════════════════════════════════════════
      // 💾 SAVE USER MESSAGE
      // ═════════════════════════════════════════

      this.memory.addMessage(
        userId,
        threadId,
        'user',
        message,
        {
          source:
            input.source ||
            input.context?.source ||
            'unknown'
        }
      );


      // ═════════════════════════════════════════
      // 🤖 AI ENGINE
      // ═════════════════════════════════════════

      const result =
        await this.engine.chat({

          message,

          context,

          userId,

          threadId,

          user:
            input.user || null,

          thread:
            input.thread || null,

          metadata:
            input.metadata || {}
        });


      if (
        !result ||
        !result.success
      ) {

        this.stats.failures++;

        return {

          success:
            false,

          reason:
            result?.reason ||
            'AI_ENGINE_FAILED',

          response:
            result?.response ||
            'দুঃখিত, এই মুহূর্তে AI response তৈরি করা যাচ্ছে না।'
        };
      }


      const response =
        String(
          result.response || ''
        ).trim();


      // ═════════════════════════════════════════
      // 💾 SAVE AI RESPONSE
      // ═════════════════════════════════════════

      if (response) {

        this.memory.addMessage(
          userId,
          threadId,
          'assistant',
          response,
          {
            provider:
              result.provider ||
              null
          }
        );
      }


      this.stats.responses++;


      return {

        success:
          true,

        response,

        provider:
          result.provider ||
          null,

        userId,

        threadId,

        memory:
          this.memory.getStatus()
      };

    } catch (error) {

      this.stats.failures++;


      return {

        success:
          false,

        reason:
          'AI_SERVICE_ERROR',

        error:
          error.message,

        response:
          'AI service-এ একটি সমস্যা হয়েছে।'
      };
    }
  }


  // ═══════════════════════════════════════════
  // 💭 MEMORY ACCESS
  // ═══════════════════════════════════════════

  getMemory(
    userId,
    threadId
  ) {

    return this.memory.getMessages(
      userId,
      threadId
    );
  }


  clearMemory(
    userId,
    threadId
  ) {

    return this.memory.clearSession(
      userId,
      threadId
    );
  }


  clearAllMemory() {

    return this.memory.clearAll();
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

      engine:
        this.engine.getStatus(),

      memory:
        this.memory.getStatus(),

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


    await this.memory.stop();

    await this.engine.stop();


    this.state.started =
      false;
  }
}


module.exports =
  VentronAIService;
