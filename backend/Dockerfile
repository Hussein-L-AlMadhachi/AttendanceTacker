FROM node:20-alpine AS builder

WORKDIR /app/backend

ENV NODE_ENV=development

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/cli ./cli

RUN npm run build

FROM node:20-alpine

WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY .default_accounts.json /app/.default_accounts.json

EXPOSE 3001

CMD ["node", "dist/cli/container-start.js"]
