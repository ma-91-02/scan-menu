FROM node:22-alpine

WORKDIR /app

ARG COOLIFY_FQDN
ARG REDIS_PASSWORD
ARG POSTGRES_PASSWORD
ARG SERVICE_URL_WEB
ARG SERVICE_FQDN_WEB
ARG SERVICE_URL_API_GATEWAY
ARG SERVICE_FQDN_API_GATEWAY
ARG COOLIFY_BUILD_SECRETS_HASH
ARG SERVICE_WORKSPACE
ARG NEXT_PUBLIC_API_URL
ARG WEB_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV WEB_PUBLIC_API_URL=${WEB_PUBLIC_API_URL}

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages

RUN npm ci
RUN npm run build -w @scanmenu/shared
RUN if [ -n "$SERVICE_WORKSPACE" ]; then npm run build -w "$SERVICE_WORKSPACE"; else npm run build; fi

CMD ["npm", "run", "start", "-w", "@scanmenu/api-gateway"]
