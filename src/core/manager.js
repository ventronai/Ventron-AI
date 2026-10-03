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
           
