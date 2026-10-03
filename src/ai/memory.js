/**
 * ╔══════════════════════════════════════════════════╗
 * ║                VENTRON AI MEMORY               ║
 * ║          PERSISTENT CONVERSATION MEMORY        ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';


class VentronAIMemory {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config =
      config;

    this.storage =
      null;

    this.state = {

      initialized:
        false,

      started:
        false
    };

    this.sessions =
      new Map();

    this.maxMessages =
      Number(
        process.env.AI_MEMORY_LIMIT
      ) || 20;

    this.stats = {

      sessionsCreated:
        0,

      messagesAdded:
        0,

      messagesLoaded:
        0,

      messagesSaved:
        0,

      errors:
        0
    };
  }


  // ═══════════════════════════════════════════
  // 🔗 STORAGE CONNECTION
  // ═══════════════════════════════════════════

  setStorage(storage) {

    if (!storage) {

      throw new Error(
        'Ventron Storage Manager is required.'
      );
    }

    this.storage =
      storage;

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

    this.loadFromStorage();

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
  // 🧠 SESSION KEY
  // ═══════════════════════════════════════════

  getSessionId(
    userId,
    threadId
  ) {

    const user =
      String(
        userId || 'unknown'
      ).trim();

    const thread =
      String(
        threadId || 'default'
      ).trim();

    return `${user}:${thread}`;
  }


  // ═══════════════════════════════════════════
  // 📝 GET SESSION
  // ═══════════════════════════════════════════

  getSession(
    userId,
    threadId
  ) {

    const sessionId =
      this.getSessionId(
        userId,
        threadId
      );

    if (
      !this.sessions.has(
        sessionId
      )
    ) {

      this.sessions.set(
        sessionId,
        {
          id:
            sessionId,

          userId:
            String(
              userId || 'unknown'
            ),

          threadId:
            String(
              threadId || 'default'
            ),

          messages:
            [],

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString()
        }
      );

      this.stats.sessionsCreated++;
    }

    return this.sessions.get(
      sessionId
    );
  }


  // ═══════════════════════════════════════════
  // ➕ ADD MESSAGE
  // ═══════════════════════════════════════════

  addMessage(
    userId,
    threadId,
    role,
    content,
    metadata = {}
  ) {

    try {

      if (
        !content ||
        typeof content !== 'string'
      ) {
        return false;
      }

      const session =
        this.getSession(
          userId,
          threadId
        );


      const message = {

        role:
          role || 'user',

        content:
          content.trim(),

        metadata:
          metadata || {},

        timestamp:
          new Date().toISOString()
      };


      session.messages.push(
        message
      );


      // Keep only recent messages
      if (
        session.messages.length >
        this.maxMessages
      ) {

        session.messages =
          session.messages.slice(
            -this.maxMessages
          );
      }


      session.updatedAt =
        new Date().toISOString();


      this.stats.messagesAdded++;


      this.saveSession(
        session
      );


      return true;

    } catch (error) {

      this.stats.errors++;

      return false;
    }
  }


  // ═══════════════════════════════════════════
  // 📚 GET MESSAGES
  // ═══════════════════════════════════════════

  getMessages(
    userId,
    threadId
  ) {

    const session =
      this.getSession(
        userId,
        threadId
      );

    return [
      ...session.messages
    ];
  }


  // ═══════════════════════════════════════════
  // 💬 GET CHAT CONTEXT
  // ═══════════════════════════════════════════

  getContext(
    userId,
    threadId
  ) {

    const messages =
      this.getMessages(
        userId,
        threadId
      );

    return messages.map(
      message => ({

        role:
          message.role,

        content:
          message.content
      })
    );
  }


  // ═══════════════════════════════════════════
  // 🧹 CLEAR SESSION
  // ═══════════════════════════════════════════

  clearSession(
    userId,
    threadId
  ) {

    const sessionId =
      this.getSessionId(
        userId,
        threadId
      );

    if (
      !this.sessions.has(
        sessionId
      )
    ) {
      return false;
    }

    this.sessions.delete(
      sessionId
    );


    if (
      this.storage
    ) {

      this.storage.deleteMemory(
        sessionId
      );
    }

    return true;
  }


  // ═══════════════════════════════════════════
  // 💾 SAVE SESSION
  // ═══════════════════════════════════════════

  saveSession(
    session
  ) {

    if (
      !this.storage ||
      !session
    ) {
      return false;
    }

    try {

      const result =
        this.storage.setMemory(
          session.id,
          session
        );

      if (result) {

        this.stats.messagesSaved +=
          session.messages.length;
      }

      return result;

    } catch (error) {

      this.stats.errors++;

      return false;
    }
  }


  // ═══════════════════════════════════════════
  // 📥 LOAD MEMORY
  // ═══════════════════════════════════════════

  loadFromStorage() {

    if (
      !this.storage
    ) {
      return;
    }

    try {

      const status =
        this.storage.getStatus();


      const memoryCount =
        status.records?.memory || 0;


      if (
        memoryCount <= 0
      ) {
        return;
      }


      const data =
        this.storage.data?.memory;


      if (
        !data ||
        typeof data !== 'object'
      ) {
        return;
      }


      for (
        const [
          sessionId,
          session
        ] of Object.entries(data)
      ) {

        if (
          !session ||
          !Array.isArray(
            session.messages
          )
        ) {
          continue;
        }


        this.sessions.set(
          sessionId,
          {

            id:
              session.id ||
              sessionId,

            userId:
              session.userId ||
              'unknown',

            threadId:
              session.threadId ||
              'default',

            messages:
              session.messages.slice(
                -this.maxMessages
              ),

            createdAt:
              session.createdAt ||
              new Date().toISOString(),

            updatedAt:
              session.updatedAt ||
              new Date().toISOString()
          }
        );


        this.stats.messagesLoaded +=
          session.messages.length;
      }

    } catch (error) {

      this.stats.errors++;
    }
  }


  // ═══════════════════════════════════════════
  // 🗑️ CLEAR ALL MEMORY
  // ═══════════════════════════════════════════

  clearAll() {

    this.sessions.clear();

    if (
      this.storage
    ) {

      const memoryIds =
        Object.keys(
          this.storage.data?.memory || {}
        );


      for (
        const id of memoryIds
      ) {

        this.storage.deleteMemory(
          id
        );
      }
    }

    return true;
  }


  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    let totalMessages = 0;

    for (
      const session
      of this.sessions.values()
    ) {

      totalMessages +=
        session.messages.length;
    }


    return {

      initialized:
        this.state.initialized,

      started:
        this.state.started,

      sessions:
        this.sessions.size,

      messages:
        totalMessages,

      maxMessages:
        this.maxMessages,

      persistent:
        Boolean(
          this.storage
        ),

      storage:
        this.storage
          ? 'json'
          : 'memory-only',

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


    // Save every active session
    for (
      const session
      of this.sessions.values()
    ) {

      this.saveSession(
        session
      );
    }


    this.state.started =
      false;
  }
}


module.exports =
  VentronAIMemory;
