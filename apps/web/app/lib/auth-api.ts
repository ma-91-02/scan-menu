const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface AuthApiResult<TPayload = unknown> {
  response: Response;
  payload: TPayload;
}

async function readPayload<TPayload>(response: Response): Promise<TPayload> {
  return response.json() as Promise<TPayload>;
}

export async function loginRequest(body: {
  identifier: string;
  password: string;
}): Promise<AuthApiResult<any>> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    response,
    payload: await readPayload(response),
  };
}

export async function resendVerificationRequest(
  email: string,
): Promise<AuthApiResult<unknown | null>> {
  const response = await fetch(`${apiUrl}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return {
    response,
    payload: await response.json().catch(() => null),
  };
}

export async function registerRestaurantOwnerRequest(
  body: Record<string, FormDataEntryValue | boolean | string>,
): Promise<AuthApiResult<any>> {
  const response = await fetch(`${apiUrl}/auth/register/restaurant-owner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    response,
    payload: await readPayload(response),
  };
}
