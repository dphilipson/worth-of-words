"use client";
import { useRouter } from "next/navigation";
import { memo, ReactNode, useEffect } from "react";

import { useUrlHash } from "../_lib/hooks";
import { LobbyProvider } from "../_lib/useLobby";

export interface LobbyWrapperProps {
  children: ReactNode;
}

export default memo(function LobbyWrapper({
  children,
}: LobbyWrapperProps): ReactNode {
  const lobbyIdString = useUrlHash();
  const router = useRouter();
  const lobbyId = parseBigInt(lobbyIdString);

  useEffect(() => {
    if (lobbyIdString !== undefined && lobbyId === undefined) {
      router.replace("/");
    }
  });

  if (lobbyId === undefined) {
    return undefined;
  }

  // Set key as lobby id so this component remounts if the lobby id changes.
  // Quick-and-dirty way to throw away all state from the previous lobby.
  return (
    <LobbyProvider key={lobbyId} lobbyId={lobbyId} loadingComponent="">
      {children}
    </LobbyProvider>
  );
});

function parseBigInt(s: string | undefined): bigint | undefined {
  if (s === undefined || s.length === 0) {
    return undefined;
  }
  try {
    return BigInt(s);
  } catch {
    return undefined;
  }
}
