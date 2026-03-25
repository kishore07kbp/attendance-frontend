import React, { useState, useEffect } from 'react';
import LiveClock from './LiveClock';
import axios from 'axios';
import API_URL from '../config';

const formatDate = (d) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const date = new Date(d);
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${month} ${day}${suffix} ${year}`;
};

const FacultyDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [expandedYear, setExpandedYear] = useState(null);
  const [filterYear, setFilterYear] = useState('All');
  const [filterClass, setFilterClass] = useState('All');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, dailyRes] = await Promise.all([
          axios.get(`${API_URL}/api/faculty/attendance/stats`, { 
            params: { 
              startDate: today, 
              endDate: today,
              year: filterYear,
              studentClass: filterClass
            } 
          }),
          axios.get(`${API_URL}/api/faculty/attendance/daily`, { 
            params: { 
              date: today,
              year: filterYear,
              studentClass: filterClass
            } 
          })
        ]);
        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (dailyRes.data.success) setDailyAttendance(dailyRes.data.attendance || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterYear, filterClass]);

  const totalStudents = stats?.totalStudents ?? 0;
  const attendanceRate = stats?.attendanceRate ?? 0;
  const presentCount = stats?.presentCount ?? 0;
  const absentCount = stats?.absentCount ?? 0;

  // Extract unique classes for the department to populate the filter
  const allAvailableClasses = stats?.breakdown 
    ? Object.values(stats.breakdown).flatMap(classes => Object.keys(classes))
    : [];
  const uniqueClasses = [...new Set(allAvailableClasses)].sort();

  // Filter attendance log based on selection
  const filteredAttendance = dailyAttendance.filter(record => {
    const matchesYear = filterYear === 'All' || record.studentId?.year === filterYear;
    const matchesClass = filterClass === 'All' || record.studentId?.studentClass === filterClass;
    return matchesYear && matchesClass;
  });

  return (
    <>
      <header className="faculty-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="faculty-header-left">
          <h1 className="faculty-dashboard-title">Faculty Dashboard</h1>
          <p className="faculty-dashboard-date">{formatDate(new Date())}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>Year</span>
            <select 
              value={filterYear} 
              onChange={(e) => { setFilterYear(e.target.value); setFilterClass('All'); }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.85rem', background: '#fff', outline: 'none' }}
            >
              <option value="All">All Years</option>
              <option value="I">I Year</option>
              <option value="II">II Year</option>
              <option value="III">III Year</option>
              <option value="IV">IV Year</option>
            </select>
          </div>

          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>Class</span>
            <select 
              value={filterClass} 
              onChange={(e) => setFilterClass(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.85rem', background: '#fff', outline: 'none' }}
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="faculty-header-right">
            <LiveClock />
          </div>
        </div>
      </header>

      <div className="faculty-dashboard-content">
        <div className="faculty-cards-row">
          <div className={`faculty-stat-card student-breakdown-card ${showBreakdown ? 'expanded' : ''}`}>
            <span className="faculty-stat-label">Total Student</span>
            <div className="faculty-stat-value-wrap">
              <span className="faculty-stat-value">{loading ? '—' : totalStudents}</span>
              <svg className="faculty-stat-icon faculty-stat-icon-people" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {!loading && stats?.breakdown && (
              <button 
                className="breakdown-toggle-btn"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                {showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
                <svg className={`chevron-icon ${showBreakdown ? 'rotated' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {showBreakdown && !loading && stats?.breakdown && (
              <div className="breakdown-container">
                {['I', 'II', 'III', 'IV'].map(year => {
                  const classData = stats.breakdown[year] || {};
                  const yearTotal = Object.values(classData).reduce((a, b) => a + b, 0);
                  
                  return (
                    <div key={year} className="year-row">
                      <div 
                        className="year-header"
                        onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                      >
                        <span>{year} Year</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="year-indicator">{yearTotal}</span>
                          <svg className={`chevron-icon ${expandedYear === year ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      {expandedYear === year && (
                        <div className="class-list">
                          {Object.keys(classData).length > 0 ? (
                            Object.entries(classData).sort().map(([className, count]) => (
                              <div key={className} className="class-item">
                                <span>{className}</span>
                                <span className="class-count">{count}</span>
                              </div>
                            ))
                          ) : (
                            <div className="class-item" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                              No students registered
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="faculty-stat-card">
            <span className="faculty-stat-label">Present</span>
            <div className="faculty-stat-value-wrap">
              <span className="faculty-stat-value" style={{ color: '#10b981' }}>{loading ? '—' : presentCount}</span>
              <span className="faculty-stat-icon" style={{ color: '#10b981' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
          <div className="faculty-stat-card">
            <span className="faculty-stat-label">Absent</span>
            <div className="faculty-stat-value-wrap">
              <span className="faculty-stat-value" style={{ color: '#ef4444' }}>{loading ? '—' : absentCount}</span>
              <span className="faculty-stat-icon" style={{ color: '#ef4444' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="faculty-log-card">
          <div className="faculty-log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="faculty-log-title" style={{ margin: 0 }}>Daily Attendance Log</h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Showing: <strong>{filterYear} Year</strong> / <strong>{filterClass} Class</strong>
            </div>
          </div>
          <div className="faculty-table-wrap">
            <table className="faculty-log-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>ROLL NO</th>
                  <th>YEAR</th>
                  <th>CLASS</th>
                  <th>TIME</th>
                  <th>FACE</th>
                  <th>BLE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="faculty-table-empty">Loading...</td>
                  </tr>
                ) : dailyAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="faculty-table-empty">No records found for the selected filter.</td>
                  </tr>
                ) : (
                  dailyAttendance.map((record) => (
                    <tr key={record._id}>
                      <td>{record.studentId?.userId?.name || 'N/A'}</td>
                      <td>{record.studentId?.rollNumber || 'N/A'}</td>
                      <td>{record.studentId?.year || '—'}</td>
                      <td>{record.studentId?.studentClass || '—'}</td>
                      <td>{record.time || '—'}</td>
                      <td>{record.faceVerified ? '✓' : '—'}</td>
                      <td>{record.bleVerified ? '✓' : '—'}</td>
                      <td>
                        <span className={`faculty-status-badge faculty-status-${record.status || 'present'}`}>
                          {record.status || 'present'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyDashboardHome;
