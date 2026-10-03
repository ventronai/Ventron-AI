/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON AI SELF TEST              ║
 * ║          FULL SYSTEM DIAGNOSTIC CORE            ║
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

    this.lastResult = null;

    this.stats = {
      runs: 0,
      passed: 0,
      failed: 0
    };
  }


  /* ═══════════════════════════════════════
     SINGLE TEST HELPER
  ═══════════════════════════════════════ */

  check(
    name,
    condition,
    details = null
  ) {

    const passed =
      Boolean(condition);

    return {
      name,
      passed,
      status:
        passed
          ? 'PASS'
          : 'FAIL',
      details:
        details || (
          passed
            ? 'OK'
            : 'Test condition failed.'
        )
    };
  }


  /* ═══════════════════════════════════════
     RUN ALL TESTS
  ═══════════════════════════════════════ */

  async runAll() {

    this.stats.runs++;

    const startedAt =
      Date.now();

    const tests = [];


    /* ═══════════════════════════════════
       CORE
    ═══════════════════════════════════ */

    try {

      const status =
        this.core.getStatus();

      tests.push(
        this.check(
          'Core',
          Boolean(status),
          'Core status available.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Core',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       STORAGE
    ═══════════════════════════════════ */

    try {

      const storage =
        this.core.storage;

      const status =
        storage.getStatus();

      tests.push(
        this.check(
          'Storage Manager',
          Boolean(
            status &&
            status.initialized
          ),
          'Storage manager initialized.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Storage Manager',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       PROFILE
    ═══════════════════════════════════ */

    const testUserId =
      '__selftest_user__';

    const testThreadId =
      '__selftest_thread__';


    try {

      const profile =
        this.core.profile;


      const savedUser =
        profile.touchUser(
          testUserId,
          {
            name: 'Ventron Test',
            firstName: 'Ventron',
            platform: 'selftest',
            language: 'bn'
          }
        );


      const savedThread =
        profile.touchThread(
          testThreadId,
          {
            name: 'Self Test Thread',
            type: 'conversation',
            platform: 'selftest',
            userId: testUserId
          }
        );


      const user =
        profile.getUser(
          testUserId
        );


      const thread =
        profile.getThread(
          testThreadId
        );


      tests.push(
        this.check(
          'Profile Manager',
          Boolean(
            savedUser &&
            savedThread &&
            user &&
            thread
          ),
          'User and thread profiles are working.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Profile Manager',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       COMMAND ENGINE
    ═══════════════════════════════════ */

    try {

      const status =
        this.core.commandEngine.getStatus();


      tests.push(
        this.check(
          'Command Engine',
          Boolean(
            status &&
            status.initialized
          ),
          'Command engine initialized.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Command Engine',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       EVENT GATEWAY
    ═══════════════════════════════════ */

    try {

      const status =
        this.core.eventGateway.getStatus();


      tests.push(
        this.check(
          'Event Gateway',
          Boolean(
            status &&
            status.initialized
          ),
          'Event gateway initialized.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Event Gateway',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       MESSAGE ROUTER
    ═══════════════════════════════════ */

    try {

      const status =
        this.core.messageRouter.getStatus();


      tests.push(
        this.check(
          'Message Router',
          Boolean(
            status &&
            status.initialized
          ),
          'Message router initialized.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Message Router',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       AI ENGINE
    ═══════════════════════════════════ */

    try {

      const ai =
        this.core.aiService;

      const status =
        ai.engine.getStatus();


      const local =
        ai.engine.getProvider(
          'local'
        );


      tests.push(
        this.check(
          'AI Engine',
          Boolean(
            status &&
            status.initialized &&
            local
          ),
          'AI Engine and Local Provider are available.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'AI Engine',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       AI MEMORY
    ═══════════════════════════════════ */

    try {

      const memory =
        this.core.aiService.memory;


      memory.addMessage(
        testUserId,
        testThreadId,
        {
          role: 'user',
          content: 'Ventron memory test'
        }
      );


      const messages =
        memory.getMessages(
          testUserId,
          testThreadId
        );


      const context =
        memory.getContext(
          testUserId,
          testThreadId
        );


      tests.push(
        this.check(
          'AI Memory',
          Boolean(
            messages &&
            messages.length > 0 &&
            typeof context === 'string'
          ),
          'Persistent AI memory is working.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'AI Memory',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       AI CHAT
    ═══════════════════════════════════ */

    try {

      const result =
        await this.core.aiService.chat({

          message:
            'হ্যালো Ventron',

          userId:
            testUserId,

          threadId:
            testThreadId,

          source:
            'selftest'
        });


      tests.push(
        this.check(
          'AI Chat',
          Boolean(
            result &&
            result.success &&
            result.response
          ),
          result?.response
            ? `AI response: ${result.response}`
            : 'AI response was not generated.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'AI Chat',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       RESPONSE ENGINE
    ═══════════════════════════════════ */

    try {

      const response =
        this.core.responseEngine.normalize(
          {
            response:
              'Ventron response test'
          }
        );


      tests.push(
        this.check(
          'Response Engine',
          Boolean(response),
          'Response normalization is working.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Response Engine',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       MESSENGER PLATFORM
    ═══════════════════════════════════ */

    try {

      const adapter =
        this.core.platformManager.get(
          'messenger'
        );


      tests.push(
        this.check(
          'Messenger Platform',
          Boolean(adapter),
          'Messenger adapter is registered.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Messenger Platform',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       WEBHOOK
    ═══════════════════════════════════ */

    try {

      const status =
        this.core.webhook.getStatus();


      tests.push(
        this.check(
          'Webhook Gateway',
          Boolean(status),
          'Webhook gateway is available.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Webhook Gateway',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       SECURITY
    ═══════════════════════════════════ */

    try {

      const status =
        this.core.security.getStatus();


      tests.push(
        this.check(
          'Security Layer',
          Boolean(status),
          'Security manager is available.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Security Layer',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       WEBHOOK TESTER
    ═══════════════════════════════════ */

    try {

      const status =
        this.core.webhookTester.getStatus();


      tests.push(
        this.check(
          'Webhook Tester',
          Boolean(status),
          'Internal webhook tester is available.'
        )
      );

    } catch (error) {

      tests.push(
        this.check(
          'Webhook Tester',
          false,
          error.message
        )
      );
    }


    /* ═══════════════════════════════════
       CLEAN TEST DATA
    ═══════════════════════════════════ */

    try {

      if (
        this.core.aiService &&
        this.core.aiService.memory
      ) {

        this.core.aiService.memory.clearSession(
          testUserId,
          testThreadId
        );
      }


      if (
        this.core.storage
      ) {

        this.core.storage.deleteMemory(
          `${testUserId}:${testThreadId}`
        );
      }


      /*
       * Remove self-test profile data
       */

      if (
        this.core.storage &&
        this.core.storage.data
      ) {

        delete this.core.storage.data.users[
          testUserId
        ];

        delete this.core.storage.data.threads[
          testThreadId
        ];

        this.core.storage.save();
      }

    } catch (error) {

      /*
       * Cleanup failure does not fail
       * the main system test.
       */

    }


    /* ═══════════════════════════════════
       FINAL RESULT
    ═══════════════════════════════════ */

    const passed =
      tests.filter(
        test => test.passed
      ).length;


    const failed =
      tests.filter(
        test => !test.passed
      ).length;


    const duration =
      Date.now() - startedAt;


    const success =
      failed === 0;


    if (success) {
      this.stats.passed++;
    } else {
      this.stats.failed++;
    }


    const result = {

      success,

      status:
        success
          ? 'ALL_SYSTEMS_OPERATIONAL'
          : 'ATTENTION_REQUIRED',

      timestamp:
        new Date().toISOString(),

      durationMs:
        duration,

      summary: {

        total:
          tests.length,

        passed,

        failed

      },

      tests,

      stats:
        {
          ...this.stats
        }
    };


    this.lastResult =
      result;


    return result;
  }


  /* ═══════════════════════════════════════
     LAST RESULT
  ═══════════════════════════════════════ */

  getLastResult() {

    return this.lastResult;
  }


  /* ═══════════════════════════════════════
     STATUS
  ═══════════════════════════════════════ */

  getStatus() {

    return {

      runs:
        this.stats.runs,

      passed:
        this.stats.passed,

      failed:
        this.stats.failed,

      lastResult:
        this.lastResult
          ? {
              success:
                this.lastResult.success,

              status:
                this.lastResult.status,

              durationMs:
                this.lastResult.durationMs
            }
          : null
    };
  }
}


module.exports =
  VentronSelfTest;
