/**
 * Granular RBAC Scopes and Role Definitions for Saans.
 * Defined once as the single source of truth across Server and Web.
 */

export const PermissionScope = {
  READ: "READ",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  INVITE: "INVITE",
  REVOKE: "REVOKE",
  AUDIT: "AUDIT",
} as const;

export type PermissionScopeType = (typeof PermissionScope)[keyof typeof PermissionScope];

export const TenantType = {
  HOUSEHOLD: "HOUSEHOLD",
  COMMUNITY: "COMMUNITY",
} as const;

export type TenantTypeType = (typeof TenantType)[keyof typeof TenantType];

export const HouseholdRole = {
  OWNER: "OWNER",
  MEMBER: "MEMBER",
} as const;

export type HouseholdRoleType = (typeof HouseholdRole)[keyof typeof HouseholdRole];

export const CommunityRole = {
  COMMUNITY_ADMIN: "COMMUNITY_ADMIN",
  COMMUNITY_MEMBER: "COMMUNITY_MEMBER",
} as const;

export type CommunityRoleType = (typeof CommunityRole)[keyof typeof CommunityRole];

export const InvitationScope = {
  VIEW_PLAN: "VIEW_PLAN",
  LOG_ACTIONS: "LOG_ACTIONS",
  EDIT_PROFILE: "EDIT_PROFILE",
} as const;

export type InvitationScopeType = (typeof InvitationScope)[keyof typeof InvitationScope];

/**
 * Mapping of invitation scopes to effective permission scopes.
 */
export const INVITATION_SCOPE_MAP: Record<InvitationScopeType, PermissionScopeType> = {
  VIEW_PLAN: PermissionScope.READ,
  LOG_ACTIONS: PermissionScope.CREATE,
  EDIT_PROFILE: PermissionScope.UPDATE,
};

/**
 * Default scopes granted to household owners (all 7 scopes).
 */
export const HOUSEHOLD_OWNER_SCOPES: readonly PermissionScopeType[] = [
  PermissionScope.READ,
  PermissionScope.CREATE,
  PermissionScope.UPDATE,
  PermissionScope.DELETE,
  PermissionScope.INVITE,
  PermissionScope.REVOKE,
  PermissionScope.AUDIT,
] as const;

/**
 * Community admin scopes (aggregates only, no raw household data).
 */
export const COMMUNITY_ADMIN_SCOPES: readonly PermissionScopeType[] = [
  PermissionScope.READ,
  PermissionScope.CREATE,
  PermissionScope.UPDATE,
  PermissionScope.INVITE,
  PermissionScope.REVOKE,
  PermissionScope.AUDIT,
] as const;

/**
 * Community member scopes.
 */
export const COMMUNITY_MEMBER_SCOPES: readonly PermissionScopeType[] = [
  PermissionScope.READ,
  PermissionScope.CREATE,
] as const;
