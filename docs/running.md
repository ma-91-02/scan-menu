# Running Babili Locally

Babili uses the existing `@babili/*` package names internally. The local
development setup is separate from the production/Coolify Docker Compose setup
so code changes can appear without rebuilding production images.

## Development vs Production

- Development uses `docker-compose.dev.yml`, `Dockerfile.dev`, `next dev`, and
  `tsx watch`.
- Production/Coolify still uses `docker-compose.yml`, `Dockerfile`, built
  workspaces, and `npm run start`.
- Do not use internal Docker hostnames in browser variables. Browser-facing API
  URLs should stay public/local, for example `http://localhost:4000`.

## Required Local Environment

The dev compose file has safe local defaults. Override these in `.env.local` or
your shell when needed:

```bash
POSTGRES_PASSWORD=babili_dev_password
AUTH_TOKEN_SECRET=dev-auth-token-secret-change-me
SESSION_SECRET=dev-session-secret-change-me
PUBLIC_WEB_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=system@example.com
SMTP_PASSWORD=change-me
SMTP_FROM=Babili <noreply@example.com>
```

For Coolify production, set real values in Coolify environment variables:

```bash
NEXT_PUBLIC_API_URL=https://api.babili.your-ma.com
PUBLIC_WEB_URL=https://admin.babili.your-ma.com
PUBLIC_API_URL=https://api.babili.your-ma.com
```

## Full Docker Development With Hot Reload

Start the full development stack:

```bash
npm run dev:docker
```

Stop the development stack:

```bash
npm run dev:docker:down
```

This runs:

- Web with `next dev` on `http://localhost:3000`
- API Gateway with `tsx watch` on `http://localhost:4000`
- Auth service with `tsx watch` on `http://localhost:4101`
- Restaurant service with `tsx watch` on `http://localhost:4102`
- Order service with `tsx watch` on `http://localhost:4103`
- Translation service with `tsx watch` on `http://localhost:4104`
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Source files are mounted into the containers, and `node_modules` is kept in a
named Docker volume. This avoids reinstalling dependencies on every container
restart.

## Hybrid Development

If you prefer faster frontend iteration on the host machine, start only
PostgreSQL and Redis with Docker, then run services locally:

```bash
docker compose -f docker-compose.dev.yml up postgres redis
npm run dev:services
npm run dev:web
```

Use separate terminals for `dev:services` and `dev:web`. The services run in
watch mode, and the web app runs in Next.js dev mode.

## Focused Commands

Run one area at a time:

```bash
npm run dev:web
npm run dev:shared
npm run dev:gateway
npm run dev:auth
npm run dev:restaurants
npm run dev:orders
npm run dev:translations
```

Babili is web-first in this phase. The former mobile workspace was removed;
customer ordering now lives in the customer web surface and can become a PWA
without adding a separate native app.

## Health Check

After starting the dev stack, verify everything:

```bash
npm run health
```

The health check covers:

- Web
- API Gateway
- Auth service
- Restaurant service
- Order service
- Translation service
- PostgreSQL TCP connection
- Redis TCP connection

## When Restart Is Still Needed

Hot reload handles regular changes in `apps/web`, `services/*/src`, and
`packages/shared/src`.

Restart the relevant process or container when you change:

- `package.json` or `package-lock.json`
- Dockerfiles or compose files
- Environment variables
- Ports
- Node version
- Database schema or persistent seed behavior

Use production compose only when validating Coolify-like behavior:

```bash
npm run prod:docker
npm run prod:down
```

## Verification Before Push

Run the normal checks before pushing:

```bash
npm run typecheck -w @babili/web
npm run build -w @babili/shared
npm run build -w @babili/web
npm run build -w @babili/translation-service
npm test --workspaces --if-present
```
