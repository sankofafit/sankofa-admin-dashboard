import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  RiMoneyDollarCircleLine,
  RiBarChartBoxLine,
  RiStoreLine,
  RiUserHeartLine,
} from 'react-icons/ri';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState({
    totalGross: 0,
    platformTotal: 0,
    gymBookingsRevenue: 0,
    trainerRevenue: 0,
    membershipRevenue: 0,
    subscriptionRevenue: 0,
    proUsers: 0,
    premiumUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const [gymRes, trainerRes, memberRes, usersRes] = await Promise.all([
        supabase.from('gym_bookings').select('amount_ghs'),
        supabase.from('trainer_bookings').select('amount_ghs'),
        supabase.from('gym_memberships').select('amount_ghs'),
        supabase.from('users').select('subscription_tier'),
      ]);

      const gymBookings = gymRes.data || [];
      const trainerBookings = trainerRes.data || [];
      const memberships = memberRes.data || [];
      const users = usersRes.data || [];

      const gymRevenue = gymBookings.reduce((s, b) => s + (b.amount_ghs || 0), 0);
      const trainerRevenue = trainerBookings.reduce((s, b) => s + (b.amount_ghs || 0), 0);
      const memberRevenue = memberships.reduce((s, m) => s + (m.amount_ghs || 0), 0);

      const proUsers = users.filter((u) => u.subscription_tier === 'pro').length;
      const premiumUsers = users.filter((u) => u.subscription_tier === 'premium').length;
      const subRevenue = proUsers * 70 + premiumUsers * 140;

      const totalGross = gymRevenue + trainerRevenue + memberRevenue + subRevenue;

      const platformTotal =
        gymRevenue * 0.15 + trainerRevenue * 0.15 + memberRevenue * 0.1 + subRevenue;

      setEarnings({
        totalGross,
        platformTotal,
        gymBookingsRevenue: gymRevenue,
        trainerRevenue,
        membershipRevenue: memberRevenue,
        subscriptionRevenue: subRevenue,
        proUsers,
        premiumUsers,
      });
    } catch (e) {
      console.log('Earnings error:', e);
    } finally {
      setLoading(false);
    }
  };

  const breakdownItems = [
    {
      label: 'Gym Class Bookings',
      gross: earnings.gymBookingsRevenue,
      platform: earnings.gymBookingsRevenue * 0.15,
      rate: '15%',
      Icon: RiStoreLine,
      color: '#F5C842',
    },
    {
      label: 'Trainer Sessions',
      gross: earnings.trainerRevenue,
      platform: earnings.trainerRevenue * 0.15,
      rate: '15%',
      Icon: RiUserHeartLine,
      color: '#8B5CF6',
    },
    {
      label: 'Gym Memberships',
      gross: earnings.membershipRevenue,
      platform: earnings.membershipRevenue * 0.1,
      rate: '10%',
      Icon: RiStoreLine,
      color: '#06B6D4',
    },
    {
      label: 'Subscriptions (Pro/Premium)',
      gross: earnings.subscriptionRevenue,
      platform: earnings.subscriptionRevenue,
      rate: '100%',
      Icon: RiBarChartBoxLine,
      color: '#30D158',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>
          Platform Earnings
        </h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
          Sankofa Fit revenue breakdown
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.4)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(245,200,66,0.2)',
          }}
        >
          <RiMoneyDollarCircleLine size={24} color="#F5C842" style={{ marginBottom: 12 }} />
          <div style={{ color: '#F5C842', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
            {loading ? '...' : formatCurrency(earnings.platformTotal)}
          </div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Your Total Earnings</div>
          <div style={{ color: '#6B7B99', fontSize: 11 }}>Platform commission + subscriptions</div>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.4)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RiBarChartBoxLine size={24} color="#30D158" style={{ marginBottom: 12 }} />
          <div style={{ color: '#30D158', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
            {loading ? '...' : formatCurrency(earnings.totalGross)}
          </div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Total Gross Revenue</div>
          <div style={{ color: '#6B7B99', fontSize: 11 }}>All money collected on platform</div>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.4)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RiMoneyDollarCircleLine size={24} color="#8B5CF6" style={{ marginBottom: 12 }} />
          <div style={{ color: '#8B5CF6', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
            {loading ? '...' : formatCurrency(earnings.subscriptionRevenue)}
          </div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Subscription Revenue</div>
          <div style={{ color: '#6B7B99', fontSize: 11 }}>
            {earnings.proUsers} Pro · {earnings.premiumUsers} Premium users
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 style={{ color: 'white', fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
          Revenue Breakdown
        </h2>
        {isMobile ? (
          <div>
            {breakdownItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom:
                    i < breakdownItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      backgroundColor: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <item.Icon size={18} color={item.color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ color: '#6B7B99', fontSize: 11 }}>{item.rate} commission</div>
                  </div>
                </div>
                <div
                  style={{
                    color: item.color,
                    fontSize: 15,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(item.platform)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          breakdownItems.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 0',
                borderBottom:
                  i < breakdownItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${item.color}15`,
                  border: `1px solid ${item.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <item.Icon size={20} color={item.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ color: '#6B7B99', fontSize: 12 }}>
                  Gross: {formatCurrency(item.gross)} · Commission rate: {item.rate}
                </div>
              </div>
              <div style={{ color: item.color, fontSize: 16, fontWeight: 900 }}>
                {formatCurrency(item.platform)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
