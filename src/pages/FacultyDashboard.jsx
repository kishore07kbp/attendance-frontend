import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ManageStudents from '../components/ManageStudents';
import DailyAttendance from '../components/DailyAttendance';
import AttendanceReports from '../components/AttendanceReports';
import DeviceManagement from '../components/DeviceManagement';
import Analytics from '../components/Analytics';
import FacultyDashboardHome from '../components/FacultyDashboardHome';
import ManageCourses from '../components/ManageCourses';
import FacultyProfile from '../components/FacultyProfile';
import './Dashboard.css';

const getInitials = (name) => {
  if (!name) return 'JA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.slice(0, 2) || 'JA').toUpperCase();
};

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard faculty-dashboard">
      <aside className="sidebar faculty-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
            <span className="sidebar-logo-smart">Smart</span>
            <span className="sidebar-logo-attend">Attend</span>
          </h1>
          <p className="sidebar-subtitle">Faculty Portal</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/faculty" end className="nav-item" title="Dashboard">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33333 3.33333H8.33333V8.33333H3.33333V3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.6667 3.33333H16.6667V8.33333H11.6667V3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.33333 11.6667H8.33333V16.6667H3.33333V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.6667 11.6667H16.6667V16.6667H11.6667V11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </NavLink>

          <NavLink to="/faculty/profile" className="nav-item" title="Profile">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Profile
          </NavLink>

          <NavLink to="/faculty/students" className="nav-item" title="Manage Students">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Students
          </NavLink>

          <NavLink to="/faculty/courses" className="nav-item" title="Courses">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Courses
          </NavLink>

          <NavLink to="/faculty/attendance" className="nav-item" title="Daily Attendance">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8333 3.33333H4.16667C3.24619 3.33333 2.5 4.07953 2.5 5V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V5C17.5 4.07953 16.7538 3.33333 15.8333 3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.3333 1.66667V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.66667 1.66667V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2.5 8.33333H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.25 11.25L7.91667 12.9167L10.8333 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Attendance
          </NavLink>



          <NavLink to="/faculty/analytics" className="nav-item" title="Analytics">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6667 17.5H3.33333V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.6667 5.83333L11.25 11.25L8.33333 8.33333L3.33333 13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Analytics
          </NavLink>

          <NavLink to="/faculty/reports" className="nav-item" title="Reports">
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 5.83333H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M2.5 10H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M2.5 14.1667H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6.66667 2.5V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13.3333 2.5V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Reports
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
          <button type="button" onClick={handleLogout} className="btn-logout faculty-btn-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content faculty-dashboard-content">
          <Routes>
            <Route index element={<FacultyDashboardHome />} />
            <Route path="profile" element={<FacultyProfile />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="attendance" element={<DailyAttendance />} />

            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<AttendanceReports />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
