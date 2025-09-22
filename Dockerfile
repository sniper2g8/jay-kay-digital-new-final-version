# syntax=docker/dockerfile:1

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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Runner Stage ----
FROM base AS runner
COPY --from=build /usr/src/app/next.config.ts ./
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/.next/standalone ./
COPY --from=build /usr/src/app/.next/static ./.next/static

USER node
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
