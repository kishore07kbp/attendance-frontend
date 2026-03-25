import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableCourses, setAvailableCourses] = useState([]);

  useEffect(() => {
    updateCourseList();
  }, [filterYear, filterClass]);

  useEffect(() => {
    fetchStats();
  }, [filterYear, filterClass, filterCourse, filterDate]);

  const updateCourseList = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses/faculty`);
      if (response.data.success) {
        let filtered = response.data.courses;
        if (filterYear !== 'All') filtered = filtered.filter(c => c.year === filterYear);
        if (filterClass !== 'All') filtered = filtered.filter(c => c.studentClass === filterClass);
        
        const uniqueTitles = [...new Set(filtered.map(c => c.title))].sort();
        setAvailableCourses(uniqueTitles);
        
        // Reset course filter if it's no longer in the list (except for 'All')
        if (filterCourse !== 'All' && !uniqueTitles.includes(filterCourse)) {
          setFilterCourse('All');
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/faculty/attendance/stats`, {
        params: {
          year: filterYear,
          studentClass: filterClass,
          course: filterCourse,
          startDate: filterDate,
          endDate: filterDate
        }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const pieData = [
    { name: 'Present', value: stats?.presentCount || 0 },
    { name: 'Absent', value: stats?.absentCount || 0 },
    { name: 'Late', value: stats?.lateCount || 0 }
  ].filter(item => item.value > 0);

  const getColor = (name) => {
    if (name === 'Present') return '#10b981';
    if (name === 'Absent') return '#ef4444';
    if (name === 'Late') return '#f59e0b';
    return '#8884d8';
  };

  // Derive unique classes from the breakdown stats if available
  const uniqueClasses = stats?.breakdown
    ? [...new Set(Object.values(stats.breakdown).flatMap(classes => Object.keys(classes)))].sort()
    : [];

  const formatDateForDisplay = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="analytics-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Analytics Dashboard</h2>
        {filterCourse !== 'All' && (
          <span style={{ 
            padding: '0.4rem 0.8rem', 
            backgroundColor: '#dbeafe', 
            color: '#1e40af', 
            borderRadius: '2rem', 
            fontSize: '0.8rem', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#1e40af', borderRadius: '50%' }}></span>
            {filterDate === new Date().toISOString().split('T')[0] ? "Today's View" : `View for ${formatDateForDisplay(filterDate)}`}
          </span>
        )}
      </div>
      <div className="analytics-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Academic Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', outline: 'none', background: 'white', minWidth: '120px' }}
          >
            <option value="All">All Years</option>
            <option value="I">I Year</option>
            <option value="II">II Year</option>
            <option value="III">III Year</option>
            <option value="IV">IV Year</option>
          </select>
        </div>

        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Section / Class</label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', outline: 'none', background: 'white', minWidth: '120px' }}
          >
            <option value="All">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Course List</label>
          <select 
            value={filterCourse} 
            onChange={(e) => setFilterCourse(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', outline: 'none', background: 'white', minWidth: '150px' }}
          >
            <option value="All">All Courses</option>
            {availableCourses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Select Date</label>
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: '0.45rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', outline: 'none', background: 'white' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb' }}>{stats?.totalStudents || 0}</div>
          <div style={{ color: '#6b7280' }}>Total Student</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats?.presentCount || 0}</div>
          <div style={{ color: '#6b7280' }}>Present</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{stats?.absentCount || 0}</div>
          <div style={{ color: '#6b7280' }}>Absent</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats?.attendanceRate || 0.00}%</div>
          <div style={{ color: '#6b7280' }}>Attendance Rate</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pieData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">System Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p><strong>Total Students:</strong> {stats?.totalStudents || 0}</p>
          </div>
          <div>
            <p><strong>Students with Face Registered:</strong> {stats?.studentsWithFace || 0}</p>
          </div>
          <div>
            <p><strong>Face Registration Rate:</strong> {stats?.faceRegistrationRate || 0}%</p>
          </div>
        </div>
      </div>

      {filterCourse !== 'All' && stats?.studentList && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 className="card-title">Today's Attendance Detail: {filterCourse}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Roll Number</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Student Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.studentList.map(student => (
                  <tr key={student._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>{student.rollNumber}</td>
                    <td style={{ padding: '0.75rem' }}>{student.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: student.status === 'present' ? '#d1fae5' : '#fee2e2',
                        color: student.status === 'present' ? '#065f46' : '#991b1b'
                      }}>
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {student.time || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.studentList.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No students found for this selection.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

