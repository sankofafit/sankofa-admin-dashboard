import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RiLockLine, RiSunLine, RiMoonLine } from 'react-icons/ri';
import useTheme from '../hooks/useTheme';

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(239,68,68,0.1) 0%, transparent 60%)',
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            backgroundColor:
              theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(27,47,107,0.08)',
            border: `1px solid ${
              theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(27,47,107,0.15)'
            }`,
            borderRadius: 50,
            padding: '8px 16px',
            cursor: 'pointer',
            color: theme === 'dark' ? '#F5C842' : '#1B2F6B',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {theme === 'dark' ? (
            <>
              <RiSunLine size={16} /> Light
            </>
          ) : (
            <>
              <RiMoonLine size={16} /> Dark
            </>
          )}
        </button>
      </div>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <img
            src="/logo.png"
            alt="Sankofa Fit"
            style={{
              height: 80,
              width: 'auto',
              maxWidth: 220,
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 24px',
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 24,
            padding: 40,
            width: '100%',
            maxWidth: 400,
            border: '1px solid var(--border)',
            boxShadow: '0 24px 64px var(--shadow)',
          }}
        >
          <h2
            style={{
              color: 'var(--text-primary)',
              fontSize: 20,
              fontWeight: 900,
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            Admin Sign In
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Restricted access — authorized personnel only
          </p>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#EF4444',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sankofafit.com"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? 'rgba(239,68,68,0.5)' : '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 15,
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <RiLockLine size={18} />
              {loading ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 12,
            marginTop: 20,
          }}
        >
          Unauthorized access is prohibited. All activity is monitored and logged.
        </p>
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
  padding: '12px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
