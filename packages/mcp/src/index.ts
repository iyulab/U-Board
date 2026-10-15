#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { UBoardClient } from './client.js';
import { createServer } from './server.js';
import { BrowserLooker } from './look.js';

// Where the U-Board server is, and the workspace API token to reach it with (console → workspace settings → API 토큰).
const url = process.env.UBOARD_URL;
const token = process.env.UBOARD_TOKEN;
if (!url || !token) {
  console.error('u-board-mcp: set UBOARD_URL (the U-Board server, e.g. https://board.example.com) and UBOARD_TOKEN (a workspace API token, ubt_…)');
  process.exit(1);
}

await createServer(new UBoardClient(url, token), new BrowserLooker(url, token)).connect(new StdioServerTransport());
