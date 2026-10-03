/**
 * ╔══════════════════════════════════════════════════╗
 * ║                VENTRON AI CORE                  ║
 * ║          CENTRAL SYSTEM CONTROLLER              ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

const config = require('../../config');

const VentronLogger = require('./logger');
const VentronSecurityManager = require('../security/manager');
const VentronStorageManager = require('../storage/manager');
const VentronProfileManager = require('../storage/profile');

const VentronWebhookServer = require('../webhook/server');
const VentronWebhookTester = require('../webhook/test');

const VentronCommandEngine = require('../commands/engine');
const VentronEventGateway = require('../events/gateway');
const VentronMessageRouter = require('../events/router');

const VentronAIService = require('../ai/service');
const VentronResponseEngine = require('../response/engine');

const VentronPlatformManager = require('../platform/manager');
const VentronMessengerAdapter = require('../platform/messenger');

const VentronSelfTest = require('./selftest');


class VentronCore extends EventEmitter {

  constructor() {

    super();

    this.config = config;

    this.state = {
      initialized: false,
      started: false,
      stopped: false
    };


    /* ═══════════════════════════════════════
       CORE SERVICES
    ═══════════════════════════════════════ */

    this.logger =
      new VentronLogger(config);

    this.security =
      new VentronSecurityManager(config);

    this.storage =
      new VentronStorageManager(config);

    this.profile =
      new VentronProfileManager(
        this.storage
      );


    /* ═══════════════════════════════════════
       WEBHOOK
    ═══════════════════════════════════════ */

    this.webhook =
      new VentronWebhookServer(
        config,
        this
      );

    this.webhookTester =
      new VentronWebhookTester(
        this
      );


    /* ═══════════════════════════════════════
       COMMAND / EVENT SYSTEM
    ═══════════════════════════════════════ */

    this.commandEngine =
      new VentronCommandEngine(config);

    this.eventGateway =
      new VentronEventGateway(config);

    this.messageRouter =
      new VentronMessageRouter(config);


    /* ═══════════════════════════════════════
       AI SYSTEM
    ═══════════════════════════════════════ */

    this.aiService =
      new VentronAIService(config);

    this.aiService.setCore(this);


    /* ═══════════════════════════════════════
       RESPONSE SYSTEM
    ═══════════════════════════════════════ */

    this.responseEngine =
      new VentronResponseEngine(config);


    /* ═══════════════════════════════════════
       PLATFORM SYSTEM
    ═══════════════════════════════════════ */

    this.platformManager =
      new VentronPlatformManager(config);

    this.messenger =
      new VentronMessengerAdapter(config);


    this.platformManager.register(
      'messenger',
      this.messenger
    );


    /* ═══════════════════════════════════════
       SELF TEST
    ═══════════════════════════════════════ */

    this.selfTest =
      new VentronSelfTest(this);


    /* ═══════════════════════════════════════
       INTERNAL CONNECTIONS
    ═══════════════════════════════════════ */

    this.commandEngine.setCore(this);

    this.connectPipelines();
  }


  /* ═══════════════════════════════════════
     PIPELINE CONNECTION
  ═══════════════════════════════════════ */

  connectPipelines() {

    /*
     * Platform → Event Gateway
     */

    this.platformManager.on(
      'event',
      async (event) => {

        try {

          this.trackProfile(event);

          await this.eventGateway.receive(
            event
          );

        } catch (error) {

          this.logger.error(
            `Platform event error: ${error.message}`
          );

        }

      }
    );


    /*
     * Event Gateway → Message Router
     */

    this.eventGateway.on(
      'message',
      async (event) => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.logger.error(
            `Message routing error: ${error.message}`
          );

        }

      }
    );


    /*
     * Command → Command Engine
     */

    this.eventGateway.on(
      'command',
      async (event) => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.logger.error(
            `Command routing error: ${error.message}`
          );

        }

      }
    );


    /*
     * Event → Router
     */

    this.eventGateway.on(
      'event',
      async (event) => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.logger.error(
            `Event routing error: ${error.message}`
          );

        }

      }
    );


    /*
     * Router → Command
     */

    this.messageRouter.on(
      'command',
      async (event) => {

        try {

          await this.commandEngine.execute(
            event.command,
            event.args || [],
            event
          );

        } catch (error) {

          this.logger.error(
            `Command execution error: ${error.message}`
          );

        }

      }
    );


    /*
     * Router → AI Chat
     */

    this.messageRouter.on(
      'chat',
      async (event) => {

        try {

          const result =
            await this.aiService.chat({

              message:
                event.text ||
                event.message ||
                '',

              userId:
                event.userId ||
                event.senderId ||
                event.sender?.id,

              threadId:
                event.threadId ||
                event.thread?.id,

              source:
                event.source ||
                'internal',

              metadata:
                event.metadata ||
                {}

            });


          const response =
            this.responseEngine.normalize(
              result
            );


          if (
            event.platform &&
            event.threadId
          ) {

            await this.sendToPlatform(
              event.platform,
              event.threadId,
              response
            );

          }

          this.emit(
            'aiResponse',
            {
              event,
              result,
              response
            }
          );

        } catch (error) {

          this.logger.error(
            `AI chat error: ${error.message}`
          );

        }

      }
    );
  }


  /* ═══════════════════════════════════════
     PROFILE TRACKING
  ═══════════════════════════════════════ */

  trackProfile(event = {}) {

    try {

      const userId =
        event.userId ||
        event.senderId ||
        event.sender?.id ||
        event.user?.id;

      const threadId =
        event.threadId ||
        event.thread?.id ||
        event.conversationId;

      const source =
        event.source ||
        event.platform ||
        'unknown';


      /*
       * USER PROFILE
       */

      if (userId) {

        this.profile.touchUser(
          userId,
          {

            name:
              event.user?.name ||
              event.sender?.name ||
              event.name ||
              null,

            firstName:
              event.user?.firstName ||
              event.sender?.firstName ||
              null,

            lastName:
              event.user?.lastName ||
              event.sender?.lastName ||
              null,

            platform:
              source,

            metadata:
              {
                lastMessageAt:
                  new Date().toISOString()
              }

          }
        );

      }


      /*
       * THREAD PROFILE
       */

      if (threadId) {

        this.profile.touchThread(
          threadId,
          {

            platform:
              source,

            userId:
              userId || null,

            type:
              event.thread?.type ||
              'conversation',

            name:
              event.thread?.name ||
              null,

            metadata:
              {
                lastEventType:
                  event.type ||
                  'message',

                lastActivityAt:
                  new Date().toISOString()
              }

          }
        );

      }

      return true;

    } catch (error) {

      this.logger.error(
        `Profile tracking error: ${error.message}`
      );

      return false;
    }
  }


  /* ═══════════════════════════════════════
     INITIALIZE
  ═══════════════════════════════════════ */

  async initialize() {

    if (this.state.initialized) {
      return;
    }


    this.logger.initialize();


    this.security.initialize();


    this.storage.initialize();


    await this.commandEngine.initialize();


    await this.eventGateway.initialize();


    await this.messageRouter.initialize();


    await this.aiService.initialize();


    await this.responseEngine.initialize();


    await this.platformManager.initialize();


    await this.webhook.initialize();


    this.state.initialized = true;
    this.state.stopped = false;


    this.logger.info(
      'Ventron Core initialized.'
    );


    return {
      success: true,
      status: 'initialized'
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


    this.security.start();


    await this.storage.start();


    await this.commandEngine.start();


    await this.eventGateway.start();


    await this.messageRouter.start();


    await this.aiService.start();


    await this.responseEngine.start();


    await this.platformManager.start();


    await this.webhook.start();


    this.state.started = true;
    this.state.stopped = false;


    this.logger.start();


    this.logger.info(
      'Ventron Core started.'
    );


    this.emit(
      'started'
    );


    return {
      success: true,
      status: 'online'
    };
  }


  /* ═══════════════════════════════════════
     RECEIVE FROM PLATFORM
  ═══════════════════════════════════════ */

  async receiveFromPlatform(
    platform,
    payload
  ) {

    if (!platform) {
      throw new Error(
        'Platform is required.'
      );
    }


    const adapter =
      this.platformManager.get(
        platform
      );


    if (!adapter) {
      throw new Error(
        `Platform not found: ${platform}`
      );
    }


    const event =
      adapter.normalize(
        payload
      );


    this.trackProfile(event);


    return this.eventGateway.receive(
      event
    );
  }


  /* ═══════════════════════════════════════
     SEND TO PLATFORM
  ═══════════════════════════════════════ */

  async sendToPlatform(
    platform,
    threadId,
    response
  ) {

    if (!platform) {
      throw new Error(
        'Platform is required.'
      );
    }


    const adapter =
      this.platformManager.get(
        platform
      );


    if (!adapter) {
      throw new Error(
        `Platform not found: ${platform}`
      );
    }


    return adapter.send(
      threadId,
      response
    );
  }


  /* ═══════════════════════════════════════
     INTERNAL CHAT
  ═══════════════════════════════════════ */

  async chat(input = {}) {

    return this.aiService.chat(
      input
    );
  }


  /* ═══════════════════════════════════════
     WEBHOOK TEST
  ═══════════════════════════════════════ */

  async runWebhookTest() {

    return this.webhookTester.runAll();
  }


  /* ═══════════════════════════════════════
     SELF TEST
  ═══════════════════════════════════════ */

  async runSelfTest() {

    return this.selfTest.runAll();
  }


  /* ═══════════════════════════════════════
     STATUS
  ═══════════════════════════════════════ */

  getStatus() {

    return {

      initialized:
        this.state.initialized,

      started:
        this.state.started,

      stopped:
        this.state.stopped,


      bot:
        this.config.bot,


      logger:
        this.logger.getStatus(),


      security:
        this.security.getStatus(),


      storage:
        this.storage.getStatus(),


      profile:
        this.profile.getStatus(),


      commands:
        this.commandEngine.getStatus(),


      events:
        this.eventGateway.getStatus(),


      router:
        this.messageRouter.getStatus(),


      ai:
        this.aiService.getStatus(),


      response:
        this.responseEngine.getStatus(),


      platforms:
        this.platformManager.getStatus(),


      webhook:
        this.webhook.getStatus()

    };
  }


  /* ═══════════════════════════════════════
     STOP
  ═══════════════════════════════════════ */

  async stop() {

    if (!this.state.started) {
      return;
    }


    try {

      await this.webhook.stop();


      await this.platformManager.stop();


      await this.responseEngine.stop();


      await this.aiService.stop();


      await this.messageRouter.stop();


      await this.eventGateway.stop();


      await this.commandEngine.stop();


      await this.storage.stop();


      this.security.stop();


      this.logger.info(
        'Ventron Core stopped.'
      );


      this.logger.stop();


      this.state.started = false;
      this.state.stopped = true;


      this.emit(
        'stopped'
      );


    } catch (error) {

      this.logger.error(
        `Core shutdown error: ${error.message}`
      );

      throw error;
    }
  }
}


module.exports =
  VentronCore;
