# Babili Rebranding Migration

This project completed the technical rename from the former Scan Menu identity
to Babili.

## Completed Changes

- Product name changed to Babili / بابلي / Бабили.
- Workspace package names changed from `@scanmenu/*` to `@babili/*`.
- Root package name changed to `babili`.
- Production domains now use:
  - `admin.babili.your-ma.com`
  - `restaurant.babili.your-ma.com`
  - `staff.babili.your-ma.com`
  - `customer.babili.your-ma.com`
  - `api.babili.your-ma.com`
- Production and development compose files now use Babili service commands,
  image names, PostgreSQL defaults, and Docker volume names.
- The former native mobile workspace was removed. Babili is web-first in this
  phase; customer ordering is served by `apps/web`.

## Browser Storage Compatibility

The web app now writes Babili keys:

- `babili-session`
- `babili-language`
- `babili-customer-language`
- `babili-customer-user`

For compatibility, `apps/web/app/lib/storage-keys.ts` reads the previous
browser keys once and migrates them to the new Babili keys. This is the only
intentional place where the old storage key names should remain.

## Database And Docker Data Safety

Fresh development and fresh Coolify deployments use Babili database names,
table prefixes, and Docker volumes. Existing production deployments that
already contain data under the previous names must be migrated with a backup.

Recommended production migration sequence:

1. Take a PostgreSQL backup and verify it can be restored.
2. Stop application traffic.
3. Create or rename Babili tables using a reviewed SQL migration.
4. Copy or rename data from the previous table prefix into the Babili prefix.
5. Validate tenant isolation and order/menu counts.
6. Deploy the Babili build.
7. Run health checks and smoke tests.

Do not delete old production volumes until the Babili deployment has been
verified and a rollback plan is available.

## Removed Mobile Workspace

The previous native mobile app workspace was removed from:

- workspaces
- package lock
- root scripts
- documentation

Future mobile work should start as a customer PWA unless a separate native app
is explicitly approved.
