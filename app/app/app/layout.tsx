import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Worth of Words - Create Lobby",
  description: "It's a word-guessing battle royale!",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}
