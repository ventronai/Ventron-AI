/**
 * ╔══════════════════════════════════════════════════╗
 * ║                 VENTRON AI CORE                 ║
 * ║          NEXT-GENERATION BOT FRAMEWORK          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const os = require('os');

const config = require('./config');
const VentronCore = require('./src/core/manager');
const VentronDiagnostics = require('./src/core/diagnostics');

// ═══════════════════════════════════════════════════
// 🤖 VENTRON IDENTITY
// ═══════════════════════════════════════════════════

const VENTRON = {
  name: config.bot.name,
  nickname: config.bot.nickname,
  version: config.bot.version,
  author: config.bot.author
};

// ═══════════════════════════════════════════════════
// 🖥️ SYSTEM INFORMATION
// ═══════════════════════════════════════════════════

function getSystemInfo() {

  const totalMemory =
    os.totalmem();

  const freeMemory =
    os.freemem();

  return {

    platform:
      process.platform,

    architecture:
      process.arch,

    node:
      process.version,

    cpuCores:
      os.cpus().length,

    totalMemoryMB:
      Math.round(
        totalMemory /
        1024 /
        1024
      ),

    freeMemoryMB:
      Math.round(
        freeMemory /
        1024 /
        1024
      ),

    uptimeSeconds:
      Math.floor(
        process.uptime()
      )
  };
}

// ═══════════════════════════════════════════════════
// 🎨 FUTURISTIC BANNER
// ═══════════════════════════════════════════════════

function printBanner() {

  console.clear();

  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║              V E N T R O N   A I                    ║
║                                                      ║
║          NEXT-GENERATION AI FRAMEWORK               ║
║                                                      ║
║              ${VENTRON.nickname.padEnd(28)}║
║              v${VENTRON.version.padEnd(27)}║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);
}

// ═══════════════════════════════════════════════════
// 📊 PRINT DIAGNOSTIC REPORT
// ═══════════════════════════════════════════════════

function printDiagnostics(report) {

  console.log(
    '\n┌──────────────────────────────────────────────┐'
  );

  console.log(
    '│          VENTRON DIAGNOSTIC REPORT           │'
  );

  console.log(
    '├──────────────────────────────────────────────┤'
  );

  console.log(
    `│ Overall Status    : ${report.status}`
  );

  console.log(
    `│ Core              : ${
      report.core.started
        ? 'ONLINE'
        : 'STANDBY'
    }`
  );

  console.log(
    `│ Command Engine    : ${
      report.commands.status
    }`
  );

  console.log(
    `│ Commands Loaded   : ${
      report.commands.count
    }`
  );

  console.log(
    `│ Command Failures  : ${
      report.commands.failed
    }`
  );

  console.log(
    `│ Security Layer    : ${
      report.security.status
    }`
  );

  console.log(
    `│ CPU Cores         : ${
      report.system.cpuCores
    }`
  );

  console.log(
    `│ Node.js           : ${
      report.system.node
    }`
  );

  console.log(
    '└──────────────────────────────────────────────┘'
  );

  if (report.commands.commands.length) {

    console.log(
      '\n🧩 Loaded Commands:'
    );

    for (
      const command
      of report.commands.commands
    ) {

      console.log(
        `   • ${config.commands.prefix}${command}`
      );
    }
  }
}

// ═══════════════════════════════════════════════════
// 🚀 START VENTRON
// ═══════════════════════════════════════════════════

async function startVentron() {

  printBanner();

  console.log(
    '⚡ Initializing Ventron AI Core...\n'
  );

  const core =
    new VentronCore(config);

  // ═══════════════════════════════════════════════
  // 🧠 CORE EVENTS
  // ═══════════════════════════════════════════════

  core.on(
    'initialized',
    (data) => {

      console.log(
        `🧠 Core initialized: ${data.bot} v${data.version}`
      );

      if (data.commands) {

        console.log(
          `🧩 Commands discovered: ${data.commands.length}`
        );
      }
    }
  );

  core.on(
    'moduleRegistered',
    ({ name }) => {

      console.log(
        `🧩 Module registered: ${name}`
      );
    }
  );

  core.on(
    'commandEngineStarted',
    (data) => {

      console.log(
        `⚡ Command Engine online: ${data.commands.length} commands`
      );
    }
  );

  core.on(
    'started',
    () => {

      console.log(
        '🚀 Ventron Core started.'
      );
    }
  );

  core.on(
    'moduleError',
    ({ name, error }) => {

      console.error(
        `❌ Module error [${name}]:`,
        error.message
      );
    }
  );

  core.on(
    'stopped',
    () => {

      console.log(
        '🛑 Ventron Core stopped.'
      );
    }
  );

  // ═══════════════════════════════════════════════
  // 🧠 INITIALIZE CORE
  // ═══════════════════════════════════════════════

  core.initialize();

  const system =
    getSystemInfo();

  console.log(
    '\n┌──────────────────────────────────────────────┐'
  );

  console.log(
    '│              VENTRON CORE STATUS             │'
  );

  console.log(
    '├──────────────────────────────────────────────┤'
  );

  console.log(
    '│ 🧠 AI Engine       : STANDBY                 │'
  );

  console.log(
    '│ 🌐 API Gateway     : STANDBY                 │'
  );

  console.log(
    '│ 🧩 Plugin Engine   : STANDBY                 │'
  );

  console.log(
    '│ 📡 Event Engine    : STANDBY                 │'
  );

  console.log(
    '│ 🛡️ Security Layer  : ACTIVE                 │'
  );

  console.log(
    '│ 💾 Database        : STANDBY                 │'
  );

  console.log(
    '│ ⚡ Command Engine  : INITIALIZING            │'
  );

  console.log(
    '└──────────────────────────────────────────────┘'
  );

  console.log(
    '\n┌──────────────────────────────────────────────┐'
  );

  console.log(
    '│                 SYSTEM INFO                  │'
  );

  console.log(
    '├──────────────────────────────────────────────┤'
  );

  console.log(
    `│ Platform          : ${system.platform}`
  );

  console.log(
    `│ Architecture      : ${system.architecture}`
  );

  console.log(
    `│ Node.js           : ${system.node}`
  );

  console.log(
    `│ CPU Cores         : ${system.cpuCores}`
  );

  console.log(
    `│ Total Memory      : ${system.totalMemoryMB} MB`
  );

  console.log(
    `│ Free Memory       : ${system.freeMemoryMB} MB`
  );

  console.log(
    '└──────────────────────────────────────────────┘'
  );

  console.log(
    '\n────────────────────────────────────────────────'
  );

  console.log(
    `🤖 Bot       : ${VENTRON.name}`
  );

  console.log(
    `✨ Nickname  : ${VENTRON.nickname}`
  );

  console.log(
    `📦 Version   : ${VENTRON.version}`
  );

  console.log(
    `👑 Author    : ${VENTRON.author}`
  );

  console.log(
    `⌨️ Prefix    : ${config.commands.prefix}`
  );

  console.log(
    `🔐 Admin     : ${config.admin.name}`
  );

  console.log(
    '\n────────────────────────────────────────────────'
  );

  // ═══════════════════════════════════════════════
  // 🚀 START CORE
  // ═══════════════════════════════════════════════

  await core.start();

  // ═══════════════════════════════════════════════
  // 🩺 DIAGNOSTICS
  // ═══════════════════════════════════════════════

  const diagnostics =
    new VentronDiagnostics(core);

  const report =
    diagnostics.getReport();

  printDiagnostics(report);

  console.log(
    '\n────────────────────────────────────────────────'
  );

  console.log(
    '✅ Ventron AI is ready.'
 
