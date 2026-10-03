/**
 * ╔══════════════════════════════════════════════════╗
 * ║              VENTRON SERVER BRIDGE             ║
 * ║          Compatibility Entry Point             ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 *
 * NOTE:
 * The main Ventron runtime is index.js.
 * This file exists only as a compatibility entry point.
 */

'use strict';

const config =
  require('./config');

console.log(`
╔══════════════════════════════════════════════╗
║              VENTRON AI SERVER              ║
╠══════════════════════════════════════════════╣
║ 🤖 Bot      : ${config.bot.name}
║ 📦 Version  : ${config.bot.version}
║ 🚀 Runtime  : index.js
║ 🌐 Port     : ${config.server.port}
╚══════════════════════════════════════════════╝
`);

console.log(
  '⚡ Starting Ventron main runtime...\n'
);

require('./index.js');
