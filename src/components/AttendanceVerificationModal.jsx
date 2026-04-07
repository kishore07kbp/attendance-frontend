import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

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

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = timeStr.trim();
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
};

const AttendanceVerificationModal = ({ isOpen, onClose, onNext }) => {
  const [scheduleItems, setScheduleItems] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [currentDay, setCurrentDay] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/courses/student`);
        if (res.data?.success && res.data?.courses) {
          const now = new Date();
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayStr = days[now.getDay()];
          setCurrentDay(todayStr);

          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTotalMinutes = currentHour * 60 + currentMinute;

          const coursesForToday = res.data.courses.filter(c => c.day && c.day.toLowerCase() === todayStr.toLowerCase());

          const builtSchedule = [];
          
          TIME_SLOTS.forEach(slot => {
            if (slot.isBreak) return;

            const timeParts = slot.time.split('-');
            const startTotal = parseTimeToMinutes(timeParts[0]);
            const endTotal = parseTimeToMinutes(timeParts[1]);

            // To support boundaries, we enforce strictly between start and end.
            const isActiveTime = currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal;

            const mappedCourse = coursesForToday.find(c => c.periods && c.periods.includes(slot.id));
            if (!mappedCourse) return; // Skip if no course corresponds to this period today
            
            const title = mappedCourse.title;
            const isActive = isActiveTime;
            
            builtSchedule.push({
              id: slot.id,
              timeText: slot.time,
              title: title,
              isActive: isActive,
              hasCourse: true,
              displayStr: `${slot.id} - ${title} (${slot.time})`
            });
          });

          setScheduleItems(builtSchedule);
          
          const activeItem = builtSchedule.find(c => c.isActive);
          if (activeItem) {
            setSelectedSlotId(activeItem.id);
          } else {
            setSelectedSlotId('');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchedule();
  }, [isOpen]);

  const handleNext = () => {
    if (!selectedSlotId) {
      alert("Please select a currently active course from the dropdown.");
      return;
    }

    const selectedItem = scheduleItems.find(c => c.id === selectedSlotId);
    if (!selectedItem || !selectedItem.isActive) {
      alert("The selected course is not active at the moment.");
      return;
    }

    if (onNext) {
      onNext(selectedItem.title);
    }
    setSelectedSlotId('');
  };

  const handleClose = () => {
    setSelectedSlotId('');
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
            Select Course ({currentDay})
          </label>
          <div className="attendance-modal-select-wrap">
            <select
              id="attendance-classroom"
              className="attendance-modal-select"
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
            >
              <option value="">{scheduleItems.length > 0 ? "Choose current course..." : "No active course now"}</option>
              {scheduleItems.map((c) => {
                const isSelectable = c.isActive;
                return (
                  <option 
                    key={c.id} 
                    value={c.id}
                    disabled={!isSelectable}
                  >
                    {c.displayStr} {!isSelectable ? '[Not Active Right Now]' : ''}
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
