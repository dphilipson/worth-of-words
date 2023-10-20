"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { foundry } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

const queryClient = new QueryClient();

const config = createConfig(
  getDefaultConfig({
    alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID,
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    appName: "Worth of Words",
    appUrl: "https://worthofwords.com",
    chains: [foundry],
  }),
);

export default function AppWrapper({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <ConnectKitProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ConnectKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
