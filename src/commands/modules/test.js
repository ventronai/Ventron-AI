/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON SYSTEM TEST               ║
 * ║          Development Pipeline Command           ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

module.exports = {

  name: 'test',

  aliases: [
    'systemtest',
    'check'
  ],

  description:
    'Run Ventron internal system tests.',

  usage:
    '!test',

  async execute(context) {

    const core =
      context.event?.core ||
      context.core ||
      null;

    /*
     * Command context থেকে Core পাওয়া না গেলে
     * manager-এর মাধ্যমে test command পরে
     * ব্যবহার করা যাবে।
     */

    if (!core) {

      return {
        type: 'text',

        text: [
          '╔════════════════════════════════════╗',
          '║        ⚡ VENTRON SYSTEM TEST      ║',
          '╚════════════════════════════════════╝',
          '',
          '🧪 Test command loaded successfully.',
          '',
          'ℹ️ Full runtime self-test is available',
          'through the Ventron Self-Test system.',
          '',
          '🌐 Endpoint: /selftest',
          '',
          '⚡ Ventron AI Development Mode'
        ].join('\n')
      };
    }

    const result =
      await core.runSelfTest();

    const lines = [
      '╔════════════════════════════════════╗',
      '║        ⚡ VENTRON SYSTEM TEST      ║',
      '╚════════════════════════════════════╝',
      '',
      `📊 Total : ${result.total}`,
      `✅ Passed: ${result.passed}`,
      `❌ Failed: ${result.failed}`,
      '',
      `🚦 Result: ${
        result.success
          ? 'SYSTEM READY'
          : 'CHECK REQUIRED'
      }`,
      ''
    ];

    for (
      const test
      of result.tests
    ) {

      lines.push(
        `${test.passed ? '✅' : '❌'} ${test.name}`
      );
    }

    lines.push(
      '',
      '⚡ Ventron AI'
    );

    return {
      type: 'text',

      text:
        lines.join('\n')
    };
  }
};
