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
# Create app directory and set permissions
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy necessary files
COPY --from=build /usr/src/app/next.config.ts ./
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/package.json ./
COPY --from=build --chown=nextjs:nodejs /usr/src/app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /usr/src/app/node_modules ./node_modules

# Set ownership for all files
RUN chown -R nextjs:nodejs ./

USER nextjs
EXPOSE 3000
ENV PORT 3000

# Run the application using next start
CMD ["npx", "next", "start"]