import express from 'express';
import Restaurant from '../models/Restaurant.js';
import Reservation from '../models/Reservation.js';
import authMiddleware from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Test route to verify API is working
router.get('/test', (req, res) => {
  res.json({ message: 'Tables API is working!', timestamp: new Date().toISOString() });
});

// List all restaurants (for debugging)
router.get('/restaurants', authMiddleware, async (req, res) => {
  try {
    console.log('=== LIST RESTAURANTS DEBUG ===');
    console.log('User:', req.user);
    
    const restaurants = await Restaurant.find({});
    console.log('Restaurants found:', restaurants.length);
    
    const restaurantList = restaurants.map(r => ({
      id: r._id,
      name: r.name,
      createdBy: r.createdBy,
      tablesCount: r.tables.length
    }));
    
    res.json({ restaurants: restaurantList });
  } catch (error) {
    console.error('=== LIST RESTAURANTS ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ error: 'Failed to list restaurants', details: error.message });
  }
});

// Get restaurant layout and tables
router.get('/layout/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    console.log('=== GET LAYOUT DEBUG ===');
    console.log('Restaurant ID:', restaurantId);
    console.log('User:', req.user);

    const restaurant = await Restaurant.findById(restaurantId);
    console.log('Restaurant found:', restaurant ? 'YES' : 'NO');
    
    if (!restaurant) {
      console.log('Restaurant not found for ID:', restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    console.log('Restaurant details:', {
      id: restaurant._id,
      name: restaurant.name,
      tablesCount: restaurant.tables.length,
      hasLayout: !!restaurant.layout,
      hasReservationSettings: !!restaurant.reservationSettings
    });

    res.json({
      layout: restaurant.layout,
      tables: restaurant.tables,
      reservationSettings: restaurant.reservationSettings
    });
  } catch (error) {
    console.error('=== GET LAYOUT ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch restaurant layout', details: error.message });
  }
});

// Update restaurant layout configuration
router.put('/layout/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    const { layout, reservationSettings } = req.body;
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (layout) {
      restaurant.layout = { ...restaurant.layout, ...layout };
    }
    
    if (reservationSettings) {
      restaurant.reservationSettings = { ...restaurant.reservationSettings, ...reservationSettings };
    }

    await restaurant.save();
    res.json({ message: 'Layout updated successfully', layout: restaurant.layout });
  } catch (error) {
    console.error('Error updating layout:', error);
    res.status(500).json({ error: 'Failed to update layout' });
  }
});

// Add a new table
router.post('/tables/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    console.log('=== ADD TABLE DEBUG ===');
    console.log('Restaurant ID:', restaurantId);
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const {
      tableNumber,
      floor,
      floorIndex,
      tableType,
      seats,
      position,
      width,
      height,
      color,
      borderColor,
      notes
    } = req.body;

    console.log('Extracted data:', {
      tableNumber,
      floor,
      floorIndex,
      tableType,
      seats,
      position,
      width,
      height,
      color,
      borderColor,
      notes
    });

    const restaurant = await Restaurant.findById(restaurantId);
    console.log('Restaurant found:', restaurant ? 'YES' : 'NO');
    
    if (!restaurant) {
      console.log('Restaurant not found for ID:', restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    console.log('Restaurant details:', {
      id: restaurant._id,
      name: restaurant.name,
      tablesCount: restaurant.tables.length
    });

    // Generate unique table ID
    const tableId = `T${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated table ID:', tableId);

    const newTable = {
      tableId,
      tableNumber,
      floor: floor || 'Ground Floor',
      floorIndex: floorIndex || 0,
      tableType: tableType || 'normal',
      seats,
      position,
      width: width || 80,
      height: height || 80,
      color: color || '#28a745',
      borderColor: borderColor || '#1e7e34',
      notes
    };

    console.log('New table object:', newTable);

    restaurant.tables.push(newTable);
    console.log('Table added to restaurant array');
    
    await restaurant.save();
    console.log('Restaurant saved successfully');

    res.status(201).json({ message: 'Table added successfully', table: newTable });
  } catch (error) {
    console.error('=== ADD TABLE ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to add table', details: error.message });
  }
});

// Update table
router.put('/tables/:restaurantId/:tableId', authMiddleware, async (req, res) => {
  try {
    console.log('=== UPDATE TABLE DEBUG ===');
    console.log('Restaurant ID:', req.params.restaurantId);
    console.log('Table ID:', req.params.tableId);
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    const { tableId } = req.params;
    const updateData = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    console.log('Restaurant found:', restaurant ? 'YES' : 'NO');
    
    if (!restaurant) {
      console.log('Restaurant not found for ID:', restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const tableIndex = restaurant.tables.findIndex(table => table.tableId === tableId);
    console.log('Table index found:', tableIndex);
    
    if (tableIndex === -1) {
      console.log('Table not found for ID:', tableId);
      return res.status(404).json({ error: 'Table not found' });
    }

    console.log('Original table data:', restaurant.tables[tableIndex]);
    console.log('Update data:', updateData);

    // Defensive check for position
    if (updateData.position) {
      if (
        typeof updateData.position.x !== 'number' ||
        typeof updateData.position.y !== 'number' ||
        isNaN(updateData.position.x) ||
        isNaN(updateData.position.y)
      ) {
        return res.status(400).json({ error: 'Invalid position: x and y must be numbers' });
      }
    }

    // Update table data - preserve all existing fields and only update what's provided
    const originalTable = restaurant.tables[tableIndex];
    restaurant.tables[tableIndex] = {
      tableId: originalTable.tableId,
      tableNumber: originalTable.tableNumber,
      floor: originalTable.floor,
      floorIndex: originalTable.floorIndex,
      tableType: originalTable.tableType,
      seats: originalTable.seats,
      position: originalTable.position,
      width: originalTable.width,
      height: originalTable.height,
      color: originalTable.color,
      borderColor: originalTable.borderColor,
      status: originalTable.status,
      currentReservation: originalTable.currentReservation,
      notes: originalTable.notes,
      isActive: originalTable.isActive,
      createdAt: originalTable.createdAt,
      updatedAt: new Date(),
      // Override with any provided update data
      ...updateData
    };

    // Ensure Mongoose tracks subdocument changes
    restaurant.markModified('tables');

    console.log('Updated table data:', restaurant.tables[tableIndex]);

    await restaurant.save();
    console.log('Restaurant saved successfully');
    
    res.json({ message: 'Table updated successfully', table: restaurant.tables[tableIndex] });
  } catch (error) {
    console.error('=== UPDATE TABLE ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update table', details: error.message });
  }
});

// Delete table
router.delete('/tables/:restaurantId/:tableId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    const { tableId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const tableIndex = restaurant.tables.findIndex(table => table.tableId === tableId);
    if (tableIndex === -1) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if table has active reservations
    const activeReservations = await Reservation.find({
      tableId,
      status: { $in: ['pending', 'confirmed', 'seated'] }
    });

    if (activeReservations.length > 0) {
      return res.status(400).json({ error: 'Cannot delete table with active reservations' });
    }

    restaurant.tables.splice(tableIndex, 1);
    await restaurant.save();

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// Get table status and reservations
router.get('/tables/:restaurantId/status', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    console.log('=== GET TABLE STATUS DEBUG ===');
    console.log('Restaurant ID:', restaurantId);
    console.log('Date query:', req.query.date);
    console.log('User:', req.user);

    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();

    const restaurant = await Restaurant.findById(restaurantId);
    console.log('Restaurant found:', restaurant ? 'YES' : 'NO');
    
    if (!restaurant) {
      console.log('Restaurant not found for ID:', restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    console.log('Restaurant details:', {
      id: restaurant._id,
      name: restaurant.name,
      tablesCount: restaurant.tables.length
    });

    // Get reservations for the date
    const reservations = await Reservation.find({
      restaurantId: restaurantId,
      reservationDate: {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999))
      }
    });

    console.log('Reservations found:', reservations.length);

    // Update table status based on reservations
    const tablesWithStatus = restaurant.tables.map(table => {
      const tableReservations = reservations.filter(res => res.tableId === table.tableId);
      const currentTime = new Date();
      
      let status = table.status;
      let currentReservation = null;

      // Check for current reservations
      for (const reservation of tableReservations) {
        const reservationDateTime = new Date(reservation.reservationDate);
        const [hours, minutes] = reservation.reservationTime.split(':');
        reservationDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const endTime = new Date(reservationDateTime.getTime() + reservation.duration * 60000);
        
        if (currentTime >= reservationDateTime && currentTime <= endTime) {
          status = reservation.status === 'seated' ? 'occupied' : 'reserved';
          currentReservation = {
            reservationId: reservation._id,
            customerName: reservation.customerName,
            customerPhone: reservation.customerPhone,
            partySize: reservation.partySize,
            reservationTime: reservation.reservationTime,
            expectedDuration: reservation.duration,
            notes: reservation.specialRequests
          };
          break;
        }
      }

      return {
        ...table.toObject(),
        status,
        currentReservation
      };
    });

    console.log('Tables with status processed:', tablesWithStatus.length);

    res.json({ tables: tablesWithStatus, reservations });
  } catch (error) {
    console.error('=== GET TABLE STATUS ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch table status', details: error.message });
  }
});

// Create reservation
router.post('/reservations/:restaurantId', authMiddleware, async (req, res) => {
  try {
    console.log('=== CREATE RESERVATION DEBUG ===');
    console.log('Restaurant ID:', req.params.restaurantId);
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    const {
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      reservationTime,
      duration,
      specialRequests,
      notes
    } = req.body;

    // Extra validation for required fields
    if (!tableId) return res.status(400).json({ error: 'Missing tableId' });
    if (!customerName) return res.status(400).json({ error: 'Missing customerName' });
    if (!customerPhone) return res.status(400).json({ error: 'Missing customerPhone' });
    if (!partySize) return res.status(400).json({ error: 'Missing partySize' });
    if (!reservationDate) return res.status(400).json({ error: 'Missing reservationDate' });
    if (!reservationTime) return res.status(400).json({ error: 'Missing reservationTime' });

    // Validate date and time
    const reservationDateTime = new Date(reservationDate);
    if (isNaN(reservationDateTime.getTime())) {
      return res.status(400).json({ error: 'Invalid reservationDate' });
    }
    const [hours, minutes] = reservationTime.split(':');
    if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) {
      return res.status(400).json({ error: 'Invalid reservationTime format' });
    }

    // Validate table availability
    const restaurant = await Restaurant.findById(restaurantId);
    console.log('Restaurant found:', restaurant ? 'YES' : 'NO');
    
    if (!restaurant) {
      console.log('Restaurant not found for ID:', restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const table = restaurant.tables.find(t => t.tableId === tableId);
    console.log('Table found:', table ? 'YES' : 'NO');
    
    if (!table) {
      console.log('Table not found for ID:', tableId);
      return res.status(404).json({ error: 'Table not found' });
    }

    console.log('Table details:', {
      tableId: table.tableId,
      tableNumber: table.tableNumber,
      seats: table.seats,
      status: table.status
    });

    if (partySize > table.seats) {
      console.log('Party size exceeds table capacity:', { partySize, tableSeats: table.seats });
      return res.status(400).json({ error: 'Party size exceeds table capacity' });
    }

    // Check for conflicting reservations
    const endTime = new Date(reservationDateTime.getTime() + (duration || 120) * 60000);

    console.log('Reservation time details:', {
      reservationDateTime,
      endTime,
      duration: duration || 120
    });

    // Simplified conflicting reservations check
    const conflictingReservations = await Reservation.find({
      tableId,
      reservationDate: reservationDateTime,
      status: { $in: ['pending', 'confirmed', 'seated'] }
    });

    console.log('Conflicting reservations found:', conflictingReservations.length);

    // Check for time conflicts manually
    const hasConflict = conflictingReservations.some(existingReservation => {
      const existingStart = new Date(existingReservation.reservationDate);
      const [existingHours, existingMinutes] = existingReservation.reservationTime.split(':');
      existingStart.setHours(parseInt(existingHours), parseInt(existingMinutes), 0, 0);
      
      const existingEnd = new Date(existingStart.getTime() + existingReservation.duration * 60000);
      
      // Check if the new reservation overlaps with existing one
      return (reservationDateTime < existingEnd && endTime > existingStart);
    });

    if (hasConflict) {
      console.log('Table is not available for the selected time');
      return res.status(400).json({ error: 'Table is not available for the selected time' });
    }

    console.log('Creating new reservation...');

    const reservation = new Reservation({
      restaurantId: restaurantId,
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate: reservationDateTime,
      reservationTime,
      duration: duration || 120,
      specialRequests,
      notes
    });

    console.log('Reservation object created:', reservation);

    await reservation.save();
    console.log('Reservation saved successfully');

    // Update table status
    table.status = 'reserved';
    table.currentReservation = {
      reservationId: reservation._id,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationTime: reservationDateTime,
      expectedDuration: duration || 120,
      specialRequests,
      notes
    };
    
    console.log('Updating table status...');
    await restaurant.save();
    console.log('Restaurant updated successfully');

    res.status(201).json({ message: 'Reservation created successfully', reservation });
  } catch (error) {
    console.error('=== CREATE RESERVATION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create reservation', details: error.message });
  }
});

// Get reservations
router.get('/reservations/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    const { date, status } = req.query;
    
    let query = { restaurantId: restaurantId };
    
    if (date) {
      const queryDate = new Date(date);
      query.reservationDate = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999))
      };
    }
    
    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query).sort({ reservationDate: 1, reservationTime: 1 });
    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Update reservation status
router.put('/reservations/:reservationId/status', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ error: 'Invalid reservation ID format' });
    }
    const { status } = req.body;
    
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    reservation.status = status;
    
    // Update timestamps based on status
    if (status === 'confirmed' && !reservation.confirmedAt) {
      reservation.confirmedAt = new Date();
    } else if (status === 'seated' && !reservation.seatedAt) {
      reservation.seatedAt = new Date();
    } else if (status === 'completed' && !reservation.completedAt) {
      reservation.completedAt = new Date();
    }

    await reservation.save();

    // Update table status
    const restaurant = await Restaurant.findById(reservation.restaurantId);
    if (restaurant) {
      const table = restaurant.tables.find(t => t.tableId === reservation.tableId);
      if (table) {
        if (status === 'seated') {
          table.status = 'occupied';
        } else if (status === 'completed' || status === 'cancelled' || status === 'no-show') {
          table.status = 'available';
          table.currentReservation = null;
        }
        await restaurant.save();
      }
    }

    res.json({ message: 'Reservation status updated successfully', reservation });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

export default router; 