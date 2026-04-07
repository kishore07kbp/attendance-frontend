import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';
import TimeTable from './TimeTable';

const DEPARTMENTS = ['CCE', 'IT', 'CSBS', 'MECH', 'EEE', 'AIML', 'CSE-A', 'CSE-B', 'CSE-C', 'CSE-CYS', 'ECE-A', 'ECE-B', 'ECE-C', 'AIDS-A', 'AIDS-B', 'AIDS-C', 'AIDS-D'];
const YEARS = ['I', 'II', 'III', 'IV'];
const PERIODS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    studentClass: '',
    day: '',
    periods: []
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

  const handlePeriodChange = (periodId) => {
    const updatedPeriods = formData.periods.includes(periodId)
      ? formData.periods.filter(p => p !== periodId)
      : [...formData.periods, periodId];
    
    setFormData({
      ...formData,
      periods: updatedPeriods
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.year || !formData.studentClass || !formData.day || formData.periods.length === 0) {
      toast.error('Please fill all fields and select at least one period');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/courses`, formData);
      if (response.data.success) {
        toast.success('Course assigned to mapping successfully!');
        setFormData({ title: '', year: '', studentClass: '', day: '', periods: [] });
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
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Year</label>
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
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Class</label>
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
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: '0 0 auto', width: 'fit-content' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Select Periods</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', background: 'white', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', width: 'fit-content' }}>
                {PERIODS.map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={formData.periods.includes(p)}
                      onChange={() => handlePeriodChange(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ flex: '0 0 auto', width: 'fit-content', padding: '0.5rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: '500', cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Your Time table</h3>
        {loading ? (
          <p>Loading your courses...</p>
        ) : courses.length === 0 ? (
          <p style={{ color: '#6b7280' }}>You have not created any courses yet.</p>
        ) : (
          <TimeTable courses={courses} isAdmin={true} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
};

export default ManageCourses;

