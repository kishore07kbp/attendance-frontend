import React, { useState, useEffect } from 'react';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[time.getDay()];

  let hours = time.getHours();
  let minutes = time.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Formats 0 to 12
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  const displayTime = `${formattedHours}:${formattedMinutes} ${ampm}`;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: '#f3f4f6',
      padding: '0.4rem 0.85rem',
      borderRadius: '9999px',
      fontWeight: '600',
      color: '#1f2937',
      gap: '0.45rem',
      fontSize: '0.9rem',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#2563eb' }}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      {dayName}, {displayTime}
    </div>
  );
};

export default LiveClock;
