/**
 * ╔══════════════════════════════════════════════╗
 * ║              VENTRON AI CORE                ║
 * ║        Next-Generation Bot Framework         ║
 * ╚══════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const os = require('os');

const VENTRON = {
  name: 'Ventron AI',
  version: '0.1.0',
  codename: 'Genesis',
  author: 'Zihad'
};

function getSystemInfo() {
  return {
    platform: process.platform,
    architecture: process.arch,
    node: process.version,
    cpu: os.cpus().length,
    memory: `${Math.round(os.totalmem() / 1024 / 1024)} MB`
  };
}

function printBanner() {
  console.clear();

  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║              V E N T R O N   A I                 ║
║                                                  ║
║          NEXT-GENERATION AI CORE                ║
║                                                  ║
║                 VERSION ${VENTRON.version}                    ║
║                 GENESIS                          ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`);
}

function startVentron() {
  printBanner();

  const system = getSystemInfo();

  console.log('⚡ Ventron AI Core initializing...');
  console.log('🧠 AI Engine       : STANDBY');
  console.log('🌐 API Gateway     : STANDBY');
  console.log('🧩 Plugin System   : STANDBY');
  console.log('🛡️ Security Layer  : ACTIVE');
  console.log('📡 Event Engine    : STANDBY');

  console.log('\n──────── SYSTEM ────────');
  console.log(`Platform          : ${system.platform}`);
  console.log(`Architecture      : ${system.architecture}`);
  console.log(`Node.js           : ${system.node}`);
  console.log(`CPU Cores         : ${system.cpu}`);
  console.log(`Total Memory      : ${system.memory}`);

  console.log('\n✅ Ventron AI Core initialized.');
  console.log('🚀 Framework ready for development.');
}

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Ventron AI shutting down safely...');
  process.exit(0);
});

startVentron();
