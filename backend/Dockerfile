# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app/backend

# Force a full install so typescript is available for the compile step.
ENV NODE_ENV=development

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/cli ./cli

RUN ./node_modules/.bin/tsc

# --- Runtime Stage ---
FROM node:20-alpine

WORKDIR /app/backend

ENV NODE_ENV=production

# Only install production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/backend/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
