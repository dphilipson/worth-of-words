"use client";
import { memo, ReactNode, useEffect, useState } from "react";

import { LobbyProvider } from "../_lib/useLobby";

export interface LobbyWrapperProps {
  children: ReactNode;
}

export default memo(function LobbyWrapper({
  children,
}: LobbyWrapperProps): ReactNode {
  const lobbyIdString = useUrlHash();
  if (!lobbyIdString) {
    return "No lobby id specified";
  }
  return (
    <LobbyProvider
      lobbyId={BigInt(lobbyIdString)}
      loadingComponent="Loading lobby"
    >
      {children}
    </LobbyProvider>
  );
});

// Very lazy, but probably good enough. Need `useEffect` so Next doesn't try to
// render this before the url has changed, or something.
function useUrlHash(): string {
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(window.location.hash.slice(1));
  }, []);

  return hash;
}
