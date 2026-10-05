// A stand-in for the Sendway notification service the server sends email through, for e2e runs:
// it accepts `POST /messages/email` the way Sendway does and keeps what it was sent, which a spec
// reads back with `GET /messages?to=<address>` — the mailbox a person would read the email in.
import { createServer } from 'node:http';

const port = Number(process.env.MOCK_SENDWAY_PORT ?? 4011);
/** @type {Array<{ to: string[]; subject: string; body: string; idempotencyKey: string | undefined }>} */
const sent = [];

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'POST' && url.pathname === '/messages/email') {
    if (!req.headers['x-api-key']) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'missing api key' }));
      return;
    }
    const message = await readJson(req);
    sent.push({ ...message, idempotencyKey: req.headers['idempotency-key'] });
    res.statusCode = 202;
    res.end(JSON.stringify({ accepted: true }));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/messages') {
    const to = url.searchParams.get('to');
    res.end(JSON.stringify({ messages: sent.filter(m => !to || m.to.includes(to)) }));
    return;
  }
  // Playwright waits for the server by requesting its URL.
  if (req.method === 'GET' && url.pathname === '/') {
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
}).listen(port, '127.0.0.1');
