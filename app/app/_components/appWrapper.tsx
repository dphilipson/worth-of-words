"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { localhost } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

const queryClient = new QueryClient();
const { publicClient, webSocketPublicClient } = configureChains(
  [localhost],
  [publicProvider()]
);
const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

export default function AppWrapper({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </WagmiConfig>
    </QueryClientProvider>
  );
}
