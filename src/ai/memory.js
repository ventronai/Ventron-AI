/**
 * ╔══════════════════════════════════════════════════╗
 * ║           VENTRON CONVERSATION MEMORY          ║
 * ║          Context & Session Memory Layer         ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

class VentronMemory {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.sessions = new Map();

    this.maxMessages =
      Number(
        process.env.MEMORY_MAX_MESSAGES
      ) || 20;

    this.sessionTTL =
      Number(
        process.env.MEMORY_SESSION_TTL
      ) || 3600000;
  }

  // ═══════════════════════════════════════════════
  // 🔑 SESSION KEY
  // ═══════════════════════════════════════════════

  getSessionKey(userId, threadId) {

    const user =
      userId || 'unknown-user';

    const thread =
      threadId || 'default-thread';

    return `${user}:${thread}`;
  }

  // ═══════════════════════════════════════════════
  // 🧠 CREATE / GET SESSION
  // ═══════════════════════════════════════════════

  getSession(userId, threadId) {

    const key =
      this.getSessionKey(
        userId,
        threadId
      );

    let session =
      this.sessions.get(key);

    if (!session) {

      session = {
        key,

        userId:
          userId || null,

        threadId:
          threadId || null,

        messages: [],

        createdAt:
          Date.now(),

        updatedAt:
          Date.now()
      };

      this.sessions.set(
        key,
        session
      );
    }

    session.updatedAt =
      Date.now();

    return session;
  }

  // ═══════════════════════════════════════════════
  // 💬 ADD MESSAGE
  // ═══════════════════════════════════════════════

  addMessage(
    userId,
    threadId,
    role,
    content
  ) {

    if (
      !role ||
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return false;
    }

    const session =
      this.getSession(
        userId,
        threadId
      );

    session.messages.push({
      role,

      content:
        content.trim(),

      timestamp:
        new Date().toISOString()
    });

    // Keep only recent context.
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
      Date.now();

    return true;
  }

  // ═══════════════════════════════════════════════
  // 📚 GET HISTORY
  // ═══════════════════════════════════════════════

  getHistory(
    userId,
    threadId
  ) {

    const session =
      this.getSession(
        userId,
        threadId
      );

    return session.messages.map(
      message => ({
        ...message
      })
    );
  }

  // ═══════════════════════════════════════════════
  // 👤 USER CONTEXT
  // ═══════════════════════════════════════════════

  getContext(
    userId,
    threadId
  ) {

    const session =
      this.getSession(
        userId,
        threadId
      );

    return {
      userId:
        session.userId,

      threadId:
        session.threadId,

      messageCount:
        session.messages.length,

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt
    };
  }

  // ═══════════════════════════════════════════════
  // 🧹 CLEAR SESSION
  // ═══════════════════════════════════════════════

  clear(
    userId,
    threadId
  ) {

    const key =
      this.getSessionKey(
        userId,
        threadId
      );

    return this.sessions.delete(key);
  }

  // ═══════════════════════════════════════════════
  // 🧹 CLEAN EXPIRED SESSIONS
  // ═══════════════════════════════════════════════

  cleanup() {

    const now =
      Date.now();

    let removed = 0;

    for (
      const [key, session]
      of this.sessions
    ) {

      if (
        now -
        session.updatedAt >
        this.sessionTTL
      ) {

        this.sessions.delete(key);

        removed++;
      }
    }

    return removed;
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
      sessions:
        this.sessions.size,

      maxMessages:
        this.maxMessages,

      sessionTTL:
        this.sessionTTL
    };
  }
}

module.exports = VentronMemory;
