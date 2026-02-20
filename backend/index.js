import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/order.js';
import aiRoutes from './routes/ai.js';
import tableRoutes from './routes/tables.js';
import whatsappRoutes from './routes/whatsapp.js';
import attendanceRoutes from './routes/attendance.js';
import inventoryRoutes from './routes/inventory.js';
import restaurantRoutes from './routes/restaurant.js'; // Add this import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewarehbbbibbbsbgigisgisniosngnsin
app.use(cors({origin :'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' })); // Allows large JSON payloads like imageBase64

// API Routes
app.use('/api/auth', authRoutes);        // /api/auth/register, /generate-qr, /join
app.use('/api/orders', orderRoutes);     // /api/orders/create, /profit, /recipe
app.use('/api/ai', aiRoutes);            // /api/ai/upsell, /plate, /crowd
app.use('/api/tables', tableRoutes);     // /api/tables/layout, /tables, /reservations
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/restaurants', restaurantRoutes); // Add this route

// Default Route
app.get('/', (req, res) => {
  res.send('🍽️ Restaurant Management API is running');
});

// MongoDB Connection
let io; // Global io reference
let emitAnalyticsUpdate, emitInventoryUpdate, emitWasteAlert, broadcastOrder;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
  const httpServer = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  io = new Server(httpServer, { cors: { origin: '*' } });

  emitAnalyticsUpdate = (analytics) => {
    io.emit('analytics:update', analytics);
  };
  emitInventoryUpdate = (inventory) => {
    io.emit('inventory:update', inventory);
  };
  emitWasteAlert = (alert) => {
    io.emit('waste:alert', alert);
  };
  broadcastOrder = (order) => {
    io.emit('order:new', order);
  };

}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

export { io, emitAnalyticsUpdate, emitInventoryUpdate, emitWasteAlert, broadcastOrder };
