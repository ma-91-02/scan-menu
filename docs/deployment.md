# Babili Coolify Deployment

Babili production deployment stays Docker Compose based and Coolify friendly.
Development hot reload files are intentionally separate:

- Production: `Dockerfile` and `docker-compose.yml`
- Development: `Dockerfile.dev` and `docker-compose.dev.yml`

## Public Entry Points

- Web surfaces:
  - `https://admin.babili.your-ma.com`
  - `https://restaurant.babili.your-ma.com`
  - `https://staff.babili.your-ma.com`
  - `https://customer.babili.your-ma.com`
- API:
  - `https://api.babili.your-ma.com`

Only API Gateway should be public for backend traffic. Internal services stay
reachable only by Docker service name:

- `http://auth-service:4101`
- `http://restaurant-service:4102`
- `http://order-service:4103`
- `http://translation-service:4104`

## Required Coolify Environment

Set these production values in Coolify:

```bash
NEXT_PUBLIC_API_URL=https://api.babili.your-ma.com
PUBLIC_API_URL=https://api.babili.your-ma.com
PUBLIC_WEB_URL=https://admin.babili.your-ma.com
AUTH_TOKEN_SECRET=<strong-secret>
SESSION_SECRET=<strong-secret>
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password-if-used>
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@your-ma.com
SMTP_PASSWORD=<mailbox-password>
SMTP_FROM=Babili <noreply@your-ma.com>
```

Coolify may also provide:

```bash
SERVICE_URL_WEB
SERVICE_FQDN_WEB
SERVICE_URL_API_GATEWAY
SERVICE_FQDN_API_GATEWAY
```

Those should resolve to the Babili web and API domains.

## Production Safety Rules

- Do not expose internal services publicly.
- Do not use `docker-compose.dev.yml` in production.
- Do not rename existing database tables or Docker volumes after production data exists without a backup and migration.
- Keep API Gateway as the public backend entry point.

## Verification

After deployment:

```bash
npm run health
```

For remote production health, pass URLs explicitly:

```bash
BABILI_WEB_URL=https://admin.babili.your-ma.com \
BABILI_API_URL=https://api.babili.your-ma.com/health \
npm run health
```
