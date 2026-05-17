import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RoleProvider, useRole } from './RoleContext.js';
import type { Role } from '@qnc/shared';

function Probe(): JSX.Element {
  const { role, setRole } = useRole();
  return (
    <div>
      <span data-testid="role">{role}</span>
      <button onClick={() => setRole('developer')}>dev</button>
      <button onClick={() => setRole('billing')}>bill</button>
    </div>
  );
}

describe('RoleProvider', () => {
  it('defaults to admin and sets data-role on body', () => {
    render(
      <RoleProvider>
        <Probe />
      </RoleProvider>
    );
    expect(screen.getByTestId('role').textContent).toBe('admin');
    expect(document.body.getAttribute('data-role')).toBe('admin');
  });

  it('hydrates from localStorage when present', () => {
    window.localStorage.setItem('qnc.role', 'viewer' satisfies Role);
    render(
      <RoleProvider>
        <Probe />
      </RoleProvider>
    );
    expect(screen.getByTestId('role').textContent).toBe('viewer');
  });

  it('persists role changes to localStorage and body data-role', () => {
    render(
      <RoleProvider>
        <Probe />
      </RoleProvider>
    );
    act(() => {
      screen.getByText('dev').click();
    });
    expect(window.localStorage.getItem('qnc.role')).toBe('developer');
    expect(document.body.getAttribute('data-role')).toBe('developer');
    act(() => {
      screen.getByText('bill').click();
    });
    expect(window.localStorage.getItem('qnc.role')).toBe('billing');
    expect(document.body.getAttribute('data-role')).toBe('billing');
  });
});
