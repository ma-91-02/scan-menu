# Babili

Babili is a multilingual, web-first restaurant ordering platform. Customers order from the customer web/PWA surface in their own language, while restaurants receive menu items, notes, and order updates in the restaurant's operating language.

## Product Surfaces

- `apps/web`: Next.js app for the platform admin, restaurant owner, staff, and customer web surfaces.
- `services/api-gateway`: Public API edge for web clients.
- `services/auth-service`: Identity, accounts, roles, and tenants.
- `services/restaurant-service`: Restaurants, branches, menus, items, and staff membership.
- `services/order-service`: Carts, checkout, order lifecycle, and kitchen-facing order payloads.
- `services/translation-service`: Central language registry and translation workflow.
- `packages/shared`: Shared TypeScript types, language definitions, API helpers, and domain constants.

## Core Idea

Babili separates user language from restaurant language:

1. A customer sees menus and submits notes in their preferred language.
2. Babili stores canonical menu and order data with localized fields.
3. The translation service converts customer-facing text into restaurant-facing language.
4. Restaurant staff receive the order in their configured language.

## Quick Start

Preferred local setup mirrors Coolify with Docker Compose:

```bash
npm install
npm run dev:docker
npm run health
```

Stop Docker services with:

```bash
npm run dev:down
```

For focused non-Docker development:

```bash
npm run dev:web
npm run dev:gateway
npm run dev:auth
npm run dev:restaurants
npm run dev:orders
npm run dev:translations
```

Common local URLs:

- Web dashboard: `http://localhost:3000`
- API gateway: `http://localhost:4000/health`
- Auth service: `http://localhost:4101/health`
- Restaurant service: `http://localhost:4102/health`
- Order service: `http://localhost:4103/health`
- Translation service: `http://localhost:4104/health`

If `3000` or `4000` are already used locally, run:

```bash
npm run dev:web -- -p 3001
API_GATEWAY_PORT=4001 npm run dev:gateway
```

See [docs/running.md](docs/running.md) for Docker, Coolify, environment variables, and health checks.

## Production Domains

- Platform Admin: `admin.babili.your-ma.com`
- Restaurant Owner Dashboard: `restaurant.babili.your-ma.com`
- Staff Platform: `staff.babili.your-ma.com`
- Customer Platform: `customer.babili.your-ma.com`
- API Gateway: `api.babili.your-ma.com`

## Architecture

See [docs/architecture.md](docs/architecture.md).
See [docs/platforms.md](docs/platforms.md) for the role-based surfaces and
[docs/domains.md](docs/domains.md) for domain and environment guidance.
See [docs/rebranding-migration.md](docs/rebranding-migration.md) for the
Babili rename and mobile workspace removal notes.
