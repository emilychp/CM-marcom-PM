# Self-hosting image for the internal-network deployment (see deploy/README.md).
# Three stages: deps (install once, cached), builder (compile the app —
# also reused as-is by docker-compose's one-off `migrate` step, since it's
# the only stage with the Prisma CLI and full node_modules), runner (the
# small image that actually serves traffic).

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Only generates the Prisma client here — migrations run at container
# start (see docker-compose.yml's `migrate` service), not at image build
# time, since the database isn't reachable while building the image.
RUN npx prisma generate
RUN npx next build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
