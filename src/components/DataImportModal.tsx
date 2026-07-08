import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getHasCloudData, pushToCloud, pullFromCloud, clearLocalAndPullFromCloud } from '../services/storageProvider';

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

  useState(() => {
    (async () => {
      if (!user) { setStep('done'); return; }

      const localProg = localStorage.getItem('clinical-program-tracker');
      const localChecks = localStorage.getItem('clinical-program-checkins');
      const hasLocalData = !!(localProg || localChecks);
      setHasLocal(hasLocalData);

      const cloudData = await getHasCloudData(user.id);
      setHasCloud(cloudData);

      if (!hasLocalData && !cloudData) {
        setStep('done');
      } else if (!hasLocalData && cloudData) {
        await pullFromCloud(user.id);
        setStep('done');
        onComplete();
      } else if (hasLocalData && !cloudData) {
        setStep('choose');
      } else {
        setStep('choose');
      }
    })();
  });

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
    setMessage('Downloading your cloud data...');
    try {
      await clearLocalAndPullFromCloud(user.id);
      setStep('done');
      onComplete();
    } catch {
      setStep('error');
      setMessage('Failed to download data. Please try again.');
    }
  };

  if (step === 'done') return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 safe-area-inset-bottom">
      <div className="bg-surface rounded-[var(--radius-lg)] border border-border w-full max-w-sm shadow-xl">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-heading text-base font-semibold text-text">Data Sync</h2>
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
                  Upload local data to cloud
                </button>
              )}
              {hasCloud && (
                <button
                  type="button"
                  className="w-full text-sm font-semibold py-2.5 px-4 rounded-[var(--radius-sm)] border border-border bg-background text-text cursor-pointer hover:bg-hover-bg transition-colors duration-150 touch-target"
                  onClick={handlePull}
                >
                  Download cloud data to this device
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
