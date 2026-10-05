/** Who may create workspaces: only instance operators (the default — an installation run for others
 *  decides who gets a workspace), or every signed-in account. */
export type WorkspaceCreation = 'operator' | 'anyone';

/** Reads `UBOARD_WORKSPACE_CREATION`. Unset or empty means `operator`. Anything else fails startup —
 *  a mistyped value must not silently open workspace creation to everyone. */
export function workspaceCreationFromEnv(value: string | undefined): WorkspaceCreation {
  if (!value) return 'operator';
  if (value === 'operator' || value === 'anyone') return value;
  throw new Error(`UBOARD_WORKSPACE_CREATION must be "operator" or "anyone" (got "${value}")`);
}
