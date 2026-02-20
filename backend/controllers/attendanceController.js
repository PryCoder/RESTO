import { spawn } from 'child_process';
import path from 'path';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

// Helper function to run Python script
const runPythonScript = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'face_recognition_service.py');
    // If using stdin, add --stdin flag and do not pass image as argument
    let pythonArgs = [scriptPath, command];
    let useStdin = options.useStdin || false;
    let stdinPayload = null;
    if (useStdin) {
      pythonArgs.push('--stdin');
      if (command === 'register') {
        // args: [userId, image]
        stdinPayload = JSON.stringify({ userId: args[0], image: args[1] });
      } else if (command === 'recognize') {
        // args: [image]
        stdinPayload = JSON.stringify({ image: args[0] });
      }
    } else {
      pythonArgs = [scriptPath, command, ...args];
    }
    const pythonProcess = spawn('python', pythonArgs);
    let output = '';
    let errorOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Find the last line that looks like JSON
          const lines = output.trim().split('\n');
          const lastJsonLine = lines.reverse().find(line => line.trim().startsWith('{') && line.trim().endsWith('}'));
          if (!lastJsonLine) {
            reject(new Error(`No JSON output from Python script: ${output}`));
          } else {
            const result = JSON.parse(lastJsonLine);
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
      }
    });
    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
    // Write to stdin if needed
    if (useStdin && stdinPayload) {
      pythonProcess.stdin.write(stdinPayload);
      pythonProcess.stdin.end();
    }
  });
};

// Register face for a user
export const registerFace = async (req, res) => {
  try {
    const { userId } = req.params;
    const { image } = req.body; // base64 image data
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Call Python script to register face (use stdin)
    const result = await runPythonScript('register', [userId, image], { useStdin: true });
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Face registered successfully',
        userId 
      });
    } else {
      res.status(400).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ error: 'Failed to register face' });
  }
};

// Clock in with face recognition
export const clockIn = async (req, res) => {
  try {
    const { image } = req.body; // base64 image data
    const { restaurantId } = req.params;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    // Call Python script to recognize face (use stdin)
    const recognitionResult = await runPythonScript('recognize', [image], { useStdin: true });
    
    if (!recognitionResult.success) {
      return res.status(400).json({ error: recognitionResult.error });
    }
    
    const userId = recognitionResult.user_id;
    
    // Verify user exists and belongs to restaurant
    const user = await User.findById(userId).populate('restaurant');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.restaurant._id.toString() !== restaurantId) {
      return res.status(403).json({ error: 'User does not belong to this restaurant' });
    }
    
    // Check if already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (existingAttendance && existingAttendance.clockIn.time) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }
    
    // Create or update attendance record
    let attendance;
    if (existingAttendance) {
      attendance = existingAttendance;
    } else {
      attendance = new Attendance({
        user: userId,
        restaurant: restaurantId,
        date: new Date()
      });
    }
    
    attendance.clockIn = {
      time: new Date(),
      method: 'face',
      confidence: recognitionResult.confidence,
      image: image
    };
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Clock in successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      },
      confidence: recognitionResult.confidence,
      clockInTime: attendance.clockIn.time
    });
    
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
};

// Clock out with face recognition
export const clockOut = async (req, res) => {
  try {
    const { image } = req.body; // base64 image data
    const { restaurantId } = req.params;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    // Call Python script to recognize face (use stdin)
    const recognitionResult = await runPythonScript('recognize', [image], { useStdin: true });
    
    if (!recognitionResult.success) {
      return res.status(400).json({ error: recognitionResult.error });
    }
    
    const userId = recognitionResult.user_id;
    
    // Verify user exists and belongs to restaurant
    const user = await User.findById(userId).populate('restaurant');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.restaurant._id.toString() !== restaurantId) {
      return res.status(403).json({ error: 'User does not belong to this restaurant' });
    }
    
    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (!attendance || !attendance.clockIn.time) {
      return res.status(400).json({ error: 'No clock in record found for today' });
    }
    
    if (attendance.clockOut && attendance.clockOut.time) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }
    
    // Update clock out
    attendance.clockOut = {
      time: new Date(),
      method: 'face',
      confidence: recognitionResult.confidence,
      image: image
    };
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Clock out successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      },
      confidence: recognitionResult.confidence,
      clockOutTime: attendance.clockOut.time,
      workingHours: attendance.workingHours
    });
    
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
};

// Get attendance records for a restaurant
export const getAttendanceRecords = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, userId } = req.query;
    
    let query = { restaurant: restaurantId };
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(queryDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDate };
    }
    
    if (userId) {
      query.user = userId;
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'name role')
      .sort({ date: -1, 'clockIn.time': -1 });
    
    res.json({
      success: true,
      records: attendanceRecords
    });
    
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
};

// Get attendance summary for a restaurant
export const getAttendanceSummary = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;
    
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const attendanceRecords = await Attendance.find({
      restaurant: restaurantId,
      date: { $gte: queryDate, $lt: nextDate }
    }).populate('user', 'name role');
    
    const summary = {
      totalStaff: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.clockIn && r.clockIn.time).length,
      absent: attendanceRecords.filter(r => !r.clockIn || !r.clockIn.time).length,
      clockedOut: attendanceRecords.filter(r => r.clockOut && r.clockOut.time).length,
      stillWorking: attendanceRecords.filter(r => r.clockIn && r.clockIn.time && (!r.clockOut || !r.clockOut.time)).length,
      totalWorkingHours: attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0)
    };
    
    res.json({
      success: true,
      summary,
      records: attendanceRecords
    });
    
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to get attendance summary' });
  }
};

// Delete registered face
export const deleteFace = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Call Python script to delete face
    const result = await runPythonScript('delete', [userId]);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Face deleted successfully',
        userId 
      });
    } else {
      res.status(400).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('Delete face error:', error);
    res.status(500).json({ error: 'Failed to delete face' });
  }
};

// List registered faces
export const listFaces = async (req, res) => {
  try {
    const result = await runPythonScript('list');
    
    if (result.success) {
      res.json({
        success: true,
        faces: result.faces
      });
    } else {
      res.status(400).json({ error: result.error });
    }
    
  } catch (error) {
    console.error('List faces error:', error);
    res.status(500).json({ error: 'Failed to list faces' });
  }
}; 