FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx esbuild server/index.ts --bundle --platform=node --outfile=server.js

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server.js"]
