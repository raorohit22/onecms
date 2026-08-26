# ==============================================================================
# oneCMS API — Multi-stage Docker Build
#
# This Dockerfile is designed for a pnpm monorepo. The build context MUST be
# the repository root (not apps/api/), so that workspace packages like
# @onecms/db and @onecms/env are available during install and build.
#
# Build from repo root:
#   docker build -f apps/api/Dockerfile -t onecms-api .
#
# Architecture:
#   Stage 1 (deps)    — Install all workspace dependencies
#   Stage 2 (builder) — Compile TypeScript, resolve path aliases
#   Stage 3 (runner)  — Production-only image with compiled JS
# ==============================================================================

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps

# Install build tools for native addons (redis-memory-server uses make)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# pnpm is shipped via corepack in Node 22+
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace root manifests first for layer caching.
# Only re-installs when lock file or workspace structure changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy only the package.json of each workspace package the API needs.
# This ensures Docker layer cache is busted ONLY when dependencies change.
COPY apps/api/package.json                    ./apps/api/
COPY packages/db/package.json                 ./packages/db/
COPY packages/env/package.json                ./packages/env/
COPY packages/typescript-config/package.json  ./packages/typescript-config/
COPY packages/eslint-config/package.json      ./packages/eslint-config/

# Install all dependencies (dev included — needed for tsc build step).
RUN pnpm install --frozen-lockfile


# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM deps AS builder

WORKDIR /app

# Copy all source code. The .dockerignore file excludes node_modules,
# test directories, and other non-essential files from the build context.
COPY . .

# Build the API and its workspace dependencies using Turborepo.
# --filter=@onecms/api... builds the API and all its transitive deps.
RUN pnpm turbo run build --filter=@onecms/api...


# ── Stage 3: Production runner ───────────────────────────────────────────────
FROM node:22-slim AS runner

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Run as non-root for security
RUN groupadd --system --gid 1001 onecms && \
    useradd --system --uid 1001 --gid 1001 onecms

WORKDIR /app

# Copy workspace root config needed for pnpm to resolve workspace packages.
COPY --from=builder /app/pnpm-lock.yaml       ./
COPY --from=builder /app/pnpm-workspace.yaml   ./
COPY --from=builder /app/package.json          ./
COPY --from=builder /app/.npmrc                ./

# Copy API built output and its package.json
COPY --from=builder /app/apps/api/dist         ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy workspace packages that the API imports at runtime.
# These are raw TypeScript packages consumed via workspace: protocol.
# pnpm install --prod in the monorepo root wires them correctly.
COPY --from=builder /app/packages/db/src       ./packages/db/src
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/tsconfig.json ./packages/db/

COPY --from=builder /app/packages/env/src      ./packages/env/src
COPY --from=builder /app/packages/env/package.json ./packages/env/

COPY --from=builder /app/packages/typescript-config/ ./packages/typescript-config/

# Install production dependencies only.
# pnpm resolves workspace:* links correctly within the monorepo layout.
RUN pnpm install --frozen-lockfile --prod

# The API compiled output uses require("@onecms/db") etc., which pnpm
# resolves through the workspace symlinks created above.

USER onecms

EXPOSE 3001

# Health check — assumes the API has a /health or root endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
