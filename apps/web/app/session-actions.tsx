"use client";

import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
const sessionStorageKey = "scan-menu-session";

interface SessionUser {
  name: string;
  role: string;
  restaurantName?: string;
}

interface SessionBarProps {
  expectedArea: "admin" | "restaurant" | "staff" | "partners";
}

export function SessionBar({ expectedArea }: SessionBarProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState("Checking session...");

  useEffect(() => {
    const sessionId = localStorage.getItem(sessionStorageKey);

    if (!sessionId) {
      setStatus("No active session");
      return;
    }

    fetch(`${apiUrl}/auth/session/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) {
          localStorage.removeItem(sessionStorageKey);
          setStatus("Session expired");
          return;
        }

        const payload = await response.json();
        const redirectTo = payload.data.redirectTo as string;
        const currentArea = redirectTo.replace("/", "") || "public";

        if (currentArea !== expectedArea) {
          window.location.href = redirectTo;
          return;
        }

        setUser(payload.data.user);
        setStatus("");
      })
      .catch(() => setStatus("Could not verify session"));
  }, [expectedArea]);

  async function logout() {
    const sessionId = localStorage.getItem(sessionStorageKey);

    if (sessionId) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      }).catch(() => undefined);
    }

    localStorage.removeItem(sessionStorageKey);
    window.location.href = "/";
  }

  return (
    <div className="session-bar">
      <div>
        <strong>{user?.name ?? status}</strong>
        {user ? <span>{user.restaurantName ?? user.role}</span> : null}
      </div>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
