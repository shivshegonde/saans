# Multi-stage Dockerfile for Saans (Cloud Run)
# Stage 1: Build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy root configs and package definitions
COPY package*.json tsconfig.base.json .eslintrc.json .prettierrc ./
COPY shared/package*.json ./shared/
COPY shared/tsconfig*.json ./shared/
COPY server/package*.json ./server/
COPY server/tsconfig*.json ./server/
COPY web/package*.json ./web/
COPY web/tsconfig*.json ./web/

# Install dependencies
RUN npm ci

# Copy sources
COPY shared/ ./shared/
COPY server/ ./server/
COPY web/ ./web/
COPY docs/ ./docs/

# Build packages in dependency order
RUN npm run build --workspace=shared && npm run build --workspace=server && npm run build --workspace=web

# Stage 2: Production runtime
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy root package and workspace definitions
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY web/package*.json ./web/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/scripts ./server/scripts
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/docs ./docs

# Non-root user for security compliance
USER node

EXPOSE 8080

CMD ["node", "server/dist/src/server.js"]
