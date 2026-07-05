import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import type { Group, Category, Page } from '../types';
import { CATEGORIES } from '../data/categories';
import logo from '../RB.webp';

interface NavMenuProps {
  groups: Group[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onNavigate: (page: Page) => void;
  currentPage: Page;
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function NavMenu({ groups, activeCategory, onCategoryChange, onNavigate, currentPage, darkMode, onToggleDark }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const grouped: (Category & { groups: Group[] })[] = CATEGORIES.map(cat => ({
    ...cat,
    groups: groups.filter(g => g.category === cat.id),
  }));

  const navigateTo = (page: Page) => {
    onNavigate(page);
    setOpen(false);
    setExpandedCategory(null);
  };

  return (
    <>
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-surface border-r border-border flex flex-col items-center pt-3 gap-3 z-40 max-sm:hidden">
        <m.button
          className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] text-text-secondary hover:bg-hover-bg transition-colors duration-150 cursor-pointer border-none"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.92 }}
          aria-label="Open menu"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block w-5 h-0.5 bg-text-secondary rounded-full" /><span className="block w-5 h-0.5 bg-text-secondary rounded-full" /><span className="block w-5 h-0.5 bg-text-secondary rounded-full" />
          </span>
        </m.button>
        <m.button
          className="flex flex-col items-center gap-0.5 cursor-pointer border-none"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.97 }}
        >
          <img src={logo} alt="Recovery Buddy" className="w-8 h-8" />
          <span className="text-[0.55rem] font-bold text-primary leading-tight text-center">Recovery<span className="text-text-secondary"> Buddy</span></span>
        </m.button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <m.div
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <m.aside
              className="fixed left-0 top-0 bottom-0 w-72 bg-surface border-r border-border z-50 flex flex-col shadow-xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <img src={logo} alt="Recovery Buddy" className="w-9 h-9" />
                <span className="font-heading font-bold text-base text-text">Recovery Buddy</span>
                <button className="ml-auto bg-transparent border-none text-2xl text-text-muted cursor-pointer hover:text-text leading-none p-1" onClick={() => setOpen(false)} aria-label="Close menu">&times;</button>
              </div>

              <nav className="flex-1 overflow-y-auto py-3">
                <button
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-hover-bg text-left touch-target ${currentPage === 'dashboard' ? 'bg-hover-bg text-primary font-semibold' : ''}`}
                  onClick={() => navigateTo('dashboard')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  <span>Dashboard</span>
                </button>

                <button
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-hover-bg text-left touch-target ${currentPage === 'review' ? 'bg-hover-bg text-primary font-semibold' : ''}`}
                  onClick={() => navigateTo('review')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  <span>Performance Review</span>
                </button>

                <button
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-hover-bg text-left touch-target ${currentPage === 'calendar' ? 'bg-hover-bg text-primary font-semibold' : ''}`}
                  onClick={() => navigateTo('calendar')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>Calendar</span>
                </button>

                <div className="h-px bg-border mx-4 my-2" />

                {grouped.map(cat => (
                  <div key={cat.id}>
                    <button
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-hover-bg text-left touch-target ${currentPage === `groups-${cat.id}` ? 'bg-hover-bg text-primary font-semibold' : ''}`}
                      aria-expanded={expandedCategory === cat.id}
                      onClick={() => {
                        onCategoryChange(cat.id);
                        navigateTo(`groups-${cat.id}`);
                      }}
                    >
                      <cat.icon />
                      <span>{cat.label}</span>
                      <m.span
                        className="ml-auto text-xs opacity-60"
                        aria-hidden="true"
                        animate={{ rotate: expandedCategory === cat.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▾
                      </m.span>
                    </button>

                    <AnimatePresence>
                      {expandedCategory === cat.id && (
                        <m.div
                          className="overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {cat.groups.map(group => (
                            <button
                              key={group.id}
                              className="flex items-center justify-between w-full pl-11 pr-4 py-2 text-xs text-text-muted bg-transparent border-none cursor-pointer transition-colors hover:bg-hover-bg text-left"
                              onClick={() => {
                                onCategoryChange(cat.id);
                                navigateTo(`groups-${cat.id}`);
                              }}
                            >
                              <span className="truncate">{group.name}</span>
                              <span className="shrink-0 ml-2 text-text-lighter text-[0.65rem] font-mono">{group.completed}/{group.required === 999 ? '∞' : group.required}</span>
                            </button>
                          ))}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <div className="h-px bg-border mx-4 my-2" />

                <button
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-hover-bg text-left touch-target ${currentPage === 'settings' ? 'bg-hover-bg text-primary font-semibold' : ''}`}
                  onClick={() => navigateTo('settings')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  <span>Settings</span>
                </button>

                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-hover-bg text-left mt-auto border-t border-border touch-target" onClick={onToggleDark} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
                  <span aria-hidden="true">
                    {darkMode ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                  </span>
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </nav>
            </m.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
