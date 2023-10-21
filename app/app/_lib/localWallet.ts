import { useEffect, useState } from "react";
import { createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

import { WORTH_OF_WORDS_ADDRESS } from "./constants";
import { WalletLike } from "./lobbyActions";

const ANVIL_PRIVATE_KEYS: Hex[] = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
];

export function useLocalWallet(): WalletLike | undefined {
  const [wallet, setWallet] = useState<WalletLike>();

  function createAndSetWallet(privateKey: Hex): void {
    const client = createWalletClient({
      chain: foundry,
      transport: http(),
    });
    const account = privateKeyToAccount(privateKey);
    setWallet({
      address: account.address,
      send: async (data) => {
        await client.sendTransaction({
          account,
          to: WORTH_OF_WORDS_ADDRESS,
          data,
        });
      },
    });
    console.log("Using Anvil address:", account.address);
  }

  useEffect(() => {
    const savedPrivateKey = loadPrivateKey();
    if (savedPrivateKey !== null) {
      createAndSetWallet(savedPrivateKey);
      return;
    }

    (window as any).useAnvilAccount = (index: number) => {
      const privateKey = ANVIL_PRIVATE_KEYS[index];
      if (privateKey === undefined) {
        throw new Error("Invalid index");
      }
      storePrivateKey(privateKey);
      createAndSetWallet(privateKey);
      delete (window as any).useAnvilAccount;
    };
    return () => {
      delete (window as any).useAnvilAccount;
    };
  }, []);

  return wallet;
}

const PRIVATE_KEY_KEY = "privateKey";

function storePrivateKey(privateKey: Hex): void {
  sessionStorage.setItem(PRIVATE_KEY_KEY, privateKey);
}

function loadPrivateKey(): Hex | null {
  return sessionStorage.getItem(PRIVATE_KEY_KEY) as Hex | null;
}
