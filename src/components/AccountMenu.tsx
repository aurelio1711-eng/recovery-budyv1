import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPendingSync, getQueueLength } from '../services/syncService';
import { getCurrentUserId } from '../services/storageProvider';
import DataImportModal from './DataImportModal';

interface AccountMenuProps {
  onImportComplete: () => void;
}

export default function AccountMenu({ onImportComplete }: AccountMenuProps) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const pending = hasPendingSync();
  const queueLen = getQueueLength();

  const initials = (user.email ?? user.id).slice(0, 2).toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-semibold py-1.5 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text-secondary cursor-pointer hover:bg-hover-bg transition-colors duration-150 touch-target"
          onClick={() => setOpen(!open)}
          aria-label="Account menu"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {initials}
            </span>
          )}
          <span className="max-w-[100px] truncate">{user.email ?? 'Account'}</span>
          {pending && (
            <span className="w-2 h-2 rounded-full bg-warning" title={`${queueLen} pending sync`} />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-[var(--radius-md)] shadow-xl z-50 py-1">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-medium text-text truncate">{user.email ?? 'Signed in'}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Cloud sync enabled</p>
            </div>

            {pending && (
              <div className="px-3 py-2 text-[10px] text-warning border-b border-border">
                {queueLen} change{queueLen !== 1 ? 's' : ''} pending sync
              </div>
            )}

            <button
              type="button"
              className="w-full text-left text-xs px-3 py-2 text-text hover:bg-hover-bg border-none bg-transparent cursor-pointer transition-colors duration-150"
              onClick={() => { setOpen(false); setShowImport(true); }}
            >
              Import local data
            </button>

            <button
              type="button"
              className="w-full text-left text-xs px-3 py-2 text-text hover:bg-hover-bg border-none bg-transparent cursor-pointer transition-colors duration-150"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {showImport && (
        <DataImportModal
          onClose={() => setShowImport(false)}
          onComplete={() => { setShowImport(false); onImportComplete(); }}
        />
      )}
    </>
  );
}
