import React from 'react';
import './DownloadApp.css';

const DownloadApp = () => {
    const apkUrl = "https://github.com/S-THAMARAI-SELVAN/Smart-Attendance-App/releases/download/v1.0/app-release.apk";

    return (
        <div className="download-container">
            <div className="download-blur-bg"></div>
            <div className="download-card">
                <div className="app-icon-wrapper">
                    <div className="app-icon-circle">
                         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 7V12C3 16.55 6.36 20.74 12 22C17.64 20.74 21 16.55 21 12V7L12 2Z" fill="url(#grad1)"/>
                            <path d="M12 17V11M12 11L15 14M12 11L9 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <defs>
                                <linearGradient id="grad1" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#6366f1" />
                                    <stop offset="1" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                <h1 className="download-title">Bunk Tracer App</h1>
                <p className="download-description">
                    The next generation of attendance tracking. 
                    Uses Bluetooth Low Energy (BLE) to detect your device in the classroom automatically. 
                    Secure, proxyless, and seamless.
                </p>

                <div className="download-features">
                    <div className="feature-item">
                        <span className="feature-dot"></span>
                        <span>Auto-Detection via BLE</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-dot"></span>
                        <span>Secure Face Verification</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-dot"></span>
                        <span>Real-time Sync</span>
                    </div>
                </div>

                <a href={apkUrl} className="download-button" download>
                    <span className="button-icon">📱</span>
                    <span className="button-text">Download APK</span>
                </a>

                <div className="download-footer">
                    <div className="compatibility-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Compatible with Android devices
                    </div>
                    <p className="version-tag">Version 1.0 • Stable Build</p>
                </div>
            </div>
            
            <div className="back-link-wrap">
                <button onClick={() => window.history.back()} className="back-link">
                    ← Back to Portal
                </button>
            </div>
        </div>
    );
};

export default DownloadApp;
