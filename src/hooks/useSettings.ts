import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useTranslation } from "@/i18n/LocaleProvider";
import { checkStatusLabelKey } from "@/lib/accountHealth";
import { api } from "@/lib/api";
import { translateApiError } from "@/lib/apiError";
import { REFRESH_INTERVAL_MS } from "@/lib/constants";
import type { AccountInput, ProxyInput } from "@/lib/types";

const ACCOUNTS_KEY = ["settings", "accounts"];
const PROXIES_KEY = ["settings", "proxies"];

export function useAccounts() {
  // `enabled` and last_check_status/last_checked_at can change from
  // spider-hub's own backend (bootstrap.py's disable_account() flips
  // enabled=false on a suspected checkpoint, a health check updates
  // last_check_status) with nobody touching this UI at all - without
  // polling, the Switch in AccountsTable stays on whatever it showed at
  // last mount/mutation, silently lying about which account spider-hub is
  // actually using. Same cadence as useTokenStatus, which the same class
  // of backend-driven change already polls for.
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: () => api.accounts(),
    refetchInterval: REFRESH_INTERVAL_MS.accounts,
  });
}

export function useAccountMutations() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });

  const onError = (err: unknown) => message.error(translateApiError(err, t));

  const create = useMutation({
    mutationFn: (input: AccountInput) => api.createAccount(input),
    onSuccess: () => {
      message.success(t("toastAccountAdded"));
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AccountInput }) => api.updateAccount(id, input),
    onSuccess: () => {
      message.success(t("toastAccountUpdated"));
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteAccount(id),
    onSuccess: () => {
      message.success(t("toastAccountRemoved"));
      invalidate();
    },
    onError,
  });

  const check = useMutation({
    mutationFn: (id: number) => api.checkAccount(id),
    onSuccess: (account) => {
      message.success(t("toastAccountChecked", { status: t(checkStatusLabelKey(account.last_check_status)) }));
      invalidate();
    },
    onError,
  });

  const resetCookies = useMutation({
    mutationFn: (id: number) => api.resetTiktokCookies(id),
    onSuccess: (res) => {
      if (res.ok) message.success(t("toastCookiesResetRequested"));
      else message.warning(t("toastCookiesResetFailed"));
    },
    onError,
  });

  return { create, update, remove, check, resetCookies };
}

export function useProxies() {
  return useQuery({ queryKey: PROXIES_KEY, queryFn: () => api.proxies() });
}

export function useProxyMutations() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PROXIES_KEY });

  const onError = (err: unknown) => message.error(translateApiError(err, t));

  const create = useMutation({
    mutationFn: (input: ProxyInput) => api.createProxy(input),
    onSuccess: () => {
      message.success(t("toastProxyAdded"));
      invalidate();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProxyInput }) => api.updateProxy(id, input),
    onSuccess: () => {
      message.success(t("toastProxyUpdated"));
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteProxy(id),
    onSuccess: () => {
      message.success(t("toastProxyRemoved"));
      invalidate();
    },
    onError,
  });

  return { create, update, remove };
}

export function useCronJobs() {
  return useQuery({ queryKey: ["cron-jobs"], queryFn: api.cronJobs, refetchInterval: 60_000 });
}
