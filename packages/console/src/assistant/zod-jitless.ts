import { config } from 'zod';

// The console runs under `script-src 'self'`: zod's fast parsers are compiled with `new Function`, and even its check
// for whether it may (a `Function('')` in a try) is reported as a CSP violation. Its plain parsers do the same work.
// Imported before the board tools, whose schemas are zod's.
config({ jitless: true });
