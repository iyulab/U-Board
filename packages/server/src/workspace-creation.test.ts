import { describe, it, expect } from 'vitest';
import { workspaceCreationFromEnv } from './workspace-creation.js';

describe('workspaceCreationFromEnv', () => {
  it('defaults to operators only when unset or empty', () => {
    expect(workspaceCreationFromEnv(undefined)).toBe('operator');
    expect(workspaceCreationFromEnv('')).toBe('operator');
  });

  it('accepts operator and anyone', () => {
    expect(workspaceCreationFromEnv('operator')).toBe('operator');
    expect(workspaceCreationFromEnv('anyone')).toBe('anyone');
  });

  it('fails startup on anything else rather than guessing', () => {
    expect(() => workspaceCreationFromEnv('everyone')).toThrow(/UBOARD_WORKSPACE_CREATION must be "operator" or "anyone"/);
  });
});
