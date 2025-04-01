# Phone Agent Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application (compiles TypeScript files)
RUN npm run build

# Expose the port the app runs on
EXPOSE 8787

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8787

# Use a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Command to run the application
CMD ["node", "scripts/minimal-server.js"]