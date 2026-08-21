import { vi } from 'vitest';

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = 'ApiError';
  }
}

export const signup = vi.fn();
export const login = vi.fn();
export const logout = vi.fn();
export const getBootstrapStatus = vi.fn();
export const getSession = vi.fn();
export const getInvitation = vi.fn();
export const acceptInvitation = vi.fn();
export const listMembers = vi.fn();
export const inviteMember = vi.fn();
export const switchWorkspace = vi.fn();
export const listBoards = vi.fn();
export const createBoard = vi.fn();
export const getBoard = vi.fn();
export const updateBoard = vi.fn();
export const deleteBoard = vi.fn();
export const listConnectors = vi.fn();
export const createConnector = vi.fn();
export const updateConnector = vi.fn();
export const deleteConnector = vi.fn();
export const resolveConnector = vi.fn();
export const listShareTokens = vi.fn();
export const createShareToken = vi.fn();
export const deleteShareToken = vi.fn();
