"use client";
import { memo, ReactNode } from "react";

import { LobbyProvider } from "../_lib/useLobby";

export interface LobbyWrapperProps {
  children: ReactNode;
}

export default memo(function LobbyWrapper({
  children,
}: LobbyWrapperProps): ReactNode {
  const lobbyIdHash = window.location.hash;
  if (!lobbyIdHash) {
    // TODO: Better error pages
    return "No lobby id in URL";
  }
  // Remove leading "#".
  const lobbyId = BigInt(lobbyIdHash.slice(1));
  return (
    <LobbyProvider lobbyId={lobbyId} loadingComponent="Loading lobby">
      {children}
    </LobbyProvider>
  );
});
