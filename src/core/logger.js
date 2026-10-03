/**
 * ╔══════════════════════════════════════════════════╗
 * ║               VENTRON AI LOGGER                ║
 * ║            Central Runtime Log System            ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const fs = require('fs');
const path = require('path');

class VentronLogger {

  constructor(config) {

    if (!config) {
      throw new Error(
        'Ventron configuration is required.'
      );
    }

    this.config = config;

    this.started =
      false;

    this.logDirectory =
      path.join(
        process.cwd(),
        'logs'
      );

    this.logFile =
      path.join(
        this.logDirectory,
        'ventron.log'
      );

    this.maxLogSize =
      Number(
        process.env.LOG_MAX_SIZE
      ) || 5 * 1024 * 1024;

    this.stats = {
      total: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0
    };
  }

  // ═══════════════════════════════════════════════
  // 🚀 START
  // ═══════════════════════════════════════════════

  start() {

    if (this.started) {
      return;
    }

    if (
      !fs.existsSync(
        this.logDirectory
      )
    ) {

      fs.mkdirSync(
        this.logDirectory,
        {
          recursive: true
        }
      );
    }

    this.started = true;

    this.info(
      'Logger started.'
    );
  }

  // ═══════════════════════════════════════════════
  // 📝 WRITE LOG
  // ═══════════════════════════════════════════════

  write(
    level,
    message,
    meta = null
  ) {

    const cleanLevel =
      String(level)
        .toUpperCase();

    const timestamp =
      new Date().toISOString();

    const text =
      typeof message === 'string'
        ? message
        : JSON.stringify(message);

    let line =
      `[${timestamp}] [${cleanLevel}] ${text}`;

    if (meta !== null) {

      let metadata;

      try {

        metadata =
          JSON.stringify(
            meta
          );

      } catch {

        metadata =
          '[metadata-unserializable]';
      }

      line +=
        ` ${metadata}`;
    }

    this.stats.total++;

    switch (
      cleanLevel
    ) {

      case 'INFO':
        this.stats.info++;
        break;

      case 'WARN':
        this.stats.warn++;
        break;

      case 'ERROR':
        this.stats.error++;
        break;

      case 'DEBUG':
        this.stats.debug++;
        break;
    }

    console.log(line);

    this.writeToFile(
      line
    );

    return line;
  }

  // ═══════════════════════════════════════════════
  // 💾 FILE WRITER
  // ═══════════════════════════════════════════════

  writeToFile(line) {

    try {

      if (
        !fs.existsSync(
          this.logDirectory
        )
      ) {

        fs.mkdirSync(
          this.logDirectory,
          {
            recursive: true
          }
        );
      }

      this.rotateIfNeeded();

      fs.appendFileSync(
        this.logFile,
        line + '\n',
        'utf8'
      );

    } catch (error) {

      console.error(
        '❌ Ventron Logger File Error:',
        error.message
      );
    }
  }

  // ═══════════════════════════════════════════════
  // 🔄 LOG ROTATION
  // ═══════════════════════════════════════════════

  rotateIfNeeded() {

    try {

      if (
        !fs.existsSync(
          this.logFile
        )
      ) {
        return;
      }

      const stats =
        fs.statSync(
          this.logFile
        );

      if (
        stats.size <
        this.maxLogSize
      ) {
        return;
      }

      const backup =
        path.join(
          this.logDirectory,
          `ventron-${Date.now()}.log`
        );

      fs.renameSync(
        this.logFile,
        backup
      );

    } catch (error) {

      console.error(
        '❌ Log rotation failed:',
        error.message
      );
    }
  }

  // ═══════════════════════════════════════════════
  // ℹ️ INFO
  // ═══════════════════════════════════════════════

  info(
    message,
    meta = null
  ) {

    return this.write(
      'INFO',
      message,
      meta
    );
  }

  // ═══════════════════════════════════════════════
  // ⚠️ WARNING
  // ═══════════════════════════════════════════════

  warn(
    message,
    meta = null
  ) {

    return this.write(
      'WARN',
      message,
      meta
    );
  }

  // ═══════════════════════════════════════════════
  // ❌ ERROR
  // ═══════════════════════════════════════════════

  error(
    message,
    meta = null
  ) {

    if (
      message instanceof Error
    ) {

      return this.write(
        'ERROR',
        message.message,
        {
          stack:
            message.stack,
          ...(
            meta &&
            typeof meta === 'object'
              ? meta
              : {}
          )
        }
      );
    }

    return this.write(
      'ERROR',
      message,
      meta
    );
  }

  // ═══════════════════════════════════════════════
  // 🐞 DEBUG
  // ═══════════════════════════════════════════════

  debug(
    message,
    meta = null
  ) {

    return this.write(
      'DEBUG',
      message,
      meta
    );
  }

  // ═══════════════════════════════════════════════
  // 📊 STATUS
  // ═══════════════════════════════════════════════

  getStatus() {

    return {

      started:
        this.started,

      directory:
        this.logDirectory,

      file:
        this.logFile,

      maxLogSize:
        this.maxLogSize,

      stats: {
        ...this.stats
      }
    };
  }

  // ═══════════════════════════════════════════════
  // 🧹 CLEAR CURRENT LOG
  // ═══════════════════════════════════════════════

  clear() {

    try {

      if (
        fs.existsSync(
          this.logFile
        )
      ) {

        fs.writeFileSync(
          this.logFile,
          '',
          'utf8'
        );
      }

      return true;

    } catch {

      return false;
    }
  }

  // ═══════════════════════════════════════════════
  // 🛑 STOP
  // ═══════════════════════════════════════════════

  stop() {

    if (!this.started) {
      return;
    }

    this.info(
      'Logger stopped.'
    );

    this.started = false;
  }
}

module.exports =
  VentronLogger;
