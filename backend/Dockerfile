# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/cli ./cli

RUN npm run build
RUN test -f node_modules/express/index.js
RUN npm prune --omit=dev
RUN test -f node_modules/express/index.js

FROM node:20-alpine

WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist

RUN test -f node_modules/express/index.js

EXPOSE 3001

CMD ["node", "./dist/src/main.js"]
