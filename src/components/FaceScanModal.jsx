import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';
import './FaceScanModal.css';

const FaceScanModal = ({ isOpen, onClose, onFaceVerified, course, isRegistration = false, registeredDescriptor = null }) => {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [cameraHint, setCameraHint] = useState('Preparing camera...');

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);

    const canCaptureFace = modelsLoaded && cameraHint.startsWith('Great!');

    useEffect(() => {
        if (isOpen) {
            loadModels();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    useEffect(() => {
        // Attach stream after <video> mounts
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isScanning]);

    useEffect(() => {
        if (!isOpen) return;
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

            // Rough distance guidance (works well for webcam)
            if (faceWidthRatio < 0.22 || faceHeightRatio < 0.22) directions.push('move closer');
            if (faceWidthRatio > 0.55 || faceHeightRatio > 0.55) directions.push('move farther');

            if (directions.length === 0) return 'Great! Keep your face centered.';
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
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                );

                if (!detection) {
                    if (!cancelled) setCameraHint('No face detected. Center your face in the frame.');
                } else {
                    const box = detection.box;
                    const vw = video.videoWidth || 640;
                    const vh = video.videoHeight || 480;
                    const hint = computeHint(box, vw, vh);
                    if (!cancelled) setCameraHint(hint);
                }
            } catch (e) {
                // Keep scanning even if one frame fails
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
    }, [isOpen, isScanning, modelsLoaded]);

    const loadModels = async () => {
        setIsLoadingModels(true);
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            setModelsLoaded(true);
            setIsLoadingModels(false);
            // Auto-start camera after models load
            setTimeout(() => startCamera(), 500);
        } catch (error) {
            console.error('Error loading models:', error);
            setIsLoadingModels(false);
        }
    };

    const startCamera = async () => {
        try {
            setCameraHint('Preparing camera...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsScanning(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraHint('Camera permission denied. Please allow camera access.');
        }
    };

    const stopCamera = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    const handleRetry = () => {
        setFaceDescriptor(null);
        startCamera();
    };

    const captureFace = async () => {
        if (!videoRef.current || !modelsLoaded) return;

        try {
            // Using balanced settings for TinyFaceDetector
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,
                    scoreThreshold: 0.5
                }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                const descriptor = Array.from(detection.descriptor);

                // Compare with registered face descriptor if not registering
                if (!isRegistration && registeredDescriptor && Array.isArray(registeredDescriptor) && registeredDescriptor.length > 0) {
                    const currentDescriptor = new Float32Array(descriptor);
                    const savedDescriptor = new Float32Array(registeredDescriptor);

                    const distance = faceapi.euclideanDistance(currentDescriptor, savedDescriptor);
                    console.log(`[FaceScan] Verification Distance: ${distance.toFixed(4)} (Threshold: 0.45)`);

                    // Fail if distance is above threshold (lower distance = closer match)
                    if (distance > 0.45) {
                        toast.error(`Face mismatch! This face does not match your registered profile (Distance: ${distance.toFixed(2)})`, {
                            position: "top-right",
                            autoClose: 5000
                        });
                        return; // CRITICAL: Stop here, don't move to Step 3
                    }
                }

                if (!isRegistration) {
                    toast.success('face verification successfully', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: false,
                        draggable: true
                    });
                }

                setFaceDescriptor(descriptor);
                stopCamera();
                // Call parent callback with face data
                if (onFaceVerified) {
                    onFaceVerified(descriptor);
                }
            } else {
                toast.error('No face detected. Please try again.');
            }
        } catch (error) {
            console.error('CRITICAL: Face detection failed:', error);
            toast.error(`Error detecting face: ${error.message || 'Check console for details'}`, {
                position: "top-right"
            });
        }
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="face-scan-modal-overlay" onClick={handleClose}>
            <div className="face-scan-modal" onClick={(e) => e.stopPropagation()}>
                <div className="face-scan-modal-header">
                    <div>
                        <h2 className="face-scan-modal-title">
                            {isRegistration ? 'Face Registration' : 'Attendance Verification'}
                        </h2>
                        <p className="face-scan-modal-subtitle">
                            {isRegistration ? 'Register your face for attendance' : 'Step 2 of 3: Face Scan'}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="face-scan-modal-close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className="face-scan-modal-body">
                    <p className="face-scan-instruction">
                        {isRegistration
                            ? 'Position your face in the frame to register your identity.'
                            : 'Position your face in the frame to verify identity.'}
                    </p>

                    {isScanning && (
                        <div className="face-scan-hint" aria-live="polite">
                            {cameraHint}
                        </div>
                    )}


                    {isLoadingModels ? (
                        <div className="face-scan-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading AI Models...</p>
                        </div>
                    ) : (
                        <div className="face-scan-video-container">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="face-scan-video"
                                style={{ display: isScanning ? 'block' : 'none' }}
                            />
                            {isScanning ? (
                                <button
                                    onClick={captureFace}
                                    className="face-scan-capture-btn"
                                    disabled={!canCaptureFace}
                                >
                                    Capture Face
                                </button>
                            ) : (
                                <div className="face-scan-placeholder" style={{ flexDirection: 'column', gap: '20px' }}>
                                    <p>{cameraHint}</p>
                                    {!isLoadingModels && (
                                        <button
                                            onClick={handleRetry}
                                            className="face-scan-capture-btn"
                                            style={{ position: 'static', transform: 'none' }}
                                        >
                                            Try Again
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaceScanModal;
