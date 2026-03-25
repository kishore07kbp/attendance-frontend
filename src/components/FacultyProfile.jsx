import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';
import { useAuth } from '../context/AuthContext';

const FacultyProfile = () => {
  const { user, fetchUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', facultyId: '', department: '', designation: '', classAdvisorClass: '', classAdvisorYear: '' });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/api/faculty/profile`),
        axios.get(`${API_URL}/api/courses/faculty`)
      ]);

      if (profileRes.data.success) {
        setProfileData(profileRes.data.faculty);
      }
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch faculty profile data', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditData({
      name: user?.name || profileData?.name || '',
      email: user?.email || profileData?.email || '',
      facultyId: profileData?.facultyId || '',
      department: profileData?.department || '',
      designation: profileData?.designation || '',
      classAdvisorClass: profileData?.classAdvisorClass || 'None',
      classAdvisorYear: profileData?.classAdvisorYear || 'None',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({ name: '', email: '', facultyId: '', department: '', designation: '', classAdvisorClass: '', classAdvisorYear: '' });
  };

  const saveProfile = async () => {
    if (!editData.name.trim() || !editData.email.trim() || !editData.facultyId.trim()) {
      return toast.error("Name, Email, and Faculty ID fields are required");
    }

    setEditLoading(true);
    try {
      const response = await axios.put(`${API_URL}/api/faculty/profile`, editData);
      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Refresh contexts
        if (fetchUser) await fetchUser();
        await fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will immediately remove it from all matching student profiles and the attendance dropdown.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API_URL}/api/courses/${courseId}`);
      if (response.data.success) {
        toast.success('Course deleted successfully');
        setCourses(courses.filter(c => c._id !== courseId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return <div className="card"><p>Loading profile...</p></div>;
  }

  const infoRows = [
    { label: 'FULL NAME', key: 'name', value: user?.name || profileData?.name || '—' },
    { label: 'FACULTY ID', key: 'facultyId', value: profileData?.facultyId || '—' },
    { label: 'EMAIL', key: 'email', value: user?.email || profileData?.email || '—' },
    { label: 'DEPARTMENT', key: 'department', value: profileData?.department || '—', readOnly: true },
    { label: 'DESIGNATION', key: 'designation', value: profileData?.designation || '—', readOnly: true },
    { label: 'ACCOUNT ROLE', key: 'role', value: profileData?.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : 'Faculty', readOnly: true },
    { label: 'CLASS ADVISOR', key: 'classAdvisorClass', value: profileData?.classAdvisorClass || 'None' },
    { label: 'CLASS ADVISOR (YEAR)', key: 'classAdvisorYear', value: profileData?.classAdvisorYear || 'None' }
  ];

  const STUDENT_DEPARTMENTS = ['CCE', 'IT', 'CSBS', 'MECH', 'EEE', 'AIML', 'CSE-A', 'CSE-B', 'CSE-C', 'CSE-CYS', 'ECE-A', 'ECE-B', 'ECE-C', 'AIDS-A', 'AIDS-B', 'AIDS-C', 'AIDS-D'];
  const YEARS = ['I', 'II', 'III', 'IV'];

  return (
    <div className="profile-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="profile-page-title" style={{ marginBottom: 0 }}>Faculty Profile Dashboard</h1>
        {!isEditing ? (
          <button 
            style={{ padding: '0.625rem 1rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0.375rem', fontWeight: '500', cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={startEditing}
            onMouseOver={(e) => e.target.style.background = '#d1d5db'}
            onMouseOut={(e) => e.target.style.background = '#e5e7eb'}
          >
            Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
                onClick={saveProfile} 
                disabled={editLoading} 
                className="btn-primary" 
                style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: '0.375rem', fontWeight: '500', cursor: 'pointer' }}
            >
                {editLoading ? 'Saving...' : 'Save'}
            </button>
            <button 
                onClick={cancelEditing} 
                disabled={editLoading} 
                style={{ padding: '0.625rem 1rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.375rem', fontWeight: '500', cursor: 'pointer' }}
            >
                Cancel
            </button>
          </div>
        )}
      </div>

      <div className="profile-cards">
        <div className="profile-card profile-card-personal" style={{ width: '100%', marginBottom: '2rem' }}>
          <h2 className="profile-card-title">Personal Information</h2>
          <dl className="profile-info-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {infoRows.map(({ label, key, value, readOnly }) => (
              <div key={label} className="profile-info-row" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                <dt className="profile-info-label" style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', marginBottom: '0.375rem', letterSpacing: '0.05em' }}>{label}</dt>
                <dd className="profile-info-value" style={{ fontSize: '1.125rem', color: '#111827', fontWeight: '500', margin: 0 }}>
                    {isEditing && !readOnly ? (
                      key === 'classAdvisorClass' ? (
                        <select
                          value={editData[key]}
                          onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                          style={{ padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', width: '100%', maxWidth: '300px' }}
                        >
                          <option value="None">None</option>
                          {STUDENT_DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      ) : key === 'classAdvisorYear' ? (
                        <select
                          value={editData[key]}
                          onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                          style={{ padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', width: '100%', maxWidth: '300px' }}
                        >
                          <option value="None">None</option>
                          {YEARS.map(y => (
                            <option key={y} value={y}>{y} Year</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={key === 'email' ? 'email' : 'text'}
                          value={editData[key]}
                          onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                          style={{ padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', width: '100%', maxWidth: '300px' }}
                        />
                      )
                    ) : (
                      value
                    )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="card-title">Your Created Courses</h2>
        {courses.length === 0 ? (
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>You have not created any courses yet. Go to the Courses tab to add one.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Title</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Class / Year</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created On</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#475569', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: '500', color: '#0f172a' }}>{course.title}</td>
                    <td style={{ padding: '1rem 0.75rem', color: '#334155' }}>
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
                        {course.studentClass} ({course.year} Year)
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#64748b' }}>
                      {new Date(course.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteCourse(course._id)}
                        style={{ padding: '0.5rem 0.875rem', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyProfile;
