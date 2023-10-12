import { defineConfig } from "@wagmi/cli";
import { foundry, react } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "app/_generated/wagmi.ts",
  contracts: [],
  plugins: [foundry({ project: "../contracts" }), react()],
});
