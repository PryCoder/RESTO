import express from 'express';
import {
  loginUser,
  generateQRCode,
  getUser,
  getUsers,
  joinRestaurant,
  registerUser,
  initiateRegisterWithEmailOtp,
  verifyEmailOtpAndRegisterUser,
  getUserById,
  updateUser // Import updateUser instead of updateUserProfile
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// Manager registration
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// QR code generation for linking waiters
router.get('/generate-qr', authMiddleware, generateQRCode);

// Auto-join via QR code
router.get('/join', joinRestaurant);

router.get('/me',authMiddleware, getUser);

router.get('/', getUsers);

// Email OTP registration endpoints
router.post('/register/initiate-email', initiateRegisterWithEmailOtp);
router.post('/register/verify-email-otp', verifyEmailOtpAndRegisterUser);

router.get('/:id', getUserById);
router.patch('/:id', authMiddleware, updateUser); // Use updateUser here

router.post('/whatsapp-login', async (req, res) => {
  const { phone } = req.body;
  console.log('Received whatsapp-login request for phone:', phone); // Debug log
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const user = await User.findOne({ phone });
  if (!user) {
    console.log('User not found for phone:', phone); // Debug log
    return res.status(404).json({ error: 'User not found' });
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// PATCH /api/restaurant/:id/staff-hours
// Update staff working hours for waiter and chef
router.patch('/restaurant/:id/staff-hours', async (req, res) => {
  try {
    const { id } = req.params;
    const { staffHours } = req.body;
    if (!staffHours) return res.status(400).json({ error: 'Missing staffHours' });
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    restaurant.staffHours = staffHours;
    await restaurant.save();
    res.json({ message: 'Staff hours updated', staffHours: restaurant.staffHours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
