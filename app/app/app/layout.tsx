import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Worth of Words - Create Lobby",
  description: "It's a word-guessing battle royale!",
};

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center pt-16">
      {children}
    </main>
  );
}
