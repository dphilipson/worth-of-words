import { memo, ReactNode, useCallback, useState } from "react";

import { useLobby } from "../_lib/useLobby";
import JoinLobbyView from "./joinLobbyView";

export default memo(function ConnectedJoinLobbyView(): ReactNode {
  const { lobby, validGuessWords, validSecretWords, actions } = useLobby();
  const [isJoining, setIsJoining] = useState(false);
  const onJoin = useCallback(
    (playerName: string, words: string[]) => {
      setIsJoining(true);
      actions.joinLobby(playerName, words, undefined);
    },
    [actions],
  );
  return (
    <JoinLobbyView
      numSecrets={lobby.config.numLives}
      validGuessWords={validGuessWords}
      validSecretWords={validSecretWords}
      isJoining={isJoining}
      onJoin={onJoin}
    />
  );
});
