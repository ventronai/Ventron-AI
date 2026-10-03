/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON CORE MANAGER              ║
 * ║          CENTRAL SYSTEM CONTROLLER             ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

const Logger = require('./logger');
const Security = require('../security/manager');
const Storage = require('../storage/manager');
const Profile = require('../storage/profile');

const WebhookServer = require('../webhook/server');
const WebhookTester = require('../webhook/test');

const CommandEngine = require('../commands/engine');
const EventGateway = require('../events/gateway');
const MessageRouter = require('../events/router');

const AIService = require('../ai/service');
const ResponseEngine = require('../response/engine');

const PlatformManager = require('../platform/manager');
const MessengerAdapter = require('../platform/messenger');

const SelfTest = require('./selftest');


class VentronCore extends EventEmitter {

  constructor(config = require('../../config')) {

    super();

    this.config = config;

    this.state = {
      initialized: false,
      started: false,
      stopped: false
    };


    /* ═══════════════════════════════════════
       CORE SYSTEMS
    ═══════════════════════════════════════ */

    this.logger =
      new Logger(config);

    this.security =
      new Security(config);

    this.storage =
      new Storage(config);

    this.profile =
      new Profile(
        this.storage
      );


    /* ═══════════════════════════════════════
       WEBHOOK
    ═══════════════════════════════════════ */

    this.webhook =
      new WebhookServer(
        config
      );

    this.webhookTester =
      new WebhookTester(
        this
      );


    /* ═══════════════════════════════════════
       EVENTS
    ═══════════════════════════════════════ */

    this.eventGateway =
      new EventGateway(
        config
      );

    this.messageRouter =
      new MessageRouter(
        config
      );


    /* ═══════════════════════════════════════
       COMMANDS
    ═══════════════════════════════════════ */

    this.commandEngine =
      new CommandEngine(
        config
      );


    /* ═══════════════════════════════════════
       AI
    ═══════════════════════════════════════ */

    this.aiService =
      new AIService(
        config
      );

    this.aiService.setCore(
      this
    );


    /* ═══════════════════════════════════════
       RESPONSE
    ═══════════════════════════════════════ */

    this.responseEngine =
      new ResponseEngine(
        config
      );


    /* ═══════════════════════════════════════
       PLATFORM
    ═══════════════════════════════════════ */

    this.platformManager =
      new PlatformManager(
        config
      );

    this.messenger =
      new MessengerAdapter(
        config
      );


    /* ═══════════════════════════════════════
       SELF TEST
    ═══════════════════════════════════════ */

    this.selfTest =
      new SelfTest(
        this
      );


    /* ═══════════════════════════════════════
       CONNECT COMPONENTS
    ═══════════════════════════════════════ */

    this.commandEngine.setCore(
      this
    );


    this.webhook.setCore(
      this
    );


    this.connectPipelines();

  }


  /* ═══════════════════════════════════════
     PIPELINES
  ═══════════════════════════════════════ */

  connectPipelines() {

    /*
     * Event Gateway → Router
     */

    this.eventGateway.on(
      'event',
      async event => {

        try {

          await this.messageRouter.route(
            event
          );

        } catch (error) {

          this.logger.error(
            'Message router error:',
            error
          );

        }

      }
    );


    /*
     * Platform → Core
     */

    this.platformManager.on(
      'event',
      async event => {

        try {

          await this.receiveFromPlatform(
            event.platform || 'unknown',
            event.payload || event
          );

        } catch (error) {

          this.logger.error(
            'Platform event error:',
            error
          );

        }

      }
    );


    /*
     * Router → Command
     */

    this.messageRouter.on(
      'command',
      async context => {

        try {

          await this.commandEngine.execute(
            context
          );

        } catch (error) {

          this.logger.error(
            'Command execution error:',
            error
          );

        }

      }
    );


    /*
     * Router → AI
     */

    this.messageRouter.on(
      'chat',
      async context => {

        try {

          const result =
            await this.aiService.chat(
              context
            );


          if (
            result &&
            result.success
          ) {

            this.emit(
              'response',
              result
            );

          }

        } catch (error) {

          this.logger.error(
            'AI pipeline error:',
            error
          );

        }

      }
    );


    /*
     * Command → Response
     */

    this.commandEngine.on(
      'response',
      response => {

        this.emit(
          'response',
          response
        );

      }
    );


    /*
     * Response → Platform
     */

    this.on(
      'response',
      async response => {

        try {

          if (
            !response ||
            !response.platform
          ) {
            return;
          }


          await this.platformManager.send(
            response.platform,
            response
          );

        } catch (error) {

          this.logger.error(
            'Response delivery error:',
            error
          );

        }

      }
    );

  }


  /* ═══════════════════════════════════════
     INITIALIZE
  ═══════════════════════════════════════ */

  async initialize() {

    if (
      this.state.initialized
    ) {

      return true;
    }


    await this.logger.initialize();

    await this.security.initialize();

    await this.storage.initialize();

    await this.profile.storage.initialize();

    await this.commandEngine.initialize();

    await this.eventGateway.initialize();

    await this.messageRouter.initialize();

    await this.aiService.initialize();

    await this.responseEngine.initialize();

    await this.platformManager.initialize();

    await this.messenger.initialize();

    await this.webhook.initialize();


    this.state.initialized =
      true;

    this.state.stopped =
      false;


    this.logger.info(
      'Ventron Core initialized.'
    );


    return true;
  }


  /* ═══════════════════════════════════════
     START
  ═══════════════════════════════════════ */

  async start() {

    if (
      !this.state.initialized
    ) {

      await this.initialize();
    }


    if (
      this.state.started
    ) {

      return true;
    }


    await this.logger.start();

    await this.security.start();

    await this.storage.start();

    await this.commandEngine.start();

    await this.eventGateway.start();

    await this.messageRouter.start();

    await this.aiService.start();

    await this.responseEngine.start();

    await this.platformManager.start();

    await this.messenger.start();

    await this.webhook.start();


    this.state.started =
      true;

    this.state.stopped =
      false;


    this.logger.info(
      'Ventron Core started.'
    );


    this.emit(
      'started'
    );


    return true;
  }


  /* ═══════════════════════════════════════
     RECEIVE FROM PLATFORM
  ═══════════════════════════════════════ */

  async receiveFromPlatform(
    platform,
    payload
  ) {

    if (
      !payload
    ) {

      return {
        success: false,
        error: 'EMPTY_PAYLOAD'
      };
    }


    const adapter =
      platform === 'messenger'
        ? this.messenger
        : null;


    let event =
      payload;


    if (
      adapter &&
      typeof adapter.normalize === 'function'
    ) {

      event =
        adapter.normalize(
          payload
        );
    }


    this.trackProfile(
      event
    );


    return this.eventGateway.receive(
      event
    );
  }


  /* ═══════════════════════════════════════
     PROFILE TRACKING
  ═══════════════════════════════════════ */

  trackProfile(
    event
  ) {

    if (
      !event
    ) {

      return;
    }


    const userId =
      event.userId ||
      event.senderId;


    const threadId =
      event.threadId ||
      event.conversationId;


    if (
      userId
    ) {

      this.profile.touchUser(
        userId,
        {
          name:
            event.userName,

          firstName:
            event.firstName,

          lastName:
            event.lastName,

          platform:
            event.platform || 'unknown'
        }
      );
    }


    if (
      threadId
    ) {

      this.profile.touchThread(
        threadId,
        {
          userId:
            userId || null,

          platform:
            event.platform || 'unknown'
        }
      );
    }

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

      name:
        this.config.bot.name,

      version:
        this.config.bot.version,

      state: {
        ...this.state
      },

      started:
        this.state.started,

      initialized:
        this.state.initialized,

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

      platform:
        this.platformManager.getStatus(),

      messenger:
        this.messenger.getStatus(),

      webhook:
        this.webhook.getStatus(),

      logger:
        this.logger.getStatus()

    };
  }


  /* ═══════════════════════════════════════
     STOP
  ═══════════════════════════════════════ */

  async stop() {

    if (
      this.state.stopped
    ) {

      return true;
    }


    try {

      await this.webhook.stop();

      await this.messenger.stop();

      await this.platformManager.stop();

      await this.responseEngine.stop();

      await this.aiService.stop();

      await this.messageRouter.stop();

      await this.eventGateway.stop();

      await this.commandEngine.stop();

      await this.storage.stop();

      await this.security.stop();

      await this.logger.stop();


      this.state.started =
        false;

      this.state.stopped =
        true;


      this.emit(
        'stopped'
      );


      return true;

    } catch (error) {

      this.logger.error(
        'Ventron shutdown error:',
        error
      );


      throw error;
    }
  }

}


module.exports =
  VentronCore;
