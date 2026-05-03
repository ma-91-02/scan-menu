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

```bash
npm install
npm run dev
```

For the current local session, the working ports are:

- Web dashboard: `http://localhost:3001`
- API gateway: `http://localhost:4001`
- Expo Metro: `http://localhost:8081`

Use these environment variables when you want apps to talk to the local gateway:

```bash
WEB_PUBLIC_API_URL=http://localhost:4001
EXPO_PUBLIC_API_URL=http://localhost:4001
```

For focused development:

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
- API gateway: `http://localhost:4000`
- Auth service: `http://localhost:4101`
- Restaurant service: `http://localhost:4102`
- Order service: `http://localhost:4103`
- Translation service: `http://localhost:4104`

If `3000` or `4000` are already used locally, run:

```bash
npm run dev:web -- -p 3001
API_GATEWAY_PORT=4001 npm run dev:gateway
```

## Architecture

See [docs/architecture.md](docs/architecture.md).
