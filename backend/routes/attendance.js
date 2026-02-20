import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  registerFace,
  clockIn,
  clockOut,
  getAttendanceRecords,
  getAttendanceSummary,
  deleteFace,
  listFaces
} from '../controllers/attendanceController.js';

const router = express.Router();

// Face registration (for waiters to register their face)
router.post('/faces/:userId', authMiddleware, registerFace);

// Clock in with face recognition
router.post('/clock-in/:restaurantId', authMiddleware, clockIn);

// Clock out with face recognition
router.post('/clock-out/:restaurantId', authMiddleware, clockOut);

// Get attendance records for a restaurant
router.get('/records/:restaurantId', authMiddleware, getAttendanceRecords);

// Get attendance summary for a restaurant
router.get('/summary/:restaurantId', authMiddleware, getAttendanceSummary);

// Delete registered face
router.delete('/faces/:userId', authMiddleware, deleteFace);

// List registered faces
router.get('/faces', authMiddleware, listFaces);

export default router; 