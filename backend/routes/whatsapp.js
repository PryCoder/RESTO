import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import * as whatsappController from '../controllers/whatsappController.js';
dotenv.config();

const router = express.Router();

// Baileys bot endpoints
router.post('/enable', whatsappController.enable);
router.post('/disable', whatsappController.disable);
router.post('/send-message', whatsappController.sendMessage);

// Verification endpoint for Meta
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Main webhook for incoming messages (Meta)
router.post('/webhook', async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];
  const from = message?.from;
  const text = message?.text?.body?.toLowerCase();

  if (text) {
    // === ORDER CREATION ===
    if (text.startsWith('order')) {
      const items = parseOrderItems(text);
      await axios.post('http://localhost:5000/api/orders/create', {
        table: 'WhatsApp',
        items
      });
      await sendWhatsAppReply(from, 'Order placed!');
    }
    // === ANALYTICS QUERY ===
    else if (text.includes('profit') || text.includes('sales')) {
      const res2 = await axios.get('http://localhost:5000/api/ai/sales-advisor');
      await sendWhatsAppReply(from, `Sales: ₹${res2.data.forecast_sales}\nProfit Margin: ${(res2.data.profit_margin*100).toFixed(2)}%`);
    }
    // === INVENTORY UPDATE ===
    else if (text.startsWith('add inventory')) {
      const [_, name, quantity] = text.split(' ');
      await axios.post('http://localhost:5000/api/orders/inventory', { name, quantity: Number(quantity) });
      await sendWhatsAppReply(from, `Inventory updated: ${name} +${quantity}`);
    }
    // === WASTE ALERTS ===
    else if (text.includes('waste')) {
      const res2 = await axios.get('http://localhost:5000/api/ai/waste-alerts');
      await sendWhatsAppReply(from, `Waste Alerts:\n${res2.data.alerts.map(a => `${a.item}: ${a.reason}`).join('\n')}`);
    }
    // === UPSALE SUGGESTIONS ===
    else if (text.includes('upsell')) {
      const res2 = await axios.get('http://localhost:5000/api/ai/upsell');
      await sendWhatsAppReply(from, `Upsell Suggestions:\n${res2.data.suggestions.map(s => `${s.base} → ${s.upsell}`).join('\n')}`);
    }
    // Add more commands as needed!
  }

  res.sendStatus(200);
});

function parseOrderItems(text) {
  // "order 2 butter naan, 1 paneer tikka"
  return text.replace('order', '').split(',').map(item => {
    const [qty, ...nameArr] = item.trim().split(' ');
    return { name: nameArr.join(' '), quantity: Number(qty) };
  });
}

async function sendWhatsAppReply(to, message) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

export default router; 