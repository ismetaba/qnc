import type { Role } from '@qnc/shared';

/**
 * Single source of truth for the role accent hex values.
 * Mirrored in apps/web/src/styles/tokens.css as --accent-{role}.
 * Update both together if a designer changes one — the contrast test pins these.
 */
export const ROLE_ACCENT_HEX: Record<Role, string> = {
  admin: '#4f8eff',
  developer: '#25c08a',
  billing: '#f59e3a',
  viewer: '#8a93a6'
};

export const PANEL_BG_HEX = '#161c28';
