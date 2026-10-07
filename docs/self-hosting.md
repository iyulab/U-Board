# Running U-Board

The server's container image is the whole product: one process on one origin serves the API under
`/api`, the read-only share viewer under `/share/`, and the console at every other path. A hosted
installation and a self-hosted one run the same image.

## Get the image

Each release — listed on the repository's GitHub Releases page, tagged `v<version>` — publishes the
image for `linux/amd64` as `ghcr.io/iyulab/u-board:<version>`, and moves `<major>.<minor>` and
`latest` onto it:

```sh
docker pull ghcr.io/iyulab/u-board:<version>
```

Name an exact version rather than `latest`, so the installation changes only when you upgrade it.
That version is the product's own, apart from the `@iyulab/u-board` library's: an operator sees it on
the console's installation page (`GET /api/instance`), the server logs it when it starts
(`U-Board 0.1.0 listening on :4000 …`), and the image carries it as a label
(`docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.version" }}' <image>`).

To build the image from a checkout instead — the build context is the repository root, an npm
workspace — run `docker build -f packages/server/Dockerfile -t u-board .` and use `u-board` where
the commands below name the published image.

## Run it

```sh
docker run -d --name u-board -p 4000:4000 \
  -e UBOARD_DATABASE_URL='postgres://u_board:<password>@db.example.com:5432/u_board?sslmode=verify-full' \
  -e UBOARD_SESSION_SECRET='<a long random string>'   -e UBOARD_SECRETS_KEY='<another long random string>' \
  ghcr.io/iyulab/u-board:<version>
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
removed, role changes, invitations sent, resent or cancelled, boards created or deleted, share
links made or deleted (by their visible ending, never the link itself), and connectors created,
changed (which settings — name, address, credentials — never their values) or deleted are read by that workspace's owners
on the console's settings page (`GET /api/workspaces/:id/audit`); workspaces created, operators
designated, accounts deleted, and an operator joining a workspace as an owner are read by operators
on the installation page (`GET /api/instance/audit`) — the
last one also shows in that workspace's own record, so its owners see who was let in. Records name
people by their current account; deleting an account leaves its records in place with no name or
address. Records older than `UBOARD_AUDIT_RETENTION_DAYS` are deleted.

## Settings

| Variable | Required | What it does |
|---|---|---|
| `UBOARD_DATABASE_URL` | yes | A `postgres://` or `postgresql://` URL for a PostgreSQL database the server owns — it creates and upgrades its tables on start. Say `sslmode=verify-full` explicitly for a TLS connection that checks the certificate. Anything else is a directory path for an embedded PostgreSQL (PGlite) — enough for a trial or a small single-machine installation; put it on a volume (`-v u-board-data:/data -e UBOARD_DATABASE_URL=/data/u-board`). |
| `UBOARD_SESSION_SECRET` | yes | Signs session cookies; at least 16 characters. Changing it signs everyone out. |
| `UBOARD_SECRETS_KEY` | yes | Seals connector credentials in the database (AES-256-GCM), so a copy of the database does not hand them out; at least 32 characters (`openssl rand -base64 32`). Keep it apart from the session secret and from backups. The server seals credentials stored before it was set when it starts, and refuses to start with a key other than the one they were sealed with. A lost key leaves the credentials unreadable: clear them (`UPDATE connectors SET auth_value = NULL`) and have owners enter them again. |
| `PORT` | no | Port to listen on (default `4000`). |
| `UBOARD_STALE_MAX_AGE_SECONDS` | no | How old a connector's last value may be and still be shown as stale when the data source stops answering. Past it, the binding shows as disconnected. Unset: no limit — the value is shown however old, with its age. |
| `UBOARD_SHARE_FRAME_ANCESTORS` | no | Which pages may embed a share link in a frame, as a CSP `frame-ancestors` source list. Default `https:` (any page served over HTTPS). An intranet page served over plain HTTP needs to be named, e.g. `http://hmi.example.com https:`. |
| `UBOARD_WORKSPACE_CREATION` | no | Who may create workspaces: `operator` (default — the installation's operator only) or `anyone` (every signed-in account). Any other value stops the server from starting. |
| `UBOARD_CONNECTOR_ADDRESSES` | no | Which addresses connectors may reach — the data sources they read and their OAuth token endpoints. `private` (default): public addresses and private networks (10/8, 172.16/12, 192.168/16, 100.64/10, 198.18/15, IPv6 unique local), where an installation's own systems usually are. `public`: public addresses only — set it when workspace owners are not trusted with the network the server runs in, as on an installation run for others. `any`: no restriction. Under every setting but `any`, the server's own loopback and link-local addresses and the cloud host services a server can reach (instance metadata services, Azure's host endpoint) are refused, checked on the address a connection is actually made to. |
| `UBOARD_AUDIT_RETENTION_DAYS` | no | Days the record of membership, role and invitation changes is kept (default `180`); older records are deleted daily and when the server starts. Any value other than a whole number from 1 stops the server from starting. |
| `UBOARD_PUBLIC_URL` | no | The address people open the console at, as an origin (`https://board.example.com`). Links in invitation emails point here; it is set rather than taken from the request so that whoever sends an invitation cannot choose where its link leads. Unset: invitations are not emailed. |
| `SENDWAY_API_KEY`, `SENDWAY_BASE_URL` | no | Email delivery (password-reset codes, invitations) through Sendway: the tenant key and the origin of the Sendway deployment. Set both or neither — the server refuses to start with only one. Unset: no email (see below). |
| `UBOARD_TRUST_CF_PROXY` | no | `true` only when every request reaches the server through Cloudflare (the ingress refuses anything else): sign-in rate limiting then keys on the visitor address Cloudflare reports. |

Password-reset codes are delivered by email when an email provider is configured (`SENDWAY_*`
above). Without one, the server writes the code to its log
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

After deploying, `npm run smoke -- https://board.example.com` (from a checkout of this repository)
checks the installation from the outside: health, the API refusing a request without a session,
the console and share viewer served with their security headers, and a missing build file
answering 404. It only reads public paths.

## Share links

A share link (`https://<host>/share/?board=…&token=…`) opens one board read-only, without signing
in, until it is revoked or reaches the expiry its owner chose. Embed it in another application's
page with an `<iframe>`; `UBOARD_SHARE_FRAME_ANCESTORS` decides which pages may.

An open board keeps itself current: every 30 seconds it asks for all of its values in one request,
and a link that expires while it is open turns into an expiry notice. Many screens showing the same
board do not multiply the load on a data source — the server answers requests for the same source
URL from one read for 10 seconds, and forgets it as soon as the connector's settings change. If the
share path sits behind a per-address rate limit, allow for one request per open screen every 30
seconds, plus one when it opens or is shown again — screens behind one network address all count
against that address.

An open board's ages ("updated 2 minutes ago") are measured against the server's clock, read from
its responses, so a display's own clock does not need to be set exactly.

## Networks without internet access

The server reaches out only to what an installation sets up: the data sources its connectors read
and their OAuth token endpoints, and Sendway when `SENDWAY_*` is set. The console and the share
viewer load nothing from other origins — no fonts, scripts or stylesheets from a CDN — so an
installation runs on a closed network. The one exception is a board's background image, which a
page shows from the address its author gave; on a closed network, give it one that is reachable
there.

Getting the image is the one step that needs a connection, and a release covers it: each one
carries the image as an archive, `u-board-<version>-linux-amd64.tar.gz`, with its SHA-256 beside it.
Download both on a connected machine, carry them over, and on the installation's host:

```sh
sha256sum -c u-board-<version>-linux-amd64.tar.gz.sha256
docker load -i u-board-<version>-linux-amd64.tar.gz   # ghcr.io/iyulab/u-board:<version>
```

An image you built yourself carries over the same way: `docker save u-board -o u-board.tar` on the
connected machine, `docker load -i u-board.tar` on the host.

## Stopping

`docker stop`, or a platform stopping the container, sends `SIGTERM` (`SIGINT` too): the server stops
taking connections, gives requests under way up to 8 seconds to finish, closes its database and
exits.

## Backup and restore

Everything an installation keeps is in its database: accounts, workspaces and their members, boards,
connectors with their credentials, share links, and the activity record. Connector credentials are
sealed with `UBOARD_SECRETS_KEY`, so a backup does not hand them out — and is restored with that
same key, which belongs in a different place from the backup. Restored with a different
`UBOARD_SESSION_SECRET`, an installation works but signs everyone out.

With PostgreSQL, use its own tools — `pg_dump` while the server runs, and restore into an empty
database before the server first starts on it.

With the embedded database, stop the server and copy its directory; a copy taken while it runs may
catch a write half-done. The image itself has `tar`, so no other image is needed:

```sh
docker stop u-board
docker run --rm -v u-board-data:/data -v "$PWD":/backup --entrypoint tar ghcr.io/iyulab/u-board:<version> czf /backup/u-board-data.tgz -C /data .
docker start u-board
```

To restore, unpack the archive into an empty volume and start the server on it:

```sh
docker run --rm -v u-board-restored:/data -v "$PWD":/backup --entrypoint tar ghcr.io/iyulab/u-board:<version> xzf /backup/u-board-data.tgz -C /data
```

## Upgrading

Back up first. Then get the new version's image (`docker pull`, or its release archive on a closed
network), stop the old container and start one from the new image with the same settings: the
server brings its database tables up to date when it starts. A release's notes link to this page as
it stood at that version. Those steps are
cumulative, so a newer image can start on a database from any older one — versions can be skipped.

An upgrade is not undone by starting the older image again: the tables it changed stay changed, and
the older server is not built to read them. To go back, restore the backup taken before the
upgrade.
