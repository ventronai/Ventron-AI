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
// 🚀 CORE INITIALIZATION
// ═══════════════════════════════════════════════════

function initializeCore() {
  printBanner();

  console.log('⚡ Initializing Ventron AI Core...\n');

  console.log('┌──────────────────────────────────────────────┐');
  console.log('│              VENTRON CORE STATUS             │');
  console.log('├──────────────────────────────────────────────┤');
  console.log('│ 🧠 AI Engine       : STANDBY                 │');
  console.log('│ 🌐 API Gateway     : STANDBY                 │');
  console.log('│ 🧩 Plugin Engine   : STANDBY                 │');
  console.log('│ 📡 Event Engine    : STANDBY                 │');
  console.log('│ 🛡️ Security Layer  : ACTIVE                  │');
  console.log('│ 💾 Database        : STANDBY                 │');
  console.log('└──────────────────────────────────────────────┘');

  const system = getSystemInfo();

  console.log('\n┌──────────────────────────────────────────────┐');
  console.log('│                 SYSTEM INFO                  │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│ Platform          : ${system.platform}`);
  console.log(`│ Architecture      : ${system.architecture}`);
  console.log(`│ Node.js           : ${system.node}`);
  console.log(`│ CPU Cores         : ${system.cpuCores}`);
  console.log(`│ Total Memory      : ${system.totalMemoryMB} MB`);
  console.log(`│ Free Memory       : ${system.freeMemoryMB} MB`);
  console.log(`│ Process Uptime    : ${system.uptimeSeconds}s`);
  console.log('└──────────────────────────────────────────────┘');

  console.log('\n────────────────────────────────────────────────');

  console.log(`🤖 Bot       : ${VENTRON.name}`);
  console.log(`✨ Nickname  : ${VENTRON.nickname}`);
  console.log(`📦 Version   : ${VENTRON.version}`);
  console.log(`👑 Author    : ${VENTRON.author}`);
  console.log(`⌨️ Prefix    : ${config.commands.prefix}`);
  console.log(`🔐 Admin     : ${config.admin.name}`);

  console.log('\n────────────────────────────────────────────────');

  console.log('✅ Ventron AI Core initialized successfully.');
  console.log('🚀 Framework is ready for the next development stage.\n');
}

// ═══════════════════════════════════════════════════
// 🛡️ GLOBAL ERROR HANDLING
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

process.on('SIGINT', () => {
  console.log('\n\n🛑 Ventron AI is shutting down safely...');
  console.log('👋 Goodbye.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Ventron AI received shutdown signal.');
  process.exit(0);
});

// ═══════════════════════════════════════════════════
// ▶️ START
// ═══════════════════════════════════════════════════

initializeCore();
