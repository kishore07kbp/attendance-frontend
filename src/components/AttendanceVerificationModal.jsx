import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const DEFAULT_CLASSROOMS = ['Main Hall', 'Lab 101', 'Room 201', 'Room 202', 'Lecture Hall A'];

const AttendanceVerificationModal = ({ isOpen, onClose, onNext }) => {
  const [classrooms, setClassrooms] = useState(DEFAULT_CLASSROOMS);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchClassrooms = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/courses/student`);
        if (res.data?.success && res.data?.courses?.length) {
          const now = new Date();
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDayStr = days[now.getDay()];
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTotalMinutes = currentHour * 60 + currentMinute;

          const parseTimeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const str = timeStr.trim();
            if (str.includes('AM') || str.includes('PM')) {
              // Capture explicit HH:MM formatted arrays with possible mixed spacing
              const matches = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
              if (!matches) return 0;
              let hours = parseInt(matches[1], 10);
              const minutes = parseInt(matches[2], 10);
              const modifier = matches[3].toUpperCase();

              if (hours === 12) {
                hours = modifier === 'AM' ? 0 : 12;
              } else if (modifier === 'PM') {
                hours += 12;
              }
              return (hours * 60) + minutes;
            } else {
              const [h, m] = str.split(':').map(Number);
              return (h || 0) * 60 + (m || 0);
            }
          };

          const coursesWithStatus = res.data.courses.map(c => {
            if (!c.day || !c.startTime || !c.endTime) return { ...c, isActive: true };
            
            // Validate Day
            if (c.day.toLowerCase() !== currentDayStr.toLowerCase()) return { ...c, isActive: false };
            
            const startTotal = parseTimeToMinutes(c.startTime);
            const endTotal = parseTimeToMinutes(c.endTime);
            
            // Enforce bounds inclusively. Ensure endTotal is accurate or adjust if wraps overnight (edge case)
            let finalEndTotal = endTotal;
            if (endTotal < startTotal) {
                finalEndTotal += 24 * 60; // Next day
            }
            
            const isActive = currentTotalMinutes >= startTotal && currentTotalMinutes <= finalEndTotal;
            return { ...c, isActive };
          });

          setClassrooms(coursesWithStatus);
          
          const activeCourse = coursesWithStatus.find(c => c.isActive);
          if (activeCourse) {
            setSelectedClass(activeCourse.title || activeCourse);
          } else {
            setSelectedClass('');
          }
        } else {
          // fallback if no courses assigned
          const fallbackRes = await axios.get(`${API_URL}/api/classrooms`);
          if (fallbackRes.data?.classrooms) {
            const defaultRooms = fallbackRes.data.classrooms.map(title => ({ title, isActive: true }));
            setClassrooms(defaultRooms);
            setSelectedClass(defaultRooms[0]?.title || '');
          }
        }
      } catch {
        // keep default list if backend unavailable
      }
    };
    fetchClassrooms();
  }, [isOpen]);

  const handleNext = () => {
    if (!selectedClass) {
      alert("Please select a currently active course from the dropdown.");
      return;
    }

    const selectedCourseObj = classrooms.find(c => (c.title || c) === selectedClass);
    if (selectedCourseObj && selectedCourseObj.isActive === false) {
      alert("The selected course is not active at the moment.");
      return;
    }

    if (onNext) {
      onNext(selectedClass);
    }
    setSelectedClass('');
  };

  const handleClose = () => {
    setSelectedClass('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="attendance-modal-overlay" onClick={handleClose}>
      <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="attendance-modal-header">
          <div>
            <h2 className="attendance-modal-title">Attendance Verification</h2>
            <p className="attendance-modal-subtitle">Step 1 of 3: Select Course</p>
          </div>
          <button
            type="button"
            className="attendance-modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="attendance-modal-body">
          <label htmlFor="attendance-classroom" className="attendance-modal-label">
            Select Course
          </label>
          <div className="attendance-modal-select-wrap">
            <select
              id="attendance-classroom"
              className="attendance-modal-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">{classrooms.length > 0 ? "Choose current course..." : "No active course now"}</option>
              {classrooms.map((c) => {
                const formatTime = (timeStr) => {
                  if (!timeStr) return '';
                  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
                  const [hourString, minute] = timeStr.split(':');
                  const hour = parseInt(hourString, 10);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const hour12 = hour % 12 || 12;
                  const hourFormatted = String(hour12).padStart(2, '0');
                  const minuteFormatted = minute.length === 1 ? `0${minute}` : minute;
                  return `${hourFormatted}:${minuteFormatted} ${ampm}`;
                };

                const isActive = c.isActive !== false;
                const displayStr = c.title && c.day && c.startTime && c.endTime 
                  ? `${c.title} (${c.day}, ${formatTime(c.startTime)} - ${formatTime(c.endTime)}) ${!isActive ? '[Not Active Right Now]' : ''}`
                  : (c.title || c);

                return (
                  <option 
                    key={c._id || c.title || c} 
                    value={c.title || c}
                    disabled={!isActive}
                  >
                    {displayStr}
                  </option>
                );
              })}
            </select>
            <svg className="attendance-modal-select-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <button
            type="button"
            className="attendance-modal-next"
            onClick={handleNext}
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceVerificationModal;
