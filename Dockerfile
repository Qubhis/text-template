# Use Node.js 22.17 Alpine for smaller image size
FROM node:22.17.0-alpine

# Set working directory
WORKDIR /app

# Create app user for security (don't run as root)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S texttemplate -u 1001

# Copy package files
COPY package*.json ./
COPY tsconfig.*.json ./
COPY vite.config.js ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Create data directory and set permissions
RUN mkdir -p /app/data && \
    chown -R texttemplate:nodejs /app

# Switch to non-root user
USER texttemplate

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3010/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["npm", "run", "start:prod"]