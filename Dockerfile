FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
COPY tsconfig.base.json ./

RUN npm install

# 🔥 هذا هو الحل المهم
RUN npm run build -w @scanmenu/shared
RUN npm run build -w @scanmenu/auth-service
RUN npm run build -w @scanmenu/restaurant-service
RUN npm run build -w @scanmenu/order-service
RUN npm run build -w @scanmenu/translation-service
RUN npm run build -w @scanmenu/api-gateway
RUN npm run build -w @scanmenu/web

CMD ["npm", "run", "start", "-w", "@scanmenu/api-gateway"]