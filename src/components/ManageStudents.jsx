import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';

const ManageStudents = () => {
  const [studentsByYear, setStudentsByYear] = useState({ 'I': [], 'II': [], 'III': [], 'IV': [] });
  const [activeYear, setActiveYear] = useState('I');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    department: '',
    year: '',
    studentClass: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/faculty/students`, {
        params: { search }
      });
      setStudentsByYear(response.data.studentsByYear || { 'I': [], 'II': [], 'III': [], 'IV': [] });
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`${API_URL}/api/faculty/students/${editingStudent._id}`, formData);
        toast.success('Student updated successfully');
      } else {
        await axios.post(`${API_URL}/api/faculty/students`, formData);
        toast.success('Student created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/faculty/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      year: student.year || '',
      studentClass: student.studentClass || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      rollNumber: '',
      department: '',
      year: '',
      studentClass: ''
    });
    setEditingStudent(null);
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Manage Students</h2>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
            Add Student
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by roll number or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {['I', 'II', 'III', 'IV'].map((year) => (
            <button
              key={year}
              onClick={() => setActiveYear(year)}
              style={{
                flex: 1,
                padding: '0.5rem 1.25rem',
                border: 'none',
                background: activeYear === year ? '#2563eb' : 'transparent',
                color: activeYear === year ? 'white' : '#4b5563',
                borderRadius: '0.375rem',
                fontWeight: activeYear === year ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
              onMouseOver={(e) => {
                if (activeYear !== year) e.target.style.background = '#f3f4f6';
              }}
              onMouseOut={(e) => {
                if (activeYear !== year) e.target.style.background = 'transparent';
              }}
            >
              {year} Year <span style={{ marginLeft: '0.25rem', padding: '0.125rem 0.375rem', background: activeYear === year ? 'rgba(255,255,255,0.2)' : '#e5e7eb', borderRadius: '1rem', fontSize: '0.75rem' }}>{studentsByYear[year]?.length || 0}</span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', display: 'none' }}>
            {activeYear} Year Students
          </h3>
          
          {(!studentsByYear[activeYear] || studentsByYear[activeYear].length === 0) ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', background: '#f9fafb', borderRadius: '0.5rem', border: '1px dashed #d1d5db' }}>
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>No students found in {activeYear} Year.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>Name</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>Roll No.</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>Email</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>Class</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb' }}>Face Reg.</th>
                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsByYear[activeYear].map((student) => (
                    <tr key={student._id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.15s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{student.userId?.name || 'N/A'}</td>
                      <td style={{ padding: '0.75rem' }}>{student.rollNumber ? student.rollNumber.toUpperCase() : ''}</td>
                      <td style={{ padding: '0.75rem', color: '#6b7280' }}>{student.userId?.email || 'N/A'}</td>
                      <td style={{ padding: '0.75rem' }}><span style={{ padding: '0.25rem 0.5rem', background: '#dbeafe', color: '#1e40af', borderRadius: '0.25rem', fontSize: '0.875rem' }}>{student.studentClass || student.department || 'N/A'}</span></td>
                      <td style={{ padding: '0.75rem' }}>
                        {student.faceDescriptor && student.faceDescriptor.length > 0 ? (
                          <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ Done</span>
                        ) : (
                          <span style={{ color: '#dc2626' }}>✗ Missing</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button onClick={() => openEditModal(student)} className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(student._id)} className="btn btn-danger" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '100vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingStudent ? 'Edit Student' : 'Add Student'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              {!editingStudent && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div className="form-group">
                <label>Class</label>
                <input
                  type="text"
                  value={formData.studentClass || formData.department}
                  onChange={(e) => setFormData({ ...formData, studentClass: e.target.value, department: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div className="form-group">
                <label>Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                >
                  <option value="" disabled>Select Year</option>
                  {['I', 'II', 'III', 'IV'].map(y => (
                    <option key={y} value={y}>{y} Year</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
