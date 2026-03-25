import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo-container">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7V12C3 16.55 6.36 20.74 12 22C17.64 20.74 21 16.55 21 12V7L12 2Z" fill="#2563eb"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">SmartAttend</span>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn-get-started">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="content-container">
          <div className="feature-tag">
            <span className="tag-dot"></span>
            <span className="tag-text">Next Gen Attendance System</span>
          </div>
          
          <h1 className="main-headline">
            Secure, Fast, and
            <br />
            <span className="headline-smart">Smart</span>
            <span className="headline-attendance"> Attendance</span>
          </h1>
          
          <p className="main-description">
            Leveraging Face Recognition and Bluetooth Low Energy (BLE) technology to ensure accurate and proxy-proof attendance tracking for educational institutions.
          </p>
          
          <div className="cta-buttons">
            <Link to="/register" className="btn-student">Start as Student</Link>
            <Link to="/login" className="btn-faculty">Faculty Portal</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;


