import type { RequestHandler } from 'express';

/**
 * Express 4 does not forward a rejected promise returned by a route handler to the error
 * middleware — the rejection escapes as an unhandled promise rejection, which terminates the
 * process on Node >= 15. Wrapping an `async` handler in this adapter routes any rejection to
 * `next(err)` so the app's error middleware answers with 500 instead.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
