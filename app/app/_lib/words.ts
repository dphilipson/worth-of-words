import { newOneTimeLoader } from "./loading";

const A_CHAR_CODE = "A".charCodeAt(0);

export const getSecretWordlist = newWordlistLoader("secret-wordlist");
export const getGuessWordlist = newWordlistLoader("guess-wordlist");

export function wordToNumber(word: string): number {
  let out = 0;
  for (let i = 0; i < word.length; i++) {
    const n = word.charCodeAt(i) - A_CHAR_CODE;
    out = out * 26 + n;
  }
  return out;
}

export function wordToLetters(word: string): number[] {
  const out = new Array(word.length);
  for (let i = 0; i < word.length; i++) {
    out[i] = word.charCodeAt(i) - A_CHAR_CODE;
  }
  return out;
}

function newWordlistLoader(listName: string): () => Promise<string[]> {
  return newOneTimeLoader(async () => {
    const response = await fetch(`./${listName}.txt`);
    const text = await response.text();
    return text.split("\n").filter((s) => s.length > 0);
  });
}
