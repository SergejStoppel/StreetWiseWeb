# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean install production dependencies only
RUN rm -rf node_modules && npm ci --omit=dev

# Production stage
FROM node:18-alpine AS production

# Install production dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown nextjs:nodejs logs

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the application
CMD ["node", "dist/server.js"]