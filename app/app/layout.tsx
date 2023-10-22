import "./globals.css";

import clsx from "clsx";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import AppWrapper from "./_components/appWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Worth of Words",
  description: "It's a word-guessing battle royale!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={clsx(
          "min-h-screen bg-gradient-to-br from-purple-400 to-blue-400",
          inter.className,
        )}
      >
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
