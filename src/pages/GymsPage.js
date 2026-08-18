import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logActivity, LOG_ACTIONS } from '../utils/activityLogger';
import { timeAgo } from '../utils/formatters';
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiStoreLine,
  RiPhoneLine,
  RiMapPinLine,
  RiTimeLine,
  RiSearchLine,
} from 'react-icons/ri';
import { useIsMobile } from '../hooks/useIsMobile';

export default function GymsPage() {
  const isMobile = useIsMobile();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);

  const logAdminActivity = async (row) => {
    const actionMap = {
      approve_gym: LOG_ACTIONS.GYM_APPROVED,
      reject_gym: LOG_ACTIONS.GYM_REJECTED,
    };
    await logActivity({
      actorEmail: 'samamponsah775@gmail.com',
      actorName: 'Admin',
      actorType: 'admin',
      action: actionMap[row.action] || LOG_ACTIONS.ADMIN_ACTION,
      category: 'gym',
      description: row.notes || row.action,
      metadata: { gym_id: row.target_id, gym_name: row.target_name },
      status: row.action === 'reject_gym' ? 'warning' : 'success',
    });
  };

  const loadGyms = useCallback(async () => {
    const { data, error } = await supabase
      .from('gyms')
      .select(
        `
        *,
        gym_classes (
          id, name, price_ghs,
          is_active, category
        ),
        gym_membership_plans (
          id, name, price_ghs, is_active
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Load gyms error:', error);
      setLoading(false);
      return;
    }

    const gymsWithStats = await Promise.all(
      (data || []).map(async (gym) => {
        const [bookingsRes, membershipsRes] = await Promise.all([
          supabase.from('gym_bookings').select('amount_ghs, created_at').eq('gym_id', gym.id),
          supabase.from('gym_memberships').select('amount_ghs, created_at').eq('gym_id', gym.id),
        ]);

        const bookings = bookingsRes.data || [];
        const memberships = membershipsRes.data || [];

        const totalRevenue =
          bookings.reduce((s, b) => s + (b.amount_ghs || 0), 0) +
          memberships.reduce((s, m) => s + (m.amount_ghs || 0), 0);

        const gymEarnings =
          bookings.reduce((s, b) => s + (b.amount_ghs || 0) * 0.85, 0) +
          memberships.reduce((s, m) => s + (m.amount_ghs || 0) * 0.9, 0);

        return {
          ...gym,
          totalBookings: bookings.length + memberships.length,
          totalRevenue,
          gymEarnings,
        };
      })
    );

    setGyms(gymsWithStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGyms();

    const sub = supabase
      .channel('gyms_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gyms' }, () => loadGyms())
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [loadGyms]);

  const handleApprove = async (gymId) => {
    setProcessing(gymId);
    try {
      const gym = gyms.find((g) => g.id === gymId);

      const updatePayload = {
        is_approved: true,
        is_active: true,
      };

      let { error } = await supabase.from('gyms').update(updatePayload).eq('id', gymId);

      if (!error) {
        const withApprovedAt = await supabase
          .from('gyms')
          .update({ approved_at: new Date().toISOString() })
          .eq('id', gymId);
        if (withApprovedAt.error) {
          console.log('approved_at column optional:', withApprovedAt.error.message);
        }
      }

      if (error) throw error;

      await logAdminActivity({
        action: 'approve_gym',
        target_id: gymId,
        target_name: gym?.name,
        notes: 'Approved by admin',
        created_at: new Date().toISOString(),
      });

      await loadGyms();

      window.alert(
        `${gym?.name} has been approved and is now live on the Sankofa Fit app.`
      );
    } catch (e) {
      window.alert(`Error approving gym: ${e.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (gymId) => {
    const gym = gyms.find((g) => g.id === gymId);
    const reason = window.prompt(`Reason for rejecting ${gym?.name}?\n(This will be recorded)`);
    if (reason === null) return;

    setProcessing(gymId);
    try {
      const { error } = await supabase
        .from('gyms')
        .update({
          is_approved: false,
          is_active: false,
          rejection_reason: reason,
        })
        .eq('id', gymId);

      if (error) throw error;

      await logAdminActivity({
        action: 'reject_gym',
        target_id: gymId,
        target_name: gym?.name,
        notes: reason,
        created_at: new Date().toISOString(),
      });

      await loadGyms();
      window.alert(`${gym?.name} has been rejected.`);
    } catch (e) {
      window.alert(`Error: ${e.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleActive = async (gym) => {
    await supabase.from('gyms').update({ is_active: !gym.is_active }).eq('id', gym.id);
    await loadGyms();
  };

  const filtered = gyms.filter((gym) => {
    const matchesSearch =
      !search ||
      gym.name?.toLowerCase().includes(search.toLowerCase()) ||
      gym.city?.toLowerCase().includes(search.toLowerCase()) ||
      gym.email?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !gym.is_approved) ||
      (filter === 'approved' && gym.is_approved && gym.is_active) ||
      (filter === 'inactive' && !gym.is_active);

    return matchesSearch && matchesFilter;
  });

  const counts = {
    all: gyms.length,
    pending: gyms.filter((g) => !g.is_approved).length,
    approved: gyms.filter((g) => g.is_approved && g.is_active).length,
    inactive: gyms.filter((g) => !g.is_active).length,
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, margin: 0 }}>Gyms</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            {gyms.length} gyms registered
            {counts.pending > 0 && (
              <span style={{ color: '#F5C842', fontWeight: 700, marginLeft: 8 }}>
                · {counts.pending} pending approval
              </span>
            )}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'pending', label: `Pending (${counts.pending})` },
          { id: 'approved', label: `Approved (${counts.approved})` },
          { id: 'inactive', label: `Inactive (${counts.inactive})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            style={{
              backgroundColor: filter === tab.id ? '#F5C842' : 'rgba(27,47,107,0.4)',
              color: filter === tab.id ? '#1B2F6B' : '#6B7B99',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: 10,
            padding: '8px 14px',
            width: isMobile ? '100%' : 300,
            flex: isMobile ? '1 1 100%' : '0 0 auto',
            marginLeft: isMobile ? 0 : 'auto',
          }}
        >
          <RiSearchLine size={16} color="#6B7B99" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gyms..."
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              flex: 1,
            }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading gyms...</p>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 20,
            border: '1px solid var(--border)',
          }}
        >
          <RiStoreLine size={48} color="rgba(245,200,66,0.3)" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {search ? 'No gyms match your search' : 'No gyms found'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((gym) => (
            <div
              key={gym.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 16,
                border: `1px solid ${
                  !gym.is_approved
                    ? 'rgba(245,200,66,0.3)'
                    : gym.is_active
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(239,68,68,0.2)'
                }`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    backgroundColor: 'rgba(245,200,66,0.1)',
                    border: '1px solid rgba(245,200,66,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {gym.cover_image_url ? (
                    <img
                      src={gym.cover_image_url}
                      alt={gym.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <RiStoreLine size={28} color="#F5C842" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{gym.name}</span>
                    <span
                      style={{
                        backgroundColor: !gym.is_approved
                          ? 'rgba(245,200,66,0.15)'
                          : gym.is_active
                            ? 'rgba(48,209,88,0.15)'
                            : 'rgba(239,68,68,0.15)',
                        color: !gym.is_approved
                          ? '#F5C842'
                          : gym.is_active
                            ? '#30D158'
                            : '#EF4444',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {!gym.is_approved ? 'PENDING' : gym.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                      }}
                    >
                      <RiMapPinLine size={12} />
                      {gym.city || 'Ghana'}
                    </div>
                    {gym.phone && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                        }}
                      >
                        <RiPhoneLine size={12} />
                        {gym.phone}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                      }}
                    >
                      <RiTimeLine size={12} />
                      Registered {timeAgo(gym.created_at)}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {gym.gym_classes?.filter((c) => c.is_active).length || 0} classes ·{' '}
                      {gym.gym_membership_plans?.length || 0} plans
                    </div>
                  </div>

                  {gym.description && (
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        marginTop: 8,
                        lineHeight: 1.5,
                      }}
                    >
                      {gym.description.slice(0, 120)}
                      {gym.description.length > 120 ? '...' : ''}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 8,
                    flexShrink: 0,
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  {!gym.is_approved ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(gym.id)}
                        disabled={processing === gym.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#30D158',
                          color: 'var(--text-primary)',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          opacity: processing === gym.id ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        <RiCheckboxCircleLine size={14} />
                        {processing === gym.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(gym.id)}
                        disabled={processing === gym.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          color: '#EF4444',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        <RiCloseCircleLine size={14} />
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(gym)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: gym.is_active
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(48,209,88,0.1)',
                        color: gym.is_active ? '#EF4444' : '#30D158',
                        border: `1px solid ${
                          gym.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(48,209,88,0.3)'
                        }`,
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {gym.is_active ? (
                        <>
                          <RiCloseCircleLine size={14} /> Deactivate
                        </>
                      ) : (
                        <>
                          <RiCheckboxCircleLine size={14} /> Reactivate
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 0,
                  padding: '10px 20px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#F5C842', fontSize: 16, fontWeight: 900 }}>
                    {gym.totalBookings || 0}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Bookings</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#30D158', fontSize: 16, fontWeight: 900 }}>
                    GHS {(gym.gymEarnings || 0).toFixed(0)}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Gym Earnings</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#8B5CF6', fontSize: 16, fontWeight: 900 }}>
                    {gym.gym_classes?.filter((c) => c.is_active).length || 0}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Active Classes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#06B6D4', fontSize: 16, fontWeight: 900 }}>
                    {gym.gym_membership_plans?.length || 0}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Plans</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
