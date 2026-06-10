# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/ ./

# Compile TypeScript
RUN npm run build || tsc

# Production stage
FROM node:20-alpine

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled code from builder
COPY --from=builder /app/backend/dist ./dist

# Expose backend port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
