FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages

RUN npm ci
RUN npm run build

CMD ["npm", "run", "start", "-w", "@scanmenu/api-gateway"]
