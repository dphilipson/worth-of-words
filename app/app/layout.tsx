import "./globals.css";

import clsx from "clsx";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import AppWrapper from "./_components/appWrapper";
import backgroundImage from "./_images/background.png";

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
          "min-h-screen bg-cover bg-fixed bg-center bg-no-repeat",
          inter.className,
        )}
        style={{ backgroundImage: `url(${backgroundImage.src})` }}
      >
        <AppWrapper>{children}</AppWrapper>
        <Script src="/snarkjs.min.js" />
      </body>
    </html>
  );
}
