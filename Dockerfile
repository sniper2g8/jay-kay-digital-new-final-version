ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.17.1

# ---- Base Stage ----
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /usr/src/app

# ---- Build Stage ----
FROM base AS build
# Copy package files first
COPY package.json pnpm-lock.yaml* ./
# Install dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# Copy source code
COPY . .
# Build the application
RUN pnpm build

# ---- Runner Stage ----
FROM base AS runner
COPY --from=build /usr/src/app/next.config.ts ./
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/.next/standalone ./
COPY --from=build /usr/src/app/.next/static ./.next/static

# Install node_modules for runtime dependencies
COPY --from=build /usr/src/app/node_modules ./node_modules

USER node
EXPOSE 3000
ENV PORT 3000

# Run the application.
CMD ["pnpm", "start"]