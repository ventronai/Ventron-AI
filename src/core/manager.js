/**
 * ╔══════════════════════════════════════════════════╗
 * ║                 VENTRON AI CORE                 ║
 * ║          NEXT-GENERATION BOT FRAMEWORK          ║
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

const VentronResponseEngine =
  require('../response/engine');

const VentronPlatformManager =
  require('../platform/manager');

const VentronMessengerAdapter =
  require('../platform/messenger');

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

    this.commandEngine =
      new CommandEngine(config);

    this.eventGateway =
      new VentronEventGateway(config);

    this.messageRouter =
      new VentronMessageRouter(config);

    this.aiService =
      new VentronAIService(config);

    this.responseEngine =
      new VentronResponseEngine(config);

    this.platformManager =
      new VentronPlatformManager(config);

    this.messenger =
      new VentronMessengerAdapter(config);

    this.platformManager.register(
      'messenger',
      this.messenger
    );

    this.connectEventPipeline();
    this.connectPlatformPipeline();
  }

  // ═══════════════════════════════════════════════
  // 🔗 INTERNAL EVENT PIPELINE
  // ═══════════════════════════════════════════════

  connectEventPipeline() {

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

    // ═════════════════════════════════════════
    // 🧠 CHAT → AI → RESPONSE
    // ═════════════════════════════════════════

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

          if (!result.success) {

            this.emit(
              'aiResponse',
              {
                event,
                result,
                response: null
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

          // Messenger response
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

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );

    // ═════════════════════════════════════════
    // ⌨️ COMMAND → ENGINE → RESPONSE
    // ═════════════════════════════════════════

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

          let response = null;

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

          // Messenger response
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

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🌐 PLATFORM PIPELINE
  // ═══════════════════════════════════════════════

  connectPlatformPipeline() {

    this.messenger.on(
      'event',
      async (event) => {

        try {

          await this.eventGateway.receive(
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

    this.messenger.on(
      'error',
      (error) => {

        this.emit(
          'pipelineError',
          error
        );
      }
    );

    this.platformManager.on(
      'sent',
      (data) => {

        this.emit(
          'platformResponse',
          data
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🧩 MODULE SYSTEM
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

    if (
      this.modules.has(name)
    ) {

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

 
