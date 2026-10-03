/**
 * ╔══════════════════════════════════════════════════╗
 * ║            VENTRON COMMAND HANDLER             ║
 * ║        Modular Command Processing Engine        ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

class CommandHandler {

  constructor(config) {
    this.config = config;
    this.commands = new Map();
    this.aliases = new Map();
  }

  /**
   * Register a command
   */
  register(command) {
    if (!command || typeof command !== 'object') {
      throw new TypeError('Command must be an object.');
    }

    if (!command.name || typeof command.name !== 'string') {
      throw new Error('Command name is required.');
    }

    const name = command.name.toLowerCase().trim();

    if (this.commands.has(name)) {
      throw new Error(`Command "${name}" is already registered.`);
    }

    this.commands.set(name, command);

    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        if (typeof alias !== 'string') {
          continue;
        }

        const cleanAlias = alias.toLowerCase().trim();

        if (cleanAlias) {
          this.aliases.set(cleanAlias, name);
        }
      }
    }

    return true;
  }

  /**
   * Remove a command
   */
  unregister(name) {
    const commandName = String(name).toLowerCase().trim();
    const command = this.commands.get(commandName);

    if (!command) {
      return false;
    }

    this.commands.delete(commandName);

    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        this.aliases.delete(String(alias).toLowerCase().trim());
      }
    }

    return true;
  }

  /**
   * Find command
   */
  get(name) {
    const commandName = String(name).toLowerCase().trim();

    if (this.commands.has(commandName)) {
      return this.commands.get(commandName);
    }

    const mainName = this.aliases.get(commandName);

    if (mainName) {
      return this.commands.get(mainName);
    }

    return null;
  }

  /**
   * Check command existence
   */
  has(name) {
    return Boolean(this.get(name));
  }

  /**
   * List registered commands
   */
  list() {
    return Array.from(this.commands.keys());
  }

  /**
   * Parse message
   */
  parse(message) {
    if (typeof message !== 'string') {
      return null;
    }

    const prefix = this.config.commands.prefix;

    if (!message.startsWith(prefix)) {
      return null;
    }

    const content = message.slice(prefix.length).trim();

    if (!content) {
      return null;
    }

    const parts = content.split(/\s+/);

    const commandName = parts.shift().toLowerCase();

    return {
      prefix,
      commandName,
      args: parts,
      text: parts.join(' '),
      raw: content
    };
  }

  /**
   * Execute command
   */
  async execute(message, context = {}) {
    const parsed = this.parse(message);

    if (!parsed) {
      return {
        handled: false,
        reason: 'NOT_A_COMMAND'
      };
    }

    const command = this.get(parsed.commandName);

    if (!command) {
      return {
        handled: false,
        reason: 'COMMAND_NOT_FOUND',
        commandName: parsed.commandName
      };
    }

    if (typeof command.execute !== 'function') {
      return {
        handled: false,
        reason: 'COMMAND_EXECUTOR_MISSING',
        commandName: parsed.commandName
      };
    }

    const commandContext = {
      ...context,
      config: this.config,
      command: parsed.commandName,
      args: parsed.args,
      text: parsed.text,
      raw: parsed.raw
    };

    const result = await command.execute(commandContext);

    return {
      handled: true,
      command: parsed.commandName,
      result
    };
  }
}

module.exports = CommandHandler;
