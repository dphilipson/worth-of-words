import { defineConfig } from "@wagmi/cli";
import { actions, foundry, react } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "app/_generated/wagmi.ts",
  contracts: [],
  plugins: [
    actions(),
    foundry({
      project: "../contracts",
      include: ["ISessionKeyAccount.sol/**", "IWorthOfWords.sol/**"],
    }),
    react(),
  ],
});
