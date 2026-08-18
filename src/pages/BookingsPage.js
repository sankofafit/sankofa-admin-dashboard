import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate, formatCurrency } from '../utils/formatters';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    Promise.all([
      supabase.from('gym_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('trainer_bookings').select('*').order('created_at', { ascending: false }),
    ]).then(([gymRes, trainerRes]) => {
      const all = [
        ...(gymRes.data || []).map((b) => ({ ...b, bookingType: 'gym' })),
        ...(trainerRes.data || []).map((b) => ({ ...b, bookingType: 'trainer' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setBookings(all);
      setLoading(false);
    });
  }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch =
      !search ||
      b.class_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.gym_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.trainer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
      b.paystack_reference?.toLowerCase().includes(search.toLowerCase());

    const matchType =
      filterType === 'all' ||
      (filterType === 'gym' && b.bookingType === 'gym') ||
      (filterType === 'trainer' && b.bookingType === 'trainer');

    return matchSearch && matchType;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount_ghs || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>
          All Bookings
        </h1>
        <p style={{ color: '#6B7B99', marginTop: 4 }}>
          {bookings.length} total bookings · {formatCurrency(totalRevenue)} gross revenue
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            backgroundColor: 'rgba(27,47,107,0.4)',
            borderRadius: 10,
            padding: 4,
          }}
        >
          {[
            { id: 'all', label: `All (${bookings.length})` },
            {
              id: 'gym',
              label: `Gym (${bookings.filter((b) => b.bookingType === 'gym').length})`,
            },
            {
              id: 'trainer',
              label: `Trainer (${bookings.filter((b) => b.bookingType === 'trainer').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              style={{
                backgroundColor: filterType === tab.id ? '#F5C842' : 'transparent',
                color: filterType === tab.id ? '#1B2F6B' : '#6B7B99',
                border: 'none',
                borderRadius: 7,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by class, gym, trainer or reference..."
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '10px 14px',
            color: 'white',
            fontSize: 13,
            outline: 'none',
            minWidth: 200,
          }}
        />
      </div>

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {['Type', 'Details', 'Date', 'Amount', 'Platform Cut', 'Partner Cut', 'Status'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        color: '#6B7B99',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        padding: '10px 16px',
                        textAlign: 'left',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#6B7B99' }}>
                    Loading bookings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#6B7B99' }}>
                    No bookings match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((booking, i) => {
                  const commission = 0.15;
                  const platformCut = (booking.amount_ghs || 0) * commission;
                  const partnerCut = (booking.amount_ghs || 0) * (1 - commission);

                  return (
                    <tr key={booking.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor:
                              booking.bookingType === 'gym'
                                ? 'rgba(245,200,66,0.15)'
                                : 'rgba(139,92,246,0.15)',
                            color: booking.bookingType === 'gym' ? '#F5C842' : '#8B5CF6',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          {booking.bookingType === 'gym' ? 'GYM' : 'TRAINER'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {booking.class_name || booking.session_type || 'Booking'}
                        <div style={{ color: '#6B7B99', fontSize: 11 }}>
                          {booking.gym_name || booking.trainer_name}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: '#6B7B99' }}>
                        {formatDate(booking.booking_date || booking.created_at)}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {formatCurrency(booking.amount_ghs)}
                      </td>
                      <td style={{ ...tdStyle, color: '#EF4444' }}>{formatCurrency(platformCut)}</td>
                      <td style={{ ...tdStyle, color: '#30D158' }}>{formatCurrency(partnerCut)}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor: 'rgba(48,209,88,0.1)',
                            color: '#30D158',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {booking.status || 'Confirmed'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tdStyle = {
  color: 'white',
  fontSize: 13,
  padding: '13px 16px',
};
