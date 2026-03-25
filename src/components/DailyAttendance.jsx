import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';

const DailyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('All');
  const [filterClass, setFilterClass] = useState('All');

  useEffect(() => {
    fetchAttendance();
  }, [date]);
  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/faculty/attendance/daily`, {
        params: { date }
      });
      setAttendance(response.data.attendance || []);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  // Derive unique classes from the current attendance data for the filter
  const uniqueClasses = [...new Set(attendance.map(record => record.studentId?.studentClass).filter(Boolean))].sort();

  // Apply filters
  const filteredAttendance = attendance.filter(record => {
    const matchesYear = filterYear === 'All' || record.studentId?.year === filterYear;
    const matchesClass = filterClass === 'All' || record.studentId?.studentClass === filterClass;
    return matchesYear && matchesClass;
  });

  if (loading) {
    return <div className="loading">Loading attendance...</div>;
  }

  return (
    <div className="card">
      <h2 className="card-title">Daily Attendance</h2>
      
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Year</label>
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none', background: 'white', minWidth: '120px' }}
          >
            <option value="All">All Years</option>
            <option value="I">I Year</option>
            <option value="II">II Year</option>
            <option value="III">III Year</option>
            <option value="IV">IV Year</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Class</label>
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none', background: 'white', minWidth: '120px' }}
          >
            <option value="All">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Student</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Roll No.</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Year</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Class</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Time</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Course</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Verification</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((record) => (
              <tr key={record._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{record.studentId?.userId?.name || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>{record.studentId?.rollNumber || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>{record.studentId?.year || '—'}</td>
                <td style={{ padding: '0.75rem' }}>{record.studentId?.studentClass || '—'}</td>
                <td style={{ padding: '0.75rem' }}>{record.time}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    background: record.status === 'present' ? '#d1fae5' : '#fee2e2',
                    color: record.status === 'present' ? '#065f46' : '#991b1b'
                  }}>
                    {record.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>{record.course || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {record.faceVerified && record.bleVerified ? '✓ Both' : 
                   record.faceVerified ? 'Face Only' :
                   record.bleVerified ? 'BLE Only' : 'Manual'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No attendance records for this date
          </p>
        ) : filteredAttendance.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No records match the selected filters
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default DailyAttendance;

