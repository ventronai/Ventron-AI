/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON PROFILE MANAGER            ║
 * ║        PERSISTENT USER / THREAD PROFILES       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';


class VentronProfileManager {

  constructor(storage) {

    if (!storage) {
      throw new Error(
        'Ventron Storage Manager is required.'
      );
    }

    this.storage =
      storage;

    this.stats = {

      usersCreated:
        0,

      usersUpdated:
        0,

      threadsCreated:
        0,

      threadsUpdated:
        0
    };
  }


  // ═══════════════════════════════════════════
  // 👤 GET USER
  // ═══════════════════════════════════════════

  getUser(userId) {

    if (!userId) {
      return null;
    }

    return this.storage.getUser(
      userId
    );
  }


  // ═══════════════════════════════════════════
  // 👤 CREATE / UPDATE USER
  // ═══════════════════════════════════════════

  saveUser(
    userId,
    data = {}
  ) {

    if (!userId) {
      return false;
    }


    const existing =
      this.getUser(
        userId
      );


    const user = {

      id:
        String(userId),

      name:
        data.name ||
        existing?.name ||
        null,

      firstName:
        data.firstName ||
        existing?.firstName ||
        null,

      lastName:
        data.lastName ||
        existing?.lastName ||
        null,

      platform:
        data.platform ||
        existing?.platform ||
        'unknown',

      language:
        data.language ||
        existing?.language ||
        'bn',

      metadata:
        {
          ...(existing?.metadata || {}),
          ...(data.metadata || {})
        },

      createdAt:
        existing?.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };


    const result =
      this.storage.setUser(
        userId,
        user
      );


    if (result) {

      if (existing) {

        this.stats.usersUpdated++;

      } else {

        this.stats.usersCreated++;
      }
    }


    return result;
  }


  // ═══════════════════════════════════════════
  // 🧵 GET THREAD
  // ═══════════════════════════════════════════

  getThread(threadId) {

    if (!threadId) {
      return null;
    }

    return this.storage.getThread(
      threadId
    );
  }


  // ═══════════════════════════════════════════
  // 🧵 CREATE / UPDATE THREAD
  // ═══════════════════════════════════════════

  saveThread(
    threadId,
    data = {}
  ) {

    if (!threadId) {
      return false;
    }


    const existing =
      this.getThread(
        threadId
      );


    const thread = {

      id:
        String(threadId),

      name:
        data.name ||
        existing?.name ||
        null,

      type:
        data.type ||
        existing?.type ||
        'conversation',

      platform:
        data.platform ||
        existing?.platform ||
        'unknown',

      userId:
        data.userId ||
        existing?.userId ||
        null,

      metadata:
        {
          ...(existing?.metadata || {}),
          ...(data.metadata || {})
        },

      createdAt:
        existing?.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };


    const result =
      this.storage.setThread(
        threadId,
        thread
      );


    if (result) {

      if (existing) {

        this.stats.threadsUpdated++;

      } else {

        this.stats.threadsCreated++;
      }
    }


    return result;
  }


  // ═══════════════════════════════════════════
  // 🔄 TOUCH USER
  // ═══════════════════════════════════════════

  touchUser(
    userId,
    data = {}
  ) {

    return this.saveUser(
      userId,
      {
        ...data,

        metadata: {

          ...(data.metadata || {}),

          lastSeenAt:
            new Date().toISOString()
        }
      }
    );
  }


  // ═══════════════════════════════════════════
  // 🔄 TOUCH THREAD
  // ═══════════════════════════════════════════

  touchThread(
    threadId,
    data = {}
  ) {

    return this.saveThread(
      threadId,
      {
        ...data,

        metadata: {

          ...(data.metadata || {}),

          lastActivityAt:
            new Date().toISOString()
        }
      }
    );
  }


  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    const storageStatus =
      this.storage.getStatus();


    return {

      users:
        storageStatus.records.users,

      threads:
        storageStatus.records.threads,

      stats:
        {
          ...this.stats
        }
    };
  }
}


module.exports =
  VentronProfileManager;
