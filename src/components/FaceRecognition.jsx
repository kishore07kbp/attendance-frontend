import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';
import './FaceRecognition.css';

const FaceRecognition = ({ student, onUpdate }) => {
  const location = useLocation();
  const selectedCourse = location.state?.course || 'Main Hall';
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [cameraHint, setCameraHint] = useState('Click "Start Camera" to begin');
  const [bleDeviceId, setBleDeviceId] = useState('');
  const [bleScanning, setBleScanning] = useState(false);
  const [bleDetected, setBleDetected] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [step, setStep] = useState(1); // 1: Face, 2: BLE, 3: Complete

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const canCaptureFace = modelsLoaded && cameraHint.startsWith('Great!');

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    // Attach stream after <video> mounts
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isScanning]);

  useEffect(() => {
    if (!isScanning || !modelsLoaded) return;
    let cancelled = false;

    const computeHint = (box, videoWidth, videoHeight) => {
      const faceCenterX = box.x + box.width / 2;
      const faceCenterY = box.y + box.height / 2;
      const dx = faceCenterX - videoWidth / 2;
      const dy = faceCenterY - videoHeight / 2;

      const xThresh = videoWidth * 0.12;
      const yThresh = videoHeight * 0.12;

      const faceWidthRatio = box.width / videoWidth;
      const faceHeightRatio = box.height / videoHeight;

      const directions = [];
      if (dx < -xThresh) directions.push('move left');
      if (dx > xThresh) directions.push('move right');
      if (dy < -yThresh) directions.push('move down');
      if (dy > yThresh) directions.push('move up');

      if (faceWidthRatio < 0.22 || faceHeightRatio < 0.22) directions.push('move closer');
      if (faceWidthRatio > 0.55 || faceHeightRatio > 0.55) directions.push('move farther');

      if (directions.length === 0) return 'Great! Now click "Capture Face".';
      return `Please ${directions.slice(0, 2).join(' and ')}.`;
    };

    const calculateCosineSimilarity = (desc1, desc2) => {
      if (!desc1 || !desc2) return 0;
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < desc1.length; i++) {
        dotProduct += desc1[i] * desc2[i];
        normA += desc1[i] * desc1[i];
        normB += desc2[i] * desc2[i];
      }
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const drawOverlay = (box) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      if (!vw || !vh) return;

      if (canvas.width !== vw) canvas.width = vw;
      if (canvas.height !== vh) canvas.height = vh;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, vw, vh);
      if (!box) return;

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    };

    const loop = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      try {
        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
        );

        if (!detection) {
          if (!cancelled) setCameraHint('No face detected. Center your face in the frame.');
          drawOverlay(null);
        } else {
          const box = detection.box;
          const vw = video.videoWidth || 640;
          const vh = video.videoHeight || 480;
          const hint = computeHint(box, vw, vh);
          if (!cancelled) setCameraHint(hint);
          drawOverlay(box);
        }
      } catch (e) {
        if (!cancelled) setCameraHint('Unable to detect face. Please try again.');
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isScanning, modelsLoaded]);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      setModelsLoaded(true);
      toast.success('Face recognition models loaded');
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load face recognition models');
    }
  };

  const startCamera = async () => {
    try {
      setCameraHint('Preparing camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please allow camera permissions.');
      setCameraHint('Camera permission denied. Please allow camera access.');
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.6 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const descriptor = Array.from(detection.descriptor);
        
        if (!needsFaceRegistration && student?.faceDescriptor && student.faceDescriptor.length > 0) {
            const currentDescriptor = new Float32Array(descriptor);
            const savedDescriptor = new Float32Array(student.faceDescriptor);

            const similarity = calculateCosineSimilarity(currentDescriptor, savedDescriptor);
            const distance = faceapi.euclideanDistance(currentDescriptor, savedDescriptor);
            console.log(`Face Match Check - Similarity: ${similarity.toFixed(4)}, Distance: ${distance.toFixed(4)}`);
            
            if (similarity < 0.85) {
                toast.error(`Face mismatch detected (${Math.round(similarity * 100)}% match)`);
                return;
            }
        }
        
        setFaceDescriptor(descriptor);
        setStep(2);
        stopCamera();
        toast.success('Face verified! Now verify BLE device.');
      } else {
        toast.error('No face detected. Please try again.');
      }
    } catch (error) {
      console.error('Error detecting face:', error);
      toast.error('Error detecting face');
    }
  };

  const scanBLEDevice = async () => {
    setBleScanning(true);
    try {
      // In a real implementation, this would use Web Bluetooth API
      // For now, we'll use a mock or the backend BLE detection
      const response = await axios.post(`${API_URL}/api/devices/verify`, {
        bleDeviceId: student?.bleDeviceId || bleDeviceId
      });

      if (response.data.verified) {
        setBleDetected(true);
        setStep(3);
        toast.success('BLE device verified!');
      } else {
        toast.error('BLE device not detected. Please ensure you are in the classroom.');
      }
    } catch (error) {
      console.error('Error scanning BLE:', error);
      toast.error('Failed to verify BLE device');
    } finally {
      setBleScanning(false);
    }
  };

  const markAttendance = async () => {
    if (!faceDescriptor) {
      toast.error('Face descriptor not found');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/students/mark-attendance`, {
        faceDescriptor,
        bleDeviceId: student?.bleDeviceId || bleDeviceId,
        course: selectedCourse
      });

      if (response.data.success) {
        setAttendanceMarked(true);
        toast.success('Attendance marked successfully!');
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);

      if (error.response?.data?.faceVerified && !error.response?.data?.bleVerified) {
        setStep(2); // Go back to BLE step
      }
    }
  };

  const reset = () => {
    setFaceDescriptor(null);
    setBleDetected(false);
    setAttendanceMarked(false);
    setStep(1);
    stopCamera();
  };

  // Register face (first time)
  const registerFace = async () => {
    if (!faceDescriptor) {
      toast.error('Please capture your face first');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/students/register-face`, {
        faceDescriptor
      });

      if (response.data.success) {
        toast.success('Face registered successfully!');
        if (onUpdate) onUpdate();
        reset();
      }
    } catch (error) {
      toast.error('Failed to register face');
    }
  };

  const needsFaceRegistration = !student?.faceDescriptor || student.faceDescriptor.length === 0;

  return (
    <div className="face-recognition-container">
      <div className="card">
        <h2 className="card-title">Mark Attendance</h2>

        {needsFaceRegistration && (
          <div className="alert alert-info">
            <p>⚠️ You need to register your face first before marking attendance.</p>
          </div>
        )}

        <div className="attendance-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Face Recognition</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">BLE Verification</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Complete</div>
          </div>
        </div>

        {step === 1 && (
          <div className="face-capture-section">
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="video-preview"
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              <canvas
                ref={canvasRef}
                className="face-canvas"
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              {!isScanning && (
                <div className="video-placeholder">
                  <p>{cameraHint}</p>
                </div>
              )}
            </div>

            <div className="controls">
              {!isScanning ? (
                <button onClick={startCamera} className="btn btn-primary">
                  Start Camera
                </button>
              ) : (
                <>
                  <button onClick={captureFace} className="btn btn-success" disabled={!canCaptureFace}>
                    {modelsLoaded ? 'Capture Face' : 'Loading Models...'}
                  </button>
                  <button onClick={stopCamera} className="btn btn-secondary">
                    Stop Camera
                  </button>
                </>
              )}

              {needsFaceRegistration && faceDescriptor && (
                <button onClick={registerFace} className="btn btn-primary">
                  Register Face
                </button>
              )}
            </div>
            {isScanning && (
              <div className="camera-hint" aria-live="polite">
                {cameraHint}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="ble-verification-section">
            <h3>Verify BLE Device</h3>
            <p>Please ensure your BLE device is nearby and in the classroom.</p>
            <div className="ble-info">
              <p><strong>Your BLE Device ID:</strong> {student?.bleDeviceId || 'Not set'}</p>
            </div>
            <button
              onClick={scanBLEDevice}
              className="btn btn-primary"
              disabled={bleScanning}
            >
              {bleScanning ? 'Scanning...' : 'Verify BLE Device'}
            </button>
            {bleDetected && (
              <div className="alert alert-success">
                <p>✓ BLE device verified successfully!</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && !attendanceMarked && (
          <div className="mark-attendance-section">
            <h3>Ready to Mark Attendance</h3>
            <p>Both face recognition and BLE verification are complete.</p>
            <button onClick={markAttendance} className="btn btn-success btn-large">
              Mark Attendance
            </button>
          </div>
        )}

        {attendanceMarked && (
          <div className="success-section">
            <div className="alert alert-success">
              <h3>✓ Attendance Marked Successfully!</h3>
              <p>Your attendance has been recorded for today.</p>
            </div>
            <button onClick={reset} className="btn btn-secondary">
              Mark Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRecognition;

