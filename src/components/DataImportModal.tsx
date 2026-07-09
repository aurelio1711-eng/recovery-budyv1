import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getHasCloudData, pushToCloud, pullFromCloud } from '../services/storageProvider';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DataImportModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function DataImportModal({ onClose, onComplete }: DataImportModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'check' | 'choose' | 'syncing' | 'done' | 'error'>('check');
  const [message, setMessage] = useState('');
  const [hasLocal, setHasLocal] = useState(false);
  const [hasCloud, setHasCloud] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (step === 'done' || step === 'check') return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    lastFocused.current = document.activeElement as HTMLElement;
    const focusable = overlay.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Escape') { onClose(); return; }
      if (ke.key !== 'Tab') return;
      if (ke.shiftKey && document.activeElement === first) {
        ke.preventDefault();
        last?.focus();
      } else if (!ke.shiftKey && document.activeElement === last) {
        ke.preventDefault();
        first?.focus();
      }
    };
    overlay.addEventListener('keydown', trap);
    return () => {
      overlay.removeEventListener('keydown', trap);
      if (lastFocused.current && document.body.contains(lastFocused.current)) {
        lastFocused.current.focus();
      }
    };
  }, [step, onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { if (!cancelled) setStep('done'); return; }

      const localProg = localStorage.getItem('clinical-program-tracker');
      const localChecks = localStorage.getItem('clinical-program-checkins');
      const hasLocalData = !!(localProg || localChecks);
      if (!cancelled) setHasLocal(hasLocalData);

      const cloudData = await getHasCloudData(user.id);
      if (cancelled) return;
      setHasCloud(cloudData);

      if (!hasLocalData && !cloudData) {
        setStep('done');
      } else if (!hasLocalData && cloudData) {
        await pullFromCloud(user.id);
        if (!cancelled) { setStep('done'); onComplete(); }
      } else {
        if (!cancelled) setStep('choose');
      }
    })();
    return () => { cancelled = true; };
  }, [user, onComplete]);

  const handlePush = async () => {
    if (!user) return;
    setStep('syncing');
    setMessage('Uploading your local data to the cloud...');
    try {
      await pushToCloud(user.id);
      setStep('done');
      onComplete();
    } catch {
      setStep('error');
      setMessage('Failed to upload data. Please try again.');
    }
  };

  const handlePull = async () => {
    if (!user) return;
    setStep('syncing');
    setMessage('Merging cloud data with this device...');
    try {
      await pullFromCloud(user.id);
      setStep('done');
      onComplete();
    } catch {
      setStep('error');
      setMessage('Failed to download data. Please try again.');
    }
  };

  if (step === 'done') return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 safe-area-inset-bottom" role="dialog" aria-modal="true" aria-labelledby="data-sync-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="bg-surface rounded-[var(--radius-lg)] border border-border w-full max-w-sm shadow-xl">
        <div className="px-5 py-4 border-b border-border">
          <h2 id="data-sync-title" className="font-heading text-base font-semibold text-text">Data Sync</h2>
        </div>

        <div className="px-5 py-4">
          {(step === 'check' || step === 'syncing') && (
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {message || 'Checking your data...'}
            </div>
          )}

          {step === 'choose' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text">
                We found data on this device and in the cloud. How would you like to proceed?
              </p>
              {hasLocal && (
                <button
                  type="button"
                  className="w-full text-sm font-semibold py-2.5 px-4 rounded-[var(--radius-sm)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150 touch-target"
                  onClick={handlePush}
                >
                  Merge local data into cloud
                </button>
              )}
              {hasCloud && (
                <button
                  type="button"
                  className="w-full text-sm font-semibold py-2.5 px-4 rounded-[var(--radius-sm)] border border-border bg-background text-text cursor-pointer hover:bg-hover-bg transition-colors duration-150 touch-target"
                  onClick={handlePull}
                >
                  Merge cloud data with this device
                </button>
              )}
              <button
                type="button"
                className="w-full text-xs text-text-muted bg-transparent border-none cursor-pointer hover:text-text transition-colors duration-150"
                onClick={handlePush}
              >
                Keep local data (do nothing)
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-warning">{message}</p>
              <button
                type="button"
                className="text-sm font-semibold py-2 px-4 rounded-[var(--radius-sm)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150 touch-target"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
