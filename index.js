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
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  return {
    platform: process.platform,
    architecture: process.arch,
    node: process.version,
    cpuCores: os.cpus().length,
    totalMemoryMB: Math.round(totalMemory / 1024 / 1024),
    freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
    uptimeSeconds: Math.floor(process.uptime())
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
║              V E N T R O N   A I                     ║
║                                                      ║
║          NEXT-GENERATION AI FRAMEWORK                ║
║                                                      ║
║              ${VENTRON.nickname.padEnd(28)}║
║              v${VENTRON.version.padEnd(27)}║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);
}

// ═══════════════════════════════════════════════════
// 🚀 CORE STARTUP
// ═══════════════════════════════════════════════════

async function startVentron() {
  printBanner();

  console.log('⚡ Initializing Ventron AI Core...\n');

  const core = new VentronCore(config);

  // Core Events
  core.on('initialized', (data) => {
    console.log(`🧠 Core initialized: ${data.bot} v${data.version}`);
  });

  core.on('moduleRegistered', ({ name }) => {
    console.log(`🧩 Module registered: ${name}`);
  });

  core.on('started', () => {
    console.log('🚀 Ventron Core started.');
  });

  core.on('stopped', () => {
    console.log('🛑 Ventron Core stopped.');
  });

  // Initialize
  core.initialize();

  const system = getSystemInfo();

  console.log('\n┌──────────────────────────────────────────────┐');
  console.log('│              VENTRON CORE STATUS             │');
  console.log('├──────────────────────────────────────────────┤');
  console.log('│ 🧠 AI Engine       : STANDBY                 │');
  console.log('│ 🌐 API Gateway     : STANDBY                 │');
  console.log('│ 🧩 Plugin Engine   : STANDBY                 │');
  console.log('│ 📡 Event Engine    : STANDBY                 │');
  console.log('│ 🛡️ Security Layer  : ACTIVE                  │');
  console.log('│ 💾 Database        : STANDBY                 │');
  console.log('└──────────────────────────────────────────────┘');

  console.log('\n┌──────────────────────────────────────────────┐');
  console.log('│                 SYSTEM INFO                  │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│ Platform          : ${system.platform}`);
  console.log(`│ Architecture      : ${system.architecture}`);
  console.log(`│ Node.js           : ${system.node}`);
  console.log(`│ CPU Cores         : ${system.cpuCores}`);
  console.log(`│ Total Memory      : ${system.totalMemoryMB} MB`);
  console.log(`│ Free Memory       : ${system.freeMemoryMB} MB`);
  console.log('└──────────────────────────────────────────────┘');

  console.log('\n────────────────────────────────────────────────');

  console.log(`🤖 Bot       : ${VENTRON.name}`);
  console.log(`✨ Nickname  : ${VENTRON.nickname}`);
  console.log(`📦 Version   : ${VENTRON.version}`);
  console.log(`👑 Author    : ${VENTRON.author}`);
  console.log(`⌨️ Prefix    : ${config.commands.prefix}`);
  console.log(`🔐 Admin     : ${config.admin.name}`);

  console.log('\n────────────────────────────────────────────────');

  await core.start();

  console.log('\n✅ Ventron AI is ready.');
  console.log('🌐 Core architecture is online.');
  console.log('🚀 Waiting for modules...\n');

  return core;
}

// ═══════════════════════════════════════════════════
// 🛡️ ERROR HANDLING
// ═══════════════════════════════════════════════════

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception');
  console.error(error);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ Unhandled Promise Rejection');
  console.error(reason);
});

// ═══════════════════════════════════════════════════
// 🛑 SAFE SHUTDOWN
// ═══════════════════════════════════════════════════

let ventronCore = null;

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutdown signal received.');

  if (ventronCore) {
    await ventronCore.stop();
  }

  console.log('✅ Ventron AI stopped safely.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Termination signal received.');

  if (ventronCore) {
    await ventronCore.stop();
  }

  console.log('✅ Ventron AI stopped safely.');
  process.exit(0);
});

// ═══════════════════════════════════════════════════
// ▶️ BOOT
// ═══════════════════════════════════════════════════

startVentron()
  .then((core) => {
    ventronCore = core;
  })
  .catch((error) => {
    console.error('\n❌ Ventron AI failed to start.');
    console.error(error);
    process.exit(1);
  });
