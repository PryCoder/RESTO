// controllers/orderController.js
import Order from '../models/Order.js';
import Recipe from '../models/Recipe.js';
import Inventory from '../models/Inventory.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js'; // Add this import

import printer from '../utils/printer.js';
import { emitAnalyticsUpdate, emitInventoryUpdate, emitWasteAlert, broadcastOrder } from '../index.js';
import mongoose from 'mongoose';

// Helper to recalculate and emit analytics
async function recalculateAndEmitAnalytics() {
  const orders = await Order.find();
  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  emitAnalyticsUpdate({ totalSales });
}

export const createInventory = async (req, res) => {
  try {
    const { name, quantity, unit, expiryInDays } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ error: 'Name and quantity are required fields' });
    }

    const user = req.user;
    const restaurantId = user?.restaurant || null;
    const vendorId = user?._id;

    const inventoryItem = new Inventory({
      name,
      quantity,
      unit: unit || 'pieces',
      lastUpdated: new Date(),
      restaurant: restaurantId || null,
      vendorId: restaurantId ? null : vendorId
    });

    await inventoryItem.save();
    emitInventoryUpdate(await Inventory.find());
    await recalculateAndEmitAnalytics();
    res.status(201).json({ message: 'Inventory item created', item: inventoryItem });

  } catch (err) {
    console.error('Inventory creation failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const filter = req.user?.restaurant
      ? { restaurant: req.user.restaurant }
      : { createdBy: req.user._id };

    const inventory = await Inventory.find(filter).sort({ lastUpdated: -1 });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Inventory.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    emitInventoryUpdate(await Inventory.find());
    await recalculateAndEmitAnalytics();
    res.json({ message: 'Inventory updated', item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Inventory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    emitInventoryUpdate(await Inventory.find());
    if (deleted.quantity < 5) {
      emitWasteAlert({ item: deleted.name, reason: 'Low stock after deletion' });
    }
    await recalculateAndEmitAnalytics();
    res.json({ message: 'Inventory item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    import('../index.js').then(({ io }) => {
      if (io) io.emit('order:update', updated);
    });
    res.json({ message: 'Order status updated', order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Voice Order: Create & Print
export const createOrder = async (req, res) => {
  try {
    const { table, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (req.user.role === 'waiter' && !req.user.restaurant) {
      return res.status(400).json({ error: 'Waiter is not assigned to a restaurant' });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    const newOrder = new Order({
      table: table || 'Takeaway',
      items,
      totalAmount,
      restaurant: req.user?.restaurant || null,
      vendorId: req.user?._id || null,
      customer: req.user?._id || null,
      waiter: req.user?._id || null,
      createdAt: new Date(),
    });

    await newOrder.save();
    broadcastOrder(newOrder);
    await recalculateAndEmitAnalytics();
    emitAnalyticsUpdate({ type: 'order', order: newOrder });

    if (typeof printer?.printOrder === 'function') {
      await printer.printOrder(newOrder);
    }

    res.status(201).json({ message: 'Order saved & printed', order: newOrder });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const createBulkInventory = async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array' });
    }

    const user = req.user;
    const restaurantId = user?.restaurant || null;
    const vendorId = user?._id;

    const inventoryDocs = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pieces',
      lastUpdated: new Date(),
      restaurant: restaurantId || null,
      vendorId: restaurantId ? null : vendorId
    }));

    const result = await Inventory.insertMany(inventoryDocs);
    res.status(201).json({ message: 'Bulk inventory created', items: result });
  } catch (err) {
    console.error('Bulk inventory creation failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const query = {};

    if (req.user?.restaurant) {
      query.restaurant = req.user.restaurant;
    } else {
      query.vendorId = req.user._id;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('waiter', 'name image');
    res.json(orders);
  } catch (err) {
    console.error('Get Orders Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Profit Calculator
export const getDailyProfit = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayOrders, yesterdayOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: today } }),
      Order.find({ createdAt: { $gte: yesterday, $lt: today } }),
    ]);

    const todayTotal = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const yesterdayTotal = yesterdayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const diff = yesterdayTotal === 0 ? 100 : ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;

    res.json({ profit: todayTotal, change: diff.toFixed(2) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Recipe Costing
export const saveRecipeCost = async (req, res) => {
  try {
    const { name, cost, price } = req.body;
    const margin = (((price - cost) / price) * 100).toFixed(2);
    const recipe = new Recipe({ name, cost, price, margin });
    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============= CUSTOMER ORDER FUNCTIONS =============
// controllers/orderController.js (add these missing functions)

/**
 * Create a new order for a customer
 * Ensures customer ID is not null
 */
export const createCustomerOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, specialInstructions, paymentMethod } = req.body;
    const customerId = req.user._id; // From authMiddleware

    // Validate required fields
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    // Verify customer exists
    const User = mongoose.model('User');
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get restaurant details
    const Restaurant = mongoose.model('Restaurant');
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Find menu item in restaurant's menu
      const menuItem = restaurant.menu?.find(m => m._id.toString() === item.menuItemId);
      
      if (!menuItem) {
        return res.status(400).json({ 
          error: `Menu item with ID ${item.menuItemId} not found in this restaurant` 
        });
      }

      const quantity = item.quantity || 1;
      const itemTotal = menuItem.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        dish: menuItem._id,
        name: menuItem.name,
        quantity: quantity,
        modifications: item.modifications || [],
        price: menuItem.price,
      });
    }

    // Create the order with customer ID explicitly set
    const order = new Order({
      restaurant: restaurantId,
      customer: customerId, // This ensures customer is not null
      items: orderItems,
      totalAmount,
      deliveryAddress,
      specialInstructions: specialInstructions || '',
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save the order
    await order.save();

    // Populate for response
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name image location phone')
      .populate('customer', 'name email phone')
      .populate('items.dish', 'name image category');

    // Emit WebSocket events if available
    try {
      const { io } = await import('../index.js');
      if (io) {
        io.emit('order:new', populatedOrder);
        io.to(`restaurant_${restaurantId}`).emit('new_customer_order', populatedOrder);
      }
    } catch (e) {
      console.log('WebSocket emission skipped');
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (err) {
    console.error('Error creating customer order:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all orders for a specific customer
 */
export const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verify that the requesting user matches the customerId
    if (req.user._id.toString() !== customerId) {
      return res.status(403).json({ error: 'Not authorized to view these orders' });
    }

    const orders = await Order.find({ customer: customerId })
      .populate('restaurant', 'name image location cuisine phone email')
      .populate('items.dish', 'name image category')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a single order by ID for a customer
 */
export const getCustomerOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

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
  } catch (err) {
    console.error('Error fetching customer order:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cancel an order (if within time limit)
 */
export const cancelCustomerOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

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

    // Emit cancellation event
    try {
      const { io } = await import('../index.js');
      if (io) {
        io.emit('order:cancelled', order);
      }
    } catch (e) {
      console.log('WebSocket emission skipped');
    }

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      order 
    });

  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Reorder from a previous order
 */
export const reorderFromPrevious = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

    // Find the previous order
    const previousOrder = await Order.findOne({ 
      _id: orderId, 
      customer: customerId 
    }).populate('restaurant');

    if (!previousOrder) {
      return res.status(404).json({ error: 'Previous order not found' });
    }

    // Check if restaurant still exists
    const Restaurant = mongoose.model('Restaurant');
    const restaurant = await Restaurant.findById(previousOrder.restaurant._id);
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

  } catch (err) {
    console.error('Error reordering:', err);
    res.status(500).json({ error: err.message });
  }
};