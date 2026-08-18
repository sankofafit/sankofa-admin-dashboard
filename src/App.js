import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RiCloseCircleLine } from 'react-icons/ri';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GymsPage from './pages/GymsPage';
import TrainersPage from './pages/TrainersPage';
import UsersPage from './pages/UsersPage';
import BookingsPage from './pages/BookingsPage';
import PayoutsPage from './pages/PayoutsPage';
import EarningsPage from './pages/EarningsPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = (session) => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    const email = session.user?.email;
    const isSuperAdmin = session.user?.user_metadata?.is_admin === true;

    const ADMIN_EMAILS = [
      'samamponsah775@gmail.com',
      // Add more admin emails here if needed
    ];

    setIsAdmin(
      isSuperAdmin ||
        ADMIN_EMAILS.includes(email) ||
        email?.endsWith('@sankofafit.com')
    );
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      checkAdmin(initialSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      checkAdmin(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080C1C',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#F5C842',
            letterSpacing: 3,
          }}
        >
          SANKOFA FIT
        </div>
        <div style={{ color: '#6B7B99', fontSize: 13 }}>Admin Dashboard</div>
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(245,200,66,0.2)',
            borderTop: '3px solid #F5C842',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!session) return <LoginPage />;

  if (!isAdmin) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080C1C',
          flexDirection: 'column',
          gap: 16,
          padding: 24,
        }}
      >
        <RiCloseCircleLine size={48} color="#EF4444" />
        <h2 style={{ color: 'white', textAlign: 'center' }}>Access Denied</h2>
        <p
          style={{
            color: '#6B7B99',
            textAlign: 'center',
            maxWidth: 300,
          }}
        >
          This dashboard is only accessible to Sankofa Fit administrators.
        </p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          style={{
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Layout session={session}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/gyms" element={<GymsPage />} />
          <Route path="/trainers" element={<TrainersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/payouts" element={<PayoutsPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
