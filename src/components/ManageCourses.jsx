import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';

const DEPARTMENTS = ['CCE', 'IT', 'CSBS', 'MECH', 'EEE', 'AIML', 'CSE-A', 'CSE-B', 'CSE-C', 'CSE-CYS', 'ECE-A', 'ECE-B', 'ECE-C', 'AIDS-A', 'AIDS-B', 'AIDS-C', 'AIDS-D'];
const YEARS = ['I', 'II', 'III', 'IV'];

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr; // Already formatted
  }
  const [hourString, minute] = timeStr.split(':');
  const hour = parseInt(hourString, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const hourFormatted = String(hour12).padStart(2, '0');
  const minuteFormatted = minute.length === 1 ? `0${minute}` : minute;
  return `${hourFormatted}:${minuteFormatted} ${ampm}`;
};

const CustomTimePicker = ({ value, onChange, name }) => {
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('AM');

  useEffect(() => {
    if (value) {
      if (value.includes('AM') || value.includes('PM')) {
        const [t, modifier] = value.split(' ');
        setTime(t);
        setAmpm(modifier);
      } else {
        const [h, m] = value.split(':');
        const hInt = parseInt(h, 10);
        setTime(`${String(hInt % 12 || 12).padStart(2, '0')}:${m.padStart(2, '0')}`);
        setAmpm(hInt >= 12 ? 'PM' : 'AM');
      }
    } else {
      setTime('');
      setAmpm('AM');
    }
  }, [value]);

  const handleUpdate = (t, a) => {
    if (t) {
      onChange({ target: { name, value: `${t} ${a}` } });
    } else {
      // Don't update parent if incomplete
      onChange({ target: { name, value: '' } });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
      <input 
        type="text"
        value={time} 
        onChange={(e) => { 
          let inputVal = e.target.value;
          // Handle backspace perfectly so they can delete the colon and digits seamlessly
          if (time.endsWith(':') && inputVal.length === 2 && inputVal === time.slice(0, 2)) {
             inputVal = inputVal.slice(0, 1);
          }
          
          let val = inputVal.replace(/[^0-9]/g, ''); // Extract purely digits
          
          if (val.length > 4) {
             val = val.slice(0, 4);
          }

          let formattedVal = val;
          if (val.length >= 2) {
             let hhStr = val.slice(0, 2);
             let hh = parseInt(hhStr, 10);
             if (hh === 0) {
               hhStr = '01';
             } else if (hh > 12) {
               hhStr = '12';
             }
             
             let mmStr = val.slice(2);
             if (mmStr.length === 2) {
               let mm = parseInt(mmStr, 10);
               if (mm > 59) {
                 mmStr = '59';
               }
             }
             formattedVal = hhStr + ':' + mmStr;
          }
          
          setTime(formattedVal); 
          handleUpdate(formattedVal, ampm); 
        }}
        placeholder="HH:MM"
        maxLength="5"
        pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$"
        title="Please enter valid 12-hour time in HH:MM format (e.g. 10:30 or 02:45)"
        style={{ width: '60%', minWidth: 0, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}
        required
      />
      <select 
        value={ampm} 
        onChange={(e) => { setAmpm(e.target.value); handleUpdate(time, e.target.value); }}
        style={{ width: '40%', minWidth: 0, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}
        required
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    studentClass: '',
    day: '',
    startTime: '',
    endTime: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses/faculty`);
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.year || !formData.studentClass || !formData.day || !formData.startTime || !formData.endTime) {
      toast.error('Please completely fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/courses`, formData);
      if (response.data.success) {
        toast.success('Course assigned to mapping successfully!');
        setFormData({ title: '', year: '', studentClass: '', day: '', startTime: '', endTime: '' });
        fetchCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will immediately remove it from all matching student profiles and the attendance dropdown.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API_URL}/api/courses/${courseId}`);
      if (response.data.success) {
        toast.success('Course deleted successfully');
        fetchCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Manage Courses</h2>
      
      <div style={{ marginBottom: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Create New Course</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Course Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. MDP"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Target Year</label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}
              required
            >
              <option value="" disabled>Select Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Target Class</label>
            <select
              name="studentClass"
              value={formData.studentClass}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}
              required
            >
              <option value="" disabled>Select Class</option>
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Select Day</label>
            <select
              name="day"
              value={formData.day}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', background: 'white' }}
              required
            >
              <option value="" disabled>Select Day</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Start Time</label>
            <CustomTimePicker
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>End Time</label>
            <CustomTimePicker
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: '500', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Your Created Courses</h3>
        {loading ? (
          <p>Loading your courses...</p>
        ) : courses.length === 0 ? (
          <p style={{ color: '#6b7280' }}>You have not created any courses yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Course Title</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Target Class / Year</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Schedule</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Class Time</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{course.title}</td>
                  <td style={{ padding: '0.75rem' }}>{course.studentClass} ({course.year} Year)</td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                    {course.day}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#4b5563' }}>
                    {formatTime(course.startTime)} - {formatTime(course.endTime)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(course._id)}
                      style={{ padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Delete Course"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;
