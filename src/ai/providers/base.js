/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON AI PROVIDER               ║
 * ║          Secure Provider Adapter Layer          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

class VentronAIProvider {

  constructor(options = {}) {

    this.name =
      options.name || 'unknown';

    this.endpoint =
      options.endpoint || '';

    this.apiKey =
      options.apiKey || '';

    this.timeout =
      Number(options.timeout) || 30000;
  }

  // ═══════════════════════════════════════════════
  // 🔐 API REQUEST
  // ═══════════════════════════════════════════════

  async request(payload) {

    if (!this.endpoint) {
      throw new Error(
        'AI provider endpoint is not configured.'
      );
    }

    if (!this.apiKey) {
      throw new Error(
        'AI provider API key is not configured.'
      );
    }

    if (
      typeof fetch !== 'function'
    ) {
      throw new Error(
        'Global fetch is unavailable. Node.js 20+ is required.'
      );
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        this.timeout
      );

    try {

      const response =
        await fetch(
          this.endpoint,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'Authorization':
                `Bearer ${this.apiKey}`
            },

            body:
              JSON.stringify(payload),

            signal:
              controller.signal
          }
        );

      const text =
        await response.text();

      let data;

      try {

        data =
          text
            ? JSON.parse(text)
            : {};

      } catch {

        data = {
          raw: text
        };
      }

      if (!response.ok) {

        const message =
          data.error?.message ||
          data.error ||
          data.message ||
          `HTTP ${response.status}`;

        throw new Error(
          `AI provider request failed: ${message}`
        );
      }

      return data;

    } finally {

      clearTimeout(timeout);
    }
  }

  // ═══════════════════════════════════════════════
  // 🧠 GENERATE
  // ═══════════════════════════════════════════════

  async generate() {

    throw new Error(
      'generate() must be implemented by the provider adapter.'
    );
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
      name:
        this.name,

      configured:
        Boolean(
          this.endpoint &&
          this.apiKey
        ),

      endpointConfigured:
        Boolean(
          this.endpoint
        ),

      apiKeyConfigured:
        Boolean(
          this.apiKey
        ),

      timeout:
        this.timeout
    };
  }
}

module.exports = VentronAIProvider;
