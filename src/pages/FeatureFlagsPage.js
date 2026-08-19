import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  RiToggleLine,
  RiToggleFill,
  RiShieldLine,
  RiMoneyDollarCircleLine,
  RiCalendarLine,
  RiUserLine,
  RiStoreLine,
} from 'react-icons/ri';

const FLAG_GROUPS = [
  {
    id: 'payments',
    label: 'Payment Features',
    icon: RiMoneyDollarCircleLine,
    color: '#F5C842',
    description: 'Control all payment and booking features',
    flags: [
      {
        key: 'gym_class_booking',
        label: 'Gym Class Booking',
        description: 'Users can book and pay for gym classes',
      },
      {
        key: 'trainer_session_booking',
        label: 'Trainer Session Booking',
        description: 'Users can book and pay for trainer sessions',
      },
      {
        key: 'gym_membership',
        label: 'Gym Memberships',
        description: 'Users can purchase gym membership plans',
      },
      {
        key: 'trainer_subscriptions',
        label: 'Trainer Subscriptions',
        description: 'Users can subscribe to trainer plans',
      },
      {
        key: 'drop_in_booking',
        label: 'Drop-in Bookings',
        description: 'Users can do drop-in gym visits',
      },
      {
        key: 'paystack_payments',
        label: 'Paystack Payments',
        description: 'Enable/disable all Paystack payment processing',
      },
    ],
  },
  {
    id: 'subscriptions',
    label: 'App Subscriptions',
    icon: RiShieldLine,
    color: '#8B5CF6',
    description: 'Control Pro and Premium subscription tiers',
    flags: [
      {
        key: 'pro_subscription',
        label: 'Pro Plan (GHS 70/mo)',
        description: 'Users can upgrade to Pro subscription',
      },
      {
        key: 'premium_subscription',
        label: 'Premium Plan (GHS 140/mo)',
        description: 'Users can upgrade to Premium subscription',
      },
    ],
  },
  {
    id: 'social',
    label: 'Social Features',
    icon: RiUserLine,
    color: '#06B6D4',
    description: 'Control messaging and social features',
    flags: [
      {
        key: 'trainer_chat',
        label: 'Trainer Chat',
        description: 'Users can message trainers after booking',
      },
      {
        key: 'trainer_reviews',
        label: 'Trainer Reviews',
        description: 'Users can rate and review trainers',
      },
      {
        key: 'trainer_reports',
        label: 'Report Trainer',
        description: 'Users can report trainers to admin',
      },
    ],
  },
  {
    id: 'explore',
    label: 'Explore Features',
    icon: RiStoreLine,
    color: '#30D158',
    description: 'Control what users can see and discover',
    flags: [
      {
        key: 'gym_listings',
        label: 'Gym Listings',
        description: 'Show gyms in the Explore screen',
      },
      {
        key: 'trainer_listings',
        label: 'Trainer Listings',
        description: 'Show trainers in the Explore screen',
      },
      {
        key: 'classes_today',
        label: 'Classes Today',
        description: 'Show today classes section',
      },
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness Features',
    icon: RiCalendarLine,
    color: '#EF4444',
    description: 'Control workout and health features',
    flags: [
      {
        key: 'workout_plans',
        label: 'Workout Plans',
        description: 'Show personalised workout plans',
      },
      {
        key: 'meal_plans',
        label: 'Meal Plans',
        description: 'Show daily meal plans',
      },
      {
        key: 'step_counter',
        label: 'Step Counter',
        description: 'Enable step counting feature',
      },
      {
        key: 'progress_tracking',
        label: 'Progress Tracking',
        description: 'Enable progress charts and stats',
      },
    ],
  },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const { data } = await supabase.from('feature_flags').select('*');

      const flagMap = {};
      (data || []).forEach((f) => {
        flagMap[f.key] = f.enabled;
      });

      setFlags(flagMap);
      console.log('Flags loaded:', flagMap);
    } catch (e) {
      console.log('Load flags error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (key, current) => {
    setSaving(key);
    try {
      const newValue = !current;

      const { error } = await supabase
        .from('feature_flags')
        .update({
          enabled: newValue,
          updated_at: new Date().toISOString(),
          updated_by: 'samamponsah775@gmail.com',
        })
        .eq('key', key);

      if (error) throw error;

      setFlags((prev) => ({
        ...prev,
        [key]: newValue,
      }));

      setLastUpdated(key);
      setTimeout(() => setLastUpdated(null), 2000);
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setSaving(null);
    }
  };

  const enableAll = async () => {
    if (!window.confirm('Enable ALL features?')) return;

    const allKeys = FLAG_GROUPS.flatMap((g) => g.flags.map((f) => f.key));

    const { error } = await supabase
      .from('feature_flags')
      .update({
        enabled: true,
        updated_at: new Date().toISOString(),
      })
      .in('key', allKeys);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    await loadFlags();
    alert('✅ All features enabled!');
  };

  const disablePayments = async () => {
    if (
      !window.confirm(
        'Disable ALL payment features?\n\nThis will hide booking buttons in the app.',
      )
    ) {
      return;
    }

    const paymentKeys = [
      'gym_class_booking',
      'trainer_session_booking',
      'gym_membership',
      'trainer_subscriptions',
      'drop_in_booking',
      'paystack_payments',
      'pro_subscription',
      'premium_subscription',
    ];

    const { error } = await supabase
      .from('feature_flags')
      .update({
        enabled: false,
        updated_at: new Date().toISOString(),
      })
      .in('key', paymentKeys);

    if (error) {
      alert(`Error: ${error.message}`);
      return;
    }

    await loadFlags();
    alert('✅ All payment features disabled!');
  };

  const isEnabled = (key) => flags[key] !== false;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              color: 'var(--text-primary)',
              fontSize: 24,
              fontWeight: 900,
              margin: 0,
            }}
          >
            Feature Flags
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            Toggle app features on/off without code changes. Changes apply instantly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={disablePayments}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '9px 16px',
              color: '#EF4444',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔒 Disable Payments
          </button>
          <button
            type="button"
            onClick={enableAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(48,209,88,0.1)',
              border: '1px solid rgba(48,209,88,0.3)',
              borderRadius: 10,
              padding: '9px 16px',
              color: '#30D158',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✅ Enable All
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        💡{' '}
        <strong style={{ color: 'var(--text-primary)' }}>Phase 1 Strategy:</strong> Disable all
        payment features while onboarding gyms and trainers. Enable them when ready to go live with
        payments. Changes take effect immediately in the app.
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading feature flags...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FLAG_GROUPS.map((group) => (
            <div
              key={group.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 20,
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${group.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${group.color}30`,
                  }}
                >
                  <group.icon size={18} color={group.color} />
                </div>
                <div>
                  <div
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    {group.label}
                  </div>
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      marginTop: 1,
                    }}
                  >
                    {group.description}
                  </div>
                </div>

                <div style={{ marginLeft: 'auto' }}>
                  <span
                    style={{
                      backgroundColor: group.flags.every((f) => isEnabled(f.key))
                        ? 'rgba(48,209,88,0.1)'
                        : group.flags.some((f) => isEnabled(f.key))
                          ? 'rgba(245,200,66,0.1)'
                          : 'rgba(239,68,68,0.1)',
                      color: group.flags.every((f) => isEnabled(f.key))
                        ? '#30D158'
                        : group.flags.some((f) => isEnabled(f.key))
                          ? '#F5C842'
                          : '#EF4444',
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {group.flags.every((f) => isEnabled(f.key))
                      ? 'All Active'
                      : group.flags.some((f) => isEnabled(f.key))
                        ? 'Partial'
                        : 'All Off'}
                  </span>
                </div>
              </div>

              {group.flags.map((flag, i) => {
                const enabled = isEnabled(flag.key);
                const isSaving = saving === flag.key;
                const justUpdated = lastUpdated === flag.key;

                return (
                  <div
                    key={flag.key}
                    style={{
                      padding: '14px 20px',
                      borderBottom:
                        i < group.flags.length - 1
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      transition: 'background 0.15s',
                      backgroundColor: justUpdated ? 'rgba(48,209,88,0.05)' : 'transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFlag(flag.key, enabled)}
                      disabled={isSaving}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: isSaving ? 'wait' : 'pointer',
                        padding: 0,
                        flexShrink: 0,
                        opacity: isSaving ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      {enabled ? (
                        <RiToggleFill size={36} color="#30D158" />
                      ) : (
                        <RiToggleLine size={36} color="#6B7B99" />
                      )}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: enabled ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {flag.label}
                        {justUpdated && (
                          <span style={{ color: '#30D158', fontSize: 11, fontWeight: 700 }}>
                            ✓ Updated!
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        {flag.description}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: enabled
                          ? 'rgba(48,209,88,0.1)'
                          : 'rgba(239,68,68,0.1)',
                        color: enabled ? '#30D158' : '#EF4444',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                        minWidth: 50,
                        textAlign: 'center',
                      }}
                    >
                      {isSaving ? '...' : enabled ? 'ON' : 'OFF'}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
