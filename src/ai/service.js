/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON AI SERVICE                ║
 * ║        Conversation Orchestration Layer         ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const VentronAIEngine =
  require('./engine');

const VentronMemory =
  require('./memory');

const VentronLocalProvider =
  require('./providers/local');

class VentronAIService {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    // ═══════════════════════════════════════════
    // 🧠 AI ENGINE
    // ═══════════════════════════════════════════

    this.engine =
      new VentronAIEngine(config);

    // ═══════════════════════════════════════════
    // 💾 MEMORY
    // ═══════════════════════════════════════════

    this.memory =
      new VentronMemory(config);

    // ═══════════════════════════════════════════
    // 🔌 LOCAL PROVIDER
    // ═══════════════════════════════════════════

    this.localProvider =
      new VentronLocalProvider();

    this.state = {
      initialized: false,
      started: false
    };
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.engine.initialize();

    this.engine.registerProvider(
      'local',
      this.localProvider
    );

    this.engine.setDefaultProvider(
      'local'
    );

    this.state.initialized = true;
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

    await this.engine.start();

    this.state.started = true;

    return {
      success: true,
      status: 'online'
    };
  }

  // ═══════════════════════════════════════════════
  // 💬 CHAT
  // ═══════════════════════════════════════════════

  async chat(input = {}) {

    if (!this.state.started) {
      return {
        success: false,
        response: null,
        reason: 'AI_SERVICE_OFFLINE'
      };
    }

    const userId =
      input.userId ||
      input.user?.id ||
      'unknown-user';

    const threadId =
      input.threadId ||
      input.thread?.id ||
      'default-thread';

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

    // ═══════════════════════════════════════════
    // 📚 PREVIOUS CONTEXT
    // ═══════════════════════════════════════════

    const history =
      this.memory.getHistory(
        userId,
        threadId
      );

    // ═══════════════════════════════════════════
    // 👤 SAVE USER MESSAGE
    // ═══════════════════════════════════════════

    this.memory.addMessage(
      userId,
      threadId,
      'user',
      message
    );

    // ═══════════════════════════════════════════
    // 🧠 AI GENERATION
    // ═══════════════════════════════════════════

    const result =
      await this.engine.generate({
        message,

        user:
          input.user || {
            id: userId
          },

        thread:
          input.thread || {
            id: threadId
          },

        history,

        context:
          input.context || {}
      });

    if (!result.success) {
      return result;
    }

    // ═══════════════════════════════════════════
    // 🤖 EXTRACT RESPONSE
    // ═══════════════════════════════════════════

    const generated =
      result.response;

    const responseText =
      typeof generated === 'string'
        ? generated
        : generated?.text;

    if (responseText) {

      this.memory.addMessage(
        userId,
        threadId,
        'assistant',
        responseText
      );
    }

    return {
      success: true,

      provider:
        result.provider,

      response:
        responseText || '',

      history:
        this.memory.getHistory(
          userId,
          threadId
        ),

      timestamp:
        result.timestamp
    };
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

      engine:
        this.engine.getStatus(),

      memory:
        this.memory.getStatus(),

      provider:
        this.localProvider.getStatus()
    };
  }

  // ═══════════════════════════════════════════════
  // 🧹 CLEAR MEMORY
  // ═══════════════════════════════════════════════

  clearMemory(
    userId,
    threadId
  ) {

    return this.memory.clear(
      userId,
      threadId
    );
  }

  // ═══════════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════════

  async stop() {

    if (!this.state.started) {
      return;
    }

    await this.engine.stop();

    this.state.started = false;
  }
}

module.exports =
  VentronAIService;
