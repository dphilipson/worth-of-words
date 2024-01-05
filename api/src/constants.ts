import { refineNonNull } from "./util";

export const ALLOWED_ORIGIN = getEnv("ALLOWED_ORIGIN");
export const API_PUBLIC_KEY = getEnv("API_PUBLIC_KEY");
export const API_PRIVATE_KEY = getEnv("API_PRIVATE_KEY");
export const ORGANIZATION_ID = getEnv("ORGANIZATION_ID");

export const TURNKEY_BASE_URL = "https://api.turnkey.com";

function getEnv(name: string): string {
  return refineNonNull(
    process.env[name],
    `Missing environment variable ${name}`
  );
}
