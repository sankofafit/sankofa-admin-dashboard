import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/formatters';
import {
  RiFlagLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiUserHeartLine,
} from 'react-icons/ri';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data } = await supabase
        .from('trainer_reports')
        .select(`
          *,
          trainers (
            id, name, speciality,
            city, profile_image_url
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Reports:', data?.length);
      setReports(data || []);
    } catch (e) {
      console.log('Load reports error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId) => {
    if (!window.confirm('Mark this report as resolved?')) return;

    setProcessing(reportId);
    try {
      await supabase
        .from('trainer_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      await loadReports();
    } finally {
      setProcessing(null);
    }
  };

  const handleDismiss = async (reportId) => {
    if (!window.confirm('Dismiss this report as invalid?')) return;

    setProcessing(reportId);
    try {
      await supabase
        .from('trainer_reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);

      await loadReports();
    } finally {
      setProcessing(null);
    }
  };

  const handleSuspendTrainer = async (trainerId, reportId) => {
    if (!window.confirm('Suspend this trainer? They will be removed from the app.')) return;

    setProcessing(reportId);
    try {
      await supabase
        .from('trainers')
        .update({
          is_active: false,
          is_approved: false,
        })
        .eq('id', trainerId);

      await supabase
        .from('trainer_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      await loadReports();
      alert('Trainer has been suspended.');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = reports.filter((r) => filter === 'all' || r.status === filter);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    dismissed: reports.filter((r) => r.status === 'dismissed').length,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>
          Trainer Reports
        </h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
          {counts.pending > 0 && (
            <span style={{ color: '#EF4444', fontWeight: 700 }}>
              {counts.pending} pending review ·
            </span>
          )}
          {' '}
          {counts.all} total reports
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'pending', label: `Pending (${counts.pending})` },
          { id: 'resolved', label: `Resolved (${counts.resolved})` },
          { id: 'dismissed', label: `Dismissed (${counts.dismissed})` },
          { id: 'all', label: `All (${counts.all})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            style={{
              backgroundColor:
                filter === tab.id
                  ? tab.id === 'pending'
                    ? '#EF4444'
                    : '#F5C842'
                  : 'rgba(27,47,107,0.4)',
              color:
                filter === tab.id
                  ? filter === 'pending'
                    ? 'white'
                    : '#1B2F6B'
                  : '#6B7B99',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#6B7B99' }}>Loading reports...</p>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RiFlagLine
            size={48}
            color="rgba(239,68,68,0.3)"
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: '#6B7B99' }}>No {filter} reports</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((report) => (
            <div
              key={report.id}
              style={{
                backgroundColor: 'rgba(27,47,107,0.3)',
                borderRadius: 16,
                border: `1px solid ${
                  report.status === 'pending'
                    ? 'rgba(239,68,68,0.3)'
                    : 'rgba(255,255,255,0.06)'
                }`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: 'rgba(139,92,246,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {report.trainers?.profile_image_url ? (
                      <img
                        src={report.trainers.profile_image_url}
                        alt={report.trainer_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <RiUserHeartLine size={24} color="#8B5CF6" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>
                        {report.trainer_name}
                      </span>
                      <span
                        style={{
                          backgroundColor:
                            report.status === 'pending'
                              ? 'rgba(239,68,68,0.15)'
                              : report.status === 'resolved'
                                ? 'rgba(48,209,88,0.15)'
                                : 'rgba(107,123,153,0.15)',
                          color:
                            report.status === 'pending'
                              ? '#EF4444'
                              : report.status === 'resolved'
                                ? '#30D158'
                                : '#6B7B99',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <RiFlagLine size={12} color="#EF4444" />
                      <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>
                        {report.reason}
                      </span>
                    </div>

                    <span style={{ color: '#6B7B99', fontSize: 12 }}>
                      Reported on {formatDate(report.created_at)}
                    </span>
                  </div>
                </div>

                {report.details ? (
                  <div
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.06)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      marginBottom: 14,
                      border: '1px solid rgba(239,68,68,0.15)',
                    }}
                  >
                    <p
                      style={{
                        color: '#6B7B99',
                        fontSize: 13,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      "{report.details}"
                    </p>
                  </div>
                ) : null}

                {report.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleResolve(report.id)}
                      disabled={processing === report.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(48,209,88,0.1)',
                        border: '1px solid rgba(48,209,88,0.3)',
                        borderRadius: 8,
                        padding: '8px 14px',
                        color: '#30D158',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <RiCheckboxCircleLine size={14} />
                      Mark Resolved
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDismiss(report.id)}
                      disabled={processing === report.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(107,123,153,0.1)',
                        border: '1px solid rgba(107,123,153,0.2)',
                        borderRadius: 8,
                        padding: '8px 14px',
                        color: '#6B7B99',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <RiCloseCircleLine size={14} />
                      Dismiss
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSuspendTrainer(report.trainers?.id || report.trainer_id, report.id)
                      }
                      disabled={processing === report.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#EF4444',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🚫 Suspend Trainer
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
