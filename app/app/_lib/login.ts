import { useStorage } from "./localStorage";

const HIDE_WELCOME_BACK_KEY = "worth-of-words:hide-welcome-back";

// A flag to track whether we should show the "welcome back" message on the
// Create Lobby screen. We want to display this message one time if the user is
// already logged in when they arrive at this tab. Thus, we will keep this flag
// in `sessionStorage` and set it to true when either the user logs in or when
// they see the message.
export function useHideWelcomeBack() {
  return useStorage<boolean>({
    key: HIDE_WELCOME_BACK_KEY,
    storageType: "session",
  });
}

export function generatePasskeyName(): string {
  return `Worth of Words - ${lexicographicDateString()}`;
}

function lexicographicDateString(): string {
  // I don't want to install a date library just for this. Sue me.
  const date = new Date();
  const year = date.getFullYear();
  const month = withTwoDigits(date.getMonth() + 1);
  const day = withTwoDigits(date.getDate());
  const hour = withTwoDigits(date.getHours());
  const minutes = withTwoDigits(date.getMinutes());
  const seconds = withTwoDigits(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
}

function withTwoDigits(n: number): string {
  return n.toString().padStart(2, "0");
}
