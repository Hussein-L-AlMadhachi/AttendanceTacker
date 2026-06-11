FROM node:20-alpine AS builder

ARG NODE_ENV=development

WORKDIR /app/backend

# Prod hosts often export NODE_ENV=production; keep full deps for the compile step.
ENV NODE_ENV=${NODE_ENV}

COPY backend/package.json ./
RUN npm install --prefer-offline --no-audit --no-fund

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/cli ./cli

# Invoke tsc via node — avoids relying on node_modules/.bin symlinks on some hosts.
RUN node ./node_modules/typescript/lib/tsc.js

FROM node:20-alpine

ARG NODE_ENV=production

WORKDIR /app/backend

ENV NODE_ENV=${NODE_ENV}

# Reuse built deps from the builder instead of running npm ci again on prod.
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY .default_accounts.json /app/.default_accounts.json

EXPOSE 3001

CMD ["node", "dist/cli/container-start.js"]
