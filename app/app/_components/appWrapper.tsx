"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { enableMapSet } from "immer";
import { ReactNode, useEffect } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";

import { CHAIN, CHAIN_URL } from "../_lib/constants";
import Header from "./header";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [CHAIN],
  transports: {
    [CHAIN.id]: http(CHAIN_URL),
  } as any,
});

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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Header />
        <main className="flex w-full flex-col items-center">{children}</main>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
