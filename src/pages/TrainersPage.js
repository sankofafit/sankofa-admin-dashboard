import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../utils/formatters';
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiUserHeartLine,
  RiPhoneLine,
  RiMapPinLine,
  RiTimeLine,
  RiSearchLine,
  RiStarLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

export default function TrainersPage() {
  const location = useLocation();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(location.state?.filter || 'all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Load trainers error:', error);
      }

      console.log('Trainers loaded:', data);
      setTrainers(data || []);
    } catch (e) {
      console.log('Trainers error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (trainerId) => {
    setProcessing(trainerId);
    try {
      const trainer = trainers.find((t) => t.id === trainerId);

      const { error } = await supabase
        .from('trainers')
        .update({
          is_approved: true,
          is_active: true,
          approved_at: new Date().toISOString(),
        })
        .eq('id', trainerId);

      if (error) throw error;

      await supabase.from('admin_activity_log').insert({
        action: 'approve_trainer',
        target_id: trainerId,
        target_name: trainer?.name,
        notes: 'Approved by admin',
        created_at: new Date().toISOString(),
      });

      await loadTrainers();
      alert(
        `✅ ${trainer?.name} has been approved!\n\n` +
          `They are now live on the Sankofa Fit app.`,
      );
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (trainerId) => {
    const trainer = trainers.find((t) => t.id === trainerId);
    const reason = window.prompt(`Reason for rejecting ${trainer?.name}?`);
    if (reason === null) return;

    setProcessing(trainerId);
    try {
      await supabase
        .from('trainers')
        .update({
          is_approved: false,
          is_active: false,
          rejection_reason: reason,
        })
        .eq('id', trainerId);

      await supabase.from('admin_activity_log').insert({
        action: 'reject_trainer',
        target_id: trainerId,
        target_name: trainer?.name,
        notes: reason,
        created_at: new Date().toISOString(),
      });

      await loadTrainers();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleActive = async (trainer) => {
    await supabase
      .from('trainers')
      .update({ is_active: !trainer.is_active })
      .eq('id', trainer.id);
    await loadTrainers();
  };

  const filtered = trainers.filter((trainer) => {
    const matchSearch =
      !search ||
      trainer.name?.toLowerCase().includes(search.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(search.toLowerCase()) ||
      trainer.speciality?.toLowerCase().includes(search.toLowerCase()) ||
      trainer.city?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && !trainer.is_approved) ||
      (filter === 'approved' && trainer.is_approved && trainer.is_active) ||
      (filter === 'inactive' && !trainer.is_active);

    return matchSearch && matchFilter;
  });

  const counts = {
    all: trainers.length,
    pending: trainers.filter((t) => !t.is_approved).length,
    approved: trainers.filter((t) => t.is_approved && t.is_active).length,
    inactive: trainers.filter((t) => !t.is_active).length,
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: 900,
              margin: 0,
            }}
          >
            Trainers
          </h1>
          <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
            {trainers.length} trainers registered
            {counts.pending > 0 && (
              <span
                style={{
                  color: '#F5C842',
                  fontWeight: 700,
                  marginLeft: 8,
                }}
              >
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
              backgroundColor:
                filter === tab.id ? '#F5C842' : 'rgba(27,47,107,0.4)',
              color: filter === tab.id ? '#1B2F6B' : '#6B7B99',
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '8px 14px',
            flex: 1,
            maxWidth: 300,
            marginLeft: 'auto',
          }}
        >
          <RiSearchLine size={16} color="#6B7B99" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainers..."
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: 13,
              outline: 'none',
              flex: 1,
            }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6B7B99' }}>Loading trainers...</p>
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
          <RiUserHeartLine
            size={48}
            color="rgba(139,92,246,0.3)"
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: '#6B7B99' }}>
            {search
              ? 'No trainers match your search'
              : filter === 'pending'
                ? 'No pending trainers'
                : 'No trainers found'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {filtered.map((trainer) => (
            <div
              key={trainer.id}
              style={{
                backgroundColor: 'rgba(27,47,107,0.3)',
                borderRadius: 16,
                border: `1px solid ${
                  !trainer.is_approved
                    ? 'rgba(245,200,66,0.3)'
                    : trainer.is_active
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(239,68,68,0.2)'
                }`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {trainer.profile_image_url ? (
                    <img
                      src={trainer.profile_image_url}
                      alt={trainer.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <RiUserHeartLine size={28} color="#8B5CF6" />
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
                    <span
                      style={{
                        color: 'white',
                        fontSize: 16,
                        fontWeight: 800,
                      }}
                    >
                      {trainer.name}
                    </span>

                    <span
                      style={{
                        backgroundColor: !trainer.is_approved
                          ? 'rgba(245,200,66,0.15)'
                          : trainer.is_active
                            ? 'rgba(48,209,88,0.15)'
                            : 'rgba(239,68,68,0.15)',
                        color: !trainer.is_approved
                          ? '#F5C842'
                          : trainer.is_active
                            ? '#30D158'
                            : '#EF4444',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {!trainer.is_approved
                        ? 'PENDING'
                        : trainer.is_active
                          ? 'ACTIVE'
                          : 'INACTIVE'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      flexWrap: 'wrap',
                      marginBottom: 6,
                    }}
                  >
                    {trainer.speciality && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#8B5CF6',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <MdFitnessCenter size={12} />
                        {trainer.speciality}
                      </div>
                    )}
                    {trainer.city && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#6B7B99',
                          fontSize: 12,
                        }}
                      >
                        <RiMapPinLine size={12} />
                        {trainer.city}
                      </div>
                    )}
                    {trainer.phone && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#6B7B99',
                          fontSize: 12,
                        }}
                      >
                        <RiPhoneLine size={12} />
                        {trainer.phone}
                      </div>
                    )}
                    {trainer.experience_years > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#6B7B99',
                          fontSize: 12,
                        }}
                      >
                        <RiStarLine size={12} />
                        {trainer.experience_years} years exp
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#6B7B99',
                        fontSize: 12,
                      }}
                    >
                      <RiTimeLine size={12} />
                      {timeAgo(trainer.created_at)}
                    </div>
                  </div>

                  {trainer.bio && (
                    <p
                      style={{
                        color: '#6B7B99',
                        fontSize: 12,
                        lineHeight: 1.5,
                        marginTop: 4,
                      }}
                    >
                      {trainer.bio.slice(0, 120)}
                      {trainer.bio.length > 120 ? '...' : ''}
                    </p>
                  )}

                  {trainer.certifications?.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginTop: 8,
                      }}
                    >
                      {trainer.certifications.filter(Boolean).map((cert, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: 'rgba(139,92,246,0.1)',
                            color: '#8B5CF6',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 600,
                            border: '1px solid rgba(139,92,246,0.2)',
                          }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  {!trainer.is_approved ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(trainer.id)}
                        disabled={processing === trainer.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: '#30D158',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          opacity: processing === trainer.id ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <RiCheckboxCircleLine size={14} />
                        {processing === trainer.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(trainer.id)}
                        disabled={processing === trainer.id}
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
                        }}
                      >
                        <RiCloseCircleLine size={14} />
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(trainer)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: trainer.is_active
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(48,209,88,0.1)',
                        color: trainer.is_active ? '#EF4444' : '#30D158',
                        border: `1px solid ${
                          trainer.is_active
                            ? 'rgba(239,68,68,0.3)'
                            : 'rgba(48,209,88,0.3)'
                        }`,
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {trainer.is_active ? (
                        <>
                          <RiCloseCircleLine size={14} />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <RiCheckboxCircleLine size={14} />
                          Reactivate
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
