import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarView from './CalendarView';

vi.mock('../services/storage', () => ({
  loadCheckIns: vi.fn(() => ({})),
}));

vi.mock('../services/nycTime', () => ({
  getToday: vi.fn(() => '2026-07-05'),
}));

describe('CalendarView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the calendar heading', () => {
    render(<CalendarView />);
    expect(screen.getByText('Calendar')).toBeDefined();
  });

  it('displays the current month and year', () => {
    render(<CalendarView />);
    expect(screen.getByText('July 2026')).toBeDefined();
  });

  it('renders day of week headers', () => {
    render(<CalendarView />);
    expect(screen.getByText('Sun')).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Fri')).toBeDefined();
    expect(screen.getByText('Sat')).toBeDefined();
  });

  it('navigates to the previous month', () => {
    render(<CalendarView />);
    fireEvent.click(screen.getByRole('button', { name: /prev/i }));
    expect(screen.getByText('June 2026')).toBeDefined();
  });

  it('navigates to the next month', () => {
    render(<CalendarView />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('August 2026')).toBeDefined();
  });

  it('highlights today', () => {
    render(<CalendarView />);
    const dayButtons = screen.getAllByRole('button');
    const day5 = dayButtons.find(btn => btn.textContent?.trim() === '5');
    expect(day5).toBeDefined();
  });

  it('shows no check-ins message when a day is selected with no data', () => {
    render(<CalendarView />);
    const dayButtons = screen.getAllByRole('button');
    const day5 = dayButtons.find(btn => btn.textContent?.trim() === '5');
    expect(day5).toBeDefined();
    fireEvent.click(day5!);
    expect(screen.getByText('No check-ins on this day')).toBeDefined();
  });

  it('shows intensity legend', () => {
    render(<CalendarView />);
    expect(screen.getByText('Intensity:')).toBeDefined();
    expect(screen.getByText('0')).toBeDefined();
    expect(screen.getByText('7+')).toBeDefined();
  });

  it('can navigate forward and backward through months', () => {
    render(<CalendarView />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('August 2026')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('September 2026')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /prev/i }));
    expect(screen.getByText('August 2026')).toBeDefined();
  });
});
