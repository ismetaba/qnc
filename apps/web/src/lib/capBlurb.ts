import type { Role } from '@qnc/shared';
import { ROLE_CAPS } from '@qnc/shared';

const CAP_LABEL: Record<keyof Omit<(typeof ROLE_CAPS)['admin'], 'nav'>, string> = {
  canCreateEndpoint: 'create endpoints',
  canDeleteEndpoint: 'delete endpoints',
  canManageUsers: 'manage users',
  canViewBilling: 'view billing',
  canEditSettings: 'edit settings'
};

export function capBlurb(role: Role): string {
  const cap = ROLE_CAPS[role];
  const granted: string[] = [];
  for (const key of Object.keys(CAP_LABEL) as Array<keyof typeof CAP_LABEL>) {
    if (cap[key]) granted.push(CAP_LABEL[key]);
  }
  if (granted.length === 0) return 'Read-only access to Overview, Metrics, Nodes.';
  if (granted.length === 1) return `Can ${granted[0]}.`;
  const head = granted.slice(0, -1).join(', ');
  const tail = granted[granted.length - 1];
  return `Can ${head}, and ${tail}.`;
}
