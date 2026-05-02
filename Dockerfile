FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages
COPY tsconfig.base.json ./

RUN npm install
RUN npm run build

CMD ["npm", "run", "start"]