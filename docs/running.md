# Running Scan Menu

Scan Menu is designed to run locally with Docker Compose in the same shape used by Coolify.

## Required Environment

Create local environment values before running Docker:

```bash
POSTGRES_PASSWORD=change-me
AUTH_TOKEN_SECRET=change-me-to-a-long-random-secret
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For Coolify production, set `NEXT_PUBLIC_API_URL` to the public API domain, for example:

```bash
NEXT_PUBLIC_API_URL=https://api.scanmenu.your-ma.com
```

Do not use internal Docker service names such as `http://api-gateway:4000` for `NEXT_PUBLIC_API_URL`, because browser code cannot reach Docker-only hostnames.

## Docker Local Development

Start the full stack:

```bash
npm run dev:docker
```

Stop the stack:

```bash
npm run dev:down
```

Check service health:

```bash
npm run health
```

## Local URLs

- Web: `http://localhost:3000`
- API Gateway: `http://localhost:4000/health`
- Auth service: `http://localhost:4101/health`
- Restaurant service: `http://localhost:4102/health`
- Order service: `http://localhost:4103/health`
- Translation service: `http://localhost:4104/health`

## Non-Docker Development

Use focused commands when working on one service:

```bash
npm run dev:web
npm run dev:gateway
npm run dev:auth
npm run dev:restaurants
npm run dev:orders
npm run dev:translations
npm run dev:mobile
```

Run verification:

```bash
npm run typecheck
npm test --workspaces --if-present
npm run build
```
