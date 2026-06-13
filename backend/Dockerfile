FROM node:20-alpine AS build

WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src
COPY backend/cli ./cli
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund \
    && test -f node_modules/express/index.js

COPY --from=build /app/backend/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
