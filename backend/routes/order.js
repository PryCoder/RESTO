// routes/orderRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import {
  createOrder,
  getOrders,
  getDailyProfit as calculateProfit,
  saveRecipeCost,
  updateInventory,
  createInventory,
  createBulkInventory,
  getInventory,
  deleteInventory,
  updateOrderStatus,
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  reorderFromPrevious
} from '../controllers/orderController.js';
import authMiddleware from '../middleware/auth.js';
import { analyzeWasteAndAdvice, inventoryWasteAlert } from '../services/geminiService.js';
import Dish from '../models/Dish.js';
import Order from '../models/Order.js';

const router = express.Router();

/* ===============================
   🔹 SPECIFIC ROUTES FIRST
================================= */

// Create order (for restaurant staff)
router.post('/create', authMiddleware, createOrder);

// Create customer order (for customers)
router.post('/customer/create', authMiddleware, createCustomerOrder);

// Profit calculator
router.get('/profit', authMiddleware, calculateProfit);

// Save recipe cost
router.post('/recipe', authMiddleware, saveRecipeCost);

// Waste analysis
router.post('/wasteanalyze', authMiddleware, analyzeWasteAndAdvice);

// Inventory alert
router.get('/inventoryalert', authMiddleware, inventoryWasteAlert);

// Get orders by customer ID
router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verify that the requesting user matches the customerId
    if (req.user._id.toString() !== customerId) {
      return res.status(403).json({ error: 'Not authorized to view these orders' });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid Customer ID' });
    }

    const orders = await Order.find({ customer: customerId })
      .populate('restaurant', 'name image location cuisine phone email')
      .populate('items.dish', 'name image category')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single customer order by ID
router.get('/customer/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const order = await Order.findOne({ 
      _id: orderId, 
      customer: customerId 
    })
      .populate('restaurant', 'name image location cuisine phone email')
      .populate('items.dish', 'name image category description')
      .populate('customer', 'name email phone addresses');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching customer order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Cancel customer order
router.put('/customer/:orderId/cancel', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const order = await Order.findOne({ 
      _id: orderId, 
      customer: customerId 
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be cancelled (only pending orders)
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot cancel order that is already being prepared or completed' 
      });
    }

    // Check if order was placed within last 5 minutes
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - orderTime) / (1000 * 60); // in minutes

    if (timeDiff > 5) {
      return res.status(400).json({ 
        error: 'Orders can only be cancelled within 5 minutes of placing' 
      });
    }

    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save();

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      order 
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Reorder from previous order
router.post('/customer/:orderId/reorder', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    // Find the previous order
    const previousOrder = await Order.findOne({ 
      _id: orderId, 
      customer: customerId 
    }).populate('restaurant');

    if (!previousOrder) {
      return res.status(404).json({ error: 'Previous order not found' });
    }

    // Check if restaurant still exists
    const restaurant = await mongoose.model('Restaurant').findById(previousOrder.restaurant._id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant no longer available' });
    }

    // Create new order with same items
    const newOrder = new Order({
      restaurant: previousOrder.restaurant._id,
      customer: customerId,
      items: previousOrder.items.map(item => ({
        dish: item.dish,
        name: item.name,
        quantity: item.quantity,
        modifications: item.modifications || [],
        price: item.price,
      })),
      totalAmount: previousOrder.totalAmount,
      deliveryAddress: previousOrder.deliveryAddress,
      paymentMethod: previousOrder.paymentMethod,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newOrder.save();

    // Populate for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('restaurant', 'name image location')
      .populate('customer', 'name email');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Error reordering:', error);
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

/* ===============================
   🔹 INVENTORY ROUTES
================================= */

router.get('/inventory', authMiddleware, getInventory);
router.post('/createin', authMiddleware, createInventory);
router.post('/createinbulk', authMiddleware, createBulkInventory);
router.put('/inventory/:id', authMiddleware, updateInventory);
router.delete('/inventory/:id', authMiddleware, deleteInventory);

/* ===============================
   🔹 DISH ROUTES
================================= */

router.get('/dishes', authMiddleware, async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ name: 1 });
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dishes', authMiddleware, async (req, res) => {
  try {
    const dish = new Dish(req.body);
    await dish.save();
    res.status(201).json(dish);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ===============================
   🔹 UPDATE ORDER STATUS
================================= */

router.put('/order/:id', authMiddleware, updateOrderStatus);

/* ===============================
   🔥 GENERIC ROUTES LAST
================================= */

// Get single order by ID (with optional customer verification)
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerId } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const query = { _id: orderId };

    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ error: 'Invalid Customer ID' });
      }
      query.customer = customerId;
    }

    const order = await Order.findOne(query)
      .populate('restaurant', 'name image location cuisine phone email')
      .populate('items.dish', 'name image category description')
      .populate('customer', 'name email phone')
      .populate('waiter', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If customerId is provided, verify ownership
    if (customerId && order.customer?._id.toString() !== customerId) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get all orders (very last)
router.get('/', authMiddleware, getOrders);

export default router;