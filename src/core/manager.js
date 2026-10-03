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

const CommandEngine =
  require('../commands/engine');

const VentronEventGateway =
  require('../events/gateway');

const VentronMessageRouter =
  require('../events/router');

const VentronAIService =
  require('../ai/service');

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

    // ═══════════════════════════════════════════
    // ⌨️ COMMAND ENGINE
    // ═══════════════════════════════════════════

    this.commandEngine =
      new CommandEngine(config);

    // ═══════════════════════════════════════════
    // 📡 EVENT GATEWAY
    // ═══════════════════════════════════════════

    this.eventGateway =
      new VentronEventGateway(config);

    // ═══════════════════════════════════════════
    // 🔀 MESSAGE ROUTER
    // ═══════════════════════════════════════════

    this.messageRouter =
      new VentronMessageRouter(config);

    // ═══════════════════════════════════════════
    // 🧠 AI SERVICE
    // ═══════════════════════════════════════════

    this.aiService =
      new VentronAIService(config);

    // ═══════════════════════════════════════════
    // 🔗 INTERNAL EVENT CONNECTIONS
    // ═══════════════════════════════════════════

    this.connectEventPipeline();
  }

  // ═══════════════════════════════════════════════
  // 🔗 CONNECT EVENT PIPELINE
  // ═══════════════════════════════════════════════

  connectEventPipeline() {

    // Event Gateway → Router
    this.eventGateway.on(
      'message',
      async (event) => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );

    this.eventGateway.on(
      'command',
      async (event) => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );

    // Router → AI Service
    this.messageRouter.on(
      'chat',
      async (data) => {

        try {

          const event =
            data.event;

          const result =
            await this.aiService.chat({

              message:
                event.message,

              user:
                event.user,

              thread:
                event.thread,

              userId:
                event.user?.id,

              threadId:
                event.thread?.id,

              context: {
                source:
                  event.source,

                eventId:
                  event.id
              }
            });

          this.emit(
            'aiResponse',
            {
              event,
              result
            }
          );

        } catch (error) {

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );

    // Router → Command Engine
    this.messageRouter.on(
      'command',
      async (data) => {

        try {

          const event =
            data.event;

          const result =
            await this.commandEngine.process(
              event.message,
              {
                user:
                  event.user,

                thread:
                  event.thread,

                event
              }
            );

          this.emit(
            'commandResponse',
            {
              event,
              result
            }
          );

        } catch (error) {

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 📦 MODULE SYSTEM
  // ═══════════════════════════════════════════════

  registerModule(name, module) {

    if (
      !name ||
      typeof name !== 'string'
    ) {
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

    this.modules.set(
      name,
      module
    );

    this.emit(
      'moduleRegistered',
      {
        name,
        module
      }
    );

    return true;
  }

  getModule(name) {
    return this.modules.get(name);
  }

  hasModule(name) {
    return this.modules.has(name);
  }

  removeModule(name) {

    const removed =
      this.modules.delete(name);

    if (removed) {
      this.emit(
        'moduleRemoved',
        name
      );
    }

    return removed;
  }

  listModules() {
    return Array.from(
      this.modules.keys()
    );
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    const commandStatus =
      this.commandEngine.initialize();

    this.eventGateway.initialize();

    this.messageRouter.initialize();

    this.aiService.initialize();

    this.state.initialized = true;

    this.emit(
      'initialized',
      {
        bot:
          this.config.bot.name,

        version:
          this.config.bot.version,

        commands:
          commandStatus.loaded.map(
            command => command.name
          )
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
    this.state.startTime = Date.now();

    // ─────────────────────────────────────────
    // ⌨️ COMMAND ENGINE
    // ─────────────────────────────────────────

    await this.commandEngine.start();

    this.emit(
      'commandEngineStarted',
      {
        commands:
          this.commandEngine
            .handler
            .list()
      }
    );

    // ─────────────────────────────────────────
    // 📡 EVENT GATEWAY
    // ─────────────────────────────────────────

    await this.eventGateway.start();

    // ─────────────────────────────────────────
    // 🔀 MESSAGE ROUTER
    // ─────────────────────────────────────────

    await this.messageRouter.start();

    // ─────────────────────────────────────────
    // 🧠 AI SERVICE
    // ─────────────────────────────────────────

    await this.aiService.start();

    // ─────────────────────────────────────────
    // 🧩 CUSTOM MODULES
    // ─────────────────────────────────────────

    for (
      const [name, module]
      of this.modules
    ) {

      try {

        if (
          typeof module.start ===
          'function'
        ) {

          await module.start(
            this
          );
        }

        this.emit(
          'moduleStarted',
          name
        );

      } catch (error) {

        this.emit(
          'moduleError',
          {
            name,
            error
          }
        );

        console.error(
          `❌ Module "${name}" failed to start:`,
          error.message
        );
      }
    }

    this.emit(
      'started',
      {
        timestamp:
          new Date().toISOString()
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 📥 PROCESS EVENT
  // ═══════════════════════════════════════════════

  async processEvent(event) {

    return this.eventGateway.receive(
      event
    );
  }

  // ═══════════════════════════════════════════════
  // 💬 DIRECT CHAT
  // ═══════════════════════════════════════════════

  async chat(input) {

    return this.aiService.chat(
      input
    );
  }

  // ═══════════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════════

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

    for (
      const [name, module]
      of modules
    ) {

      try {

        if (
          typeof module.stop ===
          'function'
        ) {

          await module.stop(
            this
          );
        }

        this.emit(
          'moduleStopped',
          name
        );

      } catch (error) {

        this.emit(
          'moduleError',
          {
            name,
            error
          }
        );
      }
    }

    await this.aiService.stop();

    await this.messageRouter.stop();

    await this.eventGateway.stop();

    await this.commandEngine.stop();

    this.state.started = false;
    this.state.stopped = true;

    this.emit(
      'stopped',
      {
        timestamp:
          new Date().toISOString()
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {

      bot:
        this.config.bot.name,

      version:
        this.config.bot.version,

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

      eventGateway:
        this.eventGateway.getStatus(),

      messageRouter:
        this.messageRouter.getStatus(),

      ai:
        this.aiService.getStatus(),

      uptime:
        this.state.startTime
          ? Math.floor(
              (
                Date.now() -
                this.state.startTime
              ) / 1000
            )
          : 0
    };
  }
}

module.exports =
  VentronCore;
