'use strict';

const fs = require('fs');
const path = require('path');

class VentronStorageManager {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.state = {
      initialized: false,
      started: false
    };

    this.directory =
      path.join(
        process.cwd(),
        'data'
      );

    this.file =
      path.join(
        this.directory,
        'ventron-data.json'
      );

    this.data = {
      version: 1,
      createdAt: null,
      updatedAt: null,
      users: {},
      threads: {},
      memory: {}
    };

    this.stats = {
      reads: 0,
      writes: 0,
      errors: 0
    };
  }


  // ═══════════════════════════════════════════
  // 🚀 INITIALIZE
  // ═══════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.ensureDirectory();

    this.load();

    this.state.initialized = true;

    return {
      success: true,
      status: 'initialized'
    };
  }


  // ═══════════════════════════════════════════
  // ⚡ START
  // ═══════════════════════════════════════════

  async start() {

    if (!this.state.initialized) {
      this.initialize();
    }

    if (this.state.started) {
      return;
    }

    this.state.started = true;

    return {
      success: true,
      status: 'online'
    };
  }


  // ═══════════════════════════════════════════
  // 📁 DIRECTORY
  // ═══════════════════════════════════════════

  ensureDirectory() {

    if (
      !fs.existsSync(
        this.directory
      )
    ) {

      fs.mkdirSync(
        this.directory,
        {
          recursive: true
        }
      );
    }
  }


  // ═══════════════════════════════════════════
  // 📥 LOAD
  // ═══════════════════════════════════════════

  load() {

    this.stats.reads++;

    try {

      if (
        !fs.existsSync(
          this.file
        )
      ) {

        this.data = {
          version: 1,

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),

          users: {},

          threads: {},

          memory: {}
        };

        this.save();

        return this.data;
      }


      const raw =
        fs.readFileSync(
          this.file,
          'utf8'
        );


      const parsed =
        JSON.parse(raw);


      if (
        !parsed ||
        typeof parsed !== 'object'
      ) {

        throw new Error(
          'Invalid storage data.'
        );
      }


      this.data = {

        version:
          parsed.version || 1,

        createdAt:
          parsed.createdAt ||
          new Date().toISOString(),

        updatedAt:
          parsed.updatedAt ||
          new Date().toISOString(),

        users:
          parsed.users || {},

        threads:
          parsed.threads || {},

        memory:
          parsed.memory || {}
      };


      return this.data;

    } catch (error) {

      this.stats.errors++;

      throw new Error(
        `Storage load failed: ${error.message}`
      );
    }
  }


  // ═══════════════════════════════════════════
  // 💾 SAVE
  // ═══════════════════════════════════════════

  save() {

    this.stats.writes++;

    try {

      this.ensureDirectory();

      this.data.updatedAt =
        new Date().toISOString();


      const tempFile =
        `${this.file}.tmp`;


      fs.writeFileSync(
        tempFile,

        JSON.stringify(
          this.data,
          null,
          2
        ),

        'utf8'
      );


      fs.renameSync(
        tempFile,
        this.file
      );


      return true;

    } catch (error) {

      this.stats.errors++;

      return false;
    }
  }


  // ═══════════════════════════════════════════
  // 👤 USER
  // ═══════════════════════════════════════════

  getUser(
    userId
  ) {

    const id =
      String(userId || '').trim();

    if (!id) {
      return null;
    }

    return this.data.users[id] || null;
  }


  setUser(
    userId,
    userData = {}
  ) {

    const id =
      String(userId || '').trim();

    if (!id) {
      return false;
    }


    const existing =
      this.data.users[id] || {};


    this.data.users[id] = {

      ...existing,

      ...userData,

      id,

      updatedAt:
        new Date().toISOString()
    };


    return this.save();
  }


  // ═══════════════════════════════════════════
  // 🧵 THREAD
  // ═══════════════════════════════════════════

  getThread(
    threadId
  ) {

    const id =
      String(threadId || '').trim();

    if (!id) {
      return null;
    }

    return this.data.threads[id] || null;
  }


  setThread(
    threadId,
    threadData = {}
  ) {

    const id =
      String(threadId || '').trim();

    if (!id) {
      return false;
    }


    const existing =
      this.data.threads[id] || {};


    this.data.threads[id] = {

      ...existing,

      ...threadData,

      id,

      updatedAt:
        new Date().toISOString()
    };


    return this.save();
  }


  // ═══════════════════════════════════════════
  // 🧠 MEMORY
  // ═══════════════════════════════════════════

  getMemory(
    memoryId
  ) {

    const id =
      String(memoryId || '').trim();

    if (!id) {
      return null;
    }

    return this.data.memory[id] || null;
  }


  setMemory(
    memoryId,
    memoryData = {}
  ) {

    const id =
      String(memoryId || '').trim();

    if (!id) {
      return false;
    }


    const existing =
      this.data.memory[id] || {};


    this.data.memory[id] = {

      ...existing,

      ...memoryData,

      id,

      updatedAt:
        new Date().toISOString()
    };


    return this.save();
  }


  deleteMemory(
    memoryId
  ) {

    const id =
      String(memoryId || '').trim();

    if (!id) {
      return false;
    }


    if (
      !this.data.memory[id]
    ) {
      return false;
    }


    delete this.data.memory[id];

    return this.save();
  }


  // ═══════════════════════════════════════════
  // 🧹 CLEAR
  // ═══════════════════════════════════════════

  clear() {

    this.data = {

      version: 1,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

      users: {},

      threads: {},

      memory: {}
    };


    return this.save();
  }


  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    return {

      initialized:
        this.state.initialized,

      started:
        this.state.started,

      driver:
        'json',

      directory:
        this.directory,

      file:
        this.file,

      records: {

        users:
          Object.keys(
            this.data.users
          ).length,

        threads:
          Object.keys(
            this.data.threads
          ).length,

        memory:
          Object.keys(
            this.data.memory
          ).length
      },

      stats: {
        ...this.stats
      }
    };
  }


  // ═══════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════

  async stop() {

    if (!this.state.started) {
      return;
    }

    this.save();

    this.state.started = false;
  }
}


module.exports =
  VentronStorageManager;
