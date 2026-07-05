import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchModal from './SearchModal';
import type { Group } from '../types';

const mockGroups: Group[] = [
  { id: 'healthy-relationships', name: 'Healthy Relationships', required: 16, category: 'clinical', completed: 5 },
  { id: 'rebt', name: 'REBT Therapy', required: 24, category: 'clinical', completed: 0, note: 'Cognitive therapy sessions' },
  { id: 'aa-na', name: 'AA/NA Meetings', required: 999, category: 'support', recurring: true, completed: 10 },
];

vi.mock('../services/storage', () => ({
  loadCheckIns: vi.fn(() => ({
    'healthy-relationships-2026-07-05': {
      groupId: 'healthy-relationships',
      date: '2026-07-05',
      notes: 'Great session today',
      timestamp: Date.now(),
      signature: null,
    },
  })),
}));

describe('SearchModal', () => {
  const onClose = vi.fn();
  const onGroupSelect = vi.fn();
  const onDateSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search input', () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} />);
    expect(screen.getByPlaceholderText('Search groups, notes, dates...')).toBeDefined();
  });

  it('renders the ESC button', () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText('ESC')).toBeDefined();
  });

  it('shows empty state message', () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} />);
    expect(screen.getByText(/Type to search across groups/)).toBeDefined();
  });

  it('calls onClose when ESC is clicked', () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} />);
    fireEvent.click(screen.getByText('ESC'));
    expect(onClose).toHaveBeenCalled();
  });

  it('searches groups by name', async () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} onGroupSelect={onGroupSelect} />);
    const input = screen.getByPlaceholderText('Search groups, notes, dates...');
    fireEvent.change(input, { target: { value: 'REBT' } });
    expect(screen.getByText('REBT Therapy')).toBeDefined();
  });

  it('searches groups by note', async () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} />);
    const input = screen.getByPlaceholderText('Search groups, notes, dates...');
    fireEvent.change(input, { target: { value: 'cognitive' } });
    expect(screen.getByText('REBT Therapy')).toBeDefined();
  });

  it('shows no results message for unmatched query', () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} />);
    const input = screen.getByPlaceholderText('Search groups, notes, dates...');
    fireEvent.change(input, { target: { value: 'zzzznotfound' } });
    expect(screen.getByText(/No results found/)).toBeDefined();
  });

  it('calls onGroupSelect when a group result is clicked', () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} onGroupSelect={onGroupSelect} />);
    const input = screen.getByPlaceholderText('Search groups, notes, dates...');
    fireEvent.change(input, { target: { value: 'AA' } });
    fireEvent.click(screen.getByText('AA/NA Meetings'));
    expect(onGroupSelect).toHaveBeenCalledWith(mockGroups[2]);
  });

  it('renders group results with session info', () => {
    render(<SearchModal groups={mockGroups} onClose={onClose} />);
    const input = screen.getByPlaceholderText('Search groups, notes, dates...');
    fireEvent.change(input, { target: { value: 'Healthy' } });
    expect(screen.getByText(/5\/16 sessions/)).toBeDefined();
  });
});
