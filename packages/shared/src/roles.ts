import type { NavItem, Role } from './types.js';

export interface RoleCapability {
  nav: NavItem[];
  canCreateEndpoint: boolean;
  canDeleteEndpoint: boolean;
  canManageUsers: boolean;
  canViewBilling: boolean;
  canEditSettings: boolean;
}

export const ROLE_CAPS: Record<Role, RoleCapability> = {
  admin: {
    nav: ['overview', 'endpoints', 'rpc', 'metrics', 'nodes', 'users', 'billing', 'settings'],
    canCreateEndpoint: true,
    canDeleteEndpoint: true,
    canManageUsers: true,
    canViewBilling: true,
    canEditSettings: true
  },
  developer: {
    nav: ['overview', 'endpoints', 'rpc', 'metrics', 'nodes'],
    canCreateEndpoint: true,
    canDeleteEndpoint: false,
    canManageUsers: false,
    canViewBilling: false,
    canEditSettings: false
  },
  billing: {
    nav: ['overview', 'billing'],
    canCreateEndpoint: false,
    canDeleteEndpoint: false,
    canManageUsers: false,
    canViewBilling: true,
    canEditSettings: false
  },
  viewer: {
    nav: ['overview', 'metrics', 'nodes'],
    canCreateEndpoint: false,
    canDeleteEndpoint: false,
    canManageUsers: false,
    canViewBilling: false,
    canEditSettings: false
  }
};

export const ALL_NAV_ITEMS: NavItem[] = [
  'overview',
  'endpoints',
  'rpc',
  'metrics',
  'nodes',
  'users',
  'billing',
  'settings'
];

export const ALL_ROLES: Role[] = ['admin', 'developer', 'billing', 'viewer'];
