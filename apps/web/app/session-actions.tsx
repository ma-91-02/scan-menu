"use client";

import { useEffect, useState } from "react";
import { migrateLegacyStorageKey, storageKeys } from "./lib/storage-keys";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
    const sessionId = localStorage.getItem(migrateLegacyStorageKey("session"));

    if (!sessionId) {
      setStatus("No active session");
      return;
    }

    fetch(`${apiUrl}/auth/session/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) {
          localStorage.removeItem(storageKeys.session);
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
    const sessionId = localStorage.getItem(migrateLegacyStorageKey("session"));

    if (sessionId) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => undefined);
    }

    localStorage.removeItem(storageKeys.session);
    window.location.href = "/";
  }

  if (!user && status === "No active session") {
    return null;
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
