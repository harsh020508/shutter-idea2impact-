# Shutter - B2B Retail Platform for Kirana Stores
# Multi-stage production Dockerfile

# Base stage
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./

# Install dependencies (no proxy configuration - use build args if needed)
RUN npm ci --prefer-offline --no-audit

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment-specific builds
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S shutter -u 1001

# Copy built assets
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

# Set ownership
RUN chown -R shutter:nodejs /app

USER shutter

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "dist/boot.js"]
