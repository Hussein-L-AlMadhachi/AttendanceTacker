# Backend Dockerfile — single stage, deps installed only inside the image
FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/cli ./cli

RUN npm run build

# Fail the image build if express is broken (catches prod issues before deploy)
RUN test -f node_modules/express/index.js
RUN node --input-type=module -e "import('express').then(m => { if (typeof m.default !== 'function') throw new Error('express broken'); console.log('express import OK'); })"

ENV NODE_ENV=production

EXPOSE 3001

# Direct node — NOT npm start (so logs prove this image is current)
CMD ["node", "dist/src/main.js"]
