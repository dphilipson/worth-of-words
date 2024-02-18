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

import Footer, { FooterProvider } from "./footer";
import Header from "./header";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => console.error(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => console.error(error),
  }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FooterProvider>
        <Header />
        <main className="flex w-full flex-col items-center">{children}</main>
        <Footer />
        <ReactQueryDevtools initialIsOpen={false} />
      </FooterProvider>
    </QueryClientProvider>
  );
}
