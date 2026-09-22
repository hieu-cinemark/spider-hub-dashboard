"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import ContentSkeleton from "@/components/PageSkeleton";
import {
  AUTH_PENDING,
  REQUIRED_AUTH_KEY,
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

  if (!REQUIRED_AUTH_KEY) return <>{children}</>;
  if (storedKey === AUTH_PENDING) {
    return (
      <div className="min-h-screen bg-[var(--paper)] p-6 sm:p-8">
        <ContentSkeleton />
      </div>
    );
  }
  if (storedKey === REQUIRED_AUTH_KEY) return <>{children}</>;

  return <LoginScreen onSubmit={login} />;
}
