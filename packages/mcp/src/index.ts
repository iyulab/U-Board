#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { UBoardClient } from './client.js';
import { DocumentStore } from './document-store.js';
import { createServer } from './server.js';
import { BrowserLooker } from './look.js';
import { startOf } from './start.js';

// Against a U-Board server — where it is, and the workspace API token to reach it with (console → workspace settings →
// API 토큰) — or on a board kept in a file (`--board <file>`), with no server.
// edit_text is offered; UBOARD_EDIT_TEXT=0 leaves it out (to measure an assistant with and without it)
const editText = process.env['UBOARD_EDIT_TEXT'] !== '0';
const start = startOf(process.argv.slice(2), process.env);
if (start.mode === 'refused') {
  console.error(start.message);
  process.exit(1);
}

if (start.mode === 'server') {
  await createServer(new UBoardClient(start.url, start.token), new BrowserLooker(start.url, start.token), { bundle: start.bundle === true, editText: editText }).connect(new StdioServerTransport());
} else {
  let store: DocumentStore;
  try {
    store = await DocumentStore.open(start.path, start.kind);
  } catch (error) {
    console.error(`u-board-mcp: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  // No picture of the board is drawn: there is no server page to draw it on, so `look` is not offered.
  await createServer(store, undefined, { bundle: start.bundle === true, editText }).connect(new StdioServerTransport());
}
