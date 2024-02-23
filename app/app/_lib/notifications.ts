import { useEffect, useRef } from "react";

import { getPlayer, Phase } from "./gameLogic";
import { useLobby } from "./useLobby";

export function useRequestNotificationPermission(): void {
  useEffect(() => {
    getSafeNotification()?.requestPermission();
  }, []);
}

/**
 * Displays notifications for the user when it becomes time to guess if the
 * window is not focused. Notifications disappear when the window is focused or
 * when it is no longer the guessing phase.
 */
export function useNotifyOnYourTurn(): void {
  const { lobby, playerAddress } = useLobby();
  const notificationRef = useRef<Notification>();
  const { isEliminated } = getPlayer(lobby, playerAddress);

  function closeNotification(): void {
    if (notificationRef.current !== undefined) {
      notificationRef.current.close();
      notificationRef.current = undefined;
    }
  }

  useEffect(() => {
    const Notification = getSafeNotification();
    if (!Notification) {
      return;
    }
    if (lobby.phase !== Phase.COMMITING_GUESSES) {
      closeNotification();
    } else if (!isEliminated && !document.hasFocus()) {
      notificationRef.current = new Notification("It's time to guess!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby.phase]);

  useEffect(() => {
    window.addEventListener("focus", closeNotification);
    return () => window.removeEventListener("focus", closeNotification);
  }, []);
}

function getSafeNotification(): typeof Notification | undefined {
  return typeof Notification === "undefined" ? undefined : Notification;
}
