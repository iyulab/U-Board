// A list rendered with a missing or repeated key works in a test and misbehaves in use: React keeps the wrong
// component's state, or drops a child. React only says so on the console, which a passing test never shows — so a
// test that makes React say it fails.
import { afterEach } from 'vitest';

const KEY_WARNINGS = [/Encountered two children with the same key/, /Each child in a list should have a unique "key" prop/];

const said: string[] = [];
const error = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const text = args.map(String).join(' ');
  if (KEY_WARNINGS.some(warning => warning.test(text))) said.push(text.slice(0, 300));
  error(...args);
};

afterEach(() => {
  if (said.length === 0) return;
  const found = said.splice(0);
  throw new Error(`React warned about list keys during this test:\n${found.join('\n')}`);
});
