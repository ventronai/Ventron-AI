/**
 * ╔══════════════════════════════════════════════════╗
 * ║                 VENTRON AI CORE                 ║
 * ║            CENTRAL CONTROL MANAGER              ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter =
  require('events');

const CommandEngine =
  require('../commands/engine');

const VentronEventGateway =
  require('../events/gateway');

const VentronMessageRouter =
  require('../events/router');

const VentronAIService =
  require('../ai/service');

const VentronResponseEngine =
  require('../response/engine');

const VentronPlatformManager =
  require('../platform/manager');

const VentronMessengerAdapter =
  require('../platform/messenger');

const VentronSelfTest =
  require('./selftest');

const VentronLogger =
  require('./logger');


class VentronCore
  extends EventEmitter {

  constructor(config) {

    super();

    if (
      !config ||
      !config.bot
    ) {
      throw new Error(
        'Valid Ventron configuration is required.'
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
        false,

      startTime:
        null
    };

    this.modules =
      new Map();


    // ═══════════════════════════════════════════
    // 📝 LOGGER
    // ═══════════════════════════════════════════

    this.logger =
      new VentronLogger(
        config
      );


    // ═══════════════════════════════════════════
    // ⚡ CORE SERVICES
    // ═══════════════════════════════════════════

    this.commandEngine =
      new CommandEngine(
        config
      );

    this.eventGateway =
      new VentronEventGateway(
        config
      );

    this.messageRouter =
      new VentronMessageRouter(
        config
      );

    this.aiService =
      new VentronAIService(
        config
      );

    this.responseEngine =
      new VentronResponseEngine(
        config
      );

    this.platformManager =
      new VentronPlatformManager(
        config
      );

    this.messenger =
      new VentronMessengerAdapter(
        config
      );

    this.selfTest =
      new VentronSelfTest(
        this
      );


    // ═══════════════════════════════════════════
    // 🔗 CONNECT CORE
    // ═══════════════════════════════════════════

    this.commandEngine.setCore(
      this
    );


    // ═══════════════════════════════════════════
    // 🌐 REGISTER PLATFORM
    // ═══════════════════════════════════════════

    this.platformManager.register(
      'messenger',
      this.messenger
    );


    // ═══════════════════════════════════════════
    // 🔌 PIPELINES
    // ═══════════════════════════════════════════

    this.connectEventPipeline();

    this.connectPlatformPipeline();


    this.logger.debug(
      'Ventron Core instance created.'
    );
  }


  // ═════════════════════════════════════════════
  // 🔀 EVENT PIPELINE
  // ═════════════════════════════════════════════

  connectEventPipeline() {

    this.eventGateway.on(
      'message',
      async (
        event
      ) => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.logger.error(
            'Message pipeline error.',
            {
              error:
                error.message
            }
          );

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );


    this.eventGateway.on(
      'command',
      async (
        event
      ) => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.logger.error(
            'Command pipeline error.',
            {
              error:
                error.message
            }
          );

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );


    this.messageRouter.on(
      'chat',
      async (
        data
      ) => {

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


          if (
            !result.success
          ) {

            this.logger.warn(
              'AI response failed.',
              {
                reason:
                  result.reason
              }
            );

            this.emit(
              'aiResponse',
              {
                event,
                result,
                response:
                  null
              }
            );

            return;
          }


          const response =
            this.responseEngine.normalize(
              result.response,
              {
                recipient:
                  event.user?.id,

                metadata: {

                  source:
                    event.source,

                  eventId:
                    event.id,

                  provider:
                    result.provider
                }
              }
            );


          this.emit(
            'aiResponse',
            {
              event,
              result,
              response
            }
          );


          if (
            event.source ===
              'messenger' &&
            response &&
            response.success !== false
          ) {

            await this.platformManager.send(
              'messenger',
              response
            );
          }

        } catch (error) {

          this.logger.error(
            'AI chat pipeline error.',
            {
              error:
                error.message
            }
          );

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );


    this.messageRouter.on(
      'command',
      async (
        data
      ) => {

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


          let response =
            null;


          if (
            result &&
            result.handled &&
            result.result
          ) {

            response =
              this.responseEngine.normalize(
                result.result,
                {
                  recipient:
                    event.user?.id,

                  metadata: {

                    source:
                      event.source,

                    eventId:
                      event.id,

                    command:
                      result.command
                  }
                }
              );
          }


          this.emit(
            'commandResponse',
            {
              event,
              result,
              response
            }
          );


          if (
            event.source ===
              'messenger' &&
            response &&
            response.success !== false
          ) {

            await this.platformManager.send(
              'messenger',
              response
            );
          }

        } catch (error) {

          this.logger.error(
            'Command pipeline error.',
            {
              error:
                error.message
            }
          );

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );
  }


  // ═════════════════════════════════════════════
  // 🌐 PLATFORM PIPELINE
  // ═════════════════════════════════════════════

  connectPlatformPipeline() {

    this.messenger.on(
      'event',
      async (
        event
      ) => {

        try {

          await this.eventGateway.receive(
            event
          );

        } catch (error) {

          this.logger.error(
            'Platform event error.',
            {
              error:
                error.message
            }
          );

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );


    this.messenger.on(
      'error',
      (
        error
      ) => {

        this.logger.error(
          error
        );

        this.emit(
          'pipelineError',
          error
        );
      }
    );


    this.platformManager.on(
      'sent',
      (
        data
      ) => {

        this.logger.debug(
          'Platform response sent.',
          {
            platform:
              data.platform
          }
        );

        this.emit(
          'platformResponse',
          data
        );
      }
    );
  }


  // ═════════════════════════════════════════════
  // 🧩 MODULE SYSTEM
  // ═════════════════════════════════════════════

  registerModule(
    name,
    module
  ) {

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

    if (
      this.modules.has(
        name
      )
    ) {

      throw new Error(
        `Module "${name}" is already registered.`
      );
    }

    this.modules.set(
      name,
      module
    );

    this.logger.info(
      `Module registered: ${name}`
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

    return this.modules.get(
      name
    );
  }


  hasModule(name) {

    return this.modules.has(
      name
    );
  }


  removeModule(name) {

    const removed =
      this.modules.delete(
        name
      );

    if (removed) {

      this.logger.info(
        `Module removed: ${name}`
      );

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


  // ═════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═════════════════════════════════════════════

  initialize() {

    if (
      this.state.initialized
    ) {

      return;
    }

    this.logger.start();

    this.logger.info(
      'Initializing Ventron Core...'
    );


    const commandStatus =
      this.commandEngine.initialize();

    this.eventGateway.initialize();

    this.messageRouter.initialize();

    this.aiService.initialize();

    this.responseEngine.initialize();

    this.platformManager.initialize();


    this.state.initialized =
      true;


    this.logger.info(
      'Ventron Core initialized.',
      {
        commands:
          commandStatus.loaded.length,

        platforms:
          this.platformManager.list()
      }
    );


    this.emit(
      'initialized',
      {

        bot:
          this.config.bot.name,

        version:
          this.config.bot.version,

        commands:
          commandStatus.loaded.map(
            command =>
              command.name
          ),

        platforms:
          this.platformManager.list()
      }
    );
  }


  // ═════════════════════════════════════════════
  // 🚀 START
  // ═════════════════════════════════════════════

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


    this.state.started =
      true;

    this.state.stopped =
      false;

    this.state.startTime =
      Date.now();


    this.logger.info(
      'Starting Ventron Core...'
    );


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


    await this.eventGateway.start();

    await this.messageRouter.start();

    await this.aiService.start();

    await this.responseEngine.start();

    await this.platformManager.start();


    for (
      const [
        name,
        module
      ] of this.modules
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

        this.logger.info(
          `Module started: ${name}`
        );

        this.emit(
          'moduleStarted',
          name
        );

      } catch (error) {

        this.logger.error(
          `Module "${name}" failed to start.`,
          {
            error:
              error.message
          }
        );

        this.emit(
          'moduleError',
          {
            name,
            error
          }
        );
      }
    }


    this.logger.info(
      'Ventron Core started successfully.'
    );


    this.emit(
      'started',
      {
        timestamp:
          new Date().toISOString()
      }
    );
  }


  // ═════════════════════════════════════════════
  // 🧪 SELF TEST
  // ═════════════════════════════════════════════

  async runSelfTest() {

    if (
      !this.state.started
    ) {

      return {
        success:
          false,

        reason:
          'CORE_OFFLINE'
      };
    }

    return this.selfTest.runAll();
  }


  // ═════════════════════════════════════════════
  // 📡 EVENT
  // ═════════════════════════════════════════════

  async processEvent(
    event
  ) {

    return this.eventGateway.receive(
      event
    );
  }


  async receiveFromPlatform(
    platform,
    payload
  ) {

    return this.platformManager.receive(
      platform,
      payload
    );
  }


  async sendToPlatform(
    platform,
    response
  ) {

    return this.platformManager.send(
      platform,
      response
    );
  }


  // ═════════════════════════════════════════════
  // 💬 CHAT
  // ═════════════════════════════════════════════

  async chat(input) {

    const result =
      await this.aiService.chat(
        input
      );


    if (
      !result ||
      !result.success
    ) {

      return result;
    }


    return {

      ...result,

      response:
        this.responseEngine.normalize(
          result.response,
          {
            recipient:
              input?.userId ||
              input?.user?.id ||
              null
          }
        )
    };
  }


  // ═════════════════════════════════════════════
  // 🛑 STOP
  // ═════════════════════════════════════════════

  async stop() {

    if (
      !this.state.started ||
      this.state.stopped
    ) {

      return;
    }


    this.logger.info(
      'Stopping Ventron Core...'
    );


    const modules =
      Array.from(
        this.modules.entries()
      ).reverse();


    for (
      const [
        name,
        module
      ] of modules
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

        this.logger.error(
          `Module "${name}" stop error.`,
          {
            error:
              error.message
          }
        );

        this.emit(
          'moduleError',
          {
            name,
            error
          }
        );
      }
    }


    await this.platformManager.stop();

    await this.responseEngine.stop();

    await this.aiService.stop();

    await this.messageRouter.stop();

    await this.eventGateway.stop();

    await this.commandEngine.stop();


    this.state.started =
      false;

    this.state.stopped =
      true;


    this.logger.info(
      'Ventron Core stopped.'
    );


    this.emit(
      'stopped',
      {
        timestamp:
          new Date().toISOString()
      }
    );


    this.logger.stop();
  }


  // ═════════════════════════════════════════════
  // 📊 STATUS
  // ═════════════════════════════════════════════

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

      logger:
        this.logger.getStatus(),

      commandEngine:
        this.commandEngine.getStatus(),

      eventGateway:
        this.eventGateway.getStatus(),

      messageRouter:
        this.messageRouter.getStatus(),

      ai:
        this.aiService.getStatus(),

      response:
        this.responseEngine.getStatus(),

      platforms:
        this.platformManager.getStatus(),

      selfTest:
        this.selfTest.getStatus(),

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
