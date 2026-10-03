/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON LOCAL AI PROVIDER          ║
 * ║             Development/Test Provider          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const VentronAIProvider =
  require('./base');

class VentronLocalProvider
  extends VentronAIProvider {

  constructor(options = {}) {

    super({
      name: 'local',
      timeout: 5000,
      ...options
    });
  }

  // ═══════════════════════════════════════════════
  // 🧠 LOCAL RESPONSE
  // ═══════════════════════════════════════════════

  async generate(input = {}) {

    const message =
      typeof input.message === 'string'
        ? input.message.trim()
        : '';

    if (!message) {
      return {
        text: 'আমি তোমার মেসেজ বুঝতে পারিনি।'
      };
    }

    const text =
      message.toLowerCase();

    // ─────────────────────────────────────────
    // 👋 GREETING
    // ─────────────────────────────────────────

    if (
      text === 'hi' ||
      text === 'hello' ||
      text === 'hey' ||
      text === 'হাই' ||
      text === 'হ্যালো'
    ) {

      return {
        text:
          'হ্যালো! 👋 আমি Ventron AI। কী নিয়ে কথা বলতে চাও?'
      };
    }

    // ─────────────────────────────────────────
    // 🤖 IDENTITY
    // ─────────────────────────────────────────

    if (
      text.includes('তুমি কে') ||
      text.includes('who are you')
    ) {

      return {
        text:
          'আমি Ventron AI — একটি modular next-generation AI framework। 🤖'
      };
    }

    // ─────────────────────────────────────────
    // ⚡ STATUS
    // ─────────────────────────────────────────

    if (
      text.includes('কেমন আছ') ||
      text.includes('how are you')
    ) {

      return {
        text:
          'আমি অনলাইনে আছি এবং তোমার সাথে কথা বলার জন্য প্রস্তুত। ⚡'
      };
    }

    // ─────────────────────────────────────────
    // 🧠 DEVELOPMENT MODE
    // ─────────────────────────────────────────

    return {
      text:
        `তুমি বলেছ: "${message}"\n\n` +
        '🧠 Ventron AI বর্তমানে Development Mode-এ চলছে।\n' +
        '🔌 Real AI Provider এখনো সংযুক্ত করা হয়নি।'
    };
  }

  getStatus() {

    return {
      ...super.getStatus(),

      mode: 'development',

      realAI:
        false
    };
  }
}

module.exports =
  VentronLocalProvider;
