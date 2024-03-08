import { refineNonNull } from "./typeHelpers";

export const ALLOWED_ORIGIN = getEnv("ALLOWED_ORIGIN");
export const ALCHEMY_RPC_URL = getEnv("ALCHEMY_RPC_URL");
export const ALCHEMY_API_KEY = getEnv("ALCHEMY_API_KEY");
export const GAS_MANAGER_POLICY_ID = getEnv("GAS_MANAGER_POLICY_ID");

export const ALCHEMY_API_BASE_URL = "https://api.g.alchemy.com";

function getEnv(name: string): string {
  return refineNonNull(
    process.env[name],
    `Missing environment variable ${name}`
  );
}
