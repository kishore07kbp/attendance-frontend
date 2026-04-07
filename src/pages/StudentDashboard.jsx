import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_URL from '../config';
import FaceRecognition from '../components/FaceRecognition';
import AttendanceHistory from '../components/AttendanceHistory';
import Profile from '../components/Profile';
import DashboardHome from '../components/DashboardHome';
import StudentTimeTable from '../components/StudentTimeTable';
import './Dashboard.css';

const getInitials = (name) => {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.slice(0, 2) || 'SA').toUpperCase();
};

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/students/profile`);
      setStudent(response.data.student);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard student-dashboard">
      <aside className="sidebar student-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
            <span className="sidebar-logo-smart">Smart</span>
            <span className="sidebar-logo-attend">Attend</span>
          </h1>
          <p className="sidebar-subtitle">Student Portal</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/student" end className="nav-item" title="Dashboard">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33333 3.33333H8.33333V8.33333H3.33333V3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.6667 3.33333H16.6667V8.33333H11.6667V3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.33333 11.6667H8.33333V16.6667H3.33333V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.6667 11.6667H16.6667V16.6667H11.6667V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </NavLink>
          <NavLink to="/student/history" className="nav-item" title="History">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6.66667V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            History
          </NavLink>
          <NavLink to="/student/timetable" className="nav-item" title="Time Table">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Time Table
          </NavLink>
          <NavLink to="/student/profile" className="nav-item" title="Profile">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 10C11.3807 10 12.5 8.88071 12.5 7.5C12.5 6.11929 11.3807 5 10 5C8.61929 5 7.5 6.11929 7.5 7.5C7.5 8.88071 8.61929 10 10 10Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16.6667 16.6667C16.6667 13.3522 13.6819 10.8333 10 10.8333C6.3181 10.8333 3.33333 13.3522 3.33333 16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Profile
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email ? (user.email.length > 24 ? user.email.slice(0, 21) + '...' : user.email) : ''}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="btn-logout student-btn-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="mark" element={<FaceRecognition student={student} onUpdate={fetchStudentProfile} />} />
            <Route path="history" element={<AttendanceHistory />} />
            <Route path="timetable" element={<StudentTimeTable />} />
            <Route path="profile" element={<Profile student={student} onUpdate={fetchStudentProfile} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;

