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

    this.core =
      core;

    this.tests = [];
  }


  // ═══════════════════════════════════════════
  // 🧪 GENERIC TEST RUNNER
  // ═══════════════════════════════════════════

  async runTest(
    name,
    callback
  ) {

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
          Date.now() -
          startedAt
      };

      this.tests.push(
        test
      );

      return test;

    } catch (error) {

      const test = {

        name,

        passed:
          false,

        duration:
          Date.now() -
          startedAt,

        error:
          error.message
      };

      this.tests.push(
        test
      );

      return test;
    }
  }


  // ═══════════════════════════════════════════
  // 🧠 CORE
  // ═══════════════════════════════════════════

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


  // ═══════════════════════════════════════════
  // ⌨️ COMMAND ENGINE
  // ═══════════════════════════════════════════

  async testCommandEngine() {

    return this.runTest(
      'Command Engine',

      async () => {

        const status =
          this.core.commandEngine
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started &&
          status.commandCount >= 0
        );
      }
    );
  }


  // ═══════════════════════════════════════════
  // 📡 EVENT GATEWAY
  // ═══════════════════════════════════════════

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


  // ═══════════════════════════════════════════
  // 🔀 MESSAGE ROUTER
  // ═══════════════════════════════════════════

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


  // ═══════════════════════════════════════════
  // 🧠 AI SERVICE
  // ═══════════════════════════════════════════

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
          status.engine &&
          Array.isArray(
            status.engine.providers
          ) &&
          status.engine.providers.length > 0
        );
      }
    );
  }


  // ═══════════════════════════════════════════
  // 📦 RESPONSE ENGINE
  // ═══════════════════════════════════════════

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


  // ═══════════════════════════════════════════
  // 🌐 PLATFORM
  // ═══════════════════════════════════════════

  async testPlatform() {

    return this.runTest(
      'Messenger Platform',

      async () => {

        const status =
          this.core.platformManager
            .getStatus();

        const messenger =
          status.platforms?.messenger;

        return Boolean(
          status.initialized &&
          status.started &&
          messenger
        );
      }
    );
  }


  // ═══════════════════════════════════════════
  // 📡 WEBHOOK GATEWAY
  // ═══════════════════════════════════════════

  async testWebhook() {

    return this.runTest(
      'Webhook Gateway',

      async () => {

        const status =
          this.core.webhook
            .getStatus();

        return Boolean(
          status.started &&
          status.path
        );
      }
    );
  }


  // ═══════════════════════════════════════════
  // 🛡️ SECURITY
  // ═══════════════════════════════════════════

  async testSecurity() {

    return this.runTest(
      'Security Layer',

      async () => {

        const status =
          this.core.security
            .getStatus();

        return Boolean(
          status.initialized &&
          status.started
        );
      }
    );
  }


  // ═══════════════════════════════════════════
  // 🧪 WEBHOOK TESTER
  // ═══════════════════════════════════════════

  async testWebhookTester() {

    return this.runTest(
      'Webhook Tester',

      async () => {

        if (
          !this.core.webhookTester
        ) {
          return false;
        }

        const status =
          this.core.webhookTester
            .getStatus();

        return Boolean(
          status &&
          typeof status === 'object'
        );
      }
    );
  }


  // ═══════════════════════════════════════════
  // 💬 AI CHAT PIPELINE
  // ═══════════════════════════════════════════

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


  // ═══════════════════════════════════════════
  // 📡 WEBHOOK PIPELINE
  // ═══════════════════════════════════════════

  async testWebhookPipeline() {

    return this.runTest(
      'Webhook Pipeline',

      async () => {

        if (
          !this.core.webhookTester
        ) {
          return false;
        }

        const result =
          await this.core.webhookTester
            .testMessage(
              'হ্যালো Ventron'
            );

        return Boolean(
          result &&
          result.success
        );
      }
    );
  }


  // ═══════════════════════════════════════════
  // 🚀 RUN ALL TESTS
  // ═══════════════════════════════════════════

  async runAll() {

    this.tests = [];


    await this.testCore();

    await this.testCommandEngine();

    await this.testEventGateway();

    await this.testRouter();

    await this.testAI();

    await this.testResponseEngine();

    await this.testPlatform();

    await this.testWebhook();

    await this.testSecurity();

    await this.testWebhookTester();

    await this.testChatPipeline();

    await this.testWebhookPipeline();


    const passed =
      this.tests.filter(
        test =>
          test.passed
      ).length;


    const failed =
      this.tests.filter(
        test =>
          !test.passed
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


  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    return {

      total:
        this.tests.length,

      passed:
        this.tests.filter(
          test =>
            test.passed
        ).length,

      failed:
        this.tests.filter(
          test =>
            !test.passed
        ).length,

      tests:
        this.tests
    };
  }
}


module.exports =
  VentronSelfTest;
