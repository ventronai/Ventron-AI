/**
 * ╔══════════════════════════════════════════════╗
 * ║              VENTRON AI CONFIG              ║
 * ║          FUTURE CONTROL SYSTEM              ║
 * ╚══════════════════════════════════════════════╝
 *
 * Version : 0.1.0
 * Author  : Zihad
 */

'use strict';

const config = {

  // ═══════════════════════════════════════════
  // 🤖 BOT IDENTITY
  // ═══════════════════════════════════════════
  bot: {
    name: 'Ventron AI',
    nickname: 'Ventron',
    version: '0.1.0',
    author: 'Zihad'
  },

  // ═══════════════════════════════════════════
  // ⌨️ COMMAND SYSTEM
  // ═══════════════════════════════════════════
  commands: {
    prefix: '!',
    aliases: ['v', 'ventron']
  },

  // ═══════════════════════════════════════════
  // 👑 ADMIN / OWNER
  // ═══════════════════════════════════════════
  admin: {
    uid: process.env.ADMIN_UID || 'YOUR_ADMIN_UID',
    name: 'Zihad'
  },

  // ═══════════════════════════════════════════
  // 🌐 SERVER
  // ═══════════════════════════════════════════
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT) || 3000
  },

  // ═══════════════════════════════════════════
  // 🛡️ SECURITY
  // ═══════════════════════════════════════════
  security: {
    maxRequests: Number(process.env.MAX_REQUESTS) || 30,
    cooldown: Number(process.env.COOLDOWN) || 3000
  },

  // ═══════════════════════════════════════════
  // 🔌 API
  // ═══════════════════════════════════════════
  api: {
    baseUrl: process.env.API_BASE_URL || '',
    apiKey: process.env.API_KEY || ''
  }

};

module.exports = config;
