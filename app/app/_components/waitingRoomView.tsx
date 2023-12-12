import { memo, ReactNode, useCallback, useState } from "react";

import { useRequestNotificationPermission } from "../_lib/notifications";
import { useLobby } from "../_lib/useLobby";
import ConnectedPlayerList from "./connectedPlayerList";
import CopyLobbyUrlButton from "./copyLobbyUrlButton";
import LoadingButton from "./loadingButton";

export default memo(function WaitingRoomView(): ReactNode {
  const { playerAddress, lobby, actions } = useLobby();
  const [isStarting, setIsStarting] = useState(false);
  const hasEnoughPlayers =
    lobby.playersByAddress.size > Math.max(1, lobby.config.minPlayers);
  const isHost = lobby.host === playerAddress;

  useRequestNotificationPermission();

  const onStartClick = useCallback(() => {
    setIsStarting(true);
    actions.startGame();
  }, [setIsStarting, actions]);

  return (
    <div className="flex w-full flex-col items-center space-y-20">
      <CopyLobbyUrlButton />
      <ConnectedPlayerList />
      <LoadingButton
        className="btn btn-primary"
        disabled={!hasEnoughPlayers || !isHost}
        isLoading={isStarting}
        onClick={onStartClick}
      >
        {!isHost
          ? "Waiting for host"
          : !hasEnoughPlayers
          ? "Waiting for players"
          : "Start game"}
      </LoadingButton>
    </div>
  );
});
