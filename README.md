# Scan Menu

Scan Menu is a multilingual restaurant ordering platform. Customers order from the mobile app in their own language, while restaurants receive menu items, notes, and order updates in the restaurant's operating language.

## Product Surfaces

- `apps/web`: Next.js dashboard for platform admins, restaurant owners, accountants, and staff.
- `apps/mobile`: Expo React Native customer app.
- `services/api-gateway`: Public API edge for web and mobile clients.
- `services/auth-service`: Identity, accounts, roles, and tenants.
- `services/restaurant-service`: Restaurants, branches, menus, items, and staff membership.
- `services/order-service`: Carts, checkout, order lifecycle, and kitchen-facing order payloads.
- `services/translation-service`: Central language registry and translation workflow.
- `packages/shared`: Shared TypeScript types, language definitions, API helpers, and domain constants.

## Core Idea

Scan Menu separates user language from restaurant language:

1. A customer sees menus and submits notes in their preferred language.
2. Scan Menu stores canonical menu and order data with localized fields.
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
npm run dev:mobile
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

## Architecture

See [docs/architecture.md](docs/architecture.md).
