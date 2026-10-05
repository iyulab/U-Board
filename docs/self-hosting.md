# Running U-Board

The server's container image is the whole product: one process on one origin serves the API under
`/api`, the read-only share viewer under `/share/`, and the console at every other path. A hosted
installation and a self-hosted one run the same image.

## Build the image

From the repository root (the build context is the npm workspace):

```sh
docker build -f packages/server/Dockerfile -t u-board .
```

## Run it

```sh
docker run -d --name u-board -p 4000:4000 \
  -e UBOARD_DATABASE_URL='postgres://u_board:<password>@db.example.com:5432/u_board?sslmode=verify-full' \
  -e UBOARD_SESSION_SECRET='<a long random string>' \
  u-board
```

Open `http://<host>:4000/`. **The first account to sign up runs the installation**: it becomes its
operator and the owner of a workspace named "Default". Every later account joins through an
invitation an owner sends from the console, so sign up yourself before you hand the address to anyone
else. Only an operator creates workspaces — on an installation that serves several organizations,
each gets its own workspace from the operator, who invites its administrator as an owner and can then
leave it. Set `UBOARD_WORKSPACE_CREATION=anyone` to let every account create workspaces.

An operator's console has an installation page that lists every workspace — its owners and member
count, not its contents — and every account. There an operator makes other accounts operators (the
installation always keeps at least one) and can join any workspace as an owner, which is how a
workspace whose owners have all gone is recovered; the operator then shows in its member list.

Owners change members' roles, remove members, and resend or cancel invitations that have not been
accepted (resending renews the link's week of validity);
any member can leave a workspace. A workspace always keeps at least one owner — to hand one over,
invite the new owner with the `owner` role and leave once they have joined.

The server records who changed what, and when: a workspace's members joining, leaving or being
removed, role changes, and invitations sent, resent or cancelled are read by that workspace's owners
(`GET /api/workspaces/:id/audit`); workspaces created, operators designated, accounts deleted, and an
operator joining a workspace as an owner are read by operators (`GET /api/instance/audit`) — the
last one also shows in that workspace's own record, so its owners see who was let in. Records name
people by their current account; deleting an account leaves its records in place with no name or
address. Records older than `UBOARD_AUDIT_RETENTION_DAYS` are deleted.

## Settings

| Variable | Required | What it does |
|---|---|---|
| `UBOARD_DATABASE_URL` | yes | A `postgres://` or `postgresql://` URL for a PostgreSQL database the server owns — it creates and upgrades its tables on start. Say `sslmode=verify-full` explicitly for a TLS connection that checks the certificate. Anything else is a directory path for an embedded PostgreSQL (PGlite) — enough for a trial or a small single-machine installation; put it on a volume (`-v u-board-data:/data -e UBOARD_DATABASE_URL=/data/u-board`). |
| `UBOARD_SESSION_SECRET` | yes | Signs session cookies; at least 16 characters. Changing it signs everyone out. |
| `PORT` | no | Port to listen on (default `4000`). |
| `UBOARD_STALE_MAX_AGE_SECONDS` | no | How old a connector's last value may be and still be shown as stale when the data source stops answering. Past it, the binding shows as disconnected. Unset: no limit — the value is shown however old, with its age. |
| `UBOARD_SHARE_FRAME_ANCESTORS` | no | Which pages may embed a share link in a frame, as a CSP `frame-ancestors` source list. Default `https:` (any page served over HTTPS). An intranet page served over plain HTTP needs to be named, e.g. `http://hmi.example.com https:`. |
| `UBOARD_CORS_ORIGINS` | no | Only when the console or share viewer is hosted on another origin than this server: a comma-separated list of those origins. Not needed for the image as built. |
| `UBOARD_WORKSPACE_CREATION` | no | Who may create workspaces: `operator` (default — the installation's operator only) or `anyone` (every signed-in account). Any other value stops the server from starting. |
| `UBOARD_AUDIT_RETENTION_DAYS` | no | Days the record of membership, role and invitation changes is kept (default `180`); older records are deleted daily and when the server starts. Any value other than a whole number from 1 stops the server from starting. |
| `UBOARD_PUBLIC_URL` | no | The address people open the console at, as an origin (`https://board.example.com`). Links in invitation emails point here; it is set rather than taken from the request so that whoever sends an invitation cannot choose where its link leads. Unset: invitations are not emailed. |
| `UBOARD_TRUST_CF_PROXY` | no | `true` only when every request reaches the server through Cloudflare (the ingress refuses anything else): sign-in rate limiting then keys on the visitor address Cloudflare reports. |

Password-reset codes are delivered by email when an email provider is configured (see
`packages/server/.env.example`). Without one, the server writes the code to its log
(`[auth] no email provider configured — …`), and an administrator passes it on. Invitations are
emailed when both an email provider and `UBOARD_PUBLIC_URL` are set, and then the link goes to the
invited mailbox only — whoever accepts it proves they read that mailbox. Without email, the console
shows the owner the link to pass on another way. Emails are written in Korean, the console's
language, and state times in UTC. Passwords are at least 8 characters and at most
72 bytes. Each account changes its own name and password on the console's account page; a password
change or reset signs out every other session of that account. Deleting an account there erases
its name, email, password and memberships; the boards, share links and invitations it made stay
with their workspaces. It is refused while the account is the last operator or the only owner of a
workspace — hand those over first.

## HTTPS

Terminate TLS in front of the server (a reverse proxy or the platform's ingress) and forward the
original scheme in `X-Forwarded-Proto`:

```nginx
location / {
  proxy_pass http://127.0.0.1:4000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

The session cookie is marked `Secure` exactly when the browser reached the server over HTTPS, so
the same image also works over plain HTTP on a closed network — without TLS, though, sign-in
credentials and session cookies cross that network unencrypted.

## Health

`GET /health` answers `200 {"status":"ok"}` once the server can reach its database, and `503`
otherwise — use it for liveness and readiness probes.

## Share links

A share link (`https://<host>/share/?board=…&token=…`) opens one board read-only, without signing
in, until it is revoked or reaches the expiry its owner chose. Embed it in another application's
page with an `<iframe>`; `UBOARD_SHARE_FRAME_ANCESTORS` decides which pages may.

## Upgrading

Stop the old container and start one from the new image with the same settings. The server brings
its database tables up to date when it starts.
