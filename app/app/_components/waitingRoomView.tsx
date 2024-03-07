import { memo, ReactNode, useCallback, useState } from "react";

import { useRequestNotificationPermission } from "../_lib/notifications";
import { useLobby } from "../_lib/useLobby";
import ConnectedPlayerList from "./connectedPlayerList";
import CopyLobbyUrlButton from "./copyLobbyUrlButton";
import DelayedMount from "./delayedMount";
import DphilTidbits, { INITIAL_TIDBIT, TIDBITS } from "./dphilTidbits";
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

  // Needs margin-bottom on mobile so the tidbits don't completely cover the
  // "start game" button.
  return (
    <div className="mb-32 flex w-full max-w-[38rem] flex-col items-center space-y-8 px-4 sm:mb-0 sm:mt-16">
      <CopyLobbyUrlButton className="w-full" />
      <ConnectedPlayerList className="max-h-[24rem]" />
      <LoadingButton
        // Need some !importants to override DaisyUIs aggressive disabled styles
        className="btn btn-neutral w-full border-none !bg-black !bg-opacity-100 !text-white hover:!bg-gray-800 disabled:opacity-50"
        disabled={!hasEnoughPlayers || !isHost}
        isLoading={isStarting}
        onClick={onStartClick}
      >
        {!isHost
          ? "Waiting for host…"
          : !hasEnoughPlayers
          ? "Waiting for players…"
          : "Begin the battle!"}
      </LoadingButton>
      <DelayedMount delay={3000}>
        <DphilTidbits initialTidbit={INITIAL_TIDBIT} tidbits={TIDBITS} />
      </DelayedMount>
    </div>
  );
});
