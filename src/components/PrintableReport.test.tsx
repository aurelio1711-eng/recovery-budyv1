import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintableReport from './PrintableReport';
import type { Group } from '../types';

const mockGroups: Group[] = [
  { id: 'healthy-relationships', name: 'Healthy Relationships', required: 16, category: 'clinical', completed: 16 },
  { id: 'rebt', name: 'REBT Therapy', required: 24, category: 'clinical', completed: 12 },
  { id: 'orientation', name: 'Orientation Groups', required: 12, category: 'orientation', completed: 0 },
  { id: 'aa-na', name: 'AA/NA Meetings', required: 999, category: 'support', recurring: true, completed: 10 },
];

vi.mock('../services/storage', () => ({
  loadCheckIns: vi.fn(() => ({
    'healthy-relationships-2026-07-04': {
      groupId: 'healthy-relationships',
      date: '2026-07-04',
      notes: 'Good session',
      timestamp: Date.now(),
      signature: 'data:image/png;base64,abc123',
    },
    'rebt-2026-07-05': {
      groupId: 'rebt',
      date: '2026-07-05',
      notes: '',
      timestamp: Date.now(),
      signature: null,
    },
  })),
  loadSettings: vi.fn(() => ({
    startDate: '2026-06-01',
    notifications: true,
    programStartDate: '2026-06-01',
    lastPassDate: '2026-07-01',
    passHistory: ['2026-07-01'],
    reminderTime: '09:00',
    reminderDays: [0, 1, 2, 3, 4, 5, 6],
  })),
  getDaysSinceProgramStart: vi.fn(() => 34),
  isEligibleForPass: vi.fn(() => true),
  getDaysUntilNextPass: vi.fn(() => 0),
}));

describe('PrintableReport', () => {
  const onClose = vi.fn();
  let windowPrintSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  afterEach(() => {
    windowPrintSpy.mockRestore();
  });

  it('renders the print dialog heading', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Print Report')).toBeDefined();
  });

  it('renders the print description', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText(/Generate a printable progress report/)).toBeDefined();
  });

  it('renders Print / Save as PDF button', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Print / Save as PDF')).toBeDefined();
  });

  it('calls window.print when print button is clicked', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    fireEvent.click(screen.getByText('Print / Save as PDF'));
    expect(windowPrintSpy).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the report content with program status', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Recovery Buddy — Progress Report')).toBeDefined();
    expect(screen.getByText('34')).toBeDefined();
  });

  it('shows category progress table', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Category Progress')).toBeDefined();
    expect(screen.getByText('Clinical Groups')).toBeDefined();
  });

  it('shows completed groups section', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Groups Completed')).toBeDefined();
    expect(screen.getAllByText('Healthy Relationships').length).toBeGreaterThanOrEqual(1);
  });

  it('shows in progress groups section', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.getAllByText('REBT Therapy').length).toBeGreaterThanOrEqual(1);
  });

  it('shows recurring groups section', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Recurring / Ongoing Groups')).toBeDefined();
    expect(screen.getAllByText('AA/NA Meetings').length).toBeGreaterThanOrEqual(1);
  });

  it('shows pass history section', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Weekend Pass History')).toBeDefined();
  });

  it('shows recent check-ins section', () => {
    render(<PrintableReport groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('Recent Check-Ins')).toBeDefined();
  });

  it('renders with empty groups', () => {
    render(<PrintableReport groups={[]} onClose={onClose} />);
    expect(screen.getByText('Recovery Buddy — Progress Report')).toBeDefined();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });
});
