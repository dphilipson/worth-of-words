"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  ConnectKitButton,
  ConnectKitProvider,
  getDefaultConfig,
} from "connectkit";
import { enableMapSet } from "immer";
import { ReactNode, useEffect } from "react";
import { createConfig, WagmiConfig } from "wagmi";
import { foundry, polygonMumbai } from "wagmi/chains";

import {
  ALCHEMY_API_KEY,
  CHAIN,
  WALLET_CONNECT_PROJECT_ID,
} from "../_lib/constants";

const queryClient = new QueryClient();

const config = createConfig(
  getDefaultConfig({
    alchemyId: ALCHEMY_API_KEY,
    walletConnectProjectId: WALLET_CONNECT_PROJECT_ID,
    appName: "Worth of Words",
    appUrl: "https://worthofwords.com",
    chains: [CHAIN],
  }),
);

export default function AppWrapper({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  useEffect(() => {
    enableMapSet();

    // https://github.com/wagmi-dev/viem/discussions/781
    const orig = window.console.error;
    window.console.error = (...args) => {
      if (args[0]?.name === "ChainDoesNotSupportContract") {
        return;
      }
      orig.apply(window.console, args);
    };
    return () => {
      window.console.error = orig;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <ConnectKitProvider>
          <div className="absolute right-4 top-4">
            <ConnectKitButton />
          </div>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ConnectKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
