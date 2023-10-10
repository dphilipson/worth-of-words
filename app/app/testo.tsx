"use client";

import { useEffect, useRef } from "react";

import { doStuff } from "./_lib/proofs";

export default function Testo() {
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;
    setTimeout(doStuff, 2000);
  }, []);

  return <div />;
}
