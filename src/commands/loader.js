/**
 * ╔══════════════════════════════════════════════════╗
 * ║             VENTRON COMMAND LOADER             ║
 * ║          Dynamic Command Discovery System       ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const fs = require('fs');
const path = require('path');

class CommandLoader {

  constructor(handler, options = {}) {
    if (!handler) {
      throw new Error('Command handler is required.');
    }

    this.handler = handler;

    this.commandsPath =
      options.commandsPath ||
      path.join(__dirname);

    this.loaded = [];
    this.failed = [];
  }

  /**
   * Check whether a file is a JavaScript command file
   */
  isCommandFile(file) {
    return (
      file.endsWith('.js') &&
      file !== path.basename(__filename)
    );
  }

  /**
   * Load one command file
   */
  loadFile(filePath) {
    try {
      delete require.cache[require.resolve(filePath)];

      const command = require(filePath);

      if (!command || typeof command !== 'object') {
        throw new Error('Command module must export an object.');
      }

      this.handler.register(command);

      const name = command.name;

      this.loaded.push({
        name,
        file: filePath
      });

      return {
        success: true,
        name
      };

    } catch (error) {

      this.failed.push({
        file: filePath,
        error: error.message
      });

      return {
        success: false,
        file: filePath,
        error: error.message
      };
    }
  }

  /**
   * Load all commands
   */
  loadAll() {
    if (!fs.existsSync(this.commandsPath)) {
      throw new Error(
        `Commands directory does not exist: ${this.commandsPath}`
      );
    }

    const files = fs.readdirSync(this.commandsPath);

    for (const file of files) {

      if (!this.isCommandFile(file)) {
        continue;
      }

      const filePath = path.join(this.commandsPath, file);

      if (!fs.statSync(filePath).isFile()) {
        continue;
      }

      this.loadFile(filePath);
    }

    return {
      loaded: this.loaded,
      failed: this.failed
    };
  }

  /**
   * Reload one command
   */
  reload(name) {
    const command = this.handler.get(name);

    if (!command) {
      return {
        success: false,
        error: `Command "${name}" is not registered.`
      };
    }

    const loadedCommand = this.loaded.find(
      item => item.name === command.name
    );

    if (!loadedCommand) {
      return {
        success: false,
        error: `Command "${name}" was not loaded by this loader.`
      };
    }

    this.handler.unregister(command.name);

    return this.loadFile(loadedCommand.file);
  }

  /**
   * Get loader status
   */
  getStatus() {
    return {
      commandsPath: this.commandsPath,
      loadedCount: this.loaded.length,
      failedCount: this.failed.length,
      loaded: this.loaded,
      failed: this.failed
    };
  }
}

module.exports = CommandLoader;
