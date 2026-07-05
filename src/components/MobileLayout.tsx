import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import type { Group, CheckIn } from '../types';
import { CATEGORIES } from '../data/categories';
import CategoryTabs from './CategoryTabs';
import GroupCard from './GroupCard';
import PassCountdown from './PassCountdown';
import StartDateButton from './StartDateButton';
import ProgressOverview from './ProgressOverview';
import GroupsPage from './GroupsPage';
import { ProgressIcon, GroupsIcon, TodayIcon, SettingsIcon } from './Icons';

const MOBILE_TABS = [
  { id: 'progress', label: 'Progress', icon: ProgressIcon },
  { id: 'groups', label: 'Groups', icon: GroupsIcon },
  { id: 'today', label: 'Today', icon: TodayIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

interface MobileLayoutProps {
  groups: Group[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onGroupCheckIn: (group: Group) => void;
  onGroupCheckOut: (groupId: string) => void;
  canGroupCheckIn: (group: Group) => boolean;
  refreshKey: number;
  nycTimeReady: boolean;
  nycTime: string;
  localTime: string;
  overallProgress: number;
  totalCompleted: number;
  totalRequired: number;
  todayCheckIns: CheckIn[];
  onReset: () => void;
  onSettingsChange: () => void;
  filteredGroups: Group[];
  onExport: () => void;
  onImport: () => void;
  onUndoCheckIn: (groupId: string, date: string) => void;
  onGroupAdd: (group: Group) => void;
  onSearch: () => void;
  onBulkCheckIn: () => void;
  onPrintReport: () => void;
}

export default function MobileLayout({
  groups,
  activeCategory,
  onCategoryChange,
  onGroupCheckIn,
  onGroupCheckOut,
  canGroupCheckIn,
  onGroupAdd,
  refreshKey,
  nycTimeReady,
  nycTime,
  localTime,
  overallProgress,
  totalCompleted,
  totalRequired,
  todayCheckIns,
  onReset,
  onSettingsChange,
  filteredGroups,
  onExport,
  onImport,
  onUndoCheckIn,
  onSearch,
  onBulkCheckIn,
  onPrintReport,
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState('progress');

  return (
    <div className="flex flex-col h-dvh">
      <header className="shrink-0 bg-surface border-b border-border px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-base font-bold text-text">Recovery Buddy</h1>
          <div className="flex items-center gap-2">
            <span className={`text-[0.65rem] font-bold text-white px-1.5 py-0.5 rounded ${nycTimeReady ? 'bg-primary' : 'bg-warning'}`}>
              {nycTimeReady ? 'NYC' : 'Local'}
            </span>
            <span className="font-mono text-xs tabular-nums text-text-secondary">{nycTime || localTime}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0 relative">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(var(--color-primary) ${overallProgress}%, transparent ${overallProgress}%)`, mask: 'radial-gradient(circle at 50% 50%, transparent 55%, #000 55%)', WebkitMask: 'radial-gradient(circle at 50% 50%, transparent 55%, #000 55%)' }} />
            <span className="text-[0.6rem] font-bold text-text tabular-nums">{overallProgress}%</span>
          </div>
          <span className="text-xs text-text-muted tabular-nums">{totalCompleted}/{totalRequired} sessions</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'progress' && (
            <m.div
              key="progress"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PassCountdown refreshKey={refreshKey} />
              <ProgressOverview groups={groups} />
            </m.div>
          )}
          {activeTab === 'groups' && (
            <GroupsPage
              key="groups"
              groups={groups}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
              onGroupCheckIn={onGroupCheckIn}
              onGroupCheckOut={onGroupCheckOut}
              canGroupCheckIn={canGroupCheckIn}
              onGroupAdd={onGroupAdd}
            />
          )}
          {activeTab === 'today' && (
            <m.div
              key="today"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-[var(--radius-sm)] bg-primary text-white border-none cursor-pointer hover:bg-primary-dark transition-colors duration-150" onClick={onBulkCheckIn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Bulk Check-In
                </button>
                <button className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onSearch}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
                <button className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onPrintReport}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Print
                </button>
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold text-text mb-3">Today&apos;s Check-Ins</h2>
                {todayCheckIns.length === 0 ? (
                  <p className="text-sm text-text-muted">No check-ins yet today. Go to the Groups tab to check in.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {todayCheckIns.map(ci => (
                      <li key={`${ci.groupId}-${ci.date}`} className="flex items-center gap-2 bg-surface rounded-[var(--radius-md)] border border-border p-3 text-sm">
                        <span className="flex-1 font-medium text-text capitalize">{ci.groupId.replace(/-/g, ' ')}</span>
                        <span className="tablaur-nums text-xs text-text-muted">{new Date(ci.timestamp).toLocaleTimeString()}</span>
                        {ci.notes && <span className="text-xs text-text-muted truncate max-w-[120px]">— {ci.notes}</span>}
                        <button className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:text-primary-dark whitespace-nowrap" onClick={() => onUndoCheckIn(ci.groupId, ci.date)}>Undo</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </m.div>
          )}
          {activeTab === 'settings' && (
            <m.div
              key="settings"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <StartDateButton onReset={onReset} onSettingsChange={onSettingsChange} />
              <div className="flex gap-3">
                <button className="font-heading text-sm font-semibold py-2 px-5 rounded-[var(--radius-md)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150" onClick={onExport}>Export Data</button>
                <button className="font-heading text-sm font-semibold py-2 px-5 rounded-[var(--radius-md)] border border-border bg-background text-text cursor-pointer hover:bg-hover-bg transition-colors duration-150" onClick={onImport}>Import Data</button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="shrink-0 bg-surface border-t border-border flex safe-area-inset-bottom" aria-label="Mobile navigation">
        {MOBILE_TABS.map(tab => (
          <button
            key={tab.id}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium bg-transparent border-none cursor-pointer relative transition-colors duration-150 touch-target ${activeTab === tab.id ? 'text-primary' : 'text-text-muted'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span aria-hidden="true">{typeof tab.icon === 'function' ? <tab.icon /> : tab.icon}</span>
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <m.div
                className="absolute top-0 left-0 right-0 h-0.5 bg-primary"
                layoutId="mobileNavIndicator"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
