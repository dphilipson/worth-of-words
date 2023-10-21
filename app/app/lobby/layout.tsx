import type { Metadata } from "next";
import { ReactNode } from "react";

import LobbyWrapper from "../_components/lobbyWrapper";

export const metadata: Metadata = {
  title: "Worth of Words - Lobby",
  description: "It's a word-guessing battle royale!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <LobbyWrapper>{children}</LobbyWrapper>;
}
