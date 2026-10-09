# Build context is the repo root (npm workspace) — see .dockerignore there.
# One image serves the whole product from one origin: the API under /api, the share viewer under
# /share/ and the console at every other path (packages/server/src/web-apps.ts).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core packages/core
COPY packages/server packages/server
COPY packages/console packages/console
COPY packages/share packages/share
# Sample boards the console offers to start from — read as source by its build.
COPY packages/samples packages/samples
# The root postinstall builds the core library the other three compile against.
RUN npm ci
RUN npm run build --workspace=packages/console \
 && npm run build --workspace=packages/share \
 && npm run build --workspace=packages/server

FROM node:24-alpine
# Set by a release (scripts/release-image.mjs); a local build leaves them empty.
ARG VERSION=""
ARG REVISION=""
LABEL org.opencontainers.image.title="U-Board" \
      org.opencontainers.image.description="Spatial dashboards: a console, a read-only share viewer and their API in one image" \
      org.opencontainers.image.source="https://github.com/iyulab/U-Board" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}"
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/dist ./packages/server/dist
# The server finds these next to its own package and serves them (see src/index.ts).
COPY --from=build /app/packages/console/dist ./packages/console/dist
COPY --from=build /app/packages/share/dist ./packages/share/dist
EXPOSE 4000
CMD ["node", "packages/server/dist/index.js"]
