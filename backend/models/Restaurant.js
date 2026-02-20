import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  menu: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      category: { type: String },
      inventoryThreshold: { type: Number, default: 0 },
      allergens: [{ type: String }],
      isTopItem: { type: Boolean, default: false }
    }
  ],

  // Restaurant layout configuration
  layout: {
    floors: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    floorNames: [{
      type: String,
      default: ['Ground Floor']
    }],
    canvasWidth: {
      type: Number,
      default: 800
    },
    canvasHeight: {
      type: Number,
      default: 600
    }
  },

  tables: [
    {
      tableId: { 
        type: String, 
        required: true,
        unique: true 
      },
      tableNumber: { 
        type: String, 
        required: true 
      },
      floor: {
        type: String,
        default: "Ground Floor"
      },
      floorIndex: {
        type: Number,
        default: 0
      },
      tableType: {
        type: String,
        enum: ['normal', 'vip', 'outdoor', 'private'],
        default: 'normal'
      },
      seats: { 
        type: Number, 
        required: true,
        min: 1,
        max: 20
      },
      // 2D positioning for drag and drop
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
      },
      // Table dimensions
      width: { type: Number, default: 80 },
      height: { type: Number, default: 80 },
      // Visual styling
      color: { type: String, default: '#28a745' },
      borderColor: { type: String, default: '#1e7e34' },
      // Status management
      status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available'
      },
      // Current reservation/occupancy
      currentReservation: {
        reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
        customerName: { type: String },
        customerPhone: { type: String },
        partySize: { type: Number },
        reservationTime: { type: Date },
        expectedDuration: { type: Number, default: 120 }, // minutes
        notes: { type: String }
      },
      // Table notes
      notes: { type: String },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],

  // Reservation settings
  reservationSettings: {
    maxAdvanceBooking: { type: Number, default: 30 }, // days
    minPartySize: { type: Number, default: 1 },
    maxPartySize: { type: Number, default: 20 },
    reservationDuration: { type: Number, default: 120 }, // minutes
    allowWalkIns: { type: Boolean, default: true },
    requireDeposit: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 }
  },

  // Staff working hours for waiter and chef
  staffHours: {
    waiter: {
      start: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      },
      close: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      }
    },
    chef: {
      start: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      },
      close: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      }
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
restaurantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Restaurant', restaurantSchema);
