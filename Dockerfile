# Multi-stage build for db-tool-node CLI
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Add a non-root user
RUN adduser -D -u 1001 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Default command (can be overridden)
ENTRYPOINT ["node", "src/index.js"]
CMD ["--help"]
