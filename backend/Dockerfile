FROM node:20-alpine

WORKDIR /app/backend


COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY backend/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
