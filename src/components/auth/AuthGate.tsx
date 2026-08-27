"use client";

import { Skeleton } from "antd";
import { useSyncExternalStore, type ReactNode } from "react";
import { AUTH_PENDING, REQUIRED_AUTH_KEY, getAuthServerSnapshot, getAuthSnapshot, login, subscribeAuth } from "@/lib/auth";
import LoginScreen from "./LoginScreen";

function AuthChecking() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm">
        <Skeleton active avatar={{ shape: "circle" }} paragraph={{ rows: 2 }} />
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const storedKey = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

  if (!REQUIRED_AUTH_KEY) return <>{children}</>;
  // Neutral loading state for the one render between hydration and
  // useSyncExternalStore's resync to the real localStorage value - never
  // guesses "unauthorized" here, which is what used to flash the login
  // screen on every reload of an already-authed session.
  if (storedKey === AUTH_PENDING) return <AuthChecking />;
  if (storedKey === REQUIRED_AUTH_KEY) return <>{children}</>;

  return <LoginScreen onSubmit={login} />;
}
