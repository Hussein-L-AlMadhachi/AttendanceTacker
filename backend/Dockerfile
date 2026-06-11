FROM node:20-alpine AS builder

ARG NODE_ENV=development

WORKDIR /app/backend

# Host/compose often sets NODE_ENV=production; that makes `npm ci` skip tooling.
ENV NODE_ENV=${NODE_ENV}

COPY backend/package*.json ./
RUN npm ci && test -x node_modules/.bin/tsc

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/cli ./cli

RUN node_modules/.bin/tsc

FROM node:20-alpine

ARG NODE_ENV=production

WORKDIR /app/backend

ENV NODE_ENV=${NODE_ENV}

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY .default_accounts.json /app/.default_accounts.json

EXPOSE 3001

CMD ["node", "dist/cli/container-start.js"]
