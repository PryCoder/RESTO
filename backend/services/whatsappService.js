import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// In-memory session state (for demo; use DB or file for production)
let sock = null;
let isEnabled = false;
let qrCallback = null;
let isConnected = false;
let lastConnectAttempt = 0;
let connectAttempts = 0;
let backendJwtToken = null;
let lastDisconnectStatusCode = null;
let lastDisconnectAt = null;

function setBackendJwtToken(token) {
  backendJwtToken = token || null;
}

class WhatsAppBotError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'WhatsAppBotError';
    this.code = code;
  }
}

function deleteAuthFolder() {
  const authPath = path.resolve('./whatsapp_auth');
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
  }
}

function resetWhatsAppAuth() {
  try {
    if (sock) {
      try { sock.end(); } catch { /* ignore */ }
    }
  } finally {
    sock = null;
    isEnabled = false;
    isConnected = false;
    try { deleteAuthFolder(); } catch { /* ignore */ }
  }
}

async function startWhatsAppBot(onQR, reset = false) {
  try {
    // Rate limit connection attempts
    const now = Date.now();
    if (now - lastConnectAttempt < 10000) { // 10 seconds
      connectAttempts++;
      if (connectAttempts > 5) {
        console.error('[E1] Too many WhatsApp sign-in attempts. Please wait and try again.');
        throw new WhatsAppBotError('Too many WhatsApp sign-in attempts. Please wait and try again.', 'E1');
      }
    } else {
      connectAttempts = 0;
    }
    lastConnectAttempt = now;
    if (reset) {
      try {
        deleteAuthFolder();
      } catch (e) {
        console.error('[E2] Failed to delete auth folder:', e);
        throw new WhatsAppBotError('Failed to delete auth folder: ' + (e.message || e.toString()), 'E2');
      }
      sock = null;
      isEnabled = false;
      isConnected = false;
    }
    if (sock) return sock;
    let state, saveCreds;
    try {
      ({ state, saveCreds } = await useMultiFileAuthState('./whatsapp_auth'));
    } catch (e) {
      console.error('[E3] Failed to load WhatsApp auth state:', e);
      throw new WhatsAppBotError('Failed to load WhatsApp auth state: ' + (e.message || e.toString()), 'E3');
    }
    let version;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch (e) {
      console.error('[E4] Failed to fetch latest Baileys version:', e);
      throw new WhatsAppBotError('Failed to fetch latest Baileys version: ' + (e.message || e.toString()), 'E4');
    }
    try {
      sock = makeWASocket({
        version,
        auth: state,
        getMessage: async (key) => ({}),
      });
    } catch (e) {
      console.error('[E5] Failed to create WhatsApp socket:', e);
      throw new WhatsAppBotError('Failed to create WhatsApp socket: ' + (e.message || e.toString()), 'E5');
    }
    isEnabled = true;
    if (onQR) qrCallback = onQR;

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr && qrCallback) {
        try {
          qrCallback(qr);
        } catch (e) {
          console.error('[E6] Error in QR callback:', e);
        }
      }
      if (connection === 'open') {
        isConnected = true;
        lastDisconnectStatusCode = null;
        lastDisconnectAt = null;
        console.log('[I1] WhatsApp bot is connected and ready.');
      } else if (connection === 'close') {
        isConnected = false;
        lastDisconnectStatusCode = lastDisconnect?.error?.output?.statusCode ?? null;
        lastDisconnectAt = new Date();
        if (lastDisconnect?.error) {
          const errMsg = lastDisconnect.error.message || lastDisconnect.error.toString();
          console.error('[E7] WhatsApp connection closed:', errMsg);
        }
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        // IMPORTANT: when the socket closes, Baileys requires a new socket for reconnection.
        // Keeping a stale `sock` prevents reconnect because startWhatsAppBot() short-circuits.
        try { sock?.end(); } catch { /* ignore */ }
        sock = null;

        if (!isLoggedOut) {
          console.warn('[W1] Attempting to reconnect WhatsApp bot in 10s...');
          setTimeout(() => startWhatsAppBot(qrCallback), 10000);
        } else {
          isEnabled = false;
          console.warn('[W2] WhatsApp bot logged out (401). Call /api/whatsapp/enable?reset=true to re-pair.');
        }
      } else if (connection === 'connecting') {
        console.log('[I2] WhatsApp bot is connecting...');
      } else {
        console.warn('[W3] Unknown WhatsApp connection state:', connection);
      }
    });
    sock.ev.on('creds.update', (creds) => {
      try {
        saveCreds(creds);
      } catch (e) {
        console.error('[E8] Failed to save WhatsApp credentials:', e);
      }
    });

    sock.ev.on('connection.failure', (failure) => {
      console.error('[E9] WhatsApp connection failure:', failure);
      if (failure?.reason) {
        console.error('[E10] Failure reason:', failure.reason);
      }
      if (failure?.stack) {
        console.error('[E11] Failure stack:', failure.stack);
      }
    });

    // Handle incoming messages (full manager dashboard features)
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages?.[0];
      if (!msg?.message?.conversation) return;
      const text = msg.message.conversation.toLowerCase();
      const jid = msg.key.remoteJid;

      try {
        // === ORDER CREATION ===
        if (text.startsWith('order')) {
          const items = parseOrderItems(text);
          await axios.post(`${BACKEND_URL}/api/orders/create`, {
            table: 'WhatsApp',
            items
          }, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });
          await sock.sendMessage(jid, { text: 'Order placed!' });
        }
        // === ANALYTICS QUERY ===
        else if (text.includes('profit') || text.includes('sales')) {
          const res2 = await axios.post(`${BACKEND_URL}/api/ai/sales-profit-advisor`, {
            voiceInput: text,
          }, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });

          const totalSales = res2.data?.totalSales ?? '₹0';
          const profit = res2.data?.profit ?? '₹0';
          const tip = res2.data?.tip ? `\nTip: ${res2.data.tip}` : '';
          await sock.sendMessage(jid, { text: `Sales: ${totalSales}\nProfit: ${profit}${tip}` });
        }
        // === INVENTORY UPDATE ===
        else if (text.startsWith('add inventory')) {
          const [_, name, quantity] = text.split(' ');
          await axios.post(`${BACKEND_URL}/api/orders/inventory/upsert`, { name, quantity: Number(quantity) }, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });
          await sock.sendMessage(jid, { text: `Inventory updated: ${name} +${quantity}` });
        }
        // === WASTE ALERTS ===
        else if (text.includes('waste')) {
          const res2 = await axios.post(`${BACKEND_URL}/api/ai/inventory-waste-alert`, {}, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });

          const alerts = Array.isArray(res2.data?.alerts) ? res2.data.alerts : [];
          await sock.sendMessage(jid, {
            text: alerts.length
              ? `Waste Alerts:\n${alerts.map(a => `${a.item}: ${a.reason}`).join('\n')}`
              : 'No waste alerts right now.'
          });
        }
        // === UPSALE SUGGESTIONS ===
        else if (text.includes('upsell')) {
          const res2 = await axios.get(`${BACKEND_URL}/api/ai/upsell`, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });
          await sock.sendMessage(jid, { text: `Upsell Suggestions:\n${res2.data.suggestions.map(s => `${s.base} → ${s.upsell}`).join('\n')}` });
        }
        // Add more commands as needed!
      } catch (err) {
        console.error('[E12] Error handling incoming WhatsApp message:', err);
        await sock.sendMessage(jid, { text: 'Error: ' + (err.response?.data?.error || err.message) });
      }
    });
    return sock;
  } catch (err) {
    console.error('[E13] Error starting WhatsApp bot:', err);
    if (err.stack) console.error('[E14] Stack trace:', err.stack);
    if (err instanceof WhatsAppBotError) throw err;
    throw new WhatsAppBotError('Failed to start WhatsApp bot: ' + (err.message || err.toString()), 'E13');
  }
}

async function enableWhatsAppBot(onQR, reset = false) {
  return startWhatsAppBot(onQR, reset);
}

function disableWhatsAppBot() {
  if (sock) {
    sock.end();
    sock = null;
    isEnabled = false;
  }
}

async function sendWhatsAppMessage(jid, text) {
  if (!sock || !isConnected) {
    console.error('WhatsApp bot is not enabled or not connected.');
    throw new Error('WhatsApp bot not enabled or not connected');
  }
  if (!jid || typeof jid !== 'string') {
    console.error('Invalid JID provided to sendWhatsAppMessage:', jid);
    throw new Error('Invalid JID');
  }
  if (!text || typeof text !== 'string') {
    console.error('Invalid text provided to sendWhatsAppMessage:', text);
    throw new Error('Invalid message text');
  }
  console.log('Sending WhatsApp message:', { jid, text });
  try {
    await sock.sendMessage(jid, { text });
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
    throw err;
  }
}

function isWhatsAppEnabled() {
  return isEnabled && isConnected;
}

function getWhatsAppStatus() {
  return {
    enabled: isEnabled,
    connected: isConnected,
    lastDisconnectStatusCode,
    lastDisconnectAt,
  };
}

function parseOrderItems(text) {
  // "order 2 butter naan, 1 paneer tikka"
  return text.replace('order', '').split(',').map(item => {
    const [qty, ...nameArr] = item.trim().split(' ');
    return { name: nameArr.join(' '), quantity: Number(qty) };
  });
}

export default {
  enableWhatsAppBot,
  disableWhatsAppBot,
  resetWhatsAppAuth,
  setBackendJwtToken,
  sendWhatsAppMessage,
  isWhatsAppEnabled,
  getWhatsAppStatus,
  // TODO: add group creation, announcement scheduling, Gemini integration, persistent session storage
}; 