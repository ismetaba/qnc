import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RolePill } from './RolePill.js';
import type { Role } from '@qnc/shared';

const ROLES: Role[] = ['admin', 'developer', 'billing', 'viewer'];

describe('<RolePill/>', () => {
  it.each(ROLES)('renders role name + data-role for %s', (role) => {
    render(<RolePill role={role} />);
    const pill = screen.getByTestId('role-pill');
    expect(pill.dataset.role).toBe(role);
    expect(pill.textContent?.toLowerCase()).toContain(role);
  });
});
