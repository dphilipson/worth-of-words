import "./globals.css";

import clsx from "clsx";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import AppWrapper from "./_components/appWrapper";
import backgroundImage from "./_images/background.png";
import { HEAP_ID } from "./_lib/constants";

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
        <Script id="heap-script">
          {`window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=document.createElement("script");r.type="text/javascript",r.async=!0,r.src="https://cdn.heapanalytics.com/js/heap-"+e+".js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(r,a);for(var n=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"],o=0;o<p.length;o++)heap[p[o]]=n(p[o])};
heap.load("${HEAP_ID}");`}
        </Script>
      </body>
    </html>
  );
}
