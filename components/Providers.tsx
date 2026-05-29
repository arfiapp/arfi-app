"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";
import { patchCircleFetch } from "@/lib/patch-circle-fetch";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi-config";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    patchCircleFetch();
  }, []);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#1a9e7a",
            accentColorForeground: "#0d1b2e",
            borderRadius: "large"
          })}
        >
          {children}
          <Toaster position="bottom-right" toastOptions={{ className: "text-sm" }} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
