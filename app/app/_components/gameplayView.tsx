import clsx from "clsx";
import { memo, ReactNode, useCallback, useEffect, useState } from "react";

import {
  getLivePlayerCount,
  getPlayer,
  getPlayersDoneWithPhaseCount,
  Phase,
} from "../_lib/gameLogic";
import { usePrevious } from "../_lib/hooks";
import { useCreateSubscription } from "../_lib/subscriptions";
import { useLobby } from "../_lib/useLobby";
import Card from "./card";
import ConnectedColoredKeyboard from "./connectedColoredKeyboard";
import ConnectedGuessGrid from "./connectedGuessGrid";
import ConnectedPlayerList from "./connectedPlayerList";
import ConnectedPlayerListItem from "./connectedPlayerListItem";
import { Countdown } from "./countdown";
import GameOverView from "./gameOverView";
import KeyboardCapture from "./keyboardCapture";
import Modal from "./modal";
import TargetsView from "./targetsView";

export default memo(function GameplayView(): ReactNode {
  const { playerAddress, lobby, validGuessWords, actions } = useLobby();
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roundNumberLastRender = usePrevious(lobby.roundNumber);
  const commitGuess = useCallback(
    (guess: string) => {
      setIsSubmitting(true);
      actions.commitGuess(guess);
    },
    [actions],
  );
  const { input, onKey, clearInput } = useInputKeys(
    validGuessWords,
    commitGuess,
  );
  useEffect(() => {
    if (
      lobby.roundNumber !== roundNumberLastRender &&
      roundNumberLastRender !== undefined
    ) {
      clearInput();
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby.roundNumber]);
  const [openStatusModal, subscribeToOpenStatusModal] =
    useCreateSubscription<void>();

  const player = getPlayer(lobby, playerAddress);
  if (lobby.phase === Phase.GAME_OVER || player.isEliminated) {
    return <GameOverView />;
  }

  const isInputtingGuess =
    lobby.phase === Phase.COMMITING_GUESSES &&
    !isSubmitting &&
    !getPlayer(lobby, playerAddress).hasCommittedGuess;

  const statusComponent = (() => {
    if (lobby.phase === Phase.COMMITING_GUESSES) {
      const statusText = isInputtingGuess
        ? "…left to submit guess"
        : `Waiting for players ${getWaitingPlayerText()}`;
      return (
        <>
          <Countdown className="text-5xl" deadline={lobby.phaseDeadline} />
          <p className="mt-2 text-gray-700">{statusText}</p>
        </>
      );
    } else if (lobby.phase === Phase.REVEALING_GUESSES) {
      return (
        <p className="text-gray-700">
          Revealing guesses {getWaitingPlayerText()}
        </p>
      );
    } else if (lobby.phase === Phase.REVEALING_MATCHES) {
      return (
        <p className="text-gray-700">
          Revealing matches {getWaitingPlayerText()}
        </p>
      );
    }
  })();

  function getWaitingPlayerText(): string {
    const donePlayerCount = getPlayersDoneWithPhaseCount(lobby);
    const livePlayerCount = getLivePlayerCount(lobby);
    return `(${donePlayerCount}/${livePlayerCount})`;
  }

  return (
    <>
      {isInputtingGuess && <KeyboardCapture onKey={onKey} />}
      <div className="min-h-[400px] w-full">
        <TargetsView
          currentInput={input}
          onHoverChange={setSelectedTargetIndex}
        />
      </div>
      <Card className="mt-10 flex flex-col items-center">
        {statusComponent}
      </Card>
      <button
        className="btn btn-sm mt-5 text-gray-800"
        onClick={openStatusModal}
      >
        View game status
      </button>
      <div className={clsx("mt-2", !isInputtingGuess && "opacity-30")}>
        <ConnectedColoredKeyboard
          selectedIndex={selectedTargetIndex}
          onKey={onKey}
        />
      </div>
      <Modal subscribeToOpenModal={subscribeToOpenStatusModal}>
        <div className="flex justify-center space-x-10">
          <div className="flex w-full max-w-xs flex-col items-center space-y-4">
            <h5>Your status</h5>
            <ConnectedPlayerListItem playerAddress={playerAddress} />
            <ConnectedGuessGrid
              playerAddress={playerAddress}
              currentInput=""
              isSelfGrid={true}
            />
          </div>
          <div className="flex w-96 min-w-fit flex-col items-center space-y-4">
            <h5>Rankings</h5>
            <ConnectedPlayerList />
          </div>
        </div>
      </Modal>
    </>
  );
});

interface InputKeysContext {
  input: string;
  onKey(keyCode: string): void;
  clearInput(): void;
}

function useInputKeys(
  validGuessWords: Set<string>,
  onSubmit: (word: string) => void,
): InputKeysContext {
  const [input, setInput] = useState("");
  const onKey = useCallback(
    (keyCode: string) => {
      if (input.length > 0 && keyCode === "Backspace") {
        setInput(input.slice(0, -1));
      } else if (
        input.length === 5 &&
        keyCode === "Enter" &&
        validGuessWords.has(input)
      ) {
        onSubmit(input);
      } else if (input.length < 5 && isLetter(keyCode)) {
        setInput(input + keyCode.toUpperCase());
      }
    },
    [input, onSubmit, validGuessWords],
  );
  const clearInput = useCallback(() => setInput(""), [setInput]);
  return { input, onKey, clearInput };
}

function isLetter(s: string) {
  return s.match(/^[a-zA-Z]$/);
}
