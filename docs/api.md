# Scan Menu MVP API

All client traffic should go through the API gateway at `http://localhost:4000`.

## Health

- `GET /health`

## Auth

- `GET /auth/users`
- `POST /auth/login`
- `GET /auth/session/:sessionId`
- `POST /auth/logout`
- `POST /auth/register/customer`
- `POST /auth/register/staff`
- `POST /auth/register/restaurant`

`/auth/login` accepts `identifier` and `password`. `identifier` can be email, username, or phone.
The backend decides the destination from the stored role:

- `platform_owner` -> `/admin`
- `restaurant_owner` -> `/restaurant`
- `staff` -> `/staff`

The response includes a backend `session.id`. The web app stores it locally and uses
`/auth/session/:sessionId` to verify the current workspace, then `/auth/logout` to end the session.

## Restaurants

- `GET /restaurants`
- `GET /restaurants/:restaurantId/menu?language=ar`

## Orders

- `GET /orders`
- `POST /orders`
- `PATCH /orders/:orderId/status`

## Translations

- `GET /translations/languages`
- `POST /translations/translate`

Example:

```json
{
  "text": "no onions",
  "sourceLanguage": "en",
  "targetLanguage": "ru"
}
```
