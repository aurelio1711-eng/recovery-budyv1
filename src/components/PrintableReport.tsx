import { useMemo } from 'react';
import { loadCheckIns, loadSettings, getDaysSinceProgramStart, isEligibleForPass, getDaysUntilNextPass } from '../services/storage';
import { CATEGORIES } from '../data/categories';
import { getToday } from '../services/nycTime';
import type { Group, CheckIn, Settings } from '../types';

interface PrintableReportProps {
  groups: Group[];
  refreshKey?: number;
  onClose: () => void;
}

export default function PrintableReport({ groups, refreshKey = 0, onClose }: PrintableReportProps) {
  const checkIns = useMemo(() => {
    const data = loadCheckIns();
    return Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
  }, [refreshKey]);

  const settings: Settings = useMemo(() => loadSettings(), [refreshKey]);
  const daysSinceStart = useMemo(() => getDaysSinceProgramStart(), [refreshKey]);
  const eligible = useMemo(() => isEligibleForPass(), [refreshKey]);
  const daysUntilPass = useMemo(() => getDaysUntilNextPass(), [refreshKey]);

  const completedGroups = groups.filter(g => !g.recurring && g.required !== 999 && g.completed >= g.required);
  const inProgressGroups = groups.filter(g => !g.recurring && g.required !== 999 && g.completed > 0 && g.completed < g.required);
  const notStartedGroups = groups.filter(g => !g.recurring && g.required !== 999 && g.completed === 0);
  const recurringGroups = groups.filter(g => g.recurring || g.required === 999);

  const groupMap: Record<string, string> = {};
  groups.forEach(g => { groupMap[g.id] = g.name; });

  const categoryAnalytics = CATEGORIES.map(cat => {
    const catGroups = groups.filter(g => g.category === cat.id);
    const required = catGroups.reduce((sum, g) => sum + (g.required || 0), 0);
    const completed = catGroups.reduce((sum, g) => sum + (g.completed || 0), 0);
    const isRecurring = catGroups.every(g => g.recurring || g.required === 999);
    const pct = required > 0 ? Math.round((completed / required) * 100) : 0;
    return { label: cat.label, required, completed, pct, isRecurring };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="no-print fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-[var(--radius-lg)] border border-border w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-heading text-base font-semibold text-text">Print Report</h2>
            <button className="bg-transparent border-none text-2xl text-text-muted cursor-pointer hover:text-text leading-none p-1" onClick={onClose} aria-label="Close">&times;</button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-text-muted mb-4">Generate a printable progress report for your records or counselor.</p>
            <div className="flex gap-3">
              <button className="flex-1 font-heading text-sm font-semibold py-2.5 px-5 rounded-[var(--radius-md)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150" onClick={handlePrint}>
                Print / Save as PDF
              </button>
              <button className="text-sm font-semibold py-2.5 px-5 rounded-[var(--radius-md)] border border-border bg-background text-text cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="print-only">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body * { visibility: hidden; }
            .print-report, .print-report * { visibility: visible; }
            .print-report { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; background: white; color: #111; }
            .print-report h1, .print-report h2, .print-report h3 { color: #111; }
            .print-report .text-primary { color: #0F766E !important; }
            .print-report .text-success { color: #059669 !important; }
            .print-report .text-muted { color: #64748B !important; }
            .print-report .border { border-color: #E2E8F0 !important; }
            .print-report table { width: 100%; border-collapse: collapse; }
            .print-report th, .print-report td { border: 1px solid #E2E8F0; padding: 6px 10px; text-align: left; font-size: 0.8rem; }
            .print-report th { background: #F1F5F9; font-weight: 600; }
          }
          @media screen {
            .print-only { display: none !important; }
          }
        `}</style>

        <div className="print-report" style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto', color: '#111' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #0F766E', paddingBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0F766E' }}>Recovery Buddy — Progress Report</h1>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.3rem 0 0' }}>Generated on {getToday()}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Program Status</h3>
              <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Days in Program:</strong> {daysSinceStart}</p>
              <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Program Start:</strong> {settings.programStartDate}</p>
              <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Pass Eligible:</strong> {eligible ? `Yes (${daysUntilPass === 0 ? 'Ready now' : `${daysUntilPass} days`})` : 'Not yet'}</p>
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Summary</h3>
              <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Groups Completed:</strong> {completedGroups.length}</p>
              <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>In Progress:</strong> {inProgressGroups.length}</p>
              <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Total Check-Ins:</strong> {checkIns.length}</p>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem' }}>Category Progress</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Completed</th>
                  <th>Required</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {categoryAnalytics.map(cat => (
                  <tr key={cat.label}>
                    <td>{cat.label}</td>
                    <td>{cat.completed}</td>
                    <td>{cat.isRecurring ? '∞' : cat.required}</td>
                    <td>{cat.isRecurring ? `${cat.completed} sessions` : `${cat.pct}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {completedGroups.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem' }}>Groups Completed</h2>
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Sessions</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedGroups.map(g => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>{g.completed}/{g.required}</td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>Complete</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {inProgressGroups.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem' }}>In Progress</h2>
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Completed</th>
                    <th>Required</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {inProgressGroups.map(g => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>{g.completed}</td>
                      <td>{g.required}</td>
                      <td>{Math.round((g.completed / g.required) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recurringGroups.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem' }}>Recurring / Ongoing Groups</h2>
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Sessions Attended</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringGroups.map(g => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>{g.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {settings.passHistory && settings.passHistory.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem' }}>Weekend Pass History</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.passHistory.map((date, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.3rem' }}>Recent Check-Ins</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Group</th>
                  <th>Notes</th>
                  <th>Signed</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.slice(0, 50).map((ci, i) => (
                  <tr key={`${ci.groupId}-${ci.date}-${i}`}>
                    <td>{ci.date}</td>
                    <td>{groupMap[ci.groupId] || ci.groupId}</td>
                    <td>{ci.notes || '-'}</td>
                    <td>{ci.signature ? 'Yes' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94A3B8', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
            This report was generated by Recovery Buddy on {getToday()}. All data is from local storage.
          </div>
        </div>
      </div>
    </>
  );
}
