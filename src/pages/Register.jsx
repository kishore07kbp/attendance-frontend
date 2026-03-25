import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const STUDENT_DEPARTMENTS = ['CCE', 'IT', 'CSBS', 'MECH', 'EEE', 'AIML', 'CSE-A', 'CSE-B', 'CSE-C', 'CSE-CYS', 'ECE-A', 'ECE-B', 'ECE-C', 'AIDS-A', 'AIDS-B', 'AIDS-C', 'AIDS-D'];
const FACULTY_DEPARTMENTS = ['CCE', 'IT', 'CSBS', 'MECH', 'EEE', 'AIML', 'CSE', 'ECE', 'AIDS'];
const FACULTY_DESIGNATIONS = ['Assistant Professor', 'Associate Professor', 'Professor', 'Lab Assistant', 'HOD'];
const YEARS = ['I', 'II', 'III', 'IV'];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    rollNumber: '',
    department: '',
    studentClass: '',
    year: '',
    designation: '',
    classAdvisorClass: 'None',
    classAdvisorYear: 'None'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.name?.trim() || !formData.email?.trim() || (formData.role !== 'student' && !formData.department)) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.role === 'student' && (!formData.rollNumber?.trim() || !formData.studentClass || !formData.year)) {
      toast.error('Roll Number, Class, and Year are required for students');
      return;
    }

    if (formData.role !== 'student' && (!formData.rollNumber?.trim() || !formData.designation)) {
      toast.error('Faculty ID and Designation are required for faculty');
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email,
      password: formData.password,
      role: formData.role,
      department: formData.role !== 'student' ? formData.department : undefined,
      studentClass: formData.role === 'student' ? formData.studentClass : undefined,
      rollNumber: formData.role === 'student' ? formData.rollNumber.trim() : undefined,
      facultyId: formData.role !== 'student' ? formData.rollNumber.trim() : undefined,
      year: formData.role === 'student' ? formData.year : undefined,
      designation: formData.role !== 'student' ? formData.designation : undefined,
      classAdvisorClass: formData.role !== 'student' ? formData.classAdvisorClass : undefined,
      classAdvisorYear: formData.role !== 'student' ? formData.classAdvisorYear : undefined
    };
    
    const result = await register(payload);

    if (result.success) {
      toast.success('Registration successful!');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const userRole = result.user?.role || user.role;
      if (userRole === 'student') {
        navigate('/student');
      } else if (userRole === 'faculty' || userRole === 'admin') {
        navigate('/faculty');
      } else {
        navigate('/');
      }
    } else {
      toast.error(result.message || 'Registration failed');
    }

    setLoading(false);
  };

  return (
    <div className="auth-split-container">
      {/* Left Side - Form */}
      <div className="auth-form-section">
        <div className="auth-form-content">
          <h1 className="auth-brand-title">SmartAttend</h1>
          <p className="auth-brand-subtitle">Authentication Portal</p>

          <div className="auth-tabs">
            <Link to="/login" className="auth-tab">Login</Link>
            <Link to="/register" className="auth-tab active">Register</Link>
          </div>

          <div className="auth-welcome">
            <h2 className="welcome-title">Create an account</h2>
            <p className="welcome-subtitle">Enter your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C11.3807 10 12.5 8.88071 12.5 7.5C12.5 6.11929 11.3807 5 10 5C8.61929 5 7.5 6.11929 7.5 7.5C7.5 8.88071 8.61929 10 10 10Z" stroke="#9ca3af" strokeWidth="1.5"/>
                  <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#9ca3af" strokeWidth="1.5"/>
                  <path d="M10 10V15.8333" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 6.66667L10 11.6667L17.5 6.66667M3.33333 15H16.6667C17.5871 15 18.3333 14.2538 18.3333 13.3333V6.66667C18.3333 5.74619 17.5871 5 16.6667 5H3.33333C2.41286 5 1.66667 5.74619 1.66667 6.66667V13.3333C1.66667 14.2538 2.41286 15 3.33333 15Z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="rollNumber">
                {formData.role === 'student' ? 'Roll Number' : 'Faculty ID'}
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H16V16H4V4Z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.66667 8.33333H13.3333" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6.66667 11.6667H13.3333" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6.66667 15H10" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  id="rollNumber"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                  placeholder={`Enter ${formData.role === 'student' ? 'roll number' : 'faculty ID'}`}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={formData.role === 'student' ? "studentClass" : "department"}>
                {formData.role === 'student' ? 'Class' : 'Department'}
              </label>
              <select
                id={formData.role === 'student' ? "studentClass" : "department"}
                name={formData.role === 'student' ? "studentClass" : "department"}
                value={formData.role === 'student' ? formData.studentClass : formData.department}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="" disabled>
                  Select {formData.role === 'student' ? 'Class' : 'Department'}
                </option>
                {formData.role === 'student' 
                  ? STUDENT_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))
                  : FACULTY_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))
                }
              </select>
            </div>

            {formData.role === 'student' && (
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="" disabled>Select Year</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y} Year</option>
                  ))}
                </select>
              </div>
            )}

            {formData.role !== 'student' && (
              <div className="form-group">
                <label htmlFor="designation">Designation</label>
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="" disabled>Select Designation</option>
                  {FACULTY_DESIGNATIONS.map(desig => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.role !== 'student' && (
              <>
                <div className="form-group">
                  <label htmlFor="classAdvisorClass">Class Advisor</label>
                  <select
                    id="classAdvisorClass"
                    name="classAdvisorClass"
                    value={formData.classAdvisorClass}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="None">None</option>
                    {STUDENT_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="classAdvisorYear">Class Advisor (Year)</label>
                  <select
                    id="classAdvisorYear"
                    name="classAdvisorYear"
                    value={formData.classAdvisorYear}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="None">None</option>
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y} Year</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.83333 9.16667V5.83333C5.83333 4.45262 6.95262 3.33333 8.33333 3.33333H11.6667C13.0474 3.33333 14.1667 4.45262 14.1667 5.83333V9.16667" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter password"
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="auth-visual-section">
        <div className="auth-visual-content">
          <div className="shield-icon-large">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 10L15 25V60C15 85 35 107.5 60 115C85 107.5 105 85 105 60V25L60 10Z" fill="white" fillOpacity="0.2"/>
              <path d="M60 10L15 25V60C15 85 35 107.5 60 115C85 107.5 105 85 105 60V25L60 10Z" stroke="white" strokeWidth="3"/>
              <path d="M45 60L52.5 67.5L75 45" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="visual-title">Secure & Verified Attendance</h2>
          <p className="visual-description">
            Using advanced biometrics and proximity sensors to ensure academic integrity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
