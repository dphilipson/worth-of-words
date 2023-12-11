import { memo, ReactNode, useCallback, useState } from "react";

import { useRequestNotificationPermission } from "../_lib/notifications";
import { useLobby } from "../_lib/useLobby";
import ConnectedPlayerList from "./connectedPlayerList";
import LoadingButton from "./loadingButton";

export default memo(function WaitingRoomView(): ReactNode {
  const { lobby, actions } = useLobby();
  const [isStarting, setIsStarting] = useState(false);
  const hasEnoughPlayers =
    lobby.playersByAddress.size > Math.max(1, lobby.config.minPlayers);

  useRequestNotificationPermission();

  const onStartClick = useCallback(() => {
    setIsStarting(true);
    actions.startGame();
  }, [setIsStarting, actions]);

  return (
    <div className="flex w-full flex-col items-center space-y-20">
      <ConnectedPlayerList />
      <LoadingButton
        className="btn btn-primary"
        disabled={!hasEnoughPlayers}
        isLoading={isStarting}
        onClick={onStartClick}
      >
        {hasEnoughPlayers ? "Start game" : "Waiting for players"}
      </LoadingButton>
    </div>
  );
});
