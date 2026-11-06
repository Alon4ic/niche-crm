import { useEffect, useState } from "react";
import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { useAuthStore } from "./stores/authStore";
import {Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import "@mantine/core/styles.css";
import '@mantine/notifications/styles.css'

export function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    hydrate().finally(() => setIsHydrated(true));
  }, [hydrate]);

  if (!isHydrated) {
    return null;
  }

  return (
    <MantineProvider>
      <ModalsProvider>
        <Notifications />
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
