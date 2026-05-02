FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
COPY tsconfig.base.json ./

RUN npm install

# 🔥 هذا هو الحل المهم
RUN npm run build -w @menuza/shared
RUN npm run build -w @menuza/auth-service
RUN npm run build -w @menuza/restaurant-service
RUN npm run build -w @menuza/order-service
RUN npm run build -w @menuza/translation-service
RUN npm run build -w @menuza/api-gateway
RUN npm run build -w @menuza/web

CMD ["npm", "run", "start", "-w", "@menuza/api-gateway"]