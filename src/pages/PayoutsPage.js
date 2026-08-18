import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiStoreLine,
  RiUserHeartLine,
  RiInformationLine,
  RiMapPinLine,
  RiPhoneLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { useIsMobile } from '../hooks/useIsMobile';

const PAYSTACK_SECRET = process.env.REACT_APP_PAYSTACK_SECRET_KEY;

export default function PayoutsPage() {
  const isMobile = useIsMobile();
  const [gymPayouts, setGymPayouts] = useState([]);
  const [trainerPayouts, setTrainerPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gyms');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const [gymsRes, gymBookingsRes, gymMemberRes, trainersRes, trainerBookingsRes] =
        await Promise.all([
          supabase.from('gyms').select('*').eq('is_approved', true),
          supabase.from('gym_bookings').select('*'),
          supabase.from('gym_memberships').select('*'),
          supabase.from('trainers').select('*').eq('is_approved', true),
          supabase.from('trainer_bookings').select('*'),
        ]);

      const gyms = gymsRes.data || [];
      const gymBookings = gymBookingsRes.data || [];
      const gymMemberships = gymMemberRes.data || [];
      const trainers = trainersRes.data || [];
      const trainerBookings = trainerBookingsRes.data || [];

      const gymPayoutData = gyms
        .map((gym) => {
          const bookings = gymBookings.filter((b) => b.gym_id === gym.id);
          const memberships = gymMemberships.filter((m) => m.gym_id === gym.id);
          const bookingRevenue = bookings.reduce((sum, b) => sum + (b.amount_ghs || 0), 0);
          const memberRevenue = memberships.reduce((sum, m) => sum + (m.amount_ghs || 0), 0);
          const totalGross = bookingRevenue + memberRevenue;
          const platformCut = bookingRevenue * 0.15 + memberRevenue * 0.1;
          const gymEarnings = totalGross - platformCut;
          const paidOut = 0;

          return {
            id: gym.id,
            name: gym.name,
            city: gym.city,
            phone: gym.phone,
            email: gym.email,
            momo_provider: gym.momo_provider,
            momo_number: gym.momo_number,
            cover_image_url: gym.cover_image_url,
            totalGross,
            platformCut,
            gymEarnings,
            paidOut,
            outstanding: gymEarnings - paidOut,
            bookingCount: bookings.length + memberships.length,
            type: 'gym',
          };
        })
        .filter((g) => g.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding);

      const trainerPayoutData = trainers
        .map((trainer) => {
          const bookings = trainerBookings.filter((b) => b.trainer_id === trainer.id);
          const totalGross = bookings.reduce((sum, b) => sum + (b.amount_ghs || 0), 0);
          const platformCut = totalGross * 0.15;
          const trainerEarnings = totalGross - platformCut;

          return {
            id: trainer.id,
            name: trainer.name,
            city: trainer.city,
            phone: trainer.phone,
            email: trainer.email,
            momo_provider: trainer.momo_provider,
            momo_number: trainer.momo_number,
            profile_image_url: trainer.profile_image_url,
            totalGross,
            platformCut,
            trainerEarnings,
            paidOut: 0,
            outstanding: trainerEarnings,
            bookingCount: bookings.length,
            type: 'trainer',
          };
        })
        .filter((t) => t.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding);

      setGymPayouts(gymPayoutData);
      setTrainerPayouts(trainerPayoutData);
    } catch (e) {
      console.log('Payouts error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (partner) => {
    const amount = partner.outstanding;
    const name = partner.name;

    if (
      !window.confirm(
        `Confirm manual payout of ${formatCurrency(amount)} to ${name}?\n\n` +
          `Send via MoMo to:\n` +
          `Provider: ${partner.momo_provider || 'Not set'}\n` +
          `Number: ${partner.momo_number || 'Not set'}\n\n` +
          `Click OK only after you have sent the payment.`
      )
    ) {
      return;
    }

    setProcessing(partner.id);
    try {
      const { error } = await supabase.from('payout_history').insert({
        partner_id: partner.id,
        partner_type: partner.type,
        partner_name: partner.name,
        amount_ghs: partner.outstanding,
        method: 'manual_momo',
        momo_provider: partner.momo_provider,
        momo_number: partner.momo_number,
        status: 'completed',
        paid_at: new Date().toISOString(),
        notes: 'Manual payout via admin dashboard',
      });

      if (error) throw error;

      window.alert(
        `Payout recorded for ${name}. Confirm you sent GHS ${partner.outstanding.toFixed(2)} via ${partner.momo_provider} MoMo to ${partner.momo_number}.`
      );
      await loadPayouts();
    } catch (e) {
      console.log('Payout error:', e);
      window.alert('Failed to record payout. Ensure payout_history table exists in Supabase.');
    } finally {
      setProcessing(null);
    }
  };

  const handlePaystackTransfer = async (partner) => {
    if (!PAYSTACK_SECRET) {
      window.alert('Set REACT_APP_PAYSTACK_SECRET_KEY in .env for Paystack transfers.');
      return;
    }
    if (!partner.momo_number) {
      window.alert('This partner has not set up their MoMo number yet.');
      return;
    }

    const confirmed = window.confirm(
      `Send automatic Paystack transfer of ${formatCurrency(partner.outstanding)} to ${partner.name}?\n\n` +
        `MoMo: ${partner.momo_provider} ${partner.momo_number}\n\n` +
        `This will send money immediately via Paystack Transfer API.`
    );
    if (!confirmed) return;

    setProcessing(partner.id);
    try {
      const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'mobile_money',
          name: partner.name,
          account_number: partner.momo_number.replace(/^0/, '233'),
          bank_code:
            partner.momo_provider === 'MTN'
              ? 'MTN'
              : partner.momo_provider === 'Vodafone'
                ? 'VDF'
                : 'ATL',
          currency: 'GHS',
        }),
      });

      const recipientData = await recipientRes.json();
      if (!recipientData.status) {
        throw new Error(recipientData.message || 'Failed to create recipient');
      }

      const recipientCode = recipientData.data.recipient_code;

      const transferRes = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: Math.round(partner.outstanding * 100),
          recipient: recipientCode,
          reason: `Sankofa Fit payout - ${partner.name}`,
          currency: 'GHS',
        }),
      });

      const transferData = await transferRes.json();
      if (!transferData.status) {
        throw new Error(transferData.message || 'Transfer failed');
      }

      await supabase.from('payout_history').insert({
        partner_id: partner.id,
        partner_type: partner.type,
        partner_name: partner.name,
        amount_ghs: partner.outstanding,
        method: 'paystack_transfer',
        momo_provider: partner.momo_provider,
        momo_number: partner.momo_number,
        paystack_transfer_code: transferData.data?.transfer_code,
        status: 'completed',
        paid_at: new Date().toISOString(),
      });

      window.alert(
        `Transfer initiated: GHS ${partner.outstanding.toFixed(2)} to ${partner.name}. Code: ${transferData.data?.transfer_code}`
      );
      await loadPayouts();
    } catch (e) {
      console.log('Paystack transfer error:', e);
      window.alert(`Transfer failed: ${e.message}\n\nPlease use manual payout instead.`);
    } finally {
      setProcessing(null);
    }
  };

  const currentPayouts = activeTab === 'gyms' ? gymPayouts : trainerPayouts;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Payouts</h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
          Manage gym and trainer earnings payouts
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(6,182,212,0.06)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <RiInformationLine size={18} color="#06B6D4" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ color: '#06B6D4', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            Two Payout Options Available
          </div>
          <div style={{ color: '#6B7B99', fontSize: 12, lineHeight: 1.6 }}>
            <strong style={{ color: 'white' }}>Phase 1 - Manual:</strong> Send money via MoMo
            yourself then click &quot;Mark as Paid&quot; to record it.{' '}
            <strong style={{ color: 'white' }}>Phase 2 - Automatic:</strong> Click &quot;Paystack
            Transfer&quot; (requires REACT_APP_PAYSTACK_SECRET_KEY and Paystack balance).
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
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
          <div style={{ color: '#F5C842', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
            {formatCurrency(
              gymPayouts.reduce((s, g) => s + g.outstanding, 0) +
                trainerPayouts.reduce((s, t) => s + t.outstanding, 0)
            )}
          </div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Total Outstanding</div>
          <div style={{ color: '#6B7B99', fontSize: 11 }}>All unpaid earnings</div>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.4)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RiStoreLine size={24} color="#F5C842" style={{ marginBottom: 12 }} />
          <div style={{ color: '#F5C842', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
            {gymPayouts.length}
          </div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Gyms Owed</div>
          <div style={{ color: '#6B7B99', fontSize: 11 }}>
            {formatCurrency(gymPayouts.reduce((s, g) => s + g.outstanding, 0))}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.4)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RiUserHeartLine size={24} color="#8B5CF6" style={{ marginBottom: 12 }} />
          <div style={{ color: '#8B5CF6', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
            {trainerPayouts.length}
          </div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Trainers Owed</div>
          <div style={{ color: '#6B7B99', fontSize: 11 }}>
            {formatCurrency(trainerPayouts.reduce((s, t) => s + t.outstanding, 0))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          backgroundColor: 'rgba(27,47,107,0.4)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
          width: 'fit-content',
        }}
      >
        {[
          { id: 'gyms', label: `Gyms (${gymPayouts.length})` },
          { id: 'trainers', label: `Trainers (${trainerPayouts.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              backgroundColor: activeTab === tab.id ? '#F5C842' : 'transparent',
              color: activeTab === tab.id ? '#1B2F6B' : '#6B7B99',
              border: 'none',
              borderRadius: 9,
              padding: '8px 20px',
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
        <p style={{ color: '#6B7B99' }}>Loading payouts...</p>
      ) : currentPayouts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RiCheckboxCircleLine size={48} color="rgba(48,209,88,0.4)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: 'white', marginBottom: 8 }}>All paid up!</h3>
          <p style={{ color: '#6B7B99' }}>No outstanding payouts for {activeTab}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentPayouts.map((partner) => (
            <div
              key={partner.id}
              style={{
                backgroundColor: 'rgba(27,47,107,0.3)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
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
                  {partner.cover_image_url || partner.profile_image_url ? (
                    <img
                      src={partner.cover_image_url || partner.profile_image_url}
                      alt={partner.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : partner.type === 'gym' ? (
                    <RiStoreLine size={24} color="#F5C842" />
                  ) : (
                    <RiUserHeartLine size={24} color="#8B5CF6" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
                    {partner.name}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {partner.city && (
                      <span
                        style={{
                          color: '#6B7B99',
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <RiMapPinLine size={12} />
                        {partner.city}
                      </span>
                    )}
                    {partner.momo_number ? (
                      <span
                        style={{
                          color: '#6B7B99',
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <RiPhoneLine size={12} />
                        {partner.momo_provider} {partner.momo_number}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#EF4444',
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <RiErrorWarningLine size={12} />
                        No MoMo number set
                      </span>
                    )}
                    <span style={{ color: '#6B7B99', fontSize: 12 }}>
                      {partner.bookingCount} bookings
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#30D158', fontSize: 20, fontWeight: 900, marginBottom: 2 }}>
                    {formatCurrency(partner.outstanding)}
                  </div>
                  <div style={{ color: '#6B7B99', fontSize: 11 }}>outstanding</div>
                  <div style={{ color: '#6B7B99', fontSize: 11 }}>
                    from {formatCurrency(partner.totalGross)} gross
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                }}
              >
                <span style={{ color: '#6B7B99', fontSize: 12, flex: isMobile ? '1 1 100%' : 1 }}>
                  {partner.momo_provider} · {partner.momo_number || 'No number set'}
                </span>

                <button
                  type="button"
                  onClick={() => handleMarkAsPaid(partner)}
                  disabled={processing === partner.id || !partner.momo_number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(245,200,66,0.1)',
                    border: '1px solid rgba(245,200,66,0.3)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    color: '#F5C842',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: partner.momo_number ? 'pointer' : 'not-allowed',
                    opacity: !partner.momo_number ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center',
                  }}
                >
                  <RiCheckboxCircleLine size={14} />
                  Mark as Paid
                </button>

                <button
                  type="button"
                  onClick={() => handlePaystackTransfer(partner)}
                  disabled={processing === partner.id || !partner.momo_number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#30D158',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: partner.momo_number ? 'pointer' : 'not-allowed',
                    opacity: processing === partner.id || !partner.momo_number ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                    flex: isMobile ? 1 : 'none',
                    justifyContent: 'center',
                  }}
                >
                  <RiMoneyDollarCircleLine size={14} />
                  {processing === partner.id ? 'Sending...' : 'Paystack Transfer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
