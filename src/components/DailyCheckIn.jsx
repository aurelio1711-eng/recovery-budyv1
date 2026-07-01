import { useState, useRef, useEffect } from 'react';
import { getToday } from '../services/nycTime';

// CSS selector for focusable elements within the modal (for focus trapping)
const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal dialog for recording a check-in, with date picker, notes, and focus trapping
export default function DailyCheckIn({ group, onSubmit, onClose }) {
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const overlayRef = useRef(null);

  // Focus trap: keep Tab cycling within modal; Escape to close
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const focusable = overlay.querySelectorAll(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    overlay.addEventListener('keydown', trap);
    return () => overlay.removeEventListener('keydown', trap);
  }, [onClose]);

  return (
    <div ref={overlayRef} className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="checkin-title" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="checkin-title">Check In: {group.name}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="checkin-date">Date</label>
            <input 
              id="checkin-date"
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkin-notes">Notes (optional)</label>
            <textarea
              id="checkin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your session? Notes..."
              rows="4"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-submit"
            onClick={() => onSubmit(group.id, selectedDate, notes)}
          >
            Complete Check In
          </button>
        </div>
      </div>
    </div>
  );
}