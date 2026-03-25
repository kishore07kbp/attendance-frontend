import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from "socket.io-client";
import API_URL from '../config';

const BleVerificationModal = ({ isOpen, onClose, onComplete, student }) => {
    const [devices, setDevices] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('scanning'); // scanning | success | failed
    const [timeLeft, setTimeLeft] = useState(120); // 2-minute timeout as requested
    
    const socketRef = useRef(null);
    const registeredPermanentId = student?.permanentId;
    const registeredDeviceName = (!student?.bleDeviceName || student.bleDeviceName === 'Unknown Device') 
        ? (student?.rollNumber || 'Linked Device') 
        : student.bleDeviceName;

    useEffect(() => {
        if (!isOpen) return;

        setDevices([]);
        setVerificationStatus('scanning');
        setTimeLeft(120);
        setIsScanning(true);

        // Connect to server socket
        const serverUrl = API_URL;
        socketRef.current = io(serverUrl);

        socketRef.current.on("connect", () => {
            console.log("Permanent ID Verify Socket connected:", socketRef.current.id);
        });

        socketRef.current.on("ble-device-detected", (device) => {
            if (!isOpen) return; // Only process if modal is actively open
            
            setDevices(prev => {
                const now = new Date();
                const lastSeenTime = new Date(device.lastSeen);
                
                // If the signal is too old, ignore it
                if (now - lastSeenTime > 5000) return prev;

                const exists = prev.some(d => d.permanentId === device.permanentId);
                if (exists) {
                    return prev.map(d => d.permanentId === device.permanentId ? device : d);
                }
                return [...prev, device];
            });
        });

        const fetchLiveDevices = async () => {
            if (!isOpen) return;
            try {
                const response = await axios.get(`${API_URL}/api/devices/ble-devices`);
                if (response.data.success) {
                    const scannedDevices = response.data.devices || [];
                    const now = new Date();
                    // Double check filtering locally
                    const freshOnly = scannedDevices.filter(d => (now - new Date(d.lastSeen)) < 5000);
                    setDevices(freshOnly);
                }
            } catch (err) {
                console.error("Fetch devices error:", err);
            }
        };

        fetchLiveDevices();
        const scanInterval = setInterval(() => {
            fetchLiveDevices();
            // Local pruning: remove devices not seen in last 5 seconds locally
            setDevices(current => {
                const now = new Date();
                return current.filter(d => (now - new Date(d.lastSeen)) < 5000);
            });
        }, 2000); // 2 second refresh for fast removal

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    clearInterval(scanInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(scanInterval);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [isOpen]);

    // Watch for successful match
    useEffect(() => {
        if (verificationStatus !== 'scanning' || !registeredPermanentId) return;

        const match = devices.find(d => d.permanentId === registeredPermanentId);
        
        if (match) {
            setVerificationStatus('success');
            setIsScanning(false);
            
            // Do NOT automatically proceed anymore as per user request
            // User must click "OK" button manually
        } else if (timeLeft === 0) {
            setVerificationStatus('failed');
            setIsScanning(false);
        }

    }, [devices, timeLeft, verificationStatus, registeredPermanentId, onComplete]);

    if (!isOpen) return null;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="face-scan-modal-overlay" style={{ zIndex: 2000 }}>
            <div className="face-scan-modal" style={{ maxWidth: '850px', width: '92%', minHeight: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="face-scan-modal-header">
                    <div>
                        <h2 className="face-scan-modal-title">Step 3: Permanent ID Verification</h2>
                        <p className="face-scan-modal-subtitle">
                            {verificationStatus === 'scanning' && `Scanning for your registered device... Time remaining: ${formatTime(timeLeft)}`}
                            {verificationStatus === 'success' && 'Verification Successful! Identity Confirmed.'}
                            {verificationStatus === 'failed' && 'Verification Timeout.'}
                        </p>
                    </div>
                    {verificationStatus !== 'scanning' && (
                        <button className="face-scan-modal-close" onClick={onClose}>
                            ✕
                        </button>
                    )}
                </div>

                <div className="face-scan-modal-body" style={{ padding: '1.5rem' }}>
                    
                    {verificationStatus === 'success' && (
                        <div style={{ marginBottom: '1.5rem', padding: '1.2rem', background: '#ecfdf5', color: '#065f46', borderRadius: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #10b981' }}>
                            <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', padding: '4px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            Success: Your registered device has been detected. Click OK to finish.
                        </div>
                    )}

                    {verificationStatus === 'failed' && (
                        <div style={{ marginBottom: '1.5rem', padding: '1.2rem', background: '#fff1f2', color: '#9f1239', borderRadius: '0.75rem', fontWeight: 'bold', border: '1px solid #fda4af' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                <span>Verification Failed</span>
                            </div>
                            <p style={{ fontSize: '0.95rem', fontWeight: 'normal' }}>Your registered device was not found. Please ensure your device is nearby and advertising.</p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Left Side: Student Registered Profile Info */}
                        <div style={{ 
                            padding: '2rem', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '1rem', 
                            background: '#f8fafc', 
                            height: 'fit-content',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', fontWeight: '700' }}>Your Registered Device</h3>
                            {registeredPermanentId && !registeredPermanentId.startsWith('PENDING_') ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.875rem', color: '#64748b', display: 'block', marginBottom: '0.4rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Device Name (Roll Number)</label>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>{registeredDeviceName}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.875rem', color: '#64748b', display: 'block', marginBottom: '0.4rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Permanent ID</label>
                                        <div style={{ 
                                            fontFamily: 'monospace', 
                                            color: '#334155', 
                                            backgroundColor: '#f1f5f9', 
                                            padding: '0.6rem 0.8rem', 
                                            borderRadius: '0.5rem', 
                                            display: 'inline-block', 
                                            fontSize: '1.1rem',
                                            border: '1px solid #cbd5e1'
                                        }}>{registeredPermanentId}</div>
                                    </div>
                                    
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe' }}>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af', lineHeight: '1.5' }}>
                                            <strong>Pro Tip:</strong> Ensure your broadcasting device is powered ON and within 5 meters of the scanning station.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                                    <h4 style={{ color: '#e11d48', margin: '0 0 0.5rem 0' }}>No Permanent ID Found</h4>
                                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>You must register your device in the profile section before marking attendance.</p>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Active Broadcast List */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ 
                                fontSize: '1.25rem', 
                                marginBottom: '1.5rem', 
                                color: '#1e293b', 
                                borderBottom: '2px solid #e2e8f0', 
                                paddingBottom: '0.75rem', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                fontWeight: '700'
                            }}>
                                <span>Live Classroom Scan</span>
                                {isScanning && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scanning</span>
                                        <div className="loading-spinner" style={{ width: '18px', height: '18px', border: '2.5px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    </div>
                                )}
                            </h3>
                            
                            <div style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '1rem',
                                height: '300px',
                                overflowY: 'auto',
                                background: '#fff',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}>
                                {devices.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8' }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                                            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            <path d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                        </svg>
                                        <p>{isScanning ? 'Synchronizing with ESP32...' : 'No active broadcasts.'}</p>
                                    </div>
                                ) : (
                                    [...devices].sort((a, b) => {
                                        if (a.permanentId === registeredPermanentId) return -1;
                                        if (b.permanentId === registeredPermanentId) return 1;
                                        return 0;
                                    }).map((device, index) => {
                                        const isMatch = device.permanentId === registeredPermanentId;
                                        return (
                                            <div
                                                key={device.permanentId || index}
                                                style={{
                                                    padding: '16px 20px',
                                                    borderBottom: index < devices.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                    background: isMatch ? '#f0fdf4' : '#fff',
                                                    borderLeft: isMatch ? '6px solid #22c55e' : 'none',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ 
                                                        fontWeight: 700, 
                                                        color: isMatch ? '#166534' : '#1e293b',
                                                        fontSize: '1rem'
                                                    }}>
                                                        Device Name : {device.name || "Unknown"}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        fontFamily: 'monospace',
                                                        color: isMatch ? '#15803d' : '#64748b',
                                                        marginTop: '4px'
                                                    }}>
                                                        Permanent ID : {device.permanentId}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ 
                                                        fontSize: '11px', 
                                                        fontWeight: '800', 
                                                        color: isMatch ? '#22c55e' : '#94a3b8',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {isMatch ? 'Match Found' : 'Nearby'}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: isMatch ? '#166534' : '#475569', fontWeight: '600' }}>
                                                        {device.rssi} dBm
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {verificationStatus !== 'scanning' && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    if (verificationStatus === 'success') {
                                        onComplete({ verified: true, status: 'present' });
                                    } else {
                                        onClose();
                                    }
                                }}
                                style={{
                                    padding: '12px 60px',
                                    background: verificationStatus === 'success' ? '#10b981' : '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                {verificationStatus === 'success' ? 'OK' : 'Close'}
                            </button>
                        </div>
                    )}

                </div>
            </div>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default BleVerificationModal;
