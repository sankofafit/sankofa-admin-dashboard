import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine,
  RiStoreLine,
  RiGroupLine,
  RiCalendarEventLine,
  RiMoneyDollarCircleLine,
  RiBarChartBoxLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiCloseLine,
  RiFlagLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

const NAV_ITEMS = [
  { path: '/', Icon: RiDashboardLine, label: 'Dashboard' },
  { path: '/gyms', Icon: RiStoreLine, label: 'Gyms' },
  { path: '/trainers', Icon: MdFitnessCenter, label: 'Trainers' },
  { path: '/users', Icon: RiGroupLine, label: 'Users' },
  { path: '/bookings', Icon: RiCalendarEventLine, label: 'Bookings' },
  { path: '/reports', Icon: RiFlagLine, label: 'Reports' },
  { path: '/payouts', Icon: RiMoneyDollarCircleLine, label: 'Payouts' },
  { path: '/earnings', Icon: RiBarChartBoxLine, label: 'Earnings' },
  { path: '/settings', Icon: RiSettings3Line, label: 'Settings' },
];

export default function Sidebar({ isOpen, isMobile, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        backgroundColor: '#1B2F6B',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
        boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <img
            src="/logo.png"
            alt="Sankofa Fit"
            style={{
              height: 48,
              width: 'auto',
              maxWidth: 160,
              objectFit: 'contain',
              display: 'block',
              marginBottom: 4,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiShieldCheckLine size={10} color="#EF4444" />
            <span
              style={{
                fontSize: 9,
                color: '#EF4444',
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              ADMIN PORTAL
            </span>
          </div>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7B99',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RiCloseLine size={20} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={() => isMobile && onClose()}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              color: isActive ? '#F5C842' : '#6B7B99',
              backgroundColor: isActive ? 'rgba(245,200,66,0.08)' : 'transparent',
              borderRight: isActive ? '3px solid #F5C842' : '3px solid transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 700 : 400,
              transition: 'all 0.15s',
            })}
          >
            <item.Icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
        }}
      >
        Sankofa Fit Admin v1.0
      </div>
    </div>
  );
}
