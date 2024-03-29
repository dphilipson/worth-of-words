import { memo, ReactNode, useCallback, useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";

import { WORD_LENGTH } from "../_lib/constants";
import {
  getLivePlayerCount,
  getPlayer,
  getPlayersDoneWithPhaseCount,
  Phase,
} from "../_lib/gameLogic";
import { useIsLargeWindow, usePrevious } from "../_lib/hooks";
import {
  useNotifyOnYourTurn,
  useRequestNotificationPermission,
} from "../_lib/notifications";
import { useCreateSubscription } from "../_lib/subscriptions";
import { useLobby } from "../_lib/useLobby";
import Card from "./card";
import ConnectedColoredKeyboard from "./connectedColoredKeyboard";
import ConnectedGuessGrid from "./connectedGuessGrid";
import ConnectedPlayerList from "./connectedPlayerList";
import ConnectedPlayerListItem from "./connectedPlayerListItem";
import { Countdown } from "./countdown";
import DelayedMount from "./delayedMount";
import DphilTidbits, { TIDBITS } from "./dphilTidbits";
import { useHideFooter } from "./footer";
import GameOverView from "./gameOverView";
import KeyboardCapture from "./keyboardCapture";
import Modal from "./modal";
import TargetsView from "./targetsView";

export default memo(function GameplayView(): ReactNode {
  const { playerAddress, lobby, validGuessWords, actions, advanceToNextRound } =
    useLobby();
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number>();
  const [selectedMobileIndex, setSelectedMobileIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roundNumberLastRender = usePrevious(lobby.roundNumber);
  const [pulseInput, subscribeToPulseInput] = useCreateSubscription<void>();
  const isLargeWindow = useIsLargeWindow();
  const commitGuess = useCallback(
    (guess: string) => {
      setIsSubmitting(true);
      pulseInput();
      actions.commitGuess(guess);
    },
    [actions, pulseInput],
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

  useRequestNotificationPermission();
  useNotifyOnYourTurn();
  useHideFooter();

  const player = getPlayer(lobby, playerAddress);
  if (lobby.phase === Phase.GAME_OVER || player.isEliminated) {
    return <GameOverView />;
  }

  const isInputtingGuess =
    lobby.phase === Phase.COMMITING_GUESSES &&
    !isSubmitting &&
    !getPlayer(lobby, playerAddress).hasCommittedGuess;

  const shouldDisplayTidbits = !isInputtingGuess && !advanceToNextRound;
  const selectedIndex = isLargeWindow
    ? hoveredTargetIndex
    : selectedMobileIndex;

  const statusComponent = (() => {
    if (advanceToNextRound) {
      // We are currently viewing a snapshot of the previous round.
      return (
        <>
          <span>End of round</span>
          <button className="btn btn-primary mt-2" onClick={advanceToNextRound}>
            Show next round
          </button>
          <Countdown deadline={lobby.phaseDeadline} />
        </>
      );
    } else if (lobby.phase === Phase.COMMITING_GUESSES) {
      const statusText = !isInputtingGuess
        ? `Waiting for players ${getWaitingPlayerText()}`
        : input.length === WORD_LENGTH
        ? "Press Enter to submit"
        : "left to submit guess";
      return (
        <>
          <Countdown
            className="text-2xl sm:text-5xl"
            deadline={lobby.phaseDeadline}
          />
          <p className="mt-0 text-sm text-gray-700 sm:mt-2">{statusText}</p>
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
      <div className="grid min-h-full grid-rows-[1fr_auto]">
        <div className="w-screen">
          <TargetsView
            currentInput={input}
            selectedMobileIndex={selectedMobileIndex}
            setSelectedMobileIndex={setSelectedMobileIndex}
            onHoverChange={setHoveredTargetIndex}
            subscribeToInputConfirm={subscribeToPulseInput}
          />
        </div>
        <div className="mb-2 flex flex-col items-center sm:mb-4">
          <Card
            className="mt-10 flex flex-col items-center px-3 py-2 sm:px-4 sm:py-4"
            noDefaultPadding={true}
          >
            {statusComponent}
          </Card>
          <button
            className="btn btn-sm mt-5 text-gray-800"
            onClick={openStatusModal}
          >
            View game status
          </button>
          <div className="my-2">
            <ConnectedColoredKeyboard
              selectedIndex={selectedIndex}
              disabled={!isInputtingGuess}
              onKey={onKey}
            />
          </div>
        </div>
      </div>
      <div className="fixed bottom-16 left-8 hidden w-full max-w-xs lg:block">
        <ConnectedPlayerListItem playerAddress={playerAddress} />
      </div>
      <Modal subscribeToOpenModal={subscribeToOpenStatusModal}>
        {({ closeModal }) => (
          <div className="relative flex flex-col items-center justify-center space-y-10 md:flex-row md:items-start md:space-y-0">
            <button
              className="absolute -right-3 -top-3 text-xl text-secondary hover:text-black"
              onClick={closeModal}
            >
              <FaXmark />
            </button>
            <div className="flex w-full max-w-xs flex-col items-center space-y-4">
              <h4 className="text-xl font-semibold">Your status</h4>
              <div className="space-y-2 overflow-auto">
                <ConnectedPlayerListItem playerAddress={playerAddress} />
                <ConnectedGuessGrid
                  playerAddress={playerAddress}
                  currentInput=""
                  isSelfGrid={true}
                  subscribeToInputConfirm={undefined}
                />
              </div>
            </div>
            <div className="flex w-full max-w-sm flex-col items-center space-y-4 md:ml-10 md:w-96">
              <h4 className="text-xl font-semibold">Rankings</h4>
              <ConnectedPlayerList compact={true} />
            </div>
          </div>
        )}
      </Modal>
      {shouldDisplayTidbits && (
        <DelayedMount delay={2000}>
          <DphilTidbits tidbits={TIDBITS} positionForNoFooter={true} />
        </DelayedMount>
      )}
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
    (key: string) => {
      if (input.length > 0 && key === "Backspace") {
        setInput(input.slice(0, -1));
      } else if (
        input.length === 5 &&
        key === "Enter" &&
        validGuessWords.has(input)
      ) {
        onSubmit(input);
      } else if (input.length < 5 && isLetter(key)) {
        setInput(input + key.toUpperCase());
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
