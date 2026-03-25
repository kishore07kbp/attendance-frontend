import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';
import AttendanceVerificationModal from './AttendanceVerificationModal';
import FaceScanModal from './FaceScanModal';
import BleVerificationModal from './BleVerificationModal';
import LiveClock from './LiveClock';

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayAttendances, setTodayAttendances] = useState([]); // List of today's attendance records
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [faceScanModalOpen, setFaceScanModalOpen] = useState(false);
  const [bleVerificationModalOpen, setBleVerificationModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch profile independently to ensure basic functionality
      try {
        const profileRes = await axios.get(`${API_URL}/api/students/profile`);
        if (profileRes.data?.success && profileRes.data.student) {
          setStudent(profileRes.data.student);
        }
      } catch (err) {
        console.error("Failed to fetch student profile:", err);
      }

      // Fetch stats and history
      try {
        const [statsRes, historyRes] = await Promise.all([
          axios.get(`${API_URL}/api/students/attendance-stats`).catch(e => ({ data: { success: false } })),
          axios.get(`${API_URL}/api/students/attendance-history`, { params: { limit: 50 } }).catch(e => ({ data: { success: false } }))
        ]);

        if (statsRes.data?.success) setStats(statsRes.data.stats);
        
        if (historyRes.data?.success && historyRes.data.attendance) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayRecords = historyRes.data.attendance.filter(
            (r) => new Date(r.date).setHours(0, 0, 0, 0) === today.getTime()
          );
          
          setTodayAttendances(todayRecords);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard secondary data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handler for Step 1: Course selection complete
  const handleCourseSelected = (course) => {
    // 1. Check if student has registered face data in profile
    const hasFaceData = student?.faceDescriptor && student.faceDescriptor.length > 0;
    
    if (!hasFaceData) {
      toast.error('register the face in profile', {
        position: "top-right",
        autoClose: 5000
      });
      return;
    }

    setSelectedCourse(course);
    setVerificationModalOpen(false);
    setFaceScanModalOpen(true);
  };

  const handleFaceVerified = async (descriptor) => {
    setFaceDescriptor(descriptor);
    setFaceScanModalOpen(false);

    // Refresh student data from server before check to handle recent registrations
    let currentStudent = student;
    try {
      const resp = await axios.get(`${API_URL}/api/students/profile`);
      if (resp.data.success) {
        currentStudent = resp.data.student;
        setStudent(currentStudent);
      }
    } catch (e) {
      console.warn("Could not refresh student profile for verification, using local state.");
    }

    const isPermanentIdRegistered = currentStudent?.permanentId && !currentStudent.permanentId.startsWith('PENDING_');
    const isBleDeviceIdRegistered = currentStudent?.bleDeviceId && !currentStudent.bleDeviceId.startsWith('PENDING_');

    if (!isPermanentIdRegistered && !isBleDeviceIdRegistered) {
      toast.error('You need to register your Permanent ID in the profile before marking attendance.');
      return;
    }

    // Proceed to Step 3: Verification
    setBleVerificationModalOpen(true);
  };

  // Step 3: BLE verification complete handler
  const handleBleVerificationComplete = async (verificationResult) => {
    setBleVerificationModalOpen(false);
    
    // Choose the best ID available (prioritize non-pending bleDeviceId, fallback to permanentId)
    let bleDeviceId = student?.bleDeviceId;
    if (!bleDeviceId || bleDeviceId.startsWith('PENDING_')) {
      bleDeviceId = student?.permanentId;
    }
    
    if (!bleDeviceId || bleDeviceId.startsWith('PENDING_')) {
        toast.error('Device ID not found. Please register in profile.');
        return;
    }

    try {
      // Mark attendance explicitly via backend dictating final status
      const response = await axios.post(`${API_URL}/api/students/mark-attendance`, {
        faceDescriptor: faceDescriptor,
        bleDeviceId,
        course: selectedCourse || 'Main Hall',
        status: verificationResult.status,
        bleVerified: verificationResult.verified
      });

      if (response.data.success) {
        if (verificationResult.status === 'present') {
           toast.success('✓ Attendance marked successfully!');
        } else {
           toast.error('Attendance marked as Absent (Device not verified).');
        }
        
        if (response.data.attendance) {
          setTodayAttendances(prev => [...prev, response.data.attendance]);
        }
        
        // Refresh stats
        const statsRes = await axios.get(`${API_URL}/api/students/attendance-stats`);
        if (statsRes.data.success) setStats(statsRes.data.stats);
      } else {
        toast.error(response.data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <header className="dashboard-header student-dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Student Dashboard</h1>
          <p className="dashboard-welcome">Welcome back, {user?.name || 'Student'}</p>
        </div>
        <div className="dashboard-header-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <LiveClock />
          <span className="system-status">
            <span className="status-dot"></span>
            System Online
          </span>
        </div>
      </header>

      <div className="dashboard-home-content">
        <div className="dashboard-home-grid">
          <div className="mark-attendance-card">
            <h2 className="mark-attendance-title">Mark Attendance</h2>
            <p className="mark-attendance-subtitle">Follow the steps to verify your presence.</p>
            <button
              type="button"
              className="btn-start-verification"
              onClick={() => setVerificationModalOpen(true)}
            >
              <svg className="btn-shield-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7V12C3 16.55 6.36 20.74 12 22C17.64 20.74 21 16.55 21 12V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Start Verification Process
            </button>
          </div>

          <div className="dashboard-side-cards">
            <div className="status-card">
              <h3 className="status-card-title">Today&apos;s Status</h3>
              {loading ? (
                <p className="status-card-value">...</p>
              ) : todayAttendances.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                  {todayAttendances.map((att, idx) => (
                    <p key={idx} className={`status-card-value status-${att.status}`} style={{ fontSize: '0.85rem', marginBottom: 0, padding: '0.2rem 0' }}>
                      <svg className="status-card-icon icon-clock" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                        <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10 6.66667V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span style={{ fontWeight: 600 }}>{att.course}</span> 
                      <span style={{ opacity: 0.8, marginLeft: '4px' }}>- {att.status === 'present' ? 'Present' : 'Absent'}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="status-card-value status-pending">
                  <svg className="status-card-icon icon-clock" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 6.66667V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Pending
                </p>
              )}
            </div>
            <div className="status-card">
              <h3 className="status-card-title">Classes Today</h3>
              <p className="status-card-value status-classes" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg className="status-card-icon icon-pin" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18.3333C10 18.3333 16.6667 8.33333 16.6667 5.83333C16.6667 3.00381 13.6819 0.833328 10 0.833328C6.3181 0.833328 3.33333 3.00381 3.33333 5.83333C3.33333 8.33333 10 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 7.5C11.3807 7.5 12.5 6.38071 12.5 5C12.5 3.61929 11.3807 2.5 10 2.5C8.61929 2.5 7.5 3.61929 7.5 5C7.5 6.38071 8.61929 7.5 10 7.5Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                {loading ? '...' : (
                  <span>
                    {stats?.todayClasses ?? 0}
                    <span style={{ fontSize: '1rem', opacity: 0.6, margin: '0 4px' }}>/</span>
                    {stats?.scheduledToday ?? '--'}
                  </span>
                )}
              </p>
            </div>
            <div className="status-card">
              <h3 className="status-card-title">Class Advisor</h3>
              <p className="status-card-value" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {loading ? '...' : (student?.classAdvisorName || 'Not Assigned')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AttendanceVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        onNext={handleCourseSelected}
      />

      <FaceScanModal
        isOpen={faceScanModalOpen}
        onClose={() => setFaceScanModalOpen(false)}
        onFaceVerified={handleFaceVerified}
        course={selectedCourse}
        registeredDescriptor={student?.faceDescriptor}
      />

      <BleVerificationModal
        isOpen={bleVerificationModalOpen}
        onClose={() => setBleVerificationModalOpen(false)}
        onComplete={handleBleVerificationComplete}
        student={student}
      />
    </>
  );
};

export default DashboardHome;
