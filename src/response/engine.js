/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON RESPONSE ENGINE            ║
 * ║          Universal Output Processing Layer      ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const EventEmitter = require('events');

class VentronResponseEngine extends EventEmitter {

  constructor(config) {

    super();

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.state = {
      initialized: false,
      started: false,
      stopped: false
    };

    this.stats = {
      processed: 0,
      text: 0,
      media: 0,
      errors: 0
    };
  }

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE
  // ═══════════════════════════════════════════════

  initialize() {

    if (this.state.initialized) {
      return;
    }

    this.state.initialized = true;

    this.emit(
      'initialized'
    );
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

    this.state.started = true;
    this.state.stopped = false;

    this.emit(
      'started'
    );

    return {
      success: true,
      status: 'online'
    };
  }

  // ═══════════════════════════════════════════════
  // 💬 TEXT RESPONSE
  // ═══════════════════════════════════════════════

  text(text, options = {}) {

    if (
      typeof text !== 'string' ||
      !text.trim()
    ) {

      return {
        success: false,
        reason: 'EMPTY_RESPONSE'
      };
    }

    this.stats.processed++;
    this.stats.text++;

    return {
      type: 'text',

      text:
        text.trim(),

      recipient:
        options.recipient || null,

      metadata:
        options.metadata || {},

      timestamp:
        new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════
  // 🖼️ MEDIA RESPONSE
  // ═══════════════════════════════════════════════

  media(options = {}) {

    if (
      !options.url &&
      !options.attachment
    ) {

      return {
        success: false,
        reason: 'MEDIA_SOURCE_MISSING'
      };
    }

    this.stats.processed++;
    this.stats.media++;

    return {
      type: 'media',

      mediaType:
        options.mediaType ||
        'image',

      url:
        options.url || null,

      attachment:
        options.attachment || null,

      recipient:
        options.recipient || null,

      metadata:
        options.metadata || {},

      timestamp:
        new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════
  // 🧠 NORMALIZE AI RESPONSE
  // ═══════════════════════════════════════════════

  normalize(response, options = {}) {

    if (
      response === null ||
      response === undefined
    ) {

      return {
        success: false,
        reason: 'EMPTY_AI_RESPONSE'
      };
    }

    // ─────────────────────────────────────────
    // STRING
    // ─────────────────────────────────────────

    if (
      typeof response === 'string'
    ) {

      return this.text(
        response,
        options
      );
    }

    // ─────────────────────────────────────────
    // ARRAY
    // ─────────────────────────────────────────

    if (
      Array.isArray(response)
    ) {

      const items =
        response
          .map(
            item =>
              this.normalize(
                item,
                options
              )
          )
          .filter(
            item =>
              item &&
              item.success !== false
          );

      return {
        type: 'batch',

        items,

        recipient:
          options.recipient || null,

        timestamp:
          new Date().toISOString()
      };
    }

    // ─────────────────────────────────────────
    // OBJECT
    // ─────────────────────────────────────────

    if (
      typeof response === 'object'
    ) {

      if (
        response.type === 'text'
      ) {

        return this.text(
          response.text || '',
          options
        );
      }

      if (
        response.type === 'media'
      ) {

        return this.media({
          ...response,
          ...options
        });
      }

      if (
        typeof response.text === 'string'
      ) {

        return this.text(
          response.text,
          options
        );
      }

      if (
        response.response
      ) {

        return this.normalize(
          response.response,
          options
        );
      }
    }

    this.stats.errors++;

    return {
      success: false,
      reason: 'UNSUPPORTED_RESPONSE_FORMAT'
    };
  }

  // ═══════════════════════════════════════════════
  // 📦 BATCH RESPONSE
  // ═══════════════════════════════════════════════

  batch(responses = [], options = {}) {

    if (
      !Array.isArray(responses)
    ) {

      return {
        success: false,
        reason: 'RESPONSES_MUST_BE_ARRAY'
      };
    }

    const items =
      responses
        .map(
          response =>
            this.normalize(
              response,
              options
            )
        )
        .filter(
          item =>
            item &&
            item.success !== false
        );

    return {
      type: 'batch',

      items,

      recipient:
        options.recipient || null,

      timestamp:
        new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
      initialized:
        this.state.initialized,

      started:
        this.state.started,

      stopped:
        this.state.stopped,

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

    this.state.started = false;
    this.state.stopped = true;

    this.emit(
      'stopped'
    );
  }
}

module.exports =
  VentronResponseEngine;
