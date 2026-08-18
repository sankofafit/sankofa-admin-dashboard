import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/formatters';
import { useIsMobile } from '../hooks/useIsMobile';

const thStyle = {
  color: '#6B7B99',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  padding: '10px 16px',
  textAlign: 'left',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  color: 'white',
  fontSize: 13,
  padding: '13px 16px',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingUserCount, setBookingUserCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const { data: profileUsers, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Users error:', error);
        setLoading(false);
        return;
      }

      const usersWithStats = await Promise.all(
        (profileUsers || []).map(async (user) => {
          const [gymRes, trainerRes, memberRes] = await Promise.all([
            supabase.from('gym_bookings').select('id, amount_ghs').eq('user_id', user.id),
            supabase.from('trainer_bookings').select('id, amount_ghs').eq('user_id', user.id),
            supabase.from('gym_memberships').select('id, amount_ghs').eq('user_id', user.id),
          ]);

          const gymBookings = gymRes.data || [];
          const trainerBookings = trainerRes.data || [];
          const memberships = memberRes.data || [];

          console.log(`${user.full_name} (${user.id}):`);
          console.log('  gym:', gymBookings.length);
          console.log('  trainer:', trainerBookings.length);
          console.log('  memberships:', memberships.length);
          console.log('  gym error:', gymRes.error);
          console.log('  trainer error:', trainerRes.error);

          const gymSpend = gymBookings.reduce((sum, b) => sum + (Number(b.amount_ghs) || 0), 0);
          const trainerSpend = trainerBookings.reduce(
            (sum, b) => sum + (Number(b.amount_ghs) || 0),
            0,
          );
          const memberSpend = memberships.reduce(
            (sum, m) => sum + (Number(m.amount_ghs) || 0),
            0,
          );

          const subRevenue =
            user.subscription_tier === 'premium' ? 140 : user.subscription_tier === 'pro' ? 70 : 0;

          const totalSpend = gymSpend + trainerSpend + memberSpend + subRevenue;

          return {
            ...user,
            gymBookings: gymBookings.length,
            trainerBookings: trainerBookings.length,
            memberships: memberships.length,
            bookingCount: gymBookings.length + trainerBookings.length + memberships.length,
            gymSpend,
            trainerSpend,
            memberSpend,
            subRevenue,
            totalSpend,
          };
        }),
      );

      const totalRev = usersWithStats.reduce((sum, u) => sum + u.totalSpend, 0);
      const paying = usersWithStats.filter((u) => u.bookingCount > 0).length;

      setUsers(usersWithStats);
      setTotalRevenue(totalRev);
      setBookingUserCount(paying);
    } catch (e) {
      console.log('loadUsers error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalUsers = users.length;
  const proUsers = users.filter((u) => u.subscription_tier === 'pro').length;
  const premiumUsers = users.filter((u) => u.subscription_tier === 'premium').length;
  const freeUsers = users.filter(
    (u) => !u.subscription_tier || u.subscription_tier === 'free',
  ).length;

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.subscription_tier?.toLowerCase().includes(search.toLowerCase()),
  );

  const rowsForTable = search ? filtered : users;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Users</h1>
        <p style={{ color: '#6B7B99', marginTop: 4 }}>
          {loading ? 'Loading…' : `${totalUsers} registered · ${bookingUserCount} paying`}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'Registered Users',
            value: totalUsers,
            color: '#F5C842',
            sub: 'with full profile',
          },
          {
            label: 'Paying Users',
            value: bookingUserCount,
            color: '#30D158',
            sub: 'bookings or subscription',
          },
          {
            label: 'Free Users',
            value: freeUsers,
            color: '#6B7B99',
            sub: 'on free plan',
          },
          {
            label: 'Pro Users',
            value: proUsers,
            color: '#F5C842',
            sub: 'GHS 70/month',
          },
          {
            label: 'Premium Users',
            value: premiumUsers,
            color: '#8B5CF6',
            sub: 'GHS 140/month',
          },
          {
            label: 'Total Spent',
            value: `GHS ${totalRevenue.toFixed(0)}`,
            color: '#06B6D4',
            sub: 'bookings + monthly subs',
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'rgba(27,47,107,0.4)',
              borderRadius: 14,
              padding: 16,
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: stat.color,
                fontSize: 22,
                fontWeight: 900,
                marginBottom: 4,
              }}
            >
              {loading ? '...' : stat.value}
            </div>
            <div
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {stat.label}
            </div>
            <div style={{ color: '#6B7B99', fontSize: 11 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users by name, email or plan..."
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '10px 14px',
          color: 'white',
          fontSize: 13,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      {loading ? (
        <p style={{ color: '#6B7B99', textAlign: 'center', padding: 40 }}>Loading users...</p>
      ) : rowsForTable.length === 0 ? (
        <p style={{ color: '#6B7B99', textAlign: 'center', padding: 40 }}>
          {search ? 'No users match your search.' : 'No users found.'}
        </p>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(search ? filtered : users).map((user, i) => (
            <div
              key={user.id ?? i}
              style={{
                backgroundColor: 'rgba(27,47,107,0.3)',
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>
                    {user.full_name || '—'}
                  </div>
                  <div style={{ color: '#6B7B99', fontSize: 12, marginTop: 2 }}>
                    {user.email || '—'}
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor:
                      user.subscription_tier === 'premium'
                        ? 'rgba(139,92,246,0.15)'
                        : user.subscription_tier === 'pro'
                          ? 'rgba(245,200,66,0.15)'
                          : 'rgba(255,255,255,0.06)',
                    color:
                      user.subscription_tier === 'premium'
                        ? '#8B5CF6'
                        : user.subscription_tier === 'pro'
                          ? '#F5C842'
                          : '#6B7B99',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                >
                  {user.subscription_tier || 'free'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {[
                  { label: 'Gym', value: user.gymBookings || 0, color: '#F5C842' },
                  { label: 'Trainer', value: user.trainerBookings || 0, color: '#8B5CF6' },
                  { label: 'Members', value: user.memberships || 0, color: '#06B6D4' },
                ].map((stat, j) => (
                  <div
                    key={j}
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: 8,
                      padding: 8,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color: stat.color, fontSize: 18, fontWeight: 900 }}>{stat.value}</div>
                    <div style={{ color: '#6B7B99', fontSize: 10 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ color: '#6B7B99', fontSize: 12 }}>Total Spent</span>
                <span
                  style={{
                    color: user.totalSpend > 0 ? '#30D158' : '#6B7B99',
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {user.totalSpend > 0 ? `GHS ${user.totalSpend.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {[
                    'Name',
                    'Email',
                    'Plan',
                    'Gym Bookings',
                    'Trainer Sessions',
                    'Memberships',
                    'Sub Revenue',
                    'Total Spent',
                    'Joined',
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(search ? filtered : users).map((user, i) => (
                  <tr key={user.id ?? i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={tdStyle}>{user.full_name || '—'}</td>
                    <td style={{ ...tdStyle, color: '#6B7B99' }}>{user.email || '—'}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          backgroundColor:
                            user.subscription_tier === 'premium'
                              ? 'rgba(139,92,246,0.15)'
                              : user.subscription_tier === 'pro'
                                ? 'rgba(245,200,66,0.15)'
                                : 'rgba(255,255,255,0.06)',
                          color:
                            user.subscription_tier === 'premium'
                              ? '#8B5CF6'
                              : user.subscription_tier === 'pro'
                                ? '#F5C842'
                                : '#6B7B99',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        {user.subscription_tier || 'free'}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'center',
                        color: user.gymBookings > 0 ? '#F5C842' : '#6B7B99',
                      }}
                    >
                      {user.gymBookings || 0}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'center',
                        color: user.trainerBookings > 0 ? '#8B5CF6' : '#6B7B99',
                      }}
                    >
                      {user.trainerBookings || 0}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'center',
                        color: user.memberships > 0 ? '#06B6D4' : '#6B7B99',
                      }}
                    >
                      {user.memberships || 0}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: user.subRevenue > 0 ? '#30D158' : '#6B7B99',
                        fontWeight: user.subRevenue > 0 ? 700 : 400,
                      }}
                    >
                      {user.subRevenue > 0 ? `GHS ${user.subRevenue.toFixed(2)}` : '—'}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: user.totalSpend > 0 ? '#30D158' : '#6B7B99',
                        fontWeight: user.totalSpend > 0 ? 800 : 400,
                        fontSize: user.totalSpend > 0 ? 14 : 13,
                      }}
                    >
                      {user.totalSpend > 0 ? `GHS ${user.totalSpend.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7B99' }}>{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
