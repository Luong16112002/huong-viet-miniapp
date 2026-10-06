FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY server ./server
COPY src ./src
COPY scripts/production-start.mjs ./scripts/production-start.mjs
ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
CMD ["node", "scripts/production-start.mjs"]
