import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CategoryTabs from './CategoryTabs';
import GroupCard from './GroupCard';
import PassCountdown from './PassCountdown';
import StartDateButton from './StartDateButton';
import { CATEGORIES } from '../data/categories';
import ProgressOverview from './ProgressOverview';
import { ProgressIcon, GroupsIcon, TodayIcon, SettingsIcon } from './Icons';

// Bottom-tab navigation layout for mobile viewports (≤768px)
const MOBILE_TABS = [
  { id: 'progress', label: 'Progress', icon: ProgressIcon },
  { id: 'groups', label: 'Groups', icon: GroupsIcon },
  { id: 'today', label: 'Today', icon: TodayIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function MobileLayout({
  groups,
  activeCategory,
  onCategoryChange,
  onGroupCheckIn,
  onGroupCheckOut,
  canGroupCheckIn,
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
}) {
  const [activeTab, setActiveTab] = useState('progress');

  return (
    <div className="mobile-layout">
      <header className="mobile-header">
        <div className="mobile-header-top">
          <h1 className="mobile-title">Recovery Tracker</h1>
          <div className="mobile-header-right">
            <span className={`time-badge ${nycTimeReady ? 'live' : 'fallback'}`}>
              {nycTimeReady ? 'NYC' : 'Local'}
            </span>
            <span className="mobile-clock">{nycTime || localTime}</span>
          </div>
        </div>
        <div className="mobile-header-bar">
          <motion.div
            className="mobile-progress-ring"
            style={{ '--progress': `${overallProgress}%` }}
          >
            <span className="mobile-progress-ring-text">{overallProgress}%</span>
          </motion.div>
          <span className="mobile-progress-summary">{totalCompleted}/{totalRequired} sessions</span>
        </div>
      </header>

      <main className="mobile-content">
        <AnimatePresence mode="wait">
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              className="mobile-tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PassCountdown refreshKey={refreshKey} />
              <div className="mobile-progress-section">
                <ProgressOverview groups={groups} />
              </div>
            </motion.div>
          )}
          {activeTab === 'groups' && (
            <motion.div
              key="groups"
              className="mobile-tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <CategoryTabs
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onChange={onCategoryChange}
                groups={groups}
              />
              <section className="mobile-groups-section">
                {filteredGroups.map((group, i) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    index={i}
                    onCheckIn={() => onGroupCheckIn(group)}
                    onCheckOut={() => onGroupCheckOut(group.id)}
                    canCheckIn={canGroupCheckIn(group)}
                  />
                ))}
              </section>
            </motion.div>
          )}
          {activeTab === 'today' && (
            <motion.div
              key="today"
              className="mobile-tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mobile-today-section">
                <h2>Today's Check-Ins</h2>
                {todayCheckIns.length === 0 ? (
                  <p className="mobile-today-empty">No check-ins yet today. Go to the Groups tab to check in.</p>
                ) : (
                  <ul className="mobile-checkin-list">
                    {todayCheckIns.map(ci => (
                      <li key={`${ci.groupId}-${ci.date}`} className="mobile-checkin-item">
                        <span className="mobile-checkin-group">{ci.groupId.replace(/-/g, ' ')}</span>
                        <span className="mobile-checkin-time">{new Date(ci.timestamp).toLocaleTimeString()}</span>
                        {ci.notes && <span className="mobile-checkin-notes">— {ci.notes}</span>}
                        <button className="checkin-undo-btn" onClick={() => onUndoCheckIn(ci.groupId, ci.date)}>Undo</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              className="mobile-tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <StartDateButton onReset={onReset} onSettingsChange={onSettingsChange} />
              <div className="export-import-bar">
                <button className="btn-export" onClick={onExport}>Export Data</button>
                <button className="btn-import" onClick={onImport}>Import Data</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="mobile-bottom-nav">
        {MOBILE_TABS.map(tab => (
          <button
            key={tab.id}
            className={`mobile-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mobile-nav-icon" aria-hidden="true">{typeof tab.icon === 'function' ? <tab.icon /> : tab.icon}</span>
            <span className="mobile-nav-label">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className="mobile-nav-indicator"
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
