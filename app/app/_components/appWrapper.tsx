"use client";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { enableMapSet } from "immer";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useTurnkeyDetails } from "../_lib/turnkeyRemnant";
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
  const router = useRouter();
  const [turnkeyDetails] = useTurnkeyDetails();

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

  const hasTurnkeyDetails = !!turnkeyDetails;

  useEffect(() => {
    if (hasTurnkeyDetails) {
      // This user previously logged in with Turnkey, which is no longer
      // supported. Take them to a page telling them what has changed.
      router.replace("/news");
    }
  }, [hasTurnkeyDetails, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <FooterProvider>
        <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
          <Header />
          <main className="flex w-full flex-auto flex-col items-center">
            {children}
          </main>
          <Footer />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </FooterProvider>
    </QueryClientProvider>
  );
}
