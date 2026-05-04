# Running Scan Menu

Scan Menu is designed to run locally with Docker Compose in the same shape used by Coolify.

## Required Environment

Create local environment values before running Docker:

```bash
POSTGRES_PASSWORD=change-me
AUTH_TOKEN_SECRET=change-me-to-a-long-random-secret
SESSION_SECRET=change-me-to-a-long-random-session-secret
PUBLIC_WEB_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=system@example.com
SMTP_PASSWORD=change-me
SMTP_FROM=Scan Menu <noreply@example.com>
```

For Coolify production, set `NEXT_PUBLIC_API_URL` to the public API domain, for example:

```bash
NEXT_PUBLIC_API_URL=https://api.scanmenu.your-ma.com
PUBLIC_WEB_URL=https://scanmenu.your-ma.com
PUBLIC_API_URL=https://api.scanmenu.your-ma.com
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

## Auth Flow

Registration stores the user with `emailVerified=false` and sends an email verification link. Login is blocked until the user opens `/verify-email?token=...`.

If SMTP is not configured in local development, the auth service logs the verification/reset URL to the terminal instead of sending email. In Coolify, set the real Hostinger SMTP variables in the service environment.

Password reset starts at `/reset-password`, sends a secure reset URL, and invalidates old sessions after the password changes.
