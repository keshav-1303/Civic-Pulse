// Pure, dependency-free auth constants and permissions. Safe to import from
// client components, edge middleware and server code alike (no jose, no node APIs).

export type Role = "citizen" | "staff";

export interface SessionUser {
  sub: string;
  name: string;
  role: Role;
}

export interface Persona extends SessionUser {
  description: string;
}

export const COOKIE_NAME = "cp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Demo personas for one-click sign-in. In a real deployment these would come
 * from an identity provider (Google, OIDC) and a user database.
 */
export const PERSONAS: Persona[] = [
  { sub: "u_you", name: "You (Citizen)", role: "citizen", description: "Report issues, confirm others, track resolutions." },
  { sub: "u_staff", name: "Priya (Municipal Staff)", role: "staff", description: "Use the Co-pilot, dispatch crews, advance workflow." },
];

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.sub === id);
}

/** Can use the Municipal Co-pilot and view its action plan. */
export function canViewCopilot(role: Role | undefined): boolean {
  return role === "staff";
}

/** Can perform municipal operations: dispatch crews, advance issue status. */
export function canManageIssues(role: Role | undefined): boolean {
  return role === "staff";
}

export const ROLE_LABEL: Record<Role, string> = {
  citizen: "Citizen",
  staff: "Municipal Staff",
};
