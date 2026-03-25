import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    bleDeviceId: '',
    deviceName: '',
    classroom: '',
    location: ''
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/devices`);
      setDevices(response.data.devices);
    } catch (error) {
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/devices`, formData);
      toast.success('Device registered successfully');
      setShowModal(false);
      setFormData({ bleDeviceId: '', deviceName: '', classroom: '', location: '' });
      fetchDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register device');
    }
  };

  const handleScan = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/devices/scan`, { duration: 10000 });
      toast.success(`Found ${response.data.count} BLE device(s)`);
      console.log('Detected devices:', response.data.devices);
    } catch (error) {
      toast.error('Failed to scan for devices. Make sure BLE adapter is enabled.');
    }
  };

  if (loading) {
    return <div className="loading">Loading devices...</div>;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>BLE Device Management</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleScan} className="btn btn-secondary">
              Scan for Devices
            </button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              Add Device
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Device Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>BLE ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Classroom</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Location</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{device.deviceName}</td>
                  <td style={{ padding: '0.75rem' }}>{device.bleDeviceId}</td>
                  <td style={{ padding: '0.75rem' }}>{device.classroom}</td>
                  <td style={{ padding: '0.75rem' }}>{device.location || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      background: device.isActive ? '#d1fae5' : '#fee2e2',
                      color: device.isActive ? '#065f46' : '#991b1b'
                    }}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Register BLE Device</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>BLE Device ID</label>
                <input
                  type="text"
                  value={formData.bleDeviceId}
                  onChange={(e) => setFormData({ ...formData, bleDeviceId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div className="form-group">
                <label>Device Name</label>
                <input
                  type="text"
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div className="form-group">
                <label>Classroom</label>
                <input
                  type="text"
                  value={formData.classroom}
                  onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Register</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
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

export default DeviceManagement;

