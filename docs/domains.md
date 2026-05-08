# Babili Domains

Babili production is intended to run on Coolify with one public API gateway and
one web application that serves several role-based surfaces.

## Production Domains

| Surface                    | Domain                          | Internal route         |
| -------------------------- | ------------------------------- | ---------------------- |
| Platform Admin             | `admin.babili.your-ma.com`      | `/admin`               |
| Restaurant Owner Dashboard | `restaurant.babili.your-ma.com` | `/restaurant`          |
| Staff Platform             | `staff.babili.your-ma.com`      | `/staff`               |
| Customer Platform          | `customer.babili.your-ma.com`   | `/customer`            |
| API Gateway                | `api.babili.your-ma.com`        | `services/api-gateway` |

## Environment Variables

Production browser code must use the public API domain:

```bash
NEXT_PUBLIC_API_URL=https://api.babili.your-ma.com
PUBLIC_API_URL=https://api.babili.your-ma.com
```

Auth emails and browser redirects should use the appropriate public web domain.
Until the surfaces are split into separate deployables, use the platform admin
domain as the default:

```bash
PUBLIC_WEB_URL=https://admin.babili.your-ma.com
```

Coolify-managed values such as `SERVICE_URL_WEB`, `SERVICE_FQDN_WEB`,
`SERVICE_URL_API_GATEWAY`, and `SERVICE_FQDN_API_GATEWAY` may still be present.
They should point to the Babili domains when configured in Coolify.

## Local Development

Local development remains unchanged:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
PUBLIC_API_URL=http://localhost:4000
PUBLIC_WEB_URL=http://localhost:3000
```

The local Next.js app serves all surfaces from `http://localhost:3000`.

## What Must Not Change Without A Migration Plan

- future package names or workspace locations
- database names and table prefixes such as `babili_*` once production data exists
- Docker volume names that already hold production data
- localStorage/session keys without a compatibility fallback
- API Gateway as the only public backend entry point
