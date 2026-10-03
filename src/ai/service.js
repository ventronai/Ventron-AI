/**
 * ╔══════════════════════════════════════════════════╗
 * ║                VENTRON AI SERVICE              ║
 * ║        PROFILE + MEMORY + AI ENGINE            ║
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

    this.config = config;

    this.core = null;

    this.engine =
      new VentronAIEngine(config);

    this.memory =
      new VentronAIMemory(config);

    this.profile = null;

    this.state = {
      initialized: false,
      started: false,
      stopped: false
    };
  }


  /* ═══════════════════════════════════════
     CONNECT CORE
  ═══════════════════════════════════════ */

  setCore(core) {

    this.core = core;

    /*
     * Connect persistent storage
     * to AI Memory.
     */

    if (
      core &&
      core.storage
    ) {

      this.memory.setStorage(
        core.storage
      );
    }


    /*
     * Connect Profile Manager.
     */

    if (
      core &&
      core.profile
    ) {

      this.profile =
        core.profile;
    }


    return this;
  }


  /* ═══════════════════════════════════════
     INITIALIZE
  ═══════════════════════════════════════ */

  async initialize() {

    if (this.state.initialized) {
      return;
    }


    /*
     * Ensure storage connection.
     */

    if (
      !this.memory.storage &&
      this.core &&
      this.core.storage
    ) {

      this.memory.setStorage(
        this.core.storage
      );
    }


    /*
     * Ensure profile connection.
     */

    if (
      !this.profile &&
      this.core &&
      this.core.profile
    ) {

      this.profile =
        this.core.profile;
    }


    await this.engine.initialize();


    await this.memory.initialize();


    this.state.initialized = true;
    this.state.stopped = false;


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


    await this.engine.start();


    await this.memory.start();


    this.state.started = true;
    this.state.stopped = false;


    return {
      success: true,
      status: 'online'
    };
  }


  /* ═══════════════════════════════════════
     CHAT
  ═══════════════════════════════════════ */

  async chat(input = {}) {

    if (!this.state.started) {

      await this.start();
    }


    const message =
      String(
        input.message ||
        input.text ||
        ''
      ).trim();


    if (!message) {

      return {
        success: false,
        error: 'AI_MESSAGE_EMPTY'
      };
    }


    const userId =
      input.userId ||
      input.senderId ||
      null;


    const threadId =
      input.threadId ||
      input.conversationId ||
      null;


    const source =
      input.source ||
      input.platform ||
      'internal';


    /*
     * ═══════════════════════════════════
     * PROFILE INFORMATION
     * ═══════════════════════════════════
     */

    let userProfile = null;
    let threadProfile = null;


    if (
      this.profile &&
      userId
    ) {

      userProfile =
        this.profile.getUser(
          userId
        );


      /*
       * Create / update user profile.
       */

      this.profile.touchUser(
        userId,
        {

          platform:
            source,

          language:
            input.language ||
            userProfile?.language ||
            'bn',

          metadata:
            {
              lastAIMessageAt:
                new Date().toISOString()
            }

        }
      );


      userProfile =
        this.profile.getUser(
          userId
        );
    }


    if (
      this.profile &&
      threadId
    ) {

      threadProfile =
        this.profile.getThread(
          threadId
        );


      /*
       * Create / update thread profile.
       */

      this.profile.touchThread(
        threadId,
        {

          platform:
            source,

          userId:
            userId,

          type:
            input.threadType ||
            threadProfile?.type ||
            'conversation',

          metadata:
            {
              lastAIActivityAt:
                new Date().toISOString()
            }

        }
      );


      threadProfile =
        this.profile.getThread(
          threadId
        );
    }


    /*
     * ═══════════════════════════════════
     * LOAD MEMORY CONTEXT
     * ═══════════════════════════════════
     */

    const memoryContext =
      this.memory.getContext(
        userId,
        threadId
      );


    const history =
      this.memory.getMessages(
        userId,
        threadId
      );


    /*
     * ═══════════════════════════════════
     * SAVE USER MESSAGE
     * ═══════════════════════════════════
     */

    this.memory.addMessage(
      userId,
      threadId,
      {
        role: 'user',
        content: message,
        timestamp:
          new Date().toISOString()
      }
    );


    /*
     * ═══════════════════════════════════
     * BUILD AI CONTEXT
     * ═══════════════════════════════════
     */

    const profileContext = {

      user:
        userProfile || null,

      thread:
        threadProfile || null,

      language:
        input.language ||
        userProfile?.language ||
        'bn',

      source
    };


    /*
     * ═══════════════════════════════════
     * GENERATE AI RESPONSE
     * ═══════════════════════════════════
     */

    const result =
      await this.engine.chat({

        message,

        context:
          memoryContext,

        history,

        userId,

        threadId,

        provider:
          input.provider,

        metadata:
          {
            ...(input.metadata || {}),

            profile:
              profileContext
          }

      });


    const response =
      result?.response ||
      result?.text ||
      '';


    /*
     * ═══════════════════════════════════
     * SAVE AI RESPONSE TO MEMORY
     * ═══════════════════════════════════
     */

    if (
      result?.success !== false &&
      response
    ) {

      this.memory.addMessage(
        userId,
        threadId,
        {
          role: 'assistant',
          content: response,
          timestamp:
            new Date().toISOString()
        }
      );
    }


    /*
     * ═══════════════════════════════════
     * FINAL RESULT
     * ═══════════════════════════════════
     */

    return {

      success:
        result?.success !== false,

      response,

      provider:
        result?.provider ||
        this.engine.defaultProvider,

      userId,

      threadId,

      profile:
        profileContext,

      memory:
        this.memory.getStatus()
    };
  }


  /* ═══════════════════════════════════════
     MEMORY ACCESS
  ═══════════════════════════════════════ */

  getMemory(
    userId,
    threadId
  ) {

    return this.memory.getMessages(
      userId,
      threadId
    );
  }


  getMemoryContext(
    userId,
    threadId
  ) {

    return this.memory.getContext(
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


  /* ═══════════════════════════════════════
     PROFILE ACCESS
  ═══════════════════════════════════════ */

  getProfile(userId) {

    if (
      !this.profile ||
      !userId
    ) {

      return null;
    }


    return this.profile.getUser(
      userId
    );
  }


  getThreadProfile(threadId) {

    if (
      !this.profile ||
      !threadId
    ) {

      return null;
    }


    return this.profile.getThread(
      threadId
    );
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


      engine:
        this.engine.getStatus(),


      memory:
        this.memory.getStatus(),


      profile:
        this.profile
          ? this.profile.getStatus()
          : {
              connected: false
            }

    };
  }


  /* ═══════════════════════════════════════
     STOP
  ═══════════════════════════════════════ */

  async stop() {

    if (!this.state.started) {
      return;
    }


    await this.memory.stop();


    await this.engine.stop();


    this.state.started = false;
    this.state.stopped = true;


    return {
      success: true,
      status: 'stopped'
    };
  }
}


module.exports =
  VentronAIService;
