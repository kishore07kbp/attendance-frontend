import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import TimeTable from './TimeTable';

const StudentTimeTable = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/courses/student`);
        if (response.data.success) setCourses(response.data.courses);
      } catch (err) {
        console.error('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="card">
      <h2 className="card-title">My Time Table</h2>
      {loading ? (
        <p>Loading transition schedule...</p>
      ) : courses.length === 0 ? (
        <p style={{ color: '#6b7280', padding: '1rem' }}>No courses have been assigned to your Class and Year yet.</p>
      ) : (
        <TimeTable courses={courses} />
      )}
    </div>
  );
};

export default StudentTimeTable;
