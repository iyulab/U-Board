/**
 * A path parameter by name, for code Express's route-string typing can't see through: shared
 * middleware, and routers mounted with `mergeParams` whose `:workspaceId` lives in the parent
 * mount path. A route's own parameters need none of this — `router.get('/:boardId', …)` already
 * types `req.params.boardId` as a string.
 *
 * Express types such a parameter as `string | string[]` (an array only for a `*wildcard`, which
 * no route here declares), so anything but a string here is a routing mistake, not client input.
 */
export function pathParam(req: { params: unknown }, name: string): string {
  const value = (req.params as Record<string, unknown>)[name];
  if (typeof value !== 'string') {
    throw new Error(`route has no :${name} path parameter`);
  }
  return value;
}
