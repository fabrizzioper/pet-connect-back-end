# Build stage
FROM node:20-alpine AS builder

# Install git
RUN apk add --no-cache git

WORKDIR /app

# Build argument for repository URL
ARG REPO_URL=https://github.com/fabrizzioper/pet-connect-back-end.git
ARG REPO_BRANCH=main

# Clone repository
RUN git clone --depth 1 --branch ${REPO_BRANCH} ${REPO_URL} repo

WORKDIR /app/repo

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files from builder
COPY --from=builder /app/repo/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/repo/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

# Start the application
CMD ["node", "dist/main"]

