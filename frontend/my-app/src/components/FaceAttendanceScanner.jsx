import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';

export default function FaceAttendanceScanner({ onSuccess, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [descriptors, setDescriptors] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // 1. Camera not accessible, 2. Model not loaded
  useEffect(() => {
    const loadModelsAndCamera = async () => {
      try {
        setIsLoading(true);
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        } catch (camErr) {
          setError('Camera not accessible. Please allow camera access and try again.');
          setIsLoading(false);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Fetch all employee descriptors
        const res = await axios.get('/api/face-descriptors');
        setDescriptors(res.data);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load models, camera, or descriptors.');
        setIsLoading(false);
      }
    };
    loadModelsAndCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setError('');
    setSuccess('');
    scanIntervalRef.current = setInterval(scanFrame, 1500);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const scanFrame = async () => {
    let timeoutId;
    try {
      // 11. Timeout during face detection
      const detectionPromise = faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      const timeoutPromise = new Promise((_, reject) => timeoutId = setTimeout(() => reject(new Error('Face detection timed out.')), 8000));
      const detections = await Promise.race([detectionPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      // 2. No face detected
      if (!detections || detections.length === 0) return setError('No face detected. Please position your face in the frame.');
      // 3. Multiple faces detected
      if (detections.length > 1) return setError('Multiple faces detected. Please ensure only your face is visible.');
      const detection = detections[0];
      // 12. Invalid image format (simulate by checking detection score)
      if (detection.detection && detection.detection.score < 0.2) {
        setError('Face image quality is too low. Please try again in better lighting.');
        return;
      }
      const liveDescriptor = detection.descriptor;
      let minDistance = 1;
      let matchedEmployee = null;
      descriptors.forEach(emp => {
        const dist = faceapi.euclideanDistance(liveDescriptor, emp.faceDescriptor);
        if (dist < minDistance) {
          minDistance = dist;
          matchedEmployee = emp;
        }
      });
      // 4. Low confidence in recognition
      if (minDistance > 0.5) {
        setError('Face not recognized with sufficient confidence. Please try again.');
        return;
      }
      // 5. Network/server error, 6. User not found, 7. Attendance already marked, 8. Unauthorized
      try {
        await axios.post('/api/mark-attendance', { employeeId: matchedEmployee._id });
        setSuccess(`Attendance marked for ${matchedEmployee.name}`);
        if (onSuccess) onSuccess(matchedEmployee);
        stopScanning();
      } catch (err) {
        if (err.response) {
          if (err.response.status === 404) setError('User not found.');
          else if (err.response.status === 409) setError('Attendance already marked for today.');
          else if (err.response.status === 401 || err.response.status === 403) setError('Unauthorized. Please login as manager.');
          else setError('Attendance failed: ' + (err.response.data?.error || 'Unknown error.'));
        } else {
          setError('Network/server error. Please try again.');
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setError(err.message || 'Face scan failed.');
    }
  };

  return (
    <div style={{ padding: 24, background: 'white', borderRadius: 12, maxWidth: 400, margin: '0 auto' }}>
      <h2>Scan Attendance</h2>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
      {isLoading ? (
        <div>Loading models, camera, and data...</div>
      ) : (
        <>
          <video ref={videoRef} autoPlay muted width={320} height={240} style={{ borderRadius: 8, border: '2px solid #eee' }} />
          <div style={{ marginTop: 16 }}>
            {!isScanning ? (
              <button onClick={startScanning} style={{ padding: '10px 20px', fontSize: 16 }}>Start Scanning</button>
            ) : (
              <button onClick={stopScanning} style={{ padding: '10px 20px', fontSize: 16 }}>Stop Scanning</button>
            )}
            <button onClick={onClose} style={{ marginLeft: 12, padding: '10px 20px', fontSize: 16 }}>Close</button>
          </div>
        </>
      )}
    </div>
  );
} 