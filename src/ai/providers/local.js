/**
 * ╔══════════════════════════════════════════════════╗
 * ║               VENTRON LOCAL AI                 ║
 * ║          DEVELOPMENT / FALLBACK PROVIDER       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';


class VentronLocalProvider {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config =
      config;

    this.name =
      'local';

    this.state = {

      initialized:
        false,

      started:
        false
    };

    this.stats = {

      requests:
        0,

      responses:
        0
    };
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
  // 🧠 GENERATE RESPONSE
  // ═══════════════════════════════════════════

  async generate(
    input = {}
  ) {

    this.stats.requests++;


    const message =
      String(
        input.message || ''
      ).trim();


    const history =
      Array.isArray(
        input.history
      )
        ? input.history
        : Array.isArray(input.context)
          ? input.context
          : [];


    const lower =
      message.toLowerCase();


    let response;


    // ═════════════════════════════════════════
    // 👋 GREETING
    // ═════════════════════════════════════════

    if (
      /^(hi|hello|hey|হাই|হ্যালো|সালাম|আসসালামু আলাইকুম)$/i
        .test(message)
    ) {

      response =
        'হ্যালো! 👋 আমি Ventron AI। কীভাবে সাহায্য করতে পারি?';
    }


    // ═════════════════════════════════════════
    // 🤖 IDENTITY
    // ═════════════════════════════════════════

    else if (
      lower.includes('তুমি কে') ||
      lower.includes('কে তুমি') ||
      lower.includes('who are you') ||
      lower.includes('what are you')
    ) {

      response =
        'আমি Ventron AI 🤖 — একটি modular futuristic AI bot framework।';
    }


    // ═════════════════════════════════════════
    // 🧠 MEMORY
    // ═════════════════════════════════════════

    else if (
      lower.includes('মনে আছে') ||
      lower.includes('memory') ||
      lower.includes('remember')
    ) {

      const previous =
        history.filter(
          item =>
            item &&
            item.role === 'user' &&
            item.content &&
            item.content !== message
        );


      if (
        previous.length > 0
      ) {

        const last =
          previous[
            previous.length - 1
          ];


        response =
          `হ্যাঁ 🧠 আগের কথোপকথনের সর্বশেষ মেসেজ হিসেবে আমার কাছে আছে: "${last.content}"`;
      } else {

        response =
          'এখনও এই conversation-এর কোনো আগের message আমার memory-তে নেই। 🧠';
      }
    }


    // ═════════════════════════════════════════
    // 📊 STATUS
    // ═════════════════════════════════════════

    else if (
      lower.includes('status') ||
      lower.includes('স্ট্যাটাস')
    ) {

      response =
        '🟢 Ventron AI Local Engine Online\n' +
        '🧠 Memory Context: Connected\n' +
        '⚡ Engine: Local\n' +
        '🚀 Status: Operational';
    }


    // ═════════════════════════════════════════
    // ❤️ THANKS
    // ═════════════════════════════════════════

    else if (
      lower.includes('ধন্যবাদ') ||
      lower.includes('thanks') ||
      lower.includes('thank you')
    ) {

      response =
        'আপনাকেও ধন্যবাদ! ❤️ Ventron AI সবসময় সাহায্য করার চেষ্টা করবে।';
    }


    // ═════════════════════════════════════════
    // 🧠 CONTEXT-AWARE FALLBACK
    // ═════════════════════════════════════════

    else if (
      history.length > 1
    ) {

      const previous =
        history
          .filter(
            item =>
              item &&
              item.content &&
              item.content !== message
          )
          .slice(-3);


      if (
        previous.length > 0
      ) {

        response =
          'বুঝেছি। 🧠 আপনার আগের কথোপকথনটাও context হিসেবে রাখা আছে। ' +
          'আরও বিস্তারিত বললে আমি সেটার ভিত্তিতে উত্তর দেওয়ার চেষ্টা করব।';
      } else {

        response =
          'বুঝেছি। 🤖 আরও একটু বিস্তারিত বলুন, আমি সাহায্য করার চেষ্টা করছি।';
      }

    }


    // ═════════════════════════════════════════
    // 💬 GENERAL RESPONSE
    // ═════════════════════════════════════════

    else {

      response =
        `বুঝেছি: "${message}"\n\n` +
        'আমি এখন Local AI mode-এ আছি। 🤖 ' +
        'ভবিষ্যতে external AI provider যুক্ত হলে আরও উন্নত উত্তর দিতে পারব।';
    }


    this.stats.responses++;


    return {

      success:
        true,

      response,

      provider:
        this.name
    };
  }


  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    return {

      name:
        this.name,

      initialized:
        this.state.initialized,

      started:
        this.state.started,

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

    this.state.started =
      false;
  }
}


module.exports =
  VentronLocalProvider;
