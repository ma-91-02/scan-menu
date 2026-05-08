# Babili Platforms

Babili currently uses a single Next.js web app for all browser-facing surfaces.
The domains are separated by product role, while the internal app routes remain
simple and stable.

## Platform Admin

- Domain: `admin.babili.your-ma.com`
- Route: `/admin`
- Audience: platform owner and platform operations team
- Responsibilities:
  - global statistics
  - restaurants
  - users
  - plans
  - countries and currencies
  - payment gateways by country
  - translation oversight
  - system health

Platform roles:

- `platform_owner`
- `platform_admin`
- `support_agent`
- `finance_admin`
- `translation_manager`

## Restaurant Owner Dashboard

- Domain: `restaurant.babili.your-ma.com`
- Route: `/restaurant`
- Audience: restaurant owners and managers
- Responsibilities:
  - menu
  - employees
  - tables and QR
  - kitchen
  - cashier
  - finance
  - offers
  - restaurant public page
  - settings

Restaurant roles:

- `restaurant_owner`
- `manager`
- `cashier`
- `kitchen`
- `waiter`
- `viewer`

## Staff Platform

- Domain: `staff.babili.your-ma.com`
- Route: `/staff`
- Audience: restaurant staff
- Responsibilities are filtered by role:
  - waiter
  - kitchen
  - cashier
  - manager

## Customer Platform

- Domain: `customer.babili.your-ma.com`
- Route: `/customer`
- Future QR route shape:

```text
https://customer.babili.your-ma.com/r/[restaurantSlug]?table=5&lang=ar
```

Responsibilities:

- open QR
- choose language
- view restaurant page
- view menu
- manage basket
- place order
- track order status

## Access Rules

- Platform users only access platform-level views according to platform role.
- Restaurant owners see only their own restaurant tenant.
- Staff users see only their restaurant and only the modules allowed by role.
- Customers see only their own customer account and orders.
- Web clients must call API Gateway, not internal services.
