import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AttendanceHistory = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [dailySummary, setDailySummary] = useState([]);

  useEffect(() => {
    fetchAttendance();
    fetchStats();
  }, []);

  const fetchAttendance = async () => {
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await axios.get(`${API_URL}/api/students/attendance-history`, { params });
      setAttendance(response.data.attendance);
      setDailySummary(response.data.dailySummary || []);
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/students/attendance-stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleFilter = () => {
    setLoading(true);
    fetchAttendance();
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const chartData = dailySummary.map(item => ({
    date: formatDate(item.date),
    status: item.points
  }));

  if (loading) {
    return <div className="loading">Loading attendance history...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Attendance Statistics</h2>
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.totalDays}</div>
              <div style={{ color: '#6b7280' }}>Total Days</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.presentDays}</div>
              <div style={{ color: '#6b7280' }}>Present</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.absentDays}</div>
              <div style={{ color: '#6b7280' }}>Absent</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.attendancePercentage}%</div>
              <div style={{ color: '#6b7280' }}>Attendance Rate</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Attendance History</h2>

        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
          />
          <button onClick={handleFilter} className="btn btn-primary">Filter</button>
        </div>

        {chartData.length > 0 && (
          <div style={{ marginBottom: '2rem', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => {
                    if (value === 1) return ['Full Day (1.0)', 'Attendance'];
                    if (value === 0.5) return ['Half Day (0.5)', 'Attendance'];
                    return ['Absent (0.0)', 'Attendance'];
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="stepAfter"
                  dataKey="status"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                  name="Presence"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Time</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Course</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Face Verified</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>BLE Verified</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{formatDate(record.date)}</td>
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
                    {record.faceVerified ? '✓' : '✗'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {record.bleVerified ? '✓' : '✗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendance.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No attendance records found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;

