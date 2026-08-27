import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { api } from "@/lib/api";
import type { AccountInput, ProxyInput } from "@/lib/types";

const ACCOUNTS_KEY = ["settings", "accounts"];
const PROXIES_KEY = ["settings", "proxies"];

export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_KEY, queryFn: () => api.accounts() });
}

export function useAccountMutations() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });

  const onError = (err: unknown) => message.error(err instanceof Error ? err.message : "Request failed");

  const create = useMutation({
    mutationFn: (input: AccountInput) => api.createAccount(input),
    onSuccess: () => {
      message.success("Account added");
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AccountInput }) => api.updateAccount(id, input),
    onSuccess: () => {
      message.success("Account updated");
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteAccount(id),
    onSuccess: () => {
      message.success("Account removed");
      invalidate();
    },
    onError,
  });

  return { create, update, remove };
}

export function useProxies() {
  return useQuery({ queryKey: PROXIES_KEY, queryFn: () => api.proxies() });
}

export function useProxyMutations() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PROXIES_KEY });

  const onError = (err: unknown) => message.error(err instanceof Error ? err.message : "Request failed");

  const create = useMutation({
    mutationFn: (input: ProxyInput) => api.createProxy(input),
    onSuccess: () => {
      message.success("Proxy added");
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProxyInput }) => api.updateProxy(id, input),
    onSuccess: () => {
      message.success("Proxy updated");
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteProxy(id),
    onSuccess: () => {
      message.success("Proxy removed");
      invalidate();
    },
    onError,
  });

  return { create, update, remove };
}

export function useCronJobs() {
  return useQuery({ queryKey: ["cron-jobs"], queryFn: api.cronJobs, refetchInterval: 60_000 });
}
