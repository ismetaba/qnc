import { describe, it, expect } from 'vitest';
import { ROLE_CAPS, ALL_NAV_ITEMS, ALL_ROLES } from './roles.js';

const FLAGS = [
  'canCreateEndpoint',
  'canDeleteEndpoint',
  'canManageUsers',
  'canViewBilling',
  'canEditSettings'
] as const;

describe('ROLE_CAPS', () => {
  it('contains every role', () => {
    expect(Object.keys(ROLE_CAPS).sort()).toEqual([...ALL_ROLES].sort());
  });

  it('every role exposes nav + 5 capability flags', () => {
    for (const role of ALL_ROLES) {
      const cap = ROLE_CAPS[role];
      expect(Array.isArray(cap.nav)).toBe(true);
      for (const flag of FLAGS) {
        expect(typeof cap[flag]).toBe('boolean');
      }
    }
  });

  it('admin sees all 8 nav items', () => {
    expect(ROLE_CAPS.admin.nav.length).toBe(8);
    for (const item of ALL_NAV_ITEMS) {
      expect(ROLE_CAPS.admin.nav).toContain(item);
    }
  });

  it('billing sees ≤ 2 nav items', () => {
    expect(ROLE_CAPS.billing.nav.length).toBeLessThanOrEqual(2);
  });

  it('developer cannot delete or manage users; viewer cannot create endpoints', () => {
    expect(ROLE_CAPS.developer.canDeleteEndpoint).toBe(false);
    expect(ROLE_CAPS.developer.canManageUsers).toBe(false);
    expect(ROLE_CAPS.viewer.canCreateEndpoint).toBe(false);
  });
});
