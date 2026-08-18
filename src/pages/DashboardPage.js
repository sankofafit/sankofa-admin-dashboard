import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency, timeAgo } from '../utils/formatters';
import {
  RiStoreLine,
  RiGroupLine,
  RiCalendarEventLine,
  RiMoneyDollarCircleLine,
  RiBarChartBoxLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';
import { useIsMobile } from '../hooks/useIsMobile';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalGyms: 0,
    pendingGyms: 0,
    totalTrainers: 0,
    pendingTrainers: 0,
    totalUsers: 0,
    proUsers: 0,
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    platformEarnings: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingGyms, setPendingGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const loadDashboard = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [gymsRes, usersRes, bookingsRes, trainerBookingsRes, membershipRes] =
        await Promise.all([
          supabase.from('gyms').select('id, name, city, created_at, is_approved, is_active'),
          supabase.from('users').select('subscription_tier, created_at'),
          supabase.from('gym_bookings').select('*').order('created_at', { ascending: false }),
          supabase.from('trainer_bookings').select('*').order('created_at', { ascending: false }),
          supabase.from('gym_memberships').select('*'),
        ]);

      let trainers = [];
      let pendingTrainers = 0;
      try {
        const trainersRes = await supabase
          .from('trainers')
          .select('id, is_approved, is_active, name, email');

        trainers = trainersRes.data || [];
        pendingTrainers = trainers.filter((t) => !t.is_approved).length;

        console.log('All trainers:', trainers);
        console.log('Pending trainers:', pendingTrainers);
      } catch (e) {
        console.log('Trainers table error:', e);
      }

      const gyms = gymsRes.data || [];
      const users = usersRes.data || [];
      const bookings = bookingsRes.data || [];
      const trainerBookings = trainerBookingsRes.error ? [] : trainerBookingsRes.data || [];
      const memberships = membershipRes.data || [];

      if (bookingsRes.error) {
        console.log('Gym bookings load error:', bookingsRes.error.message);
      }
      if (trainerBookingsRes.error) {
        console.log('Trainer bookings load error:', trainerBookingsRes.error.message);
      }

      const allTransactions = [
        ...bookings.map((b) => ({
          amount: b.amount_ghs || 0,
          date: b.booking_date || b.created_at,
          commission: 0.15,
        })),
        ...trainerBookings.map((b) => ({
          amount: b.amount_ghs || 0,
          date: b.session_date || b.created_at,
          commission: 0.15,
        })),
        ...memberships.map((m) => ({
          amount: m.amount_ghs || 0,
          date: m.start_date || m.created_at,
          commission: 0.1,
        })),
      ];

      const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);
      const monthRevenue = allTransactions
        .filter((t) => new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + t.amount, 0);
      const platformEarnings = allTransactions.reduce(
        (sum, t) => sum + t.amount * t.commission,
        0
      );

      setStats({
        totalGyms: gyms.length,
        pendingGyms: gyms.filter((g) => !g.is_approved).length,
        totalTrainers: trainers.length,
        pendingTrainers,
        totalUsers: users.length,
        proUsers: users.filter(
          (u) => u.subscription_tier === 'pro' || u.subscription_tier === 'premium'
        ).length,
        totalBookings: bookings.length + trainerBookings.length,
        todayBookings: [
          ...bookings.filter(
            (b) => b.booking_date?.startsWith(today) || b.created_at?.startsWith(today)
          ),
          ...trainerBookings.filter((b) => b.created_at?.startsWith(today)),
        ].length,
        totalRevenue,
        monthRevenue,
        platformEarnings,
      });

      setPendingGyms(gyms.filter((g) => !g.is_approved).slice(0, 5));

      const activity = [
        ...bookings.slice(0, 5).map((b) => ({
          type: 'Gym Booking',
          desc: `${b.class_name || 'Drop-in'} at ${b.gym_name || 'Gym'}`,
          amount: b.amount_ghs,
          date: b.created_at,
          color: '#F5C842',
        })),
        ...trainerBookings.slice(0, 5).map((b) => ({
          type: 'Trainer Booking',
          desc: `${b.session_type || 'Session'} with ${b.trainer_name || 'Trainer'}`,
          amount: b.amount_ghs,
          date: b.created_at,
          color: '#8B5CF6',
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);

      setRecentActivity(activity);
    } catch (e) {
      console.log('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const gymBookingsSub = supabase
      .channel('gym_bookings_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gym_bookings' },
        (payload) => {
          console.log('New gym booking:', payload);
          loadDashboard();
        }
      )
      .subscribe();

    const gymsSub = supabase
      .channel('gyms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gyms' }, (payload) => {
        console.log('Gym changed:', payload);
        loadDashboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(gymBookingsSub);
      supabase.removeChannel(gymsSub);
    };
  }, [loadDashboard]);

  const statCards = [
    {
      label: 'Total Gyms',
      value: stats.totalGyms,
      sub: `${stats.pendingGyms} pending approval`,
      Icon: RiStoreLine,
      color: '#F5C842',
      link: '/gyms',
    },
    {
      label: 'Total Trainers',
      value: stats.totalTrainers,
      sub: `${stats.pendingTrainers} pending approval`,
      Icon: MdFitnessCenter,
      color: '#8B5CF6',
      link: '/trainers',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      sub: `${stats.proUsers} Pro/Premium`,
      Icon: RiGroupLine,
      color: '#06B6D4',
      link: '/users',
    },
    {
      label: "Today's Bookings",
      value: stats.todayBookings,
      sub: `${stats.totalBookings} total bookings`,
      Icon: RiCalendarEventLine,
      color: '#30D158',
      link: '/bookings',
    },
    {
      label: 'Month Revenue',
      value: formatCurrency(stats.monthRevenue),
      sub: `${formatCurrency(stats.totalRevenue)} all time`,
      Icon: RiMoneyDollarCircleLine,
      color: '#F97316',
      link: '/earnings',
    },
    {
      label: 'Platform Earnings',
      value: formatCurrency(stats.platformEarnings),
      sub: 'Your commission total',
      Icon: RiBarChartBoxLine,
      color: '#EF4444',
      link: '/earnings',
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ color: 'white', fontSize: isMobile ? 20 : 24, fontWeight: 900, margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
            Complete overview of Sankofa Fit platform
          </p>
        </div>
      </div>

      {(stats.pendingGyms > 0 || stats.pendingTrainers > 0) && (
        <div
          style={{
            backgroundColor: 'rgba(245,200,66,0.06)',
            border: '1px solid rgba(245,200,66,0.2)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RiTimeLine size={20} color="#F5C842" />
            <div>
              <div style={{ color: '#F5C842', fontWeight: 800, fontSize: 14 }}>Pending Approvals</div>
              <div style={{ color: '#6B7B99', fontSize: 13 }}>
                {stats.pendingGyms > 0 &&
                  `${stats.pendingGyms} gym${stats.pendingGyms !== 1 ? 's' : ''}`}
                {stats.pendingGyms > 0 && stats.pendingTrainers > 0 && ' · '}
                {stats.pendingTrainers > 0 &&
                  `${stats.pendingTrainers} trainer${stats.pendingTrainers !== 1 ? 's' : ''}`}{' '}
                waiting for review
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {stats.pendingGyms > 0 && (
              <Link
                to="/gyms"
                style={{
                  backgroundColor: '#F5C842',
                  color: '#1B2F6B',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Review Gyms <RiArrowRightLine size={14} />
              </Link>
            )}
            {stats.pendingTrainers > 0 && (
              <Link
                to="/trainers"
                state={{ filter: 'pending' }}
                style={{
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Review Trainers <RiArrowRightLine size={14} />
              </Link>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {statCards.map((card, i) => (
          <Link
            key={i}
            to={card.link}
            style={{
              backgroundColor: 'rgba(27,47,107,0.4)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
              textDecoration: 'none',
              display: 'block',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${card.color}40`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: `${card.color}15`,
                border: `1px solid ${card.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <card.Icon size={22} color={card.color} />
            </div>
            <div
              style={{
                color: card.color,
                fontSize: 24,
                fontWeight: 900,
                marginBottom: 4,
              }}
            >
              {loading ? '...' : card.value}
            </div>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
              {card.label}
            </div>
            <div style={{ color: '#6B7B99', fontSize: 11 }}>{card.sub}</div>
          </Link>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: 0 }}>
              Pending Gym Approvals
            </h3>
            <Link
              to="/gyms"
              style={{ color: '#F5C842', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
            >
              View All →
            </Link>
          </div>
          {pendingGyms.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7B99' }}>
              <RiCheckboxCircleLine
                size={32}
                color="rgba(48,209,88,0.4)"
                style={{ marginBottom: 8 }}
              />
              <p>All gyms approved!</p>
            </div>
          ) : (
            pendingGyms.map((gym) => (
              <div
                key={gym.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{gym.name}</div>
                  <div style={{ color: '#6B7B99', fontSize: 12, marginTop: 2 }}>
                    {gym.city} · {timeAgo(gym.created_at)}
                  </div>
                </div>
                <Link
                  to="/gyms"
                  style={{
                    backgroundColor: '#F5C842',
                    color: '#1B2F6B',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                    flexShrink: 0,
                  }}
                >
                  Review
                </Link>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: 0 }}>
              Recent Activity
            </h3>
            <Link
              to="/bookings"
              style={{ color: '#F5C842', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
            >
              View All →
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7B99', fontSize: 13 }}>
              No activity yet
            </div>
          ) : (
            recentActivity.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.desc}
                    </div>
                    <div style={{ color: '#6B7B99', fontSize: 11, marginTop: 1 }}>
                      {item.type} · {timeAgo(item.date)}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    color: '#30D158',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  GHS {item.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
