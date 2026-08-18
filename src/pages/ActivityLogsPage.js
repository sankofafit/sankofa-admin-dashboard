import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  RiShieldCheckLine,
  RiRefreshLine,
  RiDownloadLine,
  RiSearchLine,
} from 'react-icons/ri';

const CATEGORY_COLORS = {
  auth: { bg: 'rgba(6,182,212,0.1)', color: '#06B6D4', label: 'Auth' },
  booking: { bg: 'rgba(245,200,66,0.1)', color: '#F5C842', label: 'Booking' },
  payment: { bg: 'rgba(48,209,88,0.1)', color: '#30D158', label: 'Payment' },
  trainer: { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6', label: 'Trainer' },
  gym: { bg: 'rgba(245,200,66,0.1)', color: '#F5C842', label: 'Gym' },
  user: { bg: 'rgba(6,182,212,0.1)', color: '#06B6D4', label: 'User' },
  admin: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'Admin' },
  review: { bg: 'rgba(48,209,88,0.1)', color: '#30D158', label: 'Review' },
  report: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'Report' },
};

const ACTOR_COLORS = {
  user: '#06B6D4',
  trainer: '#8B5CF6',
  gym: '#F5C842',
  admin: '#EF4444',
  system: '#6B7B99',
};

const STATUS_COLORS = {
  success: '#30D158',
  failed: '#EF4444',
  warning: '#F5C842',
};

const selectStyle = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '9px 14px',
  color: 'white',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};

const paginationBtn = {
  backgroundColor: 'rgba(27,47,107,0.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '8px 16px',
  color: 'white',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterActor, setFilterActor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterActor, filterStatus, dateFrom, dateTo, page]);

  const loadLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      if (filterActor !== 'all') {
        query = query.eq('actor_type', filterActor);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data, error, count } = await query;

      if (error) {
        console.log('Load logs error:', error);
        return;
      }

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (e) {
      console.log('loadLogs error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.description?.toLowerCase().includes(s) ||
      log.actor_name?.toLowerCase().includes(s) ||
      log.actor_email?.toLowerCase().includes(s) ||
      log.action?.toLowerCase().includes(s)
    );
  });

  const exportCSV = () => {
    const headers = [
      'Date',
      'Actor',
      'Email',
      'Type',
      'Action',
      'Category',
      'Description',
      'Status',
    ];

    const rows = filteredLogs.map((log) => [
      new Date(log.created_at).toLocaleString('en-GB'),
      log.actor_name || '-',
      log.actor_email || '-',
      log.actor_type || '-',
      log.action || '-',
      log.category || '-',
      log.description || '-',
      log.status || '-',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sankofa-fit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
            Activity Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            {totalCount} total events logged
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={loadLogs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '9px 16px',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RiRefreshLine size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(245,200,66,0.1)',
              border: '1px solid rgba(245,200,66,0.3)',
              borderRadius: 10,
              padding: '9px 16px',
              color: '#F5C842',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RiDownloadLine size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: 'Total Events', value: totalCount, color: '#F5C842' },
          {
            label: 'Logins',
            value: logs.filter((l) => l.category === 'auth').length,
            color: '#06B6D4',
          },
          {
            label: 'Bookings',
            value: logs.filter((l) => l.category === 'booking').length,
            color: '#8B5CF6',
          },
          {
            label: 'Payments',
            value: logs.filter((l) => l.category === 'payment').length,
            color: '#30D158',
          },
          {
            label: 'Failed',
            value: logs.filter((l) => l.status === 'failed').length,
            color: '#EF4444',
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 12,
              padding: '14px 16px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                color: stat.color,
                fontSize: 24,
                fontWeight: 900,
                marginBottom: 4,
              }}
            >
              {stat.value}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '9px 14px',
            flex: 1,
            minWidth: 200,
          }}
        >
          <RiSearchLine size={15} color="#6B7B99" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
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

        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(0);
          }}
          style={selectStyle}
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_COLORS).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>

        <select
          value={filterActor}
          onChange={(e) => {
            setFilterActor(e.target.value);
            setPage(0);
          }}
          style={selectStyle}
        >
          <option value="all">All Actors</option>
          <option value="user">Users</option>
          <option value="trainer">Trainers</option>
          <option value="gym">Gyms</option>
          <option value="admin">Admin</option>
          <option value="system">System</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(0);
          }}
          style={selectStyle}
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="warning">Warning</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={selectStyle}
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={selectStyle}
          title="To date"
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading logs...</p>
      ) : filteredLogs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border)',
          }}
        >
          <RiShieldCheckLine
            size={48}
            color="rgba(245,200,66,0.2)"
            style={{ marginBottom: 16 }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>No logs found</p>
        </div>
      ) : (
        <>
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {['Time', 'Actor', 'Category', 'Action', 'Description', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const catStyle = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.user;
                  const actorColor = ACTOR_COLORS[log.actor_type] || '#6B7B99';
                  const statusColor = STATUS_COLORS[log.status] || '#6B7B99';

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 16px',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                        }}
                      >
                        {new Date(log.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td style={{ padding: '10px 16px' }}>
                        <div
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {log.actor_name || '-'}
                        </div>
                        <div
                          style={{
                            color: actorColor,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {log.actor_type}
                        </div>
                      </td>

                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            backgroundColor: catStyle.bg,
                            color: catStyle.color,
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {log.category}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '10px 16px',
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.action}
                      </td>

                      <td
                        style={{
                          padding: '10px 16px',
                          color: 'var(--text-primary)',
                          maxWidth: 300,
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 280,
                          }}
                        >
                          {log.description || '-'}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            {Object.entries(log.metadata)
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'capitalize',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: statusColor,
                              display: 'inline-block',
                            }}
                          />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  ...paginationBtn,
                  opacity: page === 0 ? 0.4 : 1,
                }}
              >
                ← Previous
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  ...paginationBtn,
                  opacity: page >= totalPages - 1 ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
