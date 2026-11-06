import { MutationCache, QueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import i18next from "../i18n";
import { ApiError } from "./apiClient";

const STATUS_KEYS: Record<number, string> = {
  400: "errors.badRequest",
  401: "errors.sessionExpired",
  403: "errors.forbidden",
  404: "erros.notFound",
  409: "errors.conflict",
  413: "errors.fileTooLarge",
  429: "errors.tooManyRequest",
};

function getErrorMessage(error: unknown, conflictKey?: string): string {
  if (!(error instanceof ApiError)) {
    console.error(error);
    return i18next.t("errors.network");
  }
  if (error.code && i18next.exists(`errors.codes.${error.code}`)) {
    return i18next.t(`errors.codes.${error.code}`);
  }
  if (error.status === 409 && conflictKey) return i18next.t(conflictKey);
  if (error.status >= 500) return i18next.t("errors.server");
  return i18next.t(STATUS_KEYS[error.status] ?? "errors.badRequest");
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const meta = mutation.options.meta;
      if (meta?.silent) return;

      notifications.show({
        color: "red",
        title: i18next.t("errors.title"),
        message: getErrorMessage(
          error,
          meta?.conflictMessage as string | undefined,
        ),
      });
    },
  }),
});
