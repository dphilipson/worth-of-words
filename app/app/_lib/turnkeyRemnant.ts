import { useStorage } from "./localStorage";

export function useTurnkeyDetails() {
  return useStorage<unknown>({ key: "worth-of-words:turnkey-details" });
}
