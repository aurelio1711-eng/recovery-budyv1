import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkCheckIn from './BulkCheckIn';
import type { Group } from '../types';

const mockGroups: Group[] = [
  { id: 'healthy-relationships', name: 'Healthy Relationships', required: 16, category: 'clinical', completed: 5 },
  { id: 'rebt', name: 'REBT Therapy', required: 24, category: 'clinical', completed: 0 },
  { id: 'orientation', name: 'Orientation Groups', required: 12, category: 'orientation', completed: 3 },
  { id: 'aa-na', name: 'AA/NA Meetings', required: 999, category: 'support', recurring: true, completed: 10 },
];

describe('BulkCheckIn', () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-05T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the bulk check-in heading', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Bulk Check-In')).toBeDefined();
  });

  it('renders a date picker', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByLabelText('Date')).toBeDefined();
  });

  it('renders all eligible groups', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Healthy Relationships')).toBeDefined();
    expect(screen.getByText('REBT Therapy')).toBeDefined();
    expect(screen.getByText('Orientation Groups')).toBeDefined();
    expect(screen.getByText('AA/NA Meetings')).toBeDefined();
  });

  it('shows category headers', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Clinical')).toBeDefined();
    expect(screen.getByText('Orientation')).toBeDefined();
    expect(screen.getByText('Support')).toBeDefined();
  });

  it('starts with zero selected', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    expect(screen.getByText('Groups (0 selected)')).toBeDefined();
  });

  it('selects a group on click', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Healthy Relationships'));
    expect(screen.getByText('Groups (1 selected)')).toBeDefined();
  });

  it('deselects a group on second click', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Healthy Relationships'));
    fireEvent.click(screen.getByText('Healthy Relationships'));
    expect(screen.getByText('Groups (0 selected)')).toBeDefined();
  });

  it('selects all groups with Select All', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Select All'));
    expect(screen.getByText('Groups (4 selected)')).toBeDefined();
  });

  it('deselects all groups with Deselect All', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Select All'));
    fireEvent.click(screen.getByText('Deselect All'));
    expect(screen.getByText('Groups (0 selected)')).toBeDefined();
  });

  it('disables submit when no groups selected', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    const submitBtn = screen.getByText(/Check In/);
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onSubmit with selected groups', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Healthy Relationships'));
    fireEvent.click(screen.getByText('REBT Therapy'));
    fireEvent.click(screen.getByRole('button', { name: /Check In \(2\)/ }));
    expect(onSubmit).toHaveBeenCalledWith([
      { groupId: 'healthy-relationships', date: '2026-07-05', notes: '' },
      { groupId: 'rebt', date: '2026-07-05', notes: '' },
    ]);
  });

  it('calls onClose when cancel is clicked', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('includes shared notes in submission', () => {
    render(<BulkCheckIn groups={mockGroups} onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(screen.getByText('Healthy Relationships'));
    const notesInput = screen.getByPlaceholderText('Notes for all selected groups...');
    fireEvent.change(notesInput, { target: { value: 'Morning session' } });
    fireEvent.click(screen.getByRole('button', { name: /Check In \(1\)/ }));
    expect(onSubmit).toHaveBeenCalledWith([
      { groupId: 'healthy-relationships', date: '2026-07-05', notes: 'Morning session' },
    ]);
  });
});
