"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import ContentSkeleton from "@/components/PageSkeleton";
import {
  AUTH_PENDING,
  getAuthServerSnapshot,
  getAuthSnapshot,
  login,
  resyncAuth,
  subscribeAuth,
} from "@/lib/auth";
import LoginScreen from "./LoginScreen";

export default function AuthGate({ children }: { children: ReactNode }) {
  const storedKey = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

  useEffect(() => {
    resyncAuth();
  }, []);

  if (storedKey === AUTH_PENDING) {
    return (
      <div className="min-h-screen bg-[var(--paper)] p-6 sm:p-8">
        <ContentSkeleton />
      </div>
    );
  }
  // Only ever stored after login() accepted it (cinemark-api's /auth/check,
  // or the legacy client-side key) - and the first 401 from the API clears
  // it again (lib/api.ts), so a rotated key drops back to this screen.
  if (storedKey) return <>{children}</>;

  return <LoginScreen onSubmit={login} />;
}
