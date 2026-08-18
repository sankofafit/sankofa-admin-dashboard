import React from 'react';
import {
  RiMenuLine,
  RiLogoutBoxLine,
  RiShieldCheckLine,
  RiSunLine,
  RiMoonLine,
} from 'react-icons/ri';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../hooks/useIsMobile';
import useTheme from '../hooks/useTheme';

export default function Header({ session, onMenuToggle }) {
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    if (window.confirm('Sign out of Admin Dashboard?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0D1B45',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '0 12px' : '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: 8,
      }}
    >
      <button
        type="button"
        onClick={onMenuToggle}
        style={{
          background: 'none',
          border: 'none',
          color: '#6B7B99',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <RiMenuLine size={22} />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 12,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: isMobile ? '5px 8px' : '5px 12px',
            color: '#EF4444',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <RiShieldCheckLine size={14} />
          {!isMobile && 'ADMIN'}
        </div>

        <div
          style={{
            color: '#6B7B99',
            fontSize: 12,
            display: isMobile ? 'none' : 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 220,
          }}
        >
          {session?.user?.email}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme === 'dark' ? 'rgba(245,200,66,0.12)' : '#1B2F6B',
            border: `1.5px solid ${theme === 'dark' ? 'rgba(245,200,66,0.4)' : '#1B2F6B'}`,
            borderRadius: 50,
            padding: '8px 16px',
            cursor: 'pointer',
            color: theme === 'dark' ? '#F5C842' : 'white',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 0.3,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {theme === 'dark' ? (
            <>
              <RiSunLine size={16} />
              Light Mode
            </>
          ) : (
            <>
              <RiMoonLine size={16} />
              Dark Mode
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: isMobile ? '7px 10px' : '7px 14px',
            color: '#EF4444',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <RiLogoutBoxLine size={16} />
          {!isMobile && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
