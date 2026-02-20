import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    // printQRInTerminal: true, // REMOVED: deprecated
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('Scan this QR code with WhatsApp:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('connection closed due to', lastDisconnect?.error, ', reconnecting', shouldReconnect);
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log('opened connection');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    console.log('got messages', m);
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message?.conversation) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Hello from Baileys bot!' });
    }
  });
}

startSock(); 