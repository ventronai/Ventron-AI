/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON AI SELF TEST               ║
 * ║          Internal Pipeline Diagnostics          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

class VentronSelfTest {

  constructor(core) {

    if (!core) {
      throw new Error(
        'Ventron Core instance is required.'
      );
    }

    this.core = core;

    this.tests = [];
  }

  // ═══════════════════════════════════════════════
  // 🧪 TEST HELPER
  // ═══════════════════════════════════════════════

  async runTest(name, callback) {

    const startedAt =
      Date.now();

    try {

      const result =
        await callback();

      const passed =
        result !== false;

      const test = {
        name,
        passed,
        duration:
          Date.now() - startedAt
      };

      this.tests.push(test);

      return test;

    } catch (error) {

      const test = {
        name,
        passed: false,
        duration:
          Date.now() - startedAt,
        error:
          error.message
      };

      this.tests.push(test);

      return test;
    }
  }

  // ═══════════════════════════════════════════════
  // 🧠 CORE TEST
  // ═══════════════════════════════════════════════

  async testCore() {

    return this.runTest(
      'Core Status',
      async () => {

        const status =
          this.core.getStatus();

        return Boolean(
          status.initialized &&
          status.started
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🧩 COMMAND TEST
  // ═══════════════════════════════════════════════

  async testCommandEngine() {

    return this.runTest(
      'Command Engine',
      async () => {

        const status =
          this.core.commandEngine
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 📡 EVENT TEST
  // ═══════════════════════════════════════════════

  async testEventGateway() {

    return this.runTest(
      'Event Gateway',
      async () => {

        const status =
          this.core.eventGateway
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🔀 ROUTER TEST
  // ═══════════════════════════════════════════════

  async testRouter() {

    return this.runTest(
      'Message Router',
      async () => {

        const status =
          this.core.messageRouter
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🧠 AI TEST
  // ═══════════════════════════════════════════════

  async testAI() {

    return this.runTest(
      'AI Service',
      async () => {

        const status =
          this.core.aiService
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started &&
          status.engine
            .providers
            .length > 0
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 📦 RESPONSE TEST
  // ═══════════════════════════════════════════════

  async testResponseEngine() {

    return this.runTest(
      'Response Engine',
      async () => {

        const status =
          this.core.responseEngine
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 🌐 PLATFORM TEST
  // ═══════════════════════════════════════════════

  async testPlatform() {

    return this.runTest(
      'Messenger Platform',
      async () => {

        const status =
          this.core.platformManager
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started &&
          status.platforms
            .messenger
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 💬 AI PIPELINE TEST
  // ═══════════════════════════════════════════════

  async testChatPipeline() {

    return this.runTest(
      'AI Chat Pipeline',
      async () => {

        const result =
          await this.core.chat({
            message:
              'হ্যালো Ventron',

            userId:
              'selftest-user',

            threadId:
              'selftest-thread'
          });

        return Boolean(
          result &&
          result.success &&
          result.response
        );
      }
    );
  }

  // ═══════════════════════════════════════════════
  // 📋 FULL TEST
  // ═══════════════════════════════════════════════

  async runAll() {

    this.tests = [];

    await this.testCore();

    await this.testCommandEngine();

    await this.testEventGateway();

    await this.testRouter();

    await this.testAI();

    await this.testResponseEngine();

    await this.testPlatform();

    await this.testChatPipeline();

    const passed =
      this.tests.filter(
        test => test.passed
      ).length;

    const failed =
      this.tests.filter(
        test => !test.passed
      ).length;

    return {

      success:
        failed === 0,

      total:
        this.tests.length,

      passed,

      failed,

      tests:
        this.tests,

      timestamp:
        new Date().toISOString()
    };
  }

  // ═══════════════════════════════════════════════
  // 📊 QUICK STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {
      total:
        this.tests.length,

      passed:
        this.tests.filter(
          test => test.passed
        ).length,

      failed:
        this.tests.filter(
          test => !test.passed
        ).length,

      tests:
        this.tests
    };
  }
}

module.exports =
  VentronSelfTest;
