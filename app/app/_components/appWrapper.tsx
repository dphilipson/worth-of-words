"use client";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { enableMapSet } from "immer";
import { ReactNode, useEffect } from "react";
import { Chain } from "viem";
import { createConfig, WagmiProvider } from "wagmi";

import { CHAIN } from "../_lib/constants";
import { getSmartAccountClient } from "../_lib/modularAccount";
import Header from "./header";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => console.error(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => console.error(error),
  }),
});

const config = createConfig({
  // Wagmi is trying to be clever with types, but it makes a valid config fail
  // typechecking.
  chains: [CHAIN] as [Chain],
  client: getSmartAccountClient,
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
