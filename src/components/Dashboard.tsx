import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { getAllGroups } from '../data/programData';
import { loadProgram, saveProgram, addCheckIn, hasCheckIn, removeCheckIn, getCheckInsForDate, exportData, importData, validateImportData } from '../services/storage';
import { initNycTime, getNycTimestamp, getLocalTimestamp, getToday } from '../services/nycTime';
import { initializeNotifications } from '../services/notifications';
import useMediaQuery from '../hooks/useMediaQuery';
import type { Group, CheckIn, Toast, Page } from '../types';
import DailyCheckIn from './DailyCheckIn';
import ProgressOverview from './ProgressOverview';
import ToastContainer from './ToastContainer';
import PassCountdown from './PassCountdown';
import NavMenu from './NavMenu';
import GroupsPage from './GroupsPage';
import SettingsPage from './SettingsPage';
import PerformanceReview from './PerformanceReview';
import MobileLayout from './MobileLayout';
import CalendarView from './CalendarView';
import SearchModal from './SearchModal';
import BulkCheckIn from './BulkCheckIn';
import PrintableReport from './PrintableReport';

interface DashboardProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Dashboard({ darkMode, onToggleDark }: DashboardProps) {
  const [page, setPage] = useState<Page>('dashboard');
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeCategory, setActiveCategory] = useState('clinical');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [nycTimeReady, setNycTimeReady] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [nycTime, setNycTime] = useState('');
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showWelcome, setShowWelcome] = useState(() => !loadProgram());
  const [showSearch, setShowSearch] = useState(false);
  const [showBulkCheckIn, setShowBulkCheckIn] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const toastTimeouts = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach(tid => clearTimeout(tid));
      toastTimeouts.current.clear();
    };
  }, []);

  const addToast = useCallback((message: string, undoHandler?: () => void) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, undoHandler }]);
    const tid = window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      toastTimeouts.current.delete(id);
    }, 4000);
    toastTimeouts.current.set(id, tid);
  }, []);

  const loadTodayCheckIns = () => setTodayCheckIns(getCheckInsForDate());

  useEffect(() => {
    initNycTime().then(ready => setNycTimeReady(ready));
    loadTodayCheckIns();
    const saved = loadProgram();
    if (saved) {
      setGroups(saved);
    } else {
      const initial = getAllGroups();
      setGroups(initial);
      saveProgram(initial);
    }
    initializeNotifications();
  }, []);

  useEffect(() => {
    let rafId: number;
    let lastTick = 0;
    const tick = (now: number) => {
      if (now - lastTick >= 1000) {
        setLocalTime(getLocalTimestamp());
        setNycTime(getNycTimestamp());
        lastTick = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    tick(performance.now());
    const onVisibility = () => { if (!document.hidden) tick(performance.now()); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { cancelAnimationFrame(rafId); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  const handleCheckIn = (groupId: string, date: string, notes: string, signature: string | null) => {
    const alreadyCheckedIn = hasCheckIn(groupId, date);
    addCheckIn(groupId, date, notes, signature);
    if (!alreadyCheckedIn) {
      setGroups(prev => {
        const updated = prev.map(g =>
          g.id === groupId ? { ...g, completed: g.completed + 1 } : g
        );
        saveProgram(updated);
        return updated;
      });
      const group = groups.find(g => g.id === groupId);
      addToast(`Checked in: ${group ? group.name : groupId}`, () => {
        handleCheckOut(groupId);
      });
    } else {
      addToast('Already checked in for this date');
    }
    setShowCheckInModal(false);
    setSelectedGroup(null);
    loadTodayCheckIns();
    setRefreshKey(k => k + 1);
  };

  const handleCheckOut = (groupId: string) => {
    removeCheckIn(groupId);
    setGroups(prev => {
      const updated = prev.map(g =>
        g.id === groupId && g.completed > 0 ? { ...g, completed: g.completed - 1 } : g
      );
      saveProgram(updated);
      return updated;
    });
    loadTodayCheckIns();
    setRefreshKey(k => k + 1);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-tracker-export-${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Data exported successfully');
  };

  const MAX_IMPORT_SIZE = 5 * 1024 * 1024;

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      if (file.size > MAX_IMPORT_SIZE) {
        addToast('Import failed: File is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target!.result as string);
          const validation = validateImportData(data);
          if (!validation.valid) {
            addToast('Import failed: Invalid data format');
            return;
          }
          try {
            importData(data);
          } catch {
            addToast('Import failed: Unable to process data');
            return;
          }
          const saved = loadProgram();
          if (saved) {
            setGroups(saved);
            setRefreshKey(k => k + 1);
            loadTodayCheckIns();
          }
          addToast('Data imported successfully');
        } catch {
          addToast('Import failed: Unable to parse file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleUndoTodayCheckIn = (groupId: string, date: string) => {
    removeCheckIn(groupId, date);
    setGroups(prev => {
      const group = prev.find(g => g.id === groupId);
      if (group && group.completed > 0) {
        const updated = prev.map(g =>
          g.id === groupId ? { ...g, completed: g.completed - 1 } : g
        );
        saveProgram(updated);
        return updated;
      }
      return prev;
    });
    loadTodayCheckIns();
    setRefreshKey(k => k + 1);
  };

  const handleReset = () => {
    const freshGroups = getAllGroups();
    setGroups(freshGroups);
    setActiveCategory('clinical');
    setTodayCheckIns([]);
    setRefreshKey(k => k + 1);
  };

  const handleSettingsChange = () => {
    setRefreshKey(k => k + 1);
  };

  const handleBulkCheckIn = (selections: { groupId: string; date: string; notes: string }[]) => {
    let newCount = 0;
    selections.forEach(({ groupId, date, notes }) => {
      const alreadyCheckedIn = hasCheckIn(groupId, date);
      addCheckIn(groupId, date, notes, null);
      if (!alreadyCheckedIn) newCount++;
    });
    if (newCount > 0) {
      setGroups(prev => {
        const updated = prev.map(g => {
          const sel = selections.find(s => s.groupId === g.id);
          if (sel && !hasCheckIn(g.id, sel.date)) {
            return { ...g, completed: g.completed + 1 };
          }
          return g;
        });
        saveProgram(updated);
        return updated;
      });
      addToast(`Checked in to ${newCount} group${newCount > 1 ? 's' : ''}`);
    } else {
      addToast('All selected groups already checked in for this date');
    }
    setShowBulkCheckIn(false);
    loadTodayCheckIns();
    setRefreshKey(k => k + 1);
  };

  const handleGroupAdd = (group: Group) => {
    setGroups(prev => {
      const updated = [...prev, group];
      saveProgram(updated);
      return updated;
    });
    setRefreshKey(k => k + 1);
    addToast(`Added custom group: ${group.name}`);
  };

  const totalRequired = useMemo(() => groups
    .filter(g => g.required !== 999)
    .reduce((sum, g) => sum + (g.required || 0), 0), [groups]);
  const totalCompleted = useMemo(() => groups.reduce((sum, g) => sum + (g.completed || 0), 0), [groups]);
  const overallProgress = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

  const isMobile = useMediaQuery('(max-width: 768px)');

  const sharedProps = {
    groups,
    activeCategory,
    onCategoryChange: setActiveCategory,
    onGroupCheckIn: (group: Group) => { setSelectedGroup(group); setShowCheckInModal(true); },
    onGroupCheckOut: handleCheckOut,
    canGroupCheckIn: (group: Group) => group.recurring || group.completed < group.required,
    onGroupAdd: handleGroupAdd,
    refreshKey,
    nycTimeReady,
    nycTime,
    localTime,
    overallProgress,
    totalCompleted,
    totalRequired,
    todayCheckIns,
    onReset: handleReset,
    onSettingsChange: handleSettingsChange,
    filteredGroups: groups.filter(g => g.category === activeCategory),
    onExport: handleExport,
    onImport: handleImport,
    onUndoCheckIn: handleUndoTodayCheckIn,
    onSearch: () => setShowSearch(true),
    onBulkCheckIn: () => setShowBulkCheckIn(true),
    onPrintReport: () => setShowPrintReport(true),
  };

  if (isMobile) {
    const isOnDashboard = page === 'dashboard';
    return (
      <m.div className="flex flex-col h-dvh" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <NavMenu groups={groups} activeCategory={activeCategory} onCategoryChange={setActiveCategory} onNavigate={setPage} currentPage={page} darkMode={darkMode} onToggleDark={onToggleDark} />
        {isOnDashboard ? (
          <MobileLayout {...sharedProps} />
        ) : (
          <>
            <header className="shrink-0 bg-surface border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="font-heading text-base font-bold text-text">Recovery Buddy</h1>
                <button className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:text-primary-dark" onClick={() => setPage('dashboard')}>Back</button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="wait">
                {page.startsWith('groups-') && (
                  <GroupsPage key={page} groups={groups} activeCategory={activeCategory} onCategoryChange={setActiveCategory} onGroupCheckIn={(group) => { setSelectedGroup(group); setShowCheckInModal(true); }} onGroupCheckOut={handleCheckOut} canGroupCheckIn={(group: Group) => group.recurring || group.completed < group.required} onGroupAdd={handleGroupAdd} />
                )}
                {page === 'review' && (
                  <PerformanceReview key="review" groups={groups} refreshKey={refreshKey} />
                )}
                {page === 'calendar' && (
                  <CalendarView key="calendar" refreshKey={refreshKey} />
                )}
                {page === 'settings' && (
                  <SettingsPage key="settings" onExport={handleExport} onImport={handleImport} onReset={handleReset} onSettingsChange={handleSettingsChange} />
                )}
              </AnimatePresence>
            </main>
          </>
        )}
        {showCheckInModal && selectedGroup && (
          <DailyCheckIn group={selectedGroup} onSubmit={handleCheckIn} onClose={() => { setShowCheckInModal(false); setSelectedGroup(null); }} />
        )}
        <ToastContainer toasts={toasts} onUndo={(t) => { t.undoHandler?.(); setToasts(prev => prev.filter(x => x.id !== t.id)); }} />
        {showSearch && (
          <SearchModal groups={groups} onClose={() => setShowSearch(false)} onGroupSelect={(group) => { setSelectedGroup(group); setShowCheckInModal(true); }} />
        )}
        {showBulkCheckIn && (
          <BulkCheckIn groups={groups} onSubmit={handleBulkCheckIn} onClose={() => setShowBulkCheckIn(false)} />
        )}
        {showPrintReport && (
          <PrintableReport groups={groups} refreshKey={refreshKey} onClose={() => setShowPrintReport(false)} />
        )}
      </m.div>
    );
  }

  const spring = { type: 'spring' as const, stiffness: 150, damping: 18, mass: 0.8 };
  const springSnap = { type: 'spring' as const, stiffness: 300, damping: 22 };

  return (
    <m.main className="pl-16 max-sm:pl-0" id="main-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <NavMenu groups={groups} activeCategory={activeCategory} onCategoryChange={setActiveCategory} onNavigate={setPage} currentPage={page} darkMode={darkMode} onToggleDark={onToggleDark} />

      <div className="max-w-5xl mx-auto px-6 py-8 max-sm:px-4 max-sm:py-4">
        {showWelcome && (
          <m.div className="relative bg-primary-light border border-primary rounded-[var(--radius-md)] p-4 mb-6 pr-10" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <h2 className="font-heading text-sm font-bold text-primary-dark mb-1">Welcome to Recovery Buddy</h2>
            <p className="text-xs text-text-secondary leading-relaxed">Track your clinical and non-clinical group attendance. Check in to groups each session, earn certificates upon completion, and track your 30-day weekend pass eligibility.</p>
            <button className="absolute top-2 right-3 bg-transparent border-none text-lg text-primary cursor-pointer leading-none p-0 hover:text-primary-dark" onClick={() => setShowWelcome(false)} aria-label="Dismiss">&times;</button>
          </m.div>
        )}

        <AnimatePresence mode="wait">
          {page === 'dashboard' && (
            <m.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={spring}>
              <m.header className="flex items-center justify-between mb-6" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}>
                <div className="flex items-center gap-4">
                  <h1 className="font-heading text-2xl font-bold text-text">Recovery Buddy</h1>
                  <m.div className="relative w-14 h-14" key={overallProgress} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springSnap}>
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray={`${overallProgress} ${100 - overallProgress}`} strokeLinecap="round" />
                    </svg>
                    <m.span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text tabular-nums" key={overallProgress} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}>
                      {overallProgress}%
                    </m.span>
                  </m.div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="flex items-center gap-1.5">
                    <button className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150 flex items-center gap-1.5" onClick={() => setShowSearch(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      Search
                    </button>
                    <button className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150 flex items-center gap-1.5" onClick={() => setShowBulkCheckIn(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Bulk Check-In
                    </button>
                    <button className="text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150 flex items-center gap-1.5" onClick={() => setShowPrintReport(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print Report
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[0.6rem] font-bold text-white px-1.5 py-0.5 rounded ${nycTimeReady ? 'bg-primary' : 'bg-warning'}`}>{nycTimeReady ? 'NYC' : 'Local'}</span>
                    <span className="text-xs font-mono tabular-nums text-text-secondary">{localTime}</span>
                    <span className="text-xs font-mono tabular-nums text-text-muted">{nycTime}</span>
                  </div>
                  <p className="text-xs text-text-muted tabular-nums">{totalCompleted} of {totalRequired} required sessions completed</p>
                </div>
              </m.header>

              <div className="flex flex-col gap-6">
                <PassCountdown refreshKey={refreshKey} />
                <ProgressOverview groups={groups} />

                {todayCheckIns.length > 0 ? (
                  <section>
                    <h2 className="font-heading text-base font-semibold text-text mb-3">Today&apos;s Check-Ins</h2>
                    <ul className="flex flex-col gap-2">
                      {todayCheckIns.map(ci => (
                        <m.li key={`${ci.groupId}-${ci.date}`} className="flex items-center gap-3 bg-surface rounded-[var(--radius-md)] border border-border p-3" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
                          <span className="flex-1 font-medium text-sm text-text capitalize">{ci.groupId.replace(/-/g, ' ')}</span>
                          <span className="text-xs tabular-nums text-text-muted">{new Date(ci.timestamp).toLocaleTimeString()}</span>
                          {ci.notes && <span className="text-xs text-text-muted truncate max-w-[180px]">— {ci.notes}</span>}
                          <button className="text-xs font-semibold text-primary bg-transparent border-none cursor-pointer hover:text-primary-dark" onClick={() => handleUndoTodayCheckIn(ci.groupId, ci.date)}>Undo</button>
                        </m.li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <div className="text-sm text-text-muted text-center py-8">No check-ins recorded for today</div>
                )}
              </div>
            </m.div>
          )}

          {page.startsWith('groups-') && (
            <GroupsPage key={page} groups={groups} activeCategory={activeCategory} onCategoryChange={setActiveCategory} onGroupCheckIn={(group) => { setSelectedGroup(group); setShowCheckInModal(true); }} onGroupCheckOut={handleCheckOut} canGroupCheckIn={(group: Group) => group.recurring || group.completed < group.required} onGroupAdd={handleGroupAdd} />
          )}

          {page === 'review' && (
            <PerformanceReview key="review" groups={groups} refreshKey={refreshKey} />
          )}

          {page === 'calendar' && (
            <CalendarView key="calendar" refreshKey={refreshKey} />
          )}

          {page === 'settings' && (
            <SettingsPage key="settings" onExport={handleExport} onImport={handleImport} onReset={handleReset} onSettingsChange={handleSettingsChange} />
          )}
        </AnimatePresence>

        {showCheckInModal && selectedGroup && (
          <DailyCheckIn group={selectedGroup} onSubmit={handleCheckIn} onClose={() => { setShowCheckInModal(false); setSelectedGroup(null); }} />
        )}

        <ToastContainer toasts={toasts} onUndo={(t) => { t.undoHandler?.(); setToasts(prev => prev.filter(x => x.id !== t.id)); }} />

        {showSearch && (
          <SearchModal groups={groups} onClose={() => setShowSearch(false)} onGroupSelect={(group) => { setSelectedGroup(group); setShowCheckInModal(true); }} />
        )}
        {showBulkCheckIn && (
          <BulkCheckIn groups={groups} onSubmit={handleBulkCheckIn} onClose={() => setShowBulkCheckIn(false)} />
        )}
        {showPrintReport && (
          <PrintableReport groups={groups} refreshKey={refreshKey} onClose={() => setShowPrintReport(false)} />
        )}
      </div>
    </m.main>
  );
}
