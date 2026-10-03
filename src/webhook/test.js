/**
 * ╔══════════════════════════════════════════════════╗
 * ║            VENTRON WEBHOOK TESTER              ║
 * ║         Internal Event Simulation Layer         ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

class VentronWebhookTester {

  constructor(core) {

    if (!core) {
      throw new Error(
        'Ventron Core instance is required.'
      );
    }

    this.core =
      core;

    this.stats = {
      total: 0,
      passed: 0,
      failed: 0
    };
  }


  // ═══════════════════════════════════════════
  // 🧪 TEST MESSAGE
  // ═══════════════════════════════════════════

  async testMessage(
    message = 'হ্যালো Ventron'
  ) {

    this.stats.total++;

    const started =
      Date.now();

    try {

      const result =
        await this.core.receiveFromPlatform(
          'messenger',
          {
            id:
              `test_${Date.now()}`,

            message,

            sender: {
              id:
                'ventron-test-user',

              name:
                'Ventron Test User'
            },

            thread: {
              id:
                'ventron-test-thread'
            },

            timestamp:
              Date.now(),

            raw: {
              test:
                true,

              message
            }
          }
        );


      const passed =
        Boolean(
          result &&
          result.success
        );


      if (passed) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }


      return {

        success:
          passed,

        duration:
          Date.now() -
          started,

        result
      };

    } catch (error) {

      this.stats.failed++;

      return {

        success:
          false,

        duration:
          Date.now() -
          started,

        error:
          error.message
      };
    }
  }


  // ═══════════════════════════════════════════
  // ⚡ TEST COMMAND
  // ═══════════════════════════════════════════

  async testCommand(
    command = '!help'
  ) {

    return this.testMessage(
      command
    );
  }


  // ═══════════════════════════════════════════
  // 🧠 TEST AI
  // ═══════════════════════════════════════════

  async testAI(
    message = 'তুমি কে?'
  ) {

    this.stats.total++;

    const started =
      Date.now();

    try {

      const result =
        await this.core.chat({

          message,

          userId:
            'ventron-test-user',

          threadId:
            'ventron-test-thread'
        });


      const passed =
        Boolean(
          result &&
          result.success &&
          result.response
        );


      if (passed) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }


      return {

        success:
          passed,

        duration:
          Date.now() -
          started,

        result
      };

    } catch (error) {

      this.stats.failed++;

      return {

        success:
          false,

        duration:
          Date.now() -
          started,

        error:
          error.message
      };
    }
  }


  // ═══════════════════════════════════════════
  // 🚀 RUN FULL WEBHOOK TEST
  // ═══════════════════════════════════════════

  async runAll() {

    this.stats = {
      total: 0,
      passed: 0,
      failed: 0
    };


    const tests = [];


    tests.push({
      name:
        'Webhook Message',

      result:
        await this.testMessage(
          'হ্যালো Ventron'
        )
    });


    tests.push({
      name:
        'Webhook Command',

      result:
        await this.testCommand(
          '!help'
        )
    });


    tests.push({
      name:
        'AI Pipeline',

      result:
        await this.testAI(
          'তুমি কে?'
        )
    });


    return {

      success:
        this.stats.failed === 0,

      total:
        this.stats.total,

      passed:
        this.stats.passed,

      failed:
        this.stats.failed,

      tests,

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
        this.stats.total,

      passed:
        this.stats.passed,

      failed:
        this.stats.failed,

      success:
        this.stats.failed === 0
    };
  }
}


module.exports =
  VentronWebhookTester;
