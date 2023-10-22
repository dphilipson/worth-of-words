import type { Metadata } from "next";
import Script from "next/script";
import { ReactNode } from "react";

import LobbyWrapper from "@/app/_components/lobbyWrapper";

export const metadata: Metadata = {
  title: "Worth of Words - Lobby",
  description: "It's a word-guessing battle royale!",
};

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LobbyWrapper>{children}</LobbyWrapper>
      <Script src="/snarkjs.min.js" />
    </>
  );
}
