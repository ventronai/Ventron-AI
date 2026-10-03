/**
 * ╔══════════════════════════════════════════════════╗
 * ║                VENTRON SELF TEST               ║
 * ║          COMPLETE SYSTEM DIAGNOSTICS           ║
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

    this.tests =
      [];

    this.lastRun =
      null;
  }


  // ═══════════════════════════════════════════
  // 🧪 SINGLE TEST
  // ═══════════════════════════════════════════

  async runTest(
    name,
    handler
  ) {

    const started =
      Date.now();

    try {

      const result =
        await handler();


      const passed =
        result === true ||
        result?.success === true;


      const test = {

        name,

        success:
          passed,

        duration:
          Date.now() -
          started,

        result:
          typeof result === 'object'
            ? result
            : {
                success:
                  passed
              }
      };


      this.tests.push(
        test
      );


      return test;

    } catch (error) {

      const test = {

        name,

        success:
          false,

        duration:
          Date.now() -
          started,

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
  // 🚀 RUN ALL
  // ═══════════════════════════════════════════

  async runAll() {

    this.tests = [];

    const started =
      Date.now();


    await this.runTest(
      'Core Status',
      async () => {

        const status =
          this.core.getStatus();

        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          initialized:
            status.initialized,

          started:
            status.started
        };
      }
    );


    await this.runTest(
      'Storage Manager',
      async () => {

        const storage =
          this.core.storage;


        if (!storage) {

          return {

            success:
              false,

            reason:
              'STORAGE_NOT_FOUND'
          };
        }


        const status =
          storage.getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          initialized:
            status.initialized,

          started:
            status.started,

          driver:
            status.driver
        };
      }
    );


    await this.runTest(
      'Command Engine',
      async () => {

        const status =
          this.core.commandEngine
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          commands:
            status.commandCount
        };
      }
    );


    await this.runTest(
      'Event Gateway',
      async () => {

        const status =
          this.core.eventGateway
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          received:
            status.stats.received
        };
      }
    );


    await this.runTest(
      'Message Router',
      async () => {

        const status =
          this.core.messageRouter
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          routed:
            status.stats.routed
        };
      }
    );


    await this.runTest(
      'AI Service',
      async () => {

        const status =
          this.core.aiService
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          initialized:
            status.initialized,

          started:
            status.started
        };
      }
    );


    await this.runTest(
      'AI Memory',
      async () => {

        const memory =
          this.core.aiService
            .memory;


        if (!memory) {

          return {

            success:
              false,

            reason:
              'AI_MEMORY_NOT_FOUND'
          };
        }


        const status =
          memory.getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started &&
              status.persistent
            ),

          sessions:
            status.sessions,

          messages:
            status.messages,

          persistent:
            status.persistent,

          storage:
            status.storage
        };
      }
    );


    await this.runTest(
      'AI Engine',
      async () => {

        const engine =
          this.core.aiService
            .engine;


        const status =
          engine.getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          provider:
            status.defaultProvider,

          providers:
            status.providers
        };
      }
    );


    await this.runTest(
      'Local AI Provider',
      async () => {

        const engine =
          this.core.aiService
            .engine;


        const provider =
          engine.providers.get(
            'local'
          );


        if (!provider) {

          return {

            success:
              false,

            reason:
              'LOCAL_PROVIDER_NOT_FOUND'
          };
        }


        const result =
          await provider.generate({

            message:
              'হ্যালো Ventron',

            context:
              []
          });


        return {

          success:
            Boolean(
              result?.success &&
              result?.response
            ),

          provider:
            result?.provider,

          response:
            result?.response
        };
      }
    );


    await this.runTest(
      'AI Memory Pipeline',
      async () => {

        const result =
          await this.core.aiService.chat({

            message:
              'Ventron memory test',

            userId:
              '__selftest_user__',

            threadId:
              '__selftest_thread__',

            source:
              'selftest'
          });


        return {

          success:
            Boolean(
              result?.success &&
              result?.response
            ),

          provider:
            result?.provider,

          response:
            result?.response
        };
      }
    );


    await this.runTest(
      'Response Engine',
      async () => {

        const status =
          this.core.responseEngine
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            )
        };
      }
    );


    await this.runTest(
      'Messenger Platform',
      async () => {

        const status =
          this.core.platformManager
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            ),

          platforms:
            status.platforms ||
            status.registered ||
            []
        };
      }
    );


    await this.runTest(
      'Webhook Gateway',
      async () => {

        const status =
          this.core.webhook
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            )
        };
      }
    );


    await this.runTest(
      'Security Layer',
      async () => {

        const status =
          this.core.security
            .getStatus();


        return {

          success:
            Boolean(
              status.initialized &&
              status.started
            )
        };
      }
    );


    await this.runTest(
      'Webhook Tester',
      async () => {

        if (
          !this.core.webhookTester
        ) {

          return {

            success:
              false,

            reason:
              'WEBHOOK_TESTER_NOT_FOUND'
          };
        }


        const result =
          await this.core.webhookTester
            .testMessage(
              'হ্যালো Ventron'
            );


        return {

          success:
            Boolean(
              result?.success
            ),

          result
        };
      }
    );


    const passed =
      this.tests.filter(
        test =>
          test.success
      ).length;


    const failed =
      this.tests.length -
      passed;


    const result = {

      success:
        failed === 0,

      status:
        failed === 0
          ? 'ALL_SYSTEMS_OPERATIONAL'
          : 'ATTENTION_REQUIRED',

      total:
        this.tests.length,

      passed,

      failed,

      duration:
        Date.now() -
        started,

      timestamp:
        new Date().toISOString(),

      tests:
        this.tests
    };


    this.lastRun =
      result;


    return result;
  }


  // ═══════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════

  getStatus() {

    return {

      lastRun:
        this.lastRun
          ? this.lastRun.timestamp
          : null,

      total:
        this.lastRun?.total || 0,

      passed:
        this.lastRun?.passed || 0,

      failed:
        this.lastRun?.failed || 0,

      success:
        this.lastRun?.success || false
    };
  }
}


module.exports =
  VentronSelfTest;
