import { expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders program tracker title', async () => {
  render(<App />);
  await waitFor(() => {
    const heading = screen.getByRole('heading', { level: 1, name: /Recovery Buddy/i });
    expect(heading).toBeDefined();
  });
});
