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

    this.connectEventPipeline();
  }

  // ═══════════════════════════════════════════════
  // 🔗 EVENT PIPELINE
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

        } catch (error) {

          this.emit(
            'pipelineError',
            error
          );
        }
      }
    );

    // ═════════════════════════════════════════
    // ⌨️ COMMAND → COMMAND ENGINE → RESPONSE
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
  // 🧩 MODULE SYSTEM
  // ═══════════════════════════════════════════════

  registerModule(name, module) {

    if (
      !name ||
      typeof
