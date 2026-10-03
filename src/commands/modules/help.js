/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON HELP COMMAND              ║
 * ║           Command System Test Module           ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

module.exports = {
  name: 'help',

  aliases: ['h', 'commands'],

  description: 'Show available Ventron AI commands.',

  usage: '!help',

  async execute(context) {
    const { config, handler } = context;

    const commands = handler
      ? handler.list()
      : [];

    const prefix = config.commands.prefix;

    return {
      type: 'text',
      text: [
        '╔════════════════════════════════════╗',
        '║          ⚡ VENTRON AI            ║',
        '║        COMMAND CENTER             ║',
        '╚════════════════════════════════════╝',
        '',
        `🤖 ${config.bot.name}`,
        `📦 Version: ${config.bot.version}`,
        '',
        '📚 Available Commands:',
        '',
        ...commands.map(
          command => `• ${prefix}${command}`
        ),
        '',
        `💡 Try: ${prefix}help`,
        '',
        '⚡ Ventron AI Command Engine'
      ].join('\n')
    };
  }
};
