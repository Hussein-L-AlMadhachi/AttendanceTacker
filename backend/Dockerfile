# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app/backend

# npm ci SKIPS devDependencies when NODE_ENV=production (often set on the host during build).
# Force a full install so typescript is available for the compile step.
ENV NODE_ENV=development

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/cli ./cli

RUN ./node_modules/.bin/tsc

RUN test -f node_modules/express/index.js
RUN node --input-type=module -e "import('express').then(m => { if (typeof m.default !== 'function') throw new Error('express broken'); console.log('express import OK'); })"

# Runtime image only needs production dependencies + compiled dist
RUN npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
