import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RiCheckboxCircleLine } from 'react-icons/ri';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Password changed successfully.');
      setNewPassword('');
    }
  };

  return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Settings</h1>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid var(--border)',
          maxWidth: 400,
        }}
      >
        <h3
          style={{
            color: '#F5C842',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Change Admin Password
        </h3>
        {message && (
          <div
            style={{
              backgroundColor: message.includes('Error')
                ? 'rgba(239,68,68,0.08)'
                : 'rgba(48,209,88,0.08)',
              border: `1px solid ${
                message.includes('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(48,209,88,0.3)'
              }`,
              borderRadius: 10,
              padding: 12,
              color: message.includes('Error') ? '#EF4444' : '#30D158',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {!message.includes('Error') && <RiCheckboxCircleLine size={18} />}
            {message}
          </div>
        )}
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              style={inputStyle}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#F5C842',
              color: '#1B2F6B',
              border: 'none',
              borderRadius: 10,
              padding: '11px 20px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  marginBottom: 8,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
