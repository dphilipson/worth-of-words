import { refineNonNull } from "./typeHelpers";

export const ALLOWED_ORIGIN = getEnv("ALLOWED_ORIGIN");
export const ALCHEMY_URL = getEnv("ALCHEMY_URL");
export const GAS_MANAGER_POLICY_ID = getEnv("GAS_MANAGER_POLICY_ID");
export const TURNKEY_PUBLIC_KEY = getEnv("TURNKEY_PUBLIC_KEY");
export const TURNKEY_PRIVATE_KEY = getEnv("TURNKEY_PRIVATE_KEY");
export const TURNKEY_ORGANIZATION_ID = getEnv("TURNKEY_ORGANIZATION_ID");

export const TURNKEY_BASE_URL = "https://api.turnkey.com";

function getEnv(name: string): string {
  return refineNonNull(
    process.env[name],
    `Missing environment variable ${name}`
  );
}
