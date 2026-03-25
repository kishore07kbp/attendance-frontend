import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from "socket.io-client";
import API_URL from '../config';



const BleRegisterModal = ({ isOpen, onClose, onRegister, student }) => {

    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    
    const socketRef = useRef(null);

    useEffect(() => {
        // Use window.location.hostname to connect to the server's IP
        const serverUrl = API_URL;
        socketRef.current = io(serverUrl);

        socketRef.current.on("connect", () => {
            console.log("Socket connected:", socketRef.current.id);
        });

        socketRef.current.on("ble-device-detected", (device) => {
            if (!isOpen) return; // Only process if modal is actively open
            
            console.log("Device detected via socket:", device);
            setDevices(prev => {
                const now = new Date();
                const lastSeenTime = new Date(device.lastSeen);
                
                // If the signal is too old (e.g. delayed network packet), ignore it
                if (now - lastSeenTime > 5000) return prev;

                const exists = prev.some(d => d.permanentId === device.permanentId);
                if (exists) {
                    return prev.map(d => d.permanentId === device.permanentId ? device : d);
                }
                return [...prev, device];
            });
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const fetchDevices = async () => {
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
        } catch (error) {
            console.error("Fetch devices error:", error);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        setDevices([]); // Clear previous list for a fresh scan
        setIsScanning(true);
        fetchDevices();

        const interval = setInterval(() => {
            fetchDevices();
            // Local pruning: remove devices not seen in last 5 seconds locally to be snappy
            setDevices(current => {
                const now = new Date();
                return current.filter(d => (now - new Date(d.lastSeen)) < 5000);
            });
        }, 2000); // 2 second refresh for fast removal

        return () => {
            clearInterval(interval);
            setIsScanning(false);
        };
    }, [isOpen]);

    const handleSave = async () => {
        if (!selectedDevice) {
            toast.error('Please select a device to register.');
            return;
        }

        const selectedMatch = devices.find(d => d.permanentId === selectedDevice);
        const deviceRoll = selectedMatch?.name?.toString().toUpperCase();
        const studentRoll = student?.rollNumber?.toString().toUpperCase();

        console.log("Verification check:", { deviceRoll, studentRoll });

        // 1. Check if roll number matches
        if (deviceRoll !== studentRoll) {
            toast.error('Please select the correct device');
            return;
        }

        // 2. The permanent id is not store to db again (as per requirement)
        // We just show success as the roll number matches
        toast.success(`✓ Device for Roll ${studentRoll} verified!`);
        
        // Trigger onRegister to possibly update UI state if needed, though DB won't change
        if (onRegister) onRegister();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="face-scan-modal-overlay" onClick={onClose}>
            <div className="face-scan-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                <div className="face-scan-modal-header">
                    <div>
                        <h2 className="face-scan-modal-title">Permanent ID Registration</h2>
                        <p className="face-scan-modal-subtitle">
                            Choose your broadcasted device from the list
                        </p>
                    </div>
                    <button className="face-scan-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="face-scan-modal-body" style={{ padding: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '14px' }}>
                        The ESP32 is scanning for your device. Select the one matching your Roll Number.
                    </p>

                    {isScanning && devices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 15px' }}></div>
                            <p style={{ fontWeight: 600 }}>Scanning for ESP32 devices...</p>
                            <small>Please wait</small>
                        </div>
                    ) : devices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', background: '#f9fafb', borderRadius: '12px' }}>
                            <p style={{ color: '#6b7280' }}>No active devices detected yet</p>
                            <small>Ensure the ESP32 is scanning and your device is broadcasting</small>
                        </div>
                    ) : (
                        <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            maxHeight: '350px',
                            overflowY: 'auto',
                            background: '#fff'
                        }}>
                            {devices.map((device, index) => (
                                <div
                                    key={device.permanentId || index}
                                    onClick={() => setSelectedDevice(device.permanentId)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: index < devices.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        background: selectedDevice === device.permanentId ? '#eff6ff' : '#fff',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', color: selectedDevice === device.permanentId ? '#2563eb' : '#111827' }}>
                                        Device Name : {device.name || "Unknown"}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        color: '#4b5563',
                                        background: '#f1f5f9',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        width: 'fit-content'
                                    }}>
                                        Permanent ID : {device.permanentId}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>RSSI: {device.rssi} dBm</span>
                                        <span>Last seen: {new Date(device.lastSeen).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={!selectedDevice}
                        style={{
                            marginTop: '20px',
                            width: '100%',
                            padding: '12px',
                            background: selectedDevice ? '#10b981' : '#d1d5db',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: selectedDevice ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                        }}
                    >
                        Register Selected Device
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BleRegisterModal;