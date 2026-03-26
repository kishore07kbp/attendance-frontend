import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import FaceScanModal from './FaceScanModal';
import BleRegisterModal from './BleRegisterModal';
import API_URL from '../config';

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr; // Already formatted AM/PM time
  }
  const [hourString, minute] = timeStr.split(':');
  const hour = parseInt(hourString, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const hourFormatted = String(hour12).padStart(2, '0');
  const minuteFormatted = minute.length === 1 ? `0${minute}` : minute;
  return `${hourFormatted}:${minuteFormatted} ${ampm}`;
};

const Profile = ({ student, onUpdate }) => {
  const { user, fetchUser } = useAuth();
  const [faceScanModalOpen, setFaceScanModalOpen] = useState(false);
  const [bleScanModalOpen, setBleScanModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', rollNumber: '' });

  const needsFaceRegistration = !student?.faceDescriptor || student.faceDescriptor.length === 0;
  const needsPermanentIdRegistration = !student?.permanentId || student.permanentId === '' || student.permanentId.startsWith('PENDING_');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/courses/student`);
        if (response.data.success) setCourses(response.data.courses);
      } catch (err) {
        console.error('Failed to fetch courses');
      }
    };
    if (user && user.role === 'student') fetchCourses();
  }, [user]);

  const startEditing = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
      rollNumber: student?.rollNumber || ''
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({ name: '', email: '', rollNumber: '' });
  };

  const saveProfile = async () => {
    if (!editData.name.trim() || !editData.email.trim() || !editData.rollNumber.trim()) {
      return toast.error("All fields are required");
    }

    setEditLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/students/profile`, editData);
      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        await fetchUser();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const infoRows = [
    { label: 'FULL NAME', key: 'name', value: user?.name || '—' },
    { label: 'EMAIL', key: 'email', value: user?.email || '—' },
    { label: 'ROLL NUMBER', key: 'rollNumber', value: student?.rollNumber ? student.rollNumber.toUpperCase() : 'N/A' },
    { label: 'YEAR', key: 'year', value: student?.year ? `${student.year} Year` : '—', readOnly: true },
    { label: 'CLASS', key: 'studentClass', value: student?.studentClass || '—', readOnly: true },
    { label: 'CLASS ADVISOR', key: 'classAdvisorName', value: student?.classAdvisorName || 'Not Assigned', readOnly: true },
    { label: 'ACCOUNT ROLE', key: 'role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student', readOnly: true }
  ];

  // Handler for face registration
  const handleFaceRegistration = async (descriptor) => {
    try {
      const response = await axios.post(`${API_URL}/api/students/register-face`, {
        faceDescriptor: descriptor
      });

      if (response.data.success) {
        toast.success('✓ Face registered successfully!');
        setFaceScanModalOpen(false);
        if (onUpdate) onUpdate(); // Refresh student data
      } else {
        toast.error(response.data.message || 'Failed to register face');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to register face';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="profile-page">
      <h1 className="profile-page-title">My Profile</h1>

      <div className="profile-cards">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="profile-card profile-card-personal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="profile-card-title" style={{ margin: 0 }}>Personal Information</h2>
              {!isEditing ? (
                <button onClick={startEditing} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={saveProfile} disabled={editLoading} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>{editLoading ? 'Saving...' : 'Save'}</button>
                  <button onClick={cancelEditing} disabled={editLoading} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Cancel</button>
                </div>
              )}
            </div>

            <dl className="profile-info-list">
              {infoRows.map(({ label, key, value, readOnly }) => (
                <div key={label} className="profile-info-row">
                  <dt className="profile-info-label">{label}</dt>
                  <dd className="profile-info-value">
                    {isEditing && !readOnly ? (
                      <input
                        type={key === 'email' ? 'email' : 'text'}
                        value={editData[key]}
                        onChange={(e) => setEditData({ ...editData, [key]: key === 'rollNumber' ? e.target.value.toUpperCase() : e.target.value })}
                        style={{ padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', width: '100%', maxWidth: '300px' }}
                      />
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="profile-card profile-card-personal">
            <h2 className="profile-card-title">My Courses</h2>
            {courses.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No courses have been assigned to your Class and Year yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {courses.map(course => (
                  <div key={course._id} style={{ padding: '0.9rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0 0 0.4rem 0' }}>{course.title}</h3>
                    <p style={{ color: '#4b5563', margin: '0 0 0.2rem 0', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '500' }}>Faculty:</span> {course.facultyName}
                    </p>
                    <p style={{ color: '#4b5563', margin: 0, fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: '500' }}>Schedule:</span> {course.day}
                    </p>
                    <p style={{ color: '#6b7280', margin: '0.2rem 0 0 0', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      ({formatTime(course.startTime)} - {formatTime(course.endTime)})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          <div className={`profile-card profile-card-face ${needsFaceRegistration ? 'profile-card-face-pending' : 'profile-card-face-done'}`}>
            <h2 className="profile-card-title profile-card-title-face">
              Face Data Status
              {needsFaceRegistration ? (
                <svg className="profile-warning-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3.33333L1.66667 16.6667H18.3333L10 3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 8.33333V11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10 14.1667C10.4602 14.1667 10.8333 13.7936 10.8333 13.3333C10.8333 12.8731 10.4602 12.5 10 12.5C9.53976 12.5 9.16667 12.8731 9.16667 13.3333C9.16667 13.7936 9.53976 14.1667 10 14.1667Z" fill="currentColor" />
                </svg>
              ) : (
                <svg className="profile-check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.6667 5L7.5 14.1667L3.33333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </h2>
            {needsFaceRegistration ? (
              <>
                <p className="profile-face-message">
                  You need to register your face data to mark attendance.
                </p>
                <button
                  type="button"
                  className="profile-btn-register"
                  onClick={() => setFaceScanModalOpen(true)}
                >
                  Register Face Data
                </button>
              </>
            ) : (
              <p className="profile-face-message profile-face-done">
                Your face data is registered. You can mark attendance from the dashboard.
              </p>
            )}
          </div>

          <div className={`profile-card profile-card-face ${needsPermanentIdRegistration ? 'profile-card-face-pending' : 'profile-card-face-done'}`}>
            <h2 className="profile-card-title profile-card-title-face">
              Permanent ID Status
              {needsPermanentIdRegistration ? (
                <svg className="profile-warning-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3.33333L1.66667 16.6667H18.3333L10 3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 8.33333V11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10 14.1667C10.4602 14.1667 10.8333 13.7936 10.8333 13.3333C10.8333 12.8731 10.4602 12.5 10 12.5C9.53976 12.5 9.16667 12.8731 9.16667 13.3333C9.16667 13.7936 9.53976 14.1667 10 14.1667Z" fill="currentColor" />
                </svg>
              ) : (
                <svg className="profile-check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.6667 5L7.5 14.1667L3.33333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </h2>
            {needsPermanentIdRegistration ? (
              <>
                <p className="profile-face-message">
                  To register your Permanent ID, please install the <strong>Bunk Tracer</strong> mobile app first. Use the app to complete the registration for secure attendance tracking.
                </p>
                <button
                  type="button"
                  className="profile-btn-register"
                  onClick={() => setBleScanModalOpen(true)}
                >
                  Scan Permanent ID
                </button>
              </>
            ) : (
              <div>
                <p className="profile-face-message profile-face-done" style={{ marginBottom: '0.5rem' }}>
                  Your Permanent ID is registered successfully.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#111827', margin: 0, fontWeight: 600 }}>
                    Device Name : {(!student?.bleDeviceName || student.bleDeviceName === 'Unknown Device') ? student?.rollNumber : student.bleDeviceName}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, fontFamily: 'monospace', background: '#e5e7eb', padding: '0.4rem 0.6rem', borderRadius: '0.375rem', display: 'inline-block', width: 'fit-content', border: '1px solid #d1d5db' }}>
                    Permanent ID : {student?.permanentId}
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-btn-register"
                  style={{ marginTop: '1.2rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
                  onClick={() => setBleScanModalOpen(true)}
                >
                  Change Permanent ID
                </button>
              </div>
            )}
          </div>
          <div className="profile-card profile-card-app" style={{ 
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
            border: 'none',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background element */}
            <div style={{ 
              position: 'absolute', 
              top: '-20px', 
              right: '-20px', 
              width: '100px', 
              height: '100px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '50%' 
            }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '0.45rem', borderRadius: '0.6rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="2" width="12" height="20" rx="3" stroke="white" strokeWidth="2"/>
                    <path d="M11 5H13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18.5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="profile-card-title" style={{ margin: 0, color: 'white', letterSpacing: '0.025em' }}>Bunk Tracer App</h2>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>v1.0.2</span>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '1rem', 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("https://github.com/S-THAMARAI-SELVAN/Smart-Attendance-App/releases/download/v1.0/app-release.apk")}`} 
                  alt="Bunk Tracer Download" 
                  style={{ width: '160px', height: '160px', display: 'block' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 4V16M12 16L8 12M12 16L16 12M4 20H20" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                   <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Scan to Install</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 500, lineHeight: '1.4', margin: 0 }}>
                    Mark attendance with one tap.
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                    Experience the fastest and most secure way to track your attendance using our new BLE-based mobile solution.
                  </p>
                </div>
                
                <Link 
                  to="/download" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: 'white',
                    borderRadius: '0.75rem',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    width: 'fit-content'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(99, 102, 241, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Go to Download Page
                </Link>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                    Real-time BLE verification
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                    Secure proxy-proof marking
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FaceScanModal
        isOpen={faceScanModalOpen}
        onClose={() => setFaceScanModalOpen(false)}
        onFaceVerified={handleFaceRegistration}
        isRegistration={true}
      />

      <BleRegisterModal
        isOpen={bleScanModalOpen}
        onClose={() => setBleScanModalOpen(false)}
        student={student}
        onRegister={() => {
          if (onUpdate) onUpdate();
          if (fetchUser) fetchUser();
        }}
      />
    </div>
  );
};

export default Profile;
