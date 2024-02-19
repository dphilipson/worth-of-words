"use client";
import { useRouter } from "next/navigation";
import { memo, ReactNode, useEffect } from "react";

import { useUrlHash } from "../_lib/hooks";
import { useStorage } from "../_lib/localStorage";
import { LobbyProvider } from "../_lib/useLobby";

const DEFAULT_LOBBY_ID_KEY = "worth-of-words:default-lobby-id";

/**
 * Gets and sets a default lobby id if one isn't provided in the URL. In
 * addition to being sort of nice behavior if someone manually navigates to
 * `/app/lobby` without a hash, it also is a failsafe against a NextJS where
 * for unknown reasons its router drops the hash portion and performs a full
 * reload.
 */
export function useDefaultLobbyId() {
  return useStorage<string>({
    key: DEFAULT_LOBBY_ID_KEY,
    storageType: "session",
  });
}

export interface LobbyWrapperProps {
  children: ReactNode;
}

export default memo(function LobbyWrapper({
  children,
}: LobbyWrapperProps): ReactNode {
  const lobbyIdInHashString = useUrlHash();
  const router = useRouter();
  const [defaultLobbyIdString, setDefaultLobbyIdString] = useDefaultLobbyId();
  const lobbyIdInHash = parseBigInt(lobbyIdInHashString);
  const defaultLobbyId = parseBigInt(defaultLobbyIdString);
  const lobbyId = lobbyIdInHash ?? defaultLobbyId;

  useEffect(() => {
    if (lobbyIdInHashString === undefined) {
      // Initial rendering hasn't read the hash string yet.
      return;
    }
    if (lobbyIdInHash !== undefined) {
      // We read the lobby id from the hash. Set the default to it if it
      // differs, and all is well.
      if (defaultLobbyId !== lobbyIdInHash) {
        setDefaultLobbyIdString(lobbyIdInHash + "");
      }
      return;
    }
    if (defaultLobbyId !== undefined) {
      // The hash is missing, but we have a default lobby id, so fix the hash.
      window.location.hash = defaultLobbyId + "";
    } else {
      // We couldn't get a lobby id from either the hash or storage.
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyIdInHashString]);

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
