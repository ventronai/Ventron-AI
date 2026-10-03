/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON PLATFORM MANAGER            ║
 * ║          Multi-Platform Control Layer            ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

class VentronPlatformManager
  extends EventEmitter {

  constructor(config) {

    super();

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.platforms = new Map();

    this.state = {
      initialized: false,
      started: false,
      stopped: false
    };

    this.stats = {
      received: 0,
      sent: 0,
      failed: 0
    };
  }

  // ═══════════════════════════════════════════════
  // 🧩 REGISTER PLATFORM
  // ═══════════════════════════════════════════════

  register(name, adapter) {

    if (
      !name ||
      typeof name !== 'string'
    ) {
      throw new TypeError(
        'Platform name must be a string.'
      );
    }

    if (!adapter) {
      throw new Error(
        `Platform "${name}" cannot be empty.`
      );
    }

    const platformName =
      name.toLowerCase().trim();

    if (
      this.platforms.has(
        platformName
      )
    ) {
      throw new Error(
        `Platform "${platformName}" is already registered.`
      );
    }

    this.platforms.set(
      platformName,
      adapter
    );

    this.emit(
      'registered',
      {
        name:
          platformName,

        adapter
      }
    );

    return true;
  }

  // ═══════════════════════════════════════════════
  // 🔍 GET PLATFORM
  // ═══════════════════════════════════════════════

  get(name) {

    if (!name) {
      return null;
    }

    return this.platforms.get(
      String(name)
        .toLowerCase()
        .trim()
    ) || null;
  }

  // ═══════════════════════════════════════════════
  // 📋 LIST PLATFORMS
  // ═══════════════════════════════════════════════

  list() {

    return Array.from(
      this.platforms.keys()
    );
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    for (
      const [
        name,
        adapter
      ] of this.platforms
    ) {

      try {

        if (
          typeof adapter.initialize ===
          'function'
        ) {
          adapter.initialize();
        }

        this.emit(
          'initialized',
          {
            name
          }
        );

      } catch (error) {

        this.stats.failed++;

        this.emit(
          'error',
          {
            name,
            error
          }
        );
      }
    }

    this.state.initialized = true;
  }

  // ═══════════════════════════════════════════════
  // 🚀 START
  // ═══════════════════════════════════════════════

  async start() {

    if (!this.state.initialized) {
      this.initialize();
    }

    if (this.state.started) {
      return;
    }

    for (
      const [
        name,
        adapter
      ] of this.platforms
    ) {

      try {

        if (
          typeof adapter.start ===
          'function'
        ) {

          await adapter.start();
        }

        this.emit(
          'started',
          {
            name
          }
        );

      } catch (error) {

        this.stats.failed++;

        this.emit(
          'error',
          {
            name,
            error
          }
        );
      }
    }

    this.state.started = true;
    this.state.stopped = false;

    return {
      success: true,
      status: 'online',
      platforms:
        this.list()
    };
  }

  // ═══════════════════════════════════════════════
  // 📥 RECEIVE
  // ═══════════════════════════════════════════════

  async receive(
    platform,
    payload
  ) {

    const adapter =
      this.get(platform);

    if (!adapter) {

      this.stats.failed++;

      return {
        success: false,
        handled: false,
        reason:
          'PLATFORM_NOT_FOUND'
      };
    }

    try {

      const result =
        await adapter.receive(
          payload
        );

      if (
        result &&
        result.success
      ) {

        this.stats.received++;

        this.emit(
          'received',
          {
            platform,
            result
          }
        );
      }

      return result;

    } catch (error) {

      this.stats.failed++;

      this.emit(
        'error',
        {
          platform,
          error
        }
      );

      return {
        success: false,
        handled: false,
        reason:
          'PLATFORM_RECEIVE_ERROR',
        error:
          error.message
      };
    }
  }

  // ═══════════════════════════════════════════════
  // 📤 SEND
  // ═══════════════════════════════════════════════

  async send(
    platform,
    response
  ) {

    const adapter =
      this.get(platform);

    if (!adapter) {

      this.stats.failed++;

      return {
        success: false,
        sent: false,
        reason:
          'PLATFORM_NOT_FOUND'
      };
    }

    try {

      const result =
        await adapter.send(
          response
        );

      if (
        result &&
        result.sent
      ) {

        this.stats.sent++;

        this.emit(
          'sent',
          {
            platform,
            result
          }
        );
      }

      return result;

    } catch (error) {

      this.stats.failed++;

      this.emit(
        'error',
        {
          platform,
          error
        }
      );

      return {
        success: false,
        sent: false,
        reason:
          'PLATFORM_SEND_ERROR',
        error:
          error.message
      };
    }
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    const platformStatus = {};

    for (
      const [
        name,
        adapter
      ] of this.platforms
    ) {

      try {

        platformStatus[name] =
          typeof adapter.getStatus ===
          'function'
            ? adapter.getStatus()
            : {
                status:
                  'unknown'
              };

      } catch (error) {

        platformStatus[name] = {
          status:
            'error',

          error:
            error.message
        };
      }
    }

    return {

      initialized:
        this.state.initialized,

      started:
        this.state.started,

      stopped:
        this.state.stopped,

      platforms:
        platformStatus,

      stats: {
        ...this.stats
      }
    };
  }

  // ═══════════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════════

  async stop() {

    if (!this.state.started) {
      return;
    }

    const entries =
      Array.from(
        this.platforms.entries()
      ).reverse();

    for (
      const [
        name,
        adapter
      ] of entries
    ) {

      try {

        if (
          typeof adapter.stop ===
          'function'
        ) {

          await adapter.stop();
        }

        this.emit(
          'stopped',
          {
            name
          }
        );

      } catch (error) {

        this.stats.failed++;

        this.emit(
          'error',
          {
            name,
            error
          }
        );
      }
    }

    this.state.started = false;
    this.state.stopped = true;
  }
}

module.exports =
  VentronPlatformManager;
