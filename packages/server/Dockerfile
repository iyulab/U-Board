# Build context is the repo root (npm workspace) — see .dockerignore there.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/console/package.json packages/console/package.json
COPY packages/share/package.json packages/share/package.json
COPY packages/core packages/core
COPY packages/server packages/server
RUN npm ci
RUN npm run build --workspace=packages/server

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/server/package.json ./packages/server/package.json
COPY --from=build /app/packages/server/dist ./packages/server/dist
EXPOSE 4000
CMD ["node", "packages/server/dist/index.js"]
