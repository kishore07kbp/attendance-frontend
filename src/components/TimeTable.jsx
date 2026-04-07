import React from 'react';
import './TimeTable.css';

const TIME_SLOTS = [
  { id: '1st', label: '1st', time: '8:40 AM - 9:35 AM' },
  { id: '2nd', label: '2nd', time: '9:35 AM - 10:25 AM' },
  { id: '3rd', label: '3rd', time: '10:25 AM - 11:15 AM' },
  { id: 'TEA_BREAK', label: 'TEA BREAK', time: '11:15 AM - 11:35 AM', isBreak: true },
  { id: '4th', label: '4th', time: '11:35 AM - 12:25 PM' },
  { id: '5th', label: '5th', time: '12:25 PM - 1:15 PM' },
  { id: 'LUNCH_BREAK', label: 'LUNCH BREAK', time: '1:15 PM - 2:00 PM', isBreak: true },
  { id: 'ACTIVITY_HOUR', label: 'ACTIVITY HOUR', time: '2:00 PM - 2:30 PM', isBreak: true },
  { id: '6th', label: '6th', time: '2:30 PM - 3:20 PM' },
  { id: '7th', label: '7th', time: '3:20 PM - 4:10 PM' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimeTable = ({ courses, isAdmin = false, onDelete }) => {
  // Organize courses by day and period for quick lookup
  const schedule = {};
  DAYS.forEach(day => {
    schedule[day] = {};
  });

  courses.forEach(course => {
    if (course.day && course.periods) {
      course.periods.forEach(period => {
        // Normalize P1 -> 1st, etc. for backward compatibility
        let normalizedPeriod = period;
        if (period.startsWith('P') && !isNaN(period.slice(1))) {
          const num = period.slice(1);
          const suffixes = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th', '6': '6th', '7': '7th' };
          normalizedPeriod = suffixes[num] || period;
        }

        if (!schedule[course.day][normalizedPeriod]) {
          schedule[course.day][normalizedPeriod] = [];
        }
        schedule[course.day][normalizedPeriod].push(course);
      });
    }
  });

  return (
    <div className="timetable-container">
      <div className="timetable-wrapper">
        <table className="timetable">
          <thead>
            <tr>
              <th className="day-column">DAY</th>
              {TIME_SLOTS.map(slot => (
                <th key={slot.id} className={slot.isBreak ? 'break-header' : 'period-header'}>
                  <div className="period-id">{slot.label}</div>
                  <div className="period-time">{slot.time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="day-name">{day}</td>
                {TIME_SLOTS.map(slot => {
                  if (slot.isBreak) {
                    // Check if it's the first day to show the vertical break label
                    // Actually per the image, it's a vertical text area
                    if (day === 'Monday') {
                      return (
                        <td key={slot.id} rowSpan={DAYS.length} className="break-cell">
                          <div className="vertical-text">{slot.label}</div>
                        </td>
                      );
                    }
                    return null; // Rowspan handles the others
                  }

                  const periodCourses = schedule[day][slot.id] || [];
                  
                  return (
                    <td key={slot.id} className="period-cell">
                      {periodCourses.map((course, idx) => (
                        <div key={`${course._id}-${idx}`} className="course-entry">
                          <div className="course-title-year">
                            [{course.title} - {course.year}]
                          </div>
                          {isAdmin && (
                            <button 
                              className="delete-course-btn" 
                              onClick={() => onDelete(course._id)}
                              title="Delete Course"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeTable;
